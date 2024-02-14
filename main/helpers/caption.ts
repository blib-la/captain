import { OpenAI } from "openai";
import type {
	ChatCompletionContentPart,
	ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

import { OPENAI_API_KEY } from "./constants";
import { store } from "./store";
import { parseJsonFromString } from "./utils";

export async function createImageDescriptions(
	images: string[],
	{ systemMessage, exampleResponse }: { systemMessage: string; exampleResponse: string[] }
) {
	const openai = new OpenAI({
		apiKey: store.get(OPENAI_API_KEY) as string,
	});
	const imageContents: ChatCompletionContentPart[] = images.map(image => ({
		type: "image_url",
		image_url: { url: image },
	}));

	const messages: ChatCompletionMessageParam[] = [
		{ role: "system", content: systemMessage },
		{
			role: "user",
			content: [],
		},
		{
			role: "assistant",
			content: `\`\`\`json
${JSON.stringify(exampleResponse)}
\`\`\`
`,
		},
		{
			role: "user",
			content: imageContents,
		},
	];

	try {
		const response = await openai.chat.completions.create({
			model: "gpt-4-vision-preview",
			messages,
			max_tokens: 1000,
		});
		console.log("\n\nGPT RESULT: -->\n");
		console.log(response.choices[0].message.content);
		console.log("\n--------------------\n\n");
		return parseJsonFromString(response.choices[0].message.content!);
	} catch (error) {
		console.log(error);
	}
}
