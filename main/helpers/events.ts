import { BrowserWindow, ipcMain, shell } from "electron";
import {
  APP,
  BLIP,
  CAPTION,
  DATASET,
  EXISTING_PROJECT,
  FEEDBACK,
  FETCH,
  FOLDER,
  GPTV,
  IMAGE_CACHE,
  LOCALE,
  PROJECT,
  PROJECTS,
  STORE,
  WD14,
} from "./constants";
import { store } from "./store";
import path from "node:path";
import fsp from "node:fs/promises";
import {
  createMinifiedImageCache,
  getUserData,
  openNewGitHubIssue,
} from "./utils";
import { v4 } from "uuid";
import { runBlip, runGPTV, runWd14 } from "./caption";
import { Project } from "./types";
import pkg from "../../package.json";

// Handling the 'STORE:set' channel for setting multiple values in the store asynchronously.
ipcMain.handle(
  `${STORE}:set`,
  async (event, state: Record<string, unknown>) => {
    try {
      for (const key in state) {
        store.set(key, state[key]);
      }
    } catch (error) {
      throw error;
    }
  },
);

ipcMain.handle(`${LOCALE}:get`, async () => {
  return store.get(LOCALE);
});

ipcMain.handle(`${FETCH}:get`, async (event, key: string) => {
  return store.get(key);
});
ipcMain.handle(`${FETCH}:delete`, async (event, key: string) => {
  return store.delete(key);
});
ipcMain.handle(
  `${FETCH}:post`,
  async (event, key: string, data: Record<string, unknown>) => {
    return store.set(key, data);
  },
);

ipcMain.handle(
  `${FETCH}:patch`,
  async (event, key: string, partialData: Record<string, unknown>) => {
    const previousData = (await store.get(key)) as Record<string, unknown>;
    return store.set(key, { ...previousData, ...partialData });
  },
);

ipcMain.on(`${APP}:minimize`, () => {
  const window = BrowserWindow.getFocusedWindow();
  window.minimize();
});

ipcMain.on(`${FOLDER}:open`, (event, path) => {
  shell.openPath(path);
});

ipcMain.on(`${APP}:maximize`, () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window.isMaximized()) {
    window.unmaximize();
  } else {
    window.maximize();
  }
});

// Handler to fetch project details from the 'projects' directory.
ipcMain.handle(`${PROJECTS}:get`, async (): Promise<Project[]> => {
  const projectsDir = getUserData("projects");

  try {
    const files = await fsp.readdir(projectsDir);
    const projects = await Promise.all(
      files.map(async (file): Promise<Project> => {
        // For each file or directory, determine if it's a directory (a project).
        const projectPath = path.join(projectsDir, file);
        const stat = await fsp.stat(projectPath);
        if (stat.isDirectory()) {
          // If it's a directory, attempt to read the project configuration file.
          const configPath = path.join(projectPath, "project.json");
          try {
            const projectConfig = await fsp.readFile(configPath, "utf8");
            return JSON.parse(projectConfig) as Project;
          } catch (error) {
            return null;
          }
        } else {
          return null;
        }
      }),
    );

    return projects.filter(Boolean);
  } catch (error) {
    console.error("Error fetching projects:", error);
    // In case of an error, return an empty array.
    return [];
  }
});

// Handler to fetch image files for a given project.
ipcMain.handle(`${EXISTING_PROJECT}:get`, async (_event, project: Project) => {
  const filesDirectory = getUserData("projects", project.id, "files");
  const sourceDirectory = project.source;
  const files = await fsp.readdir(filesDirectory);
  const images = files.filter((file) => /\.(jpg|jpeg|png)$/i.test(file));

  return Promise.all(
    images.map(async (image) => {
      let caption: string;
      const captionFile = path
        .join(sourceDirectory, image)
        .replace(/\.(jpg|jpeg|png)$/i, ".txt");
      try {
        caption = await fsp.readFile(captionFile, "utf-8");
      } catch (error) {
        console.log(error);
      }
      return {
        image: path.join(filesDirectory, image),
        captionFile,
        caption,
      };
    }),
  );
});

