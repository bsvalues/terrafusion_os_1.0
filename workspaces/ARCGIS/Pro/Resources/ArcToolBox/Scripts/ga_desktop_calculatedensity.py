"""
 ga_desktop_calculatedensity.py

 Front end of 'Calculate Point Density' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context, run_ga_desktop_tool
from gautils.validation import validate_greater_than_zero, \
    validate_units_greater_than, validate_is_projected_cs, \
    validate_desktop_output, validate_input_source, time_stepping_missing_values, \
    validate_time_on_input_desktop


if __name__ == '__main__':

    bin_size, bin_size_unit = split_unit(get_value(3))
    neigh_size, neigh_size_unit = split_unit(get_value(5))
    time_step_int, time_step_int_unit = split_unit(get_value(8))
    time_step_rep, time_step_rep_unit = split_unit(get_value(9))

    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  output=get_value(1, local_feature_output=True),
                  binType=get_value(2).title(),
                  binSize=bin_size,
                  binSizeUnit=bin_size_unit,
                  weight=get_value(4).title(),
                  radius=neigh_size,
                  radiusUnit=neigh_size_unit,
                  fields=get_value(6, as_list=True),
                  areaUnits=get_value(7, dict=d.area_units),
                  timeStepInterval=time_step_int,
                  timeStepIntervalUnit=time_step_int_unit,
                  timeStepRepeatInterval=time_step_rep,
                  timeStepRepeatIntervalUnit=time_step_rep_unit,
                  timeStepReference=get_value(10, datetime_epoch=True))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)
                                    
    params = param_cleanup(params)
    run_ga_desktop_tool('CalculateDensity', params,{"output": 1})

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""

        self.params[1].value = validate_desktop_output(
            self.params[1].valueAsText, False)  # output validation

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        point_layer = self.params[0].value
        bin_size = self.params[3].valueAsText
        neighborhood_size = self.params[5].valueAsText

        time_params = {"interval":8, "repeat":9, "reference":10}
        time_step_interval = self.params[time_params["interval"]].valueAsText
        time_step_repeat = self.params[time_params["repeat"]].valueAsText
        time_step_reference = self.params[time_params["reference"]].valueAsText

        if point_layer:
            try:
                d_layer = arcpy.Describe(self.params[0])
            except:
                d_layer = ""
            # input validation
            valid_input = validate_input_source(d_layer)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])

            # time validation
            validate_time_on_input_desktop(self, d_layer, 0, time_step_interval, time_step_repeat, time_step_reference, time_params)

        if bin_size:
            if not validate_greater_than_zero(bin_size):
                self.params[3].setIDMessage('ERROR', 323)

        if neighborhood_size:
            if not validate_greater_than_zero(neighborhood_size):
                self.params[5].setIDMessage('ERROR', 323)

        if bin_size and neighborhood_size:
            if not validate_units_greater_than(neighborhood_size, bin_size):
                self.params[5].setIDMessage('ERROR', 120055)
        
        if time_step_interval or time_step_repeat or time_step_reference:
            time_stepping_missing_values(self, time_step_interval, time_step_repeat, time_step_reference, time_params)



