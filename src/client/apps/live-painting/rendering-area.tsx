import { localFile } from "@captn/utils/string";
import Box from "@mui/joy/Box";
import { useAtom } from "jotai";

import { imageAtom } from "./atoms";

export function RenderingArea() {
	const [image] = useAtom(imageAtom);

	return (
		<Box
			sx={{
				boxShadow: "sm",
				bgcolor: "common.white",
				width: 512,
				height: 512,
				display: "flex",
			}}
		>
			{image && <img height={512} width={512} src={localFile(image)} alt="" />}
		</Box>
	);
}
