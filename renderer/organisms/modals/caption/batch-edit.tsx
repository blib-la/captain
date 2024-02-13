import FindReplaceIcon from "@mui/icons-material/FindReplace";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import DialogActions from "@mui/joy/DialogActions";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import IconButton from "@mui/joy/IconButton";
import Input from "@mui/joy/Input";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import ModalDialog from "@mui/joy/ModalDialog";
import Stack from "@mui/joy/Stack";
import SvgIcon from "@mui/joy/SvgIcon";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai/index";
import { useTranslation } from "next-i18next";
import React, { useId, useState } from "react";
import { useForm } from "react-hook-form";

import { editCaptionScopeAtom, imagesAtom } from "@/ions/atoms";
import { EditCaptionScope } from "@/organisms/modals/caption/index";

export function RegexIcon() {
	return (
		<SvgIcon>
			<path d="M16,16.92C15.67,16.97 15.34,17 15,17C14.66,17 14.33,16.97 14,16.92V13.41L11.5,15.89C11,15.5 10.5,15 10.11,14.5L12.59,12H9.08C9.03,11.67 9,11.34 9,11C9,10.66 9.03,10.33 9.08,10H12.59L10.11,7.5C10.3,7.25 10.5,7 10.76,6.76V6.76C11,6.5 11.25,6.3 11.5,6.11L14,8.59V5.08C14.33,5.03 14.66,5 15,5C15.34,5 15.67,5.03 16,5.08V8.59L18.5,6.11C19,6.5 19.5,7 19.89,7.5L17.41,10H20.92C20.97,10.33 21,10.66 21,11C21,11.34 20.97,11.67 20.92,12H17.41L19.89,14.5C19.7,14.75 19.5,15 19.24,15.24V15.24C19,15.5 18.75,15.7 18.5,15.89L16,13.41V16.92H16V16.92M5,19A2,2 0 0,1 7,17A2,2 0 0,1 9,19A2,2 0 0,1 7,21A2,2 0 0,1 5,19H5Z" />
		</SvgIcon>
	);
}

export function TextSearchIcon() {
	return (
		<SvgIcon>
			<path d="M19.31 18.9L22.39 22L21 23.39L17.88 20.32C17.19 20.75 16.37 21 15.5 21C13 21 11 19 11 16.5C11 14 13 12 15.5 12C18 12 20 14 20 16.5C20 17.38 19.75 18.21 19.31 18.9M15.5 19C16.88 19 18 17.88 18 16.5C18 15.12 16.88 14 15.5 14C14.12 14 13 15.12 13 16.5C13 17.88 14.12 19 15.5 19M21 4V6H3V4H21M3 16V14H9V16H3M3 11V9H21V11H18.97C17.96 10.37 16.77 10 15.5 10C14.23 10 13.04 10.37 12.03 11H3Z" />
		</SvgIcon>
	);
}

export function SuffixIcon() {
	return (
		<SvgIcon>
			<path d="M13,15L15.5,17.5L16.92,16.08L12,11.16L7.08,16.08L8.5,17.5L11,15V21H13V15M3,3H21V5H3V3M3,7H13V9H3V7Z" />
		</SvgIcon>
	);
}

export function PrefixIcon() {
	return (
		<SvgIcon>
			<path d="M13,9L15.5,6.5L16.92,7.92L12,12.84L7.08,7.92L8.5,6.5L11,9V3H13V9M3,15H21V17H3V15M3,19H13V21H3V19Z" />
		</SvgIcon>
	);
}

export function BatchEditModal({
	open,
	onClose,
	onStart,
	onDone,
}: {
	onClose(): void | Promise<void>;
	onStart?(): void | Promise<void>;
	onDone?(): void | Promise<void>;
	open: boolean;
}) {
	const FindReplaceId = useId();
	const { t } = useTranslation(["common"]);
	const [regex, setRegex] = useState(false);
	const [images, setImages] = useAtom(imagesAtom);
	const [editCaptionScope] = useAtom(editCaptionScopeAtom);
	const { register, reset, handleSubmit } = useForm({
		defaultValues: {
			find: "",
			replace: "",
			prefix: "",
			suffix: "",
		},
	});

	return (
		<Modal keepMounted open={open} onClose={onClose}>
			<ModalDialog
				sx={{
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
					pt: 6,
				}}
			>
				<ModalClose aria-label={t("common:close")} />
				<EditCaptionScope />
				<Typography>{t("common:batchEdit")}:</Typography>
				<Box
					component="form"
					onSubmit={handleSubmit(data => {
						const newData = images.map(image => {
							if (editCaptionScope === "empty" && image.caption) {
								return image;
							}

							if (editCaptionScope === "selected" && !image.selected) {
								return image;
							}

							if (data.find) {
								const pattern = regex ? new RegExp(data.find, "ig") : data.find;
								image.caption = image.caption.replace(pattern, data.replace);
							}

							image.caption = data.prefix + image.caption + data.suffix;
							return image;
						});
						setImages(newData);
						console.log(newData);
						window.ipc.batchEditCaption(newData);
						reset();
						onClose();
					})}
				>
					<Stack sx={{ width: 600, gap: 1 }}>
						<Box>
							<Box
								component="label"
								htmlFor={FindReplaceId}
								id={`${FindReplaceId}-label`}
								sx={{
									display: "flex",
									alignItems: "center",
									alignSelf: "flex-start",
									flexWrap: "wrap",
									fontSize: "sm",
									m: "0 0 0.375rem 0",
								}}
							>
								{t("common:searchAndReplace")}
							</Box>
							<Stack gap={2}>
								<Input
									id={FindReplaceId}
									{...register("find")}
									aria-labelledby={`${FindReplaceId}-label`}
									startDecorator={<TextSearchIcon />}
									endDecorator={
										<Tooltip title={t("common:regexp")}>
											<IconButton
												aria-label={t("common:regexp")}
												color={regex ? "primary" : "neutral"}
												variant={regex ? "soft" : "plain"}
												onClick={() => {
													setRegex(previousState => !previousState);
												}}
											>
												<RegexIcon />
											</IconButton>
										</Tooltip>
									}
								/>
								<Input
									{...register("replace")}
									aria-labelledby={`${FindReplaceId}-label`}
									startDecorator={<FindReplaceIcon />}
								/>
							</Stack>
						</Box>
						<FormControl>
							<FormLabel>{t("common:prefix")}</FormLabel>
							<Input {...register("prefix")} startDecorator={<PrefixIcon />} />
						</FormControl>
						<FormControl>
							<FormLabel>{t("common:suffix")}</FormLabel>
							<Input {...register("suffix")} startDecorator={<SuffixIcon />} />
						</FormControl>
					</Stack>
					<DialogActions>
						<Button type="submit">{t("common:submit")}</Button>
					</DialogActions>
				</Box>
			</ModalDialog>
		</Modal>
	);
}
