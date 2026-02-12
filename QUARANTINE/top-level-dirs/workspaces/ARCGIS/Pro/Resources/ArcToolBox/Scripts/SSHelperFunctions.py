# coding: utf-8
"""
Source Name:   SSHelperFunctions.py
Version:       ArcGIS 3.2
Author:        Environmental Systems Research Institute Inc.
Description:   Helper functions
"""
from sqlite3 import connect
import arcpy as  ARCPY
import arcpy.nax as  NAX
import os as OS
import sys as SYS
import SSDataObject as SSDO
import SSUtilities as UTILS
import WeightsUtilities as WU
import locale as LOCALE
import numpy as NUM
import datetime  as DT
import xml.etree.ElementTree as ET
import re as RE

defaultKappaWeights = {"FUZZY":[[-3, -3, 1.0], [-3, -2, 0.71], [-3, -1, 0.55], 
                                    [-2, -2, 1.0], [-2, -1, 0.78], [-1, -1, 1.0], [0, 0, 1.0]],
                       "EXACT_MATCH":[[-3, -3, 1.0], [-2, -2, 1.0], [-1, -1, 1.0], [0, 0, 1.0]],
                       "ABOVE_90":[[-3, -3, 1.0], [-3, -2, 1.0], [-3, -1, 1.0], 
                                   [-2, -2, 1.0], [-2, -1, 1.0], [-1, -1, 1.0], [0, 0, 1.0]],
                       "ABOVE_95":[[-3, -3, 1.0], [-3, -2, 1.0], [-2, -2, 1.0], [-1, -1, 1.0],
                                   [-1, 0, 1.0], [-1, 1, 1.0], [0, 0, 1.0]],
                       "ABOVE_99":[[-3, -3, 1.0], [-2, -2, 1.0], [-1, -1, 1.0], [-2, -1, 1.0],
                                   [-2, 0, 1.0], [-1, 0, 1.0], [-2, 1, 1.0], [-1, 1, 1.0],
                                   [-2, 2, 1.0], [-1, 2, 1.0], [0, 0, 1.0]],
                       "REVERSE":[[-3, 3, 1.0], [-3, 2, 0.71], [-3, 1, 0.55], 
                                  [-2, 2, 1.0], [-2, 1, 0.78], [-1, 1, 1.0], [0, 0, 1.0]]
}

swapType = {'POLYGON_CONTIGUITY_(FIRST_ORDER)': "CONTIGUITY_EDGES_ONLY",
            'MANHATTAN_DISTANCE' : "MANHATTAN_DISTANCE",
            'EUCLIDEAN_DISTANCE' : "EUCLIDEAN_DISTANCE",
            'MANHATTAN' : "MANHATTAN_DISTANCE",
            'EUCLIDEAN' :  "EUCLIDEAN_DISTANCE"
            }

supportDist = ["Feet", "Meters", "Kilometers", "Miles", "FeetInt", "MilesInt"]
upperSupportDist = ["FEET", "METERS", "KILOMETERS", "MILES", "FEETINT", "MILESINT"]

supportTime = ["Seconds", "Minutes", "Hours", "Days", "Weeks",
               "Months", "Years"]
supportNetTime = supportTime[0:4]

convertFamilyType = {'CONTINUOUS': 'GAUSSIAN',
                     'BINARY': 'LOGIT',
                     'COUNT': 'POISSON'}

naDistUnitMap = {"FEET": 3, "FOOT": 3, "US_FEET": 3, "US_FOOT": 3, "FOOT_US": 3, 
                 "METERS": 9, "METER": 9, "KILOMETER": 10, "KILOMETERS": 10, 
                 "MILE": 5, "MILES": 5, "US_MILES": 5, "US_MILE": 5, "MILE_US": 5,
                 "FEETINT": 3, "MILESINT": 5
                 }

distanceTypes = list(naDistUnitMap.keys())
timeTypes = ["SECONDS", "MINUTES", "HOURS", "DAYS", "MONTHS", "YEARS"]

fullLayerPath = OS.path.join(ARCPY.GetInstallInfo()["InstallDir"], 
                             "Resources", "ArcToolbox", "Templates", "Layers")

noSupportSAFormats = ['Image Service', "Cache/LERC2D", "AFR"]

imageServerStr =["https://", "ImageServer"]

#### New Field Type Support ####
newFieldTypeFlags = ["SupportsBigObjectID", "SupportsBigInteger", 
                     "SupportsTimeOnly", "SupportsDateOnly", "SupportsTimestampOffset"]

newFieldTypeFlagsUpper = ["SUPPORTSBIGOBJECTID", "SUPPORTSBIGINTEGER", 
                          "SUPPORTSTIMEONLY", "SUPPORTSDATEONLY", "SUPPORTSTIMESTAMPOFFSET"]

newFieldTypes = ['OID64', 'BIGINTEGER', 'TIMEONLY', 'DATEONLY', 'TIMESTAMPOFFSET']

#### Map New Field Types to Describe/Workspace Flags ####
newFieldTypeToFlag = {}
for ind, newType in enumerate(newFieldTypes):
    newFieldTypeToFlag[newType] = newFieldTypeFlagsUpper[ind]

def newFieldObjectToAppend(fcFieldObject, appendName):
    newField = ARCPY.Field()
    newField.name = appendName
    newField.type = fcFieldObject.type
    newField.aliases = fcFieldObject.alias

    return newField

def outputParamHasExtension(outputParam, extension = ".shp"):
    lowerExt = extension.lower()
    return outputParam.valueAsText.lower().endswith(lowerExt)

def getDistanceParameterFieldInfo(distanceParameter, outPath, isMatching = False):
    distanceFieldNames = []
    distanceFieldAliases = []
    if isMatching:
        fcList = []
        for vtRow in distanceParameter.value:
            distanceFC = vtRow[0]
            if str(distanceFC) not in ["#", '']:
                fcList.append(distanceFC)
        #fcList = [f[0] for f in UTILS.getTextParameterMatchSingle(distanceParameter, ["MappingLayerObject","mp.Layer"])]
    else:
        fcList = distanceParameter.valueAsText.split(";")

    for fc in fcList:
        try:
            dPath, dName = OS.path.split(fc)
        except:
            dName = fc

        distanceFieldNames.append(dName)
        distanceFieldAliases.append(ARCPY.ValidateFieldName(dName, outPath))

    distanceFieldTypes = ["DOUBLE"] * len(distanceFieldNames)

    return distanceFieldNames, distanceFieldTypes, distanceFieldAliases

def createAppendFieldNamesUsingDescribe(descWS, fieldNames, outPath, candidateFieldNames = None, explicitMaxLength = None):
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
    if isinstance(candidateFieldNames, list):
        if len(candidateFieldNames):
            if isinstance(candidateFieldNames[0], SSDO.CandidateField):
                upperAppendNames = [ i.name.upper() for i in candidateFieldNames ]
            else:
                upperAppendNames = [ i.upper() for i in candidateFieldNames ]

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

