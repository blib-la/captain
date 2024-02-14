import argparse
import onnxruntime
import PIL.Image
import numpy as np
import csv
import json

from python.caption.utils.image import make_square, smart_resize

def load_model(model_path):
    # Load the model
    session = onnxruntime.InferenceSession(model_path)
    return session

def load_tag_names(tag_file_path):
    # Load tag names from a CSV file and return as a list
    with open(tag_file_path, newline='', encoding='utf-8') as csvfile:
        tag_reader = csv.DictReader(csvfile)
        tag_names = [row['name'] for row in tag_reader]
    return tag_names

def gather_tags_for_image(image_path, model, threshold, tag_names, remove_underscore=False):
    # Load the image
    image = PIL.Image.open(image_path)
    _, height, width, _ = model.get_inputs()[0].shape
    image = image.convert("RGBA")
    new_image = PIL.Image.new("RGBA", image.size, "WHITE")
    new_image.paste(image, mask=image)
    image = new_image.convert("RGB")
    image = np.asarray(image)
    image = image[:, :, ::-1]

    # Resize and preprocess the image
    image = make_square(image, height)
    image = smart_resize(image, height)
    image = image.astype(np.float32)
    image = np.expand_dims(image, 0)

    # Run the model and get the output probabilities
    input_name = model.get_inputs()[0].name
    label_name = model.get_outputs()[0].name
    probs = model.run([label_name], {input_name: image})[0]

    # Select tags based on the threshold
    tags = [tag_names[i] for i, prob in enumerate(probs[0]) if prob > threshold]

    # Remove underscore from tag (optional)
    if remove_underscore:
        tags = [tag.replace("_", " ") for tag in tags] 

    return tags

def process_images(image_paths, model_session, threshold, tag_names, remove_underscore=False):
    # Process each image and gather tags
    result = []
    for image_path in image_paths:
        tags = gather_tags_for_image(image_path, model_session, threshold, tag_names, remove_underscore)
        result.append({'filePath': image_path, 'tags': tags})
    return result

def run_from_args(args):
    model_session = load_model(args.model_path)
    tag_names = load_tag_names(args.tags_path)
    result = process_images(args.image_paths, model_session, args.threshold, tag_names, args.remove_underscore)

    return result

def main():
    parser = argparse.ArgumentParser(description='Generate captions and tags for a list of images.')
    parser.add_argument('--image_paths', metavar='image_paths', type=str, nargs='+', help='Full path to an image file', required=True)
    parser.add_argument('--model_path', metavar='model_path', type=str, help='Full path to the ONNX model file', required=True)
    parser.add_argument('--tags_path', metavar='tags_path', type=str, help='Full path to the CSV file containing tag names', required=True)
    parser.add_argument('--threshold', type=float, default=0.5, help='Threshold for selecting tags')
    parser.add_argument('--remove_underscore', action='store_true', help='Remove underscores from tags')

    args = parser.parse_args()
    result = run_from_args(args)

    # Convert the results to a JSON-formatted string
    print(json.dumps(result))

    return result

if __name__ == "__main__":
    main()
