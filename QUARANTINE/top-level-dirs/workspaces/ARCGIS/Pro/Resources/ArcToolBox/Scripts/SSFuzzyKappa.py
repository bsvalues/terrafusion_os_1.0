# coding: utf-8
"""
Tool Name:     Map Comparison
Source Name:   SSFuzzyKappa.py
Version:       ArcGIS Pro 3.0
Author:        Environmental Systems Research Institute Inc.
Description:   Runs Fuzzy Kappa Analysis to Compare Categorical Maps
"""

################ Imports ####################
import sys as SYS
import os as OS
import numpy as NUM
import numpy.random as RAND
import arcpy as ARCPY
import arcpy.da as DA
import arcpy.analysis as ANA
import arcgisscripting as ARC
import arcpy.management as DM
import ErrorUtils as ERROR
import SSUtilities as UTILS
import WeightsUtilities as WU
import SSDataObject as SSDO
import Stats as STATS
import locale as LOCALE
LOCALE.setlocale(LOCALE.LC_ALL, '')
from scipy.optimize import minimize 
from scipy.special import expit
import copy as COPY
import warnings as WARN
import scipy.spatial as SCPS
ThresholdForCompensateKDTree = 10000
leafSize = 40
classifySig = {-3: ARCPY.GetIDMessage(220543), -2: ARCPY.GetIDMessage(220544),
              -1: ARCPY.GetIDMessage(220545), 0: ARCPY.GetIDMessage(84511),
               1: ARCPY.GetIDMessage(220546), 2: ARCPY.GetIDMessage(220547),
               3: ARCPY.GetIDMessage(220548)}

classifyPairs = {0: ARCPY.GetIDMessage(220565), 1: ARCPY.GetIDMessage(220566),
                 2: ARCPY.GetIDMessage(220567), 3: ARCPY.GetIDMessage(220568),
                 4: ARCPY.GetIDMessage(220569), 5: ARCPY.GetIDMessage(220570),
                 6: ARCPY.GetIDMessage(220571), 7: ARCPY.GetIDMessage(220572),
                 8: ARCPY.GetIDMessage(220573)}

empiricalDefaults = {0: {0:1.0}, 
                     1:{1:1.0, 2:.75, 3:.5}, 
                     2:{1:.75, 2:1.0, 3:.75}, 
                     3:{1:.5, 2:.75, 3:1.0}, 
                     -1:{-1:1.0, -2:.75, -3:.5}, 
                     -2:{-1:.75, -2:1.0, -3:.75}, 
                     -3:{-1:.5, -2:.75, -3:1.0} 
                     }

reverseDefaults = {0: {0:1.0}, 
                   1:{-1:1.0, -2:.75, -3:.5}, 
                   2:{-1:.75, -2:1.0, -3:.75}, 
                   3:{-1:.5, -2:.75, -3:1.0}, 
                   -1:{1:1.0, 2:.75, 3:.5}, 
                   -2:{1:.75, 2:1.0, 3:.75}, 
                   -3:{1:.5, 2:.75, 3:1.0} 
                   }

simLabels = ["{0} - {1}".format(LOCALE.format_string("%0.6f", 0.0), LOCALE.format_string("%0.6f", 0.2)),
             "{0} - {1}".format(LOCALE.format_string("%0.6f", 0.200001), LOCALE.format_string("%0.6f", 0.4)),
             "{0} - {1}".format(LOCALE.format_string("%0.6f", 0.400001), LOCALE.format_string("%0.6f", 0.6)),
             "{0} - {1}".format(LOCALE.format_string("%0.6f", 0.600001), LOCALE.format_string("%0.6f", 0.8)),
             "{0} - {1}".format(LOCALE.format_string("%0.6f", 0.800001), LOCALE.format_string("%0.6f", 1.0))]
        

breaks = NUM.array([.01, .05, .1, 1.0], dtype = float)
order1Weights = NUM.array([.25, .25, 1.0, .25, .25])
order2Weights = NUM.array([0.0, .25, 0.0, .25, 1.0, .25, 0.0, .25, 0.0])
TEMP_WEIGHT_METHOD = "INTERVAL"
#TEMP_WEIGHT_METHOD = "GAUSSIAN"
#TEMP_WEIGHT_METHOD = "BISQUARE"

def createPairs(x, y, coldValue = -1, hotValue = 1):
    n = len(x)
    pairs = NUM.zeros(n, dtype = NUM.int32)
    for i in range(n):
        xVal = x[i]
        yVal = y[i]

        #### X is Cold ####
        if xVal <= coldValue:
            if yVal <= coldValue:
                pairs[i] = 6
            elif yVal >= hotValue:
                pairs[i] = 8
            else:
                pairs[i] = 7

        #### X is Hot ####
        elif xVal >= hotValue:
            if yVal <= coldValue:
                pairs[i] = 0
            elif yVal >= hotValue:
                pairs[i] = 2
            else:
                pairs[i] = 1

        #### X is Not-Sig ####
        else:
            if yVal <= coldValue:
                pairs[i] = 5
            elif yVal >= hotValue:
                pairs[i] = 3
            else:
                pairs[i] = 4

    return pairs

def bisquare(distances, localBandwidth):
    return (1.0 - (distances / localBandwidth)**2.0)**2.0

def gaussian(distances, localBandwidth):
    return NUM.exp(-.5 * (distances / localBandwidth)**2.0) 

def interval(distances, localBandwidth):
    knn = len(distances)
    return NUM.linspace(knn, 1, knn) / (knn * 1.0)

