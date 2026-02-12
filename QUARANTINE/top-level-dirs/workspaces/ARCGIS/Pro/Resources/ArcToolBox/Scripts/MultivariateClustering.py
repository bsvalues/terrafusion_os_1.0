# coding: utf-8
"""
Tool Name:  Multivariate Clustering
Source Name: MultivariateClustering.py
Version: ArcGIS Pro 2.1
Author: ESRI

This tool performs constrained aggregative clustering based on traditional
k-means.
"""

################### Imports ########################
import sys as SYS
import os as OS
import numpy as NUM
import numpy.random as RAND
import arcgisscripting as ARC
import arcpy as ARCPY
import SSUtilities as UTILS
import SSDataObject as SSDO
import Stats as STATS
import WeightsUtilities as WU

################ Output Field Names #################
clusterFieldNames = ["CLUSTER_ID", "IS_SEED"]
clusterAliasNames = ["Cluster ID", "Is Seed"]

optimizedFieldNames = ["NUM_GROUPS", "PSEUDO_F"]

##################### Globals ########################
defaultKLimit = 30
aSpatialOptimizeIters = 10
aSpatialIters = 100
kMeansShape2Layer = {"POINT": "MultiVarClusterPoints.lyrx",
                     "MULTIPOINT": "MultiVarClusterPoints.lyrx",
                     "POLYGON": "MultiVarClusterPolygons.lyr",
                     "POLYLINE": "MultiVarClusterLines.lyrx"}

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

def execute(parameters, messages):

    #### User Defined Inputs ####
    inputFC = parameters[0].valueAsText
    outputFC = parameters[1].valueAsText

    #### Analysis Fields ####
    analysisFields = parameters[2].valueAsText
    analysisFields = analysisFields.split(";")
    analysisFields = [ i.upper() for i in analysisFields ]
    fieldList = [ i for i in analysisFields ]

    #### Clustering Method ####
    clusterMethod = UTILS.getTextParameter(3, parameters)
    if clusterMethod not in ['K_MEANS', 'K_MEDOIDS']:
        clusterMethod = 'K_MEANS'

    #### Init Conditions ####
    initMethod = parameters[4].valueAsText
    if initMethod == "USER_DEFINED_SEED_LOCATIONS":
        initField = UTILS.getTextParameter(5, parameters, fieldName = True)
        fieldList.append(initField)
    else:
        initField = None
                
    #### Number of Groups ####
    kPartitions = UTILS.getNumericParameter(6, parameters)

    #### FStat Table ####
    outputTable = parameters[7].valueAsText

    #### Create SSDataObject ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC, useChordal = False)

    #### Populate SSDO with Data ####
    ssdo.obtainData(ssdo.oidName, fieldList, minNumObs = 3, warnNumObs = 30)

    #### Execute ####
    clust = MultivariateClustering(ssdo, analysisFields.copy(), initMethod = initMethod,
                                   initField = initField, kPartitions = kPartitions, 
                                   outputTable = outputTable,
                                   clusterMethod = clusterMethod)

    clust.report()

    #### Create OutputFC ####
    clust.createOutput(outputFC)

    #### Set the Default Symbology ####
    renderLayerFile = kMeansShape2Layer[ssdo.shapeType.upper()]

    #### Render Results ####
    try:
        fullRLF = OS.path.join(UTILS.pathLayers, renderLayerFile)
    except:
        ARCPY.AddIDMessage("WARNING", 973)

    #### Set Chart Output ####
    if UTILS.isPRO():

        #### Bar Chart ####
        bChart = ARCPY.Chart(ARCPY.GetIDMessage(84783))
        bChart.type = "bar"
        bChart.title = ARCPY.GetIDMessage(84783)

        #### Assign X Axis Field ####
        bChart.xAxis.field = "CLUSTER_ID"
        bChart.xAxis.title = ARCPY.GetIDMessage(84751)
        bChart.xAxis.sort = "ASC"
        bChart.yAxis.field = ""
        bChart.yAxis.title = ARCPY.GetIDMessage(84785)
        bChart.bar.aggregation= "COUNT"

        #### Box Plots ####
        box = ARCPY.Chart(ARCPY.GetIDMessage(84774))
        box.type = "boxPlot"
        box.title = ARCPY.GetIDMessage(84774)

        #### Assign Y Axis Field ####
        outPath, outName = OS.path.split(outputFC)
        plotFieldNames = [ ssdo.in2OutFieldMap[i] for i in analysisFields ]
        box.yAxis.field = plotFieldNames
        box.yAxis.title = ARCPY.GetIDMessage(84269)

        #### Assign X Axis Field ####
        box.xAxis.field = ""
        box.xAxis.title = ARCPY.GetIDMessage(84399)

        #### Set Box Plot Properties ####
        box.boxPlot.splitCategory = "CLUSTER_ID"
        box.boxPlot.splitCategoryAsMeanLine = True
        box.boxPlot.standardizeValues = True

        parameters[1].charts = [box, bChart]

        if outputTable is not None:
            #### FStat Plot ####
            chart = ARCPY.Chart(ARCPY.GetIDMessage(84772))
            chart.type = "line"
            chart.title = ARCPY.GetIDMessage(84772)

            #### Assign X Axis Field ####
            chart.xAxis.field = "NUM_GROUPS"
            chart.xAxis.title = ARCPY.GetIDMessage(84764)

            #### Assign Y Axis Field ####
            chart.yAxis.field = "PSEUDO_F"
            chart.yAxis.title = ARCPY.GetIDMessage(84773)

            #### Sort by X ####
            #chart.xAxis.sort = chart.xAxis.field

            parameters[7].charts = [chart]


