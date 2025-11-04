################### Imports ########################
import sys as SYS
import os as OS
import locale as LOCALE
import numpy as NUM
import numpy.linalg as LA
import scipy.spatial as SCPS
import numpy.random as RAND
import arcgisscripting as ARC
import arcpy as ARCPY
import arcpy.analysis as ANA
import arcpy.management as DM
import arcpy.da as DA
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import SSCubeObject as SSCO
import Stats as STATS
import gapy as GAPY
import WeightsUtilities as WU
import Stats as STATS
import scipy.spatial as SCPS

supportedStatisticMethods = {"ALL": 6,
                             "MEAN": 0, "STD_DEV": 1, "SKEWNESS": 2,
                             "MEDIAN": 3, "IQR": 4, "QUANTILE_IMBALANCE": 5}

supportedSpatialRelation = {1: 'FIXED_DISTANCE',
                            2: 'K_NEAREST_NEIGHBORS',
                            3: 'DELAUNAY_TRIANGULATION',
                            4: 'CONTIGUITY_EDGES_ONLY',
                            5: 'CONTIGUITY_EDGES_CORNERS',
                            8: 'GET_SPATIAL_WEIGHTS_FROM_FILE'}

supportedWeightSchema = {'UNWEIGHTED': 0,
                         'BISQUARE': 1,
                         'GAUSSIAN': 2}

MAX_NUM_NEIGHS = 1000

class KDNeighborSearch(object):
    """cKDTree specific for use in the Neighborhood Summary Statistics Class."""

    def __init__(self, ssdo, concept = "EUCLIDEAN"):
        self.ssdo = ssdo

        if concept.upper() == "MANHATTAN":
            self.p = 1
            self.concept = concept.upper()
        else:
            self.p = 2
            self.concept = "EUCLIDEAN"

        self.numLocations = self.ssdo.numObs

        self.hasZ = False
        if self.ssdo.useChordal:
            self.coords = self.ssdo.spheroidCoords
        else:
            #### Uncomment If When We Want To Honor Z Coords ####
            #if self.ssdo.zCoords is not None:
            #    self.hasZ = True
            #    self.coords = NUM.empty((self.numLocations, 3), dtype = float)
            #    self.coords[:,0:2] = self.ssdo.xyCoords
            #    self.coords[:,-1] = self.ssdo.zCoords
            #else:
            self.coords = self.ssdo.xyCoords

        self.kdTree = SCPS.cKDTree(self.coords)

    def setKNN(self, numNeighs):
        self.numNeighs = numNeighs
        self.k = numNeighs + 1
        self.getNeighbors = self.__getKNNSpatial

    def __getKNNSpatial(self, orderID):
        coordinates = self.coords[orderID]
        info = self.kdTree.query(coordinates, k = self.k, 
                                 p = self.p)

        neighs = NUM.asarray(info[1], dtype = NUM.int32)
        return neighs[neighs != orderID]

    def setDistance(self, distanceBand):
        self.distanceBand = distanceBand
        self.getNeighbors = self.__getDistanceSpatial

    def __getDistanceSpatial(self, orderID):
        coordinates = self.coords[orderID]
        neighs = self.kdTree.query_ball_point(coordinates, 
                                              r = self.distanceBand, 
                                              p = self.p) 

        neighs = NUM.asarray(neighs, dtype = NUM.int32)
        return neighs[neighs != orderID]

    def createThresholdDist(self, silentWarning = True):
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84144), 0, self.numLocations, 1)
        threshold = 0.0
        sumDist = 0.0 
        for orderID in range(self.numLocations):
            coord = self.coords[orderID]
            distances, ids = self.kdTree.query(coord, k = 2, p = self.p)
            maxDist = distances[-1]
            if maxDist > threshold:
                threshold = maxDist
            sumDist += maxDist

            ARCPY.SetProgressorPosition()

        #### Increase For Rounding Error ####
        threshold = threshold * 1.0001
        avgDist = sumDist / self.numLocations

        #### Add Linear/Angular Units ####
        if not silentWarning:
            thresholdStr = self.ssdo.distanceInfo.printDistance(threshold)
            ARCPY.AddIDMessage("Warning", 853, thresholdStr)

        #### Chordal Default Check ####
        if self.ssdo.useChordal:
            hardMaxExtent = ARC._ss.get_max_gcs_distance(self.ssdo.spatialRef)
            if threshold > hardMaxExtent:
                ARCPY.AddIDMessage("ERROR", 1609)
                raise SystemExit()

        return threshold, avgDist


