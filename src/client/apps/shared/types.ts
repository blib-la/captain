export interface ComfyExecuted {
	type: "executed";
	data: {
		output: {
			images: { filename: string; subfolder: string }[];
		};
	};
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