class GridHotSpotMapComparison(object):
    def __init__(self, numRows = 66, numCols = 66, order = 2, permutations = 499, catWeightMethod = "EXACT_MATCH",
                 catWeightsTable = None, excludeNonSig = True,
                 seed = None, isHexigon = False):

        UTILS.assignClassAttr(self, locals())
        UTILS.setRandomSeed(seedOverride = self.seed)
        if self.order == 1:
            self.threshold = 1.0
            self.weights = order1Weights
        else:
            self.threshold = NUM.sqrt(2.0)
            self.weights = order2Weights
        self.knn = len(self.weights)

        self.cubeInfo = ARC._ss.CubeInfo(self.numRows, self.numCols, 1, 1.0,
                                         space_threshold = self.threshold, time_order = 0,
                                         include_self = True)

        self.N = self.numRows * self.numCols
        self.x = RAND.randint(-3, 4, self.N)
        self.y = RAND.randint(-3, 4, self.N)
        self.allCats = NUM.arange(-3, 4, dtype = NUM.int32)
        self.numCats = len(self.allCats)

        #### Get IDs without Edge Effects ####
        self.ids = []
        self.xySig = []
        for i in range(self.N):
            row = i // self.numCols
            col = i % self.numCols
            if (row != 0) and (row != self.numRows - 1) and (col != 0) and (col != self.numCols - 1):
                self.ids.append(i)
                if self.x[i] != 0 and self.y[i] != 0:
                    self.xySig.append(i)

        self.n = len(self.ids)
        self.numSig = len(self.xySig)

        #### Create Cat Weight Dict ####
        self.cat2CatWeights = {}
        self.xyCatIndex = {}

        #### Cat Weight Method ####
        upperMethod = self.catWeightMethod.upper() 
        if upperMethod == "TABLE":
            self.useTableWeights()
        else:
            self.useExactWeights()

        #### Solve ####
        self.solve()

    def defaultBinaryWeights(self):
        for catInd, catX in enumerate(self.allCats):
            self.xyCatIndex[catX] = catInd
            self.cat2CatWeights[catX] = {}

            for catY in self.allCats:
                if catY == catX:
                    self.cat2CatWeights[catX][catY] = 1.0
                else:
                    self.cat2CatWeights[catX][catY] = 0.0

    def useExactWeights(self):
        """Create Binary Category Weights."""

        #### Use Default Binary Weights Only ####
        self.defaultBinaryWeights()

    def useAbove90Weights(self):
        for catInd, catX in enumerate(self.allCats):
            self.xyCatIndex[catX] = catInd
            self.cat2CatWeights[catX] = {}

            for catY in self.allCats:
                if catY == catX:
                    self.cat2CatWeights[catX][catY] = 1.0
                else:
                    if catY < 0 and catX < 0:
                        self.cat2CatWeights[catX][catY] = 1.0
                    elif catY > 0 and catX > 0:
                        self.cat2CatWeights[catX][catY] = 1.0
                    else:
                        self.cat2CatWeights[catX][catY] = 0.0

    def useTableWeights(self):
        """Starts with default binary weights and then uses user-specified table to add/overwrite cat weights."""

        #### Start with Default Binary Weights ####
        self.defaultBinaryWeights()

        #### Assure At Least One Record ####
        cnt = UTILS.getCount(self.catWeightsTable)
        if not cnt:
            ARCPY.AddIDMessage("ERROR", 110494)
            raise SystemExit

        #### Get Cat Weights - Assures Symmetry Based on Last Defined Weight ####
        fieldList = ["CATEGORY1", "CATEGORY2", "WEIGHT"]
        rows = DA.SearchCursor(self.catWeightsTable, fieldList)
        oneValid = False

        for row in rows:
            #### Assure Correct Locale ####
            catX, catY, weight = row
            try:
                catX = int(catX)
                catY = int(catY)
                if type(weight) == str:
                    weight = UTILS.strToFloat(weight)
            except:
                ARCPY.AddIDMessage("ERROR", 110494)
                raise SystemExit

            goodWeight = weight >= 0 and weight <= 1
            if catX not in self.allCats or catY not in self.allCats or not goodWeight:
                ARCPY.AddIDMessage("ERROR", 110494)
                raise SystemExit
            else:
                oneValid = True
                self.cat2CatWeights[catX][catY] = weight
                self.cat2CatWeights[catY][catX] = weight

        del rows

        if not oneValid:
            ARCPY.AddIDMessage("ERROR", 110494)
            raise SystemExit

    def solve(self):

        #### Sparse Info for Neighbors ####
        self.neighInfo = {}
        self.vx = {}
        self.vy = {}

        self.similarity = NUM.zeros(self.N, dtype = float)
        for i in self.ids:

            #weights = NUM.exp(-.5 * (distances / localBandwidth)**2.0) 
            neighs = self.cubeInfo.get_neighbor_cells(i)

            #### Store Similarity Candidates ####
            xVals = self.x[neighs]
            yVals = self.y[neighs]
            vx = NUM.zeros(self.numCats, dtype = float)
            vy = NUM.zeros(self.numCats, dtype = float)

            #### Do X Map to Y First ####
            for catInd in range(self.numCats):
                cat = self.allCats[catInd]
                catWeightsX = NUM.zeros(self.knn, dtype = float)
                for nhInd in range(self.knn):
                    xValue = xVals[nhInd]
                    catWeightsX[nhInd] = self.cat2CatWeights[cat][xValue]
                ux = (catWeightsX * self.weights).max()
                vx[catInd] = ux

            #### Do Y to X ####
            for catInd in range(self.numCats):
                cat = self.allCats[catInd]
                catWeightsY = NUM.zeros(self.knn, dtype = float)
                for nhInd in range(self.knn):
                    yValue = yVals[nhInd]
                    catWeightsY[nhInd] = self.cat2CatWeights[cat][yValue]
                uy = (catWeightsY * self.weights).max()
                vy[catInd] = uy

            #### Store VX/VY ####
            self.vx[i] = vx
            self.vy[i] = vy

            vxIndex = self.xyCatIndex[self.y[i]]
            vyIndex = self.xyCatIndex[self.x[i]]
                
            self.similarity[i] = min(vx[vxIndex], vy[vyIndex])

        if self.excludeNonSig:
            #### Only Use Significant Features ####
            self.avgSim = self.similarity[self.xySig].mean()
            self.doSubsetSims()
        else:
            self.avgSim = self.similarity[self.ids].mean()
            self.doFullSims()

    def doFullSimsDouble(self):

        #### Simulations ####
        self.permRes = NUM.zeros(self.N, dtype = float)
        self.pVals = NUM.zeros(self.N, dtype = float)
        self.pValCats = NUM.ones(self.N, dtype = NUM.int32) * 3
        self.kappaSim = NUM.zeros(self.N, dtype = float)
        simResSum = NUM.zeros(self.permutations, dtype = float)
        ARCPY.SetProgressor("step", "Calculating Simulated Kappa Information....", 0, self.n, 1)
        for i in self.ids:

            simRes = NUM.zeros(self.permutations, dtype = float)

            #### Hold Map X Constant ####
            vyIndex = self.xyCatIndex[self.x[i]]
            for perm in range(self.permutations):
                randJIndex = RAND.randint(0, self.n)
                randJ = self.ids[randJIndex]
                vxIndex = self.xyCatIndex[self.y[randJ]]
                simResult = min(self.vx[i][vxIndex], self.vy[randJ][vyIndex])
                simRes[perm] = simResult
                simResSum[perm] += simResult

            #### Hold Map Y Constant ####
            vxIndex = self.xyCatIndex[self.y[i]]
            for perm in range(self.permutations):
                randIIndex = RAND.randint(0, self.n)
                randI = self.ids[randIIndex]
                vyIndex = self.xyCatIndex[self.x[randI]]
                simResult = min(self.vx[randI][vxIndex], self.vy[i][vyIndex])
                simRes[perm] += simResult
                simResSum[perm] += simResult

            #### Store Location I's Contribution to P0 ####
            self.permRes[i] = (simRes / 2.0).mean()
            #self.permRes[i] = simRes.mean()
            self.kappaSim[i] = (self.similarity[i] - self.permRes[i]) / (1 - self.permRes[i])

            #### Local p-value ####
            pv = STATS.oneSidedPermPV(simRes, self.similarity[i])
            self.pVals[i] = pv
            self.pValCats[i] = NUM.searchsorted(breaks, pv)

            ARCPY.SetProgressorPosition()

        self.simResAvg = (simResSum / 2.) / self.n
        #self.simResAvg = simResSum / self.n
        self.expectedValue = self.simResAvg.mean()
        self.kappa = (self.avgSim - self.expectedValue) / (1 - self.expectedValue)
        self.globalPValue = STATS.oneSidedPermPV(self.simResAvg, self.avgSim)
        self.globalZValue = (self.avgSim - self.expectedValue) / self.simResAvg.std()
        self.globalZPValue = STATS.zProb(self.globalZValue, type = 2)
        
    def doFullSims(self):

        #### Simulations ####
        self.permRes = NUM.zeros(self.N, dtype = float)
        self.pVals = NUM.zeros(self.N, dtype = float)
        self.pValCats = NUM.ones(self.N, dtype = NUM.int32) * 3
        self.kappaSim = NUM.zeros(self.N, dtype = float)
        simResSum = NUM.zeros(self.permutations, dtype = float)
        ARCPY.SetProgressor("step", "Calculating Simulated Kappa Information....", 0, self.n, 1)
        for i in self.ids:

            simRes = NUM.zeros(self.permutations, dtype = float)

            #### Hold Map X Constant ####
            vyIndex = self.xyCatIndex[self.x[i]]
            for perm in range(self.permutations):
                randJIndex = RAND.randint(0, self.n)
                randJ = self.ids[randJIndex]
                vxIndex = self.xyCatIndex[self.y[randJ]]
                simResult = min(self.vx[i][vxIndex], self.vy[randJ][vyIndex])
                simRes[perm] = simResult
                simResSum[perm] += simResult

            #### Store Location I's Contribution to P0 ####
            self.permRes[i] = simRes.mean()
            self.kappaSim[i] = (self.similarity[i] - self.permRes[i]) / (1 - self.permRes[i])

            #### Local p-value ####
            pv = STATS.oneSidedPermPV(simRes, self.similarity[i])
            self.pVals[i] = pv
            self.pValCats[i] = NUM.searchsorted(breaks, pv)

            ARCPY.SetProgressorPosition()

        self.simResAvg = simResSum / self.n
        self.expectedValue = self.simResAvg.mean()
        self.kappa = (self.avgSim - self.expectedValue) / (1 - self.expectedValue)
        self.globalPValue = STATS.oneSidedPermPV(self.simResAvg, self.avgSim)
        self.globalZValue = (self.avgSim - self.expectedValue) / self.simResAvg.std()
        self.globalZPValue = STATS.zProb(self.globalZValue, type = 2)

    def doFullSimsBinomial(self):

        #### Simulations ####
        self.permRes = NUM.zeros(self.N, dtype = float)
        self.pVals = NUM.zeros(self.N, dtype = float)
        self.pValCats = NUM.ones(self.N, dtype = NUM.int32) * 3
        self.kappaSim = NUM.zeros(self.N, dtype = float)
        simResSum = NUM.zeros(self.permutations, dtype = float)
        ARCPY.SetProgressor("step", "Calculating Simulated Kappa Information....", 0, self.n, 1)
        for i in self.ids:

            simRes = NUM.zeros(self.permutations, dtype = float)

            for perm in range(self.permutations):

                binomialDraw = RAND.randint(0,2)
                if not binomialDraw:
                    #### Hold Map X Constant ####
                    vyIndex = self.xyCatIndex[self.x[i]]
                    randJIndex = RAND.randint(0, self.n)
                    randJ = self.ids[randJIndex]
                    vxIndex = self.xyCatIndex[self.y[randJ]]
                    simResult = min(self.vx[i][vxIndex], self.vy[randJ][vyIndex])
                else:
                    #### Hold Map Y Constant ####
                    vxIndex = self.xyCatIndex[self.y[i]]
                    randIIndex = RAND.randint(0, self.n)
                    randI = self.ids[randIIndex]
                    vyIndex = self.xyCatIndex[self.x[randI]]
                    simResult = min(self.vx[randI][vxIndex], self.vy[i][vyIndex])

                simRes[perm] = simResult
                simResSum[perm] += simResult

            #### Store Location I's Contribution to P0 ####
            self.permRes[i] = simRes.mean()
            self.kappaSim[i] = (self.similarity[i] - self.permRes[i]) / (1 - self.permRes[i])

            #### Local p-value ####
            pv = STATS.oneSidedPermPV(simRes, self.similarity[i])
            self.pVals[i] = pv
            self.pValCats[i] = NUM.searchsorted(breaks, pv)

            ARCPY.SetProgressorPosition()

        self.simResAvg = simResSum / self.n
        self.expectedValue = self.simResAvg.mean()
        self.kappa = (self.avgSim - self.expectedValue) / (1 - self.expectedValue)
        self.globalPValue = STATS.oneSidedPermPV(self.simResAvg, self.avgSim)
        self.globalZValue = (self.avgSim - self.expectedValue) / self.simResAvg.std()
        self.globalZPValue = STATS.zProb(self.globalZValue, type = 2)

    def doSubsetSims(self):

        #### Simulations ####
        self.permRes = NUM.zeros(self.N, dtype = float) * NUM.nan
        self.pVals = NUM.ones(self.N, dtype = float)
        self.pValCats = NUM.ones(self.N, dtype = NUM.int32) * 3
        self.kappaSim = NUM.zeros(self.N, dtype = float) * NUM.nan
        simResSum = NUM.zeros(self.permutations, dtype = float)
        ARCPY.SetProgressor("step", "Calculating Simulated Kappa Information....", 0, self.numSig, 1)
        for i in self.xySig:

            simRes = NUM.zeros(self.permutations, dtype = float)

            #### Hold Map X Constant ####
            vyIndex = self.xyCatIndex[self.x[i]]
            for perm in range(self.permutations):
                randJIndex = RAND.randint(0, self.n)
                randJ = self.ids[randJIndex]
                vxIndex = self.xyCatIndex[self.y[randJ]]
                simResult = min(self.vx[i][vxIndex], self.vy[randJ][vyIndex])
                simRes[perm] = simResult
                simResSum[perm] += simResult

            #### Store Location I's Contribution to P0 ####
            self.permRes[i] = simRes.mean()
            self.kappaSim[i] = (self.similarity[i] - self.permRes[i]) / (1 - self.permRes[i])

            #### Local p-value ####
            pv = STATS.oneSidedPermPV(simRes, self.similarity[i])
            self.pVals[i] = pv
            self.pValCats[i] = NUM.searchsorted(breaks, pv)

            ARCPY.SetProgressorPosition()

        self.simResAvg = simResSum / self.numSig 
        self.expectedValue = self.simResAvg.mean()
        self.kappa = (self.avgSim - self.expectedValue) / (1 - self.expectedValue)
        self.globalPValue = STATS.oneSidedPermPV(self.simResAvg, self.avgSim)


