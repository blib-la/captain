import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import ErrorIcon from "@mui/icons-material/Error";
import StyleIcon from "@mui/icons-material/Style";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningIcon from "@mui/icons-material/Warning";
import { Checkbox } from "@mui/joy";
import Alert from "@mui/joy/Alert";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Link from "@mui/joy/Link";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import ModalDialog from "@mui/joy/ModalDialog";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Slider from "@mui/joy/Slider";
import Stack from "@mui/joy/Stack";
import { styled } from "@mui/joy/styles";
import Tab from "@mui/joy/Tab";
import TabList from "@mui/joy/TabList";
import TabPanel from "@mui/joy/TabPanel";
import Tabs from "@mui/joy/Tabs";
import Textarea from "@mui/joy/Textarea";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai/index";
import dynamic from "next/dynamic";
import { Trans, useTranslation } from "next-i18next";
import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import {
	CAPTIONS,
	DOWNLOADS,
	GPT_VISION_OPTIONS,
	OPENAI_API_KEY,
} from "../../../../main/helpers/constants";

import { captioningErrorAtom, imagesAtom, captionOnlyEmptyAtom } from "@/ions/atoms";
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
	batchSize: 4,
	guidelines: `Please caption these images, separate groups by comma, ensure logical groups: "black torn wide pants, red stained sweater" instead of "black, torn, wide pants and red, stained sweater"`,
	exampleResponse: `[
  "a photo of a young man, red hair, blue torn overalls with brass buttons, orange t-shirt with holes, white background",
  "a watercolor painting of an elderly woman, grey hair, yellow and blue floral print sundress with puffy sleeves, pink high heels, looking at a castle in the distance"
]`,
};

export function GPTVCaptionModal({
	onClose,
	onStart,
	onDone,
}: {
	onClose(): void | Promise<void>;
	onStart(): void | Promise<void>;
	onDone(): void | Promise<void>;
}) {
	const [onlyEmpty, setOnlyEmpty] = useAtom(captionOnlyEmptyAtom);
	const [openAiApiKey, setOpenAiApiKey] = useState("");
	const [gptVisionOptions, setGptVisionOptions] = useState(defaultGptOptions);
	const [confirmGpt, setConfirmGpt] = useState(false);
	const [images] = useAtom(imagesAtom);
	const { t } = useTranslation(["common"]);
	const [, setCaptioningError] = useAtom(captioningErrorAtom);
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
		<Stack
			spacing={2}
			sx={{
				minHeight: "100%",
				justifyContent: "center",
				width: 600,
				mx: "auto",
			}}
		>
			<Button
				fullWidth
				variant="solid"
				color="warning"
				startDecorator={<VisibilityIcon />}
				sx={{ flex: 1 }}
				onClick={async () => {
					setConfirmGpt(!confirmGpt);
				}}
			>
				{t("common:pages.dataset.customCaptionsWithGPTVision")}
			</Button>

			{confirmGpt && (
				<Stack spacing={2}>
					<Alert color="warning" startDecorator={<WarningIcon />}>
						<Typography>
							<Trans
								i18nKey="common:pages.dataset.warningOpenAI"
								components={{
									1: (
										<Link
											color="warning"
											href="https://openai.com/policies/terms-of-use"
											target="_blank"
										/>
									),
								}}
							/>
						</Typography>
					</Alert>
					{!openAiApiKey && (
						<Alert color="danger" startDecorator={<ErrorIcon />}>
							<Typography>
								{t("common:pages.dataset.enterKeyToUseGPTVision")}{" "}
								<Link
									color="danger"
									href="https://platform.openai.com/api-keys"
									target="_blank"
								>
									{t("common:getApiKey")}
								</Link>
							</Typography>
						</Alert>
					)}
					<Button
						disabled={!openAiApiKey}
						color="danger"
						startDecorator={<VisibilityIcon />}
						sx={{ flex: 1 }}
						onClick={async () => {
							onStart();
							onClose();
							try {
								await window.ipc.handleRunGPTV(
									images.map(image => image.image),
									gptVisionOptions
								);
							} catch (error) {
								setCaptioningError((error as Error).message);
							}
						}}
					>
						{t("common:pages.dataset.proceedWithGPTVision")}
					</Button>
				</Stack>
			)}
			<Box sx={{ flex: 1, overflow: "auto", WebkitOverflowScrolling: "touch" }}>
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
				<Box sx={{ display: "flex", justifyContent: "flex-end", my: 1 }}>
					<Button
						onClick={() => {
							setGptVisionOptions(defaultGptOptions);
							window.ipc.fetch(GPT_VISION_OPTIONS, {
								method: "POST",
								data: defaultGptOptions,
							});
						}}
					>
						{t("common:reset")}
					</Button>
				</Box>
				<Box sx={{ px: 0.5, pt: 2 }}>
					<Checkbox
						label={t("common:onlyCaptionEmptyItems")}
						checked={onlyEmpty}
						onChange={event => {
							setOnlyEmpty(event.target.checked);
						}}
					/>
				</Box>
				<Box component="label" sx={{ px: 2, pt: 3, display: "block" }}>
					<Box>{t("common:batch")}</Box>
					<Slider
						min={1}
						max={10}
						step={1}
						valueLabelDisplay="auto"
						value={gptVisionOptions.batchSize}
						onChange={(_event, value) => {
							setGptVisionOptions(previousState => ({
								...previousState,
								batchSize: value as number,
							}));
						}}
						onChangeCommitted={(_event, value) => {
							window.ipc.fetch(GPT_VISION_OPTIONS, {
								method: "POST",
								data: {
									...gptVisionOptions,
									batchSize: value,
								},
							});
						}}
					/>
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
				<Typography sx={{ my: 1 }}>{t("common:exampleResponse")}</Typography>
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
		</Stack>
	);
}

