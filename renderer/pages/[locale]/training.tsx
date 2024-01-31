import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";

import { makeStaticProperties } from "@/ions/i18n/get-static";
import { Lottie } from "@/organisms/lottie";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common"]);
	return (
		<>
			<Head>
				<title>{`Captain | ${t("common:training")}`}</title>
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
						{t("common:training")}
					</Typography>
				</Sheet>
				<Box
					sx={{
						flex: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Box>
						<Lottie path="/lottie/minimalistic/tech-discovery.json" height={400} />
						<Typography level="h2" sx={{ textAlign: "center" }}>
							{t("common:comingSoon")}
						</Typography>
					</Box>
				</Box>
			</Stack>
		</>
	);
}

const getStaticProps = makeStaticProperties(["common"]);
export { getStaticProps };

export { getStaticPaths } from "@/ions/i18n/get-static";
