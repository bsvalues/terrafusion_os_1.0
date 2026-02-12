################### Imports ########################
import sys as SYS
import os as OS
import locale as LOCALE
import numpy as NUM
import numpy.linalg as LA
import scipy as SCI
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
import SSHelperFunctions as SSHELP
import base64
from io import BytesIO
import time
import tempfile as TEMPFILE
import textwrap as TEXTWRAP

import matplotlib
matplotlib.use('Agg')
from matplotlib import pyplot as plt
from mpl_toolkits.axisartist.axislines import Axes

GLOBAL_EXPORT_BOOTSTRAP_SAMPLE_ERFS = False
GLOBAL_ERF_INTERPOLATION_GRID_SIZE = 200
GLOBAL_OUTPUT_FIG_SIZE = (12, 8)

supportedStatisticMethodsNum = {
    "SUM": 0,
    "MIN": 1,
    "MEAN": 2,
    "MEDIAN": 3,
    "MAX": 4,
    "STD_DEV": 5
}

supportedStatisticMethodsCat = {
    "COUNT": 0,
    "PERCENT": 1,
    "MAJORITY": 2,
    "MAJORITY_PERCENT": 3,
    "MINORITY": 4,
    "MINORITY_PERCENT": 5,
    "VARIETY": 6
}

supportedSummarizationMethodsCat = {
    "NONE": 0,
    "WEIGHTED_MEAN": 1,
    "WEIGHTED_SUM": 2
}

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

def _ff(val, decimal=4):
    """
    Format and localize a float value
    Parameters
    ----------
    val
    decimal

    Returns
    -------

    """
    return UTILS.formatValue(val, formatStr=f"%0.{decimal}f")


