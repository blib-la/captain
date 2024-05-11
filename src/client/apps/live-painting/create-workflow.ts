export function createWorkflow({
	prompt = "",
	negativePrompt = "",
	seed = 1234,
	steps = 1,
	cfg = 1,
	checkpointName = "stabilityai\\sdxl-turbo\\sd_xl_turbo_1.0_fp16.safetensors",
}: {
	prompt?: string;
	negativePrompt?: string;
	seed?: number;
	steps?: number;
	cfg?: number;
	checkpointName?: string;
}) {
	return {
		"3": {
			inputs: {
				seed,
				steps,
				cfg,
				sampler_name: "euler",
				scheduler: "normal",
				denoise: 0.9,
				model: ["4", 0],
				positive: ["6", 0],
				negative: ["7", 0],
				latent_image: ["12", 0],
			},
			class_type: "KSampler",
			_meta: {
				title: "KSampler",
			},
		},
		"4": {
			inputs: {
				ckpt_name: checkpointName,
			},
			class_type: "CheckpointLoaderSimple",
			_meta: {
				title: "Load Checkpoint",
			},
		},
		"5": {
			inputs: {
				width: 512,
				height: 512,
				batch_size: 1,
			},
			class_type: "EmptyLatentImage",
			_meta: {
				title: "Empty Latent Image",
			},
		},
		"6": {
			inputs: {
				text: prompt,
				clip: ["4", 1],
			},
			class_type: "CLIPTextEncode",
			_meta: {
				title: "CLIP Text Encode (Prompt)",
			},
		},
		"7": {
			inputs: {
				text: negativePrompt,
				clip: ["4", 1],
			},
			class_type: "CLIPTextEncode",
			_meta: {
				title: "CLIP Text Encode (Prompt)",
			},
		},
		"8": {
			inputs: {
				samples: ["3", 0],
				vae: ["4", 2],
			},
			class_type: "VAEDecode",
			_meta: {
				title: "VAE Decode",
			},
		},
		"10": {
			inputs: {
				images: ["8", 0],
			},
			class_type: "PreviewImage",
			_meta: {
				title: "Preview Image",
			},
		},
		"11": {
			inputs: {
				image: "live-painting.png",
				upload: "image",
			},
			class_type: "LoadImage",
			_meta: {
				title: "Load Image",
			},
		},
		"12": {
			inputs: {
				pixels: ["11", 0],
				vae: ["4", 2],
			},
			class_type: "VAEEncode",
			_meta: {
				title: "VAE Encode",
			},
		},
	};
}
