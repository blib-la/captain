import { ipcMain } from "electron";
import {
  BLIP,
  CAPTION,
  CURRENT_DIRECTORY,
  CURRENT_PROJECT_ID,
  GPT_VISION_OPTIONS,
  EXISTING_PROJECT,
  GPTV,
  IMAGE_CACHE,
  OPENAI_API_KEY,
  PROJECTS,
  STORE,
  WD14,
} from "./constants";
import { store } from "./store";
import path from "node:path";
import fsp from "node:fs/promises";
import { createMinifiedImageCache, getDirectory } from "./utils";
import { v4 } from "uuid";
import { runBlip, runGPTV, runWd14 } from "./caption";
import { Project } from "./types";

/**
 * Sets up IPC event listeners for various channels.
 *
 * The ipcMain module of Electron is used to set up listeners in the main process,
 * which respond to messages sent from renderer processes. Each listener is associated
 * with a specific channel, identified by a unique string. When a message is received
 * on a channel, the corresponding listener is invoked.
 */

// Listening for 'GPT_VISION_OPTIONS:get' channel. Sends the GPT_VISION_OPTIONS value back to the renderer process.
ipcMain.on(`${GPT_VISION_OPTIONS}:get`, (event) => {
  event.sender.send(GPT_VISION_OPTIONS, store.get(GPT_VISION_OPTIONS));
});

// Listening for 'OPENAI_API_KEY:get' channel. Sends the OPENAI_API_KEY value back to the renderer process.
ipcMain.on(`${OPENAI_API_KEY}:get`, (event) => {
  event.sender.send(OPENAI_API_KEY, store.get(OPENAI_API_KEY));
});

// Listening for 'CURRENT_DIRECTORY:get' channel. Sends the current directory value back to the renderer process.
ipcMain.on(`${CURRENT_DIRECTORY}:get`, (event) => {
  event.sender.send(CURRENT_DIRECTORY, store.get(CURRENT_DIRECTORY));
});

// Listening for 'CURRENT_PROJECT_ID:get' channel. Sends the current project ID value back to the renderer process.
ipcMain.on(`${CURRENT_PROJECT_ID}:get`, (event) => {
  event.sender.send(CURRENT_PROJECT_ID, store.get(CURRENT_PROJECT_ID));
});

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

// Handler to fetch project details from the 'projects' directory.
ipcMain.handle(`${PROJECTS}:get`, async (): Promise<Project[]> => {
  const projectsDir = getDirectory("projects");

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
  const filesDirectory = getDirectory("projects", project.id, "files");
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
    const outDirectory = getDirectory("projects", id);
    const outFilesDirectory = getDirectory("projects", id, "files");
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

// Handler so save caption values to the file
ipcMain.handle(
  `${CAPTION}:save`,
  async (event, imageData: { captionFile: string; caption: string }) => {
    await fsp.writeFile(imageData.captionFile, imageData.caption);
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
