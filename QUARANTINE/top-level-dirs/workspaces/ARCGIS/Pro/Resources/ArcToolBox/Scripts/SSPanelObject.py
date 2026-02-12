# coding: utf-8
"""
Source Name:   SSPanelObject.py
Version:       ArcGIS Pro 1.5
Author:        Environmental Systems Research Institute Inc.
Description:   Python virtual wrapper for spatio-temporal feature classes 
               in the context of spatial statistics script tools.  
               Incorporates Utility Functions from SSUtilities.py and 
               SSTimeUtilities.py to extend the base SSDataObject
               through composition.
"""

################### Imports ########################

import os as OS
import operator as OP
import numpy as NUM
import pandas as PANDAS
import arcgisscripting as ARC
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.conversion as CONV
import arcpy.da as DA
import arcpy.analysis as ANA
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSCubeUtilities as CUTILS
import SSTimeUtilities as TUTILS
import SSDataObject as SSDO
import locale as LOCALE
import WeightsUtilities as WU
import datetime as DT
import Stats as STATS
################## Classes #########################

class PanelField(object):
    """Python representation of a database field to be organized and
    dispatched by SSDataObject.

    INPUTS: CandidateField
    fieldObject (obj): instance of a field object from ARCPY.ListFields(*)

    ATTRIBUTES:
    name (str): name of the field
    baseName (str): name of th field on disk, I.e. without table joins
    type (str): type of data {'Single', 'Double', 'Integer', etc...}
    length (int): length of the field

    METHODS:
    createDataArray: creates empty numpy arrays for field values.
    resizeDataArrays: resizes arrays to accounnt for bad records.
    """

    def __init__(self, fieldObject, fieldName = None, fieldType = None,
                 alias = None):
        if fieldName is not None:
            self.name = fieldName
            self.baseName = fieldName
        else:
            self.name = fieldObject.name
            self.baseName = fieldObject.baseName
        if fieldType is not None:
            self.type = fieldType
        else:
            self.type = fieldObject.type
        if alias is not None:
            self.alias = alias
        else:
            self.alias = fieldObject.aliasName
        self.length = fieldObject.length
        self.fieldObject = fieldObject
        self.nullable = fieldObject.isNullable
        self.precision = fieldObject.precision

    def createDataArray(self, numTime, numLocations):
        """Creates empty numpy arrays for field values.

        INPUTS:
        numTime (int): number of time periods
        numLocations (int): number of features
        """

        if self.type in UTILS.numpyConvert:
            myType = UTILS.numpyConvert[self.type]
            if self.type == "String":
                myType = myType % self.length
            if self.type in ["Date", "TimestampOffset"]:
                myType = 'datetime64[s]'
        else:
            myType = 'a64'

        self.data = NUM.zeros((numTime, numLocations), dtype = myType)

    def copy2FC(self, outputFC, outName = None, setNullable = False):
        """Copies self to an output feature class.

        INPUTS:
        outputFC (str): path to output feature class
        outName (str): optional output field name (for joins and such.)
        setNullable (bool): if set to true, overwrite self to nullable
        """

        if outName is None:
            outName = self.name

        if setNullable:
            nullable = True
        else:
            nullable = self.nullable

        UTILS.addEmptyField(outputFC, outName, self.type,
                            alias = self.alias,
                            nullable = nullable,
                            precision = self.fieldObject.precision,
                            scale = self.fieldObject.scale,
                            length = self.fieldObject.length,
                            required = self.fieldObject.required,
                            domain = self.fieldObject.domain)

    def returnDouble(self):
        """Converts integers to doubles (NUM.float64) for analysis."""
        if self.type in ['SmallInteger', 'Integer', 'BigInteger']:
            return NUM.array(self.data, dtype = NUM.float64)
        elif self.type == 'Date':
            return NUM.array((self.data - self.data.min()), dtype = float)
        else:
            return self.data

