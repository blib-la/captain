import React from "react";
import Head from "next/head";
import { Box, Sheet } from "@mui/joy";
import { Layout } from "@/organisms/layout";
import { UserFlow } from "@/organisms/screens";
import { DoneScreen } from "@/organisms/screens/done-screen";
import { Projects } from "@/organisms/screens/projects";
import { OpenProject } from "@/organisms/screens/open-project";
import { ProjectView } from "@/organisms/screens/project-view";
import { NewProject } from "@/organisms/screens/new-project";
import { StartNewProject } from "@/organisms/screens/start-new-project";

export default function HomePage() {
  return (
    <Layout>
      <Head>
        <title>Captain</title>
      </Head>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          mx: "auto",
          overflow: "hidden",
        }}
      >
        <Sheet
          sx={(theme) => ({
            p: 4,
            m: 4,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: `calc(100% - ${theme.spacing(8)})`,
            gap: 2,
            overflow: "hidden",
          })}
        >
          <UserFlow
            id={"newProject"}
            steps={[StartNewProject, NewProject, ProjectView, DoneScreen]}
          />
          <UserFlow
            id={"openProject"}
            steps={[OpenProject, Projects, ProjectView, DoneScreen]}
          />
        </Sheet>
      </Box>
    </Layout>
  );
}
