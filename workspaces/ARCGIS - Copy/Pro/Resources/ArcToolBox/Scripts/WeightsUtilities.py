# coding: utf-8
"""
Source Name:   WeightsUtilities.py
Version:       ArcGIS 10.1
Author:        Environmental Systems Research Institute Inc.
Description:   Utilities for creating, managing and utilizing 
               spatial weights matrix files.
"""

################### Imports ########################
import os as OS
import collections as COLL
import numpy as NUM
import arcgisscripting as ARC
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.analysis as ANA
import arcpy.da as DA
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import SSPanelObject as SSPO
import SSPanel as PANEL
import SSCube as CUBE
import gapy as GAPY
import locale as LOCALE
import collections as COLL
import Stats as STATS
import scipy.spatial as SCPS
LOCALE.setlocale(LOCALE.LC_ALL, '')
import logging
from loggerutils import init_ss_logger
LOGGER = init_ss_logger(__name__, logging.DEBUG)

################## Dispatch ########################

supportDist = ["FEET", "FOOT", "US_FEET", "US_FOOT", "FOOT_US", 
               "METERS", "METER", "KILOMETER", "KILOMETERS", 
               "MILE", "MILES", "US_MILES", "US_MILE", "MILE_US",
               "FEETINT", "MILESINT"]

weightDispatch = {'INVERSE_DISTANCE': 0, 
                  'FIXED_DISTANCE': 1, 
                  'K_NEAREST_NEIGHBORS': 2, 
                  'DELAUNAY_TRIANGULATION': 3,
                  'CONTIGUITY_EDGES_ONLY': 4,
                  'CONTIGUITY_EDGES_CORNERS': 5, 
                  'CONVERT_TABLE': 6,
                  'ZONE_OF_INDIFFERENCE': 7,
                  'GET_SPATIAL_WEIGHTS_FROM_FILE': 8,
                  'SPACE_TIME_WINDOW': 9,
                  'NETWORK': 10,
                  'UNKNOWN': -1}

wTypeDispatch = {0: 'INVERSE_DISTANCE', 
                 1: 'FIXED_DISTANCE', 
                 2: 'K_NEAREST_NEIGHBORS', 
                 3: 'DELAUNAY_TRIANGULATION',
                 4: 'CONTIGUITY_EDGES_ONLY',
                 5: 'CONTIGUITY_EDGES_CORNERS',
                 6: 'CONVERT_TABLE',
                 7: 'ZONE_OF_INDIFFERENCE',
                 8: 'GET_SPATIAL_WEIGHTS_FROM_FILE',
                 9: 'SPACE_TIME_WINDOW',
                 10: 'NETWORK',
                 -1: 'UNKNOWN'}

conceptDispatch = {'EUCLIDEAN': 'EUCLIDEAN',
                   'MANHATTAN': 'MANHATTAN',
                   "EUCLIDEAN_DISTANCE": "EUCLIDEAN",
                   "MANHATTAN_DISTANCE": "MANHATTAN"}

convertConcept = {
"INVERSE_DISTANCE": 'INVERSE_DISTANCE',
"INVERSE_DISTANCE_SQUARED": 'INVERSE_DISTANCE',
"FIXED_DISTANCE_BAND": "FIXED_DISTANCE",
"ZONE_OF_INDIFFERENCE": "ZONE_OF_INDIFFERENCE",
"POLYGON_CONTIGUITY_(FIRST_ORDER)": "CONTIGUITY_EDGES_ONLY",
"CONTIGUITY_EDGES_ONLY": "CONTIGUITY_EDGES_ONLY",
"CONTIGUITY_EDGES_CORNERS": "CONTIGUITY_EDGES_CORNERS",
"GET_SPATIAL_WEIGHTS_FROM_FILE": "GET_SPATIAL_WEIGHTS_FROM_FILE",
'K_NEAREST_NEIGHBORS':'K_NEAREST_NEIGHBORS'
}

gaTypes = { 'INVERSE_DISTANCE': True,
            'FIXED_DISTANCE': True,
            'ZONE_OF_INDIFFERENCE': True,
            'K_NEAREST_NEIGHBORS': True,
            'DELAUNAY_TRIANGULATION': True,
            'SPACE_TIME_WINDOW': True,
            'CONTIGUITY_EDGES_ONLY': False,
            'CONTIGUITY_EDGES_CORNERS': False,
            'CONVERT_TABLE': False,
            'GET_SPATIAL_WEIGHTS_FROM_FILE': False }

concept2Alias = {0: "IDW", 1: "Fixed", 2: "KNN", 4: "Contiguity", 7: "ZOI"}
scipyTypes = ['FIXED_DISTANCE', 'K_NEAREST_NEIGHBORS', 
              'CONTIGUITY_EDGES_ONLY', 'CONTIGUITY_EDGES_CORNERS']
polyTypes = ['CONTIGUITY_EDGES_ONLY', 'CONTIGUITY_EDGES_CORNERS']

warnNumberOfNeighbors = 1000
maxNumberOfNeighbors = None
maxDefaultNumNeighs = 500

############### Spatial Weights Classes and Functions ################

def globalCoincidentPointChecker(ssdo, maxNumNeighs):
    try:
        maxCoin = ssdo.counts.max()
        if maxCoin >= maxNumNeighs or maxCoin == ssdo.numObs:
            ARCPY.AddIDMessage("ERROR", 110246, str(maxCoin), str(ssdo.numObs))
            raise SystemExit()
    except:
        return

def getValidNumNeighs(numNeighs, numObs, wType):

    #### Check Number of Neighbors for KNN ####
    if numNeighs is None or numNeighs <= 0:
        if wType == 2:
            #### KNN Option ####
            ARCPY.AddIDMessage("ERROR", 976)
            raise SystemExit()

        else:
            #### Set Hybrid to 0 if None ####
            numNeighs = 0

    #### Assure k-Nearest is Less Than Number of Features ####
    if numNeighs >= numObs:
        ARCPY.AddIDMessage("ERROR", 975)
        raise SystemExit()

    return numNeighs

def clippedDelaunayNeighbors(ssdo):
    delaunay = ARC._ss.delaunay_point_neighbors(ssdo.uniqueXY, ssdo.spatialRef)
    if ssdo.numUnique == ssdo.numObs:
        #### No Coincident Points ####
        return delaunay

    else:
        #### Coincident Point Mapper ####
        pointMapper = STATS.mapFromUniqueCounts(ssdo.xyCoords, ssdo.counts)

    

def reportNoNeighborsGeneral(numObs, noNeighs, masterField, 
                             failAllNoNeighs = True, 
                             silentStats = False):
    """Report if Any Features Have No Neighbors."""

    #### All Features Have No Neighbors ####
    if len(noNeighs) == numObs:
        if failAllNoNeighs:
            ARCPY.AddIDMessage("Error", 908)
            raise SystemExit()
        else:
            #### Technically Allowed for Hot-Spot Analysis ####
            ARCPY.AddIDMessage("Warning", 908)

    #### Report First With No Neighbors ####
    countNoNeighs = len(noNeighs)
    if countNoNeighs:
        noNeighs.sort()
        if countNoNeighs > 30:
            noNeighs = noNeighs[0:30]
        
        ERROR.warningNoNeighbors(numObs, countNoNeighs, noNeighs, 
                                 masterField, silentStats = silentStats)

class DistanceFeatures(object):
    """Class to create/store distance features.

    INPUTS:
    ssdo (obj): instance of SSDataObject

    ATTRIBUTES:
    coords (array): origin coordinates
    originIsPoint (bool): whether origins are points
    paths (list): list of paths to distance features
    names (list): validated distance feature names for output fields
    types (list): shape types for distance features
    trees (dict): name: instance of kdTree (1)
    distances (dict): name: numpy array of distances

    METHODS:
    addFeatures
    __addNearFeatures
    __addPoint2PointFeatures
    __addExistingPoint2PointFeatures

    NOTES:
    (1) kdTree only exists when both origin and destinations are points
    """

    def __init__(self, ssdo, unit = None, forceNear = False):
        self.ssdo = ssdo
        self.originIsPoint = ssdo.shapeType.upper() == "POINT"
        self.paths = []
        self.names = []
        self.types = []
        self.trees = {}
        self.distances = {}
        self.unit = unit
        self.forceNear = forceNear

        #### Set Origin Coords ####
        n = ssdo.numObs
        if ssdo.useChordal:
            #### Chordal Distance XYZ ###
            self.coords = ssdo.spheroidCoords
        else:
            self.coords = ssdo.xyCoords

    def addFeatures(self, distanceFC, existingDF = None):
        """Add Distance Features.

        INPUTS:
        distanceFC (str): point features for nearest distance calculations
        existingDF {obj, None}: optional instance of existing Distance Features
        """

        ssdo = self.ssdo
        ssdoDest = SSDO.SSDataObject(distanceFC, 
                                     explicitSpatialRef = ssdo.spatialRef,
                                     useChordal = ssdo.useChordal)

        #### Store Base Info ####
        self.paths.append(ssdoDest.catPath)
        self.names.append(ssdoDest.inName)
        shapeType = ssdoDest.shapeType.upper()
        self.types.append(shapeType)

        #### Create/Add Distances ####
        if self.forceNear:
            self.__addNearFeatures(ssdoDest)
        else:
            if self.originIsPoint and shapeType == "POINT":
                if existingDF is not None:
                    self.__addExistingPoint2PointFeatures(ssdoDest, existingDF)
                else:
                    self.__addPoint2PointFeatures(ssdoDest)
            else:
                self.__addNearFeatures(ssdoDest)

    def __addPoint2PointFeatures(self, ssdoDest):
        """Add Point to Point Distance Features.

        INPUTS:
        ssdoDest (obj): initialized SSDataObject for distance features (1)

        NOTES:
        (1) obtainData has not been called yet 
        """

        #### Read Distance Features ####
        ssdoDest.obtainData()

        #### Apply conversion ####
        applyConversion = False

        #### Set Dest Coords ####
        if self.ssdo.useChordal:
            #### Chordal Distance XYZ ###
            destCoords = ssdoDest.spheroidCoords
        else:
            destCoords = ssdoDest.xyCoords

            if self.unit is not None and self.unit != UTILS.getDistanceUnit(self.ssdo):
                applyConversion = True


        #### Build Tree ####
        kdTree = SCPS.cKDTree(destCoords)

        #### Query Distances ####
        distances, nhs = kdTree.query(self.coords, k = 1, p = 2)

        #### Store Tree and Distance Vector ####
        self.trees[ssdoDest.inName] = kdTree 
        if not applyConversion:
            self.distances[ssdoDest.inName] = distances
        else:
            self.distances[ssdoDest.inName] = self.__basicCorversion(distances, self.unit, UTILS.getDistanceUnit(self.ssdo))

    def __basicCorversion(self, data, unitTarget, unitBase):
        try:
            meters = data*UTILS.distanceUnitInfo[unitBase.upper()][1]
            return meters/UTILS.distanceUnitInfo[unitTarget.upper()][1]
        except:
            return data

    def __addNearFeatures(self, ssdoDest):
        """Add Near Table Distances for Non Point 2 Point Features.

        INPUTS:
        ssdoDest (obj): initialized SSDataObject for distance features (1)

        NOTES:
        (1) obtainData has not been called yet 
        """

        #### Generate Near Table ####
        outputTable = UTILS.returnScratchName("NearTab_WU", 
                           scratchWS = ARCPY.env.scratchGDB)
        nearWithSpatialRef = UTILS.funWithSpatialRef(ANA.GenerateNearTable,
                                                     self.ssdo.spatialRef)
        nearWithSpatialRef(self.ssdo.inputFC, ssdoDest.inputFC, 
                           outputTable, None, "NO_LOCATION", 
                           "NO_ANGLE", "CLOSEST", 0, "PLANAR", self.unit )

        #### Create Distance Vector ####
        distances = NUM.zeros((self.ssdo.numObs,), dtype = float)
        rows = DA.SearchCursor(outputTable, ['IN_FID', 'NEAR_DIST'])
        for row in rows:
            if row[0] in self.ssdo.master2Order:
                orderID = self.ssdo.master2Order[row[0]]
                distances[orderID] = row[1]

        del rows
        UTILS.passiveDelete(outputTable)

        #### Store Distances ####
        self.distances[ssdoDest.inName] = distances

    def __addExistingPoint2PointFeatures(self, ssdoDest, existingDF):
        """Add Point 2 Point Distances from Existing Distance Features.

        INPUTS:
        ssdoDest (obj): initialized SSDataObject for distance features (1)
        existingDF (obj): instance of Distance Features

        NOTES:
        (1) obtainData has not been called yet 
        """

        #### Copy KDTree ####
        kdTree = existingDF.trees[ssdoDest.inName]

        #### Query Distances ####
        distances, nhs = kdTree.query(self.coords, k = 1, p = 2)

        #### Store Tree and Distance Vector ####
        self.trees[ssdoDest.inName] = kdTree 
        self.distances[ssdoDest.inName] = distances

    def getOutputFieldNames(self, outPath):
        """Uses logic from UTILS.createAppendFieldNames()."""

        return UTILS.createAppendFieldNames(self.names, outPath)


