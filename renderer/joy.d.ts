import type { PaletteRange } from "@mui/joy/styles";

declare module "@mui/joy/styles" {
	interface ColorPalettePropOverrides {
		// apply to all Joy UI components that support `color` prop
		secondary: true;
	}

	interface Palette {
		// this will make the node `secondary` configurable in `extendTheme`
		// and add `secondary` to the theme's palette.
		secondary: PaletteRange & { softActiveColor?: string };
	}
}
