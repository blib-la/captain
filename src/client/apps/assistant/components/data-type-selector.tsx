import FindInPageIcon from "@mui/icons-material/FindInPage";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Switch from "@mui/joy/Switch";
import { useTranslation } from "next-i18next";
import type { ChangeEvent as ReactChangeEvent } from "react";

import { PopupButton } from "@/client/apps/shared/components";
import type { DataTypeItem } from "@/shared/types/assistant";

export function DataTypeSelector({
	dataTypes,
	onChange,
}: {
	dataTypes: DataTypeItem[];
	onChange(id: string, checked?: boolean): void;
}) {
	const { t } = useTranslation(["labels"]);
	return (
		<PopupButton label={t("labels:dataUsage")} icon={<FindInPageIcon />}>
			<List sx={{ minWidth: 200 }}>
				{dataTypes.map(dataType => (
					<ListItem key={dataType.id}>
						<ListItemButton tabIndex={-1} component="label" selected={dataType.active}>
							<ListItemDecorator>
								<Switch
									checked={Boolean(dataType.active)}
									onChange={(event: ReactChangeEvent<HTMLInputElement>) => {
										onChange(dataType.id, event.target.checked);
									}}
								/>
							</ListItemDecorator>
							<ListItemContent>{t(`labels:${dataType.type}`)}</ListItemContent>
						</ListItemButton>
					</ListItem>
				))}
			</List>
		</PopupButton>
	);
}
