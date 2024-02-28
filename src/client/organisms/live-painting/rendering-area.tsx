import Box from "@mui/joy/Box";
import { useAtom } from "jotai/index";
import { useEffect } from "react";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { imageAtom } from "@/ions/atoms/live-painting";

export function RenderingArea() {
	const [image, setImage] = useAtom(imageAtom);

	useEffect(() => {
		const unsubscribe = window.ipc.on(
			buildKey([ID.LIVE_PAINT], { suffix: ":generated" }),
			(dataUrl: string) => {
				setImage(dataUrl);
			}
		);

		return () => {
			unsubscribe();
		};
	}, [setImage]);
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
			{image && <img height={512} width={512} src={image} alt="" />}
		</Box>
	);
}
