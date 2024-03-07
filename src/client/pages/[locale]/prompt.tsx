import Box from "@mui/joy/Box";
import Input from "@mui/joy/Input";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import type { RefObject } from "react";
import { useEffect, useState, useRef } from "react";

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
	const promptReference = useRef<HTMLInputElement | null>(null);
	const [value, setValue] = useState("");
	const [suggestions, setSuggestions] = useState<{ id: string; label: string }[]>([]);

	useAutoFocusIPC(promptReference);
	useAutoSizerWindow(frameReference);

	useEffect(() => {
		const unsubscribe = window.ipc.on(
			buildKey([ID.PROMPT], { suffix: ":suggestion" }),
			(suggestions_: { id: string; label: string }[]) => {
				setSuggestions(suggestions_);
			}
		);
		return () => {
			unsubscribe();
		};
	}, []);

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
				<Input
					placeholder="I want to draw something..."
					endDecorator={
						<Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
							<Logo sx={{ height: 30 }} />
						</Box>
					}
					slotProps={{
						input: {
							ref: promptReference,
							autoFocus: true,
							sx: {
								resize: "none",
							},
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
						window.ipc.send(
							buildKey([ID.PROMPT], { suffix: ":query" }),
							event.target.value
						);
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
			{suggestions.length > 0 && (
				<Sheet
					sx={{
						my: "1em",
						mx: 1,
						WebkitAppRegion: "no-drag",
						boxShadow: "md",
					}}
				>
					<List
						sx={{
							maxHeight: 64 * 3,
							p: 0,
							overflow: "auto",
							WebkitOverflowScrolling: "touch",
						}}
					>
						{suggestions.map(suggestion => (
							<ListItem
								key={suggestion.id}
								sx={{
									"--focus-outline-offset": "-2px",
								}}
							>
								<ListItemButton
									sx={{ height: 64 }}
									onClick={() => {
										window.ipc.send(buildKey([ID.APP], { suffix: ":open" }), {
											data: suggestion.id,
										});
									}}
								>
									<ListItemDecorator>
										<Logo sx={{ color: "currentColor" }} />
									</ListItemDecorator>
									<ListItemContent>
										<Typography level="h4" component="div">
											{suggestion.label}
										</Typography>
									</ListItemContent>
								</ListItemButton>
							</ListItem>
						))}
					</List>
				</Sheet>
			)}
		</Box>
	);
}
