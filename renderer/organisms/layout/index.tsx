import BrushIcon from "@mui/icons-material/Brush";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CloseIcon from "@mui/icons-material/Close";
import CollectionsIcon from "@mui/icons-material/Collections";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import GitHubIcon from "@mui/icons-material/GitHub";
import InventoryIcon from "@mui/icons-material/Inventory";
import RateReviewIcon from "@mui/icons-material/RateReview";
import RemoveIcon from "@mui/icons-material/Remove";
import SettingsIcon from "@mui/icons-material/Settings";
import StorefrontIcon from "@mui/icons-material/Storefront";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import type { ButtonProps } from "@mui/joy/Button";
import IconButton from "@mui/joy/IconButton";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import type { ReactNode } from "react";
import type { Except } from "type-fest";

import { APP } from "../../../main/helpers/constants";
import package_ from "../../../package.json";

import { Logo } from "@/atoms/logo";

function SidebarButton({
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
				)}
			</Box>
		</Tooltip>
	);
}

function minimize() {
	window.ipc.send(`${APP}:minimize`);
}

function maximize() {
	window.ipc.send(`${APP}:maximize`);
}

function close() {
	window.ipc.send(`${APP}:close`);
}

function WindowControls() {
	return (
		<Box sx={{ WebkitAppRegion: "no-drag", "--focus-outline-offset": "-2px" }}>
			<IconButton sx={{ cursor: "default" }} onClick={minimize}>
				<RemoveIcon sx={{ fontSize: 16 }} />
			</IconButton>
			<IconButton sx={{ cursor: "default" }} onClick={maximize}>
				<CheckBoxOutlineBlankIcon sx={{ fontSize: 16 }} />
			</IconButton>
			<IconButton
				color="danger"
				variant="solid"
				sx={{
					cursor: "default",
					bgcolor: "transparent",
					color: "text.primary",
					"&:hover": {
						color: "common.white",
					},
				}}
				onClick={close}
			>
				<CloseIcon sx={{ fontSize: 16 }} />
			</IconButton>
		</Box>
	);
}

export function Layout({ children }: { children?: ReactNode }) {
	const { t } = useTranslation(["common"]);

	return (
		<Box
			sx={{
				height: "100dvh",
				overflow: "hidden",
				display: "grid",
				gridTemplateColumns: {
					xs: "36px 1fr",
					xl: "228px 1fr",
				},
				gridTemplateRows: "36px 1fr",
			}}
		>
			<Sheet
				sx={{
					display: "flex",
					gridColumnStart: 1,
					gridColumnEnd: 3,
					WebkitAppRegion: "drag",
					alignItems: "center",
				}}
			>
				<Box
					sx={{
						WebkitAppRegion: "no-drag",
						display: "flex",
						alignItems: "center",
					}}
				>
					<Box
						sx={{
							p: 1,
							display: "flex",
							alignItems: "center",
						}}
					>
						<Logo sx={{ height: 20, width: 20 }} />
					</Box>
				</Box>

				<Typography level="body-xs">v{package_.version}</Typography>
				<Box sx={{ flex: 1 }} />
				<WindowControls />
			</Sheet>
			<Stack sx={{ overflow: "hidden" }}>
				<SidebarButton href="/home" startDecorator={<CollectionsIcon />}>
					{t("common:datasets")}
				</SidebarButton>
				<SidebarButton href="/marketplace" startDecorator={<StorefrontIcon />}>
					{t("common:marketplace")}
				</SidebarButton>
				<SidebarButton disabled href="/inventory" startDecorator={<InventoryIcon />}>
					{t("common:inventory")}
				</SidebarButton>
				<SidebarButton disabled href="/training" startDecorator={<FitnessCenterIcon />}>
					{t("common:training")}
				</SidebarButton>
				<SidebarButton href="/livepainting" startDecorator={<BrushIcon />}>
					{t("common:livePainting")}
				</SidebarButton>
				<Box sx={{ flex: 1 }} />
				<SidebarButton
					href="https://github.com/blib-la/captain"
					target="_blank"
					startDecorator={<GitHubIcon />}
				>
					{t("common:github")}
				</SidebarButton>
				<SidebarButton href="https://blib.la" target="_blank" startDecorator={<Logo />}>
					Blibla
				</SidebarButton>
				<SidebarButton href="/feedback" startDecorator={<RateReviewIcon />}>
					{t("common:feedback")}
				</SidebarButton>
				<SidebarButton href="/settings" startDecorator={<SettingsIcon />}>
					{t("common:settings")}
				</SidebarButton>
			</Stack>
			<Sheet variant="plain" sx={{ position: "relative", overflow: "hidden" }}>
				{children}
			</Sheet>
		</Box>
	);
}
