import { useAtom } from "jotai/index";
import { useCallback, useEffect } from "react";

import { imagesAtom, selectedImageAtom } from "@/ions/atoms";
import { useColumns } from "@/ions/hooks/columns";

export function useKeyboardControlledImagesNavigation({
	onBeforeChange,
}: {
	onBeforeChange(): Promise<void> | void;
}) {
	const [images] = useAtom(imagesAtom);
	const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
	const columnCount = useColumns({ xs: 2, sm: 3, md: 4, lg: 6 });
	const { length: imagesLength } = images;
	const goRowUp = useCallback(() => {
		if (selectedImage > columnCount - 1) {
			setSelectedImage(selectedImage - columnCount);
		} else {
			setSelectedImage(imagesLength - 1);
		}
	}, [selectedImage, columnCount, setSelectedImage, imagesLength]);

	const goRowDown = useCallback(() => {
		if (selectedImage < imagesLength - columnCount) {
			setSelectedImage(selectedImage + columnCount);
		} else {
			setSelectedImage(0);
		}
	}, [selectedImage, imagesLength, columnCount, setSelectedImage]);

	const goToPrevious = useCallback(() => {
		if (selectedImage > 0) {
			setSelectedImage(selectedImage - 1);
		} else {
			setSelectedImage(imagesLength - 1);
		}
	}, [selectedImage, setSelectedImage, imagesLength]);

	const goToNext = useCallback(() => {
		if (selectedImage < imagesLength - 1) {
			setSelectedImage(selectedImage + 1);
		} else {
			setSelectedImage(0);
		}
	}, [selectedImage, imagesLength, setSelectedImage]);

	useEffect(() => {
		async function handleKeyDown(event: KeyboardEvent) {
			if (event.altKey) {
				switch (event.key) {
					case "ArrowLeft": {
						await onBeforeChange();
						goToPrevious();
						break;
					}

					case "ArrowRight": {
						await onBeforeChange();
						goToNext();
						break;
					}

					case "ArrowUp": {
						await onBeforeChange();
						goRowUp();
						break;
					}

					case "ArrowDown": {
						await onBeforeChange();
						goRowDown();
						break;
					}

					default: {
						break;
					}
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [goToPrevious, goToNext, goRowUp, columnCount, onBeforeChange, goRowDown]);
}
