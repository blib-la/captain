import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import type { ReactNode } from "react";

import { TitleBar } from "@/organisms/title-bar";

export function SimpleLayout({ children }: { children?: ReactNode }) {
	return (
		<Box
			sx={{
				height: "100dvh",
				overflow: "hidden",
				display: "grid",
				gridTemplateColumns: "1fr",
				gridTemplateRows: "36px 1fr",
			}}
		>
			<TitleBar disableMaximize />
			<Sheet
				variant="plain"
				sx={{
					position: "relative",
					overflow: "hidden",
					p: 2,
					display: "flex",
					flexDirection: "column",
				}}
			>
				{children}
			</Sheet>
		</Box>
	);
}
