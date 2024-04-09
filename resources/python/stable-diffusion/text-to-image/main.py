import io
import json
import sys

from contextlib import contextmanager

print(json.dumps({"status": "starting"}))

@contextmanager
def suppress_print(debug=False):
    # Hide messages printed to stdout / stderr

    if not debug:
        original_stdout = sys.stdout
        original_stderr = sys.stderr
        sys.stdout = io.StringIO()
        sys.stderr = io.StringIO()

        try:
            yield
        finally:
            sys.stdout = original_stdout
            sys.stderr = original_stderr
    else:
        yield


# Get rid of message, that Triton is not available
with suppress_print():
    from diffusers import (
        StableDiffusionPipeline,
        StableDiffusionXLPipeline,
        AutoencoderTiny,
        EulerAncestralDiscreteScheduler,
    )

import argparse
import math
import os
import queue
import threading
import time
import torch

from collections import OrderedDict
from diffusers.utils import load_image
from PIL import Image
from sfast.compilers.diffusion_pipeline_compiler import compile, CompilationConfig


# Torch optimizations
torch.set_grad_enabled(False)
torch.backends.cuda.matmul.allow_tf32 = True
torch.backends.cudnn.allow_tf32 = True

IMG2IMG_PIPELINES_MAPPING = OrderedDict([
    ("stable-diffusion", StableDiffusionPipeline),
    ("stable-diffusion-xl", StableDiffusionXLPipeline),
])

def get_pipeline(model_path, model_type):
    # Determine the pipeline class based on the model_type
    print(f">>>>>>>>> Using model {model_path} as type {model_type}.")

    PipelineClass = IMG2IMG_PIPELINES_MAPPING.get(model_type)
    if not PipelineClass:
        raise ValueError(f"Unsupported model type: {model_type}")

    # Determine the loading method based on the model_path
    if model_path.endswith(".safetensors"):
        print("------ received safetensors")
        pipeline = PipelineClass.from_single_file(
            model_path,
            torch_dtype=torch.float16,
        )
    else:
        print("------ received pretrained")
        pipeline = PipelineClass.from_pretrained(
            model_path,
            torch_dtype=torch.float16,
            variant="fp16",
            safety_checker=None,
            requires_safety_checker=False,
        )

    return pipeline



def parse_args():
    parser = argparse.ArgumentParser(description="Control model and paths via CLI.")
    parser.add_argument(
        "--model_path",
        type=str,
        help="Path to the model directory or identifier.",
        required=True,
    )
    parser.add_argument(
        "--vae_path",
        type=str,
        help="Path to the vae directory or identifier.",
        required=True,
    )
    parser.add_argument(
            "--model_type",
            type=str,
            help="Type of model to use for diffusion.",
            required=True,
        )
    parser.add_argument(
        "--output_image_path",
        type=str,
        default="live-canvas-generate-image-output.png",
        help="Path for the output image file.",
    )
    parser.add_argument(
        "--disable_stablefast",
        action="store_true",
        help="Disable the stablefast compilation for faster loading during development.",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug output.",
    )

    args = parser.parse_args()
    return args


def read_stdin_loop(params_queue, shutdown_event):
    for line in sys.stdin:
        if line.strip():
            try:
                data = json.loads(line)

                if data.get("command") == "shutdown":
                    shutdown_event.set()
                    break
                else:
                    params_queue.put(data)
            except json.JSONDecodeError as e:
                print(
                    json.dumps(
                        {"status": "error", "message": f"Error decoding JSON: {e}"}
                    )
                )


def safe_rename_with_retries(src, dst, max_retries=5, delay=0.005):
    """
    Attempts to rename a file from `src` to `dst` with retries.

    Parameters:
    - src: The source file path.
    - dst: The destination file path.
    - max_retries: Maximum number of retries if the rename operation fails.
    - delay: Delay between retries in seconds.

    If all retries are exhausted, it logs an error message but does not raise an exception.
    """
    for attempt in range(max_retries):
        try:
            os.replace(src, dst)
            break
        except OSError as e:
            if attempt < max_retries - 1:
                time.sleep(delay)
            else:
                print(
                    f"Failed to rename {src} to {dst} after {max_retries} attempts. Error: {e}"
                )


def load_image_with_retry(file_path, max_retries=25, delay=0.003):
    for _ in range(max_retries):
        try:
            image = load_image(file_path).resize((512, 512))
            return image
        except:
            time.sleep(delay)
    print(f"Failed to load image {file_path} after {max_retries} retries.")
    return None


