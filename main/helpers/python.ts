import { getDirectory } from "./utils";
import { execa } from "execa";

export async function python(arguments_: string[]) {
  const pathToEmbeddedPython = getDirectory("python-embeded", "python.exe");

  return execa(pathToEmbeddedPython, arguments_, {
    stdout: "inherit",
  });
}
