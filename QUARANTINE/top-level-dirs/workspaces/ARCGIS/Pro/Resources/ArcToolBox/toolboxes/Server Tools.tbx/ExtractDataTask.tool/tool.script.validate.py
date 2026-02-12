import os


class ToolValidator:
    def __init__(self):
        self.params = arcpy.GetParameterInfo()

    def updateParameters(self):
        output = self.params[4]
        if not output.value:
            output.value = "output.zip"
        file, ext = os.path.splitext(output.valueAsText)
        if ext != '.zip':
            output.value = file + '.zip'

    def updateMessages(self):
        return
