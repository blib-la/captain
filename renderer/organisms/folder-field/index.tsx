import { Except } from "type-fest";
import {
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  InputProps,
} from "@mui/joy";
import { ReactNode } from "react";
import FolderIcon from "@mui/icons-material/Folder";
import { useTranslation } from "next-i18next";

export function FolderField({
  helpText,
  error,
  label,
  onSelect,
  ...properties
}: Except<InputProps, "endDecorator" | "type"> & {
  helpText?: ReactNode;
  label?: ReactNode;
  error?: string;
  onSelect?(value: string): void;
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
      {(error || helpText) && (
        <FormHelperText>{error || helpText}</FormHelperText>
      )}
    </FormControl>
  );
}
