# coding: utf-8
"""
Tool Name: Optimized Hot Spot Analysis (Getis-Ord Gi*)
Source Name: OptimizedHotSpotAnalysis.py
Version: ArcGIS 10.1.2
Author: ESRI

Optimized version of Hot-Spot Analysis.  Given incident points or
weighted features (points or polygons), creates a map of statistically
significant hot and cold spots.  It evaluates the characteristics of
the input feature class to produce optimal results.
"""

################### Imports ########################
import sys as SYS
import math as MATH
import os as OS
import numpy as NUM
import collections as COLL
import arcgisscripting as ARC
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.da as DA
import arcpy.analysis as ANA
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import Stats as STATS
import WeightsUtilities as WU
import gapy as GAPY
import locale as LOCALE
import MoransI_Increment as MI
import CollectEvents as EVENTS
import Gi as GISTAR
import json as JSON
import time as TIME
import GeoenrichmentCore as ENRICH
import importlib
importlib.reload(SSDO)
importlib.reload(GISTAR)
LOCALE.setlocale(LOCALE.LC_ALL, '')

############################ Local Variables ###############################
supportDist = ["FEET", "METERS", "KILOMETERS", "MILES"]

nnScale = 2.0
numPerms = None
minNumNeighsSet = 3
maxNumNeighsSet = 30
minNumFeatures = 30
additionalZeroDistScale = "ALL"
hexScale = NUM.sqrt(3.0)
indentAnswerStr = "    - "

aggTypes = {"SNAP_NEARBY_INCIDENTS_TO_CREATE_WEIGHTED_POINTS" : 0,
            "COUNT_INCIDENTS_WITHIN_FISHNET_POLYGONS": 1,
            "COUNT_INCIDENTS_WITHIN_AGGREGATION_POLYGONS": 2,
             "COUNT_INCIDENTS_WITHIN_HEXAGON_POLYGONS": 3}

aggMins = {0:60, 1:30, 2:30, 3:30}
aggHeaders = {0:84448, 1:84456, 2:84456, 3:84456}
aggOutliers = {0:84494, 1:84495, 2:84496, 3:84700}
mercatorProjection = ARCPY.SpatialReference(54004)

errorsAndWarnings = {
  906:'Zero variance:  all of the values for your input field are likely the same.',
  932:'AREA must be greater than zero.',
  973:'Could not render output based on default layer file.',
  1533:'The data is not appropriate for this incident aggregation method.',
  1534:'The number of incidents within each of the user-provided aggregation polygons is the same. Please choose a different polygon dataset or a different aggregation method.',
  1535:'The analysis option you selected requires a minimum of ${minNumFeatures} aggregation areas.',
  1536:'The analysis options you selected require a minimum of ${minNumIncidents} ${dataType} to compute hot and cold spots.',
  1571:'The analysis options you selected require a minimum of {0} {1} with valid data in the analysis field in order to compute hot and cold spots.'
  }

cleanUpList = []
startExtent = ARCPY.env.extent

############################ Local Methods ##############################

def checkLicense():
    spatial = ARCPY.CheckExtension('spatial').upper() == "AVAILABLE"
    productInfo = ARCPY.ProductInfo()
    pro = productInfo  in ["ArcInfo", "ArcServer"]
    return spatial and pro

def getPolyExtent(polyDict):
    pointList = []
    for ind, poly in UTILS.iteritems(polyDict):
        for point in poly:
            pointList.append(point)

    points = NUM.array(pointList)
    minX, minY = points.min(0)
    maxX, maxY = points.max(0)
    return ARCPY.Extent(minX, minY, maxX, maxY)

def returnJSON_FromError(msgID, msgType, listOfStringKeys = [],
                                         listOfStringVals = [],
                                         rowStyle = 'error'):

    ARCPY.AddIDMessage(msgType.upper(), msgID, *listOfStringVals)

    if msgType.upper() == "ERROR":
        cleanUp()
        raise SystemExit()

def returnJSON_Table(msgID, msg, listOfStringArgs = [], listOfStringVals = [], rowStyle = 'table'):
    """Message takes array as for columns in table"""
    allDict = {}
    paramDict = {}
    if len(listOfStringArgs):
        for ind, stringVal in enumerate(listOfStringArgs):
            if listOfStringVals:
                paramDict["%s" % stringVal] = listOfStringVals[ind]
            else:
                paramDict["%s" % stringVal] = "%s" % stringVal
            msg = [m.replace("{%i}" % ind, "${%s}" % stringVal) for m in msg]

    allDict['message'] = msg
    allDict['messageCode'] = "SS_" + str(msgID).rjust(5, '0')
    allDict['params'] = paramDict
    allDict['style'] = rowStyle
    jsonMess = JSON.dumps(allDict)
    ARCPY.gp.AddMessage(jsonMess, 55)

def returnJSON_FromMessageMatch(msgID, listOfStringKeys, listOfStringVals, rowStyle = '<span></span>'):
    msg = ARCPY.GetIDMessage(msgID)

    allDict = {}
    paramDict = {}
    if len(listOfStringKeys):
        for ind, keyVal in enumerate(listOfStringKeys):
            paramDict[keyVal] = listOfStringVals[ind]
            msg = msg.replace("{%i}" % ind, "${%s}" % keyVal)

    allDict['message'] = msg
    allDict['messageCode'] = "SS_" + str(msgID).rjust(5, '0')
    allDict['params'] = paramDict
    allDict['style'] = rowStyle
    jsonMess = JSON.dumps(allDict)
    ARCPY.gp.AddMessage(jsonMess, 55)

def returnJSON_FromID(msgID, rowStyle = '<span></span>'):
    msg = ARCPY.GetIDMessage(msgID)

    allDict = {}
    allDict['message'] = msg
    allDict['messageCode'] = "SS_" + str(msgID).rjust(5, '0')
    allDict['params'] = {}
    allDict['style'] = rowStyle
    jsonMess = JSON.dumps(allDict)
    ARCPY.gp.AddMessage(jsonMess, 55)

def printWeightAnswer(y):
    """Describes the Weight/Analysis/Count Field."""

    minY = y.min()
    maxY = y.max()
    avgY = y.mean()
    stdY = y.std()

    minStr = ARCPY.GetIDMessage(84271)
    maxStr = ARCPY.GetIDMessage(84272)
    avgStr = ARCPY.GetIDMessage(84261)
    stdStr = ARCPY.GetIDMessage(84262)

    minString = LOCALE.format("%0.4f", minY)
    maxString = LOCALE.format("%0.4f", maxY)
    avgString = LOCALE.format("%0.4f", avgY)
    stdString = LOCALE.format("%0.4f", stdY)
    row1 = [minStr+":", "{0}"]
    row2 = [maxStr+":", "{0}"]
    row3 = [avgStr+":", "{0}"]
    row4 = [stdStr+":", "{0}"]

    returnJSON_Table(84271, row1, ["MinValue"], [minString],
                     rowStyle = "<table style='width: 200px;margin-left: 2.5em;border: none;' class='table-plain'><tbody><tr><td style='border: none;'></td><td style='float:right;border: none;'></td></tr>")
    returnJSON_Table(84272, row2, ["MaxValue"], [maxString],
                     rowStyle = "<tr><td style='border: none;'></td><td style='float: right;border: none;'></td></tr>")
    returnJSON_Table(84261, row3, ["AvgValue"], [avgString],
                     rowStyle = "<tr><td style='border: none;'></td><td style='float: right;border: none;'></td></tr>")
    returnJSON_Table(84262, row4, ["StdValue"], [stdString],
                     rowStyle = "<tr><td style='border: none;'></td><td style='float: right;border: none;'></td></tr></tbody></table>")

