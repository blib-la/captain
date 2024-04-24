import type { Resource } from "#/types/install";
import type { Manifest, OS } from "#/types/manifest";
import { appSettingsStore } from "@/stores";

/**
 * Checks for available updates based on the installed versions of resources.
 *
 * @param manifest - The complete resource manifest for all operating systems.
 * @param os - The current operating system to check updates for, which must be one of 'windows', 'macos', or 'linux'.
 *
 * @returns An array of resources that have updates available.
 */
export function checkUpdates(manifest: Manifest, os: OS): Resource[] {
	const updates: Resource[] = [];
	const resources = manifest[os] ?? [];

	for (const resource of resources) {
		const resourceName = resource.name;
		const expectedVersion = resource.version;
		const installedVersion = appSettingsStore.get(`resources.${resourceName}.version`);

		if (installedVersion !== expectedVersion) {
			updates.push(resource);
		}
	}

	return updates;
}
