import { useUnload } from "@captn/react/use-unload";
import Box from "@mui/joy/Box";
import CircularProgress from "@mui/joy/CircularProgress";
import Head from "next/head";
import { useEffect, useState } from "react";

import { buildKey } from "@/shared/build-key";
import { ID } from "@/shared/enums";

const APP_ID = "comfy-ui";

export default function ComfyUI() {
	const [port, setPort] = useState("");

	useEffect(() => {
		window.ipc.send(buildKey([ID.COMFYUI_PORT], { suffix: ":get" }));
		const unsubscribe = window.ipc.on(
			buildKey([ID.COMFYUI_PORT], { suffix: ":get" }),
			(port_: string) => {
				setPort(port_);
			}
		);
		return () => {
			unsubscribe();
		};
	}, []);

	// Unload models when the window is closed
	useUnload(APP_ID, "comfyui:free", {
		unloadModels: true,
		freeMemory: false,
	});

	return (
		<>
			<Head>
				<title>ComfyUI</title>
			</Head>
			{port ? (
				<webview
					src={`http://127.0.0.1:${port}/`}
					style={{ position: "absolute", inset: 0 }}
				/>
			) : (
				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
					}}
				>
					<CircularProgress />
				</Box>
			)}
		</>
	);
}
