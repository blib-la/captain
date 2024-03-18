import Sheet from "@mui/joy/Sheet";
import { styled } from "@mui/joy/styles";

export const StyledColorInput = styled("input")({
	width: "100%",
	height: "100%",
	minWidth: 0,
	opacity: 0,
	position: "absolute",
	inset: 0,
	cursor: "pointer",
});

export const StyledRenderingAreaWrapper = styled("div")(({ theme }) => ({
	minWidth: "min-content",
	position: "relative",
	zIndex: 0,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	padding: theme.spacing(1),
}));

export const StyledDrawingAreaWrapper = styled("div")(({ theme }) => ({
	minWidth: "min-content",
	inset: 0,
	zIndex: 1,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	padding: theme.spacing(1),
}));

export const StyledButtonWrapper = styled("div")(({ theme }) => ({
	display: "flex",
	flex: 1,
	height: 44,
	alignItems: "center",
	flexShrink: 0,
	gap: theme.spacing(1),
	paddingLeft: theme.spacing(1),
	paddingRight: theme.spacing(1),
}));

export const StyledStickyHeader = styled(Sheet)({
	position: "sticky",
	top: 0,
	zIndex: 2,
	display: "flex",
	flexWrap: "wrap",
	alignItems: "center",
	flexShrink: 0,
});