class SSPanelObject(object):
    """Spatial Statistics Panel Data Object: Creates and keeps track of
    Spatio-Temporal Feature Class information for scripts in the Spatial Statistics
    Toolbox.

    INPUTS:
    inputFC (str): catalogue path to the input feature class
    templateFC {str, None}: catalogue path to a template feature class (1)
    explicitSpatialRef {str/obj, None}: explicit definition of the spatial ref
    silentWarnings {bool, False}: whether to print initial warnings
    useChordal {bool, True}: whether to use chordal distance for GCS data
    invalidGCS {bool, False}: whether to allow GCS data

    ATTRIBUTES:
    inPath (str): workspace
    inName (str): fileName
    info (object): result of GeoProcessor method
    catPath (str): catalogue path to the input feature class
    shapeType (str): type of feature class; I.e. Polygon, Point
    shapeField (str): name of the shapeField
    spatialRef (str): spatial reference
    oidName (str): name of the object ID field
    shapeFileBool (bool): is the input FC a shapefile?

    METHODS:
    setHiddenFields
    createOutputFieldMappings
    obtainData
    obtainDataGA
    output2NewFC

    NOTES:
    (1) the template feature class defines environment variables that affect
        reading/writing/calculating
    """

    def __init__(self, inputFC, templateFC = None, explicitSpatialRef = None,
                 silentWarnings = False, useChordal = True,
                 invalidGCS = False):

        #### Create Base SSDataObject ####
        self.ssdo = SSDO.SSDataObject(inputFC, templateFC = templateFC, 
                                      explicitSpatialRef = explicitSpatialRef,
                                      silentWarnings = silentWarnings, 
                                      useChordal = useChordal,
                                      invalidGCS = invalidGCS,
                                      ignoreDateHighPrecision = True)

        #### Create Composition and Accounting Structure ####
        self.fields = {}
        self.master2Order = {}
        self.order2Master = {}
        self.silentWarnings = silentWarnings
        #### Obtain a Full List of Field Names/Type ####
        self.allFields = self.ssdo.allFields

    def obtainData(self, masterField, timeField, timeInterval = None, 
                   timeAlignment = "END_TIME", refTime = None,
                   fields = [], aggregateTypes = [], predictionTypes = [],
                   relatedTable = None, relatedField = None, pointFC = None,
                   requireSearch = False, requireGeometry = False, 
                   types = [0,1,2,3,4,5,6,8,9,10], minNumObs = 0, warnNumObs = 0, 
                   explicitBadRecordID = None):
        """Takes a list of field names and returns it in a dictionary
        structure.

        INPUTS:
        masterField (str): name of field being used as the master
        timeField (str): name of date/time field being used for panel
        timeInterval (str): time value and unit. E.g. 1 Month or 3 Hours
        timeAlignment {str, "END_TIME"}: time breaks 
        refTime {dt obj}: Reference time
        fields {list, []}: name(s) of the fields
        aggregateTypes {list, []}: method of aggregation for each field (1)
        predictionTypes {list, []}: method of prediction for each field (2)
        relatedTable {str, None}: path to panel data to join with core shapes
        relatedField {str, None}: name of field to match w/ masterField
        requireSearch {bool, False}: Require Neighborhood Searching
        requireGeometry {bool, False}: Require Full Geometry (3)
        types (list): types of data allowed to be returned
        minNumObs {int, 0}: minimum number of observations for error
        warnNumObs {int, 0}: minimum number of observations for warning

        ATTRIBUTES:
        fields (dict): fieldName = instance of FCField
        master2Order (dict): masterID = order in lists
        order2Master (dict): order in lists = masterID
        masterField (str): field that serves as the master
        badRecords (list): master IDs that could not be read
        xyCoords (array, nunObs x 2): xy-coordinates for feature centroids

        NOTES:
        (1) aggregateType = [SUM, MIN, MAX, MEAN, MEDIAN, STD]
        (2) predictionType = [ZEROS, SPATIAL_NEIGHBORS, SPACE_TIME_NEIGHBORS,
                              TEMPORAL_TREND]
        (3) Require Geometry and Search are mutually exclusive
        """

        #### Set Require Options ####
        self.requireGeometry = requireGeometry
        self.requireSearch = requireSearch
        self.masterField = masterField
        self.timeField = timeField
        self.timeInterval = timeInterval
        self.timeAlignment = timeAlignment
        self.refTime = refTime
        self.relatedField = relatedField
        self.relatedTable = relatedTable
        self.types = types
        self.minNumObs = minNumObs
        self.warnNumObs = warnNumObs
        self.explicitBadRecordID = explicitBadRecordID
        self.aggregateTypes = aggregateTypes
        self.predictionTypes = predictionTypes
        self.pointFC = pointFC
        if pointFC is not None:
            self.relatedTable = None
        else:
            if self.timeInterval is None:
                ARCPY.AddIDMessage("ERROR", 110108)
                raise SystemExit()

        self.useRelatedTable = self.relatedTable is not None
        self.usePointFC = self.pointFC is not None

        #### Validate Time ####
        if self.timeField is None:
            ARCPY.AddIDMessage("ERROR", 110091)
            raise SystemExit()

        #### Set/Validate Time Size ####
        try:
            self.timeSize, self.timeUnit = self.timeInterval.split(" ")
            self.timeSize = int(self.timeSize)
        except:
            if pointFC is None:
                ARCPY.AddIDMessage("ERROR", 110007)
                raise SystemExit()
            else:
                self.timeSize = None 
                self.timeUnit = None

        #### Set Initial Field Info ####
        self.__parseInitialFieldInfo(fields)

        if self.usePointFC:
            self.__obtainDataPointFC()
        else:
            if self.useRelatedTable:
                self.__obtainDataRowsJoinTable()
            else:
                self.__obtainDataRowsRepeatShapes()

    def __parseInitialFieldInfo(self, fields):
        self.fieldNames = []
        self.baseFieldNames = []
        self.initFieldNames = []
        self.indexBaseField = []
        self.predictRequireSearch = False
        self.predictOtherThanZeros = False
        numFields = len(fields)
        if not numFields and not self.usePointFC:
            ARCPY.AddIDMessage("ERROR", 110092)
            raise SystemExit()

        numPreds = len(self.predictionTypes)
        numAggs = len(self.aggregateTypes)
        self.aggregateTime = self.usePointFC
        self.predict = False
        checkFields = True
        if numPreds:
            self.predict = True
            for predType in self.predictionTypes:
                if predType not in CUTILS.allPredictionTypes:
                    ARCPY.AddIDMessage("WARNING", 110105, predType)
                    checkFields = False
                else:
                    #### If Only Zeros, Then No Prediction Required ####
                    if predType != "ZEROS":
                        self.predictOtherThanZeros = True

                    #### Assess Whether Neighborhood Search Needed ####
                    if predType in CUTILS.spatialTypes:
                        self.predictRequireSearch = True

        if numAggs:
            self.aggregateTime = True
            for aggType in self.aggregateTypes:
                if aggType not in CUTILS.allAggregationTypes:
                    ARCPY.AddIDMessage("WARNING", 110106, aggType)
                    checkFields = False

        if self.predict and self.aggregateTime:
            if numPreds != numAggs:
                checkFields = False 

        #### Throw Error If Field Info Not Appropriate ####
        if not checkFields:
            ARCPY.AddIDMessage("ERROR", 583)
            raise SystemExit()

        #### Decide if Variable Name has Multiple Parts ####
        multiVarName = False
        if self.predict or self.aggregateTime:
            multiVarName = True

        c = 0
        aggType = "NONE"
        predType = "NONE"
        for fieldInd, fieldName in enumerate(fields):
            #### FieldName, Aggregation Type, Prediction Type ####
            upperName = fieldName.upper()
            self.baseFieldNames.append(upperName)
            if upperName not in self.initFieldNames:
                self.initFieldNames.append(upperName)
                self.indexBaseField.append(c)
                c += 1
            else:
                indexBase = self.initFieldNames.index(upperName)
                self.indexBaseField.append(indexBase)

            #### Create Panel Variable Name ####
            if multiVarName:
                if self.aggregateTime:
                    aggType = self.aggregateTypes[fieldInd]
                if self.predict:
                    predType = self.predictionTypes[fieldInd]
                
                varName = "{}_{}_{}".format(upperName, aggType, predType)
                self.fieldNames.append(varName)
            else:
                self.fieldNames.append(upperName)

    def __setUniqueInfo(self):
        #### Create Master/Index Mapping Dicts ####
        self.numLocations = len(self.uniqueIDs)
        for ind, masterID in enumerate(self.uniqueIDs):
            self.master2Order[masterID] = ind
            self.order2Master[ind] = masterID

        #### Check Whether the Number of Features is Appropriate ####
        ERROR.checkNumberOfObs(self.numLocations, minNumObs = self.minNumObs)

    def __obtainDataPointFC(self):
        #### ID 64 ####
        self.masterIs64 = self.ssdo.allFields[self.masterField].type.upper() == 'BIGINTEGER'
        
        #### Warning Not Using High Precision Dates ####
        warnHP = self.ssdo.warnNotUsingHighPrecisionDates([self.timeField])

        #### Warning for UTC = 0 ####
        warnUTC = self.ssdo.warnNotUsingUTC([self.timeField])

        #### Base SSDO Read ####
        self.ssdo.obtainData(self.masterField, 
                             requireGeometry = self.requireGeometry,
                             minNumObs = self.minNumObs, allowMasterStr = True)

        #### Aggregate Points to Defined Locations ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84513))

        #### Create Point SSDO Without Reading ####
        ssdoPoint = SSDO.SSDataObject(self.pointFC)
        if ssdoPoint.hasJoin:
            #### Only Check For Unique OID if Has Join (One to Many Check) ####
            ssdoPoint.obtainData(ssdoPoint.oidName)

        self.ssdoPoint = ssdoPoint
        self.pointOID = ssdoPoint.oidName

        #### Do Spatial Join ####
        initFields = [self.timeField] + self.initFieldNames

        #### Join ####
        self.relatedInfo, badRecords = ARC._ss.flat_join(self.pointFC, self.ssdo.inputFC,
                                                        self.pointOID, self.masterField,
                                                        initFields)

        if self.relatedInfo is None:
            ARCPY.AddIDMessage("ERROR", 401)
            raise SystemExit()

        numObs = len(self.relatedInfo)

        #### Report Bad Records ####
        bn = len(badRecords)
        if bn:
            #### Get Set of Bad IDs ####
            badRecords = list(set(badRecords))
            badRecords.sort()
            strBadRecords = [ str(i) for i in badRecords ]
            cnt = numObs + bn
            if not self.silentWarnings:
                ERROR.reportBadRecords(cnt, bn, strBadRecords, label = self.pointOID,
                                       explicitBadRecordID = (110109, 110110))

        #### Additional Clip for NULL Related Table IDs ####
        masterIDs = self.relatedInfo[self.masterField]
        clip = NUM.ones(numObs, dtype = bool)
        for ind, val in enumerate(masterIDs):
            intKey = int(val)
            if intKey not in self.ssdo.master2Order:
                clip[ind] = False

        self.relatedInfo = self.relatedInfo[clip]

        ##### Assure Unique IDs Match ####
        self.uniqueIDs = [self.ssdo.order2Master[i] for i in range(self.ssdo.numObs)]

        #### Create Master/Index Mapping Dicts ####
        self.__setUniqueInfo()

        #### Create/Validate Time Breaks ####
        self.__parseTimeInfo()

        #### Create Panel Fields ####
        self.__createTableFCFields(relatedTable = self.pointFC)
        self.__initializeFields()

        #### Select Coordinates / Shapes ####
        self.xyCoords = NUM.empty((self.numLocations, 2), dtype = float)

        if self.ssdo.hasZ:
            self.zCoords = NUM.empty((self.numLocations,), dtype = float)
        else:
            self.zCoords = None

        if self.requireGeometry:
            self.shapes = NUM.empty((self.numLocations,), dtype = object)
        else:
            self.shapes = None 

        for masterID, orderID in UTILS.iteritems(self.master2Order):
            ssdoOrder = self.ssdo.master2Order[masterID]
            self.xyCoords[orderID] = self.ssdo.xyCoords[ssdoOrder]
            
            if self.ssdo.hasZ:
                self.zCoords[orderID] = self.ssdo.zCoords[ssdoOrder]

            if self.requireGeometry:
                self.shapes[orderID] = self.ssdo.shapes[ssdoOrder]

        #### Bin Data #### 
        self.__binData()

        #### Finalize Attributes/Fields If Locations Removed ####
        self.__finalize()

    def __obtainDataRowsJoinTable(self):
        #### ID 64 ####
        upperSSDOType = self.ssdo.allFields[self.masterField].type.upper() 
        self.masterIs64 = upperSSDOType == 'BIGINTEGER'
        masterIsText = upperSSDOType == 'TEXT'

        #### Warning Not Using High Precision Dates ####
        d = ARCPY.Describe(self.relatedTable)
        
        #### Assure Int or Text Match ####
        lf = ARCPY.ListFields(self.relatedTable, self.relatedField)
        upperRelatedType = lf[0].type.upper() 
        relatedIsText = upperRelatedType == 'TEXT'
        if masterIsText is not relatedIsText:
            ARCPY.AddIDMessage("ERROR", 110543, self.ssdo.allFields[self.masterField].type, 
                               lf[0].type)
            raise SystemExit()
        
        #### Warning Not Using High Precision Dates ####
        warnHP = UTILS.warnNotUsingHighPrecisionDatesDescribe(d, [self.timeField])
        
        #### Warning for UTC = 0 ####
        warnUTC = UTILS.warnNotUsingUTCDescribe(d, [self.timeField])

        #### Base SSDO Read ####
        self.ssdo.obtainData(self.masterField, 
                             requireGeometry = self.requireGeometry,
                             minNumObs = self.minNumObs, allowMasterStr = True)

        #### Data Read From Table ####
        initFields = [self.relatedField, self.timeField] + self.initFieldNames
        self.relatedInfo = SSDO.table2RecArray(self.relatedTable, initFields,
                                               explicitBadRecordID = 110088,
                                               returnOID = True,
                                               progressID = 84744,
                                               ignoreDateHighPrecision = True)
        self.relatedOID = d.oidFieldName

        #### Get Unique IDs and Select Indices ####
        allMasterIDs = self.relatedInfo[self.relatedField]
        uniqueInfo = NUM.unique(allMasterIDs, return_index = True,
                                return_counts = True)
        relatedIDs, relatedIndices, relatedCounts = uniqueInfo
        numRelated = len(allMasterIDs)

        ##### Assure Unique IDs Match ####
        self.uniqueIDs = [self.ssdo.order2Master[i] for i in range(self.ssdo.numObs)]

        #### Ignore IDs With No Shape ####
        keepKeys = NUM.in1d(relatedIDs, self.uniqueIDs)
        removeJoinKeys = NUM.nonzero(~keepKeys)[0]
        numRemove = len(removeJoinKeys)
        if numRemove:
            removeJoinKeys = relatedIDs[removeJoinKeys]
            badKeys = ", ".join([str(i) for i in removeJoinKeys])
            ARCPY.AddIDMessage("WARNING", 110086, numRemove, numRelated)
            ARCPY.AddIDMessage("WARNING", 110087, self.relatedField, badKeys)
            if numRemove == numRelated:
                #### No Valid Features ####
                ARCPY.AddIDMessage("ERROR", 110097)
                raise SystemExit()

            else:
                for removeJoinKey in removeJoinKeys:
                    removeArray = allMasterIDs == removeJoinKey
                    allMasterIDs = allMasterIDs[~removeArray]
                    self.relatedInfo = self.relatedInfo[~removeArray]

        #### Create Master/Index Mapping Dicts ####
        self.__setUniqueInfo()

        #### Create/Validate Time Breaks ####
        self.__parseTimeInfo()

        #### Create Panel Fields ####
        self.__createTableFCFields()
        self.__initializeFields()

        #### Select Coordinates / Shapes ####
        self.xyCoords = NUM.empty((self.numLocations, 2), dtype = float)

        if self.ssdo.hasZ:
            self.zCoords = NUM.empty((self.numLocations,), dtype = float)
        else:
            self.zCoords = None

        if self.requireGeometry:
            self.shapes = NUM.empty((self.numLocations,), dtype = object)
        else:
            self.shapes = None 

        for masterID, orderID in UTILS.iteritems(self.master2Order):
            ssdoOrder = self.ssdo.master2Order[masterID]
            self.xyCoords[orderID] = self.ssdo.xyCoords[ssdoOrder]
            
            if self.ssdo.hasZ:
                self.zCoords[orderID] = self.ssdo.zCoords[ssdoOrder]

            if self.requireGeometry:
                self.shapes[orderID] = self.ssdo.shapes[ssdoOrder]

        #### Bin Data #### 
        self.__binData()
            
        #### Finalize Attributes/Fields If Locations Removed ####
        self.__finalize()

    def __obtainDataRowsRepeatShapes(self):
        #### ID 64 ####
        self.masterIs64 = self.ssdo.allFields[self.masterField].type.upper() == 'BIGINTEGER'

        #### Warning Not Using High Precision Dates ####
        warnHP = self.ssdo.warnNotUsingHighPrecisionDates([self.timeField])

        #### Warning for UTC = 0 ####
        warnUTC = self.ssdo.warnNotUsingUTC([self.timeField])

        #### Base SSDO Read ####
        initFields = [self.masterField, self.timeField] + self.initFieldNames
        self.ssdo.obtainData(self.ssdo.oidName, fields = initFields,
                             types = self.types, 
                             requireGeometry = self.requireGeometry,
                             minNumObs = self.minNumObs, allowMasterStr = True)

        #### Get Unique IDs and Select Indices ####
        allMasterIDs = self.ssdo.fields[self.masterField].data
        uniqueInfo = NUM.unique(allMasterIDs, return_index = True,
                                return_counts = True)
        self.uniqueIDs, self.uniqueIndices, self.uniqueCounts = uniqueInfo

        #### Create Master/Index Mapping Dicts ####
        self.__setUniqueInfo()

        #### Create/Validate Time Breaks ####
        self.__parseTimeInfo()

        #### Create Panel Fields ####
        self.__initializeFields()

        #### Select Coordinates / Shapes ####
        self.xyCoords = self.ssdo.xyCoords[self.uniqueIndices]

        if self.ssdo.hasZ:
            self.zCoords = self.ssdo.zCoords[self.uniqueIndices]
        else:
            self.zCoords = None

        if self.requireGeometry:
            self.shapes = NUM.array(self.ssdo.shapes, dtype = object)
            self.shapes = self.shapes[self.uniqueIndices]
        else:
            self.shapes = None 

        #### Bin Data #### 
        self.__binData()

        #### Finalize Attributes/Fields If Locations Removed ####
        self.__finalize()


    def __parseTimeInfo(self):

        #### Get Time Data ####
        if self.useRelatedTable or self.usePointFC:
            timeData = self.relatedInfo[self.timeField]
        else:
            timeData = self.ssdo.fields[self.timeField].data

        #### Retrieve Time Data ####
        minDataTime = timeData.min()
        maxDataTime = timeData.max()

        if self.usePointFC and self.timeUnit is None:
            #### Test for Temporal Outliers ####
            secondTime = NUM.array(timeData - minDataTime, dtype = NUM.int32)
            timeOutliers = STATS.iqrOutliers(secondTime)
            numTimeOutliers = timeOutliers.sum()
            if numTimeOutliers:
                ARCPY.AddIDMessage("WARNING", 110050, str(numTimeOutliers))
                timeIDs = timeOutliers.nonzero()
                oids = self.relatedInfo[self.pointOID]
                outliers = [ str(oids[i]) for i in timeIDs[0] ]
                outliers = ", ".join(outliers[:30])
                ARCPY.AddIDMessage("WARNING", 110051, self.pointOID, outliers)

            #### Default Time Breaks ####
            useDefaultTime = True
            totalSeconds = int(secondTime.max())
            n = len(secondTime)

            #### Get Default Number of Time Bins ####
            if CUTILS.histMethod == "RISK_FUN":
                numBreaks = int(STATS.riskFunBins(secondTime, CUTILS.riskFunMin,
                                                  CUTILS.riskFunMax, CUTILS.riskFunStep))
                riceBreaks = STATS.riceBins(n)
                if riceBreaks < numBreaks:
                    numBreaks = riceBreaks

            #### Assure At Least 10 ####
            if numBreaks < 10:
                numBreaks = 10

            #### Round to Human Readable ####
            breakInfo = TUTILS.defaultTimeBreakInfo(totalSeconds, numBreaks)
            defaultTimeSize, timeStepLabel = breakInfo
            humanVal, humanType = timeStepLabel.split(" ")
            timeLab = humanType.upper()
            if timeLab[-1] != "S":
                timeLab += "S"
            self.timeUnit = timeLab
            self.timeSize = int(humanVal)

        else:
            useDefaultTime = False 

            #### Set/Validate Time Unit ####
            self.timeUnit = self.timeUnit.upper()
            if self.timeUnit.upper() not in TUTILS.supportTime:
                ARCPY.AddIDMessage("ERROR", 110008)
                raise SystemExit()

        #### Set/Validate Time Alignment ####
        self.timeAlignment = self.timeAlignment.replace(" ", "_").upper()
        if self.timeAlignment not in ["START_TIME", "END_TIME", "REFERENCE_TIME"]:
            ARCPY.AddIDMessage("ERROR", 110011, self.timeAlignment)
            raise SystemExit()

        #### Set/Validate Reference Time ####
        self.useRefTime = False
        if "REFERENCE_TIME" in self.timeAlignment:
            if type(self.refTime) == DT.datetime:
                self.useRefTime = True
            else:
                self.timeAlignment = 'END_TIME'
                self.refTime = None 

        #### Set Even Versus Uneven (Calendar) Breaks ####
        if self.timeUnit in ["MONTH", "MONTHS", "YEAR", "YEARS"]:
            unevenTimeBreak = True
        else:
            unevenTimeBreak = False


        #### Get Base Time Break and Direction to Set ####
        self.isStartTime = False
        if "START_TIME" in self.timeAlignment:
            timeBase = minDataTime
            self.isStartTime = True
        elif self.useRefTime:
            timeBase = NUM.array(self.refTime, dtype = 'datetime64[s]')
            if timeBase <= minDataTime:
                self.isStartTime = True
        else:
            timeBase = maxDataTime

        #### Finalize Alignment After Accounting for Reference Time ####
        if self.isStartTime:
            self.timeAlignment = "START_TIME"
        else:
            self.timeAlignment = "END_TIME"

        #### Get Time Break Values ####
        if not unevenTimeBreak:
            breakTimeSize = TUTILS.createTimeDelta(int(self.timeSize), self.timeUnit).item().total_seconds()
            breakTimeUnit = "SECONDS"
        else:
            breakTimeSize = self.timeSize
            breakTimeUnit = self.timeUnit

        #### Create Time Breaks (Possibly Reset Time Alignment) ####
        self.timeAlignment, timeBreaks = TUTILS.createTimeBreaks(timeData, breakTimeSize, 
                                                                 breakTimeUnit,
                                                                 refType = self.timeAlignment,
                                                                 refTime = self.refTime)
        self.isStartTime = self.timeAlignment == "START_TIME"

        self.startTime = timeBreaks[0]
        self.endTime = timeBreaks[-2]
        self.timeBins = TUTILS.binTimeData(timeData, timeBreaks, self.isStartTime)
        self.timeBreaks = timeBreaks
        self.numTime = len(timeBreaks) - 1
        timeIDList = NUM.arange(0, self.numTime)
        startTimeSec = self.startTime.toordinal()
        timeArray = NUM.array(timeBreaks, dtype = 'datetime64[s]')
        self.timeBreakSec = (timeArray - timeArray[0]) / NUM.timedelta64(1, 's')
        self.timeBreakSec = NUM.array(self.timeBreakSec[:-1], dtype = NUM.int32)

        self.displayTimeUnit = UTILS.getDisplayTimeUnit(self.timeUnit,
                                                        self.timeSize)
        stepStr = UTILS.formatString("{0} {1}")
        self.timeStepLabel = TUTILS.prettyTime(stepStr.format(self.timeSize,
                                                                self.timeUnit))
        self.timeBreaks = timeBreaks

        #### Data Start/End Time ####
        self.dataMinTime = minDataTime.item().strftime('%Y-%m-%d %H:%M:%S')
        self.dataMaxTime = maxDataTime.item().strftime('%Y-%m-%d %H:%M:%S')

        #### Calculate Aggregation Bias ####
        if self.aggregateTime:
            self.startBias, self.endBias = TUTILS.aggregationBias(timeBreaks,
                                                          minDataTime.item(),
                                                          maxDataTime.item())
        else:
            self.startBias = 0.0
            self.endBias = 0.0

        #### Set Number of Observations ####
        self.numObs = self.numTime * self.numLocations

        #### Report Default Time Info ####
        if useDefaultTime:
            prettyTime = TUTILS.prettyTime(self.timeStepLabel.lower())
            outTimeSize, outTimeUnit = prettyTime.split(" ")
            outTimeUnit = UTILS.getLocalizedUnitType(outTimeUnit)
            ARCPY.AddIDMessage("WARNING", 110013, outTimeSize, outTimeUnit)

    def __createTableFCFields(self, relatedTable = None):
        if relatedTable is None:
            relatedTable = self.relatedTable

        self.relatedFCFields = {}
        d = ARCPY.Describe(relatedTable)
        for fieldObj in d.fields:
            fieldName = fieldObj.name.upper()
            if fieldName in self.initFieldNames:
                fcField = SSDO.FCField(fieldObj, ignoreDateHighPrecision = True)
                self.relatedFCFields[fieldName] = fcField

    def __initializeFields(self):
        #### Create Panel Fields ####
        for fieldInd, fieldName in enumerate(self.baseFieldNames):
            panelFieldName = self.fieldNames[fieldInd]

            if self.useRelatedTable or self.usePointFC:
                fcField = self.relatedFCFields[fieldName]
            else:
                fcField = self.ssdo.allFields[fieldName]

            field = PanelField(fcField.fieldObject, fieldName = panelFieldName,
                               fieldType = "Double", alias = panelFieldName)
            field.createDataArray(self.numTime, self.numLocations)
            self.fields[panelFieldName] = field

    def __binData(self):

        #### Set Number of Data Records and Create Progressor ####
        numRecords = len(self.timeBins)
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84726))

        #### Get Order IDs ####
        if self.usePointFC:
            masterIDs = self.relatedInfo[self.masterField]
        else:
            if self.useRelatedTable:
                masterIDs = self.relatedInfo[self.relatedField]
            else:
                masterIDs = self.ssdo.fields[self.masterField].data

        orderIDs = [self.master2Order[i] for i in masterIDs]
        orderIDs = NUM.asarray(orderIDs, dtype = NUM.int32)

        #### Create Panel Aggregation Class ####
        self.agg_panel = ARC._ss.AggregatePanel(self.numTime, self.numLocations,
                                                self.timeBins, orderIDs)
        self.countDataMask = self.agg_panel.count_values.reshape(self.numTime, self.numLocations)
        self.aggDataMask = self.countDataMask > 0
        elementIDs = self.agg_panel.element_ids

        for fieldInd, fieldName in enumerate(self.baseFieldNames):
            outFieldName = self.fieldNames[fieldInd]
            if self.useRelatedTable or self.usePointFC:
                data = NUM.ascontiguousarray(self.relatedInfo[fieldName], dtype = float)
            else:
                data = self.ssdo.fields[fieldName].returnDouble()

            if self.aggregateTime:
                #### Do Aggregation ####
                aggType = CUTILS.agg2Number[self.aggregateTypes[fieldInd]]
                aggResult = self.agg_panel.aggregate_values(data, aggType)
                self.fields[outFieldName].data[:] = aggResult.reshape(self.numTime, 
                                                                      self.numLocations)
            else:
                outArray = NUM.zeros((self.agg_panel.num_all_locations,), dtype = float)
                for dataInd, dataValue in enumerate(data):
                    outArray[elementIDs[dataInd]] = dataValue
                self.fields[outFieldName].data[:] = outArray.reshape(self.numTime, 
                                                                     self.numLocations)

        #### Assess Group Results ####
        removeBadGroups = False
        if self.usePointFC and not self.predictOtherThanZeros:
            self.groupDataMask = NUM.ones((self.numLocations,), dtype = bool)

        else:
            if self.aggregateTime:
                #### Set Warning Numbers ####
                warnEach = 110098
                warnTotal = 110099
                errorAll = 110103

                #### Create Bad Group Array ####
                if not self.predict:
                    self.groupDataMask = ~NUM.any(self.countDataMask < 1, 0)
                else:
                    self.groupDataMask = NUM.ones((self.numLocations,), dtype = bool)
            else:
                if self.predict:
                    #### Set Warning Numbers ####
                    warnEach = 110100
                    warnTotal = 110101
                    errorAll = 110104

                    #### Create Bad Group Array ####
                    self.groupDataMask = ~NUM.any(self.countDataMask > 1, 0)
                    removeBadGroups = True

                else:
                    #### Set Warning Numbers ####
                    warnEach = 110080
                    warnTotal = 110081
                    errorAll = 110102

                    #### Create Bad Group Array ####
                    self.groupDataMask = ~NUM.any(self.countDataMask != 1, 0)

        #### Warning For Groups That Are Not Viable ####
        badGroupInds = NUM.where(~self.groupDataMask)[0]
        self.numBadGroups = len(badGroupInds)

        if self.numBadGroups:
            masterIDs = ""
            if type(self.order2Master[0]) in CUTILS.numericTypes:
                self.badGroups = NUM.asarray([self.order2Master[i] for i in badGroupInds],
                                             dtype = NUM.int64)
                self.badGroups = NUM.sort(self.badGroups)
                masterIDs = [str(i) for i in self.badGroups[0:30]]
                masterIDs = ", ".join(masterIDs)
                    
            else:
                self.badGroups = [self.order2Master[i] for i in badGroupInds]
                self.badGroups = NUM.sort(self.badGroups)
                masterIDs = [i for i in self.badGroups[0:30]]
                masterIDs = ", ".join(masterIDs)
                
            ARCPY.AddIDMessage("WARNING", warnEach, self.numBadGroups, 
                               self.numLocations)
            ARCPY.AddIDMessage("WARNING", warnTotal, self.masterField, masterIDs)
            if self.numBadGroups == self.numLocations:
                ARCPY.AddIDMessage("ERROR", errorAll)
                raise SystemExit()

        #### Identify Time/Locations to Predict ####
        self.finalPredMask = ~self.aggDataMask
        predictTime, predictOrder = NUM.where(self.finalPredMask)
        locations2Predict = NUM.unique(predictOrder)
        numPredict = len(locations2Predict)
        self.predDataMask = NUM.ones((self.numLocations,), dtype = bool)
        arrayNames = NUM.array(self.fieldNames)

        ##### Do Prediction ####
        if numPredict and self.predictOtherThanZeros:

            #### Remove Bad Groups from No-Agg + 1 ####
            if removeBadGroups and self.numBadGroups:
                locations2Predict = NUM.setdiff1d(locations2Predict, badGroupInds)

            #### Create Progressor ####
            numPredict = len(locations2Predict)
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84727), 0, numPredict, 1)

            #### Start With Spline ####
            doSpline = [i == "TEMPORAL_TREND" for i in self.predictionTypes]
            doSpline = NUM.asarray(doSpline, dtype = bool)
            if doSpline.sum():
                #### Get Spline Fields ####
                splineFields = arrayNames[doSpline]

                #### Calculation Loop ####
                for orderID in locations2Predict:
                    aggMask = self.aggDataMask[:,orderID]
                    canPredict = aggMask[CUTILS.splineArray].sum() == 4
                    if canPredict:
                        predictAt = ~aggMask
                        for fieldName in splineFields:
                            data = self.fields[fieldName].data[:,orderID]
                            data[predictAt] = NUM.nan 
                            output = STATS.predictSeriesSpline(data)
                            self.fields[fieldName].data[:,orderID] = output
                    else:
                        self.predDataMask[orderID] = False

                    ARCPY.SetProgressorPosition()

            #### Do Spatial / Spatio-Temporal ####
            if self.predictRequireSearch:
                #### Get Spatial/Spatio-Temporal Fields ####
                doSpatial = [i in CUTILS.spatialTypes for i in self.predictionTypes]
                doSpatial = NUM.asarray(doSpatial, dtype = bool)
                spatialFields = arrayNames[doSpatial]
                doSpaceTime = [i == 'SPACE_TIME_NEIGHBORS' for i in self.predictionTypes]
                doSpaceTime = NUM.asarray(doSpaceTime, dtype = bool)
                spaceTimeSum = doSpaceTime.sum()
                hasSpaceTime = spaceTimeSum != 0
                hasSpace = len(spatialFields) != spaceTimeSum

                #### Create KD Tree and Neighborhood Search ####
                self.__createSpatialNeighborhood()

                #### Time Selection Array ####
                allTimeIDs = NUM.arange(self.numTime, dtype = NUM.int32)
                tMinus1 = self.numTime - 1
                
                #### Calculation Loop ####
                for orderID in locations2Predict:

                    #### Get Base Neighbors ####
                    baseNeighs = self.kdTree.getNeighbors(orderID)

                    #### Set Self Array ####
                    selfNeigh = NUM.array([orderID], dtype = NUM.int32)

                    #### Get Space-Time Locations to Predict At ####
                    predictAt = self.aggDataMask[:,orderID]
                    times2Predict = NUM.where(~predictAt)[0]

                    #### Predict ####
                    breakTime = False
                    for timeID in times2Predict:
                        #### Calculate/Check Number of Spatial Neighbors ####
                        timeMask = self.aggDataMask[timeID]
                        spatialNeighs = baseNeighs[timeMask[baseNeighs]]
                        numSpatial = len(spatialNeighs)
                        if hasSpace:
                            if numSpatial < 4:
                                self.predDataMask[orderID] = False
                                break

                        spaceTimeNeighs = []
                        if hasSpaceTime:
                            #### Calculate/Check Number of Space-Time Neighbors ####
                            numSpaceTime = numSpatial
                            lowTime = timeID
                            highTime = timeID
                            if timeID:
                                #### Earlier Time Period ####
                                lowTime = timeID - 1
                                lowMask = self.aggDataMask[lowTime]
                                lowNeighs = baseNeighs[lowMask[baseNeighs]]

                                #### Add Self ####
                                if self.aggDataMask[lowTime, orderID]:
                                    lowNeighs = NUM.hstack((lowNeighs, selfNeigh))

                                numSpaceTime += len(lowNeighs)
                                spaceTimeNeighs.append(lowNeighs)

                            #### Add Spatial Neighbors ####
                            spaceTimeNeighs.append(spatialNeighs)

                            if timeID != tMinus1:
                                #### Later Time Period ####
                                highTime = timeID + 1
                                highMask = self.aggDataMask[highTime]
                                highNeighs = baseNeighs[highMask[baseNeighs]]

                                #### Add Self ####
                                if self.aggDataMask[highTime, orderID]:
                                    highNeighs = NUM.hstack((highNeighs, selfNeigh))

                                numSpaceTime += len(highNeighs)
                                spaceTimeNeighs.append(highNeighs)

                            if (numSpaceTime < 13):
                                self.predDataMask[orderID] = False
                                break

                            timeIDs = allTimeIDs[lowTime:(highTime + 1)]
                            denomSpaceTime = numSpaceTime * 1.0

                        for fieldName in spatialFields:
                            data = self.fields[fieldName].data
                            fieldInd = self.fieldNames.index(fieldName)
                            if not doSpaceTime[fieldInd]:
                                #### Spatial ####
                                lag = data[timeID,spatialNeighs].mean()
                            else:
                                #### Space-Time ####
                                sumValue = 0.0
                                for timeInd, timeVal in enumerate(timeIDs):
                                    neighs = spaceTimeNeighs[timeInd]
                                    tSum = data[timeVal,neighs].sum()
                                    sumValue += tSum
                                lag = sumValue / denomSpaceTime

                            self.fields[fieldName].data[timeID, orderID] = lag 

                        ARCPY.SetProgressorPosition()

        #### Identify Locations Failed to Predict ####
        self.badPredictions = NUM.where(~self.predDataMask)[0]
        self.numBadPredictions = len(self.badPredictions)

        ##### Warning For Predictions That Are Not Viable ####
        if self.numBadPredictions:
            self.badPredictions = NUM.sort(self.badPredictions)
            masterIDs = [str(self.order2Master[i]) for i in self.badPredictions[0:30]]
            masterIDs = ", ".join(masterIDs)
            ARCPY.AddIDMessage("WARNING", 110089, self.numBadPredictions, 
                                self.numLocations)
            ARCPY.AddIDMessage("WARNING", 110090, self.masterField, masterIDs)

            if self.numBadPredictions == self.numLocations:
                ARCPY.AddIDMessage("ERROR", 110096)
                raise SystemExit()

    def __finalize(self):
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84743))

        #### Count Field ####
        if self.usePointFC or self.aggregateTime:
            if self.usePointFC:
                fieldName = "COUNT"
            else:
                fieldName = "TEMPORAL_AGGREGATION_COUNT"
            fcField = ARCPY.Field()
            fcField.name = fieldName
            fcField.type = "DOUBLE"
            fcField.alias = fieldName
            field = PanelField(fcField, fieldName = fieldName,
                               fieldType = "Double", alias = fieldName)
            field.createDataArray(self.numTime, self.numLocations)
            field.data[:] = self.countDataMask * 1.0
            self.fields[fieldName] = field
            self.fieldNames.append(fieldName)

        #### Assess Whether Any Records Need To Be Removed ####
        if self.numBadGroups or self.numBadPredictions:
            features2Keep = ~((~self.groupDataMask) | (~self.predDataMask))
            self.finalPredMask = self.finalPredMask.T[features2Keep].T
            numLocations = features2Keep.sum()
            if not numLocations:
                ARCPY.AddIDMessage("ERROR", 110120)
                raise SystemExit()

            c = 0
            master2Order = {}
            order2Master = {}
            for orderID in range(self.numLocations):
                if features2Keep[orderID]:
                    masterID = self.order2Master[orderID]
                    master2Order[masterID] = c
                    order2Master[c] = masterID
                    c += 1

            #### Reset Attributes ####
            self.master2Order = master2Order
            self.order2Master = order2Master
            self.xyCoords = self.xyCoords[features2Keep]
            if self.ssdo.hasZ:
                self.zCoords = self.zCoords[features2Keep]

            if self.requireGeometry:
                self.shapes = self.shapes[features2Keep]

            self.numLocations = numLocations
            self.numObs = self.numTime * numLocations

            #### Reset Fields ####
            for fieldName in self.fieldNames:
                allData = self.fields[fieldName].data 
                newData = allData[:,features2Keep]
                self.fields[fieldName].data = newData

    def __createSpatialNeighborhood(self):
        if self.ssdo.useChordal:
            self.coords = ARC._ss.lonlat_to_xy(self.xyCoords,
                                               self.ssdo.spatialRef)
        else:
            self.coords = self.xyCoords

        numNeighs = min(self.numLocations - 1, 8)
        self.kdTree = WU.SciPyNeighborSearch(self, spaceConcept = 'K_NEAREST_NEIGHBORS',
                                             numNeighs = numNeighs)

    def getMasterIDs(self):

        if type(self.order2Master[0]) not in CUTILS.numericTypes:
            size = max([len(self.order2Master[orderID]) for orderID in UTILS.ssRange(self.numLocations)])
            masterIDs = NUM.empty((self.numLocations,), dtype="U" + str(size))
        else:
            if self.masterIs64:
                masterIDs = NUM.empty((self.numLocations,), dtype = NUM.int64)
            else:
                masterIDs = NUM.empty((self.numLocations,), dtype = NUM.int32)

        for orderID in UTILS.ssRange(self.numLocations):
            masterIDs[orderID] = self.order2Master[orderID]
        
        return masterIDs