def prepare_pipeline(model_path, model_type, vae_path, disable_stablefast=False):
    print(f"+++++++ Using model {model_path} as type {model_type}.")
    pipe = get_pipeline(model_path, model_type)

    pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(pipe.scheduler.config)
    pipe.safety_checker = None
    pipe.to(torch.device("cuda"))

    # Load the stable-fast default config
    config = CompilationConfig.Default()

    # Whether to preserve parameters when freezing the model.
    # If True, parameters will be preserved, but the model will be a bit slower.
    # If False, parameters will be marked as constants, and the model will be faster.
    config.preserve_parameters = False

    # xformers and Triton are suggested for achieving best performance.
    try:
        import xformers

        config.enable_xformers = True
    except ImportError:
        print("xformers not installed, skip")
    try:
        import triton

        config.enable_triton = True
    except ImportError:
        print("Triton not installed, skip")

    # CUDA Graph is suggested for small batch sizes and small resolutions to reduce CPU overhead.
    # But it can increase the amount of GPU memory used.
    config.enable_cuda_graph = True

    pipe.width = 1024
    pipe.height = 1024

    # pipe.vae = AutoencoderTiny.from_pretrained(vae_path).to(
    #     device=pipe.device, dtype=pipe.dtype
    # )

    # Channels-last memory format
    # see https://huggingface.co/docs/diffusers/optimization/memory#channelslast-memory-format
    pipe.unet.to(memory_format=torch.channels_last)
    # pipe.vae.to(memory_format=torch.channels_last)

    # Disable inference progress bar
    pipe.set_progress_bar_config(leave=False)
    pipe.set_progress_bar_config(disable=True)

    # Disable stable fast for faster startup of the script, but slower inference
    if not disable_stablefast:
        pipe = compile(pipe, config)

    return pipe


def warmup(pipe):
    # Warmup
    for _ in range(6):
        pipe(
            prompt="the moon, 4k",
            negative_prompt="nsfw, nude",
            height=1024,
            width=1024,
            num_inference_steps=1,
            num_images_per_prompt=1,
            strength=1.0,
            guidance_scale=0.0,
        ).images[0]


def main(pipe, output_image_path, shutdown_event):
    # Initial/default values for parameters
    prompt = "a captain with white beard, teal hat and uniform"
    negative_prompt = "nsfw, nude"
    seed = 1
    steps = 20
    guidance_scale = 7.0
    height = 1024
    width = 1024

    last_prompt = prompt
    last_negative_prompt = negative_prompt
    last_seed = seed
    last_steps = steps
    last_guidance_scale = guidance_scale
    last_height = height
    last_width = width

    # Queue to hold parameters received from stdin
    params_queue = queue.Queue()

    # Read from stdin
    stdin_thread = threading.Thread(
        target=read_stdin_loop, args=(params_queue, shutdown_event), daemon=True
    )
    stdin_thread.start()

    while not shutdown_event.is_set():
        try:
            # Update parameters if new ones are available
            while not params_queue.empty():
                parameters = params_queue.get_nowait()
                prompt = parameters.get("prompt", prompt)
                negative_prompt = parameters.get("negative_prompt", negative_prompt)
                seed = parameters.get("seed", seed)
                steps = parameters.get("steps", steps)
                guidance_scale = parameters.get("guidance_scale", guidance_scale)
                height = parameters.get("height", height)
                width = parameters.get("width", width)
                print(f"Updated parameters {parameters}")
        except queue.Empty:
            pass  # No new parameters, proceed with the existing ones


        # Determine if image generation should be triggered
        trigger_generation = (
            prompt != last_prompt
            or negative_prompt != last_negative_prompt
            or seed != last_seed
            or steps != last_steps
            or guidance_scale != last_guidance_scale
            or height != last_height
            or width != last_width
        )

        if trigger_generation:
            last_prompt = prompt
            last_negative_prompt = negative_prompt
            last_seed = seed
            last_steps = steps
            last_guidance_scale = guidance_scale
            last_height = height
            last_width = width

            # Only generate an image if the prompt is not empty
            if prompt is not None and prompt.strip():
                torch.manual_seed(seed)

                guidance_scale_ = float(guidance_scale)

                image = pipe(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    height=height,
                    width=width,
                    num_inference_steps=steps,
                    num_images_per_prompt=1,
                    strength=1.0,
                    guidance_scale=guidance_scale_,
                ).images[0]

                # Save file
                image.save(f"{output_image_path}.tmp.png")
                safe_rename_with_retries(
                    f"{output_image_path}.tmp.png", output_image_path
                )

                print(json.dumps({"status": "image_generated"}))

            else:
                image = Image.new("RGB", (1024, 1024), color="white")
                image.save(f"{output_image_path}.tmp.png")
                safe_rename_with_retries(
                    f"{output_image_path}.tmp.png", output_image_path
                )


if __name__ == "__main__":
    # Used for gracefully shutting down the script
    shutdown_event = threading.Event()

    try:
        args = parse_args()
        pipe = None

        print("Setting up pipeline for text-to-image")
        with suppress_print(args.debug):
            pipe = prepare_pipeline(
                args.model_path, args.model_type, args.vae_path, args.disable_stablefast
            )
            print("Starting warmup for text-to-image")
            warmup(pipe)

        print(json.dumps({"status": "started"}))

        main(pipe, args.output_image_path, shutdown_event)

        print(json.dumps({"status": "shutdown"}))

    except Exception as error:
        print(json.dumps({"status": "error", "message": str(error)}))
    except:
        print(json.dumps({"status": "stopped"}))
