import type { CoreMessage } from "ai";

export interface ChatModel {
	label: string;
	model: string;
	pinned?: boolean;
	favorite?: boolean;
	messages: (CoreMessage & Record<string, unknown>)[];
}
