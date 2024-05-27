import type { CoreMessage } from "ai";

export interface DataTypeItem {
	id: string;
	type: string;
	active?: boolean;
}

export interface ChatModel {
	label: string;
	model: string;
	pinned?: boolean;
	favorite?: boolean;
	dataTypes?: DataTypeItem[];
	messages: (CoreMessage & Record<string, unknown>)[];
}
