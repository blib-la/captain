import { localFile } from "@captn/utils/string";
import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core/dist/types";
import {
	arrayMove,
	rectSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Portal } from "@mui/base";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Sheet from "@mui/joy/Sheet";
import { useAtom } from "jotai/index";
import type { CSSProperties } from "react";
import { useMemo } from "react";
import { useState } from "react";
import { forwardRef, type LegacyRef, type ReactNode, useCallback, useRef } from "react";
import Scrollbars from "react-custom-scrollbars";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeGrid } from "react-window";

import { selectedStoryImagesAtom, storyImagesAtom } from "./atoms";

import { AutoGrid } from "@/organisms/auto-grid";

export function SortableItem({ id, children }: { id: string; children?: ReactNode }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 0 : 1,
	};

	return (
		<Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
			{children}
		</Box>
	);
}

export function SelectedImages() {
	const [images, setImages] = useAtom(selectedStoryImagesAtom);
	const [activeId, setActiveId] = useState<string | number | null>(null);
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		setActiveId(null);

		if (active.id !== over?.id) {
			setImages(previousState => {
				const oldIndex = previousState.findIndex(item => active.id === item.id);
				const newIndex = previousState.findIndex(item => over?.id === item.id);

				return arrayMove(previousState, oldIndex, newIndex);
			});
		}
	}

	function handleDragStart(event: DragStartEvent) {
		setActiveId(event.active.id);
	}

	const activeItem = useMemo(
		() => images.find(image => image.id === activeId),
		[images, activeId]
	);

	return (
		<DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
			<Portal>
				<DragOverlay>
					{activeItem && (
						<Box>
							<img
								src={localFile(activeItem.filePath)}
								style={{ width: "100%" }}
								alt=""
							/>
						</Box>
					)}
				</DragOverlay>
			</Portal>
			<SortableContext strategy={rectSortingStrategy} items={images.map(({ id }) => id)}>
				<AutoGrid minWidth={150}>
					{images.map(({ filePath, id }) => (
						<SortableItem key={id} id={id}>
							<Sheet variant="outlined" sx={{ display: "flex" }}>
								<img
									src={localFile(filePath)}
									style={{ width: "100%", opacity: activeId === id ? 0 : 1 }}
									alt=""
								/>
							</Sheet>
						</SortableItem>
					))}
				</AutoGrid>
			</SortableContext>
		</DndContext>
	);
}

export function ImageSelectorCell({
	columnIndex,
	rowIndex,
	columnCount,
	style,
}: {
	columnCount: number;
	columnIndex: number;
	rowIndex: number;
	style: CSSProperties;
}) {
	const reference = useRef<HTMLDivElement>(null);
	const [images] = useAtom(storyImagesAtom);
	const [selectedImages, setSelectedImages] = useAtom(selectedStoryImagesAtom);

	const index = rowIndex * columnCount + columnIndex;
	const image = images[index];
	const isSelected = image && selectedImages.some(({ id }) => id === image.id);

	return (
		image && (
			<Box ref={reference} style={style}>
				<Button
					key={image.filePath}
					color={isSelected ? "primary" : "neutral"}
					variant={isSelected ? "solid" : "plain"}
					sx={{ p: 1 }}
					onClick={() => {
						setSelectedImages(previousState =>
							isSelected
								? previousState.filter(
										({ filePath }) => filePath !== image.filePath
									)
								: [...previousState, image]
						);
					}}
				>
					<img
						src={localFile(image.filePath)}
						alt=""
						style={{ height: "auto", width: "100%" }}
					/>
				</Button>
			</Box>
		)
	);
}

export function LegacyCustomScrollbars({
	onScroll,
	forwardedRef,
	style,
	children,
}: {
	onScroll?: any;
	forwardedRef?: any;
	style?: any;
	children?: any;
}) {
	const referenceSetter: LegacyRef<any> = useCallback(
		(scrollbarsReference: { view: any }) => {
			if (forwardedRef) {
				if (scrollbarsReference) {
					forwardedRef(scrollbarsReference.view);
				} else {
					forwardedRef(null);
				}
			}
		},
		[forwardedRef]
	);

	return (
		<Scrollbars
			ref={referenceSetter}
			autoHide
			universal
			style={{ ...style, overflow: "hidden" }}
			renderThumbVertical={properties => (
				<Box
					{...properties}
					className="thumb-vertical"
					style={{ ...properties.style }}
					sx={theme => ({
						bgcolor: "text.secondary",
						zIndex: theme.zIndex.badge + 1,
					})}
				/>
			)}
			onScroll={onScroll}
		>
			{children}
		</Scrollbars>
	);
}

export const CustomScrollbarsVirtualList = forwardRef<
	HTMLDivElement,
	{ onScroll: any; forwardedRef: any; style: any; children: any }
>((properties, reference) => <LegacyCustomScrollbars {...properties} forwardedRef={reference} />);

CustomScrollbarsVirtualList.displayName = "CustomScrollbarsVirtualList";

export function VirtualGrid({ items }: { items: number }) {
	return (
		<AutoSizer>
			{({ height, width }) => {
				const columnCount = Math.floor(width / 150);
				const columnWidth = width / columnCount;

				return (
					<FixedSizeGrid
						outerElementType={CustomScrollbarsVirtualList}
						className="react-window"
						columnCount={columnCount}
						height={height}
						columnWidth={columnWidth}
						rowHeight={columnWidth}
						width={width}
						rowCount={Math.ceil(items / columnCount)}
					>
						{({ columnIndex, rowIndex, style }) => (
							<ImageSelectorCell
								columnIndex={columnIndex}
								rowIndex={rowIndex}
								style={style}
								columnCount={columnCount}
							/>
						)}
					</FixedSizeGrid>
				);
			}}
		</AutoSizer>
	);
}
