import { forwardRef, useCallback } from "react";
import { Scrollbars } from "react-custom-scrollbars";
import { Box } from "@mui/joy";

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
  const refSetter = useCallback(
    (scrollbarsRef) => {
      if (forwardedRef) {
        if (scrollbarsRef) {
          forwardedRef(scrollbarsRef.view);
        } else {
          forwardedRef(null);
        }
      }
    },
    [forwardedRef],
  );

  return (
    <Scrollbars
      autoHide
      universal
      ref={refSetter}
      style={{ ...style, overflow: "hidden" }}
      onScroll={onScroll}
      renderThumbVertical={(props) => (
        <Box
          {...props}
          className="thumb-vertical"
          sx={(theme) => ({
            bgcolor: "text.secondary",
            zIndex: theme.zIndex.badge + 1,
          })}
          style={{ ...props.style }}
        />
      )}
    >
      {children}
    </Scrollbars>
  );
}

export const CustomScrollbarsVirtualList = forwardRef<
  HTMLDivElement,
  { onScroll: any; forwardedRef: any; style: any; children: any }
>((props, ref) => <CustomScrollbars {...props} forwardedRef={ref} />);