def printOHSLocationalOutliers(outliers, aggType = 1):
    """Prints the results of input incident locational outliers."""

#    returnJSON_FromID(84438)
    numOutliers = len(outliers)
    aggResult = ARCPY.GetIDMessage(aggOutliers[aggType])
    if numOutliers:
        if numOutliers == 1:
            returnJSON_FromMessageMatch(84493, ["AggregationType"],
                                        [aggResult], rowStyle = '<ul><li></li></ul>')
        else:
            returnJSON_FromMessageMatch(84434, ["NumOutliers", "AggregationType"],
                                        [str(numOutliers), aggResult],
                                        rowStyle = '<ul><li></li></ul>')
    else:
        printOHSBullet(84437)

def printOHSTitle(messID):
    """Prints Title Message Header to Results Window."""
    returnJSON_FromID(messID, rowStyle = '<u><b></b></u><br/>')

def printOHSBullet(messID):
    """Prints Title Message Header to Results Window."""
    returnJSON_FromID(messID, rowStyle = '<ul><li></li></ul>')

def knnDecision(ssdo):
    """If no peak autocorrelation distance is found, then return the average
    at which all features have a desired set of nearest neighbors.  This value
    is scaled to be larger than 3 and no larger than 30.  If computed value is
    larger than 1 standard distance, then return the standard distance
    instead.

    INPUTS:
    ssdo (class): instance of Spatial Stats Data Object
    """

    numNeighs = int(ssdo.numObs * .05)
    if numNeighs < minNumNeighsSet:
        numNeighs = minNumNeighsSet
    if numNeighs > maxNumNeighsSet:
        numNeighs = maxNumNeighsSet

    #### KNN Subject ####
    msg = ARCPY.GetIDMessage(84463)
    ARCPY.SetProgressor("step", msg, 0, ssdo.numObs, 1)
#    returnJSON_FromID(84463)

    #### Create k-Nearest Neighbor Search Type ####
    gaTable = ssdo.gaTable
    gaSearch = GAPY.ga_nsearch(gaTable)
    gaSearch.init_nearest(0.0, numNeighs, 'euclidean')
    neighDist = ARC._ss.NeighborDistances(gaTable, gaSearch)
    N = len(gaTable)
    distances = NUM.empty((N, ), float)

    #### Find All Nearest Neighbor Distance ####
    for row in UTILS.ssRange(N):
        distances[row] = neighDist[row][-1][-1]
        ARCPY.SetProgressorPosition()

    #### Make Sure it is not Larger Than Standard Distance ####
    meanDist = distances.mean()
    if ssdo.useChordal:
        distValue = UTILS.roof(meanDist)
        distanceStr = ssdo.distanceInfo.printDistance(distValue)
        returnJSON_FromMessageMatch(84464, ["NumNeighs", "DistanceInfo"],
                                    [str(numNeighs), distanceStr],
                                     rowStyle = '<ul><li></li></ul><br/>')
    else:
        sd = UTILS.standardDistanceCutoff(ssdo.xyCoords)
        if meanDist > sd:
            distValue = UTILS.roof(sd)
            distanceStr = ssdo.distanceInfo.printDistance(distValue)
            returnJSON_FromMessageMatch(84465, ["DistanceInfo"], [distanceStr],
                                        rowStyle = '<ul><li></li></ul><br/>')
        else:
            distValue = UTILS.roof(meanDist)
            distanceStr = ssdo.distanceInfo.printDistance(distValue)
            returnJSON_FromMessageMatch(84464, ["NumNeighs", "DistanceInfo"],
                                        [str(numNeighs), distanceStr],
                                        rowStyle = '<ul><li></li></ul><br/>')

    return distValue

def checkNumberPolygons(numObs):
    if numObs < minNumFeatures:
        ARCPY.AddIDMessage("ERROR", 1535, str(minNumFeatures))
        raise SystemExit()

def enrichLayer(inputLayer, service_url, entoken, referer):
        startTime = TIME.time()
        inputLayerShapeType = ARCPY.Describe(inputLayer).shapeType
        res = ARCPY.GetCount_management(inputLayer)
        inputLayerCount = int(res.getOutput(0))
        bfEnrich = ARCPY.ListFields(inputLayer, "TOTPOP*")
        analysisVariables = ["KeyGlobalFacts.TOTPOP"]

        geoenrichParams = {"inputLayer": inputLayer,
                           "inputLayerShapeType": inputLayerShapeType,
                           "inputLayerCount": inputLayerCount,
                           "analysisVariables": analysisVariables,
                           }

        enrichOut = ENRICH.GeoEnrichFeatures(service_url, entoken, referer, **geoenrichParams)
        enrichedLayer = enrichOut.geoEnrich(startTime)
        afEnrich = ARCPY.ListFields(enrichedLayer, "TOTPOP*")
        bfField = [b.name for b in bfEnrich]
        afField = [a.name for a in afEnrich]
        tpField = [tp for tp in afField if not tp in bfField][0]
        return enrichedLayer, tpField

def setupOptHotSpot():
    """Retrieves the parameters from the User Interface and executes the
    appropriate commands."""

    #### Input Parameters ####
    inputFC = ARCPY.GetParameterAsText(0)
    outputFC = ARCPY.GetParameterAsText(1)
    varName = UTILS.getTextParameter(2, fieldName = True)
    aggMethod = UTILS.getTextParameter(3)
    if aggMethod:
        aggType = aggTypes[aggMethod.upper()]
    else:
        aggType = 1

    boundaryFC = UTILS.getTextParameter(4)
    polygonFC = UTILS.getTextParameter(5)
    outputRaster = UTILS.getTextParameter(6)

    userCellSize, userCellUnit = UTILS.getLinearUnitParameter(7)
    userBandSize, userBandUnit = UTILS.getLinearUnitParameter(8)
    useDefaultDistance = False
    useDefaultBand = False

    if userCellUnit is None:
        useDefaultDistance = True

    if userBandUnit is None:
        useDefaultBand = True

    #### Check Number of Polygons ####
    if polygonFC and aggType == 2:
        ssdoPoly = SSDO.SSDataObject(polygonFC)
        ssdoPoly.obtainData(ssdoPoly.oidName)
        checkNumberPolygons(ssdoPoly.numObs)

    normField = UTILS.getTextParameter(9, fieldName = True)
    service_url = UTILS.getTextParameter(10)
    entoken = UTILS.getTextParameter(11)
    referer = UTILS.getTextParameter(12)

    makeFeatureLayerNoExtent = UTILS.clearExtent(DM.MakeFeatureLayer)
    selectLocationNoExtent = UTILS.clearExtent(DM.SelectLayerByLocation)
    featureLayer = "InputOHSA_FC"
    featureLayerInit = "InputOHSA_Init_FC"
    if normField == "ESRIPOPULATION":
        if varName:
            inputFC, normField = enrichLayer(inputFC, service_url, entoken, referer)

    makeFeatureLayerNoExtent(inputFC, featureLayerInit)
    selectionType = UTILS.getSelectionType(featureLayerInit)

    #### Handle Current Selection and Study Area Selection ####
    if aggType == 1 or aggType == 3:
        if boundaryFC:
            selectLocationNoExtent(featureLayerInit, "INTERSECT",
                                   boundaryFC, "#",
                                   selectionType)
        polygonFC = None

    elif aggType == 2:
        selectLocationNoExtent(featureLayerInit, "INTERSECT",
                               polygonFC, "#",
                               selectionType)
        boundaryFC = None

    else:
        boundaryFC = None
        polygonFC = None

    DM.CopyFeatures(featureLayerInit, "copyInput")
    #### Drop Zero Norm records ####
    if normField and varName:
        copyLayer = "copyLayer"
        makeFeatureLayerNoExtent("copyInput", copyLayer)
        selectAttrType = UTILS.getSelectionType(copyLayer)
        sqlString = u"{} <> 0".format(normField)
        ARCPY.SelectLayerByAttribute_management(copyLayer, selectAttrType, sqlString)
        makeFeatureLayerNoExtent(copyLayer, featureLayer)
        ARCPY.AddMessage("Count {}".format(UTILS.getCount(featureLayer)))
