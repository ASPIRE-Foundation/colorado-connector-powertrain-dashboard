export type Segment = { name: string; distanceMi: number; elevationChangeFt: number };
export type ServicePattern = "starter" | "full";

export type Route = {
  key: string;
  name: string;
  shortName: string;
  status: string;
  segments: Segment[];
};

export type ServiceStop = {
  key: "fort-collins" | "denver-westminster-catenary" | "denver" | "colorado-springs" | "pueblo";
  name: string;
  milepost: number;
  dwellMinutes: number;
  bemuEnabled: boolean;
  hydrogenEnabled: boolean;
  isCatenary: boolean;
  maximumPowerMw: number;
  electricityEnergyUsdPerKwh: number;
  electricityDemandUsdPerKwMonth: number;
  peakDemandAttenuationFraction: number;
};

export type Technology = {
  key: "diesel" | "bemu" | "catenary" | "hydrogen";
  name: string;
  shortName: string;
  color: string;
  carrierUnit: string;
  carrierKwhPerUnit: number;
  carrierCostPerUnit: number;
  emissionsKgPerUnit: number;
  carrierToWheelEfficiency: number;
  regenerativeEfficiency: number;
  fixedVehicleCostMUsd: number;
  vehicleCostMUsdPerCar: number;
  fixedInfrastructureMUsd: number;
  infrastructureMUsdPerRouteMile: number;
  maintenanceUsdPerTrainMile: number;
  infrastructureMaintenanceRate: number;
  replacementIntervalYears: number;
  replacementShareOfVehicleCost: number;
  electricityDemandUsdPerKwMonth: number;
  peakDemandAttenuationFraction: number;
};

export type Assumptions = {
  servicePattern: ServicePattern;
  totalTrains: number;
  roundTripsPerTrainPerDay: number;
  cars: number;
  seatsPerCar: number;
  tareTonnesPerCar: number;
  loadFactor: number;
  passengerMassKg: number;
  movingSpeedMph: number;
  crr: number;
  airDensityKgM3: number;
  dragAreaM2: number;
  auxiliaryKwPerCar: number;
  serviceDaysPerYear: number;
  serviceSpanHours: number;
  spareRatio: number;
  analysisYears: number;
  realDiscountRate: number;
  batteryCostUsdPerKwh: number;
  batterySpecificMassKgPerKwh: number;
  batteryReserveFraction: number;
  chargingEfficiency: number;
  gridUpgradeUsdPerKw: number;
  chargerEquipmentUsdPerKw: number;
  hydrogenSupplyUsdPerKgDay: number;
  hydrogenDispenserUsdPerKgHour: number;
};

export type FacilityCapacity = {
  stopKey: ServiceStop["key"];
  stopName: string;
  dwellMinutes: number;
  capacity: number;
  capacityUnit: "kW" | "kg/day";
  peakRate: number;
  peakRateUnit: "kW" | "kg/hour";
  capitalMUsd: number;
  annualEnergyKwh: number;
  energyRateUsdPerKwh: number;
  demandRateUsdPerKwMonth: number;
  billedPeakKw: number;
  maximumPowerKw: number | null;
  isExistingInfrastructure: boolean;
};

export type CostComponent = {
  key: string;
  label: string;
  equivalentAnnualMUsd: number;
};

export type EnergyFlowStep = {
  key: string;
  label: string;
  detail: string;
  kind: "travel" | "station" | "catenary";
  energyKwh: number;
  powerKw: number | null;
  batteryBeforeKwh: number;
  batteryAfterKwh: number;
};

export type Outcome = {
  technology: Technology;
  fleetSize: number;
  requiredFleetSize: number;
  fleetSufficient: boolean;
  initialCapitalMUsd: number;
  infrastructureCapitalMUsd: number;
  annualEnergyMUsd: number;
  annualEnergyChargeMUsd: number;
  annualDemandChargeMUsd: number;
  annualMaintenanceMUsd: number;
  annualOperatingMUsd: number;
  lifecycleNpvMUsd: number;
  equivalentAnnualCostMUsd: number;
  costPerPassengerMileUsd: number;
  annualEmissionsTonnes: number;
  annualCarrierUnits: number;
  maxDirectionalCarrierKwh: number;
  installedBatteryKwh: number | null;
  usableBatteryKwh: number | null;
  requiredBatteryKwhPerCar: number | null;
  requiredInstalledBatteryKwh: number | null;
  batteryMassTonnes: number | null;
  batteryCapitalMUsd: number | null;
  indicativeChargerMw: number | null;
  unattenuatedPeakDemandKw: number;
  billedPeakDemandKw: number;
  facilityCapacities: FacilityCapacity[];
  costComponents: CostComponent[];
  energyFlowSteps: EnergyFlowStep[];
  energyFlowStartKwh: number | null;
  energyFlowEndKwh: number | null;
  energyFlowRepeatable: boolean | null;
};

export type AssumptionBand = { low: number; high: number };
export type AssumptionBands = Record<string, AssumptionBand>;
export type CostRange = { technology: Technology; lowMUsdPerYear: number; baseMUsdPerYear: number; highMUsdPerYear: number };

const segment = (name: string, distanceMi: number, elevationChangeFt: number): Segment => ({ name, distanceMi, elevationChangeFt });