def execute(parameters, messages):
    """Retrieves the parameters from the User Interface and executes the
    appropriate commands."""

    #### User Defined Inputs ####
    inputFC = UTILS.getTextParameter("in_features", parameters)
    do_append = ARCPY.GetParameterInfo()["append_to_input"].value

    fields_num = []
    val_fields_num = ARCPY.GetParameterInfo()["numerical_fields"].value
    if val_fields_num is not None:
        for row in val_fields_num:
            if row[1] is not None and row[1].upper() in supportedStatisticMethodsNum:
                fields_num.append((row[0].value, supportedStatisticMethodsNum[row[1].upper()]))

    fields_cat = []
    val_fields_cat = ARCPY.GetParameterInfo()["categorical_fields"].value
    if val_fields_cat is not None:
        for row in val_fields_cat:
            if row[1] is not None and row[1].upper() in supportedStatisticMethodsCat:
                if row[2] is not None and row[2].upper() in supportedSummarizationMethodsCat:
                    fields_cat.append((row[0].value, supportedStatisticMethodsCat[row[1].upper()], supportedSummarizationMethodsCat[row[2].upper()]))
    varNames = list(set([e[0].upper() for e in fields_num] + [e[0].upper() for e in fields_cat]))

    if do_append:
        outputFC = None
    else:
        outputFC = UTILS.getTextParameter("output_features", parameters)
    includeSelf = ARCPY.GetParameterInfo()["include_focal_feature"].value
    ignoreNulls = ARCPY.GetParameterInfo()["ignore_nulls"].value
    spaceConcept = UTILS.getTextParameter("neighborhood_type", parameters)

    #### Check Advanced License for Delaunay ####
    if spaceConcept == 'DELAUNAY_TRIANGULATION':
        if not SSHELP.checkLicense():
            ARCPY.AddIDMessage("ERROR", 110463)
            raise SystemExit

    if spaceConcept == 'DISTANCE_BAND':
        spaceConcept = 'FIXED_DISTANCE'
    elif spaceConcept == 'NUMBER_OF_NEIGHBORS':
        spaceConcept = 'K_NEAREST_NEIGHBORS'

    threshold = None
    if spaceConcept == 'FIXED_DISTANCE':
        threshold = UTILS.getTextParameter("distance_band", parameters)
    numNeighs = None
    if spaceConcept == 'K_NEAREST_NEIGHBORS':
        numNeighs = UTILS.getNumericParameter("number_of_neighbors", parameters)
    weightsFile = None
    if spaceConcept == "GET_SPATIAL_WEIGHTS_FROM_FILE":
        weightsFile = UTILS.getTextParameter("weights_matrix_file", parameters)
        includeSelf = False

    #### Apply Exec new field checker ####
    check = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC, fields=varNames, weightsFile=weightsFile)

    try:
        wType = WU.weightDispatch[spaceConcept]
    except:
        ARCPY.AddIDMessage("Error", 723)
        raise SystemExit()
    weightSchema = UTILS.getTextParameter("local_weighting_scheme", parameters)

    kernelBandUnit = None
    kernelBandInner = None
    kernelBandOuter = None
    if weightSchema in ['BISQUARE', 'GAUSSIAN']:
        kernelBandUnit = UTILS.getTextParameter("bandwidth_unit", parameters)
        kernelBandInner = UTILS.getNumericParameter("kernel_inner_bandwidth", parameters)
        kernelBandOuter = UTILS.getNumericParameter("kernel_outer_bandwidth", parameters)

    #### Do Theissen Polygons for Delaunay and Set To Polygon Neighbors ####
    if wType == 3:
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220088))
        inMemoryFC = "in_memory/LSSThiessenPolygonsTempFC"
        clearedThiessen = UTILS.clearExtent(ARCPY.CreateThiessenPolygons_analysis)
        clearedThiessen(inputFC, inMemoryFC, "ALL")
        ssdo = SSDO.SSDataObject(inMemoryFC, templateFC=outputFC)
        masterField = "INPUT_FID"
        wType = 5
        sourceIsThiessen = True
    else:
        #### Create SSDataObject ####
        ssdo = SSDO.SSDataObject(inputFC, templateFC=outputFC)

        #### Set Unique ID Field ####
        masterField = UTILS.setUniqueIDField(ssdo, weightsFile=weightsFile)
        sourceIsThiessen = False

    #### Populate SSDO with Data ####
    ssdo.obtainData(masterField, varNames, minNumObs=3, useNullinFields=varNames)

    #### Make Sure the Number of Neighbors is less Than the Total Number of Features ####
    if numNeighs and numNeighs >= ssdo.numObs:
        ARCPY.AddIDMessage("Error", 110265)
        raise SystemExit()

    calSpatialComponents = ARCPY.GetParameterInfo()["calc_spatial_components"].value
    maxSpatialComponentsNum = UTILS.getNumericParameter("max_components", parameters)
    if maxSpatialComponentsNum < 1:
        maxSpatialComponentsNum = 1
    scev = CalculateSpatialExplanatoryVariables(
        ssdo, fields_num, fields_cat,
        wType=wType, includeSelf=includeSelf, ignoreNulls=ignoreNulls, calGeoWeight=True,
        threshold=threshold, weightsFile=weightsFile, numNeighs=numNeighs,
        weightSchema=weightSchema, kernelBandUnit=kernelBandUnit, kernelBandInner=kernelBandInner, kernelBandOuter=kernelBandOuter,
        sourceIsThiessen=sourceIsThiessen, calSpatialComponents=calSpatialComponents, maxSpatialComponentsNum=maxSpatialComponentsNum,
        concept="EUCLIDEAN")

    scev.createOutput(outputFC)

    ind_output_features = 4
    if ssdo.shapeType == "POLYGON" or sourceIsThiessen:
        parameters[ind_output_features].symbology = OS.path.join(
            UTILS.pathLayers, "CalculateSpatialExplanatoryVariables_EigenMap_Polygon.lyrx")
    else:
        parameters[ind_output_features].symbology = OS.path.join(
            UTILS.pathLayers, "CalculateSpatialExplanatoryVariables_EigenMap_Point.lyrx")

    return


