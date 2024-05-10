export const illustrationStyles = {
	childrensBook:
		"whimsical, watercolor painting of {prompt}, storybook illustration, soft edges, vibrant highlights, best quality, highres, 4k, pastel background, colorful accents",
	manga: "Manga illustration of {prompt}, Josei anime style, tame colors, clean lines and shading, best quality, absurdres, highres, 4k, masterpiece",
	fantasyArt:
		"fantasy art of {prompt}, detailed, imaginative, epic, vibrant color palette, mythical themes, dynamic lighting, magical, best quality, highres, 4k",
	realism:
		"fine art print of {prompt}, accurate proportions, lifelike textures, natural lighting, hyperrealism, subtle color variation, realistic expressions, meticulous backgrounds, digital art, best quality, highres, 4k",
	graphicNovel:
		"novel illustration of {prompt}, visual storytelling, partially colored, hand colored etching, best quality, highres, 4k",
	custom: "{prompt}",
};

export function injectPrompt(prompt: string, style: string) {
	return style.replace(/{(\s+)?prompt(\s+)?}/i, prompt);
}

export type IllustrationStyles = keyof typeof illustrationStyles;
