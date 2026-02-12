# coding: utf-8
"""
Source Name:   SSBivariateAssociation.py
Version:       ArcGIS  PRO 3.4
Author:        Environmental Systems Research Institute Inc.
Description:   Calculates Global/Local Lee's L Statistics of Bivariate Spatial Association.
"""

from itertools import permutations
import os as OS
import arcpy as ARCPY
import arcgisscripting as ARC
import SSUtilities as UTILS
import ErrorUtils as ERROR
import numpy as NUM
import SSDataObject as SSDO
import SSUtilities as UTILS
import WeightsUtilities as WU
import arcpy.management as DM
import Stats as STATS
import scipy.spatial as SCPS
import locale as LOCALE

LOCALE.setlocale(LOCALE.LC_ALL, '')
DO_STAR_STAT = True

classifySig = {0: ARCPY.GetIDMessage(84511),
               1: "90% " + ARCPY.GetIDMessage(220527), 
               2: "95% " + ARCPY.GetIDMessage(220527),
               3: "99% " + ARCPY.GetIDMessage(220527)}

supportedSpatialRelation = {1: 'FIXED_DISTANCE',
                            2: 'K_NEAREST_NEIGHBORS',
                            3: 'DELAUNAY_TRIANGULATION',
                            4: 'CONTIGUITY_EDGES_ONLY',
                            5: 'CONTIGUITY_EDGES_CORNERS',
                            8: 'GET_SPATIAL_WEIGHTS_FROM_FILE'}

supportedWeightSchema = {'UNWEIGHTED': 0,
                         'BISQUARE': 1}

MAX_NUM_NEIGHS = 1000

def noValidWeightsCheck(invalidWeightIndices, order2Master, useWarning = True):
    if invalidWeightIndices is not None:
        numNoWeights = len(invalidWeightIndices)
        masterIDs = [order2Master[i] for i in invalidWeightIndices]
        masterIDs = NUM.sort(masterIDs)
        invalidIndices = [str(i) for i in masterIDs[0:30]]
        if useWarning:
            ARCPY.AddIDMessage("WARNING", 110560, numNoWeights, ", ".join(invalidIndices))
        else:
            ARCPY.AddIDMessage("ERROR", 110560, numNoWeights, ", ".join(invalidIndices))
            raise SystemExit()

def createDefaultThresholdDist(ssdo, silentWarning = True):
    """Distance that assures all features have at least one neighbor."""
    
    ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84144), 0, ssdo.numObs, 1)
    if ssdo.useChordal:
        #### Chordal Distance XYZ ###
        coords = ssdo.spheroidCoords
    else:
        coords = ssdo.xyCoords
    kdTree = SCPS.cKDTree(coords)

    threshold = 0.0
    sumDist = 0.0 
    for orderID in range(ssdo.numObs):
        coord = coords[orderID]
        distances, ids = kdTree.query(coord, k = 2, p = 2)
        maxDist = distances[-1]
        if maxDist > threshold:
            threshold = maxDist
        sumDist += maxDist

        ARCPY.SetProgressorPosition()

    #### Increase For Rounding Error ####
    threshold = threshold * 1.0001
    avgDist = sumDist / ssdo.numObs

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

    return threshold, avgDist