export const FULL_ROUTE: Route = {
  key: "full",
  name: "Fort Collins — Pueblo",
  shortName: "Full corridor · 185 mi",
  status: "Placeholder alignment and station-average grades",
  segments: [
    segment("Fort Collins–Loveland", 15, -21),
    segment("Loveland–Longmont", 18, -3),
    segment("Longmont–Broomfield", 18, 441),
    segment("Broomfield–Westminster", 6, -40),
    segment("Westminster–Denver", 8, -183),
    segment("Denver–Littleton", 10, 165),
    segment("Littleton–Castle Rock", 20, 862),
    segment("Castle Rock–Monument", 20, 733),
    segment("Monument–Colorado Springs", 20, -922),
    segment("Colorado Springs–Fountain", 15, -488),
    segment("Fountain–Pueblo", 35, -855),
  ],
};

export const STARTER_ROUTE: Route = {
  key: "starter",
  name: "Fort Collins — Denver",
  shortName: "Starter corridor · 65 mi",
  status: "Illustrative joint-service schedule and placeholder alignment",
  segments: FULL_ROUTE.segments.slice(0, 5),
};

export const DEFAULT_STOPS: ServiceStop[] = [
  { key: "fort-collins", name: "Fort Collins", milepost: 0, dwellMinutes: 30, bemuEnabled: true, hydrogenEnabled: true, isCatenary: false, maximumPowerMw: 0, electricityEnergyUsdPerKwh: 0.09, electricityDemandUsdPerKwMonth: 15, peakDemandAttenuationFraction: 0.5 },
  { key: "denver-westminster-catenary", name: "Denver–Westminster catenary", milepost: 57, dwellMinutes: 60, bemuEnabled: true, hydrogenEnabled: false, isCatenary: true, maximumPowerMw: 5, electricityEnergyUsdPerKwh: 0.01, electricityDemandUsdPerKwMonth: 0, peakDemandAttenuationFraction: 0 },
  { key: "denver", name: "Denver", milepost: 65, dwellMinutes: 20, bemuEnabled: true, hydrogenEnabled: true, isCatenary: false, maximumPowerMw: 0, electricityEnergyUsdPerKwh: 0.09, electricityDemandUsdPerKwMonth: 15, peakDemandAttenuationFraction: 0.5 },
  { key: "colorado-springs", name: "Colorado Springs", milepost: 135, dwellMinutes: 10, bemuEnabled: false, hydrogenEnabled: false, isCatenary: false, maximumPowerMw: 0, electricityEnergyUsdPerKwh: 0.09, electricityDemandUsdPerKwMonth: 15, peakDemandAttenuationFraction: 0.5 },
  { key: "pueblo", name: "Pueblo", milepost: 185, dwellMinutes: 30, bemuEnabled: true, hydrogenEnabled: true, isCatenary: false, maximumPowerMw: 0, electricityEnergyUsdPerKwh: 0.09, electricityDemandUsdPerKwMonth: 15, peakDemandAttenuationFraction: 0.5 },
];

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  servicePattern: "starter", totalTrains: 1, roundTripsPerTrainPerDay: 3, cars: 8, seatsPerCar: 60,
  tareTonnesPerCar: 35, loadFactor: 0.5, passengerMassKg: 80, movingSpeedMph: 65,
  crr: 0.0017, airDensityKgM3: 1.02, dragAreaM2: 16, auxiliaryKwPerCar: 10,
  serviceDaysPerYear: 340, serviceSpanHours: 16, spareRatio: 0.2, analysisYears: 30,
  realDiscountRate: 0.04, batteryCostUsdPerKwh: 350, batterySpecificMassKgPerKwh: 6,
  batteryReserveFraction: 0.2, chargingEfficiency: 0.92, gridUpgradeUsdPerKw: 450,
  chargerEquipmentUsdPerKw: 650,
  hydrogenSupplyUsdPerKgDay: 1600,
  hydrogenDispenserUsdPerKgHour: 85000,
};

