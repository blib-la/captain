export async function fetcher(key: string) {
	return window.ipc.fetch(key);
}
