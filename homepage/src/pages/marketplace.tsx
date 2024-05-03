import Link from "@docusaurus/Link";
import { Card } from "@site/src/components/card";
import Heading from "@theme/Heading";
import Layout from "@theme/Layout";
import axios from "axios";
import clsx from "clsx";
import { useCallback, useEffect, useRef } from "react";
import { useState } from "react";
import useSWR from "swr";

import styles from "./index.module.css";

const marketplaceUrl = "https://blib-la.github.io/captain-marketplace/captain.json";

export function useMarketplace() {
	const {
		data: apps,
		isLoading,
		error,
	} = useSWR("marketplace", async () => {
		const { data } = await axios.get(marketplaceUrl);
		const apps_ = [];
		for (const app in data.apps) {
			if (Object.hasOwn(data.apps, app)) {
				const app_ = data.apps[app];
				apps_.push(app_);
			}
		}

		return apps_;
	});

	return {
		apps,
		error,
		isLoading,
	};
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
		<Card
			title={payload.label}
			className={styles.flex1}
			media={
				<img
					src={payload.images.thumbnail}
					alt={payload.label}
					className={styles["image-fill"]}
				/>
			}
			button={{
				disabled: isPending,
				__type: "button",
				label: "Open in Captain",
				onClick: handleClick,
				className: "button--primary",
			}}
		>
			{payload.description}
		</Card>
	);
}

export function Marketplace() {
	const { apps } = useMarketplace();
	const [isUnregistered, setIsUnregistered] = useState(false);
	const resetReference = useRef(() => {});

	return (
		<div className="container">
			<Heading as="h1" className="hero__title">
				Captain Marketplace
			</Heading>
			<p className="hero__subtitle">Discover incredible AI apps for Captain</p>
			<Heading as="h2">Apps</Heading>
			{isUnregistered && (
				<div
					role="alert"
					className={clsx(
						"alert alert--warning",
						styles["unregistered-alert"],
						styles.alert
					)}
				>
					<button
						aria-label="Close"
						className={clsx("clean-btn", styles.close)}
						type="button"
						onClick={() => {
							setIsUnregistered(false);
							resetReference.current();
						}}
					>
						<svg aria-hidden="true" viewBox="0 0 24 24" className={styles["svg-icon"]}>
							<path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
						</svg>
					</button>
					<p>
						It looks like you don&apos;t have Captain installed. Do you want to download
						it now?
					</p>
					<Link to="/docs/api" className="button button--block button--warning">
						Download Captain
					</Link>
				</div>
			)}
			<div className="row">
				{apps?.map(app => (
					<div
						key={app.id}
						className={clsx("col col--4", styles.flex1, styles["flex-stretch"])}
					>
						<AppCard
							appId={app.id}
							payload={app.payload}
							onUnregistered={reset => {
								setIsUnregistered(true);
								resetReference.current = reset;
							}}
						/>
					</div>
				))}
			</div>
		</div>
	);
}

export default function Page() {
	return (
		<Layout title="Captain Marketplace" description="Explore AI tools.">
			<main>
				<div className="container margin-vert--xl">
					<Marketplace />
				</div>
			</main>
		</Layout>
	);
}
