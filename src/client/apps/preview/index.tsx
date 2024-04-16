import { CustomScrollbars } from "@captn/joy/custom-scrollbars";
import { useSDK } from "@captn/react/use-sdk";
import { localFile } from "@captn/utils/string";
import Box from "@mui/joy/Box";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { Markdown } from "@/apps/story/markdown";
import { ZoomImage } from "@/organisms/zoom-image";

export function Preview() {
	const { query } = useRouter();
	const [content, setContent] = useState<string>("");
	const [images, setImages] = useState<string[]>([]);

	const filePath = query.filePath as string | undefined;
	const fileType = query.fileType as string | undefined;

	const { readFile } = useSDK("preview", {});

	useEffect(() => {
		if (filePath && fileType === "story") {
			readFile(filePath.replace("story.md", "info.json"), "utf8")
				.then(content_ => JSON.parse(content_))
				.then(
					({
						story,
						images,
					}: {
						story: string;
						images: {
							filePath: string;
							id: string;
						}[];
					}) => {
						setContent(story);
						setImages(
							images.map((_image, index) =>
								localFile(filePath.replace("story.md", `${index + 1}.png`))
							)
						);
					}
				);
		} else if (filePath && fileType === "markdown") {
			readFile(filePath, "utf8").then(content_ => {
				setContent(content_);
			});
		}
	}, [readFile, filePath, fileType]);

	switch (fileType) {
		case "image": {
			return (
				<Box sx={{ inset: 0, position: "absolute", overflow: "hidden" }}>
					{filePath && <ZoomImage image={localFile(filePath)} />}
				</Box>
			);
		}

		case "markdown": {
			return (
				<CustomScrollbars>
					<Box sx={{ p: 2 }}>
						<Markdown markdown={content} />
					</Box>
				</CustomScrollbars>
			);
		}

		case "story": {
			return (
				<CustomScrollbars>
					<Box sx={{ p: 2 }}>
						<Markdown markdown={content} images={images} />
					</Box>
				</CustomScrollbars>
			);
		}

		default: {
			return <Box>{content}</Box>;
		}
	}
}
