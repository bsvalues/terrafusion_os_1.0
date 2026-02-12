import arcpy
import uuid
import os
import glob

_defTmpltFolder = os.path.join(arcpy.GetInstallInfo()['InstallDir'],
                               r"Resources\ArcToolBox\Templates\ExportWebMapTemplates")


def getExt(self):
    outFormat = self.params[2].valueAsText.lower()
    if outFormat == "png8" or outFormat == "png32":
        return "png"
    if outFormat == "tiff":
        return "tif"
    else:
        return outFormat


def generateUniqueFileName(self):
    """generating unique file name based on selected Format."""
    guid = str(uuid.uuid1())
    ext = getExt(self)
    return os.path.join(arcpy.env.scratchFolder, '{}.{}'.format(guid, ext))


def getLayoutTemplates(self, tmplFolder):
    templates = []
    for f in glob.glob(os.path.join(tmplFolder, '*.pagx')):
        templates.append(os.path.splitext(os.path.basename(f))[0])

    templates.append("MAP_ONLY")
    return templates

def getReportTemplates(self, tmplFolder):
    templates = []
    for f in glob.glob(os.path.join(tmplFolder, '*.rpt[t,x]')):
        templates.append(os.path.splitext(os.path.basename(f))[0])

    return templates

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""
        self.params[0].value = "# "

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        if self.params[1].altered or self.params[2].altered:
            if self.params[1].value:
                self.params[1].value = \
                os.path.splitext(self.params[1].valueAsText)[0] + "." + getExt(
                    self)
            else:
                self.params[1].value = generateUniqueFileName(self)
        else:
            self.params[1].value = generateUniqueFileName(self)

        if self.params[3].altered:
            if self.params[3].valueAsText.isspace():
                self.params[4].filter.list = getLayoutTemplates(self,
                                                                _defTmpltFolder)
                self.params[6].filter.list = getReportTemplates(self,
                                                                _defTmpltFolder)
            else:
                self.params[4].filter.list = getLayoutTemplates(self,
                                                                self.params[
                                                                    3].valueAsText)
                self.params[6].filter.list = getReportTemplates(self,
                                                                self.params[
                                                                    3].valueAsText)
        else:
            self.params[4].filter.list = getLayoutTemplates(self,
                                                            _defTmpltFolder)
            self.params[6].filter.list = getReportTemplates(self,
                                                            _defTmpltFolder)

        # setting default value for Layout Template parameter
        if not self.params[4].altered:
            self.params[4].value = "MAP_ONLY"
        

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
        # validating to make sure pdf format is chosen when a report template is picked
        if self.params[6].altered or self.params[7].altered or self.params[2].altered:
            if (self.params[6].value or self.params[7].value) and (getExt(self) != 'pdf'):
                self.params[2].setIDMessage("ERROR", 3840)
