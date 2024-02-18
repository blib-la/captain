import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CheckAllIcon from "@mui/icons-material/DoneAll";
import ErrorIcon from "@mui/icons-material/Error";
import RuleIcon from "@mui/icons-material/Rule";
import StyleIcon from "@mui/icons-material/Style";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningIcon from "@mui/icons-material/Warning";
import Alert from "@mui/joy/Alert";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
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
import SvgIcon from "@mui/joy/SvgIcon";
import Tab from "@mui/joy/Tab";
import TabList from "@mui/joy/TabList";
import TabPanel from "@mui/joy/TabPanel";
import Tabs from "@mui/joy/Tabs";
import Textarea from "@mui/joy/Textarea";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai/index";
import dynamic from "next/dynamic";
import { Trans, useTranslation } from "next-i18next";
import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { v4 } from "uuid";

import {
	CAPTIONS,
	DOWNLOADS,
	GPT_VISION_OPTIONS,
	OPENAI_API_KEY,
} from "../../../../main/helpers/constants";

import { captioningErrorAtom, imagesAtom, editCaptionScopeAtom } from "@/ions/atoms";
import { SimpleItemList } from "@/organisms/list/simple-item-list";
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
	parallel: true,
	guidelines: `Please caption these images, separate groups by comma, ensure logical groups: "black torn wide pants, red stained sweater" instead of "black, torn, wide pants and red, stained sweater"`,
	exampleResponse: [
		{
			content:
				"a photo of a young man, red hair, blue torn overalls with brass buttons, orange t-shirt with holes, white background",
			id: v4(),
		},
		{
			content:
				"a watercolor painting of an elderly woman, grey hair, yellow and blue floral print sundress with puffy sleeves, pink high heels, looking at a castle in the distance",
			id: v4(),
		},
	],
};

export function EmptyCaptionIcon() {
	return (
		<SvgIcon>
			<path d="M3 13H15V11H3M3 6V8H21V6M3 18H9V16H3V18M22.54 16.88L20.41 19L22.54 21.12L21.12 22.54L19 20.41L16.88 22.54L15.47 21.12L17.59 19L15.47 16.88L16.88 15.47L19 17.59L21.12 15.46L22.54 16.88" />
		</SvgIcon>
	);
}

export function useFilteredImages() {
	const [filterScope] = useAtom(editCaptionScopeAtom);
	const [images] = useAtom(imagesAtom);
	return useMemo(() => {
		switch (filterScope) {
			case "empty": {
				return images.filter(image => !image.caption);
			}

			case "selected": {
				return images.filter(image => image.selected);
			}

			case "all": {
				return images;
			}

			default: {
				return [];
			}
		}
	}, [filterScope, images]);
}

export function EditCaptionScope() {
	const { t } = useTranslation(["common"]);
	const [value, setValue] = useAtom(editCaptionScopeAtom);
	const filteredImages = useFilteredImages();

	return (
		<Box>
			<Typography sx={{ my: 1 }}>
				{t("common:scopeForEditing")} ({filteredImages.length})
			</Typography>
			<ToggleButtonGroup
				value={value}
				onChange={(event, newValue) => {
					if (newValue) {
						setValue(newValue);
					}
				}}
			>
				<Button value="all" startDecorator={<CheckAllIcon />}>
					{t("common:all")}
				</Button>
				<Button value="empty" startDecorator={<EmptyCaptionIcon />}>
					{t("common:empty")}
				</Button>
				<Button value="selected" startDecorator={<RuleIcon />}>
					{t("common:selected")}
				</Button>
			</ToggleButtonGroup>
		</Box>
	);
}

