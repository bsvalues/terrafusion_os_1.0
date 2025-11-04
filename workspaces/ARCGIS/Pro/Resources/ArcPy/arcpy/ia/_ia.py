#COPYRIGHT 2018 ESRI
#
#TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
#Unpublished material - all rights reserved under the
#Copyright Laws of the United States.
#
#For additional information, contact:
#Environmental Systems Research Institute, Inc.
#Attn: Contracts Dept
#380 New York Street
#Redlands, California, USA 92373
#
#email: contracts@esri.com

import arcgisscripting
import os.path
from ..sa import Raster
from .util import get_aoi
from .RasterToXarray import *

__all__ = ["Subset", "Aggregate", "Foreach", "Apply", "Anomaly", "Render", "Clip", "Merge", "utils", "RasterToXarray", "XarrayToRaster"]


def Subset(in_raster, variables=None, dimension_definitions=None):
    """Subset(in_raster, {variables}, {dimension_definitions})

    Returns a new raster object that are subseted on the input raster along variables or dimensions or both

    Parameters:
    in_raster(Raster): the multidimensional raster which is to be sliced.
    variables(String or List): a single variable name or a list of variable names to be kept in the output raster. If not specified, all variables will be included
    dimension_definitions(Dict): the dimension interval used to subset the multidimensional raster. This parameter is passed as a dictionary in which the key-value pairs should use one of the formats as follows:
        dimension_name:value
        dimension_name :(min, max)
        dimension_name:[value1, (min1, max1)
        dimension_name:(from, to, recurrent_interval_size, recurrent_interval_unit)
    Returns:
        out_raster(Raster) :the output subset multidimensional raster"""
    if variables is not None:
        # validate variables
        variable_names = in_raster.variableNames
        if isinstance(variables, str):
            if variables not in variable_names:
                raise ValueError(variables + ' does not exist in in_raster')
        elif isinstance(variables, list):
            for variable in variables:
                if not isinstance(variable, str):
                    raise TypeError('variables must be string or list of strings')
                if variable not in variable_names:
                    raise ValueError(variable + ' does not exist in in_raster')
        else:
            raise TypeError('variables must be string or list of strings')

    return arcgisscripting._ia.Subset(in_raster=in_raster, variables=variables,
                                     dimension_definitions=dimension_definitions)


def Aggregate(in_raster, dimension_name, raster_function, raster_function_arguments=None, aggregation_definition=None, dimensionless=False):
    """Aggregate(in_raster, dimension_name, raster_function, {raster_function_arguments}, {aggregation_definition}, {dimensionless})

    Aggregate multidimensional raster based on user specified dimension intervals and aggregation method

    Parameters:
    in_raster(Raster):the input multidimensional raster to be aggregated
    dimension_name(String): the aggregation dimension. This is the dimension along which you want to aggregate the variables.
    raster_function(String or File): The name of a raster function, or function chain (in .rft.xml format)
    function_arguments(Dict):The parameter name in the raster function or function chain as the key and their values as the value. If not specified, default values (if existed) would be used
    aggregation_definition(Dict): defines the dimension interval for which the data will be aggregated. The key-value pairs should follow one of the formats below If not specified, all slices along the dimension will be aggregated.
        1.'interval': interval_keyword
        use the interval keyword only when the dimension_name is a time dimension. Interval keywords include Hourly, Daily, Weekly, Monthly, Quarterly, Yearly
        2. 'recurrent_interval': recurrent_interval_keyword
        use the recurrent interval keyword only when the dimension_name is a time dimension. Recurrent interval keywords include Daily, Weekly Monthly, Quarterly
        3.'interval_value': v, 'interval_unit': u
        use the interval value and unit when you want to define recurring intervals
        4.'interval_ranges': [(min,max),(min,max), ...]
        user the interval ranges option to define custom intervals for aggregation
    dimensionless(bool): indicates whether the output should be dimensionless raster. This is only possible when the output has a single slice.
    Returns:
    out_raster(Raster): The output aggregated multidimensional raster."""
    raster_function_dict = {
        "MajorityIgnoreNoData": "MajorityContinueOnNoData",
        "MaxIgnoreNoData":"MaxContinueOnNoData",
        "MeanIgnoreNoData":"MeanContinueOnNoData",
        "MedianIgnoreNoData":"MedContinueOnNoData",
        "MinIgnoreNoData":"MinContinueOnNoData",
        "MinorityIgnoreNoData":"MinorityContinueOnNoData",
        "RangeIgnoreNoData":"RangeContinueOnNoData",
        "StdIgnoreNoData": "StdContinueOnNoData",
        "SumIgnoreNoData":"SumContinueOnNoData",
        "VarietyIgnoreNoData":"VarietyContinueOnNoData",
    }
    if raster_function in list(raster_function_dict.keys()):
        raster_function = raster_function_dict[raster_function]

    return arcgisscripting._ia.Aggregate(in_raster=in_raster,
                                         dimension_name=dimension_name,
                                         raster_function=raster_function,
                                         raster_function_arguments=raster_function_arguments,
                                         aggregation_definition=aggregation_definition,
                                         dimensionless=dimensionless)


