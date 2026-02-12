import arcgisscripting as ARC
import numpy

import arcpy as ARCPY
import locale as LOCALE
import SSUtilities as UTILS
import numpy as NUM
import netCDF4 as NET
import SSCube as CUBE
import SSPanel as PANEL
import SSCubeUtilities as CUTILS
import SSDataObject as SSDO
import time
import json as JSON
import arcpy.management as DM
import WeightsUtilities as WU
from WeightsUtilities import SciPyNeighborSearch
from enum import IntEnum
import os as OS
import tempfile as TEMPFILE
from TimeSeriesCluster import isPanel, isPanelFromFile
from scipy.fft import fft as FFT
from scipy import stats as STATS
import warnings as WARNINGS

SUPPORT_CONCEPTS = ["FIXED_DISTANCE", "K_NEAREST_NEIGHBORS",
                   "CONTIGUITY_EDGES_ONLY", "CONTIGUITY_EDGES_CORNERS"]

CALCULATE_WITH_PYTHON = False
INT_NULL = UTILS.shpFileNull["LONG"]
DOUBLE_NULL = UTILS.shpFileNull["DOUBLE"]
ADJUST_CORR_RESULTS = True
ALPHA = 0.05
MAX_PW_LAG = 5

FN_abs_max_cor = "ABSMAX_COR"
FA_abs_max_cor = ARCPY.GetIDMessage(220781)  # "Strongest Absolute Correlation"
FN_abs_max_lag = "ABSMAX_LAG"
FA_abs_max_lag = ARCPY.GetIDMessage(220780)  # "Lag of Strongest Absolute Correlation"
FN_abs_max_p = "P_VAL_ABS"
FA_abs_max_p = ARCPY.GetIDMessage(220795)  # "P-value of Strongest Absolute Correlation"
FN_abs_max_ci_lower = "LOW_CI_ABS"
FA_abs_max_ci_lower = ARCPY.GetIDMessage(220796)  # "Lower 95% Confidence Bound of Strongest Absolute Correlation"
FN_abs_max_ci_upper = "UP_CI_ABS"
FA_abs_max_ci_upper = ARCPY.GetIDMessage(220797)  # "Upper 95% Confidence Bound of Strongest Absolute Correlation"
FN_abs_max_sig = "SIG_ABS"
FA_abs_max_sig = ARCPY.GetIDMessage(220806)  # "Significance of Strongest Absolute Correlation"

FN_max_cor = "MAX_P_COR"
FA_max_cor = ARCPY.GetIDMessage(220783)  # "Strongest Positive Correlation"
FN_max_lag = "MAX_P_LAG"
FA_max_lag = ARCPY.GetIDMessage(220782)  # "Lag of Strongest Positive Correlation
FN_max_p = "P_VAL_POS"
FA_max_p = ARCPY.GetIDMessage(220798)  # "P-value of Strongest Positive Correlation"
FN_max_ci_lower = "LOW_CI_POS"
FA_max_ci_lower = ARCPY.GetIDMessage(220799)  # "Lower 95% Confidence Bound of Strongest Positive Correlation"
FN_max_ci_upper = "UP_CI_POS"
FA_max_ci_upper = ARCPY.GetIDMessage(220800)  # "Upper 95% Confidence Bound of Strongest Positive Correlation"
FN_max_sig = "SIG_POS"
FA_max_sig = ARCPY.GetIDMessage(220807)  # "Significance of Strongest Positive Correlation"

FN_min_cor = "MIN_N_COR"
FA_min_cor = ARCPY.GetIDMessage(220785)  # "Strongest Negative Correlation"
FN_min_lag = "MIN_N_LAG"
FA_min_lag = ARCPY.GetIDMessage(220784)  # "Lag of Strongest Negative Correlation"
FN_min_p = "P_VAL_NEG"
FA_min_p = ARCPY.GetIDMessage(220801)  # "P-value of Strongest Negative Correlation"
FN_min_ci_lower = "LOW_CI_NEG"
FA_min_ci_lower = ARCPY.GetIDMessage(220802)  # "Lower 95% Confidence Bound of Strongest Negative Correlation"
FN_min_ci_upper = "UP_CI_NEG"
FA_min_ci_upper = ARCPY.GetIDMessage(220803)  # "Upper 95% Confidence Bound of Strongest Negative Correlation"
FN_min_sig = "SIG_NEG"
FA_min_sig = ARCPY.GetIDMessage(220808)  # "Significance of Strongest Negative Correlation"

FN_p = "P_VALUE"
FA_p = ARCPY.GetIDMessage(220542)  # "P-value"
FN_ci_lower = "LOWER_CI"
FA_ci_lower = ARCPY.GetIDMessage(220761)  # "Lower 95% Confidence Bound"
FN_ci_upper = "UPPER_CI"
FA_ci_upper = ARCPY.GetIDMessage(220762)  # "Upper 95% Confidence Bound"

FN_corr = "CORR_{}"
FA_corr = ARCPY.GetIDMessage(220786)  # "Correlation of time lag {}"

FN_num_nei = "NUM_NEIGHS"
FA_num_nei = ARCPY.GetIDMessage(84362)  # "Number of Neighbors"


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


def checkEmptyGroupLayer(groupLayer):
    """
    Check if the groupLayer is actually empty
    """
    layers = [groupLayer]
    while len(layers):
        l = layers.pop(0)
        if not l.isGroupLayer:
            return False
        if len(l.listLayers()):
            layers += l.listLayers()
    return True


def _newField(name, aliasName, type):
    f = ARCPY.Field()
    f.name = name
    f.aliasName = aliasName
    f.type = type
    return f


def buildOutputFCSchema(cubeStr, var_name, var_name_corr, max_time_lag, neighbor_concept, time_lag_direction, apply_pre_whitening,
                        output_corr_table=None, output_pair_table=None):
    """
    Build the output feature class schema
    Parameters
    ----------
    cube
    var_name
    var_name_corr
    max_time_lag
    neighbor_concept
    time_lag_direction
    apply_pre_whitening
    output_corr_table
    output_pair_table
    Returns
    -------

    """
    dataset = NET.Dataset(cubeStr, keepweakref=True)
    T = dataset.variables['time'].size
    dataset.close()

    if not max_time_lag:
        max_time_lag = int(10 * NUM.log10(T / 2))
    max_time_lag = min(max_time_lag, T - 5)

    if neighbor_concept is not None and neighbor_concept.upper() in SUPPORT_CONCEPTS:
        neighbor_concept = neighbor_concept.upper()
    else:
        neighbor_concept = None
    if neighbor_concept is None and var_name == var_name_corr:
        lag_candidates = [i for i in range(1, max_time_lag + 1)]
    else:
        if time_lag_direction == "BOTH":
            lag_candidates = [i for i in range(-max_time_lag, max_time_lag + 1)]
        elif time_lag_direction == "FORWARD":
            lag_candidates = [i for i in range(0, max_time_lag + 1)]
        else:
            lag_candidates = [i for i in range(-max_time_lag, 1)]

    export_p_values = False
    if neighbor_concept is None and apply_pre_whitening:
        export_p_values = True

    primaryOutFCFields = [_newField("LOCATION", "Location ID", "LONG")]

    primaryOutFCFields.append(_newField(FN_abs_max_lag, FA_abs_max_lag, "LONG"))
    primaryOutFCFields.append(_newField(FN_abs_max_cor, FA_abs_max_cor, "DOUBLE"))
    if export_p_values:
        primaryOutFCFields.append(_newField(FN_abs_max_p, FA_abs_max_p, "DOUBLE"))
        primaryOutFCFields.append(_newField(FN_abs_max_ci_lower, FA_abs_max_ci_lower, "DOUBLE"))
        primaryOutFCFields.append(_newField(FN_abs_max_ci_upper, FA_abs_max_ci_upper, "DOUBLE"))

    primaryOutFCFields.append(_newField(FN_max_lag, FA_max_lag, "LONG"))
    primaryOutFCFields.append(_newField(FN_max_cor, FA_max_cor, "DOUBLE"))
    if export_p_values:
        primaryOutFCFields.append(_newField(FN_max_p, FA_max_p, "DOUBLE"))
        primaryOutFCFields.append(_newField(FN_max_ci_lower, FA_max_ci_lower, "DOUBLE"))
        primaryOutFCFields.append(_newField(FN_max_ci_upper, FA_max_ci_upper, "DOUBLE"))

    primaryOutFCFields.append(_newField(FN_min_lag, FA_min_lag, "LONG"))
    primaryOutFCFields.append(_newField(FN_min_cor, FA_min_cor, "DOUBLE"))
    if export_p_values:
        primaryOutFCFields.append(_newField(FN_min_p, FA_min_p, "DOUBLE"))
        primaryOutFCFields.append(_newField(FN_min_ci_lower, FA_min_ci_lower, "DOUBLE"))
        primaryOutFCFields.append(_newField(FN_min_ci_upper, FA_min_ci_upper, "DOUBLE"))

    for step, lag in enumerate(lag_candidates):
        if lag < 0:
            fn = FN_corr.format(f"N{abs(lag)}")
        else:
            fn = FN_corr.format(lag)
        fa = FA_corr.format(lag)
        primaryOutFCFields.append(_newField(fn, fa, "DOUBLE"))

    if output_corr_table is not None:
        corrTableFields = []
        corrTableFields.append(_newField("LOCATION", "Location ID", "LONG"))
        corrTableFields.append(_newField("LAG", "Time Lag", "LONG"))
        corrTableFields.append(_newField("CORR", "Correlation", "DOUBLE"))
        if export_p_values:
            corrTableFields.append(_newField(FN_p, FA_p, "DOUBLE"))
            corrTableFields.append(_newField(FN_ci_lower, FA_ci_lower, "DOUBLE"))
            corrTableFields.append(_newField(FN_ci_upper, FA_ci_upper, "DOUBLE"))
    else:
        corrTableFields = None

    if output_pair_table is not None:
        pairTableFields = []
        pairTableFields.append(_newField("FOCAL_ID", "Focal Location ID", "LONG"))
        pairTableFields.append(_newField("NBR_ID", "Neighbor Location ID", "LONG"))
        pairTableFields.append(_newField("LAG", "Time Lag", "LONG"))
        pairTableFields.append(_newField("CORR", "Correlation", "DOUBLE"))
        if apply_pre_whitening:
            pairTableFields.append(_newField(FN_p, FA_p, "DOUBLE"))
            pairTableFields.append(_newField(FN_ci_lower, FA_ci_lower, "DOUBLE"))
            pairTableFields.append(_newField(FN_ci_upper, FA_ci_upper, "DOUBLE"))
    else:
        pairTableFields = None

    return primaryOutFCFields, corrTableFields, pairTableFields


def execute(parameters, messages):
    """Retrieves the parameters from the User Interface and executes the
    appropriate commands."""

    #### User Defined Inputs ####
    inputCube = parameters[0].valueAsText
    varName = UTILS.getTextParameter(1, parameters)
    varNameCorr = UTILS.getTextParameter(2, parameters)
    param_outputFC = parameters[3]
    outputFC = parameters[3].valueAsText
    enablePopUps = parameters[4].value
    maxTimeLag = UTILS.getNumericParameter(5, parameters)
    timeLagDirection = parameters[6].valueAsText
    concept = parameters[7].valueAsText
    numNeighs = UTILS.getNumericParameter(8, parameters)
    distNeighs = parameters[9].valueAsText
    spatialWeightConcept = UTILS.getTextParameter(10, parameters)
    apply_var_pre_whitening = parameters[11].value
    outputCorrTable = parameters[12].valueAsText
    outputPairTable = parameters[13].valueAsText

    #### Boolean for Panel Or Not ####
    isPanelCube = isPanelFromFile(inputCube)

    if not isPanelCube:
        #### Create Cube Object ####
        cube = CUBE.SSCube(inputCube, 'a')
    else:
        #### Create Panel Cube Object for Analysis ####
        cube = PANEL.SSPanel(inputCube, 'a')

    #### Run Analysis ####
    tsc = TimeSeriesCorrelation(
        cube, varName, varNameCorr,
        maxTimeLag,
        concept, numNeighs, distNeighs,
        spatialWeightConcept, include_self=True,
        time_lag_direction=timeLagDirection,
        full_pair_table=outputPairTable,
        create_popups=enablePopUps,
        apply_1d_var1=False, apply_1d_var2=False,
        apply_var_pre_whitening=apply_var_pre_whitening)

    # tsc.exportClusterFC(outputFC, createPopUps=createPopUps)
    tsc.export_correlation_features(outputFC, full_correlation_table=outputCorrTable)
    #### Set Shape and Layer Type ####
    if cube.isPolygon:
        renderLayerFile = "TimeSeriesCorrelation_Polygon.lyrx"
    else:
        renderLayerFile = "TimeSeriesCorrelation_Point.lyrx"

    #### Render Results ####
    try:
        fullRLF = OS.path.join(UTILS.pathLayers, renderLayerFile)
        param_outputFC.symbology = fullRLF
    except:
        ARCPY.AddIDMessage("WARNING", 973)

    cube.close()
    groupLayer = tsc.build_output_group_layer(outputFC)
    if groupLayer is not None:
        ARCPY.SetParameter(14, groupLayer)

    return


