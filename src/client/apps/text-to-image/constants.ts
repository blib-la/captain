import type { RequiredDownload } from "@captn/utils/types";

export const APP_ID = "text-to-image";
export const allRequiredDownloads: RequiredDownload[] = [
	{
		label: "SDXL",
		id: "stabilityai/sdxl",
		source: "https://pub-aea7c308ba0147b69deba50a606e7743.r2.dev/stabilityai-sd_xl_base_1.7z",
		destination: "stable-diffusion/checkpoints",
		unzip: true,
	},
];
