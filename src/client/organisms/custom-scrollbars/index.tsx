import Box from "@mui/joy/Box";
import type { LegacyRef } from "react";
import { forwardRef, useCallback } from "react";
import { Scrollbars } from "react-custom-scrollbars";

export function CustomScrollbars({
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
>((properties, reference) => <CustomScrollbars {...properties} forwardedRef={reference} />);

CustomScrollbarsVirtualList.displayName = "CustomScrollbarsVirtualList";
