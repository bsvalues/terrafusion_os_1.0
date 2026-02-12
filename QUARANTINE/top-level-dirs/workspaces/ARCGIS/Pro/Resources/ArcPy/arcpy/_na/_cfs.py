"""Module for working with Closest Facility Solver."""

from enum import IntEnum
from arcgisscripting import na as cna  # pylint:disable=no-name-in-module

# List of names exported from this module
__all__ = ["TimeOfDayUsage", "ClosestFacilityInputDataType", "ClosestFacilityOutputDataType", "ClosestFacility"]


class TimeOfDayUsage(IntEnum):
    """Enumeration for the various time of day usage values."""

    DepartureTime = 0
    ArrivalTime = 1


class ClosestFacilityInputDataType(IntEnum):
    """Enumeration for feature class names used by the Closest Facility solver to store inputs."""

    Incidents = 0
    Facilities = 1
    PointBarriers = 2
    LineBarriers = 3
    PolygonBarriers = 4


class ClosestFacilityOutputDataType(IntEnum):
    """Enumeration for feature class names used by the Closest Facility solver to store outputs."""

    Incidents = 0
    Facilities = 1
    Routes = 2
    ClosestFacilities = 3
    DirectionPoints = 4
    DirectionLines = 5
    Directions = 6  # Legacy directions lines


class ClosestFacility(cna.ClosestFacility):
    """Perform closest facility analysis.

    # An example showing how to perform closest facility analysis using a feature class for input stops.
    import arcpy
    import arcpy._na as nax

    nds = "C:/data/NorthAmerica.gdb/Routing/Routing_ND"
    nd_layer_name = "Routing_ND"
    input_facilities = "C:/data/io.gdb/Incidents"
    input_incidents = "C:/data/io.gdb/Facilities"
    output_routes = "C:/data/io.gdb/ClosestRoutes"

    arcpy.CheckOutExtension("network")
    arcpy.na.MakeNetworkDatasetLayer(nds, nd_layer_name)
    nd_travel_modes = arcpy.na.GetTravelModes(nd_layer_name)
    travel_mode = nd_travel_modes["Driving Time"]
    closest_facility = ClosestFacility(nds)
    closest_facility.travelMode = travel_mode
    closest_facility.defaultImpedanceCutoff = 15
    closest_facility.defaultTargetFacilityCount = 2
    closest_facility.routeShapeType = nax.RouteShapeType.TrueShapeWithMeasures
    closest_facility.load(nax.ClosestFacilityInputDataType.Facilities, input_facilities)
    closest_facility.load(nax.ClosestFacilityInputDataType.Incidents, input_incidents)
    result = closest_facility.solve()
    if result.solveSucceeded:
        result.export(nax.ClosestFacilityOutputDataType.Routes, output_routes)
    else:
        print("Solved failed")
        print(result.solverMessages())

    """

    # Prevent adding unsupported attributes to class instances
    __slots__ = ()

    def __init__(self, in_network):
        """Create a closest facility solver object based on the input network dataset.

        Args:
                in_network: A string representing the full catalog path to the network dataset, a network dataset
                            layer object, a string representing the name of a network dataset layer, or a portal URL
                            for a network analysis service. For best performance pass a network dataset layer object
                            or a network dataset layer name.

        Returns:
                No value.

        Raises:
                ValueError if the in_network does not exist or cannot be opened or if you are not signed in to the
                portal.

        """
        super().__init__(in_network)
