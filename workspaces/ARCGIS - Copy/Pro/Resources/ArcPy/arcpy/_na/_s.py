"""Module for working with Scripting."""

from enum import IntEnum
from arcgisscripting import na as cna  # pylint:disable=no-name-in-module

# List of names exported from this module
__all__ = ["TraversedElementType", "DirectionsFieldMapping", "CurbApproach", "DrivingSide", "LandmarkSide", "ReferenceLandmarkType", "DirectionPointType", "DirectionPoint", "DirectionsName", "DirectionsCustomizer", "TraversedJunction", "TraversedEdge", "TraversedElement", "TraversedTurn", "DirectionsQuery", "AdjacentEdge", "SpatialLandmark", "ReferenceLandmark", "NameClass"]

JunctionCode = 1 << 16
EdgeCode = 1 << 17
TurnCode = 1 << 18

class TraversedElementType(IntEnum):
    # fall back type
    Unknown = 0,

    # basic network elements
    Junction = JunctionCode,
    Edge = EdgeCode,
    Turn = TurnCode,

    # edges (streets)
    Road = EdgeCode + 1,
    HighwayRoad = EdgeCode + 2,
    Ramp = EdgeCode + 3,
    Ferry = EdgeCode + 4,
    RoundaboutRoad = EdgeCode + 5,
    MajorRoad = EdgeCode + 6,

    # edges (campus)
    Walkway = EdgeCode + 10,
    TurningArc = EdgeCode + 11,
    Stairs = EdgeCode + 12,
    Escalator = EdgeCode + 13,
    Elevator = EdgeCode + 14,
    PedestrianRamp = EdgeCode + 15,
    MovingWalkway = EdgeCode + 16,
    Hallway = EdgeCode + 17,
    Indoor = EdgeCode + 18,

    # edges (transit)
    Transit = EdgeCode + 64,

    # edges (maritime)
    SailingLine = EdgeCode + 128,

    # junctions
    Stop = JunctionCode + 100,
    Waypoint = JunctionCode + 101,
    RestBreak = JunctionCode + 102,
    RoadIntersection = JunctionCode + 103,

class CurbApproach(IntEnum):
    Unknown = -1,
    EitherSide = 0,
    RightSide = 1,
    LeftSide = 2,
    NoUTurn = 3

class DrivingSide(IntEnum):
    Unknown = 0,
    RightSide = 1,
    LeftSide = 2

class LandmarkSide(IntEnum):
    Unknown = -1
    Both = 0,
    Left = 1,
    Right = 2

class ReferenceLandmarkType(IntEnum):
    Turn = 0,
    Confirmation = 1,
    StopSign = 2,
    TrafficLight = 3,
    RailwayCrossing = 4

class NameClass(IntEnum):
    Unknown = -1
    StreetName = 0,
    RouteNumber = 1

class DirectionPointType(IntEnum):
    Unknown = 0,
    Header = 1,
    ManeuverArrive = 50,
    ManeuverDepart = 51,
    ManeuverStraight = 52,
    ManeuverFerryOn = 100,
    ManeuverFerryOff = 101,
    ManeuverForkCentral = 102,
    ManeuverRoundabout = 103,
    ManeuverUTurn = 104,
    ManeuverDoor = 150,
    ManeuverStairs = 151,
    ManeuverElevator = 152,
    ManeuverEscalator = 153,
    ManeuverPedestrianRamp = 154,
    ManeuverForkLeft = 200,
    ManeuverRampLeft = 201,
    ManeuverRoundaboutLeft = 202,
    ManeuverUTurnLeft = 203,
    ManeuverBearLeft = 204,
    ManeuverTurnLeft = 205,
    ManeuverSharpLeft = 206,
    ManeuverTurnLeftLeft = 207,
    ManeuverTurnLeftRight = 208,
    ManeuverForkRight = 300,
    ManeuverRampRight = 301,
    ManeuverRoundaboutRight = 302,
    ManeuverUTurnRight = 303,
    ManeuverBearRight = 304,
    ManeuverTurnRight = 305,
    ManeuverSharpRight = 306,
    ManeuverTurnRightLeft = 307,
    ManeuverTurnRightRight = 308,
    ManeuverElevatorUp = 400,
    ManeuverEscalatorUp = 401,
    ManeuverStairsUp = 402,
    ManeuverElevatorDown = 500,
    ManeuverEscalatorDown = 501,
    ManeuverStairsDown = 502,
    Event = 1000,
    EventLandmark = 1001,
    EventTimeZone = 1002,
    EventTraffic = 1003,
    EventBarrier = 1004,
    EventBoundary = 1005,
    EventRestrictionViolation = 1006

class DirectionsFieldMapping(IntEnum):
    FullName = 0
    BaseName = 1
    PrefixType = 2
    SuffixType = 3
    HighwayDirection = 4
    PrefixDirection = 5
    SuffixDirection = 6
    Phrase = 7
    Language = 8
    NameClass = 9

DirectionPoint = cna.DirectionPoint
DirectionsName = cna.DirectionsName
DirectionsCustomizer = cna.DirectionsCustomizer
TraversedElement = cna.TraversedElement
TraversedJunction = cna.TraversedJunction
TraversedEdge = cna.TraversedEdge
TraversedTurn = cna.TraversedTurn
AdjacentEdge = cna.AdjacentEdge
SpatialLandmark = cna.SpatialLandmark
ReferenceLandmark = cna.ReferenceLandmark
DirectionsQuery = cna.DirectionsQuery
