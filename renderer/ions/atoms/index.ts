import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import type { Dataset } from "../../../main/helpers/types";

export interface DatasetEntry {
	files: string;
	servedFiles: string;
	image: string;
	imageFile: string;
	servedImageFile: string;
	captionFile: string;
	caption: string;
	selected?: boolean;
}

export const datasetsAtom = atom<Dataset[]>([]);
export const datasetAtom = atom<Dataset | false>(false);
export const selectedImageAtom = atom(0);
export const canSelectImagesAtom = atom(false);
export const editCaptionScopeAtom = atomWithStorage<"all" | "empty" | "selected">(
	"editCaptionScope",
	"empty"
);
export const imagesAtom = atom<DatasetEntry[]>([]);
export const directoryAtom = atom("");
export const captionRunningAtom = atom(false);
export const checkpointsAtom = atom<string[]>([]);
export const lorasAtom = atom<string[]>([]);
export const captionsAtom = atom<string[]>([]);

export const captioningErrorAtom = atom<string | false>(false);
