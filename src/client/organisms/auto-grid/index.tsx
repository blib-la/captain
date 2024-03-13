import type { ReactNode } from "react";
import Box from "@mui/joy/Box";

export function AutoGrid({ children, minWidth }: { children?: ReactNode; minWidth: number }) {
	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
				gap: 1,
				overflow: "hidden",
			}}
		>
			{children}
		</Box>
	);
}
