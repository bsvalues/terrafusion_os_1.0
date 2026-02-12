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
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSCubeUtilities as CUTILS
import SSTimeUtilities as TUTILS
import SSDataObject as SSDO
import SSCube as CUBE
import locale as LOCALE
import WeightsUtilities as WU
import datetime as DT
import Stats as STATS

PROPORTION_XYCELLS = 0.002
################## Locals ##########################


class GridField(object):
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

    def __init__(self, fieldObject = None, fieldName = None, fieldType = None,
                 alias = None, maskName = None):

        #### Empty Call for COUNT Field ####
        if fieldObject is None:
            self.name = "COUNT"
            self.baseName = "COUNT"
            self.aliasName = "COUNT"
            self.type = "DOUBLE"
            self.length = None
            self.precision = None
            self.isNullable = True
            self.maskName = "PROCESSING_BINARY_MASK"

        else:
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

            if hasattr(fieldObject, "isNullable"):
                self.nullable = fieldObject.isNullable
            if hasattr(fieldObject, "nullable"):
                self.nullable = fieldObject.nullable
            self.isNullable = self.nullable
            self.precision = fieldObject.precision
            self.maskName = maskName

    def addDataArray(self, data, mask, numTime, numRows, numCols):
        """Creates empty numpy arrays for field values.

        INPUTS:
        numTime (int): number of time periods
        numLocations (int): number of features
        """

        self.data = data.reshape(numTime, numRows, numCols)
        self.mask = mask.reshape(numRows, numCols)

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
        if self.type in ['SmallInteger', 'Integer']:
            return NUM.array(self.data, dtype = float)
        elif self.type == 'Date':
            return NUM.array((self.data - self.data.min()), dtype = float)
        else:
            return self.data

