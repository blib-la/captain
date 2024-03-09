import type { ChipProps } from "@mui/joy/Chip";
import Chip from "@mui/joy/Chip";
import Input from "@mui/joy/Input";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Sheet from "@mui/joy/Sheet";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { useState } from "react";

import { Logo } from "@/atoms/logo";
import { handleSuggestion } from "@/ions/hooks/vector-actions";
import { useVectorStore } from "@/ions/hooks/vector-store";
import { makeStaticProperties } from "@/ions/i18n/get-static";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);
	const [value, setValue] = useState("");
	const results = useVectorStore(value);

	return (
		<>
			<Head>
				<title>{t("labels:dashboard")}</title>
			</Head>
			<Sheet variant="soft" color="primary" sx={{ p: 2, display: "flex", gap: 2 }}>
				<Input
					value={value}
					startDecorator={<Logo />}
					sx={{ flex: 1 }}
					onChange={event => {
						setValue(event.target.value);
					}}
					onKeyDown={event => {
						if (event.key === "Enter" && !event.shiftKey) {
							event.preventDefault();
							const [result] = results;
							if (result) {
								handleSuggestion(result);
							}
						}
					}}
				/>
			</Sheet>
			<Sheet>
				<List>
					{results.map((result, index) => {
						let color: ChipProps["color"] = "red";
						if (result.score > 0.2) {
							color = "orange";
						}

						if (result.score > 0.2) {
							color = "yellow";
						}

						if (result.score > 0.4) {
							color = "green";
						}

						return (
							<ListItem key={result.id}>
								<ListItemButton
									color={index === 0 ? "primary" : undefined}
									variant={index === 0 ? "outlined" : undefined}
									onClick={() => {
										handleSuggestion(result);
									}}
								>
									<ListItemContent>{result.payload.label}</ListItemContent>
									<ListItemDecorator>
										<Chip color={color}>{result.score.toFixed(3)}</Chip>
									</ListItemDecorator>
								</ListItemButton>
							</ListItem>
						);
					})}
				</List>
			</Sheet>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
