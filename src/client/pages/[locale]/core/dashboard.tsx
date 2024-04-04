import Alert from "@mui/joy/Alert";
import Box from "@mui/joy/Box";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { createElement, useEffect, useState } from "react";

import { RequiredModelsAlert } from "@/apps/live-painting/required-models-alert";
import { Logo } from "@/atoms/logo";
import { handleCaptainAction } from "@/ions/handlers/action";
import { useVectorScroll } from "@/ions/hooks/vector-store";
import { makeStaticProperties } from "@/ions/i18n/get-static";
import { getContrastColor } from "@/ions/utils/color";

const Brush = dynamic(() => import("@mui/icons-material/Brush"));
const MenuBook = dynamic(() => import("@mui/icons-material/MenuBook"));
const Settings = dynamic(() => import("@mui/icons-material/Settings"));

const iconCache: Record<string, any> = {
	Brush,
	MenuBook,
	Settings,
};
export function DynamicIcon({ icon }: { icon: string }) {
	const [component, setComponent] = useState<any>(iconCache[icon] ?? null);
	useEffect(() => {
		import("@mui/icons-material").then(module_ => {
			iconCache[icon] ||= module_[icon] ?? null;
			setComponent(iconCache[icon]);
		});
	}, [icon]);
	return component
		? createElement(component, { sx: { fontSize: 32, color: "currentColor" } })
		: null;
}

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);

	const items = useVectorScroll({
		with_payload: true,
		filter: { must: [{ key: "type", match: { value: "app" } }] },
	});

	return (
		<>
			<Head>
				<title>{t("labels:dashboard")}</title>
			</Head>
			<Box sx={{ p: 2 }}>
				<RequiredModelsAlert inline />
				<Alert color="primary" variant="soft" sx={{ m: 4, p: 4 }}>
					<Typography level="title-lg">{t("texts:howToUseCaptain")}</Typography>
				</Alert>
				<List sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
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
										<DynamicIcon icon={item.payload.icon} />
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
