import Head from "next/head";

export default function ComfyUI() {
	return (
		<>
			<Head>
				<title>ComfyUI</title>
			</Head>
			<webview src="http://127.0.0.1:8188/" style={{ position: "absolute", inset: 0 }} />
		</>
	);
}