export function GPTVCaptionModal({
	onClose,
	onStart,
}: {
	onClose(): void | Promise<void>;
	onStart(): void | Promise<void>;
	onDone(): void | Promise<void>;
}) {
	const [openAiApiKey, setOpenAiApiKey] = useState("");
	const [gptVisionOptions, setGptVisionOptions] = useState(defaultGptOptions);
	const [confirmGpt, setConfirmGpt] = useState(false);
	const { t } = useTranslation(["common"]);
	const [, setCaptioningError] = useAtom(captioningErrorAtom);
	const { data: openApiKeyData } = useSWR(OPENAI_API_KEY);
	const { data: gptVisionData } = useSWR(GPT_VISION_OPTIONS);
	const filteredImages = useFilteredImages();

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
					exampleResponse: { id: string; content: string }[];
					parallel: boolean;
				}
			);
		}
	}, [gptVisionData]);

	function setAndSend(newState: typeof defaultGptOptions) {
		setGptVisionOptions(newState);
		window.ipc.fetch(GPT_VISION_OPTIONS, {
			method: "POST",
			data: newState,
		});
	}

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
						disabled={!openAiApiKey || filteredImages.length === 0}
						color="danger"
						startDecorator={<VisibilityIcon />}
						sx={{ flex: 1 }}
						onClick={async () => {
							onStart();
							onClose();
							try {
								await window.ipc.handleRunGPTV(
									filteredImages.map(image => image.image),
									{
										...gptVisionOptions,
										exampleResponse: JSON.stringify(
											gptVisionOptions.exampleResponse.map(
												item => item.content
											)
										),
									}
								);
							} catch (error) {
								console.log(".... error");
								console.log(error);
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
							setAndSend(defaultGptOptions);
						}}
					>
						{t("common:reset")}
					</Button>
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
							setAndSend({
								...gptVisionOptions,
								guidelines: value,
							});
						}}
					/>
				</Box>
				<Typography sx={{ my: 1 }}>{t("common:exampleResponse")}</Typography>
				<SimpleItemList
					items={gptVisionOptions.exampleResponse}
					onEdit={(id, content) => {
						setAndSend({
							...gptVisionOptions,
							exampleResponse: gptVisionOptions.exampleResponse.map(item =>
								item.id === id
									? {
											...item,
											content,
										}
									: item
							),
						});
					}}
					onDelete={id => {
						setAndSend({
							...gptVisionOptions,
							exampleResponse: gptVisionOptions.exampleResponse.filter(
								item => item.id !== id
							),
						});
					}}
					onAdd={content => {
						setAndSend({
							...gptVisionOptions,
							exampleResponse: [
								{ id: v4(), content },
								...gptVisionOptions.exampleResponse,
							],
						});
					}}
				/>
			</Box>
		</Stack>
	);
}

