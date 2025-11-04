"""Snaps GPS points to streets based on travel mode."""  # File name is based on the tool name. pylint:disable=invalid-name

import logging
import json
import time

import arcpy
import nat
import nast
import stor

LOG_LEVEL = logging.INFO  # log level for the tool.


class GPToolDialog(nat.NAToolExecutor):
    """Read parameter values from the tool dialog and perform tool execution."""

    # Define empty solts since the base class has slots
    __slots__ = ()
    TOOL_NAME = "SnapToRoads"

    def __init__(self, log_level=logging.INFO):
        """Call the executor.

        Args:
            log_level: The log level for the tool logger. Default is to log messages at info level which suppress any
                       information used for debugging the tool.
        Returns:
            No value.
        Raises:
            No exception.

        """
        nast.SERVER_PERF_METRICS["Component"] = "GPServer"
        nast.SERVER_PERF_METRICS["StartTime"] = time.time()
        # Set up the class logger
        super(GPToolDialog, self).__init__(log_level)
        # Setup the logger for core execution class.
        stor.SnapToRoads.logger = self.logger
        # Perform tool execution
        self.execute()

    @nat.time_exec
    def execute(self):
        """Read parameter values and perform tool execution."""
        # Read parameter values
        param_values = {
            "points": arcpy.GetParameter(0),
            "network_datasets": nast.time_exec(arcpy.GetParameterAsText)(1),
            "network_dataset_extents": arcpy.GetParameterAsText(2),
            "road_properties": arcpy.GetParameter(3),
            "travel_mode": arcpy.GetParameter(4),
            "return_lines": arcpy.GetParameter(5),
            "road_properties_on_snapped_points": arcpy.GetParameter(6),
            "road_properties_on_lines": arcpy.GetParameter(7),
            "return_location_fields": arcpy.GetParameter(8),
            "overrides": arcpy.GetParameter(9),
            "analysis_region": arcpy.GetParameter(10),
            "analysis_limits": arcpy.GetParameter(11),
            "output_geodatabase": arcpy.GetParameterAsText(12),
            "output_names": arcpy.GetParameter(13),
        }
        # Call core execution logic
        tool = None
        try:
            tool = stor.SnapToRoads(**param_values)
            tool.execute()
            arcpy.SetParameterAsText(14, tool.output_snapped_points)
            arcpy.SetParameterAsText(15, tool.output_lines)
            arcpy.SetParameterAsText(16, tool.usage_cost)
        except nat.ToolExit:
            self.logger.debug("Exception details:", exc_info=True)
            raise SystemExit(1) from None
        except Exception:  # Need to handle any exception. pylint:disable=broad-except
            self.logger.info("Exception details:", exc_info=True)
            self.logger.error("", extra={"message_ID": 30206})
            self.logger.error("", exc_info=True, extra={"code": 30206, "method_name": self.TOOL_NAME})
            raise SystemExit(10) from None
        finally:
            # Delete solver object
            if hasattr(tool, "cleanup"):
                tool.cleanup()
            if nast.TIMER_MSGS:
                self.logger.info(json.dumps(nast.TIMER_MSGS, indent=None))
                nast.TIMER_MSGS.clear()
            nast.SERVER_PERF_METRICS["EndTime"] = time.time()
            nast.log_server_perf_metrics(self, tool)


if __name__ == "__main__":
    GPToolDialog(LOG_LEVEL)
