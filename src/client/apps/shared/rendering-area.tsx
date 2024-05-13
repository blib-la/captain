import { localFile } from "@captn/utils/string";
import Box from "@mui/joy/Box";

import { ZoomImage } from "@/client/organisms/zoom-image";

export function RenderingArea({
	image,
	zoomImage,
	height = "100%",
	width = "100%",
}: {
	image: string;
	zoomImage?: boolean;
	height?: number | string;
	width?: number | string;
}) {
	return (
		<Box
			style={{ height, width }}
			sx={{
				display: "flex",
				position: "relative",
			}}
		>
			{image && zoomImage && <ZoomImage image={localFile(image)} />}
			{image && !zoomImage && (
				<Box
					component="img"
					src={localFile(image)}
					sx={{
						position: "absolute",
						inset: 0,
						height: "100%",
						width: "100%",
						objectFit: "contain",
						objectPosition: "center",
					}}
				/>
			)}
		</Box>
	);
}