#         UTILS.passiveDelete(copyLayer)

    else:
        makeFeatureLayerNoExtent("copyInput", featureLayer)
    UTILS.passiveDelete(featureLayerInit)
#     UTILS.passiveDelete(copyInput)

    #### Create SSDO ####
    ssdo = SSDO.SSDataObject(featureLayer, templateFC = outputFC,
                             useChordal = True)

    extentFactor = ssdo.distanceInfo.convertFactor
    processingBandSize = None
    processingCellSize = None
    bandSizeOrigin = None

    if not useDefaultBand:
        bandSizeStr, bandSizeFactor = UTILS.distanceUnitInfo[userBandUnit]
        processingBandSize = (userBandSize * bandSizeFactor) / extentFactor
        bandSizeOrigin = ARCPY.GetParameterAsText(8)

    if not useDefaultDistance:
        cellSizeStr, cellSizeFactor = UTILS.distanceUnitInfo[userCellUnit]
        processingCellSize = (userCellSize * cellSizeFactor) / extentFactor
    hs = OptHotSpots(ssdo, outputFC, varName = varName, normField = normField,
                     aggType = aggType, polygonFC = polygonFC,
                     boundaryFC = boundaryFC, outputRaster = outputRaster,
                     cellSize2Use = processingCellSize, bandSize2Use = processingBandSize,
                     bandSizeOrigin=bandSizeOrigin, service_url = service_url, entoken = entoken, referer = referer)

    DM.Delete(featureLayer)

class OptHotSpots(object):
    """Optimized Hot-Spot Analysis Super Class.

    INPUTS:
    ssdo (obj): instance of SSDataObject where data has NOT been loaded
    outputFC (str): path to the output feature class
    varName {str, None}: name of the analysis/weight field
    aggType {int, 1}: type of aggregation method for unmarked points
    polygonFC {str, None}: path to polygons for aggregating incidents
    boundaryFC {str, None}: path to polygon(s) defining study area
    cellSizeOrigin {str, None}: original value and unit of the cell size before transformation
    bandSizeOrigin {str, None}: original value and unit of the band size before transformation

    """

    def __init__(self, ssdo, outputFC, varName = None,
                 normField = None, aggType = 1, polygonFC = None,
                 boundaryFC = None, outputRaster = None,
                 cellSize2Use = None, bandSize2Use = None,
                 parameters=None, cellSizeOrigin = None, bandSizeOrigin = None,
                 service_url = None, entoken = None, referer = None):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())
        ARCPY.env.overwriteOutput = True
        self.startExtent = ARCPY.env.extent
        ARCPY.env.extent = ""
        self.cleanUpList = []
        self.cellSizeOrigin = cellSizeOrigin
        self.bandSizeOrigin = bandSizeOrigin

        if parameters is None:
            self.params = ARCPY.gp.GetParameterInfo()
        else:
            self.params = parameters

        #### Explicitly Remove Raster by Analysis Type ####
        if not varName and aggType != 0:
            self.outputRaster = None

        #### Explicitly Remove Raster by License ####
        if self.outputRaster is not None:
            if not checkLicense():
                self.outputRaster = None
                ARCPY.AddIDMessage("WARNING", 110049)

        #### Runtime Checks ####
        if self.varName:
            self.varPopName = self.varName
        else:
            self.varPopName = None
            if self.aggType == 0:
                self.boundaryFC = None
                self.polygonFC = None
            if self.aggType == 1:
                self.polygonFC = None
            if self.aggType == 2:
                self.boundaryFC = None
            if self.aggType == 3:
                self.polygonFC = None

        #### Hot Spot Subject String (Incident Counts or Fieldname Values ####
        if self.varPopName:
            varString = self.varPopName + " " + ARCPY.GetIDMessage(84468)
        else:
            varString = ARCPY.GetIDMessage(84469)
        self.varString = varString
        self.normField = normField
        self.service_url = service_url
        self.entoken = entoken
        self.referer = referer

        #### Initalize and Analyze ####
        ARCPY.AddMessage("initial")
        self.initialize()
        ARCPY.AddMessage("dohotspots")
        self.doHotSpots()

        #### Raster Output ####
        if self.outputRaster:
            self.doRaster(self.outputRaster, varName = self.varPopName)
        cleanUp()

    def initialize(self):
        #### Decision Tree ####
        if not self.varName:
            ARCPY.AddMessage("2") 
            #### Unmarked Points ####
            self.minNumIncidents = aggMins[self.aggType]
            if self.aggType == 0:
                self.doIntegrate()
            elif self.aggType == 2:
                self.doPoint2Poly()
            else:
                self.doGrid()

        else:
            #### Weighted Features ####
            ARCPY.AddMessage("1")
            self.setAnalysisSSDO(self.ssdo.inputFC, self.varName)

    def checkPolygons(self, numObs):
        if numObs < minNumFeatures:
            returnJSON_FromError(1535, "ERROR", ["minNumFeatures"],
                                 [str(minNumFeatures)])
        else:
            returnJSON_FromMessageMatch(84491, ["NumFeatures"], [str(numObs)],
                                        rowStyle = '<ul><li></li></ul>')

    def checkBoundary(self, projection = None):
        explicSpatRef = self.ssdo.spatialRef

        if projection:
            explicSpatRef = projection