def postExecute(parameters):
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


def calculate_correlation(X, Y, lags, mean_shift=True):
    """
    Calculate the correlation between two time series variables.
    Parameters
    ----------
    X       NUMPY ARRAY: 1d array time series data
    Y       NUMPY ARRAY: 1d array time series data
    lags    NUMPY ARRAY: 1d array sequential time lags, example [-3, -2, -1 0, 1, 2, 3]

    Returns
    -------

    """
    corr = NUM.zeros(len(lags), dtype=float)
    if mean_shift:
        x_mean = NUM.mean(X)
        y_mean = NUM.mean(Y)
        X_diff = X - x_mean
        Y_diff = Y - y_mean
    else:
        X_diff = X
        Y_diff = Y
    denom = NUM.sqrt(NUM.sum(X_diff ** 2) * NUM.sum(Y_diff ** 2))
    if denom == 0:
        corr[:] = NUM.nan
    else:
        for step, lag in enumerate(lags):
            if lag == 0:
                A = X_diff
                B = Y_diff
            elif lag > 0:
                A = X_diff[lag:]
                B = Y_diff[:-lag]
            else:
                A = X_diff[:lag]
                B = Y_diff[-lag:]
            nom = NUM.sum(A * B)

            corr[step] = nom / denom

    if ADJUST_CORR_RESULTS:
        T = len(X)
        corr *= T / (T - NUM.abs(lags))
        corr[corr > 1] = 1
        corr[corr < -1] = -1
    return corr


def extract_neighbor_info(cube, var_name, space_concept, neighbor_num, neighbor_dist, analysis_mask=None):
    """
    Extract neighborhood info from space-time cube
    Parameters
    ----------
    cube
    var_name
    space_concept
    neighbor_num
    neighbor_dist

    Returns
    -------
    SciPyNeighborSearch

    """
    is_grid_cube = not isinstance(cube, PANEL.SSPanel)
    neighbor_info = None
    if is_grid_cube:
        if space_concept == "FIXED_DISTANCE":
            neighbor_info = WU.SciPyNeighborSearch(cube, spaceConcept="FIXED_DISTANCE",
                                                   threshold=neighbor_dist, timeOrder=0,
                                                   analysisMask=analysis_mask)

        elif space_concept == "K_NEAREST_NEIGHBORS":
            if neighbor_num < 1:
                ARCPY.AddError("Invalid number of neighbors.")
                raise SystemExit()

            neighbor_info = WU.SciPyNeighborSearch(cube, spaceConcept="K_NEAREST_NEIGHBORS",
                                                   numNeighs=neighbor_num, timeOrder=0,
                                                   analysisMask=analysis_mask)

        elif space_concept == "CONTIGUITY_EDGES_ONLY":
            dist = cube.distanceInterval
            neighbor_info = WU.SciPyNeighborSearch(cube, spaceConcept="FIXED_DISTANCE",
                                                   threshold=dist, timeOrder=0,
                                                   analysisMask=analysis_mask)
        elif space_concept == "CONTIGUITY_EDGES_CORNERS":
            a2b2 = 2.0 * cube.distanceInterval ** 2.0
            hypo = NUM.sqrt(a2b2)
            neighbor_info = WU.SciPyNeighborSearch(cube, spaceConcept="FIXED_DISTANCE",
                                                   threshold=hypo, timeOrder=0,
                                                   analysisMask=analysis_mask)
    else:
        neighbor_info = WU.SciPyNeighborSearch(cube, spaceConcept=space_concept,
                                               threshold=neighbor_dist,
                                               numNeighs=neighbor_num,
                                               timeOrder=0,
                                               scratch=ARCPY.env.scratchGDB)

    return neighbor_info


def getTempLayerPath(is_correlation=True, type: str = "ALL"):
    """
    Get the path for the temporary layer file
    Parameters
    ----------
    is_correlation : bool
                     True if layer for correlation, False if layer for Lag
    type           : str
                     must be one of "ALL", "MAX", "MIN"

    Returns
    -------

    """
    if type is None or type.lower() not in ["all", "max", "min"]:
        ARCPY.AddError("Wrong parameter for type. Must be one of 'all', 'max', 'min'.")
        raise SystemExit()
    tempFolder = TEMPFILE.gettempdir()
    return OS.path.join(tempFolder, f"SS_TSCorrelation_Layer_{'CORR' if is_correlation else 'LAG'}_{type.upper()}.lyrx")


def _lagsClassify(lags: NUM.ndarray, direction: str = "BOTH"):
    """
    Classify the results lag into different categories for later rendering
    Parameters
    ----------
    lags
    direction       : str
                     "BOTH", "FORWARD", "BACKWARD"

    Returns
    -------

    """
    if direction is None or direction.upper() not in ["BOTH", "FORWARD", "BACKWARD"]:
        ARCPY.AddError("Wrong parameter for direction. Must be one of 'BOTH', 'FORWARD', 'BACKWARD'.")
        raise SystemExit()
    results = []
    data = lags[~ (NUM.isinf(lags) | NUM.isnan(lags) | lags == INT_NULL)]
    if len(data) == 0:
        return results, INT_NULL

    minimumBreak = int(NUM.min(data))
    if direction == "BOTH":
        d_n = data[data < 0]
        d_p = data[data > 0]
        d_z = data[data == 0]
        if len(d_n) > 0:
            res = UTILS.classifyVariable(numberCategories=3, classificationID="NATURAL_BREAKS", values=d_n)[0]
            dd = d_n.copy()
            if res is None:
                res = [(max(dd), None)]
            position = 3 - len(res)
            for ele in res:
                upper_bound = int(ele[0])
                inds = NUM.where(dd <= upper_bound)[0]
                l0 = NUM.min(dd[inds])
                l1 = NUM.max(dd[inds])
                if l0 == l1:
                    label = f"{l0}"
                else:
                    label = f"{l0} - {l1}"
                results.append(
                    {
                        "label": label,
                        "position": position,
                        "upperBound": upper_bound,
                    })
                position += 1
                dd = dd[dd > upper_bound]
        if len(d_z) > 0:
            results.append(
                {
                    "label": "0",
                    "position": 3,
                    "upperBound": 0,
                })
        if len(d_p) > 0:
            res = UTILS.classifyVariable(numberCategories=3, classificationID="NATURAL_BREAKS", values=d_p)[0]
            position = 4
            dd = d_p.copy()
            if res is None:
                res = [(max(dd), None)]
            for ele in res:
                upper_bound = int(ele[0])
                inds = NUM.where(dd <= upper_bound)[0]
                l0 = NUM.min(dd[inds])
                l1 = NUM.max(dd[inds])
                if l0 == l1:
                    label = f"{l0}"
                else:
                    label = f"{l0} - {l1}"
                results.append(
                    {
                        "label": label,
                        "position": position,
                        "upperBound": upper_bound,
                    })
                position += 1
                dd = dd[dd > upper_bound]

    else:
        if direction == "FORWARD":
            d_p = data[data > 0]
            d_z = data[data == 0]
            if len(d_z) > 0:
                results.append(
                    {
                        "label": "0",
                        "position": 0,
                        "upperBound": 0,
                    })
            if len(d_p) > 0:
                res = UTILS.classifyVariable(numberCategories=4, classificationID="NATURAL_BREAKS", values=d_p)[0]
                position = 1
                dd = d_p.copy()
                if res is None:
                    res = [(max(dd), None)]
                for ele in res:
                    upper_bound = int(ele[0])
                    inds = NUM.where(dd <= upper_bound)[0]
                    l0 = NUM.min(dd[inds])
                    l1 = NUM.max(dd[inds])
                    if l0 == l1:
                        label = f"{l0}"
                    else:
                        label = f"{l0} - {l1}"
                    results.append(
                        {
                            "label": label,
                            "position": position,
                            "upperBound": upper_bound,
                        })
                    position += 1
                    dd = dd[dd > upper_bound]
        else:  # direction == "BACKWARD"
            d_n = data[data < 0]
            d_z = data[data == 0]
            if len(d_n) > 0:
                res = UTILS.classifyVariable(numberCategories=4, classificationID="NATURAL_BREAKS", values=d_n)[0]
                position = 0
                dd = d_n.copy()
                if res is None:
                    res = [(max(dd), None)]
                for ele in res:
                    upper_bound = int(ele[0])
                    inds = NUM.where(dd <= upper_bound)[0]
                    l0 = NUM.min(dd[inds])
                    l1 = NUM.max(dd[inds])
                    if l0 == l1:
                        label = f"{l0}"
                    else:
                        label = f"{l0} - {l1}"
                    results.append(
                        {
                            "label": label,
                            "position": position,
                            "upperBound": upper_bound,
                        })
                    position += 1
                    dd = dd[dd > upper_bound]
            if len(d_z) > 0:
                results.append(
                    {
                        "label": "0",
                        "position": 4,
                        "upperBound": 0,
                    })

    return results, minimumBreak


class CorrelationType(IntEnum):
    AUTO = 0,
    CROSS = 1


class SpatialWeightType(IntEnum):
    EQUAL = 0,
    BISQUARE = 1,
    GAUSSIAN = 2


def calculate_spatial_weights(focal_centroid, neighbor_centroids, weight_type: SpatialWeightType):
    if weight_type == SpatialWeightType.EQUAL:
        return NUM.full(len(neighbor_centroids), 1.0)
    distances = NUM.zeros(len(neighbor_centroids), dtype=float)
    for i, nei in enumerate(neighbor_centroids):
        distances[i] = NUM.sqrt((focal_centroid[0] - nei[0]) ** 2 + (focal_centroid[1] - nei[1]) ** 2)
    max_dist = distances.max()
    if weight_type == SpatialWeightType.BISQUARE:
        return (1 - (distances / max_dist) ** 2) ** 2
    elif weight_type == SpatialWeightType.GAUSSIAN:
        return NUM.exp(-(distances / max_dist) ** 2 / 2.0)

