import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Heading from "@theme/Heading";
import Layout from "@theme/Layout";
import clsx from "clsx";

import styles from "./index.module.css";

function HomepageHeader() {
	const { siteConfig } = useDocusaurusContext();
	return (
		<header className={clsx("hero hero--primary", styles["hero-banner"])}>
			<div className="container">
				<Heading as="h1" className="hero__title">
					{siteConfig.title}
				</Heading>
				<p className="hero__subtitle">{siteConfig.tagline}</p>
				<div className={styles.buttons}>
					<Link className="button button--secondary button--lg" to="/docs/api">
						Read the API documentation
					</Link>
				</div>
			</div>
		</header>
	);
}

export default function Home() {
	return (
		<Layout
			title="Welcome to Captain by Blibla. Your local AI Hub"
			description="Explore, create, and innovate with Captain, your all-in-one platform to build and use AI apps effortlessly on your own computer."
		>
			<HomepageHeader />
			<main>
				<div className="container">
					<Heading as="h2" className={styles["main-heading"]}>
						Welcome to Captain
					</Heading>
					<p className="hero__subtitle">Create and run AI apps on your computer</p>
				</div>
			</main>
		</Layout>
	);
}
