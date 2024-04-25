import fsp from "fs/promises";

import { BrowserWindow } from "electron";
import { OpenAI } from "openai";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { ChatCompletionContentPart } from "openai/resources";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import type { FormInput, StoryRequest } from "#/types/story";
import { keyStore } from "@/stores";

export interface Mapping {
	length: Record<FormInput["length"], string>;
	style: Record<FormInput["style"], string>;
	mood: Record<FormInput["mood"], string>;
}

export const maxTokenMap = {
	short: 500,
	medium: 1000,
	long: 1500,
};
export const storyMap: Mapping = {
	length: {
		short: "For each image, craft a concise narrative that spans exactly on paragraph, focusing on capturing the essence and emotion of the image in a succinct manner. (max 50 words per image)",
		medium: "Develop the narrative around each image with approximately two paragraphs, allowing for a bit more depth in character exploration, setting description, or plot development. (max 150 words per image)",
		long: "Construct a detailed narrative for each image, consisting of three paragraphs, providing ample room for deep character development, intricate plot weaving, and rich world-building. (max 400 words per image)",
	},
	style: {
		magicalMystery:
			"Weave a tale filled with enchantment and secrets waiting to be uncovered, where magic infuses the world and mysteries drive the narrative forward.",
		adventure:
			"Tell a story of adventure and exploration, where characters face challenges, discover new worlds or realities, and overcome obstacles through courage and ingenuity.",
		sciFi: "Craft a narrative set in a world transformed by scientific and technological advancements, exploring the implications of future innovations on society, individuals, and the cosmos.",
		historical:
			"Recount a story set against the backdrop of a well-researched historical period, bringing to life the customs, conflicts, and characters of the past in vivid detail.",
		custom: "This story should be tailored to the unique elements specified in the custom style details, integrating specific themes, settings, or character traits as outlined.",
	},
	mood: {
		joyful: "Infuse the narrative with a sense of joy and positivity, creating uplifting moments and happy resolutions that leave the reader feeling buoyant.",
		sad: "Craft a tale that touches on themes of loss, longing, or unfulfilled desire, evoking a sense of melancholy or contemplative sadness in the reader.",
		suspenseful:
			"Build tension and suspense throughout the story, keeping the reader on the edge of their seat with unexpected twists, mysteries, or threats.",
		relaxing:
			"Create a soothing, gentle narrative that offers a respite from the world, focusing on serene settings, harmonious relationships, and a peaceful resolution.",
		exciting:
			"Drive the narrative with high-energy scenes, thrilling action, and dynamic interactions that keep the adrenaline flowing and the pages turning.",
	},
};

export const languages = {
	de: "German",
	en: "English",
	es: "Spanish",
	fr: "French",
	he: "Hebrew",
	it: "Italian",
	ja: "Japanese",
	nl: "Dutch",
	pl: "Polish",
	pt: "Portuguese",
	ru: "Russian",
	zh: "Chinese",
};

export const systemPromptVision = `Your task is to provide detailed analyses of the provided images, focusing exclusively on identifying and describing the scene's characters, actions, and any notable elements critical for narrative development. Please set aside considerations of the images' artistic style, whether simplistic or complex, watercolor, a scribble or a photo. Aim to capture the essence of each scene in a manner that sets a vivid stage for storytelling: who is present, what actions are taking place, and any significant objects or settings that are central to understanding the scene's potential narrative impact.

Your descriptions should serve as a direct foundation for a story, highlighting elements that a storyteller can weave into a dynamic narrative. Be precise and detailed in your analysis, avoiding any speculative interpretations not directly supported by the visual content. Organize your descriptions clearly, starting each new image analysis with an '### Image [number]' headline for ease of reference. This structured approach will help ensure that the narrative built on these descriptions remains grounded in the images' depicted scenes and characters.
`;