export const DEFAULT_TECHNOLOGIES: Technology[] = [
  { key: "diesel", name: "Diesel locomotive", shortName: "Diesel", color: "#d9663d", carrierUnit: "gal", carrierKwhPerUnit: 40.7, carrierCostPerUnit: 3.8, emissionsKgPerUnit: 12, carrierToWheelEfficiency: 0.3, regenerativeEfficiency: 0, fixedVehicleCostMUsd: 5, vehicleCostMUsdPerCar: 0.75, fixedInfrastructureMUsd: 2, infrastructureMUsdPerRouteMile: 0, maintenanceUsdPerTrainMile: 9, infrastructureMaintenanceRate: 0.03, replacementIntervalYears: 0, replacementShareOfVehicleCost: 0, electricityDemandUsdPerKwMonth: 0, peakDemandAttenuationFraction: 0 },
  { key: "bemu", name: "Battery electric", shortName: "Battery", color: "#287f65", carrierUnit: "kWh", carrierKwhPerUnit: 1, carrierCostPerUnit: 0.09, emissionsKgPerUnit: 0.473, carrierToWheelEfficiency: 0.81, regenerativeEfficiency: 0.7, fixedVehicleCostMUsd: 5, vehicleCostMUsdPerCar: 0.75, fixedInfrastructureMUsd: 0, infrastructureMUsdPerRouteMile: 0, maintenanceUsdPerTrainMile: 5.5, infrastructureMaintenanceRate: 0.03, replacementIntervalYears: 8, replacementShareOfVehicleCost: 0.2, electricityDemandUsdPerKwMonth: 0, peakDemandAttenuationFraction: 0 },
  { key: "catenary", name: "Catenary electric", shortName: "Catenary", color: "#3f6d9b", carrierUnit: "kWh", carrierKwhPerUnit: 1, carrierCostPerUnit: 0.09, emissionsKgPerUnit: 0.473, carrierToWheelEfficiency: 0.88, regenerativeEfficiency: 0.85, fixedVehicleCostMUsd: 5, vehicleCostMUsdPerCar: 0.75, fixedInfrastructureMUsd: 8, infrastructureMUsdPerRouteMile: 4.5, maintenanceUsdPerTrainMile: 4.8, infrastructureMaintenanceRate: 0.02, replacementIntervalYears: 0, replacementShareOfVehicleCost: 0, electricityDemandUsdPerKwMonth: 15, peakDemandAttenuationFraction: 0.5 },
  { key: "hydrogen", name: "Hydrogen fuel cell", shortName: "Hydrogen", color: "#7861a8", carrierUnit: "kg", carrierKwhPerUnit: 33.3, carrierCostPerUnit: 7, emissionsKgPerUnit: 1, carrierToWheelEfficiency: 0.48, regenerativeEfficiency: 0.6, fixedVehicleCostMUsd: 5, vehicleCostMUsdPerCar: 0.75, fixedInfrastructureMUsd: 0, infrastructureMUsdPerRouteMile: 0, maintenanceUsdPerTrainMile: 7, infrastructureMaintenanceRate: 0.04, replacementIntervalYears: 10, replacementShareOfVehicleCost: 0.15, electricityDemandUsdPerKwMonth: 0, peakDemandAttenuationFraction: 0 },
];

const G = 9.81;
const M_PER_MILE = 1609.344;
const M_PER_FOOT = 0.3048;
const J_PER_KWH = 3.6e6;
const STOP_INDEX: Record<ServiceStop["key"], number> = { "fort-collins": 0, "denver-westminster-catenary": 4, denver: 5, "colorado-springs": 9, pueblo: 11 };

function routeDistance(route: Route) { return route.segments.reduce((sum, item) => sum + item.distanceMi, 0); }
export function serviceRoute(pattern: ServicePattern) { return pattern === "starter" ? STARTER_ROUTE : FULL_ROUTE; }
function dailyRoundTrips(a: Assumptions) { return a.totalTrains * a.roundTripsPerTrainPerDay; }
function reverseRoute(route: Route): Route { return { ...route, key: `${route.key}-reverse`, segments: [...route.segments].reverse().map((item) => ({ ...item, elevationChangeFt: -item.elevationChangeFt })) }; }
function routeBetween(from: ServiceStop["key"], to: ServiceStop["key"]): Route {
  const start = STOP_INDEX[from];
  const end = STOP_INDEX[to];
  const route: Route = { ...FULL_ROUTE, key: `${from}-${to}`, segments: FULL_ROUTE.segments.slice(Math.min(start, end), Math.max(start, end)) };
  return start < end ? route : reverseRoute(route);
}

function grossMassKg(a: Assumptions, tech: Technology, batteryKwhPerCar = 0) {
  const tare = a.cars * a.tareTonnesPerCar * 1000;
  const passengers = a.cars * a.seatsPerCar * a.loadFactor * a.passengerMassKg;
  const battery = tech.key === "bemu" ? a.cars * batteryKwhPerCar * a.batterySpecificMassKgPerKwh : 0;
  return tare + passengers + battery;
}

function directionEnergy(route: Route, tech: Technology, a: Assumptions, batteryKwhPerCar = 0) {
  const mass = grossMassKg(a, tech, batteryKwhPerCar);
  const speedMs = a.movingSpeedMph * 0.44704;
  let positiveJ = 0;
  let recoverableJ = 0;
  let auxiliaryKwh = 0;
  route.segments.forEach((item) => {
    const distanceM = item.distanceMi * M_PER_MILE;
    const elevationM = item.elevationChangeFt * M_PER_FOOT;
    positiveJ += a.crr * mass * G * distanceM + 0.5 * a.airDensityKgM3 * a.dragAreaM2 * speedMs ** 2 * distanceM + mass * G * Math.max(elevationM, 0) + 0.5 * mass * speedMs ** 2;
    recoverableJ += mass * G * Math.max(-elevationM, 0) + 0.5 * mass * speedMs ** 2;
    auxiliaryKwh += a.cars * a.auxiliaryKwPerCar * (distanceM / speedMs / 3600);
  });
  const carrierKwh = Math.max(0, (positiveJ / J_PER_KWH + auxiliaryKwh) / tech.carrierToWheelEfficiency - recoverableJ / J_PER_KWH * tech.regenerativeEfficiency);
  return { carrierKwh, carrierUnits: carrierKwh / tech.carrierKwhPerUnit };
}