class SciPyNeighborSearch(object):
    """
    SSCube class provided Cube exclusive I/O and API, storing required attribute

    INPUT:
        ssObject (object): Instance of SSDataObject, SSPanelObject, SSPanel
                           or SSCube

    METHOD:
        resetSearchCriteria(): change spatio-temporal search params after init
        getBaseNeighbors(): get spatial neighbors only in first time slice

    ATTRIBUTES:
        initType (int): 0: SSDataObject, 1: SSPanelObject, 2: SSPanel, 3: SSCube
        initName (str): 'SSDataObject', 'SSPanelObject', 'SSPanel', 'SSCube'
        numTime (int): Number of time slices in cube
        numLocations (int): number of fixed locations
        numObs (int): numTime x numLocations
        kdTree (object): instance of SCPS.cKDTree

    """

    def __init__(self, ssObject, spaceConcept = "FIXED_DISTANCE",
                 threshold = None, numNeighs = None, distanceType = "EUCLIDEAN",
                 timeOrder = 0, backwardsOnly = True,
                 iniKdTree = True, analysisMask = None,
                 enableWarning = True, scratch = None,
                 honorSSDOChordal = False):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Check Spatial Concept ####
        self.__checkConcept()

        if isinstance(ssObject, SSDO.SSDataObject):
            self.__initSSDO()
            self.init_type = 0
        elif isinstance(ssObject, SSPO.SSPanelObject):
            self.__initSSPO()
            self.init_type = 1
        elif isinstance(ssObject, PANEL.SSPanel):
            self.__initPANEL()
            self.init_type = 2
        elif isinstance(ssObject, CUBE.SSCube):
            self.__initCUBE()
            self.init_type = 3
        else:
            ARCPY.AddIDMessage("ERROR", 110121)
            raise SystemExit()

        #### Set Info ####
        self.__setInfo()

    def __setInfo(self):
        #### Set Distance Type ####
        self.__setDistanceType(self.distanceType)

        #### Set Time Info ####
        self.__setTimeInfo(self.timeOrder, self.backwardsOnly)

        #### Set KNN Info ####
        self.__setKNNInfo(self.numNeighs)

        if self.spaceConcept in polyTypes:
            self.__setContiguity()
        else:
            if self.spaceConcept == 'K_NEAREST_NEIGHBORS':
                self.__setKNN()
            else:
                self.__setFixedDistance()

    def resetInfo(self, threshold = None, numNeighs = None):
        """For Internal Use.  There are no checks for the parameters."""

        if threshold is None and numNeighs is None:
            return 

        if threshold is not None:
            self.spaceConcept = "FIXED_DISTANCE"
            self.threshold = threshold
            if numNeighs is not None:
                self.numNeighs = numNeighs
                self.k = self.numNeighs + 1
                self.getNeighbors = self.__getHybrid
                self.getSpatialNeighbors = self.__getHybridSpatial
            else:
                self.numNeighs = None
                self.k = None 
                self.getNeighbors = self.__getDistance
                self.getSpatialNeighbors = self.__getDistanceSpatial
        else:
            self.spaceConcept = "K_NEAREST_NEIGHBORS"
            self.numNeighs = numNeighs
            self.k = self.numNeighs + 1
            self.getNeighbors = self.__getKNN
            self.getSpatialNeighbors = self.__getKNNSpatial
            
    def __checkConcept(self):
        if self.spaceConcept not in scipyTypes:
            msg = "{0} is not a valid value in {1}"
            msg = msg.format(self.spaceConcept, ", ".join(scipyTypes))
            ARCPY.AddError(msg)
            raise SystemExit()

    def __initSSDO(self):
        self.initType = 0
        self.initName = 'SSDataObject'
        self.numLocations = self.ssObject.numObs
        self.numTime = 1
        self.numObs = self.numLocations
        if self.ssObject.useChordal and self.honorSSDOChordal:
            #### Explicitely Set Spheroid Coords ####
            self.__setSpheroidCoords()
        else:
            self.__setCoords(self.ssObject.xyCoords, self.ssObject.zCoords)
        self.isSpaceTime = False
        self.geometryUnit = self.ssObject.distanceInfo.name
        self.convertFactor = self.ssObject.distanceInfo.convertFactor

        if self.ssObject.useChordal:
            self.maxExtent = self.ssObject.sliceInfo.maxExtent
        else:
            self.maxExtent = self.ssObject.envelope.maxExtent

        if self.ssObject.hasZ and self.ssObject.zCoords is not None:
            self.maxExtent = max(self.ssObject.zCoords.max() - self.ssObject.zCoords.min(), self.maxExtent)

    def __initSSPO(self):
        self.initType = 1
        self.initName = 'SSPanelObject'
        self.numLocations = self.ssObject.numLocations
        self.numTime = self.ssObject.numTime
        self.numObs = self.ssObject.numObs
        self.__setCoords(self.ssObject.xyCoords, self.ssObject.zCoords)
        self.isSpaceTime = self.numTime > 1
        self.geometryUnit = self.ssObject.ssdo.distanceInfo.name
        self.convertFactor = self.ssObject.ssdo.distanceInfo.convertFactor
        if self.ssObject.ssdo.useChordal:
            self.maxExtent = self.ssObject.ssdo.sliceInfo.maxExtent
        else:
            self.maxExtent = self.ssObject.ssdo.envelope.maxExtent

    def __initPANEL(self):
        self.initType = 2
        self.initName = 'SSPanel'
        x = self.ssObject.dataset.variables['x'][:]
        y = self.ssObject.dataset.variables['y'][:]
        self.numLocations = self.ssObject.numLocations
        self.numTime = self.ssObject.numTime
        self.numObs = self.ssObject.numObs
        xyCoords = NUM.empty((self.numLocations, 2), dtype = float)
        xyCoords[:,0] = x
        xyCoords[:,1] = y
        self.__setCoords(xyCoords)
        self.isSpaceTime = self.numTime > 1
        self.geometryUnit = self.ssObject.geometryUnit
        self.convertFactor = self.ssObject.convertFactor
        self.maxExtent = self.ssObject.maxExtent

    def __initCUBE(self):
        self.initType = 3
        self.initName = 'SSCube'
        x = NUM.tile(self.ssObject.x, self.ssObject.numRows)
        y = NUM.repeat(self.ssObject.y, self.ssObject.numCols)
        if self.ssObject.isHexagon:
            shift = (NUM.sqrt(3.0) * self.ssObject.cellSize) * .5
            indices = NUM.arange(self.ssObject.numCols, dtype = NUM.int32)
            rowAdjust = NUM.array(NUM.fmod(indices, 2), dtype = bool)
            rowAdjust = NUM.tile(rowAdjust, self.ssObject.numRows)
            y[rowAdjust] -= shift

        self.numLocations = self.ssObject.numLocations
        self.numTime = self.ssObject.numTime
        self.numObs = self.ssObject.numObs
        xyCoords = NUM.empty((self.numLocations, 2), dtype = float)
        xyCoords[:,0] = x
        xyCoords[:,1] = y
        self.__setCoords(xyCoords)
        self.isSpaceTime = self.numTime > 1
        self.geometryUnit = self.ssObject.geometryUnit
        self.convertFactor = self.ssObject.convertFactor
        self.maxExtent = self.ssObject.maxExtent

    def __setSpheroidCoords(self):
        self.coords = self.ssObject.spheroidCoords

    def __setCoords(self, xyCoords, zCoords = None):
        if zCoords is not None:
            self.hasZ = True
            self.coords = NUM.empty((self.numLocations, 3), dtype = float)
            self.coords[:,0:2] = xyCoords
            self.coords[:,-1] = zCoords
        else:
            self.hasZ = False
            self.coords = xyCoords

        if self.analysisMask is not None:
            self.coords = self.coords[self.analysisMask]
            self.numLocations = len(self.coords)
            self.numObs = self.numLocations * self.numTime

    def __setDistanceType(self, distanceType):
        try:
            upperDist = distanceType.upper()
            if upperDist == "MANHATTAN":
                self.p = 1
            else:
                upperDist = "EUCLIDEAN"
                self.p = 2
        except AttributeError:
            upperDist = "EUCLIDEAN"
            self.p = 2
            
        self.distanceType = upperDist

    def __setTimeInfo(self, timeOrder, backwardsOnly):
        #### Set Temporal Criteria ####
        if self.isSpaceTime:
            self.timeOrder = max(0, int(self.timeOrder))
            self.backwardsOnly = backwardsOnly 
        else:
            self.timeOrder = 0
            self.backwardsOnly = False 

    def __setKNNInfo(self, numNeighs):
        #### Set KNN ####
        if numNeighs is not None:
            if UTILS.isNumeric(numNeighs):
                self.numNeighs = int(numNeighs)
            else:
                self.numNeighs = None
        else:
            self.numNeighs = None

        #### Account for Self ####
        if self.numNeighs is not None:
            self.k = self.numNeighs + 1
        else:
            self.k = None

    def __setContiguity(self):
        #### Create KD Tree if Hybrid ####
        if self.numNeighs is not None:
            self.kdTree = SCPS.cKDTree(self.coords)

        #### Set Contiguity Type ####
        if self.spaceConcept == 'CONTIGUITY_EDGES_CORNERS':
            contiguityType = "QUEEN"
        else:
            contiguityType = "ROOK"

        #### Initialize Polygon Neighbors ####
        if self.init_type == 0:
            self.polyNeighs = polygonNeighborDictOrder(self.ssObject,
                                     contiguityType = contiguityType)
        elif self.init_type == 1:
            ARCPY.AddIDMessage("ERROR", 110121)
            raise SystemExit()
        else:
            if self.ssObject.isPolygon:

                #### If Scratch is not Provided ###
                if self.scratch is None:
                    self.scratch = ARCPY.env.scratchGDB

                #### Create Temp Polygon FC ####
                tempPolyFC  = UTILS.returnScratchName("TempPoly_", 
                                    scratchWS = self.scratch)
                locationField, locationLabel = self.ssObject.getLocationFields()
                candidateFieldList = [locationField]
                self.ssObject.exportFeatures2D(tempPolyFC, candidateFieldList)
                self.polyNeighs = polygonNeighborDict(tempPolyFC, "LOCATION",
                                                contiguityType = contiguityType)
                UTILS.passiveDelete(tempPolyFC)
            else:
                ARCPY.AddIDMessage("ERROR", 110121)
                raise SystemExit()

        #### Set Search Types ####
        if self.k:
            self.getNeighbors = self.__getHybridPoly
            self.getSpatialNeighbors = self.__getHybridSpatialPoly
        else:
            self.getNeighbors = self.__getPoly
            self.getSpatialNeighbors = self.__getSpatialPoly

    def __setKNN(self):
        if self.iniKdTree:
            self.kdTree = SCPS.cKDTree(self.coords)
        else:
            self.kdTree = None

        if self.numNeighs is None:
            ARCPY.AddIDMessage("ERROR", 895)
            raise SystemExit()

        #### Set Search Types ####
        self.getNeighbors = self.__getKNN
        self.getSpatialNeighbors = self.__getKNNSpatial

    def __setFixedDistance(self):
        if self.iniKdTree:
            self.kdTree = SCPS.cKDTree(self.coords)
        else:
            self.kdTree = None

        if self.threshold is None:
            #### Default Threshold ####
            self.__setThresholdInfo(useDefault = True)

        else:
            if UTILS.isNumeric(self.threshold):
                #### Numeric Only ####
                self.__setThresholdInfo(self.threshold)

            else:
                #### Linear Unit ####
                threshold, threshUnit = self.threshold.split(" ")
                if threshUnit.upper() not in supportDist:
                    ARCPY.AddIDMessage("ERROR", 110017, threshUnit)
                    raise SystemExit()

                self.__setThresholdInfo(threshold, userGeometryUnit = threshUnit)

        #### Set Search Types ####
        if self.k is None:
            self.getNeighbors = self.__getDistance
            self.getSpatialNeighbors = self.__getDistanceSpatial
        else:
            #### Assure Valid KNN ####
            self.getNeighbors = self.__getHybrid
            self.getSpatialNeighbors = self.__getHybridSpatial

    def __checkThreshold(self, threshold):
        #### Ensure Searching Distance Is Less Than 75% of Max Extent ####
        if not UTILS.isNumeric(threshold):
            threshold = LOCALE.atof(threshold)
        maxDist = self.maxExtent * .75
        if threshold > maxDist:
            printMaxDist = UTILS.prettyUnits(maxDist, self.geometryUnit)
            distance, displayUnit = UTILS.linearUnitSplit(printMaxDist)
            displayUnit = UTILS.getLocalizedUnitType(displayUnit)
            ARCPY.AddIDMessage("WARNING", 110018, distance, displayUnit)
            return LOCALE.atof(distance), False
        else:
            return threshold, True

    def __checkUserThreshold(self, threshold, userGeometryUnit):
        """ User Provided Different than Data Linear Units. """

        #### Conversion for Different Units ####
        if not UTILS.isNumeric(threshold):
            threshold = LOCALE.atof(threshold)
        self.userGeometryUnit = userGeometryUnit
        unit, factor = UTILS.distanceUnitInfo[userGeometryUnit.upper()]
        convertThreshold = (threshold * factor) / self.convertFactor

        #### Ensure Searching Distance Is Less Than 75% of Max Extent (Convert to User LU) ####
        maxDist = self.maxExtent * .75
        if convertThreshold > maxDist:
            self.threshold = maxDist
            self.userThreshold = (maxDist / factor) * self.convertFactor
            printMaxDist = UTILS.prettyUnits(self.userThreshold, self.userGeometryUnit)
            distance, displayUnit = UTILS.linearUnitSplit(printMaxDist)
            displayUnit = UTILS.getLocalizedUnitType(displayUnit)
            ARCPY.AddIDMessage("WARNING", 110018, distance, displayUnit)
        else:
            self.userThreshold = threshold
            self.threshold = convertThreshold

    def __setThresholdInfo(self, threshold = None, userGeometryUnit = None,
                           useDefault = False):

        #### Assess Whether Threshold Distance Unit Same as Coords ####
        sameUnits = userGeometryUnit == self.geometryUnit

        #### Create Default Threshold ####
        if useDefault:
            threshold = STATS.spatialBandwidth(self.coords)
            sameUnits = True

        #### Set Threshold Info ####
        if userGeometryUnit is None or sameUnits:

            #### Same Units, Default or Float Passed ####
            threshold, passed = self.__checkThreshold(threshold)
            self.threshold = threshold
            self.userThreshold = threshold
            self.userGeometryUnit = self.geometryUnit

        else:
            #### Different User/Data Linear Units ####
            self.__checkUserThreshold(threshold, userGeometryUnit)

        if useDefault:
            self.printThreshold = UTILS.prettyUnits(self.userThreshold,
                                                    self.userGeometryUnit)

            distance, displayUnit = UTILS.linearUnitSplit(self.printThreshold)
            if self.enableWarning:
                displayUnit = UTILS.getLocalizedUnitType(displayUnit)
                ARCPY.AddIDMessage("WARNING", 110020, distance, displayUnit)

    def __assessDistance(self, threshold = None, useDefault = False):
        if useDefault:
            #### Default Threshold ####
            self.__setThresholdInfo(useDefault = useDefault)

        else:
            if UTILS.isNumeric(threshold):
                #### Numeric Only ####
                self.__setThresholdInfo(threshold)

            else:
                #### Linear Unit ####
                threshold, threshUnit = threshold.split(" ")
                if threshUnit.upper() not in supportDist:
                    ARCPY.AddIDMessage("ERROR", 110017, threshUnit)
                    raise SystemExit()

                self.__setThresholdInfo(threshold, userGeometryUnit = threshUnit)

    def returnSearchInfo(self):

        rows = []
        if self.threshold is None:

            #### KNN Only ####
            cat = ARCPY.GetIDMessage(84721)
            value = str(self.numNeighs)
            rows.append([cat, value])
        else:

            #### Distance First ####
            cat = ARCPY.GetIDMessage(84549)
            value = UTILS.prettyUnits(self.userThreshold, self.userGeometryUnit, localizeUnit = True)
            rows.append([cat, value])

            if self.numNeighs is not None:
                #### Hybrid ####
                cat = ARCPY.GetIDMessage(84722)
                value = str(self.numNeighs)
                rows.append([cat, value])
            
        #### Neighborhood Time Step Intervals ####
        if self.numTime:
            strTimeOrder = str(self.timeOrder)
            rows.append( [ ARCPY.GetIDMessage(84550), strTimeOrder] )

        return rows

    def __getDistance(self, orderID, timeID = None, includeSelf = False):
        coordinates = self.coords[orderID]
        neighs = self.kdTree.query_ball_point(coordinates, 
                                              r = self.threshold, 
                                              p = self.p) 

        neighs = NUM.asarray(neighs, dtype = NUM.int32)

        #### Apply Time ####
        if timeID is not None:
            neighs = self.__addTimeNeighbors(orderID, timeID, neighs)
        else:
            timeID = 0

        #### Remove Self ####
        if not includeSelf:
            selfIndex = (timeID * self.numLocations) + orderID
            neighs = neighs[neighs != selfIndex]

        return neighs

    def __getKNN(self, orderID, timeID = None, includeSelf = False):
        coordinates = self.coords[orderID]
        info = self.kdTree.query(coordinates, k = self.k, 
                                 p = self.p)
        neighs = info[1]

        #### Apply Time ####
        if timeID is not None:
            neighs = self.__addTimeNeighbors(orderID, timeID, neighs)
        else:
            timeID = 0

        #### Remove Self ####
        if not includeSelf:
            selfIndex = (timeID * self.numLocations) + orderID
            neighs = neighs[neighs != selfIndex]

        return neighs

    def __getHybrid(self, orderID, timeID = None, includeSelf = False):
        #### Start With Distance ####
        coordinates = self.coords[orderID]
        neighs = self.kdTree.query_ball_point(coordinates, 
                                              r = self.threshold, 
                                              p = self.p) 

        #### Hybrid KNN Check ####
        if includeSelf:
            doKNN = len(neighs) < self.k
        else:
            doKNN = len(neighs) < self.numNeighs

        if len(neighs) < self.numNeighs:
            #### Use KNN If Minimum Not Met ####
            info = self.kdTree.query(coordinates, k = self.k, 
                                     p = self.p)
            neighs = info[1]
        else:
            neighs = NUM.asarray(neighs, dtype = NUM.int32)

        #### Apply Time ####
        if timeID is not None:
            neighs = self.__addTimeNeighbors(orderID, timeID, neighs)
        else:
            timeID = 0

        #### Remove Self ####
        if not includeSelf:
            selfIndex = (timeID * self.numLocations) + orderID
            neighs = neighs[neighs != selfIndex]

        return neighs

    def __addTimeNeighbors(self, orderID, timeID, spatialNeighs):
        numNeighs = len(spatialNeighs)

        if not self.backwardsOnly:
            maxTime = min(timeID + self.timeOrder, self.numTime)
        else:
            maxTime = timeID

        minTime = max(0, timeID - self.timeOrder)
        
        tSum = NUM.arange(minTime, maxTime + 1) * self.numLocations
        return NUM.add.outer(tSum, spatialNeighs).ravel()

    def __getDistanceSpatial(self, orderID, includeSelf = False):
        coordinates = self.coords[orderID]

        neighs = self.kdTree.query_ball_point(coordinates, 
                                              r = self.threshold, 
                                              p = self.p) 
        if neighs is None:
            return NUM.array([], dtype= NUM.int32)
            
        neighs = NUM.asarray(neighs, dtype = NUM.int32)

        #### Remove Self ####
        if not includeSelf:
            neighs = neighs[neighs != orderID]

        return neighs

    def __getKNNSpatial(self, orderID, includeSelf = False):
        coordinates = self.coords[orderID]
        info = self.kdTree.query(coordinates, k = self.k, 
                                 p = self.p)
        neighs = info[1]
        neighs = neighs[neighs != self.numLocations]

        #### Remove Self ####
        if not includeSelf:
            neighs = neighs[neighs != orderID]

        return NUM.asarray(neighs, dtype = NUM.int32)

    def __getHybridSpatial(self, orderID, includeSelf = False):
        #### Start With Distance ####
        coordinates = self.coords[orderID]
        neighs = self.kdTree.query_ball_point(coordinates, 
                                              r = self.threshold, 
                                              p = self.p)
        if neighs is None:
            neighs = NUM.array([], dtype = NUM.int32)

        #### Hybrid KNN Check ####
        if includeSelf:
            doKNN = len(neighs) < self.k
        else:
            doKNN = len(neighs) < self.numNeighs

        if doKNN:
            #### Use KNN If Minimum Not Met ####
            info = self.kdTree.query(coordinates, k = self.k, 
                                     p = self.p)
            neighs = info[1]
        else:
            neighs = NUM.asarray(neighs, dtype = NUM.int32)

        #### Remove Self ####
        if not includeSelf:
            neighs = neighs[neighs != orderID]

        return NUM.asarray(neighs, dtype = NUM.int32)

    def __getSpatialPoly(self, orderID, includeSelf = False):
        neighs = self.polyNeighs[orderID]
        if includeSelf:
            neighs = list(neighs)
            neighs.append(orderID)
            return NUM.asarray(neighs, dtype = NUM.int32)
        else:
            return NUM.asarray(neighs)

    def __getPoly(self, orderID, timeID = None, includeSelf = False):
        neighs = self.polyNeighs[orderID]
        neighs = list(neighs)
        neighs.append(orderID)
        neighs = NUM.asarray(neighs, dtype = NUM.int32)

        #### Apply Time ####
        if timeID is not None:
            neighs = self.__addTimeNeighbors(orderID, timeID, neighs)
        else:
            timeID = 0

        #### Remove Self ####
        if not includeSelf:
            selfIndex = (timeID * self.numLocations) + orderID
            neighs = neighs[neighs != selfIndex]

        return neighs


    def __getHybridSpatialPoly(self, orderID, includeSelf = False):
        if includeSelf:
            return self.__getHybridSpatialPolySelf(orderID)
        else:
            #### Start With Poly ####
            neighs = self.polyNeighs[orderID]
            numPolyNeighs = len(neighs)

            if numPolyNeighs < self.numNeighs:
                #### Use KNN If Minimum Not Met ####
                coordinates = self.coords[orderID]
                info = self.kdTree.query(coordinates, k = self.k, 
                                         p = self.p)
                knnNeighs = info[1]
                knnNeighs = knnNeighs[knnNeighs != orderID]

                #### Add KNN ####
                neighs = list(neighs)
                for knnNeigh in knnNeighs:
                    if knnNeigh not in neighs:
                        neighs.append(knnNeigh)

                #### Trim Furthest Away ####
                neighs = neighs[:self.numNeighs]
                
                return NUM.asarray(neighs, dtype = NUM.int32)
            else:
                return NUM.asarray(neighs, dtype = NUM.int32)

    def __getHybridSpatialPolySelf(self, orderID):

        #### Start With Poly ####
        neighs = list(self.polyNeighs[orderID])
        numPolyNeighs = len(neighs)

        if numPolyNeighs < self.numNeighs:
            #### Use KNN If Minimum Not Met ####
            coordinates = self.coords[orderID]
            info = self.kdTree.query(coordinates, k = self.k, 
                                     p = self.p)
            knnNeighs = info[1]
            knnNeighs = knnNeighs[knnNeighs != orderID]
            
            #### Add KNN ####
            for knnNeigh in knnNeighs:
                if knnNeigh not in neighs:
                    neighs.append(knnNeigh)

            #### Trim Furthest Away ####
            neighs = neighs[:self.numNeighs]

        #### Add Self ####
        neighs.append(orderID)

        return NUM.asarray(neighs, dtype = NUM.int32)

    def __getHybridPoly(self, orderID, timeID = None, includeSelf = False):
        #### Start With Spatial Neighs (Include Self) ####
        neighs = self.__getHybridSpatialPolySelf(orderID)

        #### Apply Time ####
        if timeID is not None:
            neighs = self.__addTimeNeighbors(orderID, timeID, neighs)
        else:
            timeID = 0

        #### Remove Self ####
        if not includeSelf:
            selfIndex = (timeID * self.numLocations) + orderID
            neighs = neighs[neighs != selfIndex]

        return neighs
    
    def getCoreDistance(self, orderID, minNumPoints):
        coordinates = self.coords[orderID]
        dist, ind = self.kdTree.query(coordinates, k = [minNumPoints], 
                                      p = self.p)
        return dist

    def addTimeNeighbors(self, orderID, timeID, spatialNeighs, 
                         includeSelf = False):
        numNeighs = len(spatialNeighs)

        if not self.backwardsOnly:
            maxTime = min(timeID + self.timeOrder, self.numTime)
        else:
            maxTime = timeID

        minTime = max(0, timeID - self.timeOrder)
        
        tSum = NUM.arange(minTime, maxTime + 1) * self.numLocations
        neighs = NUM.add.outer(tSum, spatialNeighs).ravel()

        #### Remove Self ####
        if not includeSelf:
            selfIndex = (timeID * self.numLocations) + orderID
            neighs = neighs[neighs != selfIndex]

        return neighs

    def clipSelf(self, index, neighs):

        return neighs[neighs != index]

