import { createReadStream, promises as fsPromises } from "node:fs";
import path from "node:path";

import { createPathHash } from "@/server/createPathHash";
import { getRootFolder } from "@/server/path";
import * as fileType from "file-type";
import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";

async function saveToFolder(
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

async function resizeImage(
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

async function streamOptimizedImage(
  filePath: string,
  response: NextApiResponse,
) {
  const readStream = createReadStream(filePath);

  // Optimize the image on the fly
  const transformer = sharp().resize(1080).jpeg({ quality: 80 });

  readStream.pipe(transformer).pipe(response);

  // Deduce the MIME type and set the header
  const bufferChunk = readStream.read(4100) || Buffer.alloc(0);
  const type = await fileType.fileTypeFromBuffer(bufferChunk);
  response.setHeader("Content-Type", type?.mime || "application/octet-stream");
}

async function serveOtherFile(filePath: string, response: NextApiResponse) {
  // Read the file into memory
  const fileData = await fsPromises.readFile(filePath);

  // Deduce the MIME type and set the header
  const type = await fileType.fileTypeFromBuffer(fileData);
  response.setHeader("Content-Type", type?.mime || "application/octet-stream");

  // Send the file as a response
  response.send(fileData);
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const rootFolder = getRootFolder(request.cookies);
  switch (request.method) {
    case "GET":
      try {
        const args = request.query.args as string[];
        const filePath = path.join(getRootFolder(request.cookies), ...args);

        const stats = await fsPromises.stat(filePath);
        if (stats.isFile()) {
          const readStream = createReadStream(filePath, { end: 4100 });

          const chunks = [];
          for await (const chunk of readStream) {
            chunks.push(chunk);
          }

          const bufferChunk = Buffer.concat(chunks);

          // Corrected to fileType.fileTypeFromBuffer
          const type = await fileType.fileTypeFromBuffer(bufferChunk);

          if (type?.mime.startsWith("image/")) {
            const rootFolderPathHash = createPathHash(rootFolder);
            const filePathHash = createPathHash(filePath);

            const tempFolderPath = path.join(
              process.cwd(),
              ".cm-cache",
              rootFolderPathHash,
            );
            const cachedFilePath = path.join(
              tempFolderPath,
              `${filePathHash}.jpg`,
            );

            try {
              await fsPromises.access(cachedFilePath);
              await streamOptimizedImage(cachedFilePath, response);
            } catch (error) {
              const dimensions = { width: 1024, height: 1024 };
              const quality = 0.7;
              const resizedBuffer = await resizeImage(
                filePath,
                dimensions,
                quality,
              );

              await saveToFolder(
                tempFolderPath,
                `${filePathHash}.jpg`,
                resizedBuffer,
              );
              await streamOptimizedImage(cachedFilePath, response);
            }
          } else {
            await serveOtherFile(filePath, response);
          }
        } else {
          response.status(404).send({ message: "File not found." });
        }
      } catch (error) {
        console.error(error);
        response.status(500).send({ message: "An unexpected error occurred." });
      }

      break;

    default:
      response.setHeader("Allow", ["GET"]);
      response.status(405).send({ message: "Method Not Allowed." });
  }
}
