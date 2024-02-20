import Box from "@mui/joy/Box";
import { styled } from "@mui/joy/styles";
import Typography from "@mui/joy/Typography";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import { type ReactNode, useEffect, useState } from "react";

export const StyledMotionDiv = styled(motion.div)({
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%,-50%)",
	width: "100%",
});

export function FadeBox({ children, isVisible }: { children: ReactNode; isVisible?: boolean }) {
	return (
		<AnimatePresence>
			{isVisible && (
				<StyledMotionDiv
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					{children}
				</StyledMotionDiv>
			)}
		</AnimatePresence>
	);
}

export function useNumberRotation(end: number, { interval = 1000, loop = false } = {}) {
	const [count, setCount] = useState(0);

	useEffect(() => {
		let startTimestamp: number;
		let timeout: number;
		let animationFrame: number;

		function step(timestamp: number) {
			if (!startTimestamp) {
				startTimestamp = timestamp;
			}

			const progress = timestamp - startTimestamp;

			// If the progress exceeds the interval, update the count
			if (progress >= interval) {
				setCount(previousCount => {
					// Determine the next count, considering looping
					// If not looping and end is reached, stop scheduling updates
					if (!loop && previousCount >= end) {
						return previousCount;
					}

					let nextCount = previousCount;
					if (previousCount < end) {
						nextCount = previousCount + 1;
					} else if (loop) {
						nextCount = 0;
					}

					// Schedule next update
					timeout = window.setTimeout(
						() => {
							requestAnimationFrame(step);
						},
						interval - (progress - interval)
					);

					return nextCount;
				});

				// Reset startTimestamp for the next interval
				startTimestamp = timestamp;
			} else {
				// Continue the animation
				animationFrame = requestAnimationFrame(step);
			}
		}

		// Start the animation
		animationFrame = requestAnimationFrame(step);

		return () => {
			clearTimeout(timeout);
			cancelAnimationFrame(animationFrame);
		};
	}, [end, interval, loop]);

	return count;
}

export function QuoteLoop() {
	const { t } = useTranslation(["texts"]);
	const count = useNumberRotation(4, { interval: 10_000, loop: true });

	return (
		<Box sx={{ position: "relative", width: "100%", height: 200 }}>
			<FadeBox isVisible={count === 0}>
				<Typography sx={{ textAlign: "center", width: "100%" }}>
					{t("texts:quote1")}
				</Typography>
			</FadeBox>
			<FadeBox isVisible={count === 1}>
				<Typography sx={{ textAlign: "center", width: "100%" }}>
					{t("texts:quote2")}
				</Typography>
			</FadeBox>
			<FadeBox isVisible={count === 2}>
				<Typography sx={{ textAlign: "center", width: "100%" }}>
					{t("texts:quote3")}
				</Typography>
			</FadeBox>
			<FadeBox isVisible={count === 3}>
				<Typography sx={{ textAlign: "center", width: "100%" }}>
					{t("texts:quote4")}
				</Typography>
			</FadeBox>
			<FadeBox isVisible={count === 4}>
				<Typography sx={{ textAlign: "center", width: "100%" }}>
					{t("texts:quote5")}
				</Typography>
			</FadeBox>
		</Box>
	);
}
