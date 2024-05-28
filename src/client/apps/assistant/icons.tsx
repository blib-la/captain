import GoogleIcon from "@mui/icons-material/Google";
import type { ReactNode } from "react";

import AnthropicIcon from "@/client/atoms/icons/anthropic";
import ChatGPTIcon from "@/client/atoms/icons/chat-gpt";
import MistralIcon from "@/client/atoms/icons/mistral";

export const assistantIcons: Record<string, ReactNode> = {
	gpt: <ChatGPTIcon />,
	claude: <AnthropicIcon />,
	mistral: <MistralIcon />,
	"models/gemini": <GoogleIcon />,
};
