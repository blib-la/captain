import type { RequiredDownload } from "@captn/utils/types";

export const APP_ID = "live-painting";

export const allRequiredDownloads: RequiredDownload[] = [
	{
		label: "SDXL Turbo",
		id: "stabilityai/sdxl-turbo",
		source: "https://huggingface.co/stabilityai/sdxl-turbo/resolve/main/sd_xl_turbo_1.0_fp16.safetensors?download=true",
		destination: "stable-diffusion/checkpoints",
		unzip: false,
	},
];
