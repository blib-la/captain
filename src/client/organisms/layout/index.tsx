import BrushIcon from "@mui/icons-material/Brush";
import CollectionsIcon from "@mui/icons-material/Collections";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import GitHubIcon from "@mui/icons-material/GitHub";
import InventoryIcon from "@mui/icons-material/Inventory";
import RateReviewIcon from "@mui/icons-material/RateReview";
import SettingsIcon from "@mui/icons-material/Settings";
import StorefrontIcon from "@mui/icons-material/Storefront";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import { useTranslation } from "next-i18next";
import type { ReactNode } from "react";

import { Logo } from "@/atoms/logo";
import { SidebarButton } from "@/organisms/sidebar-button";
import { TitleBar } from "@/organisms/title-bar";

export function Layout({ children }: { children?: ReactNode }) {
	const { t } = useTranslation(["common", "labels"]);

	return (
		<Box
			sx={{
				height: "100dvh",
				overflow: "hidden",
				display: "grid",
				gridTemplateColumns: {
					xs: "44px 1fr",
					xl: "228px 1fr",
				},
				gridTemplateRows: "36px 1fr",
			}}
		>
			<TitleBar />
			<Stack sx={{ overflow: "hidden" }}>
				<SidebarButton
					href="/dashboard"
					startDecorator={<DashboardIcon />}
					data-testid="sidebar-dashboard"
				>
					{t("labels:dashboard")}
				</SidebarButton>
				<SidebarButton
					disabled
					href="/home"
					startDecorator={<CollectionsIcon />}
					data-testid="sidebar-datasets"
				>
					{t("common:datasets")}
				</SidebarButton>
				<SidebarButton
					disabled
					href="/marketplace"
					startDecorator={<StorefrontIcon />}
					data-testid="sidebar-marketplace"
				>
					{t("common:marketplace")}
				</SidebarButton>
				<SidebarButton
					disabled
					href="/inventory"
					startDecorator={<InventoryIcon />}
					data-testid="sidebar-inventory"
				>
					{t("common:inventory")}
				</SidebarButton>
				<SidebarButton
					disabled
					href="/training"
					startDecorator={<FitnessCenterIcon />}
					data-testid="sidebar-training"
				>
					{t("common:training")}
				</SidebarButton>
				<SidebarButton
					href="/live-painting"
					startDecorator={<BrushIcon />}
					data-testid="sidebar-live-painting"
				>
					{t("labels:livePainting")}
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
				<SidebarButton disabled href="/feedback" startDecorator={<RateReviewIcon />}>
					{t("common:feedback")}
				</SidebarButton>
				<SidebarButton
					href="/settings"
					startDecorator={<SettingsIcon />}
					data-testid="sidebar-settings"
				>
					{t("common:settings")}
				</SidebarButton>
			</Stack>
			<Sheet variant="plain" sx={{ position: "relative", overflow: "hidden" }}>
				{children}
			</Sheet>
		</Box>
	);
}
