import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { APP_ID } from "./constants";

export const livePaintingOptionsAtom = atom({
	brushSize: 5,
	color: "#000000",
});
export const clearCounterAtom = atom(0);
export const imageAtom = atom("");
export const selectedCheckpointAtom = atomWithStorage(`${APP_ID}_selectedCheckpoint`, "");
