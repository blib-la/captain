export interface MessageModel {
	id: string;
	content: string;
	role: "assistant" | "user";
	model?: string;
}
