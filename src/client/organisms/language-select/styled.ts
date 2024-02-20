import { styled } from "@mui/joy/styles";

export const StyledFlagWrapper = styled("div")({
	height: 24,
	width: 24,
});

export const StyledValueWrapper = styled("div")(({ theme }) => ({
	display: "flex",
	gap: theme.spacing(1),
}));
