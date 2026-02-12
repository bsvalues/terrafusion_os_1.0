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

import SSDecomposeSpatialStructure
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
from scipy.sparse import lil_array as SparseMtx
import base64
from io import BytesIO
import time
from enum import IntEnum, Enum
import tempfile as TEMPFILE
import textwrap as TEXTWRAP

import matplotlib
matplotlib.use('Agg')
from matplotlib import pyplot as plt
from mpl_toolkits.axisartist.axislines import Axes

GLOBAL_EXPORT_BOOTSTRAP_SAMPLE_ERFS = False
GLOBAL_ERF_INTERPOLATION_GRID_SIZE = 200
GLOBAL_OUTPUT_FIG_SIZE = (12, 8)
INCLUDE_FOCAL_IN_WEIGHT_MTX = False
SOLVE_WITH_SPARSE_MATRIX = True
MAX_NUM_EIGEN_VECTORS_TO_KEEP = 100  # Maximum number of eigen vectors to keep
RUN_CPP_CODE = True


class SupportedEVSelectMethods(Enum):
    GLOBAL = "GLOBAL"
    FORWARD_SELECTION = "FORWARD_SELECTION"
    MIN_SPATIAL_AUTOCORRELATION = "MIN_SPATIAL_AUTOCORRELATION"


class SupportedSpatialRelation(IntEnum):
    FIXED_DISTANCE = 1
    K_NEAREST_NEIGHBORS = 2
    DELAUNAY_TRIANGULATION = 3
    CONTIGUITY_EDGES_ONLY = 4
    CONTIGUITY_EDGES_CORNERS = 5
    GET_SPATIAL_WEIGHTS_FROM_FILE = 8


class SupportedWeightSchema(IntEnum):
    UNWEIGHTED = 0
    BISQUARE = 1
    GAUSSIAN = 2

    @staticmethod
    def get_print_name(weight_schema):
        if weight_schema == SupportedWeightSchema.UNWEIGHTED:
            schema_name = ARCPY.GetIDMessage(220884)
        elif weight_schema == SupportedWeightSchema.BISQUARE:
            schema_name = ARCPY.GetIDMessage(220885)
        else:  # weightSchema == SupportedWeightSchema.GAUSSIAN
            schema_name = ARCPY.GetIDMessage(220886)
        return schema_name


MAX_NUM_NEIGHS = 1000

CandidateSWMConfigures = {
    SupportedSpatialRelation.FIXED_DISTANCE: {
        "bottom": 1,  # the distance that make sure each feature has at least 1 neighbor
        "top": 0.2,  # 20% of the diagonal of the extent
        "number": 5  # number of candidates
    },
    SupportedSpatialRelation.K_NEAREST_NEIGHBORS: [8, 16, 32, 64],
    SupportedSpatialRelation.DELAUNAY_TRIANGULATION: None,
    SupportedSpatialRelation.CONTIGUITY_EDGES_CORNERS: None,
}
CandidateSWMWeightSchemas = [
    SupportedWeightSchema.UNWEIGHTED,
    SupportedWeightSchema.BISQUARE,
    SupportedWeightSchema.GAUSSIAN
]


def isLicensed():
    # The Enable Attachments functions require Standard+ license
    try:
        license_available = ["Available", "AlreadyInitialized"]
        if ARCPY.GetInstallInfo()['ProductName'] == 'Server':
            return True
        if ARCPY.GetInstallInfo()['ProductName'] == 'ArcGISPro':
            if ARCPY.CheckProduct("ArcInfo") in license_available or ARCPY.CheckProduct(
                    "ArcEditor") in license_available:
                return True
            else:
                raise Exception
    except Exception:
        return False
    return True


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


def _build_adj_r2_cell():
    # "Adjusted R^2", UTILS.buildSuperscript("2")
    vals = ARCPY.GetIDMessage(220875).split("{0}")
    if len(vals[0]) == 0:
        vals[0] = UTILS.buildSuperscript("2")
    elif len(vals[1]) == 0:
        vals[1] = UTILS.buildSuperscript("2")
    else:
        vals = [vals[0], UTILS.buildSuperscript("2"), vals[1]]
    return vals

def _svd_decomp(X):
    N = X.shape[0]
    D = X.shape[1]
    svd_U, svd_S, svd_Vh = NUM.linalg.svd(X, full_matrices=False)
    svd_V = svd_Vh.T
    svd_S2 = svd_S**2
    pos_inds = NUM.where(svd_S2 > 1e-16)[0]
    svd_S2 = svd_S2[pos_inds]
    svd_U = svd_U[:, pos_inds]
    svd_V = svd_V[:, pos_inds]
    res = {
        "eig": svd_S2,
        "poseig": None,
        "u": svd_U,
        "v": svd_V,
        "rank": len(svd_S2),
        "tot.chi": sum(svd_S2)
    }
    return res

def execute(parameters, messages):
    """Retrieves the parameters from the User Interface and executes the
    appropriate commands."""

    #### User Defined Inputs ####
    inputFC = UTILS.getTextParameter("in_features", parameters)
    appendAll = ARCPY.GetParameterInfo()["append_all_fields"].value
    outputFC = UTILS.getTextParameter("out_features", parameters)
    spaceConcept = UTILS.getTextParameter("neighborhood_type", parameters)

    auto_select = ARCPY.GetParameterInfo()["optimization"].value
    if auto_select:
        autoSelectMethod = UTILS.getTextParameter("optimization_type", parameters)
        autoSelectVarNames = UTILS.getTextParameter("target_variables", parameters)
        if autoSelectVarNames is not None:
            autoSelectVarNames = autoSelectVarNames.upper().split(";")
        else:
            autoSelectVarNames = []
    else:
        autoSelectMethod = None
        autoSelectVarNames = []

    autoSelectPThreshold = 0.05

    #### Check Advanced License for Delaunay ####
    if spaceConcept == 'DELAUNAY_TRIANGULATION':
        if not isLicensed():
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

    varNames = []
    if appendAll:
        fields = ARCPY.ListFields(inputFC)
        for field in fields:
            if field.name.upper() not in ["OBJECTID", "SHAPE", "SHAPE_LENGTH", "SHAPE_AREA"] and field.type in ["SmallInteger", "Integer", "Single", "Double", "String", "Date", "BigInteger", "DateOnly", "TimestampOffset"]:
                varNames.append(field.name.upper())

    for v in autoSelectVarNames:
        if v not in varNames:
            varNames.append(v)

    #### Apply Exec new field checker ####
    check = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC, fields=varNames, weightsFile=weightsFile)

    try:
        wType = WU.weightDispatch[spaceConcept]
    except:
        ARCPY.AddIDMessage("ERROR", 723)
        raise SystemExit()
    weightSchema = UTILS.getTextParameter("local_weighting_scheme", parameters)

    kernelBand = None
    if weightSchema in ['BISQUARE', 'GAUSSIAN']:
        kernelBand = UTILS.getTextParameter("kernel_bandwidth", parameters)

    #### Do Theissen Polygons for Delaunay and Set To Polygon Neighbors ####
    if wType == SupportedSpatialRelation.DELAUNAY_TRIANGULATION:
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220088))
        inMemoryFC = "in_memory/LSSThiessenPolygonsTempFC"
        clearedThiessen = UTILS.clearExtent(ARCPY.CreateThiessenPolygons_analysis)
        clearedThiessen(inputFC, inMemoryFC, "ALL")
        ssdo = SSDO.SSDataObject(inMemoryFC, templateFC=outputFC)
        masterField = "INPUT_FID"
        wType = SupportedSpatialRelation.CONTIGUITY_EDGES_CORNERS
        sourceIsThiessen = True
    else:
        #### Create SSDataObject ####
        ssdo = SSDO.SSDataObject(inputFC, templateFC=outputFC)

        #### Set Unique ID Field ####
        masterField = UTILS.setUniqueIDField(ssdo, weightsFile=weightsFile)
        sourceIsThiessen = False

    maxSpatialComponentsNum = UTILS.getNumericParameter("max_components", parameters)
    if maxSpatialComponentsNum is None:
        maxSpatialComponentsNum = 15
    if maxSpatialComponentsNum < 1:
        maxSpatialComponentsNum = 1
    morans_threshold = UTILS.getNumericParameter("min_autocorrelation", parameters)

    #### Populate SSDO with Data ####
    ssdo.obtainData(masterField, varNames, minNumObs=30, useNullinFields=varNames)

    #### Make Sure the Number of Neighbors is less Than the Total Number of Features ####
    if numNeighs and numNeighs >= ssdo.numObs:
        ARCPY.AddIDMessage("ERROR", 110265)
        raise SystemExit()
    dss = DecomposeSpatialStructure(
        ssdo, varNames, outputFC,
        wType=wType, weightsFile=weightsFile, numNeighs=numNeighs, threshold=threshold,
        weightSchema=weightSchema, kernelBand=kernelBand, sourceIsThiessen=sourceIsThiessen,
        morans_threshold=morans_threshold, maxSpatialComponentsNum=maxSpatialComponentsNum,
        concept="EUCLIDEAN",
        autoSelectMethod=autoSelectMethod, autoSelectTargetVarNames=autoSelectVarNames,
        autoSelectPThreshold=autoSelectPThreshold)

    dss.createOutput(outputFC)

    ind_output_features = 1
    if ssdo.shapeType.upper() == "POLYGON" or sourceIsThiessen:
        parameters[ind_output_features].symbology = OS.path.join(
            UTILS.pathLayers, "DecomposeSpatialStructure_Polygon.lyrx")
    else:
        parameters[ind_output_features].symbology = OS.path.join(
            UTILS.pathLayers, "DecomposeSpatialStructure_Point.lyrx")

    return