export function WD14CaptionModal({
	onClose,
	onStart,
	onDone,
}: {
	onClose(): void | Promise<void>;
	onStart(): void | Promise<void>;
	onDone(): void | Promise<void>;
}) {
	const [images] = useAtom(imagesAtom);
	const [options, setOptions] = useState({ batchSize: 10, model: "", exclude: "" });
	const [onlyEmpty, setOnlyEmpty] = useAtom(captionOnlyEmptyAtom);
	const { t } = useTranslation(["common"]);
	const [, setCaptioningError] = useAtom(captioningErrorAtom);
	const { data: loadingModel } = useSWR("SmilingWolf/wd-v1-4-convnextv2-tagger-v2/model");
	const { data: loadingCSV } = useSWR("SmilingWolf/wd-v1-4-convnextv2-tagger-v2/selected_tags");
	const { data: checkpointsData } = useSWR(CAPTIONS, () => window.ipc.getModels("captions"));
	const isInstalled = Boolean(checkpointsData?.length);
	const model =
		"https://huggingface.co/SmilingWolf/wd-v1-4-convnextv2-tagger-v2/resolve/main/model.onnx";
	const csv =
		"https://huggingface.co/SmilingWolf/wd-v1-4-convnextv2-tagger-v2/resolve/main/selected_tags.csv";

	useEffect(() => {
		if (checkpointsData) {
			setOptions(previousState => ({ ...previousState, model: checkpointsData[0] }));
		}
	}, [checkpointsData]);

	const filteredImages = useMemo(
		() => (onlyEmpty ? images.filter(image => !image.caption) : images),
		[onlyEmpty, images]
	);

	return (
		<Stack
			spacing={2}
			sx={{
				minHeight: "100%",
				justifyContent: "center",
				width: 600,
				mx: "auto",
			}}
		>
			{!isInstalled && (
				<Alert
					color="warning"
					startDecorator={<WarningIcon />}
					endDecorator={
						<Button
							disabled={loadingModel || loadingCSV}
							color="warning"
							variant="solid"
							startDecorator={<CloudDownloadIcon />}
							onClick={async () => {
								const storeKey = `${DOWNLOADS}.SmilingWolf/wd-v1-4-convnextv2-tagger-v2.model.onnx`;

								await window.ipc.downloadModel("wd14", model, {
									id: "SmilingWolf/wd-v1-4-convnextv2-tagger-v2",
									storeKey,
								});
								await window.ipc.downloadModel("wd14", csv, {
									id: "SmilingWolf/wd-v1-4-convnextv2-tagger-v2",
									storeKey,
								});
							}}
						>
							{t("common:download")}
						</Button>
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
			<Button
				fullWidth
				disabled={!isInstalled}
				variant="solid"
				color="neutral"
				startDecorator={<StyleIcon />}
				sx={{ flex: 1 }}
				onClick={async () => {
					onStart();
					onClose();
					try {
						await window.ipc.handleRunWd14(
							filteredImages.map(image => image.image),
							{
								...options,
								exclude: options.exclude.split(",").map(entry => entry.trim()),
							}
						);
					} catch (error) {
						setCaptioningError((error as Error).message);
					}
				}}
			>
				{t("common:pages.dataset.generateTagsWithWD14")}
			</Button>

			<Box sx={{ flex: 1, overflow: "auto", WebkitOverflowScrolling: "touch" }}>
				<FormControl sx={{ mt: 2 }}>
					<FormLabel>{t("common:model")}</FormLabel>
					<Select
						value={options.model}
						onChange={(_event, value) => {
							if (value) {
								setOptions(previousState => ({ ...previousState, model: value }));
							}
						}}
					>
						{checkpointsData?.map((model: string) => (
							<Option key={model} value={model}>
								{model}
							</Option>
						))}
					</Select>
				</FormControl>
				<FormControl sx={{ mt: 2 }}>
					<FormLabel>{t("common:excludedTags")}</FormLabel>
					<Textarea
						value={options.exclude}
						onChange={event => {
							setOptions(previousState => ({
								...previousState,
								exclude: event.target.value,
							}));
						}}
					/>
				</FormControl>
				<Box sx={{ px: 0.5, pt: 2 }}>
					<Checkbox
						label={t("common:onlyCaptionEmptyItems")}
						checked={onlyEmpty}
						onChange={event => {
							setOnlyEmpty(event.target.checked);
						}}
					/>
				</Box>
				<Box component="label" sx={{ px: 2, pt: 3, display: "block" }}>
					<Box>{t("common:batch")}</Box>
					<Slider
						min={1}
						max={filteredImages.length}
						step={1}
						valueLabelDisplay="auto"
						value={options.batchSize}
						onChange={(_event, value) => {
							setOptions(previousState => ({
								...previousState,
								batchSize: value as number,
							}));
						}}
					/>
				</Box>
			</Box>
		</Stack>
	);
}

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
	const { t } = useTranslation(["common"]);

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
				<Typography>{t("common:pages.dataset.chooseCaptioningMethod")}:</Typography>
				<Tabs
					defaultValue={0}
					sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}
				>
					<TabList>
						<Tab>WD14</Tab>
						<Tab>GPT Vision</Tab>
					</TabList>
					<TabPanel
						value={0}
						sx={{
							overflow: "hidden",
							flex: 1,
							display: "flex",
							flexDirection: "column",
						}}
					>
						<WD14CaptionModal onStart={onStart} onClose={onClose} onDone={onDone} />
					</TabPanel>
					<TabPanel
						value={1}
						sx={{
							overflow: "hidden",
							flex: 1,
							display: "flex",
							flexDirection: "column",
						}}
					>
						<GPTVCaptionModal onStart={onStart} onClose={onClose} onDone={onDone} />
					</TabPanel>
				</Tabs>
			</ModalDialog>
		</Modal>
	);
}
