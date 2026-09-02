export type LegKey =
  | "fort-collins-loveland"
  | "loveland-longmont"
  | "longmont-boulder"
  | "boulder-louisville"
  | "louisville-broomfield"
  | "broomfield-westminster"
  | "westminster-denver"
  | "denver-littleton"
  | "littleton-castle-pines"
  | "castle-pines-castle-rock"
  | "castle-rock-monument"
  | "monument-colorado-springs"
  | "colorado-springs-fountain"
  | "fountain-pueblo";

export type DirectionalMinutes = { southbound: number; northbound: number };
export type Segment = { key: LegKey; name: string; distanceMi: number; elevationChangeFt: number; reverse?: boolean };
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
  legMinutes: Record<LegKey, DirectionalMinutes>;
  starterDenverLayover1Minutes: number;
  starterDenverLayover2Minutes: number;
  starterDenverLayover3Minutes: number;
  starterFortCollinsTurn1Minutes: number;
  starterFortCollinsTurn2Minutes: number;
  starterOvernightMinutes: number;
  fullDenverDwellMinutes: number;
  fullColoradoSpringsDwellMinutes: number;
  fullPuebloLayoverMinutes: number;
  fullFortCollinsLayoverMinutes: number;
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
  distanceMi: number | null;
  durationMinutes: number;
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
  bemuSiteOptimizationActive: boolean;
  eligibleBemuStopKeys: ServiceStop["key"][];
  selectedBemuStopKeys: ServiceStop["key"][];
};

export type AssumptionBand = { low: number; high: number };
export type AssumptionBands = Record<string, AssumptionBand>;
export type CostRange = { technology: Technology; lowMUsdPerYear: number; baseMUsdPerYear: number; highMUsdPerYear: number };

type RoutePoint = ServiceStop["key"] | "castle-pines-catenary-boundary";

const segment = (key: LegKey, name: string, distanceMi: number, elevationChangeFt: number): Segment => ({ key, name, distanceMi, elevationChangeFt });

export const DEFAULT_LEG_MINUTES: Record<LegKey, DirectionalMinutes> = {
  "fort-collins-loveland": { southbound: 17, northbound: 14 },
  "loveland-longmont": { southbound: 22, northbound: 22 },
  "longmont-boulder": { southbound: 14, northbound: 15 },
  "boulder-louisville": { southbound: 15, northbound: 14 },
  "louisville-broomfield": { southbound: 10, northbound: 11 },
  "broomfield-westminster": { southbound: 14, northbound: 13 },
  "westminster-denver": { southbound: 16, northbound: 19 },
  "denver-littleton": { southbound: 15, northbound: 15 },
  "littleton-castle-pines": { southbound: 25, northbound: 25 },
  "castle-pines-castle-rock": { southbound: 10, northbound: 10 },
  "castle-rock-monument": { southbound: 30, northbound: 30 },
  "monument-colorado-springs": { southbound: 30, northbound: 30 },
  "colorado-springs-fountain": { southbound: 20, northbound: 20 },
  "fountain-pueblo": { southbound: 50, northbound: 50 },
};

export const FULL_ROUTE: Route = {
  key: "full",
  name: "Fort Collins — Pueblo",
  shortName: "Full corridor · 185 mi",
  status: "Placeholder alignment and station-average grades",
  segments: [
    segment("fort-collins-loveland", "Fort Collins–Loveland", 15, -21),
    segment("loveland-longmont", "Loveland–Longmont", 18, -3),
    segment("longmont-boulder", "Longmont–Boulder", 8, 350),
    segment("boulder-louisville", "Boulder–Louisville", 5, -75),
    segment("louisville-broomfield", "Louisville–Broomfield", 5, 166),
    segment("broomfield-westminster", "Broomfield–Westminster", 6, -40),
    segment("westminster-denver", "Westminster–Denver", 8, -183),
    segment("denver-littleton", "Denver–Littleton", 10, 165),
    segment("littleton-castle-pines", "Littleton–Castle Pines", 15, 647),
    segment("castle-pines-castle-rock", "Castle Pines–Castle Rock", 5, 215),
    segment("castle-rock-monument", "Castle Rock–Monument", 20, 733),
    segment("monument-colorado-springs", "Monument–Colorado Springs", 20, -922),
    segment("colorado-springs-fountain", "Colorado Springs–Fountain", 15, -488),
    segment("fountain-pueblo", "Fountain–Pueblo", 35, -855),
  ],
};

