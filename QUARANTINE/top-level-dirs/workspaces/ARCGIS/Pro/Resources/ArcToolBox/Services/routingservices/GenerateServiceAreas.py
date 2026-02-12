"""Performs service area analysis."""  # File name is based on the tool name. pylint:disable=invalid-name

import logging
import json
import time

import arcpy
import nat
import nast
import gsa

LOG_LEVEL = logging.INFO  # log level for the tool.


class GPToolDialog(nat.NAToolExecutor):
    """Read parameter values from the tool dialog and perform tool execution."""

    # Define empty solts since the base class has slots
    __slots__ = ()
    TOOL_NAME = "GenerateServiceAreas"

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
        gsa.GenerateServiceAreas.logger = self.logger
        # Perform tool execution
        self.execute()

    @nat.time_exec
    def execute(self):
        """Read parameter values and perform tool execution."""
        # Read parameter values
        param_values = {
            "Facilities": arcpy.GetParameter(0),
            "Break_Values": arcpy.GetParameterAsText(1),
            "Break_Units": arcpy.GetParameterAsText(2),
            "Network_Datasets": nast.time_exec(arcpy.GetParameterAsText)(3),
            # "Network_Datasets": nast.time_exec(arcpy.GetParameter)(3),
            "Network_Dataset_Extents": arcpy.GetParameterAsText(4),
            "Analysis_Region": arcpy.GetParameterAsText(5),
            "Travel_Direction": arcpy.GetParameterAsText(6),
            "Time_of_Day": arcpy.GetParameter(7),
            "Use_Hierarchy": arcpy.GetParameter(8),
            "Uturn_at_Junctions": arcpy.GetParameterAsText(9),
            "Polygons_for_Multiple_Facilities": arcpy.GetParameterAsText(10),
            "Polygon_Overlap_Type": arcpy.GetParameterAsText(11),
            "Detailed_Polygons": arcpy.GetParameter(12),
            "Polygon_Trim_Distance": arcpy.GetParameterAsText(13),
            "Polygon_Simplification_Tolerance": arcpy.GetParameterAsText(14),
            "Point_Barriers": arcpy.GetParameter(15),
            "Line_Barriers": arcpy.GetParameter(16),
            "Polygon_Barriers": arcpy.GetParameter(17),
            "Restrictions": arcpy.GetParameter(18),
            "Attribute_Parameter_Values": arcpy.GetParameter(19),
            "Time_Zone_for_Time_of_Day": arcpy.GetParameterAsText(20),
            "Travel_Mode": arcpy.GetParameter(21),
            "Impedance": arcpy.GetParameterAsText(22),
            "Save_Output_Network_Analysis_Layer": arcpy.GetParameter(23),
            "Overrides": arcpy.GetParameterAsText(24),
            "Time_Impedance": arcpy.GetParameterAsText(25),
            "Distance_Impedance": arcpy.GetParameterAsText(26),
            "Polygon_Detail": arcpy.GetParameterAsText(27),
            "Output_Type": arcpy.GetParameterAsText(28),
            "Output_Format": arcpy.GetParameterAsText(29),
            "Exclude_Sources_from_Polygon_Generation": arcpy.GetParameter(30),
            "Accumulate_Attributes": arcpy.GetParameter(31),
            "Output_Geodatabase": arcpy.GetParameterAsText(32),
            "Output_Names": arcpy.GetParameter(33),
            "Ignore_Network_Location_Fields": arcpy.GetParameter(34),
            "Analysis_Limits": arcpy.GetParameter(35),
            "Ignore_Invalid_Locations": arcpy.GetParameter(36),
            "Locate_Settings": arcpy.GetParameterAsText(37),
        }
        # Call core execution logic
        solve_succeeded_param_index = 39
        tool = None
        try:
            tool = gsa.GenerateServiceAreas(**param_values)
            tool.execute()
            arcpy.SetParameterAsText(38, tool.output_polygons)
            arcpy.SetParameterAsText(40, tool.output_layer_file)
            arcpy.SetParameterAsText(41, tool.output_facilities)
            arcpy.SetParameterAsText(42, tool.output_lines)
            arcpy.SetParameterAsText(43, tool.output_result_file)
            arcpy.SetParameterAsText(44, tool.output_layer_package)
            arcpy.SetParameterAsText(45, tool.usage_cost)
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
                # self.logger.info("", extra={
                #     "message_ID": 30211,
                #     "add_argument1": json.dumps(nast.TIMER_MSGS, indent=None)
                # })
                self.logger.info(json.dumps(nast.TIMER_MSGS, indent=None))
                nast.TIMER_MSGS.clear()
            nast.SERVER_PERF_METRICS["EndTime"] = time.time()
            nast.log_server_perf_metrics(self, tool)


if __name__ == "__main__":
    GPToolDialog(LOG_LEVEL)
