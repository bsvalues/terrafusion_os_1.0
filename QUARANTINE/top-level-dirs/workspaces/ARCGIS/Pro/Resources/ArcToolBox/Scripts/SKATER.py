# coding: utf-8
"""
Tool Name: Spatially Constrained Multivariate Clustering
Source Name: SKATER.py
Version: ArcGIS Pro 2.1
Author: ESRI

This tool performs constrained aggregative clustering based on
a minimum spanning tree algorithm (SKATER):

Source:
R. M. Assuncao, M. C. Neves, G. Camara and C. d. C. Frietas, 2006
Efficient regionalisation techniques for socio-economic geographical units
using minimum spanning trees.
"International Journal of Geographical Information Science"
"""

################### Imports ########################
import sys as SYS
import os as OS
import numpy as NUM
import numpy.random as RAND
import arcgisscripting as ARC
import arcpy as ARCPY
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import Stats as STATS
import WeightsUtilities as WU
import gapy as GAPY

################ Output Field Names #################
clusterFieldName = "CLUSTER_ID"
clusterAliasName = "Cluster ID"
probFieldName = "MEM_PROB"
probAliasName = ARCPY.GetIDMessage(84789)

optimizedFieldNames = ["NUM_GROUPS", "PSEUDO_F"]

##################### Globals ########################
defaultKLimit = 30
skaterShape2Layer = {"POINT": "MultiVarClusterPoints.lyrx",
                     "POLYGON": "MultiVarClusterPolygons.lyr"}
pointSpaceTypes = ["TRIMMED_DELAUNAY_TRIANGULATION",
                   "GET_SPATIAL_WEIGHTS_FROM_FILE"]

################## Helper Functions ##################
numSep = ";"

def getCentroid(x, partIDs):
    return x[partIDs].mean(0)

def dist2Centroid(x, centroid, partIDs = None):
    if partIDs:
        x = x[partIDs]
    dist = ((x - centroid)**2.0).sum(1)
    return dist

def varDist2Centroid(x, centroid, partIDs = None):
    if partIDs:
        x = x[partIDs]
    dist = ((x - centroid)**2.0).sum(0)
    return dist

