from __future__ import annotations
from datetime import datetime
from enum import IntEnum
from typing import Any, Iterable, Union
import abc


class Attribute:
    """The unique identifier of a network attribute within a network dataset."""
    ...


class NetworkTimeUsage(IntEnum):
    """Enumeration for time usage types."""
    Unused = 0
    BeforeTraversal = 1
    AfterTraversal = 2


class AttributeUsage(IntEnum):
    """Enumeration for network attribute usage types."""

    Cost = 0
    Descriptor = 1
    Restriction = 2
    Hierarchy = 3


class AttributeParameterUsage(IntEnum):
    """Enumeration for network attribute parameter usage types."""

    General = 0
    Restriction = 1


class AttributeParameter:
    """A parameter associated with a network attribute."""

    @property
    def name(self) -> str:
        """The attribute parameter name."""
        ...

    @property
    def value(self) -> Union[float, int, str, bool, None]:
        """The attribute parameter value."""
        ...

    @property
    def usage(self) -> AttributeParameterUsage:
        """The attribute parameter usage."""
        ...


class NetworkElement:
    """A network element of the network dataset."""

    @property
    def isJunction(self) -> bool:
        """Indicates if the network element is a junction."""
        ...

    @property
    def isTurn(self) -> bool:
        """Indicates if the network element is a turn."""
        ...

    @property
    def isEdge(self) -> bool:
        """Indicates if the network element is an edge."""
        ...


class Edge(NetworkElement):
    """An edge."""

    @property
    def isAlong(self) -> bool:
        """Indicates if the direction of the edge is along the source feature."""
        ...

    @property
    def isAgainst(self) -> bool:
        """Indicates if the direction of the edge is against the source feature."""
        ...

    @property
    def opposite(self) -> Edge:
        """The edge that is the opposite direction of the current edge."""
        ...


class Junction(NetworkElement):
    """A junction."""
    ...


class Turn(NetworkElement):
    """A turn."""
    ...


class NetworkQuery:
    """Provides access to the properties, attributes, attribute values, and elements of a network dataset."""

    @property
    def networkName(self) -> str:
        """The name of the network."""
        ...

    @property
    def sourceNames(self) -> Iterable[str]:
        """The names of the sources referenced by the network."""
        ...

    def attribute(self, attribute_name: str) -> Attribute | None:
        """Return an attribute of the specified attribute name.

        If the attribute name is not found, None will be returned.

        Args:
            attribute_name (str): Name of the network attribute.

        Returns:
            Attribute:  An attribute object.
        """
        ...

    def attributeUsage(self, attribute: Attribute) -> AttributeUsage:
        """Return usage type of the specified attribute.

        Args:
            attribute (Attribute): Attribute id as an attribute object.

        Returns:
            AttributeUsage: An attribute usage enum.
        """
        ...

    def attributeParameters(self, attribute: Attribute) -> Iterable[AttributeParameter]:
        """Return the parameters of the specified attribute.

        Args:
            attribute (Attribute): Attribute id as an attribute object.

        Returns:
            Iterable[AttributeParameter]: Iterable of attribute parameters.
        """
        ...

    def fromJunction(self, edge: Edge) -> Junction:
        """Return the 'from' junctions for the specified edge."""
        ...

    def toJunction(self, edge: Edge) -> Junction:
        """Return the 'to' junctions for the specified edge."""
        ...

    def atJunction(self, turn: Turn) -> Junction:
        """Return the junction that connects first and second edges of the turn.

        Args:
            turn (Turn): Turn to get junction for.

        Returns:
            Junction: Junction that connects first and second edges of the turn.
        """
        ...

    def turns(self, junction: Junction) -> Iterable[Turn]:
        """Return the turns for the specified junction where the junction connects the first and second edges of each
        turn.

        Args:
            junction (Junction): Junction to get turns for.

        Returns:
            Iterable[Turn]: Iterable of turns.
        """
        ...

    def edges(self, element: Junction | Turn) -> Iterable[Edge]:
        """Return the edges that are connected to the specified element.

        Args:
            element (Junction | Turn): Element to get edges for.

        Returns:
            Iterable[Edge]: Iterable of edges.
        """
        ...

    def edgePositions(self, edge: Edge) -> tuple[float, float]:
        """Return the 'from' and 'to' positions along the source feature for the specified edge.

        This uses the digitization direction of the source feature.
        The values are in the range of 0.0 to 1.0

        Args:
            edge (Edge): Edge to get positions for.

        Returns:
            tuple[float, float]: Tuple containing the 'from' and 'to' position values.
        """
        ...

    def edgeAzimuths(self, edge: Edge) -> tuple[float, float]:
        """Return the 'from' and 'to' azimuths for the specified edge.

        Args:
            edge (Edge): Edge to get azimuths for.

        Returns:
            tuple[float, float]: Tuple containing the 'from' and 'to' azimuths values.
        """
        ...

    def sourceInfo(self, element: Junction | Edge | Turn) -> tuple[int, int]:
        """Return source information for the specified network element.

        Args:
            element (Junction | Edge | Turn): Element to get source information for.

        Returns:
            tuple[int, int]: Tuple of network source id and network source object id.
        """
        ...

    def attributeValue(self, element: Junction | Edge | Turn,
                       attribute: Attribute, time_usage: NetworkTimeUsage | None = None,
                       local_time: datetime | None = None) -> Union[int, float, bool]:
        """Attribute value for a specified element, with optional time.

        Args:
            element (Junction | Edge | Turn): Element to get the attribute value for.
            attribute (Attribute): The attribute to get the value for.
            time_usage (NetworkTimeUsage, optional): The time usage type. Defaults to None.
            local_time (datetime | None, optional): The time to get the attribute value for. Defaults to None.

        Returns:
            Union[int, float, bool]: The attribute value for a specified element at a given time.
        """
        ...