class NeighborInfo(object):

    def __init__(self, masterField, silent = False):
        self.masterField = masterField
        self.silent = silent
        self.warnNeighsExceeded = False
        self.maxNeighsExceeded = False
        self.idsWarn = []
        self.idsMax = []
        self.idsNoNeighs = []
        self.numObs = 0

    def processInfo(self, masterID, nhIDs, nhVals, weights):
        self.numObs += 1
        nn = len(nhIDs)
        if nn:
            #### Warn Number of Neighs ####
            if nn > warnNumberOfNeighbors:
                self.idsWarn.append(masterID)
                if not self.warnNeighsExceeded:
                    self.warnNeighsExceeded = True
                    if not self.silent:
                        ARCPY.AddIDMessage("WARNING", 1420, 
                                     warnNumberOfNeighbors)

            #### Truncate to Max Number of Neighs ####
            if maxNumberOfNeighbors and nn > maxNumberOfNeighbors: 
                self.idsMax.append(masterID)
                if not self.maxNeighsExceeded:
                    self.maxNeighsExceeded = True
                    if not self.silent:
                        ARCPY.AddIDMessage("WARNING", 1421, 
                                      maxNumberOfNeighbors)

                nhIDs = nhIDs[0:maxNumberOfNeighbors]
                nhVals = nhVals[0:maxNumberOfNeighbors]
                weights = weights[0:maxNumberOfNeighbors]
                nn = maxNumberOfNeighbors
        else:
            #### No Neighbors ####
            self.idsNoNeighs.append(masterID)

        return nn, nhIDs, nhVals, weights

    def reportWarnings(self, numFeatures = 30):
        if len(self.idsWarn):
            self.idsWarn.sort()
            idsOut = [ str(i) for i in self.idsWarn[0:numFeatures] ]
            idsOut = ", ".join(idsOut)
            if not self.silent:
                ARCPY.AddIDMessage("WARNING", 1422, self.masterField, idsOut)

    def reportMaximums(self, numFeatures = 30):
        if len(self.idsMax):
            self.idsMax.sort()
            idsOut = [ str(i) for i in self.idsMax[0:numFeatures] ]
            idsOut = ", ".join(idsOut)
            if not self.silent:
                ARCPY.AddIDMessage("WARNING", 1423, self.masterField, idsOut)

    def reportNoNeighbors(self, failAllNoNeighs = True, throwError = True, throwWarning = True):
        """Report if Any Features Have No Neighbors."""

        #### All Features Have No Neighbors ####
        deleteAfter = False
        if len(self.idsNoNeighs) == self.numObs:
            if failAllNoNeighs:
                deleteAfter = True
                if throwError:
                    ARCPY.AddIDMessage("Error", 908)
                    raise SystemExit()
            else:
                #### Technically Allowed for Hot-Spot Analysis ####
                ARCPY.AddIDMessage("Warning", 908)

        if throwWarning:
            #### Report First With No Neighbors ####
            countNoNeighs = len(self.idsNoNeighs)
            if countNoNeighs:
                self.idsNoNeighs.sort()
                noNeighs = self.idsNoNeighs[0:30]
                ERROR.warningNoNeighbors(self.numObs, countNoNeighs, 
                                     noNeighs, self.masterField)
        return deleteAfter