class UI_SSDataObject(object):
    """Update Parameter/Messages SSDataObject Wrapper Class."""

    def __init__(self, inputParameter, outputParameter, fieldNames = [], checkOID64 = True, 
                 addSourceID = True, weightsParameter = None,
                 distanceParameterInfo = None,
                 outputFieldNames = [], outputFieldTypes = [], outputFieldAliases = [],
                 outputFieldLengths = [], addFieldAlias2Alias = {}):
        UTILS.assignClassAttr(self, locals())
        self.renderType = {'POINT': 0, 'MULTIPOINT': 0, 'POLYLINE': 1, 'LINE': 1, 'POLYGON': 2}
        self.appendFields = []
        self.badFieldNames = []
        self.goodFieldNames = []
        self.outputFields = []
        self.masterFieldUpperName = None
        self.newFieldTypeCheckerMain()

    def newFieldTypeCheckerMain(self):
        """Checks Output Workspace for Whether it can Handle Downstream Output field types."""

        #### Common Call to Create Base info (Including Core SSDO) ####
        self.baseCreated = self.createBaseInfo()
        if not self.baseCreated:
            #### Input/Weights Does Not Exist, Output Workspace Could Not be Described ####
            return

        #### Check OID ####
        self.checkOID()

        if self.weightsParameter is not None:
            #### Use Weights File Method ####
            self.createFieldsWeights()
        else:
            self.createFieldsSource()

    def createBaseInfo(self):
        self.outputValueAsText = self.outputParameter.valueAsText.lower()
        self.inputValueAsText = self.inputParameter.valueAsText.lower()
        self.outDescribe = None
        self.ssdo = None
        self.weightsFile = None
        self.isInMemory = False
        self.goodOID = True

        if ARCPY.Exists(self.inputParameter.value):

            #### Check Output Path ####
            self.outPath, self.outName = OS.path.split(self.outputValueAsText)
            try:
                self.outDescribe = ARCPY.Describe(self.outPath)
            except:
                #### Output Dir/FGDB Does Not Exist ####
                self.outputParameter.setIDMessage("ERROR", 436, self.outPath)
                return False

            #### Quick Boolean for Output Workspaces That Accept All New Field Types ####
            self.isInMemory = self.outputValueAsText.startswith("in_memory") or self.outputValueAsText.startswith("memory")

            #### Create Working SSDO ####
            self.ssdo = SSDO.SSDataObject(self.inputValueAsText, templateFC = self.outputValueAsText, silentWarnings = True,
                                          displayProjectionWarning = False, silentErrors = True)

            #### Check Weights ####
            if self.weightsParameter is not None:
                self.weightsFile = self.weightsParameter.valueAsText

                if not ARCPY.Exists(self.weightsFile):
                    self.weightsParameter.setIDMessage("ERROR", 732, self.weightsParameter.displayName, self.weightsFile)
                    return False
                else:
                    if ARCPY.Describe(self.weightsFile).dataType.upper() != "FILE":
                        #### If Dir The System Will Add .swm and likely throw Error 732 ####
                        return False
            return True

        else:
            return False

    def checkOID(self):
        """Check OID64."""

        if self.checkOID64:
            if self.ssdo.hasOID64:
                oid64Bool = getattr(self.outDescribe, "SupportsBigObjectID", False)
                if not oid64Bool:
                    self.badFieldNames.append(self.ssdo.oidName)
                    self.goodOID = False

    def getWeightsMasterFieldInfo(self):
        """Check Master Field."""

        weightSuffix = self.weightsFile.split(".")[-1].lower()
        swmFileBool = (weightSuffix == "swm")
        masterFieldUpper = None
        hasID64 = False

        #### Can Not Validate Inline Variables ####
        if "%" in self.weightsFile:
            return True

        if swmFileBool:
            #### SWM ####
            swm = WU.SWMReader(self.weightsFile, silentWarnings=True)
            if swm.invalid:
                self.weightsParameter.setIDMessage("ERROR", 110288)
                return False

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
                #### Master Field Not in Input ####
                self.weightsParameter.setIDMessage("ERROR", 949, self.masterFieldUpperName, self.weightsFile)
                return False
            else:
                #### Check Master Field Comptibility ####
                isBigInteger = masterFCField.type.upper() == "BIGINTEGER"

                #### Assure Master Field Int Compatibility ####
                compatible = True
                if hasID64 and not isBigInteger:
                    compatible = False
                if not hasID64 and isBigInteger:
                    compatible = False

                if not compatible:
                    self.weightsParameter.setIDMessage("ERROR", 110516, uniqueIDType, masterFCField.type)
                    return False
                    #### Optional Alias ####
        else:
            #### No Master Field, Fail Out ####
            self.weightsParameter.setIDMessage("ERROR", 110288)
            return False

        return True

    def createFieldsSource(self):
        appendFieldNames = []
        appendFieldTypes = []
        appendFieldAlias = []

        #### Add Source ID ####
        if self.addSourceID:
            if self.goodOID:
                appendFieldNames.append("SOURCE_ID")
                if self.ssdo.hasOID64:
                    appendFieldTypes.append("BIGINTEGER")
                else:
                    appendFieldTypes.append("LONG")
                appendFieldAlias.append(ARCPY.GetIDMessage(220125))

        #### Check/Add Fields ####
        if self.fieldNames == "*":
            self.fieldNames  = [i for i in self.ssdo.allFields.keys()]

        #### Create/Check Append Field Info ####
        usedFields = set([])
        for fieldName in self.fieldNames:
            upperName = fieldName.upper()
            if upperName not in usedFields and upperName in self.ssdo.allFields:
                field = self.ssdo.allFields[upperName]
                newFieldBool = True
                if not self.isInMemory:
                    #### Check Output Fields Based on Workspace/Type ####
                    upperType = field.type.upper()
                    if upperType in newFieldTypes[1:]:
                        newFlag = newFieldTypeToFlag[upperType]
                        newFieldBool = getattr(self.outDescribe, newFlag, False)

                if not newFieldBool:
                    #### Don't Add To Schema, Log for Error ####
                    self.badFieldNames.append(fieldName)
                else:
                    #### Add Qualified/Unqualifed Field Name to Candidate Append Fields ####
                    returnName = UTILS.returnOutputFieldName(field)
                    appendFieldNames.append(returnName)
                    appendFieldTypes.append(field.type)
                    appendFieldAlias.append(field.alias)

                #### Make Sure Unique ####
                usedFields.add(upperName)

        #### Add Distance Features ####
        if self.distanceParameterInfo is not None:
            distanceParameter, isMatching = self.distanceParameterInfo
            distFieldNames, distFieldTypes, distAliases = getDistanceParameterFieldInfo(distanceParameter,
                                                                                        self.outPath, 
                                                                                        isMatching = isMatching)
            #### Fully Validated Append Field Names ####
            appendDistNames = createAppendFieldNamesUsingDescribe(self.outDescribe, distFieldNames,
                                                                   self.outPath, self.outputFieldNames)
            self.outputFieldNames = appendDistNames + self.outputFieldNames 
            self.outputFieldTypes = distFieldTypes + self.outputFieldTypes
            self.outputFieldAliases = distAliases + self.outputFieldAliases

        #### Fully Validated Append Field Names ####
        appendFieldNames = createAppendFieldNamesUsingDescribe(self.outDescribe, appendFieldNames,
                                                               self.outPath, self.outputFieldNames)

        #### Create/Validate Append Fields ####
        for ind, appendFieldName in enumerate(appendFieldNames):
            newField = ARCPY.Field()
            newField.name = appendFieldName
            newField.type = appendFieldTypes[ind]
            newField.aliasName = appendFieldAlias[ind]
            self.appendFields.append(newField)

        if len(self.badFieldNames):
            badString = ", ".join(self.badFieldNames)
            self.outputParameter.setIDMessage("ERROR", 110517, badString)
            return

        else:
            #### Add Additional Output Fields and Then Set Schema ####
            numNewFields = len(self.outputFieldNames)
            if numNewFields:
                c = 0
                for ind, fieldName in enumerate(self.outputFieldNames):
                    newField = ARCPY.Field()
                    newField.name = fieldName
                    newField.type = self.outputFieldTypes[ind]

                    #### Optional Alias ####
                    try:
                        alias = self.outputFieldAliases[ind]
                        if fieldName in self.addFieldAlias2Alias:
                            #### Optional Format of Input Field Alias Into Output Alias ####
                            connectField = self.addFieldAlias2Alias[fieldName]
                            if connectField in self.ssdo.allFields:
                                alias = alias.format(self.ssdo.allFields[connectField].alias)
                        newField.aliasName = alias
                    except:
                        pass

                    #### Optional Length for TEXT ####
                    if self.outputFieldTypes[ind].upper() == "TEXT":
                        try:
                            newField.length = self.outputFieldLengths[c]
                        except:
                            pass
                        c += 1

                    self.outputFields.append(newField)

            allOutputFields = self.appendFields + self.outputFields
            self.outputParameter.schema.additionalFields = allOutputFields

    def createFieldsWeights(self):

        #### Read SWM/GWT/GAL Weights ####
        masterSuccess = self.getWeightsMasterFieldInfo()

        if not masterSuccess:
            #### Use Errors Returned From Previous Function ####
            return 

        appendFieldNames = []
        appendFieldTypes = []
        appendFieldAlias = []

        #### Use Master Field (SWM/GWT.. Not GAL) ####
        if self.masterFieldUpperName is not None:        
            self.fieldNames = [self.masterFieldUpperName] + self.fieldNames

        #### Create/Check Append Field Info ####
        usedFields = set([])
        for fieldName in self.fieldNames:
            upperName = fieldName.upper()
            if upperName not in usedFields and upperName in self.ssdo.allFields:
                field = self.ssdo.allFields[upperName]
                newFieldBool = True
                if not self.isInMemory:
                    #### Check Output Fields Based on Workspace/Type ####
                    upperType = field.type.upper()
                    if upperType in newFieldTypes[1:]:
                        newFlag = newFieldTypeToFlag[upperType]
                        newFieldBool = getattr(self.outDescribe, newFlag, False)

                if not newFieldBool:
                    #### Don't Add To Schema, Log for Error ####
                    self.badFieldNames.append(fieldName)
                else:
                    #### Add Qualified/Unqualifed Field Name to Candidate Append Fields ####
                    returnName = UTILS.returnOutputFieldName(field)
                    appendFieldNames.append(returnName)
                    appendFieldTypes.append(field.type)
                    appendFieldAlias.append(field.alias)

                #### Make Sure Unique ####
                usedFields.add(upperName)

        #### Add Distance Features ####
        if self.distanceParameterInfo is not None:
            distanceParameter, isMatching = self.distanceParameterInfo
            distFieldNames, distFieldTypes, distAliases = getDistanceParameterFieldInfo(distanceParameter,
                                                                                        self.outPath, 
                                                                                        isMatching = isMatching)
            self.outputFieldNames = distFieldNames + self.outputFieldNames 
            self.outputFieldTypes = distFieldTypes + self.outputFieldTypes
            self.outputFieldAliases = distAliases + self.outputFieldAliases

        #### Fully Validated Append Field Names ####
        appendFieldNames = createAppendFieldNamesUsingDescribe(self.outDescribe, appendFieldNames,
                                                               self.outPath, self.outputFieldNames)

        #### Create/Validate Append Fields ####
        for ind, appendFieldName in enumerate(appendFieldNames):
            newField = ARCPY.Field()
            newField.name = appendFieldName
            newField.type = appendFieldTypes[ind]
            newField.aliasName = appendFieldAlias[ind]
            self.appendFields.append(newField)


        if len(self.badFieldNames):
            badString = ", ".join(self.badFieldNames)
            self.outputParameter.setIDMessage("ERROR", 110517, badString)
            return

        else:
            #### Add Additional Output Fields and Then Set Schema ####
            numNewFields = len(self.outputFieldNames)
            if numNewFields:
                c = 0
                for ind, fieldName in enumerate(self.outputFieldNames):
                    newField = ARCPY.Field()
                    newField.name = fieldName
                    newField.type = self.outputFieldTypes[ind]

                    #### Optional Alias ####
                    try:
                        newField.aliasName = self.outputFieldAliases[ind]
                    except:
                        pass
                    self.outputFields.append(newField)

                    #### Optional Length for TEXT ####
                    if self.outputFieldTypes[ind].upper() == "TEXT":
                        try:
                            newField.length = self.outputFieldLengths[c]
                        except:
                            pass
                        c += 1

            allOutputFields = self.appendFields + self.outputFields
            self.outputParameter.schema.additionalFields = allOutputFields

    def addSymbology(self, pointLayer = None, lineLayer = None, polygonLayer = None):
        if self.ssdo is not None:
            renderType = self.renderType[self.ssdo.shapeType.upper()]
            if renderType == 0 and pointLayer is not None:
                self.outputParameter.symbology = OS.path.join(fullLayerPath, pointLayer)
            if renderType == 1 and lineLayer is not None:
                self.outputParameter.symbology = OS.path.join(fullLayerPath, lineLayer)
            if renderType == 2 and polygonLayer is not None:
                self.outputParameter.symbology = OS.path.join(fullLayerPath, polygonLayer)

