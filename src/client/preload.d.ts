import { IpcHandler } from "../electron/preload";

declare global {
	interface Window {
		ipc: IpcHandler;
	}
}
