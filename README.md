# Colorado Connector Powertrain Dashboard

Alternative modeling pipeline for rapid, transparent lifecycle-cost comparison of
passenger-rail powertrain options for Colorado's proposed Front Range service.

This public-facing dashboard was developed as a separate companion to
[ASPIRE-Foundation/ColoradoEtrainAnalysis](https://github.com/ASPIRE-Foundation/ColoradoEtrainAnalysis).
It preserves a clear link to that first-cut analysis while allowing the interactive model,
assumptions, and release cycle to evolve independently.

The service choice is either **starter service** between Fort Collins and Denver or
**full service** between Fort Collins and Pueblo. Starter defaults to one train making
three complete Fort Collins–Denver–Fort Collins round trips per day. This corresponds to
the three southbound and three northbound departures in the illustrative joint-service
schedule and allows the train to start and end in Fort Collins. Full service defaults to
twelve trains, each making one Fort Collins–Pueblo–Fort Collins round trip per day.

Fleet size and round trips per train per day are both editable. Their product determines
fleet-wide daily round trips, so additional trains increase both vehicle capital and
scheduled service.

Car count, passenger load, operating speed, fleet, energy prices, technology performance,
vehicle cost, maintenance, asset life, and discount rate remain editable. Battery mass is
calculated from installed kWh and a kg/kWh assumption and is added only to the
battery-electric train mass.

Battery kWh per car is calculated rather than entered. The model iterates battery
capacity, battery mass, segment energy, the longest interval between enabled charging
sites, and reserve until installed capacity converges. The calculated pack is then priced
with a separate editable $/kWh assumption; the vehicle-per-car input excludes the battery.
Facility intervals are evaluated cyclically, so disabling a terminal charger cannot grant
an implicit full battery at the start of the next circuit.

Illustrative base vehicle costs are normalized across all four powertrains: $5M per
train plus $0.75M per car before batteries and infrastructure. Preset uncertainty bands
also use the same per-train and per-car bounds for every option, avoiding an accidental
technology preference in the common vehicle platform assumptions.

Battery charging and hydrogen fueling sites are configured stop by stop. An optional
existing Castle Pines–Westminster catenary zone can also supply BEMU traction and charging
energy, capped by editable MW capacity. Connection time is calculated from travel under
wire plus the Denver stop, rather than entered independently. The model sends catenary
power to concurrent traction first and battery charging second, and uses actual power
delivered rather than automatically charging at the cap. It sizes other sites from
replenishment demand, stopover time, scheduled arrivals, and concurrency, then prices BEMU
grid/charger capacity and hydrogen supply/dispensing capacity from editable unit costs.
This replaces the former $14M and $30M blanket allowances.

An optional BEMU site-selection mode changes checked charging sources from required sites
to eligible candidates. Because the active route has at most five candidates, the dashboard
evaluates every subset on slider change, rejects configurations that cannot restore a
repeating train-day energy state, and selects the lowest equivalent-annual lifecycle cost.
The chosen subset remains visible beside the capacity results.

Electricity operating cost is separated into energy and monthly demand charges at every
BEMU source. Each source has its own rates and storage-attenuation assumption. The existing
catenary defaults to $0.01/kWh and no demand charge; the full-corridor catenary option keeps
its own technology-level tariff. Attenuation reduces billed kW without reducing kWh.
Storage capital, losses, and energy arbitrage are intentionally excluded.

A representative-train-day waterfall displays every off-wire traction draw, station charge,
and integrated under-wire interval against onboard usable battery energy. It uses the same flow
accounting as deterministic battery sizing and flags configurations that do not restore
their energy over a repeating day.

Every numeric slider can also carry lower and upper estimates. Enabling a band adds two
draggable endpoint handles around the darker base-value handle. A deterministic bounded
search recomputes a technology-specific lifecycle-cost screening envelope immediately;
the unified chart compares those ranges on one axis without precomputing scenarios.

Inputs live in a sticky, collapsible sidebar. Four transparent preset buttons—starter
schedule, full-service screening, capital-cost stress, and energy-price volatility—reset
the model to known base values and then apply documented bands. They are editable starting
points, not cached model outputs.

Clicking any powertrain row expands a lifecycle-cost chart. It sorts the equivalent
annual contributions from largest to smallest and separates base vehicles, battery packs,
infrastructure, electricity energy, demand charges, vehicle maintenance, infrastructure
maintenance, and replacements.

The conventional diesel option is labeled **Diesel locomotive**. The initial calculation
assumes diesel-electric transmission, but the neutral label avoids implying that FRPR has
selected a particular locomotive, DMU, or transmission architecture.

## Components

- `spec/MODELING_SPEC.md` — model boundary, equations, dashboard behavior, and acceptance
  criteria.
- `model/frpr_decision/` — Python reference implementation of the segment-energy and
  lifecycle-cost pipeline.
- `model/tests/` — reference-model tests.
- `lib/model.ts` — browser calculation engine using the same MVP equations.
- `app/` — interactive executive-comparison dashboard.

All current defaults are illustrative screening values. Route geometry is inherited from
the first-cut analysis and remains placeholder data.

## Run

Use the repository's `sb125` conda environment for the reference model:

```bash
cd model
conda run -n sb125 python -m pytest -q
```

Run the dashboard locally:

```bash
npm install
npm run dev
```

Validate the production build and rendered page:

```bash
npm test
```

## Publish

The repository includes a GitHub Pages workflow. After Pages is configured to use
**GitHub Actions** in the repository settings, each push to `main` builds, tests, and
publishes the dashboard at:

<https://aspire-foundation.github.io/colorado-connector-powertrain-dashboard/>
