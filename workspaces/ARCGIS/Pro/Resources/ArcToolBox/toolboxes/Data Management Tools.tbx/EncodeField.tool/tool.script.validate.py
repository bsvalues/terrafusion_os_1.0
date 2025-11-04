import arcpy as ARCPY
import numpy as NUM

def notAllowDataType(inputParameter, dataTypes =["RasterBand"]):
    """Is a raster band
    INPUTS:
    input (Parameter): input Paramter

    OUTPUT: None
    """
    isContained = False
    try:
        d = ARCPY.Describe(inputParameter.valueAsText)
        if d.dataType in dataTypes :
            isContained = True
    except:
        pass
    if isContained:
        inputParameter.setIDMessage("ERROR", 732,inputParameter.displayName,inputParameter.valueAsText)


def isReadOnly(input):
    """Returns whether the input is a dataset read only
    INPUTS:
    input (str): feature layer/Table View (string), fc input, fc output

    OUTPUT:
    return (bool): is the input in a gdb?
    """
    formatReadOnly = [".BDC", ".CSV"]
    isContained = False
    path = input
    try:
        d = ARCPY.Describe(input)
        path = d.CatalogPath.upper()
        for ext in formatReadOnly:
            if ext in path:
                isContained = True
                break

        if d.dataType in ["FeatureLayer", "TableView"] and ".NC" in path:
            isContained = True
    except:
        pass
    return isContained

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup ARCPY and the list of tool parameters."""
        self.params = ARCPY.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        parameters = self.params
        dirName = {
            "ONEHOT": "ENC_HOT1",
            "ONECOLD": "ENC_COLD1",
            "ORDINAL": "ENC_ORD",
            "BINARY": "ENC_BIN1",
            "TEMPORAL":"ENC_TEMP"}

        #### Change filter list depending on field type ####
        if parameters[0].value and parameters[1].value:
            try:
                desc = ARCPY.Describe(parameters[0].value)
                fields = [1 for field in desc.fields if field.type.upper() == "DATE" and field.name == parameters[1].valueAsText ]
                if len(fields):
                    parameters[2].filter.list =  ['TEMPORAL']
                    parameters[2].value = "TEMPORAL"
                    parameters[3].enabled = True
                    parameters[4].enabled = True
                    parameters[5].enabled = True
                else:
                    parameters[2].filter.list =  ['ONEHOT', 'ONECOLD']
                    if parameters[2].valueAsText == "TEMPORAL":
                        parameters[2].value = "ONEHOT"

                    parameters[3].enabled = False
                    parameters[4].enabled = False
                    parameters[5].enabled = False
            except:
                parameters[2].filter.list =  ['ONEHOT', 'ONECOLD']
                parameters[3].enabled = False
                parameters[4].enabled = False
                parameters[5].enabled = False
                pass

        method = parameters[2].valueAsText
        if  parameters[2].value is None:
            parameters[2].value = "ONEHOT"
            method = "ONEHOT"

        if parameters[2].valueAsText == "TEMPORAL":
            if parameters[4].value not in ["END_TIME", "START_TIME", "REFERENCE_TIME"]:
                parameters[4].value = "END_TIME"

        parameters[5].enabled = False
        if parameters[2].valueAsText == "TEMPORAL":
            if  parameters[4].value == "REFERENCE_TIME":
                parameters[5].enabled = True
            else:
                parameters[5].value = None

        name = ""
        if method in dirName:
            name = dirName[method]
            if parameters[2].valueAsText == "TEMPORAL" and parameters[1].value is not None:
                field = ARCPY.Field()
                field.name = "TS_{0}".format(parameters[1].valueAsText)
                field.type = "Integer"
                nameST = "ST_{0}"
                nameET = "ET_{0}"

                field1 = ARCPY.Field()
                field1.name = nameST.format(parameters[1].valueAsText)
                field1.type = "Date"

                field2 = ARCPY.Field()
                field2.name = nameET.format(parameters[1].valueAsText)
                field2.type = "Date"

                try:
                    parameters[6].schema.additionalFields = [field, field1, field2]
                except:
                    pass

        return

    def updateMessages(self):
        parameters = self.params
        if parameters[0].value:
            if isReadOnly(parameters[0].valueAsText):
                parameters[0].setIDMessage("ERROR", 499)
            #### Add Error is Data Type is not allowes ###
            notAllowDataType(parameters[0])

        if parameters[2].valueAsText == "TEMPORAL" and  parameters[4].value == "REFERENCE_TIME" and  parameters[5].value is None:
            parameters[5].setIDMessage("ERROR", 530)

        if parameters[3].altered:
            if parameters[3].value:
                value, unit = str(parameters[3].value).split()
                try:
                    if int(value) <= 0:
                        parameters[3].setIDMessage("ERROR", 110047)
                except:
                    parameters[3].setIDMessage("ERROR", 110007)
        return