class AttributeEvaluator:
    """Base class for network attribute custom evaluator."""

    def __init__(self, attribute_name: str, specific_sources: list[str] | None = None) -> None:
        """Initialize of attribute evaluator object.

        If specific sources is not set then the custom evaluator will apply to all sources.

        Args:
            attribute_name (str): Name of the network attribute.
            specific_sources (list[str] | None, optional): List of specific network source names. Defaults to None.
        """
        ...

    @property
    def attributeName(self) -> str:
        """The network attribute name that the custom evaluator applies to."""
        ...

    @property
    def attribute(self) -> Attribute:
        """The network attribute that the custom evaluator applies to."""
        ...

    @property
    def sourceNames(self) -> list[str]:
        """The list of network source names that the custom evaluator applies to."""
        ...

    @property
    def networkQuery(self) -> NetworkQuery:
        """The network query object for the network the attribute evaluator is attached to.

        Returns:
            NetworkQuery: NetworkQuery object or None if the evaluator was not attached yet.
        """
        ...

    @property
    def attached(self) -> bool:
        """Indicates if the evaluator is attached to a network.

        Returns:
            bool: True if the evaluator is correctly attached to the network dataset.
        """
        ...

    def attach(self, network_query: NetworkQuery) -> bool:
        """Used to verify that the attribute evaluator can be applied to the network.

        Validation of attributes and resources can be done in this method.
        Invoked when the custom evaluator is attached to the network dataset.
        Can be invoked multiple times depending upon the number of threads accessing the network.

        Args:
            network_query (NetworkQuery): Network query instance for current network dataset.

        Returns:
            bool: True if the network has the specified attribute.
        """
        ...

    def refresh(self) -> None:
        """Used to for state management of the attribute evaluator.

        This method can be use to refresh the evaluator's state, such as resources can be read,
        internal caches can be refreshed, etc.
        Invoked on just prior to each a solve being executed.
        """
        ...

    def edgeValue(self, edge: Edge) -> Union[int, float, bool]:
        """Used to set the final evaluated attribute value for an edge.

        Custom logic can be applied in this method to determine the final attribute value.
        Invoked at the end of solver's evaluation of the edge.

        Args:
            edge (Edge): Edge being evaluated.

        Returns:
            Union[int, float, bool]: Returns the attribute value back to the solver.
        """
        ...

    def edgeValueAtTime(self, edge: Edge, time: datetime, time_usage: NetworkTimeUsage) -> Union[int, float, bool]:
        """Used to set the final evaluated attribute value for an edge, when time is used.

        Custom logic can be applied in this method to determine the final attribute value.
        Invoked at the end of solver's evaluation of the edge, when time has
        been used (for evaluators that support time).

        Args:
            edge (Edge): Edge being evaluated.
            time (datetime): Time the edge would be encountered along the route.
            time_usage (NetworkTimeUsage): Time usage type.

        Returns:
            Union[int, float, bool]: Returns the attribute value back to the solver.
        """
        ...

    def junctionValue(self, junction: Junction) -> Union[int, float, bool]:
        """Used to set the final evaluated attribute value for a junction.

        Custom logic can be applied in this method to determine the final attribute value.
        Invoked at the end of solver's evaluation of the junction.

        Args:
            junction (Junction): Junction being evaluated.

        Returns:
            Union[int, float, bool]: Returns the attribute value back to the solver.
        """
        ...

    def junctionValueAtTime(self, junction: Junction, time: datetime,
                            time_usage: NetworkTimeUsage) -> Union[int, float, bool]:
        """Used to set the final evaluated attribute value for a junction, when time is used.

        Custom logic can be applied in this method to determine the final attribute value.
        Invoked at the end of solver's evaluation of the junction, when time has
        been used (for evaluators that support time).

        Args:
            junction (Junction): Junction being evaluated.
            time (datetime): Time the junction would be encountered along the route.
            time_usage (NetworkTimeUsage): Time usage type.

        Returns:
            Union[int, float, bool]: Returns the attribute value back to the solver.
        """
        ...

    def turnValue(self, turn: Turn) -> Union[int, float, bool]:
        """Used to set the final evaluated attribute value for a turn.

        Custom logic can be applied in this method to determine the final attribute value.
        Invoked at the end of solver's evaluation of the turn.

        Args:
            turn (Turn): Turn being evaluated.

        Returns:
            Union[int, float, bool]: Returns the attribute value back to the solver.
        """
        ...

    def turnValueAtTime(self, turn: Turn, time: datetime,
                        time_usage: NetworkTimeUsage) -> Union[int, float, bool]:
        """Used to set the final evaluated attribute value for a turn, when time is used.

         Custom logic can be applied in this method to determine the final attribute value.
         Invoked at the end of solver's evaluation of the turn, when time has
         been used (for evaluators that support time).

        Args:
            turn (Turn): Turn being evaluated.
            time (datetime): Time the turn would be encountered along the route.
            time_usage (NetworkTimeUsage): Time usage type.

        Returns:
            Union[int, float, bool]: Returns the attribute value back to the solver.
        """
        ...


JunctionCode = 1 << 16
EdgeCode = 1 << 17
TurnCode = 1 << 18


class TraversedElementType(IntEnum):
    """Enumeration for traversed element type."""

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
    """Enumeration for curb approach."""

    EitherSide = 0,
    RightSide = 1,
    LeftSide = 2,
    NoUTurn = 3


class DrivingSide(IntEnum):
    """Enumeration for driving side."""

    Unknown = 0,
    RightSide = 1,
    LeftSide = 2


class LandmarkSide(IntEnum):
    """Enumeration for landmark side."""

    Unknown = -1
    Both = 0,
    Left = 1,
    Right = 2


