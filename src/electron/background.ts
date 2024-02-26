import { app } from "electron";

import { main } from "@/main";

import "@/core-setup";
import "@/ipc/listeners";
import "@/ipc/story";
import "@/ipc/testing";

main().then(() => {
	console.log("started");
});

app.on("window-all-closed", () => {
	app.quit();
});
