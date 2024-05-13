const negativePromptBase = "worst quality, blurry, lowres, deformed, bad anatomy, bad hands";

export const illustrationStyles = {
	childrensBook: {
		positive:
			"watercolor painting of {prompt}, whimsical storybook illustration, soft edges, vibrant highlights, best quality, highres, 4k, pastel background, colorful accents",
		negative: `${negativePromptBase}, photo, 3d render, poorly drawn, {prompt}`,
	},
	manga: {
		positive:
			"Manga illustration of {prompt}, Josei anime style, tame colors, clean lines and shading, best quality, absurdres, highres, 4k, masterpiece",
		negative: `${negativePromptBase}, photo, 3d render, poorly drawn, {prompt}`,
	},
	fantasyArt: {
		positive:
			"fantasy art of {prompt}, detailed, imaginative, epic, vibrant color palette, mythical themes, dynamic lighting, magical, best quality, highres, 4k",
		negative: `${negativePromptBase}, photo, 3d render, poorly drawn, {prompt}`,
	},
	realism: {
		positive:
			"fine art print of {prompt}, accurate proportions, lifelike textures, natural lighting, hyperrealism, subtle color variation, realistic expressions, meticulous backgrounds, digital art, best quality, highres, 4k",
		negative: `${negativePromptBase}, photo, 3d render, poorly drawn, {prompt}`,
	},
	graphicNovel: {
		positive:
			"novel illustration of {prompt}, visual storytelling, partially colored, hand colored etching, best quality, highres, 4k",
		negative: `${negativePromptBase}, photo, 3d render, poorly drawn, {prompt}`,
	},
	custom: {
		positive: "{prompt}",
		negative: `${negativePromptBase}, {prompt}`,
	},
};

export function injectPrompt(prompt: string, style: string) {
	return style.replace(/{(\s+)?prompt(\s+)?}/i, prompt);
}

export type IllustrationStyles = keyof typeof illustrationStyles;
