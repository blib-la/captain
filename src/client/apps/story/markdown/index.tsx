import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import type { ReactNode } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";

interface ComponentProperties {
	children?: ReactNode;
}

export function components(images?: string[]): Partial<Components> {
	return {
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
		em: ({ children }: ComponentProperties) => (
			<Typography component="em">{children}</Typography>
		),
		ul: ({ children }: ComponentProperties) => (
			<Typography component="ul" my={1} sx={{ display: "block" }}>
				{children}
			</Typography>
		),
		li: ({ children }: ComponentProperties) => (
			<Typography component="li">{children}</Typography>
		),
		img({ src, alt }: { src?: string; alt?: string }) {
			if (!src) {
				return null;
			}

			const index = Number.parseInt(src, 10);
			return images ? (
				images[index] && (
					<Box
						component="img"
						src={images[index]}
						alt={alt}
						sx={{
							my: 1,
							mr: {
								md: index % 2 ? 0 : 2,
							},
							ml: {
								md: index % 2 ? 2 : 0,
							},
							float: {
								md: index % 2 ? "right" : "left",
							},
							clear: { md: index % 2 ? "inline-end" : "inline-start" },
							width: {
								xs: "100%",
								md: "30%",
							},
							maxWidth: {
								md: 512,
							},
							height: "auto",
						}}
					/>
				)
			) : (
				<Box
					component="img"
					src={src}
					alt={alt}
					sx={{
						my: 1,
						mr: {
							md: (index - 1) % 2 ? 0 : 2,
						},
						ml: {
							md: (index - 1) % 2 ? 2 : 0,
						},
						float: {
							md: (index - 1) % 2 ? "right" : "left",
						},
						clear: { md: (index - 1) % 2 ? "inline-end" : "inline-start" },
						width: {
							xs: "100%",
							md: "30%",
						},
						maxWidth: {
							md: 512,
						},
						height: "auto",
					}}
				/>
			);
		},
	};
}

export function Markdown({ markdown, images }: { markdown: string; images?: string[] }) {
	return (
		<Box sx={{ "*": { userSelect: "text" } }}>
			<ReactMarkdown components={components(images)}>{markdown}</ReactMarkdown>
		</Box>
	);
}
