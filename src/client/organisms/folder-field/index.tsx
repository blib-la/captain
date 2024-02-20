import FolderIcon from "@mui/icons-material/Folder";
import FormControl from "@mui/joy/FormControl";
import FormHelperText from "@mui/joy/FormHelperText";
import FormLabel from "@mui/joy/FormLabel";
import IconButton from "@mui/joy/IconButton";
import Input from "@mui/joy/Input";
import type { InputProps } from "@mui/joy/Input";
import { useTranslation } from "next-i18next";
import type { ReactNode } from "react";
import type { Except } from "type-fest";

export function FolderField({
	helpText,
	error,
	label,
	onSelect,
	...properties
}: Except<InputProps, "endDecorator" | "type" | "onSelect"> & {
	helpText?: ReactNode;
	label?: ReactNode;
	error?: string;
	onSelect?(value: string): Promise<void> | void;
}) {
	const { t } = useTranslation(["common"]);
	return (
		<FormControl
			error={Boolean(error)}
			sx={{ width: properties.fullWidth ? "100%" : "max-content" }}
		>
			{label && <FormLabel>{label}</FormLabel>}
			<Input
				{...properties}
				type="text"
				endDecorator={
					<IconButton
						aria-label={t("common:selectFolder")}
						onClick={async () => {
							try {
								const directory_ = await window.ipc.getDirectory();
								if (directory_ && onSelect) {
									onSelect(directory_);
								}
							} catch (error) {
								console.log(error);
							}
						}}
					>
						<FolderIcon />
					</IconButton>
				}
			/>
			{(error || helpText) && <FormHelperText>{error || helpText}</FormHelperText>}
		</FormControl>
	);
}
