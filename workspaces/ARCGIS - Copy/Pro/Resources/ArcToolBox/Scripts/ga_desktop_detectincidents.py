"""
 ga_desktop_detectincidents.py

 Front end of 'Detect Incidents' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context, run_ga_desktop_tool
from gautils.validation import validate_greater_than_zero, \
    validate_whole_number, validate_input_source, validate_desktop_output, validate_time_boundary, \
    time_validation_desktop_instant_only

if __name__ == '__main__':

    time_bound_split, time_bound_split_unit = split_unit(get_value(6))

    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  output=get_value(1, local_feature_output=True),
                  trackFields=get_value(2,as_list=True),
                  startConditionExpression=get_value(3),
                  endConditionExpression=get_value(4),
                  outputMode=get_value(5, dict=d.output_mode),
                  timeBoundarySplit=time_bound_split,
                  timeBoundarySplitUnit=time_bound_split_unit,
                  timeBoundaryReference=get_value(7, datetime_epoch=True)
                  )

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    run_ga_desktop_tool('DetectIncidents', params, {"output":1})


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

        input_features = self.params[0].valueAsText

        if input_features:
            try:
                d_input = arcpy.Describe(self.params[0])
            except:
                d_input = ""

            # output validation based on the input layer
            if d_input.datatype.lower().find(
                    "record") > -1 or d_input.datatype.lower().find(
                    "table") > -1:
                self.params[1].value = validate_desktop_output(
                    self.params[1].valueAsText, True)
            else:
                self.params[1].value = validate_desktop_output(
                    self.params[1].valueAsText, False)

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        input_layer = self.params[0].value
        time_boundary_params = {"split" :6, "reference":7}
        time_boundary_split = self.params[time_boundary_params["split"]].valueAsText
        time_boundary_reference = self.params[time_boundary_params["reference"]].valueAsText

        if input_layer:

            try:
                d_layer = arcpy.Describe(self.params[0])
            except:
                d_layer = ""
            # time validation
            time_validation_desktop_instant_only(self.params[0], self.params[0], d_layer)

            # input validation
            valid_input = validate_input_source(d_layer)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])

        validate_time_boundary(self, time_boundary_split, time_boundary_reference, time_boundary_params)
