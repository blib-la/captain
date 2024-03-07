import Box from "@mui/joy/Box";
import type { ButtonProps } from "@mui/joy/Button";
import Button from "@mui/joy/Button";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import type { Except } from "type-fest";

export function TabButton({
	children,
	href,
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
		<Box
			sx={{
				display: disabled ? "none" : "flex",
				"--focus-outline-offset": "-2px",
			}}
		>
			<Link legacyBehavior passHref href={href_}>
				<Button
					{...properties}
					disabled={disabled}
					size="md"
					component="a"
					color="neutral"
					variant={isActive ? "soft" : "plain"}
					slotProps={{
						startDecorator: { sx: { "--Icon-margin": "0 0 0 -2px" } },
					}}
					sx={{
						whiteSpace: "nowrap",
						overflow: "hidden",
					}}
				>
					{children}
				</Button>
			</Link>
		</Box>
	);
}
