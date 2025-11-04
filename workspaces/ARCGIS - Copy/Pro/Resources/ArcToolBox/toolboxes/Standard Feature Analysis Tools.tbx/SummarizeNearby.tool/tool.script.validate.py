import arcpy

linearUnits = ["METERS", "KILOMETERS", "FEET", "YARDS", "MILES"]
arealUnits = ["ACRES", "HECTARES", "SQUAREMETERS", "SQUAREKILOMETERS",
                               "SQUAREFEET", "SQUAREYARDS", "SQUAREMILES"]
timeUnits = ["SECONDS", "MINUTES", "HOURS"]

nearTypeList = ["DRIVINGDISTANCE", "DRIVINGTIME",
                "STRAIGHTLINE", "TRUCKINGDISTANCE", "TRUCKINGTIME",
                "WALKINGDISTANCE", "WALKINGTIME"]

nonDependencyParams = [0,3,5]
noConsequenceParams = [4,6,7,8,16]

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()


    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        ##disable shape summary units
        #self.params[10].enabled = False
        ## disable groupBy Field params 12,13
        #self.setGroupParams(False)
        #self.params[13].enabled = False
        #self.params[14].enabled = False
        ##set filter list for  straight line distance type 5,6,7
        ##self.setStraightLineParams(True)
        ##set param dependencies
        #self.params[15].parameterDependencies = [0]
        #self.params[15].schema.clone = True
        #elf.params[16].parameterDependencies = [0]
        #self.params[16].schema.clone = True
        #elf.params[0].filter.list = ["Point",  "Multipoint", "Polyline", "Polygon"]
        #self.params[1].filter.list = ["Point",  "Multipoint", "Polyline", "Polygon"]
        #return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        #Param0:  modify distance units based on shp type of params[0]
        param0 = self.params[0]
        if not param0.hasBeenValidated:
            try:
                shpType = arcpy.Describe(param0).shapeType
            except:
                return
            distanceUnits = self.params[3]
            if "point" in shpType.lower():
                distanceUnits.filter.list = nearTypeList
                if not distanceUnits.value:
                    distanceUnits.value = "STRAIGHTLINE"
                    self.setStraightLineParams(True)
            else:
                distanceUnits.filter.list = ["STRAIGHTLINE"]
                distanceUnits.value = "STRAIGHTLINE"
                self.setStraightLineParams(True)

        param1 = self.params[1]
        summarizeLayer = param1.valueAsText
        if summarizeLayer:
            try:
                shpType = arcpy.Describe(param1).shapeType
            except Exception as e:
                return

        #param10: enable shapesummary units based on param[10]
        if summarizeLayer:
            #modify shape units list based on Summary features
            if self.params[9].value and "point" not in shpType.lower():
                self.params[10].enabled = True
            else:
                self.params[10].enabled = False


        # Param1 : modify shape summary units params[9]
        enabled=False
        if summarizeLayer and not param1.hasBeenValidated:
            if "point" in shpType.lower():
                self.params[10].enabled = False
            elif shpType == "Polyline":
                enabled = True
                self.params[10].filter.list = linearUnits
                val = "KILOMETERS"
                currValue = self.params[5].value
                if currValue:
                    if currValue in linearUnits:
                        val = currValue
                    else:
                        couldBeValue = currValue.strip("SQUARE")
                        if couldBeValue in linearUnits:
                            val = couldBeValue
                self.params[10].value = val
            else:
                enabled = True
                self.params[10].filter.list = arealUnits
                val = "SQUAREKILOMETERS"
                currValue = self.params[10].value
                if currValue:
                    if currValue in arealUnits:
                        val = currValue
                    else:
                        couldBeValue = "".join(("SQUARE", currValue))
                        if couldBeValue in arealUnits:
                            val = couldBeValue
                self.params[10].value = val

            if enabled and self.params[9].value:
                self.params[10].enabled = True
            else:
                self.params[10].enabled = False



        # Param3: modify distance units based on distance type params[4]
        param3 = self.params[3]
        if not param3.hasBeenValidated:
            val = param3.value.lower()
            if ("line" in val) or ("distance" in val):
                self.setStraightLineParams(True)
            else:
                self.setStraightLineParams(False)

        #group field
        groupField = self.params[12].valueAsText
        #fcPath = self.params[2].valueAsText

        # Param12: modify parameters based on groupBy field param
        if groupField:
            self.setGroupParams(True, groupField)
        else:
            self.setGroupParams(False, groupField)

        # if one of the non dependency param is updated, return
        if any(not self.params[i].hasBeenValidated for i in nonDependencyParams):
            return

        #set output dependency
        if summarizeLayer:
            self.setOutputDependency(shpType, groupField)
        return



    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""

         #chk for summaryfields and summarize shape
        if self.params[11].value or self.params[8].value:
            self.params[9].clearMessage()
        else:
            msg = "Atleast one of the parameters Summary fields or Shape units is required."
            self.params[9].setErrorMessage(msg)

        return

    def setGroupParams(self, bValue, groupFieldName=None):
        """ enables or disables groupby field params"""
        self.params[13].enabled = bValue
        self.params[14].enabled = bValue


    def setStraightLineParams(self, isStraightLine):
        """ set params based on straightLine true or False"""
        if isStraightLine:
            self.params[5].filter.list = linearUnits
            self.params[6].enabled = False
            self.params[7].enabled = False
            if self.params[5].value not in linearUnits:
                self.params[5].value = "KILOMETERS"
        else:
            self.params[5].filter.list = timeUnits
            self.params[6].enabled = True
            self.params[7].enabled = True
            if self.params[5].value not in timeUnits:
                self.params[5].value = "MINUTES"


    def setOutputDependency(self, shpType, gfield):
        # output feature class schema
        if self.params[2].value:
            outfc_flist = []
            outtbl_flist = []
            # summary fields
            if self.params[11].altered:
                valuetable = self.params[11].value
                if valuetable:
                    for row in valuetable:
                        newField = arcpy.Field()
                        newField.name = "{}_{}".format(row[1],row[0])
                        newField.aliasName = "{} {}".format(row[1], row[0])
                        newField.type = "DOUBLE"
                        outfc_flist.append(newField)
                        outtbl_flist.append(newField)
            # add BUFF_DIST field
            newField = arcpy.Field()
            newField.name, newField.aliasName, newField.type = "BUFF_DIST", "BUFF_DIST", "DOUBLE"
            outfc_flist.append(newField)
            outtbl_flist.append(newField)
            # add shape summary fields
            if self.params[9].value:
                newField.type = "DOUBLE"
                if "point" in shpType.lower():
                    newField.name = "Point_Count"
                    newField.aliasName = "Count of Points"
                else:
                    units = self.params[10].valueAsText
                    newField.name = "Sum_Length_{}".format(units.replace(" ", ""))
                    newField.aliasName = "Summarized length in {}".format(units)
                    if shpType == "Polygon":
                        newField.name = newField.name.replace("Length", "Area")
                        newField.aliasName = newField.aliasName.replace("length", "area")
                outfc_flist.append(newField)
                outtbl_flist.append(newField)
            # group fields
            if gfield:
                # majority and minority
                if self.params[11].value:
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
                if self.params[14].value:
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
                # join id
                newField = arcpy.Field()
                newField.name, newField.aliasName, newField.type = "JOIN ID", "JOIN_ID", "LONG"
                outfc_flist.append(newField)
                outtbl_flist.append(newField)

                # output group table schema
                if self.params[2].value and self.params[1].value \
                        and self.params[12].valueAsText:
                    #group field
                    gfield = self.params[12].valueAsText
                    newField = arcpy.Field()
                    newField.name, newField.aliasName, newField.type = gfield, gfield, "TEXT"
                    outtbl_flist.append(newField)
                    outtbl_flist.append(newField)
                    if self.params[14].value:
                        if not shpType:
                            shpType = arcpy.Describe(param1).shapeType
                            self.params[15].schema.additionalFields = outfc_flist
                        newField = arcpy.Field()
                        newField.type = "DOUBLE"
                        if "point" in shpType.lower():
                            newField.name, newField.aliasName = "PercentCount", "Percent Count"
                        elif shpType.lower() == "polyline":
                            newField.name, newField.aliasName = "PercentLength", "Percent Length"
                        else:
                            newField.name, newField.aliasName = "PercentArea", "Percent Area"
                        outtbl_flist.append(newField)
                    self.params[16].schema.additionalFields = outtbl_flist
