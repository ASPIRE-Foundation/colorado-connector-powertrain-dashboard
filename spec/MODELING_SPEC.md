# FRPR Powertrain Decision Model — MVP Specification

## Purpose

Provide a transparent, responsive planning model that compares the lifecycle cost of
diesel locomotive, battery-electric (BEMU), overhead-catenary electric, and hydrogen
fuel-cell passenger trains. The primary interface is an executive comparison that
recomputes immediately when an assumption changes. Detailed assumptions remain visible
and editable; no input is presented as an established FRPR fact unless it has a source.

The model is intended for option screening and assumption discovery. It is not a
timetable, traction-power, electrical-interconnection, procurement, or engineering
design model.

## Product principles

1. **Unknown means editable and bandable.** Car count, daily round trips, fleet size,
   costs, and operating parameters are assumptions, not embedded facts. Every numeric
   input can carry lower and upper screening estimates around its base value using three
   directly draggable slider handles rather than separate text fields.
2. **One transparent calculation path.** The dashboard and reference model use the same
   conceptual equations and named inputs.
3. **Bidirectional by construction.** Every route is evaluated in both directions before
   annualization.
4. **Lifecycle cost first.** The headline is equivalent annual lifecycle cost, supported
   by NPV, capital, annual operating cost, cost per passenger-mile, energy, and carbon.
5. **Immediate feedback.** The deterministic model must respond to a slider change without
   a server round trip or a precomputed scenario library.
6. **Do not imply precision.** Defaults are explicitly labeled illustrative until sourced.

## MVP user story

An executive selects starter or full service and changes fleet size, round trips per train,
car count, passenger load, speed, asset life, discount rate, fuel and electricity prices,
demand charges, storage attenuation, and technology costs. Any slider can be
expanded into lower/base/upper estimates. The comparison immediately shows which option
has the lowest equivalent annual lifecycle cost, its screening range, and why. The user
can expand assumption groups in a persistent sidebar to inspect or change the full
calculation basis, or load a named preset that explicitly sets both base values and bands.

## Calculation boundary

### Service extents

The route is represented as an ordered list of station-to-station segments with:

- distance;
- elevation change; and
- one stop-to-stop acceleration/braking event.

The reverse direction reverses the segments and elevation signs. Initial Colorado route
data are inherited from the first-cut repository and remain explicitly marked as
placeholder data.

The service-extent choice is:

- **Starter service:** Fort Collins–Denver. The default is one train making three complete
  round trips per day. The attached illustrative schedule contains three southbound and
  three northbound departures, so this is six one-way trips and lets the train start and
  end in Fort Collins.
- **Full service:** Fort Collins–Pueblo. The default is twelve trains, each making one
  full-span round trip per day, with higher round-trip counts available as an assumption.

South-of-Denver segments and facilities are excluded from starter-service energy,
infrastructure, operating, and battery-sizing calculations.

### Train mass and passenger load

```text
tare_mass = cars × tare_mass_per_car
passenger_mass = cars × seats_per_car × load_factor × passenger_mass
battery_mass = cars × battery_kwh_per_car × battery_specific_mass_kg_per_kwh
gross_mass_BEMU = tare_mass + passenger_mass + battery_mass
gross_mass_other = tare_mass + passenger_mass
```

Car count is a scenario input. The MVP supports 2–10 cars and does not assume that the
illustrative eight-car starting value is the FRPR plan.

### Segment energy

For distance `d`, elevation change `dh`, representative moving speed `v`, mass `m`,
rolling coefficient `Crr`, air density `rho`, and drag area `CdA`:

```text
rolling_work = Crr × m × g × d
aero_work = 0.5 × rho × CdA × v² × d
climb_work = m × g × max(dh, 0)
descent_energy_available = m × g × max(-dh, 0)
acceleration_work = 0.5 × m × v²
braking_energy_available = acceleration_work
auxiliary_energy = cars × auxiliary_kw_per_car × segment_time

positive_wheel_energy = rolling + aero + climb + acceleration
recoverable_wheel_energy = descent + braking
carrier_energy = (positive_wheel + auxiliary) / carrier_to_wheel_efficiency
                 - recoverable_wheel × regenerative_efficiency
```

Carrier energy is floored at zero per segment. This intentionally avoids a timestep
driver model. It captures the first-order effects needed for interactive screening while
keeping each term inspectable.