def Foreach(in_raster, raster_function, raster_function_arguments=None):
    """Foreach(in_raster, raster_function, {raster_function_arguments})

    Apply a raster function or a function chain to every slice in the multidimensional raster.

    Parameters:
    in_raster(Raster):the input multidimensional raster dataset
    raster_function(String or File): the name of a raster function, or function chain (in .rft.xml format)
    Function_arguments(Dict):the parameters and values associated with the raster function or function chain. If not specified, default values (if existed) would be used
    Returns:
    out_raster(Raster): The output multidimensional raster"""

    return arcgisscripting._ia.Foreach(in_raster=in_raster,
                                       raster_function=raster_function,
                                       raster_function_arguments=raster_function_arguments)


def Apply(in_raster, raster_function, raster_function_arguments=None):
    """ Apply(in_raster, raster_function, {raster_function_arguments})

    Apply a raster function or function chain to raster(s).

    Parameters:
    in_raster(Raster): The input raster dataset or datasets. The input may include the following:
    1. a single raster: for raster functions that requrie one raster input.
    2. (raster1, raster2,...): for raster functions that requrie two or more raster inputs
    3. [raster1, raster2,...]: for raster functions that require an array of raster inputs
    4. {variable_name1: raster1, variable_name2: raster2,...}: for raster functions that require a set of named raster inputs
    raster_function(String or File): The name of a raster function, or function chain (in .rft.xml format)
    function_arguments(Dict):The parameters and values associated with the raster function or function chain. If not specified, default values (if existed) would be used
    Returns:
    out_raster(Raster): The output raster dataset with the function applied."""

    return arcgisscripting._ia.Apply(in_raster=in_raster,
                                     raster_function=raster_function,
                                     raster_function_arguments=raster_function_arguments)


def Anomaly(in_raster, dimension_name='StdTime', anomaly_type='DIFFERENCE_FROM_MEAN', temporal_interval=None,
            ignore_nodata=True):
    """ Anomaly(in_raster, {dimension_name}, {anomaly_type}, {temporal_interval}, {ignore_nodata})

    Calculate the anomaly over time, i.e., how it is different from the mean

    Parameters:
    in_raster(Raster):the raster which the anamaly calculation is performed on
    dimension_name(String): the dimension name which the anomaly definition will be performed along. the default value is 'StdTime'
    anomaly_type(String): method used to calculate anomaly
        1. DIFFERENCE_FROM_MEAN (default): calculate value - mean_value
        2. PERCENT_DIFFERENCE_FROM_MEAN: (value - mean_value)/((value + mean_value)/2)
        3. PERCENT_OF_MEAN: value/mean_value
    temporal_interval: defines the temporal interval including YEARLY, QUARTERLY, MONTHLY, WEEKLY, DAILY, HOURLY. it will calculate an average for each interval and subtract it from the slices within that interval. Default value is None, which means calculating the average using all slices.
    ignore_nodata: default True. The output will be computed by only considering the cells with valid data. Otherwise, if the processing cell location for any of the slices is NoData, then the outputs for that cell on every slice will be NoData.
    Returns:
    out_raster(Raster): The raster which shows how different each slice in the input raster is different from the mean."""

    # check if anomaly_type has valid inputs
    valid_anomaly_type = ['DIFFERENCE_FROM_MEAN', 'PERCENT_DIFFERENCE_FROM_MEAN', 'PERCENT_OF_MEAN']
    if anomaly_type not in valid_anomaly_type:
        raise ValueError("anomaly_type should be one of %r." % valid_anomaly_type)

    # check if temporal_interval has valid inputs
    valid_temporal_interval = [None, 'yearly', 'quarterly', 'monthly', 'weekly', 'daily', 'hourly']
    if temporal_interval is not None and temporal_interval.lower() not in valid_temporal_interval:
        raise ValueError("temporal_interval should be one of %r." % valid_temporal_interval)

    # prepare aggregation_definition
    agg_def = None
    if temporal_interval is not None:
        if temporal_interval.lower()  in ['quarterly', 'monthly', 'weekly', 'daily']:
            agg_def = {"recurrent_interval": temporal_interval.lower() }
        else: # for hourly and yearly
            agg_def = {"interval": temporal_interval.lower() }

    # check which Mean raster function to use
    rf = "MeanContinueOnNoData"
    if not ignore_nodata:
        rf = "Mean"

    # calcualte average
    agg_output = arcgisscripting._ia.Aggregate(in_raster=in_raster,
                                               dimension_name=dimension_name,
                                               raster_function=rf,
                                               aggregation_definition=agg_def)

    # save aggregation output to avoid repetitive on-the-fly calculations
    agg_output_path = str(agg_output).lower().replace(".afr", "") + ".crf"
    if not os.path.exists(agg_output_path):
        agg_output.save(agg_output_path)  # persist it if not exist

    # load the aggregation output raster
    mean_condition = Raster(agg_output_path, True)

    # calculate anomaly
    if anomaly_type == "PERCENT_DIFFERENCE_FROM_MEAN":
        return (in_raster - mean_condition) / ((in_raster + mean_condition) / 2)
    elif anomaly_type == "PERCENT_OF_MEAN":
        return in_raster / mean_condition
    else:  # anomaly_method = "Difference_From_Mean" default value
        return in_raster - mean_condition


