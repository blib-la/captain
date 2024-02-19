import { app } from "electron";

import { main } from "@/main";

import "@/ipc/listeners";

main().then(() => {
	console.log("started");
});

app.on("window-all-closed", () => {
	app.quit();
});
