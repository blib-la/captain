import { promises as fsPromises } from "fs";
import path from "node:path";
import sharp from "sharp";
import fs from "node:fs";

export async function saveToFolder(
  folderPath: string,
  fileName: string,
  buffer: Buffer,
) {
  // Ensure the directory exists
  await fsPromises.mkdir(folderPath, { recursive: true });

  // Save the file
  const fullPath = path.join(folderPath, fileName);
  await fsPromises.writeFile(fullPath, buffer);
  return fullPath;
}

export async function resizeImage(
  filePath: string,
  dimensions: { width: number; height: number },
  quality: number,
) {
  return sharp(filePath)
    .resize(dimensions.width, dimensions.height, {
      fit: "inside",
    })
    .jpeg({
      quality: quality * 100,
    })
    .toBuffer();
}

export async function copyDirectory(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    entry.isDirectory()
      ? copyDirectory(srcPath, destPath)
      : fs.copyFileSync(srcPath, destPath);
  }
}
