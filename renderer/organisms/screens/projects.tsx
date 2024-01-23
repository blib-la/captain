import { useAtom } from "jotai";
import {
  directoryAtom,
  imagesAtom,
  projectAtom,
  projectsAtom,
} from "@/ions/atoms";
import React, { useEffect } from "react";
import { Button, Grid, Stack, Typography } from "@mui/joy";
import dynamic from "next/dynamic";

const LottiePlayer = dynamic(
  () => import("@/atoms/lottie-player").then((module_) => module_.LottiePlayer),
  { ssr: false },
);
export function Projects({ onDone }: { onDone(): void }) {
  const [, setProject] = useAtom(projectAtom);
  const [, setImages] = useAtom(imagesAtom);
  const [projects, setProjects] = useAtom(projectsAtom);
  const [, setDirectory] = useAtom(directoryAtom);

  useEffect(() => {
    window.ipc.getProjects().then((projects_) => {
      setProjects(projects_);
    });
  }, []);
  return projects.length ? (
    <Grid
      container
      columns={{ xs: 2, sm: 3, md: 4, lg: 6, xl: 8 }}
      sx={{
        flex: 1,
        alignItems: "flex-start",
        alignContent: "flex-start",
        overflow: "auto",
        mx: "auto",
        px: {
          xl: 20,
        },
      }}
    >
      {projects.map((project_) => (
        <Grid key={project_.id} xs={1} sx={{ height: "min-content" }}>
          <Button
            fullWidth
            color="neutral"
            variant="plain"
            sx={{ flexDirection: "column", overflow: "hidden", p: 1 }}
            onClick={async () => {
              const content = await window.ipc.getExistingProject(project_);
              setImages(content);
              setProject(project_);
              setDirectory(project_.source);
              onDone();
            }}
          >
            <img
              src={`my://${project_.files}/${project_.cover}`}
              alt={project_.name}
              style={{
                width: "100%",
                height: "auto",
                aspectRatio: 1,
                objectFit: "contain",
              }}
            />
            <Typography noWrap sx={{ mt: 1, display: "block", width: "100%" }}>
              {project_.name}
            </Typography>
          </Button>
        </Grid>
      ))}
    </Grid>
  ) : (
    <Stack
      sx={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        p: 4,
        ".lf-player-container": {
          flex: 1,
          overflow: "hidden",
          margin: "auto",
        },
      }}
    >
      <LottiePlayer
        id="done-lottie"
        src="/lottie/way/data.json"
        style={{ height: "100%" }}
      />
      <Typography
        level="h3"
        component="div"
        sx={{ textAlign: "center", my: 2 }}
      >
        No projects
      </Typography>
    </Stack>
  );
}
