# coding: utf-8
"""
Source Name:   SSUtilities.py
Version:       ArcGIS 10.1
Author:        Environmental Systems Research Institute Inc.
Description:   Utility Functions for ESRI Script Tools as well as users for their own
               scripts.
"""

################### Imports ########################
import os as OS
import sys as SYS
import threading as THREADING
import numpy as NUM
import numpy.random as RAND
import math as MATH
import arcgisscripting as ARC
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.da as DA
import arcpy.sa as SA
import arcpy.analysis as ANA
import arcpy.edit as EDIT
import ErrorUtils as ERROR
import SSDataObject as SSDO
import WeightsUtilities as WU
import Stats as STATS
import locale as LOCALE
import gapy as GAPY
import matplotlib.path as PATH
import scipy.spatial as SCPS
import json as JSON
import datetime as DT
import arcpy.mp as MP
import tempfile as TEMPFILE
import logging
from loggerutils import init_ss_logger

try:
  basestring
except NameError:
  basestring = str

LOGGER = init_ss_logger(__name__, logging.DEBUG)
LOCALE.setlocale(LOCALE.LC_ALL, '')

###### Dictionary Mappings For Various Scripts ######

convertType = {'SmallInteger': 'SHORT',
                'Integer': 'LONG',
                'String': 'TEXT',
                'Single': 'FLOAT',
                'Double': 'FLOAT',
                'Date': 'DATE',
                'BigInteger': 'BIGINTEGER',
                'TimeOnly': 'TIMEONLY',
                'DateOnly': 'DATEONLY',
                'TimestampOffset': 'TIMESTAMPOFFSET'}

dataType2Int = {"DOUBLE": 0,
                "LONG": 1,
                "TEXT": 2,
                "DATE": 3,
                "SINGLE": 4,
                "SHORT": 5,
                "STRING": 2,
                "SMALLINTEGER": 5,
                "INTEGER": 1,
                "BIGINTEGER": 6,
                "TIMEONLY": 7,
                "DATEONLY": 8,
                'TIMESTAMPOFFSET': 9}


dataTypeLoc = {"DOUBLE": ARCPY.GetIDMessage(220303),
                "LONG": ARCPY.GetIDMessage(220304),
                "TEXT":ARCPY.GetIDMessage(220305),
                "DATE": ARCPY.GetIDMessage(84970),
                "SINGLE": ARCPY.GetIDMessage(220307),
                "SHORT": ARCPY.GetIDMessage(220306),
                "STRING": ARCPY.GetIDMessage(220305),
                "SMALLINTEGER": ARCPY.GetIDMessage(220306),
                "INTEGER": ARCPY.GetIDMessage(220304),
                "BIGINTEGER": ARCPY.GetIDMessage(220653)}

convertTypeOut = {'SmallInteger': 'SHORT',
                'Integer': 'LONG',
                'String': 'TEXT',
                'Single': 'FLOAT',
                'Double': 'DOUBLE',
                'Date': 'DATE',
                'BigInteger': 'BIGINTEGER',
                'TimeOnly': 'TIMEONLY',
                'DateOnly': 'DATEONLY',
                'TimestampOffset': 'TIMESTAMPOFFSET'}

numpyConvert = {'SmallInteger': int,
                'Integer': int,
                'Single': float,
                'Double': float,
                'Date': float,
                'String': 'U%i',
                'BigInteger': NUM.int64,
                'TimeOnly': float,
                'DateOnly': float,
                'TimestampOffset': float}

numpyDtypeConvert = {NUM.dtype('float64'):"DOUBLE",
                     NUM.dtype('int32'): "LONG",
                     NUM.dtype('int64'): "BIGINTEGER",
                     NUM.float64 : "DOUBLE",
                     NUM.int32: "LONG",
                     NUM.int64: "BIGINTEGER",
                     NUM.dtype('O'): "DATE",
                     int: "LONG",
                     float: 'DOUBLE',
                     '<U': "TEXT"}

nullTypes = [ "", None ]
numericTypes = ['SMALLINTEGER', 'SHORT',
                'INTEGER', 'LONG',
                'SINGLE', 'FLOAT',
                'DOUBLE', 'BIGINTEGER']

renderType = {'POINT': 0, 'MULTIPOINT': 0,
              'POLYLINE': 1, 'LINE': 1,
              'POLYGON': 2, 'MULTIPATCH': 0}

#distUnitTypes = {'UNKNOWN': 0, 'INCHES': 1, 'POINTS': 2, 'FEET': 3,
#                 'YARDS': 4, 'MILES': 5, 'NAUTICAL MILES': 6,
#                 'MILLIMETERS': 7, 'CENTIMETERS': 8, 'METERS': 9,
#                 'KILOMETERS': 10, 'DECIMAL DEGREES': 11, 'DECIMETERS': 12}

classificationMethod = { "DEFINED_INTERVAL": 0, "EQUAL_INTERVAL": 1,
                         "GEOMETRIC_INTERVAL": 2, "MANUAL": 3,
                         "NATURAL_BREAKS": 4, "QUANTILE": 5, 
                         "STANDARD_DEVIATION": 6}

###### NULL Value for Shapefiles Set to -DBL_MAX ######
shpFileNull = {'FLOAT': NUM.float32(-3.4028235e+38),
               'DOUBLE': NUM.float64(-1.7976931348623158e+308),
               'LONG': NUM.int32(-(214748364)),
               'SHORT': NUM.int16(-32768),
               'BIGINTEGER': NUM.int64(-9223372036854775808),
               'TEXT': "",
               'DATE': "",
               'TIMEONLY': "",
               'DATEONLY': "",
               'TIMESTAMPOFFSET': ""}

nullTypeNumpy = {NUM.dtype('float64'): NUM.nan,
                     NUM.dtype('int32'): -9999,
                     NUM.dtype('int64'): -9999,
                     NUM.float64 : NUM.nan,
                     NUM.int32: -9999,
                     NUM.int64: -9999,
                     NUM.dtype('O'): NUM.datetime64('NaT'),
                     int: -9999,
                     float: NUM.nan}


aggTypeOutDict = {"SUM": 1, "MEAN": 2, "MIN": 3, "MAX": 4,
                  "STD": 5, "MEDIAN": 6}
predTypeOutDict = {'ZEROS': 1, 'SPACE': 2, 'SPACETIME': 3, 'TREND': 4}

dataTypeTable =  ["TextFile", "DbaseTable", "Table", "TableView", "RasterLayer", "MosaicLayer", "RasterDataset" ]
dataTypeNoTable = ["RasterBand"]

uncertaintyDict = {"MOE": "Margin of Error",
                   "CONFIDENCE_BOUNDS": "Confidence Bounds",
                   "PERCENTAGE": "Percent Below/Above"}

################## Linear Unit Methods #################
spaceUnit = {"FEET":'FOOT', "US_FEET":"FOOT_US", "METERS":'METER',
             "KILOMETERS":'KILOMETER', "MILES":'MILE_US', "US_MILES":"MILE_US",
             "FEETINT":'FEETINT', "MILESINT":'MILESINT'}

pluralConvert = {"Feet":"Foot", "US_Feet":"US Foot","Meters":"Meter",
                 "Kilometers":"Kilometer", "Miles":"Mile", "US Miles":"US Mile",
                 "International Feet":"International Foot",
                 "Statute Miles":"Statute Mile"}

supportDist = ["FEET", "FOOT", "US_FEET", "US_FOOT", "FOOT_US", 
               "METERS", "METER", "KILOMETER", "KILOMETERS", 
               "MILE", "MILES", "US_MILES", "US_MILE", "MILE_US",
               "FEETINT", "MILESINT"]

localizableUnit = {
    "kilometer": ARCPY.GetIDMessage(220185),
    "kilometers": ARCPY.GetIDMessage(220186),
    "meter": ARCPY.GetIDMessage(220187),
    "meters": ARCPY.GetIDMessage(220188),
    "mile": ARCPY.GetIDMessage(220189),
    "miles": ARCPY.GetIDMessage(220190),
    "us_mile": ARCPY.GetIDMessage(220189), # Map US_MILE to mile
    "us_miles": ARCPY.GetIDMessage(220190), # Map US_MILES to miles
    "mile_us": ARCPY.GetIDMessage(220189), # Map MILE_US to mile
    "miles_us": ARCPY.GetIDMessage(220190), # Map MILES_US to miles
    "foot": ARCPY.GetIDMessage(220191),
    "feet": ARCPY.GetIDMessage(220192),
    "us_feet": ARCPY.GetIDMessage(220192), # Map US_FEET to feet
    "us_foot": ARCPY.GetIDMessage(220191), # Map US_FOOT to foot
    "feet_us": ARCPY.GetIDMessage(220192), # Map FEET_US to feet
    "foot_us": ARCPY.GetIDMessage(220191), # Map FOOT_US to foot
    "square kilometer": ARCPY.GetIDMessage(220193),
    "square kilometers": ARCPY.GetIDMessage(220194),
    "square meter": ARCPY.GetIDMessage(220195),
    "square meters": ARCPY.GetIDMessage(220196),
    "square mile": ARCPY.GetIDMessage(220197),
    "square miles": ARCPY.GetIDMessage(220198),
    "square foot": ARCPY.GetIDMessage(220199),
    "square feet": ARCPY.GetIDMessage(220200),
    "second": ARCPY.GetIDMessage(220201),
    "seconds": ARCPY.GetIDMessage(220202),
    "minute": ARCPY.GetIDMessage(220203),
    "minutes": ARCPY.GetIDMessage(220204),
    "hour": ARCPY.GetIDMessage(220205),
    "hours": ARCPY.GetIDMessage(220206),
    "day": ARCPY.GetIDMessage(220207),
    "days": ARCPY.GetIDMessage(220208),
    "week": ARCPY.GetIDMessage(220209),
    "weeks": ARCPY.GetIDMessage(220210),
    "month": ARCPY.GetIDMessage(220211),
    "months": ARCPY.GetIDMessage(220212),
    "year": ARCPY.GetIDMessage(220213),
    "years": ARCPY.GetIDMessage(220214),
    "international foot": ARCPY.GetIDMessage(220559),
    "international feet": ARCPY.GetIDMessage(220560),
    "feetint": ARCPY.GetIDMessage(220560),
    "statute mile": ARCPY.GetIDMessage(220561),
    "statute miles": ARCPY.GetIDMessage(220562),
    "milesint": ARCPY.GetIDMessage(220562),
}

modelLabels= {
  "Forest-reg"  : [ARCPY.GetIDMessage(220581), ARCPY.GetIDMessage(220582)],
  "Forest-cls"  : [ARCPY.GetIDMessage(220583), ARCPY.GetIDMessage(220584)],
  "Gradient_Boosted-reg" : [ARCPY.GetIDMessage(220662), ARCPY.GetIDMessage(220663)],
  "Gradient_Boosted-cls" : [ARCPY.GetIDMessage(220664), ARCPY.GetIDMessage(220665)],
  "GLR-GAUSSIAN": [ARCPY.GetIDMessage(220585), ARCPY.GetIDMessage(220586)],
  "GLR-LOGIT"   : [ARCPY.GetIDMessage(220587), ARCPY.GetIDMessage(220588)],
  "GLR-POISSON" : [ARCPY.GetIDMessage(220589), ARCPY.GetIDMessage(220590)],
  "POP-with"    : [ARCPY.GetIDMessage(220591), ARCPY.GetIDMessage(220592)],
  "POP-without" : [ARCPY.GetIDMessage(220593), ARCPY.GetIDMessage(220592)]
}

hotSpotHexColors = ["#4575B5", "#849EBA", "#COCCBE", "#F7F7F2",
                    "#FAB984", "#ED7551", "#D62F27"]
hotSpotRGBColors = [[69, 117, 181, 100], [132, 158, 186, 100], [192, 204, 190, 100],
                    [247, 247, 242, 100], 
                    [250, 185, 132, 100], [237, 117, 81, 100], [214, 47, 39, 100]] 


roughEarthArea = 510100000000000.0
maximumNumberOfCells = 100

pathLayers = OS.path.join(ARCPY.GetInstallInfo()["InstallDir"], 
                          "Resources", "ArcToolbox", "Templates", "Layers")

GCSDegree2Meters = 6378137.0

tsOutlierAlpha = .1

newFieldTypeFlags = ["SupportsBigObjectID", "SupportsBigInteger", 
                     "SupportsTimeOnly", "SupportsDateOnly", "SupportsTimestampOffset"]

newFieldTypeFlagsUpper = ["SUPPORTSBIGOBJECTID", "SUPPORTSBIGINTEGER", 
                          "SUPPORTSTIMEONLY", "SUPPORTSDATEONLY", "SUPPORTSTIMESTAMPOFFSET"]

newFieldTypes = ['OID64', 'BIGINTEGER', 'TIMEONLY', 'DATEONLY', 'TIMESTAMPOFFSET']

datePrecisionTypes = ["DATE", "TIMESTAMPOFFSET"]
#datePrecisionTypes = ["DATE", "TIMEONLY", "TIMESTAMPOFFSET"]

#### Map New Field Types to Describe/Workspace Flags ####
newFieldTypeToFlag = {}
for ind, newType in enumerate(newFieldTypes):
    newFieldTypeToFlag[newType] = newFieldTypeFlagsUpper[ind]

def warnNotUsingHighPrecisionDatesDescribe(desc, dateFieldNames = [], silentWarning = False):
    """Throw Warning When Ignoring High Precision Dates Using FC Describe Object."""

    warn = False
    fieldDict = {}
    for fieldObject in desc.fields:
        fieldDict[fieldObject.name.upper()] = fieldObject

    for fieldName in dateFieldNames:
        upperName = fieldName.upper()
        if upperName in fieldDict:
            field = fieldDict[upperName]
            if field.type.upper() == "DATE" and field.precision == 1:
                warn = True
                break
            elif field.type.upper() == "TIMESTAMPOFFSET":
                warn = True
                break

    if warn and not silentWarning:
        ARCPY.AddIDMessage("WARNING", 110521)

    return warn

def warnNotUsingUTCDescribe(desc, dateFieldNames = [], silentWarning = False):
    """Throw Warning When Usig TimestampOffset that UTC = 0."""

    warn = False
    fieldDict = {}
    for fieldObject in desc.fields:
        fieldDict[fieldObject.name.upper()] = fieldObject

    for fieldName in dateFieldNames:
        upperName = fieldName.upper()
        if upperName in fieldDict:
            field = fieldDict[upperName]
            if field.type.upper() == "TIMESTAMPOFFSET":
                warn = True
                break

    if warn and not silentWarning:
        ARCPY.AddIDMessage("WARNING", 110541)

    return warn

def fieldIsBigInteger(inputFC, fieldName):
    lf = ARCPY.ListFields(inputFC, fieldName.upper())
    if len(lf):
        return lf[0].type.upper() == "BIGINTEGER"
    else:
        return False

def outputSupportsNewFieldTypes(output):
    outPath, outName = OS.path.split(output)
    if not ARCPY.Exists(outPath):
        ARCPY.AddIDMessage("ERROR", 210, output)
        raise SystemExit()

    describe = ARCPY.Describe(outPath)
    d = {}
    for newType in newFieldTypeFlags:
        d[newType.upper()] = getattr(describe, newType, False)

    return d

def migrateDatePrecisionField(field, outFlags):
    migrate = False
    if field.type.upper() in datePrecisionTypes:
        if field.precision in [1] and outFlags["SUPPORTSTIMESTAMPOFFSET"]:
            migrate = True
    return migrate

class ExecuteNewFieldTypeChecker(object):
    """Class that stores the new types of fields allowed in a given input.  
    There are also methods that will do the same for outputs and can throw runtime
    errors when incompatibilities exist.

    INPUTS:
    inData (str, object, layer, table, file): input data

    METHODS:
    setNewFieldTypes()
    checkNewFieldTypesOutput(output, fieldList = [], throwError = False)
    checkOID()

    ATTRS:

    """

    def __init__(self, inData, outData, fields = [], checkOID64 = True, weightsFile = None, outIsRaster = False):
        #### Input ####
        self.inData = inData
        self.ssdo = SSDO.SSDataObject(inData, templateFC = outData, silentWarnings = True,
                                      displayProjectionWarning = False, silentErrors = True)
        self.outData = outData
        self.checkOID64 = checkOID64
        self.weightsFile = weightsFile
        self.outIsRaster = False

        self.info = ARCPY.Describe(inData)
        self.workspaceType = None

        #### Assure Input are Features with OIDs for Special Case ####
        if not hasattr(self.info, "oidFieldName"):
            ARCPY.AddIDMessage("ERROR", 339, self.ssdo.inName)
            raise SystemExit()

        if not hasattr(self.info, "HasOID64"):
            self.hasOID64 = False
        else:
            self.hasOID64 = self.info.HasOID64
        self.oidName = self.info.oidFieldName

        if self.outIsRaster:
            #### Set All Flags to False ####
            self.workspace = None
            self.inFlags = self.setNewFieldTypesRaster()
        else:
            if not hasattr(self.info, "workspace"):
                #### E.g. Joins ####
                self.workspace = None
                self.inFlags = self.setNewFieldTypesDescribe(self.info)
            else:
                #self.workspace = self.info.workspace
                #self.inFlags = self.setNewFieldTypesWorkspace(self.workspace)

                #### Try/Except Catch for workspace (NetCDF To Layer Issue) ####
                #### Says hasattr() but fails in above else ####
                try:
                    self.workspace = self.info.workspace
                    self.inFlags = self.setNewFieldTypesWorkspace(self.workspace)
                except:
                    self.workspace = None
                    self.inFlags = self.setNewFieldTypesDescribe(self.info)

        try:
            self.inPath, self.inName = OS.path.split(inData)
        except:
            self.inPath = None
            self.inName = inData

        self.hasOutput = False
        self.masterIs64 = self.hasOID64
        self.allFields = {}
        for fieldObject in self.info.fields:
            self.allFields[fieldObject.name.upper()] = fieldObject

        #### Add Output ####
        self.addOutput(outData)

        #### Store Bad FIeld Names ####
        self.badFieldNames = []

        #### Check OID ####
        if checkOID64:
            self.checkOID64Method()

        #### If SWM/GWT ####
        if weightsFile is not None:
            self.checkWeightsMasterFieldInfo()

        #### CHeck Fields ####
        self.checkFields(fields)

        #### Report Bad Fields ####
        self.reportBadFields()

    def setNewFieldTypesRaster(self):
        """Use this Method when the Data already exists and Describe has Workspace."""

        d = {}
        for newType in newFieldTypeFlags:
            d[newType.upper()] = False

        return d

    def setNewFieldTypesWorkspace(self, workspace):
        """Use this Method when the Data already exists and Describe has Workspace."""

        d = {}
        for newType in newFieldTypeFlags:
            d[newType.upper()] = getattr(workspace, newType, False)

        return d

    def setNewFieldTypesDescribe(self, describe):
        """Use this Method when the Data when Describe of Input or Output does not have workspace."""

        d = {}
        for newType in newFieldTypeFlags:
            d[newType.upper()] = getattr(describe, newType, False)

        return d

    def setNewFieldTypesFolderExtension(self, extension):
        """Use this Method when the Data does not exist, lives in a Folder/File System."""

        d = {}
        for newType in newFieldTypeFlags:
            d[newType.upper()] = False

        if extension.upper() in ['CSV', 'TXT', ""]:
            d["SUPPORTSBIGINTEGER"] = True

        if extension == "":
            d["SUPPORTSBIGOBJECTID"] = True

        return d

    def checkInputType(self, newType):
        return self.inFlags[newType.upper()]

    def checkOutputType(self, newType):
        return self.outFlags[newType.upper()]

    def checkOID64Method(self):
        """Check Whether OIDs are Compatible with Output Workspace.."""

        if self.hasOID64 and not self.checkOutputType("SUPPORTSBIGOBJECTID"):
            self.badFieldNames.append(self.info.oidFieldName)

    def checkWeightsMasterFieldInfo(self):
        """Check Master Field."""

        weightSuffix = self.weightsFile.split(".")[-1].lower()
        swmFileBool = (weightSuffix == "swm")
        masterFieldUpper = None
        hasID64 = False
        if swmFileBool:
            #### SWM ####
            swm = WU.SWMReader(self.weightsFile, silentWarnings=True)
            if swm.invalid:
                ARCPY.AddIDMessage("ERROR", 110288)
                raise SystemExit

            self.masterFieldUpperName = swm.masterField.upper()
            hasID64 = swm.hasID64
            swm.fo.close()

        else:
            #### Text Weights ####
            fo, info = WU.textWeightsHeader(self.weightsFile)
            isGAL = weightSuffix == "gal"
            if isGAL:
                masterFieldInd = -2
            else:
                masterFieldInd = -1

            headerInfo = info.split()
            fo.close()
            if len(headerInfo) > 1 or (not isGAL):
                self.masterFieldUpperName = headerInfo[masterFieldInd].upper()

        if hasID64:
            uniqueIDType = "BigInteger"
        else:
            uniqueIDType = "Long"

        if self.masterFieldUpperName is not None:
            #### Master Field From Weights File Read, Check Inside Input and Type ####
            masterFCField = None
            badMaster = True
            if self.ssdo.hasJoin:
                for fcName, fcField in self.ssdo.allFields.items():
                    if fcField.baseName.upper() == self.masterFieldUpperName:
                        masterFCField = fcField
                        badMaster = False
                        break
            else:
                if self.masterFieldUpperName in self.ssdo.allFields:
                    masterFCField = self.ssdo.allFields[self.masterFieldUpperName]
                    badMaster = False

            if badMaster:
                ARCPY.AddIDMessage("ERROR", 949, self.masterFieldUpperName, self.weightsFile)
                raise SystemExit

            else:
                #### Check Master Field Comptibility ####
                isBigInteger = masterFCField.type.upper() == "BIGINTEGER"

                if isBigInteger:
                    upperFlag = newFieldTypeToFlag["BIGINTEGER"]
                    checkOutType = self.checkOutputType(upperFlag)
                    if not checkOutType:
                        self.badFieldNames.append(masterFCField.name)

                #### Assure Master Field Int Compatibility ####
                compatible = True
                if hasID64 and not isBigInteger:
                    compatible = False
                if not hasID64 and isBigInteger:
                    compatible = False

                if not compatible:
                    ARCPY.AddIDMessage("ERROR", 110516, uniqueIDType, masterFCField.type)
                    raise SystemExit
        else:
            #### No Master Field, Fail Out ####
            ARCPY.AddIDMessage("ERROR", 110288)
            raise SystemExit

    def checkFields(self, fields, silent = True):
        """Check Whether Fields are Compatible with Output Workspace. 
        
        NOTES:
            Only returns the first instance of a failure.
        """

        if self.hasOutput:
            for fieldName in fields:
                try:
                    field = self.allFields[fieldName.upper()]
                except:
                    ARCPY.AddIDMessage("ERROR", 728, fieldName)
                    raise SystemExit
                upperType = field.type.upper()
                if upperType in newFieldTypes:
                    upperFlag = newFieldTypeToFlag[upperType]
                    checkOutType = self.checkOutputType(upperFlag)
                    if not checkOutType:
                        self.badFieldNames.append(field.name)

    def addOutput(self, outData):
        self.hasOutput = True
        self.outData = outData 
        if ARCPY.Exists(outData):
            describe = ARCPY.Describe(outData)
            if hasattr(describe, "workspace"):
                self.outFlags = self.setNewFieldTypesWorkspace(describe.workspace)
            else:
                self.outFlags = self.setNewFieldTypesDescribe(describe)
        else:
            outPath, outName = OS.path.split(outData)
            if not ARCPY.Exists(outPath):
                ARCPY.AddIDMessage("ERROR", 210, self.outData)
                raise SystemExit()
            workspaceType = getBaseWorkspaceType(outPath)
            self.workspaceType = workspaceType
            if workspaceType.upper() in ["FOLDER", "FILESYSTEM"]:
                extension = OS.path.splitext(outName)[-1].strip(".")
                self.outFlags = self.setNewFieldTypesFolderExtension(extension)
            else:
                describe = ARCPY.Describe(outPath)
                self.outFlags = self.setNewFieldTypesDescribe(describe)

    def reportBadFields(self):
        if len(self.badFieldNames):
            badString = ", ".join(self.badFieldNames)
            ARCPY.AddIDMessage("ERROR", 110517, badString)
            raise SystemExit

class OutputOnlyFieldTypeChecker(object):
    """Class that stores the new types of fields allowed in a given input.  
    There are also methods that will do the same for outputs and can throw runtime
    errors when incompatibilities exist.

    INPUTS:
    inData (str, object, layer, table, file): input data

    METHODS:
    setNewFieldTypes()
    checkNewFieldTypesOutput(output, fieldList = [], throwError = False)
    checkOID()

    ATTRS:

    """

    def __init__(self, outputParameter, isUI = False):
        #### Input ####
        self.isUI = isUI
        self.outputParameter = outputParameter
        if isUI:
            self.outPath, self.outName = OS.path.split(outputParameter.valueAsText)
        else:
            self.outPath, self.outName = OS.path.split(outputParameter)

        if not ARCPY.Exists(self.outPath):
            if isUI:
                self.outputParameter.setIDMessage("ERROR", 210, self.outputParameter)
            else:
                ARCPY.AddIDMessage("ERROR", 210, self.outputParameter)
                raise SystemExit()

        self.info = ARCPY.Describe(self.outPath)
        self.setFlags()
        self.badFieldNames = []

    def setNewFieldTypesDescribe(self, describe):
        """Use this Method when the Data when Describe of Input or Output does not have workspace."""

        d = {}
        for newType in newFieldTypeFlags:
            d[newType.upper()] = getattr(describe, newType, False)

        return d

    def setNewFieldTypesFolderExtension(self, extension):
        """Use this Method when the Data does not exist, lives in a Folder/File System."""

        d = {}
        for newType in newFieldTypeFlags:
            d[newType.upper()] = False

        if extension.upper() in ['CSV', 'TXT', ""]:
            d["SUPPORTSBIGINTEGER"] = True

        if extension == "":
            d["SUPPORTSBIGOBJECTID"] = True

        return d

    def checkOutputType(self, newType):
        return self.outFlags[newType.upper()]

    def checkOID64(self, silent = True):
        """Check Whether OIDs are Compatible with Output Workspace.."""

        if self.checkOutputType("SUPPORTSBIGOBJECTID"):
            if not silent:
                self.badFieldNames.append(self.info.oidFieldName)

    def setFlags(self):
        workspaceType = getBaseWorkspaceType(self.outPath)
        if workspaceType.upper() in ["FOLDER", "FILESYSTEM"]:
            extension = OS.path.splitext(self.outName)[-1].strip(".")
            self.outFlags = self.setNewFieldTypesFolderExtension(extension)
        else:
            self.outFlags = self.setNewFieldTypesDescribe(self.info)

    def checkFieldTypes(self, fieldNames, fieldTypes):
        for ind, fieldType in enumerate(fieldTypes):
            upperType = fieldType.upper()
            if upperType in newFieldTypeToFlag:
                flag = self.checkOutputType(newFieldTypeToFlag[upperType])
                if not flag:
                    self.badFieldNames.append(fieldNames[ind])
        if len(self.badFieldNames):
            badString = ", ".join(self.badFieldNames)
            if self.isUI:
                self.outputParameter.setIDMessage("ERROR", 110517, badString)
            else:
                ARCPY.AddIDMessage("ERROR", 110517, badString)
                raise SystemExit()

class NewFieldTypeChecker(object):
    """Class that stores the new types of fields allowed in a given input.  
    There are also methods that will do the same for outputs and can throw runtime
    errors when incompatibilities exist.

    INPUTS:
    inData (str, object, layer, table, file): input data

    METHODS:
    setNewFieldTypes()
    checkNewFieldTypesOutput(output, fieldList = [], throwError = False)
    checkOID()

    ATTRS:

    """

    def __init__(self, inData):
        #### Input ####
        self.inData = inData
        self.info = ARCPY.Describe(inData)
        self.workspaceType = None

        if not hasattr(self.info, "HasOID64"):
            self.hasOID64 = False
        else:
            self.hasOID64 = self.info.HasOID64
        self.oidName = self.info.oidFieldName

        if not hasattr(self.info, "workspace"):
            #### E.g. Joins ####
            self.workspace = None
            self.inFlags = self.setNewFieldTypesDescribe(self.info)
        else:
            #self.workspace = self.info.workspace
            #self.inFlags = self.setNewFieldTypesWorkspace(self.workspace)

            #### Try/Except Catch for workspace (NetCDF To Layer Issue) ####
            #### Says hasattr() but fails in above else ####
            try:
                self.workspace = self.info.workspace
                self.inFlags = self.setNewFieldTypesWorkspace(self.workspace)
            except:
                self.workspace = None
                self.inFlags = self.setNewFieldTypesDescribe(self.info)

        try:
            self.inPath, self.inName = OS.path.split(inData)
        except:
            self.inPath = None
            self.inName = inData

        self.hasOutput = False
        self.masterIs64 = self.hasOID64
        self.allFields = {}
        for fieldObject in self.info.fields:
            self.allFields[fieldObject.name.upper()] = fieldObject

    def setNewFieldTypesWorkspace(self, workspace):
        """Use this Method when the Data already exists and Describe has Workspace."""

        d = {}
        for newType in newFieldTypeFlags:
            d[newType.upper()] = getattr(workspace, newType, False)

        return d

    def setNewFieldTypesDescribe(self, describe):
        """Use this Method when the Data when Describe of Input or Output does not have workspace."""

        d = {}
        for newType in newFieldTypeFlags:
            d[newType.upper()] = getattr(describe, newType, False)

        return d

    def setNewFieldTypesFolderExtension(self, extension):
        """Use this Method when the Data does not exist, lives in a Folder/File System."""

        d = {}
        for newType in newFieldTypeFlags:
            d[newType.upper()] = False

        if extension.upper() in ['CSV', 'TXT', ""]:
            d["SUPPORTSBIGINTEGER"] = True

        if extension == "":
            d["SUPPORTSBIGOBJECTID"] = True

        return d

    def checkInputType(self, newType):
        return self.inFlags[newType.upper()]

    def checkOutputType(self, newType):
        return self.outFlags[newType.upper()]

    def checkOID64(self, silent = True):
        """Check Whether OIDs are Compatible with Output Workspace.."""

        if self.hasOID64 and not self.checkOutputType("SUPPORTSBIGOBJECTID"):
            if not silent:
                ARCPY.AddIDMessage("ERROR", 2809, self.info.oidFieldName, self.inName)
                raise SystemExit()
            return False, self.info.oidFieldName, self.inName
        else:
            return True, None, None

    def checkMasterField(self, masterField, silent = True):
        """Check Whether MasterField is Compatible with Output Workspace.."""

        self.masterField = masterField
        self.masterIsOID = self.masterField == self.oidName
        if self.masterIsOID:
            boolRes, oidName, inName = self.checkOID64(silent = silent)
            return boolRes, oidName, inName
        else:
            masterFieldObject = self.allFields[masterField.upper()]
            self.masterIs64 = masterFieldObject.type.upper() == "BIGINTEGER"
            if self.masterIs64 and not self.checkOutputType("SUPPORTSBIGINTEGER"):
                if not silent:
                    ARCPY.AddIDMessage("ERROR", 2809, masterField, self.inName)
                    raise SystemExit()
                return False, masterField, self.inName
            else:
                return True, None, None

    def checkFields(self, fields, silent = True):
        """Check Whether Fields are Compatible with Output Workspace. 
        
        NOTES:
            Only returns the first instance of a failure.
        """

        if self.hasOutput:
            for fieldName in fields:
                field = self.allFields[fieldName.upper()]
                upperType = field.type.upper()
                if upperType in newFieldTypes:
                    upperFlag = newFieldTypeToFlag[upperType]
                    checkOutType = self.checkOutputType(upperFlag)
                    if not checkOutType:
                        if not silent:
                            ARCPY.AddIDMessage("ERROR", 2809, field.name, self.inName)
                            raise SystemExit()
                        return False, field.name, self.inName 

        return True, None, None

    def addOutput(self, outData):
        self.hasOutput = True
        self.outData = outData 
        if ARCPY.Exists(outData):
            describe = ARCPY.Describe(outData)
            if hasattr(describe, "workspace"):
                self.outFlags = self.setNewFieldTypesWorkspace(describe.workspace)
            else:
                self.outFlags = self.setNewFieldTypesDescribe(describe)
        else:
            outPath, outName = OS.path.split(outData)
            if not ARCPY.Exists(outPath):
                ARCPY.AddIDMessage("ERROR", 210, self.outData)
                raise SystemExit()
            workspaceType = getBaseWorkspaceType(outPath)
            self.workspaceType = workspaceType
            if workspaceType.upper() in ["FOLDER", "FILESYSTEM"]:
                extension = OS.path.splitext(outName)[-1].strip(".")
                self.outFlags = self.setNewFieldTypesFolderExtension(extension)
            else:
                describe = ARCPY.Describe(outPath)
                self.outFlags = self.setNewFieldTypesDescribe(describe)

    def createFeatureClass(self, outputFC, shapeType, mFlag, zFlag, spatialRef):
        """Create Output Feature Class while honoring 64bitOID Inputs.
        
        INPUTS:
        outputFC (str, object, layer): output features
        shapeType (str): "POINT", "POLYGON", "POLYLINE", "MULTIPOINT"
        mFlag (bool): whether to allow M values
        zFlag (bool): whether to allow Z values
        spatialRef (str, object): spatial reference string or object
        """
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84003))
        outPath, outName = getOutputInfo(outputFC, workspaceType = self.workspaceType)

        try:
            DM.CreateFeatureclass(outPath, outName, shapeType, "", mFlag, 
                                  zFlag, spatialRef)
        except:
            LOGGER.error(210, extra={"message_ID": 210, "add_arugment1": outputFC})
            raise SystemExit()

        #### Upgrade to 64Bit OID ####
        if self.masterIs64:
            try:
                DM.MigrateObjectIDTo64Bit(in_datasets = outputFC)
            except:
                #### Temp Try Except Until They Fix HasOID64 on Describe ####
                pass

def getOutputInfo(outputData, workspaceType = None):
    outPath, outName = OS.path.split(outputData)
    if workspaceType is None:
        workspaceType = getBaseWorkspaceType(outPath)
    if workspaceType.upper() == 'REMOTEDATABASE':
        outName = outName.split(".")[-1]
    elif workspaceType.upper() == "MOBILE":
        outName = outName.split("main.")[-1]
    else:
        lowerPath = outPath.lower()
        if lowerPath.endswith(".sqlite") or lowerPath.endswith(".gpkg"):
            outName = outName.split("main.")[-1]

    return outPath, outName

def getLocalizedUnitType(unit):
    lowerUnit = unit.lower()
    if lowerUnit not in localizableUnit:
        return lowerUnit
    else:
        return localizableUnit[lowerUnit].strip("{0} ")

def hasActiveMap():
    if inProApp():
        project = MP.ArcGISProject('CURRENT')
        map = project.activeMap
        if map is None:
            return False
        else:
            return True
    else:
        return False

def getGroupLayerBaseNames(layers):
    outLayers = []
    project = MP.ArcGISProject('CURRENT')
    map = project.activeMap
    if map is None:
        #### No Map ####
        return layers

    for layer in layers:
        lPath, lName = OS.path.split(layer)
        if lPath == "":
            #### No Prefix ####
            outLayers.append(layer)  
        else:
            inputLayer = map.listLayers(lPath)
            if not len(inputLayer):
                #### Prefix is not a Layer ####
                outLayers.append(layer)
            else:
                if inputLayer[0].isGroupLayer:
                    outLayers.append(lName)
                else:
                    outLayers.append(layer)

    return outLayers

def hasUniqueOutputs(outputList, throwError = False):
    outputList = [i for i in outputList if i not in ["", None]]
    if not len(outputList):
        #### No Outputs ####
        return True

    else:
        outputList = []
        for path in outputList:
            if ".SDE" in path.upper():
                outputList.append(path)
            else:
                outputList.append(OS.path.splitext(path)[0])

        unique = len(outputList) == len(set(outputList))

        if throwError and not unique:
            ARCPY.AddIDMessage("ERROR", 110462)
            raise SystemExit

        return unique

def hasCatVar(paramNumber, parameters):
    explanatoryVariables = getTextParameter(paramNumber, parameters)
    if explanatoryVariables is None:
        return False

    explanatoryVariables = explanatoryVariables.upper().split(";")
    catTypes = [True , "true", "CATEGORICAL", "TRUE"]

    for varEntry in explanatoryVariables:
        varName, varType = varEntry.split(" ")
        if varType in catTypes:
            return True 

    return False

def splitIndCatVarParam(paramNumber, parameters):
    explanatoryVariables = getTextParameter(paramNumber, parameters)
    if explanatoryVariables is None:
        #### Empty ####
        return None, None, None

    explanatoryVariables = explanatoryVariables.upper().split(";")
    indVarNames = []
    catVarNames = []
    splitVarTypes = []
    catTypes = [True , "true", "CATEGORICAL", "TRUE"]

    for varEntry in explanatoryVariables:
        varName, varType = varEntry.split(" ")
        if varType in catTypes:
            catVarNames.append(varName)
            splitVarTypes.append(1)
        else:
            indVarNames.append(varName)
            splitVarTypes.append(0)

    if not len(indVarNames):
        indVarNames = None

    if not len(catVarNames):
        catVarNames = None

    return indVarNames, catVarNames, splitVarTypes

def splitMatchIndCatVarParam(paramNumber, parameters, splitVarTypes):
    explanatoryVariableMatching = parameters[paramNumber].value
    if explanatoryVariableMatching is None:
        #### Empty ####
        return [], []

    matchIndVarNames = []
    matchCatVarNames = []
    for vInd, vRow in enumerate(explanatoryVariableMatching):
        if not hasattr(vRow[0], "value"):
            predVarName = vRow[0].upper()
        else:
            predVarName = vRow[0].value.upper()

        splitVarType = splitVarTypes[vInd]
        if splitVarType == 0:
            matchIndVarNames.append(predVarName)
        else:
            matchCatVarNames.append(predVarName)

    return matchIndVarNames, matchCatVarNames

