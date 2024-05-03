import Link from "@docusaurus/Link";
import clsx from "clsx";
import type { ComponentProps } from "react";

export interface ButtonProperties extends Omit<ComponentProps<"button">, "children"> {
	label: string;
}

export function Button({ className, label, type = "button", ...rest }: ButtonProperties) {
	return (
		<button type={type} className={clsx("button button--block", className)} {...rest}>
			{label}
		</button>
	);
}

export interface ButtonLinkProperties extends Omit<ComponentProps<"a">, "children"> {
	label: string;
	to?: string;
}

export function ButtonLink({ className, label, to, href, ...rest }: ButtonLinkProperties) {
	if (to) {
		return (
			<Link to={to} className={clsx("button", className)} {...rest}>
				{label}
			</Link>
		);
	}

	if (href) {
		return (
			<a href={href} className={clsx("button", className)} {...rest}>
				{label}
			</a>
		);
	}

	return null;
}