function serviceCircuitDefinitions(pattern: ServicePattern): ServiceStop["key"][][] {
  return pattern === "starter"
    ? [["fort-collins", "denver"]]
    : [["fort-collins", "denver", "colorado-springs", "pueblo", "colorado-springs", "denver"]];
}
function energyCircuitDefinitions(pattern: ServicePattern): ServiceStop["key"][][] {
  return pattern === "starter"
    ? [["fort-collins", "denver-westminster-catenary", "denver", "denver-westminster-catenary"]]
    : [["fort-collins", "denver-westminster-catenary", "denver", "colorado-springs", "pueblo", "colorado-springs", "denver", "denver-westminster-catenary"]];
}
function circuitLegEnergies(nodes: ServiceStop["key"][], tech: Technology, a: Assumptions, batteryKwhPerCar = 0) { return nodes.map((from, index) => directionEnergy(routeBetween(from, nodes[(index + 1) % nodes.length]), tech, a, batteryKwhPerCar)); }

function facilitySizing(tech: Technology, a: Assumptions, stops: ServiceStop[], batteryKwhPerCar = 0) {
  const events: { stopKey: ServiceStop["key"]; gridKwh: number; carrierUnits: number }[] = [];
  let maxGapKwh = 0;
  if (tech.key === "bemu") {
    const catenary = stops.find((stop) => stop.isCatenary)!;
    energyCircuitDefinitions(a.servicePattern).forEach((sourceNodes) => {
      const firstUnlimited = sourceNodes.findIndex((key) => {
        const stop = stops.find((item) => item.key === key);
        return Boolean(stop?.bemuEnabled && !stop.isCatenary);
      });
      const catenaryStart = catenary.bemuEnabled ? sourceNodes.findIndex((key) => key === "denver") : -1;
      const startIndex = firstUnlimited >= 0 ? firstUnlimited : catenaryStart >= 0 ? catenaryStart : 0;
      const nodes = startIndex > 0
        ? [...sourceNodes.slice(startIndex), ...sourceNodes.slice(0, startIndex)]
        : sourceNodes;
      const catenaryEventsPerDay = 2 * dailyRoundTrips(a);
      const catenaryConcurrency = Math.max(1, Math.ceil(catenaryEventsPerDay * catenary.dwellMinutes / (a.serviceSpanHours * 60)));
      const catenaryBatteryKwhAvailable = catenary.maximumPowerMw * 1000 * (catenary.dwellMinutes / 60) / catenaryConcurrency * a.chargingEfficiency;
      let deficitKwh = 0;
      nodes.forEach((from, index) => {
        const to = nodes[(index + 1) % nodes.length];
        const leg = directionEnergy(routeBetween(from, to), tech, a, batteryKwhPerCar);
        const usesCatenary = catenary.bemuEnabled && ((from === catenary.key && to === "denver") || (from === "denver" && to === catenary.key));
        if (usesCatenary) {
          const deficitBeforeSupply = deficitKwh + leg.carrierKwh;
          const batteryKwhDelivered = Math.min(deficitBeforeSupply, catenaryBatteryKwhAvailable);
          deficitKwh = deficitBeforeSupply - batteryKwhDelivered;
          events.push({ stopKey: catenary.key, gridKwh: batteryKwhDelivered / a.chargingEfficiency, carrierUnits: batteryKwhDelivered });
        } else {
          deficitKwh += leg.carrierKwh;
        }
        maxGapKwh = Math.max(maxGapKwh, deficitKwh);
        const destination = stops.find((stop) => stop.key === to);
        if (destination?.bemuEnabled && !destination.isCatenary) {
          events.push({ stopKey: destination.key, gridKwh: deficitKwh / a.chargingEfficiency, carrierUnits: deficitKwh });
          deficitKwh = 0;
        }
      });
    });
  } else {
    serviceCircuitDefinitions(a.servicePattern).forEach((nodes) => {
      const legs = circuitLegEnergies(nodes, tech, a, batteryKwhPerCar);
      const facilityIndexes = nodes.map((key, index) => stops.find((stop) => stop.key === key)?.hydrogenEnabled ? index : -1).filter((index) => index >= 0);
      if (facilityIndexes.length === 0) {
        maxGapKwh = Math.max(maxGapKwh, legs.reduce((sum, leg) => sum + leg.carrierKwh, 0));
        return;
      }
      facilityIndexes.forEach((current, facilityPosition) => {
        const previous = facilityIndexes[(facilityPosition - 1 + facilityIndexes.length) % facilityIndexes.length];
        let index = previous;
        let carrierKwh = 0;
        let carrierUnits = 0;
        do {
          carrierKwh += legs[index].carrierKwh;
          carrierUnits += legs[index].carrierUnits;
          index = (index + 1) % nodes.length;
        } while (index !== current);
        maxGapKwh = Math.max(maxGapKwh, carrierKwh);
        events.push({ stopKey: nodes[current], gridKwh: carrierKwh, carrierUnits });
      });
    });
  }

  const activeStopKeys = new Set((tech.key === "bemu" ? energyCircuitDefinitions(a.servicePattern) : serviceCircuitDefinitions(a.servicePattern)).flat());
  const facilities = stops.filter((stop) => activeStopKeys.has(stop.key) && (tech.key === "bemu" ? stop.bemuEnabled : stop.hydrogenEnabled)).map((stop): FacilityCapacity => {
    const siteEvents = events.filter((event) => event.stopKey === stop.key);
    const eventsPerDay = siteEvents.length * dailyRoundTrips(a);
    const concurrency = Math.max(1, Math.ceil(eventsPerDay * stop.dwellMinutes / (a.serviceSpanHours * 60)));
    const maxEventKwh = Math.max(0, ...siteEvents.map((event) => event.gridKwh));
    const maxEventUnits = Math.max(0, ...siteEvents.map((event) => event.carrierUnits));
    if (tech.key === "bemu") {
      const capacityKw = maxEventKwh / Math.max(stop.dwellMinutes / 60, 1 / 60) * concurrency;
      const maximumPowerKw = stop.isCatenary ? stop.maximumPowerMw * 1000 : null;
      const actualPeakKw = maximumPowerKw === null ? capacityKw : Math.min(capacityKw, maximumPowerKw);
      const billedPeakKw = actualPeakKw * (1 - Math.min(1, Math.max(0, stop.peakDemandAttenuationFraction)));
      const annualEnergyKwh = siteEvents.reduce((sum, event) => sum + event.gridKwh, 0) * dailyRoundTrips(a) * a.serviceDaysPerYear;
      return { stopKey: stop.key, stopName: stop.name, dwellMinutes: stop.dwellMinutes, capacity: actualPeakKw, capacityUnit: "kW", peakRate: actualPeakKw, peakRateUnit: "kW", capitalMUsd: stop.isCatenary ? 0 : actualPeakKw * (a.gridUpgradeUsdPerKw + a.chargerEquipmentUsdPerKw) / 1e6, annualEnergyKwh, energyRateUsdPerKwh: stop.electricityEnergyUsdPerKwh, demandRateUsdPerKwMonth: stop.electricityDemandUsdPerKwMonth, billedPeakKw, maximumPowerKw, isExistingInfrastructure: stop.isCatenary };
    }
    const dailyKg = siteEvents.reduce((sum, event) => sum + event.carrierUnits, 0) * dailyRoundTrips(a);
    const peakKgHour = maxEventUnits / Math.max(stop.dwellMinutes / 60, 1 / 60) * concurrency;
    return { stopKey: stop.key, stopName: stop.name, dwellMinutes: stop.dwellMinutes, capacity: dailyKg, capacityUnit: "kg/day", peakRate: peakKgHour, peakRateUnit: "kg/hour", capitalMUsd: (dailyKg * a.hydrogenSupplyUsdPerKgDay + peakKgHour * a.hydrogenDispenserUsdPerKgHour) / 1e6, annualEnergyKwh: 0, energyRateUsdPerKwh: 0, demandRateUsdPerKwMonth: 0, billedPeakKw: 0, maximumPowerKw: null, isExistingInfrastructure: false };
  });
  return { facilities, maxGapKwh };
}