class SWMWriter(object):

    def __init__(self, swmFile, masterField, spatialRefName, numObs, 
                 rowStandard, inputFC = "#", wType = -1, 
                 distanceMethod = "#", exponent = "#", 
                 threshold = "#", numNeighs = "#",
                 inputTable = "#", timeField = "#", 
                 timeType = "#", timeValue = "#",
                 inputNet = "#", impedanceField = "#",
                 barrierFC = "#", uturnPolicy = "#",
                 restrictions = "#", useHierarchy = "#",
                 searchTolerance = "#", addConcept = "#",
                 forceFixed = False, hasZ = False,
                 hasID64 = False):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())
        if self.hasID64:
            self.intDType = "<i8"
        else:
            self.intDType = "<i4"
        self.deleteAfter = False
        self.setHeader()

        #### Set SWM Writing Class ####
        if self.fixedWeights:
            self.swm = FixedSWMWriter(self.fo, masterField, rowStandard = rowStandard,
                                      hasID64 = hasID64)
        else:
            self.swm = VariableSWMWriter(self.fo, masterField, rowStandard = rowStandard,
                                         hasID64 = hasID64)

    def setHeader(self):

        #### Create File Writing Object ####
        self.fo = UTILS.openFile(self.swmFile, "wb")

        #### Assign Fixed/Variable Weighting Type ####
        if self.wType in [1, 2, 3, 4, 5, 9]:
            self.fixedWeights = True
        else:
            if self.forceFixed:
                self.fixedWeights = True
            else:
                self.fixedWeights = False

        #### Key Word Arguements ####
        if self.exponent != "#":
            if not (self.exponent % 1):
                self.exponent = "%i" % self.exponent
            else:
                self.exponent = UTILS.formatValue(self.exponent, "%0.4f")
        if self.threshold != "#":
            self.threshold = UTILS.formatValue(self.threshold)
        if self.numNeighs != "#":
            self.numNeighs = "%i" % self.numNeighs
        if self.timeValue != "#":
            self.timeValue = "%i" % self.timeValue
        if self.useHierarchy != "#":
            self.useHierarchy = str(self.useHierarchy)

        #### Create Header ####
        header = ["VERSION@" + "10.1", 
                  "UNIQUEID@" + self.masterField.upper(), 
                  "SPATIALREFNAME@" + self.spatialRefName,
                  "INPUTFC@" + self.inputFC, "WTYPE@" + "%i" % self.wType,
                  "DISTANCEMETHOD@" + self.distanceMethod, 
                  "EXPONENT@" + self.exponent, "THRESHOLD@" + self.threshold,
                  "NUMNEIGHS@" + self.numNeighs, "INPUTTABLE@" + self.inputTable, 
                  "TIMEFIELD@" + self.timeField.upper(), "TIMETYPE@" + self.timeType,
                  "TIMEVALUE@" + self.timeValue, "INPUTNET@" + self.inputNet, 
                  "IMPEDANCEFIELD@" + self.impedanceField.upper(), 
                  "BARRIERFC@" + self.barrierFC, "UTURNPOLICY@" + self.uturnPolicy,
                  "RESTRICTIONS@" + self.restrictions, 
                  "USEHIERARCHY@" + self.useHierarchy,
                  "SEARCHTOLERANCE@" + self.searchTolerance,
                  "ADDCONCEPT@" + self.addConcept,
                  "FIXEDWEIGHTS@" + str(self.fixedWeights),
                  "HASZ@" + str(self.hasZ),
                  "HASID64@" + str(self.hasID64)]

        header = ";".join(header) + "\n"
        UTILS.writeTextBin(self.fo, header)
        weightsInfo = NUM.empty((2,), self.intDType)
        weightsInfo[0] = self.numObs
        weightsInfo[1] = self.rowStandard
        weightsInfo.tofile(self.fo)
        self.header = header

    def close(self):
        """Closes SWM Output File Pointer."""
        self.fo.close()

        if self.deleteAfter:
            #### Delete SWM and Throw No Neighbors Error ####
            UTILS.passiveDelete(self.swmFile)
            ARCPY.AddIDMessage("Error", 908)
            raise SystemExit()

    def report(self, show = True, additionalInfo = []):
        """Report Spatial Weights Matrix Characteristics."""

        #### Get Info ####
        numObs = self.numObs
        numNonZero = self.swm.numNonZero
        minNumNeighs = self.swm.minNumNeighs
        maxNumNeighs = self.swm.maxNumNeighs

        #### Create Extra Result Values ####
        percNonZero = (numNonZero / ((numObs * 1.0)**2)) * 100  
        avgNumNeighs = numNonZero / (numObs * 1.0)

        #### Create Output Table ####
        header =  ARCPY.GetIDMessage(84137)
        row1 = [  ARCPY.GetIDMessage(84138), numObs ]
        row2 = [  ARCPY.GetIDMessage(84139), LOCALE.format_string("%0.2f", percNonZero) ]
        row3 = [  ARCPY.GetIDMessage(84140), LOCALE.format_string("%0.2f", avgNumNeighs) ]
        row4 = [  ARCPY.GetIDMessage(84141), minNumNeighs ]
        row5 = [  ARCPY.GetIDMessage(84142), maxNumNeighs ]
        total = [row1,row2,row3,row4,row5]
        self.info = [UTILS.outputTextTable(total, header = header, pad = 1, emphasizeHeadRow=False, colPad=4,
                                           returnHTMLMsg=True, force2Txt=False)]

        #### Additional Footnotes ####
        if len(additionalInfo):
            for ai in additionalInfo:
                self.info.append(UTILS.outputParagraph(ai, returnHTMLMsg=True))

        if show:
            for line in self.info:
                ARCPY.AddMessage(line)

    def reportNoNeighbors(self, failAllNoNeighs = True):
        """Report if Any Features Have No Neighbors."""

        self.deleteAfter = self.swm.ni.reportNoNeighbors(failAllNoNeighs = failAllNoNeighs,
                                                         throwError = False)

    def reportLargeSWM(self):
        """Returns a warning id the number of non-zero links > 20 million."""

        if self.swm.numNonZero >= 20000000:
            ARCPY.AddIDMessage("WARNING", 1014)

    def reportNeighInfo(self, failAllNoNeighs = True):
        """Reports results from Neighbor Info Class."""
    
        self.deleteAfter = self.swm.ni.reportNoNeighbors(failAllNoNeighs = failAllNoNeighs,
                                                         throwError = False)
        self.swm.ni.reportWarnings()
        self.swm.ni.reportMaximums()

class VariableSWMWriter(object):
    """File Reading Class for Spatial Weights Matrices with variable weight
    values; e.g. Inverse Distance.  This is also how all SWM files were
    stored/read prior to the 10.1 release.
    """

    def __init__(self, fo, masterField, rowStandard = True, hasID64 = False):
        self.fo = fo
        self.rowStandard = rowStandard
        self.numNonZero = 0 
        self.minNumNeighs = 99999999
        self.maxNumNeighs = 0

        self.hasID64 = hasID64
        if self.hasID64:
            self.intDType = "<i8"
        else:
            self.intDType = "<i4"
        self.floatDType = "<f8"

        #### Set Neighbor Info Class ####
        self.ni = NeighborInfo(masterField)

    def writeEntry(self, masterID, neighs, weights):
        #### Warn/Truncate to Warn/Max Number of Neighs ####
        nn, neighs, nhVals, weights = self.ni.processInfo(masterID, neighs, 
                                                          [], weights)

        #### Write Master ID and Number Of Neighbors ####
        rowInfo = NUM.empty((2,), self.intDType)
        rowInfo[0] = masterID
        rowInfo[1] = nn
        rowInfo.tofile(self.fo)
        if nn != 0:
            #### Write Neighbor IDs ####
            neighs = NUM.array(neighs, self.intDType)
            neighs.tofile(self.fo)

            #### Write Spatial Weights ####
            weights = NUM.array(weights, self.floatDType)
            sumUnstandard = weights.sum() * 1.0
            if self.rowStandard:
                weights = weights / sumUnstandard
            weights.tofile(self.fo)
            
            #### Write Sum of Unstandardized Weights ####
            sumUnstandard = NUM.array(sumUnstandard, self.floatDType)
            sumUnstandard.tofile(self.fo)

        #### Update Weight Chars ####
        self.numNonZero += nn
        if nn < self.minNumNeighs:
            self.minNumNeighs = nn
        if nn > self.maxNumNeighs:
            self.maxNumNeighs = nn

        return nn

