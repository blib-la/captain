import {
  app,
  screen,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Rectangle,
  ipcMain,
  dialog,
} from "electron";
import Store from "electron-store";
import fs from "node:fs";
import path from "node:path";
import Jimp from "jimp";
import { execa } from "execa";
import { OpenAI } from "openai";
import { config } from "dotenv";
import fsp from "node:fs/promises";
import { ChatCompletionContentPart } from "openai/resources/chat/completions";

config();

const store = new Store();

ipcMain.on("get-apiKey", (event) => {
  console.log("request API key ->");
  const apiKey = store.get("openaiApiKey");
  console.log(apiKey);
  event.sender.send("apiKey", apiKey);
});

ipcMain.on("get-directory", (event) => {
  console.log("request directory ->");
  const directory_ = store.get("directory");
  console.log(directory_);
  event.sender.send("directory", directory_);
});

ipcMain.handle("store", async (event, { property, value }) => {
  try {
    console.log(property, value);
    store.set(property, value);
    console.log("is", store.get(property));
  } catch (error) {
    throw error;
  }
});

async function runBlip(directory: string): Promise<any> {
  try {
    // Adjusted paths to point to 'app.asar.unpacked'
    const pathToPythonScript =
      process.env.NODE_ENV === "development"
        ? path.join(
            app.getPath("exe"), // Gets the directory of the executable
            "../../../..", // Move up to the parent directory of the executable
            "resources",
            "python",
            "caption_blip.py",
          )
        : path.join(
            app.getPath("exe"), // Gets the directory of the executable
            "..", // Move up to the parent directory of the executable
            "resources",
            "app.asar.unpacked",
            "resources",
            "python",
            "caption_blip.py",
          );
    const pythonExecutable =
      process.env.NODE_ENV === "development"
        ? path.join(
            app.getPath("exe"), // Gets the directory of the executable
            "../../../..", // Move up to the parent directory of the executable
            "resources",
            "venv/Scripts",
            "python.exe",
          )
        : path.join(
            app.getPath("exe"), // Gets the directory of the executable
            "..", // Move up to the parent directory of the executable
            "resources",
            "app.asar.unpacked",
            "resources",
            "venv/Scripts",
            "python.exe",
          );

    const { stdout, stderr } = await execa(pythonExecutable, [
      pathToPythonScript,
      directory,
      "--caption_extension",
      ".txt",
    ]);

    if (stderr) {
      console.error("Python Error:", stderr);
    }

    return stdout.trim();
  } catch (error) {
    console.error("Error running BLIP:", error);
    throw new Error("Failed to run BLIP script. " + error.message);
  }
}

async function runWd14(directory: string) {
  try {
    const pathToPythonScript =
      process.env.NODE_ENV === "development"
        ? path.join(
            app.getPath("exe"), // Gets the directory of the executable
            "../../../..", // Move up to the parent directory of the executable
            "resources",
            "python",
            "caption_wd14.py",
          )
        : path.join(
            app.getPath("exe"), // Gets the directory of the executable
            "..", // Move up to the parent directory of the executable
            "resources",
            "app.asar.unpacked",
            "resources",
            "python",
            "caption_wd14.py",
          );
    const pythonExecutable =
      process.env.NODE_ENV === "development"
        ? path.join(
            app.getPath("exe"), // Gets the directory of the executable
            "../../../..", // Move up to the parent directory of the executable
            "resources",
            "venv/Scripts",
            "python.exe",
          )
        : path.join(
            app.getPath("exe"), // Gets the directory of the executable
            "..", // Move up to the parent directory of the executable
            "resources",
            "app.asar.unpacked",
            "resources",
            "venv/Scripts",
            "python.exe",
          );

    // Run the Python script directly with the virtual environment's Python executable
    const { stdout } = await execa(pythonExecutable, [
      pathToPythonScript,
      directory,
      "--caption_extension",
      ".txt",
    ]);
    return stdout.trim();
  } catch (error) {
    console.error(error);
    throw new Error("Failed to run WD14 script.");
  }
}

function parseJsonFromString(inputString) {
  // Regular expression to match code blocks with or without language specifier
  const codeBlockRegex = /^```\w*\n?([\s\S]*?)```$/;

  // Check for and remove code blocks if they exist
  const match = inputString.match(codeBlockRegex);
  if (match) {
    inputString = match[1];
  }

  // Trim any leading or trailing whitespace
  inputString = inputString.trim();

  // Parse and return the JSON
  try {
    return JSON.parse(inputString);
  } catch (e) {
    console.error("Error parsing JSON:", e);
    return null;
  }
}
function getImageFiles(dirPath, extension = ".png") {
  return fs.readdirSync(dirPath).filter((file) => file.endsWith(extension));
}

async function createImageDescriptions(
  images: string[],
  { systemMessage }: { systemMessage: string },
) {
  console.log(systemMessage);
  const openai = new OpenAI({
    apiKey: store.get("openaiApiKey") as string,
  });
  const imageContents: ChatCompletionContentPart[] = images.map((image) => ({
    type: "image_url",
    image_url: { url: `data:image/png;base64,${image}` },
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      { role: "system", content: systemMessage },
      {
        role: "user",
        content: imageContents,
      },
    ],
    max_tokens: 1000,
  });

  console.log("Descriptions >>>", response.choices[0].message.content);
  return parseJsonFromString(response.choices[0].message.content);
}