function requiredBatteryKwhPerCar(tech: Technology, a: Assumptions, stops: ServiceStop[]) {
  let estimate = 0;
  for (let iteration = 0; iteration < 50; iteration += 1) {
    const requiredUsable = facilitySizing(tech, a, stops, estimate).maxGapKwh;
    const next = requiredUsable / Math.max(1 - a.batteryReserveFraction, 0.01) / a.cars;
    if (Math.abs(next - estimate) < 0.01) return next;
    estimate = Math.min(next, 10000);
  }
  return estimate;
}

function requiredFleet(a: Assumptions, stops: ServiceStop[]) {
  const spareDivisor = Math.max(1 - a.spareRatio, 0.01);
  const cycleHours = (nodes: ServiceStop["key"][]) => {
    const moving = nodes.reduce((sum, from, index) => sum + routeDistance(routeBetween(from, nodes[(index + 1) % nodes.length])) / a.movingSpeedMph, 0);
    const dwell = nodes.reduce((sum, key) => sum + (stops.find((stop) => stop.key === key)?.dwellMinutes ?? 0) / 60, 0);
    return moving + dwell;
  };
  const needed = (nodes: ServiceStop["key"][]) => Math.ceil(dailyRoundTrips(a) * cycleHours(nodes) / a.serviceSpanHours / spareDivisor);
  return needed(serviceCircuitDefinitions(a.servicePattern)[0]);
}

