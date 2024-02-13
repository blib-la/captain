import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import type { Dataset } from "../../../main/helpers/types";

export interface Project {
	id: string;
	name: string;
	files: string;
	cover: string;
	source: string;
}

export interface DatasetEntry {
	files: string;
	servedFiles: string;
	image: string;
	imageFile: string;
	servedImageFile: string;
	captionFile: string;
	caption: string;
}

export const datasetsAtom = atom<Dataset[]>([]);
export const projectAtom = atom<Project | false>(false);
export const selectedImageAtom = atom(0);
export const captionOnlyEmptyAtom = atom(true);
export const imagesAtom = atom<DatasetEntry[]>([]);
export const directoryAtom = atom("");
export const modelDownloadNoteAtom = atomWithStorage("modelDownloadNote", true);
export const captionRunningAtom = atomWithStorage("captionRunning", false);
export const checkpointsAtom = atom<string[]>([]);
export const lorasAtom = atom<string[]>([]);
export const captionsAtom = atom<string[]>([]);

export const captioningErrorAtom = atom<string | false>(false);
