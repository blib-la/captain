import type { Mode } from "@mui/system/cssVars/useCurrentColorScheme";
import { useRouter } from "next/router";
import { useEffect } from "react";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";
import { useSsrColorScheme } from "@/ions/hooks/color-scheme";
import type { VectorStoreDocument } from "@/ions/hooks/vector-store";

export function handleSuggestion(suggestion: VectorStoreDocument) {
	switch (suggestion.payload.id) {
		case "action:user": {
			if (!suggestion.payload.action) {
				break;
			}

			try {
				const [action, key, value] = suggestion.payload.action.split(":");
				window.ipc.send("CAPTAIN_ACTION", {
					action,
					payload: {
						key,
						value,
						scope: "user",
					},
				});
			} catch (error) {
				console.log(error);
			}

			break;
		}

		case "action:window": {
			if (!suggestion.payload.action) {
				break;
			}

			try {
				const [action, key, value] = suggestion.payload.action.split(":");
				window.ipc.send("CAPTAIN_ACTION", {
					action,
					payload: {
						key,
						value,
						scope: "window",
					},
				});
			} catch (error) {
				console.log(error);
			}

			break;
		}

		default: {
			window.ipc.send(buildKey([ID.APP], { suffix: ":open" }), {
				data: suggestion.payload.id,
				action: suggestion.payload.action,
			});
		}
	}
}

export function useCaptainActionResponse() {
	const { setMode } = useSsrColorScheme();
	useEffect(() => {
		const unsubscribe = window.ipc.on(
			"CAPTAIN_ACTION",
			({ key, value }: { key: string; value: unknown }) => {
				console.log({ key, value });
				switch (key) {
					case "color-mode": {
						if (
							typeof value === "string" &&
							["system", "light", "dark"].includes(value)
						) {
							setMode(value as Mode);
						}

						break;
					}

					default: {
						break;
					}
				}
			}
		);
		return () => {
			unsubscribe();
		};
	}, [setMode]);
}

export function useCaptainAction() {
	const {
		asPath,
		query: { action },
	} = useRouter();
	useCaptainActionResponse();

	useEffect(() => {
		if (action && typeof action === "string") {
			const [command, id, value] = action.split(":");
			switch (command) {
				case "focus": {
					try {
						if (!id) {
							break;
						}

						const element = document.querySelector<HTMLElement>(
							`[data-captainid=${id}]`
						);
						if (element) {
							element.focus();
						}
					} catch (error) {
						console.log(error);
					}

					break;
				}

				case "set": {
					try {
						if (!id || value === undefined) {
							break;
						}

						console.log(`| id: ${id} | to: ${value} |`);
						window.ipc.send("CAPTAIN_ACTION", {
							action: "set",
							payload: { scope: "user", key: id, value },
						});
					} catch (error) {
						console.log(error);
					}

					break;
				}

				default: {
					break;
				}
			}
		}
	}, [action, asPath]);
}