export const STARTER_ROUTE: Route = {
  key: "starter",
  name: "Fort Collins — Denver",
  shortName: "Starter corridor · 65 mi",
  status: "Illustrative joint-service schedule and placeholder alignment",
  segments: FULL_ROUTE.segments.slice(0, 7),
};

export const SCHEDULE_LEGS = FULL_ROUTE.segments.map((item, index) => ({
  key: item.key,
  name: item.name,
  source: index < STARTER_ROUTE.segments.length ? "Published timetable" : "Planning estimate",
}));

export const DEFAULT_STOPS: ServiceStop[] = [
  { key: "fort-collins", name: "Fort Collins", milepost: 0, dwellMinutes: 30, bemuEnabled: true, hydrogenEnabled: true, isCatenary: false, maximumPowerMw: 0, electricityEnergyUsdPerKwh: 0.09, electricityDemandUsdPerKwMonth: 15, peakDemandAttenuationFraction: 0.5 },
  { key: "denver-westminster-catenary", name: "Castle Pines–Westminster catenary", milepost: 57, dwellMinutes: 0, bemuEnabled: true, hydrogenEnabled: false, isCatenary: true, maximumPowerMw: 5, electricityEnergyUsdPerKwh: 0.01, electricityDemandUsdPerKwMonth: 0, peakDemandAttenuationFraction: 0 },
  { key: "denver", name: "Denver", milepost: 65, dwellMinutes: 20, bemuEnabled: true, hydrogenEnabled: true, isCatenary: false, maximumPowerMw: 0, electricityEnergyUsdPerKwh: 0.09, electricityDemandUsdPerKwMonth: 15, peakDemandAttenuationFraction: 0.5 },
  { key: "colorado-springs", name: "Colorado Springs", milepost: 135, dwellMinutes: 10, bemuEnabled: false, hydrogenEnabled: false, isCatenary: false, maximumPowerMw: 0, electricityEnergyUsdPerKwh: 0.09, electricityDemandUsdPerKwMonth: 15, peakDemandAttenuationFraction: 0.5 },
  { key: "pueblo", name: "Pueblo", milepost: 185, dwellMinutes: 30, bemuEnabled: true, hydrogenEnabled: true, isCatenary: false, maximumPowerMw: 0, electricityEnergyUsdPerKwh: 0.09, electricityDemandUsdPerKwMonth: 15, peakDemandAttenuationFraction: 0.5 },
];

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  servicePattern: "starter", totalTrains: 1, roundTripsPerTrainPerDay: 3, cars: 8, seatsPerCar: 60,
  tareTonnesPerCar: 35, loadFactor: 0.5, passengerMassKg: 80,
  legMinutes: structuredClone(DEFAULT_LEG_MINUTES),
  starterDenverLayover1Minutes: 24, starterDenverLayover2Minutes: 222, starterDenverLayover3Minutes: 24,
  starterFortCollinsTurn1Minutes: 26, starterFortCollinsTurn2Minutes: 16, starterOvernightMinutes: 480,
  fullDenverDwellMinutes: 10, fullColoradoSpringsDwellMinutes: 10,
  fullPuebloLayoverMinutes: 30, fullFortCollinsLayoverMinutes: 480,
  movingSpeedMph: 65,
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
const STOP_INDEX: Record<RoutePoint, number> = { "fort-collins": 0, "denver-westminster-catenary": 6, denver: 7, "castle-pines-catenary-boundary": 9, "colorado-springs": 12, pueblo: 14 };

function routeDistance(route: Route) { return route.segments.reduce((sum, item) => sum + item.distanceMi, 0); }
export function serviceRoute(pattern: ServicePattern) { return pattern === "starter" ? STARTER_ROUTE : FULL_ROUTE; }
function dailyRoundTrips(a: Assumptions) { return a.totalTrains * a.roundTripsPerTrainPerDay; }
function segmentMinutes(item: Segment, a: Assumptions) {
  const timing = a.legMinutes[item.key];
  return item.reverse ? timing.northbound : timing.southbound;
}
function routeMinutes(route: Route, a: Assumptions) { return route.segments.reduce((sum, item) => sum + segmentMinutes(item, a), 0); }
export function scheduledOneWayMinutes(pattern: ServicePattern, direction: keyof DirectionalMinutes, a: Assumptions) {
  const route = serviceRoute(pattern);
  return route.segments.reduce((sum, item) => sum + a.legMinutes[item.key][direction], 0);
}
export function scheduledTrainDayMinutes(a: Assumptions) { return scheduledServiceMinutesPerTrain(a); }
function reverseRoute(route: Route): Route { return { ...route, key: `${route.key}-reverse`, segments: [...route.segments].reverse().map((item) => ({ ...item, reverse: !item.reverse, elevationChangeFt: -item.elevationChangeFt })) }; }
function routeBetween(from: RoutePoint, to: RoutePoint): Route {
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
    auxiliaryKwh += a.cars * a.auxiliaryKwPerCar * segmentMinutes(item, a) / 60;
  });
  const carrierKwh = Math.max(0, (positiveJ / J_PER_KWH + auxiliaryKwh) / tech.carrierToWheelEfficiency - recoverableJ / J_PER_KWH * tech.regenerativeEfficiency);
  return { carrierKwh, carrierUnits: carrierKwh / tech.carrierKwhPerUnit };
}

