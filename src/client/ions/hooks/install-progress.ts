import { DownloadState } from "@captn/utils/constants";
import type { Progress } from "electron-dl";
import { useCallback, useEffect, useState } from "react";

import { buildKey } from "#/build-key";
import { ID } from "#/enums";

export function useInstallProgress({ state }: { state: DownloadState }) {
	const [status, setStatus] = useState(state);
	const [error, setError] = useState("");
	const [name, setName] = useState("");
	const [size, setSize] = useState("");
	const [progress, setProgress] = useState<Progress>({
		percent: 0,
		transferredBytes: 0,
		totalBytes: 0,
	});
	const reset = useCallback(() => {
		setProgress({
			percent: 0,
			transferredBytes: 0,
			totalBytes: 0,
		});
	}, []);

	useEffect(() => {
		const unsubscribeStarted = window.ipc.on(
			buildKey([ID.INSTALL], { suffix: ":started" }),
			({ name, size }) => {
				setStatus(DownloadState.ACTIVE);
				setName(name);
				setSize(size);
				setError("");
			}
		);
		const unsubscribeProgress = window.ipc.on(
			buildKey([ID.INSTALL], { suffix: ":progress" }),
			(progress: Progress) => {
				setStatus(DownloadState.ACTIVE);
				setProgress(progress);
			}
		);
		const unsubscribeCancelled = window.ipc.on(
			buildKey([ID.INSTALL], { suffix: ":canceled" }),
			() => {
				setStatus(DownloadState.CANCELED);
			}
		);
		const unsubscribeCompleted = window.ipc.on(
			buildKey([ID.INSTALL], { suffix: ":completed" }),
			() => {
				setStatus(DownloadState.DONE);
			}
		);
		const unsubscribeUnpacking = window.ipc.on(
			buildKey([ID.INSTALL], { suffix: ":unpacking" }),
			() => {
				setStatus(DownloadState.UNPACKING);
			}
		);
		const unsubscribeFailed = window.ipc.on(
			buildKey([ID.INSTALL], { suffix: ":failed" }),
			message => {
				setStatus(DownloadState.FAILED);
				setError(message);
			}
		);

		return () => {
			unsubscribeStarted();
			unsubscribeProgress();
			unsubscribeCancelled();
			unsubscribeCompleted();
			unsubscribeUnpacking();
			unsubscribeFailed();
		};
	}, []);
	return { status, progress, name, size, error, reset };
}
