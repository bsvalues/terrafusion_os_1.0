"""Module for working with Last Mile Delivery Solver."""

from enum import IntEnum
from arcgisscripting import na as cna  # pylint:disable=no-name-in-module

# List of names exported from this module
__all__ = ["LastMileDeliveryInputDataType", "LastMileDeliveryOutputDataType",
           "LastMileDelivery"]


class LastMileDeliveryInputDataType(IntEnum):
    """Enumeration of input types for the LastMileDelivery solver."""

    Orders = 200
    Depots = 201
    Routes = 202
    OrderSpecialties = 203
    RouteSpecialties = 204
    Zones = 205
    PointBarriers = 206
    LineBarriers = 207
    PolygonBarriers = 208


class LastMileDeliveryOutputDataType(IntEnum):
    """Enumeration of output types for the LastMileDelivery solver."""

    Orders = 250
    Depots = 251
    DepotVisits = 252
    Routes = 253
    DirectionPoints = 254
    DirectionLines = 255

class LastMileDelivery(cna.LastMileDelivery):
    """Perform Last Mile Delivery analysis.

    # A last mile delivery analysis allows you to optimize the delivery of packages to end customers.

    # An example showing how to perform last mile delivery analysis using inputs
    # from feature classes and tables:
    import datetime
    import arcpy
    arcpy.CheckOutExtension("network")

    nds = "C:/data/NorthAmerica.gdb/Routing/Routing_ND"
    nd_layer_name = "Routing_ND"
    input_orders = "C:/data/io.gdb/Orders"
    input_depots = "C:/data/io.gdb/Depots"
    input_routes = "C:/data/io.gdb/Vehicles"
    output_orders = "C:/data/io.gdb/OutputOrders"
    output_routes = "C:/data/io.gdb/OutputRoutes"
    output_direction_points = "C:/data/io.gdb/OutputDirectionPoints"
    output_direction_lines = "C:/data/io.gdb/OutputDirectionLines"

    # Create a network dataset layer and get the desired travel mode for analysis
    arcpy.nax.MakeNetworkDatasetLayer(nds, nd_layer_name)
    nd_travel_modes = arcpy.nax.GetTravelModes(nd_layer_name)
    travel_mode = nd_travel_modes["Driving Time"]

    # Instantiate a LastMileDelivery solver object
    last_mile = arcpy.nax.LastMileDelivery(nd_layer_name)
    # Set properties
    last_mile.travelMode = travel_mode
    last_mile.earliestRouteStartDate = datetime.date(2024, 6, 3)
    last_mile.earliestRouteStartTime = datetime.time(8, 0, 0)
    last_mile.timeUnits = arcpy.nax.TimeUnits.Hours
    last_mile.maxRouteTotalTime = 8  # hours
    last_mile.returnDirections = True
    # Load inputs
    last_mile.load(arcpy.nax.LastMileDeliveryInputDataType.Orders, input_orders)
    last_mile.load(arcpy.nax.LastMileDeliveryInputDataType.Depots, input_depots)
    last_mile.load(arcpy.nax.LastMileDeliveryInputDataType.Routes, input_routes)
    # Solve the analysis
    result = last_mile.solve()

    # Export the results to feature classes
    if result.solveSucceeded:
        result.export(arcpy.nax.LastMileDeliveryOutputDataType.Orders, output_orders)
        result.export(arcpy.nax.LastMileDeliveryOutputDataType.Routes, output_routes)
        result.export(arcpy.nax.LastMileDeliveryOutputDataType.DirectionPoints, output_direction_points)
        result.export(arcpy.nax.LastMileDeliveryOutputDataType.DirectionLines, output_direction_lines)
    else:
        print("Solve failed")
        print(result.solverMessages(arcpy.nax.MessageSeverity.All))

    """

    # Prevent adding unsupported attributes to class instances
    __slots__ = ()

    def __init__(self, in_network):
        """Create a LastMileDelivery solver object based on the input network dataset.

        Args:
                in_network: The network dataset or service that will be used for the network analysis. The argument can
                    be specified using one of the following options:
                        - The catalog path to the network dataset
                        - A network dataset layer object
                        - The string name of the network dataset layer
                        - A NetworkDataset object
                        - The URL for ArcGIS Online or an ArcGIS Enterprise portal with routing services
                        - A dictionary specifying connection information for a routing service on a stand-alone ArcGIS
                            Server site
                    The network must have at least one travel mode, at least one cost attribute with time units, at
                    least one cost attribute with distance units, and a time zone attribute. To use a portal URL, you
                    must be signed in to the portal with an account that has routing privileges. When using ArcGIS
                    Online or an ArcGIS Enterprise portal whose routing services are configured using ArcGIS Online as
                    the in_network value, solving the analysis will consume credits and will be subject to certain
                    limits, such as the number of allowed inputs.

        Returns:
                No value.

        Raises:
                ValueError if the in_network is a network dataset that does not exist, cannot be opened, or does not
                    have the required characteristics
                ValueError if the in_network is a portal URL and you are not signed in to the portal, do not have
                    routing privileges or credits, or the portal does not have a Last Mile Delivery service configured.

        """
        super().__init__(in_network)
