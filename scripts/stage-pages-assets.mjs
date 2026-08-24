import { access, cp } from "node:fs/promises";

const repositoryName = "colorado-connector-powertrain-dashboard";
const nestedAssets = new URL(`../dist/client/${repositoryName}/_next/`, import.meta.url);
const publishedAssets = new URL("../dist/client/_next/", import.meta.url);

try {
  await access(nestedAssets);
  await cp(nestedAssets, publishedAssets, { recursive: true });
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}