class MultivariateClustering(object):
    """Traditional k-means classification algorithm:
    
    INPUTS: 
    ssdo (obj): instance of SSDataObject
    weightsFile {str, None}: path to a spatial weights matrix file
    concept: {str, EUCLIDEAN}: EUCLIDEAN or MANHATTAN 
    numNeighs {long, None}: if space concept is K_NEAREST_NEIGHBORS
    """

    def __init__(self, ssdo, varNames, initMethod = "OPTIMIZED_SEED_LOCATIONS",
                 initField = None, kPartitions = None, outputTable = None,
                 clusterMethod = "K_MEANS"):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Set Optimized to False for Seed From Field ####
        self.optimizeGroups = False
        if initMethod == "USER_DEFINED_SEED_LOCATIONS":
            self.outputTable = None
            self.kPartitions = None
            self.kLimit = None
        else:
            #### Set Group Limit ####
            noneK = self.kPartitions is None
            if noneK or self.outputTable is not None:
                self.optimizeGroups = True
                if noneK:
                    self.kLimit = defaultKLimit
                else:
                    self.kLimit = max(defaultKLimit, self.kPartitions)

                #### Assure kLimit Does Not Exceed Num Features ####
                if self.kLimit >= ssdo.numObs:
                    self.kLimit = ssdo.numObs - 1
            else:
                self.kLimit = self.kPartitions

        #### Assure Number of Groups/Features is Possible ####
        if self.kPartitions is not None:
            if self.kPartitions >= ssdo.numObs:
                ARCPY.AddIDMessage("ERROR", 110131)
                raise SystemExit()

        #### Initialize Data ####
        self.organizeData()
        self.silentNonGroup = False

        #### Set Aspatial Bool ####
        self.numFeatures = self.ssdo.numObs

        #### Set Cluster Method ####
        if self.clusterMethod == "K_MEANS":
            self.getClusters = ARC._ss.kmeans_solve_2
        else:
            self.getClusters = ARC._ss.py_kmedoids_solve

        #### Find Feasible Solution(s) ####
        if self.optimizeGroups:
            if self.kPartitions is None:
                self.optimizeASpatialChooseK()
            else:
                self.optimizeASpatial()
        else:
            #### Set Seeds ####
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84259))
            self.setRandomInfo()
            self.setSeeds()
            self.aspatialSolve()
            
    def setRandomInfo(self, seedOverride = None):
        """Set/get the Random Seed for Python/NumPy and C++ Functions.
        NOTES:
            Environment Default is Zero.  This will return a random seed.
            Set ARCPY.env.randomGenerator if you want to change the seed 
            value to non-zero.  Or use the convenience functions below with
            the "seedOverride" argument set to the desired value.
            We only honor the integer value not the 
            generator as NumPy only uses Mersenne Twister.
        """

        #### Set it for NumPy ####
        UTILS.setRandomSeed(seedOverride = seedOverride)

        #### Get it for C++ ####
        self.randSeed = UTILS.getRandomSeed(seedOverride = seedOverride)

    def optimizeASpatial(self):
        ARCPY.AddMessage(ARCPY.GetIDMessage(84763))

        #### Aspatial Optimization ####
        ARCPY.AddIDMessage("WARNING", 1326)
        self.groupList = list(range(2, self.kLimit + 1))
        ng = len(self.groupList)
        self.fStatRes = NUM.zeros((ng,), float)
        baseNumParts = self.kPartitions
        iterSeeds = None
        self.bestSeeds = None

        #### Loop Through Num Groups ####
        self.setRandomInfo()
        randIntSeeds = RAND.random_integers(0, 2000000000, aSpatialOptimizeIters) 
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84259), 0, len(self.groupList), 1)
        for row, numPart in enumerate(self.groupList):
            finalize = numPart == baseNumParts

            #### Perfect Variance ####
            if numPart == self.numUniqueRows:
                highestFStat = self.fStatRes[row - 1] + 1
                if finalize:
                    iterSeeds, seedIndices, bestSolution = self.setPerfectVariance()

            else:
                #### Max FStat For User Selected Group ####
                highestFStat = -999999.0
                bestSolution = None
                self.kPartitions = numPart

                #### Loop Through Number of Iterations ####
                for iter in UTILS.ssRange(aSpatialOptimizeIters):
                    self.setRandomInfo(seedOverride = randIntSeeds[iter])
                    self.setSeeds()
                    self.aspatialSolve()
                    fStat = self.getFStatFromSolution(self.iterGroups)
                    if fStat > highestFStat:
                        highestFStat = fStat
                        bestSolution = self.iterGroups
                        iterSeeds = self.seeds

            #### Set Highest FStat ####
            self.fStatRes[row] = highestFStat

            #### Set Solution and Stats ####
            if finalize:
                self.bestSeeds = NUM.array(iterSeeds)
                self.finalizeSolution(bestSolution)

            ARCPY.SetProgressorPosition()
                
        #### Report Highest Pseudo-F (Aspatial) ####
        self.fStatInfo = summarizeFStats(self.fStatRes, self.groupList)

        #### Set NumPy's Random Seed Back to "Random" ####
        RAND.seed(None)

    def optimizeASpatialChooseK(self):
        ARCPY.AddMessage(ARCPY.GetIDMessage(84763))

        #### Aspatial Optimization ####
        ARCPY.AddIDMessage("WARNING", 1326)
        self.groupList = list(range(2, self.kLimit + 1))
        ng = len(self.groupList)
        self.fStatRes = NUM.zeros((ng,), float)
        globalBestSolution = None
        globalHighestFStat = -999999.0
        self.bestSeeds = None
        bestK = 2

        #### Loop Through Num Groups ####
        outputDone = False
        self.setRandomInfo()
        randIntSeeds = RAND.random_integers(0, 2000000000, aSpatialOptimizeIters) 
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84259), 0, len(self.groupList), 1)
        for row, numPart in enumerate(self.groupList):

            #### Perfect Variance ####
            if numPart == self.numUniqueRows:
                highestFStat = globalHighestFStat + 1
                bestSeeds, seedIndices, bestSolution = self.setPerfectVariance()
                bestK = numPart

            else:
                self.kPartitions = numPart
                highestFStat = -999999.0
                bestSolution = None
                bestSeeds = None

                #### Loop Through Number of Iterations ####
                for iter in UTILS.ssRange(aSpatialOptimizeIters):
                    self.setRandomInfo(seedOverride = randIntSeeds[iter])
                    self.setSeeds()
                    self.aspatialSolve()
                    fStat = self.getFStatFromSolution(self.iterGroups)
                    if fStat > highestFStat:
                        highestFStat = fStat
                        bestSolution = self.iterGroups
                        bestK = numPart
                        bestSeeds = self.seeds

            self.fStatRes[row] = highestFStat

            if highestFStat > globalHighestFStat:
                globalHighestFStat = highestFStat
                globalBestSolution = bestSolution
                self.bestSeeds = bestSeeds

            ARCPY.SetProgressorPosition()

        #### Set Solution and Stats ####
        self.kPartitions = bestK
        self.finalizeSolution(globalBestSolution)

        #### Report Highest Pseudo-F (Aspatial) ####
        self.fStatInfo = summarizeFStats(self.fStatRes, self.groupList)

        #### Set NumPy's Random Seed Back to "Random" ####
        RAND.seed(None)

    def setPerfectVariance(self):
        seedIndices = self.seedKeys
        seeds = NUM.zeros(self.n, dtype = NUM.int32)
        seeds[seedIndices] = 1
        solution = NUM.zeros(self.n, dtype = NUM.int32)
        for cluster, seed in enumerate(seedIndices):
            solution[seed] = cluster
            for index in self.mapper[seed]:
                solution[index] = cluster

        return seeds, seedIndices, solution

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

        #### Use Subset Data for Non-Unique Rows ####
        self.notUnique = False
        if self.initMethod != "USER_DEFINED_SEED_LOCATIONS":
            uniqueRows, counts = STATS.uniqueRows(self.z)
            self.numUniqueRows = len(uniqueRows)
            if self.numUniqueRows != self.ssdo.numObs:
                #### Not Unique Rows ####
                self.notUnique = True
                self.seedData = uniqueRows
                self.counts = counts
                self.seedKeys, self.mapper = STATS.mapFromUniqueCounts(self.z, self.counts)
            else:
                self.seedData = self.z
                self.seedKeys = NUM.arange(self.ssdo.numObs, dtype = NUM.int32)

            #### Check Max K and Base Number of Partitions ####
            if self.optimizeGroups:
               if self.numUniqueRows < self.kLimit:
                   #### Limit K for Optimized ####
                   ARCPY.AddIDMessage("WARNING", 1622, str(self.numUniqueRows))
                   self.kLimit = self.numUniqueRows
               if self.kPartitions is not None:
                   if self.kPartitions > self.numUniqueRows:
                      self.kPartitions = self.numUniqueRows
            else:
                if self.numUniqueRows < self.kPartitions:
                    #### Not Enough Unique Rows to Get User Defined K ####
                    ARCPY.AddIDMessage("ERROR", 110148, str(self.numUniqueRows))
                    raise SystemExit()

    def setSeeds(self):
        if self.initMethod == "USER_DEFINED_SEED_LOCATIONS":
            #### Get User Defined Seed Field ####
            seedData = self.ssdo.fields[self.initField].data
            seedIndices = NUM.array(NUM.where(seedData == 1)[0], NUM.int32)
            numInputSeeds = len(seedIndices)
            if numInputSeeds < 2:
                #### At least two seeds are  required ####
                ARCPY.AddIDMessage("ERROR", 110407)
                raise SystemExit()
            uniqueSeeds, counts = STATS.uniqueRows(self.z[seedIndices])
            if len(uniqueSeeds) != numInputSeeds:
                #### User Defined Seeds Must Be Unique ####
                ARCPY.AddIDMessage("ERROR", 110147)
                raise SystemExit()

            self.kPartitions = len(seedIndices)
            if not self.kPartitions:
                #### No Valid Seeds ####
                ARCPY.AddIDMessage("ERROR", 1205, self.initField)
                raise SystemExit()
            if self.kPartitions == self.ssdo.numObs or self.kPartitions == 1:
                #### Too Many Seeds ####
                ARCPY.AddIDMessage("ERROR", 110130)
                raise SystemExit()
        else:

            if self.initMethod == "OPTIMIZED_SEED_LOCATIONS":
                seedIndices = ARC._ss.kmeans_plus_plus(self.seedData, 
                                                       self.kPartitions,
                                                       random_seed = self.randSeed)
                seedIndices = self.seedKeys[seedIndices]
            else:
                randInd = RAND.permutation(self.numUniqueRows)
                seedIndices = self.seedKeys[randInd[0:self.kPartitions]]

        seedIndices = NUM.array(seedIndices, dtype = NUM.int32)

        self.partIDs = list(range(self.kPartitions))
        self.seeds = NUM.zeros(self.n, dtype = NUM.int32)
        self.seeds[seedIndices] = 1
        self.seedIndices = seedIndices

    def aspatialSolve(self):
        feasible = True
        clusterInfo = self.getClusters(self.z, self.seedIndices, max_iters = aSpatialIters)
        closest = clusterInfo[0]
        iters = clusterInfo[-1]
        feasible = iters < aSpatialIters

        #### Set Attributes ####
        self.iters = iters
        self.iterGroups = clusterInfo[0]

        #### Finalize ####
        if not self.optimizeGroups:
            self.finalizeSolution(closest)

    def finalizeSolution(self, solution):
        """Sets the final group numbers to the features."""
        #### Assign Partitions ####
        self.partition = solution
        self.partitionOutput = self.partition + 1
        self.setStatistics(self.partition)

        #### Warn of Disconnected Group(s) ####
        if NUM.any(self.partition == -10000):
            ARCPY.AddIDMessage("WARNING", 1329)
                
    def getFStatFromSolution(self, solution):

        #### Get Unique Region IDs and Number of Groups ####
        groups = NUM.unique(solution)
        numGroups = len(groups)

        SSE = 0.0
        SSR = 0.0
        nc = numGroups
        n = self.numFeatures
        for group in UTILS.ssRange(nc):
            ids = NUM.where(solution == group)
            nGroup = len(ids[0])
            if nGroup:
                centroid = getCentroid(self.z, ids)
                flat = dist2Centroid(self.z, centroid, partIDs = ids)
                SSE += flat.sum()
                SSR += (nGroup * 1.0) * ((centroid - self.zMean)**2.0).sum()
            else:
                if self.optimizeGroups and not self.silentNonGroup:
                    #### Single Warning For a Solution Without Cluster Membership ####
                    ARCPY.AddIDMessage("WARNING", 110126)
                    self.silentNonGroup = True

        #### R2 and Pseudo f-Statistic ####
        R2 = (self.SST - SSE) / self.SST
        fStat = (R2 / (nc - 1)) / ((1 - R2) / (n - nc))

        return fStat

    def setStatistics(self, solution):

        #### Get Unique Region IDs and Number of Groups ####
        groups = NUM.unique(solution)
        numGroups = len(groups)
        self.varSSE = NUM.zeros((numGroups, self.k))

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
        SSE = 0.0
        SSR = 0.0
        nc = numGroups * 1.0
        n = self.numFeatures

        for group in UTILS.ssRange(numGroups):
            groupInd = NUM.where(solution == group)
            nGroup = len(groupInd[0])
            if nGroup:
                centroid = getCentroid(self.z, groupInd)
                groupX = self.x[groupInd]
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
            else:
                #### Warn At Least One Cluster With No Features ####
                ARCPY.AddIDMessage("WARNING", 110127)


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
        fieldOrder = UTILS.getFieldNames(clusterFieldNames, outPath)
        if self.optimizeGroups:
            fieldData = [self.partitionOutput, self.bestSeeds]
        else:
            fieldData = [self.partitionOutput, self.seeds]

        #### Create/Populate Dictionary of Candidate Fields ####
        candidateFields = {}
        for fieldInd, fieldName in enumerate(fieldOrder):
            candidateField = SSDO.CandidateField(fieldName, "LONG", 
                                                 fieldData[fieldInd],
                                                 alias = clusterAliasNames[fieldInd])
            candidateFields[fieldName] = candidateField

        #### Add Analysis/Sum Fields ####
        appendFields = self.varNames
        if self.initField is not None:
            appendFields.append(self.initField)
        appendFields += self.badVarNames

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

def summarizeFStats(fStatRes, groupList):
    maxInd = fStatRes.argmax()
    maxFStat = fStatRes[maxInd]
    maxGroup = groupList[maxInd]
    maxFOut = UTILS.formatValue(maxFStat, "%0.4f")
    maxVals = (numSep, maxGroup, maxFOut)
    ARCPY.AddMessage("\n"+ARCPY.GetIDMessage(84762).format(maxGroup))

    return maxInd, maxGroup, maxFStat
