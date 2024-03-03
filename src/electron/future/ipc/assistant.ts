import { ipcMain } from "electron";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { save } from "@/utils/vector-store";

ipcMain.on(buildKey([ID.ASSISTANT], { suffix: ":save" }), async (_event, data) => {
	try {
		const result = await save(data);

		_event.sender.send(buildKey([ID.ASSISTANT], { suffix: ":saved" }), result);
	} catch (error) {
		_event.sender.send(buildKey([ID.ASSISTANT], { suffix: ":error" }), error);
	}
});