class ReferenceLandmarkType(IntEnum):
    """Enumeration for reference landmark type."""

    Turn = 0,
    Confirmation = 1,
    StopSign = 2,
    TrafficLight = 3,
    RailwayCrossing = 4


class NameClass(IntEnum):
    """Enumeration for directions name class."""

    StreetName = 0,
    RouteNumber = 1,


class DirectionPointType(IntEnum):
    """Enumeration for direction point type."""

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
    """Enumeration for directions field mapping."""
    FullName = 0
    BaseName = 1
    PrefixType = 2
    SuffixType = 3
    HighwayDirection = 4
    PrefixDirection = 5
    SuffixDirection = 6
    Phrase = 7
    Language = 8
    NameClass = 9  # not implemented


class DirectionPoint:
    """Describes a maneuver or an event along a route."""

    def __init__(self, element: TraversedJunction | TraversedEdge) -> None:
        """Initialize of direction point object.

        Args:
            element (TraversedJunction | TraversedEdge): Element the direction point is associated with.
        """
        ...

    @property
    def displayText(self) -> str:
        """The directions text, formatted for UI display."""
        ...

    @displayText.setter
    def displayText(self, value: str) -> None:
        ...

    @property
    def voiceInstruction(self) -> str:
        """The directions text, formatted for voice guidance.

        The text will have expanded abbreviations and plurals.
        """
        ...

    @voiceInstruction.setter
    def voiceInstruction(self, value: str) -> None:
        ...

    @property
    def shortVoiceInstruction(self) -> str:
        """A shortened version of the directions text, formatted for voice guidance.

        The text will have expanded abbreviations and plurals.
        """
        ...

    @shortVoiceInstruction.setter
    def shortVoiceInstruction(self, value: str) -> None:
        ...

    @property
    def directionPointType(self) -> DirectionPointType:
        """The direction point type."""
        ...

    @directionPointType.setter
    def directionPointType(self, value: DirectionPointType) -> None:
        ...

    @property
    def positionAlong(self) -> float:
        """The position of the direction point along an edge.

        The value needs to be between the edge's from and to position.
        If on a junction the value should be 0.0 (the default).
        """
        ...

    @positionAlong.setter
    def positionAlong(self, value: float) -> None:
        ...

    @property
    def azimuth(self) -> float:
        """The bearing, in degrees, of the vehicle departing this point in range [0, 360].

        Zero indicates north. The value is generated by the engine for new points.
        """
        ...

    @property
    def arrivalTime(self) -> datetime | None:
        """The time when the direction point will be reached (in local time).

        The value generated by the engine for new points.
        """
        ...

    @property
    def exitNumber(self) -> int:
        """The exit number on a roundabout."""
        ...

    @property
    def exitName(self) -> DirectionsName | None:
        """The highway exit name components in the directions."""
        ...

    @exitName.setter
    def exitName(self, value: DirectionsName) -> None:
        ...

    @property
    def name(self) -> DirectionsName | None:
        """The name components of the direction point."""
        ...

    @name.setter
    def name(self, value: DirectionsName) -> None:
        ...

    @property
    def alternateName(self) -> DirectionsName | None:
        """The alternate name components in the directions."""
        ...

    @alternateName.setter
    def alternateName(self, value: DirectionsName) -> None:
        ...

    @property
    def intersectingNames(self) -> list[DirectionsName]:
        """The iterable of name components of the intersecting or cross street in the directions."""
        ...

    @intersectingNames.setter
    def intersectingNames(self, value: list[DirectionsName]) -> None:
        ...

    @property
    def branchNames(self) -> list[DirectionsName]:
        """The signpost branch names components in the directions."""
        ...

    @branchNames.setter
    def branchNames(self, value: list[DirectionsName]) -> None:
        ...

    @property
    def towardNames(self) -> list[DirectionsName]:
        """The signpost toward destination names components in the directions."""
        ...

    @towardNames.setter
    def towardNames(self, value: list[DirectionsName]) -> None:
        ...


class DirectionsCustomizer(abc.ABC):
    """Base class for directions customizers."""

    @abc.abstractmethod
    def attach(self, network_query: NetworkQuery) -> bool:
        """Used to verify that the direction customizer can be applied to the network.

        Invoked when the direction customizer is attached to the network dataset.
        It may be invoked multiple times depending upon the number of threads accessing the network.

        Args:
            network_query (NetworkQuery): Network query instance for current network dataset.

        Returns:
            bool: True if can be attached to the network dataset.
        """
        ...

    @abc.abstractmethod
    def customize(self, directions_query: DirectionsQuery) -> None:
        """Used to customize the final directions output.

        Invoked by the directions engine once per route.

        Args:
            directions_query (DirectionsQuery): Directions query instance for current route.
        """
        ...

    @property
    def networkQuery(self) -> NetworkQuery:
        """The network query object for the network the customizer is attached to.

        Returns:
            NetworkQuery: NetworkQuery object or None if the customizer was not attached yet.
        """
        ...


