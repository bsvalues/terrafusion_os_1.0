import arcpy
import arcpy
from gautils.validation import validate_output


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""
        #self.params[7].enabled = False
        #self.params[8].enabled = False

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""

        if self.params[0].value and self.params[0].altered:
            try:
                ftype = arcpy.Describe(self.params[0].value).shapeType
                if str(ftype).lower() == "polyline":
                    self.params[7].enabled = True
                    self.params[7].filter.list = ["FULL", "RIGHT", "LEFT"]
                    self.params[8].enabled = True
                elif str(ftype).lower() == "polygon":
                    self.params[7].enabled = True
                    if not self.params[7].value in ["", "OUTSIDE"]:
                        self.params[7].value = ""
                    self.params[7].filter.list = ["OUTSIDE"]
                    self.params[8].enabled = False
                else:
                    self.params[7].enabled = False
                    self.params[8].enabled = False
            except:
                pass

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
