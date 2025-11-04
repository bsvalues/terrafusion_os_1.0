import math
import os as OS
import locale as LOCALE
import random

import arcgisscripting as ARC
import arcpy as ARCPY
import arcpy.da as DA
import numpy as NUM
from scipy import stats as STATS
from scipy import linalg as LINALG
import scipy.interpolate as INTERPOLATE
import scipy.spatial as SCPS
import arcpy.management as DM
import math as MATH
import SSUtilities as UTILS
import SSDataObject as SSDO
import SSTimeUtilities as STU
from datetime import datetime
import json as JSON
from enum import IntEnum
from dataclasses import dataclass
from scipy.stats import rankdata
import SSLocalPolyRegr as LPR
import statsmodels.api as STATSMODELS
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
GLOBAL_XG_BOOST_HYPER_PARAM = {
    "number_trees": [10, 20, 30],
    "rate": [0.1, 0.2, 0.3]
}

GLOBAL_B_SPLINE_KNOTS_NUM = 5  # recommend to use small knots number to avoid wiggly fitted curve
GLOBAL_B_SPLINE_DEGREE = 2  # should only use 2 or 3
GLOBAL_LOCAL_POLY_ORDER = 0  # should only use 2 or 3
GLOBAL_ETA_USE_WEIGHTED_RANK = True  # should only use 2 or 3
GLOBAL_BOOTSTRAP_SAMPLE_NUM = 10000  # total number of bootstrap samples for generating confidence interval
GLOBAL_KDE_SAMPLING_NUM = 8000  # total number of samples for KDE

TargetOutcomeName = "EXP_NEW"
TargetOutcomeAlias = ARCPY.GetIDMessage(220696)  # "New Exposure for Outcome = ({})"
TargetOutcomeDiffName = "EXP_DIFF"
TargetOutcomeDiffAlias = ARCPY.GetIDMessage(220697)  # "Change in Exposure for Outcome = ({})"

TargetExposureName = "OUT_NEW"
TargetExposureAlias = ARCPY.GetIDMessage(220698)  # "New Outcome for Exposure = ({})"
TargetExposureDiffName = "OUT_DIFF"
TargetExposureDiffAlias = ARCPY.GetIDMessage(220699)  # "Change in Outcome for Exposure = ({})"


def _get_temp_file_path(output_fc_path):
    tempFolder = TEMPFILE.gettempdir()
    return OS.path.join(tempFolder, "casual_inference_analysis_" + str(hash(output_fc_path)))


def _get_temp_file_path_cim_graphic_layer(output_fc_path):
    tempFolder = TEMPFILE.gettempdir()
    return OS.path.join(tempFolder, f"casual_inference_analysis_cim_graphic_layer_{str(hash(output_fc_path))}.lyrx")


def _ff(val, decimal=2):
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


def _ff_vals(vals, decimal_limit=4):
    """
    Format and localize a list of float values
    Parameters
    ----------
    vals

    Returns
    -------

    """
    return [_ff(val, UTILS.getPerfectFormatDecimal(val, targetDecimal=decimal_limit, minDeciamlLimit=0)) for val in vals]


def execute(parameters, messages):
    input = parameters[0].valueAsText
    outcome_field = UTILS.getTextParameter(1, parameters)
    expo_field = UTILS.getTextParameter(2, parameters)
    conf_fields = [(row[0].value, row[1]) for row in parameters[3].value]
    output = UTILS.getTextParameter(4, parameters)
    prop_score_cal_method = UTILS.getTextParameter(5, parameters)
    balancing_method = UTILS.getTextParameter(6, parameters)
    create_popups = parameters[7].value
    output_erf_table = UTILS.getTextParameter(8, parameters)
    if parameters[9].value is not None:
        target_outcome_vars = parameters[9].values
    else:
        target_outcome_vars = None
    if parameters[10].value is not None:
        target_exposure_vars = parameters[10].values
    else:
        target_exposure_vars = None
    expo_trim_quantile_lower = parameters[11].value
    expo_trim_quantile_upper = parameters[12].value
    propen_trim_quantile_lower = parameters[13].value
    propen_trim_quantile_upper = parameters[14].value
    expo_bins_num = parameters[15].value
    prop_expo_lamda = parameters[16].value
    balance_type = UTILS.getTextParameter(17, parameters)
    balance_threshold = parameters[18].value
    expo_resp_estimation_method = UTILS.getTextParameter(19, parameters)
    expo_resp_bandwidth = parameters[20].value
    create_erf_confidence_interval = parameters[21].value

    #### Apply execute field checker
    allFields = [outcome_field, expo_field] + [i[0] for i in conf_fields]
    desc = ARCPY.Describe(input)
    dataType = desc.dataType.upper()
    if dataType in ['SHAPEFILE', 'FEATURECLASS', 'FEATURELAYER']:
        checker = UTILS.ExecuteNewFieldTypeChecker(input, output, [i.upper() for i in allFields])

    cia = CausalInferenceAnalysis(
        input, outcome_field, expo_field, False, conf_fields, output,
        prop_score_cal_method=prop_score_cal_method,
        balancing_method=balancing_method,
        output_erf_table=output_erf_table,
        expo_trim_quantile_lower=expo_trim_quantile_lower,
        expo_trim_quantile_upper=expo_trim_quantile_upper,
        propen_trim_quantile_lower=propen_trim_quantile_lower,
        propen_trim_quantile_upper=propen_trim_quantile_upper,
        expo_bins_num=expo_bins_num,
        prop_expo_lamda=prop_expo_lamda,
        balance_type=balance_type,
        balance_threshold=balance_threshold,
        expo_resp_estimation_method=expo_resp_estimation_method,
        expo_resp_bandwidth=expo_resp_bandwidth,
        target_outcome_vars=target_outcome_vars,
        target_exposure_vars=target_exposure_vars,
        create_popups=create_popups,
        create_erf_confidence_interval=create_erf_confidence_interval)

    if not cia.could_solve:
        return
    cia.create_output()
    cia.build_output_symbology(4)
    parameters[4].charts = [cia.build_graphic_chart()]

    # try:
    #     project = ARCPY.mp.ArcGISProject('CURRENT')
    #     activeMap = project.activeMap
    #     cim_graphic_layer = cia.build_cim_graphic(activeMap)
    # except:
    #     pass
    # return

def postExecute(parameters):

    #### Update Pop-up titles ####
    try:
        input = UTILS.getTextParameter(0, parameters)
        outputFC = UTILS.getTextParameter(4, parameters)
        create_popups = parameters[7].value

        project = ARCPY.mp.ArcGISProject('CURRENT')
        activeMap = project.activeMap

        layerMainName = OS.path.basename(outputFC)
        layerMain = None
        nameFilter = layerMainName

        desc = ARCPY.Describe(input)
        dataType = desc.dataType.upper()
        if dataType in ['SHAPEFILE', 'FEATURECLASS', 'FEATURELAYER']:
            if len(activeMap.listLayers(nameFilter)) > 0:
                lc = activeMap.listLayers(nameFilter)[0]
                if OS.path.normpath(outputFC).removesuffix(".shp") == OS.path.normpath(lc.dataSource) or OS.path.normpath(outputFC).removesuffix(".shp").lower().startswith("memory\\"):
                    layerMain = lc
            if layerMain is None:
                nameFilter = f"*:{layerMainName}"
                if len(activeMap.listLayers(nameFilter)) > 0:
                    lc = activeMap.listLayers(nameFilter)[0]
                    if OS.path.normpath(outputFC).removesuffix(".shp") == OS.path.normpath(lc.dataSource):
                        layerMain = lc
        else:
            if len(activeMap.listTables(nameFilter)) > 0:
                lc = activeMap.listTables(nameFilter)[0]
                if OS.path.normpath(outputFC).removesuffix(".dbf") == OS.path.normpath(
                        lc.dataSource) or OS.path.normpath(
                    outputFC).removesuffix(".dbf").lower().startswith("memory\\"):
                    layerMain = lc

        if layerMain is not None:
            layerDef = layerMain.getDefinition('V3')
            for c in layerDef.charts:
                ARCPY.charts._openChartView(layerMain, c.name)
                break

        # cim_graphic_layer = _get_temp_file_path_cim_graphic_layer(outputFC)
        # layers_to_remove = []
        # for lyr in activeMap.listLayers():
        #     if lyr.isGraphicsLayer:
        #         df = lyr.getDefinition("V2")
        #         if df.sourceURI == outputFC.replace("\\", "/"):
        #             layers_to_remove.append(lyr)
        # for lyr in layers_to_remove:
        #     try:
        #         activeMap.removeLayer(lyr)
        #     except:
        #         pass
        # if OS.path.isfile(cim_graphic_layer):
        #     layer_graphic = activeMap.addDataFromPath(cim_graphic_layer)
        #     if layerMain is not None:
        #         activeMap.moveLayer(layerMain, layer_graphic, "BEFORE")
        #     OS.remove(cim_graphic_layer)
    except:
        pass


class WeightedCorr:
    """Calculate the weighted correlation of two continuous variables,
    source from https://github.com/matthijsz/weightedcorr"""
    def __init__(self, x, y, w=None):
        """
        Init function for the Weighted Correlation class
        Parameters
        ----------
        x           : NUM.array
        y           : NUM.array
        w           : (NUM.array or None), default=None
                      The weight array
        """
        self.x = x
        self.y = y
        if w is None:
            self.w = NUM.ones(len(self.x), dtype=float)
        else:
            self.w = w
        if len(self.x) != len(self.y) or len(self.y) != len(self.w):
            raise ValueError('Shapes of x, y, w are not the same!')

    def _wcov(self, x, y, ms):
        return NUM.sum(self.w * (x - ms[0]) * (y - ms[1]))

    def _pearson(self,x=None, y=None):
        x, y = (self.x, self.y) if ((x is None) and (y is None)) else (x, y)
        mx, my = (NUM.sum(i * self.w) / NUM.sum(self.w) for i in [x, y])
        return self._wcov(x, y, [mx, my]) / NUM.sqrt(self._wcov(x, x, [mx, mx]) * self._wcov(y, y, [my, my]))

    def _wrank(self, x):
        (unique, arr_inv, counts) = NUM.unique(rankdata(x), return_counts=True, return_inverse=True)
        a = NUM.bincount(arr_inv, self.w)
        return (NUM.cumsum(a) - a)[arr_inv]+((counts + 1)/2 * (a/counts))[arr_inv]

    def _spearman(self, x=None, y=None):
        x, y = (self.x, self.y) if ((x is None) and (y is None)) else (x, y)
        return self._pearson(self._wrank(x), self._wrank(y))

    def __call__(self, method='PEARSON'):
        """
        The execution method
        Parameters
        ----------
        method      : str, default = "PEARSON"
                      The Correlation method to be used: must belong to ["PEARSON", "SPEARMAN"]
                      'PEARSON' for pearson r, 'SPEARMAN' for spearman rank-order correlation.

        Returns
        -------
        float: The correlation value
        """
        if method.upper() not in ["PEARSON", "SPEARMAN"]:
            raise ValueError('Method not supported!')
        cor = {'PEARSON': self._pearson, 'SPEARMAN': self._spearman}[method.upper()]
        return cor()


def EtaCorrRaw(var_con, var_cat, w=None):
    """
    Calculate the weighted correlation between a continuous variable and a categorical variable
    References
    ----------
    https://en.wikipedia.org/wiki/Correlation_ratio
    http://www.discoveringstatistics.com/repository/eta_ebs.pdf
    Nonparametric Correlation: Eta Correlation (Multichotomous Nominal v Interval Variable)
    Parameters
    ----------
    var_con     : NUM.array
                  the continuous variable
    var_cat     : NUM.array
                  the categorical variable
    w           : (NUM.array or None), default=None
                  weight variable

    Returns
    -------

    """
    if len(var_con) != len(var_cat):
        ARCPY.AddError("Wrong input for EtaCorrRaw.")
        raise SyntaxError()
    if w is None:
        w = NUM.ones(len(var_cat), dtype=float)
    if len(var_con) != len(w):
        ARCPY.AddError("Wrong input for EtaCorrRaw.")
        raise SyntaxError()
    y_rank = var_con
    x_label = NUM.unique(var_cat)
    wy_avg_all = (w * y_rank).sum() / w.sum()
    SST_total = (w * ((y_rank - wy_avg_all) ** 2)).sum()
    wy_avg_cat = NUM.zeros(len(x_label), dtype=float)
    SST_be = 0
    # SST_in = 0
    for i, l in enumerate(x_label):
        inds = NUM.where(var_cat == l)[0]
        yc = y_rank[inds]
        wc = w[inds]
        w_sum = wc.sum()
        if w_sum > 0:
            wy_avg = (wc * yc).sum() / w_sum
            wy_avg_cat[i] = wy_avg
            SST_be += w_sum * ((wy_avg - wy_avg_all) ** 2)
            # SST_in += (wc * ((yc - wy_avg) ** 2)).sum()
    return NUM.sqrt(SST_be / SST_total)


def EtaCorrWeightedRank(var_con, var_cat, w=None):
    """
    Calculate the weighted correlation between a continuous variable and a categorical variable
    References
    ----------
    https://en.wikipedia.org/wiki/Correlation_ratio
    http://www.discoveringstatistics.com/repository/eta_ebs.pdf
    Nonparametric Correlation: Eta Correlation (Multichotomous Nominal v Interval Variable)
    Parameters
    ----------
    var_con     : NUM.array
                  the continuous variable
    var_cat     : NUM.array
                  the categorical variable
    w           : (NUM.array or None), default=None
                  weight variable

    Returns
    -------

    """
    if len(var_con) != len(var_cat):
        ARCPY.AddError("Wrong input for EtaCorrWeightedRank.")
        raise SyntaxError()
    if w is None:
        w = NUM.ones(len(var_cat), dtype=float)
    if len(var_con) != len(w):
        ARCPY.AddError("Wrong input for EtaCorrWeightedRank.")
        raise SyntaxError()

    # y_rank = STATS.rankdata(var_con, method="average")
    (unique, arr_inv, counts) = NUM.unique(rankdata(var_con), return_counts=True, return_inverse=True)
    a = NUM.bincount(arr_inv, w)
    y_rank = (NUM.cumsum(a) - a)[arr_inv]+((counts + 1)/2 * (a/counts))[arr_inv]

    x_label = NUM.unique(var_cat)
    wy_avg_all = (w * y_rank).sum() / w.sum()
    SST_total = (w * ((y_rank - wy_avg_all) ** 2)).sum()
    wy_avg_cat = NUM.zeros(len(x_label), dtype=float)
    SST_be = 0
    # SST_in = 0
    for i, l in enumerate(x_label):
        inds = NUM.where(var_cat == l)[0]
        yc = y_rank[inds]
        wc = w[inds]
        w_sum = wc.sum()
        if w_sum > 0:
            wy_avg = (wc * yc).sum() / w_sum
            wy_avg_cat[i] = wy_avg
            SST_be += w_sum * ((wy_avg - wy_avg_all) ** 2)
            # SST_in += (wc * ((yc - wy_avg) ** 2)).sum()

    # d1 = NUM.sqrt(SST_be / SST_total)
    # d2 = EtaCorrRaw(var_con, var_cat, w)
    # p = (d1-d2)/d2*100
    # ARCPY.AddMessage(f"diff: {d1-d2}, {'%.2f'%p}%")

    return NUM.sqrt(SST_be / SST_total)


def _newField(name, aliasName, type):
    f = ARCPY.Field()
    f.name = name
    f.aliasName = aliasName
    f.type = type
    return f


def buildOutputFCSchema(input, output, output_erf_table,
                        outcome_field, expo_field, conf_fields,
                        prop_score_cal_method, balancing_method,
                        target_outcome_vars, target_expo_vars):
    if not ARCPY.Exists(input):
        return None, None
    append_fields_main = []
    append_fields_table = None
    fields = ARCPY.ListFields(input)
    field_map = {f.name: f for f in fields}
    if outcome_field in field_map:
        f = field_map[outcome_field]
        append_fields_main.append(_newField(f.name, f.aliasName, f.type))
    if expo_field in field_map:
        f = field_map[expo_field]
        append_fields_main.append(_newField(f.name, f.aliasName, f.type))
    for f_obj in conf_fields:
        if f_obj[0] in field_map:
            f = field_map[f_obj[0]]
            append_fields_main.append(_newField(f.name, f.aliasName, f.type))
    append_fields_main.append(_newField("RECRD_USED", ARCPY.GetIDMessage(220700), "DOUBLE"))  # Record Included
    append_fields_main.append(_newField("PROPEN_SCO", ARCPY.GetIDMessage(220701), "LONG"))  # Propensity Score
    if balancing_method == "MATCHING":
        append_fields_main.append(_newField("FREQ_TABLE", ARCPY.GetIDMessage(220702), "LONG"))  # Matched Group Frequency Table
    else:
        append_fields_main.append(_newField("WEIGHT", ARCPY.GetIDMessage(220703), "DOUBLE"))  # Control Group Weight
    if target_outcome_vars is not None:
        for ind, tar_outcome in enumerate(target_outcome_vars):
            ind_str = str(ind + 1)
            vn = TargetOutcomeName[0: 10 - len(ind_str)] + ind_str
            va = TargetOutcomeAlias.format(tar_outcome)
            append_fields_main.append(_newField(vn, va, "DOUBLE"))
            vn = TargetOutcomeDiffName[0: 10 - len(ind_str)] + ind_str
            va = TargetOutcomeDiffAlias.format(tar_outcome)
            append_fields_main.append(_newField(vn, va, "DOUBLE"))
    if target_expo_vars is not None:
        for ind, tar_expo in enumerate(target_expo_vars):
            ind_str = str(ind + 1)
            vn = TargetExposureName[0: 10 - len(ind_str)] + ind_str
            va = TargetExposureAlias.format(tar_expo)
            append_fields_main.append(_newField(vn, va, "DOUBLE"))
            vn = TargetExposureDiffName[0: 10 - len(ind_str)] + ind_str
            va = TargetExposureDiffAlias.format(tar_expo)
            append_fields_main.append(_newField(vn, va, "DOUBLE"))

    if output_erf_table is not None:
        append_fields_table = []
        if expo_field in field_map:
            f = field_map[expo_field]
            append_fields_table.append(_newField("EXPOSURE", ARCPY.GetIDMessage(220704).format(f.aliasName), "DOUBLE"))  # Exposure ({0})
        if outcome_field in field_map:
            f = field_map[outcome_field]
            append_fields_table.append(_newField("RESPONSE", ARCPY.GetIDMessage(220705).format(f.aliasName), "DOUBLE"))  # Response ({0})
    return append_fields_main, append_fields_table

class AggrPointsSection:
    def __init__(self, level, x_min, x_max, y_min, y_max):
        self.level = level
        self.x_min = x_min
        self.x_max = x_max
        self.y_min = y_min
        self.y_max = y_max
        self.Xs = []
        self.Ys = []
        self.weights = []

    def n(self):
        return len(self.Xs)

    def aggregate(self):
        weight_sum = NUM.sum(self.weights)
        if weight_sum == 0:
            return NUM.mean(self.Xs), NUM.mean(self.Ys), 0
        else:
            return (NUM.average(self.Xs, weights=self.weights),
                    NUM.average(self.Ys, weights=self.weights),
                    weight_sum)

    def can_split(self):
        return self.n() >= 2

    def split(self):
        if self.n() < 2:
            return None

        x_mid = (self.x_min + self.x_max) / 2
        y_mid = (self.y_min + self.y_max) / 2
        aps_ll = AggrPointsSection(self.level + 1, self.x_min, x_mid, self.y_min, y_mid)
        aps_lr = AggrPointsSection(self.level + 1, x_mid, self.x_max, self.y_min, y_mid)
        aps_ul = AggrPointsSection(self.level + 1, self.x_min, x_mid, y_mid, self.y_max)
        aps_ur = AggrPointsSection(self.level + 1, x_mid, self.x_max, y_mid, self.y_max)
        for i in range(self.n()):
            x = self.Xs[i]
            y = self.Ys[i]
            w = self.weights[i]
            if x < x_mid:
                if y < y_mid:
                    aps_ll.Xs.append(x)
                    aps_ll.Ys.append(y)
                    aps_ll.weights.append(w)
                else:
                    aps_ul.Xs.append(x)
                    aps_ul.Ys.append(y)
                    aps_ul.weights.append(w)
            else:
                if y < y_mid:
                    aps_lr.Xs.append(x)
                    aps_lr.Ys.append(y)
                    aps_lr.weights.append(w)
                else:
                    aps_ur.Xs.append(x)
                    aps_ur.Ys.append(y)
                    aps_ur.weights.append(w)
        results = []
        if aps_ll.n() > 0:
            results.append(aps_ll)
        if aps_lr.n() > 0:
            results.append(aps_lr)
        if aps_ul.n() > 0:
            results.append(aps_ul)
        if aps_ur.n() > 0:
            results.append(aps_ur)

        return results


def _aggregate_points_for_html(Xs, Ys, weights, target_points_count=1000):
    """
    If there are too many points, this function will be used to aggregate them before generating the HTML Pop-ups
    Parameters
    ----------
    coords
    weights

    Returns
    -------

    """

    x_min = min(Xs)
    y_min = min(Ys)
    x_max = max(Xs)
    y_max = max(Ys)
    x_max += (x_max - x_min) / 1e8
    y_max += (y_max - y_min) / 1e8

    root_aps = AggrPointsSection(0, x_min, x_max, y_min, y_max)
    root_aps.Xs = Xs
    root_aps.Ys = Ys
    root_aps.weights = weights

    result_Xs = []
    result_Ys = []
    result_weights = []

    aps_list = [root_aps]
    while len(result_Xs) + len(aps_list) < target_points_count and len(aps_list) > 0:
        aps_list_new = []
        for aps in aps_list:
            if aps.can_split():
                aps_list_new.extend(aps.split())
            else:
                result_Xs.append(aps.Xs[0])
                result_Ys.append(aps.Ys[0])
                result_weights.append(aps.weights[0])
        aps_list = aps_list_new

    for aps in aps_list:
        x, y, w = aps.aggregate()
        result_Xs.append(x)
        result_Ys.append(y)
        result_weights.append(w)

    return NUM.array(result_Xs), NUM.array(result_Ys), NUM.array(result_weights)