class InputHotSpotInfo(object):
    def __init__(self, inputFCParam):
        if type(inputFCParam) is str:
            #### For Python Debugging without PYT / Parameters ####
            self.inputFC = inputFCParam
            self.inputFCAsText = inputFCParam
            self.isMapLayerObject = False
        else:
            self.inputFC = inputFCParam.value
            self.inputFCAsText = inputFCParam.valueAsText
            self.isMapLayerObject = "MappingLayerObject" in str(type(self.inputFC))
        self.info = ARCPY.Describe(self.inputFC)

    def isSame(self, inputHotSpotInfo):
        if self.isMapLayerObject and inputHotSpotInfo.isMapLayerObject:
            return self.inputFC.URI == inputHotSpotInfo.inputFC.URI
        else:
            self.info.CatalogPath == inputHotSpotInfo.info.CatalogPath

    def getName(self, inputHotSpotInfo):
        if self.isSame(inputHotSpotInfo):
            return OS.path.basename(self.info.CatalogPath)
        else:
            return OS.path.basename(self.inputFCAsText)

class TempPolygonIntersect(object):
    def __init__(self, inputFC1Param, field1, inputFC2Param, field2, outputFC):
        self.field1 = field1
        self.field2 = field2
        self.inputFC1 = InputHotSpotInfo(inputFC1Param)
        self.inputFC2 = InputHotSpotInfo(inputFC2Param)
        self.inputFC1Name = self.inputFC1.getName(self.inputFC2)
        self.inputFC2Name = self.inputFC2.getName(self.inputFC1)

        self.intersectFC = "in_memory/fuzzyIntersect"

        ### Apply newFieldTypeCheker before proceed ###
        self.migrate64 = False
        if self.inputFC1.isSame(self.inputFC2):
            check1 = UTILS.ExecuteNewFieldTypeChecker(self.inputFC1.inputFCAsText, outputFC, fields=[field1, field2])
        else:
            check1 = UTILS.ExecuteNewFieldTypeChecker(self.inputFC1.inputFCAsText, outputFC, fields=[field1])
            check2 = UTILS.ExecuteNewFieldTypeChecker(self.inputFC2.inputFCAsText, outputFC, fields=[field2])
        
        ## A better solution. Due to a bug in ARCPY.Describe, it is commented out.
        ## bring it back when Describe on .value works
        # if self.inputFC2.info.HasOID64 and not self.inputFC1.info.HasOID64:
        #     migrate64 = True
        try:
            if ARCPY.Describe(inputFC2Param.valueAsText).HasOID64 and not ARCPY.Describe(inputFC1Param.valueAsText).HasOID64:
                self.migrate64 = True
        except:
            pass

        #### Intersect with No Extent ####
        intersectNoExtent = UTILS.clearExtent(ANA.Intersect)
        intersectInputs = [[self.inputFC1.inputFC,],[self.inputFC2.inputFC,]]
        try:
            intersectNoExtent(intersectInputs, self.intersectFC, "ALL", None, "INPUT")
        except:
            pass

        cnt = UTILS.getCount(self.intersectFC)
        if cnt < 20:
            ARCPY.AddIDMessage("ERROR", 110509)
            self.cleanUp()
            raise SystemExit

        if self.field1 == self.field2:
            self.field2 = self.field2 + "_1"
        self.inputFC = self.intersectFC

        fieldList = [self.field1, self.field2]

        #### Populate SSDO with Data ####
        self.ssdo = SSDO.SSDataObject(self.inputFC, templateFC = outputFC, useChordal = True)

        #### Populate SSDO with Data ####
        self.ssdo.obtainData(self.ssdo.oidName, fieldList)

        if self.ssdo.numObs < 20:
            ARCPY.AddIDMessage("ERROR", 110509)
            self.cleanUp()
            raise SystemExit
            
    def cleanUp(self):
        UTILS.passiveDelete(self.intersectFC)