#        returnJSON_FromID(84486)

        #### Assure That There Is Only a Single Polygon ####
        cnt = UTILS.getCount(self.boundaryFC)

        #### Dissolve Polys into Boundary ####
        dissolveFC = UTILS.returnScratchName("Diss_OHSA_",
                                             scratchWS = ARCPY.env.scratchGDB)
        DM.Dissolve(self.boundaryFC, dissolveFC, "#", "#", "SINGLE_PART",
                    "DISSOLVE_LINES")
        self.boundaryFC = dissolveFC
        cleanUpList.append(dissolveFC)

        #### Read Boundary FC ####
        ssdoBound = SSDO.SSDataObject(self.boundaryFC,
                                 explicitSpatialRef = explicSpatRef,
                                 silentWarnings = True,
                                 useChordal = True)

        polyDict, polyAreas = UTILS.readPolygonFC(self.boundaryFC,
                                spatialRef = explicSpatRef,
                                useGeodesic = self.ssdo.useChordal)
        self.boundArea = sum(polyAreas.values())
        self.boundExtent = UTILS.getPolyExtent(polyDict)

        del ssdoBound

        if UTILS.compareFloat(0.0, self.boundArea):
            #### Invalid Study Area ####
            returnJSON_FromError(932, "ERROR")
            raise SystemExit()
        else:
            areaStr = self.ssdo.distanceInfo.printDistance(self.boundArea)
            returnJSON_FromMessageMatch(84492, ["Area"], [areaStr],
                                        rowStyle = "<ul><li></li></ul>")

    def checkIncidents(self, numObs):
        self.cnt = numObs
        if (self.aggType == 1 or self.aggType == 3) and not self.boundaryFC:
            #### Fish w/o Boundary Requires Twice Number ####
            self.minNumIncidents = self.minNumIncidents * 2
        if self.cnt < self.minNumIncidents:
            if self.aggType in [0, 1, 3]:
                if self.boundaryFC:
                    returnJSON_FromError(1570, "ERROR", ["minNumIncidents"],
                                         [str(self.minNumIncidents)])
                else:
                    returnJSON_FromError(1536, "ERROR",
                                         ["minNumIncidents", "dataType"],
                                         [str(self.minNumIncidents),
                                          ARCPY.GetIDMessage(84501)])
            else:
                returnJSON_FromError(1574, "ERROR", ["minNumIncidents"],
                                         [str(self.minNumIncidents)])

        returnJSON_FromMessageMatch(84485, ["NumFeatures"], [str(self.cnt)],
                                    rowStyle = "<ul><li></li></ul>")


    def doPoint2Poly(self):

        #### Initial Data Assessment ####
        printOHSTitle(84428)
#        returnJSON_FromID(84431)
        initCount = UTILS.getCount(self.ssdo.inputFC)
        if initCount == 0:
            self.checkIncidents(initCount)
        else:
            self.ssdo.obtainData(self.ssdo.oidName)
            self.checkIncidents(self.ssdo.numObs)
        if len(self.ssdo.badRecords):
            ARCPY.AddMessage("\n")

        #### Checking Polygon Message ####
#        returnJSON_FromID(84430)

        #### Spatial Join (Hold Messages) ####
        outputFieldMaps = "EMPTY"
        tempFC = UTILS.returnScratchName("Join_OHSA_",
                                         scratchWS = ARCPY.env.scratchGDB)
        cleanUpList.append(tempFC)

        if self.normField:
            outputFieldMaps = ARCPY.FieldMappings()
            outputFieldMaps.addTable(self.polygonFC)

        joinWithSpatialRef = UTILS.funWithSpatialRef(ANA.SpatialJoin,
                                                     self.ssdo.spatialRef,
                                                     outputFC = tempFC)
        joinWithXY = UTILS.funWithXYTolerance(joinWithSpatialRef,
                                              self.ssdo.distanceInfo)
        joinWithXY(self.polygonFC, self.ssdo.inputFC, tempFC,
                   "JOIN_ONE_TO_ONE", "KEEP_ALL",
                   outputFieldMaps)

        #### Set VarName, MasterField, AnalysisSSDO ####
        if self.normField:
            if self.normField == "ESRIPOPULATION":
                tempFC, self.normField = enrichLayer(tempFC, self.service_url, self.entoken, self.referer)
            tempLayer = "Temp_Layer"
            ARCPY.MakeFeatureLayer_management(tempFC, tempLayer)
            selectAttrType = UTILS.getSelectionType(tempLayer)
            sqlString = u"{} <> 0".format(self.normField)
            ARCPY.SelectLayerByAttribute_management(tempLayer, selectAttrType, sqlString)
            self.checkPolygons(UTILS.getCount(tempLayer))
            self.createAnalysisSSDO(tempLayer, "JOIN_COUNT")
        else:
            self.createAnalysisSSDO(tempFC, "JOIN_COUNT")

    def validateRaster(self, ssdoCoords):

        returnJSON_FromID(84439)
        envMask = ARCPY.env.mask
        maskExists = False
        if envMask:
            try:
                descMask = ARCPY.Describe(envMask)
                maskExists = True
            except:
                maskExists = False

        if not envMask or not maskExists:
            #### Use Convex Hull ####
            msg = ARCPY.GetIDMessage(84440)
            ARCPY.SetProgressor("default", msg)
            # printOHSAnswer(msg)
            boundaryFC = UTILS.returnScratchName("HULL_OHSA_",
                                                 scratchWS = ARCPY.env.scratchGDB)
            UTILS.minBoundGeomPoints(ssdoCoords, boundaryFC,
                                     geomType = "CONVEX_HULL",
                                     spatialRef = self.ssdo.spatialRef)
            self.boundaryFC = boundaryFC
            cleanUpList.append(boundaryFC)

        self.maskExists = maskExists

    def doIntegrate(self):
        #### Read All Points ####
        ssdo = self.ssdo
        ssdo.obtainData(ssdo.oidName, requireSearch = True)

        #### Initial Data Assessment ####
        printOHSTitle(84428)
#        returnJSON_FromID(84431)

        #### Find Unique Locations ####
        msg = ARCPY.GetIDMessage(84441)
        ARCPY.SetProgressor("default", msg)
        self.checkIncidents(ssdo.numObs)

        #### CellSize and Locational Outliers ####
        lo = UTILS.LocationInfo(ssdo)
        cellSize, threshold, meanDist, outliers = lo.getNearestNeighborInfo()
        printOHSLocationalOutliers(outliers, aggType = self.aggType)

        #### Raster Boundary ####
        if self.outputRaster:
            self.validateRaster(ssdo.xyCoords)

        #### Agg Header ####
        printOHSTitle(84444)

        #### Copy Features for Integrate ####
        msg = ARCPY.GetIDMessage(84443)
        ARCPY.SetProgressor("default", msg)
        intFC = UTILS.returnScratchName("Int_OHSA_",
                                         scratchWS = ARCPY.env.scratchGDB)
        cleanUpList.append(intFC)
        DM.CopyFeatures(self.ssdo.inputFC, intFC)

        #### Make Feature Layer To Avoid Integrate Bug with Spaces ####
        mfc = "Integrate_MFC_2"
        DM.MakeFeatureLayer(intFC, mfc)
        cleanUpList.append(mfc)

        #### Snap Subject ####
#        returnJSON_FromID(84442)
        nScale = (ssdo.numObs * 1.0) / self.cnt
        nonZeroAvgDist = lo.meanDist
        nonZeroMedDist = lo.getMedian()
        if nonZeroAvgDist < nonZeroMedDist:
            useDist = nonZeroAvgDist * nScale
            useType = "average"
        else:
            useDist = nonZeroMedDist * nScale
            useType = "median"
        distance2Integrate = lo.distances[lo.distances < useDist]
        distance2Integrate = NUM.sort(distance2Integrate)
        numDists = len(distance2Integrate)

        #### Max Snap Answer ####
        useDistStr = self.ssdo.distanceInfo.printDistance(useDist)
