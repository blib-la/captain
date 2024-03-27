import type { RequiredDownload } from "@captn/utils/types";

export const APP_ID = "live-painting";
export const allRequiredDownloads: RequiredDownload[] = [
	{
		label: "SD Turbo",
		id: "stabilityai/sd-turbo/fp16",
		source: "https://pub-aea7c308ba0147b69deba50a606e7743.r2.dev/stabilityai-sd-turbo-fp16.7z",
		destination: "stable-diffusion/checkpoints",
		unzip: true,
	},
	{
		label: "Taesd",
		id: "madebyollin/taesd",
		source: "https://pub-aea7c308ba0147b69deba50a606e7743.r2.dev/taesd.7z",
		destination: "stable-diffusion/vae",
		unzip: true,
	},
];