def checkWeightsHeaderUI(inputParameter, weightsParameter):
    """Checks whether the masterField of a given spatial weights file 
        is in the given input feature class.
    """

    if ARCPY.Exists(inputParameter.value):
        #### Get Parameters as Text ####
        weightsFile = weightsParameter.valueAsText
        inputValueAsText = inputParameter.valueAsText

        #### Assess Type of Weights ####
        weightSuffix = weightsFile.split(".")[-1].lower()
        swmFileBool = (weightSuffix == "swm")

        #### Create SSDO ####
        ssdo = SSDO.SSDataObject(inputValueAsText, silentWarnings = True, 
                                 displayProjectionWarning = False, silentErrors = True)

        weightSuffix = weightsFile.split(".")[-1].lower()
        swmFileBool = (weightSuffix == "swm")
        masterFieldUpper = None
        hasID64 = False
        if swmFileBool:
            #### SWM ####
            swm = WU.SWMReader(weightsFile, silentWarnings=True)
            if swm.invalid:
                weightsParameter.setIDMessage("ERROR", 110288)
                return None

            masterFieldUpperName = swm.masterField.upper()
            hasID64 = swm.hasID64
            swm.fo.close()

        else:
            #### Text Weights ####
            fo, info = WU.textWeightsHeader(weightsFile)
            isGAL = weightSuffix == "gal"
            if isGAL:
                masterFieldInd = -2
            else:
                masterFieldInd = -1

            headerInfo = info.split()
            fo.close()
            if len(headerInfo) > 1 or (not isGAL):
                masterFieldUpperName = headerInfo[masterFieldInd].upper()

        if hasID64:
            uniqueIDType = "BigInteger"
        else:
            uniqueIDType = "Long"

        if masterFieldUpperName is not None:
            #### Master Field From Weights File Read, Check Inside Input and Type ####
            masterFCField = None
            badMaster = True
            if ssdo.hasJoin:
                for fcName, fcField in ssdo.allFields.items():
                    if fcField.baseName.upper() == masterFieldUpperName:
                        masterFCField = fcField
                        badMaster = False
                        break
            else:
                if masterFieldUpperName in ssdo.allFields:
                    masterFCField = ssdo.allFields[masterFieldUpperName]
                    badMaster = False

            if badMaster:
                #### Master Field Not in Input ####
                weightsParameter.setIDMessage("ERROR", 949, masterFieldUpperName, weightsFile)
                return None
            else:
                #### Check Master Field Comptibility ####
                isBigInteger = masterFCField.type.upper() == "BIGINTEGER"

                #### Assure Master Field Int Compatibility ####
                compatible = True
                if hasID64 and not isBigInteger:
                    compatible = False
                if not hasID64 and isBigInteger:
                    compatible = False

                if not compatible:
                    weightsParameter.setIDMessage("ERROR", 110516, uniqueIDType, masterFCField.type)
                    return None
        else:
            #### No Master Field, Fail Out ####
            weightsParameter.setIDMessage("ERROR", 110288)
            return None

        return ssdo

    else:
        return None

def isImageService(rasterParam):
    noSupport  = False

    info = rasterParam.values
    try:
        if info is not None and len(info) > 0 :
            for rOpt in info:
                e = rOpt[0]
                if isinstance(e, str):
                    desc = ARCPY.Describe(e)
                    if desc.format  in noSupportSAFormats:
                        noSupport = True
                    del desc
                elif all([v in str(e) for v in imageServerStr]):
                    noSupport = True
                else:
                    if hasattr(e, 'name'):
                        val = e.name
                    else:
                        val = e
                    desc = ARCPY.Describe(val)
                    if desc.format  in noSupportSAFormats:
                        noSupport = True
                    del desc
    except:
        pass
    return noSupport

def pv(value, id = None):
    """ Debug function to print value in an external file 
    INPUT:
        value (object): value
        id (str): identifier of 
    """
    from time import gmtime, strftime
    f = open(r"c:\temp\tem.txt", "a",encoding="utf-8")
    id = str(id)
    try:
        print (strftime("%Y-%m-%d %H:%M:%S", gmtime()),value, id, file = f)
    except Exception as e:
        print (strftime("%Y-%m-%d %H:%M:%S", gmtime()),e, id, file = f)
        pass
    f.close()

def returnRasterPath(rasterParam):
    #### Add "tif" to Rasters in Folders ####
    path = rasterParam.valueAsText
    lowerName = path.lower()
    in_mem = path.startswith("in_memory") or path.startswith("memory")
    if not UTILS.isGDB(path) and not in_mem and not UTILS.isSDEOrGeodatabase(path):
        outPath, outName = OS.path.split(path)
        if "." not in outName:
            path += ".tif"

    return path

def returnTablePath(tableParam):
    #### Add "tif" to Rasters in Folders ####
    path = tableParam.valueAsText
    lowerName = path.lower()
    in_mem = path.startswith("in_memory") or path.startswith("memory")
    if not UTILS.isGDB(path) and not in_mem and not UTILS.isSDEOrGeodatabase(path):
        outPath, outName = OS.path.split(path)
        if "." not in outName:
            path += ".dbf"

    return path

def setOptionalAppendDerivedParam(inputParam, derivedParam):
    """Work around function for path delete when append button is
    unchecked."""

    if inputParam.valueAsText not in ["", "#", None]:
        derivedParam.enabled = True
        inPath = ""
        isShpDbf = False
        try:
            inPath, inName = OS.path.split(inputParam.valueAsText)
            isShpDbf = UTILS.isShapeFileOrDBF(inputParam.value)
        except:
            pass
        if inPath not in ["", None] or isShpDbf:
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
         if not UTILS.isGDB(outValue) and \
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
            parameters[indexOuput].value= OS.path.join(current,"{0}_{1}".format(name,toolName))

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

