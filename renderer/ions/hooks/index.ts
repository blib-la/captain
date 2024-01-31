import { useTheme } from "@mui/joy/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useEffect, useState } from "react";

export function useLocalSteps(defaultValue = 0, max = Number.POSITIVE_INFINITY, min = 0) {
	const [step, setStep] = useState(defaultValue);

	return {
		step,
		increment() {
			if (step < max) {
				setStep(step + 1);
			}
		},
		decrement() {
			if (step > min) {
				setStep(step - 1);
			}
		},
		set(value: number) {
			if ((value > min || value < max) && step !== value) {
				setStep(value);
			}
		},
	};
}

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

export function useScrollbarWidth() {
	const [width, setWidth] = useState(0);
	useEffect(() => {
		const element = document.createElement("div");
		element.style.cssText = "overflow:scroll; visibility:hidden; position:absolute;";
		document.body.append(element);
		setWidth(element.offsetWidth - element.clientWidth);
		element.remove();
	}, []);
	return width;
}