class DirectionsQuery:
    """Provides access to directions properties and query methods."""

    @property
    def routeID(self) -> int:
        """ID of the route in the result (zero-based)."""
        ...

    @property
    def routeName(self) -> str:
        """Name of the route."""
        ...

    @property
    def softRestrictionNames(self) -> list[str]:
        """A Iterable of enabled soft restrictions."""
        ...

    # region: Traversability
    @property
    def junctions(self) -> list[TraversedJunction] | None:
        """Return all the junctions in the sequence being traversed."""
        ...

    @property
    def edges(self) -> list[TraversedEdge] | None:
        """Return all the edges in the sequence being traversed."""
        ...

    def turns(self, junction: TraversedJunction) -> list[TraversedTurn] | None:
        """Return the turns of the specified junction."""
        ...

    # Traverse
    def previousTraversedEdge(self, junction: TraversedJunction) -> TraversedEdge | None:
        """Return the previous edge of the specified junction."""
        ...

    def nextTraversedEdge(self, junction: TraversedJunction) -> TraversedEdge | None:
        """Return the next edge of the specified junction."""
        ...

    def adjacentEdges(self, junction: TraversedJunction) -> list[AdjacentNetworkEdge] | None:
        """Return the adjacent edges of the specified junction. These edges are not traversed."""
        ...

    def fromJunction(self, edge: TraversedEdge) -> TraversedJunction:
        """Return the from junction the specified edge."""
        ...

    def toJunction(self, edge: TraversedEdge) -> TraversedJunction:
        """Return the to junction the specified edge."""
        ...

    def fromEdge(self, turn: TraversedTurn) -> TraversedEdge:
        """Return the from edge of the specified turn."""
        ...

    def toEdge(self, turn: TraversedTurn) -> TraversedEdge:
        """Return the to edge of the specified turn."""
        ...
    # endregion

    # region: Query traversed element information
    def fieldValue(self, element: TraversedElement, mapped_field_name: str) -> Union[int, float, str]:
        """Return the value of the specified mapped field for the specified element.

        Args:
            element (TraversedElement): A TraversedEdge, TraversedJunction, or TraversedTurn.
            mapped_field_name (str): The mapped field name.

        Returns:
            Union[int, float, str]: Field value or None if the field doesn't exist or is not mapped.
        """
        ...

    def attributeValue(self, element: TraversedElement, attribute: Attribute) -> Union[int, float, bool]:
        """Returns the value of the specified network attribute for the element.

        Args:
            element (TraversedElement): Element to query for attribute value.
            attribute (Attribute): Attribute to get value for.

        Returns:
            Union[int, float, bool]:  Attribute value or None if the attribute doesn't exist.
        """
        ...
    # endregion


class TraversedElement:
    """Represents a single traversed element.

    Used as base class for shared properties of TraversedEdge, TraversedJunction and TraversedTurn.
    """

    @property
    def type(self) -> TraversedElementType:
        """The type of the traversed element."""
        ...

    @property
    def sourceID(self) -> int:
        """The network source id of the this element."""
        ...

    @property
    def sourceObjectID(self) -> int:
        """The network source object id of this element."""
        ...

    @property
    def rowID(self) -> int:
        """The traversed result element object ID."""
        ...

    @property
    def accumulatedTime(self) -> float:
        """Accumulated time of the route up to and including this element.

        Expressed in the network's time attribute units.
        """
        ...

    @property
    def accumulatedLength(self) -> float:
        """Accumulated length of a route up to and including this element.

        Expressed in the network's length attribute units.
        """
        ...

    @property
    def accumulatedImpedance(self) -> float:
        """Accumulated impedance of a route up to and including this element.

        Expressed in the network's impedance attribute units.
        """
        ...

    @property
    def violatedRestrictions(self) -> list[str]:
        """Iterable of violated soft restrictions on this element."""
        ...


class TraversedTurn(TraversedElement):
    """Represents a single turn of a route."""
    # No special properties for turns for now, just whatever is on TraversedElement.
    ...

    @property
    def element(self) -> Turn:
        """The network turn element."""
        ...


class TraversedJunction(TraversedElement):
    """Represents a single junction of a route.

    A typical route is an alternating sequence of edges and junctions, for example:
    RouteJunction -> RouteEdge -> RouteJunction -> RouteEdge -> RouteJunction.
    """

    @property
    def element(self) -> Junction:
        """The network junction element."""
        ...

    @property
    def violationTime(self) -> float:
        """The violation time, expressed in the network's time attribute units."""
        ...

    @property
    def signpostID(self) -> int:
        """The OID of related signpost."""
        ...

    @property
    def roadSplitID(self) -> int:
        """The OID of related road split."""
        ...

    @property
    def names(self) -> list[DirectionsName]:
        """Iterable of the names of the junction."""
        ...

    @property
    def referenceLandmark(self) -> ReferenceLandmark | None:
        """The reference landmark related to the junction."""
        ...

    @property
    def spatialLandmarks(self) -> list[SpatialLandmark]:
        """Iterable of spatial landmarks related to the junction."""
        ...

    @property
    def level(self) -> int | None:
        """The level of the junction."""
        ...

    @property
    def timeWindowStart(self) -> datetime | None:
        """The start value of a time window in which a stop on the junction will be visited (in local time)."""
        ...

    @property
    def timeWindowEnd(self) -> datetime | None:
        """The end value of a time window in which a stop on the junction will be visited (in local time)."""
        ...

    @property
    def waitTime(self) -> float | None:
        """The wait time between the arrival and the departure for a stop.

        Expressed in the network's time attribute units.
        """
        ...

    @property
    def arrivalTime(self) -> datetime | None:
        """The calculated time of arrival (in local time)."""
        ...

    @property
    def departureTime(self) -> datetime | None:
        """The time of departure (in local time)."""
        ...

    @property
    def arriveCurbApproach(self) -> CurbApproach | None:
        """The curb approach of a destination (if any) in the junction."""
        ...

    @property
    def directionPoints(self) -> list[DirectionPoint]:
        """The direction points associated with the junction.

        Returns:
            list[DirectionPoint]: List of DirectionPoints.
        """
        ...

    @directionPoints.setter
    def directionPoints(self, value: list[DirectionPoint]) -> None:
        ...

    def getName(self, index: int = 0, mapping: DirectionsFieldMapping = DirectionsFieldMapping.FullName,
                fallback: str = "") -> str | None:
        """Name of the junction.

        Either the full name or a portion of the name can be returned, depending on the mapping parameter value.

        Args:
            index (int, optional): The type of name to retrieve (e.g. PrimaryName = 0, AlternateName1 = 1,
            AlternateName2 = 2, etc.). Defaults to 0.
            mapping (DirectionsFieldMapping, optional): The portion of the name to return. Defaults to
            DirectionsFieldMapping.FullName.
            fallback (str, optional): Value if the junction does not contain the requested mapped property.
            Defaults to "".

        Returns:
            str | None: Name from the junction given the input parameters.
        """
        ...

    def getNames(self, mapping: DirectionsFieldMapping = DirectionsFieldMapping.FullName,
                 fallback: str = "") -> list[str] | None:
        """Names of the junction.

        Args:
            mapping (DirectionsFieldMapping, optional): The portion of the name to return. Defaults to
            DirectionsFieldMapping.FullName.
            fallback (str, optional): Value if the junction does not contain the requested mapped property.
            Defaults to "".

        Returns:
            list[str] | None: List of the Names (primary and alternatives) from the junction for the specified
            DirectionsFieldMapping.
        """
        ...


