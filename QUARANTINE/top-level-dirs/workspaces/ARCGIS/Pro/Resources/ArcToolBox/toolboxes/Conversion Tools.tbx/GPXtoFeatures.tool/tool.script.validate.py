import arcpy
import os


class ToolValidator(object):
    """ Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """ Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """ Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        return

    def updateParameters(self):
        """ Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parmater
        has been changed."""
        outFC = self.params[1]

        if outFC.value:
            # Validate for bad characters in the output file name
            outpath = os.path.dirname(outFC.value.value)
            outname = os.path.basename(outFC.value.value)
            newname = arcpy.ValidateTableName(os.path.splitext(outname)[0],
                                              outpath) + \
                      os.path.splitext(outname)[1]
            outFC.value = os.path.join(outpath, newname)

            fields = []
            # Set the Output Feature Class to be a point type
            outFCSchema = self.params[1].schema
            outFCSchema.featureTypeRule = "AsSpecified"
            outFCSchema.featureType = "Simple"
            outFCSchema.geometryTypeRule = "AsSpecified"
            outFCSchema.geometryType = "Point"

            # Add fields to Output Feature Class schema
            for field in ["Name", "Desc", "Type", "DateTimeS", "Elevation"]:
                newfield = arcpy.Field()
                newfield.name = newfield.aliasName = field
                if field == "Elevation":
                    newfield.type = "LONG"
                else:
                    newfield.type = "Text"
                fields.append(newfield)
            outFCSchema.additionalFields = fields

        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        return
