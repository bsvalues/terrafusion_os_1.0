"""
 ga_desktop_overlaylayers.py

 Front end of 'Overlay Layers' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context, run_ga_desktop_tool
from gautils.validation import validate_desktop_output, validate_input_source

if __name__ == '__main__':

    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  overlayLayer=get_value(1, as_value = True, local_feature_layer=True),
                  output=get_value(2, local_feature_output=True),
                  overlayType=get_value(3, dict=d.overlay_method))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)
                                    
    params = param_cleanup(params)
    run_ga_desktop_tool('OverlayLayers', params, {"output":2})



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

        self.params[2].value = validate_desktop_output(
            self.params[2].valueAsText, False)  # output validation

        input_layer = self.params[0].valueAsText
        overlay_layer = self.params[1].valueAsText

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

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        input_layer = self.params[0].value
        overlay_layer = self.params[1].value
        if input_layer:
            try:
                d_layer = arcpy.Describe(self.params[0])
            except:
                d_layer = ""
            # input validation
            valid_input = validate_input_source(d_layer)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])

        if overlay_layer:
            try:
                d_overlay_layer = arcpy.Describe(self.params[1])
            except:
                d_overlay_layer = ""
            # input validation
            valid_input = validate_input_source(d_overlay_layer)
            if not valid_input[0]:
                self.params[1].setIDMessage('ERROR', valid_input[1])
