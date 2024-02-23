import { BrowserWindow, ipcMain } from "electron";
import { OpenAI } from "openai";
import type { ChatCompletionContentPart } from "openai/resources";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";

const openai = new OpenAI({
	apiKey: "",
});

ipcMain.on(
	buildKey([ID.STORY], { suffix: ":describe" }),
	async (_event, { images, prompt, maxTokens = 2000 }) => {
		const window_ = BrowserWindow.getFocusedWindow();
		if (!window_) {
			return;
		}

		const systemPromptVision = `You analyze the provided images with a maximum level of precision and every detail. 
You only describe the image, you don't interact with the user.
Each image is separated from the next image by using a headline "## image 1", then "## image 2" and so on.`;

		const imageContents: ChatCompletionContentPart[] = images.map((image: any) => ({
			type: "image_url",
			image_url: { url: image },
		}));

		let imageDescriptions;

		try {
			const responseVision = await openai.chat.completions.create({
				model: "gpt-4-vision-preview",
				messages: [
					{ role: "system", content: systemPromptVision },
					{
						role: "user",
						content: imageContents,
					},
				],
				max_tokens: maxTokens,
			});

			console.log(JSON.stringify(responseVision.choices, null, 2));

			imageDescriptions = responseVision.choices[0].message.content;
		} catch (error) {
			window_.webContents.send(
				buildKey([ID.STORY], { suffix: ":error" }),
				`Couldn't get the image descriptions: ${error}`
			);
		}

		if (!imageDescriptions) {
			return;
		}

		try {
			const userPromptStory = `# Images
			${imageDescriptions}`;

			const responseStory = await openai.chat.completions.create({
				model: "gpt-4-turbo-preview",
				messages: [
					{ role: "system", content: prompt },
					{ role: "user", content: userPromptStory },
				],
			});

			console.log(JSON.stringify(responseStory.choices, null, 2));

			const story = responseStory.choices[0].message.content;
			window_.webContents.send(buildKey([ID.STORY], { suffix: ":generated" }), story);
		} catch (error) {
			window_.webContents.send(
				buildKey([ID.STORY], { suffix: ":error" }),
				`Couldn't generate the story: ${error}`
			);
		}
	}
);
