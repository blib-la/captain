import { app } from "electron";

export const isProduction = process.env.NODE_ENV === "production";
export const isTest =
	process.env.TEST_ENV === "local" ||
	process.env.TEST_ENV === "test" ||
	process.env.NODE_ENV === "test";

export const isDevelopment = process.env.NODE_ENV === "development";

// Obtain a lock to check if the app is locked (primary instance)
// If false, we close the app, as we want to prevent multiple instances of our app
// https://github.com/electron/electron/blob/v30.0.0-nightly.20240221/docs/api/app.md#apprequestsingleinstancelockadditionaldata
export const gotTheLock = app.requestSingleInstanceLock();