def postExecute(parameters):
    return
    #### Update Pop-up titles ####
    UTILS.postExecuteUpdatePopupTitle(parameters, 3, 4)

    #### Move the main result feature class into group layer ####
    try:
        outputFC = UTILS.getTextParameter(3, parameters)
        project = ARCPY.mp.ArcGISProject('CURRENT')
        map = project.activeMap
        groupParamInd = 14

        groups2Delete = []
        for gl in map.listLayers(UTILS.getTextParameter(groupParamInd, parameters)):
            if gl.isGroupLayer and checkEmptyGroupLayer(gl):
                groups2Delete.append(gl)
        for gl in groups2Delete:
            map.removeLayer(gl)

        layerGroup = map.listLayers(UTILS.getTextParameter(groupParamInd, parameters))[0]
        layerMainName = OS.path.basename(outputFC)
        if layerMainName.lower().endswith(".shp"):
            layerMainName = layerMainName[0: -4]
        layerMain = None
        nameFilter = layerMainName
        if len(map.listLayers(nameFilter)) > 0:
            lc = map.listLayers(nameFilter)[0]
            if OS.path.normpath(outputFC).removesuffix(".shp") == OS.path.normpath(lc.dataSource) or OS.path.normpath(
                    outputFC).removesuffix(".shp").lower().startswith("memory\\"):
                layerMain = lc
        if layerMain is None:
            nameFilter = f"*:{layerMainName}"
            if len(map.listLayers(nameFilter)) > 0:
                lc = map.listLayers(nameFilter)[0]
                if OS.path.normpath(outputFC).removesuffix(".shp") == OS.path.normpath(lc.dataSource):
                    layerMain = lc

        if layerGroup and len(layerGroup.listLayers()):
            for lyr in layerGroup.listLayers():
                if lyr.isGroupLayer:
                    break
                df = lyr.getDefinition("V3")
                df.renderer.heading = lyr.name
                df.expanded = False  # collapse
                try:
                    if df.renderer.field in [FN_abs_max_lag, FN_max_lag, FN_min_lag]:
                        title = {
                            FN_abs_max_lag: ARCPY.GetIDMessage(220809),  # Strongest Absolute Correlation: Count of Locations by Lag
                            FN_max_lag: ARCPY.GetIDMessage(220810),  # Strongest Positive Correlation: Count of Locations by Lag
                            FN_min_lag: ARCPY.GetIDMessage(220811)  # Strongest Negative Correlation: Count of Locations by Lag
                        }[df.renderer.field]

                        chart = ARCPY.Chart(title)
                        chart.type = 'bar'
                        chart.title = title
                        chart.xAxis.field = df.renderer.field
                        chart.xAxis.sort = "ASC"
                        chart.yAxis.field = ""
                        chart.bar.aggregation = "COUNT"
                        #### Get CIM to Change Properties ####
                        # cim = lyr.getDefinition('V3')
                        #### Add Cat Pair Charts ####
                        df.charts = []
                        chart.dataSource = lyr
                        df.charts.append(chart._getCIM())
                        # chart.addToLayer(lyr)
                except:
                    pass
                lyr.setDefinition(df)
                lyr.visible = False
            #### Move the main output layer into the group layer ####
            if layerMain is not None:
                layerMain.name = FA_abs_max_cor
                l_cim = layerMain.getDefinition("V2")
                l_cim.renderer.heading = FA_abs_max_cor
                layerMain.setDefinition(l_cim)
                map.moveLayer(layerGroup.listLayers()[0], layerMain, "BEFORE")

            #### localize breaker label ####
            for lyr in layerGroup.listLayers():
                df = lyr.getDefinition("V2")
                if hasattr(df.renderer, "breaks") and len(df.renderer.breaks) == 10:
                    for br in df.renderer.breaks:
                        if br.label is not None and " - " in br.label:
                            vals = br.label.split(" - ")
                            br.label = f"{_ff(float(vals[0]), 2)} - {_ff(float(vals[1]), 2)}"
                    lyr.setDefinition(df)

            layerGroup.setGroupType("RADIO")
    except:
        pass


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


