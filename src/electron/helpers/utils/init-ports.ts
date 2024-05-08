import getPort from "get-port";

import { PORTS } from "@/electron/constants";

/**
 * Initialize the ports needed for all the applications that Captain is using under the hood.
 *
 * Note: It is a good idea to define default ports, because if we use a default port, then the
 * Windows firewall will always ask the user if they want to allow access to the specific port.
 */
export async function initPorts() {
	PORTS.COMFYUI ||= await getPort({ port: [1338, 1339, 1340] });
	PORTS.VECTOR_STORE ||= await getPort({ port: [6333, 6334, 6335] });
}
