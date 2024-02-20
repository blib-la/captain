import CancelIcon from "@mui/icons-material/Cancel";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import Button from "@mui/joy/Button";
import IconButton from "@mui/joy/IconButton";
import Sheet from "@mui/joy/Sheet";
import { useAtom } from "jotai";
import { useTranslation } from "next-i18next";
import { useState } from "react";

import { datasetsAtom } from "@/ions/atoms";

export function DeleteConfirm({ projectId }: { projectId: string }) {
	const [confirm, setConfirm] = useState(false);
	const [, setDatasets] = useAtom(datasetsAtom);
	const { t } = useTranslation(["common"]);
	return confirm ? (
		<Sheet
			sx={{
				position: "absolute",
				inset: 4,
				zIndex: 2,
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
			}}
		>
			<Button
				color="neutral"
				variant="solid"
				size="sm"
				startDecorator={<CancelIcon />}
				onClick={() => {
					setConfirm(false);
				}}
			>
				{t("common:cancel")}
			</Button>
			<Button
				color="danger"
				variant="solid"
				size="sm"
				startDecorator={<DeleteForeverIcon />}
				onClick={async () => {
					await window.ipc.deleteDataset(projectId);
					await window.ipc.getDatasets().then((datasets_: any) => {
						setDatasets(datasets_);
					});
				}}
			>
				{t("common:delete")}
			</Button>
		</Sheet>
	) : (
		<IconButton
			className="delete-confirm"
			color="danger"
			variant="solid"
			size="sm"
			aria-label={t("common:delete")}
			sx={{ position: "absolute", top: 4, right: 4, zIndex: 2 }}
			onClick={() => {
				setConfirm(true);
			}}
		>
			<DeleteForeverIcon />
		</IconButton>
	);
}
