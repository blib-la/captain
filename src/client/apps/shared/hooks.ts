import type { SWRConfiguration } from "swr";
import useSWR from "swr";

export interface Inventory {
	id: string;
	filePath: string;
	modelPath: string;
	label: string;
}

export interface StableDiffusion {
	checkpoints?: Inventory[];
	loras?: Inventory[];
	vae?: Inventory[];
}

export function useInventory<T>(key: string, config?: SWRConfiguration<T>) {
	return useSWR(key, () => window.ipc.inventoryStore.get<T>(key), {
		refreshInterval: 2000,
		config,
	});
}
