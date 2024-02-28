export const isProduction = process.env.NODE_ENV === "production";
export const isDevelopment =
	process.env.NODE_ENV === "development" ||
	process.env.NODE_ENV === "test" ||
	process.env.TEST_ENV === "test";
