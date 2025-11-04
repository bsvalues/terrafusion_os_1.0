# coding: utf-8
"""
Tool Name:     Incremental Spatial Autocorrelation
Source Name:   MoransI_Increment.py
Version:       ArcGIS 10.1
Author:        Environmental Systems Research Institute Inc.
Description:   Computes Global Moran's I statistic
"""

################### Imports ########################
import os as OS
import numpy as NUM
import collections as COLL
import arcgisscripting as ARC
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.da as DA
import SSUtilities as UTILS
import SSDataObject as SSDO
import Stats as STATS
import WeightsUtilities as WU
import gapy as GAPY
import locale as LOCALE
from time import time

import base64
from io import BytesIO
import matplotlib
matplotlib.use('Agg')
from matplotlib import pyplot as plt
from mpl_toolkits.axisartist.axislines import Axes
GLOBAL_OUTPUT_FIG_SIZE = (9, 6)

LOCALE.setlocale(LOCALE.LC_ALL, '')

################ Output Field Names #################
iaFieldNames = ["Distance", "MoransI", "ExpectedI",
                "Variance", "z-score", "p-value"]

def execute(parameters, messages):
    """Retrieves the parameters from the User Interface and executes the
    appropriate commands."""

    #### Input Features and Variable ####
    inputFC = UTILS.getTextParameter(0, parameters)
    varName = UTILS.getTextParameter(1, parameters).upper()

    #### Number of Distance Thresholds ####
    nIncrements = UTILS.getNumericParameter(2, parameters)
    if nIncrements > 30:
        nIncrements = 30

    #### Starting Distance ####
    begDist = UTILS.getNumericParameter(3, parameters)
    if begDist:
        begDist = float(begDist)

    #### Step Distance ####
    dIncrement = UTILS.getNumericParameter(4, parameters)
    if dIncrement:
        dIncrement = float(dIncrement)

    #### EUCLIDEAN or MANHATTAN ####
    distanceConcept = UTILS.getTextParameter(5, parameters).upper().replace(" ", "_")
    concept = WU.conceptDispatch[distanceConcept]

    #### Row Standardized ####
    rowStandard = parameters[6].value

    #### Output Table ####
    outputTable = UTILS.getTextParameter(7, parameters)

    #### Report File ####
    reportFile = UTILS.getTextParameter(8, parameters)

    #### Create a Spatial Stats Data Object (SSDO) ####
    ssdo = SSDO.SSDataObject(inputFC, useChordal = True)

    #### Set Unique ID Field ####
    masterField = UTILS.setUniqueIDField(ssdo)

    #### Populate SSDO with Data ####
    ssdo.obtainData(masterField, [varName], minNumObs = 4,
                    requireSearch = True, warnNumObs = 30)

    #### Run Analysis ####
    gi = GlobalI_Step(ssdo, varName, nIncrements = nIncrements,
                      begDist = begDist, dIncrement = dIncrement,
                      concept = concept, rowStandard = rowStandard, runCPP=True)

    #### Report Results ####
    reportTable = gi.report()

    #### Optionally Create Output ####
    if outputTable:
        outputTable, dbf = gi.createOutput(outputTable)
        if dbf:
            UTILS.setParameterAsText(7, outputTable, parameters)
        chart = ARCPY.Chart(ARCPY.GetIDMessage(84334))
        chart.type = "line"
        chart.title = ARCPY.GetIDMessage(84334)

        #### Assign X Axis Field ####
        chart.xAxis.field = "Distance"
        distanceOut = UTILS.getLocalizedUnitType(ssdo.distanceInfo.outputString)
        chart.xAxis.title = ARCPY.GetIDMessage(84077).format(distanceOut)

        #### Assign Y Axis Fields ####
        chart.yAxis.field = "z_score"
        chart.yAxis.title = ARCPY.GetIDMessage(220605)

        if gi.firstPeakDistance is not None and gi.firstPeakDistance != gi.maxPeakDistance:
            guide = chart.xAxis.guides.new('yaxis-guide', valueFrom=gi.firstPeakDistance, label=ARCPY.GetIDMessage(84331))
        if gi.maxPeakDistance is not None:
            guide = chart.xAxis.guides.new('yaxis-guide', valueFrom=gi.maxPeakDistance, label=ARCPY.GetIDMessage(84332))

        parameters[7].charts = [chart]

    if reportFile:
        gi.createOutputGraphic(reportFile, gi.firstPeakInd, gi.maxPeakInd)

    #### Set Peak Distances ####
    firstPeak = gi.firstPeakDistance
    if firstPeak is None:
        firstPeak = ""
    UTILS.setParameterAsText(9, firstPeak, parameters)

    maxPeak = gi.maxPeakDistance
    if maxPeak is None:
        maxPeak = ""
    UTILS.setParameterAsText(10, maxPeak, parameters)


