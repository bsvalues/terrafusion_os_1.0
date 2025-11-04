"""
Source Name:   Space-Time Pattern Mining.pyt
Version:       ArcGIS Pro 2.2 
Author:        Environmental Systems Research Institute Inc.
Description:   Python tool to analyze spatial and temporal pattern of a 3-D
               space time cube in netCDF4 format.
"""

import arcpy as ARCPY
import os as OS
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSTimeUtilities as TUTILS

######################### Globals ####################################
supportSumType = ["MIN", "MAX", "MEAN", "SUM"]
supportDist = ["Feet", "Meters", "Kilometers", "Miles", "FeetInt", "MilesInt"]
supportTime = ["Seconds", "Minutes", "Hours", "Days", "Weeks", "Months", "Years"]
supportTimeDateOnly = ["Days", "Weeks", "Months", "Years"]
denomTypes = ['SmallInteger', 'Integer', 'Single', 'Double']
analysisMask = ["EMERGING", "OUTLIER_"]

plural2Singular = {"feet":"Foot", "us_feet":"US Foot","meters":"Meter",
                 "kilometers":"Kilometer", "miles":"Mile", "us miles":"US Mile",
                 "feetint": "FeetInt", "milesint": "MilesInt"}

Singular2Plural = {"foot":"Feet", "us_foot":"US Feet","meter":"Meters",
                   "kilometer":"Kilometers", "mile":"Miles", "us mile":"US Miles",
                   "FeetInt":"feetint", "MilesInt":"milesint"}

supportConcepts = ["FIXED_DISTANCE", "K_NEAREST_NEIGHBORS",
                   "CONTIGUITY_EDGES_ONLY", "CONTIGUITY_EDGES_CORNERS"]
supportConceptsPoints = ["FIXED_DISTANCE", "K_NEAREST_NEIGHBORS"]

supportAverageAs = ["ENTIRE_CUBE", "NEIGHBORHOOD_TIME_STEP",
                    "INDIVIDUAL_TIME_STEP"]

localOutlierTypes = ["LOCAL_OUTLIER_ANALYSIS_RESULTS", 
                     "PERCENTAGE_OF_LOCAL_OUTLIERS", 
                     "LOCAL_OUTLIER_IN_MOST_RECENT_TIME_PERIOD",
                     "LOCATIONS_WITHOUT_SPATIAL_NEIGHBORS"]

localOutlierFiles = ["LocalOutlier",
                     "PercentOutliers", 
                     "MostRecentOutliers",
                     "NoSpatialNeighbors"]

gridVars2Ignore = ['time_step_ID', 'location_ID', 'changePoints', 'changeType']
panelVars2Ignore = ['time_step_ID', 'location_ID', 'TEMPORAL_AGGREGATION_COUNT',
                    'PREDICTION_BINARY_MASK', 'changePoints', 'changeType']

noAllowedFields = ["FID", "OID", "OBJECTID"]

dissimilarityMeasure = ["VALUE", "PROFILE", "PROFILE_FOURIER"]

clusterMethods = ["K_MEANS", "K_MEDOIDS"]

maxOptimizedNumClusters = 15
maxTSNumClusters = 30

fullLayerPath = OS.path.join(ARCPY.GetInstallInfo()["InstallDir"],
                             "Resources", "ArcToolbox", "Templates", "Layers")

### Fill the optional output parameters depending on input parameter ###

def setOptionalAppendDerivedParam(inputParam, derivedParam):
    """Work around function for path delete when append button is
    unchecked."""

    if inputParam.valueAsText not in ["", "#", None]:
        derivedParam.enabled = True
        inPath = ""
        try:
            inPath, inName = OS.path.split(inputParam.valueAsText)
        except:
            pass
        if inPath not in ["", None]:
            derivedParam.value = inputParam.valueAsText
        else:
            derivedParam.value = inputParam.value

def addExtensionOutput(parameters, indexInput, indexOuput, toolName):
    """ Add default path in the output parameter (indexOutput) 
    INPUTS:
        parameters (Array Parameters): Parameter List
        indexInput (int): Indice of the input parameter path
        indexOutput (int): Indice of the output parameter path
        toolName (string): Tool Name
    """
    if parameters[indexOuput].value:
         outValue = parameters[indexOuput].valueAsText
         if not UTILS.isGDB(outValue, True) and \
         "MEMORY" not in outValue.upper():
            desc = ARCPY.Describe(parameters[indexInput].valueAsText)

            if desc.datasetType == 'FeatureClass':
                if ".SHP" not in outValue.upper():
                    parameters[indexOuput].value = outValue + ".shp"
                if ".DBF" in outValue.upper():
                    parameters[indexOuput].value = outValue.replace(".dbf",".shp")

            if desc.datasetType in UTILS.dataTypeTable: 
                if ".DBF" not in outValue.upper():
                    if ".SHP" in outValue.upper():
                        parameters[indexOuput].value = outValue.replace(".shp",".dbf")
                    else:
                        parameters[indexOuput].value = outValue + ".dbf"
    else:
        if parameters[indexInput].valueAsText not in ["", None]:
            desc = ARCPY.Describe(parameters[indexInput].valueAsText)
            name = desc.name
            name = name.replace(".shp","").replace(".dbf","")

            if desc.dataType == "FeatureLayer":
                name = desc.nameString
                partNames = OS.path.split(name)
                if len(partNames) >= 2:
                    name = partNames[-1]

            inPath, inName = OS.path.split(parameters[indexInput].valueAsText)
            # To fix the python stand alone error
            if inPath == '':
                current = ARCPY.mp.ArcGISProject("CURRENT").defaultGeodatabase
            else:
                current = inPath

            name = ARCPY.ValidateTableName(name)
            outputString = OS.path.join(current,"{0}_{1}".format(name,toolName))
            # outputString = ARCPY.ValidateTableName(outputString)
            parameters[indexOuput].value= outputString

def addExtensionTable(parameters, indexOuput):
    """ Add default path in the output table parameter (indexOutput) 
    INPUTS:
        parameters (Array Parameters): Parameter List
        indexOutput (int): Indice of the output parameter path
    """
    if parameters[indexOuput].value:
         outValue = parameters[indexOuput].valueAsText
         in_mem = outValue.lower().startswith("in_memory") or outValue.startswith("memory")
         if not UTILS.isGDB(outValue, True) and not in_mem :
            if ".DBF" not in outValue.upper():
                if ".SHP" in outValue.upper():
                    parameters[indexOuput].value = outValue.lower().replace(".shp",".dbf")
                else:
                    if not UTILS.isSDEOrGeodatabase(outValue):
                        parameters[indexOuput].value = outValue + ".dbf"


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

def isCSV(input):
    """ Returns whether the input is CSV
    INPUTS:
    input (str): feature layer/Table View (string)
    
    OUTPUT:
    return (bool): is the input CSV
    """
    try:
        return ".CSV" in ARCPY.Describe(input).CatalogPath.upper()
    except:
        pass
    return False
######################### General Functions ###########################

def returnValidationSize(cube, validationSize = None):
    if validationSize is None:
        validationSize = int(cube.numTime * .1)

    return validationSize

def returnTableName(tableName, extension = ".dbf"):
    """Assesses the filesystem associated with the table.  This enables the
    table to be overwritten.  A DBF extension is added if the file system is
    merely a folder.

    INPUTS:
    tableName (str): catalogue path to output table
    extension {str, .dbf}: file extension
    """
    #### Assess Table Extension ####
    dbf = 0
    if extension not in OS.path.basename(tableName) and not UTILS.isGDB(tableName, True):
        tableDirInfo = ARCPY.Describe(OS.path.dirname(tableName))
        try:
            workType = tableDirInfo.WorkspaceType == "FileSystem"
            if workType:
                tableName = tableName + extension
                dbf = 1
        except:
            pass

    return tableName, dbf

def isScratchVar(value):
    if type(value) is str:
        n = value.count('%')
        if n >= 2:
            return True
    else:
        return False

def uniquePredictionInfo(fieldNames, predTypes):
    outFieldNames = []
    outPredTypes = []
    testInfo = set([])
    for fieldInd, fieldName in enumerate(fieldNames):
        keyValue = fieldName + ";" + predTypes[fieldInd]
        if keyValue not in testInfo:
            testInfo.add(keyValue)
            outFieldNames.append(fieldName)
            outPredTypes.append(predTypes[fieldInd])

    return outFieldNames, outPredTypes

def uniqueAggregationInfo(fieldNames, aggTypes, predTypes):
    outFieldNames = []
    outAggTypes = []
    outPredTypes = []
    testInfo = set([])
    for fieldInd, fieldName in enumerate(fieldNames):
        keyValue = fieldName + ";" + aggTypes[fieldInd] + ";" + predTypes[fieldInd]
        if keyValue not in testInfo:
            testInfo.add(keyValue)
            outFieldNames.append(fieldName)
            outAggTypes.append(aggTypes[fieldInd])
            outPredTypes.append(predTypes[fieldInd])

    return outFieldNames, outAggTypes, outPredTypes

def isPro():
    """Return boolean indicating whether script is running in PRO
    """
    arcInfo = ARCPY.GetInstallInfo()
    productName = arcInfo['ProductName'].upper() 
    isPro = False
    if productName in ["ARCGISPRO", "ARCGISALLSOURCE"]:
        isPro = True
    if productName == "SERVER":
        pathEnvPro = OS.path.join(arcInfo['InstallDir'], r"bin/Python/envs")
        if OS.path.isdir(pathEnvPro):
            isPro = True
    return isPro

def paramChanged(param, checkValue = False):
    changed = param.altered and not param.hasBeenValidated
    if checkValue:
        if param.value:
            return changed
        else:
            return False 
    else:
        return changed

def clearParameter(parameter):
    parameter.enabled = False
    parameter.value = None

def getCorrectUnit(unit, singular = True):
    unitFound = None
    try:
        unitFound = plural2Singular[unit.lower()]
    except:
        pass
    
    if not unitFound:
        try:
            unitFound = Singular2Plural[unit.lower()]
            return unitFound
        except:
            pass
    else:
        return Singular2Plural[unitFound.lower()]

def humanReadableFloatStr(value, unit, formatStr = "%0.2f"):
    """Returns a human readable string version of a float or integer. (1)

    INPUT:
    value (float/int): input value
    unit (str) : unit
    OUTPUT:
    strValue (str): human readable string value
    """
    import locale as LOCALE
    intValue = round(value)
    remainder = value - intValue
    if compareFloat(remainder, 0.0):
        strValue = "%i" % value
        if strValue == "1":
            unitText = getCorrectUnit(unit)
        else:
            unitText = getCorrectUnit(unit, False)
    else:
        strValue = LOCALE.format(formatStr, value)
        strValue = strValue.strip("0")
        if strValue[-1] == ".":
            strValue = strValue[0:-1]
        unitText = getCorrectUnit(unit, False)

    return strValue + " " + unitText


def returnScratchWorkSpace():
    """Returns the Scratch Temp Workspace for Intermediate Computation.

    OUTPUT:
    scratchWS (str): path to the scratch workspace
    """

    scratchWS = ARCPY.env.scratchWorkspace
    if not scratchWS:
        scratchWS = ARCPY.GetSystemEnvironment("TEMP")

    scratchExists = ARCPY.Exists(scratchWS)
    if not scratchExists:
        scratchWS = ARCPY.GetSystemEnvironment("TEMP")
        tempExists = ARCPY.Exists(scratchWS)
        if not tempExists:
            scratchWS = ARCPY.GetSystemEnvironment("CWD")

    return scratchWS

def returnScratchName(prefix, fileType = "FEATURECLASS",
                      scratchWS = None, extension = None):
    """Returns a Scratch File Name for Intermediate Computation. (1)

    INPUTS:
    prefix (str): file prefix
    fileType {str, FEATURECLASS}: type of scratch file
    scratchWS {str, NONE}: path to the scratch workspace desired
    extension {str, None}: extension for the file

    OUTPUT:
    scratchName (str): path to the scratch file

    NOTES:
    (1) This method supports all the file types (dataType) set out by
        ARCPY.CreateScratchName().  The '.dbf' or 'shp' extensions are
        resolved based on the location.  The "TEXT" option has been
        added and uses the ARCPY.CreateUniqueName() method.  The extension
        option is ignored for all dataTypes except for "TEXT";  It will
        be dropped as well if the workspace is not a "Folder".
    """
    #### Set Workspace ####
    if not scratchWS:
        scratchWS = returnScratchWorkSpace()
    descWS = ARCPY.Describe(scratchWS)
    baseType = descWS.DataType

    #### Remove Any Extension From Prefix ####
    prefix = OS.path.splitext(prefix)[0]

    #### Solve Based on File Type ####
    fileType = fileType.upper()
    if fileType == "TEXT":
        if baseType.upper() == "FOLDER":
            if extension:
                extension = "." + extension.strip(".")
                scratchName = prefix + extension.lower()
                scratchName = ARCPY.CreateUniqueName(scratchName,
                                                   scratchWS)
            else:
                scratchName = ARCPY.CreateUniqueName(prefix, scratchWS)
        else:
            scratchName = ARCPY.CreateUniqueName(prefix, scratchWS)

    else:
        scratchName = ARCPY.CreateScratchName(prefix, "", fileType, scratchWS)
        if baseType.upper() == "FOLDER":
            if fileType == "TABLE":
                scratchName += ".dbf"
        else:
            scratchName = scratchName.strip(".shp")

    return scratchName

def isNumeric(x):
    try:
        x + 1
        return True
    except TypeError:
        return False

def strToFloat(floatAsStr):
    """Robust Methodology to Convert to and From Alternative Locale Decimals.

    INPUT:
    floatAsStr (str): numeric rep of a float

    RETURN:
    value (float): resulting float
    """
    import locale as LOCALE

    if isNumeric(floatAsStr):
        return float(floatAsStr)
    else:
        sep = LOCALE.localeconv()['decimal_point']
        sepTypes = [",", "."]
        sepTypes.remove(sep)
        if sep in floatAsStr:
            return LOCALE.atof(floatAsStr)
        else:
            if sepTypes[0] in floatAsStr:
                newStr = floatAsStr.replace(sepTypes[0], sep)
                return LOCALE.atof(newStr)
            else:
                return float(floatAsStr)

def compareFloat(a, b, rTol = .00001, aTol = .00000001):
    """Uses the same formula numpy's allclose function:

    INPUTS:
    a (float): float to be compared
    b (float): float to be compared
    rTol (float): relative tolerance
    aTol (float): absolute tolerance

    OUTPUT:
    return (boolean): true if |a - b| < aTol + (rTol * |b|)
    """

    try:
        if abs(a - b) < aTol + (rTol * abs(b)):
            return True
        else:
            return False
    except:
        return False

def getLinearUnitFloat(paramValue):
    import locale as LOCALE
    value, unit = str(paramValue).split()
    return LOCALE.atof(value) 


def getNumericParameter(params, paramNum):
    """Obtains "optional" Float and Int parameters.

    INPUTS:
    paramNum (int): parameter number

    RETURN (float/int, None): parameter value if set, None otherwise.
    """

    value = params[paramNum].value
    if compareFloat(value, 0.0):
        strValue = params[paramNum].valueAsText
        if strValue == "#" or strValue == "":
            value = None

    return value

def getTextParameter(params, paramNum, fieldName = False):
    """Obtains "optional" Field Parameters.

    INPUTS:
    paramNum (int): parameter number

    RETURN (float/int, None): parameter value if set, None otherwise.
    """

    value = params[paramNum].valueAsText
    if fieldName:
        if value:
            value = value.upper()
    if value == "#" or value == "":
        value = None

    return value

def getMultiFieldParameter(params, paramNum):
    """Obtains "optional" Field Parameters.

    INPUTS:
    paramNum (int): parameter number

    RETURN (float/int, None): parameter value if set, None otherwise.
        
    """

    value = params[paramNum].valueAsText
    if type(value) is list:
        if len(value):
            value = [i.upper() for i in value.split(";")]
        else:
            value = None

    else:
        if value == "#" or value == "":
            value = None
        else:
            value = [i.upper() for i in value.split(";")]

    return value 

def returnOutputSpatialRef(inputSpatialRef, outputFC = None):
    """Returns a spatial reference object for output and analysis based
    on the hierarchical setting. (1)

    INPUTS:
    inputSpatialRef (obj): input spatial reference object
    outputFC (str): catalog path to the output feature class (2)

    OUTPUT:
    spatialRef (class): spatial reference object

    NOTES:
    (1) Hierarchy for Spatial Reference:
        Feature Data Set --> Environment Settings --> Input Feature Class
    (2) The outputFC can be an input feature for models with no feature
        class output.
    """

    if outputFC is None:
        spatialRef = setEnvSpatialReference(inputSpatialRef)
    else:
        dirName = OS.path.dirname(outputFC)
        descDir = ARCPY.Describe(dirName)
        dirType = descDir.DataType
        if dirType == "FeatureDataset":
            #### Set to FeatureDataset if True ####
            spatialRef = descDir.SpatialReference
        else:
            spatialRef = setEnvSpatialReference(inputSpatialRef)

    return spatialRef

def setEnvSpatialReference(inputSpatialRef):
    """Returns a spatial reference object of Env Setting if exists.

    INPUTS:
    inputSpatialRef (obj): input spatial reference object

    OUTPUT:
    spatialRef (class): spatial reference object
    """

    envSetting = ARCPY.env.outputCoordinateSystem
    if envSetting is not None:
        #### Set to Environment Setting ####
        spatialRef = envSetting
    else:
        spatialRef = inputSpatialRef

    return spatialRef

def enableParameters(enable = [], disable= []):
    """ enable and disable list of parameters
    """
    for i in enable:
        if i is not None:
            i.enabled = True
    for j in disable:
        if j is not None:
            j.enabled = False

def getFieldType(inputData, nameField):
    """ Get field type from input 
    """
    try:
        info = ARCPY.Describe(inputData)
        for field in info.fields:
            if field.name.upper() == nameField:
                return field.type.upper()
    except:
        pass
    return None

def getShapeType(inputData):
    """ Get shape type from input
    """
    shape = None
    try:
        info = ARCPY.Describe(inputData)
        return info.shapeType.upper()
    except:
        pass
    return shape

def isInGDB(input):
    """Returns whether the input dataset is inside of gdb.

    INPUTS:
    inputFC (str): catalogue path to the feature class

    OUTPUT:
    return (bool): is inside of gdb
    """
    inGDB = False
    try:
        d = ARCPY.Describe(input)
        path = str(d.CatalogPath)
        path = path.upper()
        if ".GDB" in path:
            inGDB = True
        else:
            inGDB = False
    except:
        pass
    return inGDB

def isShapeFile(inputFC):
    """Returns whether the input feature class is a shapefile.

    INPUTS:
    inputFC (str): catalogue path to the feature class

    OUTPUT:
    return (bool): is the inputFC a shapefile?
    """
    shpFileBool = False
    baseFile = OS.path.basename(inputFC)
    try:
        splitBase = baseFile.split(".")
        if splitBase[-1].upper() in ["SHP","DBF"]:
            shpFileBool = True
    except:
        pass

    return shpFileBool

############################ Cube Methods #############################

def isCube(dataset, checkFields = False):
    """Returns a boolean for whether the input netcdf file is a cube.

    INPUTS:
    netcdfFile (str): path to the netcdf file
    """

    validStr = 'Space-Time Pattern Mining'
    if checkFields:
        try:
            cubeVars = ['projection', 'x', 'y', 'lat', 'lon', 'time']
            #### Check if All Base Variables Exist ####
            if validStr in dataset.description:
                cubeVars = ['projection', 'x', 'y', 'lat', 'lon', 'time']
                varCheck = [var in dataset.variables.keys() for var in cubeVars]
                valid = all(varCheck)
                if valid: return True
                else: return False
            else:
                return False
        except:
            return False
    else:
        try:
            if validStr in dataset.description:
                return True
            else:
                return False
        except:
            return False

def isPanel(dataset, checkFields = False):
    """Returns a boolean for whether the input netcdf file is a cube.

    INPUTS:
    netcdfFile (str): path to the netcdf file
    """

    validStr = 'Space-Time Pattern Mining Panel Cube'
    if checkFields:
        try:
            if validStr in dataset.description:
                cubeVars = ['projection', 'x', 'y', 'lat', 'lon', 'time']
                varCheck = [var in dataset.variables.keys() for var in cubeVars]
                valid = all(varCheck)
                if valid: return True
                else: return False
            else:
                return False
        except:
            return False
    else:
        try:
            if validStr in dataset.description:
                return True
            else:
                return False
        except:
            return False

def isPanelFromFile(ncFile):
    import netCDF4 as NET

    try:
        dataset = NET.Dataset(ncFile, keepweakref = True)
        isPanelCube = isPanel(dataset) 
        dataset.close()
    except:
        isPanelCube = False

    return isPanelCube 

def isHexagonCube(dataset):
    try:
        aggType = dataset.agg_shape_type
        return aggType == "HEXAGON_GRID"
    except:
        return False

def isPolygon(dataset):
    try:
        aggType = dataset.agg_shape_type
        return aggType.upper() == "POLYGON"
    except:
        return False

def isPointCube(dataset):
    try:
        aggType = dataset.agg_shape_type
        return aggType.upper() == "POINT"
    except:
        return False

def checkIfForecastCube(dataset, param, throwError = False):
    if hasattr(dataset, 'is_forecast') and dataset.is_forecast.upper() == "TRUE":
        if throwError:
            param.setIDMessage("ERROR", 110321)
        else:
            param.setIDMessage("WARNING", 110320)

def setLayerNameFromDataset(renderLayerFile, dataset):
    if isPanel(dataset):
        if dataset.agg_shape_type.upper() != "POLYGON":
            renderLayerFile += "_points"

    if isPro():
        renderLayerFile += ".lyrx"
    else:
        renderLayerFile += ".lyr"

    return renderLayerFile

def setLayerNameFromCube(renderLayerFile, cube):
    if not cube.isPolygon:
        renderLayerFile += "_points"

    if isPro():
        renderLayerFile += ".lyrx"
    else:
        renderLayerFile += ".lyr"

    return renderLayerFile

def getRateNames(dataset, removeSTD = False):
    rates = []
    try:
        rateInfo = dataset.rate_info
        rateInfo = rateInfo.split(";")
        for rate in rateInfo:
            rateName, rateType = rate.split(",")
            if removeSTD:
                if rateType == "EMPIRICAL_BAYES_STANDARDIZED":
                    rates.append(rateName)
            else:
                rates.append(rateName)
    except:
        pass

    return rates

def getTimeInfo(dataset, isStartTime = False):
    """Returns the reference time
    
    INPUT:
        dataset (obj): netCDF4 object
        isStartTime (bool): boolean for time alignment
    """
    if isStartTime:
        try:
            refTime = dataset.first_start_time
        except:
            refTime = dataset.start_time
    else:
        try:
            refTime = dataset.last_end_time
        except:
            refTime = dataset.end_end_time
    return refTime

def getCoreCubeVariables(dataset, removeAnalysis = False, removeSTD = False, allowCorrRes = False):
    varNames = []

    #### Set Analysis Mask ####
    if removeAnalysis:
        m = analysisMask
    else:
        m = []

    #### Get Core Variables ####
    varNamesSet = set(dataset.variables.keys())
    for varName in dataset.variables:
        if varName[-10:] == '_TREND_BIN' and varName[0:8] not in m:
            varNames.append(varName[:-10])
        if allowCorrRes and varName[:7] == 'TSCORR_' and varName[-11:] == '_ABSMAX_COR':
            if varName[:-11] + "_ABSMAX_LAG" in varNamesSet:
                varNames.append(varName[7:-11])

    #### Remove STD Rates ####
    if removeSTD:
        try:
            rateInfo = dataset.rate_info
            rateInfo = rateInfo.split(";")
            for rate in rateInfo:
                rateName, rateType = rate.split(",")
                if rateType == "EMPIRICAL_BAYES_STANDARDIZED":
                    if rateName in varNames:
                        varNames.remove(rateName)
        except:
            pass
        
    return varNames

def getGroupList2D(dataset, inputVar):
    varNames = list(dataset.variables.keys())
    isPanelCube = isPanel(dataset)
    if isPanelCube:
        groupList = ["TRENDS"]
    else:
        groupList = ["LOCATIONS_WITH_DATA", "TRENDS"]

    if "ZONE_{0}".format(inputVar) in varNames:
        groupList.append("ZONES")
    if "EMERGING_{0}_TREND_BIN".format(inputVar) in varNames:
        groupList.append("HOT_AND_COLD_SPOT_TRENDS")
    if "EMERGING_{0}_CATEGORY".format(inputVar) in varNames:
        groupList.append("EMERGING_HOT_SPOT_ANALYSIS_RESULTS")
    if "OUTLIER_{0}_TYPE".format(inputVar) in varNames:
        groupList += localOutlierTypes
    if "TSCLUST_{0}_CLUSTER".format(inputVar) in varNames:
        groupList.append("TIME_SERIES_CLUSTERING_RESULTS")
    if "FORECAST_{0}_FIT".format(inputVar) in varNames:
        if hasattr(dataset, 'is_forecast'):
            groupList.append("FORECAST_RESULTS")
    if "FORECAST_{0}_OUTLIER".format(inputVar) in varNames:
        if hasattr(dataset, 'is_forecast'):
            groupList.append("TIME_SERIES_OUTLIER_RESULTS")
    if "CPD_{0}_ISCP".format(inputVar) in varNames:
        groupList.append("TIME_SERIES_CHANGE_POINTS")

    if isPanelCube:
        rateNames = getRateNames(dataset, removeSTD = False)
        if inputVar not in rateNames:
            groupList.append("NUMBER_OF_ESTIMATED_BINS") 
    else:
        if inputVar != "COUNT":
            rateNames = getRateNames(dataset, removeSTD = False)
            if inputVar not in rateNames:
                groupList.append("LOCATIONS_EXCLUDED_FROM_ANALYSIS")
                groupList.append("NUMBER_OF_ESTIMATED_BINS")

    # The time series correlation results is a combination of two variables, instead of a single variable
    # So the display themes are quite different from other variables
    if "TSCORR_{0}_ABSMAX_COR".format(inputVar) in varNames:
        groupList = ["TIME_SERIES_CROSS_CORRELATION_RESULTS"]

    return groupList

def getGroupList3D(dataset, inputVar):
    varNames = list(dataset.variables.keys())
    groupList = ["VALUE"]
    if "EMERGING_{0}_TREND_BIN".format(inputVar) in varNames:
        groupList.append("HOT_AND_COLD_SPOT_RESULTS")
    if "OUTLIER_{0}_TYPE".format(inputVar) in varNames:
        groupList.append("LOCAL_OUTLIER_RESULTS")
    if inputVar != "COUNT":
        rateNames = getRateNames(dataset, removeSTD = False)
        if inputVar not in rateNames:
            groupList.append("ESTIMATED_BINS")
    if "TEMPORAL_AGGREGATION_COUNT" in varNames:
        groupList.append("TEMPORAL_AGGREGATION_COUNT")
    if "FORECAST_{0}_FIT".format(inputVar) in varNames:
        if hasattr(dataset, 'is_forecast'):
            groupList.append("FORECAST_RESULTS")
    if "FORECAST_{0}_OUTLIER".format(inputVar) in varNames:
        if hasattr(dataset, 'is_forecast'):
            groupList.append("TIME_SERIES_OUTLIER_RESULTS")
    if "CPD_{0}_ISCP".format(inputVar) in varNames:
        groupList.append("TIME_SERIES_CHANGE_POINTS")

    return groupList

def getCoreFCVariables(inputFC):
    d = ARCPY.Describe(inputFC)
    return [i.name for i in d.fields if i.type in denomTypes]

def checkVersion(dataset):
    if isCube(dataset):
        try:
            versionStr = dataset.source
            name, version = versionStr.split(";")
            versionInfo = version.split(".")
            major = float(versionInfo[0])
            if len(versionInfo) > 2:
                minor = float(".".join(versionInfo[1:]))
            else:
                minor = float(versionInfo[-1])
            return (major, minor)
        except:
            return (0, 0)
    else:
        return (0, 0)

def getCubeAlignment(dataset):
    """Decision as to whether the Cube has an alignment and which way it is aligned."""

    try:
        alignmentStr = dataset.alignment
        major, minor = checkVersion(dataset)

        ## Assume Desktop if Major < 8

        if major == 10:
            base = 3.0
        elif major <= 1:
            base = 1.0
        elif major > 1 and major < 8:
            base = 0.0
        elif major > 10:
            base = 0.0
        else:
            base = 9999.
        versionWithAlignment = minor - base
        if versionWithAlignment >= 0:
            if 'START' in alignmentStr.upper():
                #### Has Alignment, Is Start Time ####
                return (True, True)
            else:
                #### Has Alignment, Not Start Time ####
                return (True, False)
        else:
            #### No Alignment, Not Start Time ####
            return (False, False)
    except:
        return (False, False)

def filterTSCubeVarByName(varName):
    filtersEnding = ["MASK", "ESTIMATED", "ID", "MASK", "ZSCORE", "BIN", "PVALUE", "ID", "ISCP"]
    analysisPrefix = ['EMERGING_', 'OUTLIER_', 'FORECAST_', 'CPD_']
    for pre in analysisPrefix:
        if varName.startswith(pre):
            return False
    for fe in filtersEnding:
        if varName.endswith(fe):
            return False
    return True

def reassignDefaults(parameters, defaultIndexList, defaultValueList):
    """Reassigns default values for parameters with default values if 
    they are null
    INPUTS:
    parameters (obj): list of parameter object
    defaultIndexList: list of indexes for parameters with defaults 
    defaultValueList: list of defaults 
    OUTPUT:
    void
    NOTES:
    (1) If index list and value list do not match in size no update
    is made
    """
    if len(defaultIndexList) != len(defaultValueList):
        return

    for defaultInd, defaultValue in zip(defaultIndexList, defaultValueList):
        if parameters[defaultInd].value is None:
            parameters[defaultInd].value = defaultValue

def gp2StartEndDate(parameter):
    """ 
    Wrangle Start and End Time GPDate Parameter to dates
    INPUTS:
    parameters (obj): list of parameter object
    OUTPUT:
    startTime: First Date
    endTime: End Date
    """
    timeInput = parameter.value
    startTime = None
    endTime = None
    
    if timeInput is not None:
        startTime = timeInput[0][0]
        endTime = timeInput[0][1]

    return startTime, endTime

def cubeCheck(inputSTC, returnInfo = False):
    import netCDF4 as NET
    throwCubeError = False
    info = []
    dataset = None

    try:
        cubeStr = inputSTC.value.value
        fileExists = OS.path.isfile(cubeStr)
        dataset = NET.Dataset(cubeStr, keepweakref = True)
        cubeBool = isCube(dataset, checkFields = True)
        panelBool = isPanel(dataset, checkFields = True)

        if not cubeBool and fileExists:
            #### Not a Cube ####
            throwCubeError = True

        if panelBool and not isPro():
            #### Panel Only For Pro ####
            inputSTC.setIDMessage("ERROR", 110119)

    except:
        #### Not a Cube ####
        #if not inputSTC.isInputValueDerived():
        #### MJ Added Comment Above to Temp Throw Cube Does Not Exist ####
        #### In Model Builder - In Future We will re-write the entire ####
        #### Validation Strategy in MB ####
        throwCubeError = True

    if throwCubeError:
        cubeDir, cubeFile = OS.path.split(inputSTC.value.value)
        inputSTC.setIDMessage("ERROR", 110003, cubeFile)

        return throwCubeError, info

    if returnInfo and not throwCubeError and dataset is not None:
        if throwCubeError:
            info = []
        else:
            infoAttr = ['first_end_time', 'first_start_time',
                        'last_end_time', 'last_start_time',
                        'extent']

            info = {f : getattr(dataset, f) for f in infoAttr}
            info.update({'numTime': dataset.variables['time'][:].shape[0]})
            info.update({"timeArray" : dataset.variables['time'][:]})
            dataset.close()
        return throwCubeError, info
    else:
        if dataset is not None:
            dataset.close()
        return throwCubeError, info

def subsetExtentCheck(inputInfo, subsetInfo = None, startTime = None, endTime = None,
                      startBin = None, endBin = None, dim = None):
    minTimeStep = 10
    errorCode = []

    if dim is None:
        return
    elif dim.upper() == "TIME":
        inputTimeSpan = [TUTILS.convert2DateTime(inputInfo['first_start_time']),
                         TUTILS.convert2DateTime(inputInfo['last_end_time'])]

        if subsetInfo is not None:
            subsetTimeSpan = [TUTILS.convert2DateTime(subsetInfo['first_start_time']),
                              TUTILS.convert2DateTime(subsetInfo['last_end_time'])]

            #### Check Start Times ####
            timeStartsWithin = (subsetTimeSpan[0] >= inputTimeSpan[0]) and (subsetTimeSpan[0] <= inputTimeSpan[1])
            timeEndsWithin = (subsetTimeSpan[1] <= inputTimeSpan[1]) and (subsetTimeSpan[1] >= inputTimeSpan[0])
            
            #### Make Sure Start and End Times are Different ####
            if subsetTimeSpan[0] == inputTimeSpan[0] and subsetTimeSpan[1] == inputTimeSpan[1]:
                errorCode = 110459
                flag = False

        elif startTime is not None or endTime is not None:
            if startTime is None:
                timeStartsWithin = True
            else:
                timeStartsWithin = (startTime > inputTimeSpan[0]) and (startTime < inputTimeSpan[1])

            if endTime is None:
                timeEndsWithin = True
            else:
                timeEndsWithin = (endTime < inputTimeSpan[1]) and (endTime > inputTimeSpan[0])

            if startTime == endTime:
                errorCode = 110004
                flag = False

        elif startBin is not None or endBin is not None:
            if startBin is None:
                timeStartsWithin = True
            else:
                if startBin >= 0:
                    timeStartsWithin = startBin < inputInfo['numTime']
                else:
                    timeStartsWithin = False
                    errorCode = "030111"

            if endBin is None:
                timeEndsWithin = True
            else:
                if endBin >= 0:
                    timeEndsWithin = endBin < inputInfo['numTime']
                else:
                    timeEndsWithin = False
                    errorCode = "030111"

            if startBin is not None or endBin is not None:
                if startBin is None:
                    startBinVal = 0
                else:
                    startBinVal = startBin

                if endBin is None:
                    endBinVal = 0
                else:
                    endBinVal = endBin

                if errorCode != "030111":
                    if ( inputInfo['numTime'] - (startBinVal + endBinVal) ) < minTimeStep:
                        errorCode = 110004
                        flag = False

                if startBinVal == 0 and endBinVal == 0:
                    errorCode = 110459
                    flag = False

        if "flag" not in locals():
            flag = (timeStartsWithin + timeEndsWithin) == 2

        if not bool(errorCode) and flag is False:
            errorCode = 110459

    if dim.upper() == "SPACE":
        if subsetInfo is not None:
            inputExtent = inputInfo['extent']
            subsetExtent = subsetInfo['extent']

            xMinCheck = (subsetExtent[0] > inputExtent[0]) and (subsetExtent[0] < inputExtent[1])
            xMaxCheck = (subsetExtent[1] < inputExtent[1]) and (subsetExtent[1] > inputExtent[0])
            yMinCheck = (subsetExtent[2] > inputExtent[2]) and (subsetExtent[2] < inputExtent[3])
            yMaxCheck = (subsetExtent[3] < inputExtent[3]) and (subsetExtent[3] > inputExtent[2])

            flag = all([xMinCheck, xMaxCheck, yMinCheck, yMaxCheck])
            errorCode = 110459

    return flag, errorCode

