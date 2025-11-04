import arcpy


class ToolValidator:
    def __init__(self):
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        self.params[4].enabled = False

    def updateParameters(self):
        self.params[4].enabled = self.params[3].valueAsText != "ORIGINAL"

    def updateMessages(self):
        if self.params[4].enabled and not self.params[4].valueAsText:
            self.params[4].setIDMessage("ERROR", 735, self.params[4].displayName)
