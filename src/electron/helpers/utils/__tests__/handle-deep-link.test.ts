import { handleDeepLink } from "../handle-deep-link";

import { keyStore } from "@/stores";

jest.mock("@/stores", () => ({
	keyStore: {
		set: jest.fn(),
	},
}));

describe("handleDeepLink", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should extract and save access token when present", () => {
		const testUrl = "captain-login://open?access_token=validToken123";
		handleDeepLink(testUrl);
		expect(keyStore.set).toHaveBeenCalledWith("captainCloud.accessToken", "validToken123");
	});

	it("should not save access token when it is not present", () => {
		const testUrl = "captain-login://open";
		handleDeepLink(testUrl);
		expect(keyStore.set).not.toHaveBeenCalled();
	});
});
