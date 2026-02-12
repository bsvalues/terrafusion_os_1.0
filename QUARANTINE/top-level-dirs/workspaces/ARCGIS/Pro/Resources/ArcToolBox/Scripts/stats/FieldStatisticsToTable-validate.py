import arcpy as ARCPY
import numpy as NUM
import os as OS
################# Constants #################

#### Key word for statistic MiniChart.
_key_MiniChart = "MINICHART"
#### Key word for statistic Minimum.
_key_Minimum = "MINIMUM"
#### Key word for statistic Maximum.
_key_Maximum = "MAXIMUM"
#### Key word for statistic Mean.
_key_Mean = "MEAN"
#### Key word for statistic Median.
_key_Median = "MEDIAN"
#### Key word for statistic StandardDeviation.
_key_StandardDeviation = "STANDARDDEVIATION"
#### Key word for statistic Count.
_key_Count = "COUNT"
#### Key word for statistic NumberOfNulls.
_key_NumberOfNulls = "NULLS"
#### Key word for statistic NumberUniqueValues.
_key_NumberUniqueValues = "NUMBEROFUNIQUEVALUES"
#### Key word for statistic Mode.
_key_Mode = "MODE"
#### Key word for statistic LeastCommon.
_key_LeastCommon = "LEASTCOMMON"
#### Key word for statistic Outliers.
_key_Outliers = "OUTLIERS"
#### Key word for statistic Sum.
_key_Sum = "SUM"
#### Key word for statistic Range.
_key_Range = "RANGE"
_key_Range_alias = "Range"
#### Key word for statistic IQR.
_key_IQR = "INTERQUARTILERANGE"
#### Key word for statistic FirstQuartile.
_key_FirstQuartile = "FIRSTQUARTILE"
#### Key word for statistic ThirdQuartile.
_key_ThirdQuartile = "THIRDQUARTILE"
#### Key word for statistic CoefficientOfVariation.
_key_CoefficientOfVariation = "COEFFICIENTOFVARIATION"
#### Key word for statistic Skewness.
_key_Skewness = "SKEWNESS"
#### Key word for statistic Kurtosis.
_key_Kurtosis = "KURTOSIS"
#### Key word for statistic FieldName.
_key_FieldName = "FIELDNAME"
#### Key word for statistic Alias.
_key_Alias = "ALIAS"
#### Key word for statistic FieldType.
_key_FieldType = "FIELDTYPE"

statsKey = {
 _key_FieldName : "FieldName",
 _key_Alias : "Alias",
 _key_FieldType : "FieldType",
 _key_NumberOfNulls : "Nulls",
 _key_Minimum : "Minimum",
 _key_Maximum : "Maximum",
 _key_Mean : "Mean",
 _key_StandardDeviation : "StandardDeviation",
 _key_Median : "Median",
 _key_Count : "Count",
 _key_NumberUniqueValues : "NumberofUniqueValues",
 _key_Mode : "Mode",
 _key_LeastCommon : "LeastCommon",
 _key_Outliers : "Outliers",
 _key_Sum : "Sum",
 _key_Range : "Range",
 _key_IQR : "InterquartileRange",
 _key_FirstQuartile : "FirstQuartile",
 _key_ThirdQuartile : "ThirdQuartile",
 _key_CoefficientOfVariation : "CoefficientofVariation",
 _key_Skewness : "Skewness",
 _key_Kurtosis : "Kurtosis"
 }

 
 #### Short field Names ####
statsShort= {
 _key_FieldName : "FieldName",
 _key_Alias : "Alias",
 _key_FieldType : "FieldType",
 _key_NumberOfNulls : "Nulls",
 _key_Minimum : "Minimum",
 _key_Maximum : "Maximum",
 _key_Mean : "Mean",
 _key_StandardDeviation : "StdDev",
 _key_Median : "Median",
 _key_Count : "Count",
 _key_NumberUniqueValues : "Unique",
 _key_Mode : "Mode",
 _key_LeastCommon : "LeastCommn",
 _key_Outliers : "Outliers",
 _key_Sum : "Sum",
 _key_Range : "Range",
 _key_IQR : "IQR",
 _key_FirstQuartile : "FirstQuart",
 _key_ThirdQuartile : "ThirdQuart",
 _key_CoefficientOfVariation : "CoefVar",
 _key_Skewness : "Skewness",
 _key_Kurtosis : "Kurtosis",
 }

NumericColumnsForAlls = [ _key_Count, _key_NumberOfNulls, _key_NumberUniqueValues, _key_Outliers]

TextColumnsForAlls = [_key_FieldName, _key_Alias, _key_FieldType]