def updateSelectionFilter(parameter, inputCube, selectingData, isSelectingCube):
    import netCDF4 as NET
    
    filterList = ["INTERSECT", "CONTAINS", "WITHIN", "HAVE_THEIR_CENTER_IN"]

    inputCubeError = validateCube(inputCube)

    if inputCubeError:
        return

    dataset = NET.Dataset(inputCube.valueAsText, keepweakref = True)
    inputGeom = dataset.agg_shape_type
    dataset.close()

    if isSelectingCube:

        selectingCubeError = validateCube(selectingData)
        if selectingCubeError:
            return

        dataset = NET.Dataset(selectingData.valueAsText, keepweakref = True)
        selectGeom = dataset.agg_shape_type
        dataset.close()

    else:
        if ARCPY.Exists(selectingData.valueAsText):
            selectGeom = ARCPY.Describe(selectingData.valueAsText).shapeType
        else:
            selectingData.setIDMessage("Error", 732, selectingData.displayName, selectingData.valueAsText)
            return
        
    inputType = "POINT"
    selectType = "POINT"

    if inputGeom.upper() != "POINT":
        inputType = "POLYGON"

    if selectGeom.upper() == "POINT":
        selectType = "POINT"
    elif selectGeom.upper() == "POLYLINE":
        selectType = "POLYLINE"
    else:
        selectType = "POLYGON"
    
    if inputType == "POINT":
        if selectType != "POINT":
            filterList = ["INTERSECT", "WITHIN", "HAVE_THEIR_CENTER_IN"]

    elif inputType == "POLYGON":
        if selectType != "POLYGON":
            filterList = ["INTERSECT", "CONTAINS", "HAVE_THEIR_CENTER_IN"]

    parameter.filter.list = filterList

    return
def getOutputSubsetTimes(inputInfo, startTime = None, endTime = None, startBin = None, endBin = None):
    import numpy as NUM

    #### Get Start and End Time Arrays from Space Time Cube ####
    start = NUM.array(TUTILS.convert2DateTime(inputInfo["first_start_time"]), dtype = 'datetime64[s]')
    timeValues = NUM.array(inputInfo["timeArray"], dtype = 'timedelta64[s]')
    timeBreaks = (start + timeValues).tolist()
    timeBreaks.append(TUTILS.convert2DateTime(inputInfo["last_end_time"]))

    startTimes = timeBreaks[:-1]
    endTimes = timeBreaks[1:]

    if startBin is not None or endBin is not None:
        if startBin is None:
            startBinVal = 0
        else:
            startBinVal = startBin
        subsetStartTime = startTimes[startBinVal]

        if endBin is None:
            endBinVal = 0
        else:
            endBinVal = endBin
        subsetEndTime = endTimes[-(endBinVal+1)]

    elif startTime is not None or endTime is not None:
        if startTime is None:
            subsetStartTime = startTimes[0]
        else:
            subsetStartTime = [t for t in endTimes if startTime > t]
            if len(subsetStartTime) > 0:
                subsetStartTime = subsetStartTime[-1]
            elif startTime >= TUTILS.convert2DateTime(inputInfo["first_start_time"]):
                subsetStartTime = startTimes[0]
            else:
                subsetStartTime = None

        if endTime is None:
            subsetEndTime = endTimes[-1]
        else:
            subsetEndTime = [t for t in startTimes if endTime <= t]
            if len(subsetEndTime) > 0:
                subsetEndTime = subsetEndTime[0]
            elif endTime <= TUTILS.convert2DateTime(inputInfo["last_end_time"]):
                subsetEndTime = endTimes[-1]
            else:
                subsetEndTime = None

    return subsetStartTime, subsetEndTime

def validateCube(parameter):
    import netCDF4 as NET

    #### Assure Cube is Valid ####
    throwCubeError = False
    if parameter.value:
        try:
            cubeStr = parameter.value.value
            fileExists = OS.path.isfile(cubeStr)
            dataset = NET.Dataset(cubeStr, keepweakref = True)
            cubeBool = isCube(dataset)
            panelBool = isPanel(dataset)

            if not cubeBool and fileExists:
                #### Not a Cube ####
                throwCubeError = True

            if panelBool and not isPro():
                #### Panel Only For Pro ####
                parameter.setIDMessage("ERROR", 110119)

            checkIfForecastCube(dataset, parameter, throwError=False)
            dataset.close()

        except:
            #### Not a Cube ####
            #if not parameter.isInputValueDerived():
            #### Temp Explicit Throw of Cube Does Not Exist ####
            #### In Model Builder for 3.3 ####
            #### Will Revisit in 3.4 ####
            throwCubeError = True

    if throwCubeError:
        cubeDir, cubeFile = OS.path.split(parameter.value.value)
        parameter.setIDMessage("ERROR", 110003, cubeFile)

    return throwCubeError

class Toolbox(object):
    def __init__(self):
        """Define the toolbox (the name of the toolbox is the name of the
        .pyt file)."""
        self.label = "Space Time Pattern Mining Tools"
        self.alias = "stpm"
        self.helpContext = 50

        #### List of tool classes associated with this toolbox ####
        self.tools = [CreateSpaceTimeCube, 
                      CreateSpaceTimeCubeDefinedLocations, 
                      EmergingHotSpotAnalysis, LocalOutlierAnalysis, 
                      TimeSeriesClustering,
                      VisualizeSpaceTimeCube2D, VisualizeSpaceTimeCube3D,
                      FillMissingValues, CreateSpaceTimeCubeMDRasterLayer,
                      ExponentialSmoothingForecast, ForestBasedForecast, 
                      CurveFitForecast, EvaluateForecastsByLocation,
                      ChangePointDetection, DescribeSpaceTimeCube, SubsetSpaceTimeCube,
                      TimeSeriesCrossCorrelation]

class CreateSpaceTimeCube(object):
    """
    Create Space-Time Cube. Aggregate point counts or summarize variables to a
    space-time cube.
    METHOD:
        __init__(): Define tool name and class info
        getParameterInfo(): Define parameter definitions in tool
        isLicensed(): Set whether tool is licensed to execute
        updateParameters():Modify the values and properties of parameters
                           before internal validation is performed
        updateMessages(): Modify the messages created by internal validation
                          for each tool parameter.
        execute(): Runtime script for the tool
    """
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Create Space Time Cube By Aggregating Points"
        self.description = "Geoprocessing tool that aggregates point features into a netCDF space-time cube."
        self.category = "Space Time Cube Analysis"
        self.canRunInBackground = False
        self.helpContext = 50000001

        #### Define Default Values ####
        self.defaultIndexList = [5, 9]
        self.defaultValueList = ["END_TIME", "FISHNET_GRID"]

    def getParameterInfo(self):
        """Define parameter definitions"""
        #### Local Imports ####
        import sys as SYS

        #### Define Parameters ####
        param0 = ARCPY.Parameter(displayName="Input Features",
                                 name="in_features",
                                 datatype="GPFeatureLayer",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ["Point"]
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Output Space Time Cube",
                                 name="output_cube",
                                 datatype="DEFile",
                                 parameterType="Required",
                                 direction="Output")
        param1.filter.list = ['nc']
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Time Field",
                                 name="time_field",
                                 datatype="Field",
                                 parameterType="Required",
                                 direction="Input")
        param2.filter.list = ['Date', 'DateOnly', 'TimestampOffset']
        param2.parameterDependencies = [param0.name]
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Template Cube",
                                 name="template_cube",
                                 datatype="DEFile",
                                 parameterType="Optional",
                                 direction="Input")
        param3.filter.list = ['nc']
        param3.displayOrder = 3

        param4 = ARCPY.Parameter(displayName="Time Step Interval",
                                 name="time_step_interval",
                                 datatype="GPTimeUnit",
                                 parameterType="Optional",
                                 direction="Input")
        if SYS.version_info.major == 3:
            param4.filter.list = supportTime
        param4.displayOrder = 4

        param5 = ARCPY.Parameter(displayName="Time Step Alignment",
                                 name="time_step_alignment",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param5.filter.type = "ValueList"
        param5.filter.list = ["END_TIME", "START_TIME", "REFERENCE_TIME"]
        param5.value = "END_TIME"
        param5.displayOrder = 5

        param6 = ARCPY.Parameter(displayName="Reference Time",
                                 name="reference_time",
                                 datatype="GPDate",
                                 parameterType="Optional",
                                 direction="Input")
        param6.displayOrder = 6

        param7 = ARCPY.Parameter(displayName="Distance Interval",
                                 name="distance_interval",
                                 datatype="GPLinearUnit",
                                 parameterType="Optional",
                                 direction="Input")
        if SYS.version_info.major == 3:
            param7.filter.list = supportDist
        param7.displayOrder = 8

        param8 = ARCPY.Parameter(displayName="Summary Fields",
                                 name="summary_fields",
                                 datatype="GPValueTable",
                                 parameterType="Optional",
                                 direction="Input")
        param8.parameterDependencies = [param0.name]
        param8.columns = [['Field','Field'],['GPString', 'Statistic'],['GPString','Fill Empty Bins with']]
        param8.filters[0].list = ["Double", "Float", "Short", "Long"]
        param8.filters[1].type = "ValueList"
        param8.filters[1].list = ["SUM", "MEAN", "MIN", "MAX", "STD", "MEDIAN"]
        param8.filters[2].type = "ValueList"
        param8.filters[2].list = ["ZEROS", "SPATIAL_NEIGHBORS", "SPACE_TIME_NEIGHBORS", "TEMPORAL_TREND"]
        param8.displayOrder = 11

        param9 = ARCPY.Parameter(displayName="Aggregation Shape Type",
                                 name="aggregation_shape_type",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param9.filter.type = "ValueList"
        param9.filter.list = ["FISHNET_GRID", "HEXAGON_GRID", "DEFINED_LOCATIONS"]
        param9.value = "FISHNET_GRID"
        param9.displayOrder = 7

        param10 = ARCPY.Parameter(displayName = "Defined Polygon Locations",
                                 name = "defined_polygon_locations",
                                 datatype = "GPFeatureLayer",
                                 parameterType = "Optional",
                                 direction = "Input")
        param10.filter.list = ["Polygon"]
        param10.enabled = False
        param10.displayOrder = 9

        param11 = ARCPY.Parameter(displayName = "Location ID",
                                  name = "location_id",
                                  datatype = "Field",
                                  parameterType = "Optional",
                                  direction = "Input")
        param11.filter.list = ['Short', 'Long', 'BigInteger']
        param11.parameterDependencies = [param10.name]
        param11.displayOrder = 10

        params = [param0, param1, param2, param3, param4, param5,
                  param6, param7, param8, param9, param10, param11]

        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        import locale as LOCALE
        import math as MATH
        import netCDF4 as NET

        hexScale = MATH.sqrt(3.0)

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)

        if paramChanged(parameters[1]):
            try:
                if parameters[1].value:
                    ncPath = parameters[1].value.value
                    ncName, ncExt = OS.path.splitext(ncPath)  
                    if ncExt != ".nc":
                        parameters[1].value = ncName + ".nc"
            except:
                pass

        timeStepAlighment = parameters[5].value
        if timeStepAlighment:
            parameters[5].value = timeStepAlighment.upper().replace(" ", "_")
        parameters[6].enabled = False
        if parameters[5].value and "REFERENCE_TIME" in parameters[5].value:
            parameters[6].enabled = True
        else:
            parameters[6].enabled = False

        if paramChanged(parameters[9]):
            if parameters[9].value.upper() == "DEFINED_LOCATIONS":
                parameters[3].enabled = False
                parameters[7].enabled = False
                parameters[10].enabled = True
                parameters[11].enabled = True
            else:
                parameters[3].enabled = True
                parameters[7].enabled = True
                parameters[10].enabled = False
                parameters[10].value = None
                parameters[11].enabled = False

        if paramChanged(parameters[3]):
            try:
                ncFile = parameters[3].value.value
                dataset = NET.Dataset(ncFile, keepweakref = True)
                cubeBool = isCube(dataset)
                if cubeBool:
                    #### Populate the Reference Dataset Aggregation Info ####
                    timeSize = dataset.time_size
                    timeUnit = dataset.time_unit
                    parameters[4].value = str(timeSize) + " " + timeUnit
                    parameters[5].value = "REFERENCE_TIME"
                    hasAlignment, isStartTime = getCubeAlignment(dataset)
                    refTime = getTimeInfo(dataset, isStartTime)
                    parameters[6].value = refTime
                    cellSize = dataset.user_cell_size
                    cellUnit = dataset.user_cell_unit
                    if '_US' in cellUnit:
                        cellUnit = cellUnit.replace("_US", "")

                    try:
                        aggType  = dataset.agg_shape_type
                    except:
                        aggType = "FISHNET_GRID"

                    cellSizeFloat = strToFloat(cellSize)

                    if  aggType == "HEXAGON_GRID":
                        userDistanceInterval = cellSizeFloat * hexScale
                    else:
                        userDistanceInterval = cellSizeFloat

                    interUnit = humanReadableFloatStr(userDistanceInterval, cellUnit)
                    parameters[7].value = interUnit
                    parameters[9].value = aggType

                    #### Grey out Aggregation Info Field ####
                    parameters[4].enabled = False
                    parameters[5].enabled = False
                    parameters[6].enabled = False
                    parameters[7].enabled = False
                    parameters[9].enabled = False
                dataset.close()
            except:
                pass

        else:
            parameters[4].enabled = True
            parameters[5].enabled = True
            parameters[9].enabled = True
            if parameters[9].value and parameters[9].value.upper() != "DEFINED_LOCATIONS":
                parameters[7].enabled = True

        #### Subset Time Step Type if Date Only ####
        timeType = supportTime
        if parameters[0].value is not None and parameters[2].value is not None:
            try:
                inputValue = parameters[0].valueAsText
                lf = ARCPY.ListFields(inputValue, parameters[2].valueAsText)
                if len(lf):
                    if lf[0].type.upper() == "DATEONLY":
                        timeType = supportTimeDateOnly
            except:
                pass

        parameters[4].filter.list = timeType

        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        import locale as LOCALE
        import math as MATH
        import netCDF4 as NET

        if parameters[1].altered:
            if parameters[1].value:
                #### Check Path to Output Exists ####
                outPath, outName = OS.path.split(parameters[1].value.value)
                if not OS.path.exists(outPath):
                    if not isScratchVar(parameters[1].value.value.lower()):
                        parameters[1].setIDMessage("ERROR", 436, outPath)

        hexScale = MATH.sqrt(3.0)
        if parameters[3].altered:
            if parameters[3].value:
                try:
                    cubeStr = parameters[3].value.value
                    dataset = NET.Dataset(cubeStr, keepweakref = True)

                    panelBool = isPanel(dataset)
                    if panelBool:
                        parameters[3].setIDMessage("ERROR", 110046)
                    else:
                        cubeBool = isCube(dataset)
                        if not cubeBool:
                            #### Not a Cube ####
                            cubeDir, cubeFile = OS.path.split(cubeStr)
                            parameters[3].setIDMessage("ERROR", 110003, cubeFile)
                        else:
                            hasAlignment, isStartTime = getCubeAlignment(dataset)
                            if not hasAlignment:
                                parameters[3].setIDMessage("ERROR", 110062)

                    dataset.close()
                except:
                    pass

        if parameters[4].altered:
            if parameters[4].value:
                value, unit = str(parameters[4].value).split()
                try:
                    if int(value) <= 0:
                        parameters[4].setIDMessage("ERROR", 110047)
                except:
                    parameters[4].setIDMessage("ERROR", 110007)

        if parameters[5].value and parameters[5].value.upper() == "REFERENCE_TIME":
            if not parameters[6].value:
                parameters[6].setIDMessage("ERROR", 110012)

        if parameters[7].altered:
            if parameters[7].value:
                value = getLinearUnitFloat(parameters[7].value)
                if value <= 0.0:
                    parameters[7].setIDMessage("ERROR", 110048)

        if parameters[9].value and parameters[9].value.upper() == "DEFINED_LOCATIONS":
            if not parameters[10].value:
                parameters[10].setIDMessage("ERROR", 110156)

        if parameters[10].value:
            if parameters[11].value:
                usingUniqueID = False
                fieldWarning = False
                try:
                    entry = [f.split(" ") for f in parameters[8].valueAsText.split(";")]
                    for field, agg, summary in entry:
                        if field.upper() == parameters[11].valueAsText.upper():
                            usingUniqueID = True
                            break

                        if field in ["", "#"]:
                            #### Force Exception ####
                            fieldWarning = True
                            x = 1/0
                except:
                    if fieldWarning:
                        parameters[8].setIDMessage("ERROR", 110118)

                if usingUniqueID:
                    parameters[8].setIDMessage("ERROR", 110111)

            else:
                parameters[11].setIDMessage("ERROR", 110113)
        else:
            if parameters[8].altered:
                try:
                    entry = [f.split(" ") for f in parameters[8].valueAsText.split(";")]
                    for field, agg, summary in entry:
                        if field in ["", "#"]:
                            parameters[8].setIDMessage("ERROR", 110118)
                except:
                    pass

        if parameters[11].value:
            nField = parameters[11].valueAsText
            if nField.upper() in noAllowedFields:
                 parameters[11].setIDMessage("ERROR", 544, nField)

        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        import numpy as NUM
        import SSCubeObject as SSCO
        import SSPanelObject as SSPO
        import SSCube as CUBE
        import SSPanel as PANEL
        import SSCubeUtilities as CUTILS
        import SSUtilities as UTILS
        import arcpy.management as DM
        import locale as LOCALE

        #### User Defined Inputs ####
        inputFC = parameters[0].valueAsText
        outputCube = parameters[1].valueAsText
        timeField = getTextParameter(parameters, 2, fieldName = True)
        refCube = getTextParameter(parameters, 3)
        timeInterval = parameters[4].valueAsText
        timeAlignment = parameters[5].valueAsText
        refTime = parameters[6].value
        distInterval = parameters[7].valueAsText
        aggVT = parameters[8].valueAsText
        aggShapeType = parameters[9].valueAsText
        aggFC = getTextParameter(parameters, 10)
        masterField = getTextParameter(parameters, 11, fieldName = True)

        if timeAlignment is None:
            timeAlignment  = "END_TIME"

        if aggShapeType is None:
            aggShapeType = "FISHNET_GRID"


        #### Get Field Info ####
        if aggVT:
            aggEntry = [f.split(" ") for f in aggVT.split(";")]
            aggFields = [f[0].upper() for f in aggEntry]
            aggTypes = [f[1].upper().replace(" ", "_") for f in aggEntry]
            predTypes = [f[2].upper().replace(" ", "_") for f in aggEntry]
        else:
            aggFields = aggTypes = predTypes = []

        #### Use Aggregation Polygons ####
        if aggFC is not None:
        
            aggFCLayer = "InputCube_FCLayer"
            DM.MakeFeatureLayer(aggFC, aggFCLayer)

            sspo = SSPO.SSPanelObject(aggFCLayer, invalidGCS = True)
            sspo.obtainData(masterField, timeField, fields = aggFields, 
                            timeInterval = timeInterval,
                            timeAlignment = timeAlignment,
                            refTime = refTime,
                            aggregateTypes = aggTypes,
                            predictionTypes = predTypes,
                            requireGeometry = True,
                            pointFC = inputFC)

            #### Create Panel NetCDF Cube ####
            panelCube = PANEL.SSPanel(outputCube, panelObj = sspo)
            panelCube.buildCubeReport(sspo.fieldNames)

            #### Add Mann-Kendall Trend Stats ####
            for varName in sspo.fieldNames:
                panelCube.mannKendall(varName)

            #### Close ####
            panelCube.close()

            #### Clean Up Feature Layer ####
            UTILS.passiveDelete(aggFCLayer)

        else:

            #### Assess Env Vars ####
            if refCube:
                refSSCube = CUBE.SSCube(refCube)
                explicitSpatialRef = refSSCube.spatialReference
                extent = refSSCube.extent
                refSSCube.close()
            else:
                d = ARCPY.Describe(inputFC)
                explicitSpatialRef = returnOutputSpatialRef(d.SpatialReference)
                if ARCPY.env.extent != "":
                    extent = ARCPY.env.extent
                else:
                    extent = None
                    #### Select Using Extent ####
        
            if extent is not None:
                if extent.spatialReference is None:
                    ARCPY.AddIDMessage("ERROR", 110066)
                    raise SystemExit()

                #### Select Via Extent ####
                if extent.spatialReference.name != explicitSpatialRef.name:
                    extent = extent.projectAs(explicitSpatialRef)

                makeFeatureLayerNoExtent = UTILS.clearExtent(DM.MakeFeatureLayer)
                selectLocationNoExtent = UTILS.clearExtent(DM.SelectLayerByLocation)
                featureLayer = "InputCube_FC"
                makeFeatureLayerNoExtent(inputFC, featureLayer)
                selectionType = UTILS.getSelectionType(featureLayer)
                selectLocationNoExtent(featureLayer, "INTERSECT",
                                       extent.polygon, "#",
                                       selectionType)
                                       
                tempFC = True
            else:
                featureLayer = inputFC
                tempFC = False

            #### Create New Cube Object ####
            ssco = SSCO.SSCubeObject(featureLayer, referenceCube = refCube)
            ssco.obtainData(timeField, timeInterval, timeAlignment, refTime,
                            distInterval, aggShapeType = aggShapeType,
                            fields = aggFields, aggregateTypes = aggTypes,
                            predictionTypes = predTypes)

            #### Create SSCube ####
            cube = CUBE.SSCube(outputCube, cubeObj = ssco)
            cube.buildCubeReport(ssco.fieldNames)

            #### Add Mann-Kendall Trend Stats ####
            for varName in ssco.fieldNames:
                cube.mannKendall(varName)

            #### Clean Up ####
            cube.close()

            if tempFC:
                try:
                    DM.Delete(featureLayer)
                except:
                    pass
        return

class CreateSpaceTimeCubeDefinedLocations(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Create Space Time Cube From Defined Locations"
        self.description = "Summarizes a set of points or polygons at fixed locations (panel data) into a netCDF data structure by optionally aggregating them into space-time bins. Within each bin, the points are counted and specified attributes are aggregated. For all bin locations, the trend for counts and summary field values are evaluated."
        self.category = "Space Time Cube Analysis"
        self.canRunInBackground = False
        self.helpContext = 50000004

        #### Define Default Values ####
        self.defaultIndexList = [6]
        self.defaultValueList = ["END_TIME"]

    def getParameterInfo(self):
        """Define parameter definitions"""

        param0 = ARCPY.Parameter(displayName = "Input Features",
                                 name = "in_features",
                                 datatype = "GPFeatureLayer",
                                 parameterType = "Required",
                                 direction = "Input")
        param0.filter.list = ["Polygon", "Point"]
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName = "Output Space Time Cube",
                                 name = "output_cube",
                                 datatype = 'DEFile',
                                 parameterType = "Required",
                                 direction = "Output")
        param1.filter.list = ['nc']
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName = "Location ID",
                                 name = "location_id",
                                 datatype = "Field",
                                 parameterType = "Required",
                                 direction = "Input")
        param2.filter.list = ['Short', 'Long', 'BigInteger', 'Text']
        param2.parameterDependencies = [param0.name]
        param2.displayOrder = 2

        param10 = ARCPY.Parameter(displayName = "Related Table",
                                  name = "in_related_table",
                                  datatype = 'GPTableView',
                                  parameterType = "Optional",
                                  direction = "Input")
        param10.displayOrder = 3

        param11 = ARCPY.Parameter(displayName = "Related Location ID",
                                  name = "related_location_id",
                                  datatype = 'Field',
                                  parameterType = "Optional",
                                  direction = "Input")
        param11.filter.list = ['Short', 'Long', 'BigInteger', 'Text']
        param11.parameterDependencies = [param10.name]
        param11.displayOrder = 4

        param3 = ARCPY.Parameter(displayName = "Temporal Aggregation",
                                 name = "temporal_aggregation",
                                 datatype = 'GPBoolean',
                                 parameterType = "Required",
                                 direction = "Input")
        param3.value = False
        param3.filter.list = ['APPLY_TEMPORAL_AGGREGATION', 
                              'NO_TEMPORAL_AGGREGATION']
        param3.displayOrder = 5

        param4 = ARCPY.Parameter(displayName = "Time Field",
                                 name = "time_field",
                                 datatype = 'Field',
                                 parameterType = "Required",
                                 direction = "Input")
        param4.filter.list = ['Date', 'DateOnly', 'TimestampOffset']
        param4.displayOrder = 6

        param5 = ARCPY.Parameter(displayName = "Time Step Interval",
                                 name = "time_step_interval",
                                 datatype = "GPTimeUnit",
                                 parameterType = "Required",
                                 direction = "Input")
        param5.filter.list = supportTime
        param5.displayOrder = 7

        param6 = ARCPY.Parameter(displayName = "Time Step Alignment",
                                 name = "time_step_alignment",
                                 datatype = "GPString",
                                 parameterType = "Optional",
                                 direction = "Input")
        param6.filter.type = "ValueList"
        param6.filter.list = ["END_TIME", "START_TIME", "REFERENCE_TIME"]
        param6.value = "END_TIME"
        param6.displayOrder = 8

        param7 = ARCPY.Parameter(displayName = "Reference Time",
                                 name = "reference_time",
                                 datatype = "GPDate",
                                 parameterType = "Optional",
                                 direction = "Input")
        param7.displayOrder = 9
        param7.enabled = False

        param8 = ARCPY.Parameter(displayName = "Variables",
                                 name = "variables",
                                 datatype = "GPValueTable",
                                 parameterType = "Optional",
                                 direction = "Input")
        param8.columns = [['Field','Field'],
                          ['GPString','Fill Empty Bins with']]
        param8.filters[0].list = ["Double", "Float", "Short", "Long"]
        param8.filters[1].type = "ValueList"
        param8.filters[1].list = ["DROP_LOCATIONS", "ZEROS", "SPATIAL_NEIGHBORS", 
                                  "SPACE_TIME_NEIGHBORS", "TEMPORAL_TREND"]
        param8.enabled = False
        param8.displayOrder = 10

        param9 = ARCPY.Parameter(displayName = "Summary Fields",
                                 name = "summary_fields",
                                 datatype = "GPValueTable",
                                 parameterType = "Optional",
                                 direction = "Input")
        param9.columns = [['Field','Field'], ['GPString', 'Statistic'],
                           ['GPString','Fill Empty Bins with']]
        param9.filters[0].list = ["Double", "Float", "Short", "Long"]
        param9.filters[1].type = "ValueList"
        param9.filters[1].list = ["SUM", "MEAN", "MIN", "MAX", "STD", "MEDIAN"]
        param9.filters[2].type = "ValueList"
        param9.filters[2].list = ["DROP_LOCATIONS", "ZEROS", "SPATIAL_NEIGHBORS", 
                                   "SPACE_TIME_NEIGHBORS", "TEMPORAL_TREND"]
        param9.enabled = False
        param9.displayOrder = 11

        param4.clearMessage()

        params = [param0, param1, param2, param3, param4, param5, param6,
                  param7, param8, param9, param10, param11]

        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)

        if paramChanged(parameters[1]):
            try:
                if parameters[1].value:
                    ncPath = parameters[1].value.value
                    ncName, ncExt = OS.path.splitext(ncPath)  
                    if ncExt != ".nc":
                        parameters[1].value = ncName + ".nc"
            except:
                pass

        if parameters[3].value:  
            parameters[8].enabled = False
            parameters[9].enabled = True
        else:
            parameters[8].enabled = True
            parameters[9].enabled = False

        if paramChanged(parameters[6]):
            if parameters[6].value and parameters[6].value.upper() == "REFERENCE_TIME":
                parameters[7].enabled = True
            else:
                parameters[7].enabled = False

        if paramChanged(parameters[8]):
            if parameters[8].value:
                if "DROP_LOCATIONS" in parameters[8].valueAsText:
                    parameters[8].filters[1].list = ["DROP_LOCATIONS"]
                else:
                    parameters[8].filters[1].list = ["DROP_LOCATIONS", "ZEROS", 
                                                     "SPATIAL_NEIGHBORS", 
                                                     "SPACE_TIME_NEIGHBORS", 
                                                     "TEMPORAL_TREND"]
                parameters[9].value = ""

        if paramChanged(parameters[9]):
            if parameters[9].value:
                if "DROP_LOCATIONS" in parameters[9].valueAsText:
                    parameters[9].filters[2].list = ["DROP_LOCATIONS"]
                else:
                    parameters[9].filters[2].list = ["DROP_LOCATIONS", "ZEROS", 
                                                     "SPATIAL_NEIGHBORS", 
                                                     "SPACE_TIME_NEIGHBORS", 
                                                     "TEMPORAL_TREND"]
                parameters[8].value = ""

        if parameters[10].value:
            parameters[4].parameterDependencies = [parameters[10].name]
            parameters[8].parameterDependencies = [parameters[10].name]
            parameters[9].parameterDependencies = [parameters[10].name]
        else:
            parameters[4].parameterDependencies = [parameters[0].name]
            parameters[8].parameterDependencies = [parameters[0].name]
            parameters[9].parameterDependencies = [parameters[0].name]

        timeType = supportTime
        if parameters[0].value is not None and parameters[4].value is not None:
            if parameters[10].value:
                #### Related Table ####
                inputValue = parameters[10].valueAsText
            else:
                inputValue = parameters[0].valueAsText

            try:
                lf = ARCPY.ListFields(inputValue, parameters[4].valueAsText)
                if len(lf):
                    if lf[0].type.upper() == "DATEONLY":
                        timeType = supportTimeDateOnly
            except:
                pass

        parameters[5].filter.list = timeType

        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""

        if parameters[1].altered:
            if parameters[1].value:
                #### Check Path to Output Exists ####
                outPath, outName = OS.path.split(parameters[1].value.value)
                if not OS.path.exists(outPath):
                    if not isScratchVar(parameters[1].value.value.lower()):
                        parameters[1].setIDMessage("ERROR", 436, outPath)

        if parameters[6].value and parameters[6].value.upper() == "REFERENCE_TIME":
            if not parameters[7].value:
                parameters[7].setIDMessage("ERROR", 110012)

        #### Assure Location ID Not in Variables/Summary Fields ####
        if parameters[10].value and parameters[11].value:
            usingUniqueID = False
            if parameters[3].value:
                fieldWarning = False
                try:
                    entry = [f.split(" ") for f in parameters[9].valueAsText.split(";")]
                    for field, agg, summary in entry:
                        if field.upper() == parameters[11].valueAsText.upper():
                            usingUniqueID = True
                            break

                        if field in ["", "#"]:
                            #### Force Exception ####
                            fieldWarning = True
                            x = 1/0

                except:
                    if parameters[5].value:
                        if fieldWarning:
                            parameters[9].setIDMessage("ERROR", 110118)
                        else:
                            parameters[9].setIDMessage("ERROR", 110114)

                if usingUniqueID:
                    parameters[9].setIDMessage("ERROR", 110111)
            else:
                fieldWarning = False
                try:
                    entry = [f.split(" ") for f in parameters[8].valueAsText.split(";")]
                    for field, summary in entry:
                        if field.upper() == parameters[11].valueAsText.upper():
                            usingUniqueID = True
                            break

                        if field in ["", "#"]:
                            #### Force Exception ####
                            fieldWarning = True
                            x = 1/0

                except:
                    if parameters[5].value:
                        if fieldWarning:
                            parameters[8].setIDMessage("ERROR", 110118)
                        else:
                            parameters[8].setIDMessage("ERROR", 110114)

                if usingUniqueID:
                    parameters[8].setIDMessage("ERROR", 110111)

        else:
            if parameters[0].value and parameters[2].value:
                usingUniqueID = False
                if parameters[3].value:
                    fieldWarning = False
                    try:
                        entry = [f.split(" ") for f in parameters[9].valueAsText.split(";")]
                        for field, agg, summary in entry:
                            if field.upper() == parameters[2].valueAsText.upper():
                                usingUniqueID = True
                                break

                            if field in ["", "#"]:
                                #### Force Exception ####
                                fieldWarning = True
                                x = 1/0

                    except:
                        if parameters[5].value:
                            if fieldWarning:
                                parameters[9].setIDMessage("ERROR", 110118)
                            else:
                                parameters[9].setIDMessage("ERROR", 110114)

                    if usingUniqueID:
                        parameters[9].setIDMessage("ERROR", 110111)
                else:
                    fieldWarning = False
                    try:
                        entry = [f.split(" ") for f in parameters[8].valueAsText.split(";")]
                        for field, summary in entry:
                            if field.upper() == parameters[2].valueAsText.upper():
                                usingUniqueID = True
                                break

                            if field in ["", "#"]:
                                #### Force Exception ####
                                fieldWarning = True
                                x = 1/0

                    except:
                        if parameters[5].value:
                            if fieldWarning:
                                parameters[8].setIDMessage("ERROR", 110118)
                            else:
                                parameters[8].setIDMessage("ERROR", 110114)

                    if usingUniqueID:
                        parameters[8].setIDMessage("ERROR", 110111)

            if parameters[10].value:
                parameters[11].setIDMessage("ERROR", 110113)

        if parameters[11].value:
            nField = parameters[11].valueAsText
            if nField.upper() in noAllowedFields:
                 parameters[11].setIDMessage("ERROR", 544, nField)

        if parameters[0].value and parameters[2].value and parameters[10].value and parameters[11].value:
            try:
                descInp = ARCPY.Describe(parameters[0].value)
                descRel = ARCPY.Describe(parameters[10].value)
                fieldTypeInp = [f  for f in descInp.fields if f.name.upper() == parameters[2].valueAsText.upper()][0]
                fieldTypeRel = [f  for f in descRel.fields if f.name.upper() == parameters[11].valueAsText.upper()][0]
                if fieldTypeInp.type == 'String' and fieldTypeInp.type != fieldTypeRel.type:
                    parameters[11].setIDMessage("ERROR", 640, fieldTypeRel.name,fieldTypeInp.type)
            except:
                pass
        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        import arcpy as ARCPY
        import SSDataObject as SSDO
        import SSPanelObject as SSPO
        import SSPanel as PANEL

        #### User Defined Inputs ####
        inputFC = parameters[0].valueAsText
        outputCube = parameters[1].valueAsText
        masterField = getTextParameter(parameters, 2, fieldName = True)
        temporalAggregation = parameters[3].value
        timeField = getTextParameter(parameters, 4, fieldName = True)
        timeInterval = parameters[5].valueAsText
        timeAlignment = parameters[6].valueAsText
        refTime = parameters[7].value
        varVT = parameters[8].valueAsText
        aggVT = parameters[9].valueAsText
        relatedTable = getTextParameter(parameters, 10)
        relatedField = getTextParameter(parameters, 11, fieldName = True)

        if timeAlignment is None:
            timeAlignment  = "END_TIME"

        #### Ignore Ref Time for Start and End Time Options ####
        if timeAlignment.upper() != "REFERENCE_TIME":
            refTime = None

        #### Field Panel vs. Aggregation ####
        if temporalAggregation:
            #### Aggregation ####
            try:
                aggEntry = [f.split(" ") for f in aggVT.split(";")]
            except AttributeError:
                ARCPY.AddIDMessage("ERROR", 110092)
                raise SystemExit()

            fields = [f[0].upper() for f in aggEntry]
            numFields = len(fields)
            aggregateTypes = [f[1] for f in aggEntry]
            predictionTypes = [f[2].upper().replace(" ", "_") for f in aggEntry]
            fields, aggregateTypes, predictionTypes = uniqueAggregationInfo(fields, 
                                                                            aggregateTypes,
                                                                            predictionTypes)
        else:
            #### Panel ####
            try:
                varEntry = [f.split(" ") for f in varVT.split(";")]
            except AttributeError:
                ARCPY.AddIDMessage("ERROR", 110092)
                raise SystemExit()
            fields = [f[0].upper() for f in varEntry]
            numFields = len(fields)
            aggregateTypes = []
            predictionTypes = [f[1].upper().replace(" ", "_") for f in varEntry]
            fields, predictionTypes = uniquePredictionInfo(fields, predictionTypes)

        #### Remove Prediction Types if Drop Locations for Any ####
        if "DROP_LOCATIONS" in predictionTypes:
            predictionTypes = []

        #### Create SSPanelObject ####
        panel = SSPO.SSPanelObject(inputFC, invalidGCS = True)
        requireGeometry = panel.ssdo.shapeType.upper() == "POLYGON"

        #### Populate Analysis SSPanel with Data ####
        panel.obtainData(masterField, timeField, timeInterval, 
                         timeAlignment = timeAlignment,
                         refTime = refTime,
                         fields = fields,
                         relatedTable = relatedTable,
                         relatedField = relatedField,
                         aggregateTypes = aggregateTypes, 
                         predictionTypes = predictionTypes,
                         requireGeometry = requireGeometry,
                         minNumObs = 1)
    
        #### Create Panel NetCDF Cube ####
        panelCube = PANEL.SSPanel(outputCube, panelObj = panel)
        panelCube.buildCubeReport(panel.fieldNames)

        #### Add Mann-Kendall Trend Stats ####
        for varName in panel.fieldNames:
            if varName != 'TEMPORAL_AGGREGATION_COUNT':
                panelCube.mannKendall(varName)

        #### Close ####
        panelCube.close()

        return

