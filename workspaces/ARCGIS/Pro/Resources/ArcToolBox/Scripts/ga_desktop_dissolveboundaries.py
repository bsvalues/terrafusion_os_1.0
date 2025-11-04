"""
 ga_desktop_dissolveboundaries.py

 Front end of 'Dissolve Boundaries' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import get_value, param_cleanup, set_context, run_ga_desktop_tool
from gautils.validation import validate_desktop_output, validate_input_source


if __name__ == '__main__':

    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  output=get_value(1, local_feature_output=True),
                  multipart=str(get_value(2, as_value=True)),
                  dissolveFields=get_value(4, as_list=True),
                  summaryFields=get_value(5, as_value=True, val_table='summary_fields'))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    run_ga_desktop_tool('DissolveBoundaries', params, {"output":1})


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        # self.params[0].filter.list = ['BigDataFileShare']

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""
        # self.params[4].enabled = False

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        
        #self.params[1].value = validate_desktop_output(
        #    self.params[1].valueAsText, False)  # output validation

        fieldDissolve = self.params[3].value
        if fieldDissolve:
            self.params[4].enabled = True
        else:
            self.params[4].enabled = False

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        input_layer = self.params[0].valueAsText

        if input_layer:
            try:
                d = arcpy.Describe(self.params[0])
            except:
                d = ""
            # if getattr(d, 'shapetype', None) != 'Polygon':
            #   self.params[0].setIDMessage('ERROR', 366)

            # input validation
            valid_input = validate_input_source(d)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])
