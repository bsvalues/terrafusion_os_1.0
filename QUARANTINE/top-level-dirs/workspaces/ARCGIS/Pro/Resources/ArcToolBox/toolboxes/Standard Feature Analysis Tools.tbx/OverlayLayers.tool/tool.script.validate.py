import arcpy

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""
        #self.params[4].enabled = False

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        if self.params[3].value:
            if str(self.params[3].value).lower() == "intersect":
                self.params[4].enabled = True
            else:
                self.params[4].enabled = False

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        inputLayer = self.params[0].valueAsText
        overlayLayer = self.params[1].valueAsText

        if inputLayer and overlayLayer:
            input_shape = arcpy.Describe(self.params[0]).shapeType
            overlay_shape = arcpy.Describe(self.params[1]).shapeType

            overlay_types = ['INTERSECT', 'UNION', 'ERASE']

            # UNION, only if both input and overlay layers are polygon
            if not (input_shape == 'Polygon' and overlay_shape == 'Polygon'):
                overlay_types.remove('UNION')

            # No ERASE if input is lines and overlay is points
            if input_shape == 'Polyline' and overlay_shape == 'Point':
                overlay_types.remove('ERASE')

            # No ERASE if input is polygons and overlay is points or lines
            elif input_shape == 'Polygon' and overlay_shape in ['Polyline', 'Point']:
                overlay_types.remove('ERASE')

            self.params[3].filter.list = overlay_types
