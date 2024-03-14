export interface FormInput {
	length: "short" | "medium" | "long";
	style: "magicalMystery" | "adventure" | "sciFi" | "historical" | "custom";
	customStyle?: string;
	characters?: string;
	mood: "joyful" | "sad" | "suspenseful" | "relaxing" | "exciting";
}

export interface StoryRequest {
	imageDescriptions: string;
	locale: string;
	options: FormInput;
	maxTokens?: number;
}
