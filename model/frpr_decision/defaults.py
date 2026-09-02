"""Illustrative starter/full routes, stops, and technology defaults."""

from .types import Route, Segment, ServiceStop, Technology

FULL_ROUTE = Route("full", "Fort Collins — Pueblo", (
    Segment("Fort Collins–Loveland", 15, -21, 17, 14),
    Segment("Loveland–Longmont", 18, -3, 22, 22),
    Segment("Longmont–Boulder", 8, 350, 14, 15),
    Segment("Boulder–Louisville", 5, -75, 15, 14),
    Segment("Louisville–Broomfield", 5, 166, 10, 11),
    Segment("Broomfield–Westminster", 6, -40, 14, 13),
    Segment("Westminster–Denver", 8, -183, 16, 19),
    Segment("Denver–Littleton", 10, 165, 15, 15),
    Segment("Littleton–Castle Pines", 15, 647, 25, 25),
    Segment("Castle Pines–Castle Rock", 5, 215, 10, 10),
    Segment("Castle Rock–Monument", 20, 733, 30, 30),
    Segment("Monument–Colorado Springs", 20, -922, 30, 30),
    Segment("Colorado Springs–Fountain", 15, -488, 20, 20),
    Segment("Fountain–Pueblo", 35, -855, 50, 50),
))

STARTER_ROUTE = Route("starter", "Fort Collins — Denver", FULL_ROUTE.segments[:7])

DEFAULT_STOPS = (
    ServiceStop("fort-collins", "Fort Collins", 0, 30, True, True, False, 0, 0.09, 15, 0.50),
    ServiceStop("denver-westminster-catenary", "Castle Pines–Westminster catenary", 57, 0, True, False, True, 5, 0.01, 0, 0),
    ServiceStop("denver", "Denver", 65, 20, True, True, False, 0, 0.09, 15, 0.50),
    ServiceStop("colorado-springs", "Colorado Springs", 135, 10, False, False, False, 0, 0.09, 15, 0.50),
    ServiceStop("pueblo", "Pueblo", 185, 30, True, True, False, 0, 0.09, 15, 0.50),
)

TECHNOLOGIES = {
    "diesel": Technology("diesel", "Diesel locomotive", "gal", 40.7, 3.8, 12, 0.3, 0, 5, 0.75, 2, 0, 9, 0.03),
    "bemu": Technology("bemu", "Battery electric", "kWh", 1, 0.09, 0.473, 0.81, 0.7, 5, 0.75, 0, 0, 5.5, 0.03, 8, 0.2),
    "catenary": Technology("catenary", "Catenary electric", "kWh", 1, 0.09, 0.473, 0.88, 0.85, 5, 0.75, 8, 4.5, 4.8, 0.02, 0, 0, 15, 0.50),
    "hydrogen": Technology("hydrogen", "Hydrogen fuel cell", "kg", 33.3, 7, 1, 0.48, 0.6, 5, 0.75, 0, 0, 7, 0.04, 10, 0.15),
}
