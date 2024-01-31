import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";
import SettingsIcon from "@mui/icons-material/Settings";
import StyleIcon from "@mui/icons-material/Style";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningIcon from "@mui/icons-material/Warning";
import Alert from "@mui/joy/Alert";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import ButtonGroup from "@mui/joy/ButtonGroup";
import IconButton from "@mui/joy/IconButton";
import Link from "@mui/joy/Link";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import ModalDialog from "@mui/joy/ModalDialog";
import Stack from "@mui/joy/Stack";
import { styled } from "@mui/joy/styles";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai/index";
import dynamic from "next/dynamic";
import { Trans, useTranslation } from "next-i18next";
import React, { useEffect, useState } from "react";
import useSWR from "swr";

import { GPT_VISION_OPTIONS, OPENAI_API_KEY } from "../../../../main/helpers/constants";

import { directoryAtom, modelDownloadNoteAtom } from "@/ions/atoms";
import { PasswordField } from "@/organisms/password-field";

export const CodeMirror = dynamic(
	() => import("react-codemirror2").then(module_ => module_.Controlled),
	{ ssr: false }
);
export const StyledEditor = styled(CodeMirror)({
	height: "100%",
	">.CodeMirror": {
		height: "100%",
	},
});

export const defaultGptOptions = {
	batchSize: 10,
	guidelines: `Please caption these images, separate groups by comma, ensure logical groups: "black torn wide pants" instead of "black, torn, wide pants"`,
	exampleResponse: `[
  "a photo of a young man, red hair, blue torn overalls, white background",
  "a watercolor painting of an elderly woman, grey hair, floral print sundress, pink high heels, looking at a castle in the distance"
]`,
};

