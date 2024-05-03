import type { ButtonProperties, ButtonLinkProperties } from "@site/src/components/button";
import { Button, ButtonLink } from "@site/src/components/button";
import clsx from "clsx";
import type { ReactNode } from "react";

import styles from "./card.module.css";

export interface CardButtonProperties extends ButtonProperties {
	__type: "button";
}

export interface CardLinkProperties extends ButtonLinkProperties {
	__type: "link";
}

export interface CardProperties {
	title?: string;
	children: ReactNode;
	media?: ReactNode;
	className?: string;
	button?: CardButtonProperties | CardLinkProperties;
}

export function Card({ title, media, children, className, button }: CardProperties) {
	return (
		<div className={clsx("card margin-vert--md shadow--lw", className)}>
			{title && (
				<div className="card__header margin-bottom--md">
					<h3>{title}</h3>
				</div>
			)}
			{media && <div className={clsx(styles.media, "card__media")}>{media}</div>}
			<div className="card__body">{children}</div>

			{button && (
				<div className="card__footer">
					{button.__type === "button" ? (
						<Button
							label={button.label}
							className={clsx(
								"button button--secondary button--block",
								button.className
							)}
							onClick={button.onClick}
						/>
					) : (
						<ButtonLink
							label={button.label}
							to={button.to}
							href={button.href}
							className={button.className}
						/>
					)}
				</div>
			)}
		</div>
	);
}
