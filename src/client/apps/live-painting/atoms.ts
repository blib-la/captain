import { atom } from "jotai";

export const livePaintingOptionsAtom = atom({
	brushSize: 5,
	color: "#000000",
});
export const clearCounterAtom = atom(0);
export const imageAtom = atom("");
