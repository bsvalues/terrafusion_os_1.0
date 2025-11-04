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
from . import ParameterClasses
from . import Utils
from arcpy.sa import Raster
from typing import Literal


__all__ = [
    "Abs",
    "ACos",
    "ACosH",
    "AddSurfaceInformation",
    "Aggregate",
    "AggregateMultidimensionalRaster",
    "AreaSolarRadiation",
    "ASin",
    "ASinH",
    "Aspect",
    "ATan",
    "ATan2",
    "ATanH",
    "BandCollectionStats",
    "Basin",
    "BitwiseAnd",
    "BitwiseLeftShift",
    "BitwiseNot",
    "BitwiseOr",
    "BitwiseRightShift",
    "BitwiseXOr",
    "BlockStatistics",
    "BooleanAnd",
    "BooleanNot",
    "BooleanOr",
    "BooleanXOr",
    "BoundaryClean",
    "CalculateKernelDensityRatio",
    "CellStatistics",
    "ClassifyRaster",
    "ClassProbability",
    "CombinatorialAnd",
    "CombinatorialOr",
    "CombinatorialXOr",
    "Combine",
    "ComputeConfusionMatrix",
    "ComputeSegmentAttributes",
    "Con",
    "Contour",
    "ContourList",
    "ContourWithBarriers",
    "Corridor",
    "Cos",
    "CosH",
    "CostAllocation",
    "CostBackLink",
    "CostConnectivity",
    "CostDistance",
    "CostPath",
    "CostPathAsPolyline",
    "CreateAccuracyAssessmentPoints",
    "CreateConstantRaster",
    "CreateNormalRaster",
    "CreateRandomRaster",
    "CreateSignatures",
    "Curvature",
    "CutFill",
    "DarcyFlow",
    "DarcyVelocity",
    "DeepLearningModelToEcd",
    "Dendrogram",
    "DeriveContinuousFlow",
    "DeriveStreamAsLine",
    "DeriveStreamAsRaster",
    "Diff",
    "DimensionalMovingStatistics",
    "DistanceAccumulation",
    "DistanceAllocation",
    "Divide",
    "EditSignatures",
    "EqualTo",
    "EqualToFrequency",
    "EucAllocation",
    "EucBackDirection",
    "EucDirection",
    "EucDistance",
    "Exp",
    "Exp10",
    "Exp2",
    "Expand",
    "ExportTrainingDataForDeepLearning",
    "ExtractByAttributes",
    "ExtractByCircle",
    "ExtractByMask",
    "ExtractByPoints",
    "ExtractByPolygon",
    "ExtractByRectangle",
    "ExtractMultiValuesToPoints",
    "ExtractValuesToPoints",
    "FeaturePreservingSmoothing",
    "FeatureSolarRadiation",
    "Fill",
    "Filter",
    "Float",
    "FlowAccumulation",
    "FlowDirection",
    "FlowDistance",
    "FlowLength",
    "FocalFlow",
    "FocalStatistics",
    "FuzzyMembership",
    "FuzzyOverlay",
    "GenerateMultidimensionalAnomaly",
    "GenerateTrainingSamplesFromSeedPoints",
    "GeomorphonLandforms",
    "GreaterThan",
    "GreaterThanEqual",
    "GreaterThanFrequency",
    "HighestPosition",
    "Hillshade",
    "Idw",
    "InList",
    "InspectTrainingSamples",
    "Int",
    "InterpolateShape",
    "IsNull",
    "IsoCluster",
    "IsoClusterUnsupervisedClassification",
    "KernelDensity",
    "Kriging",
    "LeastCostCorridor",
    "LessThan",
    "LessThanEqual",
    "LessThanFrequency",
    "LinearSpectralUnmixing",
    "LineDensity",
    "LineStatistics",
    "Ln",
    "LocateRegions",
    "Log10",
    "Log2",
    "Lookup",
    "LowestPosition",
    "MajorityFilter",
    "Minus",
    "MLClassify",
    "Mod",
    "MultiscaleSurfaceDifference",
    "MultiscaleSurfacePercentile",
    "NaturalNeighbor",
    "Negate",
    "Nibble",
    "NotEqual",
    "ObserverPoints",
    "OptimalCorridorConnections",
    "OptimalPathAsLine",
    "OptimalPathAsRaster",
    "OptimalRegionConnections",
    "Over",
    "ParticleTrack",
    "PathAllocation",
    "PathBackLink",
    "PathDistance",
    "Pick",
    "Plus",
    "PointDensity",
    "PointsSolarRadiation",
    "PointStatistics",
    "Popularity",
    "PorousPuff",
    "Power",
    "PrincipalComponents",
    "Rank",
    "RasterSolarRadiation",
    "ReclassByASCIIFile",
    "ReclassByTable",
    "Reclassify",
    "RegionGroup",
    "RemoveRasterSegmentTilingArtifacts",
    "RescaleByFunction",
    "RoundDown",
    "RoundUp",
    "Sample",
    "SegmentMeanShift",
    "SetNull",
    "Shrink",
    "Sin",
    "SinH",
    "Sink",
    "Slice",
    "Slope",
    "SnapPourPoint",
    "SolarRadiationGraphics",
    "SpaceTimeKernelDensity",
    "Spline",
    "SplineWithBarriers",
    "Square",
    "SquareRoot",
    "StorageCapacity",
    "StreamLink",
    "StreamOrder",
    "StreamToFeature",
    "SurfaceParameters",
    "TabulateArea",
    "Tan",
    "TanH",
    "Test",
    "Thin",
    "Times",
    "TopoToRaster",
    "TopoToRasterByFile",
    "TrainIsoClusterClassifier",
    "TrainKNearestNeighborClassifier",
    "TrainMaximumLikelihoodClassifier",
    "TrainRandomTreesClassifier",
    "TrainSupportVectorMachineClassifier",
    "Trend",
    "UpdateAccuracyAssessmentPoints",
    "Viewshed",
    "Viewshed2",
    "Visibility",
    "Watershed",
    "WeightedOverlay",
    "WeightedSum",
    "ZonalCharacterization",
    "ZonalFill",
    "ZonalGeometry",
    "ZonalGeometryAsTable",
    "ZonalHistogram",
    "ZonalStatistics",
    "ZonalStatisticsAsTable",
    "ApplyEnvironment",
    "FloatDivide",
    "FloorDivide",
]


def Abs(in_raster_or_constant) -> Raster:
    """Abs_sa(in_raster_or_constant)

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


Abs.__esri_toolname__ = "Abs_sa"
Abs.__esri_toolinfo__ = ["::::1"]


def ACos(in_raster_or_constant) -> Raster:
    """ACos_sa(in_raster_or_constant)

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


ACos.__esri_toolname__ = "ACos_sa"
ACos.__esri_toolinfo__ = ["::::1"]


def ACosH(in_raster_or_constant) -> Raster:
    """ACosH_sa(in_raster_or_constant)

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


ACosH.__esri_toolname__ = "ACosH_sa"
ACosH.__esri_toolinfo__ = ["::::1"]


def AddSurfaceInformation(
    in_feature_class,
    in_surface,
    out_property: list[
        Literal[
            "Z", "Z_MIN", "Z_MAX", "Z_MEAN", "SURFACE_LENGTH", "SURFACE_AREA", "MIN_SLOPE", "MAX_SLOPE", "AVG_SLOPE"
        ]
    ]
    | Literal["Z", "Z_MIN", "Z_MAX", "Z_MEAN", "SURFACE_LENGTH", "SURFACE_AREA", "MIN_SLOPE", "MAX_SLOPE", "AVG_SLOPE"]
    | str,
    method: Literal[
        "LINEAR",
        "NATURAL_NEIGHBORS",
        "CONFLATE_ZMIN",
        "CONFLATE_ZMAX",
        "CONFLATE_NEAREST",
        "CONFLATE_CLOSEST_TO_MEAN",
        "BILINEAR",
        "#",
    ]
    | None = "#",
    sample_distance="#",
    z_factor="#",
    pyramid_level_resolution="#",
    noise_filtering="#",
):
    """AddSurfaceInformation_sa(in_feature_class, in_surface, out_property;out_property..., {method}, {sample_distance}, {z_factor}, {pyramid_level_resolution}, {noise_filtering})

       Attributes input features with height-based statistical information
       derived from the overlapping portions of a surface.

    INPUTS:
     in_feature_class (Feature Layer):
         The point, multipoint, polyline, or polygon features that define the
         locations for determining one or more surface properties.
     in_surface (TIN Layer / Raster Layer / Mosaic Layer / LAS Dataset Layer / Terrain Layer / Image Service):
         The LAS dataset, mosaic, raster, terrain, or TIN surface used for
         interpolating z-values.
     out_property (String):
         Specifies the surface elevation properties that will be added to the
         attribute table of the input feature class.Z-The surface z-values
         interpolated for the x,y-location of each
         single-point feature will be added.Z_MIN-The lowest surface z-values
         in the area defined by the polygon,
         along the length of a line, or among the interpolated values for
         points in a multipoint record will be added.Z_MAX-The highest surface
         elevation in the area defined by the
         polygon, along the length of a line, or among the interpolated values
         for points in a multipoint record will be added.Z_MEAN-The average
         surface elevation of the area defined by the
         polygon, along the length of a line, or among the interpolated values
         for points in a multipoint record will be added.SURFACE_AREA-The 3D
         surface area for the region defined by each
         polygon will be added.SURFACE_LENGTH-The 3D distance of the line along
         the surface will be
         added.MIN_SLOPE-The slope value closest to zero along the line or
         within the
         area defined by the polygon will be added.MAX_SLOPE-The highest slope
         value along the line or within the area
         defined by the polygon will be added.AVG_SLOPE-The average slope value
         along the line or within the area
         defined by the polygon will be added.
     method {String}:
         Specifies the interpolation method that will be used to determine
         information about the surface.BILINEAR-An interpolation method
         exclusive to the raster surface that
         determines cell values from the four nearest cells will be used. This
         is the only option available for a raster surface.LINEAR-Elevation
         will be obtained from the plane defined by the
         triangle that contains the x,y-location of a query point. This is the
         default interpolation method for TINs, terrains, and LAS
         datasets.NATURAL_NEIGHBORS-Elevation will be obtained by applying
         area-based
         weights to the natural neighbors of a query point.CONFLATE_ZMIN-
         Elevation will be obtained from the smallest z-value
         found among the natural neighbors of a query point.CONFLATE_ZMAX-
         Elevation will be obtained from the largest z-value
         found among the natural neighbors of a query point.CONFLATE_NEAREST-
         Elevation will be obtained from the nearest value
         among the natural neighbors of a query point.CONFLATE_CLOSEST_TO_MEAN-
         Elevation will be obtained from the z-value
         that is closest to the average of all the natural neighbors of a query
         point.
     sample_distance {Double}:
         The spacing at which z-values will be interpolated. By default, the
         raster cell size is used when the input surface is a raster, and the
         natural densification of the triangulated surface is used when the
         input is a terrain or TIN dataset.
     z_factor {Double}:
         The factor by which z-values will be multiplied. This is typically
         used to convert z linear units to match x,y linear units. The default
         is 1, which leaves elevation values unchanged. This parameter is not
         available if the spatial reference of the input surface has a z-datum
         with a specified linear unit.
     pyramid_level_resolution {Double}:
         The z-tolerance or window-size resolution of the terrain pyramid level
         that will be used. The default is 0, or full resolution.
     noise_filtering {String}:
         Defines whether portions of the surface that are potentially
         characterized by anomalous measurements will be excluded from
         contributing to slope calculations. Other properties are not affected
         by this parameter.Line features offer a length filter in which line
         segments with 3D
         lengths that are shorter than the specified value will be excluded
         from slope calculations. Polygon features offer an area filter in
         which polygons covering a surface area smaller than the specified
         value will be excluded."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_feature_class,
        in_surface,
        out_property,
        method,
        sample_distance,
        z_factor,
        pyramid_level_resolution,
        noise_filtering,
    ):
        result = arcpy.gp.AddSurfaceInformation_sa(
            in_feature_class,
            in_surface,
            out_property,
            method,
            sample_distance,
            z_factor,
            pyramid_level_resolution,
            noise_filtering,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_feature_class,
        in_surface,
        out_property,
        method,
        sample_distance,
        z_factor,
        pyramid_level_resolution,
        noise_filtering,
    )


AddSurfaceInformation.__esri_toolname__ = "AddSurfaceInformation_sa"
AddSurfaceInformation.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6", "::::7", "::::8"]


def Aggregate(
    in_raster,
    cell_factor,
    aggregation_type: Literal["SUM", "MAXIMUM", "MEAN", "MEDIAN", "MINIMUM", "#"] | None = "#",
    extent_handling: Literal["EXPAND", "TRUNCATE", "#"] | None = "#",
    ignore_nodata: Literal["DATA", "NODATA", "#"] | None = "#",
) -> Raster:
    """Aggregate_sa(in_raster, cell_factor, {aggregation_type}, {extent_handling}, {ignore_nodata})

       Generates a reduced-resolution version of a raster. Each output cell
       contains the Sum, Minimum, Maximum, Mean, or Median of the input cells
       that are encompassed by the extent of that cell.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster to be aggregated.It can be of integer or floating
         point type.
     cell_factor (Long):
         The factor by which the cell size of the input raster will be
         multiplied. The value must be an integer greater than 1.For example, a
         cell factor value of 3 results in an output cell size
         three times larger than that of the input raster.
     aggregation_type {String}:
         The method that will be used for aggregation.The values of the input
         cells encompassed by the coarser output cells
         are aggregated by one of the following statistics:SUM-The total of the
         input cell values. This is the
         default.MAXIMUM-The largest value of the input cells.MEAN-The average
         value of the input cells.MEDIAN-The median value of the input
         cells.MINIMUM-The smallest value of the input cells.
     extent_handling {Boolean}:
         Specifies whether the boundaries of the input raster will be expanded
         when its rows or columns are not a multiple of the cell factor.
         EXPAND-The top or right boundaries of the input raster will
         be expanded so the total number of cells in a row or column is a
         multiple of the cell factor. Those expanded cells are given a value of
         NoData when put into the calculation. With this option, the
         output raster can cover a larger spatial extent
         than the input raster. This is the default. TRUNCATE-The
         number of rows or columns will be reduced by 1
         in the output raster. This truncates the remaining cells on the top or
         right boundaries of the input raster, making the number of rows or
         columns in the input raster a multiple of the cell factor.
         With this option, the output raster can cover a smaller spatial extent
         than the input raster.If the number of rows and columns in the input
         raster is a multiple of
         the cell_factor, these keywords are not used.
     ignore_nodata {Boolean}:
         Denotes whether NoData values are ignored by the aggregation
         calculation. DATA-Specifies that if NoData values exist for
         any of the
         cells that fall within the spatial extent of a larger cell on the
         output raster, the NoData values will be ignored when determining the
         value for output cell locations. Only input cells within the extent of
         the output cell that have data values will be used in determining the
         value of the output cell. This is the default.
         NODATA-Specifies that if any cell that falls within the
         spatial extent of a larger cell on the output raster has a value of
         NoData, the value for that output cell location will be NoData.
         When this option is used, it is implied that when cells within an
         aggregation contain the NoData value, there is insufficient
         information to perform the specified calculations necessary to
         determine an output value.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output aggregated raster.It is a reduced-resolution version of the
         input raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, cell_factor, aggregation_type, extent_handling, ignore_nodata):
        args = {}
        aggr_types = {
            # values from esriGeoAnalysisStatisticsEnum
            "MAXIMUM": 2,
            "MINIMUM": 5,
            "MEAN": 3,
            "MEDIAN": 4,
            "SUM": 9,
        }
        args["CellFactor"] = cell_factor
        args["AggregationType"] = aggr_types.get(
            str(aggregation_type).upper(), aggr_types["SUM"] if str(aggregation_type) in ["", "#"] else None
        )
        if args["AggregationType"] == None:
            msgs = Utils.ParameterErrors()
            msgs.add_id_message("ERROR", 581)  # Invalid parameters.
            msgs.add_id_message("INFO", 952, "Aggregate")  # Failed to execute (<tool name>).
            raise arcpy.ExecuteError(msgs.combine())
        if str(extent_handling).upper() in ["TRUNCATE", "FALSE"]:
            args["ExpandHandling"] = 0
        elif str(extent_handling).upper() in ["EXPAND", "TRUE", "", "#"]:
            args["ExpandHandling"] = -1
        else:
            msgs = Utils.ParameterErrors()
            msgs.add_id_message("ERROR", 581)  # Invalid parameters.
            msgs.add_id_message("INFO", 952, "Aggregate")  # Failed to execute (<tool name>).
            raise arcpy.ExecuteError(msgs.combine())
        if str(ignore_nodata).upper() in ["NODATA", "FALSE"]:
            args["IgnoreNoData"] = 0
        elif str(ignore_nodata).upper() in ["DATA", "TRUE", "", "#"]:
            args["IgnoreNoData"] = -1
        else:
            msgs = Utils.ParameterErrors()
            msgs.add_id_message("ERROR", 581)  # Invalid parameters.
            msgs.add_id_message("INFO", 952, "Aggregate")  # Failed to execute (<tool name>).
            raise arcpy.ExecuteError(msgs.combine())
        in_raster = ApplyEnvironment(in_raster)
        result = arcpy.sa.Apply(in_raster, "Aggregate", args)
        with arcpy.EnvManager(cellSize=None):
            result = ApplyEnvironment(result)
        return result

    return Wrapper(in_raster, cell_factor, aggregation_type, extent_handling, ignore_nodata)


Aggregate.__esri_toolname__ = "Aggregate_sa"
Aggregate.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6"]


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
    """AggregateMultidimensionalRaster_sa(in_multidimensional_raster, dimension, {aggregation_method}, {variables;variables...}, {aggregation_def}, {interval_keyword}, {interval_value}, {interval_unit}, {interval_ranges;interval_ranges...}, {aggregation_function}, {ignore_nodata}, {dimensionless}, {percentile_value}, {percentile_interpolation_type})

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
        result = arcpy.gp.AggregateMultidimensionalRaster_sa(
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


AggregateMultidimensionalRaster.__esri_toolname__ = "AggregateMultidimensionalRaster_sa"
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


def AreaSolarRadiation(
    in_surface_raster,
    latitude="#",
    sky_size="#",
    time_configuration="#",
    day_interval="#",
    hour_interval="#",
    each_interval: Literal["NOINTERVAL", "INTERVAL", "#"] | None = "#",
    z_factor="#",
    slope_aspect_input_type: Literal["FROM_DEM", "FLAT_SURFACE", "#"] | None = "#",
    calculation_directions="#",
    zenith_divisions="#",
    azimuth_divisions="#",
    diffuse_model_type: Literal["UNIFORM_SKY", "STANDARD_OVERCAST_SKY", "#"] | None = "#",
    diffuse_proportion="#",
    transmittivity="#",
    out_direct_radiation_raster="#",
    out_diffuse_radiation_raster="#",
    out_direct_duration_raster="#",
) -> Raster:
    """AreaSolarRadiation_sa(in_surface_raster, {latitude}, {sky_size}, {time_configuration}, {day_interval}, {hour_interval}, {each_interval}, {z_factor}, {slope_aspect_input_type}, {calculation_directions}, {zenith_divisions}, {azimuth_divisions}, {diffuse_model_type}, {diffuse_proportion}, {transmittivity}, {out_direct_radiation_raster}, {out_diffuse_radiation_raster}, {out_direct_duration_raster})

       Derives incoming solar radiation from a raster surface.

    INPUTS:
     in_surface_raster (Composite Geodataset):
         The input elevation surface raster.
     latitude {Double}:
         The latitude for the site area. The units are decimal degrees with
         positive values for the northern hemisphere and negative values for
         the southern hemisphere.For input surface rasters containing a spatial
         reference, the mean
         latitude is automatically calculated; otherwise, the latitude default
         is 45 degrees.
     sky_size {Long}:
         The resolution or sky size for the viewshed, sky map, and sun map
         rasters. The units are cells.The default is a raster of 200 by 200
         cells.
     time_configuration {Time configuration}:
         Specifies the time configuration (period) that will be used for
         calculating solar radiation.The Time class objects will be used to
         specify the time configuration.The different types of time
         configurations available are
         TimeWithinDay, TimeMultipleDays, TimeSpecialDays, and
         TimeWholeYear.The following are the forms:TimeWithinDay({day},{startTi
         me},{endTime})TimeMultipleDays({year},{sta
         rtDay},{endDay})TimeSpecialDays()TimeWholeYear({year})The default time
         configuration is TimeMultipleDays with the startDay
         value of 5 and the endDay value of 160 for the current Julian year.
     day_interval {Long}:
         The time interval through the year (units: days) that will be used to
         calculate sky sectors for the sun map.The default value is 14
         (biweekly).
     hour_interval {Double}:
         The time interval through the day (units: hours) that will be used to
         calculate sky sectors for the sun map.The default value is 0.5.
     each_interval {Boolean}:
         Specifies whether a single total insolation value will be calculated
         for all locations or multiple values will be calculated for the
         specified hour and day interval.NOINTERVAL-A single total radiation
         value will be calculated for the
         entire time configuration. This is the default.INTERVAL-Multiple
         radiation values will be calculated for each time
         interval over the entire time configuration. The number of outputs
         depends on the hour or day interval. For example, for a whole year
         with monthly intervals, the result will contain 12 output radiation
         values for each location. The output raster will contain multiple
         bands that correspond to the radiation or duration values for each
         time interval.
     z_factor {Double}:
         The number of ground x,y units in one surface z-unit.The z-factor
         adjusts the units of measure for the z-units when they
         are different from the x,y units of the input surface. The z-values of
         the input surface are multiplied by the z-factor when calculating the
         final output surface.If the x,y units and z-units are in the same
         units of measure, the
         z-factor is 1. This is the default.If the x,y units and z-units are in
         different units of measure, the
         z-factor must be set to the appropriate factor or the results will be
         incorrect.For example, if the z-units are feet and the x,y units are
         meters, use
         a z-factor of 0.3048 to convert the z-units from feet to meters (1
         foot = 0.3048 meter).
     slope_aspect_input_type {String}:
         Specifies how slope and aspect information will be derived for
         analysis.FROM_DEM-The slope and aspect rasters will be calculated from
         the
         input surface raster. This is the default.FLAT_SURFACE-Constant values
         of zero will be used for slope and
         aspect.
     calculation_directions {Long}:
         The number of azimuth directions that will be used when calculating
         the viewshed.Valid values must be multiples of 8 (8, 16, 24, 32, and
         so on). The
         default value is 32 directions, which is adequate for complex
         topography.
     zenith_divisions {Long}:
         The number of zenith divisions that will be used to create sky sectors
         in the sky map.The default is eight divisions (relative to zenith).
         Values must be
         greater than zero and less than half the sky size value.
     azimuth_divisions {Long}:
         The number of azimuth divisions that will be used to create sky
         sectors in the sky map.The default is eight divisions (relative to
         north). Valid values must
         be multiples of 8. Values must be greater than zero and less than 160.
     diffuse_model_type {String}:
         Specifies the type of diffuse radiation model that will be
         used.UNIFORM_SKY-The uniform diffuse model will be used. The incoming
         diffuse radiation is the same from all sky directions. This is the
         default.STANDARD_OVERCAST_SKY-The standard overcast diffuse model will
         be
         used. The incoming diffuse radiation flux varies with the zenith
         angle.
     diffuse_proportion {Double}:
         The proportion of global normal radiation flux that is diffuse. Values
         range from 0 to 1.Set this value according to atmospheric conditions.
         The default value
         is 0.3 for generally clear sky conditions.
     transmittivity {Double}:
         The fraction of radiation that passes through the atmosphere (averaged
         overall wavelengths). Values range from 0 (no transmission) to 1 (all
         transmission).The default is 0.5 for a generally clear sky.

    OUTPUTS:
     out_global_radiation_raster (Raster Dataset):
         The output raster representing the global radiation or total amount of
         incoming solar insolation (direct + diffuse) calculated for each
         location of the input surface. The output has units of watt
         hours per square meter (WH/m).
         2
     out_direct_radiation_raster {Raster Dataset}:
         The output raster representing the direct incoming solar radiation for
         each location. The output has units of watt hours per square
         meter (WH/m).
         2
     out_diffuse_radiation_raster {Raster Dataset}:
         The output raster representing the diffuse incoming solar radiation
         for each location. The output has units of watt hours per
         square meter (WH/m).
         2
     out_direct_duration_raster {Raster Dataset}:
         The output raster representing the duration of direct incoming solar
         radiation.The output has units of hours."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_surface_raster,
        latitude,
        sky_size,
        time_configuration,
        day_interval,
        hour_interval,
        each_interval,
        z_factor,
        slope_aspect_input_type,
        calculation_directions,
        zenith_divisions,
        azimuth_divisions,
        diffuse_model_type,
        diffuse_proportion,
        transmittivity,
        out_direct_radiation_raster,
        out_diffuse_radiation_raster,
        out_direct_duration_raster,
    ):
        time_configuration = Utils.compoundParameterToString(time_configuration, ParameterClasses._Time)
        out_global_radiation_raster = "#"
        result = arcpy.gp.AreaSolarRadiation_sa(
            in_surface_raster,
            out_global_radiation_raster,
            latitude,
            sky_size,
            time_configuration,
            day_interval,
            hour_interval,
            each_interval,
            z_factor,
            slope_aspect_input_type,
            calculation_directions,
            zenith_divisions,
            azimuth_divisions,
            diffuse_model_type,
            diffuse_proportion,
            transmittivity,
            out_direct_radiation_raster,
            out_diffuse_radiation_raster,
            out_direct_duration_raster,
        )
        return _wrapToolRaster("AreaSolarRadiation_sa", str(result.getOutput(0)))

    return Wrapper(
        in_surface_raster,
        latitude,
        sky_size,
        time_configuration,
        day_interval,
        hour_interval,
        each_interval,
        z_factor,
        slope_aspect_input_type,
        calculation_directions,
        zenith_divisions,
        azimuth_divisions,
        diffuse_model_type,
        diffuse_proportion,
        transmittivity,
        out_direct_radiation_raster,
        out_diffuse_radiation_raster,
        out_direct_duration_raster,
    )


AreaSolarRadiation.__esri_toolname__ = "AreaSolarRadiation_sa"
AreaSolarRadiation.__esri_toolinfo__ = [
    "::::1",
    "::::3",
    "::::4",
    "Python::TimeMultipleDays|TimeSpecialDays|TimeWholeYear|TimeWithinDay::",
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
]


def ASin(in_raster_or_constant) -> Raster:
    """ASin_sa(in_raster_or_constant)

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


ASin.__esri_toolname__ = "ASin_sa"
ASin.__esri_toolinfo__ = ["::::1"]


def ASinH(in_raster_or_constant) -> Raster:
    """ASinH_sa(in_raster_or_constant)

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


ASinH.__esri_toolname__ = "ASinH_sa"
ASinH.__esri_toolinfo__ = ["::::1"]


def Aspect(
    in_raster,
    method: Literal["PLANAR", "GEODESIC", "#"] | None = "#",
    z_unit: Literal[
        "INCH",
        "FOOT",
        "YARD",
        "MILE_US",
        "NAUTICAL_MILE",
        "MILLIMETER",
        "CENTIMETER",
        "METER",
        "KILOMETER",
        "DECIMETER",
        "#",
    ]
    | None = "#",
    project_geodesic_azimuths: Literal["GEODESIC_AZIMUTHS", "PROJECT_GEODESIC_AZIMUTHS", "#"] | None = "#",
    analysis_target_device: Literal["GPU_THEN_CPU", "GPU_ONLY", "CPU_ONLY", "#"] | None = "#",
) -> Raster:
    """Aspect_sa(in_raster, {method}, {z_unit}, {project_geodesic_azimuths}, {analysis_target_device})

       Derives the aspect from each cell of a raster surface.

    INPUTS:
     in_raster (Composite Geodataset):
         The input surface raster.
     method {String}:
         Specifies whether the calculation will be based on a planar (flat
         earth) or a geodesic (ellipsoid) method.PLANAR-The calculation will be
         performed on a projected flat plane
         using a 2D Cartesian coordinate system. This is the default
         method.GEODESIC-The calculation will be performed in a 3D Cartesian
         coordinate system by considering the shape of the earth as an
         ellipsoid.The planar method is appropriate to use on local areas in a
         projection
         that maintains correct distance and area. It is suitable for analyses
         that cover areas such cities, counties, or smaller states in area. The
         geodesic method produces a more accurate result, at the potential cost
         of an increase in processing time.
     z_unit {String}:
         Specifies the linear unit that will be used for vertical z-values.It
         is defined by a vertical coordinate system if it exists. If no
         vertical coordinate system exists, define the z-unit using the unit
         list to ensure correct geodesic computation. The default is
         meter.INCH-The linear unit will be inches.FOOT-The linear unit will be
         feet.YARD-The linear unit will be yards.MILE_US-The linear unit will
         be miles.NAUTICAL_MILE-The linear unit will be nautical
         miles.MILLIMETER-The linear unit will be millimeters.CENTIMETER-The
         linear unit will be centimeters.METER-The linear unit will be
         meters.KILOMETER-The linear unit will be kilometers.DECIMETER-The
         linear unit will be decimeters.
     project_geodesic_azimuths {Boolean}:
         Specifies whether geodesic azimuths will be projected to correct the
         angle distortion caused by the output spatial
         reference.GEODESIC_AZIMUTHS-Geodesic azimuths will not be projected.
         This is the
         default.PROJECT_GEODESIC_AZIMUTHS-Geodesic azimuths will be projected.
     analysis_target_device {String}:
         Specifies the device that will be used to perform the
         calculation.GPU_THEN_CPU-If a compatible GPU is found, it will be used
         to perform
         the calculation. Otherwise, the CPU will be used. This is the
         default.CPU_ONLY-The calculation will only be performed on the
         CPU.GPU_ONLY-The calculation will only be performed on the GPU.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output aspect raster.It will be floating-point type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, method, z_unit, project_geodesic_azimuths, analysis_target_device):
        out_raster = "#"
        result = arcpy.gp.Aspect_sa(
            in_raster, out_raster, method, z_unit, project_geodesic_azimuths, analysis_target_device
        )
        return _wrapToolRaster("Aspect_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, method, z_unit, project_geodesic_azimuths, analysis_target_device)


Aspect.__esri_toolname__ = "Aspect_sa"
Aspect.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6"]


def ATan(in_raster_or_constant) -> Raster:
    """ATan_sa(in_raster_or_constant)

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


ATan.__esri_toolname__ = "ATan_sa"
ATan.__esri_toolinfo__ = ["::::1"]


def ATan2(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """ATan2_sa(in_raster_or_constant1, in_raster_or_constant2)

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


ATan2.__esri_toolname__ = "ATan2_sa"
ATan2.__esri_toolinfo__ = ["::::1", "::::2"]


def ATanH(in_raster_or_constant) -> Raster:
    """ATanH_sa(in_raster_or_constant)

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


ATanH.__esri_toolname__ = "ATanH_sa"
ATanH.__esri_toolinfo__ = ["::::1"]


def BandCollectionStats(
    in_raster_bands, out_stat_file, compute_matrices: Literal["BRIEF", "DETAILED", "#"] | None = "#"
):
    """BandCollectionStats_sa(in_raster_bands;in_raster_bands..., out_stat_file, {compute_matrices})

       Calculates the statistics for a set of raster bands.

    INPUTS:
     in_raster_bands (Composite Geodataset):
         The input raster bands.They can be integer or floating point type.
     compute_matrices {Boolean}:
         Specifies whether covariance and correlation matrices are
         calculated.BRIEF-Only the basic statistical measures (minimum,
         maximum, mean, and
         standard deviation) will be calculated for every layer. This is the
         default.DETAILED-In addition to the standard statistics calculated
         with
         {BRIEF}, the covariance and correlation matrices will also be
         determined.

    OUTPUTS:
     out_stat_file (File):
         The output ASCII file containing the statistics.A .txt extension is
         required."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_raster_bands, out_stat_file, compute_matrices):
        result = arcpy.gp.BandCollectionStats_sa(in_raster_bands, out_stat_file, compute_matrices)
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_raster_bands, out_stat_file, compute_matrices)


BandCollectionStats.__esri_toolname__ = "BandCollectionStats_sa"
BandCollectionStats.__esri_toolinfo__ = ["::::1", "::::2", "::::3"]


def Basin(in_flow_direction_raster) -> Raster:
    """Basin_sa(in_flow_direction_raster)

       Creates a raster delineating all drainage basins.

    INPUTS:
     in_flow_direction_raster (Composite Geodataset):
         The input raster that shows the direction of flow out of each cell.A
         flow direction raster can be created with the Flow Direction tool,
         using the default D8 flow direction type .

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster that delineates the drainage basins.This output is
         of integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_flow_direction_raster):
        out_raster = "#"
        result = arcpy.gp.Basin_sa(in_flow_direction_raster, out_raster)
        return _wrapToolRaster("Basin_sa", str(result.getOutput(0)))

    return Wrapper(in_flow_direction_raster)


Basin.__esri_toolname__ = "Basin_sa"
Basin.__esri_toolinfo__ = ["::::1"]


def BitwiseAnd(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """BitwiseAnd_sa(in_raster_or_constant1, in_raster_or_constant2)

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


BitwiseAnd.__esri_toolname__ = "BitwiseAnd_sa"
BitwiseAnd.__esri_toolinfo__ = ["::::1", "::::2"]


def BitwiseLeftShift(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """BitwiseLeftShift_sa(in_raster_or_constant1, in_raster_or_constant2)

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


BitwiseLeftShift.__esri_toolname__ = "BitwiseLeftShift_sa"
BitwiseLeftShift.__esri_toolinfo__ = ["::::1", "::::2"]


def BitwiseNot(in_raster_or_constant) -> Raster:
    """BitwiseNot_sa(in_raster_or_constant)

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


BitwiseNot.__esri_toolname__ = "BitwiseNot_sa"
BitwiseNot.__esri_toolinfo__ = ["::::1"]


def BitwiseOr(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """BitwiseOr_sa(in_raster_or_constant1, in_raster_or_constant2)

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


BitwiseOr.__esri_toolname__ = "BitwiseOr_sa"
BitwiseOr.__esri_toolinfo__ = ["::::1", "::::2"]


def BitwiseRightShift(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """BitwiseRightShift_sa(in_raster_or_constant1, in_raster_or_constant2)

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


BitwiseRightShift.__esri_toolname__ = "BitwiseRightShift_sa"
BitwiseRightShift.__esri_toolinfo__ = ["::::1", "::::2"]


def BitwiseXOr(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """BitwiseXOr_sa(in_raster_or_constant1, in_raster_or_constant2)

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


BitwiseXOr.__esri_toolname__ = "BitwiseXOr_sa"
BitwiseXOr.__esri_toolinfo__ = ["::::1", "::::2"]


def BlockStatistics(
    in_raster,
    neighborhood="#",
    statistics_type: Literal[
        "MEAN", "MAJORITY", "MAXIMUM", "MEDIAN", "MINIMUM", "MINORITY", "RANGE", "STD", "SUM", "VARIETY", "#"
    ]
    | None = "#",
    ignore_nodata: Literal["DATA", "NODATA", "#"] | None = "#",
) -> Raster:
    """BlockStatistics_sa(in_raster, {neighborhood}, {statistics_type}, {ignore_nodata})

       Partitions the input into non-overlapping blocks and calculates the
       statistic of the values within each block. The value is assigned to
       all of the cells in each block in the output.

    INPUTS:
     in_raster (Composite Geodataset):
         The raster for which a statistic will be calculated for blocks of
         cells.
     neighborhood {Neighborhood}:
         The cells of the processing block that will be used in the statistic
         calculation. There are several predefined neighborhood types to choose
         from, or a custom kernel can be defined.Once the neighborhood type is
         selected, other parameters can be set to
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
         will be calculated.MINIMUM-The minimum (smallest value) of the cells
         in the neighborhood
         will be identified.MINORITY-The minority (value that occurs least
         often) of the cells in
         the neighborhood will be identified.RANGE-The range (difference
         between largest and smallest value) of the
         cells in the neighborhood will be calculated.STD-The standard
         deviation of the cells in the neighborhood will be
         calculated.SUM-The sum of the cells in the neighborhood will be
         calculated.VARIETY-The variety (the number of unique values) of the
         cells in the
         neighborhood will be calculated.The default statistic type is MEAN.If
         the input raster is integer, all the statistics types will be
         available. If the input raster is floating point, only the MEAN,
         MAXIMUM, MINIMUM, RANGE, STD, and SUM statistic types will be
         available.
     ignore_nodata {Boolean}:
         Specifies whether NoData values will be ignored by the statistic
         calculation.DATA-If a NoData value exists within a block neighborhood,
         the NoData
         value will be ignored. Only cells within the neighborhood that have
         data values will be used in determining the output value. This is the
         default.NODATA-If any cell in a block neighborhood has a value of
         NoData, the
         output for each cell in the corresponding block will be NoData. The
         presence of a NoData value implies that there is insufficient
         information to determine the statistic value for the neighborhood.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output block statistics raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, neighborhood, statistics_type, ignore_nodata):
        neighborhood = Utils.compoundParameterToString(neighborhood, ParameterClasses._Neighborhood)
        out_raster = "#"
        result = arcpy.gp.BlockStatistics_sa(in_raster, out_raster, neighborhood, statistics_type, ignore_nodata)
        return _wrapToolRaster("BlockStatistics_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, neighborhood, statistics_type, ignore_nodata)


BlockStatistics.__esri_toolname__ = "BlockStatistics_sa"
BlockStatistics.__esri_toolinfo__ = [
    "::::1",
    "Python::NbrAnnulus|NbrCircle|NbrIrregular|NbrRectangle|NbrWedge|NbrWeight::",
    "::::4",
    "::::5",
]


def BooleanAnd(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """BooleanAnd_sa(in_raster_or_constant1, in_raster_or_constant2)

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


BooleanAnd.__esri_toolname__ = "BooleanAnd_sa"
BooleanAnd.__esri_toolinfo__ = ["::::1", "::::2"]


def BooleanNot(in_raster_or_constant) -> Raster:
    """BooleanNot_sa(in_raster_or_constant)

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


BooleanNot.__esri_toolname__ = "BooleanNot_sa"
BooleanNot.__esri_toolinfo__ = ["::::1"]


def BooleanOr(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """BooleanOr_sa(in_raster_or_constant1, in_raster_or_constant2)

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


BooleanOr.__esri_toolname__ = "BooleanOr_sa"
BooleanOr.__esri_toolinfo__ = ["::::1", "::::2"]


def BooleanXOr(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """BooleanXOr_sa(in_raster_or_constant1, in_raster_or_constant2)

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


BooleanXOr.__esri_toolname__ = "BooleanXOr_sa"
BooleanXOr.__esri_toolinfo__ = ["::::1", "::::2"]


def BoundaryClean(
    in_raster,
    sort_type: Literal["NO_SORT", "DESCEND", "ASCEND", "#"] | None = "#",
    number_of_runs: Literal["TWO_WAY", "ONE_WAY", "#"] | None = "#",
) -> Raster:
    """BoundaryClean_sa(in_raster, {sort_type}, {number_of_runs})

       Smooths the boundary between zones in a raster.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster for which the boundary between zones will be
         smoothed.It must be of integer type.
     sort_type {String}:
         Specifies the type of sorting to use in the smoothing process. The
         sorting determines the priority by which cells can expand into their
         neighbors.The sorting can be based on zone value or zone
         size.NO_SORT-The priority is determined by zone value. The size of the
         zones is not considered. Zones with larger values will have a higher
         priority to expand into zones with smaller values in the smoothed
         output. This is the default.DESCEND-Zones are sorted in descending
         order by size. Zones with
         larger total areas have a higher priority to expand into zones with
         smaller total areas. This option tends to eliminate or reduce the
         prevalence of cells from smaller zones in the smoothed
         output.ASCEND-Zones are sorted in ascending order by size. Zones with
         smaller
         total areas have a higher priority to expand into zones with larger
         total areas. This option tends to preserve or increase the prevalence
         of cells from smaller zones in the smoothed output.
     number_of_runs {Boolean}:
         Specifies the number of times the smoothing process will occur, twice
         or once.TWO_WAY-The expansion and shrinking operation is performed
         twice. The
         first time, the operation is performed according to the specified sort
         type. The second time, an additional expansion and shrinking operation
         is performed with the priority reversed. This is the
         default.ONE_WAY-The expansion and shrinking operation is performed
         once
         according to the sort type.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output generalized raster.The boundaries between zones in the
         input will be smoothed.The output is always of integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, sort_type, number_of_runs):
        out_raster = "#"
        result = arcpy.gp.BoundaryClean_sa(in_raster, out_raster, sort_type, number_of_runs)
        return _wrapToolRaster("BoundaryClean_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, sort_type, number_of_runs)


BoundaryClean.__esri_toolname__ = "BoundaryClean_sa"
BoundaryClean.__esri_toolinfo__ = ["::::1", "::::3", "::::4"]


def CalculateKernelDensityRatio(
    in_features_numerator,
    in_features_denominator,
    population_field_numerator,
    population_field_denominator,
    cell_size="#",
    search_radius_numerator="#",
    search_radius_denominator="#",
    out_cell_values: Literal["DENSITIES", "EXPECTED_COUNTS", "#"] | None = "#",
    method: Literal["PLANAR", "GEODESIC", "#"] | None = "#",
    in_barriers_numerator="#",
    in_barriers_denominator="#",
) -> Raster:
    """CalculateKernelDensityRatio_sa(in_features_numerator, in_features_denominator, population_field_numerator, population_field_denominator, {cell_size}, {search_radius_numerator}, {search_radius_denominator}, {out_cell_values}, {method}, {in_barriers_numerator}, {in_barriers_denominator})

       Calculates a spatial relative risk surface using two input feature
       datasets. The numerator in the ratio represents cases, such as number
       of crimes or number of patients, and the denominator represents the
       control, such as the total population.

    INPUTS:
     in_features_numerator (Feature Layer):
         The input features (point or line) of the cases for which density will
         be calculated.
     in_features_denominator (Feature Layer):
         The input features (point or line) of the control for which density
         will be calculated.
     population_field_numerator (Field):
         The field denoting population values for each feature. The population
         field is the count or quantity to be spread across the landscape to
         create a continuous surface.Use OID or FID if no item or special value
         will be used and each
         feature will be counted once.Values in the population field can be
         integer or floating point. You can use thefield if input
         features contain z-values.
         Shape
     population_field_denominator (Field):
         The field denoting population values for each feature. The population
         field is the count or quantity to be spread across the landscape to
         create a continuous surface.Use OID or FID if no item or special value
         will be used and each
         feature will be counted once.Values in the population field can be
         integer or floating point. You can use thefield if input
         features contain z-values.
         Shape
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     search_radius_numerator {Double}:
         The search radius within which density will be calculated. Units are
         based on the linear unit of the projection of the output spatial
         reference.For example, if the units are meters-to include all features
         within a
         one-mile neighborhood-set the search radius equal to 1609.344 (1 mile
         = 1609.344 meters).The default search radius is computed specifically
         for the input
         dataset using a spatial variant of Silverman's Rule of Thumb
         (Silverman, 1986) that is robust enough for spatial outliers (points
         that are far away from the rest of the points). See the usage tips for
         a description of the algorithm.
     search_radius_denominator {Double}:
         The search radius within which density will be calculated. Units are
         based on the linear unit of the projection of the output spatial
         reference.For example, if the units are meters-to include all features
         within a
         one-mile neighborhood-set the search radius equal to 1609.344 (1 mile
         = 1609.344 meters).The default search radius is computed specifically
         for the input
         dataset using a spatial variant of Silverman's Rule of Thumb
         (Silverman, 1986) that is robust enough for spatial outliers (points
         that are far away from the rest of the points). See the usage tips for
         a description of the algorithm.
     out_cell_values {String}:
         Specifies what the values in the output raster represent.DENSITIES-The
         output values represent the calculated density value per
         unit area for each cell. This is the default.EXPECTED_COUNTS-The
         output values represent the calculated density
         value per cell area.Since the cell value is linked to the specified
         cell size, the
         resulting raster cannot be resampled to a different cell size.
     method {String}:
         Specifies whether the flat earth (planar) or the shortest path on a
         spheroid (geodesic) distance will be used.PLANAR-The planar distance
         between features will be used. This is the
         default.GEODESIC-The geodesic distance between features will be
         used.The geodesic method only supports points as input features.
     in_barriers_numerator {Feature Layer}:
         The dataset that defines the barriers.The barriers can be a feature
         layer of polyline or polygon features.
     in_barriers_denominator {Feature Layer}:
         The dataset that defines the barriers.The barriers can be a feature
         layer of polyline or polygon features.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output kernel density raster.It is always a floating point raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_features_numerator,
        in_features_denominator,
        population_field_numerator,
        population_field_denominator,
        cell_size,
        search_radius_numerator,
        search_radius_denominator,
        out_cell_values,
        method,
        in_barriers_numerator,
        in_barriers_denominator,
    ):
        out_raster = "#"
        result = arcpy.gp.CalculateKernelDensityRatio_sa(
            in_features_numerator,
            in_features_denominator,
            population_field_numerator,
            population_field_denominator,
            out_raster,
            cell_size,
            search_radius_numerator,
            search_radius_denominator,
            out_cell_values,
            method,
            in_barriers_numerator,
            in_barriers_denominator,
        )
        return _wrapToolRaster("CalculateKernelDensityRatio_sa", str(result.getOutput(0)))

    return Wrapper(
        in_features_numerator,
        in_features_denominator,
        population_field_numerator,
        population_field_denominator,
        cell_size,
        search_radius_numerator,
        search_radius_denominator,
        out_cell_values,
        method,
        in_barriers_numerator,
        in_barriers_denominator,
    )


CalculateKernelDensityRatio.__esri_toolname__ = "CalculateKernelDensityRatio_sa"
CalculateKernelDensityRatio.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::4",
    "::::6",
    "::::7",
    "::::8",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
]


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
    """CellStatistics_sa(in_rasters_or_constants;in_rasters_or_constants..., {statistics_type}, {ignore_nodata}, {process_as_multiband}, {percentile_value}, {percentile_interpolation_type})

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


CellStatistics.__esri_toolname__ = "CellStatistics_sa"
CellStatistics.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7"]


def ClassifyRaster(in_raster, in_classifier_definition, in_additional_raster="#") -> Raster:
    """ClassifyRaster_sa(in_raster, in_classifier_definition, {in_additional_raster})

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
        result = arcpy.gp.ClassifyRaster_sa(
            in_raster, in_classifier_definition, out_raster_dataset, in_additional_raster
        )
        return _wrapToolRaster("ClassifyRaster_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, in_classifier_definition, in_additional_raster)


ClassifyRaster.__esri_toolname__ = "ClassifyRaster_sa"
ClassifyRaster.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def ClassProbability(
    in_raster_bands,
    in_signature_file,
    maximum_output_value="#",
    a_priori_probabilities: Literal["EQUAL", "SAMPLE", "FILE", "#"] | None = "#",
    in_a_priori_file="#",
) -> Raster:
    """ClassProbability_sa(in_raster_bands;in_raster_bands..., in_signature_file, {maximum_output_value}, {a_priori_probabilities}, {in_a_priori_file})

       Creates a multiband raster of probability bands, with one band being
       created for each class represented in the input signature file.

    INPUTS:
     in_raster_bands (Composite Geodataset):
         The input raster bands.They can be integer or floating point type.
     in_signature_file (File):
         Input signature file whose class signatures are used to generate the a
         priori probability bands.A .gsg extension is required.
     maximum_output_value {Long}:
         Factor for scaling the range of values in the output probability
         bands.By default, the values range from 0 to 100.
     a_priori_probabilities {String}:
         Specifies how a priori probabilities will be determined.EQUAL-All
         classes will have the same a priori probability.SAMPLE-A
         priori probabilities will be proportional to the number of
         cells in each class relative to the total number of cells sampled in
         all classes in the signature file.FILE-The a priori probabilities will
         be assigned to each class from an
         input ASCII a priori probability file.
     in_a_priori_file {File}:
         A text file containing a priori probabilities for the input signature
         classes. An input for the a priori probability file is only
         required
         when theoption is used. FileThe extension for the a priori file
         can be .txt or .asc.

    OUTPUTS:
     out_multiband_raster (Raster Dataset):
         The output multiband raster dataset.It will be of integer type.If the
         output is an Esri Grid, the filename cannot have more than 9
         characters."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_bands, in_signature_file, maximum_output_value, a_priori_probabilities, in_a_priori_file):
        out_multiband_raster = "#"
        result = arcpy.gp.ClassProbability_sa(
            in_raster_bands,
            in_signature_file,
            out_multiband_raster,
            maximum_output_value,
            a_priori_probabilities,
            in_a_priori_file,
        )
        return _wrapToolRaster("ClassProbability_sa", str(result.getOutput(0)))

    return Wrapper(in_raster_bands, in_signature_file, maximum_output_value, a_priori_probabilities, in_a_priori_file)


ClassProbability.__esri_toolname__ = "ClassProbability_sa"
ClassProbability.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "::::6"]


def CombinatorialAnd(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """CombinatorialAnd_sa(in_raster_or_constant1, in_raster_or_constant2)

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
        result = arcpy.gp.CombinatorialAnd_sa(in_raster_or_constant1, in_raster_or_constant2, out_raster)
        return _wrapToolRaster("CombinatorialAnd_sa", str(result.getOutput(0)))

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


CombinatorialAnd.__esri_toolname__ = "CombinatorialAnd_sa"
CombinatorialAnd.__esri_toolinfo__ = ["::::1", "::::2"]


def CombinatorialOr(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """CombinatorialOr_sa(in_raster_or_constant1, in_raster_or_constant2)

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
        result = arcpy.gp.CombinatorialOr_sa(in_raster_or_constant1, in_raster_or_constant2, out_raster)
        return _wrapToolRaster("CombinatorialOr_sa", str(result.getOutput(0)))

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


CombinatorialOr.__esri_toolname__ = "CombinatorialOr_sa"
CombinatorialOr.__esri_toolinfo__ = ["::::1", "::::2"]


def CombinatorialXOr(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """CombinatorialXOr_sa(in_raster_or_constant1, in_raster_or_constant2)

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
        result = arcpy.gp.CombinatorialXOr_sa(in_raster_or_constant1, in_raster_or_constant2, out_raster)
        return _wrapToolRaster("CombinatorialXOr_sa", str(result.getOutput(0)))

    return Wrapper(in_raster_or_constant1, in_raster_or_constant2)


CombinatorialXOr.__esri_toolname__ = "CombinatorialXOr_sa"
CombinatorialXOr.__esri_toolinfo__ = ["::::1", "::::2"]


def Combine(in_rasters) -> Raster:
    """Combine_sa(in_rasters;in_rasters...)

       Combines multiple rasters so that a unique output value is assigned to
       each unique combination of input values.

    INPUTS:
     in_rasters (Composite Geodataset):
         The list of input rasters to be combined.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output combined raster.A unique integer value is assigned to each
         unique combination of input
         values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_rasters):
        out_raster = "#"
        result = arcpy.gp.Combine_sa(in_rasters, out_raster)
        return _wrapToolRaster("Combine_sa", str(result.getOutput(0)))

    return Wrapper(in_rasters)


Combine.__esri_toolname__ = "Combine_sa"
Combine.__esri_toolinfo__ = ["::::1"]


def ComputeConfusionMatrix(in_accuracy_assessment_points, out_confusion_matrix):
    """ComputeConfusionMatrix_sa(in_accuracy_assessment_points, out_confusion_matrix)

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
        result = arcpy.gp.ComputeConfusionMatrix_sa(in_accuracy_assessment_points, out_confusion_matrix)
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_accuracy_assessment_points, out_confusion_matrix)


ComputeConfusionMatrix.__esri_toolname__ = "ComputeConfusionMatrix_sa"
ComputeConfusionMatrix.__esri_toolinfo__ = ["::::1", "::::2"]


def ComputeSegmentAttributes(
    in_segmented_raster,
    in_additional_raster="#",
    used_attributes: list[Literal["COLOR", "MEAN", "STD", "COUNT", "COMPACTNESS", "RECTANGULARITY"]]
    | Literal["COLOR", "MEAN", "STD", "COUNT", "COMPACTNESS", "RECTANGULARITY"]
    | str
    | None = "#",
) -> Raster:
    """ComputeSegmentAttributes_sa(in_segmented_raster, {in_additional_raster}, {used_attributes;used_attributes...})

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
        result = arcpy.gp.ComputeSegmentAttributes_sa(
            in_segmented_raster, out_index_raster_dataset, in_additional_raster, used_attributes
        )
        return _wrapToolRaster("ComputeSegmentAttributes_sa", str(result.getOutput(0)))

    return Wrapper(in_segmented_raster, in_additional_raster, used_attributes)


ComputeSegmentAttributes.__esri_toolname__ = "ComputeSegmentAttributes_sa"
ComputeSegmentAttributes.__esri_toolinfo__ = ["::::1", "::::3", "::::4"]


def Con(in_conditional_raster, in_true_raster_or_constant, in_false_raster_or_constant="#", where_clause="#") -> Raster:
    """Con_sa(in_conditional_raster, in_true_raster_or_constant, {in_false_raster_or_constant}, {where_clause})

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
        result = arcpy.gp.Con_sa(
            in_conditional_raster, in_true_raster_or_constant, out_raster, in_false_raster_or_constant, where_clause
        )
        return _wrapToolRaster("Con_sa", str(result.getOutput(0)))

    return Wrapper(in_conditional_raster, in_true_raster_or_constant, in_false_raster_or_constant, where_clause)


Con.__esri_toolname__ = "Con_sa"
Con.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5"]


def Contour(
    in_raster,
    out_polyline_features,
    contour_interval,
    base_contour="#",
    z_factor="#",
    contour_type: Literal["CONTOUR", "CONTOUR_POLYGON", "CONTOUR_SHELL", "CONTOUR_SHELL_UP", "#"] | None = "#",
    max_vertices_per_feature="#",
):
    """Contour_sa(in_raster, out_polyline_features, contour_interval, {base_contour}, {z_factor}, {contour_type}, {max_vertices_per_feature})

       Creates a feature class of contours from a raster surface.

    INPUTS:
     in_raster (Composite Geodataset):
         The input surface raster.
     contour_interval (Double):
         The interval, or distance, between contour lines.This can be any
         positive number.
     base_contour {Double}:
         The base contour value.Contours are generated above and below this
         value as needed to cover
         the entire value range of the input raster. The default is zero.
     z_factor {Double}:
         The unit conversion factor used when generating contours. The default
         value is 1.The contour lines are generated based on the z-values in
         the input
         raster, which are often measured in units of meters or feet. With the
         default value of 1, the contours will be in the same units as the
         z-values of the input raster. To create contours in a unit other than
         that of the z-values, set an appropriate value for the z-factor. It is
         not necessary to have the ground x,y and surface z-units be consistent
         for this tool.For example, if the elevation values in the input raster
         are in feet,
         but you want the contours to be generated based on units of meters,
         set the z-factor to 0.3048 (1 foot = 0.3048 meter).For another
         example, an input raster is in WGS84 geographic
         coordinates and elevation units of meters, and you want to generate
         contour lines every 100 feet with a base of 50 feet (so the contours
         will be 50 ft, 150 ft, 250 ft, and so on). To do this, set
         contour_interval to 100, base_contour to 50, and z_factor to 3.2808 (1
         meter = 3.2808 feet).
     contour_type {String}:
         Specifies the type of output. The output can represent the contours as
         either lines or polygons. There are several options for
         polygons.CONTOUR-A polyline feature class of contours (isolines). This
         is the
         default.CONTOUR_POLYGON-A polygon feature class of filled
         contours.CONTOUR_SHELL-A polygon feature class in which the upper
         bound of the
         polygon increases cumulatively by the interval value. The lower bound
         remains constant at the raster minimum.CONTOUR_SHELL_UP-A polygon
         feature class in which the lower bound of
         the polygon increases cumulatively, from the raster minimum, by the
         interval value. The upper bound remains constant at the raster
         maximum.
     max_vertices_per_feature {Long}:
         The vertex limit when subdividing a feature. This should only be used
         when output features contain a very large number of vertices (many
         millions).This parameter is intended as a way to subdivide extremely
         large
         features that can cause issues later on, for example, when storing,
         analyzing, or drawing the features.If left empty, the output features
         will not be split. The default is
         empty.

    OUTPUTS:
     out_polyline_features (Feature Class):
         The output contour features."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_raster,
        out_polyline_features,
        contour_interval,
        base_contour,
        z_factor,
        contour_type,
        max_vertices_per_feature,
    ):
        result = arcpy.gp.Contour_sa(
            in_raster,
            out_polyline_features,
            contour_interval,
            base_contour,
            z_factor,
            contour_type,
            max_vertices_per_feature,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_raster,
        out_polyline_features,
        contour_interval,
        base_contour,
        z_factor,
        contour_type,
        max_vertices_per_feature,
    )


Contour.__esri_toolname__ = "Contour_sa"
Contour.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6", "::::7"]


def ContourList(in_raster, out_polyline_features, contour_values):
    """ContourList_sa(in_raster, out_polyline_features, contour_values;contour_values...)

       Creates a feature class of selected contour values from a raster
       surface.

    INPUTS:
     in_raster (Composite Geodataset):
         The input surface raster.
     contour_values (Double):
         List of z-values for which to create contours.

    OUTPUTS:
     out_polyline_features (Feature Class):
         The output contour polyline features."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_raster, out_polyline_features, contour_values):
        result = arcpy.gp.ContourList_sa(in_raster, out_polyline_features, contour_values)
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_raster, out_polyline_features, contour_values)


ContourList.__esri_toolname__ = "ContourList_sa"
ContourList.__esri_toolinfo__ = ["::::1", "::::2", "::::3"]


def ContourWithBarriers(
    in_raster,
    out_contour_feature_class,
    in_barrier_features="#",
    in_contour_type: Literal["POLYLINES", "POLYGONS", "#"] | None = "#",
    in_contour_values_file="#",
    explicit_only: Literal["EXPLICIT_VALUES_ONLY", "NO_EXPLICIT_VALUES_ONLY", "#"] | None = "#",
    in_base_contour="#",
    in_contour_interval="#",
    in_indexed_contour_interval="#",
    in_explicit_contours="#",
    in_z_factor="#",
):
    """ContourWithBarriers_sa(in_raster, out_contour_feature_class, {in_barrier_features}, {in_contour_type}, {in_contour_values_file}, {explicit_only}, {in_base_contour}, {in_contour_interval}, {in_indexed_contour_interval}, {in_explicit_contours}, {in_z_factor})

       Creates contours from a raster surface. The inclusion of barrier
       features allows you to independently generate contours on either side
       of a barrier.

    INPUTS:
     in_raster (Mosaic Dataset / Mosaic Layer / Raster Dataset / Raster Layer):
         The input surface raster.
     in_barrier_features {Feature Layer}:
         The input barrier features.The features can be polyline or polygon
         type.
     in_contour_type {String}:
         The type of contour to create.POLYLINES-The contour or isoline
         representation of the input
         raster.POLYGONS-Closed polygons representing the contours.
     in_contour_values_file {File}:
         The base contour, contour interval, indexed contour interval, and
         explicit contour values can also be specified via a text file.
     explicit_only {Boolean}:
         Only explicit contour values are used. Base contour, contour interval,
         and indexed contour intervals are not
         specified.NO_EXPLICIT_VALUES_ONLY-The default, contour interval must
         be
         specified.EXPLICIT_VALUES_ONLY-Only explicit contour values are
         specified.
     in_base_contour {Double}:
         The base contour value.Contours are generated above and below this
         value as needed to cover
         the entire value range of the input raster. The default is zero.
     in_contour_interval {Double}:
         The interval, or distance, between contour lines.This can be any
         positive number.
     in_indexed_contour_interval {Double}:
         Contours will also be generated for this interval and will be flagged
         accordingly in the output feature class.
     in_explicit_contours {Double}:
         Explicit values at which to create contours.
     in_z_factor {Double}:
         The unit conversion factor used when generating contours. The default
         value is 1.The contour lines are generated based on the z-values in
         the input
         raster, which are often measured in units of meters or feet. With the
         default value of 1, the contours will be in the same units as the
         z-values of the input raster. To create contours in a unit other than
         that of the z-values, set an appropriate value for the z-factor. It is
         not necessary to have the ground x,y and surface z-units be consistent
         for this tool.For example, if the elevation values in the input raster
         are in feet,
         but you want the contours to be generated based on units of meters,
         set the z-factor to 0.3048 (1 foot = 0.3048 meter).

    OUTPUTS:
     out_contour_feature_class (Feature Class):
         The output contour features."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_raster,
        out_contour_feature_class,
        in_barrier_features,
        in_contour_type,
        in_contour_values_file,
        explicit_only,
        in_base_contour,
        in_contour_interval,
        in_indexed_contour_interval,
        in_explicit_contours,
        in_z_factor,
    ):
        result = arcpy.gp.ContourWithBarriers_sa(
            in_raster,
            out_contour_feature_class,
            in_barrier_features,
            in_contour_type,
            in_contour_values_file,
            explicit_only,
            in_base_contour,
            in_contour_interval,
            in_indexed_contour_interval,
            in_explicit_contours,
            in_z_factor,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_raster,
        out_contour_feature_class,
        in_barrier_features,
        in_contour_type,
        in_contour_values_file,
        explicit_only,
        in_base_contour,
        in_contour_interval,
        in_indexed_contour_interval,
        in_explicit_contours,
        in_z_factor,
    )


ContourWithBarriers.__esri_toolname__ = "ContourWithBarriers_sa"
ContourWithBarriers.__esri_toolinfo__ = [
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


def Corridor(in_distance_raster1, in_distance_raster2) -> Raster:
    """Corridor_sa(in_distance_raster1, in_distance_raster2)

       Calculates the sum of accumulative costs for two input accumulative
       cost rasters.

    INPUTS:
     in_distance_raster1 (Composite Geodataset):
         The first input distance raster.It should be an accumulated cost
         distance output from a distance tool
         such as Cost Distance or Path Distance.
     in_distance_raster2 (Composite Geodataset):
         The second input distance raster.It should be an accumulated cost
         distance output from a distance tool
         such as Cost Distance or Path Distance.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output corridor raster.The output raster is of floating-point
         type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_distance_raster1, in_distance_raster2):
        out_raster = "#"
        result = arcpy.gp.Corridor_sa(in_distance_raster1, in_distance_raster2, out_raster)
        return _wrapToolRaster("Corridor_sa", str(result.getOutput(0)))

    return Wrapper(in_distance_raster1, in_distance_raster2)


Corridor.__esri_toolname__ = "Corridor_sa"
Corridor.__esri_toolinfo__ = ["::::1", "::::2"]


def Cos(in_raster_or_constant) -> Raster:
    """Cos_sa(in_raster_or_constant)

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


Cos.__esri_toolname__ = "Cos_sa"
Cos.__esri_toolinfo__ = ["::::1"]


def CosH(in_raster_or_constant) -> Raster:
    """CosH_sa(in_raster_or_constant)

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


CosH.__esri_toolname__ = "CosH_sa"
CosH.__esri_toolinfo__ = ["::::1"]


def CostAllocation(
    in_source_data,
    in_cost_raster,
    maximum_distance="#",
    in_value_raster="#",
    source_field="#",
    out_distance_raster="#",
    out_backlink_raster="#",
    source_cost_multiplier="#",
    source_start_cost="#",
    source_resistance_rate="#",
    source_capacity="#",
    source_direction="#",
) -> Raster:
    """CostAllocation_sa(in_source_data, in_cost_raster, {maximum_distance}, {in_value_raster}, {source_field}, {out_distance_raster}, {out_backlink_raster}, {source_cost_multiplier}, {source_start_cost}, {source_resistance_rate}, {source_capacity}, {source_direction})

       Calculates, for each cell, its least-cost source based on the least
       accumulative cost over a cost surface.

    INPUTS:
     in_source_data (Composite Geodataset):
         The input source locations.This is a raster or feature (point, line,
         or polygon) identifying the
         cells or locations that will be used to calculate the least
         accumulated cost distance for each output cell location.For rasters,
         the input type can be integer or floating point.If the input source
         raster is floating point, the in_value_raster
         parameter must be set, and it must integer. The value raster will take
         precedence over the source_field parameter setting.
     in_cost_raster (Composite Geodataset):
         A raster defining the impedance or cost to move planimetrically
         through each cell.The value at each cell location represents the cost-
         per-unit distance
         for moving through the cell. Each cell location value is multiplied by
         the cell resolution while also compensating for diagonal movement to
         obtain the total cost of passing through the cell.The values of the
         cost raster can be integer or floating point, but
         they cannot be negative or zero (you cannot have a negative or zero
         cost).
     maximum_distance {Double}:
         The threshold that the accumulative cost values cannot exceed.If an
         accumulative cost distance value exceeds this value, the output
         value for the cell location will be NoData. The maximum distance is
         the extent for which the accumulative cost distances are
         calculated.The default distance is to the edge of the output raster.
     in_value_raster {Composite Geodataset}:
         The input integer raster that identifies the zone values that will be
         used for each input source location.For each source location (cell or
         feature), this value will be
         assigned to all cells allocated to the source location for the
         computation. The value raster will take precedence over the
         source_field parameter setting.
     source_field {Field}:
         The field used to assign values to the source locations. It must be of
         integer type.If the in_value_raster parameter has been set, the values
         in that
         input will have precedence over this parameter setting.
     source_cost_multiplier {Double / Field}:
         The multiplier that will be applied to the cost values.This allows for
         control of the mode of travel or the magnitude at a
         source. The greater the multiplier, the greater the cost to move
         through each cell.The values must be greater than zero. The default is
         1.
     source_start_cost {Double / Field}:
         The starting cost that will be used to begin the cost
         calculations.Allows for the specification of the fixed cost associated
         with a
         source. Instead of starting at a cost of zero, the cost algorithm will
         begin with this value.The values must be zero or greater. The default
         is 0.
     source_resistance_rate {Double / Field}:
         This parameter simulates the increase in the effort to overcome costs
         as the accumulative cost increases. It is used to model fatigue of the
         traveler. The growing accumulative cost to reach a cell is multiplied
         by the resistance rate and added to the cost to move into the
         subsequent cell.It is a modified version of a compound interest rate
         formula that is
         used to calculate the apparent cost of moving through a cell. As the
         value of the resistance rate increases, it increases the cost of the
         cells that are visited later. The greater the resistance rate, the
         more additional cost is added to reach the next cell, which is
         compounded for each subsequent movement. Since the resistance rate is
         similar to a compound rate and generally the accumulative cost values
         are very large, small resistance rates are suggested, such as 0.02,
         0.005, or even smaller, depending on the accumulative cost values.The
         values must be zero or greater. The default is 0.
     source_capacity {Double / Field}:
         The cost capacity for the traveler for a source.The cost calculations
         continue for each source until the specified
         capacity is reached.The values must be greater than zero. The default
         capacity is to the
         edge of the output raster.
     source_direction {String / Field}:
         Specifies the direction of the traveler when applying the source
         resistance rate and the source starting cost.FROM_SOURCE-The source
         resistance rate and source starting cost will
         be applied beginning at the input source and travel out to the
         nonsource cells. This is the default.TO_SOURCE-The source resistance
         rate and source starting cost will be
         applied beginning at each nonsource cell and travel back to the input
         source.Specify the FROM_SOURCE or TO_SOURCE keyword, which will be
         applied to
         all sources, or specify a field in the source data that contains the
         keywords to identify the direction of travel for each source. That
         field must contain the string FROM_SOURCE or TO_SOURCE.

    OUTPUTS:
     out_allocation_raster (Raster Dataset):
         The output cost allocation raster.This raster identifies the zone of
         each source location (cell or
         feature) that could be reached with the least accumulative cost.The
         output raster is of integer type.
     out_distance_raster {Raster Dataset}:
         The output cost distance raster.The cost distance raster identifies,
         for each cell, the least
         accumulative cost distance over a cost surface to the identified
         source locations.A source can be a cell, a set of cells, or one or
         more feature
         locations.The output raster is of floating-point type.
     out_backlink_raster {Raster Dataset}:
         The output cost backlink raster.The backlink raster contains values 0
         through 8, which define the
         direction or identify the next neighboring cell (the succeeding cell)
         along the least accumulative cost path from a cell to reach its least-
         cost source.If the path is to pass into the right neighbor, the cell
         will be
         assigned the value 1, 2 for the lower right diagonal cell, and
         continue clockwise. The value 0 is reserved for source cells."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_source_data,
        in_cost_raster,
        maximum_distance,
        in_value_raster,
        source_field,
        out_distance_raster,
        out_backlink_raster,
        source_cost_multiplier,
        source_start_cost,
        source_resistance_rate,
        source_capacity,
        source_direction,
    ):
        out_allocation_raster = "#"
        result = arcpy.gp.CostAllocation_sa(
            in_source_data,
            in_cost_raster,
            out_allocation_raster,
            maximum_distance,
            in_value_raster,
            source_field,
            out_distance_raster,
            out_backlink_raster,
            source_cost_multiplier,
            source_start_cost,
            source_resistance_rate,
            source_capacity,
            source_direction,
        )
        return _wrapToolRaster("CostAllocation_sa", str(result.getOutput(0)))

    return Wrapper(
        in_source_data,
        in_cost_raster,
        maximum_distance,
        in_value_raster,
        source_field,
        out_distance_raster,
        out_backlink_raster,
        source_cost_multiplier,
        source_start_cost,
        source_resistance_rate,
        source_capacity,
        source_direction,
    )


CostAllocation.__esri_toolname__ = "CostAllocation_sa"
CostAllocation.__esri_toolinfo__ = [
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
]


def CostBackLink(
    in_source_data,
    in_cost_raster,
    maximum_distance="#",
    out_distance_raster="#",
    source_cost_multiplier="#",
    source_start_cost="#",
    source_resistance_rate="#",
    source_capacity="#",
    source_direction="#",
) -> Raster:
    """CostBackLink_sa(in_source_data, in_cost_raster, {maximum_distance}, {out_distance_raster}, {source_cost_multiplier}, {source_start_cost}, {source_resistance_rate}, {source_capacity}, {source_direction})

       Defines the neighbor that is the next cell on the least accumulative
       cost path to the least-cost source.

    INPUTS:
     in_source_data (Composite Geodataset):
         The input source locations.This is a raster or feature (point, line,
         or polygon) identifying the
         cells or locations that will be used to calculate the least
         accumulated cost distance for each output cell location.For rasters,
         the input type can be integer or floating point.
     in_cost_raster (Composite Geodataset):
         A raster defining the impedance or cost to move planimetrically
         through each cell.The value at each cell location represents the cost-
         per-unit distance
         for moving through the cell. Each cell location value is multiplied by
         the cell resolution while also compensating for diagonal movement to
         obtain the total cost of passing through the cell.The values of the
         cost raster can be integer or floating point, but
         they cannot be negative or zero (you cannot have a negative or zero
         cost).
     maximum_distance {Double}:
         The threshold that the accumulative cost values cannot exceed.If an
         accumulative cost distance value exceeds this value, the output
         value for the cell location will be NoData. The maximum distance is
         the extent for which the accumulative cost distances are
         calculated.The default distance is to the edge of the output raster.
     source_cost_multiplier {Double / Field}:
         The multiplier that will be applied to the cost values.This allows for
         control of the mode of travel or the magnitude at a
         source. The greater the multiplier, the greater the cost to move
         through each cell.The values must be greater than zero. The default is
         1.
     source_start_cost {Double / Field}:
         The starting cost that will be used to begin the cost
         calculations.Allows for the specification of the fixed cost associated
         with a
         source. Instead of starting at a cost of zero, the cost algorithm will
         begin with this value.The values must be zero or greater. The default
         is 0.
     source_resistance_rate {Double / Field}:
         This parameter simulates the increase in the effort to overcome costs
         as the accumulative cost increases. It is used to model fatigue of the
         traveler. The growing accumulative cost to reach a cell is multiplied
         by the resistance rate and added to the cost to move into the
         subsequent cell.It is a modified version of a compound interest rate
         formula that is
         used to calculate the apparent cost of moving through a cell. As the
         value of the resistance rate increases, it increases the cost of the
         cells that are visited later. The greater the resistance rate, the
         more additional cost is added to reach the next cell, which is
         compounded for each subsequent movement. Since the resistance rate is
         similar to a compound rate and generally the accumulative cost values
         are very large, small resistance rates are suggested, such as 0.02,
         0.005, or even smaller, depending on the accumulative cost values.The
         values must be zero or greater. The default is 0.
     source_capacity {Double / Field}:
         The cost capacity for the traveler for a source.The cost calculations
         continue for each source until the specified
         capacity is reached.The values must be greater than zero. The default
         capacity is to the
         edge of the output raster.
     source_direction {String / Field}:
         Specifies the direction of the traveler when applying the source
         resistance rate and the source starting cost.FROM_SOURCE-The source
         resistance rate and source starting cost will
         be applied beginning at the input source and travel out to the
         nonsource cells. This is the default.TO_SOURCE-The source resistance
         rate and source starting cost will be
         applied beginning at each nonsource cell and travel back to the input
         source.Specify the FROM_SOURCE or TO_SOURCE keyword, which will be
         applied to
         all sources, or specify a field in the source data that contains the
         keywords to identify the direction of travel for each source. That
         field must contain the string FROM_SOURCE or TO_SOURCE.

    OUTPUTS:
     out_backlink_raster (Raster Dataset):
         The output cost backlink raster.The backlink raster contains values 0
         through 8, which define the
         direction or identify the next neighboring cell (the succeeding cell)
         along the least accumulative cost path from a cell to reach its least-
         cost source.If the path is to pass into the right neighbor, the cell
         will be
         assigned the value 1, 2 for the lower right diagonal cell, and
         continue clockwise. The value 0 is reserved for source cells.
     out_distance_raster {Raster Dataset}:
         The output cost distance raster.The cost distance raster identifies,
         for each cell, the least
         accumulative cost distance over a cost surface to the identified
         source locations.A source can be a cell, a set of cells, or one or
         more feature
         locations.The output raster is of floating-point type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_source_data,
        in_cost_raster,
        maximum_distance,
        out_distance_raster,
        source_cost_multiplier,
        source_start_cost,
        source_resistance_rate,
        source_capacity,
        source_direction,
    ):
        out_backlink_raster = "#"
        result = arcpy.gp.CostBackLink_sa(
            in_source_data,
            in_cost_raster,
            out_backlink_raster,
            maximum_distance,
            out_distance_raster,
            source_cost_multiplier,
            source_start_cost,
            source_resistance_rate,
            source_capacity,
            source_direction,
        )
        return _wrapToolRaster("CostBackLink_sa", str(result.getOutput(0)))

    return Wrapper(
        in_source_data,
        in_cost_raster,
        maximum_distance,
        out_distance_raster,
        source_cost_multiplier,
        source_start_cost,
        source_resistance_rate,
        source_capacity,
        source_direction,
    )


CostBackLink.__esri_toolname__ = "CostBackLink_sa"
CostBackLink.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "::::6", "::::7", "::::8", "::::9", "::::10"]


def CostConnectivity(in_regions, in_cost_raster, out_feature_class, out_neighbor_paths="#"):
    """CostConnectivity_sa(in_regions, in_cost_raster, out_feature_class, {out_neighbor_paths})

       Produces the least-cost connectivity network between two or more input
       regions.

    INPUTS:
     in_regions (Composite Geodataset):
         The input regions that are to be connected by the least-cost
         network.Regions can be defined by either a raster or a feature
         dataset.If the region input is a raster, the regions are defined by
         groups of
         contiguous (adjacent) cells of the same value. Each region must be
         uniquely numbered. The cells that are not part of any region must be
         NoData. The raster type must be integer, and the values can be either
         positive or negative.If the region input is a feature dataset, it can
         be either polygons,
         lines, or points. Polygon feature regions cannot be composed of
         multipart polygons.
     in_cost_raster (Composite Geodataset):
         A raster defining the impedance or cost to move planimetrically
         through each cell.The value at each cell location represents the cost-
         per-unit distance
         for moving through the cell. Each cell location value is multiplied by
         the cell resolution while also compensating for diagonal movement to
         obtain the total cost of passing through the cell.The values of the
         cost raster can be integer or floating point, but
         they cannot be negative or zero (you cannot have a negative or zero
         cost).

    OUTPUTS:
     out_feature_class (Feature Class):
         The output polyline feature class of the optimum (least-cost) network
         of paths necessary to connect each of the input regions.Each path (or
         line) is uniquely numbered, and additional fields in the
         attribute table store specific information about the path. Those
         fields include the following:PATHID-Unique identifier for the
         pathPATHCOST-Total accumulative cost
         for the pathREGION1-The first region the path connectsREGION2-The
         other region the path connectsThis information provides you insight
         into the paths within the
         network.Since each path is represented by a unique line, there will be
         multiple lines in locations where paths travel the same route.
     out_neighbor_paths {Feature Class}:
         The output polyline feature class identifying all paths from each
         region to each of its closest-cost neighbors.Each path (or line) is
         uniquely numbered, and additional fields in the
         attribute table store specific information about the path. Those
         fields include the following:PATHID-Unique identifier for the
         pathPATHCOST-Total accumulative cost
         for the pathREGION1-The first region the path connectsREGION2-The
         other region the path connectsThis information provides you insight
         into the paths within the
         network and is particularly useful when deciding which paths should be
         removed if necessary.Since each path is represented by a unique line,
         there will be
         multiple lines in locations where paths travel the same route."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_regions, in_cost_raster, out_feature_class, out_neighbor_paths):
        result = arcpy.gp.CostConnectivity_sa(in_regions, in_cost_raster, out_feature_class, out_neighbor_paths)
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_regions, in_cost_raster, out_feature_class, out_neighbor_paths)


CostConnectivity.__esri_toolname__ = "CostConnectivity_sa"
CostConnectivity.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4"]


def CostDistance(
    in_source_data,
    in_cost_raster,
    maximum_distance="#",
    out_backlink_raster="#",
    source_cost_multiplier="#",
    source_start_cost="#",
    source_resistance_rate="#",
    source_capacity="#",
    source_direction="#",
) -> Raster:
    """CostDistance_sa(in_source_data, in_cost_raster, {maximum_distance}, {out_backlink_raster}, {source_cost_multiplier}, {source_start_cost}, {source_resistance_rate}, {source_capacity}, {source_direction})

       Calculates the least accumulative cost distance for each cell from or
       to the least-cost source over a cost surface.

    INPUTS:
     in_source_data (Composite Geodataset):
         The input source locations.This is a raster or feature (point, line,
         or polygon) identifying the
         cells or locations that will be used to calculate the least
         accumulated cost distance for each output cell location.For rasters,
         the input type can be integer or floating point.
     in_cost_raster (Composite Geodataset):
         A raster defining the impedance or cost to move planimetrically
         through each cell.The value at each cell location represents the cost-
         per-unit distance
         for moving through the cell. Each cell location value is multiplied by
         the cell resolution while also compensating for diagonal movement to
         obtain the total cost of passing through the cell.The values of the
         cost raster can be integer or floating point, but
         they cannot be negative or zero (you cannot have a negative or zero
         cost).
     maximum_distance {Double}:
         The threshold that the accumulative cost values cannot exceed.If an
         accumulative cost distance value exceeds this value, the output
         value for the cell location will be NoData. The maximum distance is
         the extent for which the accumulative cost distances are
         calculated.The default distance is to the edge of the output raster.
     source_cost_multiplier {Double / Field}:
         The multiplier that will be applied to the cost values.This allows for
         control of the mode of travel or the magnitude at a
         source. The greater the multiplier, the greater the cost to move
         through each cell.The values must be greater than zero. The default is
         1.
     source_start_cost {Double / Field}:
         The starting cost that will be used to begin the cost
         calculations.Allows for the specification of the fixed cost associated
         with a
         source. Instead of starting at a cost of zero, the cost algorithm will
         begin with this value.The values must be zero or greater. The default
         is 0.
     source_resistance_rate {Double / Field}:
         This parameter simulates the increase in the effort to overcome costs
         as the accumulative cost increases. It is used to model fatigue of the
         traveler. The growing accumulative cost to reach a cell is multiplied
         by the resistance rate and added to the cost to move into the
         subsequent cell.It is a modified version of a compound interest rate
         formula that is
         used to calculate the apparent cost of moving through a cell. As the
         value of the resistance rate increases, it increases the cost of the
         cells that are visited later. The greater the resistance rate, the
         more additional cost is added to reach the next cell, which is
         compounded for each subsequent movement. Since the resistance rate is
         similar to a compound rate and generally the accumulative cost values
         are very large, small resistance rates are suggested, such as 0.02,
         0.005, or even smaller, depending on the accumulative cost values.The
         values must be zero or greater. The default is 0.
     source_capacity {Double / Field}:
         The cost capacity for the traveler for a source.The cost calculations
         continue for each source until the specified
         capacity is reached.The values must be greater than zero. The default
         capacity is to the
         edge of the output raster.
     source_direction {String / Field}:
         Specifies the direction of the traveler when applying the source
         resistance rate and the source starting cost.FROM_SOURCE-The source
         resistance rate and source starting cost will
         be applied beginning at the input source and travel out to the
         nonsource cells. This is the default.TO_SOURCE-The source resistance
         rate and source starting cost will be
         applied beginning at each nonsource cell and travel back to the input
         source.Specify the FROM_SOURCE or TO_SOURCE keyword, which will be
         applied to
         all sources, or specify a field in the source data that contains the
         keywords to identify the direction of travel for each source. That
         field must contain the string FROM_SOURCE or TO_SOURCE.

    OUTPUTS:
     out_distance_raster (Raster Dataset):
         The output cost distance raster.The cost distance raster identifies,
         for each cell, the least
         accumulative cost distance over a cost surface to the identified
         source locations.A source can be a cell, a set of cells, or one or
         more feature
         locations.The output raster is of floating-point type.
     out_backlink_raster {Raster Dataset}:
         The output cost backlink raster.The backlink raster contains values 0
         through 8, which define the
         direction or identify the next neighboring cell (the succeeding cell)
         along the least accumulative cost path from a cell to reach its least-
         cost source.If the path is to pass into the right neighbor, the cell
         will be
         assigned the value 1, 2 for the lower right diagonal cell, and
         continue clockwise. The value 0 is reserved for source cells."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_source_data,
        in_cost_raster,
        maximum_distance,
        out_backlink_raster,
        source_cost_multiplier,
        source_start_cost,
        source_resistance_rate,
        source_capacity,
        source_direction,
    ):
        out_distance_raster = "#"
        result = arcpy.gp.CostDistance_sa(
            in_source_data,
            in_cost_raster,
            out_distance_raster,
            maximum_distance,
            out_backlink_raster,
            source_cost_multiplier,
            source_start_cost,
            source_resistance_rate,
            source_capacity,
            source_direction,
        )
        return _wrapToolRaster("CostDistance_sa", str(result.getOutput(0)))

    return Wrapper(
        in_source_data,
        in_cost_raster,
        maximum_distance,
        out_backlink_raster,
        source_cost_multiplier,
        source_start_cost,
        source_resistance_rate,
        source_capacity,
        source_direction,
    )


CostDistance.__esri_toolname__ = "CostDistance_sa"
CostDistance.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "::::6", "::::7", "::::8", "::::9", "::::10"]


def CostPath(
    in_destination_data,
    in_cost_distance_raster,
    in_cost_backlink_raster,
    path_type: Literal["EACH_CELL", "EACH_ZONE", "BEST_SINGLE", "#"] | None = "#",
    destination_field="#",
    force_flow_direction_convention: Literal["INPUT_RANGE", "FLOW_DIRECTION", "#"] | None = "#",
) -> Raster:
    """CostPath_sa(in_destination_data, in_cost_distance_raster, in_cost_backlink_raster, {path_type}, {destination_field}, {force_flow_direction_convention})

       Calculates the least-cost path from a source to a destination.

    INPUTS:
     in_destination_data (Composite Geodataset):
         A raster or feature dataset that identifies those cells from which the
         least-cost path is determined to the least costly source.If the input
         is a raster, the input consists of cells that have valid
         values (zero is a valid value), and the remaining cells must be
         assigned NoData.
     in_cost_distance_raster (Composite Geodataset):
         The name of a cost distance raster to be used to determine the least-
         cost path from the destination locations to a source.The cost distance
         raster is usually created with the Cost Distance,
         Cost Allocation or Cost Back Link tools. The cost distance raster
         stores, for each cell, the minimum accumulative cost distance over a
         cost surface from each cell to a set of source cells.
     in_cost_backlink_raster (Composite Geodataset):
         The name of a cost back link raster used to determine the path to
         return to a source via the least-cost path.For each cell in the back
         link raster, a value identifies the neighbor
         that is the next cell on the least accumulative cost path from the
         cell to a single source cell or set of source cells.
     path_type {String}:
         A keyword defining the manner in which the values and zones on the
         input destination data will be interpreted in the cost path
         calculations.EACH_CELL-For each cell with valid values on the input
         destination
         data, a least-cost path is determined and saved on the output raster.
         With this option, each cell of the input destination data is treated
         separately, and a least-cost path is determined for each from
         cell.EACH_ZONE-For each zone on the input destination data, a least-
         cost
         path is determined and saved on the output raster. With this option,
         the least-cost path for each zone begins at the cell with the lowest
         cost distance weighting in the zone.BEST_SINGLE-For all cells on the
         input destination data, the least-
         cost path is derived from the cell with the minimum of the least-cost
         paths to source cells.
     destination_field {Field}:
         The field used to obtain values for the destination locations.Input
         feature data must contain at least one valid field.
     force_flow_direction_convention {Boolean}:
         Specifies whether the input backlink raster will be treated as a flow
         direction raster. Flow direction rasters can have integer values that
         range from 0-255.INPUT_RANGE-The in_cost_backlink_raster parameter
         value will be
         interpreted based on the range of values and whether it is integer or
         float. For a value range of 0-8, the value will be treated as a
         backlink raster. For values 0-255 and integer, the value will be
         treated as a flow direction raster. For a value range of 0-360 and
         floating point, the value will be treated as a back direction
         raster.FLOW_DIRECTION-The in_cost_backlink_raster parameter value will
         be
         treated as a flow direction raster. This is necessary if the flow
         direction raster has a maximum value of 8 or less.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output cost path raster.The output raster is of integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_destination_data,
        in_cost_distance_raster,
        in_cost_backlink_raster,
        path_type,
        destination_field,
        force_flow_direction_convention,
    ):
        out_raster = "#"
        result = arcpy.gp.CostPath_sa(
            in_destination_data,
            in_cost_distance_raster,
            in_cost_backlink_raster,
            out_raster,
            path_type,
            destination_field,
            force_flow_direction_convention,
        )
        return _wrapToolRaster("CostPath_sa", str(result.getOutput(0)))

    return Wrapper(
        in_destination_data,
        in_cost_distance_raster,
        in_cost_backlink_raster,
        path_type,
        destination_field,
        force_flow_direction_convention,
    )


CostPath.__esri_toolname__ = "CostPath_sa"
CostPath.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::5", "::::6", "::::7"]


def CostPathAsPolyline(
    in_destination_data,
    in_cost_distance_raster,
    in_cost_backlink_raster,
    out_polyline_features,
    path_type: Literal["BEST_SINGLE", "EACH_CELL", "EACH_ZONE", "#"] | None = "#",
    destination_field="#",
    force_flow_direction_convention: Literal["INPUT_RANGE", "FLOW_DIRECTION", "#"] | None = "#",
):
    """CostPathAsPolyline_sa(in_destination_data, in_cost_distance_raster, in_cost_backlink_raster, out_polyline_features, {path_type}, {destination_field}, {force_flow_direction_convention})

       Calculates the least-cost path from a source to a destination as a
       line feature.

    INPUTS:
     in_destination_data (Composite Geodataset):
         A raster or feature dataset that identifies those cells from which the
         least-cost path is determined to the least costly source.If the input
         is a raster, it must consist of cells that have valid
         values for the destinations, and the remaining cells must be assigned
         NoData. Zero is a valid value.
     in_cost_distance_raster (Composite Geodataset):
         The cost distance raster to be used to determine the least-cost path
         from the sources to the destinations.The cost distance raster is
         usually created with the Cost Distance,
         Cost Allocation, or Cost Back Link tools. The cost distance raster
         stores, for each cell, the minimum accumulative cost distance over a
         cost surface from each cell to a set of source cells.
     in_cost_backlink_raster (Composite Geodataset):
         The cost backlink raster to be used to determine the path to return to
         a source via the least-cost path, or the shortest path.For each cell
         in a backlink, back direction, or flow direction raster,
         the value identifies the neighbor that is the next cell on the path
         from that cell to a source cell.
     path_type {String}:
         Specifies a keyword defining the manner in which the values and zones
         on the input destination data will be interpreted in the cost path
         calculations.BEST_SINGLE-For all cells on the input destination data,
         the least-
         cost path is derived from the cell with the minimum of the least-cost
         paths to source cells.EACH_ZONE-For each zone on the input
         destination data, a least-cost
         path is determined and saved on the output raster. With this option,
         the least-cost path for each zone begins at the cell with the lowest
         cost distance weighting in the zone.EACH_CELL-For each cell with
         valid values on the input destination
         data, a least-cost path is determined and saved on the output raster.
         With this option, each cell of the input destination data is treated
         separately, and a least-cost path is determined for each cell.
     destination_field {Field}:
         The field to be used to obtain values for the destination locations.If
         the input destination data is feature, it must contain at least one
         valid integer field. The first integer field in that attribute table
         is used by default. If a raster is specified the default is
         thefield. Value
     force_flow_direction_convention {Boolean}:
         Specifies whether the input backlink raster will be treated as a flow
         direction raster. Flow direction rasters can have integer values that
         range from 0-255.INPUT_RANGE-The in_cost_backlink_raster parameter
         value will be
         interpreted based on the range of values and whether it is integer or
         float. For a value range of 0-8, the value will be treated as a
         backlink raster. For values 0-255 and integer, the value will be
         treated as a flow direction raster. For a value range of 0-360 and
         floating point, the value will be treated as a back direction
         raster.FLOW_DIRECTION-The in_cost_backlink_raster parameter value will
         be
         treated as a flow direction raster. This is necessary if the flow
         direction raster has a maximum value of 8 or less.

    OUTPUTS:
     out_polyline_features (Feature Class):
         The output feature class that will hold the least cost path."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_destination_data,
        in_cost_distance_raster,
        in_cost_backlink_raster,
        out_polyline_features,
        path_type,
        destination_field,
        force_flow_direction_convention,
    ):
        result = arcpy.gp.CostPathAsPolyline_sa(
            in_destination_data,
            in_cost_distance_raster,
            in_cost_backlink_raster,
            out_polyline_features,
            path_type,
            destination_field,
            force_flow_direction_convention,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_destination_data,
        in_cost_distance_raster,
        in_cost_backlink_raster,
        out_polyline_features,
        path_type,
        destination_field,
        force_flow_direction_convention,
    )


CostPathAsPolyline.__esri_toolname__ = "CostPathAsPolyline_sa"
CostPathAsPolyline.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6", "::::7"]


def CreateAccuracyAssessmentPoints(
    in_class_data,
    out_points,
    target_field: Literal["CLASSIFIED", "GROUND_TRUTH", "#"] | None = "#",
    num_random_points="#",
    sampling: Literal["STRATIFIED_RANDOM", "EQUALIZED_STRATIFIED_RANDOM", "RANDOM", "#"] | None = "#",
    polygon_dimension_field="#",
):
    """CreateAccuracyAssessmentPoints_sa(in_class_data, out_points, {target_field}, {num_random_points}, {sampling}, {polygon_dimension_field})

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
        result = arcpy.gp.CreateAccuracyAssessmentPoints_sa(
            in_class_data, out_points, target_field, num_random_points, sampling, polygon_dimension_field
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_class_data, out_points, target_field, num_random_points, sampling, polygon_dimension_field)


CreateAccuracyAssessmentPoints.__esri_toolname__ = "CreateAccuracyAssessmentPoints_sa"
CreateAccuracyAssessmentPoints.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6"]


def CreateConstantRaster(
    constant_value, data_type: Literal["INTEGER", "FLOAT", "#"] | None = "#", cell_size="#", extent="#"
) -> Raster:
    """CreateConstantRaster_sa(constant_value, {data_type}, {cell_size}, {extent})

       Creates a raster of a constant value within the extent and cell size
       of the analysis window.

    INPUTS:
     constant_value (Double):
         The constant value with which to populate all the cells in the output
         raster.
     data_type {String}:
         Data type of the output raster dataset.INTEGER-An integer raster will
         be created.FLOAT-A floating-point
         raster will be created.If the specified data type is floating-point,
         the values of the cells
         in the output raster will only be accurate to the constant value of 7
         decimal places, regardless of the output format.
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     extent {Envelope / Extent}:
         The extent for the output raster dataset.The Extent is a Python class.
         In this tool, it is in the form Extent(XMin, YMin, XMax, YMax)
         where XMin and YMin define the lower left coordinate of the extent,
         and XMax and YMax define the upper right coordinate.The coordinates
         are specified in the same map units as the Output
         Coordinate System environment setting.The extent will be the value in
         the environment if specifically set.
         If not specifically set, the default is 0, 0, 250, 250.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster for which each cell will have the specified constant
         value."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(constant_value, data_type, cell_size, extent):
        out_raster = "#"
        result = arcpy.gp.CreateConstantRaster_sa(out_raster, constant_value, data_type, cell_size, extent)
        return _wrapToolRaster("CreateConstantRaster_sa", str(result.getOutput(0)))

    return Wrapper(constant_value, data_type, cell_size, extent)


CreateConstantRaster.__esri_toolname__ = "CreateConstantRaster_sa"
CreateConstantRaster.__esri_toolinfo__ = ["::::2", "::::3", "::::4", "::::5"]


def CreateNormalRaster(cell_size="#", extent="#") -> Raster:
    """CreateNormalRaster_sa({cell_size}, {extent})

       Creates a raster of random values with a normal (Gaussian)
       distribution within the extent and cell size of the analysis window.

    INPUTS:
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     extent {Envelope / Extent}:
         The extent for the output raster dataset.The Extent is a Python class.
         In this tool, it is in the form Extent(XMin, YMin, XMax, YMax)
         where XMin and YMin define the lower left coordinate of the extent,
         and XMax and YMax define the upper right coordinate.The coordinates
         are specified in the same map units as the Output
         Coordinate System environment setting.The extent will be the value in
         the environment if specifically set.
         If not specifically set, the default is 0, 0, 250, 250.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster of normally distributed values with a mean of 0.0
         and a standard deviation of 1.0."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(cell_size, extent):
        out_raster = "#"
        result = arcpy.gp.CreateNormalRaster_sa(out_raster, cell_size, extent)
        return _wrapToolRaster("CreateNormalRaster_sa", str(result.getOutput(0)))

    return Wrapper(cell_size, extent)


CreateNormalRaster.__esri_toolname__ = "CreateNormalRaster_sa"
CreateNormalRaster.__esri_toolinfo__ = ["::::2", "::::3"]


def CreateRandomRaster(seed_value="#", cell_size="#", extent="#") -> Raster:
    """CreateRandomRaster_sa({seed_value}, {cell_size}, {extent})

       Creates a raster of random floating-point values between 0.0 and 1.0
       within the extent and cell size of the analysis window.

    INPUTS:
     seed_value {Double}:
         A value to be used to reseed the random number generator.This may be
         an integer or floating-point number. Rasters are not
         permitted as input. The random number generator is
         automatically seeded with the
         current value of the system clock (seconds since January 1, 1970). The
         range of permissible values for the seed value is -2+ 1 to 2(or
         -2,147,483,647 to 2,147,483,648). 3131
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     extent {Envelope / Extent}:
         The extent for the output raster dataset.The Extent is a Python class.
         In this tool, it is in the form Extent(XMin, YMin, XMax, YMax)
         where XMin and YMin define the lower left coordinate of the extent,
         and XMax and YMax define the upper right coordinate.The coordinates
         are specified in the same map units as the Output
         Coordinate System environment setting.The extent will be the value in
         the environment if specifically set.
         If not specifically set, the default is 0, 0, 250, 250.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster of randomly distributed values with a range of 0.0
         to 1.0"""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(seed_value, cell_size, extent):
        out_raster = "#"
        result = arcpy.gp.CreateRandomRaster_sa(out_raster, seed_value, cell_size, extent)
        return _wrapToolRaster("CreateRandomRaster_sa", str(result.getOutput(0)))

    return Wrapper(seed_value, cell_size, extent)


CreateRandomRaster.__esri_toolname__ = "CreateRandomRaster_sa"
CreateRandomRaster.__esri_toolinfo__ = ["::::2", "::::3", "::::4"]


def CreateSignatures(
    in_raster_bands,
    in_sample_data,
    out_signature_file,
    compute_covariance: Literal["COVARIANCE", "MEAN_ONLY", "#"] | None = "#",
    sample_field="#",
):
    """CreateSignatures_sa(in_raster_bands;in_raster_bands..., in_sample_data, out_signature_file, {compute_covariance}, {sample_field})

       Creates an ASCII signature file of classes defined by input sample
       data and a set of raster bands.

    INPUTS:
     in_raster_bands (Composite Geodataset):
         The input raster bands for which to create the signatures.They can be
         integer or floating point type.
     in_sample_data (Composite Geodataset):
         The input delineating the set of class samples.The input can be an
         integer raster or a feature dataset.
     compute_covariance {Boolean}:
         Specifies whether covariance matrices in addition to the means are
         calculated.COVARIANCE-Both the covariance matrices and the means for
         all classes
         of the in_sample_data will be computed. This is the
         default.MEAN_ONLY-Only the means for all classes of the in_sample_data
         will be
         calculated.
     sample_field {Field}:
         Field of the input raster or feature sample data to assign values to
         the sampled locations (classes).Only integer or string fields are
         valid fields. The specified number
         or string will be used as the Class name in the output signature file.

    OUTPUTS:
     out_signature_file (File):
         The output signature file.A .gsg extension must be specified."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_raster_bands, in_sample_data, out_signature_file, compute_covariance, sample_field):
        result = arcpy.gp.CreateSignatures_sa(
            in_raster_bands, in_sample_data, out_signature_file, compute_covariance, sample_field
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_raster_bands, in_sample_data, out_signature_file, compute_covariance, sample_field)


CreateSignatures.__esri_toolname__ = "CreateSignatures_sa"
CreateSignatures.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5"]


def Curvature(in_raster, z_factor="#", out_profile_curve_raster="#", out_plan_curve_raster="#") -> Raster:
    """Curvature_sa(in_raster, {z_factor}, {out_profile_curve_raster}, {out_plan_curve_raster})

       Calculates the curvature of a raster surface and, optionally, includes
       profile and plan curvature.

    INPUTS:
     in_raster (Composite Geodataset):
         The input surface raster.
     z_factor {Double}:
         The number of ground x,y units in one surface z-unit.The z-factor
         adjusts the units of measure for the z-units when they
         are different from the x,y units of the input surface. The z-values of
         the input surface are multiplied by the z-factor when calculating the
         final output surface.If the x,y units and z-units are in the same
         units of measure, the
         z-factor is 1. This is the default.If the x,y units and z-units are in
         different units of measure, the
         z-factor must be set to the appropriate factor or the results will be
         incorrect. For example, if the z-units are feet and the x,y units are
         meters, use a z-factor of 0.3048 to convert the z-units from feet to
         meters (1 foot = 0.3048 meter).

    OUTPUTS:
     out_curvature_raster (Raster Dataset):
         The output curvature raster.It will be floating-point type.
     out_profile_curve_raster {Raster Dataset}:
         Output profile curve raster dataset.This is the curvature of the
         surface in the direction of slope.It will be floating-point type.
     out_plan_curve_raster {Raster Dataset}:
         Output plan curve raster dataset.This is the curvature of the surface
         perpendicular to the slope
         direction.It will be floating-point type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, z_factor, out_profile_curve_raster, out_plan_curve_raster):
        out_curvature_raster = "#"
        result = arcpy.gp.Curvature_sa(
            in_raster, out_curvature_raster, z_factor, out_profile_curve_raster, out_plan_curve_raster
        )
        return _wrapToolRaster("Curvature_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, z_factor, out_profile_curve_raster, out_plan_curve_raster)


Curvature.__esri_toolname__ = "Curvature_sa"
Curvature.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5"]


def CutFill(in_before_surface, in_after_surface, z_factor="#") -> Raster:
    """CutFill_sa(in_before_surface, in_after_surface, {z_factor})

       Calculates the volume change between two surfaces. This is typically
       used for cut and fill operations.

    INPUTS:
     in_before_surface (Composite Geodataset):
         The input representing the surface before the cut or fill operation.
     in_after_surface (Composite Geodataset):
         The input representing the surface after the cut or fill operation.
     z_factor {Double}:
         The number of ground x,y units in one surface z-unit.The z-factor
         adjusts the units of measure for the z-units when they
         are different from the x,y units of the input surface. The z-values of
         the input surface are multiplied by the z-factor when calculating the
         final output surface.If the x,y units and z-units are in the same
         units of measure, the
         z-factor is 1. This is the default.If the x,y units and z-units are in
         different units of measure, the
         z-factor must be set to the appropriate factor or the results will be
         incorrect. For example, if the z-units are feet and the x,y units are
         meters, use a z-factor of 0.3048 to convert the z-units from feet to
         meters (1 foot = 0.3048 meter).

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster defining regions of cut and of fill.The values show
         the locations and amounts where the surface has been
         added to or removed from."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_before_surface, in_after_surface, z_factor):
        out_raster = "#"
        result = arcpy.gp.CutFill_sa(in_before_surface, in_after_surface, out_raster, z_factor)
        return _wrapToolRaster("CutFill_sa", str(result.getOutput(0)))

    return Wrapper(in_before_surface, in_after_surface, z_factor)


CutFill.__esri_toolname__ = "CutFill_sa"
CutFill.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def DarcyFlow(
    in_head_raster,
    in_porosity_raster,
    in_thickness_raster,
    in_transmissivity_raster,
    out_direction_raster="#",
    out_magnitude_raster="#",
) -> Raster:
    """DarcyFlow_sa(in_head_raster, in_porosity_raster, in_thickness_raster, in_transmissivity_raster, {out_direction_raster}, {out_magnitude_raster})

       Calculates the groundwater volume balance residual and other outputs
       for steady flow in an aquifer.

    INPUTS:
     in_head_raster (Composite Geodataset):
         The input raster where each cell value represents the groundwater head
         elevation at that location.The head is typically an elevation above
         some datum, such as mean sea
         level.
     in_porosity_raster (Composite Geodataset):
         The input raster where each cell value represents the effective
         formation porosity at that location.
     in_thickness_raster (Composite Geodataset):
         The input raster where each cell value represents the saturated
         thickness at that location.The value for the thickness is interpreted
         from geological properties
         of the aquifer.
     in_transmissivity_raster (Composite Geodataset):
         The input raster where each cell value represents the formation
         transmissivity at that location.The transmissivity of an aquifer is
         defined as the hydraulic
         conductivity K times the saturated aquifer thickness b, as units of
         length squared over time. This property is generally estimated from
         field experimental data such as pumping tests. Tables 1 and 2 in How
         Darcy Flow and Darcy Velocity work list ranges of hydraulic
         conductivities for some generalized geologic materials.

    OUTPUTS:
     out_volume_raster (Raster Dataset):
         The output volume balance residual raster.Each cell value represents
         the groundwater volume balance residual for
         steady flow in an aquifer, as determined by Darcy's Law.
     out_direction_raster {Raster Dataset}:
         The output flow direction raster.Each cell value represents the
         direction of the seepage velocity
         vector (average linear velocity) at the center of the cell, calculated
         as the average value of the seepage velocity through the four faces of
         the cell.It is used with the output magnitude raster to describe the
         flow
         vector.
     out_magnitude_raster {Raster Dataset}:
         An optional output raster where each cell value represents the
         magnitude of the seepage velocity vector (average linear velocity) at
         the center of the cell, calculated as the average value of the seepage
         velocity through the four faces of the cell.It is used with the output
         direction raster to describe the flow
         vector."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_head_raster,
        in_porosity_raster,
        in_thickness_raster,
        in_transmissivity_raster,
        out_direction_raster,
        out_magnitude_raster,
    ):
        out_volume_raster = "#"
        result = arcpy.gp.DarcyFlow_sa(
            in_head_raster,
            in_porosity_raster,
            in_thickness_raster,
            in_transmissivity_raster,
            out_volume_raster,
            out_direction_raster,
            out_magnitude_raster,
        )
        return _wrapToolRaster("DarcyFlow_sa", str(result.getOutput(0)))

    return Wrapper(
        in_head_raster,
        in_porosity_raster,
        in_thickness_raster,
        in_transmissivity_raster,
        out_direction_raster,
        out_magnitude_raster,
    )


DarcyFlow.__esri_toolname__ = "DarcyFlow_sa"
DarcyFlow.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::6", "::::7"]


def DarcyVelocity(
    in_head_raster, in_porosity_raster, in_thickness_raster, in_transmissivity_raster, out_magnitude_raster
) -> Raster:
    """DarcyVelocity_sa(in_head_raster, in_porosity_raster, in_thickness_raster, in_transmissivity_raster)

       Calculates the groundwater seepage velocity vector (direction and
       magnitude) for steady flow in an aquifer.

    INPUTS:
     in_head_raster (Composite Geodataset):
         The input raster where each cell value represents the groundwater head
         elevation at that location.The head is typically an elevation above
         some datum, such as mean sea
         level.
     in_porosity_raster (Composite Geodataset):
         The input raster where each cell value represents the effective
         formation porosity at that location.
     in_thickness_raster (Composite Geodataset):
         The input raster where each cell value represents the saturated
         thickness at that location.The value for the thickness is interpreted
         from geological properties
         of the aquifer.
     in_transmissivity_raster (Composite Geodataset):
         The input raster where each cell value represents the formation
         transmissivity at that location.The transmissivity of an aquifer is
         defined as the hydraulic
         conductivity K times the saturated aquifer thickness b, as units of
         length squared over time. This property is generally estimated from
         field experimental data such as pumping tests. Tables 1 and 2 in How
         Darcy Flow and Darcy Velocity work list ranges of hydraulic
         conductivities for some generalized geologic materials.

    OUTPUTS:
     out_direction_raster (Raster Dataset):
         The output flow direction raster.Each cell value represents the
         direction of the seepage velocity
         vector (average linear velocity) at the center of the cell, calculated
         as the average value of the seepage velocity through the four faces of
         the cell.It is used with the output magnitude raster to describe the
         flow
         vector.
     out_magnitude_raster (Raster Dataset):
         The output flow direction raster.Each cell value represents the
         direction of the seepage velocity
         vector (average linear velocity) at the center of the cell, calculated
         as the average value of the seepage velocity through the four faces of
         the cell.It is used with the output magnitude raster to describe the
         flow
         vector."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_head_raster, in_porosity_raster, in_thickness_raster, in_transmissivity_raster, out_magnitude_raster
    ):
        out_direction_raster = "#"
        result = arcpy.gp.DarcyVelocity_sa(
            in_head_raster,
            in_porosity_raster,
            in_thickness_raster,
            in_transmissivity_raster,
            out_direction_raster,
            out_magnitude_raster,
        )
        return _wrapToolRaster("DarcyVelocity_sa", str(result.getOutput(0)))

    return Wrapper(
        in_head_raster, in_porosity_raster, in_thickness_raster, in_transmissivity_raster, out_magnitude_raster
    )


DarcyVelocity.__esri_toolname__ = "DarcyVelocity_sa"
DarcyVelocity.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::6"]


def DeepLearningModelToEcd(in_deep_learning_model, in_classification_info_json, out_classifier_definition):
    """DeepLearningModelToEcd_sa(in_deep_learning_model, in_classification_info_json, out_classifier_definition)

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
        result = arcpy.gp.DeepLearningModelToEcd_sa(
            in_deep_learning_model, in_classification_info_json, out_classifier_definition
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_deep_learning_model, in_classification_info_json, out_classifier_definition)


DeepLearningModelToEcd.__esri_toolname__ = "DeepLearningModelToEcd_sa"
DeepLearningModelToEcd.__esri_toolinfo__ = ["::::1", "::::2", "::::3"]


def Dendrogram(
    in_signature_file,
    out_dendrogram_file,
    distance_calculation: Literal["VARIANCE", "MEAN_ONLY", "#"] | None = "#",
    line_width="#",
):
    """Dendrogram_sa(in_signature_file, out_dendrogram_file, {distance_calculation}, {line_width})

       Constructs a tree diagram (dendrogram) showing attribute distances
       between sequentially merged classes in a signature file.

    INPUTS:
     in_signature_file (File):
         Input signature file whose class signatures are used to produce a
         dendrogram.A .gsg extension is required.
     distance_calculation {Boolean}:
         Specifies the manner in which the distances between classes in
         multidimensional attribute space are defined.VARIANCE-The distances
         between classes will be computed based on the
         variances and the Euclidean distance between the means of their
         signatures.MEAN_ONLY-The distances between classes will be determined
         by the
         Euclidean distances between the means of the class signatures only.
     line_width {Long}:
         Sets the width of the dendrogram in number of characters on a line.The
         default is 78.

    OUTPUTS:
     out_dendrogram_file (File):
         The output dendrogram ASCII file.The extension can be .txt or .asc."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_signature_file, out_dendrogram_file, distance_calculation, line_width):
        result = arcpy.gp.Dendrogram_sa(in_signature_file, out_dendrogram_file, distance_calculation, line_width)
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_signature_file, out_dendrogram_file, distance_calculation, line_width)


Dendrogram.__esri_toolname__ = "Dendrogram_sa"
Dendrogram.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4"]


def DeriveContinuousFlow(
    in_surface_raster,
    in_depressions_data="#",
    in_weight_raster="#",
    out_flow_direction_raster="#",
    flow_direction_type: Literal["D8", "MFD", "#"] | None = "#",
    force_flow: Literal["NORMAL", "FORCE", "#"] | None = "#",
) -> Raster:
    """DeriveContinuousFlow_sa(in_surface_raster, {in_depressions_data}, {in_weight_raster}, {out_flow_direction_raster}, {flow_direction_type}, {force_flow})

       Generates a raster of accumulated flow into each cell from an input
       surface raster with no prior sink or depression filling required.

    INPUTS:
     in_surface_raster (Composite Geodataset):
         The input raster representing a continuous surface.
     in_depressions_data {Composite Geodataset}:
         An optional dataset that defines real depressions.The depressions can
         be defined either through a raster or a feature
         layer.If input is a raster, the depression cells must take a valid
         value,
         including zero, and the areas that are not depressions must be NoData.
     in_weight_raster {Composite Geodataset}:
         An optional input raster dataset that defines the fraction of flow
         that contributes to flow accumulation at each cell.The weight is only
         applied to the accumulation of flow.If no accumulation weight raster
         is specified, a default weight of 1
         will be applied to each cell.
     flow_direction_type {String}:
         Specifies the type of flow method that will be used when computing
         flow directions.D8-Flow direction will be determined by the D8 method.
         This method
         assigns flow direction to the steepest downslope neighbor. This is the
         default.MFD-Flow direction will be based on the MFD flow method. Flow
         direction will be partitioned across downslope neighbors according to
         an adaptive partition exponent.
     force_flow {Boolean}:
         Specifies whether edge cells will always flow outward or follow normal
         flow rules.NORMAL-If the maximum drop on the inside of an edge cell is
         greater
         than zero, the flow direction will be determined as usual; otherwise,
         the flow direction will be toward the edge. Cells that should flow
         from the edge of the surface raster inward will do so. This is the
         default.FORCE-All cells at the edge of the surface raster will flow
         outward
         from the surface raster.

    OUTPUTS:
     out_accumulation_raster (Raster Dataset):
         The output raster representing flow accumulation (number of upstream
         cells draining to each cell).The output raster is of floating-point
         type.
     out_flow_direction_raster {Raster Dataset}:
         The output raster that shows the direction of flow at each cell using
         the D8 or Multiple Flow Direction (MFD) method.The output is of
         integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_surface_raster,
        in_depressions_data,
        in_weight_raster,
        out_flow_direction_raster,
        flow_direction_type,
        force_flow,
    ):
        out_accumulation_raster = "#"
        result = arcpy.gp.DeriveContinuousFlow_sa(
            in_surface_raster,
            out_accumulation_raster,
            in_depressions_data,
            in_weight_raster,
            out_flow_direction_raster,
            flow_direction_type,
            force_flow,
        )
        return _wrapToolRaster("DeriveContinuousFlow_sa", str(result.getOutput(0)))

    return Wrapper(
        in_surface_raster,
        in_depressions_data,
        in_weight_raster,
        out_flow_direction_raster,
        flow_direction_type,
        force_flow,
    )


DeriveContinuousFlow.__esri_toolname__ = "DeriveContinuousFlow_sa"
DeriveContinuousFlow.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7"]


def DeriveStreamAsLine(
    in_surface_raster,
    out_stream_features,
    in_depressions_data="#",
    in_weight_raster="#",
    accumulation_threshold="#",
    stream_designation_method: Literal["CONSTANT", "UNIQUE", "STRAHLER", "SHREVE", "HACK", "ALL", "#"] | None = "#",
    simplify: Literal["SIMPLIFY", "NO_SIMPLIFY", "#"] | None = "#",
):
    """DeriveStreamAsLine_sa(in_surface_raster, out_stream_features, {in_depressions_data}, {in_weight_raster}, {accumulation_threshold}, {stream_designation_method}, {simplify})

       Generates stream line features from an input surface raster with no
       prior sink or depression filling required.

    INPUTS:
     in_surface_raster (Composite Geodataset):
         The input surface raster.
     in_depressions_data {Composite Geodataset}:
         An optional dataset that defines real depressions.The depressions can
         be defined either through a raster or a feature
         layer.If input is a raster, the depression cells must take a valid
         value,
         including zero, and the areas that are not depressions must be NoData.
     in_weight_raster {Composite Geodataset}:
         An optional input raster dataset that defines the fraction of flow
         that contributes to flow accumulation at each cell.The weight is only
         applied to the accumulation of flow.If no accumulation weight raster
         is specified, a default weight of 1
         will be applied to each cell.
     accumulation_threshold {Areal Unit}:
         The threshold for determining whether a given cell is part of a stream
         in terms of the total area that flows into such cell.
     stream_designation_method {String}:
         Specifies the unique value or order of the streams in the output
         attribute table.CONSTANT-The output stream segments will all equal 1.
         This is the
         default.UNIQUE-Each stream will have a unique ID between intersections
         in the
         output.STRAHLER-The Strahler method, in which stream order only
         increases
         when streams of the same order intersect, will be used. The
         intersection of a first-order and second-order link will remain a
         second-order link, rather than creating a third-order link.SHREVE-The
         Shreve method, in which stream order is assigned by
         magnitude, will be used. All links with no tributaries are assigned a
         magnitude (order) of one. Magnitudes are additive downslope. When two
         links intersect, their magnitudes are added and assigned to the
         downslope link.HACK-The Hack method, in which each stream segment is
         assigned an
         order greater than the stream or river to which it discharges, will be
         used. For example, the main river channel is assigned an order of 1,
         all stream segments discharging to it are assigned an order of 2, any
         stream discharging to an order 2 stream is assigned an order of 3, and
         so on.ALL-The output attribute table will show each stream segment
         designation based on all methods.
     simplify {Boolean}:
         Specifies whether the output stream lines will be smoothed into
         simpler shapes.NO_SIMPLIFY-The stream feature lines will not be
         smoothed.SIMPLIFY-The
         stream feature lines will be simplified using the
         Douglas-Peucker algorithm with a tolerance of sqrt(0.5) * cell size.
         This is the default.

    OUTPUTS:
     out_stream_features (Feature Class):
         The output feature class that will contain the identified streams."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_surface_raster,
        out_stream_features,
        in_depressions_data,
        in_weight_raster,
        accumulation_threshold,
        stream_designation_method,
        simplify,
    ):
        result = arcpy.gp.DeriveStreamAsLine_sa(
            in_surface_raster,
            out_stream_features,
            in_depressions_data,
            in_weight_raster,
            accumulation_threshold,
            stream_designation_method,
            simplify,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_surface_raster,
        out_stream_features,
        in_depressions_data,
        in_weight_raster,
        accumulation_threshold,
        stream_designation_method,
        simplify,
    )


DeriveStreamAsLine.__esri_toolname__ = "DeriveStreamAsLine_sa"
DeriveStreamAsLine.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6", "::::7"]


def DeriveStreamAsRaster(
    in_surface_raster,
    in_depressions_data="#",
    in_weight_raster="#",
    accumulation_threshold="#",
    stream_designation_method: Literal["CONSTANT", "UNIQUE", "STRAHLER", "SHREVE", "HACK", "#"] | None = "#",
    force_flow: Literal["NORMAL", "FORCE", "#"] | None = "#",
) -> Raster:
    """DeriveStreamAsRaster_sa(in_surface_raster, {in_depressions_data}, {in_weight_raster}, {accumulation_threshold}, {stream_designation_method}, {force_flow})

       Generates a stream raster from an input surface raster with no prior
       sink or depression filling required.

    INPUTS:
     in_surface_raster (Composite Geodataset):
         The input surface raster.
     in_depressions_data {Composite Geodataset}:
         An optional dataset that defines real depressions.The depressions can
         be defined either through a raster or a feature
         layer.If input is a raster, the depression cells must take a valid
         value,
         including zero, and the areas that are not depressions must be NoData.
     in_weight_raster {Composite Geodataset}:
         An optional input raster dataset that defines the fraction of flow
         that contributes to flow accumulation at each cell.The weight is only
         applied to the accumulation of flow.If no accumulation weight raster
         is specified, a default weight of 1
         will be applied to each cell.
     accumulation_threshold {Areal Unit}:
         The threshold for determining whether a given cell is part of a stream
         in terms of the total area that flows into such cell.
     stream_designation_method {String}:
         Specifies the unique or order of the streams in the
         output.CONSTANT-The output cell values will all equal 1. This is the
         default.UNIQUE-Each stream will have a unique ID between intersections
         in the
         output.STRAHLER-The Strahler method, in which stream order only
         increases
         when streams of the same order intersect, will be used. The
         intersection of a first-order and second-order link will remain a
         second-order link, rather than creating a third-order link.SHREVE-The
         Shreve method, in which stream order is assigned by
         magnitude, will be used. All links with no tributaries are assigned a
         magnitude (order) of one. Magnitudes are additive downslope. When two
         links intersect, their magnitudes are added and assigned to the
         downslope link.HACK-The Hack method, in which each stream segment is
         assigned an
         order greater than the stream or river to which it discharges, will be
         used. For example, the main river channel is assigned an order of 1,
         all stream segments discharging to it are assigned an order of 2, any
         stream discharging to an order 2 stream is assigned an order of 3, and
         so on.
     force_flow {Boolean}:
         Specifies whether edge cells will always flow outward or follow normal
         flow rules.NORMAL-If the maximum drop on the inside of an edge cell is
         greater
         than zero, the flow direction will be determined as usual; otherwise,
         the flow direction will be toward the edge. Cells that should flow
         from the edge of the surface raster inward will do so. This is the
         default.FORCE-All cells at the edge of the surface raster will flow
         outward
         from the surface raster.

    OUTPUTS:
     out_stream_raster (Raster Dataset):
         The output raster representing stream locations."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_surface_raster,
        in_depressions_data,
        in_weight_raster,
        accumulation_threshold,
        stream_designation_method,
        force_flow,
    ):
        out_stream_raster = "#"
        result = arcpy.gp.DeriveStreamAsRaster_sa(
            in_surface_raster,
            out_stream_raster,
            in_depressions_data,
            in_weight_raster,
            accumulation_threshold,
            stream_designation_method,
            force_flow,
        )
        return _wrapToolRaster("DeriveStreamAsRaster_sa", str(result.getOutput(0)))

    return Wrapper(
        in_surface_raster,
        in_depressions_data,
        in_weight_raster,
        accumulation_threshold,
        stream_designation_method,
        force_flow,
    )


DeriveStreamAsRaster.__esri_toolname__ = "DeriveStreamAsRaster_sa"
DeriveStreamAsRaster.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7"]


def Diff(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """Diff_sa(in_raster_or_constant1, in_raster_or_constant2)

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


Diff.__esri_toolname__ = "Diff_sa"
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
    """DimensionalMovingStatistics_sa(in_raster, {dimension}, {backward_window}, {forward_window}, {nodata_handling}, {statistics_type}, {percentile_value}, {percentile_interpolation_type}, {circular_wrap_value})

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
        result = arcpy.gp.DimensionalMovingStatistics_sa(
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


DimensionalMovingStatistics.__esri_toolname__ = "DimensionalMovingStatistics_sa"
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


def DistanceAccumulation(
    in_source_data,
    in_barrier_data="#",
    in_surface_raster="#",
    in_cost_raster="#",
    in_vertical_raster="#",
    vertical_factor="#",
    in_horizontal_raster="#",
    horizontal_factor="#",
    out_back_direction_raster="#",
    out_source_direction_raster="#",
    out_source_location_raster="#",
    source_initial_accumulation="#",
    source_maximum_accumulation="#",
    source_cost_multiplier="#",
    source_direction="#",
    distance_method: Literal["PLANAR", "GEODESIC", "#"] | None = "#",
) -> Raster:
    """DistanceAccumulation_sa(in_source_data, {in_barrier_data}, {in_surface_raster}, {in_cost_raster}, {in_vertical_raster}, {vertical_factor}, {in_horizontal_raster}, {horizontal_factor}, {out_back_direction_raster}, {out_source_direction_raster}, {out_source_location_raster}, {source_initial_accumulation}, {source_maximum_accumulation}, {source_cost_multiplier}, {source_direction}, {distance_method})

       Calculates accumulated distance for each cell to sources, allowing for
       straight-line distance, cost distance, and true surface distance, as
       well as vertical and horizontal cost factors.

    INPUTS:
     in_source_data (Composite Geodataset):
         The input source locations.This is a raster or feature (point, line,
         or polygon) identifying the
         cells or locations that will be used to calculate the least
         accumulated cost distance for each output cell location.For rasters,
         the input type can be integer or floating point.
     in_barrier_data {Composite Geodataset}:
         The dataset that defines the barriers.The barriers can be defined by
         an integer or a floating-point raster,
         or by a point, line, or polygon feature.For a raster barrier, the
         barrier must have a valid value, including
         zero, and the areas that are not barriers must be NoData.
     in_surface_raster {Composite Geodataset}:
         A raster defining the elevation values at each cell location.The
         values are used to calculate the actual surface distance covered
         when passing between cells.
     in_cost_raster {Composite Geodataset}:
         A raster defining the impedance or cost to move planimetrically
         through each cell.The value at each cell location represents the cost-
         per-unit distance
         for moving through the cell. Each cell location value is multiplied by
         the cell resolution while also compensating for diagonal movement to
         obtain the total cost of passing through the cell.The values of the
         cost raster can be integer or floating point. Cost
         raster values that are negative or zero are invalid but will be
         treated as small positive cost values.
     in_vertical_raster {Composite Geodataset}:
         A raster defining the z-values for each cell location.The values are
         used for calculating the slope used to identify the
         vertical factor incurred when moving from one cell to another.
     vertical_factor {Vertical Factor}:
         The Vertical factor object defines the relationship between the
         vertical cost factor and the vertical relative moving angle
         (VRMA).There are several factors with modifiers that identify a
         defined
         vertical factor graph. Additionally, a table can be used to create a
         custom graph. The graphs are used to identify the vertical factor used
         in calculating the total cost for moving into a neighboring cell.In
         the descriptions below, two acronyms are used: VF stands for
         vertical factor, which defines the vertical difficulty encountered in
         moving from one cell to the next; VRMA stands for vertical relative
         moving angle, which identifies the slope angle between the FROM or
         processing cell and the TO cell. The object comes in the
         following forms:        VfBinary,
         VfLinear, VfInverseLinear, VfSymLinear, VfSymInverseLinear,
         VfCos, VfSec, VfSec, VfCosSec, VfSecCos, VfHikingTime,
         VfBidirHikingTime, VfTable.The definitions and parameters of these are
         the following:         VfBinary({zeroFactor}, {lowCutAngle},
         {highCutAngle})
         If the VRMA is greater than the low-cut angle and less than the high-
         cut angle, the VF is set to the value associated with the zero factor;
         otherwise, it is infinity. VfLinear({zeroFactor},
         {lowCutAngle}, {highCutAngle},
         {slope})         The VF is a linear function of the VRMA.
         VfInverseLinear({zeroFactor}, {lowCutAngle}, {highCutAngle},
         {slope})         The VF is an inverse linear function of the VRMA.
         VfSymLinear({zeroFactor}, {lowCutAngle}, {highCutAngle},
         {slope})         The VF is a linear function of the VRMA in either the
         negative or
         positive side of the VRMA, and the two linear functions are
         symmetrical with respect to the VF (y) axis.
         VfSymInverseLinear({zeroFactor}, {lowCutAngle},
         {highCutAngle}, {slope})         The VF is an inverse linear function
         of the VRMA in either the
         negative or positive side of the VRMA, and the two linear functions
         are symmetrical with respect to the VF (y) axis.
         VfCos({lowCutAngle}, {highCutAngle}, {cosPower})         The
         VF is the cosine-based function of the VRMA.
         VfSec({lowCutAngle}, {highCutAngle}, {secPower})         The
         VF is the secant-based function of the VRMA.
         VfCosSec({lowCutAngle}, {highCutAngle}, {cosPower},
         {secPower})         The VF is the cosine-based function of the VRMA
         when the VRMA is
         negative and is the secant-based function of the VRMA when the VRMA is
         not negative. VfSecCos({lowCutAngle}, {highCutAngle},
         {secPower},
         {cos_power})         The VF is the secant-based function of the VRMA
         when the VRMA is
         negative and is the cosine-based function of the VRMA when the VRMA is
         not negative. VfHikingTime({lowCutAngle}, {highCutAngle})
         The VF is
         the hiking time function of the VRMA.
         VfBidirHikingTime({lowCutAngle}, {highCutAngle})         The
         VF is a bidirectional modified hiking time function of the VRMA.
         VfTable(inTable)         A table file will be used to define
         the vertical factor graph used to
         determine the VFs.The modifiers to the vertical parameters are the
         following:zeroFactor-The vertical factor used when the VRMA is zero.
         This factor
         positions the y-intercept of the specified function. By definition,
         the zero factor is not applicable to any of the trigonometric vertical
         functions (Cos, Sec, Cos-Sec, or Sec-Cos). The y-intercept is defined
         by these functions.lowCutAngle-The VRMA angle below which the VF will
         be set to infinity.highCutAngle-The VRMA angle above which the VF will
         be set to
         infinity.slope-The slope of the straight line used with the VfLinear
         and
         VfInverseLinear parameters. The slope is specified as a fraction of
         rise over run (for example, 45 percent slope is 1/45, which is input
         as 0.02222).inTable-The name of the table defining the VF.
     in_horizontal_raster {Composite Geodataset}:
         A raster defining the horizontal direction at each cell.The values on
         the raster must be integers ranging from 0 to 360, with
         0 degrees being north, or toward the top of the screen, and increasing
         clockwise. Flat areas should be given a value of -1. The values at
         each location will be used in conjunction with the horizontal_factor
         parameter to determine the horizontal cost incurred when moving from a
         cell to its neighbors.
     horizontal_factor {Horizontal Factor}:
         The Horizontal Factor object defines the relationship between the
         horizontal cost factor and the horizontal relative moving angle.There
         are several factors with modifiers that identify a defined
         horizontal factor graph. Additionally, a table can be used to create a
         custom graph. The graphs are used to identify the horizontal factor
         used in calculating the total cost of moving into a neighboring
         cell.In the descriptions below, two acronyms are used: HF stands for
         horizontal factor, which defines the horizontal difficulty encountered
         when moving from one cell to the next; HRMA stands for horizontal
         relative moving angle, which identifies the angle between the
         horizontal direction from a cell and the moving direction. The
         object comes in the following forms:        HfBinary,
         HfForward, HfLinear, HfInverseLinear, and HfTable. The
         definitions and parameters of these are the following:
         HfBinary({zeroFactor}, {cutAngle})          If the HRMA is
         less than the cut angle, the HF is set to the value
         associated with the zero factor; otherwise, it is infinity.
         HfForward({zeroFactor}, {sideValue})          Only forward
         movement is allowed. The HRMA must be greater than or
         equal to 0 and less than 90 degrees (0 <= HRMA < 90). If the HRMA is
         greater than 0 and less than 45 degrees, the HF for the cell is set to
         the value associated with the zero factor. If the HRMA is greater than
         or equal to 45 degrees, the side value modifier value is used. The HF
         for any HRMA equal to or greater than 90 degrees is set to infinity.
         HfLinear({zeroFactor}, {cutAngle}, {slope})          The HF
         is a linear function of the HRMA.
         HfInverseLinear({zeroFactor}, {cutAngle}, {slope})
         The HF is an inverse linear function of the HRMA.
         HfTable(inTable)          A table file will be used to
         define the horizontal factor graph used
         to determine the HFs. The modifiers to the horizontal keywords
         are the following:
         zeroFactor-The horizontal factor to be used when the HRMA is 0. This
         factor positions the y-intercept for any of the horizontal factor
         functions.cutAngle-The HRMA angle beyond which the HF will be set to
         infinity.slope-The slope of the straight line used with the HfLinear
         and
         HfInverseLinear horizontal factor keywords. The slope is specified as
         a fraction of rise over run (for example, 45 percent slope is 1/45,
         which is input as 0.02222).sideValue-The HF when the HRMA is greater
         than or equal to 45 degrees
         and less than 90 degrees when the HfForward horizontal factor keyword
         is specified.inTable-The name of the table defining the HF.
     source_initial_accumulation {Double / Field}:
         The initial accumulative cost that will be used to begin the cost
         calculation.Allows for the specification of the fixed cost associated
         with a
         source. Instead of starting at a cost of zero, the cost algorithm will
         begin with this value.The values must be zero or greater. The default
         is 0.
     source_maximum_accumulation {Double / Field}:
         The maximum accumulation for the traveler for a source.The cost
         calculations continue for each source until the specified
         accumulation is reached.The values must be greater than zero. The
         default accumulation is to
         the edge of the output raster.
     source_cost_multiplier {Double / Field}:
         The multiplier that will be applied to the cost values.This allows for
         control of the mode of travel or the magnitude at a
         source. The greater the multiplier, the greater the cost to move
         through each cell.The values must be greater than zero. The default is
         1.
     source_direction {String / Field}:
         Specifies the direction of the traveler when applying horizontal and
         vertical factors.FROM_SOURCE-The horizontal factor and vertical factor
         will be applied
         beginning at the input source and travel out to the nonsource cells.
         This is the default.TO_SOURCE-The horizontal factor and vertical
         factor will be applied
         beginning at each nonsource cell and travel back to the input
         source.Specify the FROM_SOURCE or TO_SOURCE keyword, which will be
         applied to
         all sources, or specify a field in the source data that contains the
         keywords to identify the direction of travel for each source. That
         field must contain the string FROM_SOURCE or TO_SOURCE.
     distance_method {String}:
         Specifies whether the distance will be calculated using a planar (flat
         earth) or a geodesic (ellipsoid) method.PLANAR-The distance
         calculation will be performed on a projected flat
         plane using a 2D Cartesian coordinate system. This is the
         default.GEODESIC-The distance calculation will be performed on the
         ellipsoid.
         Regardless of input or output projection, the results will not change.

    OUTPUTS:
     out_distance_accumulation_raster (Raster Dataset):
         The output distance raster.The output raster is of floating-point
         type.
     out_back_direction_raster {Raster Dataset}:
         The back direction raster contains the calculated direction in
         degrees. The direction identifies the next cell along the shortest
         path back to the closest source while avoiding barriers.The range of
         values is from 0 degrees to 360 degrees, with 0 reserved
         for the source cells. Due east is 90, and the values increase
         clockwise (180 is south, 270 is west, and 360 is north).The output
         raster is of type float.
     out_source_direction_raster {Raster Dataset}:
         The source direction raster identifies the direction of the least
         accumulated cost source cell as an azimuth in degrees.The range of
         values is from 0 degrees to 360 degrees, with 0 reserved
         for the source cells. Due east is 90, and the values increase
         clockwise (180 is south, 270 is west, and 360 is north).The output
         raster is of type float.
     out_source_location_raster {Raster Dataset}:
         The source location raster is a multiband output. The first band
         contains a row index, and the second band contains a column index.
         These indexes identify the location of the source cell that is the
         least accumulated cost distance away."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_source_data,
        in_barrier_data,
        in_surface_raster,
        in_cost_raster,
        in_vertical_raster,
        vertical_factor,
        in_horizontal_raster,
        horizontal_factor,
        out_back_direction_raster,
        out_source_direction_raster,
        out_source_location_raster,
        source_initial_accumulation,
        source_maximum_accumulation,
        source_cost_multiplier,
        source_direction,
        distance_method,
    ):
        vertical_factor = Utils.compoundParameterToString(vertical_factor, ParameterClasses._VerticalFactor)
        horizontal_factor = Utils.compoundParameterToString(horizontal_factor, ParameterClasses._HorizontalFactor)
        out_distance_accumulation_raster = "#"
        result = arcpy.gp.DistanceAccumulation_sa(
            in_source_data,
            out_distance_accumulation_raster,
            in_barrier_data,
            in_surface_raster,
            in_cost_raster,
            in_vertical_raster,
            vertical_factor,
            in_horizontal_raster,
            horizontal_factor,
            out_back_direction_raster,
            out_source_direction_raster,
            out_source_location_raster,
            source_initial_accumulation,
            source_maximum_accumulation,
            source_cost_multiplier,
            source_direction,
            distance_method,
        )
        return _wrapToolRaster("DistanceAccumulation_sa", str(result.getOutput(0)))

    return Wrapper(
        in_source_data,
        in_barrier_data,
        in_surface_raster,
        in_cost_raster,
        in_vertical_raster,
        vertical_factor,
        in_horizontal_raster,
        horizontal_factor,
        out_back_direction_raster,
        out_source_direction_raster,
        out_source_location_raster,
        source_initial_accumulation,
        source_maximum_accumulation,
        source_cost_multiplier,
        source_direction,
        distance_method,
    )


DistanceAccumulation.__esri_toolname__ = "DistanceAccumulation_sa"
DistanceAccumulation.__esri_toolinfo__ = [
    "::::1",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "Python::VfBidirHikingTime|VfBinary|VfCos|VfCosSec|VfHikingTime|VfInverseLinear|VfLinear|VfSec|VfSecCos|VfSymInverseLinear|VfSymLinear|VfTable::",
    "::::8",
    "Python::HfBinary|HfForward|HfInverseLinear|HfLinear|HfTable::",
    "::::10",
    "::::11",
    "::::12",
    "::::13",
    "::::14",
    "::::15",
    "::::16",
    "::::17",
]


def DistanceAllocation(
    in_source_data,
    in_barrier_data="#",
    in_surface_raster="#",
    in_cost_raster="#",
    in_vertical_raster="#",
    vertical_factor="#",
    in_horizontal_raster="#",
    horizontal_factor="#",
    out_distance_accumulation_raster="#",
    out_back_direction_raster="#",
    out_source_direction_raster="#",
    out_source_location_raster="#",
    source_field="#",
    source_initial_accumulation="#",
    source_maximum_accumulation="#",
    source_cost_multiplier="#",
    source_direction="#",
    distance_method: Literal["PLANAR", "GEODESIC", "#"] | None = "#",
) -> Raster:
    """DistanceAllocation_sa(in_source_data, {in_barrier_data}, {in_surface_raster}, {in_cost_raster}, {in_vertical_raster}, {vertical_factor}, {in_horizontal_raster}, {horizontal_factor}, {out_distance_accumulation_raster}, {out_back_direction_raster}, {out_source_direction_raster}, {out_source_location_raster}, {source_field}, {source_initial_accumulation}, {source_maximum_accumulation}, {source_cost_multiplier}, {source_direction}, {distance_method})

       Calculates distance allocation for each cell to the provided sources
       based on straight-line distance, cost distance, and true surface
       distance, as well as vertical and horizontal cost factors.

    INPUTS:
     in_source_data (Composite Geodataset):
         The input source locations.This is a raster or feature (point, line,
         or polygon) identifying the
         cells or locations that will be used to calculate the least
         accumulated cost distance for each output cell location.For rasters,
         the input type can be integer or floating point.
     in_barrier_data {Composite Geodataset}:
         The dataset that defines the barriers.The barriers can be defined by
         an integer or a floating-point raster,
         or by a point, line, or polygon feature.For a raster barrier, the
         barrier must have a valid value, including
         zero, and the areas that are not barriers must be NoData.
     in_surface_raster {Composite Geodataset}:
         A raster defining the elevation values at each cell location.The
         values are used to calculate the actual surface distance covered
         when passing between cells.
     in_cost_raster {Composite Geodataset}:
         A raster defining the impedance or cost to move planimetrically
         through each cell.The value at each cell location represents the cost-
         per-unit distance
         for moving through the cell. Each cell location value is multiplied by
         the cell resolution while also compensating for diagonal movement to
         obtain the total cost of passing through the cell.The values of the
         cost raster can be integer or floating point. Cost
         raster values that are negative or zero are invalid but will be
         treated as small positive cost values.
     in_vertical_raster {Composite Geodataset}:
         A raster defining the z-values for each cell location.The values are
         used for calculating the slope used to identify the
         vertical factor incurred when moving from one cell to another.
     vertical_factor {Vertical Factor}:
         The Vertical factor object defines the relationship between the
         vertical cost factor and the vertical relative moving angle
         (VRMA).There are several factors with modifiers that identify a
         defined
         vertical factor graph. Additionally, a table can be used to create a
         custom graph. The graphs are used to identify the vertical factor used
         in calculating the total cost for moving into a neighboring cell.In
         the descriptions below, two acronyms are used: VF stands for
         vertical factor, which defines the vertical difficulty encountered in
         moving from one cell to the next; VRMA stands for vertical relative
         moving angle, which identifies the slope angle between the FROM or
         processing cell and the TO cell. The object comes in the
         following forms:        VfBinary,
         VfLinear, VfInverseLinear, VfSymLinear, VfSymInverseLinear,
         VfCos, VfSec, VfSec, VfCosSec, VfSecCos, VfHikingTime,
         VfBidirHikingTime, VfTable.The definitions and parameters of these are
         the following:         VfBinary({zeroFactor}, {lowCutAngle},
         {highCutAngle})
         If the VRMA is greater than the low-cut angle and less than the high-
         cut angle, the VF is set to the value associated with the zero factor;
         otherwise, it is infinity. VfLinear({zeroFactor},
         {lowCutAngle}, {highCutAngle},
         {slope})         The VF is a linear function of the VRMA.
         VfInverseLinear({zeroFactor}, {lowCutAngle}, {highCutAngle},
         {slope})         The VF is an inverse linear function of the VRMA.
         VfSymLinear({zeroFactor}, {lowCutAngle}, {highCutAngle},
         {slope})         The VF is a linear function of the VRMA in either the
         negative or
         positive side of the VRMA, and the two linear functions are
         symmetrical with respect to the VF (y) axis.
         VfSymInverseLinear({zeroFactor}, {lowCutAngle},
         {highCutAngle}, {slope})         The VF is an inverse linear function
         of the VRMA in either the
         negative or positive side of the VRMA, and the two linear functions
         are symmetrical with respect to the VF (y) axis.
         VfCos({lowCutAngle}, {highCutAngle}, {cosPower})         The
         VF is the cosine-based function of the VRMA.
         VfSec({lowCutAngle}, {highCutAngle}, {secPower})         The
         VF is the secant-based function of the VRMA.
         VfCosSec({lowCutAngle}, {highCutAngle}, {cosPower},
         {secPower})         The VF is the cosine-based function of the VRMA
         when the VRMA is
         negative and is the secant-based function of the VRMA when the VRMA is
         not negative. VfSecCos({lowCutAngle}, {highCutAngle},
         {secPower},
         {cos_power})         The VF is the secant-based function of the VRMA
         when the VRMA is
         negative and is the cosine-based function of the VRMA when the VRMA is
         not negative. VfHikingTime({lowCutAngle}, {highCutAngle})
         The VF is
         the hiking time function of the VRMA.
         VfBidirHikingTime({lowCutAngle}, {highCutAngle})         The
         VF is a bidirectional modified hiking time function of the VRMA.
         VfTable(inTable)         A table file will be used to define
         the vertical factor graph used to
         determine the VFs.The modifiers to the vertical parameters are the
         following:zeroFactor-The vertical factor used when the VRMA is zero.
         This factor
         positions the y-intercept of the specified function. By definition,
         the zero factor is not applicable to any of the trigonometric vertical
         functions (Cos, Sec, Cos-Sec, or Sec-Cos). The y-intercept is defined
         by these functions.lowCutAngle-The VRMA angle below which the VF will
         be set to infinity.highCutAngle-The VRMA angle above which the VF will
         be set to
         infinity.slope-The slope of the straight line used with the VfLinear
         and
         VfInverseLinear parameters. The slope is specified as a fraction of
         rise over run (for example, 45 percent slope is 1/45, which is input
         as 0.02222).inTable-The name of the table defining the VF.
     in_horizontal_raster {Composite Geodataset}:
         A raster defining the horizontal direction at each cell.The values on
         the raster must be integers ranging from 0 to 360, with
         0 degrees being north, or toward the top of the screen, and increasing
         clockwise. Flat areas should be given a value of -1. The values at
         each location will be used in conjunction with the horizontal_factor
         parameter to determine the horizontal cost incurred when moving from a
         cell to its neighbors.
     horizontal_factor {Horizontal Factor}:
         The Horizontal Factor object defines the relationship between the
         horizontal cost factor and the horizontal relative moving angle.There
         are several factors with modifiers that identify a defined
         horizontal factor graph. Additionally, a table can be used to create a
         custom graph. The graphs are used to identify the horizontal factor
         used in calculating the total cost of moving into a neighboring
         cell.In the descriptions below, two acronyms are used: HF stands for
         horizontal factor, which defines the horizontal difficulty encountered
         when moving from one cell to the next; HRMA stands for horizontal
         relative moving angle, which identifies the angle between the
         horizontal direction from a cell and the moving direction. The
         object comes in the following forms:        HfBinary,
         HfForward, HfLinear, HfInverseLinear, and HfTable. The
         definitions and parameters of these are the following:
         HfBinary({zeroFactor}, {cutAngle})          If the HRMA is
         less than the cut angle, the HF is set to the value
         associated with the zero factor; otherwise, it is infinity.
         HfForward({zeroFactor}, {sideValue})          Only forward
         movement is allowed. The HRMA must be greater than or
         equal to 0 and less than 90 degrees (0 <= HRMA < 90). If the HRMA is
         greater than 0 and less than 45 degrees, the HF for the cell is set to
         the value associated with the zero factor. If the HRMA is greater than
         or equal to 45 degrees, the side value modifier value is used. The HF
         for any HRMA equal to or greater than 90 degrees is set to infinity.
         HfLinear({zeroFactor}, {cutAngle}, {slope})          The HF
         is a linear function of the HRMA.
         HfInverseLinear({zeroFactor}, {cutAngle}, {slope})
         The HF is an inverse linear function of the HRMA.
         HfTable(inTable)          A table file will be used to
         define the horizontal factor graph used
         to determine the HFs. The modifiers to the horizontal keywords
         are the following:
         zeroFactor-The horizontal factor to be used when the HRMA is 0. This
         factor positions the y-intercept for any of the horizontal factor
         functions.cutAngle-The HRMA angle beyond which the HF will be set to
         infinity.slope-The slope of the straight line used with the HfLinear
         and
         HfInverseLinear horizontal factor keywords. The slope is specified as
         a fraction of rise over run (for example, 45 percent slope is 1/45,
         which is input as 0.02222).sideValue-The HF when the HRMA is greater
         than or equal to 45 degrees
         and less than 90 degrees when the HfForward horizontal factor keyword
         is specified.inTable-The name of the table defining the HF.
     source_field {Field}:
         The field used to assign values to the source locations. It must be of
         integer type.
     source_initial_accumulation {Double / Field}:
         The initial accumulative cost that will be used to begin the cost
         calculation.Allows for the specification of the fixed cost associated
         with a
         source. Instead of starting at a cost of zero, the cost algorithm will
         begin with this value.The values must be zero or greater. The default
         is 0.
     source_maximum_accumulation {Double / Field}:
         The maximum accumulation for the traveler for a source.The cost
         calculations continue for each source until the specified
         accumulation is reached.The values must be greater than zero. The
         default accumulation is to
         the edge of the output raster.
     source_cost_multiplier {Double / Field}:
         The multiplier that will be applied to the cost values.This allows for
         control of the mode of travel or the magnitude at a
         source. The greater the multiplier, the greater the cost to move
         through each cell.The values must be greater than zero. The default is
         1.
     source_direction {String / Field}:
         Specifies the direction of the traveler when applying horizontal and
         vertical factors.FROM_SOURCE-The horizontal factor and vertical factor
         will be applied
         beginning at the input source and travel out to the nonsource cells.
         This is the default.TO_SOURCE-The horizontal factor and vertical
         factor will be applied
         beginning at each nonsource cell and travel back to the input
         source.Specify the FROM_SOURCE or TO_SOURCE keyword, which will be
         applied to
         all sources, or specify a field in the source data that contains the
         keywords to identify the direction of travel for each source. That
         field must contain the string FROM_SOURCE or TO_SOURCE.
     distance_method {String}:
         Specifies whether the distance will be calculated using a planar (flat
         earth) or a geodesic (ellipsoid) method.PLANAR-The distance
         calculation will be performed on a projected flat
         plane using a 2D Cartesian coordinate system. This is the
         default.GEODESIC-The distance calculation will be performed on the
         ellipsoid.
         Regardless of input or output projection, the results will not change.

    OUTPUTS:
     out_distance_allocation_raster (Raster Dataset):
         The output distance allocation raster.
     out_distance_accumulation_raster {Raster Dataset}:
         The output distance raster.The distance accumulation raster contains
         the accumulative distance
         for each cell from, or to, the least-cost source.
     out_back_direction_raster {Raster Dataset}:
         The back direction raster contains the calculated direction in
         degrees. The direction identifies the next cell along the shortest
         path back to the closest source while avoiding barriers.The range of
         values is from 0 degrees to 360 degrees, with 0 reserved
         for the source cells. Due east is 90, and the values increase
         clockwise (180 is south, 270 is west, and 360 is north).The output
         raster is of type float.
     out_source_direction_raster {Raster Dataset}:
         The source direction raster identifies the direction of the least
         accumulated cost source cell as an azimuth in degrees.The range of
         values is from 0 degrees to 360 degrees, with 0 reserved
         for the source cells. Due east is 90, and the values increase
         clockwise (180 is south, 270 is west, and 360 is north).The output
         raster is of type float.
     out_source_location_raster {Raster Dataset}:
         The source location raster is a multiband output. The first band
         contains a row index, and the second band contains a column index.
         These indexes identify the location of the source cell that is the
         least accumulated cost distance away."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_source_data,
        in_barrier_data,
        in_surface_raster,
        in_cost_raster,
        in_vertical_raster,
        vertical_factor,
        in_horizontal_raster,
        horizontal_factor,
        out_distance_accumulation_raster,
        out_back_direction_raster,
        out_source_direction_raster,
        out_source_location_raster,
        source_field,
        source_initial_accumulation,
        source_maximum_accumulation,
        source_cost_multiplier,
        source_direction,
        distance_method,
    ):
        vertical_factor = Utils.compoundParameterToString(vertical_factor, ParameterClasses._VerticalFactor)
        horizontal_factor = Utils.compoundParameterToString(horizontal_factor, ParameterClasses._HorizontalFactor)
        out_distance_allocation_raster = "#"
        result = arcpy.gp.DistanceAllocation_sa(
            in_source_data,
            out_distance_allocation_raster,
            in_barrier_data,
            in_surface_raster,
            in_cost_raster,
            in_vertical_raster,
            vertical_factor,
            in_horizontal_raster,
            horizontal_factor,
            out_distance_accumulation_raster,
            out_back_direction_raster,
            out_source_direction_raster,
            out_source_location_raster,
            source_field,
            source_initial_accumulation,
            source_maximum_accumulation,
            source_cost_multiplier,
            source_direction,
            distance_method,
        )
        return _wrapToolRaster("DistanceAllocation_sa", str(result.getOutput(0)))

    return Wrapper(
        in_source_data,
        in_barrier_data,
        in_surface_raster,
        in_cost_raster,
        in_vertical_raster,
        vertical_factor,
        in_horizontal_raster,
        horizontal_factor,
        out_distance_accumulation_raster,
        out_back_direction_raster,
        out_source_direction_raster,
        out_source_location_raster,
        source_field,
        source_initial_accumulation,
        source_maximum_accumulation,
        source_cost_multiplier,
        source_direction,
        distance_method,
    )


DistanceAllocation.__esri_toolname__ = "DistanceAllocation_sa"
DistanceAllocation.__esri_toolinfo__ = [
    "::::1",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "Python::VfBidirHikingTime|VfBinary|VfCos|VfCosSec|VfHikingTime|VfInverseLinear|VfLinear|VfSec|VfSecCos|VfSymInverseLinear|VfSymLinear|VfTable::",
    "::::8",
    "Python::HfBinary|HfForward|HfInverseLinear|HfLinear|HfTable::",
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
]


def Divide(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """Divide_sa(in_raster_or_constant1, in_raster_or_constant2)

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


Divide.__esri_toolname__ = "Divide_sa"
Divide.__esri_toolinfo__ = ["::::1", "::::2"]


def EditSignatures(
    in_raster_bands, in_signature_file, in_signature_remap_file, out_signature_file, sample_interval="#"
):
    """EditSignatures_sa(in_raster_bands;in_raster_bands..., in_signature_file, in_signature_remap_file, out_signature_file, {sample_interval})

       Edits and updates a signature file by merging, renumbering, and
       deleting class signatures.

    INPUTS:
     in_raster_bands (Composite Geodataset):
         The input raster bands for which to edit the signatures.They can be
         integer or floating point type.
     in_signature_file (File):
         Input signature file whose class signatures are to be edited.A .gsg
         extension is required.
     in_signature_remap_file (File):
         Input ASCII remap table containing the class IDs to be merged,
         renumbered, or deleted.The extension can be .rmp, .asc or .txt. The
         default is .rmp.
     sample_interval {Long}:
         The interval to be used for sampling.The default is 10.

    OUTPUTS:
     out_signature_file (File):
         The output signature file.A .gsg extension must be specified."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_raster_bands, in_signature_file, in_signature_remap_file, out_signature_file, sample_interval):
        result = arcpy.gp.EditSignatures_sa(
            in_raster_bands, in_signature_file, in_signature_remap_file, out_signature_file, sample_interval
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_raster_bands, in_signature_file, in_signature_remap_file, out_signature_file, sample_interval)


EditSignatures.__esri_toolname__ = "EditSignatures_sa"
EditSignatures.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5"]


def EqualTo(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """EqualTo_sa(in_raster_or_constant1, in_raster_or_constant2)

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


EqualTo.__esri_toolname__ = "EqualTo_sa"
EqualTo.__esri_toolinfo__ = ["::::1", "::::2"]


def EqualToFrequency(
    in_value_raster, in_rasters, process_as_multiband: Literal["SINGLE_BAND", "MULTI_BAND", "#"] | None = "#"
) -> Raster:
    """EqualToFrequency_sa(in_value_raster, in_rasters;in_rasters..., {process_as_multiband})

       Evaluates on a cell-by-cell basis the number of times the values in a
       set of rasters are equal to another raster.

    INPUTS:
     in_value_raster (Composite Geodataset):
         For each cell location in the input value raster, the number of
         occurrences (frequency) where a raster in the input list has an equal
         value is counted.
     in_rasters (Composite Geodataset):
         The list of rasters that will be compared to the value raster.
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
         The output raster.For each cell in the output raster, the value
         represents the number of
         times that the corresponding cells in the list of rasters are the same
         as the value raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_value_raster, in_rasters, process_as_multiband):
        if Utils.useDefaultArgumentValue(process_as_multiband):
            process_as_multiband = "SINGLE_BAND"
        if process_as_multiband not in ["SINGLE_BAND", "MULTI_BAND"]:
            raise arcpy.ExecuteError(
                "ERROR 000622: Failed to execute (EqualToFrequency). Parameters are not valid.\nERROR 000621: Input to parameter process_as_multiband not within domain.\n"
            )
        return _wrapLocalFunctionRaster(
            "EqualToFrequency_sa",
            ["EqualToFrequency", in_value_raster] + Utils.flattenLists(in_rasters),
            {"flattenBands": process_as_multiband.upper() == "SINGLE_BAND"},
        )

    return Wrapper(in_value_raster, in_rasters, process_as_multiband)


EqualToFrequency.__esri_toolname__ = "EqualToFrequency_sa"
EqualToFrequency.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def EucAllocation(
    in_source_data,
    maximum_distance="#",
    in_value_raster="#",
    cell_size="#",
    source_field="#",
    out_distance_raster="#",
    out_direction_raster="#",
    distance_method: Literal["PLANAR", "GEODESIC", "#"] | None = "#",
    in_barrier_data="#",
    out_back_direction_raster="#",
) -> Raster:
    """EucAllocation_sa(in_source_data, {maximum_distance}, {in_value_raster}, {cell_size}, {source_field}, {out_distance_raster}, {out_direction_raster}, {distance_method}, {in_barrier_data}, {out_back_direction_raster})

       Calculates, for each cell, the nearest source based on Euclidean
       distance.

    INPUTS:
     in_source_data (Composite Geodataset):
         The input source locations.This is a raster or feature identifying the
         cells or locations that
         will be used to calculate the Euclidean distance for each output cell
         location.For rasters, the input type can be integer or floating
         point.If the input source raster is floating point, the
         in_value_raster
         parameter must be set, and it must integer. The value raster will take
         precedence over the source_field parameter setting.
     maximum_distance {Double}:
         The threshold that the accumulative distance values cannot exceed.If
         an accumulative Euclidean distance value exceeds this value, the
         output value for the cell location will be NoData.The default distance
         is to the edge of the output raster.
     in_value_raster {Composite Geodataset}:
         The input integer raster that identifies the zone values that will be
         used for each input source location.For each source location (cell or
         feature), this value will be
         assigned to all cells allocated to the source location for the
         computation. The value raster will take precedence over the
         source_field parameter setting.
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     source_field {Field}:
         The field used to assign values to the source locations. It must be of
         integer type.If the in_value_raster parameter has been set, the values
         in that
         input will have precedence over this parameter setting.
     distance_method {String}:
         Specifies whether the distance will be calculated using a planar (flat
         earth) or a geodesic (ellipsoid) method.PLANAR-The distance
         calculation will be performed on a projected flat
         plane using a 2D Cartesian coordinate system. This is the
         default.GEODESIC-The distance calculation will be performed on the
         ellipsoid.
         Regardless of input or output projection, the results will not change.
     in_barrier_data {Composite Geodataset}:
         The dataset that defines the barriers.The barriers can be defined by
         an integer or a floating-point raster,
         or by a point, line, or polygon feature.

    OUTPUTS:
     out_allocation_raster (Raster Dataset):
         The output Euclidean allocation raster.The cell values (zones)
         identify the nearest source location.The output raster is of integer
         type.
     out_distance_raster {Raster Dataset}:
         The output Euclidean distance raster.The distance raster identifies,
         for each cell, the Euclidean distance
         to the closest source cell, set of source cells, or source
         location.The output raster is of floating-point type.
     out_direction_raster {Raster Dataset}:
         The output Euclidean direction raster.The direction raster contains
         the calculated direction, in degrees,
         that each cell center is from the closest source cell center.The range
         of values is from 0 degrees to 360 degrees, with 0 reserved
         for the source cells. Due east is 90, and the values increase
         clockwise (180 is south, 270 is west, and 360 is north).The output
         raster is of integer type.
     out_back_direction_raster {Raster Dataset}:
         The output Euclidean back direction raster.The back direction raster
         contains the calculated direction in
         degrees. The direction identifies the next cell along the shortest
         path back to the closest source while avoiding barriers.The range of
         values is from 0 degrees to 360 degrees, with 0 reserved
         for the source cells. Due east is 90, and the values increase
         clockwise (180 is south, 270 is west, and 360 is north).The output
         raster is of type float."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_source_data,
        maximum_distance,
        in_value_raster,
        cell_size,
        source_field,
        out_distance_raster,
        out_direction_raster,
        distance_method,
        in_barrier_data,
        out_back_direction_raster,
    ):
        out_allocation_raster = "#"
        result = arcpy.gp.EucAllocation_sa(
            in_source_data,
            out_allocation_raster,
            maximum_distance,
            in_value_raster,
            cell_size,
            source_field,
            out_distance_raster,
            out_direction_raster,
            distance_method,
            in_barrier_data,
            out_back_direction_raster,
        )
        return _wrapToolRaster("EucAllocation_sa", str(result.getOutput(0)))

    return Wrapper(
        in_source_data,
        maximum_distance,
        in_value_raster,
        cell_size,
        source_field,
        out_distance_raster,
        out_direction_raster,
        distance_method,
        in_barrier_data,
        out_back_direction_raster,
    )


EucAllocation.__esri_toolname__ = "EucAllocation_sa"
EucAllocation.__esri_toolinfo__ = [
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


def EucBackDirection(
    in_source_data,
    in_barrier_data="#",
    maximum_distance="#",
    cell_size="#",
    distance_method: Literal["PLANAR", "GEODESIC", "#"] | None = "#",
) -> Raster:
    """EucBackDirection_sa(in_source_data, {in_barrier_data}, {maximum_distance}, {cell_size}, {distance_method})

       Calculates, for each cell, the direction, in degrees, to the
       neighboring cell along the shortest path back to the closest source
       while avoiding barriers.

    INPUTS:
     in_source_data (Composite Geodataset):
         The input source locations.This is a raster or feature dataset that
         identifies the cells or
         locations to which the Euclidean back direction for every output cell
         location is calculated.For rasters, the input type can be integer or
         floating point.
     in_barrier_data {Composite Geodataset}:
         The dataset that defines the barriers.The barriers can be defined by
         an integer or a floating-point raster,
         or by a point, line, or polygon feature.
     maximum_distance {Double}:
         The threshold that the accumulative distance values cannot exceed.If
         an accumulative Euclidean distance value exceeds this value, the
         output value for the cell location will be NoData.The default distance
         is to the edge of the output raster.
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     distance_method {String}:
         Specifies whether the distance will be calculated using a planar (flat
         earth) or a geodesic (ellipsoid) method.PLANAR-The distance
         calculation will be performed on a projected flat
         plane using a 2D Cartesian coordinate system. This is the
         default.GEODESIC-The distance calculation will be performed on the
         ellipsoid.
         Regardless of input or output projection, the results will not change.

    OUTPUTS:
     out_back_direction_raster (Raster Dataset):
         The output Euclidean back direction raster.The back direction raster
         contains the calculated direction in
         degrees. The direction identifies the next cell along the shortest
         path back to the closest source while avoiding barriers.The range of
         values is from 0 degrees to 360 degrees, with 0 reserved
         for the source cells. Due east is 90, and the values increase
         clockwise (180 is south, 270 is west, and 360 is north).The output
         raster is of type float."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_source_data, in_barrier_data, maximum_distance, cell_size, distance_method):
        out_back_direction_raster = "#"
        result = arcpy.gp.EucBackDirection_sa(
            in_source_data, out_back_direction_raster, in_barrier_data, maximum_distance, cell_size, distance_method
        )
        return _wrapToolRaster("EucBackDirection_sa", str(result.getOutput(0)))

    return Wrapper(in_source_data, in_barrier_data, maximum_distance, cell_size, distance_method)


EucBackDirection.__esri_toolname__ = "EucBackDirection_sa"
EucBackDirection.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6"]


def EucDirection(
    in_source_data,
    maximum_distance="#",
    cell_size="#",
    out_distance_raster="#",
    distance_method: Literal["PLANAR", "GEODESIC", "#"] | None = "#",
    in_barrier_data="#",
    out_back_direction_raster="#",
) -> Raster:
    """EucDirection_sa(in_source_data, {maximum_distance}, {cell_size}, {out_distance_raster}, {distance_method}, {in_barrier_data}, {out_back_direction_raster})

       Calculates, for each cell, the direction, in degrees, to the nearest
       source.

    INPUTS:
     in_source_data (Composite Geodataset):
         The input source locations.This is a raster or feature identifying the
         cells or locations that
         will be used to calculate the Euclidean distance for each output cell
         location.For rasters, the input type can be integer or floating point.
     maximum_distance {Double}:
         The threshold that the accumulative distance values cannot exceed.If
         an accumulative Euclidean distance value exceeds this value, the
         output value for the cell location will be NoData.The default distance
         is to the edge of the output raster.
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     distance_method {String}:
         Specifies whether the distance will be calculated using a planar (flat
         earth) or a geodesic (ellipsoid) method.PLANAR-The distance
         calculation will be performed on a projected flat
         plane using a 2D Cartesian coordinate system. This is the
         default.GEODESIC-The distance calculation will be performed on the
         ellipsoid.
         Regardless of input or output projection, the results will not change.
     in_barrier_data {Composite Geodataset}:
         The dataset that defines the barriers.The barriers can be defined by
         an integer or a floating-point raster,
         or by a point, line, or polygon feature.

    OUTPUTS:
     out_direction_raster (Raster Dataset):
         The output Euclidean direction raster.The direction raster contains
         the calculated direction, in degrees,
         that each cell center is from the closest source cell center.The range
         of values is from 0 degrees to 360 degrees, with 0 reserved
         for the source cells. Due east is 90, and the values increase
         clockwise (180 is south, 270 is west, and 360 is north).The output
         raster is of integer type.
     out_distance_raster {Raster Dataset}:
         The output Euclidean distance raster.The distance raster identifies,
         for each cell, the Euclidean distance
         to the closest source cell, set of source cells, or source
         location.The output raster is of floating-point type.
     out_back_direction_raster {Raster Dataset}:
         The output Euclidean back direction raster.The back direction raster
         contains the calculated direction in
         degrees. The direction identifies the next cell along the shortest
         path back to the closest source while avoiding barriers.The range of
         values is from 0 degrees to 360 degrees, with 0 reserved
         for the source cells. Due east is 90, and the values increase
         clockwise (180 is south, 270 is west, and 360 is north).The output
         raster is of type float."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_source_data,
        maximum_distance,
        cell_size,
        out_distance_raster,
        distance_method,
        in_barrier_data,
        out_back_direction_raster,
    ):
        out_direction_raster = "#"
        result = arcpy.gp.EucDirection_sa(
            in_source_data,
            out_direction_raster,
            maximum_distance,
            cell_size,
            out_distance_raster,
            distance_method,
            in_barrier_data,
            out_back_direction_raster,
        )
        return _wrapToolRaster("EucDirection_sa", str(result.getOutput(0)))

    return Wrapper(
        in_source_data,
        maximum_distance,
        cell_size,
        out_distance_raster,
        distance_method,
        in_barrier_data,
        out_back_direction_raster,
    )


EucDirection.__esri_toolname__ = "EucDirection_sa"
EucDirection.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7", "::::8"]


def EucDistance(
    in_source_data,
    maximum_distance="#",
    cell_size="#",
    out_direction_raster="#",
    distance_method: Literal["PLANAR", "GEODESIC", "#"] | None = "#",
    in_barrier_data="#",
    out_back_direction_raster="#",
) -> Raster:
    """EucDistance_sa(in_source_data, {maximum_distance}, {cell_size}, {out_direction_raster}, {distance_method}, {in_barrier_data}, {out_back_direction_raster})

       Calculates, for each cell, the Euclidean distance to the nearest
       source.

    INPUTS:
     in_source_data (Composite Geodataset):
         The input source locations.This is a raster or feature identifying the
         cells or locations that
         will be used to calculate the Euclidean distance for each output cell
         location.For rasters, the input type can be integer or floating point.
     maximum_distance {Double}:
         The threshold that the accumulative distance values cannot exceed.If
         an accumulative Euclidean distance value exceeds this value, the
         output value for the cell location will be NoData.The default distance
         is to the edge of the output raster.
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     distance_method {String}:
         Specifies whether the distance will be calculated using a planar (flat
         earth) or a geodesic (ellipsoid) method.PLANAR-The distance
         calculation will be performed on a projected flat
         plane using a 2D Cartesian coordinate system. This is the
         default.GEODESIC-The distance calculation will be performed on the
         ellipsoid.
         Regardless of input or output projection, the results will not change.
     in_barrier_data {Composite Geodataset}:
         The dataset that defines the barriers.The barriers can be defined by
         an integer or a floating-point raster,
         or by a point, line, or polygon feature.

    OUTPUTS:
     out_distance_raster (Raster Dataset):
         The output Euclidean distance raster.The distance raster identifies,
         for each cell, the Euclidean distance
         to the closest source cell, set of source cells, or source
         location.The output raster is of floating-point type.
     out_direction_raster {Raster Dataset}:
         The output Euclidean direction raster.The direction raster contains
         the calculated direction, in degrees,
         that each cell center is from the closest source cell center.The range
         of values is from 0 degrees to 360 degrees, with 0 reserved
         for the source cells. Due east is 90, and the values increase
         clockwise (180 is south, 270 is west, and 360 is north).The output
         raster is of integer type.
     out_back_direction_raster {Raster Dataset}:
         The output Euclidean back direction raster.The back direction raster
         contains the calculated direction in
         degrees. The direction identifies the next cell along the shortest
         path back to the closest source while avoiding barriers.The range of
         values is from 0 degrees to 360 degrees, with 0 reserved
         for the source cells. Due east is 90, and the values increase
         clockwise (180 is south, 270 is west, and 360 is north).The output
         raster is of type float."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_source_data,
        maximum_distance,
        cell_size,
        out_direction_raster,
        distance_method,
        in_barrier_data,
        out_back_direction_raster,
    ):
        out_distance_raster = "#"
        result = arcpy.gp.EucDistance_sa(
            in_source_data,
            out_distance_raster,
            maximum_distance,
            cell_size,
            out_direction_raster,
            distance_method,
            in_barrier_data,
            out_back_direction_raster,
        )
        return _wrapToolRaster("EucDistance_sa", str(result.getOutput(0)))

    return Wrapper(
        in_source_data,
        maximum_distance,
        cell_size,
        out_direction_raster,
        distance_method,
        in_barrier_data,
        out_back_direction_raster,
    )


EucDistance.__esri_toolname__ = "EucDistance_sa"
EucDistance.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7", "::::8"]


def Exp(in_raster_or_constant) -> Raster:
    """Exp_sa(in_raster_or_constant)

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


Exp.__esri_toolname__ = "Exp_sa"
Exp.__esri_toolinfo__ = ["::::1"]


def Exp10(in_raster_or_constant) -> Raster:
    """Exp10_sa(in_raster_or_constant)

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


Exp10.__esri_toolname__ = "Exp10_sa"
Exp10.__esri_toolinfo__ = ["::::1"]


def Exp2(in_raster_or_constant) -> Raster:
    """Exp2_sa(in_raster_or_constant)

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


Exp2.__esri_toolname__ = "Exp2_sa"
Exp2.__esri_toolinfo__ = ["::::1"]


def Expand(
    in_raster, number_cells, zone_values, expand_method: Literal["MORPHOLOGICAL", "DISTANCE", "#"] | None = "#"
) -> Raster:
    """Expand_sa(in_raster, number_cells, zone_values;zone_values..., {expand_method})

       Expands specified zones of a raster by a specified number of cells.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster for which the identified zones are to be expandedIt
         must be of integer type.
     number_cells (Long):
         The number of cells to expand each specified zone by.The value must be
         an integer greater than 1.
     zone_values (Long):
         The list of zone values to expand.The zone values must be integers.
         They can be in any order.
     expand_method {String}:
         The method used to expand the selected zones.MORPHOLOGICAL-Uses a
         mathematical morphology method to expand the
         zones. This is the default.DISTANCE-Uses a distance-based method to
         expand the zones.The DISTANCE option supports parallelization, and can
         be controlled
         with the parallelProcessingFactor environment setting.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output generalized raster.The specified zones of the input raster
         will be expanded by the
         specified number of cells.The output is always of integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, number_cells, zone_values, expand_method):
        out_raster = "#"
        result = arcpy.gp.Expand_sa(in_raster, out_raster, number_cells, zone_values, expand_method)
        return _wrapToolRaster("Expand_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, number_cells, zone_values, expand_method)


Expand.__esri_toolname__ = "Expand_sa"
Expand.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5"]


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
    """ExportTrainingDataForDeepLearning_sa(in_raster, out_folder, {in_class_data}, {image_chip_format}, {tile_size_x}, {tile_size_y}, {stride_x}, {stride_y}, {output_nofeature_tiles}, {metadata_format}, {start_index}, {class_value_field}, {buffer_radius}, {in_mask_polygons}, {rotation_angle}, {reference_system}, {processing_mode}, {blacken_around_feature}, {crop_mode}, {in_raster2}, {in_instance_data}, {instance_class_value_field}, {min_polygon_overlap_ratio})

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
        result = arcpy.gp.ExportTrainingDataForDeepLearning_sa(
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


ExportTrainingDataForDeepLearning.__esri_toolname__ = "ExportTrainingDataForDeepLearning_sa"
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


def ExtractByAttributes(in_raster, where_clause) -> Raster:
    """ExtractByAttributes_sa(in_raster, where_clause)

       Extracts the cells of a raster based on a logical query.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster from which cells will be extracted.
     where_clause (SQL Expression):
         A logical expression that selects a subset of raster cells.The
         expression follows the general form of an SQL expression. An
         example of a where_clause is "VALUE > 100".

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster containing the cell values extracted from the input
         raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, where_clause):
        out_raster = "#"
        result = arcpy.gp.ExtractByAttributes_sa(in_raster, where_clause, out_raster)
        return _wrapToolRaster("ExtractByAttributes_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, where_clause)


ExtractByAttributes.__esri_toolname__ = "ExtractByAttributes_sa"
ExtractByAttributes.__esri_toolinfo__ = ["::::1", "::::2"]


def ExtractByCircle(
    in_raster, center_point, radius, extraction_area: Literal["INSIDE", "OUTSIDE", "#"] | None = "#"
) -> Raster:
    """ExtractByCircle_sa(in_raster, center_point, radius, {extraction_area})

       Extracts the cells of a raster based on a circle by specifying the
       circle's center and radius.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster from which cells will be extracted.
     center_point (Point):
         The Point class determines the center coordinate (x,y) of the circle
         defining the area to be extracted. The form of the class is the
         following:        Point (x, y)The coordinates are specified in the
         same map units as the input
         raster.
     radius (Double):
         The radius of the circle defining the area to be extracted.The radius
         is specified in map units and is in the same units as the
         input raster.
     extraction_area {String}:
         Specifies whether cells inside or outside the input circle will be
         selected and written to the output raster.INSIDE-Cells inside the
         input circle will be selected and written to
         the output raster. All cells outside the circle will receive NoData
         values on the output raster.OUTSIDE-Cells outside the input circle
         will be selected and written to
         the output raster. All cells inside the circle will receive NoData
         values on the output raster.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster containing the cell values extracted from the input
         raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, center_point, radius, extraction_area):
        center_point = Utils.compoundParameterToString(center_point, arcpy.Point)
        out_raster = "#"
        result = arcpy.gp.ExtractByCircle_sa(in_raster, center_point, radius, out_raster, extraction_area)
        return _wrapToolRaster("ExtractByCircle_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, center_point, radius, extraction_area)


ExtractByCircle.__esri_toolname__ = "ExtractByCircle_sa"
ExtractByCircle.__esri_toolinfo__ = ["::::1", "Python::Point::", "::::3", "::::5"]


def ExtractByMask(
    in_raster, in_mask_data, extraction_area: Literal["INSIDE", "OUTSIDE", "#"] | None = "#", analysis_extent="#"
) -> Raster:
    """ExtractByMask_sa(in_raster, in_mask_data, {extraction_area}, {analysis_extent})

       Extracts the cells of a raster that correspond to the areas defined by
       a mask.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster from which cells will be extracted.
     in_mask_data (Composite Geodataset):
         The input mask data defining the cell locations to extract.It can be a
         raster or a feature dataset.When the input mask data is a raster,
         NoData cells on the mask will be
         assigned NoData values on the output raster.When the input mask is
         feature data, cells in the input raster whose
         center falls within the specified shape of the feature will be
         included in the output, while cells whose center falls outside will
         receive NoData.
     extraction_area {String}:
         Specifies whether cells inside or outside the locations defined by the
         input mask will be selected and written to the output
         raster.INSIDE-Cells within the input mask will be selected and written
         to the
         output raster. All cells outside the mask will receive NoData on the
         output raster. This is default.OUTSIDE-Cells outside the input mask
         will be selected and written to
         the output raster. All cells covered by the mask will receive NoData.
     analysis_extent {Extent}:
         The extent that defines the area to be extracted.If not specified, the
         default extent is the intersection of the
         in_raster value and the in_mask_data value.The coordinates are
         specified in the same map units as the input
         raster if not explicitly set by the analysis environment.MAXOF-The
         maximum extent of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster containing the cell values extracted from the input
         raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, in_mask_data, extraction_area, analysis_extent):
        analysis_extent = Utils.compoundParameterToString(analysis_extent, arcpy.Extent)
        out_raster = "#"
        result = arcpy.gp.ExtractByMask_sa(in_raster, in_mask_data, out_raster, extraction_area, analysis_extent)
        return _wrapToolRaster("ExtractByMask_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, in_mask_data, extraction_area, analysis_extent)


ExtractByMask.__esri_toolname__ = "ExtractByMask_sa"
ExtractByMask.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "Python::Extent::"]


def ExtractByPoints(in_raster, points, extraction_area: Literal["INSIDE", "OUTSIDE", "#"] | None = "#") -> Raster:
    """ExtractByPoints_sa(in_raster, points;points..., {extraction_area})

       Extracts the cells of a raster based on a set of coordinate points.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster from which cells will be extracted.
     points (Point):
         A Python list of Point class objects denote the locations where values
         will be extracted from the raster.The point objects are specified in a
         list of x,y coordinate pairs in
         the same map units as the input raster.The form of the object is:
         [point(x,y), point(x,y),...]         1122
     extraction_area {String}:
         Identifies whether to extract cells based on the specified point
         locations (inside) or outside the point locations (outside)
         .INSIDE-The cell in which the selected point falls will be written to
         the output raster. All cells outside the box will receive NoData on
         the output raster.OUTSIDE-The cells outside the input points should be
         selected and
         written to the output raster.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster containing the cell values extracted from the input
         raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, points, extraction_area):
        points = Utils.multiValueCompoundParameterToString(points, arcpy.Point)
        out_raster = "#"
        result = arcpy.gp.ExtractByPoints_sa(in_raster, points, out_raster, extraction_area)
        return _wrapToolRaster("ExtractByPoints_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, points, extraction_area)


ExtractByPoints.__esri_toolname__ = "ExtractByPoints_sa"
ExtractByPoints.__esri_toolinfo__ = ["::::1", "Python::Point::", "::::4"]


def ExtractByPolygon(in_raster, polygons, extraction_area: Literal["INSIDE", "OUTSIDE", "#"] | None = "#") -> Raster:
    """ExtractByPolygon_sa(in_raster, polygons, {extraction_area})

       Extracts the cells of a raster based on a polygon by specifying the
       polygon's vertices.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster from which cells will be extracted.
     polygons (Point):
         A polygon (or polygons) that defines the area of the input raster to
         be extracted.Each polygon part is a list of vertices defined by Point
         classes. The
         points are specified as x,y coordinate pairs in the same map units as
         the input raster.The form of the object for a single polygon is as
         follows:         [point(x,y), point(x,y), ..., point(x,y), point(x,y]
         1122nn11Optionally, a group of multiple polygons can be specified by
         using a
         Polygon class to define a list of polygon parts. Note that in order to
         do this, all parts must be contiguous, and thus be encompassed by one
         single perimeter shape. The form of the object in this case would be
         in a contiguous list as follows:         [point(x,y), point(x,y), ...,
         point(x,y), point(x,y),
         point(x',y'), point(x',y'), ..., point(x',y'), point(x',y'), ...]
         1122nn111122nn11In all cases, the last coordinate for each polygon
         part should be the
         same as the first in order to close it.
     extraction_area {String}:
         Identifies whether to extract cells inside or outside the input
         polygon.INSIDE-The cells inside the input polygon should be selected
         and
         written to the output raster. All cells outside the polygon will
         receive NoData values on the output raster.OUTSIDE-The cells outside
         the input polygon should be selected and
         written to the output raster. All cells inside the polygon will
         receive NoData.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster containing the cell values extracted from the input
         raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, polygons, extraction_area):
        polygons = Utils.multiValueCompoundParameterToString(polygons, arcpy.Point)
        out_raster = "#"
        result = arcpy.gp.ExtractByPolygon_sa(in_raster, polygons, out_raster, extraction_area)
        return _wrapToolRaster("ExtractByPolygon_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, polygons, extraction_area)


ExtractByPolygon.__esri_toolname__ = "ExtractByPolygon_sa"
ExtractByPolygon.__esri_toolinfo__ = ["::::1", "Python::Point::", "::::4"]


def ExtractByRectangle(in_raster, extent, extraction_area: Literal["INSIDE", "OUTSIDE", "#"] | None = "#") -> Raster:
    """ExtractByRectangle_sa(in_raster, extent, {extraction_area})

       Extracts the cells of a raster based on a rectangle by specifying the
       rectangle's extent.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster from which cells will be extracted.
     extent (Extent):
         A rectangle that defines the area to be extracted.MAXOF-The maximum
         extent of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.The coordinates are specified in the same map
         units as the input
         raster.
     extraction_area {String}:
         Specifies whether cells inside or outside the input rectangle will be
         selected and written to the output raster.INSIDE-Cells inside the
         input rectangle will be selected and written
         to the output raster. All cells outside the rectangle will receive
         NoData values on the output raster.OUTSIDE-Cells outside the input
         rectangle will be selected and written
         to the output raster. All cells inside the rectangle will receive
         NoData values on the output raster.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster containing the cell values extracted from the input
         raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, extent, extraction_area):
        extent = Utils.compoundParameterToString(extent, arcpy.Extent)
        out_raster = "#"
        result = arcpy.gp.ExtractByRectangle_sa(in_raster, extent, out_raster, extraction_area)
        return _wrapToolRaster("ExtractByRectangle_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, extent, extraction_area)


ExtractByRectangle.__esri_toolname__ = "ExtractByRectangle_sa"
ExtractByRectangle.__esri_toolinfo__ = ["::::1", "Python::Extent::", "::::4"]


def ExtractMultiValuesToPoints(
    in_point_features, in_rasters, bilinear_interpolate_values: Literal["NONE", "BILINEAR", "#"] | None = "#"
):
    """ExtractMultiValuesToPoints_sa(in_point_features, in_rasters, {bilinear_interpolate_values})

       Extracts cell values at locations specified in a point feature class
       from one or more rasters and records the values to the attribute table
       of the point feature class.

    INPUTS:
     in_point_features (Composite Geodataset):
         The input point features to which raster values will be added.
     in_rasters (Extract Values):
         The input raster (or rasters) values that will be extracted based on
         the input point feature location.Optionally, you can supply the name
         for the field to store the raster
         value. By default, a unique field name will be created based on the
         input raster dataset name.
     bilinear_interpolate_values {Boolean}:
         Specifies whether interpolation will be used.NONE-No interpolation
         will be applied; the value of the cell center
         will be used. This is the default.BILINEAR-The value of the cell will
         be calculated from the adjacent
         cells with valid values using bilinear interpolation. NoData values
         will be ignored in the interpolation unless all adjacent cells are
         NoData."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_point_features, in_rasters, bilinear_interpolate_values):
        result = arcpy.gp.ExtractMultiValuesToPoints_sa(in_point_features, in_rasters, bilinear_interpolate_values)
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_point_features, in_rasters, bilinear_interpolate_values)


ExtractMultiValuesToPoints.__esri_toolname__ = "ExtractMultiValuesToPoints_sa"
ExtractMultiValuesToPoints.__esri_toolinfo__ = ["::::1", "::::2", "::::3"]


def ExtractValuesToPoints(
    in_point_features,
    in_raster,
    out_point_features,
    interpolate_values: Literal["NONE", "INTERPOLATE", "#"] | None = "#",
    add_attributes: Literal["VALUE_ONLY", "ALL", "#"] | None = "#",
):
    """ExtractValuesToPoints_sa(in_point_features, in_raster, out_point_features, {interpolate_values}, {add_attributes})

       Extracts the cell values of a raster based on a set of point features
       and records the values in the attribute table of an output feature
       class.

    INPUTS:
     in_point_features (Composite Geodataset):
         The input point features defining the locations from which you want to
         extract the raster cell values.
     in_raster (Composite Geodataset):
         The raster dataset whose values will be extracted.It can be an integer
         or floating-point type raster.
     interpolate_values {Boolean}:
         Specifies whether interpolation will be used.NONE-No interpolation
         will be applied; the value of the cell center
         will be used. This is the default.INTERPOLATE-The value of the cell
         will be calculated from the adjacent
         cells with valid values using bilinear interpolation. NoData values
         will be ignored in the interpolation unless all adjacent cells are
         NoData.
     add_attributes {Boolean}:
         Determines if the raster attributes are written to the output point
         feature dataset.VALUE_ONLY-Only the value of the input raster is added
         to the point
         attributes. This is the default. ALL-All the fields from the
         input raster (except) will be
         added to the point attributes. Count

    OUTPUTS:
     out_point_features (Feature Class):
         The output point feature dataset containing the extracted raster
         values."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_point_features, in_raster, out_point_features, interpolate_values, add_attributes):
        result = arcpy.gp.ExtractValuesToPoints_sa(
            in_point_features, in_raster, out_point_features, interpolate_values, add_attributes
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_point_features, in_raster, out_point_features, interpolate_values, add_attributes)


ExtractValuesToPoints.__esri_toolname__ = "ExtractValuesToPoints_sa"
ExtractValuesToPoints.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5"]


def FeaturePreservingSmoothing(
    in_raster,
    distance_units: Literal["CELLS", "METERS", "CENTIMETERS", "KILOMETERS", "INCHES", "FEET", "YARDS", "MILES", "#"]
    | None = "#",
    neighborhood_distance="#",
    normal_difference_threshold="#",
    number_iterations="#",
    maximum_elevation_change="#",
    z_unit: Literal[
        "INCH",
        "FOOT",
        "YARD",
        "MILE_US",
        "NAUTICAL_MILE",
        "MILLIMETER",
        "CENTIMETER",
        "METER",
        "KILOMETER",
        "DECIMETER",
        "#",
    ]
    | None = "#",
    analysis_target_device: Literal["GPU_THEN_CPU", "GPU_ONLY", "CPU_ONLY", "#"] | None = "#",
) -> Raster:
    """FeaturePreservingSmoothing_sa(in_raster, {distance_units}, {neighborhood_distance}, {normal_difference_threshold}, {number_iterations}, {maximum_elevation_change}, {z_unit}, {analysis_target_device})

       Smooths a surface raster by removing noise while preserving features.

    INPUTS:
     in_raster (Composite Geodataset):
         The input surface raster.
     distance_units {String}:
         Specifies the distance unit that will be used for the Neighborhood
         Distance parameter. The default is CELLS.CELLS-The distance unit will
         be cells.METERS-The distance unit will be
         meters.CENTIMETERS-The distance unit will be
         centimeters.KILOMETERS-The distance unit will be kilometers.INCHES-The
         distance unit will be inches.FEET-The distance unit will be
         feet.YARDS-The distance unit will be yards.MILES-The distance unit
         will be miles.
     neighborhood_distance {Double}:
         The distance away from the target cell that defines the size of the
         processing neighborhood.The value must be a positive number. The
         default value is 5 cells.
     normal_difference_threshold {Double}:
         The maximum normal difference for a neighboring cell to be included in
         computing a new cell value for the current processing cell. A normal
         difference is an angle formed by the normal vector of a neighboring
         cell and the normal vector of the current processing cell.The value
         can be any number from -180 degrees to 180 degrees. The
         default value is 15 degrees.
     number_iterations {Long}:
         The number of times that the smoothing process will be repeated.The
         value must be a positive integer. The default value is 3.
     maximum_elevation_change {Linear Unit}:
         The allowed maximum height change of any cell in one iteration.When a
         new value is calculated for a cell location, it is compared to
         the original value at that cell location. If the difference is less
         than or equal to this parameter setting, the new cell value will be
         used. Otherwise, the original value will remain unchanged.The value
         must be a positive number. The default value is 0.5 meters.
     z_unit {String}:
         Specifies the linear unit that will be used for vertical z-values.It
         is defined by a vertical coordinate system if it exists. If no
         vertical coordinate system exists, define the z-unit using the unit
         list to ensure correct geodesic computation. The default is
         meter.INCH-The linear unit will be inches.FOOT-The linear unit will be
         feet.YARD-The linear unit will be yards.MILE_US-The linear unit will
         be miles.NAUTICAL_MILE-The linear unit will be nautical
         miles.MILLIMETER-The linear unit will be millimeters.CENTIMETER-The
         linear unit will be centimeters.METER-The linear unit will be
         meters.KILOMETER-The linear unit will be kilometers.DECIMETER-The
         linear unit will be decimeters.
     analysis_target_device {String}:
         Specifies the device that will be used to perform the
         calculation.GPU_THEN_CPU-If a compatible GPU is found, it will be used
         to perform
         the calculation. Otherwise, the CPU will be used. This is the
         default.CPU_ONLY-The calculation will only be performed on the
         CPU.GPU_ONLY-The calculation will only be performed on the GPU.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output smoothed raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_raster,
        distance_units,
        neighborhood_distance,
        normal_difference_threshold,
        number_iterations,
        maximum_elevation_change,
        z_unit,
        analysis_target_device,
    ):
        out_raster = "#"
        result = arcpy.gp.FeaturePreservingSmoothing_sa(
            in_raster,
            out_raster,
            distance_units,
            neighborhood_distance,
            normal_difference_threshold,
            number_iterations,
            maximum_elevation_change,
            z_unit,
            analysis_target_device,
        )
        return _wrapToolRaster("FeaturePreservingSmoothing_sa", str(result.getOutput(0)))

    return Wrapper(
        in_raster,
        distance_units,
        neighborhood_distance,
        normal_difference_threshold,
        number_iterations,
        maximum_elevation_change,
        z_unit,
        analysis_target_device,
    )


FeaturePreservingSmoothing.__esri_toolname__ = "FeaturePreservingSmoothing_sa"
FeaturePreservingSmoothing.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7", "::::8", "::::9"]


def FeatureSolarRadiation(
    in_surface_raster,
    in_features,
    unique_id_field,
    out_table,
    start_date_time,
    end_date_time,
    time_zone: Literal[
        "UTC",
        "Dateline_Standard_Time",
        "UTC-11",
        "Aleutian_Standard_Time",
        "Hawaiian_Standard_Time",
        "Marquesas_Standard_Time",
        "Alaskan_Standard_Time",
        "UTC-09",
        "Pacific_Standard_Time_(Mexico)",
        "UTC-08",
        "Pacific_Standard_Time",
        "US_Mountain_Standard_Time",
        "Mountain_Standard_Time_(Mexico)",
        "Mountain_Standard_Time",
        "Yukon_Standard_Time",
        "Central_America_Standard_Time",
        "Central_Standard_Time",
        "Easter_Island_Standard_Time",
        "Central_Standard_Time_(Mexico)",
        "Canada_Central_Standard_Time",
        "SA_Pacific_Standard_Time",
        "Eastern_Standard_Time_(Mexico)",
        "Eastern_Standard_Time",
        "Haiti_Standard_Time",
        "Cuba_Standard_Time",
        "US_Eastern_Standard_Time",
        "Turks_And_Caicos_Standard_Time",
        "Paraguay_Standard_Time",
        "Atlantic_Standard_Time",
        "Venezuela_Standard_Time",
        "Central_Brazilian_Standard_Time",
        "SA_Western_Standard_Time",
        "Pacific_SA_Standard_Time",
        "Newfoundland_Standard_Time",
        "Tocantins_Standard_Time",
        "E._South_America_Standard_Time",
        "SA_Eastern_Standard_Time",
        "Argentina_Standard_Time",
        "Montevideo_Standard_Time",
        "Magallanes_Standard_Time",
        "Saint_Pierre_Standard_Time",
        "Bahia_Standard_Time",
        "UTC-02",
        "Greenland_Standard_Time",
        "Mid-Atlantic_Standard_Time",
        "Azores_Standard_Time",
        "Cape_Verde_Standard_Time",
        "GMT_Standard_Time",
        "Greenwich_Standard_Time",
        "Sao_Tome_Standard_Time",
        "Morocco_Standard_Time",
        "W._Europe_Standard_Time",
        "Central_Europe_Standard_Time",
        "Romance_Standard_Time",
        "Central_European_Standard_Time",
        "W._Central_Africa_Standard_Time",
        "GTB_Standard_Time",
        "Middle_East_Standard_Time",
        "Egypt_Standard_Time",
        "E._Europe_Standard_Time",
        "West_Bank_Standard_Time",
        "South_Africa_Standard_Time",
        "FLE_Standard_Time",
        "Israel_Standard_Time",
        "South_Sudan_Standard_Time",
        "Kaliningrad_Standard_Time",
        "Sudan_Standard_Time",
        "Libya_Standard_Time",
        "Namibia_Standard_Time",
        "Jordan_Standard_Time",
        "Arabic_Standard_Time",
        "Syria_Standard_Time",
        "Turkey_Standard_Time",
        "Arab_Standard_Time",
        "Belarus_Standard_Time",
        "Russian_Standard_Time",
        "E._Africa_Standard_Time",
        "Volgograd_Standard_Time",
        "Iran_Standard_Time",
        "Arabian_Standard_Time",
        "Astrakhan_Standard_Time",
        "Azerbaijan_Standard_Time",
        "Russia_Time_Zone_3",
        "Mauritius_Standard_Time",
        "Saratov_Standard_Time",
        "Georgian_Standard_Time",
        "Caucasus_Standard_Time",
        "Afghanistan_Standard_Time",
        "West_Asia_Standard_Time",
        "Qyzylorda_Standard_Time",
        "Ekaterinburg_Standard_Time",
        "Pakistan_Standard_Time",
        "India_Standard_Time",
        "Sri_Lanka_Standard_Time",
        "Nepal_Standard_Time",
        "Central_Asia_Standard_Time",
        "Bangladesh_Standard_Time",
        "Omsk_Standard_Time",
        "Myanmar_Standard_Time",
        "SE_Asia_Standard_Time",
        "Altai_Standard_Time",
        "W._Mongolia_Standard_Time",
        "North_Asia_Standard_Time",
        "N._Central_Asia_Standard_Time",
        "Tomsk_Standard_Time",
        "China_Standard_Time",
        "North_Asia_East_Standard_Time",
        "Singapore_Standard_Time",
        "W._Australia_Standard_Time",
        "Taipei_Standard_Time",
        "Ulaanbaatar_Standard_Time",
        "Aus_Central_W._Standard_Time",
        "Transbaikal_Standard_Time",
        "Tokyo_Standard_Time",
        "North_Korea_Standard_Time",
        "Korea_Standard_Time",
        "Yakutsk_Standard_Time",
        "Cen._Australia_Standard_Time",
        "AUS_Central_Standard_Time",
        "E._Australia_Standard_Time",
        "AUS_Eastern_Standard_Time",
        "West_Pacific_Standard_Time",
        "Tasmania_Standard_Time",
        "Vladivostok_Standard_Time",
        "Lord_Howe_Standard_Time",
        "Bougainville_Standard_Time",
        "Russia_Time_Zone_10",
        "Magadan_Standard_Time",
        "Norfolk_Standard_Time",
        "Sakhalin_Standard_Time",
        "Central_Pacific_Standard_Time",
        "Russia_Time_Zone_11",
        "New_Zealand_Standard_Time",
        "UTC+12",
        "Fiji_Standard_Time",
        "Kamchatka_Standard_Time",
        "Chatham_Islands_Standard_Time",
        "UTC+13",
        "Tonga_Standard_Time",
        "Samoa_Standard_Time",
        "Line_Islands_Standard_Time",
        "#",
    ]
    | None = "#",
    adjust_DST: Literal["NOT_ADJUSTED_FOR_DST", "ADJUSTED_FOR_DST", "#"] | None = "#",
    use_time_interval: Literal["NO_INTERVAL", "INTERVAL", "#"] | None = "#",
    interval_unit: Literal["MINUTE", "HOUR", "DAY", "WEEK", "#"] | None = "#",
    interval="#",
    feature_offset="#",
    feature_area="#",
    feature_slope="#",
    feature_aspect="#",
    neighborhood_distance="#",
    use_adaptive_neighborhood: Literal["FIXED_NEIGHBORHOOD", "ADAPTIVE_NEIGHBORHOOD", "#"] | None = "#",
    diffuse_model_type: Literal["UNIFORM_SKY", "STANDARD_OVERCAST_SKY", "#"] | None = "#",
    diffuse_proportion="#",
    transmittivity="#",
    analysis_target_device: Literal["GPU_THEN_CPU", "GPU_ONLY", "CPU_ONLY", "#"] | None = "#",
    out_join_layer="#",
    sunmap_grid_level="#",
):
    """FeatureSolarRadiation_sa(in_surface_raster, in_features, unique_id_field, out_table, start_date_time, end_date_time, {time_zone}, {adjust_DST}, {use_time_interval}, {interval_unit}, {interval}, {feature_offset}, {feature_area}, {feature_slope}, {feature_aspect}, {neighborhood_distance}, {use_adaptive_neighborhood}, {diffuse_model_type}, {diffuse_proportion}, {transmittivity}, {analysis_target_device}, {out_join_layer}, {sunmap_grid_level})

       Calculates the incoming solar insolation for input points or polygon
       features relative to the surface (ground) on Earth or the Moon.

    INPUTS:
     in_surface_raster (Composite Geodataset):
         The input elevation surface raster.
     in_features (Composite Geodataset):
         The input features (point or polygon) that represent a location or
         engineered surface to calculate the amount of solar radiation
         received.
     unique_id_field (Field):
         The field that contains the values that define each feature.It can be
         an integer or a string field of the input features.
     start_date_time (Date):
         The start date and time for the analysis.
     end_date_time (Date):
         The end date and time for the analysis.
     time_zone {String}:
         The time zone that will be used for the start and end time. The
         default is coordinated universal time (UTC).UTC-The time zone will be
         UTC.Dateline_Standard_Time-The time zone
         will be Dateline Standard Time
         (UTC-12:00).UTC-11-The time zone will be UTC-11
         (UTC-11:00).Aleutian_Standard_Time-The time zone will be Aleutian
         Standard Time
         (UTC-10:00).Hawaiian_Standard_Time-The time zone will be Hawaiian
         Standard Time
         (UTC-10:00).Marquesas_Standard_Time-The time zone will be Marquesas
         Standard Time
         (UTC-09:30).Alaskan_Standard_Time-The time zone will be Alaskan
         Standard Time
         (UTC-09:00).UTC-09-The time zone will be UTC-09
         (UTC-09:00).Pacific_Standard_Time_(Mexico)-The time zone will be
         Pacific Standard
         Time (Mexico) (UTC-08:00).UTC-08-The time zone will be UTC-08
         (UTC-08:00).Pacific_Standard_Time-The time zone will be Pacific
         Standard Time
         (UTC-08:00).US_Mountain_Standard_Time-The time zone will be US
         Mountain Standard
         Time (UTC-07:00).Mountain_Standard_Time_(Mexico)-The time zone will be
         Mountain
         Standard Time (Mexico) (UTC-07:00).Mountain_Standard_Time-The time
         zone will be Mountain Standard Time
         (UTC-07:00).Yukon_Standard_Time-The time zone will be Yukon Standard
         Time
         (UTC-07:00).Central_America_Standard_Time-The time zone will be
         Central America
         Standard Time (UTC-06:00).Central_Standard_Time-The time zone will be
         Central Standard Time
         (UTC-06:00).Easter_Island_Standard_Time-The time zone will be Easter
         Island
         Standard Time (UTC-06:00).Central_Standard_Time_(Mexico)-The time zone
         will be Central Standard
         Time (Mexico) (UTC-06:00).Canada_Central_Standard_Time-The time zone
         will be Canada Central
         Standard Time (UTC-06:00).SA_Pacific_Standard_Time-The time zone will
         be SA Pacific Standard
         Time (UTC-05:00).Eastern_Standard_Time_(Mexico)-The time zone will be
         Eastern Standard
         Time (Mexico) (UTC-05:00).Eastern_Standard_Time-The time zone will be
         Eastern Standard Time
         (UTC-05:00).Haiti_Standard_Time-The time zone will be Haiti Standard
         Time
         (UTC-05:00).Cuba_Standard_Time-The time zone will be Cuba Standard
         Time
         (UTC-05:00).US_Eastern_Standard_Time-The time zone will be US Eastern
         Standard
         Time (UTC-05:00).Turks_And_Caicos_Standard_Time-The time zone will be
         Turks And Caicos
         Standard Time (UTC-04:00).Paraguay_Standard_Time-The time zone will be
         Paraguay Standard Time
         (UTC-04:00).Atlantic_Standard_Time-The time zone will be Atlantic
         Standard Time
         (UTC-04:00).Venezuela_Standard_Time-The time zone will be Venezuela
         Standard Time
         (UTC-04:00).Central_Brazilian_Standard_Time-The time zone will be
         Central
         Brazilian Standard Time (UTC-04:00).SA_Western_Standard_Time-The time
         zone will be SA Western Standard
         Time (UTC-04:00).Pacific_SA_Standard_Time-The time zone will be
         Pacific SA Standard
         Time (UTC-04:00).Newfoundland_Standard_Time-The time zone will be
         Newfoundland Standard
         Time (UTC-03:30).Tocantins_Standard_Time-The time zone will be
         Tocantins Standard Time
         (UTC-03:00).E._South_America_Standard_Time-The time zone will be E.
         South America
         Standard Time (UTC-03:00).SA_Eastern_Standard_Time-The time zone will
         be SA Eastern Standard
         Time (UTC-03:00).Argentina_Standard_Time-The time zone will be
         Argentina Standard Time
         (UTC-03:00).Greenland_Standard_Time-The time zone will be Greenland
         Standard Time
         (UTC-03:00).Montevideo_Standard_Time-The time zone will be Montevideo
         Standard
         Time (UTC-03:00).Magallanes_Standard_Time-The time zone will be
         Magallanes Standard
         Time (UTC-03:00).Saint_Pierre_Standard_Time-The time zone will be
         Saint Pierre Standard
         Time (UTC-03:00).Bahia_Standard_Time-The time zone will be Bahia
         Standard Time
         (UTC-03:00).UTC-02-The time zone will be UTC-02 (UTC-02:00).Mid-
         Atlantic_Standard_Time-The time zone will be Mid-Atlantic Standard
         Time (UTC-02:00).Azores_Standard_Time-The time zone will be Azores
         Standard Time
         (UTC-01:00).Cape_Verde_Standard_Time-The time zone will be Cape Verde
         Standard
         Time (UTC-01:00).GMT_Standard_Time-The time zone will be GMT Standard
         Time (UTC+00:00).Greenwich_Standard_Time-The time zone will be
         Greenwich Standard Time
         (UTC+00:00).Sao_Tome_Standard_Time-The time zone will be Sao Tome
         Standard Time
         (UTC+00:00).Morocco_Standard_Time-The time zone will be Morocco
         Standard Time
         (UTC+00:00).W._Europe_Standard_Time-The time zone will be W. Europe
         Standard Time
         (UTC+01:00).Central_Europe_Standard_Time-The time zone will be Central
         Europe
         Standard Time (UTC+01:00).Romance_Standard_Time-The time zone will be
         Romance Standard Time
         (UTC+01:00).Central_European_Standard_Time-The time zone will be
         Central European
         Standard Time (UTC+01:00).W._Central_Africa_Standard_Time-The time
         zone will be W. Central
         Africa Standard Time (UTC+01:00).Jordan_Standard_Time-The time zone
         will be Jordan Standard Time
         (UTC+02:00).GTB_Standard_Time-The time zone will be GTB Standard Time
         (UTC+02:00).Middle_East_Standard_Time-The time zone will be Middle
         East Standard
         Time (UTC+02:00).Egypt_Standard_Time-The time zone will be Egypt
         Standard Time
         (UTC+02:00).E._Europe_Standard_Time-The time zone will be E. Europe
         Standard Time
         (UTC+02:00).Syria_Standard_Time-The time zone will be Syria Standard
         Time
         (UTC+02:00).West_Bank_Standard_Time-The time zone will be West Bank
         Standard Time
         (UTC+02:00).South_Africa_Standard_Time-The time zone will be South
         Africa Standard
         Time (UTC+02:00).FLE_Standard_Time-The time zone will be FLE Standard
         Time (UTC+02:00).Israel_Standard_Time-The time zone will be Israel
         Standard
         (UTC+02:00).South_Sudan_Standard_Time-The time zone will be South
         Sudan Standard
         Time (UTC+02:00).Kaliningrad_Standard_Time-The time zone will be
         Kaliningrad Standard
         Time (UTC+02:00).Sudan_Standard_Time-The time zone will be Sudan
         Standard Time
         (UTC+02:00).Libya_Standard_Time-The time zone will be Libya Standard
         Time
         (UTC+02:00).Namibia_Standard_Time-The time zone will be Namibia
         Standard Time
         (UTC+02:00).Arabic_Standard_Time-The time zone will be Arabic Standard
         Time
         (UTC+03:00).Turkey_Standard_Time-The time zone will be Turkey Standard
         Time
         (UTC+03:00).Arab_Standard_Time-The time zone will be Arab Standard
         Time
         (UTC+03:00).Belarus_Standard_Time-The time zone will be Belarus
         Standard Time
         (UTC+03:00).Russian_Standard_Time-The time zone will be Russian
         Standard Time
         (UTC+03:00).E._Africa_Standard_Time-The time zone will be E. Africa
         Standard Time
         (UTC+03:00).Volgograd_Standard_Time-The time zone will be Volgograd
         Standard Time
         (UTC+03:00).Iran_Standard_Time-The time zone will be Iran Standard
         Time
         (UTC+03:30).Arabian_Standard_Time-The time zone will be Arabian
         Standard Time
         (UTC+04:00).Astrakhan_Standard_Time-The time zone will be Astrakhan
         Standard Time
         (UTC+04:00).Azerbaijan_Standard_Time-The time zone will be Azerbaijan
         Standard
         Time (UTC+04:00).Russia_Time_Zone_3-The time zone will be Russia Time
         Zone 3
         (UTC+04:00).Mauritius_Standard_Time-The time zone will be Mauritius
         Standard Time
         (UTC+04:00).Saratov_Standard_Time-The time zone will be Saratov
         Standard Time
         (UTC+04:00).Georgian_Standard_Time-The time zone will be Georgian
         Standard Time
         (UTC+04:00).Caucasus_Standard_Time-The time zone will be Caucasus
         Standard Time
         (UTC+04:00).Afghanistan_Standard_Time-The time zone will be
         Afghanistan Standard
         Time (UTC+04:30).West_Asia_Standard_Time-The time zone will be West
         Asia Standard Time
         (UTC+05:00).Ekaterinburg_Standard_Time-The time zone will be
         Ekaterinburg Standard
         Time (UTC+05:00).Pakistan_Standard_Time-The time zone will be Pakistan
         Standard Time
         (UTC+05:00).Qyzylorda_Standard_Time-The time zone will be Qyzylorda
         Standard Time
         (UTC+05:00).India_Standard_Time-The time zone will be India Standard
         Time
         (UTC+05:30).Sri_Lanka_Standard_Time-The time zone will be Sri Lanka
         Standard Time
         (UTC+05:30).Nepal_Standard_Time-The time zone will be Nepal Standard
         Time
         (UTC+05:45).Central_Asia_Standard_Time-The time zone will be Central
         Asia Standard
         Time (UTC+06:00).Bangladesh_Standard_Time-The time zone will be
         Bangladesh Standard
         Time (UTC+06:00).Omsk_Standard_Time-The time zone will be Omsk
         Standard Time
         (UTC+06:00).Myanmar_Standard_Time-The time zone will be Myanmar
         Standard Time
         (UTC+06:30).SE_Asia_Standard_Time-The time zone will be SE Asia
         Standard Time
         (UTC+07:00).Altai_Standard_Time-The time zone will be Altai Standard
         Time
         (UTC+07:00).W._Mongolia_Standard_Time-The time zone will be W.
         Mongolia Standard
         Time (UTC+07:00).North_Asia_Standard_Time-The time zone will be North
         Asia Standard
         Time (UTC+07:00).N._Central_Asia_Standard_Time-The time zone will be
         N. Central Asia
         Standard Time (UTC+07:00).Tomsk_Standard_Time-The time zone will be
         Tomsk Standard Time
         (UTC+07:00).China_Standard_Time-The time zone will be China Standard
         Time
         (UTC+08:00).North_Asia_East_Standard_Time-The time zone will be North
         Asia East
         Standard Time (UTC+08:00).Singapore_Standard_Time-The time zone will
         be Singapore Standard Time
         (UTC+08:00).W._Australia_Standard_Time-The time zone will be W.
         Australia Standard
         Time (UTC+08:00).Taipei_Standard_Time-The time zone will be Taipei
         Standard Time
         (UTC+08:00).Ulaanbaatar_Standard_Time-The time zone will be
         Ulaanbaatar Standard
         Time (UTC+08:00).Aus_Central_W._Standard_Time-The time zone will be
         Aus Central W.
         Standard Time (UTC+08:45).Transbaikal_Standard_Time-The time zone will
         be Transbaikal Standard
         Time (UTC+09:00).Tokyo_Standard_Time-The time zone will be Tokyo
         Standard Time
         (UTC+09:00).North_Korea_Standard_Time-The time zone will be North
         Korea Standard
         Time (UTC+09:00).Korea_Standard_Time-The time zone will be Korea
         Standard Time
         (UTC+09:00).Yakutsk_Standard_Time-The time zone will be Yakutsk
         Standard Time
         (UTC+09:00).Cen._Australia_Standard_Time-The time zone will be Cen.
         Australia
         Standard Time (UTC+09:30).AUS_Central_Standard_Time-The time zone will
         be AUS Central Standard
         Time (UTC+09:30).E._Australia_Standard_Time-The time zone will be E.
         Australia Standard
         Time (UTC+10:00).AUS_Eastern_Standard_Time-The time zone will be AUS
         Eastern Standard
         Time (UTC+10:00).West_Pacific_Standard_Time-The time zone will be West
         Pacific Standard
         Time (UTC+10:00).Tasmania_Standard_Time-The time zone will be Tasmania
         Standard Time
         (UTC+10:00).Vladivostok_Standard_Time-The time zone will be
         Vladivostok Standard
         Time (UTC+10:00).Lord_Howe_Standard_Time-The time zone will be Lord
         Howe Standard Time
         (UTC+10:30).Bougainville_Standard_Time-The time zone will be
         Bougainville Standard
         Time (UTC+11:00).Russia_Time_Zone_10-The time zone will be Russia Time
         Zone 10
         (UTC+11:00).Magadan_Standard_Time-The time zone will be Magadan
         Standard Time
         (UTC+11:00).Norfolk_Standard_Time-The time zone will be Norfolk
         Standard Time
         (UTC+11:00).Sakhalin_Standard_Time-The time zone will be Sakhalin
         Standard Time
         (UTC+11:00).Central_Pacific_Standard_Time-The time zone will be
         Central Pacific
         Standard Time (UTC+11:00).Russia_Time_Zone_11-The time zone will be
         Russia Time Zone 11
         (UTC+11:00).New_Zealand_Standard_Time-The time zone will be New
         Zealand Standard
         Time (UTC+12:00).UTC+12-The time zone will be UTC+12
         (UTC+12:00).Fiji_Standard_Time-The time zone will be Fiji Standard
         Time
         (UTC+12:00).Kamchatka_Standard_Time-The time zone will be Kamchatka
         Standard Time
         (UTC+12:00).Chatham_Islands_Standard_Time-The time zone will be
         Chatham Islands
         Standard Time (UTC+12:45).UTC+13-The time zone will be UTC+13
         (UTC+13:00).Tonga_Standard_Time-The time zone will be Tonga Standard
         Time
         (UTC+13:00).Samoa_Standard_Time-The time zone will be Samoa Standard
         Time
         (UTC+13:00).Line_Islands_Standard_Time-The time zone will be Line
         Islands Standard
         Time (UTC+14:00).
     adjust_DST {Boolean}:
         Specifies whether the input time configuration will be adjusted for
         daylight saving time.This parameter is not applicable for analysis on
         the Moon.NOT_ADJUSTED_FOR_DST-The input time values will not be
         adjusted for
         daylight saving time. This is the default.ADJUSTED_FOR_DST-The input
         time values will be adjusted for daylight
         saving time.
     use_time_interval {Boolean}:
         Specifies whether a single total insolation value will be calculated
         for the entire time configuration or multiple radiation values will be
         calculated for the specified interval.NO_INTERVAL-A single radiation
         value will be calculated for the entire
         time configuration. This is default.INTERVAL-Multiple radiation values
         will be calculated for each time
         interval over the entire time configuration.
     interval_unit {String}:
         Specifies the time unit that will be used for calculating solar
         radiation values over the entire time configuration.This parameter is
         only supported when the use_time_interval parameter
         is set to INTERVAL.MINUTE-The interval unit will be minutes. This
         option is only
         available for Earth-based data.HOUR-The interval unit will be
         hours.DAY-The interval unit will be days. This is the defaultWEEK-The
         interval unit will be weeks.
     interval {Long}:
         The value of the duration or time between intervals.The default value
         is dependent on the interval unit specified. The
         default value for each of the available units are listed
         below.MINUTE-60HOUR-4DAY-14WEEK-2
     feature_offset {Double / Field}:
         A vertical distance that will be added to the raster surface for
         analysis. It must be a positive integer or floating-point value.You
         can select a field from the input features dataset, or you can
         provide a numerical value.For example, if the object is a panel,
         provide the height of the
         panel.If a value is provided for this parameter, that value will be
         used by
         all features. To specify different values for each individual feature,
         select a field from the input features dataset.The default value is 0.
     feature_area {Double / Field}:
         The area associated with the input features. It must be a positive
         integer or floating-point value.You can select a field from the input
         features dataset, or you can
         provide a numerical value.For example, if the object is a panel,
         provide the area of the panel.If a value is provided for this
         parameter, that value will be used by
         all features. To specify different values for each individual feature,
         select a field from the input features dataset.By default, the area is
         obtained from the input features. For point
         features, the default area is 0.
     feature_slope {Double / Field}:
         The relative slope or incline associated with the input features. It
         must be a positive integer or floating-point value.You can select a
         field from the input features dataset, or you can
         provide a numerical value.For example, if the object is a panel,
         provide the incline of the
         panel.If a value is provided for this parameter, that value will be
         used by
         all features. To specify different values for each individual feature,
         select a field from the input features dataset.Slope is expressed in
         degrees from 0 to 90. The default values for
         analysis are calculated from the underlying values of the input
         surface raster.
     feature_aspect {Double / Field}:
         The relative aspect or direction associated with the input features.
         It must be a positive integer or floating-point value.You can select a
         field from the input features dataset, or you can
         provide a numerical value.For example, if the object is a panel,
         provide the direction of the
         panel face.If a value is provided for this parameter, that value will
         be used by
         all features. To specify different values for each individual feature,
         select a field from the input features dataset.Aspect is expressed in
         degrees from 0 to 360. The default values for
         analysis area calculated from the underlying values of the input
         surface raster.
     neighborhood_distance {Linear Unit}:
         The distance from the target cell center for which the output
         insolation value will be calculated. It determines the size of the
         neighborhood.The default value is the input surface raster cell size,
         resulting in
         a 3 by 3 neighborhood.
     use_adaptive_neighborhood {Boolean}:
         Specifies whether neighborhood distance will vary with landscape
         changes (adaptive). The maximum distance is determined by the
         neighborhood distance. The minimum distance is the input raster cell
         size.FIXED_NEIGHBORHOOD-A single (fixed) neighborhood distance will be
         used
         at all locations. This is the default.ADAPTIVE_NEIGHBORHOOD-An
         adaptive neighborhood distance will be used
         at all locations.
     diffuse_model_type {String}:
         Specifies the type of diffuse radiation model that will be
         used.UNIFORM_SKY-The uniform diffuse model will be used. The incoming
         diffuse radiation is the same from all sky directions. This is the
         default.STANDARD_OVERCAST_SKY-The standard overcast diffuse model will
         be
         used. The incoming diffuse radiation flux varies with the zenith
         angle.
     diffuse_proportion {Double}:
         The proportion of global normal radiation flux that is diffuse. Values
         range from 0 to 1.Set this value according to atmospheric conditions.
         The default value
         is 0.3 for generally clear sky conditions.
     transmittivity {Double}:
         The fraction of radiation that passes through the atmosphere (averaged
         overall wavelengths). Values range from 0 (no transmission) to 1 (all
         transmission).The default is 0.5 for a generally clear sky.
     analysis_target_device {String}:
         Specifies the device that will be used to perform the
         calculation.GPU_THEN_CPU-If a compatible GPU is found, it will be used
         to perform
         the calculation. Otherwise, the CPU will be used. This is the
         default.CPU_ONLY-The calculation will only be performed on the
         CPU.GPU_ONLY-The calculation will only be performed on the GPU.
     sunmap_grid_level {Long}:
         The resolution that will be used to generate the H3 hexagonal grid
         cells used for internal calculations. A lower grid level value creates
         fewer, larger sun map areas and decreases tool run time. A higher grid
         level creates more smaller sun maps improving the accuracy of the
         result.Valid values of the sun map grid level for Earth range from 5
         to 7.
         For the Moon, the valid value range is from 4 to 6.By default, the
         grid level is determined by the input surface raster.
         When analyzing surface data on Earth, if the analysis cell size is
         less than or equal to 4 meters, the default grid level is 6. If the
         analysis cell size is greater than 4 meters, the default grid level is
         5. For analyzing surface data on the Moon, the default grid level is
         6.

    OUTPUTS:
     out_table (Table):
         The output table that will contain the summary of the amount of solar
         radiation received by the input featuresThe format of the table is
         determined by the output location and path.
         By default, the output will be a geodatabase table if in a geodatabase
         workspace, or a dBASE table if in a file workspace.
     out_join_layer {Feature Layer}:
         The output layer that will be created by joining the output table to
         the input feature class. This is an optional output."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_surface_raster,
        in_features,
        unique_id_field,
        out_table,
        start_date_time,
        end_date_time,
        time_zone,
        adjust_DST,
        use_time_interval,
        interval_unit,
        interval,
        feature_offset,
        feature_area,
        feature_slope,
        feature_aspect,
        neighborhood_distance,
        use_adaptive_neighborhood,
        diffuse_model_type,
        diffuse_proportion,
        transmittivity,
        analysis_target_device,
        out_join_layer,
        sunmap_grid_level,
    ):
        result = arcpy.gp.FeatureSolarRadiation_sa(
            in_surface_raster,
            in_features,
            unique_id_field,
            out_table,
            start_date_time,
            end_date_time,
            time_zone,
            adjust_DST,
            use_time_interval,
            interval_unit,
            interval,
            feature_offset,
            feature_area,
            feature_slope,
            feature_aspect,
            neighborhood_distance,
            use_adaptive_neighborhood,
            diffuse_model_type,
            diffuse_proportion,
            transmittivity,
            analysis_target_device,
            out_join_layer,
            sunmap_grid_level,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_surface_raster,
        in_features,
        unique_id_field,
        out_table,
        start_date_time,
        end_date_time,
        time_zone,
        adjust_DST,
        use_time_interval,
        interval_unit,
        interval,
        feature_offset,
        feature_area,
        feature_slope,
        feature_aspect,
        neighborhood_distance,
        use_adaptive_neighborhood,
        diffuse_model_type,
        diffuse_proportion,
        transmittivity,
        analysis_target_device,
        out_join_layer,
        sunmap_grid_level,
    )


FeatureSolarRadiation.__esri_toolname__ = "FeatureSolarRadiation_sa"
FeatureSolarRadiation.__esri_toolinfo__ = [
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


def Fill(in_surface_raster, z_limit="#") -> Raster:
    """Fill_sa(in_surface_raster, {z_limit})

       Fills sinks in a surface raster to remove small imperfections in the
       data.

    INPUTS:
     in_surface_raster (Composite Geodataset):
         The input raster representing a continuous surface.
     z_limit {Double}:
         Maximum elevation difference between a sink and its pour point to be
         filled.If the difference in z-values between a sink and its pour point
         is
         greater than the z_limit, that sink will not be filled.The value for
         z-limit must be greater than zero.Unless a value is specified for this
         parameter, all sinks will be
         filled, regardless of depth.

    OUTPUTS:
     out_surface_raster (Raster Dataset):
         The output surface raster after the sinks have been filled.If the
         surface raster is integer, the output filled raster will be
         integer type. If the input is floating point, the output raster will
         be floating point."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_surface_raster, z_limit):
        out_surface_raster = "#"
        result = arcpy.gp.Fill_sa(in_surface_raster, out_surface_raster, z_limit)
        return _wrapToolRaster("Fill_sa", str(result.getOutput(0)))

    return Wrapper(in_surface_raster, z_limit)


Fill.__esri_toolname__ = "Fill_sa"
Fill.__esri_toolinfo__ = ["::::1", "::::3"]


def Filter(
    in_raster,
    filter_type: Literal["LOW", "HIGH", "#"] | None = "#",
    ignore_nodata: Literal["DATA", "NODATA", "#"] | None = "#",
) -> Raster:
    """Filter_sa(in_raster, {filter_type}, {ignore_nodata})

       Performs either a smoothing (Low pass) or edge-enhancing (High pass)
       filter on a raster.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster on which to perform the filter operation.
     filter_type {String}:
         The type of filter operation to perform.LOW-Traverses a low pass
         3-by-3 filter over the raster. This option
         smooths the entire input raster and reduces the significance of
         anomalous cells. This is the default.HIGH-Traverses a high pass 3-by-3
         filter over the raster. This option
         enhances the edges of subdued features in a raster.
     ignore_nodata {Boolean}:
         Denotes whether NoData values are ignored by the filter
         calculation.DATA-If a NoData value exists within the filter, the
         NoData value will
         be ignored. Only cells within the filter that have data values will be
         used in determining the output. This is the default.NODATA-If a NoData
         value exists within the filter, the output for the
         processing cell will be NoData. With this option, the presence of a
         NoData value implies that there is insufficient information to
         determine the statistic value for the neighborhood.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output filtered raster.The output is always floating point."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, filter_type, ignore_nodata):
        out_raster = "#"
        result = arcpy.gp.Filter_sa(in_raster, out_raster, filter_type, ignore_nodata)
        return _wrapToolRaster("Filter_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, filter_type, ignore_nodata)


Filter.__esri_toolname__ = "Filter_sa"
Filter.__esri_toolinfo__ = ["::::1", "::::3", "::::4"]


def Float(in_raster_or_constant) -> Raster:
    """Float_sa(in_raster_or_constant)

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


Float.__esri_toolname__ = "Float_sa"
Float.__esri_toolinfo__ = ["::::1"]


def FlowAccumulation(
    in_flow_direction_raster,
    in_weight_raster="#",
    data_type: Literal["FLOAT", "INTEGER", "DOUBLE", "#"] | None = "#",
    flow_direction_type: Literal["D8", "DINF", "#"] | None = "#",
) -> Raster:
    """FlowAccumulation_sa(in_flow_direction_raster, {in_weight_raster}, {data_type}, {flow_direction_type})

       Creates a raster of accumulated flow into each cell. A weight factor
       can optionally be applied.

    INPUTS:
     in_flow_direction_raster (Composite Geodataset):
         The input raster that shows the direction of flow out of each cell.The
         flow direction raster can be created using the Flow Direction
         tool.The flow direction raster can be created using the D8, Multiple
         Flow
         Direction (MFD), or D-Infinity method. Use the flow_direction_type
         parameter to specify the method used when the flow direction raster
         was created.
     in_weight_raster {Composite Geodataset}:
         An optional input raster for applying a weight to each cell.If no
         weight raster is specified, a default weight of 1 will be
         applied to each cell. For each cell in the output raster, the result
         will be the number of cells that flow into it.
     data_type {String}:
         The output accumulation raster can be integer, floating point, or
         double type.FLOAT-The output raster will be floating point type. This
         is the
         default.INTEGER-The output raster will be integer type.DOUBLE-The
         output raster will be double type.
     flow_direction_type {String}:
         Specifies the input flow direction raster type.D8-The input flow
         direction raster is of type D8. This is the
         default.MFD-The input flow direction raster is of type Multi Flow
         Direction
         (MFD).DINF-The input flow direction raster is of type D-Infinity
         (DINF).

    OUTPUTS:
     out_accumulation_raster (Raster Dataset):
         The output raster that shows the accumulated flow to each cell."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_flow_direction_raster, in_weight_raster, data_type, flow_direction_type):
        out_accumulation_raster = "#"
        result = arcpy.gp.FlowAccumulation_sa(
            in_flow_direction_raster, out_accumulation_raster, in_weight_raster, data_type, flow_direction_type
        )
        return _wrapToolRaster("FlowAccumulation_sa", str(result.getOutput(0)))

    return Wrapper(in_flow_direction_raster, in_weight_raster, data_type, flow_direction_type)


FlowAccumulation.__esri_toolname__ = "FlowAccumulation_sa"
FlowAccumulation.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5"]


def FlowDirection(
    in_surface_raster,
    force_flow: Literal["NORMAL", "FORCE", "#"] | None = "#",
    out_drop_raster="#",
    flow_direction_type: Literal["D8", "MFD", "DINF", "#"] | None = "#",
) -> Raster:
    """FlowDirection_sa(in_surface_raster, {force_flow}, {out_drop_raster}, {flow_direction_type})

       Creates a raster of flow direction from each cell to its downslope
       neighbor, or neighbors, using the D8, Multiple Flow Direction (MFD),
       or D-Infinity (DINF) method.

    INPUTS:
     in_surface_raster (Composite Geodataset):
         The input raster representing a continuous surface.
     force_flow {Boolean}:
         Specifies whether edge cells will always flow outward or follow normal
         flow rules.NORMAL-If the maximum drop on the inside of an edge cell is
         greater
         than zero, the flow direction will be determined as usual; otherwise,
         the flow direction will be toward the edge. Cells that should flow
         from the edge of the surface raster inward will do so. This is the
         default.FORCE-All cells at the edge of the surface raster will flow
         outward
         from the surface raster.
     flow_direction_type {String}:
         Specifies the type of flow method that will be used when computing
         flow directions.D8-Flow direction will be determined by the D8 method.
         This method
         assigns flow direction to the steepest downslope neighbor. This is the
         default.MFD-Flow direction will be based on the MFD flow method. Flow
         direction will be partitioned across downslope neighbors according to
         an adaptive partition exponent.DINF-Flow direction will be based on
         the DINF flow method. This method
         assigns flow direction to the steepest slope of a triangular facet.

    OUTPUTS:
     out_flow_direction_raster (Raster Dataset):
         The output raster that shows the flow direction from each cell to its
         downslope neighbors or neighbors using the D8, MFD, or DINF
         method.This output is of integer type.
     out_drop_raster {Raster Dataset}:
         An optional output drop raster.The drop raster returns the ratio of
         the maximum change in elevation
         from each cell along the direction of flow to the path length between
         centers of cells, expressed in percentages.This output is of floating-
         point type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_surface_raster, force_flow, out_drop_raster, flow_direction_type):
        out_flow_direction_raster = "#"
        result = arcpy.gp.FlowDirection_sa(
            in_surface_raster, out_flow_direction_raster, force_flow, out_drop_raster, flow_direction_type
        )
        return _wrapToolRaster("FlowDirection_sa", str(result.getOutput(0)))

    return Wrapper(in_surface_raster, force_flow, out_drop_raster, flow_direction_type)


FlowDirection.__esri_toolname__ = "FlowDirection_sa"
FlowDirection.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5"]


def FlowDistance(
    in_stream_raster,
    in_surface_raster,
    in_flow_direction_raster="#",
    distance_type: Literal["VERTICAL", "HORIZONTAL", "#"] | None = "#",
    flow_direction_type: Literal["MFD", "#"] | None = "#",
    statistics_type: Literal["MINIMUM", "WEIGHTED_MEAN", "MAXIMUM", "#"] | None = "#",
) -> Raster:
    """FlowDistance_sa(in_stream_raster, in_surface_raster, {in_flow_direction_raster}, {distance_type}, {flow_direction_type}, {statistics_type})

       Computes, for each cell, the horizontal or vertical component of
       downslope distance, following the flow paths, to cells on a stream
       into which they flow. In case of multiple flow paths, minimum,
       weighted mean, or maximum flow distance can be computed.

    INPUTS:
     in_stream_raster (Composite Geodataset):
         An input stream raster that represents a linear stream network.
     in_surface_raster (Composite Geodataset):
         The input raster representing a continuous surface.
     in_flow_direction_raster {Composite Geodataset}:
         The input raster that shows the direction of flow out of each
         cell.When a flow direction raster is provided, the down slope
         direction(s)
         will be limited to those defined by the input flow directions.The flow
         direction raster can be created using the Flow Direction
         tool.The flow direction raster can be created using the D8, Multiple
         Flow
         Direction (MFD), or D-Infinity method. Use the flow_direction_type
         parameter to specify the method used when the flow direction raster
         was created.
     distance_type {String}:
         Determines if the vertical or horizontal component of flow distance is
         calculated.VERTICAL-The flow distance calculations represent the
         vertical
         component of flow distance, following the flow path, from each cell in
         the domain to cell(s) on the stream into which they flow. This is the
         default.HORIZONTAL-The flow distance calculations represent the
         horizontal
         component of flow distance, following the flow path, from each cell in
         the domain to cell(s) on the stream into which they flow.
     flow_direction_type {String}:
         Specifies the input flow direction raster type.D8-The input flow
         direction raster is of type D8. This is the
         default.MFD-The input flow direction raster is of type Multi Flow
         Direction
         (MFD).DINF-The input flow direction raster is of type D-Infinity
         (DINF).
     statistics_type {String}:
         Determines the statistics type used to compute flow distance over
         multiple flow paths. If there is only a single flow path from each
         cell to a cell on the stream, all statistics types produce the same
         result.MINIMUM-Where multiple flow paths exist, minimum flow distance
         in
         computed. This is the default.WEIGHTED_MEAN-Where multiple flow paths
         exist, a weighted mean of flow
         distance is computed. Flow proportion from a cell to its downstream
         neighboring cells are used as weights for computing weighted
         mean.MAXIMUM-When multiple flow paths exist, maximum flow distance is
         computed.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output flow distance raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_stream_raster,
        in_surface_raster,
        in_flow_direction_raster,
        distance_type,
        flow_direction_type,
        statistics_type,
    ):
        out_raster = "#"
        result = arcpy.gp.FlowDistance_sa(
            in_stream_raster,
            in_surface_raster,
            out_raster,
            in_flow_direction_raster,
            distance_type,
            flow_direction_type,
            statistics_type,
        )
        return _wrapToolRaster("FlowDistance_sa", str(result.getOutput(0)))

    return Wrapper(
        in_stream_raster,
        in_surface_raster,
        in_flow_direction_raster,
        distance_type,
        flow_direction_type,
        statistics_type,
    )


FlowDistance.__esri_toolname__ = "FlowDistance_sa"
FlowDistance.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "::::6", "::::7"]


def FlowLength(
    in_flow_direction_raster,
    direction_measurement: Literal["DOWNSTREAM", "UPSTREAM", "#"] | None = "#",
    in_weight_raster="#",
) -> Raster:
    """FlowLength_sa(in_flow_direction_raster, {direction_measurement}, {in_weight_raster})

       Calculates the upstream or downstream distance, or weighted distance,
       along the flow path for each cell.

    INPUTS:
     in_flow_direction_raster (Composite Geodataset):
         The input raster that shows the direction of flow out of each cell.The
         flow direction raster can be created using the Flow Direction
         tool.
     direction_measurement {String}:
         The direction of measurement along the flow path.DOWNSTREAM-Calculates
         the downslope distance along the flow path, from
         each cell to a sink or outlet on the edge of the
         raster.UPSTREAM-Calculates the longest upslope distance along the flow
         path,
         from each cell to the top of the drainage divide.
     in_weight_raster {Composite Geodataset}:
         An optional input raster for applying a weight to each cell.If no
         weight raster is specified, a default weight of 1 will be
         applied to each cell. For each cell in the output raster, the result
         will be the number of cells that flow into it.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster that shows for each cell the upstream or downstream
         distance along a flow path."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_flow_direction_raster, direction_measurement, in_weight_raster):
        out_raster = "#"
        result = arcpy.gp.FlowLength_sa(in_flow_direction_raster, out_raster, direction_measurement, in_weight_raster)
        return _wrapToolRaster("FlowLength_sa", str(result.getOutput(0)))

    return Wrapper(in_flow_direction_raster, direction_measurement, in_weight_raster)


FlowLength.__esri_toolname__ = "FlowLength_sa"
FlowLength.__esri_toolinfo__ = ["::::1", "::::3", "::::4"]


def FocalFlow(in_surface_raster, threshold_value="#") -> Raster:
    """FocalFlow_sa(in_surface_raster, {threshold_value})

       Determines the flow of the values in the input raster within each
       cell's immediate neighborhood.

    INPUTS:
     in_surface_raster (Composite Geodataset):
         The input surface raster for which to calculate the focal flow.The
         eight immediate neighbors of each cell are evaluated to determine
         the flow.The input raster can be integer or floating-point.
     threshold_value {Double}:
         Defines a value that constitutes the threshold, which must be equaled
         or exceeded before flow can occur.The threshold value can be either an
         integer or floating-point value.If the difference between the value at
         a neighboring cell location and
         the value of the processing cell is less than or equal to the
         threshold value, the output will be 0 (or no flow).

    OUTPUTS:
     out_raster (Raster Dataset):
         The output focal flow raster.The output raster is always of integer
         type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_surface_raster, threshold_value):
        out_raster = "#"
        result = arcpy.gp.FocalFlow_sa(in_surface_raster, out_raster, threshold_value)
        return _wrapToolRaster("FocalFlow_sa", str(result.getOutput(0)))

    return Wrapper(in_surface_raster, threshold_value)


FocalFlow.__esri_toolname__ = "FocalFlow_sa"
FocalFlow.__esri_toolinfo__ = ["::::1", "::::3"]


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
    """FocalStatistics_sa(in_raster, {neighborhood}, {statistics_type}, {ignore_nodata}, {percentile_value})

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


FocalStatistics.__esri_toolname__ = "FocalStatistics_sa"
FocalStatistics.__esri_toolinfo__ = [
    "::::1",
    "Python::NbrAnnulus|NbrCircle|NbrIrregular|NbrRectangle|NbrWedge|NbrWeight::",
    "::::4",
    "::::5",
    "::::6",
]


def FuzzyMembership(
    in_raster, fuzzy_function="#", hedge: Literal["NONE", "SOMEWHAT", "VERY", "#"] | None = "#"
) -> Raster:
    """FuzzyMembership_sa(in_raster, {fuzzy_function}, {hedge})

       Transforms the input raster  into a 0 to 1 scale, indicating the
       strength of a membership in a set, based on a specified fuzzification
       algorithm.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster whose values will be scaled from 0 to 1.It can be an
         integer or a floating-point raster.
     fuzzy_function {Fuzzy function}:
         Specifies the algorithm used in fuzzification of the input raster.The
         fuzzy classes are used to specify the type of membership. The
         types of membership classes are:        FuzzyGaussian,
         FuzzyLarge, FuzzyLinear, FuzzyMSLarge, FuzzyMSSmall,
         FuzzyNear, and FuzzySmall. The following are the forms of the
         membership classes:
         FuzzyGaussian({midpoint},{spread})FuzzyLarge({midpoint},{spread})Fuzzy
         Linear({minimum},{maximum})FuzzyMSLarge({meanMultiplier},{STDMultiplie
         r})FuzzyMSSmall({meanMultiplier},{STDMultiplier})FuzzyNear({midpoint},
         {spread})FuzzySmall({midpoint},{spread})
     hedge {String}:
         Defining a hedge increases or decreases the fuzzy membership values
         which modify the meaning of a fuzzy set. Hedges are useful to help in
         controlling the criteria or important attributes.NONE-No hedge is
         applied. This is the default.SOMEWHAT-Known as
         dilation, defined as the square root of the fuzzy
         membership function. This hedge increases the fuzzy membership
         functions.VERY-Also known as concentration, defined as the fuzzy
         membership
         function squared. This hedge decreases the fuzzy membership functions.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output will be a floating-point raster with values ranging from 0
         to 1."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, fuzzy_function, hedge):
        fuzzy_function = Utils.compoundParameterToString(fuzzy_function, ParameterClasses._FuzzyMembership)
        out_raster = "#"
        result = arcpy.gp.FuzzyMembership_sa(in_raster, out_raster, fuzzy_function, hedge)
        return _wrapToolRaster("FuzzyMembership_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, fuzzy_function, hedge)


FuzzyMembership.__esri_toolname__ = "FuzzyMembership_sa"
FuzzyMembership.__esri_toolinfo__ = [
    "::::1",
    "Python::FuzzyGaussian|FuzzyLarge|FuzzyLinear|FuzzyMSLarge|FuzzyMSSmall|FuzzyNear|FuzzySmall::",
    "::::4",
]


def FuzzyOverlay(
    in_rasters, overlay_type: Literal["AND", "OR", "SUM", "PRODUCT", "GAMMA", "#"] | None = "#", gamma="#"
) -> Raster:
    """FuzzyOverlay_sa(in_rasters;in_rasters..., {overlay_type}, {gamma})

       Combine fuzzy membership rasters data together, based on selected
       overlay type.

    INPUTS:
     in_rasters (Composite Geodataset):
         A list of input membership rasters to be combined in the overlay.
     overlay_type {String}:
         Specifies the method used to combine two or more membership
         data.AND-The minimum of the fuzzy memberships from the input fuzzy
         rasters.OR-The maximum of the fuzzy memberships from the input
         rasters.PRODUCT-A decreasive function. Use this when the combination
         of
         multiple evidence is less important or smaller than any of the inputs
         alone.SUM-An increasive function. Use this when the combination of
         multiple
         evidence is more important or larger than any of the inputs alone.
         GAMMA-The algebraic product of the fuzzyand fuzzy, both
         raised to the power of gamma. SumProduct
     gamma {Double}:
         The gamma value to be used. This is only available when theis
         set to. Overlay typeGammaDefault value is 0.9.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster which is the result of applying the fuzzy
         operator.This output will always have a value between 0 and 1."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_rasters, overlay_type, gamma):
        out_raster = "#"
        result = arcpy.gp.FuzzyOverlay_sa(in_rasters, out_raster, overlay_type, gamma)
        return _wrapToolRaster("FuzzyOverlay_sa", str(result.getOutput(0)))

    return Wrapper(in_rasters, overlay_type, gamma)


FuzzyOverlay.__esri_toolname__ = "FuzzyOverlay_sa"
FuzzyOverlay.__esri_toolinfo__ = ["::::1", "::::3", "::::4"]


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
    """GenerateMultidimensionalAnomaly_sa(in_multidimensional_raster, {variables;variables...}, {method}, {calculation_interval}, {ignore_nodata}, {reference_mean_raster})

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
        result = arcpy.gp.GenerateMultidimensionalAnomaly_sa(
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


GenerateMultidimensionalAnomaly.__esri_toolname__ = "GenerateMultidimensionalAnomaly_sa"
GenerateMultidimensionalAnomaly.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7"]


def GenerateTrainingSamplesFromSeedPoints(
    in_class_data, in_seed_points, out_training_feature_class, min_sample_area="#", max_sample_radius="#"
):
    """GenerateTrainingSamplesFromSeedPoints_sa(in_class_data, in_seed_points, out_training_feature_class, {min_sample_area}, {max_sample_radius})

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
        result = arcpy.gp.GenerateTrainingSamplesFromSeedPoints_sa(
            in_class_data, in_seed_points, out_training_feature_class, min_sample_area, max_sample_radius
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_class_data, in_seed_points, out_training_feature_class, min_sample_area, max_sample_radius)


GenerateTrainingSamplesFromSeedPoints.__esri_toolname__ = "GenerateTrainingSamplesFromSeedPoints_sa"
GenerateTrainingSamplesFromSeedPoints.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5"]


def GeomorphonLandforms(
    in_surface_raster,
    out_geomorphons_raster="#",
    angle_threshold="#",
    distance_units: Literal["CELLS", "METERS", "CENTIMETERS", "KILOMETERS", "INCHES", "FEET", "YARDS", "MILES", "#"]
    | None = "#",
    search_distance="#",
    skip_distance="#",
    z_unit: Literal[
        "INCH",
        "FOOT",
        "YARD",
        "MILE_US",
        "NAUTICAL_MILE",
        "MILLIMETER",
        "CENTIMETER",
        "METER",
        "KILOMETER",
        "DECIMETER",
        "#",
    ]
    | None = "#",
) -> Raster:
    """GeomorphonLandforms_sa(in_surface_raster, {out_geomorphons_raster}, {angle_threshold}, {distance_units}, {search_distance}, {skip_distance}, {z_unit})

       Calculates the geomorphon pattern of each cell of an input surface
       raster and classifies calculated geomorphons into common landform
       types.

    INPUTS:
     in_surface_raster (Composite Geodataset):
         The input surface raster.
     angle_threshold {Double}:
         The angle threshold (in degrees) below which the target cell will be
         classified as flat.The default value is 1 degree. Specifying a larger
         value than the
         default is recommended for low resolution DEMs.
     distance_units {String}:
         Specifies the distance unit that will be used for
         theandparameters. Search distanceSkip distance        Distance
         will be measured in the specified unit or number of
         cells. The default is. CellsSpecifies the distance unit that
         will be used for the search_distance
         and skip_distance parameters.Distance will be measured in the
         specified unit or number of cells.
         The default is CELLS.CELLS-The distance unit will be cells.METERS-The
         distance unit will be
         meters.CENTIMETERS-The distance unit will be
         centimeters.KILOMETERS-The distance unit will be kilometers.INCHES-The
         distance unit will be inches.FEET-The distance unit will be
         feet.YARDS-The distance unit will be yards.MILES-The distance unit
         will be miles.
     search_distance {Double}:
         The distance away from the target cell that defines the radius of the
         area that will be used to identify the geomorphon pattern.The default
         value is 10. Use a search distance value that matches the
         type and size of the landforms that you want to classify.
     skip_distance {Double}:
         The distance away from the target cell where the analysis area starts.
         Neighboring cells that fall within this distance will be skipped and
         won't contribute to identification of the geomorphon pattern.The
         classification of each individual cell is determined by assessing
         the neighboring cells within the skip distance from the target cell
         center.
     z_unit {String}:
         Specifies the linear unit that will be used for vertical z-values.It
         is defined by a vertical coordinate system if it exists. If no
         vertical coordinate system exists, define the z-unit using the unit
         list to ensure correct geodesic computation. The default is
         meter.INCH-The linear unit will be inches.FOOT-The linear unit will be
         feet.YARD-The linear unit will be yards.MILE_US-The linear unit will
         be miles.NAUTICAL_MILE-The linear unit will be nautical
         miles.MILLIMETER-The linear unit will be millimeters.CENTIMETER-The
         linear unit will be centimeters.METER-The linear unit will be
         meters.KILOMETER-The linear unit will be kilometers.DECIMETER-The
         linear unit will be decimeters.

    OUTPUTS:
     out_landforms_raster (Raster Dataset):
         The output classified landforms raster.The output is of integer
         type.Each value corresponds to a specific landform type: Flat-cell
         value 1,
         Peak-cell value 2, Ridge-cell value 3, Shoulder-cell value 4,
         Spur-cell value 5, Slope-cell value 6, Hollow-cell value 7,
         Footslope-cell value 8, Valley-cell value 9, Pit-cell value 10.
     out_geomorphons_raster {Raster Dataset}:
         Each geomorphon pattern will be assigned a unique identifier, which is
         stored for each cell in the output geomorphons raster.The output is of
         integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_surface_raster,
        out_geomorphons_raster,
        angle_threshold,
        distance_units,
        search_distance,
        skip_distance,
        z_unit,
    ):
        out_landforms_raster = "#"
        result = arcpy.gp.GeomorphonLandforms_sa(
            in_surface_raster,
            out_landforms_raster,
            out_geomorphons_raster,
            angle_threshold,
            distance_units,
            search_distance,
            skip_distance,
            z_unit,
        )
        return _wrapToolRaster("GeomorphonLandforms_sa", str(result.getOutput(0)))

    return Wrapper(
        in_surface_raster,
        out_geomorphons_raster,
        angle_threshold,
        distance_units,
        search_distance,
        skip_distance,
        z_unit,
    )


GeomorphonLandforms.__esri_toolname__ = "GeomorphonLandforms_sa"
GeomorphonLandforms.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7", "::::8"]


def GreaterThan(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """GreaterThan_sa(in_raster_or_constant1, in_raster_or_constant2)

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


GreaterThan.__esri_toolname__ = "GreaterThan_sa"
GreaterThan.__esri_toolinfo__ = ["::::1", "::::2"]


def GreaterThanEqual(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """GreaterThanEqual_sa(in_raster_or_constant1, in_raster_or_constant2)

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


GreaterThanEqual.__esri_toolname__ = "GreaterThanEqual_sa"
GreaterThanEqual.__esri_toolinfo__ = ["::::1", "::::2"]


def GreaterThanFrequency(
    in_value_raster, in_rasters, process_as_multiband: Literal["SINGLE_BAND", "MULTI_BAND", "#"] | None = "#"
) -> Raster:
    """GreaterThanFrequency_sa(in_value_raster, in_rasters;in_rasters..., {process_as_multiband})

       Evaluates on a cell-by-cell basis the number of times a set of rasters
       is greater than another raster.

    INPUTS:
     in_value_raster (Composite Geodataset):
         For each cell location in the input value raster, the number of
         occurrences (frequency) where a raster in the input list has a greater
         value is counted.
     in_rasters (Composite Geodataset):
         The list of rasters that will be compared to the value raster.
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
         The output raster.For each cell in the output raster, the value
         represents the number of
         times that the corresponding cells in the list of rasters is greater
         than the value raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_value_raster, in_rasters, process_as_multiband):
        if Utils.useDefaultArgumentValue(process_as_multiband):
            process_as_multiband = "SINGLE_BAND"
        if process_as_multiband not in ["SINGLE_BAND", "MULTI_BAND"]:
            raise arcpy.ExecuteError(
                "ERROR 000622: Failed to execute (GreaterThanFrequency). Parameters are not valid.\nERROR 000621: Input to parameter process_as_multiband not within domain.\n"
            )
        return _wrapLocalFunctionRaster(
            "GreaterThanFrequency_sa",
            ["GreaterThanFrequency", in_value_raster] + Utils.flattenLists(in_rasters),
            {"flattenBands": process_as_multiband.upper() == "SINGLE_BAND"},
        )

    return Wrapper(in_value_raster, in_rasters, process_as_multiband)


GreaterThanFrequency.__esri_toolname__ = "GreaterThanFrequency_sa"
GreaterThanFrequency.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def HighestPosition(in_rasters_or_constants) -> Raster:
    """HighestPosition_sa(in_rasters_or_constants;in_rasters_or_constants...)

       Determines on a cell-by-cell basis the position of the raster with the
       maximum value in a set of rasters.

    INPUTS:
     in_rasters_or_constants (Composite Geodataset):
         The list of input rasters for which the position of the input with the
         highest value will be determined.A number can be used as an input;
         however, the cell size and extent
         must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.For each cell in the output raster, the value
         represents the position
         of the raster with the highest value."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_rasters_or_constants):
        return _wrapLocalFunctionRaster(
            "HighestPosition_sa",
            ["HighestPosition"] + Utils.flattenLists(in_rasters_or_constants),
            {"flattenBands": True},
        )

    return Wrapper(in_rasters_or_constants)


HighestPosition.__esri_toolname__ = "HighestPosition_sa"
HighestPosition.__esri_toolinfo__ = ["::::1"]


def Hillshade(
    in_raster,
    azimuth="#",
    altitude="#",
    model_shadows: Literal["NO_SHADOWS", "SHADOWS", "#"] | None = "#",
    z_factor="#",
) -> Raster:
    """HillShade_sa(in_raster, {azimuth}, {altitude}, {model_shadows}, {z_factor})

       Creates a shaded relief from a surface raster by considering the
       illumination source angle and shadows.

    INPUTS:
     in_raster (Composite Geodataset):
         The input surface raster.
     azimuth {Double}:
         Azimuth angle of the light source.The azimuth is expressed in positive
         degrees from 0 to 360, measured
         clockwise from north.The default is 315 degrees.
     altitude {Double}:
         Altitude angle of the light source above the horizon.The altitude is
         expressed in positive degrees, with 0 degrees at the
         horizon and 90 degrees directly overhead.The default is 45 degrees.
     model_shadows {Boolean}:
         Type of shaded relief to be generated. NO_SHADOWS-The output
         raster only considers local
         illumination angles; the effects of shadows are not considered.
         The output values can range from 0 to 255, with 0 representing the
         darkest areas, and 255 the brightest. This is the default.
         SHADOWS-The output shaded raster considers both local
         illumination angles and shadows. The output values range from
         0 to 255, with 0 representing the shadow
         areas, and 255 the brightest.
     z_factor {Double}:
         The number of ground x,y units in one surface z-unit.The z-factor
         adjusts the units of measure for the z-units when they
         are different from the x,y units of the input surface. The z-values of
         the input surface are multiplied by the z-factor when calculating the
         final output surface.If the x,y units and z-units are in the same
         units of measure, the
         z-factor is 1. This is the default.If the x,y units and z-units are in
         different units of measure, the
         z-factor must be set to the appropriate factor or the results will be
         incorrect. For example, if the z-units are feet and the x,y units are
         meters, use a z-factor of 0.3048 to convert the z-units from feet to
         meters (1 foot = 0.3048 meter).

    OUTPUTS:
     out_raster (Raster Dataset):
         The output hillshade raster.The hillshade raster has an integer value
         range of 0 to 255."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, azimuth, altitude, model_shadows, z_factor):
        out_raster = "#"
        result = arcpy.gp.Hillshade_sa(in_raster, out_raster, azimuth, altitude, model_shadows, z_factor)
        return _wrapToolRaster("Hillshade_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, azimuth, altitude, model_shadows, z_factor)


Hillshade.__esri_toolname__ = "Hillshade_sa"
Hillshade.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6"]


def Idw(
    in_point_features, z_field, cell_size="#", power="#", search_radius="#", in_barrier_polyline_features="#"
) -> Raster:
    """Idw_sa(in_point_features, z_field, {cell_size}, {power}, {search_radius}, {in_barrier_polyline_features})

       Interpolates a raster surface from points using an inverse distance
       weighted (IDW) technique.

    INPUTS:
     in_point_features (Composite Geodataset):
         The input point features containing the z-values to be interpolated
         into a surface raster.
     z_field (Field):
         The field that holds a height or magnitude value for each point.This
         can be a numeric field or the Shape field if the input point
         features contain z-values.
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     power {Double}:
         The exponent of distance.Controls the significance of surrounding
         points on the interpolated
         value. A higher power results in less influence from distant points.
         It can be any real number greater than 0, but the most reasonable
         results will be obtained using values from 0.5 to 3. The default is 2.
     search_radius {Radius}:
         The Radius class defines which of the input points will be used to
         interpolate the value for each cell in the output raster.There are two
         types of radius classes: RadiusVariable and RadiusFixed.
         A Variable search radius is used to find a specified number of input
         sample points for the interpolation. The Fixed type uses a specified
         fixed distance within which all input points will be used for the
         interpolation. The Variable type is the default.
         RadiusVariable ({numberofPoints}, {maxDistance})
         {numberofPoints}-An integer value specifying the number of nearest
         input sample points to be used to perform interpolation. The default
         is 12 points.{maxDistance}-Specifies the distance, in map units, by
         which to limit
         the search for the nearest input sample points. The default value is
         the length of the extent's diagonal. RadiusFixed ({distance},
         {minNumberofPoints})
         {distance}-Specifies the distance as a radius within which
         input sample points will be used to perform the interpolation.
         The value of the radius is expressed in map units. The default radius
         is five times the cell size of the output raster.
         {minNumberofPoints}-An integer defining the minimum number
         of points to be used for interpolation. The default value is 0.
         If the required number of points is not found within the specified
         distance, the search distance will be increased until the specified
         minimum number of points is found.When the search radius needs to be
         increased it is done so until the
         {minNumberofPoints} fall within that radius, or the extent of the
         radius crosses the lower (southern) and/or upper (northern) extent of
         the output raster. NoData is assigned to all locations that do not
         satisfy the above condition.
     in_barrier_polyline_features {Composite Geodataset}:
         Polyline features to be used as a break or limit in searching for the
         input sample points.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output interpolated surface raster.It is always a floating-point
         raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_point_features, z_field, cell_size, power, search_radius, in_barrier_polyline_features):
        search_radius = Utils.compoundParameterToString(search_radius, ParameterClasses._Radius)
        out_raster = "#"
        result = arcpy.gp.Idw_sa(
            in_point_features, z_field, out_raster, cell_size, power, search_radius, in_barrier_polyline_features
        )
        return _wrapToolRaster("Idw_sa", str(result.getOutput(0)))

    return Wrapper(in_point_features, z_field, cell_size, power, search_radius, in_barrier_polyline_features)


Idw.__esri_toolname__ = "Idw_sa"
Idw.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "Python::RadiusFixed|RadiusVariable::", "::::7"]


def InList(
    in_raster_or_constant,
    in_raster_or_constants,
    process_as_multiband: Literal["SINGLE_BAND", "MULTI_BAND", "#"] | None = "#",
) -> Raster:
    """InList_sa(in_raster_or_constant, in_raster_or_constants;in_raster_or_constants..., {process_as_multiband})

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
            "InList_sa",
            ["InList", in_raster_or_constant] + Utils.flattenLists(in_raster_or_constants),
            {"flattenBands": process_as_multiband.upper() == "SINGLE_BAND"},
        )

    return Wrapper(in_raster_or_constant, in_raster_or_constants, process_as_multiband)


InList.__esri_toolname__ = "InList_sa"
InList.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def InspectTrainingSamples(
    in_raster, in_training_features, in_classifier_definition, out_training_feature_class, in_additional_raster="#"
) -> Raster:
    """InspectTrainingSamples_sa(in_raster, in_training_features, in_classifier_definition, out_training_feature_class, {in_additional_raster})

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
        result = arcpy.gp.InspectTrainingSamples_sa(
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


InspectTrainingSamples.__esri_toolname__ = "InspectTrainingSamples_sa"
InspectTrainingSamples.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::6"]


def Int(in_raster_or_constant) -> Raster:
    """Int_sa(in_raster_or_constant)

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


Int.__esri_toolname__ = "Int_sa"
Int.__esri_toolinfo__ = ["::::1"]


def InterpolateShape(
    in_surface,
    in_feature_class,
    out_feature_class,
    sample_distance="#",
    z_factor="#",
    method: Literal[
        "LINEAR",
        "NATURAL_NEIGHBORS",
        "CONFLATE_ZMIN",
        "CONFLATE_ZMAX",
        "CONFLATE_NEAREST",
        "CONFLATE_CLOSEST_TO_MEAN",
        "BILINEAR",
        "NEAREST",
        "#",
    ]
    | None = "#",
    vertices_only: Literal["VERTICES_ONLY", "DENSIFY", "#"] | None = "#",
    pyramid_level_resolution="#",
    preserve_features: Literal["PRESERVE", "EXCLUDE", "#"] | None = "#",
):
    """InterpolateShape_sa(in_surface, in_feature_class, out_feature_class, {sample_distance}, {z_factor}, {method}, {vertices_only}, {pyramid_level_resolution}, {preserve_features})

       Creates 3D features by interpolating z-values from a surface.

    INPUTS:
     in_surface (TIN Layer / Raster Layer / Mosaic Layer / Terrain Layer / LAS Dataset Layer / Image Service):
         The surface that will be used for interpolating z-values.
     in_feature_class (Feature Layer):
         The input features that will be processed.
     sample_distance {Double}:
         The spacing at which z-values will be interpolated. By default, this
         is a raster dataset's cell size or a triangulated surface's natural
         densification.
     z_factor {Double}:
         The factor by which z-values will be multiplied. This is typically
         used to convert z linear units to match x,y linear units. The default
         is 1, which leaves elevation values unchanged. This parameter is not
         available if the spatial reference of the input surface has a z-datum
         with a specified linear unit.
     method {String}:
         Specifies the interpolation method that will be used to determine
         elevation values for the output features. The available options depend
         on the surface type.BILINEAR-The value of the query point will be
         determined using
         bilinear interpolation. This is the default when the input is a raster
         surface.NEAREST-The value of the query point will be determined using
         nearest
         neighbor interpolation. With this method, surface values will only be
         interpolated for the input feature's vertices. This option is only
         available for a raster surface.LINEAR-Elevation values will be
         obtained from the plane defined by the
         triangle that contains the x,y-location of a query point. This is the
         default interpolation method for TIN, terrain, and LAS
         datasets.NATURAL_NEIGHBORS-Elevation values will be obtained by
         applying area-
         based weights to the natural neighbors of a query point.CONFLATE_ZMIN-
         Elevation values will be obtained from the smallest
         z-value found among the natural neighbors of a query
         point.CONFLATE_ZMAX-Elevation values will be obtained from the largest
         z-value found among the natural neighbors of a query
         point.CONFLATE_NEAREST-Elevation values will be obtained from the
         nearest
         value among the natural neighbors of a query
         point.CONFLATE_CLOSEST_TO_MEAN-Elevation values will be obtained from
         the
         z-value that is closest to the average of all the natural neighbors of
         a query point.
     vertices_only {Boolean}:
         Specifies whether the interpolation will only occur along the vertices
         of an input feature, ignoring the sample distance
         option.DENSIFY-Interpolation will occur using the sampling distance.
         This is
         the default.VERTICES_ONLY-Interpolation will only occur along the
         vertices.
     pyramid_level_resolution {Double}:
         The z-tolerance or window-size resolution of the terrain pyramid level
         that will be used. The default is 0, or full resolution.
     preserve_features {Boolean}:
         Specifies whether features with one or more vertices that fall outside
         the raster's data area will be retained in the output. This parameter
         is only available when the input surface is a raster and the nearest
         neighbor interpolation method is used.PRESERVE-Each vertex that falls
         outside the raster surface will have
         its z-value derived from the trend of z-values calculated for the
         vertices within the raster surface and will be retained in the
         output.EXCLUDE-Features with at least one vertex that falls outside
         the
         raster surface will be skipped in the output. This is the default.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_surface,
        in_feature_class,
        out_feature_class,
        sample_distance,
        z_factor,
        method,
        vertices_only,
        pyramid_level_resolution,
        preserve_features,
    ):
        result = arcpy.gp.InterpolateShape_sa(
            in_surface,
            in_feature_class,
            out_feature_class,
            sample_distance,
            z_factor,
            method,
            vertices_only,
            pyramid_level_resolution,
            preserve_features,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_surface,
        in_feature_class,
        out_feature_class,
        sample_distance,
        z_factor,
        method,
        vertices_only,
        pyramid_level_resolution,
        preserve_features,
    )


InterpolateShape.__esri_toolname__ = "InterpolateShape_sa"
InterpolateShape.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6", "::::7", "::::8", "::::9"]


def IsNull(in_raster) -> Raster:
    """IsNull_sa(in_raster)

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


IsNull.__esri_toolname__ = "IsNull_sa"
IsNull.__esri_toolinfo__ = ["::::1"]


def IsoCluster(
    in_raster_bands, out_signature_file, number_classes, number_iterations="#", min_class_size="#", sample_interval="#"
):
    """IsoCluster_sa(in_raster_bands;in_raster_bands..., out_signature_file, number_classes, {number_iterations}, {min_class_size}, {sample_interval})

       Uses an isodata clustering algorithm to determine the characteristics
       of the natural groupings of cells in multidimensional attribute space
       and stores the results in an output ASCII signature file.

    INPUTS:
     in_raster_bands (Composite Geodataset):
         The input raster bands.They can be integer or floating point type.
     number_classes (Long):
         Number of classes into which to group the cells.
     number_iterations {Long}:
         Number of iterations of the clustering process to run.The default is
         20.
     min_class_size {Long}:
         Minimum number of cells in a valid class.The default is 20.
     sample_interval {Long}:
         The interval to be used for sampling.The default is 10.

    OUTPUTS:
     out_signature_file (File):
         The output signature file.A .gsg extension must be specified."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_raster_bands, out_signature_file, number_classes, number_iterations, min_class_size, sample_interval
    ):
        result = arcpy.gp.IsoCluster_sa(
            in_raster_bands, out_signature_file, number_classes, number_iterations, min_class_size, sample_interval
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_raster_bands, out_signature_file, number_classes, number_iterations, min_class_size, sample_interval
    )


IsoCluster.__esri_toolname__ = "IsoCluster_sa"
IsoCluster.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6"]


def IsoClusterUnsupervisedClassification(
    in_raster_bands, Number_of_classes, Minimum_class_size="#", Sample_interval="#", out_signature_file="#"
) -> Raster:
    """IsoClusterUnsupervisedClassification_sa(in_raster_bands, Number_of_classes, {Minimum_class_size}, {Sample_interval}, {out_signature_file})

       Performs unsupervised classification on a series of input raster bands
       using the Iso Cluster and Maximum Likelihood Classification tools.

    INPUTS:
     in_raster_bands (Raster Layer / Mosaic Layer):
         The input raster bands.They can be integer or floating point type.
     Number_of_classes (Long):
         Number of classes into which to group the cells.
     Minimum_class_size {Long}:
         Minimum number of cells in a valid class.The default is 20.
     Sample_interval {Long}:
         The interval to be used for sampling.The default is 10.

    OUTPUTS:
     Output_classified_raster (Raster Dataset):
         The output classified raster.
     out_signature_file {File}:
         The output signature file.A .gsg extension must be specified."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_bands, Number_of_classes, Minimum_class_size, Sample_interval, out_signature_file):
        Output_classified_raster = "#"
        result = arcpy.gp.IsoClusterUnsupervisedClassification_sa(
            in_raster_bands,
            Number_of_classes,
            Output_classified_raster,
            Minimum_class_size,
            Sample_interval,
            out_signature_file,
        )
        return _wrapToolRaster("IsoClusterUnsupervisedClassification_sa", str(result.getOutput(0)))

    return Wrapper(in_raster_bands, Number_of_classes, Minimum_class_size, Sample_interval, out_signature_file)


IsoClusterUnsupervisedClassification.__esri_toolname__ = "IsoClusterUnsupervisedClassification_sa"
IsoClusterUnsupervisedClassification.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "::::6"]


def KernelDensity(
    in_features,
    population_field,
    cell_size="#",
    search_radius="#",
    area_unit_scale_factor: Literal[
        "SQUARE_MAP_UNITS",
        "SQUARE_MILES",
        "SQUARE_KILOMETERS",
        "ACRES",
        "HECTARES",
        "SQUARE_YARDS",
        "SQUARE_FEET",
        "SQUARE_INCHES",
        "SQUARE_METERS",
        "SQUARE_CENTIMETERS",
        "SQUARE_MILLIMETERS",
        "#",
    ]
    | None = "#",
    out_cell_values: Literal["DENSITIES", "EXPECTED_COUNTS", "#"] | None = "#",
    method: Literal["PLANAR", "GEODESIC", "#"] | None = "#",
    in_barriers="#",
) -> Raster:
    """KernelDensity_sa(in_features, population_field, {cell_size}, {search_radius}, {area_unit_scale_factor}, {out_cell_values}, {method}, {in_barriers})

       Calculates a magnitude-per-unit area from point or polyline features
       using a kernel function to fit a smoothly tapered surface to each
       point or polyline. A barrier can be used to alter the influence of a
       feature while calculating kernel density.

    INPUTS:
     in_features (Composite Geodataset):
         The input features (point or line) for which to calculate the density.
     population_field (Field):
         The field denoting population values for each feature. The population
         field is the count or quantity to be spread across the landscape to
         create a continuous surface.Values in the population field can be
         integer or floating point.The options and default behaviors for the
         field are listed below. Useif no item or special value will
         be used and each feature
         will be counted once. None          You can use thefield if
         input features contain z-values.
         Shape          Otherwise, the default field is. The following
         conditions
         may also apply:          POPULATION           If there is nofield, but
         there is afield, it will be used
         by default. The 'abcd' can be any valid characters, for example,,, or.
         POPULATIONPOPULATIONabcdPOPULATION6POPULATION1974POPULATIONROADTYPE
         If there is nofield orfield, but there is afield, thefield
         will be used by default. POPULATIONPOPULATIONabcdPOPPOP
         If there is nofield,field, orfield, but there is afield,
         thefield will be used by default.
         POPULATIONPOPULATIONabcdPOPPOPabcdPOPabcd           If there is
         nofield,field,field, orfield,will be used by
         default. POPULATIONPOPULATIONabcdPOPPOPabcdNONE
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     search_radius {Double}:
         The search radius within which density will be calculated. Units are
         based on the linear unit of the projection of the output spatial
         reference.For example, if the units are meters-to include all features
         within a
         one-mile neighborhood-set the search radius equal to 1609.344 (1 mile
         = 1609.344 meters).The default search radius is computed specifically
         for the input
         dataset using a spatial variant of Silverman's Rule of Thumb
         (Silverman, 1986) that is robust enough for spatial outliers (points
         that are far away from the rest of the points). See the usage tips for
         a description of the algorithm.
     area_unit_scale_factor {String}:
         Specifies the area units that will be used for the output density
         values.A default unit is determined based on the linear unit of the
         output
         spatial reference. You can change this to the appropriate unit to
         convert the density output. Values for line density convert the units
         of both length and area. If no output spatial reference is
         specified, the output
         spatial reference will be the same as the input feature class. The
         default output density units are determined by the linear units of the
         output spatial reference . If the output linear units are meters, the
         output area density units will be set to, outputting square kilometers
         for point features or kilometers per square kilometers for polyline
         features. If the output linear units are feet, the output area density
         units will be set to. Square kilometersSquare miles        If
         the output units are anything other than feet or meters,
         the output area density units will be set to. That is, the output
         density units will be the square of the linear units of the output
         spatial reference. For example, if the output linear units are
         centimeters, the output area density units will be, which will result
         in square centimeters. If the output linear units are kilometers, the
         output area density units will be, which will result in square
         kilometers. Square map unitsSquare map unitsSquare map unitsThe
         available options and their corresponding output density units are
         the following:SQUARE_MAP_UNITS-The square of the linear units of the
         output spatial
         reference will be used.SQUARE_MILES-U.S. miles will be
         used.SQUARE_KILOMETERS-Kilometers will be used.ACRES-U.S. acres will
         be used.HECTARES-Hectares will be used.SQUARE_YARDS-U.S. yards will be
         used.SQUARE_FEET-U.S. feet will be used.SQUARE_INCHES-U.S. inches will
         be used.SQUARE_METERS-Meters will be
         used.SQUARE_CENTIMETERS-Centimeters will be
         used.SQUARE_MILLIMETERS-Millimeters will be used.
     out_cell_values {String}:
         Specifies what the values in the output raster represent.DENSITIES-The
         output values represent the calculated density value per
         unit area for each cell. This is the default.EXPECTED_COUNTS-The
         output values represent the calculated density
         value per cell area.Since the cell value is linked to the specified
         cell size, the
         resulting raster cannot be resampled to a different cell size.
     method {String}:
         Specifies whether the flat earth (planar) or the shortest path on a
         spheroid (geodesic) method will be used.PLANAR-The planar distance
         between features will be used. This is the
         default.GEODESIC-The geodesic distance between features will be
         used.The geodesic method only supports points as input features.
     in_barriers {Composite Geodataset}:
         The dataset that defines the barriers.The barriers can be a feature
         layer of polyline or polygon features.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output kernel density raster.It is always a floating point raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_features,
        population_field,
        cell_size,
        search_radius,
        area_unit_scale_factor,
        out_cell_values,
        method,
        in_barriers,
    ):
        out_raster = "#"
        result = arcpy.gp.KernelDensity_sa(
            in_features,
            population_field,
            out_raster,
            cell_size,
            search_radius,
            area_unit_scale_factor,
            out_cell_values,
            method,
            in_barriers,
        )
        return _wrapToolRaster("KernelDensity_sa", str(result.getOutput(0)))

    return Wrapper(
        in_features,
        population_field,
        cell_size,
        search_radius,
        area_unit_scale_factor,
        out_cell_values,
        method,
        in_barriers,
    )


KernelDensity.__esri_toolname__ = "KernelDensity_sa"
KernelDensity.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "::::6", "::::7", "::::8", "::::9"]


def Kriging(
    in_point_features, z_field, kriging_model, cell_size="#", search_radius="#", out_variance_prediction_raster="#"
) -> Raster:
    """Kriging_sa(in_point_features, z_field, kriging_model, {cell_size}, {search_radius}, {out_variance_prediction_raster})

       Interpolates a raster surface from points using kriging.

    INPUTS:
     in_point_features (Composite Geodataset):
         The input point features containing the z-values to be interpolated
         into a surface raster.
     z_field (Field):
         The field that holds a height or magnitude value for each point.This
         can be a numeric field or the Shape field if the input point
         features contain z-values.
     kriging_model (KrigingModel):
         The KrigingModel class defines which kriging model is to be used.There
         are two types of kriging classes. The KrigingModelOrdinary
         method has five types of semivariograms available. The
         KrigingModelUniversal method has two types of semivariograms
         available. KrigingModelOrdinary ({semivariogramType},
         {lagSize},
         {majorRange}, {partialSill}, {nugget})
         semivariogramType-The semivariogram model to be used. The
         available models include the following:           SPHERICAL-Spherical
         semivariogram model. This is the
         default.CIRCULAR-Circular semivariogram model.EXPONENTIAL-Exponential
         semivariogram model.GAUSSIAN-Gaussian (or normal distribution)
         semivariogram model.LINEAR-Linear semivariogram model with a sill.
         KrigingModelUniversal ({semivariogramType}, {lagSize},
         {majorRange}, {partialSill}, {nugget})
         semivariogramType-The semivariogram model to be used. The
         available models include the following:
         LINEARDRIFT-Universal Kriging with linear
         drift.QUADRATICDRIFT-Universal Kriging with quadratic drift.
         After the {semivariogramType}, the other parameters are
         common between Ordinary and Universal kriging. lagSize-The
         default is the output raster cell
         size.majorRange-Represents a distance beyond which there is little or
         no
         correlation.partialSill-The difference between the nugget and the
         sill.nugget-Represents the error and variation at spatial scales too
         fine
         to detect. The nugget effect is seen as a discontinuity at the origin.
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     search_radius {Radius}:
         The Radius class defines which of the input points will be used to
         interpolate the value for each cell in the output raster.There are two
         types of radius classes: RadiusVariable and RadiusFixed.
         A Variable search radius is used to find a specified number of input
         sample points for the interpolation. The Fixed type uses a specified
         fixed distance within which all input points will be used for the
         interpolation. The Variable type is the default.
         RadiusVariable ({numberofPoints}, {maxDistance})
         {numberofPoints}-An integer value specifying the number of nearest
         input sample points to be used to perform interpolation. The default
         is 12 points.{maxDistance}-Specifies the distance, in map units, by
         which to limit
         the search for the nearest input sample points. The default value is
         the length of the extent's diagonal. RadiusFixed ({distance},
         {minNumberofPoints})
         {distance}-Specifies the distance as a radius within which
         input sample points will be used to perform the interpolation.
         The value of the radius is expressed in map units. The default radius
         is five times the cell size of the output raster.
         {minNumberofPoints}-An integer defining the minimum number
         of points to be used for interpolation. The default value is 0.
         If the required number of points is not found within the specified
         distance, the search distance will be increased until the specified
         minimum number of points is found.When the search radius needs to be
         increased it is done so until the
         {minNumberofPoints} fall within that radius, or the extent of the
         radius crosses the lower (southern) and/or upper (northern) extent of
         the output raster. NoData is assigned to all locations that do not
         satisfy the above condition.

    OUTPUTS:
     out_surface_raster (Raster Dataset):
         The output interpolated surface raster.It is always a floating-point
         raster.
     out_variance_prediction_raster {Raster Dataset}:
         Optional output raster where each cell contains the predicted variance
         values for that location."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_point_features, z_field, kriging_model, cell_size, search_radius, out_variance_prediction_raster):
        kriging_model = Utils.compoundParameterToString(kriging_model, ParameterClasses._KrigingModel)
        search_radius = Utils.compoundParameterToString(search_radius, ParameterClasses._Radius)
        out_surface_raster = "#"
        result = arcpy.gp.Kriging_sa(
            in_point_features,
            z_field,
            out_surface_raster,
            kriging_model,
            cell_size,
            search_radius,
            out_variance_prediction_raster,
        )
        return _wrapToolRaster("Kriging_sa", str(result.getOutput(0)))

    return Wrapper(in_point_features, z_field, kriging_model, cell_size, search_radius, out_variance_prediction_raster)


Kriging.__esri_toolname__ = "Kriging_sa"
Kriging.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "Python::KrigingModelOrdinary|KrigingModelUniversal::",
    "::::5",
    "Python::RadiusFixed|RadiusVariable::",
    "::::7",
]


def LeastCostCorridor(
    in_accumulative_cost_distance_raster1,
    in_back_direction_raster1,
    in_accumulative_cost_distance_raster2,
    in_back_direction_raster2,
    threshold_method: Literal["NO_THRESHOLD", "PERCENT_OF_LEAST_COST", "ACCUMULATIVE_COST", "#"] | None = "#",
    threshold="#",
) -> Raster:
    """LeastCostCorridor_sa(in_accumulative_cost_distance_raster1, in_back_direction_raster1, in_accumulative_cost_distance_raster2, in_back_direction_raster2, {threshold_method}, {threshold})

       Calculates the sum of two accumulative cost distance rasters with the
       option to apply a threshold based on percentage or accumulative cost.

    INPUTS:
     in_accumulative_cost_distance_raster1 (Raster Layer):
         The input raster representing the accumulative cost distance from the
         first source.Use the distance accumulation output from the Distance
         Accumulation or
         Distance Allocation tool.
     in_back_direction_raster1 (Raster Layer):
         The input back direction raster from the first source. The units are
         degrees identifying the next cell along the least-cost path back to
         the first source.Use the back direction output from the Distance
         Accumulation or
         Distance Allocation tool. The range of values is from 0 degrees to 360
         degrees, with 0 reserved for the source cells. Due east is 90, and the
         values increase clockwise (180 is south, 270 is west, and 360 is
         north).
     in_accumulative_cost_distance_raster2 (Raster Layer):
         The input raster representing the accumulative cost distance from the
         second source.Use the distance accumulation output from the Distance
         Accumulation or
         Distance Allocation tool.
     in_back_direction_raster2 (Raster Layer):
         The input back direction raster from the second source. The units are
         degrees identifying the next cell along the least-cost path back to
         the second source.Use the back direction output from the Distance
         Accumulation or
         Distance Allocation tool. The range of values is from 0 degrees to 360
         degrees, with 0 reserved for the source cells. Due east is 90, and the
         values increase clockwise (180 is south, 270 is west, and 360 is
         north).
     threshold_method {String}:
         Specifies how the threshold will be defined.NO_THRESHOLD-No threshold
         will be applied, and the resulting corridor
         will cover the full extent of the input rasters. This is the
         default.PERCENT_OF_LEAST_COST-The threshold will be defined as a
         percent of
         the minimum value of the summed accumulative cost distance
         rasters.ACCUMULATIVE_COST-The threshold will be defined in
         accumulative cost
         distance units.
     threshold {Double}:
         A percent or accumulative cost threshold that determines whether a
         given cell will be included in the output corridor raster.When the
         threshold_method parameter is set to PERCENT_OF_LEAST_COST,
         the specified value indicates the percent increase to apply from the
         minimum value of the summed accumulative cost distance rasters. When
         the threshold_method parameter is set to ACCUMULATIVE_COST, the value
         indicates cells that have a summed accumulative cost equal to or below
         the value will be included in the corridor.This parameter is only
         enabled if the threshold_method parameter is
         set to PERCENT_OF_LEAST_COST or ACCUMULATIVE_COST.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output corridor raster containing cells with values below the
         threshold in accumulative cost distance units.The output raster is
         floating-point type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_accumulative_cost_distance_raster1,
        in_back_direction_raster1,
        in_accumulative_cost_distance_raster2,
        in_back_direction_raster2,
        threshold_method,
        threshold,
    ):
        out_raster = "#"
        result = arcpy.gp.LeastCostCorridor_sa(
            in_accumulative_cost_distance_raster1,
            in_back_direction_raster1,
            in_accumulative_cost_distance_raster2,
            in_back_direction_raster2,
            out_raster,
            threshold_method,
            threshold,
        )
        return _wrapToolRaster("LeastCostCorridor_sa", str(result.getOutput(0)))

    return Wrapper(
        in_accumulative_cost_distance_raster1,
        in_back_direction_raster1,
        in_accumulative_cost_distance_raster2,
        in_back_direction_raster2,
        threshold_method,
        threshold,
    )


LeastCostCorridor.__esri_toolname__ = "LeastCostCorridor_sa"
LeastCostCorridor.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::6", "::::7"]


def LessThan(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """LessThan_sa(in_raster_or_constant1, in_raster_or_constant2)

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


LessThan.__esri_toolname__ = "LessThan_sa"
LessThan.__esri_toolinfo__ = ["::::1", "::::2"]


def LessThanEqual(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """LessThanEqual_sa(in_raster_or_constant1, in_raster_or_constant2)

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


LessThanEqual.__esri_toolname__ = "LessThanEqual_sa"
LessThanEqual.__esri_toolinfo__ = ["::::1", "::::2"]


def LessThanFrequency(
    in_value_raster, in_rasters, process_as_multiband: Literal["SINGLE_BAND", "MULTI_BAND", "#"] | None = "#"
) -> Raster:
    """LessThanFrequency_sa(in_value_raster, in_rasters;in_rasters..., {process_as_multiband})

       Evaluates on a cell-by-cell basis the number of times a set of rasters
       is less than another raster.

    INPUTS:
     in_value_raster (Composite Geodataset):
         For each cell location in the input value raster, the number of
         occurrences (frequency) where a raster in the input list has a lesser
         value is counted.
     in_rasters (Composite Geodataset):
         The list of rasters that will be compared to the value raster.
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
         The output raster.For each cell in the output raster, the value
         represents the number of
         times that the corresponding cells in the list of rasters is less than
         the value raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_value_raster, in_rasters, process_as_multiband):
        if Utils.useDefaultArgumentValue(process_as_multiband):
            process_as_multiband = "SINGLE_BAND"
        if process_as_multiband not in ["SINGLE_BAND", "MULTI_BAND"]:
            raise arcpy.ExecuteError(
                "ERROR 000622: Failed to execute (LessThanFrequency). Parameters are not valid.\nERROR 000621: Input to parameter process_as_multiband not within domain.\n"
            )
        return _wrapLocalFunctionRaster(
            "LessThanFrequency_sa",
            ["LessThanFrequency", in_value_raster] + Utils.flattenLists(in_rasters),
            {"flattenBands": process_as_multiband.upper() == "SINGLE_BAND"},
        )

    return Wrapper(in_value_raster, in_rasters, process_as_multiband)


LessThanFrequency.__esri_toolname__ = "LessThanFrequency_sa"
LessThanFrequency.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def LinearSpectralUnmixing(
    in_raster,
    in_spectral_profile_file,
    value_option: list[Literal["SUM_TO_ONE", "NON_NEGATIVE"]]
    | Literal["SUM_TO_ONE", "NON_NEGATIVE"]
    | str
    | None = "#",
) -> Raster:
    """LinearSpectralUnmixing_sa(in_raster, out_raster, in_spectral_profile_file, {value_option;value_option...})

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
        result = arcpy.gp.LinearSpectralUnmixing_sa(in_raster, out_raster, in_spectral_profile_file, value_option)
        return _wrapToolRaster("LinearSpectralUnmixing_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, in_spectral_profile_file, value_option)


LinearSpectralUnmixing.__esri_toolname__ = "LinearSpectralUnmixing_sa"
LinearSpectralUnmixing.__esri_toolinfo__ = ["::::1", "::::3", "::::4"]


def LineDensity(
    in_polyline_features,
    population_field,
    cell_size="#",
    search_radius="#",
    area_unit_scale_factor: Literal[
        "SQUARE_MAP_UNITS",
        "SQUARE_MILES",
        "SQUARE_KILOMETERS",
        "ACRES",
        "HECTARES",
        "SQUARE_YARDS",
        "SQUARE_FEET",
        "SQUARE_INCHES",
        "SQUARE_METERS",
        "SQUARE_CENTIMETERS",
        "SQUARE_MILLIMETERS",
        "#",
    ]
    | None = "#",
) -> Raster:
    """LineDensity_sa(in_polyline_features, population_field, {cell_size}, {search_radius}, {area_unit_scale_factor})

       Calculates a magnitude-per-unit area from polyline features that fall
       within a radius around each cell.

    INPUTS:
     in_polyline_features (Composite Geodataset):
         The input line features for which to calculate the density.
     population_field (Field):
         Numeric field denoting population values (the number of times the line
         should be counted) for each polyline.Values in the population field
         can be integer or floating point.The options and default behaviors for
         the field are listed below. Useif no item or special value
         will be used and each feature
         will be counted once. None          You can use thefield if
         input features contain z-values.
         Shape          Otherwise, the default field is. The following
         conditions
         may also apply:          POPULATION           If there is nofield, but
         there is afield, it will be used
         by default. The 'abcd' can be any valid characters, for example,,, or.
         POPULATIONPOPULATIONabcdPOPULATION6POPULATION1974POPULATIONROADTYPE
         If there is nofield orfield, but there is afield, thefield
         will be used by default. POPULATIONPOPULATIONabcdPOPPOP
         If there is nofield,field, orfield, but there is afield,
         thefield will be used by default.
         POPULATIONPOPULATIONabcdPOPPOPabcdPOPabcd           If there is
         nofield,field,field, orfield,will be used by
         default. POPULATIONPOPULATIONabcdPOPPOPabcdNONE
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     search_radius {Double}:
         The search radius within which density will be calculated. Units are
         based on the linear unit of the projection of the output spatial
         reference.For example, if the units are meters-to include all features
         within a
         one-mile neighborhood-set the search radius equal to 1609.344 (1 mile
         = 1609.344 meters).The default is the shortest of the width or height
         of the output
         extent in the output spatial reference, divided by 30.
     area_unit_scale_factor {String}:
         Specifies the area units that will be used for the output density
         values.A default unit is determined based on the linear unit of the
         output
         spatial reference. You can change this to the appropriate unit to
         convert the density output. Values for line density convert the units
         of both length and area. If no output spatial reference is
         specified, the output
         spatial reference will be the same as the input feature class. The
         default output density units are determined by the linear units of the
         output spatial reference . If the output linear units are meters, the
         output area density units will be set to, outputting square kilometers
         for point features or kilometers per square kilometers for polyline
         features. If the output linear units are feet, the output area density
         units will be set to. Square kilometersSquare miles        If
         the output units are anything other than feet or meters,
         the output area density units will be set to. That is, the output
         density units will be the square of the linear units of the output
         spatial reference. For example, if the output linear units are
         centimeters, the output area density units will be, which will result
         in square centimeters. If the output linear units are kilometers, the
         output area density units will be, which will result in square
         kilometers. Square map unitsSquare map unitsSquare map unitsThe
         available options and their corresponding output density units are
         the following:SQUARE_MAP_UNITS-The square of the linear units of the
         output spatial
         reference will be used.SQUARE_MILES-U.S. miles will be
         used.SQUARE_KILOMETERS-Kilometers will be used.ACRES-U.S. acres will
         be used.HECTARES-Hectares will be used.SQUARE_YARDS-U.S. yards will be
         used.SQUARE_FEET-U.S. feet will be used.SQUARE_INCHES-U.S. inches will
         be used.SQUARE_METERS-Meters will be
         used.SQUARE_CENTIMETERS-Centimeters will be
         used.SQUARE_MILLIMETERS-Millimeters will be used.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output line density raster.It is always a floating point raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_polyline_features, population_field, cell_size, search_radius, area_unit_scale_factor):
        out_raster = "#"
        result = arcpy.gp.LineDensity_sa(
            in_polyline_features, population_field, out_raster, cell_size, search_radius, area_unit_scale_factor
        )
        return _wrapToolRaster("LineDensity_sa", str(result.getOutput(0)))

    return Wrapper(in_polyline_features, population_field, cell_size, search_radius, area_unit_scale_factor)


LineDensity.__esri_toolname__ = "LineDensity_sa"
LineDensity.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "::::6"]


def LineStatistics(
    in_polyline_features,
    field,
    cell_size="#",
    search_radius="#",
    statistics_type: Literal[
        "MEAN", "MAJORITY", "MAXIMUM", "MEDIAN", "MINIMUM", "MINORITY", "RANGE", "VARIETY", "LENGTH", "#"
    ]
    | None = "#",
) -> Raster:
    """LineStatistics_sa(in_polyline_features, field, {cell_size}, {search_radius}, {statistics_type})

       Calculates a statistic on the attributes of lines in a circular
       neighborhood around each output cell.

    INPUTS:
     in_polyline_features (Composite Geodataset):
         The input lines to use in the neighborhood operation.For each output
         cell, a statistic will be calculated for all of the
         portions of the input polyline features that fall within a circular
         neighborhood around that cell.The size the circular neighbourhood is
         defined by the search radius.
     field (Field):
         The field for which the specified statistic will be calculated. It can
         be any numeric field of the input line features.When statistics_type
         is set to Length, the field parameter can be set
         to NONE. It can be thefield if the input features contain
         z-values.
         Shape
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     search_radius {Double}:
         The search radius that will be used to calculate the statistic within,
         in map units.The default radius is five times the output cell size.
     statistics_type {String}:
         Specifies the statistic type to be calculated.Statistics are
         calculated on the value of the specified field for all
         lines within the neighborhood. MEAN-The average field value in
         each neighborhood, weighted
         by the length, will be calculated. The form of the calculation
         is: Mean = (sum of (length * field_value))
         / (sum_of_length).Only the part of the line that falls within the
         neighborhood is used.MAJORITY-The value having the greatest length of
         line in the
         neighborhood will be identified.MAXIMUM-The largest value in the
         neighborhood will be identified. MEDIAN-The median value,
         weighted by the length, will be
         calculated. Conceptually, all line segments in the
         neighborhood are sorted by
         value and placed end to end in a straight line. The value of the
         segment at the midpoint of the straight line is the median.MINIMUM-The
         smallest value in each neighborhood will be identified.MINORITY-The
         value having the least length of line in the neighborhood
         will be identified.RANGE-The range of values (maximum-minimum) will be
         calculated.VARIETY-The number of unique values will be
         calculated.LENGTH-The total line length in the neighborhood will be
         calculated.
         If the value of the field is not 1, the lengths are multiplied by the
         item value before adding them together. This option can be used when
         the field parameter is set to None.The default statistic type is
         MEAN.The available choices for the statistic type are determined by
         the
         numeric type of the specified field. If the field is integer, the
         available statistic choices will be majority, maximum, mean, median,
         minimum, minority, range, variety, and length. If the field is
         floating point, only the mean, maximum, minimum, range, and length
         statistics will be available.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output line statistics raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_polyline_features, field, cell_size, search_radius, statistics_type):
        out_raster = "#"
        result = arcpy.gp.LineStatistics_sa(
            in_polyline_features, field, out_raster, cell_size, search_radius, statistics_type
        )
        return _wrapToolRaster("LineStatistics_sa", str(result.getOutput(0)))

    return Wrapper(in_polyline_features, field, cell_size, search_radius, statistics_type)


LineStatistics.__esri_toolname__ = "LineStatistics_sa"
LineStatistics.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "::::6"]


def Ln(in_raster_or_constant) -> Raster:
    """Ln_sa(in_raster_or_constant)

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


Ln.__esri_toolname__ = "Ln_sa"
Ln.__esri_toolinfo__ = ["::::1"]


def LocateRegions(
    in_raster,
    total_area="#",
    area_units: Literal[
        "SQUARE_MAP_UNITS",
        "SQUARE_MILES",
        "SQUARE_KILOMETERS",
        "HECTARES",
        "ACRES",
        "SQUARE_METERS",
        "SQUARE_YARDS",
        "SQUARE_FEET",
        "#",
    ]
    | None = "#",
    number_of_regions="#",
    region_shape: Literal["CIRCLE", "ELLIPSE", "TRIANGLE", "SQUARE", "PENTAGON", "HEXAGON", "OCTAGON", "#"]
    | None = "#",
    region_orientation="#",
    shape_tradeoff="#",
    evaluation_method: Literal[
        "HIGHEST_AVERAGE_VALUE",
        "HIGHEST_SUM",
        "HIGHEST_MEDIAN_VALUE",
        "HIGHEST_VALUE",
        "LOWEST_VALUE",
        "GREATEST_CORE_AREA",
        "HIGHEST_CORE_SUM",
        "GREATEST_EDGE",
        "#",
    ]
    | None = "#",
    minimum_area="#",
    maximum_area="#",
    minimum_distance="#",
    maximum_distance="#",
    distance_units: Literal["MAP_UNITS", "MILES", "KILOMETERS", "METERS", "YARDS", "FEET", "#"] | None = "#",
    in_existing_regions="#",
    number_of_neighbors: Literal["EIGHT", "FOUR", "#"] | None = "#",
    no_islands: Literal["NO_ISLANDS", "ISLANDS_ALLOWED", "#"] | None = "#",
    region_seeds: Literal["AUTO", "SMALL", "MEDIUM", "LARGE", "MAXIMUM", "#"] | None = "#",
    region_resolution: Literal["AUTO", "LOW", "MEDIUM", "HIGH", "MAXIMUM", "#"] | None = "#",
    selection_method: Literal["AUTO", "COMBINATORIAL", "SEQUENTIAL", "#"] | None = "#",
) -> Raster:
    """LocateRegions_sa(in_raster, {total_area}, {area_units}, {number_of_regions}, {region_shape}, {region_orientation}, {shape_tradeoff}, {evaluation_method}, {minimum_area}, {maximum_area}, {minimum_distance}, {maximum_distance}, {distance_units}, {in_existing_regions}, {number_of_neighbors}, {no_islands}, {region_seeds}, {region_resolution}, {selection_method})

       Identifies the best regions, or groups of contiguous cells, from an
       input utility (suitability) raster that satisfy a specified evaluation
       criterion and that meet identified shape, size, number, and
       interregion distance constraints.

    INPUTS:
     in_raster (Composite Geodataset):
         The input utility raster from which the regions will be derived.The
         higher the value in the input raster, the greater the utility.The
         raster can be of either integer or floating-point type.
     total_area {Double}:
         The total amount of area for all regions.The default is 10 percent of
         the input cells within the processing
         extent.
     area_units {String}:
         Defines the area units used for the total_area, minimum_area, and
         maximum_area parameters.The available options and their corresponding
         units are the following:SQUARE_MAP_UNITS-For the square of the linear
         units of the output
         spatial referenceSQUARE_MILES-For milesSQUARE_KILOMETERS-For
         kilometersHECTARES-For hectaresACRES-For acresSQUARE_METERS-For
         metersSQUARE_YARDS-For yardsSQUARE_FEET-For feetThe default is based
         on the input raster dataset. If the input raster
         is in feet, yards, miles or any other imperial unit, Square miles will
         be used. If the input raster is in meters, kilometers, or any other
         metric unit, Square kilometers will be used.
     number_of_regions {Long}:
         Determines how many regions the total_area will be distributed
         across.The maximum number of regions that can be specified is 30. The
         default
         is 1.
     region_shape {String}:
         Defines the shape characteristics for the output regions.The regions
         start out from seed cell locations and grow outward with
         preference given to the cells that maintain the desired shape.The
         available shape options are the following:CIRCLE-Cells that maintain
         circular regions will receive a greater
         weight. This is the default.ELLIPSE-Cells that maintain elliptical-
         shaped regions will receive a
         greater weight.TRIANGLE-Cells that maintain equilateral triangular-
         shaped regions
         will receive a greater weight.SQUARE-Cells that maintain square-shaped
         regions will receive a
         greater weight.PENTAGON-Cells that maintain pentagon-shaped regions
         will receive a
         greater weight.HEXAGON-Cells that maintain hexagon-shaped regions will
         receive a
         greater weight.OCTAGON-Cells that maintain octagon-shaped regions will
         receive a
         greater weight.
     region_orientation {Double}:
         Defines the orientation of the defined shape. Regions are grown out
         from the seed locations with preference given to the cells that
         maintain the desired orientation of the region shapes.The orientation
         values are in compass degrees ranging from 0 to 360,
         increasing clockwise starting from north. The default is 0.The default
         of 0 orients the shapes in the following manner: Circle-no
         effect; Ellipse-the minor axis is orientated north-south; Triangle and
         Pentagon-one point is straight up; Square, Hexagon, and Octagon-one
         flat side is oriented east-west.
     shape_tradeoff {Double}:
         Identifies the weight for the cells when growing the candidate regions
         in the parameterized region-growing algorithm. The weighting is a
         tradeoff between a cell's contribution for maintaining the region
         shape relative to the utility contribution of the cell's attribute
         value.Higher values indicates maintaining the shape of the region is
         more
         important than selecting higher utility values. The acceptable percent
         values are 0 to 100, inclusively. The default is 50.This parameter is
         used to identify the feasible candidate regions. The
         candidate regions that will be selected are controlled by the
         evaluation_method parameter.
     evaluation_method {String}:
         The evaluation criteria to be used for determining which of the
         candidate regions identified in the parameterized region-growing
         algorithm are most preferred. The preference can be specified based on
         a particular statistic of the utility values, or spatial arrangement
         of the cells within the regions.The available options are the
         following:HIGHEST_AVERAGE_VALUE-Selects regions based on the highest
         average
         value. This is the default.HIGHEST_SUM-Selects regions based on the
         highest sum.HIGHEST_MEDIAN_VALUE-Selects regions based on the highest
         median
         value.HIGHEST_VALUE-Selects regions based on the highest individual
         cell
         value contained within the region. This option ensures the best
         individual cells are selected.LOWEST_VALUE-Selects regions based on
         the highest lowest individual
         cell value contained within the region. This option ensures the
         selected regions contain cells with really low utility.
         GREATEST_CORE_AREA-Selects regions based on the greatest core
         area. Any cell that is farther than one cell from the edge of
         a region is
         considered to be part of the core. The edge distance can be controlled
         by the analysis cell size. Setting a smaller cell size can increase
         the core area.HIGHEST_CORE_SUM-Selects regions based on the highest
         cumulative sum
         of the utility values for the core area. The edge distance can be
         controlled by the analysis cell size.GREATEST_EDGE-Selects regions
         based on the greatest amount of edge
         using the P1 ratio, which is the ratio of the perimeter of the shape
         to the perimeter of a circle of the same area. The P1 ratio for a
         circle is 1.
     minimum_area {Double}:
         Define the minimum area allowed for each region.The units specified by
         area_units will be used.To learn more about how regions are created
         when the minimum and
         maximum areas are defined, see How regions are determined when a
         minimum and maximum area are specified.
     maximum_area {Double}:
         Define the maximum area allowed for each region.The units specified by
         area_units will be used.To learn more about how regions are created
         when the minimum and
         maximum areas are defined, see How regions are determined when a
         minimum and maximum area are specified.
     minimum_distance {Double}:
         Define the minimum distance allowed between regions. No two regions
         can be within this distance.This parameter influences the
         parameterized region-growing (PRG)
         algorithm. If a cell has the potential of being added to a candidate
         region, but it is within this distance from any individual region in
         the in_existing_regions, it will not be considered for the candidate
         region. The minimum distance setting is not applied to excluded
         locations (NoData cells).The units specified by distance_units will be
         used.
     maximum_distance {Double}:
         Define the maximum distance allowed between regions. No region can be
         farther apart than this distance from at least one other region.When
         sequentially selecting regions, if the next best region is
         farther than this distance from any of the already selected regions,
         it will not be considered at this time, but it may be selected later
         when more regions are selected.The maximum distance is applied to
         in_existing_regions; that is, at
         least one of the selected regions must be within the maximum distance
         from existing regions. The maximum distance setting is not applied to
         excluded areas (NoData cells), and has no effect on the PRG
         algorithm.The units specified by distance_units will be used.
     distance_units {String}:
         Defines the distance units that will be used for the minimum_distance
         and maximum_distance parameters.The available options and their
         corresponding units are the following:MAP_UNITS-For the linear units
         of the output spatial
         referenceMILES-For milesKILOMETERS-For kilometersMETERS-For
         metersYARDS-For yardsFEET-For feetThe default is based on the input
         raster dataset. If the input raster
         is in feet, yards, miles, or any other imperial unit, Miles will be
         used. If the input raster is in meters, kilometers, or any other
         metric unit, Kilometers will be used.
     in_existing_regions {Composite Geodataset}:
         A dataset identifying where regions already exist.The input can be a
         raster or feature dataset. If the input is a
         raster, any location in the raster with a valid value is considered
         already allocated. All other locations are set to NoData.In the
         parameterized region-growing algorithm, no region will grow
         from any location containing an existing region. Existing regions will
         be used in the growth and evaluation of the minimum_distance and
         maximum_distance as described in the corresponding parameter
         descriptions above.
     number_of_neighbors {String}:
         Defines which neighboring cells to use in the growth of the
         regions.The available options are the following:FOUR-Only the four
         direct (orthogonal) neighbors of the region cells
         will be considered in the region growth.EIGHT-The eight nearest
         neighbors (orthogonal and diagonal) will be
         considered in the region growth. This is the default.
     no_islands {Boolean}:
         Defines if islands will be allowed within the potential regions.
         NO_ISLANDS-The parameterized region-growing algorithm ensures
         there will be no islands within a region. A flood field
         algorithm is implemented as a postprocess once the
         regions are created but before the regions are selected. If there are
         islands within a region, they will be filled in and the cells will
         join the region. Since the fill process occurs before the selection
         process, the utility of the island cells will be added to the region,
         and their values will be included in the selection process of the
         regions and in the statistics of the output regions. As a result of
         the fill process, it is likely that the total area allocated will
         exceed the target total_area value.This is the
         default.ISLANDS_ALLOWED-Islands will be allowed.
     region_seeds {String}:
         Defines the number of seeds from which to grow the potential
         regions.To learn more about how the seeds influence the region growth
         algorithm, see How seeds are distributed.The available options are the
         following:AUTO-The number of seeds will be based on the number of
         cells in the
         input raster. When the input raster has 100,000 cells or fewer, the
         default is Maximum. When the input raster has more than 100,000 cells,
         the default is Small. This is the default.SMALL-The number of seeds
         will be equal to 10 percent of the number of
         cells in the input raster, after NoData cells are excluded, but not to
         exceed 1,600 seeds.MEDIUM-The number of seeds will be equal to 20
         percent of the number
         of cells in the input raster, after NoData cells are excluded, but not
         to exceed 2,500 seeds.LARGE-The number of seeds will be equal to 30
         percent of the number of
         cells in the input raster, after NoData cells are excluded, but not to
         exceed 3,600 seeds.MAXIMUM-The region growth will occur at each
         available cell within the
         input raster. Available cells are all cells that are not NoData and
         not identified as an existing region.
     region_resolution {String}:
         Sets the resolution at which region growth occurs.The input raster
         will be resampled to the resolution determined by the
         number of cells identified by this parameter (see below). For example,
         for Low the input raster is resampled to 147,356 cells. The
         parameterized region-growing algorithm grows on the resampled
         intermediate raster. Once the regions are selected from the resampled
         intermediate raster, the selected regions will be resampled to the
         Cell Size.An adjustment to the target resolutions identified below may
         be
         implemented if the number of cells in the desired average region size
         is too small or too large. This adjustment makes sure there will be
         enough cells in each desired region or that unnecessary processing
         will not occur. As a result, the total cells for the intermediate
         resampled raster for each of the specified resolutions below can be
         lower or higher than the target number of cells. For more information
         on this adjustment and the thresholds used, see Adjusting the region
         growth resolution based on the size of the desired regions.If the
         input has less than 147,356 cells or Maximum is selected, no
         resampling will occur and the region growth will process on all cells
         in the input raster. If the input raster has less than 147,356 cells,
         the Low, Medium, or High options have no effect.The available options
         are the following:AUTO-The resolution will be based on the number of
         cells in the input
         raster. When the input raster has 500,000 cells or fewer, the default
         is Maximum. When the input raster has more than 500,000 cells, the
         default is Low. This is the default.LOW-The analysis will be performed
         on an intermediate raster
         containing 147,356 (384 x 384) cells distributed in the same x and y
         ratio as the input raster.MEDIUM-The analysis will be performed on an
         intermediate raster
         containing 262,144 (512 x 512) cells distributed in the same x and y
         ratio as the input raster.HIGH-The analysis will be performed on an
         intermediate raster
         containing 589,824 (768 x 768) cells distributed in the same x and y
         ratio as the input raster.MAXIMUM-The analysis will be performed on
         all cells in the input
         raster.
     selection_method {String}:
         Identifies how the regions will be selected.The available options are
         the following:         AUTO-The selection method is based on
         theparameter. If theis
         eight or less, the Combinatorial selection method is used. If
         theparameter is greater than eight, the Sequential selection method is
         used. This is the default. Number of regionsNumber of
         regionsNumber of regionsCOMBINATORIAL-Selects the best regions based
         on the specified
         evaluation method, while honoring the spatial constraints, by testing
         all combinations of the desired number of regions within the candidate
         regions from the parameterized region-growing (PRG)
         algorithm.SEQUENTIAL-Sequentially selects the best regions based on
         the
         evaluation method and that meets the spatial constraints until the
         desired number of regions is reached.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output regions raster.Each region is uniquely numbered with values
         greater than zero. Cells
         that do not belong to any regions will be assigned zero. The output is
         always an integer raster.Additional fields are calculated for each
         region storing statistics of
         the selected regions. These fields are the following:AVERAGE-The
         average utility value of the region.TOTAL-The total sum of
         the utility values within the region.MEDIAN-The median utility value
         of the region.HIGHEST-The highest individual cell value contained
         within the region.LOWEST-The lowest individual cell value contained
         within the region.COREAREA-The core area. Any cell farther than one
         cell from the
         region's edge is considered to be part of the core.CORESUM-The
         cumulative sum of the utility values for the core area.EDGE-The amount
         of edge using the P1 ratio, which is the ratio of the
         perimeter of the shape to the perimeter of a circle of the same area.
         The P1 ratio for a circle is 1."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_raster,
        total_area,
        area_units,
        number_of_regions,
        region_shape,
        region_orientation,
        shape_tradeoff,
        evaluation_method,
        minimum_area,
        maximum_area,
        minimum_distance,
        maximum_distance,
        distance_units,
        in_existing_regions,
        number_of_neighbors,
        no_islands,
        region_seeds,
        region_resolution,
        selection_method,
    ):
        out_raster = "#"
        result = arcpy.gp.LocateRegions_sa(
            in_raster,
            out_raster,
            total_area,
            area_units,
            number_of_regions,
            region_shape,
            region_orientation,
            shape_tradeoff,
            evaluation_method,
            minimum_area,
            maximum_area,
            minimum_distance,
            maximum_distance,
            distance_units,
            in_existing_regions,
            number_of_neighbors,
            no_islands,
            region_seeds,
            region_resolution,
            selection_method,
        )
        return _wrapToolRaster("LocateRegions_sa", str(result.getOutput(0)))

    return Wrapper(
        in_raster,
        total_area,
        area_units,
        number_of_regions,
        region_shape,
        region_orientation,
        shape_tradeoff,
        evaluation_method,
        minimum_area,
        maximum_area,
        minimum_distance,
        maximum_distance,
        distance_units,
        in_existing_regions,
        number_of_neighbors,
        no_islands,
        region_seeds,
        region_resolution,
        selection_method,
    )


LocateRegions.__esri_toolname__ = "LocateRegions_sa"
LocateRegions.__esri_toolinfo__ = [
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
]


def Log10(in_raster_or_constant) -> Raster:
    """Log10_sa(in_raster_or_constant)

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


Log10.__esri_toolname__ = "Log10_sa"
Log10.__esri_toolinfo__ = ["::::1"]


def Log2(in_raster_or_constant) -> Raster:
    """Log2_sa(in_raster_or_constant)

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


Log2.__esri_toolname__ = "Log2_sa"
Log2.__esri_toolinfo__ = ["::::1"]


def Lookup(in_raster, lookup_field) -> Raster:
    """Lookup_sa(in_raster, lookup_field)

       Creates a raster by looking up values in another field in the table of
       the input raster.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster that contains a field from which to create a new
         raster.
     lookup_field (Field):
         Field containing the desired values for the new raster.It can be a
         numeric or string type.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster whose values are determined by the specified field
         of the input raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, lookup_field):
        out_raster = "#"
        result = arcpy.gp.Lookup_sa(in_raster, lookup_field, out_raster)
        return _wrapToolRaster("Lookup_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, lookup_field)


Lookup.__esri_toolname__ = "Lookup_sa"
Lookup.__esri_toolinfo__ = ["::::1", "::::2"]


def LowestPosition(in_rasters_or_constants) -> Raster:
    """LowestPosition_sa(in_rasters_or_constants;in_rasters_or_constants...)

       Determines on a cell-by-cell basis the position of the raster with the
       minimum value in a set of rasters.

    INPUTS:
     in_rasters_or_constants (Composite Geodataset):
         The list of input rasters for which the position of the input with the
         lowest value will be determined.A number can be used as an input;
         however, the cell size and extent
         must first be set in the environment.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.For each cell in the output raster, the value
         represents the position
         of the raster with the lowest value."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_rasters_or_constants):
        return _wrapLocalFunctionRaster(
            "LowestPosition_sa",
            ["LowestPosition"] + Utils.flattenLists(in_rasters_or_constants),
            {"flattenBands": True},
        )

    return Wrapper(in_rasters_or_constants)


LowestPosition.__esri_toolname__ = "LowestPosition_sa"
LowestPosition.__esri_toolinfo__ = ["::::1"]


def MajorityFilter(
    in_raster,
    number_neighbors: Literal["FOUR", "EIGHT", "#"] | None = "#",
    majority_definition: Literal["MAJORITY", "HALF", "#"] | None = "#",
) -> Raster:
    """MajorityFilter_sa(in_raster, {number_neighbors}, {majority_definition})

       Replaces cells in a raster based on the majority of their contiguous
       neighboring cells.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster to be filtered based on the majority of contiguous
         neighboring cells.It must be of integer type.
     number_neighbors {String}:
         Determines the number of neighboring cells to use in the kernel of the
         filter.FOUR-The kernel of the filter will be the four direct
         (orthogonal)
         neighbors to the present cell. This is the default.EIGHT-The kernel of
         the filter will be the eight nearest neighbors (a
         three-by-three window) to the present cell.
     majority_definition {String}:
         Specifies the number of contiguous (spatially connected) cells that
         must be of the same value before a replacement will occur.MAJORITY-A
         majority of cells must have the same value and be
         contiguous. Three out of four or five out of eight connected cells
         must have the same value.HALF-Half of the cells must have the same
         value and be contiguous. Two
         out of four or four out of eight connected cells must have the same
         value. This option will have a more smoothing effect than the other.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output filtered raster.The output is always of integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, number_neighbors, majority_definition):
        out_raster = "#"
        result = arcpy.gp.MajorityFilter_sa(in_raster, out_raster, number_neighbors, majority_definition)
        return _wrapToolRaster("MajorityFilter_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, number_neighbors, majority_definition)


MajorityFilter.__esri_toolname__ = "MajorityFilter_sa"
MajorityFilter.__esri_toolinfo__ = ["::::1", "::::3", "::::4"]


def Minus(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """Minus_sa(in_raster_or_constant1, in_raster_or_constant2)

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


Minus.__esri_toolname__ = "Minus_sa"
Minus.__esri_toolinfo__ = ["::::1", "::::2"]


def MLClassify(
    in_raster_bands,
    in_signature_file,
    reject_fraction: Literal[
        "0.0",
        "0.005",
        "0.01",
        "0.025",
        "0.05",
        "0.1",
        "0.25",
        "0.5",
        "0.75",
        "0.9",
        "0.95",
        "0.975",
        "0.99",
        "0.995",
        "#",
    ]
    | None = "#",
    a_priori_probabilities: Literal["EQUAL", "SAMPLE", "FILE", "#"] | None = "#",
    in_a_priori_file="#",
    out_confidence_raster="#",
) -> Raster:
    """MLClassify_sa(in_raster_bands;in_raster_bands..., in_signature_file, {reject_fraction}, {a_priori_probabilities}, {in_a_priori_file}, {out_confidence_raster})

       Performs a maximum likelihood classification on a set of raster bands
       and creates a classified raster as output.

    INPUTS:
     in_raster_bands (Composite Geodataset):
         The input raster bands.While the bands can be integer or floating
         point type, the signature
         file only allows integer class values.
     in_signature_file (File):
         The input signature file whose class signatures are used by the
         maximum likelihood classifier.A .gsg extension is required.
     reject_fraction {String}:
         Select a reject fraction, which determines whether a cell will be
         classified based on its likelihood of being correctly assigned to one
         of the classes. Cells whose likelihood of being correctly assigned to
         any of the classes is lower than the reject fraction will be given a
         value of NoData in the output classified raster.The default value is
         0.0, which means that every cell will be
         classified.Valid entries are:0.0-The rejection fraction is 0.00.005-
         The rejection fraction is
         0.0050.01-The rejection fraction is 0.010.025-The rejection fraction
         is 0.0250.05-The rejection fraction is 0.050.1-The rejection
         fraction is 0.10.25-The rejection fraction is 0.250.5-The rejection
         fraction is 0.50.75-The rejection fraction is 0.750.9-The rejection
         fraction is 0.90.95-The rejection fraction is 0.950.975-The
         rejection fraction is 0.9750.99-The rejection fraction is 0.990.995-
         The rejection fraction is 0.995
     a_priori_probabilities {String}:
         Specifies how a priori probabilities will be determined.EQUAL-All
         classes will have the same a priori probability.SAMPLE-A
         priori probabilities will be proportional to the number of
         cells in each class relative to the total number of cells sampled in
         all classes in the signature file.FILE-The a priori probabilities will
         be assigned to each class from an
         input ASCII a priori probability file.
     in_a_priori_file {File}:
         A text file containing a priori probabilities for the input signature
         classes. An input for the a priori probability file is only
         required
         when theoption is used. FileThe extension for the a priori file
         can be .txt or .asc.

    OUTPUTS:
     out_classified_raster (Raster Dataset):
         The output classified raster.It will be of integer type.
     out_confidence_raster {Raster Dataset}:
         The output confidence raster dataset shows the certainty of the
         classification in 14 levels of confidence, with the lowest values
         representing the highest reliability. If there are no cells classified
         at a particular confidence level, that confidence level will not be
         present in the output confidence raster.It will be of integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_raster_bands,
        in_signature_file,
        reject_fraction,
        a_priori_probabilities,
        in_a_priori_file,
        out_confidence_raster,
    ):
        out_classified_raster = "#"
        result = arcpy.gp.MLClassify_sa(
            in_raster_bands,
            in_signature_file,
            out_classified_raster,
            reject_fraction,
            a_priori_probabilities,
            in_a_priori_file,
            out_confidence_raster,
        )
        return _wrapToolRaster("MLClassify_sa", str(result.getOutput(0)))

    return Wrapper(
        in_raster_bands,
        in_signature_file,
        reject_fraction,
        a_priori_probabilities,
        in_a_priori_file,
        out_confidence_raster,
    )


MLClassify.__esri_toolname__ = "MLClassify_sa"
MLClassify.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "::::6", "::::7"]


def Mod(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """Mod_sa(in_raster_or_constant1, in_raster_or_constant2)

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


Mod.__esri_toolname__ = "Mod_sa"
Mod.__esri_toolinfo__ = ["::::1", "::::2"]


def MultiscaleSurfaceDifference(
    in_raster,
    out_scale_raster="#",
    distance_units: Literal["CELLS", "METERS", "CENTIMETERS", "KILOMETERS", "INCHES", "FEET", "YARDS", "MILES", "#"]
    | None = "#",
    min_scale="#",
    max_scale="#",
    increment="#",
    analysis_target_device: Literal["GPU_THEN_CPU", "GPU_ONLY", "CPU_ONLY", "#"] | None = "#",
) -> Raster:
    """MultiscaleSurfaceDifference_sa(in_raster, {out_scale_raster}, {distance_units}, {min_scale}, {max_scale}, {increment}, {analysis_target_device})

       Calculates the maximum difference from the mean elevation across a
       range of spatial scales.

    INPUTS:
     in_raster (Composite Geodataset):
         The input surface raster.
     distance_units {String}:
         Specifies the distance unit that will be used for the min_scale,
         max_scale, and increment parameters.Distance will be measured in the
         number of cells or specified unit.
         The default is the map unit of the spatial reference for the in_raster
         value.CELLS-The distance unit will be cells.METERS-The distance unit
         will be
         meters.CENTIMETERS-The distance unit will be
         centimeters.KILOMETERS-The distance unit will be kilometers.INCHES-The
         distance unit will be inches.FEET-The distance unit will be
         feet.YARDS-The distance unit will be yards.MILES-The distance unit
         will be miles.
     min_scale {Double}:
         The distance that defines the minimum neighborhood scale that
         elevation difference will be calculated for. This is the distance from
         the target cell center, creating a square of cells around the target
         cell.This value must be less than or equal to the max_scale parameter
         value
         and greater than or equal to the input raster cell size or one
         cell.The default value is 4 times the cell size of the in_raster
         parameter
         value, resulting in a 9 by 9 cell neighborhood.
     max_scale {Double}:
         The distance that defines the maximum neighborhood scale that
         elevation difference will be calculated for. This is the distance from
         the target cell center, creating a square of cells around the target
         cell.This value must be greater than or equal to the min_scale
         parameter
         value and the input raster cell size or one cell.The default value is
         13 times the cell size of the in_raster parameter
         value, resulting in a 27 by 27 cell neighborhood.
     increment {Double}:
         The increase in neighborhood distance between scales.This parameter
         value cannot be less than the in_raster cell size or 1
         cell.The default value is the cell size of the in_raster parameter
         value.
     analysis_target_device {String}:
         Specifies the device that will be used to perform the
         calculation.GPU_THEN_CPU-If a compatible GPU is found, it will be used
         to perform
         the calculation. Otherwise, the CPU will be used. This is the
         default.CPU_ONLY-The calculation will only be performed on the
         CPU.GPU_ONLY-The calculation will only be performed on the GPU.

    OUTPUTS:
     out_difference_raster (Raster Dataset):
         The output raster containing the maximum difference from the mean
         elevation for each cell.It will be floating-point type.
     out_scale_raster {Raster Dataset}:
         The output raster containing the scale at which the most extreme
         difference was found for each cell. Scales are represented as their
         neighborhood distance values.It will be floating-point type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, out_scale_raster, distance_units, min_scale, max_scale, increment, analysis_target_device):
        out_difference_raster = "#"
        result = arcpy.gp.MultiscaleSurfaceDifference_sa(
            in_raster,
            out_difference_raster,
            out_scale_raster,
            distance_units,
            min_scale,
            max_scale,
            increment,
            analysis_target_device,
        )
        return _wrapToolRaster("MultiscaleSurfaceDifference_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, out_scale_raster, distance_units, min_scale, max_scale, increment, analysis_target_device)


MultiscaleSurfaceDifference.__esri_toolname__ = "MultiscaleSurfaceDifference_sa"
MultiscaleSurfaceDifference.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7", "::::8"]


def MultiscaleSurfacePercentile(
    in_raster,
    out_scale_raster="#",
    distance_units: Literal["CELLS", "METERS", "CENTIMETERS", "KILOMETERS", "INCHES", "FEET", "YARDS", "MILES", "#"]
    | None = "#",
    min_scale="#",
    max_scale="#",
    base_increment="#",
    nonlinearity="#",
    analysis_target_device: Literal["GPU_THEN_CPU", "GPU_ONLY", "CPU_ONLY", "#"] | None = "#",
) -> Raster:
    """MultiscaleSurfacePercentile_sa(in_raster, {out_scale_raster}, {distance_units}, {min_scale}, {max_scale}, {base_increment}, {nonlinearity}, {analysis_target_device})

       Calculates the most extreme percentile across a range of spatial
       scales.

    INPUTS:
     in_raster (Composite Geodataset):
         The input surface raster.
     distance_units {String}:
         Specifies the distance unit that will be used for the min_scale,
         max_scale, and base_increment parameters.Distance will be measured in
         the number of cells or specified unit.
         The default is the map unit of the spatial reference for the in_raster
         value.CELLS-The distance unit will be cells.METERS-The distance unit
         will be
         meters.CENTIMETERS-The distance unit will be
         centimeters.KILOMETERS-The distance unit will be kilometers.INCHES-The
         distance unit will be inches.FEET-The distance unit will be
         feet.YARDS-The distance unit will be yards.MILES-The distance unit
         will be miles.
     min_scale {Double}:
         The distance that defines the minimum neighborhood scale that
         elevation percentile will be calculated for. This is the distance from
         the target cell center, creating a square of cells around the target
         cell.This value must be less than or equal to the max_scale parameter
         value
         and greater than or equal to the input raster cell size or one
         cell.The default value is 4 times the cell size of the in_raster
         parameter
         value, resulting in a 9 by 9 cell neighborhood.
     max_scale {Double}:
         The distance that defines the maximum neighborhood scale that
         elevation percentile will be calculated for. This is the distance from
         the target cell center, creating a square of cells around the target
         cell.This value must be greater than or equal to the min_scale
         parameter
         value and the input raster cell size or one cell.The default value is
         13 times the cell size of the in_raster parameter
         value, resulting in a 27 by 27 cell neighborhood.
     base_increment {Double}:
         The initial increase in neighborhood distance between scales.This
         parameter cannot be less than the in_raster cell size or 1 cell.The
         default value is the cell size of the in_raster parameter value.
     nonlinearity {Double}:
         The factor that can introduce nonlinearity into the scale increase at
         each increment. This causes the increment between scales to increase
         instead of remaining constant. Generally, values between 1.0 and 2.0
         are used.This parameter must be greater than or equal to 1.The default
         value is 1, which creates a linear increase in
         neighborhood distances (where the increment between scales remains
         constant).
     analysis_target_device {String}:
         Specifies the device that will be used to perform the
         calculation.GPU_THEN_CPU-If a compatible GPU is found, it will be used
         to perform
         the calculation. Otherwise, the CPU will be used. This is the
         default.CPU_ONLY-The calculation will only be performed on the
         CPU.GPU_ONLY-The calculation will only be performed on the GPU.

    OUTPUTS:
     out_percentile_raster (Raster Dataset):
         The output raster containing the most extreme percentile value for
         each cell. The most extreme value is the percentile furthest from 50
         (such as percentiles closer to 0 or 100).It will be floating-point
         type.
     out_scale_raster {Raster Dataset}:
         The output raster containing the scale at which the most extreme
         percentile was found for each cell. Scales are represented as their
         neighborhood distance values.It will be floating-point type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_raster,
        out_scale_raster,
        distance_units,
        min_scale,
        max_scale,
        base_increment,
        nonlinearity,
        analysis_target_device,
    ):
        out_percentile_raster = "#"
        result = arcpy.gp.MultiscaleSurfacePercentile_sa(
            in_raster,
            out_percentile_raster,
            out_scale_raster,
            distance_units,
            min_scale,
            max_scale,
            base_increment,
            nonlinearity,
            analysis_target_device,
        )
        return _wrapToolRaster("MultiscaleSurfacePercentile_sa", str(result.getOutput(0)))

    return Wrapper(
        in_raster,
        out_scale_raster,
        distance_units,
        min_scale,
        max_scale,
        base_increment,
        nonlinearity,
        analysis_target_device,
    )


MultiscaleSurfacePercentile.__esri_toolname__ = "MultiscaleSurfacePercentile_sa"
MultiscaleSurfacePercentile.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7", "::::8", "::::9"]


def NaturalNeighbor(in_point_features, z_field, cell_size="#") -> Raster:
    """NaturalNeighbor_sa(in_point_features, z_field, {cell_size})

       Interpolates a raster surface from points using a natural neighbor
       technique.

    INPUTS:
     in_point_features (Composite Geodataset):
         The input point features containing the z-values to be interpolated
         into a surface raster.
     z_field (Field):
         The field that holds a height or magnitude value for each point.This
         can be a numeric field or the Shape field if the input point
         features contain z-values.
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output interpolated surface raster.It is always a floating-point
         raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_point_features, z_field, cell_size):
        out_raster = "#"
        result = arcpy.gp.NaturalNeighbor_sa(in_point_features, z_field, out_raster, cell_size)
        return _wrapToolRaster("NaturalNeighbor_sa", str(result.getOutput(0)))

    return Wrapper(in_point_features, z_field, cell_size)


NaturalNeighbor.__esri_toolname__ = "NaturalNeighbor_sa"
NaturalNeighbor.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def Negate(in_raster_or_constant) -> Raster:
    """Negate_sa(in_raster_or_constant)

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


Negate.__esri_toolname__ = "Negate_sa"
Negate.__esri_toolinfo__ = ["::::1"]


def Nibble(
    in_raster,
    in_mask_raster,
    nibble_values: Literal["ALL_VALUES", "DATA_ONLY", "#"] | None = "#",
    nibble_nodata: Literal["PRESERVE_NODATA", "PROCESS_NODATA", "#"] | None = "#",
    in_zone_raster="#",
) -> Raster:
    """Nibble_sa(in_raster, in_mask_raster, {nibble_values}, {nibble_nodata}, {in_zone_raster})

       Replaces cells of a raster corresponding to a mask with the value of
       the nearest neighbor.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster with the masked locations that will be replaced by
         the value of their nearest neighbor.The input raster can be either
         integer or floating point type.
     in_mask_raster (Composite Geodataset):
         The raster that identifies the locations in the input raster that will
         be replaced.Cells with a value of NoData are considered to be within
         the masked
         area. In the output raster, these locations will be replaced by the
         value of their nearest neighbor in the in_raster value.The mask raster
         can be either integer or floating point type.
     nibble_values {Boolean}:
         Specifies whether NoData cells in the input raster can replace cells
         in the masked areas if they are the nearest neighbor.ALL_VALUES-Both
         NoData and data values can replace cells in the masked
         area. This means that NoData values in the input raster can replace
         areas defined in the mask if they are the nearest neighbor. This is
         the default.DATA_ONLY-Only data values can replace cells in the masked
         area.
         NoData values in the input raster cannot replace areas defined in the
         mask raster even if they are the nearest neighbor.
     nibble_nodata {Boolean}:
         Specifies whether NoData cells in the input raster that are within the
         masked area will be preserved or replaced.PRESERVE_NODATA-Any NoData
         cells in the input raster that are within
         the masked area will be preserved (remain as NoData) in the output.
         This is the default.PROCESS_NODATA-NoData cells in the input raster
         that are within the
         masked area can be replaced with the value of the nearest neighbor
         that is outside the masked area.
     in_zone_raster {Composite Geodataset}:
         The input zone raster. For each zone, input cells that are within the
         mask will be replaced only by the nearest cell values within that same
         zone.A zone is all the cells in a raster that have the same value,
         whether
         or not they are contiguous. The input zone layer defines the shape,
         values, and locations of the zones. The zone raster can be either
         integer or floating point type.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster with the replaced cells.The identified input cells
         will be replaced with the values of their
         nearest neighbor.If the in_raster value is integer, the output raster
         will be integer.
         If it is floating point, the output will be floating point."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, in_mask_raster, nibble_values, nibble_nodata, in_zone_raster):
        out_raster = "#"
        result = arcpy.gp.Nibble_sa(in_raster, in_mask_raster, out_raster, nibble_values, nibble_nodata, in_zone_raster)
        return _wrapToolRaster("Nibble_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, in_mask_raster, nibble_values, nibble_nodata, in_zone_raster)


Nibble.__esri_toolname__ = "Nibble_sa"
Nibble.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "::::6"]


def NotEqual(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """NotEqual_sa(in_raster_or_constant1, in_raster_or_constant2)

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


NotEqual.__esri_toolname__ = "NotEqual_sa"
NotEqual.__esri_toolinfo__ = ["::::1", "::::2"]


def ObserverPoints(
    in_raster,
    in_observer_point_features,
    z_factor="#",
    curvature_correction: Literal["FLAT_EARTH", "CURVED_EARTH", "#"] | None = "#",
    refractivity_coefficient="#",
    out_agl_raster="#",
) -> Raster:
    """ObserverPoints_sa(in_raster, in_observer_point_features, {z_factor}, {curvature_correction}, {refractivity_coefficient}, {out_agl_raster})

       Identifies which observer points are visible from each raster surface
       location.

    INPUTS:
     in_raster (Composite Geodataset):
         The input surface raster.
     in_observer_point_features (Composite Geodataset):
         The point feature class that identifies the observer locations.The
         maximum number of points allowed is 16.
     z_factor {Double}:
         The number of ground x,y units in one surface z-unit.The z-factor
         adjusts the units of measure for the z-units when they
         are different from the x,y units of the input surface. The z-values of
         the input surface are multiplied by the z-factor when calculating the
         final output surface.If the x,y units and z-units are in the same
         units of measure, the
         z-factor is 1. This is the default.If the x,y units and z-units are in
         different units of measure, the
         z-factor must be set to the appropriate factor or the results will be
         incorrect. For example, if the z-units are feet and the x,y units are
         meters, use a z-factor of 0.3048 to convert the z-units from feet to
         meters (1 foot = 0.3048 meter).
     curvature_correction {Boolean}:
         Specifies whether correction for the earth's curvature will be
         applied.FLAT_EARTH-No curvature correction will be applied. This is
         the
         default.CURVED_EARTH-Curvature correction will be applied.
     refractivity_coefficient {Double}:
         The coefficient of the refraction of visible light in air.The default
         value is 0.13.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The output identifies exactly which observer points
         are visible from
         each raster surface location.
     out_agl_raster {Raster Dataset}:
         The output above ground level (AGL) raster.The AGL result is a raster
         where each cell value is the minimum height
         that must be added to an otherwise nonvisible cell to make it visible
         by at least one observer.Cells that were already visible will have a
         value of 0 in this output
         raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_raster, in_observer_point_features, z_factor, curvature_correction, refractivity_coefficient, out_agl_raster
    ):
        out_raster = "#"
        result = arcpy.gp.ObserverPoints_sa(
            in_raster,
            in_observer_point_features,
            out_raster,
            z_factor,
            curvature_correction,
            refractivity_coefficient,
            out_agl_raster,
        )
        return _wrapToolRaster("ObserverPoints_sa", str(result.getOutput(0)))

    return Wrapper(
        in_raster, in_observer_point_features, z_factor, curvature_correction, refractivity_coefficient, out_agl_raster
    )


ObserverPoints.__esri_toolname__ = "ObserverPoints_sa"
ObserverPoints.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "::::6", "::::7"]


def OptimalCorridorConnections(
    in_regions,
    out_optimal_polygons,
    in_barriers="#",
    in_cost_raster="#",
    out_optimal_lines="#",
    out_neighbor_polygons="#",
    out_neighbor_lines="#",
    corridor_method: Literal["FIXED_WIDTH_CORRIDOR", "#"] | None = "#",
    corridor_width="#",
    distance_method: Literal["PLANAR", "GEODESIC", "#"] | None = "#",
):
    """OptimalCorridorConnections_sa(in_regions, out_optimal_polygons, {in_barriers}, {in_cost_raster}, {out_optimal_lines}, {out_neighbor_polygons}, {out_neighbor_lines}, {corridor_method}, {corridor_width}, {distance_method})

       Calculates the optimal corridor connections between two or more input
       regions.

    INPUTS:
     in_regions (Raster Layer / Feature Layer):
         The input regions that will be connected by the optimal
         corridors.Regions can be defined by either a raster or a feature
         dataset.If the region input is a raster, the regions are defined by
         groups of
         contiguous (adjacent) cells of the same value. Each region must be
         uniquely numbered. The cells that are not part of any region must be
         NoData. The raster type must be integer, and the values can be either
         positive or negative.If the region input is a feature dataset, it can
         be polygons,
         polylines, or points. Polygon feature regions cannot be composed of
         multipart polygons.
     in_barriers {Raster Layer / Feature Layer}:
         The dataset that defines the barriers.The barriers can be defined by
         an integer or a floating-point raster,
         or by a point, line, or polygon feature.
     in_cost_raster {Raster Layer}:
         A raster defining the impedance or cost to move planimetrically
         through each cell.The value at each cell location represents the cost-
         per-unit distance
         for moving through the cell. Each cell location value is multiplied by
         the cell resolution while also compensating for diagonal movement to
         obtain the total cost of passing through the cell.The values of the
         cost raster can be integer or floating point. Cost
         raster values that are negative or zero are invalid but will be
         treated as small positive cost values.
     corridor_method {String}:
         Specifies how the corridor will be created.At this release, there is
         only one method to create corridors: fixed
         width. Since there is only a single default option, this parameter
         will be inactive, and will not appear on the tool dialog
         box.FIXED_WIDTH_CORRIDOR-The corridor will have a fixed width and the
         optimal corridors and paths will be created based on this width. This
         is the default.
     corridor_width {Double}:
         A linear distance that defines the width of the resulting corridors.
         The value must be greater than or equal to zero. The default is zero.
     distance_method {String}:
         Specifies whether the distance will be calculated using a planar (flat
         earth) or a geodesic (ellipsoid) method.PLANAR-The distance
         calculation will be performed on a projected flat
         plane using a 2D Cartesian coordinate system. This is the
         default.GEODESIC-The distance calculation will be performed on the
         ellipsoid.
         Regardless of input or output projection, the results will not change.

    OUTPUTS:
     out_optimal_polygons (Feature Dataset):
         The output polygon or line feature class of the optimal corridors that
         connect each of the input regions. Corridors (or lines) will overlap
         in locations where corridors travel the same route.Each corridor (or
         line) is uniquely numbered and additional fields in
         the attribute table store specific information about the path. Those
         additional fields are the following:CORR_ID-The unique identifier for
         the corridorREGION1-The first region
         the path connectsREGION2-The other region the path connects
     out_optimal_lines {Feature Dataset}:
         The output line feature class identifies the optimal lines to connect
         each of the input regions. Lines will overlap in locations where paths
         travel the same route. Each path (or line) is uniquely numbered
         and additional fields
         in the attribute table store specific information about the path.
         Those additional fields are the following:        PATHID-The unique
         identifier for the pathPATHCOST-The total
         accumulative distance or cost for the pathREGION1-The first region the
         path connectsREGION2-The other region the path connects
     out_neighbor_polygons {Feature Dataset}:
         The output polygon or line feature class identifying the optimal
         corridors that connect each region to each of its closest or cost
         neighbors. Corridors (or lines) will overlap in locations where
         corridors travel the same route. Each corridor is uniquely
         numbered and additional fields in
         the attribute table store specific information about the path. Those
         additional fields are the following:        CORRIDORID-The unique
         identifier for the corridorREGION1-The first
         region the path connectsREGION2-The other region the path connects
     out_neighbor_lines {Feature Dataset}:
         The output line feature class identifying the optimal line from each
         region to each of its closest or cost neighbors. Each corridor
         (or polygon) is uniquely numbered and additional
         fields in the attribute table store specific information about the
         path. Those additional fields are the following:        PATHID-The
         unique identifier for the pathPATHCOST-The total
         accumulative distance or cost for the pathREGION1-The first region the
         path connectsREGION2-The other region the path connectsSince each path
         is represented by a unique line, there will be
         multiple lines in locations where the same route is optimal."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_regions,
        out_optimal_polygons,
        in_barriers,
        in_cost_raster,
        out_optimal_lines,
        out_neighbor_polygons,
        out_neighbor_lines,
        corridor_method,
        corridor_width,
        distance_method,
    ):
        result = arcpy.gp.OptimalCorridorConnections_sa(
            in_regions,
            out_optimal_polygons,
            in_barriers,
            in_cost_raster,
            out_optimal_lines,
            out_neighbor_polygons,
            out_neighbor_lines,
            corridor_method,
            corridor_width,
            distance_method,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_regions,
        out_optimal_polygons,
        in_barriers,
        in_cost_raster,
        out_optimal_lines,
        out_neighbor_polygons,
        out_neighbor_lines,
        corridor_method,
        corridor_width,
        distance_method,
    )


OptimalCorridorConnections.__esri_toolname__ = "OptimalCorridorConnections_sa"
OptimalCorridorConnections.__esri_toolinfo__ = [
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


def OptimalPathAsLine(
    in_destination_data,
    in_distance_accumulation_raster,
    in_back_direction_raster,
    out_polyline_features,
    destination_field="#",
    path_type: Literal["BEST_SINGLE", "EACH_CELL", "EACH_ZONE", "#"] | None = "#",
    create_network_paths: Literal["DESTINATIONS_TO_SOURCES", "NETWORK_PATHS", "#"] | None = "#",
):
    """OptimalPathAsLine_sa(in_destination_data, in_distance_accumulation_raster, in_back_direction_raster, out_polyline_features, {destination_field}, {path_type}, {create_network_paths})

       Calculates the optimal path from a source to a destination as a line.

    INPUTS:
     in_destination_data (Composite Geodataset):
         An integer raster or feature (point, line, or polygon) that identifies
         locations from which the optimal path will be determined to the least
         costly source.If the input is a raster, it must consist of cells that
         have valid
         values for the destinations, and the remaining cells must be assigned
         NoData. Zero is a valid value.
     in_distance_accumulation_raster (Composite Geodataset):
         The distance accumulation raster that will be used to determine the
         optimal path from the sources to the destinations.The distance
         accumulation raster is usually created with the Distance
         Accumulation or Distance Allocation tool. Each cell in the distance
         accumulation raster represents the minimum accumulative cost distance
         over a surface from each cell to a set of source cells.
     in_back_direction_raster (Composite Geodataset):
         The back direction raster contains calculated directions in degrees.
         The direction identifies the next cell along the optimal path back to
         the least accumulative cost source while avoiding barriers.The range
         of values is from 0 degrees to 360 degrees, with 0 reserved
         for the source cells. Due east is 90, and the values increase
         clockwise (180 is south, 270 is west, and 360 is north).
     destination_field {Field}:
         An integer field that will be used to obtain values for the
         destination locations.
     path_type {String}:
         Specifies a keyword defining the manner in which the values and zones
         on the input destination data will be interpreted in the cost path
         calculations.EACH_ZONE-For each zone on the input destination data, a
         least-cost
         path will be determined and saved on the output raster. With this
         option, the least-cost path for each zone begins at the cell with the
         lowest cost distance weighting in the zone.BEST_SINGLE-For all cells
         on the input destination data, the least-
         cost path will be derived from the cell with the minimum of the least-
         cost paths to source cells.EACH_CELL-For each cell with valid values
         on the input destination
         data, a least-cost path will be determined and saved on the output
         raster. With this option, each cell of the input destination data is
         treated separately, and a least-cost path is determined for each cell.
     create_network_paths {Boolean}:
         Specifies whether complete, and possibly overlapping, paths from the
         destinations to the sources are calculated or if nonoverlapping
         network paths are created.DESTINATIONS_TO_SOURCES-Complete paths from
         the destinations to the
         sources are calculated, which can be overlapping. This is the
         default.NETWORK_PATHS-Nonoverlapping network paths are calculated.

    OUTPUTS:
     out_polyline_features (Feature Class):
         The output feature class that is the optimal path or paths."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_destination_data,
        in_distance_accumulation_raster,
        in_back_direction_raster,
        out_polyline_features,
        destination_field,
        path_type,
        create_network_paths,
    ):
        result = arcpy.gp.OptimalPathAsLine_sa(
            in_destination_data,
            in_distance_accumulation_raster,
            in_back_direction_raster,
            out_polyline_features,
            destination_field,
            path_type,
            create_network_paths,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_destination_data,
        in_distance_accumulation_raster,
        in_back_direction_raster,
        out_polyline_features,
        destination_field,
        path_type,
        create_network_paths,
    )


OptimalPathAsLine.__esri_toolname__ = "OptimalPathAsLine_sa"
OptimalPathAsLine.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6", "::::7"]


def OptimalPathAsRaster(
    in_destination_data,
    in_distance_accumulation_raster,
    in_back_direction_raster,
    destination_field="#",
    path_type: Literal["EACH_CELL", "EACH_ZONE", "BEST_SINGLE", "#"] | None = "#",
) -> Raster:
    """OptimalPathAsRaster_sa(in_destination_data, in_distance_accumulation_raster, in_back_direction_raster, {destination_field}, {path_type})

       Calculates the optimal path from a source to a destination as a
       raster.

    INPUTS:
     in_destination_data (Composite Geodataset):
         An integer raster or feature (point, line, or polygon) that identifies
         locations from which the optimal path will be determined to the least
         costly source.If the input is a raster, it must consist of cells that
         have valid
         values for the destinations, and the remaining cells must be assigned
         NoData. Zero is a valid value.
     in_distance_accumulation_raster (Composite Geodataset):
         The distance accumulation raster that will be used to determine the
         optimal path from the sources to the destinations.The distance
         accumulation raster is usually created with the Distance
         Accumulation or Distance Allocation tool. Each cell in the distance
         accumulation raster represents the minimum accumulative cost distance
         over a surface from each cell to a set of source cells.
     in_back_direction_raster (Composite Geodataset):
         The back direction raster contains calculated directions in degrees.
         The direction identifies the next cell along the optimal path back to
         the least accumulative cost source while avoiding barriers.The range
         of values is from 0 degrees to 360 degrees, with 0 reserved
         for the source cells. Due east is 90, and the values increase
         clockwise (180 is south, 270 is west, and 360 is north).
     destination_field {Field}:
         The field that will be used to obtain values for the destination
         locations.
     path_type {String}:
         Specifies a keyword defining the manner in which the values and zones
         on the input destination data will be interpreted in the cost path
         calculations.EACH_ZONE-For each zone on the input destination data, a
         least-cost
         path will be determined and saved on the output raster. With this
         option, the least-cost path for each zone begins at the cell with the
         lowest cost distance weighting in the zone.BEST_SINGLE-For all cells
         on the input destination data, the least-
         cost path will be derived from the cell with the minimum of the least-
         cost paths to source cells.EACH_CELL-For each cell with valid values
         on the input destination
         data, a least-cost path will be determined and saved on the output
         raster. With this option, each cell of the input destination data is
         treated separately, and a least-cost path is determined for each cell.

    OUTPUTS:
     out_path_accumulation_raster (Raster Dataset):
         The output raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_destination_data, in_distance_accumulation_raster, in_back_direction_raster, destination_field, path_type
    ):
        out_path_accumulation_raster = "#"
        result = arcpy.gp.OptimalPathAsRaster_sa(
            in_destination_data,
            in_distance_accumulation_raster,
            in_back_direction_raster,
            out_path_accumulation_raster,
            destination_field,
            path_type,
        )
        return _wrapToolRaster("OptimalPathAsRaster_sa", str(result.getOutput(0)))

    return Wrapper(
        in_destination_data, in_distance_accumulation_raster, in_back_direction_raster, destination_field, path_type
    )


OptimalPathAsRaster.__esri_toolname__ = "OptimalPathAsRaster_sa"
OptimalPathAsRaster.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::5", "::::6"]


def OptimalRegionConnections(
    in_regions,
    out_feature_class,
    in_barrier_data="#",
    in_cost_raster="#",
    out_neighbor_paths="#",
    distance_method: Literal["PLANAR", "GEODESIC", "#"] | None = "#",
    connections_within_regions: Literal["GENERATE_CONNECTIONS", "NO_CONNECTIONS", "#"] | None = "#",
):
    """OptimalRegionConnections_sa(in_regions, out_feature_class, {in_barrier_data}, {in_cost_raster}, {out_neighbor_paths}, {distance_method}, {connections_within_regions})

       Calculates the optimal connectivity network between two or more input
       regions.

    INPUTS:
     in_regions (Composite Geodataset):
         The input regions to be connected by the optimal network.Regions can
         be defined by either a raster or a feature dataset.If the region input
         is a raster, the regions are defined by groups of
         contiguous (adjacent) cells of the same value. Each region must be
         uniquely numbered. The cells that are not part of any region must be
         NoData. The raster type must be integer, and the values can be either
         positive or negative.If the region input is a feature dataset, it can
         be polygons,
         polylines, or points. Polygon feature regions cannot be composed of
         multipart polygons.
     in_barrier_data {Composite Geodataset}:
         The dataset that defines the barriers.The barriers can be defined by
         an integer or a floating-point raster,
         or by a point, line, or polygon feature.
     in_cost_raster {Composite Geodataset}:
         A raster defining the impedance or cost to move planimetrically
         through each cell.The value at each cell location represents the cost-
         per-unit distance
         for moving through the cell. Each cell location value is multiplied by
         the cell resolution while also compensating for diagonal movement to
         obtain the total cost of passing through the cell.The values of the
         cost raster can be integer or floating point. Cost
         raster values that are negative or zero are invalid but will be
         treated as small positive cost values.
     distance_method {String}:
         Specifies whether the distance will be calculated using a planar (flat
         earth) or a geodesic (ellipsoid) method.PLANAR-The distance
         calculation will be performed on a projected flat
         plane using a 2D Cartesian coordinate system. This is the
         default.GEODESIC-The distance calculation will be performed on the
         ellipsoid.
         Regardless of input or output projection, the results will not change.
     connections_within_regions {String}:
         Specifies whether the paths will continue and connect within the input
         regions.GENERATE_CONNECTIONS-Paths will continue within the input
         regions to
         connect all paths that enter a region.NO_CONNECTIONS-Paths will stop
         at the edges of the input regions and
         will not continue or connect within them.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output polyline feature class of the optimal network of paths that
         connect each of the input regions.Each path (or line) is uniquely
         numbered and additional fields in the
         attribute table store specific information about the path. Those
         additional fields are the following:PATHID-The unique identifier for
         the pathPATHCOST-The total
         accumulative distance or cost for the pathREGION1-The first region the
         path connectsREGION2-The other region the path connectsThis
         information provides insight into the paths in the network.Since each
         path is represented by a unique line, there will be
         multiple lines in locations where paths travel the same route.
     out_neighbor_paths {Feature Class}:
         The output polyline feature class identifying all paths from each
         region to each of its closest or cost neighbors.Each path (or line) is
         uniquely numbered and additional fields in the
         attribute table store specific information about the path. Those
         additional fields are the following:PATHID-The unique identifier for
         the pathPATHCOST-The total
         accumulative distance or cost for the pathREGION1-The first region the
         path connectsREGION2-The other region the path connectsThis
         information provides insight into the paths in the network and is
         useful when deciding which paths should be removed if necessary.Since
         each path is represented by a unique line, there will be
         multiple lines in locations where paths travel the same route."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_regions,
        out_feature_class,
        in_barrier_data,
        in_cost_raster,
        out_neighbor_paths,
        distance_method,
        connections_within_regions,
    ):
        result = arcpy.gp.OptimalRegionConnections_sa(
            in_regions,
            out_feature_class,
            in_barrier_data,
            in_cost_raster,
            out_neighbor_paths,
            distance_method,
            connections_within_regions,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_regions,
        out_feature_class,
        in_barrier_data,
        in_cost_raster,
        out_neighbor_paths,
        distance_method,
        connections_within_regions,
    )


OptimalRegionConnections.__esri_toolname__ = "OptimalRegionConnections_sa"
OptimalRegionConnections.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6", "::::7"]


def Over(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """Over_sa(in_raster_or_constant1, in_raster_or_constant2)

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


Over.__esri_toolname__ = "Over_sa"
Over.__esri_toolinfo__ = ["::::1", "::::2"]


def ParticleTrack(
    in_direction_raster,
    in_magnitude_raster,
    source_point,
    out_track_file,
    step_length="#",
    tracking_time="#",
    out_track_polyline_features="#",
):
    """ParticleTrack_sa(in_direction_raster, in_magnitude_raster, source_point, out_track_file, {step_length}, {tracking_time}, {out_track_polyline_features})

       Calculates the path of a particle through a velocity field, returning
       an ASCII file of particle tracking data and, optionally, a feature
       class of track information.

    INPUTS:
     in_direction_raster (Composite Geodataset):
         An input raster where each cell value represents the direction of the
         seepage velocity vector (average linear velocity) at the center of the
         cell.Directions are expressed in compass coordinates, in degrees
         clockwise
         from north. This can be created by the Darcy Flow tool.Direction
         values must be floating point.
     in_magnitude_raster (Composite Geodataset):
         An input raster where each cell value represents the magnitude of the
         seepage velocity vector (average linear velocity) at the center of the
         cell.Units are length/time. This can be created by the Darcy Flow
         tool.
     source_point (Point):
         A Python Point class object denotes the location of the source point,
         in map units, from which to begin the particle tracking.The form of
         the object is:point(x,y)
     step_length {Double}:
         The step length to be used for calculating the particle track.The
         default is one-half the cell size. Units are length.
     tracking_time {Double}:
         Maximum elapsed time for particle tracking.The algorithm will follow
         the track until either this time is met or
         the particle migrates off the raster or into a depression.The default
         value is infinity. Units are time.

    OUTPUTS:
     out_track_file (File):
         The output ASCII text file that contains the particle tracking data.
     out_track_polyline_features {Feature Class}:
         The optional output line feature class containing the particle
         track.This feature class contains a series of arcs with attributes for
         position, local velocity direction and magnitude, and cumulative
         length and time of travel along the path."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_direction_raster,
        in_magnitude_raster,
        source_point,
        out_track_file,
        step_length,
        tracking_time,
        out_track_polyline_features,
    ):
        source_point = Utils.compoundParameterToString(source_point, arcpy.Point)
        result = arcpy.gp.ParticleTrack_sa(
            in_direction_raster,
            in_magnitude_raster,
            source_point,
            out_track_file,
            step_length,
            tracking_time,
            out_track_polyline_features,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_direction_raster,
        in_magnitude_raster,
        source_point,
        out_track_file,
        step_length,
        tracking_time,
        out_track_polyline_features,
    )


ParticleTrack.__esri_toolname__ = "ParticleTrack_sa"
ParticleTrack.__esri_toolinfo__ = ["::::1", "::::2", "Python::Point::", "::::4", "::::5", "::::6", "::::7"]


def PathAllocation(
    in_source_data,
    in_cost_raster="#",
    in_surface_raster="#",
    in_horizontal_raster="#",
    horizontal_factor="#",
    in_vertical_raster="#",
    vertical_factor="#",
    maximum_distance="#",
    in_value_raster="#",
    source_field="#",
    out_distance_raster="#",
    out_backlink_raster="#",
    source_cost_multiplier="#",
    source_start_cost="#",
    source_resistance_rate="#",
    source_capacity="#",
    source_direction="#",
) -> Raster:
    """PathAllocation_sa(in_source_data, {in_cost_raster}, {in_surface_raster}, {in_horizontal_raster}, {horizontal_factor}, {in_vertical_raster}, {vertical_factor}, {maximum_distance}, {in_value_raster}, {source_field}, {out_distance_raster}, {out_backlink_raster}, {source_cost_multiplier}, {source_start_cost}, {source_resistance_rate}, {source_capacity}, {source_direction})

       Calculates the least-cost source for each cell based on the least
       accumulative cost over a cost surface, while accounting for surface
       distance along with horizontal and vertical cost factors.

    INPUTS:
     in_source_data (Composite Geodataset):
         The input source locations.This is a raster or feature (point, line,
         or polygon) identifying the
         cells or locations that will be used to calculate the least
         accumulated cost distance for each output cell location.For rasters,
         the input type can be integer or floating point.If the input source
         raster is floating point, the in_value_raster
         parameter must be set, and it must integer. The value raster will take
         precedence over the source_field parameter setting.
     in_cost_raster {Composite Geodataset}:
         A raster defining the impedance or cost to move planimetrically
         through each cell.The value at each cell location represents the cost-
         per-unit distance
         for moving through the cell. Each cell location value is multiplied by
         the cell resolution while also compensating for diagonal movement to
         obtain the total cost of passing through the cell.The values of the
         cost raster can be integer or floating point, but
         they cannot be negative or zero (you cannot have a negative or zero
         cost).
     in_surface_raster {Composite Geodataset}:
         A raster defining the elevation values at each cell location.The
         values are used to calculate the actual surface distance covered
         when passing between cells.
     in_horizontal_raster {Composite Geodataset}:
         A raster defining the horizontal direction at each cell.The values on
         the raster must be integers ranging from 0 to 360, with
         0 degrees being north, or toward the top of the screen, and increasing
         clockwise. Flat areas should be given a value of -1. The values at
         each location will be used in conjunction with the horizontal_factor
         parameter to determine the horizontal cost incurred when moving from a
         cell to its neighbors.
     horizontal_factor {Horizontal Factor}:
         The Horizontal Factor object defines the relationship between the
         horizontal cost factor and the horizontal relative moving angle.There
         are several factors with modifiers that identify a defined
         horizontal factor graph. Additionally, a table can be used to create a
         custom graph. The graphs are used to identify the horizontal factor
         used in calculating the total cost of moving into a neighboring
         cell.In the descriptions below, two acronyms are used: HF stands for
         horizontal factor, which defines the horizontal difficulty encountered
         when moving from one cell to the next; HRMA stands for horizontal
         relative moving angle, which identifies the angle between the
         horizontal direction from a cell and the moving direction. The
         object comes in the following forms:        HfBinary,
         HfForward, HfLinear, HfInverseLinear, and HfTable. The
         definitions and parameters of these are the following:
         HfBinary({zeroFactor}, {cutAngle})          If the HRMA is
         less than the cut angle, the HF is set to the value
         associated with the zero factor; otherwise, it is infinity.
         HfForward({zeroFactor}, {sideValue})          Only forward
         movement is allowed. The HRMA must be greater than or
         equal to 0 and less than 90 degrees (0 <= HRMA < 90). If the HRMA is
         greater than 0 and less than 45 degrees, the HF for the cell is set to
         the value associated with the zero factor. If the HRMA is greater than
         or equal to 45 degrees, the side value modifier value is used. The HF
         for any HRMA equal to or greater than 90 degrees is set to infinity.
         HfLinear({zeroFactor}, {cutAngle}, {slope})          The HF
         is a linear function of the HRMA.
         HfInverseLinear({zeroFactor}, {cutAngle}, {slope})
         The HF is an inverse linear function of the HRMA.
         HfTable(inTable)          A table file will be used to
         define the horizontal factor graph used
         to determine the HFs. The modifiers to the horizontal keywords
         are the following:
         zeroFactor-The horizontal factor to be used when the HRMA is 0. This
         factor positions the y-intercept for any of the horizontal factor
         functions.cutAngle-The HRMA angle beyond which the HF will be set to
         infinity.slope-The slope of the straight line used with the HfLinear
         and
         HfInverseLinear horizontal factor keywords. The slope is specified as
         a fraction of rise over run (for example, 45 percent slope is 1/45,
         which is input as 0.02222).sideValue-The HF when the HRMA is greater
         than or equal to 45 degrees
         and less than 90 degrees when the HfForward horizontal factor keyword
         is specified.inTable-The name of the table defining the HF.
     in_vertical_raster {Composite Geodataset}:
         A raster defining the z-values for each cell location.The values are
         used for calculating the slope used to identify the
         vertical factor incurred when moving from one cell to another.
     vertical_factor {Vertical Factor}:
         The Vertical factor object defines the relationship between the
         vertical cost factor and the vertical relative moving angle
         (VRMA).There are several factors with modifiers that identify a
         defined
         vertical factor graph. Additionally, a table can be used to create a
         custom graph. The graphs are used to identify the vertical factor used
         in calculating the total cost for moving into a neighboring cell.In
         the descriptions below, two acronyms are used: VF stands for
         vertical factor, which defines the vertical difficulty encountered in
         moving from one cell to the next; VRMA stands for vertical relative
         moving angle, which identifies the slope angle between the FROM or
         processing cell and the TO cell. The object comes in the
         following forms:        VfBinary,
         VfLinear, VfInverseLinear, VfSymLinear, VfSymInverseLinear,
         VfCos, VfSec, VfSec, VfCosSec, VfSecCos, VfHikingTime,
         VfBidirHikingTime, VfTable.The definitions and parameters of these are
         the following:         VfBinary({zeroFactor}, {lowCutAngle},
         {highCutAngle})
         If the VRMA is greater than the low-cut angle and less than the high-
         cut angle, the VF is set to the value associated with the zero factor;
         otherwise, it is infinity. VfLinear({zeroFactor},
         {lowCutAngle}, {highCutAngle},
         {slope})         The VF is a linear function of the VRMA.
         VfInverseLinear({zeroFactor}, {lowCutAngle}, {highCutAngle},
         {slope})         The VF is an inverse linear function of the VRMA.
         VfSymLinear({zeroFactor}, {lowCutAngle}, {highCutAngle},
         {slope})         The VF is a linear function of the VRMA in either the
         negative or
         positive side of the VRMA, and the two linear functions are
         symmetrical with respect to the VF (y) axis.
         VfSymInverseLinear({zeroFactor}, {lowCutAngle},
         {highCutAngle}, {slope})         The VF is an inverse linear function
         of the VRMA in either the
         negative or positive side of the VRMA, and the two linear functions
         are symmetrical with respect to the VF (y) axis.
         VfCos({lowCutAngle}, {highCutAngle}, {cosPower})         The
         VF is the cosine-based function of the VRMA.
         VfSec({lowCutAngle}, {highCutAngle}, {secPower})         The
         VF is the secant-based function of the VRMA.
         VfCosSec({lowCutAngle}, {highCutAngle}, {cosPower},
         {secPower})         The VF is the cosine-based function of the VRMA
         when the VRMA is
         negative and is the secant-based function of the VRMA when the VRMA is
         not negative. VfSecCos({lowCutAngle}, {highCutAngle},
         {secPower},
         {cos_power})         The VF is the secant-based function of the VRMA
         when the VRMA is
         negative and is the cosine-based function of the VRMA when the VRMA is
         not negative. VfHikingTime({lowCutAngle}, {highCutAngle})
         The VF is
         the hiking time function of the VRMA.
         VfBidirHikingTime({lowCutAngle}, {highCutAngle})         The
         VF is a bidirectional modified hiking time function of the VRMA.
         VfTable(inTable)         A table file will be used to define
         the vertical factor graph used to
         determine the VFs.The modifiers to the vertical parameters are the
         following:zeroFactor-The vertical factor used when the VRMA is zero.
         This factor
         positions the y-intercept of the specified function. By definition,
         the zero factor is not applicable to any of the trigonometric vertical
         functions (Cos, Sec, Cos-Sec, or Sec-Cos). The y-intercept is defined
         by these functions.lowCutAngle-The VRMA angle below which the VF will
         be set to infinity.highCutAngle-The VRMA angle above which the VF will
         be set to
         infinity.slope-The slope of the straight line used with the VfLinear
         and
         VfInverseLinear parameters. The slope is specified as a fraction of
         rise over run (for example, 45 percent slope is 1/45, which is input
         as 0.02222).inTable-The name of the table defining the VF.
     maximum_distance {Double}:
         The threshold that the accumulative cost values cannot exceed.If an
         accumulative cost distance value exceeds this value, the output
         value for the cell location will be NoData. The maximum distance is
         the extent for which the accumulative cost distances are
         calculated.The default distance is to the edge of the output raster.
     in_value_raster {Composite Geodataset}:
         The input integer raster that identifies the zone values that will be
         used for each input source location.For each source location (cell or
         feature), this value will be
         assigned to all cells allocated to the source location for the
         computation. The value raster will take precedence over the
         source_field parameter setting.
     source_field {Field}:
         The field used to assign values to the source locations. It must be of
         integer type.If the in_value_raster parameter has been set, the values
         in that
         input will have precedence over this parameter setting.
     source_cost_multiplier {Double / Field}:
         The multiplier that will be applied to the cost values.This allows for
         control of the mode of travel or the magnitude at a
         source. The greater the multiplier, the greater the cost to move
         through each cell.The values must be greater than zero. The default is
         1.
     source_start_cost {Double / Field}:
         The starting cost that will be used to begin the cost
         calculations.Allows for the specification of the fixed cost associated
         with a
         source. Instead of starting at a cost of zero, the cost algorithm will
         begin with this value.The values must be zero or greater. The default
         is 0.
     source_resistance_rate {Double / Field}:
         This parameter simulates the increase in the effort to overcome costs
         as the accumulative cost increases. It is used to model fatigue of the
         traveler. The growing accumulative cost to reach a cell is multiplied
         by the resistance rate and added to the cost to move into the
         subsequent cell.It is a modified version of a compound interest rate
         formula that is
         used to calculate the apparent cost of moving through a cell. As the
         value of the resistance rate increases, it increases the cost of the
         cells that are visited later. The greater the resistance rate, the
         more additional cost is added to reach the next cell, which is
         compounded for each subsequent movement. Since the resistance rate is
         similar to a compound rate and generally the accumulative cost values
         are very large, small resistance rates are suggested, such as 0.02,
         0.005, or even smaller, depending on the accumulative cost values.The
         values must be zero or greater. The default is 0.
     source_capacity {Double / Field}:
         The cost capacity for the traveler for a source.The cost calculations
         continue for each source until the specified
         capacity is reached.The values must be greater than zero. The default
         capacity is to the
         edge of the output raster.
     source_direction {String / Field}:
         Specifies the direction of the traveler when applying horizontal and
         vertical factors and the source resistance rate.FROM_SOURCE-The
         horizontal factor, vertical factor, and source
         resistance rate will be applied beginning at the input source and
         travel out to the nonsource cells. This is the default.TO_SOURCE-The
         horizontal factor, vertical factor, and source
         resistance rate will be applied beginning at each nonsource cell and
         travel back to the input source.Specify the FROM_SOURCE or TO_SOURCE
         keyword, which will be applied to
         all sources, or specify a field in the source data that contains the
         keywords to identify the direction of travel for each source. That
         field must contain the string FROM_SOURCE or TO_SOURCE.

    OUTPUTS:
     out_allocation_raster (Raster Dataset):
         The output path distance allocation raster.This raster identifies the
         zone of each source location (cell or
         feature) that could be reached with the least accumulative cost, while
         accounting for surface distance and horizontal and vertical cost
         factors.The output raster is of integer type.
     out_distance_raster {Raster Dataset}:
         The output path distance raster.The output path distance raster
         identifies, for each cell, the least
         accumulative cost distance, over a cost surface to the identified
         source locations, while accounting for surface distance as well as
         horizontal and vertical surface factors.A source can be a cell, a set
         of cells, or one or more feature
         locations.The output raster is of floating-point type.
     out_backlink_raster {Raster Dataset}:
         The output cost backlink raster.The backlink raster contains values 0
         through 8, which define the
         direction or identify the next neighboring cell (the succeeding cell)
         along the least accumulative cost path from a cell to reach its least-
         cost source, while accounting for surface distance as well as
         horizontal and vertical surface factors.If the path is to pass into
         the right neighbor, the cell will be
         assigned the value 1, 2 for the lower right diagonal cell, and
         continue clockwise. The value 0 is reserved for source cells."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_source_data,
        in_cost_raster,
        in_surface_raster,
        in_horizontal_raster,
        horizontal_factor,
        in_vertical_raster,
        vertical_factor,
        maximum_distance,
        in_value_raster,
        source_field,
        out_distance_raster,
        out_backlink_raster,
        source_cost_multiplier,
        source_start_cost,
        source_resistance_rate,
        source_capacity,
        source_direction,
    ):
        horizontal_factor = Utils.compoundParameterToString(horizontal_factor, ParameterClasses._HorizontalFactor)
        vertical_factor = Utils.compoundParameterToString(vertical_factor, ParameterClasses._VerticalFactor)
        out_allocation_raster = "#"
        result = arcpy.gp.PathAllocation_sa(
            in_source_data,
            out_allocation_raster,
            in_cost_raster,
            in_surface_raster,
            in_horizontal_raster,
            horizontal_factor,
            in_vertical_raster,
            vertical_factor,
            maximum_distance,
            in_value_raster,
            source_field,
            out_distance_raster,
            out_backlink_raster,
            source_cost_multiplier,
            source_start_cost,
            source_resistance_rate,
            source_capacity,
            source_direction,
        )
        return _wrapToolRaster("PathAllocation_sa", str(result.getOutput(0)))

    return Wrapper(
        in_source_data,
        in_cost_raster,
        in_surface_raster,
        in_horizontal_raster,
        horizontal_factor,
        in_vertical_raster,
        vertical_factor,
        maximum_distance,
        in_value_raster,
        source_field,
        out_distance_raster,
        out_backlink_raster,
        source_cost_multiplier,
        source_start_cost,
        source_resistance_rate,
        source_capacity,
        source_direction,
    )


PathAllocation.__esri_toolname__ = "PathAllocation_sa"
PathAllocation.__esri_toolinfo__ = [
    "::::1",
    "::::3",
    "::::4",
    "::::5",
    "Python::HfBinary|HfForward|HfInverseLinear|HfLinear|HfTable::",
    "::::7",
    "Python::VfBidirHikingTime|VfBinary|VfCos|VfCosSec|VfHikingTime|VfInverseLinear|VfLinear|VfSec|VfSecCos|VfSymInverseLinear|VfSymLinear|VfTable::",
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


def PathBackLink(
    in_source_data,
    in_cost_raster="#",
    in_surface_raster="#",
    in_horizontal_raster="#",
    horizontal_factor="#",
    in_vertical_raster="#",
    vertical_factor="#",
    maximum_distance="#",
    out_distance_raster="#",
    source_cost_multiplier="#",
    source_start_cost="#",
    source_resistance_rate="#",
    source_capacity="#",
    source_direction="#",
) -> Raster:
    """PathBackLink_sa(in_source_data, {in_cost_raster}, {in_surface_raster}, {in_horizontal_raster}, {horizontal_factor}, {in_vertical_raster}, {vertical_factor}, {maximum_distance}, {out_distance_raster}, {source_cost_multiplier}, {source_start_cost}, {source_resistance_rate}, {source_capacity}, {source_direction})

       Defines the neighbor that is the next cell on the least accumulative
       cost path to the least-cost source, while accounting for surface
       distance along with horizontal and vertical cost factors.

    INPUTS:
     in_source_data (Composite Geodataset):
         The input source locations.This is a raster or feature (point, line,
         or polygon) identifying the
         cells or locations that will be used to calculate the least
         accumulated cost distance for each output cell location.For rasters,
         the input type can be integer or floating point.
     in_cost_raster {Composite Geodataset}:
         A raster defining the impedance or cost to move planimetrically
         through each cell.The value at each cell location represents the cost-
         per-unit distance
         for moving through the cell. Each cell location value is multiplied by
         the cell resolution while also compensating for diagonal movement to
         obtain the total cost of passing through the cell.The values of the
         cost raster can be integer or floating point, but
         they cannot be negative or zero (you cannot have a negative or zero
         cost).
     in_surface_raster {Composite Geodataset}:
         A raster defining the elevation values at each cell location.The
         values are used to calculate the actual surface distance covered
         when passing between cells.
     in_horizontal_raster {Composite Geodataset}:
         A raster defining the horizontal direction at each cell.The values on
         the raster must be integers ranging from 0 to 360, with
         0 degrees being north, or toward the top of the screen, and increasing
         clockwise. Flat areas should be given a value of -1. The values at
         each location will be used in conjunction with the horizontal_factor
         parameter to determine the horizontal cost incurred when moving from a
         cell to its neighbors.
     horizontal_factor {Horizontal Factor}:
         The Horizontal Factor object defines the relationship between the
         horizontal cost factor and the horizontal relative moving angle.There
         are several factors with modifiers that identify a defined
         horizontal factor graph. Additionally, a table can be used to create a
         custom graph. The graphs are used to identify the horizontal factor
         used in calculating the total cost of moving into a neighboring
         cell.In the descriptions below, two acronyms are used: HF stands for
         horizontal factor, which defines the horizontal difficulty encountered
         when moving from one cell to the next; HRMA stands for horizontal
         relative moving angle, which identifies the angle between the
         horizontal direction from a cell and the moving direction. The
         object comes in the following forms:        HfBinary,
         HfForward, HfLinear, HfInverseLinear, and HfTable. The
         definitions and parameters of these are the following:
         HfBinary({zeroFactor}, {cutAngle})          If the HRMA is
         less than the cut angle, the HF is set to the value
         associated with the zero factor; otherwise, it is infinity.
         HfForward({zeroFactor}, {sideValue})          Only forward
         movement is allowed. The HRMA must be greater than or
         equal to 0 and less than 90 degrees (0 <= HRMA < 90). If the HRMA is
         greater than 0 and less than 45 degrees, the HF for the cell is set to
         the value associated with the zero factor. If the HRMA is greater than
         or equal to 45 degrees, the side value modifier value is used. The HF
         for any HRMA equal to or greater than 90 degrees is set to infinity.
         HfLinear({zeroFactor}, {cutAngle}, {slope})          The HF
         is a linear function of the HRMA.
         HfInverseLinear({zeroFactor}, {cutAngle}, {slope})
         The HF is an inverse linear function of the HRMA.
         HfTable(inTable)          A table file will be used to
         define the horizontal factor graph used
         to determine the HFs. The modifiers to the horizontal keywords
         are the following:
         zeroFactor-The horizontal factor to be used when the HRMA is 0. This
         factor positions the y-intercept for any of the horizontal factor
         functions.cutAngle-The HRMA angle beyond which the HF will be set to
         infinity.slope-The slope of the straight line used with the HfLinear
         and
         HfInverseLinear horizontal factor keywords. The slope is specified as
         a fraction of rise over run (for example, 45 percent slope is 1/45,
         which is input as 0.02222).sideValue-The HF when the HRMA is greater
         than or equal to 45 degrees
         and less than 90 degrees when the HfForward horizontal factor keyword
         is specified.inTable-The name of the table defining the HF.
     in_vertical_raster {Composite Geodataset}:
         A raster defining the z-values for each cell location.The values are
         used for calculating the slope used to identify the
         vertical factor incurred when moving from one cell to another.
     vertical_factor {Vertical Factor}:
         The Vertical factor object defines the relationship between the
         vertical cost factor and the vertical relative moving angle
         (VRMA).There are several factors with modifiers that identify a
         defined
         vertical factor graph. Additionally, a table can be used to create a
         custom graph. The graphs are used to identify the vertical factor used
         in calculating the total cost for moving into a neighboring cell.In
         the descriptions below, two acronyms are used: VF stands for
         vertical factor, which defines the vertical difficulty encountered in
         moving from one cell to the next; VRMA stands for vertical relative
         moving angle, which identifies the slope angle between the FROM or
         processing cell and the TO cell. The object comes in the
         following forms:        VfBinary,
         VfLinear, VfInverseLinear, VfSymLinear, VfSymInverseLinear,
         VfCos, VfSec, VfSec, VfCosSec, VfSecCos, VfHikingTime,
         VfBidirHikingTime, VfTable.The definitions and parameters of these are
         the following:         VfBinary({zeroFactor}, {lowCutAngle},
         {highCutAngle})
         If the VRMA is greater than the low-cut angle and less than the high-
         cut angle, the VF is set to the value associated with the zero factor;
         otherwise, it is infinity. VfLinear({zeroFactor},
         {lowCutAngle}, {highCutAngle},
         {slope})         The VF is a linear function of the VRMA.
         VfInverseLinear({zeroFactor}, {lowCutAngle}, {highCutAngle},
         {slope})         The VF is an inverse linear function of the VRMA.
         VfSymLinear({zeroFactor}, {lowCutAngle}, {highCutAngle},
         {slope})         The VF is a linear function of the VRMA in either the
         negative or
         positive side of the VRMA, and the two linear functions are
         symmetrical with respect to the VF (y) axis.
         VfSymInverseLinear({zeroFactor}, {lowCutAngle},
         {highCutAngle}, {slope})         The VF is an inverse linear function
         of the VRMA in either the
         negative or positive side of the VRMA, and the two linear functions
         are symmetrical with respect to the VF (y) axis.
         VfCos({lowCutAngle}, {highCutAngle}, {cosPower})         The
         VF is the cosine-based function of the VRMA.
         VfSec({lowCutAngle}, {highCutAngle}, {secPower})         The
         VF is the secant-based function of the VRMA.
         VfCosSec({lowCutAngle}, {highCutAngle}, {cosPower},
         {secPower})         The VF is the cosine-based function of the VRMA
         when the VRMA is
         negative and is the secant-based function of the VRMA when the VRMA is
         not negative. VfSecCos({lowCutAngle}, {highCutAngle},
         {secPower},
         {cos_power})         The VF is the secant-based function of the VRMA
         when the VRMA is
         negative and is the cosine-based function of the VRMA when the VRMA is
         not negative. VfHikingTime({lowCutAngle}, {highCutAngle})
         The VF is
         the hiking time function of the VRMA.
         VfBidirHikingTime({lowCutAngle}, {highCutAngle})         The
         VF is a bidirectional modified hiking time function of the VRMA.
         VfTable(inTable)         A table file will be used to define
         the vertical factor graph used to
         determine the VFs.The modifiers to the vertical parameters are the
         following:zeroFactor-The vertical factor used when the VRMA is zero.
         This factor
         positions the y-intercept of the specified function. By definition,
         the zero factor is not applicable to any of the trigonometric vertical
         functions (Cos, Sec, Cos-Sec, or Sec-Cos). The y-intercept is defined
         by these functions.lowCutAngle-The VRMA angle below which the VF will
         be set to infinity.highCutAngle-The VRMA angle above which the VF will
         be set to
         infinity.slope-The slope of the straight line used with the VfLinear
         and
         VfInverseLinear parameters. The slope is specified as a fraction of
         rise over run (for example, 45 percent slope is 1/45, which is input
         as 0.02222).inTable-The name of the table defining the VF.
     maximum_distance {Double}:
         The threshold that the accumulative cost values cannot exceed.If an
         accumulative cost distance value exceeds this value, the output
         value for the cell location will be NoData. The maximum distance is
         the extent for which the accumulative cost distances are
         calculated.The default distance is to the edge of the output raster.
     source_cost_multiplier {Double / Field}:
         The multiplier that will be applied to the cost values.This allows for
         control of the mode of travel or the magnitude at a
         source. The greater the multiplier, the greater the cost to move
         through each cell.The values must be greater than zero. The default is
         1.
     source_start_cost {Double / Field}:
         The starting cost that will be used to begin the cost
         calculations.Allows for the specification of the fixed cost associated
         with a
         source. Instead of starting at a cost of zero, the cost algorithm will
         begin with this value.The values must be zero or greater. The default
         is 0.
     source_resistance_rate {Double / Field}:
         This parameter simulates the increase in the effort to overcome costs
         as the accumulative cost increases. It is used to model fatigue of the
         traveler. The growing accumulative cost to reach a cell is multiplied
         by the resistance rate and added to the cost to move into the
         subsequent cell.It is a modified version of a compound interest rate
         formula that is
         used to calculate the apparent cost of moving through a cell. As the
         value of the resistance rate increases, it increases the cost of the
         cells that are visited later. The greater the resistance rate, the
         more additional cost is added to reach the next cell, which is
         compounded for each subsequent movement. Since the resistance rate is
         similar to a compound rate and generally the accumulative cost values
         are very large, small resistance rates are suggested, such as 0.02,
         0.005, or even smaller, depending on the accumulative cost values.The
         values must be zero or greater. The default is 0.
     source_capacity {Double / Field}:
         The cost capacity for the traveler for a source.The cost calculations
         continue for each source until the specified
         capacity is reached.The values must be greater than zero. The default
         capacity is to the
         edge of the output raster.
     source_direction {String / Field}:
         Specifies the direction of the traveler when applying horizontal and
         vertical factors and the source resistance rate.FROM_SOURCE-The
         horizontal factor, vertical factor, and source
         resistance rate will be applied beginning at the input source and
         travel out to the nonsource cells. This is the default.TO_SOURCE-The
         horizontal factor, vertical factor, and source
         resistance rate will be applied beginning at each nonsource cell and
         travel back to the input source.Specify the FROM_SOURCE or TO_SOURCE
         keyword, which will be applied to
         all sources, or specify a field in the source data that contains the
         keywords to identify the direction of travel for each source. That
         field must contain the string FROM_SOURCE or TO_SOURCE.

    OUTPUTS:
     out_backlink_raster (Raster Dataset):
         The output cost backlink raster.The backlink raster contains values 0
         through 8, which define the
         direction or identify the next neighboring cell (the succeeding cell)
         along the least accumulative cost path from a cell to reach its least-
         cost source, while accounting for surface distance as well as
         horizontal and vertical surface factors.If the path is to pass into
         the right neighbor, the cell will be
         assigned the value 1, 2 for the lower right diagonal cell, and
         continue clockwise. The value 0 is reserved for source cells.
     out_distance_raster {Raster Dataset}:
         The output path distance raster.The output path distance raster
         identifies, for each cell, the least
         accumulative cost distance, over a cost surface to the identified
         source locations, while accounting for surface distance as well as
         horizontal and vertical surface factors.A source can be a cell, a set
         of cells, or one or more feature
         locations.The output raster is of floating-point type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_source_data,
        in_cost_raster,
        in_surface_raster,
        in_horizontal_raster,
        horizontal_factor,
        in_vertical_raster,
        vertical_factor,
        maximum_distance,
        out_distance_raster,
        source_cost_multiplier,
        source_start_cost,
        source_resistance_rate,
        source_capacity,
        source_direction,
    ):
        horizontal_factor = Utils.compoundParameterToString(horizontal_factor, ParameterClasses._HorizontalFactor)
        vertical_factor = Utils.compoundParameterToString(vertical_factor, ParameterClasses._VerticalFactor)
        out_backlink_raster = "#"
        result = arcpy.gp.PathBackLink_sa(
            in_source_data,
            out_backlink_raster,
            in_cost_raster,
            in_surface_raster,
            in_horizontal_raster,
            horizontal_factor,
            in_vertical_raster,
            vertical_factor,
            maximum_distance,
            out_distance_raster,
            source_cost_multiplier,
            source_start_cost,
            source_resistance_rate,
            source_capacity,
            source_direction,
        )
        return _wrapToolRaster("PathBackLink_sa", str(result.getOutput(0)))

    return Wrapper(
        in_source_data,
        in_cost_raster,
        in_surface_raster,
        in_horizontal_raster,
        horizontal_factor,
        in_vertical_raster,
        vertical_factor,
        maximum_distance,
        out_distance_raster,
        source_cost_multiplier,
        source_start_cost,
        source_resistance_rate,
        source_capacity,
        source_direction,
    )


PathBackLink.__esri_toolname__ = "PathBackLink_sa"
PathBackLink.__esri_toolinfo__ = [
    "::::1",
    "::::3",
    "::::4",
    "::::5",
    "Python::HfBinary|HfForward|HfInverseLinear|HfLinear|HfTable::",
    "::::7",
    "Python::VfBidirHikingTime|VfBinary|VfCos|VfCosSec|VfHikingTime|VfInverseLinear|VfLinear|VfSec|VfSecCos|VfSymInverseLinear|VfSymLinear|VfTable::",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
    "::::13",
    "::::14",
    "::::15",
]


def PathDistance(
    in_source_data,
    in_cost_raster="#",
    in_surface_raster="#",
    in_horizontal_raster="#",
    horizontal_factor="#",
    in_vertical_raster="#",
    vertical_factor="#",
    maximum_distance="#",
    out_backlink_raster="#",
    source_cost_multiplier="#",
    source_start_cost="#",
    source_resistance_rate="#",
    source_capacity="#",
    source_direction="#",
) -> Raster:
    """PathDistance_sa(in_source_data, {in_cost_raster}, {in_surface_raster}, {in_horizontal_raster}, {horizontal_factor}, {in_vertical_raster}, {vertical_factor}, {maximum_distance}, {out_backlink_raster}, {source_cost_multiplier}, {source_start_cost}, {source_resistance_rate}, {source_capacity}, {source_direction})

       Calculates, for each cell, the least accumulative cost distance from
       or to the least-cost source, while accounting for surface distance
       along with horizontal and vertical cost factors.

    INPUTS:
     in_source_data (Composite Geodataset):
         The input source locations.This is a raster or feature (point, line,
         or polygon) identifying the
         cells or locations that will be used to calculate the least
         accumulated cost distance for each output cell location.For rasters,
         the input type can be integer or floating point.
     in_cost_raster {Composite Geodataset}:
         A raster defining the impedance or cost to move planimetrically
         through each cell.The value at each cell location represents the cost-
         per-unit distance
         for moving through the cell. Each cell location value is multiplied by
         the cell resolution while also compensating for diagonal movement to
         obtain the total cost of passing through the cell.The values of the
         cost raster can be integer or floating point, but
         they cannot be negative or zero (you cannot have a negative or zero
         cost).
     in_surface_raster {Composite Geodataset}:
         A raster defining the elevation values at each cell location.The
         values are used to calculate the actual surface distance covered
         when passing between cells.
     in_horizontal_raster {Composite Geodataset}:
         A raster defining the horizontal direction at each cell.The values on
         the raster must be integers ranging from 0 to 360, with
         0 degrees being north, or toward the top of the screen, and increasing
         clockwise. Flat areas should be given a value of -1. The values at
         each location will be used in conjunction with the horizontal_factor
         parameter to determine the horizontal cost incurred when moving from a
         cell to its neighbors.
     horizontal_factor {Horizontal Factor}:
         The Horizontal Factor object defines the relationship between the
         horizontal cost factor and the horizontal relative moving angle.There
         are several factors with modifiers that identify a defined
         horizontal factor graph. Additionally, a table can be used to create a
         custom graph. The graphs are used to identify the horizontal factor
         used in calculating the total cost of moving into a neighboring
         cell.In the descriptions below, two acronyms are used: HF stands for
         horizontal factor, which defines the horizontal difficulty encountered
         when moving from one cell to the next; HRMA stands for horizontal
         relative moving angle, which identifies the angle between the
         horizontal direction from a cell and the moving direction. The
         object comes in the following forms:        HfBinary,
         HfForward, HfLinear, HfInverseLinear, and HfTable. The
         definitions and parameters of these are the following:
         HfBinary({zeroFactor}, {cutAngle})          If the HRMA is
         less than the cut angle, the HF is set to the value
         associated with the zero factor; otherwise, it is infinity.
         HfForward({zeroFactor}, {sideValue})          Only forward
         movement is allowed. The HRMA must be greater than or
         equal to 0 and less than 90 degrees (0 <= HRMA < 90). If the HRMA is
         greater than 0 and less than 45 degrees, the HF for the cell is set to
         the value associated with the zero factor. If the HRMA is greater than
         or equal to 45 degrees, the side value modifier value is used. The HF
         for any HRMA equal to or greater than 90 degrees is set to infinity.
         HfLinear({zeroFactor}, {cutAngle}, {slope})          The HF
         is a linear function of the HRMA.
         HfInverseLinear({zeroFactor}, {cutAngle}, {slope})
         The HF is an inverse linear function of the HRMA.
         HfTable(inTable)          A table file will be used to
         define the horizontal factor graph used
         to determine the HFs. The modifiers to the horizontal keywords
         are the following:
         zeroFactor-The horizontal factor to be used when the HRMA is 0. This
         factor positions the y-intercept for any of the horizontal factor
         functions.cutAngle-The HRMA angle beyond which the HF will be set to
         infinity.slope-The slope of the straight line used with the HfLinear
         and
         HfInverseLinear horizontal factor keywords. The slope is specified as
         a fraction of rise over run (for example, 45 percent slope is 1/45,
         which is input as 0.02222).sideValue-The HF when the HRMA is greater
         than or equal to 45 degrees
         and less than 90 degrees when the HfForward horizontal factor keyword
         is specified.inTable-The name of the table defining the HF.
     in_vertical_raster {Composite Geodataset}:
         A raster defining the z-values for each cell location.The values are
         used for calculating the slope used to identify the
         vertical factor incurred when moving from one cell to another.
     vertical_factor {Vertical Factor}:
         The Vertical factor object defines the relationship between the
         vertical cost factor and the vertical relative moving angle
         (VRMA).There are several factors with modifiers that identify a
         defined
         vertical factor graph. Additionally, a table can be used to create a
         custom graph. The graphs are used to identify the vertical factor used
         in calculating the total cost for moving into a neighboring cell.In
         the descriptions below, two acronyms are used: VF stands for
         vertical factor, which defines the vertical difficulty encountered in
         moving from one cell to the next; VRMA stands for vertical relative
         moving angle, which identifies the slope angle between the FROM or
         processing cell and the TO cell. The object comes in the
         following forms:        VfBinary,
         VfLinear, VfInverseLinear, VfSymLinear, VfSymInverseLinear,
         VfCos, VfSec, VfSec, VfCosSec, VfSecCos, VfHikingTime,
         VfBidirHikingTime, VfTable.The definitions and parameters of these are
         the following:         VfBinary({zeroFactor}, {lowCutAngle},
         {highCutAngle})
         If the VRMA is greater than the low-cut angle and less than the high-
         cut angle, the VF is set to the value associated with the zero factor;
         otherwise, it is infinity. VfLinear({zeroFactor},
         {lowCutAngle}, {highCutAngle},
         {slope})         The VF is a linear function of the VRMA.
         VfInverseLinear({zeroFactor}, {lowCutAngle}, {highCutAngle},
         {slope})         The VF is an inverse linear function of the VRMA.
         VfSymLinear({zeroFactor}, {lowCutAngle}, {highCutAngle},
         {slope})         The VF is a linear function of the VRMA in either the
         negative or
         positive side of the VRMA, and the two linear functions are
         symmetrical with respect to the VF (y) axis.
         VfSymInverseLinear({zeroFactor}, {lowCutAngle},
         {highCutAngle}, {slope})         The VF is an inverse linear function
         of the VRMA in either the
         negative or positive side of the VRMA, and the two linear functions
         are symmetrical with respect to the VF (y) axis.
         VfCos({lowCutAngle}, {highCutAngle}, {cosPower})         The
         VF is the cosine-based function of the VRMA.
         VfSec({lowCutAngle}, {highCutAngle}, {secPower})         The
         VF is the secant-based function of the VRMA.
         VfCosSec({lowCutAngle}, {highCutAngle}, {cosPower},
         {secPower})         The VF is the cosine-based function of the VRMA
         when the VRMA is
         negative and is the secant-based function of the VRMA when the VRMA is
         not negative. VfSecCos({lowCutAngle}, {highCutAngle},
         {secPower},
         {cos_power})         The VF is the secant-based function of the VRMA
         when the VRMA is
         negative and is the cosine-based function of the VRMA when the VRMA is
         not negative. VfHikingTime({lowCutAngle}, {highCutAngle})
         The VF is
         the hiking time function of the VRMA.
         VfBidirHikingTime({lowCutAngle}, {highCutAngle})         The
         VF is a bidirectional modified hiking time function of the VRMA.
         VfTable(inTable)         A table file will be used to define
         the vertical factor graph used to
         determine the VFs.The modifiers to the vertical parameters are the
         following:zeroFactor-The vertical factor used when the VRMA is zero.
         This factor
         positions the y-intercept of the specified function. By definition,
         the zero factor is not applicable to any of the trigonometric vertical
         functions (Cos, Sec, Cos-Sec, or Sec-Cos). The y-intercept is defined
         by these functions.lowCutAngle-The VRMA angle below which the VF will
         be set to infinity.highCutAngle-The VRMA angle above which the VF will
         be set to
         infinity.slope-The slope of the straight line used with the VfLinear
         and
         VfInverseLinear parameters. The slope is specified as a fraction of
         rise over run (for example, 45 percent slope is 1/45, which is input
         as 0.02222).inTable-The name of the table defining the VF.
     maximum_distance {Double}:
         The threshold that the accumulative cost values cannot exceed.If an
         accumulative cost distance value exceeds this value, the output
         value for the cell location will be NoData. The maximum distance is
         the extent for which the accumulative cost distances are
         calculated.The default distance is to the edge of the output raster.
     source_cost_multiplier {Double / Field}:
         The multiplier that will be applied to the cost values.This allows for
         control of the mode of travel or the magnitude at a
         source. The greater the multiplier, the greater the cost to move
         through each cell.The values must be greater than zero. The default is
         1.
     source_start_cost {Double / Field}:
         The starting cost that will be used to begin the cost
         calculations.Allows for the specification of the fixed cost associated
         with a
         source. Instead of starting at a cost of zero, the cost algorithm will
         begin with this value.The values must be zero or greater. The default
         is 0.
     source_resistance_rate {Double / Field}:
         This parameter simulates the increase in the effort to overcome costs
         as the accumulative cost increases. It is used to model fatigue of the
         traveler. The growing accumulative cost to reach a cell is multiplied
         by the resistance rate and added to the cost to move into the
         subsequent cell.It is a modified version of a compound interest rate
         formula that is
         used to calculate the apparent cost of moving through a cell. As the
         value of the resistance rate increases, it increases the cost of the
         cells that are visited later. The greater the resistance rate, the
         more additional cost is added to reach the next cell, which is
         compounded for each subsequent movement. Since the resistance rate is
         similar to a compound rate and generally the accumulative cost values
         are very large, small resistance rates are suggested, such as 0.02,
         0.005, or even smaller, depending on the accumulative cost values.The
         values must be zero or greater. The default is 0.
     source_capacity {Double / Field}:
         The cost capacity for the traveler for a source.The cost calculations
         continue for each source until the specified
         capacity is reached.The values must be greater than zero. The default
         capacity is to the
         edge of the output raster.
     source_direction {String / Field}:
         Specifies the direction of the traveler when applying horizontal and
         vertical factors and the source resistance rate.FROM_SOURCE-The
         horizontal factor, vertical factor, and source
         resistance rate will be applied beginning at the input source and
         travel out to the nonsource cells. This is the default.TO_SOURCE-The
         horizontal factor, vertical factor, and source
         resistance rate will be applied beginning at each nonsource cell and
         travel back to the input source.Specify the FROM_SOURCE or TO_SOURCE
         keyword, which will be applied to
         all sources, or specify a field in the source data that contains the
         keywords to identify the direction of travel for each source. That
         field must contain the string FROM_SOURCE or TO_SOURCE.

    OUTPUTS:
     out_distance_raster (Raster Dataset):
         The output path distance raster.The output path distance raster
         identifies, for each cell, the least
         accumulative cost distance, over a cost surface to the identified
         source locations, while accounting for surface distance as well as
         horizontal and vertical surface factors.A source can be a cell, a set
         of cells, or one or more feature
         locations.The output raster is of floating-point type.
     out_backlink_raster {Raster Dataset}:
         The output cost backlink raster.The backlink raster contains values 0
         through 8, which define the
         direction or identify the next neighboring cell (the succeeding cell)
         along the least accumulative cost path from a cell to reach its least-
         cost source, while accounting for surface distance as well as
         horizontal and vertical surface factors.If the path is to pass into
         the right neighbor, the cell will be
         assigned the value 1, 2 for the lower right diagonal cell, and
         continue clockwise. The value 0 is reserved for source cells."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_source_data,
        in_cost_raster,
        in_surface_raster,
        in_horizontal_raster,
        horizontal_factor,
        in_vertical_raster,
        vertical_factor,
        maximum_distance,
        out_backlink_raster,
        source_cost_multiplier,
        source_start_cost,
        source_resistance_rate,
        source_capacity,
        source_direction,
    ):
        horizontal_factor = Utils.compoundParameterToString(horizontal_factor, ParameterClasses._HorizontalFactor)
        vertical_factor = Utils.compoundParameterToString(vertical_factor, ParameterClasses._VerticalFactor)
        out_distance_raster = "#"
        result = arcpy.gp.PathDistance_sa(
            in_source_data,
            out_distance_raster,
            in_cost_raster,
            in_surface_raster,
            in_horizontal_raster,
            horizontal_factor,
            in_vertical_raster,
            vertical_factor,
            maximum_distance,
            out_backlink_raster,
            source_cost_multiplier,
            source_start_cost,
            source_resistance_rate,
            source_capacity,
            source_direction,
        )
        return _wrapToolRaster("PathDistance_sa", str(result.getOutput(0)))

    return Wrapper(
        in_source_data,
        in_cost_raster,
        in_surface_raster,
        in_horizontal_raster,
        horizontal_factor,
        in_vertical_raster,
        vertical_factor,
        maximum_distance,
        out_backlink_raster,
        source_cost_multiplier,
        source_start_cost,
        source_resistance_rate,
        source_capacity,
        source_direction,
    )


PathDistance.__esri_toolname__ = "PathDistance_sa"
PathDistance.__esri_toolinfo__ = [
    "::::1",
    "::::3",
    "::::4",
    "::::5",
    "Python::HfBinary|HfForward|HfInverseLinear|HfLinear|HfTable::",
    "::::7",
    "Python::VfBidirHikingTime|VfBinary|VfCos|VfCosSec|VfHikingTime|VfInverseLinear|VfLinear|VfSec|VfSecCos|VfSymInverseLinear|VfSymLinear|VfTable::",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
    "::::13",
    "::::14",
    "::::15",
]


def Pick(
    in_position_raster,
    in_rasters_or_constants,
    process_as_multiband: Literal["SINGLE_BAND", "MULTI_BAND", "#"] | None = "#",
) -> Raster:
    """Pick_sa(in_position_raster, in_rasters_or_constants;in_rasters_or_constants..., {process_as_multiband})

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
            "Pick_sa",
            ["Pick", in_position_raster] + Utils.flattenLists(in_rasters_or_constants),
            {"flattenBands": process_as_multiband.upper() == "SINGLE_BAND"},
        )

    return Wrapper(in_position_raster, in_rasters_or_constants, process_as_multiband)


Pick.__esri_toolname__ = "Pick_sa"
Pick.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def Plus(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """Plus_sa(in_raster_or_constant1, in_raster_or_constant2)

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


Plus.__esri_toolname__ = "Plus_sa"
Plus.__esri_toolinfo__ = ["::::1", "::::2"]


def PointDensity(
    in_point_features,
    population_field,
    cell_size="#",
    neighborhood="#",
    area_unit_scale_factor: Literal[
        "SQUARE_MAP_UNITS",
        "SQUARE_MILES",
        "SQUARE_KILOMETERS",
        "ACRES",
        "HECTARES",
        "SQUARE_YARDS",
        "SQUARE_FEET",
        "SQUARE_INCHES",
        "SQUARE_METERS",
        "SQUARE_CENTIMETERS",
        "SQUARE_MILLIMETERS",
        "#",
    ]
    | None = "#",
) -> Raster:
    """PointDensity_sa(in_point_features, population_field, {cell_size}, {neighborhood}, {area_unit_scale_factor})

       Calculates a magnitude-per-unit area from point features that fall
       within a neighborhood around each cell.

    INPUTS:
     in_point_features (Composite Geodataset):
         The input point features for which to calculate the density.
     population_field (Field):
         Field denoting population values for each point. The population field
         is the count or quantity to be used in the calculation of a continuous
         surface.Values in the population field can be integer or floating
         point.The options and default behaviors for the field are listed
         below. Useif no item or special value will be used and each
         feature
         will be counted once. None          You can use thefield if
         input features contain z-values.
         Shape          Otherwise, the default field is. The following
         conditions
         may also apply:          POPULATION           If there is nofield, but
         there is afield, it will be used
         by default. The 'abcd' can be any valid characters, for example,,, or.
         POPULATIONPOPULATIONabcdPOPULATION6POPULATION1974POPULATIONROADTYPE
         If there is nofield orfield, but there is afield, thefield
         will be used by default. POPULATIONPOPULATIONabcdPOPPOP
         If there is nofield,field, orfield, but there is afield,
         thefield will be used by default.
         POPULATIONPOPULATIONabcdPOPPOPabcdPOPabcd           If there is
         nofield,field,field, orfield,will be used by
         default. POPULATIONPOPULATIONabcdPOPPOPabcdNONE
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     neighborhood {Neighborhood}:
         Dictates the shape of the area around each cell used to calculate the
         density value.This is a Neighborhood class.There are four types of
         neighbourhood class: NbrAnnulus, NbrCircle,
         NbrRectangle, and NbrWedge.The forms and descriptions of the classes
         are:         NbrAnnulus ({innerRadius}, {outerRadius}, {units})
         A
         torus (donut shaped) neighborhood defined by an inner radius and an
         outer radius. NbrCircle ({radius}, {units})         A circular
         neighborhood
         with the given radius. NbrRectangle ({width}, {height},
         {units})         A
         rectangular neighborhood with the given width and height.
         NbrWedge ({radius}, {startAngle}, {endAngle}, {units})
         A wedge (pie) shaped neighborhood. A wedge is specified by a start
         angle, an end angle, and a radius. The wedge extends counterclockwise
         from the starting angle to the ending angle. Angles are specified in
         arithmetic degrees (counterclockwise from the positive x-axis).
         Negative angles may be used.Defines the units as either the number of
         cells or as value in map
         units.The default is NbrCircle, where radius is the shortest of the
         width or
         height of the output extent in the output spatial reference, divided
         by 30.
     area_unit_scale_factor {String}:
         Specifies the area units that will be used for the output density
         values.A default unit is determined based on the linear unit of the
         output
         spatial reference. You can change this to the appropriate unit to
         convert the density output. Values for line density convert the units
         of both length and area. If no output spatial reference is
         specified, the output
         spatial reference will be the same as the input feature class. The
         default output density units are determined by the linear units of the
         output spatial reference . If the output linear units are meters, the
         output area density units will be set to, outputting square kilometers
         for point features or kilometers per square kilometers for polyline
         features. If the output linear units are feet, the output area density
         units will be set to. Square kilometersSquare miles        If
         the output units are anything other than feet or meters,
         the output area density units will be set to. That is, the output
         density units will be the square of the linear units of the output
         spatial reference. For example, if the output linear units are
         centimeters, the output area density units will be, which will result
         in square centimeters. If the output linear units are kilometers, the
         output area density units will be, which will result in square
         kilometers. Square map unitsSquare map unitsSquare map unitsThe
         available options and their corresponding output density units are
         the following:SQUARE_MAP_UNITS-The square of the linear units of the
         output spatial
         reference will be used.SQUARE_MILES-U.S. miles will be
         used.SQUARE_KILOMETERS-Kilometers will be used.ACRES-U.S. acres will
         be used.HECTARES-Hectares will be used.SQUARE_YARDS-U.S. yards will be
         used.SQUARE_FEET-U.S. feet will be used.SQUARE_INCHES-U.S. inches will
         be used.SQUARE_METERS-Meters will be
         used.SQUARE_CENTIMETERS-Centimeters will be
         used.SQUARE_MILLIMETERS-Millimeters will be used.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output point density raster.It is always a floating point raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_point_features, population_field, cell_size, neighborhood, area_unit_scale_factor):
        neighborhood = Utils.compoundParameterToString(neighborhood, ParameterClasses._Neighborhood)
        out_raster = "#"
        result = arcpy.gp.PointDensity_sa(
            in_point_features, population_field, out_raster, cell_size, neighborhood, area_unit_scale_factor
        )
        return _wrapToolRaster("PointDensity_sa", str(result.getOutput(0)))

    return Wrapper(in_point_features, population_field, cell_size, neighborhood, area_unit_scale_factor)


PointDensity.__esri_toolname__ = "PointDensity_sa"
PointDensity.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::4",
    "Python::NbrAnnulus|NbrCircle|NbrRectangle|NbrWedge::",
    "::::6",
]


def PointsSolarRadiation(
    in_surface_raster,
    in_points_feature_or_table,
    out_global_radiation_features,
    height_offset="#",
    latitude="#",
    sky_size="#",
    time_configuration="#",
    day_interval="#",
    hour_interval="#",
    each_interval: Literal["NOINTERVAL", "INTERVAL", "#"] | None = "#",
    z_factor="#",
    slope_aspect_input_type: Literal["FROM_DEM", "FLAT_SURFACE", "FROM_POINTS_TABLE", "#"] | None = "#",
    calculation_directions="#",
    zenith_divisions="#",
    azimuth_divisions="#",
    diffuse_model_type: Literal["UNIFORM_SKY", "STANDARD_OVERCAST_SKY", "#"] | None = "#",
    diffuse_proportion="#",
    transmittivity="#",
    out_direct_radiation_features="#",
    out_diffuse_radiation_features="#",
    out_direct_duration_features="#",
):
    """PointsSolarRadiation_sa(in_surface_raster, in_points_feature_or_table, out_global_radiation_features, {height_offset}, {latitude}, {sky_size}, {time_configuration}, {day_interval}, {hour_interval}, {each_interval}, {z_factor}, {slope_aspect_input_type}, {calculation_directions}, {zenith_divisions}, {azimuth_divisions}, {diffuse_model_type}, {diffuse_proportion}, {transmittivity}, {out_direct_radiation_features}, {out_diffuse_radiation_features}, {out_direct_duration_features})

       Derives incoming solar radiation for specific locations in a point
       feature class or location table.

    INPUTS:
     in_surface_raster (Composite Geodataset):
         The input elevation surface raster.
     in_points_feature_or_table (Table View):
         The input point feature class or table containing the locations where
         solar radiation will be analyzed.
     height_offset {Double}:
         The height (in meters) above the DEM surface for which calculations
         will be performed.The height offset will be applied to all input
         locations.
     latitude {Double}:
         The latitude for the site area. The units are decimal degrees with
         positive values for the northern hemisphere and negative values for
         the southern hemisphere.For input surface rasters containing a spatial
         reference, the mean
         latitude is automatically calculated; otherwise, the latitude default
         is 45 degrees.
     sky_size {Long}:
         The resolution or sky size for the viewshed, sky map, and sun map
         rasters. The units are cells.The default is a raster of 200 by 200
         cells.
     time_configuration {Time configuration}:
         Specifies the time configuration (period) that will be used for
         calculating solar radiation.The Time class objects will be used to
         specify the time configuration.The different types of time
         configurations available are
         TimeWithinDay, TimeMultipleDays, TimeSpecialDays, and
         TimeWholeYear.The following are the forms:TimeWithinDay({day},{startTi
         me},{endTime})TimeMultipleDays({year},{sta
         rtDay},{endDay})TimeSpecialDays()TimeWholeYear({year})The default time
         configuration is TimeMultipleDays with the startDay
         value of 5 and the endDay value of 160 for the current Julian year.
     day_interval {Long}:
         The time interval through the year (units: days) that will be used to
         calculate sky sectors for the sun map.The default value is 14
         (biweekly).
     hour_interval {Double}:
         The time interval through the day (units: hours) that will be used to
         calculate sky sectors for the sun map.The default value is 0.5.
     each_interval {Boolean}:
         Specifies whether a single total insolation value will be calculated
         for all locations or multiple values will be calculated for the
         specified hour and day interval.NOINTERVAL-A single total radiation
         value will be calculated for the
         entire time configuration. This is the default.INTERVAL-Multiple
         radiation values will be calculated for each time
         interval over the entire time configuration. The number of outputs
         depends on the hour or day interval. For example, for a whole year
         with monthly intervals, the result will contain 12 output radiation
         values for each location.
     z_factor {Double}:
         The number of ground x,y units in one surface z-unit.The z-factor
         adjusts the units of measure for the z-units when they
         are different from the x,y units of the input surface. The z-values of
         the input surface are multiplied by the z-factor when calculating the
         final output surface.If the x,y units and z-units are in the same
         units of measure, the
         z-factor is 1. This is the default.If the x,y units and z-units are in
         different units of measure, the
         z-factor must be set to the appropriate factor or the results will be
         incorrect.For example, if the z-units are feet and the x,y units are
         meters, use
         a z-factor of 0.3048 to convert the z-units from feet to meters (1
         foot = 0.3048 meter).
     slope_aspect_input_type {String}:
         Specifies how slope and aspect information will be derived for
         analysis.FROM_DEM-The slope and aspect rasters will be calculated from
         the
         input surface raster. This is the default.FLAT_SURFACE-Constant values
         of zero will be used for slope and
         aspect.FROM_POINTS_TABLE-The slope and aspect values will be specified
         along
         with the x,y coordinates in the locations file.
     calculation_directions {Long}:
         The number of azimuth directions that will be used when calculating
         the viewshed.Valid values must be multiples of 8 (8, 16, 24, 32, and
         so on). The
         default value is 32 directions, which is adequate for complex
         topography.
     zenith_divisions {Long}:
         The number of zenith divisions that will be used to create sky sectors
         in the sky map.The default is eight divisions (relative to zenith).
         Values must be
         greater than zero and less than half the sky size value.
     azimuth_divisions {Long}:
         The number of azimuth divisions that will be used to create sky
         sectors in the sky map.The default is eight divisions (relative to
         north). Valid values must
         be multiples of 8. Values must be greater than zero and less than 160.
     diffuse_model_type {String}:
         Specifies the type of diffuse radiation model that will be
         used.UNIFORM_SKY-The uniform diffuse model will be used. The incoming
         diffuse radiation is the same from all sky directions. This is the
         default.STANDARD_OVERCAST_SKY-The standard overcast diffuse model will
         be
         used. The incoming diffuse radiation flux varies with the zenith
         angle.
     diffuse_proportion {Double}:
         The proportion of global normal radiation flux that is diffuse. Values
         range from 0 to 1.Set this value according to atmospheric conditions.
         The default value
         is 0.3 for generally clear sky conditions.
     transmittivity {Double}:
         The fraction of radiation that passes through the atmosphere (averaged
         overall wavelengths). Values range from 0 (no transmission) to 1 (all
         transmission).The default is 0.5 for a generally clear sky.

    OUTPUTS:
     out_global_radiation_features (Feature Class):
         The output feature class representing the global radiation or amount
         of incoming solar insolation (direct + diffuse) calculated for each
         location. The output has units of watt hours per square meter
         (WH/m).
         2
     out_direct_radiation_features {Feature Class}:
         The output feature class representing the direct incoming solar
         radiation for each location. The output has units of watt hours
         per square meter (WH/m).
         2
     out_diffuse_radiation_features {Feature Class}:
         The output feature class representing the incoming solar radiation for
         each location that is diffuse. The output has units of watt
         hours per square meter (WH/m).
         2
     out_direct_duration_features {Feature Class}:
         The output feature class representing the duration of direct incoming
         solar radiation.The output has units of hours."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_surface_raster,
        in_points_feature_or_table,
        out_global_radiation_features,
        height_offset,
        latitude,
        sky_size,
        time_configuration,
        day_interval,
        hour_interval,
        each_interval,
        z_factor,
        slope_aspect_input_type,
        calculation_directions,
        zenith_divisions,
        azimuth_divisions,
        diffuse_model_type,
        diffuse_proportion,
        transmittivity,
        out_direct_radiation_features,
        out_diffuse_radiation_features,
        out_direct_duration_features,
    ):
        time_configuration = Utils.compoundParameterToString(time_configuration, ParameterClasses._Time)
        result = arcpy.gp.PointsSolarRadiation_sa(
            in_surface_raster,
            in_points_feature_or_table,
            out_global_radiation_features,
            height_offset,
            latitude,
            sky_size,
            time_configuration,
            day_interval,
            hour_interval,
            each_interval,
            z_factor,
            slope_aspect_input_type,
            calculation_directions,
            zenith_divisions,
            azimuth_divisions,
            diffuse_model_type,
            diffuse_proportion,
            transmittivity,
            out_direct_radiation_features,
            out_diffuse_radiation_features,
            out_direct_duration_features,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_surface_raster,
        in_points_feature_or_table,
        out_global_radiation_features,
        height_offset,
        latitude,
        sky_size,
        time_configuration,
        day_interval,
        hour_interval,
        each_interval,
        z_factor,
        slope_aspect_input_type,
        calculation_directions,
        zenith_divisions,
        azimuth_divisions,
        diffuse_model_type,
        diffuse_proportion,
        transmittivity,
        out_direct_radiation_features,
        out_diffuse_radiation_features,
        out_direct_duration_features,
    )


PointsSolarRadiation.__esri_toolname__ = "PointsSolarRadiation_sa"
PointsSolarRadiation.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "Python::TimeMultipleDays|TimeSpecialDays|TimeWholeYear|TimeWithinDay::",
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


def PointStatistics(
    in_point_features,
    field,
    cell_size="#",
    neighborhood="#",
    statistics_type: Literal[
        "MEAN", "MAJORITY", "MAXIMUM", "MEDIAN", "MINIMUM", "MINORITY", "RANGE", "STD", "SUM", "VARIETY", "#"
    ]
    | None = "#",
) -> Raster:
    """PointStatistics_sa(in_point_features, field, {cell_size}, {neighborhood}, {statistics_type})

       Calculates a statistic on the points in a neighborhood around each
       output cell.

    INPUTS:
     in_point_features (Composite Geodataset):
         The input points to use in the neighborhood operation.For each output
         cell, any input points that fall within the defined
         neighborhood shape around it are identified. For the selected points,
         values from the specified attribute are obtained, and a statistic is
         calculated.The input can be either a point or multipoint feature
         class.
     field (Field):
         The field for which the specified statistic will be calculated. It can
         be any numeric field of the input point features. It can be
         thefield if the input features contain z-values.
         Shape
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     neighborhood {Neighborhood}:
         The area around each processing cell within which any input points
         found will be used in the statistics calculation. There are several
         predefined neighborhood types to choose from.Once the neighborhood
         type is selected, other parameters can be set to
         fully define the shape, size, and units of measure. The default
         neighborhood is a square rectangle with a width and height of three
         cells.The shape of the neighborhoods around each input point are
         defined by
         the Neighborhood class. The available neighborhood types are
         NbrAnnulus, NbrCircle, NbrRectangle, and NbrWedge.The following are
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
         default wedge is from 0 to 90 degrees, with a radius of 3 cells.The
         distance units for the parameters can be specified in CELL units
         or MAP units. Cell units is the default.The default neighborhood type
         is NbrRectangle with a height and width
         of three cells.
     statistics_type {String}:
         Specifies the statistic type to be calculated.The calculation is
         performed on the values of the specified field of
         the points that fall within the specified neighborhood of each output
         raster cell.MEAN-The average of the field values in each neighborhood
         will be
         calculated.MAJORITY-The most frequently occurring field value in each
         neighborhood will be identified. In the case of a tie, the lower value
         is used.MAXIMUM-The largest field value in each neighborhood will be
         identified.MEDIAN-The median field value in each neighborhood will be
         calculated.
         In the case of an even number of points in the neighborhood, the
         result will be the lower of the two middle values.MINIMUM-The smallest
         field value in each neighborhood will be
         identified.MINORITY-The least frequently occurring field value in each
         neighborhood will be identified. In the case of a tie, the lower value
         is used.RANGE-The range (the difference between the largest and
         smallest) of
         the field values in each neighborhood will be calculated.STD-The
         standard deviation of the field values in each neighborhood
         will be calculated.SUM-The sum of the field values in the neighborhood
         will be
         calculated.VARIETY-The number of unique field values in each
         neighborhood will be
         calculated.The default statistic type is MEAN.The available choices
         for the statistic type are determined by the
         numeric type of the specified field. If the field is integer, all the
         statistics types will be available. If the field is floating point,
         only the maximum, mean, minimum, range, standard deviation, and sum
         statistics will be available.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output point statistics raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_point_features, field, cell_size, neighborhood, statistics_type):
        neighborhood = Utils.compoundParameterToString(neighborhood, ParameterClasses._Neighborhood)
        out_raster = "#"
        result = arcpy.gp.PointStatistics_sa(
            in_point_features, field, out_raster, cell_size, neighborhood, statistics_type
        )
        return _wrapToolRaster("PointStatistics_sa", str(result.getOutput(0)))

    return Wrapper(in_point_features, field, cell_size, neighborhood, statistics_type)


PointStatistics.__esri_toolname__ = "PointStatistics_sa"
PointStatistics.__esri_toolinfo__ = [
    "::::1",
    "::::2",
    "::::4",
    "Python::NbrAnnulus|NbrCircle|NbrRectangle|NbrWedge::",
    "::::6",
]


def Popularity(
    in_popularity_raster_or_constant,
    in_rasters,
    process_as_multiband: Literal["SINGLE_BAND", "MULTI_BAND", "#"] | None = "#",
) -> Raster:
    """Popularity_sa(in_popularity_raster_or_constant, in_rasters;in_rasters..., {process_as_multiband})

       Determines the value in an argument list that is at a certain level of
       popularity on a cell-by-cell basis. The particular level of popularity
       (the number of occurrences of each value) is specified by the first
       argument.

    INPUTS:
     in_popularity_raster_or_constant (Composite Geodataset):
         The input raster that defines the popularity position to be returned.A
         number can be used as an input; however, the cell size and extent
         must first be set in the environment.
     in_rasters (Composite Geodataset):
         The list of input rasters used to evaluate the popularity of the
         values for each cell location.
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
         The output raster.Each cell on the output raster represents the value
         from the same
         location of input rasters that meets the input popularity value."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_popularity_raster_or_constant, in_rasters, process_as_multiband):
        if Utils.useDefaultArgumentValue(process_as_multiband):
            process_as_multiband = "SINGLE_BAND"
        if process_as_multiband not in ["SINGLE_BAND", "MULTI_BAND"]:
            raise arcpy.ExecuteError(
                "ERROR 000622: Failed to execute (Popularity). Parameters are not valid.\nERROR 000621: Input to parameter process_as_multiband not within domain.\n"
            )
        return _wrapLocalFunctionRaster(
            "Popularity_sa",
            ["Popularity", in_popularity_raster_or_constant] + Utils.flattenLists(in_rasters),
            {"flattenBands": process_as_multiband.upper() == "SINGLE_BAND"},
        )

    return Wrapper(in_popularity_raster_or_constant, in_rasters, process_as_multiband)


Popularity.__esri_toolname__ = "Popularity_sa"
Popularity.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def PorousPuff(
    in_track_file,
    in_porosity_raster,
    in_thickness_raster,
    mass,
    dispersion_time="#",
    longitudinal_dispersivity="#",
    dispersivity_ratio="#",
    retardation_factor="#",
    decay_coefficient="#",
) -> Raster:
    """PorousPuff_sa(in_track_file, in_porosity_raster, in_thickness_raster, mass, {dispersion_time}, {longitudinal_dispersivity}, {dispersivity_ratio}, {retardation_factor}, {decay_coefficient})

       Calculates the time-dependent, two-dimensional concentration
       distribution in mass per volume of a solute introduced instantaneously
       and at a discrete point into a vertically mixed aquifer.

    INPUTS:
     in_track_file (File):
         The input particle track path file.This is an ASCII text file
         containing information about the position,
         the local velocity vector, and the cumulative length and time of
         travel along the path.This file is generated using the Particle Track
         tool.
     in_porosity_raster (Composite Geodataset):
         The input raster where each cell value represents the effective
         formation porosity at that location.
     in_thickness_raster (Composite Geodataset):
         The input raster where each cell value represents the saturated
         thickness at that location.The value for the thickness is interpreted
         from geological properties
         of the aquifer.
     mass (Double):
         A value for the amount of mass released instantaneously at the source
         point, in units of mass.
     dispersion_time {Double}:
         A value representing the time horizon for dispersion of the solute, in
         units of time.The time must be less than or equal to the maximum time
         in the track
         file. If the requested time exceeds the available time from the track
         file, the tool is aborted. The default time is the latest time
         (corresponding to the terminal point) in the track file.
     longitudinal_dispersivity {Double}:
         A value representing the dispersivity parallel to the flow
         direction.For details on how the default value is determined, and how
         it relates
         to the scale of the study, see the How Porous Puff works section in
         the documentation.
     dispersivity_ratio {Double}:
         A value representing the ratio of longitudinal dispersivity over
         transverse dispersivity.Transverse dispersivity is perpendicular to
         the flow direction in the
         same horizontal plane. The default value is three.
     retardation_factor {Double}:
         A dimensionless value representing the retardation of the solute in
         the aquifer.Retardation varies between one and infinity, with one
         corresponding to
         no retardation. The default value is one.
     decay_coefficient {Double}:
         Decay coefficient for solutes undergoing first-order exponential decay
         (for example, radionuclides) in units of inverse time.The default is
         zero, corresponding to no decay.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster of the concentration distribution.Each cell value
         represents the concentration at that location."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_track_file,
        in_porosity_raster,
        in_thickness_raster,
        mass,
        dispersion_time,
        longitudinal_dispersivity,
        dispersivity_ratio,
        retardation_factor,
        decay_coefficient,
    ):
        out_raster = "#"
        result = arcpy.gp.PorousPuff_sa(
            in_track_file,
            in_porosity_raster,
            in_thickness_raster,
            out_raster,
            mass,
            dispersion_time,
            longitudinal_dispersivity,
            dispersivity_ratio,
            retardation_factor,
            decay_coefficient,
        )
        return _wrapToolRaster("PorousPuff_sa", str(result.getOutput(0)))

    return Wrapper(
        in_track_file,
        in_porosity_raster,
        in_thickness_raster,
        mass,
        dispersion_time,
        longitudinal_dispersivity,
        dispersivity_ratio,
        retardation_factor,
        decay_coefficient,
    )


PorousPuff.__esri_toolname__ = "PorousPuff_sa"
PorousPuff.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::5", "::::6", "::::7", "::::8", "::::9", "::::10"]


def Power(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """Power_sa(in_raster_or_constant1, in_raster_or_constant2)

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


Power.__esri_toolname__ = "Power_sa"
Power.__esri_toolinfo__ = ["::::1", "::::2"]


def PrincipalComponents(in_raster_bands, number_components="#", out_data_file="#") -> Raster:
    """PrincipalComponents_sa(in_raster_bands;in_raster_bands..., {number_components}, {out_data_file})

       Performs Principal Component Analysis (PCA) on a set of raster bands
       and generates a single multiband raster as output.

    INPUTS:
     in_raster_bands (Composite Geodataset):
         The input raster bands.They can be integer or floating point type.
     number_components {Long}:
         Number of principal components.The number must be greater than zero
         and less than or equal to the
         total number of input raster bands.The default is the total number of
         rasters in the input.

    OUTPUTS:
     out_multiband_raster (Raster Dataset):
         The output multiband raster dataset.If all of the input bands are
         integer type, the output raster bands
         will be integer. If any of the input bands are floating point, the
         output will be floating point.If the output is an Esri Grid raster,
         the name must have less than 10
         characters.
     out_data_file {File}:
         Output ASCII data file storing principal component parameters.The
         output data file records the correlation and covariance matrices,
         the eigenvalues and eigenvectors, the percent variance each eigenvalue
         captures, and the accumulative variance described by the
         eigenvalues.The extension for the output file can be .txt or .asc."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster_bands, number_components, out_data_file):
        out_multiband_raster = "#"
        result = arcpy.gp.PrincipalComponents_sa(
            in_raster_bands, out_multiband_raster, number_components, out_data_file
        )
        return _wrapToolRaster("PrincipalComponents_sa", str(result.getOutput(0)))

    return Wrapper(in_raster_bands, number_components, out_data_file)


PrincipalComponents.__esri_toolname__ = "PrincipalComponents_sa"
PrincipalComponents.__esri_toolinfo__ = ["::::1", "::::3", "::::4"]


def Rank(
    in_rank_raster_or_constant, in_rasters, process_as_multiband: Literal["SINGLE_BAND", "MULTI_BAND", "#"] | None = "#"
) -> Raster:
    """Rank_sa(in_rank_raster_or_constant, in_rasters;in_rasters..., {process_as_multiband})

       Ranks on a cell-by-cell basis the values from a set of input rasters
       and determines which values are returned based on the value of the
       rank input raster.

    INPUTS:
     in_rank_raster_or_constant (Composite Geodataset):
         The input raster that defines the rank position to be returned.A
         number can be used as an input; however, the cell size and extent
         must first be set in the environment.
     in_rasters (Composite Geodataset):
         The list of input rasters from which the cell value of the raster at
         the specified rank position will be obtained.For example, consider a
         particular location where the cell values in
         the three input rasters are 17, 8 and 11. The rank value for that
         location is defined as 3. The tool will first sort the input values.
         Since the rank value being requested is 3, the output value will be
         17.
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
         The output raster.For each cell on the output raster, the values on
         the input rasters
         are sorted from lowest to highest, and the input rank raster's value
         is used to select which will be the output value."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_rank_raster_or_constant, in_rasters, process_as_multiband):
        if Utils.useDefaultArgumentValue(process_as_multiband):
            process_as_multiband = "SINGLE_BAND"
        if process_as_multiband not in ["SINGLE_BAND", "MULTI_BAND"]:
            raise arcpy.ExecuteError(
                "ERROR 000622: Failed to execute (Rank). Parameters are not valid.\nERROR 000621: Input to parameter process_as_multiband not within domain.\n"
            )
        return _wrapLocalFunctionRaster(
            "Rank_sa",
            ["Rank", in_rank_raster_or_constant] + Utils.flattenLists(in_rasters),
            {"flattenBands": process_as_multiband.upper() == "SINGLE_BAND"},
        )

    return Wrapper(in_rank_raster_or_constant, in_rasters, process_as_multiband)


Rank.__esri_toolname__ = "Rank_sa"
Rank.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def RasterSolarRadiation(
    in_surface_raster,
    start_date_time,
    end_date_time,
    in_analysis_mask="#",
    in_slope_raster="#",
    in_aspect_raster="#",
    out_direct_radiation_raster="#",
    out_diffuse_radiation_raster="#",
    out_duration_raster="#",
    time_zone: Literal[
        "UTC",
        "Dateline_Standard_Time",
        "UTC-11",
        "Aleutian_Standard_Time",
        "Hawaiian_Standard_Time",
        "Marquesas_Standard_Time",
        "Alaskan_Standard_Time",
        "UTC-09",
        "Pacific_Standard_Time_(Mexico)",
        "UTC-08",
        "Pacific_Standard_Time",
        "US_Mountain_Standard_Time",
        "Mountain_Standard_Time_(Mexico)",
        "Mountain_Standard_Time",
        "Yukon_Standard_Time",
        "Central_America_Standard_Time",
        "Central_Standard_Time",
        "Easter_Island_Standard_Time",
        "Central_Standard_Time_(Mexico)",
        "Canada_Central_Standard_Time",
        "SA_Pacific_Standard_Time",
        "Eastern_Standard_Time_(Mexico)",
        "Eastern_Standard_Time",
        "Haiti_Standard_Time",
        "Cuba_Standard_Time",
        "US_Eastern_Standard_Time",
        "Turks_And_Caicos_Standard_Time",
        "Paraguay_Standard_Time",
        "Atlantic_Standard_Time",
        "Venezuela_Standard_Time",
        "Central_Brazilian_Standard_Time",
        "SA_Western_Standard_Time",
        "Pacific_SA_Standard_Time",
        "Newfoundland_Standard_Time",
        "Tocantins_Standard_Time",
        "E._South_America_Standard_Time",
        "SA_Eastern_Standard_Time",
        "Argentina_Standard_Time",
        "Montevideo_Standard_Time",
        "Magallanes_Standard_Time",
        "Saint_Pierre_Standard_Time",
        "Bahia_Standard_Time",
        "UTC-02",
        "Greenland_Standard_Time",
        "Mid-Atlantic_Standard_Time",
        "Azores_Standard_Time",
        "Cape_Verde_Standard_Time",
        "GMT_Standard_Time",
        "Greenwich_Standard_Time",
        "Sao_Tome_Standard_Time",
        "Morocco_Standard_Time",
        "W._Europe_Standard_Time",
        "Central_Europe_Standard_Time",
        "Romance_Standard_Time",
        "Central_European_Standard_Time",
        "W._Central_Africa_Standard_Time",
        "GTB_Standard_Time",
        "Middle_East_Standard_Time",
        "Egypt_Standard_Time",
        "E._Europe_Standard_Time",
        "West_Bank_Standard_Time",
        "South_Africa_Standard_Time",
        "FLE_Standard_Time",
        "Israel_Standard_Time",
        "South_Sudan_Standard_Time",
        "Kaliningrad_Standard_Time",
        "Sudan_Standard_Time",
        "Libya_Standard_Time",
        "Namibia_Standard_Time",
        "Jordan_Standard_Time",
        "Arabic_Standard_Time",
        "Syria_Standard_Time",
        "Turkey_Standard_Time",
        "Arab_Standard_Time",
        "Belarus_Standard_Time",
        "Russian_Standard_Time",
        "E._Africa_Standard_Time",
        "Volgograd_Standard_Time",
        "Iran_Standard_Time",
        "Arabian_Standard_Time",
        "Astrakhan_Standard_Time",
        "Azerbaijan_Standard_Time",
        "Russia_Time_Zone_3",
        "Mauritius_Standard_Time",
        "Saratov_Standard_Time",
        "Georgian_Standard_Time",
        "Caucasus_Standard_Time",
        "Afghanistan_Standard_Time",
        "West_Asia_Standard_Time",
        "Qyzylorda_Standard_Time",
        "Ekaterinburg_Standard_Time",
        "Pakistan_Standard_Time",
        "India_Standard_Time",
        "Sri_Lanka_Standard_Time",
        "Nepal_Standard_Time",
        "Central_Asia_Standard_Time",
        "Bangladesh_Standard_Time",
        "Omsk_Standard_Time",
        "Myanmar_Standard_Time",
        "SE_Asia_Standard_Time",
        "Altai_Standard_Time",
        "W._Mongolia_Standard_Time",
        "North_Asia_Standard_Time",
        "N._Central_Asia_Standard_Time",
        "Tomsk_Standard_Time",
        "China_Standard_Time",
        "North_Asia_East_Standard_Time",
        "Singapore_Standard_Time",
        "W._Australia_Standard_Time",
        "Taipei_Standard_Time",
        "Ulaanbaatar_Standard_Time",
        "Aus_Central_W._Standard_Time",
        "Transbaikal_Standard_Time",
        "Tokyo_Standard_Time",
        "North_Korea_Standard_Time",
        "Korea_Standard_Time",
        "Yakutsk_Standard_Time",
        "Cen._Australia_Standard_Time",
        "AUS_Central_Standard_Time",
        "E._Australia_Standard_Time",
        "AUS_Eastern_Standard_Time",
        "West_Pacific_Standard_Time",
        "Tasmania_Standard_Time",
        "Vladivostok_Standard_Time",
        "Lord_Howe_Standard_Time",
        "Bougainville_Standard_Time",
        "Russia_Time_Zone_10",
        "Magadan_Standard_Time",
        "Norfolk_Standard_Time",
        "Sakhalin_Standard_Time",
        "Central_Pacific_Standard_Time",
        "Russia_Time_Zone_11",
        "New_Zealand_Standard_Time",
        "UTC+12",
        "Fiji_Standard_Time",
        "Kamchatka_Standard_Time",
        "Chatham_Islands_Standard_Time",
        "UTC+13",
        "Tonga_Standard_Time",
        "Samoa_Standard_Time",
        "Line_Islands_Standard_Time",
        "#",
    ]
    | None = "#",
    adjust_DST: Literal["NOT_ADJUSTED_FOR_DST", "ADJUSTED_FOR_DST", "#"] | None = "#",
    use_time_interval: Literal["NO_INTERVAL", "INTERVAL", "#"] | None = "#",
    interval_unit: Literal["MINUTE", "HOUR", "DAY", "WEEK", "#"] | None = "#",
    interval="#",
    neighborhood_distance="#",
    use_adaptive_neighborhood: Literal["FIXED_NEIGHBORHOOD", "ADAPTIVE_NEIGHBORHOOD", "#"] | None = "#",
    diffuse_model_type: Literal["UNIFORM_SKY", "STANDARD_OVERCAST_SKY", "#"] | None = "#",
    diffuse_proportion="#",
    transmittivity="#",
    analysis_target_device: Literal["GPU_THEN_CPU", "GPU_ONLY", "CPU_ONLY", "#"] | None = "#",
    sunmap_grid_level="#",
) -> Raster:
    """RasterSolarRadiation_sa(in_surface_raster, start_date_time, end_date_time, {in_analysis_mask}, {in_slope_raster}, {in_aspect_raster}, {out_direct_radiation_raster}, {out_diffuse_radiation_raster}, {out_duration_raster}, {time_zone}, {adjust_DST}, {use_time_interval}, {interval_unit}, {interval}, {neighborhood_distance}, {use_adaptive_neighborhood}, {diffuse_model_type}, {diffuse_proportion}, {transmittivity}, {analysis_target_device}, {sunmap_grid_level})

       Calculates the incoming solar insolation for every raster cell of a
       digital surface model for Earth or the Moon.

    INPUTS:
     in_surface_raster (Composite Geodataset):
         The input elevation surface raster.
     start_date_time (Date):
         The start date and time for the analysis.
     end_date_time (Date):
         The end date and time for the analysis.
     in_analysis_mask {Composite Geodataset}:
         The input data that defines the locations where the analysis will
         occur.
     in_slope_raster {Composite Geodataset}:
         The input slope raster that will be used when calculating the output
         solar radiation.If this input is not specified, the tool will
         calculate slope values
         internally from the input surface raster. Providing this value will
         improve performance, especially if the tool will be run repeatedly or
         when analyzing larger datasets.
     in_aspect_raster {Composite Geodataset}:
         The input aspect raster that will be used when calculating the output
         solar radiation.If this input is not specified, the tool will
         calculate aspect values
         internally from the input surface raster. Providing this value will
         improve performance, especially if the tool will be run repeatedly or
         when analyzing larger datasets.
     time_zone {String}:
         The time zone that will be used for the start and end time. The
         default is coordinated universal time (UTC).UTC-The time zone will be
         UTC.Dateline_Standard_Time-The time zone
         will be Dateline Standard Time
         (UTC-12:00).UTC-11-The time zone will be UTC-11
         (UTC-11:00).Aleutian_Standard_Time-The time zone will be Aleutian
         Standard Time
         (UTC-10:00).Hawaiian_Standard_Time-The time zone will be Hawaiian
         Standard Time
         (UTC-10:00).Marquesas_Standard_Time-The time zone will be Marquesas
         Standard Time
         (UTC-09:30).Alaskan_Standard_Time-The time zone will be Alaskan
         Standard Time
         (UTC-09:00).UTC-09-The time zone will be UTC-09
         (UTC-09:00).Pacific_Standard_Time_(Mexico)-The time zone will be
         Pacific Standard
         Time (Mexico) (UTC-08:00).UTC-08-The time zone will be UTC-08
         (UTC-08:00).Pacific_Standard_Time-The time zone will be Pacific
         Standard Time
         (UTC-08:00).US_Mountain_Standard_Time-The time zone will be US
         Mountain Standard
         Time (UTC-07:00).Mountain_Standard_Time_(Mexico)-The time zone will be
         Mountain
         Standard Time (Mexico) (UTC-07:00).Mountain_Standard_Time-The time
         zone will be Mountain Standard Time
         (UTC-07:00).Yukon_Standard_Time-The time zone will be Yukon Standard
         Time
         (UTC-07:00).Central_America_Standard_Time-The time zone will be
         Central America
         Standard Time (UTC-06:00).Central_Standard_Time-The time zone will be
         Central Standard Time
         (UTC-06:00).Easter_Island_Standard_Time-The time zone will be Easter
         Island
         Standard Time (UTC-06:00).Central_Standard_Time_(Mexico)-The time zone
         will be Central Standard
         Time (Mexico) (UTC-06:00).Canada_Central_Standard_Time-The time zone
         will be Canada Central
         Standard Time (UTC-06:00).SA_Pacific_Standard_Time-The time zone will
         be SA Pacific Standard
         Time (UTC-05:00).Eastern_Standard_Time_(Mexico)-The time zone will be
         Eastern Standard
         Time (Mexico) (UTC-05:00).Eastern_Standard_Time-The time zone will be
         Eastern Standard Time
         (UTC-05:00).Haiti_Standard_Time-The time zone will be Haiti Standard
         Time
         (UTC-05:00).Cuba_Standard_Time-The time zone will be Cuba Standard
         Time
         (UTC-05:00).US_Eastern_Standard_Time-The time zone will be US Eastern
         Standard
         Time (UTC-05:00).Turks_And_Caicos_Standard_Time-The time zone will be
         Turks And Caicos
         Standard Time (UTC-04:00).Paraguay_Standard_Time-The time zone will be
         Paraguay Standard Time
         (UTC-04:00).Atlantic_Standard_Time-The time zone will be Atlantic
         Standard Time
         (UTC-04:00).Venezuela_Standard_Time-The time zone will be Venezuela
         Standard Time
         (UTC-04:00).Central_Brazilian_Standard_Time-The time zone will be
         Central
         Brazilian Standard Time (UTC-04:00).SA_Western_Standard_Time-The time
         zone will be SA Western Standard
         Time (UTC-04:00).Pacific_SA_Standard_Time-The time zone will be
         Pacific SA Standard
         Time (UTC-04:00).Newfoundland_Standard_Time-The time zone will be
         Newfoundland Standard
         Time (UTC-03:30).Tocantins_Standard_Time-The time zone will be
         Tocantins Standard Time
         (UTC-03:00).E._South_America_Standard_Time-The time zone will be E.
         South America
         Standard Time (UTC-03:00).SA_Eastern_Standard_Time-The time zone will
         be SA Eastern Standard
         Time (UTC-03:00).Argentina_Standard_Time-The time zone will be
         Argentina Standard Time
         (UTC-03:00).Greenland_Standard_Time-The time zone will be Greenland
         Standard Time
         (UTC-03:00).Montevideo_Standard_Time-The time zone will be Montevideo
         Standard
         Time (UTC-03:00).Magallanes_Standard_Time-The time zone will be
         Magallanes Standard
         Time (UTC-03:00).Saint_Pierre_Standard_Time-The time zone will be
         Saint Pierre Standard
         Time (UTC-03:00).Bahia_Standard_Time-The time zone will be Bahia
         Standard Time
         (UTC-03:00).UTC-02-The time zone will be UTC-02 (UTC-02:00).Mid-
         Atlantic_Standard_Time-The time zone will be Mid-Atlantic Standard
         Time (UTC-02:00).Azores_Standard_Time-The time zone will be Azores
         Standard Time
         (UTC-01:00).Cape_Verde_Standard_Time-The time zone will be Cape Verde
         Standard
         Time (UTC-01:00).GMT_Standard_Time-The time zone will be GMT Standard
         Time (UTC+00:00).Greenwich_Standard_Time-The time zone will be
         Greenwich Standard Time
         (UTC+00:00).Sao_Tome_Standard_Time-The time zone will be Sao Tome
         Standard Time
         (UTC+00:00).Morocco_Standard_Time-The time zone will be Morocco
         Standard Time
         (UTC+00:00).W._Europe_Standard_Time-The time zone will be W. Europe
         Standard Time
         (UTC+01:00).Central_Europe_Standard_Time-The time zone will be Central
         Europe
         Standard Time (UTC+01:00).Romance_Standard_Time-The time zone will be
         Romance Standard Time
         (UTC+01:00).Central_European_Standard_Time-The time zone will be
         Central European
         Standard Time (UTC+01:00).W._Central_Africa_Standard_Time-The time
         zone will be W. Central
         Africa Standard Time (UTC+01:00).Jordan_Standard_Time-The time zone
         will be Jordan Standard Time
         (UTC+02:00).GTB_Standard_Time-The time zone will be GTB Standard Time
         (UTC+02:00).Middle_East_Standard_Time-The time zone will be Middle
         East Standard
         Time (UTC+02:00).Egypt_Standard_Time-The time zone will be Egypt
         Standard Time
         (UTC+02:00).E._Europe_Standard_Time-The time zone will be E. Europe
         Standard Time
         (UTC+02:00).Syria_Standard_Time-The time zone will be Syria Standard
         Time
         (UTC+02:00).West_Bank_Standard_Time-The time zone will be West Bank
         Standard Time
         (UTC+02:00).South_Africa_Standard_Time-The time zone will be South
         Africa Standard
         Time (UTC+02:00).FLE_Standard_Time-The time zone will be FLE Standard
         Time (UTC+02:00).Israel_Standard_Time-The time zone will be Israel
         Standard
         (UTC+02:00).South_Sudan_Standard_Time-The time zone will be South
         Sudan Standard
         Time (UTC+02:00).Kaliningrad_Standard_Time-The time zone will be
         Kaliningrad Standard
         Time (UTC+02:00).Sudan_Standard_Time-The time zone will be Sudan
         Standard Time
         (UTC+02:00).Libya_Standard_Time-The time zone will be Libya Standard
         Time
         (UTC+02:00).Namibia_Standard_Time-The time zone will be Namibia
         Standard Time
         (UTC+02:00).Arabic_Standard_Time-The time zone will be Arabic Standard
         Time
         (UTC+03:00).Turkey_Standard_Time-The time zone will be Turkey Standard
         Time
         (UTC+03:00).Arab_Standard_Time-The time zone will be Arab Standard
         Time
         (UTC+03:00).Belarus_Standard_Time-The time zone will be Belarus
         Standard Time
         (UTC+03:00).Russian_Standard_Time-The time zone will be Russian
         Standard Time
         (UTC+03:00).E._Africa_Standard_Time-The time zone will be E. Africa
         Standard Time
         (UTC+03:00).Volgograd_Standard_Time-The time zone will be Volgograd
         Standard Time
         (UTC+03:00).Iran_Standard_Time-The time zone will be Iran Standard
         Time
         (UTC+03:30).Arabian_Standard_Time-The time zone will be Arabian
         Standard Time
         (UTC+04:00).Astrakhan_Standard_Time-The time zone will be Astrakhan
         Standard Time
         (UTC+04:00).Azerbaijan_Standard_Time-The time zone will be Azerbaijan
         Standard
         Time (UTC+04:00).Russia_Time_Zone_3-The time zone will be Russia Time
         Zone 3
         (UTC+04:00).Mauritius_Standard_Time-The time zone will be Mauritius
         Standard Time
         (UTC+04:00).Saratov_Standard_Time-The time zone will be Saratov
         Standard Time
         (UTC+04:00).Georgian_Standard_Time-The time zone will be Georgian
         Standard Time
         (UTC+04:00).Caucasus_Standard_Time-The time zone will be Caucasus
         Standard Time
         (UTC+04:00).Afghanistan_Standard_Time-The time zone will be
         Afghanistan Standard
         Time (UTC+04:30).West_Asia_Standard_Time-The time zone will be West
         Asia Standard Time
         (UTC+05:00).Ekaterinburg_Standard_Time-The time zone will be
         Ekaterinburg Standard
         Time (UTC+05:00).Pakistan_Standard_Time-The time zone will be Pakistan
         Standard Time
         (UTC+05:00).Qyzylorda_Standard_Time-The time zone will be Qyzylorda
         Standard Time
         (UTC+05:00).India_Standard_Time-The time zone will be India Standard
         Time
         (UTC+05:30).Sri_Lanka_Standard_Time-The time zone will be Sri Lanka
         Standard Time
         (UTC+05:30).Nepal_Standard_Time-The time zone will be Nepal Standard
         Time
         (UTC+05:45).Central_Asia_Standard_Time-The time zone will be Central
         Asia Standard
         Time (UTC+06:00).Bangladesh_Standard_Time-The time zone will be
         Bangladesh Standard
         Time (UTC+06:00).Omsk_Standard_Time-The time zone will be Omsk
         Standard Time
         (UTC+06:00).Myanmar_Standard_Time-The time zone will be Myanmar
         Standard Time
         (UTC+06:30).SE_Asia_Standard_Time-The time zone will be SE Asia
         Standard Time
         (UTC+07:00).Altai_Standard_Time-The time zone will be Altai Standard
         Time
         (UTC+07:00).W._Mongolia_Standard_Time-The time zone will be W.
         Mongolia Standard
         Time (UTC+07:00).North_Asia_Standard_Time-The time zone will be North
         Asia Standard
         Time (UTC+07:00).N._Central_Asia_Standard_Time-The time zone will be
         N. Central Asia
         Standard Time (UTC+07:00).Tomsk_Standard_Time-The time zone will be
         Tomsk Standard Time
         (UTC+07:00).China_Standard_Time-The time zone will be China Standard
         Time
         (UTC+08:00).North_Asia_East_Standard_Time-The time zone will be North
         Asia East
         Standard Time (UTC+08:00).Singapore_Standard_Time-The time zone will
         be Singapore Standard Time
         (UTC+08:00).W._Australia_Standard_Time-The time zone will be W.
         Australia Standard
         Time (UTC+08:00).Taipei_Standard_Time-The time zone will be Taipei
         Standard Time
         (UTC+08:00).Ulaanbaatar_Standard_Time-The time zone will be
         Ulaanbaatar Standard
         Time (UTC+08:00).Aus_Central_W._Standard_Time-The time zone will be
         Aus Central W.
         Standard Time (UTC+08:45).Transbaikal_Standard_Time-The time zone will
         be Transbaikal Standard
         Time (UTC+09:00).Tokyo_Standard_Time-The time zone will be Tokyo
         Standard Time
         (UTC+09:00).North_Korea_Standard_Time-The time zone will be North
         Korea Standard
         Time (UTC+09:00).Korea_Standard_Time-The time zone will be Korea
         Standard Time
         (UTC+09:00).Yakutsk_Standard_Time-The time zone will be Yakutsk
         Standard Time
         (UTC+09:00).Cen._Australia_Standard_Time-The time zone will be Cen.
         Australia
         Standard Time (UTC+09:30).AUS_Central_Standard_Time-The time zone will
         be AUS Central Standard
         Time (UTC+09:30).E._Australia_Standard_Time-The time zone will be E.
         Australia Standard
         Time (UTC+10:00).AUS_Eastern_Standard_Time-The time zone will be AUS
         Eastern Standard
         Time (UTC+10:00).West_Pacific_Standard_Time-The time zone will be West
         Pacific Standard
         Time (UTC+10:00).Tasmania_Standard_Time-The time zone will be Tasmania
         Standard Time
         (UTC+10:00).Vladivostok_Standard_Time-The time zone will be
         Vladivostok Standard
         Time (UTC+10:00).Lord_Howe_Standard_Time-The time zone will be Lord
         Howe Standard Time
         (UTC+10:30).Bougainville_Standard_Time-The time zone will be
         Bougainville Standard
         Time (UTC+11:00).Russia_Time_Zone_10-The time zone will be Russia Time
         Zone 10
         (UTC+11:00).Magadan_Standard_Time-The time zone will be Magadan
         Standard Time
         (UTC+11:00).Norfolk_Standard_Time-The time zone will be Norfolk
         Standard Time
         (UTC+11:00).Sakhalin_Standard_Time-The time zone will be Sakhalin
         Standard Time
         (UTC+11:00).Central_Pacific_Standard_Time-The time zone will be
         Central Pacific
         Standard Time (UTC+11:00).Russia_Time_Zone_11-The time zone will be
         Russia Time Zone 11
         (UTC+11:00).New_Zealand_Standard_Time-The time zone will be New
         Zealand Standard
         Time (UTC+12:00).UTC+12-The time zone will be UTC+12
         (UTC+12:00).Fiji_Standard_Time-The time zone will be Fiji Standard
         Time
         (UTC+12:00).Kamchatka_Standard_Time-The time zone will be Kamchatka
         Standard Time
         (UTC+12:00).Chatham_Islands_Standard_Time-The time zone will be
         Chatham Islands
         Standard Time (UTC+12:45).UTC+13-The time zone will be UTC+13
         (UTC+13:00).Tonga_Standard_Time-The time zone will be Tonga Standard
         Time
         (UTC+13:00).Samoa_Standard_Time-The time zone will be Samoa Standard
         Time
         (UTC+13:00).Line_Islands_Standard_Time-The time zone will be Line
         Islands Standard
         Time (UTC+14:00).
     adjust_DST {Boolean}:
         Specifies whether the input time configuration will be adjusted for
         daylight saving time.This parameter is not applicable for analysis on
         the Moon.NOT_ADJUSTED_FOR_DST-The input time values will not be
         adjusted for
         daylight saving time. This is the default.ADJUSTED_FOR_DST-The input
         time values will be adjusted for daylight
         saving time.
     use_time_interval {Boolean}:
         Specifies whether a single total insolation value will be calculated
         for the entire time configuration or multiple radiation values will be
         calculated for the specified interval.NO_INTERVAL-A single radiation
         value will be calculated for the entire
         time configuration. This is default.INTERVAL-Multiple radiation values
         will be calculated for each time
         interval over the entire time configuration.
     interval_unit {String}:
         Specifies the time unit that will be used for calculating solar
         radiation values over the entire time configuration.This parameter is
         only supported when the use_time_interval parameter
         is set to INTERVAL.MINUTE-The interval unit will be minutes. This
         option is only
         available for Earth-based data.HOUR-The interval unit will be
         hours.DAY-The interval unit will be days. This is the defaultWEEK-The
         interval unit will be weeks.
     interval {Long}:
         The value of the duration or time between intervals.The default value
         is dependent on the interval unit specified. The
         default value for each of the available units are listed
         below.MINUTE-60HOUR-4DAY-14WEEK-2
     neighborhood_distance {Linear Unit}:
         The distance from the target cell center for which the output
         insolation value will be calculated. It determines the size of the
         neighborhood.The default value is the input surface raster cell size,
         resulting in
         a 3 by 3 neighborhood.
     use_adaptive_neighborhood {Boolean}:
         Specifies whether neighborhood distance will vary with landscape
         changes (adaptive). The maximum distance is determined by the
         neighborhood distance. The minimum distance is the input raster cell
         size.FIXED_NEIGHBORHOOD-A single (fixed) neighborhood distance will be
         used
         at all locations. This is the default.ADAPTIVE_NEIGHBORHOOD-An
         adaptive neighborhood distance will be used
         at all locations.
     diffuse_model_type {String}:
         Specifies the type of diffuse radiation model that will be
         used.UNIFORM_SKY-The uniform diffuse model will be used. The incoming
         diffuse radiation is the same from all sky directions. This is the
         default.STANDARD_OVERCAST_SKY-The standard overcast diffuse model will
         be
         used. The incoming diffuse radiation flux varies with the zenith
         angle.
     diffuse_proportion {Double}:
         The proportion of global normal radiation flux that is diffuse. Values
         range from 0 to 1.Set this value according to atmospheric conditions.
         The default value
         is 0.3 for generally clear sky conditions.
     transmittivity {Double}:
         The fraction of radiation that passes through the atmosphere (averaged
         overall wavelengths). Values range from 0 (no transmission) to 1 (all
         transmission).The default is 0.5 for a generally clear sky.
     analysis_target_device {String}:
         Specifies the device that will be used to perform the
         calculation.GPU_THEN_CPU-If a compatible GPU is found, it will be used
         to perform
         the calculation. Otherwise, the CPU will be used. This is the
         default.CPU_ONLY-The calculation will only be performed on the
         CPU.GPU_ONLY-The calculation will only be performed on the GPU.
     sunmap_grid_level {Long}:
         The resolution that will be used to generate the H3 hexagonal grid
         cells used for internal calculations. A lower grid level value creates
         fewer, larger sun map areas and decreases tool run time. A higher grid
         level creates more smaller sun maps improving the accuracy of the
         result.Valid values of the sun map grid level for Earth range from 5
         to 7.
         For the Moon, the valid value range is from 4 to 6.By default, the
         grid level is determined by the input surface raster.
         When analyzing surface data on Earth, if the analysis cell size is
         less than or equal to 4 meters, the default grid level is 6. If the
         analysis cell size is greater than 4 meters, the default grid level is
         5. For analyzing surface data on the Moon, the default grid level is
         6.

    OUTPUTS:
     out_solar_radiation_raster (Raster Dataset):
         The output raster representing the total amount of solar radiation
         received per unit area across the input surface. The output has
         units of kilowatt hours per square meter
         (kWh/m). 2
     out_direct_radiation_raster {Raster Dataset}:
         The output raster representing the direct incoming solar radiation
         value for each location. The output has units of kilowatt hours
         per square meter
         (kWh/m). 2
     out_diffuse_radiation_raster {Raster Dataset}:
         The output raster representing the incoming solar radiation that is
         diffused by the sky, layers of atmosphere, and other surroundings.
         The output has units of kilowatt hours per square meter
         (kWh/m). 2
     out_duration_raster {Raster Dataset}:
         The output raster representing the duration of direct incoming solar
         radiation.The output has units of hours."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_surface_raster,
        start_date_time,
        end_date_time,
        in_analysis_mask,
        in_slope_raster,
        in_aspect_raster,
        out_direct_radiation_raster,
        out_diffuse_radiation_raster,
        out_duration_raster,
        time_zone,
        adjust_DST,
        use_time_interval,
        interval_unit,
        interval,
        neighborhood_distance,
        use_adaptive_neighborhood,
        diffuse_model_type,
        diffuse_proportion,
        transmittivity,
        analysis_target_device,
        sunmap_grid_level,
    ):
        out_solar_radiation_raster = "#"
        result = arcpy.gp.RasterSolarRadiation_sa(
            in_surface_raster,
            out_solar_radiation_raster,
            start_date_time,
            end_date_time,
            in_analysis_mask,
            in_slope_raster,
            in_aspect_raster,
            out_direct_radiation_raster,
            out_diffuse_radiation_raster,
            out_duration_raster,
            time_zone,
            adjust_DST,
            use_time_interval,
            interval_unit,
            interval,
            neighborhood_distance,
            use_adaptive_neighborhood,
            diffuse_model_type,
            diffuse_proportion,
            transmittivity,
            analysis_target_device,
            sunmap_grid_level,
        )
        return _wrapToolRaster("RasterSolarRadiation_sa", str(result.getOutput(0)))

    return Wrapper(
        in_surface_raster,
        start_date_time,
        end_date_time,
        in_analysis_mask,
        in_slope_raster,
        in_aspect_raster,
        out_direct_radiation_raster,
        out_diffuse_radiation_raster,
        out_duration_raster,
        time_zone,
        adjust_DST,
        use_time_interval,
        interval_unit,
        interval,
        neighborhood_distance,
        use_adaptive_neighborhood,
        diffuse_model_type,
        diffuse_proportion,
        transmittivity,
        analysis_target_device,
        sunmap_grid_level,
    )


RasterSolarRadiation.__esri_toolname__ = "RasterSolarRadiation_sa"
RasterSolarRadiation.__esri_toolinfo__ = [
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
    "::::22",
]


def ReclassByASCIIFile(in_raster, in_remap_file, missing_values: Literal["DATA", "NODATA", "#"] | None = "#") -> Raster:
    """ReclassByASCIIFile_sa(in_raster, in_remap_file, {missing_values})

       Reclassifies (or changes) the values of the input cells of a raster
       using an ASCII remap file.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster to be reclassified.
     in_remap_file (File):
         ASCII remap file defining the single values or ranges to be
         reclassified and the values they will become.Allowed extensions for
         the ASCII remap files are .rmp, .txt, and .asc.
     missing_values {Boolean}:
         Denotes whether missing values in the reclass file retain their value
         or get mapped to NoData.DATA-Signifies that if any cell location on
         the input raster contains
         a value that is not present or reclassed in the remap file, the value
         should remain intact and be written for that location to the output
         raster. This is the default.NODATA-Signifies that if any cell location
         on the input raster
         contains a value that is not present or reclassed in the remap file,
         the value will be reclassed to NoData for that location on the output
         raster.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output reclassified raster.The output will always be of integer
         type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, in_remap_file, missing_values):
        out_raster = "#"
        result = arcpy.gp.ReclassByASCIIFile_sa(in_raster, in_remap_file, out_raster, missing_values)
        return _wrapToolRaster("ReclassByASCIIFile_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, in_remap_file, missing_values)


ReclassByASCIIFile.__esri_toolname__ = "ReclassByASCIIFile_sa"
ReclassByASCIIFile.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def ReclassByTable(
    in_raster,
    in_remap_table,
    from_value_field,
    to_value_field,
    output_value_field,
    missing_values: Literal["DATA", "NODATA", "#"] | None = "#",
) -> Raster:
    """ReclassByTable_sa(in_raster, in_remap_table, from_value_field, to_value_field, output_value_field, {missing_values})

       Reclassifies (or changes) the values of the input cells of a raster
       using a remap table.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster to be reclassified.
     in_remap_table (Table View):
         Table holding fields defining value ranges to be reclassified and the
         values they will become.
     from_value_field (Field):
         Field holding the beginning value for each value range to be
         reclassified.This is a numeric field of the input remap table.
     to_value_field (Field):
         Field holding the ending value for each value range to be
         reclassified.This is a numeric field of the input remap table.
     output_value_field (Field):
         Field holding the integer values to which each range should be
         changed.This is an integer field of the input remap table.
     missing_values {Boolean}:
         Denotes whether missing values in the reclass table retain their value
         or get mapped to NoData.DATA-Signifies that if any cell location on
         the input raster contains
         a value not present or reclassed in a remap table, the value should
         remain intact and be written for that location to the output raster.
         This is the default.NODATA-Signifies that if any cell location on the
         input raster
         contains a value not present or reclassed in a remap table, the value
         will be reclassed to NoData for that location on the output raster.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output reclassified raster.The output will always be of integer
         type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, in_remap_table, from_value_field, to_value_field, output_value_field, missing_values):
        out_raster = "#"
        result = arcpy.gp.ReclassByTable_sa(
            in_raster, in_remap_table, from_value_field, to_value_field, output_value_field, out_raster, missing_values
        )
        return _wrapToolRaster("ReclassByTable_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, in_remap_table, from_value_field, to_value_field, output_value_field, missing_values)


ReclassByTable.__esri_toolname__ = "ReclassByTable_sa"
ReclassByTable.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::7"]


def Reclassify(in_raster, reclass_field, remap, missing_values: Literal["DATA", "NODATA", "#"] | None = "#") -> Raster:
    """Reclassify_sa(in_raster, reclass_field, remap, {missing_values})

       Reclassifies (or changes) the values in a raster.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster to be reclassified.
     reclass_field (Field):
         Field denoting the values that will be reclassified.
     remap (Remap):
         The Remap object is used to specify how to reclassify values of the
         input raster.There are two ways to define how the values will be
         reclassified in
         the output raster: RemapRange and RemapValue. Either ranges of input
         values can be assigned to a new output value, or individual values can
         be assigned to a new output value.The following are the forms of the
         remap objects.RemapRange (remapTable)RemapValue (remapTable)
     missing_values {Boolean}:
         Denotes whether missing values in the reclass table retain their value
         or get mapped to NoData.DATA-Signifies that if any cell location on
         the input raster contains
         a value that is not present or reclassed in a remap table, the value
         should remain intact and be written for that location to the output
         raster. This is the default.NODATA-Signifies that if any cell location
         on the input raster
         contains a value that is not present or reclassed in a remap table,
         the value will be reclassed to NoData for that location on the output
         raster.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output reclassified raster.The output will always be of integer
         type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, reclass_field, remap, missing_values):
        remap = Utils.compoundParameterToString(remap, ParameterClasses._Remap)
        out_raster = "#"
        result = arcpy.gp.Reclassify_sa(in_raster, reclass_field, remap, out_raster, missing_values)
        return _wrapToolRaster("Reclassify_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, reclass_field, remap, missing_values)


Reclassify.__esri_toolname__ = "Reclassify_sa"
Reclassify.__esri_toolinfo__ = ["::::1", "::::2", "Python::RemapRange|RemapValue::", "::::5"]


def RegionGroup(
    in_raster,
    number_neighbors: Literal["FOUR", "EIGHT", "#"] | None = "#",
    zone_connectivity: Literal["WITHIN", "CROSS", "#"] | None = "#",
    add_link: Literal["ADD_LINK", "NO_LINK", "#"] | None = "#",
    excluded_value="#",
) -> Raster:
    """RegionGroup_sa(in_raster, {number_neighbors}, {zone_connectivity}, {add_link}, {excluded_value})

       For each cell in the output, the identity of the connected region to
       which that cell belongs is recorded. A unique number is assigned to
       each region.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster for which unique connected regions of cells will be
         identified.It must be of integer type.
     number_neighbors {String}:
         Specifies the number of neighboring cells to use when evaluating
         connectivity between cells that define a region.FOUR-Connectivity is
         evaluated for the four nearest (orthogonal)
         neighbors of each input cell. Only the cells with the same value that
         share at least one side will contribute to an individual region. If
         two cells with the same value are diagonal from one another, they are
         not considered connected. This is the default.EIGHT-Connectivity is
         evaluated for the eight nearest neighbors (both
         orthogonal and diagonal) of each input cell. Cells with the same value
         that are connected either along a common edge or corner to each other
         will contribute to an individual region.
     zone_connectivity {String}:
         Defines which cell values should be considered when testing for
         connectivity.WITHIN-Connectivity for a region is evaluated for input
         cells that are
         part of the same zone (cell value). The only cells that can be grouped
         are cells from the same zone that meet the spatial requirements of
         connectivity specified by the number_neighbors parameter (four or
         eight). This is the default.CROSS-Connectivity for a region is
         evaluated between cells of any
         value, except for the zone cells identified to be excluded by the
         excluded_value parameter, and subject to the spatial requirements
         specified by the number_neighbors parameter. Groupings of regions in
         the input that are separated from other groupings by a buffer of
         NoData cells will be processed independently from each other.
     add_link {Boolean}:
         Specifies whether a link field will be added to the table of the
         output when the zone_connectivity parameter is set to WITHIN. It is
         ignored if that parameter is set to CROSS. ADD_LINK-Afield
         will be added to the table of the output
         raster. This field stores the value of the zone to which the cells of
         each region in the output belong according to the connectivity rule
         defined in the number_neighbors parameter. This is the default.
         LINK         NO_LINK-Afield will not be added. The attribute table for
         the
         output raster will only contain theandfields. LINKValueCount
     excluded_value {Long}:
         A value that excludes all cells of that zone from the connectivity
         evaluation. If a cell location contains the value, no spatial
         connectivity will be evaluated, regardless of how the number of
         neighbors is specified.Cells with the excluded value will be treated
         in a similar way to
         NoData cells, and are eliminated from consideration in the operation.
         Input cells that contain the excluded value will receive 0 on the
         output raster. The excluded value is similar to the concept of a
         background value.By default, there is no value defined for this
         parameter, which means
         that all of the input cells will be considered in the operation.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output region group raster.The output is always of integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, number_neighbors, zone_connectivity, add_link, excluded_value):
        out_raster = "#"
        result = arcpy.gp.RegionGroup_sa(
            in_raster, out_raster, number_neighbors, zone_connectivity, add_link, excluded_value
        )
        return _wrapToolRaster("RegionGroup_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, number_neighbors, zone_connectivity, add_link, excluded_value)


RegionGroup.__esri_toolname__ = "RegionGroup_sa"
RegionGroup.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6"]


def RemoveRasterSegmentTilingArtifacts(in_segmented_raster, tileSizeX="#", tileSizeY="#") -> Raster:
    """RemoveRasterSegmentTilingArtifacts_sa(in_segmented_raster, {tileSizeX}, {tileSizeY})

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
        result = arcpy.gp.RemoveRasterSegmentTilingArtifacts_sa(
            in_segmented_raster, out_raster_dataset, tileSizeX, tileSizeY
        )
        return _wrapToolRaster("RemoveRasterSegmentTilingArtifacts_sa", str(result.getOutput(0)))

    return Wrapper(in_segmented_raster, tileSizeX, tileSizeY)


RemoveRasterSegmentTilingArtifacts.__esri_toolname__ = "RemoveRasterSegmentTilingArtifacts_sa"
RemoveRasterSegmentTilingArtifacts.__esri_toolinfo__ = ["::::1", "::::3", "::::4"]


def RescaleByFunction(in_raster, transformation_function="#", from_scale="#", to_scale="#") -> Raster:
    """RescaleByFunction_sa(in_raster, {transformation_function}, {from_scale}, {to_scale})

       Rescales the input raster values by applying a selected transformation
       function and transforming the resulting values onto a specified
       continuous evaluation scale.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster to rescale.
     transformation_function {Transformation function}:
         Specifies the continuous function to transform the input raster.The
         transformation function classes are used to specify the type of
         transformation function. The types of transformation function
         classes are
         TfExponential, TfGaussian, TfLarge, TfLinear, TfLogarithm,
         TfLogisticDecay, TfLogisticGrowth, TfMSLarge, TfMSSmall, TfNear,
         TfPower, TfSmall, and TfSymmetricLinearWhich transformation function
         to use depends on which function best
         captures the interaction of the phenomenon's preference to the input
         values. To better understand how the lower and upper thresholds affect
         the output values, For more information on the parameters that control
         the thresholds, see The interaction of the lower and upper thresholds
         on the output values. The following are the forms of the
         transformation function
         classes:        TfExponential({shift}, {baseFactor}, {lowerThreshold},
         {valueBelowThreshold}, {upperThreshold},
         {valueAboveThreshold})TfGaussian({midpoint}, {spread},
         {lowerThreshold},
         {valueBelowThreshold}, {upperThreshold},
         {valueAboveThreshold})TfLarge({midpoint}, {spread}, {lowerThreshold},
         {valueBelowThreshold},
         {upperThreshold}, {valueAboveThreshold})TfLinear({minimum}, {maximum},
         {lowerThreshold},
         {valueBelowThreshold}, {upperThreshold},
         {valueAboveThreshold})TfLogarithm({shift}, {factor}, {lowerThreshold},
         {valueBelowThreshold}, {upperThreshold},
         {valueAboveThreshold})TfLogisticDecay({minimum}, {maximum},
         {yInterceptPercent},
         {lowerThreshold}, {valueBelowThreshold}, {upperThreshold},
         {valueAboveThreshold})TfLogisticGrowth({minimum}, {maximum},
         {yInterceptPercent},
         {lowerThreshold}, {valueBelowThreshold}, {upperThreshold},
         {valueAboveThreshold})TfMSLarge({meanMultiplier}, {STDMultiplier},
         {lowerThreshold},
         {valueBelowThreshold}, {upperThreshold},
         {valueAboveThreshold})TfMSSmall({meanMultiplier}, {STDMultiplier},
         {lowerThreshold},
         {valueBelowThreshold}, {upperThreshold},
         {valueAboveThreshold})TfNear({midpoint}, {spread}, {lowerThreshold},
         {valueBelowThreshold},
         {upperThreshold}, {valueAboveThreshold})TfPower({shift}, {exponent},
         {lowerThreshold}, {valueBelowThreshold},
         {upperThreshold}, {valueAboveThreshold})TfSmall({midpoint}, {spread},
         {lowerThreshold}, {valueBelowThreshold},
         {upperThreshold}, {valueAboveThreshold})TfSymmetricLinear({minimum},
         {maximum}, {lowerThreshold},
         {valueBelowThreshold}, {upperThreshold}, {valueAboveThreshold})The
         default transformation function is TfMSSmall. The parameter
         defaults for the transformation functions
         include the following:        baseFactor (for TfExponential) is
         derived from the input
         raster.exponent (for TfPower) is derived from the input raster.factor
         (for TfLogarithm) is derived from the input raster.lowerThreshold (for
         all functions) is set to the Minimum of the input
         raster.maximum (for TfLinear, TfLogisticDecay, TfLogisticGrowth, and
         TfSymmetricLinear) is set to the Maximum of the input
         raster.meanMultiplier (for TfMSLarge and TfMSSmall) is 1.midpoint (for
         TfGaussian and TfNear) is set to the midpoint of the
         value range of the input raster.midpoint (for TfLarge and TfSmall) is
         set to the mean of the input
         raster.minimum (for TfLinear, TfLogisticDecay, TfLogisticGrowth, and
         TfSymmetricLinear) is set to the Minimum of the input raster.shift
         (for TfExponential, TfLogarithm, and TfPower) is derived from
         the input raster.spread (for TfGaussian and TfNear) is derived from
         the input raster.spread (for TfLarge and TfSmall) is 5.STDMultiplier
         (for TfMSLarge and TFMSSmall) is 1.upperThreshold (for all functions)
         is set to the Maximum of the input
         raster.valueAboveThreshold (for all functions) is set to the to_scale
         value.valueBelowThreshold (for all functions) is set to the
         value.yInterceptPercent (for TfLogisticDecay) is
         99.0000.yInterceptPercent (for TfLogisticGrowth) is 1.0000.
     from_scale {Double}:
         The starting value of the output evaluation scale.The from_scale value
         cannot be equal to the to_scale value. The
         from_scale can be lower or higher than the to_scale (for example, from
         1 to 10, or from 10 to 1).The value must be positive and it can be
         either an integer or double.The default is 1.
     to_scale {Double}:
         The ending value of the output evaluation scale.The to_scale value
         cannot be equal to the from_scale value. The
         to_scale can be lower or higher than the from_scale (for example, from
         1 to 10, or from 10 to 1).The value must be positive and it can be
         either an integer or double.The default is 10.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output rescaled raster.The output will be a floating-point raster
         with values ranging from
         (or within) the from_scale and the to_scale evaluation values."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, transformation_function, from_scale, to_scale):
        transformation_function = Utils.compoundParameterToString(
            transformation_function, ParameterClasses._TransformationFunction
        )
        out_raster = "#"
        result = arcpy.gp.RescaleByFunction_sa(in_raster, out_raster, transformation_function, from_scale, to_scale)
        return _wrapToolRaster("RescaleByFunction_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, transformation_function, from_scale, to_scale)


RescaleByFunction.__esri_toolname__ = "RescaleByFunction_sa"
RescaleByFunction.__esri_toolinfo__ = [
    "::::1",
    "Python::TfExponential|TfGaussian|TfLarge|TfLinear|TfLogarithm|TfLogisticDecay|TfLogisticGrowth|TfMSLarge|TfMSSmall|TfNear|TfPower|TfSmall|TfSymmetricLinear::",
    "::::4",
    "::::5",
]


def RoundDown(in_raster_or_constant) -> Raster:
    """RoundDown_sa(in_raster_or_constant)

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


RoundDown.__esri_toolname__ = "RoundDown_sa"
RoundDown.__esri_toolinfo__ = ["::::1"]


def RoundUp(in_raster_or_constant) -> Raster:
    """RoundUp_sa(in_raster_or_constant)

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


RoundUp.__esri_toolname__ = "RoundUp_sa"
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
    """Sample_sa(in_rasters;in_rasters..., in_location_data, out_table, {resampling_type}, {unique_id_field}, {process_as_multidimensional}, {acquisition_definition;acquisition_definition...}, {statistics_type}, {percentile_value}, {buffer_distance}, {layout}, {generate_feature_class})

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
        result = arcpy.gp.Sample_sa(
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


Sample.__esri_toolname__ = "Sample_sa"
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
    """SegmentMeanShift_sa(in_raster, {spectral_detail}, {spatial_detail}, {min_segment_size}, {band_indexes}, {max_segment_size})

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
        result = arcpy.gp.SegmentMeanShift_sa(
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


SegmentMeanShift.__esri_toolname__ = "SegmentMeanShift_sa"
SegmentMeanShift.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7"]


def SetNull(in_conditional_raster, in_false_raster_or_constant, where_clause="#") -> Raster:
    """SetNull_sa(in_conditional_raster, in_false_raster_or_constant, {where_clause})

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
        result = arcpy.gp.SetNull_sa(in_conditional_raster, in_false_raster_or_constant, out_raster, where_clause)
        return _wrapToolRaster("SetNull_sa", str(result.getOutput(0)))

    return Wrapper(in_conditional_raster, in_false_raster_or_constant, where_clause)


SetNull.__esri_toolname__ = "SetNull_sa"
SetNull.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def Shrink(
    in_raster, number_cells, zone_values, shrink_method: Literal["MORPHOLOGICAL", "DISTANCE", "#"] | None = "#"
) -> Raster:
    """Shrink_sa(in_raster, number_cells, zone_values;zone_values..., {shrink_method})

       Shrinks the selected zones by a specified number of cells by replacing
       them with the value of the cell that is most frequent in its
       neighborhood.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster for which the identified zones are to be shrunk.It
         must be of integer type.
     number_cells (Long):
         The number of cells by which to shrink each specified zone.The value
         must be an integer greater than 0.
     zone_values (Long):
         The list of zone values to shrink.The zone values must be integers.
         They can be in any order.
     shrink_method {String}:
         The method to use to shrink the selected zones.MORPHOLOGICAL-Uses a
         mathematical morphology method to shrink the
         zones. This is the default.DISTANCE-Uses a distance-based method to
         shrink the zones.The DISTANCE option supports parallelization, and can
         be controlled
         with the parallelProcessingFactor environment setting.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output generalized raster.The specified zones of the input raster
         will be shrunk by the
         specified number of cells.The output is always of integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, number_cells, zone_values, shrink_method):
        out_raster = "#"
        result = arcpy.gp.Shrink_sa(in_raster, out_raster, number_cells, zone_values, shrink_method)
        return _wrapToolRaster("Shrink_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, number_cells, zone_values, shrink_method)


Shrink.__esri_toolname__ = "Shrink_sa"
Shrink.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5"]


def Sin(in_raster_or_constant) -> Raster:
    """Sin_sa(in_raster_or_constant)

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


Sin.__esri_toolname__ = "Sin_sa"
Sin.__esri_toolinfo__ = ["::::1"]


def SinH(in_raster_or_constant) -> Raster:
    """SinH_sa(in_raster_or_constant)

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


SinH.__esri_toolname__ = "SinH_sa"
SinH.__esri_toolinfo__ = ["::::1"]


def Sink(in_flow_direction_raster) -> Raster:
    """Sink_sa(in_flow_direction_raster)

       Creates a raster identifying all sinks or areas of internal drainage.

    INPUTS:
     in_flow_direction_raster (Composite Geodataset):
         The input raster that shows the direction of flow out of each cell.The
         flow direction raster can be created using the Flow Direction
         tool, run using the default flow direction type D8.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster that shows all the sinks (areas of internal
         drainage) on the input surface.This output is of integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_flow_direction_raster):
        out_raster = "#"
        result = arcpy.gp.Sink_sa(in_flow_direction_raster, out_raster)
        return _wrapToolRaster("Sink_sa", str(result.getOutput(0)))

    return Wrapper(in_flow_direction_raster)


Sink.__esri_toolname__ = "Sink_sa"
Sink.__esri_toolinfo__ = ["::::1"]


def Slice(
    in_raster,
    number_zones="#",
    slice_type: Literal[
        "EQUAL_INTERVAL",
        "EQUAL_AREA",
        "NATURAL_BREAKS",
        "STANDARD_DEVIATION_MEAN_CENTERED",
        "STANDARD_DEVIATION_MEAN_BREAK",
        "DEFINED_INTERVAL",
        "GEOMETRIC_INTERVAL",
        "#",
    ]
    | None = "#",
    base_output_zone="#",
    nodata_to_value="#",
    class_interval_size="#",
) -> Raster:
    """Slice_sa(in_raster, {number_zones}, {slice_type}, {base_output_zone}, {nodata_to_value}, {class_interval_size})

       Slices or reclassifies the range of values of the input cells into
       zones (classes). The available data classification methods are equal
       interval, equal area (quantile), natural breaks, standard deviation
       (mean-centered), standard deviation (mean as a break), defined
       interval, and geometric interval.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster to be reclassified.
     number_zones {Long}:
         The number of zones that the input raster will be reclassified
         into.This parameter is required when the slice_type parameter value is
         EQUAL_AREA, EQUAL_INTERVAL, NATURAL_BREAKS, or GEOMETRIC_INTERVAL.When
         the slice_type parameter value is
         STANDARD_DEVIATION_MEAN_CENTERED, STANDARD_DEVIATION_MEAN_BREAK, or
         DEFINED_INTERVAL, the number_zones parameter is not supported. The
         number of output zones will be determined by the class_interval_size
         parameter value.
     slice_type {String}:
         Specifies the manner in which the input raster will be reclassified
         into zones.EQUAL_INTERVAL-The range of input values will be equally
         divided into
         the specified number of output zones to determine the class breaks.
         This is the default.EQUAL_AREA-The number of input cells will be
         equally divided into the
         specified number of output zones to determine the class breaks. Each
         zone will have a similar number of cells, indicating a similar amount
         of area.NATURAL_BREAKS-The class breaks will be determined in a way
         that
         minimizes the variance within classes and maximizes the variance
         between classes. The breaks are usually set at relatively big changes
         in the data values.STANDARD_DEVIATION_MEAN_CENTERED-The class breaks
         will be placed above
         and below the mean value at a specified interval size, such as 2, 1,
         or 0.5, in the unit of standard deviation, until reaching the minimum
         and maximum values of the input raster. Mean is not used as a break
         but centered by two class breaks. One break is at half of the
         specified interval size above the mean and the other is at half of the
         specified interval size below the mean. Standard deviation is
         calculated with the n-1 denominator, where n is the number of pixels
         with value.STANDARD_DEVIATION_MEAN_BREAK-The mean value will be used
         as a class
         break. Other class breaks will be placed above and below the mean
         value at a specified interval size, such as 2, 1, or 0.5, in the unit
         of standard deviation, until reaching the minimum and maximum values
         of the input raster. Standard deviation is calculated with the n-1
         denominator, where n is the number of pixels with
         value.DEFINED_INTERVAL-The class breaks will be set to zero and a
         multiple
         of the specified interval size relative to zero. They will then be
         clipped to the minimum and maximum values of the input data for the
         first and last classes. For a value range that contains zero, zero
         will always be included as a break point.GEOMETRIC_INTERVAL-The class
         breaks will be created based on class
         intervals that have a geometric series. This is a pattern in which the
         current value equals the previous value divided by a geometric
         coefficient. The geometric coefficient in this classifier can change
         once (to its inverse) to optimize the class ranges. The algorithm
         creates these geometrical intervals by minimizing the sum of squares
         of the number of elements in each class. This ensures that each class
         has approximately the same number of values and that the change
         between intervals is consistent.
     base_output_zone {Long}:
         The starting value that will be used for zones (classes) on the output
         raster dataset.Classes will be assigned integer values, increasing by
         1 from the
         starting value.The default starting value is 1.
     nodata_to_value {Long}:
         Replace NoData with a value in the output.If this parameter is not
         set, NoData cells will remain as NoData in
         the output raster.
     class_interval_size {Double}:
         The size of the interval between classes.This parameter is required
         when the slice_type parameter is set to
         DEFINED_INTERVAL, STANDARD_DEVIATION_MEAN_CENTERED, or
         STANDARD_DEVIATION_MEAN_BREAK.If DEFINED_INTERVAL is used, the
         interval size indicates the actual
         value range of a class used to calculate class breaks.If
         STANDARD_DEVIATION_MEAN_CENTERED or STANDARD_DEVIATION_MEAN_BREAK
         is used, the interval size indicates the number of standard deviations
         used to calculate class breaks.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output reclassified raster.The output will always be of integer
         type. The attribute table of the output raster will have two
         new
         fields in addition to the standard,, andfields. Thefield indicates the
         class value. Theandfields record the minimum and maximum values,
         respectively, used for generating a class.
         ObjectIDValueCountValueZoneMinZoneMax"""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, number_zones, slice_type, base_output_zone, nodata_to_value, class_interval_size):
        out_raster = "#"
        result = arcpy.gp.Slice_sa(
            in_raster, out_raster, number_zones, slice_type, base_output_zone, nodata_to_value, class_interval_size
        )
        return _wrapToolRaster("Slice_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, number_zones, slice_type, base_output_zone, nodata_to_value, class_interval_size)


Slice.__esri_toolname__ = "Slice_sa"
Slice.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7"]


def Slope(
    in_raster,
    output_measurement: Literal["DEGREE", "PERCENT_RISE", "#"] | None = "#",
    z_factor="#",
    method: Literal["PLANAR", "GEODESIC", "#"] | None = "#",
    z_unit: Literal[
        "INCH",
        "FOOT",
        "YARD",
        "MILE_US",
        "NAUTICAL_MILE",
        "MILLIMETER",
        "CENTIMETER",
        "METER",
        "KILOMETER",
        "DECIMETER",
        "#",
    ]
    | None = "#",
    analysis_target_device: Literal["GPU_THEN_CPU", "GPU_ONLY", "CPU_ONLY", "#"] | None = "#",
) -> Raster:
    """Slope_sa(in_raster, {output_measurement}, {z_factor}, {method}, {z_unit}, {analysis_target_device})

       Identifies the slope (gradient or steepness) from each cell of a
       raster.

    INPUTS:
     in_raster (Composite Geodataset):
         The input surface raster.
     output_measurement {String}:
         Specifies the measurement units (degrees or percentages) of the output
         slope raster.DEGREE-The inclination of slope will be calculated in
         degrees.PERCENT_RISE-The inclination of slope will be calculated as
         percent
         rise, also referred to as the percent slope.
     z_factor {Double}:
         The number of ground x,y units in one surface z-unit.The z-factor
         adjusts the units of measure for the z-units when they
         are different from the x,y units of the input surface. The z-values of
         the input surface are multiplied by the z-factor when calculating the
         final output surface.If the x,y units and z-units are in the same
         units of measure, the
         z-factor is 1. This is the default.If the x,y units and z-units are in
         different units of measure, the
         z-factor must be set to the appropriate factor or the results will be
         incorrect. For example, if the z-units are feet and the x,y units are
         meters, use a z-factor of 0.3048 to convert the z-units from feet to
         meters (1 foot = 0.3048 meter).
     method {String}:
         Specifies whether the calculation will be based on a planar (flat
         earth) or a geodesic (ellipsoid) method.PLANAR-The calculation will be
         performed on a projected flat plane
         using a 2D Cartesian coordinate system. This is the default
         method.GEODESIC-The calculation will be performed in a 3D Cartesian
         coordinate system by considering the shape of the earth as an
         ellipsoid.The planar method is appropriate to use on local areas in a
         projection
         that maintains correct distance and area. It is suitable for analyses
         that cover areas such cities, counties, or smaller states in area. The
         geodesic method produces a more accurate result, at the potential cost
         of an increase in processing time.
     z_unit {String}:
         Specifies the linear unit that will be used for vertical z-values.It
         is defined by a vertical coordinate system if it exists. If no
         vertical coordinate system exists, define the z-unit using the unit
         list to ensure correct geodesic computation. The default is
         meter.INCH-The linear unit will be inches.FOOT-The linear unit will be
         feet.YARD-The linear unit will be yards.MILE_US-The linear unit will
         be miles.NAUTICAL_MILE-The linear unit will be nautical
         miles.MILLIMETER-The linear unit will be millimeters.CENTIMETER-The
         linear unit will be centimeters.METER-The linear unit will be
         meters.KILOMETER-The linear unit will be kilometers.DECIMETER-The
         linear unit will be decimeters.
     analysis_target_device {String}:
         Specifies the device that will be used to perform the
         calculation.GPU_THEN_CPU-If a compatible GPU is found, it will be used
         to perform
         the calculation. Otherwise, the CPU will be used. This is the
         default.CPU_ONLY-The calculation will only be performed on the
         CPU.GPU_ONLY-The calculation will only be performed on the GPU.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output slope raster.It will be floating-point type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, output_measurement, z_factor, method, z_unit, analysis_target_device):
        # in_raster
        in_raster = ApplyEnvironment(in_raster)  # needed for image service input
        rfx_args = {}
        # output_measurement
        if "PERCENT_RISE" in str(output_measurement).upper():
            rfx_args["SlopeType"] = 2  # Percent rise
        elif str(output_measurement).upper() in ["DEGREE", "#", ""]:
            rfx_args["SlopeType"] = 1  # Degrees
        else:
            msgs = Utils.ParameterErrors()
            msgs.add_id_message("ERROR", 581)  # Invalid parameters.
            msgs.add_id_message("INFO", 952, "Slope")  # Failed to execute (<tool name>).
            raise arcpy.ExecuteError(msgs.combine())
        # analysis target device
        if "CPU_ONLY" in str(analysis_target_device).upper():
            rfx_args["AnalysisTargetDevice"] = 2  # CPU Only
        elif "GPU_ONLY" in str(analysis_target_device).upper():
            rfx_args["AnalysisTargetDevice"] = 3  # GPU Only
        elif str(analysis_target_device).upper() in ["GPU_THEN_CPU", "#", ""]:
            rfx_args["AnalysisTargetDevice"] = 1  # GPU then CPU
        else:
            msgs = Utils.ParameterErrors()
            msgs.add_id_message("ERROR", 581)  # Invalid parameters.
            msgs.add_id_message("INFO", 952, "Slope")  # Failed to execute (<tool name>).
            raise arcpy.ExecuteError(msgs.combine())
        # z_factor
        linear_unit_factors = {
            "INCH": 0.025400050800101603,
            "INCH_US": 0.025400050800101603,
            "POINT": 0.00035277777777777776,
            "FOOT": 0.30480060960121924,
            "FOOT_US": 0.30480060960121924,
            "YARD": 0.91440182880365761,
            "YARD_US": 0.91440182880365761,
            "MILE_US": 1609.3472186944375,
            "NAUTICAL_MILE": 1853.248,
            "NAUTICAL_MILE_US": 1853.248,
            "MILLIMETER": 0.001,
            "CENTIMETER": 0.01,
            "DECIMETER": 0.1,
            "METER": 1,
            "KILOMETER": 1000,
        }
        z_meters_per_unit = None
        in_spatial_reference = None
        try:
            in_spatial_reference = arcpy.Describe(in_raster).spatialReference
            vcs = in_spatial_reference.vcs
            zlu = str(vcs.linearUnitName).upper()
            z_meters_per_unit = linear_unit_factors[zlu]
            try:
                # PCS
                xy_meters_per_unit = float(in_spatial_reference.metersPerUnit)
            except AttributeError:
                # GCS
                radians_per_unit = float(in_spatial_reference.radiansPerUnit)
                extent = arcpy.Raster(in_raster).extent
                extent.projectAs(in_spatial_reference)
                mean_latitude = 0.5 * (extent.YMin + extent.YMax)
                latitude_radians = mean_latitude * radians_per_unit
                a = float(in_spatial_reference.semiMajorAxis)
                b = float(in_spatial_reference.semiMinorAxis)
                e2 = (a**2 - b**2) / a**2  # ellipsoid eccentricity squared
                # Convert using mean Gaussian curvature at extent centroid latitude
                import math

                s = math.sin(latitude_radians)
                gaussian_radius = a * ((1.0 - e2) ** 0.5) / (1.0 - e2 * s**2)
                xy_meters_per_unit = gaussian_radius * radians_per_unit
            z_factor = z_meters_per_unit / xy_meters_per_unit
        except AttributeError:
            pass
        try:
            rfx_args["ZFactor"] = float(z_factor)
        except ValueError:
            if str(z_factor) in ["#", ""]:
                rfx_args["ZFactor"] = 1.0
            else:
                msgs = Utils.ParameterErrors()
                msgs.add_id_message("ERROR", 581)  # Invalid parameters.
                msgs.add_id_message("INFO", 952, "Slope")  # Failed to execute (<tool name>).
                raise arcpy.ExecuteError(msgs.combine())
        # method
        if "GEODESIC" in str(method).upper():
            rfx_name = "GeodesicSlope"
            if in_spatial_reference is None or in_spatial_reference.name == "Unknown":
                msgs = Utils.ParameterErrors()
                msgs.add_id_message(
                    "ERROR", 10472
                )  # The Geodesic method needs a spatial reference but the input dataset does not have one.
                msgs.add_id_message("ERROR", 581)  # Invalid parameters.
                msgs.add_id_message("INFO", 952, "Slope")  # Failed to execute (<tool name>).
                raise arcpy.ExecuteError(msgs.combine())
        elif str(method).upper() in ["PLANAR", "#", ""]:
            rfx_name = "Slope"
        else:
            msgs = Utils.ParameterErrors()
            msgs.add_id_message("ERROR", 581)  # Invalid parameters.
            msgs.add_id_message("INFO", 952, "Slope")  # Failed to execute (<tool name>).
            raise arcpy.ExecuteError(msgs.combine())
        # z_unit
        zu_str = str(z_unit).upper()
        if zu_str in linear_unit_factors:
            new_zmpu = linear_unit_factors[str(z_unit).upper()]
            if z_meters_per_unit is not None and z_meters_per_unit != new_zmpu:
                msgs = Utils.ParameterErrors()
                msgs.add_id_message("INFO", 583)  # Failed to execute. Parameters are not valid.
                msgs.add_id_message(
                    "ERROR", 10515
                )  # The Z unit parameter is inconsistent with the vertical unit in the input dataset's spatial reference.
                msgs.add_id_message("INFO", 952, "Slope")  # Failed to execute (<tool name>).
                raise arcpy.ExecuteError(msgs.combine())
            z_meters_per_unit = new_zmpu
        elif zu_str not in ["#", ""]:
            msgs = Utils.ParameterErrors()
            msgs.add_id_message("ERROR", 581)  # Invalid parameters.
            msgs.add_id_message("INFO", 952, "Slope")  # Failed to execute (<tool name>).
            raise arcpy.ExecuteError(msgs.combine())
        if z_meters_per_unit is None:
            z_meters_per_unit = 1.0
        rfx_args["ZMetersPerUnit"] = float(z_meters_per_unit)
        result = arcpy.sa.Apply(in_raster, rfx_name, rfx_args)
        return ApplyEnvironment(result)  # Needed for layer to get added in Pro

    return Wrapper(in_raster, output_measurement, z_factor, method, z_unit, analysis_target_device)


Slope.__esri_toolname__ = "Slope_sa"
Slope.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7"]


def SnapPourPoint(in_pour_point_data, in_accumulation_raster, snap_distance, pour_point_field="#") -> Raster:
    """SnapPourPoint_sa(in_pour_point_data, in_accumulation_raster, snap_distance, {pour_point_field})

       Snaps pour points to the cell of highest flow accumulation within a
       specified distance.

    INPUTS:
     in_pour_point_data (Composite Geodataset):
         The input pour point locations that are to be snapped.For a raster
         input, all cells that are not NoData (that is, have a
         value) will be considered pour points and will be snapped.For a point
         feature input, this specifies the locations of cells that
         will be snapped.
     in_accumulation_raster (Composite Geodataset):
         The input flow accumulation raster.This can be created with the Flow
         Accumulation tool.
     snap_distance (Double):
         Maximum distance, in map units, to search for a cell of higher
         accumulated flow.
     pour_point_field {Field}:
         The field used to assign values to the pour point locations. If
         the pour point dataset is a raster, use. ValueIf the pour point
         dataset is a feature, use a numeric field. If the
         field contains floating-point values, they will be truncated into
         integers.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output pour point raster where the original pour point locations
         have been snapped to locations of higher accumulated flow.This output
         is of integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_pour_point_data, in_accumulation_raster, snap_distance, pour_point_field):
        out_raster = "#"
        result = arcpy.gp.SnapPourPoint_sa(
            in_pour_point_data, in_accumulation_raster, out_raster, snap_distance, pour_point_field
        )
        return _wrapToolRaster("SnapPourPoint_sa", str(result.getOutput(0)))

    return Wrapper(in_pour_point_data, in_accumulation_raster, snap_distance, pour_point_field)


SnapPourPoint.__esri_toolname__ = "SnapPourPoint_sa"
SnapPourPoint.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5"]


def SolarRadiationGraphics(
    in_surface_raster,
    in_points_feature_or_table="#",
    sky_size="#",
    height_offset="#",
    calculation_directions="#",
    latitude="#",
    time_configuration="#",
    day_interval="#",
    hour_interval="#",
    out_sunmap_raster="#",
    zenith_divisions="#",
    azimuth_divisions="#",
    out_skymap_raster="#",
) -> Raster:
    """SolarRadiationGraphics_sa(in_surface_raster, {in_points_feature_or_table}, {sky_size}, {height_offset}, {calculation_directions}, {latitude}, {time_configuration}, {day_interval}, {hour_interval}, {out_sunmap_raster}, {zenith_divisions}, {azimuth_divisions}, {out_skymap_raster})

       Derives raster representations of a hemispherical viewshed, sun map,
       and sky map, which are used in the calculation of direct, diffuse, and
       global solar radiation.

    INPUTS:
     in_surface_raster (Composite Geodataset):
         The input elevation surface raster.
     in_points_feature_or_table {Table View}:
         The input point feature class or table containing the locations where
         solar radiation will be analyzed.
     sky_size {Long}:
         The resolution or sky size for the viewshed, sky map, and sun map
         rasters. The units are cells.The default is a raster of 200 by 200
         cells.
     height_offset {Double}:
         The height (in meters) above the DEM surface for which calculations
         will be performed.The height offset will be applied to all input
         locations.
     calculation_directions {Long}:
         The number of azimuth directions that will be used when calculating
         the viewshed.Valid values must be multiples of 8 (8, 16, 24, 32, and
         so on). The
         default value is 32 directions, which is adequate for complex
         topography.
     latitude {Double}:
         The latitude for the site area. The units are decimal degrees with
         positive values for the northern hemisphere and negative values for
         the southern hemisphere.For input surface rasters containing a spatial
         reference, the mean
         latitude is automatically calculated; otherwise, the latitude default
         is 45 degrees.
     time_configuration {Time configuration}:
         Specifies the time configuration (period) that will be used for
         calculating solar radiation.The Time class objects will be used to
         specify the time configuration.The different types of time
         configurations available are
         TimeWithinDay, TimeMultipleDays, TimeSpecialDays, and
         TimeWholeYear.The following are the forms:TimeWithinDay({day},{startTi
         me},{endTime})TimeMultipleDays({year},{sta
         rtDay},{endDay})TimeSpecialDays()TimeWholeYear({year})The default time
         configuration is TimeMultipleDays with the startDay
         value of 5 and the endDay value of 160 for the current Julian year.
     day_interval {Long}:
         The time interval through the year (units: days) that will be used to
         calculate sky sectors for the sun map.The default value is 14
         (biweekly).
     hour_interval {Double}:
         The time interval through the day (units: hours) that will be used to
         calculate sky sectors for the sun map.The default value is 0.5.
     zenith_divisions {Long}:
         The number of zenith divisions that will be used to create sky sectors
         in the sky map.The default is eight divisions (relative to zenith).
         Values must be
         greater than zero and less than half the sky size value.
     azimuth_divisions {Long}:
         The number of azimuth divisions that will be used to create sky
         sectors in the sky map.The default is eight divisions (relative to
         north). Valid values must
         be multiples of 8. Values must be greater than zero and less than 160.

    OUTPUTS:
     out_viewshed_raster (Raster Dataset):
         The output viewshed raster.The resulting viewshed for a location
         represents which sky directions
         are visible and which are obscured. This is similar to the view
         provided by upward-looking hemispherical (fisheye) photographs.
     out_sunmap_raster {Raster Dataset}:
         The output sun map raster.The output is a representation that
         specifies sun tracks, the apparent
         position of the sun as it varies through time. The output is at the
         same resolution as the viewshed and sky map.
     out_skymap_raster {Raster Dataset}:
         The output sky map raster.The output is constructed by dividing the
         whole sky into a series of
         sky sectors defined by zenith and azimuth divisions. The output is at
         the same resolution as the viewshed and sun map."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_surface_raster,
        in_points_feature_or_table,
        sky_size,
        height_offset,
        calculation_directions,
        latitude,
        time_configuration,
        day_interval,
        hour_interval,
        out_sunmap_raster,
        zenith_divisions,
        azimuth_divisions,
        out_skymap_raster,
    ):
        time_configuration = Utils.compoundParameterToString(time_configuration, ParameterClasses._Time)
        out_viewshed_raster = "#"
        result = arcpy.gp.SolarRadiationGraphics_sa(
            in_surface_raster,
            out_viewshed_raster,
            in_points_feature_or_table,
            sky_size,
            height_offset,
            calculation_directions,
            latitude,
            time_configuration,
            day_interval,
            hour_interval,
            out_sunmap_raster,
            zenith_divisions,
            azimuth_divisions,
            out_skymap_raster,
        )
        return _wrapToolRaster("SolarRadiationGraphics_sa", str(result.getOutput(0)))

    return Wrapper(
        in_surface_raster,
        in_points_feature_or_table,
        sky_size,
        height_offset,
        calculation_directions,
        latitude,
        time_configuration,
        day_interval,
        hour_interval,
        out_sunmap_raster,
        zenith_divisions,
        azimuth_divisions,
        out_skymap_raster,
    )


SolarRadiationGraphics.__esri_toolname__ = "SolarRadiationGraphics_sa"
SolarRadiationGraphics.__esri_toolinfo__ = [
    "::::1",
    "::::3",
    "::::4",
    "::::5",
    "::::6",
    "::::7",
    "Python::TimeMultipleDays|TimeSpecialDays|TimeWholeYear|TimeWithinDay::",
    "::::9",
    "::::10",
    "::::11",
    "::::12",
    "::::13",
    "::::14",
]


def SpaceTimeKernelDensity(
    in_features,
    population_field,
    elevation_field="#",
    elevation_field_unit: Literal[
        "INCH",
        "FOOT",
        "YARD",
        "MILE_US",
        "NAUTICAL_MILE",
        "MILLIMETER",
        "CENTIMETER",
        "METER",
        "KILOMETER",
        "DECIMETER",
        "#",
    ]
    | None = "#",
    time_field="#",
    cell_size="#",
    kernel_search_radius_xy="#",
    kernel_search_radius_z="#",
    kernel_search_time_window="#",
    resultant_values: Literal["DENSITIES", "EXPECTED_COUNTS", "#"] | None = "#",
    method: Literal["PLANAR", "GEODESIC", "#"] | None = "#",
    min_elevation="#",
    max_elevation="#",
    elevation_interval="#",
    elevation_unit: Literal[
        "INCH",
        "FOOT",
        "YARD",
        "MILE_US",
        "NAUTICAL_MILE",
        "MILLIMETER",
        "CENTIMETER",
        "METER",
        "KILOMETER",
        "DECIMETER",
        "#",
    ]
    | None = "#",
    start_time="#",
    end_time="#",
    time_interval="#",
    time_interval_unit: Literal["SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "#"] | None = "#",
    out_voxel_layer="#",
) -> Raster:
    """SpaceTimeKernelDensity_sa(in_features, population_field, {elevation_field}, {elevation_field_unit}, {time_field}, {cell_size}, {kernel_search_radius_xy}, {kernel_search_radius_z}, {kernel_search_time_window}, {resultant_values}, {method}, {min_elevation}, {max_elevation}, {elevation_interval}, {elevation_unit}, {start_time}, {end_time}, {time_interval}, {time_interval_unit}, {out_voxel_layer})

       Expands kernel density calculations from analyzing the relative
       position and magnitude of the input features to include other
       dimensions such as time and depth (elevation). The resulting output
       identifies the magnitude-per-unit area using the multiple kernel
       functions to fit a smoothly tapered surface to each input point.

    INPUTS:
     in_features (Composite Geodataset):
         The input point features for which density will be calculated.
     population_field (Field):
         The field denoting population values for each feature. The population
         is the count or quantity to be spread across the landscape to create a
         continuous surface.Values in the population field can be integer or
         floating point.Use '' if no item or special value will be used and
         each feature will
         be counted once.
     elevation_field {Field}:
         The field denoting elevation values for each feature.Values in the
         elevation field can be integer or floating point.Use '' to support 3D
         kernel density with time. For 3D features, a pseudo field,,
         will be added to the field
         list. Shape.Z
     elevation_field_unit {String}:
         Specifies the unit of measure that will be used for the input
         elevation field value. The default is meters.Use the appropriate unit
         to represent the values in the
         elevation_field parameter value.INCH-Inches will be used.FOOT-Feet
         will be used.YARD-Yards will be
         used.MILE_US-U.S. miles will be used.NAUTICAL_MILE-Nautical miles will
         be used.MILLIMETER-Millimeters will be used.CENTIMETER-Centimeters
         will be used.METER-Meters will be used.KILOMETER-Kilometers will be
         used.DECIMETER-Decimeters will be used.
     time_field {Field}:
         The field denoting time values for each feature.
     cell_size {Analysis Cell Size}:
         The cell size of the multidimensional raster output that will be
         created.The value can be defined by a numeric value or obtained from
         an
         existing raster dataset. If no cell size is provided, the environment
         cell size value will be used if specified; otherwise, additional rules
         will be used to calculate it from the other inputs. See the tool usage
         for details.
     kernel_search_radius_xy {Linear Unit}:
         The search radius on the x,y plane within which density will be
         calculated.Provide the value and the appropriate units. For example,
         to include
         all features within a 1-mile neighborhood when the units are meters,
         set the search radius to 1609.344 (1 mile = 1609.344 meters).By
         default, the units are based on the linear unit of the output
         spatial reference.
     kernel_search_radius_z {Linear Unit}:
         The vertical search distance in the z-direction within which density
         will be calculated. This vertical distance will be used to search for
         features in the upward and downward directions along the
         z-axis.Provide the value and the appropriate units.
     kernel_search_time_window {Time Unit}:
         The search range of time within which density will be
         calculated.Provide the value and the appropriate units.
     resultant_values {String}:
         Specifies what the values in the output raster will represent.Since
         the output cell value is related to the specified cell size, the
         resulting raster cannot be resampled to a different cell
         size.DENSITIES-The output values will represent the calculated density
         value per unit area for each cell. This is the
         default.EXPECTED_COUNTS-The output values will represent the
         calculated
         density value per cell area.
     method {String}:
         Specifies whether the flat earth (planar) or the shortest path on a
         spheroid (geodesic) method will be used.PLANAR-The planar distance
         between features will be used. This is the
         default.GEODESIC-The geodesic distance between features will be used.
     min_elevation {Double}:
         The minimum (lowest) elevation that will be used for the
         multidimensional raster output.
     max_elevation {Double}:
         The maximum (highest) elevation that will be used for the
         multidimensional raster output.
     elevation_interval {Double}:
         The elevation interval between slices in the multidimensional raster
         output.The value must be greater than zero.
     elevation_unit {String}:
         Specifies the unit of elevation interval that will be used for the
         multidimensional raster output. The default is meter.INCH-Inches will
         be used.FOOT-Feet will be used.YARD-Yards will be
         used.MILE_US-U.S. miles will be used.NAUTICAL_MILE-Nautical miles will
         be used.MILLIMETER-Millimeters will be used.CENTIMETER-Centimeters
         will be used.METER-Meters will be used.KILOMETER-Kilometers will be
         used.DECIMETER-Decimeters will be used.
     start_time {Date}:
         The start time that will be used for the multidimensional raster
         output.
     end_time {Date}:
         The end time that will be used for the multidimensional raster output.
     time_interval {Double}:
         The time interval between slices in the multidimensional raster
         output.The value must be greater than zero.
     time_interval_unit {String}:
         Specifies the unit of the time interval that will be used for the
         multidimensional raster output. The default is day.SECOND-The time
         interval unit will be seconds.MINUTE-The time interval
         unit will be minutes.HOUR-The time interval unit will be hours.DAY-The
         time interval unit will be days.WEEK-The time interval unit will be
         weeks.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output kernel density multidimensional raster dataset.The file
         name extension determines the format of the output. Use .crf
         to create a CRF raster. Use .nc to create a netCDF raster. The default
         output is a CRF raster.It is always a floating point raster.
     out_voxel_layer {Voxel Layer}:
         The output voxel layer based on volumetric data stored in the output
         netCDF raster.This output type can only be created when the out_raster
         parameter is
         set to create a netCDF raster with the .nc extension."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_features,
        population_field,
        elevation_field,
        elevation_field_unit,
        time_field,
        cell_size,
        kernel_search_radius_xy,
        kernel_search_radius_z,
        kernel_search_time_window,
        resultant_values,
        method,
        min_elevation,
        max_elevation,
        elevation_interval,
        elevation_unit,
        start_time,
        end_time,
        time_interval,
        time_interval_unit,
        out_voxel_layer,
    ):
        out_raster = "#"
        result = arcpy.gp.SpaceTimeKernelDensity_sa(
            in_features,
            population_field,
            out_raster,
            elevation_field,
            elevation_field_unit,
            time_field,
            cell_size,
            kernel_search_radius_xy,
            kernel_search_radius_z,
            kernel_search_time_window,
            resultant_values,
            method,
            min_elevation,
            max_elevation,
            elevation_interval,
            elevation_unit,
            start_time,
            end_time,
            time_interval,
            time_interval_unit,
            out_voxel_layer,
        )
        return _wrapToolRaster("SpaceTimeKernelDensity_sa", str(result.getOutput(0)))

    return Wrapper(
        in_features,
        population_field,
        elevation_field,
        elevation_field_unit,
        time_field,
        cell_size,
        kernel_search_radius_xy,
        kernel_search_radius_z,
        kernel_search_time_window,
        resultant_values,
        method,
        min_elevation,
        max_elevation,
        elevation_interval,
        elevation_unit,
        start_time,
        end_time,
        time_interval,
        time_interval_unit,
        out_voxel_layer,
    )


SpaceTimeKernelDensity.__esri_toolname__ = "SpaceTimeKernelDensity_sa"
SpaceTimeKernelDensity.__esri_toolinfo__ = [
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
    "::::16",
    "::::17",
    "::::18",
    "::::19",
    "::::20",
    "::::21",
]


def Spline(
    in_point_features,
    z_field,
    cell_size="#",
    spline_type: Literal["REGULARIZED", "TENSION", "#"] | None = "#",
    weight="#",
    number_points="#",
) -> Raster:
    """Spline_sa(in_point_features, z_field, {cell_size}, {spline_type}, {weight}, {number_points})

       Interpolates a raster surface from points using a two-dimensional
       minimum curvature spline technique.

    INPUTS:
     in_point_features (Composite Geodataset):
         The input point features containing the z-values to be interpolated
         into a surface raster.
     z_field (Field):
         The field that holds a height or magnitude value for each point.This
         can be a numeric field or the Shape field if the input point
         features contain z-values.
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     spline_type {String}:
         The type of spline to be used.REGULARIZED-Yields a smooth surface and
         smooth first
         derivatives.TENSION-Tunes the stiffness of the interpolant according
         to the
         character of the modeled phenomenon.
     weight {Double}:
         Parameter influencing the character of the surface interpolation.When
         the REGULARIZED option is used, it defines the weight of the
         third derivatives of the surface in the curvature minimization
         expression. If the TENSION option is used, it defines the weight of
         tension.The default weight is 0.1.
     number_points {Long}:
         The number of points per region used for local approximation.The
         default is 12.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output interpolated surface raster.It is always a floating-point
         raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_point_features, z_field, cell_size, spline_type, weight, number_points):
        out_raster = "#"
        result = arcpy.gp.Spline_sa(
            in_point_features, z_field, out_raster, cell_size, spline_type, weight, number_points
        )
        return _wrapToolRaster("Spline_sa", str(result.getOutput(0)))

    return Wrapper(in_point_features, z_field, cell_size, spline_type, weight, number_points)


Spline.__esri_toolname__ = "Spline_sa"
Spline.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "::::6", "::::7"]


def SplineWithBarriers(
    in_point_features, Z_value_field, Input_barrier_features="#", cell_size="#", Smoothing_Factor="#"
) -> Raster:
    """SplineWithBarriers_sa(in_point_features, Z_value_field, {Input_barrier_features}, {cell_size}, {Smoothing_Factor})

       Interpolates a raster surface, using barriers, from points using a
       minimum curvature spline technique. The barriers are entered as either
       polygon or polyline features.

    INPUTS:
     in_point_features (Composite Geodataset):
         The input point features containing the z-values to be interpolated
         into a surface raster.
     Z_value_field (Field):
         The field that holds a height or magnitude value for each point.This
         can be a numeric field or the Shape field if the input point
         features contain z-values.
     Input_barrier_features {Composite Geodataset}:
         The optional input barrier features to constrain the interpolation.
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     Smoothing_Factor {Double}:
         The parameter that influences the smoothing of the output surface.No
         smoothing is applied when the value is zero and the maximum amount
         of smoothing is applied when the factor equals 1.The default is 0.0.

    OUTPUTS:
     Output_raster (Raster Dataset):
         The output interpolated surface raster.It is always a floating-point
         raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_point_features, Z_value_field, Input_barrier_features, cell_size, Smoothing_Factor):
        Output_raster = "#"
        result = arcpy.gp.SplineWithBarriers_sa(
            in_point_features, Z_value_field, Input_barrier_features, cell_size, Output_raster, Smoothing_Factor
        )
        return _wrapToolRaster("SplineWithBarriers_sa", str(result.getOutput(0)))

    return Wrapper(in_point_features, Z_value_field, Input_barrier_features, cell_size, Smoothing_Factor)


SplineWithBarriers.__esri_toolname__ = "SplineWithBarriers_sa"
SplineWithBarriers.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::6"]


def Square(in_raster_or_constant) -> Raster:
    """Square_sa(in_raster_or_constant)

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


Square.__esri_toolname__ = "Square_sa"
Square.__esri_toolinfo__ = ["::::1"]


def SquareRoot(in_raster_or_constant) -> Raster:
    """SquareRoot_sa(in_raster_or_constant)

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


SquareRoot.__esri_toolname__ = "SquareRoot_sa"
SquareRoot.__esri_toolinfo__ = ["::::1"]


def StorageCapacity(
    in_surface_raster,
    out_table,
    in_zone_data="#",
    zone_field="#",
    analysis_type: Literal["AREA_VOLUME", "AREA", "VOLUME", "#"] | None = "#",
    min_elevation="#",
    max_elevation="#",
    increment_type: Literal["NUMBER_OF_INCREMENTS", "VALUE_OF_INCREMENT", "#"] | None = "#",
    increment="#",
    z_unit: Literal[
        "METER",
        "INCH",
        "FOOT",
        "YARD",
        "MILE_US",
        "NAUTICAL_MILE",
        "MILLIMETER",
        "CENTIMETER",
        "KILOMETER",
        "DECIMETER",
        "#",
    ]
    | None = "#",
    out_chart="#",
):
    """StorageCapacity_sa(in_surface_raster, out_table, {in_zone_data}, {zone_field}, {analysis_type}, {min_elevation}, {max_elevation}, {increment_type}, {increment}, {z_unit}, {out_chart})

       Creates a table and a chart of elevations and corresponding storage
       capacities for an input surface raster. The tool calculates the
       surface area and total volume of the underlying region at a series of
       elevation increments.

    INPUTS:
     in_surface_raster (Raster Layer):
         The input raster representing a continuous surface.
     in_zone_data {Raster Layer / Feature Layer}:
         The dataset that defines the zones.The zones can be defined by an
         integer raster or a feature layer.
     zone_field {Field}:
         The field that contains the values that define each zone.It can be an
         integer or a string field of the zone dataset.
     analysis_type {String}:
         Specifies the analysis type.AREA_VOLUME-Both surface areas and total
         volumes are calculated at
         each elevation increment. This is the default.AREA-Surface area is
         calculated at each elevation increment.VOLUME-Total volume is
         calculated at each elevation increment.
     min_elevation {Double}:
         The minimum elevation from which storage capacities are assessed.By
         default, the tool uses the minimum surface raster value in each
         zone as the minimum elevation for that zone. If a value is provided,
         it is used as the minimum elevation across all zones.
     max_elevation {Double}:
         The maximum elevation from which storage capacities are assessed.By
         default, the tool uses the maximum surface raster value in each
         zone as the maximum elevation for that zone. If a value is provided,
         it is used as the maximum elevation across all zones.
     increment_type {String}:
         Specifies the increment type to use when computing elevation
         increments between minimum and maximum
         elevations.NUMBER_OF_INCREMENTS-The number of increments between
         minimum and
         maximum elevations is used. This is the default.VALUE_OF_INCREMENT-The
         elevation difference between each increment is
         used.
     increment {Double}:
         An incremental value that is either the number of increments or the
         difference in elevation between increments. The value is determined
         based on the increment type parameter value.
     z_unit {String}:
         Specifies the linear unit that will be used for vertical
         z-values.INCH-The linear unit will be inches.FOOT-The linear unit will
         be
         feet.YARD-The linear unit will be yards.MILE_US-The linear unit will
         be miles.NAUTICAL_MILE-The linear unit will be nautical
         miles.MILLIMETER-The linear unit will be millimeters.CENTIMETER-The
         linear unit will be centimeters.METER-The linear unit will be
         meters.KILOMETER-The linear unit will be kilometers.DECIMETER-The
         linear unit will be decimeters.
     out_chart {String}:
         The name of the output chart for display.

    OUTPUTS:
     out_table (Table):
         The output table that contains for each zone the surface area and
         total volumes for each increment in elevation."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_surface_raster,
        out_table,
        in_zone_data,
        zone_field,
        analysis_type,
        min_elevation,
        max_elevation,
        increment_type,
        increment,
        z_unit,
        out_chart,
    ):
        result = arcpy.gp.StorageCapacity_sa(
            in_surface_raster,
            out_table,
            in_zone_data,
            zone_field,
            analysis_type,
            min_elevation,
            max_elevation,
            increment_type,
            increment,
            z_unit,
            out_chart,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_surface_raster,
        out_table,
        in_zone_data,
        zone_field,
        analysis_type,
        min_elevation,
        max_elevation,
        increment_type,
        increment,
        z_unit,
        out_chart,
    )


StorageCapacity.__esri_toolname__ = "StorageCapacity_sa"
StorageCapacity.__esri_toolinfo__ = [
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


def StreamLink(in_stream_raster, in_flow_direction_raster) -> Raster:
    """StreamLink_sa(in_stream_raster, in_flow_direction_raster)

       Assigns unique values to sections of a raster linear network between
       intersections.

    INPUTS:
     in_stream_raster (Composite Geodataset):
         An input raster that represents a linear stream network.
     in_flow_direction_raster (Composite Geodataset):
         The input raster that shows the direction of flow out of each cell.The
         flow direction raster can be created using the Flow Direction
         tool, run using the default flow direction type D8.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output stream link raster.This output is of integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_stream_raster, in_flow_direction_raster):
        out_raster = "#"
        result = arcpy.gp.StreamLink_sa(in_stream_raster, in_flow_direction_raster, out_raster)
        return _wrapToolRaster("StreamLink_sa", str(result.getOutput(0)))

    return Wrapper(in_stream_raster, in_flow_direction_raster)


StreamLink.__esri_toolname__ = "StreamLink_sa"
StreamLink.__esri_toolinfo__ = ["::::1", "::::2"]


def StreamOrder(
    in_stream_raster, in_flow_direction_raster, order_method: Literal["STRAHLER", "SHREVE", "#"] | None = "#"
) -> Raster:
    """StreamOrder_sa(in_stream_raster, in_flow_direction_raster, {order_method})

       Assigns a numeric order to segments of a raster representing branches
       of a linear network.

    INPUTS:
     in_stream_raster (Composite Geodataset):
         An input raster that represents a linear stream network.The input
         stream raster linear network should be represented as values
         greater than or equal to one on a background of NoData.
     in_flow_direction_raster (Composite Geodataset):
         The input raster that shows the direction of flow out of each cell.The
         flow direction raster can be created using the Flow Direction
         tool, run using the default flow direction type D8.
     order_method {String}:
         The method used for assigning stream order.STRAHLER-The method of
         stream ordering proposed by Strahler in 1952.
         Stream order only increases when streams of the same order intersect.
         Therefore, the intersection of a first-order and second-order link
         will remain a second-order link, rather than creating a third-order
         link. This is the default.SHREVE-The method of stream ordering by
         magnitude, proposed by Shreve
         in 1967. All links with no tributaries are assigned a magnitude
         (order) of one. Magnitudes are additive downslope. When two links
         intersect, their magnitudes are added and assigned to the downslope
         link.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output stream order raster.This output is of integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_stream_raster, in_flow_direction_raster, order_method):
        out_raster = "#"
        result = arcpy.gp.StreamOrder_sa(in_stream_raster, in_flow_direction_raster, out_raster, order_method)
        return _wrapToolRaster("StreamOrder_sa", str(result.getOutput(0)))

    return Wrapper(in_stream_raster, in_flow_direction_raster, order_method)


StreamOrder.__esri_toolname__ = "StreamOrder_sa"
StreamOrder.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def StreamToFeature(
    in_stream_raster,
    in_flow_direction_raster,
    out_polyline_features,
    simplify: Literal["SIMPLIFY", "NO_SIMPLIFY", "#"] | None = "#",
):
    """StreamToFeature_sa(in_stream_raster, in_flow_direction_raster, out_polyline_features, {simplify})

       Converts a raster representing a linear network to features
       representing the linear network.

    INPUTS:
     in_stream_raster (Composite Geodataset):
         An input raster that represents a linear stream network.
     in_flow_direction_raster (Composite Geodataset):
         The input raster that shows the direction of flow out of each cell.The
         flow direction raster can be created using the Flow Direction
         tool.
     simplify {Boolean}:
         Specifies whether weeding is used.SIMPLIFY-The feature is weeded to
         reduce the number of vertices. The
         Douglas-Puecker algorithm for line generalization is used with a
         tolerance of sqrt(0.5) * cell size.NO_SIMPLIFY-No weeding is
         applied.By default, weeding is applied.

    OUTPUTS:
     out_polyline_features (Feature Class):
         Output feature class that will hold the converted streams."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_stream_raster, in_flow_direction_raster, out_polyline_features, simplify):
        result = arcpy.gp.StreamToFeature_sa(
            in_stream_raster, in_flow_direction_raster, out_polyline_features, simplify
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_stream_raster, in_flow_direction_raster, out_polyline_features, simplify)


StreamToFeature.__esri_toolname__ = "StreamToFeature_sa"
StreamToFeature.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4"]


def SurfaceParameters(
    in_raster,
    parameter_type: Literal[
        "SLOPE",
        "ASPECT",
        "MEAN_CURVATURE",
        "PROFILE_CURVATURE",
        "TANGENTIAL_CURVATURE",
        "CONTOUR_CURVATURE",
        "CONTOUR_GEODESIC_TORSION",
        "GAUSSIAN_CURVATURE",
        "CASORATI_CURVATURE",
        "#",
    ]
    | None = "#",
    local_surface_type: Literal["QUADRATIC", "BIQUADRATIC", "#"] | None = "#",
    neighborhood_distance="#",
    use_adaptive_neighborhood: Literal["FIXED_NEIGHBORHOOD", "ADAPTIVE_NEIGHBORHOOD", "#"] | None = "#",
    z_unit: Literal[
        "INCH",
        "FOOT",
        "YARD",
        "MILE_US",
        "NAUTICAL_MILE",
        "MILLIMETER",
        "CENTIMETER",
        "METER",
        "KILOMETER",
        "DECIMETER",
        "#",
    ]
    | None = "#",
    output_slope_measurement: Literal["DEGREE", "PERCENT_RISE", "#"] | None = "#",
    project_geodesic_azimuths: Literal["GEODESIC_AZIMUTHS", "PROJECT_GEODESIC_AZIMUTHS", "#"] | None = "#",
    use_equatorial_aspect: Literal["NORTH_POLE_ASPECT", "EQUATORIAL_ASPECT", "#"] | None = "#",
    in_analysis_mask="#",
) -> Raster:
    """SurfaceParameters_sa(in_raster, {parameter_type}, {local_surface_type}, {neighborhood_distance}, {use_adaptive_neighborhood}, {z_unit}, {output_slope_measurement}, {project_geodesic_azimuths}, {use_equatorial_aspect}, {in_analysis_mask})

       Determines parameters of a raster surface such as aspect, slope, and
       curvatures.

    INPUTS:
     in_raster (Composite Geodataset):
         The input surface raster.
     parameter_type {String}:
         Specifies the output surface parameter type that will be
         computed.SLOPE-The rate of change in elevation will be computed. This
         is the
         default.ASPECT-The downslope direction of the maximum rate of change
         for each
         cell will be computed.MEAN_CURVATURE-The overall curvature of the
         surface will be measured.
         It is computed as the average of the minimum and maximum curvature.
         This curvature describes the intrinsic convexity or concavity of the
         surface, independent of direction or gravity
         influence.TANGENTIAL_CURVATURE-The geometric normal curvature
         perpendicular to
         the slope line, tangent to the contour line will be measured. This
         curvature is typically applied to characterize the convergence or
         divergence of flow across the surface.PROFILE_CURVATURE-The geometric
         normal curvature along the slope line
         will be measured. This curvature is typically applied to characterize
         the acceleration and deceleration of flow down the
         surface.CONTOUR_CURVATURE-The curvature along contour lines will be
         measured.CONTOUR_GEODESIC_TORSION-The rate of change in slope angle
         along
         contour lines will be measured.GAUSSIAN_CURVATURE-The overall
         curvature of the surface will be
         measured. It is computed as the product of the minimum and maximum
         curvature.CASORATI_CURVATURE-The general curvature of the surface will
         be
         measured. It can be zero or any other positive number.
     local_surface_type {String}:
         Specifies the type of surface function that will be fitted around the
         target cell.QUADRATIC-A quadratic surface function will be fitted to
         the
         neighborhood cells. This is the default.BIQUADRATIC-A biquadratic
         surface function will be fitted to the
         neighborhood cells.
     neighborhood_distance {Linear Unit}:
         The output will be calculated over this distance from the target cell
         center. It determines the neighborhood size.The default value is the
         input raster cell size, resulting in a 3 by 3
         neighborhood.
     use_adaptive_neighborhood {Boolean}:
         Specifies whether neighborhood distance will vary with landscape
         changes (adaptive). The maximum distance is determined by the
         neighborhood distance. The minimum distance is the input raster cell
         size.FIXED_NEIGHBORHOOD-A single (fixed) neighborhood distance will be
         used
         at all locations. This is the default.ADAPTIVE_NEIGHBORHOOD-An
         adaptive neighborhood distance will be used
         at all locations.
     z_unit {String}:
         Specifies the linear unit that will be used for vertical z-values.It
         is defined by a vertical coordinate system if it exists. If no
         vertical coordinate system exists, define the z-unit using the unit
         list to ensure correct geodesic computation. The default is
         meter.INCH-The linear unit will be inches.FOOT-The linear unit will be
         feet.YARD-The linear unit will be yards.MILE_US-The linear unit will
         be miles.NAUTICAL_MILE-The linear unit will be nautical
         miles.MILLIMETER-The linear unit will be millimeters.CENTIMETER-The
         linear unit will be centimeters.METER-The linear unit will be
         meters.KILOMETER-The linear unit will be kilometers.DECIMETER-The
         linear unit will be decimeters.
     output_slope_measurement {String}:
         The measurement units (degrees or percentages) that will be used for
         the output slope raster.DEGREE-The inclination of slope will be
         calculated in
         degrees.PERCENT_RISE-The inclination of slope will be calculated as
         percent
         rise, also referred to as the percent slope.This parameter is only
         supported if the parameter_type parameter is
         set to SLOPE.
     project_geodesic_azimuths {Boolean}:
         Specifies whether geodesic azimuths will be projected to correct the
         angle distortion caused by the output spatial
         reference.GEODESIC_AZIMUTHS-Geodesic azimuths will not be projected.
         This is the
         default.PROJECT_GEODESIC_AZIMUTHS-Geodesic azimuths will be
         projected.This parameter is only supported if the parameter_type
         parameter is
         set to ASPECT.
     use_equatorial_aspect {Boolean}:
         Specifies whether aspect will be measured from a point on the equator
         or from the north pole.NORTH_POLE_ASPECT-Aspect will be measured from
         the north pole. This is
         the default.EQUATORIAL_ASPECT-Aspect will be measured from a point on
         the equator.This parameter is only supported if the parameter_type
         parameter is
         set to ASPECT.
     in_analysis_mask {Composite Geodataset}:
         The input data defining the locations where the analysis will occur.It
         can be a raster or feature dataset. If the input is a raster, it
         can be integer or floating-point type. If the input is feature data,
         it can be point, line, or polygon type.When the input mask data is a
         raster, the analysis will occur at
         locations that have a valid value, including zero. Cells that are
         NoData in the mask input will be NoData in the output.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_raster,
        parameter_type,
        local_surface_type,
        neighborhood_distance,
        use_adaptive_neighborhood,
        z_unit,
        output_slope_measurement,
        project_geodesic_azimuths,
        use_equatorial_aspect,
        in_analysis_mask,
    ):
        out_raster = "#"
        result = arcpy.gp.SurfaceParameters_sa(
            in_raster,
            out_raster,
            parameter_type,
            local_surface_type,
            neighborhood_distance,
            use_adaptive_neighborhood,
            z_unit,
            output_slope_measurement,
            project_geodesic_azimuths,
            use_equatorial_aspect,
            in_analysis_mask,
        )
        return _wrapToolRaster("SurfaceParameters_sa", str(result.getOutput(0)))

    return Wrapper(
        in_raster,
        parameter_type,
        local_surface_type,
        neighborhood_distance,
        use_adaptive_neighborhood,
        z_unit,
        output_slope_measurement,
        project_geodesic_azimuths,
        use_equatorial_aspect,
        in_analysis_mask,
    )


SurfaceParameters.__esri_toolname__ = "SurfaceParameters_sa"
SurfaceParameters.__esri_toolinfo__ = [
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


def TabulateArea(
    in_zone_data,
    zone_field,
    in_class_data,
    class_field,
    out_table,
    processing_cell_size="#",
    classes_as_rows: Literal["CLASSES_AS_FIELDS", "CLASSES_AS_ROWS", "#"] | None = "#",
):
    """TabulateArea_sa(in_zone_data, zone_field, in_class_data, class_field, out_table, {processing_cell_size}, {classes_as_rows})

       Calculates cross-tabulated areas between two datasets and outputs a
       table.

    INPUTS:
     in_zone_data (Composite Geodataset):
         The dataset that defines the zones.The zones can be defined by an
         integer raster or a feature layer.
     zone_field (Field):
         The field that contains the values that define each zone.It can be an
         integer or a string field of the zone dataset.
     in_class_data (Composite Geodataset):
         The dataset that defines the classes that will have their area
         summarized within each zone.The class input can be an integer raster
         layer or a feature layer.
     class_field (Field):
         The field that holds the class values.It can be an integer or a string
         field of the input class data.
     processing_cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     classes_as_rows {Boolean}:
         Specifies how the values from the input class raster will be
         represented in the output table.CLASSES_AS_FIELDS-Classes will be
         represented as fields. This is the
         default.CLASSES_AS_ROWS-Classes will be represented as rows.

    OUTPUTS:
     out_table (Table):
         The output table that will contain the summary of the area of each
         class in each zone.The format of the table is determined by the output
         location and path.
         By default, the output will be a geodatabase table if in a geodatabase
         workspace, and a dBASE table if in a file workspace."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_zone_data, zone_field, in_class_data, class_field, out_table, processing_cell_size, classes_as_rows):
        result = arcpy.gp.TabulateArea_sa(
            in_zone_data, zone_field, in_class_data, class_field, out_table, processing_cell_size, classes_as_rows
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_zone_data, zone_field, in_class_data, class_field, out_table, processing_cell_size, classes_as_rows
    )


TabulateArea.__esri_toolname__ = "TabulateArea_sa"
TabulateArea.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6", "::::7"]


def Tan(in_raster_or_constant) -> Raster:
    """Tan_sa(in_raster_or_constant)

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


Tan.__esri_toolname__ = "Tan_sa"
Tan.__esri_toolinfo__ = ["::::1"]


def TanH(in_raster_or_constant) -> Raster:
    """TanH_sa(in_raster_or_constant)

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


TanH.__esri_toolname__ = "TanH_sa"
TanH.__esri_toolinfo__ = ["::::1"]


def Test(in_raster, where_clause) -> Raster:
    """Test_sa(in_raster, where_clause)

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
        result = arcpy.gp.Test_sa(in_raster, where_clause, out_raster)
        return _wrapToolRaster("Test_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, where_clause)


Test.__esri_toolname__ = "Test_sa"
Test.__esri_toolinfo__ = ["::::1", "::::2"]


def Thin(
    in_raster,
    background_value: Literal["ZERO", "NODATA", "#"] | None = "#",
    filter: Literal["NO_FILTER", "FILTER", "#"] | None = "#",
    corners: Literal["ROUND", "SHARP", "#"] | None = "#",
    maximum_thickness="#",
) -> Raster:
    """Thin_sa(in_raster, {background_value}, {filter}, {corners}, {maximum_thickness})

       Thins rasterized linear features by reducing the number of cells
       representing the width of the features.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster to be thinned.It must be of integer type.
     background_value {String}:
         Specifies the cell value that will identify the background cells. The
         linear features are formed from the foreground cells.ZERO-The
         background is composed of cells of 0 or less, or NoData. All
         cells whose value is greater than 0 are the foreground.NODATA-The
         background is composed of NoData cells. All cells with
         valid values belong to the foreground.
     filter {Boolean}:
         Specifies whether a filter will be applied as the first phase of
         thinning. NO_FILTER-No filter will be applied. This is
         the
         default.FILTER-The raster will be filtered to smooth the boundaries
         between
         foreground and background cells. This option will eliminate minor
         irregularities from the output raster.
     corners {String}:
         Specifies whether round or sharp turns will be made at turns or
         junctions.It is also used during the vector conversion process to
         spline curves
         or create sharp intersections and corners.ROUND-Attempts to smooth
         corners and junctions. This is best for
         vectorizing natural features, such as contours or
         streams.SHARP-Attempts to preserve rectangular corners and junctions.
         This is
         best for vectorizing man-made features such as streets.
     maximum_thickness {Double}:
         The maximum thickness, in map units, of linear features in the input
         raster.The default thickness is ten times the cell size.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output thinned raster.The output is always of integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_raster, background_value, filter, corners, maximum_thickness):
        out_raster = "#"
        result = arcpy.gp.Thin_sa(in_raster, out_raster, background_value, filter, corners, maximum_thickness)
        return _wrapToolRaster("Thin_sa", str(result.getOutput(0)))

    return Wrapper(in_raster, background_value, filter, corners, maximum_thickness)


Thin.__esri_toolname__ = "Thin_sa"
Thin.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6"]


def Times(in_raster_or_constant1, in_raster_or_constant2) -> Raster:
    """Times_sa(in_raster_or_constant1, in_raster_or_constant2)

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


Times.__esri_toolname__ = "Times_sa"
Times.__esri_toolinfo__ = ["::::1", "::::2"]


def TopoToRaster(
    topo_input,
    cell_size="#",
    extent="#",
    Margin="#",
    minimum_z_value="#",
    maximum_z_value="#",
    enforce: Literal["ENFORCE", "NO_ENFORCE", "ENFORCE_WITH_SINK", "#"] | None = "#",
    data_type: Literal["CONTOUR", "SPOT", "#"] | None = "#",
    maximum_iterations="#",
    roughness_penalty="#",
    discrete_error_factor="#",
    vertical_standard_error="#",
    tolerance_1="#",
    tolerance_2="#",
    out_stream_features="#",
    out_sink_features="#",
    out_diagnostic_file="#",
    out_parameter_file="#",
    profile_penalty="#",
    out_residual_feature="#",
    out_stream_cliff_error_feature="#",
    out_contour_error_feature="#",
) -> Raster:
    """TopoToRaster_sa(topo_input, {cell_size}, {extent}, {Margin}, {minimum_z_value}, {maximum_z_value}, {enforce}, {data_type}, {maximum_iterations}, {roughness_penalty}, {discrete_error_factor}, {vertical_standard_error}, {tolerance_1}, {tolerance_2}, {out_stream_features}, {out_sink_features}, {out_diagnostic_file}, {out_parameter_file}, {profile_penalty}, {out_residual_feature}, {out_stream_cliff_error_feature}, {out_contour_error_feature})

       Interpolates a hydrologically correct raster surface from point, line,
       and polygon data.

    INPUTS:
     topo_input (Topo Features):
         The Topo class specifies the input features containing the z-values to
         be interpolated into a surface raster.There are nine types of data
         accepted inputs to the Topo class:
         TopoPointElevation, TopoContour, TopoStream, TopoSink, TopoBoundary,
         TopoLake, TopoCliff, TopoExclusion, and TopoCoast.
         TopoPointElevation ([[inFeatures,{field}],...])         A
         point feature class representing surface elevations.The field stores
         the elevations of the points. TopoContour
         ([[inFeatures,{field}],...])         A line
         feature class that represents elevation contours.The field stores the
         elevations of the contour lines. TopoStream ([inFeatures,...])
         A line feature class of
         stream locations. All arcs must be oriented to
         point downstream. The feature class should only contain single arc
         streams. TopoSink ([[inFeatures,{field}],...])         A point
         feature
         class that represents known topographic depressions.
         Topo to Raster will not attempt to remove from the analysis any points
         explicitly identified as sinks.The field used should be one that
         stores the elevation of the
         legitimate sink. If NONE is selected, only the location of the sink is
         used. TopoBoundary ([inFeatures,...])         A boundary is a
         feature class containing a single polygon that
         represents the outer boundary of the output raster. Cells in the
         output raster outside this boundary will be NoData. This option can be
         used for clipping out water areas along coastlines before making the
         final output raster. TopoLake ([inFeatures,...])         A
         polygon feature class
         that specifies the location of lakes. All
         output raster cells within a lake will be assigned to the minimum
         elevation value of all cells along the shoreline. TopoCliff
         ([inFeatures,...])         A line feature class of
         the cliffs. The cliff line features must be
         oriented so that the left-hand side of the line is on the low side of
         the cliff and the right-hand side is the high side of the cliff.
         TopoExclusion ([inFeatures,...])         A polygon feature
         class of the areas in which the input data should be
         ignored. These polygons permit removal of elevation data from the
         interpolation process. This is typically used to remove elevation data
         associated with dam walls and bridges. This enables interpolation of
         the underlying valley with connected drainage structure.
         TopoCoast ([inFeatures,...])         A polygon feature class
         containing the outline of a coastal area.
         Cells in the final output raster that lie outside these polygons are
         set to a value that is less than the user-specified minimum height
         limit.The PointElevation, Contour, and Sink types of feature input can
         have
         a field specified that contains the z-values. There is no Field option
         for Boundary, Lake, Cliff, Coast, Exclusion, or Stream input types.
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     extent {Extent}:
         Extent for the output raster dataset.Interpolation will occur out to
         the x and y limits, and cells outside
         that extent will be NoData. For best interpolation results along the
         edges of the output raster, the x and y limits should be smaller than
         the extent of the input data by at least 10 cells on each side.The
         default extent is the largest of all extents of the input feature
         data.MAXOF-The maximum extent of all inputs will be used.MINOF-The
         minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     Margin {Long}:
         Distance in cells to interpolate beyond the specified output extent
         and boundary.The value must be greater than or equal to 0 (zero). The
         default value
         is 20.If the Extent and TopoBoundary feature dataset are the same as
         the
         limit of the input data (the default), values interpolated along the
         edge of the DEM will not match well with adjacent DEM data. This is
         because they have been interpolated using one-half as much data as the
         points inside the raster, which are surrounded on all sides by input
         data. The option allows input data beyond these limits to be used in
         the interpolation.
     minimum_z_value {Double}:
         The minimum z-value to be used in the interpolation.The default is 20
         percent below the smallest of all the input values.
     maximum_z_value {Double}:
         The maximum z-value to be used in the interpolation.The default is 20
         percent above the largest of all input values.
     enforce {String}:
         The type of drainage enforcement to apply.The drainage enforcement
         option can be set to attempt to remove all
         sinks or depressions so a hydrologically correct DEM can be created.
         If sink points have been explicitly identified in the input feature
         data, these depressions will not be filled.ENFORCE-The algorithm will
         attempt to remove all sinks it encounters,
         whether they are real or spurious. This is the default.NO_ENFORCE-No
         sinks will be filled. ENFORCE_WITH_SINK-Points identified as
         sinks in Input feature
         data represent known topographic depressions and will not be altered.
         Any sink not identified in input feature data is considered spurious,
         and the algorithm will attempt to fill it. Having more than
         8,000 spurious sinks causes the tool to fail.
     data_type {String}:
         The dominant elevation data type of the input feature data.CONTOUR-The
         dominant type of input data will be elevation contours.
         This is the default.SPOT-The dominant type of input will be
         point.Specifying the relevant selection optimizes the search method
         used
         during the generation of streams and ridges.
     maximum_iterations {Long}:
         The maximum number of interpolation iterations.The number of
         iterations must be greater than zero. A default of 20 is
         normally adequate for both contour and line data.A value of 30 will
         clear fewer sinks. Rarely, higher values (45-50)
         may be useful to clear more sinks or to set more ridges and streams.
         Iteration ceases for each grid resolution when the maximum number of
         iterations has been reached.
     roughness_penalty {Double}:
         The integrated squared second derivative as a measure of roughness.The
         roughness penalty must be zero or greater. If the primary input
         data type is CONTOUR, the default is zero. If the primary data type is
         SPOT, the default is 0.5. Larger values are not normally recommended.
     discrete_error_factor {Double}:
         The discrete error factor is used to adjust the amount of smoothing
         when converting the input data to a raster.The value must be greater
         than zero. The normal range of adjustment is
         0.25 to 4, and the default is 1. A smaller value results in less data
         smoothing; a larger value causes greater smoothing.
     vertical_standard_error {Double}:
         The amount of random error in the z-values of the input data.The value
         must be zero or greater. The default is zero.The vertical standard
         error may be set to a small positive value if
         the data has significant random (non-systematic) vertical errors with
         uniform variance. In this case, set the vertical standard error to the
         standard deviation of these errors. For most elevation datasets, the
         vertical error should be set to zero, but it may be set to a small
         positive value to stabilize convergence when rasterizing point data
         with stream line data.
     tolerance_1 {Double}:
         This tolerance reflects the accuracy and density of the elevation
         points in relation to surface drainage.For point datasets, set the
         tolerance to the standard error of the
         data heights. For contour datasets, use one-half the average contour
         interval.The value must be zero or greater. The default is 2.5 if the
         data type
         is CONTOUR and zero if the data type is SPOT.
     tolerance_2 {Double}:
         This tolerance prevents drainage clearance through unrealistically
         high barriers.The value must be greater than zero. The default is 100
         if the data
         type is CONTOUR and 200 if the data type is SPOT.
     profile_penalty {Double}:
         The profile curvature roughness penalty is a locally adaptive penalty
         that can be used to partly replace total curvature.It can yield good
         results with high-quality contour data but can lead
         to instability in convergence with poor data. Set to 0.0 for no
         profile curvature (the default), set to 0.5 for moderate profile
         curvature, and set to 0.8 for maximum profile curvature. Values larger
         than 0.8 are not recommended and should not be used.

    OUTPUTS:
     out_surface_raster (Raster Dataset):
         The output interpolated surface raster.It is always a floating-point
         raster.
     out_stream_features {Feature Class}:
         The output line feature class of stream polyline features and ridge
         line features.The line features are created at the beginning of the
         interpolation
         process. It provides the general morphology of the surface for
         interpolation. It can be used to verify correct drainage and
         morphology by comparing known stream and ridge data.The polyline
         features are coded as follows:1. Input stream line not over cliff.2.
         Input stream line over cliff (waterfall).3. Drainage enforcement
         clearing a spurious sink.4. Stream line determined from contour
         corner.5. Ridge line determined from contour corner.6. Code not
         used.7. Data stream line side conditions.8. Code not used.9. Line
         indicating large elevation data clearance.
     out_sink_features {Feature Class}:
         The output point feature class of the remaining sink point
         features.These are the sinks that were not specified in the sink input
         feature
         data and were not cleared during drainage enforcement. Adjusting the
         values of the tolerances, tolerance_1 and tolerance_2, can reduce the
         number of remaining sinks. Remaining sinks often indicate errors in
         the input data that the drainage enforcement algorithm could not
         resolve. This can be an efficient way of detecting subtle elevation
         errors.
     out_diagnostic_file {File}:
         The output diagnostic file listing all inputs and parameters used and
         the number of sinks cleared at each resolution and iteration.
     out_parameter_file {File}:
         The output parameter file listing all inputs and parameters used,
         which can be used with Topo to Raster by File to run the interpolation
         again.
     out_residual_feature {Feature Class}:
         The output point feature class of all the large elevation residuals as
         scaled by the local discretisation error.All the scaled residuals
         larger than 10 should be inspected for
         possible errors in input elevation and stream data. Large-scaled
         residuals indicate conflicts between input elevation data and
         streamline data. These may also be associated with poor automatic
         drainage enforcements. These conflicts can be remedied by providing
         additional streamline and/or point elevation data after first checking
         and correcting errors in existing input data. Large unscaled residuals
         usually indicate input elevation errors.
     out_stream_cliff_error_feature {Feature Class}:
         The output point feature class of locations where possible stream and
         cliff errors occur.The locations where the streams have closed loops,
         distributaries, and
         streams over cliffs can be identified from the point feature class.
         Cliffs with neighboring cells that are inconsistent with the high and
         low sides of the cliff are also indicated. This can be a good
         indicator of cliffs with incorrect direction.Points are coded as
         follows:1. True circuit in data streamline network.2. Circuit in
         stream network as encoded on the out raster.3. Circuit in stream
         network via connecting lakes.4. Distributaries point.5. Stream over a
         cliff (waterfall).6. Points indicating multiple stream outflows from
         lakes.7. Code not used.8. Points beside cliffs with heights
         inconsistent with cliff
         direction.9. Code not used.10. Circular distributary removed.11.
         Distributary with no inflowing stream.12. Rasterized distributary in
         output cell different to where the data
         stream line distributary occurs.13. Error processing side
         conditions-an indicator of very complex
         streamline data.
     out_contour_error_feature {Feature Class}:
         The output point feature class of possible errors pertaining to the
         input contour data.Contours with bias in height exceeding five times
         the standard
         deviation of the contour values as represented on the output raster
         are reported to this feature class. Contours that join other contours
         with a different elevation are flagged in this feature class by the
         code 1; this is a sure sign of a contour label error."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        topo_input,
        cell_size,
        extent,
        Margin,
        minimum_z_value,
        maximum_z_value,
        enforce,
        data_type,
        maximum_iterations,
        roughness_penalty,
        discrete_error_factor,
        vertical_standard_error,
        tolerance_1,
        tolerance_2,
        out_stream_features,
        out_sink_features,
        out_diagnostic_file,
        out_parameter_file,
        profile_penalty,
        out_residual_feature,
        out_stream_cliff_error_feature,
        out_contour_error_feature,
    ):
        topo_input = Utils.multiValueCompoundParameterToString(topo_input, ParameterClasses._TopoInput)
        extent = Utils.compoundParameterToString(extent, arcpy.Extent)
        out_surface_raster = "#"
        result = arcpy.gp.TopoToRaster_sa(
            topo_input,
            out_surface_raster,
            cell_size,
            extent,
            Margin,
            minimum_z_value,
            maximum_z_value,
            enforce,
            data_type,
            maximum_iterations,
            roughness_penalty,
            discrete_error_factor,
            vertical_standard_error,
            tolerance_1,
            tolerance_2,
            out_stream_features,
            out_sink_features,
            out_diagnostic_file,
            out_parameter_file,
            profile_penalty,
            out_residual_feature,
            out_stream_cliff_error_feature,
            out_contour_error_feature,
        )
        return _wrapToolRaster("TopoToRaster_sa", str(result.getOutput(0)))

    return Wrapper(
        topo_input,
        cell_size,
        extent,
        Margin,
        minimum_z_value,
        maximum_z_value,
        enforce,
        data_type,
        maximum_iterations,
        roughness_penalty,
        discrete_error_factor,
        vertical_standard_error,
        tolerance_1,
        tolerance_2,
        out_stream_features,
        out_sink_features,
        out_diagnostic_file,
        out_parameter_file,
        profile_penalty,
        out_residual_feature,
        out_stream_cliff_error_feature,
        out_contour_error_feature,
    )


TopoToRaster.__esri_toolname__ = "TopoToRaster_sa"
TopoToRaster.__esri_toolinfo__ = [
    "Python::TopoBoundary|TopoCliff|TopoCoast|TopoContour|TopoExclusion|TopoLake|TopoPointElevation|TopoSink|TopoStream::",
    "::::3",
    "Python::Extent::",
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


def TopoToRasterByFile(
    in_parameter_file,
    out_stream_features="#",
    out_sink_features="#",
    out_residual_feature="#",
    out_stream_cliff_error_feature="#",
    out_contour_error_feature="#",
) -> Raster:
    """TopoToRasterByFile_sa(in_parameter_file, {out_stream_features}, {out_sink_features}, {out_residual_feature}, {out_stream_cliff_error_feature}, {out_contour_error_feature})

       Interpolates a hydrologically correct raster surface from point, line,
       and polygon data using parameters specified in a file.

    INPUTS:
     in_parameter_file (File):
         The input ASCII text file containing the inputs and parameters to use
         for the interpolation.The file is typically created from a previous
         run of Topo to Raster
         with the optional output parameter file specified.In order to test the
         outcome of changing the parameters, it is easier
         to make edits to this file and rerun the interpolation than to
         correctly issue the Topo to Raster tool each time.

    OUTPUTS:
     out_surface_raster (Raster Dataset):
         The output interpolated surface raster.It is always a floating-point
         raster.
     out_stream_features {Feature Class}:
         Output feature class of stream polyline features.The polyline features
         are coded as follows:1. Input stream line not over cliff.2. Input
         stream line over cliff (waterfall).3. Drainage enforcement clearing a
         spurious sink.4. Stream line determined from contour corner.5. Ridge
         line determined from contour corner.6. Code not used.7. Data stream
         line side conditions.8. Code not used.9. Line indicating large
         elevation data clearance.
     out_sink_features {Feature Class}:
         Output feature class of remaining sink point features.
     out_residual_feature {Feature Class}:
         The output point feature class of all the large elevation residuals as
         scaled by the local discretisation error.All the scaled residuals
         larger than 10 should be inspected for
         possible errors in input elevation and stream data. Large-scaled
         residuals indicate conflicts between input elevation data and
         streamline data. These may also be associated with poor automatic
         drainage enforcements. These conflicts can be remedied by providing
         additional streamline and/or point elevation data after first checking
         and correcting errors in existing input data. Large unscaled residuals
         usually indicate input elevation errors.
     out_stream_cliff_error_feature {Feature Class}:
         The output point feature class of locations where possible stream and
         cliff errors occur.The locations where the streams have closed loops,
         distributaries, and
         streams over cliffs can be identified from the point feature class.
         Cliffs with neighboring cells that are inconsistent with the high and
         low sides of the cliff are also indicated. This can be a good
         indicator of cliffs with incorrect direction.Points are coded as
         follows:1. True circuit in data streamline network.2. Circuit in
         stream network as encoded on the out raster.3. Circuit in stream
         network via connecting lakes.4. Distributaries point.5. Stream over a
         cliff (waterfall).6. Points indicating multiple stream outflows from
         lakes.7. Code not used.8. Points beside cliffs with heights
         inconsistent with cliff
         direction.9. Code not used.10. Circular distributary removed.11.
         Distributary with no inflowing stream.12. Rasterized distributary in
         output cell different to where the data
         stream line distributary occurs.13. Error processing side
         conditions-an indicator of very complex
         streamline data.
     out_contour_error_feature {Feature Class}:
         The output point feature class of possible errors pertaining to the
         input contour data.Contours with bias in height exceeding five times
         the standard
         deviation of the contour values as represented on the output raster
         are reported to this feature class. Contours that join other contours
         with a different elevation are flagged in this feature class by the
         code 1; this is a sure sign of a contour label error."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_parameter_file,
        out_stream_features,
        out_sink_features,
        out_residual_feature,
        out_stream_cliff_error_feature,
        out_contour_error_feature,
    ):
        out_surface_raster = "#"
        result = arcpy.gp.TopoToRasterByFile_sa(
            in_parameter_file,
            out_surface_raster,
            out_stream_features,
            out_sink_features,
            out_residual_feature,
            out_stream_cliff_error_feature,
            out_contour_error_feature,
        )
        return _wrapToolRaster("TopoToRasterByFile_sa", str(result.getOutput(0)))

    return Wrapper(
        in_parameter_file,
        out_stream_features,
        out_sink_features,
        out_residual_feature,
        out_stream_cliff_error_feature,
        out_contour_error_feature,
    )


TopoToRasterByFile.__esri_toolname__ = "TopoToRasterByFile_sa"
TopoToRasterByFile.__esri_toolinfo__ = ["::::1", "::::3", "::::4", "::::5", "::::6", "::::7"]


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
    """TrainIsoClusterClassifier_sa(in_raster, max_classes, out_classifier_definition, {in_additional_raster}, {max_iterations}, {min_samples_per_cluster}, {skip_factor}, {used_attributes;used_attributes...}, {max_merge_per_iter}, {max_merge_distance})

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
        result = arcpy.gp.TrainIsoClusterClassifier_sa(
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


TrainIsoClusterClassifier.__esri_toolname__ = "TrainIsoClusterClassifier_sa"
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
    """TrainKNearestNeighborClassifier_sa(in_raster, in_training_features, out_classifier_definition, {in_additional_raster}, {kNN}, {max_samples_per_class}, {used_attributes;used_attributes...}, {dimension_value_field})

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
         CCDC tool in the Image Analyst toolbox.

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
        result = arcpy.gp.TrainKNearestNeighborClassifier_sa(
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


TrainKNearestNeighborClassifier.__esri_toolname__ = "TrainKNearestNeighborClassifier_sa"
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
    """TrainMaximumLikelihoodClassifier_sa(in_raster, in_training_features, out_classifier_definition, {in_additional_raster}, {used_attributes;used_attributes...}, {dimension_value_field})

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
         CCDC tool in the Image Analyst toolbox.

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
        result = arcpy.gp.TrainMaximumLikelihoodClassifier_sa(
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


TrainMaximumLikelihoodClassifier.__esri_toolname__ = "TrainMaximumLikelihoodClassifier_sa"
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
    """TrainRandomTreesClassifier_sa(in_raster, in_training_features, out_classifier_definition, {in_additional_raster}, {max_num_trees}, {max_tree_depth}, {max_samples_per_class}, {used_attributes;used_attributes...}, {dimension_value_field})

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
         CCDC tool in the Image Analyst toolbox.

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
        result = arcpy.gp.TrainRandomTreesClassifier_sa(
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


TrainRandomTreesClassifier.__esri_toolname__ = "TrainRandomTreesClassifier_sa"
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
    """TrainSupportVectorMachineClassifier_sa(in_raster, in_training_features, out_classifier_definition, {in_additional_raster}, {max_samples_per_class}, {used_attributes;used_attributes...}, {dimension_value_field})

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
         CCDC tool in the Image Analyst toolbox.

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
        result = arcpy.gp.TrainSupportVectorMachineClassifier_sa(
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


TrainSupportVectorMachineClassifier.__esri_toolname__ = "TrainSupportVectorMachineClassifier_sa"
TrainSupportVectorMachineClassifier.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6", "::::7"]


def Trend(
    in_point_features,
    z_field,
    cell_size="#",
    order="#",
    regression_type: Literal["LINEAR", "LOGISTIC", "#"] | None = "#",
    out_rms_file="#",
) -> Raster:
    """Trend_sa(in_point_features, z_field, {cell_size}, {order}, {regression_type}, {out_rms_file})

       Interpolates a raster surface from points using a trend technique.

    INPUTS:
     in_point_features (Composite Geodataset):
         The input point features containing the z-values to be interpolated
         into a surface raster.
     z_field (Field):
         The field that holds a height or magnitude value for each point.This
         can be a numeric field or the Shape field if the input point
         features contain z-values.If the regression type is Logistic, the
         values in the field can only
         be 0 or 1.
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     order {Long}:
         The order of the polynomial.This must be an integer between 1 and 12.
         A value of 1 will fit a flat
         plane to the points, and a higher value will fit a more complex
         surface. The default is 1.
     regression_type {String}:
         The type of regression to be performed.LINEAR-Polynomial regression is
         performed to fit a least-squares
         surface to the set of input points. This is applicable for continuous
         types of data.LOGISTIC-Logistic trend surface analysis is performed.
         It generates a
         continuous probability surface for binary, or dichotomous, types of
         data.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output interpolated surface raster.It is always a floating-point
         raster.
     out_rms_file {File}:
         File name for the output text file that contains information about the
         RMS error and the Chi-Square of the interpolation.The extension must
         be .txt."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_point_features, z_field, cell_size, order, regression_type, out_rms_file):
        out_raster = "#"
        result = arcpy.gp.Trend_sa(
            in_point_features, z_field, out_raster, cell_size, order, regression_type, out_rms_file
        )
        return _wrapToolRaster("Trend_sa", str(result.getOutput(0)))

    return Wrapper(in_point_features, z_field, cell_size, order, regression_type, out_rms_file)


Trend.__esri_toolname__ = "Trend_sa"
Trend.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "::::6", "::::7"]


def UpdateAccuracyAssessmentPoints(
    in_class_data,
    in_points,
    out_points,
    target_field: Literal["CLASSIFIED", "GROUND_TRUTH", "#"] | None = "#",
    polygon_dimension_field="#",
    point_dimension_field="#",
):
    """UpdateAccuracyAssessmentPoints_sa(in_class_data, in_points, out_points, {target_field}, {polygon_dimension_field}, {point_dimension_field})

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
        result = arcpy.gp.UpdateAccuracyAssessmentPoints_sa(
            in_class_data, in_points, out_points, target_field, polygon_dimension_field, point_dimension_field
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_class_data, in_points, out_points, target_field, polygon_dimension_field, point_dimension_field)


UpdateAccuracyAssessmentPoints.__esri_toolname__ = "UpdateAccuracyAssessmentPoints_sa"
UpdateAccuracyAssessmentPoints.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6"]


def Viewshed(
    in_raster,
    in_observer_features,
    z_factor="#",
    curvature_correction: Literal["FLAT_EARTH", "CURVED_EARTH", "#"] | None = "#",
    refractivity_coefficient="#",
    out_agl_raster="#",
) -> Raster:
    """Viewshed_sa(in_raster, in_observer_features, {z_factor}, {curvature_correction}, {refractivity_coefficient}, {out_agl_raster})

       Determines the raster surface locations visible to a set of observer
       features.

    INPUTS:
     in_raster (Composite Geodataset):
         The input surface raster.
     in_observer_features (Composite Geodataset):
         The feature class that identifies the observer locations.The input can
         be point or polyline features.
     z_factor {Double}:
         The number of ground x,y units in one surface z-unit.The z-factor
         adjusts the units of measure for the z-units when they
         are different from the x,y units of the input surface. The z-values of
         the input surface are multiplied by the z-factor when calculating the
         final output surface.If the x,y units and z-units are in the same
         units of measure, the
         z-factor is 1. This is the default.If the x,y units and z-units are in
         different units of measure, the
         z-factor must be set to the appropriate factor or the results will be
         incorrect. For example, if the z-units are feet and the x,y units are
         meters, use a z-factor of 0.3048 to convert the z-units from feet to
         meters (1 foot = 0.3048 meter).
     curvature_correction {Boolean}:
         Specifies whether correction for the earth's curvature will be
         applied.FLAT_EARTH-No curvature correction will be applied. This is
         the
         default.CURVED_EARTH-Curvature correction will be applied.
     refractivity_coefficient {Double}:
         The coefficient of the refraction of visible light in air.The default
         value is 0.13.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster. The output will only record the number of
         times that each cell
         location in the input surface raster can be seen by the input
         observation points (or vertices for polylines). The observation
         frequency will be recorded in theitem in the output raster's attribute
         table. VALUE
     out_agl_raster {Raster Dataset}:
         The output above ground level (AGL) raster.The AGL result is a raster
         where each cell value is the minimum height
         that must be added to an otherwise nonvisible cell to make it visible
         by at least one observer.Cells that were already visible will have a
         value of 0 in this output
         raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_raster, in_observer_features, z_factor, curvature_correction, refractivity_coefficient, out_agl_raster
    ):
        out_raster = "#"
        result = arcpy.gp.Viewshed_sa(
            in_raster,
            in_observer_features,
            out_raster,
            z_factor,
            curvature_correction,
            refractivity_coefficient,
            out_agl_raster,
        )
        return _wrapToolRaster("Viewshed_sa", str(result.getOutput(0)))

    return Wrapper(
        in_raster, in_observer_features, z_factor, curvature_correction, refractivity_coefficient, out_agl_raster
    )


Viewshed.__esri_toolname__ = "Viewshed_sa"
Viewshed.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5", "::::6", "::::7"]


def Viewshed2(
    in_raster,
    in_observer_features,
    out_agl_raster="#",
    analysis_type: Literal["FREQUENCY", "OBSERVERS", "#"] | None = "#",
    vertical_error="#",
    out_observer_region_relationship_table="#",
    refractivity_coefficient="#",
    surface_offset="#",
    observer_elevation="#",
    observer_offset="#",
    inner_radius="#",
    inner_radius_is_3d: Literal["3D", "GROUND", "#"] | None = "#",
    outer_radius="#",
    outer_radius_is_3d: Literal["3D", "GROUND", "#"] | None = "#",
    horizontal_start_angle="#",
    horizontal_end_angle="#",
    vertical_upper_angle="#",
    vertical_lower_angle="#",
    analysis_method: Literal["ALL_SIGHTLINES", "PERIMETER_SIGHTLINES", "#"] | None = "#",
    analysis_target_device: Literal["GPU_THEN_CPU", "GPU_ONLY", "CPU_ONLY", "#"] | None = "#",
) -> Raster:
    """Viewshed2_sa(in_raster, in_observer_features, {out_agl_raster}, {analysis_type}, {vertical_error}, {out_observer_region_relationship_table}, {refractivity_coefficient}, {surface_offset}, {observer_elevation}, {observer_offset}, {inner_radius}, {inner_radius_is_3d}, {outer_radius}, {outer_radius_is_3d}, {horizontal_start_angle}, {horizontal_end_angle}, {vertical_upper_angle}, {vertical_lower_angle}, {analysis_method}, {analysis_target_device})

       Determines the raster surface locations visible to a set of observer
       features using geodesic methods.

    INPUTS:
     in_raster (Composite Geodataset):
         The input surface raster. It can be an integer or a floating-point
         raster.The input raster is transformed into a 3D geocentric coordinate
         system
         during the visibility calculation. NoData cells on the input raster do
         not block the visibility determination.
     in_observer_features (Composite Geodataset):
         The input feature class that identifies the observer locations. It can
         be point, multipoint, or polyline features.The input feature class is
         transformed into a 3D geocentric coordinate
         system during the visibility calculation. Observers outside of the
         extent of the surface raster or located on NoData cells will be
         ignored in the calculation.
     analysis_type {String}:
         Specifies the type of visibility analysis that will be performed,
         either determining how visible each cell is to the observers or
         identifying the observers that are visible for each surface
         location.FREQUENCY-The number of times that each cell location in the
         input
         surface raster can be seen by the input observation locations (as
         points or as vertices for polyline observer features) will be recorded
         in the output. This is the default.OBSERVERS-The observer points that
         are visible from each raster
         surface location will be identified in the output. The maximum number
         of input observer locations allowed for this analysis type is 32.
     vertical_error {Linear Unit}:
         The amount of uncertainty (the root mean square [RMS] error) in the
         surface elevation values. It is a floating-point value representing
         the expected error of the input elevation values. When this parameter
         is assigned a value greater than 0, the output visibility raster will
         be floating point. In this case, each cell value on the output
         visibility raster represents the sum of probabilities that the cell is
         visible to any of the observers.When the analysis_type parameter value
         is OBSERVERS or the
         analysis_method parameter value is PERIMETER_SIGHTLINES, this
         parameter is disabled.
     refractivity_coefficient {Double}:
         The coefficient of the refraction of visible light in air.The default
         value is 0.13.
     surface_offset {Linear Unit / Field}:
         A vertical distance that will be added to the z-value of each cell as
         it is considered for visibility. It must be a positive integer or
         floating-point value.You can select a field in the input observers
         dataset, or you can
         specify a numerical value.For example, if the object to be observed is
         a vehicle, specify the
         height of the vehicle here.When this parameter is set to a value, the
         value will be used by all
         the observers. To specify different values for each observer, set this
         parameter to a field in the input observer features dataset.The
         default value is 0.
     observer_elevation {Linear Unit / Field}:
         The surface elevations of the observer points or vertices.You can
         select a field in the input observers dataset, or you can
         specify a numerical value.When this parameter is not specified, the
         observer elevation will be
         obtained from the surface raster using bilinear interpolation. If this
         parameter is set to a value, the value will be applied to all the
         observers. To specify different values for each observer, set this
         parameter to a field in the input observer features dataset.
     observer_offset {Linear Unit / Field}:
         A vertical distance that will be added to the observer elevation. It
         must be a positive integer or floating-point value.You can select a
         field in the input observers dataset, or you can
         specify a numerical value.For example, if an observer is looking from
         a tower, specify the
         height of the tower here.When this parameter is set to a value, the
         value will be applied to
         all the observers. To specify different values for each observer, set
         this parameter to a field in the input observer features dataset.The
         default value is 1 meter.
     inner_radius {Linear Unit / Field}:
         The start distance from which visibility will be determined. Cells
         closer than this distance will not be visible in the output but can
         still block visibility of the cells between inner radius and outer
         radius.You can select a field in the input observers dataset, or you
         can
         specify a numerical value.When this parameter is set to a value, the
         value will be applied to
         all the observers. To specify different values for each observer, set
         this parameter to a field in the input observer features dataset.The
         default value is 0.
     inner_radius_is_3d {Boolean}:
         Specifies the type of distance that will be used for the inner radius
         parameter.GROUND-The inner radius will be interpreted as a 2D
         distance. This is
         the default.3D-The inner radius will be interpreted as a 3D distance.
     outer_radius {Linear Unit / Field}:
         The maximum distance from which visibility will be determined. Cells
         beyond this distance will be excluded from the analysis.You can select
         a field in the input observers dataset, or you can
         specify a numerical value.When this parameter is set to a value, the
         value will be applied to
         all the observers. To specify different values for each observer, set
         this parameter to a field in the input observer features dataset.
     outer_radius_is_3d {Boolean}:
         Specifies the type of distance that will be used for the outer radius
         parameter.GROUND-The outer radius will be interpreted as a 2D
         distance. This is
         the default.3D-The outer radius will be interpreted as a 3D distance.
     horizontal_start_angle {Double / Field}:
         The start angle of the horizontal scan range. Provide the value in
         degrees from 0 to 360 with 0 oriented to north. The value can be
         integer or floating point. The default value is 0.You can select a
         field in the input observers dataset, or you can
         specify a numerical value.When this parameter is set to a value, the
         value will be applied to
         all the observers. To specify different values for each observer, set
         this parameter to a field in the input observer features dataset.
     horizontal_end_angle {Double / Field}:
         The end angle of the horizontal scan range. Provide the value in
         degrees from 0 to 360 with 0 oriented to north. The value can be
         integer or floating point. The default value is 360.You can select a
         field in the input observers dataset, or you can
         specify a numerical value.When this parameter is set to a value, the
         value will be applied to
         all the observers. To specify different values for each observer, set
         this parameter to a field in the input observer features dataset.
     vertical_upper_angle {Double / Field}:
         The upper vertical angle limit of the scan relative to the horizontal
         plane. Provide the value in degrees from above -90 up to and including
         90. The value can be integer or floating point. The default value is
         90 (straight up). This parameter value must be greater than
         theparameter value.
         Vertical lower angleYou can select a field in the input observers
         dataset, or you can
         specify a numerical value.When this parameter is set to a value, the
         value will be applied to
         all the observers. To specify different values for each observer, set
         this parameter to a field in the input observer features dataset.The
         default value is 90 (straight up).
     vertical_lower_angle {Double / Field}:
         The lower vertical angle limit of the scan relative to the horizontal
         plane. Provide the value in degrees from -90 up to but not including
         90. The value can be integer or floating point. The default value is
         -90 (straight down). This parameter value must be less than
         theparameter value.
         Vertical upper angleYou can select a field in the input observers
         dataset, or you can
         specify a numerical value.When this parameter is set to a value, the
         value will be applied to
         all the observers. To specify different values for each observer, set
         this parameter to a field in the input observer features dataset.The
         default value is -90 (straight down).
     analysis_method {String}:
         Specifies the method that will be used to calculate visibility. This
         parameter allows you to decide on performance level.ALL_SIGHTLINES-A
         sightline will be run to every cell on the raster to
         establish visible areas, which may decrease performance depending on
         the number of sightlines. This is the default
         method.PERIMETER_SIGHTLINES-Sightlines will only be run to the cells
         on the
         perimeter of the visible areas to establish visibility areas, which
         can increase performance because fewer sightlines are run in the
         calculation.
     analysis_target_device {String}:
         Specifies the device that will be used to perform the
         calculation.GPU_THEN_CPU-If a compatible GPU is found, it will be used
         to perform
         the calculation. Otherwise, the CPU will be used. This is the
         default.CPU_ONLY-The calculation will only be performed on the
         CPU.GPU_ONLY-The calculation will only be performed on the GPU.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.For the FREQUENCY analysis type, when the vertical
         error parameter is
         0 or not specified, the output raster records the number of times that
         each cell location in the input surface raster can be seen by the
         input observation points. When the vertical error parameter is greater
         than 0, each cell on the output raster records the sum of
         probabilities that the cell is visible to any of the observers. For
         the OBSERVERS analysis type, the output raster records the unique
         region IDs for the visible areas, which can be related back to the
         observer features through the output observer-region relationship
         table.
     out_agl_raster {Raster Dataset}:
         The output above ground level (AGL) raster.The AGL result is a raster
         in which each cell value is the minimum
         height that must be added to a cell that is not visible to make it
         visible by at least one observer. Cells that are already visible will
         be assigned 0 in this output raster.When the vertical error parameter
         is 0, the output AGL raster will be
         a one-band raster. When the vertical error is greater than 0, to
         account for the random effects from the input raster, the output AGL
         raster will be created as a three-band raster. The first band
         represents the mean AGL values, the second band represents the minimum
         AGL values, and the third band represents the maximum AGL values.
     out_observer_region_relationship_table {Table}:
         The output table for identifying the regions that are visible to each
         observer. This table can be related to the input observer feature
         class and the output visibility raster for identifying the regions
         visible to given observers.This output is only created when the
         analysis type is OBSERVERS."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_raster,
        in_observer_features,
        out_agl_raster,
        analysis_type,
        vertical_error,
        out_observer_region_relationship_table,
        refractivity_coefficient,
        surface_offset,
        observer_elevation,
        observer_offset,
        inner_radius,
        inner_radius_is_3d,
        outer_radius,
        outer_radius_is_3d,
        horizontal_start_angle,
        horizontal_end_angle,
        vertical_upper_angle,
        vertical_lower_angle,
        analysis_method,
        analysis_target_device,
    ):
        out_raster = "#"
        result = arcpy.gp.Viewshed2_sa(
            in_raster,
            in_observer_features,
            out_raster,
            out_agl_raster,
            analysis_type,
            vertical_error,
            out_observer_region_relationship_table,
            refractivity_coefficient,
            surface_offset,
            observer_elevation,
            observer_offset,
            inner_radius,
            inner_radius_is_3d,
            outer_radius,
            outer_radius_is_3d,
            horizontal_start_angle,
            horizontal_end_angle,
            vertical_upper_angle,
            vertical_lower_angle,
            analysis_method,
            analysis_target_device,
        )
        return _wrapToolRaster("Viewshed2_sa", str(result.getOutput(0)))

    return Wrapper(
        in_raster,
        in_observer_features,
        out_agl_raster,
        analysis_type,
        vertical_error,
        out_observer_region_relationship_table,
        refractivity_coefficient,
        surface_offset,
        observer_elevation,
        observer_offset,
        inner_radius,
        inner_radius_is_3d,
        outer_radius,
        outer_radius_is_3d,
        horizontal_start_angle,
        horizontal_end_angle,
        vertical_upper_angle,
        vertical_lower_angle,
        analysis_method,
        analysis_target_device,
    )


Viewshed2.__esri_toolname__ = "Viewshed2_sa"
Viewshed2.__esri_toolinfo__ = [
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
    "::::16",
    "::::17",
    "::::18",
    "::::19",
    "::::20",
    "::::21",
]


def Visibility(
    in_raster,
    in_observer_features,
    out_agl_raster="#",
    analysis_type: Literal["FREQUENCY", "OBSERVERS", "#"] | None = "#",
    nonvisible_cell_value: Literal["ZERO", "NODATA", "#"] | None = "#",
    z_factor="#",
    curvature_correction: Literal["FLAT_EARTH", "CURVED_EARTH", "#"] | None = "#",
    refractivity_coefficient="#",
    surface_offset="#",
    observer_elevation="#",
    observer_offset="#",
    inner_radius="#",
    outer_radius="#",
    horizontal_start_angle="#",
    horizontal_end_angle="#",
    vertical_upper_angle="#",
    vertical_lower_angle="#",
) -> Raster:
    """Visibility_sa(in_raster, in_observer_features, {out_agl_raster}, {analysis_type}, {nonvisible_cell_value}, {z_factor}, {curvature_correction}, {refractivity_coefficient}, {surface_offset}, {observer_elevation}, {observer_offset}, {inner_radius}, {outer_radius}, {horizontal_start_angle}, {horizontal_end_angle}, {vertical_upper_angle}, {vertical_lower_angle})

       Determines the raster surface locations visible to a set of observer
       features, or identifies which observer points are visible from each
       raster surface location.

    INPUTS:
     in_raster (Composite Geodataset):
         The input surface raster.
     in_observer_features (Composite Geodataset):
         The feature class that identifies the observer locations.The input can
         be point or polyline features.
     analysis_type {String}:
         The visibility analysis type.FREQUENCY-The output records the number
         of times that each cell
         location in the input surface raster can be seen by the input
         observation locations (as points, or as vertices for polyline observer
         features). This is the default.OBSERVERS-The output identifies exactly
         which observer points are
         visible from each raster surface location.
     nonvisible_cell_value {Boolean}:
         Value assigned to non-visible cells.ZERO-0 is assigned to nonvisible
         cells. This is the
         default.NODATA-NoData is assigned to nonvisible cells.
     z_factor {Double}:
         Number of ground x,y units in one surface z unit.The z-factor adjusts
         the units of measure for the z units when they
         are different from the x,y units of the input surface. The z-values of
         the input surface are multiplied by the z-factor when calculating the
         final output surface.If the x,y units and z units are in the same
         units of measure, the
         z-factor is 1. This is the default.If the x,y units and z units are in
         different units of measure, the
         z-factor must be set to the appropriate factor, or the results will be
         incorrect. For example, if your z units are feet and your x,y units
         are meters, you would use a z-factor of 0.3048 to convert your z units
         from feet to meters (1 foot = 0.3048 meter).
     curvature_correction {Boolean}:
         Specifies whether correction for the earth's curvature will be
         applied.FLAT_EARTH-No curvature correction will be applied. This is
         the
         default.CURVED_EARTH-Curvature correction will be applied.
     refractivity_coefficient {Double}:
         The coefficient of the refraction of visible light in air.The default
         value is 0.13.
     surface_offset {String}:
         A vertical distance that will be added to the z-value of each cell as
         it is considered for visibility. It must be a positive integer or
         floating-point value.You can select a field in the input observers
         dataset, or you can
         specify a numerical value. By default, a numerical fieldis used
         if it exists in the input
         observer features attribute table. You may overwrite it by specifying
         another numerical field or a value. OFFSETBIf no value is
         provided for this parameter and the default field does
         not exist in the input observer features attribute table, the default
         value is 0.
     observer_elevation {String}:
         The surface elevations of the observer points or vertices.You can
         select a field in the input observers dataset, or you can
         specify a numerical value. By default, a numerical fieldis used
         if it exists in the input
         observer features attribute table. You may overwrite it by specifying
         another numerical field or a value. SPOTIf this parameter is
         unspecified and the default field does not exist
         in the input observer features attribute table, it will be estimated
         through bilinear interpolation with the surface elevation values in
         the neighboring cells of the observer location.
     observer_offset {String}:
         A vertical distance that will be added to the observer elevation. It
         must be a positive integer or floating-point value.You can select a
         field in the input observers dataset, or you can
         specify a numerical value. By default, a numerical fieldis used
         if it exists in the input
         observer features attribute table. You may overwrite it by specifying
         another numerical field or a value. OFFSETAIf this parameter is
         unspecified and the default field does not exist
         in the input observer features attribute table, it defaults to 1.
     inner_radius {String}:
         The start distance from which visibility will be determined. Cells
         closer than this distance will not be visible in the output but can
         still block visibility of the cells between inner radius and outer
         radius.It can be a positive or negative integer or floating point
         value. If
         it is a positive value, then it is interpreted as three-dimensional,
         line-of-sight distance. If it is a negative value, then it is
         interpreted as two-dimensional planimetric distance.You can select a
         field in the input observers dataset, or you can
         specify a numerical value. By default, a numerical fieldis used
         if it exists in the input
         observer features attribute table. You may overwrite it by specifying
         another numerical field or a value. RADIUS1If no value is
         provided for this parameter and the default field does
         not exist in the input observer features attribute table, the default
         value is 0.
     outer_radius {String}:
         The maximum distance from which visibility will be determined. Cells
         beyond this distance will be excluded from the analysis.It can be a
         positive or negative integer or floating point value. If
         it is a positive value, then it is interpreted as three-dimensional,
         line-of-sight distance. If it is a negative value, then it is
         interpreted as two-dimensional planimetric distance.You can select a
         field in the input observers dataset, or you can
         specify a numerical value. By default, a numerical fieldis used
         if it exists in the input
         observer features attribute table. You may overwrite it by specifying
         another numerical field or a value. RADIUS2If this parameter is
         unspecified and the default field does not exist
         in the input observer features attribute table, it defaults to
         infinity.
     horizontal_start_angle {String}:
         The start angle of the horizontal scan range. Provide the value in
         degrees from 0 to 360 with 0 oriented to north. The value can be
         integer or floating point. The default value is 0.You can select a
         field in the input observers dataset, or you can
         specify a numerical value. By default, a numerical fieldis used
         if it exists in the input
         observer features attribute table. You may overwrite it by specifying
         another numerical field or a value. AZIMUTH1If no value is
         provided for this parameter and the default field does
         not exist in the input observer features attribute table, the default
         value is 0.
     horizontal_end_angle {String}:
         The end angle of the horizontal scan range. Provide the value in
         degrees from 0 to 360 with 0 oriented to north. The value can be
         integer or floating point. The default value is 360.You can select a
         field in the input observers dataset, or you can
         specify a numerical value. By default, a numerical fieldis used
         if it exists in the input
         observer features attribute table. You may overwrite it by specifying
         another numerical field or a value. AZIMUTH2If this parameter
         is unspecified and the default field does not exist
         in the input observer features attribute table, it defaults to 360.
     vertical_upper_angle {String}:
         The upper vertical angle limit of the scan relative to the horizontal
         plane. Provide the value in degrees from above -90 up to and including
         90. The value can be integer or floating point. The default value is
         90 (straight up). This parameter value must be greater than
         theparameter value.
         Vertical lower angleYou can select a field in the input observers
         dataset, or you can
         specify a numerical value. By default, a numerical fieldis used
         if it exists in the input
         observer features attribute table. You may overwrite it by specifying
         another numerical field or a value. VERT1If this parameter is
         unspecified and the default field does not exist
         in the input observer features attribute table, it defaults to 90.
     vertical_lower_angle {String}:
         The lower vertical angle limit of the scan relative to the horizontal
         plane. Provide the value in degrees from -90 up to but not including
         90. The value can be integer or floating point. The default value is
         -90 (straight down). This parameter value must be less than
         theparameter value.
         Vertical upper angleYou can select a field in the input observers
         dataset, or you can
         specify a numerical value. By default, a numerical fieldis used
         if it exists in the input
         observer features attribute table. You may overwrite it by specifying
         another numerical field or a value. VERT2If this parameter is
         unspecified and the default field does not exist
         in the input observer features attribute table, it defaults to -90.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster.The output will either record the number of times
         that each cell
         location in the input surface raster can be seen by the input
         observation locations (the frequency analysis type), or record which
         observer locations are visible from each cell in the raster surface
         (the observers type).
     out_agl_raster {Raster Dataset}:
         The output above-ground-level (AGL) raster.The AGL result is a raster
         where each cell value is the minimum height
         that must be added to an otherwise nonvisible cell to make it visible
         by at least one observer.Cells that were already visible will have a
         value of 0 in this output
         raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(
        in_raster,
        in_observer_features,
        out_agl_raster,
        analysis_type,
        nonvisible_cell_value,
        z_factor,
        curvature_correction,
        refractivity_coefficient,
        surface_offset,
        observer_elevation,
        observer_offset,
        inner_radius,
        outer_radius,
        horizontal_start_angle,
        horizontal_end_angle,
        vertical_upper_angle,
        vertical_lower_angle,
    ):
        out_raster = "#"
        result = arcpy.gp.Visibility_sa(
            in_raster,
            in_observer_features,
            out_raster,
            out_agl_raster,
            analysis_type,
            nonvisible_cell_value,
            z_factor,
            curvature_correction,
            refractivity_coefficient,
            surface_offset,
            observer_elevation,
            observer_offset,
            inner_radius,
            outer_radius,
            horizontal_start_angle,
            horizontal_end_angle,
            vertical_upper_angle,
            vertical_lower_angle,
        )
        return _wrapToolRaster("Visibility_sa", str(result.getOutput(0)))

    return Wrapper(
        in_raster,
        in_observer_features,
        out_agl_raster,
        analysis_type,
        nonvisible_cell_value,
        z_factor,
        curvature_correction,
        refractivity_coefficient,
        surface_offset,
        observer_elevation,
        observer_offset,
        inner_radius,
        outer_radius,
        horizontal_start_angle,
        horizontal_end_angle,
        vertical_upper_angle,
        vertical_lower_angle,
    )


Visibility.__esri_toolname__ = "Visibility_sa"
Visibility.__esri_toolinfo__ = [
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
    "::::16",
    "::::17",
    "::::18",
]


def Watershed(in_flow_direction_raster, in_pour_point_data, pour_point_field="#") -> Raster:
    """Watershed_sa(in_flow_direction_raster, in_pour_point_data, {pour_point_field})

       Determines the contributing area above a set of cells in a raster.

    INPUTS:
     in_flow_direction_raster (Composite Geodataset):
         The input raster that shows the direction of flow out of each cell.The
         flow direction raster can be created using the Flow Direction
         tool, run using the default flow direction type D8.
     in_pour_point_data (Composite Geodataset):
         The input pour point locations.For a raster, this represents cells
         above which the contributing area,
         or catchment, will be determined. All cells that are not NoData will
         be used as source cells.For a point feature dataset, this represents
         locations above which the
         contributing area, or catchment, will be determined.
     pour_point_field {Field}:
         The field used to assign values to the pour point locations. If
         the pour point dataset is a raster, use. ValueIf the pour point
         dataset is a feature, use a numeric field. If the
         field contains floating-point values, they will be truncated into
         integers.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster that shows the contributing area.This output is of
         integer type."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_flow_direction_raster, in_pour_point_data, pour_point_field):
        out_raster = "#"
        result = arcpy.gp.Watershed_sa(in_flow_direction_raster, in_pour_point_data, out_raster, pour_point_field)
        return _wrapToolRaster("Watershed_sa", str(result.getOutput(0)))

    return Wrapper(in_flow_direction_raster, in_pour_point_data, pour_point_field)


Watershed.__esri_toolname__ = "Watershed_sa"
Watershed.__esri_toolinfo__ = ["::::1", "::::2", "::::4"]


def WeightedOverlay(in_weighted_overlay_table) -> Raster:
    """WeightedOverlay_sa(in_weighted_overlay_table)

       Overlays several rasters using a common measurement scale and weights
       each according to its importance.

    INPUTS:
     in_weighted_overlay_table (Weighted Overlay Table):
         The Weighted Overlay tool allows the calculation of a multiple-
         criteria analysis between several rasters.An Overlay class is used to
         define the table. The WOTable object is
         used to specify the criteria rasters and their respective properties.
         The form of the object is:
         WOTable(weightedOverlayTable, evaluationScale)

    OUTPUTS:
     out_raster (Raster Dataset):
         The output weighted raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_weighted_overlay_table):
        in_weighted_overlay_table = Utils.compoundParameterToString(in_weighted_overlay_table, ParameterClasses.WOTable)
        # Convert classic GP tool parameter signature to raster function arguments
        args = {}
        # parse input parameters
        msgs = Utils.ParameterErrors()
        import re as _re

        # separate eval[from,to] parameters from table argument
        table_eval_pattern = _re.compile(
            pattern=r"""
            ^                  # beginning of string
            \s*                # any amount of white space
            \(                 # literal parenthesis
            \s*                # any amount of white space
            (?P<table>.*\S)    # table string
            \s*                # any amount of white space
            \)                 # literal parenthesis
            \s*                # any amount of white space
            ;                  # literal semicolon
            \s*                # any amount of white space
            (?P<EvalFrom>\S+)  # EvalFrom argument
            \s+                # one or more spaces
            (?P<EvalTo>\S+)    # EvalTo argument
            (?:\s+\S+)?        # optional increment (ignored)
            \s*                # any amount of white space
            $                  # end of string
        """,
            flags=_re.VERBOSE,
        )
        m = table_eval_pattern.match(in_weighted_overlay_table)
        assert m is not None
        args["EvalFrom"] = int(m.group("EvalFrom"))
        args["EvalTo"] = int(m.group("EvalTo"))
        table_string = m.group("table")
        # parse raster entries
        cs = r"[^;()]"  # non-punctuation character
        c = r"[^;() ]"  # neither punctuation nor space
        entry_pattern = _re.compile(
            pattern=rf"""
          \s*
          (?P<raster>{cs}*{c})  # raster
          \s+
          (?P<influence>{c}+)   # influence
          \s+
          (?P<field>{c}+)       # field name
          \s+
          \(                    # literal open parenthesis
          (?P<remap>[^)]+)      # remap
          \)                    # literal close parenthesis
          \s*
        """,
            flags=_re.VERBOSE,
        )
        rasters = []
        influences = []
        fields = []
        remaps = []
        total_influence = 0.0
        for m in _re.finditer(entry_pattern, table_string):
            r = m.group("raster").strip("'\"").strip()
            if len(r) < 1:
                msgs.add_id_message("INFO", 583)  # Failed to execute. Parameters are not valid.
                msgs.add_id_message("ERROR", 10629, r)  # The input layer name %s is either invalid or is empty
                msgs.add_id_message("INFO", 952, "WeightedOverlay")  # Failed to execute (tool_name).
                raise arcpy.ExecuteError(msgs.combine())
            i = float(m.group("influence"))
            total_influence += i
            #
            f = m.group("field").strip("'\"")
            ras = arcpy.Raster(r)
            if ras.hasRAT:
                try:
                    c = arcpy.da.SearchCursor(
                        str(ras),
                        [
                            f,
                        ],
                    )
                    numFields = len(c.fields)
                except RuntimeError as exc:
                    msgs.add_id_message("INFO", 583)  # Failed to execute. Parameters are not valid.
                    msgs.add_id_message(
                        "ERROR", 10631, f, r
                    )  # Invalid field name %1 or field does not exist in layer %2
                    msgs.add_id_message("INFO", 952, "WeightedOverlay")  # Failed to execute (tool_name).
                    raise arcpy.ExecuteError(msgs.combine())
            remap = m.group("remap")
            rasters.append(r)
            influences.append(i)
            fields.append(f)
            remap = remap.replace(",", "")  # strip out spurious commas
            remaps.append(remap)
        assert len(rasters) > 0
        # Force influences to sum to 1.0
        if total_influence != 0:
            influences[:] = [i / float(total_influence) for i in influences]
        args["Rasters"] = rasters
        args["Influences"] = influences
        args["Fields"] = fields
        args["Remaps"] = remaps
        args["ExtentType"] = 1  # 1: Intersection of extents
        args["CellsizeType"] = 2  # 2: Maximum of cell sizes
        result = arcpy.sa.Apply(rasters, "WeightedOverlay", args)
        result = ApplyEnvironment(result)
        return result

    return Wrapper(in_weighted_overlay_table)


WeightedOverlay.__esri_toolname__ = "WeightedOverlay_sa"
WeightedOverlay.__esri_toolinfo__ = ["Python::WOTable::"]


def WeightedSum(in_weighted_sum_table) -> Raster:
    """WeightedSum_sa(in_weighted_sum_table)

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


WeightedSum.__esri_toolname__ = "WeightedSum_sa"
WeightedSum.__esri_toolinfo__ = ["Python::WSTable::"]


def ZonalCharacterization(
    in_zone_raster_or_features,
    in_value_rasters_statistics,
    out_statistics_table,
    out_statistics_features="#",
    zone_field="#",
    ignore_nodata: Literal["DATA", "NODATA", "#"] | None = "#",
    percentile_values="#",
    percentile_interpolation_type: Literal["AUTO_DETECT", "NEAREST", "LINEAR", "#"] | None = "#",
    circular_calculation: Literal["ARITHMETIC", "CIRCULAR", "#"] | None = "#",
    circular_wrap_value="#",
    process_as_multidimensional: Literal["CURRENT_SLICE", "ALL_SLICES", "#"] | None = "#",
    add_zone_attributes: Literal["ZONE_FIELD_ONLY", "ALL", "#"] | None = "#",
):
    """ZonalCharacterization_sa(in_zone_raster_or_features, in_value_rasters_statistics;in_value_rasters_statistics..., out_statistics_table, {out_statistics_features}, {zone_field}, {ignore_nodata}, {percentile_values;percentile_values...}, {percentile_interpolation_type}, {circular_calculation}, {circular_wrap_value}, {process_as_multidimensional}, {add_zone_attributes})

       Summarizes the values of multiple rasters within the zones of another
       dataset and reports the results as a table.

    INPUTS:
     in_zone_raster_or_features (Composite Geodataset):
         The dataset that defines the zones.The zones can be defined by an
         integer raster or a feature layer.
     in_value_rasters_statistics (Value Table):
         The collection of rasters whose values will each be summarized by a
         statistic. This parameter has the following properties.Raster-An input
         value raster.Statistics Type-The statistic that will
         be calculated for the raster.Field Name-The field name for the raster
         in the output table.A statistic will be calculated for all cells in
         each input value
         raster that belong to the same zone as the output cell. The following
         are the available statistics types:MEAN-The average value of the
         cells.MAJORITY-The cell value that
         occurs most often.MAJORITY_COUNT-The frequency of all cells that
         contain the majority
         value.MAJORITY_PERCENT-The percentage of cells that contain the
         majority
         value.MAXIMUM-The largest cell value.MEDIAN-The median or middle cell
         valueMINIMUM-The smallest cell value.MINORITY-The cell value that
         occurs least often.MINORITY_COUNT-The frequency of all cells that
         contain the minority
         value.MINORITY_PERCENT-The percentage of cells that contain the
         minority
         value.PERCENTILE-The percentile of the cell values. The 90th
         percentile is
         calculated by default. You can specify other values (from 0 to 100)
         using the percentile_values parameter.RANGE-The difference between the
         largest and smallest cell values.STD-The standard deviation of the
         cell values.SUM-The total value of the cells.VARIETY-The number of
         unique cell values.The field names in the output statistics table will
         be derived from
         the value raster name and statistics type by default.
     zone_field {Field}:
         The field that contains the values that define each zone.It can be an
         integer or a string field of the zone dataset.
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
         will be
         used.LINEAR-The weighted average of the two surrounding values from
         the
         desired percentile will be used.
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
     process_as_multidimensional {Boolean}:
         Specifies how the input rasters will be calculated if they are
         multidimensional.CURRENT_SLICE-Statistics will be calculated from the
         current slice of
         the input multidimensional dataset. This is the
         default.ALL_SLICES-Statistics will be calculated for all dimensions of
         the
         input multidimensional dataset.
     add_zone_attributes {Boolean}:
         Specifies whether any of the additional zone attributes from the input
         zones will be appended to the output feature
         class.ZONE_FIELD_ONLY-Only the zone ID field from the input zones will
         be
         appended to the output feature class. This is the
         default.ALL-Additional zone attributes from the input zones will be
         appended
         to the output feature class.

    OUTPUTS:
     out_statistics_table (Table):
         The output table that will contain the summary of the values in each
         zone for all value rasters.The format of the table is determined by
         the output location and path.
         By default, the output will be a geodatabase table if in a geodatabase
         workspace, and a dBASE table if in a file workspace.
     out_statistics_features {Feature Class}:
         The output feature class that will be created by joining the output
         table to the input zone data."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(
        in_zone_raster_or_features,
        in_value_rasters_statistics,
        out_statistics_table,
        out_statistics_features,
        zone_field,
        ignore_nodata,
        percentile_values,
        percentile_interpolation_type,
        circular_calculation,
        circular_wrap_value,
        process_as_multidimensional,
        add_zone_attributes,
    ):
        result = arcpy.gp.ZonalCharacterization_sa(
            in_zone_raster_or_features,
            in_value_rasters_statistics,
            out_statistics_table,
            out_statistics_features,
            zone_field,
            ignore_nodata,
            percentile_values,
            percentile_interpolation_type,
            circular_calculation,
            circular_wrap_value,
            process_as_multidimensional,
            add_zone_attributes,
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(
        in_zone_raster_or_features,
        in_value_rasters_statistics,
        out_statistics_table,
        out_statistics_features,
        zone_field,
        ignore_nodata,
        percentile_values,
        percentile_interpolation_type,
        circular_calculation,
        circular_wrap_value,
        process_as_multidimensional,
        add_zone_attributes,
    )


ZonalCharacterization.__esri_toolname__ = "ZonalCharacterization_sa"
ZonalCharacterization.__esri_toolinfo__ = [
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


def ZonalFill(in_zone_raster, in_weight_raster) -> Raster:
    """ZonalFill_sa(in_zone_raster, in_weight_raster)

       Fills zones using the minimum cell value from a weight raster along
       the zone boundary.

    INPUTS:
     in_zone_raster (Composite Geodataset):
         The input raster that defines the zones to be filled.
     in_weight_raster (Composite Geodataset):
         The weight, or value, to be assigned to each zone.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster for which the zones have been filled."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_zone_raster, in_weight_raster):
        out_raster = "#"
        result = arcpy.gp.ZonalFill_sa(in_zone_raster, in_weight_raster, out_raster)
        return _wrapToolRaster("ZonalFill_sa", str(result.getOutput(0)))

    return Wrapper(in_zone_raster, in_weight_raster)


ZonalFill.__esri_toolname__ = "ZonalFill_sa"
ZonalFill.__esri_toolinfo__ = ["::::1", "::::2"]


def ZonalGeometry(
    in_zone_data,
    zone_field,
    geometry_type: Literal["AREA", "PERIMETER", "THICKNESS", "CENTROID", "#"] | None = "#",
    cell_size="#",
) -> Raster:
    """ZonalGeometry_sa(in_zone_data, zone_field, {geometry_type}, {cell_size})

       Calculates the specified geometry measure (area, perimeter, thickness,
       or the characteristics of an ellipse) for each zone in a dataset.

    INPUTS:
     in_zone_data (Composite Geodataset):
         The dataset that defines the zones.The zones can be defined by an
         integer raster or a feature layer.
     zone_field (Field):
         The field that contains the values that define each zone.It must be an
         integer field of the zone dataset.
     geometry_type {String}:
         Specifies the geometry type that will be calculated.AREA-The area for
         each zone will be calculated.PERIMETER-The perimeter
         for each zone will be calculated.THICKNESS-The deepest (or thickest)
         point within the zone from its
         surrounding cells will be calculated.CENTROID-The centroids of each
         zone will be calculated.
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output zonal geometry raster."""

    @Utils.StateSwapper(Utils.StateSwapper.SingleRasterResult)
    def Wrapper(in_zone_data, zone_field, geometry_type, cell_size):
        out_raster = "#"
        result = arcpy.gp.ZonalGeometry_sa(in_zone_data, zone_field, out_raster, geometry_type, cell_size)
        return _wrapToolRaster("ZonalGeometry_sa", str(result.getOutput(0)))

    return Wrapper(in_zone_data, zone_field, geometry_type, cell_size)


ZonalGeometry.__esri_toolname__ = "ZonalGeometry_sa"
ZonalGeometry.__esri_toolinfo__ = ["::::1", "::::2", "::::4", "::::5"]


def ZonalGeometryAsTable(in_zone_data, zone_field, out_table, processing_cell_size="#"):
    """ZonalGeometryAsTable_sa(in_zone_data, zone_field, out_table, {processing_cell_size})

       Calculates the geometry measures (area, perimeter, thickness, and the
       characteristics of an ellipse) for each zone in a dataset and reports
       the results as a table.

    INPUTS:
     in_zone_data (Composite Geodataset):
         The dataset that defines the zones.The zones can be defined by an
         integer raster or a feature layer.
     zone_field (Field):
         The field that contains the values that define each zone.It must be an
         integer field of the zone dataset.
     processing_cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.

    OUTPUTS:
     out_table (Table):
         Output table that will contain the summary of the values in each
         zone.The format of the table is determined by the output location and
         path.
         By default, the output will be a geodatabase table. If the path is not
         in a geodatabase, the format is determined by the extension. If the
         extension is .dbf, it will be in dBASE format. If no extension is
         provided, the output will be an INFO table. INFO tables are not
         supported as input in ArcGIS Pro and cannot be displayed"""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_zone_data, zone_field, out_table, processing_cell_size):
        result = arcpy.gp.ZonalGeometryAsTable_sa(in_zone_data, zone_field, out_table, processing_cell_size)
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_zone_data, zone_field, out_table, processing_cell_size)


ZonalGeometryAsTable.__esri_toolname__ = "ZonalGeometryAsTable_sa"
ZonalGeometryAsTable.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4"]


def ZonalHistogram(
    in_zone_data,
    zone_field,
    in_value_raster,
    out_table,
    out_graph="#",
    zones_as_rows: Literal["ZONES_AS_FIELDS", "ZONES_AS_ROWS", "#"] | None = "#",
):
    """ZonalHistogram_sa(in_zone_data, zone_field, in_value_raster, out_table, {out_graph}, {zones_as_rows})

       Creates a table and a histogram graph that show the frequency
       distribution of cell values on the value input for each unique zone.

    INPUTS:
     in_zone_data (Composite Geodataset):
         The dataset that defines the zones.The zones can be defined by an
         integer raster or a feature layer.
     zone_field (Field):
         The field that contains the values that define each zone.It can be an
         integer or a string field of the zone dataset.
     in_value_raster (Composite Geodataset):
         The raster that contains the values used to create the histogram.
     zones_as_rows {Boolean}:
         Specifies how the values from the input value raster will be
         represented in the output table.ZONES_AS_FIELDS-Zones will be
         represented as fields. This is the
         default.ZONES_AS_ROWS-Zones will be represented as rows.

    OUTPUTS:
     out_table (Table):
         The output table file.The format of the table is determined by the
         output location and path.
         By default, the output will be a geodatabase table if in a geodatabase
         workspace, and a dBASE table if in a file workspace.The optional graph
         output is created from the information in the
         table.
     out_graph {String}:
         The name of the output graph for display."""

    @Utils.StateSwapper(Utils.StateSwapper.NoSingleRasterResult)
    def Wrapper(in_zone_data, zone_field, in_value_raster, out_table, out_graph, zones_as_rows):
        result = arcpy.gp.ZonalHistogram_sa(
            in_zone_data, zone_field, in_value_raster, out_table, out_graph, zones_as_rows
        )
        return arcpy.convertArcObjectToPythonObject(result)

    return Wrapper(in_zone_data, zone_field, in_value_raster, out_table, out_graph, zones_as_rows)


ZonalHistogram.__esri_toolname__ = "ZonalHistogram_sa"
ZonalHistogram.__esri_toolinfo__ = ["::::1", "::::2", "::::3", "::::4", "::::5", "::::6"]


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
    """ZonalStatistics_sa(in_zone_data, zone_field, in_value_raster, {statistics_type}, {ignore_nodata}, {process_as_multidimensional}, {percentile_value}, {percentile_interpolation_type}, {circular_calculation}, {circular_wrap_value})

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
        result = arcpy.gp.ZonalStatistics_sa(
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


ZonalStatistics.__esri_toolname__ = "ZonalStatistics_sa"
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
    """ZonalStatisticsAsTable_sa(in_zone_data, zone_field, in_value_raster, out_table, {ignore_nodata}, {statistics_type}, {process_as_multidimensional}, {percentile_values;percentile_values...}, {percentile_interpolation_type}, {circular_calculation}, {circular_wrap_value}, {out_join_layer})

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
        result = arcpy.gp.ZonalStatisticsAsTable_sa(
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


ZonalStatisticsAsTable.__esri_toolname__ = "ZonalStatisticsAsTable_sa"
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
