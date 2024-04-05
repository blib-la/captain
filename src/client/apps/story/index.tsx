import { CustomScrollbars } from "@captn/joy/custom-scrollbars";
import { useSDK } from "@captn/react/use-sdk";
import { useVectorScroll } from "@captn/react/use-vector-store";
import { localFile } from "@captn/utils/string";
import ClearIcon from "@mui/icons-material/Clear";
import Box from "@mui/joy/Box";
import Grid from "@mui/joy/Grid";
import IconButton from "@mui/joy/IconButton";
import LinearProgress from "@mui/joy/LinearProgress";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useState } from "react";
import { v4 } from "uuid";

import { selectedStoryImagesAtom, storyImagesAtom } from "./atoms";
import { VirtualGrid } from "./components";
import { APP_ID } from "./constants";
import { Markdown } from "./markdown";
import { StoryForm } from "./story-form";

import { extractH1Headings } from "#/string";
import { replaceImagePlaceholders } from "@/ions/utils/string";
import { Lottie } from "@/organisms/lottie";

export function Story() {
	const {
		t,
		i18n: { language: locale },
	} = useTranslation(["common", "labels", "texts"]);
	const [images, setImages] = useAtom(storyImagesAtom);
	const [selectedImages] = useAtom(selectedStoryImagesAtom);

	const [story, setStory] = useState("");
	const [generating, setGenerating] = useState(false);
	const [hasOpenAiApiKey, setHasOpenAiApiKey] = useState(false);

	const saveStory = useCallback(
		async (story_: string) => {
			const id = v4();
			const now = dayjs().toString();
			await Promise.all([
				window.ipc.writeFile(
					`stories/${id}/story.md`,
					replaceImagePlaceholders(story_, selectedImages),
					{ encoding: "utf8" }
				),
				window.ipc.writeFile(
					`stories/${id}/info.json`,
					JSON.stringify({
						id,
						locale,
						type: "story",
						story: story_,
						createdAt: now,
						updatedAt: now,
						title: extractH1Headings(story_)[0],
						images: selectedImages,
					}),
					{ encoding: "utf8" }
				),
				...selectedImages.map(({ filePath }, index) =>
					window.ipc.copyFile(filePath, `stories/${id}/${index + 1}.png`)
				),
			]);
		},
		[locale, selectedImages]
	);

	const { data: images_ } = useVectorScroll({
		with_payload: true,
		filter: { must: [{ key: "type", match: { value: "image" } }] },
	});

	const isDisabled = selectedImages.length === 0 || !hasOpenAiApiKey;

	useSDK<unknown, { done: boolean; story: string }>(APP_ID, {
		async onMessage(message) {
			setStory(message.payload.story);
			if (message.payload.done) {
				setGenerating(false);
				await saveStory(message.payload.story);
			}

			switch (message.action) {
				case "story:create": {
					break;
				}

				default: {
					break;
				}
			}
		},
	});

	useEffect(() => {
		setImages(
			images_.map(({ id, payload: { filePath } }) => ({
				id: id!.toString(),
				filePath: filePath!,
			}))
		);
	}, [images_, setImages]);

	useEffect(() => {
		window.ipc.send("hasOpenAiApiKey");
		const unsubscribe = window.ipc.on("hasOpenAiApiKey", (hasKey: boolean) => {
			setHasOpenAiApiKey(hasKey);
		});
		return () => {
			unsubscribe();
		};
	}, []);

	if (story) {
		return (
			<CustomScrollbars>
				<Box sx={{ p: 2 }}>
					<Sheet sx={{ display: "flex", justifyContent: "flex-end" }}>
						<IconButton
							aria-label={t("labels:close")}
							onClick={() => {
								setStory("");
							}}
						>
							<ClearIcon />
						</IconButton>
					</Sheet>
					<Markdown
						markdown={story}
						images={selectedImages.map(image => localFile(image.filePath))}
					/>
				</Box>
			</CustomScrollbars>
		);
	}

	return generating ? (
		<CustomScrollbars>
			<Box sx={{ p: 2 }}>
				<Box
					sx={{
						backgroundSize: "100% 100%",
					}}
				>
					<Lottie path="/lottie/minimalistic/team-meeting.json" height={350} />
				</Box>
				<Typography level="h2" sx={{ textAlign: "center", my: 3 }}>
					{t("labels:analyzingImages")}
				</Typography>
				<Typography sx={{ textAlign: "center", my: 2 }}>
					{t("texts:analyzingImages")}
				</Typography>
				<Box sx={{ py: 6, px: 10 }}>
					<LinearProgress
						color="green"
						sx={{
							mb: 4,
							flexGrow: 0,
							"--LinearProgress-radius": "0px",
							"--LinearProgress-thickness": "48px",
						}}
					/>
				</Box>
			</Box>
		</CustomScrollbars>
	) : (
		<Box sx={{ px: 2, overflow: "hidden", height: "100%" }}>
			<Grid container spacing={2} columns={{ xs: 1, lg: 2 }} sx={{ height: "100%", pt: 2 }}>
				<Grid xs={1} sx={{ position: "relative" }}>
					<VirtualGrid items={images?.length ?? 0} />
				</Grid>
				<Grid xs={1} sx={{ display: "flex" }}>
					<StoryForm
						disabled={isDisabled}
						hasOpenAiApiKey={hasOpenAiApiKey}
						onSubmit={() => {
							setGenerating(true);
						}}
					/>
				</Grid>
			</Grid>
		</Box>
	);
}
