export function normalizePath(pathname: string) {
	return pathname.replaceAll("\\", "/").replace(/\/+/, "/");
}
