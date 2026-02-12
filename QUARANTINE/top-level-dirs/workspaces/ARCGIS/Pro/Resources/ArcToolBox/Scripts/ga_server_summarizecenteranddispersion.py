"""
 ga_server_summarizecenteranddispersion.py

 Front end of 'Summarize Center And Dispersion' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context
from gautils.utilities import format_scad_summary_types_server, PortalVersion
from gautils.validation import validate_server_input, validate_output


if __name__ == '__main__':

    analysis_type = "Summarize Center And Dispersion"

    summary_types = get_value(2)

    params = dict(inputLayer=get_value(0, as_value=True),
                  outputName=get_value(1),
                  summaryType = format_scad_summary_types_server(summary_types),
                  ellipseSize = get_value(3, dict = d.ellipse_size),
                  weightField = get_value(4),
                  groupFields = get_value(5),
                  )

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(10, dict=d.datastore),
                                    geoanalytics=True)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)
    if output[0]:
        arcpy.SetParameterAsText(6, output[0])
    if output[1]:
        arcpy.SetParameterAsText(7, output[1])
    if output[2]:
        arcpy.SetParameterAsText(8, output[2])
    if output[3]:
        arcpy.SetParameterAsText(9, output[3])


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""
        return

        self.params[3].enabled = False

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        
        # Support for bigint
        if PortalVersion() >= 2023.2: # 11.2
            self.params[4].filter.list = ["Short", "Long", "BigInteger", "Double"]
            self.params[5].filter.list = ["Short", "Long", "BigInteger", "Text", "Date", "Double"]

        # Output validation
        output_name = self.params[1].valueAsText
        if output_name:
            self.params[1].value = validate_output(output_name)

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
        input_layer = self.params[0].value
        summary_types = str(self.params[2].value) 

        if input_layer:
            try:
                d_layer = arcpy.Describe(self.params[0])
            except:
                d_layer = ""
            # Geometry type
            if hasattr(d_layer, 'shapetype'):
                if getattr(d_layer, 'shapetype', None) not in ['Point', 'Polygon', 'Polyline']:
                    self.params[0].setIDMessage('ERROR', 366)

            # Input validation (event layers, https)
            validate = validate_server_input(self.params[0].valueAsText)
            if not validate[0]:
                self.params[0].setIDMessage('ERROR', validate[1])

        # Show ellipse size if ellipse is selected
        if "ELLIPSE" in summary_types:
            self.params[3].enabled = True
            if not self.params[3].altered:
                self.params[3].value = "1_STANDARD_DEVIATION"
            if self.params[3].value is None:
                self.params[3].setIDMessage("ERROR", 530)
        else:
            self.params[3].enabled = False
            self.params[3].value = ""

        if PortalVersion() < 8.3: # 10.9
            if self.params[0].valueAsText:
                self.params[0].setIDMessage('ERROR', 120184)
            else:
                self.params[0].setIDMessage('WARNING', 120184)

