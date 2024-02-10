import { runWd14 } from "../../main/helpers/caption";

describe("helpers/caption.ts", () => {
	it("should do captioning with wd14", async () => {
		const result = await runWd14();
		expect(result).toEqual("done");
	});
});