NumericColumns = [_key_FieldName, _key_Alias, _key_FieldType,
                   _key_Mean, _key_Minimum, _key_Maximum, _key_StandardDeviation, _key_Kurtosis,
                   _key_Skewness, _key_Median, _key_FirstQuartile, _key_ThirdQuartile, _key_IQR, _key_Mode,
                   _key_Count, _key_NumberOfNulls, _key_Outliers, _key_NumberUniqueValues,
                   _key_Sum, _key_CoefficientOfVariation, _key_Range, _key_LeastCommon]

TextColumns = [_key_FieldName, _key_Alias, _key_FieldType,
                      _key_Count, _key_NumberOfNulls, _key_Mode, _key_NumberUniqueValues, _key_Mode, _key_LeastCommon ]

DateColumns = [_key_FieldName, _key_Alias, _key_FieldType,
                    _key_Mean, _key_Median, _key_Minimum, _key_Maximum, _key_NumberOfNulls,
                   _key_Mode, _key_Count, _key_NumberUniqueValues, _key_Range, _key_LeastCommon, _key_FirstQuartile, _key_ThirdQuartile ]



def checkForDuplicateOutput(outputName, workSpace, count, ext):
    if count == 0:
        outputFile = OS.path.join(workSpace, outputName+ ext)
    else:
        outputFile = OS.path.join(workSpace, outputName+ str(count)+ext)
    if ARCPY.Exists(outputFile):
        return checkForDuplicateOutput(outputName, workSpace, count + 1, ext)
    else:
        return outputFile


def createOutputString(parameters, sourceIndex, toolNameString, workspaceParIndex = 2):

    desc = ARCPY.Describe(parameters[sourceIndex].value)
    name = desc.nameString if hasattr(desc, "nameString") else desc.name
    isGroup = False
    path = parameters[sourceIndex].valueAsText.upper()
    if "\\" in name:
        name = name.split("\\")[-1]
        isGroup = True

    inPath = parameters[workspaceParIndex].valueAsText
    if inPath == '' or isGroup:
        current = ARCPY.mp.ArcGISProject("CURRENT").defaultGeodatabase
    else:
        current = inPath

    ext = ".dbf"
    if current not in [None, ""]:
        isG, typ = isDB(current)
        if isG :
            ext = ""

    name = ARCPY.ValidateTableName(name)
    outputPath =  checkForDuplicateOutput(name + "_"+toolNameString , current, 0, ext)
    path, nameOut = OS.path.split(outputPath)
    return nameOut

def isDB(workspace):
    if workspace is None:
        return True
    typeW = "Folder"
    isGDB = False
    if workspace is not None:
        lst = [".GDB", "MEMORY", ".SDE", ".SQLITE", ".GPKG", ".GEODATABASE"]
        for e in lst:
            if e in workspace.upper():
                isGDB = True
                typeW = e
    else:
        isGDB = True
    return isGDB, typeW


def addSchema(parameters, targetIndex, type, isGDB = True , listStats = None, listOutputNames= None):
    listFields = []
    
    dictInfo = {}
    if isGDB:
        dictInfo = statsKey
    else:
        dictInfo = statsShort
    
    if listStats is not None:
        dictInfo = {name:listOutputNames[id] for id, name in enumerate(listStats)}
            
    defaultType  = "TEXT"
    if type == "NUMERIC" or type == "ALL":
        if listStats is None:
            listStats = NumericColumns
        else:
            listStats = [stat for stat in listStats if stat in NumericColumns]
            
        if type == "Numeric":
            defaultType  = "DOUBLE"

    if type == "TEXT":
        if listStats is None:
            listStats = TextColumns
        else:
            listStats = [stat for stat in listStats if stat in TextColumns]
        defaultType  = "TEXT"
        
    if type == "DATE":
        if listStats is None:
            listStats = DateColumns
        else:
            listStats = [stat for stat in listStats if stat in DateColumns]
        defaultType  = "DATE"

    
    for stat in listStats:
        if stat in TextColumnsForAlls:
            field = ARCPY.Field()
            field.name = dictInfo[stat]
            field.type = "TEXT"
            listFields.append(field)
        elif stat in NumericColumnsForAlls:
            field = ARCPY.Field()
            field.name = dictInfo[stat]
            field.type = "LONG"
            listFields.append(field)
        else:
            field = ARCPY.Field()
            field.name = dictInfo[stat]
            field.type = defaultType
            listFields.append(field)
            
    parameters[targetIndex].schema.additionalFields = listFields
                