function bemuEnergyFlow(tech: Technology, a: Assumptions, stops: ServiceStop[], batteryKwhPerCar: number, usableBatteryKwh: number) {
  const nodes = energyCircuitDefinitions(a.servicePattern)[0];
  const catenary = stops.find((stop) => stop.isCatenary)!;
  const catenaryEventsPerDay = 2 * dailyRoundTrips(a);
  const catenaryConcurrency = Math.max(1, Math.ceil(catenaryEventsPerDay * catenary.dwellMinutes / (a.serviceSpanHours * 60)));
  const catenaryBatteryKwhAvailable = catenary.maximumPowerMw * 1000 * (catenary.dwellMinutes / 60) / catenaryConcurrency * a.chargingEfficiency;
  const shortName = (key: ServiceStop["key"]) => ({
    "fort-collins": "Fort Collins",
    "denver-westminster-catenary": "Westminster",
    denver: "Denver",
    "colorado-springs": "Colorado Springs",
    pueblo: "Pueblo",
  })[key];
  const simulateDay = (initialDeficitKwh: number, capture: boolean) => {
    let deficitKwh = initialDeficitKwh;
    const steps: EnergyFlowStep[] = [];
    for (let circuit = 0; circuit < a.roundTripsPerTrainPerDay; circuit += 1) {
      nodes.forEach((from, index) => {
        const to = nodes[(index + 1) % nodes.length];
        const leg = directionEnergy(routeBetween(from, to), tech, a, batteryKwhPerCar);
        const beforeTravel = usableBatteryKwh - deficitKwh;
        deficitKwh += leg.carrierKwh;
        if (capture) steps.push({
          key: `c${circuit}-leg${index}`,
          label: `${shortName(from)} → ${shortName(to)}`,
          detail: `Circuit ${circuit + 1} traction`,
          kind: "travel",
          energyKwh: -leg.carrierKwh,
          powerKw: null,
          batteryBeforeKwh: beforeTravel,
          batteryAfterKwh: usableBatteryKwh - deficitKwh,
        });
        const usesCatenary = catenary.bemuEnabled && ((from === catenary.key && to === "denver") || (from === "denver" && to === catenary.key));
        if (usesCatenary) {
          const deliveredKwh = Math.min(deficitKwh, catenaryBatteryKwhAvailable);
          const beforeCharge = usableBatteryKwh - deficitKwh;
          deficitKwh -= deliveredKwh;
          if (capture) steps.push({
            key: `c${circuit}-cat${index}`,
            label: "Existing catenary",
            detail: `${shortName(from)} → ${shortName(to)} connection`,
            kind: "catenary",
            energyKwh: deliveredKwh,
            powerKw: deliveredKwh / a.chargingEfficiency / Math.max(catenary.dwellMinutes / 60, 1 / 60),
            batteryBeforeKwh: beforeCharge,
            batteryAfterKwh: usableBatteryKwh - deficitKwh,
          });
        }
        const destination = stops.find((stop) => stop.key === to);
        if (destination?.bemuEnabled && !destination.isCatenary) {
          const deliveredKwh = deficitKwh;
          const beforeCharge = usableBatteryKwh - deficitKwh;
          deficitKwh = 0;
          if (capture) steps.push({
            key: `c${circuit}-station${index}`,
            label: `${destination.name} charge`,
            detail: `${destination.dwellMinutes}-minute stopover`,
            kind: "station",
            energyKwh: deliveredKwh,
            powerKw: deliveredKwh / a.chargingEfficiency / Math.max(destination.dwellMinutes / 60, 1 / 60),
            batteryBeforeKwh: beforeCharge,
            batteryAfterKwh: usableBatteryKwh,
          });
        }
      });
    }
    return { endDeficitKwh: deficitKwh, steps };
  };

  let steadyDeficitKwh = 0;
  let repeatable = false;
  for (let iteration = 0; iteration < 50; iteration += 1) {
    const nextDeficitKwh = simulateDay(steadyDeficitKwh, false).endDeficitKwh;
    if (Math.abs(nextDeficitKwh - steadyDeficitKwh) < 0.01) {
      repeatable = true;
      steadyDeficitKwh = nextDeficitKwh;
      break;
    }
    steadyDeficitKwh = nextDeficitKwh;
    if (steadyDeficitKwh > Math.max(usableBatteryKwh * 20, 1e6)) break;
  }
  if (!repeatable) steadyDeficitKwh = 0;
  const representative = simulateDay(steadyDeficitKwh, true);
  return {
    steps: representative.steps,
    startKwh: usableBatteryKwh - steadyDeficitKwh,
    endKwh: usableBatteryKwh - representative.endDeficitKwh,
    repeatable,
  };
}

function catenaryPeakDemandKw(route: Route, tech: Technology, a: Assumptions) {
  const peakPerTrainKw = Math.max(...route.segments.map((item) => {
    const segmentRoute: Route = { ...route, segments: [item] };
    const durationHours = item.distanceMi / a.movingSpeedMph;
    return directionEnergy(segmentRoute, tech, a).carrierKwh / Math.max(durationHours, 1 / 60);
  }));
  const movingTrainHours = dailyRoundTrips(a) * 2 * routeDistance(route) / a.movingSpeedMph;
  const concurrentTrains = Math.max(1, Math.min(a.totalTrains, Math.ceil(movingTrainHours / a.serviceSpanHours)));
  return peakPerTrainKw * concurrentTrains;
}

function annuityFactor(rate: number, years: number) { return rate === 0 ? years : (1 - (1 + rate) ** -years) / rate; }

