import arcpy


class ToolValidator:
    def __init__(self):
        """Setup the Geoprocessor and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parmater
        has been changed."""
        if self.params[5].altered:
            import os
            temp_param = str(self.params[5].value)
            file_split = os.path.splitext(temp_param)
            self.params[5].value = file_split[0] + ".gsg"
        return

    def updateMessages(self):
        return
