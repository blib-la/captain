import { useTheme } from "@mui/joy/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

export function useColumns({ xs, sm, md, lg }: { xs: number; sm: number; md: number; lg: number }) {
	const theme = useTheme();
	const isSm = useMediaQuery(theme.breakpoints.up("sm"));
	const isMd = useMediaQuery(theme.breakpoints.up("md"));
	const isLg = useMediaQuery(theme.breakpoints.up("lg"));
	if (isLg) {
		return lg;
	}

	if (isMd) {
		return md;
	}

	if (isSm) {
		return sm;
	}

	return xs;
}