def calculate_seasonality_period(data):
    N = len(data)
    yf = NUM.abs(FFT(data)[: N // 2])
    #     xf = np.fft.fftfreq(N, 1)[: N//2]
    #     frequencies, power = periodogram(data, 1)
    peak = yf.argmax()
    if peak > 0:
        return round(N / peak)
    else:
        return 0

class TimeSeriesCorrelation(object):
    """Calculates the correlation between two time series variables."""

    def __init__(self, cube, var_name, var_name_corr, max_time_lag,
                 neighbor_concept, neighbor_num, neighbor_dist,
                 spatial_weight_concept, include_self=True, time_lag_direction="BOTH",
                 full_pair_table=None, create_popups=False, apply_1d_var1=False, apply_1d_var2=False,
                 apply_var_pre_whitening=False, var_trend_type="n", var_is_seasonal=False):
        """Initialize the class."""
        self.cube = cube
        self.var_name = self.cube.checkVariable(var_name)
        self.create_popups = create_popups
        if var_name_corr is not None and var_name_corr != var_name:
            self.var_name_corr = self.cube.checkVariable(var_name_corr)
            self.correlation_type = CorrelationType.CROSS
            self.include_self = include_self
        else:
            self.var_name_corr = None
            self.correlation_type = CorrelationType.AUTO
            self.include_self = False

        self.max_time_lag = max_time_lag
        if time_lag_direction not in ["BOTH", "FORWARD", "BACKWARD"]:
            time_lag_direction = "BOTH"
        else:
            time_lag_direction = time_lag_direction.upper()
        self.time_lag_direction = time_lag_direction

        if neighbor_concept is not None and neighbor_concept.upper() in SUPPORT_CONCEPTS:
            self.neighbor_concept = neighbor_concept.upper()
            self.full_pair_table = full_pair_table
        else:
            self.neighbor_concept = None
            self.full_pair_table = None

        if self.neighbor_concept is not None:
            self.include_self = True

        if self.neighbor_concept == "FIXED_DISTANCE":
            self.neighbor_dist = neighbor_dist
        else:
            self.neighbor_dist = None
        if self.neighbor_concept == "K_NEAREST_NEIGHBORS":
            self.neighbor_num = neighbor_num
        else:
            self.neighbor_num = None

        if spatial_weight_concept is not None and spatial_weight_concept.upper() == "BISQUARE":
            self.spatial_weight_type = SpatialWeightType.BISQUARE
            if self.neighbor_num is not None:
                self.neighbor_num += 1
        elif spatial_weight_concept is not None and spatial_weight_concept.upper() == "GAUSSIAN":
            self.spatial_weight_type = SpatialWeightType.GAUSSIAN
        else:
            self.spatial_weight_type = SpatialWeightType.EQUAL

        self.apply_pre_whitening = apply_var_pre_whitening
        if apply_1d_var1 or apply_1d_var2:
            self.apply_pre_whitening = False

        self.var_trend_type = var_trend_type
        if self.var_trend_type is not None and self.var_trend_type.lower() not in ["n", "c", "t", "ct"]:
            self.var_trend_type = "n"
        self.var_is_seasonal = False  # disable the seasonal adjustment for now

        if self.full_pair_table is not None:
            #### Finalize Table Name ####
            tableName, dbf = UTILS.returnTableName(self.full_pair_table)
            try:
                OS.remove(tableName)
            except:
                pass
            path, base = OS.path.split(tableName)
            DM.CreateTable(path, base)
            UTILS.addEmptyField(tableName, "FOCAL_ID", "LONG", alias="Focal Location ID")
            UTILS.addEmptyField(tableName, "NBR_ID", "LONG", alias="Neighbor Location ID")
            UTILS.addEmptyField(tableName, "LAG", "LONG", alias="Time Lag")
            UTILS.addEmptyField(tableName, "CORR", "DOUBLE", alias="Correlation")
            if self.apply_pre_whitening:
                UTILS.addEmptyField(tableName, FN_p, "DOUBLE", alias=FA_p)
                UTILS.addEmptyField(tableName, FN_ci_lower, "DOUBLE", alias=FA_ci_lower)
                UTILS.addEmptyField(tableName, FN_ci_upper, "DOUBLE", alias=FA_ci_upper)
                self.result_pair_corr_update_cursor = ARCPY.da.InsertCursor(
                    self.full_pair_table, ["FOCAL_ID", "NBR_ID", "LAG", "CORR", FN_p, FN_ci_lower, FN_ci_upper])
            else:
                self.result_pair_corr_update_cursor = ARCPY.da.InsertCursor(
                    self.full_pair_table, ["FOCAL_ID", "NBR_ID", "LAG", "CORR"])

        else:
            self.result_pair_corr_update_cursor = None

        #### organize the dataset for next step analysis ####
        self.cube_id_list = None
        self.cube_is_panel = isinstance(cube, PANEL.SSPanel)
        self.data_var = None
        self.data_var_corr = None
        self.cube_centroids = None
        self.id_location_map = {}
        self.mask = None
        if self.cube_is_panel:
            self.cube_id_list = NUM.arange(self.cube.numLocations)
            self.T = cube.numTime
            self.N = self.cube.numLocations
            values = cube.obtainValues(self.var_name, flatten=False)
            Xs = cube.obtainValues("x")
            Ys = cube.obtainValues("y")
            self.data_var = NUM.zeros((self.N, self.T), dtype=float)
            self.cube_centroids = NUM.zeros((self.N, 2), dtype=float)
            for i in range(self.N):
                self.data_var[i, :] = values.data[:, i]
                self.cube_centroids[i, :] = [Xs[i], Ys[i]]
                self.id_location_map[i] = i
            if self.var_name_corr is not None:
                values = cube.obtainValues(self.var_name_corr, flatten=False)
                self.data_var_corr = NUM.zeros((self.N, self.T), dtype=float)
                for i in range(self.N):
                    self.data_var_corr[i, :] = values.data[:, i]
        else:
            num_rows = cube.numRows
            num_cols = cube.numCols
            self.mask = cube.getAnalysisMask(self.var_name)
            if self.var_name_corr is not None:
                self.mask = self.mask & cube.getAnalysisMask(self.var_name_corr)

            #### Set stats info For cube ####
            # analysis_mask = self.cube.obtainVariableMask(self.var_name)
            analysis_mask = self.mask
            tiled_mask = NUM.tile(analysis_mask, self.cube.cubeInfo.num_time)
            tiled_mask = tiled_mask.reshape(self.cube.numTime, num_rows, num_cols)
            self.cube.cubeInfo.reset_search_info(mask=tiled_mask)

            #### Retrieve Values from Cube ####
            fill_zeros = self.var_name[-6:] == '_ZEROS'
            self.cube_id_list = NUM.where(self.mask)[0]
            self.T = cube.numTime
            self.N = len(self.cube_id_list)

            y = self.cube.obtainValues(self.var_name, flatten=False,
                                       fillZeros=fill_zeros) * 1.0
            self.data_var = NUM.zeros((self.N, self.T), dtype=float)
            self.cube_centroids = NUM.zeros((self.N, 2), dtype=float)
            for ind, id in enumerate(self.cube_id_list):
                row = id // num_cols
                col = id % num_cols
                self.data_var[ind, :] = y[:, row, col]
                self.cube_centroids[ind, :] = cube.obtainCentroid(row=row, col=col)
                self.id_location_map[ind] = id
            #### One-Dimensional (flattened) Masks ####
            tiled_mask = tiled_mask.ravel()
            y = y.ravel()
            #### Set Stats ####
            self.cube.setStats(y, tiled_mask)
            if self.var_name_corr is not None:
                y = self.cube.obtainValues(self.var_name_corr, flatten=False,
                                           fillZeros=fill_zeros) * 1.0
                self.data_var_corr = NUM.zeros((self.N, self.T), dtype=float)
                for ind, id in enumerate(self.cube_id_list):
                    row = id // num_cols
                    col = id % num_cols
                    self.data_var_corr[ind, :] = y[:, row, col]
                # #### One-Dimensional (flattened) Masks ####
                # tiled_mask = tiled_mask.ravel()
                # y = y.ravel()
                # #### Set Stats ####
                # self.cube.setStats(y, tiled_mask)
        self.data_origin = self.data_var.copy()
        if self.data_var_corr is not None:
            self.data_origin_corr = self.data_var_corr.copy()
        if self.neighbor_num is not None and self.neighbor_num > self.N:
            self.neighbor_num = self.N
        if self.neighbor_num is not None and self.neighbor_num > 1000 and self.full_pair_table is not None:
            ARCPY.AddIDMessage("WARNING", 110555)

        #### TODO: remove the 1st order differencing features later ####
        if apply_1d_var1 or apply_1d_var2:
            self.T -= 1
            if apply_1d_var1:
                self.data_var = NUM.diff(self.data_var, axis=1)
                self.var_name += "_DIFF"
            else:
                self.data_var = self.data_var[:, :-1]
            if apply_1d_var1 != apply_1d_var2 or self.var_name_corr is not None:
                if self.data_var_corr is None:
                    self.var_name_corr = var_name
                    self.data_var_corr = self.data_origin.copy()
                if apply_1d_var2:
                    self.data_var_corr = NUM.diff(self.data_var_corr, axis=1)
                    self.var_name_corr += "_DIFF"
                else:
                    self.data_var_corr = self.data_var_corr[:, :-1]

        #### Show Warnning if this is a Forecast Cube ####
        if hasattr(cube, "isForecast") and cube.isForecast:
            ARCPY.AddIDMessage("WARNING", 110320)

        # if self.N <= 2:
        #     ARCPY.AddIDMessage("ERROR", 110304, 3)
        #     raise SystemExit()
        if self.N > 1e4:
            ARCPY.AddIDMessage("WARNING", 110305, self.N)

        if self.max_time_lag is None or self.max_time_lag < 0:
            self.max_time_lag = int(10 * NUM.log10(self.T / 2))
        self.max_time_lag = min(self.max_time_lag, self.T - 5)

        if self.neighbor_concept is None and self.correlation_type == CorrelationType.AUTO:
           lags = [i for i in range(1, self.max_time_lag + 1)]
        else:
            if time_lag_direction == "BOTH":
                lags = [i for i in range(-self.max_time_lag, self.max_time_lag + 1)]
            elif time_lag_direction == "FORWARD":
                lags = [i for i in range(0, self.max_time_lag + 1)]
            else:
                lags = [i for i in range(-self.max_time_lag, 1)]

        self.lag_candidates = NUM.array(lags, dtype=NUM.int32)
        self.result_corr = NUM.zeros((self.N, len(lags)), dtype=float)
        self.neighbor_info: SciPyNeighborSearch = None
        self.total_corr_pair_written = 0

        #### Check constant values and throw warning/errors if necessary ####
        self.bool_is_constant_v1 = NUM.zeros(self.N, dtype=bool)
        self.bool_is_constant_v2 = NUM.zeros(self.N, dtype=bool)
        for i in range(self.N):
            if NUM.all(self.data_var[i, :] == self.data_var[i, 0]):
                self.bool_is_constant_v1[i] = True
            if self.data_var_corr is not None and NUM.all(self.data_var_corr[i, :] == self.data_var_corr[i, 0]):
                self.bool_is_constant_v2[i] = True

        constant_v1_features = []
        num_constant_v2_features = 0
        if self.neighbor_concept is None:
            for i in range(self.N):
                if self.bool_is_constant_v1[i]:
                    constant_v1_features.append(self.id_location_map[i])
                elif self.bool_is_constant_v2[i]:
                    constant_v1_features.append(self.id_location_map[i])
        else:
            for i in range(self.N):
                if self.bool_is_constant_v1[i]:
                    constant_v1_features.append(self.id_location_map[i])
                if self.bool_is_constant_v2[i]:
                    num_constant_v2_features += 1

        if len(constant_v1_features) == self.N:
            ARCPY.AddIDMessage("ERROR", 110480)
            raise SystemExit()
        elif self.neighbor_concept is not None and num_constant_v2_features == self.N:
            ARCPY.AddIDMessage("ERROR", 110480)
            raise SystemExit()
        elif len(constant_v1_features) > 0:
            ARCPY.AddIDMessage("WARNING", 110542, ", ".join([str(i) for i in constant_v1_features[: 30]]))

        self.num_threads = UTILS.getNumberOfThreadsDefault()
        # if CALCULATE_WITH_PYTHON:
        #     ARCPY.AddMessage("Process with Python core functions.")
        # else:
        #     ARCPY.AddMessage(f"Process with C++ core functions with {self.num_threads} thread(s).")
        # t0 = time.time()
        self.result_neighbor_num = None
        # self.result_weighted_var2 = None
        self.result_prewhiten_optimal_lags = None
        self.result_optimal_prewhiten_periods = None
        self.result_prewhiten_coefs = None

        t0 = time.time()
        kernel_str = ["EQUAL", "BISQUARE", "GAUSSIAN"][int(self.spatial_weight_type)]

        if self.apply_pre_whitening:
            # demean and standardize the data
            if self.T < 30:
                ARCPY.AddIDMessage("WARNING", 110549)
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220721), 0, self.N, 1)  # calculating...
            t0 = time.time()
            #### Standardize the data first ####
            max_lag = MAX_PW_LAG
            max_period = int(self.T * 0.2)
            self.result_optimal_prewhiten_periods = NUM.zeros(self.N, dtype=int)

            for i in range(self.N):
                if self.bool_is_constant_v1[i]:
                    continue
                data = self.data_var[i]
                std_data = NUM.std(data, ddof=1)
                data = data / std_data
                data = data - NUM.mean(data)
                period = calculate_seasonality_period(data)
                if period > max_period or period < max_lag:
                    period = 0
                self.result_optimal_prewhiten_periods[i] = period
                self.data_var[i, :] = data
                if self.data_var_corr is not None and not self.bool_is_constant_v2[i]:
                    data = self.data_var_corr[i]
                    std_data = NUM.std(data, ddof=1)
                    data = data / std_data
                    self.data_var_corr[i, :] = data - NUM.mean(data)
                ARCPY.SetProgressorPosition()
            ARCPY.ResetProgressor()
            t1 = time.time()
            # ARCPY.AddMessage(f"PW - The data standardization process took {(t1 - t0):.2f} seconds.")

            if CALCULATE_WITH_PYTHON:
                # time2 = time.time()
                self.__apply_pre_whitening()
                # time3 = time.time()
                # ARCPY.AddMessage(f"PW - Time used for pre-whitening in PYTHON: {(time3 - time2):.2f} seconds.")
        if CALCULATE_WITH_PYTHON and not self.apply_pre_whitening:
            self.CTSC = None
        else:
            # self.num_threads = 1
            # self.CTSC = ARC._ss.PyTimeSeriesCorrelation(
            #     z_array=self.data_var, lag_candidates=self.lag_candidates,
            #     z_cross_array=self.data_var_corr, kernel=kernel_str,
            #     coords=self.cube_centroids,
            #     num_threads=self.num_threads,
            #     adjust_correlation=ADJUST_CORR_RESULTS,
            #     pw_coefs=self.result_prewhiten_cofes,
            #     pw_opt_lags=None if self.result_optimal_prewhiten_lags is None else self.result_optimal_prewhiten_lags + 1)
            if self.apply_pre_whitening:
                if CALCULATE_WITH_PYTHON:
                    self.CTSC = ARC._ss.PyTimeSeriesCorrelation(
                        z_array=self.data_var, lag_candidates=self.lag_candidates,
                        z_cross_array=self.data_var_corr, kernel=kernel_str,
                        coords=self.cube_centroids,
                        num_threads=self.num_threads,
                        adjust_correlation=ADJUST_CORR_RESULTS,
                        pw_coefs=self.result_prewhiten_coefs,
                        pw_opt_lags=None if self.result_prewhiten_optimal_lags is None else self.result_prewhiten_optimal_lags + 1)
                else:
                    self.CTSC = ARC._ss.PyTimeSeriesCorrelation(
                        z_array=self.data_var, lag_candidates=self.lag_candidates,
                        z_cross_array=self.data_var_corr, kernel=kernel_str,
                        coords=self.cube_centroids,
                        num_threads=self.num_threads,
                        adjust_correlation=ADJUST_CORR_RESULTS,
                        do_pw=True, pw_periods=self.result_optimal_prewhiten_periods)
                    self.result_prewhiten_optimal_lags = self.CTSC.get_pw_opt_lags()
                    self.result_prewhiten_coefs = self.CTSC.get_pw_coefficients()
                    if self.result_prewhiten_optimal_lags is None or self.result_prewhiten_coefs is None:
                        raise SystemExit()
                    dbg_get_pw_time = self.CTSC.dbg_get_pw_time()
                    # ARCPY.AddMessage(f"PW - Time used for pre-whitening in CPP: {(dbg_get_pw_time):.2f} seconds.")

            else:
                self.CTSC = ARC._ss.PyTimeSeriesCorrelation(
                    z_array=self.data_var, lag_candidates=self.lag_candidates,
                    z_cross_array=self.data_var_corr, kernel=kernel_str,
                    coords=self.cube_centroids,
                    num_threads=self.num_threads,
                    adjust_correlation=ADJUST_CORR_RESULTS)

        if self.neighbor_concept is None:
            if CALCULATE_WITH_PYTHON:
                self.__calculate_a_spatial()
            else:
                self.__calculate_a_spatial_cpp()
        else:
            # self.temp_time_find_neighbors = 0
            # self.temp_time_core_corr = 0

            self.result_neighbor_num = NUM.zeros(self.N, dtype=int)
            # if self.create_popups:
            #     self.result_weighted_var2 = NUM.zeros(self.data_var.shape, dtype=float)
            #### Build neighbor info before calculation ####
            self.neighbor_info = extract_neighbor_info(cube, var_name, self.neighbor_concept,
                                                       self.neighbor_num, self.neighbor_dist, self.mask)
            if CALCULATE_WITH_PYTHON:
                self.__calculate_spatial()
            else:
                if self.result_pair_corr_update_cursor is not None:
                    self.__calculate_spatial_cpp()
                else:
                    do_linear_method = False
                    if not self.apply_pre_whitening and self.N > 5000 and self.T > 10 and self.spatial_weight_type == SpatialWeightType.EQUAL:
                        if self.neighbor_concept == "FIXED_DISTANCE":
                            for i in range(10):
                                neighbors = self.neighbor_info.getSpatialNeighbors(i, includeSelf=self.include_self)
                                if len(neighbors) > 800:
                                    do_linear_method = True
                                    break
                        elif self.neighbor_concept == "K_NEAREST_NEIGHBORS" and self.neighbor_num > 800:
                            do_linear_method = True
                    # if self.neighbor_num is not None:
                        # ARCPY.AddMessage(f"K nearest neighbors used for correlation calculation: {self.neighbor_num}.")
                    if do_linear_method:
                        self.__calculate_spatial_cpp_linear()
                    else:
                        self.__calculate_spatial_cpp_quick()
        t1 = time.time()
        # if self.full_pair_table is None:
        #     ARCPY.AddMessage(f"Time used for correlation calculation: {(t1 - t0):.2f} seconds.")
        # if self.total_corr_pair_written > 0:
        #     ARCPY.AddMessage(f"Total number of correlation pairs written: {self.total_corr_pair_written}")
        # ARCPY.AddMessage(f"Time used for finding neighbors: {self.temp_time_find_neighbors:.2f} seconds.")
        # ARCPY.AddMessage(f"Time used for core c++ correlation calculation: {self.temp_time_core_corr:.2f} seconds.")
        self.__report()

    def __calculate_a_spatial(self):
        from scipy.signal import lfilter

        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220818), 0, self.N, 1)
        for n in range(self.N):
            X = self.data_var[n, :].copy()
            if self.apply_pre_whitening:
                X = lfilter(self.result_prewhiten_coefs[n, :], 1, X)

            if self.data_var_corr is not None:
                Y = self.data_var_corr[n, :].copy()
                if self.apply_pre_whitening:
                    Y = lfilter(self.result_prewhiten_coefs[n, :], 1, Y)
            else:
                Y = X

            if self.apply_pre_whitening:
                optimal_lag = self.result_prewhiten_optimal_lags[n]
            else:
                optimal_lag = 0
            self.result_corr[n, :] = calculate_correlation(X[optimal_lag:], Y[optimal_lag:],
                                                           self.lag_candidates)
            ARCPY.SetProgressorPosition()
        ARCPY.ResetProgressor()

    def __apply_pre_whitening(self):
        from statsmodels.tsa.ar_model import AutoReg
        # from scipy.signal import lfilter
        """
        trend_type: 
        'n' - No trend.
        'c' - Constant only.
        't' - Time trend only.
        'ct' - Constant and time trend.
        """
        # ARCPY.AddMessage(f"Total features to process: {self.N}, total time steps: {self.T}")
        max_lag = MAX_PW_LAG
        max_period = int(self.T * 0.2)

        # if max_lag is None or max_lag <= 0:
        #     max_lag = int(10 * NUM.log10(self.T / 2))
        #     max_lag = min(max_lag, self.T - 5, int(self.T * 0.2))
        max_lag = min(max_lag, self.T - 5, int(self.T * 0.2))
        # ARCPY.AddMessage(f"The maximum lag used for pre-whitening is {max_lag}.")

        self.result_prewhiten_optimal_lags = NUM.zeros(self.N, dtype=int)
        self.result_prewhiten_coefs = NUM.zeros((self.N, max(max_lag, max_period) + 1), dtype=float)
        test_lags = [i for i in range(1, max_lag + 1)]
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220805), 0, self.N, 1)  # Detrending and filtering...

        with WARNINGS.catch_warnings():
            WARNINGS.simplefilter("ignore")
            for i in range(self.N):
                data = self.data_var[i]
                period = self.result_optimal_prewhiten_periods[i]
                optimal_aicc = NUM.inf
                optimal_model = None
                # ARCPY.AddMessage(f"Feature {i}: Period {period}, test_lags {test_lags}")
                for ind, lag in enumerate(test_lags):
                    ar_model = AutoReg(data, lag, trend="n", seasonal=False).fit()
                    # ARCPY.AddMessage(f"lag: {lag}, aic: {ar_model.aic}, len_params: {ar_model.params}")
                    if ar_model.aicc < optimal_aicc:
                        optimal_aicc = ar_model.aicc
                        optimal_lag = lag
                        optimal_model = ar_model
                    else:
                        break
                if period is not None and period > 0:
                    ar_model = AutoReg(data, period, trend="n", seasonal=False).fit()
                    # ARCPY.AddMessage(f"lag: {lag}, aic: {ar_model.aic}, len_params: {ar_model.params}")
                    if ar_model.aicc < optimal_aicc:
                        optimal_aicc = ar_model.aicc
                        optimal_lag = period
                        optimal_model = ar_model
                        # ARCPY.AddMessage(f"For feature {i}, the optimal lag is found at period: {period} with AIC {optimal_aic}.")

                # for period in range(2, max_period):
                #     for lag in range(1, max_lag):
                #         ARCPY.AddMessage(f"----> {period}, {lag}")
                #         ar_model = AutoReg(data, lag, seasonal=True, period=period).fit()
                #         # ARCPY.AddMessage(f"period: {period}, lag: {lag}, aic: {ar_model.aic}, len_params: {ar_model.params}")
                #         if ar_model.aic < optimal_aic:
                #             optimal_aic = ar_model.aic
                #             optimal_lag = lag
                #             optimal_period = period
                #             optimal_model = ar_model

                # optimal_lag = min(range(1, max_lag),
                #                   key=lambda lags:
                #                   AutoReg(data, lags,
                #                           trend=self.var_trend_type, seasonal=self.var_is_seasonal).fit().aic)
                self.result_optimal_prewhiten_periods[i] = period if period is not None else 0
                ar_coeffs = NUM.concatenate(([1], -optimal_model.params))
                # self.result_optimal_prewhiten_lags[i] = optimal_lag
                self.result_prewhiten_optimal_lags[i] = len(optimal_model.params)
                # optimal_lag = self.result_optimal_prewhiten_lags[i]
                # ARCPY.AddMessage(f"optimal_lag: {optimal_lag}")
                self.result_prewhiten_coefs[i, 0: len(ar_coeffs)] = ar_coeffs
                ARCPY.SetProgressorPosition()

            # filter_coeff = NUM.concatenate(([1], -ar_coeffs))
            # x_filtered = lfilter(filter_coeff, 1, data)
            # self.data_var[i] = x_filtered
            # if self.data_var_corr is not None:
            #     data = self.data_var_corr[i].copy()
            #     std_data = NUM.std(data, ddof=1)
            #     if std_data == 0:
            #         continue
            #     data = data / std_data
            #     data = data - NUM.mean(data)
            #     y_filtered = lfilter(filter_coeff, 1, data)
            #     self.data_var_corr[i] = y_filtered
        t1 = time.time()
        # ARCPY.AddMessage(f"Prewhite filtering finished. Time used: {(t1 - t0):.2f} seconds.")
        ARCPY.ResetProgressor()


    def __calculate_a_spatial_cpp(self):
        self.result_corr = self.CTSC.process_a_spatial()
        if self.result_corr is None:
            raise SystemExit()
        invalid_inds = NUM.where(self.result_corr < -2)[0]
        self.result_corr[invalid_inds] = NUM.nan

    def __calculate_spatial(self):
        from scipy.signal import lfilter

        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220818), 0, self.N, 1)
        features_without_neighbors = []
        nei_sum = 0
        valid_features = 0
        # inclued_self = self.correlation_type == CorrelationType.AUTO
        # inclued_self = True

        if self.apply_pre_whitening:
            for n in range(self.N):
                neighbors = self.neighbor_info.getSpatialNeighbors(n, includeSelf=self.include_self)
                ln = len(neighbors)
                if self.include_self and ln > 0:
                    ln -= 1
                self.result_neighbor_num[n] = ln
                if ln == 0:
                    features_without_neighbors.append(n + 1)
                    if not self.include_self:
                        continue
                valid_features += 1
                nei_sum += len(neighbors)
                X = self.data_var[n, :].copy()
                X = lfilter(self.result_prewhiten_coefs[n, :], 1, X)
                weights = calculate_spatial_weights(self.cube_centroids[n, :],
                                                    self.cube_centroids[neighbors, :],
                                                    self.spatial_weight_type)
                weight_sum = 0
                # if weight_sum == 0:
                #     continue
                # weights /= weight_sum
                optimal_lag = self.result_prewhiten_optimal_lags[n]
                BOUNDRY_SHIFT = 1.96 / NUM.sqrt(self.T - optimal_lag)
                for nei_ind, nei_global_id in enumerate(neighbors):
                    if self.data_var_corr is None:
                        Y = self.data_var[nei_global_id, :].copy()
                    else:
                        Y = self.data_var_corr[nei_global_id, :].copy()
                    Y = lfilter(self.result_prewhiten_coefs[n, :], 1, Y)
                    res = calculate_correlation(X[optimal_lag:], Y[optimal_lag:],
                                                self.lag_candidates)
                    if not NUM.isnan(res[0]):
                        weight_sum += weights[nei_ind]
                        self.result_corr[n, :] += res * weights[nei_ind]
                        if self.result_pair_corr_update_cursor is not None:
                            for step, lag in enumerate(self.lag_candidates):
                                corr_ele = res[step] if not NUM.isnan(res[step]) else None
                                values = [n, nei_global_id, lag, corr_ele]
                                if self.apply_pre_whitening:
                                    values += [2 * STATS.norm.sf(NUM.abs(corr_ele * NUM.sqrt(self.T-optimal_lag))),
                                               corr_ele - BOUNDRY_SHIFT, corr_ele + BOUNDRY_SHIFT]
                                    if values[-2] < -1:
                                        values[-2] = -1
                                    if values[-1] > 1:
                                        values[-1] = 1
                                self.result_pair_corr_update_cursor.insertRow(values)
                                self.total_corr_pair_written += 1
                        # if self.result_weighted_var2 is not None:
                        #     if self.data_var_corr is None:
                        #         self.result_weighted_var2[n, :] += weights[nei_ind] * self.data_var[nei_global_id, :]
                        #     else:
                        #         self.result_weighted_var2[n, :] += weights[nei_ind] * self.data_var_corr[nei_global_id, :]

                if weight_sum > 0:
                    self.result_corr[n, :] /= weight_sum
                    # if self.result_weighted_var2 is not None:
                    #     self.result_weighted_var2[n, :] /= weight_sum
                else:
                    self.result_corr[n, :] = NUM.nan

                ARCPY.SetProgressorPosition()
            ARCPY.ResetProgressor()
        else:
            X_diff = self.data_var.copy()
            for n in range(self.N):
                X_diff[n, :] -= NUM.mean(X_diff[n, :])
            if self.data_var_corr is not None:
                Y_diff = self.data_var_corr.copy()
                for n in range(self.N):
                    Y_diff[n, :] -= NUM.mean(Y_diff[n, :])
            else:
                Y_diff = X_diff

            for n in range(self.N):
                neighbors = self.neighbor_info.getSpatialNeighbors(n, includeSelf=self.include_self)
                ln = len(neighbors)
                if self.include_self and ln > 0:
                    ln -= 1
                self.result_neighbor_num[n] = ln
                if ln == 0:
                    features_without_neighbors.append(n + 1)
                    if not self.include_self:
                        continue
                valid_features += 1
                nei_sum += len(neighbors)
                X = X_diff[n, :]
                weights = calculate_spatial_weights(self.cube_centroids[n, :],
                                                    self.cube_centroids[neighbors, :],
                                                    self.spatial_weight_type)
                weight_sum = 0
                # if weight_sum == 0:
                #     continue
                # weights /= weight_sum
                for nei_ind, nei_global_id in enumerate(neighbors):
                    Y = Y_diff[nei_global_id, :]
                    res = calculate_correlation(X, Y, self.lag_candidates,
                                                mean_shift=False)
                    if not NUM.isnan(res[0]):
                        weight_sum += weights[nei_ind]
                        self.result_corr[n, :] += res * weights[nei_ind]
                        if self.result_pair_corr_update_cursor is not None:
                            for step, lag in enumerate(self.lag_candidates):
                                corr_ele = res[step] if not NUM.isnan(res[step]) else None
                                values = [n, nei_global_id, lag, corr_ele]
                                self.result_pair_corr_update_cursor.insertRow(values)
                                self.total_corr_pair_written += 1
                        # if self.result_weighted_var2 is not None:
                        #         self.result_weighted_var2[n, :] += weights[nei_ind] * Y
                if weight_sum > 0:
                    self.result_corr[n, :] /= weight_sum
                    # if self.result_weighted_var2 is not None:
                    #     self.result_weighted_var2[n, :] /= weight_sum
                else:
                    self.result_corr[n, :] = NUM.nan

                ARCPY.SetProgressorPosition()
            ARCPY.ResetProgressor()

        if len(features_without_neighbors):
            # if len(features_without_neighbors) == self.N:
            #     ARCPY.AddError("All features have no neighbors. The provided search distance is too small.")
            #     raise SystemExit()
            # elif len(features_without_neighbors) > 30:
            #     ARCPY.AddWarning(f"{len(features_without_neighbors)} features have no neighbors. First 30 are: {features_without_neighbors[0:31]}")
            # else:
            #     ARCPY.AddWarning(f"{len(features_without_neighbors)} features have no neighbors. They are: {features_without_neighbors}")
            ARCPY.AddIDMessage("WARNING", 110311, len(features_without_neighbors),
                               ", ".join(map(str, features_without_neighbors[0:30])))
        # if valid_features > 0:
        #     ARCPY.AddMessage(f"Average number of neighbors for each feature: {(nei_sum / valid_features):.2f}")

    def __calculate_spatial_cpp_single_thread(self):
        # ARCPY.AddMessage("single cpp thread.")
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220818), 0, self.N, 1)
        features_without_neighbors = []
        nei_sum = 0
        valid_features = 0
        for n in range(self.N):
            neighbors = self.neighbor_info.getSpatialNeighbors(n, includeSelf=self.include_self)
            ln = len(neighbors)
            if self.include_self and ln > 0:
                ln -= 1
            self.result_neighbor_num[n] = ln
            if ln == 0:
                features_without_neighbors.append(n + 1)
                if not self.include_self:
                    continue
            valid_features += 1
            nei_sum += len(neighbors)
            # process cpp here
            weights, corrs = self.CTSC.process_spatial(n, neighbors)
            invalid_inds = NUM.where(corrs[:, 0] < -2)[0]
            weights[invalid_inds] = 0
            weight_sum = NUM.sum(weights)
            if weight_sum > 0:
                weights /= weight_sum
                weighted_res = corrs.T * weights
                self.result_corr[n, :] = NUM.sum(weighted_res, axis=1)
                # if self.result_weighted_var2 is not None:
                #     if self.data_var_corr is None:
                #         self.result_weighted_var2[n, :] = NUM.sum(weights.reshape(-1, 1) * self.data_var[neighbors, :], axis=0)
                #     else:
                #         self.result_weighted_var2[n, :] = NUM.sum(weights.reshape(-1, 1) * self.data_var_corr[neighbors, :], axis=0)
            else:
                self.result_corr[n, :] = NUM.nan
            ARCPY.SetProgressorPosition()
        ARCPY.ResetProgressor()

        if len(features_without_neighbors):
            # if len(features_without_neighbors) == self.N:
            #     ARCPY.AddError("All features have no neighbors. The provided search distance is too small.")
            #     raise SystemExit()
            # elif len(features_without_neighbors) > 30:
            #     ARCPY.AddWarning(
            #         f"{len(features_without_neighbors)} features have no neighbors. First 30 are: {features_without_neighbors[0:31]}")
            # else:
            #     ARCPY.AddWarning(
            #         f"{len(features_without_neighbors)} features have no neighbors. They are: {features_without_neighbors}")
            ARCPY.AddIDMessage("WARNING", 110311, len(features_without_neighbors),
                               ", ".join(", ".join(map(str, features_without_neighbors[0:31]))))
        # if valid_features > 0:
        #     ARCPY.AddMessage(f"Average number of neighbors for each feature: {(nei_sum / valid_features):.2f}")

    def __calculate_spatial_cpp(self):
        features_without_neighbors = []
        nei_sum = 0
        valid_features = 0
        SIZE_LIMIT = int(30000000 / len(self.lag_candidates))
        if SIZE_LIMIT < 5:
            SIZE_LIMIT = 5
        focal_ids = NUM.full(self.N, -1, dtype=NUM.int64)
        neighbor_start_inds = NUM.full(self.N + 1, -1, dtype=NUM.int64)
        neighbor_collection = NUM.full(SIZE_LIMIT, -1, dtype=NUM.int64)
        start_ind = 0
        current_position = 0
        steps = int(self.N / self.num_threads)
        if self.result_pair_corr_update_cursor is not None:
            steps += self.N
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220818), 0,
                            steps,
                            1)
        for n in range(self.N):
            neighbors = self.neighbor_info.getSpatialNeighbors(n, includeSelf=self.include_self)
            ln = len(neighbors)
            if self.include_self and ln > 0:
                ln -= 1
            self.result_neighbor_num[n] = ln
            if ln == 0:
                features_without_neighbors.append(n + 1)
            else:
                valid_features += 1
            neighbor_num = len(neighbors)
            nei_sum += neighbor_num
            if current_position + neighbor_num + 2 >= SIZE_LIMIT:
                # use the cpp function to calculate the correlation here
                if current_position > 0:
                    neighbor_start_inds[n - start_ind] = current_position
                    results = self.CTSC.process_spatial_batch(start_ind, n - 1,
                                                                     focal_ids[0: n - start_ind],
                                                                     neighbor_start_inds[0: n - start_ind + 1],
                                                                     neighbor_collection[0: current_position])
                    if results is None:
                        raise SystemExit()
                    else:
                        weights, corrs = results
                        for local_i, global_i in enumerate(range(start_ind, n)):
                            if self.apply_pre_whitening:
                                optimal_lag = self.result_prewhiten_optimal_lags[global_i]
                            else:
                                optimal_lag = 0
                            BOUNDRY_SHIFT = 1.96 / NUM.sqrt(self.T - optimal_lag)
                            nn = neighbor_start_inds[local_i + 1] - neighbor_start_inds[local_i]
                            if nn > 0:
                                corrs_local = corrs[neighbor_start_inds[local_i]:
                                                    neighbor_start_inds[local_i + 1], :]
                                weights_local = weights[
                                                neighbor_start_inds[local_i]:neighbor_start_inds[local_i + 1]]
                                invalid_inds = NUM.where(corrs_local[:, 0] < -2)[0]
                                weights_local[invalid_inds] = 0
                                weights_local_sum = NUM.sum(weights_local)
                                if weights_local_sum > 0:
                                    weights_local /= weights_local_sum
                                    weighted_res_local = corrs_local.T * weights_local
                                    self.result_corr[global_i, :] = NUM.sum(weighted_res_local, axis=1)
                                    if self.result_pair_corr_update_cursor is not None:
                                        ARCPY.SetProgressorPosition()
                                        global_neighbor_ids = neighbor_collection[
                                                              neighbor_start_inds[local_i]:neighbor_start_inds[local_i + 1]]
                                        for nei_ind, nei_global_id in enumerate(global_neighbor_ids):
                                            for step, lag in enumerate(self.lag_candidates):
                                                if corrs_local[nei_ind, step] > -2:
                                                    corr_ele = corrs_local[nei_ind, step]
                                                    values = [global_i, nei_global_id, lag, corr_ele]
                                                    if self.apply_pre_whitening:
                                                        values += [
                                                            2 * STATS.norm.sf(NUM.abs(corr_ele * NUM.sqrt(self.T - optimal_lag))),
                                                            corr_ele - BOUNDRY_SHIFT,
                                                            corr_ele + BOUNDRY_SHIFT]
                                                        if values[-2] < -1:
                                                            values[-2] = -1
                                                        if values[-1] > 1:
                                                            values[-1] = 1
                                                    self.result_pair_corr_update_cursor.insertRow(values)
                                                    self.total_corr_pair_written += 1
                                    # if self.result_weighted_var2 is not None:
                                    #     global_neighbor_ids = neighbor_collection[
                                    #                           neighbor_start_inds[local_i]:neighbor_start_inds[
                                    #                               local_i + 1]]
                                    #     if self.data_var_corr is None:
                                    #         self.result_weighted_var2[n, :] = NUM.sum(
                                    #             weights_local.reshape(-1, 1) * self.data_var[global_neighbor_ids, :], axis=0)
                                    #     else:
                                    #         self.result_weighted_var2[n, :] = NUM.sum(
                                    #             weights_local.reshape(-1, 1) * self.data_var_corr[global_neighbor_ids, :], axis=0)
                                else:
                                    self.result_corr[global_i, :] = NUM.nan

                            else:
                                self.result_corr[global_i, :] = NUM.nan

                if neighbor_num > SIZE_LIMIT:
                    neighbor_collection = NUM.full(neighbor_num, -1, dtype=NUM.int64)
                else:
                    neighbor_collection = NUM.full(SIZE_LIMIT, -1, dtype=NUM.int64)
                start_ind = n
                focal_ids[0] = n
                neighbor_start_inds[0] = 0
                neighbor_collection[0:neighbor_num] = neighbors
                current_position = neighbor_num

            else:
                focal_ids[n - start_ind] = n
                neighbor_start_inds[n - start_ind] = current_position
                neighbor_collection[current_position: current_position + neighbor_num] = neighbors
                current_position += neighbor_num

        neighbor_start_inds[self.N - start_ind] = current_position
        results = self.CTSC.process_spatial_batch(start_ind, self.N - 1,
                                                         focal_ids[0: self.N - start_ind],
                                                         neighbor_start_inds[0: self.N - start_ind + 1],
                                                         neighbor_collection[0: current_position])
        if results is None:
            raise SystemExit()
        else:
            weights, corrs = results
            for local_i, global_i in enumerate(range(start_ind, self.N)):
                if self.apply_pre_whitening:
                    optimal_lag = self.result_prewhiten_optimal_lags[global_i]
                else:
                    optimal_lag = 0
                BOUNDRY_SHIFT = 1.96 / NUM.sqrt(self.T - optimal_lag)
                nn = neighbor_start_inds[local_i + 1] - neighbor_start_inds[local_i]
                if nn > 0:
                    corrs_local = corrs[neighbor_start_inds[local_i]:neighbor_start_inds[local_i + 1], :]
                    weights_local = weights[
                                    neighbor_start_inds[local_i]:neighbor_start_inds[local_i + 1]]
                    invalid_inds = NUM.where(corrs_local[:, 0] < -2)[0]
                    weights_local[invalid_inds] = 0
                    weights_local_sum = NUM.sum(weights_local)
                    if weights_local_sum > 0:
                        weights_local /= weights_local_sum
                        weighted_res_local = corrs_local.T * weights_local
                        self.result_corr[global_i, :] = NUM.sum(weighted_res_local, axis=1)

                        if self.result_pair_corr_update_cursor is not None:
                            ARCPY.SetProgressorPosition()
                            global_neighbor_ids = neighbor_collection[
                                                  neighbor_start_inds[local_i]:neighbor_start_inds[local_i + 1]]
                            for nei_ind, nei_global_id in enumerate(global_neighbor_ids):
                                for step, lag in enumerate(self.lag_candidates):
                                    if corrs_local[nei_ind, step] > -2:
                                        corr_ele = corrs_local[nei_ind, step]
                                        values = [global_i, nei_global_id, lag, corr_ele]
                                        if self.apply_pre_whitening:
                                            values += [2 * STATS.norm.sf(NUM.abs(corr_ele * NUM.sqrt(self.T - optimal_lag))),
                                                       corr_ele - BOUNDRY_SHIFT, corr_ele + BOUNDRY_SHIFT]
                                            if values[-2] < -1:
                                                values[-2] = -1
                                            if values[-1] > 1:
                                                values[-1] = 1
                                        self.result_pair_corr_update_cursor.insertRow(values)
                                        self.total_corr_pair_written += 1
                        # if self.result_weighted_var2 is not None:
                        #     global_neighbor_ids = neighbor_collection[
                        #                           neighbor_start_inds[local_i]:neighbor_start_inds[
                        #                               local_i + 1]]
                        #     if self.data_var_corr is None:
                        #         self.result_weighted_var2[global_i, :] = NUM.sum(
                        #             weights_local.reshape(-1, 1) * self.data_var[global_neighbor_ids, :], axis=0)
                        #     else:
                        #         self.result_weighted_var2[global_i, :] = NUM.sum(
                        #             weights_local.reshape(-1, 1) * self.data_var_corr[global_neighbor_ids, :], axis=0)
                    else:
                        self.result_corr[global_i, :] = NUM.nan
                else:
                    self.result_corr[global_i, :] = NUM.nan

        ARCPY.ResetProgressor()
        if len(features_without_neighbors):
            # if len(features_without_neighbors) == self.N:
            #     ARCPY.AddError("All features have no neighbors. The provided search distance is too small.")
            #     raise SystemExit()
            # elif len(features_without_neighbors) > 30:
            #     ARCPY.AddWarning(
            #         f"{len(features_without_neighbors)} features have no neighbors. First 30 are: {features_without_neighbors[0:31]}")
            # else:
            #     ARCPY.AddWarning(
            #         f"{len(features_without_neighbors)} features have no neighbors. They are: {features_without_neighbors}")
            ARCPY.AddIDMessage("WARNING", 110311,
                               len(features_without_neighbors),
                               ", ".join(map(str, features_without_neighbors[0:31])))
        # if valid_features > 0:
        #     ARCPY.AddMessage(f"Average number of neighbors for each feature: {(nei_sum / valid_features):.2f}")

    def __calculate_spatial_cpp_quick(self):
        """
        The quick way to calculate the spatial correlation using the cpp extension.
        This method will not return the pair-wise correlation values. for each focal feature to all its neighbors.
        Returns
        -------

        """
        # ARCPY.AddMessage("Using the quick cpp extension to calculate the spatial correlation.")
        features_without_neighbors = []
        nei_sum = 0
        valid_features = 0
        SIZE_LIMIT = int(30000000 / len(self.lag_candidates))
        if SIZE_LIMIT < 5:
            SIZE_LIMIT = 5
        focal_ids = NUM.full(self.N, -1, dtype=NUM.int64)
        neighbor_start_inds = NUM.full(self.N + 1, -1, dtype=NUM.int64)
        neighbor_collection = NUM.full(SIZE_LIMIT, -1, dtype=NUM.int64)
        start_ind = 0
        current_position = 0
        steps = int(self.N / self.num_threads)
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220818), 0,
                            steps,
                            1)
        for n in range(self.N):
            # t0 = time.time()
            neighbors = self.neighbor_info.getSpatialNeighbors(n, includeSelf=self.include_self)
            # self.temp_time_find_neighbors += time.time() - t0
            ln = len(neighbors)
            if self.include_self and ln > 0:
                ln -= 1
            self.result_neighbor_num[n] = ln
            if ln == 0:
                features_without_neighbors.append(n + 1)
            else:
                valid_features += 1
            neighbor_num = len(neighbors)
            nei_sum += neighbor_num
            if current_position + neighbor_num + 2 >= SIZE_LIMIT:
                # use the cpp function to calculate the correlation here
                if current_position > 0:
                    neighbor_start_inds[n - start_ind] = current_position
                    # t0 = time.time()
                    corrs = self.CTSC.process_spatial_batch_quick(start_ind, n - 1,
                                                                     focal_ids[0: n - start_ind],
                                                                     neighbor_start_inds[0: n - start_ind + 1],
                                                                     neighbor_collection[0: current_position])
                    # self.temp_time_core_corr += time.time() - t0
                    if corrs is None:
                        raise SystemExit()
                    else:
                        for local_i, global_i in enumerate(range(start_ind, n)):
                            self.result_corr[global_i, :] = corrs[local_i, :]

                if neighbor_num > SIZE_LIMIT:
                    neighbor_collection = NUM.full(neighbor_num, -1, dtype=NUM.int64)
                else:
                    neighbor_collection = NUM.full(SIZE_LIMIT, -1, dtype=NUM.int64)
                start_ind = n
                focal_ids[0] = n
                neighbor_start_inds[0] = 0
                neighbor_collection[0:neighbor_num] = neighbors
                current_position = neighbor_num

            else:
                focal_ids[n - start_ind] = n
                neighbor_start_inds[n - start_ind] = current_position
                neighbor_collection[current_position: current_position + neighbor_num] = neighbors
                current_position += neighbor_num

        neighbor_start_inds[self.N - start_ind] = current_position
        # t0 = time.time()
        corrs = self.CTSC.process_spatial_batch_quick(start_ind, self.N - 1,
                                                         focal_ids[0: self.N - start_ind],
                                                         neighbor_start_inds[0: self.N - start_ind + 1],
                                                         neighbor_collection[0: current_position])
        # self.temp_time_core_corr += time.time() - t0
        if corrs is None:
            raise SystemExit()
        else:
            for local_i, global_i in enumerate(range(start_ind, self.N)):
                self.result_corr[global_i, :] = corrs[local_i, :]

        self.result_corr[self.result_corr < -2] = NUM.nan
        ARCPY.ResetProgressor()
        if len(features_without_neighbors):
            ARCPY.AddIDMessage("WARNING", 110311,
                               len(features_without_neighbors),
                               ", ".join(map(str, features_without_neighbors[0:31])))

    def __calculate_spatial_cpp_linear(self):
        """
        The fastest way to calculate the spatial correlation using the cpp extension.
        This method will not return the pair-wise correlation values. for each focal feature to all its neighbors.
        This method is designed to be used when the spatial weights are set as "Equal"
        Returns
        -------

        """
        # ARCPY.AddMessage("Using the linear cpp extension to calculate the spatial correlation.")
        features_without_neighbors = []
        nei_sum = 0
        valid_features = 0
        SIZE_LIMIT = int(30000000 / len(self.lag_candidates))
        if SIZE_LIMIT < 5:
            SIZE_LIMIT = 5
        focal_ids = NUM.full(self.N, -1, dtype=NUM.int64)
        neighbor_start_inds = NUM.full(self.N + 1, -1, dtype=NUM.int64)
        neighbor_collection = NUM.full(SIZE_LIMIT, -1, dtype=NUM.int64)
        start_ind = 0
        current_position = 0
        steps = int(self.N / self.num_threads)
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220818), 0,
                            steps,
                            1)
        order_ids = self.CTSC.build_quick_moving_trace()
        for n, id in enumerate(order_ids):
            # t0 = time.time()
            neighbors = self.neighbor_info.getSpatialNeighbors(id, includeSelf=self.include_self)
            # self.temp_time_find_neighbors += time.time() - t0
            ln = len(neighbors)
            if self.include_self and ln > 0:
                ln -= 1
            self.result_neighbor_num[id] = ln
            if ln == 0:
                features_without_neighbors.append(id + 1)
            else:
                valid_features += 1
            neighbor_num = len(neighbors)
            nei_sum += neighbor_num
            if current_position + neighbor_num + 2 >= SIZE_LIMIT:
                # use the cpp function to calculate the correlation here
                if current_position > 0:
                    neighbor_start_inds[n - start_ind] = current_position
                    # t0 = time.time()
                    corrs = self.CTSC.process_spatial_batch_linear(focal_ids[0: n - start_ind],
                                                                   neighbor_start_inds[0: n - start_ind + 1],
                                                                   neighbor_collection[0: current_position])
                    # self.temp_time_core_corr += time.time() - t0
                    if corrs is None:
                        raise SystemExit()
                    else:
                        for local_i, global_i in enumerate(focal_ids[0: n - start_ind]):
                            self.result_corr[global_i, :] = corrs[local_i, :]

                if neighbor_num > SIZE_LIMIT:
                    neighbor_collection = NUM.full(neighbor_num, -1, dtype=NUM.int64)
                else:
                    neighbor_collection = NUM.full(SIZE_LIMIT, -1, dtype=NUM.int64)
                start_ind = n
                focal_ids[0] = id
                neighbor_start_inds[0] = 0
                neighbor_collection[0:neighbor_num] = neighbors
                current_position = neighbor_num

            else:
                focal_ids[n - start_ind] = id
                neighbor_start_inds[n - start_ind] = current_position
                neighbor_collection[current_position: current_position + neighbor_num] = neighbors
                current_position += neighbor_num

        neighbor_start_inds[self.N - start_ind] = current_position
        # t0 = time.time()
        corrs = self.CTSC.process_spatial_batch_linear(focal_ids[0: self.N - start_ind],
                                                       neighbor_start_inds[0: self.N - start_ind + 1],
                                                       neighbor_collection[0: current_position])
        # self.temp_time_core_corr += time.time() - t0
        if corrs is None:
            raise SystemExit()
        else:
            for local_i, global_i in enumerate(focal_ids[0: self.N - start_ind]):
                self.result_corr[global_i, :] = corrs[local_i, :]

        self.result_corr[self.result_corr < -2] = NUM.nan
        ARCPY.ResetProgressor()
        if len(features_without_neighbors):
            features_without_neighbors.sort()
            ARCPY.AddIDMessage("WARNING", 110311,
                               len(features_without_neighbors),
                               ", ".join(map(str, features_without_neighbors[0:31])))


    def __report(self):
        if self.result_corr is None or NUM.all(self.result_corr == 0):
            return

        ##### Initial Cube Report ####
        outputTable = self.cube.generalCubeReport()
        ARCPY.AddMessage(outputTable)

        header = ARCPY.GetIDMessage(220816)  # "Summary of Correlation per Lag"
        rows = [[ARCPY.GetIDMessage(220512), ARCPY.GetIDMessage(84271),
                 ARCPY.GetIDMessage(84272), ARCPY.GetIDMessage(84261),
                 ARCPY.GetIDMessage(84262), ARCPY.GetIDMessage(220814)]]  # [["Time Lag", "Min", "Max", "Mean", "Std. Dev", "Valid Locations"]]
        if self.apply_pre_whitening:
            rows[0].append(ARCPY.GetIDMessage(220815))  # "Significant Locations"
        step = 0
        # abs_corr = NUM.abs(self.result_corr)
        max_row_ind = 0
        max_mean = -1
        for lag in self.lag_candidates:
            # values = abs_corr[:, step]
            values = self.result_corr[:, step]
            valid_inds = NUM.where(NUM.logical_not(NUM.isnan(values)))[0]
            valid_values = values[valid_inds]
            row = None
            if len(valid_values) == 0:
                row = [lag, "-", "-", "-", "-", 0]
                if self.apply_pre_whitening:
                    row.append("-")
            else:
                mean_val = valid_values.mean()
                if mean_val > max_mean:
                    max_mean = mean_val
                    max_row_ind = step
                row = [lag, _ff(valid_values.min()), _ff(valid_values.max()),
                       _ff(valid_values.mean()), _ff(NUM.std(valid_values)),
                       len(valid_values)]
                if self.apply_pre_whitening:
                    result_p = 2 * STATS.norm.sf(NUM.abs(valid_values * NUM.sqrt(self.T - self.result_prewhiten_optimal_lags[valid_inds])))
                    num_sig = NUM.where(result_p <= ALPHA, 1, 0).sum()
                    row += [num_sig]
            rows.append(row)
            step += 1
        max_row_ind += 1  # consider the header row
        table = UTILS.outputTextTable(rows, justify=['center'] + ['right'] * (len(rows[0]) - 1),
                                      header=header, pad=1, colPad=3,
                                      titleFillToken="-",
                                      emptyFillToken="-",
                                      emphasizeHeadRow=True,
                                      returnHTMLMsg=True)
        ARCPY.AddMessage(table)

    def export_correlation_features(self, output, full_correlation_table=None):
        """
        Export result feature class
        Returns
        -------

        """
        if self.result_pair_corr_update_cursor is not None:
            del self.result_pair_corr_update_cursor
            self.result_pair_corr_update_cursor = None


        candidateFieldList = []
        if self.cube_is_panel:
            locationField = self.cube.getLocationFields()[0]
        else:
            locationField = self.cube.getLocationField(self.mask)
        candidateFieldList.append(locationField)
        lag_candidates = self.lag_candidates

        export_p_values = False
        if self.apply_pre_whitening and self.neighbor_concept is None:
            export_p_values = True

        check_null = UTILS.isGDB(output)
        max_abs_inds = NUM.argmax(NUM.abs(self.result_corr), axis=1)
        max_abs_corr = self.result_corr[NUM.arange(self.N), max_abs_inds]
        null_inds = NUM.where(NUM.isnan(max_abs_corr))[0]
        max_abs_lags = lag_candidates[max_abs_inds]
        self.result_max_abs_lags = max_abs_lags.copy()
        self.result_max_abs_lags[null_inds] = INT_NULL
        max_abs_lags[null_inds] = INT_NULL
        max_abs_corr_out = max_abs_corr.copy()
        if not check_null:
            max_abs_corr_out[null_inds] = DOUBLE_NULL
        candidateFieldList.append(SSDO.CandidateField(FN_abs_max_lag, "LONG", data=max_abs_lags,
                                                      alias=FA_abs_max_lag, int_min_as_null=INT_NULL, checkNullValues=check_null))
        candidateFieldList.append(SSDO.CandidateField(FN_abs_max_cor, "DOUBLE", data=max_abs_corr_out, alias=FA_abs_max_cor, checkNullValues=check_null))
        
        if self.result_prewhiten_optimal_lags is not None:
            BOUNDRY_SHIFT = 1.96 / NUM.sqrt(self.T - self.result_prewhiten_optimal_lags)
        else:
            BOUNDRY_SHIFT = 1.96 / NUM.sqrt(self.T)
        
        if export_p_values:
            valid_inds = NUM.where(NUM.logical_not(NUM.isnan(max_abs_corr)))[0]
            result_max_abs_p = max_abs_corr.copy()
            result_max_abs_p[valid_inds] = 2 * STATS.norm.sf(NUM.abs(result_max_abs_p[valid_inds] * NUM.sqrt(self.T - self.result_prewhiten_optimal_lags[valid_inds])))
            result_max_abs_ci_lower = max_abs_corr.copy()
            result_max_abs_ci_lower[valid_inds] -= BOUNDRY_SHIFT[valid_inds]
            result_max_abs_ci_lower[result_max_abs_ci_lower < -1] = -1
            result_max_abs_ci_upper = max_abs_corr.copy()
            result_max_abs_ci_upper[valid_inds] += BOUNDRY_SHIFT[valid_inds]
            result_max_abs_ci_upper[result_max_abs_ci_upper > 1] = 1
            result_max_abs_sig = NUM.full(self.N, INT_NULL, dtype=NUM.int32)
            result_max_abs_sig[valid_inds] = NUM.where(result_max_abs_p[valid_inds] <= ALPHA, 1, 0)
            candidateFieldList.append(SSDO.CandidateField(FN_abs_max_p, "DOUBLE", data=result_max_abs_p, alias=FA_abs_max_p, checkNullValues=check_null))
            candidateFieldList.append(SSDO.CandidateField(FN_abs_max_ci_lower, "DOUBLE", data=result_max_abs_ci_lower, alias=FA_abs_max_ci_lower, checkNullValues=check_null))
            candidateFieldList.append(SSDO.CandidateField(FN_abs_max_ci_upper, "DOUBLE", data=result_max_abs_ci_upper, alias=FA_abs_max_ci_upper, checkNullValues=check_null))
            candidateFieldList.append(SSDO.CandidateField(FN_abs_max_sig, "LONG", data=result_max_abs_sig, alias=FA_abs_max_sig, int_min_as_null=INT_NULL, checkNullValues=check_null))

        max_inds = NUM.argmax(self.result_corr, axis=1)
        max_corr = self.result_corr[NUM.arange(self.N), max_inds]
        max_lags = lag_candidates[max_inds]
        self.result_max_lags = max_lags.copy()
        negative_inds = NUM.where(max_corr < 0)[0]
        max_corr[negative_inds] = NUM.nan
        max_lags[negative_inds] = INT_NULL
        null_inds = NUM.where(NUM.isnan(max_corr))[0]
        max_lags[null_inds] = INT_NULL
        max_corr_out = max_corr.copy()
        if not check_null:
            max_corr_out[null_inds] = DOUBLE_NULL

        self.result_max_lags[null_inds] = INT_NULL
        candidateFieldList.append(SSDO.CandidateField(FN_max_lag, "LONG", data=max_lags,
                                                      alias=FA_max_lag, int_min_as_null=INT_NULL, checkNullValues=check_null))
        candidateFieldList.append(SSDO.CandidateField(FN_max_cor, "DOUBLE", data=max_corr_out, alias=FA_max_cor, checkNullValues=check_null))
        if export_p_values:
            valid_inds = NUM.where(NUM.logical_not(NUM.isnan(max_corr)))[0]
            result_max_pos_p = max_corr.copy()
            result_max_pos_p[valid_inds] = 2 * STATS.norm.sf(NUM.abs(result_max_pos_p[valid_inds] * NUM.sqrt(self.T - self.result_prewhiten_optimal_lags[valid_inds])))
            result_max_pos_ci_lower = max_corr.copy()
            result_max_pos_ci_lower[valid_inds] -= BOUNDRY_SHIFT[valid_inds]
            result_max_pos_ci_lower[result_max_pos_ci_lower < -1] = -1
            result_max_pos_ci_upper = max_corr.copy()
            result_max_pos_ci_upper[valid_inds] += BOUNDRY_SHIFT[valid_inds]
            result_max_pos_ci_upper[result_max_pos_ci_upper > 1] = 1
            result_max_pos_sig = NUM.full(self.N, INT_NULL, dtype=NUM.int32)
            result_max_pos_sig[valid_inds] = NUM.where(result_max_pos_p[valid_inds] <= ALPHA, 1, 0)
            candidateFieldList.append(SSDO.CandidateField(FN_max_p, "DOUBLE", data=result_max_pos_p, alias=FA_max_p, checkNullValues=check_null))
            candidateFieldList.append(SSDO.CandidateField(FN_max_ci_lower, "DOUBLE", data=result_max_pos_ci_lower, alias=FA_max_ci_lower, checkNullValues=check_null))
            candidateFieldList.append(SSDO.CandidateField(FN_max_ci_upper, "DOUBLE", data=result_max_pos_ci_upper, alias=FA_max_ci_upper, checkNullValues=check_null))
            candidateFieldList.append(SSDO.CandidateField(FN_max_sig, "LONG", data=result_max_pos_sig, alias=FA_max_sig, int_min_as_null=INT_NULL, checkNullValues=check_null))

        min_inds = NUM.argmin(self.result_corr, axis=1)
        min_corr = self.result_corr[NUM.arange(self.N), min_inds]
        min_lags = lag_candidates[min_inds]
        self.result_min_lags = min_lags.copy()
        positive_inds = NUM.where(min_corr >= 0)[0]
        min_corr[positive_inds] = NUM.nan
        min_lags[positive_inds] = INT_NULL
        null_inds = NUM.where(NUM.isnan(min_corr))[0]
        min_lags[null_inds] = INT_NULL
        min_corr_out = min_corr.copy()
        if not check_null:
            min_corr_out[null_inds] = DOUBLE_NULL
        self.result_min_lags[null_inds] = INT_NULL
        candidateFieldList.append(SSDO.CandidateField(FN_min_lag, "LONG", data=min_lags,
                                                      alias=FA_min_lag, int_min_as_null=INT_NULL, checkNullValues=check_null))
        candidateFieldList.append(SSDO.CandidateField(FN_min_cor, "DOUBLE", data=min_corr_out, alias=FA_min_cor, checkNullValues=check_null))
        if self.result_neighbor_num is not None:
            candidateFieldList.append(SSDO.CandidateField(FN_num_nei, "LONG", data=self.result_neighbor_num,
                                                          alias=FA_num_nei, checkNullValues=check_null))
        if export_p_values:
            valid_inds = NUM.where(NUM.logical_not(NUM.isnan(min_corr)))[0]
            result_min_pos_p = min_corr.copy()
            result_min_pos_p[valid_inds] = 2 * STATS.norm.sf(NUM.abs(result_min_pos_p[valid_inds] * NUM.sqrt(self.T - self.result_prewhiten_optimal_lags[valid_inds])))
            result_min_pos_ci_lower = min_corr.copy()
            result_min_pos_ci_lower[valid_inds] -= BOUNDRY_SHIFT[valid_inds]
            result_min_pos_ci_lower[result_min_pos_ci_lower < -1] = -1
            result_min_pos_ci_upper = min_corr.copy()
            result_min_pos_ci_upper[valid_inds] += BOUNDRY_SHIFT[valid_inds]
            result_min_pos_ci_upper[result_min_pos_ci_upper > 1] = 1
            result_min_pos_sig = NUM.full(self.N, INT_NULL, dtype=NUM.int32)
            result_min_pos_sig[valid_inds] = NUM.where(result_min_pos_p[valid_inds] <= ALPHA, 1, 0)
            candidateFieldList.append(SSDO.CandidateField(FN_min_p, "DOUBLE", data=result_min_pos_p, alias=FA_min_p, checkNullValues=check_null))
            candidateFieldList.append(SSDO.CandidateField(FN_min_ci_lower, "DOUBLE", data=result_min_pos_ci_lower, alias=FA_min_ci_lower, checkNullValues=check_null))
            candidateFieldList.append(SSDO.CandidateField(FN_min_ci_upper, "DOUBLE", data=result_min_pos_ci_upper, alias=FA_min_ci_upper, checkNullValues=check_null))
            candidateFieldList.append(SSDO.CandidateField(FN_min_sig, "LONG", data=result_min_pos_sig, alias=FA_min_sig, int_min_as_null=INT_NULL, checkNullValues=check_null))

        for step, lag in enumerate(self.lag_candidates):
            values = self.result_corr[:, step]
            values_out = values.copy()
            if not check_null:
                values_out[NUM.isnan(values)] = DOUBLE_NULL
            if lag < 0:
                fn = FN_corr.format(f"N{abs(lag)}")
            else:
                fn = FN_corr.format(lag)
            fa = FA_corr.format(lag)
            candidateFieldList.append(SSDO.CandidateField(fn, "DOUBLE", data=values_out, alias=fa, checkNullValues=check_null))

            step += 1
        # SSDO.CandidateField(fieldName, "LONG", data=self.clusterIds, alias=self.fieldAlias)
        self.cube.exportFeatures2D(outputFC=output, candidateFieldList=candidateFieldList)

        #### Write the correlation results back to cube ####
        # ARCPY.AddMessage("Start writing data back to cube...")
        if self.var_name_corr is None:
            outputVarName = f"TSCORR_{self.var_name}_{self.var_name}"
            maskName = f"{self.var_name}_{self.var_name}_TSCORRMASK"
        else:
            outputVarName = f"TSCORR_{self.var_name}_{self.var_name_corr}"
            maskName = f"{self.var_name}_{self.var_name_corr}_TSCORRMASK"

        if self.cube_is_panel:
            res_corr_abs_max = max_abs_corr
            res_lag_abs_max = max_abs_lags

            res_corr_max_p = max_corr
            res_lag_max_p = max_lags

            res_corr_min_n = min_corr
            res_lag_min_n = min_lags
        else:
            self.cube.cubeInfo.reset_search_info(mask=self.mask)
            res_corr_abs_max = NUM.zeros(self.cube.sizeSlice, NUM.float64)
            res_corr_abs_max[self.mask] = max_abs_corr
            res_lag_abs_max = NUM.zeros(self.cube.sizeSlice, NUM.int32)
            res_lag_abs_max[self.mask] = max_abs_lags

            res_corr_max_p = NUM.zeros(self.cube.sizeSlice, NUM.float32)
            res_corr_max_p[self.mask] = max_corr
            res_lag_max_p = NUM.zeros(self.cube.sizeSlice, NUM.int32)
            res_lag_max_p[self.mask] = max_lags

            res_corr_min_n = NUM.zeros(self.cube.sizeSlice, NUM.float64)
            res_corr_min_n[self.mask] = min_corr
            res_lag_min_n = NUM.zeros(self.cube.sizeSlice, NUM.int32)
            res_lag_min_n[self.mask] = min_lags

        self.cube.append(outputVarName + f"_{FN_abs_max_cor}", res_corr_abs_max)
        self.cube.append(outputVarName + f"_{FN_abs_max_lag}", res_lag_abs_max)

        self.cube.append(outputVarName + f"_{FN_max_cor}", res_corr_max_p)
        self.cube.append(outputVarName + f"_{FN_max_lag}", res_lag_max_p)

        self.cube.append(outputVarName + f"_{FN_min_cor}", res_corr_min_n)
        self.cube.append(outputVarName + f"_{FN_min_lag}", res_lag_min_n)
        if not self.cube_is_panel:
            self.cube.createMaskVariable(maskName, self.mask, varName=outputVarName)

        # ARCPY.AddMessage("Finished writing data back to cube...")

        if full_correlation_table is not None:
            #### Set Progressor ####
            # ARCPY.AddMessage(ARCPY.GetIDMessage(84008))
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84008))
            outPath, outName = OS.path.split(full_correlation_table)

            #### Set Up Field Names and Types ####
            inputFields = UTILS.getFieldNames(["LOCATION", "LAG", "CORR"], outPath)
            inputTypes = ["LONG", "LONG", "DOUBLE"]
            inputAlias = ["Location ID", "Time Lag", "Correlation"]
            if export_p_values:
                inputFields += [FN_p, FN_ci_lower, FN_ci_upper]
                inputTypes += ["DOUBLE", "DOUBLE", "DOUBLE"]
                inputAlias += [FA_p, FA_ci_lower, FA_ci_upper]
                # ARCPY.AddMessage("Exporting p-values and confidence intervals...")

            #### Create Box Plot Table ####
            inputData = []
            # for ind, k in enumerate(self.groupList):
            #     inputData.append( (k, self.fStatRes[ind]))
            for i, location_id in enumerate(self.cube_id_list):
                for step, lag in enumerate(lag_candidates):
                    values = [location_id, lag, self.result_corr[i, step]]
                    if export_p_values:
                        corr = self.result_corr[i, step]
                        values += [2 * STATS.norm.sf(NUM.abs(corr * NUM.sqrt(self.T - self.result_prewhiten_optimal_lags[i]))), corr - BOUNDRY_SHIFT[i], corr + BOUNDRY_SHIFT[i]]
                        if values[-2] < -1:
                            values[-2] = -1
                        if values[-1] > 1:
                            values[-1] = 1
                    inputData.append(tuple(values))

            #### Write Coefficient Table ####
            UTILS.createOutputTable(full_correlation_table, inputFields,
                                    inputTypes, inputData, aliases=inputAlias)

        if self.create_popups:
            if UTILS.isShapeFile(output):
                ARCPY.AddIDMessage("WARNING", 110315)
            else:
                popupFieldName = "HTML_CHART"
                popupFieldAlias = "Time Series Correlation Chart"
                template = """<html>
  <head>
    <meta charset = "utf-8">
    <script>
      var data = @@data,
        rp = "file:///" + g_resourceFolder + "/";
      var st = document.createElement("script"); 
      st.type = "text/javascript";
      st.src = rp + "ArcToolbox/Scripts/Images/SSTSCorrelation.js";
      document.head.appendChild(st);
    </script>
  </head>
  <body></body>
</html>"""
                ARCPY.management.AddFields(
                    output,
                    [[popupFieldName, 'Text', popupFieldAlias,
                      len(template) + len(self.lag_candidates) * 20 + self.T * 40 + 400,
                      None, None]])

                resourcePath = OS.path.dirname(OS.path.dirname(OS.path.dirname(__file__)))
                lang, code = LOCALE.getdefaultlocale()
                langIds = [lang[0:2], lang.replace('_', "-")]
                selectedLang = 'en'
                for langId in langIds:
                    localeJSPath = OS.path.join(resourcePath,
                                                "Charts\\scripts\\culture",
                                                "wijmo.culture.@c.min.js".replace('@c', langId))
                    if OS.path.isfile(localeJSPath):
                        selectedLang = langId
                        break
                startTimes, endTimes = self.cube.getOutputTimeFieldInfo()
                if self.cube.isStartTime:
                    t0 = startTimes[0]
                else:
                    t0 = endTimes[0]
                if self.apply_pre_whitening and self.neighbor_concept is None:
                    show_ci = True
                else:
                    show_ci = False
                content = {
                    "lag0": int(self.lag_candidates[0]),
                    "include0": 1 if 0 in self.lag_candidates else 0,
                    "corrs": [],
                    "ts1": None,
                    "ts2": None,
                    "pw_coefs": None,
                    "num_t": int(self.T),
                    # "pw_ts1": [],
                    # "pw_ts2": [],
                    "t0": t0.strftime("%Y/%m/%d %H:%M:%S"),
                    "intv": self.cube.timeSize,
                    "show_ci": show_ci,
                    # "num_t": int(self.T),
                    "unit": self.cube.timeUnit,
                    "labels": {
                        "title": f"Cross Correlation: {self.var_name}: {self.var_name if not self.var_name_corr else self.var_name_corr}",
                        "var1": self.var_name,
                        "var2": self.var_name if not self.var_name_corr else self.var_name_corr,
                        "date": ARCPY.GetIDMessage(84970),
                        "time": ARCPY.GetIDMessage(84971),
                        "date_time": ARCPY.GetIDMessage(220819),
                        "xlabel": ARCPY.GetIDMessage(220817),
                    },
                    "lang": selectedLang,
                }
                # if self.result_weighted_var2 is not None:
                #     content["labels"]["var2"] += "(Weighted Average)"

                if self.apply_pre_whitening:
                    content["labels"]["pwl"] = ARCPY.GetIDMessage(220804)  #pre-whitening label: "Show detrended and filtered time series"

                fields = ['OBJECTID', popupFieldName]
                popupUpdateCursor = ARCPY.da.UpdateCursor(output, fields)
                localPos = 0
                ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84997), 0, self.N, 1)
                for r in popupUpdateCursor:
                    content["corrs"] = NUM.round(self.result_corr[localPos, :], 4).tolist()
                    if self.neighbor_concept is None:
                        content["ts1"] = NUM.round(self.data_origin[localPos, :], 4).tolist()
                        if self.data_var_corr is not None:
                            content["ts2"] = NUM.round(self.data_origin_corr[localPos, :], 4).tolist()
                        else:
                            content["ts2"] = None
                        # add pw_coefs here
                        if self.apply_pre_whitening and self.result_prewhiten_coefs is not None:
                            optimal_lag = self.result_prewhiten_optimal_lags[localPos]
                            content["num_t"] = int(self.T - optimal_lag)
                            content["pw_coefs"] = self.result_prewhiten_coefs[localPos, 0: optimal_lag + 1].tolist()
                        else:
                            content["pw_coefs"] = None
                    r[1] = template.replace("@@data", JSON.dumps(content))
                    popupUpdateCursor.updateRow(r)
                    localPos += 1
                    ARCPY.SetProgressorPosition()
                    if localPos >= self.N:
                        break

                del popupUpdateCursor
                ARCPY.ResetProgressor()

    def build_output_group_layer(self, outputFC):
        """
        Build the grouplayer which contains multiple symbologies for the result output featureclass
        Returns
        -------

        """

        layers = []
        if self.cube.isPolygon:
            suffix = "_Polygon.lyrx"
        else:
            suffix = "_Point.lyrx"

        lag_symbol_file = f"TimeSeriesCorrelation_Lag"
        if self.neighbor_concept is None and self.correlation_type == CorrelationType.AUTO:
            direction = "FORWARD"
        else:
            direction = self.time_lag_direction

        if direction == "BOTH":
            lag_symbol_file += ""
        elif direction == "FORWARD":
            lag_symbol_file += "_forward"
        else:
            lag_symbol_file += "_backward"
        lag_symbol_file += suffix

        temp_layers2delete = []

        breaks_abs_max, minimumBreak = _lagsClassify(self.result_max_abs_lags, direction)
        if len(breaks_abs_max) > 0:
            temp_layer = getTempLayerPath(False, "ALL")
            UTILS.buildLocaleCIMLayer(
                lag_symbol_file,
                -1,
                data={"breaks": breaks_abs_max, "minimumBreak": minimumBreak},
                outPath=temp_layer)

            layer_lag_abs = ARCPY.management.MakeFeatureLayer(outputFC, FA_abs_max_lag)
            layer_lag_abs = ARCPY.management.ApplySymbologyFromLayer(
                layer_lag_abs,
                temp_layer,
                f"VALUE_FIELD {FN_abs_max_lag} {FN_abs_max_lag}",
                "MAINTAIN")
            layers.append(layer_lag_abs)
            temp_layers2delete.append(temp_layer)

        breaks_max, minimumBreak = _lagsClassify(self.result_max_lags, direction)
        if len(breaks_max) > 0:
            layer_corr_max = ARCPY.management.MakeFeatureLayer(outputFC, FA_max_cor)
            layer_corr_max = ARCPY.management.ApplySymbologyFromLayer(
                layer_corr_max,
                OS.path.join(UTILS.pathLayers, f"TimeSeriesCorrelation_postive{suffix}"),
                f"VALUE_FIELD {FN_max_cor} {FN_max_cor}",
                "MAINTAIN")
            layers.append(layer_corr_max)

            temp_layer = getTempLayerPath(False, "MAX")
            UTILS.buildLocaleCIMLayer(
                lag_symbol_file,
                -1,
                data={"breaks": breaks_max, "minimumBreak":minimumBreak},
                outPath=temp_layer)
            layer_lag_max = ARCPY.management.MakeFeatureLayer(outputFC, FA_max_lag)
            layer_lag_max = ARCPY.management.ApplySymbologyFromLayer(
                layer_lag_max,
                temp_layer,
                f"VALUE_FIELD {FN_abs_max_lag} {FN_max_lag}",
                "MAINTAIN")
            layers.append(layer_lag_max)
            temp_layers2delete.append(temp_layer)

        breaks_min, minimumBreak = _lagsClassify(self.result_min_lags, direction)
        if len(breaks_min) > 0:
            layer_corr_min = ARCPY.management.MakeFeatureLayer(outputFC, FA_min_cor)
            layer_corr_min = ARCPY.management.ApplySymbologyFromLayer(
                layer_corr_min,
                OS.path.join(UTILS.pathLayers, f"TimeSeriesCorrelation_negative{suffix}"),
                f"VALUE_FIELD {FN_min_cor} {FN_min_cor}",
                "MAINTAIN")
            layers.append(layer_corr_min)

            temp_layer = getTempLayerPath(False, "MIN")
            UTILS.buildLocaleCIMLayer(
                lag_symbol_file,
                -1,
                data={"breaks": breaks_min, "minimumBreak":minimumBreak},
                outPath=temp_layer)
            layer_lag_min = ARCPY.management.MakeFeatureLayer(outputFC, FA_min_lag)
            layer_lag_min = ARCPY.management.ApplySymbologyFromLayer(
                layer_lag_min,
                temp_layer,
                f"VALUE_FIELD {FN_abs_max_lag} {FN_min_lag}",
                "MAINTAIN")
            layers.append(layer_lag_min)

        if len(layers) == 0:
            return None

        glName = OS.path.basename(outputFC)
        if glName.lower().endswith(".shp"):
            glName = glName[: -4]
        if glName.endswith("_TimeSeriesCrossCorrelation"):
            glName += "Results"
        else:
            glName += "_TimeSeriesCrossCorrelation_Results"

        try:
            groupLayerResult = ARCPY.gp.MakeGroupLayer(glName, layers)
            group_layer = groupLayerResult.getOutput(0)
            for f in temp_layers2delete:
                if OS.path.isfile(f):
                    OS.remove(f)

            return group_layer
        except:
            return None