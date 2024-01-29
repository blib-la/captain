import {
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  InputProps,
} from "@mui/joy";
import { ReactNode } from "react";

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
      {(error || helpText) && (
        <FormHelperText>{error || helpText}</FormHelperText>
      )}
    </FormControl>
  );
}
