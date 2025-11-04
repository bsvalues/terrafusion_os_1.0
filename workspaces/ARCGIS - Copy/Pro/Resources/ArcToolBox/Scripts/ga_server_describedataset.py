"""
 ga_server_describedataset.py

 Front end of 'Describe Dataset' GeoAnalytics Server tool.

"""

import arcpy
import ast
import json
from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context, print_describe_output_messages
from gautils.validation import validate_output, validate_server_input
from gautils.utilities import PortalVersion


message = ""
if __name__ == '__main__':

    analysis_type = "Describe Dataset"
    params = dict(inputLayer=get_value(0, as_value=True),
                  outputName=get_value(1),
                  sampleSize=get_value(2),
                  extentOutput=get_value(3))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(4, dict=d.datastore),
                                    geoanalytics=True)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)

    try:
        output_str = output[0]
        output_str = json.loads(output_str)
        print_describe_output_messages(output_str)

    except Exception:
        # Don't print a message if there is an error creating it
        pass

    if isinstance(output, list):
        arcpy.SetParameterAsText(5, output[1])
        if output[2]:
            arcpy.SetParameterAsText(6, output[2])
        if output[3]:
            arcpy.SetParameterAsText(7, output[3])
    else:
        arcpy.SetParameterAsText(5, output)

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

        output_name = self.params[1].valueAsText
        if output_name:
            self.params[1].value = validate_output(output_name)

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        if PortalVersion() < 7.1:
            if self.params[0].valueAsText:
                self.params[0].setIDMessage('ERROR', 120184)
            else:
                self.params[0].setIDMessage('WARNING', 120184)

        sample_features = self.params[2].value
        if sample_features:
            if self.params[2].value < 0:
                self.params[2].setIDMessage("ERROR", 30111,
                                            self.params[2].displayName)

        validate = validate_server_input(self.params[0].valueAsText)
        if not validate[0]:
            self.params[0].setIDMessage('ERROR', validate[1])

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True