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
    listTypes =["INVERSE","SQUARE_ROOT","LOGARITHM",
    "BOX_COX","INVARIANCE_BOX_COX","SQUARE","EXPONENTIAL","INVERSE_BOX_COX",
    "INVERSE_INVARIANCE_BOX_COX"]

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

def addFieldInParameter(parameters, outputIndex, fieldnameListToAddC,
                         indexInput=None,
                         fieldTypeList=None, fieldnameAliasListToAdd=None,
                         method  = []):
    """ Create a list field names
    INPUT:
        parameters (list): List parameters
        outputIndex (int): Parameter output index
        fieldnameListToAdd (list) : Field names list/CandidateFields
        indexInput {index}: Index origina feature class
        fieldTypeList {list}: field type for each field name in fieldnameListToAdd
        fieldnameAliasListToAdd {list}: field alias for each field name in fieldnameListToAdd
        method {list}: abr method for shp/gdb
    """
    if len(fieldnameListToAddC) == 0:
        return None

    if hasattr(fieldnameListToAddC[0], "name"):
        fieldnameListToAdd = [i.name for i in fieldnameListToAddC]
    else:
        fieldnameListToAdd = fieldnameListToAddC

    addFields = []
    namesOutput = []

    largeFieldName  = isGDB(parameters[indexInput].value)*1

    for id, fieldName in enumerate(fieldnameListToAdd):
        name = ""
        if largeFieldName:
            fld = fieldName
            if "." in fieldName:
                fld= fieldName.split(".",1)[1].replace(".","_")
            name = fld +"_"+ method[largeFieldName]
        else:
            name =  "TRAN" + str(id+1)
        namesOutput.append(name)

    return namesOutput


dictName = {
    "INVX": ("INV", "INVERSE"),
    "IINVX": ("INV", "INVERSE"),
    "SQRT": ("SQR", "SQUARE_ROOT"),
    "LOG": ("LOG", "LOGARITHM"),
    "BOX-COX": ("BCX","BOX_COX"),
    "IVRT_BOX-COX": ("IBC", "INVARIANCE_BOX_COX"),
    "INV_SQRT": ("SQR", "SQUARE"),
    "INV_LOG": ("LOG", "EXPONENTIAL"),
    "INV_BOX-COX": ("IBCX","INVERSE_BOX_COX"),
    "INV_VRT_BOX-COX": ("IBC", "INVERSE_INVARIANCE_BOX_COX")
}