def execute_individual(parameters, messages, tool_name, output_ind):
    if tool_name not in [None, "GLOBAL", "FORWARD_SELECTION", "MIN_SPATIAL_AUTOCORRELATION"]:
        ARCPY.AddError("Unsupported tool name.")
        raise SystemExit()

    #### User Defined Inputs ####
    inputFC = UTILS.getTextParameter("in_features", parameters)
    if tool_name != "GLOBAL":
        appendAll = ARCPY.GetParameterInfo()["append_all_fields"].value
        outputFC = UTILS.getTextParameter("out_features", parameters)
    else:
        appendAll = False
        outputFC = None

    autoSelectMethod = tool_name
    out_SWM_file = None
    out_SWM_file_uniqueId = None

    #### Create SSDataObject ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC=outputFC)

    if autoSelectMethod is not None:
        if tool_name == "MIN_SPATIAL_AUTOCORRELATION":
            autoSelectVarNames = UTILS.getTextParameter("input_field", parameters)
        else:
            autoSelectVarNames = UTILS.getTextParameter("input_fields", parameters)

        if autoSelectVarNames is not None:
            autoSelectVarNames = autoSelectVarNames.upper().split(";")
        else:
            autoSelectVarNames = []
        spaceConcept = None
        threshold = None
        numNeighs = None
        if tool_name == "GLOBAL":
            weightsFile = None
            out_SWM_file = UTILS.getTextParameter("out_swm", parameters)
            out_SWM_file_uniqueId = UTILS.getTextParameter("id_field", parameters)
        else:
            weightsFile = UTILS.getTextParameter("in_swm", parameters)
            if weightsFile is None:
                out_SWM_file = UTILS.getTextParameter("out_swm", parameters)
                out_SWM_file_uniqueId = UTILS.getTextParameter("id_field", parameters)

        if out_SWM_file_uniqueId is not None and out_SWM_file is None:
            ARCPY.AddError("output SWM file not provided.")
            raise SystemExit()

        #### Set Unique ID Field ####
        masterField = UTILS.setUniqueIDField(ssdo, weightsFile=weightsFile)
        maxSpatialComponentsNum = None
        morans_threshold = None
        wType = None
        weightSchema = None
        kernelBand = None

    else:
        autoSelectVarNames = []
        spaceConcept = UTILS.getTextParameter("neighborhood_type", parameters)
        #### Check Advanced License for Delaunay ####

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
        try:
            wType = WU.weightDispatch[spaceConcept]
        except:
            ARCPY.AddIDMessage("ERROR", 723)
            raise SystemExit()

        weightSchema = UTILS.getTextParameter("local_weighting_scheme", parameters)

        kernelBand = None
        if weightSchema in ['BISQUARE', 'GAUSSIAN']:
            kernelBand = UTILS.getTextParameter("kernel_bandwidth", parameters)
        else:
            weightSchema = "UNWEIGHTED"

        masterField = UTILS.setUniqueIDField(ssdo, weightsFile=weightsFile)
        maxSpatialComponentsNum = UTILS.getNumericParameter("max_components", parameters)
        if maxSpatialComponentsNum is None:
            maxSpatialComponentsNum = 15
        if maxSpatialComponentsNum < 1:
            maxSpatialComponentsNum = 1
        morans_threshold = UTILS.getNumericParameter("min_autocorrelation", parameters)

        out_SWM_file = UTILS.getTextParameter("out_swm", parameters)
        out_SWM_file_uniqueId = UTILS.getTextParameter("id_field", parameters)

        if out_SWM_file is None or out_SWM_file_uniqueId is None:
            out_SWM_file = None
            out_SWM_file_uniqueId = None

    autoSelectPThreshold = 0.05

    varNames = []
    if appendAll:
        fields = ARCPY.ListFields(inputFC)
        for field in fields:
            if field.name.upper() not in ["OBJECTID", "SHAPE", "SHAPE_LENGTH", "SHAPE_AREA"] and field.type in [
                "SmallInteger", "Integer", "Single", "Double", "String", "Date", "BigInteger", "DateOnly",
                "TimestampOffset"]:
                varNames.append(field.name.upper())

    for v in autoSelectVarNames:
        if v not in varNames:
            varNames.append(v)
    if out_SWM_file_uniqueId is not None and out_SWM_file_uniqueId not in varNames:
        varNames.append(out_SWM_file_uniqueId)

    #### Apply Exec new field checker ####
    if outputFC is not None:
        check = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC, fields=varNames, weightsFile=weightsFile)
    #### Populate SSDO with Data ####
    fields_allow_none = varNames.copy()
    for v in autoSelectVarNames:
        if v in fields_allow_none:
            fields_allow_none.remove(v)
    if out_SWM_file_uniqueId is not None and out_SWM_file_uniqueId in fields_allow_none:
        fields_allow_none.remove(out_SWM_file_uniqueId)
    varNames = [f.upper() for f in varNames]
    fields_allow_none = [f.upper() for f in fields_allow_none]

    ssdo.obtainData(masterField, varNames, minNumObs=30, useNullinFields=fields_allow_none)

    #### Make Sure the Number of Neighbors is less Than the Total Number of Features ####
    if autoSelectMethod is None and numNeighs and numNeighs >= ssdo.numObs:
        ARCPY.AddIDMessage("ERROR", 110265)
        raise SystemExit()
    dss = DecomposeSpatialStructure(
        ssdo, varNames, outputFC,
        wType=wType, weightsFile=weightsFile, numNeighs=numNeighs, threshold=threshold,
        weightSchema=weightSchema, kernelBand=kernelBand,
        morans_threshold=morans_threshold, maxSpatialComponentsNum=maxSpatialComponentsNum,
        concept="EUCLIDEAN",
        autoSelectMethod=autoSelectMethod, autoSelectTargetVarNames=autoSelectVarNames,
        autoSelectPThreshold=autoSelectPThreshold, outSWMFileUniqueIdField=out_SWM_file_uniqueId)

    dss.createOutput(outputFC, out_SWM_file)
    if output_ind > 0:
        if ssdo.shapeType.upper() == "POLYGON":
            if autoSelectMethod == "MIN_SPATIAL_AUTOCORRELATION":
                parameters[output_ind].symbology = OS.path.join(
                    UTILS.pathLayers, "DecomposeSpatialStructure_MIR_Polygon.lyrx")
            else:
                parameters[output_ind].symbology = OS.path.join(
                    UTILS.pathLayers, "DecomposeSpatialStructure_Polygon.lyrx")
                # UTILS.buildLocaleCIMLayer("DecomposeSpatialStructure_Polygon.lyrx", output_ind)
        else:
            if autoSelectMethod == "MIN_SPATIAL_AUTOCORRELATION":
                parameters[output_ind].symbology = OS.path.join(
                    UTILS.pathLayers, "DecomposeSpatialStructure_MIR_Point.lyrx")
            else:
                parameters[output_ind].symbology = OS.path.join(
                    UTILS.pathLayers, "DecomposeSpatialStructure_Point.lyrx")
                # UTILS.buildLocaleCIMLayer("DecomposeSpatialStructure_Point.lyrx", output_ind)

    return


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

    def buildIncremantalDist(self, start_knn=1, end_extent_prectange=0.2, step=5):
        """
        build a series of incremental distance thresholds as candidates for auto MEM selection
        """
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84144), 0, self.numLocations, 1)
        threshold = 0.0
        k = start_knn + 1
        for orderID in range(self.numLocations):
            coord = self.coords[orderID]
            distances, ids = self.kdTree.query(coord, k=k, p=self.p)
            if k == 1:
                maxDist = distances
            else:
                maxDist = distances[-1]
            if maxDist > threshold:
                threshold = maxDist
            ARCPY.SetProgressorPosition()

        #### Chordal Default Check ####
        if self.ssdo.useChordal:
            hardMaxExtent = ARC._ss.get_max_gcs_distance(self.ssdo.spatialRef)
            if threshold > hardMaxExtent:
                ARCPY.AddIDMessage("ERROR", 1609)
                raise SystemExit()

        #### Increase For Rounding Error ####
        threshold_bottom = threshold * 1.0001
        width = self.ssdo.extent.width
        height = self.ssdo.extent.height
        threshold_ceiling = (width * width + height * height) ** 0.5 * end_extent_prectange
        if threshold_ceiling < threshold_bottom:
            threshold_ceiling = threshold_bottom * 2
        gap = (threshold_ceiling - threshold_bottom) / step
        thresholds = [threshold_bottom + gap * i for i in range(step)]
        return thresholds

    def buildKNNThreshold(self, knn):
        """
        build a series of incremental distance thresholds as candidates for auto MEM selection
        """
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84144), 0, self.numLocations, 1)
        threshold = 0.0
        for orderID in range(self.numLocations):
            coord = self.coords[orderID]
            distances, ids = self.kdTree.query(coord, k=knn+2, p=self.p)
            if knn == 1:
                maxDist = distances
            else:
                maxDist = distances[-1]
            if maxDist > threshold:
                threshold = maxDist
            ARCPY.SetProgressorPosition()

        #### Chordal Default Check ####
        if self.ssdo.useChordal:
            hardMaxExtent = ARC._ss.get_max_gcs_distance(self.ssdo.spatialRef)
            if threshold > hardMaxExtent:
                ARCPY.AddIDMessage("ERROR", 1609)
                raise SystemExit()
        return threshold