class GlobalI_Step(object):
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

    def __init__(self, ssdo, varName, nIncrements = 10,
                 begDist = None, dIncrement = None,
                 concept = "EUCLIDEAN", rowStandard = True,
                 stdDeviations = 0, numNeighs = 0,
                 silent = False, stopMax = None,
                 runCPP=False, permNum=0, do_opt=1):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())
        self.idsWarn = []
        self.idsMax = []

        #### Initialize Data ####
        self.initialize()

        #### Construct Based on SWM File or On The Fly ####
        if runCPP:
            self.construct_cpp()
        else:
            self.construct()


    def initialize(self):
        """Populates the instance of the Spatial Statistics Data
        Object (SSDataObject) and resolves a default distance threshold
        if none given.
        """

        #### Shorthand Attributes ####
        ssdo = self.ssdo
        varName = self.varName
        self.master2Order = ssdo.master2Order
        masterField = ssdo.masterField
        concept = self.concept

        #### Populate SSDO with Data ####
        field = ssdo.fields[varName]
        self.y = field.returnDouble()
        self.numObs = ssdo.numObs
        gaExtent = UTILS.get92Extent(ssdo.extent)

        #### Set Envelope or Slice ####
        if ssdo.useChordal:
            softMaxExtent = ssdo.sliceInfo.maxExtent
            hardMaxExtent = ARC._ss.get_max_gcs_distance(ssdo.spatialRef)
            maxExtent = min(softMaxExtent, hardMaxExtent)
        else:
            env = UTILS.Envelope(ssdo.extent)
            maxExtent = env.maxExtent

        outlierInfo =  None
        #### Set Maximum Distance Allowed ####
        extentBool = (self.begDist is not None) or (self.dIncrement is not None) or ssdo.useChordal
        if extentBool:
            #### If User Provides Either Input, Set to 75% Max Extent ####
            self.maxDistance = maxExtent * 0.75
            self.allDefaults = False
        else:
            #### Set to Diameter of Standard Distance ####
            outlierInfo = UTILS.LocationInfo(ssdo, concept = self.concept)
            self.maxDistance = UTILS.standardDistanceCutoff(ssdo.uniqueXY)
            self.allDefaults = True

        #### Determine Starting Distance ####
        if self.begDist is not None and self.begDist > self.maxDistance:
            ARCPY.AddIDMessage("WARNING", 929)
            self.begDist = None
        self.calculatedBegDist = self.begDist is None
        self.calculatedIncDist = self.dIncrement is None
        self.isGridData = False
        if self.calculatedBegDist or self.calculatedIncDist:
            if not outlierInfo:
                outlierInfo = UTILS.LocationInfo(ssdo, concept = self.concept)
            dataOutlier = outlierInfo.getNearestNeighborInfo(stdDeviations = self.stdDeviations)
            cellSize, threshold, avgDist, outliers = dataOutlier
            self.isGridData = outlierInfo.stdDist == 0

            if self.begDist is None:
                self.begDist = threshold
            if self.dIncrement is None:
                self.dIncrement = avgDist
        #### Negative Values Not Valid ####
        if self.begDist < 0:
            ARCPY.AddIDMessage("ERROR", 933)
            raise SystemExit()

        #### Determine All Distance Cutoffs ####
        cutoffs = UTILS.createCutoffsStep(self.begDist, self.dIncrement,
                                          self.nIncrements)

        #### Check Cutoff Values ###
        countMaxSet = (cutoffs > self.maxDistance).sum()
        if countMaxSet:
            #### Throw Warning if ANY Distances Larger than Max Extent ####
            if (not self.calculatedBegDist) and (not self.calculatedIncDist):
                ARCPY.AddIDMessage("WARNING", 1285, countMaxSet, self.nIncrements)

            #### Reset Minimum Dist If Beginning Distance > Max Distance ####
            if self.begDist > self.maxDistance:
                self.begDist = self.maxDistance * .2

            #### Recalculate Cutoffs ####
            cutoffs = UTILS.createCutoffsMaxDist(self.begDist, self.maxDistance,
                                                 self.nIncrements)
            self.dIncrement = cutoffs[1] - cutoffs[0]

        #### Print Threshold Distance ####
        stepMax = cutoffs[-1]
        thresholdStr = ssdo.distanceInfo.printDistance(self.begDist)
        threshBool = self.calculatedBegDist

        #### Throw Warnings ####
        if threshBool and not self.silent:
            ARCPY.AddIDMessage("WARNING", 853, thresholdStr)

        largerHalf = self.begDist > (maxExtent * 0.51)
        passedMax = stepMax > maxExtent
        if largerHalf and not self.calculatedBegDist:
            ARCPY.AddIDMessage("WARNING", 934)
        elif passedMax and not self.calculatedIncDist:
            ARCPY.AddIDMessage("WARNING", 935)

        #### Create Results Labels and Field Names ####
        resLabels = [ARCPY.GetIDMessage(84179), ARCPY.GetIDMessage(84148),
                     ARCPY.GetIDMessage(84149), ARCPY.GetIDMessage(84150),
                     ARCPY.GetIDMessage(84151), ARCPY.GetIDMessage(84152)]
        self.resLabels = [ i.replace(":", "").strip() for i in resLabels ]

        #### Set Attributes ####
        self.stepMax = stepMax
        self.cutoffs = NUM.array(cutoffs)
        self.reverseOrder = range(self.nIncrements - 1, -1, -1)
        self.cutoffOrder = range(self.nIncrements)
        self.largestDistBand = self.cutoffs[-1]

    def construct(self):
        """Constructs the neighborhood structure for each feature and
        dispatches the appropriate values for the calculation of the
        statistic."""

        #### Shorthand Attributes ####
        ssdo = self.ssdo
        numObs = ssdo.numObs
        master2Order = ssdo.master2Order
        masterField = ssdo.masterField
        concept = self.concept
        iterVals = UTILS.ssRange(numObs)
        rowStandard = self.rowStandard
        wType = 1

        yVar = NUM.var(self.y)
        if NUM.isnan(yVar) or yVar <= 0.0:
            ARCPY.AddIDMessage("ERROR", 906)
            raise SystemExit()

        #### Create Results Array ####
        self.giResults = NUM.zeros((self.nIncrements, 6))
        self.ySum = NUM.zeros((self.nIncrements,), float) 

        #### Run Max Distance and Bin NN ####
        msgProg = ARCPY.GetIDMessage(84423)
        self.rowSum = NUM.zeros((numObs, self.nIncrements), float)
        self.weightVals = NUM.ones((numObs, self.nIncrements), float)
        self.hasNeighs = NUM.ones((numObs, self.nIncrements), bool)
        self.noNeighs = NUM.zeros((self.nIncrements,), int)
        self.breaks = COLL.defaultdict(NUM.array)
        self.numFeatures = NUM.ones((self.nIncrements,), int) * ssdo.numObs
        self.totalNeighs = NUM.zeros((self.nIncrements,), float)
        
        #### Add Progress ####
        ARCPY.SetProgressor("step", msgProg, 0, ssdo.numObs, 1)
        if not self.silent:
            ARCPY.AddMessage("\n" + msgProg)

        gaSearch = GAPY.ga_nsearch(ssdo.gaTable)
        gaSearch.init_nearest(self.stepMax, self.numNeighs, concept.lower())
        gaTable = ssdo.gaTable
        numCalcs = 0
        warnThrown = (self.silent == True) or (self.allDefaults == True)
        self.warnNeighsExceeded = warnThrown
        self.maxNeighsExceeded = warnThrown
        self.completed = False
        if self.isGridData:
            self.cutoffs = self.cutoffs + 0.001

        nb = ARC._ss.NeighborBins(gaTable, gaSearch, self.cutoffs)
        c = 0
        for counts, breaks in nb:
            numDists = len(breaks)
            if numDists:
                #### Add Warning if Possibly Going to Run out of Memory ####
                numCalcs += numDists
                if numCalcs > 20000000 and not warnThrown:
                    if not self.silent:
                        ARCPY.AddIDMessage("WARNING", 1389)
                    warnThrown = True

                self.breaks[c] = breaks
                noNeighInd = NUM.where(counts == 0)[0]
                startIndex = 0

                if len(noNeighInd):
                    for noInd in noNeighInd:
                        self.noNeighs[noInd] += 1
                        self.numFeatures[noInd] -= 1
                        self.hasNeighs[c,noInd] = False
                        startIndex += 1

                counts2Use = counts[startIndex:]
                self.ySum[startIndex:] += self.y[c]
                if rowStandard:
                    self.weightVals[c,startIndex:] = 1./counts2Use
                    self.rowSum[c,startIndex:] = 1.0
                else:
                    self.rowSum[c,startIndex:] = counts2Use * 1.0
                self.totalNeighs += counts
            else:
                #### Never Included in Spatial Autocorrelation ####
                for ind in UTILS.ssRange(self.nIncrements):
                    self.noNeighs[ind] += 1
                    self.numFeatures[ind] -= 1

            #### Warn Number of Neighs ####
            if numDists >= WU.warnNumberOfNeighbors:
                self.idsWarn.append(self.ssdo.order2Master[c])
                if not self.warnNeighsExceeded:
                    ARCPY.AddIDMessage("WARNING", 1420,
                                       WU.warnNumberOfNeighbors)
                    self.warnNeighsExceeded = True
            c += 1
            ARCPY.SetProgressorPosition()
        
        #### Report if All Features Have No Neighbors ####
        noNeighsAllInd = NUM.where(self.totalNeighs == 0.0)[0]
        if len(noNeighsAllInd):
            cutoffNoNeighs = self.cutoffs[noNeighsAllInd]
            dist = [UTILS.formatValue(i, "%0.2f") for i in cutoffNoNeighs]
            distanceStr = ", ".join(dist)
            ARCPY.AddIDMessage("ERROR", 1388, distanceStr)
            raise SystemExit()

        #### Report on Features with Large Number of Neighbors ####
        throwWarnings = (self.silent == True) or (self.allDefaults == True)
        if not throwWarnings:
            self.reportWarnings()
            self.reportMaximums()

        #### Create Deviation Variables ####
        self.yBar = self.ySum / self.numFeatures
        self.yDev = NUM.zeros((numObs, self.nIncrements), float)
        self.denom = NUM.ones((self.nIncrements,), float) 
        self.yDev4Sum = NUM.ones((self.nIncrements,), float) 
        for inc in range(self.nIncrements):
            mask = self.hasNeighs[:,inc]
            yVals = self.y[mask]
            yDev = yVals - self.yBar[inc]
            self.denom[inc] = (yDev**2.0).sum()
            self.yDev4Sum[inc] = (yDev**4.0).sum()
            self.yDev[:,inc][mask] = yDev

        #### Calculate Statistic ####
        msgProg = ARCPY.GetIDMessage(84280)
        ARCPY.SetProgressor("step", msgProg, 0, ssdo.numObs, 1)
        if not self.silent:
            ARCPY.AddMessage("\n" + msgProg)
        self.numer = NUM.zeros((self.nIncrements,), float)
        self.s1 = NUM.zeros((self.nIncrements,), float)
        self.colSum = NUM.zeros((numObs, self.nIncrements), float)
        for i in UTILS.ssRange(ssdo.numObs):
            if i in self.breaks:
                binIndices = self.breaks[i]
                yDev = self.yDev[i]
                gaSearch.search_by_idx(i)
                w0 = self.weightVals[i]
                c = 0

                for nh in gaSearch:
                    start = binIndices[c]
                    yDev1 = self.yDev[nh.idx][start:]
                    w1 = self.weightVals[nh.idx][start:]
                    w0c = w0[start:]
                    yDev0 = yDev[start:]
                    values = (yDev1 * w0c) * yDev0
                    self.numer[start:] += values
                    self.s1[start:] += ((w0c + w1)**2.0)
                    self.colSum[i][start:] += w1
                    c += 1

            ARCPY.SetProgressorPosition()

        #### Calculate Moran's I ####
        self.calculate()

        #### Pack Results ####
        for ind in self.cutoffOrder:
            res = (self.cutoffs[ind], self.gi[ind], self.ei[ind],
                   self.vi[ind], self.zi[ind], self.pVal[ind])
            self.giResults[ind] = res

        if not self.silent:
            ARCPY.AddMessage("\n")

        #### Calculate Peak Distances ####
        ziResults = [ value[4] for value in self.giResults ]
        firstPeakInd, maxPeakInd = UTILS.returnPeakIndices(ziResults,
                                                  levelFilter = 1.65)

        #### Add Warning if No Valid Peaks are Found ####
        if firstPeakInd is None and maxPeakInd is None:
            if not self.silent:
                ARCPY.AddIDMessage("WARNING", 1284)

        if firstPeakInd is None:
            self.firstPeakDistance = None
            self.firstPeakZ = None
        else:
            self.firstPeakDistance = self.cutoffs[firstPeakInd]
            self.firstPeakZ = self.zi[firstPeakInd]


        if maxPeakInd is None:
            self.maxPeakDistance = None
            self.maxPeakZ = None
        else:
            self.maxPeakDistance = self.cutoffs[maxPeakInd]
            self.maxPeakZ = self.zi[maxPeakInd]

        self.firstPeakInd = firstPeakInd
        self.maxPeakInd = maxPeakInd
        self.completed = True

        return True

    def calculate(self):
        """Calculate Moran's I Statistic."""

        self.s1 = .5 * self.s1
        s1 = self.s1
        n = self.numFeatures * 1.0
        if self.rowStandard:
            s0 = n
        else:
            s0 = self.totalNeighs 
        s2 = ((self.rowSum + self.colSum)**2.0).sum(0)
        self.s2 = s2
        self.ei = -1. / (n - 1)
        self.squareExpectedI = self.ei**2
        self.n = n
        scale = n / s0
        s02 = s0 * s0
        n2 = n * n
        n2s1 = n2 * s1
        ns2 = n * s2
        self.gi = (scale * (self.numer/self.denom))
        yDev4Sum = self.yDev4Sum / n
        yDevsqsq = (self.denom / n)**2.0
        b2 = yDev4Sum / yDevsqsq
        self.b2 = b2
        left = n * ((n2 - (3*n) + 3) * s1 - (n*s2) + 3 * (s02))
        right = b2 * ((n2 - n) * s1 - (2*n*s2) + 6 * (s02))
        denom = (n-1) * (n-2) * (n-3) * s02
        num = (left - right) / denom
        self.expectedSquaredI = num
        self.vi = self.expectedSquaredI - self.squareExpectedI

        #### Assure that Variance is Larger than Zero ####
        if NUM.any(NUM.isnan(self.vi)) or NUM.any(self.vi <= 0.0):
            ARCPY.AddIDMessage("ERROR", 906)
            raise SystemExit()

        self.standDev = NUM.sqrt(self.vi)
        self.zi = (self.gi - self.ei)/self.standDev
        self.pVal = NUM.array([STATS.zProb(i, type = 2) for i in self.zi])

    def construct_cpp(self):
        """Constructs the neighborhood structure for each feature and
        dispatches the appropriate values for the calculation of the
        statistic."""

        #### Shorthand Attributes ####
        ssdo = self.ssdo
        numObs = ssdo.numObs
        master2Order = ssdo.master2Order
        masterField = ssdo.masterField
        concept = self.concept
        iterVals = UTILS.ssRange(numObs)
        rowStandard = self.rowStandard
        wType = 1

        yVar = NUM.var(self.y)
        if NUM.isnan(yVar) or yVar <= 0.0:
            ARCPY.AddIDMessage("ERROR", 906)
            raise SystemExit()

        #### Create Results Array ####
        self.giResults = NUM.zeros((self.nIncrements, 6))
        self.ySum = NUM.zeros((self.nIncrements,), float)

        #### Run Max Distance and Bin NN ####
        msgProg = ARCPY.GetIDMessage(84423)
        self.rowSum = NUM.zeros((numObs, self.nIncrements), float)
        self.weightVals = NUM.ones((numObs, self.nIncrements), float)
        self.hasNeighs = NUM.ones((numObs, self.nIncrements), bool)
        self.noNeighs = NUM.zeros((self.nIncrements,), int)
        self.breaks = COLL.defaultdict(NUM.array)
        self.numFeatures = NUM.ones((self.nIncrements,), int) * ssdo.numObs
        self.totalNeighs = NUM.zeros((self.nIncrements,), float)

        warnThrown = (self.silent == True) or (self.allDefaults == True)
        self.warnNeighsExceeded = warnThrown
        self.maxNeighsExceeded = warnThrown
        self.completed = False
        if self.isGridData:
            self.cutoffs = self.cutoffs + 0.001

        r_std = 0
        if self.rowStandard:
            r_std = 1
        if self.permNum > 0:

            if ssdo.useChordal:
                gaSearch = GAPY.ga_nsearch(ssdo.gaTable)
                gaSearch.init_nearest(self.stepMax, self.numNeighs, concept.lower())
                gaTable = ssdo.gaTable
                incAuto = ARC._ss.PyIncAutocorrelation(y_val=self.y,
                                                       cutoffs=self.cutoffs, num_perm=self.permNum, row_standard=r_std,
                                                       gatable=gaTable, gasearch=gaSearch, num_thread=4, do_opt=self.do_opt)
            else:
                if concept == "EUCLIDEAN":
                    distance_type = 0
                else:
                    distance_type = 1
                xyCoords = ssdo.xyCoords
                incAuto = ARC._ss.PyIncAutocorrelation(y_val=self.y,
                                                       cutoffs=self.cutoffs, num_perm=self.permNum, row_standard=r_std,
                                                       coords=xyCoords, distance_type=distance_type, num_thread=4, do_opt=self.do_opt)
            if not incAuto.can_solve():
                raise SystemExit()
            results = incAuto.get_results()
        else:
            if ssdo.useChordal:
                gaSearch = GAPY.ga_nsearch(ssdo.gaTable)
                gaSearch.init_nearest(self.stepMax, self.numNeighs, concept.lower())
                gaTable = ssdo.gaTable
                incAuto = ARC._ss.PyIncAutocorrelation(y_val=self.y,
                                                       cutoffs=self.cutoffs, num_perm=0, row_standard=r_std,
                                                       gatable=gaTable, gasearch=gaSearch, num_thread=4)
            else:
                if concept == "EUCLIDEAN":
                    distance_type = 0
                else:
                    distance_type = 1
                xyCoords = ssdo.xyCoords
                incAuto = ARC._ss.PyIncAutocorrelation(y_val=self.y,
                                                       cutoffs=self.cutoffs, num_perm=0, row_standard=r_std,
                                                       coords=xyCoords, distance_type=distance_type, num_thread=4)
            if not incAuto.can_solve():
                raise SystemExit()
            results = incAuto.get_results()

        self.gi = results["morans_I"]
        self.ei = results["expected_I"]
        self.vi = results["variance_I"]

        #### Assure that Variance is Larger than Zero ####
        if NUM.any(NUM.isnan(self.vi)) or NUM.any(self.vi <= 0.0):
            ARCPY.AddIDMessage("ERROR", 906)
            raise SystemExit()

        self.standDev = NUM.sqrt(self.vi)
        self.zi = (self.gi - self.ei)/self.standDev
        self.pVal = NUM.array([STATS.zProb(i, type = 2) for i in self.zi])

        #### Pack Results ####
        for ind in self.cutoffOrder:
            res = (self.cutoffs[ind], self.gi[ind], self.ei[ind],
                   self.vi[ind], self.zi[ind], self.pVal[ind])
            self.giResults[ind] = res

        if not self.silent:
            ARCPY.AddMessage("\n")

        #### Calculate Peak Distances ####
        ziResults = [value[4] for value in self.giResults]
        firstPeakInd, maxPeakInd = UTILS.returnPeakIndices(ziResults,
                                                           levelFilter=1.65)

        #### Add Warning if No Valid Peaks are Found ####
        if firstPeakInd is None and maxPeakInd is None:
            if not self.silent:
                ARCPY.AddIDMessage("WARNING", 1284)

        if firstPeakInd is None:
            self.firstPeakDistance = None
            self.firstPeakZ = None
        else:
            self.firstPeakDistance = self.cutoffs[firstPeakInd]
            self.firstPeakZ = self.zi[firstPeakInd]

        if maxPeakInd is None:
            self.maxPeakDistance = None
            self.maxPeakZ = None
        else:
            self.maxPeakDistance = self.cutoffs[maxPeakInd]
            self.maxPeakZ = self.zi[maxPeakInd]

        self.firstPeakInd = firstPeakInd
        self.maxPeakInd = maxPeakInd
        self.completed = True

        return True

    def reportWarnings(self, numFeatures = 30):
        if len(self.idsWarn):
            self.idsWarn.sort()
            idsOut = [ str(i) for i in self.idsWarn[0:numFeatures] ]
            idsOut = ", ".join(idsOut)
            ARCPY.AddIDMessage("WARNING", 1422, self.ssdo.masterField, idsOut)

    def reportMaximums(self, numFeatures = 30):
        if len(self.idsMax):
            self.idsMax.sort()
            idsOut = [ str(i) for i in self.idsMax[0:numFeatures] ]
            idsOut = ", ".join(idsOut)
            ARCPY.AddIDMessage("WARNING", 1423, self.ssdo.masterField, idsOut)

    def report(self, fileName = None):
        """Reports the Moran's I results as a message or to a file.

        INPUTS:
        fileName {str, None}: path to a text file to populate with results.
        """

        header = ARCPY.GetIDMessage(84160) + ARCPY.GetIDMessage(84282)
        results = [ self.resLabels ]
        hasNoNeighs = self.noNeighs.any()
        strNoNeighs = ARCPY.GetIDMessage(84111)

        #### Create Output Text Table ####
        for testIter in range(self.nIncrements):
            d, gi, ei, vi, zi, pv = self.giResults[testIter]
            d = LOCALE.format_string("%0.2f", round(d, 2))
            gi = LOCALE.format_string("%0.6f", gi)
            ei = LOCALE.format_string("%0.6f", ei)
            vi = LOCALE.format_string("%0.6f", vi)
            zi = LOCALE.format_string("%0.6f", zi)
            pv = LOCALE.format_string("%0.6f", pv)

            #### Add Asterisk to No Neigh Distances ####
            if hasNoNeighs:
                numNoNeighs = self.noNeighs[testIter]
                if numNoNeighs:
                    d += strNoNeighs
                else:
                    d += " "
            res = [d, gi, ei, vi, zi, pv]
            results.append(res)

        footnote = []
        #### Report Peaks ####
        firstPeakMess = ARCPY.GetIDMessage(84419)
        numSep = ";"
        if self.firstPeakInd is not None:

            zi = LOCALE.format_string("%0.6f", self.giResults[self.firstPeakInd,4])
            d = LOCALE.format_string("%0.2f", round(self.firstPeakDistance, 2))

            firstPeakMess = firstPeakMess.format(d, numSep, zi)
        else:
            firstPeakMess = firstPeakMess.format("None", numSep, "None")
        footnote.append(firstPeakMess)

        maxPeakMess = ARCPY.GetIDMessage(84420)
        if self.maxPeakInd is not None:
            zi = LOCALE.format_string("%0.6f", self.giResults[self.maxPeakInd,4])
            d = LOCALE.format_string("%0.2f", round(self.maxPeakDistance, 2))
            maxPeakMess = maxPeakMess.format(d, numSep, zi)
        else:
            maxPeakMess = maxPeakMess.format("None", numSep,"None")
        footnote.append(maxPeakMess)

        #### Add Linear/Angular Unit ####
        distanceOut = UTILS.getLocalizedUnitType(self.ssdo.distanceInfo.outputString)
        dmsg = ARCPY.GetIDMessage(84344)
        distanceMeasuredStr = dmsg.format(distanceOut)
        footnote.append(distanceMeasuredStr)

        outputReport = UTILS.outputTextTable(results, header = header,
                                             justify = "right", pad = 1, footnote=footnote,
                                             force2Txt=False, returnHTMLMsg=True)

        outputReportPlain = UTILS.outputTextTable(results, header = header,
                                             justify = "right", pad = 1, footnote=footnote,
                                             force2Txt=True, returnHTMLMsg=True)

        if fileName:
            if hasNoNeighs:
                noNeighMess = ARCPY.GetIDMessage(84417) + "\n"
                outputReport += noNeighMess
            f = UTILS.openFile(fileName, "w")
            UTILS.writeText(f, outputReportPlain)
            f.close()
        else:
            ARCPY.AddMessage(outputReport)
            if hasNoNeighs:
                ARCPY.AddIDMessage("WARNING", 1532)

        #### Generate distance-zscore graph ####
        plt.rcParams['font.family'] = ['Segoe UI', 'serif', 'sans-serif', 'Microsoft YaHei']
        if UTILS.couldExportHTMLMessage():
            Xs = self.giResults[:, 0]
            Ys = self.giResults[:, 4]
            fig = plt.figure(figsize=GLOBAL_OUTPUT_FIG_SIZE)
            ax = fig.add_subplot(axes_class=Axes)
            ax.axes.axis["right"].set_visible(False)
            ax.axes.axis["top"].set_visible(False)
            plt.ioff()

            plt.plot(Xs, Ys, c="#01579b", alpha=0.9, marker='o', markersize=6,
                     label=None, linewidth=1.5, zorder=3)  #

            if self.firstPeakInd is not None and self.firstPeakInd != self.maxPeakInd:
                plt.scatter([Xs[self.firstPeakInd]], [Ys[self.firstPeakInd]], s=40, c="#8e24aa",
                         label=ARCPY.GetIDMessage(84331), linewidth=1.5, zorder=10)  # "First Peak"
            if self.maxPeakInd is not None:
                plt.scatter([Xs[self.maxPeakInd]], [Ys[self.maxPeakInd]], s=40, c="#c62828",
                         label=ARCPY.GetIDMessage(84332), linewidth=1.5, zorder=10)  # "Max Peak"

            distanceOut = UTILS.getLocalizedUnitType(self.ssdo.distanceInfo.outputString)
            fig.supxlabel(ARCPY.GetIDMessage(84077).format(distanceOut))  # "Distance({unit})"
            fig.supylabel(ARCPY.GetIDMessage(220605))  # "z-score"
            plt.legend(loc='upper left', frameon=False, ncol=1)
            tmpfile = BytesIO()
            # plt.savefig(tmpfile, format='png', bbox_inches='tight')
            plt.savefig(tmpfile, format='svg', bbox_inches='tight')
            plt.close(fig)
            encoded = base64.b64encode(tmpfile.getvalue()).decode('utf-8')
            result_graph = f'data:image/svg+xml;base64,{encoded}'
            UTILS.outputHeader(ARCPY.GetIDMessage(84334), 5)  # "Spatial Autocorrelation by Distance"
            ARCPY.AddMessage(
                """json:[{"element":"image", "data":"%s", "elementProps": {"style": "width: 800px;"}}]"""
                % result_graph)

        return outputReport

    def createOutput(self, outputTable):
        """Creates Moran's I Step Output Table.

        INPUTS
        outputTable (str): path to the output table
        """

        #### Allow Overwrite Output ####
        ARCPY.env.overwriteOutput = 1

        #### Get Output Table Name With Extension if Appropriate ####
        outputTable, dbf = UTILS.returnTableName(outputTable)

        #### Set Progressor ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84008))

        #### Delete Table If Exists ####
        UTILS.passiveDelete(outputTable)

        #### Create Table ####
        outPath, outName = OS.path.split(outputTable)
        try:
            DM.CreateTable(outPath, outName)
        except:
            ARCPY.AddIDMessage("ERROR", 541)
            raise SystemExit()

        #### Add Result Fields ####
        self.outputFields = []
        for field in iaFieldNames:
            fieldOut = ARCPY.ValidateFieldName(field, outPath)
            UTILS.addEmptyField(outputTable, fieldOut, "DOUBLE")
            self.outputFields.append(fieldOut)

        #### Create Insert Cursor ####
        try:
            insert = DA.InsertCursor(outputTable, self.outputFields)
        except:
            ARCPY.AddIDMessage("ERROR", 204)
            raise SystemExit()

        #### Add Rows to Output Table ####
        for testIter in UTILS.ssRange(self.nIncrements):
            insert.insertRow(self.giResults[testIter])

        #### Clean Up ####
        del insert

        return outputTable, dbf

    def createOutputGraphic(self, fileName, firstInd = None, maxInd = None):
        import SSReport as REPORT
        import matplotlib.gridspec as GRIDSPEC

        #### Set Progressor ####
        writeMSG = ARCPY.GetIDMessage(84186)
        ARCPY.SetProgressor("step", writeMSG, 0, 3, 1)

        #### Set Colors ####
        colors = NUM.array(["#4575B5", "#849EBA", "#C0CCBE", "#FFFFBF",
                            "#FAB984", "#ED7551", "#D62F27"])
        cutoffs = NUM.array([-2.58, -1.96, -1.65, 1.65, 1.96, 2.58])

        #### Import Matplotlib ####
        pdfOutput = REPORT.openPDF(fileName)

        #### Set Base Figure ####
        title = ARCPY.GetIDMessage(84334)
        report = REPORT.startNewReport(22, title = title, landscape = True,
                                       titleFont = REPORT.ssTitleFont)
        grid = report.grid
        startRow = 1
        gridPlot = report.fig.add_subplot(grid.gridSpec[startRow:17, 0:20])

        #### Set Data ####
        distVals = []
        zVals = []
        for testIter in range(self.nIncrements):
            d, gi, ei, vi, zi, pv = self.giResults[testIter]
            distVals.append(d)
            zVals.append(zi)

        #### Plot Values ####
        zVals = NUM.array(zVals)
        binVals = NUM.digitize(zVals, cutoffs)
        binColors = colors[binVals]

        #### Line Graph First ####
        gridPlot.plot(distVals, zVals, color='k', linestyle='-')

        #### Add Series and First/Max Points ####
        if firstInd is not None:
            #### First Peak ####
            gridPlot.plot(distVals[firstInd], zVals[firstInd],
                          color='#00FFFF', marker='o', alpha = 0.7,
                          markeredgecolor='k', markersize = 14)

        if maxInd is not None:
            #### Max Peak ####
            if maxInd != firstInd:
                gridPlot.plot(distVals[maxInd], zVals[maxInd],
                              color='#00FFFF', marker='o', alpha = 0.7,
                              markeredgecolor='k', markersize = 14)

        #### Points Next ####
        for ind, dist in enumerate(distVals):
            color = binColors[ind]
            gridPlot.plot(dist, zVals[ind], color=color, marker='o',
                          alpha = 0.7, markeredgecolor='k',
                          markersize = 8)

        #### Set Axis and Tick Labels ####
        yLabel = ARCPY.GetIDMessage(84335)
        distanceOut = UTILS.getLocalizedUnitType(self.ssdo.distanceInfo.outputString)
        xLabel = ARCPY.GetIDMessage(84077).format(distanceOut)
        gridPlot.set_ylabel(yLabel, fontproperties = REPORT.ssLabFont, labelpad = 20)
        gridPlot.set_xlabel(xLabel, fontproperties = REPORT.ssLabFont, labelpad = 20)
        gridPlot.yaxis.grid(True, linestyle='-', which='major',
                            color='lightgrey', alpha=0.5)
        REPORT.setTickFontSize(gridPlot)

        #### Scoot Max Z ####
        minD, maxD = UTILS.increaseMinMax(distVals, multiplier = .15)
        minZ, maxZ = UTILS.increaseMinMax(zVals, multiplier = .15)
        gridPlot.set_ylim(bottom = minZ, top = maxZ)
        gridPlot.set_xlim(left = minD, right = maxD)

        #### Create Legend ####
        rColors = [ i for i in reversed(colors) ]
        grid.writeCell((startRow, 20), yLabel, colspan = 2,
                        fontObj = REPORT.ssBoldFont, justify = "right")
        labels = ["> 2.58", "1.96 - 2.58", "1.65 - 1.96", "-1.65 - 1.65",
                  "-1.96 - -1.65", "-2.58 - -1.96", "< -2.58"]

        gridCount = 0
        for ind, lab in enumerate(labels):
            color = rColors[ind]
            row = ind + 1 + startRow
            gridCount += 1

            #### Add Points ####
            gridPlot = report.fig.add_subplot(grid.gridSpec[row, 20])
            gridPlot.plot(0.0, 0.0, color = color, marker = "o", alpha = .7)
            gridPlot.set_axis_off()

            #### Add Text ####
            gridPlot = report.fig.add_subplot(grid.gridSpec[row, 21])
            gridPlot.text(0.0, 0.3, lab, fontproperties = REPORT.ssFont,
                          horizontalalignment = "left")
            gridPlot.set_axis_off()

        #### Add Peak Marker ####
        currentRow = startRow + gridCount + 1
        grid.createLineRow(currentRow, startCol = 20, endCol = 22)
        currentRow += 1

        gridPlot = report.fig.add_subplot(grid.gridSpec[currentRow, 20])
        gridPlot.plot(0.0, 0.0, color='#00FFFF', marker='o', alpha = 0.4,
                      markeredgecolor='k', markersize = 14)
        gridPlot.set_axis_off()

        #### Add Text ####
        gridPlot = report.fig.add_subplot(grid.gridSpec[currentRow, 21])
        gridPlot.text(0.0, 0.3, "Peaks", fontproperties = REPORT.ssFont,
                      horizontalalignment = "left")
        gridPlot.set_axis_off()

        #### Add To PDF ####
        report.write(pdfOutput)
        ARCPY.SetProgressorPosition()

        #### Tabular Output ####
        title = ARCPY.GetIDMessage(84160) + ARCPY.GetIDMessage(84282)
        titlePlus = title + " " + ARCPY.GetIDMessage(84377)
        report = REPORT.startNewReport(7, title = title, landscape = True,
                                       titleFont = REPORT.ssTitleFont)
        grid = report.grid

        #### Create Column Labels ####
        grid.createColumnLabels(self.resLabels, justify = "right",
                                fontObj = REPORT.ssBoldFont)

        #### Create Output Text Table ####
        hasNoNeighs = self.noNeighs.any()
        strNoNeighs = ARCPY.GetIDMessage(84111)
        for testIter in range(self.nIncrements):
            if grid.rowCount >= 19:
                #### Finalize Page ####
                grid.finalizeTable()
                report.write(pdfOutput)

                #### New Page ####
                report = REPORT.startNewReport(7, title = titlePlus,
                                                   landscape = True,
                                     titleFont = REPORT.ssTitleFont)
                grid = report.grid

                #### Create Column Labels ####
                grid.createColumnLabels(self.resLabels, justify = "right",
                                        fontObj = REPORT.ssBoldFont)

            #### Get Results ####
            d, gi, ei, vi, zi, pv = self.giResults[testIter]
            d = LOCALE.format_string("%0.2f", round(d, 2))

            #### Add Asterisk to No Neigh Distances ####
            if hasNoNeighs:
                numNoNeighs = self.noNeighs[testIter]
                if numNoNeighs:
                    d += strNoNeighs
                else:
                    d += " "

            grid.writeCell((grid.rowCount, 0), d,
                            justify = "right")
            grid.writeCell((grid.rowCount, 1),
                            LOCALE.format_string("%0.6f", gi),
                            justify = "right")
            grid.writeCell((grid.rowCount, 2),
                            LOCALE.format_string("%0.6f", ei),
                            justify = "right")
            grid.writeCell((grid.rowCount, 3),
                            LOCALE.format_string("%0.6f", vi),
                            justify = "right")
            grid.writeCell((grid.rowCount, 4),
                            LOCALE.format_string("%0.6f", zi),
                            justify = "right")
            grid.writeCell((grid.rowCount, 5),
                            LOCALE.format_string("%0.6f", pv),
                            justify = "right")
            grid.stepRow()

        if grid.rowCount <= 19:
            grid.createLineRow(grid.rowCount, startCol = 0, endCol = 7)
            grid.stepRow()

        #### Add Footnotes, Peaks, Linear Unit, No Neighbor Message ####
        footNotes = []

        #### Report Peaks ####
        firstPeakMess = ARCPY.GetIDMessage(84419)
        numSep = ";"
        if self.firstPeakInd is not None:
            zi = LOCALE.format_string("%0.6f", self.giResults[self.firstPeakInd,4])
            d = LOCALE.format_string("%0.2f", round(self.firstPeakDistance, 2))
            firstPeakMess = firstPeakMess.format(d, numSep, zi)
        else:
            firstPeakMess = firstPeakMess.format("None",numSep, "None")
        footNotes += REPORT.splitFootnote(firstPeakMess, 145)

        maxPeakMess = ARCPY.GetIDMessage(84420)
        if self.maxPeakInd is not None:
            zi = LOCALE.format_string("%0.6f", self.giResults[self.maxPeakInd,4])
            d = LOCALE.format_string("%0.2f", round(self.maxPeakDistance, 2))
            maxPeakMess = maxPeakMess.format(d, numSep, zi)
        else:
            maxPeakMess = maxPeakMess.format("None",numSep, "None")
        footNotes += REPORT.splitFootnote(maxPeakMess, 145)

        #### Add Linear/Angular Unit ####
        distanceOut = UTILS.getLocalizedUnitType(self.ssdo.distanceInfo.outputString)
        dmsg = ARCPY.GetIDMessage(84344)
        distanceMeasuredStr = dmsg.format(distanceOut)
        footNotes += REPORT.splitFootnote(distanceMeasuredStr, 145)

        #### Add No Neighbor Message ####
        if hasNoNeighs:
            noNeighMess = ARCPY.GetIDMessage(84417)
            footNotes += REPORT.splitFootnote(noNeighMess, 145)

        for line in footNotes:
            if grid.rowCount >= 19:
                #### Finalize Page ####
                grid.finalizeTable()
                report.write(pdfOutput)

                #### New Page ####
                report = REPORT.startNewReport(7, title = titlePlus,
                                                   landscape = True,
                                     titleFont = REPORT.ssTitleFont)

                grid = report.grid

            #### Write Footnote ####
            grid.writeCell((grid.rowCount, 0), line,
                            colspan = 7, justify = "left")
            grid.stepRow()

        grid.finalizeTable()

        #### Add To PDF ####
        report.write(pdfOutput)
        ARCPY.SetProgressorPosition()

        ##### Add Dataset/Parameter Info ####
        paramLabels = [84253, 84016, 84374, 84375, 84376, 84235, 84236, 84418]
        paramLabels = [ ARCPY.GetIDMessage(i) for i in paramLabels ]

        paramValues = [self.ssdo.inputFC, self.varName,
                       "%i" % self.nIncrements,
                       UTILS.formatValue(self.begDist),
                       UTILS.formatValue(self.dIncrement),
                       self.concept, "%s" % self.rowStandard,
                       str(self.ssdo.selectionSet)]

        title = ARCPY.GetIDMessage(84373)
        REPORT.createParameterPage(paramLabels, paramValues,
                                   title = title,
                                   pdfOutput = pdfOutput,
                                   titleFont = REPORT.ssTitleFont)

        #### Finish Up ####
        paragraph = UTILS.outputParagraph([UTILS.buildHyperlink(fileName)], force2Txt=False)
        if paragraph:
            ARCPY.AddMessage(paragraph)
        pdfOutput.close()
        ARCPY.SetProgressorPosition()
