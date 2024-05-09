export function createWorkflow({
	prompt = "",
	negativePrompt = "",
	seed = 1234,
	steps = 20,
	cfg = 7,
	checkpointName = "stabilityai\\stable-diffusion-xl-base-1.0\\sd_xl_base_1.0_0.9vae.safetensors",
}: {
	prompt?: string;
	negativePrompt?: string;
	seed?: number;
	steps?: number;
	cfg?: number;
	checkpointName?: string;
}) {
	return {
		kSampler: {
			inputs: {
				seed,
				steps,
				cfg,
				sampler_name: "euler",
				scheduler: "normal",
				denoise: 1,
				model: ["model", 0],
				positive: ["prompt", 0],
				negative: ["negativePrompt", 0],
				latent_image: ["latentImage", 0],
			},
			class_type: "KSampler",
			_meta: {
				title: "KSampler",
			},
		},
		model: {
			inputs: {
				ckpt_name: checkpointName,
			},
			class_type: "CheckpointLoaderSimple",
			_meta: {
				title: "Load Checkpoint",
			},
		},
		latentImage: {
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
		prompt: {
			inputs: {
				text: prompt,
				clip: ["model", 1],
			},
			class_type: "CLIPTextEncode",
			_meta: {
				title: "CLIP Text Encode (Prompt)",
			},
		},
		negativePrompt: {
			inputs: {
				text: negativePrompt,
				clip: ["model", 1],
			},
			class_type: "CLIPTextEncode",
			_meta: {
				title: "CLIP Text Encode (Prompt)",
			},
		},
		vaeDecode: {
			inputs: {
				samples: ["kSampler", 0],
				vae: ["model", 2],
			},
			class_type: "VAEDecode",
			_meta: {
				title: "VAE Decode",
			},
		},
		output: {
			inputs: {
				filename_prefix: "images/captain",
				images: ["vaeDecode", 0],
			},
			class_type: "PreviewImage",
			_meta: {
				title: "Preview Image",
			},
		},
	};
}
