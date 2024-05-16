import type { NodeChain } from "@/shared/types/comfyui";

export function createWorkflow({
	prompt = "",
	negativePrompt = "",
	seed = 1234,
	steps = 20,
	height,
	width,
	cfg = 7,
	loraWeight = 1,
	checkpointName = "stabilityai\\stable-diffusion-xl-base-1.0\\sd_xl_base_1.0_0.9vae.safetensors",
	loraName,
}: {
	prompt?: string;
	negativePrompt?: string;
	seed?: number;
	height: number;
	width: number;
	steps?: number;
	cfg?: number;
	checkpointName?: string;
	loraName?: string;
	loraWeight?: number;
}) {
	const hasLora = loraName && loraWeight > 0;
	const finalModel = hasLora ? "lora" : "model";
	const workflow: NodeChain = {
		kSampler: {
			inputs: {
				seed,
				steps,
				cfg,
				sampler_name: "dpmpp_2m_sde_gpu",
				scheduler: "karras",
				denoise: 1,
				model: [finalModel, 0],
				positive: ["prompt", 0],
				negative: ["negativePrompt", 0],
				latent_image: ["latentImage", 0],
			},
			class_type: "KSampler",
		},
		model: {
			inputs: {
				ckpt_name: checkpointName,
			},
			class_type: "CheckpointLoaderSimple",
		},
		latentImage: {
			inputs: {
				width,
				height,
				batch_size: 1,
			},
			class_type: "EmptyLatentImage",
		},
		prompt: {
			inputs: {
				text: prompt,
				clip: [finalModel, 1],
			},
			class_type: "CLIPTextEncode",
		},
		negativePrompt: {
			inputs: {
				text: negativePrompt,
				clip: [finalModel, 1],
			},
			class_type: "CLIPTextEncode",
		},
		vaeDecode: {
			inputs: {
				samples: ["kSampler", 0],
				vae: ["model", 2],
			},
			class_type: "VAEDecode",
		},
		output: {
			inputs: {
				filename_prefix: "images/captain",
				images: ["vaeDecode", 0],
			},
			class_type: "PreviewImage",
		},
	};
	if (hasLora) {
		workflow.lora = {
			inputs: {
				lora_name: loraName,
				strength_model: loraWeight,
				strength_clip: loraWeight,
				model: ["model", 0],
				clip: ["model", 1],
			},
			class_type: "LoraLoader",
		};
	}

	return workflow;
}