export function WD14CaptionModal({
	onClose,
	onStart,
}: {
	onClose(): void | Promise<void>;
	onStart(): void | Promise<void>;
	onDone(): void | Promise<void>;
}) {
	const [options, setOptions] = useState({ batchSize: 10, model: "", exclude: "" });
	const { t } = useTranslation(["common"]);
	const [, setCaptioningError] = useAtom(captioningErrorAtom);
	const storeKey = `${DOWNLOADS}.SmilingWolf/wd-v1-4-convnextv2-tagger-v2`;
	const { data: loadingModel } = useSWR(storeKey);
	const { data: checkpointsData } = useSWR(`${CAPTIONS}:wd14`, () =>
		window.ipc.getModels("captions/wd14")
	);
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

	const filteredImages = useFilteredImages();

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
							disabled={loadingModel}
							color="warning"
							variant="solid"
							startDecorator={<CloudDownloadIcon />}
							onClick={async () => {
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
				disabled={!isInstalled || filteredImages.length === 0}
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
						disabled={!options.model}
						value={options.model ?? ""}
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
			</Box>
		</Stack>
	);
}

export const llavaDefaultOptions = {
	batchSize: 10,
	temperature: 0.2,
	model: "",
	prompt: `Please caption the image precisely. Mention all details in the image with certainty. Use one long sentence with comma separated term groupings.
e.g. An elderly man, red lumberjack style flannel shirt, stained denim overalls with holes, dirty light-brow work boots with red laces.
`,
};

export function LlavaCaptionModal({
	onClose,
	onStart,
}: {
	onClose(): void | Promise<void>;
	onStart(): void | Promise<void>;
	onDone(): void | Promise<void>;
}) {
	const [options, setOptions] = useState(llavaDefaultOptions);
	const { t } = useTranslation(["common"]);
	const [, setCaptioningError] = useAtom(captioningErrorAtom);
	const storeKey = `${DOWNLOADS}.llava-hf/llava-1.5-7b-hf`;
	const { data: loadingModel } = useSWR(storeKey);
	const { data: checkpointsData } = useSWR(`${CAPTIONS}:llava`, () =>
		window.ipc.getModels("captions/llava")
	);
	const isInstalled = Boolean(checkpointsData?.length);
	const filteredImages = useFilteredImages();

	useEffect(() => {
		if (checkpointsData) {
			setOptions(previousState => ({ ...previousState, model: checkpointsData[0] }));
		}
	}, [checkpointsData]);

	console.log("storeKey:", storeKey, { loadingModel });

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
			{(!isInstalled || loadingModel) && (
				<Alert
					color="warning"
					startDecorator={<WarningIcon />}
					endDecorator={
						<Button
							disabled={loadingModel}
							color="warning"
							variant="solid"
							startDecorator={
								loadingModel ? <CircularProgress /> : <CloudDownloadIcon />
							}
							onClick={async () => {
								await window.ipc.gitCloneLFS(
									"caption/llava",
									"llava-hf/llava-1.5-7b-hf",
									{
										id: "llava-hf/llava-1.5-7b-hf",
										storeKey,
									}
								);
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
				disabled={filteredImages.length === 0 || !isInstalled || loadingModel}
				variant="solid"
				color="neutral"
				startDecorator={<StyleIcon />}
				sx={{ flex: 1 }}
				onClick={async () => {
					onStart();
					onClose();
					try {
						await window.ipc.handleRunLlava(
							filteredImages.map(image => image.image),
							options
						);
					} catch (error) {
						setCaptioningError((error as Error).message);
					}
				}}
			>
				{t("common:pages.dataset.customCaptionsWithLlava")}
			</Button>

			<Box sx={{ flex: 1, overflow: "auto", WebkitOverflowScrolling: "touch" }}>
				<FormControl sx={{ mt: 2 }}>
					<FormLabel>{t("common:model")}</FormLabel>
					<Select
						disabled={!options.model}
						value={options.model ?? ""}
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
				<Box component="label" sx={{ px: 2, pt: 3, display: "block", overflow: "hidden" }}>
					<Box>{t("common:temperature")}</Box>
					<Slider
						min={0}
						max={0.5}
						step={0.01}
						valueLabelDisplay="auto"
						value={options.temperature}
						onChange={(_event, value) => {
							setOptions(previousState => ({
								...previousState,
								temperature: value as number,
							}));
						}}
					/>
				</Box>
				<Typography sx={{ my: 1 }}>{t("common:guideline")}</Typography>
				<Box sx={{ height: 200 }}>
					<StyledEditor
						value={options.prompt}
						options={{
							mode: "markdown",
							theme: "dracula",
							lineWrapping: true,
						}}
						onBeforeChange={(_editor, _data, value) => {
							setOptions({
								...options,
								prompt: value,
							});
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
				<EditCaptionScope />
				<Typography>{t("common:pages.dataset.chooseCaptioningMethod")}:</Typography>
				<Tabs
					defaultValue={0}
					sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}
				>
					<TabList>
						<Tab>WD14</Tab>
						<Tab>Llava</Tab>
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
						<LlavaCaptionModal onStart={onStart} onClose={onClose} onDone={onDone} />
					</TabPanel>
					<TabPanel
						value={2}
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
