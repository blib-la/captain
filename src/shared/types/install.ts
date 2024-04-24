export type ResourceSource = {
	url: string;
	destination: string;
	name: string;
	size: string;
	unzip: boolean;
};

export type Resource = {
	name: string;
	version: string;
	sources: ResourceSource[];
};