class HotSpotMapComparison(object):
    def __init__(self, intersectObject, numNeighs = 4, permutations = 499, catWeightMethod = "FUZZY",
                 catValueTable = None, catWeightsTable = None, excludeNonSig = True,
                 permute = False, kernel = "GAUSSIAN", useCPP = True,
                 xOverride = None, yOverride = None):

        UTILS.assignClassAttr(self, locals())
        self.seed = UTILS.getSetRandomSeedMax(seedMax = 1000000)
        self.ssdo = self.intersectObject.ssdo
        self.xField = self.intersectObject.field1
        self.yField = self.intersectObject.field2
        self.x = NUM.asarray(self.ssdo.fields[self.xField].data, dtype = NUM.int32)
        self.y = NUM.asarray(self.ssdo.fields[self.yField].data, dtype = NUM.int32)

        #### Assure Values are in Range(-3, 3) ####
        self.isValidHotSpotResultSet()
        if self.permute:
            self.x = NUM.ascontiguousarray(NUM.random.permutation(self.x), dtype = NUM.int32)
            self.y = NUM.ascontiguousarray(NUM.random.permutation(self.y), dtype = NUM.int32)

        if self.xOverride is not None:
            self.x = self.xOverride

        if self.yOverride is not None:
            self.y = self.yOverride

        #### Set KNN (Include Self) and Assure N > numNeighs ####
        self.knn = numNeighs + 1
        self.n = len(self.x)
        if self.n <= numNeighs:
            self.intersectObject.cleanUp()
            ARCPY.AddIDMessage("ERROR", 110495, self.n, numNeighs)
            raise SystemExit

        self.allCats = NUM.arange(-3, 4, dtype = NUM.int32)
        self.numCats = len(self.allCats)

        #### Cat Pairs ####
        self.catPairs = createPairs(self.x, self.y, coldValue = -1, hotValue = 1)

        #### Create Cat Weight Dict ####
        self.cat2CatWeights = {}
        self.xyCatIndex = {}

        #### Cat Weight Method ####
        upperMethod = self.catWeightMethod.upper() 
        if upperMethod == "TABLE":
            self.useTableWeights()
        else:
            self.useValueTableWeights()

        #### Assign Significance Values ####
        self.assignSignificance()

        #### Check for Zero Variance in Weights ####
        self.checkWeightsVariance()

        #### Solve ####
        if self.useCPP:
            self.coreSolve()
        else:
            self.solve()

    def isValidHotSpotResultSet(self):
        xMax = max(abs(self.x.min()), self.x.max())
        if xMax > 3: 
            self.intersectObject.cleanUp()
            ARCPY.AddIDMessage("ERROR", 110493, OS.path.basename(self.intersectObject.inputFC1Name))
            raise SystemExit
        
        yMax = max(abs(self.y.min()), self.y.max())
        if yMax > 3: 
            self.intersectObject.cleanUp()
            ARCPY.AddIDMessage("ERROR", 110493, OS.path.basename(self.intersectObject.inputFC2Name))
            raise SystemExit

    def defaultBinaryWeights(self):
        for catInd, catX in enumerate(self.allCats):
            self.xyCatIndex[catX] = catInd
            self.cat2CatWeights[catX] = {}

            for catY in self.allCats:
                self.cat2CatWeights[catX][catY] = 0.0

    def useValueTableWeights(self):
        """User Provided Custom Weights."""

        self.defaultBinaryWeights()

        if self.catValueTable is not None:
            for row in self.catValueTable:
                catX, catY, weight = row
                catX = int(catX)
                catY = int(catY)
                self.cat2CatWeights[catX][catY] = weight 
                self.cat2CatWeights[catY][catX] = weight 

    def useTableWeights(self):
        """Starts with default binary weights and then uses user-specified table to add/overwrite cat weights."""

        #### Start with Default Binary Weights ####
        self.defaultBinaryWeights()

        #### Assure At Least One Record ####
        cnt = UTILS.getCount(self.catWeightsTable)
        if not cnt:
            self.intersectObject.cleanUp()
            ARCPY.AddIDMessage("ERROR", 110494)
            raise SystemExit

        #### Get Cat Weights - Assures Symmetry Based on Last Defined Weight ####
        fieldList = ["CATEGORY1", "CATEGORY2", "WEIGHT"]
        rows = DA.SearchCursor(self.catWeightsTable, fieldList)
        oneValid = False

        for row in rows:
            #### Assure no Epty Values ####
            for val in row:
                if val in [None, ""]:
                    self.intersectObject.cleanUp()
                    ARCPY.AddIDMessage("ERROR", 110494)
                    raise SystemExit

            #### Assure Correct Locale ####
            catX, catY, weight = row
            try:
                catX = int(catX)
                catY = int(catY)
                if type(weight) == str:
                    weight = UTILS.strToFloat(weight)
            except:
                self.intersectObject.cleanUp()
                ARCPY.AddIDMessage("ERROR", 110494)
                raise SystemExit

            goodWeight = weight >= 0 and weight <= 1
            if catX not in self.allCats or catY not in self.allCats or not goodWeight:
                self.intersectObject.cleanUp()
                ARCPY.AddIDMessage("ERROR", 110494)
                raise SystemExit
            else:
                oneValid = True
                self.cat2CatWeights[catX][catY] = weight
                self.cat2CatWeights[catY][catX] = weight

        del rows

        if not oneValid:
            self.intersectObject.cleanUp()
            ARCPY.AddIDMessage("ERROR", 110494)
            raise SystemExit

    def assignSignificance(self):
        zeroRelationships = self.cat2CatWeights[0]
        self.coldNotSig = 0
        self.hotNotSig = 0
        for i in range(1,3):
            coldKey = i * -1
            if zeroRelationships[coldKey] == 1.0:
                self.coldNotSig = coldKey
            if zeroRelationships[i] == 1.0:
                self.hotNotSig = i

    def checkWeightsVariance(self):
        #### Build Weights Matrix ####
        self.catWeightsMatrix = NUM.zeros((7,7), dtype = float)
        for row in range(-3, 4):
            for col in range(row, 4):
                self.catWeightsMatrix[row + 3, col + 3] = self.cat2CatWeights[row][col]
                self.catWeightsMatrix[col + 3, row + 3] = self.cat2CatWeights[row][col]

        if UTILS.compareFloat(self.catWeightsMatrix.var(), 0.0):
            #### No Variance ####
            self.intersectObject.cleanUp()
            ARCPY.AddIDMessage("ERROR", 110499)
            raise SystemExit

    def coreSolve(self):

        #### Set XY/Z Coords for KDTree Search ####
        if self.ssdo.useChordal:
            self.coords = self.ssdo.spheroidCoords
        else:
            self.coords = self.ssdo.xyCoords

        #### Keep Track of Hypothesis Test Significance from Original Hot Spot Tests ####
        #### If Exclude, then to be Included in Core Analysis then Either X or Y must be Sig ####
        self.xSig =  NUM.logical_or(self.x < self.coldNotSig, self.x > self.hotNotSig)
        self.ySig = NUM.logical_or(self.y < self.coldNotSig, self.y > self.hotNotSig)
        self.xySig = NUM.logical_or(self.xSig, self.ySig)
        self.numSig = self.xySig.sum()
        self.ids = NUM.asarray(NUM.where(self.xySig)[0], dtype = NUM.int32)

        #### Core C++ Calculation Class ####
        self.seed = UTILS.getSetRandomSeedMax(seedMax = 1000000)
        self.numThreads = UTILS.getNumberOfThreadsDefault()
        self.fuzzy_kappa_core = ARC._ss.FuzzyKappa(self.coords, self.x, self.y, self.catWeightsMatrix, self.ids,
                                                   self.excludeNonSig, self.numNeighs, self.permutations,
                                                   self.seed, self.numThreads)

        #### Fail to Complete Initial Solve ####
        #### Reasons: Bad Inputs, Track Cancel ####
        if not self.fuzzy_kappa_core.initial_solve:
            raise SystemExit

        #### Permutations ####
        if self.excludeNonSig:
            countAboveEqualPerms = self.fuzzy_kappa_core.do_subset_sims()
        else:
            countAboveEqualPerms = self.fuzzy_kappa_core.do_full_sims()

        if countAboveEqualPerms is None:
            raise SystemExit

        #### Assign C++ Members to Class ####
        #### Global ####
        self.avgSim = self.fuzzy_kappa_core.avg_sim
        self.expectedValue = self.fuzzy_kappa_core.expected_value
        self.kappa = self.fuzzy_kappa_core.kappa
        self.globalPValue = self.fuzzy_kappa_core.global_pvalue

        #### Local ####
        self.similarity = self.fuzzy_kappa_core.local_similarity
        self.permRes = self.fuzzy_kappa_core.local_expected_value
        self.kappaSim = self.fuzzy_kappa_core.local_kappa
        self.pVals = self.fuzzy_kappa_core.local_pvalues

    def solve(self):

        #### Threshold  to use compensated trees ####
        useMedian = 1
        if self.n > ThresholdForCompensateKDTree:
            useMedian = 0

        if self.ssdo.useChordal:
            self.coords = self.ssdo.spheroidCoords
        else:
            self.coords = self.ssdo.xyCoords

        self.kdTree = ARC._ss.KDTree(self.coords, leafsize = leafSize, use_median = useMedian)

        #### Sparse Info for Neighbors ####
        self.neighInfo = {}
        self.vx = {}
        self.vy = {}
        self.xSig =  NUM.logical_or(self.x < self.coldNotSig, self.x > self.hotNotSig)
        self.ySig = NUM.logical_or(self.y < self.coldNotSig, self.y > self.hotNotSig)
        self.xySig = NUM.logical_or(self.xSig, self.ySig)
        self.numSig = self.xySig.sum()

        if TEMP_WEIGHT_METHOD == "GAUSSIAN":
            self.weightingMethod = gaussian
        elif TEMP_WEIGHT_METHOD == "BISQUARE":
            self.weightingMethod = bisquare
        else:
            self.weightingMethod = interval

        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220564), 0, self.n, 1)
        self.similarity = NUM.zeros(self.n, dtype = float) 
        for i in range(self.n):
            info = self.kdTree.query(self.coords[i], k = self.knn, p = 2)
            distances, neighs = info
            localBandwidth = distances[-1]

            #### Sort Neighbor Ties ####
            sortedInds = NUM.lexsort((neighs, distances))
            neighs = neighs[sortedInds]
            distances = distances[sortedInds]

            #### Assure First Neighbor is Self ####
            if neighs[0] != i:
                allCoincident = distances[-1] == 0.0
                neighIndex = NUM.where(neighs == i)[0]
                if allCoincident:
                    #### All Coincident ####
                    if not len(neighIndex):
                        #### Self Not In Neighbor List ####
                        neighs[1:] = neighs[0:-1]
                        neighs[0] = i
                    else:
                        #### Switch Self in Neighbor List ####
                        neighs[neighIndex] = neighs[0]
                        neighs[0] = i
                else:
                    #### Switch Self in Neighbor List ####
                    neighs[neighIndex] = neighs[0]
                    neighs[0] = i

            #### Get Weights ####
            weights = self.weightingMethod(distances, localBandwidth)

            self.neighInfo[i] = (neighs, weights)

            #### Store Similarity Candidates ####
            xVals = self.x[neighs]
            yVals = self.y[neighs]
            vx = NUM.zeros(self.numCats, dtype = float)
            vy = NUM.zeros(self.numCats, dtype = float)

            #### Do X Map to Y First ####
            for catInd in range(self.numCats):
                cat = self.allCats[catInd]
                catWeightsX = NUM.zeros(self.knn, dtype = float)
                for nhInd in range(self.knn):
                    xValue = xVals[nhInd]
                    catWeightsX[nhInd] = self.cat2CatWeights[cat][xValue]
                ux = (catWeightsX * weights).max()
                vx[catInd] = ux

            #### Do Y to X ####
            for catInd in range(self.numCats):
                cat = self.allCats[catInd]
                catWeightsY = NUM.zeros(self.knn, dtype = float)
                for nhInd in range(self.knn):
                    yValue = yVals[nhInd]
                    catWeightsY[nhInd] = self.cat2CatWeights[cat][yValue]
                uy = (catWeightsY * weights).max()
                vy[catInd] = uy

            #### Store VX/VY ####
            self.vx[i] = vx
            self.vy[i] = vy

            vxIndex = self.xyCatIndex[self.y[i]]
            vyIndex = self.xyCatIndex[self.x[i]]
                
            self.similarity[i] = min(vx[vxIndex], vy[vyIndex])
            ARCPY.SetProgressorPosition()

        if self.excludeNonSig:
            #### Only Use Significant Features ####
            self.avgSim = self.similarity[self.xySig].mean()
            self.similarity[~self.xySig] = NUM.nan
            self.doSubsetSims()
        else:
            self.avgSim = self.similarity.mean()
            self.doFullSims()

    def doFullSims(self):

        #### Simulations ####
        self.permRes = NUM.zeros(self.n, dtype = float)
        self.pVals = NUM.zeros(self.n, dtype = float)
        self.pValCats = NUM.ones(self.n, dtype = NUM.int32) * 3
        self.kappaSim = NUM.zeros(self.n, dtype = float)
        simResSum = NUM.zeros(self.permutations, dtype = float)
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220558), 0, self.n, 1)
        for i in range(self.n):

            simRes = NUM.zeros(self.permutations, dtype = float)

            #### Hold Map X Constant ####
            vyIndex = self.xyCatIndex[self.x[i]]
            for perm in range(self.permutations):
                randJ = RAND.randint(0, self.n)
                vxIndex = self.xyCatIndex[self.y[randJ]]
                simResult = min(self.vx[i][vxIndex], self.vy[randJ][vyIndex])
                simRes[perm] = simResult
                simResSum[perm] += simResult

            ##### Hold Map Y Constant ####
            #vxIndex = self.xyCatIndex[self.y[i]]
            #for perm in range(self.permutations):
            #    randI = RAND.randint(0, self.n)
            #    vyIndex = self.xyCatIndex[self.x[randI]]
            #    simResult = min(self.vx[randI][vxIndex], self.vy[i][vyIndex])
            #    simRes[perm + self.permutations] = simResult
            #    simResSumY[perm] += simResult

            #### Store Location I's Contribution to P0 ####
            self.permRes[i] = simRes.mean()

            #### Assure Expected Value is not Zero (Lack of Variance that is Difficult to Detect) ####
            #### Avoid Zero Divide ####
            if UTILS.compareFloat(self.permRes[i], 1.0):
                self.intersectObject.cleanUp()
                ARCPY.AddIDMessage("ERROR", 110499)
                raise SystemExit

            #### Get Local Kappa ####
            self.kappaSim[i] = (self.similarity[i] - self.permRes[i]) / (1 - self.permRes[i])

            #### Local p-value ####
            #pv = 1 - (((simRes < self.similarity[i]).sum()) / (self.permutations + 1))
            #pv = ((self.similarity[i] < simRes).sum() + 1) / (self.permutations + 1)
            pv = STATS.oneSidedPermPV(simRes, self.similarity[i])
            self.pVals[i] = pv
            self.pValCats[i] = NUM.searchsorted(breaks, pv)

            ARCPY.SetProgressorPosition()

        #self.simResAvg = (simResSumX + simResSumY) / (self.n * 2)
        self.simResAvg = simResSum / self.n
        self.expectedValue = self.simResAvg.mean()
        self.kappa = (self.avgSim - self.expectedValue) / (1 - self.expectedValue)
        self.globalPValue = STATS.oneSidedPermPV(self.simResAvg, self.avgSim)
        self.globalZValue = (self.avgSim - self.expectedValue) / self.simResAvg.std()
        self.globalZPValue = STATS.zProb(self.globalZValue, type = 2)

    def doSubsetSims(self):

        #### Simulations ####
        self.permRes = NUM.zeros(self.n, dtype = float) * NUM.nan
        self.pVals = NUM.ones(self.n, dtype = float)
        self.pValCats = NUM.ones(self.n, dtype = NUM.int32) * 3
        self.kappaSim = NUM.zeros(self.n, dtype = float) * NUM.nan
        simResSum = NUM.zeros(self.permutations, dtype = float)
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220558), 0, self.n, 1)
        for i in range(self.n):
            if self.xySig[i]:

                simRes = NUM.zeros(self.permutations, dtype = float)

                #### Hold Map X Constant ####
                vyIndex = self.xyCatIndex[self.x[i]]
                for perm in range(self.permutations):
                    randJ = RAND.randint(0, self.n)
                    vxIndex = self.xyCatIndex[self.y[randJ]]
                    simResult = min(self.vx[i][vxIndex], self.vy[randJ][vyIndex])
                    simRes[perm] = simResult
                    simResSum[perm] += simResult

                ##### Hold Map Y Constant ####
                #vxIndex = self.xyCatIndex[self.y[i]]
                #for perm in range(self.permutations):
                #    randI = RAND.randint(0, self.n)
                #    vyIndex = self.xyCatIndex[self.x[randI]]
                #    simResult = min(self.vx[randI][vxIndex], self.vy[i][vyIndex])
                #    simRes[perm + self.permutations] = simResult
                #    simResSumY[perm] += simResult

                #### Store Location I's Contribution to P0 ####
                self.permRes[i] = simRes.mean()

                #### Assure Expected Value is not Zero (Lack of Variance that is Difficult to Detect) ####
                #### Avoid Zero Divide ####
                if UTILS.compareFloat(self.permRes[i], 1.0):
                    self.intersectObject.cleanUp()
                    ARCPY.AddIDMessage("ERROR", 110499)
                    raise SystemExit

                self.kappaSim[i] = (self.similarity[i] - self.permRes[i]) / (1 - self.permRes[i])

                #### Local p-value ####
                pv = STATS.oneSidedPermPV(simRes, self.similarity[i])
                self.pVals[i] = pv
                self.pValCats[i] = NUM.searchsorted(breaks, pv)

            ARCPY.SetProgressorPosition()

        self.simResAvg = simResSum / self.numSig 
        self.expectedValue = self.simResAvg.mean()
        self.kappa = (self.avgSim - self.expectedValue) / (1 - self.expectedValue)
        self.globalPValue = STATS.oneSidedPermPV(self.simResAvg, self.avgSim)

    def report(self):

        #### Create Output Text Table ####
        header = ARCPY.GetIDMessage(220532)
        sigPercStr = ARCPY.GetIDMessage(220554)
        numSig = self.n - self.numSig
        percSig = (numSig / self.n) * 100.
        sigPercVal = sigPercStr.format(str(numSig), UTILS.formatValue(percSig, "%0.2f"))
        if self.excludeNonSig:
            row1 = [ARCPY.GetIDMessage(220533), UTILS.formatValue(self.avgSim, "%0.4f")]
            row2 = [ARCPY.GetIDMessage(220534), UTILS.formatValue(self.expectedValue, "%0.4f")]
            row3 = [ARCPY.GetIDMessage(220536), UTILS.formatValue(self.kappa, "%0.4f")]
            row4 = [ARCPY.GetIDMessage(220542), UTILS.formatValue(self.globalPValue, "%0.4f")]
            row5 = [ARCPY.GetIDMessage(220537), sigPercVal]
            results =  [row1, row2, row3, row5]
            #results =  [row1, row2, row3, row4, row5]
        else:
            row1 = [ARCPY.GetIDMessage(220539), UTILS.formatValue(self.avgSim, "%0.4f")]
            row2 = [ARCPY.GetIDMessage(220540), UTILS.formatValue(self.expectedValue, "%0.4f")]
            row3 = [ARCPY.GetIDMessage(220541), UTILS.formatValue(self.kappa, "%0.4f")]
            row4 = [ARCPY.GetIDMessage(220542), UTILS.formatValue(self.globalPValue, "%0.4f")]
            row5 = [ARCPY.GetIDMessage(220538), sigPercVal]
            results =  [row1, row2, row3, row5]
            #results =  [row1, row2, row3, row4]

        outputTable = UTILS.outputTextTable(results, header = header,
                                            pad = 1, colPad=4, emphasizeHeadRow=False,
                                            returnHTMLMsg=True, force2Txt=False)

        ARCPY.AddMessage(outputTable)

        #### Create Output Weights Table ####
        weights = NUM.zeros((7,7), dtype = float)
        for row in range(-3, 4):
            for col in range(row, 4):
                weights[row+3, col+3] = self.cat2CatWeights[row][col]
                weights[col+3, row+3] = self.cat2CatWeights[col][row]

        header = ARCPY.GetIDMessage(220549)
        labels = [220543, 220544, 220545, 84511, 220546, 220547, 220548]
        labels = [""] + [ARCPY.GetIDMessage(i) for i in labels]
        weightRes = [labels]

        for row in range(7):
            rowVals = [labels[row + 1]]
            for col in range(7):
                rowVals.append(UTILS.formatValue(weights[row, col], "%0.2f"))

            weightRes.append(rowVals)

        justify = ["left", "right", "right", "right", "right", "right", "right", "right"]
        outputTable = UTILS.outputTextTable(weightRes, header = header, justify = justify,
                                            pad = 1, colPad=2, emphasizeHeadRow=False,
                                            returnHTMLMsg=True, force2Txt=False)
            
        ARCPY.AddMessage(outputTable)

        #### Create Output Transition Tables ####
        header = ARCPY.GetIDMessage(220550)
        headerP = ARCPY.GetIDMessage(220551)
        labels = [220555, 220543, 220544, 220545, 84511, 220546, 220547, 220548]
        labels = [ARCPY.GetIDMessage(i) for i in labels]
        countLabels = labels + [ARCPY.GetIDMessage(84355)]
        #headerColumns = ["@@none", UTILS.buildTableCell(ARCPY.GetIDMessage(220556), align = "center", colSpan=9), "@@none",
        #                  "@@none", "@@none", "@@none", "@@none", "@@none", "@@none"]
        #headerColumnsP = ["@@none", UTILS.buildTableCell(ARCPY.GetIDMessage(220556), align = "center", colSpan=8), "@@none",
        #                  "@@none", "@@none", "@@none", "@@none", "@@none"]

        headerColumns = ["", UTILS.buildTableCell(ARCPY.GetIDMessage(220556), align = "center", colSpan=8), "@@none",
                          "@@none", "@@none", "@@none", "@@none", "@@none", "@@none"]
        headerColumnsP = ["", UTILS.buildTableCell(ARCPY.GetIDMessage(220556), align = "center", colSpan=7), "@@none",
                          "@@none", "@@none", "@@none", "@@none", "@@none"]
        res = [headerColumns]
        resP = [headerColumnsP]
        res.append(countLabels)
        resP.append(labels)
        binBreaks = NUM.arange(-3, 5, dtype = NUM.int32)
        totalCounts = NUM.zeros(7, dtype = NUM.int32)
        for row in range(7):
            cat = binBreaks[row]
            rowVals = [labels[row + 1]]
            rowValsP = [labels[row + 1]]
            rowCatBool = self.x == cat
            rowN = rowCatBool.sum()
            if not rowN:
                rowVals += ["0"] * 8
                rowValsP += [UTILS.formatValue(0.0, "%0.2f")] * 7
            else:
                colVals = self.y[rowCatBool]
                counts = NUM.histogram(colVals, binBreaks)[0]
                rowVals += [str(i) for i in counts]
                rowVals.append(len(colVals))
                totalCounts += counts
                rowValsP += [UTILS.formatValue((i/rowN) * 100, "%0.2f") for i in counts]

            res.append(rowVals)
            resP.append(rowValsP)

        #### Add Total Column Counts ####
        res.append([ARCPY.GetIDMessage(84355)] + [str(i) for i in totalCounts] + [str(self.n)])

        countJustify = justify + ["right"]
        outputTable = UTILS.outputTextTable(res, header = header, justify = countJustify,
                                            pad = 1, colPad=2, emphasizeHeadRow=False,
                                            returnHTMLMsg=True, force2Txt=False)
        ARCPY.AddMessage(outputTable)

        outputTableP = UTILS.outputTextTable(resP, header = headerP, justify = justify,
                                             pad = 1, colPad=2, emphasizeHeadRow=False,
                                             returnHTMLMsg=True, force2Txt=False)
        ARCPY.AddMessage(outputTableP)

    def createOutput(self, outputFC):
        ARCPY.env.overwriteOutput = True

        #### Validate Output Workspace ####
        ERROR.checkOutputPath(outputFC)

        #### Prepare Derived Variables for Output Feature Class ####
        outPath, outName = OS.path.split(outputFC)

        #### Create/Populate Dictionary of Candidate Fields ####
        fieldOrder = []
        candidateFields = {}

        #### Copy Analysis Hot Spot Fields ####
        candidateField = SSDO.CandidateField("GI_BIN_1", "LONG", data = self.x, 
                                             alias = ARCPY.GetIDMessage(220594))
        candidateFields["GI_BIN_1"] = candidateField
        fieldOrder.append("GI_BIN_1")

        candidateField = SSDO.CandidateField("GI_BIN_2", "LONG", data = self.y, 
                                             alias = ARCPY.GetIDMessage(220595))
        candidateFields["GI_BIN_2"] = candidateField
        fieldOrder.append("GI_BIN_2")

        #### Create Input Significance Fields ####
        sigData = NUM.array([classifySig[i] for i in self.x])
        candidateField = SSDO.CandidateField("GI_SIG_1", "TEXT", data = sigData, 
                                             alias = ARCPY.GetIDMessage(220555),
                                             length = 50)
        candidateFields["GI_SIG_1"] = candidateField
        fieldOrder.append("GI_SIG_1")

        sigData = NUM.array([classifySig[i] for i in self.y])
        candidateField = SSDO.CandidateField("GI_SIG_2", "TEXT", data = sigData, 
                                             alias = ARCPY.GetIDMessage(220556),
                                             length = 50)
        candidateFields["GI_SIG_2"] = candidateField
        fieldOrder.append("GI_SIG_2")

        #### Sim Index ####
        candidateField = SSDO.CandidateField("SIM_VALUE", "DOUBLE", self.similarity,
                                             alias = ARCPY.GetIDMessage(220552),
                                             checkNullValues = True)
        candidateFields["SIM_VALUE"] = candidateField
        fieldOrder.append("SIM_VALUE")

        candidateField = SSDO.CandidateField("EXP_SIM", "DOUBLE", self.permRes,
                                             alias = ARCPY.GetIDMessage(220553),
                                             checkNullValues = True)
        candidateFields["EXP_SIM"] = candidateField
        fieldOrder.append("EXP_SIM")

        candidateField = SSDO.CandidateField("KAPPA", "DOUBLE", self.kappaSim,
                                             alias = ARCPY.GetIDMessage(220541),
                                             checkNullValues = True)
        candidateFields["KAPPA"] = candidateField
        fieldOrder.append("KAPPA")

        #### Create Standard Text Field for Cat Pairs for Heat Map Bug ####
        catData = NUM.array([classifyPairs[i] for i in self.catPairs])
        candidateField = SSDO.CandidateField("CAT_PAIR", "TEXT", data = catData, 
                                             length = 100,
                                             alias = ARCPY.GetIDMessage(220557))
        candidateFields["CAT_PAIR"] = candidateField
        fieldOrder.append("CAT_PAIR")


        self.ssdo.output2NewFC(outputFC, candidateFields, fieldOrder = fieldOrder)

    def buildOutputGroupLayer(self, outputFC):
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220563))
        tempLYRX = UTILS.getTempLayerPath("CAT_PAIR_TEMP")

        layers = []
        fieldNames = ["SIM_VALUE", "KAPPA", "CAT_PAIR"]
        fieldAliases = [ARCPY.GetIDMessage(220552), ARCPY.GetIDMessage(220541), ARCPY.GetIDMessage(220557)]
        if self.ssdo.shapeType.upper() == "POINT":
            lyrx = ["HotSpot_SimIndex_point.lyrx", "HotSpot_Kappa_point.lyrx", "HotSpot_CatPair_point.lyrx"]
        elif self.ssdo.shapeType.upper() == "POLYGON":
            lyrx = ["HotSpot_SimIndex_polygon.lyrx", "HotSpot_Kappa_polygon.lyrx", "HotSpot_CatPair_polygon.lyrx"]
        else:
            lyrx = ["HotSpot_SimIndex_line.lyrx", "HotSpot_Kappa_line.lyrx", "HotSpot_CatPair_line.lyrx"]

        for ind, fieldName in enumerate(fieldNames):
            outLayer = DM.MakeFeatureLayer(outputFC, fieldAliases[ind])
            if fieldName == "CAT_PAIR":
                #### Localize LYRX for CAT PAIR Using Temp File ####
                UTILS.buildLocaleCIMLayer(lyrx[ind], -1, data=None, outPath=tempLYRX)
                outLayer = DM.ApplySymbologyFromLayer(outLayer, tempLYRX)
            else:
                outLayer = DM.ApplySymbologyFromLayer(outLayer, OS.path.join(UTILS.pathLayers, lyrx[ind]))
            layers.append(outLayer)

        outputName = OS.path.basename(outputFC)
        if outputName.lower().endswith(".shp"):
            outputName = outputName[: -4]
        groupLayerResult = ARCPY.gp.MakeGroupLayer(outputName, layers)
        groupLayer = groupLayerResult.getOutput(0)

        if OS.path.exists(tempLYRX):
            OS.remove(tempLYRX)

        return groupLayer

    def createOutputSimTable(self, simTable):

        candidateFields = [SSDO.CandidateField("SIM_VALUE", "DOUBLE", data = self.permRes, alias = "Simulation Values"),
                           SSDO.CandidateField("KAPPA_SIM", "DOUBLE", data = self.kappaSim, alias = "Simulation Kappas")]

        ARC._ss.output_table_from_candidate_fields(simTable, len(self.permRes), candidateFields)


