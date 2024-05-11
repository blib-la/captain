import { useRequiredDownloads } from "@captn/react/use-required-downloads";
import type { RequiredDownload } from "@captn/utils/types";
import WarningIcon from "@mui/icons-material/Warning";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import LinearProgress from "@mui/joy/LinearProgress";
import Snackbar from "@mui/joy/Snackbar";
import Typography from "@mui/joy/Typography";
import { useTranslation } from "next-i18next";

export function RequiredModelsAlert({
	inline,
	downloads,
}: {
	inline?: boolean;
	downloads: RequiredDownload[];
}) {
	const { t } = useTranslation(["common", "labels"]);

	const { isCompleted, downloadCount, isDownloading, percent, requiredDownloads, download } =
		useRequiredDownloads(downloads);

	return (
		<Snackbar
			open={!isCompleted}
			variant="soft"
			color="warning"
			startDecorator={<WarningIcon />}
			sx={{
				position: inline ? "relative" : "fixed",
				bottom: inline ? "auto" : "var(--Snackbar-inset)",
				right: inline ? "auto" : "var(--Snackbar-inset)",
			}}
			slotProps={{
				endDecorator: {
					sx: { alignSelf: "flex-end" },
				},
				startDecorator: {
					sx: { alignSelf: "flex-start", mt: 0.25 },
				},
			}}
			endDecorator={
				<Button
					disabled={isDownloading}
					size="sm"
					variant="solid"
					color="warning"
					onClick={download}
				>
					{t("labels:download")}
				</Button>
			}
		>
			<Box>
				<Typography level="title-lg" component="h2" sx={{ mb: 2 }}>
					{t("texts:essentialModelDownloads")}
				</Typography>
				<Typography>{t("texts:activateFullPower")}</Typography>

				<Typography sx={{ mt: 1 }}>{t("labels:clickDownloadToStart")}</Typography>
				<Typography sx={{ mt: 1 }}>
					{t("labels:downloadedOf", {
						downloaded: downloadCount,
						downloads: requiredDownloads.length,
					})}
				</Typography>
				<LinearProgress
					determinate
					variant="solid"
					color="warning"
					value={percent * 100}
					sx={{
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						borderRadius: 0,
					}}
				/>
			</Box>
		</Snackbar>
	);
}
