/// <reference types="@captn/joy/types" />
/// <reference types="node" />

import { Marketplace } from "#/types/marketplace";

declare module "@captn/utils/types" {
	interface IPCHandlers {
		getMarketplaceData(payload: { url: string; download: boolean }): Promise<Marketplace>;
	}
}
