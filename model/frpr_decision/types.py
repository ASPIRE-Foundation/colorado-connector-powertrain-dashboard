"""Typed inputs and outputs for the Colorado passenger-rail screening model."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Segment:
    name: str
    distance_mi: float
    elevation_change_ft: float
    southbound_minutes: float
    northbound_minutes: float


@dataclass(frozen=True)
class Route:
    key: str
    name: str
    segments: tuple[Segment, ...]

    @property
    def distance_mi(self) -> float:
        return sum(segment.distance_mi for segment in self.segments)

    def reversed(self) -> "Route":
        return Route(f"{self.key}_reverse", f"{self.name} — reverse", tuple(
            Segment(item.name, item.distance_mi, -item.elevation_change_ft,
                    item.northbound_minutes, item.southbound_minutes)
            for item in reversed(self.segments)
        ))


@dataclass(frozen=True)
class ServiceStop:
    key: str
    name: str
    milepost: float
    dwell_minutes: float
    bemu_enabled: bool
    hydrogen_enabled: bool
    is_catenary: bool
    maximum_power_mw: float
    electricity_energy_usd_per_kwh: float
    electricity_demand_usd_per_kw_month: float
    peak_demand_attenuation_fraction: float


@dataclass(frozen=True)
class Technology:
    key: str
    name: str
    carrier_unit: str
    carrier_kwh_per_unit: float
    carrier_cost_per_unit: float
    emissions_kg_per_unit: float
    carrier_to_wheel_efficiency: float
    regenerative_efficiency: float
    fixed_vehicle_cost_musd: float
    vehicle_cost_musd_per_car: float
    fixed_infrastructure_musd: float
    infrastructure_musd_per_route_mile: float
    maintenance_usd_per_train_mile: float
    infrastructure_maintenance_rate: float
    replacement_interval_years: int = 0
    replacement_share_of_vehicle_cost: float = 0.0
    electricity_demand_usd_per_kw_month: float = 0.0
    peak_demand_attenuation_fraction: float = 0.0


@dataclass(frozen=True)
class Assumptions:
    service_pattern: str = "starter"
    total_trains: int = 1
    round_trips_per_train_per_day: int = 3
    cars: int = 8
    seats_per_car: int = 60
    tare_tonnes_per_car: float = 35.0
    load_factor: float = 0.50
    passenger_mass_kg: float = 80.0
    starter_denver_layover_1_minutes: float = 24.0
    starter_denver_layover_2_minutes: float = 222.0
    starter_denver_layover_3_minutes: float = 24.0
    starter_fort_collins_turn_1_minutes: float = 26.0
    starter_fort_collins_turn_2_minutes: float = 16.0
    starter_overnight_minutes: float = 480.0
    full_denver_dwell_minutes: float = 10.0
    full_colorado_springs_dwell_minutes: float = 10.0
    full_pueblo_layover_minutes: float = 30.0
    full_fort_collins_layover_minutes: float = 480.0
    moving_speed_mph: float = 65.0
    crr: float = 0.0017
    air_density_kg_m3: float = 1.02
    drag_area_m2: float = 16.0
    auxiliary_kw_per_car: float = 10.0
    service_days_per_year: int = 340
    service_span_hours: float = 16.0
    spare_ratio: float = 0.20
    analysis_years: int = 30
    real_discount_rate: float = 0.04
    battery_cost_usd_per_kwh: float = 350.0
    battery_specific_mass_kg_per_kwh: float = 6.0
    battery_reserve_fraction: float = 0.20
    charging_efficiency: float = 0.92
    grid_upgrade_usd_per_kw: float = 450.0
    charger_equipment_usd_per_kw: float = 650.0
    hydrogen_supply_usd_per_kg_day: float = 1600.0
    hydrogen_dispenser_usd_per_kg_hour: float = 85000.0


@dataclass(frozen=True)
class DirectionEnergy:
    carrier_units: float
    carrier_kwh: float
    positive_wheel_kwh: float
    recoverable_wheel_kwh: float
    auxiliary_kwh: float


@dataclass(frozen=True)
class FacilityCapacity:
    stop_key: str
    stop_name: str
    dwell_minutes: float
    capacity: float
    capacity_unit: str
    peak_rate: float
    peak_rate_unit: str
    capital_musd: float
    annual_energy_kwh: float
    energy_rate_usd_per_kwh: float
    demand_rate_usd_per_kw_month: float
    billed_peak_kw: float
    maximum_power_kw: float | None
    is_existing_infrastructure: bool


@dataclass(frozen=True)
class CostComponent:
    key: str
    label: str
    equivalent_annual_musd: float


@dataclass(frozen=True)
class TechnologyOutcome:
    technology: str
    fleet_size: int
    required_fleet_size: int
    fleet_sufficient: bool
    initial_capital_musd: float
    infrastructure_capital_musd: float
    annual_energy_charge_musd: float
    annual_demand_charge_musd: float
    annual_operating_musd: float
    lifecycle_npv_musd: float
    equivalent_annual_cost_musd: float
    cost_per_passenger_mile_usd: float
    annual_emissions_tonnes: float
    annual_carrier_units: float
    max_directional_carrier_kwh: float
    installed_battery_kwh: float | None
    usable_battery_kwh: float | None
    required_battery_kwh_per_car: float | None
    required_installed_battery_kwh: float | None
    battery_mass_tonnes: float | None
    battery_capital_musd: float | None
    indicative_charger_mw: float | None
    unattenuated_peak_demand_kw: float
    billed_peak_demand_kw: float
    facility_capacities: tuple[FacilityCapacity, ...]
    cost_components: tuple[CostComponent, ...]


@dataclass(frozen=True)
class CostRange:
    technology: str
    low_musd_per_year: float
    base_musd_per_year: float
    high_musd_per_year: float