class TraversedEdge(TraversedElement):
    """Represents a single edge of a route.

    A typical route is an alternating sequence of edges and junctions, for example:
    RouteJunction -> RouteEdge -> RouteJunction -> RouteEdge -> RouteJunction
    """

    @property
    def element(self) -> Edge:
        """The network edge element."""
        ...

    @property
    def fromPosition(self) -> float:
        """The position on a network element where the route edge starts.

        The values are in the range of 0.0 to 1.0.
        """
        ...

    @property
    def toPosition(self) -> float:
        """The position on a network element where the route edge ends.

        The values are in the range of 0.0 to 1.0.
        """
        ...

    @property
    def immediateAzimuths(self) -> tuple[float, float]:
        """The azimuth calculated at close proximity to the start and end of the edge.

        Returns:
            Tuple of "from" and "to" azimuth values.
        """
        ...

    @property
    def generalizedAzimuths(self) -> tuple[float, float]:
        """Generalized azimuth calculated further away from the start and end of the edge.

        Returns:
            Tuple of "from" and "to" azimuth values.
        """
        ...

    @property
    def names(self) -> list[DirectionsName]:
        """Iterable of the names of the edge."""
        ...

    @property
    def referenceLandmarks(self) -> list[ReferenceLandmark]:
        """Iterable of reference landmarks related to the edge."""
        ...

    @property
    def spatialLandmarks(self) -> list[SpatialLandmark]:
        """Iterable of spatial landmarks related to the edge."""
        ...

    @property
    def drivingSide(self) -> DrivingSide | None:
        """Driving side value."""
        ...

    @property
    def fromLevel(self) -> int | None:
        """Level the edge starts at."""
        ...

    @property
    def toLevel(self) -> int | None:
        """Level the edge ends at."""
        ...

    @property
    def administrativeArea(self) -> str | None:
        """Name of administrative area the edge is in."""
        ...

    @property
    def floorName(self) -> str | None:
        """Name of a floor the edge is on."""
        ...

    @property
    def timezoneID(self) -> int | None:
        """ID of the time zone the edge is in."""
        ...

    @property
    def arrivalTime(self) -> datetime | None:
        """The time at the start of the edge (in UTC)."""
        ...

    @property
    def departureTime(self) -> datetime | None:
        """The time at the end of the edge (in UTC)."""
        ...

    @property
    def directionPoints(self) -> list[DirectionPoint]:
        """The direction points associated with the edge.

        Returns:
            list[DirectionPoint]: List of DirectionPoints.
        """
        ...

    @directionPoints.setter
    def directionPoints(self, value: list[DirectionPoint]) -> None:
        ...

    def getName(self, index: int = 0, mapping: DirectionsFieldMapping = DirectionsFieldMapping.FullName,
                fallback: str = "") -> str | None:
        """Name of the edge.

        Either the full name or a portion of the name can be returned, depending on the mapping parameter value.

        Args:
            index (int, optional): The type of name to retrieve (e.g. PrimaryName = 0, AlternateName1 = 1,
            AlternateName2 = 2, etc.). Defaults to 0.
            mapping (DirectionsFieldMapping, optional): The portion of the name to return. Defaults to
            DirectionsFieldMapping.FullName.
            fallback (str, optional): Value if the edge does not contain the requested mapped property.
            Defaults to "".

        Returns:
            str | None: Name from the edge given the input parameters.
        """
        ...

    def getNames(self, mapping: DirectionsFieldMapping = DirectionsFieldMapping.FullName,
                 fallback: str = "") -> list[str] | None:
        """Names of the edge.

        Args:
            mapping (DirectionsFieldMapping, optional): The portion of the name to return. Defaults to
            DirectionsFieldMapping.FullName.
            fallback (str, optional): Value if the edge does not contain the requested mapped property.
            Defaults to "".

        Returns:
            list[str] | None: List of the Names (primary and alternatives) from the edge for the specified
            DirectionsFieldMapping.
        """
        ...


