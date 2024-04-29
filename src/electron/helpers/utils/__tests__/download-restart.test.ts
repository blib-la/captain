import { DownloadState } from "@captn/utils/constants";

import type { Tree } from "../download-restart";
import { modifyState, traverseAndModify } from "../download-restart";

describe("modifyState", () => {
	it("should return DONE when the input state is RESTART", () => {
		expect(modifyState(DownloadState.RESTART)).toBe(DownloadState.DONE);
	});

	it("should return the original state when it is not RESTART", () => {
		expect(modifyState(DownloadState.IDLE)).toBe(DownloadState.IDLE);
		expect(modifyState(DownloadState.DONE)).toBe(DownloadState.DONE);
		expect(modifyState(DownloadState.ACTIVE)).toBe(DownloadState.ACTIVE);
	});
});

describe("traverseAndModify", () => {
	it("should handle an empty tree", () => {
		expect(traverseAndModify({})).toEqual({});
	});

	it("should modify a flat tree with a RESTART state", () => {
		const tree: Tree = { status: DownloadState.RESTART };
		expect(traverseAndModify(tree)).toEqual({ status: DownloadState.DONE });
	});

	it("should not modify a flat tree without a RESTART state", () => {
		const tree: Tree = { status: DownloadState.ACTIVE };
		expect(traverseAndModify(tree)).toEqual({ status: DownloadState.ACTIVE });
	});

	it("should modify a nested tree with multiple RESTART states", () => {
		const tree: Tree = {
			first: { status: DownloadState.RESTART },
			second: { status: DownloadState.IDLE, nested: { status: DownloadState.RESTART } },
		};
		const expectedTree: Tree = {
			first: { status: DownloadState.DONE },
			second: { status: DownloadState.IDLE, nested: { status: DownloadState.DONE } },
		};
		expect(traverseAndModify(tree)).toEqual(expectedTree);
	});

	it("should traverse deeply nested structures", () => {
		const tree: Tree = {
			level1: {
				level2: {
					level3: { status: DownloadState.RESTART },
				},
				other: { status: DownloadState.ACTIVE },
			},
		};
		const expectedTree: Tree = {
			level1: {
				level2: {
					level3: { status: DownloadState.DONE },
				},
				other: { status: DownloadState.ACTIVE },
			},
		};
		expect(traverseAndModify(tree)).toEqual(expectedTree);
	});
});
