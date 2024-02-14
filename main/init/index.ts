import { spawn } from "child_process";

import { BrowserWindow } from "electron";

import { APP, BUILDING_CORE, INSTALLING_PYTHON } from "../helpers/constants";
import { store } from "../helpers/store";
import { getDirectory } from "../helpers/utils";

export function init() {
	store.set(`${INSTALLING_PYTHON}`, true);
	// Get the absolute paths to the script and requirements using getDirectory
	const requirementsPath = getDirectory("python", "requirements.txt");
	const powershellScriptPath = getDirectory("powershell", "embed-my-python-win.ps1");

	// Construct the command to execute the PowerShell script with the arguments
	const powershellCommand = `powershell.exe -ExecutionPolicy Bypass -File "${powershellScriptPath}" -v 3.10.11 -r "${requirementsPath}" -d "${getDirectory("python-embedded")}" -a "..\\."`;

	// Execute the PowerShell script
	const process = spawn(powershellCommand, { shell: true });

	// Listen to stdout
	process.stdout.on("data", data => {
		const window_ = BrowserWindow.getFocusedWindow();
		if (!window_) {
			return;
		}

		console.log(`stdout: ${data}`);
		window_.webContents.send(`${BUILDING_CORE}:stdout`, data);
	});

	// Listen to stderr
	process.stderr.on("data", data => {
		const window_ = BrowserWindow.getFocusedWindow();
		if (!window_) {
			return;
		}

		console.error(`stderr: ${data}`);
		window_.webContents.send(`${BUILDING_CORE}:stderr`, data);
	});

	// Handle script completion
	process.on("close", code => {
		store.set(`${INSTALLING_PYTHON}`, false);
		const window_ = BrowserWindow.getFocusedWindow();
		if (!window_) {
			return;
		}

		console.log(`PowerShell script finished with code ${code}`);
		window_.webContents.send(`${APP}:ready`, code);
	});

	// Handle process errors
	process.on("error", error => {
		const window_ = BrowserWindow.getFocusedWindow();
		if (!window_) {
			return;
		}

		console.error("Failed to start PowerShell script:", error);
		window_.webContents.send(`${BUILDING_CORE}:error`, error);
	});
}
