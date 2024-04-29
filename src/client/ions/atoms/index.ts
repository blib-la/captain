import { atom } from "jotai";

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
	selected?: boolean;
}

export const selectedImageAtom = atom(0);

export const imagesAtom = atom<DatasetEntry[]>([]);

export const requiresRestartAtom = atom(false);
