import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Grid from "@mui/joy/Grid";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai/index";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { useEffect } from "react";

import { makeStaticProperties } from "@/ions/i18n/get-static";
import { DrawingCanvas } from "@/organisms/live-painting/drawing-canvas";
import { OutputCanvas } from "@/organisms/live-painting/output-canvas";
import { livePaintingOptionsAtom, Prompt } from "@/organisms/live-painting/update-properties";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common"]);
	const [livePaintingOptions] = useAtom(livePaintingOptionsAtom);

	// Use effect to send updates
	useEffect(() => {
		window.ipc.send("live-painting:update-properties", {
			prompt: livePaintingOptions.prompt,
			size: livePaintingOptions.size,
			seed: livePaintingOptions.seed,
			strength: livePaintingOptions.strength,
			guidance_scale: livePaintingOptions.guidanceScale,
			num_inference_steps: livePaintingOptions.steps,
		});
	}, [livePaintingOptions]);

	return (
		<>
			<Head>
				<title>{`Captain | ${t("common:livepainting")}`}</title>
			</Head>

			<Stack sx={{ position: "absolute", inset: 0, overflow: "hidden" }}>
				<Sheet
					sx={{
						position: "sticky",
						top: 0,
						display: "flex",
						alignItems: "center",
						height: 44,
						px: 2,
						zIndex: 1,
					}}
				>
					<Typography level="h4" component="h1" sx={{ mr: 1 }}>
						{t("common:livePainting")}
					</Typography>
					<Box sx={{ flex: 1 }} />
					<Button
						color="primary"
						size="sm"
						startDecorator={<PlayArrowIcon />}
						onClick={async () => {
							await window.ipc.handleRunLivePainting();
						}}
					>
						{t("common:start")}
					</Button>
				</Sheet>
				<Box
					sx={{
						flex: 1,
						padding: 1,
					}}
				>
					<Grid container spacing={2} columns={{ xs: 1, md: 2 }}>
						<Grid xs={1}>
							<DrawingCanvas />
						</Grid>

						<Grid xs={1}>
							<OutputCanvas />
						</Grid>
					</Grid>
					<Prompt />
				</Box>
			</Stack>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
