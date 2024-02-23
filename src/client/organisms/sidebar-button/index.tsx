import Box from "@mui/joy/Box";
import type { ButtonProps } from "@mui/joy/Button";
import Button from "@mui/joy/Button";
import Tooltip from "@mui/joy/Tooltip";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import type { Except } from "type-fest";

export function SidebarButton({
	children,
	href,
	target,
	disabled,
	...properties
}: Except<ButtonProps<"a">, "component">) {
	const {
		i18n: { language: locale },
	} = useTranslation(["common"]);
	const { pathname } = useRouter();
	const href_ = `/${locale}${href}`;
	const isActive = pathname.replace("/[locale]", "") === href;

	return (
		<Tooltip
			placement="right"
			title={children}
			sx={{ display: { xs: disabled ? "none" : undefined, xl: "none" } }}
		>
			<Box
				sx={{
					width: "100%",
					"--focus-outline-offset": "-2px",
					display: disabled ? "none" : "flex",
				}}
			>
				{href && !target ? (
					<Link legacyBehavior passHref href={href_}>
						<Button
							{...properties}
							disabled={disabled}
							size="lg"
							component="a"
							color={isActive ? "primary" : "neutral"}
							slotProps={{
								startDecorator: { sx: { "--Icon-margin": "0 0 0 -2px" } },
							}}
							sx={{
								justifyContent: "flex-start",
								pl: 1.5,
								flex: 1,
								whiteSpace: "nowrap",
								overflow: "hidden",
							}}
						>
							{children}
						</Button>
					</Link>
				) : (
					<Button
						{...properties}
						disabled={disabled}
						size="lg"
						component={href ? "a" : "button"}
						href={href}
						target={target}
						slotProps={{
							startDecorator: { sx: { "--Icon-margin": "0 0 0 -2px" } },
						}}
						sx={{
							justifyContent: "flex-start",
							pl: 1.5,
							flex: 1,
							whiteSpace: "nowrap",
							overflow: "hidden",
							".JoyButton-startDecorator": {
								"--Icon-margin": "0 0 0 -1px",
							},
						}}
					>
						{children}
					</Button>
				)}
			</Box>
		</Tooltip>
	);
}
