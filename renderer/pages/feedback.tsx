import React from "react";
import Head from "next/head";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Sheet,
  Textarea,
  Typography,
} from "@mui/joy";
import { Layout } from "@/organisms/layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";
import { CustomScrollbars } from "@/organisms/custom-scrollbars";

function FeedbackForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { body: "" },
  });
  const { t } = useTranslation(["common"]);

  return (
    <Box
      component="form"
      sx={{ width: "100%" }}
      onSubmit={handleSubmit(async (data) => {
        await window.ipc.sendFeedback(data);
      })}
    >
      <FormControl sx={{ width: "100%" }}>
        <FormLabel>{t("common:pages.feedback.giveFeedback")}</FormLabel>
        <Textarea
          name="body"
          minRows={6}
          error={Boolean(errors?.body)}
          sx={{ width: "100%" }}
          {...register("body", { required: true })}
        />
      </FormControl>
      <Box sx={{ pt: 2 }}>
        <Button type="submit">{t("common:send")}</Button>
      </Box>
    </Box>
  );
}

export default function Page(
  _properties: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const { t } = useTranslation(["common"]);
  return (
    <Layout>
      <Head>
        <title>{`Captain | ${t("common:feedback")}`}</title>
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
            {t("common:feedback")}
          </Typography>
        </Sheet>
        <Box sx={{ flex: 1, position: "relative" }}>
          <CustomScrollbars>
            <Container>
              <FeedbackForm />
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
