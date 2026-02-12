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

LOCALE.setlocale(LOCALE.LC_ALL, '')
import json as JSON
import logging
from loggerutils import init_ss_logger
LOGGER = init_ss_logger(__name__, logging.DEBUG)

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

############################ Local Methods ##############################
def checkLicense():
    spatial = ARCPY.CheckExtension('spatial').upper() == "AVAILABLE"
    productInfo = ARCPY.ProductInfo()
    pro = productInfo  in ["ArcInfo", "ArcServer"]
    return spatial and pro

def checkNumberPolygons(numObs, fromAGOL=False):
    if numObs < minNumFeatures:
        if fromAGOL:
            LOGGER.error(1535, extra={"message_ID": 1535, "minNumFeatures": str(minNumFeatures)})
        else:
            ARCPY.AddIDMessage("ERROR", 1535, str(minNumFeatures))
        raise SystemExit()

def adjustCopyFeatureFieldName_AGOL(fc, fieldName):
    """
    The CopyFeature function will change the field names, need to do the adjustment here
    :param fc:
    :param fieldName:
    :return:
    """
    fnMap = {
        "SHAPE__LENGTH": "SHAPE_LENGTH",
        "SHAPE__AREA": "SHAPE_AREA",
    }
    if not fieldName or fieldName.upper() not in fnMap:
        return fieldName
    fnu = fieldName.upper()

    for f in ARCPY.Describe(fc).fields:
        if f.name.upper() == fnu:
            return fieldName
    for f in ARCPY.Describe(fc).fields:
        if f.name.upper() == fnMap[fnu]:
            return fnMap[fnu]

    LOGGER.debug("Field name lost while copying features, error found!")
    return fieldName


