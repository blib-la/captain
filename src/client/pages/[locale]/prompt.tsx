import Box from "@mui/joy/Box";
import { useEffect, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { useResizeObserver } from "@/ions/hooks/resize-observer";

export default function Page() {
	const frameReference = useRef<HTMLTextAreaElement | null>(null);
	const { height, width } = useResizeObserver(frameReference);
	useEffect(() => {
		console.log({ height, width });
		window.ipc.send(buildKey([ID.WINDOW], { suffix: ":resize" }), { height, width });
	}, [height, width]);

	return (
		<Box sx={{ bgcolor: "red", position: "absolute", inset: 0 }}>
			<TextareaAutosize
				ref={frameReference}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					margin: 0,
					padding: 0,
					overflow: "hidden",
					border: 0,
					resize: "none",
				}}
			/>
		</Box>
	);
}
