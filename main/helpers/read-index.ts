import fse from "fs-extra";
import fsp from "node:fs/promises";
import path from "node:path";
import JSON5 from "json5";
import exifr from "exifr";
import sharp from "sharp";
import { captainDataPath } from "./utils";

type JsonStructure = Record<string, any>;

export async function createJsonStructure(
  basePath: string,
): Promise<JsonStructure> {
  const topLevelStructure: JsonStructure = {};
  console.log({ basePath });

  async function constructStructure(currentPath: string, obj: JsonStructure) {
    const items = await fsp.readdir(currentPath);

    const id = path.basename(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stats = await fse.stat(fullPath);

      if (stats.isDirectory()) {
        const itemKey = item;
        obj[item] = {};
        await constructStructure(fullPath, obj[itemKey]);
      } else if (stats.isFile()) {
        const fileExt = path.extname(fullPath).toLowerCase();
        if ([".json", ".json5"].includes(fileExt)) {
          const fileContents = await fsp.readFile(fullPath, "utf8");
          const parsedJson = JSON5.parse(fileContents);
          const fileNameKey = path.basename(item, fileExt);
          obj[fileNameKey] = parsedJson;
          obj.id = id;
        } else if ([".jpg", ".jpeg", ".png"].includes(fileExt)) {
          const imageBuffer = await fsp.readFile(fullPath);
          const exifData = await exifr.parse(imageBuffer);
          const resizedImageBuffer = await sharp(imageBuffer)
            .resize(512, 512)
            .jpeg({ quality: 70, progressive: true })
            .toBuffer();

          const indexPath = path.join(captainDataPath, "index");
          const previewPath = path.join(indexPath, `${id}.jpg`);
          obj.preview = previewPath;
          obj.meta = exifData;
          await fsp.mkdir(indexPath, { recursive: true });
          await fsp.writeFile(previewPath, resizedImageBuffer);
        }
      }
    }
  }

  const topLevelDirectories = await fse.readdir(basePath);
  for (const dir of topLevelDirectories) {
    const fullPath = path.join(basePath, dir);
    if ((await fse.stat(fullPath)).isDirectory()) {
      const dirKey = dir;
      topLevelStructure[dirKey] = {};
      await constructStructure(fullPath, topLevelStructure[dirKey]);
    }
  }

  return topLevelStructure;
}

// Usage
