"""Module for working with Location-Allocation Solver."""

from enum import IntEnum
from arcgisscripting import na as cna  # pylint:disable=no-name-in-module

# List of names exported from this module
__all__ = ["LocationAllocationInputDataType", "LocationAllocationOutputDataType", "LocationAllocationProblemType",
           "DecayFunctionType", "LocationAllocation"]


class LocationAllocationInputDataType(IntEnum):
    """Enumeration for feature class names used by the Location-Allocation solver to store inputs."""

    Facilities = 0
    DemandPoints = 1
    PointBarriers = 2
    LineBarriers = 3
    PolygonBarriers = 4


class LocationAllocationOutputDataType(IntEnum):
    """Enumeration for feature class names used by the Location-Allocation solver to store outputs."""

    Facilities = 0
    DemandPoints = 1
    Lines = 2


class LocationAllocationProblemType(IntEnum):
    """Enumeration for the problem type solved using location-allocation analysis."""

    MaximizeAttendance = 0
    MaximizeCapacitatedCoverage = 1
    MaximizeCoverage = 2
    MaximizeMarketShare = 3
    MinimizeFacilities = 4
    MinimizeImpedance = 5
    TargetMarketShare = 6


class DecayFunctionType(IntEnum):
    """Enumeration for the type of equation used to transform costs during location-allocation analysis."""

    Linear = 0
    Power = 1
    Exponential = 2


class LocationAllocation(cna.LocationAllocation):
    """Perform location-allocation analysis.

    # An example showing how to perform location-allocation analysis using inputs from feature classes.
    import arcpy
    import arcpy._na as nax

    nds = "C:/data/NorthAmerica.gdb/Routing/Routing_ND"
    nd_layer_name = "Routing_ND"
    input_facilities = "C:/data/io.gdb/Facilities"
    input_demand_points = "C:/data/io.gdb/DemandPoints"
    output_lines = "C:/data/io.gdb/AllocationLines"

    arcpy.CheckOutExtension("network")
    arcpy.na.MakeNetworkDatasetLayer(nds, nd_layer_name)
    nd_travel_modes = arcpy.na.GetTravelModes(nd_layer_name)
    travel_mode = nd_travel_modes["Driving Time"]
    loc_alloc = nax.LocationAllocation(nd_layer_name)
    loc_alloc.travelMode = travel_mode
    loc_alloc.travelDirecton = nax.TravelDirection.ToFacility
    loc_alloc.problemType = nax.LocationAllocationProblemType.MinimizeImpedance
    loc_alloc.facilityCount = 3
    loc_alloc.defaultImpedanceCutoff = 15
    loc_alloc.lineShapeType = nax.LineShapeType.StraightLine
    loc_alloc.load(nax.LocationAllocationInputDataType.Facilities, input_facilities)
    loc_alloc.load(nax.LocationAllocationInputDataType.DemandPoints, input_demand_points)
    result = loc_alloc.solve()
    if result.solveSucceeded:
        result.export(nax.LocationAllocationOutputDataType.Lines, output_lines)
    else:
        print("Solved failed")
        print(result.solverMessages())

    """

    # Prevent adding unsupported attributes to class instances
    __slots__ = ()

    def __init__(self, in_network):
        """Create a location-allocation solver object based on the input network dataset.

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
