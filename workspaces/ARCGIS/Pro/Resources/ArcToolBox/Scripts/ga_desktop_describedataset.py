"""
 ga_desktop_describedataset.py

 Front end of 'Describe Dataset' GeoAnalytics Desktop tool.

"""

import arcpy
from gautils import get_value, param_cleanup, set_context, run_ga_desktop_tool, print_describe_output_messages
from gautils.validation import validate_desktop_output, validate_input_source

message = ""
if __name__ == '__main__':

    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  output=get_value(1, local_feature_output=True),
                  sampleSize=get_value(2, as_value=True),
                  sampleLayer=get_value(3, local_feature_output=True),
                  extentLayer=get_value(4, local_feature_output=True),
                  extentOutput=True if get_value(4) else False)

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    output_str = run_ga_desktop_tool('DescribeDataset', params, {"output":1})
    if output_str:
        print_describe_output_messages(output_str)


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
            self.params[1].valueAsText, True)  # Output table validation

        if self.params[3].value:
            self.params[3].value = validate_desktop_output(
                self.params[3].valueAsText, False)

        if self.params[4].value:
            self.params[4].value = validate_desktop_output(
                self.params[4].valueAsText, False)

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        input_layer = self.params[0].value
        sample_features = self.params[2].value
        sample_output = self.params[3]
        sample_layer = self.params[3].value
        extent_layer = self.params[4].value

        if input_layer:
            try:
                d_input_layer = arcpy.Describe(self.params[0])
            except:
                d_input_layer = ""
            # input validation (event layers)
            valid_input = validate_input_source(d_input_layer)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])
            if d_input_layer.datatype.lower().find(
                    "record") > -1 or d_input_layer.datatype.lower().find(
                    "table") > -1:
                table = True
            else:
                table = False

        if sample_features:
            self.params[3].enabled = True
            if self.params[2].value < 0:
                self.params[2].setIDMessage("ERROR", 30111,
                                            self.params[2].displayName)
            if sample_features > 0:
                if sample_output.value is None:
                    sample_output.setIDMessage("ERROR", 530)

        else:
            self.params[3].enabled = False
            self.params[3].value = None

        if table:
            self.params[4].enabled = False
            self.params[4].value = None
        else:
            self.params[4].enabled = True

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True
