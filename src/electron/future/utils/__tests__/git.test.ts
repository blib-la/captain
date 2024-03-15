import fs from "node:fs";

import { execa } from "execa";

jest.mock("execa");

import { clone, lfs } from "@/utils/git";
import { getCaptainDownloads, getCaptainData } from "@/utils/path-helpers";

jest.mock("@/utils/path-helpers", () => ({
	getCaptainData: jest.fn(),
	getCaptainDownloads: jest.fn(),
}));

const mockedExeca = execa as jest.MockedFunction<typeof execa>;

describe("lfs", () => {
	const fakePath = "path/to/git";
	const successMessage = "Git LFS has been set up successfully.";

	beforeEach(() => {
		(getCaptainData as jest.Mock).mockReturnValue(fakePath);
		mockedExeca.mockClear();
	});

	it("should return a success message when LFS setup is successful", async () => {
		// Mock execa to resolve successfully
		(execa as jest.Mock).mockResolvedValueOnce({
			stdout: "Git LFS initialized",
			stderr: "",
			exitCode: 0,
		});

		const result = await lfs();

		expect(mockedExeca).toHaveBeenCalledWith(fakePath, ["lfs", "install"]);
		expect(result).toBe(successMessage);
	});

	it("should return an error message when LFS setup fails", async () => {
		const errorMessage = "Error setting up Git LFS";

		// Mock execa to reject to simulate an error
		(execa as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

		const result = await lfs();

		expect(mockedExeca).toHaveBeenCalledWith(fakePath, ["lfs", "install"]);
		// Check that the function returns the expected error message
		expect(result).toBe(`Error setting up Git LFS: Error: ${errorMessage}`);
	});
});

describe("clone", () => {
	const destination = "destination";
	const repository = "some/repo";
	const fakePath = "path/to/git";
	const fakeDestination = "path/to/destination";

	beforeEach(() => {
		(getCaptainDownloads as jest.Mock).mockReturnValue(fakeDestination);
		(getCaptainData as jest.Mock).mockReturnValue(fakePath);
		mockedExeca.mockClear();

		const mockChildProcess = {
			stderr: {
				on: jest.fn((event, handler) => {
					if (event === "data") {
						handler(Buffer.from("Receiving objects: 20%"));
						handler(Buffer.from("Receiving objects: 100%"));
					}
				}),
			},
		};

		(execa as jest.Mock).mockImplementation(() => mockChildProcess);
	});

	it("should execute the git clone command with correct arguments", async () => {
		await clone(repository, destination);

		expect(mockedExeca).toHaveBeenCalledWith(fakePath, [
			"clone",
			"--progress",
			`git@hf.co:${repository}`,
			fakeDestination,
		]);
	});

	it("should call onProgress with the correct progress data", async () => {
		const onProgressMock = jest.fn();

		await clone(repository, destination, { onProgress: onProgressMock });

		expect(onProgressMock).toHaveBeenCalledWith({
			percent: 0.2,
			transferredBytes: 0,
			totalBytes: 0,
		});
		expect(onProgressMock).toHaveBeenCalledWith({
			percent: 1,
			transferredBytes: 0,
			totalBytes: 0,
		});
	});

	it("should call onCompleted once cloning is completed", async () => {
		const onCompletedMock = jest.fn();

		await clone(repository, destination, { onCompleted: onCompletedMock });

		expect(onCompletedMock).toHaveBeenCalledWith({
			path: fakeDestination,
		});
	});

	it("should throw an error when cloning fails", async () => {
		const error = new Error("Failed to clone");
		(execa as jest.Mock).mockImplementationOnce(() => {
			throw error;
		});

		await expect(clone(repository, destination)).rejects.toThrow(error);
	});

	it("should throw an error when updating an existing repository fails", async () => {
		const error = new Error("Failed to update");

		jest.spyOn(fs, "existsSync").mockReturnValue(true);

		(execa as jest.Mock).mockImplementation(() => {
			throw error;
		});

		await expect(clone(repository, destination)).rejects.toThrow("Failed to update");
	});

	it("should throw an error when Git LFS fetch fails", async () => {
		const error = new Error("Failed to fetch LFS objects");
		jest.spyOn(fs, "existsSync").mockReturnValueOnce(false);

		(execa as jest.Mock).mockImplementationOnce(() => ({}));

		(execa as jest.Mock).mockImplementationOnce(() => {
			throw error;
		});

		await expect(clone(repository, destination)).rejects.toThrow(error);
	});

	it("should successfully update an existing repository", async () => {
		jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);

		(execa as jest.Mock).mockImplementationOnce(() => ({}));

		const onProgressMock = jest.fn();
		const onCompletedMock = jest.fn();

		await clone(repository, destination, {
			onProgress: onProgressMock,
			onCompleted: onCompletedMock,
		});

		expect(onProgressMock).toHaveBeenCalledWith({
			percent: 1,
			transferredBytes: 0,
			totalBytes: 0,
		});
		expect(onCompletedMock).toHaveBeenCalledWith({ path: expect.any(String) });
	});

	it("should throw an error when updating an existing repository fails", async () => {
		jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
		const updateError = new Error("Update failed");
		mockedExeca.mockRejectedValueOnce(updateError);

		await expect(clone(repository, destination)).rejects.toThrow("Updating repository failed");
	});

	it("should report progress during clone operation", async () => {
		jest.spyOn(fs, "existsSync").mockReturnValueOnce(false);

		const mockChildProcess = {
			stderr: {
				on: jest.fn((event, handler) => {
					if (event === "data") {
						handler(Buffer.from("Receiving objects: 100%"));
					}
				}),
			},
		};
		mockedExeca.mockReturnValueOnce(mockChildProcess as any);

		const onProgressMock = jest.fn();

		await clone(repository, destination, { onProgress: onProgressMock });

		expect(onProgressMock).toHaveBeenCalledWith({
			percent: 1,
			transferredBytes: 0,
			totalBytes: 0,
		});
	});

	it("should successfully fetch and checkout LFS objects", async () => {
		jest.spyOn(fs, "existsSync").mockReturnValueOnce(false);
		(execa as jest.Mock).mockImplementationOnce(() => ({}));
		(execa as jest.Mock).mockImplementationOnce(() => ({}));
		(execa as jest.Mock).mockImplementationOnce(() => ({}));

		const onCompletedMock = jest.fn();

		await clone(repository, destination, { onCompleted: onCompletedMock });

		expect(onCompletedMock).toHaveBeenCalledTimes(1);
	});

	it("should throw an error when LFS fetch fails", async () => {
		jest.spyOn(fs, "existsSync").mockReturnValueOnce(false);
		(execa as jest.Mock).mockImplementationOnce(() => ({}));
		const lfsFetchError = new Error("LFS fetch failed");
		(execa as jest.Mock).mockRejectedValueOnce(lfsFetchError);

		await expect(clone(repository, destination)).rejects.toThrow(
			"Fetching Git LFS objects failed"
		);
	});

	it("should throw an error when LFS checkout fails", async () => {
		jest.spyOn(fs, "existsSync").mockReturnValueOnce(false);
		(execa as jest.Mock).mockImplementationOnce(() => ({}));
		(execa as jest.Mock).mockImplementationOnce(() => ({}));
		const lfsCheckoutError = new Error("LFS checkout failed");
		(execa as jest.Mock).mockRejectedValueOnce(lfsCheckoutError);

		await expect(clone(repository, destination)).rejects.toThrow("Git LFS checkout failed");
	});

	it("should successfully update an existing repository and report completion", async () => {
		jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
		(execa as jest.Mock).mockImplementationOnce(() => ({}));

		const onProgressMock = jest.fn();
		const onCompletedMock = jest.fn();

		await clone(repository, destination, {
			onProgress: onProgressMock,
			onCompleted: onCompletedMock,
		});

		expect(onProgressMock).toHaveBeenCalledWith({
			percent: 1,
			transferredBytes: 0,
			totalBytes: 0,
		});
		expect(onCompletedMock).toHaveBeenCalledWith({ path: fakeDestination });
	});

	it("should throw an error when updating an existing repository fails", async () => {
		jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
		const updateError = new Error("Update failed");
		(execa as jest.Mock).mockImplementationOnce(() => {
			throw updateError;
		});

		await expect(clone(repository, destination)).rejects.toThrow("Updating repository failed");
	});
});