class PropensityScoreCalculationMethod(IntEnum):
    REGRESSION = 0
    XG_BOOST = 1


class ControlGroupGeneratingMethod(IntEnum):
    MATCHING = 0
    WEIGHTING = 1


class ExposureResponseEstimationMethod(IntEnum):
    PLUG_IN = 0
    "local polynomial, using cross validation to select bandwidth"
    CV = 1
    "local polynomial, using plugin method to select bandwidth"
    MANUAL = 2
    "local polynomial, using the specific bandwidth provided by user"
    def __str__(self):
        if self == ExposureResponseEstimationMethod.PLUG_IN:
            return ARCPY.GetIDMessage(220706)  # "Plug-in"
        elif self == ExposureResponseEstimationMethod.CV:
            return ARCPY.GetIDMessage(220707)  # "Cross validation"
        elif self == ExposureResponseEstimationMethod.MANUAL:
            return ARCPY.GetIDMessage(220708)  # "Manual"
        else:
            return "Unknown"


class BalanceType(IntEnum):
    MEAN = 0
    MEDIAN = 1
    MAXIMUM = 2


class TransformerType(IntEnum):
    RAW = 0
    POWER2 = 1
    POWER3 = 2
    CUBE_ROOT = 3
    ABS = 4
    LOG = 5
    SQUARE_ROOT = 6


class ValueTransformer(object):
    def __init__(self, type:TransformerType):
        self.type = type

    def check_applicability(self, data: NUM.array):
        if self.type == TransformerType.LOG:
            return ~NUM.any(data <= 0)
        elif self.type == TransformerType.SQUARE_ROOT:
            return ~NUM.any(data < 0)
        elif self.type == TransformerType.ABS:
            return NUM.any(data < 0)
        elif self.type == TransformerType.POWER2:
            return ~NUM.any(data < 0)
        else:
            return True

    def transform(self, data):
        if self.type == TransformerType.RAW:
            return data
        elif self.type == TransformerType.POWER2:
            return NUM.power(data, 2)
        elif self.type == TransformerType.POWER3:
            return NUM.power(data, 3)
        elif self.type == TransformerType.CUBE_ROOT:
            return NUM.cbrt(data)
        elif self.type == TransformerType.ABS:
            return NUM.abs(data)
        elif self.type == TransformerType.LOG:
            return NUM.log(data)
        elif self.type == TransformerType.SQUARE_ROOT:
            return NUM.sqrt(data)
        else:
            ARCPY.AddError(f"Transformer type: ({self.type}) not implemented!")
            raise

    def __eq__(self, other):
        return isinstance(other, ValueTransformer) and other.type == self.type

    def __str__(self):
        template = "{}"
        if self.type == TransformerType.RAW:
            return template.format(ARCPY.GetIDMessage(220709))  # raw
        elif self.type == TransformerType.POWER2:
            return template.format(ARCPY.GetIDMessage(220710))  # square
        elif self.type == TransformerType.POWER3:
            return template.format(ARCPY.GetIDMessage(220711))   # cube
        elif self.type == TransformerType.CUBE_ROOT:
            return template.format(ARCPY.GetIDMessage(220712))  # cube root
        elif self.type == TransformerType.ABS:
            return template.format(ARCPY.GetIDMessage(220713))  # absolute
        elif self.type == TransformerType.LOG:
            return template.format(ARCPY.GetIDMessage(220714))  # logarithmic
        elif self.type == TransformerType.SQUARE_ROOT:
            return template.format(ARCPY.GetIDMessage(220715))  # square root
        else:
            return template.format("UNKNOWN")

    def __unicode__(self):
        return self.__str__()

    def __repr__(self):
        return self.__str__()

@dataclass
class InternalDataset:
    expo: NUM.ndarray
    "The exposure values"
    outcome: NUM.ndarray
    "The outcome values"
    gps: NUM.ndarray
    "The calculated Generalized Propensity Scores"
    var_expo_pred: NUM.ndarray
    expo_pred_resid_std: float or NUM.ndarray
    expo_range: tuple = (0, 0)
    outcome_range: tuple = (0, 0)
    gps_range: tuple = (0, 0)
    expo_standardized: NUM.ndarray = None
    outcome_standardized: NUM.ndarray = None
    gps_standardized: NUM.ndarray = None
    expo_pred_resid_std_valid_inds: NUM.ndarray = None
    weight_resid_kernel: STATS.gaussian_kde or STATSMODELS.nonparametric.KDEUnivariate = None
    weight_resid_kernel_bundle: dict = None

    def init(self, expo_pred_resid_std_valid_inds=None, weight_resid_kernel=None):
        self.expo_range = (NUM.min(self.expo), NUM.max(self.expo))
        self.outcome_range = (NUM.min(self.outcome), NUM.max(self.outcome))
        self.gps_range = (NUM.min(self.gps), NUM.max(self.gps))
        self.expo_standardized = (self.expo - self.expo_range[0]) / (self.expo_range[1] - self.expo_range[0])
        self.gps_standardized = (self.gps - self.gps_range[0]) / (self.gps_range[1] - self.gps_range[0])
        self.outcome_standardized = (self.outcome - self.outcome_range[0]) / (self.outcome_range[1] - self.outcome_range[0])
        self.expo_pred_resid_std_valid_inds = expo_pred_resid_std_valid_inds
        self.weight_resid_kernel = weight_resid_kernel

    def reverse_expo(self, data):
        return data * (self.expo_range[1] - self.expo_range[0]) + self.expo_range[0]

    def reverse_outcome(self, data):
        return data * (self.outcome_range[1] - self.outcome_range[0]) + self.outcome_range[0]


@dataclass
class OptimalBalancedControlGroup:
    frequency_table: NUM.ndarray
    correlations: list
    num_bin: int
    lamda: float
    target_corr_value: float
    achieved_balance_threshold: bool


@dataclass
class SampleData:
    var_expo: NUM.ndarray
    var_outcome: NUM.ndarray
    var_conf_cate: NUM.ndarray
    var_conf_cont: NUM.ndarray
    dummy_confounder_vars: NUM.ndarray
    n: int = 0
    result_optimal_balanced_ctrl_group: OptimalBalancedControlGroup = None
    internal_dataset: InternalDataset = None
    expo_bins_num: int = None
    could_solve: bool = True
    best_trans_combine: list = None
    data_before_propen_cal: dict = None
    best_xgboost_combine: dict = None
    result_erf_optimal_bandwidth: float = None
    result_erf_values: NUM.ndarray = None
    def init(self):
        self.n = len(self.var_expo)


class MonotoneSeq(object):
    def __init__(self, y_values, x_min, x_gap):
        self.x_min = x_min
        self.x_gap = x_gap
        self.n = len(y_values)
        self.x_max = x_min + x_gap * (self.n - 1)
        self.increasing = y_values[-1] > y_values[0]
        if self.increasing:
            self.y_values = y_values
        else:
            self.y_values = y_values[::-1]
        self.y_min = self.y_values[0]
        self.y_max = self.y_values[-1]

    def cal_x_by_y(self, y):
        if not self.contains_y(y):
            return None, None
        ind = NUM.searchsorted(self.y_values, y, side="right") - 1
        res_ind = float(ind)
        res_ind_equivalent = None
        if y == self.y_values[ind]:
            for j in range(ind - 1, -1, -1):
                if y == self.y_values[j]:
                    res_ind_equivalent = j
                else:
                    break
        else:
            y0 = self.y_values[ind]
            y1 = self.y_values[ind + 1]
            res_ind += (y - y0) / (y1 - y0)

        if self.increasing:
            x = self.x_min + res_ind * self.x_gap
        else:
            x = self.x_max - res_ind * self.x_gap
        if res_ind_equivalent is None:
            return x, None
        else:
            if self.increasing:
                x_equivalent = self.x_min + res_ind_equivalent * self.x_gap
            else:
                x_equivalent = self.x_max - res_ind_equivalent * self.x_gap
            return min(x, x_equivalent), max(x, x_equivalent)

    def contains_y(self, y):
        return self.y_min <= y <= self.y_max

    def __str__(self):
        return(str(self.y_values))


class BeadTracker(object):
    def __init__(self, y_values, x_min, x_max):
        """
        Init function for BeadTracker
        Parameters
        ----------
        y_values        : NUM.ndarry
                          The y values
        x_min           : float
        x_max           : float
        """
        self.y_values = y_values
        self.x_min = x_min
        self.num = len(y_values)
        self.x_max = x_max
        self.x_gap = (x_max - x_min) / (self.num - 1)
        self.y_min = min(y_values)
        self.y_max = max(y_values)
        self.m_seqs = []

        #### Process data and break them into Monotone Sequences ####
        direct_prev = 0
        y_prev = y_values[0]
        seq = [y_prev]
        ind_start = 0
        for ind in range(1, self.num):
            y = y_values[ind]
            if y > y_prev:
                direct = 1
            elif y == y_prev:
                direct = 0
            else:
                direct = -1

            if direct * direct_prev < 0:  # different direction, break here
                ms = MonotoneSeq(NUM.array(seq), x_min + ind_start * self.x_gap, self.x_gap)
                self.m_seqs.append(ms)
                seq = [y_prev]
                ind_start = ind - 1
                direct_prev = direct
            else:
                if direct_prev == 0:
                    direct_prev = direct
            seq.append(y)
            y_prev = y
        ms = MonotoneSeq(NUM.array(seq), x_min + ind_start * self.x_gap, self.x_gap)
        self.m_seqs.append(ms)
        self.seq_x0s = NUM.array([s.x_min for s in self.m_seqs])

    def cal_x_by_y(self, y, x0):
        if y < self.y_min or y > self.y_max:
            return None

        seq_ind_start = NUM.searchsorted(self.seq_x0s, x0, side='right') - 1
        if seq_ind_start < 0:
            seq_ind_start = 0
        x_equivalent_left = None
        x_equivalent_right = None
        res_x0, res_x1 = self.m_seqs[seq_ind_start].cal_x_by_y(y)
        if res_x1 is not None:
            if res_x0 <= x0 <= res_x1:
                return x0
            elif res_x1 < x0:
                x_equivalent_left = res_x1
            else:
                x_equivalent_right = res_x0
        elif res_x0 is not None:
            if res_x0 == x0:
                return x0
            elif res_x0 < x0:
                x_equivalent_left = res_x0
            else:
                x_equivalent_right = res_x0

        if x_equivalent_left is None:  # search to the left <--
            for seq_ind in range(seq_ind_start - 1, -1, -1):
                res_x0, res_x1 = self.m_seqs[seq_ind].cal_x_by_y(y)
                if res_x1 is not None:
                    x_equivalent_left = res_x1
                    break
                elif res_x0 is not None:
                    x_equivalent_left = res_x0
                    break
        if x_equivalent_right is None: # search to the right -->
            for seq_ind in range(seq_ind_start + 1, len(self.m_seqs)):
                res_x0, res_x1 = self.m_seqs[seq_ind].cal_x_by_y(y)
                if res_x0 is not None:
                    x_equivalent_right = res_x0
                    break
        if x_equivalent_left is not None and x_equivalent_right is not None:
            if (x0 - x_equivalent_left) <= (x_equivalent_right - x0):
                return x_equivalent_left
            else:
                return x_equivalent_right
        elif x_equivalent_left is not None:
            return x_equivalent_left
        elif x_equivalent_right is not None:
            return x_equivalent_right
        else:
            return None

    def cal_y_by_x(self, x):
        if x < self.x_min or x > self.x_max:
            return None
        ind = (x - self.x_min) / self.x_gap
        ind_a = int(ind)
        if ind_a == self.num -1:
            return self.y_values[ind_a]
        ind_b = ind - ind_a
        return self.y_values[ind_a] + (self.y_values[ind_a + 1] - self.y_values[ind_a]) * ind_b

    def cal_all_x_by_y(self, y):
        res = []
        for seq in self.m_seqs:
            x0, x1 = seq.cal_x_by_y(y)
            if x0 is not None:
                res.append(x0)
            if x1 is not None:
                res.append(x1)
        return res


