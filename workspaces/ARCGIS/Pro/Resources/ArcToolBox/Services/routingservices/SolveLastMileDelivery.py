"""Performs last mile delivery analysis."""  # File name is based on the tool name. pylint:disable=invalid-name

import logging
import json
import time

import arcpy
import nat
import nast
import slmd

LOG_LEVEL = logging.INFO  # log level for the tool.


class GPToolDialog(nat.NAToolExecutor):
    """Read parameter values from the tool dialog and perform tool execution."""

    # Define empty solts since the base class has slots
    __slots__ = ()
    TOOL_NAME = "SolveLastMileDelivery"

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
        slmd.SolveLastMileDelivery.logger = self.logger
        # Perform tool execution
        self.execute()

    @nat.time_exec
    def execute(self):
        """Read parameter values and perform tool execution."""
        # Read parameter values
        param_values = {
            "orders": arcpy.GetParameter(0),
            "depots": arcpy.GetParameter(1),
            "routes": arcpy.GetParameter(2),
            "network_datasets": nast.time_exec(arcpy.GetParameterAsText)(3),
            "network_dataset_extents": arcpy.GetParameterAsText(4),
            "travel_mode": arcpy.GetParameter(5),
            "earliest_route_start_date": arcpy.GetParameter(6),
            "earliest_route_start_time": arcpy.GetParameter(7),
            "max_route_total_time": arcpy.GetParameter(8),
            "sequence_gap": arcpy.GetParameter(9),
            "time_units": arcpy.GetParameter(10),
            "distance_units": arcpy.GetParameter(11),
            "time_zone_usage_for_time_fields": arcpy.GetParameter(12),
            "order_specialties": arcpy.GetParameter(13),
            "route_specialties": arcpy.GetParameter(14),
            "zones": arcpy.GetParameter(15),
            "point_barriers": arcpy.GetParameter(16),
            "line_barriers": arcpy.GetParameter(17),
            "polygon_barriers": arcpy.GetParameter(18),
            "locate_settings": arcpy.GetParameter(19),
            "ignore_invalid_order_locations": arcpy.GetParameter(20),
            "ignore_network_location_fields": arcpy.GetParameter(21),
            "route_shape": arcpy.GetParameter(22),
            "populate_directions": arcpy.GetParameter(23),
            "directions_language": arcpy.GetParameter(24),
            "save_route_data": arcpy.GetParameter(25),
            "save_output_network_analysis_layer": arcpy.GetParameter(26),
            "output_format": arcpy.GetParameter(27),
            "overrides": arcpy.GetParameter(28),
            "analysis_region": arcpy.GetParameter(29),
            "analysis_limits": arcpy.GetParameter(30),
            "output_geodatabase": arcpy.GetParameterAsText(31),
            "output_names": arcpy.GetParameter(32),
        }
        # Call core execution logic
        tool = None
        try:
            tool = slmd.SolveLastMileDelivery(**param_values)
            tool.execute()
            arcpy.SetParameterAsText(33, tool.output_orders)
            arcpy.SetParameterAsText(34, tool.output_routes)
            arcpy.SetParameterAsText(35, tool.output_depots)
            arcpy.SetParameterAsText(36, tool.output_depot_visits)
            arcpy.SetParameterAsText(37, tool.output_direction_points)
            arcpy.SetParameterAsText(38, tool.output_direction_lines)
            arcpy.SetParameterAsText(39, tool.output_route_data_file)
            arcpy.SetParameterAsText(40, tool.output_result_file)
            arcpy.SetParameterAsText(41, tool.output_layer_package)
            arcpy.SetParameterAsText(42, tool.usage_cost)
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
