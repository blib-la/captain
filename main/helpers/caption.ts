import { OpenAI } from "openai";
import { store } from "./store";
import { ChatCompletionContentPart } from "openai/resources/chat/completions";
import path from "node:path";
import fsp from "node:fs/promises";
import { getDirectory, getImageFiles, parseJsonFromString } from "./utils";
import { python } from "./python";
import { OPENAI_API_KEY } from "./constants";

export async function runBlip(directory: string): Promise<any> {
  try {
    const pathToPythonScript = getDirectory("python", "caption_blip.py");

    const { stdout, stderr } = await python([
      pathToPythonScript,
      directory,
      "--caption_extension",
      ".txt",
    ]);

    if (stderr) {
      console.error("Python Error:", stderr);
    }

    return stdout?.trim();
  } catch (error) {
    console.error("Error running BLIP:", error);
    throw new Error("Failed to run BLIP script. " + error.message);
  }
}

export async function runWd14(directory: string) {
  try {
    const pathToPythonScript = getDirectory("python", "caption_wd14.py");
    const { stdout } = await python([
      pathToPythonScript,
      directory,
      "--caption_extension",
      ".txt",
      "--remove_underscore",
    ]);
    return stdout?.trim();
  } catch (error) {
    console.error(error);
    throw new Error("Failed to run WD14 script.");
  }
}

export async function createImageDescriptions(
  images: string[],
  { systemMessage }: { systemMessage: string },
) {
  const openai = new OpenAI({
    apiKey: store.get(OPENAI_API_KEY) as string,
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

  return parseJsonFromString(response.choices[0].message.content);
}

export async function runGPTV(
  directory: string,
  {
    batchSize = 10,
    exampleResponse,
    guidelines,
  }: {
    batchSize?: number;
    exampleResponse: string;
    guidelines: string;
  },
) {
  const imageFiles = getImageFiles(directory);

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
Follow these guideline precisely:

${guidelines}

> Submit a valid JSON code block (see EXAMPLE RESPONSE)

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
            file.replace(/\.(jpg|jpeg|png)$/i, ".txt"),
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
