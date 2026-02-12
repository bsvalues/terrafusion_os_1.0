"""
 ga_server_overlaylayers.py

 Front end of 'Overlay Layers' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from gautils.utilities import PortalVersion
from gautils.validation import validate_output, validate_server_input

if __name__ == '__main__':

    analysis_type = "Overlay Layers"

    params = dict(inputLayer=get_value(0, as_value=True),
                  overlayLayer=get_value(1, as_value=True),
                  outputName=get_value(2),
                  overlayType=get_value(3, dict=d.overlay_method),
                  includeOverlaps=get_value(4))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(5, dict=d.datastore),
                                    geoanalytics=True)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)
    arcpy.SetParameterAsText(6, output)

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

        input_layer = self.params[0].valueAsText
        overlay_layer = self.params[1].valueAsText

        output_name = self.params[2].valueAsText
        if output_name:
            self.params[2].value = validate_output(output_name)

        if input_layer and overlay_layer:
            try:
                d_input = arcpy.Describe(self.params[0])
            except:
                d_input = ""
            try:
                d_overlay = arcpy.Describe(self.params[1])
            except:
                d_overlay = ""

            if hasattr(d_input, 'shapetype') and hasattr(d_overlay,
                                                         'shapetype'):
                input_shape = getattr(d_input, 'shapetype', None)
                overlay_shape = getattr(d_overlay, 'shapetype', None)

                if input_shape == 'Point':
                    if overlay_shape == 'Point':
                        self.params[3].filter.list = ['INTERSECT', 'ERASE',
                                                      'IDENTITY',
                                                      'SYMMETRICAL_DIFFERENCE']
                    elif overlay_shape == 'Polyline':
                        self.params[3].filter.list = ['INTERSECT']
                    elif overlay_shape == 'Polygon':
                        self.params[3].filter.list = ['INTERSECT', 'IDENTITY']
                elif input_shape == 'Polyline':
                    if overlay_shape == 'Point':
                        self.params[3].filter.list = ['INTERSECT']
                    elif overlay_shape == 'Polyline':
                        self.params[3].filter.list = ['INTERSECT', 'ERASE',
                                                      'IDENTITY',
                                                      'SYMMETRICAL_DIFFERENCE']
                    elif overlay_shape == 'Polygon':
                        self.params[3].filter.list = ['INTERSECT', 'IDENTITY']
                elif input_shape == 'Polygon':
                    if overlay_shape == 'Point':
                        self.params[3].filter.list = ['INTERSECT']
                    elif overlay_shape == 'Polyline':
                        self.params[3].filter.list = ['INTERSECT']
                    elif overlay_shape == 'Polygon':
                        self.params[3].filter.list = ['INTERSECT', 'ERASE',
                                                      'UNION', 'IDENTITY',
                                                      'SYMMETRICAL_DIFFERENCE']

            elif d_input.datatype == 'RecordSet' or d_overlay.datatype == 'RecordSet':
                self.params[3].filter.list = ['INTERSECT', 'ERASE', 'UNION',
                                              'IDENTITY',
                                              'SYMMETRICAL_DIFFERENCE']
            else:
                self.params[3].value = None

        if PortalVersion() == 6.1:  # 10.6.1
            self.params[4].enabled = True
        else:
            self.params[4].enabled = False

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        if PortalVersion() < 6.1:
            if self.params[0].valueAsText:
                self.params[0].setIDMessage('ERROR', 120184)
            else:
                self.params[0].setIDMessage('WARNING', 120184)

        if self.params[0].valueAsText:
            validate = validate_server_input(self.params[0].valueAsText)
            if not validate[0]:
                self.params[0].setIDMessage('ERROR', validate[1])
        if self.params[1].valueAsText:
            validate = validate_server_input(self.params[1].valueAsText)
            if not validate[0]:
                self.params[1].setIDMessage('ERROR', validate[1])