def executeBSA(parameters, messages):
    ARCPY.env.overwriteOutput = True

    inputFC = UTILS.getTextParameter(0, parameters)
    varNameX = UTILS.getTextParameter(1, parameters).upper()
    varNameY = UTILS.getTextParameter(2, parameters).upper()
    outputFC = UTILS.getTextParameter(3, parameters)
    
    #### Spatial Info ####
    wType = 2
    threshold = None 
    weightsFile = None
    numNeighs = None
    weightSchema = 'UNWEIGHTED'
    kernelBand = None
    spaceConcept = UTILS.getTextParameter(4, parameters)

    if spaceConcept == 'DISTANCE_BAND':
        spaceConcept = 'FIXED_DISTANCE'

    elif spaceConcept == 'NUMBER_OF_NEIGHBORS':
        spaceConcept = 'K_NEAREST_NEIGHBORS'

    try:
        wType = WU.weightDispatch[spaceConcept]
    except:
        ARCPY.AddIDMessage("Error", 723)
        raise SystemExit()

    if wType == 1:
        #### Distance Band ####
        threshold = UTILS.getTextParameter(5, parameters)

    if wType == 2:
        #### KNN ####
        numNeighs = UTILS.getNumericParameter(6, parameters)

    if wType == 8:
        #### SWM ####
        weightsFile = UTILS.getTextParameter(7, parameters)

    if wType in [1,2]:
        #### Kernel (Distance-Based Types) ####
        weightSchema = UTILS.getTextParameter(8, parameters)
        if weightSchema != 'UNWEIGHTED':
            kernelBand = UTILS.getTextParameter(9, parameters)
    
    permutations = UTILS.getNumericParameter(10, parameters)

    analysisFields = [varNameX, varNameY]
    check = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC, fields = analysisFields, 
                                             weightsFile = weightsFile)

    #### Create SSDO ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC)
    masterField = UTILS.setUniqueIDField(ssdo, weightsFile = weightsFile)
    ssdo.obtainData(masterField, analysisFields, minNumObs = 10)

    #### Global Coincident Point Checker for All Except SWM ####
    #### Max Coincident <= Num Features and Max Num Neighs (1000) ####
    if wType != 8:
        WU.globalCoincidentPointChecker(ssdo, MAX_NUM_NEIGHS)


    bsa = BivariateSpatialAssociation(ssdo, varNameX, varNameY, wType = wType, threshold = threshold, numNeighs = numNeighs,
                                      weightsFile = weightsFile, weightSchema = weightSchema, kernelBand = kernelBand,
                                      permutations = permutations)

    #### Create Output ####
    bsa.createOutput(outputFC)

    #### Report ####
    aliasX, aliasY = bsa.report(outputFC = outputFC)

    #### Symbology ####
    if ssdo.shapeType.upper() == "POLYGON":
        templatePath = "BivariatePolygonTemplate.lyrx"
    else:
        templatePath = "BivariatePointsTemplate.lyrx"
    pathTemplate = OS.path.join(UTILS.pathLayers, templatePath)
    parameters[3].symbology = pathTemplate

    #bsa.doSymbology(3)

    #### Create Chart ####
    charts = []
    scatter = ARCPY.Chart(ARCPY.GetIDMessage(220863))
    scatter.type = "scatter"
    scatter.title = ARCPY.GetIDMessage(220863)
    scatter.scatter.showTrendLine = True
    scatter.scatter.splitCategory = "ASSOC_CAT"

    #### Assign Y Axis Field ####
    scatter.xAxis.field = "NWA_VAR1"
    scatter.xAxis.title = ARCPY.GetIDMessage(220864).format(aliasX)

    #### Assign X Axis Field ####
    scatter.yAxis.field = "NWA_VAR2"
    scatter.yAxis.title = ARCPY.GetIDMessage(220864).format(aliasY)

    #### Guides ####
    guide0 = ARCPY.charts.Guide("line", name='x guide', valueFrom=bsa.xBar, label="", lineWidth=2, lineColor="rgba(127, 127, 127, 100)", lineDashStyle='Dash')
    scatter.xAxis.addGuide(guide0)
    guide0 = ARCPY.charts.Guide("line", name='y guide', valueFrom=bsa.yBar, label="", lineWidth=2, lineColor="rgba(127, 127, 127, 100)", lineDashStyle='Dash')
    scatter.yAxis.addGuide(guide0)
    
    charts.append(scatter)
    parameters[3].charts = charts

    #### Set Derived Outputs ####
    UTILS.setParameterAsText(11, LOCALE.format_string("%0.6f", bsa.globalL), parameters = parameters)
    UTILS.setParameterAsText(12, LOCALE.format_string("%0.6f", bsa.globalPV), parameters = parameters)
    UTILS.setParameterAsText(13, LOCALE.format_string("%0.6f", bsa.globalCorr), parameters = parameters)

