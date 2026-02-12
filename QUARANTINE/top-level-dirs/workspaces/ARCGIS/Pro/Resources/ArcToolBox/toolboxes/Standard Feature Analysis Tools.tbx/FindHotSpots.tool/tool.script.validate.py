"""Tool Validator for Local Gi*: Version 10.1."""

import os as OS
import sys as SYS
import arcpy as ARCPY

class ToolValidator:
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup the Geoprocessor and the list of tool parameters."""
        self.params = ARCPY.GetParameterInfo()
        #self.shapeType = None

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""

        #### Aggregate Polygons ####
        #self.params[4].enabled = 0
        #self.params[5].enabled = 0
        #self.params[0].filter.list = ["Point",  "Multipoint", "Polygon"]

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parmater
        has been changed."""

        self.fieldObjects = {}
        if self.params[0].altered:
            if self.params[0].value:
                self.setParameterInfo(self.params[0].value)
            if self.shapeType in ["POLYGON"]:
                self.params[4].enabled = 0
                self.params[5].enabled = 0
            else:
                #### For Points ####
                self.params[4].enabled = 1
                self.params[5].enabled = 1
        if self.params[5].value:
            try:
                desc = arcpy.Describe(self.params[5].value)
                aggPolyFields = [field.name for field in desc if field.type.lower() in ["integer", "smallinteger", "double", "single"]]
            except:
                pass

        # if self.shapeType not in ["POLYGON"]:
            # fieldName = self.params[1].value
            # if fieldName != "":
                # #### If Marked, Allow Density, No Agg Method ####
                # self.params[3].enabled = 0
                # self.params[4].enabled = 0
            # else:
                # #### If Unmarked, Allow Poly FCs ####
                # self.params[3].enabled = 1
                # self.params[4].enabled = 1

        #### Add Fields ####
        addFields = []

        #### Result Fields ####
        fieldNames = ["GiZScore", "GiPValue", "Gi_Bin"]
        fieldTypes = ["DOUBLE", "DOUBLE", "LONG"]

        #### Analysis Field ####
        if self.params[2].value:
            fieldName = self.params[2].value.value
            if fieldName in self.fieldObjects:
                addFields.append(self.fieldObjects[fieldName])
        else:
            analysisName = "JOIN_COUNT"
            fieldNames = [analysisName] + fieldNames
            fieldTypes = ["LONG"] + fieldTypes

        #### Add Master Field ####
        if self.params[0].value:
            masterFieldObj = ARCPY.Field()
            masterFieldObj.name = "SOURCE_ID"
            masterFieldObj.type = "LONG"
            addFields.append(masterFieldObj)

        for fieldInd, fieldName in enumerate(fieldNames):
            fieldType = fieldTypes[fieldInd]
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = fieldType
            addFields.append(newField)
        self.params[6].schema.additionalFields = addFields

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        if not self.params[2].value:
            if self.params[0].value:
                try:
                    desc = ARCPY.Describe(self.params[0].value)
                    shapeType = desc.ShapeType.upper()
                    if shapeType == "POLYGON":
                        self.params[2].setIDMessage("ERROR", 110151)
                    #else:
                        #self.params[0].setIDMessage("ERROR", 84425)
                except:
                    pass

    def setParameterInfo(self, inputFC):
        try:
            desc = ARCPY.Describe(inputFC)
            shapeType = desc.shapetype.upper()
            self.oidName = desc.oidFieldName
            self.shapeType = shapeType
            for field in desc.fields:
                self.fieldObjects[field.name] = field
        except:
            self.oidName = None
            self.shapeType = None
