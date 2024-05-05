import Link from "next/link";
import type { ReactElement } from "react";

import SvgCommunity from "../assets/illustrations/community.svg";
import SvgEasyPeasy from "../assets/illustrations/easy-peasy.svg";
import SvgOnlineCourses from "../assets/illustrations/online-courses.svg";
import SvgSale from "../assets/illustrations/sale.svg";
import SvgTools from "../assets/illustrations/tools.svg";
import SvgYourAI from "../assets/illustrations/your-ai.svg";
import { tw } from "../utils/tw";

interface CardData {
	id: string;
	title: string;
	description: string;
	media: ReactElement;
}

export type CardProperties = Omit<CardData, "id">;
const cardData: CardData[] = [
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

export function Card({ title, media, description }: CardProperties) {
	return (
		<div className="w-full flex sm:w-1/2 lg:w-1/3 p-2">
			<div className="w-full flex-1 p-4 bg-gray-100 dark:bg-gray-900">
				<header>
					<h3 className="text-lg mb-4 font-bold">{title}</h3>
				</header>
				<div
					className={tw`
					relative
					aspect-video
					-mx-2 [_&_svg]:absolute
					[_&_svg]:inset-0
					[_&_svg]:h-full
					[_&_svg]:w-full
					[_&_svg]:pointer-events-none
				`}
				>
					{media}
				</div>
				<p className="my-4">{description}</p>
			</div>
		</div>
	);
}

export function Cards() {
	return (
		<div className="flex flex-wrap py-4 -m-2">
			{cardData.map(card => (
				<Card
					key={card.id}
					title={card.title}
					media={card.media}
					description={card.description}
				/>
			))}
		</div>
	);
}

export function Hero() {
	return (
		<section className="relative w-full h-[70dvh] md:h-[50vh] text-center flex flex-col justify-center items-center">
			<h1 className="text-4xl md:text-6xl font-bold">Captain: Bring Your Ideas to Life</h1>
			<h2 className="text-xl md:text-2xl mt-8">A platform that evolves to your needs</h2>
			<div className="mt-8">
				<Link
					href="https://github.com/blib-la/captain"
					target="_blank"
					className={tw`
								inline-block
								py-2
								px-4

								bg-teal-600
								hover:bg-teal-700
								active:bg-teal-800
								text-white

								font-bold
							`}
				>
					Download Captain
				</Link>
			</div>
		</section>
	);
}
