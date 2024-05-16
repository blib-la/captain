const negativePromptBase = "worst quality, blurry, lowres, deformed, bad anatomy, bad hands";

export const illustrationStyles: Record<
	string,
	{ positive: string; negative: string; plus?: boolean }
> = {
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
	bliblaStyle: {
		plus: true,
		positive:
			"a caricature lithography of a cartoon character with exaggerated facial features, a parody of {prompt}, highres digital art, 4k resolution, best quality, nostalgic hand colored etching",
		negative: `worst quality, lowres, blurry, smudge, framed, photo, signature, artist name, text, {prompt}`,
	},
	bliblaArtStyle: {
		plus: true,
		positive: "{prompt}, highres digital art, 4k resolution, best quality",
		negative: `worst quality, lowres, blurry, smudge, framed, photo, signature, artist name, text, {prompt}`,
	},
	bliblaUsedLeather: {
		plus: true,
		positive:
			"a used leather {prompt}, made of leather, weathered, visible stitching, scuffed, stained",
		negative: "pristine, new, {prompt}",
	},
	bliblaCaricature: {
		plus: true,
		positive: "caricature of {prompt}, exaggerated facial features",
		negative: "worst quality, blurry, lowres, bad hands, {prompt}",
	},
	bliblaHonoreDaumier: {
		plus: true,
		positive:
			"a caricature of {prompt}, lithography, inspired by honore daumier, best quality, highres, 4k resolution",
		negative: "smudge, lowres, blurry, {prompt}",
	},
	bliblaEugeneAtget: {
		plus: true,
		positive:
			"a nostalgic photo of {prompt}, inspired by eugene atget, antique, sepia tone, monochrome",
		negative: `${negativePromptBase}, {prompt}`,
	},
	bliblaThomasRowlandson: {
		plus: true,
		positive: "{prompt}, hand colored etching, inspired by thomas rowlandson",
		negative: `${negativePromptBase}, {prompt}`,
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
