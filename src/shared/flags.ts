export const isProduction = process.env.NODE_ENV === "production";
export const isTest =
	process.env.TEST_ENV === "local" ||
	process.env.TEST_ENV === "test" ||
	process.env.NODE_ENV === "test";

export const isDevelopment = process.env.NODE_ENV === "development";