#        returnJSON_FromMessageMatch(84445, ["DistanceInfo"], [useDistStr],
#                                    rowStyle = "<ul><li></li></ul><br/>")

        percs = [10, 25, 100]
        indices = [ int(numDists * (i * .01)) for i in percs ]
        if indices[-1] >= numDists:
            indices[-1] = -1

        if len(distance2Integrate):
            ARCPY.SetProgressor("default", msg)
            for pInd, dInd in enumerate(indices):
                dist = distance2Integrate[dInd]
                snap = self.ssdo.distanceInfo.linearUnitString(dist,
                                                               convert = True)
                DM.Integrate(mfc, snap)

        #### Run Collect Events ####
        collectedFC = UTILS.returnScratchName("Coll_OHSA_",
                                               scratchWS = ARCPY.env.scratchGDB)
        cleanUpList.append(collectedFC)
        intSSDO = SSDO.SSDataObject(intFC,
                                    explicitSpatialRef = self.ssdo.spatialRef,
                                    silentWarnings = True,
                                    useChordal = True)
        EVENTS.collectEvents(intSSDO, collectedFC, silentWarnings = True)
        descTemp = ARCPY.Describe(collectedFC)
        oidName = descTemp.oidFieldName

        #### Delete Integrated FC ####
        del intSSDO

        #### Set VarName, MasterField, AnalysisSSDO ####
        self.createAnalysisSSDO(collectedFC, "ICOUNT")

    def doGrid(self):
        #### Read All Points ####
        ssdo = self.ssdo
        ssdo.obtainData(ssdo.oidName, requireSearch = True)

        #### Initial Data Assessment ####
        printOHSTitle(84428)
        # printOHSSubject(84431, addNewLine = False)
        msg = ARCPY.GetIDMessage(84441)
        ARCPY.SetProgressor("default", msg)
        self.checkIncidents(ssdo.numObs)

        #### Find Unique Locations ####
        ARCPY.SetProgressor("default", msg)
        msg = ARCPY.GetIDMessage(84441)

        #### CellSize and Locational Outliers ####
        if self.cellSize2Use:
            cellSize = self.cellSize2Use
        else:
            #### CellSize and Locational Outliers ####
            lo = UTILS.LocationInfo(ssdo)
            cellSize, threshold, meanDist, outliers = lo.getNearestNeighborInfo()
            printOHSLocationalOutliers(outliers, aggType = self.aggType)

        ### Verify Aggregation Type ###
        self.useHexagons = self.aggType == 3

        boundaryExtent = None
        boundarySpatialRef = None
        if self.boundaryFC:
            if ssdo.useChordal:
                self.checkBoundary(mercatorProjection)
            else:
                self.checkBoundary()
            boundaryExtent = self.boundExtent

        if self.useHexagons:
            cellSize = cellSize / hexScale
            hexWidth = cellSize * 2.0
            hexHeight = cellSize * hexScale
            cellSizeMSG = 84698
            creatingMSG = 84697
            countMSG = 84699
        else:
            creatingMSG = 84449
            countMSG = 84451
            cellSizeMSG = 84450

        #### Agg Header ####
        printOHSTitle(84444)
        if self.boundaryFC:
            if self.useHexagons:
                countMSGNumber = 84701
            else:
                countMSGNumber = 84453

        else:
            if self.useHexagons:
                countMSGNumber = 84702
            else:
                countMSGNumber = 84452
            extent = None
            forMercExtent = self.ssdo.extent

        if ssdo.useChordal:
            xyCoordsProjected = ARC._ss.lonlat_to_xy_projected(ssdo.xyCoords,
                                                               ssdo.spatialRef,
                                                               mercatorProjection)
        else:
            fishOutputCoords = ssdo.spatialRef
            xyCoordsProjected = ssdo.xyCoords

        #### Fish Subject ####
        # printOHSSubject(creatingMSG, addNewLine = False)

        #### Create Temp Grid Feature Class for Analysis ####
        aggFCNew  = UTILS.returnScratchName("Agg_OHSA_",
                                            scratchWS = ARCPY.env.scratchGDB)
        self.cleanUpList.append(aggFCNew)

        #### Aggregate All Points to Grid ####
        self.aggregation(aggFCNew, ssdo, xyCoordsProjected,
                         cellSize, boundaryExtent)

        #### Cell Size Answer ####
        if self.cellSizeOrigin:
            snapStr = self.cellSizeOrigin
        else:
            snapStr = ssdo.distanceInfo.printDistance(cellSize)
        if not self.useHexagons:
            msg = ARCPY.GetIDMessage(cellSizeMSG).format(snapStr)
            returnJSON_FromMessageMatch(cellSizeMSG, ["SnapInfo"], [snapStr],
                                        rowStyle = "<ul><li></li></ul>")
        else:

            heighStr = self.ssdo.distanceInfo.printDistance(hexHeight)
            widthStr = self.ssdo.distanceInfo.printDistance(hexWidth)
            msg = ARCPY.GetIDMessage(cellSizeMSG).format(widthStr, heighStr)
            returnJSON_FromMessageMatch(cellSizeMSG, ["HexWidth", "HexHeight"], [widthStr, heighStr],
                                        rowStyle = "<ul><li></li></ul>")

        #### Fishnet Count Subject ####
        # printOHSSubject(countMSG, addNewLine = False)

        #### Project Back to GCS if Use Chordal ####
        if ssdo.useChordal:
            gridFC_ProjBack = UTILS.returnScratchName("Proj_OHSA_",
                                                      scratchWS = ARCPY.env.scratchGDB)
            DM.Project(aggFCNew, gridFC_ProjBack, ssdo.spatialRef)
            self.cleanUpList.append(aggFCNew)
            gridFC = gridFC_ProjBack
        else:
            gridFC = aggFCNew

        #### Create Empty Field Mappings to Ignore Atts ####
        fieldMap = ARCPY.FieldMappings()
        fieldMap.addTable(ssdo.inputFC)
        fieldMap.removeAll()

        #### Fishnet Count Answer ####
        # printOHSAnswer(ARCPY.GetIDMessage(countMSGNumber))

        if self.normField:
            gridFC, self.normField = enrichLayer(gridFC, self.service_url, self.entoken, self.referer)
            tempLayer = "Temp_Layer"
            ARCPY.MakeFeatureLayer_management(gridFC, tempLayer)
            selectAttrType = UTILS.getSelectionType(tempLayer)
            sqlString = u"{} <> 0".format(self.normField)
            ARCPY.SelectLayerByAttribute_management(tempLayer, selectAttrType, sqlString)
            self.checkPolygons(UTILS.getCount(tempLayer))
            self.createAnalysisSSDO(tempLayer, "JOIN_COUNT")
        else:
            self.createAnalysisSSDO(gridFC, "JOIN_COUNT")

    def aggregation(self, outputFC, ssdo, xyCoordsProjected,
                    cellBase, boundaryExtent = None ):
        """
        Aggregate data using fishnet/hexagons
        INPUT:
        outputFC (string): path feature class
        ssdo (SSDataObject): instance of SSDataObject
        xCoordsProjected (Array points): projected points
        boundaryExtent (Extent | ): boundary extend projected
        """

        #### Set All Time Periods to Zero ####
        timeBins = NUM.zeros((ssdo.numObs,), dtype = NUM.int32)

        #### Aggregate Cube Structure ####
        if  not self.boundaryFC:
            self.agg = ARC._ss.AggregateCube(xyCoordsProjected, cell_size = cellBase,
                                             use_hexagons = self.useHexagons,
                                             time_index = timeBins)
        else:
            extent = NUM.array(UTILS.getExtent(boundaryExtent))
            self.agg = ARC._ss.AggregateCube(xyCoordsProjected, cell_size = cellBase,
                                             use_hexagons = self.useHexagons,
                                             time_index = timeBins,
                                             extent = extent,
                                             adjust_extent= True)

        #### If the Aggregration is None, Exit ####
        if self.agg.num_cells == -1:
            raise SystemExit()

        #### Cube Info Class for Output ####
        self.cubeInfo = ARC._ss.CubeInfo(self.agg.num_rows, self.agg.num_cols, 1,
                                         cellBase, use_hexagons = self.useHexagons)
        self.sizeSlice = self.agg.num_rows * self.agg.num_cols

        #### Set Mask ####
        if self.boundaryFC:
            self.setPolygonMask(self.boundaryFC)
            mask = self.polygonMask
        else:
            mask = self.agg.default_mask

        #### Create Locations with Data ####
        locations = NUM.arange(self.sizeSlice, dtype = NUM.int32)
        self.locations = locations[mask]
        cellValues = self.agg.cell_values[mask]

        #### Create Output Fields ####
        locationField = SSDO.CandidateField("LOCATION", "LONG",
                                            data = self.locations,
                                            alias = "Location ID")
        countField = SSDO.CandidateField("JOIN_COUNT", "LONG",
                                         data = cellValues,
                                         alias = "Counts")

        #### Set Output Spatial Reference ####
        if ssdo.useChordal:
            spatialRef =  mercatorProjection
        else:
            spatialRef = ssdo.spatialRef

        self.createMesh(outputFC, [locationField, countField], spatialRef, mask)

    def createMesh(self, outputFC, candidateFieldList, spatialRef, mask):
        """
        Exports features to Grid Cells / Hexagons.
        INPUT:
            candidateFieldList (list): fieldName: SSDO.CandidateField
            outputFC (str): path of output feature class

        OUTPUT:
            2D fishnet feature class
        """

        #### Init and Output Progress ####
        ARCPY.env.overwriteOutput = True
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84006))

        #### Ensure Output Path Is Valid ####
        ERROR.checkOutputPath(outputFC)
        outPath, outName = OS.path.split(outputFC)

        #### Validate Fields ####
        valid = True
        numFields = len(candidateFieldList)
        if numFields:
            if candidateFieldList[0].name != "LOCATION":
                valid = False
        else:
            valid = False
        if not valid:
            #### Variable Not in Cube ####
            ARCPY.AddIDMessage("ERROR", 240)
            raise SystemExit()

        #### Checking Env Settings ####
        if ARCPY.env.extent:
            oldExtent = ARCPY.env.extent
            ARCPY.env.extent = ""
        else:
            oldExtent = ""

        #### May Have to Increase XY Domain ####
        originExtent = self.agg.origin_extent
        xyDomain = [UTILS.strToFloat(i) for i in spatialRef.domain.split(" ")]
        xyDomain = NUM.array(xyDomain)
        smallCompare = originExtent[0:2] < xyDomain[0:2]
        largeCompare = originExtent[2:] > xyDomain[2:]
        if NUM.any(smallCompare) or NUM.any(largeCompare):
            oldDomain = spatialRef.domain
            newExtent = ARCPY.Extent(xyDomain[0], xyDomain[1], xyDomain[2], xyDomain[3])
            newExtent = UTILS.increaseExtent(newExtent, multiplier = .1)
            spatialRef.setDomain(newExtent[0], newExtent[2], newExtent[1], newExtent[3])
            newExtent = [str(i) for i in newExtent ]
            newExtent = " ".join(newExtent)
            ARCPY.env.XYDomain = newExtent
            resetDomain = True
        else:
            resetDomain = False
            newSpatialRef = spatialRef

        #### Create Output Feature Class ####
        try:
            outPolyFC = DM.CreateFeatureclass(outPath, outName, "POLYGON",
                                                   "", "", "", spatialRef)
        except:
            ARCPY.AddIDMessage("ERROR", 210, outputFC)
            raise SystemExit()

        #### Start with Shape and Add Candidate Fields ####
        outFieldNames = ["SHAPE@"]

        for field in candidateFieldList:
            UTILS.addEmptyField(outputFC, field.name,
                                field.type, alias = field.alias)
            outFieldNames.append(field.name)

        #### Get/Set Info ####
        halfCell = self.agg.cell_size * 0.5
        locationData = candidateFieldList[0].data
        numLocations = len(locationData)

        #### Create Scale For Hexagons ####
        if self.useHexagons :
            shift = (NUM.sqrt(3.0) * self.agg.cell_size) * .5
        else:
            shift = 0.0

        #### Output to Features ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84003),
                            0, numLocations, 1)
        outCursor = DA.InsertCursor(outputFC, outFieldNames)

        self.centroids = self.cubeInfo.return_centroids(originExtent[0],
                                                        originExtent[3])
        centroidsMask = self.centroids[mask]

        for index, centroid in enumerate(centroidsMask):
            location = self.locations[index]
            row = (location % self.sizeSlice) // self.agg.num_cols
            col = (location % self.sizeSlice) % self.agg.num_rows
            x = centroid[0]
            y = centroid[1]
            if self.useHexagons:
                poly = UTILS.createHexPolygon(x, y, cellSize = self.agg.cell_size,
                                              spatialRef = spatialRef,
                                              outSpatialRef = spatialRef)
            else:
                poly = UTILS.createCellPolygon(x, y, cellSize = self.agg.cell_size,
                                              spatialRef = spatialRef,
                                              outSpatialRef = spatialRef)
            rowVals = [poly]

            for field in candidateFieldList:
                rowVals.append(field.data.item(index))

            outCursor.insertRow(rowVals)

            ARCPY.SetProgressorPosition()

        del outCursor

        if oldExtent:
            ARCPY.env.extent = oldExtent

        if resetDomain:
            ARCPY.env.XYDomain = oldDomain
            spatialRef.setDomain(xyDomain[0], xyDomain[1], xyDomain[2], xyDomain[3])

    def setPolygonMask(self, maskFC = None):
        """
        This method convert polygon mask to mask array for cube variable
        INPUT:
            maskFC (str): polygon mask path

        """
        deleteTempMask = False
        if maskFC is None:
            self.polygonMask = None
        else:
            maskInfo = ARCPY.Describe(maskFC)
            self.maskSpatialRef = maskInfo.SpatialReference

            if self.ssdo.useChordal:
                if self.maskSpatialRef.exportToString() != mercatorProjection.exportToString() :
                    maskFC_Merc = UTILS.returnScratchName("Merc_OHSA_",
                                                          scratchWS = ARCPY.env.scratchGDB)
                    DM.Project(maskFC, maskFC_Merc, mercatorProjection)
                    spatialRef = mercatorProjection
                    maskFC2Use = maskFC_Merc
                    deleteTempMask = True
                else:
                    spatialRef = mercatorProjection
                    maskFC2Use = maskFC
            else:
                if self.maskSpatialRef.exportToString() != self.ssdo.spatialRef.exportToString():
                    maskFC_Temp = UTILS.returnScratchName("Mask_OHSA_",
                                                          scratchWS = ARCPY.env.scratchGDB)
                    DM.Project(maskFC ,maskFC_Temp, self.ssdo.spatialRef)
                    spatialRef = self.ssdo.spatialRef
                    maskFC2Use = maskFC_Temp
                    deleteTempMask = True
                else:
                    spatialRef = self.ssdo.spatialRef
                    maskFC2Use = maskFC

            extent =self.agg.origin_extent
            x_min = extent[0]
            y_max = extent[3]
            polygonMask = self.cubeInfo.get_polygon_mask(maskFC2Use, x_min, y_max,
                                                         spatialRef)

            sumMask = polygonMask.sum()
            if deleteTempMask:
                UTILS.passiveDelete(maskFC2Use)

            if not sumMask:
                ARCPY.AddIDMessage("ERROR", 110033)
                raise SystemExit()

            self.polygonMask = polygonMask.ravel()

    def createAnalysisSSDO(self, tempFC, varName):
        self.varName = varName
        self.analysisSSDO = SSDO.SSDataObject(tempFC,
                                   explicitSpatialRef = self.ssdo.spatialRef,
                                   useChordal = True)
        self.masterField = UTILS.setUniqueIDField(self.analysisSSDO)
        if self.normField:
            self.analysisSSDO.obtainData(self.masterField, [self.varName, self.normField],
                                         requireSearch = True)
        else:
            self.analysisSSDO.obtainData(self.masterField, [self.varName],
                                         requireSearch = True)

        if self.aggType == 2:
            #### Verify Enough Polygons ####
            self.checkPolygons(self.analysisSSDO.numObs)

            #### Locational Outliers ####
            lo = UTILS.LocationInfo(self.analysisSSDO)
            cellSize, threshold, meanDist, outliers = lo.getNearestNeighborInfo()
            printOHSLocationalOutliers(outliers, aggType = self.aggType)

            #### Agg Header ####
            printOHSTitle(84444)

            #### Do Spatial Join ####
            returnJSON_FromID(84458)
            printOHSBullet(84489)

        #### Analyze Incident Subject ####
        msgID = aggHeaders[self.aggType]
        msg = ARCPY.GetIDMessage(msgID)
        ARCPY.SetProgressor("default", msg)