export function CaptionModal({
	open,
	onClose,
	onStart,
	onDone,
}: {
	onClose(): void | Promise<void>;
	onStart(): void | Promise<void>;
	onDone(): void | Promise<void>;
	open: boolean;
}) {
	const [openAiApiKey, setOpenAiApiKey] = useState("");
	const [gptVisionOptions, setGptVisionOptions] = useState(defaultGptOptions);
	const [confirmGpt, setConfirmGpt] = useState(false);
	const [showGptOptions, setShowGptOptions] = useState(false);
	const [directory] = useAtom(directoryAtom);
	const { t } = useTranslation(["common"]);
	const [modelDownloadNote, setModelDownloadNote] = useAtom(modelDownloadNoteAtom);

	const { data: openApiKeyData } = useSWR(OPENAI_API_KEY);
	const { data: gptVisionData } = useSWR(GPT_VISION_OPTIONS);

	useEffect(() => {
		if (openApiKeyData) {
			setOpenAiApiKey(openApiKeyData);
		}
	}, [openApiKeyData]);

	useEffect(() => {
		if (gptVisionData) {
			setGptVisionOptions(
				gptVisionData as {
					batchSize: number;
					guidelines: string;
					exampleResponse: string;
				}
			);
		}
	}, [gptVisionData]);

	return (
		<Modal keepMounted open={open} onClose={onClose}>
			<ModalDialog
				sx={{
					display: "flex",
					flexDirection: "column",
					pt: 6,
				}}
			>
				<ModalClose aria-label={t("common:close")} />
				<Typography>{t("common:pages.dataset.chooseCaptioningMethod")}:</Typography>

				<Box sx={{ overflow: "auto", WebkitOverflowScrolling: "touch" }}>
					<Stack
						spacing={2}
						sx={{
							minHeight: "100%",
							justifyContent: "center",
							width: 600,
							mx: "auto",
						}}
					>
						{modelDownloadNote && (
							<Alert
								color="warning"
								startDecorator={<WarningIcon />}
								endDecorator={
									<IconButton
										color="warning"
										variant="solid"
										onClick={() => {
											setModelDownloadNote(false);
										}}
									>
										<CloseIcon />
									</IconButton>
								}
								sx={{
									".MuiAlert-endDecorator": {
										alignSelf: "flex-start",
										mt: -0.5,
										mr: -0.5,
									},
								}}
							>
								{t("common:pages.dataset.oneTimeDownloadNote")}
							</Alert>
						)}
						<ButtonGroup variant="solid" sx={{ width: "100%" }}>
							<Button
								startDecorator={<ImageIcon />}
								sx={{ flex: 1 }}
								onClick={async () => {
									onStart();
									onClose();
									await window.ipc.handleRunBlip(directory);
									onDone();
								}}
							>
								{t("common:pages.dataset.generateCaptionWithBLIP")}
							</Button>
							<Tooltip disableInteractive title="BLIP Settings">
								<IconButton disabled>
									<SettingsIcon />
								</IconButton>
							</Tooltip>
						</ButtonGroup>
						<ButtonGroup variant="solid" sx={{ width: "100%" }}>
							<Button
								startDecorator={<StyleIcon />}
								sx={{ flex: 1 }}
								onClick={async () => {
									onStart();
									onClose();
									await window.ipc.handleRunWd14(directory);
									onDone();
								}}
							>
								{t("common:pages.dataset.generateTagsWithWD14")}
							</Button>
							<Tooltip disableInteractive title="WD14 Settings">
								<IconButton disabled>
									<SettingsIcon />
								</IconButton>
							</Tooltip>
						</ButtonGroup>
						<ButtonGroup variant="solid" sx={{ width: "100%" }}>
							<Button
								color="warning"
								startDecorator={<VisibilityIcon />}
								sx={{ flex: 1 }}
								onClick={async () => {
									setConfirmGpt(!confirmGpt);
								}}
							>
								{t("common:pages.dataset.customCaptionsWithGPTVision")}
							</Button>
							<Tooltip disableInteractive title="GPT-Vision Settings">
								<IconButton
									color="warning"
									onClick={() => {
										setShowGptOptions(!showGptOptions);
									}}
								>
									<SettingsIcon />
								</IconButton>
							</Tooltip>
						</ButtonGroup>
						{confirmGpt && (
							<Stack spacing={2}>
								<Alert color="warning" startDecorator={<WarningIcon />}>
									<Typography>
										<Trans
											i18nKey="common:pages.dataset.warningOpenAI"
											components={{
												1: (
													<Link
														href="https://openai.com/policies/terms-of-use"
														target="_blank"
													/>
												),
											}}
										/>
									</Typography>
								</Alert>
								{!openAiApiKey && (
									<Typography>
										{t("common:pages.dataset.enterKeyToUseGPTVision")}{" "}
										<Link
											href="https://platform.openai.com/api-keys"
											target="_blank"
										>
											{t("common:getApiKey")}
										</Link>
									</Typography>
								)}
								<Button
									disabled={!openAiApiKey}
									color="danger"
									startDecorator={<VisibilityIcon />}
									sx={{ flex: 1 }}
									onClick={async () => {
										onStart();
										onClose();
										console.log({ gptVisionOptions });
										await window.ipc.handleRunGPTV(directory, gptVisionOptions);
										onDone();
									}}
								>
									{t("common:pages.dataset.proceedWithGPTVision")}
								</Button>
							</Stack>
						)}
						{showGptOptions && (
							<Box>
								<PasswordField
									fullWidth
									aria-label={t("common:openAiApiKey")}
									label={t("common:openAiApiKey")}
									value={openAiApiKey}
									onChange={event => {
										setOpenAiApiKey(event.target.value);
									}}
									onBlur={event => {
										window.ipc.fetch(OPENAI_API_KEY, {
											method: "POST",
											data: event.target.value,
										});
									}}
								/>
								<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
									<Button
										onClick={() => {
											setGptVisionOptions(defaultGptOptions);
										}}
									>
										{t("common:resetToDefaults")}
									</Button>
								</Box>
								<Typography sx={{ my: 1 }}>{t("common:guideline")}</Typography>
								<Box sx={{ height: 200 }}>
									<StyledEditor
										value={gptVisionOptions.guidelines}
										options={{
											mode: "markdown",
											theme: "material",
											lineWrapping: true,
										}}
										onBeforeChange={(editor, data, value) => {
											setGptVisionOptions({
												...gptVisionOptions,
												guidelines: value,
											});
											window.ipc.fetch(GPT_VISION_OPTIONS, {
												method: "POST",
												data: {
													...gptVisionOptions,
													guidelines: value,
												},
											});
										}}
									/>
								</Box>
								<Typography sx={{ my: 1 }}>
									{t("common:exampleResponse")}
								</Typography>
								<Box sx={{ height: 200 }}>
									<StyledEditor
										value={gptVisionOptions.exampleResponse}
										options={{
											mode: "application/ld+json",
											theme: "material",
											lineWrapping: true,
										}}
										onBeforeChange={(editor, data, value) => {
											setGptVisionOptions({
												...gptVisionOptions,
												exampleResponse: value,
											});
											window.ipc.fetch(GPT_VISION_OPTIONS, {
												method: "POST",
												data: {
													...gptVisionOptions,
													exampleResponse: value,
												},
											});
										}}
									/>
								</Box>
							</Box>
						)}
					</Stack>
				</Box>
			</ModalDialog>
		</Modal>
	);
}
