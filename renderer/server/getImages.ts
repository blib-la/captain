import fs from "node:fs/promises";
import path from "node:path";

import { globby } from "globby";
import sharp from "sharp";

export interface ImageModel {
  id: string;
  fullPath: string;
  publicPath: string;
  height: number;
  width: number;
  caption: string[];
}

export async function getImages(directory: string) {
  const imagePaths = await globby(
    [`${directory}/*.png`, `${directory}/*.jpeg`, `${directory}/*.jpg`],
    {},
  );
  console.log(directory, [
    `${directory}/*.png`,
    `${directory}/*.jpeg`,
    `${directory}/*.jpg`,
  ]);

  return Promise.all(
    imagePaths.map(async (fullPath) => {
      const publicPath = `/api/files${fullPath.split(directory).pop()}`;
      const captionPath = fullPath.replace(/\.(jpe?g|png)$/, ".txt");
      const caption: string[] = [];
      try {
        const existingCaption = await fs.readFile(captionPath, "utf-8");
        caption.push(
          ...existingCaption
            .trim()
            .toLowerCase()
            .split(",")
            .map((value) => value.trim().replace(/\s+/, " ")),
        );
      } catch {
        console.log(`no caption found for file ${fullPath}`);
      }

      // Use sharp to get the dimensions of the image
      const { width, height } = await sharp(fullPath).metadata();
      const { name } = path.parse(fullPath);

      return {
        id: name,
        fullPath,
        publicPath,
        width,
        height,
        caption: caption.filter(Boolean),
      } as ImageModel;
    }),
  );
}
