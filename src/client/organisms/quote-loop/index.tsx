import { styled } from "@mui/joy/styles";
import Typography from "@mui/joy/Typography";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import { type ReactNode, useEffect, useMemo, useState } from "react";

export const StyledMotionDiv = styled(motion.div)({
	position: "absolute",
	inset: 0,
	display: "flex",
	alignItems: "center",
});

export function FadeBox({ children, id }: { children: ReactNode; id: string }) {
	return (
		<AnimatePresence mode="wait">
			<StyledMotionDiv
				key={id}
				initial={{ y: 10, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				exit={{ y: -10, opacity: 0 }}
				transition={{ duration: 0.2 }}
			>
				{children}
			</StyledMotionDiv>
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
			startTimestamp ||= timestamp;

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
	const texts = useMemo(
		() => [
			t("texts:quote1"),
			t("texts:quote2"),
			t("texts:quote3"),
			t("texts:quote4"),
			t("texts:quote5"),
		],
		[t]
	);
	const count = useNumberRotation(texts.length - 1, { interval: 15_000, loop: true });

	return (
		<FadeBox id={count.toString()}>
			<Typography sx={{ textAlign: "center", width: "100%" }}>{texts[count]}</Typography>
		</FadeBox>
	);
}
