import type { IPCHandlers } from "@captn/utils/types";
import { renderHook } from "@testing-library/react";
import { useAtom } from "jotai";

import { useThirdPartyAppsPath } from "../third-party-apps-path";

jest.mock("jotai", () => ({
	useAtom: jest.fn(() => [undefined, jest.fn()]),
	atom: jest.fn().mockImplementation(initialValue => ({ initialValue })),
}));

const mockSetThirdPartyAppsPath = jest.fn();

const mockSend = jest.fn();
const mockOn = jest.fn();

global.window.ipc = {
	send: mockSend,
	on: mockOn,
} as unknown as IPCHandlers;

describe("useThirdPartyAppsPath", () => {
	let unsubscribeMock: jest.Mock;

	beforeEach(() => {
		(useAtom as jest.Mock).mockImplementation(() => [undefined, mockSetThirdPartyAppsPath]);
		unsubscribeMock = jest.fn();
		mockOn.mockImplementation((channel, callback) => {
			callback("new/path");
			return unsubscribeMock;
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("should send IPC message to get third party apps path on mount", () => {
		renderHook(() => useThirdPartyAppsPath());

		expect(mockSend).toHaveBeenCalledWith("THIRD_PARTY_APPS:get-path");
	});

	it("should update path on receiving IPC path message", () => {
		renderHook(() => useThirdPartyAppsPath());

		expect(mockOn).toHaveBeenCalledWith("THIRD_PARTY_APPS:path", expect.any(Function));
		expect(mockSetThirdPartyAppsPath).toHaveBeenCalledWith("new/path");
	});

	it("should unsubscribe from IPC channel on unmount", () => {
		const { unmount } = renderHook(() => useThirdPartyAppsPath());
		unmount();

		expect(unsubscribeMock).toHaveBeenCalledTimes(1);
	});
});
