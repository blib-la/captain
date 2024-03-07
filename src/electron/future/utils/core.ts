export const coreApps = ["live-painting", "story", "datasets"] as const;

export type AppId = (typeof coreApps)[number];

export function isCoreApp(id: string): id is AppId {
	return (coreApps as readonly string[]).includes(id);
}

export const coreViews = ["dashboard", "settings", "feedback"] as const;

export type CoreView = (typeof coreViews)[number];

export function isCoreView(id: string): id is CoreView {
	return (coreViews as readonly string[]).includes(id);
}
