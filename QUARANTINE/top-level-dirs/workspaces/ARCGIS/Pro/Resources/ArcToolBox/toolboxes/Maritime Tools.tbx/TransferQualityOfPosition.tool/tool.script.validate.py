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
        # self.params[4].enabled = False

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
 

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
        if self.params[0].value and hasattr(self.params[0].value, 'value'):
            bValidValue = False
            productDefnsPath = None
            try:
                desc = arcpy.Describe(os.path.join(self.params[0].value.value, "ProductDefinitions"))
                productDefnsPath = desc.catalogPath
            except Exception:
                pass
            if productDefnsPath is not None:
                prspField = arcpy.ListFields(productDefnsPath, "PRSP")
                if len(prspField) == 1 and prspField[0].defaultValue == 1003: #Chart
                    bValidValue = True
            if not bValidValue:
                self.params[0].setErrorMessage('Geodatabase must contain the Maritime chart schema')
