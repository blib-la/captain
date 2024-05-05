import { useAtom } from "jotai/index";
import { useEffect } from "react";

import { thirdPartyAppsPathAtom } from "@/client/ions/atoms";
import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";

/**
 * A React hook that manages the path of third-party applications.
 * It subscribes to the relevant IPC (Inter-Process Communication) channel to listen for updates on the path,
 * and updates the state atom `thirdPartyAppsPathAtom` whenever a new path is received.
 *
 * This hook subscribes to IPC messages upon mounting, and unsubscribes on unmounting to clean up the event listener.
 * It uses the `buildKey` function to generate specific keys for the IPC messages based on the `ID.THIRD_PARTY_APPS` enum.
 *
 *
 * @requires thirdPartyAppsPathAtom - An atom from Jotai to manage the state of the third-party apps path.
 * @requires buildKey - A function to generate IPC message keys based on identifiers and optional suffixes.
 * @requires ID - An enumeration used to specify different IPC identifiers.
 *
 * @effects
 * - Subscribes to the IPC channel `buildKey([ID.THIRD_PARTY_APPS], { suffix: 'path' })` to receive updates on the path.
 * - Sends an IPC message using `buildKey([ID.THIRD_PARTY_APPS], { suffix: 'get-path' })` to request the current path.
 * - Automatically updates the `thirdPartyAppsPathAtom` state when a new path is broadcasted.
 * - Ensures clean-up by unsubscribing from the IPC channel when the component unmounts.
 *
 * @returns {void} This hook does not return a value; it solely operates side effects to manage state.
 */
export function useThirdPartyAppsPath() {
	const [, setThirdPartyAppsPath] = useAtom(thirdPartyAppsPathAtom);

	useEffect(() => {
		window.ipc.send(buildKey([ID.THIRD_PARTY_APPS], { suffix: ":get-path" }));
		const unsubscribe = window.ipc.on(
			buildKey([ID.THIRD_PARTY_APPS], { suffix: ":path" }),
			path_ => {
				setThirdPartyAppsPath(path_);
			}
		);

		return () => {
			unsubscribe();
		};
	}, [setThirdPartyAppsPath]);
}
