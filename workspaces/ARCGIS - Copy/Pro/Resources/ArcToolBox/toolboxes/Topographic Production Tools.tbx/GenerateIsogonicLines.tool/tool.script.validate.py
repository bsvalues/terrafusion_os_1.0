import arcpy
import datetime


class ToolValidator:
  # Class to add custom behavior and properties to the tool and tool parameters.

    def __init__(self):
        # Set self.params for use in other validation methods.
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        # Customize parameter properties. This method gets called when the
        # tool is opened.
        return

    def updateParameters(self):
        # Modify the values and properties of parameters before internal
        # validation is performed.
        if not self.params[7].altered and self.params[5].altered:
            names = []
            if arcpy.Exists(self.params[5].value):
                subtypes = arcpy.da.ListSubtypes(self.params[5].value)
                for stcode, stdict in list(subtypes.items()):
                    if len(stdict.keys()) > 0:
                        if stdict['SubtypeField'] != '':
                            for stkey in list(stdict.keys()):
                                if stkey == 'Name':
                                    names.append(stdict[stkey])
            self.params[7].filter.list = names
        if not self.params[2].altered:
            self.params[2].value = str(datetime.datetime.now().date())
        if self.params[8].value == True:
            self.params[9].enabled = True
        else:
            self.params[9].enabled = False
        return

    def updateMessages(self):
        # Modify the messages created by internal validation for each tool
        # parameter. This method is called after internal validation.
        if self.params[0].altered:
            if not arcpy.Exists(self.params[0].valueAsText):
                self.params[0].setIDMessage('ERROR', 732, self.params[0].displayName, self.params[0].valueAsText)
        if self.params[5].altered:
            if not arcpy.Exists(self.params[5].valueAsText):
                self.params[5].setIDMessage('ERROR', 732, self.params[5].displayName, self.params[5].valueAsText)
        if self.params[0].altered and self.params[5].altered:
            if self.params[0].valueAsText == self.params[5].valueAsText:
                self.params[5].setIDMessage('ERROR', 670, self.params[5].displayName, self.params[0].displayName)
        if self.params[6].altered and self.params[9].altered:
            if self.params[6].valueAsText == self.params[9].valueAsText:
                self.params[9].setIDMessage('ERROR', 733, self.params[9].displayName, self.params[6].displayName)
        return

    def isLicensed(self):
        """Set whether the tool is licensed to execute."""
        licensed = False
        if arcpy.ProductInfo() == 'Server':
            if arcpy.CheckExtension('Foundation') == 'Available':
                licensed = True
            elif arcpy.CheckExtension('Defense') == 'Available':
                licensed = True
        else:
            checkp = arcpy.CheckExtension('Foundation')
            checkd = arcpy.CheckExtension('Defense')
            if checkp == 'Available':
                checkoutp = arcpy.CheckOutExtension('Foundation')
                if checkoutp == 'CheckedOut':
                    licensed = True
            elif checkd == 'Available':
                checkoutd = arcpy.CheckOutExtension('Defense')
                if checkoutd == 'CheckedOut':
                    licensed = True
            else:
                licensed = False
        return licensed

    def postExecute(self):
        """This method takes place after outputs are processed and
        added to the display."""
        return
