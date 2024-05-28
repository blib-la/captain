import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import Snackbar from "@mui/joy/Snackbar";
import Typography from "@mui/joy/Typography";
import { useTranslation } from "next-i18next";

export function MessageStack({
	provider,
	isWarningOpen,
	error,
	onClose,
}: {
	provider: string;
	isWarningOpen: boolean;
	error: string;
	onClose(): void;
}) {
	const { t } = useTranslation(["labels", "texts"]);
	return (
		<Box
			sx={{
				position: "absolute",
				bottom: 0,
				right: 0,
				m: 1,
				maxHeight: 500,
				overflow: "auto",
			}}
		>
			<Box sx={{ overflow: "hidden", display: "flex", flexDirection: "column", gap: 1 }}>
				<Snackbar
					color="danger"
					variant="soft"
					open={Boolean(error)}
					sx={{ position: "relative", bottom: "unset", right: "unset" }}
					endDecorator={
						<IconButton aria-label={t("labels:close")} onClick={onClose}>
							<CloseIcon />
						</IconButton>
					}
				>
					<Typography>{error}</Typography>
				</Snackbar>
				<Snackbar
					color="warning"
					variant="soft"
					open={isWarningOpen}
					sx={{ position: "relative", bottom: "unset", right: "unset" }}
				>
					<Typography>{t("texts:enterCommonAPIKey", { provider })}</Typography>
				</Snackbar>
			</Box>
		</Box>
	);
}
