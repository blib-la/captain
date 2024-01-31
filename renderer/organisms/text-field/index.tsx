import FormControl from "@mui/joy/FormControl";
import FormHelperText from "@mui/joy/FormHelperText";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import type { InputProps } from "@mui/joy/Input";
import type { ReactNode } from "react";

export function TextField({
	helpText,
	error,
	label,
	...properties
}: InputProps & {
	helpText?: ReactNode;
	label?: ReactNode;
	error?: string;
}) {
	return (
		<FormControl
			error={Boolean(error)}
			sx={{ width: properties.fullWidth ? "100%" : "max-content" }}
		>
			{label && <FormLabel>{label}</FormLabel>}
			<Input {...properties} />
			{(error || helpText) && <FormHelperText>{error || helpText}</FormHelperText>}
		</FormControl>
	);
}
