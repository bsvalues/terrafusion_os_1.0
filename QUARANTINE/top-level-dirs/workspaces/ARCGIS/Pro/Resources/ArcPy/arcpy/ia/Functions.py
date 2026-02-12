# COPYRIGHT 2013-2024 ESRI
#
# TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
# Unpublished material - all rights reserved under the
# Copyright Laws of the United States.
#
# For additional information, contact:
# Environmental Systems Research Institute, Inc.
# Attn: Contracts Dept
# 380 New York Street
# Redlands, California, USA 92373
#
# email: contracts@esri.com
#
# Warning: This module is automatically generated, changes will be overwritten.
from arcgisscripting import _wrapToolRaster, _wrapLocalFunctionRaster
import arcpy
from ..sa import ParameterClasses
from ..sa import Utils
from arcpy.sa import Raster
from typing import Literal


__all__ = [
    "Abs",
    "ACos",
    "ACosH",
    "AggregateMultidimensionalRaster",
    "AnalyzeChangesUsingCCDC",
    "AnalyzeChangesUsingLandTrendr",
    "ApplyCoregistration",
    "ApplyGeometricTerrainCorrection",
    "ApplyOrbitCorrection",
    "ApplyRadiometricCalibration",
    "ApplyRadiometricTerrainFlattening",
    "ASin",
    "ASinH",
    "ATan",
    "ATan2",
    "ATanH",
    "BitwiseAnd",
    "BitwiseLeftShift",
    "BitwiseNot",
    "BitwiseOr",
    "BitwiseRightShift",
    "BitwiseXOr",
    "BooleanAnd",
    "BooleanNot",
    "BooleanOr",
    "BooleanXOr",
    "CellStatistics",
    "ClassifyObjectsUsingDeepLearning",
    "ClassifyPixelsUsingDeepLearning",
    "ClassifyRaster",
    "ClassifyRasterUsingSpectra",
    "CombinatorialAnd",
    "CombinatorialOr",
    "CombinatorialXOr",
    "ComputeAccuracyForObjectDetection",
    "ComputeChangeRaster",
    "ComputeCoherence",
    "ComputeConfusionMatrix",
    "ComputeSARIndices",
    "ComputeSegmentAttributes",
    "Con",
    "ConvertSARUnits",
    "Cos",
    "CosH",
    "CreateAccuracyAssessmentPoints",
    "CreateBinaryMask",
    "CreateColorComposite",
    "Deburst",
    "DeepLearningModelToEcd",
    "Despeckle",
    "DetectBrightOceanObjects",
    "DetectChangeUsingChangeAnalysisRaster",
    "DetectChangeUsingDeepLearning",
    "DetectControlPoints",
    "DetectDarkOceanAreas",
    "DetectObjectsUsingDeepLearning",
    "DetectObjectsUsingText",
    "Diff",
    "DimensionalMovingStatistics",
    "Divide",
    "DownloadOrbitFile",
    "EqualTo",
    "Exp",
    "Exp10",
    "Exp2",
    "ExportTrainingDataForDeepLearning",
    "ExtractFeaturesUsingAIModels",
    "ExtractVideoFramesToImages",
    "ExtractWater",
    "FindArgumentStatistics",
    "Float",
    "FocalStatistics",
    "GenerateMultidimensionalAnomaly",
    "GenerateTrainingSamplesFromSeedPoints",
    "GenerateTrendRaster",
    "GreaterThan",
    "GreaterThanEqual",
    "InList",
    "InspectTrainingSamples",
    "Int",
    "InterpolateFromSpatiotemporalPoints",
    "IsNull",
    "LessThan",
    "LessThanEqual",
    "LinearSpectralUnmixing",
    "Ln",
    "Log10",
    "Log2",
    "Minus",
    "Mod",
    "MultidimensionalPrincipalComponents",
    "MultidimensionalRasterCorrelation",
    "Multilook",
    "Negate",
    "NonMaximumSuppression",
    "NotEqual",
    "OptimalInterpolation",
    "Over",
    "Pick",
    "Plus",
    "Power",
    "PredictUsingRegressionModel",
    "PredictUsingTrendRaster",
    "RemoveRasterSegmentTilingArtifacts",
    "RemoveThermalNoise",
    "RoundDown",
    "RoundUp",
    "Sample",
    "SegmentMeanShift",
    "SetNull",
    "Sin",
    "SinH",
    "Square",
    "SquareRoot",
    "SummarizeCategoricalRaster",
    "Tan",
    "TanH",
    "Test",
    "Times",
    "TrainDeepLearningModel",
    "TrainIsoClusterClassifier",
    "TrainKNearestNeighborClassifier",
    "TrainMaximumLikelihoodClassifier",
    "TrainRandomTreesClassifier",
    "TrainRandomTreesRegressionModel",
    "TrainSupportVectorMachineClassifier",
    "TrainUsingAutoDL",
    "UpdateAccuracyAssessmentPoints",
    "VideoMetadataToFeatureClass",
    "VideoMultiplexer",
    "WeightedSum",
    "ZonalStatistics",
    "ZonalStatisticsAsTable",
    "ApplyEnvironment",
    "FloatDivide",
    "FloorDivide",
]


def Abs(in_raster_or_constant) -> Raster:
    """Abs_ia(in_raster_or_constant)

       Calculates the absolute value of the cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input raster for which to calculate the absolute values.To use a
         number as an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the absolute value of the cells
         of the input
         raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("Abs_sa", ["Abs", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


Abs.__esri_toolname__ = "Abs_ia"
Abs.__esri_toolinfo__ = ["::::1"]


def ACos(in_raster_or_constant) -> Raster:
    """ACos_ia(in_raster_or_constant)

       Calculates the inverse cosine of cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input for which to calculate the inverse cosine values.To use a
         number as an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The values are the inverse cosine of the input
         values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("ACos_sa", ["ACos", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


ACos.__esri_toolname__ = "ACos_ia"
ACos.__esri_toolinfo__ = ["::::1"]


def ACosH(in_raster_or_constant) -> Raster:
    """ACosH_ia(in_raster_or_constant)

       Calculates the inverse hyperbolic cosine of cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input for which to calculate the inverse hyperbolic cosine
         values.To use a number as an input for this parameter, the cell size
         and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The values are the inverse hyperbolic cosine of the
         input values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("ACosH_sa", ["ACosH", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


ACosH.__esri_toolname__ = "ACosH_ia"
ACosH.__esri_toolinfo__ = ["::::1"]


def AggregateMultidimensionalRaster(
    in_multidimensional_raster,
    dimension,
    aggregation_method: Literal[
        "MEAN",
        "MINIMUM",
        "MAXIMUM",
        "MINORITY",
        "MAJORITY",
        "MEDIAN",
        "RANGE",
        "STD",
        "SUM",
        "VARIETY",
        "PERCENTILE",
        "CUSTOM",
        "#",
    ]
    | None = "#",
    variables="#",
    aggregation_def: Literal["ALL", "INTERVAL_KEYWORD", "INTERVAL_VALUE", "INTERVAL_RANGES", "#"] | None = "#",
    interval_keyword: Literal[
        "HOURLY",
        "DAILY",
        "WEEKLY",
        "DEKADLY",
        "PENTADLY",
        "MONTHLY",
        "QUARTERLY",
        "YEARLY",
        "RECURRING_DAILY",
        "RECURRING_WEEKLY",
        "RECURRING_MONTHLY",
        "RECURRING_QUARTERLY",
        "#",
    ]
    | None = "#",
    interval_value="#",
    interval_unit: Literal["HOURS", "DAYS", "WEEKS", "MONTHS", "YEARS", "#"] | None = "#",
    interval_ranges="#",
    aggregation_function="#",
    ignore_nodata: Literal["DATA", "NODATA", "#"] | None = "#",
    dimensionless: Literal["NO_DIMENSIONS", "DIMENSIONS", "#"] | None = "#",
    percentile_value="#",
    percentile_interpolation_type: Literal["NEAREST", "LINEAR", "#"] | None = "#",
) -> Raster:
    """AggregateMultidimensionalRaster_ia(in_multidimensional_raster, dimension, {aggregation_method}, {variables;variables...}, {aggregation_def}, {interval_keyword}, {interval_value}, {interval_unit}, {interval_ranges;interval_ranges...}, {aggregation_function}, {ignore_nodata}, {dimensionless}, {percentile_value}, {percentile_interpolation_type})

       Generates a multidimensional raster dataset by combining existing
       multidimensional raster variables along a dimension.

    INPUTS:
     in_multidimensional_raster (Raster Dataset / Mosaic Dataset / Raster Layer / Mosaic Layer / Image Service / File):
         The input multidimensional raster dataset.
     dimension (String):
         The aggregation dimension. This is the dimension along which the
         variables will be aggregated.
     aggregation_method {String}:
         Specifies the mathematical method that will be used to combine the
         aggregated slices in an interval.MEAN-The mean of a pixel's values
         will be calculated across all slices
         in the interval. This is the default.MAXIMUM-The maximum value of a
         pixel will be calculated across all
         slices in the interval.MAJORITY-The pixel value that occurred most
         frequently will be
         calculated across all slices in the interval.MINIMUM-The minimum value
         of a pixel will be calculated across all
         slices in the interval.MINORITY-The pixel value that occurred least
         frequently will be
         calculated across all slices in the interval.MEDIAN-The median value
         of a pixel will be calculated across all
         slices in the interval. PERCENTILE-The percentile of values
         for a pixel will be
         calculated across all slices in the interval. The 90th percentile is
         calculated by default. You can specify other values (from 0 to 100)
         using theparameter. Percentile valueRANGE-The range of values
         for a pixel will be calculated across all
         slices in the interval.STD-The standard deviation of a pixel's values
         will be calculated
         across all slices in the interval.SUM-The sum of a pixel's values will
         be calculated across all slices
         in the interval.VARIETY-The number of unique pixel values will be
         calculated across
         all slices in the interval.CUSTOM-The pixel value will be calculated
         based on a custom raster
         function.When aggregation_method is set to CUSTOM, the
         aggregation_function
         parameter becomes enabled.
     variables {String}:
         The variable or variables that will be aggregated along the given
         dimension. If no variable is specified, all variables with the
         selected dimension will be aggregated.For example, to aggregate daily
         temperature data into monthly average
         values, specify temperature as the variable to be aggregated. If you
         do not specify any variables and you have both daily temperature and
         daily precipitation variables, both variables will be aggregated into
         monthly averages and the output multidimensional raster will include
         both variables.
     aggregation_def {String}:
         Specifies the dimension interval for which the data will be
         aggregated.ALL-The data values will be aggregated across all slices.
         This is the
         default.INTERVAL_KEYWORD-The variable data will be aggregated using a
         commonly
         known interval.INTERVAL_VALUE-The variable data will be aggregated
         using a user-
         specified interval and unit.INTERVAL_RANGES-The variable data will be
         aggregated between specified
         pairs of values or dates.
     interval_keyword {String}:
         Specifies the keyword interval that will be used when aggregating
         along the dimension. This parameter is required when the
         aggregation_def parameter is set to INTERVAL_KEYWORD and the
         aggregation must be across time.HOURLY-The data values will be
         aggregated into hourly time steps, and
         the result will include every hour in the time series.DAILY-The data
         values will be aggregated into daily time steps, and
         the result will include every day in the time series.WEEKLY-The data
         values will be aggregated into weekly time steps, and
         the result will include every week in the time series.DEKADLY-The data
         values will be aggregated into 3 periods of 10 days
         each. The last period can contain more or fewer than 10 days. The
         output will include 3 slices for each month.PENTADLY-The data values
         will be aggregated into 6 periods of 5 days
         each. The last period can contain more or fewer than 5 days. The
         output will include 6 slices for each month.MONTHLY-The data values
         will be aggregated into monthly time steps,
         and the result will include every month in the time
         series.QUARTERLY-The data values will be aggregated into quarterly
         time
         steps, and the result will include every quarter in the time
         series.YEARLY-The data values will be aggregated into yearly time
         steps, and
         the result will include every year in the time
         series.RECURRING_DAILY-The data values will be aggregated into daily
         time
         steps, and the result will include one aggregated value per Julian
         day. The output will include, at most, 366 daily time
         slices.RECURRING_WEEKLY-The data values will be aggregated into weekly
         time
         steps, and the result will include one aggregated value per week. The
         output will include, at most, 53 weekly time
         slices.RECURRING_MONTHLY-The data values will be aggregated into
         monthly time
         steps, and the result will include one aggregated value per month. The
         output will include, at most, 12 monthly time
         slices.RECURRING_QUARTERLY-The data values will be aggregated into
         quarterly
         time steps, and the result will include one aggregated value per
         quarter. The output will include, at most, 4 quarterly time slices.
     interval_value {Double}:
         The size of the interval that will be used for the aggregation. This
         parameter is required when the aggregation_def parameter is set to
         INTERVAL_VALUE.For example, to aggregate 30 years of monthly
         temperature data into
         5-year increments, enter 5 as the interval_value, and specify
         interval_unit as YEARS.
     interval_unit {String}:
         The unit that will be used for the interval_value parameter. This
         parameter is required when the dimension parameter is set to a time
         field and the aggregation_def parameter is set to INTERVAL_VALUE.If
         you are aggregating anything other than time, this option will not
         be available and the unit for the interval value will match the
         variable unit of the input multidimensional raster data.HOURS-The data
         values will be aggregated into hourly time slices at
         the interval provided.DAYS-The data values will be aggregated into
         daily time slices at the
         interval provided.WEEKS-The data values will be aggregated into weekly
         time slices at
         the interval provided.MONTHS-The data values will be aggregated into
         monthly time slices at
         the interval provided.YEARS-The data values will be aggregated into
         yearly time slices at
         the interval provided.
     interval_ranges {Value Table}:
         Interval ranges specified in a value table will be used to aggregate
         groups of values. The value table consists of pairs of minimum and
         maximum range values, with data type Double or Date.This parameter is
         required when the aggregation_def parameter is set
         to INTERVAL_RANGE.
     aggregation_function {File / String}:
         A custom raster function that will be used to compute the pixel values
         of the aggregated rasters. The input is a raster function JSON object
         or an .rft.xml file created from a function chain or a custom Python
         raster function.This parameter is required when the aggregation_method
         parameter is
         set to CUSTOM.
     ignore_nodata {Boolean}:
         Specifies whether NoData values will be ignored in the
         analysis.DATA-The analysis will include all valid pixels along a given
         dimension and ignore NoData pixels. This is the default.NODATA-The
         analysis will result in NoData if there are NoData values
         for the pixels along the given dimension.
     dimensionless {Boolean}:
         Specifies whether the layer will have dimension values. This parameter
         is only enabled if a single slice is selected to create a
         layer.NO_DIMENSIONS-The layer will not have dimension
         values.DIMENSIONS-The
         layer will have dimension values. This is the default.
     percentile_value {Double}:
         The percentile that will be calculated. The default is 90, indicating
         the 90th percentile.The values can range from 0 to 100. The 0th
         percentile is essentially
         equivalent to the minimum statistic, and the 100th percentile is
         equivalent to maximum. A value of 50 will produce essentially the same
         result as the median statistic.This parameter is only supported if the
         statistics_type parameter is
         set to PERCENTILE.
     percentile_interpolation_type {String}:
         Specifies the method of percentile interpolation that will be used
         when there is an even number of values from the input raster to be
         calculated.NEAREST-The nearest available value to the desired
         percentile will be
         used. In this case, the output pixel type will be the same as that of
         the input value raster.LINEAR-The weighted average of the two
         surrounding values from the
         desired percentile will be used. In this case, the output pixel type
         will be floating point.

    OUTPUTS:
     out_multidimensional_raster (Raster Dataset):
         The output Cloud Raster Format (CRF) multidimensional raster dataset."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_multidimensional_raster,
        dimension,
        aggregation_method,
        variables,
        aggregation_def,
        interval_keyword,
        interval_value,
        interval_unit,
        interval_ranges,
        aggregation_function,
        ignore_nodata,
        dimensionless,
        percentile_value,
        percentile_interpolation_type,
    ):
        out_multidimensional_raster = "#"
        result = arcpy.gp.AggregateMultidimensionalRaster_ia(
            in_multidimensional_raster,
            dimension,
            out_multidimensional_raster,
            aggregation_method,
            variables,
            aggregation_def,
            interval_keyword,
            interval_value,
            interval_unit,
            interval_ranges,
            aggregation_function,
            ignore_nodata,
            dimensionless,
            percentile_value,
            percentile_interpolation_type,
        )
        return _wrapToolRaster("AggregateMultidimensionalRaster_sa", str(result.getOutput(0)))

    return Wrapper(
        in_multidimensional_raster,
        dimension,
        aggregation_method,
        variables,
        aggregation_def,
        interval_keyword,
        interval_value,
        interval_unit,
        interval_ranges,
        aggregation_function,
        ignore_nodata,
        dimensionless,
        percentile_value,
        percentile_interpolation_type,
    )


AggregateMultidimensionalRaster.__esri_toolname__ = "AggregateMultidimensionalRaster_ia"
AggregateMultidimensionalRaster.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
    "::::13",
    "::::14",
    "::::15",
]


def AnalyzeChangesUsingCCDC(
    in_multidimensional_raster,
    bands="#",
    tmask_bands="#",
    chi_squared_threshold="#",
    min_anomaly_observations="#",
    update_frequency="#",
) -> Raster:
    """AnalyzeChangesUsingCCDC_ia(in_multidimensional_raster, out_ccdc_result, {bands;bands...}, {tmask_bands;tmask_bands...}, {chi_squared_threshold}, {min_anomaly_observations}, {update_frequency})

       Evaluates changes in pixel values over time using the Continuous
       Change Detection and Classification (CCDC) method and generates a
       change analysis raster containing the model results.

    INPUTS:
     in_multidimensional_raster (Raster Dataset / Mosaic Dataset / Mosaic Layer / Raster Layer / Image Service):
         The input multidimensional raster dataset.
     bands {Long}:
         The band IDs to use for change detection. If no band IDs are provided,
         all the bands from the input raster dataset will be used.
     tmask_bands {Long}:
         The band IDs to be used in the temporal mask (Tmask). It is
         recommended that you use the green band and the SWIR band. If no band
         IDs are provided, no masking will occur.
     chi_squared_threshold {Double}:
         The chi-square statistic change probability threshold. If an
         observation has a calculated change probability that is above this
         threshold, it is flagged as an anomaly, which is a potential change
         event. The default value is 0.99.
     min_anomaly_observations {Long}:
         The minimum number of consecutive anomaly observations that must occur
         before an event is considered a change. A pixel must be flagged as an
         anomaly for the specified number of consecutive time slices before it
         is considered a true change. The default value is 6.
     update_frequency {Double}:
         The frequency, in years, at which to update the time series model with
         new observations. The default value is 1.

    OUTPUTS:
     out_ccdc_result (Raster Dataset):
         The output Cloud Raster Format (CRF) multidimensional raster
         dataset.The output change analysis raster containing model information
         from
         the CCDC analysis."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_multidimensional_raster,
        bands,
        tmask_bands,
        chi_squared_threshold,
        min_anomaly_observations,
        update_frequency,
    ):
        out_ccdc_result = "#"
        result = arcpy.gp.AnalyzeChangesUsingCCDC_ia(
            in_multidimensional_raster,
            out_ccdc_result,
            bands,
            tmask_bands,
            chi_squared_threshold,
            min_anomaly_observations,
            update_frequency,
        )
        return _wrapToolRaster("AnalyzeChangesUsingCCDC_sa", str(result.getOutput(0)))

    return Wrapper(
        in_multidimensional_raster,
        bands,
        tmask_bands,
        chi_squared_threshold,
        min_anomaly_observations,
        update_frequency,
    )


AnalyzeChangesUsingCCDC.__esri_toolname__ = "AnalyzeChangesUsingCCDC_ia"
AnalyzeChangesUsingCCDC.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7"]


def AnalyzeChangesUsingLandTrendr(
    in_multidimensional_raster,
    processing_band="#",
    snapping_date="#",
    max_num_segments="#",
    vertex_count_overshoot="#",
    spike_threshold="#",
    recovery_threshold="#",
    prevent_one_year_recovery: Literal["PREVENT_ONE_YEAR_RECOVERY", "ALLOW_ONE_YEAR_RECOVERY", "#"] | None = "#",
    recovery_trend: Literal["INCREASING_TREND", "DECREASING_TREND", "#"] | None = "#",
    min_num_observations="#",
    best_model_proportion="#",
    pvalue_threshold="#",
    output_other_bands: Literal["INCLUDE_OTHER_BANDS", "EXCLUDE_OTHER_BANDS", "#"] | None = "#",
) -> Raster:
    """AnalyzeChangesUsingLandTrendr_ia(in_multidimensional_raster, {processing_band}, {snapping_date}, {max_num_segments}, {vertex_count_overshoot}, {spike_threshold}, {recovery_threshold}, {prevent_one_year_recovery}, {recovery_trend}, {min_num_observations}, {best_model_proportion}, {pvalue_threshold}, {output_other_bands})

       Evaluates changes in pixel values over time using the Landsat-based
       detection of trends in disturbance and recovery (LandTrendr) method
       and generates a change analysis raster containing the model results.

    INPUTS:
     in_multidimensional_raster (Raster Dataset / Mosaic Dataset / Raster Layer / Mosaic Layer / Image Service / File):
         The input multidimensional raster dataset.
     processing_band {String}:
         The image band name to use for segmenting the pixel value trajectories
         over time. Choose the band name that will best capture the changes in
         the feature you want to observe.If no band value is specified and the
         input is multiband imagery, the
         first band in the multiband image will be used.
     snapping_date {String}:
         The date used to identify a slice for each year in the input
         multidimensional dataset. The slice with the date closest to the
         snapping date will be used. This parameter is required if the input
         dataset contains sub-yearly data.The default is 06-30, or June 30,
         which is approximately midway
         through a calendar year.
     max_num_segments {Long}:
         The maximum number of segments to be fitted to the time series for
         each pixel. The default is 5.
     vertex_count_overshoot {Long}:
         The number of additional vertices beyond max_num_segments + 1 that can
         be used to fit the model during the initial stage of identifying
         vertices. Later in the modeling process, the number of additional
         vertices will be reduced to max_num_segments + 1. The default is 2.
     spike_threshold {Double}:
         The threshold to use for dampening spikes or anomalies in the pixel
         value trajectory. The value must range between 0 and 1 in which 1
         means no dampening. The default is 0.9.
     recovery_threshold {Double}:
         The recovery threshold value in years. If a segment has a recovery
         rate that is faster than 1/recovery threshold, the segment is
         discarded and not included in the time series model. The value must
         range between 0 and 1. The default is 0.25.
     prevent_one_year_recovery {Boolean}:
         Specifies whether segments that exhibit a one year recovery will be
         excluded.ALLOW_ONE_YEAR_RECOVERY-Segments that exhibit a one year
         recovery will
         not be excluded.PREVENT_ONE_YEAR_RECOVERY-Segments that exhibit a one
         year recovery
         will be excluded. This is the default.
     recovery_trend {Boolean}:
         Specifies whether the recovery has an increasing (positive)
         trend.INCREASING_TREND-The recovery has an increasing trend. This is
         the
         default.DECREASING_TREND-The recovery has a decreasing trend.
     min_num_observations {Long}:
         The minimum number of valid observations required to perform fitting.
         The number of years in the input multidimensional dataset must be
         equal to or greater than this value. The default is 6.
     best_model_proportion {Double}:
         The best model proportion value. During the model selection process,
         the tool will calculate the p-value for each model and identify a
         model that has the most vertices while maintaining the smallest (most
         significant) p-value based on this proportion value. A value of 1
         means the model has the lowest p-value but may not have a high number
         of vertices. The default is 1.25.
     pvalue_threshold {Double}:
         The p-value threshold for a model to be selected. After the vertices
         are detected in the initial stage of the model fitting, the tool will
         fit each segment and calculate the p-value to determine the
         significance of the model. On the next iteration, the model will
         decrease the number of segments by one and recalculate the p-value.
         This will continue and, if the p-value is smaller than the value
         specified in this parameter, the model will be selected and the tool
         will stop searching for a better model. If no such model is selected,
         the tool will select a model with a p-value smaller than the lowest
         p-value × best model proportion value. The default is 0.01.
     output_other_bands {Boolean}:
         Specifies whether other bands will be included in the segmentation
         process.INCLUDE_OTHER_BANDS-Other bands will be included. The
         segmentation and
         vertices information from the initial segmentation band specified in
         the processing_band parameter will also be fitted to the remaining
         bands in the multiband images. The model results will include the
         segmentation band first, then the remaining
         bands.EXCLUDE_OTHER_BANDS-Other bands will not be included. This is
         the
         default.

    OUTPUTS:
     out_multidimensional_raster (Raster Dataset):
         The output Cloud Raster Format (CRF) multidimensional raster
         dataset.The output change analysis raster containing model information
         from
         the LandTrendr analysis."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_multidimensional_raster,
        processing_band,
        snapping_date,
        max_num_segments,
        vertex_count_overshoot,
        spike_threshold,
        recovery_threshold,
        prevent_one_year_recovery,
        recovery_trend,
        min_num_observations,
        best_model_proportion,
        pvalue_threshold,
        output_other_bands,
    ):
        out_multidimensional_raster = "#"
        result = arcpy.gp.AnalyzeChangesUsingLandTrendr_ia(
            in_multidimensional_raster,
            out_multidimensional_raster,
            processing_band,
            snapping_date,
            max_num_segments,
            vertex_count_overshoot,
            spike_threshold,
            recovery_threshold,
            prevent_one_year_recovery,
            recovery_trend,
            min_num_observations,
            best_model_proportion,
            pvalue_threshold,
            output_other_bands,
        )
        return _wrapToolRaster("AnalyzeChangesUsingLandTrendr_sa", str(result.getOutput(0)))

    return Wrapper(
        in_multidimensional_raster,
        processing_band,
        snapping_date,
        max_num_segments,
        vertex_count_overshoot,
        spike_threshold,
        recovery_threshold,
        prevent_one_year_recovery,
        recovery_trend,
        min_num_observations,
        best_model_proportion,
        pvalue_threshold,
        output_other_bands,
    )


AnalyzeChangesUsingLandTrendr.__esri_toolname__ = "AnalyzeChangesUsingLandTrendr_ia"
AnalyzeChangesUsingLandTrendr.__esri_toolinfo__ = [
    "::::1",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
    "::::13",
    "::::14",
]


def ApplyCoregistration(
    in_reference_radar_data,
    in_secondary_radar_data,
    in_dem_raster,
    geoid: Literal["GEOID", "NONE", "#"] | None = "#",
    polarization_bands="#",
) -> Raster:
    """ApplyCoregistration_ia(in_reference_radar_data, in_secondary_radar_data, in_dem_raster, {geoid}, {polarization_bands;polarization_bands...})

       Resamples the secondary single look complex (SLC) data to the
       reference SLC grid using a digital elevation model (DEM) and orbit
       state vector metadata.

    INPUTS:
     in_reference_radar_data (Raster Dataset / Raster Layer):
         The input reference radar data.
     in_secondary_radar_data (Raster Dataset / Raster Layer):
         The input secondary radar data.
     in_dem_raster (Mosaic Layer / Raster Layer):
         The DEM raster that will be used to estimate the local illuminated
         area.
     geoid {Boolean}:
         Specifies whether the vertical reference system of the input DEM will
         be transformed to ellipsoidal height. Most elevation datasets are
         referenced to sea level orthometric height, so a correction is
         required in these cases to convert to ellipsoidal height.GEOID-A geoid
         correction will be made to convert orthometric height to
         ellipsoidal height (based on EGM96 geoid). This is the default.NONE-No
         geoid correction will be made. Use this option only if the DEM
         is provided in ellipsoidal height.
     polarization_bands {String}:
         The polarization bands that will be corrected.The first band is
         selected by default.

    OUTPUTS:
     out_secondary_radar_data (Raster Dataset):
         The output secondary radar data coregistered to the reference radar
         data."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_reference_radar_data, in_secondary_radar_data, in_dem_raster, geoid, polarization_bands):
        out_secondary_radar_data = "#"
        result = arcpy.gp.ApplyCoregistration_ia(
            in_reference_radar_data,
            in_secondary_radar_data,
            out_secondary_radar_data,
            in_dem_raster,
            geoid,
            polarization_bands,
        )
        return _wrapToolRaster("ApplyCoregistration_sa", str(result.getOutput(0)))

    return Wrapper(in_reference_radar_data, in_secondary_radar_data, in_dem_raster, geoid, polarization_bands)


ApplyCoregistration.__esri_toolname__ = "ApplyCoregistration_ia"
ApplyCoregistration.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "::::6"]


def ApplyGeometricTerrainCorrection(
    in_radar_data, polarization_bands="#", in_dem_raster="#", geoid: Literal["GEOID", "NONE", "#"] | None = "#"
) -> Raster:
    """ApplyGeometricTerrainCorrection_ia(in_radar_data, {polarization_bands;polarization_bands...}, {in_dem_raster}, {geoid})

       Orthorectifies the input synthetic aperture radar (SAR) data using a
       range-Doppler backgeocoding algorithm.

    INPUTS:
     in_radar_data (Raster Dataset / Raster Layer):
         The input radar data.
     polarization_bands {String}:
         The polarization bands that will be corrected.The first band is
         selected by default.
     in_dem_raster {Raster Dataset / Raster Layer / Mosaic Layer}:
         The input DEM.If no DEM is specified or in areas that are not covered
         by a specified
         DEM, an approximated DEM, interpolated from metadata tie points, will
         be created.Use the tie-point approach for full ocean radar scenes
         only; specify a
         DEM whenever land features are included in the radar scene.
     geoid {Boolean}:
         Specifies whether the vertical reference system of the input DEM will
         be transformed to ellipsoidal height. Most elevation datasets are
         referenced to sea level orthometric height, so a correction is
         required in these cases to convert to ellipsoidal height.GEOID-A geoid
         correction will be made to convert orthometric height to
         ellipsoidal height (based on EGM96 geoid). This is the default.NONE-No
         geoid correction will be made. Use this option only if the DEM
         is provided in ellipsoidal height.

    OUTPUTS:
     out_radar_data (Raster Dataset):
         The corrected geometric terrain radar data."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_radar_data, polarization_bands, in_dem_raster, geoid):
        out_radar_data = "#"
        result = arcpy.gp.ApplyGeometricTerrainCorrection_ia(
            in_radar_data, out_radar_data, polarization_bands, in_dem_raster, geoid
        )
        return _wrapToolRaster("ApplyGeometricTerrainCorrection_sa", str(result.getOutput(0)))

    return Wrapper(in_radar_data, polarization_bands, in_dem_raster, geoid)


ApplyGeometricTerrainCorrection.__esri_toolname__ = "ApplyGeometricTerrainCorrection_ia"
ApplyGeometricTerrainCorrection.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5"]


def ApplyOrbitCorrection(in_radar_data, in_orbit_file="#", folder="#"):
    """ApplyOrbitCorrection_ia(in_radar_data, {in_orbit_file}, {folder})

       Updates the orbital information in the Sentinel-1 synthetic aperture
       radar (SAR) data using a more accurate orbit state vector (OSV) file.

    INPUTS:
     in_radar_data (Raster Dataset / Raster Layer):
         The input radar data.
     in_orbit_file {File}:
         The input orbit file.
     folder {Folder}:
         The alternate folder location that will be searched for the downloaded
         orbit state vector files. The default folder is the input radar data
         .SAFE folder."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_radar_data, in_orbit_file, folder):
        result = arcpy.gp.ApplyOrbitCorrection_ia(in_radar_data, in_orbit_file, folder)
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_radar_data, in_orbit_file, folder)


ApplyOrbitCorrection.__esri_toolname__ = "ApplyOrbitCorrection_ia"
ApplyOrbitCorrection.__esri_toolinfo__ = ["::::1", "::::2", "::::3"]


def ApplyRadiometricCalibration(
    in_radar_data,
    polarization_bands="#",
    calibration_type: Literal["BETA_NOUGHT", "SIGMA_NOUGHT", "GAMMA_NOUGHT", "#"] | None = "#",
) -> Raster:
    """ApplyRadiometricCalibration_ia(in_radar_data, {polarization_bands;polarization_bands...}, {calibration_type})

       Converts the input synthetic aperture radar (SAR) reflectivity into
       physical units of normalized backscatter by normalizing the
       reflectivity using a reference plane.

    INPUTS:
     in_radar_data (Raster Dataset / Raster Layer):
         The input radar data.
     polarization_bands {String}:
         The polarization bands that will be corrected.The first band is
         selected by default.
     calibration_type {String}:
         Specifies the type of calibration that will be applied.BETA_NOUGHT-The
         radar reflectivity will be calibrated to backscatter
         for a unit area on the slant range. This is the default.SIGMA_NOUGHT-
         The backscatter returned will be calibrated to the
         antenna from a unit area on the ground with the plane locally tangent
         to the ellipsoid. This is known as the radar cross section. Sigma
         nought values vary due to incidence angle, wavelength, polarization,
         terrain, and surface scattering properties.GAMMA_NOUGHT-The
         backscatter returned will be calibrated to the
         antenna from a unit area aligned with the plane perpendicular to the
         slant range. This normalizes gamma nought using the incidence angle
         relative to the ellipsoid. Gamma nought values vary due to wavelength,
         polarization, terrain, and surface scattering properties.

    OUTPUTS:
     out_radar_data (Raster Dataset):
         The calibrated radar data."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_radar_data, polarization_bands, calibration_type):
        out_radar_data = "#"
        result = arcpy.gp.ApplyRadiometricCalibration_ia(
            in_radar_data, out_radar_data, polarization_bands, calibration_type
        )
        return _wrapToolRaster("ApplyRadiometricCalibration_sa", str(result.getOutput(0)))

    return Wrapper(in_radar_data, polarization_bands, calibration_type)


ApplyRadiometricCalibration.__esri_toolname__ = "ApplyRadiometricCalibration_ia"
ApplyRadiometricCalibration.__esri_toolinfo__ = ["::::1", "::::3", "::::4"]


def ApplyRadiometricTerrainFlattening(
    in_radar_data,
    in_dem_raster,
    geoid: Literal["GEOID", "NONE", "#"] | None = "#",
    polarization_bands="#",
    calibration_type: Literal["SIGMA_NOUGHT", "GAMMA_NOUGHT", "#"] | None = "#",
    out_scattering_area="#",
    out_geometric_distortion="#",
    out_geometric_distortion_mask="#",
) -> Raster:
    """ApplyRadiometricTerrainFlattening_ia(in_radar_data, in_dem_raster, {geoid}, {polarization_bands;polarization_bands...}, {calibration_type}, {out_scattering_area}, {out_geometric_distortion}, {out_geometric_distortion_mask})

       Corrects the input synthetic aperture radar (SAR) data for radiometric
       distortions due to topography.

    INPUTS:
     in_radar_data (Raster Dataset / Raster Layer):
         The input radar data.The data that will have radiometric terrain
         flattening applied. The
         data must be radiometrically calibrated to beta nought.
     in_dem_raster (Mosaic Layer / Raster Layer):
         The input DEM.The DEM that will be used to estimate the local
         illuminated area and
         the local incidence angle.
     geoid {Boolean}:
         Specifies whether the vertical reference system of the input DEM will
         be transformed to ellipsoidal height. Most elevation datasets are
         referenced to sea level orthometric height, so a correction is
         required in these cases to convert to ellipsoidal height.GEOID-A geoid
         correction will be made to convert orthometric height to
         ellipsoidal height (based on EGM96 geoid). This is the default.NONE-No
         geoid correction will be made. Use this option only if the DEM
         is provided in ellipsoidal height.
     polarization_bands {String}:
         The polarization bands that will be radiometrically terrain
         flattened.The first band is selected by default.
     calibration_type {String}:
         Specifies whether the output will be terrain flattened using sigma
         nought or gamma nought.GAMMA_NOUGHT-The beta nought backscatter will
         be corrected using an
         accurate computation of an area using a DEM. This is the
         default.SIGMA_NOUGHT-The beta nought backscatter will be corrected
         using the
         unit area of a plane that is locally tangent to the DEM.

    OUTPUTS:
     out_radar_data (Raster Dataset):
         The radiometrically terrain-flattened radar data.
     out_scattering_area {Raster Dataset}:
         The scattering area radar dataset.
     out_geometric_distortion {Raster Dataset}:
         The 4-band geometric distortion radar dataset. The first band is the
         terrain slope, the second band is look angle, the third band is the
         foreshortening ratio, and the fourth band is the local incidence
         angle.
     out_geometric_distortion_mask {Raster Dataset}:
         The 1-band geometric distortion mask radar dataset. The pixels
         are classified using six unique values, one for each distortion type:
         Undetermined-Value of 0Foreshortening-Value of 1Lengthening-Value of
         2Shadow-Value of 3Layover-Value of 4Layover and shadow-Value of 5"""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_radar_data,
        in_dem_raster,
        geoid,
        polarization_bands,
        calibration_type,
        out_scattering_area,
        out_geometric_distortion,
        out_geometric_distortion_mask,
    ):
        out_radar_data = "#"
        result = arcpy.gp.ApplyRadiometricTerrainFlattening_ia(
            in_radar_data,
            out_radar_data,
            in_dem_raster,
            geoid,
            polarization_bands,
            calibration_type,
            out_scattering_area,
            out_geometric_distortion,
            out_geometric_distortion_mask,
        )
        return _wrapToolRaster("ApplyRadiometricTerrainFlattening_sa", str(result.getOutput(0)))

    return Wrapper(
        in_radar_data,
        in_dem_raster,
        geoid,
        polarization_bands,
        calibration_type,
        out_scattering_area,
        out_geometric_distortion,
        out_geometric_distortion_mask,
    )


ApplyRadiometricTerrainFlattening.__esri_toolname__ = "ApplyRadiometricTerrainFlattening_ia"
ApplyRadiometricTerrainFlattening.__esri_toolinfo__ = [
    "::::1",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
]


def ASin(in_raster_or_constant) -> Raster:
    """ASin_ia(in_raster_or_constant)

       Calculates the inverse sine of cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input for which to calculate the inverse sine values.To use a
         number as an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The values are the inverse sine of the input values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("ASin_sa", ["ASin", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


ASin.__esri_toolname__ = "ASin_ia"
ASin.__esri_toolinfo__ = ["::::1"]


def ASinH(in_raster_or_constant) -> Raster:
    """ASinH_ia(in_raster_or_constant)

       Calculates the inverse hyperbolic sine of cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input for which to calculate the inverse hyperbolic sine values.To
         use a number as an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The values are the inverse hyperbolic sine of the
         input values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("ASinH_sa", ["ASinH", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


ASinH.__esri_toolname__ = "ASinH_ia"
ASinH.__esri_toolinfo__ = ["::::1"]


def ATan(in_raster_or_constant) -> Raster:
    """ATan_ia(in_raster_or_constant)

       Calculates the inverse tangent of cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input for which to calculate the inverse tangent values.To use a
         number as an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The values are the inverse tangent of the input
         values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("ATan_sa", ["ATan", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


ATan.__esri_toolname__ = "ATan_ia"
ATan.__esri_toolinfo__ = ["::::1"]


def ATan2(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """ATan2_ia(in_raster_or_constant1, in_raster_or_constant2)

       Calculates the inverse tangent (based on x,y) of cells in a raster.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The input that specifies the numerator, or y value, to use when
         calculating the inverse tangent.A number can be used as an input for
         this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The input that specifies the denominator, or x value, to use when
         calculating the inverse tangent.A number can be used as an input for
         this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The values are the inverse tangent angle of the
         input values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("ATan2_sa", ["ATan2", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


ATan2.__esri_toolname__ = "ATan2_ia"
ATan2.__esri_toolinfo__ = ["::::1", "::::2"]


def ATanH(in_raster_or_constant) -> Raster:
    """ATanH_ia(in_raster_or_constant)

       Calculates the inverse hyperbolic tangent of cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input for which to calculate the inverse hyperbolic tangent
         values.To use a number as an input for this parameter, the cell size
         and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The values are the inverse hyperbolic tangent of the
         input values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("ATanH_sa", ["ATanH", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


ATanH.__esri_toolname__ = "ATanH_ia"
ATanH.__esri_toolinfo__ = ["::::1"]


def BitwiseAnd(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """BitwiseAnd_ia(in_raster_or_constant1, in_raster_or_constant2)

       Performs a Bitwise And operation on the binary values of two input
       rasters.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The first input to use in this bitwise operation.A number can be used
         as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The second input to use in this bitwise operation.A number can be used
         as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the result of a Bitwise And
         operation on the two
         inputs."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("BitwiseAnd_sa", ["BitwiseAnd", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


BitwiseAnd.__esri_toolname__ = "BitwiseAnd_ia"
BitwiseAnd.__esri_toolinfo__ = ["::::1", "::::2"]


def BitwiseLeftShift(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """BitwiseLeftShift_ia(in_raster_or_constant1, in_raster_or_constant2)

       Performs a Bitwise Left Shift operation on the binary values of two
       input rasters.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The input on which to perform the shift.A number can be used as an
         input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The input defining the number of positions to shift the bits.A number
         can be used as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the result of a Bitwise Left
         Shift operation on
         the inputs."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster(
            "BitwiseLeftShift_sa", ["BitwiseLeftShift", in_raster_or_constant1, in_raster_or_constant2]
        )

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


BitwiseLeftShift.__esri_toolname__ = "BitwiseLeftShift_ia"
BitwiseLeftShift.__esri_toolinfo__ = ["::::1", "::::2"]


def BitwiseNot(in_raster_or_constant) -> Raster:
    """BitwiseNot_ia(in_raster_or_constant)

       Performs a Bitwise Not (complement) operation on the binary value of
       an input raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input raster on which to perform the Bitwise Not (complement)
         operation.A number can be used as an input for this parameter,
         provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the result of a Bitwise Not
         operation on the
         input."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("BitwiseNot_sa", ["BitwiseNot", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


BitwiseNot.__esri_toolname__ = "BitwiseNot_ia"
BitwiseNot.__esri_toolinfo__ = ["::::1"]


def BitwiseOr(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """BitwiseOr_ia(in_raster_or_constant1, in_raster_or_constant2)

       Performs a Bitwise Or operation on the binary values of two input
       rasters.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The first input to use in this bitwise operation.A number can be used
         as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The second input to use in this bitwise operation.A number can be used
         as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the result of a Bitwise Or
         operation on the two
         inputs."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("BitwiseOr_sa", ["BitwiseOr", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


BitwiseOr.__esri_toolname__ = "BitwiseOr_ia"
BitwiseOr.__esri_toolinfo__ = ["::::1", "::::2"]


def BitwiseRightShift(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """BitwiseRightShift_ia(in_raster_or_constant1, in_raster_or_constant2)

       Performs a Bitwise Right Shift operation on the binary values of two
       input rasters.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The input on which to perform the shift.A number can be used as an
         input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The input defining the number of positions to shift the bits.A number
         can be used as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the result of a Bitwise Right
         Shift operation on
         the inputs."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster(
            "BitwiseRightShift_sa", ["BitwiseRightShift", in_raster_or_constant1, in_raster_or_constant2]
        )

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


BitwiseRightShift.__esri_toolname__ = "BitwiseRightShift_ia"
BitwiseRightShift.__esri_toolinfo__ = ["::::1", "::::2"]


def BitwiseXOr(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """BitwiseXOr_ia(in_raster_or_constant1, in_raster_or_constant2)

       Performs a Bitwise eXclusive Or operation on the binary values of two
       input rasters.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The first input to use in this bitwise operation.A number can be used
         as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The second input to use in this bitwise operation.A number can be used
         as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the result of a Bitwise
         eXclusive Or operation on
         the two inputs."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("BitwiseXOr_sa", ["BitwiseXOr", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


BitwiseXOr.__esri_toolname__ = "BitwiseXOr_ia"
BitwiseXOr.__esri_toolinfo__ = ["::::1", "::::2"]


def BooleanAnd(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """BooleanAnd_ia(in_raster_or_constant1, in_raster_or_constant2)

       Performs a Boolean And operation on the cell values of two input
       rasters.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The first input to use in this Boolean operation.A number can be used
         as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The second input to use in this Boolean operation.A number can be used
         as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The output cell values will be either 0 or 1."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("BooleanAnd_sa", ["BooleanAnd", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


BooleanAnd.__esri_toolname__ = "BooleanAnd_ia"
BooleanAnd.__esri_toolinfo__ = ["::::1", "::::2"]


def BooleanNot(in_raster_or_constant) -> Raster:
    """BooleanNot_ia(in_raster_or_constant)

       Performs a Boolean Not (complement) operation on the cell values of
       the input raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input to use in this Boolean operation.To use a number as an input
         for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The output cell values will be either 0 or 1."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("BooleanNot_sa", ["BooleanNot", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


BooleanNot.__esri_toolname__ = "BooleanNot_ia"
BooleanNot.__esri_toolinfo__ = ["::::1"]


def BooleanOr(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """BooleanOr_ia(in_raster_or_constant1, in_raster_or_constant2)

       Performs a Boolean Or operation on the cell values of two input
       rasters.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The first input to use in this Boolean operation.A number can be used
         as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The second input to use in this Boolean operation.A number can be used
         as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The output cell values will be either 0 or 1."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("BooleanOr_sa", ["BooleanOr", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


BooleanOr.__esri_toolname__ = "BooleanOr_ia"
BooleanOr.__esri_toolinfo__ = ["::::1", "::::2"]


def BooleanXOr(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """BooleanXOr_ia(in_raster_or_constant1, in_raster_or_constant2)

       Performs a Boolean eXclusive Or operation on the cell values of two
       input rasters.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The first input to use in this Boolean operation.A number can be used
         as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The second input to use in this Boolean operation.A number can be used
         as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The output cell values will be either 0 or 1."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("BooleanXOr_sa", ["BooleanXOr", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


BooleanXOr.__esri_toolname__ = "BooleanXOr_ia"
BooleanXOr.__esri_toolinfo__ = ["::::1", "::::2"]


def CellStatistics(
    in_rasters_or_constants,
    statistics_type: Literal[
        "MEAN",
        "MAJORITY",
        "MAXIMUM",
        "MEDIAN",
        "MINIMUM",
        "MINORITY",
        "PERCENTILE",
        "RANGE",
        "STD",
        "SUM",
        "VARIETY",
        "#",
    ]
    | None = "#",
    ignore_nodata: Literal["DATA", "NODATA", "#"] | None = "#",
    process_as_multiband: Literal["SINGLE_BAND", "MULTI_BAND", "#"] | None = "#",
    percentile_value="#",
    percentile_interpolation_type: Literal["AUTO_DETECT", "NEAREST", "LINEAR", "#"] | None = "#",
) -> Raster:
    """CellStatistics_ia(in_rasters_or_constants;in_rasters_or_constants..., {statistics_type}, {ignore_nodata}, {process_as_multiband}, {percentile_value}, {percentile_interpolation_type})

       Calculates a per-cell statistic from multiple rasters.

    INPUTS:
     in_rasters_or_constants (Composite Geodataset):
         A list of input rasters for which a statistical operation will be
         calculated for each cell in the analysis window.A number can be used
         as an input; however, the cell size and extent
         must first be set in the environment.If the processing_as_multiband
         parameter is set to MULTI_BAND, all
         multiband inputs should have an equal number of bands.
     statistics_type {String}:
         Specifies the statistic type to be calculated.MEAN-The mean (average)
         of the inputs will be calculated. This is the
         default.MAJORITY-The majority (value that occurs most often) of the
         inputs
         will be determined.MAXIMUM-The maximum (largest value) of the inputs
         will be determined.MEDIAN-The median of the inputs will be
         calculated.MINIMUM-The minimum (smallest value) of the inputs will be
         determined.MINORITY-The minority (value that occurs least often) of
         the inputs
         will be determined.PERCENTILE-The percentile of the inputs will be
         calculated. The 90th
         percentile is calculated by default. You can specify other values
         (from 0 to 100) using the percentile_value parameter.RANGE-The range
         (difference between largest and smallest value) of the
         inputs will be calculated.STD-The standard deviation of the inputs
         will be calculated.SUM-The sum (total of all values) of the inputs
         will be calculated.VARIETY-The variety (number of unique values) of
         the inputs will be
         calculated.The default statistic type is MEAN.
     ignore_nodata {Boolean}:
         Specifies whether NoData values will be ignored by the statistic
         calculation.DATA-At the processing cell location, if any of the input
         rasters has
         NoData, that NoData value will be ignored. The statistics will be
         computed by only considering the cells with valid data. This is the
         default.NODATA-If the processing cell location for any of the input
         rasters is
         NoData, the output for that cell will be NoData.
     process_as_multiband {Boolean}:
         Specifies how the input multiband raster bands will be
         processed.SINGLE_BAND-Each band from a multiband raster input will be
         processed
         separately as a single band raster. This is the
         default.MULTI_BAND-Each multiband raster input will be processed as a
         multiband raster. The operation will be performed for each band from
         one input using the corresponding band number from the other inputs.
     percentile_value {Double}:
         The percentile value that will be calculated. The default is 90,
         indicating the 90th percentile.The value can range from 0 to 100. The
         0th percentile is essentially
         equivalent to the minimum statistic, and the 100th percentile is
         equivalent to the maximum statistic. A value of 50 will produce
         essentially the same result as the median statistic.This parameter is
         only supported if the statistics_type parameter is
         set to PERCENTILE.
     percentile_interpolation_type {String}:
         Specifies the method of interpolation that will be used when the
         specified percentile value is between two input cell
         values.AUTO_DETECT-If the input rasters are of integer pixel type, the
         NEAREST method will be used. If the input rasters are of floating
         point pixel type, the LINEAR method will be used. This is the
         default.NEAREST-The nearest available value to the desired percentile
         will be
         used. In this case, the output pixel type will be the same as that of
         the input rasters.LINEAR-The weighted average of the two surrounding
         values from the
         percentile will be used. In this case, the output pixel type will be
         floating point.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.For each cell, the value is determined by applying
         the specified
         statistic type to the input rasters at that location."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_rasters_or_constants,
        statistics_type,
        ignore_nodata,
        process_as_multiband,
        percentile_value,
        percentile_interpolation_type,
    ):
        statisticsTypes = {
            "MAJORITY": "Majority",
            "MAXIMUM": "Max",
            "MEAN": "Mean",
            "MEDIAN": "Med",
            "MINIMUM": "Min",
            "MINORITY": "Minority",
            "PERCENTILE": "Percentile",
            "RANGE": "Range",
            "STD": "Std",
            "SUM": "Sum",
            "VARIETY": "Variety",
        }
        interpolationTypes = {
            "AUTO_DETECT": 1,
            "NEAREST": 2,
            "LINEAR": 3,
        }
        if Utils.useDefaultArgumentValue(statistics_type):
            statistics_type = "MEAN"
        if not statistics_type in statisticsTypes:
            raise arcpy.ExecuteError(
                "ERROR 000864: Overlay statistic: The input is not within the defined domain.\nERROR 000800: The value is not a member of MEAN | MAJORITY | MAXIMUM | MEDIAN | MINIMUM | MINORITY | PERCENTILE | RANGE | STD | SUM | VARIETY.\n"
            )
        function = statisticsTypes[statistics_type]
        if Utils.useDefaultArgumentValue(ignore_nodata):
            ignore_nodata = "DATA"
        if ignore_nodata not in ["DATA", "NODATA"]:
            raise arcpy.ExecuteError(
                "ERROR 000622: Failed to execute (CellStatistics). Parameters are not valid.\nERROR 000621: Input to parameter ignore_nodata not within domain.\n"
            )
        if Utils.useDefaultArgumentValue(process_as_multiband):
            process_as_multiband = "SINGLE_BAND"
        if process_as_multiband not in ["SINGLE_BAND", "MULTI_BAND"]:
            raise arcpy.ExecuteError(
                "ERROR 000622: Failed to execute (CellStatistics). Parameters are not valid.\nERROR 000621: Input to parameter process_as_multiband not within domain.\n"
            )
        if Utils.argumentValueEqualsString(ignore_nodata, "DATA"):
            function += "ContinueOnNoData"
        if Utils.useDefaultArgumentValue(percentile_value):
            percentile_value = 90.0
        if Utils.useDefaultArgumentValue(percentile_interpolation_type):
            percentile_interpolation_type = "AUTO_DETECT"
        if percentile_interpolation_type.upper() not in interpolationTypes:
            raise arcpy.ExecuteError(
                "ERROR 000622: Failed to execute (CellStatistics). Parameters are not valid.\nERROR 000621: Input to parameter percentile_interpolation_type not within domain.\n"
            )
        return _wrapLocalFunctionRaster(
            "CellStatistics_sa",
            [function] + Utils.flattenLists(in_rasters_or_constants),
            {
                "flattenBands": process_as_multiband.upper() == "SINGLE_BAND",
                "PercentileValue": float(percentile_value),
                "PercentileInterpolationType": int(interpolationTypes[percentile_interpolation_type]),
            },
        )

    return Wrapper(
        in_rasters_or_constants,
        statistics_type,
        ignore_nodata,
        process_as_multiband,
        percentile_value,
        percentile_interpolation_type,
    )


CellStatistics.__esri_toolname__ = "CellStatistics_ia"
CellStatistics.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7"]


def ClassifyObjectsUsingDeepLearning(
    in_raster,
    out_feature_class,
    in_model_definition,
    in_features="#",
    class_label_field="#",
    processing_mode: Literal["PROCESS_AS_MOSAICKED_IMAGE", "PROCESS_ITEMS_SEPARATELY", "#"] | None = "#",
    model_arguments="#",
    caption_field="#",
):
    """ClassifyObjectsUsingDeepLearning_ia(in_raster, out_feature_class, in_model_definition, {in_features}, {class_label_field}, {processing_mode}, {model_arguments;model_arguments...}, {caption_field})

       Runs a trained deep learning model on an input raster and an optional
       feature class to produce a feature class or table in which each input
       object or feature has an assigned class or category label.

    INPUTS:
     in_raster (Raster Dataset / Raster Layer / Mosaic Layer / Image Service / Map Server / Map Server Layer / Internet Tiled Layer / Folder / Feature Layer / Feature Class):
         The input image that will be used to classify objects.The input can be
         a single raster, multiple rasters in a mosaic
         dataset, an image service, a folder of images, or a feature class with
         image attachments.
     in_model_definition (File / String):
         The in_model_definition parameter value can be an Esri model
         definition JSON file (.emd), a JSON string, or a deep learning model
         package (.dlpk). A JSON string is useful when this tool is used on the
         server so you can paste the JSON string rather than upload the .emd
         file. The .dlpk file must be stored locally.It contains the path to
         the deep learning binary model file, the path
         to the Python raster function to be used, and other parameters such as
         preferred tile size or padding.
     in_features {Feature Class / Feature Layer}:
         The point, line, or polygon input feature class that identifies the
         location of each object or feature to be classified and labelled. Each
         row in the input feature class represents a single object or
         feature.If no input feature class is provided, it is assumed that each
         input
         image contains a single object to be classified. If the input image or
         images use a spatial reference, the output from the tool is a feature
         class in which the extent of each image is used as the bounding
         geometry for each labelled feature class. If the input image or images
         are not spatially referenced, the output from the tool is a table
         containing the image ID values and the class labels for each image.
     class_label_field {String}:
         The name of the field that will contain the class or category label in
         the output feature class. If no field name is provided, afield
         will be generated in the
         output feature class. ClassLabel
     processing_mode {String}:
         Specifies how all raster items in a mosaic dataset or an image service
         will be processed. This parameter is applied when the input raster is
         a mosaic dataset or an image service.PROCESS_AS_MOSAICKED_IMAGE-All
         raster items in the mosaic dataset or
         image service will be mosaicked together and processed. This is the
         default.PROCESS_ITEMS_SEPARATELY-All raster items in the mosaic
         dataset or
         image service will be processed as separate images.
     model_arguments {Value Table}:
         The information from the in_model_definition parameter will be used to
         set the default values for this parameter. These arguments vary,
         depending on the model architecture. The following are supported model
         arguments for models trained in ArcGIS. ArcGIS pretrained models and
         custom deep learning models may have additional arguments that the
         tool supports.batch_size-The number of image tiles processed in each
         step of the
         model inference. This depends on the memory of your graphics card. The
         argument is available for all model
         architectures.test_time_augmentation-Performs test time augmentation
         while
         predicting. If true, predictions of flipped and rotated variants of
         the input image will be merged into the final output. The argument is
         available for all model architectures.score_threshold-The predictions
         above this confidence score are
         included in the result. The allowed values range from 0 to 1.0. The
         argument is available for all model architectures.
     caption_field {String}:
         The name of the field that will contain the text or caption in the
         output feature class. This parameter is only supported when an Image
         Captioner model is used. If no field name is specified, afield
         will be generated in the
         output feature class. Caption

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class that will contain geometries surrounding the
         objects or feature from the input feature class, as well as a field to
         store the categorization label.If the feature class already exists,
         the results will be appended to
         the existing feature class."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_raster,
        out_feature_class,
        in_model_definition,
        in_features,
        class_label_field,
        processing_mode,
        model_arguments,
        caption_field,
    ):
        result = arcpy.gp.ClassifyObjectsUsingDeepLearning_ia(
            in_raster,
            out_feature_class,
            in_model_definition,
            in_features,
            class_label_field,
            processing_mode,
            model_arguments,
            caption_field,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_raster,
        out_feature_class,
        in_model_definition,
        in_features,
        class_label_field,
        processing_mode,
        model_arguments,
        caption_field,
    )


ClassifyObjectsUsingDeepLearning.__esri_toolname__ = "ClassifyObjectsUsingDeepLearning_ia"
ClassifyObjectsUsingDeepLearning.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
]


def ClassifyPixelsUsingDeepLearning(
    in_raster,
    in_model_definition,
    arguments="#",
    processing_mode: Literal["PROCESS_AS_MOSAICKED_IMAGE", "PROCESS_ITEMS_SEPARATELY", "#"] | None = "#",
    out_classified_folder="#",
    out_featureclass="#",
    overwrite_attachments: Literal["OVERWRITE", "NO_OVERWRITE", "#"] | None = "#",
    use_pixelspace: Literal["PIXELSPACE", "NO_PIXELSPACE", "#"] | None = "#",
):
    """ClassifyPixelsUsingDeepLearning_ia(in_raster, {out_classified_raster}, in_model_definition, {arguments;arguments...}, {processing_mode}, {out_classified_folder}, {out_featureclass}, {overwrite_attachments}, {use_pixelspace})

       Runs a trained deep learning model on an input raster to produce a
       classified raster, with each valid pixel having an assigned class
       label.

    INPUTS:
     in_raster (Raster Dataset / Raster Layer / Mosaic Layer / Image Service / Map Server / Map Server Layer / Internet Tiled Layer / Folder / Feature Layer / Feature Class):
         The input raster dataset that will be classified.The input can be a
         single raster, multiple rasters in a mosaic
         dataset, an image service, a folder of images, or a feature class with
         image attachments.
     in_model_definition (File / String):
         The in_model_definition parameter value can be an Esri model
         definition JSON file (.emd), a JSON string, or a deep learning model
         package (.dlpk). A JSON string is useful when this tool is used on the
         server so you can paste the JSON string rather than upload the .emd
         file. The .dlpk file must be stored locally.It contains the path to
         the deep learning binary model file, the path
         to the Python raster function to be used, and other parameters such as
         preferred tile size or padding.
     arguments {Value Table}:
         The information from the in_model_definition parameter will be used to
         set the default values for this parameter. These arguments vary,
         depending on the model architecture. The following are supported model
         arguments for models trained in ArcGIS. ArcGIS pretrained models and
         custom deep learning models may have additional arguments that the
         tool supports.batch_size-The number of image tiles processed in each
         step of the
         model inference. This depends on the memory of your graphics card. The
         argument is available for all model architectures.direction-The image
         is translated from one domain to another. Options
         are AtoB and BtoA. The argument is only available for the CycleGAN
         architecture. For more information about this argument, see How
         CycleGAN works.merge_policy-The policy for merging augmented
         predictions. Available
         options are mean, max, and min. This is only applicable when test time
         augmentation is used. The argument is available for the
         MultiTaskRoadExtractor and ConnectNet architectures. If
         IsEdgeDetection is present in the model's .emd file, the
         BDCNEdgeDetector, HEDEdgeDetector, and MMSegmentation architectures
         are also available.n_timestep-The number of time steps that will be
         used. The default is
         200. It can be increased and decreased based on the quality of
         generations. The argument is only supported for the Super Resolution
         with SR3 backbone model.padding-The number of pixels at the border of
         image tiles from which
         predictions are blended for adjacent tiles. To smooth the output while
         reducing artifacts, increase the value. The maximum value of the
         padding can be half the tile size value. The argument is available for
         all model architectures.predict_background-Specifies whether the
         background class will be
         classified. If true, the background class is also classified. The
         argument is available for UNET, PSPNET, DeepLab, MMSegmentation, and
         SAMLoRA.return_probability_raster-Specifies whether the output will be
         a
         probability raster. If true, the output will be a probability raster.
         If false, the output will be a binary classified raster. The default
         is false. If ArcGISLearnVersion is 1.8.4 or later in the model's .emd
         file, the MultiTaskRoadExtractor and ConnectNet architectures are
         available. If ArcGISLearnVersion is 1.8.4 or later and IsEdgeDetection
         is present in the model's .emd file, the BDCNEdgeDetector,
         HEDEdgeDetector, and MMSegmentation architectures are also
         available.sampling_type-The type of sampling that will be used. Two
         types of
         sampling are available: ddim and ddpm. The default is ddim, which
         generates results in fewer time steps compared to ddpm. The argument
         is only supported for the Super Resolution with SR3 backbone
         model.schedule-An optional string that sets the type of schedule. The
         default schedule is the same as the model it was trained on. The
         argument is only supported for the Super Resolution with SR3 backbone
         model.test_time_augmentation-Specifies whether test time augmentation
         will
         be performed while predicting. If true, predictions of flipped and
         rotated variants of the input image will be merged into the final
         output. The argument is available for UNET, PSPNET, DeepLab,
         HEDEdgeDetector, BDCNEdgeDetector, ConnectNet, MMSegmentation, Multi-
         Task Road Extractor, and SAMLoRA.tile_size-The width and height of
         image tiles into which the imagery
         will be split for prediction. The argument is only available for the
         CycleGAN architecture.thinning-Specifies whether predicted edges will
         be thinned or
         skeletonized. Options are True and False. If IsEdgeDetection is
         present in the model's .emd file, the BDCNEdgeDetector,
         HEDEdgeDetector, and MMSegmentation architectures are
         available.threshold-The predictions that have a confidence score
         higher than
         this threshold are included in the result. The allowed values range
         from 0 to 1.0. If ArcGISLearnVersion is 1.8.4 or later in the model's
         .emd file, the MultiTaskRoadExtractor and ConnectNet architectures are
         available. If ArcGISLearnVersion is 1.8.4 or later and IsEdgeDetection
         is present in the model's .emd file, the BDCNEdgeDetector,
         HEDEdgeDetector, and MMSegmentation architectures are also available.
     processing_mode {String}:
         Specifies how all raster items in a mosaic dataset or an image service
         will be processed. This parameter is applied when the input raster is
         a mosaic dataset or an image service.PROCESS_AS_MOSAICKED_IMAGE-All
         raster items in the mosaic dataset or
         image service will be mosaicked together and processed. This is the
         default.PROCESS_ITEMS_SEPARATELY-All raster items in the mosaic
         dataset or
         image service will be processed as separate images.
     overwrite_attachments {Boolean}:
         Specifies whether existing image attachments will be
         overwritten.NO_OVERWRITE-Existing image attachments will not be
         overwritten and
         new image attachments will be stored in a new feature class. When this
         option is specified, the out_featureclass parameter must be populated.
         This is the default.OVERWRITE-The existing feature class will be
         overwritten with the new
         updated attachments.This parameter is only valid when the in_raster
         parameter value is a
         feature class with image attachments.
     use_pixelspace {Boolean}:
         Specifies whether inferencing will be performed on images in pixel
         space.NO_PIXELSPACE-Inferencing will be performed in map space. This
         is the
         default.PIXELSPACE-Inferencing will be performed in image space, and
         the
         output will be transformed back to map space. This option is useful
         when using oblique imagery or street-view imagery, where the features
         may become distorted using map space.

    OUTPUTS:
     out_classified_raster {Raster Dataset / Feature Class}:
         The name of the raster or mosaic dataset containing the result.
     out_classified_folder {Folder}:
         The folder where the output classified rasters will be stored. A
         mosaic dataset will be generated using the classified rasters in this
         folder.This parameter is required when the input raster is a folder of
         images
         or a mosaic dataset in which all items are to be processed separately.
         The default is a folder in the project folder.
     out_featureclass {Feature Class}:
         The feature class where the output classified rasters will be
         stored.This parameter is required when the input raster is a feature
         class of
         images.If the feature class already exists, the results will be
         appended to
         the existing feature class."""
    generate_feature_output = False
    if out_featureclass != "" and out_featureclass != "#" and out_featureclass is not None:
        generate_feature_output = True
    if generate_feature_output:

        @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
        def Wrapper(
            in_raster,
            in_model_definition,
            arguments,
            processing_mode,
            out_classified_folder,
            out_featureclass,
            overwrite_attachments,
            use_pixelspace,
        ):
            out_classified_raster = "#"
            result = arcpy.gp.ClassifyPixelsUsingDeepLearning_ia(
                in_raster,
                out_classified_raster,
                in_model_definition,
                arguments,
                processing_mode,
                out_classified_folder,
                out_featureclass,
                overwrite_attachments,
                use_pixelspace,
            )
            return arcpy.convertArcObjectToPythonObject(result)

    else:

        @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
        def Wrapper(
            in_raster,
            in_model_definition,
            arguments,
            processing_mode,
            out_classified_folder,
            out_featureclass,
            overwrite_attachments,
            use_pixelspace,
        ):
            out_classified_raster = "#"
            result = arcpy.gp.ClassifyPixelsUsingDeepLearning_ia(
                in_raster,
                out_classified_raster,
                in_model_definition,
                arguments,
                processing_mode,
                out_classified_folder,
                out_featureclass,
                overwrite_attachments,
                use_pixelspace,
            )
            return _wrapToolRaster("ClassifyPixelsUsingDeepLearning_sa", str(result.getOutput(0)))

    return Wrapper(
        in_raster,
        in_model_definition,
        arguments,
        processing_mode,
        out_classified_folder,
        out_featureclass,
        overwrite_attachments,
        use_pixelspace,
    )


ClassifyPixelsUsingDeepLearning.__esri_toolname__ = "ClassifyPixelsUsingDeepLearning_ia"
ClassifyPixelsUsingDeepLearning.__esri_toolinfo__ = [
    "::::1",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
]


def ClassifyRaster(in_raster, in_classifier_definition, in_additional_raster="#") -> Raster:
    """ClassifyRaster_ia(in_raster, in_classifier_definition, {in_additional_raster})

       Classifies a raster dataset based on an Esri classifier definition
       file (.ecd) and raster dataset inputs.

    INPUTS:
     in_raster (Mosaic Layer / Raster Layer / Image Service / String / Raster Dataset / Mosaic Dataset):
         The raster dataset to classify.
     in_classifier_definition (File):
         The input Esri classifier definition file (.ecd) containing the
         statistics for the chosen attributes for the classifier.
     in_additional_raster {Mosaic Layer / Raster Layer / Image Service / String / Raster Dataset / Mosaic Dataset}:
         Ancillary raster datasets, such as a multispectral image or a DEM,
         will be incorporated to generate attributes and other required
         information for the classifier. This raster is necessary when
         calculating attributes such as mean or standard deviation. This
         parameter is optional.

    OUTPUTS:
     out_raster_dataset (Raster Dataset):
         The path and name of the classified image you are creating.The output
         classified raster is defined by the input raster dataset
         and .ecd file inputs."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, in_classifier_definition, in_additional_raster):
        out_raster_dataset = "#"
        result = arcpy.gp.ClassifyRaster_ia(
            in_raster, in_classifier_definition, out_raster_dataset, in_additional_raster
        )
        return _wrapToolRaster("ClassifyRaster_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, in_classifier_definition, in_additional_raster)


ClassifyRaster.__esri_toolname__ = "ClassifyRaster_ia"
ClassifyRaster.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def ClassifyRasterUsingSpectra(
    in_raster,
    in_spectra_file,
    method: Literal["SAM", "SID", "#"] | None = "#",
    thresholds="#",
    out_score_raster="#",
    out_classifier_definition="#",
) -> Raster:
    """ClassifyRasterUsingSpectra_ia(in_raster, in_spectra_file, {method}, {thresholds}, {out_score_raster}, {out_classifier_definition})

       Classifies a multiband raster dataset using spectral matching
       techniques. The input spectral data can be provided as a point feature
       class or a .json file.

    INPUTS:
     in_raster (Mosaic Layer / Raster Layer / Image Service / String / Raster Dataset / Mosaic Dataset):
         The input multiband raster.
     in_spectra_file (Feature Layer / File / String):
         The spectral information for different pixel classes. The
         spectral information can be provided as point features, a
         training sample point feature class generated from thepane, or a .json
         file that contains the class spectral profiles. Training
         Samples Manager
     method {String}:
         Specifies the spectral matching method that will be used.SAM-The
         vector angle between the input multiband raster and the
         reference spectra will be calculated in which the spectra of each
         pixel is treated as a vector. Angle values are in radians.SID-The
         spectral information divergence between the input multiband
         raster and the reference spectra will be calculated. A score will be
         calculated for each pixel based on the divergence between the
         probability distributions of the pixel and reference spectra. Values
         are in radians.
     thresholds {String}:
         The threshold for spectral matching. Pixel values that exceed this
         value will be classified as undefined. This can be a single value
         applied to all spectral classes or a space-delimited list of values
         for each class.

    OUTPUTS:
     out_classified_raster (Raster Dataset):
         The output classified raster.
     out_score_raster {Raster Dataset}:
         A multiband raster that stores the matching results for each end
         member. The band order follows the order of the classes in the
         in_spectra_file parameter value. If the input is a multidimensional
         raster, the output format must be CRF.
     out_classifier_definition {File}:
         The output .ecd file."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, in_spectra_file, method, thresholds, out_score_raster, out_classifier_definition):
        out_classified_raster = "#"
        result = arcpy.gp.ClassifyRasterUsingSpectra_ia(
            in_raster,
            in_spectra_file,
            out_classified_raster,
            method,
            thresholds,
            out_score_raster,
            out_classifier_definition,
        )
        return _wrapToolRaster("ClassifyRasterUsingSpectra_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, in_spectra_file, method, thresholds, out_score_raster, out_classifier_definition)


ClassifyRasterUsingSpectra.__esri_toolname__ = "ClassifyRasterUsingSpectra_ia"
ClassifyRasterUsingSpectra.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "::::6", "::::7"]


def CombinatorialAnd(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """CombinatorialAnd_ia(in_raster_or_constant1, in_raster_or_constant2)

       Performs a Combinatorial And operation on the cell values of two input
       rasters.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The first input to use in this combinatorial operation.It must be of
         integer type.A number can be used as an input for this parameter,
         provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The second input to use in this combinatorial operation.It must be of
         integer type.A number can be used as an input for this parameter,
         provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The output is always of integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        out_raster = "#"
        result = arcpy.gp.CombinatorialAnd_ia(in_raster_or_constant1, in_raster_or_constant2, out_raster)
        return _wrapToolRaster("CombinatorialAnd_sa", str(result.getOutput(0)))

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


CombinatorialAnd.__esri_toolname__ = "CombinatorialAnd_ia"
CombinatorialAnd.__esri_toolinfo__ = ["::::1", "::::2"]


def CombinatorialOr(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """CombinatorialOr_ia(in_raster_or_constant1, in_raster_or_constant2)

       Performs a Combinatorial Or operation on the cell values of two input
       rasters.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The first input to use in this combinatorial operation.It must be of
         integer type.A number can be used as an input for this parameter,
         provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The second input to use in this combinatorial operation.It must be of
         integer type.A number can be used as an input for this parameter,
         provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The output is always of integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        out_raster = "#"
        result = arcpy.gp.CombinatorialOr_ia(in_raster_or_constant1, in_raster_or_constant2, out_raster)
        return _wrapToolRaster("CombinatorialOr_sa", str(result.getOutput(0)))

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


CombinatorialOr.__esri_toolname__ = "CombinatorialOr_ia"
CombinatorialOr.__esri_toolinfo__ = ["::::1", "::::2"]


def CombinatorialXOr(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """CombinatorialXOr_ia(in_raster_or_constant1, in_raster_or_constant2)

       Performs a Combinatorial eXclusive Or operation on the cell values of
       two input rasters.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The first input to use in this combinatorial operation.It must be of
         integer type.A number can be used as an input for this parameter,
         provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The second input to use in this combinatorial operation.It must be of
         integer type.A number can be used as an input for this parameter,
         provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The output is always of integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        out_raster = "#"
        result = arcpy.gp.CombinatorialXOr_ia(in_raster_or_constant1, in_raster_or_constant2, out_raster)
        return _wrapToolRaster("CombinatorialXOr_sa", str(result.getOutput(0)))

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


CombinatorialXOr.__esri_toolname__ = "CombinatorialXOr_ia"
CombinatorialXOr.__esri_toolinfo__ = ["::::1", "::::2"]


def ComputeAccuracyForObjectDetection(
    detected_features,
    ground_truth_features,
    out_accuracy_table,
    out_accuracy_report="#",
    detected_class_value_field="#",
    ground_truth_class_value_field="#",
    min_iou="#",
    mask_features="#",
):
    """ComputeAccuracyForObjectDetection_ia(detected_features, ground_truth_features, out_accuracy_table, {out_accuracy_report}, {detected_class_value_field}, {ground_truth_class_value_field}, {min_iou}, {mask_features})

       Calculates the accuracy of a deep learning model by comparing the
       detected objects from the Detect Objects Using Deep Learning tool to
       ground truth data.

    INPUTS:
     detected_features (Feature Class / Feature Layer):
         The polygon feature class containing the objects detected from the
         Detect Objects Using Deep Learning tool.
     ground_truth_features (Feature Class / Feature Layer):
         The polygon feature class containing ground truth data.
     detected_class_value_field {Field}:
         The field in the detected objects feature class that contains the
         class values or class names. If no field name is provided,
         aorfield will be used. If these
         fields do not exist, all records will be identified as belonging to
         one class. ClassvalueValueThe class values or class names must
         match those in the ground
         reference feature class exactly.
     ground_truth_class_value_field {Field}:
         The field in the ground truth feature class that contains the class
         values. If no field name is provided, aorfield will be used. If
         these
         fields do not exist, all records will be identified as belonging to
         one class. ClassvalueValueThe class values or class names must
         match those in the detected
         objects feature class exactly.
     min_iou {Double}:
         The IoU ratio that will be used as a threshold to evaluate the
         accuracy of the object detection model. The numerator is the area of
         overlap between the predicted bounding box and the ground reference
         bounding box. The denominator is the area of union or the area
         encompassed by both bounding boxes. The IoU ranges from 0 to 1.
     mask_features {Feature Class / Feature Layer}:
         A polygon feature class that delineates the area or areas where
         accuracy will be computed. Only the features that intersect the mask
         will be assessed for accuracy.

    OUTPUTS:
     out_accuracy_table (Table):
         The output accuracy table.
     out_accuracy_report {File}:
         The name of the output accuracy report. The report is a PDF document
         containing accuracy metrics and charts."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        detected_features,
        ground_truth_features,
        out_accuracy_table,
        out_accuracy_report,
        detected_class_value_field,
        ground_truth_class_value_field,
        min_iou,
        mask_features,
    ):
        result = arcpy.gp.ComputeAccuracyForObjectDetection_ia(
            detected_features,
            ground_truth_features,
            out_accuracy_table,
            out_accuracy_report,
            detected_class_value_field,
            ground_truth_class_value_field,
            min_iou,
            mask_features,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        detected_features,
        ground_truth_features,
        out_accuracy_table,
        out_accuracy_report,
        detected_class_value_field,
        ground_truth_class_value_field,
        min_iou,
        mask_features,
    )


ComputeAccuracyForObjectDetection.__esri_toolname__ = "ComputeAccuracyForObjectDetection_ia"
ComputeAccuracyForObjectDetection.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
]


def ComputeChangeRaster(
    from_raster,
    to_raster,
    compute_change_method: Literal[
        "DIFFERENCE",
        "RELATIVE_DIFFERENCE",
        "CATEGORICAL_DIFFERENCE",
        "SPECTRAL_EUCLIDEAN_DISTANCE",
        "SPECTRAL_ANGLE_DIFFERENCE",
        "BAND_WITH_MOST_CHANGE",
        "#",
    ]
    | None = "#",
    from_classes="#",
    to_classes="#",
    filter_method: Literal["ALL", "CHANGED_PIXELS_ONLY", "UNCHANGED_PIXELS_ONLY", "#"] | None = "#",
    define_transition_colors: Literal["AVERAGE", "FROM_COLOR", "TO_COLOR", "#"] | None = "#",
    from_classname_field="#",
    to_classname_field="#",
) -> Raster:
    """ComputeChangeRaster_ia(from_raster, to_raster, {compute_change_method}, {from_classes;from_classes...}, {to_classes;to_classes...}, {filter_method}, {define_transition_colors}, {from_classname_field}, {to_classname_field})

       Calculates the absolute, relative, categorical, or spectral difference
       between two raster datasets.

    INPUTS:
     from_raster (Raster Layer / Mosaic Layer / Raster Dataset / Mosaic Dataset / Image Service / String):
         The initial or earlier raster to be analyzed.
     to_raster (Raster Layer / Mosaic Layer / Raster Dataset / Mosaic Dataset / Image Service / String):
         The final or later raster to be analyzed. This is the raster that will
         be compared to the initial raster.
     compute_change_method {String}:
         Specifies the type of calculation that will be performed between the
         two rasters.DIFFERENCE-The mathematical difference, or subtraction,
         between the
         pixel values in the rasters will be calculated. This is the
         default.RELATIVE_DIFFERENCE-The difference in pixel values, accounting
         for the
         quantities of the values being compared, will be
         calculated.CATEGORICAL_DIFFERENCE-The difference between two
         categorical or
         thematic rasters will be calculated. The output will contain class
         transitions that occurred between the two
         rasters.SPECTRAL_EUCLIDEAN_DISTANCE-The Euclidean distance between the
         pixel
         values of two multiband rasters will be
         calculated.SPECTRAL_ANGLE_DIFFERENCE-The spectral angle between the
         pixel values
         of two multiband rasters will be calculated. The output is in
         radians.BAND_WITH_MOST_CHANGE-The band that accounts for the most
         change in
         each pixel between two multiband rasters will be calculated.
     from_classes {String}:
         The list of class names from the from_raster parameter that will be
         included in the computation. If no classes are provided, all classes
         will be included.This parameter is enabled when the
         compute_change_method parameter is
         set to CATEGORICAL_DIFFERENCE.
     to_classes {String}:
         The list of class names from the to_raster parameter that will be
         included in the computation. If no classes are provided, all classes
         will be included.This parameter is enabled when the
         compute_change_method parameter is
         set to CATEGORICAL_DIFFERENCE.
     filter_method {String}:
         Specifies the pixels that will be categorized in the output raster.
         This parameter is enabled when the compute_change_method parameter is
         set to CATEGORICAL_DIFFERENCE.CHANGED_PIXELS_ONLY-Only the pixels that
         changed categories will be
         categorized in the output. Pixels that did not change categories will
         be grouped in a class called Other.UNCHANGED_PIXELS_ONLY-Only the
         pixels that did not change categories
         will be categorized in the output. Pixels that changed categories will
         be grouped in a class called Other.ALL-All pixels will be categorized
         in the output. This is the default.
     define_transition_colors {String}:
         Specifies the color that will be used to symbolize the output classes.
         When a pixel changes from one class type to another, the output pixel
         color represents the initial class type, the final class type, or a
         blend of the two.This parameter is enabled when the
         compute_change_method parameter is
         set to CATEGORICAL_DIFFERENCE.AVERAGE-The color of the output class
         will be the average of the from
         (initial) and to (final) class colors. This is the
         default.FROM_COLOR-The color of the output class will match the color
         of the
         from (initial) class.TO_COLOR-The color of the output class will match
         the color of the to
         (final) class.
     from_classname_field {Field}:
         The field that will store class names in the from_raster
         parameter value. The tool automatically searches for thefield orfield
         to use. ClassNameClass_NameUse this parameter if the input does
         not contain these standard field
         names.
     to_classname_field {Field}:
         The field that will store class names in the to_raster
         parameter value. The tool will automatically search for thefield
         orfield to use. ClassNameClass_NameUse this parameter if the
         input does not contain these standard field
         names.

    OUTPUTS:
     out_raster_dataset (Raster Dataset):
         The output change raster dataset."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        from_raster,
        to_raster,
        compute_change_method,
        from_classes,
        to_classes,
        filter_method,
        define_transition_colors,
        from_classname_field,
        to_classname_field,
    ):
        out_raster_dataset = "#"
        result = arcpy.gp.ComputeChangeRaster_ia(
            from_raster,
            to_raster,
            out_raster_dataset,
            compute_change_method,
            from_classes,
            to_classes,
            filter_method,
            define_transition_colors,
            from_classname_field,
            to_classname_field,
        )
        return _wrapToolRaster("ComputeChangeRaster_sa", str(result.getOutput(0)))

    return Wrapper(
        from_raster,
        to_raster,
        compute_change_method,
        from_classes,
        to_classes,
        filter_method,
        define_transition_colors,
        from_classname_field,
        to_classname_field,
    )


ComputeChangeRaster.__esri_toolname__ = "ComputeChangeRaster_ia"
ComputeChangeRaster.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
]


def ComputeCoherence(
    in_reference_radar_data,
    in_secondary_radar_data,
    polarization_bands="#",
    range_window_size="#",
    azimuth_window_size="#",
) -> Raster:
    """ComputeCoherence_ia(in_reference_radar_data, in_secondary_radar_data, {polarization_bands;polarization_bands...}, {range_window_size}, {azimuth_window_size})

       Computes the similarity between the reference and secondary input
       complex radar data.

    INPUTS:
     in_reference_radar_data (Raster Dataset / Raster Layer):
         The input reference complex radar data.
     in_secondary_radar_data (Raster Dataset / Raster Layer):
         The input secondary complex radar data.
     polarization_bands {String}:
         The polarization bands that will be corrected.The first band is
         selected by default.
     range_window_size {Long}:
         The range window size in pixels.The default value is 10.
     azimuth_window_size {Long}:
         The azimuth window size in pixels.The default value is the minimum
         number of pixels required to create
         an approximate square window. For example, if the range_window_size
         parameter value is 10, the default will be 3.

    OUTPUTS:
     out_radar_data (Raster Dataset):
         The output coherence radar data."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_reference_radar_data, in_secondary_radar_data, polarization_bands, range_window_size, azimuth_window_size
    ):
        out_radar_data = "#"
        result = arcpy.gp.ComputeCoherence_ia(
            in_reference_radar_data,
            in_secondary_radar_data,
            out_radar_data,
            polarization_bands,
            range_window_size,
            azimuth_window_size,
        )
        return _wrapToolRaster("ComputeCoherence_sa", str(result.getOutput(0)))

    return Wrapper(
        in_reference_radar_data, in_secondary_radar_data, polarization_bands, range_window_size, azimuth_window_size
    )


ComputeCoherence.__esri_toolname__ = "ComputeCoherence_ia"
ComputeCoherence.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "::::6"]


def ComputeConfusionMatrix(in_accuracy_assessment_points, out_confusion_matrix):
    """ComputeConfusionMatrix_ia(in_accuracy_assessment_points, out_confusion_matrix)

       Computes a confusion matrix with errors of omission and commission and
       derives a kappa index of agreement, Intersection over Union (IoU), and
       an overall accuracy between the classified map and the reference data.

    INPUTS:
     in_accuracy_assessment_points (Feature Layer):
         The accuracy assessment point feature class created from the
         Create Accuracy Assessment Points tool, containing theandfields. These
         fields are both long integer field types. ClassifiedGrndTruth

    OUTPUTS:
     out_confusion_matrix (Table):
         The output file name of the confusion matrix in table format.The
         format of the table is determined by the output location and path.
         By default, the output will be a geodatabase table. If the path is not
         in a geodatabase, specify a .dbf extension to save it in dBASE format."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_accuracy_assessment_points, out_confusion_matrix):
        result = arcpy.gp.ComputeConfusionMatrix_ia(in_accuracy_assessment_points, out_confusion_matrix)
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_accuracy_assessment_points, out_confusion_matrix)


ComputeConfusionMatrix.__esri_toolname__ = "ComputeConfusionMatrix_ia"
ComputeConfusionMatrix.__esri_toolinfo__ = ["::::1", "::::2"]


def ComputeSARIndices(
    in_radar_data, index: Literal["RVI", "RFDI", "CSI", "#"] | None = "#", polarization_bands="#"
) -> Raster:
    """ComputeSARIndices_ia(in_radar_data, {index}, {polarization_bands})

       Computes various SAR indices for synthetic aperture radar (SAR) data,
       such as Radar Vegetation Index (RVI), Radar Forest Degradation Index
       (RFDI), and Canopy Structure Index (CSI).

    INPUTS:
     in_radar_data (Raster Dataset / Raster Layer):
         The input radar data.
     index {String}:
         Specifies the SAR index that will be computed.RVI-The Radar Vegetation
         Index will be used. RVI is the ratio of
         cross-polarized backscatter to the total backscatter from all
         polarizations. The values range between 0 and 1. RVI values near 0
         indicate barren landscapes, while larger values indicate vegetated
         landscapes. This is the default.RFDI-The Radar Forest Degradation
         Index will be used. RFDI is the
         normalized difference between co- and cross-polarized backscatter.
         Lower RFDI values (less than 0.3) indicate a denser forest. Moderate
         RFDI values (between 0.4 and 0.6) correspond to degraded forests.
         Higher RFDI values (greater than 0.6) indicate deforested
         landscapes.CSI-The Canopy Structure Index will be used. CSI is the
         normalized
         difference of co-polarized backscatter (HH, VV). The values range
         between -1 and +1 in which canopies dominated with vertical structures
         will have CSI values near -1, while those dominated with horizontal
         structures will have CSI values near 1. This option is only supported
         when the input radar data contains HH and VV bands.
     polarization_bands {String}:
         Specifies the polarization bands that will be used in the index
         computation.This parameter is only supported when the in_radar_data
         parameter
         value is a quad-polarized SAR dataset and the index parameter value is
         RVI or RFDI.HH_HV-The horizontal-horizontal and horizontal-vertical
         bands will be
         used in the index computation (dual-polarization). This is the
         default.VV_VH-The vertical-vertical and vertical-horizontal bands will
         be used
         in the index computation (dual-polarization).HH_HV_VH_VV-The
         horizontal-horizontal, horizontal-vertical, vertical-
         horizontal, and vertical-vertical bands will be used in the index
         computation (quad-polarization).

    OUTPUTS:
     out_raster (Raster Dataset):
         The output SAR index raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_radar_data, index, polarization_bands):
        out_raster = "#"
        result = arcpy.gp.ComputeSARIndices_ia(in_radar_data, out_raster, index, polarization_bands)
        return _wrapToolRaster("ComputeSARIndices_sa", str(result.getOutput(0)))

    return Wrapper(in_radar_data, index, polarization_bands)


ComputeSARIndices.__esri_toolname__ = "ComputeSARIndices_ia"
ComputeSARIndices.__esri_toolinfo__ = ["::::1", "::::3", "::::4"]


def ComputeSegmentAttributes(
    in_segmented_raster,
    in_additional_raster="#",
    used_attributes: list[Literal["COLOR", "MEAN", "STD", "COUNT", "COMPACTNESS", "RECTANGULARITY"]]
    | Literal["COLOR", "MEAN", "STD", "COUNT", "COMPACTNESS", "RECTANGULARITY"]
    | str
    | None = "#",
) -> Raster:
    """ComputeSegmentAttributes_ia(in_segmented_raster, {in_additional_raster}, {used_attributes;used_attributes...})

       Computes a set of attributes associated with the segmented image. The
       input raster can be a single-band or 3-band, 8-bit segmented image.

    INPUTS:
     in_segmented_raster (Mosaic Layer / Raster Layer):
         The input segmented raster dataset, where all the pixels belonging to
         a segment have the same converged RGB color. Usually, it is an 8-bit,
         3-band RGB raster, but it can also be a 1-band grayscale raster.
     in_additional_raster {Mosaic Layer / Raster Layer}:
         Ancillary raster datasets, such as a multispectral image or a DEM,
         will be incorporated to generate attributes and other required
         information for the classifier. This raster is necessary when
         calculating attributes such as mean or standard deviation. This
         parameter is optional.
     used_attributes {String}:
         Specifies the attributes that will be included in the attribute table
         associated with the output raster.COLOR-The RGB color values will be
         derived from the input raster on a
         per-segment basis. This is also known as average chromaticity
         color.MEAN-The average digital number (DN) will be derived from the
         optional
         pixel image on a per-segment basis.STD-The standard deviation will be
         derived from the optional pixel
         image on a per-segment basis.COUNT-The number of pixels composing the
         segment, on a per-segment
         basis.COMPACTNESS-The degree to which a segment is compact or
         circular, on a
         per-segment basis. The values range from 0 to 1, in which 1 is a
         circle.RECTANGULARITY-The degree to which the segment is rectangular,
         on a
         per-segment basis. The values range from 0 to 1, in which 1 is a
         rectangle.If the only input into the tool is a segmented image, the
         default
         attributes are COLOR, COUNT, COMPACTNESS, and RECTANGULARITY. If an
         in_additional_raster is also included as an input along with a
         segmented image, then MEAN and STD are available as options.

    OUTPUTS:
     out_index_raster_dataset (Raster Dataset):
         The output segment index raster, where the attributes for each segment
         are recorded in the associated attribute table."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_segmented_raster, in_additional_raster, used_attributes):
        out_index_raster_dataset = "#"
        result = arcpy.gp.ComputeSegmentAttributes_ia(
            in_segmented_raster, out_index_raster_dataset, in_additional_raster, used_attributes
        )
        return _wrapToolRaster("ComputeSegmentAttributes_sa", str(result.getOutput(0)))

    return Wrapper(in_segmented_raster, in_additional_raster, used_attributes)


ComputeSegmentAttributes.__esri_toolname__ = "ComputeSegmentAttributes_ia"
ComputeSegmentAttributes.__esri_toolinfo__ = ["::::1", "::::3", "::::4"]


def Con(in_conditional_raster, in_true_raster_or_constant, in_false_raster_or_constant="#", where_clause="#") -> Raster:
    """Con_ia(in_conditional_raster, in_true_raster_or_constant, {in_false_raster_or_constant}, {where_clause})

       Performs a conditional if/else evaluation on each of the input cells
       of an input raster.

    INPUTS:
     in_conditional_raster (Composite Geodataset):
         The input raster representing the true or false result of the desired
         condition.It can be of integer or floating point type.
     in_true_raster_or_constant (Composite Geodataset):
         The input whose values will be used as the output cell values if the
         condition is true.It can be an integer or a floating-point raster, or
         a constant value.
     in_false_raster_or_constant {Composite Geodataset}:
         The input whose values will be used as the output cell values if the
         condition is false.It can be an integer or a floating-point raster, or
         a constant value.
     where_clause {SQL Expression}:
         A logical expression that determines which of the input cells are to
         be true or false.The expression follows the general form of an SQL
         expression. An
         example of a where_clause is "VALUE > 100".

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_conditional_raster, in_true_raster_or_constant, in_false_raster_or_constant, where_clause):
        if Utils.useDefaultArgumentValue(where_clause):
            if Utils.useDefaultArgumentValue(in_false_raster_or_constant):
                return _wrapLocalFunctionRaster("Con_sa", ["IfThen", in_conditional_raster, in_true_raster_or_constant])
            else:
                return _wrapLocalFunctionRaster(
                    "Con_sa",
                    ["IfThenElse", in_conditional_raster, in_true_raster_or_constant, in_false_raster_or_constant],
                )
        out_raster = "#"
        result = arcpy.gp.Con_ia(
            in_conditional_raster, in_true_raster_or_constant, out_raster, in_false_raster_or_constant, where_clause
        )
        return _wrapToolRaster("Con_sa", str(result.getOutput(0)))

    return Wrapper(in_conditional_raster, in_true_raster_or_constant, in_false_raster_or_constant, where_clause)


Con.__esri_toolname__ = "Con_ia"
Con.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5"]


def ConvertSARUnits(
    in_radar_data,
    conversion_type: Literal[
        "LINEAR_TO_DB", "DB_TO_LINEAR", "AMPLITUDE_TO_INTENSITY", "INTENSITY_TO_AMPLITUDE", "COMPLEX_TO_INTENSITY", "#"
    ]
    | None = "#",
) -> Raster:
    """ConvertSARUnits_ia(in_radar_data, {conversion_type})

       Converts the scaling of the input synthetic aperture radar (SAR) data
       between amplitude and intensity, between linear and decibels (dB), and
       between complex and intensity.

    INPUTS:
     in_radar_data (Raster Dataset / Raster Layer):
         The input radar data.
     conversion_type {String}:
         Specifies the type of backscatter conversion that will be
         applied.LINEAR_TO_DB-The unitless values will be converted to dB
         values. This
         is the default.DB_TO_LINEAR-The dB values will be converted to
         unitless values.AMPLITUDE_TO_INTENSITY-The amplitude values will be
         converted to
         intensity values by squaring the amplitude.INTENSITY_TO_AMPLITUDE-The
         intensity values will be converted to
         amplitude values by applying the square root to the
         intensity.COMPLEX_TO_INTENSITY-The complex values will be converted
         to
         intensity values by adding the square of the real and imaginary
         components.

    OUTPUTS:
     out_radar_data (Raster Dataset):
         The converted radar dataset."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_radar_data, conversion_type):
        out_radar_data = "#"
        result = arcpy.gp.ConvertSARUnits_ia(in_radar_data, out_radar_data, conversion_type)
        return _wrapToolRaster("ConvertSARUnits_sa", str(result.getOutput(0)))

    return Wrapper(in_radar_data, conversion_type)


ConvertSARUnits.__esri_toolname__ = "ConvertSARUnits_ia"
ConvertSARUnits.__esri_toolinfo__ = ["::::1", "::::3"]


def Cos(in_raster_or_constant) -> Raster:
    """Cos_ia(in_raster_or_constant)

       Calculates the cosine of cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input for which to calculate the cosine values.To use a number as
         an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The values are the cosine of the input values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("Cos_sa", ["Cos", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


Cos.__esri_toolname__ = "Cos_ia"
Cos.__esri_toolinfo__ = ["::::1"]


def CosH(in_raster_or_constant) -> Raster:
    """CosH_ia(in_raster_or_constant)

       Calculates the hyperbolic cosine of cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input for which to calculate the hyperbolic cosine values.To use a
         number as an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The values are the hyperbolic cosine of the input
         values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("CosH_sa", ["CosH", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


CosH.__esri_toolname__ = "CosH_ia"
CosH.__esri_toolinfo__ = ["::::1"]


def CreateAccuracyAssessmentPoints(
    in_class_data,
    out_points,
    target_field: Literal["CLASSIFIED", "GROUND_TRUTH", "#"] | None = "#",
    num_random_points="#",
    sampling: Literal["STRATIFIED_RANDOM", "EQUALIZED_STRATIFIED_RANDOM", "RANDOM", "#"] | None = "#",
    polygon_dimension_field="#",
):
    """CreateAccuracyAssessmentPoints_ia(in_class_data, out_points, {target_field}, {num_random_points}, {sampling}, {polygon_dimension_field})

       Creates randomly sampled points for postclassification accuracy
       assessment.

    INPUTS:
     in_class_data (Mosaic Layer / Raster Layer / Feature Layer):
         The input classification image or other thematic GIS reference data.
         The input can be a raster or feature class.Typical data is a
         classification image of a single band, integer data
         type.If using polygons as input, only use those that are not used as
         training samples. They can also be GIS land-cover data in shapefile or
         feature class format.
     target_field {String}:
         Specifies whether the input data is a classified image or ground truth
         data.CLASSIFIED-The input is a classified image. This is the
         default.GROUND_TRUTH-The input is reference data.
     num_random_points {Long}:
         The total number of random points that will be generated.The actual
         number may exceed but never fall below this number,
         depending on sampling strategy and number of classes. The default
         number of randomly generated points is 500.
     sampling {String}:
         Specifies the sampling scheme that will be
         used.STRATIFIED_RANDOM-Randomly distributed points will be created in
         each
         class, in which each class has a number of points proportional to its
         relative area. This is the defaultEQUALIZED_STRATIFIED_RANDOM-Randomly
         distributed points will be
         created in each class, in which each class has the same number of
         points.RANDOM-Randomly distributed points will be created throughout
         the
         image.
     polygon_dimension_field {Field}:
         A field that defines the dimension (time) of the features. This
         parameter is used only if the classification result is a
         multidimensional raster and you want to generate assessment points
         from a feature class, such as land classification polygons for
         multiple years.

    OUTPUTS:
     out_points (Feature Class):
         The output point shapefile or feature class that contains the random
         points to be used for accuracy assessment."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_class_data, out_points, target_field, num_random_points, sampling, polygon_dimension_field):
        result = arcpy.gp.CreateAccuracyAssessmentPoints_ia(
            in_class_data, out_points, target_field, num_random_points, sampling, polygon_dimension_field
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_class_data, out_points, target_field, num_random_points, sampling, polygon_dimension_field)


CreateAccuracyAssessmentPoints.__esri_toolname__ = "CreateAccuracyAssessmentPoints_ia"
CreateAccuracyAssessmentPoints.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6"]


def CreateBinaryMask(
    in_raster,
    background_value="#",
    flood_fill: Literal["FLOOD_FILL", "NO_FLOOD_FILL", "#"] | None = "#",
    expand_background="#",
    expand_mask="#",
    min_region_size="#",
    background_nodata: Literal["BACKGROUND_NODATA", "BACKGROUND_DATA", "#"] | None = "#",
) -> Raster:
    """CreateBinaryMask_ia(in_raster, {background_value}, {flood_fill}, {expand_background}, {expand_mask}, {min_region_size}, {background_nodata})

       Converts an input raster dataset to a binary raster. Pixels are
       labeled as either mask or background based on user-defined values.

    INPUTS:
     in_raster (Mosaic Layer / Raster Layer / Image Service / String / Raster Dataset / Mosaic Dataset):
         The input raster dataset. If the input is multiband, the first band
         will be used by default.
     background_value {Double}:
         The background value for the output raster. The default value is 0.
     flood_fill {Boolean}:
         Specifies how background pixel values will be
         determined.FLOOD_FILL-Background pixel values will be determined by
         the flood
         fill operation, which fills the connected pixels from the image
         boundary to the mask boundary. Pixels inside the mask will not be
         converted to background regardless of their
         value.NO_FLOOD_FILL-Background pixel values will be determined by the
         specified background value. This is the default.
     expand_background {Long}:
         The number of pixels that will be used to expand or shrink the
         background. Negative values will shrink the background.
     expand_mask {Long}:
         The number of pixels that will be used to expand or shrink the mask.
         Negative values will shrink the mask.
     min_region_size {Long}:
         The number of connected pixels that will be used to define a mask
         region. Mask regions that are smaller than this size will be
         classified as background.
     background_nodata {Boolean}:
         Specifies whether the background value will be set to
         NoData.BACKGROUND_NODATA-The background value will be set to
         NoData.BACKGROUND_DATA-The background value will not be set to NoData.
         This
         is the default.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output binary raster dataset. Supported formats are TIFF, CRF, and
         PNG."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_raster, background_value, flood_fill, expand_background, expand_mask, min_region_size, background_nodata
    ):
        out_raster = "#"
        result = arcpy.gp.CreateBinaryMask_ia(
            in_raster,
            out_raster,
            background_value,
            flood_fill,
            expand_background,
            expand_mask,
            min_region_size,
            background_nodata,
        )
        return _wrapToolRaster("CreateBinaryMask_sa", str(result.getOutput(0)))

    return Wrapper(
        in_raster, background_value, flood_fill, expand_background, expand_mask, min_region_size, background_nodata
    )


CreateBinaryMask.__esri_toolname__ = "CreateBinaryMask_ia"
CreateBinaryMask.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7", "::::8"]


def CreateColorComposite(
    in_raster, method: Literal["BAND_NAMES", "BAND_IDS"], red_expression, green_expression, blue_expression
) -> Raster:
    """CreateColorComposite_ia(in_raster, method, red_expression, green_expression, blue_expression)

       Creates a three-band raster dataset from a multiband raster dataset.

    INPUTS:
     in_raster (Raster Dataset / Raster Layer):
         The input multiband raster data.
     method (String):
         Specifies the method that will be used to extract bands.BAND_NAMES-The
         band name representing the wavelength interval on the
         electromagnetic spectrum (such as Red, Near Infrared, or Thermal
         Infrared) or the polarization (such as VH, VV, HH, or HV) will be
         used. This is the default.BAND_IDS-The band number (such as B1, B2,
         or B3) will be used.
     red_expression (String):
         The calculation that will be assigned to the first band.A band name,
         band ID, or an algebraic expression using the bands.The supported
         operators are unary: plus (+), minus (-), times (*), and
         divide (/).
     green_expression (String):
         The calculation that will be assigned to the second band.A band name,
         band ID, or an algebraic expression using the bands.The supported
         operators are unary: plus (+), minus (-), times (*), and
         divide (/).
     blue_expression (String):
         The calculation that will be assigned to the third band.A band name,
         band ID, or an algebraic expression using the bands.The supported
         operators are unary: plus (+), minus (-), times (*), and
         divide (/).

    OUTPUTS:
     out_raster (Raster Dataset):
         The output three-band composite raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, method, red_expression, green_expression, blue_expression):
        out_raster = "#"
        result = arcpy.gp.CreateColorComposite_ia(
            in_raster, out_raster, method, red_expression, green_expression, blue_expression
        )
        return _wrapToolRaster("CreateColorComposite_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, method, red_expression, green_expression, blue_expression)


CreateColorComposite.__esri_toolname__ = "CreateColorComposite_ia"
CreateColorComposite.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6"]


def Deburst(in_radar_data, polarization_bands="#") -> Raster:
    """Deburst_ia(in_radar_data, {polarization_bands;polarization_bands...})

       Merges the multiple bursts from the input Sentinel-1 Single Look
       Complex (SLC) synthetic aperture radar (SAR) data and outputs a
       single, seamless subswath raster.

    INPUTS:
     in_radar_data (Raster Dataset / Raster Layer):
         The input radar data.
     polarization_bands {String}:
         The polarization bands that will be corrected.The first band is
         selected by default.

    OUTPUTS:
     out_radar_data (Raster Dataset):
         The debursted radar data."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_radar_data, polarization_bands):
        out_radar_data = "#"
        result = arcpy.gp.Deburst_ia(in_radar_data, out_radar_data, polarization_bands)
        return _wrapToolRaster("Deburst_sa", str(result.getOutput(0)))

    return Wrapper(in_radar_data, polarization_bands)


Deburst.__esri_toolname__ = "Deburst_ia"
Deburst.__esri_toolinfo__ = ["::::1", "::::3"]


def DeepLearningModelToEcd(in_deep_learning_model, in_classification_info_json, out_classifier_definition):
    """DeepLearningModelToEcd_ia(in_deep_learning_model, in_classification_info_json, out_classifier_definition)

       Converts a deep learning model to an Esri classifier definition file
       (.ecd).

    INPUTS:
     in_deep_learning_model (File):
         The binary model file generated by a deep learning package such as
         Google TensorFlow, Microsoft CNTK, or similar application.
     in_classification_info_json (File):
         The class information JSON file. See the JSON file example above.

    OUTPUTS:
     out_classifier_definition (File):
         The .ecd file that can be used in thefunction and Classify
         Raster tool. Classify        The .ecd output file only works as
         input to the Esri
         Pythonoradaptor function. ClassifyDetect"""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_deep_learning_model, in_classification_info_json, out_classifier_definition):
        result = arcpy.gp.DeepLearningModelToEcd_ia(
            in_deep_learning_model, in_classification_info_json, out_classifier_definition
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_deep_learning_model, in_classification_info_json, out_classifier_definition)


DeepLearningModelToEcd.__esri_toolname__ = "DeepLearningModelToEcd_ia"
DeepLearningModelToEcd.__esri_toolinfo__ = ["::::1", "::::2", "::::3"]


def Despeckle(
    in_radar_data,
    polarization_bands="#",
    filter_type: Literal["LEE", "ENHANCED_LEE", "REFINED_LEE", "FROST", "KUAN", "GAMMA_MAP", "#"] | None = "#",
    filter_size: Literal["3x3", "5x5", "7x7", "9x9", "11x11", "#"] | None = "#",
    noise_model: Literal["MULTIPLICATIVE_NOISE", "ADDITIVE_NOISE", "ADDITIVE_AND_MULTIPLICATIVE_NOISE", "#"]
    | None = "#",
    noise_variance="#",
    add_noise_mean="#",
    mult_noise_mean="#",
    number_of_looks="#",
    damp_factor="#",
) -> Raster:
    """Despeckle_ia(in_radar_data, {polarization_bands;polarization_bands...}, {filter_type}, {filter_size}, {noise_model}, {noise_variance}, {add_noise_mean}, {mult_noise_mean}, {number_of_looks}, {damp_factor})

       Corrects the input synthetic aperture radar (SAR) data for speckle,
       which is a result of coherent illumination that resembles a grainy or
       salt and pepper effect.

    INPUTS:
     in_radar_data (Raster Dataset / Raster Layer):
         The input radar data.
     polarization_bands {String}:
         The polarization bands that will be filtered.The first band is
         selected by default.
     filter_type {String}:
         Specifies the type of smoothing algorithm or filter that will be
         applied.LEE-A spatial filter will be applied to each pixel in an image
         to
         reduce the speckle noise. This option filters the data based on local
         statistics calculated within a square window. This filter is useful
         for smoothing speckled data that has an additive or multiplicative
         component.ENHANCED_LEE-A spatial filter that preserves the sharpness
         and detail
         of the image will be applied to reduce the speckle noise. This option
         is an enhanced version of the Lee filter. This filter is useful for
         reducing speckle while preserving texture information.REFINED_LEE-A
         spatial filter will be applied to selected pixels, based
         on local statistics, to reduce the speckle noise. This filter uses a
         nonsquare filter window to match the direction of edges. It is useful
         for reducing speckle while preserving edges. This is the
         default.FROST-An exponentially damped circularly symmetric filter that
         uses
         local statistics within individual filter windows will be applied to
         reduce the speckle noise. This does not affect image features at the
         edges. This filter is useful for reducing speckle while preserving
         edges.KUAN-A spatial filter will be applied to each pixel in an image
         to
         reduce the speckle noise. This filters the data based on local
         statistics of the centered pixel value that is calculated using the
         neighboring pixels. This filter is useful for reducing speckle while
         preserving edges.GAMMA_MAP-A Bayesian analysis and Gamma distribution
         filter will be
         applied to reduce the speckle noise. This filter is useful for
         reducing speckle while preserving edges.
     filter_size {String}:
         Specifies the size of the pixel window that will be used to filter
         noise.3x3-A 3-by-3 filter size will be used. This is the default.5x5-A
         5-by-5 filter size will be used.7x7-A 7-by-7 filter size will be
         used.9x9-A 9-by-9 filter size will be used.11x11-An 11-by-11 filter
         size will be used.This parameter is only valid when the filter_type
         parameter is set to
         LEE, ENHANCED_LEE, FROST, KUAN, or GAMMA_MAP.
     noise_model {String}:
         This parameter is only valid when the filter_type parameter is set to
         LEE.
     noise_variance {Double}:
         The noise variance of the radar image. The default is 0.25.This
         parameter is only valid when the filter_type parameter is set to
         LEE and the noise_model parameter is set to ADDITIVE_NOISE or
         ADDITIVE_AND_MULTIPLICATIVE_NOISE.
     add_noise_mean {Double}:
         The mean value of additive noise. A larger noise mean value will
         produce less smoothing, while a smaller value results in more
         smoothing. The default value is 0.This parameter is only valid when
         the filter_type parameter is set to
         LEE and the noise_model parameter is set to ADDITIVE_NOISE or
         ADDITIVE_AND_MULTIPLICATIVE_NOISE.
     mult_noise_mean {Double}:
         The mean value of multiplicative noise. A larger noise mean value will
         produce less smoothing, while a smaller value results in more
         smoothing. The default value is 1.This parameter is only valid when
         the filter_type parameter is set to
         LEE and the noise_model parameter is set to MULTIPLICATIVE_NOISE or
         ADDITIVE_AND_MULTIPLICATIVE_NOISE.
     number_of_looks {Long}:
         The number of looks value of the image, which controls image smoothing
         and estimates noise variance. A smaller value results in more
         smoothing, while a larger value retains more image features. The
         default value is 1.This parameter is only valid when the filter_type
         parameter is set to
         ENHANCED_LEE, KUAN, or GAMMA_MAP or when the filter_type parameter is
         set to LEE and the noise_model parameter is set to
         MULTIPLICATIVE_NOISE.
     damp_factor {Long}:
         The exponential damping level of smoothing that will be applied. A
         damping value greater than 1 will result in better edge preservation
         but less smoothing. Values less than 1 will result in more smoothing.
         A value of 0 will produce results similar to a low-pass filter. The
         default is 1.

    OUTPUTS:
     out_radar_data (Raster Dataset):
         The despeckled radar data."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_radar_data,
        polarization_bands,
        filter_type,
        filter_size,
        noise_model,
        noise_variance,
        add_noise_mean,
        mult_noise_mean,
        number_of_looks,
        damp_factor,
    ):
        out_radar_data = "#"
        result = arcpy.gp.Despeckle_ia(
            in_radar_data,
            out_radar_data,
            polarization_bands,
            filter_type,
            filter_size,
            noise_model,
            noise_variance,
            add_noise_mean,
            mult_noise_mean,
            number_of_looks,
            damp_factor,
        )
        return _wrapToolRaster("Despeckle_sa", str(result.getOutput(0)))

    return Wrapper(
        in_radar_data,
        polarization_bands,
        filter_type,
        filter_size,
        noise_model,
        noise_variance,
        add_noise_mean,
        mult_noise_mean,
        number_of_looks,
        damp_factor,
    )


Despeckle.__esri_toolname__ = "Despeckle_ia"
Despeckle.__esri_toolinfo__ = [
    "::::1",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
]


def DetectBrightOceanObjects(
    in_radar_data,
    out_feature_class,
    out_type: Literal["BOUNDS", "PERIMETER", "#"] | None = "#",
    min_object_width="#",
    max_object_width="#",
    min_object_length="#",
    max_object_length="#",
    mask_features="#",
    feature_type: Literal["LAND", "WATER", "#"] | None = "#",
    in_dem_raster="#",
    geoid: Literal["GEOID", "NONE", "#"] | None = "#",
    mask_tolerance="#",
):
    """DetectBrightOceanObjects_ia(in_radar_data, out_feature_class, {out_type}, {min_object_width}, {max_object_width}, {min_object_length}, {max_object_length}, {mask_features}, {feature_type}, {in_dem_raster}, {geoid}, {mask_tolerance})

       Detects potential bright human-made objects-such as ships, oil rigs,
       and windmills-while masking out the synthetic aperture radar (SAR)
       data outside the region of interest.

    INPUTS:
     in_radar_data (Raster Dataset / Raster Layer):
         The input radar data.
     out_type {String}:
         Specifies the type of boundary that will be used for the output
         feature class.BOUNDS-The minimum bounding box of the detected object
         will be used.
         This is the default.PERIMETER-An outline of the perimeter of the
         detected object will be
         used.
     min_object_width {Linear Unit}:
         The minimum width of an object to be detected. The width must be a
         positive value.The default value is 10 meters.
     max_object_width {Linear Unit}:
         The maximum width of an object to be detected. The width must be a
         positive value.The default value is 100 meters.
     min_object_length {Linear Unit}:
         The minimum length of an object to be detected. The length must be a
         positive value.The default value is 50 meters.
     max_object_length {Linear Unit}:
         The maximum length of an object to be detected. The length must be a
         positive value.The default value is 500 meters.
     mask_features {Feature Layer}:
         A land or water polygon feature. This polygon will be used to create a
         mask.
     feature_type {String}:
         Specifies the type of polygon the mask_features parameter value
         represents. This parameter is required if the mask_features parameter
         is specified.LAND-The mask input is a land polygon. An inverted mask
         will be
         created using this input.WATER-The mask input is a water polygon. A
         mask will be created using
         this input.
     in_dem_raster {Mosaic Layer / Raster Layer}:
         The input DEM.If the input radar data is not orthorectified, this DEM
         will be used
         to orthorectify it.If no value is provided for the mask_features
         parameter, this DEM will
         also be used to create a land mask.
     geoid {Boolean}:
         Specifies whether the vertical reference system of the input DEM will
         be transformed to ellipsoidal height. Most elevation datasets are
         referenced to sea level orthometric height, so a correction is
         required in these cases to convert to ellipsoidal height.GEOID-A geoid
         correction will be made to convert orthometric height to
         ellipsoidal height (based on EGM96 geoid). This is the default.NONE-No
         geoid correction will be made. Use this option only if the DEM
         is provided in ellipsoidal height.
     mask_tolerance {Linear Unit}:
         The buffer distance surrounding the mask created from either the
         mask_features parameter or the in_dem_raster parameter. The distance
         cannot be negative. The default value is 100 meters.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class of detected bright ocean objects."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_radar_data,
        out_feature_class,
        out_type,
        min_object_width,
        max_object_width,
        min_object_length,
        max_object_length,
        mask_features,
        feature_type,
        in_dem_raster,
        geoid,
        mask_tolerance,
    ):
        result = arcpy.gp.DetectBrightOceanObjects_ia(
            in_radar_data,
            out_feature_class,
            out_type,
            min_object_width,
            max_object_width,
            min_object_length,
            max_object_length,
            mask_features,
            feature_type,
            in_dem_raster,
            geoid,
            mask_tolerance,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_radar_data,
        out_feature_class,
        out_type,
        min_object_width,
        max_object_width,
        min_object_length,
        max_object_length,
        mask_features,
        feature_type,
        in_dem_raster,
        geoid,
        mask_tolerance,
    )


DetectBrightOceanObjects.__esri_toolname__ = "DetectBrightOceanObjects_ia"
DetectBrightOceanObjects.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
]


def DetectChangeUsingChangeAnalysisRaster(
    in_change_analysis_raster,
    change_type: Literal[
        "TIME_OF_LATEST_CHANGE",
        "TIME_OF_EARLIEST_CHANGE",
        "TIME_OF_LARGEST_CHANGE",
        "NUM_OF_CHANGES",
        "TIME_OF_LONGEST_CHANGE",
        "TIME_OF_SHORTEST_CHANGE",
        "TIME_OF_FASTEST_CHANGE",
        "TIME_OF_SLOWEST_CHANGE",
    ],
    max_number_changes="#",
    segment_date: Literal["BEGINNING_OF_SEGMENT", "END_OF_SEGMENT", "#"] | None = "#",
    change_direction: Literal["ALL", "INCREASE", "DECREASE", "#"] | None = "#",
    filter_by_year: Literal["FILTER_BY_YEAR", "NO_FILTER_BY_YEAR", "#"] | None = "#",
    min_year="#",
    max_year="#",
    filter_by_duration: Literal["FILTER_BY_DURATION", "NO_FILTER_BY_DURATION", "#"] | None = "#",
    min_duration="#",
    max_duration="#",
    filter_by_magnitude: Literal["FILTER_BY_MAGNITUDE", "NO_FILTER_BY_MAGNITUDE", "#"] | None = "#",
    min_magnitude="#",
    max_magnitude="#",
    filter_by_start_value: Literal["FILTER_BY_START_VALUE", "NO_FILTER_BY_START_VALUE", "#"] | None = "#",
    min_start_value="#",
    max_start_value="#",
    filter_by_end_value: Literal["FILTER_BY_END_VALUE", "NO_FILTER_BY_END_VALUE", "#"] | None = "#",
    min_end_value="#",
    max_end_value="#",
) -> Raster:
    """DetectChangeUsingChangeAnalysisRaster_ia(in_change_analysis_raster, out_raster, change_type, {max_number_changes}, {segment_date}, {change_direction}, {filter_by_year}, {min_year}, {max_year}, {filter_by_duration}, {min_duration}, {max_duration}, {filter_by_magnitude}, {min_magnitude}, {max_magnitude}, {filter_by_start_value}, {min_start_value}, {max_start_value}, {filter_by_end_value}, {min_end_value}, {max_end_value})

       Generates a raster containing pixel change information using the
       output change analysis raster from the Analyze Changes Using CCDC tool
       or the Analyze Changes Using LandTrendr tool.

    INPUTS:
     in_change_analysis_raster (Raster Dataset / Raster Layer / Image Service):
         The change analysis raster generated from the Analyze Changes Using
         CCDC tool or the Analyze Changes Using LandTrendr tool.
     change_type (String):
         Specifies the change information that will be calculated for each
         pixel.TIME_OF_LATEST_CHANGE-Each pixel will contain the date of its
         most
         recent change in the time series. This is the
         default.TIME_OF_EARLIEST_CHANGE-Each pixel will contain the date of
         its
         earliest change in the time series.TIME_OF_LARGEST_CHANGE-Each pixel
         will contain the date of its most
         significant change in the time series.NUM_OF_CHANGES-Each pixel will
         contain the total number of times it
         changed in the time series.TIME_OF_LONGEST_CHANGE-Each pixel will
         contain the date of change at
         the beginning or end of the longest transition segment in the time
         series.TIME_OF_SHORTEST_CHANGE-Each pixel will contain the date of
         change at
         the beginning or end of the shortest transition segment in the time
         series.TIME_OF_FASTEST_CHANGE-Each pixel will contain the date of
         change at
         the beginning or end of the transition that occurred most
         quickly.TIME_OF_SLOWEST_CHANGE-Each pixel will contain the date of
         change at
         the beginning or end of the transition that occurred most slowly.
     max_number_changes {Long}:
         The maximum number of changes per pixel that will be calculated. This
         number corresponds to the number of bands in the output raster. The
         default is 1, meaning only one change date will be calculated, and the
         output raster will contain only one band.This parameter is not enabled
         when the change_type parameter is set to
         NUM_OF_CHANGES.
     segment_date {String}:
         Specifies whether the date at the beginning of a change segment will
         be extracted or at the end.This parameter is available only when the
         input change analysis raster
         is the output from the Analyze Changes Using LandTrendr
         tool.BEGINNING_OF_SEGMENT-The date at the beginning of a change
         segment
         will be extracted. This is the default.END_OF_SEGMENT-The date at the
         end of a change segment will be
         extracted.
     change_direction {String}:
         Specifies the direction of change that will be included in the
         analysis.This parameter is available only when the input change
         analysis raster
         is the output from the Analyze Changes Using LandTrendr tool.ALL-All
         change directions will be included in the output. This is the
         default.INCREASE-Only change in the positive or increasing direction
         will be
         included in the output.DECREASE-Only change in the negative or
         decreasing direction will be
         included in the output.
     filter_by_year {Boolean}:
         Specifies whether the output will be filtered by a range of
         years.FILTER_BY_YEAR-Results will be filtered so that only changes
         that
         occurred within a specific range of years will be included in the
         output.NO_FILTER_BY_YEAR-Results will not be filtered by year. This is
         the
         default.
     min_year {Long}:
         The earliest year that will be used to filter results. This parameter
         is required if the filter_by_year parameter is set to FILTER_BY_YEAR.
     max_year {Long}:
         The latest year that will be used to filter results.This parameter is
         required if the filter_by_year parameter is set to
         FILTER_BY_YEAR.
     filter_by_duration {Boolean}:
         Specifies whether results will be filtered by the change duration.This
         parameter is enabled only when the input change analysis raster
         is the output from the Analyze Changes Using LandTrendr
         tool.FILTER_BY_DURATION-Results will be filtered by duration so that
         only
         the changes that lasted a given amount of time will be included in the
         output.NO_FILTER_BY_DURATION-Results will not be filtered by duration.
         This
         is the default.
     min_duration {Double}:
         The minimum number of consecutive years that will be included in the
         results.This parameter is required if the filter_by_duration parameter
         is set
         to FILTER_BY_DURATION.
     max_duration {Double}:
         The maximum number of consecutive years that will be included in the
         results.This parameter is required if the filter_by_duration parameter
         is set
         to FILTER_BY_DURATION.
     filter_by_magnitude {Boolean}:
         Specifies whether results will be filtered by change
         magnitude. Checked-Results will be filtered by magnitude so
         that only the changes
         of a given magnitude will be included in the output.Unchecked-Results
         will not be filtered by magnitude. This is the
         default.Specifies whether results will be filtered by change
         magnitude.FILTER_BY_MAGNITUDE-Results will be filtered by magnitude so
         that only
         the changes of a given magnitude will be included in the
         output.NO_FILTER_BY_MAGNITUDE-Results will not be filtered by
         magnitude. This
         is the default.
     min_magnitude {Double}:
         The minimum magnitude that will be included in the results.This
         parameter is required if the filter_by_magnitude parameter is set
         to FILTER_BY_MAGNITUDE.
     max_magnitude {Double}:
         The maximum magnitude that will be included in the results.This
         parameter is required if the filter_by_magnitude parameter is set
         to FILTER_BY_MAGNITUDE.
     filter_by_start_value {Boolean}:
         Specifies whether results will be filtered by start value.This
         parameter is enabled only when the input change analysis raster
         is the output from the Analyze Changes Using LandTrendr
         tool.FILTER_BY_START_VALUE-Results will be filtered by start value so
         that
         only the changes of a given start value will be included in the
         output.NO_FILTER_BY_START_VALUE-Results will not be filtered by start
         value.
         This is the default.
     min_start_value {Double}:
         The minimum start value that will be included in the results.This
         parameter is required if the filter_by_start_value parameter is
         set to FILTER_BY_START_VALUE.
     max_start_value {Double}:
         The maximum start value that will be included in the results.This
         parameter is required if the filter_by_start_value parameter is
         set to FILTER_BY_START_VALUE.
     filter_by_end_value {Boolean}:
         Specifies whether results will be filtered by end value.This parameter
         is enabled only when the input change analysis raster
         is the output from the Analyze Changes Using LandTrendr
         tool.FILTER_BY_END_VALUE-Results will be filtered by end value so that
         only
         the changes of a given end value will be included in the
         output.NO_FILTER_BY_END_VALUE-Results will not be filtered by end
         value. This
         is the default.
     min_end_value {Double}:
         The minimum end value that will be included in the results.This
         parameter is required if the filter_by_end_value parameter is set
         to FILTER_BY_END_VALUE.
     max_end_value {Double}:
         The maximum end value that will be included in the results.This
         parameter is required if the filter_by_end_value parameter is set
         to FILTER_BY_END_VALUE.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster containing the detected change information."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_change_analysis_raster,
        change_type,
        max_number_changes,
        segment_date,
        change_direction,
        filter_by_year,
        min_year,
        max_year,
        filter_by_duration,
        min_duration,
        max_duration,
        filter_by_magnitude,
        min_magnitude,
        max_magnitude,
        filter_by_start_value,
        min_start_value,
        max_start_value,
        filter_by_end_value,
        min_end_value,
        max_end_value,
    ):
        out_raster = "#"
        result = arcpy.gp.DetectChangeUsingChangeAnalysisRaster_ia(
            in_change_analysis_raster,
            out_raster,
            change_type,
            max_number_changes,
            segment_date,
            change_direction,
            filter_by_year,
            min_year,
            max_year,
            filter_by_duration,
            min_duration,
            max_duration,
            filter_by_magnitude,
            min_magnitude,
            max_magnitude,
            filter_by_start_value,
            min_start_value,
            max_start_value,
            filter_by_end_value,
            min_end_value,
            max_end_value,
        )
        return _wrapToolRaster("DetectChangeUsingChangeAnalysisRaster_sa", str(result.getOutput(0)))

    return Wrapper(
        in_change_analysis_raster,
        change_type,
        max_number_changes,
        segment_date,
        change_direction,
        filter_by_year,
        min_year,
        max_year,
        filter_by_duration,
        min_duration,
        max_duration,
        filter_by_magnitude,
        min_magnitude,
        max_magnitude,
        filter_by_start_value,
        min_start_value,
        max_start_value,
        filter_by_end_value,
        min_end_value,
        max_end_value,
    )


DetectChangeUsingChangeAnalysisRaster.__esri_toolname__ = "DetectChangeUsingChangeAnalysisRaster_ia"
DetectChangeUsingChangeAnalysisRaster.__esri_toolinfo__ = [
    "::::1",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
    "::::13",
    "::::14",
    "::::15",
    "::::16",
    "::::17",
    "::::18",
    "::::19",
    "::::20",
    "::::21",
]


def DetectChangeUsingDeepLearning(from_raster, to_raster, in_model_definition, arguments="#") -> Raster:
    """DetectChangeUsingDeepLearning_ia(from_raster, to_raster, in_model_definition, {arguments;arguments...})

       Runs a trained deep learning model to detect change between two
       rasters.

    INPUTS:
     from_raster (Raster Dataset / Raster Layer / Mosaic Layer / Image Service / Map Server / Map Server Layer / Internet Tiled Layer):
         The input raster before the change.
     to_raster (Raster Dataset / Raster Layer / Mosaic Layer / Image Service / Map Server / Map Server Layer / Internet Tiled Layer):
         The input raster after the change.
     in_model_definition (File / String):
         The in_model_definition parameter value can be an Esri model
         definition JSON file (.emd), a JSON string, or a deep learning model
         package (.dlpk). A JSON string is useful when this tool is used on the
         server so you can paste the JSON string rather than upload the .emd
         file. The .dlpk file must be stored locally.It contains the path to
         the deep learning binary model file, the path
         to the Python raster function to be used, and other parameters such as
         preferred tile size or padding.
     arguments {Value Table}:
         The information from the in_model_definition parameter will be used to
         set the default values for this parameter. These arguments vary,
         depending on the model architecture. The following are supported model
         arguments for models trained in ArcGIS. ArcGIS pretrained models and
         custom deep learning models may have additional arguments that the
         tool supports.padding-The number of pixels at the border of image
         tiles from which
         predictions are blended for adjacent tiles. To smooth the output while
         reducing artifacts, increase the value. The maximum value of the
         padding can be half of the tile size value. The argument is available
         for all model architectures.batch_size-The number of image tiles
         processed in each step of the
         model inference. This depends on the memory of your graphic card. The
         argument is available for all model architectures.

    OUTPUTS:
     out_classified_raster (Raster Dataset):
         The output classified raster that shows the change."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(from_raster, to_raster, in_model_definition, arguments):
        out_classified_raster = "#"
        result = arcpy.gp.DetectChangeUsingDeepLearning_ia(
            from_raster, to_raster, out_classified_raster, in_model_definition, arguments
        )
        return _wrapToolRaster("DetectChangeUsingDeepLearning_sa", str(result.getOutput(0)))

    return Wrapper(from_raster, to_raster, in_model_definition, arguments)


DetectChangeUsingDeepLearning.__esri_toolname__ = "DetectChangeUsingDeepLearning_ia"
DetectChangeUsingDeepLearning.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5"]


def DetectControlPoints(
    in_mosaic_dataset,
    in_control_points,
    out_control_points,
    out_folder_image_chips="#",
    tile_size="#",
    number_tie_points_per_gcp="#",
):
    """DetectControlPoints_ia(in_mosaic_dataset, in_control_points, out_control_points, {out_folder_image_chips}, {tile_size}, {number_tie_points_per_gcp})

       Detects ground control points in a mosaic dataset.

    INPUTS:
     in_mosaic_dataset (Mosaic Dataset / Mosaic Layer):
         The mosaic dataset that contains the source imagery from which the
         ground control points will be created.
     in_control_points (File / Feature Class / Feature Layer / String):
         The input control point set that contains a list of ground control
         point features.
     tile_size {Long}:
         The tile size of the output image chips.The default tile size is 1024.
     number_tie_points_per_gcp {Long}:
         The number of tie points for each ground control point.The default is
         5.

    OUTPUTS:
     out_control_points (Feature Class):
         The output ground control point features.
     out_folder_image_chips {Folder}:
         The output folder of image chips."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_mosaic_dataset,
        in_control_points,
        out_control_points,
        out_folder_image_chips,
        tile_size,
        number_tie_points_per_gcp,
    ):
        result = arcpy.gp.DetectControlPoints_ia(
            in_mosaic_dataset,
            in_control_points,
            out_control_points,
            out_folder_image_chips,
            tile_size,
            number_tie_points_per_gcp,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_mosaic_dataset,
        in_control_points,
        out_control_points,
        out_folder_image_chips,
        tile_size,
        number_tie_points_per_gcp,
    )


DetectControlPoints.__esri_toolname__ = "DetectControlPoints_ia"
DetectControlPoints.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6"]


def DetectDarkOceanAreas(
    in_radar_data,
    min_area="#",
    mask_features="#",
    feature_type: Literal["LAND", "WATER", "#"] | None = "#",
    in_dem_raster="#",
    geoid: Literal["GEOID", "NONE", "#"] | None = "#",
    mask_tolerance="#",
) -> Raster:
    """DetectDarkOceanAreas_ia(in_radar_data, {min_area}, {mask_features}, {feature_type}, {in_dem_raster}, {geoid}, {mask_tolerance})

       Identifies potential dark pixels belonging to oil spills or algae, and
       clusters these pixels, while masking out the synthetic aperture radar
       (SAR) data outside the region of interest.

    INPUTS:
     in_radar_data (Raster Dataset / Raster Layer):
         The input radar data.
     min_area {Areal Unit}:
         The minimum area to be detected.The size cannot be negative. The
         default value is 10000 square meters.
     mask_features {Feature Layer}:
         A land or water polygon feature. This polygon will be used to create a
         mask.
     feature_type {String}:
         Specifies the type of polygon the mask_features parameter value
         represents. This parameter is required if the mask_features parameter
         is specified.LAND-The mask input is a land polygon. An inverted mask
         will be
         created using this input.WATER-The mask input is a water polygon. A
         mask will be created using
         this input.
     in_dem_raster {Mosaic Layer / Raster Layer}:
         The input DEM.If the input radar data is not orthorectified, this DEM
         will be used
         to orthorectify it.If no value is provided for the mask_features
         parameter, this DEM will
         also be used to create a land mask.
     geoid {Boolean}:
         Specifies whether the vertical reference system of the input DEM will
         be transformed to ellipsoidal height. Most elevation datasets are
         referenced to sea level orthometric height, so a correction is
         required in these cases to convert to ellipsoidal height.GEOID-A geoid
         correction will be made to convert orthometric height to
         ellipsoidal height (based on EGM96 geoid). This is the default.NONE-No
         geoid correction will be made. Use this option only if the DEM
         is provided in ellipsoidal height.
     mask_tolerance {Linear Unit}:
         The buffer distance surrounding the mask created from either the
         mask_features parameter or the in_dem_raster parameter. The distance
         cannot be negative. The default value is 100 meters.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output binary raster of the detected dark ocean areas. A value of
         1 corresponds to a detected dark area."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_radar_data, min_area, mask_features, feature_type, in_dem_raster, geoid, mask_tolerance):
        out_raster = "#"
        result = arcpy.gp.DetectDarkOceanAreas_ia(
            in_radar_data, out_raster, min_area, mask_features, feature_type, in_dem_raster, geoid, mask_tolerance
        )
        return _wrapToolRaster("DetectDarkOceanAreas_sa", str(result.getOutput(0)))

    return Wrapper(in_radar_data, min_area, mask_features, feature_type, in_dem_raster, geoid, mask_tolerance)


DetectDarkOceanAreas.__esri_toolname__ = "DetectDarkOceanAreas_ia"
DetectDarkOceanAreas.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7", "::::8"]


def DetectObjectsUsingDeepLearning(
    in_raster,
    out_detected_objects,
    in_model_definition,
    arguments="#",
    run_nms: Literal["NMS", "NO_NMS", "#"] | None = "#",
    confidence_score_field="#",
    class_value_field="#",
    max_overlap_ratio="#",
    processing_mode: Literal[
        "PROCESS_AS_MOSAICKED_IMAGE", "PROCESS_ITEMS_SEPARATELY", "PROCESS_CANDIDATE_ITEMS_ONLY", "#"
    ]
    | None = "#",
    use_pixelspace: Literal["PIXELSPACE", "NO_PIXELSPACE", "#"] | None = "#",
    in_objects_of_interest="#",
):
    """DetectObjectsUsingDeepLearning_ia(in_raster, out_detected_objects, in_model_definition, {arguments;arguments...}, {run_nms}, {confidence_score_field}, {class_value_field}, {max_overlap_ratio}, {processing_mode}, {use_pixelspace}, {in_objects_of_interest;in_objects_of_interest...})

       Runs a trained deep learning model on an input raster to produce a
       feature class containing the objects it finds. The features can be
       bounding boxes or polygons around the objects found or points at the
       centers of the objects.

    INPUTS:
     in_raster (Raster Dataset / Raster Layer / Mosaic Layer / Image Service / Map Server / Map Server Layer / Internet Tiled Layer / Folder / Feature Layer / Feature Class / Oriented Imagery Layer):
         The input image that will be used to detect objects. The input can be
         a single raster, multiple rasters in a mosaic dataset, an image
         service, a folder of images, a feature class with image attachments,
         or an oriented imagery dataset or layer.
     in_model_definition (File / String):
         The in_model_definition parameter value can be an Esri model
         definition JSON file (.emd), a JSON string, or a deep learning model
         package (.dlpk). A JSON string is useful when this tool is used on the
         server so you can paste the JSON string rather than upload the .emd
         file. The .dlpk file must be stored locally.It contains the path to
         the deep learning binary model file, the path
         to the Python raster function to be used, and other parameters such as
         preferred tile size or padding.
     arguments {Value Table}:
         The information from the in_model_definition parameter will be used to
         set the default values for this parameter. These arguments vary,
         depending on the model architecture. The following are supported model
         arguments for models trained in ArcGIS. ArcGIS pretrained models and
         custom deep learning models may have additional arguments that the
         tool supports.padding-The number of pixels at the border of image
         tiles from which
         predictions will be blended for adjacent tiles. To smooth the output
         while reducing artifacts, increase the value. The maximum value of the
         padding can be half the tile size value. The argument is available for
         all model architectures.threshold-The detections that have a
         confidence score higher than this
         threshold will be included in the result. The allowed values range
         from 0 to 1.0. The argument is available for all model
         architectures.batch_size-The number of image tiles that will be
         processed in each
         step of the model inference. This depends on the memory of your
         graphics card. The argument is available for all model
         architectures.nms_overlap-The maximum overlap ratio for two
         overlapping features,
         which is defined as the ratio of intersection area over union area.
         The default is 0.1. The argument is available for all model
         architectures.exclude_pad_detections-If true, potentially truncated
         detections near
         the edges that are in the padded region of image chips will be
         filtered. The argument is available for SSD, RetinaNet, YOLOv3,
         DETReg, MMDetection, and Faster RCNN
         only.test_time_augmentation-Performs test time augmentation while
         predicting. If true, predictions of flipped and rotated orientations
         of the input image will be merged into the final output and their
         confidence values will be averaged. This may cause the confidence
         values to fall below the threshold for objects that are only detected
         in a few orientations (of the image). The argument is available for
         all model architectures.tile_size-The width and height of image tiles
         into which the imagery
         will be split for prediction. The argument is only available for
         MaskRCNN.merge_policy-The policy for merging augmented predictions.
         Available
         options are mean, max, and min. This is only applicable when test time
         augmentation is used. The argument is only available for
         MaskRCNN.output_classified_raster-The path to the output raster. The
         argument
         is only available for MaXDeepLab.
     run_nms {Boolean}:
         Specifies whether nonmaximum suppression will be performed in which
         duplicate objects are identified and the duplicate features with lower
         confidence value are removed.NO_NMS-Nonmaximum suppression will not be
         performed. All objects that
         are detected will be in the output feature class. This is the
         default.NMS-Nonmaximum suppression will be performed and duplicate
         objects
         that are detected will be removed. When the inputs are oriented
         imagery layers, the duplicates are retained with null ground
         geometries.
     confidence_score_field {String}:
         The name of the field in the feature class that will contain the
         confidence scores as output by the object detection method.This
         parameter is required when the run_nms parameter is set to NMS.
     class_value_field {String}:
         The name of the class value field in the input feature class.
         If no field name is provided, aorfield will be used. If these
         fields do not exist, all records will be identified as belonging to
         one class. ClassvalueValue
     max_overlap_ratio {Double}:
         The maximum overlap ratio for two overlapping features, which is
         defined as the ratio of intersection area over union area. The default
         is 0.
     processing_mode {String}:
         Specifies how all raster items in a mosaic dataset or an image service
         will be processed. This parameter is applied when the input raster is
         a mosaic dataset or an image service.PROCESS_AS_MOSAICKED_IMAGE-All
         raster items in the mosaic dataset or
         image service will be mosaicked together and processed. This is the
         default.PROCESS_ITEMS_SEPARATELY-All raster items in the mosaic
         dataset or
         image service will be processed as separate images.
         PROCESS_CANDIDATE_ITEMS_ONLY-Only raster items with a value
         of 1 or 2 in thefield of the input mosaic dataset's attribute table
         will be processed. Candidate
     use_pixelspace {Boolean}:
         Specifies whether inferencing will be performed on images in pixel
         space.NO_PIXELSPACE-Inferencing will be performed in map space. This
         is the
         default.PIXELSPACE-Inferencing will be performed in image space, and
         the
         output will be transformed back to map space. This option is useful
         when using oblique imagery or street-view imagery, where the features
         may become distorted using map space.
     in_objects_of_interest {String}:
         Specifies the objects that will be detected by the tool. The available
         options will be based on the in_model_definition parameter value.This
         parameter is only active when the model detects more than one
         type of object.

    OUTPUTS:
     out_detected_objects (Feature Class):
         The output feature class that will contain geometries circling the
         object or objects detected in the input image.If the feature class
         already exists, the results will be appended to
         the existing feature class."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_raster,
        out_detected_objects,
        in_model_definition,
        arguments,
        run_nms,
        confidence_score_field,
        class_value_field,
        max_overlap_ratio,
        processing_mode,
        use_pixelspace,
        in_objects_of_interest,
    ):
        result = arcpy.gp.DetectObjectsUsingDeepLearning_ia(
            in_raster,
            out_detected_objects,
            in_model_definition,
            arguments,
            run_nms,
            confidence_score_field,
            class_value_field,
            max_overlap_ratio,
            processing_mode,
            use_pixelspace,
            in_objects_of_interest,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_raster,
        out_detected_objects,
        in_model_definition,
        arguments,
        run_nms,
        confidence_score_field,
        class_value_field,
        max_overlap_ratio,
        processing_mode,
        use_pixelspace,
        in_objects_of_interest,
    )


DetectObjectsUsingDeepLearning.__esri_toolname__ = "DetectObjectsUsingDeepLearning_ia"
DetectObjectsUsingDeepLearning.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
]


def DetectObjectsUsingText(
    input_raster_dataset, output_feature_class, class_name="#", box_threshold="#", text_threshold="#"
):
    """DetectObjectsUsingText_ia(input_raster_dataset, output_feature_class, {class_name}, {box_threshold}, {text_threshold})

       ‌

    INPUTS:
     input_raster_dataset (Raster Layer):
         Input Raster Dataset
     class_name {String}:
         Class Name
     box_threshold {Double}:
         Box Threshold
     text_threshold {Double}:
         Text Threshold

    OUTPUTS:
     output_feature_class (Feature Class):
         Output Feature Class"""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(input_raster_dataset, output_feature_class, class_name, box_threshold, text_threshold):
        result = arcpy.gp.DetectObjectsUsingText_ia(
            input_raster_dataset, output_feature_class, class_name, box_threshold, text_threshold
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(input_raster_dataset, output_feature_class, class_name, box_threshold, text_threshold)


DetectObjectsUsingText.__esri_toolname__ = "DetectObjectsUsingText_ia"
DetectObjectsUsingText.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5"]


def Diff(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """Diff_ia(in_raster_or_constant1, in_raster_or_constant2)

       Determines which values from the first input are logically different
       from the values of the second input on a cell-by-cell basis.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The input to which the second input will be compared.A number can be
         used as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The input to which the first input will be compared.A number can be
         used as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The values in the output will be either 0 if the two
         input values are
         the same, or the first input value if they are not."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("Diff_sa", ["Diff", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


Diff.__esri_toolname__ = "Diff_ia"
Diff.__esri_toolinfo__ = ["::::1", "::::2"]


def DimensionalMovingStatistics(
    in_raster,
    dimension="#",
    backward_window="#",
    forward_window="#",
    nodata_handling: Literal["DATA", "NODATA", "FILL_NODATA", "#"] | None = "#",
    statistics_type: Literal["MEAN", "CIRCULAR_MEAN", "MAJORITY", "MAXIMUM", "MEDIAN", "MINIMUM", "PERCENTILE", "#"]
    | None = "#",
    percentile_value="#",
    percentile_interpolation_type: Literal["AUTO_DETECT", "NEAREST", "LINEAR", "#"] | None = "#",
    circular_wrap_value="#",
) -> Raster:
    """DimensionalMovingStatistics_ia(in_raster, {dimension}, {backward_window}, {forward_window}, {nodata_handling}, {statistics_type}, {percentile_value}, {percentile_interpolation_type}, {circular_wrap_value})

       Calculates statistics over a moving window on multidimensional data
       along a specified dimension.

    INPUTS:
     in_raster (Raster Layer):
         The input raster can only be a multidimensional raster in Cloud Raster
         Format (.crf file).
     dimension {String}:
         The name of the dimension along which the window will move.The default
         value is the first dimension other than x,y found in the
         input multidimensional raster.
     backward_window {Long}:
         The value of how many slices before or above to be included in the
         defined window. The value must be a positive integer from 1 to 100.
         The default value is 1.The unit of this parameter is slice.
     forward_window {Long}:
         The value of how many slices after or below to be included in the
         defined window. The value must be a positive integer from 1 to 100.
         The default value is 1.The unit of this parameter is slice.
     nodata_handling {String}:
         Specifies how NoData values will be handled by the statistic
         calculation.DATA-NoData values in the value input will be ignored in
         the results
         of the defined window that they fall within. This is the
         default.NODATA-Output values will be NoData if any NoData values are
         found in
         the input within the defined window.FILL_NODATA-NoData cell values
         will be replaced using the selected
         statistic on the values within the defined window.
     statistics_type {String}:
         Specifies the statistic type to be calculated.MEAN-The mean (average
         value) of the cells in the defined window will
         be calculated. This is the default.CIRCULAR_MEAN-The mean for angles
         or other cyclic quantities-such as
         compass direction in degrees, daytimes, or fractional parts of real
         numbers-will be calculated. When this statistics type is selected, use
         the circular_wrap_value parameter to designate a wrap
         value.MAJORITY-The majority (value that occurs most often) of the
         cells in
         the defined window will be identified.MAXIMUM-The maximum (largest
         value) of the cells in the defined window
         will be identified.MEDIAN-The median of the cells in the defined
         window will be
         identified.MINIMUM-The minimum (smallest value) of the cells in the
         defined
         window will be identified.PERCENTILE-A percentile of the cells in the
         defined window will be
         calculated. The 90th percentile is calculated by default. When this
         statistics type is selected, use the percentile_value and
         percentile_interpolation_type parameters to designate the percentile
         to calculate and choose the interpolation type to use, respectively.
     percentile_value {Double}:
         The percentile value that will be calculated. The default is 90, for
         the 90th percentile.The value can range from 0 to 100. The 0th
         percentile is essentially
         equivalent to the minimum statistic, and the 100th percentile is
         equivalent to the maximum statistic. A value of 50 will produce
         essentially the same result as the median statistic.This parameter is
         only supported if the statistics_type parameter is
         set to PERCENTILE. If any other statistic type is specified, this
         parameter will be ignored.
     percentile_interpolation_type {String}:
         Specifies the method of interpolation that will be used when the
         percentile value falls between two cell values.This parameter is only
         supported if the statistics_type parameter is
         set to MEDIAN or PERCENTILE. If any other statistic type is specified,
         this parameter will be ignored.AUTO_DETECT-If the input raster is of
         integer pixel type, the NEAREST
         method will be used. If the input raster is of float pixel type, the
         LINEAR method will be used.NEAREST-The nearest available value to the
         percentile will be used. In
         this case, the output pixel type will be the same as that of the input
         raster.LINEAR-The weighted average of the two surrounding values from
         the
         percentile will be used. In this case, the output pixel type will be
         floating point.
     circular_wrap_value {Double}:
         The value that will be used to convert a linear value to the range of
         a given circular mean. Its value must be positive. The default value
         is 360 degrees.This parameter is only supported if the statistics_type
         parameter is
         set to CIRCULAR_MEAN. If any other statistic type is specified, this
         parameter will be ignored.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster can only be a multidimensional raster in Cloud
         Raster Format (.crf file)."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_raster,
        dimension,
        backward_window,
        forward_window,
        nodata_handling,
        statistics_type,
        percentile_value,
        percentile_interpolation_type,
        circular_wrap_value,
    ):
        out_raster = Utils.UNEVALUATED_RASTER_FUNCTION_SIGNAL
        result = arcpy.gp.DimensionalMovingStatistics_ia(
            in_raster,
            out_raster,
            dimension,
            backward_window,
            forward_window,
            nodata_handling,
            statistics_type,
            percentile_value,
            percentile_interpolation_type,
            circular_wrap_value,
        )
        import json

        rfx_args = json.loads(result.getOutput(1))
        in_raster = arcpy.Raster(in_raster)
        in_raster = ApplyEnvironment(in_raster)
        out_raster_afr = arcpy.ia.Apply(in_raster, "DimensionalMovingStatistics", rfx_args)
        out_raster_afr = ApplyEnvironment(out_raster_afr)
        # Return an unevaluated raster function chain
        return out_raster_afr

    return Wrapper(
        in_raster,
        dimension,
        backward_window,
        forward_window,
        nodata_handling,
        statistics_type,
        percentile_value,
        percentile_interpolation_type,
        circular_wrap_value,
    )


DimensionalMovingStatistics.__esri_toolname__ = "DimensionalMovingStatistics_ia"
DimensionalMovingStatistics.__esri_toolinfo__ = [
    "::::1",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
]


def Divide(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """Divide_ia(in_raster_or_constant1, in_raster_or_constant2)

       Divides the values of two rasters on a cell-by-cell basis.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The input whose values will be divided by the second input.A number
         can be used as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The input whose values the first input are to be divided by.A number
         can be used as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the quotient of the first input
         raster (dividend)
         divided by the second input (divisor)."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("Divide_sa", ["Divide", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


Divide.__esri_toolname__ = "Divide_ia"
Divide.__esri_toolinfo__ = ["::::1", "::::2"]


def DownloadOrbitFile(
    in_radar_data,
    orbit_type: Literal["SENTINEL_RESTITUTED", "SENTINEL_PRECISE", "#"] | None = "#",
    username="#",
    password="#",
    cloud_storage="#",
    folder="#",
):
    """DownloadOrbitFile_ia(in_radar_data, {orbit_type}, {username}, {password}, {cloud_storage}, {folder})

       Downloads the updated orbit files for Sentinel-1 synthetic aperture
       radar (SAR) data.

    INPUTS:
     in_radar_data (Raster Dataset / Raster Layer):
         The input radar data.
     orbit_type {String}:
         Specifies the OSV type that will be
         downloaded.SENTINEL_RESTITUTED-Approximate OSV data will be
         downloaded. This is
         available several hours after data
         acquisition.SENTINEL_PRECISE-Refined OSV data will be downloaded. This
         is
         available 20 days after data acquisition. This is the default.
     username {String}:
         The Copernicus Data Space Ecosystem login credential username.This
         parameter is only valid when the input data has Sentinel
         restituted or Sentinel precise orbit types.
     password {Encrypted String}:
         The Copernicus Data Space Ecosystem login credential password.This
         parameter is only valid when the input data has Sentinel
         restituted or Sentinel precise orbit types.
     cloud_storage {File}:
         The Copernicus Data Space Ecosystem cloud storage connection file.
     folder {Folder}:
         An alternate folder location where the downloaded orbit state vector
         file will be stored. The default folder is the input radar data .SAFE
         folder."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_radar_data, orbit_type, username, password, cloud_storage, folder):
        result = arcpy.gp.DownloadOrbitFile_ia(in_radar_data, orbit_type, username, password, cloud_storage, folder)
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_radar_data, orbit_type, username, password, cloud_storage, folder)


DownloadOrbitFile.__esri_toolname__ = "DownloadOrbitFile_ia"
DownloadOrbitFile.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6"]


def EqualTo(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """EqualTo_ia(in_raster_or_constant1, in_raster_or_constant2)

       Performs a Relational equal-to operation on two inputs on a cell-by-
       cell basis.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The input that will be compared to for equality by the second input.A
         number can be used as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The input that will be compared from for equality by the first input.A
         number can be used as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The output cell values will be either integer 0 or
         1, or NoData if any
         input cell value is NoData."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("EqualTo_sa", ["EqualTo", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


EqualTo.__esri_toolname__ = "EqualTo_ia"
EqualTo.__esri_toolinfo__ = ["::::1", "::::2"]


def Exp(in_raster_or_constant) -> Raster:
    """Exp_ia(in_raster_or_constant)

       Calculates the base e exponential of the cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input values for which to find the base e exponential.To use a
         number as an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the base e exponential of the
         input values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("Exp_sa", ["Exp", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


Exp.__esri_toolname__ = "Exp_ia"
Exp.__esri_toolinfo__ = ["::::1"]


def Exp10(in_raster_or_constant) -> Raster:
    """Exp10_ia(in_raster_or_constant)

       Calculates the base 10 exponential of the cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input values for which to find the base 10 exponential.To use a
         number as an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the base 10 exponential of the
         input values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("Exp10_sa", ["Exp10", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


Exp10.__esri_toolname__ = "Exp10_ia"
Exp10.__esri_toolinfo__ = ["::::1"]


def Exp2(in_raster_or_constant) -> Raster:
    """Exp2_ia(in_raster_or_constant)

       Calculates the base 2 exponential of the cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input values for which to find the base 2 exponential.To use a
         number as an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the base 2 exponential of the
         input values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("Exp2_sa", ["Exp2", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


Exp2.__esri_toolname__ = "Exp2_ia"
Exp2.__esri_toolinfo__ = ["::::1"]


def ExportTrainingDataForDeepLearning(
    in_raster,
    out_folder,
    in_class_data="#",
    image_chip_format: Literal["TIFF", "MRF", "PNG", "JPEG", "#"] | None = "#",
    tile_size_x="#",
    tile_size_y="#",
    stride_x="#",
    stride_y="#",
    output_nofeature_tiles: Literal["ALL_TILES", "ONLY_TILES_WITH_FEATURES", "#"] | None = "#",
    metadata_format: Literal[
        "KITTI_rectangles",
        "PASCAL_VOC_rectangles",
        "Classified_Tiles",
        "RCNN_Masks",
        "Labeled_Tiles",
        "MultiLabeled_Tiles",
        "Export_Tiles",
        "CycleGAN",
        "Imagenet",
        "Panoptic_Segmentation",
        "#",
    ]
    | None = "#",
    start_index="#",
    class_value_field="#",
    buffer_radius="#",
    in_mask_polygons="#",
    rotation_angle="#",
    reference_system: Literal["MAP_SPACE", "PIXEL_SPACE", "#"] | None = "#",
    processing_mode: Literal["PROCESS_AS_MOSAICKED_IMAGE", "PROCESS_ITEMS_SEPARATELY", "#"] | None = "#",
    blacken_around_feature: Literal["BLACKEN_AROUND_FEATURE", "NO_BLACKEN", "#"] | None = "#",
    crop_mode: Literal["FIXED_SIZE", "BOUNDING_BOX", "#"] | None = "#",
    in_raster2="#",
    in_instance_data="#",
    instance_class_value_field="#",
    min_polygon_overlap_ratio="#",
):
    """ExportTrainingDataForDeepLearning_ia(in_raster, out_folder, {in_class_data}, {image_chip_format}, {tile_size_x}, {tile_size_y}, {stride_x}, {stride_y}, {output_nofeature_tiles}, {metadata_format}, {start_index}, {class_value_field}, {buffer_radius}, {in_mask_polygons}, {rotation_angle}, {reference_system}, {processing_mode}, {blacken_around_feature}, {crop_mode}, {in_raster2}, {in_instance_data}, {instance_class_value_field}, {min_polygon_overlap_ratio})

       Converts labeled vector or raster data into deep learning training
       datasets using a remote sensing image. The output will be a folder of
       image chips and a folder of metadata files in the specified format.

    INPUTS:
     in_raster (Raster Dataset / Raster Layer / Mosaic Layer / Image Service / Map Server / Map Server Layer / Internet Tiled Layer / Folder):
         The input source imagery, typically multispectral imagery.Examples of
         the types of input source imagery include multispectral
         satellite, drone, aerial, and National Agriculture Imagery Program
         (NAIP). The input can be a folder of images.
     in_class_data {Feature Class / Feature Layer / Raster Dataset / Raster Layer / Mosaic Layer / Image Service / Table / Folder}:
         The training sample data in either vector or raster form.
         Vector inputs should follow the training sample format generated using
         thepane. Raster inputs should follow a classified raster format
         generated by the Classify Raster tool. Training Samples Manager
         The raster input can also be from a folder of classified
         rasters. Classified raster inputs require a corresponding raster
         attribute table. Input tables should follow a training sample format
         generated by thebutton in thepane. Following the proper training
         sample format will produce optimal results with the statistical
         information; however, the input can also be a point feature class
         without a class value field or an integer raster without class
         information. Label Objects for Deep LearningTraining Samples
         Manager
     image_chip_format {String}:
         Specifies the raster format that will be used for the image chip
         outputs.The PNG and JPEG formats support up to three bands.TIFF-TIFF
         format will be used.PNG-PNG format will be used.JPEG-JPEG
         format will be used.MRF-Meta Raster Format (MRF) will be used.
     tile_size_x {Long}:
         The size of the image chips for the x dimension.
     tile_size_y {Long}:
         The size of the image chips for the y dimension.
     stride_x {Long}:
         The distance to move in the x direction when creating the next image
         chips.When stride is equal to tile size, there will be no overlap.
         When
         stride is equal to half the tile size, there will be 50 percent
         overlap.
     stride_y {Long}:
         The distance to move in the y direction when creating the next image
         chips.When stride is equal to tile size, there will be no overlap.
         When
         stride is equal to half the tile size, there will be 50 percent
         overlap.
     output_nofeature_tiles {Boolean}:
         Specifies whether image chips that do not capture training samples
         will be exported.ALL_TILES-All image chips, including those that do
         not capture
         training samples, will be exported.ONLY_TILES_WITH_FEATURES-Only image
         chips that capture training
         samples will be exported. This is the default.
     metadata_format {String}:
         Specifies the format that will be used for the output metadata labels.
         If the input training sample data is a feature class layer,
         such as a building layer or a standard classification training sample
         file, use theoroption (KITTI_rectangles or PASCAL_VOC_rectangles in
         Python). The output metadata is a .txt file or an .xml file containing
         the training sample data contained in the minimum bounding rectangle.
         The name of the metadata file matches the input source image name. If
         the input training sample data is a class map, use theoption
         (Classified_Tiles in Python) as the output metadata format.
         KITTI LabelsPASCAL Visual Object ClassesClassified Tiles
         KITTI_rectangles-The metadata will follow the same format as
         the Karlsruhe Institute of Technology and Toyota Technological
         Institute (KITTI) Object Detection Evaluation dataset. The KITTI
         dataset is a vision benchmark suite. The label files are plain text
         files. All values, both numerical and strings, are separated by
         spaces, and each row corresponds to one object. This format is
         used for object detection. PASCAL_VOC_rectangles-The metadata
         will follow the same
         format as the Pattern Analysis, Statistical Modeling and Computational
         Learning, Visual Object Classes (PASCAL_VOC) dataset. The PASCAL VOC
         dataset is a standardized image dataset for object class recognition.
         The label files are in XML format and contain information about image
         name, class value, and bounding boxes. This format is used for
         object detection. This is the default. Classified_Tiles-The
         output will be one classified image chip
         per input image chip. No other metadata for each image chip is used.
         Only the statistics output has more information about the classes,
         such as class names, class values, and output statistics. This
         format is primarily used for pixel classification. This format is
         also used for change detection when the output is one classified image
         chip from two image chips. RCNN_Masks-The output will be image
         chips that have a mask on
         the areas where the sample exists. The model generates bounding boxes
         and segmentation masks for each instance of an object in the image.
         This format is based on Feature Pyramid Network (FPN) and a ResNet101
         backbone in the deep learning framework model. This format is
         used for object detection; however, it can also be used
         for object tracking when the Siam Mask model type is used during
         training, as well as time series pixel classification when the PSETAE
         architecture is used. Labeled_Tiles-Each output tile will be
         labeled with a
         specific class. This format is used for object classification.
         MultiLabeled_Tiles-Each output tile will be labeled with one
         or more classes. For example, a tile may be labeled agriculture and
         also cloudy. This format is used for object classification.
         Export_Tiles-The output will be image chips with no label.
         This format is used for image translation techniques, such as Pix2Pix
         and Super Resolution. CycleGAN-The output will be image chips
         with no label.
         This format is used for image translation technique CycleGAN, which is
         used to train images that do not overlap. Imagenet-Each output
         tile will be labeled with a specific
         class. This format is used for object classification; however,
         it can also be
         used for object tracking when the Deep Sort model type is used during
         training. Panoptic_Segmentation-The output will be one
         classified image
         chip and one instance per input image chip. The output will also have
         image chips that mask the areas where the sample exists; these image
         chips will be stored in a different folder. This format is
         used for both pixel classification and instance
         segmentation, so two output labels folders will be produced.For the
         KITTI metadata format, 15 columns are created, but only 5 of
         them are used in the tool. The first column is the class value. The
         next 3 columns are skipped. Columns 5 through 8 define the minimum
         bounding rectangle, which is composed of four image coordinate
         locations: left, top, right, and bottom pixels. The minimum bounding
         rectangle encompasses the training chip used in the deep learning
         classifier. The remaining columns are not used. The following
         is an example of the PASCAL_VOC_rectangles
         option:        <?xml version=”1.0”?> - <layout>
         <image>000000000</image>
         <object>1</object> - <part> <class>1</class> - <bndbox>
         <xmin>31.85</xmin> <ymin>101.52</ymin> <xmax>256.00</xmax>
         <ymax>256.00</ymax> </bndbox> </part> </layout>For more information,
         see the Microsoft PASCAL Visual Object Classes
         (VOC) Challenge paper.
     start_index {Long}:
         This parameter has been deprecated. Use a value of 0 or # in Python.
     class_value_field {Field}:
         The field that contains the class values. If no field is
         specified, the system searches for aorfield. The field should be
         numeric, usually an integer. If the feature does not contain a class
         field, the system determines that all records belong to one class.
         valueclassvalue
     buffer_radius {Double}:
         The radius of a buffer around each training sample that will be used
         to delineate a training sample area. This allows you to create
         circular polygon training samples from points.The linear unit of the
         in_class_data parameter value's spatial
         reference is used.
     in_mask_polygons {Feature Layer}:
         A polygon feature class that delineates the area where image chips
         will be created.Only image chips that fall completely within the
         polygons will be
         created.
     rotation_angle {Double}:
         The rotation angle that will be used to generate image chips.An image
         chip will first be generated with no rotation. It will then
         be rotated at the specified angle to create additional image chips.
         The image will be rotated and have a chip created, until it has been
         fully rotated. For example, if you specify a rotation angle of 45
         degrees, the tool will create eight image chips. The eight image chips
         will be created at the following angles: 0, 45, 90, 135, 180, 25, 270,
         and 315.The default rotation angle is 0, which creates one default
         image chip.
     reference_system {String}:
         Specifies the type of reference system that will be used to interpret
         the input image. The reference system specified must match the
         reference system used to train the deep learning model.MAP_SPACE-A
         map-based coordinate system will be used. This is the
         default.PIXEL_SPACE-Image space will be used, with no rotation and no
         distortion.
     processing_mode {String}:
         Specifies how all raster items in a mosaic dataset or an image service
         will be processed. This parameter is applied when the input raster is
         a mosaic dataset or an image service.PROCESS_AS_MOSAICKED_IMAGE-All
         raster items in the mosaic dataset or
         image service will be mosaicked together and processed. This is the
         default.PROCESS_ITEMS_SEPARATELY-All raster items in the mosaic
         dataset or
         image service will be processed as separate images.
     blacken_around_feature {Boolean}:
         Specifies whether the pixels around each object or feature in each
         image tile will be masked out.This parameter only applies when the
         metadata_format parameter is set
         to Labeled_Tiles and an input feature class or classified raster has
         been specified.NO_BLACKEN-Pixels surrounding objects or features will
         not be masked
         out. This is the default.BLACKEN_AROUND_FEATURE-Pixels surrounding
         objects or features will be
         masked out.
     crop_mode {String}:
         Specifies whether the exported tiles will be cropped so that they are
         all the same size.This parameter only applies when the metadata_format
         parameter is set
         to either Labeled_Tiles or Imagenet, and an input feature class or
         classified raster has been specified.FIXED_SIZE-Exported tiles will be
         cropped to the same size and will
         center on the feature. This is the default.BOUNDING_BOX-Exported tiles
         will be cropped so that the bounding
         geometry surrounds only the feature in the tile.
     in_raster2 {Raster Dataset / Raster Layer / Mosaic Layer / Image Service / Map Server / Map Server Layer / Internet Tiled Layer / Folder}:
         An additional input imagery source that will be used for image
         translation methods.This parameter is valid when the metadata_format
         parameter is set to
         Classified_Tiles, Export_Tiles, or CycleGAN.
     in_instance_data {Feature Class / Feature Layer / Raster Dataset / Raster Layer / Mosaic Layer / Image Service / Table / Folder}:
         The training sample data collected that contains classes for instance
         segmentation.The input can also be a point feature class without a
         class value
         field or an integer raster without class information.This parameter is
         only valid when the metadata_format parameter is set
         to Panoptic_Segmentation.
     instance_class_value_field {Field}:
         The field that contains the class values for instance segmentation. If
         no field is specified, the tool will use a value or class value field
         if one is present. If the feature does not contain a class field, the
         tool will determine that all records belong to one class.This
         parameter is only valid when the metadata_format parameter is set
         to Panoptic_Segmentation.
     min_polygon_overlap_ratio {Double}:
         The minimum overlap percentage for a feature to be included in the
         training data. If the percentage overlap is less than the value
         specified, the feature will be excluded from the training chip, and
         will not be added to the label file.The percent value is expressed as
         a decimal. For example, to specify
         an overlap of 20 percent, use a value of 0.2. The default value is 0,
         which means that all features will be included.This parameter improves
         the performance of the tool and also improves
         inferencing. The speed is improved since less training chips are
         created. The inferencing is improved since the model is trained to
         only detect large patches of objects and ignores small corners of
         features. This means less false positives will be detected, and less
         false positives will be removed by the Non Maximum Suppression
         tool.This parameter is enabled when the in_class_data parameter value
         is a
         feature class.

    OUTPUTS:
     out_folder (Folder):
         The folder where the output image chips and metadata will be
         stored.The folder can also be a folder URL that uses a cloud storage
         connection file (*.acs)."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_raster,
        out_folder,
        in_class_data,
        image_chip_format,
        tile_size_x,
        tile_size_y,
        stride_x,
        stride_y,
        output_nofeature_tiles,
        metadata_format,
        start_index,
        class_value_field,
        buffer_radius,
        in_mask_polygons,
        rotation_angle,
        reference_system,
        processing_mode,
        blacken_around_feature,
        crop_mode,
        in_raster2,
        in_instance_data,
        instance_class_value_field,
        min_polygon_overlap_ratio,
    ):
        result = arcpy.gp.ExportTrainingDataForDeepLearning_ia(
            in_raster,
            out_folder,
            in_class_data,
            image_chip_format,
            tile_size_x,
            tile_size_y,
            stride_x,
            stride_y,
            output_nofeature_tiles,
            metadata_format,
            start_index,
            class_value_field,
            buffer_radius,
            in_mask_polygons,
            rotation_angle,
            reference_system,
            processing_mode,
            blacken_around_feature,
            crop_mode,
            in_raster2,
            in_instance_data,
            instance_class_value_field,
            min_polygon_overlap_ratio,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_raster,
        out_folder,
        in_class_data,
        image_chip_format,
        tile_size_x,
        tile_size_y,
        stride_x,
        stride_y,
        output_nofeature_tiles,
        metadata_format,
        start_index,
        class_value_field,
        buffer_radius,
        in_mask_polygons,
        rotation_angle,
        reference_system,
        processing_mode,
        blacken_around_feature,
        crop_mode,
        in_raster2,
        in_instance_data,
        instance_class_value_field,
        min_polygon_overlap_ratio,
    )


ExportTrainingDataForDeepLearning.__esri_toolname__ = "ExportTrainingDataForDeepLearning_ia"
ExportTrainingDataForDeepLearning.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
    "::::13",
    "::::14",
    "::::15",
    "::::16",
    "::::17",
    "::::18",
    "::::19",
    "::::20",
    "::::21",
    "::::22",
    "::::23",
]


def ExtractFeaturesUsingAIModels(
    in_raster,
    mode: Literal["Infer and Postprocess", "Only Postprocess"],
    out_location,
    out_prefix,
    area_of_interest="#",
    pretrained_models="#",
    additional_models="#",
    confidence_threshold="#",
    save_intermediate_output: Literal["TRUE", "FALSE", "#"] | None = "#",
    test_time_augmentation: Literal["TRUE", "FALSE", "#"] | None = "#",
    buffer_distance="#",
    extend_length="#",
    smoothing_tolerance="#",
    dangle_length="#",
    in_road_features="#",
    road_buffer_width="#",
    regularize_parcels: Literal["TRUE", "FALSE", "#"] | None = "#",
    post_processing_workflow: Literal["Line Regularization", "Parcel Regularization", "Polygon Regularization", "#"]
    | None = "#",
    out_features="#",
    parcel_tolerance="#",
    regularization_method: Literal["Right Angles", "Right Angles and Diagonals", "Any Angles", "Circle", "#"]
    | None = "#",
    poly_tolerance="#",
    prompt: Literal["Centroid", "Bounding Box", "None", "#"] | None = "#",
    in_features="#",
    out_summary="#",
):
    """ExtractFeaturesUsingAIModels_ia(in_raster, mode, out_location, out_prefix, {area_of_interest}, {pretrained_models;pretrained_models...}, {additional_models;additional_models...}, {confidence_threshold}, {save_intermediate_output}, {test_time_augmentation}, {buffer_distance}, {extend_length}, {smoothing_tolerance}, {dangle_length}, {in_road_features}, {road_buffer_width}, {regularize_parcels}, {post_processing_workflow}, {out_features}, {parcel_tolerance}, {regularization_method}, {poly_tolerance}, {prompt}, {in_features}, {out_summary})

       Runs one or more pretrained deep learning models on an input raster to
       extract features and automate the postprocessing of the inferenced
       outputs.

    INPUTS:
     in_raster (Raster Layer / Raster Dataset / Mosaic Layer):
         The input raster on which processing will be performed.If the mode
         parameter is specified as Only Postprocess, a raster with
         binary classification is required for this parameter.
     mode (String):
         Specifies the mode that will be used for the processing of the input
         raster.Infer and Postprocess-Features will be extracted from the
         imagery and
         postprocessed. This is the default.Only Postprocess-The input raster
         will be directly postprocessed. A
         single band raster with binary classification is required for this
         option.
     out_location (Workspace):
         The file geodatabase where the intermediate output from the models and
         the final postprocessed output will be stored.
     out_prefix (String):
         A prefix that will be added to the name of the outputs that will be
         saved to the output location. The prefix will also be used as the name
         of a group layer that will be used to display all outputs.
     area_of_interest {Feature Set}:
         The geographical extent that will be used to extract features. Only
         features within the area of interest will be extracted.
     pretrained_models {String}:
         The ArcGIS pretrained models from ArcGIS Living Atlas of the World
         that can be used on the provided input raster. This parameter requires
         an internet connection to download the pretrained models.
     additional_models {Value Table}:
         The deep learning models that can be used on the provided input raster
         and the postprocessing workflow that will be used for additional model
         files (.dlpk and .emd). Available postprocessing workflows are as
         follows:Line Regularization-The postprocessing workflow will extract
         line
         features from a single band raster with binary classification and
         generate a polyline feature class after refining it. This workflow
         also supports deep learning models that generate polyline feature
         classes.Parcel Regularization-The postprocessing workflow will extract
         parcels
         from a single band raster with binary classification and generate a
         polygon feature class after refining it.Polygon Regularization-The
         postprocessing workflow will generate a
         polygon feature class after refining it. This workflow is only
         compatible with object detection models.Polygon Segmentation-The
         postprocessing workflow will generate a
         polygon feature class containing the detected objects using their
         centroid or bounding box. The segmentation method is specified using
         the prompt parameter.None-No postprocessing workflow will be applied.
         This is the default.
     confidence_threshold {Double}:
         The minimum confidence of deep learning model that will be used when
         detecting objects. The value must be between 0 and 1.
     save_intermediate_output {Boolean}:
         Specifies whether the intermediate outputs will be saved to the output
         location. The term intermediate outputs refers to the results
         generated after the model has been inferenced.TRUE-The intermediate
         outputs will be saved to the output
         location.FALSE-The intermediate outputs will not be saved. This is the
         default.
     test_time_augmentation {Boolean}:
         Specifies whether predictions of flipped and rotated variants of the
         input image will be merged into the final output.TRUE-Predictions of
         flipped and rotated variants of the input image
         will be merged into the final output.FALSE-Predictions of flipped and
         rotated variants of the input image
         will not be merged into the final output. This is the default.
     buffer_distance {Linear Unit}:
         The distance that will be used to buffer polyline features before they
         are used in postprocessing. The default is 15 meters.
     extend_length {Linear Unit}:
         The maximum distance a line segment will be extended to an
         intersecting feature. The default is 25 meters.
     smoothing_tolerance {Linear Unit}:
         The tolerance used by the Polynomial Approximation with Exponential
         Kernel (PAEK) algorithm. The default is 30 meters.
     dangle_length {Linear Unit}:
         The length at which line segments that do not touch another line at
         both endpoints (dangles) will be trimmed. The default is 5 meters.
     in_road_features {Feature Layer / Feature Class}:
         A road feature class that will be used for refining the parcels. The
         input can be a polygon or polyline feature class.
     road_buffer_width {Linear Unit}:
         The buffer distance that will be used for the input road features. The
         default value is 5 meters for polyline features and 0 meters for
         polygon features.
     regularize_parcels {Boolean}:
         Specifies whether extracted parcels will be normalized by eliminating
         undesirable artifacts in their geometry.TRUE-Extracted parcels will be
         normalized. This is the
         default.FALSE-Extracted parcels will not be normalized.
     post_processing_workflow {String}:
         Specifies the postprocessing workflow that will be used.Line
         Regularization-Line features will be extracted from a single band
         raster with binary classification and a polyline feature class will be
         generated after refining it.Parcel Regularization-Parcels will be
         extracted from a single band
         raster with binary classification and a polygon feature class will be
         generated after refining it.Polygon Regularization-A polygon feature
         class will be generated
         after refining it. This workflow is only compatible with object
         detection models.
     parcel_tolerance {Linear Unit}:
         The minimum distance between coordinates before they are considered
         equal. This parameter is used to reduce slivers between extracted
         parcels. The default is 3 meters.
     regularization_method {String}:
         Specifies the regularization method that will be used in
         postprocessing.Right Angles-Shapes composed of 90° angles between
         adjoining edges
         will be constructed. This is the default.Right Angles and
         Diagonals-Shapes composed of 45° and 90° angles
         between adjoining edges will be constructed.Any Angles-Shapes that
         form any angles between adjoining edges will be
         constructed.Circle-The maximum distance from the boundary of the
         feature being
         processed will be used.
     poly_tolerance {Linear Unit}:
         The maximum distance that the regularized footprint can deviate from
         the boundary of its originating feature. The default is 1 meter.
     prompt {String}:
         Specifies the segmentation method that will be used when the
         additional_models parameter is set to Polygon Segmentation.Centroid-
         The centroid of the detections will be used to indicate to
         the polygon segmentation model what to segment in the input
         raster.Bounding Box-The bounding box of the detections will be used
         to
         indicate to the polygon segmentation model what to segment in the
         input raster.None-No segmentation method will be used. This is the
         default
     in_features {Feature Layer / Feature Class}:
         The feature class on which postprocessing will be performed. This
         parameter is only supported when the post_processing_workflow
         parameter is set to Line Regularization or Polygon Regularization.

    OUTPUTS:
     out_features {Feature Class}:
         The feature class containing the postprocessed output.
     out_summary {Table}:
         The table that will contain a list of outputs that were generated
         along with their respective paths."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_raster,
        mode,
        out_location,
        out_prefix,
        area_of_interest,
        pretrained_models,
        additional_models,
        confidence_threshold,
        save_intermediate_output,
        test_time_augmentation,
        buffer_distance,
        extend_length,
        smoothing_tolerance,
        dangle_length,
        in_road_features,
        road_buffer_width,
        regularize_parcels,
        post_processing_workflow,
        out_features,
        parcel_tolerance,
        regularization_method,
        poly_tolerance,
        prompt,
        in_features,
        out_summary,
    ):
        result = arcpy.gp.ExtractFeaturesUsingAIModels_ia(
            in_raster,
            mode,
            out_location,
            out_prefix,
            area_of_interest,
            pretrained_models,
            additional_models,
            confidence_threshold,
            save_intermediate_output,
            test_time_augmentation,
            buffer_distance,
            extend_length,
            smoothing_tolerance,
            dangle_length,
            in_road_features,
            road_buffer_width,
            regularize_parcels,
            post_processing_workflow,
            out_features,
            parcel_tolerance,
            regularization_method,
            poly_tolerance,
            prompt,
            in_features,
            out_summary,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_raster,
        mode,
        out_location,
        out_prefix,
        area_of_interest,
        pretrained_models,
        additional_models,
        confidence_threshold,
        save_intermediate_output,
        test_time_augmentation,
        buffer_distance,
        extend_length,
        smoothing_tolerance,
        dangle_length,
        in_road_features,
        road_buffer_width,
        regularize_parcels,
        post_processing_workflow,
        out_features,
        parcel_tolerance,
        regularization_method,
        poly_tolerance,
        prompt,
        in_features,
        out_summary,
    )


ExtractFeaturesUsingAIModels.__esri_toolname__ = "ExtractFeaturesUsingAIModels_ia"
ExtractFeaturesUsingAIModels.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
    "::::13",
    "::::14",
    "::::15",
    "::::16",
    "::::17",
    "::::18",
    "::::19",
    "::::20",
    "::::21",
    "::::22",
    "::::23",
    "::::24",
    "::::25",
]


def ExtractVideoFramesToImages(
    in_video,
    out_folder,
    image_type: Literal["JPEG", "TIFF", "NITF", "PNG", "#"] | None = "#",
    image_overlap="#",
    require_fresh_metadata: Literal["REQUIRE_FRESH_METADATA", "NO_REQUIRE_FRESH_METADATA", "#"] | None = "#",
    min_time="#",
):
    """ExtractVideoFramesToImages_ia(in_video, out_folder, {image_type}, {image_overlap}, {require_fresh_metadata}, {min_time})

       Extracts video frame images and associated metadata from an FMV-
       compliant video stream. The extracted images can be added to a mosaic
       dataset or other tools and functions for further analysis.

    INPUTS:
     in_video (File):
         The input video file in any of the supported video file formats,
         including PS, TS, MPG, MPEG, MP2, MPG2, MPEG2, MP4, MPG4, MPEG4, H264,
         H265, VOB, and M2TS.
     image_type {String}:
         Specifies the output image format.JPEG-The output will be in JPEG
         image format.TIFF-The output will be
         in TIFF image format. This is the default.NITF-The output will be in
         NITF image format.PNG-The output will be in PNG image format.
     image_overlap {Double}:
         The maximum overlap percentage between two images. If the overlap
         between a candidate image and the last image written to disk is
         greater than this value, the candidate image will be ignored. The
         default percentage is 100 percent, which writes all images to disk.
     require_fresh_metadata {Boolean}:
         Specifies whether video frames with associated metadata will be
         extracted and saved.REQUIRE_FRESH_METADATA-Only video frames with
         associated metadata will
         be saved.NO_REQUIRE_FRESH_METADATA-All video frames will be saved.
         This is the
         default.
     min_time {Time Unit}:
         The minimum time interval between video frames to be saved. If no
         value is specified, all video frames will be saved as images.

    OUTPUTS:
     out_folder (Folder):
         The file directory where the output images and metadata will be saved."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_video, out_folder, image_type, image_overlap, require_fresh_metadata, min_time):
        result = arcpy.gp.ExtractVideoFramesToImages_ia(
            in_video, out_folder, image_type, image_overlap, require_fresh_metadata, min_time
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_video, out_folder, image_type, image_overlap, require_fresh_metadata, min_time)


ExtractVideoFramesToImages.__esri_toolname__ = "ExtractVideoFramesToImages_ia"
ExtractVideoFramesToImages.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6"]


def ExtractWater(
    in_radar_data, out_feature_class, min_area="#", in_dem_raster="#", geoid: Literal["GEOID", "NONE", "#"] | None = "#"
):
    """ExtractWater_ia(in_radar_data, out_feature_class, {min_area}, {in_dem_raster}, {geoid})

       Finds water bodies using input synthetic aperture radar (SAR) data and
       a DEM.

    INPUTS:
     in_radar_data (Raster Dataset / Raster Layer):
         The input radar data.
     min_area {Areal Unit}:
         The minimum area to extract as a water body. The default value is
         50,000 square meters.
     in_dem_raster {Mosaic Layer / Raster Layer}:
         The input DEM.If the input radar data is not orthorectified, this DEM
         will be used
         to orthorectify it.This DEM will also be used to optimize the polygon
         construction.
     geoid {Boolean}:
         Specifies whether the vertical reference system of the input DEM will
         be transformed to ellipsoidal height. Most elevation datasets are
         referenced to sea level orthometric height, so a correction is
         required in these cases to convert to ellipsoidal height.GEOID-A geoid
         correction will be made to convert orthometric height to
         ellipsoidal height (based on EGM96 geoid). This is the default.NONE-No
         geoid correction will be made. Use this option only if the DEM
         is provided in ellipsoidal height.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output polygon feature class that depicts water and land polygons."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_radar_data, out_feature_class, min_area, in_dem_raster, geoid):
        result = arcpy.gp.ExtractWater_ia(in_radar_data, out_feature_class, min_area, in_dem_raster, geoid)
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_radar_data, out_feature_class, min_area, in_dem_raster, geoid)


ExtractWater.__esri_toolname__ = "ExtractWater_ia"
ExtractWater.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5"]


def FindArgumentStatistics(
    in_raster,
    dimension="#",
    dimension_def: Literal["ALL", "INTERVAL_KEYWORD", "#"] | None = "#",
    interval_keyword: Literal[
        "HOURLY",
        "DAILY",
        "WEEKLY",
        "MONTHLY",
        "QUARTERLY",
        "YEARLY",
        "RECURRING_DAILY",
        "RECURRING_WEEKLY",
        "RECURRING_MONTHLY",
        "RECURRING_QUARTERLY",
        "#",
    ]
    | None = "#",
    variables="#",
    statistics_type: Literal["ARGUMENT_MIN", "ARGUMENT_MAX", "ARGUMENT_MEDIAN", "DURATION", "ARGUMENT_VALUE", "#"]
    | None = "#",
    min="#",
    max="#",
    multiple_occurrence="#",
    ignore_nodata: Literal["DATA", "NODATA", "#"] | None = "#",
    value="#",
    comparison: Literal["EQUAL_TO", "GREATER_THAN", "SMALLER_THAN", "#"] | None = "#",
    occurrence: Literal["FIRST_OCCURRENCE", "LAST_OCCURRENCE", "#"] | None = "#",
) -> Raster:
    """FindArgumentStatistics_ia(in_raster, {dimension}, {dimension_def}, {interval_keyword}, {variables;variables...}, {statistics_type}, {min}, {max}, {multiple_occurrence}, {ignore_nodata}, {value}, {comparison}, {occurrence})

       Extracts the dimension value or band index at which a given statistic
       is attained for each pixel in a multidimensional or multiband raster.

    INPUTS:
     in_raster (Raster Dataset / Mosaic Dataset / Raster Layer / Mosaic Layer / Image Service / File):
         The input multidimensional or multiband raster to be analyzed.
     dimension {String}:
         The dimension from which the statistic will be extracted. If the input
         raster is not a multidimensional raster, this parameter is not
         required.
     dimension_def {String}:
         Specifies how the statistic will be extracted from the
         dimension.ALL-The statistic will be extracted across all dimensions.
         This is the
         default.INTERVAL_KEYWORD-The statistic will be extracted from the time
         dimension according to the interval keyword.
     interval_keyword {String}:
         The unit of time for which the statistic will be extracted. For
         example, you have five years of daily sea surface
         temperature data and you want to know the year in which the maximum
         temperature was observed. Setto, setto, and setto. Statistics
         TypeArgument of the maximumDimension DefinitionInterval KeywordKeyword
         IntervalYearly        Alternatively, if you want to know the month in
         which the
         maximum temperature was consistently observed, setto, setto, and
         setto. This will generate a raster in which each pixel contains the
         month in which the statistic was reached across the five-year record
         (for example, 08/18/2018, 08/25/2016, 08/07/2013). Statistics
         TypeArgument of the maximumDimension DefinitionInterval KeywordKeyword
         IntervalRecurring MonthlyThis parameter is required when the dimension
         parameter is set to
         StdTime and the dimension_def parameter is set to
         INTERVAL_KEYWORD.RECURRING_DAILY-The statistic will be extracted
         across
         days.RECURRING_WEEKLY-The statistic will be extracted across
         weeks.RECURRING_MONTHLY-The statistic will be extracted across
         months.RECURRING_QUARTERLY-The statistic will be extracted across
         quarters.HOURLY-The statistic will be extracted for the hour in which
         the
         statistic was reached.DAILY-The statistic will be extracted for the
         day in which the
         statistic was reached.WEEKLY-The statistic will be extracted for the
         week in which the
         statistic was reached.MONTHLY-The statistic will be extracted for the
         month in which the
         statistic was reached.QUARTERLY-The statistic will be extracted for
         the quarter in which the
         statistic was reached.YEARLY-The statistic will be extracted for the
         year in which the
         statistic was reached.
     variables {String}:
         The variable or variables to be analyzed. If the input raster is not
         multidimensional, the pixel values of the multiband raster are
         considered the variable. If the input raster is multidimensional and
         no variable is specified, all variables with the selected dimension
         will be analyzed.For example, to find the years in which temperature
         values were
         highest, specify temperature as the variable to be analyzed. If you do
         not specify any variables and you have both temperature and
         precipitation variables, both variables will be analyzed, and the
         output multidimensional raster will include both variables.
     statistics_type {String}:
         Specifies the statistic to extract from the variable or variables
         along the given dimension.ARGUMENT_MIN-The dimension value at which
         the minimum variable value
         is reached will be extracted. This is the default.ARGUMENT_MAX-The
         dimension value at which the maximum variable value
         is reached will be extracted.ARGUMENT_MEDIAN-The dimension value at
         which the median variable value
         is reached will be extracted.DURATION-The longest dimension duration
         value between the minimum and
         maximum variable values will be extracted.ARGUMENT_VALUE-The dimension
         value at which the specified variable
         value is reached will be extracted.
     min {Double}:
         The minimum variable value to be used to extract the duration.This
         parameter is required when the statistics_type parameter is set
         to DURATION.
     max {Double}:
         The maximum variable value to be used to extract the duration.This
         parameter is required when the statistics_type parameter is set
         to DURATION.
     multiple_occurrence {Long}:
         The pixel value to use to indicate that a given argument statistic was
         reached more than once in the input raster dataset. If not specified,
         the pixel value will be the value of the dimension as specified by the
         occurrence parameter, either the first or last occurrence.
     ignore_nodata {Boolean}:
         Specifies whether NoData values will be ignored in the
         analysis.DATA-The analysis will include all valid pixels along a given
         dimension and ignore NoData pixels. This is the default.NODATA-The
         analysis will result in NoData if there are NoData values
         for the pixels along the given dimension.
     value {Double}:
         The value at which a comparison will be made to extract the dimension
         value. This parameter is required when theparameter is set to.
         Statistics TypeArgument of the value
     comparison {String}:
         Specifies the comparison type that will be used to extract the
         dimension value.EQUAL_TO-The extracted dimension is equal to the
         specified value. This
         is the default.GREATER_THAN-The extracted dimension is greater than
         the specified
         value.SMALLER_THAN-The extracted dimension is smaller than the
         specified
         value.
     occurrence {String}:
         Specifies whether the value of the dimension will be returned the
         first time or last time the argument statistic is
         reached.FIRST_OCCURRENCE-The value of the dimension will be returned
         the first
         time the argument statistic is reached. This is the
         default.LAST_OCCURRENCE-The value of the dimension will be returned
         the last
         time the argument statistic is reached.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster dataset."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_raster,
        dimension,
        dimension_def,
        interval_keyword,
        variables,
        statistics_type,
        min,
        max,
        multiple_occurrence,
        ignore_nodata,
        value,
        comparison,
        occurrence,
    ):
        out_raster = "#"
        result = arcpy.gp.FindArgumentStatistics_ia(
            in_raster,
            out_raster,
            dimension,
            dimension_def,
            interval_keyword,
            variables,
            statistics_type,
            min,
            max,
            multiple_occurrence,
            ignore_nodata,
            value,
            comparison,
            occurrence,
        )
        return _wrapToolRaster("FindArgumentStatistics_sa", str(result.getOutput(0)))

    return Wrapper(
        in_raster,
        dimension,
        dimension_def,
        interval_keyword,
        variables,
        statistics_type,
        min,
        max,
        multiple_occurrence,
        ignore_nodata,
        value,
        comparison,
        occurrence,
    )


FindArgumentStatistics.__esri_toolname__ = "FindArgumentStatistics_ia"
FindArgumentStatistics.__esri_toolinfo__ = [
    "::::1",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
    "::::13",
    "::::14",
]


def Float(in_raster_or_constant) -> Raster:
    """Float_ia(in_raster_or_constant)

       Converts each cell value of a raster into a floating-point
       representation.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input raster to be converted to floating point.To use a number as
         an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the floating-point
         representation of the input
         values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("Float_sa", ["Float", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


Float.__esri_toolname__ = "Float_ia"
Float.__esri_toolinfo__ = ["::::1"]


def FocalStatistics(
    in_raster,
    neighborhood="#",
    statistics_type: Literal[
        "MEAN",
        "MAJORITY",
        "MAXIMUM",
        "MEDIAN",
        "MINIMUM",
        "MINORITY",
        "PERCENTILE",
        "RANGE",
        "STD",
        "SUM",
        "VARIETY",
        "#",
    ]
    | None = "#",
    ignore_nodata: Literal["DATA", "NODATA", "#"] | None = "#",
    percentile_value="#",
) -> Raster:
    """FocalStatistics_ia(in_raster, {neighborhood}, {statistics_type}, {ignore_nodata}, {percentile_value})

       Calculates for each input cell location a statistic of the values
       within a specified neighborhood around it.

    INPUTS:
     in_raster (Composite Geodataset):
         The raster for which the focal statistics for each input cell will be
         calculated.
     neighborhood {Neighborhood}:
         The cells surrounding a processing cell that will be used in the
         statistic calculation. There are several predefined neighborhood types
         to choose from, or a custom kernel can be defined.Once the
         neighborhood type is selected, other parameters can be set to
         fully define the shape, size, and units of measure. The default
         neighborhood is a square rectangle with a width and height of three
         cells.The shape of the neighborhoods are defined by the Neighborhood
         class.
         The available neighborhood types are NbrAnnulus, NbrCircle,
         NbrRectangle, NbrWedge, NbrIrregular, and NbrWeight.The following are
         the forms of the available neighborhood types:
         NbrAnnulus({innerRadius}, {outerRadius}, {units})         A
         ring or donut-shaped neighborhood defined by an inner radius and an
         outer radius. The minimum value for radius is 1 cell, and the outer
         radius must be larger than the inner. The maximum inner radius is 2046
         cells, and the maximum outer radius is 2047 cells. The default annulus
         is an inner radius of 1 cell and an outer radius of 3 cells.
         NbrCircle({radius}, {units}         A circular neighborhood
         with the given radius. The minimum value for
         radius is 1 cell, and the maximum value is 2047 cells. The default
         radius is 3 cells. NbrRectangle({width}, {height}, {units})
         A
         rectangular neighborhood defined by width and height. The minimum
         value for width or height is 1 cell, and the maximum value is 4096
         cells. The default is a square with a width and height of 3 cells.
         NbrWedge({radius}, {startAngle}, {endAngle}, {units})
         A wedge-shaped neighborhood defined by a radius, a start angle, and an
         end angle. The minimum value for radius is 1 cell, and the maximum
         value is 2047 cells. The wedge extends counterclockwise from the
         starting angle to the ending angle. Angles are specified in degrees,
         with 0 or 360 representing east. Negative angles can be used. The
         default wedge is from 0 to 90 degrees, with a radius of 3 cells.
         NbrIrregular(inKernelFile)         A custom neighborhood with
         specifications set by the identified kernel
         text file. The minimum value for width or height of the kernel is 1
         cell, and the maximum value is 4096 cells.
         NbrWeight(inKernelFile)         A custom neighborhood with
         specifications set by the identified kernel
         text file, which can apply weights to the members of the neighborhood.
         The minimum value for width or height of the kernel is 1 cell, and the
         maximum value is 4096 cells.For the NbrAnnulus, Nbrcircle,
         NbrRectangle and NbrWedge
         neighborhoods, the distance units for the parameters can be specified
         in CELL units or MAP units. Cell units is the default.For kernel
         neighborhoods, the first line in the kernel file defines
         the width and height of the neighborhood in numbers of cells. The
         subsequent lines indicate how the input value that corresponds to that
         location in the kernel will be processed. A value of 0 in the kernel
         file for either the irregular or the weight neighborhood type
         indicates the corresponding location will not be included in the
         calculation. For the irregular neighborhood, a value of 1 in the
         kernel file indicates that the corresponding input cell will be
         included in the operation. For the weight neighborhood, the value at
         each position indicates what the corresponding input cell value is to
         be multiplied by. Positive, negative, and decimal values can be used.
     statistics_type {String}:
         Specifies the statistic type to be calculated.MEAN-The mean (average
         value) of the cells in the neighborhood will be
         calculated.MAJORITY-The majority (value that occurs most often) of the
         cells in
         the neighborhood will be identified.MAXIMUM-The maximum (largest
         value) of the cells in the neighborhood
         will be identified.MEDIAN-The median of the cells in the neighborhood
         will be calculated.
         Median is equivalent to the 50th percentile.MINIMUM-The minimum
         (smallest value) of the cells in the neighborhood
         will be identified.MINORITY-The minority (value that occurs least
         often) of the cells in
         the neighborhood will be identified.PERCENTILE-A percentile of the
         cells in the neighborhood will be
         calculated. The 90th percentile is calculated by default. You can
         specify other values (from 0 to 100) using the percentile_value
         parameter.RANGE-The range (difference between largest and smallest
         value) of the
         cells in the neighborhood will be calculated.STD-The standard
         deviation of the cells in the neighborhood will be
         calculated.SUM-The sum of the cells in the neighborhood will be
         calculated.VARIETY-The variety (the number of unique values) of the
         cells in the
         neighborhood will be calculated.The default statistic type is MEAN.If
         the input raster is integer, all the statistics types will be
         available. If the input raster is floating point, only the MEAN,
         MAXIMUM, MEDIAN, MINIMUM, PERCENTILE, RANGE, STD, and SUM statistic
         types will be available.
     ignore_nodata {Boolean}:
         Specifies whether NoData values will be ignored by the statistic
         calculation.DATA-If a NoData value exists within a neighborhood, the
         NoData value
         will be ignored. Only cells within the neighborhood that have data
         values will be used in determining the output value. If the processing
         cell itself is NoData, the processing cell may receive a value in the
         output raster, provided at least one cell within the neighborhood has
         a valid value. This is the default.NODATA-If any cell in a
         neighborhood has a value of NoData, including
         the processing cell, the output for the processing cell will be
         NoData. The presence of a NoData value implies that there is
         insufficient information to determine the statistic value for the
         neighborhood.
     percentile_value {Double}:
         The percentile value that will be calculated. The default is 90, for
         the 90th percentile.The value can range from 0 to 100. The 0th
         percentile is essentially
         equivalent to the minimum statistic, and the 100th percentile is
         equivalent to the maximum statistic. A value of 50 will produce
         essentially the same result as the median statistic.This option is
         only supported if the statistics_type parameter is set
         to PERCENTILE. If any other statistic type is specified, this
         parameter will be ignored.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output focal statistics raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, neighborhood, statistics_type, ignore_nodata, percentile_value):
        args = {}
        # Neighborhood parameter
        nbr_types = {
            # values from esriRasterNeighborhoodEnum
            "RECTANGLE": 1,
            "CIRCLE": 2,
            "ANNULUS": 3,
            "WEDGE": 4,
            "IRREGULAR": 5,
            "WEIGHT": 6,
        }
        # Set defaults
        nbr_index = nbr_types["RECTANGLE"]  # Default neighborhood type
        args["Width"] = 3
        args["Height"] = 3
        in_raster = ApplyEnvironment(in_raster)
        # Parse and validate parameters
        msgs = Utils.ParameterErrors()
        # Neighborhood type
        nbr_fields = [
            f for f in Utils.compoundParameterToString(neighborhood, ParameterClasses._Neighborhood).split() if f
        ]  # discard empty fields
        cell_scale = 1.0

        def _parse_float(f):
            try:
                from locale import atof as _atof

                return _atof(f)  # localized string
            except AttributeError:
                return float(f)  # number

        def _error_invalid_parameters(id=581):
            msgs = Utils.ParameterErrors()
            msgs.add_id_message("ERROR", id)  # Invalid parameters.
            msgs.add_id_message("INFO", 952, "FocalStatistics")  # Failed to execute (<tool name>).
            raise arcpy.ExecuteError(msgs.combine())

        if len(nbr_fields) > 0:
            nbr_string = nbr_fields[0].upper()
            if nbr_string in list(nbr_types.keys()):
                nbr_index = nbr_types[nbr_fields[0].upper()]
            elif str(neighborhood).upper() not in ["", "#"]:
                _error_invalid_parameters(10385)
            if nbr_fields[-1].upper() == "MAP":
                cell_scale = _parse_float(arcpy.GetRasterProperties_management(in_raster, "CELLSIZEX").getOutput(0))
            elif nbr_string in ["RECTANGLE", "ANNULUS", "CIRCLE", "WEDGE"]:
                if len(nbr_fields) == 1:
                    neighborhood = ParameterClasses.NbrRectangle()
                    if nbr_string == "CIRCLE":
                        neighborhood = ParameterClasses.NbrCircle()
                    elif nbr_string == "ANNULUS":
                        neighborhood = ParameterClasses.NbrAnnulus()
                    elif nbr_string == "WEDGE":
                        neighborhood = ParameterClasses.NbrWedge()
                    nbr_fields = [
                        f
                        for f in Utils.compoundParameterToString(neighborhood, ParameterClasses._Neighborhood).split()
                        if f
                    ]
                elif nbr_fields[-1].upper() != "CELL":
                    _error_invalid_parameters()

        def _cs(field: str, scale: float = cell_scale) -> int:  # convert MAP units to CELL units
            raw = _parse_float(field)
            if raw <= 0:
                msgs.add_id_message("ERROR", 622, "FocalStatistics")
                msgs.add_id_message("ERROR", 628, "neighborhood")
                raise arcpy.ExecuteError(msgs.combine())
            result = int(0.5 + raw / float(scale))
            if result <= 0:
                msgs.add_id_message("ERROR", 10176)  # Invalid neighborhood mask
                msgs.add_id_message("INFO", 952, "FocalStatistics")  # Failed to execute (tool_name).
                raise arcpy.ExecuteError(msgs.combine())
            return result

        args["NeighborhoodType"] = nbr_index
        if nbr_index == nbr_types["ANNULUS"]:
            annulus_invalid = False
            if len(nbr_fields) == 4:
                in_rd_input = nbr_fields[1]
                out_rd_input = nbr_fields[2]
                if isinstance(neighborhood, ParameterClasses.NbrAnnulus):
                    in_rd_input = neighborhood.innerRadius
                    out_rd_input = neighborhood.outerRadius
                in_rd = args["InnerRadius"] = _cs(in_rd_input)
                out_rd = args["OuterRadius"] = _cs(out_rd_input)
                if (
                    str(nbr_fields[-1]).upper() == "CELL"
                    and ([in_rd, out_rd] != [_parse_float(in_rd_input), _parse_float(out_rd_input)])
                ) or (in_rd >= out_rd):
                    annulus_invalid = True
            else:
                annulus_invalid = True
            if annulus_invalid:
                _error_invalid_parameters()
        elif nbr_index == nbr_types["CIRCLE"]:
            circle_invalid = False
            if len(nbr_fields) == 3:
                radius_input = nbr_fields[1]
                if isinstance(neighborhood, ParameterClasses.NbrCircle):
                    radius_input = neighborhood.radius
                args["Radius"] = _cs(radius_input)
                if str(nbr_fields[-1]).upper() == "CELL" and ((args["Radius"]) != _parse_float(radius_input)):
                    circle_invalid = True
            else:
                circle_invalid = True
            if circle_invalid:
                _error_invalid_parameters()
        elif nbr_index == nbr_types["RECTANGLE"]:
            rectangle_invalid = False
            if len(nbr_fields) == 4:
                width_input = nbr_fields[1]
                height_input = nbr_fields[2]
                if isinstance(neighborhood, ParameterClasses.NbrRectangle):
                    width_input = neighborhood.width
                    height_input = neighborhood.height
                args["Width"] = _cs(width_input)
                args["Height"] = _cs(height_input)
                if str(nbr_fields[-1]).upper() == "CELL" and (
                    [args["Width"], args["Height"]] != [_parse_float(width_input), _parse_float(height_input)]
                ):
                    rectangle_invalid = True
            elif str(neighborhood).upper() in ["", "#"]:
                args["Width"] = 3
                args["Height"] = 3
            else:
                rectangle_invalid = True
            if rectangle_invalid:
                _error_invalid_parameters()
        elif nbr_index == nbr_types["WEDGE"]:
            wedge_invalid = False
            if len(nbr_fields) == 5:
                radius_input = nbr_fields[1]
                start_angle_input = nbr_fields[2]
                end_angle_input = nbr_fields[3]
                if isinstance(neighborhood, ParameterClasses.NbrWedge):
                    radius_input = neighborhood.radius
                    start_angle_input = neighborhood.startAngle
                    end_angle_input = neighborhood.endAngle
                args["Radius"] = _cs(radius_input)
                args["StartAngle"] = _parse_float(start_angle_input)
                args["EndAngle"] = _parse_float(end_angle_input)
                if str(nbr_fields[-1]).upper() == "CELL" and ((args["Radius"]) != _parse_float(radius_input)):
                    wedge_invalid = True
            else:
                wedge_invalid = True
            if wedge_invalid:
                _error_invalid_parameters()
        elif nbr_index in (nbr_types["WEIGHT"], nbr_types["IRREGULAR"]):
            # Parse kernel file
            if len(nbr_fields) != 2:
                _error_invalid_parameters()
            file_name = nbr_fields[1].strip("\"'")
            values = []
            try:
                with open(file_name, "r") as kernel_file:
                    try:
                        w, h = [int(s) for s in next(kernel_file).split()]
                    except ValueError:
                        _error_invalid_parameters()
                    if w <= 0 or h <= 0:
                        _error_invalid_parameters()
                    num_rows = 0
                    for row in kernel_file:
                        num_rows += 1
                        if len(row.split()) != w:
                            _error_invalid_parameters(10333 if nbr_index == nbr_types["WEIGHT"] else 581)
                        for col in row.split():
                            try:
                                values.append(_parse_float(col))
                            except ValueError:
                                _error_invalid_parameters(10333 if nbr_index == nbr_types["WEIGHT"] else 581)
                    if num_rows != h:
                        _error_invalid_parameters(10333 if nbr_index == nbr_types["WEIGHT"] else 581)
                    args["Width"] = w
                    args["Height"] = h
                    args["NeighborhoodValues"] = values
            except FileNotFoundError:
                _error_invalid_parameters(10391)
        # Statistics type parameter
        stat_types = {
            # values from esriGeoAnalysisStatisticsEnum
            "MAJORITY": 1,
            "MAXIMUM": 2,
            "MEAN": 3,
            "MEDIAN": 4,
            "MINIMUM": 5,
            "MINORITY": 6,
            "RANGE": 7,
            "STANDARD_DEVIATION": 8,
            "STD": 8,
            "SUM": 9,
            "VARIETY": 10,
            "PERCENTILE": 12,
        }
        args["StatisticType"] = stat_types.get(
            str(statistics_type).upper(), stat_types["MEAN"] if str(statistics_type).upper() in ["", "#"] else None
        )
        if args["StatisticType"] == None or (
            nbr_index == nbr_types["WEIGHT"]
            and args["StatisticType"] not in [stat_types["SUM"], stat_types["MEAN"], stat_types["STD"]]
        ):
            _error_invalid_parameters()
        if in_raster.pixelType in ["F32", "F64"] and args["StatisticType"] in [
            stat_types["MAJORITY"],
            stat_types["MINORITY"],
            stat_types["VARIETY"],
        ]:
            _error_invalid_parameters(10261)
        if str(ignore_nodata).upper() in ["NODATA", "FALSE"]:
            args["NoDataPolicy"] = 0
        elif str(ignore_nodata).upper() in ["DATA", "TRUE", "", "#"]:
            args["NoDataPolicy"] = -1
        else:
            _error_invalid_parameters()
        percentile_invalid = False
        try:
            args["Percentile"] = _parse_float(percentile_value)
        except ValueError:
            if args["StatisticType"] != stat_types["PERCENTILE"] or str(percentile_value).upper() in ["", "#"]:
                args["Percentile"] = 90.0
            else:
                percentile_invalid = True
        if percentile_invalid:
            _error_invalid_parameters()
        elif args["Percentile"] < 0 or args["Percentile"] > 100:
            _error_invalid_parameters(892)
        result = arcpy.sa.Apply(in_raster, "Focal", args)
        result = ApplyEnvironment(result)
        return result

    return Wrapper(in_raster, neighborhood, statistics_type, ignore_nodata, percentile_value)


FocalStatistics.__esri_toolname__ = "FocalStatistics_ia"
FocalStatistics.__esri_toolinfo__ = [
    "::::1",
    "Python::NbrAnnulus|NbrCircle|NbrIrregular|NbrRectangle|NbrWedge|NbrWeight::",
    "::::4",
    "::::5",
    "::::6",
]


def GenerateMultidimensionalAnomaly(
    in_multidimensional_raster,
    variables="#",
    method: Literal[
        "DIFFERENCE_FROM_MEAN",
        "PERCENT_DIFFERENCE_FROM_MEAN",
        "PERCENT_OF_MEAN",
        "Z_SCORE",
        "DIFFERENCE_FROM_MEDIAN",
        "PERCENT_DIFFERENCE_FROM_MEDIAN",
        "PERCENT_OF_MEDIAN",
        "#",
    ]
    | None = "#",
    calculation_interval: Literal[
        "ALL", "YEARLY", "RECURRING_MONTHLY", "RECURRING_WEEKLY", "RECURRING_DAILY", "HOURLY", "EXTERNAL_RASTER", "#"
    ]
    | None = "#",
    ignore_nodata: Literal["DATA", "NODATA", "#"] | None = "#",
    reference_mean_raster="#",
) -> Raster:
    """GenerateMultidimensionalAnomaly_ia(in_multidimensional_raster, {variables;variables...}, {method}, {calculation_interval}, {ignore_nodata}, {reference_mean_raster})

       Computes the anomaly for each slice in an existing multidimensional
       raster to generate a new multidimensional raster.

    INPUTS:
     in_multidimensional_raster (Raster Dataset / Mosaic Dataset / Raster Layer / Mosaic Layer / Image Service / File):
         The input multidimensional raster dataset.
     variables {String}:
         The variable or variables for which anomalies will be calculated. If
         no variable is specified, all variables with a time dimension will be
         analyzed.
     method {String}:
         Specifies the method that will be used to calculate the
         anomaly.DIFFERENCE_FROM_MEAN-The difference between a pixel's value
         and the
         mean of that pixel's values across slices defined by the interval will
         be calculated. This is the default.PERCENT_DIFFERENCE_FROM_MEAN-The
         percent difference between a pixel's
         value and the mean of that pixel's values across slices defined by the
         interval will be calculated.PERCENT_OF_MEAN-The percent of the mean
         will be calculated.Z_SCORE-The z-score for each pixel will be
         calculated. A z-score of 0
         indicates the pixel's value is identical to the mean. A z-score of 1
         indicates the pixel's value is 1 standard deviation from the mean. If
         a z-score is 2, the pixel's value is 2 standard deviations from the
         mean, and so on.DIFFERENCE_FROM_MEDIAN-The difference between a
         pixel's value and the
         mathematical median of that pixel's values across slices defined by
         the interval will be calculated.PERCENT_DIFFERENCE_FROM_MEDIAN-The
         percent difference between a
         pixel's value and the mathematical median of that pixel's values
         across slices defined by the interval will be
         calculated.PERCENT_OF_MEDIAN-The percent of the mathematical median
         will be
         calculated.
     calculation_interval {String}:
         Specifies the temporal interval that will be used to calculate the
         mean.ALL-The mean is calculated across all slices for each
         pixel.YEARLY-The
         yearly mean is calculated for each pixel.RECURRING_MONTHLY-The monthly
         mean is calculated for each pixel.RECURRING_WEEKLY-The weekly mean is
         calculated for each pixel.RECURRING_DAILY-The daily mean is calculated
         for each pixel.HOURLY-The hourly mean is calculated for each
         pixel.EXTERNAL_RASTER-An existing raster dataset that contains the
         mean or
         median value for each pixel is referenced.
     ignore_nodata {Boolean}:
         Specifies whether NoData values will be ignored in the
         analysis.DATA-The analysis will include all valid pixels along a given
         dimension and ignore NoData pixels. This is the default.NODATA-The
         analysis will result in NoData if there are NoData values
         for the pixels along the given dimension.
     reference_mean_raster {Raster Layer / Raster Dataset / Mosaic Layer / Mosaic Dataset}:
         The reference raster dataset that contains a previously calculated
         mean for each pixel. The anomalies will be calculated in comparison to
         this mean.

    OUTPUTS:
     out_multidimensional_raster (Raster Dataset):
         The output Cloud Raster Format (CRF) multidimensional raster dataset."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_multidimensional_raster, variables, method, calculation_interval, ignore_nodata, reference_mean_raster
    ):
        out_multidimensional_raster = "#"
        result = arcpy.gp.GenerateMultidimensionalAnomaly_ia(
            in_multidimensional_raster,
            out_multidimensional_raster,
            variables,
            method,
            calculation_interval,
            ignore_nodata,
            reference_mean_raster,
        )
        return _wrapToolRaster("GenerateMultidimensionalAnomaly_sa", str(result.getOutput(0)))

    return Wrapper(
        in_multidimensional_raster, variables, method, calculation_interval, ignore_nodata, reference_mean_raster
    )


GenerateMultidimensionalAnomaly.__esri_toolname__ = "GenerateMultidimensionalAnomaly_ia"
GenerateMultidimensionalAnomaly.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7"]


def GenerateTrainingSamplesFromSeedPoints(
    in_class_data, in_seed_points, out_training_feature_class, min_sample_area="#", max_sample_radius="#"
):
    """GenerateTrainingSamplesFromSeedPoints_ia(in_class_data, in_seed_points, out_training_feature_class, {min_sample_area}, {max_sample_radius})

       Generates training samples from seed points, such as accuracy
       assessment points or training sample points. A typical use case is
       generating training samples from an existing source, such as a
       thematic raster or a feature class.

    INPUTS:
     in_class_data (Mosaic Layer / Raster Layer / Feature Layer / Image Service / String):
         The data source that labels the training samples.
     in_seed_points (Feature Layer / Raster Catalog Layer):
         A point shapefile or feature class to provide the centers of training
         sample polygons.
     min_sample_area {Double}:
         The minimum area needed for each training sample, in square meters.
         The minimum value must be greater than or equal to 0.
     max_sample_radius {Double}:
         The longest distance (in meters) from any point within the training
         sample to its center seed point. If set to 0, the output training
         sample will be points instead of polygons. The minimum value must be
         greater than or equal to 0.

    OUTPUTS:
     out_training_feature_class (Feature Class):
         The output training sample feature class in the format that can be
         used in training tools, including shapefiles. The output feature class
         can be either a polygon feature class or a point feature class."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_class_data, in_seed_points, out_training_feature_class, min_sample_area, max_sample_radius):
        result = arcpy.gp.GenerateTrainingSamplesFromSeedPoints_ia(
            in_class_data, in_seed_points, out_training_feature_class, min_sample_area, max_sample_radius
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_class_data, in_seed_points, out_training_feature_class, min_sample_area, max_sample_radius)


GenerateTrainingSamplesFromSeedPoints.__esri_toolname__ = "GenerateTrainingSamplesFromSeedPoints_ia"
GenerateTrainingSamplesFromSeedPoints.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5"]


def GenerateTrendRaster(
    in_multidimensional_raster,
    dimension,
    variables="#",
    line_type: Literal["LINEAR", "HARMONIC", "POLYNOMIAL", "MANN-KENDALL", "SEASONAL-KENDALL", "#"] | None = "#",
    frequency="#",
    ignore_nodata: Literal["DATA", "NODATA", "#"] | None = "#",
    cycle_length="#",
    cycle_unit: Literal["DAYS", "YEARS", "#"] | None = "#",
    rmse: Literal["RMSE", "NO_RMSE", "#"] | None = "#",
    r2: Literal["R2", "NO_R2", "#"] | None = "#",
    slope_p_value: Literal["SLOPEPVALUE", "NO_SLOPEPVALUE", "#"] | None = "#",
    seasonal_period: Literal["DAYS", "MONTHS", "#"] | None = "#",
) -> Raster:
    """GenerateTrendRaster_ia(in_multidimensional_raster, dimension, {variables;variables...}, {line_type}, {frequency}, {ignore_nodata}, {cycle_length}, {cycle_unit}, {rmse}, {r2}, {slope_p_value}, {seasonal_period})

       Estimates the trend for each pixel along a dimension for one or more
       variables in a multidimensional raster.

    INPUTS:
     in_multidimensional_raster (Raster Dataset / Mosaic Dataset / Raster Layer / Mosaic Layer / Image Service / File):
         The input multidimensional raster dataset.
     dimension (String):
         The dimension along which a trend will be extracted for the variable
         or variables selected in the analysis.
     variables {String}:
         The variable or variables for which trends will be calculated. If no
         variable is specified, the first variable in the multidimensional
         raster will be analyzed.
     line_type {String}:
         Specifies the type of trend analysis to perform to pixel values along
         a dimension.LINEAR-Variable pixel values will be fitted along a linear
         trend line.
         This is the default.POLYNOMIAL-Variable pixel values will be fitted
         along a second order
         polynomial trend line.HARMONIC-Variable pixel values will be fitted
         along a harmonic trend
         line.MANN-KENDALL-Variable pixel values will be evaluated using the
         Mann-
         Kendall trend test.SEASONAL-KENDALL-Variable pixel values will be
         evaluated using the
         Seasonal-Kendall trend test.
     frequency {Long}:
         The frequency or the polynomial order number to use in the trend
         fitting. If the trend type is polynomial, this parameter specifies the
         polynomial order. If the trend type is harmonic, this parameter
         specifies the number of models to use to fit the trend.This parameter
         is only included in the trend analysis when the
         dimension being analyzed is time.If the line_type parameter is
         HARMONIC, the default value is 1,
         meaning a first order harmonic curve is used to fit the model.If the
         line_type parameter is POLYNOMIAL, the default value is 2, or
         second order polynomial.
     ignore_nodata {Boolean}:
         Specifies whether NoData values will be ignored in the
         analysis.DATA-The analysis will include all valid pixels along a given
         dimension and ignore NoData pixels. This is the default.NODATA-The
         analysis will result in NoData if there are NoData values
         for the pixels along the given dimension.
     cycle_length {Double}:
         The length of periodic variation to model. This parameter is required
         when line_type is set to HARMONIC. For example, leaf greenness often
         has one strong cycle of variation in a single year, so the cycle
         length is 1 year. Hourly temperature data has one strong cycle of
         variation throughout a single day, so the cycle length is 1 day.The
         default length is 1 year for data that varies on an annual cycle.
     cycle_unit {String}:
         Specifies the time unit to be used for the length of a harmonic
         cycle.DAYS-The unit for the length of the harmonic cycle is
         days.YEARS-The
         unit for the length of the harmonic cycle is years. This is
         the default.
     rmse {Boolean}:
         Specifies whether the root mean square error (RMSE) of the trend fit
         line will be calculated.RMSE-The RMSE will be calculated. This is the
         default.NO_RMSE-The RMSE
         will not be calculated.
     r2 {Boolean}:
         Specifies whether the R-squared goodness-of-fit statistic for the
         trend fit line will be calculated.R2-The R-squared value will be
         calculated.NO_R2-The R-squared value
         will not be calculated. This is the default.
     slope_p_value {Boolean}:
         Specifies whether the p-value statistic for the slope coefficient of
         the trend line will be calculated.SLOPEPVALUE-The p-value will be
         calculated.NO_SLOPEPVALUE-The p-value
         will not be calculated. This is the
         default.
     seasonal_period {String}:
         Specifies the time unit to be used for the length of a seasonal period
         when performing the Seasonal-Kendall test.DAYS-The unit for the length
         of the seasonal period is days. This is
         the default.MONTHS-The unit for the length of the seasonal period is
         months.

    OUTPUTS:
     out_multidimensional_raster (Raster Dataset):
         The output Cloud Raster Format (CRF) multidimensional raster dataset."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_multidimensional_raster,
        dimension,
        variables,
        line_type,
        frequency,
        ignore_nodata,
        cycle_length,
        cycle_unit,
        rmse,
        r2,
        slope_p_value,
        seasonal_period,
    ):
        out_multidimensional_raster = "#"
        result = arcpy.gp.GenerateTrendRaster_ia(
            in_multidimensional_raster,
            out_multidimensional_raster,
            dimension,
            variables,
            line_type,
            frequency,
            ignore_nodata,
            cycle_length,
            cycle_unit,
            rmse,
            r2,
            slope_p_value,
            seasonal_period,
        )
        return _wrapToolRaster("GenerateTrendRaster_sa", str(result.getOutput(0)))

    return Wrapper(
        in_multidimensional_raster,
        dimension,
        variables,
        line_type,
        frequency,
        ignore_nodata,
        cycle_length,
        cycle_unit,
        rmse,
        r2,
        slope_p_value,
        seasonal_period,
    )


GenerateTrendRaster.__esri_toolname__ = "GenerateTrendRaster_ia"
GenerateTrendRaster.__esri_toolinfo__ = [
    "::::1",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
    "::::13",
]


def GreaterThan(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """GreaterThan_ia(in_raster_or_constant1, in_raster_or_constant2)

       Performs a Relational greater-than operation on two inputs on a cell-
       by-cell basis.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The input being tested to determine if it is greater than the second
         input.A number can be used as an input for this parameter, provided a
         raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The input against which the first input is tested to be greater than.A
         number can be used as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The output cell values will be either integer 0 or
         1, or NoData if any
         input cell value is NoData."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster(
            "GreaterThan_sa", ["GreaterThan", in_raster_or_constant1, in_raster_or_constant2]
        )

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


GreaterThan.__esri_toolname__ = "GreaterThan_ia"
GreaterThan.__esri_toolinfo__ = ["::::1", "::::2"]


def GreaterThanEqual(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """GreaterThanEqual_ia(in_raster_or_constant1, in_raster_or_constant2)

       Performs a Relational greater-than-or-equal-to operation on two inputs
       on a cell-by-cell basis.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The input being tested to determine if it is greater than or equal to
         the second input.A number can be used as an input for this parameter,
         provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The input against which the first input is tested to be greater than
         or equal to.A number can be used as an input for this parameter,
         provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The output cell values will be either integer 0 or
         1, or NoData if any
         input cell value is NoData."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster(
            "GreaterThanEqual_sa", ["GreaterThanEqual", in_raster_or_constant1, in_raster_or_constant2]
        )

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


GreaterThanEqual.__esri_toolname__ = "GreaterThanEqual_ia"
GreaterThanEqual.__esri_toolinfo__ = ["::::1", "::::2"]


def InList(
    in_raster_or_constant,
    in_raster_or_constants,
    process_as_multiband: Literal["SINGLE_BAND", "MULTI_BAND", "#"] | None = "#",
) -> Raster:
    """InList_ia(in_raster_or_constant, in_raster_or_constants;in_raster_or_constants..., {process_as_multiband})

       Determines which values from the first input are contained in a set of
       other inputs, on a cell-by-cell basis.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input that defines the value that will be looked for in a list of
         rasters on a cell-by-cell basis.A number can be used as an input for
         this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constants (Composite Geodataset):
         A list of input rasters that the first input will be evaluated
         against. For each location, if the cell value from the first input
         exists in any of the other rasters, that value will be assigned to the
         output raster. If the value does not exist in any of the other
         rasters, the output value at that location will be NoData.A number can
         be used as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     process_as_multiband {Boolean}:
         Specifies how the input multiband raster bands will be
         processed.SINGLE_BAND-Each band from a multiband raster input will be
         processed
         separately as a single band raster. This is the
         default.MULTI_BAND-Each multiband raster input will be processed as a
         multiband raster. The operation will be performed for each band from
         one input using the corresponding band number from the other inputs.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant, in_raster_or_constants, process_as_multiband):
        if Utils.useDefaultArgumentValue(process_as_multiband):
            process_as_multiband = "SINGLE_BAND"
        if process_as_multiband not in ["SINGLE_BAND", "MULTI_BAND"]:
            raise arcpy.ExecuteError(
                "ERROR 000622: Failed to execute (InList). Parameters are not valid.\nERROR 000621: Input to parameter process_as_multiband not within domain.\n"
            )
        return _wrapLocalFunctionRaster(
            "InList_ia",
            ["InList", in_raster_or_constant] + Utils.flattenLists(in_raster_or_constants),
            {"flattenBands": process_as_multiband.upper() == "SINGLE_BAND"},
        )

    return Wrapper(in_raster_or_constant, in_raster_or_constants, process_as_multiband)


InList.__esri_toolname__ = "InList_ia"
InList.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def InspectTrainingSamples(
    in_raster, in_training_features, in_classifier_definition, out_training_feature_class, in_additional_raster="#"
) -> Raster:
    """InspectTrainingSamples_ia(in_raster, in_training_features, in_classifier_definition, out_training_feature_class, {in_additional_raster})

       Estimates the accuracy of individual training samples. The cross
       validation accuracy is computed using the previously generated
       classification training result in an .ecd file and the training
       samples. Outputs include a raster dataset containing the misclassified
       class values and a training sample dataset with the accuracy score for
       each training sample.

    INPUTS:
     in_raster (Mosaic Layer / Raster Layer / Image Service / String):
         The input raster to be classified.
     in_training_features (Feature Layer / Raster Catalog Layer):
         A training sample feature class created in thepane.
         Training Samples Manager
     in_classifier_definition (File):
         The .ecd output classifier file from any of the train classifier
         tools. The .ecd file is a JSON file that contains attribute
         information, statistics, or other information needed for the
         classifier.
     in_additional_raster {Mosaic Layer / Raster Layer / Image Service / String}:
         Ancillary raster datasets, such as a multispectral image or a DEM,
         will be incorporated to generate attributes and other required
         information for the classifier. This raster is necessary when
         calculating attributes such as mean or standard deviation. This
         parameter is optional.

    OUTPUTS:
     out_training_feature_class (Feature Class):
         The output individual training samples saved as a feature class. The
         associated attribute table contains an addition field listing the
         accuracy score.
     out_misclassified_raster (Raster Dataset):
         The output misclassified raster having NoData outside training
         samples. In training samples, correctly classified pixels are
         represented as NoData, and misclassified pixels are represented by
         their class value. The results is an index map of misclassified class
         values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_raster, in_training_features, in_classifier_definition, out_training_feature_class, in_additional_raster
    ):
        out_misclassified_raster = "#"
        result = arcpy.gp.InspectTrainingSamples_ia(
            in_raster,
            in_training_features,
            in_classifier_definition,
            out_training_feature_class,
            out_misclassified_raster,
            in_additional_raster,
        )
        return _wrapToolRaster("InspectTrainingSamples_sa", str(result.getOutput(0)))

    return Wrapper(
        in_raster, in_training_features, in_classifier_definition, out_training_feature_class, in_additional_raster
    )


InspectTrainingSamples.__esri_toolname__ = "InspectTrainingSamples_ia"
InspectTrainingSamples.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::6"]


def Int(in_raster_or_constant) -> Raster:
    """Int_ia(in_raster_or_constant)

       Converts each cell value of a raster to an integer by truncation.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input raster to be converted to integer.To use a number as an
         input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the input values converted to
         integers by
         truncation."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("Int_sa", ["Int", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


Int.__esri_toolname__ = "Int_ia"
Int.__esri_toolinfo__ = ["::::1"]


def InterpolateFromSpatiotemporalPoints(
    in_dataset,
    variable_field,
    time_field,
    temporal_aggregation: Literal["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"],
    cell_size,
    interpolation_method: Literal[
        "TRIANGULATION", "NATURAL_NEIGHBOR", "IDW", "NEAREST_NEIGHBOR", "MEAN", "MEDIAN", "QUADRATIC"
    ],
) -> Raster:
    """InterpolateFromSpatiotemporalPoints_ia(in_dataset, variable_field, time_field, temporal_aggregation, cell_size, interpolation_method)

       Interpolates temporal point data into a multidimensional raster.

    INPUTS:
     in_dataset (Mosaic Dataset / Mosaic Layer / Feature Layer / Trajectory Layer):
         The input point layer, trajectory layer, or trajectory dataset.
     variable_field (String):
         A field containing variable values.
     time_field (String):
         A field containing time values.
     temporal_aggregation (String):
         Specifies the temporal aggregation of the output multidimensional
         raster. The interpolation algorithm uses all available data within
         these time periods to calculate the output slice.DAILY-The data values
         will be aggregated into daily time steps. This
         is the default.WEEKLY-The data values will be aggregated into weekly
         time steps.MONTHLY-The data values will be aggregated into monthly
         time steps.QUARTERLY-The data values will be aggregated into quarterly
         time
         steps.YEARLY-The data values will be aggregated into yearly time
         steps.
     cell_size (Double):
         The output cell size. By default, the cell size will be the shorter of
         the width or the height of the input point feature extent, divided by
         250.
     interpolation_method (String):
         Specifies the interpolation method that will be used.IDW-Inverse
         distance weighted interpolation will be
         used.TRIANGULATION-Triangulation interpolation will be used.MEAN-Mean
         interpolation will be used.MEDIAN-Median interpolation will be
         used.NATURAL_NEIGHBOR-Natural neighbor interpolation will be
         used.NEAREST_NEIGHBOR-Nearest neighbor interpolation will be
         used.QUADRATIC-Quadratic interpolation will be used.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output multidimensional raster dataset."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_dataset, variable_field, time_field, temporal_aggregation, cell_size, interpolation_method):
        out_raster = "#"
        result = arcpy.gp.InterpolateFromSpatiotemporalPoints_ia(
            in_dataset, out_raster, variable_field, time_field, temporal_aggregation, cell_size, interpolation_method
        )
        return _wrapToolRaster("InterpolateFromSpatiotemporalPoints_sa", str(result.getOutput(0)))

    return Wrapper(in_dataset, variable_field, time_field, temporal_aggregation, cell_size, interpolation_method)


InterpolateFromSpatiotemporalPoints.__esri_toolname__ = "InterpolateFromSpatiotemporalPoints_ia"
InterpolateFromSpatiotemporalPoints.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7"]


def IsNull(in_raster) -> Raster:
    """IsNull_ia(in_raster)

       Determines which values from the input raster are NoData on a cell-by-
       cell basis.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster being tested to identify the cells that are NoData
         (null).The input can be either integer or floating-point type.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The output identifies with an integer value of 1
         which cells in the
         input are NoData. If the input is any other value, the output is 0."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster):
        return _wrapLocalFunctionRaster("IsNull_sa", ["IsNull", in_raster])

    return Wrapper(in_raster)


IsNull.__esri_toolname__ = "IsNull_ia"
IsNull.__esri_toolinfo__ = ["::::1"]


def LessThan(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """LessThan_ia(in_raster_or_constant1, in_raster_or_constant2)

       Performs a Relational less-than operation on two inputs on a cell-by-
       cell basis.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The input being tested to determine if it is less than the second
         input.A number can be used as an input for this parameter, provided a
         raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The input against which the first input is tested to be less than.A
         number can be used as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The output cell values will be either integer 0 or
         1, or NoData if any
         input cell value is NoData."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("LessThan_sa", ["LessThan", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


LessThan.__esri_toolname__ = "LessThan_ia"
LessThan.__esri_toolinfo__ = ["::::1", "::::2"]


def LessThanEqual(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """LessThanEqual_ia(in_raster_or_constant1, in_raster_or_constant2)

       Performs a Relational less-than-or-equal-to operation on two inputs on
       a cell-by-cell basis.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The input being tested to determine if it is less than or equal to the
         second input.A number can be used as an input for this parameter,
         provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The input against which the first input is tested to be less than or
         equal to.A number can be used as an input for this parameter, provided
         a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The output cell values will be either integer 0 or
         1, or NoData if any
         input cell value is NoData."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster(
            "LessThanEqual_sa", ["LessThanEqual", in_raster_or_constant1, in_raster_or_constant2]
        )

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


LessThanEqual.__esri_toolname__ = "LessThanEqual_ia"
LessThanEqual.__esri_toolinfo__ = ["::::1", "::::2"]


def LinearSpectralUnmixing(
    in_raster,
    in_spectral_profile_file,
    value_option: list[Literal["SUM_TO_ONE", "NON_NEGATIVE"]]
    | Literal["SUM_TO_ONE", "NON_NEGATIVE"]
    | str
    | None = "#",
) -> Raster:
    """LinearSpectralUnmixing_ia(in_raster, out_raster, in_spectral_profile_file, {value_option;value_option...})

       Performs subpixel classification and calculates the fractional
       abundance of different land-cover types for individual pixels.

    INPUTS:
     in_raster (Raster Dataset / Mosaic Dataset / Mosaic Layer / Raster Layer / File / Image Service):
         The input raster dataset.
     in_spectral_profile_file (Feature Layer / File / String):
         The spectral information for the different land-cover classes.This can
         be provided as polygon features, a classifier definition file
         (.ecd) generated from the Train Maximum Likelihood Classifier tool, or
         a JSON format file (.json) that contains the class spectral profiles.
     value_option {String}:
         Specifies how the output pixel values will be defined.SUM_TO_ONE-Class
         values for each pixel will be provided in decimal
         format with the sum of all classes equal to 1. For example, Class1 =
         0.16; Class2 = 0.24; Class3 = 0.60.NON_NEGATIVE-There will be no
         negative output values.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output multiband raster dataset."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, in_spectral_profile_file, value_option):
        out_raster = "#"
        result = arcpy.gp.LinearSpectralUnmixing_ia(in_raster, out_raster, in_spectral_profile_file, value_option)
        return _wrapToolRaster("LinearSpectralUnmixing_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, in_spectral_profile_file, value_option)


LinearSpectralUnmixing.__esri_toolname__ = "LinearSpectralUnmixing_ia"
LinearSpectralUnmixing.__esri_toolinfo__ = ["::::1", "::::3", "::::4"]


def Ln(in_raster_or_constant) -> Raster:
    """Ln_ia(in_raster_or_constant)

       Calculates the natural logarithm (base e) of cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         Input values for which to find the natural logarithm (Ln).To use a
         number as an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the base e (natural) logarithm
         of the input
         values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("Ln_sa", ["Ln", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


Ln.__esri_toolname__ = "Ln_ia"
Ln.__esri_toolinfo__ = ["::::1"]


def Log10(in_raster_or_constant) -> Raster:
    """Log10_ia(in_raster_or_constant)

       Calculates the base 10 logarithm of cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         Input values for which to find the base 10 logarithm.To use a number
         as an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the base 10 logarithm of the
         input values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("Log10_sa", ["Log10", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


Log10.__esri_toolname__ = "Log10_ia"
Log10.__esri_toolinfo__ = ["::::1"]


def Log2(in_raster_or_constant) -> Raster:
    """Log2_ia(in_raster_or_constant)

       Calculates the base 2 logarithm of cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         Input values for which to find the base 2 logarithm.To use a number as
         an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the base 2 logarithm of the
         input values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("Log2_sa", ["Log2", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


Log2.__esri_toolname__ = "Log2_ia"
Log2.__esri_toolinfo__ = ["::::1"]


def Minus(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """Minus_ia(in_raster_or_constant1, in_raster_or_constant2)

       Subtracts the value of the second input raster from the value of the
       first input raster on a cell-by-cell basis.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The input from which to subtract the values in the second input.A
         number can be used as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The input values to subtract from the values in the first input.A
         number can be used as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the result of subtracting the
         second input from
         the first."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("Minus_sa", ["Minus", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


Minus.__esri_toolname__ = "Minus_ia"
Minus.__esri_toolinfo__ = ["::::1", "::::2"]


def Mod(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """Mod_ia(in_raster_or_constant1, in_raster_or_constant2)

       Finds the remainder (modulo) of the first raster when divided by the
       second raster on a cell-by-cell basis.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The numerator input.A number can be used as an input for this
         parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The denominator input.A number can be used as an input for this
         parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the remainder of the division of
         the values in the
         first input by the second input."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("Mod_sa", ["Mod", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


Mod.__esri_toolname__ = "Mod_ia"
Mod.__esri_toolinfo__ = ["::::1", "::::2"]


def MultidimensionalPrincipalComponents(
    in_multidimensional_raster,
    mode: Literal["DIMENSION_REDUCTION", "SPATIAL_REDUCTION"],
    dimension,
    out_pc,
    out_loadings,
    out_eigenvalues="#",
    variable="#",
    number_of_pc="#",
):
    """MultidimensionalPrincipalComponents_ia(in_multidimensional_raster, mode, dimension, out_pc, out_loadings, {out_eigenvalues}, {variable}, {number_of_pc})

       Transforms multidimensional rasters into their principal components,
       loadings, and eigenvalues. The tool transforms the data into a reduced
       number of components that account for the variance of the data, so
       that spatial and temporal patterns can be readily identified.

    INPUTS:
     in_multidimensional_raster (Raster Dataset / Mosaic Dataset / Raster Layer / Mosaic Layer / Image Service / File):
         The input multidimensional raster.The tool processes data along one
         dimension, such as a time series
         raster or a data cube defined by a nontime dimension [X, Y, Z]. If an
         input variable includes multiple dimensions, such as depth and time,
         the first dimension value will be used by default.You can use the Make
         Multidimensional Raster Layer tool or Subset
         Multidimensional Raster tool to redefine the multidimensional data as
         needed, such as configuring multidimensional data into a dataset with
         one dimension.
     mode (String):
         Specifies the method that will be used to perform principal component
         analysis.DIMENSION_REDUCTION-The input time series data will be
         treated as a
         set of images. Principal components that extract prevalent pattens
         over time will be computed. This is the default.SPATIAL_REDUCTION-The
         input time series data will be treated as a set
         of pixels. Principal components that extract prevalent pattens and
         locations over time will be computed as a set of one-dimensional
         arrays stored in a table.
     dimension (String):
         The dimension name used to process the principal components.
     variable {String}:
         The variable of the input multidimensional raster used in computation.
         If the input raster is multidimensional and no variable is specified,
         only the first variable will be analyzed, by default.For example, to
         find the years in which temperature values were
         highest, specify temperature as the variable to be analyzed. If you do
         not specify any variables and you have both temperature and
         precipitation variables, both variables will be analyzed, and the
         output multidimensional raster will include both variables.
     number_of_pc {String}:
         The number of principal components to compute, usually fewer than the
         number of input rasters.This parameter also takes the form of a
         percentage (%). For example, a
         value of 90% means the number of components that can explain 90
         percent of variance in the data will be computed.

    OUTPUTS:
     out_pc (Raster Dataset / Table):
         The name of the output raster dataset.When the mode parameter is
         specified as DIMENSION_REDUCTION, the
         output will be a multiband raster with the components as bands. The
         first band is the first principal component with the largest
         eigenvalue, the second band has the principal component with the
         second largest eigenvalue, and so on. The output is in CRF file format
         (.crf), which maintains the multidimensional information.When the mode
         parameter is specified as SPATIAL_REDUCTION, the output
         is a table containing a set of time series data representing the
         principal components.
     out_loadings (Raster Dataset / Table):
         The output loadings data contributing to the principal components.When
         the mode parameter is specified as DIMENSION_REDUCTION, the
         output will be a table containing the weights that each input raster
         contributed to the principal components. These weights define the
         correlations of the input data and the output principal components.
         Use the .csv file extension to output the loadings as a comma-
         separated values file.When the mode parameter is specified as
         SPATIAL_REDUCTION, the output
         is a raster where pixel values are the weights contributing the
         principal components. Pixels with larger values are more corelated to
         the principal components. This output may have a larger cell size than
         the input raster because a random reprojection is applied to reduce
         the computation complexity.
     out_eigenvalues {Table}:
         The output Eigenvalues table. Eigenvalues are values indicating the
         variance percentage of each component. Eigenvalues help you define the
         number of principal components that are needed to represent the
         dataset."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_multidimensional_raster, mode, dimension, out_pc, out_loadings, out_eigenvalues, variable, number_of_pc
    ):
        result = arcpy.gp.MultidimensionalPrincipalComponents_ia(
            in_multidimensional_raster, mode, dimension, out_pc, out_loadings, out_eigenvalues, variable, number_of_pc
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_multidimensional_raster, mode, dimension, out_pc, out_loadings, out_eigenvalues, variable, number_of_pc
    )


MultidimensionalPrincipalComponents.__esri_toolname__ = "MultidimensionalPrincipalComponents_ia"
MultidimensionalPrincipalComponents.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
]


def MultidimensionalRasterCorrelation(
    in_mdim_raster1,
    in_mdim_raster2,
    dimension1="#",
    variable1="#",
    dimension2="#",
    variable2="#",
    corr_method: Literal["PEARSON", "SPEARMAN", "KENDALL", "#"] | None = "#",
    lag="#",
    calculate_xcorr: Literal["ALL_CROSS_CORRELATION", "NO_CROSS_CORRELATION", "#"] | None = "#",
    calculate_pvalue: Literal["CALCULATE_P_VALUE", "NO_P_VALUE", "#"] | None = "#",
    out_max_corr_raster="#",
) -> Raster:
    """MultidimensionalRasterCorrelation_ia(in_mdim_raster1, in_mdim_raster2, {dimension1}, {variable1}, {dimension2}, {variable2}, {corr_method}, {lag}, {calculate_xcorr}, {calculate_pvalue}, {out_max_corr_raster})

       Analyzes correlations between two variables in one or two
       multidimensional rasters.

    INPUTS:
     in_mdim_raster1 (Raster Dataset / Mosaic Dataset / Raster Layer / Mosaic Layer / Image Service / File):
         The input multidimensional raster dataset.The first multidimensional
         raster in any supported format.
     in_mdim_raster2 (Raster Dataset / Mosaic Dataset / Raster Layer / Mosaic Layer / Image Service / File):
         The second multidimensional raster that will be correlated with the
         first input. The length of the dimension used in the calculation must
         be greater than 2. Autocorrelation will be calculated if the
         in_mdim_raster1 parameter value is the same as the in_mdim_raster2
         parameter value. Autocorrelation refers to the degree of correlation
         of the same variables between two successive time intervals.
     dimension1 {String}:
         A dimension name in the first dataset, along which the pixel array is
         defined. When the input has two nonspatial dimensions, a dimension
         must be specified. The length of the dimension used in the calculation
         must be greater than 2.
     variable1 {String}:
         A variable name from the first input raster.
     dimension2 {String}:
         A dimension name in the second dataset. The length of the dimension
         used in the calculation must be greater than 2.
     variable2 {String}:
         A variable name from the second input raster.
     corr_method {String}:
         Specifies the correlation calculation method that will be
         used.PEARSON-The correlation method will be Pearson. This is the
         default.SPEARMAN-The correlation method will be Spearman.KENDALL-The
         correlation method will be Kendall.
     lag {Long}:
         Calculate a correlation value by shifting the pixel array by the step
         specified, from 0 to dimension/2, depending on the time lag. The
         default is 0.
     calculate_xcorr {Boolean}:
         Specifies whether the cross correlation will be computed at lags.When
         ALL_CROSS_CORRELATION is specified, the correlations will be
         calculated at each lag within a range defined by the lag value. For
         example, if the lag value is 2, correlations of -2, -1, 0, 1, and 2
         will be calculated and stored as bands in the output
         raster.ALL_CROSS_CORRELATION-The cross correlation will be computed
         at
         lags.NO_CROSS_CORRELATION-The cross correlation will not be computed
         at
         lags. This is the default.
     calculate_pvalue {Boolean}:
         Specifies whether the p-value will be computed at lags. P-value is a
         confidence value that describes how well the two variables are
         correlated.CALCULATE_P_VALUE-The p-value will be computed at lags.
         The output
         will include additional bands storing the p-values.NO_P_VALUE-The
         p-value will not be computed at lags. This is the
         default.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster dataset. When the lag parameter value is not 0, a
         cross correlation at each lag will be calculated and stored as bands
         in the output.
     out_max_corr_raster {Raster Dataset}:
         A 2-band raster with maximum correlation values and the lags at which
         the maximum correlations occur. The raster will be created when the
         calculate_xcorr parameter is specified as ALL_CROSS_CORRELATION."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_mdim_raster1,
        in_mdim_raster2,
        dimension1,
        variable1,
        dimension2,
        variable2,
        corr_method,
        lag,
        calculate_xcorr,
        calculate_pvalue,
        out_max_corr_raster,
    ):
        out_raster = "#"
        result = arcpy.gp.MultidimensionalRasterCorrelation_ia(
            in_mdim_raster1,
            in_mdim_raster2,
            out_raster,
            dimension1,
            variable1,
            dimension2,
            variable2,
            corr_method,
            lag,
            calculate_xcorr,
            calculate_pvalue,
            out_max_corr_raster,
        )
        return _wrapToolRaster("MultidimensionalRasterCorrelation_sa", str(result.getOutput(0)))

    return Wrapper(
        in_mdim_raster1,
        in_mdim_raster2,
        dimension1,
        variable1,
        dimension2,
        variable2,
        corr_method,
        lag,
        calculate_xcorr,
        calculate_pvalue,
        out_max_corr_raster,
    )


MultidimensionalRasterCorrelation.__esri_toolname__ = "MultidimensionalRasterCorrelation_ia"
MultidimensionalRasterCorrelation.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
]


def Multilook(in_radar_data, polarization_bands="#", range_looks="#", azimuth_looks="#") -> Raster:
    """Multilook_ia(in_radar_data, {polarization_bands;polarization_bands...}, {range_looks}, {azimuth_looks})

       Averages the input synthetic aperture radar (SAR) data by looks in
       range and azimuth to approximate square pixels, mitigates speckle, and
       reduces SAR tool processing time.

    INPUTS:
     in_radar_data (Raster Dataset / Raster Layer):
         The input radar data.
     polarization_bands {String}:
         The polarization bands that will be corrected.The first band is
         selected by default.
     range_looks {Long}:
         The integer number of looks in the range direction. If no value is
         provided, the minimum number of looks required to create an
         approximate square pixel will be used.
     azimuth_looks {Long}:
         The integer number of looks in the azimuth direction. If no value is
         provided, the minimum number of looks required to create an
         approximate square pixel will be used.

    OUTPUTS:
     out_radar_data (Raster Dataset):
         The output multilook radar data."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_radar_data, polarization_bands, range_looks, azimuth_looks):
        out_radar_data = "#"
        result = arcpy.gp.Multilook_ia(in_radar_data, out_radar_data, polarization_bands, range_looks, azimuth_looks)
        return _wrapToolRaster("Multilook_sa", str(result.getOutput(0)))

    return Wrapper(in_radar_data, polarization_bands, range_looks, azimuth_looks)


Multilook.__esri_toolname__ = "Multilook_ia"
Multilook.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5"]


def Negate(in_raster_or_constant) -> Raster:
    """Negate_ia(in_raster_or_constant)

       Changes the sign (multiplies by -1) of the cell values of the input
       raster on a cell-by-cell basis.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input raster to be negated (multiplied by -1).To use a number as
         an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the input values negated
         (multiplied by -1)."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("Negate_sa", ["Negate", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


Negate.__esri_toolname__ = "Negate_ia"
Negate.__esri_toolinfo__ = ["::::1"]


def NonMaximumSuppression(
    in_featureclass, confidence_score_field, out_featureclass, class_value_field="#", max_overlap_ratio="#"
):
    """NonMaximumSuppression_ia(in_featureclass, confidence_score_field, out_featureclass, {class_value_field}, {max_overlap_ratio})

       Identifies duplicate features from the output of the Detect Objects
       Using Deep Learning tool as a postprocessing step and creates a new
       output with no duplicate features. The Detect Objects Using Deep
       Learning tool can return more than one bounding box or polygon for the
       same object, especially as a tiling side effect. If two features
       overlap more than a given maximum ratio, the feature with the lower
       confidence value will be removed.

    INPUTS:
     in_featureclass (Feature Class / Feature Layer):
         The input feature class or feature layer containing overlapping or
         duplicate features.
     confidence_score_field (Field):
         The field in the feature class that contains the confidence scores as
         output by the object detection method.
     class_value_field {Field}:
         The class value field in the input feature class. If not
         specified, the tool will use the standard class value fieldsand. If
         these fields do not exist, all features will be treated as the same
         object class. ClassvalueValue
     max_overlap_ratio {Double}:
         The maximum overlap ratio for two overlapping features. This is
         defined as the ratio of intersection area over union area. The default
         is 0.

    OUTPUTS:
     out_featureclass (Feature Class):
         The output feature class with the duplicate features removed."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_featureclass, confidence_score_field, out_featureclass, class_value_field, max_overlap_ratio):
        result = arcpy.gp.NonMaximumSuppression_ia(
            in_featureclass, confidence_score_field, out_featureclass, class_value_field, max_overlap_ratio
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_featureclass, confidence_score_field, out_featureclass, class_value_field, max_overlap_ratio)


NonMaximumSuppression.__esri_toolname__ = "NonMaximumSuppression_ia"
NonMaximumSuppression.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5"]


def NotEqual(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """NotEqual_ia(in_raster_or_constant1, in_raster_or_constant2)

       Performs a Relational not-equal-to operation on two inputs on a cell-
       by-cell basis.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The input that will be compared to for inequality by the second
         input.A number can be used as an input for this parameter, provided a
         raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The input that will be compared from for inequality by the first
         input.A number can be used as an input for this parameter, provided a
         raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The output cell values will be either integer 0 or
         1, or NoData if any
         input cell value is NoData."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("NotEqual_sa", ["NotEqual", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


NotEqual.__esri_toolname__ = "NotEqual_ia"
NotEqual.__esri_toolinfo__ = ["::::1", "::::2"]


def OptimalInterpolation(
    in_background_raster, in_obs_data, obs_field, background_error_var, obs_error_var, background_error_corr_length="#"
) -> Raster:
    """OptimalInterpolation_ia(in_background_raster, in_obs_data, obs_field, background_error_var, obs_error_var, {background_error_corr_length})

       Statistically assimilates data combined from multiple sources to
       produce an output raster. The tool can be used to merge background
       data, such as model outputs, with observation data, such as point
       measurements, to perform interpolation.

    INPUTS:
     in_background_raster (Raster Layer / Image Service / Raster Dataset):
         The input background raster also known as the background field.
     in_obs_data (Feature Layer / Trajectory Layer):
         The input point features that will be used for interpolation.
     obs_field (String):
         The field containing observation values that will be used for
         interpolation.
     background_error_var (Raster Layer / Image Service / Double / Raster Dataset):
         The error variance of the background measurements.The input can be a
         single value or an error variance raster. If a
         single value is provided, the value will be used as the error variance
         for all background measurements. If an error variance raster is
         provided, each cell in the background data will obtain its error
         variance from the corresponding background error variance raster. The
         error variance raster must have the same cell size and extent as the
         background data.
     obs_error_var (String / Double):
         The error variance of the observations. The input can be a single
         value or a field from the observation data. If a single value is
         provided, the value will be used as the error variance for all
         observations. If a field in the observation data is provided, values
         in the field will be used as the error variance for each corresponding
         observation point.
     background_error_corr_length {Double}:
         The correlation length between background measurements. The default is
         three times the cell size of the in_background_raster parameter value.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output multidimensional raster dataset."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_background_raster, in_obs_data, obs_field, background_error_var, obs_error_var, background_error_corr_length
    ):
        out_raster = "#"
        result = arcpy.gp.OptimalInterpolation_ia(
            in_background_raster,
            in_obs_data,
            obs_field,
            out_raster,
            background_error_var,
            obs_error_var,
            background_error_corr_length,
        )
        return _wrapToolRaster("OptimalInterpolation_sa", str(result.getOutput(0)))

    return Wrapper(
        in_background_raster, in_obs_data, obs_field, background_error_var, obs_error_var, background_error_corr_length
    )


OptimalInterpolation.__esri_toolname__ = "OptimalInterpolation_ia"
OptimalInterpolation.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::5", "::::6", "::::7"]


def Over(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """Over_ia(in_raster_or_constant1, in_raster_or_constant2)

       For the cell values in the first input that are not 0, the output
       value will be that of the first input. Where the cell values are 0,
       the output will be that of the second input raster.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The input for which cell values of 0 will be replaced with the value
         from the second input.A number can be used as an input for this
         parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The input whose value will be assigned to the output raster cells
         where the first input value is 0.A number can be used as an input for
         this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("Over_sa", ["Over", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


Over.__esri_toolname__ = "Over_ia"
Over.__esri_toolinfo__ = ["::::1", "::::2"]


def Pick(
    in_position_raster,
    in_rasters_or_constants,
    process_as_multiband: Literal["SINGLE_BAND", "MULTI_BAND", "#"] | None = "#",
) -> Raster:
    """Pick_ia(in_position_raster, in_rasters_or_constants;in_rasters_or_constants..., {process_as_multiband})

       The value from a position raster is used to determine from which
       raster in a list of input rasters the output cell value will be
       obtained.

    INPUTS:
     in_position_raster (Composite Geodataset):
         The input raster defining the position of the raster to use for the
         output value.The input can be an integer or float raster.
     in_rasters_or_constants (Composite Geodataset):
         The list of inputs from which the output value will be selected.The
         inputs can be integer or float rasters. A number can also be used
         as an input.
     process_as_multiband {Boolean}:
         Specifies how the input multiband raster bands will be
         processed.SINGLE_BAND-Each band from a multiband raster input will be
         processed
         separately as a single band raster. This is the
         default.MULTI_BAND-Each multiband raster input will be processed as a
         multiband raster. The operation will be performed for each band from
         one input using the corresponding band number from the other inputs.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_position_raster, in_rasters_or_constants, process_as_multiband):
        if Utils.useDefaultArgumentValue(process_as_multiband):
            process_as_multiband = "SINGLE_BAND"
        if process_as_multiband not in ["SINGLE_BAND", "MULTI_BAND"]:
            raise arcpy.ExecuteError(
                "ERROR 000622: Failed to execute (Pick). Parameters are not valid.\nERROR 000621: Input to parameter process_as_multiband not within domain.\n"
            )
        return _wrapLocalFunctionRaster(
            "Pick_ia",
            ["Pick", in_position_raster] + Utils.flattenLists(in_rasters_or_constants),
            {"flattenBands": process_as_multiband.upper() == "SINGLE_BAND"},
        )

    return Wrapper(in_position_raster, in_rasters_or_constants, process_as_multiband)


Pick.__esri_toolname__ = "Pick_ia"
Pick.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def Plus(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """Plus_ia(in_raster_or_constant1, in_raster_or_constant2)

       Adds (sums) the values of two rasters on a cell-by-cell basis.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The input whose values will be added to.A number can be used as an
         input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The input whose values will be added to the first input.A number can
         be used as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the sum of the first input added
         to the second."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("Plus_sa", ["Plus", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


Plus.__esri_toolname__ = "Plus_ia"
Plus.__esri_toolinfo__ = ["::::1", "::::2"]


def Power(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """Power_ia(in_raster_or_constant1, in_raster_or_constant2)

       Raises the cell values in a raster to the power of the values found in
       another raster.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The input values to be raised to the power defined by the second
         input.A number can be used as an input for this parameter, provided a
         raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The input that determines the power the values in the first input will
         be raised to.A number can be used as an input for this parameter,
         provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the result of raising the values
         in the first
         input to the power of the values in the second input."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("Power_sa", ["Power", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


Power.__esri_toolname__ = "Power_ia"
Power.__esri_toolinfo__ = ["::::1", "::::2"]


def PredictUsingRegressionModel(in_rasters, in_regression_definition) -> Raster:
    """PredictUsingRegressionModel_ia(in_rasters;in_rasters..., in_regression_definition)

       Predicts data values using the output from the Train Random Trees
       Regression Model tool.

    INPUTS:
     in_rasters (Mosaic Dataset / Mosaic Layer / Raster Dataset / Raster Layer / Image Service / String):
         The single-band, multidimensional, or multiband raster datasets, or
         mosaic datasets containing explanatory variables.
     in_regression_definition (File):
         A JSON format file that contains attribute information, statistics, or
         other information from the regression model. The file has an .ecd
         extension. The file is the output of the Train Random Trees Regression
         Model tool.

    OUTPUTS:
     out_raster_dataset (Raster Dataset):
         A raster of the predicted values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_rasters, in_regression_definition):
        out_raster_dataset = "#"
        result = arcpy.gp.PredictUsingRegressionModel_ia(in_rasters, in_regression_definition, out_raster_dataset)
        return _wrapToolRaster("PredictUsingRegressionModel_sa", str(result.getOutput(0)))

    return Wrapper(in_rasters, in_regression_definition)


PredictUsingRegressionModel.__esri_toolname__ = "PredictUsingRegressionModel_ia"
PredictUsingRegressionModel.__esri_toolinfo__ = ["::::1", "::::2"]


def PredictUsingTrendRaster(
    in_multidimensional_raster,
    variables="#",
    dimension_def: Literal["BY_VALUE", "BY_INTERVAL", "#"] | None = "#",
    dimension_values="#",
    start="#",
    end="#",
    interval_value="#",
    interval_unit: Literal["HOURS", "DAYS", "WEEKS", "MONTHS", "YEARS", "#"] | None = "#",
) -> Raster:
    """PredictUsingTrendRaster_ia(in_multidimensional_raster, {variables;variables...}, {dimension_def}, {dimension_values;dimension_values...}, {start}, {end}, {interval_value}, {interval_unit})

       Computes a forecasted multidimensional raster using the output trend
       raster from the Generate Trend Raster tool.

    INPUTS:
     in_multidimensional_raster (Raster Dataset / Mosaic Dataset / Raster Layer / Mosaic Layer / Image Service / File):
         The input multidimensional trend raster from the Generate Trend Raster
         tool.
     variables {String}:
         The variable or variables that will be predicted in the analysis. If
         no variables are specified, all variables will be used.
     dimension_def {String}:
         Specifies the method used to provide prediction dimension values.
         BY_VALUE-The prediction will be calculated for a single
         dimension value or a list of dimension values defined by theparameter
         (dimension_values in Python). This is the default. ValuesFor
         example, you want to predict yearly precipitation for the years
         2050, 2100, and 2150. BY_INTERVAL-The prediction will be
         calculated for an interval
         of the dimension defined by a start and an end value. For
         example, you want to predict yearly precipitation for every year
         between 2050 and 2150.
     dimension_values {String}:
         The dimension value or values to be used in the prediction.The format
         of the time, depth, and height values must match the format
         of the dimension values used to generate the trend raster. If the
         trend raster was generated for the StdTime dimension, the format would
         be YYYY-MM-DDTHH:MM:SS, for example 2050-01-01T00:00:00. Multiple
         values are separated with a semicolon.This parameter is required when
         the dimension_def parameter is set to
         BY_VALUE.
     start {String}:
         The start date, height, or depth of the dimension interval to be used
         in the prediction.
     end {String}:
         The end date, height, or depth of the dimension interval to be used in
         the prediction.
     interval_value {Double}:
         The number of steps between two dimension values to be included in the
         prediction. The default value is 1.For example, to predict temperature
         values every five years, use a
         value of 5.
     interval_unit {String}:
         Specifies the unit that will be used for the interval value. This
         parameter only applies when the dimension of analysis is a time
         dimension.HOURS-The prediction will be calculated for each hour in the
         range of
         time described by the start, end, and interval_value
         parameters.DAYS-The prediction will be calculated for each day in the
         range of
         time described by the start, end, and interval_value
         parameters.WEEKS-The prediction will be calculated for each week in
         the range of
         time described by the start, end, and interval_value
         parameters.MONTHS-The prediction will be calculated for each month in
         the range
         of time described by the start, end, and interval_value
         parameters.YEARS-The prediction will be calculated for each year in
         the range of
         time described by the start, end, and interval_value parameters.

    OUTPUTS:
     out_multidimensional_raster (Raster Dataset):
         The output Cloud Raster Format (CRF) multidimensional raster dataset."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_multidimensional_raster,
        variables,
        dimension_def,
        dimension_values,
        start,
        end,
        interval_value,
        interval_unit,
    ):
        out_multidimensional_raster = "#"
        result = arcpy.gp.PredictUsingTrendRaster_ia(
            in_multidimensional_raster,
            out_multidimensional_raster,
            variables,
            dimension_def,
            dimension_values,
            start,
            end,
            interval_value,
            interval_unit,
        )
        return _wrapToolRaster("PredictUsingTrendRaster_sa", str(result.getOutput(0)))

    return Wrapper(
        in_multidimensional_raster,
        variables,
        dimension_def,
        dimension_values,
        start,
        end,
        interval_value,
        interval_unit,
    )


PredictUsingTrendRaster.__esri_toolname__ = "PredictUsingTrendRaster_ia"
PredictUsingTrendRaster.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7", "::::8", "::::9"]


def RemoveRasterSegmentTilingArtifacts(in_segmented_raster, tileSizeX="#", tileSizeY="#") -> Raster:
    """RemoveRasterSegmentTilingArtifacts_ia(in_segmented_raster, {tileSizeX}, {tileSizeY})

       Corrects segments or objects cut by tile boundaries during the
       segmentation process performed as a raster function. This tool is
       helpful for some regional processes, such as image segmentation, that
       have inconsistencies near image tile boundaries.

    INPUTS:
     in_segmented_raster (Raster Dataset / Mosaic Dataset / Mosaic Layer / Raster Layer / Image Service / String):
         Select the segmented raster with the tiling artifacts that you want to
         remove.
     tileSizeX {Long}:
         Specify the tile width from Segment Mean Shift. If left blank, the
         default is 512 pixels.
     tileSizeY {Long}:
         Specify the tile height from Segment Mean Shift. If left blank, the
         default is 512 pixels.

    OUTPUTS:
     out_raster_dataset (Raster Dataset):
         The path and name of the segmented raster from which you are removing
         tiling artifacts."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_segmented_raster, tileSizeX, tileSizeY):
        out_raster_dataset = "#"
        result = arcpy.gp.RemoveRasterSegmentTilingArtifacts_ia(
            in_segmented_raster, out_raster_dataset, tileSizeX, tileSizeY
        )
        return _wrapToolRaster("RemoveRasterSegmentTilingArtifacts_sa", str(result.getOutput(0)))

    return Wrapper(in_segmented_raster, tileSizeX, tileSizeY)


RemoveRasterSegmentTilingArtifacts.__esri_toolname__ = "RemoveRasterSegmentTilingArtifacts_ia"
RemoveRasterSegmentTilingArtifacts.__esri_toolinfo__ = ["::::1", "::::3", "::::4"]


def RemoveThermalNoise(in_radar_data, polarization_bands="#") -> Raster:
    """RemoveThermalNoise_ia(in_radar_data, {polarization_bands;polarization_bands...})

       Corrects backscatter disturbances caused by thermal noise in the input
       synthetic aperture radar (SAR) data, resulting in a more seamless
       image.

    INPUTS:
     in_radar_data (Raster Dataset / Raster Layer):
         The input radar data.
     polarization_bands {String}:
         The polarization bands that will be corrected.The first band is
         selected by default.

    OUTPUTS:
     out_radar_data (Raster Dataset):
         The thermal noise-corrected radar data."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_radar_data, polarization_bands):
        out_radar_data = "#"
        result = arcpy.gp.RemoveThermalNoise_ia(in_radar_data, out_radar_data, polarization_bands)
        return _wrapToolRaster("RemoveThermalNoise_sa", str(result.getOutput(0)))

    return Wrapper(in_radar_data, polarization_bands)


RemoveThermalNoise.__esri_toolname__ = "RemoveThermalNoise_ia"
RemoveThermalNoise.__esri_toolinfo__ = ["::::1", "::::3"]


def RoundDown(in_raster_or_constant) -> Raster:
    """RoundDown_ia(in_raster_or_constant)

       Returns the next lower integer value, just represented as a floating
       point, for each cell in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input values to be rounded down.To use a number as an input for
         this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the result of rounding down the
         input values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("RoundDown_sa", ["RoundDown", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


RoundDown.__esri_toolname__ = "RoundDown_ia"
RoundDown.__esri_toolinfo__ = ["::::1"]


def RoundUp(in_raster_or_constant) -> Raster:
    """RoundUp_ia(in_raster_or_constant)

       Returns the next higher integer value, just represented as a floating
       point, for each cell in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input values to be rounded up.To use a number as an input for this
         parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the result of rounding up the
         input values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("RoundUp_sa", ["RoundUp", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


RoundUp.__esri_toolname__ = "RoundUp_ia"
RoundUp.__esri_toolinfo__ = ["::::1"]


def Sample(
    in_rasters,
    in_location_data,
    out_table,
    resampling_type: Literal["NEAREST", "BILINEAR", "CUBIC", "#"] | None = "#",
    unique_id_field="#",
    process_as_multidimensional: Literal["CURRENT_SLICE", "ALL_SLICES", "#"] | None = "#",
    acquisition_definition="#",
    statistics_type: Literal[
        "MINIMUM", "MAXIMUM", "MEDIAN", "MEAN", "SUM", "MAJORITY", "MINORITY", "STD", "PERCENTILE", "#"
    ]
    | None = "#",
    percentile_value="#",
    buffer_distance="#",
    layout: Literal["ROW_WISE", "COLUMN_WISE", "#"] | None = "#",
    generate_feature_class: Literal["TABLE", "FEATURE_CLASS", "#"] | None = "#",
):
    """Sample_ia(in_rasters;in_rasters..., in_location_data, out_table, {resampling_type}, {unique_id_field}, {process_as_multidimensional}, {acquisition_definition;acquisition_definition...}, {statistics_type}, {percentile_value}, {buffer_distance}, {layout}, {generate_feature_class})

       Creates a table or a point feature class that shows the values of
       cells from a raster, or a set of rasters, for defined locations. The
       locations are defined by raster cells, points, polylines, or polygons.

    INPUTS:
     in_rasters (Composite Geodataset):
         The rasters with values that will be sampled based on the input
         location data.The process_as_multidimensional parameter is only
         supported when the
         input is a single, multidimensional raster.
     in_location_data (Composite Geodataset):
         The data identifying positions where a sample will be taken.The input
         can be a raster or a feature class.
     resampling_type {String}:
         The resampling algorithm that will be used to sample a raster to
         determine how the values will be obtained from the
         raster.NEAREST-Nearest neighbor assignment will be used. This is the
         default.BILINEAR-Bilinear interpolation will be used.CUBIC-Cubic
         convolution will be used.
     unique_id_field {Field}:
         A field containing a different value for every location or feature in
         the input location raster or features.
     process_as_multidimensional {Boolean}:
         Specifies how the input rasters will be processed.This parameter is
         only available when the input is a single,
         multidimensional raster.ALL_SLICES-Samples will be processed for all
         dimensions (such as time
         or depth) of a multidimensional dataset.CURRENT_SLICE-Samples will be
         processed from the current slice of a
         multidimensional dataset. This is the default.
     acquisition_definition {Value Table}:
         Specifies the time, depth, or other acquisition data associated with
         the location features. Only the following combinations are
         supported:
         Dimension + Start field or valueDimension + Start field or value + End
         field or valueDimension + Start field or value + Relative value or
         days before +
         Relative value or days afterRelative value or days before and Relative
         value or days after only
         support nonnegative values.Statistics will be calculated using the
         statistics_type parameter for
         variables within this dimension range.
     statistics_type {String}:
         Specifies the statistic type to be calculated.MINIMUM-The minimum
         value within the specified range will be
         calculated.MAXIMUM-The maximum value within the specified range will
         be
         calculated.MEDIAN-The median value within the specified range will be
         calculated.MEAN-The average for the specified range will be
         calculated.SUM-The total value of the variables within the specified
         range will
         be calculated.MAJORITY-The value that occurs most frequently will be
         calculated.MINORITY-The value that occurs least frequently will be
         calculated.STD-The standard deviation will be calculated.PERCENTILE-A
         defined percentile within the specified range will be
         calculated.
     percentile_value {Double}:
         The percentile to calculate when theparameter is set to.
         Statistics TypePercentileThe percentile to calculate when the
         statistics_type parameter is set
         to PERCENTILE.This value can range from 0 to 100. The default is 90.
     buffer_distance {Double / Field}:
         The distance around the location data features. The buffer distance is
         specified in the linear unit of the location feature's spatial
         reference. If the feature uses a geographic reference, the unit will
         be degrees.Statistics will be calculated within this buffer area.
     layout {Boolean}:
         Specifies whether sampled values will appear in rows or columns in the
         output table.ROW_WISE-Sampled values will appear in separate rows in
         the output
         table. This is the default.COLUMN_WISE-Sampled values will appear in
         separate columns in the
         output table. This option is only valid when the input
         multidimensional raster contains one variable and one dimension, and
         each slice is a single-band raster.
     generate_feature_class {Boolean}:
         Specifies whether a point feature class with sampled values in its
         attribute table or a table with sampled values will be
         generated.TABLE-A table with sampled values will be generated. This is
         the
         default.FEATURE_CLASS-A point feature class with sampled values in its
         attribute table will be generated.

    OUTPUTS:
     out_table (Table):
         The output table or feature class containing the sampled cell
         values.The output format is determined by the output location and
         path. By
         default, the output will be a geodatabase table or a geodatabase
         feature class in a geodatabase workspace or a dBASE table or a
         shapefile feature class in a folder workspace.The output data type to
         generate a table or a feature class is
         controlled by the generate_feature_class parameter."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_rasters,
        in_location_data,
        out_table,
        resampling_type,
        unique_id_field,
        process_as_multidimensional,
        acquisition_definition,
        statistics_type,
        percentile_value,
        buffer_distance,
        layout,
        generate_feature_class,
    ):
        result = arcpy.gp.Sample_ia(
            in_rasters,
            in_location_data,
            out_table,
            resampling_type,
            unique_id_field,
            process_as_multidimensional,
            acquisition_definition,
            statistics_type,
            percentile_value,
            buffer_distance,
            layout,
            generate_feature_class,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_rasters,
        in_location_data,
        out_table,
        resampling_type,
        unique_id_field,
        process_as_multidimensional,
        acquisition_definition,
        statistics_type,
        percentile_value,
        buffer_distance,
        layout,
        generate_feature_class,
    )


Sample.__esri_toolname__ = "Sample_ia"
Sample.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
]


def SegmentMeanShift(
    in_raster, spectral_detail="#", spatial_detail="#", min_segment_size="#", band_indexes="#", max_segment_size="#"
) -> Raster:
    """SegmentMeanShift_ia(in_raster, {spectral_detail}, {spatial_detail}, {min_segment_size}, {band_indexes}, {max_segment_size})

       Groups adjacent pixels that have similar spectral characteristics into
       segments.

    INPUTS:
     in_raster (Mosaic Layer / Raster Layer):
         The raster dataset to segment. This can be a multispectral or
         grayscale image.
     spectral_detail {Double}:
         The level of importance given to the spectral differences of features
         in the imagery.Valid values range from 1.0 to 20.0. A higher value is
         appropriate
         when there are features to classify separately that have similar
         spectral characteristics. Smaller values create spectrally smoother
         outputs. For example, with higher spectral detail in a forested scene,
         there will be greater discrimination between the tree species.
     spatial_detail {Long}:
         The level of importance given to the proximity between features in the
         imagery.Valid values range from 1.0 to 20. A higher value is
         appropriate for a
         scene in which the features of interest are small and clustered
         together. Smaller values create spatially smoother outputs. For
         example, in an urban scene, impervious surfaces can be classified
         using a smaller spatial detail, or buildings and roads can be
         classified as separate classes using a higher spatial detail.
     min_segment_size {Long}:
         The minimum size of a segment. Merge segments smaller than this size
         with their best fitting neighbor segment. This is related to the
         minimum mapping unit for your project.Units are in pixels.
     band_indexes {String}:
         The bands that will be used to segment the imagery, separated
         by a space. If no band indexes are specified, they are determined by
         the following criteria:        If the raster has only 3 bands, those 3
         bands are usedIf the raster
         has more than 3 bands, the tool assigns the red, green,
         and blue bands according to the raster's properties.If the red, green,
         and blue bands are not identified in the raster
         dataset's properties, bands 1, 2, and 3 are used.The band order will
         not change the result.Select bands that offer the most differentiation
         between the features
         of interest.
     max_segment_size {Long}:
         The maximum size of a segment. Segments that are larger than the
         specified size will be divided. Use this parameter to prevent
         artifacts in the output raster resulting from large segments.Units are
         in pixels.The default value is -1, meaning there is no limit on the
         segment
         size.

    OUTPUTS:
     out_raster_dataset (Raster Dataset):
         Specify a name and extension for the output dataset.If the input was a
         multispectral image, the output will be an 8-bit
         RGB image. If the input was a grayscale image, the output will be an
         8-bit grayscale image."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, spectral_detail, spatial_detail, min_segment_size, band_indexes, max_segment_size):
        out_raster_dataset = "#"
        result = arcpy.gp.SegmentMeanShift_ia(
            in_raster,
            out_raster_dataset,
            spectral_detail,
            spatial_detail,
            min_segment_size,
            band_indexes,
            max_segment_size,
        )
        return _wrapToolRaster("SegmentMeanShift_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, spectral_detail, spatial_detail, min_segment_size, band_indexes, max_segment_size)


SegmentMeanShift.__esri_toolname__ = "SegmentMeanShift_ia"
SegmentMeanShift.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7"]


def SetNull(in_conditional_raster, in_false_raster_or_constant, where_clause="#") -> Raster:
    """SetNull_ia(in_conditional_raster, in_false_raster_or_constant, {where_clause})

       Set Null sets identified cell locations to NoData based on a specified
       criteria. It returns NoData if a conditional evaluation is true, and
       returns the value specified by another raster if it is false.

    INPUTS:
     in_conditional_raster (Composite Geodataset):
         The input raster representing the true or false result of the desired
         condition.It can be of integer or floating point type.
     in_false_raster_or_constant (Composite Geodataset):
         The input whose values will be used as the output cell values if the
         condition is false.It can be an integer or a floating-point raster, or
         a constant value.
     where_clause {SQL Expression}:
         A logical expression that determines which of the input cells are to
         be true or false.The expression follows the general form of an SQL
         expression. An
         example of a where_clause is "VALUE > 100".

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.If the conditional evaluation is true, NoData is
         returned. If false,
         the value of the second input raster is returned."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_conditional_raster, in_false_raster_or_constant, where_clause):
        if Utils.useDefaultArgumentValue(where_clause):
            return _wrapLocalFunctionRaster(
                "SetNull_sa", ["SetNull", in_conditional_raster, in_false_raster_or_constant]
            )
        out_raster = "#"
        result = arcpy.gp.SetNull_ia(in_conditional_raster, in_false_raster_or_constant, out_raster, where_clause)
        return _wrapToolRaster("SetNull_sa", str(result.getOutput(0)))

    return Wrapper(in_conditional_raster, in_false_raster_or_constant, where_clause)


SetNull.__esri_toolname__ = "SetNull_ia"
SetNull.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def Sin(in_raster_or_constant) -> Raster:
    """Sin_ia(in_raster_or_constant)

       Calculates the sine of cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input for which to calculate the sine values.To use a number as an
         input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The values are the sine of the input values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("Sin_sa", ["Sin", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


Sin.__esri_toolname__ = "Sin_ia"
Sin.__esri_toolinfo__ = ["::::1"]


def SinH(in_raster_or_constant) -> Raster:
    """SinH_ia(in_raster_or_constant)

       Calculates the hyperbolic sine of cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input for which to calculate the hyperbolic sine values.To use a
         number as an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The values are the hyperbolic sine of the input
         values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("SinH_sa", ["SinH", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


SinH.__esri_toolname__ = "SinH_ia"
SinH.__esri_toolinfo__ = ["::::1"]


def Square(in_raster_or_constant) -> Raster:
    """Square_ia(in_raster_or_constant)

       Calculates the square of the cell values in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input values to find the square of.To use a number as an input for
         this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the square of the input cell
         values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("Square_sa", ["Square", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


Square.__esri_toolname__ = "Square_ia"
Square.__esri_toolinfo__ = ["::::1"]


def SquareRoot(in_raster_or_constant) -> Raster:
    """SquareRoot_ia(in_raster_or_constant)

       Calculates the square root of the cell values in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input values to find the square root of.To use a number as an
         input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the square root of the input
         cell values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("SquareRoot_sa", ["SquareRoot", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


SquareRoot.__esri_toolname__ = "SquareRoot_ia"
SquareRoot.__esri_toolinfo__ = ["::::1"]


def SummarizeCategoricalRaster(in_raster, out_table, dimension="#", aoi="#", aoi_id_field="#"):
    """SummarizeCategoricalRaster_ia(in_raster, out_table, {dimension}, {aoi}, {aoi_id_field})

       Generates a table containing the pixel count for each class, in each
       slice of an input categorical raster.

    INPUTS:
     in_raster (Mosaic Layer / Raster Layer / Image Service / String / Raster Dataset / Mosaic Dataset):
         The input multidimensional raster of integer type.
     dimension {String}:
         The input dimension to use for the summary. If there is more than one
         dimension and no value is specified, all slices will be summarized
         using all combinations of dimension values.
     aoi {Feature Layer}:
         The polygon feature layer containing the area or areas of interest to
         use when calculating the pixel count per category. If no area of
         interest is specified, the entire raster dataset will be included in
         the analysis.
     aoi_id_field {Field}:
         The field in the polygon feature layer that defines each area of
         interest. Text and integer fields are supported.

    OUTPUTS:
     out_table (Table):
         The output summary table. Geodatabase, database, text, Microsoft
         Excel, and comma-separated value (CSV) tables are supported."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_raster, out_table, dimension, aoi, aoi_id_field):
        result = arcpy.gp.SummarizeCategoricalRaster_ia(in_raster, out_table, dimension, aoi, aoi_id_field)
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_raster, out_table, dimension, aoi, aoi_id_field)


SummarizeCategoricalRaster.__esri_toolname__ = "SummarizeCategoricalRaster_ia"
SummarizeCategoricalRaster.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5"]


def Tan(in_raster_or_constant) -> Raster:
    """Tan_ia(in_raster_or_constant)

       Calculates the tangent of cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input for which to calculate the tangent values.To use a number as
         an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The values are the tangent of the input values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("Tan_sa", ["Tan", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


Tan.__esri_toolname__ = "Tan_ia"
Tan.__esri_toolinfo__ = ["::::1"]


def TanH(in_raster_or_constant) -> Raster:
    """TanH_ia(in_raster_or_constant)

       Calculates the hyperbolic tangent of cells in a raster.

    INPUTS:
     in_raster_or_constant (Composite Geodataset):
         The input to calculate the hyperbolic tangent values for.To use a
         number as an input for this parameter, the cell size and
         extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The values are the hyperbolic tangent of the input
         values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant):
        return _wrapLocalFunctionRaster("TanH_sa", ["TanH", in_raster_or_constant])

    return Wrapper(in_raster_or_constant)


TanH.__esri_toolname__ = "TanH_ia"
TanH.__esri_toolinfo__ = ["::::1"]


def Test(in_raster, where_clause) -> Raster:
    """Test_ia(in_raster, where_clause)

       Performs a Boolean evaluation of the input raster using a logical
       expression.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster on which the Boolean evaluation is performed, based
         on a logical expression.
     where_clause (SQL Expression):
         The logical expression that will determine which input cells will
         return a value of true (1) and which will be false (0).The expression
         follows the general form of an SQL expression. An
         example of a where_clause is "VALUE > 100".

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The output cell values will be either 0 or 1."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, where_clause):
        out_raster = "#"
        result = arcpy.gp.Test_ia(in_raster, where_clause, out_raster)
        return _wrapToolRaster("Test_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, where_clause)


Test.__esri_toolname__ = "Test_ia"
Test.__esri_toolinfo__ = ["::::1", "::::2"]


def Times(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """Times_ia(in_raster_or_constant1, in_raster_or_constant2)

       Multiplies the values of two rasters on a cell-by-cell basis.

    INPUTS:
     in_raster_or_constant1 (Composite Geodataset):
         The input containing the values to be multiplied.A number can be used
         as an input for this parameter, provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.
     in_raster_or_constant2 (Composite Geodataset):
         The input containing the values by which the first input will be
         multiplied.A number can be used as an input for this parameter,
         provided a raster
         is specified for the other parameter. To specify a number for both
         inputs, the cell size and extent must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The cell values are the product of the first input
         multiplied by the
         second."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("Times_sa", ["Times", in_raster_or_constant1, in_raster_or_constant2])

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


Times.__esri_toolname__ = "Times_ia"
Times.__esri_toolinfo__ = ["::::1", "::::2"]


def TrainDeepLearningModel(
    in_folder,
    out_folder,
    max_epochs="#",
    model_type: Literal[
        "BDCN_EDGEDETECTOR",
        "CHANGEDETECTOR",
        "CONNECTNET",
        "CYCLEGAN",
        "DEEPLAB",
        "DEEPSORT",
        "DETREG",
        "FASTERRCNN",
        "FEATURE_CLASSIFIER",
        "HED_EDGEDETECTOR",
        "IMAGECAPTIONER",
        "MASKRCNN",
        "MAXDEEPLAB",
        "MMDETECTION",
        "MMSEGMENTATION",
        "MULTITASK_ROADEXTRACTOR",
        "PIX2PIX",
        "PIX2PIXHD",
        "PSETAE",
        "PSPNET",
        "RETINANET",
        "SIAMMASK",
        "SSD",
        "SUPERRESOLUTION",
        "UNET",
        "YOLOV3",
        "SAMLORA",
        "CLIMAX",
        "#",
    ]
    | None = "#",
    batch_size="#",
    arguments="#",
    learning_rate="#",
    backbone_model: Literal[
        "RESNET18",
        "RESNET34",
        "RESNET50",
        "RESNET101",
        "RESNET152",
        "RESNEXT50",
        "WIDE_RESNET50",
        "DENSENET121",
        "DENSENET169",
        "DENSENET161",
        "DENSENET201",
        "VGG11",
        "VGG11_BN",
        "VGG13",
        "VGG13_BN",
        "VGG16",
        "VGG16_BN",
        "VGG19",
        "VGG19_BN",
        "MOBILENET_V2",
        "DARKNET53",
        "REID_V1",
        "REID_V2",
        "SR3",
        "SR3_UVIT",
        "VIT_H",
        "VIT_L",
        "VIT_B",
        "5.625deg",
        "1.40625deg",
        "#",
    ]
    | None = "#",
    pretrained_model="#",
    validation_percentage="#",
    stop_training: Literal["STOP_TRAINING", "CONTINUE_TRAINING", "#"] | None = "#",
    freeze: Literal["FREEZE_MODEL", "UNFREEZE_MODEL", "#"] | None = "#",
    augmentation: Literal["DEFAULT", "NONE", "CUSTOM", "FILE", "#"] | None = "#",
    augmentation_parameters="#",
    chip_size="#",
    resize_to="#",
    weight_init_scheme: Literal["RANDOM", "RED_BAND", "ALL_RANDOM", "#"] | None = "#",
    monitor: Literal[
        "VALID_LOSS",
        "AVERAGE_PRECISION",
        "ACCURACY",
        "F1_SCORE",
        "MIOU",
        "DICE",
        "PRECISION",
        "RECALL",
        "CORPUS_BLEU",
        "MULTI_LABEL_FBETA",
        "#",
    ]
    | None = "#",
):
    """TrainDeepLearningModel_ia(in_folder;in_folder..., out_folder, {max_epochs}, {model_type}, {batch_size}, {arguments;arguments...}, {learning_rate}, {backbone_model}, {pretrained_model}, {validation_percentage}, {stop_training}, {freeze}, {augmentation}, {augmentation_parameters;augmentation_parameters...}, {chip_size}, {resize_to}, {weight_init_scheme}, {monitor})

       Trains a deep learning model using the output from the Export Training
       Data For Deep Learning tool.

    INPUTS:
     in_folder (Folder):
         The folders containing the image chips, labels, and statistics
         required to train the model. This is the output from the Export
         Training Data For Deep Learning tool. Multiple input folders
         are supported when the following
         conditions are met:        The metadata format type must be classified
         tiles, labeled tiles,
         multilabeled tiles, Pascal Visual Object Classes, or RCNN masks.All
         training data must have the same metadata format.All training data
         must have the same number of bands.
     max_epochs {Long}:
         The maximum number of epochs for which the model will be trained. A
         maximum epoch of 1 means the dataset will be passed forward and
         backward through the neural network one time. The default value is 20.
     model_type {String}:
         Specifies the model type that will be used to train the deep learning
         model.BDCN_EDGEDETECTOR-The Bi-Directional Cascade Network (BDCN)
         architecture will be used to train the model. BDCN Edge Detector is
         used for pixel classification. This approach is useful to improve edge
         detection for objects at different scales.CHANGEDETECTOR-The Change
         detector architecture will be used to train
         the model. Change detector is used for pixel classification. This
         approach creates a model object that uses two spatial-temporal images
         to create a classified raster of the change. The input training data
         for this model type uses the Classified Tiles metadata
         format.CLIMAX-ClimaX is architecture will be used to train the model.
         This
         model is primarily used for weather and climate analysis. ClimaX is
         used for pixel classification. The preliminary data used for this
         method is multidimensional data.CONNECTNET-The ConnectNet architecture
         will be used to train the
         model. ConnectNet is used for pixel classification. This approach is
         useful for road network extraction from satellite imagery.CYCLEGAN-The
         CycleGAN architecture will be used to train the model.
         CycleGAN is used for image-to-image translation. This approach creates
         a model object that generates images of one type to another. This
         approach is unique in that the images to be trained do not need to
         overlap. The input training data for this model type uses the CycleGAN
         metadata format.DEEPLAB-The DeepLabV3 architecture will be used to
         train the model.
         DeepLab is used for pixel classification.DEEPSORT-The Deep Sort
         architecture will be used to train the model.
         Deep Sort is used for object detection in videos. The model is trained
         using frames of the video and detects the classes and bounding boxes
         of the objects in each frame. The input training data for this model
         type uses the Imagenet metadata format. While Siam Mask is useful for
         tracking an object, Deep Sort is useful in training a model to track
         multiple objects.DETREG-The DETReg architecture will be used to train
         the model. DETReg
         is used for object detection. The input training data for this model
         type uses the Pascal Visual Object Classes. This model type is GPU
         intensive; it requires a dedicated GPU with at least 16 GB of memory
         to run properly.FASTERRCNN-The FasterRCNN architecture will be used to
         train the
         model. FasterRCNN is used for object detection.FEATURE_CLASSIFIER-The
         Feature classifier architecture will be used to
         train the model. Feature Classifier is used for object or image
         classification.HED_EDGEDETECTOR-The Holistically-Nested Edge
         Detection (HED)
         architecture will be used to train the model. HED Edge Detector is
         used for pixel classification. This approach is useful for edge and
         object boundary detection.IMAGECAPTIONER-The Image captioner
         architecture will be used to train
         the model. Image captioner is used for image-to-text translation. This
         approach creates a model that generates text captions for an
         image.MASKRCNN-The MaskRCNN architecture will be used to train the
         model.
         MaskRCNN is used for object detection. This approach is used for
         instance segmentation, which is precise delineation of objects in an
         image. This model type can be used to detect building footprints. It
         uses the MaskRCNN metadata format for training data as input. Class
         values for input training data must start at 1. This model type can
         only be trained using a CUDA-enabled GPU.MAXDEEPLAB-The MaX-DeepLab
         architecture will be used to train the
         model. MaX-DeepLab is used for panoptic segmentation. This approach
         creates a model object that generates images and features. The input
         training data for this model type uses the Panoptic segmentation
         metadata format.MMDETECTION-The MMDetection architecture will be used
         to train the
         model. MMDetection is used for object detection. The supported
         metadata formats are Pascal Visual Object Class rectangles and KITTI
         rectangles.MMSEGMENTATION-The MMSegmentation architecture will be used
         to train
         the model. MMSegmentation is used for pixel classification. The
         supported metadata format is Classified Tiles.MULTITASK_ROADEXTRACTOR-
         The Multi Task Road Extractor architecture
         will be used to train the model. Multi Task Road Extractor is used for
         pixel classification. This approach is useful for road network
         extraction from satellite imagery.PIX2PIX-The Pix2Pix architecture
         will be used to train the model.
         Pix2Pix is used for image-to-image translation. This approach creates
         a model object that generates images of one type to another. The input
         training data for this model type uses the Export Tiles metadata
         format.PIX2PIXHD-The Pix2PixHD architecture will be used to train the
         model.
         Pix2PixHD is used for image-to-image translation. This approach
         creates a model object that generates images of one type to another.
         The input training data for this model type uses the Export Tiles
         metadata format.PSETAE-The Pixel-Set Encoders and Temporal Self-
         Attention (PSETAE)
         architecture will be used to train the model for time series
         classification. PSETAE is used for pixel classification. The
         preliminary data used for this method is multidimensional
         data.PSPNET-The Pyramid Scene Parsing Network (PSPNET) architecture
         will be
         used to train the model. PSPNET is used for pixel
         classification.RETINANET-The RetinaNet architecture will be used to
         train the model.
         RetinaNet is used for object detection. The input training data for
         this model type uses the Pascal Visual Object Classes metadata
         format.SAMLORA-The Segment anything model (SAM) with Low Rank Adaption
         (LoRA)
         will be used to train the model. This model type uses the SAM as a
         foundational model and will fine-tune to a specific task with
         relatively low computing requirements and a smaller dataset.SIAMMASK-
         The Siam Mask architecture will be used to train the model.
         Siam Mask is used for object detection in videos. The model is trained
         using frames of the video and detects the classes and bounding boxes
         of the objects in each frame. The input training data for this model
         type uses the MaskRCNN metadata format.SSD-The Single Shot Detector
         (SSD) architecture will be used to train
         the model. SSD is used for object detection. The input training data
         for this model type uses the Pascal Visual Object Classes metadata
         format.SUPERRESOLUTION-The Super-resolution architecture will be used
         to
         train the model. Super-resolution is used for image-to-image
         translation. This approach creates a model object that increases the
         resolution and improves the quality of images. The input training data
         for this model type uses the Export Tiles metadata format.UNET-The
         U-Net architecture will be used to train the model. U-Net is
         used for pixel classification.YOLOV3-The YOLOv3 architecture will be
         used to train the model. YOLOv3
         is used for object detection.
     batch_size {Long}:
         The number of training samples that will be processed for training at
         one time.Increasing the batch size can improve tool performance;
         however, as
         the batch size increases, more memory is used.When not enough GPU
         memory is available for the batch size set, the
         tool tries to estimate and use an optimum batch size. If an out of
         memory error occurs, use a smaller batch size.
     arguments {Value Table}:
         The information from the model_type parameter will be used to set the
         default values for this parameter. These arguments vary, depending on
         the model architecture. The supported model arguments for models
         trained in ArcGIS are described below. ArcGIS pretrained models and
         custom deep learning models may have additional arguments that the
         tool supports.For more information about which arguments are available
         for each
         model type, see Deep learning arguments.attention_type-Specifies the
         module type. The module options are PAM
         (Pyramid Attention Module) and BAM (Basic Attention Module). The
         default is PAM.attn_res-The number of attentions in residual blocks.
         This is an
         optional integer value. The default is 16. This argument is only
         supported when the backbone_model parameter value is
         SR3.channel_mults-Optional depth multipliers for subsequent
         resolutions in
         U-Net. The default is 1, 2, 4, 4, 8, 8. This argument is only
         supported when the backbone_model parameter value is
         SR3.CLASS_BALANCING-Specifies whether the cross-entropy loss inverse
         will
         be balanced to the frequency of pixels per class. The default is
         False. decode_params-A dictionary that controls how the Image
         captioner will run. The default value is {'embed_size':100,
         'hidden_size':100, 'attention_size':100, 'teacher_forcing':1,
         'dropout':0.1, 'pretrained_emb':False}. The decode_params argument is
         composed of the following parameters:. embed_size-The
         embedding size. The default is 100 layers in the neural
         network.hidden_size-The hidden layer size. The default is 100 layers
         in the
         neural network.attention_size-The intermediate attention layer size.
         The default is
         100 layers in the neural network.teacher_forcing-The probability of
         teacher forcing. Teacher forcing is
         a strategy for training recurrent neural networks. It uses model
         output from a prior time step as an input, instead of the previous
         output, during back propagation. The valid range is 0.0 to 1.0. The
         default is 1.dropout-The dropout probability. The valid range is 0.0
         to 1.0. The
         default is 0.1.pretrained_emb-Specifies whether pretrained text
         embedding will be
         used. If True, it will use fast text embedding. If False, it will not
         use pretrained text embedding. The default is False.dropout-An
         optional floating point value for dropout. The default is
         0. This argument is only supported when the backbone_model parameter
         value is SR3.FOCAL_LOSS-Specifies whether focal loss will be used. The
         default is
         False.gaussian_thresh-The Gaussian threshold, which sets the required
         road
         width. The valid range is 0.0 to 1.0. The default is 0.76.grids-The
         number of grids the image will be divided into for
         processing. For example, setting this argument to 4 means the image
         will be divided into 4 x 4 or 16 grid cells. If no value is specified,
         the optimal grid value will be calculated based on the input
         imagery.IGNORE_CLASSES-The list of class values on which the model
         will not
         incur loss.inner_channel-The dimension of the first U-net layer. This
         is an
         optional integer value. The default is 64. This argument is only
         supported when the backbone_model parameter value is
         SR3.linear_start-An optional integer to schedule the start. The
         default is
         1e-02. This argument is only supported when the backbone_model
         parameter value is SR3.linear_end-An optional integer to schedule the
         end. The default is
         1e-06. This argument is only supported when the backbone_model
         parameter value is SR3.MIXUP-Specifies whether mixup augmentation and
         mixup loss will be
         used. The default is False.model-The backbone model used to train the
         model. The available
         backbones depend on the specified model_type parameter value. This
         argument is only supported for the MMDetection and MMSegmentation
         model types. The default for MMDetection is cascade_rcnn. The default
         for MMSegmentation is mask2former.model_weight-Specifies whether
         pretrained model weights will be used.
         The default is False. The value can also be a path to a configuration
         file containing the weights of a model from the MMDetection repository
         or the MMSegmentation repositorymonitor-Specifies the metric to
         monitor while checkpointing and early
         stopping. The available metrics depend on the model_type parameter
         value. The default is valid_loss.mtl_model-Specifies the architecture
         type that will be used to create
         the model. The options are linknet or hourglass for linknet-based or
         hourglass-based, respectively, neural architectures. The default is
         hourglass.n_timestep-An optional value for the number of diffusion
         time steps.
         The default is 1000. This argument is only supported when the
         backbone_model parameter value is SR3.norm_groups-The number of groups
         for group normalization. This is an
         optional integer value. The default is 32. This argument is only
         supported when the backbone_model parameter value is
         SR3.orient_bin_size-The bin size for orientation angles. The default
         is
         20.orient_theta-The width of orientation mask. The default is
         8.PYRAMID_SIZES-The number and size of convolution layers to be
         applied
         to the different subregions. The default is [1,2,3,6]. This argument
         is specific to the PSPNET model.ratios-The list of aspect ratios to
         use for the anchor boxes. In
         object detection, an anchor box represents the ideal location, shape,
         and size of the object being predicted. For example, setting this
         argument to [1.0,1.0], [1.0, 0.5] means the anchor box is a square
         (1:1) or a rectangle in which the horizontal side is half the size of
         the vertical side (1:0.5). The default for RETINANET is [0.5,1,2]. The
         default for SSD is [1.0, 1.0].res_blocks-The number of residual
         blocks. This is an optional integer
         value. The default is 3. This argument is only supported when the
         backbone_model parameter value is SR3.SCALES-The number of scale
         levels each cell will be scaled up or down.
         The default is [1, 0.8, 0.63].schedule-An optional argument to set the
         type of schedule to use. The
         options are linear, warmup10, warmup50, const, jsd, cosine. The
         default is linear. This argument is only supported when the
         backbone_model parameter value is SR3.USE_UNET-Specifies whether the
         U-Net decoder will be used to recover
         data once the pyramid pooling is complete. The default is True. This
         argument is specific to the PSPNET model.zooms-The number of zoom
         levels each grid cell will be scaled up or
         down. Setting this argument to 1 means all the grid cells will remain
         at the same size or zoom level. A zoom level of 2 means all the grid
         cells will become twice as large (zoomed in 100 percent). Providing a
         list of zoom levels means all the grid cells will be scaled using all
         the numbers in the list. The default is 1.
     learning_rate {Double}:
         The rate at which existing information will be overwritten with newly
         acquired information throughout the training process. If no value is
         specified, the optimal learning rate will be extracted from the
         learning curve during the training process.
     backbone_model {String}:
         Specifies the preconfigured neural network that will be used as the
         architecture for training the new model. This method is known as
         Transfer Learning.1.40625deg-This backbone was trained on imagery in
         which the
         resolution of each grid cell covers an area of 1.40625 degrees by
         1.40625 degrees. This is used for weather and climate predictions.
         This is a higher resolution setting, allowing for more precise outputs
         but requires more computational power.5.625deg-This backbone was
         trained on imagery in which the resolution
         of each grid cell covers an area of 5.625 degrees by 5.625 degrees.
         This is used for weather and climate predictions. This is considered a
         low-resolution setting but requires less computational
         power.DENSENET121-The preconfigured model will be a dense network
         trained on
         the Imagenet Dataset that contains more than 1 million images and is
         121 layers deep. Unlike ResNET, which combines the layer using
         summation, DenseNet combines the layers using
         concatenation.DENSENET161-The preconfigured model will be a dense
         network trained on
         the Imagenet Dataset that contains more than 1 million images and is
         161 layers deep. Unlike ResNET, which combines the layer using
         summation, DenseNet combines the layers using
         concatenation.DENSENET169-The preconfigured model will be a dense
         network trained on
         the Imagenet Dataset that contains more than 1 million images and is
         169 layers deep. Unlike ResNET, which combines the layer using
         summation, DenseNet combines the layers using
         concatenation.DENSENET201-The preconfigured model will be a dense
         network trained on
         the Imagenet Dataset that contains more than 1 million images and is
         201 layers deep. Unlike ResNET, which combines the layer using
         summation, DenseNet combines the layers using
         concatenation.MOBILENET_V2-The preconfigured model will be trained on
         the Imagenet
         Database and is 54 layers deep and intended for Edge device computing,
         since it uses less memory.RESNET18-The preconfigured model will be a
         residual network trained on
         the Imagenet Dataset that contains more than 1 million images and is
         18 layers deep.RESNET34-The preconfigured model will be a residual
         network trained on
         the Imagenet Dataset that contains more than 1 million images and is
         34 layers deep. This is the default.RESNET50-The preconfigured model
         will be a residual network trained on
         the Imagenet Dataset that contains more than 1 million images and is
         50 layers deep.RESNET101-The preconfigured model will be a residual
         network trained
         on the Imagenet Dataset that contains more than 1 million images and
         is 101 layers deep.RESNET152-The preconfigured model will be a
         residual network trained
         on the Imagenet Dataset that contains more than 1 million images and
         is 152 layers deep.VGG11-The preconfigured model will be a convolution
         neural network
         trained on the Imagenet Dataset that contains more than 1 million
         images to classify images into 1,000 object categories and is 11
         layers deep.VGG11_BN-The preconfigured model will be based on the VGG
         network but
         with batch normalization, which means each layer in the network is
         normalized. It trained on the Imagenet dataset and has 11
         layers.VGG13-The preconfigured model will be a convolution neural
         network
         trained on the Imagenet Dataset that contains more than 1 million
         images to classify images into 1,000 object categories and is 13
         layers deep.VGG13_BN-The preconfigured model will be based on the VGG
         network but
         with batch normalization, which means each layer in the network is
         normalized. It trained on the Imagenet dataset and has 13
         layers.VGG16-The preconfigured model will be a convolution neural
         network
         trained on the Imagenet Dataset that contains more than 1 million
         images to classify images into 1,000 object categories and is 16
         layers deep.VGG16_BN-The preconfigured model will be based on the VGG
         network but
         with batch normalization, which means each layer in the network is
         normalized. It trained on the Imagenet dataset and has 16
         layers.VGG19-The preconfigured model will be a convolution neural
         network
         trained on the Imagenet Dataset that contains more than 1 million
         images to classify images into 1,000 object categories and is 19
         layers deep.VGG19_BN-The preconfigured model will be based on the VGG
         network but
         with batch normalization, which means each layer in the network is
         normalized. It trained on the Imagenet dataset and has 19
         layers.DARKNET53-The preconfigured model will be a convolution neural
         network
         trained on the Imagenet Dataset that contains more than 1 million
         images and is 53 layers deep.REID_V1-The preconfigured model will be a
         convolution neural network
         trained on the Imagenet Dataset that is used for object
         tracking.REID_V2-The preconfigured model will be a convolution neural
         network
         trained on the Imagenet Dataset that is used for object
         tracking.RESNEXT50-The preconfigured model will be a convolution
         neural network
         trained on the Imagenet Dataset and is 50 layers deep. It is a
         homogeneous neural network, which reduces the number of
         hyperparameters required by conventional ResNet.WIDE_RESNET50-The
         preconfigured model will be a convolution neural
         network trained on the Imagenet Dataset and is 50 layers deep. It has
         the same architecture as ResNET but with more channels.SR3-The
         preconfigured model will use the Super Resolution via Repeated
         Refinement (SR3) model. SR3 adapts denoising diffusion probabilistic
         models to conditional image generation and performs super-resolution
         through a stochastic denoising process. For more information, see
         Image Super-Resolution via Iterative Refinement on the arXiv
         site.SR3_UVIT-This backbone model refers to a specific implementation
         of
         Vision Transformer (ViT)-based architecture designed for diffusion
         models within image generation and SR3 tasks.VIT_B-The preconfigured
         Segment Anything Model (SAM) will be used with
         a base neural network size. This is the smallest size. For more
         information, see Segment Anything on the arXiv site.VIT_L-The
         preconfigured Segment Anything Model (SAM) will be used with
         a large neural network size. For more information, see Segment
         Anything on the arXiv site.VIT_H-The preconfigured Segment Anything
         Model (SAM) will be used with
         a huge neural network size. This is the largest size. For more
         information, see Segment Anything on the arXiv site.Additionally,
         supported convolution neural networks from the PyTorch
         Image Models (timm) can be specified using timm as a prefix, for
         example, timm:resnet31 , timm:inception_v4 , timm:efficientnet_b3, and
         so on.
     pretrained_model {File}:
         A pretrained model that will be used to fine-tune the new model. The
         input is an Esri model definition file (.emd) or a deep learning
         package file (.dlpk).A pretrained model with similar classes can be
         fine-tuned to fit the
         new model. The pretrained model must have been trained with the same
         model type and backbone model that will be used to train the new
         model.
     validation_percentage {Double}:
         The percentage of training samples that will be used for validating
         the model. The default value is 10.
     stop_training {Boolean}:
         Specifies whether early stopping will be
         implemented.STOP_TRAINING-Early stopping will be implemented, and the
         model
         training will stop when the model is no longer improving, regardless
         of the max_epochs parameter value specified. This is the
         default.CONTINUE_TRAINING-Early stopping will not be implemented, and
         the
         model training will continue until the max_epochs parameter value is
         reached.
     freeze {Boolean}:
         Specifies whether the backbone layers in the pretrained model will be
         frozen, so that the weights and biases remain as originally
         designed.FREEZE_MODEL-The backbone layers will be frozen, and the
         predefined
         weights and biases will not be altered in the backbone_model
         parameter. This is the default.UNFREEZE_MODEL-The backbone layers will
         not be frozen, and the weights
         and biases of the backbone_model parameter can be altered to fit the
         training samples. This takes more time to process but typically
         produces better results.
     augmentation {String}:
         Specifies the type of data augmentation that will be used.Data
         augmentation is a technique of artificially increasing the
         training set by creating modified copies of a dataset using existing
         data. DEFAULT-The default data augmentation methods and values
         will
         be used. The default data augmentation methods are crop,
         dihedral_affine,
         brightness, contrast, and zoom. These default values typically work
         well for satellite imagery.NONE-No data augmentation will be
         used.CUSTOM-Data augmentation values will be specified using the
         augmentation_parameters parameter. FILE-Fastai transforms for
         data augmentation of training and
         validation datasets will be specified using the transforms.json file,
         which is in the same folder as the training data         For more
         information about the various transformations, see vision
         transforms on the fastai website.
     augmentation_parameters {Value Table}:
         Specifies the value for each transform in the augmentation
         parameter. rotate-The image will be randomly rotated (in
         degrees) by a
         probability (p). If degrees is a range (a,b), a value will be
         uniformly assigned from a to b. The default value is 30.0;
         0.5.brightness-The brightness of the image will be randomly adjusted
         depending on the value of change, with a probability (p). A change of
         0 will transform the image to darkest, and a change of 1 will
         transform the image to lightest. A change of 0.5 will not adjust the
         brightness. If change is a range (a,b), the augmentation will
         uniformly assign a value from a to b. The default value is (0.4,0.6);
         1.0.contrast-The contrast of the image will be randomly adjusted
         depending
         on the value of scale, with a probability (p). A scale of 0 will
         transform the image to gray scale, and a scale greater than 1 will
         transform the image to super contrast. A scale of 1 doesn't adjust the
         contrast. If scale is a range (a,b), the augmentation will uniformly
         assign a value from a to b. The default value is (0.75, 1.5);
         1.0.zoom-The image will be randomly zoomed in depending on the value
         of
         scale. The zoom value is in the form scale(a,b); p. The default value
         is (1.0, 1.2); 1.0 in which p is the probability. Only a scale of
         greater than 1.0 will zoom in on the image. If scale is a range (a,b),
         it will uniformly assign a value from a to b.crop-The image will be
         randomly cropped. The crop value is in the form
         size;p;row_pct;col_pct in which p is probability. The position is
         given by (col_pct, row_pct), with col_pct and row_pct being normalized
         between 0 and 1. If col_pct or row_pct is a range (a,b), it will
         uniformly assign a value from a to b. The default value is
         chip_size;1.0; (0, 1); (0, 1) in which 224 is the default chip size.
     chip_size {Long}:
         The size of the image that will be used to train the model. Images
         will be cropped to the specified chip size.The default chip size will
         be the same as the tile size of the
         training data. If the x- and y- tile size are different, the smaller
         value will be used as the default chip size. The chip size should be
         less than the smallest x- or y- tile size of all images in the input
         folders.
     resize_to {String}:
         Resizes the image chips. Once a chip is resized, pixel blocks of chip
         size will be cropped and used for training. This parameter applies to
         object detection (PASCAL VOC), object classification (labeled tiles),
         and super-resolution data only.The resize value is often half the chip
         size value. If the resize
         value is less than the chip size value, the resize value is used to
         create the pixel blocks for training.
     weight_init_scheme {String}:
         Specifies the scheme in which the weights will be initialized for the
         layer.To train a model with multispectral data, the model must
         accommodate
         the various types of bands available. This is done by reinitializing
         the first layer in the model.RANDOM-Random weights will be initialized
         for non-RGB bands, while
         pretrained weights will be preserved for RGB bands. This is the
         default.RED_BAND-Weights corresponding to the red band from the
         pretrained
         model's layer will be cloned for non-RGB bands, while pretrained
         weights will be preserved for RGB bands.ALL_RANDOM-Random weights
         will be initialized for RGB bands as well
         as non-RGB bands. This option applies only to multispectral
         imagery.This parameter is only applicable when multispectral imagery
         is used
         in the model.
     monitor {String}:
         Specifies the metric that will be monitored while checkpointing and
         early stopping.VALID_LOSS-The validation loss will be monitored. When
         the validation
         loss no longer changes significantly, the model will stop. This is the
         default.AVERAGE_PRECISION-The weighted mean of precision at each
         threshold
         will be monitored. When this value no longer changes significantly,
         the model will stop.ACCURACY-The ratio between the number of correct
         predictions to the
         total number of predictions will be monitored. When this value no
         longer changes significantly, the model will stop.F1_SCORE-The
         combination of the precision and recall scores of the
         model will be monitored. When this value no longer changes
         significantly, the model will stop.MIOU-The average between the
         intersection over union (IoU) of the
         segmented objects over all the images of the test dataset will be
         monitored. When this value no longer changes significantly, the model
         will stop. DICE-Model performance will be monitored using the
         Dice
         metric. When this value no longer changes significantly, the model
         will stop. This value can range from 0 to 1. The value 1
         corresponds to a pixel
         perfect match between the validation data and training data.
         PRECISION-The precision, which measures the model's accuracy
         in classifying a sample as positive, will be monitored. When this
         value no longer changes significantly, the model will stop.
         The precision is the ratio between the number of positive samples
         correctly classified and the total number of samples classified
         (either correctly or incorrectly). RECALL-The recall, which
         measures the model's ability to
         detect positive samples, will be monitored. When this value no longer
         changes significantly, the model will stop. The higher the
         recall, the more positive samples are detected. The
         recall value is the ratio between the number of positive samples
         correctly classified as positive and the total number of positive
         samples. CORPUS_BLEU-The Corpus blue score will be monitored.
         When
         this value no longer changes significantly, the model will stop.
         This score is used to calculate accuracy for multiple sentences, such
         as a paragraph or a document. MULTI_LABEL_FBETA-The weighted
         harmonic mean of precision and
         recall will be monitored. When this value no longer changes
         significantly, the model will stop. This is often referred to
         as the F-beta score.

    OUTPUTS:
     out_folder (Folder):
         The output folder location where the trained model will be stored."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_folder,
        out_folder,
        max_epochs,
        model_type,
        batch_size,
        arguments,
        learning_rate,
        backbone_model,
        pretrained_model,
        validation_percentage,
        stop_training,
        freeze,
        augmentation,
        augmentation_parameters,
        chip_size,
        resize_to,
        weight_init_scheme,
        monitor,
    ):
        result = arcpy.gp.TrainDeepLearningModel_ia(
            in_folder,
            out_folder,
            max_epochs,
            model_type,
            batch_size,
            arguments,
            learning_rate,
            backbone_model,
            pretrained_model,
            validation_percentage,
            stop_training,
            freeze,
            augmentation,
            augmentation_parameters,
            chip_size,
            resize_to,
            weight_init_scheme,
            monitor,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_folder,
        out_folder,
        max_epochs,
        model_type,
        batch_size,
        arguments,
        learning_rate,
        backbone_model,
        pretrained_model,
        validation_percentage,
        stop_training,
        freeze,
        augmentation,
        augmentation_parameters,
        chip_size,
        resize_to,
        weight_init_scheme,
        monitor,
    )


TrainDeepLearningModel.__esri_toolname__ = "TrainDeepLearningModel_ia"
TrainDeepLearningModel.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
    "::::13",
    "::::14",
    "::::15",
    "::::16",
    "::::17",
    "::::18",
]


def TrainIsoClusterClassifier(
    in_raster,
    max_classes,
    out_classifier_definition,
    in_additional_raster="#",
    max_iterations="#",
    min_samples_per_cluster="#",
    skip_factor="#",
    used_attributes: list[Literal["COLOR", "MEAN", "STD", "COUNT", "COMPACTNESS", "RECTANGULARITY"]]
    | Literal["COLOR", "MEAN", "STD", "COUNT", "COMPACTNESS", "RECTANGULARITY"]
    | str
    | None = "#",
    max_merge_per_iter="#",
    max_merge_distance="#",
):
    """TrainIsoClusterClassifier_ia(in_raster, max_classes, out_classifier_definition, {in_additional_raster}, {max_iterations}, {min_samples_per_cluster}, {skip_factor}, {used_attributes;used_attributes...}, {max_merge_per_iter}, {max_merge_distance})

       Generates an Esri classifier definition file (.ecd) using the Iso
       Cluster classification definition.

    INPUTS:
     in_raster (Mosaic Layer / Raster Layer / Image Service / String):
         The raster dataset to classify.
     max_classes (Long):
         Maximum number of desired classes to group pixels or segments. This
         should be set to be greater than the number of classes in your
         legend.It is possible that you will get fewer classes than what you
         specified
         for this parameter. If you need more, increase this value and
         aggregate classes after the training process is complete.
     in_additional_raster {Mosaic Layer / Raster Layer / Image Service / String}:
         Ancillary raster datasets, such as a multispectral image or a DEM,
         will be incorporated to generate attributes and other required
         information for classification. This parameter is optional.
     max_iterations {Long}:
         The maximum number of iterations the clustering process will run.The
         recommended range is between 10 and 20 iterations. Increasing this
         value will linearly increase the processing time.
     min_samples_per_cluster {Long}:
         The minimum number of pixels or segments in a valid cluster or
         class.The default value of 20 is effective in creating statistically
         significant classes. You can increase this number for more larger
         clusters and less slivers; however, it may limit the overall number of
         classes that are created.
     skip_factor {Long}:
         Number of pixels to skip for a pixel image input. If a segmented image
         is an input, specify the number of segments to skip.
     used_attributes {String}:
         Specifies the attributes that will be included in the attribute table
         associated with the output raster.COLOR-The RGB color values will be
         derived from the input raster on a
         per-segment basis. This is also known as average chromaticity
         color.MEAN-The average digital number (DN) will be derived from the
         optional
         pixel image on a per-segment basis.STD-The standard deviation will be
         derived from the optional pixel
         image on a per-segment basis.COUNT-The number of pixels composing the
         segment, on a per-segment
         basis.COMPACTNESS-The degree to which a segment is compact or
         circular, on a
         per-segment basis. The values range from 0 to 1, in which 1 is a
         circle.RECTANGULARITY-The degree to which the segment is rectangular,
         on a
         per-segment basis. The values range from 0 to 1, in which 1 is a
         rectangle. This parameter is only enabled if thekey property is
         set to
         true on the input raster. If the only input to the tool is a segmented
         image, the default attributes are COLOR, COUNT, COMPACTNESS, and
         RECTANGULARITY. If an in_additional_raster value is included as an
         input with a segmented image, MEAN and STD are also available
         attributes. Segmented
     max_merge_per_iter {Long}:
         The maximum number of cluster merges per iteration. Increasing the
         number of merges will reduce the number of classes that are created. A
         lower value will result in more classes.
     max_merge_distance {Double}:
         The maximum distance between cluster centers in feature space.
         Increasing the distance will allow more clusters to merge, resulting
         in fewer classes. A lower value will result in more classes. Values
         from 0 to 5 typically return the best results.

    OUTPUTS:
     out_classifier_definition (File):
         The output JSON format file that will contain attribute information,
         statistics, hyperplane vectors, and other information for the
         classifier. An .ecd file will be created."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_raster,
        max_classes,
        out_classifier_definition,
        in_additional_raster,
        max_iterations,
        min_samples_per_cluster,
        skip_factor,
        used_attributes,
        max_merge_per_iter,
        max_merge_distance,
    ):
        result = arcpy.gp.TrainIsoClusterClassifier_ia(
            in_raster,
            max_classes,
            out_classifier_definition,
            in_additional_raster,
            max_iterations,
            min_samples_per_cluster,
            skip_factor,
            used_attributes,
            max_merge_per_iter,
            max_merge_distance,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_raster,
        max_classes,
        out_classifier_definition,
        in_additional_raster,
        max_iterations,
        min_samples_per_cluster,
        skip_factor,
        used_attributes,
        max_merge_per_iter,
        max_merge_distance,
    )


TrainIsoClusterClassifier.__esri_toolname__ = "TrainIsoClusterClassifier_ia"
TrainIsoClusterClassifier.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
]


def TrainKNearestNeighborClassifier(
    in_raster,
    in_training_features,
    out_classifier_definition,
    in_additional_raster="#",
    kNN="#",
    max_samples_per_class="#",
    used_attributes: list[Literal["COLOR", "MEAN", "STD", "COUNT", "COMPACTNESS", "RECTANGULARITY"]]
    | Literal["COLOR", "MEAN", "STD", "COUNT", "COMPACTNESS", "RECTANGULARITY"]
    | str
    | None = "#",
    dimension_value_field="#",
):
    """TrainKNearestNeighborClassifier_ia(in_raster, in_training_features, out_classifier_definition, {in_additional_raster}, {kNN}, {max_samples_per_class}, {used_attributes;used_attributes...}, {dimension_value_field})

       Generates an Esri classifier definition file (.ecd) using the
       K-Nearest Neighbor classification method.

    INPUTS:
     in_raster (Mosaic Layer / Raster Layer / Image Service / String):
         The raster dataset to classify.The single band raster or segmented
         raster, multiband raster, or a
         multidimensional raster to be classified.
     in_training_features (Feature Layer / Raster Catalog Layer):
         The training sample file or layer that delineates the training sites.
         These can be either shapefiles or feature classes that contain
         the training samples. The following field names are required in the
         training sample file:        classname-A text field indicating the
         name of the class
         categoryclassvalue-A long integer field containing the integer value
         for each
         class category
     in_additional_raster {Mosaic Layer / Raster Layer / Image Service / String}:
         Ancillary raster datasets, such as a multispectral image or a DEM,
         will be incorporated to generate attributes and other required
         information for classification. This parameter is optional.
     kNN {Long}:
         The number of neighbors that will be used in searching for each input
         pixel or segment. Increasing the number of neighbors will decrease the
         influence of individual neighbors on the outcome of the
         classification. The default value is 1.
     max_samples_per_class {Long}:
         The maximum number of training samples that will be used for each
         class. The default value of 1000 is recommended when the inputs are
         nonsegmented rasters. A value that is less than or equal to 0 means
         that the system will use all the samples from the training sites to
         train the classifier.
     used_attributes {String}:
         Specifies the attributes that will be included in the attribute table
         associated with the output raster.COLOR-The RGB color values will be
         derived from the input raster on a
         per-segment basis. This is also known as average chromaticity
         color.MEAN-The average digital number (DN) will be derived from the
         optional
         pixel image on a per-segment basis.STD-The standard deviation will be
         derived from the optional pixel
         image on a per-segment basis.COUNT-The number of pixels composing the
         segment, on a per-segment
         basis.COMPACTNESS-The degree to which a segment is compact or
         circular, on a
         per-segment basis. The values range from 0 to 1, in which 1 is a
         circle.RECTANGULARITY-The degree to which the segment is rectangular,
         on a
         per-segment basis. The values range from 0 to 1, in which 1 is a
         rectangle. This parameter is only enabled if thekey property is
         set to
         true on the input raster. If the only input to the tool is a segmented
         image, the default attributes are COLOR, COUNT, COMPACTNESS, and
         RECTANGULARITY. If an in_additional_raster value is included as an
         input with a segmented image, MEAN and STD are also available
         attributes. Segmented
     dimension_value_field {Field}:
         Contains dimension values in the input training sample feature
         class.This parameter is required to classify a time series of raster
         data
         using the change analysis raster output from the Analyze Changes Using
         CCDC tool.

    OUTPUTS:
     out_classifier_definition (File):
         A JSON formatted .ecd file that contains attribute information,
         statistics, or other information for the classifier."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_raster,
        in_training_features,
        out_classifier_definition,
        in_additional_raster,
        kNN,
        max_samples_per_class,
        used_attributes,
        dimension_value_field,
    ):
        result = arcpy.gp.TrainKNearestNeighborClassifier_ia(
            in_raster,
            in_training_features,
            out_classifier_definition,
            in_additional_raster,
            kNN,
            max_samples_per_class,
            used_attributes,
            dimension_value_field,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_raster,
        in_training_features,
        out_classifier_definition,
        in_additional_raster,
        kNN,
        max_samples_per_class,
        used_attributes,
        dimension_value_field,
    )


TrainKNearestNeighborClassifier.__esri_toolname__ = "TrainKNearestNeighborClassifier_ia"
TrainKNearestNeighborClassifier.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
]


def TrainMaximumLikelihoodClassifier(
    in_raster,
    in_training_features,
    out_classifier_definition,
    in_additional_raster="#",
    used_attributes: list[Literal["COLOR", "MEAN", "STD", "COUNT", "COMPACTNESS", "RECTANGULARITY"]]
    | Literal["COLOR", "MEAN", "STD", "COUNT", "COMPACTNESS", "RECTANGULARITY"]
    | str
    | None = "#",
    dimension_value_field="#",
):
    """TrainMaximumLikelihoodClassifier_ia(in_raster, in_training_features, out_classifier_definition, {in_additional_raster}, {used_attributes;used_attributes...}, {dimension_value_field})

       Generates an Esri classifier definition file (.ecd) using the Maximum
       Likelihood Classifier (MLC) classification definition.

    INPUTS:
     in_raster (Mosaic Layer / Raster Layer / Image Service / String):
         The raster dataset to classify.
     in_training_features (Feature Layer / Raster Catalog Layer):
         The training sample file or layer that delineates the training sites.
         These can be either shapefiles or feature classes that contain
         the training samples. The following field names are required in the
         training sample file:        classname-A text field indicating the
         name of the class
         categoryclassvalue-A long integer field containing the integer value
         for each
         class category
     in_additional_raster {Mosaic Layer / Raster Layer / Image Service / String}:
         Incorporates ancillary raster datasets, such as a segmented image or
         DEM. This parameter is optional.
     used_attributes {String}:
         Specifies the attributes that will be included in the attribute table
         associated with the output raster.COLOR-The RGB color values will be
         derived from the input raster on a
         per-segment basis. This is also known as average chromaticity
         color.MEAN-The average digital number (DN) will be derived from the
         optional
         pixel image on a per-segment basis.STD-The standard deviation will be
         derived from the optional pixel
         image on a per-segment basis.COUNT-The number of pixels composing the
         segment, on a per-segment
         basis.COMPACTNESS-The degree to which a segment is compact or
         circular, on a
         per-segment basis. The values range from 0 to 1, in which 1 is a
         circle.RECTANGULARITY-The degree to which the segment is rectangular,
         on a
         per-segment basis. The values range from 0 to 1, in which 1 is a
         rectangle. This parameter is only enabled if thekey property is
         set to
         true on the input raster. If the only input to the tool is a segmented
         image, the default attributes are COLOR, COUNT, COMPACTNESS, and
         RECTANGULARITY. If an in_additional_raster value is included as an
         input with a segmented image, MEAN and STD are also available
         attributes. Segmented
     dimension_value_field {Field}:
         Contains dimension values in the input training sample feature
         class.This parameter is required to classify a time series of raster
         data
         using the change analysis raster output from the Analyze Changes Using
         CCDC tool.

    OUTPUTS:
     out_classifier_definition (File):
         The output JSON format file that will contain attribute information,
         statistics, hyperplane vectors, and other information for the
         classifier. An .ecd file will be created."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_raster,
        in_training_features,
        out_classifier_definition,
        in_additional_raster,
        used_attributes,
        dimension_value_field,
    ):
        result = arcpy.gp.TrainMaximumLikelihoodClassifier_ia(
            in_raster,
            in_training_features,
            out_classifier_definition,
            in_additional_raster,
            used_attributes,
            dimension_value_field,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_raster,
        in_training_features,
        out_classifier_definition,
        in_additional_raster,
        used_attributes,
        dimension_value_field,
    )


TrainMaximumLikelihoodClassifier.__esri_toolname__ = "TrainMaximumLikelihoodClassifier_ia"
TrainMaximumLikelihoodClassifier.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6"]


def TrainRandomTreesClassifier(
    in_raster,
    in_training_features,
    out_classifier_definition,
    in_additional_raster="#",
    max_num_trees="#",
    max_tree_depth="#",
    max_samples_per_class="#",
    used_attributes: list[Literal["COLOR", "MEAN", "STD", "COUNT", "COMPACTNESS", "RECTANGULARITY"]]
    | Literal["COLOR", "MEAN", "STD", "COUNT", "COMPACTNESS", "RECTANGULARITY"]
    | str
    | None = "#",
    dimension_value_field="#",
):
    """TrainRandomTreesClassifier_ia(in_raster, in_training_features, out_classifier_definition, {in_additional_raster}, {max_num_trees}, {max_tree_depth}, {max_samples_per_class}, {used_attributes;used_attributes...}, {dimension_value_field})

       Generates an Esri classifier definition file (.ecd) using the Random
       Trees classification method.

    INPUTS:
     in_raster (Mosaic Layer / Raster Layer / Image Service / String):
         The raster dataset to classify.You can use any Esri-supported raster
         dataset. One option is a 3-band,
         8-bit segmented raster dataset in which all the pixels in the same
         segment have the same color. The input can also be a single band,
         8-bit, grayscale segmented raster.
     in_training_features (Feature Layer / Raster Catalog Layer):
         The training sample file or layer that delineates the training sites.
         These can be either shapefiles or feature classes that contain
         the training samples. The following field names are required in the
         training sample file:        classname-A text field indicating the
         name of the class
         categoryclassvalue-A long integer field containing the integer value
         for each
         class category
     in_additional_raster {Mosaic Layer / Raster Layer / Image Service / String}:
         Ancillary raster datasets, such as a multispectral image or a DEM,
         will be incorporated to generate attributes and other required
         information for classification. This parameter is optional.
     max_num_trees {Long}:
         The maximum number of trees in the forest. Increasing the number of
         trees will lead to higher accuracy rates, although this improvement
         will level off eventually. The number of trees increases the
         processing time linearly.
     max_tree_depth {Long}:
         The maximum depth of each tree in the forest. Depth is another way of
         saying the number of rules each tree is allowed to create to come to a
         decision. Trees will not grow any deeper than this setting.
     max_samples_per_class {Long}:
         The maximum number of samples that will be used to define each
         class.The default value of 1000 is recommended when the inputs are
         nonsegmented rasters. A value that is less than or equal to 0 means
         that the system will use all the samples from the training sites to
         train the classifier.
     used_attributes {String}:
         Specifies the attributes that will be included in the attribute table
         associated with the output raster.COLOR-The RGB color values will be
         derived from the input raster on a
         per-segment basis. This is also known as average chromaticity
         color.MEAN-The average digital number (DN) will be derived from the
         optional
         pixel image on a per-segment basis.STD-The standard deviation will be
         derived from the optional pixel
         image on a per-segment basis.COUNT-The number of pixels composing the
         segment, on a per-segment
         basis.COMPACTNESS-The degree to which a segment is compact or
         circular, on a
         per-segment basis. The values range from 0 to 1, in which 1 is a
         circle.RECTANGULARITY-The degree to which the segment is rectangular,
         on a
         per-segment basis. The values range from 0 to 1, in which 1 is a
         rectangle. This parameter is only enabled if thekey property is
         set to
         true on the input raster. If the only input to the tool is a segmented
         image, the default attributes are COLOR, COUNT, COMPACTNESS, and
         RECTANGULARITY. If an in_additional_raster value is included as an
         input with a segmented image, MEAN and STD are also available
         attributes. Segmented
     dimension_value_field {Field}:
         Contains dimension values in the input training sample feature
         class.This parameter is required to classify a time series of raster
         data
         using the change analysis raster output from the Analyze Changes Using
         CCDC tool.

    OUTPUTS:
     out_classifier_definition (File):
         A JSON file that contains attribute information, statistics, or other
         information for the classifier. An .ecd file is created."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_raster,
        in_training_features,
        out_classifier_definition,
        in_additional_raster,
        max_num_trees,
        max_tree_depth,
        max_samples_per_class,
        used_attributes,
        dimension_value_field,
    ):
        result = arcpy.gp.TrainRandomTreesClassifier_ia(
            in_raster,
            in_training_features,
            out_classifier_definition,
            in_additional_raster,
            max_num_trees,
            max_tree_depth,
            max_samples_per_class,
            used_attributes,
            dimension_value_field,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_raster,
        in_training_features,
        out_classifier_definition,
        in_additional_raster,
        max_num_trees,
        max_tree_depth,
        max_samples_per_class,
        used_attributes,
        dimension_value_field,
    )


TrainRandomTreesClassifier.__esri_toolname__ = "TrainRandomTreesClassifier_ia"
TrainRandomTreesClassifier.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
]


def TrainRandomTreesRegressionModel(
    in_rasters,
    in_target_data,
    out_regression_definition,
    target_value_field="#",
    target_dimension_field="#",
    raster_dimension="#",
    out_importance_table="#",
    max_num_trees="#",
    max_tree_depth="#",
    max_samples="#",
    average_points_per_cell: Literal["AVERAGE_POINTS_PER_CELL", "KEEP_ALL_POINTS", "#"] | None = "#",
    percent_testing="#",
    out_scatterplots="#",
    out_sample_features="#",
):
    """TrainRandomTreesRegressionModel_ia(in_rasters;in_rasters..., in_target_data, out_regression_definition, {target_value_field}, {target_dimension_field}, {raster_dimension}, {out_importance_table}, {max_num_trees}, {max_tree_depth}, {max_samples}, {average_points_per_cell}, {percent_testing}, {out_scatterplots}, {out_sample_features})

       Models the relationship between explanatory variables (independent
       variables) and a target dataset (dependent variable).

    INPUTS:
     in_rasters (Mosaic Dataset / Mosaic Layer / Raster Dataset / Raster Layer / Image Service / String):
         The single-band, multidimensional, or multiband raster datasets, or
         mosaic datasets containing explanatory variables.
     in_target_data (Feature Class / Feature Layer / Raster Dataset / Raster Layer / Mosaic Layer / Image Service):
         The raster or point feature class containing the target variable
         (dependant variable) data.
     target_value_field {Field}:
         The field name of the information to model in the target point feature
         class or raster dataset.
     target_dimension_field {Field}:
         A date field or numeric field in the input point feature class that
         defines the dimension values.
     raster_dimension {String}:
         The dimension name of the input multidimensional raster (explanatory
         variables) that links to the dimension in the target data.
     max_num_trees {Long}:
         The maximum number of trees in the forest. Increasing the number of
         trees will lead to higher accuracy rates, although this improvement
         will level off. The number of trees increases the processing time
         linearly. The default is 50.
     max_tree_depth {Long}:
         The maximum depth of each tree in the forest. Depth determines the
         number of rules each tree can create, resulting in a decision. Trees
         will not grow any deeper than this setting. The default is 30.
     max_samples {Long}:
         The maximum number of samples that will be used for the regression
         analysis. A value that is less than or equal to 0 means that the
         system will use all the samples from the input target raster or point
         feature class to train the regression model. The default value is
         10,000.
     average_points_per_cell {Boolean}:
         Specifies whether the average will be calculated when multiple
         training points fall into one cell. This parameter is applicable only
         when the input target is a point feature class. Unchecked-All
         points will be used when multiple training points fall
         into a single cell. This is the default.Checked-The average value of
         the training points in a cell will be
         calculated.KEEP_ALL_POINTS-All points will be used when multiple
         training points
         fall into a single cell. This is the
         default.AVERAGE_POINTS_PER_CELL-The average value of the training
         points in a
         cell will be calculated.
     percent_testing {Double}:
         The percentage of test points that will be used for error checking.
         The tool checks for three types of errors: errors on training points,
         errors on test points, and errors on test location points. The default
         is 10.

    OUTPUTS:
     out_regression_definition (File):
         A JSON format file with an .ecd extension that contains attribute
         information, statistics, or other information for the classifier.
     out_importance_table {Table}:
         A table containing information describing the importance of each
         explanatory variable used in the model. A larger number indicates the
         corresponding variable is more correlated to the predicted variable
         and will contribute more in prediction. Values range between 0 and 1,
         and the sum of all the values equals 1.
     out_scatterplots {File}:
         The output scatter plots in PDF or HTML format. The output will
         include scatter plots of training data, test data, and location test
         data.
     out_sample_features {Feature Class}:
         The output feature class that will contain target values and predicted
         values for training points, test points, and location test points."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_rasters,
        in_target_data,
        out_regression_definition,
        target_value_field,
        target_dimension_field,
        raster_dimension,
        out_importance_table,
        max_num_trees,
        max_tree_depth,
        max_samples,
        average_points_per_cell,
        percent_testing,
        out_scatterplots,
        out_sample_features,
    ):
        result = arcpy.gp.TrainRandomTreesRegressionModel_ia(
            in_rasters,
            in_target_data,
            out_regression_definition,
            target_value_field,
            target_dimension_field,
            raster_dimension,
            out_importance_table,
            max_num_trees,
            max_tree_depth,
            max_samples,
            average_points_per_cell,
            percent_testing,
            out_scatterplots,
            out_sample_features,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_rasters,
        in_target_data,
        out_regression_definition,
        target_value_field,
        target_dimension_field,
        raster_dimension,
        out_importance_table,
        max_num_trees,
        max_tree_depth,
        max_samples,
        average_points_per_cell,
        percent_testing,
        out_scatterplots,
        out_sample_features,
    )


TrainRandomTreesRegressionModel.__esri_toolname__ = "TrainRandomTreesRegressionModel_ia"
TrainRandomTreesRegressionModel.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
    "::::13",
    "::::14",
]


def TrainSupportVectorMachineClassifier(
    in_raster,
    in_training_features,
    out_classifier_definition,
    in_additional_raster="#",
    max_samples_per_class="#",
    used_attributes: list[Literal["COLOR", "MEAN", "STD", "COUNT", "COMPACTNESS", "RECTANGULARITY"]]
    | Literal["COLOR", "MEAN", "STD", "COUNT", "COMPACTNESS", "RECTANGULARITY"]
    | str
    | None = "#",
    dimension_value_field="#",
):
    """TrainSupportVectorMachineClassifier_ia(in_raster, in_training_features, out_classifier_definition, {in_additional_raster}, {max_samples_per_class}, {used_attributes;used_attributes...}, {dimension_value_field})

       Generates an Esri classifier definition file (.ecd) using the Support
       Vector Machine (SVM) classification definition.

    INPUTS:
     in_raster (Mosaic Layer / Raster Layer / Image Service / String):
         The raster dataset to classify.The preferred input is a 3-band, 8-bit
         segmented raster dataset in
         which all the pixels in the same segment have the same color. The
         input can also be a 1-band, 8-bit grayscale segmented raster. If no
         segmented raster is available, you can use any Esri-supported raster
         dataset.
     in_training_features (Feature Layer / Raster Catalog Layer):
         The training sample file or layer that delineates the training sites.
         These can be either shapefiles or feature classes that contain
         the training samples. The following field names are required in the
         training sample file:        classname-A text field indicating the
         name of the class
         categoryclassvalue-A long integer field containing the integer value
         for each
         class category
     in_additional_raster {Mosaic Layer / Raster Layer / Image Service / String}:
         Ancillary raster datasets, such as a multispectral image or a DEM,
         will be incorporated to generate attributes and other required
         information for classification. This parameter is optional.
     max_samples_per_class {Long}:
         The maximum number of samples that will be used to define each
         class.The default value of 500 is recommended when the inputs are
         nonsegmented rasters. A value that is less than or equal to 0 means
         that the system will use all the samples from the training sites to
         train the classifier.
     used_attributes {String}:
         Specifies the attributes that will be included in the attribute table
         associated with the output raster.COLOR-The RGB color values will be
         derived from the input raster on a
         per-segment basis. This is also known as average chromaticity
         color.MEAN-The average digital number (DN) will be derived from the
         optional
         pixel image on a per-segment basis.STD-The standard deviation will be
         derived from the optional pixel
         image on a per-segment basis.COUNT-The number of pixels composing the
         segment, on a per-segment
         basis.COMPACTNESS-The degree to which a segment is compact or
         circular, on a
         per-segment basis. The values range from 0 to 1, in which 1 is a
         circle.RECTANGULARITY-The degree to which the segment is rectangular,
         on a
         per-segment basis. The values range from 0 to 1, in which 1 is a
         rectangle. This parameter is only enabled if thekey property is
         set to
         true on the input raster. If the only input to the tool is a segmented
         image, the default attributes are COLOR, COUNT, COMPACTNESS, and
         RECTANGULARITY. If an in_additional_raster value is included as an
         input with a segmented image, MEAN and STD are also available
         attributes. Segmented
     dimension_value_field {Field}:
         Contains dimension values in the input training sample feature
         class.This parameter is required to classify a time series of raster
         data
         using the change analysis raster output from the Analyze Changes Using
         CCDC tool.

    OUTPUTS:
     out_classifier_definition (File):
         The output JSON format file that will contain attribute information,
         statistics, hyperplane vectors, and other information for the
         classifier. An .ecd file will be created."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_raster,
        in_training_features,
        out_classifier_definition,
        in_additional_raster,
        max_samples_per_class,
        used_attributes,
        dimension_value_field,
    ):
        result = arcpy.gp.TrainSupportVectorMachineClassifier_ia(
            in_raster,
            in_training_features,
            out_classifier_definition,
            in_additional_raster,
            max_samples_per_class,
            used_attributes,
            dimension_value_field,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_raster,
        in_training_features,
        out_classifier_definition,
        in_additional_raster,
        max_samples_per_class,
        used_attributes,
        dimension_value_field,
    )


TrainSupportVectorMachineClassifier.__esri_toolname__ = "TrainSupportVectorMachineClassifier_ia"
TrainSupportVectorMachineClassifier.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6", "::::7"]


def TrainUsingAutoDL(
    in_data,
    out_model,
    pretrained_model="#",
    total_time_limit="#",
    autodl_mode: Literal["BASIC", "ADVANCED", "#"] | None = "#",
    networks="#",
    save_evaluated_models: Literal["SAVE_ALL_MODELS", "SAVE_BEST_MODEL", "#"] | None = "#",
):
    """TrainUsingAutoDL_ia(in_data, out_model, {pretrained_model}, {total_time_limit}, {autodl_mode}, {networks;networks...}, {save_evaluated_models})

       Trains a deep learning model by building training pipelines and
       automating much of the training process. This includes data
       augmentation, model selection, hyperparameter tuning, and batch size
       deduction. Its outputs include performance metrics of the best model
       on the training data, as well as the trained deep learning model
       package (.dlpk file) that can be used as input for the Extract
       Features Using AI Models tool to predict on new imagery.

    INPUTS:
     in_data (Folder):
         The folders containing the image chips, labels, and statistics
         required to train the model. This is the output from the Export
         Training Data For Deep Learning tool. The metadata format of the
         exported data must be Classified_Tiles, PASCAL_VOC_rectangles, or
         KITTI_rectangles.
     pretrained_model {File}:
         A pretrained model that will be used to fine-tune the new model. The
         input is an Esri model definition file (.emd) or a deep learning
         package file (.dlpk).A pretrained model with similar classes can be
         fine-tuned to fit the
         new model. The pretrained model must have been trained with the same
         model type and backbone model that will be used to train the new
         model.
     total_time_limit {Double}:
         The total time limit in hours it will take for AutoDL model training.
         The default is 2 hours.
     autodl_mode {String}:
         Specifies the AutoDL mode that will be used and how intensive the
         AutoDL search will be.BASIC-The basic mode will be used. This mode is
         used to train all
         selected networks without hyperparameter tuning.ADVANCED-The advanced
         mode will be used. This mode is used to perform
         hyperparameter tuning on the top two performing models.
     networks {String}:
         Specifies the architectures that will be used to train the
         model.SingleShotDetector-The SingleShotDetector architecture will be
         used to
         train the model. SingleShotDetector is used for object
         detection.RetinaNet-The RetinaNet architecture will be used to train
         the model.
         RetinaNet is used for object detection.FasterRCNN-The FasterRCNN
         architecture will be used to train the
         model. FasterRCNN is used for object detection.YOLOv3-The YOLOv3
         architecture will be used to train the model. YOLOv3
         is used for object detection.HRNet-The HRNet architecture will be used
         to train the model. HRNet is
         used for pixel classification.ATSS-The ATSS architecture will be used
         to train the model. ATSS is
         used for object detection.CARAFE-The CARAFE architecture will be used
         to train the model. CARAFE
         is used for object detection.CascadeRCNN-The CascadeRCNN architecture
         will be used to train the
         model. CascadeRCNN is used for object detection.CascadeRPN-The
         CascadeRPN architecture will be used to train the
         model. CascadeRPN is used for object detection.DCN-The DCN
         architecture will be used to train the model. DCN is used
         for object detection.DeepLab-The DeepLab architecture will be used to
         train the model.
         DeepLab is used for pixel classification.UnetClassifier-The
         UnetClassifier architecture will be used to train
         the model. UnetClassifier is used for pixel
         classification.DeepLabV3Plus-The DeepLabV3Plus architecture will be
         used to train the
         model. DeepLabV3Plus is used for pixel
         classification.PSPNetClassifier-The PSPNetClassifier architecture will
         be used to
         train the model. PSPNetClassifier is used for pixel
         classification.ANN-The ANN architecture will be used to train the
         model. ANN is used
         for pixel classification.APCNet-The APCNet architecture will be used
         to train the model. APCNet
         is used for pixel classification.CCNet-The CCNet architecture will be
         used to train the model. CCNet is
         used for pixel classification.CGNet-The CGNet architecture will be
         used to train the model. CGNet is
         used for pixel classification.DETReg-The DETReg architecture will be
         used to train the model. DETReg
         is used for object detection.DynamicRCNN-The DynamicRCNN architecture
         will be used to train the
         model. DynamicRCNN is used for object detection.EmpiricalAttention-The
         EmpiricalAttention architecture will be used to
         train the model. EmpiricalAttention is used for object
         detection.FCOS-The FCOS architecture will be used to train the model.
         FCOS is
         used for object detection.FoveaBox-The FoveaBox architecture will be
         used to train the model.
         FoveaBox is used for object detection.FSAF-The FSAF architecture will
         be used to train the model. FSAF is
         used for object detection.GHM-The GHM architecture will be used to
         train the model. GHM is used
         for object detection.LibraRCNN-The LibraRCNN architecture will be used
         to train the model.
         LibraRCNN is used for object detection.PaFPN-The PaFPN architecture
         will be used to train the model. PaFPN is
         used for object detection.Res2Net-The Res2Net architecture will be
         used to train the model.
         Res2Net is used for object detection.SABL-The SABL architecture will
         be used to train the model. SABL is
         used for object detection.VFNet-The VFNet architecture will be used to
         train the model. VFNet is
         used for object detection.DMNet-The DMNet architecture will be used to
         train the model. DMNet is
         used for pixel classification.DNLNet-The DNLNet architecture will be
         used to train the model. DNLNet
         is used for pixel classification.FastSCNN-The FastSCNN architecture
         will be used to train the model.
         FastSCNN is used for pixel classification.FCN-The FCN architecture
         will be used to train the model. FCN is used
         for pixel classification.GCNet-The GCNet architecture will be used to
         train the model. GCNet is
         used for pixel classification.MobileNetV2-The MobileNetV2 architecture
         will be used to train the
         model. MobileNetV2 is used for pixel classification.NonLocalNet-The
         NonLocalNet architecture will be used to train the
         model. NonLocalNet is used for pixel classification.OCRNet-The OCRNet
         architecture will be used to train the model. OCRNet
         is used for pixel classification.PSANet-The PSANet architecture will
         be used to train the model. PSANet
         is used for pixel classification.SemFPN-The SemFPN architecture will
         be used to train the model. SemFPN
         is used for pixel classification.UperNet-The UperNet architecture will
         be used to train the model.
         UperNet is used for pixel classification.MaskRCNN-The MaskRCNN
         architecture will be used to train the model.
         MaskRCNN is used for object detection.By default, all the networks
         will be used.
     save_evaluated_models {Boolean}:
         Specifies whether all evaluated models will be saved.SAVE_ALL_MODELS-
         All evaluated models will be
         saved.SAVE_BEST_MODEL-Only the best performing model will be saved.
         This is
         the default.

    OUTPUTS:
     out_model (File):
         The output trained model that will be saved as a deep learning package
         (.dlpk file)."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_data, out_model, pretrained_model, total_time_limit, autodl_mode, networks, save_evaluated_models):
        result = arcpy.gp.TrainUsingAutoDL_ia(
            in_data, out_model, pretrained_model, total_time_limit, autodl_mode, networks, save_evaluated_models
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_data, out_model, pretrained_model, total_time_limit, autodl_mode, networks, save_evaluated_models)


TrainUsingAutoDL.__esri_toolname__ = "TrainUsingAutoDL_ia"
TrainUsingAutoDL.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6", "::::7"]


def UpdateAccuracyAssessmentPoints(
    in_class_data,
    in_points,
    out_points,
    target_field: Literal["CLASSIFIED", "GROUND_TRUTH", "#"] | None = "#",
    polygon_dimension_field="#",
    point_dimension_field="#",
):
    """UpdateAccuracyAssessmentPoints_ia(in_class_data, in_points, out_points, {target_field}, {polygon_dimension_field}, {point_dimension_field})

       Updates the Target field in the attribute table to compare reference
       points to the classified image.

    INPUTS:
     in_class_data (Mosaic Layer / Raster Layer / Feature Layer):
         The input classification image or other thematic GIS reference data.
         The input can be a raster or feature class.Typical data is a
         classification image of a single band, integer data
         type.If using polygons as input, only use those that are not used as
         training samples. You can also use land-cover data in shapefile or
         feature class format.
     in_points (Feature Layer):
         The point feature class providing the accuracy assessment points to be
         updated.All points from this input will be copied to the updated
         output
         feature class, and the target_field parameter value will be updated
         from the input raster or feature class data.
     target_field {String}:
         Specifies whether the input data is a classified image or ground truth
         data.CLASSIFIED-The input is a classified image. This is the
         default.GROUND_TRUTH-The input is reference data.
     polygon_dimension_field {Field}:
         The dimension field for the in_points parameter value. The assessment
         points will be updated based on the matching dimension values with
         this field.
     point_dimension_field {Field}:
         The dimension field in the in_points parameter value. Input data with
         identical dimension values will be used to update corresponding
         points. When the in_class_data parameter value is a
         multidimensional
         raster, rasters with dimension values that match the dimension field
         in the test points will be used in updating. The multidimensional
         raster is expected to have one time dimension (field). Otherwise, the
         first dimension will be used to match the dimension field of the test
         points. StdTime

    OUTPUTS:
     out_points (Feature Class):
         The output point feature class that contains the updated random point
         field for accuracy assessment purposes."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_class_data, in_points, out_points, target_field, polygon_dimension_field, point_dimension_field):
        result = arcpy.gp.UpdateAccuracyAssessmentPoints_ia(
            in_class_data, in_points, out_points, target_field, polygon_dimension_field, point_dimension_field
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_class_data, in_points, out_points, target_field, polygon_dimension_field, point_dimension_field)


UpdateAccuracyAssessmentPoints.__esri_toolname__ = "UpdateAccuracyAssessmentPoints_ia"
UpdateAccuracyAssessmentPoints.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6"]


def VideoMetadataToFeatureClass(
    in_video,
    csv_file="#",
    flightpath="#",
    flightpath_type: Literal["POINT", "POLYLINE", "#"] | None = "#",
    imagepath="#",
    imagepath_type: Literal["POINT", "POLYLINE", "#"] | None = "#",
    footprint="#",
    start_time="#",
    stop_time="#",
    min_distance="#",
    min_time="#",
    vmti="#",
):
    """VideoMetadataToFeatureClass_ia(in_video, {csv_file}, {flightpath}, {flightpath_type}, {imagepath}, {imagepath_type}, {footprint}, {start_time}, {stop_time}, {min_distance}, {min_time}, {vmti})

       Extracts the platform, frame center, frame outline, and attributes
       metadata from an FMV-compliant video. The output geometry and
       attributes are saved as feature classes.

    INPUTS:
     in_video (File):
         The FMV-compliant input video file containing essential metadata for
         each frame of the video data. The supported video file types are PS,
         TS, MPG, MPEG, MP2, MPG2, MPEG2, MP4, MPG4, MPEG4, H264, H265, VOB,
         and M2TS.
     flightpath_type {String}:
         Specifies the feature class type that will be used for the flight
         path.POINT-A point feature class will be used.POLYLINE-A polyline
         feature
         class will be used. This is the default.
     imagepath_type {String}:
         Specifies the feature class type that will be used for the image path.
         If you're using a point output, the center of each video frame image
         will appear on the map.POINT-A point feature class will be
         used.POLYLINE-A polyline feature
         class will be used. This is the default.
     start_time {Time Unit / Date}:
         The metadata recording start time from the beginning of the video. The
         input format is d.hh:mm:ss, and the default start time is 0.00:00:00.
         Metadata time stamps are not used in this field; the time of the video
         file is used.
     stop_time {Time Unit / Date}:
         The metadata recording end time. The input format is d.hh:mm:ss. If
         not set, the value will default to the end of the video. Metadata time
         stamps are not used in this field.
     min_distance {Linear Unit}:
         The distance between the features in sequential video frames. If left
         blank, every metadata feature will be extracted and added to the
         feature class.
     min_time {Time Unit}:
         The time interval between the features in sequential video frames. If
         left blank, every metadata feature will be extracted and added to the
         feature class.

    OUTPUTS:
     csv_file {File}:
         An output .csv or .json file containing metadata about the video
         frames for specific times.The metadata file is in the same format used
         by the Video Multiplexer
         tool.
     flightpath {Feature Class}:
         The feature class containing the sensor's flight path information.
     imagepath {Feature Class}:
         The output feature class containing the image path information.
     footprint {Feature Class}:
         The output feature class containing the video image footprint
         information.
     vmti {Feature Dataset}:
         The output feature class containing the video VMTI information."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_video,
        csv_file,
        flightpath,
        flightpath_type,
        imagepath,
        imagepath_type,
        footprint,
        start_time,
        stop_time,
        min_distance,
        min_time,
        vmti,
    ):
        result = arcpy.gp.VideoMetadataToFeatureClass_ia(
            in_video,
            csv_file,
            flightpath,
            flightpath_type,
            imagepath,
            imagepath_type,
            footprint,
            start_time,
            stop_time,
            min_distance,
            min_time,
            vmti,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_video,
        csv_file,
        flightpath,
        flightpath_type,
        imagepath,
        imagepath_type,
        footprint,
        start_time,
        stop_time,
        min_distance,
        min_time,
        vmti,
    )


VideoMetadataToFeatureClass.__esri_toolname__ = "VideoMetadataToFeatureClass_ia"
VideoMetadataToFeatureClass.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
]


def VideoMultiplexer(
    in_video_file,
    metadata_file,
    out_video_file,
    metadata_mapping_file="#",
    timeshift_file="#",
    elevation_layer="#",
    input_coordinate_system="#",
):
    """VideoMultiplexer_ia(in_video_file, metadata_file, out_video_file, {metadata_mapping_file}, {timeshift_file}, {elevation_layer}, {input_coordinate_system})

       Creates a single full-motion video (FMV)-compliant video file that
       combines an archived video stream file and a separate associated
       metadata file synchronized by a time stamp. The process of combining
       the two files containing the video and metadata files is called
       multiplexing.

    INPUTS:
     in_video_file (File):
         The input video file that will be converted to a FMV-compliant video
         file.The following file types are supported: .avi, .csv, .gpx, .h264,
         .h265, .json, .mp2, .mp4, .m2ts, .mpeg, .mpeg2, .mpeg4, .mpg, .mpg2,
         .mpg4, .ps, .ts, and .vob.
     metadata_file (File):
         A .csv, .json, or .gpx file containing metadata about the video frames
         for specific times.Each column in the metadata file represents one
         metadata field, and
         one of the columns must be a time reference. The time reference is
         UNIX time stamp (seconds past 1970) multiplied by one million, which
         is stored as an integer. The time is stored this way so that any
         instant in time (down to one millionth of a second) can be referenced
         with an integer. Consequently, a time difference between two entries
         of 500,000 represents one half of a second in elapsed time.The first
         row contains the field names for the metadata columns. These
         field names can be matched to their corresponding field names using
         the FMV_Multiplexer_Field_Mapping_Template.csv file in C:\\Program
         Files\\ArcGIS\\Pro\\Resources\\FullMotionVideo if needed. Each subsequent
         row contains the metadata values for the time indicated in the time
         field.
     metadata_mapping_file {File}:
         A .csv file that contains 5 columns and 87 rows and is based on the
         FMV_Multiplexer_Field_Mapping_Template.csv template file obtained from
         C:\\Program Files\\ArcGIS\\Pro\\Resources\\FullMotionVideo.Each row
         represents one of the standard MISB metadata tags, such as
         sensor latitude. The first two columns contain the MISB index and MISB
         tag name. The third column contains the field name as it appears in
         the in_metadata_file parameter if present. When the third column is
         populated, the tool can match the metadata field names to the proper
         FMV metadata tags. The fourth and fifth columns represent the units
         and notes associated with the tag, respectively.
     timeshift_file {File}:
         A file containing defined time shift intervals.Ideally, the video
         images and the metadata are synchronized in time.
         In this case, the image footprint in FMV surrounds features that can
         be seen in the video image. Sometimes there is a mismatch between the
         timing of the video and the timing in the metadata. This leads to an
         apparent time delay between when a ground feature is surrounded by the
         image footprint and when that ground feature is visible in the video
         image. If this time shift is observable and consistent, the
         multiplexer can adjust the timing of the metadata to match the video.
         If there is a mismatch between the timing of the video and
         metadata, specify the time shift in the
         FMV_Multiplexer_TimeShift_Template.csv template in C:\\Program
         Files\\ArcGIS\\Pro\\Resources\\FullMotionVideo. The time shift
         observations file is a .csv file containing two columns (and) and one
         or more data rows. A row for column names is optional. elapsed
         timetime shiftFor example, if the video image has a five-second lag
         for the entire
         time, the time shift observation file will have one line: 0:00, -5.
         The entire video is shifted five seconds.If there is a five-second lag
         at the 0:18 mark of the video, and a
         nine-second lag at the 2:21 mark of the video, the time shift
         observation file will have the following two lines:0:18, -5 2:21, -9In
         this case, the video is shifted differently at the beginning of the
         video and at the end of the video.You can define any number of time
         shift intervals in the time shift
         observation file.
     elevation_layer {Raster Layer / Image Service / Linear Unit}:
         The source of the elevation needed for calculating the video frame
         corner coordinates. The source can be a layer, image service, or an
         average ground elevation or ocean depth. The average elevation value
         must include the units of measurement such as meters or feet or other
         measure of length.The accuracy of the video footprint and frame center
         depend on the
         accuracy of the DEM data source provided. It is recommended that you
         provide a DEM layer or image service. If you do not have access to DEM
         data, you can provide an average elevation and unit relative to sea
         level, such as 15 feet or 10 meters. In the case of a submersible, you
         can enter -15 feet or -10 meters, for example. Using an average
         elevation or ocean depth is not as accurate as providing a DEM or
         bathymetric data. To calculate frame corner coordinates, the
         average elevation
         value must always be less than the sensor's altitude or depth as
         recorded in the metadata. For example, if the video was filmed at a
         sensor altitude of 10 meters and higher, a valid average elevation
         could be 9 meters or less. If a video was filmed underwater at a depth
         of -10 meters and deeper, the valid average elevation (relative to sea
         level) could be -11 or deeper. If thevalue is less than the average
         elevation value, the four corner coordinates will not be calculated
         for that record. If you do not know the average elevation of the
         project area, use a DEM. Sensor Altitude
     input_coordinate_system {Coordinate System}:
         The coordinate system that will be used for the metadata_file
         parameter value.

    OUTPUTS:
     out_video_file (File):
         The name of the output video file, including the file extension.The
         supported output video file is a .ts file."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_video_file,
        metadata_file,
        out_video_file,
        metadata_mapping_file,
        timeshift_file,
        elevation_layer,
        input_coordinate_system,
    ):
        result = arcpy.gp.VideoMultiplexer_ia(
            in_video_file,
            metadata_file,
            out_video_file,
            metadata_mapping_file,
            timeshift_file,
            elevation_layer,
            input_coordinate_system,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_video_file,
        metadata_file,
        out_video_file,
        metadata_mapping_file,
        timeshift_file,
        elevation_layer,
        input_coordinate_system,
    )


VideoMultiplexer.__esri_toolname__ = "VideoMultiplexer_ia"
VideoMultiplexer.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6", "::::7"]


def WeightedSum(in_weighted_sum_table) -> Raster:
    """WeightedSum_ia(in_weighted_sum_table)

       Overlays several rasters, multiplying each by their given weight and
       summing them together.

    INPUTS:
     in_weighted_sum_table (Weighted Sum):
         The Weighted Sum tool overlays several rasters, multiplying each by
         their given weight and summing them together.An Overlay class is used
         to define the table. The WSTable object is
         used to specify a Python list of input rasters and weight them
         accordingly. The form of the object is:
         WSTable(weightedSumTable)

    OUTPUTS:
     out_raster (Raster Dataset):
         The output weighted raster.It will be of floating-point type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_weighted_sum_table):
        in_weighted_sum_table = Utils.compoundParameterToString(in_weighted_sum_table, ParameterClasses.WSTable)
        # parse out raster names to use as local function arguments
        import re as _re  # Use underscore to avoid polluting user's namespace

        # Construct a regular expression to parse the string version of a single weighted sum table entry
        # for example: "'landuse.tif' VALUE 0.34"
        pattern = _re.compile(
            pattern=r"""
            ^                   # beginning of string
            \s*                 # any amount of white space
            (?P<raster>.*\S)    # 1. raster name
            \s+                 # at least one white space
            (?P<field>\S+)      # 2. raster field name
            \s+                 # at least one white space
            (?P<weight>\S+)     # 3. raster weight value
            \s*                 # any amount of white space
            $                   # end of string
        """,
            flags=_re.VERBOSE,
        )
        rasters = [
            "WeightedSum",
        ]  # local functions take a list of op name followed by rasters
        fields = []
        weights = []
        for item in in_weighted_sum_table.split(";"):
            item = item.strip()
            if len(item) < 1:
                continue
            m = pattern.match(item)
            raster_name = m.group("raster")
            raster_field = m.group("field")
            weight = float(m.group("weight"))
            raster_name = raster_name.strip("\"'")  # remove surrounding quotation marks
            rasters.append(raster_name)
            fields.append(raster_field)
            weights.append(weight)
        return _wrapLocalFunctionRaster(
            "WeightedSum_sa",
            rasters,
            {"fields": fields, "weights": weights, "flattenBands": True},
        )

    return Wrapper(in_weighted_sum_table)


WeightedSum.__esri_toolname__ = "WeightedSum_ia"
WeightedSum.__esri_toolinfo__ = ["Python::WSTable::"]


def ZonalStatistics(
    in_zone_data,
    zone_field,
    in_value_raster,
    statistics_type: Literal[
        "MEAN",
        "MAJORITY",
        "MAJORITY_COUNT",
        "MAJORITY_PERCENT",
        "MAXIMUM",
        "MEDIAN",
        "MINIMUM",
        "MINORITY",
        "MINORITY_COUNT",
        "MINORITY_PERCENT",
        "PERCENTILE",
        "RANGE",
        "STD",
        "SUM",
        "VARIETY",
        "#",
    ]
    | None = "#",
    ignore_nodata: Literal["DATA", "NODATA", "#"] | None = "#",
    process_as_multidimensional: Literal["CURRENT_SLICE", "ALL_SLICES", "#"] | None = "#",
    percentile_value="#",
    percentile_interpolation_type: Literal["AUTO_DETECT", "NEAREST", "LINEAR", "#"] | None = "#",
    circular_calculation: Literal["ARITHMETIC", "CIRCULAR", "#"] | None = "#",
    circular_wrap_value="#",
) -> Raster:
    """ZonalStatistics_ia(in_zone_data, zone_field, in_value_raster, {statistics_type}, {ignore_nodata}, {process_as_multidimensional}, {percentile_value}, {percentile_interpolation_type}, {circular_calculation}, {circular_wrap_value})

       Summarizes the values of a raster within the zones of another dataset.

    INPUTS:
     in_zone_data (Composite Geodataset):
         The dataset that defines the zones.The zones can be defined by an
         integer raster or a feature layer.
     zone_field (Field):
         The field that contains the values that define each zone.It can be an
         integer or a string field of the zone dataset.
     in_value_raster (Composite Geodataset):
         The raster that contains the values for which a statistic will be
         calculated.
     statistics_type {String}:
         Specifies the statistic type to be calculated. MEAN-The
         average of all cells in the value raster that belong
         to the same zone as the output cell will be calculated. This
         is the default.MAJORITY-The value that occurs most often for all cells
         in the value
         raster that belong to the same zone as the output cell will be
         calculated.MAJORITY_COUNT-The frequency of all cells that contain the
         majority
         value in the value raster that belong to the same zone as the output
         cell will be calculated.MAJORITY_PERCENT-The percentage of cells that
         contain the majority
         value in the value raster that belong to the same zone as the output
         cell will be calculated.MAXIMUM-The largest value of all cells in the
         value raster that belong
         to the same zone as the output cell will be calculated.MEDIAN-The
         median value of all cells in the value raster that belong
         to the same zone as the output cell will be calculated.MINIMUM-The
         smallest value of all cells in the value raster that
         belong to the same zone as the output cell will be
         calculated.MINORITY-The value that occurs least often for all cells in
         the value
         raster that belong to the same zone as the output cell will be
         calculated.MINORITY_COUNT-The frequency of all cells that contain the
         minority
         value in the value raster that belong to the same zone as the output
         cell will be calculated.MINORITY_PERCENT-The percentage of cells that
         contain the minority
         value in the value raster that belong to the same zone as the output
         cell will be calculated. PERCENTILE-The percentile of all
         cells in the value raster
         that belong to the same zone as the output cell will be calculated.
         The 90th percentile is calculated by default. You can specify other
         values (from 0 to 100) using theparameter. Percentile
         ValueRANGE-The difference between the largest and smallest value of
         all
         cells in the value raster that belong to the same zone as the output
         cell will be calculated.STD-The standard deviation of all cells in the
         value raster that
         belong to the same zone as the output cell will be calculated.SUM-The
         total value of all cells in the value raster that belong to
         the same zone as the output cell will be calculated.VARIETY-The number
         of unique values for all cells in the value raster
         that belong to the same zone as the output cell will be calculated.
     ignore_nodata {Boolean}:
         Specifies whether NoData values in the value input will be ignored in
         the results of the zone that they fall within.DATA-Within any
         particular zone, only cells that have a value in the
         input value raster will be used in determining the output value for
         that zone. NoData cells in the value raster will be ignored in the
         statistic calculation. This is the default.NODATA-Within any
         particular zone, if NoData cells exist in the value
         raster, they will not be ignored and their existence indicates that
         there is insufficient information to perform statistical calculations
         for all the cells in that zone. Consequently, the entire zone will
         receive the NoData value on the output raster.
     process_as_multidimensional {Boolean}:
         Specifies how the input rasters will be calculated if they are
         multidimensional.CURRENT_SLICE-Statistics will be calculated from the
         current slice of
         the input multidimensional dataset. This is the
         default.ALL_SLICES-Statistics will be calculated for all dimensions of
         the
         input multidimensional dataset.
     percentile_value {Double}:
         The percentile that will be calculated. The default is 90, indicating
         the 90th percentile.The values can range from 0 to 100. The 0th
         percentile is essentially
         equivalent to the minimum statistic, and the 100th percentile is
         equivalent to maximum. A value of 50 will produce essentially the same
         result as the median statistic.This parameter is only supported if the
         statistics_type parameter is
         set to PERCENTILE.
     percentile_interpolation_type {String}:
         Specifies the method of interpolation that will be used when the
         percentile value falls between two cell values from the input value
         raster.AUTO_DETECT-If the input value raster is of integer pixel type,
         the
         NEAREST method will be used. If the input value raster is of floating
         point pixel type, the LINEAR method will be used. This is the
         default.NEAREST-The nearest available value to the desired percentile
         is used.
         In this case, the output pixel type is the same as that of the input
         value raster.LINEAR-The weighted average of the two surrounding values
         from the
         desired percentile is used. In this case, the output pixel type is
         floating point.
     circular_calculation {Boolean}:
         Specifies how the input raster will be processed for circular
         data.ARITHMETIC-Ordinary linear statistics will be calculated. This is
         the
         default.CIRCULAR-The statistics for angles or other cyclic quantities,
         such as
         compass direction in degrees, daytimes, and fractional parts of real
         numbers, will be calculated.
     circular_wrap_value {Double}:
         The value that will be used to round a linear value to the range of a
         given circular statistic. Its value must be a positive integer or a
         floating-point value. The default value is 360 degrees.This parameter
         is only supported if the  circular_calculation
         parameter is set to CIRCULAR.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output zonal statistics raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_zone_data,
        zone_field,
        in_value_raster,
        statistics_type,
        ignore_nodata,
        process_as_multidimensional,
        percentile_value,
        percentile_interpolation_type,
        circular_calculation,
        circular_wrap_value,
    ):
        out_raster = "#"
        result = arcpy.gp.ZonalStatistics_ia(
            in_zone_data,
            zone_field,
            in_value_raster,
            out_raster,
            statistics_type,
            ignore_nodata,
            process_as_multidimensional,
            percentile_value,
            percentile_interpolation_type,
            circular_calculation,
            circular_wrap_value,
        )
        return _wrapToolRaster("ZonalStatistics_sa", str(result.getOutput(0)))

    return Wrapper(
        in_zone_data,
        zone_field,
        in_value_raster,
        statistics_type,
        ignore_nodata,
        process_as_multidimensional,
        percentile_value,
        percentile_interpolation_type,
        circular_calculation,
        circular_wrap_value,
    )


ZonalStatistics.__esri_toolname__ = "ZonalStatistics_ia"
ZonalStatistics.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
]


def ZonalStatisticsAsTable(
    in_zone_data,
    zone_field,
    in_value_raster,
    out_table,
    ignore_nodata: Literal["DATA", "NODATA", "#"] | None = "#",
    statistics_type: Literal[
        "ALL",
        "MEAN",
        "MAJORITY",
        "MAJORITY_COUNT",
        "MAJORITY_PERCENT",
        "MAXIMUM",
        "MEDIAN",
        "MINIMUM",
        "MINORITY",
        "MINORITY_COUNT",
        "MINORITY_PERCENT",
        "PERCENTILE",
        "RANGE",
        "STD",
        "SUM",
        "VARIETY",
        "MIN_MAX",
        "MEAN_STD",
        "MIN_MAX_MEAN",
        "MAJORITY_VALUE_COUNT_PERCENT",
        "MINORITY_VALUE_COUNT_PERCENT",
        "#",
    ]
    | None = "#",
    process_as_multidimensional: Literal["CURRENT_SLICE", "ALL_SLICES", "#"] | None = "#",
    percentile_values="#",
    percentile_interpolation_type: Literal["AUTO_DETECT", "NEAREST", "LINEAR", "#"] | None = "#",
    circular_calculation: Literal["ARITHMETIC", "CIRCULAR", "#"] | None = "#",
    circular_wrap_value="#",
    out_join_layer="#",
):
    """ZonalStatisticsAsTable_ia(in_zone_data, zone_field, in_value_raster, out_table, {ignore_nodata}, {statistics_type}, {process_as_multidimensional}, {percentile_values;percentile_values...}, {percentile_interpolation_type}, {circular_calculation}, {circular_wrap_value}, {out_join_layer})

       Summarizes the values of a raster within the zones of another dataset
       and reports the results as a table.

    INPUTS:
     in_zone_data (Composite Geodataset):
         The dataset that defines the zones.The zones can be defined by an
         integer raster or a feature layer.
     zone_field (Field):
         The field that contains the values that define each zone.It can be an
         integer or a string field of the zone dataset.
     in_value_raster (Composite Geodataset):
         The raster that contains the values for which a statistic will be
         calculated.
     ignore_nodata {Boolean}:
         Specifies whether NoData values in the value input will be ignored in
         the results of the zone that they fall within.DATA-Within any
         particular zone, only cells that have a value in the
         input value raster will be used in determining the output value for
         that zone. NoData cells in the value raster will be ignored in the
         statistic calculation. This is the default.NODATA-Within any
         particular zone, if NoData cells exist in the value
         raster, they will not be ignored and their existence indicates that
         there is insufficient information to perform statistical calculations
         for all the cells in that zone. Consequently, the entire zone will
         receive the NoData value on the output raster.
     statistics_type {String}:
         Specifies the statistic type to be calculated.ALL-All of the
         statistics will be calculated. This is the
         default.MEAN-The average of all cells in the value raster that belong
         to the
         same zone as the output cell will be calculated.MAJORITY-The value
         that occurs most often for all cells in the value
         raster that belong to the same zone as the output cell will be
         calculated.MAJORITY_COUNT-The frequency of all cells that contain the
         majority
         value in the value raster that belong to the same zone as the output
         cell will be calculated.MAJORITY_PERCENT-The percentage of cells that
         contain the majority
         value in the value raster that belong to the same zone as the output
         cell will be calculated.MAXIMUM-The largest value of all cells in the
         value raster that belong
         to the same zone as the output cell will be calculated.MEDIAN-The
         median value of all cells in the value raster that belong
         to the same zone as the output cell will be calculated.MINIMUM-The
         smallest value of all cells in the value raster that
         belong to the same zone as the output cell will be
         calculated.MINORITY-The value that occurs least often for all cells in
         the value
         raster that belong to the same zone as the output cell will be
         calculated.MINORITY_COUNT-The frequency of all cells that contain the
         minority
         value in the value raster that belong to the same zone as the output
         cell will be calculated.MINORITY_PERCENT-The percentage of cells that
         contain the minority
         value in the value raster that belong to the same zone as the output
         cell will be calculated.PERCENTILE-The percentile of all cells in the
         value raster that belong
         to the same zone as the output cell will be calculated. The 90th
         percentile is calculated by default. You can specify other values
         (from 0 to 100) using the percentile_values parameter.RANGE-The
         difference between the largest and smallest value of all
         cells in the value raster that belong to the same zone as the output
         cell will be calculated.STD-The standard deviation of all cells in the
         value raster that
         belong to the same zone as the output cell will be calculated.SUM-The
         total value of all cells in the value raster that belong to
         the same zone as the output cell will be calculated.VARIETY-The number
         of unique values for all cells in the value raster
         that belong to the same zone as the output cell will be
         calculated.MIN_MAX-Both the minimum and maximum statistics will be
         calculated.MEAN_STD-Both the mean and standard deviation statistics
         will be
         calculated.MIN_MAX_MEAN-The minimum, maximum, and mean statistics will
         be
         calculated.MAJORITY_VALUE_COUNT_PERCENT-The majority value, count, and
         percentage
         statistics will be calculated.MINORITY_VALUE_COUNT_PERCENT-The
         minority value, count, and percentage
         statistics will be calculated.
     process_as_multidimensional {Boolean}:
         Specifies how the input rasters will be calculated if they are
         multidimensional.CURRENT_SLICE-Statistics will be calculated from the
         current slice of
         the input multidimensional dataset. This is the
         default.ALL_SLICES-Statistics will be calculated for all dimensions of
         the
         input multidimensional dataset.
     percentile_values {Double}:
         The percentile that will be calculated. The default is 90, indicating
         the 90th percentile.The values can range from 0 to 100. The 0th
         percentile is essentially
         equivalent to the minimum statistic, and the 100th percentile is
         equivalent to maximum. A value of 50 will produce essentially the same
         result as the median statistic.This parameter is only supported if the
         statistics_type parameter is
         set to PERCENTILE or ALL.
     percentile_interpolation_type {String}:
         Specifies the method of interpolation that will be used when the
         percentile value falls between two cell values from the input value
         raster.AUTO_DETECT-If the input value raster is of integer pixel type,
         the
         NEAREST method will be used. If the input value raster is of floating
         point pixel type, the LINEAR method will be used. This is the
         default.NEAREST-The nearest available value to the desired percentile
         is used.LINEAR-The weighted average of the two surrounding values from
         the
         desired percentile is used.
     circular_calculation {Boolean}:
         Specifies how the input raster will be processed for circular
         data.ARITHMETIC-Ordinary linear statistics will be calculated. This is
         the
         default.CIRCULAR-The statistics for angles or other cyclic quantities,
         such as
         compass direction in degrees, daytimes, and fractional parts of real
         numbers, will be calculated.
     circular_wrap_value {Double}:
         The value that will be used to round a linear value to the range of a
         given circular statistic. Its value must be a positive integer or a
         floating-point value. The default value is 360 degrees.This parameter
         is only supported if the  circular_calculation
         parameter is set to CIRCULAR.

    OUTPUTS:
     out_table (Table):
         The output table that will contain the summary of the values in each
         zone.The format of the table is determined by the output location and
         path.
         By default, the output will be a geodatabase table if in a geodatabase
         workspace, and a dBASE table if in a file workspace.
     out_join_layer {Layer}:
         The output layer that will be created by joining the output table to
         the input zone data."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_zone_data,
        zone_field,
        in_value_raster,
        out_table,
        ignore_nodata,
        statistics_type,
        process_as_multidimensional,
        percentile_values,
        percentile_interpolation_type,
        circular_calculation,
        circular_wrap_value,
        out_join_layer,
    ):
        result = arcpy.gp.ZonalStatisticsAsTable_ia(
            in_zone_data,
            zone_field,
            in_value_raster,
            out_table,
            ignore_nodata,
            statistics_type,
            process_as_multidimensional,
            percentile_values,
            percentile_interpolation_type,
            circular_calculation,
            circular_wrap_value,
            out_join_layer,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_zone_data,
        zone_field,
        in_value_raster,
        out_table,
        ignore_nodata,
        statistics_type,
        process_as_multidimensional,
        percentile_values,
        percentile_interpolation_type,
        circular_calculation,
        circular_wrap_value,
        out_join_layer,
    )


ZonalStatisticsAsTable.__esri_toolname__ = "ZonalStatisticsAsTable_ia"
ZonalStatisticsAsTable.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
]


def ApplyEnvironment(in_raster):
    """ApplyEnvironment(in_raster)

    Creates a copy of in_raster with environment settings applied.

    Arguments:
    in_raster -- The input that will be copied.

    Results:
    out_raster -- Output raster"""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def wrapper(in_raster):
        return _wrapLocalFunctionRaster("ApplyEnvironment", ["Copy", in_raster])

    return wrapper(in_raster)


def FloatDivide(in_raster_or_constant1, in_raster_or_constant2):
    """FloatDivide(in_raster_or_constant1, in_raster_or_constant2)

    Divides the values of two rasters on a cell-by-cell basis. The result will
    be a true floating point division.

    Arguments:
    in_raster_or_constant1 -- The input whose values will be divided by the second input.
    in_raster_or_constant2 -- The input whose values the first input are to be divided by.

    Results:
    out_raster -- Output raster"""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("Divide_sa", ["FloatDivide", in_raster_or_constant1, in_raster_or_constant2])

    return wrapper(in_raster_or_constant1, in_raster_or_constant2)


def FloorDivide(in_raster_or_constant1, in_raster_or_constant2):
    """FloorDivide(in_raster_or_constant1, in_raster_or_constant2)

    Divides the values of two rasters on a cell-by-cell basis. The result will
    be a floored floating point division.

    Arguments:
    in_raster_or_constant1 -- The input whose values will be divided by the second input.
    in_raster_or_constant2 -- The input whose values the first input are to be divided by.

    Results:
    out_raster -- Output raster"""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def wrapper(in_raster_or_constant1, in_raster_or_constant2):
        return _wrapLocalFunctionRaster("Divide_sa", ["FloorDivide", in_raster_or_constant1, in_raster_or_constant2])

    return wrapper(in_raster_or_constant1, in_raster_or_constant2)
