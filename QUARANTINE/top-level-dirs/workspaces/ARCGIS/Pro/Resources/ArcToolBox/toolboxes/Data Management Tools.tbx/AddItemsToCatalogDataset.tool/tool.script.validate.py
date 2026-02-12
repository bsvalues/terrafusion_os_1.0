import arcpy
import os

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

        self.params[3].value = self.params[3].filter.list[0]
        self.params[4].value = self.params[4].filter.list[0]
        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parmater
        has been changed."""
        if self.params[0].valueAsText:
            self.params[5].value = self.params[0].valueAsText

        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        #verify catalog dataset SR
        cd_param = self.params[0]
        items_param = self.params[1]
        if cd_param.altered and cd_param.valueAsText:
            desc = arcpy.Describe(cd_param.valueAsText)
            cd_sr = desc.spatialReference
            cd_hasZ = desc.hasZ
            if cd_sr.type == 'Unknown':
                cd_param.setErrorMessage(arcpy.GetIDMessage(3717))
            elif cd_hasZ and cd_sr.VCS is None:
                #check for Z and VCS
                cd_param.setWarningMessage(arcpy.GetIDMessage(3711))
            else:
                cd_param.clearMessage()
        if items_param.valueAsText:
            items = items_param.valueAsText.lower().split(";")
            for item in items:
                #remove single quotes and spaces
                item = item.lstrip("'").rstrip("'").lstrip().rstrip()
                mem_wksp = ("in_memory\\", "memory\\", "in_memory/", "memory/")
                if item.startswith(mem_wksp) or item in ("in_memory", "memory"):
                    items_param.setErrorMessage(arcpy.GetIDMessage(540))
                    break
                elif os.path.isfile(item) and item.endswith(".lyr"):
                    msg = "Layer file (.lyr) " + arcpy.GetIDMessage(3700)
                    items_param.setErrorMessage(msg)
                    break
        return
