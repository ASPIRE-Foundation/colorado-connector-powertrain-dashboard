"use client";

import { CSSProperties, useMemo, useState } from "react";
import {
  AssumptionBand,
  AssumptionBands,
  Assumptions,
  CostRange,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_STOPS,
  DEFAULT_TECHNOLOGIES,
  FULL_ROUTE,
  Outcome,
  ServiceStop,
  Technology,
  calculateCostRanges,
  calculateOutcomes,
} from "@/lib/model";

type NumericKey = Exclude<keyof Assumptions, "servicePattern">;

type PresetDefinition = {
  id: string;
  name: string;
  description: string;
  assumptions: Partial<Assumptions>;
  technologies?: Partial<Record<Technology["key"], Partial<Technology>>>;
  stops?: ServiceStop[];
  bands: AssumptionBands;
};

const PRESETS: PresetDefinition[] = [
  {
    id: "balanced",
    name: "Balanced screening",
    description: "Moderate service with broad demand, fleet, finance, and capital bounds.",
    assumptions: { servicePattern: "through", totalTrains: 12, circuitsPerDay: 4, cars: 8, loadFactor: 0.5, movingSpeedMph: 65 },
    bands: {
      "a.totalTrains": { low: 9, high: 16 },
      "a.circuitsPerDay": { low: 3, high: 6 },
      "a.cars": { low: 6, high: 10 },
      "a.loadFactor": { low: 0.35, high: 0.7 },
      "a.movingSpeedMph": { low: 55, high: 75 },
      "a.batterySpecificMassKgPerKwh": { low: 4, high: 8 },
      "a.batteryCostUsdPerKwh": { low: 200, high: 600 },
      "a.realDiscountRate": { low: 0.025, high: 0.07 },
      "t.diesel.fixedVehicleCostMUsd": { low: 3.5, high: 8 },
      "t.diesel.vehicleCostMUsdPerCar": { low: 0.5, high: 1.25 },
      "t.bemu.fixedVehicleCostMUsd": { low: 3.5, high: 8 },
      "t.bemu.vehicleCostMUsdPerCar": { low: 0.5, high: 1.25 },
      "t.catenary.fixedVehicleCostMUsd": { low: 3.5, high: 8 },
      "t.catenary.vehicleCostMUsdPerCar": { low: 0.5, high: 1.25 },
      "t.hydrogen.fixedVehicleCostMUsd": { low: 3.5, high: 8 },
      "t.hydrogen.vehicleCostMUsdPerCar": { low: 0.5, high: 1.25 },
      "a.gridUpgradeUsdPerKw": { low: 250, high: 900 },
      "a.chargerEquipmentUsdPerKw": { low: 350, high: 1100 },
      "t.catenary.infrastructureMUsdPerRouteMile": { low: 3, high: 7 },
      "a.hydrogenSupplyUsdPerKgDay": { low: 900, high: 2800 },
      "s.denver.dwellMinutes": { low: 10, high: 35 },
    },
  },
  {
    id: "capital-stress",
    name: "Capital-cost stress",
    description: "Keeps operations at baseline and widens procurement and infrastructure costs.",
    assumptions: { servicePattern: "dedicated", totalTrains: 14, circuitsPerDay: 4, cars: 8, loadFactor: 0.5, realDiscountRate: 0.05 },
    bands: {
      "a.totalTrains": { low: 10, high: 18 },
      "a.cars": { low: 6, high: 10 },
      "a.realDiscountRate": { low: 0.025, high: 0.08 },
      "t.diesel.fixedVehicleCostMUsd": { low: 3.5, high: 8 },
      "t.diesel.vehicleCostMUsdPerCar": { low: 0.5, high: 1.25 },
      "t.bemu.fixedVehicleCostMUsd": { low: 3.5, high: 8 },
      "t.bemu.vehicleCostMUsdPerCar": { low: 0.5, high: 1.25 },
      "t.catenary.fixedVehicleCostMUsd": { low: 3.5, high: 8 },
      "t.catenary.vehicleCostMUsdPerCar": { low: 0.5, high: 1.25 },
      "t.hydrogen.fixedVehicleCostMUsd": { low: 3.5, high: 8 },
      "t.hydrogen.vehicleCostMUsdPerCar": { low: 0.5, high: 1.25 },
      "a.gridUpgradeUsdPerKw": { low: 200, high: 1200 },
      "a.batteryCostUsdPerKwh": { low: 150, high: 750 },
      "a.chargerEquipmentUsdPerKw": { low: 300, high: 1400 },
      "t.catenary.fixedInfrastructureMUsd": { low: 4, high: 25 },
      "t.catenary.infrastructureMUsdPerRouteMile": { low: 2.5, high: 8 },
      "a.hydrogenSupplyUsdPerKgDay": { low: 700, high: 3500 },
      "a.hydrogenDispenserUsdPerKgHour": { low: 40000, high: 150000 },
    },
  },
  {
    id: "high-service",
    name: "High-service corridor",
    description: "Tests a frequent, well-used service plan and the resulting fleet step changes.",
    assumptions: { servicePattern: "through", totalTrains: 18, circuitsPerDay: 7, cars: 8, loadFactor: 0.65, movingSpeedMph: 70, serviceSpanHours: 18 },
    bands: {
      "a.totalTrains": { low: 14, high: 22 },
      "a.circuitsPerDay": { low: 5, high: 9 },
      "a.cars": { low: 6, high: 10 },
      "a.loadFactor": { low: 0.45, high: 0.8 },
      "a.movingSpeedMph": { low: 60, high: 80 },
      "a.serviceSpanHours": { low: 16, high: 20 },
      "a.spareRatio": { low: 0.15, high: 0.3 },
    },
  },
  {
    id: "energy-volatility",
    name: "Energy-price volatility",
    description: "Centers higher carrier prices and bands fuel, power, efficiency, and auxiliary loads.",
    assumptions: { servicePattern: "through", totalTrains: 14, circuitsPerDay: 5, cars: 8, loadFactor: 0.55, auxiliaryKwPerCar: 12 },
    technologies: {
      diesel: { carrierCostPerUnit: 4.5 },
      bemu: { carrierCostPerUnit: 0.12 },
      catenary: { carrierCostPerUnit: 0.12 },
      hydrogen: { carrierCostPerUnit: 9 },
    },
    bands: {
      "a.movingSpeedMph": { low: 55, high: 80 },
      "a.auxiliaryKwPerCar": { low: 7, high: 18 },
      "t.diesel.carrierCostPerUnit": { low: 3, high: 6.5 },
      "t.diesel.carrierToWheelEfficiency": { low: 0.25, high: 0.38 },
      "t.bemu.carrierCostPerUnit": { low: 0.06, high: 0.2 },
      "t.bemu.carrierToWheelEfficiency": { low: 0.75, high: 0.9 },
      "t.catenary.carrierCostPerUnit": { low: 0.06, high: 0.2 },
      "t.catenary.carrierToWheelEfficiency": { low: 0.82, high: 0.93 },
      "t.hydrogen.carrierCostPerUnit": { low: 4, high: 14 },
      "t.hydrogen.carrierToWheelEfficiency": { low: 0.38, high: 0.58 },
    },
  },
];

