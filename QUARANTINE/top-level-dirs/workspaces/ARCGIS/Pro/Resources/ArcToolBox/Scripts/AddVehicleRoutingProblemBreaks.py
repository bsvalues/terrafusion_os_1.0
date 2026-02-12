"""Main module providing the entry point for execution of the Add Vehicle Routing Problem Breaks tool."""
import arcpy
import logging
import avrpb
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
    avrpb.LOGGER = LOGGER


def add_vehicle_routing_problem_breaks():
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
    target_route = arcpy.GetParameter(1)
    break_type = arcpy.GetParameter(2)
    time_window_properties = arcpy.GetParameter(3)
    travel_time_properties = arcpy.GetParameter(4)
    work_time_properties = arcpy.GetParameter(5)
    append_to_existing_breaks = arcpy.GetParameter(6)

    try:
        tool = avrpb.AddVehicleRoutingProblemBreaks(in_vrp_layer, target_route, break_type, time_window_properties,
                                                    travel_time_properties, work_time_properties,
                                                    append_to_existing_breaks)
        tool.execute()
        arcpy.SetParameterAsText(7, tool.in_vrp_layer)
    except nat.ToolExit:
        LOGGER.debug("Exception details:", exc_info=True)
    except Exception:  # pylint:disable=broad-except
        LOGGER.error("", extra={"message_ID": 30206})
        LOGGER.debug("Exception details:", exc_info=True)


if __name__ == "__main__":
    _setup_logger()
    add_vehicle_routing_problem_breaks()