export function calculateOutcomes(technologies: Technology[], a: Assumptions, stops: ServiceStop[], includeEnergyFlow = true): Outcome[] {
  const route = serviceRoute(a.servicePattern);
  const distanceMi = routeDistance(route);
  const annualRoundTrips = dailyRoundTrips(a) * a.serviceDaysPerYear;
  const trainMiles = 2 * distanceMi * annualRoundTrips;
  const required = requiredFleet(a, stops);
  const af = annuityFactor(a.realDiscountRate, a.analysisYears);
  return technologies.map((tech): Outcome => {
    const requiredPerCar = tech.key === "bemu" ? requiredBatteryKwhPerCar(tech, a, stops) : null;
    const batteryKwhPerCar = requiredPerCar ?? 0;
    const outbound = directionEnergy(route, tech, a, batteryKwhPerCar);
    const inbound = directionEnergy(reverseRoute(route), tech, a, batteryKwhPerCar);
    const tractionAnnualUnits = (outbound.carrierUnits + inbound.carrierUnits) * annualRoundTrips;
    const sized = tech.key === "bemu" || tech.key === "hydrogen" ? facilitySizing(tech, a, stops, batteryKwhPerCar) : { facilities: [], maxGapKwh: Math.max(outbound.carrierKwh, inbound.carrierKwh) };
    const infrastructure = tech.key === "bemu" || tech.key === "hydrogen" ? sized.facilities.reduce((sum, facility) => sum + facility.capitalMUsd, 0) : tech.fixedInfrastructureMUsd + distanceMi * tech.infrastructureMUsdPerRouteMile;
    const installedBattery = tech.key === "bemu" ? a.cars * batteryKwhPerCar : 0;
    const batteryCapital = tech.key === "bemu" ? a.totalTrains * installedBattery * a.batteryCostUsdPerKwh / 1e6 : 0;
    const baseVehicleCapital = a.totalTrains * (tech.fixedVehicleCostMUsd + a.cars * tech.vehicleCostMUsdPerCar);
    const vehicleCapital = baseVehicleCapital + batteryCapital;
    const initialCapital = vehicleCapital + infrastructure;
    const isElectric = tech.key === "bemu" || tech.key === "catenary";
    const annualUnits = tech.key === "bemu"
      ? sized.facilities.reduce((sum, facility) => sum + facility.annualEnergyKwh, 0)
      : tractionAnnualUnits;
    const energyCharge = tech.key === "bemu"
      ? sized.facilities.reduce((sum, facility) => sum + facility.annualEnergyKwh * facility.energyRateUsdPerKwh, 0) / 1e6
      : annualUnits * tech.carrierCostPerUnit / 1e6;
    const unattenuatedPeakDemandKw = tech.key === "bemu"
      ? sized.facilities.reduce((sum, facility) => sum + facility.peakRate, 0)
      : tech.key === "catenary" ? catenaryPeakDemandKw(route, tech, a) : 0;
    const billedPeakDemandKw = tech.key === "bemu"
      ? sized.facilities.reduce((sum, facility) => sum + facility.billedPeakKw, 0)
      : tech.key === "catenary" ? unattenuatedPeakDemandKw * (1 - Math.min(1, Math.max(0, tech.peakDemandAttenuationFraction))) : 0;
    const demandCharge = tech.key === "bemu"
      ? sized.facilities.reduce((sum, facility) => sum + facility.billedPeakKw * facility.demandRateUsdPerKwMonth * 12, 0) / 1e6
      : tech.key === "catenary" ? billedPeakDemandKw * tech.electricityDemandUsdPerKwMonth * 12 / 1e6 : 0;
    const energyCost = energyCharge + demandCharge;
    const vehicleMaintenance = trainMiles * tech.maintenanceUsdPerTrainMile / 1e6;
    const infrastructureMaintenance = infrastructure * tech.infrastructureMaintenanceRate;
    const maintenance = vehicleMaintenance + infrastructureMaintenance;
    const annualOperating = energyCost + maintenance;
    let npv = initialCapital + annualOperating * af;
    let replacementNpv = 0;
    if (tech.replacementIntervalYears > 0) {
      const replacement = tech.key === "bemu" ? batteryCapital : vehicleCapital * tech.replacementShareOfVehicleCost;
      for (let year = tech.replacementIntervalYears; year < a.analysisYears; year += tech.replacementIntervalYears) replacementNpv += replacement / (1 + a.realDiscountRate) ** year;
      npv += replacementNpv;
    }
    const eac = npv / af;
    const usableBattery = installedBattery * (1 - a.batteryReserveFraction);
    const requiredInstalled = requiredPerCar === null ? null : requiredPerCar * a.cars;
    const flow = tech.key === "bemu" && includeEnergyFlow ? bemuEnergyFlow(tech, a, stops, batteryKwhPerCar, usableBattery) : null;
    return {
      technology: tech, fleetSize: a.totalTrains, requiredFleetSize: required, fleetSufficient: a.totalTrains >= required,
      initialCapitalMUsd: initialCapital, infrastructureCapitalMUsd: infrastructure, annualEnergyMUsd: energyCost,
      annualEnergyChargeMUsd: energyCharge, annualDemandChargeMUsd: demandCharge,
      annualMaintenanceMUsd: maintenance, annualOperatingMUsd: annualOperating, lifecycleNpvMUsd: npv,
      equivalentAnnualCostMUsd: eac, costPerPassengerMileUsd: eac * 1e6 / (trainMiles * a.cars * a.seatsPerCar * a.loadFactor),
      annualEmissionsTonnes: annualUnits * tech.emissionsKgPerUnit / 1000, annualCarrierUnits: annualUnits,
      maxDirectionalCarrierKwh: sized.maxGapKwh,
      installedBatteryKwh: tech.key === "bemu" ? installedBattery : null,
      usableBatteryKwh: tech.key === "bemu" ? usableBattery : null,
      requiredBatteryKwhPerCar: requiredPerCar,
      requiredInstalledBatteryKwh: requiredInstalled,
      batteryMassTonnes: tech.key === "bemu" ? installedBattery * a.batterySpecificMassKgPerKwh / 1000 : null,
      batteryCapitalMUsd: tech.key === "bemu" ? batteryCapital : null,
      indicativeChargerMw: tech.key === "bemu" ? sized.facilities.reduce((sum, facility) => sum + facility.peakRate, 0) / 1000 : null,
      unattenuatedPeakDemandKw, billedPeakDemandKw,
      facilityCapacities: sized.facilities,
      energyFlowSteps: flow?.steps ?? [],
      energyFlowStartKwh: flow?.startKwh ?? null,
      energyFlowEndKwh: flow?.endKwh ?? null,
      energyFlowRepeatable: flow?.repeatable ?? null,
      costComponents: [
        { key: "base-vehicles", label: "Base vehicle capital", equivalentAnnualMUsd: baseVehicleCapital / af },
        { key: "battery", label: "Battery pack capital", equivalentAnnualMUsd: batteryCapital / af },
        { key: "infrastructure", label: "Infrastructure capital", equivalentAnnualMUsd: infrastructure / af },
        { key: "energy", label: isElectric ? "Electricity energy" : "Energy", equivalentAnnualMUsd: energyCharge },
        { key: "demand", label: "Electricity demand charges", equivalentAnnualMUsd: demandCharge },
        { key: "vehicle-maintenance", label: "Vehicle maintenance", equivalentAnnualMUsd: vehicleMaintenance },
        { key: "infrastructure-maintenance", label: "Infrastructure maintenance", equivalentAnnualMUsd: infrastructureMaintenance },
        { key: "replacements", label: "Scheduled replacements", equivalentAnnualMUsd: replacementNpv / af },
      ].filter((component) => component.equivalentAnnualMUsd > 1e-9).sort((left, right) => right.equivalentAnnualMUsd - left.equivalentAnnualMUsd),
    };
  }).sort((left, right) => left.equivalentAnnualCostMUsd - right.equivalentAnnualCostMUsd);
}

