import os
import arcpy
import DefenseUtilities as utils

class ToolValidator:
    def __init__(self):
        self.parameters = arcpy.GetParameterInfo()

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        return
        
    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        if ( utils.isLicensed( ['Standard','Advanced', 'Server'], ['Foundation','Defense'])):
            return True
        else:
            arcpy.AddIDMessage("ERROR", 824)
            return False    