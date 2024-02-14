import { spawn } from "child_process";

import { INSTALLING_PYTHON } from "../helpers/constants";
import { store } from "../helpers/store";
import { getDirectory } from "../helpers/utils";

export function init(version: string) {
	store.set(INSTALLING_PYTHON, true);
	// Get the absolute paths to the script and requirements using getDirectory
	const requirementsPath = getDirectory("python", "requirements.txt");
	const powershellScriptPath = getDirectory("powershell", "embed-my-python-win.ps1");

	// Construct the command to execute the PowerShell script with the arguments
	const powershellCommand = `powershell.exe -ExecutionPolicy Bypass -File "${powershellScriptPath}" -v 3.10.11 -r "${requirementsPath}" -d "${getDirectory("python-embedded")}" -a "..\\." -c ${version}`;

	// Execute the PowerShell script
	const process = spawn(powershellCommand, { shell: true });
	process.on("close", () => {
		store.set(INSTALLING_PYTHON, false);
	});
}
