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

def canChangeFieldNamd(fields, current,  compareOnly = False):
    listTypes = ["DEFINED_INTERVAL", "EQUAL_INTERVAL",
                  "GEOMETRIC_INTERVAL", "MANUAL",
                  "NATURAL_BREAKS", "QUANTILE",
                  "STANDARD_DEVIATION", "UNIQUE_VALUES"]

    if type(current) !=  str:
        return False
    for fld in fields:
        for typ in listTypes:
            temp = fld + "_" + typ
            if compareOnly:
                if temp == current:
                    return True
            else:
                #### Use Contain ####
                if temp in current:
                    return True
                    lft = current.replace(temp,"")
                    if len(lft) == 0:
                        return True
                    else:
                        try:
                            int(lft)
                            return True
                        except:
                            pass
    return False

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

def isGDB(input, checkSDE = False):
    """Returns whether the input feature class is contained in
    a gdb, robust for feature layer, input and output fc

    INPUTS:
    input (str): feature layer (string), fc input, fc output

    OUTPUT:
    return (bool): is the input in a gdb?
    """

    isContained = False
    path = input
    try:
        d = ARCPY.Describe(input)
        path = str(d.CatalogPath)
    except:
        pass

    try:
        path = path.upper()
        if ".GDB" in path:
            isContained = True
        else:
            if input[-3:].upper() == "SHP":
                isContained = False
            else:
                if ".GDB" in input:
                    isContained = True

    except:
        pass
    return isContained

def checkSizeSHP(input, strValue, param ):
    """ if Optional output field name is very long for shp """
    bad = False
    if not isGDB(input):
        bad = len(strValue) > 8
    else:
        bad = len(strValue) > 58

    if bad:
        param.setIDMessage("ERROR", 110359, strValue)
        return False

    return True