def Render(in_raster, rendering_rule=None, colormap=None):
    """render raster for display

    Parameters:
     in_raster(Raster):the raster to be rendered
     rendering_rule(Dict): optional. defines how the pixel values in the input raster should be processed for
        enhancing the appearance of the image or composited for RGB display. The supported keys include
                    bands: a list of band indexes to be mapped to RGB
                    min: single value or a list of values (one per band)
                    max: single value or a list of values (one per band)
                    numberOfStandardDeviations: single value
                    gamma: single value or a list of values (one per band)
                    rft: the path to a raster function template (in .rft.xml format)
     colormap (String or List or Dict): optional. defines colors to be used for rendering.
        This parameter is only used for rendering single band raster. Its value could be any of the followings:
          1. a color map name or color ramp name supported in ArcGIS Pro, e.g., "NDVI", "Red to Green", etc.
          2. a list of hex color codes and/or named colors, e.g., ["#B0C4DE", "red", …]
          3. a dict with the following key-value pairs
                                             "values": [pixel_value1, pixel_value2,...]
                                             "colors": [color1, color2,...]
                                             "labels": [label1, label2, ...]
    Returns:
      out_raster(Raster): The rendered raster
    Examples:
      arcpy.ia.Render(inRaster, rendering_rule = {'min': 0, 'max': 0.8}, colormap=  'NDVI')
      arcpy.ia.Render(landsat7_raster, rendering_rule = {'bands': [3, 2, 1], 'numberOfStandardDeviations': 2, 'gamma': 1.5})
      arcpy.ia.Render(nlcd_land_cover_raster, colormap = { "values": [11, 21, 22, 23, 24, 31, 41, 42, 43, 52, 71, 81, 82, 90, 95],
        "colors": ['#486DA2', '#E1CDCE', '#DC9881', 'red', '#AB0101', '#B3AFA4', '#6CA966', '#1D6533', '#BDCC93', '#B69E48', '#EDECCD', '#DDD83E', '#AE7229', '#BBD7ED', '#71A4C1']})
    """
    if rendering_rule is None and colormap is None:
        raise ValueError('rendering_rule and colormap must not be both None')

    return arcgisscripting._ia.Render(in_raster, rendering_rule, colormap)


def Clip(in_raster, aoi):
    """
    Cuts out a portion of a raster

    Parameters:
               in_raster (raster): the raster object that you want to clip.
               aoi (feature, feature layer, raster dataset, raster layer, extent, polygon geometry): defines the area of interest
    Returns:
           out_raster(raster): the raster that has been clipped
    """
    aoi = get_aoi(aoi)
    return arcgisscripting._ia.Clip(in_raster, aoi)


def Merge(rasters, resolve_overlap="First"):
    """ merge a list of raster to one raster

        Parameters:
                   rasters (raster): a list of rasters to be merged
                   resolve_overlap (String): the method used to handle overlapping areas, including First(default),
                   Last, Min, Max, Mean and Sum
        Returns:
               out_raster(raster): the raster that has been merged
    """
    return arcgisscripting._ia.Merge(rasters, resolve_overlap)


class Utilities:
    def GetStdTime(self, time_value, time_properties):
        return arcgisscripting._ia.GetStdTime(time_value = time_value, time_properties = time_properties)

    def StandardizeMultidimensionalInfo(self, mdinfo):
        return arcgisscripting._ia.StandardizeMultidimensionalInfo(mdinfo)

    def ConstructSpatialReferenceFromParameters(self, srs_params):
        return arcgisscripting._ia.ConstructSpatialReferenceFromParameters(srs_params)


utils = Utilities()