class EmergingHotSpotAnalysis(object):
    """
    Emerging Hot Spot Analysis. Combined Mann Kendall Trending Analysis with
    Space-Time Hot Spot Analysis to identify Emerging Hot/ Cold Spots on
    Space-Time incidents
    METHOD:
        __init__(): Define tool name and class info
        getParameterInfo(): Define parameter definitions in tool
        isLicensed(): Set whether tool is licensed to execute
        updateParameters():Modify the values and properties of parameters
                           before internal validation is performed
        updateMessages(): Modify the messages created by internal validation
                          for each tool parameter.
        execute(): Runtime script for the tool
    """
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Emerging Hot Spot Analysis"
        self.description = "Geoprocessing tool that identifies trends in the clustering of space-time point data."
        self.category = "Space Time Cube Analysis"
        self.canRunInBackground = False
        self.helpContext = 50000002

        #### Define Default Values ####
        self.defaultIndexList = [6, 8]
        self.defaultValueList = ["FIXED_DISTANCE", "ENTIRE_CUBE"]

    def getParameterInfo(self):
        """Define parameter definitions"""

        isProValue = isPro() 

        #### Define Parameters ####
        param0 = ARCPY.Parameter(displayName = "Input Space Time Cube",
                                 name = "in_cube",
                                 datatype = "DEFile",
                                 parameterType = "Required",
                                 direction = "Input")
        param0.filter.list = ['nc']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName = "Analysis Variable",
                                 name = "analysis_variable",
                                 datatype = "GPString",
                                 parameterType = "Required",
                                 direction = "Input")
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName = "Output Features",
                                 name = "output_features",
                                 datatype = "DEFeatureClass",
                                 parameterType = "Required",
                                 direction = "Output")
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName = "Neighborhood Distance",
                                 name = "neighborhood_distance",
                                 datatype = "GPLinearUnit",
                                 parameterType = "Optional",
                                 direction = "Input")
        if isProValue:
            param3.filter.list = supportDist
        param3.displayOrder = 4

        param4 = ARCPY.Parameter(displayName = "Neighborhood Time Step",
                                 name = "neighborhood_time_step",
                                 datatype = "GPLong",
                                 parameterType = "Optional",
                                 direction = "Input")
        param4.filter.type = "Range"
        param4.filter.list = [1, 10]
        param4.value = 1
        param4.displayOrder = 6

        param5 = ARCPY.Parameter(displayName="Polygon Analysis Mask",
                                 name="polygon_mask",
                                 datatype="GPFeatureLayer",
                                 parameterType="Optional",
                                 direction="Input")
        param5.filter.list = ["Polygon"]
        param5.displayOrder = 7

        p6Display = "Conceptualization of Spatial Relationships"
        p6Name = "conceptualization_of_spatial_relationships"
        param6 = ARCPY.Parameter(displayName = p6Display,
                                 name = p6Name,
                                 datatype = "GPString",
                                 parameterType = "Optional",
                                 direction = "Input")
        param6.filter.type = "ValueList"
        param6.filter.list = supportConcepts
        param6.value = "FIXED_DISTANCE"
        param6.displayOrder = 3

        param7 = ARCPY.Parameter(displayName = "Number of Neighbors",
                                 name = "number_of_neighbors",
                                 datatype = "GPLong",
                                 parameterType = "Optional",
                                 direction = "Input")
        param7.filter.type = "Range"
        param7.filter.list = [0, 1000]
        param7.displayOrder = 5

        p8Display = "Define Global Window"
        p8Name = "define_global_window"
        param8 = ARCPY.Parameter(displayName = p8Display,
                                 name = p8Name,
                                 datatype = "GPString",
                                 parameterType = "Optional",
                                 direction = "Input")
        param8.filter.type = "ValueList"
        param8.filter.list = supportAverageAs
        param8.value = "ENTIRE_CUBE"

        #### Initialize Output Schema ####
        param2.parameterDependencies = [param0.name]
        param2.schema.featureTypeRule = "AsSpecified"
        param2.schema.featureType = "Simple"
        param2.schema.geometryTypeRule = "AsSpecified"
        param2.schema.geometryType = "Polygon"
        param2.schema.fieldsRule = "None"

        #### Pack Parameters ####
        params = [param0, param1, param2, param3, param4, param5,
                  param6, param7, param8]

        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        import sys as SYS
        import netCDF4 as NET

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)

        if paramChanged(parameters[0]):
            try:
                if parameters[0].value:
                    fieldList = []
                    dataset = NET.Dataset(parameters[0].value.value, keepweakref = True)
                    analysisPrefix = ['EMERGING_', 'OUTLIER_', '_ESTIMATED', 'FORECAST_', 'CPD_']
                    if isPanel(dataset):
                        vars2Ignore = panelVars2Ignore
                        vars2Ignore.append(dataset.location_id_field)
                        dims = ('time', 'locations')
                        if not isPolygon(dataset):
                            parameters[6].filter.list = supportConceptsPoints
                        else:
                            parameters[6].filter.list = supportConcepts
                        
                        #### Clear Mask ####
                        parameters[5].value = None
                        parameters[5].enabled = False

                    else:
                        vars2Ignore = gridVars2Ignore
                        dims = ('time', 'y', 'x')
                        parameters[5].enabled = True
                    
                    for var in dataset.variables:
                        if dataset.variables[var].dimensions == dims:
                            if var not in vars2Ignore:
                                if (any(pre in var for pre in analysisPrefix)) == False:
                                    fieldList.append(var)

                    parameters[1].filter.list = fieldList

                    #### Set Time Range ####
                    timeSize = int(dataset.variables['time'].size * .75)
                    parameters[4].filter.list = [1, timeSize]

                    #### Set Shape and Layer Type ####
                    renderLayerFile = setLayerNameFromDataset('Emerging_All', dataset)
                    fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
                    parameters[2].symbology = fullRLF
                    dataset.close()
                    del dataset
            except:
                pass
            finally:
                if 'dataset' in locals():
                    dataset.close()
        
        if paramChanged(parameters[1]):
            try:
                isPanelCube = isPanelFromFile(parameters[0].value.value) 
            except:
                isPanelCube = False
            if not isPanelCube:
                varName = parameters[1].value
                if '_ZEROS' in varName or varName == 'COUNT':
                    parameters[5].enabled = True
                else:
                    parameters[5].enabled = False 
            else:
                parameters[5].enabled = False 

        #### Set Conceptualization ####
        if paramChanged(parameters[6]):
            upperValue = parameters[6].value.upper()
            if upperValue == "K_NEAREST_NEIGHBORS":
                parameters[3].enabled = False
                if not parameters[7].value:
                    parameters[7].value = 8
            else:
                if upperValue == "FIXED_DISTANCE":
                    parameters[3].enabled = True
                else:
                    parameters[3].enabled = False

        #### Set Empty Time Values ####
        if type(parameters[4].value) != int:
            parameters[4].value = 1

        #### Add Fields ####
        addFields = []

        #### Result Fields ####
        idFieldNames = ["LOCATION", "CATEGORY"]
        idFieldTypes = ["LONG"] * (len(idFieldNames))
        textFieldNames = ["PATTERN"]
        textFieldTypes = ["TEXT"] * (len(textFieldNames))
        percentFieldNames = ["PERC_HOT", "PERC_COLD"]
        trendFieldNames = ["TREND_Z", "TREND_P", "TREND_BIN"]
        sumFieldNames = []
        sumPrefix = ["SUM", "MIN", "MAX", "MEAN", "STD", "MED"]
        if parameters[1].altered:
            for p in sumPrefix:
                sumFieldNames.append(p + "_VALUE")

        #### Calculate How Many Double Type Fields ####
        doubleFieldNum = len(percentFieldNames) + len(trendFieldNames)
        doubleFieldNum += len(sumFieldNames)

        #### Output Field Names and Field Types ####
        fieldNames = idFieldNames + textFieldNames + percentFieldNames
        fieldNames += trendFieldNames + sumFieldNames
        fieldTypes = idFieldTypes + textFieldTypes
        fieldTypes += (["DOUBLE"] * doubleFieldNum)

        #### Append Output Field to Output Feature Class's Schema ####
        for fieldInd, fieldName in enumerate(fieldNames):
            fieldType = fieldTypes[fieldInd]
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = fieldType
            addFields.append(newField)
        parameters[2].schema.additionalFields = addFields

        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        import netCDF4 as NET

        #### Assure Cube is Valid ####
        throwCubeError = False
        if parameters[0].value:
            try:
                cubeStr = parameters[0].value.value
                fileExists = OS.path.isfile(cubeStr)
                dataset = NET.Dataset(cubeStr, keepweakref = True)
                cubeBool = isCube(dataset)
                panelBool = isPanel(dataset)

                if not cubeBool and fileExists:
                    #### Not a Cube ####
                    throwCubeError = True

                if panelBool and not isPro():
                    #### Panel Only For Pro ####
                    parameters[0].setIDMessage("ERROR", 110119)

                checkIfForecastCube(dataset, parameters[0], throwError=False)

                if paramChanged(parameters[1]):
                    if parameters[1].value not in dataset.variables:
                        parameters[1].setIDMessage("ERROR", 110024, parameters[1].value)

                dataset.close()

            except:
                #### Not a Cube ####
                if not parameters[0].isInputValueDerived():
                    throwCubeError = True

        if throwCubeError:
            cubeDir, cubeFile = OS.path.split(parameters[0].value.value)
            parameters[0].setIDMessage("ERROR", 110003, cubeFile)

        if paramChanged(parameters[3]):
            if parameters[3].value:
                value = getLinearUnitFloat(parameters[3].value)
                if value <= 0.0:
                    parameters[3].setIDMessage("ERROR", 110045)

        if paramChanged(parameters[6]):
            if parameters[6].value.upper() == "K_NEAREST_NEIGHBORS":
                value = int(parameters[7].value)
                if value <= 0:
                    parameters[7].setIDMessage("ERROR", 895)
        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        ################### Imports ########################
        import sys as SYS
        import numpy as NUM
        import SSCube as CUBE
        import SSPanel as PANEL
        import WeightsUtilities as WU

        """Retrieves the parameters from the User Interface and executes the
        appropriate commands."""

        #### User Defined Inputs ####
        inputCube = parameters[0].valueAsText
        varName = getTextParameter(parameters, 1)
        outputFC = parameters[2].valueAsText
        distance = parameters[3].valueAsText
        timeOrder = getNumericParameter(parameters, 4)
        backwardOnly = True
        maskFC = parameters[5].valueAsText
        concept = parameters[6].valueAsText
        numNeighs = getNumericParameter(parameters, 7)

        globalMethod = parameters[8].valueAsText
        if globalMethod is None:
            globalMethod = "ENTIRE_CUBE"

        globalMethod = globalMethod.upper()

        #### Neighborhood Concept ####
        spaceConcept = concept.upper()

        #### Ensure Polygon Mask Only Applies on Appropriate Variables ####
        polyMask = maskFC is not None
        if not ('_ZEROS' in varName or varName == 'COUNT') and polyMask:
            ARCPY.AddIDMessage("ERROR", 583)
            raise SystemExit()

        #### Boolean for Panel Or Not ####
        isPanelCube = isPanelFromFile(inputCube) 

        if not isPanelCube:
            #### Create Cube Object for Emerging Hot Spot Analysis ####
            cube = CUBE.SSCube(inputCube, 'a')

            #### Get Analysis Mask ####
            analysisMask = cube.getAnalysisMask(varName, maskFC)

            #### Set Neighborhood ####
            if spaceConcept in ["FIXED_DISTANCE", "K_NEAREST_NEIGHBORS"]:
                cube.setNeighborInfo(spaceConcept, distance, timeOrder, analysisMask,
                                     numNeighs = numNeighs, includeSelf = True)
            elif spaceConcept == "CONTIGUITY_EDGES_ONLY":
                cube.setNeighborInfo(spaceConcept, cube.distanceInterval, timeOrder,
                                     analysisMask, includeSelf = True)
            elif spaceConcept == "CONTIGUITY_EDGES_CORNERS":
                a2b2 = 2.0 * cube.distanceInterval**2.0
                hypo = NUM.sqrt(a2b2)
                cube.setNeighborInfo(spaceConcept, hypo, timeOrder, analysisMask,
                                     includeSelf = True)

            #### Carry out Emerging Hot Spot Analysis ####
            cube.emergingHotSpots(varName, analysisMask = analysisMask,
                                  globalMethod = globalMethod)

            #### Generate Emerging Hot/ Cold Feature Class ####
            candidateFields = cube.emergingOutputFields2D(outputFC, varName)
            cube.exportFeatures2D(outputFC, candidateFields)
            cube.close()

        else:
            #### Create Panel Cube Object for Analysis ####
            cube = PANEL.SSPanel(inputCube, 'a')

            #### Create Neighborhood ####
            if spaceConcept == "FIXED_DISTANCE":
                threshold = distance

                #### Resolve Hybrid Distance and KNN ###
                if numNeighs is not None:
                    if not numNeighs:
                        numNeighs = None
            else:
                threshold = None

            neighInfo = WU.SciPyNeighborSearch(cube, spaceConcept = spaceConcept,
                                               threshold = threshold,
                                               numNeighs = numNeighs,
                                               timeOrder = timeOrder,
                                               scratch = ARCPY.env.scratchGDB)

            #### Carry out Emerging Hot Spot Analysis ####
            cube.emergingHotSpots(varName, neighInfo, 
                                  globalMethod = globalMethod)

            #### Generate Emerging Hot/ Cold Feature Class ####
            candidateFields = cube.emergingOutputFields2D(outputFC, varName)
            cube.exportFeatures2D(outputFC, candidateFields)
            cube.close()

        #### Set Shape and Layer Type ####
        renderLayerFile = setLayerNameFromCube('Emerging_All', cube)
        
        #### Render Results ####
        try:
            if isPro():
                UTILS.buildLocaleCIMLayer(renderLayerFile, 2, data = {"heading": ARCPY.GetIDMessage(220847)})
            else:
                fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
                parameters[2].symbology = fullRLF
        except:
            ARCPY.AddIDMessage("WARNING", 973)

        return

