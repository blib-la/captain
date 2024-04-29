import { AppFrame } from "@captn/joy/app-frame";
import { TitleBar } from "@captn/joy/title-bar";
import Box from "@mui/joy/Box";
import Snackbar from "@mui/joy/Snackbar";
import { useAtom } from "jotai";
import { useTranslation } from "next-i18next";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { requiresRestartAtom } from "@/ions/atoms";
import { TabButton } from "@/organisms/tab";

export function CoreLayout({ children }: { children?: ReactNode }) {
	const { t } = useTranslation(["common", "labels"]);
	const [requiresRestart, setRequiresRestart] = useAtom(requiresRestartAtom);

	useEffect(() => {
		window.ipc.appSettingsStore.get("requiresRestart", false).then(requiresRestart_ => {
			setRequiresRestart(requiresRestart_);
		});
	}, [setRequiresRestart]);

	return (
		<AppFrame
			titleBar={
				<TitleBar>
					<Box
						sx={{
							WebkitAppRegion: "no-drag",
							display: "flex",
							alignItems: "center",
							mx: -1,
						}}
					>
						<TabButton href="/core/dashboard">{t("labels:dashboard")}</TabButton>
						<TabButton href="/core/marketplace">{t("labels:marketplace")}</TabButton>
						<TabButton href="/core/downloads">{t("labels:downloads")}</TabButton>
						<TabButton href="/core/settings">{t("common:settings")}</TabButton>
						<Box sx={{ flex: 1, alignSelf: "stretch", WebkitAppRegion: "drag" }} />
					</Box>
				</TitleBar>
			}
		>
			{children}
			<Snackbar open={requiresRestart} variant="solid" color="warning">
				Restart Captain to activate newly installed apps
			</Snackbar>
		</AppFrame>
	);
}
