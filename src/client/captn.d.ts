/// <reference types="@captn/joy/types" />
/// <reference types="node" />

import { Marketplace } from "@/shared/types/marketplace";

declare module "@captn/utils/types" {
	interface IPCHandlers {
		getMarketplaceData(payload: { url: string; download: boolean }): Promise<Marketplace>;
		appSettingsStore: {
			get<T>(key: string, defaultValue?: T): Promise<T>;
		};
	}
}
