export type QueueWorkflowResponse = {
	promptId: string;
	number: number;
	node_errors: object;
};

interface Node<T extends Record<string, unknown> = Record<string, unknown>> {
	inputs: T;
	class_type: string;
}

// Represents the node chain as a mapping from string to Node
export type NodeChain = Record<string, Node>;
