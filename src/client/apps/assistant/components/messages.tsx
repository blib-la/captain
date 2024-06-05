import AssistantIcon from "@mui/icons-material/Assistant";
import PersonIcon from "@mui/icons-material/Person";
import Avatar from "@mui/joy/Avatar";
import Box from "@mui/joy/Box";
import ListItem from "@mui/joy/ListItem";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Sheet from "@mui/joy/Sheet";
import type { ColorPaletteProp } from "@mui/joy/styles";
import Tooltip from "@mui/joy/Tooltip";
import { useTranslation } from "next-i18next";
import type { CSSProperties, LegacyRef } from "react";
import { useEffect, useRef } from "react";
import { forwardRef, useMemo } from "react";
import type { ListProps } from "react-virtualized";
import { CellMeasurer, CellMeasurerCache, List as VirtualList } from "react-virtualized";
import AutoSizer from "react-virtualized-auto-sizer";

import { modelColors, modelNames } from "@/client/apps/assistant/constants";
import { assistantIcons } from "@/client/apps/assistant/icons";
import type { MessageModel } from "@/client/apps/assistant/types";
import { Markdown } from "@/client/apps/shared/markdown";
import { useResizeObserver } from "@/client/ions/hooks/resize-observer";

export const MessageRenderer = forwardRef<
	HTMLLIElement,
	{
		message: MessageModel;
		color: ColorPaletteProp;
		style?: CSSProperties;
		onResize?(): void;
		onMount?(): void;
		onUnMount?(): void;
	}
>(({ message, color, style, onMount, onUnMount, onResize }, reference) => {
	const { t } = useTranslation(["labels"]);
	const [modelPrefix_] = (message.model ?? "unknown").split("-");
	const onMountReference = useRef(onMount);
	const onUnMountReference = useRef(onUnMount);
	const onResizeReference = useRef(onResize);
	const listItemReference = useRef<HTMLDivElement | null>(null);
	const { height } = useResizeObserver(listItemReference);

	useEffect(() => {
		const onMount_ = onMountReference.current;
		const onUnMount_ = onUnMountReference.current;
		if (onMount_) {
			onMount_();
		}

		return () => {
			if (onUnMount_) {
				onUnMount_();
			}
		};
	}, []);

	useEffect(() => {
		const onResize_ = onResizeReference.current;
		if (onResize_) {
			onResize_();
		}
	}, [height]);

	return (
		<Box
			ref={reference}
			style={style}
			sx={{
				p: 2,
				listStyle: "none",
				display: "flex",
				flexDirection: "column",
				"--ListItemDecorator-size": "40px",
			}}
		>
			<ListItem
				ref={listItemReference}
				component="div"
				sx={{
					flexDirection: message.role === "user" ? "row-reverse" : "row",
					alignItems: "flex-start",
					alignSelf: message.role === "user" ? "flex-end" : "flex-start",
					gap: 2,
				}}
			>
				<ListItemDecorator
					sx={theme => ({
						position: "sticky",
						top: theme.spacing(0.5),
						mx: 0,
					})}
				>
					<Tooltip
						title={
							message.model
								? modelNames[message.model] ?? t(`labels:${message.role}`)
								: t(`labels:${message.role}`)
						}
					>
						<Avatar
							variant="soft"
							color={
								message.role === "user"
									? color
									: modelColors[message.model ?? "gpt-3.5-turbo"] ?? "neutral"
							}
						>
							{message.role === "user" ? (
								<PersonIcon />
							) : (
								assistantIcons[modelPrefix_] ?? <AssistantIcon />
							)}
						</Avatar>
					</Tooltip>
				</ListItemDecorator>
				<ListItemContent>
					<Sheet
						variant="soft"
						color={message.role === "user" ? color : "neutral"}
						sx={{
							px: 2,
							py: 1,
							borderRadius: "sm",
						}}
					>
						<Markdown markdown={message.content} />
					</Sheet>
				</ListItemContent>
			</ListItem>
		</Box>
	);
});

MessageRenderer.displayName = "MessageRenderer";

export const Messages = forwardRef<
	VirtualList,
	{
		messages: MessageModel[];
		model: string;
		modelPrefix: string;
		message: string;
		color: ColorPaletteProp;
		onScroll: ListProps["onScroll"];
		scrollToIndex: ListProps["scrollToIndex"];
	}
>(({ messages, model, message, color, onScroll, scrollToIndex }, reference) => {
	const cache = useMemo(
		() =>
			new CellMeasurerCache({
				defaultHeight: 100,
				fixedWidth: false,
			}),
		[]
	);

	return (
		<Box
			sx={{
				flex: 1,
				position: "relative",
				overflow: "hidden",
				".ReactVirtualized__Grid__innerScrollContainer": {
					overflow: "unset!important",
				},
			}}
		>
			<AutoSizer>
				{({ height, width }) => (
					<VirtualList
						ref={reference}
						scrollToIndex={scrollToIndex}
						height={height}
						width={width}
						deferredMeasurementCache={cache}
						rowHeight={cache.rowHeight}
						rowCount={messages.length + (message ? 1 : 0)}
						rowRenderer={({ index, key, parent, style }) => (
							<CellMeasurer
								key={key}
								cache={cache}
								columnIndex={0}
								parent={parent}
								rowIndex={index}
							>
								{({ measure, registerChild }) => {
									const message_ = messages[index] ?? {
										id: "__new_Message__",
										role: "assistant",
										content: message,
										model,
									};
									return (
										<MessageRenderer
											key={message_.id}
											ref={registerChild as LegacyRef<HTMLLIElement>}
											color={color}
											message={message_}
											style={style}
											onResize={() => {
												measure();
											}}
											onMount={() => {
												measure();
											}}
										/>
									);
								}}
							</CellMeasurer>
						)}
						onScroll={onScroll}
					/>
				)}
			</AutoSizer>
		</Box>
	);
});

Messages.displayName = "Messages";
