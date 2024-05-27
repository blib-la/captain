import argparse
import json
from PIL import Image
from PIL.PngImagePlugin import PngInfo

def add_metadata_to_png(image_path, positive_prompt=None, negative_prompt=None, caption=None, description=None, tags=None, prompt=None, output_path=None):
    """
    Adds or updates the Description metadata of a PNG image.

    :param image_path: Path to the input PNG image.
    :param positive_prompt: Prompt to add as metadata.
    :param negative_prompt: Negative prompt to add as metadata.
    :param caption: Caption to add as metadata.
    :param description: Description to add as metadata.
    :param tags: Tags to add as metadata.
    :param prompt: Workflow to add as metadata.
    :param output_path: Path to save the modified image. If None, overwrite the input image.
    :return: A dictionary indicating success or failure of the operation.
    """
    if output_path is None:
        output_path = image_path

    try:
        image = Image.open(image_path)
        existing_metadata = image.info  # Get existing metadata
        new_metadata = PngInfo()

        # Function to merge metadata
        def merge_metadata(key, new_value):
            if key in existing_metadata:
                return f"{existing_metadata[key]}; {new_value}" if new_value else existing_metadata[key]
            else:
                return new_value

        # Merge metadata
        if positive_prompt is not None:
            new_metadata.add_text("positive_prompt", merge_metadata("positive_prompt", positive_prompt))
        if negative_prompt is not None:
            new_metadata.add_text("negative_prompt", merge_metadata("negative_prompt", negative_prompt))
        if caption is not None:
            new_metadata.add_text("caption", merge_metadata("caption", caption))
        if description is not None:
            new_metadata.add_text("description", merge_metadata("description", description))
        if tags is not None:
            new_metadata.add_text("tags", merge_metadata("tags", tags))
        if prompt is not None:
            new_metadata.add_text("prompt", merge_metadata("prompt", prompt))

        # Save the image with updated metadata
        image.save(output_path, pnginfo=new_metadata)

        return {"success": True, "message": "Metadata added successfully."}

    except Exception as e:
        return {"success": False, "message": str(e)}

def main():
    parser = argparse.ArgumentParser(description='Add or update metadata in a PNG image.')
    parser.add_argument('--image_path', type=str, help='Path to the input PNG image', required=True)
    parser.add_argument('--positive_prompt', type=str, help='Prompt to add as metadata', required=False)
    parser.add_argument('--negative_prompt', type=str, help='Negative prompt to add as metadata', required=False)
    parser.add_argument('--caption', type=str, help='Caption to add as metadata', required=False)
    parser.add_argument('--description', type=str, help='Description to add as metadata', required=False)
    parser.add_argument('--tags', type=str, help='Tags to add as metadata', required=False)
    parser.add_argument('--prompt', type=str, help='Workflow to add as metadata', required=False)
    parser.add_argument('--output_path', type=str, help='Path to save the modified image. Defaults to overwrite the input image.', required=False)

    args = parser.parse_args()

    # Run the metadata addition function
    result = add_metadata_to_png(
        image_path=args.image_path,
        positive_prompt=args.positive_prompt,
        negative_prompt=args.negative_prompt,
        caption=args.caption,
        description=args.description,
        tags=args.tags,
        prompt=args.prompt,
        output_path=args.output_path
    )

    # Convert the results to a JSON-formatted string and print
    print(json.dumps(result))

if __name__ == "__main__":
    main()
