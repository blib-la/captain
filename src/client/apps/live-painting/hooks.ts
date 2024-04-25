import { useSDK } from "@captn/react/use-sdk";
import { useEffect } from "react";

import { APP_ID } from "@/apps/live-painting/constants";

export function useUnload() {
	const { send } = useSDK<unknown, string>(APP_ID, {});
	useEffect(() => {
		function beforeUnload() {
			send({ action: "image-to-image:stop", payload: APP_ID });
		}

		window.addEventListener("beforeunload", beforeUnload);
		return () => {
			window.removeEventListener("beforeunload", beforeUnload);
		};
	}, [send]);
}
