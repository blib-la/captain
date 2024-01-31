import { styled } from "@mui/joy/styles";

export const ScreenReaderOnly = styled("span")({
	position: "absolute",
	right: "100vw",
	width: 1,
	height: 1,
	top: "auto",
	overflow: "hidden",
});