class CalculateSpatialExplanatoryVariables(object):
    """
    This class provides the functions used for the calculate  spatial explanatory variables tool
    """

    def __init__(self, ssdo, varNum, varCat, wType=2, includeSelf=True, ignoreNulls=True,
                 calGeoWeight=True, threshold=None, weightsFile=None, numNeighs=0,
                 weightSchema='UNWEIGHTED', kernelBandUnit=None, kernelBandInner=None, kernelBandOuter=None,
                 sourceIsThiessen = False, calSpatialComponents=False, maxSpatialComponentsNum=1, concept="EUCLIDEAN"):

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

        self.varNum = varNum
        self.varCat = varCat
        self.varDim = len(self.varCat) + len(self.varNum)
        self.sourceIsThiessen = sourceIsThiessen

        self.calSpatialComponents = calSpatialComponents
        self.maxSpatialComponentsNum = maxSpatialComponentsNum

        # if statisticMethod.upper() not in supportedStatisticMethods:
        #     ARCPY.AddError("Statistic method not supported.")
        #     raise SystemExit()

        # #### Set Local Statistic Function Pointer ####
        # self.statisticMethodInt = supportedStatisticMethods[statisticMethod.upper()]
        # if self.statisticMethodInt in [0,1,2]:
        #     self.__local_statistics = self.__local_statistics_basic
        # elif self.statisticMethodInt in [3,4,5]:
        #     self.__local_statistics = self.__local_statistics_quantiles
        # else:
        #     self.__local_statistics = self.__local_statistics_all

        #### Set Neighborhood Type Int ####
        self.wType = wType
        if self.wType not in supportedSpatialRelation:
            ARCPY.AddIDMessage("ERROR", 723)
            raise SystemExit()

        self.includeSelf = includeSelf
        self.calGeoWeight = calGeoWeight

        self.distVarName = 'DIST_SUMSTATS_SS'

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
        self.kernelBandUnit = kernelBandUnit
        self.kernelBandInner = kernelBandInner
        self.kernelBandOuter = kernelBandOuter

        if self.kernelBandUnit is not None and self.kernelBandOuter is not None:
            self.kernelBand = f"{self.kernelBandOuter} {self.kernelBandUnit}"
        else:
            self.kernelBand = None

        if self.kernelBandUnit is not None and kernelBandInner is not None:
            if kernelBandInner > 0:
                ARCPY.AddError("Inner Bandwidth must be less than or equal to 0.")

        self.__setLinearUnitInfo()

        #### Prepare Data ####
        self.numObs = self.ssdo.numObs
        self.varNames = list(set([e[0].upper() for e in varNum] + [e[0].upper() for e in varCat]))
        self.__prepare_data()

        #### Finalize KDTree Search Info/Method ####
        if self.wType == 1:
            self.neighSearch.setDistance(self.distanceBand)
        if self.wType == 2:
            self.neighSearch.setKNN(self.numNeighs)

        # #### Create Results Array ####
        # if self.statisticMethodInt == supportedStatisticMethods["ALL"]:
        #     self.resultBlockSize = len(supportedStatisticMethods) - 1
        # else:
        #     self.resultBlockSize = 1

        # self.results = {}
        # self.distVarName = 'DIST_SUMSTATS_SS'
        # for varName in varNames:
        #     self.results[varName] = NUM.zeros((self.numObs, self.resultBlockSize), dtype=float)
        # self.results[self.distVarName] = NUM.zeros((self.numObs, self.resultBlockSize), dtype=float)
        # self.resultNNeighbors = NUM.zeros((self.numObs, self.varDim), dtype=NUM.int32)
        self.baseNNeighbors = NUM.zeros((self.numObs,), dtype=NUM.int32)

        #### Keep Track of Bad Records ####
        self.badRecords = set([])
        self.beyondBandRecords = set([])

        self.result_eig_values = None
        self.result_eig_vectors = None

        ARCPY.AddWarning("Only calculating MEM is implemented for now.")
        if self.calSpatialComponents:
            self.__calculate_mem()
        ARCPY.AddMessage("Local weight matrix built.")

        #### Calculate Stats ####
        # self.__calculate()

        return

        #### Report Distance Larger than Band Records ####
        self.__reportBeyondBandwidthRecords()

        #### Calculate and Report Features w/ NULL Outputs ####
        self.__identifyNullRecords()


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

    def __dist(self, id1, id2):
        return ((self.coordinates[id1] - self.coordinates[id2]) ** 2).sum() ** 0.5

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

    def __calculate_mem(self):
        """
        Constructs the neighborhood structure for each feature and
        dispatches the appropriate values for the calculation of the
        statistic.
        Returns
        -------

        """
        ssdo = self.ssdo
        weightMtx = NUM.zeros((self.numObs, self.numObs), dtype=float)
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
                                                         isSubSet=isSubSet)
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
                    weightMtx[orderID, nhIDs] = sWeights

                    # #### Assure Neighbors Exist After Selection ####
                    # nn = len(nhIDs)
                    #
                    # if nn:
                    #     #### Calculate Centroid Distances and Stats ####
                    #     distances = NUM.zeros(nn, dtype=float)
                    #     for nInd, nh in enumerate(nhIDs):
                    #         distances[nInd] = self.__dist(orderID, nh)
                    #     self.__distance_statistics(orderID, distances)
                    #
                    #     #### Calculate Local Stats ####
                    #     if self.doLocalStats:
                    #         values = self.y[nhIDs]
                    #         self.__local_statistics(orderID, values, sWeights)

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
            # ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84129), 0, len(self.master2Order), 1)
            for masterID in self.master2Order.keys():
                orderID, yiVal, nhIDs, nhVals, weights = WU.getWeightsValuesCont(masterID, self.master2Order,
                                                                                 contDict, self.y,
                                                                                 rowStandard=False)
                weightMtx[orderID, nhIDs] = weights

                # #### Calculate Centroid Distances and Stats ####
                # distances = NUM.zeros(len(nhIDs), dtype=float)
                # for ind, nid in enumerate(nhIDs):
                #     distances[ind] = self.__dist(orderID, nid)
                # self.__distance_statistics(orderID, distances)
                #
                # #### Calculate Local Stats ####
                # if self.doLocalStats:
                #     if self.includeSelf:
                #         nhs = [orderID] + nhIDs
                #     else:
                #         nhs = nhIDs
                #     values = self.y[nhs]
                #     weights = NUM.ones(len(nhs), dtype=float)
                #     self.__local_statistics(orderID, values, weights)
                #
                # ARCPY.SetProgressorPosition()
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
                distances = NUM.zeros(len(nhIDs), dtype=float)

                if self.includeSelf:
                    nhs = NUM.array([orderID] + list(nhIDs))
                else:
                    nhs = nhIDs

                if self.weightSchema != 0:
                    weights = self.__genLocalWeights(orderID, nhIDs=nhs)
                else:
                    weights = NUM.ones(len(nhs), dtype=float)
                weightMtx[orderID, nhs] = weights

                # for ind, nid in enumerate(nhIDs):
                #     distances[ind] = self.__dist(orderID, nid)
                # self.__distance_statistics(orderID, distances)
                #
                # #### Calculate Local Stats ####
                # if self.doLocalStats:
                #     if self.includeSelf:
                #         nhs = NUM.array([orderID] + list(nhIDs))
                #     else:
                #         nhs = nhIDs
                #     values = self.y[nhs]
                #     if self.weightSchema != 0:
                #         weights = self.__genLocalWeights(orderID, nhIDs=nhs)
                #     else:
                #         weights = NUM.ones(len(nhs), dtype=float)
                #     self.__local_statistics(orderID, values, weights)

                # ARCPY.SetProgressorPosition()

        # ARCPY.AddMessage(ssdo.numObs)
        # ARCPY.AddMessage(weightMtx.sum(axis=1))
        """
        M <- diag(n) - matrix(1,n,n)/n

        ## generate eigenvectors
        MBM <- M %*% B %*% M
        eig <- eigen(MBM, symmetric = T)
        EV <- eig$vectors[ ,eig$values/eig$values[1] > 0.25]
        colnames(EV) <- paste("EV", 1:NCOL(EV), sep="")
        """

        # M = NUM.eye(self.numObs) - NUM.ones((self.numObs, self.numObs)) / self.numObs
        # MEM = M @ weightMtx @ M
        # ARCPY.AddMessage(MEM)


        row_mean = NUM.mean(weightMtx, axis=1)
        col_mean = NUM.mean(weightMtx, axis=0)
        tot_mean = NUM.mean(weightMtx)
        w_centered = weightMtx - row_mean[:, NUM.newaxis] - col_mean + tot_mean


        eig_vals, eig_vecs = SCI.linalg.eig(w_centered)

        sorted_ind = NUM.argsort(eig_vals)[::-1]
        eig_vals = eig_vals[sorted_ind]
        eig_vecs = eig_vecs[:, sorted_ind]

        eig_vals = eig_vals.real
        eig_vals_original = eig_vals.copy()

        # Remove near-zero eigenvalues
        nonzero_indices = NUM.where(~NUM.isclose(eig_vals, 0, atol=1e-10))[0]
        # ARCPY.AddMessage(eig_vals.shape)
        # ARCPY.AddMessage(eig_vecs.shape)
        # ARCPY.AddMessage("-------------------")

        eig_vals = eig_vals[nonzero_indices]
        eig_vecs = eig_vecs[:, nonzero_indices].squeeze()
        # ARCPY.AddMessage(eig_vals.shape)
        # ARCPY.AddMessage(eig_vecs.shape)
        # ARCPY.AddMessage(eig_vals)
        # ARCPY.AddMessage("-------------------")

        # Filter for positive spatial autocorrelation with 0.25 threshold
        positive_indices = NUM.where(eig_vals / eig_vals[0] > 0.25)[0]
        # positive_indices = NUM.where(eig_vals / eig_vals[0] < 0)[0][::-1]

        eig_vals = eig_vals[positive_indices]
        eig_vecs = eig_vecs[:, positive_indices].squeeze()
        # ARCPY.AddMessage(eig_vals.shape)
        # ARCPY.AddMessage(eig_vecs.shape)
        # ARCPY.AddMessage(eig_vals)
        # ARCPY.AddMessage("-------------------")

        self.result_eig_values = eig_vals
        self.result_eig_vectors = eig_vecs.real

        #### Plot the eigen values chart ####
        plt.rcParams['font.family'] = ['Segoe UI', 'serif', 'sans-serif', 'Microsoft YaHei']
        if UTILS.couldExportHTMLMessage():
            plt.rcParams.update({'font.size': 12})
            fig = plt.figure(figsize=GLOBAL_OUTPUT_FIG_SIZE)
            # fig.rcParams.update({'font.size': 22})
            ax = fig.add_subplot(axes_class=Axes)
            ax.axes.axis["right"].set_visible(False)
            ax.axes.axis["top"].set_visible(False)
            plt.ioff()
            xs = NUM.arange(len(eig_vals_original))
            ys = eig_vals_original
            text_length_limit = 15

            plt.plot(xs, ys,
                     c="#1976d2", alpha=0.9, marker='o', markersize=6,
                     label=f"Eigen Value", linewidth=1,
                     zorder=9)  # "Original"
            plt.axvline(x=len(positive_indices), linewidth=1.5, linestyle='--', color="#f57c00",
                        label=f"0.25 Threshold({len(positive_indices)})")  # "Balance Threshold"

            # fig.supxlabel(ARCPY.GetIDMessage(220744))  # "Absolute Correlation"
            # plt.title("Eigen Values of MEM")
            plt.legend()

            tmpfile = BytesIO()
            plt.savefig(tmpfile, format="png", bbox_inches="tight")
            # plt.savefig(tmpfile, format="svg", bbox_inches="tight")
            plt.close(fig)
            encoded = base64.b64encode(tmpfile.getvalue()).decode("utf-8")
            result_graph_corr = f"data:image/png;base64,{encoded}"
            # result_graph_corr = f"data:image/svg+xml;base64,{encoded}"
            UTILS.outputHeader("Eigen Values of MEM Chart", 5)
            ARCPY.AddMessage(
                """json:[{"element":"image", "data":"%s", "elementProps": {"style": "width: 800px;"}}]"""
                % result_graph_corr)

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
                                                         isSubSet=isSubSet)
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
                        distances = NUM.zeros(nn, dtype=float)
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
                distances = NUM.zeros(len(nhIDs), dtype=float)
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
                    weights = NUM.ones(len(nhs), dtype=float)
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
                distances = NUM.zeros(len(nhIDs), dtype=float)
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
                        weights = NUM.ones(len(nhs), dtype=float)
                    self.__local_statistics(orderID, values, weights)

                ARCPY.SetProgressorPosition()

    def createOutput(self, outputFC):
        ARCPY.env.overwriteOutput = True
        if outputFC is None:
            ARCPY.AddError("Appending to input feature class is not implemented.")
            raise SystemExit()

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

        # if self.statisticMethodInt == 6:
        #     sta2append = [0, 1, 2, 3, 4, 5]
        # else:
        #     sta2append = [self.statisticMethodInt]
        candidateFields = {}
        fieldOrder = []

        self.symbolField = None
        self.symbolAlias = None
        self.symbolData = None

        #### Append Eigen Vectors ####
        if self.result_eig_vectors is not None:
            ARCPY.AddMessage(self.result_eig_vectors.shape)
            vce_num = min(self.result_eig_vectors.shape[1], self.maxSpatialComponentsNum)
            for i in range(vce_num):
                fieldName = f"EV_{i}"
                alias = f"Eigen Vector {i}"
                candidateField = SSDO.CandidateField(fieldName, "DOUBLE", self.result_eig_vectors[:, i], alias = alias,
                                                     checkNullValues = False)
                candidateFields[fieldName] = candidateField
                fieldOrder.append(fieldName)

        # allVarNames = self.varNames + [self.distVarName]
        allVarNames = self.varNames
        # for res_ind, varName in enumerate(allVarNames):
        #     useDist = False
        #     if varName == self.distVarName:
        #         varNameOrigin = "DIST"
        #         aliasOrigin = "Distance to Neighbors"
        #         useDist = True
        #     else:
        #         varNameOrigin = self.varNames[res_ind]
        #         aliasOrigin = self.ssdo.fields[varNameOrigin].alias
        #
        #     for sta_ind, template_ind in enumerate(sta2append):
        #         data = self.results[varName][:, sta_ind]
        #         alias = aliasTemplates[template_ind].format(aliasOrigin)
        #         fieldName = self.__buildFieldName(candidateFields, varNameOrigin, fieldTemplates[template_ind])
        #         candidateField = SSDO.CandidateField(fieldName, "DOUBLE", data, alias = alias,
        #                                              checkNullValues = True)
        #         candidateFields[fieldName] = candidateField
        #         fieldOrder.append(fieldName)
        #         if self.symbolField is None:
        #             self.symbolField = fieldName
        #             self.symbolAlias = alias
        #             self.symbolData  =data
        #
        #     #### Add number of neighbors ####
        #     if useDist:
        #         neighCountData = self.baseNNeighbors
        #     else:
        #         neighCountData = self.resultNNeighbors[:, res_ind]
        #     neighCountAlias = numNeiAliasTemplate.format(aliasOrigin)
        #     neighCountFieldName = self.__buildFieldName(candidateFields, varNameOrigin, numNeiFieldTemplate)
        #     neighCountField = SSDO.CandidateField(neighCountFieldName, "LONG", neighCountData,
        #                                           alias = neighCountAlias)
        #     candidateFields[neighCountFieldName] = neighCountField
        #     fieldOrder.append(neighCountFieldName)

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