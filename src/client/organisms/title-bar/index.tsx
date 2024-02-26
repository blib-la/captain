import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CloseIcon from "@mui/icons-material/Close";
import RemoveIcon from "@mui/icons-material/Remove";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { useTranslation } from "next-i18next";

import package_ from "../../../../package.json";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { Logo } from "@/atoms/logo";

export function minimize() {
	window.ipc.send(buildKey([ID.WINDOW], { suffix: ":minimize" }));
}

export function maximize() {
	window.ipc.send(buildKey([ID.WINDOW], { suffix: ":maximize" }));
}

export function close() {
	window.ipc.send(buildKey([ID.WINDOW], { suffix: ":close" }));
}

export function WindowControls({ disableMaximize = true }) {
	const { t } = useTranslation(["labels"]);
	return (
		<Box sx={{ WebkitAppRegion: "no-drag", "--focus-outline-offset": "-2px" }}>
			<IconButton
				aria-label={t("labels:minimize")}
				sx={{ cursor: "default" }}
				onClick={minimize}
			>
				<RemoveIcon sx={{ fontSize: 16 }} />
			</IconButton>
			<IconButton
				disabled={disableMaximize}
				aria-label={t("labels:maximize")}
				sx={{ cursor: "default" }}
				onClick={maximize}
			>
				<CheckBoxOutlineBlankIcon sx={{ fontSize: 16 }} />
			</IconButton>
			<IconButton
				color="danger"
				variant="solid"
				aria-label={t("labels:close")}
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

export function TitleBar({ disableMaximize = false }) {
	return (
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
						justifyContent: "center",
						width: 44,
						bgcolor: "primary.500",
						"--Icon-color": "common.white",
					}}
				>
					<Logo sx={{ height: 20, width: 20 }} />
				</Box>
			</Box>

			<Typography level="body-xs" sx={{ pl: 1 }}>
				v{package_.version}
			</Typography>
			<Box sx={{ flex: 1 }} />
			<WindowControls disableMaximize={disableMaximize} />
		</Sheet>
	);
}
