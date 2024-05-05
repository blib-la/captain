import axios from "axios";
import Link from "next/link";
import { Callout } from "nextra/components";
import { useCallback, useEffect, useRef, useState } from "react";

import { tw } from "../utils/tw";

const marketplaceUrl = "https://blib-la.github.io/captain-marketplace/captain.json";

export interface AppPayload {
	images: {
		thumbnail: string;
	};
	type: string;
	label: string;
	description: string;
	author: string;
	link: string;
	license: string;
	architecture: string;
	sources: Array<{
		id: string;
		label: string;
		source: string;
		destination: string;
		unzip: boolean;
	}>;
}

export interface AppCardProperties {
	payload: AppPayload;
	appId: string;
	onUnregistered(reset: () => void): void;
}

export interface AppEntry {
	id: string;
	payload: AppPayload;
}

export function useMarketplace() {
	const [apps, setApps] = useState<AppEntry[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		async function fetchMarketplace() {
			setIsLoading(true);
			try {
				const { data } = await axios.get(marketplaceUrl);
				const apps_ = [];
				for (const app in data.apps) {
					if (Object.hasOwn(data.apps, app)) {
						apps_.push(data.apps[app]);
					}
				}

				setApps(apps_);
				setIsLoading(false);
			} catch (error) {
				if (error instanceof Error) {
					setError(error);
				}

				setIsLoading(false);
			}
		}

		fetchMarketplace().catch();
	}, []); // Empty dependency array ensures this effect runs only once after the initial render

	return { apps, isLoading, error };
}

/**
 * Custom React hook to handle deep linking. It attempts to redirect the user to a specified URL,
 * and checks if the application handling the URL is registered on the device. The hook manages
 * internal state to reflect whether the app is registered and if a link attempt is currently pending.
 *
 * @param {string} url - The URL intended for deep linking, which should be handled by a specific application.
 * @param {object} [options={}] - Optional parameters to customize the behavior of the deep linking process.
 * @param {number} [options.loadDelay=100] - Time in milliseconds before attempting the redirect, allowing for preparations.
 * @param {number} [options.resolveDelay=300] - Time in milliseconds to resolve whether the app is registered after attempting to redirect.
 *
 * @returns {{
 *   isRegistered: undefined | boolean,
 *   isPending: boolean,
 *   handleClick: Function
 * }} An object containing:
 *   - `isRegistered`: State variable indicating if the app to handle the URL is registered (`undefined` initially, then `true` or `false`).
 *   - `isPending`: State variable that shows if the deep linking process is currently in progress.
 *   - `handleClick`: A function to trigger the deep linking process.
 */
export function useDeepLink(url: string, { loadDelay = 100, resolveDelay = 200 } = {}) {
	const [isRegistered, setIsRegistered] = useState<undefined | boolean>();
	const [isPending, setIsPending] = useState(false);
	const isSupportedReference = useRef(false);

	function handleBlur() {
		isSupportedReference.current = true;
	}

	function handleClick() {
		setIsPending(true);

		const input = document.createElement("input");
		input.style.position = "fixed";
		input.style.right = "200vw";
		input.style.width = "0px";
		input.style.height = "0px";
		document.body.append(input);

		input.focus();
		input.addEventListener("blur", handleBlur);

		setTimeout(() => {
			window.location.href = url;
		}, loadDelay);

		setTimeout(() => {
			input.removeEventListener("blur", handleBlur);
			input.remove();
			setIsPending(false);
			setIsRegistered(isSupportedReference.current);
		}, resolveDelay);
	}

	const reset = useCallback(() => {
		setIsRegistered(undefined);
	}, []);

	return { isRegistered, isPending, handleClick, reset };
}

export function AppCard({ payload, appId, onUnregistered }: AppCardProperties) {
	const { isRegistered, isPending, handleClick, reset } = useDeepLink(
		`captain://open?page=${encodeURIComponent("core/marketplace")}&app_id=${appId}`
	);
	const unregisteredReference = useRef(onUnregistered);

	useEffect(() => {
		unregisteredReference.current = onUnregistered;
	}, [onUnregistered]);

	useEffect(() => {
		if (isRegistered === false) {
			onUnregistered(reset);
		}
	}, [reset, isRegistered, onUnregistered]);

	return (
		<div className="w-full flex sm:w-1/2 lg:w-1/3 p-2">
			<div className="w-full flex-1 p-4 bg-gray-100 dark:bg-gray-900">
				<header>
					<h3 className="text-lg mb-4">{payload.label}</h3>
				</header>
				<div className="relative aspect-video -mx-4">
					<img
						src={payload.images.thumbnail}
						alt={payload.label}
						className="absolute inset-0 w-full h-full object-cover object-center"
					/>
				</div>
				<p className="my-4">{payload.description}</p>
				<footer>
					<button
						disabled={isPending}
						className={tw`
						w-full
						py-2
						px-4

						bg-gray-200/60
						hover:bg-gray-200/80
						active:bg-gray-200
						text-black

						dark:bg-gray-800
						dark:hover:bg-gray-800/80
						dark:active:bg-gray-800/60
						dark:text-white

						font-bold
					`}
						onClick={handleClick}
					>
						Open in Captain
					</button>
				</footer>
			</div>
		</div>
	);
}

function Snackbar({ open, onClose }: { open: boolean; onClose(): void }) {
	return (
		open && (
			<div className="absolute right-0 bottom-0 m-2">
				<Callout type="warning" emoji="⚠️">
					<div className="relative pb-8">
						<button
							aria-label="Close"
							className="absolute top-0 right-0 -mr-4 -mt-2 p-2"
							type="button"
							onClick={onClose}
						>
							<svg aria-hidden="true" viewBox="0 0 24 24" height={24} width={24}>
								<path
									fill="currentColor"
									d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
								/>
							</svg>
						</button>
					</div>
					<p>
						It looks like you don&apos;t have Captain installed. Do you want to download
						it now?
					</p>
					<footer className="mt-4">
						<Link
							href="https://github.com/blib-la/captain"
							target="_blank"
							className={tw`
								inline-block
								py-2
								px-4

								bg-amber-200/60
								hover:bg-amber-200/80
								active:bg-amber-200
								text-black

								dark:bg-amber-800
								dark:hover:bg-amber-800/80
								dark:active:bg-amber-800/60
								dark:text-white

								font-bold
								rounded-none
							`}
						>
							Download Captain
						</Link>
					</footer>
				</Callout>
			</div>
		)
	);
}

export function Marketplace() {
	const { apps } = useMarketplace();
	const [isUnregistered, setIsUnregistered] = useState(false);
	const resetReference = useRef(() => {});

	return (
		<>
			<Snackbar
				open={isUnregistered}
				onClose={() => {
					setIsUnregistered(false);
					resetReference.current();
				}}
			/>
			<div className="flex flex-wrap py-4 -m-2">
				{apps.map(app => (
					<AppCard
						key={app.id}
						appId={app.id}
						payload={app.payload}
						onUnregistered={reset => {
							setIsUnregistered(true);
							resetReference.current = reset;
						}}
					/>
				))}
			</div>
		</>
	);
}
