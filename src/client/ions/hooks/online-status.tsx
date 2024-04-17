import { useEffect, useState } from "react";

/**
 * A hook to determine if we are connected to a network.
 */
export function useOnlineStatus() {
	const [isOnline, setIsOnline] = useState(false);

	useEffect(() => {
		function setOnline() {
			console.log("online");
			setIsOnline(true);
		}

		function setOffline() {
			console.log("offline");
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
