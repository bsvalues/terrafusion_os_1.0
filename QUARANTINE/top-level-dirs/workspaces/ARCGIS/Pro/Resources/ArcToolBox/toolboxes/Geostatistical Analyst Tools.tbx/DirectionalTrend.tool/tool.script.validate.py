import arcpy

class ToolValidator:
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        return

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parmater
        has been changed."""
        inputFC = self.params[0]
        analysisField = self.params[1]
        direction = self.params[2]
        determineDirection = self.params[3]
        order = self.params[4]
        
        if determineDirection.value:
            direction.enabled = False
            direction.value = None
        else: 
            direction.enabled = True

        if order.value is None:
            order.value = 1
        
        if direction.value is None:
            direction.value = 0


    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""

        return
        
    def postExecute(self):
        import SSDirectionalTrend as directionalTrend
        directionalTrend.postExecute(self.params)
    