function serviceCircuitDefinitions(pattern: ServicePattern): ServiceStop["key"][][] {
  return pattern === "starter"
    ? [["fort-collins", "denver"]]
    : [["fort-collins", "denver", "colorado-springs", "pueblo", "colorado-springs", "denver"]];
}
function energyCircuitDefinitions(pattern: ServicePattern): RoutePoint[][] {
  return pattern === "starter"
    ? [["fort-collins", "denver-westminster-catenary", "denver", "denver-westminster-catenary"]]
    : [["fort-collins", "denver-westminster-catenary", "denver", "castle-pines-catenary-boundary", "colorado-springs", "pueblo", "colorado-springs", "castle-pines-catenary-boundary", "denver", "denver-westminster-catenary"]];
}
function circuitLegEnergies(nodes: ServiceStop["key"][], tech: Technology, a: Assumptions, batteryKwhPerCar = 0) { return nodes.map((from, index) => directionEnergy(routeBetween(from, nodes[(index + 1) % nodes.length]), tech, a, batteryKwhPerCar)); }

function scheduledDwellMinutes(a: Assumptions, stopKey: ServiceStop["key"], circuit: number) {
  if (a.servicePattern === "starter") {
    if (stopKey === "denver") return [a.starterDenverLayover1Minutes, a.starterDenverLayover2Minutes, a.starterDenverLayover3Minutes][circuit % 3];
    if (stopKey === "fort-collins") {
      if (circuit === a.roundTripsPerTrainPerDay - 1) return a.starterOvernightMinutes;
      return [a.starterFortCollinsTurn1Minutes, a.starterFortCollinsTurn2Minutes][circuit % 2];
    }
  }
  if (stopKey === "denver") return a.fullDenverDwellMinutes;
  if (stopKey === "colorado-springs") return a.fullColoradoSpringsDwellMinutes;
  if (stopKey === "pueblo") return a.fullPuebloLayoverMinutes;
  if (stopKey === "fort-collins") return a.fullFortCollinsLayoverMinutes;
  return 0;
}

function scheduledServiceMinutesPerTrain(a: Assumptions) {
  const route = serviceRoute(a.servicePattern);
  const movement = a.roundTripsPerTrainPerDay * (routeMinutes(route, a) + routeMinutes(reverseRoute(route), a));
  if (a.servicePattern === "starter") {
    const denver = Array.from({ length: a.roundTripsPerTrainPerDay }, (_, circuit) => scheduledDwellMinutes(a, "denver", circuit)).reduce((sum, value) => sum + value, 0);
    const fortCollinsTurns = Array.from({ length: Math.max(0, a.roundTripsPerTrainPerDay - 1) }, (_, circuit) => scheduledDwellMinutes(a, "fort-collins", circuit)).reduce((sum, value) => sum + value, 0);
    return movement + denver + fortCollinsTurns;
  }
  return movement + a.roundTripsPerTrainPerDay * (a.fullDenverDwellMinutes * 2 + a.fullColoradoSpringsDwellMinutes * 2 + a.fullPuebloLayoverMinutes)
    + Math.max(0, a.roundTripsPerTrainPerDay - 1) * a.fullFortCollinsLayoverMinutes;
}

function usesCatenaryWire(from: RoutePoint, to: RoutePoint) {
  const pair = new Set<RoutePoint>([from, to]);
  return (pair.has("denver-westminster-catenary") && pair.has("denver"))
    || (pair.has("denver") && pair.has("castle-pines-catenary-boundary"));
}

