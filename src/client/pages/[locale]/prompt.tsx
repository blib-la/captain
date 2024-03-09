import Box from "@mui/joy/Box";
import Chip, { type ChipProps } from "@mui/joy/Chip";
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
import { Captain } from "@/atoms/logo/captain";
import { useResizeObserver } from "@/ions/hooks/resize-observer";
import { useVectorStore } from "@/ions/hooks/vector-store";

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
	const suggestions = useVectorStore(value);

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
				<Input
					placeholder="I want to draw something..."
					endDecorator={
						<Box
							sx={{
								flex: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								height: 44,
								width: 44,
							}}
						>
							<Captain sx={{ height: "100%" }} />
						</Box>
					}
					slotProps={{
						input: {
							ref: promptReference,
							autoFocus: true,
							sx: {
								lineHeight: 1.5,
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
							const [suggestion] = suggestions;
							if (suggestions) {
								if (suggestion.payload.id === "silent-action") {
									if (!suggestion.payload.action) {
										return;
									}

									const [action, key, value] =
										suggestion.payload.action.split(":");
									window.ipc.send("CAPTAIN_ACTION", {
										action,
										payload: {
											key,
											value,
											scope: "user",
										},
									});
								} else {
									window.ipc.send(buildKey([ID.APP], { suffix: ":open" }), {
										data: suggestion.payload.id,
										action: suggestion.payload.action,
									});
								}
							}
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
						{suggestions.map((suggestion, index) => {
							let color: ChipProps["color"] = "red";
							if (suggestion.score > 0.2) {
								color = "orange";
							}

							if (suggestion.score > 0.2) {
								color = "yellow";
							}

							if (suggestion.score > 0.4) {
								color = "green";
							}

							return (
								<ListItem
									key={suggestion.id}
									sx={{
										"--focus-outline-offset": "-2px",
									}}
								>
									<ListItemButton
										color={index === 0 ? "primary" : undefined}
										variant={index === 0 ? "soft" : undefined}
										sx={{ height: 64 }}
										onClick={() => {
											if (suggestion.payload.id === "silent-action") {
												if (!suggestion.payload.action) {
													return;
												}

												const [action, key, value] =
													suggestion.payload.action.split(":");
												window.ipc.send("CAPTAIN_ACTION", {
													action,
													payload: {
														key,
														value,
														scope: "user",
													},
												});
											} else {
												window.ipc.send(
													buildKey([ID.APP], { suffix: ":open" }),
													{
														data: suggestion.payload.id,
														action: suggestion.payload.action,
													}
												);
											}
										}}
									>
										<ListItemDecorator>
											<Logo sx={{ color: "currentColor" }} />
										</ListItemDecorator>
										<ListItemContent>
											<Typography level="h4" component="div">
												{suggestion.payload.label}
											</Typography>
										</ListItemContent>
										<ListItemDecorator>
											<Chip color={color}>{suggestion.score.toFixed(3)}</Chip>
										</ListItemDecorator>
									</ListItemButton>
								</ListItem>
							);
						})}
					</List>
				</Sheet>
			)}
		</Box>
	);
}