class AdjacentNetworkEdge:
    """Represents an edge adjacent to a junction."""

    @property
    def type(self) -> TraversedElementType:
        """The type of adjacent edge."""
        ...

    @property
    def immediateAzimuths(self) -> tuple[float, float]:
        """The azimuth calculated at close proximity to the start and end of the edge."""
        ...

    @property
    def element(self) -> Edge:
        """The network edge element of adjacent edge."""
        ...

    @property
    def sourceID(self) -> int:
        """The source ID of adjacent edge's network element."""
        ...

    @property
    def sourceObjectID(self) -> int:
        """The source object ID of adjacent edge's network element."""
        ...

    @property
    def names(self) -> list[DirectionsName]:
        """Iterable of element names referring to the adjacent edge."""
        ...

    @property
    def fromPosition(self) -> float:
        """The position on a network element where the adjacent edge starts.

        The value is in the range of 0.0 to 1.0.
        """
        ...

    @property
    def toPosition(self) -> float:
        """The position on a network element where the adjacent edge ends.

         The value is in the range of 0.0 to 1.0.
        """
        ...

    def getName(self, index: int = 0, mapping: DirectionsFieldMapping = DirectionsFieldMapping.FullName,
                fallback: str = "") -> str | None:
        """Name of the adjacent edge.

        Either the full name or a portion of the name can be returned, depending on the mapping parameter value.

        Args:
            index (int, optional): The type of name to retrieve (e.g. PrimaryName = 0, AlternateName1 = 1,
            AlternateName2 = 2, etc.). Defaults to 0.
            mapping (DirectionsFieldMapping, optional): The portion of the name to return. Defaults to
            DirectionsFieldMapping.FullName.
            fallback (str, optional): Value if the edge does not contain the requested mapped property.
            Defaults to "".

        Returns:
            str | None: Name from the edge given the input parameters.
        """
        ...

    def getNames(self, mapping: DirectionsFieldMapping = DirectionsFieldMapping.FullName,
                 fallback: str = "") -> list[str] | None:
        """Names of the adjacent edge.

        Args:
            mapping (DirectionsFieldMapping, optional): The portion of the name to return. Defaults to
            DirectionsFieldMapping.FullName.
            fallback (str, optional): Value if the edge does not contain the requested mapped property.
            Defaults to "".

        Returns:
            list[str] | None: List of the Names (primary and alternatives) from the edge for the specified
            DirectionsFieldMapping.
        """
        ...


class DirectionsName:
    """A set of names that the directions engine may output or uses during generation of directions.

    If full is empty then a name is generated using the values (separated by a space) of the fields:
    prefixDirection, prefixType, base, suffixType, suffixDirection, and highwayDirection.
    """

    @property
    def fullName(self) -> str:
        """The full name to display.

        If it is not populated the name generator will generate a value
        from existing components.
        """
        ...

    @fullName.setter
    def fullName(self, value: str) -> None:
        ...

    @property
    def baseName(self) -> str:
        """The base name of the element.

        For example "Main".
        """
        ...

    @baseName.setter
    def baseName(self, value: str) -> None:
        ...

    @property
    def highwayDirection(self) -> str:
        """The highway direction component.

        For example "N".
        """
        ...

    @highwayDirection.setter
    def highwayDirection(self, value: str) -> None:
        ...

    @property
    def prefixType(self) -> str:
        """The type of a base name that goes before the name.

        For example "St".
        """
        ...

    @prefixType.setter
    def prefixType(self, value: str) -> None:
        ...

    @property
    def prefixDirection(self) -> str:
        """The direction prefix of the name.

        For example "North".
        """
        ...

    @prefixDirection.setter
    def prefixDirection(self, value: str) -> None:
        ...

    @property
    def suffixType(self) -> str:
        """The type of a base name that goes after the name.

        For example "Ave".
        """
        ...

    @suffixType.setter
    def suffixType(self, value: str) -> None:
        ...

    @property
    def suffixDirection(self) -> str:
        """The direction suffix of the element name.

        For example "North".
        """
        ...

    @suffixDirection.setter
    def suffixDirection(self, value: str) -> None:
        ...

    @property
    def phrase(self) -> str:
        """The phase to help generate directions for landmarks.

        For example "before the 7-Eleven".
        """
        ...

    @phrase.setter
    def phrase(self, value: str) -> None:
        ...

    @property
    def language(self) -> str:
        """The language of the elements.

        For example "en".
        """
        ...

    @language.setter
    def language(self, value: str) -> None:
        ...

    @property
    def nameClass(self) -> NameClass | None:
        """The optional class of the name.

        StreetName - Ordinary street name (example: "Lake St" where "Lake" is name and "St" is suffix type).
        RouteNumber - Route number (example: "CR-J22 N" where "CR-J22" is name and "N" is direction).
        """
        ...

    @nameClass.setter
    def nameClass(self, value: NameClass) -> None:
        ...


class SpatialLandmark:
    """Spatial landmark."""

    @property
    def name(self) -> DirectionsName:
        """Name of the landmark."""
        ...

    @property
    def position(self) -> float:
        """Position on an edge.

        The value is in the range of 0.0 to 1.0.
        For junctions the value is zero.
        """
        ...

    @property
    def distanceInMeters(self) -> float:
        """Distance to the landmark from the route."""
        ...

    @property
    def side(self) -> LandmarkSide:
        """Landmark side, relative to the route's direction of travel."""
        ...


class ReferenceLandmark:
    """Reference landmark."""

    @property
    def importance(self) -> int:
        """The priority of the landmark."""
        ...

    @property
    def position(self) -> float:
        """Position on an edge.

        The value is in the range of 0.0 to 1.0.
        For junctions the value is zero.
        """
        ...

    @property
    def side(self) -> LandmarkSide:
        """Landmark side, relative to the route's direction of travel."""
        ...

    @property
    def type(self) -> ReferenceLandmarkType:
        """Reference landmark type."""
        ...

    @property
    def name(self) -> DirectionsName:
        """Name of the landmark."""
        ...


