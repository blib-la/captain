import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { Card } from "@site/src/components/card";
import SvgCommunity from "@site/static/illustrations/community.svg";
import SvgEasyPeasy from "@site/static/illustrations/easy-peasy.svg";
import SvgOnlineCourses from "@site/static/illustrations/online-courses.svg";
import SvgSale from "@site/static/illustrations/sale.svg";
import SvgTools from "@site/static/illustrations/tools.svg";
import SvgYourAI from "@site/static/illustrations/your-ai.svg";
import Heading from "@theme/Heading";
import Layout from "@theme/Layout";
import clsx from "clsx";

import styles from "./index.module.css";

function HomepageHeader() {
	const { siteConfig } = useDocusaurusContext();
	return (
		<header className={styles["hero-banner"]}>
			<div className="container">
				<Heading as="h1" className="hero__title">
					{siteConfig.title}
				</Heading>
				<p className="hero__subtitle">{siteConfig.tagline}</p>
				<div className={styles.buttons}>
					<Link className="button button--secondary button--lg" to="/docs/api/">
						Download now
					</Link>
				</div>
			</div>
		</header>
	);
}

const cardData = [
	{
		id: "1",
		title: "Craft Your AI Adventures",
		media: <SvgYourAI />,
		description:
			"Unleash your creativity with Captain! Design your AI, tailor it to your needs, and bring your unique digital creations to life right on your computer. Whether you're a developer, an artist, or just curious, Captain makes AI accessible and fun for everyone.",
	},
	{
		id: "2",
		title: "AI Made Simple",
		media: <SvgEasyPeasy />,
		description:
			"Step into the world of AI without the complexity. Captain guides you through a smooth, step-by-step process that turns the intricate world of artificial intelligence into a straightforward journey. Build, test, and deploy AI apps with ease – no PhD required!",
	},
	{
		id: "3",
		title: "Discover the Marketplace",
		media: <SvgSale />,
		description:
			"Dive into Captain's bustling marketplace where creativity meets opportunity. Explore a vast array of apps, tools, and resources. Shop for ready-made AI solutions or sell your own creations to a community eager to see what you've crafted.",
	},
	{
		id: "4",
		title: "Tailor-Made Tools",
		media: <SvgTools />,
		description:
			"Customize your AI experience with drag-and-drop simplicity. Captain's flexible environment lets you tweak tools and settings to fit your specific needs, making your AI truly yours. It’s your workshop, where every tool is adjustable.",
	},
	{
		id: "5",
		title: "Join the Community",
		media: <SvgCommunity />,
		description:
			"Step into a vibrant community of innovators and creators. Share ideas, collaborate on projects, and get feedback from peers. Captain is not just a platform; it's a community hub where knowledge grows and connections are made.",
	},
	{
		id: "6",
		title: "Expand Your Skills",
		media: <SvgOnlineCourses />,
		description:
			"Whether you're a beginner or a seasoned pro, Captain offers resources to boost your AI skills. From in-depth tutorials to community workshops, get the insights and support you need to become an AI expert.",
	},
];

export default function Home() {
	return (
		<Layout
			title="Welcome to Captain by Blibla. Your local AI Hub"
			description="Explore, create, and innovate with Captain, your all-in-one platform to build and use AI apps effortlessly on your own computer."
		>
			<HomepageHeader />
			<main>
				<div className="container margin-vert--xl">
					<Heading as="h2" className={styles["main-heading"]}>
						Welcome to Captain
					</Heading>
					<p className="hero__subtitle">Create and run AI apps on your computer</p>
					<div className="row">
						{cardData.map(card => (
							<div
								key={card.id}
								className={clsx("col col--4", styles.flex1, styles["flex-stretch"])}
							>
								<Card
									title={card.title}
									media={card.media}
									className={styles.flex1}
								>
									{card.description}
								</Card>
							</div>
						))}
					</div>
				</div>
			</main>
		</Layout>
	);
}
