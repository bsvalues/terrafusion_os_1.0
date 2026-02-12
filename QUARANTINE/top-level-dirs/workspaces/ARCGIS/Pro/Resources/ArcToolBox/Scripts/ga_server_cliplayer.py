"""
 ga_server_cliplayer.py

 Front end of 'Clip Layer' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context
from gautils.utilities import PortalVersion
from gautils.validation import validate_output, validate_server_input


if __name__ == '__main__':

    analysis_type = "Clip Layer"
    params = dict(inputLayer=get_value(0, as_value=True),
                  clipLayer=get_value(1, as_value=True),
                  outputName=get_value(2))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(4, dict=d.datastore),
                                    geoanalytics=True)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)
    arcpy.SetParameterAsText(3, output)

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        # self.params[0].filter.list = ['BigDataFileShare']
        # self.params[1].filter.list = ['BigDataFileShare']

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""

        output_name = self.params[2].valueAsText
        if output_name:
            self.params[2].value = validate_output(output_name)

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
        clip_layer = self.params[1].valueAsText
        input_layer = self.params[0].valueAsText

        if clip_layer:
            try:
                d = arcpy.Describe(self.params[1])
            except:
                d = ""
            if getattr(d, 'shapetype', None) != 'Polygon':
                self.params[1].setIDMessage('ERROR', 366)
            validate = validate_server_input(self.params[1].valueAsText)
            if not validate[0]:
                self.params[1].setIDMessage('ERROR', validate[1])
        if input_layer:
            validate = validate_server_input(self.params[0].valueAsText)
            if not validate[0]:
                self.params[0].setIDMessage('ERROR', validate[1])

        try:
            if PortalVersion() < 6.4:
                if self.params[0].valueAsText:
                    self.params[0].setIDMessage('ERROR', 120184)
                else:
                    self.params[0].setIDMessage('WARNING', 120184)
        except:
            pass