class CausalInferenceAnalysis:
    """
    Spatial Stats Causal Inference Analysis Class
    """
    def __init__(self,
                 input,
                 outcome_field,
                 expo_field,
                 expo_is_binary,
                 conf_fields,
                 output,
                 prop_score_cal_method="REGRESSION",
                 balancing_method="MATCHING",
                 output_erf_table=None,
                 expo_trim_quantile_lower=0.01,
                 expo_trim_quantile_upper=0.99,
                 propen_trim_quantile_lower=0.0,
                 propen_trim_quantile_upper=1.0,
                 expo_bins_num=None,
                 prop_expo_lamda=None,
                 balance_type="MEAN",
                 balance_threshold=0.1,
                 balancing_attempt_num=5,
                 expo_resp_estimation_method="PLUG_IN",
                 expo_resp_bandwidth=None,
                 target_outcome_vars=None,
                 target_exposure_vars=None,
                 create_popups=False,
                 create_erf_confidence_interval=False):
        """

        Parameters
        ----------
        input                       : str
        outcome_field               : str
        expo_field                  : str
        expo_is_binary              : bool
        conf_fields                 : list of (str, bool)
        output                      : str
        prop_score_cal_method       : {"REGRESSION", "MACHINE_LEARNING"}, optional
        balancing_method    : {"MATCHING", "WEIGHTING"}, optional
        output_erf_table            : str or None, optional
        expo_trim_quantile_lower    : float, optional
                                      should be in the range of [0.01, 0.99]
        expo_trim_quantile_upper    : float, optional
                                      should be in the range of [0.01, 0.99], should be greater than expo_trim_quantile_lower
        expo_bins_num               : int or None
        prop_expo_lamda             : float or None, optional
                                      if provided, should be in the range of [0.0, 1.0]
        balance_type                : {"MEAN", "MEDIAN", "MAXIMUM"}, optional
        balance_threshold           : float
                                      should be in the range of [0.001, 0.3]
        balancing_attempt_num        : int, optional
                                      the maximum number of attempts for confounder balancing,
                                      should be in the range of [1, 50]
        expo_resp_estimation_method : {"PLUG_IN", "CV", "MANUAL"}, optional
        expo_resp_bandwidth         : float, optional


        """
        self.could_solve = True
        self.input = input
        self.field_outcome = outcome_field
        self.field_expo = expo_field
        self.field_expo_is_binary = expo_is_binary
        self.field_info_confounders = conf_fields
        self.result_erf_optimal_bandwidth = expo_resp_bandwidth
        self.output = output
        self.create_popups = create_popups
        self.create_erf_confidence_interval = create_erf_confidence_interval

        if prop_score_cal_method.upper() == "REGRESSION":
            self.prop_score_cal_method = PropensityScoreCalculationMethod.REGRESSION
        else:
            self.prop_score_cal_method = PropensityScoreCalculationMethod.XG_BOOST

        if balancing_method.upper() == "MATCHING":
            self.balancing_method = ControlGroupGeneratingMethod.MATCHING
        else:
            self.balancing_method = ControlGroupGeneratingMethod.WEIGHTING

        if expo_resp_estimation_method.upper() == "PLUG_IN":
            self.expo_resp_estimation_method = ExposureResponseEstimationMethod.PLUG_IN
        elif expo_resp_estimation_method.upper() == "CV":
            self.expo_resp_estimation_method = ExposureResponseEstimationMethod.CV
        else:
            self.expo_resp_estimation_method = ExposureResponseEstimationMethod.MANUAL
            if self.result_erf_optimal_bandwidth is None or self.result_erf_optimal_bandwidth <= 0:
                ARCPY.AddError("Wrong bandwidth value is provided for ERF estimation.")
                self.could_solve = False
                return

        self.output_erf_table = output_erf_table

        self.expo_trim_quantile_lower = 0.0 if expo_trim_quantile_lower is None else expo_trim_quantile_lower
        self.expo_trim_quantile_upper = 1.0 if expo_trim_quantile_upper is None else expo_trim_quantile_upper
        self.propen_trim_quantile_lower = 0.0 if propen_trim_quantile_lower is None else propen_trim_quantile_lower
        self.propen_trim_quantile_upper = 1.0 if propen_trim_quantile_upper is None else propen_trim_quantile_upper

        self.expo_bins_num = expo_bins_num
        self.prop_expo_lamda = prop_expo_lamda

        if target_outcome_vars is None:
            self.target_outcome_vars = []
        else:
            self.target_outcome_vars = target_outcome_vars
        if target_exposure_vars is None:
            self.target_exposure_vars = []
        else:
            self.target_exposure_vars = target_exposure_vars
        self.result_target_outcome_matches = []
        self.result_target_exposure_matches = []
        self.result_global_target_outcome_matches = []
        self.result_msg_matching_grid_search_results = None
        self.result_msg_transformation_balancing_results = None
        self.result_msg_gradient_boosting_balancing_results = None

        self.transformer_candidates = [
            ValueTransformer(TransformerType.POWER2),
            ValueTransformer(TransformerType.POWER3),
            ValueTransformer(TransformerType.CUBE_ROOT),
            # ValueTransformer(TransformerType.ABS),
            ValueTransformer(TransformerType.LOG),
            ValueTransformer(TransformerType.SQUARE_ROOT),
        ]

        if balance_type.upper() == "MEAN":
            self.balance_type = BalanceType.MEAN
        elif balance_type.upper() == "MEDIAN":
            self.balance_type = BalanceType.MEDIAN
        else:
            self.balance_type = BalanceType.MAXIMUM

        self.balance_threshold = balance_threshold
        self.balancing_attempt_num = balancing_attempt_num

        self.result_graph_erf_bw_search = None
        self.result_graph_erf = None
        self.result_erf_values = None
        self.result_erf_confidence_interval = None
        self.result_popup_global_string = ""
        """The dataset to store all the ERF confidence interval results \n
            column 0: grid exposure values \n
            column 1: lower bound of the confidence interval \n
            column 2: upper bound of the confidence interval \n
            column 3: lower bound of the confidence interval (before smoothing) \n
            column 4: upper bound of the confidence interval (before smoothing) \n
            column 5: number of valid samples (need to convert to integer) \n
            column 6: standard deviation of the erf values (scaled by sqrt(m/n)) \n
        """
        if GLOBAL_ETA_USE_WEIGHTED_RANK:
            self.EtaCorr = EtaCorrWeightedRank
        else:
            self.EtaCorr = EtaCorrRaw

        self.bin_num_with_gap = set()
        "For some candidate bin_num, there is chance that data points won't fall into some of the bins. This variable records those non-perfect bin nums for later warning message"

        self.random_seed = UTILS.getRandomSeed()
        if self.random_seed == 0:
            self.random_seed = int(time.time() * 10000) % 9999

        self.__prepareData()
        self.__cal_covariates()
        self.internal_dataset = self.__calculate_propensity_score()
        if not self.internal_dataset:
            self.could_solve = False
            return
        self.result_optimal_balanced_ctrl_group = None
        if self.balancing_method == ControlGroupGeneratingMethod.MATCHING:
            self.__execute_gps_match()
        else:
            self.__execute_gps_weight()
        if not self.result_optimal_balanced_ctrl_group.achieved_balance_threshold and self.prop_score_cal_method != PropensityScoreCalculationMethod.XG_BOOST and self.k_cont > 0:
            self.__execute_confounders_transform()

        if not self.result_optimal_balanced_ctrl_group.achieved_balance_threshold and self.prop_score_cal_method == PropensityScoreCalculationMethod.XG_BOOST:
            self.__execute_xgboost_grid_search()

        if not self.result_optimal_balanced_ctrl_group.achieved_balance_threshold:
            self.could_solve = False
            self.__report()


            ARCPY.AddIDMessage("ERROR", 110518, ARCPY.GetIDMessage(220739).format(
                UTILS.formatValue(abs(self.__get_target_corr_val(self.original_corr_values)), "%0.4f"),
                UTILS.formatValue(self.result_optimal_balanced_ctrl_group.target_corr_value, "%0.4f"),
                UTILS.formatValue(self.balance_threshold, "%0.4f")))
            raise SystemExit()

        if len(self.bin_num_with_gap):
            if self.expo_bins_num is not None and self.prop_expo_lamda is not None:
                ARCPY.AddIDMessage("WARNING", 110537)  # At least one exposure bin has no values.

        self.__gen_erf_local_poly()
        if self.ssdo is not None and self.create_erf_confidence_interval:
            self.__cal_erf_confidence_interval()

        self.__execute_outcom_exposure_match()
        self.__report()

    def __prepareData(self):
        """
        Validate and prepare the dataset for later analysis
        Returns
        -------
        None
        """
        if self.field_expo_is_binary:
            ARCPY.AddError("The binary exposure method has not finished yet.")
            raise SystemExit()

        desc = ARCPY.Describe(self.input)
        data_type = desc.dataType.upper()
        var_names = [self.field_expo, self.field_outcome] + [f[0] for f in self.field_info_confounders]

        self.ssdo = None
        self.coords = None
        "The centroid coordinates of each feature"
        self.n = 0
        "number of records"
        self.k_tot = len(self.field_info_confounders)
        "Total number of confounder variables"
        self.var_conf_cont_inds = []
        for i, info in enumerate(self.field_info_confounders):
            if not info[1]:
                self.var_conf_cont_inds.append(i)
        self.k_cont = len(self.var_conf_cont_inds)
        "Number of continuous confounder variables"
        self.k_cate = self.k_tot - self.k_cont
        "Number of categorical confounder variables"

        self.var_outcome = None
        "outcome values"
        self.var_expo = None
        "exposure values"
        self.var_conf_cont = None
        "continuous confounder values"
        self.var_conf_cate = None
        "categorical confounder values"

        self.alias_name_expo = ""
        "alias name of the exposure field"
        self.alias_name_outcome = ""
        "alias name of the outcome field"

        if not desc.hasOID:
            # will not support iput table without objectid
            ARCPY.AddIDMessage("ERROR", 732, self.input, self.input)  # Invalid input: The input Related Table does not have an ObjectID field.
            raise SystemExit()

        self.ssdo = SSDO.SSDataObject(self.input, templateFC=self.output)
        var_names = [v.upper() for v in var_names]
        #### Populate SSDO with Data ####
        try:
            self.ssdo.obtainData(self.ssdo.oidName, var_names, minNumObs=30)
        except:
            raise SystemExit()

        self.n = self.ssdo.numObs

        self.var_outcome = self.ssdo.fields[self.field_outcome.upper()].returnDouble(replaceNullValues=True)
        self.alias_name_outcome = self.ssdo.fields[self.field_outcome.upper()].alias

        self.var_expo = self.ssdo.fields[self.field_expo.upper()].returnDouble(replaceNullValues=True)
        self.alias_name_expo = self.ssdo.fields[self.field_expo.upper()].alias

        if self.k_cont > 0:
            self.var_conf_cont = NUM.ones((self.n, self.k_cont), dtype=float)
        if self.k_cate > 0:
            self.var_conf_cate = NUM.ones((self.n, self.k_cate), dtype=int)

        step_cont = 0
        step_cate = 0
        fields_with_too_many_categories = []
        for column, variable_info in enumerate(self.field_info_confounders):
            variable = variable_info[0]
            if variable_info[1]:
                #### process categorical field ####
                varData = self.ssdo.fields[variable.upper()].data
                uni, int_cate = NUM.unique(varData, return_inverse=True)
                if len(uni) > 60:
                    fields_with_too_many_categories.append(self.ssdo.fields[variable.upper()].alias)
                self.var_conf_cate[:, step_cate] = int_cate
                step_cate += 1
            else:
                #### process continuous field ####
                self.var_conf_cont[:, step_cont] = self.ssdo.fields[variable.upper()].returnDouble(replaceNullValues=True)
                step_cont += 1

        if len(fields_with_too_many_categories) > 0:
            ARCPY.AddIDMessage("ERROR", 110192, ", ".join(fields_with_too_many_categories), 60)
            raise SystemExit()

        # Filter out null values
        none_inds = []
        none_inds += NUM.where(NUM.isnan(self.var_outcome))[0].tolist()
        none_inds += NUM.where(NUM.isnan(self.var_expo))[0].tolist()
        if self.k_cont > 0:
            for i in range(self.k_cont):
                none_inds += NUM.where(NUM.isnan(self.var_conf_cont[:, i]))[0].tolist()
        none_inds = set(none_inds)
        if len(none_inds) > 0:
            ARCPY.AddIDMessage("WARNING", 642, len(none_inds), self.ssdo.numObs)
            nids = list(none_inds)
            nids.sort()
            ARCPY.AddIDMessage("WARNING", 848, self.ssdo.oidName,", ".join([str(i) for i in nids[0: 30]]))
        valid_inds = NUM.array([i for i in range(self.n) if i not in none_inds], dtype=int)

        if self.ssdo.isTable:
            self.coords = None
        else:
            if self.ssdo.useChordal:
                self.coords = self.ssdo.spheroidCoords
            else:
                self.coords = self.ssdo.xyCoords

        #### Trim dataset according to exposure quantiles ####
        self.selected_inds = valid_inds
        "The indices of records after exposure quantile trimming"

        if self.expo_trim_quantile_lower > 0 or self.expo_trim_quantile_upper < 1:
            quantile_range = NUM.quantile(self.var_expo[valid_inds], [self.expo_trim_quantile_lower, self.expo_trim_quantile_upper])
            filtered_inds = NUM.where((self.var_expo >= quantile_range[0]) & (self.var_expo <= quantile_range[1]))[0]
            self.selected_inds = NUM.intersect1d(self.selected_inds, filtered_inds)

        self.original_n = self.n
        self.n = len(self.selected_inds)
        self.var_expo = self.var_expo[self.selected_inds]
        self.var_outcome = self.var_outcome[self.selected_inds]
        if self.var_conf_cont is not None:
            self.var_conf_cont = self.var_conf_cont[self.selected_inds]
        if self.var_conf_cate is not None:
            self.var_conf_cate = self.var_conf_cate[self.selected_inds]

        # Check consistent fields
        self.__check_consistent_fields()

        self.dummy_confounder_vars = self.__build_dummy_confounder_vars()

        self.data_before_propen_cal = {
            "n": self.n,
            "var_expo": self.var_expo.copy(),
            "var_outcome": self. var_outcome.copy(),
            "var_conf_cont": self.var_conf_cont.copy() if self.var_conf_cont is not None else None,
            "var_conf_cate": self.var_conf_cate.copy() if self.var_conf_cate is not None else None,
            "dummy_confounder_vars": self.dummy_confounder_vars.copy() if self.dummy_confounder_vars is not None else None,
            "selected_inds": NUM.arange(self.n) if self.selected_inds is None else self.selected_inds.copy()
        }

    def __check_consistent_fields(self):
        #### Assure that Variance is Larger than Zero ####
        zeroVarFields = []

        std = NUM.std(self.var_outcome)
        if NUM.isnan(std) or std <= 0.0:
            zeroVarFields.append(self.field_outcome)
        std = NUM.std(self.var_expo)
        if NUM.isnan(std) or std <= 0.0:
            zeroVarFields.append(self.field_expo)

        step_cont = 0
        step_cate = 0
        for column, variable_info in enumerate(self.field_info_confounders):
            variable = variable_info[0]
            if variable_info[1]:
                std = NUM.std(self.var_conf_cate[:, step_cate])
                if NUM.isnan(std) or std <= 0.0:
                    zeroVarFields.append(variable)
                step_cate += 1
            else:
                std = NUM.std(self.var_conf_cont[:, step_cont])
                if NUM.isnan(std) or std <= 0.0:
                    zeroVarFields.append(variable)
                step_cont += 1

        if len(zeroVarFields) > 0:
            ARCPY.AddIDMessage("ERROR", 1588, ", ".join(zeroVarFields))
            self.could_solve = False
            raise SystemExit()

    def __cal_covariates(self, sample=None):
        """
        Calculate the covariate values between exposure and confounders
        Returns
        -------

        """
        res = []
        step_cate = 0
        if sample is None:
            data = self
        else:
            data = sample
        for i, info in enumerate(self.field_info_confounders):
            if info[1]:
                # The confounder is categorical/binary
                res.append(self.EtaCorr(data.var_expo, data.var_conf_cate[:, step_cate], w=None))
                step_cate += 1
            else:
                # The confounder is continuous
                res.append(STATS.spearmanr(data.var_expo, b=data.var_conf_cont[:, i - step_cate]).correlation)
        if sample is None:
            self.original_corr_values = res
        else:
            return res

    def __filter_data_according_to_propensity(self, gps_score):
        """
        The propensity score calculated some times could be very small, this could affect the weights after weighting/matching
        This method is used to filter
        Returns
        -------
        NUM.array The filtered GPS score
        """
        quantile_range = NUM.quantile(gps_score, [self.propen_trim_quantile_lower, self.propen_trim_quantile_upper])
        selected_inds = NUM.where((gps_score >= max(quantile_range[0], 1e-12)) & (gps_score <= quantile_range[1]))[0]
        self.selected_inds = self.selected_inds[selected_inds]
        self.n = len(selected_inds)
        if self.n < 30:
            ARCPY.AddIDMessage("ERROR", 110524)
            raise SystemExit()
        self.var_expo = self.var_expo[selected_inds]
        self.var_outcome = self.var_outcome[selected_inds]
        if self.var_conf_cont is not None:
            self.var_conf_cont = self.var_conf_cont[selected_inds]
        if self.var_conf_cate is not None:
            self.var_conf_cate = self.var_conf_cate[selected_inds]
        if self.dummy_confounder_vars is not None:
            self.dummy_confounder_vars = self.dummy_confounder_vars[selected_inds]

        # Check consistent fields
        self.__check_consistent_fields()

        return gps_score[selected_inds].copy()

    def __build_dummy_confounder_vars(self):
        if self.k_cate <= 0:
            return None
        cate_maxs = []
        for i in range(self.k_cate):
            unique = NUM.unique(self.var_conf_cate[:, i])
            cate_maxs.append(max(unique))

        dummy = NUM.zeros((self.n, sum(cate_maxs)), dtype=int)
        start_col = 0
        for i, m in enumerate(cate_maxs):
            data = self.var_conf_cate[:, i]
            for n in range(self.n):
                if data[n] < m:
                    dummy[n, start_col + data[n]] = 1
            start_col += m
        return dummy

    def __calculate_propensity_score(self, var_conf=None, xgb_spec_param=None, sample=None):
        if sample is None:
            #### Reset the dataset ####
            self.n = self.data_before_propen_cal["n"]
            self.var_expo = self.data_before_propen_cal["var_expo"].copy()
            self.var_outcome = self.data_before_propen_cal["var_outcome"].copy()
            if self.var_conf_cont is not None:
                self.var_conf_cont = self.data_before_propen_cal["var_conf_cont"].copy()
            if self.var_conf_cate is not None:
                self.var_conf_cate = self.data_before_propen_cal["var_conf_cate"].copy()
            if self.dummy_confounder_vars is not None:
                self.dummy_confounder_vars = self.data_before_propen_cal["dummy_confounder_vars"].copy()
            self.selected_inds = self.data_before_propen_cal["selected_inds"].copy()
            data = self
            #### End reset ####
        else:
            data = sample

        if var_conf is None:
            do_transform = False
            var_conf = data.var_conf_cont
        else:
            do_transform = True
        # expo_range = (NUM.min(data.var_expo), NUM.max(data.var_expo))
        if self.prop_score_cal_method == PropensityScoreCalculationMethod.REGRESSION:
            if data.dummy_confounder_vars is None:
                col_ext = 0
            else:
                col_ext = data.dummy_confounder_vars.shape[1]
            var_conf_with_const = NUM.ones(
                (data.n, (0 if var_conf is None else var_conf.shape[1]) + 1 + col_ext), dtype=float)
            if var_conf is not None:
                var_conf_with_const[:, 1: var_conf.shape[1] + 1] = var_conf
            if data.dummy_confounder_vars is not None:
                var_conf_with_const[:, (0 if var_conf is None else var_conf.shape[1]) + 1:] = data.dummy_confounder_vars

            res = LINALG.lstsq(var_conf_with_const, data.var_expo)
            var_expo_pred = (var_conf_with_const * res[0]).sum(axis=1)
            expo_pred_resid_std = NUM.std(var_expo_pred - data.var_expo, ddof=1)
            weight_resid = (var_expo_pred - data.var_expo) / expo_pred_resid_std
            gps_score = STATS.norm.pdf(data.var_expo, loc=var_expo_pred, scale=expo_pred_resid_std)
            if sample is None:
                gps_score = self.__filter_data_according_to_propensity(gps_score)
            internal_dataset = InternalDataset(expo=data.var_expo.copy(),
                                               outcome=data.var_outcome.copy(),
                                               gps=gps_score,
                                               var_expo_pred=var_expo_pred,
                                               expo_pred_resid_std=expo_pred_resid_std)
            internal_dataset.init()
            return internal_dataset
        else:
            # prepare data
            x_data = NUM.zeros((data.n, self.k_tot), dtype=float)
            if self.k_cont > 0:
                x_data[:, 0: self.k_cont] = var_conf
            if self.k_cate > 0:
                x_data[:, self.k_cont:] = data.var_conf_cate

            type_vars = NUM.array([1] * self.k_cont + [2] * self.k_cate + [1])  # the last 1 means the continuous y type

            # The xgb_param could be adjusted if necessary
            xgb_param = NUM.array([
                0.3,            # rate 1.0
                0,              # place holder
                1.0,            # lamda
                0.0,              # gamma
                0,              # number of bins
                1               # place holder
            ])
            number_trees = 30
            if xgb_spec_param is not None:
                if "rate" in xgb_spec_param:
                    xgb_param[0] = xgb_spec_param["rate"]
                if "number_trees" in xgb_spec_param:
                    number_trees = xgb_spec_param["number_trees"]

            seed = self.random_seed

            if sample is None:
                msg_info = ARCPY.GetIDMessage(220716)  # "Executing Gradient Boosting..."
            else:
                msg_info = None

            xgb_output = ARC._ss.forest(
                x=x_data,
                y=data.var_expo,
                x_test=NUM.array([]),
                y_test=NUM.array([]),
                type_vars=type_vars,
                number_trees=number_trees,
                node_size=2,
                sample_size=100,
                model="",
                max_nodes=6,
                header='WriteModel',
                permute_vars=1,
                seed=seed,
                balance=0,
                uncertainty=0,
                classwt=xgb_param,
                msg_info=msg_info
            )
            if xgb_output is None:
                return None
            var_expo_pred = xgb_output[0]
            var_expo_pred = NUM.array(var_expo_pred)
            pred_resid = NUM.abs(data.var_expo - var_expo_pred)
            xgb_output2 = ARC._ss.forest(
                x=x_data,
                y=pred_resid,
                x_test=NUM.array([]),
                y_test=NUM.array([]),
                type_vars=type_vars,
                number_trees=number_trees,
                node_size=2,
                sample_size=100,
                model="",
                max_nodes=6,
                header='WriteModel',
                permute_vars=1,
                seed=seed,
                balance=0,
                uncertainty=0,
                classwt=xgb_param,
                msg_info=msg_info
            )
            if xgb_output2 is None:
                return None
            pred_resid_pred = xgb_output2[0]
            pred_resid_pred = NUM.array(pred_resid_pred)
            valid_inds = NUM.where(pred_resid_pred != 0)[0]  # remove zeros because they will be used as denominators
            weight_resid = (data.var_expo - var_expo_pred)[valid_inds] / pred_resid_pred[valid_inds]

            # kde = STATSMODELS.nonparametric.KDEUnivariate(weight_resid)  # Build kernel model
            # kde.fit(bw='silverman', cut=0)  # Estimate the densities using Silverman and cutting the kernel.
            # gps_valid = kde.evaluate(weight_resid)
            # gps_valid = self.__stats_model_kde_evaluate(kde, weight_resid)
            gps_valid, kde = self.__execute_kde_evaluate(
                weight_resid,
                use_scipy_kernel=sample is not None,
                show_progressor=not do_transform and sample is None)
            # # use the scipy kernel density method
            # kde = STATS.gaussian_kde(weight_resid, bw_method="silverman")  # use the default bw_method, could try "silverman" later
            # gps_valid = kde.evaluate(weight_resid)

            gps_score = NUM.zeros(data.n, dtype=float)
            gps_score[valid_inds] = gps_valid
            if sample is None:
                gps_score = self.__filter_data_according_to_propensity(gps_score)
            valid_inds = NUM.where(gps_score != 0)[0]
            internal_dataset = InternalDataset(expo=data.var_expo.copy(),
                                               outcome=data.var_outcome.copy(),
                                               gps=gps_score,
                                               var_expo_pred=var_expo_pred,
                                               expo_pred_resid_std=pred_resid_pred)

            internal_dataset.init(expo_pred_resid_std_valid_inds=valid_inds, weight_resid_kernel=kde)

            return internal_dataset

    def __execute_gps_match(self, export_grid_search_table=True, transformer_label="", header_label="", sample=None):
        messages = []
        if sample is None:
            data = self
        else:
            data = sample
            export_grid_search_table = False

        if data.expo_bins_num is not None and self.prop_expo_lamda is not None:
            #### Do the match directly ####
            msg_template = ARCPY.GetIDMessage(220717).format(transformer_label)  # f"Generating balanced control group{transformer_label}..."
            if data.n / data.expo_bins_num > 300:
                matching_fun = self.__execute_gps_match_with_param_V3
            else:
                matching_fun = self.__execute_gps_match_with_param_V2

            matched_dataset = matching_fun(
                data.expo_bins_num,
                lamda=self.prop_expo_lamda,
                msg=msg_template,
                sample=sample)
            if matched_dataset is None:
                data.could_solve = False
                return
            w = NUM.zeros(len(matched_dataset), dtype=float)
            w[:] = matched_dataset[:]
            adj_corr = []
            step_cate = 0
            for i, info in enumerate(self.field_info_confounders):
                if info[1]:
                    # The confounder is categorical/binary
                    adj_corr.append(self.EtaCorr(data.var_expo, data.var_conf_cate[:, step_cate], w=w))
                    step_cate += 1
                else:
                    # The confounder is continuous
                    adj_corr.append(abs(WeightedCorr(data.var_expo, data.var_conf_cont[:, i - step_cate], w)("SPEARMAN")))
            data.result_optimal_balanced_ctrl_group = OptimalBalancedControlGroup(
                frequency_table=matched_dataset,
                correlations=adj_corr,
                num_bin=data.expo_bins_num,
                lamda=self.prop_expo_lamda,
                target_corr_value=self.__get_target_corr_val(adj_corr),
                achieved_balance_threshold=self.__get_target_corr_val(adj_corr) <= self.balance_threshold)
        else:
            #### Find the optimal number of bins through grid search ####
            if data.expo_bins_num is None:
                bin_num_min = int(data.n ** (1/4))
                bin_num_max = int(data.n ** (1/3)) * 2
                target_cand_num = 10
                if (bin_num_max - bin_num_min) / 3 < target_cand_num:
                    cand_bin_nums = list(range(bin_num_min, bin_num_max, 3))
                else:
                    bin_size = int((bin_num_max - bin_num_min) / target_cand_num)
                    cand_bin_nums = list(range(bin_num_min, bin_num_max, bin_size))
            else:
                cand_bin_nums = [data.expo_bins_num]

            if self.prop_expo_lamda is None:
                cand_lamda = list(NUM.arange(0.0, 1.0, 0.2))
                if 1.0 not in cand_lamda:
                    cand_lamda.append(1.0)
            else:
                cand_lamda = [self.prop_expo_lamda]
            total_comb_num = len(cand_bin_nums) * len(cand_lamda)
            # Initialize the weight_resid_kernel_bundle here so it could be resued in the grid search and save time
            if data.internal_dataset.weight_resid_kernel is not None and data.internal_dataset.weight_resid_kernel_bundle is None and data.n * total_comb_num > GLOBAL_KDE_SAMPLING_NUM:
                l0 = (data.internal_dataset.expo_range[0] - data.internal_dataset.var_expo_pred)[data.internal_dataset.expo_pred_resid_std_valid_inds] / data.internal_dataset.expo_pred_resid_std[data.internal_dataset.expo_pred_resid_std_valid_inds]
                l1 = (data.internal_dataset.expo_range[1] - data.internal_dataset.var_expo_pred)[data.internal_dataset.expo_pred_resid_std_valid_inds] / data.internal_dataset.expo_pred_resid_std[data.internal_dataset.expo_pred_resid_std_valid_inds]
                v = [min(l0), max(l0), min(l1), max(l1)]
                v_range = [min(v), max(v)]
                data.internal_dataset.weight_resid_kernel_bundle = self.__prepare_kde_evaluate_samples(data.internal_dataset.weight_resid_kernel, v_range)

            if sample is None:
                msg_template = ARCPY.GetIDMessage(220718).format(transformer_label)  # f"Executing grid search to find the optimal balanced control group {transformer_label}..."
                ARCPY.SetProgressor("step", msg_template, 0, total_comb_num, 1)
            processed_ind = 0
            optimal_target_corr = 1e9
            corr_search_hist = []
            for bin_num in cand_bin_nums:
                if data.n / bin_num > 300:
                    matching_fun = self.__execute_gps_match_with_param_V3
                else:
                    matching_fun = self.__execute_gps_match_with_param_V2
                for lamda in cand_lamda:
                    processed_ind += 1
                    # ARCPY.AddMessage(f"---> Processing {processed_ind}/{total_comb_num}...")
                    if sample is None:
                        ARCPY.SetProgressorPosition()
                    matched_dataset = matching_fun(
                        bin_num, lamda, "", show_progress_bar=False, sample=sample)
                    if matched_dataset is None:
                        corr_search_hist += [None] * len(cand_lamda)
                        break
                    w = NUM.zeros(len(matched_dataset), dtype=float)
                    w[:] = matched_dataset[:]
                    adj_corr = []
                    step_cate = 0
                    for i, info in enumerate(self.field_info_confounders):
                        if info[1]:
                            # The confounder is categorical/binary
                            adj_corr.append(self.EtaCorr(data.var_expo, data.var_conf_cate[:, step_cate], w=w))
                            step_cate += 1
                        else:
                            # The confounder is continuous
                            adj_corr.append(abs(WeightedCorr(data.var_expo, data.var_conf_cont[:, i - step_cate], w)("SPEARMAN")))

                    target_corr = self.__get_target_corr_val(adj_corr)
                    if NUM.isnan(target_corr):
                        corr_search_hist.append(None)
                        continue
                    corr_search_hist.append(target_corr)
                    if optimal_target_corr > target_corr:
                        data.result_optimal_balanced_ctrl_group = OptimalBalancedControlGroup(
                            frequency_table=matched_dataset,
                            correlations=adj_corr,
                            num_bin=bin_num,
                            lamda=lamda,
                            target_corr_value=target_corr,
                            achieved_balance_threshold=target_corr<=self.balance_threshold)
                        optimal_target_corr = target_corr
            if data.result_optimal_balanced_ctrl_group is None:
                data.could_solve = False
                if sample is None:
                    ARCPY.AddIDMessage("ERROR", 120025, self.alias_name_expo)
                    raise SystemExit()
                return
            else:
                data.could_solve = True

            if sample is None:
                ARCPY.ResetProgressor()
            else:
                return

            # Export the grid search table:
            # header = f"Matching Grid Search Results{header_label}"
            header = ARCPY.GetIDMessage(220719)  # f"Matching Grid Search Results"
            rows = [[ARCPY.GetIDMessage(220720)] + [UTILS.formatValue(la, "%0.4f") for la in list(cand_lamda)]]  # "Bin Numbers \ Lamda Values"
            cell_ind = 0
            for bin_num in cand_bin_nums:
                if bin_num in self.bin_num_with_gap:
                    row = [f"{bin_num}[1]"]
                else:
                    row = [bin_num]
                for _ in cand_lamda:
                    if corr_search_hist[cell_ind] is None:
                        cell = "-"
                    else:
                        cell = UTILS.formatValue(corr_search_hist[cell_ind], "%0.4f")
                        if corr_search_hist[cell_ind] <= self.balance_threshold:
                            cell += "*"
                        if corr_search_hist[cell_ind] <= self.result_optimal_balanced_ctrl_group.target_corr_value:
                            cell = UTILS.buildTableCell(cell, bold=True)
                    row.append(cell)
                    cell_ind += 1
                rows.append(row)
            rows.append("EMPTY")
            balance_type_name = {
                0: ARCPY.GetIDMessage(84261),  # "Mean",
                1: ARCPY.GetIDMessage(84414),  # "Median",
                2: ARCPY.GetIDMessage(84413)  # "MAXIMUM"
            }[int(self.balance_type)]
            # footnote = [f"The balance type used for finding the optimal control group is {balance_type_name}."]
            footnote = []
            if len(self.bin_num_with_gap) > 0:
                footnote.append("[1] {0}".format(ARCPY.GetIDMessage(110537)))
            table = UTILS.outputTextTable(rows, justify=['left'] + ['right'] * (len(rows[0]) - 1),
                                          header=None, pad=1, colPad=3,
                                          titleFillToken="-",
                                          emptyFillToken="-", boldCols=[0],
                                          footnote=footnote,
                                          returnHTMLMsg=True)
            accordion_table = UTILS.outputAccordion(
                [table], title=header, titleLevel=5,expand=False, titleFillToken="*", returnHTMLMsg=True)

            if export_grid_search_table:
                self.result_msg_matching_grid_search_results = accordion_table
            else:
                return accordion_table

    def __execute_gps_match_with_param_V2(self, num_bin, lamda, msg=ARCPY.GetIDMessage(220721),  # "Calculating..."
                                          show_progress_bar=True, sample=None):
        if sample is None:
            data = self
        else:
            data = sample
            show_progress_bar = False

        expo_bin_width = (data.internal_dataset.expo_range[1] - data.internal_dataset.expo_range[0]) / num_bin
        half_bd = expo_bin_width / 2
        expo_bin_centers = NUM.array([(ind + 0.5) * expo_bin_width + data.internal_dataset.expo_range[0] for ind in range(num_bin)])
        matched_dataset_freq_table = NUM.zeros(data.n, dtype=int)

        if show_progress_bar:
            ARCPY.SetProgressor("step", msg, 0, len(expo_bin_centers), 1)

        for ind, center in enumerate(expo_bin_centers):
            range_0 = center - half_bd
            range_1 = center + half_bd
            if ind == num_bin - 1:
                range_1 += 1
            cand_record_inds = NUM.where((data.var_expo >= range_0) & (data.var_expo < range_1))[0]

            if len(cand_record_inds) == 0:
                if sample is None:
                    self.bin_num_with_gap.add(num_bin)
                continue
            if self.prop_score_cal_method == PropensityScoreCalculationMethod.REGRESSION:
                prob_to_loc_center = STATS.norm.pdf(center,
                                                    loc=data.internal_dataset.var_expo_pred,
                                                    scale=data.internal_dataset.expo_pred_resid_std)
            else:
                weight_resid_loc = (center - data.internal_dataset.var_expo_pred)[data.internal_dataset.expo_pred_resid_std_valid_inds] / data.internal_dataset.expo_pred_resid_std[data.internal_dataset.expo_pred_resid_std_valid_inds]

                # use the scipy kernel density method
                prob_valid, _ = self.__execute_kde_evaluate(weight_resid_loc,
                                                            kernel=data.internal_dataset.weight_resid_kernel,
                                                            show_progressor=False,
                                                            prepared_evaluate_bundle=data.internal_dataset.weight_resid_kernel_bundle)

                prob_to_loc_center = NUM.zeros(len(data.var_outcome), dtype=float)
                prob_to_loc_center[data.internal_dataset.expo_pred_resid_std_valid_inds] = prob_valid

            prob_to_loc_center_std = (prob_to_loc_center - data.internal_dataset.gps_range[0]) / (data.internal_dataset.gps_range[1] - data.internal_dataset.gps_range[0])
            loc_center_standardized = (center - data.internal_dataset.expo_range[0]) / (
                        data.internal_dataset.expo_range[1] - data.internal_dataset.expo_range[0])
            cand_expo_to_loc_center_dist = NUM.abs((1 - lamda) * (data.internal_dataset.expo_standardized[cand_record_inds] - loc_center_standardized))
            if show_progress_bar:
                ARCPY.SetProgressorPosition()

            # repocess the data chuck by chuck to avoid momery issue
            D = NUM.matmul(prob_to_loc_center_std.reshape(-1, 1), NUM.array([1.0] * len(cand_record_inds)).reshape(1, -1)) - data.internal_dataset.gps_standardized[cand_record_inds]
            D = NUM.abs(D) * lamda + cand_expo_to_loc_center_dist
            min_inds = NUM.argmin(D, axis=1)
            unique, counts = NUM.unique(cand_record_inds[min_inds], return_counts=True)
            matched_dataset_freq_table[unique] += counts

        if show_progress_bar:
            ARCPY.ResetProgressor()
        return matched_dataset_freq_table

    def __execute_gps_match_with_param_V3(self, num_bin, lamda, msg=ARCPY.GetIDMessage(220721),  # "Calculating..."
                                          show_progress_bar=True, sample=None):
        """
        Do the GPS matching by using kd-tree to speed up the process
        Parameters
        ----------
        num_bin
        lamda
        msg
        show_progress_bar
        sample

        Returns
        -------

        """
        if sample is None:
            data = self
        else:
            data = sample
            show_progress_bar = False

        expo_bin_width = (data.internal_dataset.expo_range[1] - data.internal_dataset.expo_range[0]) / num_bin
        half_bd = expo_bin_width / 2
        expo_bin_centers = NUM.array([(ind + 0.5) * expo_bin_width + data.internal_dataset.expo_range[0] for ind in range(num_bin)])
        matched_dataset_freq_table = NUM.zeros(data.n, dtype=int)

        if show_progress_bar:
            ARCPY.SetProgressor("step", msg, 0, len(expo_bin_centers), 1)

        for ind, center in enumerate(expo_bin_centers):
            range_0 = center - half_bd
            range_1 = center + half_bd
            if ind == num_bin - 1:
                range_1 += 1
            cand_record_inds = NUM.where((data.var_expo >= range_0) & (data.var_expo < range_1))[0]

            if len(cand_record_inds) == 0:
                # ARCPY.AddWarning(f"Processing num of bin: {num_bin}. No data set fall in the bin of {range_0} - {range_1}, will skip!")
                # return None
                if sample is None:
                    self.bin_num_with_gap.add(num_bin)
                continue

            pts_cand = NUM.zeros((len(cand_record_inds), 2), dtype=float)

            if self.prop_score_cal_method == PropensityScoreCalculationMethod.REGRESSION:
                prob_to_loc_center = STATS.norm.pdf(center,
                                                    loc=data.internal_dataset.var_expo_pred,
                                                    scale=data.internal_dataset.expo_pred_resid_std)
            else:
                weight_resid_loc = (center - data.internal_dataset.var_expo_pred)[data.internal_dataset.expo_pred_resid_std_valid_inds] / data.internal_dataset.expo_pred_resid_std[data.internal_dataset.expo_pred_resid_std_valid_inds]
                prob_valid, _ = self.__execute_kde_evaluate(weight_resid_loc,
                                                            kernel=data.internal_dataset.weight_resid_kernel,
                                                            show_progressor=False,
                                                            prepared_evaluate_bundle=data.internal_dataset.weight_resid_kernel_bundle)

                prob_to_loc_center = NUM.zeros(len(data.var_outcome), dtype=float)
                prob_to_loc_center[data.internal_dataset.expo_pred_resid_std_valid_inds] = prob_valid

            prob_to_loc_center_std = (prob_to_loc_center - data.internal_dataset.gps_range[0]) / (data.internal_dataset.gps_range[1] - data.internal_dataset.gps_range[0])
            loc_center_standardized = (center - data.internal_dataset.expo_range[0]) / (
                        data.internal_dataset.expo_range[1] - data.internal_dataset.expo_range[0])
            cand_expo_to_loc_center_dist = NUM.abs((1 - lamda) * (data.internal_dataset.expo_standardized[cand_record_inds] - loc_center_standardized))

            pts_all = NUM.zeros((prob_to_loc_center_std.shape[0], 2), dtype=float)
            pts_all[:, 0] = prob_to_loc_center_std * lamda
            pts_all[:, 1] = loc_center_standardized * (1 - lamda)
            pts_cand[:, 0] = data.internal_dataset.gps_standardized[cand_record_inds] * lamda
            pts_cand[:, 1] = data.internal_dataset.expo_standardized[cand_record_inds] * (1 - lamda)

            if show_progress_bar:
                ARCPY.SetProgressorPosition()

            kdTree = SCPS.cKDTree(pts_cand)
            info = kdTree.query(pts_all, k=1, p=1)
            neighs = NUM.asarray(info[1], dtype=NUM.int32)
            unique, counts = NUM.unique(cand_record_inds[neighs], return_counts=True)
            matched_dataset_freq_table[unique] += counts

        if show_progress_bar:
            ARCPY.ResetProgressor()
        return matched_dataset_freq_table

    def __execute_gps_weight(self, sample=None, show_progress_bar=True):
        if sample is None:
            data = self
        else:
            data = sample
        try:
            numerator, kde = self.__execute_kde_evaluate(data.internal_dataset.expo,
                                                         use_scipy_kernel=sample is not None,
                                                         show_progressor=show_progress_bar and sample is None)
        except:
            if sample is None:
                ARCPY.AddIDMessage("ERROR", 120025, self.alias_name_expo)
                raise SystemExit()
            else:
                sample.could_solve = False
                return
        balanced_weights = numerator / data.internal_dataset.gps

        adj_corr = []
        step_cate = 0
        for i, info in enumerate(self.field_info_confounders):
            if info[1]:
                # The confounder is categorical/binary
                adj_corr.append(self.EtaCorr(data.var_expo, data.var_conf_cate[:, step_cate], w=balanced_weights))
                step_cate += 1
            else:
                # The confounder is continuous
                adj_corr.append(abs(WeightedCorr(data.var_expo, data.var_conf_cont[:, i - step_cate], balanced_weights)("SPEARMAN")))
        data.result_optimal_balanced_ctrl_group = OptimalBalancedControlGroup(
            frequency_table=balanced_weights,
            correlations=adj_corr,
            num_bin=None,
            lamda=None,
            target_corr_value=self.__get_target_corr_val(adj_corr),
            achieved_balance_threshold=self.__get_target_corr_val(adj_corr) <= self.balance_threshold)

    def __gen_erf_local_poly(self, sample=None):
        """Generate the exposure-response function by using non-parametric (local polynomial regression) method"""
        if sample is None:
            data = self
        else:
            data = sample

        if self.expo_resp_estimation_method == ExposureResponseEstimationMethod.CV:
            expo_std_range = data.internal_dataset.expo_standardized.max() - data.internal_dataset.expo_standardized.min()
            x_filter = NUM.where(data.result_optimal_balanced_ctrl_group.frequency_table > 0)[0]
            gap_constrain = NUM.ediff1d(NUM.sort(data.internal_dataset.expo_standardized[x_filter])).max() * 1.1
            bw_range = [max(expo_std_range / 40, gap_constrain), expo_std_range / 5]

            if data.result_optimal_balanced_ctrl_group.num_bin is not None:
                bw_bottom = expo_std_range / data.result_optimal_balanced_ctrl_group.num_bin * 1.3
                if bw_bottom > bw_range[0]:
                    bw_range[0] = bw_bottom

            if bw_range[1] <= bw_range[0]:
                bw_range[1] = min(bw_range[0] * 3, max(expo_std_range / 2, bw_range[0] * 2))

            # Bandwidth selection for local polynomial regression
            model_cv = LPR.LocalPolynomialRegressionCV(
                X=data.internal_dataset.expo_standardized,
                y=data.internal_dataset.outcome_standardized,
                w=data.result_optimal_balanced_ctrl_group.frequency_table,
                kernel="gaussian_trim",
                n_sections=0,
                loss="MSE",
                sampling="random",
                local_poly_order=GLOBAL_LOCAL_POLY_ORDER,
                mute_progress=sample is not None)
            results = model_cv.bandwidth_cv(NUM.linspace(bw_range[0], bw_range[1], 10),
                                            allow_fine_search_cross_boundary=False)
            optimized_bandwidth = results['fine results']['h']
            data.result_erf_optimal_bandwidth = optimized_bandwidth * (
                        data.internal_dataset.expo_range[1] - data.internal_dataset.expo_range[0])

            # if sample is None:
            #     fig = plt.figure(figsize=GLOBAL_OUTPUT_FIG_SIZE)
            #     ax = fig.add_subplot(axes_class=Axes)
            #     ax.axes.axis["right"].set_visible(False)
            #     ax.axes.axis["top"].set_visible(False)
            #     plt.ioff()
            #     plt.plot(results["coarse results"]["bandwidths"] * (
            #                 self.internal_dataset.expo_range[1] - self.internal_dataset.expo_range[0]),
            #              results["coarse results"]["MSE"],
            #              label="coarse bandwidths")
            #     plt.plot(results["fine results"]["bandwidths"] * (
            #                 self.internal_dataset.expo_range[1] - self.internal_dataset.expo_range[0]),
            #              results["fine results"]["MSE"],
            #              label="fine bandwidths")
            #     plt.xlabel("Bandwidth")
            #     plt.ylabel("MSE")
            #     plt.legend()
            #     tmpfile = BytesIO()
            #     plt.savefig(tmpfile, format='png', bbox_inches='tight')
            #     plt.close(fig)
            #     encoded = base64.b64encode(tmpfile.getvalue()).decode('utf-8')
            #     self.result_graph_erf_bw_search = f'data:image/png;base64,{encoded}'

        elif self.expo_resp_estimation_method == ExposureResponseEstimationMethod.PLUG_IN:
            """
            Generate the exposure-responsefunction by using plug-in rule to select the optimal bandwidth,
            the use the non-parametric (local polynomial regression) method for fitting
            see: https://bookdown.org/egarpor/NP-UC3M/kre-i-bwd.html
            """
            x = data.internal_dataset.expo_standardized
            var_expo_poly4 = x[:, NUM.newaxis] ** [0, 1, 2, 3, 4]
            var_outcome_std = (data.var_outcome - data.var_outcome.min()) / (
                        data.var_outcome.max() - data.var_outcome.min())
            w = data.result_optimal_balanced_ctrl_group.frequency_table
            xw = var_expo_poly4 * NUM.sqrt(w[:, NUM.newaxis])
            yw = var_outcome_std * NUM.sqrt(w)
            p, res, rnk, s = LINALG.lstsq(xw, yw)
            dof = yw.shape[0] - xw.shape[1]
            expo_std_range = x.max() - x.min()
            int_sigma2_hat = expo_std_range * res / dof
            theta_22_hat = NUM.average((2 * p[2] + 6 * p[3] * x + 12 * p[4] * (x ** 2)) ** 2, weights=w)
            R_K = 0.5 / MATH.sqrt(MATH.pi)
            optimized_bandwidth = (R_K * int_sigma2_hat / theta_22_hat / x.shape[0]) ** 0.2

            x_filter = NUM.where(data.result_optimal_balanced_ctrl_group.frequency_table > 0)[0]
            gap_constrain = NUM.ediff1d(NUM.sort(x[x_filter])).max() * 1.1
            if optimized_bandwidth < gap_constrain:
                optimized_bandwidth = gap_constrain

            data.result_erf_optimal_bandwidth = optimized_bandwidth * (
                    data.internal_dataset.expo_range[1] - data.internal_dataset.expo_range[0])
        else:
            optimized_bandwidth = self.result_erf_optimal_bandwidth / (
                    self.internal_dataset.expo_range[1] - self.internal_dataset.expo_range[0])
            if sample is not None:
                sample.result_erf_optimal_bandwidth = self.result_erf_optimal_bandwidth

        model = LPR.LocalPolynomialRegression(
            X=data.internal_dataset.expo_standardized,
            y=data.internal_dataset.outcome_standardized,
            h=optimized_bandwidth,
            w=data.result_optimal_balanced_ctrl_group.frequency_table,
            kernel="gaussian_trim",
            gridsize=GLOBAL_ERF_INTERPOLATION_GRID_SIZE,
            local_poly_order=GLOBAL_LOCAL_POLY_ORDER,
            mute_progress=sample is not None)
        if sample is None:
            #### Calculate the fitting for global data ####
            try:
                results = model.fit((0, 1))
                self.result_erf_values = NUM.zeros((len(results["X"]), 2), dtype=float)
                self.result_erf_values[:, 0] = self.internal_dataset.reverse_expo(results["X"])
                self.result_erf_values[:, 1] = self.internal_dataset.reverse_outcome(results["fit"])
            except:
                if self.expo_resp_estimation_method == ExposureResponseEstimationMethod.PLUG_IN:
                    non_zero_inds = NUM.where(data.result_optimal_balanced_ctrl_group.frequency_table != 0)[0]
                    unique_expo = NUM.unique(data.internal_dataset.expo_standardized[non_zero_inds])
                    if len(unique_expo) < 5:
                        ARCPY.AddIDMessage("ERROR", 110525)
                raise SystemExit()
        else:
            expo_samples_original = NUM.linspace(self.internal_dataset.expo_range[0], self.internal_dataset.expo_range[1], GLOBAL_ERF_INTERPOLATION_GRID_SIZE)
            expo_samples_projected = (expo_samples_original - sample.internal_dataset.expo_range[0]) / (sample.internal_dataset.expo_range[1] - sample.internal_dataset.expo_range[0])
            valid_index = NUM.where((expo_samples_projected >= 0) & (expo_samples_projected <= 1))[0]
            results = model.fit(None, expo_samples_projected[valid_index])
            sample.result_erf_values = NUM.full(GLOBAL_ERF_INTERPOLATION_GRID_SIZE, NUM.nan, dtype=float)
            sample.result_erf_values[valid_index] = sample.internal_dataset.reverse_outcome(results["fit"])

    def __search_k_nearest_neighbor(self, nn):
        """
        cKDTree specific for use in the Causal Inference Analysis Class.
        Parameters
        ----------
        nn
        concept

        Returns
        -------

        """
        p = 2  # concept = "EUCLIDEAN"
        coords = self.coords[self.selected_inds, :]
        kdTree = SCPS.cKDTree(coords)
        info = kdTree.query(coords, k=nn, p=p)
        neighs = NUM.asarray(info[1], dtype=NUM.int32)
        return neighs

    def __prepare_kde_evaluate_samples(self, kernel, value_range):
        """
        Prepare the samples for kde evaluation.
        Parameters
        ----------
        kernel
        range

        Returns
        -------

        """
        # Prepare the samples for kde evaluation

        SIZE_LIMIT = GLOBAL_KDE_SAMPLING_NUM
        Xs = NUM.linspace(value_range[0], value_range[1], SIZE_LIMIT)
        if not isinstance(kernel, STATSMODELS.nonparametric.KDEUnivariate):
            Ys = kernel.evaluate(Xs)
        else:
            Ys = NUM.zeros(SIZE_LIMIT, dtype=float)
            for i, x in enumerate(Xs):
                Ys[i] = kernel.evaluate(x)
        result = {
            "kernel": kernel,
            "Xs": Xs,
            "Ys": Ys,
            "value_range": value_range,
            "gap": (value_range[1] - value_range[0]) / SIZE_LIMIT,
            "diff1d_Ys": NUM.ediff1d(Ys),
        }
        return result

    def __execute_kde_evaluate(self, estimate_values,
                               kernel=None, use_scipy_kernel=False, show_progressor=False,
                               prepared_evaluate_bundle=None):
        """
        Divide large dataset into small batches and calculate the kde estimate for each batch to avoid memory error.
        Parameters
        ----------
        data
        kernel
        Returns
        -------

        """
        n = len(estimate_values)

        if prepared_evaluate_bundle is not None:
            kernel = prepared_evaluate_bundle["kernel"]
            Xs = prepared_evaluate_bundle["Xs"]
            Ys = prepared_evaluate_bundle["Ys"]
            value_range = prepared_evaluate_bundle["value_range"]
            gap = prepared_evaluate_bundle["gap"]
            diff1d_Ys = prepared_evaluate_bundle["diff1d_Ys"]
            N_SAMPLE = len(Xs)

            results = NUM.zeros(n, dtype=float)
            inds = (estimate_values - value_range[0]) / gap
            inds_a = inds.astype(int)
            inds_b = inds - inds_a
            edge_inds = NUM.where(inds_a == (N_SAMPLE - 1))[0]
            results[edge_inds] = Ys[N_SAMPLE - 1]
            norm_inds = NUM.where(inds_a != (N_SAMPLE - 1))[0]
            results[norm_inds] = Ys[inds_a[norm_inds]] + diff1d_Ys[inds_a[norm_inds]] * inds_b[norm_inds]
            return results, kernel

        SIZE_LIMIT = 4000
        if kernel is None:
            if use_scipy_kernel:
                kernel = STATS.gaussian_kde(estimate_values, "silverman")
            else:
                kernel = STATSMODELS.nonparametric.KDEUnivariate(estimate_values)  # Build stats models kernel
                kernel.fit(bw='silverman', cut=0)  # Estimate the densities using Silverman and cutting the kernel.

        if n <= SIZE_LIMIT:
            if show_progressor:
                ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220722))  # "Evaluating Kernel Density..."
            results = kernel.evaluate(estimate_values)
            if show_progressor:
                ARCPY.ResetProgressor()
            return results, kernel
        else:
            # ARCPY.AddMessage("--- quick kde ---")
            estimate_values_range = [estimate_values.min(), estimate_values.max()]
            results = NUM.zeros(n, dtype=float)
            Xs = NUM.linspace(estimate_values_range[0], estimate_values_range[1], SIZE_LIMIT)
            if not isinstance(kernel, STATSMODELS.nonparametric.KDEUnivariate):
                if show_progressor:
                    ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220722))  # "Evaluating Kernel Density..."
                Ys = kernel.evaluate(Xs)
            else:
                if show_progressor:
                    ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220722), 0, SIZE_LIMIT, 1)  # "Evaluating Kernel Density..."
                Ys = NUM.zeros(SIZE_LIMIT, dtype=float)
                for i, x in enumerate(Xs):
                    Ys[i] = kernel.evaluate(x)
                    if show_progressor:
                        ARCPY.SetProgressorPosition()

            gap = Xs[1] - Xs[0]
            inds = (estimate_values - estimate_values_range[0]) / gap
            inds_a = inds.astype(int)
            inds_b = inds - inds_a
            edge_inds = NUM.where(inds_a == (SIZE_LIMIT - 1))[0]
            results[edge_inds] = Ys[SIZE_LIMIT - 1]
            norm_inds = NUM.where(inds_a != (SIZE_LIMIT - 1))[0]
            diff1d = NUM.ediff1d(Ys)
            results[norm_inds] = Ys[inds_a[norm_inds]] + diff1d[inds_a[norm_inds]] * inds_b[norm_inds]

            if show_progressor:
                ARCPY.ResetProgressor()
            return results, kernel

    def __cal_erf_confidence_interval(self):
        """
        Calculate the confidence interval of the exposure-response function by using bootstrap method
        Returns
        -------

        """
        m = math.ceil(2 * math.sqrt(self.n))
        if self.ssdo.isTable:
            population = NUM.arange(self.n)
            focal_num = 0
            neigh_info = None
        elif self.ssdo.shapeType.upper() in ["POLYGON", "POINT"]:
            "Number of patches/regions in each bootstrap sample"
            population = NUM.arange(self.n)
            nn = 9
            focal_num = math.ceil(m / nn)
            m = int(focal_num * nn)
            neigh_info = self.__search_k_nearest_neighbor(nn)
        else:
            return
        NUM.random.seed(self.random_seed)
        if self.balancing_method == ControlGroupGeneratingMethod.MATCHING:
            balancing_method = self.__execute_gps_match
        else:
            balancing_method = self.__execute_gps_weight

        total_success_count = 0
        success_count_after_transform = 0
        success_count_after_xgb_grid = 0

        self.result_bootstrap_total_record = NUM.zeros(self.n, dtype=NUM.int32)
        self.result_bootstrap_success_record = NUM.zeros(self.n, dtype=NUM.int32)

        LOOP_NUM = math.ceil(5 * math.sqrt(self.n))

        REF_EST_Collection = NUM.full((GLOBAL_ERF_INTERPOLATION_GRID_SIZE, LOOP_NUM), fill_value=NUM.nan, dtype=float)
        msg_template = ARCPY.GetIDMessage(220723)  # f"Calculating confidence interval for the exposure-response function..."
        ARCPY.SetProgressor("step", msg_template, 0, 100, 1)
        current_progress = 0
        total_run = 0
        MAX_ATTEMPT = min(math.ceil(25 * math.sqrt(self.n)), GLOBAL_BOOTSTRAP_SAMPLE_NUM)
        for step in range(MAX_ATTEMPT):
            if ARCPY.env.isCancelled:
                return
            total_run += 1

            if self.ssdo.isTable:
                sample_inds = NUM.random.choice(population, size=m, replace=True)
            else:
                focal_samples = NUM.random.choice(population, size=focal_num, replace=True)
                sample_inds = neigh_info[focal_samples, :].reshape(-1)

            unique_rate = len(set(sample_inds.tolist())) * 1.0 / len(sample_inds)
            sample_unique_inds, sample_unique_counts = NUM.unique(sample_inds, return_counts=True)
            self.result_bootstrap_total_record[sample_unique_inds] += sample_unique_counts

            #### Rerun the whole causal inference here with the sample data ####
            # >>>> prepare data
            if self.var_conf_cate is not None:
                sample_var_conf_cate = self.var_conf_cate[sample_inds, :]
            else:
                sample_var_conf_cate = None
            if self.var_conf_cont is not None:
                sample_var_conf_cont = self.var_conf_cont[sample_inds, :]
            else:
                sample_var_conf_cont = None
            if self.dummy_confounder_vars is not None:
                sample_dummy_confounder_vars = self.dummy_confounder_vars[sample_inds, :]
            else:
                sample_dummy_confounder_vars = None
            sample = SampleData(
                self.var_expo[sample_inds],
                self.var_outcome[sample_inds],
                sample_var_conf_cate, sample_var_conf_cont,
                sample_dummy_confounder_vars)
            sample.init()
            if self.expo_bins_num is not None:
                sample.expo_bins_num = self.expo_bins_num

            # >>>> calculate the covariate before balancing
            sample_covariates_raw = self.__cal_covariates(sample=sample)
            # >>> calculate the propensity score
            internal_dataset = self.__calculate_propensity_score(sample=sample)
            if not internal_dataset: # cannot solve
                continue
            sample.internal_dataset = internal_dataset
            # >>>> balance the sample
            balancing_method(sample=sample)

            if sample.result_optimal_balanced_ctrl_group is not None and not sample.result_optimal_balanced_ctrl_group.achieved_balance_threshold:
                if self.prop_score_cal_method != PropensityScoreCalculationMethod.XG_BOOST and self.k_cont > 0:
                    sample.data_before_propen_cal = {
                        "n": sample.n,
                        "var_expo": sample.var_expo.copy(),
                        "var_outcome": sample.var_outcome.copy(),
                        "var_conf_cont": sample.var_conf_cont.copy() if sample.var_conf_cont is not None else None,
                        "var_conf_cate": sample.var_conf_cate.copy() if sample.var_conf_cate is not None else None,
                        "dummy_confounder_vars": sample.dummy_confounder_vars.copy() if sample.dummy_confounder_vars is not None else None,
                        "selected_inds": NUM.arange(sample.n)
                    }

                    self.__execute_confounders_transform(sample=sample)
                    if sample.could_solve and sample.result_optimal_balanced_ctrl_group.achieved_balance_threshold:
                        success_count_after_transform += 1

                if self.prop_score_cal_method == PropensityScoreCalculationMethod.XG_BOOST:
                    self.__execute_xgboost_grid_search(sample=sample)
                    if sample.could_solve and sample.result_optimal_balanced_ctrl_group.achieved_balance_threshold:
                        success_count_after_xgb_grid += 1

            if not sample.could_solve or sample.result_optimal_balanced_ctrl_group is None:
                # ARCPY.AddError(f"Cannot solve the causal inference in bootstrap, seed = {self.random_seed}")
                continue

            if sample.could_solve and sample.result_optimal_balanced_ctrl_group is not None and sample.result_optimal_balanced_ctrl_group.achieved_balance_threshold:
                # >>>> generate the ERF for the sample data
                try:
                    self.__gen_erf_local_poly(sample=sample)
                except:
                    continue
                # self.__gen_erf_local_poly(sample=sample)
                REF_EST_Collection[:, total_success_count] = sample.result_erf_values
                total_success_count += 1
                self.result_bootstrap_success_record[sample_unique_inds] += sample_unique_counts
                if total_success_count >= LOOP_NUM:
                    break
            step1 = int(100.0 * step / MAX_ATTEMPT)
            step2 = int(100.0 * total_success_count/LOOP_NUM)
            if max(step1, step2) > current_progress:
                current_progress = max(step1, step2)
                ARCPY.SetProgressorPosition(current_progress)

        ARCPY.ResetProgressor()

        if total_success_count < LOOP_NUM:
            ARCPY.AddIDMessage("WARNING", 110519)
            if GLOBAL_EXPORT_BOOTSTRAP_SAMPLE_ERFS:
                ERF_EST_MSG_Collection = ["============ ERF confidence interval calculation summary ============"]
                # ARCPY.AddMessage(f"Finish calculating the confidence interval for the exposure-response function")
                ERF_EST_MSG_Collection.append(f"Target bootstrap loop number: {LOOP_NUM}")
                ERF_EST_MSG_Collection.append(f"Bootstrap sample size: {m}")
                ERF_EST_MSG_Collection.append(f"Total success count is {total_success_count}")
                ERF_EST_MSG_Collection.append(f"Total bootstrap run is {total_run}")
                if self.prop_score_cal_method != PropensityScoreCalculationMethod.XG_BOOST and self.k_cont > 0:
                    ERF_EST_MSG_Collection.append(f"Success count after transforming {success_count_after_transform}")
                if self.prop_score_cal_method == PropensityScoreCalculationMethod.XG_BOOST:
                    ERF_EST_MSG_Collection.append(f"Success count after xgb grid search {success_count_after_xgb_grid}")
                ERF_EST_MSG_Collection.append(f"Random seed used for sampling is {self.random_seed}")
                ERF_EST_MSG_Collection.append(f"=" * len(ERF_EST_MSG_Collection[0]))
                for msg in ERF_EST_MSG_Collection:
                    ARCPY.AddMessage(msg)
            return

        self.REF_EST_Collection = REF_EST_Collection

        # >>> Start building the confidence interval for each step
        res_intervals = NUM.full(GLOBAL_ERF_INTERPOLATION_GRID_SIZE, NUM.nan, dtype=float)
        self.result_erf_confidence_interval = NUM.full((GLOBAL_ERF_INTERPOLATION_GRID_SIZE, 7), NUM.nan, dtype=float)
        self.result_erf_confidence_interval[:, 0] = self.result_erf_values[:, 0]
        for step in range(REF_EST_Collection.shape[0]):
            values = REF_EST_Collection[step, ]
            valid_count = NUM.count_nonzero(~NUM.isnan(values))
            self.result_erf_confidence_interval[step, 5] = valid_count
            if valid_count < 2:
                continue
            values = values[NUM.where(~NUM.isnan(values))]
            std_var_scaled = NUM.sqrt(NUM.var(values, ddof=0) * m / self.n)
            interval = STATS.t.ppf(1 - 0.05/2, valid_count - 1) * std_var_scaled
            res_intervals[step] = interval
            self.result_erf_confidence_interval[step, 3] = self.result_erf_values[step, 1] - interval
            self.result_erf_confidence_interval[step, 4] = self.result_erf_values[step, 1] + interval

        # >>>> Smooth the standard deviations through local polynomial regression
        valid_index = NUM.where(~NUM.isnan(res_intervals))[0]
        x_orgin = self.result_erf_values[:, 0][valid_index]
        x_range = [NUM.min(x_orgin), NUM.max(x_orgin)]
        x = (x_orgin - x_range[0]) / (x_range[1] - x_range[0])
        var_expo_poly4 = x[:, NUM.newaxis] ** [0, 1, 2, 3, 4]
        var_intervals = res_intervals[valid_index]
        var_intervals_range = [NUM.min(var_intervals), NUM.max(var_intervals)]
        var_intervals_std = (var_intervals - var_intervals_range[0]) / (var_intervals_range[1] - var_intervals_range[0])
        w = NUM.full(len(x), 1, dtype=float)
        xw = var_expo_poly4 * NUM.sqrt(w[:, NUM.newaxis])
        yw = var_intervals_std * NUM.sqrt(w)
        p, res, rnk, s = LINALG.lstsq(xw, yw)
        dof = yw.shape[0] - xw.shape[1]
        expo_std_range = x.max() - x.min()
        int_sigma2_hat = expo_std_range * res / dof
        theta_22_hat = NUM.average((2 * p[2] + 6 * p[3] * x + 12 * p[4] * (x ** 2)) ** 2, weights=w)
        R_K = 0.5 / MATH.sqrt(MATH.pi)
        optimized_bandwidth = (R_K * int_sigma2_hat / theta_22_hat / x.shape[0]) ** 0.2
        gap_constrain = 1.0 / GLOBAL_ERF_INTERPOLATION_GRID_SIZE * 1.1
        if optimized_bandwidth < gap_constrain:
            optimized_bandwidth = gap_constrain
        optimal_bandwidth_rev = optimized_bandwidth * (x_range[1] - x_range[0])
        model = LPR.LocalPolynomialRegression(
            X=x,
            y=var_intervals_std,
            h=optimized_bandwidth,
            w=w,
            kernel="gaussian_trim",
            gridsize=GLOBAL_ERF_INTERPOLATION_GRID_SIZE,
            local_poly_order=GLOBAL_LOCAL_POLY_ORDER,
            mute_progress=True)
        results = model.fit(None, NUM.linspace(0, 1, valid_index[-1] - valid_index[0] + 1))
        smoothed_intervals = results["fit"] * (var_intervals_range[1] - var_intervals_range[0]) + var_intervals_range[0]
        ind_start = valid_index[0]
        ind_end = valid_index[-1] + 1
        self.result_erf_confidence_interval[ind_start: ind_end, 1] = self.result_erf_values[ind_start: ind_end, 1] - smoothed_intervals
        self.result_erf_confidence_interval[ind_start: ind_end, 2] = self.result_erf_values[ind_start: ind_end, 1] + smoothed_intervals
        for ind in range(ind_start, ind_end):
            self.result_erf_confidence_interval[ind, 6] = smoothed_intervals[ind - ind_start] / STATS.t.ppf(
                1 - 0.05 / 2, int(self.result_erf_confidence_interval[ind, 5]) - 1)

        # self.result_erf_confidence_interval = self.result_erf_confidence_interval[valid_index, :]

        ERF_EST_MSG_Collection = ["============ ERF confidence interval calculation summary ============"]
        # ARCPY.AddMessage(f"Finish calculating the confidence interval for the exposure-response function")
        ERF_EST_MSG_Collection.append(f"Target bootstrap loop number: {LOOP_NUM}")
        ERF_EST_MSG_Collection.append(f"Bootstrap sample size: {m}")
        ERF_EST_MSG_Collection.append(f"Total success count is {total_success_count}")
        ERF_EST_MSG_Collection.append(f"Total bootstrap run is {total_run}")
        if self.prop_score_cal_method != PropensityScoreCalculationMethod.XG_BOOST and self.k_cont > 0:
            ERF_EST_MSG_Collection.append(f"Success count after transforming {success_count_after_transform}")
        if self.prop_score_cal_method == PropensityScoreCalculationMethod.XG_BOOST:
            ERF_EST_MSG_Collection.append(f"Success count after xgb grid search {success_count_after_xgb_grid}")
        ERF_EST_MSG_Collection.append(f"Total valid points in ERF confidence intervals: {len(valid_index)} of {GLOBAL_ERF_INTERPOLATION_GRID_SIZE}")
        ERF_EST_MSG_Collection.append(f"Random seed used for sampling is {self.random_seed}")
        ERF_EST_MSG_Collection.append(f"Optimal bandwidth used for standard deviation smoothing is {optimal_bandwidth_rev:.4f}")
        ERF_EST_MSG_Collection.append(f"=" * len(ERF_EST_MSG_Collection[0]))
        self.ERF_EST_MSG_Collection = ERF_EST_MSG_Collection

    def __report(self):
        #### Build the trimming results table ####
        header = ARCPY.GetIDMessage(220724)  # "Trimming Results"
        rows = [[ARCPY.GetIDMessage(220725), self.original_n],  # "Original number of records"
                [ARCPY.GetIDMessage(220726), self.original_n - self.data_before_propen_cal['n']],  # "Number of records removed by exposure trimming"
                [ARCPY.GetIDMessage(220727), self.data_before_propen_cal['n'] - self.n],  # "Number of records removed by propensity score trimming"
                [ARCPY.GetIDMessage(220728), self.n]]  # "Final number of records"
        table = UTILS.outputTextTable(rows, justify=['left'] + ['right'] * (len(rows[0]) - 1),
                                      header=None, pad=1, colPad=3,
                                      titleFillToken="-",
                                      emptyFillToken="-",
                                      emphasizeHeadRow=False,
                                      returnHTMLMsg=True)
        accordion = UTILS.outputAccordion([table], title=header, titleLevel=5,
                                          expand=False, titleFillToken="*")
        ARCPY.AddMessage(accordion)

        if self.result_msg_gradient_boosting_balancing_results is not None:
            ARCPY.AddMessage(self.result_msg_gradient_boosting_balancing_results)

        if self.result_msg_matching_grid_search_results is not None:
            ARCPY.AddMessage(self.result_msg_matching_grid_search_results)

        if self.result_msg_transformation_balancing_results is not None:
            ARCPY.AddMessage(self.result_msg_transformation_balancing_results)

        #### Build the Optimal Parameters Table ####
        rows = []
        if self.balancing_method == ControlGroupGeneratingMethod.MATCHING:
            _num_bin = self.result_optimal_balanced_ctrl_group.num_bin
            expo_bin_width = (self.internal_dataset.expo_range[1] - self.internal_dataset.expo_range[0]) / _num_bin
            rows.append([ARCPY.GetIDMessage(220729), _num_bin])  # "Number of exposure bins"
            rows.append([ARCPY.GetIDMessage(220730), _ff(expo_bin_width, 4)])  # "Bin width"
            rows.append([ARCPY.GetIDMessage(220731), _ff(self.result_optimal_balanced_ctrl_group.lamda, 4)])  # "Relative weight of propensity score to exposure"
        if self.prop_score_cal_method == PropensityScoreCalculationMethod.XG_BOOST:
            if not hasattr(self, "best_xgboost_combine"):
                self.best_xgboost_combine = {
                    "number_trees": 30,
                    "rate": 0.3
                }
            rows.append([ARCPY.GetIDMessage(220732), self.best_xgboost_combine["number_trees"]])  # "Number of trees"
            rows.append([ARCPY.GetIDMessage(220733), _ff(self.best_xgboost_combine["rate"], 4)])  # "Learning rate"
            if self.prop_score_cal_method == PropensityScoreCalculationMethod.XG_BOOST or self.create_erf_confidence_interval:
                rows.append([ARCPY.GetIDMessage(220734), self.random_seed])  # "Random seed used"

        if len(rows):
            header = ARCPY.GetIDMessage(220735)  # "Parameters Resulting in Best Balance"
            table = UTILS.outputTextTable(rows, justify=['left'] + ['right'] * (len(rows[0]) - 1),
                                          header=None, pad=1, colPad=3,
                                          titleFillToken="-",
                                          emptyFillToken="-",
                                          emphasizeHeadRow=False,
                                          returnHTMLMsg=True)
            accordion = UTILS.outputAccordion([table], title=header, titleLevel=5,
                                              expand=False, titleFillToken="*")
            ARCPY.AddMessage(accordion)

        #### Build the Original Correlation Covariance(Balance Results) Table ####
        header = ARCPY.GetIDMessage(220736)  # "Balance Results"
        rows = [[
            ARCPY.GetIDMessage(220737),  # "Confounding Variable"
            ARCPY.GetIDMessage(220738),   # "Original Correlation"
            ARCPY.GetIDMessage(220754)]]  # "Weighted Correlation"
        if hasattr(self, "best_trans_combine"):
            best_trans_combine = self.best_trans_combine
        else:
            best_trans_combine = []
        if len(best_trans_combine) > 0:
            rows[0].append("Transformation")

        corrs = []
        v_names = []
        v_orgs = []
        v_adjs = []
        transformer_ind = 0
        for ind, field_info in enumerate(self.field_info_confounders):
            corr = abs(self.original_corr_values[ind])
            corrs.append(corr)
            adj_corr = self.result_optimal_balanced_ctrl_group.correlations[ind]
            row = [field_info[0],
                   UTILS.formatValue(corr, "%0.4f"),
                   UTILS.formatValue(adj_corr, "%0.4f")]
            if field_info[1]:
                row[0] = [row[0], UTILS.buildSuperscript("*")]
            name = field_info[0]
            if len(best_trans_combine) > 0:
                if field_info[1]:
                    row.append("raw")
                else:
                    transformer = best_trans_combine[transformer_ind]
                    row.append(str(transformer))
                    if transformer.type != TransformerType.RAW:
                        name += f" ({str(transformer)})"
                    transformer_ind += 1

            v_names.append(name)
            v_orgs.append(corr)
            v_adjs.append(adj_corr)
            rows.append(row)
            
        adj_corr_stats = self.__get_target_corr_val(
            self.result_optimal_balanced_ctrl_group.correlations, return_all_values=True)
        if self.balance_type == BalanceType.MEAN:
            rows.append([f"[{ARCPY.GetIDMessage(84261)}]",  # "[mean]",
                         UTILS.formatValue(NUM.mean(corrs), "%0.4f"),
                         UTILS.formatValue(adj_corr_stats[0], "%0.4f")] + (["-"] if len(best_trans_combine) else []))
        elif self.balance_type == BalanceType.MEDIAN:
            rows.append([f"[{ARCPY.GetIDMessage(84414)}]",  # "[median]",
                         UTILS.formatValue(NUM.median(corrs), "%0.4f"),
                         UTILS.formatValue(adj_corr_stats[1], "%0.4f")] + (["-"] if len(best_trans_combine) else []))
        else:
            rows.append([f"[{ARCPY.GetIDMessage(84413)}]",  # "[maximum]",
                         UTILS.formatValue(NUM.max(corrs), "%0.4f"),
                         UTILS.formatValue(adj_corr_stats[2], "%0.4f")] + (["-"] if len(best_trans_combine) else []))
        v_names += [f"[{ARCPY.GetIDMessage(84261)}]", f"[{ARCPY.GetIDMessage(84414)}]", f"[{ARCPY.GetIDMessage(84413)}]"]  # "[mean]", "[median]", "[maximum]"
        v_orgs += [NUM.mean(corrs), NUM.median(corrs), NUM.max(corrs)]
        v_adjs += adj_corr_stats
        rows.append("EMPTY")
        footnote = []
        if self.k_cate > 0:
            footnote.append(f"[*]: {ARCPY.GetIDMessage(220740)}")  # "[*]: Categorical fields"
        table = UTILS.outputTextTable(rows, justify=['left'] + ['right'] * (len(rows[0]) - 1),
                                      header=None, pad=1, colPad=3,
                                      titleFillToken="-",
                                      emptyFillToken="-",
                                      footnote=footnote, returnHTMLMsg=True)
        accordion = UTILS.outputAccordion([table], title=header, titleLevel=5,
                                          expand=False, titleFillToken="*")
        ARCPY.AddMessage(accordion)

        #### Plot the balance bar-chart/line chart ####
        plt.rcParams['font.family'] = ['Segoe UI', 'serif', 'sans-serif', 'Microsoft YaHei']
        if UTILS.couldExportHTMLMessage():
            plt.rcParams.update({'font.size': 12})
            fig = plt.figure(figsize=GLOBAL_OUTPUT_FIG_SIZE)
            # fig.rcParams.update({'font.size': 22})
            ax = fig.add_subplot(axes_class=Axes)
            ax.axes.axis["right"].set_visible(False)
            ax.axes.axis["top"].set_visible(False)
            plt.ioff()
            xs_org = NUM.array(v_orgs[0: -3])
            xs_adj = NUM.array(v_adjs[0: -3])
            # ys = NUM.arange(len(xs_org))
            ys = v_names[0: -3]
            text_length_limit = 15
            ys = [y if len(y) < text_length_limit else TEXTWRAP.fill(y, text_length_limit, break_on_hyphens=True) for y in ys]
            text_wrapped = NUM.any([len(y) >= text_length_limit-1 for y in ys])

            facecolor_org = "#e57373"
            facecolor_adj = "#4fc3f7"
            adj_corr_val = v_adjs[int(self.balance_type) - 3]
            org_corr_val = v_orgs[int(self.balance_type) - 3]
            threshold_name = [f"[{ARCPY.GetIDMessage(84261)}]", f"[{ARCPY.GetIDMessage(84414)}]", f"[{ARCPY.GetIDMessage(84413)}]"][int(self.balance_type)] # "[mean]", "[median]", "[maximum]"

            plt.plot(xs_org, ys,
                     c=facecolor_org, alpha=0.9, marker='o', markersize=6,
                     label=f"{ARCPY.GetIDMessage(220741)} ({threshold_name} = {_ff(org_corr_val, 3)})", linewidth=2, zorder=9)  # "Original"
            plt.plot(xs_adj, ys,
                     c=facecolor_adj, alpha=0.9, marker='o', markersize=6,
                     label=f"{ARCPY.GetIDMessage(220742)} ({threshold_name} = {_ff(adj_corr_val, 3)})",  # "Adjusted"
                     linewidth=2, zorder=9)

            plt.axvline(x=self.balance_threshold, linewidth=1.5, linestyle='--', color="#a1887f", label=ARCPY.GetIDMessage(220743))  # "Balance Threshold"
            plt.axvline(x=org_corr_val, linewidth=1.5, color=facecolor_org, zorder=7)
            plt.axvline(x=adj_corr_val, linewidth=1.5, color=facecolor_adj, zorder=8)

            fig.supxlabel(ARCPY.GetIDMessage(220744))  # "Absolute Correlation"
            if text_wrapped:
                fig.supylabel(ARCPY.GetIDMessage(220745), x=-0.02)  # "Confounding Variables"
            else:
                fig.supylabel(ARCPY.GetIDMessage(220745))  # "Confounding Variables"

            # plt.title("Correlation Between Confounders and Exposure")
            plt.legend()
            plt.xlim((0, round(max([max(v_orgs), max(v_adjs), self.balance_threshold]) + 0.1, 1)))
            ax.axes.set_xticks(ax.axes.get_xticks(), labels=_ff_vals(ax.axes.get_xticks(), 2))

            tmpfile = BytesIO()
            # plt.savefig(tmpfile, format="png", bbox_inches="tight")
            plt.savefig(tmpfile, format="svg", bbox_inches="tight")
            plt.close(fig)
            encoded = base64.b64encode(tmpfile.getvalue()).decode("utf-8")
            # result_graph_corr = f"data:image/png;base64,{encoded}"
            result_graph_corr = f"data:image/svg+xml;base64,{encoded}"
            UTILS.outputHeader(ARCPY.GetIDMessage(220746), 5)  # "Correlation Between Confounders and Exposure"
            ARCPY.AddMessage(
                """json:[{"element":"image", "data":"%s", "elementProps": {"style": "width: 800px;"}}]"""
                % result_graph_corr)

        # if self.balancing_method == ControlGroupGeneratingMethod.MATCHING and self.expo_bins_num is not None and self.prop_expo_lamda is not None:
        #     _num_bin = self.result_optimal_balanced_ctrl_group.num_bin
        #     expo_bin_width = (self.internal_dataset.expo_range[1] - self.internal_dataset.expo_range[0]) / _num_bin
        #     ARCPY.AddMessage(
        #         f"The combination to get current control group is number of bins: {_num_bin}, lamda: {UTILS.formatValue(self.result_optimal_balanced_ctrl_group.lamda, '%0.2f')}, n_delta: {expo_bin_width}")

        if not self.could_solve:
            return
        if self.result_graph_erf_bw_search is not None and UTILS.couldExportHTMLMessage():
            ARCPY.AddMessage(
                """json:[{"element":"image", "data":"%s", "elementProps": {"style": "width: 800px;"}}]"""
                % self.result_graph_erf_bw_search)

        #### Plot the ERF and confidence interval chart ####
        if UTILS.couldExportHTMLMessage():
            fig = plt.figure(figsize=GLOBAL_OUTPUT_FIG_SIZE)
            ax = fig.add_subplot(axes_class=Axes)
            ax.axes.axis["right"].set_visible(False)
            ax.axes.axis["top"].set_visible(False)
            plt.ioff()
            weight_range = (self.result_optimal_balanced_ctrl_group.frequency_table.min(),
                            self.result_optimal_balanced_ctrl_group.frequency_table.max())
            area = 80 + 800 * (self.result_optimal_balanced_ctrl_group.frequency_table - weight_range[0]) / (
                        weight_range[1] - weight_range[0])
            group_solid = NUM.where(self.result_optimal_balanced_ctrl_group.frequency_table != 0)[0]
            group_hollow = NUM.where(self.result_optimal_balanced_ctrl_group.frequency_table == 0)[0]
            if len(group_hollow):
                plt.scatter(self.var_expo[group_hollow], self.var_outcome[group_hollow], s=4,
                            c="#9e9e9e")
                # plt.scatter(self.var_expo[group_hollow], self.var_outcome[group_hollow], s=60,
                #             facecolors="none", edgecolors=(0, 0, 1, 0.3))
            plt.scatter(self.var_expo[group_solid], self.var_outcome[group_solid], s=area[group_solid],
                        facecolors="#2493F2", edgecolors="#2493F2", alpha=0.4, zorder=1)
            plt.plot(self.result_erf_values[:, 0], self.result_erf_values[:, 1], c="#CC0099", alpha=0.9,
                     label=ARCPY.GetIDMessage(220747), linewidth=2, zorder=10)  # Exposure-Response Function (ERF)
            if self.result_erf_confidence_interval is not None:
                plt.plot(self.result_erf_confidence_interval[:, 0], self.result_erf_confidence_interval[:, 1],
                         c="#ff9800", alpha=0.9, linestyle='--',
                         label=ARCPY.GetIDMessage(84976), linewidth=2, zorder=9)  # Confidence Interval
                plt.plot(self.result_erf_confidence_interval[:, 0], self.result_erf_confidence_interval[:, 2],
                         c="#ff9800", alpha=0.9, linestyle='--', linewidth=2, zorder=9)

            xs = list(self.internal_dataset.expo_range)
            ys = [NUM.mean(self.internal_dataset.outcome)] * 2
            # ys_m = [NUM.average(self.internal_dataset.outcome, weights=self.result_optimal_balanced_ctrl_group.frequency_table)] * 2
            avg_label = TEXTWRAP.fill(ARCPY.GetIDMessage(220748).format(self.alias_name_outcome),
                                      40, break_on_hyphens=True)  # Mean Response ({self.alias_name_outcome})
            plt.plot(xs, ys, c="#2F5597", alpha=0.9, linewidth=1.5,
                     label=avg_label, zorder=8)  # Mean Response ({self.alias_name_outcome})
            # plt.plot(xs, ys_m, c="#673ab7", alpha=0.9, linewidth=1.5,
            #          label=f"Weighted Mean of Response ({self.alias_name_outcome})", zorder=8)

            # plt.xlabel(f"Exposure ({self.alias_name_expo})")
            # plt.ylabel(f"Response ({self.alias_name_outcome})")

            xlabel = TEXTWRAP.fill(ARCPY.GetIDMessage(220704).format(self.alias_name_expo), 90, break_on_hyphens=True) # "Exposure ({self.alias_name_expo})"
            ylabel = TEXTWRAP.fill(ARCPY.GetIDMessage(220749).format(self.alias_name_outcome), 60, break_on_hyphens=True) # "Outcome ({self.alias_name_outcome})"
            fig.supxlabel(xlabel)  # "Exposure ({self.alias_name_expo})"
            fig.supylabel(ylabel)  # "Outcome ({self.alias_name_outcome})"
            ax.axes.set_xticks(ax.axes.get_xticks(), labels=_ff_vals(ax.axes.get_xticks()))
            ax.axes.set_yticks(ax.axes.get_yticks(), labels=_ff_vals(ax.axes.get_yticks()))

            plt.legend()
            x_min = self.internal_dataset.expo_range[0]
            x_max = self.internal_dataset.expo_range[1]
            if x_min != x_max:
                r = (x_max - x_min) * 0.03
                ax.set_xlim(x_min - r, x_max + r)
            tmpfile = BytesIO()
            plt.savefig(tmpfile, format='png', bbox_inches='tight')
            # plt.savefig(tmpfile, format='svg', bbox_inches='tight')
            plt.close(fig)
            encoded = base64.b64encode(tmpfile.getvalue()).decode('utf-8')
            result_graph_erf = f'data:image/png;base64,{encoded}'
            # self.result_graph_erf = f'data:image/svg+xml;base64,{encoded}'

            # path = "file:///" + self.result_graph_erf.replace("\\", "/")
            # ARCPY.AddMessage(
            #     """json:[{"element":"image", "data":"%s", "elementProps": {"style": "width: 700px;"}}]"""
            #     % path)
            # ARCPY.AddMessage(UTILS.outputParagraph(["Result ERF graph path: ",
            #                                         UTILS.buildHyperlink(self.result_graph_erf)],
            #                                        force2Txt=False))
            UTILS.outputHeader(ARCPY.GetIDMessage(220747), 5)  # "Exposure-Response Function (ERF)"
            ARCPY.AddMessage(
                """json:[{"element":"image", "data":"%s", "elementProps": {"style": "width: 800px;"}}]"""
                % result_graph_erf)
        ARCPY.AddMessage(f"{ARCPY.GetIDMessage(220750)} ({str(self.expo_resp_estimation_method)}): {_ff(self.result_erf_optimal_bandwidth, 4)}")  # "Bandwidth ({str(self.expo_resp_estimation_method)}): {self.result_erf_optimal_bandwidth:.4f}"

        #### Draw the debug bootstrap graph ####
        if GLOBAL_EXPORT_BOOTSTRAP_SAMPLE_ERFS and hasattr(self, "REF_EST_Collection"):
            fig = plt.figure(figsize=GLOBAL_OUTPUT_FIG_SIZE)
            ax = fig.add_subplot(axes_class=Axes)
            ax.axes.axis["right"].set_visible(False)
            ax.axes.axis["top"].set_visible(False)
            plt.ioff()

            plt.plot(self.result_erf_values[:, 0], self.result_erf_values[:, 1], c="#CC0099", alpha=0.9,
                     label=ARCPY.GetIDMessage(220747), linewidth=2, zorder=10)

            if self.result_erf_confidence_interval is not None:
                valid_inds = NUM.where(~NUM.isnan(self.result_erf_confidence_interval[:, 3]))[0]
                plt.plot(self.result_erf_confidence_interval[:, 0][valid_inds], self.result_erf_confidence_interval[:, 3][valid_inds],
                         c="#6d4c41", alpha=0.9,
                         label="Confidence Interval\n(Before Smoothing)", linewidth=2, zorder=9)
                plt.plot(self.result_erf_confidence_interval[:, 0][valid_inds], self.result_erf_confidence_interval[:, 4][valid_inds],
                         c="#6d4c41", alpha=0.9, linewidth=2, zorder=9)

                valid_inds = NUM.where(~NUM.isnan(self.result_erf_confidence_interval[:, 1]))[0]
                plt.plot(self.result_erf_confidence_interval[:, 0][valid_inds], self.result_erf_confidence_interval[:, 1][valid_inds],
                         c="#ff9800", alpha=0.9, #linestyle='--',
                         label=ARCPY.GetIDMessage(84976), linewidth=2, zorder=9)  # Confidence Interval
                plt.plot(self.result_erf_confidence_interval[:, 0][valid_inds], self.result_erf_confidence_interval[:, 2][valid_inds],
                         c="#ff9800", alpha=0.9, #linestyle='--',
                         linewidth=2, zorder=9)

            x_values = self.result_erf_values[:, 0]
            erf_count = self.REF_EST_Collection.shape[1]
            if erf_count <= 100:
                alpha = 0.3
            elif erf_count <= 300:
                alpha = 0.2
            else:
                alpha = 0.1
            color_sample_erf = "#00796b"  # "#009688"
            for i in range(self.REF_EST_Collection.shape[1]):
                y_values = self.REF_EST_Collection[:, i]
                valid_inds = NUM.where(~NUM.isnan(y_values))[0]
                if i == 0:
                    plt.plot(x_values[valid_inds], y_values[valid_inds],
                             c=color_sample_erf, label=f"ERF by bootstrap samples\n(count = {erf_count})",
                             alpha=alpha, linewidth=1, zorder=1)
                else:
                    plt.plot(x_values[valid_inds], y_values[valid_inds],
                             c=color_sample_erf, alpha=alpha, linewidth=1, zorder=1)

            plt.xlabel(f"Exposure ({self.alias_name_expo})")
            plt.ylabel(f"Outcome ({self.alias_name_outcome})")
            # plt.title('')
            plt.legend()
            tmpfile = BytesIO()
            plt.savefig(tmpfile, format='png', bbox_inches='tight')
            # plt.savefig(tmpfile, format='svg', bbox_inches='tight')
            plt.close(fig)
            encoded = base64.b64encode(tmpfile.getvalue()).decode('utf-8')
            result_graph_erf = f'data:image/png;base64,{encoded}'
            # self.result_graph_erf = f'data:image/svg+xml;base64,{encoded}'

            # path = "file:///" + self.result_graph_erf.replace("\\", "/")
            # ARCPY.AddMessage(
            #     """json:[{"element":"image", "data":"%s", "elementProps": {"style": "width: 700px;"}}]"""
            #     % path)
            # ARCPY.AddMessage(UTILS.outputParagraph(["Result ERF graph path: ",
            #                                         UTILS.buildHyperlink(self.result_graph_erf)],
            #                                        force2Txt=False))

            if UTILS.couldExportHTMLMessage():
                UTILS.outputHeader("Bootstrap Samples ERF Collection", 5)
                ARCPY.AddMessage(
                    """json:[{"element":"image", "data":"%s", "elementProps": {"style": "width: 800px;"}}]"""
                    % result_graph_erf)
            for msg in self.ERF_EST_MSG_Collection:
                ARCPY.AddMessage(msg)

        # self.__cal_e_value()

    def __execute_confounders_transform(self, exit_once_achieve_balancing=True, sample=None):
        """
        If the balanced control group generating cannot be achieved, try to do value transformation on the values,
        re-calculate the GPS values and try to generate contril group again to see if we can solve the problem
        Parameters
        ----------
        Returns
        -------

        """
        def execute_gps_match(self, expo_bins_num, prop_expo_lamda, transformer_label, sample=None):
            #### Do the match directly ####
            if sample is None:
                data = self
            else:
                data = sample
            msg_template = ARCPY.GetIDMessage(220717).format(transformer_label)  # f"Generating balanced control group{transformer_label}..."
            if data.n / expo_bins_num > 300:
                matching_fun = self.__execute_gps_match_with_param_V3
            else:
                matching_fun = self.__execute_gps_match_with_param_V2
            matched_dataset = matching_fun(
                expo_bins_num,
                lamda=prop_expo_lamda,
                msg=msg_template,
                sample=sample)
            if matched_dataset is None:
                data.could_solve = False
                return None
            w = NUM.zeros(len(matched_dataset), dtype=float)
            w[:] = matched_dataset[:]
            adj_corr = []
            step_cate = 0
            for i, info in enumerate(self.field_info_confounders):
                if info[1]:
                    # The confounder is categorical/binary
                    adj_corr.append(self.EtaCorr(data.var_expo, data.var_conf_cate[:, step_cate], w=w))
                    step_cate += 1
                else:
                    # The confounder is continuous
                    adj_corr.append(abs(WeightedCorr(data.var_expo, data.var_conf_cont[:, i - step_cate], w)("SPEARMAN")))
            data.result_optimal_balanced_ctrl_group = OptimalBalancedControlGroup(
                frequency_table=matched_dataset,
                correlations=adj_corr,
                num_bin=expo_bins_num,
                lamda=prop_expo_lamda,
                target_corr_value=self.__get_target_corr_val(adj_corr),
                achieved_balance_threshold=self.__get_target_corr_val(adj_corr) <= self.balance_threshold)
            return None

        if len(self.transformer_candidates) == 0:  # no available transformer candidates to use. Return
            return

        if sample is None:
            data = self
        else:
            data = sample
        candidates_per_var = []
        for i in range(self.k_cont):
            candidates = []
            vals = data.data_before_propen_cal["var_conf_cont"][:, i].copy()
            for t in self.transformer_candidates:
                if t.check_applicability(vals):
                    candidates.append(t)
            candidates_per_var.append(candidates)

        rank_inds = NUM.argsort(NUM.array(data.result_optimal_balanced_ctrl_group.correlations)[self.var_conf_cont_inds])[::-1]
        best_internal_dataset = data.internal_dataset
        best_opt_group_result = data.result_optimal_balanced_ctrl_group
        data.best_trans_combine = [ValueTransformer(TransformerType.RAW)] * self.k_cont

        ###############################################################################################################
        tested_trans_comb = set()
        candidates_per_var = [[ValueTransformer(TransformerType.RAW)] + l for l in candidates_per_var]
        optimal_transformer_comb = [ValueTransformer(TransformerType.RAW)] * self.k_cont
        tested_trans_comb.add(tuple(list(map(str, optimal_transformer_comb))))
        best_corr_value = 1e9
        #### Do the transforming on multiple confounders ####
        transform_search_history = []
        best_record_ind = 0
        iter_num = 0
        for confounder_ind in rank_inds:
            for transformer in candidates_per_var[confounder_ind]:
                trans_comb = optimal_transformer_comb.copy()
                trans_comb[confounder_ind] = transformer
                if tuple(list(map(str, trans_comb))) in tested_trans_comb:
                    continue
                else:
                    tested_trans_comb.add(tuple(list(map(str, trans_comb))))
                iter_num += 1
                var_conf_cont = data.data_before_propen_cal["var_conf_cont"].copy()
                for ind in range(self.k_cont):
                    var_conf_cont[:, ind] = trans_comb[ind].transform(var_conf_cont[:, ind])
                data.internal_dataset = self.__calculate_propensity_score(var_conf=var_conf_cont, sample=sample)

                if self.balancing_method == ControlGroupGeneratingMethod.MATCHING:
                    execute_gps_match(self, data.result_optimal_balanced_ctrl_group.num_bin,
                                      data.result_optimal_balanced_ctrl_group.lamda,
                                      transformer_label=f" ({str(trans_comb)})", sample=sample)
                else:
                    if sample is None:
                        msg_template = ARCPY.GetIDMessage(220717).format(f"({str(trans_comb)})")  # f"Generating balanced control group{({str(trans_comb)})}..."
                        ARCPY.SetProgressor("default", msg_template)
                    self.__execute_gps_weight(sample=sample, show_progress_bar=False)
                    if sample is None:
                        ARCPY.ResetProgressor()

                opt = data.result_optimal_balanced_ctrl_group

                transform_search_history.append([trans_comb, opt.target_corr_value, (opt.num_bin, opt.lamda)])
                if opt.target_corr_value < best_corr_value:
                    optimal_transformer_comb = trans_comb
                    best_record_ind = iter_num
                    best_corr_value = opt.target_corr_value

                if opt.target_corr_value < best_opt_group_result.target_corr_value:
                    best_internal_dataset = data.internal_dataset
                    best_opt_group_result = data.result_optimal_balanced_ctrl_group
                    data.best_trans_combine = optimal_transformer_comb
                if exit_once_achieve_balancing and opt.achieved_balance_threshold:
                    break
            if exit_once_achieve_balancing and data.result_optimal_balanced_ctrl_group.achieved_balance_threshold:
                break

        if not exit_once_achieve_balancing or not data.result_optimal_balanced_ctrl_group.achieved_balance_threshold:
            data.internal_dataset = best_internal_dataset
            data.result_optimal_balanced_ctrl_group = best_opt_group_result

        if sample is None:
            #### Print the search history here ####
            self.__print_transformer_search_history(
                transform_search_history,
                ARCPY.GetIDMessage(220751),  # Transformation Balancing Results / "Balancing Group Search History by Applying Transformers",
                best_record_ind
            )
        if exit_once_achieve_balancing and data.result_optimal_balanced_ctrl_group.achieved_balance_threshold:
            return

    def __print_transformer_search_history(self, transform_search_history: list, header: str, best_record_ind: int):
        rows = [[
            ARCPY.GetIDMessage(220752),  # "Iteration",
            ARCPY.GetIDMessage(220753),  # "Transformer Combination",
            ARCPY.GetIDMessage(220754),  # "Adjusted Correlation Covariance"
        ]]
        # if self.balancing_method == ControlGroupGeneratingMethod.MATCHING:
        #     rows[0].append("Matching Parameters")

        for ind, vals in enumerate(transform_search_history):
            trans_comb = vals[0]
            trans_strs = []
            trans_ind = 0
            for column, variable_info in enumerate(self.field_info_confounders):
                if not variable_info[1]:
                    variable = variable_info[0]
                    tran = trans_comb[trans_ind]
                    if tran.type != TransformerType.RAW:
                        trans_strs.append(f"{variable}({str(tran)})")
                    else:
                        trans_strs.append(f"{variable}")
                    trans_ind += 1
            row = [ind + 1, ", ".join(trans_strs), UTILS.formatValue(vals[1], "%0.4f")]
            # if self.balancing_method == ControlGroupGeneratingMethod.MATCHING:
            #     row.append(f"({vals[2][0]}, {'%0.2f' % vals[2][1]})")
            rows.append(row)
        rows.append("EMPTY")
        footnote = []
        table = UTILS.outputTextTable(rows, justify=['left'] + ['right'] * (len(rows[0]) - 1),
                                      header=None, pad=1, colPad=3,
                                      titleFillToken="-",
                                      emptyFillToken="-",
                                      boldRows=[0, best_record_ind],
                                      footnote=footnote, returnHTMLMsg=True)
        self.result_msg_transformation_balancing_results = UTILS.outputAccordion(
            [table], title=header, titleLevel=5,
            expand=False, titleFillToken="*", returnHTMLMsg=True)

    def __execute_xgboost_grid_search(self, exit_once_achieve_balancing=True, sample=None):
        """
        If the balanced control group generating cannot be achieved,
        try to re-calculate the propensity scores and matching/weighting with different xg-boost hyper-parameters,
        to see if we can solve the problem

        Parameters
        ----------
        exit_once_achieve_balancing

        Returns
        -------

        """
        if GLOBAL_XG_BOOST_HYPER_PARAM is None or "number_trees" not in GLOBAL_XG_BOOST_HYPER_PARAM or "rate" not in GLOBAL_XG_BOOST_HYPER_PARAM:  # invalid param. Return
            return

        if sample is None:
            data = self
        else:
            data = sample

        best_internal_dataset = data.internal_dataset
        best_opt_group_result = data.result_optimal_balanced_ctrl_group
        data.best_xgboost_combine = {
            "number_trees": 30,
            "rate": 0.3
        }
        # best_table_search_message = None

        xgb_param_search_history = []
        best_corr_value = 1e9
        best_record_ind = 0
        iter_num = 0

        total_comb_num = len(GLOBAL_XG_BOOST_HYPER_PARAM["rate"]) * len(GLOBAL_XG_BOOST_HYPER_PARAM["number_trees"])
        for rate in GLOBAL_XG_BOOST_HYPER_PARAM["rate"]:
            for number_trees in GLOBAL_XG_BOOST_HYPER_PARAM["number_trees"]:
                hyper_param = {
                    "rate": rate,
                    "number_trees": number_trees
                }
                data.internal_dataset = self.__calculate_propensity_score(xgb_spec_param=hyper_param, sample=sample)
                if self.balancing_method == ControlGroupGeneratingMethod.MATCHING:
                    messages = self.__execute_gps_match(
                        export_grid_search_table=False,
                        transformer_label=f" ({iter_num+1} / {total_comb_num}, {ARCPY.GetIDMessage(220732)}: {number_trees}, {ARCPY.GetIDMessage(220733)}: {rate})",
                        header_label=f"({ARCPY.GetIDMessage(220755)})", sample=sample)  # "With Specified Gradient Boosting Paramete"
                else:
                    self.__execute_gps_weight(sample=sample, show_progress_bar=False)
                    messages = None
                if not data.could_solve:
                    continue
                opt = data.result_optimal_balanced_ctrl_group
                xgb_param_search_history.append([hyper_param, opt.target_corr_value, (opt.num_bin, opt.lamda)])

                if opt.target_corr_value < best_corr_value:
                    best_record_ind = iter_num
                    best_corr_value = opt.target_corr_value

                if opt.target_corr_value < best_opt_group_result.target_corr_value:
                    best_internal_dataset = data.internal_dataset
                    best_opt_group_result = data.result_optimal_balanced_ctrl_group
                    data.best_xgboost_combine = hyper_param
                    if messages is not None:
                        self.result_msg_matching_grid_search_results = messages
                    # best_table_search_message = messages
                iter_num += 1
                if exit_once_achieve_balancing and opt.achieved_balance_threshold:
                    break
            if exit_once_achieve_balancing and data.result_optimal_balanced_ctrl_group.achieved_balance_threshold:
                break

        if not exit_once_achieve_balancing or not data.result_optimal_balanced_ctrl_group.achieved_balance_threshold:
            data.internal_dataset = best_internal_dataset
            data.result_optimal_balanced_ctrl_group = best_opt_group_result

        if sample is not None:
            return
        #### Print the search history here ####
        rows = [[
            ARCPY.GetIDMessage(220752),  # "Iteration",
            f"{ARCPY.GetIDMessage(220756)} ({ARCPY.GetIDMessage(220732)}, {ARCPY.GetIDMessage(220733)})",  # "Gradient Boosting Parameter Combination (num_trees, rate)",
            ARCPY.GetIDMessage(220754)  # f"Adjusted Correlation Covariance"
        ]]
        # if self.balancing_method == ControlGroupGeneratingMethod.MATCHING:
        #     rows[0].append("Matching Parameters (num_bins, lamda)")

        for ind, vals in enumerate(xgb_param_search_history):
            row = [ind + 1, f"({vals[0]['number_trees']}, {vals[0]['rate']})", UTILS.formatValue(vals[1], "%0.4f")]
            # if self.balancing_method == ControlGroupGeneratingMethod.MATCHING:
            #     row.append(f"({vals[2][0]}, {'%.2f' % vals[2][1]})")
            rows.append(row)
        rows.append("EMPTY")
        footnote = []
        table = UTILS.outputTextTable(rows, justify=['left'] + ['right'] * (len(rows[0]) - 1),
                                      header=None, pad=1, colPad=3,
                                      titleFillToken="-",
                                      emptyFillToken="-",
                                      boldRows=[0, best_record_ind + 1],
                                      footnote=footnote, returnHTMLMsg=True)
        self.result_msg_gradient_boosting_balancing_results = UTILS.outputAccordion(
            [table],
            title=ARCPY.GetIDMessage(220757),  # Gradient Boosting Balancing Results "Balancing Group Search History by Using different Gradient Boosting Parameters",
            titleLevel=5, expand=False, titleFillToken="*", returnHTMLMsg=True)

        # #### Print the grid search message ####
        # if best_table_search_message is not None:
        #     for m in best_table_search_message:
        #         ARCPY.AddMessage(m)

    def __get_target_corr_val(self, corr_values, return_all_values=False):
        """
        Calculate the target correlation according to user's specification
        Parameters
        ----------
        corr_values

        Returns
        -------

        """
        cvs = NUM.abs(corr_values)
        values = [
            NUM.mean(cvs),
            NUM.median(cvs),
            NUM.max(cvs)
        ]

        if return_all_values:
            return values
        else:
            return values[int(self.balance_type)]

    def __execute_outcom_exposure_match(self):
        """
        If target outcomes or exposure values are provided, this function will try to find
        the matches for the target values for each individual observation
        """
        self.result_y_on_erf = NUM.zeros(self.n, dtype=float)
        "The y value of each feature on the estimated erf curve"

        x_min = self.result_erf_values[0, 0]
        x_max = self.result_erf_values[-1, 0]
        bt = BeadTracker(self.result_erf_values[:, 1], x_min, x_max)

        for ind, x0 in enumerate(self.var_expo):
            y_erf = bt.cal_y_by_x(x0)
            self.result_y_on_erf[ind] = y_erf

        if len(self.target_outcome_vars) + len(self.target_exposure_vars) == 0:
            return

        invalid_outcome_values = []
        invalid_exposure_values = []
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220758))  # "Matching target outcome and exposure values for each location..."

        for y_target in self.target_outcome_vars:
            diff_x = NUM.full(len(self.var_expo), NUM.nan, dtype=float)
            tar_x = NUM.full(len(self.var_expo), NUM.nan, dtype=float)
            for ind, x0 in enumerate(self.var_expo):
                y0 = self.var_outcome[ind]
                y_erf = self.result_y_on_erf[ind]
                y_diff = y0 - y_erf
                y_shift = y_target - y_diff
                x_target = bt.cal_x_by_y(y_shift, x0)
                if x_target is not None:
                    diff_x[ind] = x_target - x0
                    tar_x[ind] = x_target
            if NUM.all(NUM.isnan(diff_x)):
                invalid_outcome_values.append(y_target)
            else:
                self.result_target_outcome_matches.append((y_target, diff_x, tar_x))

        for x_target in self.target_exposure_vars:
            if x_target < x_min or x_target > x_max:
                invalid_exposure_values.append(x_target)
                continue
            y_target_erf = bt.cal_y_by_x(x_target)
            diff_y = NUM.zeros(len(self.var_expo), dtype=float)
            tar_y = NUM.zeros(len(self.var_expo), dtype=float)
            for ind, x0 in enumerate(self.var_expo):
                y0 = self.var_outcome[ind]
                y_erf = self.result_y_on_erf[ind]
                diff_y[ind] = y_target_erf - y_erf
                tar_y[ind] = y_target_erf - y_erf + y0
            self.result_target_exposure_matches.append((x_target, diff_y, tar_y, y_target_erf))

        ARCPY.ResetProgressor()

        if len(invalid_outcome_values) > 0:
            ARCPY.AddIDMessage("WARNING", 110526, invalid_outcome_values)
        if len(invalid_exposure_values) > 0:
            ARCPY.AddIDMessage("WARNING", 110527, invalid_exposure_values)

        for y_target in self.target_outcome_vars:
            matched_xs = bt.cal_all_x_by_y(y_target)
            for xi in matched_xs:
                self.result_global_target_outcome_matches.append((xi, y_target))

    def __cal_e_value(self):
        """
        Calculate the E Value, information can be found here: https://www.evalue-calculator.com/
        Returns
        -------

        """
        if self.dummy_confounder_vars is not None:
            k_dummy_cate = self.dummy_confounder_vars.shape[1]
        else:
            k_dummy_cate = 0
        X = NUM.ones((self.n, self.k_cont + k_dummy_cate + 2), dtype=float)
        X[:, 1] = self.var_expo
        if self.k_cont > 0:
            X[:, 2: 2 + self.k_cont] = self.var_conf_cont
        if k_dummy_cate > 0:
            X[:, 2 + self.k_cont:] = self.dummy_confounder_vars
        Y = self.var_outcome

        # p, res, rnk, s = LINALG.lstsq(X, Y)
        # est = p[1]  # Regression coefficient estimate
        # sd = NUM.std(Y, ddof=1)  # Standard deviation of outcome
        # se = ((res / (self.n - self.k_cont - 2)) ** 0.5) / (((X[:, 1]) ** 2).sum() ** 0.5)  # standard error of exposure variable coefficient
        # delta = 1
        # print(res)
        XTX = X.T.dot(X)
        XTY = X.T.dot(Y)
        XTX_inv = NUM.linalg.pinv(XTX)
        betas = XTX_inv.dot(XTY)
        est = betas[1]
        sd = NUM.std(Y, ddof=1)
        res = ((Y - NUM.sum(betas * X, axis=1)) ** 2).sum()
        se = (NUM.diag(XTX_inv)[1] * res / (self.n - X.shape[1])) ** 0.5
        delta = 1

        adjusted_est = est * delta / sd
        adjusted_se = se * delta / sd
        lo = MATH.exp(0.91 * adjusted_est - 1.78 * adjusted_se)
        hi = MATH.exp(0.91 * adjusted_est - 1.78 * adjusted_se)
        RR = MATH.exp(0.91 * adjusted_est)

        if RR < 1:
            RR = 1 / RR
        e_value = RR + (RR * (RR - 1)) ** 0.5

        UTILS.outputHeader(f"The Calculated E value is {'%.4f' % e_value}")
        UTILS.outputParagraph(f"E-value is defined as the minimum strength of association on the risk ratio scale that an unmeasured confounder would need to have with both the exposure and the outcome, conditional on the measured covariates, to fully explain away a specific exposure-outcome association.")
        ARCPY.AddMessage(f"est: {'%.8f' % est}; sd: {'%.8f' % sd}; se: {'%.8f' % se}; ")

    def create_output(self):
        """
        Write the result to output featureclass or table
        Returns
        -------

        """

        if self.ssdo is not None:
            #### Create/Populate Dictionary of Candidate Fields ####
            fieldOrder = []
            candidateFields = {}

            appendFields = [self.field_expo, self.field_outcome] + [f[0] for f in self.field_info_confounders]
            appendFields = [f.upper() for f in appendFields]

            if self.internal_dataset is not None and self.result_optimal_balanced_ctrl_group is not None:
                if self.selected_inds is not None:
                    included_records = NUM.zeros(self.original_n, dtype=int)
                    included_records[self.selected_inds] = 1
                    fieldName = "RECRD_USED"
                    candidateField = SSDO.CandidateField(fieldName, "LONG", included_records,
                                                         alias=ARCPY.GetIDMessage(220700))  # "Record Included"
                    candidateFields[fieldName] = candidateField
                    fieldOrder.append(fieldName)
                # Add propensity score
                if self.selected_inds is not None:
                    data = NUM.full(self.original_n, NUM.nan, dtype=float)
                    data[self.selected_inds] = self.internal_dataset.gps
                else:
                    data = self.internal_dataset.gps
                fieldName = "PROPEN_SCO"
                candidateField = SSDO.CandidateField("PROPEN_SCO", "DOUBLE", data,
                                                     alias=ARCPY.GetIDMessage(220701), checkNullValues=True)  # "Propensity Score"
                candidateFields[fieldName] = candidateField
                fieldOrder.append(fieldName)
                if self.balancing_method == ControlGroupGeneratingMethod.MATCHING:
                    # Add Control Group Frequency Table
                    if self.selected_inds is not None:
                        data = NUM.full(self.original_n, NUM.nan, dtype=int)
                        data[self.selected_inds] = self.result_optimal_balanced_ctrl_group.frequency_table
                    else:
                        data = self.result_optimal_balanced_ctrl_group.frequency_table
                    fieldName = "FREQ_TABLE"
                    candidateField = SSDO.CandidateField("FREQ_TABLE", "LONG", data,
                                                         alias=ARCPY.GetIDMessage(220702), checkNullValues=True)  # "Matched Group Frequency Table"
                    candidateFields[fieldName] = candidateField
                    fieldOrder.append(fieldName)
                else:
                    # Add Control Group Weights
                    if self.selected_inds is not None:
                        data = NUM.full(self.original_n, NUM.nan, dtype=float)
                        data[self.selected_inds] = self.result_optimal_balanced_ctrl_group.frequency_table
                    else:
                        data = self.result_optimal_balanced_ctrl_group.frequency_table
                    fieldName = "WEIGHT"
                    candidateField = SSDO.CandidateField("WEIGHT", "DOUBLE", data,
                                                         alias=ARCPY.GetIDMessage(220703), checkNullValues=True)  # "Control Group Weight"
                    candidateFields[fieldName] = candidateField
                    fieldOrder.append(fieldName)

                for ind, ele in enumerate(self.result_target_outcome_matches):
                    tar_outcome = ele[0]
                    data1 = NUM.full(self.original_n, NUM.nan, dtype=float)
                    data1[self.selected_inds] = ele[2]
                    ind_str = str(ind + 1)
                    vn = TargetOutcomeName[0: 10 - len(ind_str)] + ind_str
                    va = TargetOutcomeAlias.format(tar_outcome)

                    candidateField1 = SSDO.CandidateField(vn, "DOUBLE", data1,
                                                         alias=va, checkNullValues=True)
                    candidateFields[vn] = candidateField1
                    fieldOrder.append(vn)

                    data2 = NUM.full(self.original_n, NUM.nan, dtype=float)
                    data2[self.selected_inds] = ele[1]
                    vn = TargetOutcomeDiffName[0: 10 - len(ind_str)] + ind_str
                    va = TargetOutcomeDiffAlias.format(tar_outcome)

                    candidateField2 = SSDO.CandidateField(vn, "DOUBLE", data2,
                                                         alias=va, checkNullValues=True)
                    candidateFields[vn] = candidateField2
                    fieldOrder.append(vn)

                for ind, ele in enumerate(self.result_target_exposure_matches):
                    tar_exposure = ele[0]
                    data1 = NUM.full(self.original_n, NUM.nan, dtype=float)
                    data1[self.selected_inds] = ele[2]
                    ind_str = str(ind + 1)
                    vn = TargetExposureName[0: 10 - len(ind_str)] + ind_str
                    va = TargetExposureAlias.format(tar_exposure)

                    candidateField1 = SSDO.CandidateField(vn, "DOUBLE", data1,
                                                         alias=va, checkNullValues=True)
                    candidateFields[vn] = candidateField1
                    fieldOrder.append(vn)

                    data2 = NUM.full(self.original_n, NUM.nan, dtype=float)
                    data2[self.selected_inds] = ele[1]
                    vn = TargetExposureDiffName[0: 10 - len(ind_str)] + ind_str
                    va = TargetExposureDiffAlias.format(tar_exposure)

                    candidateField2 = SSDO.CandidateField(vn, "DOUBLE", data2,
                                                         alias=va, checkNullValues=True)
                    candidateFields[vn] = candidateField2
                    fieldOrder.append(vn)
            if hasattr(self, "result_bootstrap_total_record"):
                fieldName1 = "BSTP_TOTAL"
                if self.selected_inds is not None:
                    data1 = NUM.full(self.original_n, NUM.nan, dtype=int)
                    data1[self.selected_inds] = self.result_bootstrap_total_record
                else:
                    data1 = self.result_bootstrap_total_record
                candidateField1 = SSDO.CandidateField(fieldName1, "LONG", data1,
                                                     alias=ARCPY.GetIDMessage(220759), checkNullValues=True)  # Bootstrap Sample Count
                candidateFields[fieldName1] = candidateField1
                fieldOrder.append(fieldName1)

                fieldName2 = "BSTP_BALAN"
                if self.selected_inds is not None:
                    dat2 = NUM.full(self.original_n, NUM.nan, dtype=int)
                    dat2[self.selected_inds] = self.result_bootstrap_success_record
                else:
                    dat2 = self.result_bootstrap_success_record
                candidateField2 = SSDO.CandidateField(fieldName2, "LONG", dat2,
                                                      alias=ARCPY.GetIDMessage(220760),  # "Balanced Bootstrap Sample Count"
                                                      checkNullValues=True)
                candidateFields[fieldName2] = candidateField2
                fieldOrder.append(fieldName2)

            self.ssdo.output2NewFC(self.output, candidateFields,
                                   appendFields=appendFields, fieldOrder=fieldOrder)
            if self.create_popups:
                if UTILS.isGDB(self.output):
                    self.__append_HTML_field()
                else:
                    #### Throw Warning That We Ignore PopUps for Shapefiles ####
                    ARCPY.AddIDMessage("WARNING", 110277)

        if self.output_erf_table is not None:
            if self.result_erf_values is None:
                return
            outPath, outName = OS.path.split(self.output_erf_table)

            #### Set Up Field Names and Types ####
            inputFields = UTILS.getFieldNames(["EXPOSURE", "RESPONSE"], outPath)
            inputAliases = [ARCPY.GetIDMessage(220704).format(self.alias_name_expo), ARCPY.GetIDMessage(220705).format(self.alias_name_outcome)]  # [f"Exposure ({self.alias_name_expo})", f"Response ({self.alias_name_outcome})"]
            inputTypes = ["DOUBLE", "DOUBLE"]
            if self.result_erf_confidence_interval is not None:
                inputFields += ["LOWER_CI", "UPPER_CI", "ST_DEV", "NUM_BOOTS"]
                inputAliases += [ARCPY.GetIDMessage(220761), ARCPY.GetIDMessage(220762), ARCPY.GetIDMessage(220051), ARCPY.GetIDMessage(220763)]
                # ["Lower 95% Confidence Bound", "Upper 95% Confidence Bound", "Standard Deviation", "Number of Bootstrap Samples"]

                inputTypes += ["DOUBLE", "DOUBLE", "DOUBLE", "LONG"]

            #### Create ERF Table ####
            inputData = []
            for ind in range(self.result_erf_values.shape[0]):
                if self.result_erf_confidence_interval is not None:
                    inputData.append([self.result_erf_values[ind, 0], self.result_erf_values[ind, 1],
                                      self.result_erf_confidence_interval[ind, 1],
                                      self.result_erf_confidence_interval[ind, 2],
                                      self.result_erf_confidence_interval[ind, 6],
                                      int(self.result_erf_confidence_interval[ind, 5]),
                                      ])
                else:
                    inputData.append([self.result_erf_values[ind, 0], self.result_erf_values[ind, 1]])

            for ele in self.result_target_exposure_matches:
                if self.result_erf_confidence_interval is not None:
                    inputData.append([ele[0], ele[3], NUM.nan, NUM.nan, NUM.nan, NUM.nan])
                else:
                    inputData.append([ele[0], ele[3]])

            for ele in self.result_global_target_outcome_matches:
                if self.result_erf_confidence_interval is not None:
                    inputData.append([ele[0], ele[1], NUM.nan, NUM.nan, NUM.nan, NUM.nan])
                else:
                    inputData.append([ele[0], ele[1]])

            #### Write Coefficient Table ####
            UTILS.createOutputTable(
                self.output_erf_table, inputFields,
                inputTypes, inputData,
                aliases=inputAliases)

    def __append_HTML_field(self):
        ROUND_DIGIT = 3
        MAX_POINT_LIMIT = 1500
        HTML_template = """<html>
<head>
  <meta charset = "utf-8">
</head>
<body></body>
  <script>
    var data = @@data,
      rp = "file:///" + g_resourceFolder + "/";
    var st = document.createElement("script"); 
    st.type = "text/javascript";
    st.src = rp + "ArcToolbox/Scripts/Images/SSCausalInference.js";
    document.head.appendChild(st);
  </script>
</html>"""
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

        x = self.var_expo.copy()
        y = self.var_outcome.copy()
        w = self.result_optimal_balanced_ctrl_group.frequency_table.copy()

        if len(self.var_outcome) > MAX_POINT_LIMIT:
            x, y, w = _aggregate_points_for_html(x, y, w, MAX_POINT_LIMIT)

        if NUM.abs(x).mean() > 1:
            x = NUM.round(x, ROUND_DIGIT)

        if NUM.abs(y).mean() > 1:
            y = NUM.round(y, ROUND_DIGIT)

        if NUM.abs(w).mean() > 1:
            w = NUM.round(w, ROUND_DIGIT)

        erf_x = self.result_erf_values[:, 0].copy()
        if NUM.abs(erf_x).mean() > 1:
            erf_x = NUM.round(erf_x, ROUND_DIGIT)

        erf_y = self.result_erf_values[:, 1].copy()
        if NUM.abs(erf_y).mean() > 1:
            erf_y = NUM.round(erf_y, ROUND_DIGIT)

        content = {
            "x": x.tolist(),
            "y": y.tolist(),
            "w": w.tolist(),
            "nx": self.alias_name_expo,
            "ny": self.alias_name_outcome,
            "erf_x": erf_x.tolist(),
            "erf_y": erf_y.tolist(),
            "lang": selectedLang,
            "local": "@@LocalData",
            "labels": {
                "tar_out": ARCPY.GetIDMessage(220765),
                "str_inc": ARCPY.GetIDMessage(220766),
                "str_dec": ARCPY.GetIDMessage(220767),
                "equ_out_tar": ARCPY.GetIDMessage(220768),
                "str_exp_mov": ARCPY.GetIDMessage(220769),
                "tar_exp": ARCPY.GetIDMessage(220770),
                "equ_exp_tar": ARCPY.GetIDMessage(220771),
                "str_out_mov": ARCPY.GetIDMessage(220772),
                "trim_label": ARCPY.GetIDMessage(220775),
                "obs": ARCPY.GetIDMessage(220348),
                "erf": ARCPY.GetIDMessage(220747),
                "erf_id": ARCPY.GetIDMessage(220654).replace("{{{0}}}", "{0}"),
            },
        }
        file_path = _get_temp_file_path(self.output)
        f = open(file_path, "w")
        html_str = HTML_template.replace(
            "@@data", JSON.dumps(content)).replace(
            '"@@LocalData"', '{expression/expr_local_data}')
        f.write(html_str)
        f.close()
        self.result_popup_global_string = html_str

        erf_data = {
            "erf_x": erf_x.tolist(),
            "erf_y": erf_y.tolist()
        }
        do_match = self.balancing_method == ControlGroupGeneratingMethod.MATCHING
        field_name_data = [self.field_expo.upper(), self.field_outcome.upper(), "FREQ_TABLE" if do_match else "WEIGHT"]
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84997), 0, self.n, 1)

        popup_field_name = "HTML_CHART"
        popupFieldAlias = ARCPY.GetIDMessage(220776)
        # batchSize = int(popupFieldThreshold / self.T)
        # maxRowLength = int(len(HTML_template.replace("@@data", JSON.dumps(content))) * 1.1)
        maxRowLength = int(200 + (len(self.target_exposure_vars) + len(self.target_outcome_vars)) * 20 + len(
            JSON.dumps(erf_data)) * 1.1 + len(JSON.dumps(field_name_data)) * 1.1)

        ARCPY.management.AddFields(
            self.output,
            [[popup_field_name, 'Text', popupFieldAlias, maxRowLength, None, None]])
        step = 0
        fields = [ARCPY.Describe(self.output).OIDFieldName, "RECRD_USED", popup_field_name]
        popupUpdateCursor = ARCPY.da.UpdateCursor(self.output, fields)

        for row in popupUpdateCursor:
            ARCPY.SetProgressorPosition()
            if row[1] == 0:
                continue
            local_data = {
                "id": row[0],
                "y_on_erf": self.result_y_on_erf[step],
                "x": self.var_expo[step],
                "y": self.var_outcome[step],
                "w": NUM.round(float(self.result_optimal_balanced_ctrl_group.frequency_table[step]), ROUND_DIGIT),
                "tar_outcome": [],
                "tar_exposure": [],
            }
            for ele in self.result_target_outcome_matches:
                if not NUM.isnan(ele[1][step]):
                    local_data["tar_outcome"].append([NUM.round(ele[0], ROUND_DIGIT), NUM.round(ele[1][step], ROUND_DIGIT)])
            for ele in self.result_target_exposure_matches:
                if not NUM.isnan(ele[1][step]):
                    local_data["tar_exposure"].append([NUM.round(ele[0], ROUND_DIGIT), NUM.round(ele[1][step], ROUND_DIGIT)])

            # row[2] = HTML_template.replace("@@data", JSON.dumps(content))
            if step == 0:
                local_data["erf_x"] = erf_x.tolist()
                local_data["erf_y"] = erf_y.tolist()
                local_data["fields"] = field_name_data
                local_data["tool"] = "CausalInferenceAnalysis"
            row[2] = JSON.dumps(local_data)
            popupUpdateCursor.updateRow(row)
            step += 1
        ARCPY.ResetProgressor()


    def build_output_symbology(self, out_param_index):
        """
        Build the output symbology for the output layer.
        Parameters
        ----------
        out_param_index

        Returns
        -------

        """
        if self.output is None:
            return
        if self.ssdo.isTable:
            return

        data = self.result_optimal_balanced_ctrl_group.frequency_table
        unique_values = NUM.unique(data)
        if len(unique_values) <= 5:
            # not enough unique values to build the gradient color symbology
            return
        do_match = self.balancing_method == ControlGroupGeneratingMethod.MATCHING
        data = {
            "shapeType": self.ssdo.shapeType,
            "field": "FREQ_TABLE" if do_match else "WEIGHT",
            "heading": ARCPY.GetIDMessage(220702) if do_match else ARCPY.GetIDMessage(220703),  #"Matched Group Frequency Table" if do_match else "Control Group Weight",
            "roundingValue": 0 if do_match else 3,
            "defaultLabel": ARCPY.GetIDMessage(220775)
        }

        if self.ssdo.shapeType.upper() == "POLYGON":
            layer_file = "CausalInferenceAna_Polygons.lyrx"
        elif self.ssdo.shapeType.upper() == "POLYLINE":
            layer_file = "CausalInferenceAna_Lines.lyrx"
        else:
            layer_file = "CausalInferenceAna_Points.lyrx"

        if self.result_popup_global_string is not None and len(self.result_popup_global_string) > 10:
            popup_info = ARCPY.cim.CreateCIMObjectFromClassName("CIMPopupInfo", "V2")
            popup_info.title = ARCPY.GetIDMessage(220654).format(ARCPY.Describe(self.output).OIDFieldName) # Exposure-response function for feature ID {{{0}}}
            popup_info.expressionInfos = [
                {
                    "type": "CIMExpressionInfo",
                    "title": "expr_local_data",
                    "expression": "var x = $feature.HTML_CHART;\nif(x==null){\n return \"null\";\n}\nelse{\n return x;\n}",
                    "name": "expr_local_data",
                    "returnType": "String"
                }
            ]
            media_info_fields = ARCPY.cim.CreateCIMObjectFromClassName("CIMTableMediaInfo", "V2")
            media_info_fields.refreshRateUnit = "esriTimeUnitsSeconds"
            media_info_fields.rowSpan = 1
            media_info_fields.columnSpan = 1
            fields = []
            try:
                field_objs = ARCPY.ListFields(self.output)
                for field_obj in field_objs:
                    if field_obj.type.upper() != "GEOMETRY" and field_obj.name.upper() != "HTML_CHART":
                        fields.append(field_obj.name)
            except:
                pass
            media_info_fields.fields = fields

            media_info_chart = ARCPY.cim.CreateCIMObjectFromClassName("CIMTextMediaInfo", "V2")
            media_info_chart.row = 1
            media_info_chart.refreshRateUnit = "esriTimeUnitsSeconds"
            media_info_chart.rowSpan = 1
            media_info_chart.columnSpan = 1
            media_info_chart.text = self.result_popup_global_string

            popup_info.mediaInfos = [media_info_fields, media_info_chart]
            # popup_info.mediaInfos = [media_info_chart]
            # popup_info.mediaInfos = [media_info_fields]
            data["popupInfo"] = popup_info

        UTILS.buildLocaleCIMLayer(layer_file, out_param_index, data=data)
        # UTILS.buildLocaleCIMLayer(layer_file, -1, data=data, outPath=r"c:\temp\sss.lyrx")
        # ARCPY.AddMessage("NOTTTTTTTTTTTTTTTTT update here, from saved file...")
        # ARCPY.gp.SetParameterSymbology(out_param_index, r"c:\temp\sss.lyrx")


    def build_cim_graphic(self, active_map):
        """
        Build the CIM graphic for the ERF chart.
        Parameters
        ----------
        active_map

        Returns
        -------

        """
        from arcpy.cim.cimloader import GetJSONTypeOBJ
        from arcpy.cim.cimloader import CimJsonEncoder

        if not UTILS.couldExportHTMLMessage():
            return None

        # Calculate the envelope of the graphic layer
        spatialReference = None
        box = None
        if not self.ssdo.isTable:
            if self.ssdo.info.spatialReference is not None:
                spatialReference = {
                    "wkid": self.ssdo.info.spatialReference.factoryCode,
                }
            if self.ssdo.extent is not None:
                box = {
                    "xmin": self.ssdo.extent.XMin,
                    "ymin": self.ssdo.extent.YMin,
                    "xmax": self.ssdo.extent.XMax,
                    "ymax": self.ssdo.extent.YMax
                }

        basename = OS.path.basename(self.output)
        if basename.upper().endswith(".SHP") or basename.upper().endswith(".DBF"):
            basename = basename[:-4]
        name = ARCPY.GetIDMessage(220764).format(basename)  # f"{OS.path.basename(self.output).split('.')[0]} Exposure-Response Function"

        fig = plt.figure(figsize=GLOBAL_OUTPUT_FIG_SIZE, linewidth=2, edgecolor="gray")
        ax = fig.add_subplot(axes_class=Axes)
        ax.axes.axis["right"].set_visible(False)
        ax.axes.axis["top"].set_visible(False)
        plt.ioff()
        weight_range = (self.result_optimal_balanced_ctrl_group.frequency_table.min(),
                        self.result_optimal_balanced_ctrl_group.frequency_table.max())
        area = 80 + 800 * (self.result_optimal_balanced_ctrl_group.frequency_table - weight_range[0]) / (
                weight_range[1] - weight_range[0])
        group_solid = NUM.where(self.result_optimal_balanced_ctrl_group.frequency_table != 0)[0]
        group_hollow = NUM.where(self.result_optimal_balanced_ctrl_group.frequency_table == 0)[0]
        if len(group_hollow):
            plt.scatter(self.var_expo[group_hollow], self.var_outcome[group_hollow], s=4,
                        c="#9e9e9e")
            # plt.scatter(self.var_expo[group_hollow], self.var_outcome[group_hollow], s=60,
            #             facecolors="none", edgecolors=(0, 0, 1, 0.3))
        plt.scatter(self.var_expo[group_solid], self.var_outcome[group_solid], s=area[group_solid],
                    facecolors="#2493F2", edgecolors="#2493F2", alpha=0.4, zorder=1)
        plt.plot(self.result_erf_values[:, 0], self.result_erf_values[:, 1], c="#CC0099", alpha=0.9,
                 label=ARCPY.GetIDMessage(220747), linewidth=2, zorder=10)  # "Exposure-Response Function (ERF)"
        if self.result_erf_confidence_interval is not None:
            plt.plot(self.result_erf_confidence_interval[:, 0], self.result_erf_confidence_interval[:, 1],
                     c="#ff9800", alpha=0.9, linestyle='--',
                     label=ARCPY.GetIDMessage(84976), linewidth=2, zorder=9)  # Confidence Interval
            plt.plot(self.result_erf_confidence_interval[:, 0], self.result_erf_confidence_interval[:, 2],
                     c="#ff9800", alpha=0.9, linestyle='--', linewidth=2, zorder=9)

        xs = list(self.internal_dataset.expo_range)
        ys = [NUM.mean(self.internal_dataset.outcome)] * 2
        # ys_m = [NUM.average(self.internal_dataset.outcome, weights=self.result_optimal_balanced_ctrl_group.frequency_table)] * 2
        plt.plot(xs, ys, c="#2F5597", alpha=0.9, linewidth=1.5,
                 label=ARCPY.GetIDMessage(220748).format(self.alias_name_outcome), zorder=8)  # Mean Response ({self.alias_name_outcome})
        # plt.plot(xs, ys_m, c="#673ab7", alpha=0.9, linewidth=1.5,
        #          label=f"Weighted Mean of Response ({self.alias_name_outcome})", zorder=8)

        # plt.xlabel(f"Exposure ({self.alias_name_expo})")
        # plt.ylabel(f"Response ({self.alias_name_outcome})")
        # fig.supxlabel(f"Exposure ({self.alias_name_expo})")
        # fig.supylabel(f"Response ({self.alias_name_outcome})")
        fig.supxlabel(ARCPY.GetIDMessage(220704).format(self.alias_name_expo))  # "Exposure ({self.alias_name_expo})"
        fig.supylabel(ARCPY.GetIDMessage(220749).format(self.alias_name_outcome))  # "Outcome ({self.alias_name_outcome})"
        ax.axes.set_xticks(ax.axes.get_xticks(), labels=_ff_vals(ax.axes.get_xticks()))
        ax.axes.set_yticks(ax.axes.get_yticks(), labels=_ff_vals(ax.axes.get_yticks()))

        plt.legend()
        x_min = self.internal_dataset.expo_range[0]
        x_max = self.internal_dataset.expo_range[1]
        if x_min != x_max:
            r = (x_max - x_min) * 0.03
            ax.set_xlim(x_min - r, x_max + r)
        # path = _get_temp_file_template("erf_graph")
        # plt.savefig(path, bbox_inches='tight')
        # plt.close(fig)
        # self.result_graph_erf = path
        tmpfile = BytesIO()
        if self.n > 5000:
            plt.savefig(tmpfile, format='png', bbox_inches='tight')
            plt.close(fig)
            encoded = base64.b64encode(tmpfile.getvalue()).decode('utf-8')
            result_graph_erf = f'data:image/png;base64,{encoded}'
        else:
            plt.savefig(tmpfile, format='svg', bbox_inches='tight')
            plt.close(fig)
            encoded = base64.b64encode(tmpfile.getvalue()).decode('utf-8')
            result_graph_erf = f'data:image/svg+xml;base64,{encoded}'


        pathTemplate = OS.path.join(UTILS.pathLayers, "CausalInferenceAna_CIM_Graphic.lyrx")
        f = open(pathTemplate, 'r')
        content = f.read()
        f.close()
        cimLayer = JSON.loads(content)
        cimLayer["layerDefinitions"][0]["name"] = name
        cimLayer["layerDefinitions"][0]["sourceURI"] = self.output.replace("\\", "/")
        if spatialReference and box:
            cimLayer["binaryReferences"][1]["object"]["spatialReference"] = spatialReference
            cimLayer["binaryReferences"][1]["object"]["elements"][0]["graphic"]["box"] = box

        cimLayer["binaryReferences"][1]["object"]["elements"][0]["graphic"]["pictureURL"] = result_graph_erf
        jsonData = JSON.dumps(cimLayer)
        cim_graphic_path = _get_temp_file_path_cim_graphic_layer(output_fc_path=self.output)
        f = open(cim_graphic_path, 'w')
        f.write(jsonData)
        f.close()
        # ARCPY.AddMessage(cim_graphic_path)
        return cim_graphic_path

    def build_graphic_chart(self):
        sc = ARCPY.charts.Scatter(self.field_expo, self.field_outcome,
                                  title="",
                                  xTitle=ARCPY.GetIDMessage(220704).format(self.alias_name_expo),
                                  yTitle=ARCPY.GetIDMessage(220749).format(self.alias_name_outcome))

        sc._arc_object.name = ARCPY.GetIDMessage(220747)
        sc.legend.alignment = "bottom"

        rx = 0
        x_min = self.internal_dataset.expo_range[0]
        x_max = self.internal_dataset.expo_range[1]
        if x_min != x_max:
            rx = (x_max - x_min) * 0.03

        sc.xAxis.minimum = x_min - rx
        sc.xAxis.maximum = x_max + rx

        ry = 0
        y_min = NUM.min(self.internal_dataset.outcome)
        y_max = NUM.max(self.internal_dataset.outcome)
        if y_min != y_max:
            ry = (y_max - y_min) * 0.03

        sc.yAxis.minimum = y_min - ry
        sc.yAxis.maximum = y_max + ry

        guideERF = ARCPY.charts.Guide("polyline",
                                      polyline=[val for pair in zip(self.result_erf_values[:, 0],
                                                                    self.result_erf_values[:, 1]) for val in pair],
                                      name="ERF", label=ARCPY.GetIDMessage(220747), lineColor="rgba(204,0,153,0.9)",
                                      lineWidth=2)
        sc.xAxis.addGuide(guideERF)

        if self.result_erf_confidence_interval is not None:
            guideCONF1 = ARCPY.charts.Guide("polyline",
                                          polyline=[val for pair in zip(self.result_erf_confidence_interval[:, 0],
                                                                        self.result_erf_confidence_interval[:, 1]) for val in pair],
                                          name="CONF_INTV_1", label=ARCPY.GetIDMessage(84976), lineColor="#ff9800",
                                          lineWidth=2, lineDashStyle="dash")
            guideCONF2 = ARCPY.charts.Guide("polyline",
                                          polyline=[val for pair in zip(self.result_erf_confidence_interval[:, 0],
                                                                        self.result_erf_confidence_interval[:, 2]) for val in pair],
                                          name="CONF_INTV_2", lineColor="#ff9800",
                                          lineWidth=2, lineDashStyle="dash")
            sc.xAxis.addGuide(guideCONF1)
            sc.xAxis.addGuide(guideCONF2)

        outcome_mean = NUM.mean(self.internal_dataset.outcome)
        guideMean = ARCPY.charts.Guide("polyline", polyline=[x_min, outcome_mean, x_max, outcome_mean],
                                       name="MR", label=ARCPY.GetIDMessage(220748).format(self.alias_name_outcome),
                                       lineColor="rgba(47,85,151,0.9)", lineWidth=1.5)
        sc.xAxis.addGuide(guideMean)

        if self.balancing_method == ControlGroupGeneratingMethod.MATCHING:
            sc.sizeField = "FREQ_TABLE"
        else:
            sc.sizeField = "WEIGHT"

        return sc



