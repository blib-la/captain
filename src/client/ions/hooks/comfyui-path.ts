import { useAtom } from "jotai/index";
import { useEffect } from "react";

import { comfyUIPathAtom } from "@/client/ions/atoms";
import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";

/**
 * A React hook that manages the path of comfyUI.
 * It subscribes to the relevant IPC (Inter-Process Communication) channel to listen for updates on the path,
 * and updates the state atom `comfyUIPathAtom` whenever a new path is received.
 *
 * This hook subscribes to IPC messages upon mounting, and unsubscribes on unmounting to clean up the event listener.
 * It uses the `buildKey` function to generate specific keys for the IPC messages based on the `ID.COMFYUI` enum.
 *
 *
 * @requires comfyUIPathAtom - An atom from Jotai to manage the state of the comfyUI path.
 * @requires buildKey - A function to generate IPC message keys based on identifiers and optional suffixes.
 * @requires ID - An enumeration used to specify different IPC identifiers.
 *
 * @effects
 * - Subscribes to the IPC channel `buildKey([ID.COMFYUI], { suffix: 'path' })` to receive updates on the path.
 * - Sends an IPC message using `buildKey([ID.COMFYUI], { suffix: 'get-path' })` to request the current path.
 * - Automatically updates the `comfyUIPathAtom` state when a new path is broadcasted.
 * - Ensures clean-up by unsubscribing from the IPC channel when the component unmounts.
 *
 * @returns {void} This hook does not return a value; it solely operates side effects to manage state.
 */
export function useComfyUIPath() {
	const [, setComfyUIPath] = useAtom(comfyUIPathAtom);

	useEffect(() => {
		window.ipc.send(buildKey([ID.COMFYUI], { suffix: ":get-path" }));
		const unsubscribe = window.ipc.on(buildKey([ID.COMFYUI], { suffix: ":path" }), path_ => {
			setComfyUIPath(path_);
		});

		return () => {
			unsubscribe();
		};
	}, [setComfyUIPath]);
}