class SKATER(object):
    """Traditional k-means classification algorithm:
    
    INPUTS: 
    ssdo (obj): instance of SSDataObject
    weightsFile {str, None}: path to a spatial weights matrix file
    concept: {str, EUCLIDEAN}: EUCLIDEAN or MANHATTAN 
    numNeighs {long, None}: if space concept is K_NEAREST_NEIGHBORS
    """

    def __init__(self, ssdo, varNames, spaceConcept = "TRIMMED_DELAUNAY_TRIANGULATION", 
                 distConcept = "EUCLIDEAN", numNeighs = None, weightsFile = None,
                 kPartitions = None, sumField = None, minNumFeatures = None, 
                 maxNumFeatures = None, minNumValues = None, maxNumValues = None,
                 permutations = 0, outputTable = None):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Remove Max Constraint if Permutations ####
        if self.permutations:
            maxNumValues = None
            maxNumFeatures = None

        #### Set Optimized Info ####
        self.optimizeGroups = False
        noneK = self.kPartitions is None
        if maxNumValues or maxNumFeatures:
            #### Set Output Table to None to Not Run Optimized ####
            self.outputTable = None

            #### Optimized Not Allow For Max Solves ####
            if self.kPartitions is None:
                self.kPartitions = 5
            self.kLimit = -1
        else:
            if self.outputTable is not None or noneK:
                self.optimizeGroups = True
                self.kLimit = defaultKLimit
                if noneK:
                    self.kPartitions = -1
            else:
                self.kLimit = -1
                if noneK:
                    self.kPartitions = 5

        #### Set Additional Constraint Info ####
        self.endogenousK = False
        self.assessMinMaxBool = False
        negMax = UTILS.shpFileNull['DOUBLE']
        self.doMinValues = False
        self.doMaxValues = False
        self.doMinFeatures = False
        self.doMaxFeatures = False
        if self.sumField is not None:
            #### Set Feature Count to Default ####
            self.minNumFeatures = None
            self.maxNumFeatures = None

            #### Set Default Value Constraints ####
            if self.minNumValues is None:
                self.minNumValues = negMax
            else:
                self.minNumValues = float(self.minNumValues)
                self.doMinValues = True

            if self.maxNumValues is None:
                self.maxNumValues = negMax
            else:
                self.maxNumValues = float(self.maxNumValues)
                self.endogenousK = True
                self.doMaxValues = True

            #### Set Values ####
            self.sumFieldValues = ssdo.fields[sumField].returnDouble()

            #### Whether to Assess Splits For Noise Cluster ####
            if self.minNumValues is not None and self.maxNumValues is not None:
                self.assessMinMaxBool = True
        else:
            self.minNumValues = negMax
            self.maxNumValues = negMax
            self.sumFieldValues = None

        if self.minNumFeatures is None:
            self.minNumFeatures = -1
        else:
            self.minNumFeatures = int(self.minNumFeatures)
            self.doMinFeatures = True

        if self.maxNumFeatures is None:
            self.maxNumFeatures = -1
        else:
            self.maxNumFeatures = int(self.maxNumFeatures)
            self.endogenousK = True
            self.doMaxFeatures = True

        #### Whether to Assess Splits For Noise Cluster ####
        if self.minNumFeatures != -1 and self.maxNumFeatures != -1:
            self.assessMinMaxBool = True

        #### Assure Number of Groups/Features is Possible ####
        if self.kPartitions >= ssdo.numObs:
            ARCPY.AddIDMessage("ERROR", 110131)
            raise SystemExit()

        #### Set Group Limit ####
        if self.optimizeGroups:
            if self.kPartitions != -1:
                self.kLimit = int(NUM.max([self.kLimit, self.kPartitions]))

            #### Assure kLimit Does Not Exceed Num Features ####
            if self.kLimit >= ssdo.numObs:
                self.kLimit = ssdo.numObs - 1

        if self.endogenousK:
            self.permutations = 0

        #### Do Permutations? ####
        self.doPermutations = self.permutations > 0

        #### Assess Whether SWM File Being Used and Validate ####
        self.swmFileBool = False 
        self.weightsBool = False
        useWeightsFile = spaceConcept == "GET_SPATIAL_WEIGHTS_FROM_FILE"
        if weightsFile:
            if not useWeightsFile:
                ARCPY.AddIDMessage("WARNING", 925)
                weightsFile = None
            else:
                weightSuffix = weightsFile.split(".")[-1].lower()
                self.swmFileBool = (weightSuffix == "swm")
                self.weightsBool = True

        if useWeightsFile and weightsFile is None:
            ARCPY.AddIDMessage("ERROR", 930)
            raise SystemExit()

        #### Initialize Data ####
        self.organizeData()
        self.silentUnique = False
        self.silentMax = False

        #### Check Minimum Feature Constraint ####
        if self.minNumFeatures != -1:
            total = self.kPartitions * self.minNumFeatures
            if total > self.ssdo.numObs:
                ARCPY.AddIDMessage("ERROR", 110122)
                raise SystemExit()

        #### Check Maximum Value Constraint ####
        if self.maxNumValues != negMax:
            if (self.ssdo.fields[sumField].returnDouble() > self.maxNumValues).sum():
                ARCPY.AddIDMessage("ERROR", 110122)
                raise SystemExit()

        #### Find Feasible Solution(s) ####
        if self.optimizeGroups:
            self.optimizeSpatial()
        else:
            self.minSpanTree()
            self.createMST()
            self.spatialSolve()

    def optimizeSpatial(self):
        ARCPY.AddMessage(ARCPY.GetIDMessage(84763))

        #### Spatial Optimization ####
        self.minSpanTree()
        self.createMST()
        self.spatialSolve(optimize = True)

        #### Report Highest Pseudo-F (Spatial) ####
        self.fStatInfo = summarizeFStats(self.fStatRes, self.groupList)

    def organizeData(self):
        """Organizes the data for the partitioning algorithms.
        """

        #### Shorthand Attributes ####
        ssdo = self.ssdo

        #### Remove Any Variables With No Variation ####
        self.badVarNames = []
        for varName in self.varNames:
            vVar = ssdo.fields[varName].returnDouble().var()
            if NUM.isnan(vVar) or vVar <= 0.0:
                self.badVarNames.append(varName)

        numBadVars = len(self.badVarNames)
        numInitVars = len(self.varNames)
        if numBadVars == numInitVars:
            #### All Fields Have No Variance ####
            ARCPY.AddIDMessage("ERROR", 1203)
            raise SystemExit()

        if numBadVars:
            badS = ", ".join(self.badVarNames)
            nBad = str(numBadVars)
            nInit = str(numInitVars)
            ARCPY.AddIDMessage("WARNING", 1204, nBad, nInit)
            ARCPY.AddIDMessage("WARNING", 1209, badS)
            for varName in self.badVarNames:
                self.varNames.remove(varName)

        #### Create Design Matrix ####
        self.n = self.ssdo.numObs
        self.k = len(self.varNames)
        self.x = NUM.zeros((self.n, self.k), dtype = float)
        for column, varName in enumerate(self.varNames):
            self.x[:,column] = ssdo.fields[varName].returnDouble()

        self.z = STATS.zTransform(self.x)
        self.zMean = self.z.mean(0)
        ss = dist2Centroid(self.z, self.zMean)
        self.SST = ss.sum()
        self.varSST = varDist2Centroid(self.z, self.zMean)

        #### Calculate Global AIC ####
        self.globalAIC = 2. + ((self.ssdo.numObs * 1.) * \
                         NUM.log(self.SST) / self.ssdo.numObs) 

    def randomizeZ(self, groups):
        #### Permuate Z Within Groups ####
        for group in range(self.kPartitions):
            w = groups == group
            Zw = self.z[w]
            pw = RAND.permutation(Zw)
            self.z[w] = pw

    def randomizeZW(self, groups):
        #### Permuate Z Within Groups ####
        for group in range(self.kPartitions):
            w = groups == group
            Zw = self.z[w]
            pw = RAND.permutation(Zw)
            self.z[w] = pw

        #### Recalculate Weights ####
        c = 0
        for head, tail in self.links:
            self.weights[c] = ((self.z[head] - self.z[tail])**2.0).sum()

    def minSpanTree(self):
        #### Shorthand Attributes ####
        ssdo = self.ssdo
        weightsFile = self.weightsFile
        master2Order = ssdo.master2Order
        masterField = self.ssdo.masterField
        numObs = self.ssdo.numObs
        self.partition = NUM.zeros((numObs,), NUM.int32)
        if self.numNeighs is None:
            knn = 0
        else:
            knn = self.numNeighs

        #### Keep Track of Features with No Neighbors ####
        self.numFeatures = 0
        self.idsNoNeighs = []
        links = []
        weights = []

        contTypes = ['CONTIGUITY_EDGES_ONLY', 'CONTIGUITY_EDGES_CORNERS']
        if self.spaceConcept in contTypes:
            #### Use Polygon Neighbor Tool ####
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84126))

            #### Get Unique ID Index ####
            if ssdo.masterField == ssdo.oidName:
                masterIndex = 0
            else:
                masterIndex = 2

            #### Create Nearest Neighbor Search Type For Islands ####
            gaTable = self.ssdo.gaTable
            if knn > 0:
                gaSearch = GAPY.ga_nsearch(gaTable)
                concept, gaConcept = WU.validateDistanceMethod('EUCLIDEAN',
                                                      self.ssdo.spatialRef)
                gaSearch.init_nearest(0.0, knn, gaConcept)
                forceNeighbor = True
                neighSearch = ARC._ss.NeighborSearch(gaTable, gaSearch) 
            else:
                forceNeighbor = False
                neighSearch = None

            #### Keep Track of Contiguity ####
            if self.spaceConcept == 'CONTIGUITY_EDGES_ONLY':
                contiguityType = "ROOK"
            else:
                contiguityType = "QUEEN"

            #### Create Polygon Neighbors ####
            polyNeighborDict = WU.polygonNeighborDict(self.ssdo.inputFC, 
                                                            masterField, 
                                        contiguityType = contiguityType)

            #### Keep Track of Polygons w/o Neighbors ####
            islandPolys = []
            
            #### Write Polygon Contiguity to SWM File ####
            featureCount = 0
            for orderID in UTILS.ssRange(self.ssdo.numObs):
                rowInfo = gaTable[orderID]
                oid = rowInfo[0]
                masterID = rowInfo[masterIndex]
                #neighs = polyNeighborDict[masterID] 
                neighs = [i for i in polyNeighborDict[masterID] if i in self.ssdo.master2Order]
                nn = len(neighs)
                if forceNeighbor:
                    if not nn:
                        #### Only Force KNN If Specified & No Neighbors ####
                        #### This Differs From SWM with KNN Set to Num Neighs ####
                        islandPolys.append(oid)
                        flag = True
                        knnNeighs = neighSearch[orderID]
                        c = 0
                        while flag:
                            try:
                                neighID = gaTable[knnNeighs[c]][masterIndex]
                                if neighID not in neighs:
                                    neighs.append(neighID)
                                    nn += 1
                                    if nn == knn:
                                        flag = False
                                c += 1
                            except:
                                flag = False

                finalNN = len(neighs)
                if finalNN:
                    iVals = self.z[orderID]
                    featureCount += 1
                    for nh in neighs:
                        neighOrderID = self.ssdo.master2Order[nh]
                        jVals = self.z[neighOrderID]
                        dist = ((iVals - jVals)**2.0).sum()
                        links.append((orderID, neighOrderID))
                        weights.append(dist)
                else:
                    self.addNoNeighbor(masterID, orderID)

            self.numFeatures = featureCount
                
            #### Report on Features with No Neighbors ####
            countIslands = len(islandPolys)
            if countIslands:
                islandPolys.sort()
                if countIslands > 30:
                    islandPolys = islandPolys[0:30]
                
                ERROR.warningNoNeighbors(self.ssdo.numObs, countIslands, islandPolys, 
                                         ssdo.oidName, forceNeighbor = forceNeighbor, 
                                         contiguity = True)

        elif self.spaceConcept == "GET_SPATIAL_WEIGHTS_FROM_FILE":
            #### Using Weights File ####
            if self.swmFileBool:
                #### Open Spatial Weights and Obtain Chars ####
                swm = WU.SWMReader(weightsFile)
                N = swm.numObs
                rowStandard = swm.rowStandard
                self.swm = swm

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
                weightDict = WU.buildTextWeightDict(weightsFile, master2Order)
                iterVals = UTILS.iterkeys(master2Order)        
                N = ssdo.numObs

            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84322), 0, N, 1)
            for i in iterVals:
                if self.swmFileBool:
                    #### Using SWM File ####
                    info = swm.swm.readEntry()
                    masterID = info[0]
                    if masterID in master2Order:
                        rowInfo = WU.getWeightsValuesSWM(info, master2Order,
                                                         self.z, 
                                                         isSubSet = isSubSet) 
                        includeIt = True
                    else:
                        includeIt = False
                else:
                    #### Text Weights ####
                    masterID = i
                    includeIt = True
                    rowInfo = WU.getWeightsValuesText(masterID, master2Order,
                                                      weightDict, self.z)

                #### Subset Boolean for SWM File ####
                if includeIt:
                    #### Parse Row Info ####
                    orderID, iVals, nhIDs, nhVals, sWeights = rowInfo

                    #### Assure Neighbors Exist After Selection ####
                    nn = len(nhVals)

                    if nn:
                        self.numFeatures += 1
                        for neigh in UTILS.ssRange(nn):
                            nhInt = int(nhIDs[neigh])
                            links.append((orderID, nhInt))
                            jVals = nhVals[neigh]
                            dist = ((iVals - jVals)**2.0).sum()
                            weights.append(dist)

                    else:
                        #### No Neighbors ####
                        self.addNoNeighbor(masterID, orderID)

                ARCPY.SetProgressorPosition()

            #### Clean Up ####
            if self.swmFileBool:
                swm.close()

        else:
            #### Using Trimmed Delaunay Neighbor Searching ####
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84143)) 

            #### Check/Warn/Report/Map Coincident Points ####
            numCoincident = self.ssdo.numObs - self.ssdo.numUnique

            if numCoincident:
                #### Warning ####
                coinSum = (self.ssdo.counts != 1).sum()
                ARCPY.AddIDMessage("WARNING", 110124, str(coinSum), str(self.ssdo.numObs))

                #### Report ####
                ARCPY.AddMessage(self.ssdo.createCoincidentReport())

                #### Get Coincident Point Mapping ####
                coinKeys, coinMap = STATS.mapFromUniqueCounts(self.ssdo.xyCoords, 
                                                              self.ssdo.counts)

                #### Pass In Unique XY Only ####

            else:
                coinKeys = None
                coinMap = None

            #### Get Neighborhood ####
            trimDel = ARC._ss.delaunay_point_neighbors(self.ssdo.xyCoords, 
                                                       self.ssdo.spatialRef,
                                                       coinKeys, coinMap)

            #### Check/Add for No Neighs ####
            trimDel = WU.addNoNeighs2Delaunay(self.ssdo.xyCoords, self.ssdo.uniqueXY,
                                              trimDel)

            #### Find Fixed Distance Neighbors ####
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84756), 
                                0, self.ssdo.numObs, 1)

            for orderID in UTILS.ssRange(self.ssdo.numObs):
                iVals = self.z[orderID]
                nhs = trimDel[orderID]
                for nh in nhs:
                    jVals = self.z[nh]
                    dist = ((iVals - jVals)**2.0).sum()
                    links.append((orderID, nh))
                    weights.append(dist)

                ARCPY.SetProgressorPosition()

        self.numFeatures = self.ssdo.numObs
        self.links = NUM.array(links)
        self.weights = NUM.array(weights)

    def createMST(self):

        mst, weights, clusterMap, count = ARC._ss.min_span_tree(self.links,
                                                              self.weights,
                                                          self.ssdo.numObs)
        self.mst = mst
        self.clusterMap = clusterMap
        self.count = count

    def setNullValue(self, orderID):
        """Set no neighbor data for a given feature (1).
        
        INPUTS:
        orderID (int): order in corresponding numpy value arrays
        
        NOTES:
        (1)   The no neighbor result differs for shapefiles as it has no NULL
              value capabilities.  
        """

        self.partition[orderID] = -10000

    def addNoNeighbor(self, masterID, orderID):
        """Accounting for features with no neighbors.
        
        INPUTS:
        masterID (int): unique ID value that has no neighbors
        orderID (int): order in corresponding numpy value arrays
        """

        self.idsNoNeighs.append(masterID)
        self.setNullValue(orderID)

    def spatialSolve(self, optimize = False):
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84781))
        self.skater = ARC._ss.CSKATER(self.mst, self.clusterMap, self.z,
                                     self.count, self.kPartitions, self.sumFieldValues, 
                                     self.minNumValues, self.maxNumValues,
                                     self.minNumFeatures, self.maxNumFeatures,
                                     self.kLimit)

        if not self.skater.can_solve:
            #### Can't Solve Due to Too Many Disconnected Regions ####
            raise SystemExit()

        self.skater.solve()

        if not self.skater.can_solve:
            #### Can't Solve Due to Constraints ####
            raise SystemExit()

        #self.diff = self.time_solve + self.time_build

        if self.optimizeGroups:
            minNumClusters = self.skater.starting_k
            if minNumClusters == 1:
                minNumClusters += 1
            maxNumClusters = self.skater.k_limit + 1
            numBreaks = maxNumClusters - minNumClusters
            self.fStatRes = NUM.zeros((numBreaks,), dtype = float)
            self.groupList = list(NUM.arange(minNumClusters, maxNumClusters, 
                                  dtype = NUM.int32))
            for ind, k in enumerate(self.groupList):
                #### Get/Report FStat
                R2, fStat = self.skater.get_fstat_info(int(k))
                if UTILS.compareFloat(fStat, -9999.):
                    try:
                        fStat = self.fStatRes[ind-1] + 1.0
                    except:
                        pass
                self.fStatRes[ind] = fStat

            #### Set Number of Groups ####
            self.kPartitions = self.skater.num_partitions

        #### Complete ####
        self.finalizeSolution(self.skater.get_solution())

    def finalizeSolution(self, solution):
        """Sets the final group numbers to the features."""
        #### Assign Partitions ####
        self.partition = solution
        self.partitionOutput = self.partition + 1
        self.setStatistics(self.partition)

        #### Warn of Disconnected Group(s) ####
        if NUM.any(self.partition == -10000):
            ARCPY.AddIDMessage("WARNING", 110139)

    def setStatistics(self, solution):

        #### Get Unique Region IDs and Number of Groups ####
        if self.endogenousK:
            self.kPartitions = self.partitionOutput.max()
            ARCPY.AddIDMessage("WARNING", 110125, str(self.kPartitions))
            if self.kPartitions < 2:
                ARCPY.AddIDMessage("ERROR", 110122)
                raise SystemExit()

        self.varSSE = NUM.zeros((self.kPartitions, self.k))
        groups = NUM.unique(solution)
        if groups[0] == -10000:
            groups = groups[1:]
        numGroups = len(groups)
        self.numGroups = numGroups

        #### Create Global Values ####
        self.meanVals = self.x.mean(0)
        self.stdVals = self.x.std(0)
        self.minVals = self.x.min(0)
        self.maxVals = self.x.max(0)
        self.globalXDist = dist2Centroid(self.x, self.meanVals)
        globalXSum = self.globalXDist.sum()
        self.globalSTD = NUM.sqrt(globalXSum / self.numFeatures)

        #### Create Group Means ####
        self.globalRange = self.maxVals - self.minVals
        self.groupMeans = NUM.empty((numGroups, self.k), float)
        self.groupMeansZ = NUM.empty((numGroups, self.k), float)
        self.groupSTD = NUM.empty((numGroups, self.k), float)
        self.groupSSDZ = NUM.empty((numGroups,), float)
        self.groupSSDX = NUM.empty((numGroups,), float)
        self.groupMin = NUM.empty((numGroups, self.k), float)
        self.groupMax = NUM.empty((numGroups, self.k), float)
        self.groupRange = NUM.empty((numGroups, self.k), float)
        self.groupProp = NUM.zeros((numGroups, self.k), float)
        self.groupCount = NUM.empty((numGroups,), int)
        self.groupSTDDiff = NUM.empty((numGroups,), float)

        #### Min Max Combo Constraint Checker for Pop ####
        sumFieldBool = False
        if self.assessMinMaxBool and self.sumField is not None:
            self.groupSums = NUM.zeros((numGroups,), float)
            sumFieldBool = True
            
        SSE = 0.0
        SSR = 0.0
        nc = numGroups * 1.0
        n = self.numFeatures

        for group in UTILS.ssRange(numGroups):
            groupInd = NUM.where(solution == group)
            centroid = getCentroid(self.z, groupInd)
            groupX = self.x[groupInd]
            nGroup = len(groupInd[0])
            self.groupCount[group] = nGroup
            self.groupMeans[group] = groupX.mean(0)
            self.groupMeansZ[group] = centroid
            self.groupSTD[group] = groupX.std(0)
            gMin = groupX.min(0)
            gMax = groupX.max(0)
            gRange = gMax - gMin
            self.groupMin[group] = gMin
            self.groupMax[group] = gMax
            self.groupRange[group] = gRange
            nonZeroInds = gRange.nonzero() 
            for ind in nonZeroInds[0]:
                self.groupProp[group][ind] = gRange[ind]/self.globalRange[ind]

            #### Min Max Combo with Pop ####
            if sumFieldBool:
                self.groupSums[group] = self.sumFieldValues[groupInd].sum()

            distZ = dist2Centroid(self.z, centroid, partIDs = groupInd)
            distX = dist2Centroid(self.x, self.groupMeans[group], 
                                  partIDs = groupInd)
            fSSD = varDist2Centroid(self.z, centroid, partIDs = groupInd)
            distSum = distZ.sum()
            SSE += distSum
            SSR += (nGroup * 1.0) * ((centroid - self.zMean)**2.0).sum()
            distXSum = distX.sum()
            stdDist = NUM.sqrt((distXSum / nGroup))
            self.groupSTDDiff[group] = stdDist
            self.varSSE[group] = fSSD
            self.groupSSDZ[group] = distSum
            self.groupSSDX[group] = distXSum

        #### Check/Warn Min Max Combo Constraints ####
        if self.assessMinMaxBool:
            if sumFieldBool:
                if self.doMinValues and self.doMaxValues: 
                    w = NUM.where(NUM.logical_or(NUM.less(self.groupSums, self.minNumValues), 
                                  NUM.greater(self.groupSums, self.maxNumValues)))[0]
                else:
                    if self.doMinValues:
                        w = NUM.where(self.groupSums < self.minNumValues)[0]
                    else:
                        w = NUM.where(self.groupSums > self.maxNumValues)[0]
            else:
                if self.doMinFeatures and self.doMaxFeatures:
                    w = NUM.where(NUM.logical_or(NUM.less(self.groupCount, self.minNumFeatures), 
                                  NUM.greater(self.groupCount, self.maxNumFeatures)))[0]
                else:
                    if self.doMinFeatures:
                        w = NUM.where(self.groupCount < self.minNumFeatures)[0]
                    else:
                        w = NUM.where(self.groupCount > self.maxNumFeatures)[0]

            numBad = len(w)
            if numBad:
                badGroups = [str(i + 1) for i in w]
                badGroupStr = ", ".join(badGroups)
                ARCPY.AddIDMessage("WARNING", 110146, badGroupStr)

        #### R2 and Pseudo f-Statistic ####
        self.withinSS = SSE
        self.betweenSS = SSR
        self.totalSS = self.SST
        self.R2 = (self.SST - SSE) / self.SST
        if UTILS.compareFloat(self.R2, 1.0):
            self.fStat = NUM.nan
        else:
            self.fStat = (self.R2 / (nc - 1)) / ((1 - self.R2) / (n - nc))

        #### Varwise R-Squared ####
        self.varR2 = (self.varSST - self.varSSE.sum(0)) / self.varSST
        self.globalZDistSum = self.groupSSDZ.sum()

    def report(self, fileName = None, optimal = False):
        import matplotlib as MPL
        import SSReport as REPORT
        import matplotlib.gridspec as GRIDSPEC

        #### Start Table Info ####
        header = ARCPY.GetIDMessage(84268)
        varLabel = ARCPY.GetIDMessage(84068)
        groupLabel = ARCPY.GetIDMessage(84398)
        meanLabel = ARCPY.GetIDMessage(84261)
        stdLabel = ARCPY.GetIDMessage(84262)
        minLabel = ARCPY.GetIDMessage(84271)
        maxLabel = ARCPY.GetIDMessage(84272)
        r2Label = ARCPY.GetIDMessage(84018)

        varWiseLabels = [varLabel, meanLabel, stdLabel, 
                         minLabel, maxLabel, r2Label]

        #### Sort by R2 ####
        sortedIndices = self.varR2.argsort()
        sortedIndices = list(reversed(sortedIndices))

        results = [ varWiseLabels ]
        for varInd in sortedIndices:
            rowRes = [self.meanVals[varInd], self.stdVals[varInd],
                      self.minVals[varInd], self.maxVals[varInd],
                      self.varR2[varInd]]
            rowRes = [ UTILS.formatValue(i) for i in rowRes ]
            varName = self.varNames[varInd]
            rowRes = [varName] + rowRes
            results.append(rowRes)

        self.resTable = UTILS.outputTextTable(results, header = header,
                                              justify = "right", pad = 1, force2Txt=False)
        ARCPY.AddMessage(self.resTable)

    def createOutput(self, outputFC):
        ARCPY.env.overwriteOutput = True

        #### Prepare Derived Variables for Output Feature Class ####
        outPath, outName = OS.path.split(outputFC)
        partFieldName = ARCPY.ValidateFieldName(clusterFieldName, outPath)
        fieldOrder = [partFieldName]

        #### Create/Populate Dictionary of Candidate Fields ####
        candidateFields = {}
        candidateField = SSDO.CandidateField(partFieldName, "LONG", self.partitionOutput,
                                             alias = clusterAliasName)
        candidateFields[partFieldName] = candidateField

        #### Add Prob Field ####
        if self.doPermutations:
            candidateField = SSDO.CandidateField(probFieldName, "DOUBLE", self.probabilities,
                                                 alias = probAliasName)
            candidateFields[probFieldName] = candidateField

        #### Add Analysis/Sum Fields ####
        appendFields = self.varNames
        if self.sumField:
            if self.sumField not in appendFields:
                appendFields.append(self.sumField)
        appendFields += self.badVarNames

        #### Add Date-Time Field If Applicable ####
        if self.swmFileBool:
            if self.swm.wType == 9:
                if self.swm.timeField.upper() in self.ssdo.allFields:
                    appendFields.insert(0, self.swm.timeField.upper())

        #### Write Data to Output Feature Class ####
        self.ssdo.output2NewFC(outputFC, candidateFields, 
                               appendFields = appendFields,
                               fieldOrder = fieldOrder)

        if self.outputTable is not None:
            #### Set Progressor ####
            ARCPY.AddMessage(ARCPY.GetIDMessage(84008))
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84008))
            outPath, outName = OS.path.split(self.outputTable)

            #### Set Up Field Names and Types ####
            inputFields = UTILS.getFieldNames(optimizedFieldNames, outPath)
            inputTypes = ["LONG", "DOUBLE"]

            #### Create Box Plot Table ####
            inputData = []
            for ind, k in enumerate(self.groupList):
                inputData.append( (k, self.fStatRes[ind]))

            #### Write Coefficient Table ####
            UTILS.createOutputTable(self.outputTable, inputFields,
                                    inputTypes, inputData)

    def getEvidenceProbs(self):
        #### Make Zero Weights, Close to but NOT Zero ####
        nonZeroW = self.weights == 0
        if nonZeroW.sum():
            self.weights[nonZeroW] = .00000001

        #### Get Unique Links ####
        links, weights = uniqueLinks(self.links, self.weights)
        inv_weights = 1. / weights

        #### Get Random Seed and Thread Info ####
        randSeed = UTILS.getRandomSeed()
        numThreads = UTILS.getNumberOfThreadsDefault()

        #### Warn for Computation Time ####
        if (self.ssdo.numObs > 3000):
            ARCPY.AddIDMessage("WARNING", 110149)

        #### Gather Evidence ####
        self.probabilities = ARC._ss.get_prim_evidence(self.partition, links, inv_weights,
                                                       self.z, self.kPartitions, 
                                                       self.sumFieldValues, self.minNumValues, 
                                                       self.minNumFeatures, 
                                                       simulations = self.permutations, 
                                                       random_seed = randSeed,
                                                       num_threads = numThreads)

def summarizeFStats(fStatRes, groupList):
    maxInd = fStatRes.argmax()
    maxFStat = fStatRes[maxInd]
    maxGroup = groupList[maxInd]
    maxFOut = UTILS.formatValue(maxFStat, "%0.4f")
    maxVals = (numSep, maxGroup, maxFOut)
    ARCPY.AddMessage(UTILS.outputBulletList(
        [ARCPY.GetIDMessage(84762).format(maxGroup)], force2Txt=False))

    return maxInd, maxGroup, maxFStat

def uniqueLinks(in_links, in_weights):
    links = []
    weights = []
    link_map = set([])
    for ind, link in enumerate(in_links):
        i,j = link
        if ((j,i) not in link_map):
            link_map.add((i,j))
            links.append((i,j))
            weights.append(in_weights[ind])

    return NUM.array(links, dtype = NUM.int32), NUM.array(weights, dtype = float)
