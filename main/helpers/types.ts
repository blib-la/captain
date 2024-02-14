export interface Dataset {
	id: string;
	name: string;
	files: string;
	servedFiles: string;
	cover: string;
	source: string;
}

export interface Dimensions {
	width: number;
	height: number;
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
