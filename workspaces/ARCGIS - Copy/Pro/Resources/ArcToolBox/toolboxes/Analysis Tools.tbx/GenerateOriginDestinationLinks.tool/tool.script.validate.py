import arcpy


class ToolValidator(object):
    """ Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """ Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """ Refine the properties of a tool's parameters.
        This method is called when the tool is opened."""

    def updateParameters(self):
        """ Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        if str(self.params[9].value).lower() == "true":
            self.params[10].enabled = True
        else:
            self.params[10].enabled = False
        if self.params[0].value:
            f1, f2, f3, f4, f5, f6, f7 = arcpy.Field(), arcpy.Field(), arcpy.Field(), arcpy.Field(), arcpy.Field(), arcpy.Field(), arcpy.Field()
            f1.name, f1.aliasName, f1.type = "ORIG_FID", "ORIG_FID", "LONG"
            f2.name, f2.aliasName, f2.type = "ORIG_X", "ORIG_X", "DOUBLE"
            f3.name, f3.aliasName, f3.type = "ORIG_Y", "ORIG_Y", "DOUBLE"
            f4.name, f4.aliasName, f4.type = "DEST_FID", "DEST_FID", "LONG"
            f5.name, f5.aliasName, f5.type = "DEST_X", "DEST_X", "DOUBLE"
            f6.name, f6.aliasName, f6.type = "DEST_Y", "DEST_Y", "DOUBLE"
            f7.name, f7.aliasName, f7.type = "LINK_DIST", "LINK_DIST", "DOUBLE"
            additionalFields = [f1, f2, f3, f4, f5, f6, f7]
            if self.params[3].value:
                f8 = arcpy.Field()
                f8.name, f8.aliasName, f8.type = "GROUP_ID", "GROUP_ID", "STRING"
                additionalFields.append(f8)
            if str(self.params[9].value).lower() == "true":
                f9 = arcpy.Field()
                f9.name, f9.aliasName, f9.type = "LINK_COUNT", "LINK_COUNT", "LONG"
                additionalFields.append(f9)
            self.params[2].schema.additionalFields = additionalFields
            self.params[2].schema.geometryType = "Polyline"

    def updateMessages(self):
        """ Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
        if self.params[3].value:
            if not self.params[4].value:
                self.params[4].setIDMessage("ERROR", 735)
        if self.params[4].value:
            if not self.params[3].value:
                self.params[3].setIDMessage("ERROR", 735)
        if self.params[10].value:
            fields, stats = zip(*self.params[10].value)
            # clear blank property validation error
            if self.params[10].hasError() and str(self.params[10].message).find(
                    "800") > -1:
                if '' in stats:
                    self.params[10].clearMessage()

    def isLicensed(self):
        """ Set whether tool is licensed to execute."""
        return True
