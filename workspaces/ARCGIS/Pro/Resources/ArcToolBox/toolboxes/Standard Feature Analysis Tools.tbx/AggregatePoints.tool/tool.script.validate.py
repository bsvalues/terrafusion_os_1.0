import arcpy
from gautils.validation import validate_output

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""
        #self.params[6].enabled = False
        #self.params[7].enabled = False
        #self.params[0].filter.list = ["Point",  "Multipoint"]
        #self.params[1].filter.list = ["Polygon"]

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
    # Param7: enable min, majority and percentage, and output tbl based on groupBy field param group field
        if self.params[5].value:
            self.params[6].enabled = True
            self.params[7].enabled = True

        if self.params[1].value:
            self.params[8].parameterDependencies = [1]
            self.params[8].schema.clone = True
            self.params[9].parameterDependencies = [1]
            self.params[9].schema.clone = True

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

    def setOutputDependency(self, gfield):
        # output feature class schema
        if self.params[2].value:
            outfc_flist = []
            outtbl_flist = []
            # summary fields
            if self.params[4].altered:
                valuetable = self.params[4].value
                if valuetable:
                    for row in valuetable:
                        newField = arcpy.Field()
                        newField.name = "{}_{}".format(row[1],row[0])
                        newField.aliasName = "{} {}".format(row[1], row[0])
                        newField.type = "DOUBLE"
                        outfc_flist.append(newField)
                        outtbl_flist.append(newField)

            # group fields
            if gfield:
                # majority and minority
                if self.params[6].value:
                    newField = arcpy.Field()
                    newField.type = "TEXT"
                    newField.name = "Majority_{}".format(gfield)
                    newField.aliasName = "Majority {}".format(gfield)
                    outfc_flist.append(newField)
                    outtbl_flist.append(newField)
                    newField = arcpy.Field()
                    newField.type = "TEXT"
                    newField.name = "Minority_{}".format(gfield)
                    newField.aliasName = "Minority {}".format(gfield)
                    outfc_flist.append(newField)
                    outtbl_flist.append(newField)
                # percentages
                if self.params[7].value:
                    newField = arcpy.Field()
                    newField.type = "DOUBLE"
                    newField.name = "Majority_{}_Percent".format(gfield)
                    newField.aliasName = "Majority {} Percent".format(gfield)
                    outfc_flist.append(newField)
                    outtbl_flist.append(newField)
                    newField = arcpy.Field()
                    newField.name = newField.name.replace("Majority", "Minority")
                    newField.aliasName = newField.aliasName.replace("Majority", "Minority")
                    outfc_flist.append(newField)
                    outtbl_flist.append(newField)

                # output group table schema
                if self.params[2].value and self.params[1].value \
                        and self.params[5].valueAsText:
                    #group field
                    gfield = self.params[5].valueAsText
                    newField = arcpy.Field()
                    newField.name, newField.aliasName, newField.type = gfield, gfield, "TEXT"
                    outtbl_flist.append(newField)
                    if self.params[7].value:
                        if not shpType:
                            shpType = arcpy.Describe(param1).shapeType
                            self.params[8].schema.additionalFields = outfc_flist
                        newField = arcpy.Field()
                        newField.type = "DOUBLE"
                        if shpType.lower() == "polygon":
                            newField.name, newField.aliasName = "PercentArea", "Percent Area"
                        outtbl_flist.append(newField)
                    self.params[9].schema.additionalFields = outtbl_flist
