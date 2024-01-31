import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FolderIcon from "@mui/icons-material/Folder";
import RefreshIcon from "@mui/icons-material/Refresh";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import FormControl from "@mui/joy/FormControl";
import FormHelperText from "@mui/joy/FormHelperText";
import FormLabel from "@mui/joy/FormLabel";
import IconButton from "@mui/joy/IconButton";
import Input from "@mui/joy/Input";
import Modal from "@mui/joy/Modal";
import type { ModalProps } from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import ModalDialog from "@mui/joy/ModalDialog";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import { useAtom } from "jotai";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { Except } from "type-fest";

import { directoryAtom, projectsAtom } from "@/ions/atoms";
import { adjectives, colors, generateRandomName, nouns } from "@/ions/utils/get-random-name";

function AddDatasetForm({ onClose }: { onClose: ModalProps["onClose"] }) {
	const [, setDatasets] = useAtom(projectsAtom);
	const [directory, setDirectory] = useAtom(directoryAtom);

	const [loading, setLoading] = useState(false);
	const [, setError] = useState<Error | null>(null);

	const { t } = useTranslation(["common"]);

	const { register, formState, handleSubmit, setValue, clearErrors } = useForm({
		defaultValues: {
			name: generateRandomName([adjectives, colors, nouns], {
				humanize: true,
				separator: " ",
			}),
			directory,
		},
	});

	useEffect(
		() => () => {
			setDirectory("");
		},
		[setDirectory]
	);

	useEffect(() => {
		clearErrors("directory");
	}, [clearErrors]);

	return (
		<form
			onSubmit={handleSubmit(async data => {
				setLoading(true);
				try {
					await window.ipc.createImageCache(data.directory, data.name);
					await window.ipc.getProjects().then(datasets_ => {
						setDatasets(datasets_);
					});
					setDirectory("");
					if (onClose) {
						onClose({}, "closeClick");
					}
				} catch (error) {
					console.log(error);
					setError(error as Error);
				} finally {
					setLoading(false);
				}
			})}
		>
			<Stack
				spacing={2}
				sx={{
					mx: "auto",
					alignItems: "center",
					alignContent: "center",
					justifyContent: "center",
					minWidth: 400,
				}}
			>
				<Typography level="h3" component="div">
					{t("common:pages.datasets.newDataset")}
				</Typography>
				<FormControl error={Boolean(formState.errors.name)} sx={{ width: "100%" }}>
					<FormLabel>{t("common:name")}</FormLabel>
					<Input
						endDecorator={
							<IconButton
								aria-label="New random Name"
								onClick={async () => {
									setValue(
										"name",
										generateRandomName([adjectives, colors, nouns], {
											humanize: true,
											separator: " ",
										})
									);
								}}
							>
								<RefreshIcon />
							</IconButton>
						}
						{...register("name", { required: true })}
					/>
					{formState.errors.name && (
						<FormHelperText>{t(`common:form.errors.name`)}</FormHelperText>
					)}
				</FormControl>
				<FormControl error={Boolean(formState.errors.directory)} sx={{ width: "100%" }}>
					<FormLabel>{t("common:directory")}</FormLabel>
					<Input
						endDecorator={
							<IconButton
								aria-label="Select Source Directory"
								onClick={async () => {
									try {
										const directory_ = await window.ipc.getDirectory();
										if (directory_) {
											setValue("directory", directory_);
										}
									} catch (error) {
										console.log(error);
										setError(error as Error);
									}
								}}
							>
								<FolderIcon />
							</IconButton>
						}
						{...register("directory", { required: true })}
					/>
					{formState.errors.directory && (
						<FormHelperText>{t(`common:form.errors.directory`)}</FormHelperText>
					)}
				</FormControl>

				<Button
					fullWidth
					color="primary"
					type="submit"
					endDecorator={loading ? <CircularProgress /> : <ArrowForwardIcon />}
				>
					{t("common:create")}
				</Button>
			</Stack>
		</form>
	);
}

export function AddDatasetModal({ onClose, ...properties }: Except<ModalProps, "children">) {
	const { t } = useTranslation(["common"]);

	return (
		<Modal {...properties} onClose={onClose}>
			<ModalDialog sx={{ pt: 6 }}>
				<ModalClose aria-label={t("common:close")} />
				<AddDatasetForm onClose={onClose} />
			</ModalDialog>
		</Modal>
	);
}
