import Input from "@mui/joy/Input";
import Sheet from "@mui/joy/Sheet";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { Logo } from "@/atoms/logo";
import { makeStaticProperties } from "@/ions/i18n/get-static";

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common", "labels"]);
	const [value, setValue] = useState("");

	useEffect(() => {
		const unsubscribe = window.ipc.on(
			buildKey([ID.VECTOR_STORE], { suffix: ":result" }),
			data => {
				console.log(data);
			}
		);
		return () => {
			unsubscribe();
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
						window.ipc.send(
							buildKey([ID.VECTOR_STORE], { suffix: ":search" }),
							event.target.value
						);
					}}
				/>
			</Sheet>
		</>
	);
}

export const getStaticProps = makeStaticProperties(["common", "texts", "labels"]);

export { getStaticPaths } from "@/ions/i18n/get-static";
