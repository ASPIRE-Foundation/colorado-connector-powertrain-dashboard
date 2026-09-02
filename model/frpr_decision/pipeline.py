"""Closed-form service, energy, facility, and lifecycle-cost pipeline."""

from dataclasses import replace
from math import ceil

from .defaults import DEFAULT_STOPS, FULL_ROUTE, STARTER_ROUTE
from .types import Assumptions, CostComponent, CostRange, DirectionEnergy, FacilityCapacity, Route, ServiceStop, Technology, TechnologyOutcome


class DecisionModel:
    G = 9.81
    M_PER_MILE = 1609.344
    M_PER_FOOT = 0.3048
    J_PER_KWH = 3.6e6
    STOP_INDEX = {"fort-collins": 0, "denver-westminster-catenary": 4, "denver": 5, "colorado-springs": 9, "pueblo": 11}

    def __init__(self, assumptions: Assumptions, stops: tuple[ServiceStop, ...] = DEFAULT_STOPS):
        self.assumptions = assumptions
        self.stops = stops

    def gross_mass_kg(self, technology: Technology, battery_kwh_per_car: float = 0.0) -> float:
        a = self.assumptions
        tare = a.cars * a.tare_tonnes_per_car * 1000
        passengers = a.cars * a.seats_per_car * a.load_factor * a.passenger_mass_kg
        battery = a.cars * battery_kwh_per_car * a.battery_specific_mass_kg_per_kwh if technology.key == "bemu" else 0
        return tare + passengers + battery

    def direction_energy(self, route: Route, technology: Technology, battery_kwh_per_car: float = 0.0) -> DirectionEnergy:
        a = self.assumptions
        mass = self.gross_mass_kg(technology, battery_kwh_per_car)
        speed_ms = a.moving_speed_mph * 0.44704
        positive_j = recoverable_j = auxiliary_kwh = 0.0
        for item in route.segments:
            distance_m = item.distance_mi * self.M_PER_MILE
            elevation_m = item.elevation_change_ft * self.M_PER_FOOT
            positive_j += a.crr * mass * self.G * distance_m
            positive_j += 0.5 * a.air_density_kg_m3 * a.drag_area_m2 * speed_ms**2 * distance_m
            positive_j += mass * self.G * max(elevation_m, 0) + 0.5 * mass * speed_ms**2
            recoverable_j += mass * self.G * max(-elevation_m, 0) + 0.5 * mass * speed_ms**2
            auxiliary_kwh += a.cars * a.auxiliary_kw_per_car * distance_m / speed_ms / 3600
        positive_kwh = positive_j / self.J_PER_KWH
        recoverable_kwh = recoverable_j / self.J_PER_KWH
        carrier_kwh = max(0, (positive_kwh + auxiliary_kwh) / technology.carrier_to_wheel_efficiency - recoverable_kwh * technology.regenerative_efficiency)
        return DirectionEnergy(carrier_kwh / technology.carrier_kwh_per_unit, carrier_kwh, positive_kwh, recoverable_kwh, auxiliary_kwh)

    @staticmethod
    def circuits(pattern: str) -> tuple[tuple[str, ...], ...]:
        if pattern == "starter":
            return (("fort-collins", "denver"),)
        return (("fort-collins", "denver", "colorado-springs", "pueblo", "colorado-springs", "denver"),)

    @staticmethod
    def energy_circuits(pattern: str) -> tuple[tuple[str, ...], ...]:
        if pattern == "starter":
            return (("fort-collins", "denver-westminster-catenary", "denver", "denver-westminster-catenary"),)
        return (("fort-collins", "denver-westminster-catenary", "denver", "colorado-springs", "pueblo", "colorado-springs", "denver", "denver-westminster-catenary"),)

    def service_route(self) -> Route:
        return STARTER_ROUTE if self.assumptions.service_pattern == "starter" else FULL_ROUTE

    def daily_round_trips(self) -> int:
        return self.assumptions.total_trains * self.assumptions.round_trips_per_train_per_day

    def route_between(self, origin: str, destination: str) -> Route:
        start, end = self.STOP_INDEX[origin], self.STOP_INDEX[destination]
        route = Route(f"{origin}-{destination}", f"{origin}-{destination}", FULL_ROUTE.segments[min(start, end):max(start, end)])
        return route if start < end else route.reversed()

    def required_fleet(self) -> int:
        a = self.assumptions
        def needed(nodes: tuple[str, ...]) -> int:
            moving = sum(self.route_between(node, nodes[(index + 1) % len(nodes)]).distance_mi for index, node in enumerate(nodes)) / a.moving_speed_mph
            dwell = sum(next(stop.dwell_minutes for stop in self.stops if stop.key == node) for node in nodes) / 60
            return ceil(self.daily_round_trips() * (moving + dwell) / a.service_span_hours / max(1 - a.spare_ratio, 0.01))
        return sum(needed(nodes) for nodes in self.circuits(a.service_pattern))

    def facility_sizing(self, technology: Technology, battery_kwh_per_car: float = 0.0) -> tuple[tuple[FacilityCapacity, ...], float]:
        a = self.assumptions
        events: list[tuple[str, float, float]] = []
        max_gap_kwh = 0.0
        if technology.key == "bemu":
            catenary = next(stop for stop in self.stops if stop.is_catenary)
            for source_nodes in self.energy_circuits(a.service_pattern):
                first_unlimited = next((index for index, key in enumerate(source_nodes)
                                        if (stop := next(item for item in self.stops if item.key == key)).bemu_enabled and not stop.is_catenary), -1)
                catenary_start = source_nodes.index("denver") if catenary.bemu_enabled else -1
                start_index = first_unlimited if first_unlimited >= 0 else catenary_start if catenary_start >= 0 else 0
                nodes = source_nodes[start_index:] + source_nodes[:start_index]
                catenary_events_per_day = 2 * self.daily_round_trips()
                catenary_concurrency = max(1, ceil(catenary_events_per_day * catenary.dwell_minutes / (a.service_span_hours * 60)))
                catenary_battery_kwh_available = catenary.maximum_power_mw * 1000 * catenary.dwell_minutes / 60 / catenary_concurrency * a.charging_efficiency
                deficit_kwh = 0.0
                for index, origin in enumerate(nodes):
                    destination = nodes[(index + 1) % len(nodes)]
                    leg = self.direction_energy(self.route_between(origin, destination), technology, battery_kwh_per_car)
                    uses_catenary = catenary.bemu_enabled and (
                        (origin == catenary.key and destination == "denver")
                        or (origin == "denver" and destination == catenary.key)
                    )
                    if uses_catenary:
                        deficit_before_supply = deficit_kwh + leg.carrier_kwh
                        delivered_kwh = min(deficit_before_supply, catenary_battery_kwh_available)
                        deficit_kwh = deficit_before_supply - delivered_kwh
                        events.append((catenary.key, delivered_kwh / a.charging_efficiency, delivered_kwh))
                    else:
                        deficit_kwh += leg.carrier_kwh
                    max_gap_kwh = max(max_gap_kwh, deficit_kwh)
                    destination_stop = next(stop for stop in self.stops if stop.key == destination)
                    if destination_stop.bemu_enabled and not destination_stop.is_catenary:
                        events.append((destination_stop.key, deficit_kwh / a.charging_efficiency, deficit_kwh))
                        deficit_kwh = 0.0
        else:
            for nodes in self.circuits(a.service_pattern):
                legs = [self.direction_energy(self.route_between(node, nodes[(index + 1) % len(nodes)]), technology, battery_kwh_per_car) for index, node in enumerate(nodes)]
                facility_indexes = [index for index, key in enumerate(nodes) if next(stop for stop in self.stops if stop.key == key).hydrogen_enabled]
                if not facility_indexes:
                    max_gap_kwh = max(max_gap_kwh, sum(leg.carrier_kwh for leg in legs))
                    continue
                for position, current in enumerate(facility_indexes):
                    previous = facility_indexes[position - 1]
                    index = previous
                    carrier_kwh = carrier_units = 0.0
                    while True:
                        carrier_kwh += legs[index].carrier_kwh
                        carrier_units += legs[index].carrier_units
                        index = (index + 1) % len(nodes)
                        if index == current:
                            break
                    max_gap_kwh = max(max_gap_kwh, carrier_kwh)
                    events.append((nodes[current], carrier_kwh, carrier_units))

        active_stop_keys = {key for nodes in (self.energy_circuits(a.service_pattern) if technology.key == "bemu" else self.circuits(a.service_pattern)) for key in nodes}
        facilities: list[FacilityCapacity] = []
        for stop in (item for item in self.stops if item.key in active_stop_keys and (item.bemu_enabled if technology.key == "bemu" else item.hydrogen_enabled)):
            site_events = [event for event in events if event[0] == stop.key]
            events_per_day = len(site_events) * self.daily_round_trips()
            concurrency = max(1, ceil(events_per_day * stop.dwell_minutes / (a.service_span_hours * 60)))
            max_kwh = max((event[1] for event in site_events), default=0)
            max_units = max((event[2] for event in site_events), default=0)
            if technology.key == "bemu":
                kw = max_kwh / max(stop.dwell_minutes / 60, 1 / 60) * concurrency
                maximum_power_kw = stop.maximum_power_mw * 1000 if stop.is_catenary else None
                actual_peak_kw = min(kw, maximum_power_kw) if maximum_power_kw is not None else kw
                billed_peak_kw = actual_peak_kw * (1 - min(1, max(0, stop.peak_demand_attenuation_fraction)))
                capital = 0.0 if stop.is_catenary else actual_peak_kw * (a.grid_upgrade_usd_per_kw + a.charger_equipment_usd_per_kw) / 1e6
                annual_energy_kwh = sum(event[1] for event in site_events) * self.daily_round_trips() * a.service_days_per_year
                facilities.append(FacilityCapacity(
                    stop.key, stop.name, stop.dwell_minutes, actual_peak_kw, "kW", actual_peak_kw, "kW", capital,
                    annual_energy_kwh, stop.electricity_energy_usd_per_kwh, stop.electricity_demand_usd_per_kw_month,
                    billed_peak_kw, maximum_power_kw, stop.is_catenary,
                ))
            else:
                kg_day = sum(event[2] for event in site_events) * self.daily_round_trips()
                kg_hour = max_units / max(stop.dwell_minutes / 60, 1 / 60) * concurrency
                capital = (kg_day * a.hydrogen_supply_usd_per_kg_day + kg_hour * a.hydrogen_dispenser_usd_per_kg_hour) / 1e6
                facilities.append(FacilityCapacity(stop.key, stop.name, stop.dwell_minutes, kg_day, "kg/day", kg_hour, "kg/hour", capital, 0, 0, 0, 0, None, False))
        return tuple(facilities), max_gap_kwh

    def required_battery_kwh_per_car(self, technology: Technology) -> float:
        """Solve installed capacity including the mass-energy feedback of the battery."""
        a = self.assumptions
        estimate = 0.0
        for _ in range(50):
            required_usable = self.facility_sizing(technology, estimate)[1]
            next_estimate = required_usable / max(1 - a.battery_reserve_fraction, 0.01) / a.cars
            if abs(next_estimate - estimate) < 0.01:
                return next_estimate
            estimate = min(next_estimate, 10000)
        return estimate

    def catenary_peak_demand_kw(self, route: Route, technology: Technology) -> float:
        a = self.assumptions
        peak_per_train_kw = max(
            self.direction_energy(Route(route.key, route.name, (segment,)), technology).carrier_kwh
            / max(segment.distance_mi / a.moving_speed_mph, 1 / 60)
            for segment in route.segments
        )
        moving_train_hours = self.daily_round_trips() * 2 * route.distance_mi / a.moving_speed_mph
        concurrent_trains = max(1, min(a.total_trains, ceil(moving_train_hours / a.service_span_hours)))
        return peak_per_train_kw * concurrent_trains

    def outcome(self, technology: Technology) -> TechnologyOutcome:
        a = self.assumptions
        route = self.service_route()
        required_per_car = self.required_battery_kwh_per_car(technology) if technology.key == "bemu" else None
        battery_kwh_per_car = required_per_car or 0.0
        outbound = self.direction_energy(route, technology, battery_kwh_per_car)
        inbound = self.direction_energy(route.reversed(), technology, battery_kwh_per_car)
        annual_round_trips = self.daily_round_trips() * a.service_days_per_year
        traction_annual_units = (outbound.carrier_units + inbound.carrier_units) * annual_round_trips
        train_miles = 2 * route.distance_mi * annual_round_trips
        if technology.key in ("bemu", "hydrogen"):
            facilities, max_gap = self.facility_sizing(technology, battery_kwh_per_car)
            infrastructure = sum(item.capital_musd for item in facilities)
        else:
            facilities = ()
            max_gap = max(outbound.carrier_kwh, inbound.carrier_kwh)
            infrastructure = technology.fixed_infrastructure_musd + route.distance_mi * technology.infrastructure_musd_per_route_mile
        installed = a.cars * battery_kwh_per_car if technology.key == "bemu" else 0.0
        battery_capital = a.total_trains * installed * a.battery_cost_usd_per_kwh / 1e6 if technology.key == "bemu" else 0.0
        base_vehicle_capital = a.total_trains * (technology.fixed_vehicle_cost_musd + a.cars * technology.vehicle_cost_musd_per_car)
        vehicle_capital = base_vehicle_capital + battery_capital
        initial_capital = vehicle_capital + infrastructure
        is_electric = technology.key in ("bemu", "catenary")
        annual_units = sum(item.annual_energy_kwh for item in facilities) if technology.key == "bemu" else traction_annual_units
        energy_charge = (
            sum(item.annual_energy_kwh * item.energy_rate_usd_per_kwh for item in facilities) / 1e6
            if technology.key == "bemu" else annual_units * technology.carrier_cost_per_unit / 1e6
        )
        unattenuated_peak_demand_kw = (
            sum(item.peak_rate for item in facilities) if technology.key == "bemu"
            else self.catenary_peak_demand_kw(route, technology) if technology.key == "catenary"
            else 0.0
        )
        billed_peak_demand_kw = (
            sum(item.billed_peak_kw for item in facilities) if technology.key == "bemu"
            else unattenuated_peak_demand_kw * (1 - min(1, max(0, technology.peak_demand_attenuation_fraction))) if technology.key == "catenary"
            else 0.0
        )
        demand_charge = (
            sum(item.billed_peak_kw * item.demand_rate_usd_per_kw_month * 12 for item in facilities) / 1e6
            if technology.key == "bemu" else billed_peak_demand_kw * technology.electricity_demand_usd_per_kw_month * 12 / 1e6
            if technology.key == "catenary" else 0.0
        )
        energy_cost = energy_charge + demand_charge
        vehicle_maintenance = train_miles * technology.maintenance_usd_per_train_mile / 1e6
        infrastructure_maintenance = infrastructure * technology.infrastructure_maintenance_rate
        maintenance = vehicle_maintenance + infrastructure_maintenance
        annual_operating = energy_cost + maintenance
        af = self._annuity_factor(a.real_discount_rate, a.analysis_years)
        npv = initial_capital + annual_operating * af
        replacement_npv = 0.0
        if technology.replacement_interval_years:
            replacement = battery_capital if technology.key == "bemu" else vehicle_capital * technology.replacement_share_of_vehicle_cost
            for year in range(technology.replacement_interval_years, a.analysis_years, technology.replacement_interval_years):
                replacement_npv += replacement / (1 + a.real_discount_rate) ** year
            npv += replacement_npv
        eac = npv / af
        usable = installed * (1 - a.battery_reserve_fraction)
        required_installed = required_per_car * a.cars if required_per_car is not None else None
        required = self.required_fleet()
        cost_components = tuple(sorted((component for component in (
            CostComponent("base-vehicles", "Base vehicle capital", base_vehicle_capital / af),
            CostComponent("battery", "Battery pack capital", battery_capital / af),
            CostComponent("infrastructure", "Infrastructure capital", infrastructure / af),
            CostComponent("energy", "Electricity energy" if is_electric else "Energy", energy_charge),
            CostComponent("demand", "Electricity demand charges", demand_charge),
            CostComponent("vehicle-maintenance", "Vehicle maintenance", vehicle_maintenance),
            CostComponent("infrastructure-maintenance", "Infrastructure maintenance", infrastructure_maintenance),
            CostComponent("replacements", "Scheduled replacements", replacement_npv / af),
        ) if component.equivalent_annual_musd > 1e-9), key=lambda component: component.equivalent_annual_musd, reverse=True))
        return TechnologyOutcome(
            technology=technology.key, fleet_size=a.total_trains, required_fleet_size=required,
            fleet_sufficient=a.total_trains >= required, initial_capital_musd=initial_capital,
            infrastructure_capital_musd=infrastructure, annual_energy_charge_musd=energy_charge,
            annual_demand_charge_musd=demand_charge, annual_operating_musd=annual_operating,
            lifecycle_npv_musd=npv, equivalent_annual_cost_musd=eac,
            cost_per_passenger_mile_usd=eac * 1e6 / (train_miles * a.cars * a.seats_per_car * a.load_factor),
            annual_emissions_tonnes=annual_units * technology.emissions_kg_per_unit / 1000,
            annual_carrier_units=annual_units, max_directional_carrier_kwh=max_gap,
            installed_battery_kwh=installed if technology.key == "bemu" else None,
            usable_battery_kwh=usable if technology.key == "bemu" else None,
            required_battery_kwh_per_car=required_per_car,
            required_installed_battery_kwh=required_installed,
            battery_mass_tonnes=installed * a.battery_specific_mass_kg_per_kwh / 1000 if technology.key == "bemu" else None,
            battery_capital_musd=battery_capital if technology.key == "bemu" else None,
            indicative_charger_mw=sum(item.peak_rate for item in facilities) / 1000 if technology.key == "bemu" else None,
            unattenuated_peak_demand_kw=unattenuated_peak_demand_kw,
            billed_peak_demand_kw=billed_peak_demand_kw,
            facility_capacities=facilities,
            cost_components=cost_components,
        )

    def cost_range(self, technology: Technology, assumption_bands: dict[str, tuple[float, float]], technology_bands: dict[str, tuple[float, float]]) -> CostRange:
        variables = [("a", name, low, high, getattr(self.assumptions, name)) for name, (low, high) in assumption_bands.items()]
        variables += [("t", name, low, high, getattr(technology, name)) for name, (low, high) in technology_bands.items()]
        def evaluate(values: dict[tuple[str, str], float]) -> float:
            a = replace(self.assumptions, **{name: value for (kind, name), value in values.items() if kind == "a"})
            t = replace(technology, **{name: value for (kind, name), value in values.items() if kind == "t"})
            return DecisionModel(a, self.stops).outcome(t).equivalent_annual_cost_musd
        base_values = {(kind, name): base for kind, name, _, _, base in variables}
        corners = [base_values, {(kind, name): low for kind, name, low, _, _ in variables}, {(kind, name): high for kind, name, _, high, _ in variables}]
        def optimize(goal: str, start: dict[tuple[str, str], float]) -> float:
            current = dict(start)
            for _ in range(3):
                for kind, name, low, high, base in variables:
                    key = (kind, name)
                    choices = [(evaluate({**current, key: value}), value) for value in (low, base, high)]
                    current[key] = (min if goal == "min" else max)(choices)[1]
            return evaluate(current)
        base = self.outcome(technology).equivalent_annual_cost_musd
        if not variables:
            return CostRange(technology.key, base, base, base)
        return CostRange(technology.key, min(optimize("min", item) for item in corners), base, max(optimize("max", item) for item in corners))

    @staticmethod
    def _annuity_factor(rate: float, years: int) -> float:
        return float(years) if rate == 0 else (1 - (1 + rate) ** -years) / rate