function catenaryConnectedMinutes(a: Assumptions) {
  const nodes = energyCircuitDefinitions(a.servicePattern)[0];
  let minutes = 0;
  for (let circuit = 0; circuit < a.roundTripsPerTrainPerDay; circuit += 1) nodes.forEach((from, index) => {
      const to = nodes[(index + 1) % nodes.length];
      if (!usesCatenaryWire(from, to)) return;
      minutes += routeMinutes(routeBetween(from, to), a);
      if (to === "denver") minutes += scheduledDwellMinutes(a, "denver", circuit);
    });
  return minutes;
}

function catenaryIntervalDurations(a: Assumptions) {
  const nodes = energyCircuitDefinitions(a.servicePattern)[0];
  const durations: number[] = [];
  for (let circuit = 0; circuit < a.roundTripsPerTrainPerDay; circuit += 1) nodes.forEach((from, index) => {
      const via = nodes[(index + 1) % nodes.length];
      const to = nodes[(index + 2) % nodes.length];
      if (!usesCatenaryWire(from, via) || via !== "denver" || !usesCatenaryWire(via, to)) return;
      durations.push(routeMinutes(routeBetween(from, via), a) + scheduledDwellMinutes(a, "denver", circuit) + routeMinutes(routeBetween(via, to), a));
    });
  return durations;
}

function catenarySharedPowerKw(a: Assumptions, catenary: ServiceStop) {
  const concurrentTrains = Math.max(1, Math.ceil(a.totalTrains * catenaryConnectedMinutes(a) / (a.serviceSpanHours * 60)));
  return catenary.maximumPowerMw * 1000 / concurrentTrains;
}

function applyCatenaryEnergy(deficitKwh: number, tractionKwh: number, durationMinutes: number, sharedPowerKw: number, chargingEfficiency: number) {
  const availableGridKwh = sharedPowerKw * durationMinutes / 60;
  const directTractionKwh = Math.min(tractionKwh, availableGridKwh);
  const deficitAfterTractionKwh = deficitKwh + tractionKwh - directTractionKwh;
  const remainingGridKwh = Math.max(0, availableGridKwh - directTractionKwh);
  const batteryKwhDelivered = Math.min(deficitAfterTractionKwh, remainingGridKwh * chargingEfficiency);
  const gridKwh = directTractionKwh + batteryKwhDelivered / Math.max(chargingEfficiency, 0.01);
  return {
    deficitKwh: deficitAfterTractionKwh - batteryKwhDelivered,
    gridKwh,
    directTractionKwh,
    batteryKwhDelivered,
  };
}

