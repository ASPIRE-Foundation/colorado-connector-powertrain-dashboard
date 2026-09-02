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
  Outcome,
  ServiceStop,
  Technology,
  calculateCostRanges,
  calculateOutcomes,
  serviceRoute,
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
    id: "starter-schedule",
    name: "Starter schedule",
    description: "One train makes three Fort Collins–Denver round trips, matching the six attached departures.",
    assumptions: { servicePattern: "starter", totalTrains: 1, roundTripsPerTrainPerDay: 3, cars: 8, loadFactor: 0.5, movingSpeedMph: 65 },
    bands: {
      "a.totalTrains": { low: 1, high: 3 },
      "a.roundTripsPerTrainPerDay": { low: 2, high: 4 },
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
      "s.fort-collins.electricityEnergyUsdPerKwh": { low: 0.06, high: 0.16 },
      "s.fort-collins.electricityDemandUsdPerKwMonth": { low: 5, high: 30 },
      "s.denver.electricityEnergyUsdPerKwh": { low: 0.06, high: 0.16 },
      "s.denver.electricityDemandUsdPerKwMonth": { low: 5, high: 30 },
      "s.denver-westminster-catenary.maximumPowerMw": { low: 2, high: 10 },
      "s.denver-westminster-catenary.electricityEnergyUsdPerKwh": { low: 0.005, high: 0.05 },
      "t.catenary.infrastructureMUsdPerRouteMile": { low: 3, high: 7 },
      "a.hydrogenSupplyUsdPerKgDay": { low: 900, high: 2800 },
      "s.denver.dwellMinutes": { low: 10, high: 35 },
    },
  },
  {
    id: "capital-stress",
    name: "Capital-cost stress",
    description: "Keeps operations at baseline and widens procurement and infrastructure costs.",
    assumptions: { servicePattern: "full", totalTrains: 12, roundTripsPerTrainPerDay: 1, cars: 8, loadFactor: 0.5, realDiscountRate: 0.05 },
    bands: {
      "a.totalTrains": { low: 8, high: 16 },
      "a.roundTripsPerTrainPerDay": { low: 1, high: 2 },
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
    id: "full-service",
    name: "Full-service screening",
    description: "Twelve trains each cover Fort Collins–Pueblo–Fort Collins once per day.",
    assumptions: { servicePattern: "full", totalTrains: 12, roundTripsPerTrainPerDay: 1, cars: 8, loadFactor: 0.65, movingSpeedMph: 70, serviceSpanHours: 18 },
    bands: {
      "a.totalTrains": { low: 8, high: 18 },
      "a.roundTripsPerTrainPerDay": { low: 1, high: 2 },
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
    assumptions: { servicePattern: "full", totalTrains: 12, roundTripsPerTrainPerDay: 1, cars: 8, loadFactor: 0.55, auxiliaryKwPerCar: 12 },
    technologies: {
      diesel: { carrierCostPerUnit: 4.5 },
      hydrogen: { carrierCostPerUnit: 9 },
    },
    bands: {
      "a.movingSpeedMph": { low: 55, high: 80 },
      "a.auxiliaryKwPerCar": { low: 7, high: 18 },
      "t.diesel.carrierCostPerUnit": { low: 3, high: 6.5 },
      "t.diesel.carrierToWheelEfficiency": { low: 0.25, high: 0.38 },
      "t.bemu.carrierToWheelEfficiency": { low: 0.75, high: 0.9 },
      "t.catenary.carrierToWheelEfficiency": { low: 0.82, high: 0.93 },
      "s.fort-collins.electricityEnergyUsdPerKwh": { low: 0.06, high: 0.2 },
      "s.fort-collins.electricityDemandUsdPerKwMonth": { low: 5, high: 40 },
      "s.fort-collins.peakDemandAttenuationFraction": { low: 0.1, high: 0.85 },
      "s.denver.electricityEnergyUsdPerKwh": { low: 0.06, high: 0.2 },
      "s.denver.electricityDemandUsdPerKwMonth": { low: 5, high: 40 },
      "s.denver.peakDemandAttenuationFraction": { low: 0.1, high: 0.85 },
      "s.denver-westminster-catenary.electricityEnergyUsdPerKwh": { low: 0.005, high: 0.05 },
      "t.catenary.carrierCostPerUnit": { low: 0.06, high: 0.2 },
      "t.catenary.electricityDemandUsdPerKwMonth": { low: 5, high: 40 },
      "t.catenary.peakDemandAttenuationFraction": { low: 0.1, high: 0.85 },
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

function EnergyFlowChart({ outcome }: { outcome: Outcome }) {
  const usableKwh = outcome.usableBatteryKwh ?? 0;
  const steps = outcome.energyFlowSteps;
  const values = steps.flatMap((step) => [step.batteryBeforeKwh, step.batteryAfterKwh]);
  const domainMin = Math.min(0, ...values);
  const domainSpan = Math.max(usableKwh - domainMin, 1);
  const y = (value: number) => (usableKwh - value) / domainSpan * 100;
  const minimumKwh = Math.min(outcome.energyFlowStartKwh ?? usableKwh, ...values);
  const netKwh = (outcome.energyFlowEndKwh ?? 0) - (outcome.energyFlowStartKwh ?? 0);
  return (
    <section className="capacity-pane energy-flow-pane" aria-labelledby="energy-flow-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Battery operations diagnostic</p>
          <h2 id="energy-flow-heading">Representative BEMU train-day energy flow</h2>
        </div>
        <span className={`flow-status ${outcome.energyFlowRepeatable ? "repeatable" : "not-repeatable"}`}>
          {outcome.energyFlowRepeatable ? "Repeatable charging cycle" : "Energy not restored"}
        </span>
      </div>
      <div className="flow-summary" aria-live="polite">
        <Metric label="Usable battery" value={`${number.format(usableKwh)} kWh`} note={`${number.format(outcome.installedBatteryKwh ?? 0)} kWh installed`} />
        <Metric label="Day starts" value={`${number.format(outcome.energyFlowStartKwh ?? 0)} kWh`} note="Steady-state onboard energy" />
        <Metric label="Minimum onboard" value={`${number.format(minimumKwh)} kWh`} note="Across the representative day" />
        <Metric label="Day ends" value={`${number.format(outcome.energyFlowEndKwh ?? 0)} kWh`} note={`${netKwh >= 0 ? "+" : ""}${number.format(netKwh)} kWh versus start`} />
      </div>
      <div className="flow-legend" aria-label="Energy-flow legend">
        <span><i className="travel" /> Traction and auxiliaries</span>
        <span><i className="station" /> Station charging</span>
        <span><i className="catenary" /> Existing catenary</span>
        <span><b /> Onboard battery after each event</span>
      </div>
      <div className="flow-chart-scroll">
        <div className="flow-chart" style={{ "--flow-columns": steps.length, minWidth: `${Math.max(760, steps.length * 68)}px` } as CSSProperties} role="img" aria-label={`Waterfall chart of ${steps.length} travel and charging events across one representative train-day`}>
          <div className="flow-grid-line flow-grid-full"><span>{number.format(usableKwh)} kWh</span></div>
          <div className="flow-grid-line flow-grid-half"><span>{number.format((usableKwh + domainMin) / 2)} kWh</span></div>
          <div className="flow-grid-line flow-grid-zero" style={{ top: `${y(0) * 2.1}px` }}><span>0 kWh</span></div>
          <div className="flow-steps">
            {steps.map((step) => {
              const beforeY = y(step.batteryBeforeKwh);
              const afterY = y(step.batteryAfterKwh);
              const top = Math.min(beforeY, afterY);
              const height = Math.max(Math.abs(afterY - beforeY), 0.8);
              const distanceAndTime = `${step.distanceMi === null ? "" : `${step.distanceMi.toFixed(0)} mi · `}${number.format(step.durationMinutes)} min`;
              return (
                <div className="flow-step" key={step.key} aria-label={`${step.label}, ${distanceAndTime}: ${step.energyKwh >= 0 ? "adds" : "uses"} ${number.format(Math.abs(step.energyKwh))} kWh${step.powerKw === null ? "" : ` at ${number.format(step.powerKw)} average kW`}; battery ends at ${number.format(step.batteryAfterKwh)} kWh`}>
                  <div className="flow-step-plot">
                    <i className={`flow-bar ${step.kind}`} style={{ top: `${top}%`, height: `${height}%` }} />
                    <i className="flow-level" style={{ top: `${afterY}%` }} />
                    <strong style={{ top: `${Math.max(1, Math.min(91, top + height / 2))}%` }}>
                      <span>{step.kind === "catenary" ? `Δ ${step.energyKwh < 0 ? "−" : "+"}` : step.energyKwh >= 0 ? "+" : "−"}{number.format(Math.abs(step.energyKwh))} kWh</span>
                      {step.powerKw !== null && <em>{number.format(step.powerKw)} kW avg</em>}
                    </strong>
                  </div>
                  <span>{step.label}</span>
                  <small>{distanceAndTime}<br />{step.detail}</small>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {!outcome.energyFlowRepeatable && <p className="flow-warning">The enabled sources do not restore the energy used over a repeating train-day. The chart therefore starts with a full usable battery and shows the accumulating shortfall; this configuration requires another charging source or more delivered energy.</p>}
      <p className="range-footnote">Movement time follows the current speed assumption. Each blue catenary step combines travel under wire with the Denver dwell, supplies traction directly first, and uses only surplus power to charge the battery; its Δ label is the net battery change. Station steps use configured stopover time. Power labels are average grid-side kW for this train; site demand can be higher when trains overlap.</p>
    </section>
  );
}

export default function Home() {
  const [assumptions, setAssumptions] = useState(DEFAULT_ASSUMPTIONS);
  const [technologies, setTechnologies] = useState(DEFAULT_TECHNOLOGIES);
  const [stops, setStops] = useState(DEFAULT_STOPS);
  const [bands, setBands] = useState<AssumptionBands>({});
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [autoOptimizeBemuSites, setAutoOptimizeBemuSites] = useState(false);
  const [expandedTechnologies, setExpandedTechnologies] = useState<Set<Technology["key"]>>(() => new Set());
  const outcomes = useMemo(
    () => calculateOutcomes(technologies, assumptions, stops, true, autoOptimizeBemuSites),
    [technologies, assumptions, stops, autoOptimizeBemuSites],
  );
  const costRanges = useMemo(
    () => calculateCostRanges(technologies, assumptions, stops, bands, autoOptimizeBemuSites),
    [technologies, assumptions, stops, bands, autoOptimizeBemuSites],
  );
  const leader = outcomes[0];
  const runnerUp = outcomes[1];
  const bemu = outcomes.find((item) => item.technology.key === "bemu")!;
  const catenary = outcomes.find((item) => item.technology.key === "catenary")!;
  const activeRoute = serviceRoute(assumptions.servicePattern);
  const fleetRoundTripsPerDay = assumptions.totalTrains * assumptions.roundTripsPerTrainPerDay;
  const maxCost = Math.max(...outcomes.map((item) => item.equivalentAnnualCostMUsd));
  const selectedBemuSites = bemu.selectedBemuStopKeys.map((key) => stops.find((stop) => stop.key === key)?.name).filter(Boolean);

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
    setAutoOptimizeBemuSites(false);
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

      <details className="dashboard-intro" open>
        <summary>
          <span>About this dashboard</span>
          <span>Purpose + how to use</span>
        </summary>
        <div className="dashboard-intro-body">
          <div className="dashboard-intro-purpose">
            <p className="eyebrow">Purpose</p>
            <h2>Explore how service and technology assumptions change lifecycle cost.</h2>
            <p>
              This planning-level screening tool compares diesel locomotive, battery electric,
              catenary electric, and hydrogen fuel-cell options on a common equivalent-annual basis.
            </p>
          </div>
          <ol className="dashboard-intro-steps">
            <li><strong>Choose the service.</strong><span>Model the Fort Collins–Denver starter schedule or full Fort Collins–Pueblo service.</span></li>
            <li><strong>Set the assumptions.</strong><span>Move any slider, configure stops, or load a preset; results update immediately.</span></li>
            <li><strong>Test uncertainty.</strong><span>Select Add band on critical inputs and move the lower and upper dots to create cost envelopes.</span></li>
            <li><strong>Inspect the result.</strong><span>Compare all four options, then select a powertrain row to reveal its lifecycle cost breakdown.</span></li>
          </ol>
          <p className="dashboard-intro-boundary">
            <strong>Model boundary:</strong> Results are illustrative screening estimates—not a forecast,
            confidence interval, engineering design, or procurement recommendation.
          </p>
        </div>
      </details>

      <section className="executive-summary">
        <div>
          <p className="eyebrow">Current assumption set</p>
          <h2>{leader.technology.name} has the lowest modeled lifecycle cost.</h2>
          <p className="lede">
            {money(leader.equivalentAnnualCostMUsd)} per year—{money(runnerUp.equivalentAnnualCostMUsd - leader.equivalentAnnualCostMUsd)} below {runnerUp.technology.shortName}. Adjust any input below; all results update immediately.
          </p>
        </div>
        <div className="summary-metrics">
          <Metric label="Schedule capacity screen" value={leader.fleetSufficient ? "Sufficient" : "Shortfall"} note={`${assumptions.totalTrains} specified · ${leader.requiredFleetSize} estimated need · ${fleetRoundTripsPerDay} fleet-wide round trips`} />
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
          <span className="capacity-context">{activeRoute.shortName}</span>
        </div>
        <div className="capacity-columns">
          {[bemu, outcomes.find((item) => item.technology.key === "hydrogen")!].map((outcome) => (
            <article key={outcome.technology.key} className="capacity-technology">
              <div className="capacity-title"><i style={{ background: outcome.technology.color }} /><div><h3>{outcome.technology.name}</h3><p>{outcome.bemuSiteOptimizationActive ? `Optimized subset · ${outcome.selectedBemuStopKeys.length} of ${outcome.eligibleBemuStopKeys.length} eligible sources` : `${money(outcome.infrastructureCapitalMUsd)} modeled infrastructure`}</p></div></div>
              {outcome.facilityCapacities.length ? outcome.facilityCapacities.map((facility) => (
                <div className="capacity-site" key={facility.stopKey}>
                  <div><strong>{facility.stopName}</strong><span>{number.format(facility.dwellMinutes)}-minute {facility.isExistingInfrastructure ? "modeled connected interval" : "stopover"}</span></div>
                  <div><strong>{number.format(facility.capacity)} {facility.capacityUnit}</strong><span>{facility.maximumPowerKw ? `${(facility.maximumPowerKw / 1000).toFixed(1)} MW maximum` : facility.peakRateUnit === facility.capacityUnit ? "modeled site capacity" : `${number.format(facility.peakRate)} ${facility.peakRateUnit} peak`}</span></div>
                  <b>{facility.isExistingInfrastructure ? "Existing" : money(facility.capitalMUsd)}</b>
                </div>
              )) : <p className="empty-capacity">No facilities enabled. The option is not operationally supported.</p>}
            </article>
          ))}
        </div>
        <p className="range-footnote">Capacity is a screening estimate based on energy replenished since the preceding enabled facility, stopover duration, scheduled arrivals, and modeled concurrency.</p>
      </section>

      <EnergyFlowChart outcome={bemu} />

      <section className="capacity-pane" aria-labelledby="electricity-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Electricity tariff</p>
            <h2 id="electricity-heading">Energy and demand charges</h2>
          </div>
          <span className="capacity-context">Station-specific tariffs</span>
        </div>
        <div className="capacity-columns">
          <article className="capacity-technology">
            <div className="capacity-title"><i style={{ background: bemu.technology.color }} /><div><h3>{bemu.technology.name}</h3><p>{money(bemu.annualEnergyMUsd)} across enabled sources</p></div></div>
            {bemu.facilityCapacities.map((facility) => {
              const siteEnergyMUsd = facility.annualEnergyKwh * facility.energyRateUsdPerKwh / 1e6;
              const siteDemandMUsd = facility.billedPeakKw * facility.demandRateUsdPerKwMonth * 12 / 1e6;
              return (
                <div className="capacity-site" key={facility.stopKey}>
                  <div><strong>{facility.stopName}</strong><span>{number.format(facility.annualEnergyKwh)} kWh/year × ${facility.energyRateUsdPerKwh.toFixed(3)}</span></div>
                  <div><strong>{number.format(facility.peakRate)} kW actual</strong><span>{number.format(facility.billedPeakKw)} kW billed × ${facility.demandRateUsdPerKwMonth.toFixed(0)}/kW-month</span></div>
                  <b>{money(siteEnergyMUsd + siteDemandMUsd)}</b>
                </div>
              );
            })}
          </article>
          <article className="capacity-technology">
            <div className="capacity-title"><i style={{ background: catenary.technology.color }} /><div><h3>{catenary.technology.name}</h3><p>{money(catenary.annualEnergyMUsd)} total annual electricity cost</p></div></div>
            <div className="capacity-site"><div><strong>Corridor energy</strong><span>{number.format(catenary.annualCarrierUnits)} kWh/year × ${catenary.technology.carrierCostPerUnit.toFixed(2)}</span></div><b>{money(catenary.annualEnergyChargeMUsd)}</b></div>
            <div className="capacity-site"><div><strong>Corridor billing demand</strong><span>{number.format(catenary.unattenuatedPeakDemandKw)} kW before attenuation</span></div><div><strong>{number.format(catenary.billedPeakDemandKw)} kW billed</strong><span>${catenary.technology.electricityDemandUsdPerKwMonth.toFixed(0)}/kW-month</span></div><b>{money(catenary.annualDemandChargeMUsd)}</b></div>
          </article>
        </div>
        <p className="range-footnote">Each BEMU source uses its own volume rate, demand rate, and peak attenuation. The Castle Pines–Westminster catenary is capped at its specified capacity; connection time is derived from travel under wire plus Denver dwell, and modeled cost uses actual delivered energy and power. Storage capital and losses remain outside this screen.</p>
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
            <summary>Service plan <span>route + 4 inputs</span></summary>
            <div className="details-body">
              <label className="route-picker">
                <span>Service extent</span>
                <select
                  value={assumptions.servicePattern}
                  onChange={(event) => {
                    setActivePreset(null);
                    const servicePattern = event.target.value as Assumptions["servicePattern"];
                    setAssumptions((current) => ({
                      ...current,
                      servicePattern,
                      totalTrains: servicePattern === "starter" ? 1 : 12,
                      roundTripsPerTrainPerDay: servicePattern === "starter" ? 3 : 1,
                    }));
                    setBands((current) => {
                      const next = { ...current };
                      delete next["a.totalTrains"];
                      delete next["a.roundTripsPerTrainPerDay"];
                      return next;
                    });
                  }}
                >
                  <option value="starter">Starter service · Fort Collins–Denver</option>
                  <option value="full">Full service · Fort Collins–Pueblo</option>
                </select>
                <small>{assumptions.servicePattern === "starter" ? "One train and three round trips by default" : "Each train covers the full span once per day by default"}</small>
              </label>
              <Slider label="Total trains" value={assumptions.totalTrains} min={1} max={30} step={1} digits={0} onChange={(v) => update("totalTrains", v)} {...bandProps("a.totalTrains")} />
              <Slider label="Round trips / train / day" value={assumptions.roundTripsPerTrainPerDay} min={1} max={6} step={1} digits={0} onChange={(v) => update("roundTripsPerTrainPerDay", v)} {...bandProps("a.roundTripsPerTrainPerDay")} />
              <p className="input-note">{assumptions.servicePattern === "starter" ? "The attached schedule shows three southbound and three northbound departures: three complete Fort Collins–Denver–Fort Collins cycles, so the train starts and ends in Fort Collins." : "One round trip is Fort Collins–Pueblo–Fort Collins. Increase round trips per train to screen more intensive full-corridor service."}</p>
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
            <summary>Charging, catenary & fueling <span>{assumptions.servicePattern === "starter" ? 3 : stops.length} locations</span></summary>
            <div className="stop-config-list">
              <div className="site-optimization-toggle">
                <input id="optimize-bemu-sites" aria-label="Optimize BEMU site selection" type="checkbox" checked={autoOptimizeBemuSites} onChange={(event) => setAutoOptimizeBemuSites(event.target.checked)} />
                <span><strong>Optimize BEMU site selection</strong><small>{autoOptimizeBemuSites ? "Checked sources are eligible; the model chooses the lowest-lifecycle-cost feasible subset." : "Checked sources are required and used whenever the train reaches them."}</small></span>
              </div>
              {autoOptimizeBemuSites && <p className="site-optimization-result"><strong>Selected:</strong> {selectedBemuSites.length ? selectedBemuSites.join(", ") : "No feasible subset of the eligible sources"}</p>}
              {stops.filter((stop) => assumptions.servicePattern === "full" || stop.key === "fort-collins" || stop.key === "denver" || stop.isCatenary).map((stop) => (
                <div className={`stop-config ${stop.isCatenary ? "catenary-config" : ""}`} key={stop.key}>
                  <div className="stop-config-heading"><strong>{stop.name}</strong><span>{stop.isCatenary ? "MP 57–90" : `MP ${stop.milepost}`}</span></div>
                  <div className="facility-toggles">
                    <label><input type="checkbox" checked={stop.bemuEnabled} onChange={(event) => updateStop(stop.key, { bemuEnabled: event.target.checked })} /> {autoOptimizeBemuSites ? "Eligible BEMU source" : stop.isCatenary ? "Use for BEMU charging" : "Battery charging"}</label>
                    {!stop.isCatenary && <label><input type="checkbox" checked={stop.hydrogenEnabled} onChange={(event) => updateStop(stop.key, { hydrogenEnabled: event.target.checked })} /> Hydrogen fueling</label>}
                  </div>
                  {stop.isCatenary && <Slider label="Maximum connection capacity" value={stop.maximumPowerMw} min={0.05} max={15} step={0.05} digits={2} unit=" MW" onChange={(value) => updateStop(stop.key, { maximumPowerMw: value })} {...bandProps(`s.${stop.key}.maximumPowerMw`)} />}
                  {!stop.isCatenary && <Slider label="Stopover" value={stop.dwellMinutes} min={5} max={120} step={5} digits={0} unit=" min" onChange={(value) => updateStop(stop.key, { dwellMinutes: value })} {...bandProps(`s.${stop.key}.dwellMinutes`)} />}
                  <Slider label="Energy rate / kWh" value={stop.electricityEnergyUsdPerKwh} min={0} max={0.3} step={0.005} digits={3} unit=" $" onChange={(value) => updateStop(stop.key, { electricityEnergyUsdPerKwh: value })} {...bandProps(`s.${stop.key}.electricityEnergyUsdPerKwh`)} />
                  <Slider label="Demand rate / kW-month" value={stop.electricityDemandUsdPerKwMonth} min={0} max={60} step={1} digits={0} unit=" $" onChange={(value) => updateStop(stop.key, { electricityDemandUsdPerKwMonth: value })} {...bandProps(`s.${stop.key}.electricityDemandUsdPerKwMonth`)} />
                  <Slider label="Peak attenuation from storage" value={stop.peakDemandAttenuationFraction} min={0} max={1} step={0.05} displayFactor={100} digits={0} unit="%" onChange={(value) => updateStop(stop.key, { peakDemandAttenuationFraction: value })} {...bandProps(`s.${stop.key}.peakDemandAttenuationFraction`)} />
                  {stop.isCatenary && <p className="input-note">Existing infrastructure: no new BEMU charging capital is assigned. Connected time is calculated from travel between Westminster and Castle Pines plus dwell at Denver. While enabled, the catenary supplies traction first and supersedes the separate Denver charger during that dwell.</p>}
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
                {tech.key === "bemu" && <p className="technology-note">Electricity energy, demand, and peak-attenuation assumptions are configured separately at each enabled source above.</p>}
                {tech.key === "catenary" && <p className="technology-note">These tariff inputs apply to the full-corridor catenary option. The existing Castle Pines–Westminster stretch used by BEMU is configured separately above.</p>}
                <Slider label="Fixed vehicle / train" value={tech.fixedVehicleCostMUsd} min={0} max={15} step={0.25} digits={2} unit=" M$" onChange={(v) => updateTechnology(tech.key, "fixedVehicleCostMUsd", v)} {...bandProps(`t.${tech.key}.fixedVehicleCostMUsd`)} />
                <Slider label={tech.key === "bemu" ? "Non-battery vehicle / car" : "Vehicle / car"} value={tech.vehicleCostMUsdPerCar} min={0.2} max={3} step={0.05} digits={2} unit=" M$" onChange={(v) => updateTechnology(tech.key, "vehicleCostMUsdPerCar", v)} {...bandProps(`t.${tech.key}.vehicleCostMUsdPerCar`)} />
                {tech.key !== "bemu" && tech.key !== "hydrogen" && <Slider label="Fixed infrastructure" value={tech.fixedInfrastructureMUsd} min={0} max={100} step={1} digits={0} unit=" M$" onChange={(v) => updateTechnology(tech.key, "fixedInfrastructureMUsd", v)} {...bandProps(`t.${tech.key}.fixedInfrastructureMUsd`)} />}
                {tech.key !== "bemu" && tech.key !== "hydrogen" && <Slider label="Infrastructure / route-mi" value={tech.infrastructureMUsdPerRouteMile} min={0} max={10} step={0.1} digits={1} unit=" M$" onChange={(v) => updateTechnology(tech.key, "infrastructureMUsdPerRouteMile", v)} {...bandProps(`t.${tech.key}.infrastructureMUsdPerRouteMile`)} />}
                {(tech.key === "diesel" || tech.key === "hydrogen") && <Slider label={`Carrier price / ${tech.carrierUnit}`} value={tech.carrierCostPerUnit} min={1} max={tech.key === "hydrogen" ? 20 : 8} step={0.25} digits={2} unit=" $" onChange={(v) => updateTechnology(tech.key, "carrierCostPerUnit", v)} {...bandProps(`t.${tech.key}.carrierCostPerUnit`)} />}
                {tech.key === "catenary" && <Slider label="Electricity energy / kWh" value={tech.carrierCostPerUnit} min={0} max={0.3} step={0.005} digits={3} unit=" $" onChange={(v) => updateTechnology(tech.key, "carrierCostPerUnit", v)} {...bandProps(`t.${tech.key}.carrierCostPerUnit`)} />}
                {tech.key === "catenary" && <Slider label="Demand rate / kW-month" value={tech.electricityDemandUsdPerKwMonth} min={0} max={60} step={1} digits={0} unit=" $" onChange={(v) => updateTechnology(tech.key, "electricityDemandUsdPerKwMonth", v)} {...bandProps(`t.${tech.key}.electricityDemandUsdPerKwMonth`)} />}
                {tech.key === "catenary" && <Slider label="Peak attenuation" value={tech.peakDemandAttenuationFraction} min={0} max={1} step={0.05} displayFactor={100} digits={0} unit="%" onChange={(v) => updateTechnology(tech.key, "peakDemandAttenuationFraction", v)} {...bandProps(`t.${tech.key}.peakDemandAttenuationFraction`)} />}
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
            <Metric label="Charging infrastructure" value={money(bemu.infrastructureCapitalMUsd)} note={`${bemu.indicativeChargerMw?.toFixed(1)} MW peak · ${(bemu.billedPeakDemandKw / 1000).toFixed(1)} MW billed`} />
          </div>
          <p>Capacity is solved iteratively because battery capacity adds mass, which increases energy use and therefore changes the required battery. Station chargers can replenish the accumulated deficit. Existing catenary serves traction directly while the train is under wire, then charges the battery with surplus capacity during travel and Denver dwell.</p>
        </div>
        <div className="formula-card">
          <span>Battery calculation path</span>
          <code>charging sources + power limits → battery deficit → battery kWh → battery mass → revised energy → convergence</code>
          <p>The converged battery is added to vehicle capital at the separate battery-pack $/kWh assumption. The vehicle-per-car input therefore represents the non-battery car cost.</p>
          <p>Enabled sources deliver {bemu.indicativeChargerMw?.toFixed(1)} MW of combined modeled peak power. Site-specific attenuation reduces the summed demand-billing peak to {(bemu.billedPeakDemandKw / 1000).toFixed(1)} MW.</p>
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
