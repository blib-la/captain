import { useEffect, useState } from "react";

/**
 * A hook to determine if we are connected to a network.
 */
export function useOnlineStatus() {
	const [isOnline, setIsOnline] = useState(false);

	useEffect(() => {
		function setOnline() {
			setIsOnline(true);
		}

		function setOffline() {
			setIsOnline(false);
		}

		setIsOnline(navigator.onLine);

		window.addEventListener("online", setOnline);
		window.addEventListener("offline", setOffline);

		return () => {
			window.removeEventListener("online", setOnline);
			window.removeEventListener("offline", setOffline);
		};
	}, []);

	return isOnline;
}
