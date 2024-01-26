import Head from "next/head";
import { Box, Sheet, Stack, Typography } from "@mui/joy";
import { InferGetStaticPropsType } from "next";
import { useTranslation } from "next-i18next";
import { Lottie } from "@/organisms/lottie";
import { getStaticPaths, makeStaticProps } from "@/ions/i18n/getStatic";

export default function Page(
  _properties: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const { t } = useTranslation(["common"]);
  return (
    <>
      <Head>
        <title>{`Captain | ${t("common:inventory")}`}</title>
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
            {t("common:inventory")}
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
            <Lottie
              path="/lottie/minimalistic/branding-design.json"
              height={400}
            />
            <Typography level="h2" sx={{ textAlign: "center" }}>
              {t("common:comingSoon")}
            </Typography>
          </Box>
        </Box>
      </Stack>
    </>
  );
}

const getStaticProps = makeStaticProps(["common"]);
export { getStaticPaths, getStaticProps };
