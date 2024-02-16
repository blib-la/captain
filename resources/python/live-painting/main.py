from diffusers import (
    StableDiffusionImg2ImgPipeline,
    AutoencoderTiny,
    EulerAncestralDiscreteScheduler,
)
import torch
import time
from PIL import Image
import queue
import sys
import json
import threading
import os
import time
import math
import torch
from diffusers.utils import load_image
from sfast.compilers.diffusion_pipeline_compiler import compile, CompilationConfig


def read_stdin_loop():
    for line in sys.stdin:
        if line.strip():
            try:
                params_queue.put(json.loads(line))
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON: {e}")


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


def calculate_min_inference_steps(strength):
    # Calculate the minimal number of inference steps
    return math.ceil(1.0 / strength)


# Initial/default values for parameters
prompt = None
seed = None
strength = None
guidance_scale = None
num_inference_steps = None
input_path = "live-canvas-frontend-user-data.png"
output_path = "live-canvas-generate-image-output.png"

# Queue to hold parameters received from stdin
params_queue = queue.Queue()

# Start the stdin reading thread
stdin_thread = threading.Thread(target=read_stdin_loop, daemon=True)
stdin_thread.start()


# Torch optimizations
torch.set_grad_enabled(False)
torch.backends.cuda.matmul.allow_tf32 = True
torch.backends.cudnn.allow_tf32 = True


pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
    "stabilityai/sd-turbo",
    torch_dtype=torch.float16,
    variant="fp16",
    safety_checker=None,
    requires_safety_checker=False,
)

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

pipe.width = 512
pipe.height = 512

pipe.vae = AutoencoderTiny.from_pretrained("madebyollin/taesd").to(
    device=pipe.device, dtype=pipe.dtype
)

# Channels-last memory format
# see https://huggingface.co/docs/diffusers/optimization/memory#channelslast-memory-format
pipe.unet.to(memory_format=torch.channels_last)
pipe.vae.to(memory_format=torch.channels_last)

# Disable inference progress bar
pipe.set_progress_bar_config(leave=False)
pipe.set_progress_bar_config(disable=True)

pipe = compile(pipe, config)

# Warmup
print("warmup started")
for _ in range(10):
    init_image = load_image_with_retry(input_path)
    output_image = pipe(
        prompt="the moon, 4k",
        image=init_image,
        height=512,
        width=512,
        num_inference_steps=1,
        num_images_per_prompt=1,
        strength=1.0,
        guidance_scale=0.0,
    ).images[0]
print("warmup done")


def main():
    global prompt, seed, strength, guidance_scale, input_path, output_path, num_inference_steps

    while True:
        try:
            # Update parameters if new ones are available
            while not params_queue.empty():
                parameters = params_queue.get_nowait()
                prompt = parameters.get("prompt", prompt)
                seed = parameters.get("seed", seed)
                input_path = parameters.get("input_path", input_path)
                strength = parameters.get("strength", strength)
                guidance_scale = parameters.get("guidance_scale", guidance_scale)
                num_inference_steps = parameters.get("num_inference_steps", num_inference_steps)
                output_path = parameters.get("output_path", output_path)
                print(f"Updated parameters {parameters}")
        except queue.Empty:
            pass  # No new parameters, proceed with the existing ones

        # Only generate an image if the prompt is not empty
        if prompt is not None and prompt.strip():
            start_time = time.time()

            torch.manual_seed(seed)

            init_image = load_image_with_retry(input_path)

            # Image couldn't be loaded, skip this iteration
            if init_image is None:
                continue

            strength_ = float(strength)
            guidance_scale_ = float(guidance_scale)
            num_inference_steps_ = int(num_inference_steps)

            image = pipe(
                prompt,
                image=init_image,
                height=512,
                width=512,
                num_inference_steps=num_inference_steps_,
                num_images_per_prompt=1,
                strength=strength_,
                guidance_scale=guidance_scale_,
            ).images[0]

            end_time = time.time()

            # Save file
            image.save(f"{output_path}.tmp.png")
            safe_rename_with_retries(f"{output_path}.tmp.png", output_path)

            duration = (end_time - start_time) * 1000
            # print(f"{duration:.2f} ms")
            times.append(duration)
        else:
            image = Image.new("RGB", (512, 512), color="white")
            image.save(f"{output_path}.tmp.png")
            safe_rename_with_retries(f"{output_path}.tmp.png", output_path)


if __name__ == "__main__":
    times = []

    try:
        print("started loop")
        main()
    except Exception as error:
        print(error)
    except:
        if times:
            total_time = sum(times)
            average_time = total_time / len(times)
            print(
                f"Total time: {total_time:.2f} ms, Total executions: {len(times)}, Average time: {average_time:.2f} ms"
            )
        else:
            print(f"No operations were performed or exception")
