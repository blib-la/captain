import type { ColorPaletteProp } from "@mui/joy/styles";

export const APP_ID = "assistant";
export const modelColors: Record<string, ColorPaletteProp> = {
	"gpt-3.5-turbo": "neutral",
	"gpt-4": "teal",
	"gpt-4-turbo": "violet",
	"gpt-4o": "blue",
	"claude-3-haiku-20240307": "neutral",
	"claude-3-sonnet-20240229": "teal",
	"claude-3-opus-20240229": "blue",
	"mistral-small-latest": "neutral",
	"mistral-large-latest": "teal",
	"models/gemini-1.5-pro-latest": "neutral",
};
export const modelNames: Record<string, string> = {
	"gpt-3.5-turbo": "GPT-3.5 Turbo",
	"gpt-4": "GPT-4",
	"gpt-4-turbo": "GPT-4 Turbo",
	"gpt-4o": "GPT-4o",
	"claude-3-haiku-20240307": "Claude Haiku",
	"claude-3-sonnet-20240229": "Claude Sonnet",
	"claude-3-opus-20240229": "Claude Opus",
	"mistral-small-latest": "Mistral Small",
	"mistral-large-latest": "Mistral Large",
	"models/gemini-1.5-pro-latest": "Gemini 1.5 PRO",
};
export const models = Object.entries(modelNames).map(([id, label]) => ({ id, label }));
