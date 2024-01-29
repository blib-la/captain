import { spawn } from "child_process";
import { getDirectory } from "./utils";

export async function python(arguments_: string[]) {
  const pathToEmbeddedPython = getDirectory("python-embeded", "python.exe");

  return new Promise((resolve, reject) => {
    const process = spawn(pathToEmbeddedPython, arguments_);

    process.stdout.on("data", (data) => {
      console.log(data.toString());
    });

    process.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code ${code}`));
      } else {
        resolve(code);
      }
    });
  });
}
