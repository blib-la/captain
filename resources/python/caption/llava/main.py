import argparse
import torch
import json
import PIL.Image
from transformers import BitsAndBytesConfig, pipeline

def load_model(model_id, quantization_config):
    pipe = pipeline("image-to-text", model=model_id, model_kwargs={"quantization_config": quantization_config})

    return pipe

def inference(image_path, prompt, pipe, temperature, top_p, length_penalty, repetition_penalty, max_length, min_length, do_sample):
    image = PIL.Image.open(image_path)
    outputs = pipe(images=image, prompt=prompt,
                   generate_kwargs={"temperature": temperature,
                                    "top_p": top_p,
                                    "length_penalty": length_penalty,
                                    "repetition_penalty": repetition_penalty,
                                    "max_length": max_length,
                                    "min_length": min_length,
                                    "do_sample": do_sample})
    generated_text = outputs[0]["generated_text"]
    return generated_text

def extract_tags(generated_text):
    # Extract text after "ASSISTANT:"
    tags_text = generated_text.split("ASSISTANT:")[1].strip()  

    # Split by comma and strip spaces
    tags = [tag.strip() for tag in tags_text.split(',') if tag.strip()]  

     # Clean the tags to remove unwanted characters
    cleaned_tags = clean_tags(tags)

    return cleaned_tags

def clean_tags(tags, unwanted_chars=".#"):
    # Remove unwanted characters from each tag
    cleaned_tags = []
    for tag in tags:
        for char in unwanted_chars:
            tag = tag.replace(char, "")
        cleaned_tags.append(tag.strip())
    return cleaned_tags

def main(args):
    quantization_config = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.float16)
    pipe = load_model(args.model_id, quantization_config)
    prompt = f"USER: <image>\n{args.prompt}\nASSISTANT:"

    results = []
    for image_path in args.image_paths:
        print(f"Processing image: {image_path}")
        generated_text = inference(image_path, prompt, pipe, args.temperature, args.top_p, args.length_penalty, args.repetition_penalty, args.max_length, args.min_length, args.do_sample)
        tags = extract_tags(generated_text)
        results.append({"filePath": image_path, "tags": tags})

    # Convert the results list to a JSON-formatted string
    json_results = json.dumps(results, indent=2)
    print(json_results)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate detailed captions for images using LLaVA model.')
    parser.add_argument('--image_paths', nargs='+', type=str, help='Paths to the input images', required=True)
    parser.add_argument('--model_id', type=str, help='Model ID for the transformer model', default="D:\\dev\\huggingface\\llava-1.5-7b-hf")
    # Describe the image in very intense details as a list of booru tags.
    parser.add_argument('--prompt', type=str, help='Prompt for guiding the caption generation', default="Describe the image in detail as a list of simple booru tags. Don't tell me anything else.")
    parser.add_argument('--max_length', type=int, help='Maximum length of the generated captions', default=200)
    parser.add_argument('--min_length', type=int, help='Minimum length of the generated captions', default=75)
    parser.add_argument('--temperature', type=float, help='Temperature for controlling randomness in generation', default=1.0)
    parser.add_argument('--top_p', type=float, help='Top p for nucleus sampling', default=1.0)
    parser.add_argument('--length_penalty', type=float, help='Length penalty for beam search', default=1.0)
    parser.add_argument('--repetition_penalty', type=float, help='Repetition penalty for discouraging repetition', default=1.2)
    parser.add_argument('--do_sample', action='store_true', help='Enable sampling for generation')

    args = parser.parse_args()
    main(args)
