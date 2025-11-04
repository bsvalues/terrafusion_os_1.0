"""Performs location-allocation analysis."""  # File name is based on the tool name. pylint:disable=invalid-name

import logging
import json
import time

import arcpy
import nat
import nast
import sla

LOG_LEVEL = logging.INFO  # log level for the tool.


class GPToolDialog(nat.NAToolExecutor):
    """Read parameter values from the tool dialog and perform tool execution."""

    # Define empty solts since the base class has slots
    __slots__ = ()
    TOOL_NAME = "SolveLocationAllocation"

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
        sla.SolveLocationAllocation.logger = self.logger
        # Perform tool execution
        self.execute()

    @nat.time_exec
    def execute(self):
        """Read parameter values and perform tool execution."""
        # Read parameter values
        param_values = {
            "Facilities": arcpy.GetParameter(0),
            "Demand_Points": arcpy.GetParameter(1),
            "Measurement_Units": arcpy.GetParameterAsText(2),
            "Network_Datasets": nast.time_exec(arcpy.GetParameterAsText)(3),
            # "Network_Datasets": nast.time_exec(arcpy.GetParameter)(3),
            "Network_Dataset_Extents": arcpy.GetParameterAsText(4),
            "Analysis_Region": arcpy.GetParameterAsText(5),
            "Problem_Type": arcpy.GetParameterAsText(6),
            "Number_of_Facilities_to_Find": arcpy.GetParameter(7),
            "Default_Measurement_Cutoff": arcpy.GetParameterAsText(8),
            "Default_Capacity": arcpy.GetParameter(9),
            "Target_Market_Share": arcpy.GetParameter(10),
            "Measurement_Transformation_Model": arcpy.GetParameterAsText(11),
            "Measurement_Transformation_Factor": arcpy.GetParameter(12),
            "Travel_Direction": arcpy.GetParameterAsText(13),
            "Time_of_Day": arcpy.GetParameter(14),
            "Time_Zone_for_Time_of_Day": arcpy.GetParameterAsText(15),
            "Uturn_at_Junctions": arcpy.GetParameterAsText(16),
            "Point_Barriers": arcpy.GetParameter(17),
            "Line_Barriers": arcpy.GetParameter(18),
            "Polygon_Barriers": arcpy.GetParameter(19),
            "Use_Hierarchy": arcpy.GetParameter(20),
            "Restrictions": arcpy.GetParameter(21),
            "Attribute_Parameter_Values": arcpy.GetParameter(22),
            "Allocation_Line_Shape": arcpy.GetParameterAsText(23),
            "Travel_Mode": arcpy.GetParameter(24),
            "Impedance": arcpy.GetParameterAsText(25),
            "Save_Output_Network_Analysis_Layer": arcpy.GetParameter(26),
            "Overrides": arcpy.GetParameterAsText(27),
            "Time_Impedance": arcpy.GetParameterAsText(28),
            "Distance_Impedance": arcpy.GetParameterAsText(29),
            "Output_Format": arcpy.GetParameterAsText(30),
            "Accumulate_Attributes": arcpy.GetParameter(31),
            "Output_Geodatabase": arcpy.GetParameterAsText(32),
            "Output_Names": arcpy.GetParameter(33),
            "Ignore_Network_Location_Fields": arcpy.GetParameter(34),
            "Analysis_Limits": arcpy.GetParameter(35),
            "Ignore_Invalid_Locations": arcpy.GetParameter(36),
            "Locate_Settings": arcpy.GetParameterAsText(37),
        }
        # Call core execution logic
        solve_succeeded_param_index = 38
        tool = None
        try:
            tool = sla.SolveLocationAllocation(**param_values)
            tool.execute()
            arcpy.SetParameter(solve_succeeded_param_index, tool.solve_succeeded)
            arcpy.SetParameterAsText(39, tool.output_lines)
            arcpy.SetParameterAsText(40, tool.output_facilities)
            arcpy.SetParameterAsText(41, tool.output_demand_points)
            arcpy.SetParameterAsText(42, tool.output_layer_file)
            arcpy.SetParameterAsText(43, tool.output_result_file)
            arcpy.SetParameterAsText(44, tool.output_layer_package)
            arcpy.SetParameterAsText(45, tool.usage_cost)
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