const money = (value: number, digits = 1) => `$${value.toFixed(digits)}M`;
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  displayFactor = 1,
  digits = 3,
  band,
  onChange,
  onBandChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  displayFactor?: number;
  digits?: number;
  band?: AssumptionBand;
  onChange: (value: number) => void;
  onBandChange: (band: AssumptionBand | null) => void;
}) {
  const show = (raw: number) =>
    (raw * displayFactor).toLocaleString(undefined, { maximumFractionDigits: digits });
  const enableBand = () => {
    const width = (max - min) * 0.1;
    const snap = (raw: number) => {
      const stepped = min + Math.round((raw - min) / step) * step;
      return Math.min(max, Math.max(min, Number(stepped.toFixed(8))));
    };
    onBandChange({
      low: snap(value - width),
      high: snap(value + width),
    });
  };
  const changeBase = (next: number) => {
    onChange(next);
    if (band) {
      onBandChange({ low: Math.min(band.low, next), high: Math.max(band.high, next) });
    }
  };
  const percent = (raw: number) => ((raw - min) / (max - min)) * 100;
  return (
    <div className={`slider-field ${band ? "has-band" : ""}`}>
      <span className="slider-label">
        <span>{label}</span>
        <span className="slider-actions">
          <output>{show(value)}{unit}</output>
          <button
            type="button"
            className="band-toggle"
            aria-pressed={Boolean(band)}
            onClick={() => band ? onBandChange(null) : enableBand()}
          >
            {band ? "Remove band" : "Add band"}
          </button>
        </span>
      </span>
      {band ? (
        <>
          <div
            className="multi-range"
            style={{
              "--low-pct": `${percent(band.low)}%`,
              "--base-pct": `${percent(value)}%`,
              "--high-pct": `${percent(band.high)}%`,
            } as CSSProperties}
          >
            <span className="multi-range-track"><i /></span>
            <input
              className="range-handle range-lower"
              type="range"
              aria-label={`${label} lower estimate`}
              min={min}
              max={max}
              step={step}
              value={band.low}
              onChange={(event) => onBandChange({ ...band, low: Math.min(value, Number(event.target.value)) })}
            />
            <input
              className="range-handle range-upper"
              type="range"
              aria-label={`${label} upper estimate`}
              min={min}
              max={max}
              step={step}
              value={band.high}
              onChange={(event) => onBandChange({ ...band, high: Math.max(value, Number(event.target.value)) })}
            />
            <input
              className="range-handle range-base"
              type="range"
              aria-label={`${label} base estimate`}
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(event) => changeBase(Number(event.target.value))}
            />
          </div>
          <div className="range-values" aria-hidden="true">
            <span>Lower <b>{show(band.low)}{unit}</b></span>
            <span>Base <b>{show(value)}{unit}</b></span>
            <span>Upper <b>{show(band.high)}{unit}</b></span>
          </div>
        </>
      ) : (
        <input
          type="range"
          aria-label={`${label} base estimate`}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => changeBase(Number(event.target.value))}
        />
      )}
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

