import { CustomScrollbars } from "@captn/joy/custom-scrollbars";
import { useSDK } from "@captn/react/use-sdk";
import Box from "@mui/joy/Box";
import Grid from "@mui/joy/Grid";
import LinearProgress from "@mui/joy/LinearProgress";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai";
import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useState } from "react";

import { selectedStoryImagesAtom, storyImagesAtom } from "./atoms";
import { VirtualGrid } from "./components";
import { APP_ID } from "./constants";
import { Markdown } from "./markdown";
import { StoryForm } from "./story-form";

import { LOCAL_PROTOCOL } from "#/constants";
import { Lottie } from "@/organisms/lottie";

export function Story() {
	const { t } = useTranslation(["common", "labels", "texts"]);
	const [images, setImages] = useAtom(storyImagesAtom);
	const [selectedImages] = useAtom(selectedStoryImagesAtom);

	const [story, setStory] = useState("");
	const [generating, setGenerating] = useState(false);

	const loadImages = useCallback(() => {
		window.ipc.inventoryStore
			.get<{ filePath: string; id: string }[]>("files.image", [])
			.then(images_ => {
				console.log(images_);
				setImages(images_);
			});
	}, [setImages]);
	useSDK<unknown, { done: boolean; story: string }>(APP_ID, {
		onMessage(message) {
			console.log(message);
			setStory(message.payload.story);
			if (message.payload.done) {
				setGenerating(false);
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
		loadImages();
		const unsubscribe = window.ipc.on("images", images_ => {
			setImages(images_);
		});
		return () => {
			unsubscribe();
		};
	}, [loadImages, setImages]);

	if (story) {
		return (
			<CustomScrollbars>
				<Box sx={{ p: 2 }}>
					<Markdown
						markdown={story}
						images={selectedImages.map(
							image => `${LOCAL_PROTOCOL}://${image.filePath}`
						)}
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
						onSubmit={() => {
							setGenerating(true);
						}}
					/>
				</Grid>
			</Grid>
		</Box>
	);
}
