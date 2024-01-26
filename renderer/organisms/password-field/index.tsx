import { Except } from "type-fest";
import {
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  InputProps,
} from "@mui/joy";
import { ReactNode, useState } from "react";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";

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
            aria-label={showKey ? "Hide Key" : "Show Key"}
            onClick={() => {
              setShowKey(!showKey);
            }}
          >
            {showKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </IconButton>
        }
      />
      {(error || helpText) && (
        <FormHelperText>{error || helpText}</FormHelperText>
      )}
    </FormControl>
  );
}