def runOHSA(inputLayer, outputFC, varName, aggMethod,
            boundaryFC, polygonFC,
            cellSize, distanceBand, normField,
            geoenrichMethod):
    inputFC = inputLayer.layer
    if varName:
        varName = varName.upper()
    if normField:
        normField = normField.upper()

    if aggMethod:
        aggType = aggTypes[aggMethod.upper()]
    else:
        aggType = 1

    silentSSDOWarnings = False
    if len(varName) > 0:
        try:
            findNone = False
            inconsistentOID = False
            oid = 1
            with ARCPY.da.SearchCursor(inputFC, [ARCPY.Describe(inputFC).OIDFieldName, varName]) as cursor:
                for row in cursor:
                    if row[1] is None:
                        findNone = True
                    if row[0] != oid:
                        inconsistentOID = True
                    oid += 1
                    if findNone and inconsistentOID:
                        break
            if findNone and inconsistentOID:
                silentSSDOWarnings = True
                ssdo = SSDO.SSDataObject(inputFC, templateFC=outputFC, useChordal=True)
                ssdo.obtainData(ssdo.oidName, [varName], minNumObs=1, warnNumObs=1)
        except:
            pass

    if cellSize:
        userCellSize = float(cellSize.split()[0])
        userCellUnit = cellSize.split()[1].upper()
        useDefaultDistance = False
    else:
        userCellSize = None
        userCellUnit = None
        useDefaultDistance = True

    if distanceBand:
        userBandSize = float(distanceBand.split()[0])
        userBandUnit = distanceBand.split()[1].upper()
        useDefaultBand = False
    else:
        userBandSize = None
        userBandUnit = None
        useDefaultBand = True

    #### Check Number of Polygons ####
    if polygonFC and aggType == 2:
        ssdoPoly = SSDO.SSDataObject(polygonFC)
        ssdoPoly.obtainData(ssdoPoly.oidName)
        checkNumberPolygons(ssdoPoly.numObs, True)

    outputRaster = ""
    makeFeatureLayerNoExtent = UTILS.clearExtent(DM.MakeFeatureLayer)
    selectLocationNoExtent = UTILS.clearExtent(DM.SelectLayerByLocation)
    featureLayer = "InputOHSA_FC"
    featureLayerInit = "InputOHSA_Init_FC"
    if normField == "ESRIPOPULATION":
        if varName:
            inputFC, normField = geoenrichMethod(inputLayer)

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

    copyInput = ARCPY.CreateUniqueName("copy_input", ARCPY.env.scratchGDB)
    # DM.CopyFeatures(featureLayerInit, copyInput)
    fset = ARCPY.FeatureSet(featureLayerInit)
    fset.save(copyInput)
    varName = adjustCopyFeatureFieldName_AGOL(copyInput, varName)
    normField = adjustCopyFeatureFieldName_AGOL(copyInput, normField)

    #### Drop Zero Norm records ####
    if normField and varName:
        copyLayer = "copyLayer"
        makeFeatureLayerNoExtent(copyInput, copyLayer)
        selectAttrType = UTILS.getSelectionType(copyLayer)
        sqlString = u"{} <> 0".format(normField)
        ARCPY.SelectLayerByAttribute_management(copyLayer, selectAttrType, sqlString)
        # ARCPY.SelectLayerByAttribute_management(featureLayerInit, selectionType, sqlString)
        makeFeatureLayerNoExtent(copyLayer, featureLayer)
        # makeFeatureLayerNoExtent(featureLayerInit, featureLayer)
        ARCPY.AddMessage("Count {}".format(UTILS.getCount(featureLayer)))
    #         UTILS.passiveDelete(copyLayer)

    else:
        # makeFeatureLayerNoExtent(featureLayerInit, featureLayer)
        makeFeatureLayerNoExtent(copyInput, featureLayer)
    UTILS.passiveDelete(featureLayerInit)
    # UTILS.passiveDelete(copyInput)
    #### Create SSDO ####
    ssdo = SSDO.SSDataObject(featureLayer, templateFC=outputFC,
                             useChordal=True, silentWarnings=silentSSDOWarnings)

    extentFactor = ssdo.distanceInfo.convertFactor
    processingBandSize = None
    processingCellSize = None
    bandSizeOrigin = None

    if not useDefaultBand:
        bandSizeStr, bandSizeFactor = UTILS.distanceUnitInfo[userBandUnit]
        processingBandSize = (userBandSize * bandSizeFactor) / extentFactor
        bandSizeOrigin = distanceBand
        #### Check if distance band exceeds the input extent, if yes, raise error and exit ####
        if ssdo.useChordal:
            hardMaxExtent = ARC._ss.get_max_gcs_distance(ssdo.spatialRef)
            if hasattr(ssdo, "sliceInfo"):
                softMaxExtent = ssdo.sliceInfo.maxExtent
            else:
                softMaxExtent = hardMaxExtent

            if softMaxExtent < hardMaxExtent:
                maxExtent = softMaxExtent
            else:
                maxExtent = hardMaxExtent
        else:
            env = UTILS.Envelope(ssdo.extent)
            maxExtent = env.maxExtent
        if processingBandSize > maxExtent:
            LOGGER.error(929, extra={"message_ID": 929})
            raise SystemExit()

    if not useDefaultDistance:
        cellSizeStr, cellSizeFactor = UTILS.distanceUnitInfo[userCellUnit]
        processingCellSize = (userCellSize * cellSizeFactor) / extentFactor
        extendDistance = processingCellSize
        #### Check and Make Sure the Cell Size Won't Exceed The Limitation of Input Feature Layer's SRS Extent ####
        xMin, yMin, zMin, xMax, yMax, zMax = UTILS.getXYZProjectionDomain(ssdo.spatialRef)
        centroid = ssdo.extent.polygon.centroid
        if ssdo.useChordal:
            extendDistance = (userCellSize * cellSizeFactor) / UTILS.GCSDegree2Meters
            info = ARCPY.Describe(featureLayer)
            centroid = ARCPY.PointGeometry(
                info.extent.polygon.centroid,
                info.spatialReference).projectAs(ARCPY.SpatialReference(4326)).firstPoint
        cX = centroid.X
        cY = centroid.Y
        if cX - extendDistance < xMin \
                or cX + extendDistance > xMax \
                or cY - extendDistance < yMin \
                or cY + extendDistance > yMax:
            LOGGER.error(110250, extra={"message_ID": 110250})
            raise SystemExit()

    hs = OptHotSpots(ssdo, outputFC, varName=varName, normField=normField,
                     aggType=aggType, polygonFC=polygonFC,
                     boundaryFC=boundaryFC, outputRaster=outputRaster,
                     cellSize2Use=processingCellSize, bandSize2Use=processingBandSize,
                     cellSizeOrigin=cellSize, bandSizeOrigin=bandSizeOrigin,
                     geoenrichMethod=geoenrichMethod, fromAGOL=True)

    DM.Delete(featureLayer)
    return hs.agol_messages

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
                 aggType = 1, polygonFC = None,
                 boundaryFC = None, outputRaster = None,
                 cellSize2Use = None, bandSize2Use = None, 
                 parameters = None,
                 cellSizeOrigin = None, bandSizeOrigin = None,
                 normField = None, geoenrichMethod=None, fromAGOL=False, 
                 sensitivity=None):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())
        ARCPY.env.overwriteOutput = True
        self.startExtent = ARCPY.env.extent
        ARCPY.env.extent = ""
        self.cleanUpList = []
        self.cellSizeOrigin = cellSizeOrigin
        self.bandSizeOrigin = bandSizeOrigin
        self.geoenrichMethod = geoenrichMethod
        self.FLAG_AGOL = fromAGOL
        self.agol_messages = []
        self.sensitivity = sensitivity

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

        #### check has OID 64 ####
        self.hasOID64 = ssdo.hasOID64

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
        self.normField = normField
        self.initialize()
        
        #### Initalize and Analyze ####
        if self.varName:
            if self.varName in self.ssdo.fields:
                varString = self.ssdo.fields[self.varName].alias + " " + ARCPY.GetIDMessage(84468)
            else:
                varString = self.varName + " " + ARCPY.GetIDMessage(84468)
        else:
            varString = ARCPY.GetIDMessage(84469)
        self.varString = varString

        if not self.sensitivity:
            self.doHotSpots()

            #### Raster Output ####
            if self.outputRaster:
                self.doRaster(self.outputRaster, varName = self.varPopName)

            #### Clean Up ####
            self.cleanUp()

    def cleanUp(self):
        #### Delete Temp Structures ####
        for tempItem in self.cleanUpList:
            UTILS.passiveDelete(tempItem)
        self.cleanUpList.clear()

        #### Reset Extent ####
        ARCPY.env.extent = self.startExtent

        #### Final Line Print ####
        ARCPY.AddMessage("\n")

    def initialize(self):
        #### Decision Tree ####
        if not self.varName:
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
            self.setAnalysisSSDO(self.ssdo.inputFC, self.varName)

    def returnJSON_FromError_AGOL(self, msgID, msgType, listOfStringKeys=[],
                                  listOfStringVals=[],
                                  rowStyle='error'):

        extra = {"message_ID": msgID}
        if listOfStringVals:
            for ind, val in enumerate(listOfStringVals):
                extra[f"add_argument{ind + 1}"] = listOfStringVals[ind]
        if msgType.upper() == "WARNING":
            LOGGER.warning(msgID, extra = extra)
        if msgType.upper() == "ERROR":
            LOGGER.error(msgID, extra = extra)
            self.cleanUp()
            raise SystemExit()

    def returnJSON_Table_AGOL(self, msgID, msg, listOfStringArgs=[], listOfStringVals=[], rowStyle='table'):
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
        # ARCPY.gp.AddMessage(jsonMess, 55)
        self.agol_messages.append(jsonMess)

    def returnJSON_FromMessageMatch_AGOL(self, msgID, listOfStringKeys, listOfStringVals,
                                         rowStyle='<span></span>', msg2Use=None):
        if msg2Use is not None:
            msg = msg2Use
        else:
            msg = ARCPY.GetIDMessage(msgID)

        allDict = {}
        paramDict = {}
        if len(listOfStringKeys):
            for ind, keyVal in enumerate(listOfStringKeys):
                paramDict[keyVal] = listOfStringVals[ind]
                if msg2Use is None:
                    msg = msg.replace("{%i}" % ind, "${%s}" % keyVal)

        allDict['message'] = msg
        allDict['messageCode'] = "SS_" + str(msgID).rjust(5, '0')
        allDict['params'] = paramDict
        allDict['style'] = rowStyle
        jsonMess = JSON.dumps(allDict)
        # ARCPY.gp.AddMessage(jsonMess, 55)
        self.agol_messages.append(jsonMess)

    def returnJSON_FromID_AGOL(self, msgID, rowStyle='<span></span>'):
        msg = ARCPY.GetIDMessage(msgID)

        allDict = {}
        allDict['message'] = msg
        allDict['messageCode'] = "SS_" + str(msgID).rjust(5, '0')
        allDict['params'] = {}
        allDict['style'] = rowStyle
        jsonMess = JSON.dumps(allDict)
        # ARCPY.gp.AddMessage(jsonMess, 55)
        self.agol_messages.append(jsonMess)

    def printWeightAnswer(self, y, msg = ""):
        """Describes the Weight/Analysis/Count Field."""
        minY = y.min()
        maxY = y.max()
        avgY = y.mean()
        stdY = y.std()

        exp = "" if UTILS.couldExportHTMLMessage() and not self.FLAG_AGOL else ":"
        minStr = ARCPY.GetIDMessage(84271) + exp
        maxStr = ARCPY.GetIDMessage(84272) + exp
        avgStr = ARCPY.GetIDMessage(84261) + exp
        stdStr = ARCPY.GetIDMessage(84262) + exp

        minString = LOCALE.format("%0.4f", minY)
        maxString = LOCALE.format("%0.4f", maxY)
        avgString = LOCALE.format("%0.4f", avgY)
        stdString = LOCALE.format("%0.4f", stdY)

        if self.FLAG_AGOL:
            row1 = [minStr + ":", "{0}"]
            row2 = [maxStr + ":", "{0}"]
            row3 = [avgStr + ":", "{0}"]
            row4 = [stdStr + ":", "{0}"]

            self.returnJSON_Table_AGOL(84271, row1, ["MinValue"], [minString],
                                       rowStyle="<table style='width: 200px;margin-left: 2.5em;border: none;' class='table-plain'><tbody><tr><td style='border: none;'></td><td style='float:right;border: none;'></td></tr>")
            self.returnJSON_Table_AGOL(84272, row2, ["MaxValue"], [maxString],
                                       rowStyle="<tr><td style='border: none;'></td><td style='float: right;border: none;'></td></tr>")
            self.returnJSON_Table_AGOL(84261, row3, ["AvgValue"], [avgString],
                                       rowStyle="<tr><td style='border: none;'></td><td style='float: right;border: none;'></td></tr>")
            self.returnJSON_Table_AGOL(84262, row4, ["StdValue"], [stdString],
                                       rowStyle="<tr><td style='border: none;'></td><td style='float: right;border: none;'></td></tr></tbody></table>")

        else:
            padStr = " " * 7
            row1 = [padStr, minStr, minString]
            row2 = [padStr, maxStr, maxString]
            row3 = [padStr, avgStr, avgString]
            row4 = [padStr, stdStr, stdString]
            results = [row1, row2, row3, row4]
            justify = ['left', 'left', 'right']
            if UTILS.couldExportHTMLMessage():
                results = [row[1:] for row in results]
                justify = justify[1:]
            outputTable = UTILS.outputTextTable(results, header=msg, pad=0,
                                                justify=justify, force2Txt=False, emphasizeHeadRow=False,
                                                tableSize="small")
            ARCPY.AddMessage(outputTable)

    def printOHSLocationalOutliers(self, outliers, aggType=1):
        """Prints the results of input incident locational outliers."""
        numOutliers = len(outliers)
        aggResult = ARCPY.GetIDMessage(aggOutliers[aggType])
        if self.FLAG_AGOL:
            if numOutliers:
                if aggType == 0:  # TODO: the message for type 0 is not localized in AGOL platform. Need to redo later
                    if numOutliers == 1:
                        self.returnJSON_FromMessageMatch_AGOL(84493, ["AggregationType"],
                                                              [aggResult], rowStyle='<ul><li></li></ul>')
                    else:
                        self.returnJSON_FromMessageMatch_AGOL(84434, ["NumOutliers", "AggregationType"],
                                                              [str(numOutliers), aggResult],
                                                              rowStyle='<ul><li></li></ul>')
                else:
                    agol_msg = {0: "84494", 1: "84495", 2: "84496", 3: "84700"}
                    agol_msg_id = str(aggOutliers[aggType])
                    if numOutliers == 1:
                        msg2Use = ARCPY.GetIDMessage(84493).format(aggResult)
                        agol_msg_id += "_0"
                        self.returnJSON_FromMessageMatch_AGOL(agol_msg_id, [], [],
                                                              rowStyle='<ul><li></li></ul>',
                                                              msg2Use=msg2Use)
                    else:
                        msg2Use = ARCPY.GetIDMessage(84434).format(str(numOutliers), aggResult)
                        agol_msg_id += "_1"
                        self.returnJSON_FromMessageMatch_AGOL(agol_msg_id, ["numOutliers"], [str(numOutliers)],
                                                              rowStyle='<ul><li></li></ul>',
                                                              msg2Use=msg2Use)
            else:
                self.printOHSBullet_AGOL(84437)
        else:
            self.printOHSSubject(84438, addNewLine=False)
            if numOutliers:
                if numOutliers == 1:
                    msg = ARCPY.GetIDMessage(84493).format(aggResult)
                else:
                    msg = ARCPY.GetIDMessage(84434).format(numOutliers, aggResult)
            else:
                msg = ARCPY.GetIDMessage(84437)

            self.printOHSAnswer(msg)

    def printOHSTitle_AGOL(self, messID):
        """Prints Title Message Header to Results Window."""
        self.returnJSON_FromID_AGOL(messID, rowStyle='<u><b></b></u><br/>')

    def printOHSBullet_AGOL(self, messID):
        """Prints Title Message Header to Results Window."""
        self.returnJSON_FromID_AGOL(messID, rowStyle='<ul><li></li></ul>')

    def printOHSSection(self, messID, prependNewLine=False):
        """Prints Section Message Header to Results Window."""

        msg = ARCPY.GetIDMessage(messID)
        if UTILS.couldExportHTMLMessage():
            UTILS.outputHeader(msg)
        else:
            msg = " " + msg + " "
            msg = msg.center(78, "*")
            if prependNewLine:
                msg = "\n" + msg
            ARCPY.AddMessage(msg)

    def printOHSSubject(self, messID, addNewLine=True):
        """Prints Subject Message Header to Results Window."""
        msg = ARCPY.GetIDMessage(messID)
        if addNewLine:
            msg += "\n"
        ARCPY.AddMessage(msg)

    def printOHSAnswer(self, messStr, addNewLine=True):
        """Prints Subject Message Header to Results Window."""
        if UTILS.couldExportHTMLMessage():
            UTILS.outputBulletList([messStr], ordered=False, force2Txt=False)
        else:
            msg = indentAnswerStr + messStr
            if addNewLine:
                msg += "\n"
            ARCPY.AddMessage(msg)

    def knnDecision(self, ssdo, fromSens=False):
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
        if not self.FLAG_AGOL and not fromSens:
            self.printOHSSubject(84463, addNewLine=False)

        #### Create k-Nearest Neighbor Search Type ####
        gaTable = ssdo.gaTable
        gaSearch = GAPY.ga_nsearch(gaTable)
        gaSearch.init_nearest(0.0, numNeighs, 'euclidean')
        neighDist = ARC._ss.NeighborDistances(gaTable, gaSearch)
        N = len(gaTable)
        distances = NUM.empty((N,), float)

        #### Find All Nearest Neighbor Distance ####
        for row in UTILS.ssRange(N):
            distances[row] = neighDist[row][-1][-1]
            ARCPY.SetProgressorPosition()

        #### Make Sure it is not Larger Than Standard Distance ####
        meanDist = distances.mean()
        if ssdo.useChordal:
            distValue = UTILS.roof(meanDist)
            distanceStr = ssdo.distanceInfo.printDistance(distValue)
            if self.FLAG_AGOL:
                self.returnJSON_FromMessageMatch_AGOL(84464, ["NumNeighs", "DistanceInfo"],
                                                  [str(numNeighs), distanceStr],
                                                  rowStyle='<ul><li></li></ul><br/>')
            elif not fromSens:
                msg = ARCPY.GetIDMessage(84464).format(numNeighs, distanceStr)
        else:
            sd = UTILS.standardDistanceCutoff(ssdo.xyCoords)
            if meanDist > sd:
                distValue = UTILS.roof(sd)
                distanceStr = ssdo.distanceInfo.printDistance(distValue)
                if self.FLAG_AGOL:
                    self.returnJSON_FromMessageMatch_AGOL(84465, ["DistanceInfo"], [distanceStr],
                                                          rowStyle='<ul><li></li></ul><br/>')
                else:
                    msg = ARCPY.GetIDMessage(84465).format(distanceStr)
            else:
                distValue = UTILS.roof(meanDist)
                distanceStr = ssdo.distanceInfo.printDistance(distValue)
                if self.FLAG_AGOL:
                    self.returnJSON_FromMessageMatch_AGOL(84464, ["NumNeighs", "DistanceInfo"],
                                                          [str(numNeighs), distanceStr],
                                                          rowStyle='<ul><li></li></ul><br/>')
                elif not fromSens:
                    msg = ARCPY.GetIDMessage(84464).format(numNeighs, distanceStr)

        if not self.FLAG_AGOL and  not fromSens:
            #### KNN/STD Answer ####
            self.printOHSAnswer(msg)

        return distValue

    def checkPolygons(self, numObs):
        if numObs < minNumFeatures:
            if self.FLAG_AGOL:
                self.returnJSON_FromError_AGOL(1535, "ERROR", ["minNumFeatures"],
                                               [str(minNumFeatures)])
            else:
                ARCPY.AddIDMessage("ERROR", 1535, str(minNumFeatures))
                self.cleanUp()
            raise SystemExit()
        else:
            if self.FLAG_AGOL:
                self.returnJSON_FromMessageMatch_AGOL(84491, ["NumFeatures"], [str(numObs)],
                                                      rowStyle='<ul><li></li></ul>')
            else:
                msg = ARCPY.GetIDMessage(84491).format(numObs)
                self.printOHSAnswer(msg)

    def checkBoundary(self, projection = None):
        explicSpatRef = self.ssdo.spatialRef

        if projection:
            explicSpatRef = projection
        if not self.FLAG_AGOL:
            self.printOHSSubject(84486, addNewLine = False)

        #### Assure That There Is Only a Single Polygon ####
        cnt = UTILS.getCount(self.boundaryFC)

        #### Dissolve Polys into Boundary ####
        dissolveFC = UTILS.returnScratchName("Diss_OHSA_", 
                                             scratchWS = ARCPY.env.scratchGDB)
        DM.Dissolve(self.boundaryFC, dissolveFC, "#", "#", "SINGLE_PART",
                    "DISSOLVE_LINES")
        self.boundaryFC = dissolveFC
        self.cleanUpList.append(dissolveFC)

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
            if self.FLAG_AGOL:
                self.returnJSON_FromError_AGOL(932, "ERROR")
            else:
                ARCPY.AddIDMessage("ERROR", 932)
                self.cleanUp()
            raise SystemExit()
        else:
            areaStr = self.ssdo.distanceInfo.printDistance(self.boundArea)
            if self.FLAG_AGOL:
                self.returnJSON_FromMessageMatch_AGOL(84492, ["Area"], [areaStr],
                                                      rowStyle="<ul><li></li></ul>")
            else:
                msg = ARCPY.GetIDMessage(84492).format(areaStr)
                self.printOHSAnswer(msg)

    def checkIncidents(self, numObs):
        self.cnt = numObs
        if (self.aggType == 1 or self.aggType == 3) and not self.boundaryFC:
            #### Fish w/o Boundary Requires Twice Number ####
            self.minNumIncidents = self.minNumIncidents * 2
        if self.cnt < self.minNumIncidents:
            if self.aggType in [0, 1, 3]:
                if self.boundaryFC:
                    if self.FLAG_AGOL:
                        self.returnJSON_FromError_AGOL(1570, "ERROR", ["minNumIncidents"],
                                                       [str(self.minNumIncidents)])
                    else:
                        ARCPY.AddIDMessage("ERROR", 1570, str(self.minNumIncidents))
                else:
                    if self.FLAG_AGOL:
                        self.returnJSON_FromError_AGOL(1536, "ERROR",
                                                       ["minNumIncidents"],
                                                       [str(self.minNumIncidents)])
                    else:
                        ARCPY.AddIDMessage("ERROR", 1536,
                                           str(self.minNumIncidents),
                                           ARCPY.GetIDMessage(84501))
            else:
                if self.FLAG_AGOL:
                    self.returnJSON_FromError_AGOL(1574, "ERROR", ["minNumIncidents"],
                                                   [str(self.minNumIncidents)])
                else:
                    ARCPY.AddIDMessage("ERROR", 1574, str(self.minNumIncidents))
            self.cleanUp()
            raise SystemExit()

        if self.FLAG_AGOL:
            self.returnJSON_FromMessageMatch_AGOL(84485, ["NumFeatures"], [str(self.cnt)],
                                                  rowStyle="<ul><li></li></ul>")
        else:
            msg = ARCPY.GetIDMessage(84485).format(self.cnt)
            self.printOHSAnswer(msg)

    def doPoint2Poly(self):
        #### Initial Data Assessment ####
        if self.FLAG_AGOL:
            self.printOHSTitle_AGOL(84428)
        else:
            self.printOHSSection(84428, prependNewLine = True)
            self.printOHSSubject(84431, addNewLine = False)
        initCount = UTILS.getCount(self.ssdo.inputFC)
        if initCount == 0:
            self.checkIncidents(initCount)
        else:
            self.ssdo.obtainData(self.ssdo.oidName)
            self.checkIncidents(self.ssdo.numObs)
        if len(self.ssdo.badRecords):
            ARCPY.AddMessage("\n")

        #### Checking Polygon Message ####
        if not self.FLAG_AGOL:
            self.printOHSSubject(84430, addNewLine = False)

        #### Spatial Join (Hold Messages) ####
        outputFieldMaps = "EMPTY"
        tempFC = UTILS.returnScratchName("Join_OHSA_", 
                                         scratchWS = ARCPY.env.scratchGDB)
        self.cleanUpList.append(tempFC)

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
            if self.normField.upper().strip('"') == "ESRIPOPULATION":
                tempFC, self.normField = self.geoenrichMethod(tempFC)
            else:
                self.normField = adjustCopyFeatureFieldName_AGOL(tempFC, self.normField)
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
        if self.FLAG_AGOL:
            self.returnJSON_FromID_AGOL(84439)
        else:
            self.printOHSSubject(84439, addNewLine = False)
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
            if not self.FLAG_AGOL:
                self.printOHSAnswer(msg)
            boundaryFC = UTILS.returnScratchName("HULL_OHSA_", 
                                                 scratchWS = ARCPY.env.scratchGDB)
            UTILS.minBoundGeomPoints(ssdoCoords, boundaryFC,
                                     geomType = "CONVEX_HULL",
                                     spatialRef = self.ssdo.spatialRef)
            self.boundaryFC = boundaryFC
            self.cleanUpList.append(boundaryFC)

        self.maskExists = maskExists

    def doIntegrate(self):
        #### Read All Points ####
        ssdo = self.ssdo
        ssdo.obtainData(ssdo.oidName, requireSearch = True)

        #### Initial Data Assessment ####
        if self.FLAG_AGOL:
            self.printOHSTitle_AGOL(84428)
        else:
            self.printOHSSection(84428, prependNewLine = True)
            self.printOHSSubject(84431, addNewLine = False)

        #### Find Unique Locations ####
        msg = ARCPY.GetIDMessage(84441)
        ARCPY.SetProgressor("default", msg)
        self.checkIncidents(ssdo.numObs)

        #### CellSize and Locational Outliers ####
        lo = UTILS.LocationInfo(ssdo)
        cellSize, threshold, meanDist, outliers = lo.getNearestNeighborInfo()
        self.printOHSLocationalOutliers(outliers, aggType = self.aggType)

        #### Raster Boundary ####
        if self.outputRaster:
            self.validateRaster(ssdo.xyCoords)

        #### Agg Header ####
        if self.FLAG_AGOL:
            self.printOHSTitle_AGOL(84444)
        else:
            self.printOHSSection(84444)

        #### Copy Features for Integrate ####
        msg = ARCPY.GetIDMessage(84443)
        ARCPY.SetProgressor("default", msg)
        intFC = UTILS.returnScratchName("Int_OHSA_", 
                                        scratchWS = ARCPY.env.scratchGDB)
        self.cleanUpList.append(intFC)
        DM.CopyFeatures(self.ssdo.inputFC, intFC)

        #### Make Feature Layer To Avoid Integrate Bug with Spaces ####
        mfc = "Integrate_MFC_2"
        DM.MakeFeatureLayer(intFC, mfc)
        self.cleanUpList.append(mfc)

        #### Snap Subject ####
        if not self.FLAG_AGOL:
            self.printOHSSubject(84442, addNewLine = False)
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
        if not self.FLAG_AGOL:
            useDistStr = self.ssdo.distanceInfo.printDistance(useDist)
            msg = ARCPY.GetIDMessage(84445).format(useDistStr)
            self.printOHSAnswer(msg)

        percs = [10, 25, 100]
        indices = [ int(numDists * (i * .01)) for i in percs ]
        if indices[-1] >= numDists:
            indices[-1] = -1
        
        if len(distance2Integrate):
            ARCPY.SetProgressor("default", msg)
            for pInd, dInd in enumerate(indices):
                dist = distance2Integrate[dInd]
                snap = self.ssdo.distanceInfo.linearUnitString(dist, convert = True)
                DM.Integrate(mfc, snap)

        #### Run Collect Events ####
        collectedFC = UTILS.returnScratchName("Coll_OHSA_", 
                                              scratchWS = ARCPY.env.scratchGDB)
        self.cleanUpList.append(collectedFC)
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
        if self.FLAG_AGOL:
            self.printOHSTitle_AGOL(84428)
        else:
            self.printOHSSection(84428, prependNewLine = True)
            self.printOHSSubject(84431, addNewLine = False)
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
            self.printOHSLocationalOutliers(outliers, aggType = self.aggType)

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
        if self.FLAG_AGOL:
            self.printOHSTitle_AGOL(84444)
        else:
            self.printOHSSection(84444)
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
        if self.FLAG_AGOL:
            self.printOHSSubject(creatingMSG, addNewLine = False)

        #### Create Temp Grid Feature Class for Analysis ####
        aggFCNew  = UTILS.returnScratchName("Agg_OHSA_", 
                                            scratchWS = ARCPY.env.scratchGDB)
        self.cleanUpList.append(aggFCNew)

        #### Aggregate All Points to Grid ####
        self.aggregation(aggFCNew, ssdo, xyCoordsProjected, 
                         cellSize, boundaryExtent)

        #### Cell Size Answer ####
        if self.cellSizeOrigin:
            snapStr = UTILS.quickLinearUnitPrint(self.cellSizeOrigin)
        else:
            snapStr = ssdo.distanceInfo.printDistance(cellSize)
        if not self.useHexagons:
            msg = ARCPY.GetIDMessage(cellSizeMSG).format(snapStr)
            if self.FLAG_AGOL:
                self.returnJSON_FromMessageMatch_AGOL(cellSizeMSG, ["SnapInfo"], [snapStr],
                                                      rowStyle="<ul><li></li></ul>")
        else:
            heighStr = self.ssdo.distanceInfo.printDistance(hexHeight) 
            widthStr = self.ssdo.distanceInfo.printDistance(hexWidth)
            msg = ARCPY.GetIDMessage(cellSizeMSG).format(widthStr, heighStr)
            if self.FLAG_AGOL:
                self.returnJSON_FromMessageMatch_AGOL(cellSizeMSG, ["HexWidth", "HexHeight"],
                                                      [widthStr, heighStr],
                                                      rowStyle="<ul><li></li></ul>")
        if not self.FLAG_AGOL:
            self.printOHSAnswer(msg)
            #### Fishnet Count Subject ####
            self.printOHSSubject(countMSG, addNewLine = False)

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
        if not self.FLAG_AGOL:
            self.printOHSAnswer(ARCPY.GetIDMessage(countMSGNumber))

        #### Create Analysis SSDO ####
        if self.normField:
            gridFC, self.normField = self.geoenrichMethod(gridFC)
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
        if not self.boundaryFC:
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
            if self.FLAG_AGOL:
                self.returnJSON_FromError_AGOL(110243, "ERROR")
            else:
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
        locations = NUM.arange(self.sizeSlice, dtype=NUM.int32)
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

        if self.hasOID64:
            try:
                DM.MigrateObjectIDTo64Bit(in_datasets=outPolyFC)
            except:
                pass

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
        if self.aggType == 2:
            fieldType = "BIGINTEGER" if self.ssdo.hasOID64 else "LONG"
            DM.CalculateField(in_table=tempFC, field="SOURCE_ID", expression="!TARGET_FID!", field_type=fieldType)

        self.analysisSSDO = SSDO.SSDataObject(tempFC,
                                   explicitSpatialRef = self.ssdo.spatialRef,
                                   useChordal = True)
        
        if self.aggType == 2:
            self.masterField = "SOURCE_ID"
        else:
            self.masterField = UTILS.setUniqueIDField(self.analysisSSDO)
        if self.normField:
            self.analysisSSDO.obtainData(self.masterField, [self.varName, self.normField],
                                         requireSearch=True)
        else:
            self.analysisSSDO.obtainData(self.masterField, [self.varName],
                                         requireSearch=True)

        if self.aggType == 2:
            #### Verify Enough Polygons ####
            self.checkPolygons(self.analysisSSDO.numObs)

            #### Locational Outliers ####
            lo = UTILS.LocationInfo(self.analysisSSDO)
            cellSize, threshold, meanDist, outliers = lo.getNearestNeighborInfo()
            self.printOHSLocationalOutliers(outliers, aggType = self.aggType)

            #### Agg Header ####
            if self.FLAG_AGOL:
                self.printOHSTitle_AGOL(84444)
                #### Do Spatial Join ####
                self.returnJSON_FromID_AGOL(84458)
                self.printOHSBullet_AGOL(84489)
            else:
                self.printOHSSection(84444)
                #### Do Spatial Join ####
                msg = ARCPY.GetIDMessage(84458)
                self.printOHSSubject(84458, addNewLine=False)
                msg = ARCPY.GetIDMessage(84489)
                self.printOHSAnswer(msg)

        #### Analyze Incident Subject ####
        msgID = aggHeaders[self.aggType]
        msg = ARCPY.GetIDMessage(msgID)
        ARCPY.SetProgressor("default", msg)
        if not self.FLAG_AGOL:
            self.printOHSSubject(msgID, addNewLine = False)

        #### Errors and Warnings ####
        y = self.analysisSSDO.fields[self.varName].returnDouble()
        if self.normField:
            w = self.analysisSSDO.fields[self.normField].returnDouble()
            y = y / w
        yVar = NUM.var(y)
        if self.analysisSSDO.numObs < 30:
            #### Too Few Aggregated Features ####
            if self.FLAG_AGOL:
                if self.boundaryFC:
                    self.returnJSON_FromError_AGOL(1573, "ERROR")
                else:
                    self.returnJSON_FromError_AGOL(1572, "ERROR")
            else:
                if self.boundaryFC:
                    ARCPY.AddIDMessage("ERROR", 1573)
                else:
                    ARCPY.AddIDMessage("ERROR", 1572)
                self.cleanUp()
                raise SystemExit()

        #### Zero Variance ####
        if NUM.isnan(yVar) or yVar <= 1e-12:
            if self.FLAG_AGOL:
                if self.aggType == 2:
                    self.returnJSON_FromError_AGOL(1534, "ERROR")
                else:
                    self.returnJSON_FromError_AGOL(1533, "ERROR")
            else:
                if self.aggType == 2:
                    ARCPY.AddIDMessage("ERROR", 1534)
                else:
                    ARCPY.AddIDMessage("ERROR", 1533)
                self.cleanUp()
                raise SystemExit()

        #### Count Description ####
        if self.aggType:
            msgID = 84490
        else:
            msgID = 84447
        varNameCounts = ARCPY.GetIDMessage(84488)
        if self.FLAG_AGOL:
            self.returnJSON_FromMessageMatch_AGOL(msgID, ["AggNumFeatures"], [str(len(y))],
                                                  rowStyle="<ul><li></li></ul>")
            self.returnJSON_FromMessageMatch_AGOL(84446, ["VarName"], [varNameCounts],
                                                  rowStyle="<ul><li></li></ul>")
            self.printWeightAnswer(y)
        else:
            msg = ARCPY.GetIDMessage(msgID).format(len(y))
            self.printOHSAnswer(msg, addNewLine = False)
            msg = ARCPY.GetIDMessage(84446).format(varNameCounts)
            self.printWeightAnswer(y, ("" if UTILS.couldExportHTMLMessage() else indentAnswerStr) + msg)

    def setAnalysisSSDO(self, tempFC, varName):
        #### Initial Data Assessment ####
        if not self.FLAG_AGOL and self.sensitivity is None:
            self.printOHSSection(84428, prependNewLine = True)

        self.varName = varName
        self.analysisSSDO = self.ssdo
        self.masterField = UTILS.setUniqueIDField(self.analysisSSDO)
        if UTILS.renderType[self.ssdo.shapeType.upper()]:
            stringShape =  ARCPY.GetIDMessage(84502)
        else:
            stringShape =  ARCPY.GetIDMessage(84501)

        #### Assure Enough Features (Q) ####
        if not self.FLAG_AGOL and self.sensitivity is None:
            self.printOHSSubject(84429, addNewLine = False)
        if self.sensitivity:
            sensField = []
            if "MOE" in self.sensitivity:
                sensField = [self.sensitivity["MOE"].upper()]
            elif "lowField" in self.sensitivity and "highField" in self.sensitivity:
                sensField = [self.sensitivity["lowField"].upper(), self.sensitivity["highField"].upper()]
            if self.normField:
                self.analysisSSDO.obtainData(self.masterField, [self.varName, self.normField] + sensField,
                                            requireSearch=True)
            else:
                self.analysisSSDO.obtainData(self.masterField, [self.varName] + sensField, requireSearch=True)
        else:
            if self.normField:
                self.analysisSSDO.obtainData(self.masterField, [self.varName, self.normField],
                                            requireSearch=True)
            else:
                self.analysisSSDO.obtainData(self.masterField, [self.varName], requireSearch=True)

        if len(self.analysisSSDO.badRecords):
            ARCPY.AddMessage("\n")
        if self.analysisSSDO.numObs < minNumFeatures:
            if self.FLAG_AGOL:
                self.returnJSON_FromMessageMatch_AGOL(84485, ["NumFeatures"], [str(self.analysisSSDO.numObs)],
                                                      rowStyle='<ul><li></li></ul>')
                LOGGER.error(1571, extra={"message_ID": 1571, "minNumFeatures": str(minNumFeatures)})
            else:
                ARCPY.AddIDMessage("ERROR", 1571, str(minNumFeatures), stringShape)
                self.cleanUp()
            raise SystemExit()

        if self.FLAG_AGOL:
            self.returnJSON_FromMessageMatch_AGOL(84485, ["NumFeatures"], [str(self.analysisSSDO.numObs)],
                                                  rowStyle = '<ul><li></li></ul>')
        elif self.sensitivity is None:
            msg = ARCPY.GetIDMessage(84485).format(self.analysisSSDO.numObs)
            self.printOHSAnswer(msg)
            #### Errors and Warnings ####
            self.printOHSSubject(84432, addNewLine = False)

        y = self.analysisSSDO.fields[self.varName].returnDouble()
        if self.normField:
            w = self.analysisSSDO.fields[self.normField].returnDouble()
            y = y / w
        yVar = NUM.var(y)

        #### Zero Variance ####
        if NUM.isnan(yVar) or yVar <= 1e-12:
            if self.FLAG_AGOL:
                self.returnJSON_FromError_AGOL(1575, "ERROR")
            else:
                ARCPY.AddIDMessage("ERROR", 1575)
                self.cleanUp()
            raise SystemExit()

        if self.FLAG_AGOL:
            #### Analysis Var Description ####
            varAlias = self.varName
            if self.varName in self.ssdo.fields:
                varAlias = self.ssdo.fields[self.varName].alias
            self.returnJSON_FromMessageMatch_AGOL(84446, ["VarName"], [varAlias],
                                                  rowStyle="<ul><li></li></ul>")
            self.printWeightAnswer(y)
        elif self.sensitivity is None:
            #### Analysis Var Description ####
            msg = ARCPY.GetIDMessage(84446).format(self.varName)
            #printOHSAnswer(msg, addNewLine = False)
            self.printWeightAnswer(y, ("" if UTILS.couldExportHTMLMessage() else indentAnswerStr) + msg)

        #### Locational Outliers ####
        lo = UTILS.LocationInfo(self.analysisSSDO)
        cellSize, threshold, meanDist, outliers = lo.getNearestNeighborInfo()
        if self.sensitivity is None:
            self.printOHSLocationalOutliers(outliers, aggType = 2)

        #### Raster Boundary ####
        if self.outputRaster:
            self.validateRaster(self.analysisSSDO.xyCoords)

    def doHotSpots(self, yData=None):
        if yData is not None:
            self.analysisSSDO.fields[self.varName].data = yData
        #### Scale Header ####
        if self.FLAG_AGOL:
            self.printOHSTitle_AGOL(84459)
        elif yData is None:
            self.printOHSSection(84459)

        #self.templateDir = OS.path.dirname(OS.path.dirname(SYS.argv[0]))
        if not self.bandSize2Use:
            #### Scale Subject ####
            msg = ARCPY.GetIDMessage(84460)
            ARCPY.SetProgressor("default", msg)
            if not self.FLAG_AGOL and yData is None:
                self.printOHSSubject(84460, addNewLine = False)

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
                                     stdDeviations=3.0,
                                     numNeighs=0,
                                     silent=True,
                                     stopMax=500)
            else:
                mi = MI.GlobalI_Step(self.analysisSSDO, self.varName,
                                     stdDeviations=3.0,
                                     numNeighs=0,
                                     silent=True,
                                     stopMax=500)

            #### Set Distance or KNN ####
            peakFound = False
            if mi.completed:
                if mi.firstPeakDistance:
                    distanceBand = mi.firstPeakDistance
                    distanceStr = self.ssdo.distanceInfo.printDistance(distanceBand)
                    peakInd = mi.firstPeakInd
                    if self.FLAG_AGOL:
                        self.returnJSON_FromMessageMatch_AGOL(84461, ["DistanceInfo"],
                                                              [distanceStr], rowStyle='<ul><li></li></ul><br/>')
                    elif yData is None:
                        msg = ARCPY.GetIDMessage(84461).format(distanceStr)
                        self.printOHSAnswer(msg)
                    numNeighs = 0
                    wType = 1
                    peakFound = True

                elif mi.maxPeakDistance:
                    distanceBand = mi.maxPeakDistance
                    distanceStr = self.ssdo.distanceInfo.printDistance(distanceBand)
                    peakInd = mi.maxPeakInd
                    if self.FLAG_AGOL:
                        self.returnJSON_FromMessageMatch_AGOL(84461, ["DistanceInfo"],
                                                              [distanceStr], rowStyle='<ul><li></li></ul><br/>')
                    elif yData is None:
                        msg = ARCPY.GetIDMessage(84461).format(distanceStr)
                        self.printOHSAnswer(msg)
                    numNeighs = 0
                    wType = 1
                    peakFound = True

            if not peakFound:
                #### Use KNN If No Peak OR More than 500 Neighs ####
                if not self.FLAG_AGOL and yData is None:
                    msg = ARCPY.GetIDMessage(84462)
                    self.printOHSAnswer(msg)
                calledFromSens = False
                if yData is not None:
                    calledFromSens = True
                distanceBand = self.knnDecision(self.analysisSSDO, calledFromSens)
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
                self.distanceStr = UTILS.quickLinearUnitPrint(self.bandSizeOrigin)
            else:
                self.distanceStr = self.ssdo.distanceInfo.printDistance(self.bandSize2Use)
            if self.FLAG_AGOL:
                self.returnJSON_FromMessageMatch_AGOL(84703, ["NeighborDistance"], [self.distanceStr],
                                                      rowStyle='<ul><li></li></ul><br/>')
            else:
                msg = ARCPY.GetIDMessage(84703).format(self.distanceStr)
                self.printOHSAnswer(msg)

        #### Run Local Gi* ####
        msg = ARCPY.GetIDMessage(84466)
        ARCPY.SetProgressor("default", msg)

        #### Hot Spot Header ####
        if self.FLAG_AGOL:
            self.printOHSTitle_AGOL(84466)
        elif yData is None:
            self.printOHSSection(84466)

        #### Subject w/ Value - Use AddMessage Explicitly ####
        if yData is None:
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
                           numNeighs = numNeighs,
                           permutations = numPerms,
                           applyFDR = True, thresholdOrigin = self.bandSizeOrigin,
                           normField=self.normField, sensitivity=self.sensitivity)
        if self.sensitivity:
            return gi

        #### FDR Significance ####
        numSig = (gi.giBins != 0).sum()
        if self.FLAG_AGOL:
            self.returnJSON_FromMessageMatch_AGOL(84470, ["NumSignificant"], [str(numSig)],
                                                  rowStyle='<ul><li></li></ul><br/>')
        else:
            msg = ARCPY.GetIDMessage(84470).format(numSig)
            self.printOHSAnswer(msg)

        ### Percentage of Neighbors ####
        nFeats = len(gi.neighbors)
        if nFeats:
            nn = (gi.neighbors < 8).sum()
            perNeigh = nn * 100.0 / nFeats
            perNeigh = UTILS.humanReadableFloatStr(perNeigh, '%0.1f')
            msg = ARCPY.GetIDMessage(84716).format(perNeigh, self.distanceStr)
            if not self.FLAG_AGOL:
                self.printOHSAnswer(msg, addNewLine = False)

        #### Wrap Up Header ####
        if self.FLAG_AGOL:
            self.printOHSTitle_AGOL(84471)
            #### Subject w/ Value - Use AddMessage Explicitly ####
            giField, pvField = gi.outputResults(addTextField=True)
            if self.varName:
                #### use 84476/84477 ####
                if self.varName in self.ssdo.fields:
                    varString = self.ssdo.fields[self.varName].alias
                else:
                    varString = self.varName
                self.returnJSON_FromMessageMatch_AGOL(84476, ["FieldName"], [varString],
                                                      rowStyle='<ul><li></li></ul>')
                self.returnJSON_FromMessageMatch_AGOL(84477, ["FieldName"], [varString],
                                                      rowStyle='<ul><li></li></ul><br/>')
            else:
                #### use 84469_0/84469_1 ####
                self.returnJSON_FromMessageMatch_AGOL("84469_0", [], [],
                                                      rowStyle='<ul><li></li></ul>',
                                                      msg2Use=ARCPY.GetIDMessage(84476).format(self.varString))
                self.returnJSON_FromMessageMatch_AGOL("84469_1", [], [],
                                                      rowStyle='<ul><li></li></ul>',
                                                      msg2Use=ARCPY.GetIDMessage(84477).format(self.varString))
        else:
            self.printOHSSection(84471)
            #### Subject w/ Value - Use AddMessage Explicitly ####
            outMSG = ARCPY.GetIDMessage(84475).format(self.outputFC)
            ARCPY.AddMessage(outMSG)
            giField, pvField = gi.outputResults()

            hotMSG = ARCPY.GetIDMessage(84476).format(self.varString)
            # printOHSAnswer(hotMSG, addNewLine = False)
            coldMSG = ARCPY.GetIDMessage(84477).format(self.varString)
            # printOHSAnswer(coldMSG)
            UTILS.outputBulletList([hotMSG, coldMSG], ordered=True, force2Txt=False)

        #### Set the Default Symbology ####
        isPro = UTILS.isPRO()
        try:
            renderType = UTILS.renderType[self.analysisSSDO.shapeType.upper()]
            renderLayerFile = GISTAR.giRenderDict[renderType]
            if isPro:
                renderLayerFile += ".lyrx"
                UTILS.buildLocaleCIMLayer(renderLayerFile, 1)
            else:
                renderLayerFile += ".lyr"
                fullRLF = OS.path.join(UTILS.pathLayers, renderLayerFile)
                self.params[1].symbology = fullRLF
        except:
            if self.FLAG_AGOL:
                self.returnJSON_FromError_AGOL(973, "WARNING")
            else:
                ARCPY.AddIDMessage("WARNING", 973)

        #### Set Chart Output ####
        if isPro and not self.FLAG_AGOL:
            y = self.analysisSSDO.fields[self.varName].returnDouble()
            numBreaks = int(STATS.riskFunBins(y, 8, 64, 1))
            riceBreaks = STATS.riceBins(self.analysisSSDO.numObs)

            #### Get Mapped Output Field Name ####
            outFieldName = self.analysisSSDO.in2OutFieldMap[self.varName]
            outFieldNameAlias = self.analysisSSDO.fields[self.varName].alias
            title = ARCPY.GetIDMessage(84795).format(outFieldNameAlias)
            if riceBreaks < numBreaks:
                numBreaks = riceBreaks

            chart = ARCPY.Chart("Histogram of Optimized Hot Spot Analysis Variable")
            chart.type = "histogram"
            chart.xAxis.field = outFieldName
            chart.xAxis.title = outFieldNameAlias
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
            if self.FLAG_AGOL:
                self.printOHSBullet_AGOL(84480)
            else:
                self.printOHSSubject(84480)
        else:
            if varName:
                msg = ARCPY.GetIDMessage(84479)
                rasterLayerFile = "PointDensityHSGray.lyr"
            else:
                msg = ARCPY.GetIDMessage(84478)
                rasterLayerFile = "PointDensityHSGrayPoints.lyr"
            ARCPY.SetProgressor("default", msg)

            if self.FLAG_AGOL:
                #### Distance Band Answer ####
                self.returnJSON_FromMessageMatch_AGOL(84481, ["DistanceInfo"], [self.distanceStr],
                                                      rowStyle='<ul><li></li></ul>')
            else:
                #### Subject w/ Value - Use AddMessage Explicitly ####
                outMSG = ARCPY.GetIDMessage(84497).format(outputRaster)
                ARCPY.AddMessage(outMSG)

                #### Distance Band Answer ####
                msg = ARCPY.GetIDMessage(84481).format(self.distanceStr)
                self.printOHSAnswer(msg, addNewLine = False)

                #### Clip Message ####
                if self.maskExists:
                    msg = ARCPY.GetIDMessage(84483)
                else:
                    msg = ARCPY.GetIDMessage(84482)
                self.printOHSAnswer(msg)

            #### Do Raster ####
            try:
                UTILS.fc2DensityRaster(self.ssdo.inputFC, outputRaster,
                                       varName,
                                       boundaryFC = self.boundaryFC,
                                       searchRadius = self.distanceBand)
            except:
                if self.FLAG_AGOL:
                    self.printOHSBullet_AGOL(84498)
                else:
                    msg = ARCPY.GetIDMessage(84498)
                    self.printOHSAnswer(msg)

            #### Set Symbology ####
            fullRLF = OS.path.join(UTILS.pathLayers, rasterLayerFile)
            self.params[6].symbology = fullRLF

