import type { CoreMessage } from "ai";

export interface ChatModel {
	label: string;
	pinned?: boolean;
	favorite?: boolean;
	messages: CoreMessage[];
}
