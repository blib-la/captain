import Link from "@docusaurus/Link";
import clsx from "clsx";

export interface ButtonProperties {
	label: string;
	className?: string;
	onClick(): void;
}

export function Button({ className, label, onClick }: ButtonProperties) {
	return (
		<button
			className={clsx("button button--secondary button--block", className)}
			onClick={onClick}
		>
			{label}
		</button>
	);
}

export interface ButtonLinkProperties {
	label: string;
	className?: string;
	href?: string;
	to?: string;
}

export function ButtonLink({ className, label, to, href }: ButtonLinkProperties) {
	if (to) {
		return (
			<Link to={to} className={clsx("button button--secondary button--block", className)}>
				{label}
			</Link>
		);
	}

	if (href) {
		return (
			<a href={href} className={clsx("button button--secondary button--block", className)}>
				{label}
			</a>
		);
	}

	return null;
}