### Annual service and fleet

The user directly specifies total procured trains and round trips per train per day.

```text
fleet_round_trips_per_day = total_trains × round_trips_per_train_per_day
annual_train_miles = 2 × active_route_miles × fleet_round_trips_per_day × service_days
```

Each starter round trip is Fort Collins–Denver–Fort Collins. Each full-service round trip
is Fort Collins–Pueblo–Fort Collins. Because the service rate is per train, increasing the
fleet increases vehicle capital and scheduled operations together.

The specified fleet drives vehicle capital. A separate capacity screen estimates the
minimum fleet needed from moving time, configured stopovers, service span, and spare ratio:

```text
vehicle_hours_per_day = fleet_round_trips_per_day × round_trip_time
required_trainsets = ceil(vehicle_hours_per_day / service_span / (1 - spare_ratio))
```

This screen does not automatically overwrite the user's fleet assumption.

### Stop-configured charging, existing catenary, and fueling infrastructure

The user enables battery charging and hydrogen fueling independently at Fort Collins,
Denver, Colorado Springs, and Pueblo and specifies a stopover at each location. For each
operating round trip, the model sums energy from the preceding enabled facility and derives
the replenishment required per arrival.

An optional existing Denver–Westminster catenary stretch is modeled as an en-route BEMU
energy source. Its defaults are 5 MW maximum connection capacity and 60 minutes connected.
The model applies catenary power to traction while connected and then to any accumulated
battery deficit. Actual draw is the lesser of the energy required and the configured
power-by-time limit; it does not assume the maximum is always delivered. Because the
infrastructure already exists, enabling this source adds no new BEMU charging capital.

```text
concurrent_events = max(1, ceil(arrivals_per_day × stopover / service_span))

BEMU_site_kw = interval_kwh / charging_efficiency / stopover_hours
               × concurrent_events
BEMU_site_capital = site_kw × (grid_upgrade_cost_per_kw
                               + charger_equipment_cost_per_kw)

H2_site_kg_day = sum(kg_per_arrival × arrivals_per_day)
H2_peak_kg_hour = max(kg_per_arrival / stopover_hours) × concurrent_events
H2_site_capital = kg_day × supply_cost_per_kg_day
                  + peak_kg_hour × dispenser_cost_per_kg_hour
```

BEMU and hydrogen infrastructure capital is the sum of calculated site capital; their
former fixed $14M and $30M allowances are removed. Catenary retains fixed and route-mile
infrastructure inputs. These calculations are capacity-screening approximations, not
utility, hydrogen-production, storage, or station engineering designs.

### Electricity tariff and peak attenuation

BEMU electricity rates are specified independently for every enabled charging source.
Each source has a volume rate, demand rate, and peak-attenuation assumption. The existing
Denver–Westminster catenary defaults to $0.01/kWh and $0/kW-month, reflecting the current
screening assumption that BEMU use does not increase the facility's existing peak demand.
The full-corridor catenary powertrain option retains a separate technology-level tariff.

Electricity cost is split into energy and demand charges:

```text
site_energy_charge = site_annual_kwh × site_energy_rate_per_kwh
site_billed_peak_kw = site_actual_peak_kw × (1 - site_storage_attenuation_fraction)
site_demand_charge = site_billed_peak_kw × site_demand_rate_per_kw_month × 12
BEMU_annual_electricity_cost = sum(site_energy_charge + site_demand_charge)
```

For BEMU, energy is allocated to the source that supplies it, and demand charges are
calculated independently before being summed across simplified site meters. For the
full-corridor catenary option, the model calculates
the maximum segment-average carrier kW for one train and multiplies it by an estimated
number of simultaneously moving trains over the service span. This is a tariff-screening
peak, not a traction-power simulation.

Storage attenuation changes billed kW only. The MVP does not yet price storage capital,
round-trip losses, degradation, dispatch constraints, or energy arbitrage; therefore a
high attenuation assumption should not be interpreted as a free optimized storage design.

### Lifecycle cost

All values are real dollars. General inflation is excluded.

