import { BrowserWindow, ipcMain } from "electron";
import { OpenAI } from "openai";
import type { ChatCompletionContentPart } from "openai/resources";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { keyStore } from "@/stores";

ipcMain.on(
	buildKey([ID.STORY], { suffix: ":describe" }),
	async (
		_event,
		{
			images,
			prompt,
			maxTokens = 2000,
		}: { images: string[]; prompt: string; maxTokens?: number }
	) => {
		const window_ = BrowserWindow.getFocusedWindow();
		if (!window_) {
			return;
		}

		const apiKey = keyStore.get("openAiApiKey");
		console.log(">>>>>>>>>>>>>>");
		console.log({ apiKey, images, prompt });
		console.log("<<<<<<<<<<<<<");
		if (!apiKey) {
			window_.webContents.send(
				buildKey([ID.STORY], { suffix: ":error" }),
				`Missing OpenAI API Key`
			);
			return;
		}

		const openai = new OpenAI({
			apiKey,
		});

		const systemPromptVision = `You analyze the provided images with a maximum level of precision and every detail.
You only describe the image, you don't interact with the user.
Each image is separated from the next image by using a headline "## image 1", then "## image 2" and so on.`;

		const imageContents: ChatCompletionContentPart[] = images.map(image => ({
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

			console.log(responseVision.choices[0].message.content);

			imageDescriptions = responseVision.choices[0].message.content;
		} catch (error) {
			window_.webContents.send(
				buildKey([ID.STORY], { suffix: ":error" }),
				`Couldn't get the image descriptions: ${error}`
			);
		}

		if (!imageDescriptions) {
			window_.webContents.send(
				buildKey([ID.STORY], { suffix: ":error" }),
				`Couldn't generate the story: missing descriptions`
			);
			return;
		}

		try {
			const systemPrompt = `**Objective:** You are to compose a sophisticated and engrossing narrative based on user-provided image descriptions. Your task is to transcend mere storytelling to craft a literary work that could stand shoulder to shoulder with the creations of esteemed authors. The story is to be continuous, with each chapter deftly setting the stage for the next, weaving an infinite tapestry of interconnected events and characters.

**Character and World Building:** Characters are the soul of your narrative. They should be multidimensional and authentic, driving the story through their complexities and growth. The world you build should be vivid and tangible, inviting readers to lose themselves in its details. Every element, from the ambient sounds of a scene to the hidden thoughts of a character, must be conveyed with precision and depth.

**Narrative Style:** Your narrative should exhibit a refined and polished prose style. Employ a variety of literary devices to enrich the text, such as nuanced dialogue, intricate metaphors, and layered symbolism. Your voice should be distinctive, capable of exploring profound themes of existence, the human condition, and the subtleties of emotion and intellect.

**Interaction Guidelines:**
- **Response Format:** Respond exclusively with the continuation of the story, using the image descriptions as your muse. Avoid meta-commentary, critiques, or any form of direct user interaction about the content.
- **Language Requirement:** Communicate the narrative user's language preference: \`${prompt}\`.
- **Adherence to Descriptions:** It is imperative to faithfully integrate the user's image descriptions into your narrative. These descriptions are not mere suggestions but the cornerstone of the world you will elaborate upon.
- **Continuity and Open-Endedness:** Craft your tale so that it naturally flows from one segment to the next, with each conclusion subtly opening the door to further possibilities. The narrative should never close but rather continuously expand, inviting endless exploration.

**Ethical Considerations:** Approach your storytelling with cultural and ethical sensitivity. Strive for inclusivity and depth, avoiding clichés and stereotypes. Your narrative should resonate with a universal audience and reflect a wide array of experiences.

**Outcome:** Aspire to create a narrative that could be admired for its artistry and depth, one that could be imagined alongside the works of great authors. Your story should inspire, challenge, and captivate, becoming a piece that not only tells a tale but also explores the very essence of storytelling itself.
`;
			const userPromptStory = `# Images
${imageDescriptions}
`;

			const streamStory = await openai.chat.completions.create({
				model: "gpt-4-turbo-preview",
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: userPromptStory },
				],
				stream: true,
			});

			let story = "";

			for await (const chunk of streamStory) {
				story += chunk.choices[0]?.delta?.content || "";

				window_.webContents.send(buildKey([ID.STORY], { suffix: ":generated" }), story);
			}
		} catch (error) {
			window_.webContents.send(
				buildKey([ID.STORY], { suffix: ":error" }),
				`Couldn't generate the story: ${error}`
			);
		}
	}
);