class SSMDRasterPanelObject(object):
    """Spatial Statistics Panel Data Object: Creates and keeps track of
    Spatio-Temporal Feature Class information for scripts in the Spatial Statistics
    Toolbox.

    INPUTS:
    cubeObj (SSMDRasterCubeObject): SSMDRasterCubeObject
    """

    def __init__(self, cubeObj):
        #### Create Base SSDataObject ####
        self.ssdo = cubeObj.ssdo

        #### Create Composition and Accounting Structure ####
        self.fields = {}
        self.master2Order = {}
        self.order2Master = {}
        self.silentWarnings =  cubeObj.silentWarnings
        #### Obtain a Full List of Field Names/Type ####
        self.allFields =  cubeObj.allFields
        self.aggregateTypes = cubeObj.aggregateTypes
        self.predictionTypes = cubeObj.predictionTypes
        self.timeAlignment =  cubeObj.timeAlignment
        self.timeUnit = cubeObj.timeUnit
        self.timeSize = cubeObj.timeSize
        self.timeStepLabel = cubeObj.timeStepLabel
        self.refTime = cubeObj.refTime
        self.timeBreaks = cubeObj.timeBreaks
        self.timeBreaksSec = cubeObj.timeBreakSec
        self.dataMinTime = cubeObj.dataMinTime
        self.dataMaxTime = cubeObj.dataMaxTime
        self.startBias = cubeObj.startBias
        self.endBias = cubeObj.endBias
        self.fieldNames = cubeObj.fieldNames
        self.numLocations, self.numTime, self.numObs = cubeObj.getNumLocations()
        self.shapes = cubeObj.getShapes()

        self.requireGeometry = True
        field = cubeObj.fields[self.fieldNames[0]]
        data = field.data
        info = data.reshape(cubeObj.numTime,(cubeObj.numCols*cubeObj.numRows)).transpose().copy()
        info = info[cubeObj.validIds]
        pField = PanelField(field, fieldName = field.name, fieldType = field.type,  alias = field.alias)
        pField.createDataArray(cubeObj.numTime, self.numLocations)
        pField.data[:] = info.transpose().reshape(self.numTime,self.numLocations)
        self.fields = {pField.name: pField}

        self.predict = False
        self.finalPredMask = None ##cubeObj.getFinalPredMask()
        xyCoords = cubeObj.xyCoords
        self.xyCoords = xyCoords[cubeObj.validIds]
        self.locationID = "location ID"
        self.masterField = "Cell"
        self.validIds = cubeObj.validIds

    def getMasterIDs(self):
        masterIDs = NUM.empty((self.numLocations,), dtype = NUM.int32)
        for orderID in UTILS.ssRange(self.numLocations):
            masterIDs[orderID] = self.validIds[orderID]
        return masterIDs