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

        ##Attachments available at Basic license starting in 3.3
        #attach = self.params[4]
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

        outFC = self.params[1]
        invalidTable = self.params[2]
        if outFC.value:
            # Set the Output Feature Class to be a point type
            outFCSchema = self.params[1].schema
            outFCSchema.featureTypeRule = "AsSpecified"
            outFCSchema.featureType = "Simple"
            outFCSchema.geometryTypeRule = "AsSpecified"
            outFCSchema.geometryType = "Point"
            # Add fields to Output Feature Class schema
            fields = []
            for field in ["Path", "Name", "DateTime", "Direction"]:
                newfield = arcpy.Field()
                newfield.name = newfield.aliasName = field
                newfield.type = "Text"
                fields.append(newfield)
            outFCSchema.additionalFields = fields
        if invalidTable.value:
            # Set the Output Feature Class to be a point type
            tableSchema = invalidTable.schema
            # Add fields to Output Feature Class schema
            newfield = arcpy.Field()
            newfield.name = newfield.aliasName = "Photo"
            newfield.type = "Text"
            tableSchema.additionalFields = [newfield]
        attach = self.params[4]
        if outFC.value:
            # If adding attachments, make sure output is in 10.0 or later gdb
            #   and ArcEditor license is Available
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
        outFC = self.params[1]
        attach = self.params[4]
        if attach.value:
            ##Attachments available at Basic license starting in 3.3
            #if not arcpy.ProductInfo() in ('ArcEditor', 'ArcInfo', 'ArcServer'):
            #    attach.setIDMessage("ERROR", 1102)
            if outFC.value:
                # If adding attachments, make sure output is in 10.0 or
                #  later gdb, and ArcEditor license is Available
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
