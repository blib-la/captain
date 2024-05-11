import type { RequiredDownload } from "@captn/utils/types";

export const APP_ID = "live-painting";

export const MAX_QUEUE_LENGTH = 1;
export const FRAMES_PER_SECOND = 60;

//
// export const allRequiredDownloads: RequiredDownload[] = [
// 	{
// 		label: "SDXL Turbo",
// 		id: "stabilityai/sdxl-turbo",
// 		source: "https://huggingface.co/stabilityai/sdxl-turbo/resolve/main/sd_xl_turbo_1.0_fp16.safetensors?download=true",
// 		destination: "stable-diffusion/checkpoints",
// 		unzip: false,
// 	},
// ];

export const allRequiredDownloads: RequiredDownload[] = [
	{
		label: "SD Turbo",
		id: "stabilityai/sd-turbo",
		source: "https://huggingface.co/Blib-la/sd-turbo-fp16/resolve/main/sd-turbo-fp16-emaoonly.safetensors?download=true",
		destination: "stable-diffusion/checkpoints",
		unzip: false,
	},
];