def repeatField(id, fields, outputNames):
    """ Check if output field name exists and add a count,
        updating an item in outputNames
    INPUT:
        id (int) : index
        fields (list): list of field names in fc
        outputNames (list): output names
    """
    cnt = 1
    flag = False
    while outputNames[id] in fields :
        #### Add Count when field output already exists ####
        try:
            lastChr = outputNames[id][-1]
            v = int(lastChr)
            v += 1
            outputNames[id] = outputNames[id][:-1]  + str(v)
        except:
            outputNames[id]+= str(cnt)
        cnt+=1
        flag = True

    if flag:
        fields.append(outputNames[id])


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
        abrTool = "TRANSF"

        part = parameters[2].valueAsText
        parameters[4].enabled = True
        if part not in ['INVX', 'SQRT', 'LOG', 'BOX-COX', 'INV_SQRT', 'INV_LOG', 'INV_BOX-COX' ]:
            parameters[2].value = 'BOX-COX'

        if parameters[2].value in ['INVX', 'SQRT', 'LOG', 'INV_SQRT', 'INV_LOG' ]:
            parameters[3].enabled = False
        else:
            parameters[3].enabled = True

        if parameters[2].value == "INVX":
            parameters[4].enabled = False

        method = [abrTool]
        listFields = []

        if parameters[1].value:
            try:
                method.append(dictName[parameters[2].valueAsText][1])

                for value in parameters[1].value:

                    fieldName = value[0]
                    if hasattr(value[0],"value"):
                        fieldName = value[0].value

                    listFields.append(fieldName)
            except:
                pass
            parameters[5].value = parameters[0].value

            if len(listFields):
                outputNames = addFieldInParameter(
                    parameters,
                    5,
                    listFields,
                    indexInput=0,
                    method = method,
                    )

                mapTable = parameters[1].value
                outList = []

                fields = []
                try:
                    fieldsObjs = ARCPY.ListFields(parameters[0].value)
                    fields = [f.name for f in fieldsObjs]
                except:
                    pass

                if mapTable:
                    nValues = len(mapTable)
                    nSelectedFields = len(listFields)

                    for id, fld in enumerate(listFields):
                        current = None
                        try:
                            current = mapTable[id][1]
                        except:
                            pass

                        canChange = canChangeFieldNamd(fields, current)
                        if current in ["", None]:
                            repeatField(id, fields, outputNames)
                            outList.append([fld, outputNames[id]])
                        else:
                            if canChange:
                                if outputNames[id] in current:
                                     outList.append([fld, current])
                                     fields.append(current)
                                else:
                                    repeatField(id, fields, outputNames)
                                    outList.append([fld, outputNames[id]])
                                    fields.append(outputNames[id])
                            else:
                                outList.append([fld, current])
                                fields.append(current)
                else:
                    for id, fld in enumerate(listFields):
                        repeatField(id, fields, outputNames)
                        outList.append([fld,outputNames[id]])

                parameters[1].value = outList

                addFields = []
                for i in outList:
                    field = ARCPY.Field()
                    field.name = i[1]
                    field.type = "Double"
                    addFields.append(field)

                try:
                    parameters[5].schema.additionalFields = addFields
                except:
                    pass
            else:
                parameters[1].value = None
            return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        parameters = self.params
        fields = parameters[1].valueAsText
        fieldMap = parameters[1]
        invalidChar = "`~@#$%^&*()-+=|\,<>?/{}!'[]:;\n\r ."
        abrTool = "TRANSF"
        inverse = "INVERSE"
        method  = parameters[2].value
        shift = parameters[4].value
        power = parameters[3].value

        if parameters[0].value:
            if isReadOnly(parameters[0].valueAsText):
                parameters[0].setIDMessage("ERROR", 499)
            #### Add Error is Data Type is not allowes ###
            notAllowDataType(parameters[0])

        if shift is not None:
            if shift < 0:
                parameters[4].setIDMessage("ERROR", 30111, parameters[4].displayName)

        if method =="INV_BOX-COX" and power is None:
            parameters[3].setIDMessage("ERROR", 530)

        if parameters[4].value is None and  method in [ 'LOG', 'BOX-COX' ]:
            parameters[4].setIDMessage("WARNING", 230003)

        if parameters[4].value is None and  method in ['SQRT' ]:
            parameters[4].setIDMessage("WARNING", 230004)

        if fields not in ["", None]:
            sourceFields = []
            try:
                descInfo = ARCPY.Describe(parameters[0].value)
                sourceFields = [i.name for i in descInfo.fields]
            except:
                pass

            if fieldMap.value is not None:
                nnames = [str(f[0].value) for f in fieldMap.values]
                nnamesI = [str(f[1]) for f in fieldMap.values]
                
                liv = nnamesI.copy()
                for x in set(liv):
                    liv.remove(x)

                dup = list(set(liv))

                liv = nnames.copy()
                for x in set(liv):
                    liv.remove(x)

                dupO = list(set(liv))


                largeNameAllowed = isGDB(parameters[0].value)
                repeated = []
                badString = []
                largeName= []
                for id, el in enumerate(nnamesI):
                    if not largeNameAllowed and len(el) > 10:
                        largeName.append(el)
                    try:
                        int(el[0])
                        badString.append(el)
                    except:
                       pass

                    for ch in el:
                        if ch in invalidChar:
                            badString.append(el)
                            break

                    if el in sourceFields:
                        repeated.append(el)
                if len(repeated):
                   fieldMap.setIDMessage("WARNING",50138,", ".join(repeated))

                if len(largeName):
                    fieldMap.setIDMessage("ERROR", 110359,", ".join(largeName))

                if len(badString):
                    fieldMap.setIDMessage("WARNING", 110360, ", ".join(badString))

                if len(dup):
                    fieldMap.setIDMessage("ERROR", 120108,", ".join(dup))
               
                if len(dupO):
                    fieldMap.setIDMessage("ERROR", 120108,", ".join(dupO))
