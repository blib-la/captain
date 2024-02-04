import { Button } from "@mui/joy";
import Box from "@mui/joy/Box";
import Grid from "@mui/joy/Grid";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";

import { makeStaticProperties } from "@/ions/i18n/get-static";
import { DrawingCanvas } from "@/organisms/live-painting/drawing-canvas";
import { OutputCanvas } from "@/organisms/live-painting/output-canvas";
import { UpdateProperties } from "@/organisms/live-painting/update-properties";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common"]);
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
					<Typography level="h4" component="h1">
						{t("common:livepainting")}
					</Typography>
					<Button onClick={() => window.ipc.handleRunLivePainting()}>Start</Button>
				</Sheet>
				<Box
					sx={{
						flex: 1,
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

					<UpdateProperties />
				</Box>
			</Stack>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
