import Input from "@mui/joy/Input";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import Sheet from "@mui/joy/Sheet";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

import type { VectorStoreDocument } from "../../../../electron/future/services/vector-store";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { Logo } from "@/atoms/logo";
import { makeStaticProperties } from "@/ions/i18n/get-static";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);
	const [value, setValue] = useState("");
	const [results, setResults] = useState<VectorStoreDocument[]>([]);
	const [query] = useDebounce(value, 1000);

	useEffect(() => {
		if (query) {
			window.ipc.send(buildKey([ID.VECTOR_STORE], { suffix: ":search" }), query);
		}
	}, [query]);

	useEffect(() => {
		const unsubscribeResult = window.ipc.on(
			buildKey([ID.VECTOR_STORE], { suffix: ":result" }),
			data => {
				console.log(data);
				setResults(data);
			}
		);
		const unsubscribeError = window.ipc.on(
			buildKey([ID.VECTOR_STORE], { suffix: ":error" }),
			error => {
				console.log(error);
			}
		);
		return () => {
			unsubscribeResult();
			unsubscribeError();
		};
	}, []);

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
						<ListItem key={result.id}>{result.payload.id}</ListItem>
					))}
				</List>
			</Sheet>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