class ValueTableCheck(object):
    def __init__(self, values):
        self.typeOutput = []
        self.outputName = []
        if values is not None:
            for val in values:
                self.typeOutput.append(val[0])
                self.outputName.append(val[1])

    def updateExtensionInOutputs(self, workspace, isGDB, typeW):
        otherFormats  = [".TXT", ".ASC",".DAT"]
        for i, typeO in enumerate(self.typeOutput):
            row = [typeO, self.outputName[i]]
            uName = row[1].upper()
            if not isGDB:
                if uName == "":
                    empty = True
                elif workspace.upper().startswith("MEMORY") or workspace.upper().startswith("IN_MEMORY"):
                    if uName.endswith(".DBF"):
                        self.outputName[i] = row[1].replace(row[1][-4:],"")
                    else:
                        self.outputName[i] = row[1]

                elif len(row[1]) > 4  and not uName.endswith(".DBF"):
                    notSupport = [i for i in otherFormats if i == row[1][-4:].upper()]
                    if len(notSupport) > 0:
                        self.outputName[i] = row[1].replace(row[1][-4:],"").replace(".","")+".dbf"
                    else:
                        self.outputName[i] = row[1].replace(".","")+".dbf"
                else:
                    if not uName.endswith(".DBF"):
                        self.outputName[i] = row[1].replace(".","")+".dbf"
            else:
                if uName == "":
                    empty = True
                elif typeW in [".SDE", ".SQLITE"]:
                    if uName.endswith(".DBF"):
                        self.outputName[i] = row[1].replace(row[1][-4:],"")
                    else:
                        self.outputName[i] = row[1]                    
                elif uName.endswith(".DBF"):
                    self.outputName[i] = row[1][:-4]
                else:
                    notSupport = [i for i in otherFormats if len(row[1])>=4  and i == row[1][-4:].upper()]
                    if len(notSupport) > 0:
                        self.outputName[i] = row[1].replace(row[1][-4:],"").replace(".","")
                    else:
                        self.outputName[i] = row[1].replace(".","")

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
        inputData = parameters[0].value
        fieldsV = parameters[1].valueAsText
        outputTables = parameters[3].value
        groupBy = parameters[4].valueAsText
        workspace =  parameters[2].valueAsText
        outputStats = parameters[5].value 
        outputNumeric = parameters[6].valueAsText
        outputText = parameters[7].valueAsText
        outputDate = parameters[8].valueAsText
        outputAll = parameters[9].valueAsText

        if workspace  == "":
            workspace = None
        if outputTables == "":
            outputStats = None

        desc = None
        allFields = {}
        try:
            desc = ARCPY.Describe(inputData)
            allFields = {fld.name:fld for fld in desc.fields}
        except:
            pass
        tFlds = {}
        dFlds = {}
        nFlds = {}
        aFlds = {}

        fields = ""
        if fieldsV not in ["", "#", None]:
            fields = fieldsV

        for fldName in fields.split(";"):
            if fldName in allFields:
                aFlds[fldName] = allFields[fldName]
                if allFields[fldName].type.upper() in ["STRING", "TEXT"]:
                    tFlds[fldName] = allFields[fldName]
                elif allFields[fldName].type.upper() in ["DATE", "DATEONLY", "TIMEONLY","TIMESTAMPOFFSET"]:
                    dFlds[fldName] = allFields[fldName]
                else:
                    nFlds[fldName] = allFields[fldName]

        toolName = "FieldStatisticsToTable"
        allInfo = [9, toolName, aFlds]
        filters = []
        defaultNames = {
                        "NUMERIC": [6,toolName +"_"+ "Numeric",nFlds],
                        "TEXT": [7, toolName +"_"+ "Text", tFlds],
                        "DATE": [8, toolName +"_"+ "Date", dFlds],
                        }

        if workspace is None:
            workspace = ARCPY.mp.ArcGISProject("CURRENT").defaultGeodatabase
            parameters[2].value = workspace

        isGDB, typeW = isDB(workspace)

        isOracle = False
        
        if workspace not in ["", None]:
            try:
                des= ARCPY.Describe(workspace)
                isOracle = "SDE:ORACLE" in des.connectionProperties.instance.upper()
            except:
                pass

        if isOracle:
            statsKey[_key_Mode] = "Mode_"
            statsShort[_key_Mode] = "Mode_"
 
        usrOut = {}

        if len(aFlds)>0:
            outInfo = []
            
            defaultNames["ALL"] = allInfo

            for name in defaultNames:
                if len(defaultNames[name][2]) > 0 and name not in filters:
                    filters.append(name)

            parameters[3].filters[0].list = filters
            
            if outputTables is not None and workspace:
                outInfo = []
                vt = ValueTableCheck(outputTables)
                vt.updateExtensionInOutputs(workspace, isGDB, typeW)

                for i, name in enumerate(vt.typeOutput):
                    info = defaultNames[name][1]

                    default = vt.outputName[i]
                    if vt.outputName[i] in [None, '']:
                        default = createOutputString(parameters, 0, info)  

                    outInfo.append([name, default])
                    if len(defaultNames[name]) == 3:
                        defaultNames[name].append(default)

                parameters[3].value = outInfo
        else:
            parameters[3].filters[0].list = ['NUMERIC','TEXT','DATE','ALL']

        listStats = None
        listOutputNames = None
        allowedFields= set()

        for e in statsKey:
            if len(tFlds) > 0:
               if e in TextColumns and len(defaultNames["TEXT"]) == 4:
                   allowedFields.add(e)
            if len(nFlds) > 0 and len(defaultNames["NUMERIC"]) == 4:
               if e in NumericColumns:
                   allowedFields.add(e) 
            if len(dFlds) > 0  and len(defaultNames["DATE"]) == 4:
               if e  in DateColumns:
                   allowedFields.add(e)
            if len(dFlds) > 0  and len(defaultNames["ALL"]) == 4:
                allowedFields.add(e)

        if len(allowedFields)>0:
            listA= list(allowedFields)
            oList = []
            for e in statsKey:
                if e in listA:
                    oList.append(e)
            nList = oList

        else:

            nList =list(statsKey.keys())

        parameters[5].filters[0].list = nList

        names = ["ALL", "NUMERIC", "TEXT", "DATE"]

        if outputStats:
            listStats = []
            listOutputNames = []
            namesGDB = list(statsKey.values())
            namesBDF = list(statsShort.values())

            if isGDB:
                for e in outputStats:
                    key = e[0]
                    val = e[1]
                    if isOracle and val == "Mode":
                        val = "Mode_"
                    if key in statsKey:
                        listStats.append(key)
                        if e[1] == "":
                            listOutputNames.append(statsKey[key])
                        else:
                            if statsKey[key] == val:
                                listOutputNames.append(val)
                            elif statsShort[key] == val:
                                listOutputNames.append(statsKey[key])
                            else:
                                listOutputNames.append(val)
            else:
                for e in outputStats:
                    if e[0] in statsKey:
                        listStats.append(e[0])
                        val = e[1]
                        if isOracle and val == "Mode":
                            val = "Mode_"                        
                        if val == "":
                            listOutputNames.append(statsShort[e[0]])
                        else:
                            if statsShort[e[0]] == val:
                                listOutputNames.append(val)
                            elif statsKey[e[0]] == e[1]:
                                listOutputNames.append(statsShort[e[0]])
                            else:
                                if len(e[1]) > 10:
                                    listOutputNames.append(val[0:10])
                                else:
                                    listOutputNames.append(val)
            parameters[5].value = [[a,b] for a,b in zip(listStats,listOutputNames)]

        for name in names:
            if name in defaultNames and len(defaultNames[name]) == 4:
                ### workspace ###
                if parameters[2].valueAsText not in ["", None]:
                    parameters[defaultNames[name][0]].value  = OS.path.join(parameters[2].valueAsText, defaultNames[name][3])
                addSchema(parameters, defaultNames[name][0] , name, 
                          isGDB =  ".GDB" in workspace.upper() or "MEMORY" in workspace.upper(), 
                          listStats = listStats, 
                          listOutputNames = listOutputNames)
            else:
                if name in defaultNames:
                    parameters[defaultNames[name][0]].value = None


    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        parameters = self.params
        inputData = parameters[0].value
        fieldsV = parameters[1].valueAsText
        outputTables = parameters[3]
        groupBy = parameters[4].valueAsText
        workspace =  parameters[2].valueAsText
        outputStats = parameters[5] 
        outputNumeric = parameters[6].valueAsText
        outputText = parameters[7].valueAsText
        outputDate = parameters[8].valueAsText
        outputAll = parameters[9].valueAsText
        desc = None
        allFields = {}
        invalidChar = "`~@#$%^&*()-+=|\,<>?/{}!'[]:;\n\r ."
        try:
            desc = ARCPY.Describe(inputData)
            allFields = {fld.name:fld for fld in desc.fields}
        except:
            pass
        tFlds = {}
        dFlds = {}
        nFlds = {}
        if workspace  == "":
            workspace = None
        if outputTables.value == "":
            outputTables.value = None

        fields = ""
        if fieldsV not in ["", "#", None]:
            fields = fieldsV
        lstFlds =  fields.split(";")

        for fldName in lstFlds:
            if fldName in allFields:
                if allFields[fldName].type.upper() =="STRING":
                    tFlds[fldName] = allFields[fldName]
                elif allFields[fldName].type.upper() in ["DATE", "DATEONLY", "TIMEONLY","TIMESTAMPOFFSET"]:
                    dFlds[fldName] = allFields[fldName]
                else:
                    nFlds[fldName] = allFields[fldName]
        usrOut = {}

        if len(lstFlds):
            liv = lstFlds
            for x in set(liv):
                liv.remove(x)
            dupNames = list(set(liv))

            if len(dupNames):
                parameters[1].setIDMessage("ERROR", 120108, ",".join(dupNames))

        isGDB, typeW = isDB(workspace)

        if outputTables.value:
            usrOut = {row[0]:row[1] for row in outputTables.value}

        toolName = "FieldStatisticsToTable"
        if outputTables.value:
            defaultNames = {"NUMERIC": [6,toolName +"_"+ "Numeric",nFlds],
                            "TEXT": [7, toolName +"_"+ "Text", tFlds],
                            "DATE": [8, toolName +"_"+ "Date", dFlds]}
            outInfo = []

            vt = ValueTableCheck(outputTables.values)
            for i, typeO in enumerate(vt.typeOutput):
                row = [typeO, vt.outputName[i]]
                name = row[0]

                naf = row[1]
                if naf is not ["", None]:
                    try:
                        int(naf[0])
                        outputTables.setIDMessage("ERROR", 30164, naf)
                    except:
                        pass

            if "ALL" not in vt.typeOutput:
                notFound = []
                for usr in defaultNames:
                    if len(defaultNames[usr][2]) > 0:
                        if usr not in vt.typeOutput:
                            notFound.append(usr)

                if len(notFound) > 0:
                    outputTables.setIDMessage("WARNING", 110416,",".join(notFound))

            if len(vt.outputName):
                dictDup ={i.upper():i for i in vt.outputName}
                liv = list(map(str.upper,vt.outputName))
                badString = []

                for x in set(liv):
                    orX = x
                    if not isGDB:
                        orX = orX.replace(".DBF","")   

                    for ch in orX:
                        if ch in invalidChar:
                            badString.append(x)
                            break
                    liv.remove(x)
                    
                dupNames = list(set(liv))

                if len(dupNames):
                    lsD = [dictDup[i] for i in dupNames if i != ""]
                    
                    if len(lsD) > 0: 
                        outputTables.setIDMessage("ERROR", 110415,",".join(lsD))

                if len(badString):
                    outputTables.setIDMessage("ERROR", 30164, ",".join([dictDup[i] for i in badString]))

            if len(vt.typeOutput):
                liv = list(map(str.upper,vt.typeOutput))
                for x in set(liv):
                    liv.remove(x)
                dupNames = list(set(liv))

                if len(dupNames):
                    outputTables.setIDMessage("ERROR", 110415, ",".join(dupNames))


        if outputStats.value:
            names = []
            outputNames = []
            dbf= not isGDB

            largeName = []
            badString = []
            for e in outputStats.value:
                names.append(e[0])
                outputNames.append(e[1])
                if dbf and len(e[1]) > 10:
                    largeName.append(e[1])
                try:
                    int(e[1][0])
                    badString.append(e[1])
                    continue
                except:
                   pass

                try:
                    for ch in e[1]:
                        if ch in invalidChar:
                            badString.append(e[1])
                            break
                except:
                    pass

            if len(largeName):
                outputStats.setIDMessage("ERROR", 110359,", ".join(largeName))

            liv = names.copy()
            for x in set(liv):
                liv.remove(x)
            dupNames = list(set(liv))

            if len(dupNames):
                outputStats.setIDMessage("ERROR", 110415,",".join(dupNames))

            liv = outputNames.copy()
            for x in set(liv):
                liv.remove(x)
            dupOutputNames = list(set(liv))

            if len(dupOutputNames):
                outputStats.setIDMessage("ERROR", 110415,", ".join(dupOutputNames))

            if len(badString):
                outputStats.setIDMessage("WARNING", 110360, ", ".join(badString))
        else:
            outputStats.setIDMessage("WARNING", 230006)

        if outputStats.hasError():
            if outputStats.message.count("800") > 1:
                outputStats.clearMessage()
                outputStats.setIDMessage("WARNING",110458)
 
        if outputTables.hasError():
            if outputTables.message.count("800") > 1:
                outputTables.clearMessage()
                outputTables.setIDMessage("ERROR", 800, "| ".join(outputTables.filters[0].list) + fr" ({outputTables.displayName})")

 
        return
