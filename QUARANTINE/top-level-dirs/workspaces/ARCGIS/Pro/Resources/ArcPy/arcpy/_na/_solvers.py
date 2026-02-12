"""Module to work with various Network Analyst Solvers."""

from enum import IntEnum
from arcgisscripting import na as cna    # False positive. pylint:disable=no-name-in-module
# Raised when loading more than the expected number of features into an input data type for a given analysis.
LimitError = cna.LimitError  # pylint:disable=invalid-name
DirectionsError = cna.DirectionsError  # pylint:disable=invalid-name
VrpResultError = cna.VrpResultError  # pylint:disable=invalid-name
InputDataError = cna.InputDataError  # pylint:disable=invalid-name

# List of names exported from this module
__all__ = ["MessageSeverity", "TimeZoneUsage", "TravelDirection", "TimeUnits", "DistanceUnits", "DirectionsStyle",
           "RouteShapeType", "LimitError", "LineShapeType", "Importance", "DirectionsError", "VrpResultError",
           "InputDataError"]


class MessageSeverity(IntEnum):
    """Enumeration for severity level of solver messages."""

    All = 0
    Warning = 1
    Error = 2
    Info = 3


class TimeZoneUsage(IntEnum):
    """Enumeration for specifying time zone for the time of day."""

    LocalTimeAtLocations = 0
    UTC = 1


class TravelDirection(IntEnum):
    """Enumeration to specify the direction of travel to or from the facilities."""

    FromFacility = 0
    ToFacility = 1


class TimeUnits(IntEnum):
    """Enumeration for time units."""

    Seconds = 20  # esriNAUSeconds
    Minutes = 21  # esriNAUMinutes
    Hours = 22  # esriNAUHours
    Days = 23  # esriNAUDays


class DistanceUnits(IntEnum):
    """Enumeration for distance units."""

    Feet = 3  # esriNAUFeet
    Yards = 4  # esriNAUYards
    Miles = 5  # esriNAUMiles
    NauticalMiles = 6  # esriNAUNauticalMiles
    Meters = 9  # esriNAUMeters
    Kilometers = 10  # esriNAUKilometers


class DirectionsStyle(IntEnum):
    """Enumeration for the type of formatting style for directions."""

    Navigation = 0
    Campus = 1
    Desktop = 2


class RouteShapeType(IntEnum):
    """Enumeration for the type of output shape to be generated."""

    NoLine = 0
    StraightLine = 1
    TrueShape = 2
    TrueShapeWithMeasures = 3


class LineShapeType(IntEnum):
    """Enumeration for the shape type of the lines connecting each origin-destination pair."""

    NoLine = 0
    StraightLine = 1


class Importance(IntEnum):
    """Enumeration for specifying the importance for factors that influence analysis results."""

    Low = 0
    Medium = 1
    High = 2
