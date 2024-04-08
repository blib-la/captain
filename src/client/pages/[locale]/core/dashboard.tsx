import { useVectorScroll } from "@captn/react/use-vector-store";
import Alert from "@mui/joy/Alert";
import Box from "@mui/joy/Box";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";

import { DynamicIcon } from "@/atoms/icons/dynamic";
import { Logo } from "@/atoms/logo";
import { handleCaptainAction } from "@/ions/handlers/action";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { getContrastColor } from "@/ions/utils/color";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);

	const { data: items } = useVectorScroll({
		with_payload: true,
		filter: {
			must: [{ key: "type", match: { value: "app" } }],
			must_not: [
				{ key: "id", match: { value: "dashboard" } },
				{ key: "id", match: { value: "settings" } },
			],
		},
	});

	return (
		<>
			<Head>
				<title>{t("labels:dashboard")}</title>
			</Head>
			<Box sx={{ p: 2 }}>
				<Alert color="primary" variant="soft" sx={{ m: 4, p: 4 }}>
					<Typography level="title-lg">{t("texts:howToUseCaptain")}</Typography>
				</Alert>
				<List
					sx={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fill,minmax(142px, 1fr))",
						gap: 2,
					}}
				>
					{items.map(item => (
						<ListItem
							key={item.id}
							sx={{
								"--focus-outline-offset": "-2px",
							}}
						>
							<ListItemButton
								sx={{ flexDirection: "column", width: 128, height: 112, p: 1 }}
								onClick={() => {
									handleCaptainAction(item);
								}}
							>
								<ListItemDecorator
									sx={{
										m: 0,
										p: 2,
										height: 64,
										width: 64,
										bgcolor: item.payload.iconColor,
										color: item.payload.iconColor
											? getContrastColor(item.payload.iconColor)
											: undefined,
										borderRadius: "md",
									}}
								>
									{item.payload.icon ? (
										<DynamicIcon
											icon={item.payload.icon}
											sx={{ fontSize: 32, color: "currentColor" }}
										/>
									) : (
										<Logo sx={{ fontSize: 32, color: "currentColor" }} />
									)}
								</ListItemDecorator>
								<ListItemContent sx={{ width: "100%", overflow: "hidden" }}>
									<Typography noWrap level="body-sm" sx={{ textAlign: "center" }}>
										{item.payload.label}
									</Typography>
								</ListItemContent>
							</ListItemButton>
						</ListItem>
					))}
				</List>
			</Box>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