function readBandBase(id: string, assumptions: Assumptions, technologies: Technology[], stops: ServiceStop[]) {
  const [scope, first, second] = id.split(".");
  if (scope === "a") return assumptions[first as keyof Assumptions] as number;
  if (scope === "s") return stops.find((stop) => stop.key === first)?.[second as keyof ServiceStop] as number;
  return technologies.find((item) => item.key === first)?.[second as keyof Technology] as number;
}
function applyBandValues(assumptions: Assumptions, technologies: Technology[], stops: ServiceStop[], values: Record<string, number>) {
  const nextAssumptions = { ...assumptions };
  const nextTechnologies = technologies.map((item) => ({ ...item }));
  const nextStops = stops.map((item) => ({ ...item }));
  Object.entries(values).forEach(([id, value]) => {
    const [scope, first, second] = id.split(".");
    if (scope === "a") (nextAssumptions as unknown as Record<string, number>)[first] = value;
    else if (scope === "s") {
      const stop = nextStops.find((item) => item.key === first);
      if (stop) (stop as unknown as Record<string, number>)[second] = value;
    } else {
      const technology = nextTechnologies.find((item) => item.key === first);
      if (technology) (technology as unknown as Record<string, number>)[second] = value;
    }
  });
  return { assumptions: nextAssumptions, technologies: nextTechnologies, stops: nextStops };
}

export function calculateCostRanges(technologies: Technology[], assumptions: Assumptions, stops: ServiceStop[], bands: AssumptionBands): CostRange[] {
  const baseOutcomes = calculateOutcomes(technologies, assumptions, stops, false);
  const activeEntries = Object.entries(bands);
  if (activeEntries.length === 0) return technologies.map((technology) => {
    const base = baseOutcomes.find((item) => item.technology.key === technology.key)!;
    return { technology, lowMUsdPerYear: base.equivalentAnnualCostMUsd, baseMUsdPerYear: base.equivalentAnnualCostMUsd, highMUsdPerYear: base.equivalentAnnualCostMUsd };
  });
  return technologies.map((technology) => {
    const relevantEntries = activeEntries.filter(([id]) => id.startsWith("a.") || id.startsWith("s.") || id.startsWith(`t.${technology.key}.`));
    const baseValues = Object.fromEntries(relevantEntries.map(([id]) => [id, readBandBase(id, assumptions, technologies, stops)]));
    const lowValues = Object.fromEntries(relevantEntries.map(([id, band]) => [id, band.low]));
    const highValues = Object.fromEntries(relevantEntries.map(([id, band]) => [id, band.high]));
    const evaluate = (values: Record<string, number>) => {
      const state = applyBandValues(assumptions, technologies, stops, values);
      return calculateOutcomes(state.technologies, state.assumptions, state.stops, false).find((item) => item.technology.key === technology.key)!.equivalentAnnualCostMUsd;
    };
    const optimize = (goal: "min" | "max", start: Record<string, number>) => {
      const current = { ...start };
      for (let sweep = 0; sweep < 3; sweep += 1) relevantEntries.forEach(([id, band]) => {
        const candidates = [band.low, baseValues[id], band.high].map((value) => ({ value, cost: evaluate({ ...current, [id]: value }) }));
        candidates.sort((left, right) => goal === "min" ? left.cost - right.cost : right.cost - left.cost);
        current[id] = candidates[0].value;
      });
      return evaluate(current);
    };
    const base = baseOutcomes.find((item) => item.technology.key === technology.key)!;
    const starts = [baseValues, lowValues, highValues];
    return { technology, lowMUsdPerYear: Math.min(...starts.map((start) => optimize("min", start))), baseMUsdPerYear: base.equivalentAnnualCostMUsd, highMUsdPerYear: Math.max(...starts.map((start) => optimize("max", start))) };
  });
}
