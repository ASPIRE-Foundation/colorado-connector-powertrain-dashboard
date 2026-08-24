import type { NextConfig } from "next";

const pagesAssetPrefix = process.env.GITHUB_ACTIONS === "true"
  ? "/colorado-connector-powertrain-dashboard"
  : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  assetPrefix: pagesAssetPrefix,
};

export default nextConfig;