def repeatField(fields, outputName, allowedSize = 58):
    """ Check if output field name exists and add a count,
        updating an item in outputNames
    INPUT:
        fields (list): list of field names in fc
        outputNames (str): output names
    """
    cnt = 1
    orgName = outputName
    extr = 1
    while outputName in fields:
        #### Add Count when field output already exists ####
        v = 0
        try:
            lastChr = outputName[-1*extr:]
            v = int(lastChr)
            v += 1
            outputName = outputName[:-1*extr:]  + str(v)
        except:
            outputName+= str(cnt)
        if v > 9 and len(outputName) > allowedSize:
            outputName = outputName[:-(2+extr)]  + str(v)
            extr = 2

        cnt+=1
    return outputName

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
        inputFC1 = parameters[0]
        fieldInterest = parameters[1]
        classificationType = parameters[2].value
        numberCategories = parameters[3].value
        intervalSize = parameters[4].value
        standardDev = parameters[5].value
        classes = parameters[6]
        direction = parameters[7]
        maxThreshold = 10000
        maxClassesToDisplay = 100
        maxNumberCategories = 256
        parameters[2].enabled = True
        parameters[4].enabled = False
        parameters[5].enabled = False
        parameters[3].enabled = True

        if classificationType == "DEFINED_INTERVAL":
            parameters[4].enabled = True
            parameters[5].enabled = False
            parameters[3].enabled = False

        if classificationType == "STANDARD_DEVIATION":
            parameters[5].enabled = True
            parameters[3].enabled = False
            if parameters[5].value in ["", None]:
                parameters[5].value = "ONE"

        name = parameters[8].value
        isTextField = False
        largeFieldName = True
        if inputFC1.value:
            largeFieldName  = isGDB(inputFC1.value)
        fields = []

        if inputFC1.value and fieldInterest.value:
            try:
                desc = ARCPY.Describe(inputFC1.value)
                found = [f for f in desc.fields if f.type == "String" and f.name == fieldInterest.valueAsText ]
                fields = [f.name for f in desc.fields]
                isTextField = len(found)>0
                if isTextField:
                    parameters[2].enabled = True
            except:
                pass

            if isTextField:
                parameters[2].filter.list = ["UNIQUE_VALUES"]
                parameters[2].value  = "UNIQUE_VALUES"
                classificationType = "UNIQUE_VALUES"
                parameters[3].enabled = False
                classes.enabled = False
            else:
                parameters[2].filter.list = ["DEFINED_INTERVAL", "EQUAL_INTERVAL",
                                              "GEOMETRIC_INTERVAL", "MANUAL",
                                              "NATURAL_BREAKS", "QUANTILE",
                                              "STANDARD_DEVIATION"]
                if parameters[2].value  in ["UNIQUE_VALUES", None]:
                    parameters[2].value = "EQUAL_INTERVAL"
        else:
            parameters[2].filter.list = ["DEFINED_INTERVAL", "EQUAL_INTERVAL",
                                  "GEOMETRIC_INTERVAL", "MANUAL",
                                  "NATURAL_BREAKS", "QUANTILE",
                                  "STANDARD_DEVIATION", "UNIQUE_VALUES" ]

        classes.enabled = True
        direction.enabled  = True
        if classificationType != "MANUAL":
            classes.enabled = False
            classes.value = None
        else:
            classes.enabled = True
            direction.enabled  = False
            direction.value  = None
            parameters[3].enabled = False


        if  parameters[2].value and fieldInterest.value:
            repEmtpy = name is None
            current = parameters[8].valueAsText
            if largeFieldName:
                canChange = canChangeFieldNamd(fields, current)
                if  name is None:
                    fld = fieldInterest.valueAsText

                    if "." in fld:
                        fld = fieldInterest.valueAsText.split(".",1)[1].replace(".","_")

                    name = fld+"_"+classificationType
                    name = repeatField(fields, name)
                else:
                    if canChange:
                        fld = fieldInterest.valueAsText
                        if "." in fld:
                            fld = fieldInterest.valueAsText.split(".",1)[1].replace(".","_")

                        if fld +"_"+ classificationType in current:
                            name = current
                        else:
                            name  = repeatField(fields, fld + "_"+ classificationType)
                    else:
                        name = current
            else:
                if name is None:
                    name = "RECLASS"
                    if repEmtpy:
                        name = repeatField(fields, name, 8)

            parameters[8].value = name

        if name is not None:
            nameStr = name
            if isGDB(inputFC1.value):
                nameStr+="_RANGE"
            else:
                nameStr+="_R"

            field = ARCPY.Field()
            field.name = name
            field.type = "Integer"

            field2 = ARCPY.Field()
            field2.name = nameStr
            field2.type = "String"
            try:
                parameters[9].schema.additionalFields = [field, field2]
            except:
                pass
        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        parameters = self.params
        inputFC1 = parameters[0]
        fieldInterest = parameters[1]
        classificationType = parameters[2]
        numberCategories = parameters[3]
        intervalSize = parameters[4]
        standardDev = parameters[5]
        classes = parameters[6]
        maxCatManual = 100
        maxCatOthers = 256
        maxCatDefinedInterval = 1000
        maxThreshold = 10000
        maxCatToDisplay = 100

        if parameters[0].value:
            if isReadOnly(parameters[0].valueAsText):
                parameters[0].setIDMessage("ERROR", 499)
            #### Add Error is Data Type is not allowes ###
            notAllowDataType(parameters[0])

        if parameters[8].value is not None and \
           parameters[0].value is not None:

            checkSizeSHP(parameters[0].valueAsText, parameters[8].valueAsText, parameters[8])

            invalidChar = "`~@#$%^&*()-+=|\,<>?/{}!'[]:;\n\r ."
            for ch in parameters[8].valueAsText:
                if ch in invalidChar:
                    parameters[8].setIDMessage("WARNING", 110360, parameters[8].valueAsText)
                    break
            try:
                desc = ARCPY.Describe(inputFC1.value)

                found = [f for f in desc.fields if str(f.name) == str(parameters[8].valueAsText)]
                isRepeated = len(found)>0
                if isRepeated:
                     parameters[8].setIDMessage("WARNING", 50138, found[0].name)
            except:
                pass

        if classificationType.value:
            if classificationType.valueAsText in ["EQUAL_INTERVAL",
                                                  "GEOMETRIC_INTERVAL",
                                                  "NATURAL_BREAKS", "QUANTILE"]:
                if numberCategories.value is None:
                    numberCategories.setIDMessage("ERROR", 530)

            if classificationType.valueAsText == "MANUAL":
                if classes.value is not None :

                    clss = classes.value
                    for id in NUM.arange(len(classes.value)-1)+1:
                        vIni = clss[id-1][0]
                        vEnd = clss[id][0]

                        cIni = clss[id-1][0]
                        cEnd = clss[id][1]

                        if vEnd <= vIni:
                            classes.setIDMessage("ERROR",556, str(vEnd))
                            continue

                else:
                    classes.setIDMessage("ERROR", 530)

            if  classificationType.valueAsText == "DEFINED_INTERVAL":
                if intervalSize.value is None:
                    intervalSize.setIDMessage("ERROR", 530)
                else:
                    if intervalSize.value <= 0:
                        intervalSize.setIDMessage("ERROR", 531)
                pass

        return
