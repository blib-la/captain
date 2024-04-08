import { useSDK } from "@captn/react/use-sdk";
import Box from "@mui/joy/Box";
import { useAtom } from "jotai";

import { imageAtom } from "./atoms";
import { APP_ID } from "./constants";

export function RenderingArea() {
	const [image, setImage] = useAtom(imageAtom);

	useSDK<unknown, string>(APP_ID, {
		onMessage(message) {
			switch (message.action) {
				case "text-to-image:generated": {
					setImage(message.payload);
					break;
				}

				default: {
					break;
				}
			}
		},
	});

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
