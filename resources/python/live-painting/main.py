from diffusers import (
    StableDiffusionImg2ImgPipeline,
    AutoencoderTiny,
    EulerAncestralDiscreteScheduler,
)
from diffusers.utils import load_image
import torch
import time
from PIL import Image
import math
import queue
import sys
import json
import threading
import os

from sfast.compilers.diffusion_pipeline_compiler import compile, CompilationConfig

# Initial/default values for parameters
prompt = None
seed = None
strength = None
input_path = "live-canvas-frontend-user-data.png"
output_path = "live-canvas-generate-image-output.png"

# Queue to hold parameters received from stdin
params_queue = queue.Queue()


def read_stdin_loop():
    for line in sys.stdin:
        if line.strip():
            try:
                params_queue.put(json.loads(line))
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON: {e}")


# Start the stdin reading thread
stdin_thread = threading.Thread(target=read_stdin_loop, daemon=True)
stdin_thread.start()


# Torch optimizations
torch.set_grad_enabled(False)
torch.backends.cuda.matmul.allow_tf32 = True
torch.backends.cudnn.allow_tf32 = True


def load_image_with_retry(file_path, max_retries=25, delay=0.003):
    for _ in range(max_retries):
        try:
            image = load_image(file_path).resize((512, 512))
            return image
        except:
            time.sleep(delay)
    raise Exception("Failed to load image after several retries.")


def calculate_min_inference_steps(strength):
    # Calculate the minimal number of inference steps
    return math.ceil(1.0 / strength)


def quantize_unet(m):
    m = torch.quantization.quantize_dynamic(
        m, {torch.nn.Linear}, dtype=torch.qint8, inplace=True
    )
    return m


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

# Quantization
# pipe.unet = quantize_unet(pipe.unet)

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
    global prompt, seed, strength, input_path, output_path

    while True:
        try:
            # Update parameters if new ones are available
            while not params_queue.empty():
                parameters = params_queue.get_nowait()
                prompt = parameters.get("prompt", prompt)
                seed = parameters.get("seed", seed)
                input_path = parameters.get("input_path", input_path)
                strength = parameters.get("strength", strength)
                output_path = parameters.get("output_path", output_path)
                print(f"Updated parameters: {parameters}")
        except queue.Empty:
            pass  # No new parameters, proceed with the existing ones

        # Only generate an image if the prompt is not empty
        if prompt is not None and prompt.strip():
            start_time = time.time()

            torch.manual_seed(seed)

            init_image = load_image_with_retry(input_path)

            strength_ = float(strength)
            denoise_steps_ = calculate_min_inference_steps(strength_)

            image = pipe(
                prompt,
                image=init_image,
                height=512,
                width=512,
                num_inference_steps=denoise_steps_,
                num_images_per_prompt=1,
                strength=strength_,
                guidance_scale=0.0,
            ).images[0]

            end_time = time.time()

            # Save file
            image.save(f"{output_path}.tmp.png")
            time.sleep(0.005)
            os.replace(f"{output_path}.tmp.png", output_path)

            duration = (end_time - start_time) * 1000
            # print(f"{duration:.2f} ms")
            times.append(duration)
        else:
            image = Image.new("RGB", (512, 512), color="white")
            image.save(f"{output_path}.tmp.png")
            os.replace(f"{output_path}.tmp.png", output_path)


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
