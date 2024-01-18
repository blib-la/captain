FROM python:3.10

RUN pip install --upgrade pip
RUN pip install numpy==1.25.2 \
    torch==2.0.1+cu118 torchvision==0.15.2+cu118 --extra-index-url https://download.pytorch.org/whl/cu118
