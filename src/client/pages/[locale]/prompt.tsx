import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import Textarea from "@mui/joy/Textarea";
import type { RefObject } from "react";
import { useState } from "react";
import { useEffect, useRef } from "react";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { Logo } from "@/atoms/logo";
import { useResizeObserver } from "@/ions/hooks/resize-observer";

export function useAutoFocusIPC<T extends HTMLElement>(reference: RefObject<T>) {
	useEffect(() => {
		const unsubscribe = window.ipc.on(buildKey([ID.WINDOW], { suffix: ":focus" }), () => {
			if (reference.current) {
				reference.current.focus();
			}
		});
		return () => {
			unsubscribe();
		};
	}, [reference]);
}

export function useAutoSizerWindow<T extends HTMLElement>(reference: RefObject<T>) {
	const { height, width } = useResizeObserver(reference);
	useEffect(() => {
		window.ipc.send(buildKey([ID.WINDOW], { suffix: ":resize" }), { height, width });
	}, [height, width]);
}

export default function Page() {
	const frameReference = useRef<HTMLDivElement | null>(null);
	const promptReference = useRef<HTMLTextAreaElement | null>(null);
	const [value, setValue] = useState("");

	useAutoFocusIPC(promptReference);
	useAutoSizerWindow(frameReference);

	return (
		<Box
			ref={frameReference}
			sx={{
				WebkitAppRegion: "drag",
				height: "min-content",
				overflow: "hidden",
			}}
		>
			<Box
				sx={{
					position: "relative",
					fontSize: 24,
					my: "1em",
					mx: 1,
					WebkitAppRegion: "no-drag",
					overflow: "hidden",
					boxShadow: "md",
				}}
			>
				<Textarea
					placeholder="I want to draw something..."
					endDecorator={
						<Box>
							<IconButton
								sx={{ width: 46, height: 46 }}
								onClick={() => {
									window.ipc.send(buildKey([ID.APP], { suffix: ":open" }), {
										data: "something",
									});
								}}
							>
								<Logo sx={{ height: 30 }} />
							</IconButton>
						</Box>
					}
					slotProps={{
						textarea: {
							ref: promptReference,
							autoFocus: true,
							sx: {
								resize: "none",
							},
						},
						endDecorator: {
							sx: { m: -1 },
						},
					}}
					sx={{
						fontSize: "inherit",
						lineHeight: 1.25,
						p: 2,
						flexDirection: "row",
					}}
					onChange={event => {
						setValue(event.target.value);
					}}
					onKeyDown={event => {
						if (event.key === "Enter" && !event.shiftKey) {
							event.preventDefault();
							window.ipc.send(buildKey([ID.APP], { suffix: ":open" }), {
								data: value,
							});
						}
					}}
				/>
			</Box>
		</Box>
	);
}