// Handler to create an image cache for a directory.
ipcMain.handle(
  `${IMAGE_CACHE}:create`,
  async (_event, directory: string, name: string) => {
    const files = await fsp.readdir(directory);
    const images = files.filter((file) => /\.(jpg|jpeg|png)$/i.test(file));
    // Generate a unique ID for the cache directory.
    const id = v4();
    const outDirectory = getUserData("projects", id);
    const outFilesDirectory = getUserData("projects", id, "files");
    await fsp.mkdir(outFilesDirectory, { recursive: true });

    const projectConfiguration: Project = {
      id,
      name,
      files: outFilesDirectory,
      cover: images[0],
      source: directory,
    };

    await fsp.writeFile(
      path.join(outDirectory, "project.json"),
      JSON.stringify(projectConfiguration, null, 2),
    );

    // Process and cache each image file.
    return {
      config: projectConfiguration,
      images: await Promise.all(
        images.map(async (image) => {
          let caption: string;
          const captionFile = path
            .join(directory, image)
            .replace(/\.(jpg|jpeg|png)$/i, ".txt");
          try {
            caption = await fsp.readFile(captionFile, "utf-8");
          } catch (error) {
            console.log(error);
          }
          return {
            image: await createMinifiedImageCache(
              path.join(directory, image),
              path.join(outFilesDirectory, image),
            ),
            captionFile,
            caption,
          };
        }),
      ),
    };
  },
);

// Handler to send feedback to GitHub
ipcMain.handle(
  `${FEEDBACK}:send`,
  async (
    event,
    {
      body,
    }: {
      body: string;
    },
  ) => {
    openNewGitHubIssue({
      body: `${body}


----

Version: ${pkg.version}
`,
      user: "blib-la",
      repo: "captain",
      labels: ["app-feedback"],
    });
  },
);

ipcMain.handle(`${PROJECT}:delete`, async (event, id: string) => {
  const directory = getUserData("projects", id);
  await fsp.rm(directory, { recursive: true, force: true });
});

ipcMain.handle(`${DATASET}:get`, async (event, id: string) => {
  const datasetConfig = getUserData("projects", id, "project.json");
  const filesDirectory = getUserData("projects", id, "files");
  const dataset = await fsp
    .readFile(datasetConfig, "utf-8")
    .then((content) => JSON.parse(content));
  const sourceDirectory = dataset.source;
  const files = await fsp.readdir(filesDirectory);
  const images = files.filter((file) => /\.(jpg|jpeg|png)$/i.test(file));

  return {
    dataset,
    images: await Promise.all(
      images.map(async (image) => {
        let caption: string;
        const captionFile = path
          .join(sourceDirectory, image)
          .replace(/\.(jpg|jpeg|png)$/i, ".txt");
        try {
          caption = await fsp.readFile(captionFile, "utf-8");
        } catch (error) {
          console.log(error);
        }
        return {
          image: path.join(filesDirectory, image),
          captionFile,
          caption,
        };
      }),
    ),
  };
});

ipcMain.handle(`${DATASET}:delete`, async (event, id: string) => {
  const directory = getUserData("projects", id);
  await fsp.rm(directory, { recursive: true, force: true });
});

ipcMain.handle(
  `${DATASET}:update`,
  async (event, id: string, partial: Partial<Exclude<Project, "id">>) => {
    const dataset = getUserData("projects", id, "project.json");
    const project = await fsp
      .readFile(dataset, "utf-8")
      .then((content) => JSON.parse(content) as Project);

    await fsp.writeFile(
      dataset,
      JSON.stringify({ ...project, ...partial, id }, null, 2),
    );
  },
);

// Handler so save caption values to the file
ipcMain.handle(
  `${CAPTION}:save`,
  async (event, imageData: { captionFile: string; caption: string }) => {
    await fsp.writeFile(imageData.captionFile, imageData.caption.trim());
  },
);

// Handler to execute the BLIP image captioning service.
ipcMain.handle(`${BLIP}:run`, async (event, directory: string) => {
  try {
    return runBlip(directory);
  } catch (error) {
    throw error;
  }
});

// Handler to execute the WD14 image tagging service.
ipcMain.handle(`${WD14}:run`, async (event, directory: string) => {
  try {
    return runWd14(directory);
  } catch (error) {
    throw error;
  }
});

// Handler to execute the GPT-Vision (GPTV) service.
ipcMain.handle(
  `${GPTV}:run`,
  async (
    event,
    directory: string,
    options: {
      batchSize?: number;
      exampleResponse: string;
      guidelines: string;
      extension: string;
    },
  ) => {
    try {
      return runGPTV(directory, options);
    } catch (error) {
      throw error;
    }
  },
);
