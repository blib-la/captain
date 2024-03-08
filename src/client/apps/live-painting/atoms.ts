import { atom } from "jotai";

import type { ImageItem } from "#/types";

export const livePaintingOptionsAtom = atom({
	brushSize: 5,
	color: "#000000",
});
export const clearCounterAtom = atom(0);
export const imageAtom = atom("");
export const imagesAtom = atom<ImageItem[]>([]);
export const storyImagesAtom = atom<ImageItem[]>([]);
