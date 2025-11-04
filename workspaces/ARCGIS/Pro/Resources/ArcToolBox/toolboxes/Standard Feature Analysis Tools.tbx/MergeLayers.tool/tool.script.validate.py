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

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""

        inputLayer = self.params[0].valueAsText
        mergeLayer = self.params[1].valueAsText
        mergeValues = self.params[3].values
        if inputLayer and mergeLayer:
            self.params[3].filters[2].list = [f.aliasName for f in arcpy.Describe(inputLayer).fields]
            try:
                self.params[3].values = [[i[0].value, i[1], i[2]]
                                         if i[1] != 'REMOVE'
                                         else [i[0].value, i[1], None]
                                         for i in mergeValues]
            except TypeError:
                pass

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        inputLayer = self.params[0].valueAsText
        mergeLayer = self.params[1].valueAsText

        if inputLayer and mergeLayer:
            try:
                if arcpy.Describe(self.params[0]).shapeType != arcpy.Describe(self.params[1]).shapeType:
                    self.params[1].setIDMessage('ERROR', 468)
            except:
                pass

        self.params[3].clearMessage()
        if self.params[3].hasError() and self.params[3].message.find('000800') > -1:
            self.params[3].clearMessage()