def createField(name, outPath, type=None, aliasName = None):
    """ Method for conveniently creating Field Object
    :param name:
    :param type:
    :return:
    """
    newField = ARCPY.Field()
    newField.name = name
    if type:
        if type.upper() == "INTEGER":
            type = "Long"
        if type.upper() in ["FLOAT", "SINGLE"]:
            type = "Double"
        newField.type = type
    if aliasName:
        newField.aliasName = aliasName
    return newField

def makeDerivedRasterLayers(indVarNames, outputFC):
    outRasterLayers = []

    #### Get Output FC Prefix ####
    outPath, outName = OS.path.split(outputFC)
    outputPref, ext = OS.path.splitext(outName)

    #### Add Intercept ####
    interName = outputPref + "_" + "INTERCEPT"
    outRasterLayers.append(interName)

    #### Create Slope Rasters ####
    for varName in indVarNames:
        varNameOut = outputPref + "_" + varName
        outRasterLayers.append(varNameOut)

    return outRasterLayers

def baseDistanceMatchList(distanceFCs):
    pairs = []
    for fc in distanceFCs:
        pairs.append([fc,fc])

    return pairs

def matchVariables(inputVariables, describePred):
    predNames = [i.name for i in describePred.fields]
    pairs = []
    for indOut in inputVariables:
        predOut = ""
        if indOut in predNames:
            predOut = indOut
        pairs.append([predOut, indOut])

    return pairs

def returnTravelModes(param):
    try:
        return NAX.GetTravelModes(param.value.value)
    except:
        d = ARCPY.Describe(param.value)
        return NAX.GetTravelModes(d.catalogPath)

def getTravelModes(param, returnError = False):
    try:
        return NAX.GetTravelModes(param.value)
    except:
        if returnError:
            return "ERROR"
        else:
            return {}

def returnRenderLayerFile(numResults, renderFile):
    if numResults < 6:
        fileName, fileExt = OS.path.splitext(renderFile)
        fileName = fileName + "{0}"
        fileName = fileName.format(numResults)
        return fileName + fileExt
    else:
        return renderFile

def checkLicense():
    productInfo = ARCPY.ProductInfo()
    pro = productInfo in ["ArcInfo", "ArcServer"]
    return pro


def paramChanged(param, checkValue = False):
    changed = param.altered and not param.hasBeenValidated
    if checkValue:
        if param.value:
            return changed
        else:
            return False 
    else:
        return changed

def enableParameters(enable = [], disable= []):
    """ enable and disable list of parameters
    """
    for i in enable:
        if i is not None:
            i.enabled = True
    for j in disable:
        if j is not None:
            j.enabled = False

def cleanParameters(parameters, indices = []):
    """ clean and disable list of parameters
    """
    for i in indices:
        parameters[i].value = None

def enableParametersBy(parameters, enable = [], disable= []):
    """ enable and disable list of parameters
    """
    for i in enable:
        parameters[i].enabled = True
    for j in disable:
        parameters[j].enabled = False

def enableParametersByVariable(enable = [], disable= [], clear = True):
    """ enable and disable list of parameters
    """
    for i in enable:
        i.enabled = True
    for j in disable:
        j.enabled = False
        if clear:
            j.value = None

def clearParameter(parameter):
    parameter.enabled = False
    parameter.value = None

def allowBandInVT(parameter, checkRequired = False):
    #### Remove error and check emptiness of a value in the matching raster parameter ####
    vtM = parameter.value
    containBands = False
    if vtM is not None:
        for e in parameter.values:

            if hasattr(e[0], "value"):
                v = str(e[0].value)
            else:
                v = str(e[0])            

            if v not in ["#", '', None]:
                cntNG = None
                for intP in ["\\Band_","/Band_"]: 
                    if intP in v: 
                        try:
                            int(v.split(intP)[-1])
                            if ARCPY.Exists(v):
                                containBands = True
                            else:
                                cntNG = v
                        except:
                            cntNG = v
                            pass
                if cntNG is not None:
                    parameter.setIDMessage("Error", 732, parameter.displayName,cntNG)
            else:
                if checkRequired:
                     parameter.setIDMessage("Error", 530)
                     return
        if containBands and cntNG is None:
            if  parameter.hasError():
                if "732" in str(parameter.message):
                    parameter.clearMessage()

def checkRepeated(values, colId, initial = None):
    """
    Check Repeat elements in a parameter
    """
    try:

        if values:
            if "VALUE TABLE" in str(type(values)).upper() or \
                "VALUETABLE" in str(type(values)).upper() :
                cols = values.columnCount
                rows = values.rowCount
                val = []
                for r in range(rows):
                    val.append(values.getRow(r))
                values = val

            listElem = []
            for ele in values:
                if type(ele) == str:
                    listElem.append(ele)
                elif type(ele) == list:
                    if type(ele[colId]) == str:
                        listElem.append(ele[colId])
                    else:
                        if "MappingLayerObject" in str(type(ele[colId])):
                            listElem.append(ele[colId].name)
                        else:
                            listElem.append(ele[colId].value)
                else:
                    listElem.append(ele[colId].value)

            repeatedInitial = False
            if initial is not None:
                repeatedInitial = listElem.count(str(initial))>=1
                if repeatedInitial:
                    return None, str(initial)

            for ele in listElem:
                if listElem.count(ele)>1:
                    return ele, initial if repeatedInitial else None

            return None, initial if repeatedInitial else None
    except:
        pass

    return None, None

def isThree():
    """Returns boolean indicating whether Python 3."""
    return SYS.version_info.major == 3

def isAdvancedOrPlus():
    # The Enable Attachments functions require Standard+ license
    try:
        license_available = ["Available", "AlreadyInitialized"]
        if ARCPY.GetInstallInfo()['ProductName'] == 'Server':
            return True
        if ARCPY.GetInstallInfo()['ProductName'] == 'ArcGISPro':
            if ARCPY.CheckProduct("ArcInfo") in license_available or ARCPY.CheckProduct(
                    "ArcEditor") in license_available:
                return True
            else:
                raise Exception
    except Exception:
        return False
    return True

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

def setEnvSpatialReference(inputSpatialRef):
    """Returns a spatial reference object of Env Setting if exists.

    INPUTS:
    inputSpatialRef (obj): input spatial reference object

    OUTPUT:
    spatialRef (class): spatial reference object
    """

    envSetting = ARCPY.gp.env_outputCoordinateSystem
    if envSetting is not None:
        #### Set to Environment Setting ####
        spatialRef = envSetting
    else:
        spatialRef = inputSpatialRef

    return spatialRef

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

    if outputFC == None or outputFC == "":
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

def getLinearUnitFloat(paramValue):
    value, unit = str(paramValue).split()
    return LOCALE.atof(value) 

def getTemporalUnit(paramValue):
    return int(getLinearUnitFloat(paramValue))

def tableCheck(parameter, checkSDE = False):
    """ Check and update the Table Extension (dbf)
    INPUT:
        parameter (Parameter Object): Parameter Output Table
    """
    if parameter.altered:
        if parameter.value is None:
            return

        valueTemp = str(parameter.value)

        #### Get Output Table Name With Extension if Appropriate ####
        if valueTemp.upper().startswith("IN_MEMORY") or valueTemp.upper().startswith("MEMORY"):

            if ".DBF" in valueTemp.upper():
                valueTemp = valueTemp.upper().replace(".DBF", "").lower()
                parameter.value  = valueTemp
            return
 

        if not UTILS.isGDB(valueTemp, checkSDE):

            if ".DBF" not in valueTemp.upper():
                valueTemp= valueTemp + ".dbf"
        else:

            if ".DBF" in valueTemp.upper():
               valueTemp = valueTemp.replace(".dbf", "").replace(".DBF", "")

        parameter.value  = valueTemp

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
        if parameters[defaultInd].value is None and parameters[defaultInd].enabled:
            parameters[defaultInd].value = defaultValue