def execute(parameters, messages):
    ARCPY.env.overwriteOutput = True
    inputFC1 = parameters[0]
    inputFC2 = parameters[1]
    outputFC = UTILS.getTextParameter(2, parameters)
    numNeighs = UTILS.getNumericParameter(3, parameters)
    permutations = UTILS.getNumericParameter(4, parameters)
    catWeightMethod = UTILS.getTextParameter(5, parameters)

    if catWeightMethod == "TABLE":
        catWeightsTable = UTILS.getTextParameter(7, parameters)
        catValueTable = None
    else:
        catWeightsTable = None
        catValueTable = parameters[6].value

    if numNeighs is None:
        numNeighs = 8

    excludeNonSig = parameters[8].value 

    #### Create Temp Intersect Object ####
    intersectObject = TempPolygonIntersect(inputFC1, "GI_BIN", inputFC2, "GI_BIN", outputFC)
    
    #### Run Analysis ####
    k = HotSpotMapComparison(intersectObject, numNeighs = numNeighs, permutations = permutations,
                             catWeightMethod = catWeightMethod, catValueTable = catValueTable,
                             catWeightsTable = catWeightsTable, excludeNonSig = excludeNonSig)

    #### Report ####
    k.report()

    #### Create Output ####
    k.createOutput(outputFC)

    if intersectObject.migrate64:
        try:
            DM.MigrateObjectIDTo64Bit(in_datasets=outputFC) #self.intersectFC
        except:
            #### Temp Try Except Until They Fix HasOID64 on Describe ####
            pass

    #### Derived Output ####
    ARCPY.SetParameter(9, round(k.avgSim, 4))
    ARCPY.SetParameter(10, round(k.expectedValue, 4))
    ARCPY.SetParameter(11, round(k.kappa, 4))
    #ARCPY.SetParameter(12, round(k.globalPValue, 4))

    if UTILS.hasActiveMap():
        groupLayer = k.buildOutputGroupLayer(outputFC)
        ARCPY.SetParameter(12, groupLayer)
    #ARCPY.SetParameter(13, groupLayer)

    #### Clean Up ####
    intersectObject.cleanUp()

