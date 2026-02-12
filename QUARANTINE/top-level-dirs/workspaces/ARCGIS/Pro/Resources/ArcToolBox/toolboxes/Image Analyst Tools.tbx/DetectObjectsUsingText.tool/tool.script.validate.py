
import os, arcpy
from pathlib import Path

class ToolValidator(object):
    """Class for validating a tool's parameters and controlling
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
 
        if self.params[0].value and self.params[1].value == "":
            fileName = Path(str(self.params[0].value)).stem

            project = arcpy.mp.ArcGISProject("CURRENT")
            defaultGeodatabase = project.defaultGeodatabase

            self.params[1].value = os.path.join(defaultGeodatabase, "DetectObjectsUsingText_" + fileName)

            if (arcpy.Exists(self.params[1].value)):
                for i in range(1,100):
                    self.params[1].value = os.path.join(defaultGeodatabase, "DetectObjectsUsingText_" + fileName + "_" + str(i))
                    if (not arcpy.Exists(self.params[1].value)):
                        break

        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
