```
python -m venv .venv
# Windows
.\.venv\Scripts\activate
# Linux
source .venv/bin/activate
```


# Ubuntu
```bash
sudo apt update
sudo apt install python3-wheel
```



sudo apt-get install google-perftools
export LD_PRELOAD=/lib/x86_64-linux-gnu/libtcmalloc.so.4:$LD_PRELOAD


## Resources

Checked:
* https://huggingface.co/docs/diffusers/main/en/optimization/opt_overview
* https://huggingface.co/docs/diffusers/main/en/tutorials/fast_diffusion
* https://github.com/cumulo-autumn/StreamDiffusion
* artspew
* stable-fast


Still need to try:
* https://huggingface.co/docs/diffusers/main/en/using-diffusers/lcm
* https://huggingface.co/docs/optimum/main/en/onnxruntime/usage_guides/optimization




## CUDA 12.2 / Python 2.1.2

The best performance currently was gained with this setup:

* NVIDIA CUDA 12.2
* Python 3.10
* Torch 2.1.2
* stable-fast 1.0.1

This can be installed using the commands below:


```
apt get update
apt get python3 python-is-python3 python3-pip python3.10-venv
```

pip3 install wheel 
pip3 install torch torchvision torchaudio xformers triton
pip3 install diffusers transformers accelerate peft python-socketio[client]

wget https://github.com/chengzeyi/stable-fast/releases/download/v1.0.1/stable_fast-1.0.1+torch212cu121-cp310-cp310-manylinux2014_x86_64.whl

# Find the proper whl-file for stable_fast and install it
# https://github.com/chengzeyi/stable-fast/releases
# For example if you have Linux (manylinux) with CUDA >= 12.1 (cu121) + Python 3.10 (cp310) + PyTorch 2.1.1 (torch211), then you should use this:
pip3 install stable_fast-1.0.1+torch212cu121-cp310-cp310-manylinux2014_x86_64.whl
```



sudo apt-get install google-perftools
export LD_PRELOAD=/lib/x86_64-linux-gnu/libtcmalloc.so.4:$LD_PRELOAD