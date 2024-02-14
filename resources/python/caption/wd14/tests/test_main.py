import io
import unittest
import os
from unittest.mock import patch

from python.caption.wd14.main import main

image_1_path = os.path.abspath("caption\\wd14\\tests\\test_image1.jpg")
image_2_path = os.path.abspath("caption\\wd14\\tests\\test_image2.png")
model_path = os.path.abspath("caption\\wd14\\tests\\model.onnx")
tags_path = os.path.abspath("caption\\wd14\\tests\\selected_tags.csv")

class TestGenerateCaptions(unittest.TestCase):
    @patch(
        "sys.argv", ["main.py", "--image_paths", image_1_path, image_2_path, "--model_path", model_path, "--tags_path", tags_path]
    )
    def test_main_with_args(self):
        results = main()

        # List with 2 images
        self.assertEqual(len(results), 2)

        # Check if "general" is one of the tags in the first list of tags
        self.assertIn("general", results[0]['tags'])

        # Check if "simple_background" is one of the tags in the first list of tags with an underscore
        self.assertIn("simple_background", results[0]['tags'])

    @patch(
        "sys.argv", ["main.py", "--image_paths", image_1_path, image_2_path, "--model_path", model_path, "--tags_path", tags_path, "--remove_underscore"]
    )
    def test_main_with_args_remove_underscore(self):
        results = main()

        # List with 2 images
        self.assertEqual(len(results), 2)

        # Check if "simple_background" is one of the tags in the first list of tags without an underscore
        self.assertIn("simple background", results[0]['tags'])


if __name__ == "__main__":
    unittest.main()
