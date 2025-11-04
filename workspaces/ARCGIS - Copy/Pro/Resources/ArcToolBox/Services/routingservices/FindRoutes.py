"""Performs route analysis."""  # File name is based on the tool name. pylint:disable=invalid-name

import logging
import json
import time

import arcpy
import nat
import nast
import fr

LOG_LEVEL = logging.INFO  # log level for the tool.


class GPToolDialog(nat.NAToolExecutor):
    """Read parameter values from the tool dialog and perform tool execution."""

    # Define empty solts since the base class has slots
    __slots__ = ()
    TOOL_NAME = "FindRoutes"

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
        fr.FindRoutes.logger = self.logger
        # Perform tool execution
        self.execute()

    @nat.time_exec
    def execute(self):
        """Read parameter values and perform tool execution."""
        # Read parameter values
        param_values = {
            "Stops": arcpy.GetParameter(0),
            "Measurement_Units": arcpy.GetParameterAsText(1),
            "Network_Datasets": nast.time_exec(arcpy.GetParameterAsText)(2),
            # "Network_Datasets": nast.time_exec(arcpy.GetParameter)(2),
            "Network_Dataset_Extents": arcpy.GetParameterAsText(3),
            "Analysis_Region": arcpy.GetParameterAsText(4),
            "Reorder_Stops_to_Find_Optimal_Routes": arcpy.GetParameter(5),
            "Preserve_Terminal_Stops": arcpy.GetParameter(6),
            "Return_to_Start": arcpy.GetParameter(7),
            "Use_Time_Windows": arcpy.GetParameter(8),
            "Time_of_Day": arcpy.GetParameter(9),
            "Time_Zone_for_Time_of_Day": arcpy.GetParameterAsText(10),
            "Uturn_at_Junctions": arcpy.GetParameterAsText(11),
            "Point_Barriers": arcpy.GetParameter(12),
            "Line_Barriers": arcpy.GetParameter(13),
            "Polygon_Barriers": arcpy.GetParameter(14),
            "Use_Hierarchy": arcpy.GetParameter(15),
            "Restrictions": arcpy.GetParameter(16),
            "Attribute_Parameter_Values": arcpy.GetParameter(17),
            "Route_Shape": arcpy.GetParameterAsText(18),
            "Route_Line_Simplification_Tolerance": arcpy.GetParameterAsText(19),
            "Populate_Route_Edges": arcpy.GetParameter(20),
            "Populate_Directions": arcpy.GetParameter(21),
            "Directions_Language": arcpy.GetParameterAsText(22),
            "Directions_Distance_Units": arcpy.GetParameterAsText(23),
            "Directions_Style_Name": arcpy.GetParameterAsText(24),
            "Travel_Mode": arcpy.GetParameter(25),
            "Impedance": arcpy.GetParameterAsText(26),
            "Time_Zone_for_Time_Windows": arcpy.GetParameterAsText(27),
            "Save_Output_Network_Analysis_Layer": arcpy.GetParameter(28),
            "Overrides": arcpy.GetParameterAsText(29),
            "Save_Route_Data": arcpy.GetParameter(30),
            "Time_Impedance": arcpy.GetParameterAsText(31),
            "Distance_Impedance": arcpy.GetParameterAsText(32),
            "Output_Format": arcpy.GetParameterAsText(33),
            "Accumulate_Attributes": arcpy.GetParameter(34),
            "Output_Geodatabase": arcpy.GetParameterAsText(35),
            "Output_Names": arcpy.GetParameter(36),
            "Ignore_Network_Location_Fields": arcpy.GetParameter(37),
            "Analysis_Limits": arcpy.GetParameter(38),
            "Ignore_Invalid_Locations": arcpy.GetParameter(39),
            "Locate_Settings": arcpy.GetParameterAsText(40),
        }
        # Call core execution logic
        solve_succeeded_param_index = 41
        tool = None
        try:
            tool = fr.FindRoutes(**param_values)
            tool.execute()
            arcpy.SetParameterAsText(42, tool.output_routes)
            arcpy.SetParameterAsText(43, tool.output_route_edges)
            arcpy.SetParameterAsText(44, tool.output_directions)
            arcpy.SetParameterAsText(45, tool.output_stops)
            arcpy.SetParameterAsText(46, tool.output_layer_file)
            arcpy.SetParameterAsText(47, tool.output_route_data_file)
            arcpy.SetParameterAsText(48, tool.output_result_file)
            arcpy.SetParameterAsText(49, tool.output_layer_package)
            arcpy.SetParameterAsText(50, tool.output_direction_points)
            arcpy.SetParameterAsText(51, tool.output_direction_lines)
            arcpy.SetParameterAsText(52, tool.usage_cost)
            arcpy.SetParameter(solve_succeeded_param_index, tool.solve_succeeded)
        except nat.ToolExit:
            arcpy.SetParameter(solve_succeeded_param_index, False)
            self.logger.debug("Exception details:", exc_info=True)
            raise SystemExit(1) from None
        except Exception:  # Need to handle any exception. pylint:disable=broad-except
            arcpy.SetParameter(solve_succeeded_param_index, False)
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
