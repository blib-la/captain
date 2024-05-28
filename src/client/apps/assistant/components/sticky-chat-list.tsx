import AddCommentIcon from "@mui/icons-material/AddComment";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import type { ColorPaletteProp } from "@mui/joy/styles";
import Typography from "@mui/joy/Typography";
import { useTranslation } from "next-i18next";

export function StickyChatList({ onNew, color }: { onNew(): void; color: ColorPaletteProp }) {
	const { t } = useTranslation(["labels", "common"]);
	return (
		<ListItem variant="soft">
			<ListItemButton color={color} onClick={onNew}>
				<ListItemDecorator>
					<AddCommentIcon />
				</ListItemDecorator>
				<ListItemContent>
					<Typography noWrap>{t("labels:newChat")}</Typography>
				</ListItemContent>
			</ListItemButton>
		</ListItem>
	);
}