function TechnologyRow({ outcome, maxCost, rank, expanded, onToggle }: { outcome: Outcome; maxCost: number; rank: number; expanded: boolean; onToggle: () => void }) {
  const tech = outcome.technology;
  const capitalShare = Math.min(
    100,
    ((outcome.initialCapitalMUsd / outcome.lifecycleNpvMUsd) * 100),
  );
  return (
    <div
      className={`technology-row ${rank === 0 ? "winner" : ""} ${expanded ? "expanded" : ""}`}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-controls={`breakdown-${tech.key}`}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="tech-identity">
        <span className="tech-dot" style={{ background: tech.color }} />
        <div>
          <div className="tech-name-line">
            <h3>{tech.name}</h3>
            {rank === 0 && <span className="best-badge">Lowest modeled cost</span>}
          </div>
          <p>{outcome.fleetSize} trainsets · {money(outcome.initialCapitalMUsd, 0)} initial capital</p>
          <span className="breakdown-cue">{expanded ? "Hide breakdown" : "Show cost breakdown"}<b>{expanded ? "−" : "+"}</b></span>
        </div>
      </div>
      <div className="cost-column">
        <strong>{money(outcome.equivalentAnnualCostMUsd)}</strong>
        <span>equivalent annual cost</span>
      </div>
      <div className="comparison-bar" aria-label={`${tech.name} relative lifecycle cost`}>
        <span
          className="bar-total"
          style={{ width: `${(outcome.equivalentAnnualCostMUsd / maxCost) * 100}%`, background: tech.color }}
        >
          <span className="bar-capital" style={{ width: `${capitalShare}%` }} />
        </span>
      </div>
      <div className="row-metrics">
        <Metric label="30-year NPV" value={money(outcome.lifecycleNpvMUsd, 0)} />
        <Metric label="Annual OPEX" value={money(outcome.annualOperatingMUsd)} />
        <Metric label="Per passenger-mi" value={`$${outcome.costPerPassengerMileUsd.toFixed(2)}`} />
        <Metric label="Annual CO₂e" value={`${number.format(outcome.annualEmissionsTonnes)} t`} />
      </div>
      {expanded && (
        <div className="cost-breakdown" id={`breakdown-${tech.key}`}>
          <div className="breakdown-heading">
            <div><strong>Equivalent annual cost components</strong><span>Annualized capital, replacements, and recurring costs</span></div>
            <b>{money(outcome.equivalentAnnualCostMUsd)} / year</b>
          </div>
          <div className="breakdown-bars">
            {outcome.costComponents.map((component) => {
              const largest = outcome.costComponents[0]?.equivalentAnnualMUsd ?? 1;
              const share = component.equivalentAnnualMUsd / outcome.equivalentAnnualCostMUsd * 100;
              return (
                <div className="breakdown-row" key={component.key}>
                  <span>{component.label}</span>
                  <div className="breakdown-track"><i style={{ width: `${component.equivalentAnnualMUsd / largest * 100}%`, background: tech.color }} /></div>
                  <strong>{money(component.equivalentAnnualMUsd)}</strong>
                  <b>{share.toFixed(0)}%</b>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CostRangeChart({ ranges, bandCount }: { ranges: CostRange[]; bandCount: number }) {
  const axisMax = Math.max(...ranges.map((item) => item.highMUsdPerYear)) * 1.08;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <section className="range-chart" aria-labelledby="range-heading">
      <div className="section-heading range-heading">
        <div>
          <p className="eyebrow">Unified uncertainty view</p>
          <h2 id="range-heading">Lifecycle cost screening envelopes</h2>
        </div>
        <div className="range-legend">
          <span className="legend-line" /> lower–upper
          <span className="legend-dot" /> base
        </div>
      </div>
      <p className="section-note">
        {bandCount === 0
          ? "Add a band to any slider to reveal the resulting cost envelope."
          : `${bandCount} banded ${bandCount === 1 ? "assumption" : "assumptions"}; each option is optimized independently within the selected bounds.`}
      </p>
      <div className="range-axis" aria-hidden="true">
        <span />
        {ticks.map((tick) => <b key={tick} style={{ left: `${tick * 100}%` }}>{money(axisMax * tick, 0)}</b>)}
      </div>
      <div className="range-rows">
        {ranges.map((item) => {
          const left = (item.lowMUsdPerYear / axisMax) * 100;
          const width = Math.max(((item.highMUsdPerYear - item.lowMUsdPerYear) / axisMax) * 100, 0.35);
          const base = (item.baseMUsdPerYear / axisMax) * 100;
          return (
            <div className="range-row" key={item.technology.key}>
              <div className="range-name"><i style={{ background: item.technology.color }} />{item.technology.shortName}</div>
              <div className="range-track">
                <span className="range-interval" style={{ left: `${left}%`, width: `${width}%`, background: item.technology.color }} />
                <span className="range-base-dot" style={{ left: `${base}%`, borderColor: item.technology.color }} />
              </div>
              <strong>{money(item.lowMUsdPerYear)}–{money(item.highMUsdPerYear)}</strong>
            </div>
          );
        })}
      </div>
      <p className="range-footnote">Deterministic screening envelope, not a confidence interval. It evaluates lower, base, and upper endpoints on slider change and captures interactions, facility sizing, and integer service screens.</p>
    </section>
  );
}

export default function Home() {
  const [assumptions, setAssumptions] = useState(DEFAULT_ASSUMPTIONS);
  const [technologies, setTechnologies] = useState(DEFAULT_TECHNOLOGIES);
  const [stops, setStops] = useState(DEFAULT_STOPS);
  const [bands, setBands] = useState<AssumptionBands>({});
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [expandedTechnologies, setExpandedTechnologies] = useState<Set<Technology["key"]>>(() => new Set());
  const outcomes = useMemo(
    () => calculateOutcomes(technologies, assumptions, stops),
    [technologies, assumptions, stops],
  );
  const costRanges = useMemo(
    () => calculateCostRanges(technologies, assumptions, stops, bands),
    [technologies, assumptions, stops, bands],
  );
  const leader = outcomes[0];
  const runnerUp = outcomes[1];
  const bemu = outcomes.find((item) => item.technology.key === "bemu")!;
  const maxCost = Math.max(...outcomes.map((item) => item.equivalentAnnualCostMUsd));

  const update = (key: NumericKey, value: number) => {
    setActivePreset(null);
    setAssumptions((current) => ({ ...current, [key]: value }));
  };
  const updateTechnology = (key: Technology["key"], field: keyof Technology, value: number) => {
    setActivePreset(null);
    setTechnologies((current) =>
      current.map((tech) => (tech.key === key ? { ...tech, [field]: value } : tech)),
    );
  };
  const updateStop = (key: ServiceStop["key"], changes: Partial<ServiceStop>) => {
    setActivePreset(null);
    setStops((current) => current.map((stop) => stop.key === key ? { ...stop, ...changes } : stop));
  };
  const bandProps = (id: string) => ({
    band: bands[id],
    onBandChange: (band: AssumptionBand | null) => {
      setActivePreset(null);
      setBands((current) => {
        if (band) return { ...current, [id]: band };
        const next = { ...current };
        delete next[id];
        return next;
      });
    },
  });
  const applyPreset = (preset: PresetDefinition) => {
    setAssumptions({ ...DEFAULT_ASSUMPTIONS, ...preset.assumptions });
    setTechnologies(DEFAULT_TECHNOLOGIES.map((technology) => ({
      ...technology,
      ...preset.technologies?.[technology.key],
    })));
    setStops((preset.stops ?? DEFAULT_STOPS).map((stop) => ({ ...stop })));
    setBands({ ...preset.bands });
    setActivePreset(preset.id);
  };
  const reset = () => {
    setAssumptions(DEFAULT_ASSUMPTIONS);
    setTechnologies(DEFAULT_TECHNOLOGIES);
    setStops(DEFAULT_STOPS);
    setBands({});
    setActivePreset(null);
  };

  return (
    <main>
      <header className="site-header">
        <div className="brand-mark">FR</div>
        <div>
          <p className="eyebrow">Front Range Passenger Rail</p>
          <h1>Powertrain decision model</h1>
        </div>
        <div className="status-pill"><span /> Illustrative assumptions</div>
      </header>

      <div className="dashboard-shell">
        <div className="dashboard-content">

      <section className="executive-summary">
        <div>
          <p className="eyebrow">Current assumption set</p>
          <h2>{leader.technology.name} has the lowest modeled lifecycle cost.</h2>
          <p className="lede">
            {money(leader.equivalentAnnualCostMUsd)} per year—{money(runnerUp.equivalentAnnualCostMUsd - leader.equivalentAnnualCostMUsd)} below {runnerUp.technology.shortName}. Adjust any input below; all results update immediately.
          </p>
        </div>
        <div className="summary-metrics">
          <Metric label="Fleet capacity screen" value={leader.fleetSufficient ? "Sufficient" : "Shortfall"} note={`${assumptions.totalTrains} specified · ${leader.requiredFleetSize} estimated need · ${assumptions.circuitsPerDay} fleet-wide circuits`} />
          <Metric label="Modeled riders / train" value={number.format(assumptions.cars * assumptions.seatsPerCar * assumptions.loadFactor)} note={`${assumptions.cars} cars at ${Math.round(assumptions.loadFactor * 100)}% load`} />
          <Metric
            label="Calculated BEMU battery"
            value={`${number.format(bemu.requiredBatteryKwhPerCar ?? 0)} kWh/car`}
            note={`${number.format(bemu.requiredInstalledBatteryKwh ?? 0)} kWh per train including reserve`}
          />
        </div>
      </section>

      <CostRangeChart ranges={costRanges} bandCount={Object.keys(bands).length} />

      <section className="comparison" aria-labelledby="comparison-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Executive comparison</p>
            <h2 id="comparison-heading">Equivalent annual lifecycle cost</h2>
          </div>
          <div className="bar-key"><span /> Capital share of lifecycle NPV</div>
        </div>
        <div className="technology-list">
          {outcomes.map((outcome, index) => (
            <TechnologyRow
              key={outcome.technology.key}
              outcome={outcome}
              maxCost={maxCost}
              rank={index}
              expanded={expandedTechnologies.has(outcome.technology.key)}
              onToggle={() => setExpandedTechnologies((current) => {
                const next = new Set(current);
                if (next.has(outcome.technology.key)) next.delete(outcome.technology.key);
                else next.add(outcome.technology.key);
                return next;
              })}
            />
          ))}
        </div>
      </section>

      <section className="capacity-pane" aria-labelledby="capacity-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Site infrastructure</p>
            <h2 id="capacity-heading">Charging and fueling capacity</h2>
          </div>
          <span className="capacity-context">{FULL_ROUTE.shortName}</span>
        </div>
        <div className="capacity-columns">
          {[bemu, outcomes.find((item) => item.technology.key === "hydrogen")!].map((outcome) => (
            <article key={outcome.technology.key} className="capacity-technology">
              <div className="capacity-title"><i style={{ background: outcome.technology.color }} /><div><h3>{outcome.technology.name}</h3><p>{money(outcome.infrastructureCapitalMUsd)} modeled infrastructure</p></div></div>
              {outcome.facilityCapacities.length ? outcome.facilityCapacities.map((facility) => (
                <div className="capacity-site" key={facility.stopKey}>
                  <div><strong>{facility.stopName}</strong><span>{facility.dwellMinutes}-minute stopover</span></div>
                  <div><strong>{number.format(facility.capacity)} {facility.capacityUnit}</strong><span>{facility.peakRateUnit === facility.capacityUnit ? "site capacity" : `${number.format(facility.peakRate)} ${facility.peakRateUnit} peak`}</span></div>
                  <b>{money(facility.capitalMUsd)}</b>
                </div>
              )) : <p className="empty-capacity">No facilities enabled. The option is not operationally supported.</p>}
            </article>
          ))}
        </div>
        <p className="range-footnote">Capacity is a screening estimate based on energy replenished since the preceding enabled facility, stopover duration, scheduled arrivals, and modeled concurrency.</p>
      </section>

        </div>

      <aside className="assumptions-sidebar" aria-labelledby="assumptions-heading">
        <div className="sidebar-header">
          <div>
            <p className="eyebrow">Model inputs</p>
            <h2 id="assumptions-heading">Assumptions</h2>
          </div>
          <button className="reset-button" onClick={reset}>Reset</button>
        </div>
        <p className="sidebar-note">Editable screening values, not adopted FRPR assumptions.</p>

        <div className="assumption-grid">
          <details open className="preset-section">
            <summary>Preset scenarios <span>{activePreset ? "loaded" : `${PRESETS.length} presets`}</span></summary>
            <div className="preset-list">
              {PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  className={`preset-button ${activePreset === preset.id ? "active" : ""}`}
                  aria-pressed={activePreset === preset.id}
                  onClick={() => applyPreset(preset)}
                >
                  <strong>{preset.name}</strong>
                  <span>{preset.description}</span>
                </button>
              ))}
            </div>
          </details>

          <details open>
            <summary>Full service plan <span>pattern + 4 inputs</span></summary>
            <div className="details-body">
              <label className="route-picker">
                <span>Operating pattern</span>
                <select
                  value={assumptions.servicePattern}
                  onChange={(event) => {
                    setActivePreset(null);
                    setAssumptions((current) => ({ ...current, servicePattern: event.target.value as Assumptions["servicePattern"] }));
                  }}
                >
                  <option value="through">All trains run Fort Collins–Pueblo</option>
                  <option value="dedicated">Dedicated north and south trains</option>
                </select>
                <small>{assumptions.servicePattern === "through" ? "One full-corridor round trip per circuit" : "One north plus one south round trip per circuit; transfer in Denver"}</small>
              </label>
              <Slider label="Total trains" value={assumptions.totalTrains} min={4} max={30} step={1} digits={0} onChange={(v) => update("totalTrains", v)} {...bandProps("a.totalTrains")} />
              <Slider label="Full-system circuits / day — fleet total" value={assumptions.circuitsPerDay} min={1} max={12} step={1} digits={0} onChange={(v) => update("circuitsPerDay", v)} {...bandProps("a.circuitsPerDay")} />
              <p className="input-note">This is the total completed by the entire fleet—not by each train. {assumptions.servicePattern === "through" ? "One circuit is one Fort Collins–Pueblo–Fort Collins round trip." : "One circuit pairs a north round trip and a south round trip operated by dedicated train pools."}</p>
              <Slider label="Cars per train" value={assumptions.cars} min={2} max={10} step={1} digits={0} onChange={(v) => update("cars", v)} {...bandProps("a.cars")} />
              <Slider label="Passenger load" value={assumptions.loadFactor} min={0.1} max={1} step={0.05} displayFactor={100} digits={0} unit="%" onChange={(v) => update("loadFactor", v)} {...bandProps("a.loadFactor")} />
            </div>
          </details>

          <details open>
            <summary>Service & fleet <span>6 inputs</span></summary>
            <div className="details-body">
              <Slider label="Moving speed" value={assumptions.movingSpeedMph} min={35} max={90} step={1} digits={0} unit=" mph" onChange={(v) => update("movingSpeedMph", v)} {...bandProps("a.movingSpeedMph")} />
              <Slider label="Service days / year" value={assumptions.serviceDaysPerYear} min={250} max={365} step={5} digits={0} onChange={(v) => update("serviceDaysPerYear", v)} {...bandProps("a.serviceDaysPerYear")} />
              <Slider label="Service span" value={assumptions.serviceSpanHours} min={8} max={22} step={1} digits={0} unit=" hr" onChange={(v) => update("serviceSpanHours", v)} {...bandProps("a.serviceSpanHours")} />
              <Slider label="Spare ratio" value={assumptions.spareRatio} min={0} max={0.4} step={0.05} displayFactor={100} digits={0} unit="%" onChange={(v) => update("spareRatio", v)} {...bandProps("a.spareRatio")} />
              <Slider label="Seats / car" value={assumptions.seatsPerCar} min={30} max={100} step={5} digits={0} onChange={(v) => update("seatsPerCar", v)} {...bandProps("a.seatsPerCar")} />
              <Slider label="Passenger mass" value={assumptions.passengerMassKg} min={60} max={110} step={5} digits={0} unit=" kg" onChange={(v) => update("passengerMassKg", v)} {...bandProps("a.passengerMassKg")} />
            </div>
          </details>

          <details>
            <summary>Train & energy <span>8 inputs</span></summary>
            <div className="details-body">
              <Slider label="Tare mass / car" value={assumptions.tareTonnesPerCar} min={20} max={60} step={1} digits={0} unit=" t" onChange={(v) => update("tareTonnesPerCar", v)} {...bandProps("a.tareTonnesPerCar")} />
              <Slider label="Auxiliary load / car" value={assumptions.auxiliaryKwPerCar} min={3} max={25} step={1} digits={0} unit=" kW" onChange={(v) => update("auxiliaryKwPerCar", v)} {...bandProps("a.auxiliaryKwPerCar")} />
              <Slider label="Rolling coefficient" value={assumptions.crr} min={0.0008} max={0.003} step={0.0001} digits={4} onChange={(v) => update("crr", v)} {...bandProps("a.crr")} />
              <Slider label="Effective drag area" value={assumptions.dragAreaM2} min={8} max={30} step={1} digits={0} unit=" m²" onChange={(v) => update("dragAreaM2", v)} {...bandProps("a.dragAreaM2")} />
              <Slider label="Air density" value={assumptions.airDensityKgM3} min={0.85} max={1.25} step={0.01} digits={2} unit=" kg/m³" onChange={(v) => update("airDensityKgM3", v)} {...bandProps("a.airDensityKgM3")} />
              <Slider label="Battery specific mass" value={assumptions.batterySpecificMassKgPerKwh} min={2} max={12} step={0.25} digits={2} unit=" kg/kWh" onChange={(v) => update("batterySpecificMassKgPerKwh", v)} {...bandProps("a.batterySpecificMassKgPerKwh")} />
              <Slider label="Battery reserve" value={assumptions.batteryReserveFraction} min={0.05} max={0.4} step={0.05} displayFactor={100} digits={0} unit="%" onChange={(v) => update("batteryReserveFraction", v)} {...bandProps("a.batteryReserveFraction")} />
              <Slider label="Charging efficiency" value={assumptions.chargingEfficiency} min={0.75} max={0.98} step={0.01} displayFactor={100} digits={0} unit="%" onChange={(v) => update("chargingEfficiency", v)} {...bandProps("a.chargingEfficiency")} />
            </div>
          </details>

          <details open>
            <summary>Charging & fueling costs <span>5 inputs</span></summary>
            <div className="details-body">
              <Slider label="Battery pack / kWh" value={assumptions.batteryCostUsdPerKwh} min={50} max={1000} step={25} digits={0} unit=" $" onChange={(v) => update("batteryCostUsdPerKwh", v)} {...bandProps("a.batteryCostUsdPerKwh")} />
              <Slider label="Grid upgrades / kW" value={assumptions.gridUpgradeUsdPerKw} min={0} max={2000} step={25} digits={0} unit=" $" onChange={(v) => update("gridUpgradeUsdPerKw", v)} {...bandProps("a.gridUpgradeUsdPerKw")} />
              <Slider label="Charging equipment / kW" value={assumptions.chargerEquipmentUsdPerKw} min={0} max={2000} step={25} digits={0} unit=" $" onChange={(v) => update("chargerEquipmentUsdPerKw", v)} {...bandProps("a.chargerEquipmentUsdPerKw")} />
              <Slider label="Hydrogen supply / kg-day" value={assumptions.hydrogenSupplyUsdPerKgDay} min={0} max={5000} step={100} digits={0} unit=" $" onChange={(v) => update("hydrogenSupplyUsdPerKgDay", v)} {...bandProps("a.hydrogenSupplyUsdPerKgDay")} />
              <Slider label="H₂ dispenser / kg-hour" value={assumptions.hydrogenDispenserUsdPerKgHour} min={0} max={250000} step={5000} digits={0} unit=" $" onChange={(v) => update("hydrogenDispenserUsdPerKgHour", v)} {...bandProps("a.hydrogenDispenserUsdPerKgHour")} />
            </div>
          </details>

          <details open>
            <summary>Charging & fueling stops <span>{stops.length} locations</span></summary>
            <div className="stop-config-list">
              {stops.map((stop) => (
                <div className="stop-config" key={stop.key}>
                  <div className="stop-config-heading"><strong>{stop.name}</strong><span>MP {stop.milepost}</span></div>
                  <div className="facility-toggles">
                    <label><input type="checkbox" checked={stop.bemuEnabled} onChange={(event) => updateStop(stop.key, { bemuEnabled: event.target.checked })} /> Battery charging</label>
                    <label><input type="checkbox" checked={stop.hydrogenEnabled} onChange={(event) => updateStop(stop.key, { hydrogenEnabled: event.target.checked })} /> Hydrogen fueling</label>
                  </div>
                  <Slider label="Stopover" value={stop.dwellMinutes} min={5} max={90} step={5} digits={0} unit=" min" onChange={(value) => updateStop(stop.key, { dwellMinutes: value })} {...bandProps(`s.${stop.key}.dwellMinutes`)} />
                </div>
              ))}
            </div>
          </details>

          <details>
            <summary>Financial <span>2 shared inputs</span></summary>
            <div className="details-body">
              <Slider label="Analysis period" value={assumptions.analysisYears} min={15} max={50} step={5} digits={0} unit=" yr" onChange={(v) => update("analysisYears", v)} {...bandProps("a.analysisYears")} />
              <Slider label="Real discount rate" value={assumptions.realDiscountRate} min={0} max={0.1} step={0.005} displayFactor={100} digits={1} unit="%" onChange={(v) => update("realDiscountRate", v)} {...bandProps("a.realDiscountRate")} />
            </div>
          </details>

          {technologies.map((tech) => (
            <details key={tech.key}>
              <summary><span className="summary-tech"><i style={{ background: tech.color }} />{tech.name}</span><span>cost & performance</span></summary>
              <div className="details-body">
                {tech.key === "diesel" && <p className="technology-note">Diesel-electric transmission is assumed; “Diesel locomotive” keeps the option label neutral until FRPR identifies specific equipment.</p>}
                {(tech.key === "bemu" || tech.key === "hydrogen") && <p className="technology-note">Infrastructure capital is calculated from enabled sites, replenishment demand, stopover time, and the capacity-cost inputs above.</p>}
                <Slider label="Fixed vehicle / train" value={tech.fixedVehicleCostMUsd} min={0} max={15} step={0.25} digits={2} unit=" M$" onChange={(v) => updateTechnology(tech.key, "fixedVehicleCostMUsd", v)} {...bandProps(`t.${tech.key}.fixedVehicleCostMUsd`)} />
                <Slider label={tech.key === "bemu" ? "Non-battery vehicle / car" : "Vehicle / car"} value={tech.vehicleCostMUsdPerCar} min={0.2} max={3} step={0.05} digits={2} unit=" M$" onChange={(v) => updateTechnology(tech.key, "vehicleCostMUsdPerCar", v)} {...bandProps(`t.${tech.key}.vehicleCostMUsdPerCar`)} />
                {tech.key !== "bemu" && tech.key !== "hydrogen" && <Slider label="Fixed infrastructure" value={tech.fixedInfrastructureMUsd} min={0} max={100} step={1} digits={0} unit=" M$" onChange={(v) => updateTechnology(tech.key, "fixedInfrastructureMUsd", v)} {...bandProps(`t.${tech.key}.fixedInfrastructureMUsd`)} />}
                {tech.key !== "bemu" && tech.key !== "hydrogen" && <Slider label="Infrastructure / route-mi" value={tech.infrastructureMUsdPerRouteMile} min={0} max={10} step={0.1} digits={1} unit=" M$" onChange={(v) => updateTechnology(tech.key, "infrastructureMUsdPerRouteMile", v)} {...bandProps(`t.${tech.key}.infrastructureMUsdPerRouteMile`)} />}
                <Slider label={`Carrier price / ${tech.carrierUnit}`} value={tech.carrierCostPerUnit} min={tech.key === "bemu" || tech.key === "catenary" ? 0.03 : 1} max={tech.key === "hydrogen" ? 20 : tech.key === "diesel" ? 8 : 0.3} step={tech.key === "bemu" || tech.key === "catenary" ? 0.01 : 0.25} digits={2} unit=" $" onChange={(v) => updateTechnology(tech.key, "carrierCostPerUnit", v)} {...bandProps(`t.${tech.key}.carrierCostPerUnit`)} />
                <Slider label="Carrier-to-wheel efficiency" value={tech.carrierToWheelEfficiency} min={0.2} max={0.95} step={0.01} displayFactor={100} digits={0} unit="%" onChange={(v) => updateTechnology(tech.key, "carrierToWheelEfficiency", v)} {...bandProps(`t.${tech.key}.carrierToWheelEfficiency`)} />
                <Slider label="Regenerative recovery" value={tech.regenerativeEfficiency} min={0} max={0.95} step={0.05} displayFactor={100} digits={0} unit="%" onChange={(v) => updateTechnology(tech.key, "regenerativeEfficiency", v)} {...bandProps(`t.${tech.key}.regenerativeEfficiency`)} />
                <Slider label="Maintenance / train-mi" value={tech.maintenanceUsdPerTrainMile} min={2} max={20} step={0.5} digits={1} unit=" $" onChange={(v) => updateTechnology(tech.key, "maintenanceUsdPerTrainMile", v)} {...bandProps(`t.${tech.key}.maintenanceUsdPerTrainMile`)} />
                <Slider label={`Emissions / ${tech.carrierUnit}`} value={tech.emissionsKgPerUnit} min={0} max={tech.key === "hydrogen" ? 30 : tech.key === "diesel" ? 20 : 1.2} step={tech.key === "bemu" || tech.key === "catenary" ? 0.01 : 0.5} digits={2} unit=" kg" onChange={(v) => updateTechnology(tech.key, "emissionsKgPerUnit", v)} {...bandProps(`t.${tech.key}.emissionsKgPerUnit`)} />
              </div>
            </details>
          ))}
        </div>
      </aside>

      <section className="model-readout">
        <div>
          <p className="eyebrow">Deterministic battery sizing</p>
          <h2>The charging configuration indicates {number.format(bemu.requiredBatteryKwhPerCar ?? 0)} kWh per car.</h2>
          <div className="battery-sizing-grid">
            <Metric label="Calculated capacity" value={`${number.format(bemu.requiredBatteryKwhPerCar ?? 0)} kWh/car`} note={`${number.format(bemu.installedBatteryKwh ?? 0)} kWh installed train total`} />
            <Metric label="Usable after reserve" value={`${number.format(bemu.usableBatteryKwh ?? 0)} kWh`} note={`${Math.round(assumptions.batteryReserveFraction * 100)}% held in reserve`} />
            <Metric label="Longest facility interval" value={`${number.format(bemu.maxDirectionalCarrierKwh)} kWh`} note="Matches usable capacity after convergence" />
            <Metric label="Battery mass" value={`${number.format(bemu.batteryMassTonnes ?? 0)} t`} note={`${assumptions.batterySpecificMassKgPerKwh.toFixed(2)} kg/kWh`} />
            <Metric label="Battery pack capital" value={money(bemu.batteryCapitalMUsd ?? 0)} note={`${assumptions.totalTrains} trains at $${number.format(assumptions.batteryCostUsdPerKwh)}/kWh`} />
            <Metric label="Charging infrastructure" value={money(bemu.infrastructureCapitalMUsd)} note={`${bemu.indicativeChargerMw?.toFixed(1)} MW combined modeled peak`} />
          </div>
          <p>Capacity is solved iteratively because battery capacity adds mass, which increases energy use and therefore changes the required battery. Enabled charging locations determine the longest unsupported interval; stopover duration determines charger power, not onboard capacity.</p>
        </div>
        <div className="formula-card">
          <span>Battery calculation path</span>
          <code>charging locations → facility interval → battery kWh → battery mass → revised interval energy → convergence</code>
          <p>The converged battery is added to vehicle capital at the separate battery-pack $/kWh assumption. The vehicle-per-car input therefore represents the non-battery car cost.</p>
          <p>Enabled sites require {bemu.indicativeChargerMw?.toFixed(1)} MW of combined modeled peak charging capacity.</p>
        </div>
      </section>
      </div>

      <footer>
        <p>Screening model · real dollars · bidirectional service</p>
        <p>Not for engineering, procurement, or adopted-service claims</p>
      </footer>
    </main>
  );
}