class FixedSWMWriter(object):
    """File Reading Class for Spatial Weights Matrices with variable weight
    values; e.g. Inverse Distance.  This is also how all SWM files were
    stored/read prior to the 10.1 release.
    """

    def __init__(self, fo, masterField, rowStandard = True, hasID64 = False):
        self.fo = fo
        self.rowStandard = rowStandard
        self.numNonZero = 0 
        self.minNumNeighs = 99999999
        self.maxNumNeighs = 0

        self.hasID64 = hasID64
        if self.hasID64:
            self.intDType = "<i8"
        else:
            self.intDType = "<i4"
        self.floatDType = "<f8"

        #### Set Neighbor Info Class ####
        self.ni = NeighborInfo(masterField)

    def writeEntry(self, masterID, neighs, weights):
        #### Warn/Truncate to Warn/Max Number of Neighs ####
        nn, neighs, nhVals, weights = self.ni.processInfo(masterID, neighs, 
                                                          [], weights)

        #### Write Master ID and Number Of Neighbors ####
        rowInfo = NUM.empty((2,), self.intDType)
        rowInfo[0] = masterID
        rowInfo[1] = nn
        rowInfo.tofile(self.fo)
        if nn != 0:
            #### Write Neighbor IDs ####
            neighs = NUM.array(neighs, self.intDType)
            neighs.tofile(self.fo)

            #### Write Spatial Weights ####
            weights = NUM.array(weights, self.floatDType)
            sumUnstandard = weights.sum() * 1.0
            if self.rowStandard:
                weights = weights / sumUnstandard

            #### Fixed Weights - Only Write Single Value ####
            weights = weights[0]
            weights.tofile(self.fo)
            
            #### Write Sum of Unstandardized Weights ####
            sumUnstandard = NUM.array(sumUnstandard, self.floatDType)
            sumUnstandard.tofile(self.fo)

        #### Update Weight Chars ####
        self.numNonZero += nn
        if nn < self.minNumNeighs:
            self.minNumNeighs = nn
        if nn > self.maxNumNeighs:
            self.maxNumNeighs = nn

        return nn

class SWMReader(object):
    """Calculates Global Morans I, Incremental Distance Version:

    INPUTS:
    inputFC (str): path to the input feature class
    varName (str): name of analysis field
    nIncrements {int, 10}: number of distance bands
    begDist {float, None}: starting distance for analysis
    dIncrement {float, None}: increase in distance per increment
    concept: {str, EUCLIDEAN}: EUCLIDEAN or MANHATTAN 
    rowStandard {bool, True}: row standardize weights?

    ATTRIBUTES:
    numObs (int): number of features in analysis
    y (array, numObs x 1): vector of field values

    METHODS:
    report: reports results as a printed message or to a file
    createOutput: creates an output table for Moran's I results
    """

    def __init__(self, swmFile, silentWarnings=False):
        self.swmFile = swmFile
        self.fo = UTILS.openFile(swmFile, "rb")
        self.invalid = False
        try:
            headerLine = self.fo.readline().decode('utf8')
            self.header = headerLine.strip().split(";")
            if self.header[0][0:8] == "VERSION@":
                #### New Header Format ####
                self.readNewFormat()
            else:
                #### < 10.1 Format ####
                self.readOldFormat()

            #### Set Read Entry Class ####
            if self.fixedWeights:
                self.swm = FixedSWMReader(self.fo, hasID64 = self.hasID64)
            else:
                self.swm = VariableSWMReader(self.fo, hasID64 = self.hasID64)
        except:
            self.invalid = True
            self.fo.close()
            if not silentWarnings:
                ARCPY.AddIDMessage("ERROR", 110288)
                raise SystemExit()

    def close(self):
        self.fo.close()

    def scanRest(self):
        self.numObs, self.rowStandard = NUM.fromfile(self.fo, self.intDType, count = 2)
        self.numObs = int(self.numObs)
        self.rowStandard = self.rowStandard == 1
        self.rowBoolStr = str(self.rowStandard == True)

    def readOldFormat(self):
        self.masterField, self.spatialRefName = self.header
        self.version = "< 10.1"
        self.inputFC = "#"
        self.wType = -1
        self.distanceMethod = "#"
        self.exponent = "#"
        self.threshold = "#"
        self.numNeighs = "#"
        self.inputTable = "#"
        self.timeField = "#"
        self.timeType = "#"
        self.timeValue = "#"
        self.inputNet = "#"
        self.impedanceField = "#"
        self.barrierFC = "#"
        self.uturnPolicy = "#"
        self.restrictions = "#"
        self.useHierarchy = "#"
        self.searchTolerance = "#"
        self.addConcept = "#"
        self.fixedWeights = False
        self.hasZ = False
        self.hasID64 = False
        self.intDType = "<i4"
        self.scanRest()

    def readNewFormat(self):
        headerDict = {}
        for headerInfo in self.header: 
            headerKey, headerVal = headerInfo.split("@")
            headerDict[headerKey] = headerVal

        self.version = headerDict["VERSION"]
        self.masterField = headerDict["UNIQUEID"]
        self.spatialRefName = headerDict["SPATIALREFNAME"]
        self.inputFC = headerDict["INPUTFC"]
        self.wType = int(headerDict["WTYPE"])
        self.distanceMethod = headerDict["DISTANCEMETHOD"]
        self.exponent = headerDict["EXPONENT"]
        self.threshold = headerDict["THRESHOLD"]
        self.numNeighs = headerDict["NUMNEIGHS"]
        self.inputTable = headerDict["INPUTTABLE"]
        self.timeField = headerDict["TIMEFIELD"]
        self.timeType = headerDict["TIMETYPE"]
        self.timeValue = headerDict["TIMEVALUE"]
        self.inputNet = headerDict["INPUTNET"]
        self.impedanceField = headerDict["IMPEDANCEFIELD"]
        self.barrierFC = headerDict["BARRIERFC"]
        self.uturnPolicy = headerDict["UTURNPOLICY"]
        self.restrictions = headerDict["RESTRICTIONS"]
        self.useHierarchy = headerDict["USEHIERARCHY"]
        self.searchTolerance = headerDict["SEARCHTOLERANCE"]
        self.addConcept = headerDict["ADDCONCEPT"]
        if "FIXEDWEIGHTS" in headerDict:
            self.fixedWeights = headerDict["FIXEDWEIGHTS"].upper() == 'TRUE' 
        else:
            self.fixedWeights = False

        if "HASZ" in headerDict:
            self.hasZ = headerDict["HASZ"].upper() == 'TRUE'
        else:
            self.hasZ = False

        if "HASID64" in headerDict:
            self.hasID64 = headerDict["HASID64"].upper() == 'TRUE'
        else:
            self.hasID64 = False

        if self.hasID64:
            self.intDType = "<i8"
        else:
            self.intDType = "<i4"

        self.scanRest()

    def description(self, show = True):
        header = ARCPY.GetIDMessage(84378)
        strConcept = wTypeDispatch[self.wType]

        #### Values Across All SWM Files ####
        labels = [84382, 84233, 84359, 84381,
                  84379, 84057, 84236,
                  84234, 84406]

        values = [self.version, self.inputFC, self.masterField, self.swmFile,
                  self.spatialRefName, self.numObs, self.rowStandard,
                  strConcept, str(self.fixedWeights)]

        if self.wType == 0:
            #### Inverse Distance ####
            labels += [84235, 84383, 84237]
            values += [self.distanceMethod, self.exponent, self.threshold]
        elif self.wType == 1:
            #### Fixed Distance ####
            labels += [84235, 84237]
            values += [self.distanceMethod, self.threshold]
        elif self.wType in [2, 4, 5]:
            #### KNN or Polygon Contiguity ####
            labels += [84235, 84362]
            values += [self.distanceMethod, self.numNeighs]
        elif self.wType in [6, 8]:
            #### Convert from Table ####
            labels += [84384]
            values += [self.inputTable]
        elif self.wType == 9:
            #### Space-Time ####
            labels += [84235, 84237, 84385, 84386, 84387]
            values += [self.distanceMethod, self.threshold, self.timeField,
                       self.timeType, self.timeValue]
        elif self.wType == 10:
            labels += [84388, 84389, 84390, 84391, 84392, 84393,
                       84394, 84395, 84396, 84397, 84383]
            values += [self.inputNet, self.impedanceField, self.threshold,
                       self.numNeighs, self.barrierFC, self.uturnPolicy,
                       self.restrictions, self.useHierarchy, 
                       self.searchTolerance, self.addConcept,
                       self.exponent]
        else:
            #### Delaunay and Unknown ####
            pass

        #### Finalize Table ####
        total = []
        for ind, lab in enumerate(labels):
            labPlus = UTILS.addColon(ARCPY.GetIDMessage(lab))
            val = values[ind]
            total.append([labPlus, val])
        descTable = UTILS.outputTextTable(total, header = header, pad = 1)

        #### Print Results ####
        if show:
            ARCPY.AddMessage(descTable)

        return descTable

    def reportNoNeighbors(self):
        """Report if Any Features Have No Neighbors."""

        reportNoNeighborsGeneral(self.numObs, self.swm.noNeighs,
                                 self.masterField)

    def getHasNeighborArray(self, master2Order):
        return self.swm.getHasNeighborArray(self.numObs, master2Order)

class VariableSWMReader(object):
    """File Reading Class for Spatial Weights Matrices with variable weight
    values; e.g. Inverse Distance.  This is also how all SWM files were
    stored/read prior to the 10.1 release.
    """

    def __init__(self, fo, hasID64 = False):
        self.fo = fo
        self.hasID64 = hasID64
        if self.hasID64:
            self.skipIntValue = 8
            self.intDType = "<i8"
        else:
            self.skipIntValue = 4
            self.intDType = "<i4"
        self.floatDType = "<f8"
        self.noNeighs = []

    def readEntry(self):
        try:
            masterID, nn = NUM.fromfile(self.fo, self.intDType, count = 2)
            if nn != 0:
                nhs = NUM.fromfile(self.fo, self.intDType, count = nn)
                weights = NUM.fromfile(self.fo, self.floatDType, count = nn)
                sumUnstandard = NUM.fromfile(self.fo, self.floatDType, count = 1)
            else:
                nhs = None
                weights = None
                sumUnstandard = None
                self.noNeighs.append(masterID)
        except:
            #### Invalid Format, Close File Pointer and Throw Error ####
            self.fo.close()

            ARCPY.AddIDMessage("Error", 919)
            raise SystemExit()

        return int(masterID), int(nn), nhs, weights, sumUnstandard

    def getHasNeighborArray(self, numObs, master2Order):
        startPosition = self.fo.tell()
        n = len(master2Order)
        hasNeighs = NUM.zeros(n, dtype = bool)
        for i in UTILS.ssRange(numObs):
            try:
                masterID, nn = NUM.fromfile(self.fo, self.intDType, count = 2)
                if nn != 0:
                    if int(masterID) in master2Order:
                        nhs = NUM.fromfile(self.fo, self.intDType, count = nn)
                        for nh in nhs:
                            if int(nh) in master2Order:
                                hasNeighs[master2Order[masterID]] = True
                                break
                    else:
                        skipData = self.skipIntValue * nn
                        self.fo.seek(skipData, 1)

                    #### Skip the Weight and Sum Unstandard ####
                    skipData = (8 * (nn + 1))
                    self.fo.seek(skipData, 1)
            except:
                #### Invalid Format, Close File Pointer and Throw Error ####
                self.fo.close()

                ARCPY.AddIDMessage("Error", 919)
                raise SystemExit()

        self.fo.seek(startPosition)
        return hasNeighs

