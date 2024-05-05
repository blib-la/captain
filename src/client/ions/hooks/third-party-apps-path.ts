import { useAtom } from "jotai/index";
import { useEffect } from "react";

import { thirdPartyAppsPathAtom } from "@/client/ions/atoms";
import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";

export function useThirdPartyAppsPath() {
	const [, setThirdPartyAppsPath] = useAtom(thirdPartyAppsPathAtom);

	useEffect(() => {
		window.ipc.send(buildKey([ID.THIRD_PARTY_APPS], { suffix: "get-path" }));
		const unsubscribe = window.ipc.on(
			buildKey([ID.THIRD_PARTY_APPS], { suffix: "path" }),
			path_ => {
				console.log("yehh");
				setThirdPartyAppsPath(path_);
			}
		);

		return () => {
			unsubscribe();
		};
	}, [setThirdPartyAppsPath]);
}