class DecomposeSpatialStructure(object):
    """
    This class provides the functions used for the calculate  spatial explanatory variables tool
    """

    def __init__(self, ssdo, varNames, outputFC, wType=SupportedSpatialRelation.K_NEAREST_NEIGHBORS,
                 calGeoWeight=True, weightsFile=None, numNeighs=0,
                 weightSchema='UNWEIGHTED', kernelBand=None, threshold=None,
                 morans_threshold=0.25, maxSpatialComponentsNum=1, concept="EUCLIDEAN",
                 autoSelectMethod=None, autoSelectTargetVarNames=[], autoSelectPThreshold=0.05, outSWMFileUniqueIdField=None):

        self.ssdo = ssdo
        if self.ssdo.shapeType.upper() not in ["POLYGON", "POINT"]:
            ARCPY.AddIDMessage('ERROR', 366)
            raise SystemExit()
        self.isPolygon = ssdo.shapeType.upper() == "POLYGON"
        self.do_adaptive_kernel_bandwidth = False
        """If user select KNN and the weighted schema is not unweighted, the adaptive kernel bandwidth will be used"""

        #### Prepare Data ####
        self.numObs = self.ssdo.numObs
        self.varNames = varNames
        self.numNeighs = numNeighs
        self.wType = None
        if autoSelectMethod is not None and autoSelectMethod.upper() in SupportedEVSelectMethods.__members__ and len(
                autoSelectTargetVarNames) > 0:
            self.auto_select_method = SupportedEVSelectMethods[autoSelectMethod.upper()]
        else:
            self.auto_select_method = None

        if outSWMFileUniqueIdField is not None:
            self.outSWMFileUniqueIdField = outSWMFileUniqueIdField.upper()
        else:
            self.outSWMFileUniqueIdField = None
        self.__prepare_data()

        self.includeSelf = INCLUDE_FOCAL_IN_WEIGHT_MTX

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

        self.numThreads = UTILS.getNumberOfThreadsDefault()
        #### Get Initial Seeds ####
        self.randSeed = UTILS.getRandomSeed()
        if self.randSeed == 0:
            self.randSeed = int(time.time() * 10000) % 9999
        # ARCPY.AddMessage(f"---> Random Seed: {self.randSeed}")
        # ARCPY.AddMessage(f"---> Num Threads: {self.numThreads}")
        self.num_total_swm_candidates = 0
        self.result_eig_values = None
        self.result_eig_vectors = None
        self.result_global_weight_matrix = None
        self.res_morans_i = None
        self.current_swm_cache = {
            "wType": None,
            "weightSchema": None,
            "data": {}
        }
        self.candidateSWMConfigures = CandidateSWMConfigures.copy()
        if self.auto_select_method is not None:
            self.auto_select_vars = autoSelectTargetVarNames
            #### Check the variance of input variables, all constant is not allowed ####
            bad_vars = []
            for ind, varName in enumerate(self.auto_select_vars):
                y = self.ssdo.fields[varName].returnDouble()
                if NUM.isclose(NUM.var(y), 0):
                    bad_vars.append(self.ssdo.fields[varName].alias)
            if len(bad_vars) > 0:
                ARCPY.AddIDMessage("ERROR", 110355, "; ".join(bad_vars))
                raise SystemExit()

            self.auto_select_p_val_threshold = autoSelectPThreshold
            self.auto_select_opt_swm = None
            self.morans_threshold = None
            distance_unit_used = None
            if weightsFile:
                self.candidateSWMConfigures.clear()  # If input weights file is provided, clear the default candidates and use the provided weights file only
                self.candidateSWMConfigures[SupportedSpatialRelation.GET_SPATIAL_WEIGHTS_FROM_FILE] = {
                    "file": weightsFile,
                    "is_swm": self.swmFileBool
                }

            self.result_auto_select_collection = {
                "elements": [],
                "optimal_ind": -1,
                "optimal_eigen_vals": None,
                "optimal_eigen_vecs": None,
                "optimal_eig_vals_original": None,
            }
            self.swm_i_j = None
            self.swm_w = None

            #### Loop through all the SWM candidates and find the optimal one ####
            neighSearch = KDNeighborSearch(self.ssdo)
            candidates_processed = 0
            self.num_total_swm_candidates = 0
            weight_schema_cand = CandidateSWMWeightSchemas.__len__()
            for key, item in self.candidateSWMConfigures.items():
                if key == SupportedSpatialRelation.FIXED_DISTANCE:
                    self.num_total_swm_candidates += item["number"] * weight_schema_cand
                elif key == SupportedSpatialRelation.K_NEAREST_NEIGHBORS:
                    self.num_total_swm_candidates += len(item) * weight_schema_cand
                elif key == SupportedSpatialRelation.DELAUNAY_TRIANGULATION and not self.isPolygon:
                    self.num_total_swm_candidates += 1
                elif key == SupportedSpatialRelation.CONTIGUITY_EDGES_CORNERS and self.isPolygon:
                    self.num_total_swm_candidates += 1
                elif key == SupportedSpatialRelation.CONTIGUITY_EDGES_ONLY and self.isPolygon:
                    self.num_total_swm_candidates += 1
                elif key == SupportedSpatialRelation.GET_SPATIAL_WEIGHTS_FROM_FILE:
                    self.num_total_swm_candidates += 1

            for spatial_relation in self.candidateSWMConfigures.keys():
                if spatial_relation == SupportedSpatialRelation.K_NEAREST_NEIGHBORS:  # KNN
                    for num_neighs in self.candidateSWMConfigures[spatial_relation]:
                        if num_neighs >= self.numObs:
                            continue
                        neighSearch.setKNN(num_neighs)
                        kernelBand = 0
                        do_adaptive_kernel_bandwidth = False
                        for weight_schema in CandidateSWMWeightSchemas:
                            # if weight_schema != SupportedWeightSchema.UNWEIGHTED and kernelBand == 0:
                            #     kernelBand = neighSearch.buildKNNThreshold(num_neighs)
                            if weight_schema != SupportedWeightSchema.UNWEIGHTED:
                                do_adaptive_kernel_bandwidth = True
                                neighSearch.setKNN(num_neighs + 1)
                            else:
                                do_adaptive_kernel_bandwidth = False
                                neighSearch.setKNN(num_neighs)

                            config_name = f"{ARCPY.GetIDMessage(84747)}({num_neighs}), {ARCPY.GetIDMessage(220883)}({SupportedWeightSchema.get_print_name(weight_schema)})"  # K nearest neighbors(8), Weight Schema(Unweighted)

                            # ARCPY.AddMessage(msg)
                            candidates_processed += 1
                            res = self.__calculate_mem(
                                spatial_relation, self.ssdo, weightsFile=None,
                                neighSearch=neighSearch, weightSchema=weight_schema, kernelBand=kernelBand,
                                msg=ARCPY.GetIDMessage(220870).format(candidates_processed, self.num_total_swm_candidates),
                                isAutoSelection=True, do_adaptive_kernel_bandwidth=do_adaptive_kernel_bandwidth)
                            if not self.__check_eign_values(res["eig_vals"], add_msg=f"({config_name})"):
                                continue
                            self.__update_auto_selection(res, config_name, weight_schema,
                                                         ARCPY.GetIDMessage(220871).format(candidates_processed, self.num_total_swm_candidates))
                elif spatial_relation == SupportedSpatialRelation.FIXED_DISTANCE:  # Fixed Distance
                    distance_bands = neighSearch.buildIncremantalDist(
                        start_knn=self.candidateSWMConfigures[spatial_relation]["bottom"],
                        end_extent_prectange=self.candidateSWMConfigures[spatial_relation]["top"],
                        step=self.candidateSWMConfigures[spatial_relation]["number"])
                    for distance_band in distance_bands:
                        neighSearch.setDistance(distance_band)
                        for weight_schema in CandidateSWMWeightSchemas:
                            # config_name = f"Fixed Distance: {distance_band:.4f}, Weight Schema: {SupportedWeightSchema.get_print_name(weight_schema)}"
                            config_name = f"{ARCPY.GetIDMessage(84746)}({_ff(distance_band)}), {ARCPY.GetIDMessage(220883)}({SupportedWeightSchema.get_print_name(weight_schema)})"  # Fixed Distance:(812), Weight Schema(Unweighted)
                            if distance_unit_used is None:
                                distance_unit_used = UTILS.getLocalizedUnitType(self.ssdo.distanceInfo.name)

                            # ARCPY.AddMessage(msg)
                            # msg = ARCPY.GetIDMessage(220870).format(candidates_processed, self.num_total_swm_candidates)
                            candidates_processed += 1
                            res = self.__calculate_mem(
                                spatial_relation, self.ssdo,  weightsFile=None,
                                neighSearch=neighSearch, weightSchema=weight_schema, kernelBand=distance_band,
                                msg=ARCPY.GetIDMessage(220870).format(candidates_processed, self.num_total_swm_candidates),
                                isAutoSelection=True)
                            if not self.__check_eign_values(res["eig_vals"], add_msg=f"({config_name})"):
                                continue
                            self.__update_auto_selection(res, config_name, weight_schema,
                                                         ARCPY.GetIDMessage(220871).format(candidates_processed, self.num_total_swm_candidates))
                elif spatial_relation == SupportedSpatialRelation.DELAUNAY_TRIANGULATION:  # Delaunay Triangulation
                    if self.isPolygon:
                        continue
                    config_name = ARCPY.GetIDMessage(220837)  # f"Delaunay Triangulation"
                    # msg = AsRCPY.GetIDMessage(220870).format(candidates_processed, self.num_total_swm_candidates)
                    candidates_processed += 1
                    res = self.__calculate_mem(
                        spatial_relation, self.ssdo,
                        weightsFile=None,
                        neighSearch=None, weightSchema=0,
                        msg=ARCPY.GetIDMessage(220870).format(candidates_processed, self.num_total_swm_candidates), isAutoSelection=True)
                    if not self.__check_eign_values(res["eig_vals"], add_msg=f"({config_name})"):
                        continue
                    self.__update_auto_selection(res, config_name, SupportedWeightSchema.UNWEIGHTED,
                                                 ARCPY.GetIDMessage(220871).format(candidates_processed, self.num_total_swm_candidates))
                    # ARCPY.Delete_management(inMemoryFC)
                elif spatial_relation == SupportedSpatialRelation.CONTIGUITY_EDGES_CORNERS:
                    if not self.isPolygon:
                        continue
                    config_name = ARCPY.GetIDMessage(84749)  # f"Contiguity Edges and Corners"
                    # ARCPY.AddMessage(msg)
                    # msg = ARCPY.GetIDMessage(220870).format(candidates_processed, self.num_total_swm_candidates)
                    candidates_processed += 1
                    res = self.__calculate_mem(
                        spatial_relation, self.ssdo,  weightsFile=None,
                        neighSearch=None, weightSchema=0, msg=ARCPY.GetIDMessage(220870).format(candidates_processed, self.num_total_swm_candidates), isAutoSelection=True)
                    if not self.__check_eign_values(res["eig_vals"], add_msg=f"({config_name})"):
                        continue
                    self.__update_auto_selection(res, config_name, SupportedWeightSchema.UNWEIGHTED,
                                                 ARCPY.GetIDMessage(220871).format(candidates_processed, self.num_total_swm_candidates))
                elif spatial_relation == SupportedSpatialRelation.CONTIGUITY_EDGES_ONLY:
                    if not self.isPolygon:
                        continue
                    config_name = ARCPY.GetIDMessage(84748)  # f"Contiguity Edges Only"
                    # ARCPY.AddMessage(msg)
                    # msg = ARCPY.GetIDMessage(220870).format(candidates_processed, self.num_total_swm_candidates)
                    candidates_processed += 1
                    res = self.__calculate_mem(
                        spatial_relation, self.ssdo,  weightsFile=None,
                        neighSearch=None, weightSchema=0, msg=ARCPY.GetIDMessage(220870).format(candidates_processed, self.num_total_swm_candidates),
                        isAutoSelection=True)
                    if not self.__check_eign_values(res["eig_vals"], add_msg=f"({config_name})"):
                        continue
                    self.__update_auto_selection(res, config_name, SupportedWeightSchema.UNWEIGHTED,
                                                 ARCPY.GetIDMessage(220871).format(candidates_processed, self.num_total_swm_candidates))
                elif spatial_relation == SupportedSpatialRelation.GET_SPATIAL_WEIGHTS_FROM_FILE:
                    config_name = f"From Spatial Weight Matrix File"
                    # ARCPY.AddMessage(msg)
                    # msg = ARCPY.GetIDMessage(220870).format(candidates_processed, self.num_total_swm_candidates)
                    candidates_processed += 1
                    res = self.__calculate_mem(
                        spatial_relation, self.ssdo,
                        weightsFile=self.candidateSWMConfigures[spatial_relation]["file"],
                        swmFileBool=self.candidateSWMConfigures[spatial_relation]["is_swm"],
                        neighSearch=None, weightSchema=0,
                        msg=ARCPY.GetIDMessage(220870).format(candidates_processed, self.num_total_swm_candidates), isAutoSelection=True)
                    if not self.__check_eign_values(res["eig_vals"], add_msg=f"({config_name})"):
                        continue
                    self.__update_auto_selection(res, config_name, SupportedWeightSchema.UNWEIGHTED,
                                                 ARCPY.GetIDMessage(220871).format(candidates_processed, self.num_total_swm_candidates))
                else:
                    ARCPY.AddError(f"Unsupported spatial relation type.{spatial_relation}")
                    raise SystemExit()

            #### Report SWM searching statistic ####
            if self.num_total_swm_candidates > 1:
                if self.auto_select_method in [SupportedEVSelectMethods.GLOBAL, SupportedEVSelectMethods.FORWARD_SELECTION]:
                    global_adj_p = self.result_auto_select_collection["elements"][self.result_auto_select_collection["optimal_ind"]]["global_adj_p"]
                    if global_adj_p < self.auto_select_p_val_threshold:
                        valid_opt_ind = self.result_auto_select_collection["optimal_ind"]
                    else:
                        valid_opt_ind = -1
                else:
                    p_val_opt = self.result_auto_select_collection["elements"][self.result_auto_select_collection["optimal_ind"]]["p_values"][-1]
                    if p_val_opt is None:
                        valid_opt_ind = -1
                    else:
                        valid_opt_ind = self.result_auto_select_collection["optimal_ind"]

                if self.auto_select_method == SupportedEVSelectMethods.GLOBAL:
                    alias = [self.ssdo.fields[v].alias for v in self.auto_select_vars]
                    alias = ", ".join(alias)
                    rows = [
                        [ARCPY.GetIDMessage(220878),  # "Neighborhood",
                         ARCPY.GetIDMessage(84152) + f": {alias}",  # "p-value: Alias"
                         _build_adj_r2_cell()]  #  ["Adjusted R^2"]]
                    ]

                    for ind, ele in enumerate(self.result_auto_select_collection["elements"]):
                        if ind == valid_opt_ind:
                            conf_name = "*" + ele["config_name"]
                        else:
                            conf_name = ele["config_name"]
                        if ele['adjusted_r2'] is None:
                            adj_r2_v = "-"
                        else:
                            adj_r2_v = _ff(ele['adjusted_r2'])
                        rows.append([conf_name, _ff(ele['global_adj_p']), adj_r2_v])

                    header = ARCPY.GetIDMessage(220877)  # "Neighborhood Search History"
                    footnote = []
                    if distance_unit_used is not None:
                        footnote.append(ARCPY.GetIDMessage(220494).format(distance_unit_used))  # Distance unit: {0}
                    footnote.append(ARCPY.GetIDMessage(84821).format(self.randSeed))
                    if valid_opt_ind >= 0:
                        boldRows = [valid_opt_ind + 1]
                    else:
                        boldRows = []
                    outputTable = UTILS.outputTextTable(rows, header=header,
                                                        pad=1, footnote=footnote, colPad=4, emphasizeHeadRow=True,
                                                        boldRows=boldRows,
                                                        returnHTMLMsg=False, force2Txt=False)
                    ARCPY.AddMessage(outputTable)
                elif self.auto_select_method == SupportedEVSelectMethods.FORWARD_SELECTION:
                    alias = [self.ssdo.fields[v].alias for v in self.auto_select_vars]
                    alias = ", ".join(alias)
                    rows = [
                        [ARCPY.GetIDMessage(220878),  # Neighborhood,
                         ARCPY.GetIDMessage(84152) + f": {alias}",  # "p-value: Alias"
                         _build_adj_r2_cell() + [f" ({ARCPY.GetIDMessage(220889)})"],  #"Adj-R^2 (all components)",
                         _build_adj_r2_cell() + [f" ({ARCPY.GetIDMessage(220890)})"],  #"Adj-R^2 (selected components)",
                         ARCPY.GetIDMessage(220882) # "Number of Components"
                         ]
                    ]

                    for ind, ele in enumerate(self.result_auto_select_collection["elements"]):
                        if ind == valid_opt_ind:
                            head = "*" + ele["config_name"]
                        else:
                            head = ele["config_name"]
                        if ele['global_adj_p'] >= self.auto_select_p_val_threshold:
                            rows.append([head,
                                         _ff(ele['global_adj_p']),
                                         "-", "-", "-"])
                        else:
                            rows.append([head,
                                         _ff(ele['global_adj_p']),
                                         _ff(ele['r2_adj_thres']),
                                         _ff(ele['adj_r2_values'][-1]), len(ele["ev_inds"])])

                    header = ARCPY.GetIDMessage(220877)  # "Neighborhood Search History"
                    footnote = [ARCPY.GetIDMessage(220879)]  # "* repesents the selected neighborhood configuration"
                    if distance_unit_used is not None:
                        footnote.append(ARCPY.GetIDMessage(220494).format(distance_unit_used))  # Distance unit: {0}
                    if valid_opt_ind >= 0:
                        boldRows = [valid_opt_ind + 1]
                    else:
                        boldRows = []
                    outputTable = UTILS.outputTextTable(rows, header=header,
                                                        pad=1, footnote=footnote, colPad=4, emphasizeHeadRow=True,
                                                        boldRows=boldRows,
                                                        returnHTMLMsg=False, force2Txt=False)
                    ARCPY.AddMessage(outputTable)
                elif self.auto_select_method == SupportedEVSelectMethods.MIN_SPATIAL_AUTOCORRELATION:
                    alias = self.ssdo.fields[self.auto_select_vars[0]].alias
                    rows = [
                        [ARCPY.GetIDMessage(220878),  # Neighborhood,
                         ARCPY.GetIDMessage(84152) + f": {alias}",   # "p-value: Alias"
                         ARCPY.GetIDMessage(220880).format(alias),  # Moran's I of Filtered {0}
                         ARCPY.GetIDMessage(220881).format(alias),  # P-value of Filtered {0}
                         ARCPY.GetIDMessage(220882)  # "Number of Components"
                         ]
                    ]

                    for ind, ele in enumerate(self.result_auto_select_collection["elements"]):
                        if ind == valid_opt_ind:
                            config_name = "*" + ele["config_name"]
                        else:
                            config_name = ele["config_name"]
                        if ele['p_values'][-1] is None:
                            p_val = "-"
                        else:
                            p_val = _ff(ele['p_values'][-1])

                        rows.append([config_name, _ff(ele['global_adj_p'], 4),
                                     _ff(ele['morans_i_values'][-1]),
                                     p_val, len(ele["ev_inds"]) - 1])

                    header = ARCPY.GetIDMessage(220877)  # "Neighborhood Search History"
                    footnote = [ARCPY.GetIDMessage(220879)]  # "* repesents the selected neighborhood configuration"
                    if distance_unit_used is not None:
                        footnote.append(ARCPY.GetIDMessage(220494).format(distance_unit_used))  # Distance unit: {0}

                    # mir_result = self.result_auto_select_collection["elements"][
                    #     self.result_auto_select_collection["optimal_ind"]]
                    # if mir_result["p_values"][-1] >= self.auto_select_p_val_threshold:
                    #     footnote = ["Specified p-value reached by multiple candidates. Selecting the one with the least number of spatial components and larger p-value."]
                    # else:
                    #     footnote = ["Specified p-value is not reached. Selecting the one with the lowest p-value."]

                    if valid_opt_ind >= 0:
                        boldRows = [valid_opt_ind + 1]
                    else:
                        boldRows = []
                    outputTable = UTILS.outputTextTable(rows, header=header,
                                                        pad=1, footnote=footnote, colPad=4, emphasizeHeadRow=True,
                                                        boldRows=boldRows,
                                                        returnHTMLMsg=False, force2Txt=False)
                    ARCPY.AddMessage(outputTable)


            if self.result_auto_select_collection["optimal_ind"] < 0:
                if self.auto_select_method in [SupportedEVSelectMethods.GLOBAL, SupportedEVSelectMethods.FORWARD_SELECTION]:
                    alias = [self.ssdo.fields[v].alias for v in self.auto_select_vars]
                    alias = ", ".join(alias)
                    ARCPY.AddIDMessage("ERROR", 110603, alias)
                    raise SystemExit()
                self.__check_eign_values(None, throw_error=True)
                raise SystemExit()

            #### Finalize the result, report in tables and charts ####
            self.result_eig_values = self.result_auto_select_collection["optimal_eigen_vals"]
            self.result_eig_vectors = self.result_auto_select_collection["optimal_eigen_vecs"]

            # update the eigen vectors, flip if needed
            if self.auto_select_method in [SupportedEVSelectMethods.MIN_SPATIAL_AUTOCORRELATION,
                                           SupportedEVSelectMethods.FORWARD_SELECTION] and len(
                    self.auto_select_vars) == 1:
                inds = self.result_auto_select_collection["elements"][
                    self.result_auto_select_collection["optimal_ind"]]["ev_inds"]
                if inds[0] < 0:
                    inds = inds[1:]
                if len(inds) > 0:
                    coefs = self.result_auto_select_collection["elements"][self.result_auto_select_collection["optimal_ind"]][
                        "coefficient_values"]
                    for coef_ind, coef in enumerate(coefs):
                        if coef < 0:
                            ind = inds[coef_ind]
                            self.result_eig_vectors[:, ind] = -1 * self.result_eig_vectors[:, ind]

            # self.__draw_eigen_vectors_chart(self.result_auto_select_collection["optimal_eig_vals_original"])

            #### Report MEM searching steps ####
            size = 0
            for values in self.auto_select_opt_swm["data"].values():
                size += len(values[0])
            opt_swm_i_j = NUM.zeros((size, 2), dtype=NUM.int64)
            opt_swm_w = NUM.zeros(size, dtype=NUM.float64)
            step = 0
            for orderID, (nhIDs, sWeights) in enumerate(self.auto_select_opt_swm["data"].values()):
                for i, nhID in enumerate(nhIDs):
                    opt_swm_i_j[step, 0] = orderID
                    opt_swm_i_j[step, 1] = nhID
                    opt_swm_w[step] = sWeights[i]
                    step += 1

            if self.auto_select_method == SupportedEVSelectMethods.GLOBAL:
                # ARCPY.AddMessage(f"Only 15 of total {self.result_eig_vectors.shape[1]} eigen vectors will be exported.")
                pass
            elif self.auto_select_method == SupportedEVSelectMethods.FORWARD_SELECTION:
                frd_result = self.result_auto_select_collection["elements"][self.result_auto_select_collection["optimal_ind"]]
                rows = [[
                    ARCPY.GetIDMessage(220752),  # "Iteration"
                    ARCPY.GetIDMessage(220888),  # "Original Component ID"
                    _build_adj_r2_cell(),  # "Adj-R^2"
                    ARCPY.GetIDMessage(220874),  # "Moran's I"
                    ARCPY.GetIDMessage(220542),  # "P-Value",
                    ]
                    # ["0", "-", "-", _ff(frd_result["r2_adj_thres"]), "-"]
                ]

                for ind, ev_ind in enumerate(frd_result["ev_inds"]):
                    # e_val = _ff(self.result_eig_values[ev_ind])
                    e_vec = self.result_eig_vectors[:, ev_ind].copy()
                    morans_i_res = ARC._ss.morans_i_exam(e_vec, opt_swm_i_j, opt_swm_w,
                                                         0, self.numThreads, self.randSeed)
                    if morans_i_res is None:
                        raise SystemExit()
                    rows.append([ind + 1, ev_ind + 1, _ff(frd_result["adj_r2_values"][ind]), _ff(morans_i_res["morans_i"]), _ff(frd_result["p_values"][ind], 3)])

                header = ARCPY.GetIDMessage(220887)  # "Spatial Component Search History"

                footnote = [
                    ARCPY.GetIDMessage(84821).format(self.randSeed),  # "Random Seed: {0}"
                ]
                # if self.result_auto_select_collection["optimal_ind"] != -1:
                #     footnote.append(
                #         f"Optimal Spatial Weight Matrix Configuration: [{self.result_auto_select_collection['elements'][self.result_auto_select_collection['optimal_ind']]['config_name']}]")
                #
                # footnote.append(
                #     f"Total number of candidate spatial components: {self.result_eig_vectors.shape[1]}, selected: {len(frd_result['ev_inds'])}")
                outputTable = UTILS.outputTextTable(rows, header=header,
                                                    pad=1, footnote=footnote, colPad=4, emphasizeHeadRow=True,
                                                    returnHTMLMsg=False, force2Txt=False)
                ARCPY.AddMessage(outputTable)
            elif self.auto_select_method == SupportedEVSelectMethods.MIN_SPATIAL_AUTOCORRELATION:
                alias = self.ssdo.fields[self.auto_select_vars[0]].alias
                rows = [[
                    # "Step", "Original Eigen Vector Id", "Eigen Value", "Moran's I", "P-Value"
                    ARCPY.GetIDMessage(220752),  # "Iteration"
                    ARCPY.GetIDMessage(220888),  # "Original Component ID"
                    ARCPY.GetIDMessage(220880).format(alias),  # Moran's I of Filtered {0}
                    ARCPY.GetIDMessage(220874),  # "Moran's I"
                    ARCPY.GetIDMessage(220542),  # "P-Value",
                ]]
                mir_result = self.result_auto_select_collection["elements"][self.result_auto_select_collection["optimal_ind"]]
                if len(mir_result["ev_inds"]) <= 1:
                    alias = self.ssdo.fields[self.auto_select_vars[0].upper()].alias
                    ARCPY.AddIDMessage("ERROR", 110562, alias)
                    raise SystemExit()

                for i in range(len(mir_result["ev_inds"])):
                    if i == 0:
                        oid = "-"
                        morans_i_val = "-"
                    else:
                        oid = mir_result["ev_inds"][i] + 1
                        # e_val = _ff(self.result_eig_values[mir_result["ev_inds"][i]])
                        e_vec = self.result_eig_vectors[:, mir_result["ev_inds"][i]].copy()
                        morans_i_res = ARC._ss.morans_i_exam(e_vec, opt_swm_i_j, opt_swm_w,
                                                             0, self.numThreads, self.randSeed)
                        if morans_i_res is None:
                            raise SystemExit()
                        morans_i_val = _ff(morans_i_res["morans_i"])
                    rows.append([i, oid, _ff(mir_result["morans_i_values"][i]), morans_i_val, _ff(mir_result["p_values"][i], 3)])

                header = ARCPY.GetIDMessage(220887)  # "Spatial Component Search History"
                footnote = [
                    ARCPY.GetIDMessage(84821).format(self.randSeed),  # "Random Seed: {0}"
                ]
                # if self.result_auto_select_collection["optimal_ind"] != -1:
                #     footnote.append(
                #         f"Optimal Spatial Weight Matrix Configuration: [{self.result_auto_select_collection['elements'][self.result_auto_select_collection['optimal_ind']]['config_name']}]")

                # if len(mir_result["ev_inds"]) <= 1:
                #     footnote.append(
                #         "The Moran's I of target variable is not significant according to the provided p-value. No spatial components selected.")
                # else:
                #     footnote.append(
                #         f"Total number of candidate spatial components: {self.result_eig_vectors.shape[1]}, selected: {len(mir_result['ev_inds']) - 1}")
                outputTable = UTILS.outputTextTable(rows, header=header,
                                                    pad=1, footnote=footnote, colPad=4, emphasizeHeadRow=True,
                                                    returnHTMLMsg=False, force2Txt=False)
                ARCPY.AddMessage(outputTable)

        else:  # not auto selection
            #### Set Neighborhood Type Int ####
            self.wType = wType
            if self.wType not in SupportedSpatialRelation.__iter__():
                ARCPY.AddIDMessage("ERROR", 723)
                raise SystemExit()
            self.auto_select_method = None
            self.auto_select_vars = []
            self.auto_select_p_val_threshold = autoSelectPThreshold

            #### Warning About Distanc Stats not being Weighted ####
            if weightSchema not in ['UNWEIGHTED', None] and wType == 8:
                ARCPY.AddIDMessage('WARNING', 110341)

            self.maxSpatialComponentsNum = maxSpatialComponentsNum
            if morans_threshold < 0 or morans_threshold > 1:
                ARCPY.AddError("The Moran's I threshold should be between 0 and 1.")
                raise SystemExit()

            self.morans_threshold = morans_threshold

            #### Set Include Self to False if SWM ####
            if wType == SupportedSpatialRelation.GET_SPATIAL_WEIGHTS_FROM_FILE:
                includeSelf = False
            self.calGeoWeight = calGeoWeight

            self.distVarName = 'DIST_SUMSTATS_SS'

            self.concept = concept.upper()

            #### Set Weighting Schema ####
            if self.wType not in [SupportedSpatialRelation.FIXED_DISTANCE, SupportedSpatialRelation.K_NEAREST_NEIGHBORS, SupportedSpatialRelation.DELAUNAY_TRIANGULATION]:
                self.weightSchema = 0
            else:
                if weightSchema.upper() not in SupportedWeightSchema.__members__:
                    ARCPY.AddMessage("The Local Weight Schema {} is not supported.".format(weightSchema.upper()))
                    raise SystemExit()
                self.weightSchema = SupportedWeightSchema[weightSchema.upper()]
            self.isUnweighted = self.weightSchema == 0

            #### Create KDTree Neighbor Search Class for KNN or Fixed Distance ####
            self.neighSearch = None
            if self.wType in [SupportedSpatialRelation.K_NEAREST_NEIGHBORS, SupportedSpatialRelation.FIXED_DISTANCE]:
                self.neighSearch = KDNeighborSearch(self.ssdo)

            #### Set Linear Unit Info ####
            self.distanceBand = None
            self.bandwidth = None
            self.__setLinearUnitInfo(threshold, kernelBand)

            #### Finalize KDTree Search Info/Method ####
            if self.wType == SupportedSpatialRelation.FIXED_DISTANCE:
                self.neighSearch.setDistance(self.distanceBand)
            if self.wType == SupportedSpatialRelation.K_NEAREST_NEIGHBORS:
                if self.do_adaptive_kernel_bandwidth:
                    self.neighSearch.setKNN(self.numNeighs + 1)
                else:
                    self.neighSearch.setKNN(self.numNeighs)

            #### Keep Track of Bad Records ####
            self.badRecords = set([])
            self.beyondBandRecords = set([])

            ssdo_param = self.ssdo
            res = self.__calculate_mem(
                self.wType, ssdo_param, weightsFile=weightsFile, swmFileBool=self.swmFileBool,
                neighSearch=self.neighSearch, weightSchema=self.weightSchema, kernelBand=self.bandwidth,
                msg=None, isAutoSelection=False, do_adaptive_kernel_bandwidth=self.do_adaptive_kernel_bandwidth)
            self.auto_select_opt_swm = self.current_swm_cache.copy()
            eig_vals, eig_vecs, eig_vals_original = res["eig_vals"], res["eig_vecs"], res["eig_vals_original"]
            if not self.__check_eign_values(eig_vals, throw_error=True):
                raise SystemExit()
            self.result_eig_values = eig_vals
            self.result_eig_vectors = eig_vecs
            # self.__draw_eigen_vectors_chart(eig_vals_original)
            # Filter for positive spatial autocorrelation with 0.25 threshold
            positive_indices = NUM.where(self.result_eig_values / self.result_eig_values[0] >= self.morans_threshold)[0]
            if len(positive_indices)== 0:
                positive_indices = [0]

            self.result_eig_values = self.result_eig_values[positive_indices]
            self.result_eig_vectors = self.result_eig_vectors[:, positive_indices]
            self.__cal_Moran_I()

        return

    def __check_eign_values(self, eig_vals, throw_error=False, add_msg=""):
        """Make sure the eigen values are not empty"""
        if eig_vals is not None and len(eig_vals) == 0:
            if throw_error:
                ARCPY.AddIDMessage("ERROR", 110599, add_msg)
            else:
                ARCPY.AddIDMessage("WARNING", 110599, add_msg)
            return False
        else:
            return True


    def __update_auto_selection(self, mem_decom_result, config_name, weight_schema, msg):
        eig_vals, eig_vecs, eig_vals_original = mem_decom_result["eig_vals"], mem_decom_result["eig_vecs"], mem_decom_result["eig_vals_original"]

        #### calculate the global RDA p-value for GLOBAL and FORWARD methods ####
        p_vals = {}
        if self.auto_select_method in [SupportedEVSelectMethods.FORWARD_SELECTION, SupportedEVSelectMethods.GLOBAL]:
            Ys = NUM.zeros((self.numObs, len(self.auto_select_vars)), dtype=float)
            for i, var in enumerate(self.auto_select_vars):
                Ys[:, i] = self.ssdo.fields[var].returnDouble()
            p_val = self.__cal_rda_p_value(MEM=eig_vecs, Y=Ys, num_perm=9999)
            p_val_adj = self.__adjust_multi_test_p_value(p_value=p_val, adj_p_val=True)
            p_vals["global_adj_p"] = p_val_adj
            p_vals["global_p"] = p_val
            # if p_val_adj >= self.auto_select_p_val_threshold:
            #     return result

        if self.auto_select_method == SupportedEVSelectMethods.GLOBAL:
            if p_vals["global_adj_p"] >= self.auto_select_p_val_threshold:
                adjusted_r2 = None
            else:
                adjusted_r2 = self.__auto_select_global(eig_vecs)
                if self.result_auto_select_collection["optimal_ind"] == -1 or adjusted_r2 > self.result_auto_select_collection["elements"][self.result_auto_select_collection["optimal_ind"]]["adjusted_r2"]:
                    self.result_auto_select_collection["optimal_ind"] = len(self.result_auto_select_collection["elements"])
                    self.result_auto_select_collection["optimal_eigen_vals"] = eig_vals
                    self.result_auto_select_collection["optimal_eigen_vecs"] = eig_vecs
                    self.result_auto_select_collection["optimal_eig_vals_original"] = eig_vals_original
                    self.auto_select_opt_swm = self.current_swm_cache.copy()

            self.result_auto_select_collection["elements"].append({
                "config_name": config_name,
                "adjusted_r2": adjusted_r2,
                "global_adj_p": p_vals["global_adj_p"],
                "global_p": p_vals["global_p"]
            })

        elif self.auto_select_method == SupportedEVSelectMethods.FORWARD_SELECTION:
            if p_vals["global_adj_p"] >= self.auto_select_p_val_threshold:
                adjusted_r2 = None
                fdr_result = {}
            else:
                if RUN_CPP_CODE:
                    fdr_result = self.__auto_select_forward_c(eig_vecs, msg=msg)
                else:
                    fdr_result = self.__auto_select_forward(eig_vecs, msg=msg)
                adjusted_r2 = fdr_result["adj_r2_values"][-1]
                if self.result_auto_select_collection["optimal_ind"] == -1 or adjusted_r2 > self.result_auto_select_collection["elements"][self.result_auto_select_collection["optimal_ind"]]["adj_r2_values"][-1]:
                    self.result_auto_select_collection["optimal_ind"] = len(self.result_auto_select_collection["elements"])
                    self.result_auto_select_collection["optimal_eigen_vals"] = eig_vals
                    self.result_auto_select_collection["optimal_eigen_vecs"] = eig_vecs
                    self.result_auto_select_collection["optimal_eig_vals_original"] = eig_vals_original
                    self.auto_select_opt_swm = self.current_swm_cache.copy()
            fdr_result["config_name"] = config_name
            fdr_result["global_adj_p"] = p_vals["global_adj_p"]
            fdr_result["global_p"] = p_vals["global_p"]

            self.result_auto_select_collection["elements"].append(fdr_result)

        elif self.auto_select_method == SupportedEVSelectMethods.MIN_SPATIAL_AUTOCORRELATION:
            if eig_vecs is None:
                mir_result = {
                    'ev_inds': [-1],
                    'morans_i_values': [self.res_morans_i['morans_i']],
                    'p_values': [None],
                    'final_residuals': [],
                    'residual_sums': []
                }
            else:
                mir_result = self.__auto_select_MIR(eig_vecs, weight_schema==SupportedWeightSchema.UNWEIGHTED, msg=msg)
                # result = {
                #     'ev_inds': [],
                #     'morans_i_values': [],
                #     'p_values': [],
                #     'final_residuals': [],
                #     'residual_sums': []
                # }
            p_val = mir_result["p_values"][-1]
            replace_opt = False
            if self.result_auto_select_collection["optimal_ind"] == -1:
                replace_opt = True
            elif p_val is not None:
                p_val_opt = self.result_auto_select_collection["elements"][self.result_auto_select_collection["optimal_ind"]]["p_values"][-1]
                if p_val_opt is None:
                    replace_opt = True
                elif p_val_opt < self.auto_select_p_val_threshold:
                    if p_val > p_val_opt:
                        replace_opt = True
                else:
                    if p_val >= self.auto_select_p_val_threshold:
                        if len(mir_result["ev_inds"]) < len(self.result_auto_select_collection["elements"][self.result_auto_select_collection["optimal_ind"]]["ev_inds"]):
                            replace_opt = True
                        elif len(mir_result["ev_inds"]) == len(self.result_auto_select_collection["elements"][self.result_auto_select_collection["optimal_ind"]]["ev_inds"]) and p_val > p_val_opt:
                            replace_opt = True
            if replace_opt:
                self.result_auto_select_collection["optimal_ind"] = len(self.result_auto_select_collection["elements"])
                self.result_auto_select_collection["optimal_eigen_vals"] = eig_vals
                self.result_auto_select_collection["optimal_eigen_vecs"] = eig_vecs
                self.result_auto_select_collection["optimal_eig_vals_original"] = eig_vals_original
                self.auto_select_opt_swm = self.current_swm_cache.copy()
            mir_result["config_name"] = config_name
            if "global_adj_p" in mem_decom_result:
                mir_result["global_adj_p"] = mem_decom_result["global_adj_p"]
            self.result_auto_select_collection["elements"].append(mir_result)

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

    def __setLinearUnitInfo(self, threshold, kernelBand):
        """Assigns Linear Unit Information."""

        ssdo = self.ssdo
        bothDefault = threshold is None and kernelBand is None
        threshDefault = threshold is None
        bandwidthDefault = kernelBand is None
        self.distanceBand = None
        self.bandwidth = None
        if self.wType == SupportedSpatialRelation.FIXED_DISTANCE:
            if self.isUnweighted:
                #### Fixed Distance - No Bandwidth ####
                if threshDefault:
                    threshold, avgDist = self.neighSearch.createThresholdDist()
                info = self.__assignLinearUnitInfo(threshold)
                self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info
                dist_thres = self.neighSearch.buildIncremantalDist(1, 0.8, 2)
                if self.distanceBand < dist_thres[0] or self.distanceBand > dist_thres[1]:
                    unit = self.distanceBandUnit
                    if unit is not None and unit.lower() in UTILS.localizableUnit:
                        unit = UTILS.localizableUnit[unit.lower()]
                    ARCPY.AddIDMessage("ERROR", 110469, unit.format(f"{dist_thres[0]:.4f}"), unit.format(f"{dist_thres[1]:.4f}"))
                    raise SystemExit()
            else:
                #### Fixed Distance - Using Bandwidth ####

                if bothDefault:
                    #### Both Defaults - Data Generated Floats in Output Coord Linear Units (Report Both) ####
                    threshold, avgDist = self.neighSearch.createThresholdDist()
                    info = self.__assignLinearUnitInfo(threshold)
                    self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info
                    self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

                if threshDefault and not bandwidthDefault:
                    #### Bandwidth Given - Distance Band Default (Report Distance Band in Bandwidth Units) ####
                    info = self.__assignLinearUnitInfo(kernelBand)
                    self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

                    threshold, avgDist = self.neighSearch.createThresholdDist()
                    info = self.__assignLinearUnitInfo(threshold, overwriteLinearUnit=kernelBand)
                    self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info

                if bandwidthDefault and not threshDefault:
                    #### Distance Band Given - Bandwidth Default (Report Bandwidth in Distance Band Units) ####
                    # self.threshold, avgDist = self.neighSearch.createThresholdDist()
                    info = self.__assignLinearUnitInfo(threshold)
                    self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info
                    # kernelBand = STATS.spatialBandwidth(self.coordinates)
                    # info = self.__assignLinearUnitInfo(kernelBand, threshold)
                    self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

                if not threshDefault and not bandwidthDefault:
                    #### Distance Band and Kerenl Bandwidth Given by User (Don't Report) ####
                    info = self.__assignLinearUnitInfo(threshold)
                    self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info

                    info = self.__assignLinearUnitInfo(kernelBand)
                    self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

        if self.wType in [SupportedSpatialRelation.K_NEAREST_NEIGHBORS, SupportedSpatialRelation.DELAUNAY_TRIANGULATION] and not self.isUnweighted:
            if bandwidthDefault:
                kernelBand = STATS.spatialBandwidth(self.coordinates)
                self.do_adaptive_kernel_bandwidth = True
            else:
                info = self.__assignLinearUnitInfo(kernelBand)
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
        self.y = NUM.ones(self.numObs, dtype=float)
        self.doLocalStats = False

        #### Double check the outSWMFileUniqueIdField to be unique ####
        self.outSWM_Order2Master = {}
        if self.outSWMFileUniqueIdField is not None:
            values = self.ssdo.fields[self.outSWMFileUniqueIdField.upper()].data
            if len(values) != len(set(values)):
                # ARCPY.AddError("Duplicate values found in the field '{}' for output spatial weight matrix file.".format(self.ssdo.fields[self.outSWMFileUniqueIdField].alias))
                ARCPY.AddIDMessage("ERROR", 644, self.ssdo.fields[self.outSWMFileUniqueIdField].alias)
                raise SystemExit()
            self.outSWM_Order2Master = dict(zip(range(self.numObs), values))

        #### Check Number of Neighbors Parameter ####
        if self.auto_select_method is None:
            self.numNeighs = WU.getValidNumNeighs(self.numNeighs, self.ssdo.numObs, self.wType)

        #### Set Attributes ####
        self.master2Order = self.ssdo.master2Order

    def __dist(self, id1, id2):
        return ((self.coordinates[id1] - self.coordinates[id2]) ** 2).sum() ** 0.5

    def __genLocalWeights(self, targetID, nhIDs, weightSchema, bandwidth):
        weights = NUM.full(len(nhIDs), 1.0, dtype=float)

        if weightSchema == 0:
            return weights
        elif weightSchema == 1:
            #### BISQUARE ####
            for ind, nhId in enumerate(nhIDs):
                dist = self.__dist(targetID, nhId)
                if dist < bandwidth:
                    weights[ind] = (1 - (dist / bandwidth) ** 2) ** 2
                # else:
                #     self.beyondBandRecords.add(targetID)

        elif weightSchema == 2:
            #### GAUSSIAN ####
            for ind, nhId in enumerate(nhIDs):
                dist = self.__dist(targetID, nhId)
                weights[ind] = NUM.exp(-0.5 * ((dist / bandwidth) ** 2.0))

        return weights


    def __extract_weight_matrix(self, swm):
        # convert weight matrix to i, j, value format
        if SOLVE_WITH_SPARSE_MATRIX:
            inds = swm.nonzero()
        else:
            inds = NUM.where(~NUM.isclose(swm, 0, atol=1e-8, rtol=1e-8))
        self.swm_i_j = NUM.zeros((len(inds[0]), 2), dtype=NUM.int64)
        self.swm_i_j[:, 0] = inds[0]
        self.swm_i_j[:, 1] = inds[1]
        self.swm_w = swm[inds]

    def __exam_morans_i(self, num_perm=999):
        #### For MIR, also pre-check the moran's I value ####
        y = self.ssdo.fields[self.auto_select_vars[0]].returnDouble()
        y -= y.mean()
        morans_i_res = ARC._ss.morans_i_exam(y, self.swm_i_j, self.swm_w,
                                             num_perm, self.numThreads, self.randSeed)
        if morans_i_res in [None, {}]:
            raise SystemExit()
        return morans_i_res

    def __adjust_multi_test_p_value(self, p_value=0.05, alpha=0.05, adj_p_val=True):
        if adj_p_val:
            return 1.0 - (1.0 - p_value) ** self.num_total_swm_candidates
        else:
            return 1.0 - (1.0 - alpha) ** (1.0 / self.num_total_swm_candidates)

    def __cal_rda_p_value(self, MEM, Y, num_perm=9999):
        X = MEM.copy()
        N = X.shape[0]
        m_x = NUM.mean(X, axis=0)
        X -= m_x
        D = X.shape[1]

        ms = ARC._ss.PyMEMSelection(
            eign_vectors=X.T.copy(),
            swm_inds=None, swm_weights=None,
            coords=None,
            num_threads=4,
            is_swm_unweighted=True,
            random_seed=5
        )
        res_qr = ms.qr_decomp(X.copy())
        if res_qr is None:
            raise SystemExit()
        QR = res_qr["QR"]
        QR = QR.reshape(X.shape)
        QR_aux = res_qr["QR_aux"]

        Y_centered = Y - NUM.mean(Y, axis=0)
        Y_centered /= NUM.sqrt(Y.shape[0] - 1)
        # print(Y_centered)
        #### Get stats info of Y_centered ####
        Y_centered_var = NUM.sum(Y_centered ** 2)
        Y_stats = {
            "total_var": Y_centered_var,
            "Y_centered": Y_centered,
            "tot.chi": Y_centered_var,
            "colsum": NUM.sqrt(NUM.sum(Y_centered ** 2, axis=0))
        }

        res_fit = ms.qr_fit(QR=QR.copy(), QR_aux=QR_aux.copy(), Ys=Y_centered.copy(), cal_fit=True, cal_residual=True,
                            num_perm=0)
        if res_fit is None:
            raise SystemExit()
        if "fits" in res_fit:
            res_fit["fits"] = res_fit["fits"].reshape(Y_centered.shape)
        if "residuals" in res_fit:
            res_fit["residuals"] = res_fit["residuals"].reshape(Y_centered.shape)
        Y_fitted = res_fit["fits"]
        Y_resid = res_fit["residuals"]

        svd_res_f_fitted = _svd_decomp(Y_fitted)
        wa = Y_centered @ svd_res_f_fitted["v"] / NUM.sqrt(svd_res_f_fitted["eig"])

        biplot = (X.T @ svd_res_f_fitted["u"]) / ((NUM.sum(X ** 2, axis=0)) ** 0.5).reshape(-1, 1)
        constraint = {
            "eig": svd_res_f_fitted["eig"],
            "poseig": None,
            "u": svd_res_f_fitted["u"],
            "v": svd_res_f_fitted["v"],
            "wa": wa,
            # alias = alias,
            "biplot": biplot,
            "rank": svd_res_f_fitted["rank"],
            "qrank": D,
            "tot.chi": svd_res_f_fitted["tot.chi"],
            "QR": QR,
            "QR_aux": QR_aux,
            "envcentre": m_x,
            "Y_fitted": Y_fitted,
            "Y_resid": Y_resid,
            "Y": Y_centered,

        }
        resid = _svd_decomp(Y_resid)

        #### compute the R2 and adj-R2 ####
        r2 = constraint["tot.chi"] / Y_stats["tot.chi"]
        m = constraint["qrank"]
        n = constraint["u"].shape[0]
        adj_r2 = 1 - (1 - r2) * (n - 1) / (n - m - 1)

        #### Calculate the p-value by permutation here ####
        w = None  # todo: remove later
        first = False  # todo: remove later
        isCCA = False  # todo: remove later
        isPartial = False  # todo: remove later
        isDB = False  # todo: remove later
        QZ = None  # todo: remove later
        # QR = [res_QR, D, res_QRaux]  # qr matrix, rank, and qr_aux
        chi_z = svd_res_f_fitted["tot.chi"]
        q = D
        effects = 0
        chi_xz = resid["tot.chi"]
        r = Y_centered.shape[0] - D - 1
        chi_total = chi_z + chi_xz
        F0 = (chi_z / q) / (chi_xz / r)
        E = Y_centered

        #### Fit y on QR and get the result ####
        nterm = 1
        ans = NUM.zeros((num_perm, nterm + 1), dtype=float)

        res_perm = ms.qr_fit(QR=QR.copy(), QR_aux=QR_aux.copy(), Ys=Y_centered.copy(), num_perm=num_perm)
        if res_perm is None:
            raise SystemExit()
        ans[:, 0] = res_perm["sum_fit_2"]
        ans[:, 1] = chi_total - ans[:, 0]
        F_perm = ans[:, 0] / ans[:, 1] / q * r
        num_greater = len(NUM.where(F_perm > F0)[0])
        p = (num_greater + 1.0) / (num_perm + 1.0)

        res = {
            "pCCA": None,
            "CCA": constraint,
            "CA": resid,
            "Y_stats": Y_stats,  # also the root attributes of the res obj in R
            "adj_r2": adj_r2,
            "ans": ans,
            "ans_r": ans[:, 0] / ans[:, 1] / q * r,
            "p_value": p,
        }

        return p

    def __calculate_mem(self, wType, ssdo, weightsFile=None, swmFileBool=True, neighSearch=None, weightSchema=0,
                        kernelBand=0, msg=None,
                        isAutoSelection=True, do_adaptive_kernel_bandwidth=False):
        """
        Constructs the neighborhood structure for each feature and
        dispatches the appropriate values for the calculation of the
        statistic.
        Returns
        -------

        """
        if SOLVE_WITH_SPARSE_MATRIX:
            weightMtx = SparseMtx((self.numObs, self.numObs), dtype=float)
        else:
            weightMtx = NUM.zeros((self.numObs, self.numObs), dtype=float)

        self.current_swm_cache = {
            "wType": wType,
            "weightSchema": weightSchema,
            "data": {}
        }

        result = {
            "eig_vals": None,
            "eig_vecs": None,
            "eig_vals_original": None,
            "global_p_adj": None,
            "global_p": None,
        }

        if wType == SupportedSpatialRelation.GET_SPATIAL_WEIGHTS_FROM_FILE and weightsFile is not None:
            if msg is None:
                ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84129))
            else:
                ARCPY.SetProgressor("default", msg)
            #### Using Weights File ####
            if swmFileBool:
                #### Open Spatial Weights and Obtain Chars ####
                swm = WU.SWMReader(weightsFile)
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
                weightDict = WU.buildTextWeightDict(weightsFile, ssdo.master2Order)
                iterVals = UTILS.iterkeys(ssdo.master2Order)
                N = ssdo.numObs

            for i in iterVals:
                if swmFileBool:
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
                    self.current_swm_cache["data"][orderID] = [nhIDs, sWeights]

                    ARCPY.SetProgressorPosition()

            if swmFileBool:
                swm.close()
            ARCPY.ResetProgressor()

        elif wType in [SupportedSpatialRelation.CONTIGUITY_EDGES_ONLY, SupportedSpatialRelation.CONTIGUITY_EDGES_CORNERS]:
            if msg is None:
                ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84129))
            else:
                ARCPY.SetProgressor("default", msg)
            #### Polygon Contiguity ####
            if wType == SupportedSpatialRelation.CONTIGUITY_EDGES_ONLY:
                contiguityType = "ROOK"
            else:
                contiguityType = "QUEEN"
            clearExtentPolyNeighs = UTILS.clearExtent(WU.polygonNeighborDict)
            contDict = clearExtentPolyNeighs(ssdo.inputFC, ssdo.masterField,
                                             contiguityType=contiguityType)

            ARCPY.ResetProgressor()
            if msg is None:
                ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84129), 0, len(self.master2Order), 1)
            else:
                ARCPY.SetProgressor("step", msg, 0, len(self.master2Order), 1)
            for masterID in self.master2Order.keys():
                orderID, yiVal, nhIDs, nhVals, weights = WU.getWeightsValuesCont(masterID, self.master2Order,
                                                                                 contDict, self.y,
                                                                                 rowStandard=False)
                weightMtx[orderID, nhIDs] = weights
                self.current_swm_cache["data"][orderID] = [nhIDs, weights]

                ARCPY.SetProgressorPosition()
            ARCPY.ResetProgressor()

        elif wType == SupportedSpatialRelation.DELAUNAY_TRIANGULATION:
            numCoincident = self.ssdo.numObs - self.ssdo.numUnique

            if numCoincident > 0:
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

            if msg is None:
                ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84129))
            else:
                ARCPY.SetProgressor("default", msg)

            #### Get Neighborhood ####
            weightDict = ARC._ss.delaunay_point_neighbors(self.ssdo.xyCoords,
                                                               self.ssdo.spatialRef,
                                                               coinKeys, coinMap)
            if weightDict is None:
                raise SystemExit()

            #### Check/Add for No Neighs ####
            weightDict = WU.addNoNeighs2Delaunay(self.ssdo.xyCoords, self.ssdo.uniqueXY, weightDict)

            ARCPY.ResetProgressor()
            if msg is None:
                ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84129), 0, len(self.master2Order), 1)
            else:
                ARCPY.SetProgressor("step", msg, 0, len(self.master2Order), 1)

            for orderId, nhIds in weightDict.items():
                nei_ids = list(nhIds)
                weights = NUM.ones(len(nei_ids), dtype=float)
                weightMtx[orderId, nei_ids] = weights
                self.current_swm_cache["data"][orderId] = [nei_ids, weights]

                ARCPY.SetProgressorPosition()
            ARCPY.ResetProgressor()

        else:
            #### Fixed Distance or KNN Using KD Tree ####
            if msg is None:
                ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84129), 0, self.numObs, 1)
            else:
                ARCPY.SetProgressor("step", msg, 0, self.numObs, 1)

            for orderID in range(self.numObs):
                #### Neighbor Info ####
                nhIDs = neighSearch.getNeighbors(orderID)

                #### Limit Number of Neighbors ####
                if len(nhIDs) > MAX_NUM_NEIGHS:
                    nhIDs = nhIDs[0:MAX_NUM_NEIGHS]

                if self.includeSelf:
                    nhs = NUM.array([orderID] + list(nhIDs))
                else:
                    nhs = nhIDs

                if do_adaptive_kernel_bandwidth:
                    nhs = nhs[:-1]

                if weightSchema != 0:
                    if do_adaptive_kernel_bandwidth:
                        _kernel_band = self.__dist(orderID, nhIDs[-1])
                        weights = self.__genLocalWeights(orderID, nhIDs=nhs, weightSchema=weightSchema,
                                                         bandwidth=_kernel_band)
                    else:
                        weights = self.__genLocalWeights(orderID, nhIDs=nhs, weightSchema=weightSchema, bandwidth=kernelBand)
                else:
                    weights = NUM.ones(len(nhs), dtype=float)
                weightMtx[orderID, nhs] = weights
                self.current_swm_cache["data"][orderID] = [nhs, weights]
                ARCPY.SetProgressorPosition()

        ARCPY.ResetProgressor()
        if not isAutoSelection:
            self.result_global_weight_matrix = weightMtx.copy()

        if msg is None:
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220872))
        else:
            ARCPY.SetProgressor("default", msg)

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

        # print diagonal elements of weightMtx
        # ARCPY.AddMessage(weightMtx.diagonal())
        # for row in range(self.numObs):
        #     ddds = NUM.where(weightMtx[row, :] != 0)[0] + 1
        #     print(f"----> {row + 1}")
        #     print(ddds)
        t0 = time.time()
        if SOLVE_WITH_SPARSE_MATRIX:
            weightMtx = (weightMtx + weightMtx.T) / 2
            if self.auto_select_method == SupportedEVSelectMethods.MIN_SPATIAL_AUTOCORRELATION:
                self.__extract_weight_matrix(weightMtx)
                if self.swm_i_j is not None and len(self.swm_i_j) > 0:
                    self.res_morans_i = self.__exam_morans_i(num_perm=9999)
                    p_val = self.res_morans_i["p_value"]
                    #### do the multi-test Sidak correction for p-value ####
                    p_val_adj = self.__adjust_multi_test_p_value(p_value=p_val, adj_p_val=True)
                    result["global_adj_p"] = p_val_adj
                    result["global_p"] = p_val
                    if p_val_adj >= self.auto_select_p_val_threshold:
                        return result

            row_mean = NUM.mean(weightMtx, axis=1)
            col_mean = NUM.mean(weightMtx, axis=0)
            tot_mean = NUM.mean(weightMtx)
            weightMtx = weightMtx - row_mean[:, NUM.newaxis] - col_mean + tot_mean
            if self.auto_select_method is None:
                k = min(self.maxSpatialComponentsNum, self.numObs - 1)
            else:
                k = min(MAX_NUM_EIGEN_VECTORS_TO_KEEP, int(self.numObs * 0.25))

            eig_vals, eig_vecs = SCI.sparse.linalg.eigsh(weightMtx, k=k, which="LA")
        else:
            if not SCI.linalg.issymmetric(weightMtx):
                weightMtx += weightMtx.T
                weightMtx /= 2
            if self.auto_select_method == SupportedEVSelectMethods.MIN_SPATIAL_AUTOCORRELATION:
                self.__extract_weight_matrix(weightMtx)
                self.res_morans_i = self.__exam_morans_i(num_perm=9999)
                p_val = self.res_morans_i["p_value"]
                #### do the multi-test Sidak correction for p-value ####
                p_val_adj = self.__adjust_multi_test_p_value(p_value=p_val, adj_p_val=True)
                result["global_adj_p"] = p_val_adj
                result["global_p"] = p_val
                if p_val_adj >= self.auto_select_p_val_threshold:
                    return result

            row_mean = NUM.mean(weightMtx, axis=1)
            col_mean = NUM.mean(weightMtx, axis=0)
            tot_mean = NUM.mean(weightMtx)
            weightMtx = weightMtx - row_mean[:, NUM.newaxis] - col_mean + tot_mean
            # w_centered /= weightMtx.shape[0]
            eig_vals, eig_vecs = SCI.linalg.eigh(weightMtx)

        t1 = time.time()
        # ARCPY.AddMessage(f"Time used for decomposing: {(t1 - t0):.3f}s.")

        sorted_ind = NUM.argsort(eig_vals)[::-1]
        eig_vals = eig_vals[sorted_ind]
        eig_vecs = eig_vecs[:, sorted_ind]

        eig_vals_original = eig_vals.copy()

        # Remove near-zero eigenvalues
        nonzero_indices = NUM.where(~NUM.isclose(eig_vals, 0, atol=1e-10))[0]

        eig_vals = eig_vals[nonzero_indices]
        eig_vecs = eig_vecs[:, nonzero_indices]

        positive_indices = NUM.where(eig_vals > 0)[0]
        eig_vals = eig_vals[positive_indices]
        eig_vecs = eig_vecs[:, positive_indices]

        if len(eig_vals) > 0:
            if eig_vecs[0][0] < 0:
                eig_vecs = -eig_vecs
        ARCPY.ResetProgressor()
        result["eig_vals"] = eig_vals
        result["eig_vecs"] = eig_vecs
        result["eig_vals_original"] = eig_vals_original
        return result

    def __draw_eigen_vectors_chart(self, eig_vals_original):
        if eig_vals_original is None:
            return
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
            xs = NUM.arange(len(eig_vals_original)) + 1
            ys = eig_vals_original
            text_length_limit = 15
            plt.plot(xs, ys,
                     c="#1976d2", alpha=0.9, marker='o', markersize=6,
                     label=f"Eigen Value", linewidth=1,
                     zorder=9)  # "Original"
            if self.morans_threshold is not None:
                positive_indices = NUM.where(self.result_eig_values / self.result_eig_values[0] > self.morans_threshold)[0]
                plt.axvline(x=len(positive_indices), linewidth=1.5, linestyle='--', color="#f57c00",
                            label=f"{self.morans_threshold} Threshold({len(positive_indices)})")  # "Balance Threshold"
            if self.auto_select_method in [SupportedEVSelectMethods.MIN_SPATIAL_AUTOCORRELATION, SupportedEVSelectMethods.FORWARD_SELECTION]:
                inds = self.result_auto_select_collection["elements"][self.result_auto_select_collection["optimal_ind"]]["ev_inds"]
                inds = [i for i in inds if 0 <= i < len(xs)]
                xs_selected = xs[inds]
                ys_selected = ys[inds]
                plt.scatter(xs_selected, ys_selected, c="#d32f2f", marker='o', s=40, label="Selected Spatial Components", zorder=10)

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

    def __cal_Moran_I(self):
        if self.result_global_weight_matrix is None or self.result_eig_vectors is None:
            return

        #### Calculate some global values first ####
        row_sum = NUM.sum(self.result_global_weight_matrix, axis=1)
        col_sum = NUM.sum(self.result_global_weight_matrix, axis=0)
        s0 = NUM.sum(row_sum)
        s1 = NUM.sum(self.result_global_weight_matrix * self.result_global_weight_matrix)

        if SOLVE_WITH_SPARSE_MATRIX:
            s1 += SCI.sparse.tril(self.result_global_weight_matrix * self.result_global_weight_matrix.T, k=-1).sum() * 2
        else:
            s1 += NUM.tril(self.result_global_weight_matrix * self.result_global_weight_matrix.T, k=-1).sum() * 2

        n = self.result_global_weight_matrix.shape[0]
        s2 = NUM.sum((row_sum + col_sum) ** 2)
        ei = -1 / (n - 1)
        squareEi = ei ** 2
        scale = n / s0
        s02 = s0 ** 2
        n2 = n ** 2

        result_morans_i = []
        result_morans_z = []
        result_morans_p = []
        rows = [
            [ARCPY.GetIDMessage(220055), ARCPY.GetIDMessage(220874), ARCPY.GetIDMessage(220542)] #["Component ID", "Moran's I", "P-Value"]
        ]

        #### Calculate Moran's I for each eign vectors ####
        ceil = self.result_eig_vectors.shape[1] if self.maxSpatialComponentsNum is None else min(self.result_eig_vectors.shape[1], self.maxSpatialComponentsNum)
        for i in range(ceil):
            y = self.result_eig_vectors[:, i].copy()
            y = y - NUM.mean(y)
            numerator = NUM.sum((self.result_global_weight_matrix * y).T * y)
            denominator = NUM.sum(y ** 2)
            moran_i = n * numerator / s0 / denominator
            gi = (scale * (numerator / denominator))
            yDev4Sum = NUM.sum(y ** 4) / n
            yDevsqsq = (denominator / n) ** 2
            b2 = yDev4Sum / yDevsqsq
            left = n * ((n2 - (3 * n) + 3) * s1 - (n * s2) + 3 * (s02))
            right = b2 * ((n2 - n) * s1 - (2 * n * s2) + 6 * (s02))
            denom = (n - 1) * (n - 2) * (n - 3) * s02
            num = (left - right) / denom
            expectedSquaredI = num
            vi = expectedSquaredI - squareEi

            #### Assure that Variance is Larger than Zero ####
            if NUM.isnan(vi) or vi <= 0.0:
                ARCPY.AddIDMessage("Error", 906)
                raise SystemExit()

            standDev = NUM.sqrt(vi)
            zi = (gi - ei) / standDev
            pVal = STATS.zProb(zi, type=2)
            result_morans_i.append(moran_i)
            result_morans_z.append(zi)
            result_morans_p.append(pVal)
            # rows.append([f"{i+1}", _ff(self.result_eig_values[i]), _ff(moran_i), _ff(pVal)])
            rows.append([f"{i+1}", _ff(moran_i), _ff(pVal, 3)])

        header = ARCPY.GetIDMessage((220876))  # "Spatial Autocorrelation of Spatial Components"
        outputTable = UTILS.outputTextTable(rows, header=header,
                                            pad=1, footnote=[], colPad=4, emphasizeHeadRow=True,
                                            returnHTMLMsg=False, force2Txt=False)
        ARCPY.AddMessage(outputTable)

    def __auto_select_MIR(self, X, isSWMUnweighted=False, msg=""):
        y = self.ssdo.fields[self.auto_select_vars[0]].returnDouble()
        residual = y - y.mean()

        ms = ARC._ss.PyMEMSelection(
            eign_vectors=X.T.copy(),
            swm_inds=self.swm_i_j, swm_weights=self.swm_w,
            coords=self.coordinates,
            num_threads=self.numThreads,
            is_swm_unweighted=isSWMUnweighted,
            random_seed=self.randSeed
        )
        # result = {
        #     'ev_inds': [],
        #     'morans_i_values': [],
        #     'p_values': [],
        #     'final_residuals': [],
        #     'residual_sums': []
        # }
        result = ms.do_MIR(target_residual=residual, p_val_threshold=self.auto_select_p_val_threshold, message=msg)
        if result is None:
            raise SystemExit()

        return result

    def __cal_gloabl_adj_r2(self, X):
        Y = NUM.zeros((self.numObs, len(self.auto_select_vars)), dtype=float)
        for i, var in enumerate(self.auto_select_vars):
            Y[:, i] = self.ssdo.fields[var].returnDouble()

        # Center the response variables
        Y = Y - Y.mean(axis=0)

        # Fit the model for each response variable
        betas, residuals, rank, s = NUM.linalg.lstsq(X, Y, rcond=None)

        # Number of observations and predictors
        n, p = X.shape[0], X.shape[1]

        rss = residuals.sum()
        tss = 0
        for i in range(Y.shape[1]):
            tss += NUM.sum(Y[:, i] ** 2)
        # print(f"residual_sum_of_squares: {rss}")
        # print(f"total_sum_of_squares: {tss}")
        r_squared = 1 - rss / tss
        adjusted_r2 = 1 - (1 - r_squared) * (n - 1) / (n - p - 1)
        return adjusted_r2

    def __auto_select_global(self, X):
        adjusted_r2 = self.__cal_gloabl_adj_r2(X)
        return adjusted_r2
        # UTILS.outputHeader(["Adjusted R", UTILS.buildSuperscript("2"), f" for the Gloabl Model is {adjusted_r2:.6f}"], 5)


    def __cal_f(self, r2x, r2xz, q, n, p):
        res = (r2xz - r2x) / q
        res *= (n - p - q) / (1 - r2xz)
        return res

    def __test_f_reduced_model(self, y_hat_old, xtxixt_old, xtxixt_new, residuals_old, x_local, fobs, q, p, num_perm=999):
        n = y_hat_old.shape[0]
        col_y = y_hat_old.shape[1]
        k = xtxixt_new.shape[0]
        k_old = k - 1
        x_local_old = x_local[:, 0: k_old]
        num_greater_than = 0

        for _ in range(num_perm):
            for j in range(residuals_old.shape[1]):
                NUM.random.shuffle(residuals_old[:, j])
            y_perm = y_hat_old + residuals_old
            betas_perm = NUM.dot(xtxixt_new, y_perm)
            Y_perm_pred_new = NUM.dot(x_local, betas_perm)

            y_perm_cent = y_perm - y_perm.mean(axis=0)
            tss = 0
            rss_new = 0
            for i in range(y_perm_cent.shape[1]):
                tss += NUM.sum(y_perm_cent[:, i] ** 2)
                rss_new += NUM.sum((Y_perm_pred_new[:, i] - y_perm[:, i]) ** 2)
            r2_new = 1 - rss_new / tss

            if xtxixt_old is not None:
                betas_perm_old = NUM.dot(xtxixt_old, y_perm)
                Y_perm_pred_old = NUM.dot(x_local_old, betas_perm_old)
                rss_old = 0
                for i in range(y_perm_cent.shape[1]):
                    rss_old += NUM.sum((Y_perm_pred_old[:, i] - y_perm[:, i]) ** 2)
                r2_old = 1 - rss_old / tss
            else:
                r2_old = 0

            f_perm = self.__cal_f(r2_old, r2_new, q, n, p)
            if f_perm > fobs:
                num_greater_than += 1

        return (num_greater_than + 1.0) / (num_perm + 1.0)

    def __auto_select_forward_c(self, Xs, msg=""):
        r2_thres = 0.99
        num_perm = 999
        r2_increase_thres = 0.001
        r2_adj_thres = self.__cal_gloabl_adj_r2(Xs)
        Ys = NUM.zeros((self.numObs, len(self.auto_select_vars)), dtype=float)
        for i, var in enumerate(self.auto_select_vars):
            Ys[:, i] = self.ssdo.fields[var].returnDouble()

        # Ys -= Ys.mean(axis=0)
        Xs = Xs.copy()
        Xs -= Xs.mean(axis=0)
        Xs /= NUM.std(Xs, ddof=1, axis=0)
        ms = ARC._ss.PyMEMSelection(
            eign_vectors=Xs.T.copy(),
            swm_inds=None, swm_weights=None,
            coords=None,
            num_threads=self.numThreads,
            is_swm_unweighted=True,
            random_seed=self.randSeed
        )
        if r2_adj_thres > 1:
            r2_adj_thres = 1
        FRD_element = ms.do_FRD(Ys=Ys.T.copy(), r2_adj_threshold=r2_adj_thres,
                                p_val_threshold=self.auto_select_p_val_threshold,
                                r2_increase_threshold=r2_increase_thres,
                                r2_threshold=r2_thres, num_perm=num_perm, message=msg)

        if FRD_element is None:
            raise SystemExit()
        # print(FRD_element)
        return FRD_element

    def __auto_select_forward(self, Xs, msg=""):
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84129))
        r2_thres = 0.99
        num_perm = 999
        r2_increase_thres = 0.001
        Xs = Xs.copy()
        r2_adj_thres = self.__cal_gloabl_adj_r2(Xs)
        Ys = NUM.zeros((self.numObs, len(self.auto_select_vars)), dtype=float)
        for i, var in enumerate(self.auto_select_vars):
            Ys[:, i] = self.ssdo.fields[var].returnDouble()

        Ys -= Ys.mean(axis=0)
        Ys /= NUM.std(Ys, ddof=1, axis=0)
        Xs -= Xs.mean(axis=0)
        Xs /= NUM.std(Xs, ddof=1, axis=0)
        n = Xs.shape[0]
        col_x = Xs.shape[1]

        p_vals = []
        f_vals = []
        r2_vals = []
        r2_adj_vals = []
        vec_rest = [i for i in range(col_x)]
        vec_selected = []
        coefficients = []

        TSS = 0
        for i in range(Ys.shape[1]):
            TSS += NUM.dot(Ys[:, i], Ys[:, i])
        y_hat_prev = NUM.zeros(Ys.shape, dtype=float)
        xtxixt_prev = None
        resid_prev = Ys
        max_r2_prev = 0

        for i in range(col_x):
            max_r2 = 0
            max_r2_adj = 0
            max_r2_ind = -1
            p = len(vec_selected)
            for j in range(col_x):
                if vec_rest[j] < 0:
                    continue

                local_inds = vec_selected + [j]
                x_local = Xs[:, local_inds]
                betas, residuals, rank, s = NUM.linalg.lstsq(x_local, Ys, rcond=None)
                rss = residuals.sum()
                r2 = 1 - rss / TSS
                if r2 > max_r2:
                    max_r2 = r2
                    max_r2_adj = 1 - (1 - r2) * (n - 1) / (n - p - 1)
                    max_r2_ind = j
                    coefficients = betas

            vec_selected.append(max_r2_ind)
            r2_vals.append(max_r2)
            r2_adj_vals.append(max_r2_adj)
            vec_rest[max_r2_ind] = -1
            x_local = Xs[:, vec_selected]
            # betas, residuals, rank, s = NUM.linalg.lstsq(x_local, Ys, rcond=None)
            xx = NUM.dot(x_local.T, x_local)
            xxi = LA.inv(xx)
            xtxixt = NUM.dot(xxi, x_local.T)
            coefs = NUM.dot(xtxixt, Ys)
            y_hat = NUM.dot(x_local, coefs)
            resid = Ys - y_hat
            fobs = self.__cal_f(max_r2_prev, max_r2, 1, n, len(vec_selected))
            f_vals.append(fobs)
            # print(f"fobs: {fobs}")
            p_val = self.__test_f_reduced_model(y_hat_prev, xtxixt_prev, xtxixt,
                                                resid_prev.copy(), x_local, fobs, 1, i, num_perm=num_perm)
            p_vals.append(p_val)

            if len(r2_vals) > 1 and abs(r2_vals[-1] - r2_vals[-2]) < r2_increase_thres:
                # increase of r-square is not significant
                break

            if max_r2 > r2_thres:
                break

            if max_r2_adj > r2_adj_thres:
                break

            if p_val > self.auto_select_p_val_threshold:
                break

            y_hat_prev = y_hat
            xtxixt_prev = xtxixt
            resid_prev = resid
            max_r2_prev = max_r2

        FRD_element = {
            "r2_adj_thres": r2_adj_thres,
            "ev_inds": vec_selected,
            "adj_r2_values": r2_adj_vals,
            "p_values": p_vals,
            "coefficient_values": coefficients,
        }
        ARCPY.ResetProgressor()
        return FRD_element

    def createOutput(self, outputFC, outSWMFile=None):
        if outputFC is not None:
            candidateFields = {}
            fieldOrder = []

            self.symbolField = None
            self.symbolAlias = None
            self.symbolData = None

            #### Append Eigen Vectors ####
            if self.result_eig_vectors is not None:
                if self.auto_select_method is None:
                    vce_num = min(self.result_eig_vectors.shape[1], self.maxSpatialComponentsNum)
                    inds = range(vce_num)
                elif self.auto_select_method in [SupportedEVSelectMethods.MIN_SPATIAL_AUTOCORRELATION, SupportedEVSelectMethods.FORWARD_SELECTION]:
                    inds = self.result_auto_select_collection["elements"][self.result_auto_select_collection["optimal_ind"]]["ev_inds"]
                    inds = [i for i in inds if i >= 0]
                else:
                    inds = range(15)

                for order, i in enumerate(inds):
                    fieldName = f"C{order+1}"
                    alias = f"Spatial Component {order+1}"
                    candidateField = SSDO.CandidateField(fieldName, "DOUBLE", self.result_eig_vectors[:, i], alias = alias,
                                                         checkNullValues = False)
                    candidateFields[fieldName] = candidateField
                    fieldOrder.append(fieldName)
            if self.auto_select_method == SupportedEVSelectMethods.MIN_SPATIAL_AUTOCORRELATION:
                result_MIR = self.result_auto_select_collection["elements"][self.result_auto_select_collection["optimal_ind"]]
                fieldName = "F_VAR"
                target_alias = ARCPY.GetIDMessage(220873).format(self.ssdo.fields[self.auto_select_vars[0]].alias)
                y = self.ssdo.fields[self.auto_select_vars[0]].returnDouble()
                candidateField = SSDO.CandidateField(fieldName, "DOUBLE", result_MIR["final_residuals"] + y.mean(),
                                                     alias=target_alias,
                                                     checkNullValues=False)
                candidateFields[fieldName] = candidateField
                fieldOrder.append(fieldName)

            self.ssdo.output2NewFC(outputFC, candidateFields,
                                   appendFields=self.varNames, fieldOrder=fieldOrder)

        if outSWMFile is not None and self.outSWMFileUniqueIdField is not None:
            hasID64 = UTILS.fieldIsBigInteger(self.ssdo.info.catalogPath, self.outSWMFileUniqueIdField)
            swmWriter = WU.SWMWriter(outSWMFile, self.outSWMFileUniqueIdField.upper(), self.ssdo.spatialRefName,
                                     self.numObs, rowStandard=False, inputFC=self.ssdo.info.catalogPath,
                                     wType=SupportedSpatialRelation.GET_SPATIAL_WEIGHTS_FROM_FILE,
                                     forceFixed=self.auto_select_opt_swm["weightSchema"] == SupportedWeightSchema.UNWEIGHTED,
                                     hasID64=hasID64)

            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84127), 0, self.numObs, 1)
            for orderId, val in self.auto_select_opt_swm["data"].items():
                nhIDs, weights = val
                masterID = self.outSWM_Order2Master[orderId]
                neighborIDs = [self.outSWM_Order2Master[i] for i in nhIDs]
                #### Add Weights Entry ####
                swmWriter.swm.writeEntry(masterID, neighborIDs, weights)
                #### Set Progress ####
                ARCPY.SetProgressorPosition()


            #### Clean Up ####
            swmWriter.close()
            # #### Report Spatial Weights Summary ####
            # swmWriter.report()
            # #### Report SWM File is Large ####
            # swmWriter.reportLargeSWM()