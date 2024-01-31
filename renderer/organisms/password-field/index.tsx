import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import FormControl from "@mui/joy/FormControl";
import FormHelperText from "@mui/joy/FormHelperText";
import FormLabel from "@mui/joy/FormLabel";
import IconButton from "@mui/joy/IconButton";
import Input from "@mui/joy/Input";
import type { InputProps } from "@mui/joy/Input";
import { useTranslation } from "next-i18next";
import type { ReactNode } from "react";
import { useState } from "react";
import type { Except } from "type-fest";

export function PasswordField({
	helpText,
	error,
	label,
	...properties
}: Except<InputProps, "endDecorator" | "type"> & {
	helpText?: ReactNode;
	label?: ReactNode;
	error?: string;
}) {
	const [showKey, setShowKey] = useState(false);
	const { t } = useTranslation(["common"]);
	return (
		<FormControl
			error={Boolean(error)}
			sx={{ width: properties.fullWidth ? "100%" : "max-content" }}
		>
			{label && <FormLabel>{label}</FormLabel>}
			<Input
				{...properties}
				type={showKey ? "text" : "password"}
				endDecorator={
					<IconButton
						aria-label={showKey ? t("common:hide") : t("common:show")}
						onClick={() => {
							setShowKey(!showKey);
						}}
					>
						{showKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
					</IconButton>
				}
			/>
			{(error || helpText) && <FormHelperText>{error || helpText}</FormHelperText>}
		</FormControl>
	);
}
