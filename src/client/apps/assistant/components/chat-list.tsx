import { useSDK } from "@captn/react/use-sdk";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PushPinIcon from "@mui/icons-material/PushPin";
import StarIcon from "@mui/icons-material/Star";
import Dropdown from "@mui/joy/Dropdown";
import IconButton from "@mui/joy/IconButton";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Menu from "@mui/joy/Menu";
import MenuButton from "@mui/joy/MenuButton";
import MenuItem from "@mui/joy/MenuItem";
import type { ColorPaletteProp } from "@mui/joy/styles";
import Typography from "@mui/joy/Typography";
import { useTranslation } from "next-i18next";
import type { Except } from "type-fest";

import { APP_ID } from "@/client/apps/assistant/constants";
import type { ChatModel } from "@/shared/types/assistant";

export function ChatList({
	chats,
	chatId,
	color,
	onDelete,
	onChatSelect,
}: {
	chatId: string;
	chats: (Except<ChatModel, "messages"> & { id: string })[];
	color: ColorPaletteProp;
	onDelete?(chatId: string): void;
	onChatSelect(chatId: string): void;
}) {
	const { t } = useTranslation(["labels", "common"]);
	const { send } = useSDK<unknown, object>(APP_ID, {});
	return (
		<List
			sx={{
				flex: 1,
				width: "100%",
				overflowY: "auto",
				overflowX: "hidden",
				flexShrink: 0,
			}}
		>
			{chats
				.sort((a, b) => {
					if (a.pinned && b.pinned) {
						return 0;
					}

					return a.pinned ? -1 : 1;
				})
				.map(chat => (
					<ListItem
						key={chat.id}
						sx={{
							"& .MuiListItem-endAction": {
								mr: -0.75,
							},
						}}
						endAction={
							<Dropdown>
								<MenuButton
									aria-label={t("common:menu")}
									slots={{ root: IconButton }}
									slotProps={{
										root: {
											variant: "plain",
											color: "neutral",
											sx: {
												"&:focus-visible": {
													zIndex: "unset",
													outlineOffset: -2,
												},
											},
										},
									}}
								>
									<MoreVertIcon />
								</MenuButton>
								<Menu color="neutral" variant="plain">
									<MenuItem
										onClick={() => {
											send({
												action: "assistant:update",
												payload: {
													id: chat.id,
													update: { pinned: !chat.pinned },
												},
											});
										}}
									>
										<ListItemDecorator
											sx={theme => ({
												"--Icon-color": chat.pinned
													? theme.vars.palette.primary["500"]
													: "currentColor",
											})}
										>
											<PushPinIcon />
										</ListItemDecorator>{" "}
										{t("labels:pin")}
									</MenuItem>
									<MenuItem
										onClick={() => {
											send({
												action: "assistant:update",
												payload: {
													id: chat.id,
													update: {
														favorite: !chat.favorite,
													},
												},
											});
										}}
									>
										<ListItemDecorator
											sx={theme => ({
												"--Icon-color": chat.favorite
													? theme.vars.palette.primary["500"]
													: "currentColor",
											})}
										>
											<StarIcon />
										</ListItemDecorator>{" "}
										{t("labels:favorite")}
									</MenuItem>
									<MenuItem
										onClick={() => {
											if (onDelete) {
												onDelete(chat.id);
											}
										}}
									>
										<ListItemDecorator
											sx={theme => ({
												"--Icon-color": theme.vars.palette.red["500"],
											})}
										>
											<DeleteForeverIcon />
										</ListItemDecorator>{" "}
										{t("labels:delete")}
									</MenuItem>
								</Menu>
							</Dropdown>
						}
					>
						<ListItemButton
							selected={chatId === chat.id}
							color={color}
							sx={{
								"&.Mui-focusVisible": {
									zIndex: "unset",
									outlineOffset: -2,
								},
							}}
							onClick={() => {
								if (onChatSelect) {
									onChatSelect(chat.id);
								}
							}}
						>
							<Typography noWrap>{chat.label}</Typography>
						</ListItemButton>
					</ListItem>
				))}
		</List>
	);
}
