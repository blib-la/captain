export function createWorkflow({
	prompt = "",
	negativePrompt = "",
	seed = 1234,
	steps = 20,
	cfg = 7,
}: {
	prompt?: string;
	negativePrompt?: string;
	seed?: number;
	steps?: number;
	cfg?: number;
}) {
	return {
		"3": {
			inputs: {
				seed,
				steps,
				cfg,
				sampler_name: "euler",
				scheduler: "normal",
				denoise: 1,
				model: ["4", 0],
				positive: ["6", 0],
				negative: ["7", 0],
				latent_image: ["5", 0],
			},
			class_type: "KSampler",
			_meta: {
				title: "KSampler",
			},
		},
		"4": {
			inputs: {
				ckpt_name:
					"stabilityai\\stable-diffusion-xl-base-1.0\\sd_xl_base_1.0_0.9vae.safetensors",
			},
			class_type: "CheckpointLoaderSimple",
			_meta: {
				title: "Load Checkpoint",
			},
		},
		"5": {
			inputs: {
				width: 1024,
				height: 1024,
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
		"9": {
			inputs: {
				filename_prefix: "images/captain",
				images: ["8", 0],
			},
			class_type: "SaveImage",
			_meta: {
				title: "Save Image",
			},
		},
	};
}