export const systemPrompt = `Your instructions for crafting an open-ended story with integrated images are detailed and well-structured, providing a clear framework for creating engaging narratives. Here's a review with some minor adjustments for enhanced clarity and coherence:

---

**Guidelines for Crafting an Open-Ended Story:**

**Task:** Write engaging stories, adhering strictly to the information provided by the user.

**Incorporate Image Details:** Integrate details from images into your narrative as though they inherently belong to the story. Avoid direct mentions of the images themselves (e.g., "the image shows...") or discussing the art style (e.g., "The bird shown in a comic style..." or "The stylized watercolor painting...").

**Markdown:** Employ Markdown for formatting, using H1 for titles and H2 for section titles to create visual hierarchy and emphasis.

**Placeholders for Images:**
- Embed images in Markdown using \`![alt text...](index)\`. Replace \`"index"\` with the numerical order of your image (e.g., \`0\`, \`1\`, \`2\` for first, second, and third images, respectively), and \`"alt text..."\` with a concise description.
- Placeholders signify the sequence for image insertion, ensuring they are woven into the story at designated points.
- Position images near the start of each section to enrich the narrative, ensuring they augment the text without explicit acknowledgment.
- Include all provided images within the story, placing one image in each section for narrative enhancement.

**Story Attributes:** Customize the narrative to match specified preferences such as length, genre, mood, and writing style, maintaining engagement and prompting readers to contemplate future developments.

**Avoid Conclusions:** Do not end the story with reflections or summaries. Instead, conclude with a cliffhanger or an open question, leaving the narrative open for continuation..

**Non-Interactive Storytelling:**
- Preserve narrative continuity without direct engagement with the reader, concentrating solely on the storytelling aspect.

**Example of Correct Usage:**

\`\`\`markdown
# The Wonder

## The city that...

In a city where... ![a cityscape at night...](0) ...so then...

## The Stranger

![a mysterious figure...](1) In a dark...
\`\`\`

**Note:** Aim to craft a vivid, uninterrupted narrative inspired by images, inviting the reader into a world filled with their own visual interpretations. Adopt a writing style reflective of bestsellers in the preferred genre. DO NOT enclose the story within a code block; instead, respond with properly formatted Markdown.
`;

export function buildUserPrompt(
	imageDescriptions: string,
	{
		options,
		locale,
	}: {
		options: FormInput;
		locale: string;
	}
) {
	return `## Image Descriptions
- The images, as described below, form the backbone of our story. They are rich with detail and ripe for narrative exploration:
${imageDescriptions}

**User-Defined Story Attributes:**
- **Language Preference:** The narrative should be presented in the user's preferred language, (${languages[locale as keyof typeof languages]}), to ensure accessibility and personal connection.
- **Length:** ${storyMap.length[options.length]}
- **Style:** ${storyMap.style[options.style]}
- **Mood:** ${storyMap.mood[options.mood]}
${options.customStyle?.trim() ? `- **Custom Style Details:** Incorporate the following specific thematic or stylistic elements as outlined by the user: ${options.customStyle}` : ""}
${options.characters?.trim() ? `- **Characters:** Incorporate the following characters as outlined by the user: ${options.characters}` : ""}

**Guidance:** The story you weave should be a direct reflection of the user's vision as conveyed through the image descriptions and specified preferences. It is imperative that the narrative adheres closely to these guidelines, ensuring that the story not only draws from the images but also aligns with what the user anticipates and desires to read. Your creativity should serve to enhance and realize this vision, bringing to life a narrative that is both unique and deeply personal.
`;
}

export async function captionImages(images: string[], maxTokens = 1000): Promise<string> {
	const window_ = BrowserWindow.getFocusedWindow();
	if (!window_) {
		return "";
	}

	const apiKey = keyStore.get("openAiApiKey");

	if (!apiKey) {
		window_.webContents.send(
			buildKey([ID.STORY], { suffix: ":error" }),
			`Missing OpenAI API Key`
		);
		return "";
	}

	const openai = new OpenAI({
		apiKey,
	});

	const imagesDataUrls = await Promise.all(
		images.map(async imagePath => {
			const base64Image = await fsp.readFile(imagePath, "base64");
			return `data:image/png;base64,${base64Image}`;
		})
	);

	const imageContents: ChatCompletionContentPart[] = imagesDataUrls.map(image => ({
		type: "image_url",
		image_url: { url: image },
	}));

	let imageDescriptions = "";

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

		imageDescriptions = responseVision.choices[0].message.content ?? "";
	} catch (error) {
		window_.webContents.send(
			buildKey([ID.STORY], { suffix: ":error" }),
			`Couldn't get the image descriptions: ${error}`
		);
	}

	return imageDescriptions;
}

export async function createStory(
	{ maxTokens, imageDescriptions, locale, options }: StoryRequest,
	{
		onChunk,
		onDone,
		onError,
	}: { onChunk(story: string): void; onDone(story: string): void; onError(error: Error): void }
) {
	const apiKey = keyStore.get("openAiApiKey");

	if (!apiKey) {
		onError(new Error("Missing OpenAI API Key"));
		return;
	}

	const openai = new OpenAI({
		apiKey,
	});

	try {
		const userPromptStory = buildUserPrompt(imageDescriptions, { options, locale });

		const streamStory = await openai.chat.completions.create({
			model: "gpt-4-turbo-preview",
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPromptStory },
			],
			max_tokens: maxTokens,
			stream: true,
		});

		let story = "";

		for await (const chunk of streamStory) {
			story += chunk.choices[0]?.delta?.content || "";
			if (onChunk) {
				onChunk(story);
			}
		}

		if (onDone) {
			onDone(story);
		}
	} catch (error) {
		if (onError) {
			onError(new Error(`Couldn't generate the story: ${error}`));
		}
	}
}
