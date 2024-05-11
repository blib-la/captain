export interface ComfyExecuted {
	type: "executed";
	data: {
		output: {
			images: { filename: string; subfolder: string }[];
		};
	};
}

export interface ComfyExecuting {
	type: "executing";
}

export interface ComfyCached {
	type: "execution_cached";
}

export interface ComfyStatusMessage {
	type: "status";

	data: {
		status: {
			exec_info: {
				queue_remaining: number;
			};
		};
	};
}
