import { CustomScrollbars } from "@captn/joy/custom-scrollbars";
import type { CSSProperties, LegacyRef, ReactNode, RefCallback } from "react";
import { forwardRef, useCallback } from "react";
import type { ScrollbarProps } from "react-custom-scrollbars";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";

export function LegacyCustomScrollbars({
	onScroll,
	forwardedRef,
	style,
	children,
}: {
	onScroll?: ScrollbarProps["onScroll"];
	forwardedRef?: RefCallback<HTMLDivElement>;
	style?: CSSProperties;
	children?: ReactNode;
}) {
	const referenceSetter: LegacyRef<unknown> = useCallback(
		(scrollbarsReference: { view: HTMLDivElement }) => {
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
		<CustomScrollbars
			ref={referenceSetter}
			style={{ ...style, overflow: "hidden" }}
			onScroll={onScroll}
		>
			{children}
		</CustomScrollbars>
	);
}

export const CustomScrollbarsVirtual = forwardRef<HTMLDivElement | undefined>(
	(properties, reference) => (
		<LegacyCustomScrollbars
			{...properties}
			forwardedRef={reference as RefCallback<HTMLDivElement>}
		/>
	)
);

CustomScrollbarsVirtual.displayName = "CustomScrollbarsVirtual";

export function VirtualList<T extends { id: string }>({
	items,
	itemSize,
	renderItem,
}: {
	items: T[];
	itemSize: number;
	renderItem(item: T, style: CSSProperties): ReactNode;
}) {
	return (
		<AutoSizer>
			{({ height, width }) => (
				<FixedSizeList
					outerElementType={CustomScrollbarsVirtual}
					className="react-window"
					height={height}
					width={width}
					itemCount={items.length}
					itemSize={itemSize}
				>
					{({ index, style }) => renderItem(items[index], style)}
				</FixedSizeList>
			)}
		</AutoSizer>
	);
}
