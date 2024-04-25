import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import type { RecursiveCharacterTextSplitterParams } from "langchain/text_splitter";

export async function splitDocument(
	type: string,
	text: string,
	config: Partial<RecursiveCharacterTextSplitterParams>
) {
	let splitter = null;

	switch (type) {
		case "typescript":
		case "javascript":
		case "ts":
		case "js": {
			splitter = RecursiveCharacterTextSplitter.fromLanguage("js", config);
			break;
		}

		case "md":
		case "markdown": {
			splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", config);
			break;
		}

		default: {
			break;
		}
	}

	if (splitter === null) {
		throw new Error("no splitter specified");
	}

	return splitter.splitText(text);
}