#        returnJSON_FromID(msgID)

        #### Errors and Warnings ####
        y = self.analysisSSDO.fields[self.varName].returnDouble()
        if self.normField:
            w = self.analysisSSDO.fields[self.normField].returnDouble()
            y = y/w
        yVar = NUM.var(y)

        if self.analysisSSDO.numObs < 30:
            #### Too Few Aggregated Features ####
            if self.boundaryFC:
                returnJSON_FromError(1573, "ERROR")
            else:
                returnJSON_FromError(1572, "ERROR")

        #### Zero Variance ####
        if NUM.isnan(yVar) or yVar <= 0.0:
            if self.aggType == 2:
                returnJSON_FromError(1534, "ERROR")
            else:
                returnJSON_FromError(1533, "ERROR")

        #### Count Description ####
        if self.aggType:
            msgID = 84490
        else:
            msgID = 84447

        returnJSON_FromMessageMatch(msgID, ["AggNumFeatures"], [str(len(y))],
                                    rowStyle = "<ul><li></li></ul>")

        varNameCounts = ARCPY.GetIDMessage(84488)
        returnJSON_FromMessageMatch(84446, ["VarName"], [varNameCounts],
                                    rowStyle = "<ul><li></li></ul>")

        printWeightAnswer(y)

    def setAnalysisSSDO(self, tempFC, varName):
        #### Initial Data Assessment ####
        # printOHSSection(84428, prependNewLine = True)

        self.varName = varName
        self.analysisSSDO = self.ssdo
        self.masterField = UTILS.setUniqueIDField(self.analysisSSDO)
        if UTILS.renderType[self.ssdo.shapeType.upper()]:
            stringShape =  ARCPY.GetIDMessage(84502)
        else:
            stringShape =  ARCPY.GetIDMessage(84501)

        #### Assure Enough Features (Q) ####
