"""
 ga_desktop_summarizeattributes.py

 Front end of 'Summarize Attributes' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import get_value, param_cleanup, set_context, run_ga_desktop_tool, split_unit
from gautils.validation import validate_input_source, validate_desktop_output, validate_greater_than_zero,\
    time_stepping_missing_values, validate_time_on_input_desktop

if __name__ == '__main__':
    time_step_int, time_step_int_unit = split_unit(get_value(4))
    time_step_rep, time_step_rep_unit = split_unit(get_value(5))
    
    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  output=get_value(1, local_feature_output=True),
                  fields=get_value(2, as_list=True),
                  summaryFields=get_value(3, as_value=True, val_table='summary_fields'),
                  timeStepInterval=time_step_int,
                  timeStepIntervalUnit=time_step_int_unit,
                  timeStepRepeatInterval=time_step_rep,
                  timeStepRepeatIntervalUnit=time_step_rep_unit,
                  timeStepReference=get_value(6, datetime_epoch=True))
                  # Can't get delimited table output to work {'path':'C:\\projects\\gax_desktop\\sum.csv','fileformat':'delimited'}

    # outputCoordinateSystem is not necessary
    params['context'] = set_context(spatial_ref=None,
                                    extent=arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    run_ga_desktop_tool('SummarizeAttributes', params, {"output":1})


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
            self.params[1].valueAsText, True)  # output validation

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
        time_params = {"interval":4, "repeat":5, "reference":6}
        time_step_interval = self.params[time_params["interval"]].valueAsText
        time_step_repeat = self.params[time_params["repeat"]].valueAsText
        time_step_reference = self.params[time_params["reference"]].valueAsText

        input_layer = self.params[0].value
        if input_layer:
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
        
        if time_step_interval or time_step_repeat or time_step_reference:
            time_stepping_missing_values(self, time_step_interval, time_step_repeat, time_step_reference, time_params)

