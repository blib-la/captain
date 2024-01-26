import React from "react";
import Head from "next/head";
import { Box, Sheet, Stack, Typography } from "@mui/joy";
import { Layout } from "@/organisms/layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { useTranslation } from "next-i18next";
import { Lottie } from "@/organisms/lottie";

export default function Page(
  _properties: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const { t } = useTranslation(["common"]);
  return (
    <Layout>
      <Head>
        <title>{`Captain | ${t("common:marketplace")}`}</title>
      </Head>

      <Stack sx={{ position: "absolute", inset: 0, overflow: "hidden" }}>
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
            {t("common:marketplace")}
          </Typography>
        </Sheet>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box>
            <Lottie path="/lottie/minimalistic/e-commerce.json" height={400} />
            <Typography level="h2" sx={{ textAlign: "center" }}>
              {t("common:comingSoon")}
            </Typography>
          </Box>
        </Box>
      </Stack>
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
