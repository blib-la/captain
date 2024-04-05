import { useVectorStore } from "@captn/react/use-vector-store";
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
import { evaluate } from "mathjs";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { DynamicIcon } from "@/atoms/icons/dynamic";
import { Logo } from "@/atoms/logo";
import { Captain } from "@/atoms/logo/captain";
import { handleCaptainAction } from "@/ions/handlers/action";
import { useResizeObserver } from "@/ions/hooks/resize-observer";
import { makeStaticProperties } from "@/ions/i18n/get-static";

export function useAutoFocusIPC<T extends HTMLElement>(reference: RefObject<T>) {
	useEffect(() => {
		function handleFocus() {
			if (reference.current) {
				reference.current.focus();
			}
		}

		window.addEventListener("focus", handleFocus);
		return () => {
			window.removeEventListener("focus", handleFocus);
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
	const [evaluationResult, setEvaluationResult] = useState("");
	const { data: suggestions } = useVectorStore(value, {
		filter: {
			must_not: [
				{ key: "type", match: { value: "image" } },
				{ key: "type", match: { value: "markdown" } },
			],
		},
	});

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
					placeholder="I want to..."
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
						try {
							const result = evaluate(event.target.value);
							setEvaluationResult(result.toString());
						} catch {
							// Console.error(error);
							setEvaluationResult("");
						}
					}}
					onKeyDown={async event => {
						if (event.key === "Enter" && !event.shiftKey) {
							event.preventDefault();
							if (evaluationResult) {
								return;
							}

							const [suggestion] = suggestions;
							if (suggestion) {
								handleCaptainAction(suggestion);
							}
						}
					}}
				/>
			</Box>
			{(suggestions.length > 0 || evaluationResult) && (
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
						{evaluationResult && (
							<ListItem
								sx={{
									"--focus-outline-offset": "-2px",
								}}
							>
								<ListItemButton
									sx={{ height: 64 }}
									onClick={async () => {
										try {
											await navigator.clipboard.writeText(evaluationResult);
										} catch (error) {
											console.log(error);
										}
									}}
								>
									<ListItemDecorator>
										<Logo sx={{ color: "currentColor" }} />
									</ListItemDecorator>
									<ListItemContent>
										<Typography level="h4" component="div">
											{evaluationResult}
										</Typography>
									</ListItemContent>
								</ListItemButton>
							</ListItem>
						)}
						{suggestions.map(suggestion => {
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
										sx={{ height: 64 }}
										onClick={() => {
											handleCaptainAction(suggestion);
										}}
									>
										<ListItemDecorator>
											{suggestion.payload.icon ? (
												<DynamicIcon icon={suggestion.payload.icon} />
											) : (
												<Logo
													sx={{ fontSize: 24, color: "currentColor" }}
												/>
											)}
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

export const getStaticProps = makeStaticProperties(["common", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