function facilitySizing(tech: Technology, a: Assumptions, stops: ServiceStop[], batteryKwhPerCar = 0) {
  const events: { stopKey: ServiceStop["key"]; gridKwh: number; carrierUnits: number; durationMinutes: number; peakKw?: number }[] = [];
  let maxGapKwh = 0;
  if (tech.key === "bemu") {
    const catenary = stops.find((stop) => stop.isCatenary)!;
    const sharedCatenaryPowerKw = catenarySharedPowerKw(a, catenary);
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
      let deficitKwh = 0;
      for (let circuit = 0; circuit < a.roundTripsPerTrainPerDay; circuit += 1) nodes.forEach((from, index) => {
          const to = nodes[(index + 1) % nodes.length];
          const legRoute = routeBetween(from, to);
          const leg = directionEnergy(legRoute, tech, a, batteryKwhPerCar);
          const travelMinutes = routeMinutes(legRoute, a);
          const usesCatenary = catenary.bemuEnabled && usesCatenaryWire(from, to);
          if (usesCatenary) {
            const supplied = applyCatenaryEnergy(deficitKwh, leg.carrierKwh, travelMinutes, sharedCatenaryPowerKw, a.chargingEfficiency);
            deficitKwh = supplied.deficitKwh;
            events.push({ stopKey: catenary.key, gridKwh: supplied.gridKwh, carrierUnits: supplied.gridKwh, durationMinutes: travelMinutes, peakKw: supplied.gridKwh / Math.max(travelMinutes / 60, 1 / 60) });
          } else {
            deficitKwh += leg.carrierKwh;
          }
          maxGapKwh = Math.max(maxGapKwh, deficitKwh);
          if (usesCatenary && to === "denver") {
            const denverDwellMinutes = scheduledDwellMinutes(a, "denver", circuit);
            const supplied = applyCatenaryEnergy(deficitKwh, 0, denverDwellMinutes, sharedCatenaryPowerKw, a.chargingEfficiency);
            deficitKwh = supplied.deficitKwh;
            events.push({ stopKey: catenary.key, gridKwh: supplied.gridKwh, carrierUnits: supplied.gridKwh, durationMinutes: denverDwellMinutes, peakKw: supplied.gridKwh / Math.max(denverDwellMinutes / 60, 1 / 60) });
          }
          const destination = stops.find((stop) => stop.key === to);
          const catenaryOwnsDenverDwell = catenary.bemuEnabled && destination?.key === "denver" && usesCatenary;
          if (destination?.bemuEnabled && !destination.isCatenary && !catenaryOwnsDenverDwell) {
            const dwellMinutes = scheduledDwellMinutes(a, destination.key, circuit);
            events.push({ stopKey: destination.key, gridKwh: deficitKwh / a.chargingEfficiency, carrierUnits: deficitKwh, durationMinutes: dwellMinutes });
            deficitKwh = 0;
          }
        });
    });
  } else {
    serviceCircuitDefinitions(a.servicePattern).forEach((nodes) => {
      const legs = circuitLegEnergies(nodes, tech, a, batteryKwhPerCar);
      const facilityIndexes = nodes.map((key, index) => stops.find((stop) => stop.key === key)?.hydrogenEnabled ? index : -1).filter((index) => index >= 0);
      if (facilityIndexes.length === 0) {
        maxGapKwh = Math.max(maxGapKwh, legs.reduce((sum, leg) => sum + leg.carrierKwh, 0) * a.roundTripsPerTrainPerDay);
        return;
      }
      for (let circuit = 0; circuit < a.roundTripsPerTrainPerDay; circuit += 1) facilityIndexes.forEach((current, facilityPosition) => {
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
          events.push({ stopKey: nodes[current], gridKwh: carrierKwh, carrierUnits, durationMinutes: scheduledDwellMinutes(a, nodes[current], circuit) });
        });
    });
  }

  const activeStopKeys = new Set<RoutePoint>((tech.key === "bemu" ? energyCircuitDefinitions(a.servicePattern) : serviceCircuitDefinitions(a.servicePattern)).flat());
  const facilities = stops.filter((stop) => activeStopKeys.has(stop.key)
    && (tech.key === "bemu" ? stop.bemuEnabled : stop.hydrogenEnabled)
    && (tech.key !== "bemu" || stop.isCatenary || events.some((event) => event.stopKey === stop.key))).map((stop): FacilityCapacity => {
    const siteEvents = events.filter((event) => event.stopKey === stop.key);
    const modeledDwellMinutes = stop.isCatenary
      ? Math.max(0, ...catenaryIntervalDurations(a))
      : Math.max(0, ...siteEvents.map((event) => event.durationMinutes));
    const occupiedMinutesPerTrainDay = siteEvents.reduce((sum, event) => sum + event.durationMinutes, 0);
    const concurrency = Math.max(1, Math.ceil(a.totalTrains * occupiedMinutesPerTrainDay / (a.serviceSpanHours * 60)));
    if (tech.key === "bemu") {
      const capacityKw = stop.isCatenary
        ? Math.max(0, ...siteEvents.map((event) => event.peakKw ?? 0)) * concurrency
        : Math.max(0, ...siteEvents.map((event) => event.gridKwh / Math.max(event.durationMinutes / 60, 1 / 60))) * concurrency;
      const maximumPowerKw = stop.isCatenary ? stop.maximumPowerMw * 1000 : null;
      const actualPeakKw = maximumPowerKw === null ? capacityKw : Math.min(capacityKw, maximumPowerKw);
      const billedPeakKw = actualPeakKw * (1 - Math.min(1, Math.max(0, stop.peakDemandAttenuationFraction)));
      const annualEnergyKwh = siteEvents.reduce((sum, event) => sum + event.gridKwh, 0) * a.totalTrains * a.serviceDaysPerYear;
      return { stopKey: stop.key, stopName: stop.name, dwellMinutes: modeledDwellMinutes, capacity: actualPeakKw, capacityUnit: "kW", peakRate: actualPeakKw, peakRateUnit: "kW", capitalMUsd: stop.isCatenary ? 0 : actualPeakKw * (a.gridUpgradeUsdPerKw + a.chargerEquipmentUsdPerKw) / 1e6, annualEnergyKwh, energyRateUsdPerKwh: stop.electricityEnergyUsdPerKwh, demandRateUsdPerKwMonth: stop.electricityDemandUsdPerKwMonth, billedPeakKw, maximumPowerKw, isExistingInfrastructure: stop.isCatenary };
    }
    const dailyKg = siteEvents.reduce((sum, event) => sum + event.carrierUnits, 0) * a.totalTrains;
    const peakKgHour = Math.max(0, ...siteEvents.map((event) => event.carrierUnits / Math.max(event.durationMinutes / 60, 1 / 60))) * concurrency;
    return { stopKey: stop.key, stopName: stop.name, dwellMinutes: modeledDwellMinutes, capacity: dailyKg, capacityUnit: "kg/day", peakRate: peakKgHour, peakRateUnit: "kg/hour", capitalMUsd: (dailyKg * a.hydrogenSupplyUsdPerKgDay + peakKgHour * a.hydrogenDispenserUsdPerKgHour) / 1e6, annualEnergyKwh: 0, energyRateUsdPerKwh: 0, demandRateUsdPerKwMonth: 0, billedPeakKw: 0, maximumPowerKw: null, isExistingInfrastructure: false };
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

function requiredFleet(a: Assumptions) {
  const spareDivisor = Math.max(1 - a.spareRatio, 0.01);
  const scheduledHoursPerTrain = scheduledServiceMinutesPerTrain(a) / 60;
  return Math.ceil(a.totalTrains * scheduledHoursPerTrain / a.serviceSpanHours / spareDivisor);
}

function bemuEnergyFlow(tech: Technology, a: Assumptions, stops: ServiceStop[], batteryKwhPerCar: number, usableBatteryKwh: number) {
  const nodes = energyCircuitDefinitions(a.servicePattern)[0];
  const catenary = stops.find((stop) => stop.isCatenary)!;
  const sharedCatenaryPowerKw = catenarySharedPowerKw(a, catenary);
  const shortName = (key: RoutePoint) => ({
    "fort-collins": "Fort Collins",
    "denver-westminster-catenary": "Westminster",
    denver: "Denver",
    "castle-pines-catenary-boundary": "Castle Pines",
    "colorado-springs": "Colorado Springs",
    pueblo: "Pueblo",
  })[key];
  const simulateDay = (initialDeficitKwh: number, capture: boolean) => {
    let deficitKwh = initialDeficitKwh;
    const steps: EnergyFlowStep[] = [];
    for (let circuit = 0; circuit < a.roundTripsPerTrainPerDay; circuit += 1) {
      for (let index = 0; index < nodes.length; index += 1) {
        const startsCatenaryInterval = catenary.bemuEnabled
          && usesCatenaryWire(nodes[index], nodes[(index + 1) % nodes.length])
          && nodes[(index + 1) % nodes.length] === "denver";
        if (startsCatenaryInterval) {
          const from = nodes[index];
          const via = nodes[(index + 1) % nodes.length];
          const to = nodes[(index + 2) % nodes.length];
          const firstRoute = routeBetween(from, via);
          const secondRoute = routeBetween(via, to);
          const distanceMi = routeDistance(firstRoute) + routeDistance(secondRoute);
          const travelMinutes = routeMinutes(firstRoute, a) + routeMinutes(secondRoute, a);
          const denverDwellMinutes = scheduledDwellMinutes(a, "denver", circuit);
          const durationMinutes = travelMinutes + denverDwellMinutes;
          const tractionKwh = directionEnergy(firstRoute, tech, a, batteryKwhPerCar).carrierKwh
            + directionEnergy(secondRoute, tech, a, batteryKwhPerCar).carrierKwh;
          const beforeKwh = usableBatteryKwh - deficitKwh;
          const supplied = applyCatenaryEnergy(deficitKwh, tractionKwh, durationMinutes, sharedCatenaryPowerKw, a.chargingEfficiency);
          deficitKwh = supplied.deficitKwh;
          if (capture) steps.push({
            key: `c${circuit}-cat${index}`,
            label: `${shortName(from)} → ${shortName(via)} → ${shortName(to)} under wire`,
            detail: `${Math.round(supplied.directTractionKwh).toLocaleString()} kWh direct traction · ${Math.round(supplied.batteryKwhDelivered).toLocaleString()} kWh to battery`,
            kind: "catenary",
            energyKwh: usableBatteryKwh - deficitKwh - beforeKwh,
            powerKw: supplied.gridKwh / Math.max(durationMinutes / 60, 1 / 60),
            distanceMi,
            durationMinutes,
            batteryBeforeKwh: beforeKwh,
            batteryAfterKwh: usableBatteryKwh - deficitKwh,
          });
          index += 1;
          continue;
        }
        const to = nodes[(index + 1) % nodes.length];
        const from = nodes[index];
        const legRoute = routeBetween(from, to);
        const legDistanceMi = routeDistance(legRoute);
        const leg = directionEnergy(legRoute, tech, a, batteryKwhPerCar);
        const beforeTravel = usableBatteryKwh - deficitKwh;
        deficitKwh += leg.carrierKwh;
        if (capture) steps.push({
          key: `c${circuit}-leg${index}`,
          label: `${shortName(from)} → ${shortName(to)}`,
          detail: `Circuit ${circuit + 1} traction`,
          kind: "travel",
          energyKwh: -leg.carrierKwh,
          powerKw: null,
          distanceMi: legDistanceMi,
          durationMinutes: routeMinutes(legRoute, a),
          batteryBeforeKwh: beforeTravel,
            batteryAfterKwh: usableBatteryKwh - deficitKwh,
          });
        const destination = stops.find((stop) => stop.key === to);
        if (destination?.bemuEnabled && !destination.isCatenary) {
          const dwellMinutes = scheduledDwellMinutes(a, destination.key, circuit);
          const deliveredKwh = deficitKwh;
          const beforeCharge = usableBatteryKwh - deficitKwh;
          deficitKwh = 0;
          if (capture) steps.push({
            key: `c${circuit}-station${index}`,
            label: `${destination.name} charge`,
            detail: a.servicePattern === "starter" ? "Published train-day layover" : "Planning dwell estimate",
            kind: "station",
            energyKwh: deliveredKwh,
            powerKw: deliveredKwh / a.chargingEfficiency / Math.max(dwellMinutes / 60, 1 / 60),
            distanceMi: null,
            durationMinutes: dwellMinutes,
            batteryBeforeKwh: beforeCharge,
            batteryAfterKwh: usableBatteryKwh,
          });
        }
      }
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
    const durationHours = segmentMinutes(item, a) / 60;
    return directionEnergy(segmentRoute, tech, a).carrierKwh / Math.max(durationHours, 1 / 60);
  }));
  const movingTrainHours = dailyRoundTrips(a) * (routeMinutes(route, a) + routeMinutes(reverseRoute(route), a)) / 60;
  const concurrentTrains = Math.max(1, Math.min(a.totalTrains, Math.ceil(movingTrainHours / a.serviceSpanHours)));
  return peakPerTrainKw * concurrentTrains;
}

function annuityFactor(rate: number, years: number) { return rate === 0 ? years : (1 - (1 + rate) ** -years) / rate; }

function calculateFixedSiteOutcomes(technologies: Technology[], a: Assumptions, stops: ServiceStop[], includeEnergyFlow = true): Outcome[] {
  const route = serviceRoute(a.servicePattern);
  const distanceMi = routeDistance(route);
  const annualRoundTrips = dailyRoundTrips(a) * a.serviceDaysPerYear;
  const trainMiles = 2 * distanceMi * annualRoundTrips;
  const required = requiredFleet(a);
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
      bemuSiteOptimizationActive: false,
      eligibleBemuStopKeys: [],
      selectedBemuStopKeys: tech.key === "bemu" ? sized.facilities.map((facility) => facility.stopKey) : [],
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

function stopIsInService(stop: ServiceStop, pattern: ServicePattern) {
  return pattern === "full" || stop.key === "fort-collins" || stop.key === "denver" || stop.isCatenary;
}

function optimizeBemuSites(technology: Technology, a: Assumptions, stops: ServiceStop[], includeEnergyFlow: boolean) {
  const eligible = stops.filter((stop) => stop.bemuEnabled && stopIsInService(stop, a.servicePattern));
  let best: { outcome: Outcome; stops: ServiceStop[] } | null = null;
  for (let mask = 1; mask < 2 ** eligible.length; mask += 1) {
    const selectedKeys = new Set(eligible.filter((_, index) => mask & (1 << index)).map((stop) => stop.key));
    const candidateStops = stops.map((stop) => ({ ...stop, bemuEnabled: selectedKeys.has(stop.key) }));
    let candidate = calculateFixedSiteOutcomes([technology], a, candidateStops, false)[0];
    const hasConventionalSource = candidate.facilityCapacities.some((facility) => !facility.isExistingInfrastructure);
    if (!hasConventionalSource) {
      candidate = calculateFixedSiteOutcomes([technology], a, candidateStops, true)[0];
      if (!candidate.energyFlowRepeatable) continue;
    }
    if (!best || candidate.equivalentAnnualCostMUsd < best.outcome.equivalentAnnualCostMUsd) best = { outcome: candidate, stops: candidateStops };
  }
  const selectedStops = best?.stops ?? stops;
  const outcome = calculateFixedSiteOutcomes([technology], a, selectedStops, includeEnergyFlow)[0];
  return {
    ...outcome,
    bemuSiteOptimizationActive: true,
    eligibleBemuStopKeys: eligible.map((stop) => stop.key),
    selectedBemuStopKeys: outcome.facilityCapacities.map((facility) => facility.stopKey),
  };
}

export function calculateOutcomes(technologies: Technology[], a: Assumptions, stops: ServiceStop[], includeEnergyFlow = true, autoOptimizeBemuSites = false): Outcome[] {
  if (!autoOptimizeBemuSites) return calculateFixedSiteOutcomes(technologies, a, stops, includeEnergyFlow);
  const nonBemu = technologies.filter((technology) => technology.key !== "bemu");
  const outcomes = calculateFixedSiteOutcomes(nonBemu, a, stops, includeEnergyFlow);
  const bemu = technologies.find((technology) => technology.key === "bemu");
  if (bemu) outcomes.push(optimizeBemuSites(bemu, a, stops, includeEnergyFlow));
  return outcomes.sort((left, right) => left.equivalentAnnualCostMUsd - right.equivalentAnnualCostMUsd);
}

function readBandBase(id: string, assumptions: Assumptions, technologies: Technology[], stops: ServiceStop[]) {
  const [scope, first, second] = id.split(".");
  if (scope === "a") return assumptions[first as keyof Assumptions] as number;
  if (scope === "l") return assumptions.legMinutes[first as LegKey][second as keyof DirectionalMinutes];
  if (scope === "s") return stops.find((stop) => stop.key === first)?.[second as keyof ServiceStop] as number;
  return technologies.find((item) => item.key === first)?.[second as keyof Technology] as number;
}
function applyBandValues(assumptions: Assumptions, technologies: Technology[], stops: ServiceStop[], values: Record<string, number>) {
  const nextAssumptions = { ...assumptions, legMinutes: Object.fromEntries(Object.entries(assumptions.legMinutes).map(([key, timing]) => [key, { ...timing }])) as Record<LegKey, DirectionalMinutes> };
  const nextTechnologies = technologies.map((item) => ({ ...item }));
  const nextStops = stops.map((item) => ({ ...item }));
  Object.entries(values).forEach(([id, value]) => {
    const [scope, first, second] = id.split(".");
    if (scope === "a") (nextAssumptions as unknown as Record<string, number>)[first] = value;
    else if (scope === "l") nextAssumptions.legMinutes[first as LegKey][second as keyof DirectionalMinutes] = value;
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

export function calculateCostRanges(technologies: Technology[], assumptions: Assumptions, stops: ServiceStop[], bands: AssumptionBands, autoOptimizeBemuSites = false): CostRange[] {
  const baseOutcomes = calculateOutcomes(technologies, assumptions, stops, false, autoOptimizeBemuSites);
  const activeEntries = Object.entries(bands);
  if (activeEntries.length === 0) return technologies.map((technology) => {
    const base = baseOutcomes.find((item) => item.technology.key === technology.key)!;
    return { technology, lowMUsdPerYear: base.equivalentAnnualCostMUsd, baseMUsdPerYear: base.equivalentAnnualCostMUsd, highMUsdPerYear: base.equivalentAnnualCostMUsd };
  });
  return technologies.map((technology) => {
    const relevantEntries = activeEntries.filter(([id]) => id.startsWith("a.") || id.startsWith("l.") || id.startsWith("s.") || id.startsWith(`t.${technology.key}.`));
    const baseValues = Object.fromEntries(relevantEntries.map(([id]) => [id, readBandBase(id, assumptions, technologies, stops)]));
    const lowValues = Object.fromEntries(relevantEntries.map(([id, band]) => [id, band.low]));
    const highValues = Object.fromEntries(relevantEntries.map(([id, band]) => [id, band.high]));
    const evaluate = (values: Record<string, number>) => {
      const state = applyBandValues(assumptions, technologies, stops, values);
      return calculateOutcomes(state.technologies, state.assumptions, state.stops, false, autoOptimizeBemuSites && technology.key === "bemu").find((item) => item.technology.key === technology.key)!.equivalentAnnualCostMUsd;
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
