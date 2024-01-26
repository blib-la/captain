import { Except } from "type-fest";
import {
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  Modal,
  ModalClose,
  ModalDialog,
  ModalProps,
  Stack,
  Typography,
} from "@mui/joy";
import { useAtom } from "jotai";
import { directoryAtom, projectsAtom } from "@/ions/atoms";
import React, { useEffect, useState } from "react";
import {
  adjectives,
  colors,
  generateRandomName,
  nouns,
} from "@/ions/utils/get-random-name";
import { useTranslation } from "next-i18next";
import RefreshIcon from "@mui/icons-material/Refresh";
import FolderIcon from "@mui/icons-material/Folder";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useForm } from "react-hook-form";

function AddDatasetForm({ onClose }: { onClose: ModalProps["onClose"] }) {
  const [, setDatasets] = useAtom(projectsAtom);
  const [directory, setDirectory] = useAtom(directoryAtom);

  const [loading, setLoading] = useState(false);
  const [, setError] = useState<Error | null>(null);

  const { t } = useTranslation(["common"]);

  const { register, formState, handleSubmit, setValue, clearErrors } = useForm({
    defaultValues: {
      name: generateRandomName([adjectives, colors, nouns], { humanize: true }),
      directory,
    },
  });

  useEffect(() => {
    return () => {
      setDirectory("");
    };
  }, [setDirectory]);

  useEffect(() => {
    clearErrors("directory");
  }, [clearErrors]);

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setLoading(true);
        try {
          await window.ipc.createImageCache(data.directory, data.name);
          await window.ipc.getProjects().then((datasets_) => {
            setDatasets(datasets_);
          });
          setDirectory("");
          onClose({}, "closeClick");
        } catch (error) {
          console.log(error);
          setError(error);
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
        <Typography level={"h3"} component={"div"}>
          {t("common:pages.datasets.newDataset")}
        </Typography>
        <FormControl
          error={Boolean(formState.errors.name)}
          sx={{ width: "100%" }}
        >
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
                    }),
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
        <FormControl
          error={Boolean(formState.errors.directory)}
          sx={{ width: "100%" }}
        >
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
                    setError(error);
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
export function AddDatasetModal({
  onClose,
  ...properties
}: Except<ModalProps, "children">) {
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
