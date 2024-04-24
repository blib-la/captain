import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import type { ReactNode } from "react";

import { Illustration } from "@/organisms/illustration";

export function InstallStep({
	illustration,
	heading,
	children,
}: {
	illustration: string;
	heading: string;
	children?: ReactNode;
}) {
	return (
		<>
			<Illustration height={200} path={illustration} />
			<Typography level="h1" sx={{ my: 2, textAlign: "center" }}>
				{heading}
			</Typography>
			<Box
				sx={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					mx: 8,
				}}
			>
				{children}
			</Box>
		</>
	);
}
