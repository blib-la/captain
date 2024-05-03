import { DEFAULT_PROTOCOL } from "@captn/utils/constants";
import { Card } from "@site/src/components/card";
import Heading from "@theme/Heading";
import Layout from "@theme/Layout";
import axios from "axios";
import clsx from "clsx";
import { useEffect } from "react";
import useSWR from "swr";

import styles from "./index.module.css";

const marketplaceUrl = "https://blib-la.github.io/captain-marketplace/captain.json";

function useMarketplace() {
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

function Marketplace() {
	const { apps } = useMarketplace();

	useEffect(() => {
		console.log(apps);
	}, [apps]);

	return (
		<div className="container">
			<Heading as="h1" className="hero__title">
				Captain Marketplace
			</Heading>
			<p className="hero__subtitle">Discover incredible AI apps for Captain</p>
			<Heading as="h2">Apps</Heading>
			<div className="row">
				{apps?.map(app => (
					<div
						key={app.id}
						className={clsx("col col--4", styles.flex1, styles["flex-stretch"])}
					>
						<Card
							title={app.payload.label}
							className={styles.flex1}
							media={
								<img
									src={app.payload.images.thumbnail}
									alt={app.payload.label}
									className={styles["image-fill"]}
								/>
							}
							button={{
								__type: "link",
								label: "Open in Captain",
								href: `${DEFAULT_PROTOCOL}://open?page=marketplace&app_id=${app.payload.id}`,
							}}
						>
							{app.payload.description}
						</Card>
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