class FixedSWMReader(object):
    """File Reading Class for Spatial Weights Matrices with variable weight
    values; e.g. Inverse Distance.  This is also how all SWM files were
    stored/read prior to the 10.1 release.
    """

    def __init__(self, fo, hasID64 = False):
        self.fo = fo
        self.hasID64 = hasID64
        if self.hasID64:
            self.skipIntValue = 8
            self.intDType = "<i8"
        else:
            self.skipIntValue = 4
            self.intDType = "<i4"
        self.floatDType = "<f8"
        self.noNeighs = []

    def readEntry(self):
        try:
            masterID, nn = NUM.fromfile(self.fo, self.intDType, count = 2)
            if nn != 0:
                nhs = NUM.fromfile(self.fo, self.intDType, count = nn)
                weight = NUM.fromfile(self.fo, self.floatDType, count = 1)
                weights = NUM.ones(nn) * weight
                sumUnstandard = NUM.fromfile(self.fo, self.floatDType, count = 1)
            else:
                nhs = None
                weights = None
                sumUnstandard = None
                self.noNeighs.append(masterID)
        except:
            #### Invalid Format, Close File Pointer and Throw Error ####
            self.fo.close()

            ARCPY.AddIDMessage("Error", 919)
            raise SystemExit()

        return int(masterID), int(nn), nhs, weights, sumUnstandard

    def getHasNeighborArray(self, numObs, master2Order):
        startPosition = self.fo.tell()
        n = len(master2Order)
        hasNeighs = NUM.zeros(n, dtype = bool)
        for i in UTILS.ssRange(numObs):
            try:
                masterID, nn = NUM.fromfile(self.fo, self.intDType, count = 2)
                if nn != 0:
                    if int(masterID) in master2Order:
                        nhs = NUM.fromfile(self.fo, self.intDType, count = nn)
                        for nh in nhs:
                            if int(nh) in master2Order:
                                hasNeighs[master2Order[masterID]] = True
                                break
                    else:
                        skipData = self.skipIntValue * nn
                        self.fo.seek(skipData, 1)

                    #### Skip the Weight and Sum Unstandard ####
                    self.fo.seek(16, 1)
            except:
                #### Invalid Format, Close File Pointer and Throw Error ####
                self.fo.close()

                ARCPY.AddIDMessage("Error", 919)
                raise SystemExit()

        self.fo.seek(startPosition)
        return hasNeighs

############### General Functions ###############

def gaTable(inputFC, fieldNames = None, spatRef = None, warnings = 30):
    """Creates a GA Data Structure for Neighborhood Searching.

    inputFC (str): path to the input feature class
    fieldNames (list): names of fields to include in table
    spatRef {str, None}: spatial reference string
    warnings {int, 30}: number of errors to return
    """
    
    #### Change Layer Files to Feature Layer ####
    tempName, extension = OS.path.splitext(inputFC)
    if extension.upper() == ".LYR":
        tempFeatures = True
        inFeatures = UTILS.returnScratchName("TempFeaturesForGAPY")
        DM.MakeFeatureLayer(inputFC, inFeatures)
    else:
        tempFeatures = False
        inFeatures = inputFC

    #### Create Structure and Parameter Info ####
    gaTable = GAPY.ga_table()
    gaTable.max_warnings = warnings
    if fieldNames:
        fieldNames = tuple(fieldNames)
    else:
        fieldNames = ()

    #### Try and Load the Feature Class ####
    loadInfo = None
    strError = None
    try:
        loadInfo = gaTable.load(inFeatures, fieldNames, spatRef)

    except (TypeError, RuntimeError) as strErrorE:
            strError = strErrorE

    finally:
        #### Report Failure Message ####
        if strError:
            msg = str(strError)
            if msg == "cannot find input field":
                #### Field(s) Invalid ####
                ARCPY.AddIDMessage("ERROR", 369)
                raise SystemExit()
            elif msg == "open FeatureClass/FeatureLayer" or msg  == "open as FeatureClass or FeatureLayer":
                #### FC Invalid ####
                ARCPY.AddIDMessage("ERROR", 732, "Input Features", inputFC)
                raise SystemExit()
            else:
                #### Catchall/Unknown Error ####
                ARCPY.AddIDMessage("ERROR", 581)
                raise SystemExit()

    #### Delete Temporary Feature Layer ####
    if tempFeatures:
        UTILS.passiveDelete(inFeatures)

    return gaTable, loadInfo

def checkProfessionalLicense(spaceConcept):
    """Checks for Professional ArcGIS License for polygon contiguity.
    
    INPUTS:
    spaceConcept (str): conceptualization of spatial relationships
    """

    productInfo = ARCPY.ProductInfo()
    if productInfo not in ["ArcInfo", "ArcServer"]:
        ARCPY.AddIDMessage("Error", 844, spaceConcept)
        raise SystemExit()    

def createSpatialFieldAliases(fieldNames, addString = None, wType = None, 
                              exponent = 1.0, rowStandard = True):
    """Creates field aliases for the different concepts of spatial 
    relationships.

    INPUTS:
    fieldNames (list): list of base field names
    addString {str, None}: additional token to add to alias
    wType {int, None}: spatial conceptualization (1)
    exponent {float, 1.0}: distance decay
    rowStandard {bool, True}: row standardize weights?

    OUTPUT:
    aliases (list): field aliases

    NOTES:
    (1) See the wTypeDispatch dictionary in WeightsUtilities.py for a 
        complete list of spatial conceptualizations and their corresponding
        integer values.
    """

    aliases = []

    for field in fieldNames:
        alias = [field]
        try:
            conceptStr = concept2Alias[wType]
            if wType == 0:
                iExp = int(exponent)
                if iExp != 1:
                    conceptStr += "^" + str(iExp) 
            alias.append(conceptStr)
        except:
            pass

        if addString is not None:
            alias.append(addString)
        if rowStandard:
            alias.append("RS")
        alias = " ".join(alias)
        aliases.append(alias)

    return aliases

def compareSpatialRefWeights(inRefName, outRefName):
    """Compares the names of two spatial reference objects to warn the
    user if spatial references different for SWM and output
    coordinate system.

    INPUTS:
    inRefName (str): name of spatial reference for input feature class. 
    outRefname (str): name of spatial reference defined for output.
    """
    
    if inRefName != outRefName:
        ARCPY.AddIDMessage("WARNING", 982, inRefName, outRefName)

def checkGeographicCoord(spatRefType, spaceConcept):
    """Check to see if the spatial reference type is Geographic
    Coordinate System, which is invalid for Inverse Distance and Zone of
    Indifference spatial concepts.

    INPUTS:
    spatRefType (str): spatial reference type
    spaceConcept (str): conceptualization fo spatial relationships
    """

    if spatRefType == "Geographic":
        ARCPY.AddIDMessage("WARNING", 981, spaceConcept)

def euclideanDistance(x0, x1, y0, y1):
    """Returns the Euclidean Distance between two points.

    INPUTS:
    x0 (float): xCoord for point 0
    x1 (float): xCoord for point 1
    y0 (float): yCoord for point 0
    y1 (float): yCoord for point 1
    """

    return NUM.sqrt( (x0 - x1)**2.0 + (y0 - y1)**2.0 ) 

def manhattanDistance(x0, x1, y0, y1):
    """Returns the Manhattan Distance between two points.

    INPUTS:
    x0 (float): xCoord for point 0
    x1 (float): xCoord for point 1
    y0 (float): yCoord for point 0
    y1 (float): yCoord for point 1
    """

    return abs(x0 - x1) + abs(y0 - y1)

def distance2Weight(distance, exponent = 1.0, wType = 0, threshold = None):
    """Returns a modified version of inverse distance for given 
    distance. (1)

    INPUTS:
    distance (float): previously calculated distance
    exponent (int, float): distance decay component
    wType (int): type of weight (see wTypeDispatch)

    OUTPUT:
    weight (float): calculated weight based on distance criteria.

    NOTES:
    (1)  Essentially, a zone of indifference with 1 as the 
         threshold distance.  I.e. any distance less that 1 is given a 
         weight of 1.  All others are inverse distance 1/d**exponent, 
         unless fixed is set to 1.... then all weights are 1.
    """

    if wType == 1:
        #### Fixed Distance ####
        weight = 1.0
    elif wType == 7:
        if threshold is None:
            weight = 1.0
        else:
            if distance > threshold:
                weight = 1.0 / ((distance - threshold) + 1.0)
            else:
                weight = 1.0
    else: 
        if distance <= 1.0:
            weight = 1.0
        else:
            weight = 1.0 / (distance**exponent)

    return weight

def checkDistanceThreshold(ssdo, threshold, weightType = 0, silent = False, 
                           zEnabled = False, thresholdOrigin = None):
    """Checks whether search threshold is appropriate given the extent
    of the feature class and the concept of spatial relationship chosen.

    INPUTS:
    extent (str): string representation of extent (9.2 or GAPY version)
    threshold (float): given distance threshold for neighborhood search
    weightType {int, 0}: spatial conceptualization (1) (2)
    silent {bool, False}: show greater than max extent warnings?
    thresholdOrigin {str, None}: original value and unit of the threshold before transformation


    OUTPUT:
    threshold (float): threshold/threshold that is to be used in analysis
    maxSet (bool): was the threshold set to the max of the extent? 

    NOTES:
    (1) See the wTypeDispatch dictionary in WeightsUtilities.py for a 
        complete list of spatial conceptualizations and their corresponding
        integer values.
    (2) This method is only called for distanced based weights:
        0 = Inverse Distance
        1 = Fixed Distance
        7 = Zone of Indifference (ZOI)
    """

    maxSet = False

    if threshold < 0:
        #### Negative Values Not Valid ####
        ARCPY.AddIDMessage("ERROR", 933)
        raise SystemExit()

    softWarn = False
    if ssdo.useChordal:
        softMaxExtent = ssdo.sliceInfo.maxExtent
        hardMaxExtent = ARC._ss.get_max_gcs_distance(ssdo.spatialRef)
        if softMaxExtent < hardMaxExtent:
            maxExtent = softMaxExtent
            softWarn = True
        else:
            maxExtent = hardMaxExtent
    else:
        env = UTILS.Envelope(ssdo.extent)
        maxExtent = env.maxExtent
    
    if zEnabled and ssdo.hasZ:
        minZ = ssdo.zCoords.min()
        maxZ = ssdo.zCoords.max()
        lenZ = maxZ - minZ
        if maxExtent < lenZ:
            maxExtent = lenZ

    if threshold == 0:
        if weightType in [1, 7]:
            #### Infinite Radius Not Valid For Fixed and ZOI ####
            ARCPY.AddIDMessage("ERROR", 928)
            raise SystemExit()
        else:
            #### Set to Max Extent for Inverse ####
            threshold = maxExtent 
            maxSet = True

    #### Assure that the Radius is Smaller than the Max Extent ####
    if threshold > maxExtent:
        if weightType in [1, 7]:
            #### Can Not be Greater or Equal to Extent ####
            #### Applies to Fixed (1) and ZOI (7) ####
            if ssdo.useChordal and not softWarn:
                LOGGER.error(1607, extra={"message_ID": 1607})
                raise SystemExit()
            else:
                ARCPY.AddIDMessage("ERROR", 929)
                raise SystemExit()
        else:
            #### Set to Max Length of Extent for Inverse #### 
            if not silent:
                if ssdo.useChordal and not softWarn:
                    ARCPY.AddIDMessage("WARNING", 1607)
                    ARCPY.AddIDMessage("WARNING", 1608)
                else:
                    ARCPY.AddIDMessage("WARNING", 929)
                    ARCPY.AddIDMessage("WARNING", 946)
            threshold = maxExtent
            maxSet = True
    
    if weightType == 7 and threshold < 0:
        #### Zone of Indifference, Set to One if Less ####
        if threshold < 1:
            threshold = 1

    ##### Increase Radius If MaxSet ####
    if maxSet and not ssdo.useChordal:
        threshold = threshold * 1.5

    return threshold, maxSet

def validateDistanceMethod(distanceMethodString, spatRef):
    sType = spatRef.type.upper()
    if sType == "GEOGRAPHIC":
        return "EUCLIDEAN", "euclidean"
    else:
        return distanceMethodString.upper(), distanceMethodString.lower()

def addNoNeighs2Delaunay(xyCoords, uniqueXY, neighs):
    noNeighs = [i for i in neighs if not len(neighs[i])]
    if len(noNeighs):
        kdtreeIndex = SCPS.cKDTree(uniqueXY)
        for ind in noNeighs:
            info = kdtreeIndex.query(xyCoords[ind], k = 2, 
                                     p = 2)
            xyNeigh = uniqueXY[info[1][1]]
            addNeighs = NUM.where((xyCoords == xyNeigh).sum(1) == 2)[0]
            for neigh in addNeighs:
                neighs[ind].add(int(neigh))
                neighs[neigh].add(int(ind))

    return neighs

