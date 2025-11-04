import arcpy
import os


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""

        ## Attachments licensed to Basic at 3.3
        #attach = self.params[5]
        ## Attachments parameter requires at least ArcEditor license
        #if arcpy.ProductInfo() in ('ArcEditor', 'ArcInfo', 'ArcServer'):
        #    attach.enabled = True
        #else:
        #    attach.value = False
        #    attach.enabled = False
        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parmater
        has been changed."""
        attach = self.params[5]
        outTable = self.params[3]
        if outTable.value:
            # Set the Output Feature Class to be a point type
            outTableSchema = self.params[3].schema
            fields = []
            # Add fields to Output Feature Class schema
            for field in [["IN_FID", "Long"], ["Photo_Path", "Text"],
                          ["Photo_Name", "Text"], ["Match_Diff", "Double"]]:
                newfield = arcpy.Field()
                newfield.name = newfield.aliasName = field[0]
                newfield.type = field[1]
                fields.append(newfield)
            outTableSchema.additionalFields = fields

            # If adding attachments, make sure output is in 10.0 or later gdb, and ArcEditor license is Available
            try:
                desc = arcpy.Describe(os.path.dirname(str(outFC.value)))
                if desc.workspaceType.lower() not in ["localdatabase",
                                                      "remotedatabase"] or int(
                        desc.Release.split(",")[0]) < 3:
                    attach.value = False
                    attach.enabled = False
                else:
                    attach.enabled = True
            except:
                pass

        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        outFC = self.params[3]
        attach = self.params[5]
        if attach.value:
            ## Attachments licensed to Basic at 3.3
            #if not arcpy.ProductInfo() in ('ArcEditor', 'ArcInfo', 'ArcServer'):
            #    attach.setIDMessage("ERROR", 1102)
            if outFC.value:
                # If adding attachments, make sure output is in 10.0 or later gdb, and ArcEditor license is Available
                try:
                    desc = arcpy.Describe(os.path.dirname(str(outFC.value)))
                    if desc.workspaceType.lower() not in ["localdatabase",
                                                          "remotedatabase"] or int(
                            desc.Release.split(",")[0]) < 3:
                        if attach.value:
                            attach.setIDMessage("ERROR", 1177)
                except:
                    pass
        return