```text
initial_capital = specified_fleet × (fixed_vehicle_cost + cars × vehicle_cost_per_car)
                  + BEMU_fleet_installed_kwh × battery_cost_per_kwh
                  + fixed_infrastructure_cost
                  + route_miles × infrastructure_cost_per_mile

annual_operating_cost = energy_cost
                        + train_miles × vehicle_maintenance_cost_per_mile
                        + infrastructure_capital × infrastructure_maintenance_rate

NPV = initial_capital
      + PV(annual_operating_cost over analysis life)
      + PV(midlife technology replacements)

equivalent_annual_cost = NPV × capital_recovery_factor
```

Replacement timing is technology-specific. The BEMU battery pack capital is replaced at
the battery interval; other technologies retain a replacement share of vehicle capital.

The illustrative default `fixed_vehicle_cost` is $5M per train and
`vehicle_cost_per_car` is $0.75M per car for every powertrain. These represent a common
base platform; BEMU batteries are added separately. Starter-schedule and capital-stress presets
apply identical base-vehicle bands to all four technologies.

For display, lifecycle NPV is decomposed into mutually exclusive equivalent-annual
components:

```text
base vehicle capital / annuity factor
battery pack capital / annuity factor
infrastructure capital / annuity factor
annual energy
annual demand charges
annual vehicle maintenance
annual infrastructure maintenance
replacement NPV / annuity factor
```

Their sum must equal the headline equivalent annual lifecycle cost.

For electric technologies, annual energy and demand charges are displayed separately.

### Passenger and carbon metrics

Passenger-miles use seats × load factor, not available seat-miles. Annual carbon uses a
technology-specific carrier emissions factor. Grid electricity and hydrogen production
pathways are separate assumptions.

### Deterministic assumption bands

Bands are not probability distributions or confidence intervals. For each technology,
the model performs a bounded coordinate search over every enabled lower/base/upper input.
It starts from the base case, the all-low corner, and the all-high corner, then iterates
through the variables to find the lowest and highest lifecycle-cost outcomes. This keeps
interaction effects, site-capacity changes, and integer operating screens while remaining fast enough to run on
every input change. The unified chart labels the result a **screening envelope**.

The envelope is technology-specific: each option is allowed to reach its own low- and
high-cost combination within the selected bands. It supports risk screening, not a claim
that all technologies experience one internally consistent future scenario.

### Deterministic BEMU sizing

The MVP reports:

- maximum energy interval between enabled charging sites;
- usable onboard battery after reserve;
- capacity at every enabled charging site; and
- battery mass and fleet-wide battery pack capital.

Onboard capacity is derived from the charging configuration rather than entered as an
independent assumption. The model deterministically solves a self-consistent installed
capacity per car:

```text
guess battery kWh/car
→ add battery mass using kg/kWh
→ recalculate segment and facility-interval energy
→ add reserve and divide by cars
→ repeat until installed capacity changes by less than 0.01 kWh/car
```

The dashboard displays calculated capacity per car, train-level installed and usable
capacity, longest-interval energy, battery mass, battery pack capital, and charging
infrastructure capital. Enabled facility locations affect onboard capacity; stopover
duration affects the charging power needed to replenish it.

The facility-interval calculation is cyclic. When no conventional station charger is
enabled, the model begins immediately after an existing-catenary energy event and carries
the battery deficit through the complete circuit before returning to that same event. It
must not silently restore the battery at the nominal service origin. This prevents disabling
a charger from appearing to reduce required capacity because of an unmodeled circuit-boundary
recharge.

Battery pack cost is a separate `battery_cost_usd_per_kwh` assumption. For BEMU, the
vehicle-per-car input is explicitly the non-battery vehicle cost, preventing battery
capital from being embedded in both terms.

These are screening outputs only. Battery temperature, degradation, power limits,
utility interconnection, detailed charger concurrency, and timetable recovery require later
modules.

## Dashboard information architecture

### First viewport

- Sticky assumptions sidebar with collapsible control groups
- One-click, fully specified preset scenarios
- Four-technology equivalent annual cost comparison
- Unified low/base/high lifecycle-cost range chart on a shared axis
- Lowest-cost option and difference from the next option
- Per-technology NPV, capital, operating cost, passenger-mile cost, and carbon
- Clear `Illustrative assumptions` status

### Expandable assumption suite

- Service extent, per-train round trips, and fleet
- Train and energy
- Charging and fueling unit costs
- Charging and fueling locations, the existing catenary source, and connection times
- Financial
- Fuel, station-specific electricity tariffs, storage attenuation, and emissions
- Technology capital and maintenance

