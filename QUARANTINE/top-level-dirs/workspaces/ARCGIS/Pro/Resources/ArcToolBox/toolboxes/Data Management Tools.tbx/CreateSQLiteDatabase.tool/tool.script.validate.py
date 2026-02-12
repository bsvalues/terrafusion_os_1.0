import arcpy
import os


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        return

    def updateParameters(self):
        if self.params[1].value in ["ST_GEOMETRY", "SPATIALITE"]:
            ext = ".sqlite"
        else:
            ext = ".gpkg"

        if self.params[0].value:
            if self.params[0].value:
                if not self.params[1].altered:
                    self.params[0].value = \
                    os.path.splitext(str(self.params[0].value))[0] + ".sqlite"
                else:
                    self.params[0].value = \
                    os.path.splitext(str(self.params[0].value))[0] + ext

        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        return
