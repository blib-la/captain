import type { RequiredDownload } from "@captn/utils/types";

export interface Images {
	thumbnail: string;
}

export interface Payload {
	images: Images;
	type: string;
	label: string;
	description: string;
	author: string;
	link: string;
	license: string;
	architecture: string;
	sources: RequiredDownload[];
}

export interface Entry {
	payload: Payload;
	id: string;
}

export interface StableDiffusion {
	checkpoint: { [key: string]: Entry };
	vae: { [key: string]: Entry };
}

export interface Marketplace {
	"stable-diffusion": StableDiffusion;
}