class BivariateSpatialAssociation(object):
    """
    This class provides the functions used for te tool Neighborhood Summary Statistics
    """

    def __init__(self, ssdo, varNameX, varNameY, wType=2, 
                 threshold=None, numNeighs=None, weightsFile=None, 
                 weightSchema='UNWEIGHTED', kernelBand=None,
                 permutations = 499):

        self.ssdo = ssdo
        self.varNameX = varNameX
        self.varNameY = varNameY
        self.aliasX = self.ssdo.fields[self.varNameX.upper()].alias
        self.aliasY = self.ssdo.fields[self.varNameY.upper()].alias
        self.wType = wType
        self.threshold = threshold
        self.weightsFile = weightsFile
        self.numNeighs = numNeighs
        self.weightSchema = weightSchema
        self.kernelBand = kernelBand
        self.permutations = permutations
        if self.permutations is None:
            self.permutations = 499
        if self.permutations < 99:
            self.permutations = 99
        
        #### Set Neighborhood Type Int ####
        self.wType = wType
        if self.wType not in supportedSpatialRelation:
            ARCPY.AddIDMessage("ERROR", 723)
            raise SystemExit()

        # if self.ssdo.shapeType.upper() not in ["POLYGON", "POINT"]:
        #     ARCPY.AddIDMessage('ERROR', 366)
        #     raise SystemExit()

        if ssdo.useChordal:
            #### Chordal Distance XYZ ###
            self.coordinates = ssdo.spheroidCoords
        else:
            self.coordinates = ssdo.xyCoords
        self.isUnweighted = weightSchema.upper() == 'UNWEIGHTED'
        
        #### Set Weight Search Type Info ####
        if self.wType == 1:
            #### Fixed Distance ####
            self.weightsFile = None
            self.numNeighs = None

        elif self.wType == 2:
            #### KNN ####
            self.weightsFile = None
            self.threshold = None
            self.numNeighs = WU.getValidNumNeighs(self.numNeighs, self.ssdo.numObs, self.wType)
            self.numNeighs = min(self.numNeighs, MAX_NUM_NEIGHS)

        else:
            #### Others ####
            self.threshold = None
            self.numNeighs = None
            self.weightSchema = "UNWEIGHTED"
            self.kernelBand = None

            if self.wType != 8:
                self.weightsFile = None
                
        #### Assign Weights File Info ####
        self.swmFileBool = False
        if weightsFile:
            weightSuffix = self.weightsFile.split(".")[-1].lower()
            self.swmFileBool = (weightSuffix == "swm")
            
        #### Check Kernel ####
        if self.weightSchema.upper() not in supportedWeightSchema:
            ARCPY.AddIDMessage("ERROR", 110552, self.weightSchema.upper()) 
            raise SystemExit()
        self.kernelInt = supportedWeightSchema[self.weightSchema.upper()]

        #### Set Vars ####
        self.x = self.ssdo.fields[self.varNameX].returnDouble()
        self.y = self.ssdo.fields[self.varNameY].returnDouble()
        self.xBar = self.x.mean()
        self.yBar = self.y.mean()
            
        #### Error for Constant Fields ####
        zeroVarFields = []
        if self.x.var() <= 0.0:
            zeroVarFields.append(self.varNameX)
        if self.y.var() <= 0.0:
            zeroVarFields.append(self.varNameY)

        if len(zeroVarFields):
            zeroNames = ", ".join(zeroVarFields)
            ARCPY.AddIDMessage("ERROR", 1588, zeroNames)
            raise SystemExit()
        
        #### Finalize Distance/Kernel Linear Unit Info ####
        self.weightDict = None
        if self.wType in [1,2]:
            
            self.__setLinearUnitInfo()

        elif self.wType == 3:
            ### Clipped Delaunay Triangulation ###
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

            else:
                coinKeys = None
                coinMap = None

            #### Get Neighborhood ####
            self.weightDict = ARC._ss.delaunay_point_neighbors(self.ssdo.xyCoords, 
                                                               self.ssdo.spatialRef,
                                                               coinKeys, coinMap)

            #### Check/Add for No Neighs ####
            self.weightDict = WU.addNoNeighs2Delaunay(self.ssdo.xyCoords, self.ssdo.uniqueXY, self.weightDict)
            
        elif self.wType in [4,5]:
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84129))
            #### Polygon Contiguity ####
            if self.wType == 4:
                contiguityType = "ROOK"
            else:
                contiguityType = "QUEEN"
            self.weightDict = self.ssdo.getPolygonNeighbors(contiguityType = contiguityType)

        #### Core Calc ####
        self.__calculate()


    def __calculate(self):
        """Core C++ Calculation."""
        self.globalCorr = NUM.corrcoef(self.x, self.y)[0,1]

        #### Get Random Seed and Thread Info ####
        self.randSeed = 0
        self.numThreads = 1
        self.randSeed = UTILS.getRandomSeed()
        self.numThreads = max(1, UTILS.getNumberOfThreadsDefault(toolDefault = 1))
        
        if self.wType == 1:
            lee = ARC._ss.PyBivariateSpatialAssociation(self.ssdo, self.x, self.y, self.wType, DO_STAR_STAT,
                                                        distance_band = self.distanceBand, 
                                                        kernel_int = self.kernelInt,
                                                        bandwidth = self.bandwidth,
                                                        permutations = self.permutations,
                                                        random_seed = self.randSeed, 
                                                        num_threads = self.numThreads)
        elif self.wType == 2:
            lee = ARC._ss.PyBivariateSpatialAssociation(self.ssdo, self.x, self.y, self.wType, DO_STAR_STAT,
                                                        num_neighs = self.numNeighs, 
                                                        kernel_int = self.kernelInt,
                                                        bandwidth = self.bandwidth,
                                                        permutations = self.permutations,
                                                        random_seed = self.randSeed, 
                                                        num_threads = self.numThreads)
        elif self.wType in [3,4,5]:
            lee = ARC._ss.PyBivariateSpatialAssociation(self.ssdo, self.x, self.y, self.wType, DO_STAR_STAT,
                                                        weight_dict = self.weightDict,
                                                        permutations = self.permutations,
                                                        random_seed = self.randSeed, 
                                                        num_threads = self.numThreads)
        elif self.wType == 8:
            swm = WU.SWMReader(self.weightsFile) 
            lee = ARC._ss.PyBivariateSpatialAssociation(self.ssdo, self.x, self.y, self.wType, DO_STAR_STAT,
                                                        weight_dict = swm,
                                                        permutations = self.permutations,
                                                        random_seed = self.randSeed, 
                                                        num_threads = self.numThreads)


        else:
            ARCPY.AddError("Invalid wType....")
            raise SystemExit()

        if not lee.full_solve():
            if not DO_STAR_STAT:
                #### Error for No Valid Neighbor (Weight Sum of Lag <= 0.0) ####
                invalidWeightIndices = lee.get_no_valid_weights()
                noValidWeightsCheck(invalidWeightIndices, self.ssdo.order2Master, useWarning = DO_STAR_STAT)
                
            #### User Exit ####
            raise SystemExit()
        else:
                
            
            self.sssX, self.sssY = lee.get_smoothing_info()
            self.globalL, self.globalPV = lee.get_global_info()
            self.localNN, self.localL, self.localPV = lee.get_local_info()
            self.rawWX, self.rawWY = lee.get_lag_info()
            self.weightedCorr = NUM.corrcoef(self.rawWX, self.rawWY)[0,1]

            if DO_STAR_STAT:
                #### Warn Only Self Neighbor (Weight Sum of Lag <= 1.0) ####
                invalidWeightIndices = lee.get_no_valid_weights()
                noValidWeightsCheck(invalidWeightIndices, self.ssdo.order2Master, useWarning = DO_STAR_STAT)

            self.localBins = None
            c = NUM.array([.01, .05, .1])
            self.localBins = NUM.arange(4, dtype = NUM.int32)[::-1][NUM.searchsorted(c,self.localPV)]

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
        self.bandwidth = 0.0
        if self.wType == 1:
            if self.isUnweighted:
                #### Fixed Distance - No Bandwidth ####
                if threshDefault:
                    self.threshold, avgDist = createDefaultThresholdDist(self.ssdo)
                info = self.__assignLinearUnitInfo(self.threshold)
                self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info
            else:
                #### Fixed Distance - Using Bandwidth ####
                if bothDefault:
                    #### Both Defaults - Data Generated Floats in Output Coord Linear Units (Report Both) ####
                    self.threshold, avgDist = createDefaultThresholdDist(self.ssdo)
                    info = self.__assignLinearUnitInfo(self.threshold)
                    self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info
                    self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

                if threshDefault and not bandwidthDefault:
                    #### Bandwidth Given - Distance Band Default (Report Distance Band in Bandwidth Units) ####
                    info = self.__assignLinearUnitInfo(self.kernelBand)
                    self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

                    self.threshold, avgDist = createDefaultThresholdDist(self.ssdo)
                    info = self.__assignLinearUnitInfo(self.threshold, overwriteLinearUnit = self.kernelBand)
                    self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info

                if bandwidthDefault and not threshDefault:
                    #### Distance Band Given - Bandwidth Default (Report Bandwidth in Distance Band Units) ####
                    info = self.__assignLinearUnitInfo(self.threshold)
                    self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info
                    self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

                if not threshDefault and not bandwidthDefault:
                    #### Distance Band and Kerenl Bandwidth Given by User (Don't Report) ####
                    info = self.__assignLinearUnitInfo(self.threshold)
                    self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info

                    info = self.__assignLinearUnitInfo(self.kernelBand)
                    self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

        if self.wType == 2 and not self.isUnweighted:

            if not bandwidthDefault:
                info = self.__assignLinearUnitInfo(self.kernelBand)
                self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

            else:
                #### Adaptive ###
                self.bandwidth = 0.0

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
        if self.bandwidth:
            self.bandwidthStr = ssdo.distanceInfo.createOutputLinearUnit(self.bandwidth, self.userBandwidthUnit)
            if bandwidthDefault and self.wType == 1:
                ARCPY.AddIDMessage("WARNING", 110363, self.bandwidthStr)

    def createOutput(self, outputFC):
        ARCPY.env.overwriteOutput = True

        #### Validate Output Workspace ####
        ERROR.checkOutputPath(outputFC)

        #### Prepare Derived Variables for Output Feature Class ####
        outPath, outName = OS.path.split(outputFC)

        #### Decide Field Alias Info ####
        workspaceType = UTILS.getBaseWorkspaceType(outPath)
        aliasX = self.aliasX
        aliasY = self.aliasY
        if workspaceType.upper() == "FOLDER":
            aliasX = self.varNameX
            aliasY = self.varNameY

        #### Create/Populate Dictionary of Candidate Fields ####
        appendFields = [self.varNameX, self.varNameY]
        fieldOrder = []
        candidateFields = {}

        #### Output Fields ####
        candidateField = SSDO.CandidateField("LOCAL_L", "DOUBLE", data = self.localL, 
                                             alias = ARCPY.GetIDMessage(220865))
        candidateFields["LOCAL_L"] = candidateField
        fieldOrder.append("LOCAL_L")

        candidateField = SSDO.CandidateField("NWA_VAR1", "DOUBLE", data = self.rawWX, 
                                             alias = ARCPY.GetIDMessage(220864).format(aliasX))
        candidateFields["NWA_VAR1"] = candidateField
        fieldOrder.append("NWA_VAR1")

        candidateField = SSDO.CandidateField("NWA_VAR2", "DOUBLE", data = self.rawWY, 
                                             alias = ARCPY.GetIDMessage(220864).format(aliasY))
        candidateFields["NWA_VAR2"] = candidateField
        fieldOrder.append("NWA_VAR2")

        candidateField = SSDO.CandidateField("P_VALUE", "DOUBLE", data = self.localPV, 
                                                alias = ARCPY.GetIDMessage(220866))
        candidateFields["P_VALUE"] = candidateField
        fieldOrder.append("P_VALUE")

        #### Significance Text Fields ####
        sigData = NUM.empty(self.ssdo.numObs, dtype = 'U50')
        binData = NUM.empty(self.ssdo.numObs, dtype = 'U15')
        for ind, localBin in enumerate(self.localBins):
            sigData[ind] = classifySig[localBin]
            if localBin:
                if self.rawWX[ind] >= self.xBar:
                    if self.rawWY[ind] >= self.yBar:
                        binData[ind] = "High-High"
                    else:
                        binData[ind] = "High-Low"
                else:
                    if self.rawWY[ind] >= self.yBar:
                        binData[ind] = "Low-High"
                    else:
                        binData[ind] = "Low-Low"
            else:
                binData[ind] = "Not Significant"
                
        candidateField = SSDO.CandidateField("SIG_LEVEL", "TEXT", data = sigData, 
                                                alias = ARCPY.GetIDMessage(220867),
                                                length = 50)
        candidateFields["SIG_LEVEL"] = candidateField
        fieldOrder.append("SIG_LEVEL")

        candidateField = SSDO.CandidateField("ASSOC_CAT", "TEXT", data = binData, 
                                             alias = ARCPY.GetIDMessage(220868),
                                             length = 15)
        candidateFields["ASSOC_CAT"] = candidateField
        fieldOrder.append("ASSOC_CAT")

        candidateField = SSDO.CandidateField("NUM_NBRS", "LONG", data = self.localNN, 
                                             alias = ARCPY.GetIDMessage(84362))
        candidateFields["NUM_NBRS"] = candidateField
        fieldOrder.append("NUM_NBRS")

        self.ssdo.output2NewFC(outputFC, candidateFields, fieldOrder = fieldOrder, appendFields = appendFields)


    def report(self, outputFC = None):

        aliasX = self.varNameX
        aliasY = self.varNameY
        
        if outputFC is not None:
            #### Validate Output Workspace ####
            ERROR.checkOutputPath(outputFC)

            #### Prepare Derived Variables for Output Feature Class ####
            outPath, outName = OS.path.split(outputFC)

            #### Decide Field Alias Info ####
            workspaceType = UTILS.getBaseWorkspaceType(outPath)
            if workspaceType.upper() != "FOLDER":
                aliasX = self.aliasX
                aliasY = self.aliasY

        header = ARCPY.GetIDMessage(220862)
        rows = []
        rows.append([ARCPY.GetIDMessage(220858), UTILS.formatValue(self.globalL, "%0.4f")])
        rows.append([ARCPY.GetIDMessage(220859), UTILS.formatValue(self.globalPV, "%0.4f")])
        rows.append([ARCPY.GetIDMessage(220861).format(aliasX),UTILS.formatValue(self.sssX, "%0.4f")])
        rows.append([ARCPY.GetIDMessage(220861).format(aliasY),UTILS.formatValue(self.sssY, "%0.4f")])
        rows.append([ARCPY.GetIDMessage(220860), UTILS.formatValue(self.globalCorr, "%0.4f")])
        rows.append([ARCPY.GetIDMessage(220869), UTILS.formatValue(self.weightedCorr, "%0.4f")])

        table = UTILS.outputTextTable(rows, header = header, justify = ["left", "right"], colPad = 3,
                                      emphasizeHeadRow = False)
        ARCPY.AddMessage(table)

        return aliasX, aliasY

    def getSymbologyBreaks(self):
        maxLI = max(abs(self.localL))
        return NUM.linspace(-maxLI, maxLI, 12)

    def doSymbology(self, paramID):
        import json
        from arcpy.cim.cimloader import GetJSONTypeOBJ
        from arcpy.cim.cimloader import CimJsonEncoder

        if self.ssdo.shapeType.upper() == "POLYGON":
            templatePath = "BivariatePolygonTemplate.lyrx"
        else:
            templatePath = "BivariatePointsTemplate.lyrx"
        
        pathTemplate = OS.path.join(UTILS.pathLayers, templatePath)
        f = open(pathTemplate, 'r')
        content = f.read()
        f.close()
        cimLayer = GetJSONTypeOBJ(json.loads(content))
        layerDef = cimLayer.layerDefinitions[0]
        layerDef.renderer.heading = ARCPY.GetIDMessage(220865)
        layerDef.renderer.numberFormat.roundingValue = 3

        #### Get Breaks ####
        breaks = self.getSymbologyBreaks()
        breakLab = "{0} - {1}"
        labels = {}
        for inBin in NUM.arange(-5, 6, 1, dtype = NUM.int32):
            labels[str(inBin)] = breakLab
        
        layerDef.renderer.minimumBreak = -1000
        layerDef.renderer.maximumBreak = 1000
        #layerDef.renderer.visualVariables[0].minValue = -1000
        #layerDef.renderer.visualVariables[0].maxValue = 1000

        for ind, br in enumerate(layerDef.renderer.breaks):
            if br.label in labels:
                lowValue = breaks[ind]
                highValue = breaks[ind+1]
                lowStr = LOCALE.format_string("%0.3f", lowValue)
                highStr = LOCALE.format_string("%0.3f", highValue)
                br.label = labels[br.label].format(lowStr, highStr)
                br.upperBound = highValue

        jsonData = json.dumps(cimLayer.layerDefinitions[0], cls=CimJsonEncoder)
        ARCPY.gp.SetParameterSymbology(paramID, "JSONCIMDEF="+jsonData)