Each assumption should ultimately carry units, source, source date, and confidence rating.
The MVP provides editable base and lower/upper values and labels their status.

### Preset scenarios

Each preset is a transparent input bundle, not a precomputed result. Applying one first
restores the illustrative defaults, then applies the preset's service/technology
base positions and exact uncertainty bands. A subsequent manual edit clears the loaded
preset indicator so the UI does not imply that the original bundle is unchanged.

The MVP includes starter schedule, full-service screening, capital-cost stress, and
energy-price volatility presets. These are illustrative analytical lenses rather than
forecasts or adopted FRPR scenarios.

### Explanatory detail

- Cost composition bars
- Click-to-expand, magnitude-sorted equivalent-annual cost components for each powertrain
- Energy composition and BEMU feasibility summary
- Per-site BEMU kW and hydrogen kg/day / kg/hour capacity
- Representative-train-day BEMU waterfall showing every traction draw, station charge,
  catenary delivery, average charging kW, and the resulting onboard usable energy
- Plain-language model boundary and equation notes

## Explicit non-goals for the MVP

- Monte Carlo or precomputed model-output libraries
- Detailed speed profiles or traction-power simulation
- Detailed electrical network, storage sizing, and tariff optimization
- Timetable conflict resolution
- Fleet maintenance scheduling
- Construction phasing and financing during construction
- Claims that default values represent an adopted FRPR plan

## Acceptance criteria

1. Dragging any displayed base, lower, or upper slider handle recomputes all technology outcomes immediately.
2. Both travel directions contribute equally to annual results.
3. Changing car count changes mass, capacity, auxiliary load, energy, and vehicle cost.
4. Changing round trips per train or total trains changes annual energy, maintenance,
   carbon, facility sizing, and the fleet sufficiency screen.
5. The primary ranking uses equivalent annual lifecycle cost, not energy OPEX alone.
6. Passenger-normalized metrics use modeled passengers rather than seats.
7. BEMU reserve is modeled as an unavailable fraction of installed capacity.
8. Battery specific mass changes BEMU mass and energy without changing other technologies.
9. BEMU and hydrogen fixed infrastructure allowances are zero; enabled-stop capacity and
   unit-cost assumptions determine infrastructure capital.
10. The BEMU capacity calculation converges with its own battery-mass feedback,
    and adding a charging location can reduce the indicated onboard capacity.
11. Battery pack $/kWh changes BEMU capital cost without changing calculated capacity,
    and BEMU cost per car excludes the battery pack.
12. Reference tests cover bidirectional grade symmetry, battery mass, round-trip scaling,
   fleet/service coupling, service extent, lifecycle discounting, BEMU reserve,
   facility sizing, and cost envelopes.
13. Loading a preset deterministically replaces all prior inputs and bands; manual edits
   visibly leave the loaded-preset state.
14. Default per-train and per-car base vehicle costs are identical for all powertrains.
15. Expanded cost components are sorted by magnitude and sum to the displayed equivalent
    annual lifecycle cost.
16. Starter service defaults to one train making three complete Fort Collins–Denver round
    trips and excludes south-of-Denver route and facility costs.
17. Every BEMU electricity source has separate energy, demand, and attenuation inputs;
    storage attenuation reduces billed peak without changing annual kWh.
18. The optional Denver–Westminster catenary supplies no more than its configured MW-by-time
    limit, reports actual rather than maximum draw, and defaults to $0.01/kWh with no demand
    charge or new infrastructure capital.
19. Disabling a charging location cannot reduce indicated battery capacity by implicitly
    resetting the battery at a circuit boundary; the train-day waterfall exposes the same
    energy accounting used by the battery-sizing calculation.

## Recommended next increments

1. Replace placeholder routes with alignment-derived distance, elevation, speed-limit,
   and station data.
2. Add an assumption registry with citations and confidence grades.
3. Calibrate the simplified energy equation against measured train data and the existing
   timestep model over multiple duty cycles.
4. Replace illustrative presets with sourced, internally consistent planning cases and
   add break-even solvers before considering Monte Carlo analysis.
5. Add timetable, charger-concurrency, utility-tariff, and replacement/degradation modules.