def postExecute(parameters):
    if UTILS.hasActiveMap():
        postExecuteRun(parameters)


def postExecuteRun(parameters):

    #### Charts ####
    charts = []
    customLabels = [ARCPY.GetIDMessage(220543), ARCPY.GetIDMessage(220544),
                    ARCPY.GetIDMessage(220545), ARCPY.GetIDMessage(84511),
                    ARCPY.GetIDMessage(220546), ARCPY.GetIDMessage(220547),
                    ARCPY.GetIDMessage(220548)]

    #### Heat Map Chart ####
    title = ARCPY.GetIDMessage(220535)
    heat = ARCPY.charts.MatrixHeat(x = "GI_SIG_2", y = "GI_SIG_1", aggregation = "count")
    heat.title = title
    heat.xAxis.title = ARCPY.GetIDMessage(220556)
    heat.yAxis.title = ARCPY.GetIDMessage(220555)
    heat.xAxis.sort = customLabels
    heat.yAxis.sort = customLabels
    charts.append(heat)

    #### Stacked Bar Chart ####
    title = ARCPY.GetIDMessage(220596)
    bar = ARCPY.charts.Bar(x = "GI_SIG_1", splitCategory = "GI_SIG_2", rotated = True, aggregation = "count",
                            multiSeriesDisplay = "stacked100")
    bar.title = title
    bar.xAxis.title = ARCPY.GetIDMessage(220597)
    bar.yAxis.title = ARCPY.GetIDMessage(220598)
    bar.legend.title = ARCPY.GetIDMessage(220599)
    bar.xAxis.sort = customLabels
    bar.sortSeries = customLabels
    bar.color = [i for i in UTILS.hotSpotHexColors]
    bar.legend.title = ARCPY.GetIDMessage(220599)
    charts.append(bar)

    #### Move the main result feature class into group layer ####
    catLyrName = ARCPY.GetIDMessage(220557)
    simLyrName = ARCPY.GetIDMessage(220552)
    kappaLyrName = ARCPY.GetIDMessage(220541)
    try:
        outputFC = UTILS.getTextParameter(2, parameters)
        project = ARCPY.mp.ArcGISProject('CURRENT')
        mapObj = project.activeMap

        #### Remove Base Layer ####
        layers2Delete = []
        layerMainName = OS.path.basename(outputFC)
        isSHP = layerMainName.lower().endswith(".shp")
        if isSHP:
            layerMainName = layerMainName[0: -4]

        layerNames = mapObj.listLayers(layerMainName)
        mainOutputFound = False
        for layer in layerNames:
            if not layer.isGroupLayer:
                mainOutputFound = True
                layers2Delete.append(layer)
        if not mainOutputFound:  # Try to find in ModelBuilder GroupLayer
            layerNames = mapObj.listLayers(f"*:{layerMainName}")
            for layer in layerNames:
                if not layer.isGroupLayer:
                    layers2Delete.append(layer)

        #### Remove Empty Group Layer ####
        for layer in mapObj.listLayers(UTILS.getTextParameter(12, parameters)):
            if layer.isGroupLayer:
                layerList = layer.listLayers()
                if not len(layerList):
                    layers2Delete.append(layer)
                else:
                    for lyr in layerList:
                        if isSHP:
                            #### Delete Hot Spot Chart ####
                            cim = lyr.getDefinition('V3')
                            if len(cim.charts):
                                cim.charts = []
                            lyr.setDefinition(cim)

                        if lyr.name == catLyrName:
                            #### Get CIM to Change Properties ####
                            cim = lyr.getDefinition('V3')

                            #### Add Cat Pair Charts ####
                            cim.charts = []
                            for chart in charts:
                              chart.dataSource = lyr
                              cim.charts.append(chart._getCIM())

                            #### Update Heat Map Chart ####
                            heatChart = cim.charts[0]
                            heatChart.generalProperties.gridLineSymbolProperties.width = .2
                            heatChart.generalProperties.gridLineSymbolProperties.color.values = [178, 178, 178, 100]
                            if hasattr(cim.renderer, "groups") and hasattr(cim.renderer.groups[0], "heading"):
                                cim.renderer.groups[0].heading = ARCPY.GetIDMessage(220637)
                            lyr.setDefinition(cim)

                        elif lyr.name in [simLyrName, kappaLyrName]:
                            cim = lyr.getDefinition('V3')
                            cim.renderer.heading = lyr.name
                            if lyr.name == simLyrName:
                                #### Localize Manual Break Labels ####
                                for ind, br in enumerate(cim.renderer.breaks):
                                    br.label = simLabels[ind]
                            lyr.setDefinition(cim)

                        if lyr.name == simLyrName:
                            lyr.visible = True
                        else:
                            lyr.visible = False

        for layer in layers2Delete:
            mapObj.removeLayer(layer)

    except:
        pass
