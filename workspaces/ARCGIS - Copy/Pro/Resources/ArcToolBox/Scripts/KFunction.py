# coding: utf-8
"""
Tool Name:  Ripley's K Function
Source Name: KFunction.py
Version: ArcGIS 10.1
Author: ESRI

This tool analyzes spatial patterns at multiple distances to assess whether the
observed pattern is more or less clustered/dispersed than might be expected
given random chance.  If an attribute field is specified, the field is
assumed to represent incident counts (a weight).

References:
Boots, Barry and Getis, Arthur. 1988. _Point Pattern Analysis_, Sage University
Paper Series on Quantitative Applications in the Social Sciences, series no. 07-001,
Beverly Hills: Sage Publications.
Getis, Arthur. 1984. "Interaction Modeling Using Second-order Analysis,
_Environment and Planning A_ 16:173-183.
"""

################### Imports ########################
import os as OS
import sys as SYS
import collections as COLL
import numpy as NUM
import matplotlib.path as PATH
import math as MATH
import numpy.random as RAND
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.analysis as ANA
import arcpy.da as DA
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import WeightsUtilities as WU
import gapy as GAPY
import Stats as STATS
import locale as LOCALE
LOCALE.setlocale(LOCALE.LC_ALL, '')

################ Output Field Names #################
kOutputFieldNames = ["ExpectedK", "ObservedK", "DiffK", 
                     "LwConfEnv", "HiConfEnv"]

def execute(parameters, messages):
    """Retrieves the parameters from the User Interface and executes the
    appropriate commands."""

    inputFC = UTILS.getTextParameter(0, parameters )
    outputTable = UTILS.getTextParameter(1, parameters)
    nIncrements = parameters[2].value
    permutations = UTILS.getTextParameter(3, parameters).upper().replace(" ", "_")
    displayIt = parameters[4].value
    weightField = UTILS.getTextParameter(5, parameters, fieldName = True)
    begDist = UTILS.getNumericParameter(6, parameters)
    dIncrement = UTILS.getNumericParameter(7, parameters)
    edgeCorrection = UTILS.getTextParameter(8, parameters).upper().replace(" ", "_")
    studyAreaMethod = UTILS.getTextParameter(9, parameters).upper().replace(" ", "_")
    studyAreaFC = UTILS.getTextParameter(10, parameters)

    #### Resolve Table Extension ####
    if ".dbf" not in OS.path.basename(outputTable):
        dirInfo = ARCPY.Describe(OS.path.dirname(outputTable))
        if dirInfo == "FileSystem":
            outputTable = outputTable + ".dbf"

    #### Resolve Remaining Parameters ####
    if nIncrements > 100:
        nIncrements = 100

    if edgeCorrection == "NONE" or edgeCorrection == "#": 
        edgeCorrection = None
    elif edgeCorrection == "SIMULATE_OUTER_BOUNDARY_VALUES":
        edgeCorrection = "Simulate"
    elif edgeCorrection == "REDUCE_ANALYSIS_AREA":
        edgeCorrection = "Reduce"
    else: 
        edgeCorrection = "Ripley"

    if permutations == "0_PERMUTATIONS_-_NO_CONFIDENCE_ENVELOPE":
        permutations = 0
    elif permutations == "99_PERMUTATIONS":
        permutations = 99
    elif permutations == "999_PERMUTATIONS":
        permutations = 999
    else: 
        permutations = 9

    if studyAreaMethod == "USER_PROVIDED_STUDY_AREA_FEATURE_CLASS":
        studyAreaMethod = 1
    else:
        studyAreaMethod = 0

    k = KFunction(inputFC, outputTable = outputTable,
                  nIncrements = nIncrements, permutations = permutations,
                  weightField = weightField, begDist = begDist, 
                  dIncrement = dIncrement, edgeCorrection = edgeCorrection,
                  studyAreaMethod = studyAreaMethod, studyAreaFC = studyAreaFC)

    k.report()
    k.createOutput(outputTable, displayIt = displayIt, parameters = parameters)

    #### Create K Function chart for the result table ####
    lChart = ARCPY.Chart(ARCPY.GetIDMessage(220650))
    lChart.type = "line"
    lChart.title = ARCPY.GetIDMessage(220650)

    #### Assign X Axis Field ####
    lChart.xAxis.field = "ExpectedK"
    lChart.xAxis.title = ARCPY.GetIDMessage(84179)
    lChart.yAxis.field = ["ObservedK", "ExpectedK", "LwConfEnv", "HiConfEnv"] if permutations > 0 else ["ObservedK", "ExpectedK"]
    lChart.yAxis.title = ARCPY.GetIDMessage(220651)
    # lChart.line.aggregation = ""
    lChart.legend.visible = True
    lChart.color = ["#E60000", "#1F78B4", "#FFAA00", "#FFAA00"] if permutations > 0 else ["#E60000", "#1F78B4"]
    parameters[1].charts = [lChart]


