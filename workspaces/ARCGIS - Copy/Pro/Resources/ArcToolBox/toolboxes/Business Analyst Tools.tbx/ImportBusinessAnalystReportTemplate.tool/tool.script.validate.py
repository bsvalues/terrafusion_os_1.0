import re
import os
import winreg

import arcpy
import arcpy._ba

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        self.localDatasetIds = getLocalDatasetIds()
        match = re.search("Local;;(.*)#.*", arcpy.env.baDataSource or "")
        self.initialDatasetId = match.group(1) if match else next(filter(lambda dsId: "USA" in dsId, self.localDatasetIds), None)

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        try:
            self.params[2].filter.list = self.localDatasetIds
        except:
            return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        if not self.params[2].value:
            self.params[2].value = self.initialDatasetId

        if not self.params[1].value:
            self.params[1].value = getOutputFolder()

        return


    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        if self.params[1].value:
            pathOutputFolder = str(self.params[1].value)
            if not os.path.exists(pathOutputFolder):
                self.params[1].setIDMessage("ERROR", 792, pathOutputFolder)

        return

########## Helper Methods ############

def getLocalDatasetIds():
    return list(map(lambda d: d["id"], arcpy._ba.getLocalDatasets()))

def getOutputFolder():
    outFolder = ""

    try:
        keyCuBa = winreg.OpenKey(winreg.HKEY_CURRENT_USER, "SOFTWARE\\ESRI\\BusinessAnalyst")
        (outFolder, valType) = winreg.QueryValueEx(keyCuBa, "DownloadedReportTemplatesLocation")

        if not outFolder:
            outFolder = os.path.join(arcpy.mp.ArcGISProject("current").homeFolder, "Report Templates")
            os.makedirs(outFolder)
    except:
        pass
        
    return outFolder
