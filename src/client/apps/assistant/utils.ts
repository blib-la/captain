export function getModelInfo(modelPrefix: string) {
	let apiKeyGetter = "";
	let provider = "";

	switch (modelPrefix) {
		case "gpt": {
			apiKeyGetter = "hasOpenAiApiKey";
			provider = "OpenAI";
			break;
		}

		case "claude": {
			apiKeyGetter = "hasAnthropicApiKey";
			provider = "Anthropic";
			break;
		}

		case "mistral": {
			apiKeyGetter = "hasMistralApiKey";
			provider = "Mistral";
			break;
		}

		case "models/gemini": {
			apiKeyGetter = "hasGoogleGenerativeAiApiKey";
			provider = "Google";
			break;
		}

		default: {
			break;
		}
	}

	return { apiKeyGetter, provider };
}
