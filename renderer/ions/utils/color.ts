export function getContrastColor(hexColor: string): string {
	const [red, green, blue] = hexToRGB(hexColor);
	const luminance = Math.trunc(0.299 * red + 0.587 * green + 0.114 * blue);
	return luminance > 128 ? "black" : "white";
}

export function getRelativeLuminance(rgb: [number, number, number]): number {
	const [r, g, b] = rgb.map(channel => channel / 255);

	const [R, G, B] = [r, g, b].map((channel: number) =>
		channel <= 0.039_28 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
	);
	return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function hexToRGB(hex: string): [number, number, number] {
	const shorthandRegex = /^#?([\da-f])([\da-f])([\da-f])$/i;
	hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

	const result = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
	if (!result) {
		throw new Error("Invalid HEX color.");
	}

	return [
		Number.parseInt(result[1], 16),
		Number.parseInt(result[2], 16),
		Number.parseInt(result[3], 16),
	];
}

export function rgbToHex(r: number, g: number, b: number) {
	if (![r, g, b].every(value => value >= 0 && value <= 255)) {
		throw new Error("Invalid RGB value.");
	}

	return (
		"#" +
		[r, g, b]
			.map(x => {
				const hex = x.toString(16);
				return hex.length === 1 ? "0" + hex : hex;
			})
			.join("")
	);
}

export function mixColors(color1: string, color2: string, percentage: number) {
	percentage = Math.max(0, Math.min(percentage, 1));

	const [r1, g1, b1] = hexToRGB(color1);
	const [r2, g2, b2] = hexToRGB(color2);

	const r = Math.round(r1 + (r2 - r1) * percentage);
	const g = Math.round(g1 + (g2 - g1) * percentage);
	const b = Math.round(b1 + (b2 - b1) * percentage);

	return rgbToHex(r, g, b);
}

export function getContrast(background: string, foreground: string) {
	const luminance1 = getRelativeLuminance(hexToRGB(background));
	const luminance2 = getRelativeLuminance(hexToRGB(foreground));

	const contrast =
		luminance1 > luminance2
			? (luminance1 + 0.05) / (luminance2 + 0.05)
			: (luminance2 + 0.05) / (luminance1 + 0.05);

	return {
		contrast,
		aa: contrast >= 4.5,
		aaa: contrast >= 7,
	};
}
