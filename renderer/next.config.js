const transpileModules = require("next-transpile-modules");
const withTM = transpileModules(["@mui/joy"]); // Pass the modules you would like to see transpiled

// Define an array of routes that need rewrites and redirects

/**
 *
 * @type {import('next').NextConfig} config
 */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};
/**
 *
 * @param plugins
 * @param {import('next').NextConfig} nextConfig
 * @returns {import('next').NextConfigObject}
 */

module.exports = withTM(nextConfig);
