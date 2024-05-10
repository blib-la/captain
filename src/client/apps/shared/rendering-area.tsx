import { localFile } from "@captn/utils/string";
import Box from "@mui/joy/Box";

export function RenderingArea({
	image,
	height,
	width,
}: {
	image: string;
	height: number;
	width: number;
}) {
	return (
		<Box
			style={{ maxHeight: height, maxWidth: width }}
			sx={{
				display: "flex",
				height: "100%",
				width: "100%",
			}}
		>
			{image && (
				<img
					height="100%"
					width="100%"
					src={localFile(image)}
					alt=""
					style={{
						flex: 1,
						width: "100%",
						height: "100%",
						objectFit: "contain",
						objectPosition: "center",
					}}
				/>
			)}
		</Box>
	);
}