#        returnJSON_FromID(84429)
        if self.normField:
            self.analysisSSDO.obtainData(self.masterField, [self.varName, self.normField],
                                         requireSearch = True)
        else:
            self.analysisSSDO.obtainData(self.masterField, [self.varName], requireSearch = True)

        if self.analysisSSDO.numObs < minNumFeatures:
            returnJSON_FromError(1571, "ERROR", ["minNumIncidents", "dataType"], [str(minNumFeatures), stringShape])
            raise SystemExit()

        returnJSON_FromMessageMatch(84485, ["NumFeatures"], [str(self.analysisSSDO.numObs)], rowStyle = '<ul><li></li></ul>')

        #### Errors and Warnings ####
#        returnJSON_FromID(84432)
        y = self.analysisSSDO.fields[self.varName].returnDouble()
        if self.normField:
            w = self.analysisSSDO.fields[self.normField].returnDouble()
            y = y/w
        yVar = NUM.var(y)

        #### Zero Variance ####
        if NUM.isnan(yVar) or yVar <= 0.0:
            returnJSON_FromError(1575, "ERROR")
            raise SystemExit()

        #### Analysis Var Description ####
        returnJSON_FromMessageMatch(84446, ["VarName"], [self.varName],
                                    rowStyle= "<ul><li></li></ul>")
        printWeightAnswer(y)

        #### Locational Outliers ####
        lo = UTILS.LocationInfo(self.analysisSSDO)
        cellSize, threshold, meanDist, outliers = lo.getNearestNeighborInfo()
        printOHSLocationalOutliers(outliers, aggType = 2)


        #### Raster Boundary ####
        if self.outputRaster:
            self.validateRaster(self.analysisSSDO.xyCoords)

    def doHotSpots(self):
        #### Scale Header ####
        printOHSTitle(84459)

        self.templateDir = OS.path.dirname(OS.path.dirname(SYS.argv[0]))
        if not self.bandSize2Use:
        #### Scale Subject ####
            msg = ARCPY.GetIDMessage(84460)
            ARCPY.SetProgressor("default", msg)