class NetworkDataset:
    """Provides access to properties and methods of a network dataset.

    Examples:
        Iterate through all the turns in the network and get the junctions that participate
        >>> import arcpy._na as nax
        >>> # Your path to the network dataset might be different.
        >>> nd = nax.NetworkDataset("C:\\ArcTutor\\NetworkAnalyst\\Tutorial\\SanDiego.gdb\\Transportation\\Streets_ND")
        >>> nd.isBuilt
        >>> turns = nd.turns(["SOURCEOID", "EDGEEIDS"])
        >>> for turn in turns:
                # For the edges in the turn, get the from and to junctions
                edges = nd.edges(["SOURCEOID", "FROMJUNCTION", "TOJUNCTION"], eids=turn[1])
                for edge in edges:
                    # For the from and to junction, get the SOURCEOID
                    junctions = nd.junctions("SOURCEOID", eids=[edge[1], edge[2]])
                junctions_list = [j for j in junctions]
                print(junctions_list)

    """

    def __init__(self, in_network):
        """Returns a NetworkDataset object that provides read-only access to some properties of a network dataset,
           including iterators over network edge, junction, and turn elements.

           Args:
               in_network: A network dataset catalog path or network dataset layer object or a string representing
                           the name of the network dataset layer.

        """
        ...

    def checkIntersectingFeatures(self, feature_layer, cutoff=5000) -> bool:
        """Returns a Boolean indicating whether the number of edge source features from the specified network dataset
           that are intersected by the features within the specified feature layer is less than or equal to the
           specified cutoff.

           Args:
               feature_layer: A variable that references the Layer object containing the features that are intersected
                              with the edge sources. Any selection set or definition query present on the Layer object
                              is honored and can be used to specify only a subset of features.
               cutoff: An integer value used as a cutoff while performing the check.

           Returns:
                True if the number of intersecting features is less than or equal to the allowed limit. Returns False
                if the number of intersecting features exceeds the allowed limit.

        """
        ...

    def describe(self):
        """Returns a describe object which contains additional properties for the network dataset."""
        ...

    def edges(self, edge_properties=None, attribute_names=None, time_of_day=None, eids=None, travel_mode=None):
        """Returns an iterator of network dataset edge elements including the value of specific edge properties and
           network attributes at the time of day specified.

        Args:
            edge_properties: A list of strings representing the network edge properties to retrieve. For a single
                             property, you can use a string instead of a list of strings. The available properties
                             include:
                                 EID: The EID of the edge
                                 SOURCEID: The ID of the source feature class of the edge.
                                 SOURCEOID: The ObjectID of the feature within the source feature class from which this
                                            network edge is derived.
                                 FROMPOSITION: The distance along the source feature where this network edge starts.
                                               A network edge may not represent a complete feature in the source feature
                                               class.
                                 TOPOSITION: The distance along the source feature where this network edge ends.
                                 DIRECTION: A Boolean indicating whether the edge’s direction is along the direction of
                                            digitization.
                                 FROMJUNCTION: The EID of the junction feature at the beginning of the edge.
                                 TOJUNCTION: The EID of the junction feature at the end of the edge.
                                 ISRESTRICTED: The network element is not traversable for the travel_mode.
                                 COST: The value for the impedance network attribute for the travel_mode.
                                 TIME: The value for the time network attribute for the travel_mode.
                                 DISTANCE: The value for the distance network attribute for the travel_mode.

            attribute_names: The list of network dataset attribute names (such as costs or restrictions) for which to
                             retrieve the value for each network element. If the value is time dependent, you can
                             specify the time of day using the time_of_day parameter.  For a single attribute, you can
                             use a string instead of a list of strings.

            time_of_day: A datetime representing time of day for which to retrieve time-dependent attribute values for
                         this network element.  When no time_of_day value is passed, the time-neutral value will be
                         returned.

            eids: A list of EID values to include in the cursor.  This allows you to return only a subset of all
                  network elements. If no value is passed for this parameter, all network elements are returned.

            travel_mode: A travel_mode object to use for attribute parameters, ISRESTRICTED, COST, TIME, and DISTANCE
                         properties.

        Returns:
             A NetworkDatasetEdgeCursor which can be used to iterate over the returned edges.  Each row is a tuple with
             the values of the items specified in the edge_properties and attribute_names parameters for that edge.

        """
        ...

    def junctions(self, junction_properties=None, attribute_names=None, time_of_day=None, eids=None, travel_mode=None):
        """Returns an iterator of network dataset junction elements including the value of specific junction properties
           and network attributes at the time of day specified.

           Args:
               junction_properties: A list of strings representing the network junction properties to retrieve. For a
                                    single property, you can use a string instead of a list of strings. The available
                                    properties include:
                                        EID: The EID of the junction.
                                        SOURCEID: The ID of the source feature class of the junction.
                                        SOURCEOID: The ObjectID of the feature within the source feature class from
                                                   which this network junction is derived.
                                        ISRESTRICTED: The network element is not traversable for the travel_mode.
                                        COST: The value for the impedance network attribute for the travel_mode.
                                        TIME: The value for the time network attribute for the travel_mode.
                                        DISTANCE: The value for the distance network attribute for the travel_mode.

               attribute_names: The list of network dataset attribute names (such as costs or restrictions) for which
                                to retrieve the value for each network element. If the value is time dependent, you can
                                specify the time of day using the time_of_day parameter. For a single attribute, you
                                can use a string instead of a list of strings.

               time_of_day: A datetime representing time of day for which for which to retrieve time-dependent attribute
                            values for this network element. When no time_of_day value is passed, the time-neutral
                            value will be returned.

               eids: A list of EID values to include in the cursor. This allows you to return only a subset of all
                     network elements. If no value is passed for this parameter, all network elements are returned.

               travel_mode: A travel_mode object to use for attribute parameters, ISRESTRICTED, COST, TIME, and DISTANCE
                            properties.

           Returns:
               A NetworkDatasetJunctionCursor which can be used to iterate over the returned junctions. Each row is a
               tuple with the values of the items specified in the junction_properties and attribute_names parameters
               for that junction.
        """
        ...

    def turns(self, turn_properties=None, attribute_names=None, eids=None, travel_mode=None):
        """Returns an iterator of network dataset turn elements including the value of specific turn properties and
           network attributes.

            Args:
                turn_properties: A list of strings representing the network turn properties to retrieve. For a single
                property, you can use a string instead of a list of strings. The available properties include:
                    EID: The EID of the turn.
                    SOURCEID: The ID of the source feature class of the turn.
                    SOURCEOID: The ObjectID of the feature within the source feature class from which this network
                               turn is derived.
                    EDGEEIDS: An ordered list of network edge EIDs that participate in this turn.
                    ISRESTRICTED: The network element is not traversable for the travel_mode.
                    COST: The value for the impedance network attribute for the travel_mode.
                    TIME: The value for the time network attribute for the travel_mode.
                    DISTANCE: The value for the distance network attribute for the travel_mode.

                attribute_names: The list of network dataset attribute names (such as costs or restrictions) for which
                                 to retrieve the value for each network element. For a single attribute, you can use a
                                 string instead of a list of strings.

                eids: A list of EID values to include in the cursor. This allows you to return only a subset of all
                      network elements. If no value is passed for this parameter, all network elements are returned.

                travel_mode: A travel_mode object to use for attribute parameters, ISRESTRICTED, COST, TIME, and
                             DISTANCE properties.

            Returns:
                A NetworkDatasetTurnCursor which can be used to iterate over the returned turns.  Each row is a tuple
                with the values of the items specified in the turn_properties and attribute_names parameters for that
                turn.

        """
        ...

    def getDataSourceFromSourceID(self, source_id: int) -> str:
        """Returns the catalog path of the network dataset source feature class identified by the given source ID.

            Args:
                source_id: The network source ID for which to retrieve the corresponding source feature class’s
                           catalog path.

            Returns:
                A string representing the catalog path of the network dataset source feature class.

        """
        ...

    @property
    def travelModes(self) -> Iterable:
        """Returns a dictionary of travel mode objects that are available with the network dataset. The keys of this
           dictionary are the travel mode names."""
        ...

    @property
    def isBuilt(self) -> bool:
        """Boolean indicating whether or not the network dataset is built. A value of False indicates that the network
           dataset needs to be rebuilt in order to incorporate changes."""
        ...

    @property
    def buildTimestamp(self):
        """Returns the timestamp of the most recent network build as a datetime object."""
        ...
        
    @property
    def edgeCount(self) -> int:
        """Returns the count of network dataset edge elements."""
        ...
        
    @property
    def junctionCount(self) -> int:
        """Returns the count of network dataset junction elements."""
        ...
        
    @property
    def turnCount(self) -> int:
        """Returns the count of network dataset turn elements."""
        ...

    @property
    def customEvaluators(self) -> list[AttributeEvaluator]:
        """The list of custom evaluators that override network evaluators."""
        ...

    @property
    def directionsCustomizer(self) -> DirectionsCustomizer:
        """The directions customizer used to alter the initial directions output."""
        ...

    def updateNetworkDatasetSchema(self, **kwargs) -> None:
        """Allows setting of custom_evaluators and custom_directions in a network dataset's schema.

        Args:
            **kwargs:
                Valid keyword arguments are:

                custom_evaluators (dict | None, optional): A dictionary that describes the custom evaluators to be
                written to the network dataset's schema, this includes the network attribute name, the module and
                class, and optionally specific sources the custom evaluator should be applied to (e.g.
                {"Minutes": {"class": "custom_evals.AlterMinutes","sourceNames": ["Streets"]}}). To remove a
                reference to existing custom evaluators from the network dataset schema, specify None for this argument.

                custom_directions (dict | None, optional): A dictionary that describes the directions customizer
                to be written to the network dataset's schema, this includes the module and class to use, (e.g.
                {"class": "custom_dirs.AlterDirText"}).  To remove a reference to existing custom directions from the
                network dataset schema, specify None for this argument.
        """
        ...

    ...

