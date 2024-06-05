import { localFile } from "@captn/utils/string";
import CopyAllIcon from "@mui/icons-material/CopyAll";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Box from "@mui/joy/Box";
import Chip from "@mui/joy/Chip";
import IconButton from "@mui/joy/IconButton";
import type { LinkProps } from "@mui/joy/Link";
import JoyLink from "@mui/joy/Link";
import Sheet from "@mui/joy/Sheet";
import Switch from "@mui/joy/Switch";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useTranslation } from "next-i18next";
import type { ChangeEvent, ReactNode } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import rehypeFormat from "rehype-format";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkBreaks from "remark-breaks";
import remarkGemoji from "remark-gemoji";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import type { Except } from "type-fest";
import { v4 } from "uuid";

import { handleCaptainAction } from "@/client/ions/handlers/action";
import { LOCAL_PROTOCOL } from "@/shared/constants";

interface ComponentProperties {
	children?: ReactNode;
}
const codeMappers: Record<string, string> = {
	svelte: "html",
	vue: "html",
};

const codeModeAtom = atomWithStorage("code-mode", "dark");

export function Code({
	language,
	code,
	...rest
}: { code: string } & Except<SyntaxHighlighterProps, "children">) {
	const { t } = useTranslation(["labels"]);
	const [mode, setMode] = useAtom(codeModeAtom);
	return (
		<Sheet color="primary" variant="soft" sx={{ p: 0.5 }}>
			<Sheet
				color="primary"
				variant="soft"
				sx={{
					position: "sticky",
					zIndex: 1,
					top: 0,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				{language ? (
					<Chip size="sm" color="primary" variant="outlined">
						{language.toUpperCase()}
					</Chip>
				) : (
					<Box />
				)}
				<Box>
					<Switch
						checked={mode === "dark"}
						startDecorator={<LightModeIcon />}
						endDecorator={<DarkModeIcon />}
						onChange={(event: ChangeEvent<HTMLInputElement>) => {
							setMode(event.target.checked ? "dark" : "light");
						}}
					/>
					<IconButton
						color="primary"
						variant="soft"
						aria-label={t("labels:copy")}
						onClick={() => {
							navigator.clipboard.writeText(code);
						}}
					>
						<CopyAllIcon />
					</IconButton>
				</Box>
			</Sheet>
			<Box sx={{ overflowX: "auto" }}>
				<SyntaxHighlighter
					{...(rest as SyntaxHighlighterProps)}
					wrapLongLines
					PreTag="div"
					language={language && (codeMappers[language] ?? language)}
					style={mode === "dark" ? oneDark : oneLight}
				>
					{code}
				</SyntaxHighlighter>
			</Box>
		</Sheet>
	);
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
		<Typography component="div" my={1}>
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
	ol: ({ children }: ComponentProperties) => (
		<Typography component="ol" my={1} sx={{ display: "block" }}>
			{children}
		</Typography>
	),
	li: ({ children }: ComponentProperties) => (
		<Typography component="li" sx={{ display: "list-item" }}>
			{children}
		</Typography>
	),
	a({ children, href, node: _node, ...properties }) {
		return href ? (
			<JoyLink
				{...(properties as LinkProps)}
				href={href}
				onClick={event => {
					event.preventDefault();
					handleCaptainAction(
						{
							score: 1,
							payload: {
								id: "preview",
								language: "en",
								type: "app",
								label: "Preview",
								creatorID: "Blibla",
								content: "",
							},
						},
						{
							id: v4(),
							fileType: "story",
							filePath: href.replace(`${LOCAL_PROTOCOL}://`, ""),
						}
					);
				}}
			>
				{children}
			</JoyLink>
		) : (
			<Typography>{children}</Typography>
		);
	},
	code(properties) {
		const { children, className, node: _node, ...rest } = properties;
		const match = /language-(\w+)/.exec(className || "");
		return match ? (
			<Code
				{...(rest as SyntaxHighlighterProps)}
				language={match[1]}
				code={String(children).replace(/\n$/, "")}
			/>
		) : (
			<code {...rest} className={className}>
				{children}
			</code>
		);
	},
	pre({ children }) {
		return <div>{children}</div>;
	},
	img({ src, alt }: { src?: string; alt?: string }) {
		if (!src) {
			return null;
		}

		return (
			<Sheet
				component="figure"
				sx={{
					display: "flex",
					flexDirection: "column",
					height: 700,
					p: 0,
					ml: 0,
					mr: 1,
					my: 0.5,
				}}
			>
				<Box sx={{ flex: 1, position: "relative" }}>
					<Box
						sx={{
							display: "flex",
							gap: 1,
							position: "absolute",
							top: 0,
							right: 0,
						}}
					>
						<IconButton
							variant="soft"
							color="neutral"
							onClick={event => {
								event.preventDefault();
								handleCaptainAction(
									{
										score: 1,
										payload: {
											id: "preview",
											language: "en",
											type: "app",
											label: "Preview",
											creatorID: "Blibla",
											content: "",
										},
									},
									{
										id: v4(),
										fileType: "image",
										filePath: src.replace(`${LOCAL_PROTOCOL}://`, ""),
									}
								);
							}}
						>
							<OpenInNewIcon />
						</IconButton>
					</Box>
					<Box
						component="img"
						src={src}
						alt={alt}
						sx={{
							position: "absolute",
							inset: 0,
							width: "100%",
							height: "100%",
							objectFit: "contain",
							objectPosition: "center",
						}}
					/>
				</Box>
				<Typography level="body-xs" component="figcaption">
					{alt}
				</Typography>
			</Sheet>
		);
	},
};

export function Markdown({ markdown }: { markdown: string }) {
	return (
		<Box sx={{ "*": { userSelect: "text" } }}>
			<ReactMarkdown
				components={components}
				remarkPlugins={[
					remarkParse,
					remarkBreaks,
					remarkGfm,
					remarkGemoji,
					[remarkRehype, { allowDangerousHtml: true }],
					rehypeRaw,
					rehypeFormat,
					rehypeStringify,
				]}
				urlTransform={url => {
					if (url.startsWith("http")) {
						return url;
					}

					return localFile(url);
				}}
			>
				{markdown}
			</ReactMarkdown>
			<Box sx={{ clear: "both" }} />
		</Box>
	);
}
