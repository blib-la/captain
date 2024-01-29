import path from "path";
import { app, Menu, protocol, shell } from "electron";
import serve from "electron-serve";
import { createWindow } from "./helpers";
import { store as userStore } from "./helpers/store";
import {
  LOCALE,
  MARKETPLACE_INDEX,
  MARKETPLACE_INDEX_DATA,
} from "./helpers/constants";
import i18next from "../next-i18next.config";
import { captainDataPath } from "./helpers/utils";
import fsp from "node:fs/promises";

import { exec } from "child_process";
import util from "util";
import { createJsonStructure } from "./helpers/read-index";
const execAsync = util.promisify(exec);

const isProd = process.env.NODE_ENV === "production";
app.commandLine.appendSwitch("enable-smooth-scrolling");

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

const protocolName = "my";
protocol.registerSchemesAsPrivileged([
  { scheme: protocolName, privileges: { bypassCSP: true } },
]);

app.whenReady().then(() => {
  protocol.registerFileProtocol(protocolName, (request, callback) => {
    const url = request.url.replace(`${protocolName}://`, "");
    try {
      return callback(decodeURIComponent(url));
    } catch (error) {
      // Handle the error as needed
      console.error(error);
    }
  });
});

async function removeMarketplaceIndex() {
  const directoryPath = path.join(captainDataPath, "marketplace-index");

  try {
    // Check if the directory exists
    await fsp.access(directoryPath);

    // If it exists, remove it
    await fsp.rm(directoryPath, { recursive: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      // If the directory does not exist, handle the 'no such file or directory' error
      console.log(
        "Directory does not exist, no need to remove:",
        directoryPath,
      );
    } else {
      // If other errors occur, handle them here
      console.error("Error removing directory:", error);
    }
  }
}

(async () => {
  await app.whenReady();

  const marketplaceIndex = (userStore.get(MARKETPLACE_INDEX) ||
    "git@github.com:blib-la/captain-marketplace.git") as string;

  try {
    await removeMarketplaceIndex();
    await fsp.mkdir(captainDataPath, { recursive: true });
    const command = `cd ${captainDataPath} && git clone ${marketplaceIndex} marketplace-index`;
    await execAsync(command);
  } catch (error) {
    console.error("Error executing command:", error);
  }

  const basePath = path.join(captainDataPath, "marketplace-index", "files"); // The path to the top-level directory

  try {
    const jsonStructure = await createJsonStructure(basePath);
    userStore.set(MARKETPLACE_INDEX_DATA, jsonStructure);
    await fsp.writeFile(
      path.join(captainDataPath, "index.json"),
      JSON.stringify(jsonStructure, null, 2),
    );
  } catch (error) {
    console.error("Error executing command:", error);
  }

  const mainWindow = await createWindow("main", {
    width: 1600,
    height: 1000,
    minHeight: 600,
    minWidth: 800,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  // Remove the default application menu
  if (isProd) {
    Menu.setApplicationMenu(null);
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // config.fileProtocol is my custom file protocol
    if (url.startsWith(`${protocolName}://`) || url.startsWith("app://")) {
      return { action: "allow" };
    }
    // open url in a browser and prevent default
    shell.openExternal(url);
    return { action: "deny" };
  });
  const locale = userStore.get(LOCALE) || i18next.i18n.defaultLocale;

  if (isProd) {
    await mainWindow.loadURL(`app://./${locale}/home`);
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/${locale}/home`);
    // mainWindow.webContents.openDevTools();
  }
})();

app.on("window-all-closed", () => {
  app.quit();
});
