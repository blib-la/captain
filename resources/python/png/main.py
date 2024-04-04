import argparse
import json
from PIL import Image
from PIL.PngImagePlugin import PngInfo

def add_metadata_to_png(image_path, description, output_path=None):
    """
    Adds or updates the Description metadata of a PNG image.

    :param image_path: Path to the input PNG image.
    :param description: Description to add as metadata.
    :param output_path: Path to save the modified image. If None, overwrite the input image.
    """
    if output_path is None:
        output_path = image_path

    try:
        image = Image.open(image_path)
        metadata = PngInfo()
        metadata.add_text("Description", description)
        image.save(output_path, pnginfo=metadata)
        return {"success": True, "message": "Metadata added successfully."}
    except Exception as e:
        return {"success": False, "message": str(e)}

def main():
    parser = argparse.ArgumentParser(description='Add or update Description metadata in a PNG image.')
    parser.add_argument('--image_path', type=str, help='Path to the input PNG image', required=True)
    parser.add_argument('--description', type=str, help='Description to add as metadata', required=True)
    parser.add_argument('--output_path', type=str, help='Path to save the modified image. Defaults to overwrite the input image.', required=False)

    args = parser.parse_args()

    # Run the metadata addition function
    result = add_metadata_to_png(args.image_path, args.description, args.output_path)

    # Convert the results to a JSON-formatted string and print
    print(json.dumps(result))

if __name__ == "__main__":
    main()
