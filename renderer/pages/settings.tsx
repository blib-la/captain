import React, { ReactNode, useEffect, useState } from "react";
import Head from "next/head";
import {
  Box,
  Card,
  CardContent,
  Container,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  InputProps,
  List,
  ListItem,
  ListItemContent,
  ListItemDecorator,
  Sheet,
  Stack,
  Typography,
} from "@mui/joy";
import { Layout } from "@/organisms/layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { ColorModeSelector } from "@/organisms/color-mode-selector";
import { LanguageSelect } from "@/organisms/language-select";
import { useTranslation } from "next-i18next";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { OPENAI_API_KEY } from "../../main/helpers/constants";
import { Except } from "type-fest";
import { CustomScrollbars } from "@/organisms/custom-scrollbars";

export function UserPreferences() {
  const { t } = useTranslation(["common"]);
  return (
    <Card variant="soft">
      <Typography>{t("common:pages.settings.userPreferences")}</Typography>
      <CardContent>
        <List>
          <ListItem>
            <ListItemContent>
              <Typography level="title-sm">
                {t("common:pages.settings.colorMode")}
              </Typography>
              <Typography level="body-sm">
                {t("common:pages.settings.colorModeDescription")}
              </Typography>
            </ListItemContent>
            <ListItemDecorator sx={{ width: 172, flexShrink: 0 }}>
              <ColorModeSelector />
            </ListItemDecorator>
          </ListItem>
          <ListItem>
            <ListItemContent>
              <Typography level="title-sm">
                {t("common:pages.settings.languageSettings")}
              </Typography>
              <Typography level="body-sm">
                {t("common:pages.settings.languageSettingsDescription")}
              </Typography>
            </ListItemContent>
            <ListItemDecorator sx={{ width: 172, flexShrink: 0 }}>
              <LanguageSelect />
            </ListItemDecorator>
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );
}

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

export function OpenAISettings() {
  const { t } = useTranslation(["common"]);
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  useEffect(() => {
    // Request the API key
    window.ipc.send(`${OPENAI_API_KEY}:get`);

    // Listener for the apiKey response
    window.ipc.on(OPENAI_API_KEY, (key) => {
      if (key) {
        setOpenAiApiKey(key as string);
      }
    });
  }, []);
  return (
    <Card variant="soft">
      <Typography>{t("common:pages.settings.openAiSettings")}</Typography>
      <CardContent>
        <List>
          <ListItem>
            <ListItemContent>
              <Typography level="title-sm">
                {t("common:openAiApiKey")}
              </Typography>
              <Typography level="body-sm">
                {t("common:pages.settings.openAiApiKeyDescription")}
              </Typography>
            </ListItemContent>
            <ListItemDecorator sx={{ width: 288, flexShrink: 0 }}>
              <PasswordField
                fullWidth
                aria-label={t("common:openAiApiKey")}
                value={openAiApiKey}
                onChange={(event) => {
                  setOpenAiApiKey(event.target.value);
                }}
                onBlur={() => {
                  window.ipc.store({
                    [OPENAI_API_KEY]: openAiApiKey,
                  });
                }}
              />
            </ListItemDecorator>
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );
}

export function RunPodSettings() {
  const { t } = useTranslation(["common"]);
  return (
    <Card variant="soft">
      <Typography>{t("common:pages.settings.runPodSettings")}</Typography>
      <CardContent>
        <List>
          <ListItem>
            <ListItemContent>
              <Typography level="title-sm">{t("common:comingSoon")}</Typography>
            </ListItemContent>
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );
}
export default function Page(
  _properties: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const { t } = useTranslation(["common"]);
  return (
    <Layout>
      <Head>
        <title>{`Captain | ${t("common:settings")}`}</title>
      </Head>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Sheet
          sx={{
            position: "sticky",
            top: 0,
            display: "flex",
            alignItems: "center",
            height: 44,
            px: 2,
            zIndex: 1,
          }}
        >
          <Typography level="h4" component="h1">
            {t("common:settings")}
          </Typography>
          <Box sx={{ flex: 1 }} />
        </Sheet>
        <Box sx={{ flex: 1, position: "relative" }}>
          <CustomScrollbars>
            <Container sx={{ py: 2 }}>
              <Stack spacing={4}>
                <UserPreferences />
                <OpenAISettings />
                <RunPodSettings />
              </Stack>
            </Container>
          </CustomScrollbars>
        </Box>
      </Box>
    </Layout>
  );
}

export async function getStaticProps(context: GetStaticPropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(context.locale ?? "en", ["common"])),
    },
  };
}
