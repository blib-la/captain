export const coreApps = ["live-painting", "story-writer"];

export function isCoreApp(appId: string) {
	return coreApps.includes(appId);
}
