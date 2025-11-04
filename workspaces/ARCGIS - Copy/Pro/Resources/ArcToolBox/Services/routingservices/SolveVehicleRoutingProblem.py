"""Performs vrp analysis."""  # File name is based on the tool name. pylint:disable=invalid-name

import logging
import json
import time

import arcpy
import nat
import nast
import svrp

LOG_LEVEL = logging.INFO  # log level for the tool.


class GPToolDialog(nat.NAToolExecutor):
    """Read parameter values from the tool dialog and perform tool execution."""

    # Define empty solts since the base class has slots
    __slots__ = ("TOOL_NAME", )

    def __init__(self, log_level=logging.INFO, tool_name="SolveVehicleRoutingProblem"):
        """Call the executor.

        Args:
            log_level: The log level for the tool logger. Default is to log messages at info level which suppress any
                       information used for debugging the tool.
        Returns:
            No value.
        Raises:
            No exception.

        """
        self.TOOL_NAME = tool_name
        nast.SERVER_PERF_METRICS["Component"] = "GPServer"
        nast.SERVER_PERF_METRICS["StartTime"] = time.time()
        # Set up the class logger
        super(GPToolDialog, self).__init__(log_level)
        # Setup the logger for core execution class.
        svrp.SolveVehicleRoutingProblem.logger = self.logger
        svrp.SolveVehicleRoutingProblem.tool_name = tool_name
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
            "breaks": arcpy.GetParameter(3),
            "time_units": arcpy.GetParameterAsText(4),
            "distance_units": arcpy.GetParameterAsText(5),
            "Network_Datasets": nast.time_exec(arcpy.GetParameterAsText)(6),
            # "Network_Datasets": nast.time_exec(arcpy.GetParameter)(6),
            "Network_Dataset_Extents": arcpy.GetParameterAsText(7),
            "analysis_region": arcpy.GetParameterAsText(8),
            "default_date": arcpy.GetParameter(9),
            "uturn_policy": arcpy.GetParameterAsText(10),
            "time_window_factor": arcpy.GetParameterAsText(11),
            "spatially_cluster_routes": arcpy.GetParameter(12),
            "route_zones": arcpy.GetParameter(13),
            "route_renewals": arcpy.GetParameter(14),
            "order_pairs": arcpy.GetParameter(15),
            "excess_transit_factor": arcpy.GetParameterAsText(16),
            "point_barriers": arcpy.GetParameter(17),
            "line_barriers": arcpy.GetParameter(18),
            "polygon_barriers": arcpy.GetParameter(19),
            "use_hierarchy_in_analysis": arcpy.GetParameter(20),
            "restrictions": arcpy.GetParameter(21),
            "attribute_parameter_values": arcpy.GetParameter(22),
            "populate_route_lines": arcpy.GetParameter(23),
            "route_line_simplification_tolerance": arcpy.GetParameterAsText(24),
            "populate_directions": arcpy.GetParameter(25),
            "directions_language": arcpy.GetParameterAsText(26),
            "directions_style_name": arcpy.GetParameterAsText(27),
            "travel_mode": arcpy.GetParameter(28),
            "impedance": arcpy.GetParameterAsText(29),
            "time_zone_usage_for_time_fields": arcpy.GetParameterAsText(30),
            "save_output_network_analysis_layer": arcpy.GetParameter(31),
            "overrides": arcpy.GetParameterAsText(32),
            "save_route_data": arcpy.GetParameter(33),
            "time_impedance": arcpy.GetParameterAsText(34),
            "distance_impedance": arcpy.GetParameterAsText(35),
            "populate_stop_shapes": arcpy.GetParameter(36),
            "output_format": arcpy.GetParameterAsText(37),
            "output_geodatabase": arcpy.GetParameterAsText(38),
            "output_names": arcpy.GetParameter(39),
            "ignore_invalid_order_locations": arcpy.GetParameter(40),
            "ignore_network_location_fields": arcpy.GetParameter(41),
            "analysis_limits": arcpy.GetParameter(42),
            "locate_settings": arcpy.GetParameterAsText(43),
        }
        # Call core execution logic
        solve_succeeded_param_index = 48
        tool = None
        try:
            tool = svrp.SolveVehicleRoutingProblem(**param_values)
            tool.execute()
            arcpy.SetParameterAsText(44, tool.output_unassigned_stops)
            arcpy.SetParameterAsText(45, tool.output_stops)
            arcpy.SetParameterAsText(46, tool.output_routes)
            arcpy.SetParameterAsText(47, tool.output_directions)
            arcpy.SetParameterAsText(49, tool.output_layer_file)
            arcpy.SetParameterAsText(50, tool.output_route_data_file)
            arcpy.SetParameterAsText(51, tool.output_result_file)
            arcpy.SetParameterAsText(52, tool.output_layer_package)
            arcpy.SetParameterAsText(53, tool.usage_cost)
            arcpy.SetParameter(solve_succeeded_param_index, tool.solve_succeeded)
        except nat.ToolExit:
            arcpy.SetParameter(solve_succeeded_param_index, False)
            self.logger.debug("Exception details:", exc_info=True)
            raise SystemExit(1) from None
        except Exception:  # Need to handle any exception. pylint:disable=broad-except
            arcpy.SetParameter(solve_succeeded_param_index, False)
            self.logger.info("Exception details:", exc_info=True)
            self.logger.error("", extra={"message_ID": 30206})
            self.logger.error("", exc_info=True, extra={
                "code": 30206,
                "method_name": svrp.SolveVehicleRoutingProblem.tool_name
                })
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
