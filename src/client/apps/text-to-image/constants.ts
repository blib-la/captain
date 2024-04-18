import type { RequiredDownload } from "@captn/utils/types";

export const APP_ID = "text-to-image";
export const allRequiredDownloads: RequiredDownload[] = [
	{
		label: "SDXL",
		id: "stabilityai/sdxl",
		source: "https://pub-aea7c308ba0147b69deba50a606e7743.r2.dev/stabilityai-sd_xl_base_1.0_0.9vae.7z",
		destination: "stable-diffusion/checkpoints",
		unzip: true,
	},
	{
		label: "TAESDXL",
		id: "madebyollin/taesdxl",
		source: "https://pub-aea7c308ba0147b69deba50a606e7743.r2.dev/madebyollin-taesdxl.7z",
		destination: "stable-diffusion/vae",
		unzip: true,
	},
];