def checkCategoricalTypes(parameters, inputFeaturesID, explanatoryID, predictionFeaturesID, matchID):
    """Method to assure that Category Var Types Match.  TEXT with TEXT and NUMERIC with NUMERIC."""

    indVarNames, catVarNames, splitVarTypes = splitIndCatVarParam(explanatoryID, parameters)
    varMatch, catMatch = splitMatchIndCatVarParam(matchID, parameters, splitVarTypes)
    inputFC = getTextParameter(inputFeaturesID, parameters)
    featuresToPredict = getTextParameter(predictionFeaturesID, parameters)
    if len(catMatch) or len(varMatch):
        wrongTypes = []
        try:
            fieldsIn = {}
            descIn = ARCPY.Describe(inputFC)
            for i in descIn.fields:
                fieldsIn[i.name.upper()] = i

            fieldsPred = {}
            descPred = ARCPY.Describe(featuresToPredict)
            for i in descPred.fields:
                fieldsPred[i.name.upper()] = i

            #### Make Sure Cat Train Vars Match w/ Cat Pred Vars: I.e. Numeric/Numeric, Text/Text ####
            if len(catMatch):
                for catInd, catIn in enumerate(catVarNames):
                    inIsNumeric = fieldsIn[catIn.upper()].type.upper() in numericTypes
                    matchIsNumeric = fieldsPred[catMatch[catInd].upper()].type.upper() in numericTypes
                    if inIsNumeric != matchIsNumeric:
                        wrongTypes.append(catMatch[catInd].upper())
                        break

            #### Make Sure Match Non-Categorical Var Names are Numeric ####
            if len(varMatch) and not len(wrongTypes):
                for varMatchName in varMatch:
                    if fieldsPred[varMatchName.upper()].type.upper() not in numericTypes:
                        wrongTypes.append(varMatchName.upper())
                        break
        except:
            pass

        if len(wrongTypes):
            ARCPY.AddIDMessage("ERROR", 378, wrongTypes[0])
            raise SystemExit()

def isShapeFileOrDBF(inputFC, desc = None):
    """Returns whether the input feature class is a shapefile or dbf table.

    INPUTS:
    inputFC (str): catalogue path to the feature class
    desc (obj, optional): optional previous call to describe(inputFC)

    OUTPUT:
    return (bool): is the inputFC a shapefile or dbf table?
    """

    isSHPOrDBF = False
    if desc is None:
        desc = ARCPY.Describe(inputFC)
    baseFile = OS.path.basename(desc.catalogPath)
    try:
        splitBase = baseFile.split(".")
        if splitBase[-1].upper() == "SHP" or splitBase[-1].upper() == "DBF":
            isSHPOrDBF = True
    except:
        pass

    return isSHPOrDBF

def checkForDuplicateOutput(outputName, workSpace, count, ext =""):
    if count == 0:
        outputFile = OS.path.join(workSpace, outputName + ext)
    else:
        outputFile = OS.path.join(workSpace, outputName+ str(count)+ ext)
    if ARCPY.Exists(outputFile):
        return checkForDuplicateOutput(outputName, workSpace, count + 1, ext)
    else:
        return outputFile

def inProApp():
    return OS.path.split(SYS.executable)[-1].upper() in ['ARCGISPRO.EXE', 'ARCGISALLSOURCE.EXE']

def checkPositive(data):
    """Assure all values are positive.

    INPUTS:
    data (array): data to check
    """

    if (data < 0.0).sum() != 0:
        ARCPY.AddIDMessage("ERROR", 110240)
        raise SystemExit()

def createCountVariable(data):
    """Return valid count variable.
    
    INPUTS:
    data (array): data to check

    RETURN (array): rounded data
    """

    #### Check That All Input Values are Positive ####
    checkPositive(data)

    #### Round and Warn if Necessary ####
    roundData = NUM.round(data)
    if not NUM.allclose(data, roundData):
        ARCPY.AddIDMessage("WARNING", 110237)

    return roundData

def createBinaryVariable(data):
    """Return valid binary variable.
    
    INPUTS:
    data (array): data to check

    RETURN (array): rounded binary data
    """

    #### Check That All Input Values are Positive ####
    checkPositive(data)

    #### Round and Warn if Necessary ####
    roundData = NUM.round(data)
    if not NUM.allclose(data, roundData):
        ARCPY.AddIDMessage("WARNING", 110238)

    #### Error if not in [0,1] ####
    if (roundData > 1.0).sum() != 0:
        ARCPY.AddIDMessage("ERROR", 110239)
        raise SystemExit()

    return roundData

def convertDistances(ssdo, userUnitName, distances):
    #### Convert to User Linear Unit if Different ####
    inputUnitName = ssdo.distanceInfo.name
    if inputUnitName != userUnitName:
        d = []
        for inputDist in distances:
            d.append(ssdo.distanceInfo.convertInputLinearUnit(inputDist,
                                                              userUnitName))
        return NUM.array(d, dtype = float)
    else:
        return distances

def getMannKendallDirStr(mkVal, mkPVal):
    if mkPVal <= .1:
        if mkVal > 0:
            direction = ARCPY.GetIDMessage(84578)
            trendString = ARCPY.GetIDMessage(84616)
        else:
            direction = ARCPY.GetIDMessage(84579)
            trendString = ARCPY.GetIDMessage(84617)
    else:
        direction = ARCPY.GetIDMessage(84580)
        trendString = ARCPY.GetIDMessage(84615)

    return direction, trendString

def padStdMinMaxAxes(minStdValue, maxStdValue):
    minValue = minStdValue - .1
    intValue = minValue // 1
    remainder = abs(abs(intValue) - abs(minValue))
    if minValue < 0.0:
        minValue = intValue
        if remainder >= .5:
            minValue += .5
    else:
        minValue = intValue
        if remainder >= .5:
            minValue += .5

    maxValue = maxStdValue + .1
    intValue = maxValue // 1
    intValue += 1.0
    remainder = abs(abs(intValue) - abs(maxValue))
    if maxValue < 0.0:
        maxValue = intValue
        if remainder >= .5:
            maxValue -= .5
    else:
        maxValue = intValue
        if remainder >= .5:
            maxValue -= .5

    return minValue, maxValue

def getSquareStdScatterAxes(minStdValue, maxStdValue):
    minValue, maxValue = padStdMinMaxAxes(minStdValue, maxStdValue)
    if (abs(minValue) > abs(maxValue)):
        return minValue, abs(minValue)
    else:
        return -1*maxValue, maxValue

def getValidAggregateFieldName(varName, outPath):
    validName = ARCPY.ValidateFieldName(varName, outPath)
    if varName != validName:
        #### Shape File and Special Chars ####
        maxLen = max(len(validName), 10)
        splitName = varName.split("_")
        numSplits = len(splitName)
        isAggVar = False
        if numSplits > 2:
            try:
                aggCode = aggTypeOutDict[splitName[-2]]
                predCode = predTypeOutDict[splitName[-1]]
            except:
                pass
        if isAggVar:
            validName = varName[0:maxLen - 2] + "_{01}"
            validName = validName.format(aggCode, predCode)
    else:
        validName = varName

    return validName

def getProcessThreadIDs():
    """Returns the thread and process IDs."""

    thread = THREADING.current_thread()
    return thread.ident, OS.getpid()

def isNumeric(x):
    try:
        x + 1
        return True
    except TypeError:
        return False

def fieldIsNumeric(fieldType):
    return fieldType.upper() in numericTypes

def returnSpaceUnit(value):
    if value in spaceUnit:
        return spaceUnit[value]
    else:
        return value

def strToFloat(floatAsStr):
    """Robust Methodology to Convert to and From Alternative Locale Decimals.

    INPUT:
    floatAsStr (str): numeric rep of a float

    RETURN:
    value (float): resulting float
    """

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

def humanReadableFloatStr(value, formatStr = "%0.6f"):
    """Returns a human readable string version of a float or integer. (1)

    INPUT:
    value (float/int): input value

    OUTPUT:
    strValue (str): human readable string value
    formatStr (str): c-type floating point format str

    NOTES:
    (1) "Human Readable for an Integer would remove any remainder = 0.  
    Floats are formated at the 6th decimal and all trailing zeros are removed.
    """

    intValue = round(value)
    remainder = value - intValue
    if compareFloat(remainder, 0.0):
        strValue = "%i" % value
    else:
        strValue = LOCALE.format_string(formatStr, value)
        strValue = strValue.strip("0")
        if strValue[-1] == ".":
            strValue = strValue[0:-1]

    return strValue

def getDisplayUnit(linearUnit, cellSize = None):
    """Returns a linear unit in singular or plural form for printing.

    INPUT:
    linearUnit (str): from spatial ref, E.g. FOOT, METER etc...
    cellSize {float/int, None}: 1 will return singular version, 
                                anything else will be plural.

    OUTPUT:
    displayUnit (str): singular or plural linear unit w/ capitalization
    """

    upperUnit = linearUnit.upper().replace(" ", "_")
    if upperUnit in distanceUnitInfo:
        displayUnit = distanceUnitInfo[upperUnit][0]
    else:
        displayUnit = linearUnit

    if compareFloat(cellSize, 1.0):
        if displayUnit in pluralConvert:
            displayUnit = pluralConvert[displayUnit]
    if '_' in displayUnit:
        displayUnit = displayUnit.replace("_", " ")
    return displayUnit

def getDisplayTimeUnit(timeUnit, timeSize = None):
    if timeSize == 1:
        timeUnit = timeUnit[:-1]
    return timeUnit.title()

def prettyUnits(cellSize, linearUnit, area = False, formatStr = "%0.6f", localizeUnit=False):
    displayUnit = getDisplayUnit(linearUnit, cellSize = cellSize)
    strCellSize = humanReadableFloatStr(cellSize, formatStr = formatStr)
    
    #### Remove 'US' for Printing ####
    if "STATUTE" not in displayUnit.upper():
        displayUnit = displayUnit.strip("US ")

    if area:
        label = "{0} {1}".format("square", displayUnit.lower())
        if label in localizableUnit and localizableUnit:
            return localizableUnit[label].format(strCellSize)
        else:
            return "{0} {1} {2}".format(strCellSize, "square", displayUnit.lower())
    else:
        label = displayUnit.lower()
        if label in localizableUnit and localizableUnit:
            return localizableUnit[label].format(strCellSize)
        else:
            return "{0} {1}".format(strCellSize, displayUnit.lower())

def convertProjectedDistance(linearUnitIn, linearUnitOut, value):
    if linearUnitIn == linearUnitOut:
        return value

    meterName, meterConvert = distanceUnitInfo[linearUnitIn]
    meterValue = value * meterConvert

    outName, outConvert = distanceUnitInfo[linearUnitOut]
    outValue = meterValue / outConvert

    return outValue

def inv_weight(point1, point2, exponent):
    """ Calculate the inverse distance
    INPUT:
    point1 {array (n,1) float}: initial point
    point2 {array (n,1) float}: end point
    exponent {float}: inverse distance power
    OUTPUT:
    weight_distance {float}: inverse dinstance
    """
    diff = (point1 - point2)**2.0
    distance = NUM.sqrt(diff.sum())
    if distance <= 1.0:
        return 1.0
    else:
        return 1.0 / distance**exponent

######################## Robust 2 to 3 Methods #########################

def arraySummaryStats(data):
    minData = data.min()
    maxData = data.max()
    meanData = data.mean()
    medianData = NUM.ma.median(data)
    stdData = data.std()

    return minData, maxData, meanData, medianData, stdData

def getSelectionType(layer):
    if not isThree():
        return "NEW_SELECTION"
    else:
        info = ARCPY.Describe(layer)
        fidSet = info.FIDSet
        if fidSet == "":
            return "NEW_SELECTION"
        else:
            return "SUBSET_SELECTION"

def roof(value):
    """Rounds up to nearest integer."""

    return int(value) + 1

def dot(m, n):
    """
    Calculate dot product 3x3 without numpy optimization
    """
    a00 = (m[0] * n[:,0]).sum()
    a10 = (m[1] * n[:,0]).sum()
    a20 = (m[2] * n[:,0]).sum()
    a01 = (m[0] * n[:,1]).sum()
    a11 = (m[1] * n[:,1]).sum()
    a21 = (m[2] * n[:,1]).sum()
    a02 = (m[0] * n[:,2]).sum()
    a12 = (m[1] * n[:,2]).sum()
    a22 = (m[2] * n[:,2]).sum()
    return NUM.array([[a00, a01, a02], [a10, a11, a12], [a20, a21, a22]])


def isThree():
    """Returns boolean indicating whether Python 3."""

    return SYS.version_info.major == 3

def formatString(str2Format):
    if not isThree():
        return str(str2Format)
    else:
        return str2Format

def decodeString(str2Format):
    if not isPRO():
        str2Format = str2Format.decode('utf-8')
    return str2Format

def canMakeGraph():
    """Returns boolean indicating whether DM.MakeGraph will work.
    False for ProApp and 64-bit Background.
    """

    #### Can't be Linux ####
    if "WIN" not in SYS.platform.upper():
        return False

    #### Can't be Pro App ####
    if isThree():
        return False

    #### Can't be 64-Bit Background ####
    arcInfo = ARCPY.GetInstallInfo()
    isDesktop = arcInfo['ProductName'].upper() == "DESKTOP"
    is64 = SYS.version.upper().count("64 BIT")
    if isDesktop and is64:
        return False
    else:
        return True

def isPRO():
    """Return boolean indicating whether script is running in PRO
    """

    arcInfo = ARCPY.GetInstallInfo()
    productName = arcInfo['ProductName'].upper() 
    isPro = False
    if productName in ["ARCGISPRO","ARCGISALLSOURCE"]:
        isPro = True
    if productName == "SERVER":
        fileARC = ARC.__file__
        if r"bin/Python/envs" in fileARC.replace("\\","/"):
            isPro = True
    return isPro

def writeText(fo, info):
    """Python Version Robust Text Output."""
    if isThree():
        fo.write(info)
    else:
        fo.write(info.encode('utf-8'))

def writeTextBin(fo, info):
    if isThree():
        fo.write(bytes(info, 'utf-8'))
    else:
        fo.write(info.encode('utf-8'))

def returnStudyAreaPolygonFC(inputFC, polygonFC, clearExtent = True):
    """Assesses whether a densified copy of a polygon feature class is
    needed for accurate selection. (1)

    INPUTS:
    inputFC (str): path to input feature class
    polygonFC (str): path to polygon feature class
    clearExtent (bool): whether to honor the extent

    OUTPUT:
    polyName (str): path to analysis polygon feature class
    tempPoly (bool): whether a copy/densify was required.

    NOTES:
    (1): A copy and subsequenht densification is only needed if there are
    conflicting spatial references.
    """

    if clearExtent:
        oldExtent = ARCPY.env.extent
        ARCPY.env.extent = ""

    ssdoFC = SSDO.SSDataObject(inputFC)
    ssdoPoly = SSDO.SSDataObject(polygonFC)
    numPolys = getCount(polygonFC)
    if ssdoFC.spatialRef.name == ssdoPoly.spatialRef.name:
        polyName = polygonFC
        tempPoly = False
    else:
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(110034))
        polyName = returnScratchName("polygonFC_OHSA")
        DM.CopyFeatures(polygonFC, polyName)
        EDIT.Densify(polyName, "Distance", "10 kilometers")
        tempPoly = True

    ARCPY.env.extent = oldExtent

    return polyName, True

def linearUnitSplit(value):
    info = value.split(" ")
    if len(info) == 2:
        return info[0], info[1]
    else:
        return info[0], " ".join(info[1:])

def isString(item):
    try:
        return isinstance(item, basestring)
    except NameError:
        return isinstance(item, str)

def iteritems(d):
    try:
        return d.iteritems()
    except AttributeError:
        return d.items()

def itervalues(d):
    try:
        return d.itervalues()
    except AttributeError:
        return d.values()

def iterkeys(d):
    try:
        return d.iterkeys()
    except AttributeError:
        return d.keys()

def ssRange(*args):
    argsOut = tuple([ int(i) for i in args ])
    try:
        return xrange(*argsOut)
    except NameError:
        return range(*argsOut)

######################### General Functions ###########################

def passiveDelete(inputFC):
    """Passively tries to delete feature classes and layers.

    INPUTS:
    inputFC (str): path to the feature class or layer
    """

    try:
        DM.Delete(inputFC)
    except:
        pass

def canProjectExtent(inExtent, outSpatialRef):
    """Whether the input spatial ref and output spatial ref are transformable.

    INPUTS:
    inExtent (object): input extent object
    outSpatialRef (object): output spatial ref
    """
    projectedExtent = inExtent.polygon.projectAs(outSpatialRef)
    if projectedExtent.length > 0.0:
        return True
    else:
        return False

def createCell(x, y, cellSize = 1.0):
    """Create a bounding polygon cell list from a given centroid."""

    halfCell = cellSize * .5
    x -= halfCell
    y += halfCell

    return [ (x,y), (x+cellSize, y), (x+cellSize, y-cellSize),
             (x, y-cellSize), (x,y) ]

def createHexOld(x, y, cellSize = 1.0):
    """Create a bounding polygon hex list from a given centroid."""

    angles = NUM.arange(6) * NUM.pi / 3.0
    return [ (MATH.cos(ang) * cellSize + x, MATH.sin(ang) * cellSize + y) for ang in angles] 

def createHex(x, y, cellSize = 1.0):
    halfCell = cellSize * .5
    height = cellSize * NUM.sqrt(3.0)
    halfHeight = height * .5

    return [ (x - halfCell, y + halfHeight), (x + halfCell, y + halfHeight),
             (x + cellSize, y), (x + halfCell, y - halfHeight),
             (x - halfCell, y - halfHeight), (x - cellSize, y), 
             (x - halfCell, y + halfHeight) ]

def createCellPolygon(x, y, cellSize = 1.0, spatialRef = None, outSpatialRef = None):
    """Creates a Bounding Polygon from a vertex origin."""

    polyArray = ARCPY.Array()
    points = createCell(x, y, cellSize = cellSize)
    for x0,y0 in points:
        pointOut = ARCPY.Point(x0, y0)
        polyArray.add(pointOut)

    polygon = ARCPY.Polygon(polyArray, spatialRef)

    if outSpatialRef is not None:
        polygon = polygon.projectAs(outSpatialRef)

    return polygon 

def createHexPolygon(x, y, cellSize = 1.0, spatialRef = None, outSpatialRef = None):
    """Creates a Bounding Polygon from a vertex origin."""

    polyArray = ARCPY.Array()
    points = createHex(x, y, cellSize = cellSize)
    for x0,y0 in points:
        pointOut = ARCPY.Point(x0, y0)
        polyArray.add(pointOut)

    polygon = ARCPY.Polygon(polyArray, spatialRef)
    
    if outSpatialRef is not None:
        polygon = polygon.projectAs(outSpatialRef)

    return polygon 

def countNodes(mst, weights, n):
    counts = NUM.zeros(n, dtype = NUM.int32)
    sumWeights = NUM.zeros(n, dtype = float)
    for ind, link in enumerate(mst):
        counts[link[0]] += 1
        counts[link[1]] += 1
        sumWeights[link[0]] += weights[ind]
        sumWeights[link[1]] += weights[ind]

    return counts, sumWeights

def degreeCentrality(mst, weights, n, centralType = "COUNT"):
    counts, sumWeights = countNodes(mst, weights, n)
    if centralType == "COUNT":
        return NUM.argmax(counts)
    else:
        maxCount = counts.max()
        maxInd = NUM.where(counts == maxCount)
        weightInd = sumWeights[maxInd].argsort()
        if centralType == "LEVERAGE":
            ind2Choose = weightInd[0]
        else:
            ind2Choose = weightInd[-1]
        return maxInd[0][ind2Choose]


def returnDecimalChar():
    """Returns the decimal character based on the locale settings.
    """
    s = LOCALE.localeconv()
    return s['decimal_point']

def standardDistanceCutoff(xyCoords, stdDeviations = 1.0):
    """Returns the unweighted standard distance for a set of points.

    INPUTS:
    xyCoords (array) nx2 set of xy coordinates
    stdDeviations {float, 1.0}: number of standard devs around center
    """

    meanCenter = xyCoords.mean(0)
    devXY = xyCoords - meanCenter
    sigXY = (devXY**2.0).mean(0)
    return MATH.sqrt(sigXY.sum())

def maxDistanceCutoff(ssdo):
    """Returns the unweighted standard distance for a set of points.

    INPUTS:
    ssdo (class) instance of SSDataObject (Data Obtained)
    """

    nRatio = ssdo.numObs * .68
    maxNumNeighs = WU.maxDefaultNumNeighs
    if nRatio < maxNumNeighs:
        #### If 68% of N is Less than 500, Use One Standard Distance ####
        maxDist = standardDistanceCutoff(ssdo.xyCoords)
    else:
        #### Use Near Tool to Find Distance that Contains 500 from MC ####
        xyCoords = ssdo.xyCoords
        meanCenter = xyCoords.mean(0)
        x,y = meanCenter
        outArray = NUM.array([(1, (x, y))],
                             NUM.dtype([('idfield', NUM.int32),
                                        ('XY', '<f8', 2)]))
        meanFC = "in_memory/meanCenterTemp"
        DA.NumPyArrayToFeatureClass(outArray, meanFC, ['XY'])

        nearTab = "in_memory/nearTabTemp"
        ANA.GenerateNearTable(meanFC, ssdo.inputFC, nearTab, "#",
                              "NO_LOCATION", "NO_ANGLE", "ALL",
                              maxNumNeighs)

        fieldNames = ['NEAR_DIST']
        distArray = DA.TableToNumPyArray(nearTab, fieldNames)
        maxDist = distArray['NEAR_DIST'].max()

        #### Clean Up ####
        passiveDelete(meanFC)
        passiveDelete(nearTab)

    return maxDist

def numCells(fullLength, cellLength):
    """Returns the number of rows/columns for a fishnet grid.

    INPUTS:
    fullLength (float): height/width of extent
    cellLength (float): length of a cell segment
    """

    return int(fullLength / cellLength) + 1

def createCutoffsStep(minDist, incDist, numInc):
    """Returns distance cutoffs for analysis based on starting distance.

    INPUTS:
    minDist (float): starting distance
    incDist (float): distance increment
    numInc (int): number of increments
    """

    cuts = [ ( (inc * incDist) + minDist ) for inc in ssRange(numInc) ]
    return NUM.array(cuts)

def createCutoffsMaxDist(minDist, maxDist, numInc):
    """Returns distance cutoffs for analysis based on ending distance.

    INPUTS:
    maxDist (float): ending distance
    numInc (int): number of increments
    """

    spanDist = maxDist - minDist
    incDist = spanDist / (numInc * 1.0)
    return NUM.arange(minDist, maxDist, incDist)

def returnRasterName(path2Raster):
    """Returns a valid raster dataset path."""

    #### Validate Output Workspace ####
    ERROR.checkOutputPath(path2Raster)

    #### Create Path for Output FC ####
    outPath, outName = OS.path.split(path2Raster)
    outShortName, outExt = OS.path.splitext(outName)

    #### Get Output Name for SDE if Necessary ####
    baseType = getBaseWorkspaceType(outPath).upper()
    if baseType == 'REMOTEDATABASE':
        outName = outName.split(".")[-1]
    elif baseType == 'FILESYSTEM':
        outName = outShortName + ".tif"
    else:
        outName = outShortName

    return OS.path.join(outPath, outName)

def fc2DensityRaster(inputFC, outputRaster, varName = None,
                     boundaryFC = None, searchRadius = None):
    """Creates a IDW Raster Surface using HotSpot Results.

    INPUTS:
    hotSpotFC (str): path to hot spot results
    outputRaster (str): path to output raster
    boundaryFC {str}: path to masked polygon features
    searchRadius {float}: must be in map spatial ref units
    """

    envMask = ARCPY.env.mask
    if envMask:
        try:
            #### Make Sure Mask Exists in Data Frame ####
            descMask = ARCPY.Describe(envMask)
            boundaryFC = envMask
        except:
            pass

    #### Get Valid Output Raster Path ####
    outputRaster = returnRasterName(outputRaster)
    outPath, outName = OS.path.split(outputRaster)
    ScratchWSKernelDensity = funWithScratchWS(SA.KernelDensity, outPath)
    ScratchWSExtract = funWithScratchWS(SA.ExtractByMask, outPath)

    desc = ARCPY.Describe(inputFC)
    oldExtent = ARCPY.env.extent
    renderTypeOut = renderType[desc.ShapeType.upper()]
    if renderTypeOut:
        #### Polygon or Line ####
        createTempFC = returnScratchName("Point_TempFC")
        DM.FeatureToPoint(inputFC, createTempFC)
        ARCPY.env.extent = desc.extent
        outRastFull = ScratchWSKernelDensity(createTempFC, varName,
                                             "", searchRadius)
        if boundaryFC:
            maskFC = boundaryFC
        else:
            maskFC = inputFC
        outRast = ScratchWSExtract(outRastFull, maskFC)
        DM.Delete(createTempFC)
        ARCPY.env.extent = oldExtent
    else:
        outRast = ScratchWSKernelDensity(inputFC, varName, "", searchRadius)
        if boundaryFC:
            outRast = ScratchWSExtract(outRast, boundaryFC)
    outRast.save(outputRaster)

def funWithXYTolerance(functionName, distanceInfo):
    """Sets the spatial ref env setting for the given function.

    INPUTS:
    functionName (obj): function to call with given args and extent cleared
    distanceInfo (class): distance information object
    """

    def innerFunction(*args, **kw):
        xyTolerance2Set = distanceInfo.joinXYTolerance()
        xyTolerance2SetBack = ARCPY.env.XYTolerance
        ARCPY.env.XYTolerance = xyTolerance2Set
        returnValue = functionName(*args, **kw)
        ARCPY.env.XYTolerance = xyTolerance2SetBack
        return returnValue

    return innerFunction

def funWithSpatialRef(functionName, spatialRef, outputFC = None):
    """Sets the spatial ref env setting for the given function.

    INPUTS:
    functionName (obj): function to call with given args and extent cleared
    spatialRef (class): spatial reference object
    """

    def innerFunction(*args, **kw):
        spatialRef2Set = returnOutputSpatialRef(spatialRef,
                                             outputFC = outputFC)
        spatialRef2SetBack = ARCPY.env.outputCoordinateSystem
        ARCPY.env.outputCoordinateSystem = spatialRef2Set
        returnValue = functionName(*args, **kw)
        ARCPY.env.outputCoordinateSystem = spatialRef2SetBack
        return returnValue

    return innerFunction

def funWithScratchWS(functionName, workspace):
    """Sets the spatial ref env setting for the given function.

    INPUTS:
    functionName (obj): function to call with given args and extent cleared
    workspace (class): path to scratch workspace
    """

    def innerFunction(*args, **kw):
        userWS2SetBack = ARCPY.env.scratchWorkspace
        ARCPY.env.scratchWorkspace = workspace
        returnValue = functionName(*args, **kw)
        ARCPY.env.scratchWorkspace = userWS2SetBack
        return returnValue

    return innerFunction

def isNumArray(param):
    return type(param) == NUM.ndarray

def getNumericParameter(paramNumOrName, parameters = None, defualt = None):
    """Obtains "optional" Float and Int parameters.

    INPUTS:
    paramNumOrName (int or str): parameter index or name
    parameters (list parameters) : list parameters (optional)

    RETURN (float/int, None): parameter value if set, None otherwise.
    """

    if isinstance(paramNumOrName, int):
        paramNum = paramNumOrName
        if parameters is None:
            value = ARCPY.GetParameterAsText(paramNum)
        else:
            value = parameters[paramNum].value
    elif isinstance(paramNumOrName, str):
        paramName = paramNumOrName
        if parameters is None:
            value = ARCPY.GetParameterInfo()[paramName].value
        else:
            value = None
            for param in parameters:
                if param.name == paramName:
                    value = param.value
                    break

    if value == "#" or value == "" or value == None:
        return None

    nValue = strToFloat(value)
    if defualt == "FLOAT":
        return nValue

    iValue = None
    try:
        iValue = int(value)
        if type(nValue) == float:
            if iValue == nValue:
                return iValue
            else:
                return nValue
    except:
        value = None

    return value

def setParameterAsText(paramNum, value, parameters = None):
    if parameters is None:
        ARCPY.SetParameterAsText(4, str(value))
    else:
        parameters[paramNum].value = value

def getInputAppendParameter(paramNum, parameters):
    if inProApp():
        return parameters[paramNum].value
    else:
        return parameters[paramNum].valueAsText

def getTextParameter(paramNumOrName, parameters = None, fieldName = False):
    """Obtains "optional" Field Parameters.

    INPUTS:
    paramNumOrName (int or str): parameter index or name
    parameters (list parameters) : list parameters (optional)

    RETURN (float/int, None): parameter value if set, None otherwise.
    """

    if isinstance(paramNumOrName, int):
        paramNum = paramNumOrName
        if parameters is None:
            value = ARCPY.GetParameterAsText(paramNum)
        else:
            value = parameters[paramNum].valueAsText
    elif isinstance(paramNumOrName, str):
        paramName = paramNumOrName
        if parameters is None:
            value = ARCPY.GetParameterInfo()[paramName].valueAsText
        else:
            value = None
            for param in parameters:
                if param.name == paramName:
                    value = param.valueAsText
                    break
    else:
        return None

    if value == "#" or value == "" or value == None:
        value = None
    if fieldName and value is not None:
        value = value.upper()

    return value

def getTextParameterMatch(paramNum, parameters = None, typeObject = ["MappingLayerObject"]):
    """Obtains "optional" Field Parameters.

    INPUTS:
    paramNum (int): parameter number
    parameters (list parameters) : list parameters (optional)

    RETURN (float/int, None): parameter value if set, None otherwise.
    """

    value = None
    if parameters is None:
        return None
    else:
        value = parameters[paramNum].value

    if value is None:
        return None
    try:

        if type(value) == list:
            nValues = []
            for i in value:
                v1 = None
                if hasattr(i[0], 'value'):
                    v1 = i[0].value
                val = [i[0] for el in  typeObject  if  el in str(type(i[0]))]
                if len(val):
                    v1 = i[0].name
                if type(i[0]) == str:
                    v1 = i[0]
                nValues.append([v1, i[1]])
            return nValues
    except:
        pass

    return parameters[paramNum].valueAsText

def getTextParameterMatchSingle(parameter, typeObject = ["MappingLayerObject"]):
    """Obtains "optional" Field/Distance Parameters.

    INPUTS:
    parameter: parameter match value

    RETURN (float/int, None): parameter value if set, None otherwise.
    """

    value = parameter.value

    if value is None:
        return None
    try:

        if type(value) == list:
            nValues = []
            for i in value:
                v1 = None
                if hasattr(i[0], 'value'):
                    v1 = i[0].value
                val = [i[0] for el in  typeObject  if  el in str(type(i[0]))]
                if len(val):
                    v1 = i[0].name
                if type(i[0]) == str:
                    v1 = i[0]
                nValues.append([v1, i[1]])
            return nValues
    except:
        pass

    return parameter.valueAsText

def getLinearUnitParameter(paramNumOrName, parameters = None):
    """Obtains "optional" linear unit parameter."""

    if isinstance(paramNumOrName, int):
        paramNum = paramNumOrName
        if parameters is None:
            distanceInterval = ARCPY.GetParameterAsText(paramNum)
        else:
            distanceInterval = parameters[paramNum].valueAsText
    elif isinstance(paramNumOrName, str):
        paramName = paramNumOrName
        if parameters is None:
            distanceInterval = ARCPY.GetParameterInfo()[paramName].valueAsText
        else:
            distanceInterval = None
            for param in parameters:
                if param.name == paramName:
                    distanceInterval = param.valueAsText
                    break
    else:
        return None, None

    if distanceInterval == "#" or distanceInterval == "" or distanceInterval == None:
        return None, None

    userCellSize, userCellUnit = distanceInterval.split(" ")
    userCellUnit = userCellUnit.upper().replace(" ", "_")
    if userCellSize != '':
        try:
            userCellSize = strToFloat(userCellSize)
        except:
            ARCPY.AddIDMessage("WARNING", 110009)

        if userCellUnit not in supportDist:
            ARCPY.AddIDMessage("ERROR", 110010)
            raise SystemExit()

        return userCellSize, userCellUnit

    return None, None

def getMultiFieldParameter(paramNumOrName, parameters = None):
    """Obtains "optional" Field Parameters.

    INPUTS:
    paramNumOrName (int or str): parameter index or name

    RETURN (float/int, None): parameter value if set, None otherwise.
        
    """
    if isinstance(paramNumOrName, int):
        paramNum = paramNumOrName
        if parameters is None:
            value = ARCPY.GetParameterAsText(paramNum)
        else:
            value = parameters[paramNum].valueAsText
    elif isinstance(paramNumOrName, str):
        paramName = paramNumOrName
        if parameters is None:
            value = ARCPY.GetParameterInfo()[paramName].valueAsText
        else:
            value = None
            for param in parameters:
                if param.name == paramName:
                    value = param.valueAsText
                    break
    else:
        return None

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

def avoidRepeatedOutputInParameters(parameters, listIndices, idError = 432):
    """"
    Check if the parameters are repeaded
    INPUT:
        paraeters (list parameters): parameters
        listIndices (list int): List of indices of output table/fc
        idError {int}: id error with %s to specity the name of the invalid output
    """
    names = {}
    for id in listIndices:
        if parameters[id].value:
            name = parameters[id].valueAsText.upper()
            if name in names:
                names[name].append(id)
            else:
                names[name]=[id]
    if len(names):
        for name in names:
            if len(names[name]) == 2:
                parameters[names[name][1]].setIDMessage("ERROR", idError, parameters[names[name][1]].valueAsText)
            if len(names[name]) == 3:
                parameters[names[name][1]].setIDMessage("ERROR", idError, parameters[names[name][1]].valueAsText)
                parameters[names[name][2]].setIDMessage("ERROR", idError, parameters[names[name][2]].valueAsText)


def openFile(fileName, ioString = "r"):
    """Wraps Python's File IO Pointer with ArcGIS Errors.

    INPUTS:
    fileName (str): path to the file
    ioSTring (str): io descriptor, e.g. "r", "rb", "wb"...

    RETURN:
    f (object): Python's IO File Pointer
    """

    try:
        if isThree():
            if ioString == "w":
                return open(fileName, ioString, encoding = "utf-8")
        return open(fileName, ioString)
    except:
        if ioString[0] == "r":
            ARCPY.AddIDMessage("ERROR", 110, fileName)
            raise SystemExit()
        else:
            ARCPY.AddIDMessage("ERROR", 210, fileName)
            raise SystemExit()

def errorMessage(type, number, info = None):
    """ Trigger Message and Exit"""
    if info is not None:
        ARCPY.AddIDMessage(type, number, info)
    else:
        ARCPY.AddIDMessage(type, number)
    raise SystemExit()

def checkOutputPath(path, typeOutput, listExtensions = None, parameter = None ):
    """
    Check output path
    INPUT:
        path (str): Path Output
        typeOutput (str): RASTER, FC, TABLE, FILE
        listExtensions  {list}: Supported Raster Extensions
        parameter {Parameter instance}: generate an output in UI

    """
    defaultList = [".ASC", ".IMG",".TIFF", ".JPG", ".TIF", ".JP2", ".PNG", 
                   ".GIF", ".BIP", ".DAT", ".CRF", ".MRF", ".BMP", ".BIL", ".BSQ"]
    
    if listExtensions is  None:
        listExtensions = defaultList

    errorFunction = errorMessage
    if parameter is not None:
        errorFunction = parameter.setIDMessage

    noAllowCharacters = ["!", "?", "*","-", "@", "^", "(",")","&","#","~", ":", ","]
    
    if parameter is None:
        noAllowCharacters.append("%")

    outPath = None
    if path not in ["", None]:
        isMemory =  path.lower().startswith("memory\\") or path.lower().startswith("in_memory\\")
        if isMemory:
            if typeOutput == "RASTER":
                endData = [True for e in listExtensions  if path.upper().endswith(e)]
                if len(endData):
                    errorFunction("ERROR", 210, path )

            if typeOutput == "FC":
                if path.upper().endswith(".SHP"):
                    errorFunction("ERROR", 210, path )

            if typeOutput == "TABLE":
                if path.upper().endswith(".DBF"):
                    errorFunction("ERROR", 210, path )

            if typeOutput == "FILE":
                errorFunction("ERROR", 210, path )

        if typeOutput == "FILE":
            outPath, outName = OS.path.split(path)
            if not OS.path.exists(outPath):
                errorFunction("ERROR", 210, path )
                
        else:
            try:
                outPath, outName = OS.path.split(path)
                ARCPY.Describe(outPath)
            except:
                if typeOutput in ["RASTER", "FC", "TABLE"] :
                    errorFunction("ERROR", 210, path )

        if typeOutput == "RASTER":
            if isGDB(path):
                if  not (".GDB/" in path.upper() or ".GDB\\" in path.upper()):
                    errorFunction("ERROR", 210, path )
                elif path[-4:].upper() in listExtensions or len([i for i in outName if i in noAllowCharacters]) > 0:
                    errorFunction("ERROR", 210, path )
            else:
                if "." not in outName  and len(outName) > 13 and not isMemory:
                    errorFunction("ERROR", 161)

        if len([i for i in outName if i in noAllowCharacters]) > 0:
            if parameter is not None:
                parameter.setIDMessage("ERROR", 354)
            else:
                errorFunction("ERROR", 210, path )

        if typeOutput == "FC":
            if ".SHP" == outName.upper() :
                errorFunction("ERROR", 210, path )

            isGDBorSDE = isSDEOrGeodatabase(path)
            if isGDB(path):
                if  not (".GDB/" in path.upper() or ".GDB\\" in path.upper()):
                    errorFunction("ERROR", 210, path )
            if isGDBorSDE and ".SHP" in path.upper():
                    errorFunction("ERROR", 210, path )

        if typeOutput == "TABLE":
            if ".DBF" == outName.upper():
                errorFunction("ERROR", 210, path )

            if isSDEOrGeodatabase(path):
                if ".DBF" in path.upper():
                    errorFunction("ERROR", 210, path )

        if typeOutput == "FILE":
            if "." in outName:
                if outName.upper().split(".")[-1] not in listExtensions:
                    errorFunction("ERROR", 210, path )

            if isGDB(path):
                errorFunction("ERROR", 210, path )


