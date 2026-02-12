import arcpy
from addGPSMetadataFields import gnss_fields_pt, gnss_fields_non_pt


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
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        if self.params[0].value:
            if getattr(arcpy.Describe(self.params[0].value), "shapeType", "Point") == "Point":
                fields_to_add = gnss_fields_pt
            else:
                fields_to_add = gnss_fields_non_pt

        self.params[1].schema.fieldsRule = "AllNoFIDs"
        additionalFields = []
        for fname in fields_to_add:
            f = arcpy.Field()
            f.name = fname
            additionalFields.append(f)

        self.params[1].schema.additionalFields = additionalFields
        return

    def updateMessages(self):
        return
