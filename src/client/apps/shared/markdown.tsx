import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import type { ReactNode } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGemoji from "remark-gemoji";
interface ComponentProperties {
	children?: ReactNode;
}

export const components: Partial<Components> = {
	h1: ({ children }: ComponentProperties) => (
		<Typography level="h1" component="h1" my={2}>
			{children}
		</Typography>
	),
	h2: ({ children }: ComponentProperties) => (
		<Typography level="h2" component="h2" my={2}>
			{children}
		</Typography>
	),
	h3: ({ children }: ComponentProperties) => (
		<Typography level="h3" component="h3" my={2}>
			{children}
		</Typography>
	),
	h4: ({ children }: ComponentProperties) => (
		<Typography level="h4" component="h4" my={2}>
			{children}
		</Typography>
	),
	h5: ({ children }: ComponentProperties) => (
		<Typography level="title-md" component="h5" my={2}>
			{children}
		</Typography>
	),
	h6: ({ children }: ComponentProperties) => (
		<Typography level="title-sm" component="h6" my={1}>
			{children}
		</Typography>
	),
	p: ({ children }: ComponentProperties) => (
		<Typography component="p" my={1}>
			{children}
		</Typography>
	),
	strong: ({ children }: ComponentProperties) => (
		<Typography component="strong">{children}</Typography>
	),
	em: ({ children }: ComponentProperties) => <Typography component="em">{children}</Typography>,
	ul: ({ children }: ComponentProperties) => (
		<Typography component="ul" my={1} sx={{ display: "block" }}>
			{children}
		</Typography>
	),
	li: ({ children }: ComponentProperties) => <Typography component="li">{children}</Typography>,
	code(properties) {
		const { children, className, node: _node, ...rest } = properties;
		const match = /language-(\w+)/.exec(className || "");
		return match ? (
			<SyntaxHighlighter
				{...(rest as SyntaxHighlighterProps)}
				PreTag="div"
				language={match[1]}
				style={materialDark}
			>
				{String(children).replace(/\n$/, "")}
			</SyntaxHighlighter>
		) : (
			<code {...rest} className={className}>
				{children}
			</code>
		);
	},
};

export function Markdown({ markdown }: { markdown: string }) {
	return (
		<Box sx={{ "*": { userSelect: "text" } }}>
			<ReactMarkdown components={components} remarkPlugins={[remarkGemoji]}>
				{markdown}
			</ReactMarkdown>
		</Box>
	);
}
