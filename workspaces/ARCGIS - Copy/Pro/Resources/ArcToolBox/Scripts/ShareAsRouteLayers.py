"""Main module providing the entry point for execution of the Share As Route Layers tool."""

import logging
import arcpy
import sarl
import nat

LOGGER = logging.getLogger(__name__)
LOG_LEVEL = logging.INFO


def _setup_logger():
    """Set the logger used by the module by adding appropriate handlers.

    Args:
        No arguments.
    Returns:
        No return value.
    Raises:
        No exceptions.

    """
    LOGGER.setLevel(LOG_LEVEL)
    # Add the GPMessageHandler in case the logger is not initialized with one
    if not LOGGER.hasHandlers():
        gp_msg_handler = nat.GPMessageHandler()
        gp_msg_handler.setLevel(LOG_LEVEL)
        LOGGER.addHandler(gp_msg_handler)
    sarl.LOGGER = LOGGER


def share_as_route_layers():
    """Read parameter values from the tool dialog and performs tool execution.

    Args:
        No arguments.
    Returns:
        No return value.
    Raises:
        No execeptions.

    """
    # Read parameter values
    analysis_input = arcpy.GetParameter(0)
    parameter_values = [arcpy.GetParameterAsText(param_index) for param_index in range(1, 6)]
    parameter_values = [analysis_input] + parameter_values + [arcpy.GetParameter(6)]

    try:
        tool = sarl.ShareAsRouteLayers(*parameter_values)
        tool.execute()
        arcpy.SetParameterAsText(7, tool.output_route_layers)
    except nat.ToolExit:
        tool.delete_intermediate_data()
    except Exception:  # pylint:disable=broad-except
        tool.delete_intermediate_data()
        LOGGER.error("", extra={"message_ID": 30206})
        LOGGER.debug("Exception details:", exc_info=True)


if __name__ == "__main__":
    _setup_logger()
    share_as_route_layers()
