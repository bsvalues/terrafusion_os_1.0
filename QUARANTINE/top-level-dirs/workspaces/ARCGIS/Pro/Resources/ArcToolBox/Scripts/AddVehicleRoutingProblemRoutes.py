"""Main module providing the entry point for execution of the Add Vehicle Routing Problem Routes tool."""
import arcpy
import logging
import avrpr
import nat

LOGGER = logging.getLogger(__name__)
LOG_LEVEL = logging.INFO


def _setup_logger():
    """Set the logger used by the module by adding approriate handlers.

    Args:
        No arguments.
    Returns:
        No return value.
    Raises:
        No execeptions.

    """
    LOGGER.setLevel(LOG_LEVEL)
    # Add the GPMessageHandler in case the logger is not initialized with one
    if not LOGGER.hasHandlers():
        gp_msg_handler = nat.GPMessageHandler()
        gp_msg_handler.setLevel(LOG_LEVEL)
        LOGGER.addHandler(gp_msg_handler)
    avrpr.LOGGER = LOGGER


def add_vehicle_routing_problem_routes():
    """Read parameter values from the tool dialog and performs tool execution.

    Args:
        No arguments.
    Returns:
        No return value.
    Raises:
        No execeptions.

    """
    # Read the parameter values
    in_vrp_layer = arcpy.GetParameterAsText(0)
    number_of_routes = arcpy.GetParameter(1)
    route_name_prefix = arcpy.GetParameterAsText(2)
    start_depot_name = arcpy.GetParameterAsText(3)
    end_depot_name = arcpy.GetParameterAsText(4)
    earliest_start_time = arcpy.GetParameter(5)
    latest_start_time = arcpy.GetParameter(6)
    # GetParameter() returns 0 for null optional Long parameters instead of None.  Avoid that.
    # See https://devtopia.esri.com/ArcGISPro/geoprocessing/issues/7442
    max_order_count = arcpy.GetParameterAsText(7)
    max_order_count = None if not max_order_count else arcpy.GetParameter(7)
    capacities = arcpy.GetParameter(8)
    route_constraints = arcpy.GetParameter(9)
    costs = arcpy.GetParameter(10)
    additional_route_time = arcpy.GetParameter(11)
    append_to_existing_routes = arcpy.GetParameter(12)
    date_and_time = arcpy.GetParameter(14)

    try:
        tool = avrpr.AddVehicleRoutingProblemRoutes(in_vrp_layer, number_of_routes, route_name_prefix, start_depot_name,
                                                    end_depot_name, earliest_start_time, latest_start_time,
                                                    max_order_count, capacities, route_constraints, costs,
                                                    additional_route_time, append_to_existing_routes, date_and_time)
        tool.execute()
        arcpy.SetParameterAsText(13, tool.in_vrp_layer)
    except nat.ToolExit:
        LOGGER.debug("Exception details:", exc_info=True)
    except Exception:  # pylint:disable=broad-except
        LOGGER.error("", extra={"message_ID": 30206})
        LOGGER.debug("Exception details:", exc_info=True)


if __name__ == "__main__":
    _setup_logger()
    add_vehicle_routing_problem_routes()
