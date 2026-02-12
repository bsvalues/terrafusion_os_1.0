import arcpy

linearUnits = ["METERS", "KILOMETERS", "FEET", "YARDS", "MILES"]
arealUnits = ["ACRES", "HECTARES", "SQUAREMETERS", "SQUAREKILOMETERS",
              "SQUAREFEET", "SQUAREYARDS", "SQUAREMILES"]

noConsequenceParams = [0, 2, 3, 10]


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        # self.setGroupParams(False)
        # self.params[2].parameterDependencies = [0]
        # self.params[2].schema.clone = True
        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        ##        if any(not self.params[i].hasBeenValidated for i in noConsequenceParams):
        ##            return

        # modify shape summary units based on Add shape summary

        param1 = self.params[1]
        summarizeLayer = param1.valueAsText
        shpType = ""
        if summarizeLayer:
            try:
                shpType = arcpy.Describe(param1).shapeType
            except Exception:
                return

            # modify shape units list based on Summary features
            if self.params[5].value and "point" not in shpType.lower():
                self.params[6].enabled = True
            else:
                self.params[6].enabled = False

        # modify shape units list based on param1 shp type
        enabled = False
        if not param1.hasBeenValidated:
            if "point" in shpType.lower():
                self.params[6].enabled = False
            elif shpType == "Polyline":
                enabled = True
                self.params[6].filter.list = linearUnits
                val = "KILOMETERS"
                currValue = self.params[6].value
                if currValue:
                    if currValue in linearUnits:
                        val = currValue
                    else:
                        couldBeValue = currValue.lstrip("SQUARE")
                        if couldBeValue in linearUnits:
                            val = couldBeValue
                self.params[6].value = val
            else:
                enabled = True
                self.params[6].filter.list = arealUnits
                val = "SQUAREKILOMETERS"
                currValue = self.params[6].value
                if currValue:
                    if currValue in arealUnits:
                        val = currValue
                    else:
                        couldBeValue = "".join(("SQUARE", currValue))
                        if couldBeValue in arealUnits:
                            val = couldBeValue
                self.params[6].value = val

            if enabled and self.params[5].value:
                self.params[6].enabled = True
            else:
                self.params[6].enabled = False

        # Param7: enable min, majority and percentage, and output tbl
        # based on groupBy field param
        # group field
        groupField = self.params[7].valueAsText
        fcPath = self.params[2].valueAsText

        if groupField:
            self.setGroupParams(True, groupField, fcPath)
        else:
            self.setGroupParams(False, groupField, fcPath)

        # set output dependency
        if summarizeLayer and shpType:
            self.setOutputDependency(shpType, groupField, fcPath)

        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""

        # chk for shp file output
        val = self.params[2].valueAsText
        if val:
            if (
                (".gdb" in val)
                or (".sde" in val)
                or ("%" in val)
                or (val.lower().startswith("in_memory"))
                or (val.lower().startswith("memory"))
            ):
                self.params[2].clearMessage()
            else:
                self.params[2].setIDMessage("ERROR", 3396)

        # chk for summaryfields and summarize shape
        if self.params[4].value or self.params[5].value:
            self.params[5].clearMessage()
        else:
            self.params[5].setIDMessage("Error", 100019)

        # chk for dBase table output
        if self.params[7].value:
            val = self.params[10].valueAsText
            if val:
                if (
                    (".gdb" in val)
                    or (".sde" in val)
                    or ("%" in val)
                    or (val.lower().startswith("in_memory"))
                ):
                    self.params[10].clearMessage()
                else:
                    self.params[10].setIDMessage("ERROR", 3396)
            else:
                self.params[10].setIDMessage("ERROR", 735, self.params[10].name)

        return

    def setGroupParams(self, bValue, groupFieldName, fcPath):
        """ enables or disables groupby field params"""
        self.params[8].enabled = bValue
        self.params[9].enabled = bValue
        self.params[10].enabled = bValue
        outPath = self.params[10].valueAsText
        if bValue and not outPath:
            if fcPath and not outPath:
                import os
                dirPath = os.path.dirname(fcPath)
                if not groupFieldName:
                    groupFieldName = "GroupBy"
                tblName = "{}_Summary".format(groupFieldName.replace(".", "_"))
                outPath = os.path.join(dirPath, tblName)
                self.params[10].value = outPath

    def setOutputDependency(self, shpType, gfield, fcPath):

        # output feature class schema
        if fcPath or self.params[10].value:
            outfc_flist = []
            outtbl_flist = []
            # summary fields
            if self.params[4].value:
                valuetable = self.params[4].value
                if valuetable:
                    for row in valuetable:
                        newField = arcpy.Field()
                        newField.name = "{}_{}".format(row[1], row[0])
                        newField.aliasName = "{} {}".format(row[1], row[0])
                        newField.type = "DOUBLE"
                        outfc_flist.append(newField)
                        outtbl_flist.append(newField)
            # add shape summary fields
            if self.params[5].value:
                newField = arcpy.Field()
                newField.type = "DOUBLE"
                if "point" in shpType.lower():
                    newField.name = "Point_Count"
                    newField.aliasName = "Count of Points"
                else:
                    units = self.params[6].valueAsText
                    newField.name = "Sum_Length_{}".format(
                        units.replace(" ", ""))
                    newField.aliasName = "Summarized length in {}".format(units)
                    if shpType == "Polygon":
                        newField.name = newField.name.replace("Length", "Area")
                        newField.aliasName = newField.aliasName.replace(
                            "length", "area")
                outfc_flist.append(newField)
                outtbl_flist.append(newField)
            # group fields
            if gfield:
                # majority and minority
                if self.params[8].value:
                    newField = arcpy.Field()
                    newField.type = "TEXT"
                    newField.name = "Majority_{}".format(gfield)
                    newField.aliasName = "Majority {}".format(gfield)
                    outfc_flist.append(newField)
                    newField = arcpy.Field()
                    newField.type = "TEXT"
                    newField.name = "Minority_{}".format(gfield)
                    newField.aliasName = "Minority {}".format(gfield)
                    outfc_flist.append(newField)
                # percentages
                if self.params[9].value:
                    newField = arcpy.Field()
                    newField.type = "DOUBLE"
                    newField.name = "Majority_{}_Percent".format(gfield)
                    newField.aliasName = "Majority {} Percent".format(gfield)
                    outfc_flist.append(newField)
                    newField = arcpy.Field()
                    newField.name = newField.name.replace("Majority",
                                                          "Minority")
                    newField.aliasName = newField.aliasName.replace("Majority",
                                                                    "Minority")
                    outfc_flist.append(newField)
                # join id
                newField = arcpy.Field()
                newField.name, newField.aliasName, newField.type = "JOIN ID", "JOIN_ID", "LONG"
                outfc_flist.append(newField)
                outtbl_flist.append(newField)

                # output group table schema
                if self.params[10].value and gfield:
                    newField = arcpy.Field()
                    newField.name, newField.aliasName, newField.type = gfield, gfield, "TEXT"
                    outtbl_flist.append(newField)
                    if self.params[9].value:
                        newField = arcpy.Field()
                        newField.type = "DOUBLE"
                        if "point" in shpType.lower():
                            newField.name, newField.aliasName = "PercentCount", "Percent of point count"
                        elif shpType == "Polyline":
                            newField.name, newField.aliasName = "PercentLength", "Percent Length"
                        else:
                            newField.name, newField.aliasName = "PercentArea", "Percent Area"
                        outtbl_flist.append(newField)
                    self.params[10].schema.additionalFields = outtbl_flist

            self.params[2].schema.additionalFields = outfc_flist