def setRandomSeed(seedOverride = None):
    """Sets the random number generator seed based on environment settings."""

    if seedOverride is not None:
        if seedOverride:
            RAND.seed(seedOverride)
        else:
            RAND.seed(None)
    else:
        randomObj = ARCPY.env.randomGenerator.exportToString()
        seedInt = int(randomObj.split()[0])
        if seedInt:
            RAND.seed(seedInt)

def getSetRandomSeedMax(seedMax = 1000000):
    """Sets the random number generator seed based on environment settings."""

    seed = getRandomSeed()

    if seed == 0:
        seed = RAND.randint(seedMax)

    RAND.seed(seed)

    return seed

def getRandomSeed(seedOverride = None):
    """Sets the random number generator seed based on environment settings."""

    if seedOverride is not None:
        return seedOverride
    else:
        randomObj = ARCPY.env.randomGenerator.exportToString()
        return int(randomObj.split()[0])

def getNumberOfThreads():
    """Get number of threads on environment settings."""
    import multiprocessing as MP

    factor = ARCPY.env.parallelProcessingFactor
    numProcessors = MP.cpu_count()
    if factor is None:
        return 0
    else:
        return getNumberOfThreadsENV(factor, numProcessors)

def getNumberOfThreadsTool(toolBase = 0):
    """Get number of threads on environment settings."""
    import multiprocessing as MP

    factor = ARCPY.env.parallelProcessingFactor
    numProcessors = MP.cpu_count()
    if factor is None:
        if toolBase > numProcessors:
            return numProcessors
        else:
            return toolBase
    else:
        return getNumberOfThreadsENV(factor, numProcessors)

def getNumberOfThreadsDefault(toolDefault = None):
    """Get number of threads on environment settings.
    toolDefault {int, optional}: default number of cores to use when GP Tool ENV is empty 
    """
    import multiprocessing as MP

    factor = ARCPY.env.parallelProcessingFactor
    numProcessors = MP.cpu_count()
    if factor is None:
        if toolDefault is not None:
            if toolDefault > numProcessors:
                toolDefault = numProcessors
            return toolDefault
        else:
            return abs(int(numProcessors * .5))
    else:
        return getNumberOfThreadsENV(factor, numProcessors)

def getNumberOfThreadsENV(factor, numProcessors):
    try:
        if '%' in factor:
            #### This Can Be a Float ####
            perc = factor.replace('%','')
            numThreads = abs(round(numProcessors * strToFloat(perc) / 100))
            if numThreads > numProcessors:
                numThreads = numProcessors
        else:
            #### Must Be An Int ####
            numThreads = abs(round(strToFloat(factor)))
            if numThreads > numProcessors:
                numThreads = numProcessors
    except:
        numThreads = 0

    return numThreads

def createRandomGroups(indices, numGroups):
    n = len(indices)
    sizeGroups = n // numGroups
    remainder = n % numGroups
    cvGroups = {}
    startIndex = 0
    for groupInd in range(numGroups):
        sizeGroup = sizeGroups
        if groupInd < remainder:
            sizeGroup += 1
        cvGroups[groupInd] = indices[startIndex:startIndex+sizeGroup]
        startIndex += sizeGroup

    return cvGroups

def getZMInfo():
    """Returns the info for Z and M values from the environment settings.

    return (tuple): (mEnabledBool, zEnabledBool, zDefaultValue)
    """

    try:
        zEnabled = ARCPY.env.outputZFlag.upper()
    except:
        zEnabled = "SAME AS INPUT"
    try:
        mEnabled = ARCPY.env.outputMFlag.upper()
    except:
        mEnabled = "SAME AS INPUT"
    zDefault = ARCPY.env.outputZValue

    return (zEnabled, mEnabled, zDefault)

def setZMFlagInfo(hasM, hasZ, spatialRef):
    """Sets the flags for output M and Z and allows reset of default Z.

    INPUTS:
    hasM (bool): whether input has Z
    hasM (bool): whether input has M
    resetZ {float, None}: value to reset default Z environment variable

    OUTPUT:
    zFlag (str): either ENABLED or ""
    mFlag (str): either ENABLED or ""
    defaultZ (float): default Z value
    defaultM (float): default M value
    """

    #### Set Initial to DISABLED ####
    mFlag = "DISABLED"
    zFlag = "DISABLED"

    #### Get Env Settings ####
    zEnabled, mEnabled, zDefault = getZMInfo()

    #### Set MFlag ####
    if mEnabled == "SAME AS INPUT":
        if hasM:
            mFlag = "ENABLED"
    if mEnabled == "ENABLED":
        mFlag = mEnabled

    #### Set ZFlag ####
    if zEnabled == "SAME AS INPUT":
        if hasZ:
            zFlag = "ENABLED"
    if zEnabled == "ENABLED":
        zFlag = zEnabled

    #### Reset Default Z Value ####
    if hasattr(spatialRef, 'zdomain'):
        try:
            zDomain = spatialRef.zdomain
            if SYS.version_info.major == 2:
                zDomain = str(zDomain)
            zMin, zMax = [LOCALE.atof(i) for i in zDomain.split()]
            if NUM.isnan(zMin) or NUM.isnan(zMax):
                defaultZ = 0.0
            else:
                defaultZ = setDefaultValue(zDefault, zMin, zMax)
        except:
            defaultZ = 0.0
    else:
        defaultZ = 0.0

    return zFlag, mFlag, defaultZ

def getXYZProjectionDomain(spatialRef):
    """ Obtain XYZ domain of a spatial reference
    INPUT:
    spatialRef (Spatial Reference): spatial reference object

    RETURN (tuple):xMin, yMin, zMin, xMax, yMax, zMax Domain
    """
    zMin = None
    zMax = None
    if hasattr(spatialRef, 'zdomain'):
        try:
            zDomain = spatialRef.zdomain
            if SYS.version_info.major == 2:
                zDomain = str(zDomain)
            zMin, zMax = [LOCALE.atof(i) for i in zDomain.split()]
        except:
            zMin = None
            zMax = None
    if hasattr(spatialRef, 'domain'):
        try:
            domain = spatialRef.domain
            if SYS.version_info.major == 2:
                domain = str(domain)
            xMin, yMin, xMax, yMax = [LOCALE.atof(i) for i in domain.split()]
        except:
            xMin = None
            xMax = None
            yMin = None
            yMax = None

    return xMin, yMin, zMin, xMax, yMax, zMax

def getXYDomainEnvironment():
    """ Obtain XY domain defined for a Geodatabase

    OUTPUT:
    xMin (double): Minimum value of X
    yMin (double): Minimum value of Y
    xMax (double): Maximum value of X
    yMax (double): Maximum value of Y
    """
    ### Get Geodatabase XY Domain Environment ####
    try:
        xyDomainEnv = ARCPY.env.XYDomain
        xMin, yMin, xMax, yMax  = [LOCALE.atof(i) for i in xyDomainEnv.split()]
    except:
        xMin = None
        yMin = None
        xMax = None
        yMax = None
    return xMin, yMin, xMax, yMax

def getZDomainEnvironment():
    """ Obtain Z domain defined for a Geodatabase

    OUTPUT:
    zMin (double): Minimum value of Z
    zMax (double): Maximum value of Z
    """

    ### Get Geodatabase Z Domain Environment ####
    try:
        zDomainEnv = ARCPY.env.ZDomain
        zMin, zMax = [LOCALE.atof(i) for i in zDomainEnv.split()]
    except:
        zMin = None
        zMax = None
        
    return zMin, zMax

def getDomainGeodatabase():
    """ Obtain Domain Geodatabase 

    RETURN (tuple): xMin, yMin, zMin, xMax, yMax, zMax Domain
    """
    
    xMin, yMin, xMax, yMax = getXYDomainEnvironment()
    zMin, zMax = getZDomainEnvironment()
    return xMin, yMin, zMin, xMax, yMax, zMax 

def setZDomainProjection(zMin, zMax, spatialRef):
    """ Reset Z domain of projection in a Geodatabase 

    INPUT:
    zMin (double): Minimum value of Z
    zMax (double): Maximum value of Z
    spatialRef (Spatial Reference): Spatial reference

    RETURN (bool): Successfully changed
    """
    try:
        spatialRef.setZDomain(zMin, zMax)
        changed = True
    except:
        changed = False

    return changed

def setXYDomainProjection(xMin, yMin, xMax, yMax, spatialRef):
    """ Reset Z domain of projection in a Geodatabase 

    INPUT:
    xMin (double): Minimum value of X
    yMin (double): Minimum value of Y
    xMax (double): Maximum value of X
    yMax (double): Maximum value of Y
    spatialRef (Spatial Reference): Spatial reference

    RETURN (bool): Successfully changed
    """
    try:
        spatialRef.setDomain(xMin, xMax, yMin, yMax)
        changed = True
    except:
        changed = False
    return changed

def updateProjectionDomain(spatialRef, xyzDomain):
    """ Update xyz Domain projection
    INPUT:
    spatialRef (Spatial Reference): Spatial reference
    xyzDomain (tuple): xMin, yMin, zMin, xMax, yMax, zMax Domain

    """
    xMin, yMin, zMin, xMax, yMax, zMax = xyzDomain
    if xMin and yMin and xMax and yMax:
        setXYDomainProjection(xMin, yMin, xMax, yMax, spatialRef)
    if zMin and zMax:
        setZDomainProjection(zMin, zMax, spatialRef)

    return getXYZProjectionDomain(spatialRef)

def extentDomain3D(spatialRef, points, projectionDomain, factorExtend = 0.1):
    """
    Extent projection domain if points are outside of domain.
    Change the current projection domain

    INPUT:
    spatialRef (Spatial Reference): Spatial reference
    points (array x3): check 
    projectionDomain (tuple): xMin, yMin, zMin, xMax, yMax, zMax Domain
    factorExtend (float): factor to extend domain
    RETURN (bool): True/False if projection changes
    """

    xMin, yMin, zMin, xMax, yMax, zMax = projectionDomain
    inside = checkPointsDomain(projectionDomain, points)
    minValues = points.min(0)
    maxValues = points.max(0)
    if not inside[0]:
        xInside = inside[1]
        yInside = inside[2]
        zInside = inside[3]
        if not xInside:
            extend = (maxValues[0] - minValues[0]) * factorExtend
            setXYDomainProjection(min(minValues[0] - extend, xMin), yMin, 
                                  max(maxValues[0] + extend, xMax), yMax, 
                                  spatialRef)

        if not yInside:
            extend = (maxValues[1] - minValues[1]) * factorExtend
            setXYDomainProjection(xMin, min(minValues[1] - extend, yMin),
                                  xMax, max(maxValues[1] + extend, yMax),
                                  spatialRef)

        if not zInside:
            extend = (maxValues[2] - minValues[2]) * factorExtend
            setZDomainProjection(min(minValues[2] - extend, zMin),
                                 max(maxValues[2] + extend, zMax),
                                 spatialRef)

        projectionChange = True
    else:
        projectionChange = False

    return projectionChange

def checkPointsDomain(xyzDomain, points):
    """ Check if points are contained in the Geodatabase Domain
    
    INPUT:
    xyzDomain (tuple): xMin, yMin, zMin, xMax, yMax, zMax Domain
    xMin (double): Minimum value of X
    yMin (double): Minimum value of Y
    xMax (double): Maximum value of X
    yMax (double): Maximum value of Y
    zMin (double): Minimum value of Z
    zMax (double): Maximum value of Z
    points (array x3) : array of points

    RETURN (bool): True/False if points are contained
    """

    xMin, yMin, zMin, xMax, yMax, zMax = xyzDomain
    minValues = points.min(0)
    maxValues = points.max(0)
    xMinP= minValues[0]
    yMinP= minValues[1]
    xMaxP= maxValues[0]
    yMaxP= maxValues[1]

    if xMin and xMax:
        if  xMin < xMinP and xMaxP < xMax:  
            xInside = True
        else:
            xInside = False
    else:
        xInside = None
        
    if yMin and yMax:
        if yMin and yMax and yMin < yMinP  and yMaxP < yMax:  
            yInside = True
        else:
            yInside = False
    else:
        yInside = None

    if len(minValues) == 3:
        zMinP = minValues[2]
        zMaxP = maxValues[2]
        if zMin and zMax:
            if zMin and zMax and zMin < zMinP  and  zMaxP < zMax:
                zInside = True
            else:
                zInside = False
        else:
            zInside = None
    else:
        zInside = None

    return xInside and yInside and zInside, xInside, yInside, zInside

def setDefaultValue(defaultValue, minValue, maxValue):
    """Used to assign default Z and M values.

    INPUTS:
    defaultValue (float): default value to set
    minValue (float): minimum value allowed
    maxValue (float): maximum value allowed

    RETURN (float): default value if between min/max, else min value
    """

    if defaultValue in ["", "#", None]:
        defaultValue = 0.0
    if (minValue < defaultValue <= maxValue):
        return defaultValue
    else:
        return minValue

def clearExtent(functionName):
    """Clears the extent env setting for the given function.

    INPUTS:
    functionName (obj): function to call with given args and extent cleared
    """

    def innerFunction(*args, **kw):
        oldExtent = ARCPY.env.extent
        ARCPY.env.extent = ""
        returnValue = functionName(*args, **kw)
        ARCPY.env.extent = oldExtent
        return returnValue

    return innerFunction

def createSeriesStr(xFields, yFields, outputTable):
    """Creates Graphing String for Line Series.

    INPUTS:
    xFields (list): list of fields names for x-axis
    yFields (list): list of fields names for y-axis
    outputTable (str): path to the data source

    OUTPUT:
    dataStr (str): series description string for DM.MakeGraph()
    """

    seriesStr = "SERIES=line:vertical"
    tabStr = "DATA=" + outputTable
    dataStr = []
    for ind, xField in enumerate(xFields):
        yField = yFields[ind]
        fieldStr = "X=" + xField + " " + "Y=" + yField
        lineStr = " ".join([ seriesStr, tabStr, fieldStr ])
        dataStr.append(lineStr)
    dataStr = ";".join(dataStr)
    return dataStr

def getImageDir():
    curdir = OS.path.dirname(__file__)
    imageDir = OS.path.join(curdir, "Images")
    return imageDir

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

def getExtent(extent, allValues = False):
    """Returns a list of coordinates for the given extent object.

    INPUTS:
    extent (object): instance of an extent object for ARCPY.Describe()
    allValues {bool, False}: when set to True returns M and Z values

    OUTPUT:
    extentList (list): [ xmin, ymin, xmax, ymax, {zmin, zmax, mmin, mmax} ]
    """

    extentList = [ extent.XMin, extent.YMin, extent.XMax, extent.YMax ]
    if allValues:
        mAndZ = [ extent.ZMin, extent.ZMax, extent.MMin, extent.MMax ]
        extentList = extentList + mAndZ

    return extentList

def increaseExtent(extent, multiplier = .4):
    """Increases the extent by the given multiplier.

    INPUTS:
    extent (object): instance of an extent object for ARCPY.Describe()
    multiplier {float, .4}: factor to increase extent

    OUTPUT:
    extentList (list): [ xmin, ymin, xmax, ymax,
                        {zmin, zmax, mmin, mmax} ]
    """

    xRange = extent.XMax - extent.XMin
    xRangeAmount = (xRange * multiplier) / 2.
    yRange = extent.YMax - extent.YMin
    yRangeAmount = (yRange * multiplier) / 2.
    XMin = extent.XMin - xRangeAmount
    YMin = extent.YMin - yRangeAmount
    XMax = extent.XMax + xRangeAmount
    YMax = extent.YMax + yRangeAmount

    return [ XMin, YMin, XMax, YMax ]

def increaseMinMax(values, multiplier = .05):
    """Increases the min/max of the values for plotting space.

    INPUTS:
    values (object): list/array of values
    multiplier {float, .05}: factor to increase by

    OUTPUT:
    minValuePlus, maxValuePlus
    """

    minValue = min(values)
    maxValue = max(values)
    valRange = maxValue - minValue
    rangeAmount = (valRange * multiplier) / 2.
    minValueMinus = minValue - rangeAmount
    maxValuePlus = maxValue + rangeAmount

    return minValueMinus, maxValuePlus

def increaseExtentByConstant(extent, constant):
    """Increases the extent by the given multiplier.

    INPUTS:
    extent (object): instance of an extent object for ARCPY.Describe()
    constant (float): number to increase the size of the extent

    OUTPUT:
    extentList (list): [ xmin, ymin, xmax, ymax, {zmin, zmax, mmin, mmax} ]
    """

    XMin = extent.XMin - constant
    YMin = extent.YMin - constant
    XMax = extent.XMax + constant
    YMax = extent.YMax + constant

    return [ XMin, YMin, XMax, YMax ]

def get92Extent(extent):
    """Returns a string representation of an extent (9.2 Version).

    INPUTS:
    extent (object): instance of an extent object for ARCPY.Describe()

    OUTPUT:
    return (str): "minX minY maxX maxY"
    """

    extent = getExtent(extent)
    extent = [ LOCALE.str(i) for i in extent ]

    return " ".join(extent)

def resetExtent(xyCoords, zCoords = None, mCoords = None, spatialRef = None):
    """Returns the extent of a feature class that honors both the
    environment settings and subselection as it is calculated after the
    read.

    INPUTS:
    xCoords (array): list of xCoords
    yCoords (array): list of yCoords
    zCoords {array, None}: list of zCoords
    mCoords {array, None}: list of mCoords

    OUTPUT:
    extent (object) instance of an extent object
    """

    XMin, YMin = xyCoords.min(0)
    XMax, YMax = xyCoords.max(0)
    ZMin = None
    ZMax = None
    MMin = None
    MMax = None
    if zCoords:
        ZMin = zCoords.min()
        ZMax = zCoords.max()
    if mCoords:
        MMin = mCoords.min()
        MMax = mCoords.max()

    extent = ARCPY.Extent(XMin, YMin, XMax, YMax, ZMin, ZMax, MMin, MMax)
    extent.spatialReference = spatialRef

    return extent

def createLayerFromExtent(inputData):
    """ Use the Extent Environment to create a new layer
        RETURN:
            inputData (str): layer
            createTempLayer (bool): boolean to check if the layer was created
    """
    createTempLayer = False

    #### Check Extent ####
    if ARCPY.env.extent  not in [None, 'MINOF', 'MAXOF']:
        desc = ARCPY.Describe(inputData)

        #### Apply Extent in FC ####
        if desc.DataType not in dataTypeTable:
            refLayer = ARCPY.management.MakeFeatureLayer(inputData, "refLayer")
            createTempLayer = True
            sfr = desc.spatialReference
            extent = ARCPY.env.extent

            if extent.spatialReference is None:
                ### Set spatialReference equal than input data spatial reference ####
                extent = ARCPY.Extent(XMin = extent.XMin, 
                                   YMin = extent.YMin,
                                   XMax = extent.XMax,
                                   YMax = extent.YMax,
                                   spatial_reference = sfr)
            else:
                extent = ARCPY.env.extent.polygon.projectAs(sfr)
            try:
                result = ARCPY.management.SelectLayerByLocation(refLayer[0], "INTERSECT", extent,"", "NEW_SELECTION", "NOT_INVERT")
                inputData = result[0]
            except:
                return inputData, False

    return inputData, createTempLayer

def compareSpatialRefNames(inRefName, outRefName):
    """Compares the names of two spatial reference names to warn the
    user if spatial references different for input and output
    coordinate system.

    INPUTS:
    inRefName (str): name of input spatial reference
    outRefName (str): name of output spatial reference
    """

    if inRefName != outRefName:
        # ARCPY.AddIDMessage("WARNING", 984, inRefName, outRefName)
        try:
            LOGGER.warning(984, extra={"message_ID": 984, "add_argument1": inRefName, "add_argument2": outRefName})
        except:
            LOGGER.warning(984, extra={"message_ID": 984})

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
        try:
            descDir = ARCPY.Describe(dirName)
            dirType = descDir.DataType
            if dirType == "FeatureDataset":
                #### Set to FeatureDataset if True ####
                spatialRef = descDir.SpatialReference
            else:
                spatialRef = setEnvSpatialReference(inputSpatialRef)
        except:
            spatialRef = setEnvSpatialReference(inputSpatialRef)

    return spatialRef

def setEnvSpatialReference(inputSpatialRef):
    """Returns a spatial reference object of Env Setting if exists.

    INPUTS:
    inputSpatialRef (obj): input spatial reference object

    OUTPUT:
    spatialRef (class): spatial reference object
    """
    
    if ARCPY.gp.env_outputCoordinateSystem:
        envSetting = ARCPY.gp.env_outputCoordinateSystem
    else:
        #### AGOL/Enterise 11.2 needs this envSetting to honor outSR ####
        envSetting = ARCPY.env.outputCoordinateSystem
    if envSetting is not None:
        #### Set to Environment Setting ####
        spatialRef = envSetting
    else:
        spatialRef = inputSpatialRef

    return spatialRef

def returnOutputSpatialString(spatialReference = None):
    """Returns the spatial reference string used in a Search Cursor or
    in a GA Table.

    INPUTS:
    spatialReference {obj, None}: spatial reference object

    OUTPUT:
    return (str): string version of spatial reference.
    """

    if spatialReference is None:
        return None
    else:
        return spatialReference.exportToString()

def getBasenamePrefix(fileName):
    """Returns the prefix for a filename based on the full path.

    INPUTS:
    fileName (str) full path to a file
    """

    baseName = OS.path.basename(fileName)
    try:
        baseName = baseName.split(".")[0]
    except:
        pass

    return baseName

def getCount(inputFC):
    """Wrapper function for returning the number of features in a
    feature class.

    INPUTS:
    inputFC (str): path to the input feature class

    OUTPUT:
    return (int): number of features in inputFC
    """

    clearObject = clearExtent(DM.GetCount)
    countObject = clearObject(inputFC)
    value = 0
    try:
        value = int(countObject.getOutput(0))
    except:
        #### This system exit is used to handled a fail in GetCount during a cancel ####
        raise SystemExit
    return value


def addColon(st):
    """Appends a colon and space to the specified string.

    INPUTS:
    st (str): string to append ': ' to
    """

    return st + ": "

def padValue(nonPVal, significant = False):
    """Appends empty space on value if p-values in column are significant.

    INPUTS:
    nonPVal (str): value already formatted to be placed in text table.
    significant {bool, False}: significant p-values in column?
    """

    if significant:
        nonPVal += " "
    return nonPVal

def writePVal(pVal, cutoff = 0.05, significant = "*",
              formatStr = "%0.6f", padNonSig = False, returnHTMLElement=False):
    """Localizes a probability value from a floating point number
    and appends a * if the value is less than or equal to 0.05.

    INPUTS:
    pVal (float): probability value
    cutoff {float, 0.05}: significance cutoff
    significant {str, *}: symbol used to indicate significance
    formatStr {str, "%0.6f"}: format string, E.g. "%0.6f"
    padNonSig {bool, False}: pad empty space if not significant?
    returnHTMLElement {bool, False}: if return the HTML rich element if significant?
    """

    if NUM.isnan(pVal):
        strPVal = "NaN"
    else:
        strPVal = formatValue(pVal, formatStr = formatStr)
        if pVal <= cutoff:
            if returnHTMLElement and couldExportHTMLMessage():
                strPVal = [strPVal, buildSuperscript(significant)]
            else:
                strPVal += significant
        else:
            if padNonSig:
                strPVal += " "

    return strPVal

def formatValue(value, formatStr = "%0.6f"):
    """Returns a NaN or formatted string for a given value.

    INPUTS:
    value (float): value to format
    formatStr (str): format string, E.g. "%0.6f"
    """

    if isThree():
        if isinstance(value, (str, bytes)):
            return value
    else:
        if isinstance(value, (basestring, str)):
            return value 

    if NUM.isnan(value):
        return "NaN"
    else:
        return LOCALE.format_string(formatStr, value)


def formatPercentage(value, decimalPlaces=2, multiplier=100):
    """
    Returns a formatted percentage string for a given value.
    Optimized for languages like Arabic, Turkish, and Hebrew.
    e.g. 0.1234 -> 12.34% or %12.34

    """
    if isThree():
        if isinstance(value, (str, bytes)):
            return value
    else:
        if isinstance(value, (basestring, str)):
            return value

    if NUM.isnan(value):
        return "NaN"
    if value is None:
        return ARCPY.GetIDMessage(84499)

    template = f"%0.{decimalPlaces}f"
    percentageOnRight = True
    try:
        codeset = LOCALE.getdefaultlocale()[0].lower()
        for code in ['ar', 'tr', 'he']:
            if codeset.startswith(code):
                percentageOnRight = False
                break
    except:
        percentageOnRight = True

    if percentageOnRight:
        template = f"{template}%%"
    else:
        template = f"%%{template}"
    return LOCALE.format_string(template, value * multiplier)


def returnPeakIndices(values, levelFilter = None):
    """Returns the indices of first and maximum peak of a given set of
    values.

    INPUTS:
    values (list): values to be analyzed.
    levelFilter (float): filter values below this.

    RETURN:
    firstPeakIndex, maxPeakIndex
    """

    aVals = NUM.array(values)
    diff = aVals[1:] - aVals[0:-1]
    peakVals = []
    peakInds = []
    firstInd = None
    maxInd = None
    c = 0
    goneUp = False
    for d in diff:
        if d > 0:
            goneUp = True
        upBool = (d < 0 and goneUp)
        if levelFilter is not None:
            upBool = (upBool and aVals[c] > levelFilter)
        if upBool:
            peakVals.append(aVals[c])
            peakInds.append(c)
        c += 1

    if len(peakVals):
        firstInd = peakInds[0]
        maxPeakIndTemp = NUM.argmax(peakVals)
        maxInd = peakInds[maxPeakIndTemp]

    return firstInd, maxInd

def returnMoranBin(zScore, featureVal, globalMean, localMean):
    """Returns a string representation of Local Moran's I
    Cluster-Outlier classification bins.

    INPUTS:
    zScore (float): standard z-score for specific feature.
    featureVal (float): the value for the specific feature.
    globalMean (float): mean value for all features.
    localMean (float): mean value for specific feature's neighbors.

    OUTPUT:
    moranBin (str): HH = Cluster of Highs, L = Cluster of Lows,
                    HL = High Outlier, LH = Low Outlier.
    """

    if abs(zScore) < 1.96:
        moranBin = ""
    else:
        if zScore > 1.96:
            if localMean >= globalMean:
                moranBin = "HH"
            else:
                moranBin = "LL"
        else:
            if featureVal >= globalMean and localMean <= globalMean:
                moranBin = "HL"
            elif featureVal <= globalMean and localMean >= globalMean:
                moranBin = "LH"
            else:
                moranBin = ""

    return moranBin

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

def returnScratchFolder():
    """Returns the Scratch Folder for Intermediate Computation.

    OUTPUT:
    scratchWS (str): path to the scratch workspace
    """

    scratchFolder = ARCPY.env.scratchFolder
    if not scratchFolder:
        scratchWS = returnScratchWorkSpace()
        scratchFolder = getBaseFolder(scratchWS)

    return scratchFolder

