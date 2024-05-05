import { app } from "electron";

// Obtain a lock to check if the app is locked (primary instance)
// If false, we close the app, as we want to prevent multiple instances of our app
// https://github.com/electron/electron/blob/v30.0.0-nightly.20240221/docs/api/app.md#apprequestsingleinstancelockadditionaldata
export const gotTheLock = app.requestSingleInstanceLock();
