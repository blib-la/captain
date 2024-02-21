import { useAtom } from "jotai";
import { useCallback, useEffect } from "react";

import { imagesAtom, selectedImageAtom } from "@/ions/atoms";
import { useColumns } from "@/ions/hooks/columns";

export function useKeyboardControlledImagesNavigation({
	onBeforeChange,
}: {
	onBeforeChange(): Promise<void> | void;
}) {
	const [images] = useAtom(imagesAtom);
	const [, setSelectedImage] = useAtom(selectedImageAtom);
	const columnCount = useColumns({ xs: 2, sm: 3, md: 4, lg: 6 });
	const { length: imagesLength } = images;
	const goRowUp = useCallback(() => {
		setSelectedImage(previousState =>
			previousState > columnCount - 1 ? previousState - columnCount : imagesLength - 1
		);
	}, [columnCount, setSelectedImage, imagesLength]);

	const goRowDown = useCallback(() => {
		setSelectedImage(previousState =>
			previousState < imagesLength - columnCount ? previousState + columnCount : 0
		);
	}, [imagesLength, columnCount, setSelectedImage]);

	const goToPrevious = useCallback(() => {
		setSelectedImage(previousState =>
			previousState > 0 ? previousState - 1 : imagesLength - 1
		);
	}, [setSelectedImage, imagesLength]);

	const goToNext = useCallback(() => {
		setSelectedImage(previousState =>
			previousState < imagesLength - 1 ? previousState + 1 : 0
		);
	}, [imagesLength, setSelectedImage]);

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