def postExecute(parameters):
    #### Update the legend labels after and K_Function chart is added ####

    try:
        outputTable = UTILS.getTextParameter(1, parameters)
        project = ARCPY.mp.ArcGISProject('CURRENT')
        map = project.activeMap
        labels = {
            "ObservedK": ARCPY.GetIDMessage(84175),
            "ExpectedK": ARCPY.GetIDMessage(84174),
            "LwConfEnv": ARCPY.GetIDMessage(220652),
            "HiConfEnv": ARCPY.GetIDMessage(220683)
        }

        tbMainName = OS.path.basename(outputTable)
        if tbMainName.lower().endswith(".dbf"):
            tbMainName = tbMainName[0: -4]

        table = map.listTables(tbMainName)[0]
        df = table.getDefinition("V2")
        for ser in df.charts[0].series:
            if ser.name in labels:
                ser.name = labels[ser.name]
        table.setDefinition(df)
    except:
        pass


class KFunction(object):
    """This tool analyzes spatial patterns at multiple distances to assess 
    whether the observed pattern is more or less clustered/dispersed than 
    might be expected given random chance.  If an attribute field is 
    specified, the field is assumed to represent incident counts (a weight).

    INPUTS: 
    inputFC (str): path to the input feature class
    outputTable {str, None}: path to an output table
    nIncrements {int, 10}: number of distance bands
    permutations {int, 0}: number of permutations for confidence intervals
    weightField {str, None}: weights field for features
    begDist {float, None}: starting distance for analysis
    dIncrement {float, None}: increase in distance per increment
    edgeCorrection {str, None}: type of edge correction (1)
    studyAreaMethod {int, 0}: study area type (2)
    studyAreaFC {str, None}: path to a bounding polygon feature class (3)

    METHODS:
    initialize: creates initial GA Table and sets envelope
    setStudyArea: sets study area
    setOriginalTable: finalizes original GA Table
    weightedCalc: performs weighted k-function
    unweightedCalc: performs unweighted k-function
    report: reports results as a printed message or to a file
    createOutput: creates an output table for k-function results

    ATTRIBUTES:
    ssdo (class): instance of SSDataObject
    kTable (obj): instance of a GA Table

    NOTES:
    (1) None, "Simulate", "Reduce", "Reduce Analysis Area"
    (2) 0: Minimum Enclosing Rectangle, 1: Polygon Feature Class
    (3) Only used if studyAreaMethod == 1

    REFERENCES:
    (A) Boots, Barry and Getis, Arthur. 1988. _Point Pattern Analysis_, 
        Sage University Paper Series on Quantitative Applications in the 
        Social Sciences, series no. 07-001, Beverly Hills: 
        Sage Publications.

    (B) Getis, Arthur. 1984. "Interaction Modeling Using Second-order 
        Analysis, Environment and Planning A 16:173-183.
    """

    def __init__(self, inputFC, outputTable = None, nIncrements = 10,
                 permutations = 0, weightField = None, begDist = None, 
                 dIncrement = None, edgeCorrection = None,
                 studyAreaMethod = 0, studyAreaFC = None):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Create a Spatial Stats Data Object (SSDO) ####
        self.ssdo = SSDO.SSDataObject(inputFC, useChordal = False, 
                                      invalidGCS = True)

        #### Edge Correction Bools ####
        self.simulate = self.edgeCorrection == "Simulate"
        self.ripley = self.edgeCorrection == "Ripley"
        self.reduce = self.edgeCorrection == "Reduce"
        self.noEdge = self.edgeCorrection is None

        #### Set Seed if Env Var Given ####
        if self.permutations:
            UTILS.setRandomSeed()

        #### Initialize Data ####
        self.initialize() 

        #### Get Near Info and Remove Outside Points ####
        self.setOriginalTable()

        #### Choose Weighted or Unweighted Version ####
        if self.weightField:
            self.weightedCalc()
        else:
            self.unweightedCalc()

        #### Clean Up ####
        self.cleanUp()

    def cleanUp(self):
        """Removes Objects and Temp Files from Memory for the
        k-Function."""

        if self.reduce:
            UTILS.passiveDelete(self.reducedFC) 

        if self.tempStudyArea:
            UTILS.passiveDelete(self.studyAreaFC)

        try:
            del self.ssdo.gaTable
        except:
            pass

        try:
            del self.kTable
        except:
            pass

    def initialize(self):
        """Reads data into a GA structure for neighborhood searching and
        sets the study area envelope."""

        #### Shorthand Attributes ####
        ssdo = self.ssdo
        weightField = self.weightField
        if weightField:
            fieldList = [weightField]
        else:
            fieldList = []

        #### Create GA Data Structure ####
        ssdo.obtainData(ssdo.oidName, fieldList, minNumObs = 3, 
                        requireSearch = True, warnNumObs = 30)
        N = len(ssdo.gaTable)

        #### Get Weights ####
        if weightField:
            weights = ssdo.fields[weightField].returnDouble()
            #### Report No Weights ####
            weightSum = weights.sum()
            if not weightSum > 0.0: 
                ARCPY.AddIDMessage("ERROR", 898)
                raise SystemExit()

        
        #### Set Study Area ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84248))
        clearedMinBoundGeom = UTILS.clearExtent(UTILS.minBoundGeomPoints)

        #### Set Initial Study Area FC ####
        if self.studyAreaMethod == 1 and self.studyAreaFC:
            #### Assure Only A Single Polygon in Study Area FC ####
            polyCount = UTILS.getCount(self.studyAreaFC)
            if polyCount != 1:
                #### Dissolve Polys into Boundary And Set Flag For Delete ####
                dissolveFC = UTILS.returnScratchName("Diss_KFun_", scratchWS = ARCPY.env.scratchGDB)
                DM.Dissolve(self.studyAreaFC, dissolveFC, "#", "#", "SINGLE_PART", "DISSOLVE_LINES")
                self.studyAreaFC = dissolveFC
                self.tempStudyArea = True
            else:
                self.tempStudyArea = False

            #### Read User Provided Study Area ####
            polyInfo = UTILS.returnPolygon(self.studyAreaFC, spatialRef = ssdo.spatialRefString,
                                           allowCurves = False)
            self.studyAreaPoly, self.studyArea = polyInfo

            #### Create Temp Min. Enc. Rectangle and Class ####
            tempMBG_FC = UTILS.returnScratchName("tempMBG_FC")
            clearedMinBoundGeom(self.studyAreaPoly, tempMBG_FC, 
                                geomType = "RECTANGLE_BY_AREA",
                                spatialRef = ssdo.spatialRef)
            self.minRect = UTILS.MinRect(tempMBG_FC)
            UTILS.passiveDelete(tempMBG_FC)

        else:
            #### Create Min. Enc. Rectangle ####
            self.studyAreaFC = UTILS.returnScratchName("regularBound_FC")
            self.tempStudyArea = True
            clearedMinBoundGeom(ssdo.xyCoords, self.studyAreaFC, 
                                geomType = "RECTANGLE_BY_AREA",
                                spatialRef = ssdo.spatialRef)

            polyInfo = UTILS.returnPolygon(self.studyAreaFC, 
                                           spatialRef = ssdo.spatialRefString)
            self.studyAreaPoly, self.studyArea = polyInfo

            #### Create Min. Enc. Rectangle Class ####
            self.minRect = UTILS.MinRect(self.studyAreaFC)

            if self.reduce:
                #### Only Need To Create FC if Reduce Buffer ####
                UTILS.createPolygonFC(self.studyAreaFC, self.studyAreaPoly, 
                                      spatialRef = ssdo.spatialRefString)


        #### Set Extent and Envelope and Min Rect ####
        self.envelope = UTILS.Envelope(ssdo.extent)
        self.maxDistance = self.minRect.maxLength * 0.25
        if self.maxDistance > (self.minRect.minLength * .5):
            #### 25% of Max Extent is Larger Than Half Min Extent ####
            #### Results in Reduced Study Area Failure ####
            if self.reduce:
                self.maxDistance = self.minRect.minLength * 0.25

        #### Determine Distance Increment ####
        if not self.dIncrement:
            if self.begDist: 
                distRange = self.maxDistance - self.begDist
            else: 
                distRange = self.maxDistance
            self.dIncrement = float(distRange / self.nIncrements)

        #### Determine Starting Distance ####
        if not self.begDist:
            self.begDist = self.dIncrement
        
        #### Determine All Distance Cutoffs ####
        rangeInc = UTILS.ssRange(self.nIncrements)
        cutoffs = []
        for inc in rangeInc:
            val = (inc * self.dIncrement) + self.begDist
            cutoffs.append(val)
        stepMax = cutoffs[-1]

        #### Check Cutoff Values ###
        if self.begDist > (self.minRect.maxLength * 0.51):
            ARCPY.AddIDMessage("WARNING", 934)
        elif stepMax > self.minRect.maxLength:
            ARCPY.AddIDMessage("WARNING", 935)

        #### Set Step Attributes ####
        self.stepMax = stepMax
        self.cutoffs = NUM.array(cutoffs)
        self.reverseOrder = range(self.nIncrements - 1, -1, -1)
        self.cutoffOrder = range(self.nIncrements)
        self.largestDistBand = self.cutoffs[-1]
        self.tolerance = self.minRect.tolerance
        self.xyTolerance = ssdo.spatialRef.XYTolerance

        #### Get Linear Unit for Reduce, Simulate and Ripley ####
        floatMax = self.stepMax * 1.0
        self.simulateUnitStr = ssdo.distanceInfo.linearUnitString(floatMax, 
                                                            convert = True) 
        self.reduceUnitStr = "-" + self.simulateUnitStr

        #### Create Smaller Poly FC for Reduce ####
        if self.reduce:
            self.reducedFC = UTILS.returnScratchName("reducedBound_FC")
            if UTILS.compareFloat(floatMax, 0):
                ARCPY.AddIDMessage("ERROR", 1170)
                self.cleanUp()
                raise SystemExit()
            ANA.Buffer(self.studyAreaFC, self.reducedFC, self.reduceUnitStr)
            reduceInfo = UTILS.returnPolygon(self.reducedFC, spatialRef = ssdo.spatialRefString)
            self.reducePoly, self.reduceArea = reduceInfo
            if self.reducePoly is None:
                ARCPY.AddIDMessage("ERROR", 1170)
                self.cleanUp()
                raise SystemExit()
            self.reducePath = PATH.Path(self.reducePoly)
            descRed = ARCPY.Describe(self.reducedFC)
            redExtent = descRed.extent
            self.redEnvelope = UTILS.Envelope(redExtent)
            self.redTolerance = self.redEnvelope.tolerance
            self.randomPolyFC = self.reducedFC
        else:
            self.randomPolyFC = self.studyAreaFC

        #### Create Study Area Envelope ####
        descSA = ARCPY.Describe(self.studyAreaFC)
        self.extentSA = descSA.extent
        self.envelopeSA = UTILS.Envelope(self.extentSA)
        envCoordsSA = self.envelopeSA.envelope
        self.minX, self.minY, self.maxX, self.maxY = envCoordsSA
        self.studyAreaPath = PATH.Path(self.studyAreaPoly)

    def setOriginalTable(self):
        """Finalizes original GA Table."""

        #### Distance from points to study area boundary ####
        ssdo = self.ssdo
        near, nearXY, nextNear = UTILS.nearestPoint(self.studyAreaPoly, 
                                                    self.ssdo.gaTable)

        #### Create New GA Table ####
        kTable = GAPY.ga_table()

        #### Create Data Structures ####
        ids = []
        tempSim = {}
        self.simDict = {}
        weightDict = {}
        weightVals = []

        #### Pass Over Original GA Table ####
        gaTable = self.ssdo.gaTable
        N = len(gaTable)
        maxID = 0
        c = 0
        for i in UTILS.ssRange(N):
            row = gaTable[i]
            id = row[0]
            xy = row[1]

            #### Inside Checks ####
            inPoly = self.studyAreaPath.contains_point(xy)
            onEdge = near[id] < self.xyTolerance
            inside = inPoly or onEdge

            #### Skip or Cont... Depending On Inside ####
            keepResult = True
            if not self.noEdge:
                if not inside:
                    keepResult = False

            if keepResult:
                #### Weight Field ####
                if self.weightField:
                    weight = row[2]
                    weightDict[id] = c
                    weightVals.append(weight)
                else:
                    weight = 1.0
                c += 1

                #### Insert Into Table ####
                kTable.insert(id, xy, weight)

                #### Resolve Inside/Outside IDs ####
                if self.reduce:
                    inReduced = self.reducePath.contains_point(xy)
                    if inReduced:
                        #### Inside Reduced Study Area ####
                        ids.append(id)
                else:
                    if inside:
                        ids.append(id)
                maxID = max(maxID, id) 

                #### Add Simulated Points ####
                if self.simulate:
                    x,y = xy
                    if near[id] <= self.stepMax:
                        nearX, nearY = nearXY[id]
                        dX = nearX + (nearX - x)
                        dY = nearY + (nearY - y)
                        inside = self.studyAreaPath.contains_point((dX, dY))
                        onLine = near[id] < self.xyTolerance
                        outside = (not inside and not onLine)
                        if outside:
                            tempSim[id] = [ (dX, dY), weight ]
        
        #### Resolve Simulated Points ####
        simPointsOut = []
        if self.simulate:
            simID = maxID + 1
            for origKey, origVals in UTILS.iteritems(tempSim):
                self.simDict[simID] = origKey
                xy, weight = origVals
                kTable.insert(simID, xy, weight)
                simID += 1
                simPointsOut.append(xy)

        #### Check if All Features Are Outside Study Area ####
        if len(ids) == 0:
            ARCPY.AddIDMessage("ERROR", 1008)
            self.cleanUp()
            raise SystemExit()

        #### Finalize Table ####
        kTable.flush()

        self.weightVals = NUM.array(weightVals, dtype = NUM.float64)
        self.weightDict = weightDict
        self.N = len(kTable)
        self.ids = set(ids)
        self.near = near
        self.nearXY = nearXY
        self.nextNear = nextNear
        self.kTable = kTable
        self.maxID = maxID

    def permutateTable(self):
        """Permutates points in study area."""

        #### Create New GA Table ####
        newTable = GAPY.ga_table()
        kTable = self.kTable
        N = len(kTable)
        newSimDict = {}
        maxID = 0
        numInside = len(self.ids)

        #### Create Random Points ####
        randomPointFC = UTILS.returnScratchName("Rand_KFun_", scratchWS = ARCPY.env.scratchGDB)
        randPath, randName = OS.path.split(randomPointFC)
        DM.CreateRandomPoints(randPath, randName, self.randomPolyFC,
                              number_of_points_or_field=numInside, minimum_allowed_distance="0 Meters",
                              create_multipoint_output="POINT", multipoint_size=0)
        rows = DA.SearchCursor(randomPointFC, ["SHAPE@XY"], "", self.ssdo.spatialRef)

        c = 0
        for i in UTILS.ssRange(N):
            row = kTable[i]
            id = row[0]
            x,y = row[1]
            point = (x, y)
            if id in self.ids:
                dX, dY = rows.next()[0]
                point = (dX, dY)
                newTable.insert(id, point, 1.0)
                c += 1
            else:
                if id in self.simDict:
                    pass
                else:
                    newTable.insert(id, point, 1.0)

        newTable.flush()
        del self.kTable, self.simDict
        UTILS.passiveDelete(randomPointFC)

        #### Distance from points to study area boundary ####
        near, nearXY, nextNear = UTILS.nearestPoint(self.studyAreaPoly, 
                                                    newTable)

        #### Resolve Simulate Points ####
        if self.simulate:
            simTable = GAPY.ga_table()
            tempN = len(newTable)
            simID = self.maxID + 1
            for i in UTILS.ssRange(tempN):
                row = newTable[i]
                id = row[0]
                x,y = row[1]
                simTable.insert(id, (x,y), 1.0)
                if near[id] <= self.stepMax:
                    nearX, nearY = nearXY[id]
                    dX = nearX + (nearX - x)
                    dY = nearY + (nearY - y)
                    point = (dX, dY)
                    inside = self.studyAreaPath.contains_point((dX, dY))
                    if not inside:
                        simTable.insert(simID, point, 1.0)
                        newSimDict[simID] = id
                        simID += 1
            del newTable
            simTable.flush()
            self.kTable = simTable
        else:
            self.kTable = newTable

        #### Reassign Attributes ####
        self.simDict = newSimDict
        self.N = len(self.kTable)
        self.near = near
        self.nearXY = nearXY
        self.nextNear = nextNear

    def returnRipley(self, id, dist):
        """Returns Ripley's Edge Correction value.

        INPUTS:
        id (int): ID for given feature
        dist (float): neighborhood search distance

        OUTPUT:
        value (float): Ripley's Corrected value
        """

        if self.near[id] < dist:
            if self.nextNear[id] < dist:
                denom = 2.0 * NUM.pi
                numer1 = self.near[id] / dist
                numer2 = self.nextNear[id] / dist
                numer1 = MATH.acos(numer1)
                numer2 = MATH.acos(numer2)
                numEnd = NUM.pi / 2.0
                numer = numer1 + numer2 + numEnd
            else:
                denom = NUM.pi 
                numerTemp = self.near[id] / dist
                numer = MATH.acos(numerTemp)
            tempQ = numer / denom
            value = 1.0 / (1.0 - tempQ)
        else:
            value = 1.0

        return value

    def weightedCalc(self):
        """Performs weighted k-function."""

        #### Attribute Shortcuts ####
        ssdo = self.ssdo
        reduce = self.reduce
        simulate = self.simulate
        ripley = self.ripley
        numIDs = len(self.ids) 
        if reduce:
            studyArea2Use = self.reduceArea
        else:
            studyArea2Use = self.studyArea
        if simulate:
            simOrder = []
            for simKey, origID in UTILS.iteritems(self.simDict):
                simOrder.append(self.weightDict[origID])

        self.ld = COLL.defaultdict(float)
        if self.permutations:
            #self.ldBar = COLL.defaultdict(float) #### Sim Driven Expected Value (A) ####
            self.ldMin = COLL.defaultdict(float)
            self.ldMax = COLL.defaultdict(float)
            for order in self.cutoffOrder:
                self.ldMin[order] = 99999999999.
                #self.ldBar[order] = 0 #### (a)

        permsPlus = self.permutations + 1
        for perm in UTILS.ssRange(0, permsPlus):

            #### Permutation Progressor ####
            pmsg = ARCPY.GetIDMessage(84184)
            progressMessage = pmsg.format(perm, permsPlus)
            ARCPY.SetProgressor("default", progressMessage)
            gaSearch = GAPY.ga_nsearch(self.kTable)
            gaSearch.init_nearest(self.stepMax, 0, "euclidean")
            N = len(self.kTable)

            #### Permutate Weights ####
            if perm:
                weights = RAND.permutation(weights)
            else:
                weights = self.weightVals
            if simulate:
                simWeights = NUM.take(self.weightVals, simOrder)

            #### Set Statistic Variables ####
            weightSumVal = 0.0
            kij = COLL.defaultdict(float)
            start = 0

            #### Loop Over Entire Table ####
            for i in UTILS.ssRange(N):
                row = self.kTable[i]
                id0 = row[0]

                #### Calculate For Inside IDs ####
                if id0 in self.ids:
                    x0,y0 = row[1]              
                    weightInd0 = self.weightDict[id0]
                    w0 = weights[weightInd0]

                    #### Weight Sum Resolution ####
                    weightSumVal += (NUM.sum(w0 * weights)) - w0**2.0
                    if simulate:
                        weightSumVal += (w0 * simWeights).sum()

                    #### Neighbors Within Largest Distance ####
                    gaSearch.search_by_idx(i)
                    for nh in gaSearch:
                        neighInfo = self.kTable[nh.idx]
                        id1 = neighInfo[0]
                        x1,y1 = neighInfo[1]

                        #### Input or Simulated Point ####
                        try:
                            weightInd1 = self.weightDict[id1]
                        except:
                            origID = self.simDict[id1]
                            weightInd1 = self.weightDict[origID]

                        #### Process Neighbor Pair ####
                        w1 = weights[weightInd1]
                        dist = WU.euclideanDistance(x0,x1,y0,y1)
                        if ripley:
                            value = self.returnRipley(id0, dist)
                        else:
                            value = 1.0
                        value = w0 * (w1 * value)

                        #### Add To Cutoffs ####
                        for order in self.reverseOrder:
                            cutoff = self.cutoffs[order]
                            if dist > cutoff:
                                break
                            kij[order] += value

            ARCPY.SetProgressorPosition()

            #### Calculate Stats USing Dictionaries ####
            denom = NUM.pi * weightSumVal
            for order in self.cutoffOrder:
                res = kij[order]
                numer = res * studyArea2Use
                permResult = NUM.sqrt( (numer/denom) )
                if perm:
                    self.ldMin[order] = min(self.ldMin[order], 
                                            permResult)
                    self.ldMax[order] = max(self.ldMax[order], 
                                            permResult)
                    #self.ldBar[order] += permResult #### (A) ####
                else:
                    self.ld[order] = permResult 

        #### Get Average Line #### (A)
        # if self.permutations:
        #     for order in self.cutoffOrder:
        #         self.ldBar[order] = self.ldBar[order] / self.permutations

    def unweightedCalc(self):
        """Performs unweighted k-function."""

        #### Attribute Shortcuts ####
        ssdo = self.ssdo
        reduce = self.reduce
        simulate = self.simulate
        ripley = self.ripley
        if reduce:
            studyArea2Use = self.reduceArea
        else:
            studyArea2Use = self.studyArea

        self.ld = COLL.defaultdict(float)
        if self.permutations:
            #self.ldBar = COLL.defaultdict(float) #### (A) ####
            self.ldMin = COLL.defaultdict(float)
            self.ldMax = COLL.defaultdict(float)
            for order in self.cutoffOrder:
                self.ldMin[order] = 99999999999.
                #self.ldBar[order] = 0 #### (A) ####

        permsPlus = self.permutations + 1
        for perm in UTILS.ssRange(0, permsPlus):

            #### Permutation Progressor ####
            pmsg = ARCPY.GetIDMessage(84184)
            progressMessage = pmsg.format(perm, permsPlus)
            ARCPY.SetProgressor("default", progressMessage)

            #### Permutate the XY ####
            if perm != 0:
                self.permutateTable()

            gaSearch = GAPY.ga_nsearch(self.kTable)
            gaSearch.init_nearest(self.stepMax, 0, "euclidean")
            N = len(self.kTable)

            numIDs = len(self.ids) 
            kij = COLL.defaultdict(float)
            for i in UTILS.ssRange(N):
                row = self.kTable[i]
                id0 = row[0]
                if id0 in self.ids:
                    x0,y0 = row[1]
                    gaSearch.search_by_idx(i)
                    for nh in gaSearch:
                        neighInfo = self.kTable[nh.idx]
                        nhID = neighInfo[0]
                        x1,y1 = neighInfo[1]
                        dist = WU.euclideanDistance(x0,x1,y0,y1)
                        if ripley:
                            value = self.returnRipley(id0, dist)
                        else:
                            value = 1.0
                        for order in self.reverseOrder:
                            cutoff = self.cutoffs[order]
                            if dist > cutoff:
                                break
                            kij[order] += value

            ARCPY.SetProgressorPosition()

            #### Calculate Stats USing Dictionaries ####
            weightSumVal = numIDs * (numIDs - 1.0)
            denom = NUM.pi * weightSumVal
            for order in self.cutoffOrder:
                res = kij[order]
                numer = res * studyArea2Use
                permResult = NUM.sqrt( (numer/denom) )
                if perm:
                    self.ldMin[order] = min(self.ldMin[order], 
                                            permResult)
                    self.ldMax[order] = max(self.ldMax[order], 
                                            permResult)
                    #self.ldBar[order] += permResult
                else:
                    self.ld[order] = permResult

        #### Get Average Line #### (A)
        # if self.permutations:
        #     for order in self.cutoffOrder:
        #         self.ldBar[order] = self.ldBar[order] / self.permutations
            
    def report(self, fileName = None):
        """Reports the k-function results as a message or to a file.

        INPUTS:
        fileName {str, None}: path to a text file to populate with results.
        """
        header = ARCPY.GetIDMessage(84185)
        columns = [ARCPY.GetIDMessage(84342), ARCPY.GetIDMessage(84180), 
                   ARCPY.GetIDMessage(84181)]
        if self.permutations:
            columns += [ARCPY.GetIDMessage(84182), ARCPY.GetIDMessage(84183)]
        results = [columns]
        for testIter in range(self.nIncrements):
            # if self.permutations: #### (A)
            #     #### Use Permutations for Average Line ####
            #     bar = self.ldBar[testIter]
            # else:
            #     bar = self.cutoffs[testIter]
            bar = self.cutoffs[testIter]
            ldVal = self.ld[testIter]
            diff = ldVal - bar
            rowResults = [ LOCALE.format_string("%0.2f", round(bar, 2)),
                           LOCALE.format_string("%0.2f", round(ldVal, 2)),
                           LOCALE.format_string("%0.2f", round(diff, 2)) ]
            if self.permutations:
                minVal = round(self.ldMin[testIter], 2)
                maxVal = round(self.ldMax[testIter], 2)
                rowResults.append(LOCALE.format_string("%0.2f", minVal))
                rowResults.append(LOCALE.format_string("%0.2f", maxVal))

            results.append(rowResults)

        distanceOut = UTILS.getLocalizedUnitType(self.ssdo.distanceInfo.outputString)
        distanceMeasuredStr = ARCPY.GetIDMessage(84343).format(distanceOut)
        footnote = [distanceMeasuredStr]

        outputTable = UTILS.outputTextTable(results, header = header, footnote=footnote, force2Txt=False, returnHTMLMsg=True)
        outputTablePlain = UTILS.outputTextTable(results, header = header, footnote=footnote,
                                                 force2Txt=True, returnHTMLMsg=True)

        if fileName:
            f = UTILS.openFile(fileName, "w")
            UTILS.writeText(f, outputTablePlain)
            f.close()
        else:
            ARCPY.AddMessage(outputTable)

    def createOutput(self, outputTable, displayIt = False, parameters = None):
        """Creates K-Function Output Table.

        INPUTS
        outputTable (str): path to the output table
        displayIt {bool, False}: create output graph?
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
            self.cleanUp()
            raise SystemExit()

        #### Add Result Fields ####
        fn = UTILS.getFieldNames(kOutputFieldNames, outPath) 
        expectedKName, observedKName, diffKName, lowKName, highKName = fn
        outputFields = [expectedKName, observedKName, diffKName]
        if self.permutations:
            outputFields += [lowKName, highKName] 

        for field in outputFields:
            UTILS.addEmptyField(outputTable, field, "DOUBLE")

        #### Create Insert Cursor ####
        try:
            insert = DA.InsertCursor(outputTable, outputFields)
        except:
            ARCPY.AddIDMessage("ERROR", 204)
            self.cleanUp()
            raise SystemExit()

        #### Add Rows to Output Table ####
        for testIter in UTILS.ssRange(self.nIncrements):
            distVal = self.cutoffs[testIter]
            ldVal = self.ld[testIter]
            diffVal = ldVal - distVal
            rowResult = [distVal, ldVal, diffVal]
            if self.permutations:
                ldMinVal = self.ldMin[testIter]
                ldMaxVal = self.ldMax[testIter]
                rowResult += [ldMinVal, ldMaxVal]
            insert.insertRow(rowResult)

        #### Clean Up ####
        del insert

        #### Make Table Visable in TOC if *.dbf Had To Be Added ####
        if dbf:
            if parameters is None:
                ARCPY.SetParameterAsText(1, outputTable)
            else:
                parameters[1].value = outputTable

        #### Display Results ####
        if displayIt:
            if UTILS.canMakeGraph():
                #### Set Progressor ####
                ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84186))

                #### Get Image Directory ####
                imageDir = UTILS.getImageDir()

                #### Make List of Fields and Set Template File ####
                yFields = [expectedKName, observedKName]
                if self.permutations:
                    #### Add Confidence Envelopes ####
                    yFields.append(highKName)
                    yFields.append(lowKName)
                    tee = OS.path.join(imageDir, "KFunctionPlotEnv.tee")
                else:
                    tee = OS.path.join(imageDir, "KFunctionPlot.tee")

                xFields = [ expectedKName for i in yFields ]

                #### Create Data Series String ####
                dataStr = UTILS.createSeriesStr(xFields, yFields, outputTable)

                #### Make Graph ####
                DM.MakeGraph(tee, dataStr, "KFunction")
                if parameters is None:
                    ARCPY.SetParameterAsText(11, "KFunction")
                else:
                    parameters[11].value = "KFunction"

            else:
                ARCPY.AddIDMessage("Warning", 110038)