def createThresholdDistKDTree(ssdo, currentKdtreeIndex, currentXYZ,  concept = "EUCLIDEAN"):
    """Creates a default threshold distance for neighborhood searching.
    This function uses the GA table to find the nearest neighbor for
    each feature. (1)    

    INPUTS:
    ssdo (obj): instance of a SSDataObject
    currentKdtreeIndex (obj): cKDTree scipy object
    currentXYZ (array 3Xn): array points 3D
    concept {str, EUCLIDEAN}: EUCLIDEAN or MANHATTAN distance
    

    OUTPUT:
    threshold (float): default distance threshold
    avgDist (float): average distance

    NOTES:
    (1) The distance for each feature is calculated, and the maximum is 
        returned as the default threshold.  This function assumes the GA 
        Table has already been created.
    """

    #### Set Progressor for Search ####
    ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84144))

    if concept == "EUCLIDEAN":
        typeDist = 2
    else:
        typeDist = 1
    
    threshold = 0.0
    sumDist = 0.0 
    kdtreeIndex = currentKdtreeIndex
    uniqueXYZ = currentXYZ

    #### Calculate Threshold Using Unique Points 3D ####
    if not ssdo.allUnique:
        uniqueXYZ, counts = STATS.uniqueRows(currentXYZ)
        kdtreeIndex = SCPS.cKDTree(uniqueXYZ)

    N = len(uniqueXYZ)
    for idNode in UTILS.ssRange(N):
        baseCoor = uniqueXYZ[idNode]
        distNeig, ids = kdtreeIndex.query(NUM.array([baseCoor]), k = 2, p = typeDist)
        numberNeig = len(distNeig[0]) - 1
        if numberNeig > 0:
            dist = distNeig[0].sum()
            if dist > threshold:
                threshold = dist
            sumDist += dist

        ARCPY.SetProgressorPosition()

    #### Increase For Rounding Error ####
    threshold = threshold * 1.0001
    avgDist = sumDist / (N * 1.0)

    #### Chordal Default Check ####
    if ssdo.useChordal:
        hardMaxExtent = ARC._ss.get_max_gcs_distance(ssdo.spatialRef)
        if threshold > hardMaxExtent:
            ARCPY.AddIDMessage("ERROR", 1609)
            raise SystemExit()

    #### Add Linear/Angular Units ####
    thresholdStr = ssdo.distanceInfo.printDistance(threshold)
    ARCPY.AddIDMessage("Warning", 853, thresholdStr)

    #### Chordal Default Check ####
    if ssdo.useChordal:
        hardMaxExtent = ARC._ss.get_max_gcs_distance(ssdo.spatialRef)
        if threshold > hardMaxExtent:
            ARCPY.AddIDMessage("ERROR", 1609)
            raise SystemExit()

    return threshold, avgDist


def createThresholdDist(ssdo, concept = "EUCLIDEAN", silentWarning = False, enableProgress = True):
    """Creates a default threshold distance for neighborhood searching.
    This function uses the GA table to find the nearest neighbor for
    each feature. (1)    

    INPUTS:
    gaTable (obj): instance of a GA Table
    concept {str, EUCLIDEAN}: EUCLIDEAN or MANHATTAN distance
    distanceInfo {obj, None}: instance of UTILS.DistanceInfo

    OUTPUT:
    threshold (float): default distance threshold

    NOTES:
    (1) The distance for each feature is calculated, and the maximum is 
        returned as the default threshold.  This function assumes the GA 
        Table has already been created.
    """

    if enableProgress:
        #### Set Progressor for Search ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84144))

    #### Create k-Nearest Neighbor Search Type ####
    gaSearch = GAPY.ga_nsearch(ssdo.gaTable)
    ssConcept, gaConcept = validateDistanceMethod(concept, ssdo.spatialRef)
    gaSearch.init_nearest(0.0, 1, gaConcept)
    neighDist = ARC._ss.NeighborDistances(ssdo.gaTable, gaSearch)
    N = len(neighDist)
    threshold = 0.0
    sumDist = 0.0 

    #### Find Maximum Nearest Neighbor Distance ####
    for row in UTILS.ssRange(N):
        dij = neighDist[row][-1][0]
        if dij > threshold:
            threshold = dij
        sumDist += dij

        ARCPY.SetProgressorPosition()

    #### Increase For Rounding Error ####
    threshold = threshold * 1.0001
    avgDist = sumDist / (N * 1.0)

    #### Add Linear/Angular Units ####
    if not silentWarning:
        thresholdStr = ssdo.distanceInfo.printDistance(threshold)
        ARCPY.AddIDMessage("Warning", 853, thresholdStr)

    #### Chordal Default Check ####
    if ssdo.useChordal:
        hardMaxExtent = ARC._ss.get_max_gcs_distance(ssdo.spatialRef)
        if threshold > hardMaxExtent:
            ARCPY.AddIDMessage("ERROR", 1609)
            raise SystemExit()

    #### Clean Up ####
    del gaSearch
    
    return threshold, avgDist

def parseGAWarnings(gaWarnings):
    """Returns the Object ID for all features in a dataset that has bad
    records.

    INPUTS:
    gaWarnings (obj): GA Warnings Object

    OUTPUT:
    badRecs (list): list of bad records
    """

    badRecs = []
    for warning in gaWarnings:
        if warning[0] != 39999:
            badRecs.append( str(warning[1]) )

    return badRecs

def returnHeader(ssdo, weightsFile, swmFileBool = True, silentWarnings=False):
    """Checks whether the masterField of a given spatial weights file 
    is in the given input feature class.

    INPUTS:
    inputFC (str): catalogue path to the table
    weightsFile (str): path to the spatial weights matrix file
    swmFileBool {bool, True}: is the weightsFile in *.swm format?

    OUTPUT:
    masterFieldName (str): name of the weights file unique ID field
    spatialRefName (str): spatial reference name
    """

    #### Obtain the Unique ID Field from the Spatial Weight File ####
    isGALNonUnique = False
    hasID64 = ssdo.hasOID64
    uniqueIDType = "Long"
    if swmFileBool:
        swm = SWMReader(weightsFile, silentWarnings=silentWarnings)
        fo = swm.fo
        masterField = swm.masterField
        spatialRefName = swm.spatialRefName
        hasID64 = swm.hasID64
    else:
        ext = OS.path.splitext(weightsFile)[-1].upper()
        fo, info = textWeightsHeader(weightsFile)
        isGAL = ext == ".GAL"
        if isGAL:
            masterFieldInd = -2
        else:
            masterFieldInd = -1

        headerInfo = info.split()
        if len(headerInfo) > 1 or (not isGAL):
            masterField = headerInfo[masterFieldInd]
        else:
            masterField = None
            isGALNonUnique = True
        spatialRefName = ""
        hasID64 = False
    fo.close()

    if hasID64:
        uniqueIDType = "BigInteger"

    #### Check to See if in InputFC ####
    masterFieldObj = None
    if masterField is None:
        lf = ARCPY.ListFields(ssdo.inputFC, ssdo.oidName)
        masterFieldObj = lf[0]
    else:
        for fieldName, fieldObj in UTILS.iteritems(ssdo.allFields):
            if fieldObj.baseName.upper() == masterField.upper():
                masterFieldObj = fieldObj
                isBigInteger = masterFieldObj.type.upper() == "BIGINTEGER"

                #### Assure Master Field Int Compatibility ####
                compatible = True
                if hasID64 and not isBigInteger:
                    compatible = False
                if not hasID64 and isBigInteger:
                    compatible = False

                if not compatible:
                    ARCPY.AddIDMessage("ERROR", 110516, uniqueIDType, masterFieldObj.type)
                    raise SystemExit()

    if masterFieldObj is None:
        ARCPY.AddIDMessage("ERROR", 949, masterField, weightsFile)
        raise SystemExit()

    #### Assure Master Field is an Integer ####
    if not isGALNonUnique:
        dataType = ERROR.data2Type[masterFieldObj.type]
        if dataType not in [0,1,8]:
            typeString = ERROR.returnFieldTypes([0,1,8])
            ARCPY.AddIDMessage("ERROR", 640, masterField, typeString)
            raise SystemExit()

    return masterFieldObj.name.upper(), spatialRefName

def getWeightsValuesSWM(info, master2Order, varVals, rowStandard = True,
                        isSubSet = False, potVals = None):
    """Formats an entry of a SWM file for use in Global and Local
    Statistics.

    INPUTS:
    info (tuple): result of readWeightsEntry()
    master2Order (dict): uniqueID = order in values array
    varVals (array): values for all of the features
    rowStandard {bool, True}: return row standardized matrix?
    isSubSet {bool, False}: extra calcs are required (selection sets)
    potVals {array, None}: self weight values

    OUTPUT:
    masterID (int): unique ID for the current row in the SWM file
    orderID (int): order of the feature in the values array
    ownVal (float): given features own value
    nhIDs (list): unique IDs for neighbors
    nhVals (list): list of values for neighboring features
    weights (array): weights correspnding to the given neighbors
    """

    #### Parse Weights Entry ####
    masterID, nn, nhsTemp, weightsTemp, sumUnstandard = info
    potBool = (potVals is not None)

    #### Get Self Values ####
    orderID = master2Order[masterID]
    ownVal = varVals[orderID]

    #### Empty Result Structures ####
    nhIDs = []
    nhVals = []
    weights = []

    #### Resolve Traditional Neighbors/Weights ####
    if isSubSet or potBool:
        #### Selection Set or Self Potential Field ####
        #### Requires Restandardization of Weights ####
        if nn:
            for i in UTILS.ssRange(nn):
                nh = nhsTemp[i]
                if nh in master2Order:
                    nhOrder = master2Order[nh]
                    nhIDs.append(nhOrder)
                    nhVals.append(varVals[nhOrder])
                    nhWeight = weightsTemp[i]
                    if rowStandard:
                        #### Unstandardize if Necessary ####
                        nhWeight = nhWeight * sumUnstandard[0]
                    weights.append(nhWeight)

        #### Self Weight ####
        if potBool:
            nhIDs.append(orderID)
            nhVals.append(ownVal)
            weights.append(potVals[orderID])

        #### Re-Standardize ####
        nn = len(nhIDs)
        if nn:
            weights = NUM.array(weights)
            if rowStandard:
                weights = (1.0 / weights.sum()) * weights

    else:
        #### No Selection Set ####
        if nn:
            for i in UTILS.ssRange(nn):
                nh = nhsTemp[i]
                nhOrder = master2Order[nh]
                nhIDs.append(nhOrder)
                nhVals.append(varVals[nhOrder])
        weights = weightsTemp

    return orderID, ownVal, nhIDs, nhVals, weights

def getWeightsValuesCont(masterID, master2Order, contDict, varVals, 
                         rowStandard = True, potVals = None):
    """Formats an entry of a contiguity dictionary for use in Global 
    and Local Statistics.

    INPUTS:
    contDict (tuple): result of polygonNeighborDict
    master2Order (dict): uniqueID = order in values array
    varVals (array): values for all of the features
    rowStandard {bool, True}: return row standardized matrix?
    potVals {array, None}: self weight values

    OUTPUT:
    masterID (int): unique ID for the current row in the SWM file
    orderID (int): order of the feature in the values array
    ownVal (float): given features own value
    nhIDs (list): unique IDs for neighbors
    nhVals (list): list of values for neighboring features
    weights (array): weights correspnding to the given neighbors
    """

    #### Get Self Values ####
    orderID = master2Order[masterID]
    ownVal = varVals[orderID]
    potBool = (potVals is not None)

    #### Empty Result Structures ####
    nhIDs = []
    nhVals = []
    weights = []

    #### Resolve Traditional Neighbors/Weights ####
    try:
        otherNeighs = contDict[masterID]
        for nh in otherNeighs:
            if nh != masterID:
                nhOrder = master2Order[nh]
                nhIDs.append(nhOrder)
                nhVals.append(varVals[nhOrder])
                weights.append(1.0)
    except:
        pass

    #### Assign Self Neighbor ####
    if potBool:
        nhIDs.append(orderID)
        nhVals.append(ownVal)
        weights.append(potVals[orderID])

    #### Row Standardize ####
    nn = len(nhIDs)
    if nn:
        weights = NUM.array(weights)
        if rowStandard:
            weights = (1.0 / weights.sum()) * weights

    return orderID, ownVal, nhIDs, nhVals, weights

