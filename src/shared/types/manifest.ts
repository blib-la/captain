export interface ResourceSource {
	url: string;
	destination: string;
	name: string;
	size: string;
	unzip: boolean;
}

export interface Resource {
	name: string;
	version: string;
	sources: ResourceSource[];
}

export type OS = "windows" | "macos" | "linux";

export interface Manifest extends Record<OS, Resource[]> {}