#        returnJSON_FromID(84460)

            #### Run Incremental Spatial AutoCorrelation ####
            if self.normField:
                tempVarName = "INCAUTONAME"
                field = self.analysisSSDO.fields[self.varName]
                num = field.returnDouble()
                denom = self.analysisSSDO.fields[self.normField].returnDouble()
                field = ARCPY.Field()
                field.name = tempVarName
                field.type = "Double"
                field.length = 0
                field.fieldObject = field
                field.alias = tempVarName
                field.nullable = True
                field.precision = 0
                fieldVariable = SSDO.FCField(field)
                fieldVariable.data = num / denom
                self.analysisSSDO.fields[tempVarName] = fieldVariable
                mi = MI.GlobalI_Step(self.analysisSSDO, tempVarName,
                                     stdDeviations = 3.0,
                                     numNeighs = 0,
                                     silent = True,
                                     stopMax = 500)
            else:
                mi = MI.GlobalI_Step(self.analysisSSDO, self.varName,
                                     stdDeviations = 3.0,
                                     numNeighs = 0,
                                     silent = True,
                                     stopMax = 500)

            #### Set Distance or KNN ####
            peakFound = False
            if mi.completed:
                if mi.firstPeakDistance:
                    distanceBand = mi.firstPeakDistance
                    distanceStr = self.ssdo.distanceInfo.printDistance(distanceBand)
                    peakInd = mi.firstPeakInd
                    returnJSON_FromMessageMatch(84461, ["DistanceInfo"],
                                                [distanceStr], rowStyle = '<ul><li></li></ul><br/>')
                    numNeighs = 0
                    wType = 1
                    peakFound = True

                elif mi.maxPeakDistance:
                    distanceBand = mi.maxPeakDistance
                    distanceStr = self.ssdo.distanceInfo.printDistance(distanceBand)
                    peakInd = mi.maxPeakInd
                    returnJSON_FromMessageMatch(84461, ["DistanceInfo"],
                                                [distanceStr], rowStyle = '<ul><li></li></ul><br/>')
                    numNeighs = 0
                    wType = 1
                    peakFound = True

            if not peakFound:
                #### Use KNN If No Peak OR More than 500 Neighs ####
    #            printOHSBullet(84462)
                distanceBand = knnDecision(self.analysisSSDO)
                distanceStr = self.ssdo.distanceInfo.printDistance(distanceBand)
                wType = 1
                numNeighs = 0

            self.distanceBand = distanceBand
            self.distanceStr = distanceStr
        else:
            numNeighs = 0
            wType = 1
            self.distanceBand = self.bandSize2Use
            distanceBand = self.bandSize2Use

            if self.bandSizeOrigin:
                self.distanceStr = self.bandSizeOrigin
            else:
                self.distanceStr = self.ssdo.distanceInfo.printDistance(self.bandSize2Use)
            msg = ARCPY.GetIDMessage(84703).format(self.distanceStr)
            returnJSON_FromMessageMatch(84703, ["NeighborDistance"], [self.distanceStr],
                                        rowStyle='<ul><li></li></ul><br/>')

        #### Run Local Gi* ####
        msg = ARCPY.GetIDMessage(84466)
        ARCPY.SetProgressor("default", msg)

        #### Hot Spot Header ####
        printOHSTitle(84466)

        #### Subject w/ Value - Use AddMessage Explicitly ####
        varMSG = ARCPY.GetIDMessage(84467).format(self.varString)
        ARCPY.AddMessage(varMSG)

        #### Getting Maximum Extent ####
        if self.analysisSSDO.useChordal:
            softMaxExtent = self.analysisSSDO.sliceInfo.maxExtent
            hardMaxExtent = ARC._ss.get_max_gcs_distance(self.analysisSSDO.spatialRef)
            if softMaxExtent < hardMaxExtent:
                maxExtent = softMaxExtent
                softWarn = True
            else:
                maxExtent = hardMaxExtent
        else:
            env = UTILS.Envelope(self.analysisSSDO.extent)
            maxExtent = env.maxExtent

        minimumRadius = (maxExtent * .001)

        #### Selecting Minimum Radius When Distance Band is Smaller ####
        if distanceBand < minimumRadius:
            distanceBand = minimumRadius

        if self.bandSize2Use:
            distanceBand = self.bandSize2Use

        #### Run Analysis ####
        gi = GISTAR.LocalG(self.analysisSSDO, self.varName, self.outputFC,
                           wType, threshold = distanceBand,
                           numNeighs=numNeighs,
                           permutations=numPerms,
                           applyFDR=True,
                           thresholdOrigin = self.bandSizeOrigin,
                           normField=self.normField)

        #### FDR Significance ####
        numSig = (gi.giBins != 0).sum()
        returnJSON_FromMessageMatch(84470, ["NumSignificant"], [str(numSig)],
                                    rowStyle='<ul><li></li></ul><br/>')
        ### Percentage of Neighbors ####
        nFeats = len(gi.neighbors)
        if nFeats:
            nn = (gi.neighbors < 8).sum()
            perNeigh = nn * 100.0 / nFeats
            perNeigh = UTILS.humanReadableFloatStr(perNeigh, '%0.1f')
            msg = ARCPY.GetIDMessage(84716).format(perNeigh, self.distanceStr)
            #printOHSAnswer(msg, addNewLine = False)

        #### Wrap Up Header ####
        printOHSTitle(84471)

        #### Subject w/ Value - Use AddMessage Explicitly ####
        giField, pvField = gi.outputResults(addTextField = True)
        returnJSON_FromMessageMatch(84476, ["FieldName"], [self.varString],
                                    rowStyle = '<ul><li></li></ul>')
        returnJSON_FromMessageMatch(84477, ["FieldName"], [self.varString],
                                    rowStyle = '<ul><li></li></ul><br/>')

        #### Set the Default Symbology ####
        isPro = UTILS.isPRO()
        try:
            renderType = UTILS.renderType[self.analysisSSDO.shapeType.upper()]
            renderLayerFile = GISTAR.giRenderDict[renderType]
            if isPro:
                renderLayerFile += ".lyrx"
            else:
                renderLayerFile += ".lyr"
            fullRLF = OS.path.join(UTILS.pathLayers, renderLayerFile)
            self.params[1].symbology = fullRLF
        except:
            returnJSON_FromError(973, "WARNING")

        #### Set Chart Output ####
        if isPro:
            y = self.analysisSSDO.fields[self.varName].returnDouble()
            numBreaks = int(STATS.riskFunBins(y, 8, 64, 1))
            riceBreaks = STATS.riceBins(self.analysisSSDO.numObs)
            title = "Histogram of {0}".format(self.varName)
            if riceBreaks < numBreaks:
                numBreaks = riceBreaks

            chart = ARCPY.Chart("Histogram of Optimized Hot Spot Analysis Variable")
            chart.type = "histogram"
            chart.xAxis.field = self.varName.replace(".","_")
            chart.title = title
            chart.histogram.binCount = numBreaks
            chart.histogram.showMean = True
            chart.histogram.showMedian = True
            chart.histogram.showStandardDeviation = True

            self.params[1].charts = [chart]

    def doRaster(self, outputRaster, varName = None):
        """Creates the Output Raster."""

        renderType = UTILS.renderType[self.ssdo.shapeType.upper()]
        if renderType:
            #### No Output When Not Points ####
            printOHSBullet(84480)
        else:
            if varName:
                msg = ARCPY.GetIDMessage(84479)
                rasterLayerFile = "PointDensityHSGray.lyr"
            else:
                msg = ARCPY.GetIDMessage(84478)
                rasterLayerFile = "PointDensityHSGrayPoints.lyr"
            ARCPY.SetProgressor("default", msg)

            #### Distance Band Answer ####
            returnJSON_FromMessageMatch(84481, ["DistanceInfo"], [self.distanceStr],
                                        rowStyle = '<ul><li></li></ul>')

            #### Clip Message ####
#            if self.maskExists:
#                printOHSBullet(84483)
#            else:
#                printOHSBullet(84482)

            #### Do Raster ####
            try:
                UTILS.fc2DensityRaster(self.ssdo.inputFC, outputRaster,
                                       varName,
                                       boundaryFC = self.boundaryFC,
                                       searchRadius = self.distanceBand)
            except:
                printOHSBullet(84498)

            #### Set Symbology ####
            fullRLF = OS.path.join(UTILS.pathLayers, rasterLayerFile)
            self.params[6].Symbology = fullRLF

def cleanUp():
    for tempItem in cleanUpList:
        UTILS.passiveDelete(tempItem)

    #### Reset Extent ####
    ARCPY.env.extent = startExtent

if __name__ == "__main__":
    setupOptHotSpot()