class SSCubeObject(object):
    """Spatial Statistics Cube Data Object: Creates and keeps track of
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
                 referenceCube = None, silentWarnings = False):

        #### Use Reference Cube if Given ####
        if referenceCube is not None:
            self.refCube = CUBE.SSCube(referenceCube, 'r')
            explicitSpatialRef = self.refCube.spatialReference
            self.useRefCube = True
        else:
            self.refCube = None
            self.useRefCube = False

        #### Create Base SSDataObject ####
        self.ssdo = SSDO.SSDataObject(inputFC, templateFC = templateFC, 
                                      explicitSpatialRef = explicitSpatialRef,
                                      silentWarnings = silentWarnings, 
                                      useChordal = False, invalidGCS = True,
                                      ignoreDateHighPrecision = True)

        #### Create Composition and Accounting Structure ####
        self.fields = {}

        #### Obtain a Full List of Field Names/Type ####
        self.allFields = self.ssdo.allFields

    def obtainData(self, timeField = None, timeInterval = None, 
                   timeAlignment = "END_TIME", refTime = None,
                   distanceInterval = None, aggShapeType = "FISHNET_GRID",
                   fields = [], aggregateTypes = [], predictionTypes = [],
                   types = [0,1,2,3,4,5,6,9,10], minNumObs = 60, warnNumObs = 0, 
                   explicitBadRecordID = None, requireTime = 10):
        """Takes a list of field names and returns it in a dictionary
        structure.

        INPUTS:
        timeField (str): name of date/time field being used for panel
        timeInterval (str): time value and unit. E.g. 1 Month or 3 Hours
        timeAlignment {str, "END_TIME"}: time breaks 
        refTime {dt obj}: Reference time
        fields {list, []}: name(s) of the fields
        aggregateTypes {list, []}: method of aggregation for each field (1)
        predictionTypes {list, []}: method of prediction for each field (2)
        types (list): types of data allowed to be returned
        minNumObs {int, 0}: minimum number of observations for error
        warnNumObs {int, 0}: minimum number of observations for warning

        ATTRIBUTES:
        masterField (str): name of field being used as the master
        fields (dict): fieldName = instance of FCField
        xyCoords (array, nunObs x 2): xy-coordinates for feature centroids

        NOTES:
        (1) aggregateType = [SUM, MIN, MAX, MEAN, MEDIAN, STD]
        (2) predictionType = [ZEROS, SPATIAL_NEIGHBORS, SPACE_TIME_NEIGHBORS,
                              TEMPORAL_TREND]
        """

        #### Set Require Options ####
        self.masterField = self.ssdo.oidName
        self.timeField = timeField

        #### Warning Not Using High Precision Dates ####
        warnHP = self.ssdo.warnNotUsingHighPrecisionDates([self.timeField])
        
        #### Warning for UTC = 0 ####
        warnUTC = self.ssdo.warnNotUsingUTC([self.timeField])

        self.useRefTime = False
        envExtent = ARCPY.env.extent
        if self.useRefCube:
            if self.refCube.hasAlignment:
                self.timeInterval = "{0} {1}".format(self.refCube.timeSize,
                                                     self.refCube.timeUnit)
                self.timeAlignment = "REFERENCE_TIME"
                self.refTime = None
                self.refCubeIsStartTime = "START" in self.refCube.alignment
                self.referenceStartTime = self.refCube.firstStartTime
                self.referenceEndTime = self.refCube.lastEndTime
                self.distanceInterval = self.refCube.userDistanceIntervalStr
                self.__checkDistanceInterval()
                self.aggShapeType = self.refCube.aggShapeType
                self.adjustExtent = False
                self.inputExtent = self.refCube.getInternalExtent()
                self.useRefTime = True
                if envExtent:
                    #### Ignore Env Extent ####
                    ARCPY.AddIDMessage("WARNING", 110041)
            else:
                #### Ref Cube has No Alignment ####
                ARCPY.AddIDMessage("ERROR", 110062)
                raise SystemExit()

            #### Close Reference Cube ####
            self.refCube.close()
        else:
            if envExtent:
                if envExtent.spatialReference.name != self.ssdo.spatialRef.name:
                        envExtent = envExtent.projectAs(self.ssdo.spatialRef)
                self.inputExtent = NUM.array([envExtent.XMin, envExtent.YMin, 
                                              envExtent.XMax, envExtent.YMax])
            else:
                self.inputExtent = None
                
            self.timeInterval = timeInterval
            self.timeAlignment = timeAlignment
            self.distanceInterval = distanceInterval
            self.aggShapeType = aggShapeType
            self.refTime = refTime
            self.referenceStartTime = None
            self.referenceEndTime = None
            self.adjustExtent = True

        #### Set Non-Ref Cube Attributes ####
        self.types = types
        self.minNumObs = minNumObs
        self.warnNumObs = warnNumObs
        self.explicitBadRecordID = explicitBadRecordID
        self.aggregateTypes = aggregateTypes
        self.predictionTypes = predictionTypes
        self.requireTime = requireTime

        #### Set Initial Field Info ####
        self.__parseInitialFieldInfo(fields)

        self.__obtainData()

    def __checkDistanceInterval(self):
        #### Warning for Intl Feet to US Feet For Ref Cubes Only ####
        warn = False
        dist, unit = self.distanceInterval.split(" ")
        if unit.upper() in ['FEET', 'FOOT']:
            floatVersion = self.refCube.dataset.source.split(";")[-1]
            if floatVersion.count('.') > 1:
                floatVersion = floatVersion[0:-2]
            floatVersion = float(floatVersion)

            if UTILS.isPRO():
                if floatVersion < 2.1:
                    warn = True
            else:
                if floatVersion < 10.6:
                    warn = True 

        if warn:
            ARCPY.AddIDMessage("WARNING", 110123)

    def __parseInitialFieldInfo(self, fields):
        self.fieldNames = []
        self.baseFieldNames = []
        self.initFieldNames = []
        self.indexBaseField = []
        numFields = len(fields)
        numPreds = len(self.predictionTypes)
        numAggs = len(self.aggregateTypes)

        checkFields = True
        if numFields == numAggs == numPreds:

            c = 0
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

                #### Check Aggregation Type ####
                aggType = self.aggregateTypes[fieldInd]
                if aggType not in CUTILS.allAggregationTypes:
                    checkFields = False
                    break

                #### Check Prediction Type ####
                predType = self.predictionTypes[fieldInd]
                if predType not in CUTILS.allPredictionTypes:
                    checkFields = False
                    break

                #### Create Panel Variable Name ####
                varName = "{}_{}_{}".format(upperName, aggType, predType)
                self.fieldNames.append(varName)

        if not checkFields:
            ARCPY.AddIDMessage("ERROR", 583)
            raise SystemExit()

    def __obtainData(self):
        initFields = [self.timeField] + self.initFieldNames
        self.ssdo.obtainData(self.ssdo.oidName, fields = initFields,
                             types = self.types, minNumObs = self.minNumObs, 
                             warnNumObs = self.warnNumObs, 
                             explicitBadRecordID = self.explicitBadRecordID,
                             requireSearch = False)

        #### Create/Validate Distance Interval ####
        self.__parseDistanceInterval()

        #### Create/Validate Time Breaks ####
        self.__parseTimeInfo()

        #### Aggregate ####
        self.__binData()

        #### Add Count Field ####
        self.fieldNames = ["COUNT"] + self.fieldNames

    def __parseTimeInfo(self):
        #### Get Time Data ####
        timeData = self.ssdo.fields[self.timeField].data

        #### Retrieve Time Data ####
        minDataTime = timeData.min()
        maxDataTime = timeData.max()

        #### Test for Temporal Outliers ####
        secondTime = NUM.array(timeData - minDataTime, dtype = NUM.int32)
        timeOutliers = STATS.iqrOutliers(secondTime)
        numTimeOutliers = timeOutliers.sum()
        if numTimeOutliers:
            ARCPY.AddIDMessage("WARNING", 110050, str(numTimeOutliers))
            timeIDs = timeOutliers.nonzero()
            outliers = [ str(self.ssdo.order2Master[i]) for i in timeIDs[0] ]
            outliers = ", ".join(outliers[:30])
            ARCPY.AddIDMessage("WARNING", 110051, self.ssdo.oidName, outliers)

        if self.timeInterval is None:
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

            #### Set/Validate Time Size ####
            self.timeSize, self.timeUnit = self.timeInterval.split(" ")
            try:
                self.timeSize = int(self.timeSize)
            except:
                ARCPY.AddIDMessage("ERROR", 110007)
                raise SystemExit()

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
        if "REFERENCE_TIME" in self.timeAlignment and not self.useRefCube:
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
            if self.useRefCube:
                self.isStartTime = self.refCubeIsStartTime
            else:
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
                                                                 refTime = self.refTime,
                                                                 refStartTime = self.referenceStartTime,
                                                                 refEndTime = self.referenceEndTime)
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

        #### Data Start/End Time ####
        self.dataMinTime = minDataTime.item().strftime('%Y-%m-%d %H:%M:%S')
        self.dataMaxTime = maxDataTime.item().strftime('%Y-%m-%d %H:%M:%S')

        #### Calculate Aggregation Bias ####
        self.startBias, self.endBias = TUTILS.aggregationBias(timeBreaks,
                                                      minDataTime.item(),
                                                      maxDataTime.item())

        #### Report Default Time Info ####
        if useDefaultTime:
            #### Pretty Time and Localized ####
            prettyTime = TUTILS.prettyTime(self.timeStepLabel.lower())
            outTimeSize, outTimeUnit = prettyTime.split(" ")
            outTimeUnit = UTILS.getLocalizedUnitType(outTimeUnit)
            ARCPY.AddIDMessage("WARNING", 110013, outTimeSize, outTimeUnit)

    def __parseDistanceInterval(self):

        #### Distance Interval ####
        useDefaultDistance = self.distanceInterval is None
        if not useDefaultDistance:
            userDistanceInterval, userCellUnit = self.distanceInterval.split(" ")
            userCellUnit = userCellUnit.upper().replace(" ", "_")
            if userDistanceInterval != '':
                try:
                    userDistanceInterval = UTILS.strToFloat(userDistanceInterval)
                except:
                    useDefaultDistance = True
                    ARCPY.AddIDMessage("WARNING", 110009)

                if userCellUnit not in CUTILS.supportDist:
                    ARCPY.AddIDMessage("ERROR", 110010)
                    raise SystemExit()

                if not useDefaultDistance:
                    #### Adjust Cell Size to Projection if User Provided ####
                    extentFactor = self.ssdo.distanceInfo.convertFactor
                    distanceStr, distanceFactor = UTILS.distanceUnitInfo[userCellUnit]
                    processingDistance = (userDistanceInterval * distanceFactor) / extentFactor
                    self.distanceInterval = processingDistance
                    self.userDistanceInterval = userDistanceInterval
                    self.cellUnit = self.ssdo.distanceInfo.name
                    self.userCellUnit = userCellUnit

        if useDefaultDistance:
            if self.ssdo.skipNearestNeighbor:
                #### Use Default Based on Area For Dense Data ####
                processingDistance = self.ssdo.defaultCellSize
            else:
                lo = UTILS.LocationInfo(self.ssdo)
                processingDistance, threshold, meanDist, outliers = lo.getNearestNeighborInfo()

            self.distanceInterval = processingDistance
            self.userDistanceInterval = processingDistance
            self.cellUnit = self.ssdo.distanceInfo.name
            self.userCellUnit = self.ssdo.distanceInfo.name

            #### Default Distance Message ####
            defaultLength = UTILS.prettyUnits(self.userDistanceInterval,
                                              self.userCellUnit)
            if useDefaultDistance:
                formatDist, formatUnit = defaultLength.split()
                ARCPY.AddIDMessage("WARNING", 110035, formatDist, formatUnit)

        #### Set Cell Size Info ####
        if self.aggShapeType == "HEXAGON_GRID":
            self.cellSize = self.distanceInterval / CUTILS.hexScale
            self.userCellSize = self.userDistanceInterval / CUTILS.hexScale
        else:
            self.cellSize = self.distanceInterval 
            self.userCellSize = self.userDistanceInterval 

        #### Set Display Units for Space ####
        self.displayUnit = UTILS.getDisplayUnit(self.cellUnit,
                                                cellSize = self.distanceInterval)

    def __binData(self):

        #### 2 Billion of Limits for Element Numbers ####
        if self.aggShapeType == "HEXAGON_GRID":
            width = self.cellSize * 1.5
            height = self.cellSize * CUTILS.hexScale
            numCols = (self.ssdo.extent.XMax - self.ssdo.extent.XMin) / width
            numRows = (self.ssdo.extent.YMax - self.ssdo.extent.YMin) / height
            use_hexagons = True
        else:
            numCols = (self.ssdo.extent.XMax - self.ssdo.extent.XMin) / self.cellSize
            numRows = (self.ssdo.extent.YMax - self.ssdo.extent.YMin) / self.cellSize
            use_hexagons = False

        if (numCols * numRows * self.numTime) >= 2000000000.:
            ARCPY.AddIDMessage("ERROR", 110005)
            raise SystemExit()

        #### Count Aggregation ####
        maxTime = len(self.timeBreakSec)
        self.agg = ARC._ss.AggregateCube(self.ssdo.xyCoords, 
                                         cell_size = self.cellSize,
                                         use_hexagons = use_hexagons,
                                         time_index = self.timeBins,
                                         extent = self.inputExtent,
                                         max_time = maxTime, 
                                         adjust_extent = self.adjustExtent)

        #### Must Have At Least 10 Time Periods ####
        if self.agg.num_time < 10:
            ARCPY.AddIDMessage("ERROR", 110004)
            raise SystemExit()

        outsideIDs =  NUM.where(self.agg.inside == False)
        numOutside = len(outsideIDs[0])
        if numOutside:
            ARCPY.AddIDMessage("WARNING", 110039, str(numOutside))
            outside = [ str(self.ssdo.order2Master[i]) for i in outsideIDs[0]]
            outside = ", ".join(outside[:30])
            ARCPY.AddIDMessage("WARNING", 110040, self.ssdo.oidName, outside)

        #### Reset Extent ####
        aggExtent = self.agg.origin_extent
        self.extent = ARCPY.Extent(aggExtent[0], aggExtent[1],
                                   aggExtent[2], aggExtent[3])
        self.extent.spatialReference = self.ssdo.spatialRef

        #### Set Number of Rows and Columns ####
        self.numRows = self.agg.num_rows
        self.numCols = self.agg.num_cols

        #### Count Variable/Mask ####
        count = GridField()
        count.addDataArray(self.agg.cell_values, self.agg.default_mask,
                           self.numTime, self.numRows, self.numCols)
        self.fields[count.name] = count

        #### Create Summary Grid Fields ####
        for fieldInd, fieldName in enumerate(self.baseFieldNames):
            gridFieldName = self.fieldNames[fieldInd]
            fcField = self.ssdo.allFields[fieldName]
            fieldType = "Double"
            maskName = gridFieldName + "_MASK"

            #### Create New Grid Variable ####
            field = GridField(fcField.fieldObject, fieldName = gridFieldName,
                              fieldType = fieldType, alias = gridFieldName,
                              maskName = maskName)

            #### Do Aggregation ####
            aggType = CUTILS.agg2Number[self.aggregateTypes[fieldInd]]
            predType = CUTILS.pred2Number[self.predictionTypes[fieldInd]]

            data = self.ssdo.fields[fieldName].returnDouble()
            aggData, aggMask = self.agg.aggregate_points(data, agg_type = aggType,
                                                         pred_type = predType)

            #### Populate Grid Field ####
            field.addDataArray(aggData, aggMask, self.numTime, 
                               self.numRows, self.numCols)
            self.fields[gridFieldName] = field

class SimulateAgg(object):
    def __init__(self, xyCoords, srf, distanceInfo, extent):
        self.xyCoords = xyCoords
        self.spatialRef = srf
        self.distanceInfo = distanceInfo
        self.shapeType = "POLYGON"
        self.extent = extent
    def return_centroids(self):
        return self.xyCoords

def DBG(lo):
    output = ",".join([str(e) for e in lo])
    ARCPY.AddMessage(output.replace("str","SSTTRR"))


class SSMDRasterCubeObject(object):
    """Spatial Statistics Cube Data Object: Creates a
    Spatio-Temporal class information from a multidimensional raster.

    INPUTS:
    inputMDRaster (str): catalogue path to the input feature class
    templateFC {str, None}: catalogue path to a template feature class (1)
    explicitSpatialRef {str/obj, None}: explicit definition of the spatial ref
    silentWarnings {bool, False}: whether to print initial warnings

   """

    def __init__(self, inputMDRaster, explicitSpatialRef = None, silentWarnings = False, extent = None):

        self.inputMDRaster = inputMDRaster
        self.silentWarnings = silentWarnings
        self.refCube = None
        self.useRefCube = False

        #### Describe MD Raster ####
        self.desc = None
        try:
            self.desc = ARCPY.Describe(inputMDRaster)
        except:
            ARCPY.AddIDMessage("ERROR", 110289)
            raise SystemExit


        #### Check SA Lic ####
        #self.__checkLicense()

        #### Load MD Raster Object ####
        self.rInfo = ARCPY.sa.Raster(inputMDRaster, True)

        if not self.rInfo.isMultidimensional:
            ARCPY.AddIDMessage("ERROR", 110289)
            raise SystemExit

        #### Original Data ####
        self.extent = self.rInfo.extent
        yCell = self.rInfo.meanCellHeight
        xCell = self.rInfo.meanCellWidth
        self.origSRF = self.desc.spatialReference

        #### Set Spatial Reference ####
        self.spatialRef = self.desc.spatialReference

        #### Original Data ####
        self.oxCell = xCell
        self.oyCell = yCell

        self.oxCellHalf = xCell/2.0
        self.oyCellHalf = yCell/2.0
        self.shouldReproject = False
        self.oNumCols = self.rInfo.width
        self.oNumRows = self.rInfo.height
        self.numCols = self.oNumCols
        self.numRows = self.oNumRows

        self.getZone = False
        if extent is not None:
            if extent not in ["MAXOF", "MINOF"]:

                polyExtent = None
                base = self.extent.polygon
                if extent.spatialReference is None:
                    #### Update Extent Without Spatial Reference ####
                    extRef = ARCPY.Extent(XMin = extent.XMin,
                                          YMin = extent.YMin,
                                          XMax = extent.XMax,
                                          YMax = extent.YMax)
                    ARCPY.AddIDMessage("ERROR", 110293)
                    raise SystemExit
                else:
                    #### Reproject Extent in MD Raster ####
                    if  extent.spatialReference.factoryCode != self.origSRF.factoryCode:
                        polyExtent = extent.polygon.projectAs(self.origSRF)
                    else:
                        polyExtent = extent.polygon

                #### Same Extent ####
                if self.extent.XMin == polyExtent.extent.XMin and \
                   self.extent.YMin == polyExtent.extent.YMin and \
                   self.extent.XMax == polyExtent.extent.XMax and \
                   self.extent.YMax == polyExtent.extent.YMax:
                    self.getZone = False
                else:
                    #### Get Zone Of Interest in MDRaster Projection ####
                    ZOI = None

                    if not base.disjoint(polyExtent):
                        #### Get Zone of Interest From Intersection ####
                        ZOI = base.intersect(polyExtent, 4)

                        if not (hasattr(ZOI, "area") and ZOI.area > 0):
                            ARCPY.AddIDMessage("ERROR", 110292)
                            raise SystemExit

                    else:
                         ARCPY.AddIDMessage("ERROR", 110293)
                         raise SystemExit

                    #### Update XMin, YMin, numCols, numRows ####
                    self.__UpdateCubeExtentProperties(self.__boundExtent(ZOI.extent))
                    self.getZone = True

        if (self.numCols * self.numRows) >= 2000000000.:
            ARCPY.AddIDMessage("ERROR", 110005)
            raise SystemExit()

        #### Generate Centroids ####
        xcells = (NUM.arange(self.numCols) * xCell) + (self.extent.XMin + self.oxCellHalf)
        ycells = (self.extent.YMax - self.oyCellHalf) - (NUM.arange(self.numRows) * yCell)

        #### Create Grid ####
        xv, yv = NUM.meshgrid(xcells, ycells, sparse = False)
        xyCoords = NUM.zeros((self.numCols*self.numRows, 2), dtype = float)
        xyCoords.T[0] = xv.ravel()
        xyCoords.T[1] = yv.ravel()
        self.xyCoords = xyCoords
        self.sourceXY = xyCoords
        self.sourceExtent = self.extent

        detectCell = False
        #### Reproject Centroid Cells ####
        if explicitSpatialRef is not None:
            self.shouldReproject = True
            xy = None

            #### Reproject GCS MD raster to Projected Coordinate System ####
            try:
                xy = ARC._ss.change_projection_xy(xyCoords, self.rInfo.spatialReference, explicitSpatialRef)
            except:
                ARCPY.AddIDMessage("ERROR", 110294, self.rInfo.spatialReference.name, explicitSpatialRef.name)
                raise SystemExit

            #### Recalculate Cell Size - Using New Projection ####
            uniqueX = NUM.unique(xy.T[0])
            uniqueY = NUM.unique(xy.T[1])

            if len(uniqueX) > 1 and len(uniqueY) > 1:
                xCell = NUM.mean(NUM.diff(uniqueX))
                yCell = NUM.mean(NUM.diff(uniqueY))
            else:
                xCell, yCell = self.__getCellDimensionNewSRF(xCell, yCell, explicitSpatialRef)
                detectCell = True
            self.xyCoords = xy

            #### Define the Output Projection ####
            self.spatialRef = explicitSpatialRef
            self.extent = self.extent.polygon.projectAs(self.spatialRef).extent


        self.xCellHalf = xCell/2.0
        self.yCellHalf = yCell/2.0

        ####  Simulate Agg Cube ####
        self.distanceInfo = UTILS.DistanceInfo(self.spatialRef)
        self.agg = SimulateAgg(self.xyCoords, self.spatialRef, self.distanceInfo,self.extent)

        ### To Get -Coordinates and Spatial Reference ####
        self.ssdo = self.agg
        self.isSquaredCell  = True
        self.xCell = xCell
        self.yCell = yCell

        #### Verify Cell Geometry -> Decision DL Cube or Not ####
        if xCell != yCell:
            if abs(xCell-yCell)/xCell  > PROPORTION_XYCELLS:
                self.cellSize = min(xCell, yCell)
                self.isSquaredCell  = False
            else:
                self.cellSize = (xCell + yCell) / 2.0

                if NUM.isnan(self.cellSize):
                    if detectCell:
                        ARCPY.AddIDMessage("ERROR", 110307)
                        raise SystemExit

                ARCPY.AddIDMessage("WARNING", 110301, UTILS.formatValue(self.cellSize, "%0.3f"))

        else:
            self.cellSize = xCell

        # typeC = ARCPY.GetIDMessage(84962) if self.isSquaredCell else ARCPY.GetIDMessage(84963)
        # msg = ARCPY.GetIDMessage(84961)
        # ARCPY.AddMessage(msg + typeC)

        #### Unit Properties ####
        self.cellUnit = self.distanceInfo.outputString
        self.userCellUnit = self.distanceInfo.name
        self.userDistanceInterval = self.cellSize
        self.distanceInterval = self.cellSize
        self.userCellSize = self.cellSize
        self.allFields =  self.rInfo.variableNames

        #### Load Variables ####
        variables = self.rInfo.variableNames

        if (len(variables)) == 1:
            self.allFields = variables
        elif (len(variables)) > 1:
            temp = []
            withoutDimension = []

            for varName in self.allFields:
                try:
                    self.rInfo.getDimensionNames(varName)
                    temp.append(varName)
                except:
                    withoutDimension.append(varName)
                    continue

            if len(withoutDimension):
                ARCPY.AddIDMessage("ERROR", 110302, ",".join(withoutDimension))
                raise SystemExit

            self.allFields = temp
        else:
            self.allFields = []

        #### Create Composition and Accounting Structure ####
        self.fields = {}

    def __getCellDimensionNewSRF(self, xCell, yCell, explicitSpatialRef):
        xcells = (NUM.arange(2) * xCell) + (self.extent.XMin + self.oxCellHalf)
        ycells = (self.extent.YMax - self.oyCellHalf) - (NUM.arange(2) * yCell)

        #### Create Grid ####
        xv, yv = NUM.meshgrid(xcells, ycells, sparse = False)
        xyCoords = NUM.zeros((4, 2), dtype = float)
        xyCoords.T[0] = xv.ravel()
        xyCoords.T[1] = yv.ravel()

        xy = None
        #### Reproject GCS MD raster to Projected Coordinate System ####
        try:
            xy = ARC._ss.change_projection_xy(xyCoords, self.rInfo.spatialReference, explicitSpatialRef)
        except:
            ARCPY.AddIDMessage("ERROR", 110294, self.rInfo.spatialReference.name, explicitSpatialRef.name)
            raise SystemExit


        #### Recalculate Cell Size - Using New Projection ####
        uniqueX = NUM.unique(xy.T[0])
        uniqueY = NUM.unique(xy.T[1])


        if len(uniqueX) == 1 or len(uniqueY) == 1:
            return NUM.nan, NUM.nan

        xCellValue = NUM.mean(NUM.diff(uniqueX))
        yCellValue = NUM.mean(NUM.diff(uniqueY))

        return xCellValue, xCellValue


    def __boundCheck(self, x, y, flag = True):
        if self.origSRF.type.upper() == "GEOGRAPHIC" and flag:
            if x > 180:
                x =  x # - 360.0
        return x , y

    def __boundExtent(self, extent):
        xMin, yMin = self.__boundCheck(extent.XMin, extent.YMin)
        xMax, yMax = self.__boundCheck(extent.XMax, extent.YMax)
        return ARCPY.Extent(XMin = xMin, YMin = yMin, XMax = xMax, YMax = yMax, spatial_reference = extent.spatialReference)

    def __getPoint(self, x, y):
        """Get Point GCS """
        x, y = self.__boundCheck(x, y)

        point = ARCPY.Point(x,y)

        return point

    def __getColRow(self, x, y):
        """ get Col Row """

        flag = False if self.extent.XMin == 360.0 else True
        xMin, yMax = self.__boundCheck(self.extent.XMin, self.extent.YMax, flag)

        dx = x - xMin
        dy = yMax - y
        col = NUM.ceil(dx/self.oxCell) - 1
        row = NUM.ceil(dy/self.oyCell) - 1

        if self.__borderRaster(col, row):
            return int(col), int(row)
        else:
            if col < 0:
                col = 0
            if row < 0:
                row = 0
            if row > self.oNumRows:
                row = self.oNumRows
            if col > self.oNumCols:
                col = self.oNumCols
            return col, row

    def __getCellXY(self, col, row):
        """ Return Cell starting XY From Col and Row """

        xMin, yMax = self.__boundCheck(self.extent.XMin, self.extent.YMax)
        xMax, yMin = self.__boundCheck(self.extent.XMax, self.extent.YMin)

        x = xMin + col*self.oxCell
        y = yMax - self.oyCell - row*self.oyCell

        if col == 0:
            x = xMin
        if col == self.oNumCols:
            x = xMax - self.oxCell
        if row == 0:
            y = yMax - self.oyCell
        if row == self.oNumRows:
            y = yMin

        return x, y

    def __borderRaster(self, col, row):
        """ Check Border """
        if col >= 0  and col < self.oNumCols and row >=0 and row < self.oNumRows:
            return True
        else:
            return False

    def __UpdateCubeExtentProperties(self, extent):
        """ Update Coordinates To Get Data """

        col1, row1 = self.__getColRow(extent.XMin, extent.YMin)
        sX, sY = self.__getCellXY(col1, row1)

        col2, row2 = self.__getColRow(extent.XMax, extent.YMax)
        eX, eY = self.__getCellXY(col2, row2)

        #### Extent Is Smaller Than One Cells ####
        #if sX == eX and sY == eY:
        #    ARCPY.AddIDMessage("ERROR",110303)
        #    raise SystemExit

        self.numCols = int(col2 - col1 + 1)
        self.numRows = int(row1 - row2 + 1)
        self.extent = ARCPY.Extent(XMin = sX, YMin = sY,
                                   XMax = eX + self.oxCell, YMax = eY + self.oyCell,
                                   spatial_reference = self.origSRF)

        self.sourceExtent = ARCPY.Extent(XMin = sX, YMin = sY,
                                   XMax = eX + self.oxCell, YMax = eY + self.oyCell,
                                   spatial_reference = self.origSRF)


    def __checkLicense(self):
        """
        Check License Spatial Analysis
        """
        prod = ARCPY.ProductInfo()
        extension  = ARCPY.CheckExtension("Spatial")

        if extension == "Available":
            if prod != "ArcServer":
                lic = ARCPY.CheckOutExtension("Spatial")
                if lic != 'CheckedOut':
                    ARCPY.AddIDMessage("ERROR", 110188)
                    raise SystemExit
        else:
            ARCPY.AddIDMessage("ERROR", 110188)
            raise SystemExit

    def obtainData(self, timeField = None, timeInterval = None, 
                   timeAlignment = "END_TIME", refTime = None,
                   distanceInterval = None, aggShapeType = "FISHNET_GRID",
                   fields = [], aggregateTypes = [], predictionTypes = [],
                   types = [0,1,2,3,4,5,6,9,10], minNumObs = 60, warnNumObs = 0, 
                   explicitBadRecordID = None, requireTime = 10):
        """Takes a list of field names and returns it in a dictionary
        structure.

        INPUTS:
        timeField (str): name of date/time field being used for panel
        timeInterval (str): time value and unit. E.g. 1 Month or 3 Hours
        timeAlignment {str, "END_TIME"}: time breaks 
        refTime {dt obj}: Reference time
        fields {list, []}: name(s) of the fields
        aggregateTypes {list, []}: method of aggregation for each field (1)
        predictionTypes {list, []}: method of prediction for each field (2)
        types (list): types of data allowed to be returned
        minNumObs {int, 0}: minimum number of observations for error
        warnNumObs {int, 0}: minimum number of observations for warning

        ATTRIBUTES:
        masterField (str): name of field being used as the master
        fields (dict): fieldName = instance of FCField
        xyCoords (array, nunObs x 2): xy-coordinates for feature centroids

        NOTES:
        (1) aggregateType = [SUM, MIN, MAX, MEAN, MEDIAN, STD]
        (2) predictionType = [ZEROS, SPATIAL_NEIGHBORS, SPACE_TIME_NEIGHBORS,
                              TEMPORAL_TREND]
        """

        if not self.rInfo.isMultidimensional:
            ARCPY.AddIDMessage("ERROR", 110289)
            raise SystemExit

        self.useRefTime = False
        envExtent = self.extent

        if self.useRefCube:
            ARCPY.AddError("Not supported")
            raise SystemExit
            ###TODO####

        else:
            if envExtent:
                if envExtent.spatialReference.name != self.desc.spatialReference.name:
                        envExtent = envExtent.projectAs(self.desc.spatialReference)
                self.inputExtent = NUM.array([envExtent.XMin, envExtent.YMin, 
                                              envExtent.XMax, envExtent.YMax])
            else:
                self.inputExtent = None
                
            self.timeInterval = timeInterval
            self.timeAlignment = timeAlignment
            #self.distanceInterval = distanceInterval
            self.aggShapeType = aggShapeType
            self.refTime = refTime
            self.referenceStartTime = None
            self.referenceEndTime = None
            self.adjustExtent = True

        self.aggShapeType = "FISHNET_GRID"

        #### Set Non-Ref Cube Attributes ####
        self.types = types
        self.minNumObs = minNumObs
        self.warnNumObs = warnNumObs
        self.explicitBadRecordID = explicitBadRecordID
        self.aggregateTypes = aggregateTypes
        self.predictionTypes = predictionTypes
        self.requireTime = requireTime

        #### Set Initial Field Info ####
        self.__parseInitialFieldInfo(fields)

        #### Obtain Data ####
        self.__obtainData()

    def __checkDistanceInterval(self):
        #### Warning for Intl Feet to US Feet For Ref Cubes Only ####
        warn = False
        dist, unit = self.distanceInterval.split(" ")
        if unit.upper() in ['FEET', 'FOOT']:
            floatVersion = self.refCube.dataset.source.split(";")[-1]
            if floatVersion.count('.') > 1:
                floatVersion = floatVersion[0:-2]
            floatVersion = float(floatVersion)

            if UTILS.isPRO():
                if floatVersion < 2.1:
                    warn = True
            else:
                if floatVersion < 10.6:
                    warn = True 

        if warn:
            ARCPY.AddIDMessage("WARNING", 110123)

    def __parseInitialFieldInfo(self, fields):
        self.fieldNames = []
        self.baseFieldNames = []
        self.initFieldNames = []
        self.indexBaseField = []
        self.fieldsList = fields
        numFields = len(fields)
        numPreds = len(self.predictionTypes)
        numAggs = len(self.aggregateTypes)

        checkFields = True
        if numFields == numAggs == numPreds:

            c = 0
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

                #### Check Aggregation Type ####
                aggType = self.aggregateTypes[fieldInd]
                if aggType not in CUTILS.allAggregationTypes:
                    checkFields = False
                    break

                #### Check Prediction Type ####
                predType = self.predictionTypes[fieldInd]
                if predType not in CUTILS.allPredictionTypes:
                    checkFields = False
                    break

                #### Create Panel Variable Name ####
                varName = "{}_{}_{}".format(upperName, aggType, predType)
                self.fieldNames.append(varName)

        if not checkFields:
            ARCPY.AddIDMessage("ERROR", 583)
            raise SystemExit()

    def __obtainData(self):


        initFields = self.initFieldNames

        #### Create/Validate Distance Interval ####
        self.__parseDistanceInterval()

        #### Create/Validate Time Breaks ####
        self.__parseTimeInfo()

        #### Aggregate ####
        self.__binData()

        #### Add Count Field ####
        self.fieldNames = self.fieldNames

    def __analizeTimeInfo(self):

        #### Dimension attributes as a Dictiionary ###
        attributeDimension = self.rInfo.getDimensionAttributes(self.fieldName, self.dimensionName)
        timeValues = self.rInfo.getDimensionValues(self.fieldName, self.dimensionName)
        timeInterval  = self.__checkAttribute(attributeDimension, 'IntervalUnit')
        timeUnit  = self.__checkAttribute(attributeDimension, 'IntervalUnit')
        interval  = self.__checkAttribute(attributeDimension, 'Interval', False)
        self.timeValues = [timeValue[1] for timeValue in timeValues]
        return True

    def __checkAttribute(self, attributeDimension, name, upperV = True):
        """ Check Attributes in Diemsion Attributes """

        if attributeDimension[name] in ["", None]:
            ARCPY.AddIDMessage("ERROR", 110295)
            raise SystemExit
        return attributeDimension[name].upper() if upperV else attributeDimension[name]

    def __hasGaps(self, minDataTime, timeData):
        """Check if there are gaps among time intervals """
        p = minDataTime
        df = []
        for i in NUM.arange(len(timeData)-1):
            df.append(timeData[i+1]-p)
            p = timeData[i+1]
        df = NUM.array(df)
        meanDiff = df.mean()
        msk = df>meanDiff*1.2

        badR = NUM.sum(msk)
        return badR, meanDiff

    def __parseTimeInfo(self):

        #### Use only one variable ####
        self.fieldName = self.fieldsList[0]

        self.dimensionName = None

        #### Obtain Dimension Name ####
        try:
           self.dimensionName = self.rInfo.getDimensionNames(self.fieldName)
        except:
            ARCPY.AddIDMessage("ERROR",110295)
            raise SystemExit

        #### Dimension Empty ####
        if len(self.dimensionName) != 1:
            ARCPY.AddIDMessage("ERROR",110295)
            raise SystemExit
        else:
            self.dimensionName = self.dimensionName[0]

        #### Dimension attributes as a Dictionary ###
        attributeDimension = self.rInfo.getDimensionAttributes(self.fieldName, self.dimensionName)

        timeInterval  = self.__checkAttribute(attributeDimension, 'IntervalUnit')
        timeUnit  = self.__checkAttribute(attributeDimension, 'IntervalUnit')
        interval  = self.__checkAttribute(attributeDimension, 'Interval', False)

        displayWarning = False

        if not attributeDimension['HasRegularIntervals']:
            self.irregular  = True
            if attributeDimension['HasRanges']:
                displayWarning = self.__analizeTimeInfo()
            else:
                self.timeValues = self.rInfo.getDimensionValues(self.fieldName, self.dimensionName)
        else:
            self.irregular  = False
            if attributeDimension['HasRanges']:
                displayWarning = self.__analizeTimeInfo()
            else:
                self.timeValues = self.rInfo.getDimensionValues(self.fieldName, self.dimensionName)


        timeData = NUM.zeros(len(self.timeValues), dtype = 'datetime64[s]')
        timeData64 = NUM.zeros(len(self.timeValues), dtype = 'datetime64[ms]')
        
        #### Check Time Data ####
        isDateTime = True
        for index, value in enumerate(self.timeValues):
            try:
                timeData[index] = value
                timeData64[index] = value
            except:
                isDateTime = False
                break

        #### Evaluate DateTime Values ####
        if not isDateTime:
            ARCPY.AddIDMessage("ERROR", 110297)
            raise SystemExit

        #### Warn Not Using High Precision in 3.2 ####
        diffMS = timeData64 - timeData
        diffFloat = NUM.array(diffMS / NUM.timedelta64(1, 'ms'), dtype = float)
        if diffFloat.sum() > 0:
            ARCPY.AddIDMessage("WARNING", 110521)

        timeData = NUM.array(timeData,dtype='datetime64[s]')

        hasNullDateTime = NUM.isnat(timeData).sum() > 0

        #### Detected Null Values in the datetime Array #### 
        if hasNullDateTime:
            ARCPY.AddIDMessage("ERROR", 110298)
            raise SystemExit

        #### Use Starting Date Warning #####
        if displayWarning:
            ARCPY.AddIDMessage("WARNING", 110455)

        #### Retrieve Time Data ####
        minDataTime = timeData.min()
        maxDataTime = timeData.max()

        self.timeInterval = TUTILS.createTimeDelta(1, timeInterval)
        self.timeUnit = timeUnit
        self.timeSize = int(interval)
        self.timeAlignment = "START_TIME"
        self.useRefTime = False
        self.isStartTime = True


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
            if self.useRefCube:
                self.isStartTime = self.refCubeIsStartTime
            else:
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

        strBreakTimeSize = LOCALE.format_string("%0.1f", breakTimeSize)
        useDefaultTime = True

        #### Create Time Breaks ####
        self.timeAlignment  = None
        timeBreaks = None
        self.containTimeGaps = False

        badR, meanDiff = self.__hasGaps(minDataTime,timeData) 

        if badR > 0:
            self.containTimeGaps = True
            ARCPY.AddIDMessage("WARNING", 110442)
            self.__configureTimeVariables(minDataTime, maxDataTime, meanDiff, timeData)
        else:
            if self.irregular:
                ARCPY.AddIDMessage("WARNING", 110442)
                self.__configureTimeVariables(minDataTime, maxDataTime, meanDiff, timeData)
            else:
                self.__configureTimeVariables(minDataTime, maxDataTime, meanDiff, timeData)

        #### Pretty Time and Localized ####
        prettyTime = TUTILS.prettyTime(self.timeStepLabel.lower())
        outTimeSize, outTimeUnit = prettyTime.split(" ")
        outTimeUnit = UTILS.getLocalizedUnitType(outTimeUnit)
        ARCPY.AddIDMessage("WARNING", 110013, outTimeSize, outTimeUnit)

    def __configureTimeVariables(self, minDataTime, maxDataTime, meanDiff, timeData):
        self.timeAlignment = "END_TIME"
        self.timeData = timeData
        self.isStartTime = self.timeAlignment == "START_TIME"
        self.endTime = maxDataTime.item()
        self.timeBins = NUM.arange(len(timeData), dtype = NUM.int32)
        newStart = TUTILS.addUnit(minDataTime.item(),-1*self.timeSize, self.timeUnit)
        newstartA = NUM.array([newStart], dtype = 'datetime64[s]')
        self.startTime = newStart
            
        self.timeBreaks = NUM.hstack((newstartA,timeData))

        self.numTime = len(self.timeBreaks) - 1
        timeIDList = NUM.arange(0, self.numTime)
        startTimeSec = self.startTime.toordinal()
        timeArray = NUM.array(self.timeBreaks, dtype = 'datetime64[s]')
        self.timeBreakSec = (timeArray - timeArray[0]) / NUM.timedelta64(1, 's')
        self.timeBreakSec = NUM.array(self.timeBreakSec[:-1], dtype = NUM.int32)

        self.displayTimeUnit = UTILS.getDisplayTimeUnit(self.timeUnit,
                                                        self.timeSize)
        stepStr = UTILS.formatString("{0} {1}")
        self.timeStepLabel = TUTILS.prettyTime(stepStr.format(self.timeSize,
                                                              self.timeUnit))

        #### Data Start/End Time ####
        self.dataMinTime = minDataTime.item().strftime('%Y-%m-%d %H:%M:%S')
        self.dataMaxTime = maxDataTime.item().strftime('%Y-%m-%d %H:%M:%S')

        self.timeBreaks = [v.item() for v in self.timeBreaks]
        #### Calculate Aggregation Bias ####
        self.startBias, self.endBias = TUTILS.aggregationBias(self.timeBreaks,
                                                      minDataTime.item(),
                                                      maxDataTime.item())

    def __parseDistanceInterval(self):

        #### Set Display Units for Space ####
        self.displayUnit = UTILS.getDisplayUnit(self.cellUnit,
                                                cellSize = self.distanceInterval)

    def __binData(self):

        numCols = (self.extent.XMax - self.extent.XMin) / self.xCell
        numRows = (self.extent.YMax - self.extent.YMin) / self.yCell
        use_hexagons = False

        #### 2 Billion of Limits for Element Numbers ####
        if (self.numCols * self.numRows * self.numTime) >= 2000000000.:
            ARCPY.AddIDMessage("ERROR", 110005)
            raise SystemExit()

        noData = -9999.0
        mask3d = NUM.zeros((self.numTime, self.numRows, self.numCols), dtype= bool)
        data = NUM.zeros((self.numTime, self.numRows, self.numCols), dtype= 'f8')
        maskValue =  NUM.zeros((self.numRows,self.numCols), dtype = NUM.int32)

        ##### For Testing #####
        #for index in NUM.arange(20):
        #    slice = ARCPY.sa.Subset(self.rInfo, variables = self.fieldName,  dimension_definitions  = {self.dimensionName:self.timeValues[index]})

        timeValues = self.rInfo.getDimensionValues(self.fieldName, self.dimensionName)
        foundEmptySlice = {}

        if type(timeValues[0]) == tuple or self.irregular:

            #### Get Raster Slice ####
            slice = ARCPY.sa.Subset(self.rInfo, variables = self.fieldName)

            if self.getZone:
                dataValues = ARCPY.RasterToNumPyArray(slice, self.__getPoint(self.sourceExtent.XMin, self.sourceExtent.YMin), self.numCols, self.numRows, nodata_to_value = noData)
            else:
                dataValues = ARCPY.RasterToNumPyArray(slice, nodata_to_value = noData)

            ARCPY.SetProgressor("step", "Getting data...", 0, len(self.timeData), 1)
            for index, time in enumerate(timeValues):
                #### Get Null Values ####
                dataByRow = dataValues[:,:,index]
                useNulls = True

                try:
                    if dataByRow.sum() == 0 or dataByRow.sum() == (noData*self.numCols*self.numRows):
                        foundEmptySlice[index] = time
                except:
                    foundEmptySlice[index] = time
                    useNulls = False

                #### Get Null Values ####
                if dataByRow.shape != maskValue.shape: 
                    ARCPY.AddIDMessage("ERROR",110316)
                    raise SystemExit

                nll = dataByRow != noData
                maskValue = maskValue + nll
                mask3d[index,:] = nll

                dataByRowSafe = NUM.require(dataByRow, dtype='f8', requirements=['A', 'O', 'C'])
                data[index,:] = dataByRowSafe

                ARCPY.SetProgressorPosition()

        else:
            ARCPY.SetProgressor("step", "Getting data...", 0, len(self.timeData), 1)
            
            for index, time in enumerate(timeValues):

                #### Get Raster Slice ####
                slice = ARCPY.sa.Subset(self.rInfo, variables = self.fieldName,  dimension_definitions  = {self.dimensionName:time})

                #### Get Data Slice ####
                if self.getZone:
                    dataByRow = ARCPY.RasterToNumPyArray(slice, self.__getPoint(self.sourceExtent.XMin, self.sourceExtent.YMin), self.numCols, self.numRows, nodata_to_value = noData)
                else:
                    dataByRow = ARCPY.RasterToNumPyArray(slice, nodata_to_value = noData)

                useNulls = True

                try:
                    if dataByRow.sum() == 0 or dataByRow.sum() == (noData*self.numCols*self.numRows):
                        foundEmptySlice[index] = time
                except:
                    foundEmptySlice[index] = time
                    useNulls = False

                if useNulls:
                    if dataByRow.shape != maskValue.shape: 
                        ARCPY.AddIDMessage("ERROR",110316)
                        raise SystemExit

                    #### Get Null Values ####
                    nll = dataByRow != noData
                    maskValue = maskValue + nll
                    mask3d[index,:] = nll

                dataByRowSafe = NUM.require(dataByRow, dtype='f8', requirements=['A', 'O', 'C'])
                data[index,:] = dataByRowSafe

                ARCPY.SetProgressorPosition()

        if len(foundEmptySlice):
            ARCPY.AddIDMessage("WARNING", 110303,",".join([str(id) for index, id in enumerate(foundEmptySlice.values()) if index < 30] ))

        maskValue = maskValue != 0
        self.generalMask = maskValue
        self.validIds = NUM.where(maskValue.ravel())[0]

        #### Fill 
        #for index in foundEmptySlice.keys():
        #    mask3d[index] = maskValue

        if len(self.validIds) ==  0:
            ARCPY.AddIDMessage("ERROR", 110120)
            raise SystemExit

        upperName = self.fieldName.upper()
        varName = "{}_{}_{}".format(upperName, "NONE", self.predictionTypes[0])

        pred = CUTILS.pred2Number[self.predictionTypes[0]]

        cField = SSDO.CandidateField(varName, "DOUBLE")
        maskName = varName +"_MASK"

        maskOnes = NUM.ones((self.numRows, self.numCols), dtype = bool)

        #### Fill Empty Values ####
        mask2D = ARC._ss.fill_missing_values_in_cube(data, mask3d, maskValue, self.cellSize, pred)

        if type(mask2D) == bool:
            mask2D = maskValue
        else:
            if (mask2D == False).sum() == len(mask2D):
                ARCPY.AddIDMessage("ERROR", 110216, 1)
                raise SystemExit
            else:
                mask2D = mask2D.reshape((self.numRows, self.numCols))

        self.fromRaster = True

        #### Create New Grid Variable ####
        field = GridField(cField, fieldName = varName,
                            fieldType = "Double", alias = varName,
                            maskName = maskName)

        field.data = data
        self.fields[varName] = field

        if self.isSquaredCell:
            field.mask = mask2D
            self.fieldNames=[varName ]
        else:
            if len(mask2D.shape) == 2:
                field.mask = mask2D*maskValue
            else:
                field.mask = mask2D*maskValue.ravel()

            self.fieldNames=[varName ]
        ARCPY.SetProgressor("default", "Creating Cube ...")
        del self.rInfo

    def getNumLocations(self):
        return len(self.validIds), self.numTime, len(self.validIds)*self.numTime

    def createCell(self, x,y):
        """Create a bounding polygon cell list from a given centroid."""

        polyArray = ARCPY.Array()
        subArray = ARCPY.Array()
        x -= self.oxCellHalf
        y += self.oyCellHalf

        points =  [ (x,y), (x+self.oxCell, y), (x+self.oxCell, y-self.oyCell),
                 (x, y-self.oyCell), (x,y) ]

        for x0,y0 in points:
            pointOut = ARCPY.Point(x0, y0)
            subArray.add(pointOut)

        polyArray.add(subArray)

        if self.shouldReproject:
            polygonInfo  = ARCPY.Polygon(polyArray, self.origSRF).projectAs(self.spatialRef)
            if polygonInfo.area == 0:
                ARCPY.AddIDMessage("ERROR", 110294, self.origSRF.name, self.spatialRef.name)
                raise SystemExit
            return polygonInfo

        pol =  ARCPY.Polygon(polyArray, self.spatialRef)
        return pol

    def getShapes(self):
        centroids = self.sourceXY[self.validIds]
        shapes = []

        #### creating new polygons ####
        for center in centroids:
            shapes.append(self.createCell(center[0], center[1]))

        return shapes

