import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Container from "@mui/joy/Container";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Sheet from "@mui/joy/Sheet";
import Textarea from "@mui/joy/Textarea";
import Typography from "@mui/joy/Typography";
import type { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";

import { makeStaticProperties } from "@/ions/i18n/get-static";
import { CustomScrollbars } from "@/organisms/custom-scrollbars";

function FeedbackForm() {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		defaultValues: { body: "" },
	});
	const { t } = useTranslation(["common"]);

	return (
		<Box
			component="form"
			sx={{ width: "100%" }}
			onSubmit={handleSubmit(async data => {
				await window.ipc.sendFeedback(data);
			})}
		>
			<FormControl sx={{ width: "100%" }}>
				<FormLabel>{t("common:pages.feedback.giveFeedback")}</FormLabel>
				<Textarea
					minRows={6}
					error={Boolean(errors?.body)}
					sx={{ width: "100%" }}
					{...register("body", { required: true })}
				/>
			</FormControl>
			<Box sx={{ pt: 2 }}>
				<Button type="submit">{t("common:send")}</Button>
			</Box>
		</Box>
	);
}

export default function Page(_properties: InferGetStaticPropsType<typeof getStaticProps>) {
	const { t } = useTranslation(["common"]);
	return (
		<>
			<Head>
				<title>{`Captain | ${t("common:feedback")}`}</title>
			</Head>

			<Box
				sx={{
					position: "absolute",
					inset: 0,
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
				}}
			>
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
						{t("common:feedback")}
					</Typography>
				</Sheet>
				<Box sx={{ flex: 1, position: "relative" }}>
					<CustomScrollbars>
						<Container>
							<FeedbackForm />
						</Container>
					</CustomScrollbars>
				</Box>
			</Box>
		</>
	);
}

const getStaticProps = makeStaticProperties(["common"]);
export { getStaticProps };

export { getStaticPaths } from "@/ions/i18n/get-static";