def extract_tool_info(xml_data):
    """ Extracts the latest tool name, date, time, input feature class, analysis variables, and command info from the given XML data."""

    supported_tools = {
        'HotSpots': ['Input_Feature_Class', 'Input_Field', 'Output_Feature_Class', 'Conceptualization_of_Spatial_Relationships', 'Distance_Method', 'Standardization'],
        'GeneralizedLinearRegression': ['in_features', 'dependent_variable', 'model_type', 'output_features', 'explanatory_variables'],
        'ClustersOutliers': ['Input_Feature_Class', 'Input_Field'],
        'SpatialAutocorrelation': ['Input_Feature_Class', 'Input_Field'],
        'OptimizedHotSpotAnalysis':['Input_Feature_Class', 'Output_Feature_Class', 'Analysis_Field', 'Incident_Data_Aggregation_Method'],
        'OptimizedOutlierAnalysis': ['Input_Feature_Class', 'Input_Field']
    }
    
    latest_tool_name = None
    latest_datetime = DT.datetime.min
    latest_FC = ""
    latest_analysis_vars = []
    latest_full_datetime = ""
    cmd_info = ""
    for data in xml_data:
        root = ET.fromstring(data)
        tool_name = root.text.split()[0]  # Assuming the tool name is the first word
        if tool_name in supported_tools:
            date = root.attrib['Date']
            time = root.attrib['Time']
            full_datetime = DT.datetime.strptime(date + time, "%Y%m%d%H%M%S")
            if full_datetime > latest_datetime:
                latest_datetime = full_datetime
                latest_tool_name = tool_name
                cmd_parts = RE.findall(r'\"[^\"]*\"|\S+', root.text)

                # Extract the analysis variables based on the tool
                if tool_name in  ['HotSpots', 'ClustersOutliers', 'SpatialAutocorrelation', 'OptimizedOutlierAnalysis', 'OptimizedHotSpotAnalysis']:
                    latest_FC = cmd_parts[1].strip('"')
                    cmd_info = cmd_parts
                    input_field_index = 2  # Based on the given signature
                    latest_analysis_vars = [cmd_parts[input_field_index].strip('"')]

                # Adjusting for GeneralizedLinearRegression
                if tool_name == 'GeneralizedLinearRegression':
                    latest_FC = cmd_parts[1].strip('"')

                    ### Avoid to use GeoAnalytics GeneralizedLinearRegression ####
                    if len(cmd_parts) == 11:
                        latest_analysis_vars = None
                        cmd_info = None
                        continue

                    dependent_variable_index = 2  # Based on your description
                    explanatory_variables_index = 5  # This is the starting index of the explanatory variables
                    latest_analysis_vars = [
                        cmd_parts[dependent_variable_index].strip('"'),  # Dependent variable
                        cmd_parts[explanatory_variables_index].strip('#').strip('"')  # List of explanatory variables
                    ]
                    cmd_info = cmd_parts
                    # Handling multiple explanatory variables separated by semicolons
                    if ';' in latest_analysis_vars[1]:
                        latest_analysis_vars[1] = latest_analysis_vars[1].split(';')
                    else:
                        latest_analysis_vars[1] = [latest_analysis_vars[1]]  # Make sure it's always a list

                    latest_analysis_vars[1] = [ item for item in latest_analysis_vars[1] if item != '']

                latest_full_datetime = full_datetime.strftime("%A, %B %d, %Y %H:%M:%S")

    return latest_tool_name, latest_full_datetime, latest_FC, latest_analysis_vars, cmd_info

def XMLFromString(value):
    return ET.fromstring(value)

def XMLToString(value, encoding = "utf-8"):
    return ET.tostring(value, encoding)

