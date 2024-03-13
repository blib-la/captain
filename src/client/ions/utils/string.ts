export function capitalizeFirstLetter(text: string) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

export function replaceImagePlaceholders(
	markdown: string,
	images: { filePath: string; id: string }[]
): string {
	// Regular expression to find all image placeholders in the format ![...](index)
	const regex = /!\[(.*?)]\((\d+)\)/g;

	// Replace each placeholder with its corresponding URL from the images array
	return markdown.replaceAll(regex, (match, altText, index) => {
		// Attempt to get the image at the given index
		const image = images[Number.parseInt(index, 10)];

		// If an image exists at this index, replace with its URL and preserve the original alt text
		return image ? `![${altText}](./${Number.parseInt(index, 10) + 1}.png)` : match;
	});
}
