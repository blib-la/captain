import Link from "next/link";

import { Logo } from "./components/logo";

const themeConfig = {
	logo: (
		<>
			<Logo />
			<span style={{ marginLeft: ".4em", fontWeight: 800 }}>Captain</span>
		</>
	),
	logoLink: true,
	//
	docsRepositoryBase: "https://github.com/blib-la/captain/tree/alpha",
	head: (
		<>
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<meta property="og:title" content="Captain" />
			<meta
				property="og:description"
				content="A platform that evolves to your needs and brings your ideas to life"
			/>
			<meta property="og:image" content="/images/social-card.png" />
			<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" type="image/x-icon" />
		</>
	),
	editLink: {
		component: null,
	},
	darkMode: true,
	primaryHue: 176,
	primarySaturation: 60,
	useNextSeoProps() {
		return {
			titleTemplate: "%s – Captain",
		};
	},
	project: {
		link: "https://github.com/blib-la/captain",
	},
	chat: {
		link: "https://discord.com/invite/m3TBB9XEkb",
	},
	banner: {
		dismissible: true,
		key: "banner",
		text: <span>Captain is currently in ALPHA. We are happy to get your feedback</span>,
	},
	footer: {
		text: (
			<div className="w-full">
				<div className="flex flex-wrap justify-end gap-2">
					<Link href="https://blib.la/legal/imprint" target="_blank">
						Imprint
					</Link>
					<Link href="https://blib.la/legal/data-privacy" target="_blank">
						Data Privacy
					</Link>
				</div>
				<div className="mt-4">
					We value your privacy. While our site does not use cookies, we store essential
					settings such as your preferred color mode and banner visibility in your
					browser&apos;s local storage. To delete these settings, please clear your
					browser&apos;s local storage.
				</div>
				<div className="flex justify-center mt-4">
					<span>
						AGPL-3.0 {new Date().getFullYear()} ©{" "}
						<a href="https://blibl.la" target="_blank">
							Blibla
						</a>
					</span>
					.
				</div>
			</div>
		),
	},
};

export default themeConfig;
