import Input from "@mui/joy/Input";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import Sheet from "@mui/joy/Sheet";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { useState } from "react";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { Logo } from "@/atoms/logo";
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
				/>
			</Sheet>
			<Sheet>
				<List>
					{results.map(result => (
						<ListItem key={result.id}>
							<ListItemButton
								onClick={() => {
									window.ipc.send(buildKey([ID.APP], { suffix: ":open" }), {
										data: result.payload.id,
									});
								}}
							>
								{result.payload.id}
							</ListItemButton>
						</ListItem>
					))}
				</List>
			</Sheet>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