class LocalOutlierAnalysis(object):
    """
    Local Moran's I in Space/Time w/ a focus on the outliers.
    METHOD:
        __init__(): Define tool name and class info
        getParameterInfo(): Define parameter definitions in tool
        isLicensed(): Set whether tool is licensed to execute
        updateParameters():Modify the values and properties of parameters
                           before internal validation is performed
        updateMessages(): Modify the messages created by internal validation
                          for each tool parameter.
        execute(): Runtime script for the tool
    """
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Local Outlier Analysis"
        self.description = "Geoprocessing tool that identifies outliers in space-time point data."
        self.category = "Space Time Cube Analysis"
        self.canRunInBackground = False
        self.helpContext = 50000003

        #### Set Default Values ####
        self.defaultIndexList = [5, 7, 9]
        self.defaultValueList = [499, "FIXED_DISTANCE", "ENTIRE_CUBE"]

    def getParameterInfo(self):
        """Define parameter definitions"""

        isProValue = isPro() 

        #### Define Parameters ####
        param0 = ARCPY.Parameter(displayName="Input Space Time Cube",
                                 name="in_cube",
                                 datatype="DEFile",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['nc']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Analysis Variable",
                                 name="analysis_variable",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Output Features",
                                 name="output_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Required",
                                 direction="Output")
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Neighborhood Distance",
                                 name="neighborhood_distance",
                                 datatype="GPLinearUnit",
                                 parameterType="Optional",
                                 direction="Input")
        if isProValue:
            param3.filter.list = supportDist
        param3.displayOrder = 4

        param4 = ARCPY.Parameter(displayName="Neighborhood Time Step",
                                 name="neighborhood_time_step",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param4.filter.type = "Range"
        param4.filter.list = [1, 10]
        param4.value = 1
        param4.displayOrder = 6

        param5 = ARCPY.Parameter(displayName="Number of Permutations",
                                 name="number_of_permutations",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param5.filter.type = "Value List"
        param5.filter.list = [0, 99, 199, 499, 999, 9999]
        param5.value = 499
        param5.displayOrder = 7

        param6 = ARCPY.Parameter(displayName="Polygon Analysis Mask",
                                 name="polygon_mask",
                                 datatype="GPFeatureLayer",
                                 parameterType="Optional",
                                 direction="Input")
        param6.filter.list = ["Polygon"]
        param6.displayOrder = 8

        p7Display = "Conceptualization of Spatial Relationships"
        p7Name = "conceptualization_of_spatial_relationships"
        param7 = ARCPY.Parameter(displayName = p7Display,
                                 name = p7Name,
                                 datatype = "GPString",
                                 parameterType = "Optional",
                                 direction = "Input")
        param7.filter.type = "ValueList"
        param7.filter.list = supportConcepts
        param7.value = "FIXED_DISTANCE"
        param7.displayOrder = 3

        param8 = ARCPY.Parameter(displayName = "Number of Neighbors",
                                 name = "number_of_neighbors",
                                 datatype = "GPLong",
                                 parameterType = "Optional",
                                 direction = "Input")
        param8.filter.type = "Range"
        param8.filter.list = [0, 1000]
        param8.displayOrder = 5

        p9Display = "Define Global Window"
        p9Name = "define_global_window"
        param9 = ARCPY.Parameter(displayName = p9Display,
                                 name = p9Name,
                                 datatype = "GPString",
                                 parameterType = "Optional",
                                 direction = "Input")
        param9.filter.type = "ValueList"
        param9.filter.list = supportAverageAs
        param9.value = "ENTIRE_CUBE"

        #### Initialize Output Schema ####
        param2.parameterDependencies = [param0.name]
        param2.schema.featureTypeRule = "AsSpecified"
        param2.schema.featureType = "Simple"
        param2.schema.geometryTypeRule = "AsSpecified"
        param2.schema.geometryType = "Polygon"
        param2.schema.fieldsRule = "None"

        #### Pack Parameters ####
        params = [param0, param1, param2, param3, param4, param5, param6,
                  param7, param8, param9]

        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        import sys as SYS
        import netCDF4 as NET

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)

        vars2Ignore = ['time_step_ID', 'location_ID']
        if paramChanged(parameters[0]):
            try:
                if parameters[0].value:
                    fieldList = []
                    dataset = NET.Dataset(parameters[0].value.value, keepweakref = True)
                    analysisPrefix = ['EMERGING_', 'OUTLIER_', '_ESTIMATED', 'FORECAST_', 'CPD_']
                    if isPanel(dataset):
                        vars2Ignore = panelVars2Ignore
                        vars2Ignore.append(dataset.location_id_field)
                        dims = ('time', 'locations')
                        if not isPolygon(dataset):
                            parameters[7].filter.list = supportConceptsPoints
                        else:
                            parameters[7].filter.list = supportConcepts

                        #### Clear Mask ####
                        parameters[6].value = None
                        parameters[6].enabled = False
                    else:
                        vars2Ignore = gridVars2Ignore
                        dims = ('time', 'y', 'x')
                        parameters[6].enabled = True
                    
                    for var in dataset.variables:
                        if dataset.variables[var].dimensions == dims:
                            if var not in vars2Ignore:
                                if (any(pre in var for pre in analysisPrefix)) == False:
                                    fieldList.append(var)
                    parameters[1].filter.list = fieldList

                    #### Set Time Range ####
                    timeSize = int(dataset.variables['time'].size * .75)
                    parameters[4].filter.list = [1, timeSize]

                    #### Set Shape and Layer Type ####
                    renderLayerFile = setLayerNameFromDataset('LocalOutlier', dataset)
                    fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
                    parameters[2].symbology = fullRLF
                    dataset.close()
                    del dataset
            except:
                pass
            finally:
                if 'dataset' in locals():
                    dataset.close()
        
        if paramChanged(parameters[1]):
            try:
                isPanelCube = isPanelFromFile(parameters[0].value.value) 
            except:
                isPanelCube = False
            if not isPanelCube:
                varName = parameters[1].value
                if '_ZEROS' in varName or varName == 'COUNT':
                    parameters[6].enabled = True
                else:
                    parameters[6].enabled = False 
            else:
                parameters[6].enabled = False 

        #### Set Conceptualization ####
        if paramChanged(parameters[7]):
            upperValue = parameters[7].value.upper()
            if upperValue == "K_NEAREST_NEIGHBORS":
                parameters[3].enabled = False
                if not parameters[8].value:
                    parameters[8].value = 8
            else:
                if upperValue == "FIXED_DISTANCE":
                    parameters[3].enabled = True
                else:
                    parameters[3].enabled = False

        #### Set Empty Time Values ####
        if type(parameters[4].value) != int:
            parameters[4].value = 1

        #### Add Fields ####
        addFields = []

        #### Result Fields ####
        fieldNames = ["LOCATION"]
        fieldTypes = ["LONG"] 
        outLongNames = ["NUM_OUT", "N_LOW_CLS", "N_LOW_OUT",
                                   "N_HIGH_CLS", "N_HIGH_OUT"]
        for fieldName in outLongNames:
            fieldNames.append(fieldName)
            fieldTypes.append("LONG")

        outFloatNames = ["PERC_OUT", "P_LOW_CLS", "P_LOW_OUT",
                                     "P_HIGH_CLS", "P_HIGH_OUT"]
        for fieldName in outFloatNames:
            fieldNames.append(fieldName)
            fieldTypes.append("DOUBLE")

        fieldNames.append("CO_TYPE")
        fieldTypes.append("LONG")

        #### Append Output Field to Output Feature Class's Schema ####
        for fieldInd, fieldName in enumerate(fieldNames):
            fieldType = fieldTypes[fieldInd]
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = fieldType
            addFields.append(newField)
        parameters[2].schema.additionalFields = addFields

        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        import netCDF4 as NET

        #### Assure Cube is Valid ####
        throwCubeError = False
        if parameters[0].value:
            try:
                cubeStr = parameters[0].value.value
                fileExists = OS.path.isfile(cubeStr)
                dataset = NET.Dataset(cubeStr, keepweakref = True)
                cubeBool = isCube(dataset)
                panelBool = isPanel(dataset)

                if not cubeBool and fileExists:
                    #### Not a Cube ####
                    throwCubeError = True

                if panelBool and not isPro():
                    #### Panel Only For Pro ####
                    parameters[0].setIDMessage("ERROR", 110119)

                checkIfForecastCube(dataset, parameters[0], throwError=False)

                if paramChanged(parameters[1]):
                    if parameters[1].value not in dataset.variables:
                        parameters[1].setIDMessage("ERROR", 110024, parameters[1].value)

                dataset.close()

            except:
                #### Not a Cube ####
                if not parameters[0].isInputValueDerived():
                    throwCubeError = True

        if throwCubeError:
            cubeDir, cubeFile = OS.path.split(parameters[0].value.value)
            parameters[0].setIDMessage("ERROR", 110003, cubeFile)

        if paramChanged(parameters[3]):
            if parameters[3].value:
                value = getLinearUnitFloat(parameters[3].value)
                if value <= 0.0:
                    parameters[3].setIDMessage("ERROR", 110045)

        if paramChanged(parameters[7]):
            if parameters[7].value.upper() == "K_NEAREST_NEIGHBORS":
                value = int(parameters[8].value)
                if value <= 0:
                    parameters[8].setIDMessage("ERROR", 895)

        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        ################### Imports ########################
        import sys as SYS
        import numpy as NUM
        import SSCube as CUBE
        import SSPanel as PANEL
        import WeightsUtilities as WU

        """Retrieves the parameters from the User Interface and executes the
        appropriate commands."""

        #### User Defined Inputs ####
        inputCube = parameters[0].valueAsText
        varName = getTextParameter(parameters, 1)
        outputFC = parameters[2].valueAsText
        distance = parameters[3].valueAsText
        timeOrder = getNumericParameter(parameters, 4)
        permutations = getNumericParameter(parameters, 5)
        if permutations is None:
            permutations = 499
        if timeOrder is None:
            timeOrder = 1
        backwardOnly = True
        maskFC = parameters[6].valueAsText
        concept = parameters[7].valueAsText
        numNeighs = getNumericParameter(parameters, 8)

        globalMethod = parameters[9].valueAsText

        if globalMethod is None:
            globalMethod = "ENTIRE_CUBE"

        globalMethod = globalMethod.upper()

        #### Neighborhood Concept ####
        spaceConcept = concept.upper()

        #### Ensure Polygon Mask Only Applies on Appropriate Variables ####
        polyMask = maskFC is not None
        if not ('_ZEROS' in varName or varName == 'COUNT') and polyMask:
            ARCPY.AddIDMessage("ERROR", 583)
            raise SystemExit()

        #### Boolean for Panel Or Not ####
        isPanelCube = isPanelFromFile(inputCube) 

        if not isPanelCube:
            #### Create Cube Object for Local Outlier Analysis ####
            cube = CUBE.SSCube(inputCube, 'a')

            #### Get Analysis Mask ####
            analysisMask = cube.getAnalysisMask(varName, maskFC)

            #### Set Neighborhood ####
            if spaceConcept in ["FIXED_DISTANCE", "K_NEAREST_NEIGHBORS"]:
                cube.setNeighborInfo(spaceConcept, distance, timeOrder, analysisMask,
                                     numNeighs = numNeighs, includeSelf = False)
            elif spaceConcept == "CONTIGUITY_EDGES_ONLY":
                cube.setNeighborInfo(spaceConcept, cube.distanceInterval, timeOrder,
                                     analysisMask, includeSelf = False)
            elif spaceConcept == "CONTIGUITY_EDGES_CORNERS":
                a2b2 = 2.0 * cube.distanceInterval**2.0
                hypo = NUM.sqrt(a2b2)
                cube.setNeighborInfo(spaceConcept, hypo, timeOrder, analysisMask,
                                     includeSelf = False)

            #### Carry Out Local Outlier Analysis ####
            cube.clusterOutlier(varName, analysisMask = analysisMask,
                                permutations = permutations,
                                globalMethod = globalMethod)

            #### Generate Local Outlier Analysis Feature Class ####
            candidateFields = cube.clusterOutlierFields2D(outputFC, varName)
            cube.exportFeatures2D(outputFC, candidateFields)
            cube.close()

        else:
            #### Create Panel Cube Object for Analysis ####
            cube = PANEL.SSPanel(inputCube, 'a')

            #### Create Neighborhood ####
            if spaceConcept == "FIXED_DISTANCE":
                threshold = distance

                #### Resolve Hybrid Distance and KNN ###
                if numNeighs is not None:
                    if not numNeighs:
                        numNeighs = None
            else:
                threshold = None

            neighInfo = WU.SciPyNeighborSearch(cube, spaceConcept = spaceConcept,
                                               threshold = threshold,
                                               numNeighs = numNeighs,
                                               timeOrder = timeOrder,
                                               scratch = ARCPY.env.scratchGDB)

            #### Carry Out Local Outlier Analysis ####
            cube.clusterOutlier(varName, neighInfo, permutations = permutations,
                                globalMethod = globalMethod)

            #### Generate Local Outlier Analysis Feature Class ####
            candidateFields = cube.clusterOutlierFields2D(outputFC, varName)
            cube.exportFeatures2D(outputFC, candidateFields)
            cube.close()

        #### Set Shape and Layer Type ####
        renderLayerFile = setLayerNameFromCube('LocalOutlier', cube)
        
        #### Render Results ####
        try:
            fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
            parameters[2].symbology = fullRLF
        except:
            ARCPY.AddIDMessage("WARNING", 973)

        return


class TimeSeriesClustering(object):
    """
    Cluster time series data by using different kind of distance metrics.
    METHOD:
        __init__(): Define tool name and class info
        getParameterInfo(): Define parameter definitions in tool
        isLicensed(): Set whether tool is licensed to execute
        updateParameters():Modify the values and properties of parameters
                           before internal validation is performed
        updateMessages(): Modify the messages created by internal validation
                          for each tool parameter.
        execute(): Runtime script for the tool
    """

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Time Series Clustering"
        self.description = "Geoprocessing tool that creates clusters based on the time series " \
                           "dissimilarity of space time cubes"
        self.canRunInBackground = False
        self.helpContext = 50000005

    def getParameterInfo(self):
        """Define parameter definitions"""
        #### Local Imports ####
        #### Define Parameters ####

        param0 = ARCPY.Parameter(displayName="Input Space Time Cube",
                                 name="in_cube",
                                 datatype="DEFile",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ["nc"]
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Analysis Variable",
                                 name="analysis_variable",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Output Features",
                                 name="output_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Required",
                                 direction="Output")
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Characteristic of Interest",
                                 name="characteristic_of_interest",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param3.filter.type = "ValueList"
        param3.filter.list = dissimilarityMeasure
        param3.displayOrder = 3

        param4 = ARCPY.Parameter(displayName="Cluster Number",
                                 name="cluster_count",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param4.displayOrder = 5

        param5 = ARCPY.Parameter(displayName="Output Table for Time Series Cluster Charts",
                                 name="output_table_for_charts",
                                 datatype="DETable",
                                 parameterType="Optional",
                                 direction="Output")
        param5.displayOrder = 7

        param6 = ARCPY.Parameter(displayName="Shape Characteristic to Ignore",
                                 name="shape_characteristic_to_ignore",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input",
                                 multiValue=True)
        param6.controlCLSID = "{38C34610-C7F7-11D5-A693-0008C711C8C1}"
        param6.filter.type = "ValueList"
        param6.filter.list = ["TIME_LAG", "RANGE"]
        param6.enabled = False
        param6.displayOrder = 4

        param7 = ARCPY.Parameter(displayName="Enable Time Series Pop-ups",
                                 name="enable_time_series_popups",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param7.filter.list = ['CREATE_POPUP', 'NO_POPUP']
        param7.value = False
        param7.displayOrder = 6

        params = [param0, param1, param2, param3, param4, param5,
                  param6, param7]

        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def extendTableName(self, tablePath, suffix):
        if isInGDB(tablePath):
            tablePathNew = tablePath + suffix
        else:
            tableName, tableExt = OS.path.splitext(tablePath)
            tablePathNew = tableName + suffix + tableExt
        return tablePathNew

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        import netCDF4 as NET
        import SSCube as CUBE
        import SSPanel as PANEL

        param_characterOfInterest = parameters[3]
        param_chartTable = parameters[5]
        param_shape_characteristic_to_ignore = parameters[6]

        if paramChanged(parameters[0]):
            try:
                dataset = NET.Dataset(parameters[0].value.value, keepweakref=True)
                if isPanel(dataset):
                    vars2Ignore = panelVars2Ignore
                    vars2Ignore.append(dataset.location_id_field)
                    dims = ('time', 'locations')
                else:
                    vars2Ignore = gridVars2Ignore
                    dims = ('time', 'y', 'x')

                #### Filter Variables ####
                varCandidates = []
                for var in dataset.variables:
                    if dataset.variables[var].dimensions == dims:
                        if var not in vars2Ignore:
                            if filterTSCubeVarByName(var):
                                varCandidates.append(var)
                parameters[1].filter.list = varCandidates
            except:
                pass
            finally:
                #### Close Dataset ####
                if 'dataset' in locals():
                    dataset.close()

        #### Add DBF Extension To Chart if Folder ####
        if paramChanged(param_chartTable):
            chartTable = param_chartTable.value.value
            #### Assure Output Workspace Exists ####
            outPath, outName = OS.path.split(chartTable)
            if ARCPY.Exists(outPath):
                chartTable, dbf = returnTableName(chartTable)
                if dbf:
                    param_chartTable.value = chartTable

        if paramChanged(param_characterOfInterest):
            characterOfInterest = parameters[3].valueAsText
            if characterOfInterest == "VALUE":
                param_shape_characteristic_to_ignore.enabled = False
                param_shape_characteristic_to_ignore.value = None
            elif characterOfInterest == "PROFILE":
                param_shape_characteristic_to_ignore.enabled = False
                param_shape_characteristic_to_ignore.value = None
            elif characterOfInterest == "PROFILE_FOURIER":
                param_shape_characteristic_to_ignore.enabled = True

        #### Append Output Field to Output Feature Class's Schema ####
        addFields = []
        fieldNames = ["LOCATION", "CLUSTER_ID", "CENTER_REP"]
        fieldTypes = ["LONG", "LONG", "LONG"]
        fieldAlias = ["Location ID", "Time-Series Cluster ID", "Time-Series Cluster Representative"]
        for fieldInd, fieldName in enumerate(fieldNames):
            fieldType = fieldTypes[fieldInd]
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = fieldType
            newField.aliasName = fieldAlias[fieldInd]
            addFields.append(newField)
        parameters[2].schema.additionalFields = addFields

        #### Append Output Field to Output Chart Table Class's Schema ####
        addFields = []
        fieldNames = ["LOCATION", "ELEMENT", "TIME_STEP"]
        fieldAlias = ["Location ID", "Element", "Time Step ID"]
        fieldTypes = ["LONG"] * 3

        fieldNames += ["START_DATE", "END_DATE"]
        fieldAlias += ["Start Date", "End Date"]
        fieldTypes += ["DATE"] * 2

        fieldNames += ["TIME_EXAG", "CLUST_MED", "CLUST_MEAN"]
        fieldAlias += ["Time Step ID Exaggeration", "Time-Series Cluster Medoid", "Time-Series Cluster Average"]
        fieldTypes += ["DOUBLE"] * 3

        fieldNames.append("CLUSTER_ID")
        fieldAlias.append("Time-Series Cluster ID")
        fieldTypes.append("LONG")

        for fieldInd, fieldName in enumerate(fieldNames):
            fieldType = fieldTypes[fieldInd]
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = fieldType
            newField.aliasName = fieldAlias[fieldInd]
            addFields.append(newField)
        parameters[5].schema.additionalFields = addFields

        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""

        import netCDF4 as NET

        param_cube = parameters[0]
        param_chartTable = parameters[5]

        #### Assure Cube is Valid ####
        throwCubeError = False
        if param_cube.value:
            try:
                cubeStr = param_cube.value.value
                fileExists = OS.path.isfile(cubeStr)
                dataset = NET.Dataset(cubeStr, keepweakref=True)
                cubeBool = isCube(dataset)
                panelBool = isPanel(dataset)

                if not cubeBool and fileExists:
                    #### Not a Cube ####
                    throwCubeError = True

                if panelBool and not isPro():
                    #### Panel Only For Pro ####
                    param_cube.setIDMessage("ERROR", 110119)

                checkIfForecastCube(dataset, param_cube, throwError=False)

                if paramChanged(parameters[1]):
                    if parameters[1].value not in dataset.variables:
                        parameters[1].setIDMessage("ERROR", 110024, parameters[1].value)

                dataset.close()

            except:
                #### Not a Cube ####
                if not param_cube.isInputValueDerived():
                    throwCubeError = True

        if throwCubeError:
            cubeDir, cubeFile = OS.path.split(param_cube.value.value)
            param_cube.setIDMessage("ERROR", 110003, cubeFile)

        #### Assure Output FC and Chart Table are Unique ####
        outParam = parameters[2]
        if outParam.value and param_chartTable.value:
            fcBase, ext = OS.path.splitext(outParam.value.value)
            chartBase, ext = OS.path.splitext(param_chartTable.value.value)
            if ".SDE" not in fcBase.upper() and fcBase == chartBase:
                chartPath, shortChartName = OS.path.split(chartBase)
                param_chartTable.setIDMessage("ERROR", 943, shortChartName)

        numGroups = parameters[4].value
        if numGroups not in ["", "#", None]:
            if numGroups < 2:
                #### User Provided Must be Larger than 1 ####
                parameters[4].setIDMessage("ERROR", 110128, 2)

        scatParam = parameters[7]
        if scatParam.value and outParam.value:
            if UTILS.isShapeFile(outParam.valueAsText):
                scatParam.setIDMessage("WARNING", 110315)

        #### Assure Output Table's Workspace Exists ####
        if paramChanged(param_chartTable):
            chartTable = param_chartTable.value.value
            outPath, outName = OS.path.split(chartTable)
            if not ARCPY.Exists(outPath):
                param_chartTable.setIDMessage("ERROR", 210, chartTable)

        return

    def execute(self, parameters, messages):
        import TimeSeriesCluster as TSC
        TSC.execute(parameters, messages)

    def postExecute(self, parameters):
        import TimeSeriesCluster as TSC
        TSC.postExecute(parameters)

class VisualizeSpaceTimeCube2D(object):
    """
    Visualize 2D Space Time Cube.
    METHOD:
        __init__(): Define tool name and class info
        getParameterInfo(): Define parameter definitions in tool
        isLicensed(): Set whether tool is licensed to execute
        updateParameters():Modify the values and properties of parameters
                           before internal validation is performed
        updateMessages(): Modify the messages created by internal validation
                          for each tool parameter.
        execute(): Runtime script for the tool
    """
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Visualize Space Time Cube in 2D"
        self.description = "Geoprocessing tool that visualizes space-time cube variables in two dimensions."
        self.category = "Space Time Cube Analysis"
        self.canRunInBackground = False
        self.helpContext = 50010001

    def getParameterInfo(self):
        """Define parameter definitions"""

        #### Define Parameters ####
        param0 = ARCPY.Parameter(displayName="Input Space Time Cube",
                                 name="in_cube",
                                 datatype="DEFile",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['nc']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Cube Variable",
                                 name="cube_variable",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param1.filter.type = "ValueList"
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Display Theme",
                                 name="display_theme",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param2.filter.type = "ValueList"
        param2.filter.list = ["LOCATIONS_WITH_DATA",
                              "TRENDS",
                              "HOT_AND_COLD_SPOT_TRENDS",
                              "EMERGING_HOT_SPOT_ANALYSIS_RESULTS", 
                              "LOCAL_OUTLIER_ANALYSIS_RESULTS",
                              "PERCENTAGE_OF_LOCAL_OUTLIERS",
                              "LOCAL_OUTLIER_IN_MOST_RECENT_TIME_PERIOD",
                              "TIME_SERIES_CLUSTERING_RESULTS",
                              "LOCATIONS_WITHOUT_SPATIAL_NEIGHBORS",
                              "NUMBER_OF_ESTIMATED_BINS", 
                              "LOCATIONS_EXCLUDED_FROM_ANALYSIS",
                              "FORECAST_RESULTS",
                              "TIME_SERIES_OUTLIER_RESULTS",
                              "TIME_SERIES_CHANGE_POINTS",
                              "TIME_SERIES_CROSS_CORRELATION_RESULTS"]
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Output Features",
                                 name="output_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Required",
                                 direction="Output")
        param3.displayOrder = 4

        #### Initialize Output Schema ####
        param3.parameterDependencies = [param0.name]
        param3.schema.featureTypeRule = "AsSpecified"
        param3.schema.featureType = "Simple"
        param3.schema.geometryTypeRule = "AsSpecified"
        param3.schema.geometryType = "Polygon"
        param3.schema.fieldsRule = "None"

        param4 = ARCPY.Parameter(displayName="Enable Time Series Pop-ups",
                                 name="enable_time_series_popups",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param4.filter.list = ['CREATE_POPUP', 'NO_POPUP']
        param4.value = False
        param4.displayOrder = 3

        #### Pack Parameters ####
        params = [param0, param1, param2, param3, param4]

        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        import sys as SYS
        import netCDF4 as NET

        if paramChanged(parameters[0]):
            if parameters[0].value:
                try:
                    dataset = NET.Dataset(parameters[0].value.value, keepweakref = True)
                    varNames = getCoreCubeVariables(dataset, removeAnalysis = True,
                                                    removeSTD = False, allowCorrRes=True)
                    parameters[1].filter.list = varNames
                    dataset.close()
                except:
                    pass

        if parameters[1].altered and parameters[1].value:
            inputVar = parameters[1].value.upper()
            if parameters[0].value:
                try:
                    dataset = NET.Dataset(parameters[0].value.value, keepweakref = True)
                    groupList = getGroupList2D(dataset, inputVar)
                    parameters[2].filter.list = groupList
                    dataset.close()
                except:
                    pass
        if parameters[2].value:
            param_popup = parameters[4]
            displayTheme = parameters[2].valueAsText
            themesForPopup = ["LOCATIONS_WITH_DATA",
                            "TRENDS",
                            "HOT_AND_COLD_SPOT_TRENDS",
                            "EMERGING_HOT_SPOT_ANALYSIS_RESULTS",
                            "LOCAL_OUTLIER_ANALYSIS_RESULTS",
                            "PERCENTAGE_OF_LOCAL_OUTLIERS",
                            "LOCAL_OUTLIER_IN_MOST_RECENT_TIME_PERIOD",
                            "TIME_SERIES_CLUSTERING_RESULTS",
                            "FORECAST_RESULTS",
                            "TIME_SERIES_OUTLIER_RESULTS",
                            "TIME_SERIES_CHANGE_POINTS"]
            if displayTheme in themesForPopup:
                param_popup.enabled = True
            else:
                param_popup.value = False
                param_popup.enabled = False

        addFields = []
        fieldNames = ["LOCATION"]
        fieldTypes = ["LONG"]
        sumFields = ["SUM_VALUE", "MIN_VALUE", "MAX_VALUE", 
                     "MEAN_VALUE", "STD_VALUE", "MED_VALUE"]

        if paramChanged(parameters[2]):
            try:
                inputDisplay = parameters[2].value
                if inputDisplay:
                    parameters[2].value = inputDisplay = inputDisplay.upper()
                    if inputDisplay == "LOCATIONS_WITH_DATA":
                        fieldNames.append("LOC_W_DATA")
                        fieldTypes.append("LONG")
                        renderLayerFile = "LocationsWithData"

                    elif inputDisplay == "LOCATIONS_EXCLUDED_FROM_ANALYSIS":
                        fieldNames.append("EXCLUDED")
                        fieldTypes.append("LONG")
                        renderLayerFile = "LocationsExcluded"

                    elif inputDisplay == "NUMBER_OF_ESTIMATED_BINS":
                        fieldNames += ["SUM_EST", "PERC_EST"]
                        fieldTypes += ["DOUBLE", "DOUBLE"]
                        renderLayerFile = "NumberEstimatedBins"

                    elif inputDisplay == "EMERGING_HOT_SPOT_ANALYSIS_RESULTS":
                        fieldNames.append("CATEGORY")
                        fieldTypes.append("LONG")
                        fieldNames.append("PATTERN")
                        fieldTypes.append("TEXT")
                        fieldNames += ["PERC_HOT", "PERC_COLD", "TREND_Z", 
                                       "TREND_P", "TREND_BIN"]
                        fieldTypes += ["DOUBLE"] * 5
                        fieldNames += sumFields
                        fieldTypes += ["DOUBLE"] * 6
                        renderLayerFile = 'Emerging_All'

                    elif inputDisplay == "TIME_SERIES_CLUSTERING_RESULTS":
                        fieldNames += ["CLUSTER_ID", "CENTER_REP"]
                        fieldTypes += ["LONG", "LONG"]

                    elif inputDisplay in localOutlierTypes:
                        fieldNames += ["NUM_OUT", "PERC_OUT",
                                       "N_LOW_CLS", "P_LOW_CLS",
                                       "N_LOW_OUT", "P_LOW_OUT",
                                       "N_HIGH_CLS", "P_HIGH_CLS",
                                       "N_HIGH_OUT", "P_HIGH_OUT",
                                       "NO_SP_NBR", "OUT_R_TIME",
                                       "CO_TYPE"]
                        fieldTypes += ["LONG", "DOUBLE",
                                       "LONG", "DOUBLE",
                                       "LONG", "DOUBLE",
                                       "LONG", "DOUBLE",
                                       "LONG", "DOUBLE",
                                       "LONG", "TEXT",
                                       "TEXT"]
                        fieldNames += sumFields
                        fieldTypes += ["DOUBLE"] * 6
                        renderKey = localOutlierTypes.index(inputDisplay)
                        renderLayerFile = localOutlierFiles[renderKey]

                    elif inputDisplay == "TRENDS":
                        fieldNames += ["TREND_Z", "TREND_P", "TREND_BIN"]
                        fieldTypes += ["DOUBLE"] * 3
                        renderLayerFile = 'Trends'

                    elif inputDisplay == "HOT_AND_COLD_SPOT_TRENDS":
                        fieldNames += ["TREND_Z", "TREND_P", "TREND_BIN"]
                        fieldTypes += ["DOUBLE"] * 3
                        renderLayerFile = 'HotAndColdSpotTrends'

                    elif inputDisplay in ["FORECAST_RESULTS", "TIME_SERIES_OUTLIER_RESULTS"]:
                        if parameters[0].value:
                            try:
                                dataset = NET.Dataset(parameters[0].value.value, keepweakref = True)

                                #### Add Forecast Fields ####
                                numTime = dataset.dimensions['time'].size
                                startForecast = int(dataset.begin_forecast_bin)
                                numForecast = numTime - startForecast
                                fieldNames += ["FCAST_{0}".format(i+1) for i in range(numForecast)]
                                fieldTypes += ["DOUBLE"] * numForecast

                                #### Add RMSE Field(s) ####
                                fieldNames.append("F_RMSE")
                                fieldTypes.append("DOUBLE")
                                if hasattr(dataset, "has_validation"):
                                    fieldNames.append("V_RMSE")
                                    fieldTypes.append("DOUBLE")

                                #### Season / Time Window / Is Seasonal ####
                                if hasattr(dataset, 'forecast_type'):
                                    forecastType = int(dataset.forecast_type)
                                    if forecastType == 0:
                                        #### Forest ####
                                        fieldNames += ["TIMEWINDOW", "IS_SEASON", "METHOD"]
                                        fieldTypes += ["LONG", "LONG", "TEXT"]

                                    elif forecastType == 1:
                                        #### Exponential Smoothing ####
                                        fieldNames += ["SEASON", "METHOD"]
                                        fieldTypes += ["LONG", "TEXT"]

                                    elif forecastType == 2:
                                        #### Evaluate ####
                                        fieldNames += ["SEASON", "TIMEWINDOW", "IS_SEASON", "METHOD"]
                                        fieldTypes += ["LONG", "LONG", "LONG", "TEXT"]

                                    else:
                                        #### Curve Fitting ####
                                        fieldNames += ["METHOD", "EQUATION"]
                                        fieldTypes += ["TEXT", "TEXT"]

                                else:
                                    #### Old/Temp Cubes ####
                                    fieldNames += ["SEASON", "METHOD"]
                                    fieldTypes += ["LONG", "TEXT"]

                                #### Outliers ####
                                if parameters[1].value:
                                    l = "FORECAST_" + parameters[1].value + "_OUTLIER"
                                    if l in dataset.variables:
                                        fieldNames.append("N_OUTLIERS")
                                        fieldTypes.append("LONG")
        
                                #### Add LYR File ####
                                #shapeType = dataset.agg_shape_type
                                #renderLayerFile = 
                                dataset.close()
                            except:
                                pass
                    elif inputDisplay == "TIME_SERIES_CHANGE_POINTS":
                        fieldNames += ["TREND_Z", "TREND_P", "TREND_BIN"]
                        fieldTypes += ["DOUBLE"] * 3
                        renderLayerFile = 'Trends'

                    else:
                        # TODO: Confirm tool behavior
                        if parameters[0].value:
                            try:
                                dataset = NET.Dataset(parameters[0].value.value, keepweakref = True)
                                inputVar = parameters[1].value.upper()
                                if dataset.variables[inputVar].dtype == 'float64':
                                    sumFieldNames.append(inputVar)
                                else:
                                    idFieldNames.append(inputVar)
                                dataset.close()
                            except:
                                pass
                        renderLayerFile = 'LocationsWithData'

                    #### Set Shape and Layer Type ####
                    if parameters[0].value:
                        try:
                            dataset = NET.Dataset(parameters[0].value.value, keepweakref = True)
                            if inputDisplay == "TIME_SERIES_CLUSTERING_RESULTS":
                                if isPolygon(dataset):
                                    renderLayerFile = "MultiVarClusterPolygons.lyr"
                                else:
                                    renderLayerFile = "MultiVarClusterPoints.lyrx"
                            else:
                                renderLayerFile = setLayerNameFromDataset(renderLayerFile, dataset)
                            fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
                            parameters[3].symbology = fullRLF
                            dataset.close()
                        except:
                            pass
            except:
                pass

        if len(fieldNames) == len(fieldTypes):
            #### Append Output Field to Output Feature Class's Schema ####
            for fieldInd, fieldName in enumerate(fieldNames):
                fieldType = fieldTypes[fieldInd]
                newField = ARCPY.Field()
                newField.name = fieldName
                newField.type = fieldType
                addFields.append(newField)
            parameters[3].schema.additionalFields = addFields

        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        import netCDF4 as NET

        #### Assure Cube is Valid ####
        throwCubeError = False
        if parameters[0].value:
            try:
                cubeStr = parameters[0].value.value
                fileExists = OS.path.isfile(cubeStr)
                dataset = NET.Dataset(cubeStr, keepweakref = True)
                cubeBool = isCube(dataset)
                panelBool = isPanel(dataset)

                if not cubeBool and fileExists:
                    #### Not a Cube ####
                    throwCubeError = True

                if panelBool and not isPro():
                    #### Panel Only For Pro ####
                    parameters[0].setIDMessage("ERROR", 110119)

                if paramChanged(parameters[1]):
                    varNames = getCoreCubeVariables(dataset, removeAnalysis=True,
                                                    removeSTD=False, allowCorrRes=True)
                    if parameters[1].value not in varNames:
                        parameters[1].setIDMessage("ERROR", 110024, parameters[1].value)

                dataset.close()

            except:
                #### Not a Cube ####
                if not parameters[0].isInputValueDerived():
                    throwCubeError = True

        if throwCubeError:
            cubeDir, cubeFile = OS.path.split(parameters[0].value.value)
            parameters[0].setIDMessage("ERROR", 110003, cubeFile)

        outParam = parameters[3]
        scatParam = parameters[4]
        if scatParam.value and outParam.value:
            if UTILS.isShapeFile(outParam.valueAsText):
                scatParam.setIDMessage("WARNING", 110315)

        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        import arcpy as ARCPY
        import SSCube as CUBE
        import SSPanel as PANEL
        import sys as SYS
        import SSCubeUtilities as CUTILS

        inputCube = parameters[0].valueAsText
        inputVar = getTextParameter(parameters, 1)
        inputDisplay = getTextParameter(parameters, 2)
        outputFC = parameters[3].valueAsText
        createPopUps = parameters[4].value

        #### Boolean for Panel Or Not ####
        isPanelCube = isPanelFromFile(inputCube) 
        if not isPanelCube:
            cube = CUBE.SSCube(inputCube)
        else:
            cube = PANEL.SSPanel(inputCube)


        #### Create Output Candidate Fields ####
        if inputDisplay == "LOCATIONS_WITH_DATA":
            candidateFields = cube.locationsWithData2D(outputFC, inputVar)
            renderLayerFile = "LocationsWithData"

        elif inputDisplay == "LOCATIONS_EXCLUDED_FROM_ANALYSIS":
            candidateFields = cube.excludedLocations2D(outputFC, inputVar)
            renderLayerFile = "LocationsExcluded"

        elif inputDisplay == "NUMBER_OF_ESTIMATED_BINS":
            candidateFields = cube.estimatedBins2D(outputFC, inputVar)
            renderLayerFile = "NumberEstimatedBins"

        elif inputDisplay == "EMERGING_HOT_SPOT_ANALYSIS_RESULTS":
            candidateFields = cube.emergingOutputFields2D(outputFC, inputVar)
            renderLayerFile = 'Emerging_All'

        elif inputDisplay in localOutlierTypes:
            candidateFields = cube.clusterOutlierFields2D(outputFC, inputVar)
            renderKey = localOutlierTypes.index(inputDisplay)
            renderLayerFile = localOutlierFiles[renderKey]

        elif inputDisplay == "HOT_AND_COLD_SPOT_TRENDS":
            candidateFields = cube.hotSpotTrendFields2D(outputFC, inputVar)
            renderLayerFile = 'HotAndColdSpotTrends'

        elif inputDisplay == "TIME_SERIES_CLUSTERING_RESULTS":
            candidateFields = cube.timeSeriesClusterFields2D(outputFC, inputVar)
            if cube.isPolygon:
                renderLayerFile = "MultiVarClusterPolygons.lyr"
            else:
                renderLayerFile = "MultiVarClusterPoints.lyrx"

        elif inputDisplay == "FORECAST_RESULTS":
            candidateFields = cube.forecastOutputFields2D(outputFC, inputVar)
            shapeType = "Point"
            if cube.isPolygon:
                shapeType = "Polygon"

            latestForecastField = None
            forecastStep = -1
            for candidateField in candidateFields:
                if candidateField.name.startswith("FCAST_"):
                    step = int(candidateField.name.replace("FCAST_", ""))
                    if step > forecastStep:
                        forecastStep = step
                        latestForecastField = candidateField
            if latestForecastField is not None:
                renderLayerFile = CUTILS.generateForecatingSymbology(latestForecastField.data,
                                                                latestForecastField.name, latestForecastField.alias,
                                                                shapeType)

        elif inputDisplay == "TIME_SERIES_OUTLIER_RESULTS":
            candidateFields = cube.forecastOutputFields2D(outputFC, inputVar)
            renderLayerFile = "TimeSeriesOutliers"

        elif inputDisplay == "TRENDS":
            candidateFields = cube.trendFields2D(outputFC, inputVar)
            renderLayerFile = 'Trends'

        elif inputDisplay == "TIME_SERIES_CHANGE_POINTS":
            inputDisplay = "CHANGE_POINT_DETECTION_RESULTS"
            candidateFields = cube.changePointOutputFields2D(outputFC, inputVar)
            renderLayerFile = "changePoint"

        elif inputDisplay == "TIME_SERIES_CROSS_CORRELATION_RESULTS":
            candidateFields = cube.timeSeriesCorrelationFields2D(outputFC, inputVar)
            if cube.isPolygon:
                renderLayerFile = "TimeSeriesCorrelation_Polygon.lyrx"
            else:
                renderLayerFile = "TimeSeriesCorrelation_Point.lyrx"

        else:
            candidateFields = cube.varOutputFields2D(outputFC, inputVar)
            renderLayerFile = "LocationsWithData"

        if createPopUps:
            if not UTILS.isShapeFile(outputFC):
                chartField = CUTILS.generateCubePopupChartField(cube, inputVar, theme=inputDisplay)
                candidateFields.append(chartField)
            else:
                #### Throw Warning That We Ignore PopUps for Shapefiles ####
                ARCPY.AddIDMessage("WARNING", 110315)
        #### Write Output Features and Close Cube ####
        cube.exportFeatures2D(outputFC, candidateFields)

        cube.close()

        if inputDisplay == "FORECAST_RESULTS":
            if renderLayerFile is not None:
                ARCPY.gp.SetParameterSymbology(3, renderLayerFile)
        else:
            #### Set Shape and Layer Type ####
            if inputDisplay not in ["ZONES", "TIME_SERIES_CLUSTERING_RESULTS", "TIME_SERIES_CROSS_CORRELATION_RESULTS"]:
                renderLayerFile = setLayerNameFromCube(renderLayerFile, cube)


            #### Render Results ####
            try:
                if isPro() and 'Emerging_All' in renderLayerFile:
                    ####  To solve a i18n issue ####
                    UTILS.buildLocaleCIMLayer(renderLayerFile, 3, data = {"heading": ARCPY.GetIDMessage(220847)})
                else:
                    fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
                    parameters[3].symbology = fullRLF
            except:
                ARCPY.AddIDMessage("WARNING", 973)

        return

    def postExecute(self, parameters):
        #### Update Pop-up titles ####
        UTILS.postExecuteUpdatePopupTitle(parameters, 3, 4)


class VisualizeSpaceTimeCube3D(object):
    """
    Visualize 3D Space Time Cube.
    METHOD:
        __init__(): Define tool name and class info
        getParameterInfo(): Define parameter definitions in tool
        isLicensed(): Set whether tool is licensed to execute
        updateParameters():Modify the values and properties of parameters
                           before internal validation is performed
        updateMessages(): Modify the messages created by internal validation
                          for each tool parameter.
        execute(): Runtime script for the tool
    """
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Visualize Space Time Cube in 3D"
        self.description = "Geoprocessing tool that visualizes space-time cube variables in three dimensions."
        self.category = "Space Time Cube Analysis"
        self.canRunInBackground = False
        self.helpContext = 50010002

    def getParameterInfo(self):
        """Define parameter definitions"""

        #### Define Parameters ####
        param0 = ARCPY.Parameter(displayName="Input Space Time Cube",
                                 name="in_cube",
                                 datatype="DEFile",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['nc']

        param1 = ARCPY.Parameter(displayName="Cube Variable",
                                 name="cube_variable",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param1.filter.type = "ValueList"

        param2 = ARCPY.Parameter(displayName="Display Theme",
                                 name="display_theme",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param2.filter.type = "ValueList"
        param2.filter.list = ["VALUE", "HOT_AND_COLD_SPOT_RESULTS", "LOCAL_OUTLIER_RESULTS",
                              "ESTIMATED_BINS", "TEMPORAL_AGGREGATION_COUNT", "FORECAST_RESULTS",
                              "TIME_SERIES_OUTLIER_RESULTS", "TIME_SERIES_CHANGE_POINTS"]

        param3 = ARCPY.Parameter(displayName="Output Features",
                                 name="output_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Required",
                                 direction="Output")

        #### Initialize Output Schema ####
        param3.parameterDependencies = [param0.name]
        param3.schema.featureTypeRule = "AsSpecified"
        param3.schema.featureType = "Simple"
        param3.schema.geometryTypeRule = "AsSpecified"
        param3.schema.geometryType = "Polygon"
        param3.schema.fieldsRule = "None"

        #### Pack Parameters ####
        params = [param0, param1, param2, param3]

        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        import sys as SYS
        import netCDF4 as NET

        if paramChanged(parameters[0]):
            if parameters[0].value:
                try:
                    dataset = NET.Dataset(parameters[0].value.value, keepweakref = True)
                    varNames = getCoreCubeVariables(dataset, removeAnalysis = True,   
                                                    removeSTD = False)
                    parameters[1].filter.list = varNames
                    dataset.close()
                except:
                    pass

        if parameters[1].altered and parameters[1].value:
            inputVar = parameters[1].value.upper()
            if parameters[0].value:
                try:
                    dataset = NET.Dataset(parameters[0].value.value, keepweakref = True)
                    groupList = getGroupList3D(dataset, inputVar)
                    parameters[2].filter.list = groupList
                    dataset.close()
                except:
                    pass

        addFields = []
        fieldNames = ["LOCATION", "ELEMENT", "TIME_STEP"]
        fieldTypes = ["LONG"] * 3
        fieldNames.append("DATE_TIME")
        fieldTypes.append("DATE")
        fieldNames.append("TIME_EXAG")
        fieldTypes.append("DOUBLE")

        if parameters[0].value:
            try:
                dataset = NET.Dataset(parameters[0].value.value, keepweakref = True)
                isHex = isHexagonCube(dataset)
                dataset.close()
            except:
                isHex = False
        else:
            isHex = False

        if paramChanged(parameters[2]):
            try:
                inputDisplay = parameters[2].value
                if inputDisplay:
                    parameters[2].value = inputDisplay = inputDisplay.upper()
                    if inputDisplay == "ESTIMATED_BINS":
                        fieldNames.append("ESTIMATED")
                        fieldTypes.append("LONG")
                        renderLayerFile = 'EstimatedBins_3D'

                    elif inputDisplay == "HOT_AND_COLD_SPOT_RESULTS":
                        fieldNames += ["HS_ZSCORE", "HS_PVALUE", "HS_BIN"]
                        fieldTypes += ["DOUBLE"] * 3
                        renderLayerFile = 'HotAndColdSpotResults_3D'

                    elif inputDisplay == "LOCAL_OUTLIER_RESULTS":
                        fieldNames += ["CO_INDEX", "CO_PVALUE", "CO_TYPE"]
                        fieldTypes += ["DOUBLE"] * 3
                        renderLayerFile = 'ClusterOutlier_3D'

                    elif inputDisplay == "TEMPORAL_AGGREGATION_COUNT":
                        fieldNames += ["VALUE"]
                        fieldTypes.append("DOUBLE")
                        renderLayerFile = 'Value_3D'

                    elif inputDisplay == "FORECAST_RESULTS":
                        #### 3D Output Fields for Forecasting ####
                        renderLayerFile = 'Value_3D'
                        if parameters[0].value:
                            try:
                                dataset = NET.Dataset(parameters[0].value.value, keepweakref = True)
                                fieldNames += ["VALUE", "FITTED"]
                                numFields = 2
                                if hasattr(dataset, 'forecast_type'):
                                    forecastType = int(dataset.forecast_type)
                                    if forecastType <= 2:
                                        fieldNames += ["HIGH", "LOW"]
                                        numFields += 2

                                    if forecastType == 1 and parameters[1].value:
                                        l = "FORECAST_" + parameters[1].value + "_LEVELCOMP"
                                        if l in dataset.variables:
                                            fieldNames += ["LEVEL", "TREND", "SEASON"]
                                            numFields += 3

                                fieldTypes += ["DOUBLE"] * numFields
                                dataset.close()
                            except:
                                pass

                    elif inputDisplay == "TIME_SERIES_OUTLIER_RESULTS":
                        #### 3D Output Fields for Forecasting ####
                        renderLayerFile = 'TS_Outliers_3D'
                        if parameters[0].value:
                            try:
                                dataset = NET.Dataset(parameters[0].value.value, keepweakref = True)
                                fieldNames += ["VALUE", "FITTED"]
                                numFields = 2
                                if hasattr(dataset, 'forecast_type'):
                                    forecastType = int(dataset.forecast_type)
                                    if forecastType <= 2:
                                        fieldNames += ["HIGH", "LOW"]
                                        numFields += 2

                                    if forecastType == 1 and parameters[1].value:
                                        l = "FORECAST_" + parameters[1].value + "_LEVELCOMP"
                                        if l in dataset.variables:
                                            fieldNames += ["LEVEL", "TREND", "SEASON"]
                                            numFields += 3

                                fieldTypes += ["DOUBLE"] * numFields
                                fieldNames += ["OUTLIER", "TSO_BIN", "TSO_TYPE"]
                                fieldTypes += ["LONG", "LONG", "TEXT"]
                                dataset.close()
                            except:
                                pass

                    elif inputDisplay == "TIME_SERIES_CHANGE_POINTS":
                        #### 3D output Fields for CPD ###
                        renderLayerFile = 'TS_ChangePoint_3D'
                        if parameters[0].value:
                            try:
                                fieldNames += ["CHPT_IND"]
                                fieldTypes += ["LONG"]
                                dataset = NET.Dataset(parameters[0].value.value, keepweakref=True)

                                if hasattr(dataset, 'change_type'):
                                    changeType = int(dataset.change_type)
                                    if changeType == 0:
                                        fieldNames += ["MEAN_BEF", "MEAN_CUR"]

                                    elif changeType == 1:
                                        fieldNames += ["VAR_BEF", "VAR_CUR"]

                                    elif changeType == 2:
                                        fieldNames += ["SLP_BEF", "SLP_CUR"]

                                    else:
                                        fieldNames += ["MEAN_BEF", "MEAN_CUR"]
                                fieldTypes = ["DOUBLE"] * 2
                                dataset.close()
                            except:
                                pass

                    else:
                        if parameters[0].value:
                            try:
                                dataset = NET.Dataset(parameters[0].value.value, keepweakref = True)
                                inputVar = parameters[1].value.upper()
                                fieldNames.append("VALUE")
                                if dataset.variables[inputVar].dtype == 'float64':
                                    fieldTypes.append("DOUBLE")
                                else:
                                    fieldTypes.append("LONG")
                                dataset.close()
                            except:
                                pass
                        renderLayerFile = 'Value_3D'

                    if isHex:
                        renderLayerFile = renderLayerFile.replace("_3D", "_Hex_3D")

                    if isPro():
                        fileExt = '.lyrx'
                    else:
                        fileExt = '.lyr'
                    renderLayerFile += fileExt
                    fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
                    parameters[3].symbology = fullRLF
            except:
                pass

        #### Append Output Field to Output Feature Class's Schema ####

        if len(fieldNames) == len(fieldTypes):
            for fieldInd, fieldName in enumerate(fieldNames):
                fieldType = fieldTypes[fieldInd]
                newField = ARCPY.Field()
                newField.name = fieldName
                newField.type = fieldType
                addFields.append(newField)
            parameters[3].schema.additionalFields = addFields

        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        import netCDF4 as NET

        #### Assure Cube is Valid ####
        throwCubeError = False
        if parameters[0].value:
            try:
                cubeStr = parameters[0].value.value
                fileExists = OS.path.isfile(cubeStr)
                dataset = NET.Dataset(cubeStr, keepweakref = True)
                cubeBool = isCube(dataset)
                panelBool = isPanel(dataset)

                if not cubeBool and fileExists:
                    #### Not a Cube ####
                    throwCubeError = True

                if panelBool and not isPro():
                    #### Panel Only For Pro ####
                    parameters[0].setIDMessage("ERROR", 110119)

                if paramChanged(parameters[1]):
                    if parameters[1].value not in dataset.variables:
                        parameters[1].setIDMessage("ERROR", 110024, parameters[1].value)

                dataset.close()

            except:
                #### Not a Cube ####
                if not parameters[0].isInputValueDerived():
                    throwCubeError = True

        if throwCubeError:
            cubeDir, cubeFile = OS.path.split(parameters[0].value.value)
            parameters[0].setIDMessage("ERROR", 110003, cubeFile)

        inputDisplay = getTextParameter(parameters, 2)
        outputFC = parameters[3].valueAsText
        if inputDisplay == "TIME_SERIES_OUTLIER_RESULTS":
            if isShapeFile(outputFC):
                #### Throw Warning for Time Series Outlier Chart in Shapefile ####
                parameters[2].setIDMessage("WARNING", 110369)

        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        import arcpy as ARCPY
        import numpy as NUM
        import SSUtilities as UTILS
        import SSCube as CUBE
        import SSPanel as PANEL
        import sys as SYS

        inputCube = parameters[0].valueAsText
        inputVar = getTextParameter(parameters, 1)
        inputDisplay = getTextParameter(parameters, 2)
        outputFC = parameters[3].valueAsText
        needChartOutput = True

        #### Boolean for Panel Or Not ####
        isPanelCube = isPanelFromFile(inputCube) 
        if not isPanelCube:
            cube = CUBE.SSCube(inputCube)
        else:
            cube = PANEL.SSPanel(inputCube)

        isStartTime = cube.isStartTime
        isShapeFileBool = isShapeFile(outputFC)
        displayOutlierChart = False

        #### Create Output Candidate Fields ####
        if inputDisplay == "ESTIMATED_BINS":
            candidateFields = cube.estimatedBins3D(outputFC, inputVar)
            renderLayerFile = "EstimatedBins_3D"
            chartField = "ESTIMATED"
            chartFieldTitle = "Estimated Bins"

        elif inputDisplay == "HOT_AND_COLD_SPOT_RESULTS":
            candidateFields = cube.hotSpotResults3D(outputFC, inputVar)
            renderLayerFile = 'HotAndColdSpotResults_3D'
            chartField = "HS_ZSCORE"
            chartFieldTitle = "z-score"

        elif inputDisplay == "LOCAL_OUTLIER_RESULTS":
            candidateFields = cube.localOutlierResults3D(outputFC, inputVar)
            renderLayerFile = 'ClusterOutlier_3D'
            chartField = "VALUE"
            chartFieldTitle = "Value"

        elif inputDisplay == "TEMPORAL_AGGREGATION_COUNT":
            candidateFields = cube.temporalAggregation3D(outputFC)
            renderLayerFile = "Value_3D"
            chartField = "VALUE"
            chartFieldTitle = "Temporal Aggregation Count"

        elif inputDisplay == "FORECAST_RESULTS":
            candidateFields = cube.forecastResults3D(outputFC, inputVar)
            renderLayerFile = "Value_3D"
            chartField = "VALUE"
            chartFieldTitle = "Forecast Results"

        elif inputDisplay == "TIME_SERIES_OUTLIER_RESULTS":
            candidateFields = cube.outlierResults3D(outputFC, inputVar)
            if isShapeFileBool:
                renderLayerFile = "TS_Outliers_3D_shp"
            else:
                renderLayerFile = "TS_Outliers_3D"
                #### Only Show Chart If At Least One Outlier ####
                for candField in candidateFields:
                    if candField.name == "OUTLIER":
                        displayOutlierChart = candField.data.sum() > 0
            chartField = "VALUE"
            chartFieldTitle = "Forecast Results"

        elif inputDisplay == "TIME_SERIES_CHANGE_POINTS":
            candidateFields = cube.changePointResults3D(outputFC, inputVar)
            renderLayerFile = "ChangePoint_3D"
            needChartOutput = False

        else:
            candidateFields = cube.varOutputFields3D(outputFC, inputVar)
            renderLayerFile = "Value_3D"
            chartField = "VALUE"
            chartFieldTitle = "Value"

        #### Write Output Features and Close Cube ####
        if not isPanelCube:
            cube.exportFeatures3D(outputFC, candidateFields)
        else:
            cube.exportFeatures3D(outputFC, candidateFields, 
                                  useCentroids = True)

        cube.close()

        #### Render Results ####
        try:
            #### Warning is Not in Globe or Pro ####
            arcExe = OS.path.basename(SYS.executable)
            isDesktop = OS.path.splitext(arcExe)[0].upper() == "ARCMAP"
            if isDesktop:
                ARCPY.AddIDMessage("WARNING", 110065)

            if isPro():
                fileExt = '.lyrx'
            else:
                fileExt = '.lyr'
            if not isPanelCube:
                if cube.isHexagon:
                    renderLayerFile = renderLayerFile.replace("_3D", "_Hex_3D")
            renderLayerFile += fileExt
            fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
            parameters[3].symbology = fullRLF
        except:
            ARCPY.AddIDMessage("WARNING", 973)

        #### Set Chart Output ####
        if isPro() and needChartOutput:
            chartList = []

            chart = ARCPY.Chart(ARCPY.GetIDMessage(84776))
            chart.type = "line"
            chart.title = ARCPY.GetIDMessage(84776)

            #### Assign Y Axis Field ####
            chart.yAxis.field = chartField
            chart.yAxis.title = chartFieldTitle

            #### Assign X Axis Field ####
            if cube.isStartTime:
                chart.xAxis.field = "START_DATE"
                chart.xAxis.title = ARCPY.GetIDMessage(84777)
                aggType = "equalIntervalsFromStartTime"
            else:
                chart.xAxis.field = "END_DATE"
                chart.xAxis.title = ARCPY.GetIDMessage(84778)
                aggType = "equalIntervalsFromEndTime"

            #chart.xAxis.sort = chart.xAxis.field

            #### Set Time Agg Properties ####
            chart.line.aggregation = "MEAN"
            chart.line.timeIntervalUnits = cube.timeUnit
            chart.line.timeIntervalSize = float(cube.timeSize)
            chart.line.timeAggregationType = aggType
            chartList.append(chart)

            if inputDisplay == "LOCAL_OUTLIER_RESULTS":
                #### Moran Scatterplot ####
                if "_LAG" in candidateFields[-1].name:
                    scatter = ARCPY.Chart(ARCPY.GetIDMessage(84792))
                    scatter.type = "scatter"
                    scatter.title = ARCPY.GetIDMessage(84792)
                    scatter.scatter.showTrendLine = True

                    #### Assign Y Axis Field ####
                    scatter.xAxis.field = 'CO_ZTRAN'
                    scatter.xAxis.title = ARCPY.GetIDMessage(84793).format('CO_ZTRAN')
                    scatter.xAxis.guides.new("x", 0, None, "")

                    #### Assign X Axis Field ####
                    scatter.yAxis.field = 'CO_LAG'
                    scatter.yAxis.title = ARCPY.GetIDMessage(84794)
                    scatter.yAxis.guides.new("y", 0, None, "")

                    #### Set Min/Max Axes ####
                    zData = candidateFields[-2].data 
                    minX, maxX = UTILS.getSquareStdScatterAxes(NUM.nanmin(zData), 
                                                               NUM.nanmax(zData))

                    scatter.xAxis.minimum = minX
                    scatter.yAxis.minimum = minX
                    scatter.xAxis.maximum = maxX
                    scatter.yAxis.maximum = maxX

                    chartList.append(scatter)

            if inputDisplay == "TIME_SERIES_OUTLIER_RESULTS":
                if isShapeFileBool:
                    #### Throw Warning for Time Series Outlier Chart in Shapefile ####
                    ARCPY.AddIDMessage("WARNING", 110369)
                else:

                    if displayOutlierChart:
                        bar = ARCPY.Chart(ARCPY.GetIDMessage(220084))
                        bar.type = "bar"
                        bar.title = ARCPY.GetIDMessage(220084)
                        #bar.color = ["#762A83", "#000000", "#1B7837"]

                        #### Assign X/Y Axis ####
                        if isStartTime:
                            bar.xAxis.field = "START_DATE"
                        else:
                            bar.xAxis.field = "END_DATE"
                        bar.xAxis.title = ARCPY.GetIDMessage(220085)

                        bar.yAxis.field = "TSO_BIN"
                        bar.yAxis.title = ARCPY.GetIDMessage(220086)
                        bar.yAxis.guides.new('no_outlier', 0)
                        bar.bar.aggregation= "SUM"
                        bar.bar.multiSeriesDisplay = "stacked"
                        bar.bar.splitCategory = "TSO_TYPE"
                        chartList.append(bar)

            parameters[3].charts = chartList

        return

class FillMissingValues(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Fill Missing Values"
        self.description = "Replaces missing data (nulls) with estimated values."
        self.category = "Utilities"
        self.canRunInBackground = False
        self.helpContext = 50010003

        self.pointConcepts =['FIXED_DISTANCE', 'K_NEAREST_NEIGHBORS', 'GET_SPATIAL_WEIGHTS_FROM_FILE']
        self.allConcepts =['FIXED_DISTANCE', 'K_NEAREST_NEIGHBORS',
                          'CONTIGUITY_EDGES_ONLY', 'CONTIGUITY_EDGES_CORNERS',
                          'GET_SPATIAL_WEIGHTS_FROM_FILE']


        self.pointConceptsWithoutSWM =['FIXED_DISTANCE', 'K_NEAREST_NEIGHBORS']
        self.allConceptsWithoutSWM =['FIXED_DISTANCE', 'K_NEAREST_NEIGHBORS',
                          'CONTIGUITY_EDGES_ONLY', 'CONTIGUITY_EDGES_CORNERS']

        self.listWithoutTrend = ['MINIMUM', 'AVERAGE','MEDIAN', 'MAXIMUM']
        self.listWithTrend =  ['MINIMUM', 'AVERAGE','MEDIAN', 'MAXIMUM', 'TEMPORAL_TREND']
        self.listOnlyTrend = ['TEMPORAL_TREND']

    def getParameterInfo(self):
        """Define parameter definitions"""

        param0 = ARCPY.Parameter(displayName="Input Table",
                                 name="in_features",
                                 datatype="GPTableView",
                                 parameterType="Required",
                                 direction="Input")
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Output Table",
                                 name="out_features",
                                 datatype=['DEFeatureClass','DETable'],
                                 parameterType="Optional",
                                 direction="Output")
        param1.displayOrder = 2

        param9 = ARCPY.Parameter(displayName="Location ID",
                                 name="location_id",
                                 datatype='Field',
                                 parameterType="Optional",
                                 direction="Input")
        param9.parameterDependencies = [param0.name]
        param9.filter.list= ["Long", "Short", "Integer", "String", "BigInteger"]
        param9.displayOrder = 3

        param10 = ARCPY.Parameter(displayName="Related Table",
                                  name="related_table",
                                  datatype='GPTableView',
                                  parameterType="Optional",
                                  direction="Input")
        param10.displayOrder = 4

        param11 = ARCPY.Parameter(displayName="Related Location ID",
                                  name="related_location_id",
                                  datatype='Field',
                                  parameterType="Optional",
                                  direction="Input")
        param11.filter.list = ["Long", "Short", "Integer", "String", "BigInteger"]
        param11.displayOrder = 5

        param2 = ARCPY.Parameter(displayName="Fields to Fill",
                                 name="fields_to_fill",
                                 datatype="Field",
                                 parameterType="Required",
                                 direction="Input",
                                 multiValue = True)

        param2.filter.list = ["Double", "Long", "Integer", "Single", "Short", "BigInteger"]
        param2.displayOrder = 7

        param3 = ARCPY.Parameter(displayName="Fill Method",
                                 name="fill_method",
                                 datatype='GPString',
                                 parameterType="Required",
                                 direction="Input")
        param3.filter.type = "ValueList"
        param3.filter.list = self.listWithTrend
        param3.displayOrder = 8

        param4 = ARCPY.Parameter(displayName="Conceptualization of Spatial Relationships",
                                 name="conceptualization_of_spatial_relationships",
                                 datatype='GPString',
                                 parameterType="Optional",
                                 direction="Input")
        param4.filter.type = "ValueList"
        param4.filter.list = self.allConcepts
        param4.displayOrder = 9

        param5 = ARCPY.Parameter(displayName="Distance Band",
                                 name="distance_band",
                                 datatype='GPLinearUnit',
                                 parameterType="Optional",
                                 direction="Input")
        param5.filter.list = supportDist
        param5.displayOrder = 10

        param6 = ARCPY.Parameter(displayName="Temporal Neighborhood",
                                 name="temporal_neighborhood",
                                 datatype="GPTimeUnit",
                                 parameterType="Optional",
                                 direction="Input")
        param6.filter.list = supportTime
        param6.displayOrder = 11

        param7 = ARCPY.Parameter(displayName="Time Field",
                                 name="time_field",
                                 datatype="Field",
                                 parameterType="Optional",
                                 direction="Input")

        param7.filter.list = ["Date"]
        param7.displayOrder = 6

        param8 = ARCPY.Parameter(displayName="Number of Spatial Neighbors",
                                 name="number_of_spatial_neighbors",
                                 datatype='GPLong',
                                 parameterType="Optional",
                                 direction="Input")
        param8.displayOrder = 12

        param12 = ARCPY.Parameter(displayName="Weights Matrix File",
                                 name="weights_matrix_file",
                                 datatype='DEFile',
                                 parameterType="Optional",
                                 direction="Input")
        param12.filter.list = ['swm']
        param12.displayOrder = 13

        param13 = ARCPY.Parameter(displayName="Unique ID",
                                 name="unique_id",
                                 datatype='Field',
                                 parameterType="Optional",
                                 direction="Input")
        param13.filter.list= ["Long", "Integer", "Short", "BigInteger"]
        param13.displayOrder = 14
  
        param14 = ARCPY.Parameter(displayName="Null Value",
                                 name="null_value",
                                 datatype='GPDouble',
                                 parameterType="Optional",
                                 direction="Input")
        param14.displayOrder = 15

        param15 = ARCPY.Parameter(displayName="Output Table",
                                  name="out_table",
                                  datatype='DETable',
                                  parameterType="Optional",
                                  direction="Output")
        param15.displayOrder = 16

        param16 = ARCPY.Parameter(displayName="Append Fields to Input Table",
                                  name="append_to_input",
                                  datatype="GPBoolean",
                                  parameterType="Optional",
                                  direction="Input")
        param16.displayOrder = 1
        param16.filter.list = ['APPEND_TO_INPUT','NEW_FEATURES']
        param16.value = False

        param17 = ARCPY.Parameter(displayName="Updated Features",
                                  name="updated_features",
                                  datatype="GPTableView",
                                  parameterType="Derived",
                                  direction="Output")

        param2.parameterDependencies = [param0.name]
        param7.parameterDependencies = [param0.name]
        param13.parameterDependencies = [param0.name]
        param1.parameterDependencies = [param16.name]
        param17.parameterDependencies = [param0.name]

        params = [param0, param1, param2, param3, param4, param5, param6, param7,
                  param8, param9, param10, param11, param12, param13, param14, 
                  param15, param16, param17]

        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        inputFeatureClass = parameters[0]
        locationId = parameters[9]
        relatedTable = parameters[10]
        relatedLocationIdField = parameters[11]
        fieldToImpute = parameters[2]
        fillMethod = parameters[3]
        conceptSpatialRel = parameters[4]
        distanceBand = parameters[5]
        numNeighbors = parameters[8]
        timeField = parameters[7]
        timeWindow = parameters[6]
        uniqueIdField = parameters[13]
        SWMFile = parameters[12]
        outputTable = parameters[15]
        disableOutput = parameters[16]
        outputFeatureClass = parameters[1]
        UpdatedFeatures = parameters[17]

        enableParameters([locationId, conceptSpatialRel], [SWMFile])

        isPolygon = False
        shape = None
        isTable =  False 
        if inputFeatureClass.altered:
            wrkspc = ARCPY.env.workspace
            try:
                info = ARCPY.Describe(inputFeatureClass.value)
                name = info.nameString if hasattr(info, "nameString") else info.name
                if name[-4:] in [".shp", ".dbf"]:
                    name = name[:-4]
                dataType = info.DataType
                isTable = dataType in UTILS.dataTypeTable
                if not isTable:
                    shape = info.shapeType.upper()
            except:
                pass

            if shape  == None:
                conceptSpatialRel.filter.list = self.allConcepts
            else:
                isPolygon = shape == "POLYGON"
                if relatedTable.value :
                    if isPolygon:
                        conceptSpatialRel.filter.list = self.allConceptsWithoutSWM
                    else:
                        conceptSpatialRel.filter.list = self.pointConceptsWithoutSWM
                else:
                    if isPolygon:
                        conceptSpatialRel.filter.list = self.allConcepts
                    else:
                        conceptSpatialRel.filter.list = self.pointConcepts

        isPanel = False
        if locationId.value:
            isPanel = True
            if not isTable:
                enableParameters([relatedTable, relatedLocationIdField],[])
                if fillMethod.value == "TEMPORAL_TREND":
                    enableParameters([], [conceptSpatialRel, numNeighbors, distanceBand])
                else:
                    enableParameters([ conceptSpatialRel, numNeighbors, distanceBand],
                                     [])
            else:
                enableParameters([], [relatedTable, conceptSpatialRel, numNeighbors, distanceBand])
                
        else:
            if not isTable:
                enableParameters([conceptSpatialRel], 
                             [relatedTable, relatedLocationIdField, numNeighbors,
                              distanceBand, timeWindow])
            else:
                enableParameters([], 
                             [conceptSpatialRel, relatedTable, relatedLocationIdField, numNeighbors,
                              distanceBand, timeWindow])
                relatedTable.value = None

        if not isTable and relatedTable.value and locationId.value:
            enableParameters([relatedLocationIdField, outputTable], [uniqueIdField])
            fieldToImpute.parameterDependencies = [relatedTable.name]
            timeField.parameterDependencies = [relatedTable.name]
            relatedLocationIdField.parameterDependencies = [relatedTable.name]
            uniqueIdField.parameterDependencies = [relatedTable.name]
        else:
            fieldToImpute.parameterDependencies = [inputFeatureClass.name]
            timeField.parameterDependencies = [inputFeatureClass.name]
            uniqueIdField.parameterDependencies = [inputFeatureClass.name]
            enableParameters([uniqueIdField], [relatedLocationIdField, outputTable])

        showTimeWindow = None
        if timeField.value:
            showTimeWindow = timeWindow
        if not isTable:
            if conceptSpatialRel.value:
                enableParameters([locationId])
                fillMethod.filter.list = self.listWithTrend
                if conceptSpatialRel.value == 'FIXED_DISTANCE':
                    enableParameters([distanceBand, numNeighbors, showTimeWindow], [])
                    if isPanel:
                        enableParameters([numNeighbors, showTimeWindow], [])
                    else:
                        if numNeighbors.value:
                            enableParameters([ numNeighbors], [showTimeWindow])
                        elif timeWindow.value:
                            enableParameters([showTimeWindow], [numNeighbors])
                            numNeighbors.value = None
                        else:
                            enableParameters([numNeighbors, showTimeWindow], [])

                if conceptSpatialRel.value == 'K_NEAREST_NEIGHBORS':
                    enableParameters( [numNeighbors, showTimeWindow], [distanceBand])
                    distanceBand.value = None

                if conceptSpatialRel.value in ['CONTIGUITY_EDGES_ONLY', 'CONTIGUITY_EDGES_CORNERS']:
                    enableParameters([showTimeWindow, numNeighbors], [distanceBand ])
                    distanceBand.value = None

                if conceptSpatialRel.value =='GET_SPATIAL_WEIGHTS_FROM_FILE':
                    fillMethod.filter.list = self.listWithoutTrend
                    enableParameters([SWMFile], [relatedTable, numNeighbors, distanceBand, 
                                                 showTimeWindow, locationId, uniqueIdField])

            else:
                 enableParameters( [], [numNeighbors, distanceBand, showTimeWindow, SWMFile])
                 numNeighbors.value = None
                 distanceBand.value = None
                 SWMFile.value = None
        else:
            enableParameters([locationId], [])
            if timeField.value and locationId.value:
                fillMethod.filter.list = self.listOnlyTrend
                fillMethod.value = "TEMPORAL_TREND"
            else:
                fillMethod.filter.list = self.listWithTrend

            enableParameters( [], [numNeighbors, distanceBand, showTimeWindow, SWMFile])
            numNeighbors.value = None
            distanceBand.value = None
            SWMFile.value = None
            
        if not isTable:
            if conceptSpatialRel.value:
                if conceptSpatialRel.value =='GET_SPATIAL_WEIGHTS_FROM_FILE':
                    enableParameters([],[timeField])
                else:
                    enableParameters([timeField],[])
            else:
                enableParameters([timeField],[])
        else:
            #### Clean parameter when input is ralated table ####
            relatedTable.value  = None
            conceptSpatialRel.value  = None
            numNeighbors.value = None
            relatedLocationIdField.value  = None
            outputTable.value = None
            enableParameters([timeField],[])

        if fillMethod.value:
            if fillMethod.value == "TEMPORAL_TREND":
                enableParameters([timeField, locationId], [numNeighbors, conceptSpatialRel, SWMFile, 
                                  distanceBand, timeWindow])

        if parameters[1].value is None and parameters[0].value is not None and not disableOutput.value:
            # addExtensionOutput(parameters, 0, 1,"DimensionReduction")
            isGroup = False

            if "\\" in name:
                name = name.split("\\")[-1]
                isGroup = True

            inPath, inName = OS.path.split(inputFeatureClass.valueAsText)
            # To fix the python stand alone error
            useInputWorkspace = True
            if inPath == '' or isGroup or inPath.upper().startswith("HTTPS:"):
                current = ARCPY.mp.ArcGISProject("CURRENT").defaultGeodatabase
                useInputWorkspace = False
            else:
                current = inPath
                useInputWorkspace = True

            ext = ""
            currentUpper = current.upper()
            if  not UTILS.IsPathInGeoDatabase(currentUpper) :
                if isTable:
                    ext = ".dbf"
                else:
                    ext = ".shp"
                wrkspc = current
            name = ARCPY.ValidateTableName(name)

            outputFeatureClass.value = UTILS.checkForDuplicateOutput(name + "_FillMissingValues", wrkspc, 0, ext)

        elif parameters[1].value is not None :
            outp = parameters[1].valueAsText.upper()
            outO = parameters[1].valueAsText
            path, name  = OS.path.split(outO)
            ext = ""
            if "." in name:
                ext = name.rsplit('.',1)[1]

            if not UTILS.IsPathInGeoDatabase(outp):
                if isTable:
                    if not outp.endswith(".DBF"): 
                        if ext != "":
                            parameters[1].value = outO.replace("."+ext, ".dbf")
                        else:
                            parameters[1].value = outO +".dbf"
                if not isTable:
                    if not outp.endswith(".SHP"):
                        if ext != "":
                            parameters[1].value = outO.replace("."+ext, ".shp")
                        else:
                            parameters[1].value = outO +".shp"

        outputFeatureClass.enabled = True
        if disableOutput.value:
            #### Append to Input ####
            uniqueIdField.enabled = False
            outputFeatureClass.enabled = False
            outputFeatureClass.value = None
            outputTable.enabled = False

            #### Append to Input Function for Derived Output ####
            setOptionalAppendDerivedParam(inputFeatureClass, UpdatedFeatures)

        else:
            #### Output Features/Table ####
            uniqueIdField.enabled = True
            UpdatedFeatures.enabled = False
            UpdatedFeatures.value = None

        try:
            if disableOutput.value:
                UpdatedFeatures.parameterDependencies = [inputFeatureClass.name]
            else:
                UpdatedFeatures.parameterDependencies = None
        except:
            pass

        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""

        inputFeatureClass = parameters[0]
        outputFeatureClass= parameters[1]
        locationId = parameters[9]
        relatedTable = parameters[10]
        relatedLocationIdField = parameters[11]
        fillMethod = parameters[3]
        conceptSpatialRel = parameters[4]
        distanceBand = parameters[5]
        numNeighbors = parameters[8]
        timeField = parameters[7]
        timeWindow = parameters[6]
        nullValue = parameters[14]
        uniqueIdField = parameters[13]
        SWMFile = parameters[12]
        outputTable = parameters[15]
        fieldToImpute = parameters[2]
        disableOutput = parameters[16]

        #### Assure Not CSV ####
        if isCSV(inputFeatureClass.value):
            inputFeatureClass.setIDMessage("Error", 732, inputFeatureClass.valueAsText)

        isPolygon = False
        shape = None
        isTable =  False 
        if inputFeatureClass.altered:
            try:
                info = ARCPY.Describe(inputFeatureClass.value)
                dataType = info.DataType
                isTable = dataType in UTILS.dataTypeTable
                if not isTable:
                    shape = info.shapeType.upper()
            except:
                pass
        if shape is not None:
            if shape not in ["POLYGON", "POINT"]:
                inputFeatureClass.setIDMessage("ERROR", 557, shape)

        if isReadOnly(inputFeatureClass.value) and disableOutput.value:
            inputFeatureClass.setIDMessage("Error", 381, inputFeatureClass.valueAsText)

        if fieldToImpute.altered:
            try:
                entry = getMultiFieldParameter(parameters, 2)
                if relatedTable.altered:
                    if relatedLocationIdField.value:
                        if relatedLocationIdField.valueAsText.upper() in entry:
                            fieldToImpute.setIDMessage("ERROR", 544, relatedLocationIdField.valueAsText.upper())
                else:
                    if locationId.value:
                        if locationId.valueAsText.upper() in entry:
                            fieldToImpute.setIDMessage("ERROR", 544, locationId.valueAsText.upper())
                        if uniqueIdField.value:
                            if locationId.valueAsText.upper() == uniqueIdField.valueAsText.upper():
                                uniqueIdField.setIDMessage("ERROR", 945,
                                                          uniqueIdField.valueAsText.upper(),
                                                          locationId.displayName)
                if uniqueIdField.value:
                    if uniqueIdField.valueAsText.upper() in entry:
                        fieldToImpute.setIDMessage("ERROR", 544, uniqueIdField.valueAsText.upper())
            except:
                pass

        if not isTable and conceptSpatialRel.altered:
            if conceptSpatialRel.value == 'GET_SPATIAL_WEIGHTS_FROM_FILE':
                if SWMFile.value is None:
                    SWMFile.setIDMessage("ERROR", 530)

            if conceptSpatialRel.value == 'FIXED_DISTANCE':
                if distanceBand.value is None and  fillMethod.value != 'TEMPORAL_TREND':
                    distanceBand.setIDMessage("ERROR", 530)
            if conceptSpatialRel.value == 'K_NEAREST_NEIGHBORS':
                if numNeighbors.value is None and  fillMethod.value != 'TEMPORAL_TREND':
                    numNeighbors.setIDMessage("ERROR", 530)

        if locationId.altered:
            if not isTable and conceptSpatialRel.value != 'GET_SPATIAL_WEIGHTS_FROM_FILE':
                if timeField.value is None:
                    timeField.setIDMessage("ERROR", 530)
            if isTable and conceptSpatialRel.value == 'TEMPORAL_TREND':
                if timeField.value is None:
                    timeField.setIDMessage("ERROR", 530)

        if isTable and timeField.value and locationId.value is None:
            locationId.setIDMessage("ERROR", 530)

        if fillMethod.altered:
            if fillMethod.value == 'TEMPORAL_TREND':
                if locationId.value is None:
                    locationId.setIDMessage("ERROR", 530)
                if isTable:
                    if timeField.value is None:
                        timeField.setIDMessage("ERROR", 530)
            else:
                if not isTable and conceptSpatialRel.value is None:
                    conceptSpatialRel.setIDMessage("ERROR", 530)

        if not isTable and numNeighbors.altered:
            value = float(numNeighbors.value)
            if value <= 0:
                numNeighbors.setIDMessage("ERROR", 895)

        if not isTable and relatedTable.altered:
            if relatedTable.value and relatedLocationIdField.value is None:
                relatedLocationIdField.setIDMessage("ERROR", 530)
            if not isInGDB(relatedTable.valueAsText):
                if nullValue.value is None:
                    nullValue.setIdMessage("ERROR", 530)
            if outputTable.value is None:
                outputTable.setIdMessage("ERROR", 530)

        if outputFeatureClass.altered:
            if isShapeFile(str(outputFeatureClass.value)):
                if nullValue.value is None:
                    nullValue.setIDMessage("ERROR", 530)

        if parameters[1].value is not None :
            outp = parameters[1].valueAsText.upper()
            outO = parameters[1].valueAsText
            path, name  = OS.path.split(outO)
            ext = ""
            if "." in name:
                ext = name.rsplit('.',1)[1]

            if not UTILS.IsPathInGeoDatabase(outp):
                if isTable:
                    if not outp.endswith(".DBF"): 
                        if ext != "":
                            parameters[1].setIDMessage("ERROR", 883, outO, ext)
                        else:
                            parameters[1].setIDMessage("ERROR", 1006)
                    else:
                        if ext != "":
                            dots = name.rsplit('.',1)[0]
                            if "." in dots:
                                parameters[1].setIDMessage("ERROR", 354)

                if not isTable:
                    if not outp.endswith(".SHP"):
                        if ext != "":
                            ext = name.rsplit('.',1)[1]
                            parameters[1].setIDMessage("ERROR", 883, outO, ext)
                        else:
                            parameters[1].setIDMessage("ERROR", 20)
                    else:
                        if ext != "":
                            dots = name.rsplit('.',1)[0]
                            if "." in dots:
                                parameters[1].setIDMessage("ERROR", 354)
            else:
                if outp.endswith(".DBF") or outp.endswith(".DBF"):
                    if isTable:
                        parameters[1].setIDMessage("ERROR", 1006)
                    else:
                        parameters[1].setIDMessage("ERROR", 20)

        if outputTable.altered and not disableOutput.value:
            if not isShapeFile(outputFeatureClass.valueAsText):
                if outputFeatureClass.valueAsText == outputTable.valueAsText:
                    outputTable.setIdMessage("ERROR", 110115)
            else:
                outputFC = outputFeatureClass.valueAsText
                outputTableName = outputTable.valueAsText
                if outputTableName and len(outputFC) > 4 and len(outputTableName) > 4:
                    if outputFC[:-4] == outputTableName[:-4]:
                        outputTable.setIdMessage("ERROR", 110115)

        if parameters[10].value and parameters[11].value:
            nField = parameters[11].valueAsText
            if nField.upper() in noAllowedFields:
                 parameters[11].setIDMessage("ERROR", 544, nField)

        if parameters[9].value:
            nField = parameters[9].valueAsText
            if nField.upper() in noAllowedFields:
                 parameters[9].setIDMessage("ERROR", 544, nField)

        if parameters[2].value:
            fields = getMultiFieldParameter(parameters, 2)
            for nField in fields:
                if nField.upper() in noAllowedFields:
                     parameters[2].setIDMessage("ERROR", 544, nField)

        # Update error message
        if disableOutput.altered:
            if not disableOutput.value:
                if outputFeatureClass is None:
                    outputFeatureClass.setIdMessage("ERROR", 530)
            else:
                if relatedTable.value is not None:
                    relatedTable.setIdMessage("ERROR", 110391, relatedTable)

        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        import SSImpute as SSI
        
        SSI.execute(parameters, messages)
        return

class CreateSpaceTimeCubeMDRasterLayer(object):
    def __init__(self):
        self.label = "Create Space Time Cube From Multidimensional Raster Layer"
        self.description = "Geoprocessing tool that convert multidimensional raster in a netCDF space-time cube."
        self.canRunInBackground = False
        self.helpContext = 50000006
        self.outParm = True

    def getParameterInfo(self):
        #### Define Parameters ####
        param0 = ARCPY.Parameter(displayName="Input Multidimensional Raster Layer",
                                 name="in_md_raster",
                                 datatype="GPRasterLayer",
                                 parameterType="Required",
                                 direction="Input")
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Output Space Time Cube",
                                 name="output_cube",
                                 datatype="DEFile",
                                 parameterType="Required",
                                 direction="Output")
        param1.filter.list = ['nc']
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Fill Empty Bins Method",
                                 name="fill_empty_bins",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param2.filter.list = ["ZEROS", "SPATIAL_NEIGHBORS", "SPACE_TIME_NEIGHBORS", "TEMPORAL_TREND"]
        param2.value = "ZEROS"
        param2.displayOrder = 2

        params = [param0, param1, param2]
        return params


    def isLicensed(self):
        """Set whether tool is licensed to execute."""

        #try:
        #    if ARCPY.CheckExtension("Spatial") != "Available":
        #        t = ARCPY.CheckOutExtension("Spatial")
        #        if t != 'CheckedOut':
        #            return False
        #except:
        #    return False

        return True

    def updateParameters(self, parameters):
        if parameters[2].value not in ["ZEROS", "SPATIAL_NEIGHBORS", "SPACE_TIME_NEIGHBORS", "TEMPORAL_TREND"]:
            parameters[2].value = "ZEROS"
        pass

    def updateMessages(self, parameters):
        pass


    def execute(self, parameters, messages):
        import SSCubeObject as SSCO
        import SSPanelObject as SSPO
        import SSCube as CUBE
        import SSPanel as PANEL
        import SSCubeUtilities as CUTILS

        inputMosaic = parameters[0].valueAsText
        outputCube = parameters[1].valueAsText
        fillType = parameters[2].valueAsText

        #### Get Spatial Refefence ####
        spatialRefV =  ARCPY.env.outputCoordinateSystem

        spatialRef = None
        if spatialRefV is None:
            r = None
            try:
                r = ARCPY.Describe(parameters[0].value)
            except:
                ARCPY.AddIDMessage("ERROR", 110289)
                raise SystemExit

            if r is not None:
                if r.spatialreference is None:
                    ARCPY.AddIDMessage("ERROR", 2132)
                    raise SystemExit
                srfType = r.spatialreference.type.upper()
                #### Check Spatial Ref ###
                if srfType == "GEOGRAPHIC":
                    spatialRef = ARCPY.SpatialReference(4087)
                    ARCPY.AddIDMessage("WARNING", 110290)
        else:

            try:
                if spatialRefV.name not in ['']:
                    spatialRef = spatialRefV
            except:
                    spatialRef = ARCPY.SpatialReference()
                    spatialRef.loadFromString(spatialRefV)
                    spatialRef.name = "defined coordinated system"

            if spatialRef.type.upper() == "GEOGRAPHIC":
                ARCPY.AddIDMessage("ERROR", 1022)
                raise SystemExit

        #### Get Extent ####
        extent = ARCPY.env.extent

        #### Check Extent Value Str (MAXOF/UNION) ####
        #### Use Input Extent When extent variable is None ####
        if type(extent) == str:
            extent = None

        ssco = SSCO.SSMDRasterCubeObject(inputMosaic, explicitSpatialRef = spatialRef, extent= extent)

        #### Select First Variable ####
        variables = [ssco.allFields[0]] if  len(ssco.allFields) >= 1 else []

        if len(ssco.allFields) == 0 :
            ARCPY.AddIDMessage("ERROR",110291)
            raise SystemExit

        ssco.obtainData(fields = variables, aggregateTypes= ["MEAN"], predictionTypes = [fillType])

        #### Replace Special Characters ####
        invalidChar = "`~@#$%^&*()-+=|\,<>?/{}!'[]:;\n\r ."
        fieldNames = []
        fields = {}
        for fieldName in ssco.fieldNames:
            lstRep = []
            for c in fieldName:
                if c in invalidChar:
                    lstRep.append(c)
            if len(lstRep) > 0:
                nField = fieldName
                for c in lstRep:
                    nField = nField.replace(c,"_")
                fieldNames.append(nField)
                field = ssco.fields[fieldName]
                field.name = nField
                fields[nField] = field
            else:
                fieldNames.append(fieldName)
                fields[fieldName] = ssco.fields[fieldName]

        ssco.fieldNames = fieldNames
        ssco.fields = fields
        
        cube = None
        if ssco.isSquaredCell:
            #### Create SSCube ####
            cube = CUBE.SSCube(outputCube, cubeObj = ssco)
        else:
            cubeObj = SSPO.SSMDRasterPanelObject(ssco)
            cube = PANEL.SSPanel(outputCube, panelObj = cubeObj)

        cube.buildCubeReport(ssco.fieldNames)
        for varName in ssco.fieldNames:
            if varName != 'COUNT':
                cube.mannKendall(varName)

        #### Clean Up ####
        cube.close()


class ExponentialSmoothingForecast(object):
    """
    Exponential Smoothing Only
    METHOD:
        __init__(): Define tool name and class info
        getParameterInfo(): Define parameter definitions in tool
        isLicensed(): Set whether tool is licensed to execute
        updateParameters():Modify the values and properties of parameters
                           before internal validation is performed
        updateMessages(): Modify the messages created by internal validation
                          for each tool parameter.
        execute(): Runtime script for the tool
    """

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Exponential Smoothing Forecast"
        self.description = "Geoprocessing tool that forecasts space-time cube variables with Exponential Smoothing."
        self.category = "Time Series Forecasting"
        self.canRunInBackground = False
        self.helpContext = 50020002

    def getParameterInfo(self):
        """Define parameter definitions"""

        #### Define Parameters ####
        param0 = ARCPY.Parameter(displayName="Input Space Time Cube",
                                 name="in_cube",
                                 datatype="DEFile",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['nc']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Analysis Variable",
                                 name="analysis_variable",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param1.filter.type = "ValueList"
        param1.displayOrder = 1

        param4 = ARCPY.Parameter(displayName="Number of Time Steps to Forecast",
                                 name="number_of_time_steps_to_forecast",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param4.displayOrder = 2
        param4.value = 1

        param2 = ARCPY.Parameter(displayName="Output Features",
                                 name="output_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Required",
                                 direction="Output")
        param2.parameterDependencies = [param0.name]
        param2.schema.featureTypeRule = "AsSpecified"
        param2.schema.featureType = "Simple"
        param2.schema.geometryTypeRule = "AsSpecified"
        param2.schema.geometryType = "Polygon"
        param2.schema.fieldsRule = "None"
        param2.displayOrder = 3

        param3 = ARCPY.Parameter(displayName="Output Space Time Cube",
                                 name="output_cube",
                                 datatype="DEFile",
                                 parameterType="Optional",
                                 direction="Output")
        param3.filter.list = ['nc']
        param3.displayOrder = 4

        param5 = ARCPY.Parameter(displayName="Season Length (Number of Time Steps)",
                                 name="season_length",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param5.displayOrder = 5

        param6 = ARCPY.Parameter(displayName="Number of Time Steps to Exclude for Validation",
                                 name="number_for_validation",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param6.displayOrder = 6

        param7 = ARCPY.Parameter(displayName="Outlier Option",
                                 name="outlier_option",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param7.filter.type = "ValueList"
        param7.filter.list = ["NONE", "IDENTIFY"]
        param7.value = "NONE"
        param7.displayOrder = 7

        param8 = ARCPY.Parameter(displayName="Level of Confidence",
                                 name="level_of_confidence",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param8.filter.type = "ValueList"
        param8.filter.list = ["90%", "95%", "99%"]
        param8.value = "90%"
        param8.displayOrder = 8
        param8.enabled = False

        param9 = ARCPY.Parameter(displayName="Maximum Number of Outliers",
                                 name="maximum_number_of_outliers",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param9.displayOrder = 9
        param9.enabled = False

        #### Pack Parameters ####
        params = [param0, param1, param2, param3, param4, param5, param6, 
                  param7, param8, param9]

        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        import sys as SYS
        import netCDF4 as NET
        import SSTimeUtilities as TUTILS

        if paramChanged(parameters[0]):
            if parameters[0].value:
                try:
                    dataset = NET.Dataset(parameters[0].value.value, keepweakref = True)
                    varNames = getCoreCubeVariables(dataset, removeAnalysis = True,   
                                                    removeSTD = False)
                    parameters[1].filter.list = varNames

                    #### Range for Time Steps to Forecast ####
                    numTime = dataset.dimensions['time'].size
                    parameters[4].filter.type = "Range"
                    parameters[4].filter.list = [1, int(numTime*0.5)]

                    #### Range for Season Length ####
                    parameters[5].filter.type = "Range"
                    parameters[5].filter.list = [0, int(numTime/3.0)]

                    #### Range and Default Value for Validation Time Steps ####
                    parameters[6].filter.type = "Range"
                    parameters[6].filter.list = [0, int(numTime*0.25)]
                    if parameters[6].value is None:
                        parameters[6].value = int(numTime*0.1)

                    #### Range and Default Value for Max Outlier Time Steps ####
                    parameters[9].filter.type = "Range"
                    parameters[9].filter.list = [1, int(numTime*0.2)]
                    if parameters[9].value is None:
                        parameters[9].value = max(1, int(numTime*0.05))

                    dataset.close()
                except:
                    pass

        #### Assure At Least One Prediction ####
        if parameters[4].value:
            if parameters[4].value < 1:
                parameters[4].value = 1
        else:
            parameters[4].value = 1

        #### Auto-Fill NONE if Empty Outlier Option ####
        if parameters[7].value is None:
            parameters[7].value = "NONE"

        #### Enable/Disable Outlier Parameters ####
        if parameters[7].value != "NONE":
            parameters[8].enabled = True
            parameters[9].enabled = True
        else:
            parameters[8].enabled = False
            parameters[9].enabled = False

        #### Auto-Fill Outlier Confidence if Empty by User ####
        if parameters[8].enabled:
            outlierConfidence = getTextParameter(parameters, 8)
            if outlierConfidence is None:
                parameters[8].value = "90%"

        #### Add Output Fields ####
        paramOutFC = parameters[2]
        predTime = parameters[4].value
        varName = parameters[1].value
        if parameters[0].value and not parameters[0].hasError() and paramOutFC.value and predTime and varName:
            try:
                isShp = isShapeFile(paramOutFC.valueAsText)
                dataset = NET.Dataset(parameters[0].value.value, keepweakref=True)
                timeStr = TUTILS.getForecastTimesFromDataset(dataset, predTime)
                pointCube = isPointCube(dataset)
                dataset.close()

                outString = "FCAST_{0}"
                fieldNames = [outString.format(i + 1) for i in range(predTime)]
                fieldAlias = ["Forecast for {0} in {1}".format(varName, ts) for ts in timeStr]

                fieldNames.append("F_RMSE")
                fieldAlias.append("Forecast Root Mean Square Error")
                if parameters[6].value:
                    fieldNames.append("V_RMSE")
                    fieldAlias.append("Validation Root Mean Square Error")
                fieldTypes = ["DOUBLE"] * len(fieldNames)

                fieldNames += ["SEASON", "METHOD"]
                fieldTypes += ["LONG", "TEXT"]
                fieldAlias += ["Season Length", "Forecast Method"]

                addFields = []
                for ind, fieldName in enumerate(fieldNames):
                    newField = ARCPY.Field()
                    newField.name = fieldName
                    newField.type = fieldTypes[ind]
                    if not isShp:
                        newField.aliasName = fieldAlias[ind]
                    addFields.append(newField)

                paramOutFC.schema.additionalFields = addFields
                paramOutFC.schema.featureTypeRule = "AsSpecified"
                paramOutFC.schema.featureType = "Simple"
                paramOutFC.schema.geometryTypeRule = "AsSpecified"
                paramOutFC.schema.fieldsRule = "None"
                if pointCube:
                    paramOutFC.schema.geometryType = "Point"
                else:
                    paramOutFC.schema.geometryType = "Polygon"
            except:
                pass

        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        
        import netCDF4 as NET

        #### Assure Cube is Valid ####
        throwCubeError = False
        if parameters[0].value:
            try:
                cubeStr = parameters[0].value.value
                fileExists = OS.path.isfile(cubeStr)
                dataset = NET.Dataset(cubeStr, keepweakref = True)
                cubeBool = isCube(dataset)
                panelBool = isPanel(dataset)

                if not cubeBool and fileExists:
                    #### Not a Cube ####
                    throwCubeError = True

                if panelBool and not isPro():
                    #### Panel Only For Pro ####
                    parameters[0].setIDMessage("ERROR", 110119)

                checkIfForecastCube(dataset, parameters[0], throwError=True)

                if paramChanged(parameters[1]):
                    if parameters[1].value not in dataset.variables:
                        parameters[1].setIDMessage("ERROR", 110024, parameters[1].value)

                #### Auto-Fill when User Deletes ####
                numTime = dataset.dimensions['time'].size
                if parameters[6].value is None:
                    parameters[6].value = int(numTime*0.1)

                #### Auto-Fill Max Num Outliers ####
                if parameters[8].enabled:
                    if parameters[9].value is None:
                        parameters[9].value = max(1, int(numTime*0.05))

                dataset.close()

            except:
                #### Not a Cube ####
                if not parameters[0].isInputValueDerived():
                    throwCubeError = True

        if throwCubeError:
            cubeDir, cubeFile = OS.path.split(parameters[0].value.value)
            parameters[0].setIDMessage("ERROR", 110003, cubeFile)

        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        import arcpy as ARCPY
        import sys as SYS
        import numpy as NUM
        import SSUtilities as UTILS
        import SSCube as CUBE
        import SSPanel as PANEL
        import SSCubeUtilities as CUTILS
        import WeightsUtilities as WU

        inputCube = parameters[0].valueAsText
        inputVar = getTextParameter(parameters, 1)
        outputFC = parameters[2].valueAsText
        outputCube = getTextParameter(parameters, 3)
        addTime = getNumericParameter(parameters, 4)
        if addTime is None:
            addTime = 1
        seasonalInt = getNumericParameter(parameters, 5)
        validationSize = getNumericParameter(parameters, 6)
        outlierOption = getTextParameter(parameters, 7)
        if outlierOption == "NONE":
            outlierOption = None

        outlierConfidence = getTextParameter(parameters, 8)
        if outlierConfidence is None:
            outlierConfidence = "90%"

        outlierTestSize = getNumericParameter(parameters, 9)

        #### Initialize ####
        cube, data, analysisMask, isPanelCube = CUTILS.initializeForecastTool(inputCube, inputVar)

        #### Check for Empty/Default Validation Size ####
        validationSize = returnValidationSize(cube, validationSize = validationSize)

        #### Core Function ####
        hw = CUTILS.HoltWintersForecast(data, addTime, seasonalInt = seasonalInt, 
                                        validationSize = validationSize,
                                        outlierOption = outlierOption,
                                        outlierConfidence = outlierConfidence,
                                        outlierTestSize = outlierTestSize)
        #hw.report(cube, inputVar)

        #### Finalize ####
        if outlierOption is None:
            theme = "FORECAST_RESULTS"
        else:
            theme = "TIME_SERIES_OUTLIER_RESULTS"
        result = CUTILS.finalizeForecastTool(cube, hw, inputVar, outputFC, analysisMask,
                                             outputCube = outputCube, returnFieldsInfo = True,
                                             theme = theme)

        #### Create and Apply Symbology to the FeatureClass ####
        data = hw.result[-1]
        shapeType = "Point"
        if cube.isPolygon:
            shapeType = "Polygon"

        fieldName = "FCAST_{0}".format(addTime)
        fieldAlias = fieldName
        for f in result["fieldsInfo"]:
            if f["name"] == fieldName:
                fieldAlias = f["alias"]
                break

        symbolStr = CUTILS.generateForecatingSymbology(data, fieldName, fieldAlias, shapeType)
        if symbolStr is not None:
            ARCPY.gp.SetParameterSymbology(2, symbolStr)

    def postExecute(self, parameters):
        #### Update Pop-up titles ####
        UTILS.postExecuteUpdatePopupTitle(parameters, 2, -1)


class ForestBasedForecast(object):
    """
    Forest-Based Forecast
    METHOD:
        __init__(): Define tool name and class info
        getParameterInfo(): Define parameter definitions in tool
        isLicensed(): Set whether tool is licensed to execute
        updateParameters():Modify the values and properties of parameters
                           before internal validation is performed
        updateMessages(): Modify the messages created by internal validation
                          for each tool parameter.
        execute(): Runtime script for the tool
    """

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Forest-based Forecast"
        self.description = "Geoprocessing tool that forecasts space-time cube variables."
        self.category = "Time Series Forecasting"
        self.canRunInBackground = False
        self.helpContext = 50020003

    def getParameterInfo(self):
        """Define parameter definitions"""

        #### Define Parameters ####
        param0 = ARCPY.Parameter(displayName="Input Space Time Cube",
                                 name="in_cube",
                                 datatype="DEFile",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['nc']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Analysis Variable",
                                 name="analysis_variable",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param1.filter.type = "ValueList"
        param1.displayOrder = 1

        param4 = ARCPY.Parameter(displayName="Number of Time Steps to Forecast",
                                 name="number_of_time_steps_to_forecast",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param4.displayOrder = 2
        param4.value = 1

        param2 = ARCPY.Parameter(displayName="Output Features",
                                 name="output_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Required",
                                 direction="Output")
        param2.parameterDependencies = [param0.name]
        param2.displayOrder = 3

        param3 = ARCPY.Parameter(displayName="Output Space Time Cube",
                                 name="output_cube",
                                 datatype="DEFile",
                                 parameterType="Optional",
                                 direction="Output")
        param3.filter.list = ['nc']
        param3.displayOrder = 4

        param5 = ARCPY.Parameter(displayName="Time Step Window",
                                  name="time_window",
                                  datatype="GPLong",
                                  parameterType="Optional",
                                  direction="Input")
        param5.displayOrder = 5

        param6 = ARCPY.Parameter(displayName="Number of Time Steps to Exclude for Validation",
                                 name="number_for_validation",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        #param6.category = "Validation Options"
        param6.displayOrder = 6


        param7 = ARCPY.Parameter(displayName="Number of Trees",
                                  name="number_of_trees",
                                  datatype="GPLong",
                                  parameterType="Optional",
                                  direction="Input")

        param7.category = "Advanced Forest Options"
        param7.filter.type = "Range"
        param7.filter.list = [1, 1000]
        param7.value = 100
        param7.displayOrder = 12

        param8 = ARCPY.Parameter(displayName="Minimum Leaf Size",
                                  name="minimum_leaf_size",
                                  datatype="GPLong",
                                  parameterType="Optional",
                                  direction="Input")
        param8.category = "Advanced Forest Options"
        param8.filter.type = "Range"
        param8.filter.list = [1, 10000000]
        param8.displayOrder = 13

        param9 = ARCPY.Parameter(displayName="Maximum Tree Depth",
                                  name="maximum_depth",
                                  datatype="GPLong",
                                  parameterType="Optional",
                                  direction="Input")
        param9.category = "Advanced Forest Options"
        param9.filter.type = "Range"
        param9.filter.list = [1, 100000000]
        param9.displayOrder = 14

        param10 = ARCPY.Parameter(displayName="Percentage of Training Available per Tree (%)",
                                  name="sample_size",
                                  datatype="GPLong",
                                  parameterType="Optional",
                                  direction="Input")
        param10.filter.type = "Range"
        param10.filter.list = [1, 100]
        param10.value = 100
        param10.category = "Advanced Forest Options"
        param10.displayOrder = 15


        param11 = ARCPY.Parameter(displayName="Forecast Approach",
                                  name="forecast_approach",
                                  datatype="GPString",
                                  parameterType="Optional",
                                  direction="Input")
        param11.filter.type = "ValueList"
        param11.filter.list = ['VALUE', 'VALUE_DETREND', 'RESIDUAL', 'RESIDUAL_DETREND']
        param11.value = "VALUE_DETREND"
        param11.category = "Advanced Forest Options"
        param11.displayOrder = 10

        param12 = ARCPY.Parameter(displayName="Outlier Option",
                                 name="outlier_option",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param12.filter.type = "ValueList"
        param12.filter.list = ["NONE", "IDENTIFY"]
        param12.value = "NONE"
        param12.displayOrder = 11

        param13 = ARCPY.Parameter(displayName="Level of Confidence",
                                 name="level_of_confidence",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param13.filter.type = "ValueList"
        param13.filter.list = ["90%", "95%", "99%"]
        param13.value = "90%"
        param13.displayOrder = 12
        param13.enabled = False

        param14 = ARCPY.Parameter(displayName="Maximum Number of Outliers",
                                 name="maximum_number_of_outliers",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param14.displayOrder = 13
        param14.enabled = False

        param15 = ARCPY.Parameter(displayName="Other Variables",
                                 name="other_variables",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input",
                                 multiValue = True)
        param15.controlCLSID = "{38C34610-C7F7-11D5-A693-0008C711C8C1}"
        param15.filter.type = "ValueList"
        param15.displayOrder = 7

        param16 = ARCPY.Parameter(displayName="Importance Threshold (%)",
                                  name="importance_threshold",
                                  datatype="GPLong",
                                  parameterType="Optional",
                                  direction="Input")
        param16.filter.type = "Range"
        param16.filter.list = [1, 100]
        param16.value = 10
        param16.displayOrder = 18
        param16.enabled = False
        
        param17 = ARCPY.Parameter(displayName="Output Importance Table",
                            name = "output_importance_table",
                            datatype = "DETable",
                            parameterType = "Optional",
                            direction = "Output")
        param17.displayOrder = 19
        param17.enabled = False
        
        param18 = ARCPY.Parameter(displayName="Model Scale",
                                 name="model_scale",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param18.filter.type = "ValueList"
        param18.filter.list = ["INDIVIDUAL_LOCATION", "ENTIRE_CUBE","TIME_SERIES_CLUSTER"]
        param18.value = "INDIVIDUAL_LOCATION"
        param18.displayOrder = 8

        param19 = ARCPY.Parameter(displayName="Cluster Variable",
                                         name="cluster_variable",
                                         datatype="GPString",
                                         parameterType="Optional",
                                         direction="Input")
        param19.filter.type = "ValueList"
        param19.displayOrder = 9
        param19.enabled = False

        #### Pack Parameters ####
        params = [param0, param1, param2, param3, param4, param5, param6, param7, 
                  param8, param9, param10, param11, param12, param13, param14, 
                  param15, param16, param17, param18, param19]

        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def variablesWithClusters(self, dataset, varNames):
        listVariablesWithClusters = []
        for variable in varNames:
            varClust = "TSCLUST_{0}_CLUSTER".format(variable)

            for varName in dataset.variables:
                if varName == varClust:
                   listVariablesWithClusters.append(variable)
        return listVariablesWithClusters

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        import sys as SYS
        import netCDF4 as NET
        import SSTimeUtilities as TUTILS
        varNames = None
        if parameters[0].value:
            try:
                dataset = NET.Dataset(parameters[0].value.value, keepweakref = True)
                varNames = getCoreCubeVariables(dataset, removeAnalysis = True,   
                                                removeSTD = False)
                parameters[1].filter.list = varNames
                parameters[15].filter.list = varNames
                #### Range for Time Steps to Forecast ####
                numTime = dataset.dimensions['time'].size
                parameters[4].filter.type = "Range"
                parameters[4].filter.list = [1, int(numTime*0.5)]

                #### Range for Season Length ####
                parameters[5].filter.type = "Range"
                parameters[5].filter.list = [1, int(numTime/3.0)]

                #### Range and Default Value for Validation Time Steps ####
                parameters[6].filter.type = "Range"
                parameters[6].filter.list = [0, int(numTime*0.25)]
                if parameters[6].value is None:
                    parameters[6].value = int(numTime*0.1)

                #### Range and Default Value for Max Outlier Time Steps ####
                parameters[14].filter.type = "Range"
                parameters[14].filter.list = [1, int(numTime*0.2)]
                if parameters[14].value is None:
                    parameters[14].value = max(1, int(numTime*0.05))

                parameters[19].filter.list = self.variablesWithClusters(dataset,varNames)
  
                dataset.close()
            except:
                pass

        if parameters[18].value is None:
            parameters[18].value = "INDIVIDUAL_LOCATION"

        if len(parameters[19].filter.list):
            parameters[18].filter.list = ["INDIVIDUAL_LOCATION", "ENTIRE_CUBE","TIME_SERIES_CLUSTER"]
        else:
            parameters[18].filter.list = ["INDIVIDUAL_LOCATION", "ENTIRE_CUBE"]
            if parameters[18].value  == "TIME_SERIES_CLUSTER":
                parameters[18].value = "INDIVIDUAL_LOCATION"

        if len(parameters[19].filter.list) and parameters[18].valueAsText == "TIME_SERIES_CLUSTER":
            parameters[19].enabled = True
        else:
            parameters[19].enabled = False
            parameters[19].value = None
        

        if parameters[1].valueAsText:
            listVars = parameters[15].filter.list
            if listVars is not None:
                parameters[15].filter.list = [ e for e in listVars if e != parameters[1].valueAsText]
            if varNames is not None:
                parameters[15].filter.list = [ e for e in varNames if e != parameters[1].valueAsText]

        #### Assure At Least One Prediction ####
        if parameters[4].value:
            if parameters[4].value < 1:
                parameters[4].value = 1
        else:
            parameters[4].value = 1

        #### Auto-Fill NONE if Empty Outlier Option ####
        if parameters[12].value is None:
            parameters[12].value = "NONE"

        if parameters[16].value is None:
            parameters[16].value = 10

        #### Enable/Disable Outlier Parameters ####
        if parameters[12].value != "NONE":
            parameters[13].enabled = True
            parameters[14].enabled = True
        else:
            parameters[13].enabled = False
            parameters[14].enabled = False

        #### Auto-Fill Outlier Confidence if Empty by User ####
        if parameters[13].enabled:
            outlierConfidence = getTextParameter(parameters, 13)
            if outlierConfidence is None:
                parameters[13].value = "90%"

        if parameters[18].value is None:
            parameters[18].value == "INDIVIDUAL_LOCATION"

        if parameters[11].value is None:
            if parameters[18].value == "INDIVIDUAL_LOCATION":
                parameters[11].value = "VALUE_DETREND"
            else:
                parameters[11].value = "VALUE"

        if parameters[7].value is None:
            parameters[7].value = 100

        if parameters[10].value is None:
            parameters[10].value = 100

        if parameters[15].value is not None:
            if parameters[16].value == 0:
                parameters[16].value = 10

        addExtensionTable(parameters, 17)

        if parameters[15].value is None:
            parameters[11].filter.list = ['VALUE', 'VALUE_DETREND', 'RESIDUAL', 'RESIDUAL_DETREND']
            parameters[16].enabled = False
            parameters[17].enabled = False
        else:
            parameters[11].filter.list = ['VALUE']
            parameters[11].value = "VALUE"
            parameters[16].enabled = True
            parameters[17].enabled = True

        if parameters[18].value != "INDIVIDUAL_LOCATION":
            parameters[11].filter.list = ['VALUE']
            parameters[11].value = 'VALUE'
            parameters[16].enabled = True
            parameters[17].enabled = True
 
        #### Add Output Fields ####
        paramOutFC = parameters[2]
        predTime = parameters[4].value
        varName = parameters[1].value
        if parameters[0].value and not parameters[0].hasError() and paramOutFC.value and predTime and varName:
            try:
                isShp = isShapeFile(paramOutFC.valueAsText)
                dataset = NET.Dataset(parameters[0].value.value, keepweakref=True)
                timeStr = TUTILS.getForecastTimesFromDataset(dataset, predTime)
                pointCube = isPointCube(dataset)
                dataset.close()
                outString = "FCAST_{0}"
                fieldNames = [outString.format(i + 1) for i in range(predTime)]
                fieldAlias = ["Forecast for {0} in {1}".format(varName, ts) for ts in timeStr]

                fieldNames.append("F_RMSE")
                fieldAlias.append("Forecast Root Mean Square Error")
                if parameters[6].value:
                    fieldNames.append("V_RMSE")
                    fieldAlias.append("Validation Root Mean Square Error")
                fieldTypes = ["DOUBLE"] * len(fieldNames)

                fieldNames += ["TIMEWINDOW", "IS_SEASON", "METHOD"]
                fieldTypes += ["LONG", "LONG", "TEXT"]
                fieldAlias += ["Time Window", "Is Seasonal", "Forecast Method"]

                addFields = []
                for ind, fieldName in enumerate(fieldNames):
                    newField = ARCPY.Field()
                    newField.name = fieldName
                    newField.type = fieldTypes[ind]
                    if not isShp:
                        newField.aliasName = fieldAlias[ind]
                    addFields.append(newField)

                paramOutFC.schema.additionalFields = addFields
                paramOutFC.schema.featureTypeRule = "AsSpecified"
                paramOutFC.schema.featureType = "Simple"
                paramOutFC.schema.geometryTypeRule = "AsSpecified"
                paramOutFC.schema.fieldsRule = "None"
                if pointCube:
                    paramOutFC.schema.geometryType = "Point"
                else:
                    paramOutFC.schema.geometryType = "Polygon"
            except:
                pass

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        
        import netCDF4 as NET
        import locale as LOCALE

        #### Assure Cube is Valid ####
        throwCubeError = False
        if parameters[0].value:
            try:
                cubeStr = parameters[0].value.value
                fileExists = OS.path.isfile(cubeStr)
                dataset = NET.Dataset(cubeStr, keepweakref = True)
                cubeBool = isCube(dataset)
                panelBool = isPanel(dataset)

                if not cubeBool and fileExists:
                    #### Not a Cube ####
                    throwCubeError = True

                if panelBool and not isPro():
                    #### Panel Only For Pro ####
                    parameters[0].setIDMessage("ERROR", 110119)

                checkIfForecastCube(dataset, parameters[0], throwError=True)

                if paramChanged(parameters[1]):
                    if parameters[1].value not in dataset.variables:
                        parameters[1].setIDMessage("ERROR", 110024, parameters[1].value)

                #### Auto-Fill when User Deletes ####
                numTime = dataset.dimensions['time'].size
                if parameters[6].value is None:
                    parameters[6].value = int(numTime*0.1)

                #### Auto-Fill Max Num Outliers ####
                if parameters[13].enabled:
                    if parameters[14].value is None:
                        parameters[14].value = max(1, int(numTime*0.05))

                dataset.close()

            except:
                #### Not a Cube ####
                if not parameters[0].isInputValueDerived():
                    throwCubeError = True

        if parameters[18].valueAsText == "TIME_SERIES_CLUSTER":
            if parameters[19].value is None:
                parameters[19].setIDMessage("ERROR", 530)

        #if parameters[19].enabled:
         #   parameters[19].setIDMessage("WARNING", 230008)

        if throwCubeError:
            cubeDir, cubeFile = OS.path.split(parameters[0].value.value)
            parameters[0].setIDMessage("ERROR", 110003, cubeFile)
        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        import arcpy as ARCPY
        import sys as SYS
        import numpy as NUM
        import SSUtilities as UTILS
        import SSCube as CUBE
        import SSPanel as PANEL
        import SSCubeUtilities as CUTILS
        import WeightsUtilities as WU

        inputCube = parameters[0].valueAsText
        inputVar = getTextParameter(parameters, 1)
        outputFC = parameters[2].valueAsText
        outputCube = getTextParameter(parameters, 3)
        addTime = getNumericParameter(parameters, 4)
        if addTime is None:
            addTime = 1
        windowSize = getNumericParameter(parameters, 5)
        validationSize = getNumericParameter(parameters, 6)

        numTrees = getNumericParameter(parameters, 7)
        minLeaf = getNumericParameter(parameters, 8)
        maxDepth = getNumericParameter(parameters, 9)
        percTrainPerTree = getNumericParameter(parameters, 10)
        implementation = parameters[11].valueAsText
        modelTypePar = parameters[18].value
        clusterVar = parameters[19].value
        
        otherVars = parameters[15].valueAsText
        modelType = ["BY_LOCATION", "UNIQUE_MODEL", "BY_CLUSTER"]
        
        useOneModel = "BY_LOCATION"

        if modelTypePar == "INDIVIDUAL_LOCATION":
            useOneModel = "BY_LOCATION"
        elif modelTypePar == "ENTIRE_CUBE":
            useOneModel = "UNIQUE_MODEL"
        elif modelTypePar == "TIME_SERIES_CLUSTER": 
            useOneModel = "BY_CLUSTER"

        percImportance = 0
        importanceTable = None
        weights = False
        recalculate = False

        percImportance = getNumericParameter(parameters, 16)
        importanceTable = parameters[17].valueAsText

        # weights = parameters[18].value
        # recalculate = parameters[19].value

        
        if parameters[18].value is None:
            useOneModel = "BY_LOCATION"

        if recalculate is None:
            recalculate = False

        if otherVars not in ["", "#", None]:
            implementation = "VALUE"
            if importanceTable not in ["", "#", None]:
                    UTILS.checkOutputPath(importanceTable, "TABLE")

        if implementation in [None, "", "#"]:
            implementation = "VALUE"

        detrend = True
        implementationType = { "VALUE"           : ("VALUE", False),
          "VALUE_DETREND"   : ("VALUE", True),
          "RESIDUAL"        : ("RESIDUAL", False),
          "RESIDUAL_DETREND": ("RESIDUAL", True) }

        implementation, detrend = implementationType[implementation]

        outlierOption = getTextParameter(parameters, 12)
        if outlierOption == "NONE":
            outlierOption = None

        outlierConfidence = getTextParameter(parameters, 13)
        if outlierConfidence is None:
            outlierConfidence = "90%"

        outlierTestSize = getNumericParameter(parameters, 14)
        otherData = None
        xy = None
        locIds = None
        listOtherVariables = None
        clustData = None
        locations = None

        if otherVars in ["", "#", None]:
            #### Initialize ####
            cube, data, analysisMask, isPanelCube = CUTILS.initializeForecastTool(inputCube, inputVar)
            if useOneModel == "BY_CLUSTER":
                varZone = "TSCLUST_{0}_CLUSTER".format(clusterVar)

                if varZone is not None:
                    clustData = cube.obtainValues(varZone)
                    clustData = clustData.ravel()

                    if not isPanelCube:
                        analysisMask = cube.obtainVariableMask(clusterVar)
                        clustData = clustData[analysisMask.ravel()]
            if not isPanelCube:
                mask = cube.obtainVariableMask(inputVar)
                maskFlat = mask.ravel()
                locations = NUM.arange(cube.sizeSlice, dtype = NUM.int32)
                locations = locations[maskFlat]
            
        else:
            listOtherVariables = otherVars.split(";")
            cube, data, analysisMask, isPanelCube, otherData, xy, locIds, clustData, locations = CUTILS.initializeMultivariateForecastTool(inputCube, inputVar, listOtherVariables, clusterZone = useOneModel, clusterVar = clusterVar)
        

        #### Check for Empty/Default Validation Size ####
        validationSize = returnValidationSize(cube, validationSize = validationSize)

        #### Set RF Params ####
        rfPara = {}
        if numTrees is not None:
            rfPara["numTrees"] = numTrees
        if minLeaf is not None:
            rfPara["leafSize"] = minLeaf
        if maxDepth is not None:
            rfPara["maxLevel"] = maxDepth
        if percTrainPerTree is not None:
            rfPara["sampleSize"] = percTrainPerTree

        #### Run Model ####
        rf = CUTILS.RandomForestForecast(data, addTime, validationSize = validationSize,
                                         outlierOption = outlierOption,
                                         outlierConfidence = outlierConfidence,
                                         outlierTestSize = outlierTestSize)

        #### Update Forest Dictionary Identifier ###
        rf.updateForestDict(parameters)

        if weights is not None:
            if  not weights:
                xy = None

        #### Main Function To Forecast ####
        rf.forecast(windowSize, detrend = detrend, forestParameters = rfPara, 
                    implementation = implementation, otherData = otherData, 
                    xy = xy,
                    percentange_importance = percImportance,
                    recalculate_model = recalculate,
                    useOneModel = useOneModel,
                    zoneData = clustData,
                    locations = locations,
                    listOtherVariables = listOtherVariables
                    )

        if importanceTable not in ["", "#", None]:
            variables = [inputVar]
            getImportance = False

            if otherData is not None :
                variables.extend(otherVars.split(";"))
                getImportance = True
                
            if otherData is None and useOneModel != "BY_LOCATION" :
                getImportance = True
            
            if getImportance:
                rf.outputImportanceTable(importanceTable, variables, locIds)
                if rf.chartImportance is not None:
                    parameters[17].charts = [rf.chartImportance]  

        #### Report ####
        #rf.report(cube, inputVar)

        #### Finalize ####
        if outlierOption is None:
            theme = "FORECAST_RESULTS"
        else:
            theme = "TIME_SERIES_OUTLIER_RESULTS"
        result = CUTILS.finalizeForecastTool(cube, rf, inputVar, outputFC, analysisMask, 
                                             outputCube = outputCube, returnFieldsInfo = True,
                                             theme = theme, listOtherVariables = listOtherVariables,
                                             clusterData = clustData)

        #### Create and Apply Symbology to the FeatureClass ####
        data = rf.rawForecast[-1]
        shapeType = "Point"
        if cube.isPolygon:
            shapeType = "Polygon"

        fieldName = "FCAST_{0}".format(addTime)
        fieldAlias = fieldName
        for f in result["fieldsInfo"]:
            if f["name"] == fieldName:
                fieldAlias = f["alias"]
                break

        symbolStr = CUTILS.generateForecatingSymbology(data, fieldName, fieldAlias, shapeType)
        if symbolStr is not None:
            ARCPY.gp.SetParameterSymbology(2, symbolStr)

    def postExecute(self, parameters):
        #### Update Pop-up titles ####
        UTILS.postExecuteUpdatePopupTitle(parameters, 2, -1)


class CurveFitForecast(object):
    """
    Simple Curve Fitting Only
    METHOD:
        __init__(): Define tool name and class info
        getParameterInfo(): Define parameter definitions in tool
        isLicensed(): Set whether tool is licensed to execute
        updateParameters():Modify the values and properties of parameters
                           before internal validation is performed
        updateMessages(): Modify the messages created by internal validation
                          for each tool parameter.
        execute(): Runtime script for the tool
    """

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Curve Fit Forecast"
        self.description = "Geoprocessing tool that forecasts space-time cube variables with Simple Curve Fitting."
        self.category = "Time Series Forecasting"
        self.canRunInBackground = False
        self.helpContext = 50020001

    def getParameterInfo(self):
        """Define parameter definitions"""

        #### Define Parameters ####
        param0 = ARCPY.Parameter(displayName="Input Space Time Cube",
                                 name="in_cube",
                                 datatype="DEFile",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['nc']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Analysis Variable",
                                 name="analysis_variable",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param1.filter.type = "ValueList"
        param1.displayOrder = 1

        param4 = ARCPY.Parameter(displayName="Number of Time Steps to Forecast",
                                 name="number_of_time_steps_to_forecast",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param4.displayOrder = 2
        param4.value = 1

        param2 = ARCPY.Parameter(displayName="Output Features",
                                 name="output_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Required",
                                 direction="Output")
        param2.parameterDependencies = [param0.name]
        param2.displayOrder = 3

        param3 = ARCPY.Parameter(displayName="Output Space Time Cube",
                                 name="output_cube",
                                 datatype="DEFile",
                                 parameterType="Optional",
                                 direction="Output")
        param3.filter.list = ['nc']
        param3.displayOrder = 4

        param5 = ARCPY.Parameter(displayName="Curve Type",
                                  name="curve_type",
                                  datatype="GPString",
                                  parameterType="Optional",
                                  direction="Input")
        param5.filter.type = "ValueList"
        param5.filter.list = ["LINEAR", "PARABOLIC", "EXPONENTIAL", "GOMPERTZ",
                              "AUTO_DETECT"]
        param5.value = "AUTO_DETECT"
        param5.displayOrder = 5

        param6 = ARCPY.Parameter(displayName="Number of Time Steps to Exclude for Validation",
                                 name="number_for_validation",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        #param6.category = "Validation Options"
        param6.displayOrder = 6

        param7 = ARCPY.Parameter(displayName="Outlier Option",
                                 name="outlier_option",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param7.filter.type = "ValueList"
        param7.filter.list = ["NONE", "IDENTIFY"]
        param7.value = "NONE"
        param7.displayOrder = 7

        param8 = ARCPY.Parameter(displayName="Level of Confidence",
                                 name="level_of_confidence",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param8.filter.type = "ValueList"
        param8.filter.list = ["90%", "95%", "99%"]
        param8.value = "90%"
        param8.displayOrder = 8
        param8.enabled = False

        param9 = ARCPY.Parameter(displayName="Maximum Number of Outliers",
                                 name="maximum_number_of_outliers",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param9.displayOrder = 9
        param9.enabled = False

        #### Pack Parameters ####
        params = [param0, param1, param2, param3, param4, param5, param6, 
                  param7, param8, param9]

        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        import sys as SYS
        import netCDF4 as NET
        import SSTimeUtilities as TUTILS

        if paramChanged(parameters[0]):
            if parameters[0].value:
                try:
                    dataset = NET.Dataset(parameters[0].value.value, keepweakref = True)
                    varNames = getCoreCubeVariables(dataset, removeAnalysis = True,   
                                                    removeSTD = False)
                    parameters[1].filter.list = varNames

                    #### Range for Time Steps to Forecast ####
                    numTime = dataset.dimensions['time'].size
                    parameters[4].filter.type = "Range"
                    parameters[4].filter.list = [1, int(numTime*0.5)]

                    #### Range and Default Value for Validation Time Steps ####
                    parameters[6].filter.type = "Range"
                    parameters[6].filter.list = [0, int(numTime*0.25)]
                    if parameters[6].value is None:
                        parameters[6].value = int(numTime*0.1)

                    #### Range and Default Value for Max Outlier Time Steps ####
                    parameters[9].filter.type = "Range"
                    parameters[9].filter.list = [1, int(numTime*0.2)]
                    if parameters[9].value is None:
                        parameters[9].value = max(1, int(numTime*0.05))

                    dataset.close()
                except:
                    pass

        #### Assure At Least One Prediction ####
        if parameters[4].value:
            if parameters[4].value < 1:
                parameters[4].value = 1
        else:
            parameters[4].value = 1

        #### Auto-Fill Curve Type ####
        curveType = getTextParameter(parameters, 5)
        if curveType is None:
            parameters[5].value = "AUTO_DETECT"

        #### Auto-Fill NONE if Empty Outlier Option ####
        if parameters[7].value is None:
            parameters[7].value = "NONE"

        #### Enable/Disable Outlier Parameters ####
        if parameters[7].value != "NONE":
            parameters[8].enabled = True
            parameters[9].enabled = True
        else:
            parameters[8].enabled = False
            parameters[9].enabled = False

        #### Auto-Fill Outlier Confidence if Empty by User ####
        if parameters[8].enabled:
            outlierConfidence = getTextParameter(parameters, 8)
            if outlierConfidence is None:
                parameters[8].value = "90%"

        #### Add Output Fields ####
        paramOutFC = parameters[2]
        predTime = parameters[4].value
        varName = parameters[1].value
        if parameters[0].value and not parameters[0].hasError() and paramOutFC.value and predTime and varName:
            try:
                isShp = isShapeFile(paramOutFC.valueAsText)
                dataset = NET.Dataset(parameters[0].value.value, keepweakref=True)
                timeStr = TUTILS.getForecastTimesFromDataset(dataset, predTime)
                pointCube = isPointCube(dataset)
                dataset.close()
                outString = "FCAST_{0}"
                fieldNames = [outString.format(i+1) for i in range(predTime)]
                fieldAlias = ["Forecast for {0} in {1}".format(varName, ts) for ts in timeStr]

                fieldNames.append("F_RMSE")
                fieldAlias.append("Forecast Root Mean Square Error")
                if parameters[6].value:
                    fieldNames.append("V_RMSE")
                    fieldAlias.append("Validation Root Mean Square Error")
                fieldTypes = ["DOUBLE"] * len(fieldNames)
                fieldNames += ["METHOD", "EQUATION"]
                fieldTypes += ["TEXT", "TEXT"]
                fieldAlias += ["Forecast Method", "Forecast Equation"]

                addFields = []
                for ind, fieldName in enumerate(fieldNames):
                    newField = ARCPY.Field()
                    newField.name = fieldName
                    newField.type = fieldTypes[ind]
                    if not isShp:
                        newField.aliasName = fieldAlias[ind]
                    addFields.append(newField)

                paramOutFC.schema.additionalFields = addFields
                paramOutFC.schema.featureTypeRule = "AsSpecified"
                paramOutFC.schema.featureType = "Simple"
                paramOutFC.schema.geometryTypeRule = "AsSpecified"
                paramOutFC.schema.fieldsRule = "None"
                if pointCube:
                    paramOutFC.schema.geometryType = "Point"
                else:
                    paramOutFC.schema.geometryType = "Polygon"
            except:
                pass

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        import netCDF4 as NET

        #### Assure Cube is Valid ####
        throwCubeError = False
        if parameters[0].value:
            try:
                cubeStr = parameters[0].value.value
                fileExists = OS.path.isfile(cubeStr)
                dataset = NET.Dataset(cubeStr, keepweakref = True)
                cubeBool = isCube(dataset)
                panelBool = isPanel(dataset)

                if not cubeBool and fileExists:
                    #### Not a Cube ####
                    throwCubeError = True

                if panelBool and not isPro():
                    #### Panel Only For Pro ####
                    parameters[0].setIDMessage("ERROR", 110119)

                checkIfForecastCube(dataset, parameters[0], throwError=True)

                if paramChanged(parameters[1]):
                    if parameters[1].value not in dataset.variables:
                        parameters[1].setIDMessage("ERROR", 110024, parameters[1].value)

                #### Auto-Fill when User Deletes ####
                numTime = dataset.dimensions['time'].size
                if parameters[6].value is None:
                    parameters[6].value = int(numTime*0.1)

                #### Auto-Fill Max Num Outliers ####
                if parameters[8].enabled:
                    if parameters[9].value is None:
                        parameters[9].value = max(1, int(numTime*0.05))

                dataset.close()

            except:
                #### Not a Cube ####
                if not parameters[0].isInputValueDerived():
                    throwCubeError = True

        if throwCubeError:
            cubeDir, cubeFile = OS.path.split(parameters[0].value.value)
            parameters[0].setIDMessage("ERROR", 110003, cubeFile)

        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        import arcpy as ARCPY
        import sys as SYS
        import numpy as NUM
        import SSUtilities as UTILS
        import SSCube as CUBE
        import SSPanel as PANEL
        import SSCubeUtilities as CUTILS
        import WeightsUtilities as WU

        inputCube = parameters[0].valueAsText
        inputVar = getTextParameter(parameters, 1)
        outputFC = parameters[2].valueAsText
        outputCube = getTextParameter(parameters, 3)
        addTime = getNumericParameter(parameters, 4)
        if addTime is None:
            addTime = 1

        fitType = getTextParameter(parameters, 5)
        if fitType is None:
            fitType = "LINEAR"

        validationSize = getNumericParameter(parameters, 6)

        outlierOption = getTextParameter(parameters, 7)
        if outlierOption == "NONE":
            outlierOption = None

        outlierConfidence = getTextParameter(parameters, 8)
        if outlierConfidence is None:
            outlierConfidence = "90%"

        outlierTestSize = getNumericParameter(parameters, 9)

        #### Initialize ####
        cube, data, analysisMask, isPanelCube = CUTILS.initializeForecastTool(inputCube, inputVar)

        #### Check for Empty/Default Validation Size ####
        validationSize = returnValidationSize(cube, validationSize = validationSize)

        #### Run Analysis and Report ####
        simpleFit = CUTILS.CurveFitForecast(data, addTime, fitType = fitType, 
                                            validationSize = validationSize,
                                            outlierOption = outlierOption,
                                            outlierConfidence = outlierConfidence,
                                            outlierTestSize = outlierTestSize)
        simpleFit.forecast()
        #simpleFit.report(cube, inputVar)

        #### Finalize ####
        if outlierOption is None:
            theme = "FORECAST_RESULTS"
        else:
            theme = "TIME_SERIES_OUTLIER_RESULTS"
        result = CUTILS.finalizeForecastTool(cube, simpleFit, inputVar, outputFC, analysisMask,
                                             outputCube = outputCube, returnFieldsInfo = True,
                                             theme = theme)

        #### Create and Apply Symbology to the FeatureClass ####
        data = simpleFit.rawForecast[-1]
        shapeType = "Point"
        if cube.isPolygon:
            shapeType = "Polygon"

        fieldName = "FCAST_{0}".format(addTime)
        fieldAlias = fieldName
        for f in result["fieldsInfo"]:
            if f["name"] == fieldName:
                fieldAlias = f["alias"]
                break

        symbolStr = CUTILS.generateForecatingSymbology(data, fieldName, fieldAlias, shapeType)
        if symbolStr is not None:
            ARCPY.gp.SetParameterSymbology(2, symbolStr)

    def postExecute(self, parameters):
        #### Update Pop-up titles ####
        UTILS.postExecuteUpdatePopupTitle(parameters, 2, -1)


class EvaluateForecastsByLocation(object):
    """
    Evaluate Forecasts by Location
    METHOD:
        __init__(): Define tool name and class info
        getParameterInfo(): Define parameter definitions in tool
        isLicensed(): Set whether tool is licensed to execute
        updateParameters():Modify the values and properties of parameters
                            before internal validation is performed
        updateMessages(): Modify the messages created by internal validation
                            for each tool parameter.
        execute(): Runtime script for the tool
    """

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Evaluate Forecasts by Location"
        self.description = "Geoprocessing tool that chooses the best forecast for each location."
        self.category = "Time Series Forecasting"
        self.canRunInBackground = False
        self.helpContext = 50020004

    def getParameterInfo(self):
        """Define parameter definitions"""

        #### Define Parameters ####
        param0 = ARCPY.Parameter(displayName="Input Forecast Space Time Cubes",
                                 name="in_cubes",
                                 datatype="DEFile",
                                 parameterType="Required",
                                 direction="Input",
                                 multiValue = True)
        param0.filter.list = ['nc']

        param1 = ARCPY.Parameter(displayName="Output Features",
                                 name="output_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Required",
                                 direction="Output")
        param1.parameterDependencies = [param0.name]

        param2 = ARCPY.Parameter(displayName="Output Space Time Cube",
                                 name="output_cube",
                                 datatype="DEFile",
                                 parameterType="Optional",
                                 direction="Output")
        param2.filter.list = ['nc']

        param3 = ARCPY.Parameter(displayName="Evaluate Using Validation Results",
                                  name="evaluate_using_validation_results",
                                  datatype="GPBoolean",
                                  parameterType="Optional",
                                  direction="Input")
        param3.value = True
        param3.filter.list = ['USE_VALIDATION', 
                              'NO_VALIDATION']


        #### Pack Parameters ####
        params = [param0, param1, param2, param3]

        return params

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        import netCDF4 as NET
        import SSTimeUtilities as TUTILS
        import numpy as NUM

        paramOutFC = parameters[1]
        #### Add Output Fields ####
        if parameters[0].value and not parameters[0].hasError() and paramOutFC.value:
            useValidation = parameters[3].value
            cubeStrings = [s.replace("'", "") for s in parameters[0].valueAsText.split(";")]
            numInCubes = len(cubeStrings)
            try:
                cubeStr = cubeStrings[0]
                dataset = NET.Dataset(cubeStr, keepweakref=True)

                numTime = dataset.variables['time'].size
                beginForecast = int(dataset.begin_forecast_bin)
                numPred = numTime - beginForecast
                #### Get the variable name ####
                varName = None
                for v in dataset.variables:
                    if v.endswith("_FIT"):
                        varName = v.split("FORECAST_")[-1].split("_FIT")[0]
                        break

                #### Prepare Time String####
                start = NUM.array(dataset.first_start_time, dtype='datetime64[s]')
                timeValues = NUM.array(dataset.variables['time'][:], dtype='timedelta64[s]')
                timeBreaks = (start + timeValues).tolist()
                timeBreaks.append(dataset.lastEndTime)
                timeStr = []
                for predTime in range(beginForecast, numTime):
                    timeStr.append(TUTILS.dateTime2String(timeBreaks[predTime]))
                pointCube = isPointCube(dataset)
                dataset.close()

                #### Find the Cube with Shortest Forecast Time Steps####
                for cubeStr in cubeStrings[1:]:
                    dataset = NET.Dataset(cubeStr, keepweakref=True)
                    numTime = dataset.variables['time'].size
                    beginForecast = int(dataset.begin_forecast_bin)
                    numPred = min(numTime - beginForecast, numPred)
                    dataset.close()

                outString = "FCAST_{0}"
                fieldNames = [outString.format(i + 1) for i in range(numPred)]
                fieldAlias = ["Forecast for {0} in {1}".format(varName, ts) for ts in timeStr]
                fieldNames.append("RMSE")
                fieldAlias.append("Best Forecast Root Mean Square Error")
                if useValidation:
                    fieldNames.append("VALID_RMSE")
                    fieldAlias.append("Best Validation Root Mean Square Error")
                fieldTypes = ["DOUBLE"] * len(fieldNames)

                fieldNames += ["SEASON", "TIMEWINDOW", "IS_SEASON", "METHOD"]
                fieldTypes += ["LONG", "LONG", "LONG", "TEXT"]
                fieldAlias += ["Season Length", "Time Window", "Is Seasonal", "Forecast Method"]

                outString = "RMSE_{0}"
                aliasTemplate = "{0} Forecast RMSE"
                if useValidation:
                    outString = "V_RMSE_{0}"
                    aliasTemplate = "{0} Validation RMSE"
                fieldNames += [outString.format(i + 1) for i in range(numInCubes)]
                fieldTypes += ["DOUBLE"] * numInCubes
                for cubePath in cubeStrings:
                    basename = OS.path.basename(cubePath)
                    filename = OS.path.splitext(basename)[0]
                    fieldAlias.append(aliasTemplate.format(filename))

                isShp = isShapeFile(paramOutFC.valueAsText)
                addFields = []
                for ind, fieldName in enumerate(fieldNames):
                    newField = ARCPY.Field()
                    newField.name = fieldName
                    newField.type = fieldTypes[ind]
                    if not isShp:
                        newField.aliasName = fieldAlias[ind]
                    addFields.append(newField)

                paramOutFC.schema.additionalFields = addFields
                paramOutFC.schema.featureTypeRule = "AsSpecified"
                paramOutFC.schema.featureType = "Simple"
                paramOutFC.schema.geometryTypeRule = "AsSpecified"
                paramOutFC.schema.fieldsRule = "None"
                if pointCube:
                    paramOutFC.schema.geometryType = "Point"
                else:
                    paramOutFC.schema.geometryType = "Polygon"

            except:
                pass

        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        
        import netCDF4 as NET
        import SSPanel as PANEL
        import SSCube as CUBE

        numTime0 = None
        numLocation0 = None
        numPred0 = None
        cubeTypeIsPanel = None
        varName0 = None
        startTime0 = None
        timeSize0 = None
        inputCubeFiles = set()

        #### Assure Cube is Valid ####
        useValidation = parameters[3].value
        validataionSteps = []

        if parameters[0].value:
            cubeStrings = [s.replace("'", "") for s in parameters[0].valueAsText.split(";")]
            if len(cubeStrings) > 1:
                ### if each one does not exist -> derived ###
                derivedValues = True
                for ind, cubeStr in enumerate(cubeStrings):
                    try:
                        if OS.path.isfile(cubeStr):
                            derivedValues = False
                    except:
                        pass
                for ind, cubeStr in enumerate(cubeStrings):
                    if derivedValues:
                        break
                    try:
                        fileExists = OS.path.isfile(cubeStr)
                        
                        dataset = NET.Dataset(cubeStr, keepweakref = True)

                        #### Check for Subset ####
                        if hasattr(dataset, 'subsetType'):
                            parameters[0].setIDMessage("ERROR", 110488, cubeStr)

                        cubeBool = isCube(dataset)
                        if cubeStr not in inputCubeFiles:
                            inputCubeFiles.add(cubeStr)
                        else:
                            #### Duplicate Forecast Cubes ####
                            parameters[0].setIDMessage("ERROR", 110328, cubeStr)
                            return

                        if not cubeBool and fileExists:
                            #### Not a Cube ####
                            parameters[0].setIDMessage("ERROR", 110003, cubeStr)
                            return

                        #### Keep Track of Types ###
                        panelBool = isPanel(dataset)
                        if ind == 0:
                            cubeTypeIsPanel = panelBool
                        else:
                            if cubeTypeIsPanel != panelBool:
                                parameters[0].setIDMessage("ERROR", 110329)
                                return

                        if panelBool:
                            cube = PANEL.SSPanel(cubeStr, 'r')
                        else:
                            cube = CUBE.SSCube(cubeStr, 'r')

                        if panelBool and not isPro():
                            #### Panel Only For Pro ####
                            parameters[0].setIDMessage("ERROR", 110119)
                            return

                        #### Validate is Forecast Cube ####
                        if not hasattr(dataset, 'is_forecast') or dataset.is_forecast == "FALSE":
                            #### Must be Forecast Cube ####
                            parameters[0].setIDMessage("ERROR", 110330)
                            return

                        #### Keep track of validation steps in each cube ####
                        basename = OS.path.basename(cubeStr)
                        filename = OS.path.splitext(basename)[0]
                        validationSize = 0
                        if hasattr(dataset, 'validation_size'):
                            validationSize = int(dataset.validation_size)
                        validataionSteps.append([filename, validationSize])

                        #### Keep Track of Var Names ####
                        for i in dataset.variables:
                            if i.endswith("_FIT"):
                                if ind == 0:
                                    varName0 = i
                                else:
                                    if varName0 != i:
                                        parameters[0].setIDMessage("ERROR", 110331)
                                        return
                                break

                        #### Check num of Times, Locations, Pred, StartTime and Time Interval in each cube ####
                        numPred = cube.numTime - int(cube.dataset.begin_forecast_bin)
                        if ind == 0:
                            numTime0 = int(cube.dataset.begin_forecast_bin)
                            numLocation0 = cube.numLocations
                            numPred0 = numPred
                            startTime0 = cube.firstStartTime
                            timeSize0 = cube.timeSize
                        else:
                            if numTime0 != int(cube.dataset.begin_forecast_bin):
                                #### Number of Time Steps (Excluding Forecast) ####
                                parameters[0].setIDMessage("ERROR", 110332)
                                return

                            if numLocation0 != cube.numLocations:
                                #### Number of Locations ####
                                parameters[0].setIDMessage("ERROR", 110333)
                                return

                            if numPred0 != numPred:
                                #### Forecast Time Steps ####
                                parameters[0].setIDMessage("WARNING", 110327)

                            if startTime0 != cube.firstStartTime:
                                #### Start Time ####
                                parameters[0].setIDMessage("ERROR", 110334)
                                return

                            if timeSize0 != cube.timeSize:
                                #### Time Step Interval ####
                                parameters[0].setIDMessage("ERROR", 110335)
                                return

                        cube.close()
                        dataset.close()
                    except:
                        #### Not a Cube ####
                        if not parameters[0].isInputValueDerived():
                            parameters[0].setIDMessage("ERROR", 110003, cubeStr)
            else:
                cubeStr = cubeStrings[0]
                try:
                    fileExists = OS.path.isfile(cubeStr)
                    dataset = NET.Dataset(cubeStr, keepweakref = True)
                    #### Check for Subset ####
                    if hasattr(dataset, 'subsetType'):
                        parameters[0].setIDMessage("ERROR", 110488, cubeStr)
                    dataset.close()
                except:
                    pass

        if useValidation and len(validataionSteps) > 0:
            v0 = validataionSteps[0][1]
            for info in validataionSteps[1:]:
                if v0 != info[1]:
                    v0 = -1
                    break
            if v0 <= 0:
                #### Validation Time Steps ####
                idList = []
                for info in validataionSteps:
                    idList.append(str(info[1]))
                firstArg = ", ".join(idList[0:-1])
                parameters[0].setIDMessage("ERROR", 110337, firstArg, idList[-1])
            return

        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        import arcpy as ARCPY
        import SSCube as CUBE
        import SSPanel as PANEL
        import SSCubeUtilities as CUTILS

        inputCubes = [s.replace("'", "") for s in parameters[0].valueAsText.split(";")]
        outputFC = parameters[1].valueAsText
        outputCube = getTextParameter(parameters, 2)
        useValidation = parameters[3].value

        if len(inputCubes) < 2:
            #### More Than One Cube ####
            ARCPY.AddIDMessage("ERROR", 110336)
            raise SystemExit()

        #### Initialize ####
        cubeObjects = []
        isPanelCube = isPanelFromFile(inputCubes[0])

        for cube in inputCubes:
            isPanel = isPanelFromFile(cube)
            if isPanel is not isPanelCube:
                ARCPY.AddIDMessage("ERROR", 110329)
                raise SystemExit()

            if isPanel:
                cubeObj = PANEL.SSPanel(cube)
                if hasattr(cubeObj.dataset, 'subsetType'):
                    _, cubeName = OS.path.split(cube)
                    ARCPY.AddIDMessage("ERROR", 110488, cubeName)
                    cubeObj.close()
                    raise SystemExit()
                else:
                    cubeObjects.append(cubeObj)
            else:
                cubeObj = CUBE.SSCube(cube)
                if hasattr(cubeObj.dataset, 'subsetType'):
                    _, cubeName = OS.path.split(cube)
                    ARCPY.AddIDMessage("ERROR", 110488, cubeName)
                    cubeObj.close()
                    raise SystemExit()
                else:
                    cubeObjects.append(cubeObj)

        #### Run Analysis and Report ####
        evaluate = CUTILS.HybridForecast(cubeObjects, outputFC, useValidation=useValidation)
        cube = evaluate.cubeWithShortestPredTime
        #evaluate.report(cube)

        #### Finalize ####
        result = CUTILS.finalizeForecastTool(cube, evaluate, evaluate.varName, outputFC,
                                    evaluate.analysisMask, 
                                    outputCube = outputCube, 
                                    returnFieldsInfo = True, theme = "FORECAST_RESULTS")
        for cube in cubeObjects:
            cube.close()

        if not isShapeFile(outputFC) and not useValidation:
            evaluate.updateDummyFields()
        
        #### Create and Apply Symbology to the FeatureClass ####
        data = evaluate.rawForecast[-1]
        shapeType = "Point"
        if cube.isPolygon:
            shapeType = "Polygon"

        numPred = evaluate.addTime
        fieldName = "FCAST_{0}".format(numPred)
        fieldAlias = fieldName
        for f in result["fieldsInfo"]:
            if f["name"] == fieldName:
                fieldAlias = f["alias"]
                break
        symbolStr = CUTILS.generateForecatingSymbology(data, fieldName, fieldAlias, shapeType)
        if symbolStr is not None:
            ARCPY.gp.SetParameterSymbology(1, symbolStr)

        #### Create Bar Plot for Methods ####
        if not useValidation:
            chartTitle = ARCPY.GetIDMessage(220025)
            barChart = ARCPY.Chart(chartTitle)
            barChart.type = "bar"
            barChart.title = chartTitle
            barChart.xAxis.field = "EQUAL_MTHD"
            barChart.xAxis.title = ARCPY.GetIDMessage(220026)
            barChart.yAxis.field = ""
            barChart.yAxis.title = ARCPY.GetIDMessage(84785)
            barChart.yAxis.sort = "desc"
            barChart.bar.aggregation = "COUNT"
            charts = [barChart]
            if not isShapeFile(outputFC) and not useValidation:
                chartTitle = ARCPY.GetIDMessage(220027)
                barChartCon = ARCPY.Chart(chartTitle)
                barChartCon.type = "bar"
                barChartCon.title = chartTitle
                barChartCon.xAxis.field = "METHOD"
                barChartCon.xAxis.title = ARCPY.GetIDMessage(84978)
                barChartCon.yAxis.field = evaluate.dummyFieldNames
                barChartCon.yAxis.title = ARCPY.GetIDMessage(220028)
                barChartCon.bar.aggregation = "SUM"
                charts.append(barChartCon)

            parameters[1].charts = charts

    def postExecute(self, parameters):
        #### Update Pop-up titles ####
        UTILS.postExecuteUpdatePopupTitle(parameters, 1, -1)


class ChangePointDetection(object):
    """
    The purpose of this tool is to identify change points in the time series for each
    location in an input space time cube. The tool can detect changes in counts as 
    well as changes in the distribution, mean, variance, or slope of continuous 
    variables.
    METHOD:
        __init__(): Define tool name and class info
        getParameterInfo(): Define parameter definitions in tool
        isLicensed(): Set whether tool is licensed to execute
        updateParameters():Modify the values and properties of parameters
                           before internal validation is performed
        updateMessages(): Modify the messages created by internal validation
                          for each tool parameter.
        execute(): Runtime script for the tool
"""
    def __init__(self):
        self.label = "Change Point Detection"
        self.description = "Identifies change points in the time series for each location in an input space time cube"
        self.category = "Space Time Pattern Analysis"
        self.canRunInBackground = False
        self.helpContext = 50010004
        self.timeSteps = 1e15

    def getParameterInfo(self):
        """Define parameter definitions"""
        param0 = ARCPY.Parameter(displayName="Input Space Time Cube",
                                 name="in_cube",
                                 datatype="DEFile",
                                 parameterType="Required",
                                 direction="Input")
        param0.displayOrder = 0
        param0.filter.list = ["nc"]

        param1 = ARCPY.Parameter(displayName="Analysis Variable",
                                 name="analysis_variable",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param1.parameterDependencies = [param0.name]
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Output Features",
                                 name="output_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Required",
                                 direction="Output")
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Change Type",
                                 name="change_type",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param3.filter.list = ["MEAN", "STANDARD_DEVIATION", "SLOPE", "COUNT"]
        param3.value = "MEAN"
        param3.displayOrder = 3

        param4 = ARCPY.Parameter(displayName="Method",
                                 name="method",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param4.filter.list = ["AUTO_DETECT", "DEFINED_NUMBER"]
        param4.value = "AUTO_DETECT"
        param4.displayOrder = 4

        param5 = ARCPY.Parameter(displayName="Number of Change Points",
                                 name="num_change_points",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param5.value = 1
        param5.enabled = False
        param5.displayOrder = 5

        param6 = ARCPY.Parameter(displayName="Sensitivity",
                                 name="sensitivity",
                                 datatype="GPDouble",
                                 parameterType="Optional",
                                 direction="Input")
        param6.filter.type = "Range"
        param6.filter.list = [0, 1]
        param6.value = 0.5
        param6.enabled = True
        param6.parameterDependencies = [param0.name]
        param6.displayOrder = 6

        param7 = ARCPY.Parameter(displayName="Minimum Segment Length",
                                 name="min_seg_len",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param7.value = 1
        param7.displayOrder = 7

        params = [param0, param1, param2, param3, param4, param5, param6, param7]

        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        import netCDF4 as NET
        import SSCube as CUBE
        import numpy as NUM

        inputCube = parameters[0]
        analysisVar = parameters[1]
        outputFeatures = parameters[2]
        changeType = parameters[3]
        method = parameters[4]
        numChangePoints = parameters[5]
        sensitivity = parameters[6]
        minSegLength = parameters[7]

        if minSegLength.value is None:
            if changeType.value == "SLOPE":
                minSegLength.value = 2
            else:
                minSegLength.value = 1

        if paramChanged(inputCube):
            try:
                dataset = NET.Dataset(inputCube.value.value, keepweakref = True)
                varNames = getCoreCubeVariables(dataset, removeAnalysis = True,
                                                removeSTD = False)
                analysisVar.filter.list = varNames

                #### Range for Time Steps to Forecast ####
                timeSteps = dataset.dimensions['time'].size
                self.timeSteps = timeSteps
                if method == "AUTO_DETECT":
                    penaltyVal.enabled = True
                dataset.close()
            except:
                pass

        if method.altered:
            if method.value == "AUTO_DETECT":
                numChangePoints.value = 1
                numChangePoints.enabled = False
                sensitivity.enabled = True
            else:
                numChangePoints.enabled = True
                sensitivity.value = 0.5
                sensitivity.enabled = False

        if numChangePoints.value is None:
            numChangePoints.value = 1

        if sensitivity.value is None:
            sensitivity.value = 0.5

        if not minSegLength.altered and changeType.value == "SLOPE" and minSegLength.value is not None:
            minSegLength.value = 2

        # Reset to default if the value is deleted
        if changeType.value is None:
            changeType.value = "MEAN"
        if method.value is None:
            method.value = "AUTO_DETECT"
            numChangePoints.value = 1
            numChangePoints.enabled = False
            sensitivity.enabled = True

        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        import netCDF4 as NET
        import SSCube as CUBE
        import SSPanel as PANEL

        inputCube = parameters[0]
        outputFeatures = parameters[2]
        changeType = parameters[3]
        numChangePoints = parameters[5]
        sensitivity = parameters[6]
        minSegLength = parameters[7]

        validInput = True
        cubeBool = True

        if changeType.valueAsText == "SLOPE":
            minVal = 2
        else:
            minVal = 1

        if inputCube.value:
            try:
                cubeStr = inputCube.value.value
                fileExists = OS.path.isfile(cubeStr)
                dataset = NET.Dataset(cubeStr, keepweakref = True)
                cubeBool = isCube(dataset)
                timeSteps = dataset.dimensions['time'].size

                #### Check if it is a forecast cube ####
                if hasattr(dataset, 'is_forecast'):
                    if dataset.is_forecast.upper() == "TRUE":
                        inputCube.setIDMessage("WARNING", 110320)

                if minSegLength.value < minVal or minSegLength.value > timeSteps / 2:
                    minSegLength.setIDMessage("ERROR", 854, str(minVal), str(timeSteps // 2))

                #### Check the bounds on the number of change points ####
                tempVal = minSegLength.value
                if tempVal == 0:
                    tempVal = 1
                if numChangePoints.value <= 0 or numChangePoints.value > (timeSteps - 1) / tempVal:
                    numChangePoints.setIDMessage("ERROR", 854, '1', str((timeSteps - 1) // tempVal))

                dataset.close()
            except:
                if not inputCube.isInputValueDerived():
                    validInput = False
                    pass
        else:
            ### Check the bounds on the min segment length when no input is provided ####
            if minSegLength.value < minVal:
                minSegLength.setIDMessage("ERROR", 854, str(minVal), '1E15')

        if not cubeBool or not validInput:
            cubeDir, cubeFile = OS.path.split(inputCube.value.value)
            inputCube.setIDMessage("ERROR", 110003, cubeFile)

        if not validInput or inputCube.value is None:
            if numChangePoints.value <= 0 or numChangePoints.value >= 1e15:
                numChangePoints.setIDMessage("ERROR", 854, '1', '1E15')

        if sensitivity.value is not None and (sensitivity.value < 0 or sensitivity.value > 1):
            sensitivity.setIDMessage("ERROR", 854, '0', '1')

        if outputFeatures.value and UTILS.isShapeFile(outputFeatures.valueAsText):
            outputFeatures.setIDMessage("WARNING", 110315)

        return


    def execute(self, parameters, messages):
        """The source code of the tool"""
        import sys as SYS
        import numpy as NUM
        import SSCube as CUBE
        import SSPanel as PANEL
        import netCDF4 as NET
        import arcgisscripting as ARC
        import pandas as PD
        import SSCubeUtilities as CUTILS
        import locale as LOCALE

        inputCube = parameters[0].valueAsText
        analysisVar = parameters[1].valueAsText
        outputFeatures = parameters[2].valueAsText
        changeType = parameters[3].valueAsText
        method = parameters[4].valueAsText
        numChangePoints = parameters[5].value
        sensitivity = parameters[6].value
        minSegLength = parameters[7].value

        #### Boolean for Panel or Not ###
        isPanelCube = isPanelFromFile(inputCube)

        changeTypeDic = {"MEAN": "0", "STANDARD_DEVIATION": "1", "SLOPE": "2", "COUNT": "3"}
        changeType = changeTypeDic[changeType]

        #### Calculate Penalty Value ####
        a = 0.25
        b = 1.0

        Q = numChangePoints + 1

        if not isPanelCube:
            cube = CUBE.SSCube(inputCube, 'a')
            mask = cube.obtainVariableMask(analysisVar)
            validIds = NUM.where(mask.ravel())[0]
            var = cube.obtainValues(analysisVar)
            data = var.reshape(cube.numTime, (cube.numCols * cube.numRows))[:, validIds]
            timeSteps = cube.numTime

            if changeType == "2":
                penaltyVal = 6 ** (2 - 2 * sensitivity)
            else:
                penaltyVal = 2 * ((a * timeSteps) ** (1 - sensitivity)) * (b ** sensitivity) * NUM.log(timeSteps)

            dataCopy = data.copy()
            analysisMask = cube.getAnalysisMask(analysisVar, None)
            changePointList = ARC._ss.change_point(dataCopy, penaltyVal, changeType, method, Q, minSegLength)

            #### Data for HTML Popups ####
            fillZeros = analysisVar.endswith('_ZEROS')
            y = cube.obtainValues(analysisVar, flatten=False,
                                       fillZeros=fillZeros) * 1.0
            mask = cube.getAnalysisMask(analysisVar)
            cubeIdList = NUM.where(mask)[0]
            N = len(cubeIdList)
            rawValues = NUM.zeros((N, cube.numTime), dtype=float)
            numCols = cube.numCols
            for ind, id in enumerate(cubeIdList):
                row = id // numCols
                col = id % numCols
                rawValues[ind, :] = y[:, row, col]

            cube.addChangePointVariables(changePointList, analysisVar, analysisMask, changeType)
        else:
            cube = PANEL.SSPanel(inputCube, 'a')
            data = cube.obtainValues(analysisVar)
            timeSteps = cube.numTime

            if changeType == "2":
                penaltyVal = 6 ** (2 - 2 * sensitivity)
            else:
                penaltyVal = 2 * ((a * timeSteps) ** (1 - sensitivity)) * (b ** sensitivity) * NUM.log(timeSteps)
            changePointList = ARC._ss.change_point(data, penaltyVal, changeType, method, Q, minSegLength)
            cube.addChangePointVariables(changePointList, analysisVar, changeType)

            #### Data for HTML Popups ####
            values = cube.obtainValues(analysisVar, flatten=False)
            N = cube.numLocations
            rawValues = NUM.zeros((N, cube.numTime), dtype=float)
            for i in range(N):
                rawValues[i, :] = values.data[:, i]

        #### Check for forecast cube ####
        if hasattr(cube, "isForecast"):
            if cube.dataset.is_forecast.upper() == "TRUE":
                ARCPY.AddIDMessage("WARNING", 110320)

        #### Generate 2D Output Feature Class
        candidateFields = cube.changePointOutputFields2D(outputFeatures, analysisVar)
        if not UTILS.isShapeFile(outputFeatures):
            startTimes, endTimes = cube.getOutputTimeFieldInfo()
            if cube.isStartTime:
                t0 = startTimes[0]
            else:
                t0 = endTimes[0]
            dataForPopup = {
                "rawValues": rawValues,
                "t0": t0.strftime("%Y/%m/%d %H:%M:%S"),
                "intv": str(cube.timeSize),
                "N": N,
                "T": cube.numTime,
                "timeUnit": cube.timeUnit,
                "changePoints": changePointList.T,
                "changeType": int(changeType)
            }
            CUTILS.generateChangePointPopupField(dataForPopup, cube, analysisVar, outputFeatures, candidateFields)
        else:
            #### Throw Warning That We Ignore PopUps for Shapefiles ####
            ARCPY.AddIDMessage("WARNING", 110315)
            cube.exportFeatures2D(outputFeatures, candidateFields)
            pass

        ### Throw warning in case of inappropriate data ###
        badDataLocID = []
        for i in range(len(changePointList[0])):
            if changePointList[0][i] == -1:
                badDataLocID.append(i);
        if len(badDataLocID) > 0:
            ARCPY.AddIDMessage("WARNING", 110406, len(badDataLocID), ", ".join(list(map(str, badDataLocID[0: 30]))))

        ARCPY.AddMessage(ARCPY.GetIDMessage(220293).format(LOCALE.format_string("%0.6f", penaltyVal)))
        report = CUTILS.changePointAnalysisReport(cube, changePointList)
        ARCPY.AddMessage(report)

        #### Set Shape and Layer Type ####
        renderLayerFile = setLayerNameFromCube('ChangePoint', cube)

        #### Render Results ####
        try:
            fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
            parameters[2].symbology = fullRLF
            UTILS.enableTimeSliderCPD(renderLayerFile, cube.dataset, 2)
        except:
            ARCPY.AddIDMessage("WARNING", 973)

        cube.close()

        return

    def postExecute(self, parameters):
        #### Update Pop-up titles ####
        UTILS.postExecuteUpdatePopupTitle(parameters, 2, -1)


class DescribeSpaceTimeCube(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Describe Space Time Cube"
        self.description = "Geoprocessing tool that describes information for Space Time Cubes"
        self.category = "Utilities"
        self.canRunInBackground = False
        self.helpContext = 50040001

    def getParameterInfo(self):
        """Define parameter definitions"""

        #### Define Parameters ####
        param0 = ARCPY.Parameter(displayName="Input Space Time Cube",
                                 name="in_cube",
                                 datatype="DEFile",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['nc']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Output Characteristics Table",
                            name = "out_characteristics_table",
                            datatype = "DETable",
                            parameterType = "Optional",
                            direction = "Output")
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Output Spatial Extent Features",
                                 name="out_spatial_extent",
                                 datatype="DEFeatureClass",
                                 parameterType="Optional",
                                 direction="Output")
        param2.displayOrder = 2

        #### Pack Parameters ####
        params = [param0, param1, param2]

        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        outTable = parameters[1]

        #### Add DBF Extension To Chart if Folder ####
        if paramChanged(outTable):
            featureTable = outTable.value.value
            #### Assure Output Workspace Exists ####
            outPath, outName = OS.path.split(featureTable)
            if ARCPY.Exists(outPath):
                featureTable, dbf = returnTableName(featureTable)
                if dbf:
                    outTable.value = featureTable

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        import netCDF4 as NET
        inNC = parameters[0]
        outTable = parameters[1]
        outExtent = parameters[2]

        #### Assure Cube is Valid ####
        throwCubeError = False
        if inNC.value:
            try:
                cubeStr = inNC.value.value
                fileExists = OS.path.isfile(cubeStr)
                dataset = NET.Dataset(cubeStr, keepweakref = True)
                cubeBool = isCube(dataset)
                panelBool = isPanel(dataset)

                if not cubeBool and fileExists:
                    #### Not a Cube ####
                    throwCubeError = True

                if panelBool and not isPro():
                    #### Panel Only For Pro ####
                    inNC.setIDMessage("ERROR", 110119)

                dataset.close()

            except:
                #### Not a Cube ####
                if not inNC.isInputValueDerived():
                    throwCubeError = True

        if throwCubeError:
            cubeDir, cubeFile = OS.path.split(inNC.value.value)
            inNC.setIDMessage("ERROR", 110003, cubeFile)

        if paramChanged(outTable):
            tableDir = outTable.value.value
            outPath, outName = OS.path.split(tableDir)
            if not ARCPY.Exists(outPath):
                outTable.setIDMessage("ERROR", 210, tableDir )

        if paramChanged(outExtent):
            extentDir = outExtent.value.value
            outPath, outName = OS.path.split(extentDir)
            if not ARCPY.Exists(outPath):
                outExtent.setIDMessage("ERROR", 210, extentDir)
        
        if outTable.value is not None:
            if ".DBF" in outTable.valueAsText.upper():
                outTable.setIDMessage("WARNING", 110456)
        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        import arcpy as ARCPY
        import SSCubeUtilities as CUTILS

        inputCube = parameters[0].valueAsText
        outputTable = parameters[1].valueAsText
        outFC = parameters[2].valueAsText

        cube, cubeSubType = CUTILS.describe(inputCube)

        #### Add Time Export Warning for DBF 
        if outputTable is not None:
            if ".DBF" in outputTable.upper():
                ARCPY.AddIDMessage("WARNING", 110456)

        if outFC is not None:
            CUTILS.writeCubeExtent(outFC, cube)
        if outputTable is not None:
            cube.exportSummaryTable(outputTable, cubeSubType)

        cube.close()

        return

class SubsetSpaceTimeCube(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Subset Space Time Cube"
        self.description = "Geoprocessing tool that subsets Space Time Cubes spatially, temporally and in a value-based manner"
        self.category = "Utilities"
        self.canRunInBackground = False
        self.helpContext = 50040002

    def getParameterInfo(self):
        """Define parameter definitions"""

        #### Define Parameters ####
        param0 = ARCPY.Parameter(displayName="Input Space Time Cube",
                                 name="in_cube",
                                 datatype="DEFile",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['nc']
        param0.displayOrder = 0
        
        param1 = ARCPY.Parameter(displayName="Output Space Time Cube",
                                 name="out_cube",
                                 datatype="DEFile",
                                 parameterType="Required",
                                 direction="Output")
        param1.filter.list = ['nc']
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Spatial Subset Method",
                                 name="spatial_subset_method",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param2.filter.type = "ValueList"
        param2.filter.list = ["FEATURES", "EXTENT", "SPACE_TIME_CUBE", "NONE"]
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Temporal Subset Method",
                                 name="temporal_subset_method",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param3.filter.type = "ValueList"
        param3.filter.list = ["USER_DEFINED", "NUMBER_OF_TIME_STEPS", "SPACE_TIME_CUBE",
                              "NONE"]
        param3.displayOrder = 7

        param4 = ARCPY.Parameter(displayName="Input Subset Features",
                                 name="in_subset_features",
                                 datatype="GPFeatureLayer",
                                 parameterType="Optional",
                                 direction="Input")
        param4.enabled = False
        param4.displayOrder = 4

        param5 = ARCPY.Parameter(displayName="Spatial Relationship",
                                 name="spatial_relationship",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param5.filter.type = "ValueList"
        param5.filter.list = ["INTERSECT", "CONTAINS", "WITHIN", "HAVE_THEIR_CENTER_IN"]
        param5.value = "INTERSECT"
        param5.enabled = False
        param5.displayOrder = 3

        param6 = ARCPY.Parameter(displayName="Extent",
                                 name="spatial_extent",
                                 datatype="GPExtent",
                                 parameterType="Optional",
                                 direction="Input")
        param6.controlCLSID = "{15F0D1C1-F783-49BC-8D16-619B8E92F668}"
        param6.enabled = False
        param6.displayOrder = 5

        param7 = ARCPY.Parameter(displayName="Input Spatial Subset Cube",
                                 name="in_spatial_cube",
                                 datatype="DEFile",
                                 parameterType="Optional",
                                 direction="Input")
        param7.filter.list = ['nc']
        param7.enabled = False
        param7.displayOrder = 6
        
        param8 = ARCPY.Parameter(displayName="Time Span of Subset",
                            name = "time_span_subset",
                            datatype = "GPValueTable",
                            parameterType = "Optional",
                            direction = "Input")
        param8.controlCLSID = "{1A1CA7EC-A47A-4187-A15C-6EDBA4FE0CF7}"
        param8.enabled = False
        param8.columns = [['GPDate', 'Start Time'], ['GPDate','End Time']]
        param8.displayOrder = 8

        param9 = ARCPY.Parameter(displayName="Number of Time Steps to Remove",
                            name = "remove_time_steps",
                            datatype = "GPValueTable",
                            parameterType = "Optional",
                            direction = "Input")
        param9.controlCLSID = "{1A1CA7EC-A47A-4187-A15C-6EDBA4FE0CF7}"
        param9.enabled = False
        param9.columns = [['GPLong', 'From the Start'], ['GPLong','From the End']]
        param9.displayOrder = 9
        
        param10 = ARCPY.Parameter(displayName="Input Temporal Subset Cube",
                                 name="in_temporal_cube",
                                 datatype="DEFile",
                                 parameterType="Optional",
                                 direction="Input")
        param10.filter.list = ['nc']
        param10.enabled = False
        param10.displayOrder = 10

        #### Pack Parameters ####
        params = [param0, param1, param2, param3, param4, param5, param6, param7, param8,
                  param9, param10]

        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        import sys as SYS
        import netCDF4 as NET

        inputSTC = parameters[0]
        outputSTC = parameters[1]
        spatialSubsetMethod = parameters[2]
        temporalSubsetMethod = parameters[3]
        inputSpatialFC = parameters[4]
        spatialRelationship = parameters[5]
        extent = parameters[6]
        spatialSubsetCube = parameters[7]
        timeSpan = parameters[8]
        timeStepRemove = parameters[9]
        temporalSubsetCube = parameters[10]

        #### Spatial Subset Drop Down Parameter Updates ####
        if spatialSubsetMethod.value is not None:
            if spatialSubsetMethod.value.upper() != "NONE":
                if spatialSubsetMethod.value.upper() == "FEATURES":
                    inputSpatialFC.enabled = True
                    spatialRelationship.enabled = True
                    clearParameter(extent)
                    #extent.value = "0 0 0 0 NaN"
                    clearParameter(spatialSubsetCube)

                    if inputSTC.value is not None and inputSpatialFC.value is not None:
                        updateSelectionFilter(spatialRelationship, inputSTC, inputSpatialFC, isSelectingCube = False)

                elif spatialSubsetMethod.value.upper() == "EXTENT":
                    clearParameter(inputSpatialFC)
                    extent.enabled = True
                    #if extent.value is None:
                        #extent.value = "0 0 0 0 NaN"
                    clearParameter(spatialSubsetCube)
                    clearParameter(spatialRelationship)

                elif spatialSubsetMethod.value.upper() == "SPACE_TIME_CUBE":
                    clearParameter(inputSpatialFC)
                    clearParameter(extent)
                    #extent.value = "0 0 0 0 NaN"
                    spatialSubsetCube.enabled = True
                    spatialRelationship.enabled = True
                    if inputSTC.value is not None and spatialSubsetCube.value is not None:
                        updateSelectionFilter(spatialRelationship, inputSTC, spatialSubsetCube, isSelectingCube = True)

            else:
                clearParameter(inputSpatialFC)
                clearParameter(extent)
                #extent.value = "0 0 0 0 NaN"
                clearParameter(spatialSubsetCube)
                clearParameter(spatialRelationship)

        if temporalSubsetMethod.value is not None:
            if temporalSubsetMethod.value.upper() != "NONE":
                if temporalSubsetMethod.value.upper() == "USER_DEFINED" :
                    timeSpan.enabled = True
                    clearParameter(temporalSubsetCube)
                    clearParameter(timeStepRemove)

                if temporalSubsetMethod.value.upper() == "SPACE_TIME_CUBE":
                    clearParameter(timeSpan)
                    temporalSubsetCube.enabled = True
                    clearParameter(timeStepRemove)

                if temporalSubsetMethod.value.upper() == "NUMBER_OF_TIME_STEPS":
                    clearParameter(timeSpan)
                    clearParameter(temporalSubsetCube)
                    timeStepRemove.enabled = True

            else:
                clearParameter(timeSpan)
                clearParameter(temporalSubsetCube)
                clearParameter(timeStepRemove)

        if spatialRelationship.enabled:
            if spatialRelationship.value is None:
                spatialRelationship.value = "INTERSECT"

        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        import netCDF4 as NET

        inputSTC = parameters[0]
        outputSTC = parameters[1]
        spatialSubsetMethod = parameters[2]
        temporalSubsetMethod = parameters[3]
        inputSpatialFC = parameters[4]
        spatialRelationship = parameters[5]
        extent = parameters[6]
        spatialSubsetCube = parameters[7]
        timeSpan = parameters[8]
        timeStepRemove = parameters[9]
        temporalSubsetCube = parameters[10]

        #### Assure Cube is Valid ####
        inputCubeError = validateCube(inputSTC)
        if inputSTC.value and inputCubeError is False:
            inputCubeError, inputCubeInfo = cubeCheck(inputSTC, returnInfo = True)
        
        #### Assure Feature Class Exists ####
        if inputSpatialFC.value is not None:
            if not ARCPY.Exists(inputSpatialFC.valueAsText):
                inputSpatialFC.setIDMessage("ERROR", 732, inputSpatialFC.displayName, inputSpatialFC.valueAsText)

        #### Not All Three Options Can be None ####
        if spatialSubsetMethod.altered or temporalSubsetMethod.altered:
            if spatialSubsetMethod.value is not None and temporalSubsetMethod.value is not None:
                if spatialSubsetMethod.valueAsText.upper() == "NONE":
                    if temporalSubsetMethod.valueAsText.upper() == "NONE":
                            temporalSubsetMethod.setIDMessage("ERROR", 530)

        if spatialSubsetMethod.altered and spatialSubsetMethod.value is not None:
            if spatialSubsetMethod.valueAsText.upper() == "FEATURES":
                if inputSpatialFC.value is None:
                    inputSpatialFC.setIDMessage("ERROR", 530)

            elif spatialSubsetMethod.valueAsText.upper() == "SPACE_TIME_CUBE":
                if spatialSubsetCube.value is None:
                    spatialSubsetCube.setIDMessage("ERROR", 530)
                    #### Make Sure STC is Valid ####
                else:
                    spaceCubeError, spaceCubeInfo = cubeCheck(spatialSubsetCube, returnInfo = True)

        if temporalSubsetMethod.altered and temporalSubsetMethod.value is not None:
            if temporalSubsetMethod.valueAsText.upper() == "NUMBER_OF_TIME_STEPS":
                subsetStartBin, subsetEndBin = gp2StartEndDate(timeStepRemove)
                if subsetStartBin is None and subsetEndBin is None:
                    timeStepRemove.setIDMessage("ERROR", 530)
                else:
                    timeFlag = True
                    if "inputCubeInfo" in locals():
                        timeFlag, errorCode = subsetExtentCheck(inputCubeInfo, startBin = subsetStartBin, 
                                                                endBin = subsetEndBin, dim= "TIME")
                    if timeFlag is False:
                        if errorCode == "030111":
                            timeStepRemove.setIDMessage("ERROR", errorCode, ARCPY.GetIDMessage(110460))
                        else:
                            timeStepRemove.setIDMessage("ERROR", int(errorCode))
                    else:
                        if "inputCubeInfo" in locals():
                            outputStartTime, outputEndTime= getOutputSubsetTimes(inputCubeInfo, startBin = subsetStartBin, endBin = subsetEndBin)
                            temporalSubsetMethod.setIDMessage("Warning", 230007, TUTILS.dateTime2String(outputStartTime), TUTILS.dateTime2String(outputEndTime))

            elif temporalSubsetMethod.valueAsText.upper() == "SPACE_TIME_CUBE":
                if temporalSubsetCube.value is None:
                    temporalSubsetCube.setIDMessage("ERROR", 530)
                else:
                    timeCubeError, timeCubeInfo = cubeCheck(temporalSubsetCube, returnInfo = True)
                    if timeCubeError is False:
                        timeFlag = True
                        if "inputCubeInfo" in locals() and "timeCubeInfo" in locals():
                            timeFlag, errorCode = subsetExtentCheck(inputCubeInfo, subsetInfo = timeCubeInfo, dim = "TIME")
                        if timeFlag is False:
                            temporalSubsetCube.setIDMessage("ERROR", int(errorCode))
                        else:
                            if "inputCubeInfo" in locals():
                                subsetStartTime = TUTILS.convert2DateTime(timeCubeInfo['first_start_time'])
                                subsetEndTime = TUTILS.convert2DateTime(timeCubeInfo['last_end_time'])
                                outputStartTime, outputEndTime = getOutputSubsetTimes(inputCubeInfo, startTime = subsetStartTime, endTime = subsetEndTime)
                                temporalSubsetMethod.setIDMessage("Warning", 230007, TUTILS.dateTime2String(outputStartTime), TUTILS.dateTime2String(outputEndTime))

            elif temporalSubsetMethod.valueAsText.upper() == "USER_DEFINED":
                subsetStartTime, subsetEndTime = gp2StartEndDate(timeSpan)
                if subsetStartTime is None and subsetEndTime is None:
                    timeSpan.setIDMessage("ERROR", 530)
                else:
                    timeFlag = True
                    if "inputCubeInfo" in locals():
                        timeFlag, errorCode = subsetExtentCheck(inputCubeInfo, subsetInfo = None, 
                                                                startTime = subsetStartTime, endTime = subsetEndTime, 
                                                                dim = "TIME")
                    if timeFlag is False:
                        timeSpan.setIDMessage("ERROR", int(errorCode))
                    else:
                        if "inputCubeInfo" in locals():
                            outputStartTime, outputEndTime = getOutputSubsetTimes(inputCubeInfo, startTime = subsetStartTime, endTime = subsetEndTime)
                            temporalSubsetMethod.setIDMessage("Warning", 230007, TUTILS.dateTime2String(outputStartTime), TUTILS.dateTime2String(outputEndTime))
        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        import arcpy as ARCPY
        import SSCube as CUBE
        import SSCubeUtilities as CUTILS
        import SSPanel as PANEL
        import SSTimeUtilities as TUTILS
        import netCDF4 as NET

        inputSTC = parameters[0].valueAsText
        outputSTC = parameters[1].valueAsText
        spatialSubsetMethod = parameters[2].valueAsText
        temporalSubsetMethod = parameters[3].valueAsText
        inputSpatialFC = parameters[4].valueAsText
        spatialRelationship = parameters[5].valueAsText
        extent = parameters[6].value
        extentStr = parameters[6].valueAsText
        spatialSubsetCube = parameters[7].valueAsText
        timeSpan = parameters[8]
        timeStepRemove = parameters[9]
        temporalSubsetCube = parameters[10].valueAsText

        inputCube = parameters[0].valueAsText
        outputTable = parameters[1].valueAsText
        outFC = parameters[2].valueAsText

        subsetStartTime = None
        subsetEndTime = None
        dropBinStart = None
        dropBinEnd = None

        subsetExtent = None
        subsetFeature = None
        spaceSubsetCube = None
        rel = None


        #### Update Extent Value ####
        #if "0 0 0 0" in extentStr:
            #extent = None

        if spatialSubsetMethod.upper() == "NONE":
            extent = None
            spatialSubsetCube = None
            inputSpatialFC = None
            
        #### Get Time Subset from User Defined ####
        if timeSpan.valueAsText is not None:
            subsetStartTime, subsetEndTime = gp2StartEndDate(timeSpan)
        #### Get Time Subset from Cube ####
        elif temporalSubsetCube is not None:
            isPanelCube = CUTILS.isPanelFromFile(temporalSubsetCube)

            if isPanelCube:
                timeSubsetCube = PANEL.SSPanel(temporalSubsetCube)
            else:
                timeSubsetCube = CUBE.SSCube(temporalSubsetCube)

            subsetStartTime = TUTILS.convert2DateTime(timeSubsetCube.dataset.first_start_time)
            subsetEndTime = TUTILS.convert2DateTime(timeSubsetCube.dataset.last_end_time)
            timeSubsetCube.close()

        elif timeStepRemove.valueAsText is not None:
            dropBinStart, dropBinEnd = gp2StartEndDate(timeStepRemove)

        #### Check if Cube is Panel ####
        isPanelCube = isPanelFromFile(inputSTC)
        if isPanelCube:
            
            if spatialSubsetCube is not None:
                rel = spatialRelationship
                isPanelCube = CUTILS.isPanelFromFile(spatialSubsetCube)
                if isPanelCube:
                    spaceSubsetCube = PANEL.SSPanel(spatialSubsetCube)
                else:
                    spaceSubsetCube = CUBE.SSCube(spatialSubsetCube)

            elif extent is not None:
                subsetExtent = extent
            elif inputSpatialFC is not None:
                subsetFeature = inputSpatialFC
                rel = spatialRelationship


            PANEL.SubsetPanel(inputSTC, outputSTC, subsetStartTime = subsetStartTime,
                            subsetEndTime=subsetEndTime, dropBinStart=dropBinStart,
                            dropBinEnd=dropBinEnd, extent = subsetExtent, subsetFeature = subsetFeature,
                            spaceSubsetCube = spaceSubsetCube, rel = rel)

            if spatialSubsetCube is not None:
                spaceSubsetCube.close()

        else:

            if spatialSubsetCube is not None:
                rel = spatialRelationship
                isPanelCube = CUTILS.isPanelFromFile(spatialSubsetCube)
                if isPanelCube:
                    spaceSubsetCube = PANEL.SSPanel(spatialSubsetCube)
                else:
                    spaceSubsetCube = CUBE.SSCube(spatialSubsetCube)

            elif extent is not None:
                subsetExtent = extent

            elif inputSpatialFC is not None:
                subsetFeature = inputSpatialFC
                rel = spatialRelationship


            CUBE.SubsetCube(inputSTC, outputSTC, subsetStartTime = subsetStartTime,
                            subsetEndTime=subsetEndTime, dropBinStart=dropBinStart,
                            dropBinEnd=dropBinEnd, extent = subsetExtent, subsetFeature = subsetFeature,
                            spaceSubsetCube = spaceSubsetCube, rel = rel)

            if spatialSubsetCube is not None:
                spaceSubsetCube.close()
        return


class TimeSeriesCrossCorrelation(object):
    """
    Time Series Correlation Analysis
    METHOD:
        __init__(): Define tool name and class info
        getParameterInfo(): Define parameter definitions in tool
        isLicensed(): Set whether tool is licensed to execute
        updateParameters():Modify the values and properties of parameters
                           before internal validation is performed
        updateMessages(): Modify the messages created by internal validation
                          for each tool parameter.
        execute(): Runtime script for the tool
    """

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Time Series Cross Correlation"
        self.description = "Geoprocessing tool that analysis the cross correlation of time series."
        self.category = "Space Time Pattern Analysis"
        self.canRunInBackground = False
        self.helpContext = 50010005

        #### Define Default Values ####
        # self.defaultIndexList = [6, 8]
        # self.defaultValueList = ["FIXED_DISTANCE", "ENTIRE_CUBE"]
        self.supportConcepts = ["NO_NBRS"] + supportConcepts
        self.supportConceptsPoints = ["NO_NBRS"] + supportConceptsPoints

    def getParameterInfo(self):
        """Define parameter definitions"""

        isProValue = isPro()

        #### Define Parameters ####
        param0 = ARCPY.Parameter(displayName="Input Space Time Cube",
                                 name="in_cube",
                                 datatype="DEFile",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['nc']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Primary Analysis Variable",
                                 name="analysis_variable_1",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Secondary Analysis Variable",
                                 name="analysis_variable_2",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Output Features",
                                 name="output_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Required",
                                 direction="Output")
        param3.displayOrder = 3

        param4 = ARCPY.Parameter(displayName="Enable Time Series Pop-ups",
                                 name="enable_pop_ups",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param4.filter.list = ['CREATE_POPUP', 'NO_POPUP']
        param4.value = False
        param4.displayOrder = 4

        param5 = ARCPY.Parameter(displayName="Maximum Time Lag",
                                 name="max_lag",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param5.filter.type = "Range"
        param5.displayOrder = 5

        param6 = ARCPY.Parameter(displayName="Time Lag Direction",
                                  name="lag_direction",
                                  datatype="GPString",
                                  parameterType="Optional",
                                  direction="Input")
        param6.filter.list = ["BOTH", "FORWARD", "BACKWARD"]
        param6.value = "BOTH"
        param6.displayOrder = 6
        param6.enabled = True

        param7 = ARCPY.Parameter(displayName="Spatial Neighbors to Include in Calculations",
                                 name="neighborhood_type",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param7.filter.type = "ValueList"
        param7.filter.list = self.supportConcepts
        param7.value = "NO_NBRS"
        param7.displayOrder = 7

        param8 = ARCPY.Parameter(displayName="Number of Spatial Neighbors",
                                 name="num_nbrs",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        # param8.filter.type = "Range"
        # param8.filter.list = [1, 1000]
        param8.displayOrder = 8
        param8.enabled = False

        param9 = ARCPY.Parameter(displayName="Distance Band",
                                 name="distance_band",
                                 datatype="GPLinearUnit",
                                 parameterType="Optional",
                                 direction="Input")
        if isProValue:
            param9.filter.list = supportDist
        param9.displayOrder = 9
        param9.enabled = False

        param10 = ARCPY.Parameter(displayName="Spatial Neighbor Weighting Method",
                                 name="spatial_weights",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param10.filter.list = ["EQUAL", "BISQUARE", "GAUSSIAN"]
        param10.value = "EQUAL"
        param10.displayOrder = 10
        param10.enabled = False

        param11 = ARCPY.Parameter(displayName="Filter and Remove Trend",
                                  name="filter_option",
                                  datatype="GPBoolean",
                                  parameterType="Optional",
                                  direction="Input")
        param11.filter.list = ['FILTER', 'NO_FILTER']
        param11.value = False
        param11.displayOrder = 11
        param11.enabled = True

        param12 = ARCPY.Parameter(displayName="Output Lagged Correlations Table",
                                 name="out_corr_table",
                                 datatype="DETable",
                                 parameterType="Optional",
                                 direction="Output")
        param12.displayOrder = 12

        param13 = ARCPY.Parameter(displayName="Output Pairwise Correlations Table",
                                  name="out_pair_table",
                                  datatype="DETable",
                                  parameterType="Optional",
                                  direction="Output")
        param13.displayOrder = 13

        param14 = ARCPY.Parameter(displayName="Output Layer Group",
                                  name="output_layer_group",
                                  datatype="GPGroupLayer",
                                  parameterType="Derived",
                                  direction="Output")
        param14.displayOrder = 14

        # #### Initialize Output Schema ####
        # param2.parameterDependencies = [param0.name]
        # param2.schema.featureTypeRule = "AsSpecified"
        # param2.schema.featureType = "Simple"
        # param2.schema.geometryTypeRule = "AsSpecified"
        # param2.schema.geometryType = "Polygon"
        # param2.schema.fieldsRule = "None"

        #### Pack Parameters ####
        params = [param0, param1, param2, param3, param4, param5,
                  param6, param7, param8, param9, param10, param11,
                  param12, param13, param14]

        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        import sys as SYS
        import netCDF4 as NET
        import SSTimeSeriesCorrelation as TSC

        # #### Add Deleted Parameter Values to Defaults
        # reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)

        param_cube = parameters[0]
        param_var = parameters[1]
        param_var_corr = parameters[2]
        param_out_fc = parameters[3]
        param_max_lag = parameters[5]
        param_lag_direction = parameters[6]
        param_neighbor_concept = parameters[7]
        param_neighbor_count = parameters[8]
        param_distance_band = parameters[9]
        param_spatial_weights = parameters[10]
        param_apply_pre_whitening = parameters[11]
        param_table_full = parameters[12]
        param_table_pair = parameters[13]

        if paramChanged(param_cube):
            try:
                if param_cube.value:
                    fieldList = []
                    dataset = NET.Dataset(param_cube.value.value, keepweakref=True)
                    analysisPrefix = ['EMERGING_', 'OUTLIER_', '_ESTIMATED', 'FORECAST_', 'CPD_']
                    if isPanel(dataset):
                        vars2Ignore = panelVars2Ignore
                        vars2Ignore.append(dataset.location_id_field)
                        dims = ('time', 'locations')
                        if not isPolygon(dataset):
                            param_neighbor_concept.filter.list = self.supportConceptsPoints
                        else:
                            param_neighbor_concept.filter.list = self.supportConcepts
                    else:
                        vars2Ignore = gridVars2Ignore
                        dims = ('time', 'y', 'x')
                        param_neighbor_concept.filter.list = self.supportConcepts

                    #### Filter Variables ####
                    varCandidates = []
                    for var in dataset.variables:
                        if dataset.variables[var].dimensions == dims:
                            if var not in vars2Ignore:
                                if filterTSCubeVarByName(var):
                                    varCandidates.append(var)
                    param_var.filter.list = varCandidates
                    param_var_corr.filter.list = varCandidates

                    #### Set Time Range ####
                    timeSize = int(dataset.variables['time'].size - 5)
                    param_max_lag.filter.list = [1, timeSize]

                    # #### Set Shape and Layer Type ####  TODO: enable later if needed
                    # renderLayerFile = setLayerNameFromDataset('Emerging_All', dataset)
                    # fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
                    # parameters[2].symbology = fullRLF
                    dataset.close()
                    del dataset
            except:
                pass
            finally:
                if 'dataset' in locals():
                    dataset.close()

        if param_max_lag.filter.list is not None:
            timeSize = param_max_lag.filter.list[1]
            if param_var.value != param_var_corr.value or param_neighbor_concept.value.upper() != "NO_NBRS":
                param_max_lag.filter.list = [0, timeSize]
            else:
                param_max_lag.filter.list = [1, timeSize]

        #### Set Conceptualization ####
        if param_neighbor_concept.value is None:
            param_neighbor_concept.value = "NO_NBRS"
        upperValue = param_neighbor_concept.value.upper()
        if upperValue == "NO_NBRS":
            param_spatial_weights.enabled = False
            param_spatial_weights.value = "EQUAL"
        else:
            param_spatial_weights.enabled = True
            if upperValue in ["K_NEAREST_NEIGHBORS", "FIXED_DISTANCE"]:
                param_spatial_weights.filter.list = ["EQUAL", "BISQUARE", "GAUSSIAN"]
            else:
                param_spatial_weights.filter.list = ["EQUAL"]
                param_spatial_weights.value = "EQUAL"

        if upperValue == "K_NEAREST_NEIGHBORS":
            clearParameter(param_distance_band)
            param_neighbor_count.enabled = True
            if param_neighbor_count.value is None:
                param_neighbor_count.value = 8
        elif upperValue == "FIXED_DISTANCE":
            clearParameter(param_neighbor_count)
            param_distance_band.enabled = True
        else:
            clearParameter(param_neighbor_count)
            clearParameter(param_distance_band)

        if param_var.value is not None and param_var_corr.value == param_var.value and upperValue == "NO_NBRS":
            param_lag_direction.enabled = False
        else:
            param_lag_direction.enabled = True

        if upperValue == "NO_NBRS":
            clearParameter(param_table_pair)
        else:
            param_table_pair.enabled = True

        if param_table_full.value is not None:
            addExtensionTable(parameters, 12)
        if param_table_pair.value is not None:
            addExtensionTable(parameters, 13)

        #### Add Fields ####
        if param_cube.value and param_var.value and param_var_corr.value and param_out_fc.value:
            try:
                mainOutFCFields, corrTableFields, pairTableFields = TSC.buildOutputFCSchema(
                    param_cube.valueAsText, param_var.value, param_var_corr.value,
                    param_max_lag.value, upperValue, param_lag_direction.value, param_apply_pre_whitening.value,
                    param_table_full.valueAsText, param_table_pair.valueAsText)
                param_out_fc.schema.additionalFields = mainOutFCFields
                if param_table_full.value is not None:
                    param_table_full.schema.additionalFields = corrTableFields
                if param_table_pair.value is not None:
                    param_table_pair.schema.additionalFields = pairTableFields
            except:
                pass

        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        import netCDF4 as NET

        param_cube = parameters[0]
        param_var = parameters[1]
        param_var_corr = parameters[2]
        param_out = parameters[3]
        param_popup = parameters[4]
        param_neighbor_concept = parameters[7]
        param_neighbor_count = parameters[8]
        param_distance_band = parameters[9]
        param_out_table_full = parameters[12]
        param_out_table_pair = parameters[13]

        #### Assure Cube is Valid ####
        throwCubeError = False
        if param_cube.value:
            try:
                cubeStr = param_cube.value.value
                fileExists = OS.path.isfile(cubeStr)
                dataset = NET.Dataset(cubeStr, keepweakref=True)
                cubeBool = isCube(dataset)
                panelBool = isPanel(dataset)

                if not cubeBool and fileExists:
                    #### Not a Cube ####
                    throwCubeError = True

                if panelBool and not isPro():
                    #### Panel Only For Pro ####
                    param_cube.setIDMessage("ERROR", 110119)

                checkIfForecastCube(dataset, param_cube, throwError=False)

                if paramChanged(param_var) and param_var.value:
                    if param_var.value not in dataset.variables:
                        param_var.setIDMessage("ERROR", 110024, param_var.value)

                if paramChanged(param_var_corr) and param_var_corr.value:
                    if param_var_corr.value not in dataset.variables:
                        param_var_corr.setIDMessage("ERROR", 110024, param_var_corr.value)
                    # todo: enable later after debugging
                    # if param_var_corr.value == param_var.value:
                    #     param_var_corr.setErrorMessage("Analysis Variable and Cross Correlation Variable cannot be the same.")

                dataset.close()

            except:
                #### Not a Cube ####
                if not param_cube.isInputValueDerived():
                    throwCubeError = True

        if throwCubeError:
            cubeDir, cubeFile = OS.path.split(param_cube.value.value)
            param_cube.setIDMessage("ERROR", 110003, cubeFile)

        if paramChanged(param_distance_band):
            if param_distance_band.value:
                value = getLinearUnitFloat(param_distance_band.value)
                if value <= 0.0:
                    param_distance_band.setIDMessage("ERROR", 110045)

        if param_neighbor_concept.value.upper() == "K_NEAREST_NEIGHBORS":
            if param_neighbor_count.value is None:
                param_neighbor_count.setIDMessage("ERROR", 530)
            else:
                value = int(param_neighbor_count.value)
                # if value < 1 or value > 1000:
                #     param_neighbor_count.setIDMessage("ERROR", 854, 1, 1000)
                if value < 1:
                    param_neighbor_count.setIDMessage("ERROR", 110477, 1)
                if value > 1000 and param_out_table_pair.value is not None:
                    param_out_table_pair.setIDMessage("WARNING", 110555)

        if param_popup.value and param_out.value is not None:
            if UTILS.isShapeFile(param_out.valueAsText):
                #### Warning Message for Local Scatterplots When Written to Shapefile ####
                param_popup.setIDMessage("WARNING", 110315)

        if param_out.value is not None:
            if param_out_table_full.value is not None:
                if param_out.valueAsText == param_out_table_full.valueAsText:
                    param_out_table_full.setIDMessage("ERROR", 110275, param_out_table_full.valueAsText)
                elif param_out.valueAsText.lower().removesuffix(".shp") == param_out_table_full.valueAsText.lower().removesuffix(".dbf"):
                    param_out_table_full.setIDMessage("ERROR", 110462)
            if param_out_table_pair.value is not None:
                if param_out.valueAsText == param_out_table_pair.valueAsText:
                    param_out_table_pair.setIDMessage("ERROR", 110275, param_out_table_pair.valueAsText)
                elif param_out.valueAsText.lower().removesuffix(".shp") == param_out_table_pair.valueAsText.lower().removesuffix(".dbf"):
                    param_out_table_pair.setIDMessage("ERROR", 110462)
        if param_out_table_full.value is not None and param_out_table_pair.value is not None and param_out_table_full.valueAsText == param_out_table_pair.valueAsText:
            param_out_table_pair.setIDMessage("ERROR", 110462)
        return

    def execute(self, parameters, messages):
        ################### Imports ########################
        import SSTimeSeriesCorrelation as TSC
        TSC.execute(parameters, messages)

    def postExecute(self, parameters):
        import SSTimeSeriesCorrelation as TSC
        TSC.postExecute(parameters)