def returnScratchName(prefix, fileType = "FEATURECLASS",
                      scratchWS = None, extension = None, addRandomName = True):
    """Returns a Scratch File Name for Intermediate Computation. (1)

    INPUTS:
    prefix (str): file prefix
    fileType {str, FEATURECLASS}: type of scratch file
    scratchWS {str, NONE}: path to the scratch workspace desired
    extension {str, None}: extension for the file
    addRandomName {boolean, True}: to create a random number

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

    #### Set Workspace/Folder ####
    if fileType == "FEATURECLASS":
        if not scratchWS:
            scratchWS = returnScratchWorkSpace()
    else:
        if not scratchWS:
            scratchWS = returnScratchFolder()

    descWS = ARCPY.Describe(scratchWS)
    baseType = descWS.DataType

    #### Remove Any Extension From Prefix ####
    prefix = OS.path.splitext(prefix)[0]
    if addRandomName:
        uniqueInfo = "_{0}_{1}_".format(*getProcessThreadIDs())
    else:
        uniqueInfo = ""
    prefix = prefix + uniqueInfo
    scratchName = ARCPY.CreateUniqueName(prefix, scratchWS)

    #### Solve Based on File Type ####
    fileType = fileType.upper()
    if fileType == "TEXT":
        if baseType.upper() == "FOLDER":
            if extension:
                extension = "." + extension.strip(".")
                prefix = prefix + extension.lower()
                scratchName = ARCPY.CreateUniqueName(prefix,
                                                     scratchWS)
    else:
        if baseType.upper() == "FOLDER":
            if fileType == "TABLE":
                prefix += ".dbf"
            if fileType in ["FEATURECLASS", "SHAPEFILE"]:
                prefix += ".shp"
            scratchName = ARCPY.CreateUniqueName(prefix, scratchWS)
        else:
            scratchName = ARCPY.CreateUniqueName(prefix, scratchWS)
            scratchName = scratchName.removesuffix(".shp")
    
    if ".gdb" in scratchName.lower():
        scratchName = scratchName.removesuffix(".shp")
        scratchName = scratchName.removesuffix(".shp0")
        scratchName = scratchName.removesuffix(".dbf")
        scratchName = scratchName.removesuffix(".dbf0")

    return scratchName

def getBaseWorkspaceType(dirName, workType = None,
                         isBottom = True):
    """
    Returns the workspace type of the given directory. (1)

    INPUTS:
    dirName (str): base directory for input feature class.
    workType {str, None}: Set to None until a value is found.
    isBottom {bool, True}: Set to True for the first call.

    OUTPUT:
    dirType (str): FileSystem, LocalDatabase or RemoteDatabase.

    NOTES:
    (1) This function should be called with 'workType' and 'isBottom'
        set to their defaults.

        The recursive nature of the function makes it robust to feature
        data sets, where a describe on the workspace type will not
        be valid.
    """

    upperDir = dirName.upper()
    if upperDir.count(".SDE") > 0 or upperDir.startswith('HTTP') or upperDir.startswith('GIS SERVERS'):
        return "RemoteDatabase"
    if upperDir.endswith(".GEODATABASE"):
        return "Mobile"
    if workType:
        return workType
    else:
        if not isBottom:
            dirName = OS.path.dirname(dirName)
            if dirName == "\\":
                return "RemoteDatabase"
#        desc = ARCPY.Describe(dirName)
#        try:
#            workType = desc.WorkspaceType
#        except:
#            workType = None
#        return getBaseWorkspaceType(dirName, workType = workType,
#                                    isBottom = False)
        workType = None
        try:
            desc = ARCPY.Describe(dirName)
            workType = desc.WorkspaceType
        except OSError:
            if OS.path.isdir(dirName):
                workType = "Folder"
        except:
            pass
        return getBaseWorkspaceType(dirName, workType = workType,
                                    isBottom = False)


def getOriginalFieldName(fieldList, fields):
    """
    Use original capitalization
    """
    dictFields = {}
    for field in fields:
        dictFields[field.name.upper()] = field.name
    outputFields = []
    for field in fieldList:
        if field in dictFields:
            outputFields.append(dictFields[field])
        else:
            outputFields.append(field)
    return  outputFields


def getBaseFolder(dirName):
    """
    Walks up the file system until a folder is found. (1)

    INPUTS:
    dirName (str): base directory for input feature class.

    OUTPUT:
    folderPath (str): path to the first folder found in walk.

    NOTES:
    (1) This method will walk up a directory structure until a FOLDER is
        encountered.  It is used for files that should NOT be written to
        geodatabases and feature datasets... I.e. image and text files.
    """

    flag = True
    while flag:
        descWS = ARCPY.Describe(dirName)
        if descWS.DataType.upper() == "FOLDER":
            flag = False
        else:
            dirName = OS.path.dirname(dirName)
    return dirName

###### Functions for Creating/Adding Fields and Feature Classes #####

def addEmptyField(outputFC, field, type, alias = None, nullable = True,
                  precision = None, scale = None, length = None,
                  required = False, domain = None):
    """Adds an empty field to a FC with the approporiate defaults.

    INPUTS:
    outputFC (str): catalogue path to the output feature class.
    field (str): name of the field to be added.
    type (str): {LONG, SHORT, TEXT, FLOAT etc...}.
    length {float, None}: length of output field
    alias {str, None}: alias to be used for the field (Optional).
    """
    if nullable:
        nullString = "NULLABLE"
    else:
        nullString = "NON_NULLABLE"

    if required:
        requiredString = "REQUIRED"
    else:
        requiredString = "NON_REQUIRED"

    try:
        DM.AddField(outputFC, field, type, precision, scale, length,
                    alias, nullString, requiredString, domain)
    except:
        ARCPY.AddIDMessage("ERROR", 852, field, outputFC)
        raise SystemExit

def returnTableName(tableName, extension = ".dbf"):
    """Assesses the filesystem assoctiaed with the table.  This enables the
    table to be overwritten.  A DBF extension is added if the file system is
    merely a folder.

    INPUTS:
    tableName (str): catalogue path to output table
    extension {str, .dbf}: file extension
    """

    #### Assure Output Workspace Exists ####
    ERROR.checkOutputPath(tableName)

    ### Check In Memory ####
    lowerName = tableName.lower()
    if lowerName.startswith("in_memory") or lowerName.startswith("memory"):
        return tableName, 0

    #### Assess Table Extension ####
    dbf = 0
    if extension not in OS.path.basename(tableName):
        tableDirInfo = ARCPY.Describe(OS.path.dirname(tableName))
        try:
            workType = tableDirInfo.WorkspaceType == "FileSystem"
            if workType:
                tableName = tableName + extension
                dbf = 1
        except:
            pass

    return tableName, dbf

def createOutputTable(tableName, fields, types, data, aliases = None):
    """Creates output data tables (E.g. dbf).

    INPUTS:
    tableName (str): catalogue path to output table
    fields (list): list of field names
    types (list): list of data types
    data (list of lists): column data in list form (1)

    NOTES:
    (1) Each list contains the data for the corresponding column
        represented by its index in fields.
    """

    if ".gdb" in tableName.lower():
        if ".txt" in tableName.lower():
            ARCPY.AddIDMessage("ERROR", 210, tableName)
            raise SystemExit ()

    if ".txt" in tableName.lower():
        ARCPY.AddIDMessage("ERROR", 210, tableName)
        raise SystemExit ()

    #### Finalize Table Name ####
    tableName, dbf = returnTableName(tableName)
    try:
        OS.remove(tableName)
    except:
        pass

    path, base = OS.path.split(tableName)
    DM.CreateTable(path, base)

    #### Add Empty Fields ####
    checkNulls = OS.path.splitext(tableName)[-1].upper() == ".DBF"
    nullFieldsToCheck = {}
    for fieldInd, fieldName in enumerate(fields):
        fieldType = types[fieldInd]
        try:
            alias = aliases[fieldInd]
        except:
            alias = None
        if fieldType not in ["TEXT", "DATE"]:
            nullFieldsToCheck[fieldInd] = shpFileNull[fieldType]
        addEmptyField(tableName, fieldName, fieldType, alias = alias)

    #### Add Data ####
    insert = DA.InsertCursor(tableName, fields)
    for row in data:
        #### Account for Nulls ####
        if checkNulls:
            if isinstance(row, tuple):
                rowResults = list(row)
            else:
                rowResults = row
            for ind, value in iteritems(nullFieldsToCheck):
                if NUM.isnan(rowResults[ind]):
                    rowResults[ind] = value
            insert.insertRow(rowResults)
        else:
            insert.insertRow(row)

    #### Clean Up ####
    del insert

def isOutputSDE(outputSTR):
    """Check if Output Path is contain in a SDE Connection 
    INPUT:
        outputSTR (str): outputPath feature class or table
    """
    try:
        outPath, outName = OS.path.split(outputSTR)
        info = ARCPY.Describe(outPath)
        prop = info.connectionProperties.instance.upper()
        return "SDE:" in prop
    except:
        pass
    return False

def honorCaseSDE(outputTable, dictFields):
    """Returns a dictionary of fields that honor the case of the input"""
    if isOutputSDE(outputTable):
        try:
            dictOutFields = {}
            desc = ARCPY.Describe(outputTable)
            fields = [f.name for f in desc.fields]
        
            for k, v in dictFields.items():
                if k in fields:
                    dictOutFields[k] = k
                if k.lower() in fields:
                    dictOutFields[k] = k.lower()
            return dictOutFields
        except:
            pass
    return dictFields

def isShapeFile(inputFC, ext = "SHP"):
    """Returns whether the input feature class is a shapefile.

    INPUTS:
    inputFC (str): catalogue path to the feature class
    ext {str}: extension 
    OUTPUT:
    return (bool): is the inputFC a shapefile?
    """

    shpFileBool = False
    baseFile = OS.path.basename(inputFC)
    try:
        splitBase = baseFile.split(".")
        if splitBase[-1].upper() == ext:
            shpFileBool = True
    except:
        pass

    return shpFileBool

def isReadOnly(input):
    """Returns whether the input is a dataset read only
    INPUTS:
    input (str): feature layer/Table View (string), fc input, fc output

    OUTPUT:
    return (bool): is the input in a gdb?
    """

    isContained = False
    path = input
    try:
        d = ARCPY.Describe(input)
        path = d.CatalogPath.upper()
        if ".BDC" in path:
            isContained = True
        if d.dataType in ["FeatureLayer", "TableView"] and ".NC" in path:
            isContained = True
    except:
        pass
    return isContained

def isSDEOrGeodatabase(path, describePath = True):
    """Returns whether the input feature class is contained in SDE or File Geodatabase"""
    try:
        if describePath and ARCPY.Exists(path):
            d = ARCPY.Describe(path)
            path = d.CatalogPath
    except:
        pass
    path = path.upper()
    return ".SDE" in path or \
           ".SQLITE" in path or \
           ".GEODATABASE" in path or \
           ".GPKG" in path

def IsPathInGeoDatabase(outputPath):
    """Check if Output Path is contain in a File Geodatabase or SQLite Connection, SDE Connection
    """
    if outputPath is not None:
        found =  (isSDEOrGeodatabase(outputPath, describePath = False) or \
               ".GDB" in outputPath.upper() or \
               outputPath.upper().startswith("MEMORY") or \
               outputPath.upper().startswith("IN_MEMORY"))
        return found
    return False

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
            if hasattr(input, "value"):
                input = input.value.upper()

            if input[-3:].upper() == "SHP":
                isContained = False
            else:
                if ".GDB" in path:
                    isContained = True

         #### Check SDE ####
        if checkSDE:
            if isSDEOrGeodatabase(path):
                isContained = True
            if "SCRATCHGDB%" in path:
                isContained = True

    except:
        pass
    return isContained

def isNullable(inputFC):
    """Returns whether fields from input can be Nullable. (1)

    INPUTS:
    inputFC (str): catalogue path to the feature class or table

    OUTPUT:
    return (bool): do added fields honor nullable flag?
    """

    inPath, inFile = OS.path.split(inputFC)
    wsType = getBaseWorkspaceType(inPath)
    return wsType.upper() in ["LOCALDATABASE", "REMOTEDATABASE"]

def setToNullable(inputFC, outputFC):
    """Returns whether fields copied from input should be set to Nullable. (1)

    INPUTS:
    inputFC (str): catalogue path from the input feature class
    outputFC (str): catalogue path to the output feature class

    OUTPUT:
    return (bool): should copied fields be set to nullable?

    NOTES:
    (1) When copied fields come from a feature class that is inherently
        non-nullable (E.g. shapefile, coverage), then they should be set to
        nullable when going to fgdb, pgdb or sde.  More importantly, when
        copying the fields from one nullable FC to another, you should honor
        the field specific nullable flag.  Return
    """

    inPath, inFile = OS.path.split(inputFC)
    inType = getBaseWorkspaceType(inPath)
    inBool = inType.upper() in ["LOCALDATABASE", "REMOTEDATABASE"]

    outPath, outFile = OS.path.split(outputFC)
    outType = getBaseWorkspaceType(outPath)
    outBool = outType.upper() in ["LOCALDATABASE", "REMOTEDATABASE"]

    return (inBool and outBool) == False

def setToNullableUpdated(inputFC, outputFC):
    """Returns whether fields copied from input should be set to Nullable. (1)

    INPUTS:
    inputFC (str): catalogue path from the input feature class
    outputFC (str): catalogue path to the output feature class

    OUTPUT:
    return (bool): should copied fields be set to nullable?

    NOTES:
    (1) When copied fields come from a feature class that is inherently
        non-nullable (E.g. shapefile, coverage), then they should be set to
        nullable when going to fgdb, pgdb or sde.  More importantly, when
        copying the fields from one nullable FC to another, you should honor
        the field specific nullable flag.  Return
    """

 
    inBool = getIsNullable(inputFC)
    outBool = getIsNullable(outputFC)

    return (inBool and outBool) == False

def getIsNullable(dataset):
    outPath, outFile = OS.path.split(dataset)
    outType = getBaseWorkspaceType(outPath)
    if outType.upper() == "FOLDER":
        if outPath.lower().endswith(".sqlite"):
            outBool = True
        else:
            outBool = False
    else:
        outBool = outType.upper() in ["LOCALDATABASE", "REMOTEDATABASE", "MOBILE"]

    return outBool

def returnOutputFieldName(inFCField):
    """Returns a valid output field name from a given input field object. (1)

    INPUTS:
    inFCField (obj): instance of SSDO.FCField()

    OUTPUT:
    outFieldName (str): output field name

    NOTES:
    (1) Honors Fully Qualified Field Names Env Setting in the case of joins.
    If the Env Setting is True, then returns the field name, else it returns
    the baseName.
    """

    if ARCPY.env.qualifiedFieldNames:
        outFieldName = inFCField.name
    else:
        outFieldName = inFCField.baseName

    return outFieldName

def validQFieldName(inFCField, outPath):
    """Returns a valid and qualified field name.

    INPUTS:
    inFCField (obj): instance of SSDO.FCField()
    outPath (str): path to the output feature class

    OUTPUT:
    outFieldName (str): output field name
    """

    if ARCPY.env.qualifiedFieldNames:
        outFieldName = ARCPY.ValidateFieldName(inFCField.name, outPath)
    else:
        outFieldName = ARCPY.ValidateFieldName(inFCField.baseName, outPath)

    return outFieldName

def getFieldNames(fieldNames, outPath):
    """Returns a valid and qualified field names from a list of strings.

    INPUTS:
    fieldNames (list): field names to validate
    outPath (str): path to the output feature class

    RETURN: (list): validated field names
    """

    return [ARCPY.ValidateFieldName(i, outPath) for i in fieldNames]

def caseValue2Print(caseValue, caseFieldIsString):
    """Returns a version of the case value that can be printed.

    INPUTS:
    caseValue (int, str, datetime): value from a case field
    caseFieldIsString (bool): whether the case field is of type str

    RETURN: (str): string rep of a case value
    """

    if not caseFieldIsString:
        caseValue = str(caseValue)

    return caseValue

def checkDataType(candidateFieldList):
    """Checks the data type of the candidate fields"""
    for ind in NUM.arange(len(candidateFieldList)):
        if candidateFieldList[ind].data.dtype == float and  candidateFieldList[ind].type.upper() == "LONG":
            candidateFieldList[ind].data = NUM.asarray(candidateFieldList[ind].data, dtype= NUM.int32)

def adjustCandidateFieldLengthByArrayDtype(candidateFieldList, onlyFieldsWithLengthGreaterThan = 255):
    """Adjusts the length of the candidate fields based on the data type of the array."""
    for candidateField in candidateFieldList:
        if "<U" in candidateField.data.dtype.str:
            size = int(candidateField.data.dtype.str.replace("<U", ""))
            if size > onlyFieldsWithLengthGreaterThan:
                candidateField.length = size

def createAppendFieldNames(fieldNames, outPath, candidateFields = None, explicitMaxLength = None):
    """Creates unique field names for appended fields from input. (1)

    INPUTS:
    fieldNames (list): name of input fields that are to be appended
    outPath (str): path to the output feature class
    candidateFields (dict): CandidateField Objects for OutputFC
    explicitMaxLength {int}: truncate field names to this integer length

    OUTPUT:
    appendNames (list): output field names for appended fields from input

    NOTES:
    (1) Honors Fully Qualified Field Names Env Setting in the case of joins.
    """

    #### Assess Whether Output is ShapeFile ####
    descWS = ARCPY.Describe(outPath)
    baseType = descWS.DataType
    if explicitMaxLength is not None:
        maxLen = explicitMaxLength
    else:
        if outPath == "in_memory":
            maxLen = 64
        else:
            isShapeFile = baseType.upper() == "FOLDER"
            if isShapeFile:
                maxLen = 10
            else:
                maxLen = 64

    #### Validate Field Names ####
    fieldNames = [ ARCPY.ValidateFieldName(i, outPath) for i in fieldNames ]

    #### Deal with Possible Candidate Fields ####
    upperAppendNames = []
    if candidateFields is not None:
        if isinstance(candidateFields, dict):
            upperAppendNames = [ i.upper() for i in candidateFields.keys() ]
        elif isinstance(candidateFields, list):
            if len(candidateFields):
                if isinstance(candidateFields[0], SSDO.CandidateField):
                    upperAppendNames = [ i.name.upper() for i in candidateFields ]
                else:
                    upperAppendNames = [ i.upper() for i in candidateFields ]

    #### Must Account for Static Output Field Names if Given ####
    appendNames = []

    #### Creates Unique Field Names ####
    for fieldName in fieldNames:
        fixedName = fieldName[:maxLen]
        upperName = fieldName.upper()
        idx = 1
        while upperName in upperAppendNames:
            suffix = "_%i" % idx
            lenSuff = len(suffix)
            fixedName = fixedName[:(maxLen - lenSuff)] + suffix
            upperName = fixedName.upper()
            idx += 1
        appendNames.append(fixedName)
        upperAppendNames.append(upperName)

    return appendNames

def createOutputFieldMap(inputFC, inFieldName, outFieldCandidate = None,
                         setNullable = False):
    """Creates a field map for use in feature class to feature class.

    INPUTS:
    inputFC (str): input feature class
    inFieldName (str): name of the field from inputFC to add
    outFieldCandidate {class, None}: instance of SSDO.CandiateField
    setNullable {bool, False}: set fields to nullable?

    OUTPUT:
    outFieldMap (obj): instance of ARCPY.FieldMap
    """

    #### Create Field Map from Input Feature Class ####
    outFieldMap = ARCPY.FieldMap()
    outFieldMap.addInputField(inputFC, inFieldName)

    #### Get Field Object ####
    outSource = outFieldMap.outputField

    #### Adjust Name, Alias and Type Based On Candidate Field ####
    if outFieldCandidate:
        outSource.name = outFieldCandidate.name
        outSource.aliasName = outFieldCandidate.alias
        try:
            outSource.type = convertTypeOut[outFieldCandidate.type]
        except:
            outSource.type = outFieldCandidate.type
        if outFieldCandidate.length:
            outSource.length = outFieldCandidate.length
        if outFieldCandidate.type.upper() in datePrecisionTypes and outFieldCandidate.precision == 0:
            outSource.precision = 0
        elif outFieldCandidate.precision:
            outSource.precision = outFieldCandidate.precision

    #### Set Fields to Nullable if not from Database ####
    if setNullable:
        outSource.isNullable = True

    #### Resfresh the Field Object ####
    outFieldMap.outputField = outSource

    return outFieldMap

def passiveDelete(inputFC):
    """Passively tries to delete feature classes and layers.

    INPUTS:
    inputFC (str): path to the feature class or layer
    """

    try:
        DM.Delete(inputFC)
    except:
        pass

def shapeFC2List(inputFC, spatialRef = None):
    """Returns all the shape attrs for a given feature class.

    INPUTS:
    inputFC (str): path to features or feature layer object
    spatialRef (object): instance of a spatial reference
    """

    #### Process Field Values ####
    fieldList = ["SHAPE@"]
    try:
        rows = DA.SearchCursor(inputFC, fieldList, "", spatialRef)
    except:
        ARCPY.AddIDMessage("ERROR", 204)
        raise SystemExit()

    shapeList = []
    for row in rows:
        feature = row[0]
        shapeList.append(feature)

    del rows

    return shapeList 

def readPolygonFC(inputFC, spatialRef = None, useGeodesic = False, allowCurves = True):
    """Reads a polygon feature class into a python dict.

    INPUTS:
    inputFC (str): catalogue path to the feature class
    spatialRef {str/obj, None}: output coordinate system projection
    useGeodesic (bool): return areas in geodesic meters?
    allowCurves (bool): allow curve rings in polygon(s)

    OUTPUT:
    polyDict (dict): [oid = list of xy-coordinates]
    polyArea (dict): [oid = area of polygon]
    """

    info = ARCPY.Describe(inputFC)
    oidName = info.oidFieldName
    fieldList = [oidName, "SHAPE@"]

    #### Process Field Values ####
    try:
        rows = DA.SearchCursor(inputFC, fieldList, "", spatialRef)
    except:
        ARCPY.AddIDMessage("ERROR", 204)
        raise SystemExit()

    polyDict = {}
    polyArea = {}
    for row in rows:
        oid, feature = row
        if feature is None:
            continue
        if feature.hasCurves and not allowCurves:
            ARCPY.AddIDMessage("ERROR", 110575)
            raise SystemExit()

        poly = []
        partNum = 0
        if feature.partCount == 1 and "curveRings" in feature.JSON:
            env = feature.extent
            poly.append((env.XMin, env.YMin))
            poly.append((env.XMax, env.YMax))
        else:
            partCount = feature.partCount
            while partNum < partCount:

                part = feature.getPart(partNum)
                point = part.next()
                pointCount = 0

                while point:
                    poly.append( (point.X, point.Y) )
                    point = part.next()
                    pointCount += 1

                partNum += 1

        polyDict[oid] = poly
        if useGeodesic:
            polyArea[oid] = feature.getArea('PRESERVE_SHAPE')
        else:
            polyArea[oid] = feature.area

    del rows

    return polyDict, polyArea

def createPolygonFC(outputFC, points, spatialRef = None):
    """Creates a polygon feature class from a set of points.

    INPUTS:
    outputFC (str): catalogue path to the feature class
    points (array): nx2 array of x,y coordinates
    spatialRef {str/obj, None}: output coordinate system projection
    """

    ARCPY.env.overwriteOutput = 1
    outPath, outName = OS.path.split(outputFC)
    outPolyFC = DM.CreateFeatureclass(outPath, outName, "POLYGON",
                                      "", "", "", spatialRef)
    outCursor = DA.InsertCursor(outputFC, ["SHAPE@"])
    polyArray = ARCPY.Array()
    for point in points:
        x, y = point
        pointOut = ARCPY.Point(x, y)
        polyArray.add(pointOut)
    addPoly = ARCPY.Polygon(polyArray)
    outCursor.insertRow([addPoly])

    del outCursor

def createLineFC(outputFC, points, spatialRef = None):
    """Creates a polygon feature class from a set of points.

    INPUTS:
    outputFC (str): catalogue path to the feature class
    points (array): nx2 array of x,y coordinates
    spatialRef {str/obj, None}: output coordinate system projection
    """

    ARCPY.env.overwriteOutput = 1
    outPath, outName = OS.path.split(outputFC)
    outPolyFC = DM.CreateFeatureclass(outPath, outName, "POLYLINE",
                                      "", "", "", spatialRef)
    outCursor = DA.InsertCursor(outputFC, ["SHAPE@"])
    c = 1
    for point in points[0:-1]:
        lineArray = ARCPY.Array()
        x0, y0 = point
        pointFrom = ARCPY.Point(x0, y0)
        x1,y1 = points[c]
        pointTo = ARCPY.Point(x1, y1)
        lineArray.add(pointFrom)
        lineArray.add(pointTo)
        addLine = ARCPY.Polyline(lineArray)
        outCursor.insertRow([addLine])
        c += 1

    del outCursor

def createPointFC(outputFC, points, spatialRef = None):
    """Creates a polygon feature class from a set of points.

    INPUTS:
    outputFC (str): catalogue path to the feature class
    points (array): nx2 array of x,y coordinates
    spatialRef {str/obj, None}: output coordinate system projection
    """

    ARCPY.env.overwriteOutput = 1
    outPath, outName = OS.path.split(outputFC)
    outPolyFC = DM.CreateFeatureclass(outPath, outName, "POINT",
                                      "", "", "", spatialRef)
    outCursor = DA.InsertCursor(outputFC, ["SHAPE@XY"])
    for point in points:
        outCursor.insertRow([point])

    del outCursor

def returnPolygon(polygonFC, spatialRef = None, useGeodesic = False, allowCurves = True):
    """Reads a polygon feature class and returns first geometry.

    INPUTS:
    polygonFC (str): catalogue path to the feature class
    spatialRef {str/obj, None}: output coordinate system projection
    useGeodesic (bool): return areas in geodesic meters?
    """

    polyInfo = readPolygonFC(polygonFC, spatialRef = spatialRef,
                             useGeodesic = useGeodesic, 
                             allowCurves = allowCurves)
    polyDict, polyArea = polyInfo
    if not len(polyDict):
        return None, None
    else:
        oidPoly = list(iterkeys(polyDict))[0]
        return polyDict[oidPoly], polyArea[oidPoly]

def getPolyExtent(polyDict):
    pointList = []
    for ind, poly in iteritems(polyDict):
        for point in poly:
            pointList.append(point)

    points = NUM.array(pointList)
    minX, minY = points.min(0)
    maxX, maxY = points.max(0)
    return ARCPY.Extent(minX, minY, maxX, maxY)

def chunk(values, chunkSize):
    """Groups a sequence into chunks of a given size.

    INPUTS:
    values (list): list of values
    chunkSize (int): number of values per chunk

    OUTPUT:
    contents (list): [ [chunk_1 of values] ... [chunk_k of values] ]
    """

    contents = []
    for value in values:
        contents.append(value)
        if len(contents) == chunkSize:
            yield contents
            contents = []
    if contents:
        yield contents

def sqlChunkStrings(inputFC, fieldName, chunks):
    """Creates a series of sql strings for selecting features in a
    feature class.

    INPUTS:
    inputFC (str): path to the input feature class.
    fieldName (str): field in the inputFC used for selection.
    chunks (list): [ [chunk_1 of values] ... [chunk_k of values] ] (1)

    OUTPUT:
    sqlStrings (list): list of sql strings for feature selection.

    NOTES:
    (1) The "chunks" argument is the result of the chunk function.
        In order for this function to work properly the input values for
        the chunk function must be sorted... however, it is OK to have
        missing values in the original sequence.
    """

    sqlStrings = []
    fieldString = ARCPY.AddFieldDelimiters(inputFC, fieldName)
    for chunk in chunks:
        minChunk = fieldString + " >= " + str(min(chunk))
        maxChunk = fieldString + " <= " + str(max(chunk))
        sqlValue = minChunk + " And " + maxChunk
        sqlStrings.append(sqlValue)

    return sqlStrings

######################## Table Printing ######################
def couldExportHTMLMessage():
    """
    Test if current environment support the HTML message output
    Returns
                boolean
    -------

    """
    import sys as SYS
    if SYS.executable.find("ArcGISPro.exe") > -1:
        res = True
    else:
        res = False
    return res


def outputTextTable(x, justify="left", header="NULL",
                    footnote=None, pad=0,
                    titleFillToken=" ", colPad=1,
                    emptyFillToken=" ", emptyCellTag="@@none",
                    returnHTMLMsg=False, boldRows=None, boldCols=None, emphasizeHeadRow=True,
                    tableSize=None, force2Txt=False):
    """
    Provides a table for pretty printing.
    Parameters
    ----------
    x                   : list of list
                         list of lists, rows in tables
    justify             : list or string
                         justification of columns default value as "left"
    header              : str
                         the title of your table default as None
    footnote            : list of elements
                         list of elements, the footnote to append to the bottom of the table
    pad                 : int, default=0
                         (only for text table) empty lines before and after the table
    titleFillToken      : str, default=" "
                         (only for text table) the character used for filling the empty space around table title
    colPad              : int, default=1
                         (only for text table) pads empty space between columns
    emptyFillToken      : str, default=" "
                         (only for text table) the character used for filling the empty space in table cell
    emptyCellTag        : str, default="@@none"
                         the tag used for representing "null cell".
                         This null cell will be replaces as empty cell in the text table, and will be skipped in the HTML table
    returnHTMLMsg       : boolean, default=False
                         (only for HTML table) indicate whether to return the json string, or directly print the table in the function
    boldRows            : list or int, default=None
                         (only for HTML table) which row(s) to set as bold in the table.
    boldCols            : list or int, default=None
                         (only for HTML table) which column(s) to set as bold in the table.
    emphasizeHeadRow    : boolean, default=True
                         (only for HTML table) whether set the first row of the table as bold.
    tableSize           : {None, "small", "medium", "large"}, default=None
                         (only for HTML table) the width of the table.
                         small:  50% of the dialogue width
                         medium: 70% of the dialogue width
                         large:  100% of the dialogue width
                         Default value is None, which means large
    force2Txt           : boolean, default=True
                         whether force export plain text table.
                         We keep this param because some old tool need to save the report to text file, which requires the plain table format even in the Pro enviroment

    Returns
    -------
                        : str
                         the json string for HTML table or the txt string for plain table
    """
    if couldExportHTMLMessage() and not force2Txt:
        # generate HTML table
        json_str = outputTextTable_HTML(x, justify=justify, header=header, footnote=footnote,
                                        emptyCellTag=emptyCellTag, boldRows=boldRows, boldCols=boldCols,
                                        emphasizeHeadRow=emphasizeHeadRow, tableSize=tableSize)
        if returnHTMLMsg:
            return json_str
        else:
            ARCPY.AddMessage(json_str)
            return ""
    else:
        # generate plain text table
        return outputTextTable_Plain(x, justify=justify, header=header, footnote=footnote, pad=pad,
                                     titleFillToken=titleFillToken, colPad=colPad,
                                     emptyFillToken=emptyFillToken, emptyCellTag=emptyCellTag)



def outputTextTable_Plain(x, justify="left", header="NULL", footnote=None, pad=0,
                          titleFillToken=" ", colPad=1,
                          emptyFillToken=" ", emptyCellTag="@@none"):
    """
    Provides a table as a string for pretty printing.
    Parameters
    ----------
    x                   : list of list
                         list of lists, rows in tables
    justify             : list or string
                         justification of columns default value as "left"
    header              : str
                         the title of your table default as None
    footnote            : list of elements
                         list of elements, the footnote to append to the bottom of the table
    pad                 : int, default=0
                         (only for text table) empty lines before and after the table
    titleFillToken      : str, default=" "
                         (only for text table) the character used for filling the empty space around table title
    colPad              : int, default=1
                         (only for text table) pads empty space between columns
    emptyFillToken      : str, default=" "
                         (only for text table) the character used for filling the empty space in table cell
    emptyCellTag        : str, default="@@none"
                         the tag used for representing "null cell".
                         This null cell will be replaces as empty cell in the text table, and will be skipped in the HTML table
    Returns
    -------
                        : str
                         the txt string for plain table
    """
    colPadStr = " " * colPad

    #### Get Info and Type Checks ####
    firstCol = 0
    if type(x[0]) != list:
        if x[0] != "EMPTY":
            x = [x]
        else:
            firstCol = 1
    nRows = len(x)
    nCols = len(x[firstCol])
    rangeCol = ssRange(nCols)
    if type(justify) != list:
        justify = [ justify for i in rangeCol ]

    #### Get Column Widths ####
    cLengths = [ 0 for i in rangeCol ]
    strList = []
    for l in x:
        #### Empty Rows ####
        if l == "EMPTY":
            strList.append(l)
        else:
            stemp = []
            for item in l:
                if isString(item):
                    if item == emptyCellTag:
                        stemp.append("")
                    else:
                        stemp.append(item)
                else:
                    stemp.append(assembleMessageUnit(item))

            ltemp = [len(item) for item in stemp]
            strList.append(stemp)
            c = 0
            for place in ltemp:
                if place > cLengths[c]:
                    cLengths[c] = place
                c+=1

    #### Calculate Length of Header/Title ####
    headerLength = sum(cLengths)
    if colPad > 1:
        extraPadForHeader = (colPad - 1) * (nCols - 1)
        headerLength += int(extraPadForHeader)
        if titleFillToken != " ":
            headerLength += 1

    #### Justify All Rows and Columns ####
    final = []
    for l in strList:
        if l == "EMPTY":
            final.append(emptyFillToken * headerLength)
        else:
            newRow = []
            c = 0
            for item in l:
                ls = cLengths[c]
                frmt = justify[c]
                newString = returnAdjustedString(item, ls, frmt)
                newRow.append(newString)
                c+=1
            final.append(colPadStr.join(newRow))
    table = "\n".join(final)

    #### Set Optional Header/Title ####
    if header != "NULL" and header is not None:
        header = assembleMessageUnit(header)
        if titleFillToken != " ":
            header = " " + header + " "
        header = returnAdjustedString(header, headerLength, "center", titleFillToken)
        table = header + "\n" + table

    #### Add Footnote if provided ####
    if isinstance(footnote, list):
        table += "\n" + "\n".join(list(map(assembleMessageUnit, footnote)))
    elif footnote is not None:
        table += "\n" + assembleMessageUnit(footnote)

    #### Set Optional Cushion Before and After Table ####
    if pad == 1:
        table = "\n" + table + "\n"

    return table


def returnAdjustedString(xString, length, justify = "left", token = " "):
    """Returns string justifed with the appropriate amount of pad and to the
    correct anchor.

    INPUTS:
    xString (str): string to be formatted
    length (int): total length used to format and anchor
    justify {str, left}: location of anchor

    OUTPUT: res (str): formatted xString
    """

    if justify == "right":
        res = xString.rjust(length, token)
    elif justify == "center":
        res = xString.center(length, token)
    else:
        res = xString.ljust(length, token)

    return res


def outputTextTable_HTML(x, justify="left", header="NULL",
                         footnote=None, emptyCellTag="@@none",
                         boldRows=None, boldCols=None, emphasizeHeadRow=True,
                         tableSize=None):
    """
    Provides a table for pretty printing.
    Parameters
    ----------
    x                   : list of list
                         rows in tables
    justify             : list or string
                         justification of columns default value as "left"
    header              : str
                         the title of your table default as None
    footnote            : list of elements
                         list of elements, the footnote to append to the bottom of the table
    emptyCellTag        : str, default="@@none"
                         the tag used for representing "null cell".
                         This null cell will be replaces as empty cell in the text table, and will be skipped in the HTML table
    boldRows            : list or int, default=None
                         (only for HTML table) which row(s) to set as bold in the table.
    boldCols            : list or int, default=None
                         (only for HTML table) which column(s) to set as bold in the table.
    emphasizeHeadRow    : boolean, default=True
                         (only for HTML table) whether set the first row of the table as bold.
    tableSize           : {None, "small", "medium", "large"}, default=None
                         (only for HTML table) the width of the table.
                         small:  50% of the dialogue width
                         medium: 70% of the dialogue width
                         large:  100% of the dialogue width
                         Default value is None, which means large
    Returns
    -------
                        : str
                         the json string for HTML table
    """

    import json
    required_formatting = {
        "element": "table",
    }
    # Empty element list to be modified (also part of the template - stripped down for ease)
    elements = {
        "striped": "true"
    }
    if isString(tableSize):
        tableSize = tableSize.lower()
        if tableSize not in ["small", "medium", "large"]:
            tableSize = "large"
        elements["className"] = tableSize
    if not emphasizeHeadRow:
        elements["noHeader"] = True

    firstCol = 0
    if type(x[0]) != list:
        if x[0] != "EMPTY":
            x = [x]
        else:
            firstCol = 1
    nRows = len(x)
    nCols = len(x[firstCol])

    if isNumeric(boldRows):
        boldRows = [boldRows]
    elif not isinstance(boldRows, list):
        boldRows = []

    if isNumeric(boldCols):
        boldCols = [boldCols]
    elif not isinstance(boldCols, list):
        boldCols = []

    #### Add Footnote if provided ####
    if footnote:
        if not isinstance(footnote, list):
            footnote = [footnote]
        elements["footnote"] = footnote

    # Lists that will be used to store results
    data_list = []
    if header != "NULL" and header is not None:
        # data_list.append([{"content": header, "prop":"colspan='{}'".format(nCols)}])
        elements["title"] = header
    for indRow, l in enumerate(x):
        #### Empty Rows ####
        if l == "EMPTY":
            if indRow not in [0, nRows - 1]:
                data_list.append([""] * nCols)
        else:
            # stemp = [str(item)
            #          if not isString(item)
            #          else item for item in l]
            stemp = []
            for indCol, item in enumerate(l):
                if item == emptyCellTag:
                    continue
                if isinstance(item, dict):
                    if indRow in boldRows or indCol in boldCols:
                        if isinstance(item, list):
                            item = {"data": item, "prop": {"font-weight": "bold"}}
                        else:
                            if "prop" in item:
                                item["prop"]["font-weight"] = "bold"
                            else:
                                item["prop"] = {"font-weight": "bold"}
                    stemp.append(item)
                else:
                    if isinstance(item, list):
                        item_str = []
                        for i in item:
                            if isinstance(i, dict):
                                item_str.append(i)
                            else:
                                item_str.append(str(i))
                        item = item_str
                    else:
                        item = str(item)

                    if indRow in boldRows or indCol in boldCols:
                        stemp.append({"data": item, "prop": {"font-weight": "bold"}})
                    else:
                        stemp.append(item)
            data_list.append(stemp)

    if type(justify) != list:
        justify = [justify] * nCols
    for ind, jstf in enumerate(justify):
        elements[str(ind)] = {
            "align": jstf,
            "pad": "0px",
            "wrap": True
        }

    # Update the format template with the values and formatting
    required_formatting["data"] = data_list
    required_formatting["elementProps"] = elements
    required_formatting = [required_formatting]

    json_string = """json:\n{}""".format(json.dumps(required_formatting))
    return json_string


def outputSectionalTitle(title, returnHTMLMsg=False):
    """
    This function can only be used in Pro's environment
    Parameters
    ----------
    title       : str or list
                 the body of the title
    returnHTMLMsg   : boolean, default=False
                 if return the message or directy print the title

    Returns
                : str
                 the json string of the title
    -------

    """
    if not couldExportHTMLMessage():
        return
    required_formatting = {
        "element": "SectionTitle",
        "data": title
    }
    json_string = """json:\n{}""".format(JSON.dumps(required_formatting))
    if returnHTMLMsg:
        return json_string
    else:
        ARCPY.AddMessage(json_string)


def buildTableCell(data, align=None, bold=False, rowSpan=1, colSpan=1):
    """
    Build the html table cell element
    Parameters
    ----------
    data        : str or list
                 the body of the cell
    align       : {"left", "right", "center", None}, default=None
                 the alignment of the cell text. The default is None, which means "left"
    bold        : boolean, default=False
                 if the use bold text font
    rowSpan     : int, default=1
                 the span of this cell across rows
    colSpan     : int, default=1
                 the span of this cell across columns

    Returns
    -------
                : dict
                 the dict object of the table cell

    """
    if not isinstance(data, list):
        data = str(data)
    cell = {
        "data": data,
        "prop": {}
    }
    if align:
        if align.lower() not in ["right", "left", "center"]:
            align = "left"
        cell["prop"]["text-align"] = align
    if bold:
        cell["prop"]["font-weight"] = "bold"
    if rowSpan > 1:
        cell["prop"]["rowspan"] = rowSpan
    if colSpan > 1:
        cell["prop"]["colspan"] = colSpan
    return cell


def buildHyperlink(text, link=None):
    """
    Build the html hyperlink element
    Parameters
    ----------
    text    : str
             the text of the link
    link    : str
             the target of the link

    Returns
    -------
            : dict
             the dict object of the hyperlink
    """
    result = {
        "element": "hyperlink",
        "data": text
    }
    if link is not None:
        result["link"] = link
    return result


def buildSuperscript(text):
    """
    Build the html superscript element
    Parameters
    ----------
    text    : str
             the body of the superscript
    Returns
    -------
            : dict
             the dict object of the superscript
    """
    return {
        "element": "sup",
        "data": text
    }


def buildSubscript(text):
    """
    Build the html subscript element
    Parameters
    ----------
    text    : str
             the body of the subscript
    Returns
    -------
            : dict
             the dict object of the subscript
    """
    return {
        "element": "sub",
        "data": text
    }


def buildLineBreak():
    """
    Build the line breaker for HTML message
    Returns
    -------
            : dict
             the dict object of the line break
    """
    return {"element": "break"}


def assembleMessageUnit(message):
    """
    Extract the text content from the input message elements and convert them into a single string
    so they can be printed in the plain text message
    Parameters
    ----------
    message     : list or dict or str
                 the body of the message

    Returns
    -------
                : str
                 the converted text string
    """
    line = ""
    if not isinstance(message, list):
        message = [message]

    for ele in message:
        if isinstance(ele, dict):
            if "data" in ele and "element" not in ele:
                data = ele["data"]
                if isinstance(data, list):
                    line += assembleMessageUnit(data)
                else:
                    line += str(data)
            else:
                try:
                    eleType = ele["element"].lower()
                    if eleType == "hyperlink":
                        s = str(ele["data"])
                        if "link" in ele:
                            s += "({})".format(ele["link"])
                        line += s
                    elif eleType in ["sup", "superscript"]:
                        line += "({})".format(ele["data"])
                    elif eleType in ["sub", "subscript"]:
                        line += "[{}]".format(ele["data"])
                    elif eleType == "break":
                        line += "\n"
                    else:
                        line += str(ele)
                except:
                    continue
        else:
            line += str(ele)

    return line


def outputBulletList(items, ordered=False, returnHTMLMsg=False, force2Txt=False):
    """
    Provides a bullet list as a string for pretty printing.
    Parameters
    ----------
    items           : list
                     list of items
    ordered         : boolean, default=False
                     whether the list is ordered or not
    returnHTMLMsg   : boolean
                     whether to return the json string, or directly print the table in the function
    force2Txt       : boolean, default=True
                     whether force export plain text table.
                     We keep this param because some old tool need to save the report to text file, which requires the plain table format even in the Pro enviroment

    Returns
    -------
                    : str
                     the json string for HTML list or the txt string for plain list
    """
    if couldExportHTMLMessage() and not force2Txt:
        json_str = outputBulletList_HTML(items, ordered=ordered)
        if returnHTMLMsg:
            return json_str
        else:
            ARCPY.AddMessage(json_str)
            return ""
    else:
        # generate plain text table
        return outputBulletList_Plain(items, ordered=ordered)


def outputBulletList_Plain(items, ordered=False):
    """
    Provides a bullet list as a string for pretty printing.
    Parameters
    ----------
    items           : list
                     list of items
    ordered         : boolean, default=False
                     whether the list is ordered or not

    Returns
    -------
                    : str
                     the txt string for plain list
    """
    result = ""
    if ordered:
        maxSpace = int(MATH.log10(len(items)))
        for ind, x in enumerate(items):
            extraSpace = " " * (maxSpace - int(MATH.log10(ind + 1)))
            result += "{}. {}{}\n".format(ind + 1, extraSpace, assembleMessageUnit(x))
    else:
        for x in items:
            result += "- {}\n".format(assembleMessageUnit(x))
    return result


def outputBulletList_HTML(items, ordered=False):
    """
    Provides a bullet list as a string for pretty printing.
    Parameters
    ----------
    items           : list
                     list of items
    ordered         : boolean, default=False
                     whether the list is ordered or not

    Returns
    -------
                    : str
                     the json string for HTML list
    """
    if ordered:
        element = "orderedlist"
    else:
        element = "unorderedlist"
    data = {
        "element": element,
        "data": items
    }
    json_string = """json:\n{}""".format(JSON.dumps(data))
    return json_string


def outputParagraph(message, returnHTMLMsg=False, force2Txt=False):
    """
    Provides a Paragraph as a string for pretty printing.
    Parameters
    ----------
    message         : str or list
                     the body of the paragraph
    returnHTMLMsg   : boolean
                     whether to return the json string, or directly print the table in the function
    force2Txt       : boolean, default=True
                     whether force export plain text table.
                     We keep this param because some old tool need to save the report to text file, which requires the plain table format even in the Pro enviroment

    Returns
    -------
                    : str
                     the json string for HTML paragraph or the txt string for plain paragraph
    """
    if couldExportHTMLMessage() and not force2Txt:
        data = {
            "element": "content",
            "data": message
        }
        json_str = """json:\n{}""".format(JSON.dumps(data))
        if returnHTMLMsg:
            return json_str
        else:
            ARCPY.AddMessage(json_str)
            return ""
    else:
        # generate plain text table
        return assembleMessageUnit(message)


def outputHeader(header, level=5, returnHTMLMsg=False):
    """
    Provides a HTML header for pretty printing.
    (This function can only be used in Pro's environment)

    Parameters
    ----------
    header          : str or list
                     the body of the paragraph
    level           : {1, 2, 3, 4, 5}, default=5
                     the level of the header (the smaller value, the larger font)
    returnHTMLMsg   : boolean
                     whether to return the json string, or directly print the table in the function
    Returns
    -------
                    : str
                     the json string for HTML paragraph or the txt string for plain paragraph
    """
    if not couldExportHTMLMessage():
        return
    if level not in {1, 2, 3, 4, 5}:
        level = 5
    required_formatting = {
        "element": "h{}".format(level),
        "data": header
    }
    json_string = """json:\n{}""".format(JSON.dumps(required_formatting))
    if returnHTMLMsg:
        return json_string
    else:
        ARCPY.AddMessage(json_string)


def outputAccordion(items, title, titleLevel=5, expand=True, returnHTMLMsg=False, force2Txt=False, titleFillToken="*"):
    """
    Provide an HTML Accordion for pretty printing
    Parameters
    ----------
    items               : list
                          the elements/content of the accordion, each item could be one of these types:
                          [Table, BulletList, Paragraph, RawText].
                          When praparing the HTML elements, set the parameter "returnHTMLMsg=True" in order to get the
                          json string and insert them into this items list.
    title               : str
                          The title of the accordion.
    titleLevel          : {1, 2, 3, 4, 5, 6}, default=5
                          (only for HTML accordion) The level of the title of the accordion.
                          Default level is 5, same as table's title
    expand              : bool, default=True
                          (only for HTML accordion) Whether the intial status of the accordion is expanded or collapsed
    returnHTMLMsg       : boolean, default=False
                         (only for HTML accordion) indicate whether to return the json string, or directly print the
                         table in the function
    force2Txt           : boolean, default=True
                          whether force export plain accordion.
    titleFillToken      : str, default="*"
                         (only for text accordion) the character used for filling the empty space around the accordion title

    Returns
    -------

    """
    if not isinstance(items, list):
        items = str(items)
    for item in items:
        if not isinstance(item, str):
            ARCPY.AddError("All the items should be prepared (JSON)String Type.")
            raise SystemExit()
    if title is None:
        title = ""

    if couldExportHTMLMessage() and not force2Txt:
        # generate HTML accordion
        json_str = outputAccordion_HTML(items, title, titleLevel=titleLevel, expand=expand)
        if returnHTMLMsg:
            return json_str
        else:
            ARCPY.AddMessage(json_str)
            return ""
    else:
        # generate plain text accordion
        return outputAccordion_Plain(items, title, titleLevel=titleLevel, titleFillToken=titleFillToken)


def outputAccordion_HTML(items, title, titleLevel=5, expand=True):
    required_formatting = {
        "element": "accordion",
    }
    # Empty element list to be modified (also part of the template - stripped down for ease)
    elements = {
        "title": title,
        "level": titleLevel,
        "expand": expand
    }
    data = []
    for item in items:
        if item.startswith("json:"):
            itemObj = JSON.loads(item[5:])
            if isinstance(itemObj, list):
                data += itemObj
            else:
                data.append(itemObj)

    required_formatting["data"] = data
    required_formatting["elementProps"] = elements
    required_formatting = [required_formatting]

    json_string = """json:\n{}""".format(JSON.dumps(required_formatting))
    return json_string


def outputAccordion_Plain(items, title, titleLevel=5, titleFillToken="*"):
    if not isinstance(titleFillToken, str) or len(titleFillToken)!=1:
        titleFillToken = None
    message = ""
    if titleFillToken:
        title = "{} {} {}".format(titleFillToken, assembleMessageUnit(title), titleFillToken)
        message = titleFillToken * len(title) + "\n" + title + "\n" + titleFillToken * len(title) + "\n"
        maxLineLength = 0
        for item in items:
            for line in item.split("\n"):
                if maxLineLength < len(line):
                    maxLineLength = len(line)
        message += titleFillToken * maxLineLength + "\n"
        message += "\n".join(items)
        message += "\n" + titleFillToken * maxLineLength
    else:
        message = title + "\n".join(items)
    return message


#################### Class Helper Functions ##################

def assignClassAttr(instanceOfClass, attributes):
    """Assigns self.attributes to given class.

    INPUTS:
    instanceOfClass (class): instance of a class
    attributes (dict): usually locals()
    """

    for key, value in iteritems(attributes):
        if key != 'self':
            setattr(instanceOfClass, key, value)

##################### Geometry Functions ######################

def projectExtent(extent, sourceSpatialRef, targetSpatialRef):
    """Change projection of a extent

    INPUTS:
    extent (extent): instance of extent
    sourceSpatialRef (spatial ref): spatial ref source
    targetSpatialRef (spatial ref): spatial ref target
    """

    extentList =NUM.array([ [extent.XMin, extent.YMax],[ extent.XMax, extent.YMin] ])
    pointsProjected = ARC._ss.lonlat_to_xy_projected(extentList,
                                               sourceSpatialRef,
                                               targetSpatialRef)

    return [ pointsProjected[0][0], pointsProjected[1][1], 
             pointsProjected[1][0], pointsProjected[0][1] ]

def getConvexHull(xyCoords, spatialRef = None):
    """Returns ArcPy Convex Hull Polygon for the given points.
    
    INPUTS:
    xyCoords (array): xy-coordinates
    spatialRef (object): instance of a spatial reference
    """
    if len(xyCoords) > 2:
        hull = SCPS.ConvexHull(xyCoords)
        polyArray = ARCPY.Array()
        for vertex in hull.vertices:
            x,y = xyCoords[vertex]
            pointOut = ARCPY.Point(x, y)
            polyArray.add(pointOut)

        polygon = ARCPY.Polygon(polyArray, spatialRef)
        return polygon
    else:
        return None

class Envelope(object):
    """Creates and study area envelope based on the given extent.

    INPUTS:
    extent (obj): instance of an extent object.

    ATTRIBUTES:
    envelope (list): [minX, minY, maxX, maxY]
    maxExtent (float): max length of extent
    minExtent (float): min length of extent
    extArea (float): area of envelope
    """

    def __init__(self, extent):
        self.envelope = getExtent(extent)
        lenX = abs(self.envelope[2] - self.envelope[0])
        lenY = abs(self.envelope[3] - self.envelope[1])
        self.minExtent, self.maxExtent = NUM.sort([lenX, lenY])
        self.extArea = self.minExtent * self.maxExtent
        sumExtent = self.maxExtent + self.minExtent
        self.tolerance = sumExtent * MATH.exp(-10.0)
        self.lenX = lenX
        self.lenY = lenY

class SpheroidSlice(object):
    """Creates and study area envelope based on the given extent.

    INPUTS:
    extent (obj): instance of an extent object.

    ATTRIBUTES:
    envelope (list): [minX, minY, maxX, maxY]
    maxExtent (float): max length of extent
    minExtent (float): min length of extent
    extArea (float): area of envelope
    """

    def __init__(self, extent, spatialRef):
        xMin, yMin, xMax, yMax = getExtent(extent)
        topX =  ARC._ss.chordal_dist(xMin, xMax, yMax, yMax, spatialRef)
        bottomX =  ARC._ss.chordal_dist(xMin, xMax, yMin, yMin, spatialRef)
        leftY =  ARC._ss.chordal_dist(xMin, xMin, yMin, yMax, spatialRef)
        rightY =  ARC._ss.chordal_dist(xMax, xMax, yMin, yMax, spatialRef)
        sortX = max(topX, bottomX)
        sortY = max(leftY, rightY)
        self.minExtent, self.maxExtent = NUM.sort([sortX, sortY])
        sumExtent = self.maxExtent + self.minExtent
        self.tolerance = sumExtent * MATH.exp(-10.0)
        self.topX = topX
        self.bottomX = bottomX
        self.leftY = leftY
        self.rightY = rightY

        #### Create Rough Estimate of Degrees to Meters ####
        diagChordal = ARC._ss.chordal_dist(xMin, xMax, yMax, yMin, spatialRef)
        diagEuc = ARC._ss.euclidean_dist(xMin, xMax, yMax, yMin)
        try:
            self.meters2DegreeRatio = diagEuc / diagChordal
            self.degrees2MeterRatio = diagChordal / diagEuc
        except:
            self.meters2DegreeRatio = None
            self.degrees2MeterRatio = None

class MinRect(object):
    """Creates and study area envelope based on the given extent.

    INPUTS:
    extent (obj): instance of an extent object.

    ATTRIBUTES:
    envelope (list): [minX, minY, maxX, maxY]
    maxExtent (float): max length of extent
    minExtent (float): min length of extent
    extArea (float): area of envelope
    """

    def __init__(self, minRectFC, spatialRef = None):
        self.minRectFC = minRectFC
        self.spatialRef = spatialRef
        self.parseInfo()

    def parseInfo(self):
        lf = ARCPY.ListFields(self.minRectFC, "MBG_Orientation")
        if len(lf):
            fieldList = ["SHAPE@", "MBG_Width",
                         "MBG_Length", "MBG_Orientation"]
        else:
            fieldList = ["SHAPE@", "MBG_Width",
                         "MBG_Length", "MBG_Orient"]
        rows = DA.SearchCursor(self.minRectFC, fieldList, "", self.spatialRef)
        polygon, width, length, orientation = rows.next()
        del rows
        self.width = width
        self.length = length
        self.orientation = orientation
        self.polygon = polygon
        self.area = polygon.area
        self.minLength, self.maxLength = NUM.sort([width, length])
        sumExtent = self.maxLength + self.minLength
        self.tolerance = sumExtent * MATH.exp(-10.0)

def getPoint3DFromAnglesDistance(x, y, z, azimuth, theta, length):
    """Calculate the position of 3D point using an initial point, angles,
       and distances
    INPUTS:
    x {float}: X starting point
    y {float}: X starting point
    z {float}: Z starting point
    azimuth {float}: azimuth degrees
    theta {float}: angle between Z and plance XY
    length {float}: distance 
    OUTPUT:
    xNew {float}  : new X position
    yNew {float}  : new Y position
    zNew {float}  : new Z position
    """
    
    xNew = x + NUM.sin(convert2Radians(azimuth)) * NUM.sin(convert2Radians(theta)) * length
    yNew = y + NUM.cos(convert2Radians(azimuth)) * NUM.sin(convert2Radians(theta)) * length
    zNew = z + NUM.cos(convert2Radians(theta)) * length
    
    return xNew, yNew, zNew


def getSphericalCoord(dX, dY, dZ):
    """Get spherical coordinates from XYZ
    INPUTS:
    dX {float}: X axe
    dY {float}: Y axe
    dZ {float}: Z axe
    OUTPUT:
    phi {float}    : Angle clockwise - reference Y (Azimuth)
    theta {float}  : Angle between plane XY and Z
    h {float}      : radial distance
    """
    
    h = NUM.sqrt(dX**2 + dY**2 + dZ**2)
    if (h == 0):
        return 0, 0, 0
    theta = NUM.arccos (dZ / h)
    phi = getAngle(dX, dY)
    return convert2Degree(phi), convert2Degree(theta), h

def createCloudEllipsoid(a,b,c, res=5.0, X=0.0, Y=0.0, Z=0.0):
    """Create a cloud of points that representing an Ellipsoid
    INPUT:
    a {float}: first radio
    b {float}: second radio
    c {float}: third radio
    res {float}: define resolution of ellipsoid
    X {float} : center X
    Y {float} : center Y
    Z {float} : center Z
    OUTPUT:
    points {array}: cloud of points
    """
    iniu=0
    factor=NUM.pi / 180.0
    pos = []
    resf = res * factor
    for u in range(-90 ,90, res):
        for v in range(-180,181,res):
            pos.append([(a * NUM.cos(u * factor) * NUM.cos(v * factor)) + X,
                        (b * NUM.cos(u * factor) * NUM.sin(v * factor)) + Y,
                        ( c *  NUM.sin(u* factor)) + Z])
            pos.append([(a * NUM.cos((u * factor) +resf) * NUM.cos(v * factor)) + X,
                (b * NUM.cos((u * factor) +resf) * NUM.sin(v * factor)) + Y,
                (c *  NUM.sin((u * factor) +resf)) + Z])
    return NUM.array(pos) 


def convert2Radians(degree):
    """Converts degree to radians.

    INPUTS:
    degree (float): degree of angle

    RETURN (float): radians of angle
    """

    return NUM.pi / 180.0 * degree

def convert2Degree(radians):
    """Converts radians to degree.

    INPUTS:
    radians (float): radians of angle

    RETURN (float): degree of angle
    """

    return radians * (180.0 / NUM.pi)

def getAzmth(v):
    """ Get directional angles 
    INPUT:
        v  (float/1d Array): Angle in degrees
    OUTPUT:
        1d array/ float: Azimuth 
    """

    r = v*NUM.pi/180.0
    y = NUM.sin(r)
    x = NUM.cos(r)
    ang = NUM.arctan2(y,x)* 180 / NUM.pi
    if type(v) in [NUM.float32, NUM.float64, NUM.int32]:
        if ang < 0:
            return ang+360.0
        else:
            return ang
    else:
        mask = NUM.array(ang) < 0
        ang[mask]+=360.0
        return ang

def normXGCS(x, isGCS):
    """ Normalize angles using by IEEE convention  
    INPUT:
        x (1d Array): Array in angles (degrees)
        isGCS (bool): values is GCS or pannable
    RETURN:
        x (1d Array): Array in angles normalize (degrees)
    """
    if isGCS:
        return normalize(x)
    else:
        return x

def normalize(x):
    """ Normalize angles using by IEEE convention  
    INPUT:
        x (1d Array): Array in angles (degrees)
    RETURN:
        x (1d Array): Array in angles normalize (degrees)
    """
    values = x*NUM.pi/180.0
    sv = NUM.sin(values)
    cv = NUM.cos(values)
    return NUM.arctan2(sv, cv)* 180 / NUM.pi

def meanCenterAngular(x):
    """ Calculate angular mean 
    INPUT:
        x (1d Array): Array in angles (degrees)
    RETURN:
        float : mean angle
    """
    sv = NUM.sin(x*NUM.pi/180.0)
    cv = NUM.cos(x*NUM.pi/180.0)
    return NUM.arctan2(sv.sum()/len(sv), cv.sum()/len(sv))* 180 / NUM.pi

def getAngle(numer, denom):
    """Calculates the angle for Used in the
    Linear Directional Mean Tool.

    INPUTS:
    numer (float): numerator
    denom (float): denominator
    """

    if NUM.isclose([denom],[0.0])[0] and NUM.isclose([numer],[0.0])[0]:
        return  -1.0

    if NUM.isclose([denom],[0.0])[0]:
        if numer > 0:
            #### 90 Degrees in Radians ####
            return NUM.pi / 2.0
        else:
            #### 270 Degrees in Radians ####
            return 1.5 * NUM.pi

    if  NUM.isclose([numer],[0.0])[0]:
        if denom > 0.0:
            #### 0 Degrees in Radians ####
            return 0
        else:
            #### 180 Degrees in Radians ####
            return NUM.pi 

    ratio = abs(NUM.arctan(numer / denom))

    #### Quadrant Adjustment ####
    if numer > 0:
        if denom > 0:
            #### X and Y Positive (First Quadrant) ####
            angle = ratio
        else:
            #### Special Case of Single Up Arrow ####
            if denom == -1.0:
                angle = ratio
            else:
                #### Y is Negative (Second Quadrant) ####
                angle = NUM.pi - ratio
    else:
        if denom < 0:
            #### X and Y Negative (Third Quadrant) ####
            angle = NUM.pi + ratio
        else:
            #### Y is Positive (Fourth Quadrant) ####
            angle = (2.0 * NUM.pi) - ratio

    return angle

def nearestPoint(studyAreaPoly, gaTable):
    """Code to perform NEAR functionality (1).

    INPUTS:
    studyAreaPoly (array): polygon boundary array
    gaTable (obj): GA Table containing feature centroids

    OUTPUT:
    nearDict (dict): [id = distance to nearest feature]
    nearXY (dict): [id = xy-coordinates to nearest feature]
    nextDict (dict): [id = distance to next nearest feature]

    NOTES:
    (1) Given a set of points and also points defining a study area, this tool
        returns for each point the shortest distance to the study area and the
        X/Y coordinate where that distance intersects the study area.
    """

    nearDict = {}
    nearXY = {}
    nextDict = {}
    N = len(gaTable)

    for i in ssRange(N):
        row = gaTable[i]
        id = row[0]
        point = row[1]
        poly0 = studyAreaPoly[0]
        dist = []
        for poly1 in studyAreaPoly[1:]:
            deltaX = poly1[0] - poly0[0]
            deltaY = poly1[1] - poly0[1]
            delta1X = point[0] - poly0[0]
            delta1Y = point[1] - poly0[1]

            lenSq = ((poly0[0] - poly1[0])**2.0 + \
                    (poly0[1] - poly1[1])**2.0)

            if (lenSq == 0 or point == poly0):
                nearDict[id] = 0.0
                nearXY[id] = poly0
                distSq = 0.0

            else:
                #### Not Normalized ####
                dT = (deltaX * delta1X) + (deltaY * delta1Y)

                #### Nearest Relative to poly1 ####
                nearPointX = dT * deltaX
                nearPointY = dT * deltaY

                delta1X = (delta1X * lenSq - nearPointX)/lenSq
                delta1Y = (delta1Y * lenSq - nearPointY)/lenSq

                dT = dT / lenSq

                if dT <= 0.0:
                    nearPointX = poly0[0]
                    nearPointY = poly0[1]
                elif dT >= 1.0:
                    nearPointX = poly1[0]
                    nearPointY = poly1[1]
                else:
                    nearPointX = poly0[0] + (nearPointX / lenSq)
                    nearPointY = poly0[1] + (nearPointY / lenSq)

                #### Calculate Distance ####
                distSq = (nearPointX - point[0])**2.0 \
                         + (nearPointY - point[1])**2.0
                try:
                    if distSq < nearDict[id]:
                        nearDict[id] = distSq
                        nearXY[id] = (nearPointX, nearPointY)
                except:
                    nearDict[id] = distSq
                    nearXY[id] = (nearPointX, nearPointY)
            poly0 = poly1
            dist.append(distSq)

        nearDict[id] = MATH.sqrt(nearDict[id])
        dist.sort()
        nextDict[id] = MATH.sqrt(dist[1])

    return nearDict, nearXY, nextDict

def minBoundGeomPoints(xyCoords, outputFC,
                       geomType = "RECTANGLE_BY_AREA",
                       spatialRef = None):
    """Wraps the Minimum Bounding Geometry Tool for xy-coordinates. (1)

    INPUTS:
    xyCoords (array): xy-coordinates
    outputFC (str): path to the output feature class
    geomType {str, RECTANGLE_BY_AREA}: type of bounding geometry (2, 3)
    spatialRef {obj, None}: instance of a spatial reference object

    NOTES:
    (1) This tool is designed to always use the centroids of features for
        the minimum bounding geometry.  As such, the tool takes point
        coordinates that you have already read in, or points you have
        specified on the fly.
    (2) geomType {RECTANGLE_BY_AREA, RECTANGLE_BY_WIDTH, CONVEX_HULL,
                  CIRCLE, ELLIPSE, ENVELOPE}
    (3) You must have a professional license for all geomTypes except
        RECTANGLE_BY_AREA
    """

    pointList = []
    for x,y in xyCoords:
        newPoint = ARCPY.Point(x, y)
        geom = ARCPY.PointGeometry(newPoint, spatialRef)
        pointList.append(geom)

    DM.MinimumBoundingGeometry(pointList, outputFC, geomType, "ALL",
                               "", "MBG_FIELDS")

def minBoundGeomFC(inputFC, outputFC, geomType = "RECTANGLE_BY_AREA",
                   spatialRef = None):
    """Wraps the Minimum Bounding Geometry Tool for xy-coordinates.

    INPUTS:
    inputFC (array): input feature class
    outputFC (str): path to the output feature class
    geomType {str, RECTANGLE_BY_AREA}: type of bounding geometry (1, 2)
    spatialRef {obj, None}: instance of a spatial reference object

    NOTES:
    (1) geomType {RECTANGLE_BY_AREA, RECTANGLE_BY_WIDTH, CONVEX_HULL,
                  CIRCLE, ELLIPSE, ENVELOPE}
    (2) You must have a professional license for all geomTypes except
        RECTANGLE_BY_AREA
    """

    rows = DA.SearchCursor(inputFC, ["SHAPE@"], "", spatialRef)
    shapeList = []
    for row in rows:
        shapeList.append(row[0])

    del rows
    DM.MinimumBoundingGeometry(shapeList, outputFC, geomType, "ALL",
                               "", "MBG_FIELDS")

def setUniqueIDField(ssdo, weightsFile=None):
    """Sets the Unique ID Field for Global and Local Stats. (1)

    INPUTS:
    ssdo (class): instance of the SSDataObject
    weightsFile {str, None}: path to a spatial weights matrix file

    OUTPUT:
    masterField (str): name of the unique ID field

    NOTES:
    (1) If a spatial weights matrix file is used, then a warning will be
        provided if the spatial reference for the weights is different
        from the analysis dataset; an error will arise if the unique ID
        field for the weights matrix is not in the dataset.
    """

    if weightsFile:
        #### SWM or Text Formatted Spatial Weights ####
        weightSuffix = weightsFile.split(".")[-1].lower()
        swmFileBool = (weightSuffix == "swm")

        #### Validate Unique ID Field ####
        masterField, spatialRefName = WU.returnHeader(ssdo,
                                                      weightsFile,
                                                      swmFileBool)

        #### Warn if Different Spatial References Used ####
        if swmFileBool:
            WU.compareSpatialRefWeights(spatialRefName,
                                  ssdo.spatialRef.name)
    else:
        masterField = ssdo.oidName

    return masterField

def scaleDecision(avgDist, medDist):
    """Retuns Fishnet Distance w/ unknown boundary.

    INPUTS:
    avgDist (float): average nearest neighbor distance
    medDist (float): median nearest neighbor distance
    """

    msg = "Using {0} NN Distance * Nearest Neighbor Scale: {1} * {2} = {3}"
    if avgDist > medDist:
        outName = "Average"
        outLeft = avgDist
        if not compareFloat(0.0, medDist):
            testScale = avgDist / medDist
        else:
            testScale = 0.0
        outDist = avgDist
    else:
        outName = "Median"
        outLeft = medDist
        testScale = medDist / avgDist
        outDist = medDist

    if testScale > 2.0:
        outScale = testScale
    else:
        outScale = 2.0

    dist = outDist * outScale

    return dist

def numpyToFieldType(typeNumpy):
    """
    Convert Numpy dtype to Candidate Type Supported
    INPUT:
        typeNumpy (dtype): type array
    OUTPUT:
        return (str) : Supported (LONG, TEXT..)
    """
    if '<U' in str(typeNumpy):
        typeNumpy = '<U'
    if '<M' in str(typeNumpy):
        typeNumpy = NUM.dtype('O')
    if 'datetime' in str(typeNumpy):
        typeNumpy = NUM.dtype('O')

    return numpyDtypeConvert[typeNumpy]

def checkCandidateFieldsSimple(candidateFields):
    """ Check Candidate Fields in ShapeFi
    INPUT:
        candidateFields (list candidateFields): List Candidate Fields

    OUTPUT:
        candidateFields: List Candidate Fields 
    """
    for i in NUM.arange(len(candidateFields)):
        if ".SHP" in candidateFields[i].name.upper():
            candidateFields[i].name = candidateFields[i].name.replace(".SHP","")
        if " " in candidateFields[i].name:
            candidateFields[i].name = candidateFields[i].name.replace(" ","_")

    maxNumPos = 10
    reduceSizeTo = 7
    fields = [ i.name for i in candidateFields]
    maxLen = max(map(len, fields))

    #### Reduce Field Name Size ####
    nFields = NUM.array([(i[0:maxNumPos], i, False) if len(i) > maxNumPos else (i, i, False) 
                            for i in fields], 
                            dtype =[("newField", "U10"), 
                                    ('field', "U" +str(maxLen)),
                                    ('changed', bool)])
        
    #### Verify Uniqueness ####
    unique, count = NUM.unique(nFields['newField'], return_counts= True)

    #### Fix Uniqueness ####
    if len(nFields) != len(count):
        for indu, uniq in enumerate(unique):
            numRep = count[indu]
            cnt = 1
            if numRep > 1:
                for index, field in enumerate(nFields):
                    if field[0] == uniq:
                        if nFields[index][2]:
                            fieldValue = field[0][0:(reduceSizeTo-1)] + '{:02}'.format(cnt) + field[0][-3:]
                            nFields[index][0] = fieldValue
                        else:
                            fieldValue = field[0][0:(reduceSizeTo+1)] + '{:02}'.format(cnt)
                            nFields[index][0] = fieldValue
                        cnt += 1

    #### Replace Candidate Field Names By Unique Names ####
    for idField in NUM.arange(len(candidateFields)):
        if candidateFields[idField].name == nFields[idField][1]:
            candidateFields[idField].name = nFields[idField][0]

    return candidateFields

def checkCandidateFieldName(candidateFields, output):
    """ This function adjusts the field names for shp and dbf file outputs
        from candidate fields instances
    INPUT:
        candidateFields (list candidateFields): List Candidate Fields
        output (str): Output Path
    OUTPUT:
        candidateFields: List Candidate Fields 
    """
    
    qualifyNames = ARCPY.env.qualifiedFieldNames
    isGdb = isGDB(output)

    outputStr = output

    if ARCPY.Exists(output):
        desc = ARCPY.Describe(output)
        outputStr = desc.catalogPath
    
    if type(outputStr) == str and  outputStr.upper().startswith("IN_MEMORY") or outputStr.upper().startswith("MEMORY"):
        isGdb = True

    invalidChar = "`~@#$%^&*()-+=|\\,<>?/{}!'[]:;\n\r"

    for i in NUM.arange(len(candidateFields)):
        if '$.' in candidateFields[i].name:
            candidateFields[i].name = candidateFields[i].name.replace("$.","__")
        for e in invalidChar:
            candidateFields[i].name = candidateFields[i].name.replace(e,"_")

        if "." in candidateFields[i].name:
            if qualifyNames and isGdb:
                candidateFields[i].name = candidateFields[i].name.replace(".","_")
            elif qualifyNames and not isGdb:
                vars = candidateFields[i].name.split('.')
                if vars[-1].upper() == "SHP":
                    name = "_".join(vars[:-1])
                    candidateFields[i].name = name
                else:
                    candidateFields[i].name = vars[1]
            elif not qualifyNames:
                vars = candidateFields[i].name.split('.')
                if vars[-1].upper() == "SHP":
                    name = "_".join(vars[:-1])
                    candidateFields[i].name = name
                else:
                    candidateFields[i].name = vars[-1]

    if isGdb:
        for i in NUM.arange(len(candidateFields)):
            if ".SHP" in candidateFields[i].name.upper():
                candidateFields[i].name = candidateFields[i].name.replace(".SHP","")
            if " " in candidateFields[i].name:
                candidateFields[i].name = candidateFields[i].name.replace(" ","_")

        return candidateFields
    else:
        return checkCandidateFieldsSimple(candidateFields)

def checkDuplicatedBasic(newCandidateFields, isSHPOrDBF, listFieldsNames, useFieldsAsCandidateFields = False, updateAliases=True):
    """ Check duplicates fields/ candidateFields
    """
    listFields = set(listFieldsNames)

    for i in range(len(newCandidateFields)):
        newCandidateFields[i].name = newCandidateFields[i].name.replace(".", "_")
    for i in range(len(newCandidateFields)):
        count = 0
        if isSHPOrDBF:
            newFieldName = newCandidateFields[i].name.upper()[0: 10]
            while newFieldName in listFields:
                count += 1
                appd = "_" + str(count)
                newFieldName = newCandidateFields[i].name.upper()[0: 10 - len(appd)] + appd
            listFields.add(newFieldName)
            if count == 0:
                newCandidateFields[i].name = newCandidateFields[i].name[0: 10]
                listFields.add(newCandidateFields[i].name.upper())
            else:
                newCandidateFields[i].name = newCandidateFields[i].name[0: 10 - len(appd)] + appd
        else:
            newFieldName = newCandidateFields[i].name.upper()
            while newFieldName in listFields:
                count += 1
                appd = "_" + str(count)
                newFieldName = newCandidateFields[i].name.upper() + appd
            listFields.add(newFieldName)
            if count > 0:
                newCandidateFields[i].name = newCandidateFields[i].name + appd
                if updateAliases:
                    if useFieldsAsCandidateFields:
                        newCandidateFields[i].aliasName += appd
                    else:
                        newCandidateFields[i].alias += appd

    return newCandidateFields

def classifyVariable(numberCategories, classificationID, values = None,
                     classes = None, definedInterval = None,
                     stdDev = None, applyRoundG = False):
    """ Reclassify values using symbology UI approach 
    INPUT:
        numbeCategories (int): Number of categories
        classificationID (str): see classificationMethod dict
        values (1d array): data
        classes {list of list / None}: list of previous classes [[upper bound, label]]
        definedInterval {float/None}: only for defined interval
        stdDev {str}: Only for standard deviation ONE
        applyRoundG(bool): Round values
    OUTPUT:
        categories (list  of list): [[upper bound, label]]
    """

    def rValue(value, condition, size = 6):
        """ Round Value """
        if applyRoundG:
            return NUM.round(value,size) if condition else value
        else:
            return value

    classificationType = classificationMethod[classificationID]
    valueClass = []
    labels = []
    dtype = float
    intervStd = 0

    #### Just Checking Data length ####
    if values is None or len(values) == 0:
        if classificationType != 3:
            return None, None

    #### Apply only for Standard deviation ###
    if stdDev is not None and classificationType == 6:
         indexValue = ["ONE", "HALF", "THIRD","QUARTER"].index(stdDev) + 1

         if indexValue != 0:
            intervStd = 1.0 / indexValue

    applyRound = True
    different  = False

    if values is not None and classes is None:

        dtype = values.dtype
        if values.dtype != float:
            applyRound = False

        uniqueData, countData = NUM.unique(values, return_counts = True)
        meanValue = values.mean()
        stdDevValue = NUM.sqrt(values.var())

        minValue = rValue(values.min(),applyRound) 
        maxValue = rValue(values.max(),applyRound) 

        if NUM.isclose(minValue, maxValue):
            if classes is not None:
                return [[float(maxValue), classes[0][1]]], False
            else:
                return [[float(maxValue), '1']], True

        if numberCategories is not None and \
           len(values) < numberCategories and \
           classificationType not in [0,6]:
            return None, False

        #### Fake number of categories ####
        if classificationType in [0,6]:
            numberCategories = 1

        if numberCategories == 1 and classificationType not in [0,6]:
            if classes is not None:
                return [[float(maxValue), classes[0][1]]], False
            else:
                return [[float(maxValue), '1']], True

        #### Calculate Break except for Manual (3) ###
        if classificationType != 3:

            if classificationType != 0:
                definedInterval = 0
            else:
                if definedInterval is None:
                    return None, None

            categories = ARC._ss.get_breaks(classify_method = classificationType,
                                            unique = NUM.array(uniqueData, float),
                                            count = NUM.array(countData, NUM.int32),
                                            num_class = numberCategories,
                                            defined_interval_size = definedInterval,
                                            mean = meanValue,
                                            std_dev = stdDevValue,
                                            std_interval = intervStd)

            if categories is None:
                return None, False

            if classificationType == 5:
                categories[-1] = maxValue

            #### Compare User Input Against Original Value ####
            for id in NUM.arange(len(categories)-1):
                value = rValue(categories[id+1],applyRound)
                valueClass.append(value)

                if classes is not None and id < len(classes):
                    if classes[id][1] != str(id+1):
                        labels.append(classes[id][1])
                        different = False
                    else:
                        labels.append(str(id+1))
                else:
                    labels.append(str(id+1))

            numberCategories = len(valueClass)

    else:
        return classes, False
    output = []

    for id in NUM.arange(len(valueClass)):
        if dtype == float:
            output.append([valueClass[id], labels[id]])
        else:
            output.append([NUM.round(valueClass[id]), labels[id]])

    if different:
        return output, False
    return output, different


def isInMemory(outputFC):
    """ Check if the output FC is in memory output """
    
    value = ""
    if type(outputFC) == str:
        value = outputFC
    elif hasattr(outputFC, "value"):
        value = outputFC.value

    return value.upper().startswith("IN_MEMORY") or value.upper().startswith("MEMORY")

def CheckFieldNames(fieldsDict, inputData, shortField = False, allowOverwriteFields = True ):
    """
    Check target fields in the dictionary
    """
    listKeys = list(fieldsDict.keys())
    listInfo = list(fieldsDict.values())    
    targetDict = {e:e for e in listInfo}

    dictOut = ValidateMultipleFieldNames(targetDict, inputData, shortField = shortField, 
                                         allowOverwriteFields = allowOverwriteFields )   
    return {key:value for key,value in zip(listKeys,dictOut.values())}


def ValidateMultipleFieldNames(fieldsDict, inputData, minSize = 10, shortField = False,
                               disableWarning = False, allowOverwriteFields = False):
    """
    Check and rename list of fields depending on input data, replace special characters
    to underscore
    
    INPUT:
        fieldsDict (Dict): Dict of field names
        inputData (layer/FC or list of str): input Data or List of Fields (str)
        minSize (int): minimum field length (only if shp/dbf)
        shortField (bool): It is only use if inputData is a list of fields
    RETURN:
        Dictionary: original field name: validated field
    """
    invalidChar = "`~@#$%^&*()-+=|\\,<>?/{}!'[]:;\n\r ."
    newFieldNames ={}
    currentFields = []
    if inputData is not None:
        checkFields = True
        if hasattr(inputData, "value"):
            inputData = inputData.value
        elif type(inputData) == list:
            currentFields = inputData
            checkFields = False
        elif type(inputData) == str:
            if not ARCPY.Exists(inputData):
                checkFields = False
        
        if checkFields:
            currentFields = []
            try:
                desc = ARCPY.Describe(inputData)
                
                if ".GDB" in desc.path.upper() or isInMemory(inputData) or hasattr(desc,"connectionProperties"):
                    shortField = False
                else:
                    shortField = True

                currentFields = [f.name for f in desc.fields]
            except:
                ARCPY.AddIDMessage("ERROR",210, inputData)
                raise SystemExit

    if allowOverwriteFields:
        currentFields = []

    changedFields = []
    for fieldId in fieldsDict:
        changed = False
        field = fieldsDict[fieldId]
        
        try:
            int(field[0])
            field = "F" + field
            changed = True
        except:
            pass

        if shortField:
            changed = True
            field = field[0:minSize]

        for ch in invalidChar:
            if ch in field:
                changed = True
                field = field.replace(ch,"_")

        if changed:
            changedFields.append(fieldId)
       
        newFieldNames[fieldId] = field
        
    keys = newFieldNames.keys()

    for fieldId in list(keys):
        field = newFieldNames[fieldId]
        values = list(newFieldNames.values())
        
        flag = field in currentFields  or values.count(field)> 1

        cnt = 1
        rm = minSize
        fieldBase = field
        
        while flag:
            rm = minSize - len(str(cnt))
       
            if shortField:
                nC = len(fieldBase)
                if nC <= rm :
                    fieldBase = field + str(cnt)
                else:
                    fieldBase = fieldBase[0:rm] + str(cnt)
            else:
                 fieldBase = field + str(cnt)
                 
            flag = fieldBase in currentFields  or values.count(fieldBase)> 1
        
            cnt+=1
            
        field = fieldBase
        newFieldNames[fieldId] = field
    
    if not disableWarning:
        for orgField in newFieldNames:
            if orgField != newFieldNames[orgField]:
                ARCPY.AddIDMessage("WARNING",304, orgField, newFieldNames[orgField] )

    return newFieldNames


######################## Other Classes #########################

class MeanDistanceInfo(object):
    """Returns Mean distance to avoid coicident points.

    INPUTS:
    ssdo (class): instance of SSDataObject
    concept {str, EUCLIDEAN}: EUCLIDEAN or MANHATTEN distance
    maxCheckNeigh {integer}:  max number of Neighbors to check
    """

    def __init__(self, ssdo, concept = "EUCLIDEAN",  extent = None,
                 stdDeviations = 3):

        #### Set Initial Attributes ####
        assignClassAttr(self, locals())
        if extent is None:
            extent = ssdo.extent
        self.envelope = Envelope(extent)
        self.initialize()

    def initialize(self):
        ssdo = self.ssdo

        if ssdo.useChordal:
            #### Chordal Distance ####
            boundary2Use = SpheroidSlice(ssdo.extent, ssdo.spatialRef)
        else:
            #### Planar ####
            boundary2Use = self.envelope

        #### Create k-Nearest Neighbor Search Type ####
        gaTable = ssdo.gaTable
        gaSearch = GAPY.ga_nsearch(gaTable)
        concept, gaConcept = WU.validateDistanceMethod(self.concept,
                                                    ssdo.spatialRef)
        expectedDistance = MATH.floor(0.5 / NUM.sqrt(ssdo.numObs/ ssdo.area))

        ### Get Points using a Threshold ####
        gaSearch.init_nearest(expectedDistance,  1, gaConcept)
        neighDist = ARC._ss.NeighborDistances(gaTable, gaSearch)
        N = len(gaTable)
        distances = []

        for row in ssRange(N):
            nNeig = len(neighDist[row][1])
            for indexNeigh in ssRange(nNeig):
                #### Get first no Zero Distance ####
                if neighDist[row][1][indexNeigh] > 0:
                    distances.append(neighDist[row][1][indexNeigh])
                    break

        distances = NUM.array(distances)
        if len(distances) == 0:
            self.allCoincide = True
            self.meanDistance = ssdo.defaultCellSize
            meanDistance = 0.0
            stdDistance = 0.0
            outliers = None
            numOutliers = 0
        else:
            self.allCoincide = False
            meanDistance = distances.mean()
            stdDistance = distances.std()
            devDistances = (distances - meanDistance) / stdDistance
            outliers = NUM.where(devDistances >= self.stdDeviations)[0]
            numOutliers = len(outliers)

        self.meanDistance = meanDistance
        self.stdDistance = stdDistance
        self.outliers = outliers
        self.numOutliers = numOutliers

    def printOutlierInfo(self):
        msg = ARCPY.GetIDMessage(84435)
        ARCPY.AddMessage(msg.format(self.numOutliers, self.stdDeviations))
        if self.numOutliers != 0:
            msg = ARCPY.GetIDMessage(84436)
            outlierIDs = [str(self.ssdo.order2Master[i]) for i in self.outliers]
            outlierIDs = ", ".join(outlierIDs)
            ARCPY.AddMessage(msg.format(outlierIDs))

class NearestNeighborInfo(object):
    """Creates information for the construction of a fishnet grid.  Related to 
    LocationInfo(), this class takes xyCoordinates instead of a SSDataObject. 
    There is also less functionality.  The goal of the class is to calculate the
    default cell-size or z-exaggeration distance for SSPanel Cubes.

    INPUTS:
    ssdo (obj): instance of a SSDataIObject
    concept {str, EUCLIDEAN}: EUCLIDEAN or MANHATTEN distance
    extent {obj, None}: instance of an extent

    METHODS:
    reportThreshold()
    getNearestNeighborInfo(stdDeviations = 3.0, percentile = 1.0,
                           reportOutliers = False, keepOutliers = False)
    """

    def __init__(self, xyCoords, extent):

        #### Set Initial Attributes ####
        assignClassAttr(self, locals())
        self.envelope = Envelope(extent)

        #### Set Min/Max Distances ####
        self.minimumDist = roof(self.envelope.maxExtent / (maximumNumberOfCells * 1.0))
        self.maximumDist = roof(self.envelope.maxExtent * .1)

        #### Create KD Tree ####
        self.kdTree = SCPS.cKDTree(self.xyCoords)

        #### Get Distances ####
        self.n = len(xyCoords)
        self.distances = NUM.zeros((self.n, 2), dtype = float)
        for i in ssRange(self.n):
            coordinates = self.xyCoords[i]
            info = self.kdTree.query(coordinates, k = 2, p = 2)
            neighs = info[1]
            self.distances[i] = NUM.sqrt(((coordinates - neighs)**2.0).sum()) 

        #### Get Standardized Distances ####
        threshold = self.distances.max()
        self.threshold = roof(threshold)
        meanDist = self.distances.mean()
        stdDist = self.distances.std()
        if stdDist:
            devDistances = (self.distances - meanDist) / stdDist
        else:
            devDistances = NUM.zeros(len(self.distances), dtype = float)

        self.meanDist = meanDist
        self.stdDist = stdDist
        self.devDistances = devDistances

    def getNearestNeighborInfo(self, stdDeviations = 3.0, percentile = 1.0,
                               keepOutliers = False):
        """Returns the Nearest Neighbor Info based on the given arguments.

        INPUTS:
        stdDeviations {float, 3.0}: number of std to signify an outlier
        percentile {float, 1.0}: additional percentile to trim [bounded 0,1]
        reportOutliers {bool, False}: whether to report the outliers
        keepOutliers {bool, False}: whether to include outliers in calculations

        RETURN:
        cellSize (float): cellSize for a grid 
        threshold (float): distance that assures that all non-outliers have neighs
        outliers (array): list of order IDs that are neighbors
        """
                               
        if self.stdDist and stdDeviations:
            distances2Include = NUM.where(self.devDistances < stdDeviations)
            distances = self.distances[distances2Include]
            
            outliers = NUM.where(self.devDistances >= stdDeviations)[0]
            if keepOutliers:
                distances = self.distances
        else:
            distances = self.distances
            outliers = NUM.array([], dtype = NUM.int32)

        meanDist = distances.mean()
        cellSize = self.nnCellSize(distances, percentile = percentile)
        threshold = distances.max()
        threshold = roof(threshold)

        return cellSize, threshold, meanDist, outliers

    def nnCellSize(self, distances, percentile = 1.0):
        """Internal Method used to calculate the nearest neighbor cellsize."""

        numDist = len(distances)
        if not numDist:
            #### Gridded Data ####
            dist = self.evaluateDistance(self.meanDist)
        else:
            upper = int(numDist * percentile)
            lower = numDist - upper
            sortedDistances = NUM.sort(distances)
            meanDist = sortedDistances[lower:upper+1].mean() 
            medDist = STATS.median(distances)
            dist = max(medDist, meanDist) * 2.0
            dist = self.evaluateDistance(roof(dist))

        return dist

    def evaluateDistance(self, distance):
        """Internal Method to consider the bounds of the cellsize."""

        if distance < self.minimumDist:
            return self.minimumDist
        if distance > self.maximumDist:
            return self.maximumDist
        return distance

class LocationInfo(object):
    """Creates information for the construction of a fishnet grid.

    INPUTS:
    ssdo (obj): instance of a SSDataIObject
    concept {str, EUCLIDEAN}: EUCLIDEAN or MANHATTEN distance
    extent {obj, None}: instance of an extent

    METHODS:
    reportThreshold()
    getNearestNeighborInfo(stdDeviations = 3.0, percentile = 1.0,
                           reportOutliers = False, keepOutliers = False)
    """

    def __init__(self, ssdo, concept = "EUCLIDEAN", extent = None):

        #### Set Initial Attributes ####
        assignClassAttr(self, locals())

        if extent is None:
            extent = ssdo.extent

        self.initialize()

    def initialize(self):
        #### Set Progressor for Search ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84144))

        #### Set Boundary ####
        self.setStudyAreaInfo()
        N = self.ssdo.numUnique

        if self.ssdo.allUnique:
            #### Use Current GA Table for Non-Coincident Points ####
            uniqueTable = self.ssdo.gaTable
        else:
            #### Create Unique Location GA Table ####
            uniqueTable = GAPY.ga_table()
            uniqueTable.spatial_reference = self.ssdo.spatialRef

            #### Collect Events ####
            for ind, xyValue in enumerate(self.ssdo.uniqueXY):
                x,y = xyValue
                uniqueTable.insert(ind, (x, y), 1.0) 

            uniqueTable.flush()

        if N > 1:
            #### Create Neighbor Search Type ####
            concept, gaConcept = WU.validateDistanceMethod(self.concept,
                                                    self.ssdo.spatialRef)
            gaSearch = GAPY.ga_nsearch(uniqueTable)
            gaSearch.init_nearest(0.0, 1, gaConcept)
            distances = NUM.empty((N, ), float)

            #### Create Neighbor Distance Iterator ####
            neighDist = ARC._ss.NeighborDistances(uniqueTable, gaSearch)

            #### Find All Nearest Neighbor Distances ####
            for row in ssRange(N):
                distances[row] = neighDist[row][1][0]

            #### Clean Up ####
            del gaSearch
        else:
            distances = NUM.zeros((1,))


        self.minimumDist = self.ssdo.defaultCellSize
        self.maximumDist = roof(self.boundary2Use.maxExtent * .1)

        #### Get Standardized Distances ####
        threshold = distances.max()
        self.threshold = roof(threshold)
        meanDist = distances.mean()
        stdDist = distances.std()
        if stdDist:
            devDistances = (distances - meanDist) / stdDist
        else:
            devDistances = NUM.zeros(N, dtype = float)

        self.meanDist = meanDist
        self.stdDist = stdDist
        self.distances = distances
        self.devDistances = devDistances

    def getMedian(self):
        """Get Median Distance """
        medianDist = STATS.median(self.distances)
        return medianDist 

    def setStudyAreaInfo(self):
        """Sets the study area."""

        if self.ssdo.useChordal:
            boundary2Use = self.ssdo.sliceInfo
        else:
            boundary2Use = self.ssdo.envelope
        
        self.boundary2Use = boundary2Use

    def reportThreshold(self, robustThreshold = None):
        """Reports the distance that assures that all features have a neighbor.

        INPUTS:
        robustThreshold {float, None}: Use an override value returned as the 2nd
                                       argument from getNearestNeighborInfo() if 
                                       you want it to be robust to outliers.
        """
                                       
        if robustThreshold is not None:
            threshold = robustThreshold
        else:
            threshold = self.threshold 
        thresholdStr = self.ssdo.distanceInfo.printDistance(threshold)
        ARCPY.AddIDMessage("WARNING", 853, thresholdStr)

    def getNearestNeighborInfo(self, stdDeviations = 3.0, percentile = 1.0,
                               reportOutliers = False, keepOutliers = False):
        """Returns the Nearest Neighbor Info based on the given arguments.

        INPUTS:
        stdDeviations {float, 3.0}: number of std to signify an outlier
        percentile {float, 1.0}: additional percentile to trim [bounded 0,1]
        reportOutliers {bool, False}: whether to report the outliers
        keepOutliers {bool, False}: whether to include outliers in calculations

        RETURN:
        cellSize (float): cellSize for a grid 
        threshold (float): distance that assures that all non-outliers have neighs
        outliers (array): list of order IDs that are neighbors
        """
                               
        if self.stdDist and stdDeviations:
            distances2Include = NUM.where(self.devDistances < stdDeviations)
            distances = self.distances[distances2Include]
            
            outliers = NUM.where(self.devDistances >= stdDeviations)[0]
            if reportOutliers:
                self.printOutlierInfo(outliers, stdDeviations = stdDeviations)
            if keepOutliers:
                distances = self.distances
        else:
            distances = self.distances
            outliers = NUM.array([], dtype = NUM.int32)

        meanDist = distances.mean()
        cellSize = self.nnCellSize(distances, percentile = percentile)
        threshold = distances.max()
        threshold = roof(threshold)

        return cellSize, threshold, meanDist, outliers

    def printOutlierInfo(self, outliers, stdDeviations = 3.0):
        """Prints the Outlier Unique IDs.  

        INPUTS:
        outliers (array): list of order IDs that are neighbors
        stdDeviations {float, 3.0}: number of std to signify an outlier
        """

        msg = ARCPY.GetIDMessage(84435)
        numOutliers = len(outliers)
        ARCPY.AddMessage(msg.format(numOutliers, stdDeviations))
        if numOutliers != 0:
            msg = ARCPY.GetIDMessage(84436)
            outlierIDs = [str(self.ssdo.order2Master[i]) for i in outliers]
            outlierIDs = ", ".join(outlierIDs)
            ARCPY.AddMessage(msg.format(outlierIDs))

    def nnCellSize(self, distances, percentile = 1.0):
        """Internal Method used to calculate the nearest neighbor cellsize."""

        numDist = len(distances)
        if not numDist:
            #### Gridded Data ####
            dist = self.evaluateDistance(self.meanDist)
        else:
            upper = int(numDist * percentile)
            lower = numDist - upper
            sortedDistances = NUM.sort(distances)
            meanDist = sortedDistances[lower:upper+1].mean() 
            medDist = STATS.median(distances)
            dist = max(medDist, meanDist) * 2.0
            dist = self.evaluateDistance(roof(dist))

        return dist

    def evaluateDistance(self, distance):
        """Internal Method to consider the bounds of the cellsize."""

        if distance < self.minimumDist:
            return self.minimumDist
        if distance > self.maximumDist:
            return self.maximumDist
        return distance

def quickLinearUnitPrint(linearUnit):
    value, unit = linearUnit.split(" ")
    info = distanceUnitInfo[unit.upper()]
    lowerInfo = info[0].lower()
    if lowerInfo in localizableUnit:
        return localizableUnit[lowerInfo].format(value)
    else:
        return "{0} {1}".format(value, info[0])

class DistanceInfo(object):
    """Creates and study area envelope based on the given extent.

    INPUTS:
    spatialRef (obj): instance of a spatial reference object

    ATTRIBUTES:
    name (str): linear/angular unit name
    type (str): {PROJECTED, GEOGRAPHIC, UNKNOWN}
    unitType (str): {LINEAR, ANGULAR, UNKNOWN}
    convertType (str): {METERS or DECIMAL_DEGREES}
    convertFactor (float): conversion factor to meters or decimal degrees
    outputString (str): plural string representation
    """

    def __init__(self, spatialRef, useChordalDistances = True):
        self.spatialRef = spatialRef
        self.useChordalDistances = useChordalDistances
        self.setInfo()

    def setInfo(self):
        """Sets the attributes for the DistanceInfo Class."""
        self.xyzUnitsEqual = True
        if self.spatialRef is None:
            self.setUnknown()
        else:
            self.type = self.spatialRef.type.upper()
            if self.type == "PROJECTED":
                self.name = self.spatialRef.linearUnitName.upper()
                self.unitType = "LINEAR"
                self.convertType = "METERS"
                self.convertFactor = self.spatialRef.metersPerUnit
            elif self.type == "GEOGRAPHIC":
                if self.useChordalDistances:
                    self.name = "METER"
                    self.unitType = "CHORDAL"
                    self.convertType = "METERS"
                    self.convertFactor = 1.0
                else:
                    self.name = self.spatialRef.angularUnitName.upper()
                    self.unitType = "ANGULAR"
                    self.convertType = "DECIMALDEGREES"
                    self.convertFactor = self.spatialRef.radiansPerUnit
            else:
                self.setUnknown()

            try:
                if self.spatialRef.VCS:
                    vName = self.spatialRef.VCS.linearUnitName.upper()
                    if self.name != vName:
                        self.xyzUnitsEqual = False
            except:
                pass

        self.name = self.checkUnitAbbreviation(self.name)
        info = None
        try:
            info = distanceUnitInfo[self.name.upper()]
        except:
            ARCPY.AddIDMessage("ERROR", 372)
            raise SystemExit

        self.outputString = info[0]
        self.localizedOutputString = getLocalizedUnitType(self.outputString)

    def checkUnitAbbreviation(self, unit):
        """ Check abbreviated unit """
        dictAbbrev = {"M": "METERS", "F": "FEET"}
        if unit in dictAbbrev:
            return dictAbbrev[unit]
        else:
            return unit

    def linearUnitString(self, distance, convert = False, localizeUnit = False):
        """Returns a linear unit distance string for use in tools like
        Buffer."""

        if convert:
            distance = distance * self.convertFactor
            if localizeUnit:
                return prettyUnits(distance, self.convertType, localizeUnit = True)
            else:
                return str(distance) + " " + self.convertType
        else:
            if localizeUnit:
                return prettyUnits(distance, self.name, localizeUnit = True)
            else:
                return str(distance) + " " + self.name

    def printDistance(self, distance, formatStr = "%0.4f"):
        return LOCALE.format_string(formatStr, distance) + " " + self.localizedOutputString

    def setUnknown(self):
        """Sets Distance Info to Unknown."""
        self.name = "UNKNOWN"
        self.type = "UNKNOWN"
        self.unitType = "UNKNOWN"
        self.convertType = "UNKNOWN"
        info = distanceUnitInfo[self.name]
        self.outputString, self.convertFactor = info

    def joinXYTolerance(self):
        if self.type == "GEOGRAPHIC":
            maxTol = 0.000000008983153
        else:
            maxTol = .001
        joinTol = self.spatialRef.XYTolerance * self.convertFactor
        if joinTol > maxTol:
            joinTol = maxTol

        return str(joinTol) + " " + self.convertType

    def getUserLinearUnitName(self, userLinearUnit):
        if isNumeric(userLinearUnit):
            return self.name
        else:
            userDistance, userUnit = userLinearUnit.split(" ")
            userDistance = strToFloat(userDistance)
            return returnSpaceUnit(userUnit.upper())

    def convertUserLinearUnit(self, userDistance, userUnit):
        userUnit = returnSpaceUnit(userUnit.upper())
        userStr, userFactor = distanceUnitInfo[userUnit]
        return (userDistance * userFactor) / self.convertFactor

    def getUserLinearUnitInfo(self, userLinearUnit):
        if isNumeric(userLinearUnit):
            return userLinearUnit, self.name
        else:
            userDistance, userUnit = userLinearUnit.split(" ")
            userDistance = strToFloat(userDistance)
            userUnit = returnSpaceUnit(userUnit.upper())
            userStr, userFactor = distanceUnitInfo[userUnit]
            return (userDistance * userFactor) / self.convertFactor, userUnit

    def convertInputLinearUnit(self, inputDistance, userUnit):
        userUnit = returnSpaceUnit(userUnit.upper())
        userStr, userFactor = distanceUnitInfo[userUnit]
        return (inputDistance * self.convertFactor) / userFactor

    def createOutputLinearUnit(self, distance, userUnitName = None, 
                               formatStr = "%0.4f", returnUnits = True, 
                               strip = False):
        """Creates Output Bandwidth Formatted String in User Supplied Units.

        INPUTS:
        distance (float): distance
        userUnitName (str): output linear unit
        formatStr (str): format string
        returnUnits (bool): whether to return the linear unit
        strip (bool): make human readable by stripping decimal 0's
        """

        if userUnitName is not None:
            d = self.convertInputLinearUnit(distance, userUnitName)
        else:
            d = distance
            userUnitName = self.name

        if returnUnits:
            displayUnit = getDisplayUnit(userUnitName, cellSize = d)
            formatedValue = formatValue(d, formatStr = formatStr)
            displayUnitOut = getLocalizedUnitType(displayUnit)
            return "{0} {1}".format(formatedValue, displayUnitOut)
        else:
            if strip:
                return humanReadableFloatStr(d, formatStr = formatStr)
            else:
                return formatValue(d, formatStr = formatStr)

class BasicReader(object):
    """ This Class is designed to read a field in a FC/table 
    """

    def __init__(self, inputFC):

        self.inputFC = inputFC
        ERROR.checkFC(inputFC)
        try:
            self.inPath, self.inName = OS.path.split(inputFC)
        except:
            self.inPath = None
            self.inName = inputFC
         #### Describe Input ####
        self.info = ARCPY.Describe(inputFC)

    def obtainData(self, fieldName, includeNulls = False, maximumThresholdRead = None):
        """ Obtain Only Table data """

        fieldToUse = [(field.name.upper(), field) for field in self.info.fields 
                      if field.name  ==  fieldName or field.aliasName == fieldName]
        self.data = {}

        info = self.info

        if len(fieldToUse) > 0:
            self.data[fieldToUse[0][0].upper()] = [] 
            field = fieldToUse[0][1]
            myType = None

            if field.type in numpyConvert:
                myType = numpyConvert[field.type]
                if field.type == "String":
                    if field.length > 512:
                        field.length = 512
                    myType = myType % field.length
                if field.type == "Date":
                    myType = 'datetime64[s]'
            else:
                myType = 'a64'

            rows = None
            #### Process Field Values ####
            try:
                rows = DA.SearchCursor(self.inputFC , [field.name])
            except:
                ARCPY.AddIDMessage("ERROR", 204)
                raise SystemExit()

            data = []
            if maximumThresholdRead is None:
                if not includeNulls:
                    for row in rows:
                        if row[0] is not None:
                            data.append(row[0])
                else:
                    for row in rows:
                        data.append(row[0])
            else:
                count = 0
                if not includeNulls:
                    for row in rows:
                        if row[0] is not None:
                            data.append(row[0])
                        count += 1
                        if count > maximumThresholdRead:
                            break
                else:
                    for row in rows:
                        data.append(row[0])
                        count += 1
                        if count > maximumThresholdRead:
                            break

            del rows
            self.data[field.name.upper()] = NUM.asarray(data, dtype = myType)

    def obtainMultipleData(self, fieldNames, includeNulls = False, maximumThresholdRead = None):
        """ Obtain Only Table data """

        fieldsToUse = [(field.name.upper(), field) for field in self.info.fields 
                       if field.name in fieldNames or field.aliasName in fieldNames]
        myTypes = []
        fieldList = []
        self.data = {}
        numFields = len(fieldsToUse)

        info = self.info

        if numFields:
            for fieldToUse in fieldsToUse:
                fieldList.append(fieldToUse[0].upper())
                self.data[fieldToUse[0].upper()] = [] 
                field = fieldToUse[1]
                myType = None

                if field.type in numpyConvert:
                    myType = numpyConvert[field.type]
                    if field.type == "String":
                        if field.length > 512:
                            field.length = 512
                        myType = myType % field.length
                    if field.type == "Date":
                        myType = 'datetime64[s]'
                else:
                    myType = 'a64'
                myTypes.append(myType)

            rows = None
            #### Process Field Values ####
            try:
                rows = DA.SearchCursor(self.inputFC, fieldList)
            except:
                ARCPY.AddIDMessage("ERROR", 204)
                raise SystemExit()

            data = [list() for i in range(numFields)]
            if maximumThresholdRead is None:
                if not includeNulls:
                    for row in rows:
                        for col in range(numFields):
                            if row[col] is not None:
                                data[col].append(row[col])
                else:
                    for row in rows:
                        for col in range(numFields):
                            data[col].append(row[col])
            else:
                count = 0
                if not includeNulls:
                    for row in rows:
                        for col in range(numFields):
                            if row[col] is not None:
                                data[col].append(row[col])
                        count += 1
                        if count > maximumThresholdRead:
                            break
                else:
                    for row in rows:
                        for col in range(numFields):
                            data[col].append(row[col])
                            count += 1
                            if count > maximumThresholdRead:
                                break

            del rows

            for ind, upperField in enumerate(fieldList):
                self.data[upperField] = NUM.asarray(data[ind], dtype = myTypes[ind])

class DictToClass(object):
    """ Create a class from a dictionary """

    def __init__(self, my_dict):
        for key in my_dict:
            setattr(self, key, my_dict[key])

    def setProperty(self, propertyStr, value):
        setattr(self, propertyStr, value)

class DataContainer(object):
    """
    This Data Container allows to write point/polygon - table features class using 
    the ARC method
    INPUT:
        spatialRef {spatialReference: None}: Feature class, None-> table
        xy {2d Array}: Coordinates
        shapes {list shapes}: List of shapes
        z {1d Array}: Z Coordinate

    Note:
        TODO: Support Polyline
    """
    def __init__(self, spatialRef = None, xy = None, shapes = None, z = None, hasOID64 = False, has_m = False):
        if spatialRef is not None:
            if xy is not None:
                self.xyCoords = xy
                self.numObs = len(xy)
                if z is not None:
                    self.zCoords = z
            else:
                self.xyCoords = None
                if shapes is not None:
                    self.numObs = len(shapes)

        self.spatialRef = spatialRef
        self.requireGeometry = False
        self.hasOID64 = hasOID64

        #### Point 0 / Polyline 1/ Polygon 2/ Multipatch 3/ Multipoint 4 ####
        self.renderType = 0 

        #### Eval Z elevation ####
        if z is not None:
            self.hasZ = True
        else:
            self.hasZ = False

        self.hasM = has_m

        self.shapes = None

        if spatialRef is not None:
            if shapes is not None and type(shapes) == list:
                self.requireGeometry = True
                if "Polygon" in str(type(shapes[0])):
                    self.renderType = 2
                elif "Multipatch" in str(type(shapes[0])):
                    self.renderType = 3
                elif "Multipoint" in str(type(shapes[0])):
                    self.renderType = 4
                elif "Polyline" in str(type(shapes[0])):
                    self.renderType = 1
                else:
                    self.renderType = 0
                self.shapes = shapes

    def createFieldsFromArrays(self, listArrays, outputFC, names = None, aliasNames = None, 
                               highPrecisionDateFields = []):
        """ Create a list of candidate fields from a list of Numpy Arrays or
            list of Candidate Fields (Check field Name)
        INPUT:
            listArray (List Arrays/CandidateFields): Each element in the list 
                                                     will be a field in outputFC
            outputFC (str): Output path
            names {list str}: Name Fields (used when listArray just contains arrays)
            aliasNames {list str}: Field Alias 
        OUTPUT:
            output: List of CandidateFields
        """

        if len(listArrays) > 0:
            if "CandidateField" in str(type(listArrays[0])):
                return listArrays
            #### Get Names ####
            nameList = []
            nameAlias = []

            if aliasNames is not None:
                nameAlias = aliasNames

            if names is not None:
                nameList = names
            else:
                #### If Names is Provided ####
                nameList = ["Field" + str(i+1) for i in range(len(listArrays))]

            typeList = [type(arr) for arr in listArrays]

            pDtype = [str(type(arr)) for arr in listArrays if 'ndarray' in str(type(arr))]

            if len(pDtype):
                typeList = [arr.dtype for arr in listArrays]

                fields = None
                if len(nameAlias) == 0:
                    fields = [SSDO.CandidateField(name = nameList[id], type = numpyToFieldType(arr.dtype), data = arr,
                                                  checkNullValues = True)
                         for id, arr in enumerate(listArrays)]
                else:
                    fields = [SSDO.CandidateField(name = nameList[id], alias = nameAlias[id],
                                                 type = numpyToFieldType(arr.dtype), data = arr,
                                                 checkNullValues = True)
                         for id, arr in enumerate(listArrays)]

                #### Assure High Precision Dates ####
                for field in fields:
                    if field.name.upper() in highPrecisionDateFields:
                        if field.type.upper() in datePrecisionTypes:
                            field.precision = 1

                #### Check Output Field Names ####
                fields = checkCandidateFieldName(fields, outputFC)
                return fields

            #### Check If The List Contains Arrays ####
            if list in typeList:
                arrN = []
                for i in listArrays:
                    if type(i) == list:
                        arr = NUM.array(i)
                        arrN.append(arr)
                    elif "ndarray" in str(type(i)):
                        arrN.append(i)
                    else:
                        ARCPY.AddError("Should be a list/ ndarray")
                        raise SystemExit
                listArrays = arrN

                ### Get Type of Each Array ####
                typeList = [numpyToFieldType(arr.dtype) for arr in listArrays]

            fields = None
            if len(nameAlias) == 0:
                fields = [SSDO.CandidateField(name = nameList[id], type = typeList[id], data = arr)
                         for id, arr in  enumerate(listArrays)]
            else:
                fields = [SSDO.CandidateField(name = nameList[id], alias = nameAlias[id], 
                                              type = typeList[id], data = arr)
                         for id, arr in  enumerate(listArrays)]
            #### Check Output Field Names ####
            fields = checkCandidateFieldName(fields, outputFC)
            return fields
        else:
            return []

    def generateOutput(self, outputPath, listFields, names = None, alias = None, highPrecisionDateFields = [], adjustTexFields = False):
        """ Create Output Feature Class / table, Depend type of container

        outputFC {str} : output path
        listFields {list CandidateFields/arrays}: Candidate Fields List or []
        names {list str}: List Names
        """
        listF = self.createFieldsFromArrays(listFields, outputPath, names, alias, 
                                            highPrecisionDateFields = highPrecisionDateFields)
        if adjustTexFields:
            adjustCandidateFieldLengthByArrayDtype(listF)

        if self.spatialRef is not None:
            ARC._ss.output_featureclass_from_dataobject(self, outputPath, listF)
        else:
            if len(listF) > 0:
                ARC._ss.output_table_from_candidate_fields(outputPath, len(listF[0].data), 
                                                           listF, self.hasOID64)
            else:
                ARCPY.AddError("List of field is Empty")
                raise SystemExit()

class GenericReader(object):
    """ This Class reads Feature Classes and Tables
    INPUT:
        inputData   (str):  Feature layer / Table
        fields      (list str): List of list of fields (uppercase) (store in block)
        generateBlockOfData {bool}: Generate an array for each list of fields
        blockType   {list}:  it should be float or auto for each list of fields
        outputOption {False}: APPEND_FIELDS_INPUT, NEW_DATASET_JUST_NEW_FIELDS, NEW_DATASET_COPY_ALL
    """
    def __init__(self, inputData, fields, generateBlockOfData = True, 
                 blockType = [], outputOption = "NEW_DATASET_JUST_NEW_FIELDS", 
                 displayProjectionWarning = True, supportJoin = True, readNullValues = False,
                 ignoreDateHighPrecision = False, useChordal = True):

        self.outputOption = outputOption
        self.inputData = inputData
        self.fields = fields
        desc = ARCPY.Describe(inputData)
        self.dictFields = {field.name:field.aliasName for field in desc.fields}
        self.info = desc

        if not supportJoin:
            for field in self.dictFields:
                if "." in field:
                    ARCPY.AddIDMessage("ERROR", 1779)
                    raise SystemExit
                
        #### List of all fields ####
        fieldList = []
        for fieldListInd in fields:
            fieldList.extend(fieldListInd)

        self.data = []
        self.ssdo = None
        self.oidFieldData = None
        self.getGeometry = False

        self.ssdo = SSDO.SSDataObject(inputData, displayProjectionWarning = displayProjectionWarning, ignoreDateHighPrecision = ignoreDateHighPrecision, useChordal = useChordal)
        self.isTable  = self.ssdo.isTable
        self.hasOID64 = self.ssdo.hasOID64
        self.hasM = self.ssdo.hasM
        self.honorM = False

        if outputOption == "NEW_DATASET_JUST_NEW_FIELDS" and not self.isTable:
            if self.ssdo.shapeType.upper() != "POINT":
                self.getGeometry = True

        #### Read Null Values ####
        useNullinFields = []
        if readNullValues:
            useNullinFields = fieldList

        self.ssdo.obtainData(fields = fieldList, requireGeometry = self.getGeometry, useNullinFields = useNullinFields)
        self.master2Order = self.ssdo.master2Order
        if self.hasOID64:
            oidFieldData = NUM.array([i for i in self.ssdo.master2Order], dtype = NUM.int64)
        else:
            oidFieldData = NUM.array([i for i in self.ssdo.master2Order], dtype = NUM.int32)

        if generateBlockOfData:
            for idF, fieldListInd in enumerate(fields):
                typedField = NUM.float64

                if blockType[idF] == "auto":
                    typedField = self.ssdo.fields[fieldListInd[0].upper()].data.dtype

                data = NUM.zeros((self.ssdo.numObs, len(fieldListInd)), dtype = typedField)

                for id, name in enumerate(fieldListInd):
                    data.T[id] = self.ssdo.fields[name.upper()].data

                self.data.append(data)

        self.oidFieldData = oidFieldData

    def getData(self, fieldName):
        return self.ssdo.fields[fieldName.upper()].data

    def __checkDuplicated(self, fieldNames):
        repeated, counts = NUM.unique(fieldNames, return_counts = True)
        duplicates = counts > 1

        if NUM.sum(counts) > 0:

            namesIds = NUM.where(duplicates)[0]
            for id in namesIds:
                name = repeated[id]
                index = 0
                for i  in range(len(fieldNames)):
                    if name == fieldNames[i]:
                        if index > 0:
                            fieldNames[i] += "_"+str(index)
                        index+=1
        return fieldNames

    def output(self, outputFC, outputData, fieldNames, aliasFieldNames, fieldOrder = [], 
                parameters = None, indexOutput = None, indexInput = None, allowOverwriteFields = False, adjustTexFields = False):
        """ Generate Output Feature Class 
            parameters/indexOutput/indexInput -> just for append fields
        """
        hasM = self.hasM and self.honorM

        self.outputField = []
        if len(fieldOrder) == 0:
            fieldOrder = [f for f in fieldNames]

        if self.outputOption == "NEW_DATASET_JUST_NEW_FIELDS":
            fieldNames = self.__checkDuplicated(fieldNames)
            self.outputField = fieldNames
            if self.isTable:
                container = DataContainer(hasOID64 = self.hasOID64)
                container.generateOutput(outputFC,outputData,fieldNames,aliasFieldNames, adjustTexFields = adjustTexFields)
            else:

                if self.getGeometry:
                    container = DataContainer(spatialRef = self.ssdo.spatialRef, shapes = list(self.ssdo.shapes), hasOID64 = self.hasOID64)
                    container.hasM = hasM
                    container.hasZ = self.ssdo.hasZ
                    container.generateOutput(outputFC,outputData,fieldNames,aliasFieldNames, adjustTexFields = adjustTexFields)
                else:
                    zValues = None
                    if self.ssdo.hasZ:
                        zValues = self.ssdo.zCoords

                    container = DataContainer(spatialRef = self.ssdo.spatialRef, xy = self.ssdo.xyCoords,z = zValues, hasOID64 = self.hasOID64)
                    container.hasM = hasM
                    container.generateOutput(outputFC, outputData,fieldNames,aliasFieldNames, adjustTexFields = adjustTexFields)

        elif  self.outputOption == "APPEND_FIELDS_INPUT":
            container = DataContainer()
            candFields = container.createFieldsFromArrays(outputData, outputFC, names = fieldNames, aliasNames = aliasFieldNames)

            if not allowOverwriteFields:
                isSHPOrDBF = isShapeFileOrDBF(self.inputData)
                fieldNames = self.ssdo.allFields.keys()
                candFields = checkDuplicatedBasic(candFields, isSHPOrDBF, fieldNames)
            else:
                candFields = self.__onlyOverwriteDoubleFields(candFields)

            if adjustTexFields:
                adjustCandidateFieldLengthByArrayDtype(candFields)

            #### Create a Dictionary of Candidate Fields ####
            candidateFields = {f.name:f for f in candFields}
            fieldOrder = [i.name for i in candFields]
            self.outputField = fieldOrder
            #### Append Field into InputData ####
            self.__appendFields(candidateFields, fieldOrder)

        elif self.outputOption == "NEW_DATASET_COPY_ALL":
            container = DataContainer(hasOID64 = self.hasOID64)
            candFields = container.createFieldsFromArrays(outputData, outputFC, 
                                                               names = fieldNames, 
                                                               aliasNames = aliasFieldNames)

            candidateFields = {f.name:f for f in candFields}
            self.outputField = fieldOrder
            #### Append Field into InputData ####
            self.__output2NewDataset(outputFC, candidateFields, fieldOrder, fieldOrder)
            
    def __onlyOverwriteDoubleFields(self, candidateFields):
        """ This function allow to overwrite field type double """

        checkDuplicatesList = []
        allowedFields = []
        noAllowedFields = []
        for field in candidateFields:
            if field.name.upper() in self.ssdo.allFields:
                if self.ssdo.allFields[field.name.upper()].type.upper() == "DOUBLE":
                    allowedFields.append(field)
                else:
                    noAllowedFields.append(field)
            else:
                checkDuplicatesList.append(field)

        if len(noAllowedFields) > 0:
            ARCPY.AddIDMessage("WARNING",110408,", ".join([f.name for f in noAllowedFields]))
            checkDuplicatesList.extend(noAllowedFields)

        if len(checkDuplicatesList) > 0 :
        
            isSHPOrDBF = isShapeFileOrDBF(self.inputData)
            fieldNames = self.ssdo.allFields.keys()
            listFieldsOutput = checkDuplicatedBasic(checkDuplicatesList, isSHPOrDBF, fieldNames)
            if len(allowedFields) > 0:
                listFieldsOutput.extend(allowedFields)
            return listFieldsOutput
        else:
            return allowedFields

    def __appendFields(self, candidateFields, fieldOrder = []):
        self.ssdo.addFields2FC(candidateFields, fieldOrder)

    def __output2NewDataset(self, outputFC, candidateFields, appendFields = [], fieldOrder = []):

        excludeList = ["FID", "OID", "SHAPE", "OBJECTID", "OBJECTID_1"] 

        if not self.isTable and self.ssdo.shapeType in ["Polygon", "Polyline"]:
            excludeList.append("SHAPE_LENGTH")
            excludeList.append("SHAPE_AREA")

        listBase = [f for f in self.ssdo.allFields.keys() if f.upper() not in excludeList]
        listFields = listBase  + [f for f in candidateFields]

        ##### Check/Rename Duplicated Fields Names ####
        listFields = self.__checkDuplicated(listFields)
        newList = listFields[-(len(candidateFields)):]
        cf = {}
        for id, field in enumerate(candidateFields):
            if newList[id].upper() == field:
                cf[field] = candidateFields[field]
            else:
                candidateFields[field].name = newList[id]
                cf[newList[id].upper()] = candidateFields[field]
        #### Main Function To Copy Fields in a New FC ####
        self.ssdo.output2NewFC(outputFC, cf, listBase, listBase)

    def __renameCandidateFields(self,candidateFields, listFields):
        for id, field in enumerate(listFields):
            candidateFields[id].name = field.name

    def addSchemaInParameter(parameters, outputIndex, fieldnameListToAddC, indexInput = None, 
                  fieldTypeList = None, fieldnameAliasListToAdd = None, enableSchema = True):
        """ Add schema in a parameter from a list field names
        INPUT:
            parameters (list): List parameters
            outputIndex (int): Parameter output index
            fieldnameListToAdd (list) : Field names list/CandidateFields
            indexInput {index}: Index origina feature class
            fieldTypeList {list}: field type for each field name in fieldnameListToAdd
            fieldnameAliasListToAdd {list}: field alias for each field name in fieldnameListToAdd
        """
        if len(fieldnameListToAddC) == 0:
            return None
        if hasattr(fieldnameListToAddC[0], "name"):
            fieldnameListToAdd = [i.name for i in fieldnameListToAddC]
        else:
            fieldnameListToAdd = fieldnameListToAddC

        addFields = []
        listFields = []
        if indexInput is not None:
            try:
                desc = ARCPY.Describe(parameters[indexInput].value)
                for field in desc.fields:
                    addFields.append(field)
                    listFields.append(field.name.upper())
            except:
                pass
        
        namesOutput = [ ]
        for id, fieldName in enumerate(fieldnameListToAdd):
            newField = ARCPY.Field()
            newField.name = fieldName
            if fieldTypeList is not None:
                newField.type = fieldTypeList[id]
            if fieldnameAliasListToAdd is not None:
                newField.aliasName = fieldnameAliasListToAdd[id]

            while  fieldName.upper() in listFields:
                fieldName+="1"

            newField.name = fieldName
            addFields.append(newField)
            namesOutput.append(newField)
        addFields = checkCandidateFieldName(addFields,parameters[outputIndex].value)
        try:
            parameters[outputIndex].schema.additionalFields = addFields[-len(namesOutput):]
        except:
            pass
        namesOutput = addFields[-len(namesOutput):]

        return namesOutput

class ModelVariable(object):
    """This class stores  the metatdata of a model variable
    """
    def __init__(self):
        self.name = None
        self.alias = None
        self.source = None
        self.fieldType = None
        self.rfType = None
        self.info = None
        self.index = None
        self.unit = ""
        self.description = ""

    def toDict(self):
        """
        This method helps to serialize properties
        """

        ### Serialize Numpy objects as Python Objects ####
        if len(self.info):
            if type(self.info[0]) in [NUM.str_]:
                self.info = [str(i) for i in self.info]
            if type(self.info[0]) in [NUM.int32, NUM.int64]:
                self.info = [int(i) for i in self.info]
            if type(self.info[0]) in [float]:
                self.info = [float(i) for i in self.info]

        values =  {"name": self.name,
                "alias": self.alias,
                "source": self.source,
                "fieldType": self.fieldType,
                "variableType": self.rfType,
                "info": list(self.info),
                "index": self.index,
                "unit": self.unit,
                "description": self.description
                }
        return values

    def fromDict(self, dictRF):
        """
        This method helps to deserialize properties 
        """
        self.name = dictRF["name"]
        self.alias = dictRF["alias"]
        self.source = dictRF["source"]
        self.fieldType = dictRF["fieldType"]

        if "rfType" in dictRF:
            self.rfType = dictRF["rfType"]
        else:
            self.rfType = dictRF["variableType"]

        self.info = dictRF["info"]
        self.index = dictRF["index"]

        if "unit" in dictRF:
            self.unit = dictRF["unit"]
        else:
            self.unit = ""

        self.description = dictRF["description"]

class ModelMetadata(object):
    def __init__(self):
        ### List of Model Variables ####
        self.fields = []
        self.yField = None
        self.modelPath = None
        self.numXVariables = 0
        self.currentVersion = "0.0.11"
        self.version =  None
        self.modelType = None
        self.modelVariables = None
        self.locale = None
        self.metadata = None
        self.otherAttr = None
        self.distanceUnit = None
        self.modelDescription = ""
        self.modelDescriptionLabel = ""
        self.currentAppVersion = ARCPY.GetInstallInfo()['Version']
        self.appVersion = ""

    def dictToStr(self, dictInfo):
        tempDict = {}
        for e in dictInfo:
            if type(dictInfo[e]) == NUM.ndarray:
                tempDict[e] = dictInfo[e].tolist()
            else:
                 tempDict[e] = dictInfo[e]
        try:
            info = JSON.dumps(tempDict)
            return info
        except:
            pass
        return ""

    def strToDict(self, strValue):
        try:
            return JSON.loads(strValue)
        except:
            pass
        return {}

    def saveInfo(self, outputFileName, modelType = "Forest", yDef = "Yhat"):
        """
        Save header in output file
        """
        import h5py as H5

    #try:
        flag = "w"
        if modelType in  ["Forest", "Gradient_Boosted"]:
            if  ARC._ss.hdf_create(outputFileName) is None:
                ARCPY.AddWarning("MD was not created ")
                raise SystemExit
            else:
                flag = "a"

        self.modelPath = outputFileName
        model =  H5.File(outputFileName, flag)

        for e,f in enumerate(self.fields):
            f.index = e

        data = {i.name : i.toDict() for i in self.fields}
        self.yField.index = -1

        if self.yField is not None:
            data[yDef] = self.yField.toDict()



        info = JSON.dumps(data)
        model.attrs["MODEL_TYPE"] = modelType
        model.attrs["METADATA"] = info
        model.attrs["VERSION"] = self.currentVersion
        model.attrs["HISTORY"] = 'Created by ' + DT.datetime.now().strftime("%m/%d/%Y, %H:%M:%S")
        model.attrs["LOCALE"] = ";".join(list(LOCALE.getdefaultlocale()))
        model.attrs["APP_VERSION"] = self.currentAppVersion
        if self.distanceUnit is not None:
            model.attrs["DISTANCE_UNIT"] = self.distanceUnit

        modelVariables = []

        if self.otherAttr is not None:

            for key in self.otherAttr:

                if self.otherAttr[key] is None:
                    model.attrs[key] = "None"
                    modelVariables.append(key)
                    continue

                if type(self.otherAttr[key]) not in [NUM.ndarray, list, dict]:
                    model.attrs[key] = self.otherAttr[key]
                    modelVariables.append(key)

                else:
                    dim0 = False
                    if type(self.otherAttr[key]) == NUM.ndarray:
                        dim0 = len(self.otherAttr[key].shape) == 0
                        if dim0 and NUM.isnan(self.otherAttr[key]):
                            model.attrs[key] = "NaN"
                            modelVariables.append(key)
                            continue

                    if not dim0 and len(self.otherAttr[key]) == 0:
                        model.attrs[fr"{key}__lst"] = "None"
                        modelVariables.append(fr"{key}__lst")
                        continue

                    if type(self.otherAttr[key]) == dict:
                        model.attrs[fr"{key}__dict"] = self.dictToStr(self.otherAttr[key])
                        modelVariables.append(fr"{key}__dict")
                    elif type(self.otherAttr[key][0]) in [str, NUM.str_]:
                        lst = [str(v) for v in self.otherAttr[key]]
                        model.attrs[fr"{key}__lst"] = ";".join(lst)
                        modelVariables.append(fr"{key}__lst")
                    else:
                        modelVariables.append(key)
                        model.create_dataset(key,data=self.otherAttr[key])

            if len(modelVariables):
                model.attrs["MODEL_VARIABLES"] = ";".join(modelVariables)
        model.close()

    def saveData(self, outputFileName, attrs, prefix = None):
        """
        Save attributes in file
        """
        import h5py as H5

        if not OS.path.exists(outputFileName):
            return

        flag = "a"

        self.modelPath = outputFileName
        model =  H5.File(outputFileName, flag)

        if attrs is not None:
            added = []
            for key in attrs:
                keyOut = key
                if prefix is not None:
                    keyOut = fr"{prefix}_{key}"

                if attrs[key] is None:
                    model.attrs[keyOut] = "None"
                    added.append(keyOut)
                    continue

                if type(attrs[key]) not in [NUM.ndarray, list, dict]:
                    model.attrs[keyOut] = attrs[key]
                    added.append(keyOut)
                else:

                    dim0 = False
                    if type(attrs[key]) == NUM.ndarray:
                        dim0 = len(attrs[key].shape) == 0
                        if dim0 and NUM.isnan(attrs[key]):
                            model.attrs[keyOut] = "NaN"
                            added.append(keyOut)
                            continue

                    if not dim0 and len(attrs[key]) == 0:
                        model.attrs[fr"{keyOut}__lst"] = "None"
                        added.append(fr"{keyOut}__lst")
                        continue

                    if type(attrs[key]) == dict:
                        model.attrs[fr"{keyOut}__dict"] = self.dictToStr(attrs[key])
                        added.append(fr"{keyOut}__dict")
                    elif type(attrs[key][0]) in [str, NUM.str_]:
                        model.attrs[fr"{keyOut}__lst"] = ";".join(attrs[key])
                        added.append(fr"{keyOut}__lst")
                    else:
                        model.create_dataset(keyOut, data=attrs[key])
                        added.append(keyOut)

            if "MODEL_VARIABLES" in model:
                model.attrs["MODEL_VARIABLES"] = ";"+";".join(added)
            else:
                model.attrs["MODEL_VARIABLES"] = ";".join(added)

        model.close()

    def addSimpleDataset(self, name, arrayData):
        import h5py as H5
        f= H5.File(self.modelPath, "a")
        f.create_dataset(name,data=arrayData)
        f.close()

    def loadInfo(self, inputFilename, yDef = "Yhat", loadVariables = True, checkVersion = True):
        """
        This method extracts the information from the model loading it in the InfoForestField
        INPUT:
            inputFilename {str}: inputFilename path
            YDef {str}: Y hat variable Name
            checkVersion {bool}: Check Version
        """

        locale, data = self.readModelHeader(inputFilename, checkVersion = checkVersion)

        ###TODO Apply locale ####
        data_loaded = JSON.loads(data)
        self.fields= []
        self.numXVariables = 0
        self.yField = None
        self.metadata = data_loaded
        if loadVariables:
            for info in data_loaded:
                if info == "properties":
                    self.properties = data_loaded[info]
                else:
                    mVar = ModelVariable()
                    if info == "locale":
                        continue

                    mVar.fromDict(data_loaded[info])

                    if info == yDef :
                        self.yField= mVar
                    else:
                        self.fields.append(mVar)
                        self.numXVariables += 1

    def readModelHeader(self, filename, otherAttr = None, checkVersion = True):
        """
        Read RFM model header, load other variables locale, version, modelType, 
        Return:
            Locale {str}
            info {str} : Metadata fields
        """
        import h5py as H5
        model = None
        locale = None

        try:
            model =  H5.File(filename, "r")
        except:
            ARCPY.AddError("problem reading the model file {0}".format(filename))
            raise SystemExit

        try:
            if model is not None:
                if "MODEL_TYPE" in model.attrs:
                    self.modelType = model.attrs["MODEL_TYPE"]
                else:
                    raise Exception("Attribute Model type is not found")

                self.modelDescription = self.__getDescription(model, 0)
                self.modelDescriptionLabel = self.__getDescription(model, 1)

                if "HISTORY" in model.attrs:
                    self.history = model.attrs["HISTORY"]
                else:
                    raise Exception("Attribute Model type is not found")

                if "LOCALE"  in model.attrs :
                    locale = model.attrs["LOCALE"]
                    self.locale = locale

                if "DISTANCE_UNIT" in model.attrs :
                    self.distanceUnit =  model.attrs["DISTANCE_UNIT"]

                if "APP_VERSION" in model.attrs :
                    self.appVersion =  model.attrs["APP_VERSION"] 

                if "VERSION"  in model.attrs :
                    self.version = model.attrs["VERSION"]

                    if self.version != self.currentVersion and checkVersion:
                        if int(self.version.split(".")[-1]) < int(self.currentVersion.split(".")[-1]):
                            ARCPY.AddError(fr"The model file was created by an old version {self.version} [current version: {self.currentVersion}], please consider to create the model again in the current version.")
                            raise SystemExit

                if "METADATA" in model.attrs:
                    info = model.attrs["METADATA"]
                    self.metadataSTR = info
                else:
                    raise Exception("Attribute METADATA is not found")

                if self.otherAttr is not None:
                    for key in otherAttr:
                        if key in model.attrs:
                            self.otherAttr[key] = model.attrs[key]
                        else:
                           raise Exception("Attribute {0} is not found".format(key))

                if "MODEL_VARIABLES" in model.attrs:
                    self.modelVariables = model.attrs["MODEL_VARIABLES"]

                model.close()

                return locale, info
            else:
                raise Exception("Model Object is None")
        except Exception as e:
            ARCPY.AddWarning(e);

            if model is not None:
                model.close()

            ARCPY.AddError("Invalid model file {0}".format(filename))
            raise SystemExit()

        return None, None

    def __getDescription(self, model, opt1 = 0):
        """ Get Short Model Description """
        try:
            subfix = ""
            if self.modelType in ["Gradient_Boosted" ,"Forest"]:
                subfix = "reg" if model.attrs["FB_numClasses"] == 0 else "cls"
            elif self.modelType in ["GLR"]:
                subfix = model.attrs["GLR_family"]
            elif self.modelType in ["POP"]:
                subfix = "with" if model.attrs["containsBackground"] else "without"

            if subfix != "":
                return modelLabels[fr"{self.modelType}-{subfix}"][opt1]
            else:
                return ""
        except:
            return ""

    def loadAllVariables(self, filename, prefix = None):
        """
        Read Variables
        """
        import h5py as H5
        model = None
        locale = None

        try:
            model =  H5.File(filename, "r")
        except:
            ARCPY.AddError("problem reading the model file {0}".format(filename))
            raise SystemExit

        try:
            self.otherAttr = {}
            if model is not None:
                if "MODEL_VARIABLES" in model.attrs:
                    variables = model.attrs["MODEL_VARIABLES"]
                    variables = variables.split(";")
                    for key in variables:
                        keyIn = key
                        if prefix is not None:
                            keyIn = key.replace(fr"{prefix}_","")
                        if key not in model.attrs and key not in model: continue
                        if key in model:
                            self.otherAttr[keyIn] = model[key][::]
                        elif model.attrs[key] == "None" and  not key.endswith("__lst"):
                            self.otherAttr[keyIn] = None
                        elif model.attrs[key] == "NaN":
                            self.otherAttr[keyIn] = NUM.nan
                        elif type(model.attrs[key]) in [str, NUM.str_]:
                            if key.endswith("__lst"):
                                if  model.attrs[key] == "None":
                                    self.otherAttr[keyIn.replace("__lst","")] = []
                                else:
                                    self.otherAttr[keyIn.replace("__lst","")] = model.attrs[key].split(";")
                            elif key.endswith("__dict"):
                                self.otherAttr[keyIn.replace("__dict","")] = self.strToDict(model.attrs[key])
                            else:
                                self.otherAttr[keyIn] = model.attrs[key]
                        else:
                            self.otherAttr[keyIn] = model.attrs[key]
            model.close()

        except Exception as ex:
            ARCPY.AddError(ex)
            if model is not None:
                model.close()
            raise SystemExit

    def getVariablesByType(self, attr = "fieldType", valueToFind = None, getObj = False, source = None ):
        """ Get attributtes from metadata
        attr -> name, alias, source, fieldType, rfType(Numeric/Categorical), info, index
        """
        listVars = []
        if self.metadata is not None:
            for i in self.metadata:

                if type(self.metadata[i]) == dict and self.metadata[i]["index"] >=0:
                    if source is not None and valueToFind is not None:
                        if self.metadata[i]["source"] == source and \
                           self.metadata[i][attr].upper() == valueToFind.upper():
                            if getObj:
                                listVars.append(self.metadata[i])
                            else:
                                listVars.append(self.metadata[i]['name'])
                    elif source is not None and valueToFind is  None:
                        if self.metadata[i]["source"] == source :
                            if getObj:
                                listVars.append(self.metadata[i])
                            else:
                                listVars.append(self.metadata[i]['name'])
                    else:
                        if valueToFind is None:
                            if getObj:
                                listVars.append(self.metadata[i])
                            else:
                                listVars.append(self.metadata[i]['name'])
                        elif self.metadata[i][attr].upper() == valueToFind.upper():
                            if getObj:
                                listVars.append(self.metadata[i])
                            else:
                                listVars.append(self.metadata[i]['name'])

        return listVars

    @staticmethod
    def addData( pathModel , name, value, typeData = "dataset"):
        import h5py as H5
        if pathModel is not None and len(value):
            model = None
            try:
                model = H5.File(pathModel,"a")
                if typeData == "dataset":
                    model.create_dataset(name, data =value)
                if typeData == "attribute":
                    model.attrs[name] = value
                model.close()
            except Exception as ex:
                if model:
                    model.close()
                ARCPY.AddError("Problem adding values in model ")
                pass

    @staticmethod
    def getData(pathModel, name, typeData = "dataset"):
        import h5py as H5
        if pathModel is not None:
            model = None
            try:
                model = H5.File(pathModel,"r")
                if typeData == "dataset" and name in model:
                    values = model[name][::]
                    model.close()
                    return values
                elif typeData == "attribute" and name in model.attrs:
                    values = model.attrs[name]
                    model.close()
                    return values
                model.close()
            except Exception as ex:
                if model:
                    model.close()
                ARCPY.AddError("Problem reading values in model ")
                pass
        return None

class BaseVariable(object):

    def __generateStatTable(self, fieldName, fieldTarget, sourceData, alteredData, nNulls ):
        import scipy.stats as SCSTATS

        sourceStats = SCSTATS.describe(sourceData)
        alteredStats = SCSTATS.describe(alteredData)
        nSourceNulls = nNulls #NUM.sum(NUM.isnan(sourceData))
        nAlteredNulls = NUM.sum(NUM.isnan(alteredData)) + nNulls
        sourceKurtosis = SCSTATS.kurtosis(sourceData, bias = True)+3.0
        alteredKurtosis = SCSTATS.kurtosis(alteredData, bias = True)+3.0

        msgHeader =  ARCPY.GetIDMessage(220050)
        listTable=[]
        msg = ARCPY.GetIDMessage(220071)
        listTable.append([ARCPY.GetIDMessage(84806), msg.format(fieldName), self.labelFunction]) 
        listTable.append([ARCPY.GetIDMessage(84413), 
                          LOCALE.format_string("%0.3f", sourceStats.minmax[1]),
                          LOCALE.format_string("%0.3f", alteredStats.minmax[1])]) 

        listTable.append([ARCPY.GetIDMessage(84412), 
                          LOCALE.format_string("%0.3f", sourceStats.minmax[0]),
                          LOCALE.format_string("%0.3f", alteredStats.minmax[0])]) 

        listTable.append([ARCPY.GetIDMessage(220087), 
                          str(nSourceNulls),
                          str(nAlteredNulls)]) 

        listTable.append([ARCPY.GetIDMessage(84545), 
                          LOCALE.format_string("%0.3f", sourceData.sum()),
                          LOCALE.format_string("%0.3f", alteredData.sum())])

        listTable.append([ARCPY.GetIDMessage(84261), 
                          LOCALE.format_string("%0.3f", sourceStats.mean),
                          LOCALE.format_string("%0.3f", alteredStats.mean)]) 

        listTable.append([ARCPY.GetIDMessage(220051), 
                          LOCALE.format_string("%0.3f", NUM.sqrt(sourceStats.variance)),
                          LOCALE.format_string("%0.3f", NUM.sqrt(alteredStats.variance))]) 

        listTable.append([ARCPY.GetIDMessage(84414), 
                          LOCALE.format_string("%0.3f", STATS.median(sourceData)),
                          LOCALE.format_string("%0.3f", STATS.median(alteredData))])

        listTable.append([ARCPY.GetIDMessage(84742), 
                          LOCALE.format_string("%0.3f", sourceStats.skewness),
                          LOCALE.format_string("%0.3f", alteredStats.skewness)])

        listTable.append([ARCPY.GetIDMessage(84739), 
                          LOCALE.format_string("%0.3f", sourceKurtosis),
                          LOCALE.format_string("%0.3f", alteredKurtosis)]) 

        outputReport = outputTextTable(listTable, header = msgHeader,
                                            justify = ["left", "right", "right"], 
                                            colPad = 1, pad = 1,
                                                titleFillToken = "-")
        return outputReport 

    def applyFunctionInEachField(self):
        """ Apply function in each field """
        summary = ""
        errors = []
        warnings = []
        allRecordsAreNullError = 110411
        for field in self.fieldList:
            self.currentField = field
            self.parameterInfo = ""
            source = self.reader.getData(field.upper())
            #### Control Null Integers ####
            source = self.maskData(source)
            nulls = NUM.isnan(source)
            nNulls = NUM.sum(nulls)
            noNulls = ~nulls
            nValues = len(source)
            data = None
            error = allRecordsAreNullError
            warning = None

            if nNulls != nValues:
                if nNulls > 0:
                    data, error, warning = self.function(source[noNulls])
                else:
                    data, error, warning = self.function(source)

            fieldName = self.newNames[field.upper()]

            if data is None:
                errors.append((error, field ))
                continue

            if warning is not None:
                warnings.append((warning,field))

            #### Handle Field Names ###
            if nNulls > 0:
                summary += self.__generateStatTable(field, fieldName, source[noNulls], data, nNulls  )
                data1 = NUM.full(nValues, NUM.nan, dtype = NUM.float64)
                data1[noNulls] = data
                data = data1
            else:
                summary += self.__generateStatTable(field, fieldName, source, data, 0 )

            summary += self.parameterInfo
            summary += "\n"

            #### Check data length ####
            detectedNulls = []
            if len(data):
                if not self.isNullable:
                    mask = NUM.isnan(data)
                    if mask.sum() > 0:
                        data[mask]= 0
                        detectedNulls.append(fieldName)

                self.outputData.append(data)
                self.fieldNames.append(fieldName)
                self.fieldNameAlias.append(fieldName)

        if len(errors) > 0:
            if len(self.outputData) == 0:
                unqError = set()
                for e in errors:
                    unqError.add(e[0])
                for ue in unqError:
                    fields = [e[1] for e in errors if e[0] == ue]
                    ARCPY.AddIDMessage("ERROR", ue,", ".join(fields))
                raise SystemExit
            else:
                unqError = set()
                for e in errors:
                    unqError.add(e[0])
                for ue in unqError:
                    fields = [e[1] for e in errors if e[0] == ue]
                    ARCPY.AddIDMessage("WARNING", ue,", ".join(fields))

        if len(warnings):
                unqError = set()
                for e in warnings:
                    unqError.add(e[0])
                for ue in unqError:
                    fields = [e[1] for e in warnings if e[0] == ue]
                    ARCPY.AddIDMessage("WARNING", ue,", ".join(fields))

        if  len(detectedNulls):
            ARCPY.AddIDMessage("WARNING", 110349,", ".join(detectedNulls))

        ARCPY.AddMessage(summary)

    def invx(self, data):
        warning = None
        sigma = self.args["sigma"]
        dataInfo = data

        if sigma is not None:
            dataInfo = data + sigma

        mask = dataInfo == 0

        if len(dataInfo) == mask.sum():
            return None, 110348, None

        #### Apply Mask ####
        if len(dataInfo) and mask.sum():
            warning= 110344

            mask = dataInfo != 0
            data1 = NUM.zeros(len(dataInfo), float)
            data1[:] = NUM.nan
            data1[mask] = 1/dataInfo[mask]
            return data1, None, warning

        return 1/dataInfo, None, None

    def sqrt(self, data):
        warning = None
        sigma = self.args["sigma"]
        dataInfo = data

        if sigma is not None:
            dataInfo = data + sigma
        else:
            sigma = 0
            if data.min() >= 0:
                dataInfo = data
            else:
                sigma = -data.min()
                dataInfo = data + sigma

            ####  Add Parameter Info ####
            msgHeader = self.currentField 
            listTable = []
            listTable.append([ARCPY.GetIDMessage(220070), LOCALE.format_string("%0.3f", sigma)])
            outputReport = outputTextTable(listTable, header = msgHeader,
                                            justify = ["left", "right", ], 
                                            colPad = 10, pad = 1,
                                                titleFillToken = "-")
            self.parameterInfo = outputReport

        warning = None
        mask = dataInfo < 0
        if len(dataInfo) == mask.sum():
            return  None, 110347, None

        if len(dataInfo) and mask.sum():
            warning = 110344

            mask = dataInfo >= 0
            data1 = NUM.zeros(len(dataInfo), float)
            data1[:] = NUM.nan
            data1[mask] = NUM.sqrt(dataInfo[mask])
            return data1, None, warning

        return NUM.sqrt(dataInfo), None, warning

    def sqr(self, data):
        sigma = self.args["sigma"]
        dataInfo = data

        if sigma is not None:
            return NUM.power(data,2)- sigma, None, None
        return NUM.power(data,2), None, None

    def exp(self, data, applySigma = True):
        sigma = self.args["sigma"]
        dataInfo = NUM.exp(data)

        ### Apply Shift ####
        if applySigma:
            if sigma is not None:
                dataInfo -= sigma
        return dataInfo, None, None

    def log(self, data, applySigma = True):
        warning = None
        sigma = self.args["sigma"]
        dataInfo = data

        ### Apply Shift ####
        if applySigma:
            if sigma is not None:
                dataInfo = data + sigma
            else:
                sigma = 0
                if data.min() > 0:
                    dataInfo = data
                else:
                    sigma = -data.min()+0.000001
                    dataInfo = data + sigma

            ####  Add Parameter Info ####
            msgHeader = self.currentField 
            listTable = []
            listTable.append([ARCPY.GetIDMessage(220070), LOCALE.format_string("%0.3f", sigma)])
            outputReport = outputTextTable(listTable, header = msgHeader,
                                            justify = ["left", "right", ], 
                                            colPad = 1, pad = 1,
                                                titleFillToken = "-")
            self.parameterInfo = outputReport

        mask = dataInfo <= 0

        if len(dataInfo) == mask.sum():
            return None, 110346, None

        if len(dataInfo) and mask.sum():
            warning = 110344

            mask = dataInfo > 0
            data1 = NUM.zeros(len(dataInfo), float)
            data1[:] = NUM.nan
            data1[mask] = NUM.log(dataInfo[mask])
            return data1, None, warning

        return NUM.log(dataInfo), None, None

    def iboxcox(self,data):
        sigma = self.args["sigma"]
        lambdaValue = self.args["lambda"]

        if lambdaValue== 0 and  sigma == 0:
            return self.exp(data)

        dataSigma = data + sigma

        if lambdaValue == 0:
            return self.exp(dataSigma)
        else:
            return  NUM.power(data*lambdaValue + 1, 1/lambdaValue) - sigma, None, None

    def iinboxcox(self,data):
        sigma = self.args["sigma"]
        lambdaValue = self.args["lambda"]
        gm = self.args["geometric_mean"]

        if lambdaValue== 0 and sigma == 0:
            return self.exp(data/gm)

        dataSigma = data + sigma

        if lambdaValue == 0:
            data, e,w = self.exp(data/gm)
            return data -sigma, e, w
        else:
            gl = NUM.power(gm ,lambdaValue-1)
            return  NUM.power(data*lambdaValue*gl + 1, 1/lambdaValue) - sigma, None, None

    def estimateParmeter(self, data):
        import scipy.optimize as OPT

        def logBoxcox(lambdaValue, data):
            n = len(data)
            if n == 0:
                return NUM.nan

            logdata = NUM.log(data)

            if lambdaValue == 0:
                variance = NUM.var(logdata)
            else:
                variance = NUM.var(data**lambdaValue / lambdaValue)

            return (lambdaValue - 1) * NUM.sum(logdata) - n/2 * NUM.log(variance)

        def mleFunction(lambdaValue, data):
            lv =  -logBoxcox(lambdaValue, data)
            return lv

        #### Find Optimal Parameter for Lambda ####
        solution = OPT.minimize(mleFunction, x0=[0.1], args = (data), bounds = [(-5, 5)], 
                          method = "L-BFGS-B")
        return solution

    def checkConstant(self, data2Use):
        variance = data2Use.var()
        sumAll = data2Use.sum()

        if len(data2Use) > 0:
            firstValue = data2Use[0]
            if variance == 0 and compareFloat(sumAll,len(data2Use)*firstValue):
                return 110345
        return None

    def maskData(self, info):
        if info.dtype in [NUM.int32, NUM.int64]:
            nullInt = NUM.iinfo(info.dtype).min
            nulls = info != nullInt
            if len(nulls) > 0:
                data = NUM.full(len(info), NUM.nan, dtype= NUM.float64)
                data[nulls] = info[nulls]
                return data
            else:
                return info
        else:
            return info

    def boxcox(self, data, printParameterInfo = True):
        warning = None
        sigma = self.args["sigma"]
        lambdaValue = self.args["lambda"]

        if lambdaValue == 0 and sigma == 0:
            return self.log(data)

        maskedValues = None
        if lambdaValue is None:
            import scipy.stats as SCPST

            if sigma is None:
                sigma = 0

                if data.min() > 0:
                    #param = self.estimateParmeter(data)
                    #### Check Constant Data ####
                    cnst = self.checkConstant(data)
                    if cnst is not None:
                        return None, cnst, warning

                    #### Estimate Lambda ####
                    _, param = SCPST.boxcox(data)

                else:
                    sigma = -data.min()+0.000001
                    #param = self.estimateParmeter( data + sigma)
                    data2Use = data + sigma

                    #### Check Constant Data ####
                    cnst = self.checkConstant(data)
                    if cnst is not None:
                        return None, cnst, warning

                    #### Estimate Lambda ####
                    _, param = SCPST.boxcox(data2Use)
            else:
                data2Use = data + sigma

                #### Check Constant Data ####
                cnst = self.checkConstant(data2Use)
                if cnst is not None:
                    return None, cnst, warning

                mask = data2Use < 0

                if len(data2Use) and mask.sum():
                    warning = 110344

                    maskedValues = data2Use > 0

                    #### Estimate Lambda ####
                    _, param = SCPST.boxcox(data2Use[maskedValues])

                else:
                    #### Estimate Lambda ####
                    _, param = SCPST.boxcox(data2Use)

            lambdaValue = param
        else:
            if sigma is None:
                sigma = 0
                if data.min() < 0:
                    sigma = -data.min()+0.000001
            else:
                data2Use = data + sigma
                maskedValues = data2Use < 0

                if len(data2Use) and maskedValues.sum():
                    maskedValues = data2Use > 0
                    warning = 110344

        ####  Add Parameter Info ####
        if printParameterInfo:
            msg = ARCPY.GetIDMessage(220068)
            msgHeader = msg.format( self.currentField )
            listTable = []
            listTable.append([ARCPY.GetIDMessage(220069), LOCALE.format_string("%0.8f", lambdaValue)])
            listTable.append([ARCPY.GetIDMessage(220070), LOCALE.format_string("%0.3f", sigma)])

            outputReport = outputTextTable(listTable, header = msgHeader,
                                            justify = ["left", "right", ], 
                                            colPad = 10, pad = 1,
                                                titleFillToken = "-")
            self.parameterInfo = outputReport

        dataSigma = data + sigma
        self.checkConstant(dataSigma)
        if maskedValues is None or maskedValues.sum() == 0:
            if lambdaValue == 0:
                return self.log(dataSigma, applySigma = False), None, warning
            else:
                return (NUM.power(dataSigma, lambdaValue) - 1) / lambdaValue, None, warning
        else:
            #### Apply BoxCox no negative values ####
            data1 = NUM.zeros(len(dataSigma), float)
            ##### Initialize Array with Null values ####
            data1[:] = NUM.nan

            dataSigma = dataSigma[maskedValues]
            #### Calcualte Boxcox ####
            if lambdaValue == 0:
                dataCalc = self.log(dataSigma, applySigma = False)
            else:
                dataCalc =(NUM.power(dataSigma, lambdaValue) - 1) / lambdaValue
            #### Recplace Values #####
            data1[maskedValues] = dataCalc
            return data1, None, warning

    def inboxcox(self,data):
        import scipy.stats as SCSTATS

        if self.args["lambda"] == 0 and self.args["sigma"] == 0:
            gc = SCSTATS.gmean(data)
            ARCPY.AddMessage("Geometric Mean: {0}".format(gc))
            return gc*self.log(data), None, None

        sigma = self.args["sigma"]
        lambdaValue = self.args["lambda"]

        if sigma+data.min() > 0:
            dataSigma = data + sigma
            geoMean = SCSTATS.gmean(dataSigma)
            ARCPY.AddMessage("Geometric Mean: {0}".format(geoMean-sigma))
            if lambdaValue == 0:
                return geoMean * self.log(dataSigma),None, None
            else:
                return (NUM.power(dataSigma, lambdaValue) - 1)/ (lambdaValue*NUM.power(geoMean, lambdaValue -1)),None, None
        else:
            v = -data.min() 
            return None, "Shift {0} should be greater than {1}".format(self.args["sigma"], v), None 

    def zscore(self, data):
        if len(data) <= 1:
            return None, 110343, None

        mean = NUM.mean(data)
        std = NUM.std(data, ddof = 0)

        if std > 0:
            return (data - mean)/std, None, None
        else:
            return None, 110343, None

        return data, None, None

    def minmax(self, data):
        minValue = 0
        maxValue = 1.0
        intervalRange = 1.0

        minValueV = NUM.min(data)
        maxValueV = NUM.max(data)

        if self.args is not None:
            minValue = self.args["Minimum"]
            maxValue = self.args["Maximum"]

            if  minValue is None:
                minValue = minValueV

            if maxValue is None:
                maxValue = maxValueV

            intervalRange =  maxValue - minValue

        if len(data) <= 1 or minValueV == maxValueV:
            return None, 110468, None

        intervalD = maxValueV - minValueV
        values =  (data - minValueV)/intervalD
        values =  values * intervalRange + minValue 
        return values, None, None

    def max(self, data):

        maxValue = NUM.max(NUM.abs(data))
        
        if maxValue == 0:
           return None, 110468, 0
            
        return data / maxValue, None, None

    def robust(self, dataInfo):
        data = NUM.asarray(dataInfo.copy(), dtype = NUM.float64)
        median = NUM.median(data)
        qMin, qMax = NUM.percentile(data,(25.0, 75.0))
        scaleValue = qMax - qMin
        
        if scaleValue == 0:
           return None, 110468, 0
           
        #scaleValue = 1 if scaleValue == 0.0 else scaleValue
        
        data -= median
        data /= scaleValue
        return data, None, None

class TransformVariable(BaseVariable):
    """
    This class transform an array
    INPUT:
        data {list 1D Arrays}: Array 
        fieldName {list field names}: Field Name
        transformMethod {str}: INVX, SQRT, LOG

    METHOD:
        self.transform(): Apply transformation

    PROPERTIES:
        self.outputData = List of 1D arrays
        self.fieldNames = List field names
        self.fieldNamesAlias = List field name aliases
    """

    def __init__(self, reader, fieldList , method = "INVX",
                 args = None, aliasFieldNames = None, isNullable = True):
        self.isNullable = isNullable
        self.fieldList = fieldList
        self.reader = reader
        self.n = len(reader.getData(fieldList[0].upper()))
        self.method = method
        self.function = None
        self.args = args
        self.currentField = ""
        self.parameterInfo = ""
        self.dictName = {
        "INVX" : (ARCPY.GetIDMessage(220045), "INV", self.invx),
        "SQRT" : (ARCPY.GetIDMessage(220046),"SQR", self.sqrt),
        "LOG"  :  (ARCPY.GetIDMessage(220047),"LOG",  self.log),
        "IVRT_BOX-COX": ("Invariant Box Cox","IBC", self.inboxcox),
        "BOX-COX": ("Box-Cox","BCX", self.boxcox),
        "INV_SQRT" : (ARCPY.GetIDMessage(220048),"SQ", self.sqr),
        "INV_LOG"  :  (ARCPY.GetIDMessage(220038),"EXP", self.exp),
        "IIVRT_BOX-COX": ("Inv Invariant Box Cox","IIBC", self.iinboxcox),
        "INV_BOX-COX": (ARCPY.GetIDMessage(220049),"IBCX", self.iboxcox),
        "IINVX" : (ARCPY.GetIDMessage(220045), "INV", self.invx)
        }

        #### Handle Field Name Aliases ####
        self.newNames ={}
        if aliasFieldNames is not None:
            self.newNames = aliasFieldNames
        self.function = self.dictName[method][2]
        self.labelFunction =  "Transformed ({0})".format(self.dictName[method][0])
        self.outputData = []
        self.fieldNames = []
        self.fieldNameAlias = []

class StandardizeVariable(BaseVariable):
    """
    This class standardize an array
    INPUT:
        data {list 1D Arrays}: Array 
        fieldName {list field names}: Field Name
        standardizationMethod {str}: Z-Score, min-Max
        args {dict/None}: Dictionary with extra parameter for a method e.g. MIN-MAX
    METHOD:
        self.function(): Apply standarization

    PROPERTIES:
        self.outputData = List of 1D arrays
        self.fieldNames = List field names
        self.fieldNamesAlias = List field name aliases
    """
    def __init__(self, reader, fieldList , method = "Z-SCORE", 
                 args = None, aliasFieldNames = None, isNullable = True):
        self.isNullable = isNullable
        self.fieldList = fieldList
        self.reader = reader
        self.n = len(reader.getData(fieldList[0].upper()))
        self.method = method
        self.aliasNameStandardization = ""
        self.currentField = ""
        self.parameterInfo = ""
        self.function = None
        self.args = args
        self.dictName = {
        "Z-SCORE" : ("Z-Score", "ZS",self.zscore ),
        "MIN-MAX" : ("Min-Max","MM", self.minmax),
        "MAXABS" : ("Max-Abs","MA", self.max),
        "ROBUST" : ("Robust","RB", self.robust)
        }

        #### Handle Field Name Aliases ####
        self.newNames ={}
        if aliasFieldNames is not None:
            self.newNames = aliasFieldNames
        self.function = self.dictName[method][2]
        self.labelFunction = "Standardized ({0})".format(self.dictName[method][0])
        self.outputData = []
        self.fieldNames = []
        self.fieldNameAlias = []

class SField():
    """ SField Basic Field Container 
        INPUT: 
            field (arcpy.Field/ Sfield)
    """
    def __init__(self, field, repeatedAlias = False):
        self.name = field.name
        self.aliasName = field.aliasName
        self.ftype = field.type
        self.repeatedAlias = repeatedAlias

    def __str__(self):
        if self.repeatedAlias:
            return "{0} [{1}]".format(self.aliasName, self.name)
        if self.aliasName == self.name:
            return self.name
        else:
            return self.aliasName

class SSFieldsInfo():
    """ SSFieldsInfo Class handle repeated alias field names 
        INPUT:
            desc (Describe output of a Feature Class 
    """
    def __init__(self, desc):
        uniqueAlias, counts = NUM.unique([field.aliasName for field in desc.fields], return_counts = True)
        repeatedMask = NUM.where(counts > 1)[0]
        noUniqueAlias = uniqueAlias[counts>1]
        fieldList = []
        self.desc = desc
        for i, field in enumerate(desc.fields):
            if field.aliasName in noUniqueAlias:
                fieldList.append(SField(field, True))
            else:
                fieldList.append(SField(field, False))
        self.fieldList = fieldList
        self.dFields = {field.name: (field.aliasName, field.type) for field in desc.fields}

    def fieldAlias(self, fieldNameString):
        """ Search Field using field name """
        for f in self.fieldList:
            if f.name == fieldNameString:
                return f
        for f in self.fieldList:
            if f.aliasName == fieldNameString:
                return f
        for f in self.fieldList:
            if str(f) == fieldNameString:
                return f

        return None

    def fieldAliasUpper(self, fieldNameString):
        """ Search Field using field name """
        for f in self.fieldList:
            if f.name.upper() == fieldNameString:
                return f
        for f in self.fieldList:
            if f.aliasName.upper() == fieldNameString:
                return f
        for f in self.fieldList:
            if str(f).upper() == fieldNameString:
                return f

        return None

distanceUnitInfo = {
"METER": ("Meters", 1.0),
"METERS": ("Meters", 1.0),
"INTL_FOOT": ("International Feet", 0.3048),
"FOOT": ("Feet", 0.3048006096012192),
"FEET": ("Feet", 0.3048006096012192),
"FOOT_US": ("US_Feet", 0.3048006096012192),
"US_FOOT": ("US_Feet", 0.3048006096012192),
"US_FEET": ("US_Feet", 0.3048006096012192),
"MILE_US": ("US Miles", 1609.347218694438),
"US_MILES": ("US Miles", 1609.347218694438),
"US_MILE": ("US Miles", 1609.347218694438),
"MILES": ("Miles", 1609.347218694438),
"MILE": ("Miles", 1609.347218694438),
"KILOMETER": ("Kilometers", 1000.0),
"KILOMETERS": ("Kilometers", 1000.0),
"FOOT_CLARKE": ("Clarke Feet", 0.304797265),
"FATHOM": ("Fathoms", 1.8288),
"NAUTICAL_MILE": ("Nautical Miles", 1852.0),
"METER_GERMAN": ("German Meters", 1.00000135965),
"CHAIN_US": ("US Chains", 20.11684023368047),
"LINK_US": ("US Links", 0.2011684023368047),
"YARD_CLARKE": ("Clarke Yards", 0.914391795),
"CHAIN_CLARKE": ("Clarke Chains", 20.11661949),
"LINK_CLARKE": ("Clarke Links", 0.2011661949),
"YARD_SEARS": ("Sears Yards", 0.9143984146160287),
"FOOT_SEARS": ("Sears Feet", 0.3047994715386762),
"CHAIN_SEARS": ("Sears Chains", 20.11676512155263),
"LINK_SEARS": ("Sears Links", 0.2011676512155263),
"YARD_BENOIT_1895_A": ("Benoit Yards (1895 A)", 0.9143992),
"FOOT_BENOIT_1895_A": ("Benoit Feet (1895 A)", 0.3047997333333333),
"CHAIN_BENOIT_1895_A": ("Benoit Chains (1895 A)", 20.1167824),
"LINK_BENOIT_1895_A": ("Benoit Links (1895 A)", 0.201167824),
"YARD_BENOIT_1895_B": ("Benoit Yards (1895 B)", 0.9143992042898124),
"FOOT_BENOIT_1895_B": ("Benoit Feet (1895 B)", 0.3047997347632708),
"CHAIN_BENOIT_1895_B": ("Benoit Chains (1895 B)", 20.11678249437587),
"LINK_BENOIT_1895_B": ("Benoit Links (1895 B)", 0.2011678249437587),
"FOOT_1865": ("Feet (1865)", 0.3048008333333334),
"FOOT_INDIAN": ("Indian Feet", 0.3047995102481469),
"FOOT_INDIAN_1937": ("Indian Feet (1937)", 0.30479841),
"FOOT_INDIAN_1962": ("Indian Feet (1962)", 0.3047996),
"FOOT_INDIAN_1975": ("Indian Feet (1975)", 0.3047995),
"YARD_INDIAN": ("Indian Yards", 0.9143985307444408),
"YARD_INDIAN_1937": ("Indian Yards (1937)", 0.91439523),
"YARD_INDIAN_1962": ("Indian Yards (1962)", 0.9143988),
"YARD_INDIAN_1975": ("Indian Yards (1975)", 0.9143985),
"FOOT_GOLD_COAST": ("Gold Coast Feet", 0.3047997101815088),
"FOOT_BRITISH_1936": ("British Feet (1936)", 0.3048007491),
"YARD": ("Yards", 0.9144),
"YARD_US": ("US Yards", 0.9144018288036576),
"CHAIN": ("Chains", 20.1168),
"LINK": ("Links", 0.201168),
"DECIMETER": ("Decimeters", 0.1),
"CENTIMETER": ("Centimeters", 0.01),
"MILLIMETER": ("Millimeters", 0.001),
"INCH": ("Inches", 0.0254),
"INCH_US": ("US Inches", 0.0254000508001016),
"ROD": ("Rods", 5.0292),
"ROD_US": ("US Rods", 5.029210058420118),
"NAUTICAL_MILE_US": ("US Nautical Miles", 1853.248),
"NAUTICAL_MILE_UK": ("UK Nautical Miles", 1853.184),
"50_KILOMETERS": ("50 Kilometers", 50000.0),
"150_KILOMETERS": ("150 Kilometers", 150000.0),
"UNKNOWN": ("Unknown Units", 1.0),
"RADIAN": ("Radians", 1.0),
"RADIANS": ("Radians", 1.0),
"DEGREE": ("Degrees", 0.0174532925199433),
"MINUTE": ("Minutes", 0.0002908882086657216),
"SECOND": ("Seconds", 0.00000484813681109536),
"GRAD": ("Grads", 0.01570796326794897),
"GON": ("Gons", 0.01570796326794897),
"MICRORADIAN": ("Microradians", 0.000001),
"MINUTE_CENTESIMAL": ("Centesimal Minutes", 0.0001570796326794897),
"SECOND_CENTESIMAL": ("Centesimal Seconds", 0.000001570796326794897),
"MIL_6400": ("MIL_6400", 0.0009817477042468104),
"INCHESINT": ("International Feet", 0.0254),
"FEETINT": ("International Feet", 0.3048),
"YARDSINT": ("International Feet", 0.9144),
"MILESINT": ("Statute Miles", 1609.344),
"STATUTE_MILE": ("Statute Miles", 1609.344)}


def roundValue(value, decimal):
    abs_value = abs(value)
    if abs_value >= 1:
        return round(value, decimal)
    elif abs_value <= 1e-8:
        return 0
    else:
        additional = int(-MATH.log10(abs_value))
        return round(value, decimal+additional)


def getPerfectFormatDecimal(value, targetDecimal, minDeciamlLimit=1, returnFormatStr=False):
    """
    Given a number to converet to string, This function will help decide which target decimal is optimal to use.
    The provided target Decimal will be used first. However, if the tail number is 0, it will be omitted until meets the minimum decimal limit
    e.g set targetDecimal=3, minDeciamlLimit=1
    give 3.4534 will return 3
    give 3.6200 will return 2
    give 3 will return 1
    """
    if minDeciamlLimit < 0:
        minDeciamlLimit = 0

    if targetDecimal < minDeciamlLimit:
        if returnFormatStr:
            return "%.{}f".format(targetDecimal)
        else:
            return targetDecimal

    dec = targetDecimal
    lastD = int(value * 10 ** (dec) % 10)
    while dec > minDeciamlLimit and lastD == 0:
        dec -= 1
        lastD = int(value * 10 ** (dec) % 10)

    if returnFormatStr:
        return "%.{}f".format(dec)
    else:
        return dec

def enableTimeSliderCPD(templatePath, timeData, paramID, data=None):
    import json
    import netCDF4 as NET
    from arcpy.cim.cimloader import GetJSONTypeOBJ
    from arcpy.cim.cimloader import CimJsonEncoder
    import datetime
    import time
    import numpy as NP

    if templatePath not in ["ChangePoint.lyrx",
                            "ChangePoint_points.lyrx"]:
        return

    pathTemplate = OS.path.join(pathLayers, templatePath)
    f = open(pathTemplate, 'r')
    content = f.read()
    f.close()
    
    cimLayer = GetJSONTypeOBJ(json.loads(content))
    layerCIM = cimLayer.layerDefinitions[0]

    #### Get time data Range ####
    minTime = timeData.data_min_time
    minTime = datetime.datetime.strptime(minTime, '%Y-%m-%d %H:%M:%S')
    
    maxTime = timeData.data_max_time
    maxTime = datetime.datetime.strptime(maxTime, '%Y-%m-%d %H:%M:%S')

    temp = NUM.array([minTime, maxTime], dtype="datetime64[s]")
    temp = temp.view('i8')
    timeEnabled = ["FIRST_CHPT", temp[0] * 1000, temp[1] * 1000]

    timeTD = ARCPY.cim.CreateCIMObjectFromClassName('CIMTimeTableDefinition', 'V2')
    timeTD.startTimeField = timeEnabled[0]
    layerCIM.featureTable.timeFields = timeTD
    tDef = ARCPY.cim.CreateCIMObjectFromClassName('CIMTimeDataDefinition', 'V2')
    tDef.useTime = True
    tExt = ARCPY.cim.CreateCIMObjectFromClassName('TimeExtent', 'V2')
    tExt.start = int(timeEnabled[1])
    tExt.end = int(timeEnabled[2])
    tExt.empty = False
    tDef.customTimeExtent = tExt
    layerCIM.featureTable.timeDefinition = tDef
    tDDef = ARCPY.cim.CreateCIMObjectFromClassName('CIMTimeDisplayDefinition', 'V2')
    tDDef.timeInterval = 1
    tDDef.timeIntervalUnits = "esriTimeUnitsUnknown"
    tDDef.timeOffsetUnits = "esriTimeUnitsDays"
    layerCIM.featureTable.timeDisplayDefinition = tDDef 
    layerCIM.featureTable.timeDimensionFields =  ARCPY.cim.CreateCIMObjectFromClassName('CIMTimeDimensionDefinition', 'V2')
    info = json.dumps(layerCIM, cls=CimJsonEncoder)

    #### Apply JSON CIM ####
    ARCPY.gp.SetParameterSymbology(paramID, "JSONCIMDEF="+info.strip())

def getTempLayerPath(filePrefix):
    tempFolder = TEMPFILE.gettempdir()
    return OS.path.join(tempFolder, filePrefix + ".lyrx")

def getTimeStamps(format = "%Y%m%d%H%M%S"):
    """ return current time stamp
    INPUT:
        format {str}: Format of the time stamp """
    import datetime as DT
    return DT.datetime.now().strftime(format)

def buildLocaleCIMLayer(templatePath, paramID, data=None, outPath=None):
    """
    There are many SS tools that use the layer templates to render the layer with specific symbologies.
    However, many of the result layers are not localized.
    In this general function, we localize the layer template according to current Env and build the CIM string
    for directly rendering the result layers.

    Parameters
    ----------
    templatePath    :str
                     the relative path to the layer template. This is used as the id to indicate which layer file to use.
    paramID         :int
                     the id of the parameter for setting the final CIM string
    data            :dict
                     default as None. The additional data for building the String

    outPath      :str
                     If this output path is provided, the function will save the CIM layer to a local file. Else, directly apply
                     to the paramID
    Returns
    -------
    """
    import json
    from arcpy.cim.cimloader import GetJSONTypeOBJ
    from arcpy.cim.cimloader import CimJsonEncoder

    if templatePath not in ["GGWR_Points.lyrx", "GGWR_Polygons.lyrx", "GWR_Points.lyrx", "GWR_Polygons.lyrx",
                            "LocalGPoints.lyrx", "LocalGPolygons.lyrx", "LocalGPolylines.lyrx",
                            "LocalIPoints.lyrx", "LocalIPolygons.lyrx", "LocalIPolylines.lyrx",
                            "LocalIPointsNN.lyrx", "LocalIPolygonsNN.lyrx", "LocalIPolylinesNN.lyrx",
                            "Emerging_All.lyrx", "Emerging_All_points.lyrx",
                            "MGWR_Significance_Points.lyrx", "MGWR_Significance_Polygons.lyrx",
                            "MGWR_Cofficient_Points.lyrx", "MGWR_Cofficient_Polygons.lyrx",
                            "FillValues_polys.lyrx", "FillValues_points.lyrx", "FillValues_polys_related.lyrx", "FillValues_points_related.lyrx",
                            "GWR_Predict_Points_Binary.lyrx", "GWR_Predict_Polygons_Binary.lyrx", "GWR_Predict_Points_Count.lyrx",
                            "GWR_Predict_Polygons_Count.lyrx", "GWR_Predict_Points.lyrx", "GWR_Predict_Polygons.lyrx",
                            "MGWR_Cofficient_Points_Uni.lyrx", "MGWR_Cofficient_Polygons_Uni.lyrx",
                            "HotSpot_CatPair_point.lyrx", "HotSpot_CatPair_polygon.lyrx", "HotSpot_CatPair_line.lyrx",
                            "CausalInferenceAna_Polygons.lyrx", "CausalInferenceAna_Points.lyrx", "CausalInferenceAna_Lines.lyrx",
                            "TimeSeriesCorrelation_Lag_Point.lyrx", "TimeSeriesCorrelation_Lag_forward_Point.lyrx", "TimeSeriesCorrelation_Lag_backward_Point.lyrx",
                            "TimeSeriesCorrelation_Lag_Polygon.lyrx", "TimeSeriesCorrelation_Lag_forward_Polygon.lyrx", "TimeSeriesCorrelation_Lag_backward_Polygon.lyrx",
                            "DecomposeSpatialStructure_Point.lyrx", "DecomposeSpatialStructure_Polygon.lyrx"]:
        return
    pathTemplate = OS.path.join(pathLayers, templatePath)
    f = open(pathTemplate, 'r')
    content = f.read()
    f.close()
    cimLayer = GetJSONTypeOBJ(json.loads(content))
    layerDef = cimLayer.layerDefinitions[0]

    if templatePath in ["GGWR_Points.lyrx", "GGWR_Polygons.lyrx"]:
        labels = {
            "< -2.5": "< {}".format(LOCALE.format_string("%.1f", -2.5)),
            "-2.5 - -1.5": "{} - {}".format(LOCALE.format_string("%.1f", -2.5), LOCALE.format_string("%.1f", -1.5)),
            "-1.5 - -0.5": "{} - {}".format(LOCALE.format_string("%.1f", -1.5), LOCALE.format_string("%.1f", -0.5)),
            "-0.5 - 0.5": "{} - {}".format(LOCALE.format_string("%.1f", -0.5), LOCALE.format_string("%.1f", 0.5)),
            "0.5 - 1.5": "{} - {}".format(LOCALE.format_string("%.1f", 0.5), LOCALE.format_string("%.1f", 1.5)),
            "1.5 - 2.5": "{} - {}".format(LOCALE.format_string("%.1f", 1.5), LOCALE.format_string("%.1f", 2.5)),
            "> 2.5": "> {}".format(LOCALE.format_string("%.1f", 2.5)),
        }
        for br in layerDef.renderer.breaks:
            if br.label in labels:
                br.label = labels[br.label]
    elif templatePath in ["GWR_Points.lyrx", "GWR_Polygons.lyrx"]:
        labels = {
            "< -2.5 Std. Dev.": "< {} {}".format(LOCALE.format_string("%.1f", -2.5), ARCPY.GetIDMessage(84262)),
            "-2.5 - -1.5 Std. Dev.": "{} - {} {}".format(LOCALE.format_string("%.1f", -2.5),
                                                         LOCALE.format_string("%.1f", -1.5), ARCPY.GetIDMessage(84262)),
            "-1.5 - -0.5 Std. Dev.": "{} - {} {}".format(LOCALE.format_string("%.1f", -1.5),
                                                         LOCALE.format_string("%.1f", -0.5), ARCPY.GetIDMessage(84262)),
            "-0.5 - 0.5 Std. Dev.": "{} - {} {}".format(LOCALE.format_string("%.1f", -0.5),
                                                        LOCALE.format_string("%.1f", 0.5), ARCPY.GetIDMessage(84262)),
            "0.5 - 1.5 Std. Dev.": "{} - {} {}".format(LOCALE.format_string("%.1f", 0.5),
                                                       LOCALE.format_string("%.1f", 1.5), ARCPY.GetIDMessage(84262)),
            "1.5 - 2.5 Std. Dev.": "{} - {} {}".format(LOCALE.format_string("%.1f", 1.5),
                                                       LOCALE.format_string("%.1f", 2.5), ARCPY.GetIDMessage(84262)),
            "> 2.5 Std. Dev.": "> {} {}".format(LOCALE.format_string("%.1f", 2.5), ARCPY.GetIDMessage(84262)),
        }
        for br in layerDef.renderer.breaks:
            if br.label in labels:
                br.label = labels[br.label]
        layerDef.renderer.heading = ARCPY.GetIDMessage(84891)
        try:
            if data is not None and "field" in data:
                layerDef.renderer.field = data["field"]
        except:
            pass
    elif templatePath in ["LocalGPoints.lyrx", "LocalGPolygons.lyrx", "LocalGPolylines.lyrx"]:
        labels = {
            "Cold Spot - 99% Confidence": ARCPY.GetIDMessage(84512).format(99),
            "Cold Spot - 95% Confidence": ARCPY.GetIDMessage(84512).format(95),
            "Cold Spot - 90% Confidence": ARCPY.GetIDMessage(84512).format(90),
            "Hot Spot - 99% Confidence": ARCPY.GetIDMessage(84510).format(99),
            "Hot Spot - 95% Confidence": ARCPY.GetIDMessage(84510).format(95),
            "Hot Spot - 90% Confidence": ARCPY.GetIDMessage(84510).format(90),
            "Not Significant": ARCPY.GetIDMessage(84511)
        }
        for br in layerDef.renderer.breaks:
            if br.label in labels:
                br.label = labels[br.label]
        try:
            if data is not None and "field" in data:
                layerDef.renderer.field = data["field"]
            if data is not None and "heading" in data:
                layerDef.renderer.heading = data["heading"]
            if data is not None and "popup" in data:
                layerDef.popupInfo =  data["popup"]
        except:
            pass

    elif templatePath in ["LocalIPoints.lyrx", "LocalIPolygons.lyrx", "LocalIPolylines.lyrx"]:
        labels = {
            "High-High Cluster": ARCPY.GetIDMessage(84661),
            "Low-Low Cluster": ARCPY.GetIDMessage(84662),
            "High-Low Outlier": ARCPY.GetIDMessage(84659),
            "Low-High Outlier": ARCPY.GetIDMessage(84660),
            "Not Significant": ARCPY.GetIDMessage(84663)}
        for cla in layerDef.renderer.groups[0].classes:
            if cla.label in labels:
                cla.label = labels[cla.label]
        if layerDef.renderer.defaultLabel in labels:
            layerDef.renderer.defaultLabel = labels[layerDef.renderer.defaultLabel]

        try:
            if data is not None and "field" in data:
                layerDef.renderer.field = data["field"]
            if data is not None and "heading" in data:
                layerDef.renderer.groups[0].heading = data["heading"]
            if data is not None and "popup" in data:
                layerDef.popupInfo =  data["popup"]
        except:
            pass

    elif templatePath in ["LocalIPointsNN.lyrx", "LocalIPolygonsNN.lyrx", "LocalIPolylinesNN.lyrx"]:
        labels = {
            "High-High Cluster": ARCPY.GetIDMessage(84661),
            "Low-Low Cluster": ARCPY.GetIDMessage(84662),
            "High-Low Outlier": ARCPY.GetIDMessage(84659),
            "Low-High Outlier": ARCPY.GetIDMessage(84660),
            "Not Significant": ARCPY.GetIDMessage(84663),
            "No Neighbors": ARCPY.GetIDMessage(220682)}
        for cla in layerDef.renderer.groups[0].classes:
            if cla.label in labels:
                cla.label = labels[cla.label]
        if layerDef.renderer.defaultLabel in labels:
            layerDef.renderer.defaultLabel = labels[layerDef.renderer.defaultLabel]

        try:
            if data is not None and "field" in data:
                layerDef.renderer.fields = [data["field"]]
            if data is not None and "popup" in data:
                layerDef.popupInfo =  data["popup"]
            if data is not None and "heading" in data:
                layerDef.renderer.groups[0].heading = data["heading"]
        except:
            pass

    elif templatePath in ["Emerging_All.lyrx", "Emerging_All_points.lyrx"]:
        labels = {
            "New Hot Spot": ARCPY.GetIDMessage(220146),
            "Consecutive Hot Spot": ARCPY.GetIDMessage(220147),
            "Intensifying Hot Spot": ARCPY.GetIDMessage(220148),
            "Persistent Hot Spot": ARCPY.GetIDMessage(220149),
            "Diminishing Hot Spot": ARCPY.GetIDMessage(220150),
            "Sporadic Hot Spot": ARCPY.GetIDMessage(220151),
            "Oscillating Hot Spot": ARCPY.GetIDMessage(220152),
            "Historical Hot Spot": ARCPY.GetIDMessage(220153),
            "New Cold Spot": ARCPY.GetIDMessage(220154),
            "Consecutive Cold Spot": ARCPY.GetIDMessage(220155),
            "Intensifying Cold Spot": ARCPY.GetIDMessage(220156),
            "Persistent Cold Spot": ARCPY.GetIDMessage(220157),
            "Diminishing Cold Spot": ARCPY.GetIDMessage(220158),
            "Sporadic Cold Spot": ARCPY.GetIDMessage(220159),
            "Oscillating Cold Spot": ARCPY.GetIDMessage(220160),
            "Historical Cold Spot": ARCPY.GetIDMessage(220161),
            "No Pattern Detected": ARCPY.GetIDMessage(220162),
            "<all other values>": "<{}>".format(ARCPY.GetIDMessage(220163)),
        }
        for cla in layerDef.renderer.groups[0].classes:
            if cla.label in labels:
                cla.label = labels[cla.label]
        if layerDef.renderer.defaultLabel in labels:
            layerDef.renderer.defaultLabel = labels[layerDef.renderer.defaultLabel]
        if data is not None and "heading" in data:
            layerDef.renderer.groups[0].heading = data["heading"]
    elif templatePath in ["MGWR_Significance_Points.lyrx", "MGWR_Significance_Polygons.lyrx"]:
        labels = {
            "Significant": ARCPY.GetIDMessage(220527),
            "Not Significant": ARCPY.GetIDMessage(84580),
        }
        for cla in layerDef.renderer.groups[0].classes:
            if cla.label in labels:
                cla.label = labels[cla.label]
    elif templatePath in ["MGWR_Cofficient_Points.lyrx", "MGWR_Cofficient_Polygons.lyrx"]:
        labels = {
            "<= -1.0364": "<= {}".format(LOCALE.format_string("%.4f", -1.0364)),
            "-1.0364 - -0.3853": "{} - {}".format(LOCALE.format_string("%.4f", -1.0364), LOCALE.format_string("%.4f", -0.3853)),
            "-0.3853 - 0.0000": "{} - {}".format(LOCALE.format_string("%.4f", -0.3853), LOCALE.format_string("%.4f", 0.0000)),
            "0.0000 - 0.3853": "{} - {}".format(LOCALE.format_string("%.4f", 0.0000), LOCALE.format_string("%.4f", 0.3853)),
            "0.3853 - 1.0364": "{} - {}".format(LOCALE.format_string("%.4f", 0.3853), LOCALE.format_string("%.4f", 1.0364)),
            ">1.0364": "> {}".format(LOCALE.format_string("%.4f", 1.0364)),
            "> 1.0364": "> {}".format(LOCALE.format_string("%.4f", 1.0364)),
        }
        for br in layerDef.renderer.breaks:
            if br.label in labels:
                br.label = labels[br.label]
        if "minimumBreak" in data:
            layerDef.renderer.minimumBreak = data["minimumBreak"]
    elif templatePath in ["MGWR_Cofficient_Points_Uni.lyrx", "MGWR_Cofficient_Polygons_Uni.lyrx"]:
        if "roundingOption" in data:
            layerDef.renderer.numberFormat.roundingOption = data["roundingOption"]
        if "roundingValue" in data:
            layerDef.renderer.numberFormat.roundingValue = data["roundingValue"]
    elif templatePath in ["FillValues_polys.lyrx","FillValues_points.lyrx", "FillValues_polys_related.lyrx", "FillValues_points_related.lyrx"]:
        labels = {
        "defaultLabel" : ARCPY.GetIDMessage(220529),
        "No estimated values":ARCPY.GetIDMessage(220530),
        "heading": ARCPY.GetIDMessage(220531)
        }

        layerDef.renderer.defaultLabel = labels["defaultLabel"]
        for cla in layerDef.renderer.groups[0].classes:
            if cla.label in labels:
                cla.label = labels[cla.label]
        layerDef.renderer.groups[0].heading = labels["heading"]
    elif templatePath in ["GWR_Predict_Points_Binary.lyrx", "GWR_Predict_Polygons_Binary.lyrx", "GWR_Predict_Points_Count.lyrx",
                            "GWR_Predict_Polygons_Count.lyrx", "GWR_Predict_Points.lyrx", "GWR_Predict_Polygons.lyrx"]:
        if templatePath in ["GWR_Predict_Polygons_Binary.lyrx", "GWR_Predict_Points_Binary.lyrx"]:
            layerDef.renderer.groups[0].heading = ARCPY.GetIDMessage(84895)
        else:
            layerDef.renderer.heading = ARCPY.GetIDMessage(84895)

    elif templatePath in ['HotSpot_CatPair_point.lyrx', 'HotSpot_CatPair_polygon.lyrx', 'HotSpot_CatPair_line.lyrx']:
        labels = {
            "Hot to Cold": ARCPY.GetIDMessage(220565),
            "Hot to Not Sig": ARCPY.GetIDMessage(220566),
            "Hot to Hot": ARCPY.GetIDMessage(220567),
            "Not Sig to Hot": ARCPY.GetIDMessage(220568),
            "Not Sig to Not Sig": ARCPY.GetIDMessage(220569),
            "Not Sig to Cold": ARCPY.GetIDMessage(220570),
            "Cold to Cold": ARCPY.GetIDMessage(220571),
            "Cold to Not Sig": ARCPY.GetIDMessage(220572),
            "Cold to Hot": ARCPY.GetIDMessage(220573),
        }
        for cla in layerDef.renderer.groups[0].classes:
            if cla.label in labels:
                newLabel = labels[cla.label]
                cla.label = newLabel
                newValue = ARCPY.cim.CreateCIMObjectFromClassName('CIMUniqueValue', 'V3')
                newValue.fieldValues = [newLabel]
                cla.values = [newValue]

        layerDef.renderer.groups[0].heading = ARCPY.GetIDMessage(220557)

    elif templatePath in ["CausalInferenceAna_Polygons.lyrx", "CausalInferenceAna_Points.lyrx", "CausalInferenceAna_Lines.lyrx"]:
        layerDef.renderer.field = data["field"]
        layerDef.renderer.heading = data["heading"]
        layerDef.renderer.numberFormat.roundingValue = data["roundingValue"]
        layerDef.renderer.defaultLabel = data["defaultLabel"]
        if "popupInfo" in data:
            layerDef.popupInfo = data["popupInfo"]

    elif templatePath in ["TimeSeriesCorrelation_Lag_Point.lyrx", "TimeSeriesCorrelation_Lag_forward_Point.lyrx",
                          "TimeSeriesCorrelation_Lag_backward_Point.lyrx", "TimeSeriesCorrelation_Lag_Polygon.lyrx",
                          "TimeSeriesCorrelation_Lag_forward_Polygon.lyrx", "TimeSeriesCorrelation_Lag_backward_Polygon.lyrx"]:
        breaks = layerDef.renderer.breaks
        breaks_new = []
        for ele in data["breaks"]:
            b = breaks[ele["position"]]
            b.label = ele["label"]
            b.upperBound = ele["upperBound"]
            breaks_new.append(b)
        layerDef.renderer.breaks = breaks_new
        layerDef.renderer.minimumBreak = data["minimumBreak"]

    elif templatePath in ["DecomposeSpatialStructure_Point.lyrx", "DecomposeSpatialStructure_Polygon.lyrx"]:
        layerDef.renderer.heading = f"{ARCPY.GetIDMessage(220066)} 1"

    else:
        return

    #### Get Back JSON String ####
    if paramID >= 0:
        jsonData = json.dumps(layerDef, cls=CimJsonEncoder)
        ARCPY.gp.SetParameterSymbology(paramID, "JSONCIMDEF="+jsonData)

    if outPath is not None:
        cimLayer.layerDefinitions[0] = layerDef
        jsonData = json.dumps(cimLayer, cls=CimJsonEncoder)
        f = open(outPath, 'w')
        f.write(jsonData)
        f.close()

def versionStr2Float(version):
    versionNums = version.split('.')
    versionVal = [int(num) * 10**(-ind) for ind, num in enumerate(versionNums)]
    return sum(versionVal)

def getToolHelpHtml(idList, idDict = None, returnIdDict = False):
    
    filePath = OS.path.join(__file__ ,"../../../Help/cxhelp.xml")

    if not OS.path.exists(filePath):
        if isinstance(idList, list):
            return [""] * len(idList)
        else:
            return [""]

    else:
        if idDict is not None:
            if len(idDict) == 0:
                import xml.etree.ElementTree as ET

                helpHtmlDir = OS.path.abspath(filePath)
                tree = ET.parse(helpHtmlDir)
                idDict = [[x.attrib['id'], x.attrib['url']] for x in tree.getroot()]
                idDict = dict(idDict)
        else:
            import xml.etree.ElementTree as ET

            helpHtmlDir = OS.path.abspath(filePath)
            tree = ET.parse(helpHtmlDir)
            idDict = [[x.attrib['id'], x.attrib['url']] for x in tree.getroot()]
            idDict = dict(idDict)

        if isinstance(idList, list):
            htms = [idDict[id] for id in idList]

        elif isinstance(idList, str):
            htms = idDict[idList]

        else:
            htms = None

        if returnIdDict:
            return htms, idDict
        return htms

def getLocaleAlias():
    import locale as LOCALE

    locale = LOCALE.getdefaultlocale()
    langAlias = locale[0][0:2]

    return langAlias

def getHelpLinks(idList, idDict = None, lang = 'Auto'):
    if lang.upper() == "AUTO":
        lang = getLocaleAlias()

    htms = getToolHelpHtml(idList, idDict)
    if htms is not None:
        if isinstance(htms, list):
            links = [OS.path.join(r"https://pro.arcgis.com/", lang, htm) for htm in htms]
        elif isinstance(htms, str):
            links = [OS.path.join(r"https://pro.arcgis.com/", lang, htms)]
    else:
        links = [None]
    
    return links

def extentPolygon(extent, sr = None, backUpSR = None, outputFC = None):
    
    sr = extent.spatialReference

    if sr is None:
        try:
            aprx=ARCPY.mp.ArcGISProject("CURRENT")
        except:
            aprx = None

        if aprx is not None:
            if aprx.activeMap is not None:
                actMap = aprx.listMaps(aprx.activeMap.name)[0]
            else:
                actMap = aprx.listMaps()[0]

            sr = actMap.spatialReference

    if sr is None:
        if backUpSR is not None:
            sr = backUpSR

    polyArray = ARCPY.Array()

    polyArray.add(ARCPY.Point(extent.XMin, extent.YMin))
    polyArray.add(ARCPY.Point(extent.XMin, extent.YMax))
    polyArray.add(ARCPY.Point(extent.XMax, extent.YMax))
    polyArray.add(ARCPY.Point(extent.XMax, extent.YMin))

    extentPoly = ARCPY.Polygon(polyArray, ARCPY.SpatialReference(sr.factoryCode))

    if outputFC is not None:
        result = ARCPY.management.CreateFeatureclass("in_memory", outputFC, "POLYGON", 
                                                    spatial_reference=sr)

        with ARCPY.da.InsertCursor(result[0], ['SHAPE@']) as cursor:
            cursor.insertRow([extentPoly])

        layerName = r"{0}.lyr".format(outputFC)
        ARCPY.MakeFeatureLayer_management(outputFC, layerName)

    return extentPoly

def dbg(value, id = None, filePath=None ):
    """ Debug function to print value in an external file 
    INPUT:
        value (object): value
        id (str): identifier of 
    """
    from time import gmtime, strftime
    
    if filePath is None:
        filePath = r"c:\temp\tem.txt"
    f = None
    try:
        f = open(filePath, "a",encoding="utf-8")
    except:
        return
    
    id = str(id)
    try:
        print (strftime("%Y-%m-%d %H:%M:%S", gmtime()),value, id, file = f)
    except Exception as e:
        print (strftime("%Y-%m-%d %H:%M:%S", gmtime()),e, id, file = f)
        pass
    f.close()

def getDistanceUnit(obj, displayWarning = False):
    """ Get Distance Unit supported in Generate Near Table 
    INPUT:
        obj {str, SSDataObject, SpatialReference}
    RETURN:
        unit (default: Meters)
    """
    supportInNear = "Kilometers,Meters,NauticalMilesInt,MilesInt,YardsInt,FeetInt,NauticalMiles,Miles,Yards,Feet"
    lstSupport = {i.upper():i for i in supportInNear.split(",")}
    lstSupport["METER"] = "Meters"
    lstSupport["KILOMETER"] = "Kilometers"
    lstSupport["M"] = "Meters"
    lstSupport["F"] = "Feet"
    lstSupport["FOOT_US"] = "Feet"
    lstSupport["FOOT"] = "FeetInt"

    unit = "Meters"
    if type(obj) == str:
        if obj in lstSupport:
            unit = lstSupport[obj]
    elif type(obj) == SSDO.SSDataObject:
        if hasattr(obj, "distanceInfo") and hasattr(obj.distanceInfo, "spatialRef"):
            if obj.distanceInfo.spatialRef.linearUnitName.upper() in lstSupport:
                unit = lstSupport[obj.distanceInfo.spatialRef.linearUnitName.upper()]
            else:
                if displayWarning:
                    ARCPY.AddIDMessage("WARNING",110496)

    elif hasattr(obj, "linearUnitName"):
        if obj.linearUnitName.upper() in lstSupport:
            unit = lstSupport[obj.linearUnitName.upper()]
    return unit

def validateOutputFile(parameters, index, ext = ".ssm"):
    """Check and update  an output file path parameter
       when it's contained in a GDB or it has repeated extensions
    INPUT: 
        parameters{list parameters): List of parameters
        index {int}: output index
        ext {str}: extension
       """

    if parameters[index].value:
        try:
            upd = False
            model = parameters[index].valueAsText 
            if not model.lower().endswith(ext):
                upd = True
                model+=ext

            outPath, outName = OS.path.split(model)
            if "." not in outName:
                outName = outName.split(".")[0]
            if not outName.lower().endswith(ext):
                outName += ext
            if outName.count(".")>1:
                outName = outName.split(".")[0]+ext

            if outPath.upper().endswith(".GDB"):
                outPathFolder, outName2 = OS.path.split(outPath)
                upd = True
                model = OS.path.join(outPathFolder, outName)
            if upd:
                parameters[index].value = model
        except:
            pass


def updateCIMDefinitionPopupinfo(definition, title, outputFC):
    """
    Update the CIM definition of the layer to include the popup info, make the title correct
    Parameters
    ----------
    definition          : CIM definition
    title               : title string
    outputFC            : output feature class

    Returns
    -------
    None

    """
    popup_info = {
        "type": "CIMPopupInfo",
        "title": title.format(ARCPY.Describe(outputFC).OIDFieldName),
        "mediaInfos": [
            {
                "type": "CIMTableMediaInfo",
                "refreshRateUnit": "esriTimeUnitsSeconds",
                "rowSpan": 1,
                "columnSpan": 1,
                "fields": [f.name for f in ARCPY.ListFields(outputFC)],
                "useLayerFields": False,
            }
        ]
    }
    definition.popupInfo = popup_info
    return


def postExecuteUpdatePopupTitle(parameters, indexOutputFC, indexCreatePopup):
    """
    The default pop-up title for the result output featureClass is problematic.
    This function will reset the title to object id
    """
    try:
        outputFC = getTextParameter(indexOutputFC, parameters)
        if indexCreatePopup >= 0:
            createPopUps = parameters[indexCreatePopup].value
        else:
            createPopUps = True
        if createPopUps:
            if isShapeFileOrDBF(outputFC):
                return

            project = ARCPY.mp.ArcGISProject('CURRENT')
            map = project.activeMap

            layerMainName = OS.path.basename(outputFC)
            layerMain = None
            nameFilter = layerMainName
            if len(map.listLayers(nameFilter)) > 0:
                lc = map.listLayers(nameFilter)[0]
                if OS.path.normpath(outputFC).removesuffix(".shp") == OS.path.normpath(
                        lc.dataSource) or OS.path.normpath(
                    outputFC).removesuffix(".shp").lower().startswith("memory\\"):
                    layerMain = lc
            if layerMain is None:
                nameFilter = f"*:{layerMainName}"
                if len(map.listLayers(nameFilter)) > 0:
                    lc = map.listLayers(nameFilter)[0]
                    if OS.path.normpath(outputFC).removesuffix(".shp") == OS.path.normpath(lc.dataSource):
                        layerMain = lc
                #### Move the main output layer into the group layer ####
            if layerMain is not None:
                df = layerMain.getDefinition("V2")
                updateCIMDefinitionPopupinfo(df, "{{{0}}}", outputFC)
                layerMain.setDefinition(df)
    except:
        pass

def IsSQLOutput(lyr, sourceBase, sourceLayer):
    """ Compare the sourceBase and sourceLayer to determine if the lyr is a SQL output
    INPUT: lyr {Layer}, sourceBase {str}, sourceLayer {str}
    RETURN: {Layer} or None
    """
    sourceBase = OS.path.normpath(sourceBase).upper()
    sourceLayer = OS.path.normpath(sourceLayer).upper()
    if ".SDE\\" in  sourceBase and  "=SDE" in  sourceLayer :
        ws, name = OS.path.split(sourceBase)
        if fr"DATASET={name}" in sourceLayer:
            return lyr

    keys = ["GPKG", "SQLITE","GEODATABASE"]
    keysSep = [",", ",",";"]
    for key, keySep in zip(keys, keysSep):

        if fr".{key}" in sourceBase and  fr".{key}{keySep}" in  sourceLayer :
            ws, name = OS.path.split(sourceBase)
            if "." in name:
                name = name.split(".")[1]

            if sourceLayer.endswith(name):
                return lyr
    return None


def getOutputSimulation(parameterWS, inputParameter):
    """Get the output location for the results of the Hot Spot Analysis.
    INPUT:
        parameterWS (object): parameter  workspace object
        inputParameter (object): input parameter object
    RETURN:
        strName (string): output location
        """
    
    idOutput = parameterWS.value
    timeStamps = getTimeStamps()
    strName = None
    if idOutput is not None:
        datasetBase = inputParameter.valueAsText
        layerMainName = OS.path.basename(datasetBase)
        isSHP = layerMainName.lower().endswith(".shp") or layerMainName.lower().endswith(".dbf")
        if isSHP:
            layerMainName = layerMainName.replace(".shp", "").replace(".dbf", "")
        idOutput = parameterWS.valueAsText
        path, name = OS.path.split(idOutput)
        if ".GDB" in parameterWS.valueAsText.upper():
            ##ARCPY.CreateFileGDB_management(path, name)
            strName = parameterWS.valueAsText +fr"/{layerMainName}"+"_{}_"+fr"{timeStamps}"
        elif ARCPY.Describe(path).dataType == "Folder":
            ##ARCPY.CreateFolder_management(path, name)
            strName = parameterWS.valueAsText +fr"/{layerMainName}"+"_{}_"+fr"{timeStamps}.shp"
        else:
            #### Problems were encountered while writing to the Workspace for Simulation Results.####
            ARCPY.AddIDMessage("ERROR",110569)
    return strName