class NeighborhoodSummaryStatistics(object):
    """
    This class provides the functions used for te tool Neighborhood Summary Statistics
    """

    def __init__(self, ssdo, varNames, wType=2, includeSelf=True, ignoreNulls=True,
                 statisticMethod="ALL", concept="EUCLIDEAN",
                 calGeoWeight=True, threshold=None, weightsFile=None, numNeighs=0,
                 weightSchema='UNWEIGHTED', kernelBand=None,
                 sourceIsThiessen = False):

        self.ssdo = ssdo
        if self.ssdo.shapeType.upper() not in ["POLYGON", "POINT"]:
            ARCPY.AddIDMessage('ERROR', 366)
            raise SystemExit()

        #### Warning About Distanc Stats not being Weighted ####
        if weightSchema not in ['UNWEIGHTED', None] or wType == 8:
            ARCPY.AddIDMessage('WARNING', 110341)

        #### Set Include Self to False if SWM ####
        if wType == 8:
            includeSelf = False

        self.varNames = varNames
        self.varDim = len(self.varNames)
        self.sourceIsThiessen = sourceIsThiessen

        if statisticMethod.upper() not in supportedStatisticMethods:
            ARCPY.AddError("Statistic method not supported.")
            raise SystemExit()

        #### Set Local Statistic Function Pointer ####
        self.statisticMethodInt = supportedStatisticMethods[statisticMethod.upper()]
        if self.statisticMethodInt in [0,1,2]:
            self.__local_statistics = self.__local_statistics_basic
        elif self.statisticMethodInt in [3,4,5]:
            self.__local_statistics = self.__local_statistics_quantiles
        else:
            self.__local_statistics = self.__local_statistics_all

        #### Set Neighborhood Type Int ####
        self.wType = wType
        if self.wType not in supportedSpatialRelation:
            ARCPY.AddIDMessage("ERROR", 723)
            raise SystemExit()

        self.includeSelf = includeSelf
        self.calGeoWeight = calGeoWeight

        self.numNeighs = numNeighs
        self.concept = concept.lower()
        self.ignoreNulls = ignoreNulls

        #### Set Weighting Schema ####
        if self.wType not in [1, 2, 3]:
            self.weightSchema = 0
        else:
            if weightSchema.upper() not in supportedWeightSchema:
                ARCPY.AddMessage("The Local Weight Schema {} is not supported.".format(weightSchema.upper()))
                raise SystemExit()
            self.weightSchema = supportedWeightSchema[weightSchema.upper()]
        self.isUnweighted = self.weightSchema == 0

        #### Assign Weights File Info ####
        self.weightsFile = weightsFile
        self.swmFileBool = False
        if weightsFile:
            weightSuffix = weightsFile.split(".")[-1].lower()
            self.swmFileBool = (weightSuffix == "swm")

        if ssdo.useChordal:
            #### Chordal Distance XYZ ###
            self.coordinates = ssdo.spheroidCoords
        else:
            self.coordinates = ssdo.xyCoords

        #### Create KDTree Neighbor Search Class for KNN or Fixed Distance ####
        self.neighSearch = None
        if self.wType in [1,2]:
            self.neighSearch = KDNeighborSearch(self.ssdo)

        #### Set Linear Unit Info ####
        self.threshold = threshold
        self.kernelBand = kernelBand
        self.__setLinearUnitInfo()

        #### Prepare Data ####
        self.numObs = self.ssdo.numObs
        self.__prepare_data()

        #### Finalize KDTree Search Info/Method ####
        if self.wType == 1:
            self.neighSearch.setDistance(self.distanceBand)
        if self.wType == 2:
            self.neighSearch.setKNN(self.numNeighs)

        #### Create Results Array ####
        if self.statisticMethodInt == supportedStatisticMethods["ALL"]:
            self.resultBlockSize = len(supportedStatisticMethods) - 1
        else:
            self.resultBlockSize = 1

        self.results = {}
        self.distVarName = 'DIST_SUMSTATS_SS'
        for varName in varNames:
            self.results[varName] = NUM.zeros((self.numObs, self.resultBlockSize), dtype=float)
        self.results[self.distVarName] = NUM.zeros((self.numObs, self.resultBlockSize), dtype=float)
        self.resultNNeighbors = NUM.zeros((self.numObs, self.varDim), dtype=NUM.int32)
        self.baseNNeighbors = NUM.zeros((self.numObs,), dtype=NUM.int32)

        #### Keep Track of Bad Records ####
        self.badRecords = set([])
        self.beyondBandRecords = set([])

        #### Calculate Stats ####
        self.__calculate()

        #### Report Distance Larger than Band Records ####
        self.__reportBeyondBandwidthRecords()

        #### Calculate and Report Features w/ NULL Outputs ####
        self.__identifyNullRecords()

    def __reportBeyondBandwidthRecords(self):
        """Report Distance Larger than Band Records."""

        numBad = len(self.beyondBandRecords)
        if numBad:
            #### Sort and Report Records with Zero Weights Because Dist >= Bandwidth ####
            uniqueField = "SOURCE_ID"
            sortBad = NUM.sort([ self.ssdo.order2Master[i] for i in self.beyondBandRecords ])
            firstBad = [str(i) for i in sortBad[0:30]]
            firstBad = ", ".join(firstBad)
            ARCPY.AddIDMessage("WARNING", 110382, numBad, self.ssdo.numObs)
            ARCPY.AddIDMessage("WARNING", 110383, uniqueField, firstBad)

    def __identifyNullRecords(self):
        """Calculate and Report Features w/ NULL Outputs."""

        allVarNames = self.varNames + [self.distVarName]
        for orderID in range(self.ssdo.numObs):
            for varName in allVarNames:
                if NUM.isnan(self.results[varName][orderID]).sum() > 0:
                    self.badRecords.add(orderID)

        #### Report Bad Records ####
        numBad = len(self.badRecords)
        if numBad:
            #### Get Output Unique ID Field Name ####
            if self.sourceIsThiessen:
                uniqueField = "Input_FID"
            else:
                if self.wType == 8:
                    uniqueField = self.ssdo.masterField
                else:
                    uniqueField = "SOURCE_ID"

            #### Sort and Report Records with NULL Values ####
            sortBad = NUM.sort([ self.ssdo.order2Master[i] for i in self.badRecords ])
            firstBad = [str(i) for i in sortBad[0:30]]
            firstBad = ", ".join(firstBad)
            ARCPY.AddIDMessage("WARNING", 110370, numBad, self.ssdo.numObs)
            ARCPY.AddIDMessage("WARNING", 110371, uniqueField, firstBad)

    def __assignLinearUnitInfo(self, linearUnit, overwriteLinearUnit = None):
        """Assigns Linear Unit Information."""

        ssdo = self.ssdo
        inputUnitName = ssdo.distanceInfo.name
        isFloat = UTILS.isNumeric(linearUnit)

        if overwriteLinearUnit is not None:
            #### When Overwrite is Called the linearUnit is always a float (empty/default) ####
            info = ssdo.distanceInfo.getUserLinearUnitInfo(overwriteLinearUnit)
            linearValue, overwriteUnitName = info
            userValue = ssdo.distanceInfo.convertInputLinearUnit(linearValue, overwriteUnitName)
            return linearUnit, inputUnitName, userValue, overwriteUnitName

        if isFloat:
            #### Input/User Linear Unit all in Output Coord System ####
            return linearUnit, inputUnitName, linearUnit, inputUnitName

        else:
            #### Linear Unit Passed In ####
            info = ssdo.distanceInfo.getUserLinearUnitInfo(linearUnit)
            linearValue, userUnitName = info
            userValue = ssdo.distanceInfo.convertInputLinearUnit(linearValue, userUnitName)

            return linearValue, inputUnitName, userValue, userUnitName

    def __setLinearUnitInfo(self):
        """Assigns Linear Unit Information."""

        ssdo = self.ssdo
        bothDefault = self.threshold is None and self.kernelBand is None
        threshDefault = self.threshold is None
        bandwidthDefault = self.kernelBand is None
        self.distanceBand = None
        self.bandwidth = None
        if self.wType == 1:
            if self.isUnweighted:
                #### Fixed Distance - No Bandwidth ####
                if threshDefault:
                    self.threshold, avgDist = self.neighSearch.createThresholdDist()
                info = self.__assignLinearUnitInfo(self.threshold)
                self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info
            else:
                #### Fixed Distance - Using Bandwidth ####

                if bothDefault:
                    #### Both Defaults - Data Generated Floats in Output Coord Linear Units (Report Both) ####
                    self.threshold, avgDist = self.neighSearch.createThresholdDist()
                    info = self.__assignLinearUnitInfo(self.threshold)
                    self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info
                    self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

                    self.kernelBand = STATS.spatialBandwidth(self.coordinates)
                    info = self.__assignLinearUnitInfo(self.kernelBand)

                if threshDefault and not bandwidthDefault:
                    #### Bandwidth Given - Distance Band Default (Report Distance Band in Bandwidth Units) ####
                    info = self.__assignLinearUnitInfo(self.kernelBand)
                    self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

                    self.threshold, avgDist = self.neighSearch.createThresholdDist()
                    info = self.__assignLinearUnitInfo(self.threshold, overwriteLinearUnit = self.kernelBand)
                    self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info

                if bandwidthDefault and not threshDefault:
                    #### Distance Band Given - Bandwidth Default (Report Bandwidth in Distance Band Units) ####
                    self.threshold, avgDist = self.neighSearch.createThresholdDist()
                    info = self.__assignLinearUnitInfo(self.threshold)
                    self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info

                    self.kernelBand = STATS.spatialBandwidth(self.coordinates)
                    info = self.__assignLinearUnitInfo(self.kernelBand, self.threshold)
                    self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

                if not threshDefault and not bandwidthDefault:
                    #### Distance Band and Kerenl Bandwidth Given by User (Don't Report) ####
                    info = self.__assignLinearUnitInfo(self.threshold)
                    self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info

                    info = self.__assignLinearUnitInfo(self.kernelBand)
                    self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

        if self.wType in [2,3] and not self.isUnweighted:
            if bandwidthDefault:
                self.kernelBand = STATS.spatialBandwidth(self.coordinates)
            info = self.__assignLinearUnitInfo(self.kernelBand)
            self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

        #### Check/Set Output Distance Band Linear Unit Info ####
        if self.distanceBand is not None:

            #### Assures that the Threshold is Appropriate ####
            threshold, maxSet = WU.checkDistanceThreshold(ssdo, self.distanceBand, weightType=self.wType)

            #### If the Threshold is Set to the Max ####
            #### Set to Zero for Script Logic ####
            if maxSet:
                #### All Locations are Related ####
                if self.numObs > 500:
                    ARCPY.AddIDMessage("Warning", 717)

            if threshold != self.distanceBand:
                #### Recreate Distance Band Info ####
                info = self.__assignLinearUnitInfo(threshold, self.userDistanceBandUnit)
                self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info

            #### Create and Report Default Threshold String ####
            self.distanceBandStr = ssdo.distanceInfo.createOutputLinearUnit(self.distanceBand, self.userDistanceBandUnit)
            if threshDefault:
                ARCPY.AddIDMessage("WARNING", 110362, self.distanceBandStr)

        #### Set Output Linear Unit Strings ####
        if self.bandwidth is not None:
            self.bandwidthStr = ssdo.distanceInfo.createOutputLinearUnit(self.bandwidth, self.userBandwidthUnit)
            if bandwidthDefault:
                ARCPY.AddIDMessage("WARNING", 110363, self.bandwidthStr)

    def __prepare_data(self):
        #### Get Data Array ####
        if not self.varDim:
            self.y = NUM.ones(self.numObs, dtype = float)
            self.doLocalStats = False
        else:
            self.y = NUM.zeros((self.numObs, self.varDim), dtype=float)
            for ind, varName in enumerate(self.varNames):
                field = self.ssdo.fields[varName]
                self.y[:, ind] = field.returnDouble(replaceNullInts = True)
            self.doLocalStats = True

        #### Check Number of Neighbors Parameter ####
        self.numNeighs = WU.getValidNumNeighs(self.numNeighs, self.ssdo.numObs, self.wType)

        #### Set Attributes ####
        self.master2Order = self.ssdo.master2Order

    def __calculate(self):
        """
        Constructs the neighborhood structure for each feature and
        dispatches the appropriate values for the calculation of the
        statistic.
        Returns
        -------

        """
        ssdo = self.ssdo
        if self.weightsFile:

            #### Using Weights File ####
            if self.swmFileBool:
                #### Open Spatial Weights and Obtain Chars ####
                swm = WU.SWMReader(self.weightsFile)
                N = swm.numObs
                rowStandard = swm.rowStandard

                #### Check to Assure Complete Set of Weights ####
                if ssdo.numObs > N:
                    ARCPY.AddIDMessage("ERROR", 842, ssdo.numObs, N)
                    raise SystemExit()
                
                #### Check if Selection Set ####
                isSubSet = False
                if ssdo.numObs < N:
                    isSubSet = True
                iterVals = UTILS.ssRange(N)
            else:
                #### Warning for GWT with Bad Records/Selection ####
                if ssdo.selectionSet or ssdo.badRecords:
                    ARCPY.AddIDMessage("WARNING", 1029)

                #### Build Weights Dictionary ####
                weightDict = WU.buildTextWeightDict(self.weightsFile, ssdo.master2Order)
                iterVals = UTILS.iterkeys(ssdo.master2Order)        
                N = ssdo.numObs

            for i in iterVals:
                if self.swmFileBool:
                    #### Using SWM File ####
                    info = swm.swm.readEntry()
                    masterID = info[0]
                    if masterID in ssdo.master2Order:
                        rowInfo = WU.getWeightsValuesSWM(info, ssdo.master2Order,
                                                         self.y, 
                                                         isSubSet = isSubSet) 
                        includeIt = True
                    else:
                        includeIt = False
                else:
                    #### Text Weights ####
                    masterID = i
                    includeIt = True
                    rowInfo = WU.getWeightsValuesText(masterID, ssdo.master2Order,
                                                      weightDict, self.y)

                #### Subset Boolean for SWM File ####
                if includeIt:
                    #### Parse Row Info ####
                    orderID, iVals, nhIDs, nhVals, sWeights = rowInfo

                    #### Assure Neighbors Exist After Selection ####
                    nn = len(nhIDs)

                    if nn:
                        #### Calculate Centroid Distances and Stats ####
                        distances = NUM.zeros(nn, dtype = float)
                        for nInd, nh in enumerate(nhIDs):
                            distances[nInd] = self.__dist(orderID, nh)
                        self.__distance_statistics(orderID, distances)

                        #### Calculate Local Stats ####
                        if self.doLocalStats:
                            values = self.y[nhIDs]
                            self.__local_statistics(orderID, values, sWeights)

                    ARCPY.SetProgressorPosition()

            if self.swmFileBool:
                swm.close()
            ARCPY.ResetProgressor()

        elif self.wType in [4, 5]:
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84129))
            #### Polygon Contiguity ####
            if self.wType == 4:
                contiguityType = "ROOK"
            else:
                contiguityType = "QUEEN"
            clearExtentPolyNeighs = UTILS.clearExtent(WU.polygonNeighborDict)
            contDict = clearExtentPolyNeighs(self.ssdo.inputFC, self.ssdo.masterField,
                                             contiguityType=contiguityType)

            ARCPY.ResetProgressor()
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220041), 0, len(self.master2Order), 1)
            for masterID in self.master2Order.keys():
                orderID, yiVal, nhIDs, nhVals, weights = WU.getWeightsValuesCont(masterID, self.master2Order,
                                                                                 contDict, self.y,
                                                                                 rowStandard=False)

                #### Calculate Centroid Distances and Stats ####
                distances = NUM.zeros(len(nhIDs), dtype = float)
                for ind, nid in enumerate(nhIDs):
                    distances[ind] = self.__dist(orderID, nid)
                self.__distance_statistics(orderID, distances)

                #### Calculate Local Stats ####
                if self.doLocalStats:
                    if self.includeSelf:
                        nhs = [orderID] + nhIDs
                    else:
                        nhs = nhIDs
                    values = self.y[nhs]
                    weights = NUM.ones(len(nhs), dtype = float)
                    self.__local_statistics(orderID, values, weights)

                ARCPY.SetProgressorPosition()
            ARCPY.ResetProgressor()

        else:
            #### Fixed Distance or KNN Using KD Tree ####
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220041), 0, self.numObs, 1)
            for orderID in range(self.numObs):
                #### Neighbor Info ####
                nhIDs = self.neighSearch.getNeighbors(orderID)

                #### Limit Number of Neighbors ####
                if len(nhIDs) > MAX_NUM_NEIGHS:
                    nhIDs = nhIDs[0:MAX_NUM_NEIGHS]

                #### Calculate Centroid Distances and Stats ####
                distances = NUM.zeros(len(nhIDs), dtype = float)
                for ind, nid in enumerate(nhIDs):
                    distances[ind] = self.__dist(orderID, nid)
                self.__distance_statistics(orderID, distances)

                #### Calculate Local Stats ####
                if self.doLocalStats:
                    if self.includeSelf:
                        nhs = NUM.array([orderID] + list(nhIDs))
                    else:
                        nhs = nhIDs
                    values = self.y[nhs]
                    if self.weightSchema != 0:
                        weights = self.__genLocalWeights(orderID, nhIDs=nhs)
                    else:
                        weights = NUM.ones(len(nhs), dtype = float)
                    self.__local_statistics(orderID, values, weights)

                ARCPY.SetProgressorPosition()

    def __dist(self, id1, id2):
        return ((self.coordinates[id1] - self.coordinates[id2]) ** 2).sum() ** 0.5

    def __distance_statistics(self, orderID, distances):

        #### Even Distance Weights ####
        nn = len(distances)

        #### Keep Track of Bad Distance Records ####
        if nn == 0:
            self.__setNullDistanceInfo(orderID)
            return

        distWeights = NUM.ones(nn, dtype = float) 
        self.baseNNeighbors[orderID] = nn

        #### Calculate Mean Distance ####
        meanDist = self.__mean(distances, distWeights)

        #### Return Mean Distance Only ####
        if self.statisticMethodInt == 0:
            self.results[self.distVarName][orderID] = meanDist
            return

        #### Calculate STD Distance ####
        stdDist = self.__std(distances, meanDist, distWeights)

        #### Return STD Distance Only ####
        if self.statisticMethodInt == 1:
            self.results[self.distVarName][orderID] = stdDist
            return

        #### Calculate Skewness Distance ####
        skewnessDist = self.__skewness(distances, meanDist, stdDist, distWeights)

        #### Return Skewness Distance Only ####
        if self.statisticMethodInt == 2:
            self.results[self.distVarName][orderID] = skewnessDist
            return

        #### Distance Stats ####
        median, iqr, qt_imbalance = self.__quantileStats(distances)

        #### Return Median Only ####
        if self.statisticMethodInt == 3:
            self.results[self.distVarName][orderID] = median
            return

        #### Return IQR Only ####
        if self.statisticMethodInt == 4:
            self.results[self.distVarName][orderID] = iqr
            return

        #### Return QT Imbalance Only ####
        if self.statisticMethodInt == 5:
            self.results[self.distVarName][orderID] = qt_imbalance
            return

        #### Append All Stats ####
        row = [meanDist, stdDist, skewnessDist, median, iqr, qt_imbalance]
        self.results[self.distVarName][orderID] = row

    def __setNullDistanceInfo(self, orderID):
        """Sets NUM.nan (NULL) for all distance results."""

        if self.statisticMethodInt == 6:
            self.results[self.distVarName][orderID] = [NUM.nan] * 6
        else:
            self.results[self.distVarName][orderID] = NUM.nan

    def __setNumNeighStats(self, orderID, values, weights):
        """Assesses attribute value NULLs and valid weight info."""

        numNeighs = values.shape[0]
        numAttrs = values.shape[1]
        nanInfo = {}
        hasNans = NUM.zeros(numAttrs, dtype = bool)
        zeroWeights = NUM.zeros(numAttrs, dtype = bool)
        for i in range(numAttrs):
            isNan = NUM.isnan(values[:, i])
            nanInfo[i] = isNan
            numNans = isNan.sum()
            hasNans[i] = numNans > 0

            subsetWeights = weights[~isNan]
            noValidRecords = len(subsetWeights) == 0
            if not noValidRecords:
                noValidRecords = UTILS.compareFloat(0.0, subsetWeights.sum())
            if noValidRecords:
                #### Not Valid Weights ####
                self.resultNNeighbors[orderID, i] = 0
                zeroWeights[i] = True
            else:
                if self.ignoreNulls:
                    self.resultNNeighbors[orderID, i] = numNeighs - numNans
                else:
                    self.resultNNeighbors[orderID, i] = numNeighs

        return numNeighs, numAttrs, nanInfo, hasNans, zeroWeights

    def __setNullInfo(self, orderID, ind_var):
        """Sets NUM.nan (NULL) for the feature's given attr results."""

        if self.statisticMethodInt == 6:
            self.results[self.varNames[ind_var]][orderID] = [NUM.nan] * 6
        else:
            self.results[self.varNames[ind_var]][orderID] = NUM.nan

    def __local_statistics_all(self, orderID, values, weights):
        #### Get Number of Neighs, Fields and NaN Info ####
        numNeighs, numAttrs, nanInfo, hasNans, zeroWeights = self.__setNumNeighStats(orderID, values, weights)

        for ind_var in range(numAttrs):
            #### Return All Nulls for Given Field if No Valid Weights ####
            if zeroWeights[ind_var]:
                self.__setNullInfo(orderID, ind_var)
                return 

            if not self.ignoreNulls and hasNans[ind_var]:
                self.__setNullInfo(orderID, ind_var)
                return 

            #### Get Valid Values ####
            vals = values[:, ind_var]
            varWeights = weights
            if hasNans[ind_var]:
                goodValues = ~nanInfo[ind_var]
                vals = vals[goodValues]
                varWeights = weights[goodValues]

            mean = self.__mean(vals, varWeights)
            std = self.__std(vals, mean, varWeights)
            skew = self.__skewness(vals, mean, std, varWeights)
            median, iqr, qt_imbalance = self.__quantileStats(vals, weights = varWeights)
            self.results[self.varNames[ind_var]][orderID] = [mean, std, skew, median, iqr, qt_imbalance]

    def __local_statistics_basic(self, orderID, values, weights):
        #### Get Number of Neighs, Fields and NaN Info ####
        numNeighs, numAttrs, nanInfo, hasNans, zeroWeights = self.__setNumNeighStats(orderID, values, weights)

        for ind_var in range(numAttrs):
            #### Return All Nulls for Given Field if No Valid Weights ####
            if zeroWeights[ind_var]:
                self.__setNullInfo(orderID, ind_var)
                return 

            if not self.ignoreNulls and hasNans[ind_var]:
                self.__setNullInfo(orderID, ind_var)
                return 

            #### Get Valid Values ####
            vals = values[:, ind_var]
            varWeights = weights
            if hasNans[ind_var]:
                goodValues = ~nanInfo[ind_var]
                vals = vals[goodValues]
                varWeights = weights[goodValues]

            mean = self.__mean(vals, varWeights)
            if self.statisticMethodInt == 0:
                self.results[self.varNames[ind_var]][orderID] = mean
            elif self.statisticMethodInt == 1:
                std = self.__std(vals, mean, varWeights)
                self.results[self.varNames[ind_var]][orderID] = std
            else:
                std = self.__std(vals, mean, varWeights)
                skew = self.__skewness(vals, mean, std, varWeights)
                self.results[self.varNames[ind_var]][orderID] = skew

    def __local_statistics_quantiles(self, orderID, values, weights):
        #### Get Number of Neighs, Fields and NaN Info ####
        numNeighs, numAttrs, nanInfo, hasNans, zeroWeights = self.__setNumNeighStats(orderID, values, weights)

        for ind_var in range(numAttrs):
            #### Return All Nulls for Given Field if No Valid Weights ####
            if zeroWeights[ind_var]:
                self.__setNullInfo(orderID, ind_var)
                return 

            if not self.ignoreNulls and hasNans[ind_var]:
                self.__setNullInfo(orderID, ind_var)
                return 

            #### Get Valid Values ####
            vals = values[:, ind_var]
            varWeights = weights
            if hasNans[ind_var]:
                goodValues = ~nanInfo[ind_var]
                vals = vals[goodValues]
                varWeights = weights[goodValues]

            median, iqr, qt_imbalance = self.__quantileStats(vals, weights = varWeights)
            if self.statisticMethodInt == 3:
                self.results[self.varNames[ind_var]][orderID] = median
            elif self.statisticMethodInt == 4:
                self.results[self.varNames[ind_var]][orderID] = iqr
            else:
                self.results[self.varNames[ind_var]][orderID] = qt_imbalance

    def __mean(self, values, weights):
        return (values * weights).sum() / weights.sum()

    def __std(self, values, mean, weights):
        return ((values - mean) ** 2 * weights).sum() ** 0.5

    def __skewness(self, values, mean, std, weights):
        if std == 0.0:
            return NUM.nan
        else:
            return NUM.cbrt(((values - mean) ** 3 * weights).sum()) / std

    def __quantileStats(self, values, weights = None):

        if weights is None or self.isUnweighted:
            quantiles = NUM.percentile(values, [25, 50, 75])
        else:
            quantiles = STATS.weighted_quantiles(values, weights = weights)

        median = quantiles[1]
        iqr = quantiles[2] - quantiles[0]
        if iqr == 0:
            qt_imbalance = NUM.nan
        else:
            qt_imbalance = (2*median - (quantiles[2] + quantiles[0]))/iqr

        return median, iqr, qt_imbalance

    def __genLocalWeights(self, targetID, nhIDs):
        weights = NUM.full(len(nhIDs), 1.0, dtype=float)

        if self.weightSchema == 0:
            return weights
        elif self.weightSchema == 1:
            #### BISQUARE ####
            for ind, nhId in enumerate(nhIDs):
                dist = self.__dist(targetID, nhId)
                if dist < self.bandwidth:
                    weights[ind] = (1 - (dist / self.bandwidth) ** 2) ** 2
                else:
                    self.beyondBandRecords.add(targetID)
                    weights[ind] = 0

        elif self.weightSchema == 2:
            #### GAUSSIAN ####
            for ind, nhId in enumerate(nhIDs):
                dist = self.__dist(targetID, nhId)
                weights[ind] = NUM.exp(-0.5 * ((dist / self.bandwidth) ** 2.0))

        return weights

    def __buildFieldName(self, candidatesDict, fieldName, template):
        fieldNameCut = fieldName[0: 10 - len(template) + 2]
        altInt = 1
        while template.format(fieldNameCut) in candidatesDict:
            appdx = "%d" % altInt
            fieldNameCut = fieldNameCut[0: len(fieldNameCut) - len(appdx)] + appdx
            altInt += 1
        return template.format(fieldNameCut)

    @staticmethod
    def buildOutputFieldsSchema(inputFCPath, inputFields, output, statisticMethod="ALL", calDistance=True):
        outputIsDGB = True
        if outputIsDGB is not None:
            outputIsDGB = UTILS.isGDB(output)

        fieldSchema = []
        fields4Expend = []
        fields = ARCPY.ListFields(inputFCPath)
        existingFieldNames = set()

        for f in fields:
            if f.name in inputFields:
                newField = ARCPY.Field()
                newField.name = f.name
                newField.type = f.type
                newField.aliasName = f.aliasName
                fieldSchema.append(newField)
                fields4Expend.append(newField)
                existingFieldNames.add(newField.name)
        if calDistance:
            newField = ARCPY.Field()
            newField.name = "DIST"
            newField.type = "DOUBLE"
            newField.aliasName = "Distance to Neighbors"
            fields4Expend = [newField] + fields4Expend

        statisticMethodInt = supportedStatisticMethods[statisticMethod.upper()]
        aliasTemplates = {
            0: "Mean for {}",
            1: "Standard deviation for {}",
            2: "Skewness for {}",
            3: "Median for {}",
            4: "Interquartile range for {}",
            5: "Quantile imbalance for {}",
        }
        fieldTemplates = {
            0: "{}_Mean",
            1: "{}_STD",
            2: "{}_SKWNS",
            3: "{}_MED",
            4: "{}_IQR",
            5: "{}_QIMBL",
        }
        numNeiAliasTemplate = "Number of neighbors for {}"
        numNeiFieldTemplate = "{}_NNBRS"

        if statisticMethodInt == 6:
            sta2append = [0, 1, 2, 3, 4, 5]
        else:
            sta2append = [statisticMethodInt]

        for field in fields4Expend:
            varNameOrigin = field.name
            aliasOrigin = field.aliasName
            for sta_ind, template_ind in enumerate(sta2append):
                alias = aliasTemplates[template_ind].format(aliasOrigin)
                template = fieldTemplates[template_ind]
                fieldNameCut = varNameOrigin[0: 10 - len(template) + 2]
                altInt = 1
                while template.format(fieldNameCut) in existingFieldNames:
                    appdx = "%d" % altInt
                    fieldNameCut = fieldNameCut[0: len(fieldNameCut) - len(appdx)] + appdx
                    altInt += 1
                name = template.format(fieldNameCut)
                newField = ARCPY.Field()
                newField.name = name
                newField.type = "DOUBLE"
                newField.aliasName = alias
                existingFieldNames.add(name)
                fieldSchema.append(newField)

            #### Add number of neighbors ####
            neighCountAlias = numNeiAliasTemplate.format(aliasOrigin)
            template = numNeiFieldTemplate
            fieldNameCut = varNameOrigin[0: 10 - len(template) + 2]
            altInt = 1
            while template.format(fieldNameCut) in existingFieldNames:
                appdx = "%d" % altInt
                fieldNameCut = fieldNameCut[0: len(fieldNameCut) - len(appdx)] + appdx
                altInt += 1
            name = template.format(fieldNameCut)
            newField = ARCPY.Field()
            newField.name = name
            newField.type = "LONG"
            newField.aliasName = neighCountAlias
            existingFieldNames.add(name)
            fieldSchema.append(newField)

        if not outputIsDGB:
            for field in fieldSchema:
                field.aliasName = field.name

        return fieldSchema

    def createOutput(self, outputFC):
        ARCPY.env.overwriteOutput = True

        #### Prepare Derived Variables for Output Feature Class ####
        outPath, outName = OS.path.split(outputFC)

        #### Create/Populate Dictionary of Candidate Fields ####
        aliasTemplates = {
            0: "Mean for {}",
            1: "Standard deviation for {}",
            2: "Skewness for {}",
            3: "Median for {}",
            4: "Interquartile range for {}",
            5: "Quantile imbalance for {}",
        }

        fieldTemplates = {
            0: "{}_Mean",
            1: "{}_STD",
            2: "{}_SKWNS",
            3: "{}_MED",
            4: "{}_IQR",
            5: "{}_QIMBL",
        }

        numNeiAliasTemplate = "Number of neighbors for {}"
        numNeiFieldTemplate = "{}_NNBRS"

        if self.statisticMethodInt == 6:
            sta2append = [0, 1, 2, 3, 4, 5]
        else:
            sta2append = [self.statisticMethodInt]
        candidateFields = {}
        fieldOrder = []

        self.symbolField = None
        self.symbolAlias = None
        self.symbolData = None

        allVarNames = self.varNames + [self.distVarName]
        for res_ind, varName in enumerate(allVarNames):
            useDist = False
            if varName == self.distVarName:
                varNameOrigin = "DIST"
                aliasOrigin = "Distance to Neighbors"
                useDist = True
            else:
                varNameOrigin = self.varNames[res_ind]
                aliasOrigin = self.ssdo.fields[varNameOrigin].alias

            for sta_ind, template_ind in enumerate(sta2append):
                data = self.results[varName][:, sta_ind]
                alias = aliasTemplates[template_ind].format(aliasOrigin)
                fieldName = self.__buildFieldName(candidateFields, varNameOrigin, fieldTemplates[template_ind])
                candidateField = SSDO.CandidateField(fieldName, "DOUBLE", data, alias = alias,
                                                     checkNullValues = True)
                candidateFields[fieldName] = candidateField
                fieldOrder.append(fieldName)
                if self.symbolField is None:
                    self.symbolField = fieldName
                    self.symbolAlias = alias
                    self.symbolData  =data

            #### Add number of neighbors ####
            if useDist:
                neighCountData = self.baseNNeighbors
            else:
                neighCountData = self.resultNNeighbors[:, res_ind]
            neighCountAlias = numNeiAliasTemplate.format(aliasOrigin)
            neighCountFieldName = self.__buildFieldName(candidateFields, varNameOrigin, numNeiFieldTemplate)
            neighCountField = SSDO.CandidateField(neighCountFieldName, "LONG", neighCountData,
                                                  alias = neighCountAlias)
            candidateFields[neighCountFieldName] = neighCountField
            fieldOrder.append(neighCountFieldName)

        #### Write Data to Output Feature Class ####
        #if self.wType == 3:
        #    #### For DELAUNAY_TRIANGULATION, export Thiessen Polygons to replace the points####
        #    inMemoryFC = "in_memory/LSSThiessenPolygonsTempFC"
        #    ARCPY.CreateThiessenPolygons_analysis(self.ssdo.inputFC, inMemoryFC, "ALL")
        #    ssdoThiessenPolygons = SSDO.SSDataObject(inMemoryFC)
        #    #### Set Unique ID Field ####
        #    masterField = UTILS.setUniqueIDField(ssdoThiessenPolygons, weightsFile=self.weightsFile)
        #    #### Populate SSDO with Data ####
        #    ssdoThiessenPolygons.obtainData(masterField, self.varNames, minNumObs=3,
        #                    warnNumObs=30)

        #    ssdoThiessenPolygons.output2NewFC(outputFC, candidateFields,
        #                           appendFields=self.varNames, fieldOrder=fieldOrder)
        #else:
        self.ssdo.output2NewFC(outputFC, candidateFields,
                               appendFields=self.varNames, fieldOrder=fieldOrder)

    def createSymology(self):
        import SSCubeUtilities as CUTIL
        if self.symbolField is None:
            return None
        colors = ['201, 245, 255',
                  '145, 218, 245',
                  '93, 182, 236',
                  '45, 141, 226',
                  '0, 94, 217']
        shapeType = self.ssdo.shapeType.upper()
        if self.wType == 3:
            shapeType = "POLYGON"
        symbolStr = CUTIL.generateForecatingSymbology(
            self.symbolData, self.symbolField, self.symbolAlias, shapeType, colors=colors)
        return symbolStr