class SnapToRoadsInputDataType(IntEnum):
    """Enumeration for the feature class names used by the Snap To Roads to store inputs."""

    Points = 300

    # These are for phase two
    # PointBarriers = 301
    # LineBarriers = 302
    # PolygonBarriers = 303


class SnapToRoadsOutputDataType(IntEnum):
    """Enumeration for the feature class names used by the Snap To Roads to store outputs."""

    SnappedPoints = 350
    Lines = 351

class SnapToRoadsResult:
    @property
    def solveSucceeded(self) -> bool:
        ...

    @property
    def isPartialSolution(self) -> bool:
        ...

    @property
    def spatialReference(self) -> arcpy.SpatialReference:
        ...

    def export(self, output_type, output_features) -> None:
        """This method exports the output features to the specified location."""
        ...

    def solverMessages(self, severity) -> list:
        """This method returns the solver messages of the specified severity."""
        ...

class SnapToRoads:
    def __init__(self, in_network):
        ...

    @property
    def travelMode(self) -> arcpy.nax.TravelMode | None:
        ...

    @property
    def roadProperties(self) -> dict | None:
        ...

    @property
    def roadPropertiesOnSnappedPoints(self) -> list | None:
        ...

    @property
    def roadPropertiesOnLines(self) -> list | None:
        ...

    @property
    def returnLocationFields(self) -> bool:
        ...

    @property
    def returnLines(self) -> bool:
        ...

    @property
    def overrides(self) -> str:
        ...

    @property
    def networkDataSource(self) -> str:
        ...

    def load(self, input_type, features, max_features=None) -> None:
        """This method loads the input features to the SnapToRoads object."""
        ...

    def solve(self) -> SnapToRoadsResult:
        """This method solves the SnapToRoads problem and return a result object."""
        ...