def addSchemaUncertaintyTool(tool_name, parameters, cmd = None):
    idResult = 0
    idOutput = 1
    idSimTable = 2
    idInput = 3
    idType = 4
    idMOE = 5
    idConf = 6
    idPct = 7
    idSim = 8
    idSimMethod = 9
    idWS = 10
    idSimLimits = 11
    idMOEConf = 12
    idGL = 13
    fields = []

    if tool_name not in ['HotSpots', 'ClustersOutliers', 'SpatialAutocorrelation', 
                         'OptimizedOutlierAnalysis', 'OptimizedHotSpotAnalysis',
                         'GeneralizedLinearRegression']:
        return 

    if parameters[idInput].value is None:
        return

    desc = ARCPY.da.Describe(parameters[idInput].value)

    if parameters[idOutput].value is None:
        return

    pathOutput = OS.path.split(parameters[idOutput].valueAsText)[0]

    if desc["fields"] is None:
        return

    fieldsSource = {f.name.upper():f for f in desc["fields"]}

    fields= set()
    sensitivity = {}

    sensitivity['uncertainty_measure'] = parameters[idType].valueAsText
    sensitivity['moe_field'] = parameters[idMOE].valueAsText
    sensitivity['confidence_bound_field'] = parameters[idConf].valueAsText
    sensitivity['randomize_pct'] = parameters[idPct].valueAsText
    sensitivity['confidence_bound_field'] = parameters[idSimLimits].valueAsText

    simulatedFields = []
    if sensitivity['uncertainty_measure'] == "MOE":
        senFields = sensitivity['moe_field'].split(";")
        moeFields = []
        dictFlds = {}
        for f in senFields:
            parts = f.split(" ")
            moe = parts[1]
            if moe not in ['',' ', None, '#']:
                moeFields.append(moe.upper())
                dictFlds[parts[0].upper()] = moe.upper()
                simulatedFields.append(parts[0].upper())
            else:
                moeFields.append("")
        sensitivity["MOE"] = moeFields
        sensitivity["MOE_DICT"] = dictFlds

        for field in moeFields:
            if field != "":
                fields.add(field.upper())

    if sensitivity['uncertainty_measure'] == "CONFIDENCE_BOUNDS":
        senFields = sensitivity['confidence_bound_field'].split(";")
        lowerBounds = []
        upperBounds = []
        dictFlds = {}
        for i in range(len(senFields)):
            senFieldList = senFields[i].split(" ")
            lowBound = senFieldList[1] if senFieldList[1] not in [' ', None, '#'] else ''
            upBound = senFieldList[2] if senFieldList[2] not in [' ', None, '#'] else ''
            if lowBound == '' and upBound == '': 
                continue

            dictFlds[senFieldList[0].upper()] = (lowBound.upper(), upBound.upper()) 
            lowerBounds.append(lowBound)
            upperBounds.append(upBound)
            simulatedFields.append(senFieldList[0].upper())
        sensitivity["lowField"]= lowerBounds
        sensitivity["highField"]= upperBounds
        sensitivity["CONFIDENCE_BOUNDS_DICT"] = dictFlds

        for lowField, upField in zip(lowerBounds, upperBounds):
            if lowField != "":
                fields.add(lowField.upper())
            if upField != "":
                fields.add(upField.upper())

    if sensitivity['uncertainty_measure'] == "PERCENTAGE":
        senFields = sensitivity['randomize_pct'].split(";")
        percentBelow = [UTILS.strToFloat(f.split(" ")[1]) for f in senFields]
        percentAbove = [UTILS.strToFloat(f.split(" ")[2]) for f in senFields]
        sensitivity["percentageLow"] = percentBelow
        sensitivity["percentageHigh"] = percentAbove
        sensitivity["PERCENTAGE_DICT"] = {f.split(" ")[0].upper(): (UTILS.strToFloat(f.split(" ")[1]), 
                                                                    UTILS.strToFloat(f.split(" ")[2])) for f in senFields}
        simulatedFields = [f.split(" ")[0].upper() for f in senFields]

    varNameList = [fld for fld in fields]

    if  len(simulatedFields) == 0:
        return

    def addField(lstFlds, fieldName, fieldsDict, nFldName = None):
        fldName = fieldName
        if nFldName is not None:
            fldName = nFldName
        if fieldName.upper() in fieldsDict:
             lstFlds.append(SSDO.CandidateField(fldName,fieldsDict[fieldName.upper()].type, None, alias = fieldsDict[fieldName.upper()].aliasName))

    def addFieldNew(lstFlds, fieldName, type, alias):
        lstFlds.append(SSDO.CandidateField(fieldName,type, None, alias = alias))

    def addSchemaFromCandidateList(candidateFields, parameters, outputParameterIndex):
        lstFlds = []
        lCand = []

        if parameters[outputParameterIndex].valueAsText.upper().endswith(".SHP"):
            for i in range(len(candidateFields)):
                if candidateFields[i].name not in [f.name for f in  lCand]:
                    lCand.append(candidateFields[i])
                else:
                    n = 2
                    try:
                        n = int(candidateFields[i].name[-1])
                        n += 1
                    except:
                        pass
                    candidateFields[i].name = candidateFields[i].name[:-1]+str(n)
                    lCand.append(candidateFields[i])
        else:
            lCand = candidateFields

        #UTILS.dbg("************************************")
        for cFld in lCand:
            newField = ARCPY.Field()
            newField.name = cFld.name
            newField.type = cFld.type.upper()
            newField.aliasName = cFld.alias
            lstFlds.append(newField)
        #    UTILS.dbg(cFld.name, cFld.alias)
        parameters[outputParameterIndex].schema.additionalFields = lstFlds

    if tool_name in ["HotSpots", "OptimizedHotSpotAnalysis"]:
        colMessageShort = ARCPY.GetIDMessage(220903)
        hotMessageShort = ARCPY.GetIDMessage(220902)
        cvDomainShort = { -3: colMessageShort.format(99), 
                    -2: colMessageShort.format(95), 
                    -1: colMessageShort.format(90), 
                    0: ARCPY.GetIDMessage(84511), 
                    1: hotMessageShort.format(90), 
                    2: hotMessageShort.format(95), 
                    3: hotMessageShort.format(99)}

        varNameUpper = simulatedFields[0]
        varAlias = fieldsSource[varNameUpper].aliasName

        maxSim = SSDO.CandidateField("SimMax", "Double", None, alias = fr"{varAlias} ({ARCPY.GetIDMessage(220934)})")
        minSim = SSDO.CandidateField("SimMin", "Double", None, alias = fr"{varAlias} ({ARCPY.GetIDMessage(220936)})")
        C99 = SSDO.CandidateField("NumSimC99", "LONG", None, alias = ARCPY.GetIDMessage(220974).format(99))
        C95 = SSDO.CandidateField("NumSimC95", "LONG", None, alias = ARCPY.GetIDMessage(220974).format(95))
        C90 = SSDO.CandidateField("NumSimC90", "LONG", None, alias = ARCPY.GetIDMessage(220974).format(90))
        NS =  SSDO.CandidateField("NumSimNS", "LONG", None, alias =  ARCPY.GetIDMessage(220976))
        H90 = SSDO.CandidateField("NumSimH90", "LONG", None, alias = ARCPY.GetIDMessage(220975).format(90))
        H95 = SSDO.CandidateField("NumSimH95", "LONG", None, alias = ARCPY.GetIDMessage(220975).format(95))
        H99 = SSDO.CandidateField("NumSimH99", "LONG", None, alias = ARCPY.GetIDMessage(220975).format(99))
        predGiBin = SSDO.CandidateField("PredGiBin", "LONG",None, alias = ARCPY.GetIDMessage(220977))
        predCount = SSDO.CandidateField("PredCount", "LONG", None, alias = ARCPY.GetIDMessage(220978))
        percCount = SSDO.CandidateField("PredPcnt", "DOUBLE", None, alias = ARCPY.GetIDMessage(220979))
        gibinCatPred = SSDO.CandidateField("PredCat", "TEXT", None, alias = ARCPY.GetIDMessage(220980), cvDomain = cvDomainShort)
        gibinCat = SSDO.CandidateField("GIBIN_CAT", "TEXT" ,None, alias = ARCPY.GetIDMessage(220981), cvDomain = cvDomainShort)
        similarCount = SSDO.CandidateField("GIBIN_Count", "LONG", None, alias = ARCPY.GetIDMessage(220982))
        similarPerc = SSDO.CandidateField("GIBIN_Pcnt", "DOUBLE", None, alias = ARCPY.GetIDMessage(220983))
        gin_bin = SSDO.CandidateField("Gi_Bin", "LONG", None, alias = ARCPY.GetIDMessage(220984))
        candidateFields = []

        fieldOrder = ["SOURCE_ID", "GiZScore", "GiPValue", "NNeighbors"]
        fieldTypes = ["LONG", "DOUBLE","DOUBLE","LONG"]

        for id, fldName in enumerate(fieldOrder):
            addFieldNew(candidateFields, fldName, fieldTypes[id], fldName)

        nFldName = UTILS.getFieldNames([simulatedFields[0]], pathOutput)[0]
        addField(candidateFields, varNameUpper, fieldsSource, nFldName)


        if "MOE" in  sensitivity:
            nFldName = UTILS.getFieldNames([sensitivity["MOE"][0]], pathOutput)[0]
            addField(candidateFields, sensitivity["MOE"][0], fieldsSource, nFldName)
        if "lowField"  in sensitivity:
            nFldNames = UTILS.getFieldNames([sensitivity["lowField"][0],sensitivity["highField"][0]], 
                                            pathOutput)
            addField(candidateFields, sensitivity["lowField"][0], fieldsSource, nFldNames[0])
            addField(candidateFields, sensitivity["highField"][0], fieldsSource, nFldNames[1])

        candidateFields.extend([gin_bin,gibinCat, maxSim, minSim, C99, C95, C90, NS, H90, H95, H99, predGiBin, 
                                gibinCatPred, predCount, percCount, similarCount, similarPerc])

        addSchemaFromCandidateList(candidateFields, parameters, idOutput)

    if tool_name in ["ClustersOutliers", "OptimizedOutlierAnalysis"]:
        varNameUpper = simulatedFields[0]
        varAlias = fieldsSource[varNameUpper].aliasName
        maxSim = SSDO.CandidateField("SimMax", "Double", None, alias = fr"{varAlias} ({ARCPY.GetIDMessage(220934)})")
        minSim = SSDO.CandidateField("SimMin", "Double", None, alias = fr"{varAlias} ({ARCPY.GetIDMessage(220936)})")
        HH = SSDO.CandidateField("NumSimHH", "LONG", None, alias = ARCPY.GetIDMessage(220963).format(ARCPY.GetIDMessage(84661)))
        HL = SSDO.CandidateField("NumSimHL", "LONG", None, alias = ARCPY.GetIDMessage(220963).format(ARCPY.GetIDMessage(84659)))
        LH = SSDO.CandidateField("NumSimLH", "LONG", None, alias = ARCPY.GetIDMessage(220963).format(ARCPY.GetIDMessage(84660)))
        LL = SSDO.CandidateField("NumSimLL", "LONG", None, alias = ARCPY.GetIDMessage(220963).format(ARCPY.GetIDMessage(84662)))
        NS = SSDO.CandidateField("NumSimNS", "LONG", None, alias = ARCPY.GetIDMessage(220963).format(ARCPY.GetIDMessage(84663)))
        NN = SSDO.CandidateField("NumSimNN", "LONG", None, alias =  ARCPY.GetIDMessage(220963).format(ARCPY.GetIDMessage(220682)))
        COTypeCat =  SSDO.CandidateField("COTypeCat", "TEXT", None, alias = ARCPY.GetIDMessage(220966))
        predCOType = SSDO.CandidateField("PredCOType","TEXT", None, ARCPY.GetIDMessage(220967))
        predCount = SSDO.CandidateField("PredCount", "LONG", alias = ARCPY.GetIDMessage(220968))
        percCount = SSDO.CandidateField("PredPcnt", "DOUBLE", None, alias = ARCPY.GetIDMessage(220969))
        PredCat = SSDO.CandidateField("PredCat", "TEXT", None, ARCPY.GetIDMessage(220970))
        similarCount = SSDO.CandidateField("COType_Count", "LONG", None, alias = ARCPY.GetIDMessage(220971))
        similarPerc = SSDO.CandidateField("COType_Pcnt", "DOUBLE", None, alias =  ARCPY.GetIDMessage(220972))
        candidateFields = []

        liFieldNames = ["SOURCE_ID","LMiIndex", "LMiZScore", "LMiPValue", "ZTransform", "SpatialLag", "COType", "NNeighbors"]
        liFieldTypes = ["LONG","DOUBLE", "DOUBLE", "DOUBLE", "DOUBLE", "DOUBLE", "TEXT", "LONG"]

        for id, fldName in enumerate(liFieldNames):
            addFieldNew(candidateFields, fldName, liFieldTypes[id], fldName)

        nFldName = UTILS.getFieldNames([simulatedFields[0]], pathOutput)[0]
        addField(candidateFields, varNameUpper, fieldsSource, nFldName)

        if "MOE" in  sensitivity:
            nFldName = UTILS.getFieldNames([sensitivity["MOE"][0]], pathOutput)[0]
            addField(candidateFields, sensitivity["MOE"][0], fieldsSource, nFldName)
        if "lowField"  in sensitivity:
            nFldNames = UTILS.getFieldNames([sensitivity["lowField"][0],sensitivity["highField"][0]], 
                                           pathOutput)
            addField(candidateFields, sensitivity["lowField"][0], fieldsSource, nFldNames[0])
            addField(candidateFields, sensitivity["highField"][0], fieldsSource, nFldNames[1])

        candidateFields.extend([COTypeCat, maxSim, minSim, HH, HL, LH, LL, NS, NN, predCOType, PredCat, 
                                predCount, percCount, similarCount, similarPerc])
        addSchemaFromCandidateList(candidateFields, parameters, idOutput)
    
    if tool_name == "GeneralizedLinearRegression":

        if cmd is None:
            return
        modelTypes = {fr'"Continuous (Gaussian)"': 'CONTINUOUS',
                      fr'"Binary (Logistic)"': 'BINARY',
                      fr'"Count (Poisson)"': 'COUNT',
                      fr'"{ARCPY.GetIDMessage(220992)}"': 'CONTINUOUS',
                      fr'"{ARCPY.GetIDMessage(220993)}"': 'BINARY',
                      fr'"{ARCPY.GetIDMessage(220994)}"': 'COUNT',
                      fr'"CONTINUOUS"': 'CONTINUOUS',
                      fr'"BINARY"': 'BINARY',
                      fr'"COUNT"':'COUNT'
                      }

        dependent_variable = cmd[2]

        if cmd[3] not in modelTypes:
            return

        def ch(value):
            return None if value == "#" else value

        explanatory_variables= None if cmd[5] in ["#", "", None] else ch(cmd[5]).split(';')
        distance_features=ch(cmd[6])
        listDistanceNames = []

        variables = [dependent_variable]
        if explanatory_variables is not None:
            variables.extend(explanatory_variables)

        if distance_features is not None:
            try:
                lstPaths = distance_features.split(";")
                for path in lstPaths:
                    desc = ARCPY.da.Describe(path)
                    if desc["name"] is not None:
                        listDistanceNames.append(desc["name"])
            except:
                pass

        modelType = modelTypes[cmd[3]]
        simMinY = SSDO.CandidateField("SimMinY", "Double", None, 
                                      dependent_variable + " ({0})".format(ARCPY.GetIDMessage(220936)))
        simMaxY = SSDO.CandidateField("SimMaxY", "Double", None, 
                                      dependent_variable + " ({0})".format(ARCPY.GetIDMessage(220934)))
        simMedY = SSDO.CandidateField("SimMedY", "Double", None, 
                                      dependent_variable + " ({0})".format(ARCPY.GetIDMessage(220937)))
        raw = None
        residual = None
        stdResidual = None
        if modelType == "CONTINUOUS":
            simMinPrY = SSDO.CandidateField("SimMinPrY", "Double", None, 
                                        alias="{0} ({1}) ({2})".format(ARCPY.GetIDMessage(220950),dependent_variable, ARCPY.GetIDMessage(220936)))
            simMaxPrY = SSDO.CandidateField("SimMaxPrY", "Double", None, 
                                        alias="{0} ({1}) ({2})".format(ARCPY.GetIDMessage(220950),dependent_variable, ARCPY.GetIDMessage(220934)))
            simMedPrY = SSDO.CandidateField("SimMedPrY", "Double",None, 
                                        alias="{0} ({1}) ({2})".format(ARCPY.GetIDMessage(220950),dependent_variable, ARCPY.GetIDMessage(220937)))
            simMinRes = SSDO.CandidateField("SimMinRes", "Double",None, 
                                        alias="{0} - {1}".format(ARCPY.GetIDMessage(220911),ARCPY.GetIDMessage(220936)))
            simMaxRes = SSDO.CandidateField("SimMaxRes", "Double", None, 
                                        alias="{0} - {1}".format(ARCPY.GetIDMessage(220911),ARCPY.GetIDMessage(220934)))
            simMedRes = SSDO.CandidateField("SimMedRes", "Double",None, 
                                        alias="{0} - {1}".format(ARCPY.GetIDMessage(220911),ARCPY.GetIDMessage(220937)))
            simMinStd = SSDO.CandidateField("SimMinStd", "Double", None, 
                                        alias="{0} - {1}".format(ARCPY.GetIDMessage(220949),ARCPY.GetIDMessage(220936)))
            simMaxStd = SSDO.CandidateField("SimMaxStd", "Double", None, 
                                        alias="{0} - {1}".format(ARCPY.GetIDMessage(220949),ARCPY.GetIDMessage(220934)))
            simMedStd = SSDO.CandidateField("SimMedStd", "Double", None, 
                                        alias="{0} - {1}".format(ARCPY.GetIDMessage(220949),ARCPY.GetIDMessage(220937)))
            raw = SSDO.CandidateField("PREDICTED", "Double", None, alias="Predicted ({0})".format(dependent_variable))
            residual = SSDO.CandidateField("RESIDUAL", "DOUBLE", None,  alias = "Residual")
            stdResidual = SSDO.CandidateField("STDRESID", "DOUBLE", None,  alias = "Std Residual")

        elif modelType == "BINARY":
            simMinPr1 = SSDO.CandidateField("SimMinPr1", "Double",None, 
                                        alias=ARCPY.GetIDMessage(220947))
            simMaxPr1 = SSDO.CandidateField("SimMaxPr1", "Double", None, 
                                        alias=ARCPY.GetIDMessage(220946))
            simMedPr1 = SSDO.CandidateField("SimMedPr1", "Double", None, 
                                        alias=ARCPY.GetIDMessage(220945))
            simCt0 = SSDO.CandidateField("SimCt0", "LONG", None,
                                         alias=ARCPY.GetIDMessage(220944).format(0))
            simCt1 = SSDO.CandidateField("SimCt1", "LONG", None,
                                         alias=ARCPY.GetIDMessage(220944).format(0))
            simPcnt0 = SSDO.CandidateField("SimPcnt0", "Double", None,
                                         alias=ARCPY.GetIDMessage(220943).format(0))
            simPcnt1 = SSDO.CandidateField("SimPcnt1", "Double", None,
                                         alias=ARCPY.GetIDMessage(220943).format(1))
            simMinDR = SSDO.CandidateField("SimMinDR", "Double",None, 
                                        alias=ARCPY.GetIDMessage(220935).format(ARCPY.GetIDMessage(220936)))
            simMaxDR = SSDO.CandidateField("SimMaxDR", "Double", None, 
                                        alias=ARCPY.GetIDMessage(220935).format(ARCPY.GetIDMessage(220934)))
            simMedDR = SSDO.CandidateField("SimMedDR", "Double", None, 
                                        alias=ARCPY.GetIDMessage(220933))
            raw = SSDO.CandidateField("PROB_1", "Double", None, alias="Probability of Being 1 ({0})".format(dependent_variable))
            residual = SSDO.CandidateField("DEV_RESID", "DOUBLE", None,  alias = "Deviance Residual")

        elif modelType == "COUNT":
            simMinRY = SSDO.CandidateField("SimMinRY", "Double", None, 
                                        alias=dependent_variable + " ({0})".format(ARCPY.GetIDMessage(220936)))
            simMaxRY = SSDO.CandidateField("SimMaxRY", "Double", None, 
                                        alias=dependent_variable + " ({0})".format(ARCPY.GetIDMessage(220934)))
            simMedRY = SSDO.CandidateField("SimMedRY", "Double", None, 
                                        alias=dependent_variable + " ({0})".format(ARCPY.GetIDMessage(220937)))
            simMinPrY = SSDO.CandidateField("SimMinPrY", "Double", None, 
                                        alias="{0} ({1}) - {2}".format(ARCPY.GetIDMessage(220939), dependent_variable, ARCPY.GetIDMessage(220938)))
            simMaxPrY = SSDO.CandidateField("SimMaxPrY", "Double", None, 
                                        alias="{0} ({1}) - {2}".format(ARCPY.GetIDMessage(84895), dependent_variable,ARCPY.GetIDMessage(220940)))
            simMedPrY = SSDO.CandidateField("SimMedPrY", "Double", None, 
                                        alias="{0} ({1}) - {2}".format(ARCPY.GetIDMessage(84895), dependent_variable,ARCPY.GetIDMessage(220941)))
            simMinDR = SSDO.CandidateField("SimMinDR", "Double", None, 
                                        alias=ARCPY.GetIDMessage(220935).format(ARCPY.GetIDMessage(220936)))
            simMaxDR = SSDO.CandidateField("SimMaxDR", "Double", None, 
                                        alias=ARCPY.GetIDMessage(220935).format(ARCPY.GetIDMessage(220934)))
            simMedDR = SSDO.CandidateField("SimMedDR", "Double", None, 
                                        alias=ARCPY.GetIDMessage(220933))
            raw = SSDO.CandidateField("RAW_PRED", "Double", None, alias="Raw Predicted ({0})".format(dependent_variable))
            residual = SSDO.CandidateField("DEV_RESID", "DOUBLE", None,  alias = "Deviance Residual")

        candidateFields = []
        addFieldNew(candidateFields, "SOURCE_ID", "LONG","SOURCE_ID")

        nFldNames = UTILS.getFieldNames(variables, pathOutput)

        for id, fldName in enumerate(variables):
            addField(candidateFields, fldName, fieldsSource, nFldNames[id]) 

        if len(listDistanceNames):
            nFldNames = UTILS.getFieldNames(listDistanceNames, pathOutput)
            for id, fldName in enumerate(listDistanceNames):
                addFieldNew(candidateFields, fldName, "DOUBLE", nFldNames[id])

        if modelType == "CONTINUOUS":
            candidateFields.extend([simMinY, simMaxY, simMedY, simMinPrY, simMaxPrY, simMedPrY, 
                                    simMinStd, simMaxStd, simMedStd, raw, residual, stdResidual])
        elif modelType == "BINARY":
            candidateFields.extend([simMinPr1, simMaxPr1, simMedPr1, simCt0, simCt1, simPcnt0,
                                    simPcnt1, simMinDR, simMaxDR, simMedDR, raw, residual])
        elif modelType == "COUNT":
            candidateFields.extend([simMinY, simMaxY, simMedY, simMinRY, simMaxRY, simMedRY, simMinPrY,
                                    simMaxPrY, simMedPrY, simMinDR, simMaxDR, simMedDR, raw, residual])

        if "MOE" in  sensitivity:
            nFldNames = UTILS.getFieldNames(sensitivity["MOE"], pathOutput)
            for id, moeField in enumerate(sensitivity["MOE"]):
                addField(candidateFields, moeField, fieldsSource, nFldNames[id])

        if "lowField"  in sensitivity:
            for i in range(len(sensitivity["lowField"])):
                lowField = sensitivity["lowField"][i].upper()
                highField = sensitivity["highField"][i].upper()
                if lowField != "" and highField != "":
                    nFldNames = UTILS.getFieldNames([lowField,highField], pathOutput)
                    addField(candidateFields, sensitivity["lowField"][0], fieldsSource, nFldNames[0])
                    addField(candidateFields, sensitivity["highField"][0], fieldsSource, nFldNames[1])

        ### Add Schema to Output Feature Class ###
        addSchemaFromCandidateList(candidateFields, parameters, idOutput)

        outTableCandidates = []
        allVars= []
        if parameters[idSimTable].value is not None:

            if explanatory_variables is not None:
                allVars = explanatory_variables
            if distance_features is not None:
                allVars.extend(listDistanceNames)

        simIDCandidate = SSDO.CandidateField("SIM_ID", "LONG", None, alias=ARCPY.GetIDMessage(220932))
        outTableCandidates.append(simIDCandidate)

        for i in range(len(allVars)):
            #### std coeff
            fieldName = "StdCoef" + str(i)
            alias = ARCPY.GetIDMessage(220931) +" (" + allVars[i] + ")"
            stdCoeffCand = SSDO.CandidateField(fieldName, "Double", None, alias)
            outTableCandidates.append(stdCoeffCand)

            #### std errors
            fieldName = "StdErr" + str(i)
            alias = ARCPY.GetIDMessage(220930)+" (" + allVars[i] + ")"
            stdErrCand = SSDO.CandidateField(fieldName, "Double", None, alias)
            outTableCandidates.append(stdErrCand)

            #### pvals
            fieldName = "Pval" + str(i)
            alias = ARCPY.GetIDMessage(220866)+" (" +allVars[i] + ")"
            pvalsCand = SSDO.CandidateField(fieldName, "Double", None, alias)
            outTableCandidates.append(pvalsCand)

        if modelType == "CONTINUOUS":
            r2Cand = SSDO.CandidateField("RSquared", "Double", None, ARCPY.GetIDMessage(220929))
            outTableCandidates.append(r2Cand)

            adjR2Cand = SSDO.CandidateField("Adj_RSq", "Double", None, ARCPY.GetIDMessage(220928))
            outTableCandidates.append(adjR2Cand)

            JBPValCand = SSDO.CandidateField("JBPVal", "Double", None, ARCPY.GetIDMessage(220927))
            outTableCandidates.append(JBPValCand)
        elif modelType == "COUNT":
            devExpCand = SSDO.CandidateField("DevExp", "Double", None, ARCPY.GetIDMessage(220926))
            outTableCandidates.append(devExpCand)
        elif modelType == "BINARY":
            accCand = SSDO.CandidateField("Acc", "Double", None, ARCPY.GetIDMessage(220925))
            outTableCandidates.append(accCand)

            sensCand = SSDO.CandidateField("Sens", "Double", None, ARCPY.GetIDMessage(220924))
            outTableCandidates.append(sensCand)

        ### Add Schema to Output Feature Class ###
        addSchemaFromCandidateList(outTableCandidates, parameters, idSimTable)

    if tool_name in ["SpatialAutocorrelation"]:
        varNameUpper = simulatedFields[0]
        varAlias = fieldsSource[varNameUpper].aliasName
        candidateFieldsFC = []
        addFieldNew(candidateFieldsFC, "SOURCE_ID", "LONG", "SOURCE_ID")
        listFlds = [simulatedFields[0]] + varNameList
        nFldNames = UTILS.getFieldNames(listFlds, pathOutput)
        for id, fldName in enumerate(listFlds):
            addField(candidateFieldsFC, fldName.upper(), fieldsSource, nFldNames[id])

        maxSim = SSDO.CandidateField("SimMax", "Double", None, alias = fr"{varAlias} ({ARCPY.GetIDMessage(220934)})")
        minSim = SSDO.CandidateField("SimMin", "Double", None, alias = fr"{varAlias} ({ARCPY.GetIDMessage(220936)})")
        candidateFieldsFC.extend([maxSim, minSim])
        addSchemaFromCandidateList(candidateFieldsFC, parameters, idOutput)

        #### Schema for Table ####
        candidateFields = []
        fieldNames = ["P_VALUE", "EXPECT_I", "VAR_I", "Z_SCORE", "MORANS_I", "SIM_ID"]
        alias= [ARCPY.GetIDMessage(220866), ARCPY.GetIDMessage(220987), ARCPY.GetIDMessage(220988), 
                ARCPY.GetIDMessage(220605), ARCPY.GetIDMessage(84148), ARCPY.GetIDMessage(220932)]
        fieldTypes = ["DOUBLE", "DOUBLE", "DOUBLE", "DOUBLE", "DOUBLE", "LONG"]
        for id, fldName in enumerate(fieldNames):
            addFieldNew(candidateFields, fldName, fieldTypes[id], alias[id])

        ### Add Schema to Output Feature Class ###
        addSchemaFromCandidateList(candidateFields, parameters, idSimTable)

