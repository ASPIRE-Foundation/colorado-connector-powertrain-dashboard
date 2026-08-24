from dataclasses import replace

import pytest

from frpr_decision.defaults import DEFAULT_STOPS, FULL_ROUTE, TECHNOLOGIES
from frpr_decision.pipeline import DecisionModel
from frpr_decision.types import Assumptions, Route, Segment


class TestDecisionModel:
    def setup_method(self):
        self.assumptions = Assumptions()
        self.model = DecisionModel(self.assumptions)

    def test_reverse_direction_changes_grade_sign(self):
        uphill = Route("test", "Test", (Segment("A-B", 10, 1000),))
        up = self.model.direction_energy(uphill, TECHNOLOGIES["bemu"])
        down = self.model.direction_energy(uphill.reversed(), TECHNOLOGIES["bemu"])
        assert up.carrier_kwh > down.carrier_kwh

    def test_battery_specific_mass_increases_bemu_energy_only(self):
        light = DecisionModel(replace(self.assumptions, battery_specific_mass_kg_per_kwh=0))
        heavy = DecisionModel(replace(self.assumptions, battery_specific_mass_kg_per_kwh=8))
        assert heavy.direction_energy(FULL_ROUTE, TECHNOLOGIES["bemu"], 300).carrier_kwh > light.direction_energy(FULL_ROUTE, TECHNOLOGIES["bemu"], 300).carrier_kwh
        assert heavy.direction_energy(FULL_ROUTE, TECHNOLOGIES["diesel"]).carrier_kwh == pytest.approx(light.direction_energy(FULL_ROUTE, TECHNOLOGIES["diesel"]).carrier_kwh)

    def test_circuits_scale_annual_use(self):
        low = DecisionModel(replace(self.assumptions, circuits_per_day=2)).outcome(TECHNOLOGIES["diesel"])
        high = DecisionModel(replace(self.assumptions, circuits_per_day=6)).outcome(TECHNOLOGIES["diesel"])
        assert high.annual_carrier_units == pytest.approx(low.annual_carrier_units * 3)

    def test_specified_fleet_changes_capital_not_service(self):
        small = DecisionModel(replace(self.assumptions, total_trains=8)).outcome(TECHNOLOGIES["diesel"])
        large = DecisionModel(replace(self.assumptions, total_trains=16)).outcome(TECHNOLOGIES["diesel"])
        assert large.initial_capital_musd > small.initial_capital_musd
        assert large.annual_carrier_units == pytest.approx(small.annual_carrier_units)

    def test_default_base_vehicle_costs_are_equal_across_powertrains(self):
        fixed = {technology.fixed_vehicle_cost_musd for technology in TECHNOLOGIES.values()}
        per_car = {technology.vehicle_cost_musd_per_car for technology in TECHNOLOGIES.values()}
        assert fixed == {5.0}
        assert per_car == {0.75}

    def test_dedicated_pattern_has_integer_fleet_penalty(self):
        through = DecisionModel(replace(self.assumptions, service_pattern="through")).outcome(TECHNOLOGIES["diesel"])
        dedicated = DecisionModel(replace(self.assumptions, service_pattern="dedicated")).outcome(TECHNOLOGIES["diesel"])
        assert dedicated.required_fleet_size >= through.required_fleet_size

    def test_zero_discount_rate_uses_straight_line_annualization(self):
        outcome = DecisionModel(replace(self.assumptions, real_discount_rate=0)).outcome(TECHNOLOGIES["diesel"])
        assert outcome.equivalent_annual_cost_musd == pytest.approx(outcome.lifecycle_npv_musd / self.assumptions.analysis_years)

    def test_battery_reserve_increases_calculated_capacity(self):
        low = DecisionModel(replace(self.assumptions, battery_reserve_fraction=0.1)).outcome(TECHNOLOGIES["bemu"])
        high = DecisionModel(replace(self.assumptions, battery_reserve_fraction=0.3)).outcome(TECHNOLOGIES["bemu"])
        assert high.required_battery_kwh_per_car > low.required_battery_kwh_per_car

    def test_minimum_battery_solver_includes_its_own_mass(self):
        indicated = self.model.outcome(TECHNOLOGIES["bemu"])
        assert indicated.required_battery_kwh_per_car > 0
        assert indicated.usable_battery_kwh == pytest.approx(indicated.max_directional_carrier_kwh, abs=0.2)

    def test_battery_cost_is_separate_from_non_battery_car_cost(self):
        low = DecisionModel(replace(self.assumptions, battery_cost_usd_per_kwh=100)).outcome(TECHNOLOGIES["bemu"])
        high = DecisionModel(replace(self.assumptions, battery_cost_usd_per_kwh=600)).outcome(TECHNOLOGIES["bemu"])
        assert high.required_battery_kwh_per_car == pytest.approx(low.required_battery_kwh_per_car)
        assert high.initial_capital_musd > low.initial_capital_musd
        assert high.battery_capital_musd > low.battery_capital_musd

    def test_more_charging_locations_reduce_indicated_battery(self):
        base = self.model.outcome(TECHNOLOGIES["bemu"])
        extra_stop = tuple(replace(stop, bemu_enabled=True) if stop.key == "colorado-springs" else stop for stop in DEFAULT_STOPS)
        distributed = DecisionModel(self.assumptions, extra_stop).outcome(TECHNOLOGIES["bemu"])
        assert distributed.required_battery_kwh_per_car < base.required_battery_kwh_per_car

    def test_stop_configuration_sizes_infrastructure(self):
        base = self.model.outcome(TECHNOLOGIES["bemu"])
        extra_stop = tuple(replace(stop, bemu_enabled=True) if stop.key == "colorado-springs" else stop for stop in DEFAULT_STOPS)
        distributed = DecisionModel(self.assumptions, extra_stop).outcome(TECHNOLOGIES["bemu"])
        assert base.infrastructure_capital_musd > 0
        assert all(site.capacity > 0 for site in base.facility_capacities)
        assert distributed.max_directional_carrier_kwh < base.max_directional_carrier_kwh

    def test_cost_range_contains_base(self):
        result = self.model.cost_range(TECHNOLOGIES["catenary"], {"real_discount_rate": (0.02, 0.07)}, {"infrastructure_musd_per_route_mile": (2.5, 7.0)})
        assert result.low_musd_per_year < result.base_musd_per_year < result.high_musd_per_year

    @pytest.mark.parametrize("technology_key", TECHNOLOGIES)
    def test_cost_components_are_sorted_and_sum_to_eac(self, technology_key):
        outcome = self.model.outcome(TECHNOLOGIES[technology_key])
        values = [component.equivalent_annual_musd for component in outcome.cost_components]
        assert values == sorted(values, reverse=True)
        assert sum(values) == pytest.approx(outcome.equivalent_annual_cost_musd)
