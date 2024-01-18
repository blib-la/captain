from concurrent.futures import ThreadPoolExecutor
import cv2
import glob
import os
import numpy as np

def get_closest_sizes(image_shape, sizes):
    target_aspect_ratio = image_shape[1] / image_shape[0]
    sizes.sort(key=lambda size: abs((size[0] / size[1]) - target_aspect_ratio))
    return sizes[0]

def get_most_central_face(faces, image_shape):
    image_center_x = image_shape[1] // 2
    image_center_y = image_shape[0] // 2

    min_distance = float('inf')
    most_central_face = None

    for (x, y, w, h) in faces:
        face_center_x = x + w // 2
        face_center_y = y + h // 2

        distance = (face_center_x - image_center_x)**2 + (face_center_y - image_center_y)**2
        if distance < min_distance:
            min_distance = distance
            most_central_face = (x, y, w, h)

    return most_central_face


def get_most_top_face(faces, image_shape):
    if faces.shape[0] == 0:
        return None

    # Sort faces based on the y-coordinate of the top-left corner
    sorted_faces = faces[faces[:, 1].argsort()]

    # The face with the smallest y-coordinate is the most top face
    most_top_face = sorted_faces[0]

    return most_top_face

# Crop and potentially upscale the image to match the desired size
def crop_to_face(image_path_tuple):
    try:
        # Unpacking the tuple
        idx, input_image_path, output_sizes, outputDirectory = image_path_tuple

        # Debugging: Print index and path of the image being processed
        # print(f"Processing index {idx}, path {input_image_path}")

        # Reading the image
        image = cv2.imread(input_image_path)

        if image is None:
            print(f"Could not read {input_image_path}. Skipping.")
            return

        # Converting to gray scale
        gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Detecting faces
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(
            gray_image,
            scaleFactor=1.1,
            minNeighbors=10,
            minSize=(100, 100),
            flags=cv2.CASCADE_SCALE_IMAGE
        )

        if len(faces) > 0:
            x, y, w, h = get_most_top_face(faces, image.shape)
            face_center_x = x + w // 2
            face_center_y = y + h // 2
        else:
            face_center_x = image.shape[1] // 2
            face_center_y = 0

        best_output_size = get_closest_sizes(image.shape, output_sizes)
        target_w, target_h = best_output_size

        original_w, original_h = image.shape[1], image.shape[0]
        original_aspect = original_w / original_h

        target_aspect = target_w / target_h

        # Determine the constraining dimension
        if original_aspect > target_aspect:
            # Height is the constraining dimension
            new_h = target_h
            new_w = int(target_h * original_aspect)
        else:
            # Width is the constraining dimension
            new_w = target_w
            new_h = int(target_w / original_aspect)

        # Resize the image
        scaled_image = cv2.resize(image, (new_w, new_h))

        # Crop the overlap
        left = max(0, (new_w - target_w) // 2)
        top = max(0, (new_h - target_h) // 2)
        right = min(new_w, left + target_w)
        bottom = min(new_h, top + target_h)

        cropped_image = scaled_image[top:bottom, left:right]

        # Save the image
        output_image_path = os.path.join(outputDirectory, f"image-{idx+1:05d}.png")
        cv2.imwrite(output_image_path, cropped_image)
        # print(f"Saved to {output_image_path}")  # Print the path where the image was saved

    except Exception as e:
        print(f"An exception occurred: {e}")


if __name__ == "__main__":
    inputDirectory = "in"
    outputDirectory = "out"
    output_sizes = [
        [640, 1536],
        [786, 1344],
        [832, 1216],
        [896, 1152],
        [1024, 1024],
        [1152, 896],
        [1216, 832],
        [1344, 786],
        [1536, 640]
    ]
    max_workers = 24

    if not os.path.exists(outputDirectory):
        os.makedirs(outputDirectory)

    image_paths = glob.glob(f"{inputDirectory}/*.jpg")
    image_paths = image_paths[:1900]  # Limit image count
    image_path_tuples = [(idx, image_path, output_sizes, outputDirectory) for idx, image_path in enumerate(image_paths)]

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        executor.map(crop_to_face, image_path_tuples)