async function runGPTV(
  directory: string,
  {
    batchSize = 10,
    exampleResponse,
    systemMessage,
  }: { batchSize?: number; exampleResponse: string; systemMessage: string },
) {
  const imageFiles = getImageFiles(directory, ".jpg");
  console.log({ imageFiles, directory });
  for (let i = 0; i < imageFiles.length; i += batchSize) {
    const batch = imageFiles.slice(i, i + batchSize);
    const imageDescriptions = [];

    for (const file of batch) {
      const imagePath = path.join(directory, file);
      const buffer = await fsp.readFile(imagePath, "base64");
      imageDescriptions.push(buffer);
    }

    // Generate descriptions for the batch of images
    try {
      const descriptions = await createImageDescriptions(imageDescriptions, {
        systemMessage: `## GUIDELINES
        
${systemMessage}

## EXAMPLE RESPONSE

\`\`\`json
${exampleResponse}
\`\`\`
  `,
      });
      // Write descriptions to corresponding text files
      await Promise.all(
        batch.map(async (file, index) => {
          const textFilePath = path.join(
            directory,
            file.replace(".jpg", ".txt"),
          );
          // Copy the original image file to the output directory with the new name
          await fsp.writeFile(
            textFilePath,
            descriptions[index].toLowerCase(),
            "utf8",
          );
          console.log(`Description for ${file} written to ${textFilePath}`);
        }),
      );
    } catch (error) {
      console.error("Error generating descriptions:", error);
    }
  }

  return "done";
}

export const createWindow = (
  windowName: string,
  options: BrowserWindowConstructorOptions,
): BrowserWindow => {
  const key = "window-state";
  const name = `window-state-${windowName}`;
  const store = new Store<Rectangle>({ name });
  const defaultSize = {
    width: options.width,
    height: options.height,
  };
  let state = {};

  const restore = () => store.get(key, defaultSize);

  const getCurrentPosition = () => {
    const position = win.getPosition();
    const size = win.getSize();
    return {
      x: position[0],
      y: position[1],
      width: size[0],
      height: size[1],
    };
  };

  const windowWithinBounds = (windowState, bounds) => {
    return (
      windowState.x >= bounds.x &&
      windowState.y >= bounds.y &&
      windowState.x + windowState.width <= bounds.x + bounds.width &&
      windowState.y + windowState.height <= bounds.y + bounds.height
    );
  };

  const resetToDefaults = () => {
    const bounds = screen.getPrimaryDisplay().bounds;
    return Object.assign({}, defaultSize, {
      x: (bounds.width - defaultSize.width) / 2,
      y: (bounds.height - defaultSize.height) / 2,
    });
  };

  const ensureVisibleOnSomeDisplay = (windowState) => {
    const visible = screen.getAllDisplays().some((display) => {
      return windowWithinBounds(windowState, display.bounds);
    });
    if (!visible) {
      // Window is partially or fully not visible now.
      // Reset it to safe defaults.
      return resetToDefaults();
    }
    return windowState;
  };

  const saveState = () => {
    if (!win.isMinimized() && !win.isMaximized()) {
      Object.assign(state, getCurrentPosition());
    }
    store.set(key, state);
  };

  state = ensureVisibleOnSomeDisplay(restore());

  const win = new BrowserWindow({
    ...state,
    ...options,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      ...options.webPreferences,
    },
  });

  win.on("close", saveState);
  ipcMain.handle("dialog:openDirectory", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    if (canceled) {
      return;
    } else {
      return filePaths[0];
    }
  });

  ipcMain.handle("run-blip", async (event, directory) => {
    try {
      return runBlip(directory);
    } catch (error) {
      throw error;
    }
  });
  ipcMain.handle("run-wd14", async (event, directory) => {
    try {
      return runWd14(directory);
    } catch (error) {
      throw error;
    }
  });
  ipcMain.handle("run-gpt-v", async (event, directory, options) => {
    try {
      return runGPTV(directory, options);
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle("showContent", async (_event, directory) => {
    const files = fs.readdirSync(directory);
    const imageFiles = files.filter((file) => /\.(jpg|jpeg|png)$/i.test(file));

    return Promise.all(
      imageFiles.map(async (file, index) => {
        const filePath = path.join(directory, file);

        // Check for corresponding .txt file
        const captionPath = path.join(
          directory,
          file.replace(/\.(jpg|jpeg|png)$/i, ".txt"),
        );
        let caption = [];
        if (fs.existsSync(captionPath)) {
          caption = fs
            .readFileSync(captionPath, { encoding: "utf-8" })
            .split(",")
            .map((item) => item.trim());
        }
        const image = await Jimp.read(filePath);
        image.resize(1024, Jimp.AUTO);

        const resizedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
        const base64 = resizedBuffer.toString("base64");

        return {
          publicPath: `data:image/jpeg;base64,${base64}`,
          id: index,
          height: image.bitmap.height,
          width: image.bitmap.width,
          name,
          caption,
        };
      }),
    );
  });

  return win;
};
