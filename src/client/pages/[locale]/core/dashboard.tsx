import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import type { ImageItem } from "#/types";
import { makeStaticProperties } from "@/ions/i18n/get-static";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);

	const [files, setFiles] = useState<any[]>([]);
	const [story, setStory] = useState<{ markdown: string; images: ImageItem[] } | null>(null);

	useEffect(() => {
		window.ipc.send(buildKey([ID.STORY], { suffix: ":get-all" }), {
			fileTypes: [".json"],
		});
		const unsubscribe = window.ipc.on(buildKey([ID.STORY], { suffix: ":all" }), files_ => {
			setFiles(files_);
		});

		return () => {
			unsubscribe();
		};
	}, []);

	return (
		<>
			<Head>
				<title>{t("labels:dashboard")}</title>
			</Head>
			<Typography>{t("labels:dashboard")}</Typography>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