def getWeightsValuesText(masterID, master2Order, weightDict, varVals, 
                         potVals = None, allowSelf = False):
    """Formats an entry of a text weights dictionary for use in Global 
    and Local Statistics.

    INPUTS:
    weightDict (tuple): result of buildTextWeightDict
    master2Order (dict): uniqueID = order in values array
    varVals (array): values for all of the features
    potVals {array, None}: self weight values
    allowSelf {bool, False}: allow i == j for spatial weights

    OUTPUT:
    masterID (int): unique ID for the current row in the SWM file
    orderID (int): order of the feature in the values array
    ownVal (float): given features own value
    nhIDs (list): unique IDs for neighbors
    nhVals (list): list of values for neighboring features
    weights (array): weights correspnding to the given neighbors
    """

    #### Get Self Values ####
    orderID = master2Order[masterID]
    ownVal = varVals[orderID]
    potBool = (potVals is not None)

    #### Empty Result Structures ####
    nhIDs = []
    nhVals = []
    weights = []
    selfIncluded = False
    ownWeight = 0.0

    #### Resolve Neighbors/Weights ####
    if masterID in weightDict:
        otherNeighs, otherWeights = weightDict[masterID]
        c = 0
        for nh in otherNeighs:
            if nh in master2Order:
                nhOrder = master2Order[nh]
                if nh == masterID:
                    #### Self Neighbor ####
                    selfIncluded = True
                    ownWeight = otherWeights[c]
                else:
                    #### Traditional Weights ####
                    nhIDs.append(nhOrder)
                    nhVals.append(varVals[nhOrder])
                    weights.append(otherWeights[c])
            c += 1

    #### Resolve Self Neighbor ####
    if allowSelf:
        if potBool:
            #### Overwrite Text Weight With Self Potential Value ####
            ownWeight = potVals[orderID]

        #### Assure Non-Zero Weight, Negatives Already Set to Zero ####
        zeroSelf = UTILS.compareFloat(0.0, ownWeight)

        #### Add Self Values If Not Zero Or Has Other Neighs ####
        if len(nhIDs) or not zeroSelf:
            nhIDs.append(orderID)
            nhVals.append(ownVal)
            weights.append(ownWeight)

    #### No Row Standardize, Text Weights As Defined ####
    weights = NUM.array(weights)

    return orderID, ownVal, nhIDs, nhVals, weights

def getWeightsValuesOTF_Potent(neighWeights, row, varVals, potVals = None):
    """Formats an entry of a GA Table set of weights and values for
    Global and Local Statistics..

    INPUTS:
    neighWeights (class): Instance of NeighborWeights
    row (int): index of GA Table
    varVals (array): values for all of the features
    potVals {array, None}: self weight values

    OUTPUT:
    orderID (int): order of the feature in the values array
    ownVal (float): given features own value
    nhIDs (list): unique IDs for neighbors
    nhVals (list): list of values for neighboring features
    weights (array): weights correspnding to the given neighbors

    NOTES:
    (1) See the wTypeDispatch dictionary in WeightsUtilities.py for a 
        complete list of spatial conceptualizations and their corresponding
        integer values.
    """

    #### Get Self Values ####
    ownVal = varVals[row]
    potBool = (potVals is not None)

    #### Empty Result Structures ####
    nhIDs, weights = neighWeights[row]
    nhVals = NUM.take(varVals, nhIDs)

    if potBool:
        weights[-1] = potVals[row]
    
    return row, ownVal, nhIDs, nhVals, weights

def getWeightsValuesOTF(neighWeights, row, varVals):
    """Formats an entry of a GA Table set of weights and values for
    Global and Local Statistics..

    INPUTS:
    row (int): index of GA Table
    varVals (array): values for all of the features

    OUTPUT:
    orderID (int): order of the feature in the values array
    ownVal (float): given features own value
    nhIDs (list): unique IDs for neighbors
    nhVals (list): list of values for neighboring features
    weights (array): weights correspnding to the given neighbors

    NOTES:
    (1) See the wTypeDispatch dictionary in WeightsUtilities.py for a 
        complete list of spatial conceptualizations and their corresponding
        integer values.
    """

    #### Get Self Values ####
    ownVal = varVals[row]

    #### Empty Result Structures ####
    nhIDs, weights = neighWeights[row]
    nhVals = NUM.take(varVals, nhIDs)

    return row, ownVal, nhIDs, nhVals, weights

################### Contiguity Functions ##################

def polygonNeighborDict(inputFC, masterField, contiguityType = "ROOK"):
    """Build a dictionary containing polygon contiguity based on FID.

    INPUTS:
    inputFC (str, POLYGON): path to the input feature class    
    masterField (str): unique ID Field
    contiguityType {str, ROOK}: ROOK or QUEEN contiguity (1)

    OUTPUT:
    polyNeighborDict (dict): MasterID = list of neighbor IDs

    NOTES:
    (1) ROOK = Edges only, QUEEN = Edges and Vertices (Nodes)
    """

    #### Assure Polygon FC ####
    d = ARCPY.Describe(inputFC)
    if d.shapeType.upper() != "POLYGON":
        ARCPY.AddIDMessage("ERROR", 914)
        raise SystemExit()

    #### Use Polygon Neighbor Tool ####
    ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84126))
    contTable = "in_memory\\contTabWU"
    ANA.PolygonNeighbors(inputFC, contTable, masterField, 
                         "AREA_OVERLAP", "NO_BOTH_SIDES", None,
                         out_linear_units="METERS",
                         out_area_units="SQUARE_METERS")

    #### Create Result Structure ####
    polyNeighDict = COLL.defaultdict(list)
    rookType = contiguityType == 'ROOK'
    flds = ARCPY.ListFields(contTable)

    #### Avoid to use Field Names, the PolygonNeighbors tool changes the behavior depending on input ####
    if flds[-1].type.upper() == "OID":
        mID, nID, areaID, lengthID = 0, 1, 2, 3
    else:
        mID, nID, areaID, lengthID = 1, 2, 3, 4

    #### Create Cursor and Read Results ####
    rows = DA.SearchCursor(contTable, "*")
    for row in rows:
        include = True
        masterID, neighID, area, length = row[mID], row[nID], row[areaID], row[lengthID]
        noOverlap = UTILS.compareFloat(0.0, area)
        if rookType and noOverlap:
            if UTILS.compareFloat(0.0, length):
                include = False
        if include:
            polyNeighDict[masterID].append(neighID)
            polyNeighDict[neighID].append(masterID)

    #### Clean Up ####
    del rows
    UTILS.passiveDelete(contTable)

    return polyNeighDict

def polygonNeighborDictOrder(ssdo, contiguityType = "ROOK"):
    """Build a dictionary containing polygon contiguity based on FID.

    INPUTS:
    inputFC (str, POLYGON): path to the input feature class    
    masterField (str): unique ID Field
    contiguityType {str, ROOK}: ROOK or QUEEN contiguity (1)

    OUTPUT:
    polyNeighborDict (dict): MasterID = list of neighbor IDs

    NOTES:
    (1) ROOK = Edges only, QUEEN = Edges and Vertices (Nodes)
    """

    #### Assure Polygon FC ####
    if ssdo.shapeType.upper() != "POLYGON":
        ARCPY.AddIDMessage("ERROR", 914)
        raise SystemExit()

    #### Use Polygon Neighbor Tool ####
    ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84126))
    contTable = "in_memory\\contTabWU"
    ANA.PolygonNeighbors(ssdo.inputFC, contTable, ssdo.masterField, 
                         "AREA_OVERLAP", "NO_BOTH_SIDES", None,
                         out_linear_units="METERS",
                         out_area_units="SQUARE_METERS")

    #### Create Result Structure ####
    polyNeighDict = COLL.defaultdict(list)
    rookType = contiguityType == 'ROOK'
    flds = ARCPY.ListFields(contTable)

    #### Avoid to use Field Names, the PolygonNeighbors tool changes the behavior depending on input ####
    if flds[-1].type.upper() == "OID":
        mID, nID, areaID, lengthID = 0, 1, 2, 3
    else:
        mID, nID, areaID, lengthID = 1, 2, 3, 4

    #### Create Cursor and Read Results ####
    rows = DA.SearchCursor(contTable, "*")
    for row in rows:
        include = True
        masterID, neighID, area, length = row[mID], row[nID], row[areaID], row[lengthID]
        noOverlap = UTILS.compareFloat(0.0, area)
        if rookType and noOverlap:
            if UTILS.compareFloat(0.0, length):
                include = False
        if include:
            orderID = ssdo.master2Order[masterID]
            neighOrder = ssdo.master2Order[neighID]
            polyNeighDict[orderID].append(neighOrder)
            polyNeighDict[neighOrder].append(orderID)

    #### Clean Up ####
    del rows
    UTILS.passiveDelete(contTable)

    return polyNeighDict

#################### Conversion Utilities ##################

def textWeightsHeader(textWeightsFile):
    """Returns the Master ID Field Name for a text formatted spatial
    weights matrix file.

    INPUTS:
    textWeightsFile (str): path to the text spatial weights file

    OUTPUT:
    fo (object): open text file pointer
    header (str): master ID fieldname
    """

    fo = UTILS.openFile(textWeightsFile, "r")
    header = fo.readline().strip()

    return fo, header

def buildTextWeightDict(textWeightsFile, master2Order): 
    """Processes spatial weights in text format and returns the
    information in a dictionary structure.

    INPUTS:
    textWeightsFile (str): path to the text spatial weights file
    master2Order (dict): uniqueID = order in values array

    OUTPUT:
    weightDict (dict): Unique ID: [ (neighIDs), (weights) ]
    """

    fo, masterField = textWeightsHeader(textWeightsFile)

    #### Possible to Run Out of Memory if Too Many Neighbors ####
    #### See Tool Documentation for Explanation ####
    weightDict = {}
    weightSum = 0.0
    negativeWeights = False
    errMess = "Invalid text weights format."

    for line in fo:
        #### Unpack and Check Format ####
        try:
            masterID, nid, weight = line.split() 
            masterID = int(masterID)
        except:
            ARCPY.AddError(errMess)
            raise SystemExit()

        #### Process Intersection in Weights Matrix ####
        if masterID in master2Order:
            try:
                nhID = int(nid)
                weight = LOCALE.atof(weight)
            except:
                ARCPY.AddIDMessage("Error", 919)
                raise SystemExit()
            if weight < 0.0:
                #### Do Not Add Negative Weights ####
                negativeWeights = True
            elif UTILS.compareFloat(weight, 0.0):
                #### Do Not Add Zero Weights ####
                pass
            else:
                try:
                    weightDict[masterID][0].append(nhID)
                    weightDict[masterID][1].append(weight)
                except:
                    weightDict[masterID] = ([nhID], [weight])
        else:
            #### Unique Id Does Not Exist / Not In Selection ####
            pass

    #### Report Negative Weights ####
    if negativeWeights:
        ARCPY.AddIDMessage("Warning", 941)

    fo.close()

    return weightDict

def buildTextWeightDictNoSelf(textWeightsFile, master2Order): 
    """Processes spatial weights in text format and returns the
    information in a dictionary structure.  Must be in memory of 
    SSDO and features can NOT be related to self.

    INPUTS:
    textWeightsFile (str): path to the text spatial weights file
    master2Order (dict): uniqueID = order in values array

    OUTPUT:
    weightDict (dict): Unique ID: [ (neighIDs), (weights) ]
    """

    fo, masterField = textWeightsHeader(textWeightsFile)

    #### Possible to Run Out of Memory if Too Many Neighbors ####
    #### See Tool Documentation for Explanation ####
    weightDict = {}
    weightSum = 0.0
    negativeWeights = False
    errMess = "Invalid text weights format."

    for line in fo:
        #### Unpack and Check Format ####
        try:
            masterID, nid, weight = line.split() 
            masterID = int(masterID)
        except:
            ARCPY.AddError(errMess)
            raise SystemExit()

        #### Process Intersection in Weights Matrix ####
        if masterID in master2Order:
            try:
                nhID = int(nid)
                weight = LOCALE.atof(weight)
            except:
                ARCPY.AddIDMessage("Error", 919)
                raise SystemExit()
            if nhID != masterID:
                if nhID in master2Order:
                    if weight < 0.0:
                        #### Do Not Add Negative Weights ####
                        negativeWeights = True
                    elif UTILS.compareFloat(weight, 0.0):
                        #### Do Not Add Zero Weights ####
                        pass
                    else:
                        try:
                            weightDict[masterID][0].append(nhID)
                            weightDict[masterID][1].append(weight)
                        except:
                            weightDict[masterID] = ([nhID], [weight])

    #### Report Negative Weights ####
    if negativeWeights:
        ARCPY.AddIDMessage("Warning", 941)

    fo.close()

    #### Recursive Delete For Subset/No Neighbors ####
    delIDs = []
    if len(weightDict) != len(master2Order):
        for masterID, neighInfo in UTILS.iteritems(weightDict):
            neighIDs, neighWeights = neighInfo
            neighOut = []
            weightOut = []
            for neighIndex, neighID in enumerate(neighIDs):
                if neighID in weightDict:
                    neighOut.append(neighID)
                    weightOut.append(neighWeights[neighIndex])
            if len(neighOut):
                weightDict[masterID] = (neighOut, weightOut)
            else:
                delIDs.append(masterID)
    if len(delIDs):
        for masterID in delIDs:
            del weightDict[masterID]

    return weightDict
