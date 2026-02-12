"""Performs od cost matrix analysis."""  # File name is based on the tool name. pylint:disable=invalid-name

import logging
import json
import time

import arcpy
import nat
import nast
import godcm

LOG_LEVEL = logging.INFO  # log level for the tool.


class GPToolDialog(nat.NAToolExecutor):
    """Read parameter values from the tool dialog and perform tool execution."""

    # Define empty solts since the base class has slots
    __slots__ = ()
    TOOL_NAME = "GenerateOriginDestinationCostMatrix"

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
        godcm.GenerateOriginDestinationCostMatrix.logger = self.logger
        # Perform tool execution
        self.execute()

    @nat.time_exec
    def execute(self):
        """Read parameter values and perform tool execution."""
        # Read parameter values
        param_values = {
            "Origins": arcpy.GetParameter(0),
            "Destinations": arcpy.GetParameter(1),
            "Network_Datasets": nast.time_exec(arcpy.GetParameterAsText)(2),
            # "Network_Datasets": nast.time_exec(arcpy.GetParameter)(2),
            "Network_Dataset_Extents": arcpy.GetParameterAsText(3),
            "Travel_Mode": arcpy.GetParameter(4),
            "Time_Units": arcpy.GetParameterAsText(5),
            "Distance_Units": arcpy.GetParameterAsText(6),
            "Analysis_Region": arcpy.GetParameterAsText(7),
            "Number_of_Destinations_to_Find": arcpy.GetParameterAsText(8),
            "Cutoff": arcpy.GetParameterAsText(9),
            "Time_of_Day": arcpy.GetParameter(10),
            "Time_Zone_for_Time_of_Day": arcpy.GetParameterAsText(11),
            "Point_Barriers": arcpy.GetParameter(12),
            "Line_Barriers": arcpy.GetParameter(13),
            "Polygon_Barriers": arcpy.GetParameter(14),
            "Uturn_at_Junctions": arcpy.GetParameterAsText(15),
            "Use_Hierarchy": arcpy.GetParameter(16),
            "Restrictions": arcpy.GetParameter(17),
            "Attribute_Parameter_Values": arcpy.GetParameter(18),
            "Impedance": arcpy.GetParameterAsText(19),
            "Origin_Destination_Line_Shape": arcpy.GetParameterAsText(20),
            "Save_Output_Network_Analysis_Layer": arcpy.GetParameter(21),
            "Overrides": arcpy.GetParameterAsText(22),
            "Time_Impedance": arcpy.GetParameterAsText(23),
            "Distance_Impedance": arcpy.GetParameterAsText(24),
            "Output_Format": arcpy.GetParameterAsText(25),
            "Accumulate_Attributes": arcpy.GetParameter(26),
            "Output_Geodatabase": arcpy.GetParameterAsText(27),
            "Output_Names": arcpy.GetParameter(28),
            "Ignore_Network_Location_Fields": arcpy.GetParameter(29),
            "Analysis_Limits": arcpy.GetParameter(30),
            "Ignore_Invalid_Locations": arcpy.GetParameter(31),
            "Locate_Settings": arcpy.GetParameterAsText(32),
        }
        # Call core execution logic
        solve_succeeded_param_index = 33
        tool = None
        try:
            tool = godcm.GenerateOriginDestinationCostMatrix(**param_values)
            tool.execute()
            arcpy.SetParameterAsText(34, tool.output_lines)
            arcpy.SetParameterAsText(35, tool.output_origins)
            arcpy.SetParameterAsText(36, tool.output_destinations)
            arcpy.SetParameterAsText(37, tool.output_layer_file)
            arcpy.SetParameterAsText(38, tool.output_result_file)
            arcpy.SetParameterAsText(39, tool.output_layer_package)
            arcpy.SetParameterAsText(40, tool.usage_cost)
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
                "method_name": self.TOOL_NAME
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