class OptHotSpotSensitivity():
    def __init__(self, Input_Features, Output_Features, Analysis_Field, 
                 Incident_Data_Aggregation_Method, 
                 Bounding_Polygons_Defining_Where_Incidents_Are_Possible,
                 Polygons_For_Aggregating_Incidents_Into_Counts,
                 Density_Surface, Cell_Size, Distance_Band,
                 sensitivity_info, parameters):
        self.inputFC = Input_Features
        self.outputFC = Output_Features
        self.varName = Analysis_Field.upper()
        self.sensitivityInfo = sensitivity_info
        self.parameters = parameters
        self.aggType = Incident_Data_Aggregation_Method
        self.Distance_Band = Distance_Band
        self.bandSizeOrigin = Distance_Band
        self.parameters = parameters

    def execute(self):
        import scipy.stats as SPSTAT
        import SSAttributeUncertainty as SSU

        fields = set()
        fields.add(self.varName)

        if self.sensitivityInfo['uncertainty_measure'] == "MOE":
            senFields = self.sensitivityInfo['moe_field'].split(" ")
            sensitivity = {"MOE": senFields[1]}
            for field in senFields:
                fields.add(field.upper())
        if self.sensitivityInfo['uncertainty_measure'] == "CONFIDENCE_BOUNDS":
            senFields = self.sensitivityInfo['confidence_bound_field'].split(" ")
            sensitivity = {"lowField": senFields[1], "highField": senFields[2]}
            if senFields[1] in [None, "", "#"] or senFields[2] in [None, "", "#"]:
                ARCPY.AddError(fr"The Lower and Higher Bound Field should be provided for {senFields[0]}")
                raise SystemExit()
            for field in senFields:
                fields.add(field.upper())
        if self.sensitivityInfo['uncertainty_measure'] == "PERCENTAGE":
            senFields = self.sensitivityInfo['randomize_pct'].split(" ")
            sensitivity = {"percentageLow": UTILS.strToFloat(senFields[1]), "percentageHigh": UTILS.strToFloat(senFields[2])}

        sensitivity.update(self.sensitivityInfo)
        varNameList = [fld for fld in fields]

        #### Create SSDO ####
        ssdo = SSDO.SSDataObject(self.inputFC,  templateFC = self.outputFC,
                                 useChordal = True)

        #### Set Unique ID Field ####
        extentFactor = ssdo.distanceInfo.convertFactor

        if self.Distance_Band not in [None, "", "#"]:

            userBandSize, userBandUnit = self.Distance_Band.replace("\"","").split(" ")
            self.bandSizeOrigin = self.Distance_Band.replace("\"","")
            userBandUnit = userBandUnit.upper().replace(" ", "_")
            if userBandSize != '':
                try:
                    userBandSize = UTILS.strToFloat(userBandSize)
                except:
                    ARCPY.AddIDMessage("WARNING", 110009)

                if userBandUnit not in UTILS.supportDist:
                    ARCPY.AddIDMessage("ERROR", 110010)
                    raise SystemExit()

                bandSizeStr, bandSizeFactor = UTILS.distanceUnitInfo[userBandUnit]
                self.Distance_Band = (userBandSize * bandSizeFactor) / extentFactor
        else:
            self.Distance_Band = None
            self.bandSizeOrigin = None

        processingBandSize = self.Distance_Band
        processingCellSize = None
        cellSizeOrigin = None
        bandSizeOrigin = self.bandSizeOrigin

        seed = UTILS.getRandomSeed()
        #### Generate Seed if It is not Provided ####
        if seed == 0:
            seed = int(NUM.random.randint(35000))

        msg = ARCPY.GetIDMessage(84821)
        ARCPY.AddMessage(msg.format(seed))
        NUM.random.seed(seed)

        numSimulations = int(self.sensitivityInfo["num_simulations"])
        seeds = NUM.arange(numSimulations*5000)
        NUM.random.shuffle(seeds)
        seeds = seeds[0:numSimulations]
        #### obtain Z factor ####
        confidenceLevelValue = int(sensitivity["moe_conf_level"])/100
        zFactor = SPSTAT.norm.ppf(1.0- (1-confidenceLevelValue)/2)

        ohsa = OptHotSpots(ssdo, self.outputFC, varName = self.varName, aggType = self.aggType,
                        cellSize2Use = processingCellSize,
                        bandSize2Use = processingBandSize, parameters = self.parameters,
                        cellSizeOrigin = cellSizeOrigin, bandSizeOrigin = bandSizeOrigin,
                        sensitivity=sensitivity)

        giBins = NUM.zeros((ssdo.numObs,numSimulations))
        giPVal = NUM.zeros((ssdo.numObs,numSimulations), dtype = NUM.float64)
        giVals = NUM.zeros((ssdo.numObs,numSimulations), dtype = NUM.float64)
        varAlias = ssdo.fields[self.varName].alias

        #### Define basic fields ####
        maxSim = SSDO.CandidateField("SimMax", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).min, dtype = float), alias = fr"{varAlias} ({ARCPY.GetIDMessage(220934)})")
        minSim = SSDO.CandidateField("SimMin", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).max, dtype = float), alias = fr"{varAlias} ({ARCPY.GetIDMessage(220936)})")
        C99 = SSDO.CandidateField("NumSimC99", "LONG", NUM.zeros(ssdo.numObs), alias = ARCPY.GetIDMessage(220974).format(99))
        C95 = SSDO.CandidateField("NumSimC95", "LONG", NUM.zeros(ssdo.numObs), alias = ARCPY.GetIDMessage(220974).format(95))
        C90 = SSDO.CandidateField("NumSimC90", "LONG", NUM.zeros(ssdo.numObs), alias = ARCPY.GetIDMessage(220974).format(90))
        NS =  SSDO.CandidateField("NumSimNS", "LONG", NUM.zeros(ssdo.numObs), alias =  ARCPY.GetIDMessage(220976))
        H90 = SSDO.CandidateField("NumSimH90", "LONG", NUM.zeros(ssdo.numObs), alias = ARCPY.GetIDMessage(220975).format(90))
        H95 = SSDO.CandidateField("NumSimH95", "LONG", NUM.zeros(ssdo.numObs), alias = ARCPY.GetIDMessage(220975).format(95))
        H99 = SSDO.CandidateField("NumSimH99", "LONG", NUM.zeros(ssdo.numObs), alias = ARCPY.GetIDMessage(220975).format(99))

        countV = {-3: C99, -2: C95, -1: C90, 0: NS, 1: H90, 2: H95, 3: H99}

        #### Obtain the path to save the simulations ####
        pathWS = UTILS.getOutputSimulation(self.parameters[10], self.parameters[0])
        orginalData = ohsa.analysisSSDO.fields[self.varName].data.copy()
        meanValue = 0
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220942))

        for sim in NUM.arange(numSimulations):

            #### Check for Cancel ####
            if ARCPY.env.isCancelled:
                raise SystemExit()

            yData = self.getDataRealization(ohsa.analysisSSDO, self.varName, sensitivity, seeds[sim], neighborsMean=None, zFactor=zFactor)
            meanValue += yData.sum() / (ssdo.numObs * numSimulations)
            maxSim.data = NUM.maximum(maxSim.data, yData)
            minSim.data = NUM.minimum(minSim.data, yData)
            
            gi = ohsa.doHotSpots(yData)
            gi.initialize(yData)
            gi.construct()

            giBins.T[sim] = gi.giBins

            for i in [-3,-2,-1,0,1,2,3]:
                countV[i].data += (gi.giBins == i)

            giPVal.T[sim] = gi.pv
            giVals.T[sim] = gi.gi

            if pathWS is not None:

                varNameOutput = gi.varName
                if ".shp" in pathWS.lower():
                    varNameOutput = gi.varName[0:10]

                candidateFieldSim = SSDO.CandidateField(varNameOutput, "DOUBLE", yData, alias = ssdo.fields[self.varName].alias)
                gi.outputResults(newFields=[candidateFieldSim], ouputPathInWorkspace=pathWS.format(f'{sim:03}'), includeOriginalAnalysisVariable = False)

            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220948).format(sim))

        #### original GI ####
        gi = ohsa.doHotSpots(orginalData)
        gi.initialize(orginalData)
        gi.construct()

        values = SPSTAT.mode(giBins, axis=1)
        counts = values[1].ravel()

        #### Get the counts when GI* value was equal to the simulated  ####
        countEqual =  NUM.zeros(ssdo.numObs)
        for index in NUM.arange(ssdo.numObs):
            if gi.giBins[index] in countV:
                countEqual[index] = countV[gi.giBins[index]].data[index]

        predGiBin = SSDO.CandidateField("PredGiBin", "LONG", values[0].ravel(), alias = ARCPY.GetIDMessage(220977))
        predCount = SSDO.CandidateField("PredCount", "LONG", counts, alias = ARCPY.GetIDMessage(220978))
        percCount = SSDO.CandidateField("PredPcnt", "DOUBLE", NUM.asarray(100*counts/numSimulations, float), alias = ARCPY.GetIDMessage(220979))
        gibinCatPred = SSDO.CandidateField("PredCat", "LONG", values[0].ravel(), alias = ARCPY.GetIDMessage(220980), cvDomain = GISTAR.cvDomainShort)
        gibinCat = SSDO.CandidateField("GIBIN_CAT", "LONG" ,gi.giBins, alias = ARCPY.GetIDMessage(220981), cvDomain = GISTAR.cvDomainShort)
        similarCount = SSDO.CandidateField("GIBIN_Count", "LONG", countEqual, alias = ARCPY.GetIDMessage(220982))
        similarPerc = SSDO.CandidateField("GIBIN_Pcnt", "DOUBLE", NUM.asarray(100*countEqual/numSimulations, float), alias = ARCPY.GetIDMessage(220983))

        candidateFields = []

        candidateFields.extend([gibinCat, maxSim, minSim,C99, C95, C90, NS, H90, H95, H99, predGiBin, gibinCatPred, predCount, percCount, similarCount, similarPerc])

        listFieldsToAddFromSouuce = []
        if "MOE" in  sensitivity:
            listFieldsToAddFromSouuce.append(sensitivity["MOE"].upper())
        if "lowField"  in sensitivity:
            listFieldsToAddFromSouuce.append(sensitivity["lowField"].upper())
            listFieldsToAddFromSouuce.append(sensitivity["highField"].upper())

        ohsa.analysisSSDO.fields[self.varName].data = orginalData

        giField, pvField = gi.outputResults(newFields = candidateFields, listFieldsToAddFromSouuce = listFieldsToAddFromSouuce )

        #### Get Natural Breaks ####
        breaksString = SSU.getNaturalBreaks(gibinCat,gibinCatPred)

        gi.renderResults(self.parameters, simulationInformation = {"field":"Gi_Bin", "heading":ARCPY.GetIDMessage(220984), "popup":SSU.createPopup(fr"//{breaksString}")})

        ### Add Group Layer ###
        self.addGroupLayer(gi, self.outputFC)

        ### Add GP Messages ###
        minValue = NUM.min(minSim.data)
        maxValue = NUM.max(maxSim.data)
        self.printMessages(ssdo, self.parameters, self.varName, minValue, meanValue, maxValue)

    def addGroupLayer(self, gi, outputFC):
        import SSAttributeUncertainty as SSU
        #### Add Group Layer ####
        glParameterIndex = 13
        ### retrieve the index of the output group layer parameter ###
        for i in NUM.arange(len(self.parameters)):
            if self.parameters[i].name == "out_group_layer":
                glParameterIndex = int(i)
                break
        SSU.addGroupLayer(gi, outputFC, glParameterIndex, "GIBIN_Pcnt")

    def getDataRealization(self, ssdo, varName, sensitivity, seed, neighborsMean, zFactor):
        """Get a realization of the data based on the sensitivity parameters.
        INPUT:
            ssdo (object): SSDO object
            varName (string): variable name
            sensitivity (dictionary): sensitivity parameters
            seed (int): random seed
            neighborsMean (array): mean value of neighbors
            zFactor (float): z factor
        OUTPUT:
            yData (array): data realization
        """
        return STATS.getRealization(ssdo, varName, sensitivity, seed, neighborsMean, zFactor)


    def printMessages(self, ssdo, parameters, varName, minValue, meanValue, maxValue):
        """ Print Message about variability of the data
        INPUT:
            ssdo (object): SSDO object
            parameters (list): parameters
            varName (string): variable name
            minValue (float): minimum value
            meanValue (float): mean value
            maxValue (float): maximum value
        """
        import SSAttributeUncertainty as SSU
        SSU.printMessages(ARCPY.GetIDMessage(220995), ssdo, parameters, varName, minValue, meanValue, maxValue)