cachedValues = {}

class InformationInput(object):
    """Class to store the information of the input parameters"""
    def __init__(self, toolName, parameterIndex, value):
        self.toolName = toolName
        self.parameterIndex = parameterIndex
        self.value = value
        self.time = DT.datetime.now()
        self.extraValue = None

    def __str__(self):
        return f"{self.toolName}{self.parameterIndex}"
    
    def getExtraValue(self):
        return self.extraValue

    def setExtraValue(self, extraValue):
        self.extraValue = extraValue

def isSameInCache(toolName, parameters, index):
    """Check if the value of the parameter is the same as the previous one"""
    val = InformationInput(toolName,index, parameters[index].valueAsText)
    ### 3 states 0: different, 1: same, 2: same and clean
    same = 0
    previousValues = None
    durationInCache = 50
    if str(val) in cachedValues:
        diff = val.time - cachedValues[str(val)].time
        clean = diff.total_seconds() > durationInCache
        sameValue = cachedValues[str(val)].value == val.value
        if clean and sameValue:
            same = 2
            cachedValues[str(val)] = val 
        elif not clean and sameValue:
            same = 1
        else:
            previousValues = cachedValues[str(val)].value 

        cachedValues[str(val)].value = val.value
    else:
        cachedValues[str(val)] = val 

    return same, previousValues

def setVariableInCache(toolName, parameters, index, extraValue):
    """Set the extra value of the parameter"""
    val = InformationInput(toolName,index, parameters[index].valueAsText)
    if str(val) in cachedValues:
        cachedValues[str(val)].setExtraValue(extraValue)

def getVariableFromCache(toolName, parameters, index):
    val = InformationInput(toolName, index, parameters[index].valueAsText)
    if str(val) in cachedValues:
        return cachedValues[str(val)].getExtraValue()
    return None
 