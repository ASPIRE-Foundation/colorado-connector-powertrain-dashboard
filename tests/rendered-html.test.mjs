import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const pagesPrefix = "/colorado-connector-powertrain-dashboard";

async function render() {
  return readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
}

test("renders the FRPR decision model", async () => {
  const html = await render();
  assert.match(html, /<title>Colorado Connector Powertrain Dashboard<\/title>/i);
  assert.match(html, /Powertrain decision model/);
  assert.match(html, /Equivalent annual lifecycle cost/);
  assert.match(html, /Illustrative assumptions/);
  assert.match(html, /Diesel locomotive/);
  assert.match(html, /Battery electric/);
  assert.match(html, /Catenary electric/);
  assert.match(html, /Hydrogen fuel cell/);
  assert.match(html, /Lifecycle cost screening envelopes/);
  assert.match(html, /Add band/);
  assert.match(html, /Preset scenarios/);
  assert.match(html, /Starter schedule/);
  assert.match(html, /Capital-cost stress/);
  assert.match(html, /Full-service screening/);
  assert.match(html, /Energy-price volatility/);
  assert.match(html, /Service plan/);
  assert.match(html, /Round trips \/ train \/ day/);
  assert.match(html, /three southbound and three northbound departures/);
  assert.match(html, /Electricity tariff &amp; storage/);
  assert.match(html, /Energy and demand charges/);
  assert.match(html, /Peak attenuation from storage/);
  assert.match(html, /fleet-wide round trips/);
  assert.match(html, /Battery specific mass/);
  assert.match(html, /Charging &amp; fueling stops/);
  assert.match(html, /Charging and fueling capacity/);
  assert.match(html, /Deterministic battery sizing/);
  assert.match(html, /Battery pack \/ kWh/);
  assert.match(html, /Battery pack capital/);
  assert.match(html, /Show cost breakdown/);
  assert.doesNotMatch(html, /Battery \/ car/);
  assert.doesNotMatch(html, /type="number"/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);

  const deployedAssets = [
    ...html.matchAll(/(?:href|src)="(\/colorado-connector-powertrain-dashboard\/_next\/[^"]+)"/g),
  ].map((match) => match[1]);
  assert.ok(deployedAssets.length > 0, "expected GitHub Pages-prefixed assets");
  await Promise.all(deployedAssets.map((assetPath) =>
    access(new URL(`../dist/client${assetPath.slice(pagesPrefix.length)}`, import.meta.url)),
  ));
});
