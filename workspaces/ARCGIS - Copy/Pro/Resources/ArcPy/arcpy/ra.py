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
r"""The Raster Analysis toolbox contains a set of tools for performing
raster analysis on data in your portal. By distributing the processing
between multiple server nodes, you can process large datasets in less
time than processing using your desktop machine. Raster Analysis tools
are powered by your ArcGIS Image Server."""
from __future__ import annotations

__all__ = [
    "CalculateDensity",
    "CalculateDistance",
    "CalculateTravelCost",
    "ClassifyObjectsUsingDeepLearning",
    "ClassifyPixelsUsingDeepLearning",
    "ConvertFeatureToRaster",
    "ConvertRasterToFeature",
    "CostPathAsPolyline",
    "CreateViewshed",
    "DetectObjectsUsingDeepLearning",
    "DetermineOptimumTravelCostNetwork",
    "DetermineTravelCostPathAsPolyline",
    "DetermineTravelCostPathsToDestinations",
    "DistanceAccumulation",
    "DistanceAllocation",
    "Fill",
    "FlowAccumulation",
    "FlowDirection",
    "FlowDistance",
    "InterpolatePoints",
    "Nibble",
    "OptimalPathAsLine",
    "OptimalPathAsRaster",
    "OptimalRegionConnections",
    "StreamLink",
    "SummarizeRasterWithin",
    "SurfaceParameters",
    "Watershed",
    "ZonalStatisticsAsTable",
]
__alias__ = "ra"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Analyze Patterns toolset
@gptooldoc("CalculateDensity_ra", None)
def CalculateDensity(
    inputPointOrLineFeatures=None,
    outputName=None,
    countField=None,
    searchDistance=None,
    outputAreaUnits: Literal["Square Meters", "Square Kilometers", "Square Feet", "Square Miles"] | None = None,
    outputCellSize=None,
    inBarriers=None,
) -> Result1[str | Layer]:
    """CalculateDensity_ra(inputPointOrLineFeatures, outputName, {countField}, {searchDistance}, {outputAreaUnits}, {outputCellSize}, {inBarriers})

       Creates a density map from point or line features by spreading known
       quantities of some phenomenon (represented as attributes of the points
       or lines) across the map. The result is a layer of areas classified
       from least dense to most dense.

    INPUTS:
     inputPointOrLineFeatures (Feature Set):
         The input point or line features that will be used to calculate the
         density raster.
     outputName (String):
         The name of the output raster service.The default name is based on the
         tool name and the input layer name.
         If the layer name already exists, you will be prompted to provide
         another name.
     countField {Field}:
         A field indicating the number of incidents at each location. For
         example, if you are making a population density raster, and the input
         points are cities, it is appropriate to use the population of the city
         for the count field so cities with larger populations have more impact
         on the density calculations.
     searchDistance {Linear Unit}:
         The search distance and units for the distance. When calculating the
         density of a cell, all features within this distance will be used in
         the density calculation for that cell.The unit values are Kilometers,
         Meters, MilesInt, FeetInt, Miles, and
         Feet.The default units are meters.
     outputAreaUnits {String}:
         Specifies the units that will be used for calculating area. Density is
         count divided by area, and this parameter sets the units of the area
         in the density calculation.Square Meters-Calculate the density per
         square meter. This is the
         default.Square Kilometers-Calculate the density per square
         kilometer.Square Feet-Calculate the density per square foot.Square
         Miles-Calculate the density per square mile.
     outputCellSize {Linear Unit}:
         The cell size and units for the output raster.The unit values are
         Kilometers, Meters, MilesInt, FeetInt, Miles, and
         Feet.
     inBarriers {Feature Set}:
         The dataset that defines the barriers.The barriers can be a feature
         layer of polyline or polygon features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateDensity_ra(
                *gp_fixargs(
                    (
                        inputPointOrLineFeatures,
                        outputName,
                        countField,
                        searchDistance,
                        outputAreaUnits,
                        outputCellSize,
                        inBarriers,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("InterpolatePoints_ra", None)
def InterpolatePoints(
    inputPointFeatures=None,
    interpolateField=None,
    outputName=None,
    optimizeFor: Literal["SPEED", "BALANCE", "ACCURACY"] | None = None,
    transformData: Literal["TRANSFORM", "NO_TRANSFORM"] | None = None,
    sizeOfLocalModels=None,
    numberOfNeighbors=None,
    outputCellSize=None,
    outputPredictionError: Literal["OUTPUT_ERROR", "NO_OUTPUT_ERROR"] | None = None,
) -> Result2[str | Layer, str | Layer]:
    """InterpolatePoints_ra(inputPointFeatures, interpolateField, outputName, {optimizeFor}, {transformData}, {sizeOfLocalModels}, {numberOfNeighbors}, {outputCellSize}, {outputPredictionError})

       Predicts values at new locations based on measurements from a
       collection of points. The tool takes point data with values at each
       point and returns a raster of predicted values.

    INPUTS:
     inputPointFeatures (Feature Set):
         The input point features you want to interpolate.
     interpolateField (Field):
         The field containing the data values you want to interpolate. The
         field must be numeric.
     outputName (String):
         The name of the output raster service.The default name is based on the
         tool name and the input layer name.
         If the layer name already exists, you will be prompted to provide
         another name.
     optimizeFor {String}:
         Choose your preference for speed versus accuracy. More accurate
         predictions will take longer to calculate.SPEED-The operation is
         optimized for speed.BALANCE-A balance between
         speed and accuracy. This is the default.ACCURACY-The operation is
         optimized for accuracy.
     transformData {Boolean}:
         Choose whether to transform your data to a normal distribution before
         performing analysis. If your data values do not appear to be normally
         distributed (bell-shaped), it is recommended to perform a
         transformation.NO_TRANSFORM-No transformation is applied. This is the
         default.TRANSFORM-A transformation to the normal distribution is
         applied.
     sizeOfLocalModels {Long}:
         Choose the number of points in each of the local models. A larger
         value will make the interpolation more global and stable, but small-
         scale effects may be missed. Smaller values will make the
         interpolation more local, so small-scale effects are more likely to be
         captured, but the interpolation may be unstable.
     numberOfNeighbors {Long}:
         The number of neighbors to use when calculating the prediction at a
         particular cell.
     outputCellSize {Linear Unit}:
         Set the cell size and units of the output raster. If a prediction
         error raster is created, it will also use this cell size.The unit
         values are Kilometers, Meters, MilesInt, FeetInt, Miles, and
         Feet.The default units are meters.
     outputPredictionError {Boolean}:
         Choose whether to output a raster of standard errors of the
         interpolated predictions.Standard errors are useful because they
         provide information about the
         reliability of the predicted values. A simple rule of thumb is that
         the true value will fall within two standard errors of the predicted
         value 95 percent of the time. For example, suppose a new location gets
         a predicted value of 50 with a standard error of 5. This means that
         this task's best guess is that the true value at that location is 50,
         but it reasonably could be as low as 40 or as high as 60. To calculate
         this range of reasonable values, multiply the standard error by 2, add
         this value to the predicted value to get the upper end of the range,
         and subtract it from the predicted value to get the lower end of the
         range. If a raster of standard errors for the interpolated
         predictions is requested, it will have the same name as thebut with
         Errors appended. Result layer nameOUTPUT_ERROR-Create a
         prediction error raster.NO_OUTPUT_ERROR-Do not
         create a prediction error raster. This is the
         default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.InterpolatePoints_ra(
                *gp_fixargs(
                    (
                        inputPointFeatures,
                        interpolateField,
                        outputName,
                        optimizeFor,
                        transformData,
                        sizeOfLocalModels,
                        numberOfNeighbors,
                        outputCellSize,
                        outputPredictionError,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Analyze Terrain toolset
@gptooldoc("CreateViewshed_ra", None)
def CreateViewshed(
    inputElevationSurface=None,
    inputObserverFeatures=None,
    outputName=None,
    optimizeFor: Literal["SPEED", "ACCURACY"] | None = None,
    maximumViewingDistanceType: Literal["DISTANCE", "FIELD"] | None = None,
    maximumViewingDistance=None,
    maximumViewingDistanceField=None,
    minimumViewingDistanceType: Literal["DISTANCE", "FIELD"] | None = None,
    minimumViewingDistance=None,
    minimumViewingDistanceField=None,
    viewingDistanceIs3D: Literal["3D", "2D"] | None = None,
    observersElevationType: Literal["ELEVATION", "FIELD"] | None = None,
    observersElevation=None,
    observersElevationField=None,
    observersHeightType: Literal["HEIGHT", "FIELD"] | None = None,
    observersHeight=None,
    observersHeightField=None,
    targetHeightType: Literal["HEIGHT", "FIELD"] | None = None,
    targetHeight=None,
    targetHeightField=None,
    aboveGroundLevelOutputName=None,
    verticalError=None,
    refractivityCoefficient=None,
    horizontalStartAngle=None,
    horizontalEndAngle=None,
    verticalUpperAngle=None,
    verticalLowerAngle=None,
) -> Result2[str | Layer, str | Layer]:
    """CreateViewshed_ra(inputElevationSurface, inputObserverFeatures, outputName, {optimizeFor}, {maximumViewingDistanceType}, {maximumViewingDistance}, {maximumViewingDistanceField}, {minimumViewingDistanceType}, {minimumViewingDistance}, {minimumViewingDistanceField}, {viewingDistanceIs3D}, {observersElevationType}, {observersElevation}, {observersElevationField}, {observersHeightType}, {observersHeight}, {observersHeightField}, {targetHeightType}, {targetHeight}, {targetHeightField}, {aboveGroundLevelOutputName}, {verticalError}, {refractivityCoefficient}, {horizontalStartAngle}, {horizontalEndAngle}, {verticalUpperAngle}, {verticalLowerAngle})

       Creates areas where an observer can see objects on the ground. The
       input observer points can represent either observers (such as people
       on the ground or lookouts in a fire tower) or observed objects (such
       as wind turbines, water towers, vehicles, or other people).

    INPUTS:
     inputElevationSurface (Image Service / Raster Layer / String):
         The elevation surface that will be used for calculating the
         viewshed.If the vertical unit of the input surface is different from
         the
         horizontal unit, such as when the elevation values are represented in
         feet but the coordinate system is in meters, the surface must have a
         defined vertical coordinate system. This is because the tool uses the
         vertical (z) and horizontal (x,y) units to compute a z-factor for the
         viewshed analysis. Without a vertical coordinate system, and having no
         z-unit information available, it is assumed that the z-unit is the
         same as the x,y unit. The result is an internal z-factor of 1.0 will
         be used for the analysis, which may give unexpected results.The
         elevation surface can be integer or floating point.
     inputObserverFeatures (Feature Set):
         The point features that represent the observer locations when
         calculating the viewsheds.
     outputName (String):
         The name of the output raster service.The default name is based on the
         tool name and the input layer name.
         If the layer name already exists, you will be prompted to provide
         another name.
     optimizeFor {String}:
         Specifies the optimization method that will be used to calculate the
         viewshed.SPEED-Processing speed will be optimized, trading some
         accuracy in the
         result for better performance. This is the default.ACCURACY-Accuracy
         in the results will be optimized, at the expense of
         a longer processing time.
     maximumViewingDistanceType {String}:
         Specifies how the maximum viewing distance will be
         determined.DISTANCE-The maximum distance will be determined by the
         value you
         specify. This is the default method.FIELD-The maximum distance for
         each observer location will be
         determined by the values in a field you specify.
     maximumViewingDistance {Linear Unit}:
         The cutoff distance that will be used where the computation of visible
         areas stops. Beyond this distance, it is unknown whether the observer
         points and the other objects can see each other.The unit values are
         Kilometers, Meters, MilesInt, YardsInt, FeetInt,
         Miles, Yards, and Feet.The default value is 9 statute miles.
     maximumViewingDistanceField {Field}:
         The field containing the maximum viewing distance for each observer.
         The values contained in the field must be in the same unit as the x,y
         unit of the input elevation surface.The maximum viewing distance is a
         cutoff distance where the
         computation of visible areas stops. Beyond this distance, it is
         unknown whether the observer points and the other objects can see each
         other.
     minimumViewingDistanceType {String}:
         Specifies how the minimum visible distance will be
         determined.DISTANCE-The minimum distance will be determined by the
         value you
         specify. This is the default method.FIELD-The minimum distance for
         each observer location will be
         determined by the values in a field you specify.
     minimumViewingDistance {Linear Unit}:
         The distance that will be used where the computation of visible areas
         begins. Cells on the surface closer than this distance are not visible
         in the output but can still block visibility of the cells between the
         minimum and maximum viewing distance.The unit values are Kilometers,
         Meters, MilesInt, YardsInt, FeetInt,
         Miles, Yards, and Feet.
     minimumViewingDistanceField {Field}:
         The field containing the minimum viewing distance for each observer.
         The values contained in the field must be in the same unit as the
         x,y-unit of the input elevation surface.The minimum viewing distance
         defines where the computation of visible
         areas begins. Cells on the surface closer than this distance are not
         visible in the output but can still block visibility of the cells
         between the minimum and maximum viewing distance.
     viewingDistanceIs3D {Boolean}:
         Specifies whether the minimum and maximum viewing distance parameter
         values will be measured in 3D or 2D. A 2D distance is the simple
         linear distance measured between an observer and the target using
         their projected locations at sea level. A 3D distance provides a more
         realistic value by taking their relative heights into
         consideration.2D-The viewing distance will be measured in 2D distance.
         This is the
         default.3D-The viewing distance will be measured in 3D distance.
     observersElevationType {String}:
         Specifies how the elevation of the observers will be
         determined.ELEVATION-The observer elevation will be determined by the
         value you
         specify. This is the default method.FIELD-The elevation for each
         observer location will be determined by
         the values in a field you specify.
     observersElevation {Linear Unit}:
         The elevation that will be used for the observer locations.If this
         parameter is not specified, the observer elevation will be
         obtained from the surface raster using bilinear interpolation. If this
         parameter is set to a value, that value will be applied to all the
         observers. To specify different values for each observer, set this
         parameter to a field in the input observer features.The unit values
         are Kilometers, Meters, MilesInt, YardsInt, FeetInt,
         Miles, Yards, and Feet.
     observersElevationField {Field}:
         The field containing the elevation for the observers. The value
         contained in the field must be in the same unit as the z-unit of the
         input elevation surface.If this parameter is not specified, the
         observer elevation will be
         obtained from the surface raster using bilinear interpolation.
     observersHeightType {String}:
         Specifies how the height of the observers will be
         determined.HEIGHT-The observer height will be determined by the value
         you
         specify. This is the default method.FIELD-The height for each observer
         location will be determined by the
         values in a field you specify.
     observersHeight {Linear Unit}:
         The height that will be used for the observer locations.The unit
         values are Kilometers, Meters, MilesInt, YardsInt, FeetInt,
         Miles, Yards, and Feet.The default value is 6 international feet.
     observersHeightField {Field}:
         The field containing the height for the observers. The value contained
         in the field must be in the same unit as the z-unit of the input
         elevation surface.
     targetHeightType {String}:
         Specifies how the target height will be determined.HEIGHT-The target
         height will be determined by the value you specify.
         This is the default method.FIELD-The height for each target will be
         determined by the values in a
         field you specify.
     targetHeight {Linear Unit}:
         The height of structures or people on the ground that will be used to
         establish visibility. The result viewshed are those areas where an
         observer point can see these other objects. The converse is also true;
         the other objects can see an observer point.The unit values are
         Kilometers, Meters, MilesInt, YardsInt, FeetInt,
         Miles, Yards, and Feet.
     targetHeightField {Field}:
         The field containing the height for the targets. The value contained
         in the field must be in the same unit as the z-unit of the input
         elevation surface.
     aboveGroundLevelOutputName {String}:
         The name of the output above-ground-level (AGL) raster. The AGL result
         is a raster in which each cell value is the minimum height that must
         be added to an otherwise nonvisible cell to make it visible by at
         least one observer. Cells that were already visible will be assigned 0
         in this output raster.
     verticalError {Linear Unit}:
         The amount of uncertainty (the root mean square (RMS) error) in the
         surface elevation values. It is a floating-point value representing
         the expected error of the input elevation values.When this parameter
         is assigned a value greater than 0, the output
         visibility raster will be floating point.
     refractivityCoefficient {Double}:
         The coefficient of the refraction of visible light in air.The default
         value is 0.13.
     horizontalStartAngle {String}:
         The start angle of the horizontal scan range. Provide the value in
         degrees from 0 to 360 with 0 oriented to north. The value can be
         integer or floating point. The default value is 0.You can select a
         field in the input observer features, or you can
         provide a numerical value.
     horizontalEndAngle {String}:
         The end angle of the horizontal scan range. Provide the value in
         degrees from 0 to 360 with 0 oriented to north. The value can be
         integer or floating point. The default value is 360.You can select a
         field in the input observer features, or you can
         provide a numerical value.
     verticalUpperAngle {String}:
         The upper vertical angle limit of the scan relative to the horizontal
         plane. Provide the value in degrees from above -90 up to and including
         90. The value can be integer or floating point. The default value is
         90 (straight up).You can select a field in the input observer
         features, or you can
         provide a numerical value.
     verticalLowerAngle {String}:
         The lower vertical angle limit of the scan relative to the horizontal
         plane. Provide the value in degrees from -90 up to but not including
         90. The value can be integer or floating point. The default value is
         -90 (straight down).You can select a field in the input observer
         features, or you can
         provide a numerical value."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateViewshed_ra(
                *gp_fixargs(
                    (
                        inputElevationSurface,
                        inputObserverFeatures,
                        outputName,
                        optimizeFor,
                        maximumViewingDistanceType,
                        maximumViewingDistance,
                        maximumViewingDistanceField,
                        minimumViewingDistanceType,
                        minimumViewingDistance,
                        minimumViewingDistanceField,
                        viewingDistanceIs3D,
                        observersElevationType,
                        observersElevation,
                        observersElevationField,
                        observersHeightType,
                        observersHeight,
                        observersHeightField,
                        targetHeightType,
                        targetHeight,
                        targetHeightField,
                        aboveGroundLevelOutputName,
                        verticalError,
                        refractivityCoefficient,
                        horizontalStartAngle,
                        horizontalEndAngle,
                        verticalUpperAngle,
                        verticalLowerAngle,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SurfaceParameters_ra", None)
def SurfaceParameters(
    inputSurfaceRaster=None,
    outputRasterName=None,
    parameterType: Literal[
        "SLOPE",
        "ASPECT",
        "MEAN_CURVATURE",
        "TANGENTIAL_CURVATURE",
        "PROFILE_CURVATURE",
        "CONTOUR_CURVATURE",
        "CONTOUR_GEODESIC_TORSION",
        "GAUSSIAN_CURVATURE",
        "CASORATI_CURVATURE",
    ]
    | None = None,
    localSurfaceType: Literal["QUADRATIC", "BIQUADRATIC"] | None = None,
    neighborhoodDistance=None,
    useAdaptiveNeighborhood: Literal["ADAPTIVE_NEIGHBORHOOD", "FIXED_NEIGHBORHOOD"] | None = None,
    zUnit: Literal[
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
    ]
    | None = None,
    outputSlopeMeasurement: Literal["DEGREE", "PERCENT_RISE"] | None = None,
    projectGeodesicAzimuths: Literal["PROJECT_GEODESIC_AZIMUTHS", "GEODESIC_AZIMUTHS"] | None = None,
    useEquatorialAspect: Literal["EQUATORIAL_ASPECT", "NORTH_POLE_ASPECT"] | None = None,
    inputAnalysisMask=None,
) -> Result1[str | Layer]:
    """SurfaceParameters_ra(inputSurfaceRaster, outputRasterName, {parameterType}, {localSurfaceType}, {neighborhoodDistance}, {useAdaptiveNeighborhood}, {zUnit}, {outputSlopeMeasurement}, {projectGeodesicAzimuths}, {useEquatorialAspect}, {inputAnalysisMask})

       Determines parameters of a surface raster such as aspect, slope, and
       several types of curvatures using geodesic methods.

    INPUTS:
     inputSurfaceRaster (Image Service / Raster Layer / String):
         The input surface raster. It can be integer or floating point type.
     outputRasterName (String):
         The name of the output raster service.
     parameterType {String}:
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
     localSurfaceType {String}:
         Specifies the type of surface function that will be fitted around the
         target cell.QUADRATIC-A quadratic surface function will be fitted to
         the
         neighborhood cells. This is the default.BIQUADRATIC-A biquadratic
         surface function will be fitted to the
         neighborhood cells.
     neighborhoodDistance {Linear Unit}:
         The output will be calculated over this distance from the target cell
         center. It determines the neighborhood size.The default value is the
         input raster cell size, resulting in a 3 by 3
         neighborhood.
     useAdaptiveNeighborhood {Boolean}:
         Specifies whether neighborhood distance will vary with landscape
         changes (adaptive). The maximum distance is determined by the
         neighborhood distance. The minimum distance is the input raster cell
         size.FIXED_NEIGHBORHOOD-A single (fixed) neighborhood distance will be
         used
         at all locations. This is the default.ADAPTIVE_NEIGHBORHOOD-An
         adaptive neighborhood distance will be used
         at all locations.
     zUnit {String}:
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
     outputSlopeMeasurement {String}:
         The measurement units (degrees or percentages) that will be used for
         the output slope raster. This parameter is only enabled when
         parameterType = "SLOPE".DEGREE-The inclination of slope will be
         calculated in
         degrees.PERCENT_RISE-The inclination of slope will be calculated as
         percent
         rise, also referred to as the percent slope.
     projectGeodesicAzimuths {Boolean}:
         Specifies whether geodesic azimuths will be projected to correct the
         angle distortion caused by the output spatial
         reference.GEODESIC_AZIMUTHS-Geodesic azimuths will not be projected.
         This is the
         default.PROJECT_GEODESIC_AZIMUTHS-Geodesic azimuths will be projected.
     useEquatorialAspect {Boolean}:
         Specifies whether aspect will be measured from a point on the equator
         or from the north pole.NORTH_POLE_ASPECT-Aspect will be measured from
         the north pole. This is
         the default.EQUATORIAL_ASPECT-Aspect will be measured from a point on
         the equator.
     inputAnalysisMask {Image Service / Feature Layer / Raster Layer / String}:
         The input data defining the locations where the analysis will
         occur.This can be an image service or a feature service. If the input
         is an
         image service, it can be integer or floating-point type. If the input
         is a feature service, it can be point, line, or polygon type.When the
         input mask data is an image service, the analysis will occur
         at locations that have a valid value, including zero. Cells that are
         NoData in the mask input will be NoData in the output."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SurfaceParameters_ra(
                *gp_fixargs(
                    (
                        inputSurfaceRaster,
                        outputRasterName,
                        parameterType,
                        localSurfaceType,
                        neighborhoodDistance,
                        useAdaptiveNeighborhood,
                        zUnit,
                        outputSlopeMeasurement,
                        projectGeodesicAzimuths,
                        useEquatorialAspect,
                        inputAnalysisMask,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Deep Learning toolset
@gptooldoc("ClassifyObjectsUsingDeepLearning_ra", None)
def ClassifyObjectsUsingDeepLearning(
    inputRaster=None,
    inputModel=None,
    outputName=None,
    inputFeatures=None,
    modelArguments=None,
    classLabelField=None,
    processingMode: Literal["PROCESS_AS_MOSAICKED_IMAGE", "PROCESS_ITEMS_SEPARATELY"] | None = None,
) -> Result1[str]:
    """ClassifyObjectsUsingDeepLearning_ra(inputRaster, inputModel, outputName, {inputFeatures}, {modelArguments;modelArguments...}, {classLabelField}, {processingMode})

       Runs a trained deep learning model on an input raster and an optional
       feature class to produce a feature class or table in which each input
       object or feature has an assigned class or category label.

    INPUTS:
     inputRaster (Image Service / Raster Layer / Map Server / Feature Layer / Map Server Layer / Internet Tiled Layer / String):
         The input image to classify. The image can be an image service URL, a
         raster layer, an image service, a map server layer, or an internet
         tiled layer.
     inputModel (File):
         The deep learning model that will be used to classify objects in the
         input image. The input is the URL of a deep learning package (.dlpk)
         item that contains the path to the deep learning binary model file,
         the path to the Python raster function to be used, and other
         parameters such as preferred tile size or padding.
     outputName (String):
         The name of the feature service containing the classified objects.
     inputFeatures {Feature Layer / Map Server Layer / String}:
         The feature service that identifies the location of each object or
         feature to be classified and labeled. Each row in the input feature
         service represents a single object or feature.If no input feature
         service is specified, each input image will be
         classified as a single object. If the input image or images use a
         spatial reference, the output from the tool is a feature class in
         which the extent of each image is used as the bounding geometry for
         each labeled feature class. If the input image or images are not
         spatially referenced, the output from the tool is a table containing
         the image ID values and the class labels for each image.
     modelArguments {Value Table}:
         The function model arguments to use for the classification. These are
         defined in the Python raster function class referenced by the input
         model. This is where you list additional deep learning parameters and
         arguments for experiments and refinement, such as a confidence
         threshold for adjusting the sensitivity. The names of the arguments
         are populated by the tool from the Python module on the Raster
         Analytics server.
     classLabelField {String}:
         The name of the field that will contain the class or category label in
         the output feature class. If a field name is not specified, a
         new field namedwill be
         generated in the output feature class. ClassLabel
     processingMode {String}:
         Specifies how all raster items in a mosaic dataset or an image service
         will be processed. This parameter is applied when the input raster is
         a mosaic dataset or an image service.PROCESS_AS_MOSAICKED_IMAGE-All
         raster items in the mosaic dataset or
         image service will be mosaicked together and processed. This is the
         default.PROCESS_ITEMS_SEPARATELY-All raster items in the mosaic
         dataset or
         image service will be processed as separate images."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ClassifyObjectsUsingDeepLearning_ra(
                *gp_fixargs(
                    (
                        inputRaster,
                        inputModel,
                        outputName,
                        inputFeatures,
                        modelArguments,
                        classLabelField,
                        processingMode,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ClassifyPixelsUsingDeepLearning_ra", None)
def ClassifyPixelsUsingDeepLearning(
    inputRaster=None,
    inputModel=None,
    outputName=None,
    modelArguments=None,
    processingMode: Literal["PROCESS_AS_MOSAICKED_IMAGE", "PROCESS_ITEMS_SEPARATELY"] | None = None,
) -> Result1[str | Layer]:
    """ClassifyPixelsUsingDeepLearning_ra(inputRaster, inputModel, outputName, {modelArguments;modelArguments...}, {processingMode})

       Runs a trained deep learning model on an input image to produce a
       classified raster published as a hosted imagery layer in your portal.

    INPUTS:
     inputRaster (Image Service / Raster Layer / Map Server / Map Server Layer / Internet Tiled Layer / String):
         The input image to classify. It can be an image service URL, a raster
         layer, an image service, a map server layer, or an Internet tiled
         layer.
     inputModel (File):
         The input is a URL of a deep learning package (.dlpk) item. It
         contains the path to the deep learning binary model file, the path to
         the Python raster function to be used, and other parameters such as
         preferred tile size or padding.
     outputName (String):
         The name of the image service of the classified pixels.
     modelArguments {Value Table}:
         The function arguments are defined in the Python raster function class
         referenced by the input model. This is where you list additional deep
         learning parameters and arguments for experiments and refinement, such
         as a confidence threshold for adjusting the sensitivity. The names of
         the arguments are populated by the tool from reading the Python module
         on the RA server.
     processingMode {String}:
         Specifies how all raster items in a mosaic dataset or an image service
         will be processed. This parameter is applied when the input raster is
         a mosaic dataset or an image service.PROCESS_AS_MOSAICKED_IMAGE-All
         raster items in the mosaic dataset or
         image service will be mosaicked together and processed. This is the
         default.PROCESS_ITEMS_SEPARATELY-All raster items in the mosaic
         dataset or
         image service will be processed as separate images."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ClassifyPixelsUsingDeepLearning_ra(
                *gp_fixargs((inputRaster, inputModel, outputName, modelArguments, processingMode), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DetectObjectsUsingDeepLearning_ra", None)
def DetectObjectsUsingDeepLearning(
    inputRaster=None,
    inputModel=None,
    outputName=None,
    modelArguments=None,
    runNMS: Literal["NMS", "NO_NMS"] | None = None,
    confidenceScoreField=None,
    classValueField=None,
    maxOverlapRatio=None,
    processingMode: Literal["PROCESS_AS_MOSAICKED_IMAGE", "PROCESS_ITEMS_SEPARATELY"] | None = None,
) -> Result1[str]:
    """DetectObjectsUsingDeepLearning_ra(inputRaster, inputModel, outputName, {modelArguments;modelArguments...}, {runNMS}, {confidenceScoreField}, {classValueField}, {maxOverlapRatio}, {processingMode})

       Runs a trained deep learning model on an input raster to produce a
       feature class containing the objects it identifies. The feature class
       can be shared as a hosted feature layer in your portal. The features
       can be bounding boxes or polygons around the objects found, or points
       at the centers of the objects.

    INPUTS:
     inputRaster (Image Service / Raster Layer / Map Server / Map Server Layer / Internet Tiled Layer / String):
         The input image used to detect objects. It can be an image service
         URL, a raster layer, an image service, a map server layer, or an
         internet tiled layer.
     inputModel (File):
         The input model can be a file or a URL of a deep learning package
         (.dlpk) item from the portal.
     outputName (String):
         The name of the output feature service of detected objects.
     modelArguments {Value Table}:
         The function model arguments are defined in the Python raster function
         class referenced by the input model. This is where you list additional
         deep learning parameters and arguments for experiments and refinement,
         such as a confidence threshold for fine tuning the sensitivity. The
         names of the arguments are populated by the tool from reading the
         Python module on the RA server.
     runNMS {Boolean}:
         Specifies whether non maximum suppression, where duplicate objects are
         identified and the duplicate feature with a lower confidence value is
         removed, will be performed.NO_NMS-All detected objects will be in the
         output feature class. This
         is the default.NMS-Duplicate detected objects will be removed.
     confidenceScoreField {String}:
         The field in the feature service that contains the confidence scores
         that will be used as output by the object detection method.This
         parameter is required when the NMS keyword is used for the runNMS
         parameter.
     classValueField {String}:
         The name of the class value field in the feature service. If no
         field name is provided, aorfield will be used. If these
         fields do not exist, all records will be identified as belonging to
         one class. ClassvalueValue
     maxOverlapRatio {Double}:
         The maximum overlap ratio for two overlapping features, which is
         defined as the ratio of intersection area over union area. The default
         is 0.
     processingMode {String}:
         Specifies how all raster items in a mosaic dataset or an image service
         will be processed. This parameter is applied when the input raster is
         a mosaic dataset or an image service.PROCESS_AS_MOSAICKED_IMAGE-All
         raster items in the mosaic dataset or
         image service will be mosaicked together and processed. This is the
         default.PROCESS_ITEMS_SEPARATELY-All raster items in the mosaic
         dataset or
         image service will be processed as separate images."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DetectObjectsUsingDeepLearning_ra(
                *gp_fixargs(
                    (
                        inputRaster,
                        inputModel,
                        outputName,
                        modelArguments,
                        runNMS,
                        confidenceScoreField,
                        classValueField,
                        maxOverlapRatio,
                        processingMode,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Generalize toolset
@gptooldoc("Nibble_ra", None)
def Nibble(
    inputRaster=None,
    inputMaskRaster=None,
    outputName=None,
    nibbleValues: Literal["ALL_VALUES", "DATA_ONLY"] | None = None,
    nibbleNodata: Literal["PROCESS_NODATA", "PRESERVE_NODATA"] | None = None,
    inputZoneRaster=None,
) -> Result1[str | Layer]:
    """Nibble_ra(inputRaster, inputMaskRaster, outputName, {nibbleValues}, {nibbleNodata}, {inputZoneRaster})

       Replaces cells of a raster corresponding to a mask with the values of
       the nearest neighbors.

    INPUTS:
     inputRaster (Image Service / Raster Layer / String):
         The input raster that will be nibbled.The raster can be either integer
         or floating point type.
     inputMaskRaster (Image Service / Raster Layer / String):
         The raster used as the mask.The cells that are NoData define the cells
         that will be nibbled, or
         replaced, by the value of the closest nearest neighbour.
     outputName (String):
         The name of the output nibble raster service.The default name is based
         on the tool name and the input layer name.
         If the layer name already exists, you will be prompted to provide
         another name.
     nibbleValues {Boolean}:
         Keywords defining if NoData values in the input raster are allowed to
         nibble into the area defined by the mask raster.ALL_VALUES-Specifies
         that the nearest neighbor value will be used
         whether it is NoData or another data value in the input raster. NoData
         values in the input raster are free to nibble into areas defined in
         the mask if they are the nearest neighbor. This is the
         default.DATA_ONLY-Specifies that only data values are free to nibble
         into
         areas defined in the mask raster. NoData values in the input raster
         are not allowed to nibble into areas defined in the mask raster even
         if they are the nearest neighbor.
     nibbleNodata {Boolean}:
         Keywords defining if NoData cells in the input raster that are within
         the mask will remain NoData in the output
         raster.PRESERVE_NODATA-Specifies that NoData cells in the input raster
         and
         within the mask will remain NoData in the output. This is the
         default.PROCESS_NODATA-Specifies that NoData cells in the input raster
         and
         within the mask can be nibbled into valid output cell values.
     inputZoneRaster {Image Service / Raster Layer / String}:
         The input zone raster. For each zone, input cells that are within the
         mask will be replaced only by the nearest cell values within that same
         zone.A zone is all the cells in a raster that have the same value,
         whether
         or not they are contiguous. The input zone layer defines the shape,
         values, and locations of the zones. The zone raster can be either
         integer or floating point type."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Nibble_ra(
                *gp_fixargs(
                    (inputRaster, inputMaskRaster, outputName, nibbleValues, nibbleNodata, inputZoneRaster), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Hydrology toolset
@gptooldoc("Fill_ra", None)
def Fill(
    inputSurfaceRaster=None,
    outputName=None,
    zLimit=None,
) -> Result1[str | Layer]:
    """Fill_ra(inputSurfaceRaster, outputName, {zLimit})

       Fills sinks in a surface raster to remove small imperfections in the
       data.

    INPUTS:
     inputSurfaceRaster (Image Service / Raster Layer / String):
         The input raster representing a continuous surface.
     outputName (String):
         The name of the output fill raster service.The default name is based
         on the tool name and the input layer name.
         If the layer name already exists, you will be prompted to provide
         another name.
     zLimit {Double}:
         Maximum elevation difference between a sink and its pour point to be
         filled."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.Fill_ra(*gp_fixargs((inputSurfaceRaster, outputName, zLimit), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("FlowAccumulation_ra", None)
def FlowAccumulation(
    inputFlowDirectionRaster=None,
    outputName=None,
    inputWeightRaster=None,
    dataType: Literal["FLOAT", "INTEGER", "DOUBLE"] | None = None,
    flowDirectionType: Literal["D8", "MFD", "DINF"] | None = None,
) -> Result1[str | Layer]:
    """FlowAccumulation_ra(inputFlowDirectionRaster, outputName, {inputWeightRaster}, {dataType}, {flowDirectionType})

       Creates a raster of accumulated flow into each cell.

    INPUTS:
     inputFlowDirectionRaster (Image Service / Raster Layer / String):
         The input raster that shows the direction of flow out of each cell.The
         flow direction raster can be created using the D8, MFD, or DINF
         method. Use the flowDirectionType parameter to specify the method used
         when the flow direction raster was created.
     outputName (String):
         The name of the output flow accumulation raster service.The default
         name is based on the tool name and the input layer name.
         If the layer name already exists, you will be prompted to provide
         another name.
     inputWeightRaster {Image Service / Raster Layer / String}:
         An optional integer input raster for applying a weight to each cell.
     dataType {String}:
         The output accumulation raster can be integer, floating or double
         type.FLOAT-The output raster will be floating point type. This is the
         default.INTEGER-The output raster will be integer type.DOUBLE-The
         output raster will be double type.
     flowDirectionType {String}:
         Specifies the input flow direction raster type.D8-The input flow
         direction raster is of type D8. This is the
         default.MFD-The input flow direction raster is of type Multi Flow
         Direction
         (MFD).DINF-The input flow direction raster is of type D-Infinity
         (DINF)."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FlowAccumulation_ra(
                *gp_fixargs(
                    (inputFlowDirectionRaster, outputName, inputWeightRaster, dataType, flowDirectionType), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FlowDirection_ra", None)
def FlowDirection(
    inputSurfaceRaster=None,
    outputFlowDirectionName=None,
    forceFlow: Literal["FORCE", "NORMAL"] | None = None,
    flowDirectionType: Literal["D8", "MFD", "DINF"] | None = None,
    outputDropName=None,
) -> Result2[str | Layer, str | Layer]:
    """FlowDirection_ra(inputSurfaceRaster, outputFlowDirectionName, {forceFlow}, {flowDirectionType}, {outputDropName})

       Calculates the direction of flow from each cell to its downslope
       neighbor or neighbors using the D8, D-Infinity (DINF), or Multiple
       Flow Direction (MFD) method.

    INPUTS:
     inputSurfaceRaster (Image Service / Raster Layer / String):
         The input raster representing a continuous surface.
     outputFlowDirectionName (String):
         The name of the output flow direction raster service.The default name
         is based on the tool name and the input layer name.
         If the layer name already exists, you will be prompted to provide
         another name.
     forceFlow {Boolean}:
         Keywords defining if NoData values in the input raster are allowed to
         nibble into the area defined by the mask raster.NORMAL-If the maximum
         drop on the inside of an edge cell is greater
         than zero, the flow direction will be determined as usual; otherwise,
         the flow direction will be toward the edge. Cells that should flow
         from the edge of the surface raster inward will do so. This is the
         default.FORCE-All cells at the edge of the surface raster will flow
         outward
         from the surface raster.
     flowDirectionType {String}:
         Specifies the type of flow method to use while computing flow
         directions.D8-Assign a flow direction based on the D8 flow method.
         This method
         assigns flow direction to the steepest downslope neighbor. This is the
         default.MFD-Assign a flow direction based on the MFD flow method. This
         method
         assigns multiple flow directions towards all downslope
         neighbors.DINF-Assign a flow direction based on the D-Infinity flow
         method using
         the steepest slope of a triangular facet.
     outputDropName {String}:
         The name of the output drop raster service.The default name is based
         on the tool name and the input layer name.
         If the layer name already exists, you will be prompted to provide
         another name."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FlowDirection_ra(
                *gp_fixargs(
                    (inputSurfaceRaster, outputFlowDirectionName, forceFlow, flowDirectionType, outputDropName), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FlowDistance_ra", None)
def FlowDistance(
    inputStreamRaster=None,
    inputSurfaceRaster=None,
    outputName=None,
    inputFlowDirectionRaster=None,
    distanceType: Literal["VERTICAL", "HORIZONTAL"] | None = None,
    flowDirectionType: Literal["D8", "MFD", "DINF"] | None = None,
    statisticsType: Literal["MINIMUM", "MAXIMUM", "WEIGHTED_MEAN"] | None = None,
) -> Result1[str | Layer]:
    """FlowDistance_ra(inputStreamRaster, inputSurfaceRaster, outputName, {inputFlowDirectionRaster}, {distanceType}, {flowDirectionType}, {statisticsType})

       Computes, for each cell, the horizontal or vertical component of
       downslope distance, following the flow paths, to cells on a stream
       into which they flow. In the case of multiple flow paths, minimum,
       weighted mean, or maximum flow distance can be computed.

    INPUTS:
     inputStreamRaster (Image Service / Raster Layer / String):
         The input raster that defines the stream network.
     inputSurfaceRaster (Image Service / Raster Layer / String):
         The input raster representing a continuous surface.
     outputName (String):
         The name of the output flow distance raster service.The default name
         is based on the tool name and the input layer name.
         If the layer name already exists, you will be prompted to provide
         another name.
     inputFlowDirectionRaster {Image Service / Raster Layer / String}:
         The input raster that shows the direction of flow out of each
         cell.When a flow direction raster is provided, the down slope
         direction(s)
         will be limited to those defined by the input flow directions.The flow
         direction raster can be created using the D8, MFD, or DINF
         method. Use the flowDirectionType parameter to specify the method used
         when the flow direction raster was created.
     distanceType {String}:
         The distance type to be calculated.VERTICAL-The flow distance
         calculations represent the vertical
         component of minimum flow distance, following the flow path, from each
         cell in the domain to cell(s) on the stream into which they flow. This
         is the default.HORIZONTAL-The flow distance calculations represent the
         horizontal
         component of minimum flow distance, following the flow path, from each
         cell in the domain to cell(s) on the stream into which they flow.
     flowDirectionType {String}:
         Specifies the input flow direction raster type.D8-The input flow
         direction raster is of type D8. This is the
         default.MFD-The input flow direction raster is of type Multi Flow
         Direction
         (MFD).DINF-The input flow direction raster is of type D-Infinity
         (DINF).
     statisticsType {String}:
         Determines the statistics type used to compute flow distance over
         multiple flow paths.If there exists only a single flow path from each
         cell to a cell on
         the stream, all statistics types produce the same result.MINIMUM-Where
         multiple flow paths exist, minimum flow distance is
         computed. This is the default.WEIGHTED_MEAN-Where multiple flow paths
         exist, a weighted mean of flow
         distance is computed. Flow proportion from a cell to its downstream
         neighboring cells is used as a weight for computing weighted
         mean.MAXIMUM-When multiple flow paths exist, maximum flow distance is
         computed."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FlowDistance_ra(
                *gp_fixargs(
                    (
                        inputStreamRaster,
                        inputSurfaceRaster,
                        outputName,
                        inputFlowDirectionRaster,
                        distanceType,
                        flowDirectionType,
                        statisticsType,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("StreamLink_ra", None)
def StreamLink(
    inputStreamRaster=None,
    inputFlowDirectionRaster=None,
    outputName=None,
) -> Result1[str | Layer]:
    """StreamLink_ra(inputStreamRaster, inputFlowDirectionRaster, outputName)

       Assigns unique values to sections of a raster linear network between
       intersections.

    INPUTS:
     inputStreamRaster (Image Service / Raster Layer / String):
         An input raster that represents a linear stream network.
     inputFlowDirectionRaster (Image Service / Raster Layer / String):
         The input raster that shows the direction of flow out of each cell.
     outputName (String):
         The name of the output stream link raster service.The default name is
         based on the tool name and the input layer name.
         If the layer name already exists, you will be prompted to provide
         another name."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.StreamLink_ra(*gp_fixargs((inputStreamRaster, inputFlowDirectionRaster, outputName), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Watershed_ra", None)
def Watershed(
    inputFlowDirectionRaster=None,
    inPourPointRasterOrFeatures=None,
    outputName=None,
    pourPointField=None,
) -> Result1[str | Layer]:
    """Watershed_ra(inputFlowDirectionRaster, inPourPointRasterOrFeatures, outputName, {pourPointField})

       Determines the contributing area above a set of cells in a raster.

    INPUTS:
     inputFlowDirectionRaster (Image Service / Raster Layer / String):
         The input raster that shows the direction of flow out of each cell.
     inPourPointRasterOrFeatures (Image Service / Feature Layer / Raster Layer / String):
         The input pour point locations.
     outputName (String):
         The name of the output watershed raster service.The default name is
         based on the tool name and the input layer name.
         If the layer name already exists, you will be prompted to provide
         another name.
     pourPointField {String}:
         Field used to assign values to the pour point locations."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Watershed_ra(
                *gp_fixargs((inputFlowDirectionRaster, inPourPointRasterOrFeatures, outputName, pourPointField), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# Manage Data toolset
@gptooldoc("ConvertFeatureToRaster_ra", None)
def ConvertFeatureToRaster(
    inputFeatures=None,
    valueField=None,
    outputName=None,
    outputCellSize=None,
) -> Result1[str | Layer]:
    """ConvertFeatureToRaster_ra(inputFeatures, valueField, outputName, {outputCellSize})

       Converts features to a raster dataset.

    INPUTS:
     inputFeatures (Feature Set):
         The input feature layer.
     valueField (Field):
         Choose the field that will be used to assign values to the output
         raster.
     outputName (String):
         The name of the output raster service.The default name is based on the
         tool name and the input layer name.
         If the layer name already exists, you will be prompted to provide
         another name.
     outputCellSize {Linear Unit}:
         Enter the cell size and unit for the output raster.The unit values are
         Kilometers, Meters, MilesInt, FeetInt, Miles, and
         Feet.The default units are meters."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConvertFeatureToRaster_ra(*gp_fixargs((inputFeatures, valueField, outputName, outputCellSize), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ConvertRasterToFeature_ra", None)
def ConvertRasterToFeature(
    inputRaster=None,
    field=None,
    outputType: Literal["POINT", "LINE", "POLYGON"] | None = None,
    simplifyLinesOrPolygons: Literal["SIMPLIFY", "NO_SIMPLIFY"] | None = None,
    outputName=None,
    createMultipartFeatures: Literal["MULTIPLE_OUTER_PART", "SINGLE_OUTER_PART"] | None = None,
    maxVerticesPerFeature=None,
) -> Result1[str]:
    """ConvertRasterToFeature_ra(inputRaster, {field}, {outputType}, {simplifyLinesOrPolygons}, outputName, {createMultipartFeatures}, {maxVerticesPerFeature})

       Converts a raster to a feature dataset as points, lines, or polygons.

    INPUTS:
     inputRaster (Image Service / Raster Layer / String):
         The input raster layer.
     field {String}:
         A field that specifies the conversion value.It can be any integer or
         text value.A field containing floating-point values can only be used
         if the
         output is to a point dataset. The default is thefield, which
         contains the value in each
         raster cell. Value
     outputType {String}:
         Specifies the output type.POINT-The raster will be converted to a
         point dataset. This is the
         default.LINE-The raster will be converted to a line feature
         dataset.POLYGON-The raster will be converted to a polygon feature
         dataset.
     simplifyLinesOrPolygons {Boolean}:
         Specifies whether lines or polygons will be simplified (smoothed). The
         smoothing is done in such a way that the line contains a minimum
         number of segments while remaining as close as possible to the
         original raster cell edges.SIMPLIFY-The line or polygon features will
         be smoothed to produce a
         more generalized result. This is the default.NO_SIMPLIFY-The line or
         polygon features will not be smoothed and will
         follow the cell boundaries of the raster dataset.This parameter is
         only supported if outputType is LINE or POLYGON.
     outputName (String):
         The output feature class that will contain the converted points,
         lines, or polygons.
     createMultipartFeatures {Boolean}:
         Specifies whether the output polygons will consist of single-part or
         multipart features.MULTIPLE_OUTER_PART-Multipart features will be
         created based on
         polygons that have the same value.SINGLE_OUTER_PART-Individual
         (single-part) features will be created
         for each polygon. This is the default.This parameter is only supported
         if outputType is POLYGON.
     maxVerticesPerFeature {Long}:
         The vertex limit used to subdivide a polygon into smaller polygons.
         This parameter produces similar output as that created by the Dice
         tool in the Data Management toolbox.If left empty, the output polygons
         will not be split. This is the
         default.This parameter is only supported if outputType is POLYGON."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConvertRasterToFeature_ra(
                *gp_fixargs(
                    (
                        inputRaster,
                        field,
                        outputType,
                        simplifyLinesOrPolygons,
                        outputName,
                        createMultipartFeatures,
                        maxVerticesPerFeature,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Summarize Data toolset
@gptooldoc("SummarizeRasterWithin_ra", None)
def SummarizeRasterWithin(
    inputZoneLayer=None,
    zoneField=None,
    inputRasterLayertoSummarize=None,
    outputName=None,
    statisticType: Literal[
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
    ]
    | None = None,
    ignoreMissingValues: Literal["DATA", "NODATA"] | None = None,
    processAsMultidimensional: Literal["ALL_SLICES", "CURRENT_SLICE"] | None = None,
    percentileValue=None,
    percentileInterpolationType: Literal["AUTO_DETECT", "NEAREST", "LINEAR"] | None = None,
    circularCalculation: Literal["CIRCULAR", "ARITHMETIC"] | None = None,
    circularWrapValue=None,
) -> Result1[str | Layer]:
    """SummarizeRasterWithin_ra(inputZoneLayer, zoneField, inputRasterLayertoSummarize, outputName, {statisticType}, {ignoreMissingValues}, {processAsMultidimensional}, {percentileValue}, {percentileInterpolationType}, {circularCalculation}, {circularWrapValue})

       Calculates statistics on values of a raster within the zones of
       another dataset.

    INPUTS:
     inputZoneLayer (Image Service / Feature Layer / Raster Layer / String):
         The input that defines the zones.Both raster and feature data can be
         used for the zone input.
     zoneField (String):
         The field that defines each zone.It can be an integer or a string
         field of the zone dataset.
     inputRasterLayertoSummarize (Image Service / Raster Layer / String):
         The raster that contains the values on which to summarize a statistic.
     outputName (String):
         The name of the output raster service.If the image service layer
         already exists, you will be prompted to
         provide another name.
     statisticType {String}:
         Specifies the statistic type that will be calculated.The available
         options when the value raster is integer are MEAN,
         MAJORITY, MAJORITY_COUNT, MAJORITY_PERCENT, MAXIMUM, MEDIAN, MINIMUM,
         MINORITY, MINORITY_COUNT, MINORITY_PERCENT, PERCENTILE, RANGE, STD,
         SUM, VARIETY.If the value raster is float, the options are MEAN,
         MAXIMUM, MEDIAN,
         MINIMUM, PERCENTILE, RANGE, STD, and SUM.MEAN-The average of all cells
         in the raster layer to be summarized
         that belong to the same zone as the output cell will be calculated.
         This is the default.MAJORITY-The value that occurs most often of all
         cells in the raster
         layer to be summarized that belong to the same zone as the output cell
         will be calculated.MAJORITY_COUNT-The frequency of all cells that
         contain the majority
         value in the value raster that belong to the same zone as the output
         cell will be calculated.MAJORITY_PERCENT-The percentage of cells that
         contain the majority
         value in the value raster that belong to the same zone as the output
         cell will be calculated.MAXIMUM-The largest value of all cells in the
         raster layer to be
         summarized that belong to the same zone as the output cell will be
         calculated.MEDIAN-The median value of all cells in the raster layer to
         be
         summarized that belong to the same zone as the output cell will be
         calculated.MINIMUM-The smallest value of all cells in the raster layer
         to be
         summarized that belong to the same zone as the output cell will be
         calculated.MINORITY-The value that occurs least often of all cells in
         the raster
         layer to be summarized that belong to the same zone as the output cell
         will be calculated.MINORITY_COUNT-The frequency of all cells that
         contain the minority
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
         cells in the raster layer to be summarized that belong to the same
         zone as the output cell will be calculated.STD-The standard deviation
         of all cells in the raster layer to be
         summarized that belong to the same zone as the output cell will be
         calculated.SUM-The total value of all cells in the raster layer to be
         summarized
         that belong to the same zone as the output cell will be
         calculated.VARIETY-The number of unique values for all cells in the
         raster layer
         to be summarized that belong to the same zone as the output cell will
         be calculated.
     ignoreMissingValues {Boolean}:
         Specifies whether missing values in the raster layer to summarize will
         be ignored in the results of the zones that they fall
         within.DATA-Within any particular zone, only cells that have a value
         in the
         raster layer being summarized will be used in determining the output
         value for that zone. Missing or NoData cells will be ignored in the
         statistic calculation. This is the default.NODATA-Within any
         particular zone, if any cells in the raster layer
         being summarized do not have a value, they will not be ignored and
         their existence indicates that there is insufficient information to
         perform statistical calculations for all the cells in that zone.
         Consequently, the entire zone will receive the NoData value on the
         output raster.
     processAsMultidimensional {Boolean}:
         Specifies how the input rasters will be processed if they are
         multidimensional.CURRENT_SLICE-Statistics will be calculated from the
         current slice of
         the input multidimensional dataset. This is the
         default.ALL_SLICES-Statistics will be calculated for all dimensions of
         the
         input multidimensional dataset.
     percentileValue {Double}:
         The percentile that will be calculated. The default is 90, indicating
         the 90th percentile.The values can range from 0 to 100. The 0th
         percentile is essentially
         equivalent to the minimum statistic, and the 100th percentile is
         equivalent to maximum. A value of 50 will produce essentially the same
         result as the median statistic.This parameter is only available while
         calculating percentile.
     percentileInterpolationType {String}:
         Specifies the method of interpolation that will be used when the
         percentile value falls between two cell values from the input value
         raster.AUTO_DETECT-If the input value raster is of integer pixel type,
         the
         NEAREST method will be used. If the input value raster is of floating-
         point pixel type, the LINEAR method will be used. This is the
         default.NEAREST-The nearest available value to the desired percentile
         will be
         used. In this case, the output pixel type is the same as that of the
         input value raster.LINEAR-The weighted average of the two surrounding
         values from the
         desired percentile will be used. In this case, the output pixel type
         is floating point.
     circularCalculation {Boolean}:
         Specifies how the statistics type will be
         calculated.ARITHMETIC-Arithmetic statistics will be calculated. This
         is the
         default.CIRCULAR-Circular statistics that are appropriate for cyclic
         quantities will be calculated, such as compass direction in degrees,
         daytimes, and fractional parts of real numbers.
     circularWrapValue {Double}:
         The highest possible value (upper bound) in the cyclic data. It is a
         positive number, with a default value of 360. This value also
         represents the same quantity as the lowest possible value (lower
         bound).This parameter is only applicable when circular statistics are
         calculated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SummarizeRasterWithin_ra(
                *gp_fixargs(
                    (
                        inputZoneLayer,
                        zoneField,
                        inputRasterLayertoSummarize,
                        outputName,
                        statisticType,
                        ignoreMissingValues,
                        processAsMultidimensional,
                        percentileValue,
                        percentileInterpolationType,
                        circularCalculation,
                        circularWrapValue,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ZonalStatisticsAsTable_ra", None)
def ZonalStatisticsAsTable(
    inputZoneRasterOrFeatures=None,
    inputValueRaster=None,
    outputTableName=None,
    zoneField=None,
    ignoreNodata: Literal["DATA", "NODATA"] | None = None,
    statisticType: Literal[
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
    ]
    | None = None,
    percentileValues=None,
    processAsMultidimensional: Literal["ALL_SLICES", "CURRENT_SLICE"] | None = None,
    percentileInterpolationType: Literal["AUTO_DETECT", "NEAREST", "LINEAR"] | None = None,
    circularCalculation: Literal["CIRCULAR", "ARITHMETIC"] | None = None,
    circularWrapValue=None,
) -> Result1[str | Table]:
    """ZonalStatisticsAsTable_ra(inputZoneRasterOrFeatures, inputValueRaster, outputTableName, zoneField, {ignoreNodata}, {statisticType}, {percentileValues;percentileValues...}, {processAsMultidimensional}, {percentileInterpolationType}, {circularCalculation}, {circularWrapValue})

       Calculates the values of a raster within the zones of another dataset
       and reports the results to a table.

    INPUTS:
     inputZoneRasterOrFeatures (Image Service / Feature Layer / Raster Layer / String):
         The input that defines the zones.Both raster and feature data can be
         used for the zone input.
     inputValueRaster (Image Service / Raster Layer / String):
         The raster that contains the values on which to summarize a statistic.
     outputTableName (String):
         The name of the output table.If it's an existing table, you will be
         prompted to provide another
         name.
     zoneField (String):
         The field that defines each zone.It can be an integer or a string
         field of the zone dataset.
     ignoreNodata {Boolean}:
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
     statisticType {String}:
         Specifies the statistic type that will be calculated.The available
         options when the value raster is integer are ALL, MEAN,
         MAJORITY, MAJORITY_COUNT, MAJORITY_PERCENT,
         MAJORITY_VALUE_COUNT_PERCENT, MAXIMUM, MEDIAN, MINIMUM, MINORITY,
         MINORITY_COUNT, MINORITY_PERCENT, MINORITY_VALUE_COUNT_PERCENT,
         PERCENTILE, RANGE, STD, SUM, VARIETY, MINI_MAX, MEAN_SD, and
         MIN_MAX_MEAN.If the value raster is float, the options are ALL, MEAN,
         MAXIMUM,
         MEDIAN, MINIMUM, PERCENTILE, RANGE, STD, and SUM. ALL-All of
         the statistics will be calculated for an integer
         type value raster. All statistics exceptandwill be calculated for a
         floating-point type value raster. This is the default.
         MedianPercentileMEAN-The mean of all cells in the raster layer to be
         summarized that
         belong to the same zone as the output cell will be
         calculated.MAJORITY-The value that occurs most often of all cells in
         the raster
         layer to be summarized that belong to the same zone as the output cell
         will be calculated.MAJORITY_COUNT-The frequency of all cells that
         contain the majority
         value in the value raster that belong to the same zone as the output
         cell will be calculated.MAJORITY_PERCENT-The percentage of cells that
         contain the majority
         value in the value raster that belong to the same zone as the output
         cell will be calculated.MAXIMUM-The largest value of all cells in the
         raster layer to be
         summarized that belong to the same zone as the output cell will be
         calculated.MEDIAN-The median value of all cells in the raster layer to
         be
         summarized that belong to the same zone as the output cell will be
         calculated.MINIMUM-The smallest value of all cells in the raster layer
         to be
         summarized that belong to the same zone as the output cell will be
         calculated.MINORITY-The value that occurs least often of all cells in
         the raster
         layer to be summarized that belong to the same zone as the output cell
         will be calculated.MINORITY_COUNT-The frequency of all cells that
         contain the minority
         value in the value raster that belong to the same zone as the output
         cell will be calculated.MINORITY_PERCENT-The percentage of cells that
         contain the minority
         value in the value raster that belong to the same zone as the output
         cell will be calculated. PERCENTILE-The percentile of all
         cells in the value raster
         that belong to the same zone as the output cell will be calculated.
         The 90th percentile is calculated by default. You can specify other
         values (from 0 to 100) using theparameter. Percentile
         ValuesRANGE-The difference between the largest and smallest value of
         all
         cells in the raster layer to be summarized that belong to the same
         zone as the output cell will be calculated.STD-The standard deviation
         of all cells in the raster layer to be
         summarized that belong to the same zone as the output cell will be
         calculated.SUM-The total value of all cells in the raster layer to be
         summarized
         that belong to the same zone as the output cell will be
         calculated.VARIETY-The number of unique values for all cells in the
         raster layer
         to be summarized that belong to the same zone as the output cell will
         be calculated.MIN_MAX-Both the minimum and maximum statistics will be
         calculated.MEAN_STD-Both the mean and standard deviation statistics
         will be
         calculated.MIN_MAX_MEAN-The minimum, maximum, and mean statistics will
         be
         calculated.MAJORITY_VALUE_COUNT_PERCENT-The majority value, count,
         and
         percentage statistics will be calculated.MINORITY_VALUE_COUNT_PERCENT-
         The minority value, count, and
         percentage statistics will be calculated.
     percentileValues {Double}:
         The percentile that will be calculated. The default is 90, indicating
         the 90th percentile.The values can range from 0 to 100. The 0th
         percentile is essentially
         equivalent to the minimum statistic, and the 100th percentile is
         equivalent to maximum. A value of 50 will produce essentially the same
         result as the median statistic.This parameter is only available while
         calculating percentile.
     processAsMultidimensional {Boolean}:
         Specifies how the input rasters will be processed if they are
         multidimensional.CURRENT_SLICE-Statistics will be calculated from the
         current slice of
         the input multidimensional dataset. This is the
         default.ALL_SLICES-Statistics will be calculated for all dimensions of
         the
         input multidimensional dataset.
     percentileInterpolationType {String}:
         Specifies the method of interpolation that will be used when the
         percentile value falls between two cell values from the input value
         raster.AUTO_DETECT-If the input value raster is of integer pixel type,
         the
         NEAREST method will be used. If the input value raster is of floating-
         point pixel type, the LINEAR method will be used. This is the
         default.NEAREST-The nearest available value to the desired percentile
         will be
         used.LINEAR-The weighted average of the two surrounding values from
         the
         desired percentile will be used.
     circularCalculation {Boolean}:
         Specifies how the statistics type will be
         calculated.ARITHMETIC-Arithmetic statistics will be calculated. This
         is the
         default.CIRCULAR-Circular statistics that are appropriate for cyclic
         quantities will be calculated, such as compass direction in degrees,
         daytimes, and fractional parts of real numbers.
     circularWrapValue {Double}:
         The highest possible value (upper bound) in the cyclic data. It is a
         positive number, with a default value of 360. This value also
         represents the same quantity as the lowest possible value (lower
         bound).This parameter is only applicable when circular statistics are
         calculated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ZonalStatisticsAsTable_ra(
                *gp_fixargs(
                    (
                        inputZoneRasterOrFeatures,
                        inputValueRaster,
                        outputTableName,
                        zoneField,
                        ignoreNodata,
                        statisticType,
                        percentileValues,
                        processAsMultidimensional,
                        percentileInterpolationType,
                        circularCalculation,
                        circularWrapValue,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Use Proximity toolset
@gptooldoc("DistanceAccumulation_ra", None)
def DistanceAccumulation(
    inputSourceRasterOrFeatures=None,
    outputDistanceAccumulationRasterName=None,
    inputBarrierRasterOrFeatures=None,
    inputSurfaceRaster=None,
    inputCostRaster=None,
    inputVerticalRaster=None,
    verticalFactor=None,
    inputHorizontalRaster=None,
    horizontalFactor=None,
    outputBackDirectionRasterName=None,
    outputSourceDirectionRasterName=None,
    outputSourceLocationRasterName=None,
    sourceInitialAccumulation=None,
    sourceMaximumAccumulation=None,
    sourceCostMultiplier=None,
    sourceDirection: Literal["TO_SOURCE", "FROM_SOURCE"] | None = None,
    distanceMethod: Literal["PLANAR", "GEODESIC"] | None = None,
) -> Result:
    """DistanceAccumulation_ra(inputSourceRasterOrFeatures, outputDistanceAccumulationRasterName, {inputBarrierRasterOrFeatures}, {inputSurfaceRaster}, {inputCostRaster}, {inputVerticalRaster}, {verticalFactor}, {inputHorizontalRaster}, {horizontalFactor}, {outputBackDirectionRasterName}, {outputSourceDirectionRasterName}, {outputSourceLocationRasterName}, {sourceInitialAccumulation}, {sourceMaximumAccumulation}, {sourceCostMultiplier}, {sourceDirection}, {distanceMethod})

       Calculates accumulated distance for each cell to sources, allowing for
       straight-line distance, cost distance, and true surface distance, as
       well as vertical and horizontal cost factors.

    INPUTS:
     inputSourceRasterOrFeatures (Image Service / Feature Layer / Raster Layer / String):
         The input source locations.This is an image service or feature service
         identifying the cells or
         locations from which, or to which, the least accumulated cost distance
         for every output cell location is calculated.For an image service, the
         input type can be integer or floating point.
         For a feature service, the input type can be point, line or polygon.
     outputDistanceAccumulationRasterName (String):
         The output distance accumulation raster name.The distance accumulation
         raster contains the accumulative distance
         for each cell from, or to, the least-cost source.
     inputBarrierRasterOrFeatures {Image Service / Feature Layer / Raster Layer / String}:
         The dataset that defines the barriers.The barriers can be defined by
         an integer or a floating-point image
         service, or by a feature service. For a feature service, the input
         type can be point, line or polygon.For an image service barrier, the
         barrier must have a valid value,
         including zero, and the areas that are not barriers must be NoData.
     inputSurfaceRaster {Image Service / Raster Layer / String}:
         An image service defining the elevation values at each cell
         location.The values are used to calculate the actual surface distance
         covered
         when passing between cells.
     inputCostRaster {Image Service / Raster Layer / String}:
         An image service defining the impedance or cost to move
         planimetrically through each cell.The value at each cell location
         represents the cost-per-unit distance
         for moving through the cell. Each cell location value is multiplied by
         the cell resolution while also compensating for diagonal movement to
         obtain the total cost of passing through the cell.The values of the
         cost raster can be integer or floating point. Cost
         raster values that are negative or zero are invalid but will be
         treated as small positive cost values.
     inputVerticalRaster {Image Service / Raster Layer / String}:
         An image service defining the z-values for each cell location.The
         values are used for calculating the slope used to identify the
         vertical factor incurred when moving from one cell to another.
     verticalFactor {Vertical Factor}:
         The Vertical Factor object defines the relationship between the
         vertical cost factor and the vertical relative moving angle
         (VRMA).There are several factors with modifiers that identify a
         defined
         vertical factor graph. The graphs are used to identify the vertical
         factor used in calculating the total cost for moving into a
         neighboring cell.In the descriptions below, vertical factor (VF)
         defines the vertical
         difficulty encountered in moving from one cell to the next, and VRMA
         identifies the slope angle between the FROM or processing cell and the
         TO cell.The object comes in the following forms: VfBinary, VfLinear,
         VfInverseLinear, VfSymLinear, VfSymInverseLinear, VfCos, VfSec, VfSec,
         VfCosSec, VfSecCos, VfHikingTime, VfBidirHikingTime, VfTableThe
         definitions and parameters of these forms are as follows:
         VfBinary({zeroFactor}, {lowCutAngle}, {highCutAngle})
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
         VF is a bidirectional modified hiking time function of the VRMA.The
         modifiers to the vertical parameters are as follows:zeroFactor-The
         vertical factor used when the VRMA is zero. This factor
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
         as 0.02222).
     inputHorizontalRaster {Image Service / Raster Layer / String}:
         A raster defining the horizontal direction at each cell.The values on
         the raster must be integers ranging from 0 to 360, with
         0 degrees being north, or toward the top of the screen, and increasing
         clockwise. Flat areas should be given a value of -1. The values at
         each location will be used in conjunction with the horizontal_factor
         parameter to determine the horizontal cost incurred when moving from a
         cell to its neighbors.
     horizontalFactor {Horizontal Factor}:
         The Horizontal Factor object defines the relationship between the
         horizontal cost factor and the horizontal relative moving angle.There
         are several factors with modifiers that identify a defined
         horizontal factor graph. The graphs are used to identify the
         horizontal factor used in calculating the total cost of moving into a
         neighboring cell.In the descriptions below, horizontal factor (HF)
         defines the
         horizontal difficulty encountered when moving from one cell to the
         next, and horizontal relative moving angle (HRMA) identifies the angle
         between the horizontal direction from a cell and the moving
         direction.The object comes in the following forms: HfBinary,
         HfForward,
         HfLinear, and HfInverseLinear        The definitions and parameters of
         these are as follows:
         HfBinary({zeroFactor}, {cutAngle})          If the HRMA is
         less than the cut angle, the HF is set to the value
         associated with the zero factor; otherwise, it is infinity.
         HfForward({zeroFactor}, {sideValue})          Only forward
         movement is allowed. The HRMA must be greater than or
         equal to 0 and less than 90 (0 <= HRMA < 90). If the HRMA is greater
         than 0 and less than 45 degrees, the HF for the cell is set to the
         value associated with the zero factor. If the HRMA is greater than or
         equal to 45 degrees, the side value modifier value is used. The HF for
         any HRMA equal to or greater than 90 degrees is set to infinity.
         HfLinear({zeroFactor}, {cutAngle}, {slope})          The HF
         is a linear function of the HRMA.
         HfInverseLinear({zeroFactor}, {cutAngle}, {slope})
         The HF is an inverse linear function of the HRMA. The modifiers
         to the horizontal keywords are as follows:
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
         is specified.
     outputBackDirectionRasterName {String}:
         The output back direction raster name.The back direction raster
         contains calculated directions in degrees.
         The direction identifies the next cell along the optimal path back to
         the least accumulative cost source while avoiding barriers.The range
         of values is from 0 degrees to 360 degrees. The value 0 is
         reserved for the source cells. Due east (right) is 90 degrees, and the
         values increase clockwise (180 is south, 270 is west, and 360 is
         north).The output raster is of type float.
     outputSourceDirectionRasterName {String}:
         The output source direction raster name.The source direction raster
         identifies the direction of the least
         accumulated cost source cell as an azimuth in degrees.The range of
         values is from 0 degrees to 360 degrees. The value 0 is
         reserved for the source cells. Due east (right) is 90 degrees, and the
         values increase clockwise (180 is south, 270 is west, and 360 is
         north).The output raster is of type float.
     outputSourceLocationRasterName {String}:
         The source location raster is a multiband output. The first band
         contains a row index, and the second band contains a column index.
         These indexes identify the location of the source cell that is the
         least accumulated cost distance away.
     sourceInitialAccumulation {String}:
         The initial accumulative cost that will be used to begin the cost
         calculation.Allows for the specification of the fixed cost associated
         with a
         source. Instead of starting at a cost of zero, the cost algorithm will
         begin with the value set by source_initial_accumulation.The values
         must be zero or greater. The default is 0.
     sourceMaximumAccumulation {String}:
         The maximum accumulation for the traveler for a source.The cost
         calculations continue for each source until the specified
         accumulation is reached.The values must be greater than zero. The
         default accumulation is to
         the edge of the output raster.
     sourceCostMultiplier {String}:
         The multiplier that will be applied to the cost values.This allows for
         control of the mode of travel or the magnitude at a
         source. The greater the multiplier, the greater the cost to move
         through each cell.The values must be greater than zero. The default is
         1.
     sourceDirection {String}:
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
     distanceMethod {String}:
         Specifies whether the distance will be calculated using a planar (flat
         earth) or a geodesic (ellipsoid) method.PLANAR-The distance
         calculation will be performed on a projected flat
         plane using a 2D Cartesian coordinate system. This is the
         default.GEODESIC-The distance calculation will be performed on the
         ellipsoid.
         Regardless of input or output projection, the results will not change."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DistanceAccumulation_ra(
                *gp_fixargs(
                    (
                        inputSourceRasterOrFeatures,
                        outputDistanceAccumulationRasterName,
                        inputBarrierRasterOrFeatures,
                        inputSurfaceRaster,
                        inputCostRaster,
                        inputVerticalRaster,
                        verticalFactor,
                        inputHorizontalRaster,
                        horizontalFactor,
                        outputBackDirectionRasterName,
                        outputSourceDirectionRasterName,
                        outputSourceLocationRasterName,
                        sourceInitialAccumulation,
                        sourceMaximumAccumulation,
                        sourceCostMultiplier,
                        sourceDirection,
                        distanceMethod,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DistanceAllocation_ra", None)
def DistanceAllocation(
    inputSourceRasterOrFeatures=None,
    outputDistanceAllocationRasterName=None,
    inputBarrierRasterOrFeatures=None,
    inputSurfaceRaster=None,
    inputCostRaster=None,
    inputVerticalRaster=None,
    verticalFactor=None,
    inputHorizontalRaster=None,
    horizontalFactor=None,
    outputDistanceAccumulationRasterName=None,
    outputBackDirectionRasterName=None,
    outputSourceDirectionRasterName=None,
    outputSourceLocationRasterName=None,
    sourceField=None,
    sourceInitialAccumulation=None,
    sourceMaximumAccumulation=None,
    sourceCostMultiplier=None,
    sourceDirection: Literal["TO_SOURCE", "FROM_SOURCE"] | None = None,
    distanceMethod: Literal["PLANAR", "GEODESIC"] | None = None,
) -> Result:
    """DistanceAllocation_ra(inputSourceRasterOrFeatures, outputDistanceAllocationRasterName, {inputBarrierRasterOrFeatures}, {inputSurfaceRaster}, {inputCostRaster}, {inputVerticalRaster}, {verticalFactor}, {inputHorizontalRaster}, {horizontalFactor}, {outputDistanceAccumulationRasterName}, {outputBackDirectionRasterName}, {outputSourceDirectionRasterName}, {outputSourceLocationRasterName}, {sourceField}, {sourceInitialAccumulation}, {sourceMaximumAccumulation}, {sourceCostMultiplier}, {sourceDirection}, {distanceMethod})

       Calculates distance allocation for each cell to the provided sources
       based on straight-line distance, cost distance, and true surface
       distance, as well as vertical and horizontal cost factors.

    INPUTS:
     inputSourceRasterOrFeatures (Image Service / Feature Layer / Raster Layer / String):
         The input source locations.This is an image service or feature service
         identifying the cells or
         locations from or to which the allocation for every output cell
         location is calculated.For an image service, the input type can be
         integer or floating point.
         For a feature service, the input type can be point, line or polygon.
     outputDistanceAllocationRasterName (String):
         The name of the output distance allocation raster service.
     inputBarrierRasterOrFeatures {Image Service / Feature Layer / Raster Layer / String}:
         The dataset that defines the barriers.The barriers can be defined by
         an integer or a floating-point image
         service, or by a feature service. For a feature service, the input
         type can be point, line or polygon.For an image service barrier, the
         barrier must have a valid value,
         including zero, and the areas that are not barriers must be NoData.
     inputSurfaceRaster {Image Service / Raster Layer / String}:
         An image service defining the elevation values at each cell
         location.The values are used to calculate the actual surface distance
         covered
         when passing between cells.
     inputCostRaster {Image Service / Raster Layer / String}:
         An image service defining the impedance or cost to move
         planimetrically through each cell.The value at each cell location
         represents the cost-per-unit distance
         for moving through the cell. Each cell location value is multiplied by
         the cell resolution while also compensating for diagonal movement to
         obtain the total cost of passing through the cell.The values of the
         cost raster can be integer or floating point. Cost
         raster values that are negative or zero are invalid but will be
         treated as small positive cost values.
     inputVerticalRaster {Image Service / Raster Layer / String}:
         An image service defining the z-values for each cell location.The
         values are used for calculating the slope used to identify the
         vertical factor incurred when moving from one cell to another.
     verticalFactor {Vertical Factor}:
         The Vertical Factor object defines the relationship between the
         vertical cost factor and the vertical relative moving angle
         (VRMA).There are several factors with modifiers that identify a
         defined
         vertical factor graph. The graphs are used to identify the vertical
         factor used in calculating the total cost for moving into a
         neighboring cell.In the descriptions below, vertical factor (VF)
         defines the vertical
         difficulty encountered in moving from one cell to the next, and VRMA
         identifies the slope angle between the FROM or processing cell and the
         TO cell.The object comes in the following forms: VfBinary, VfLinear,
         VfInverseLinear, VfSymLinear, VfSymInverseLinear, VfCos, VfSec, VfSec,
         VfCosSec, VfSecCos, VfHikingTime, VfBidirHikingTime, VfTableThe
         definitions and parameters of these forms are as follows:
         VfBinary({zeroFactor}, {lowCutAngle}, {highCutAngle})
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
         VF is a bidirectional modified hiking time function of the VRMA.The
         modifiers to the vertical parameters are as follows:zeroFactor-The
         vertical factor used when the VRMA is zero. This factor
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
         as 0.02222).
     inputHorizontalRaster {Image Service / Raster Layer / String}:
         A raster defining the horizontal direction at each cell.The values on
         the raster must be integers ranging from 0 to 360, with
         0 degrees being north, or toward the top of the screen, and increasing
         clockwise. Flat areas should be given a value of -1. The values at
         each location will be used in conjunction with the horizontal_factor
         parameter to determine the horizontal cost incurred when moving from a
         cell to its neighbors.
     horizontalFactor {Horizontal Factor}:
         The Horizontal Factor object defines the relationship between the
         horizontal cost factor and the horizontal relative moving angle.There
         are several factors with modifiers that identify a defined
         horizontal factor graph. The graphs are used to identify the
         horizontal factor used in calculating the total cost of moving into a
         neighboring cell.In the descriptions below, horizontal factor (HF)
         defines the
         horizontal difficulty encountered when moving from one cell to the
         next, and horizontal relative moving angle (HRMA) identifies the angle
         between the horizontal direction from a cell and the moving
         direction.The object comes in the following forms: HfBinary,
         HfForward,
         HfLinear, and HfInverseLinear        The definitions and parameters of
         these are as follows:
         HfBinary({zeroFactor}, {cutAngle})          If the HRMA is
         less than the cut angle, the HF is set to the value
         associated with the zero factor; otherwise, it is infinity.
         HfForward({zeroFactor}, {sideValue})          Only forward
         movement is allowed. The HRMA must be greater than or
         equal to 0 and less than 90 (0 <= HRMA < 90). If the HRMA is greater
         than 0 and less than 45 degrees, the HF for the cell is set to the
         value associated with the zero factor. If the HRMA is greater than or
         equal to 45 degrees, the side value modifier value is used. The HF for
         any HRMA equal to or greater than 90 degrees is set to infinity.
         HfLinear({zeroFactor}, {cutAngle}, {slope})          The HF
         is a linear function of the HRMA.
         HfInverseLinear({zeroFactor}, {cutAngle}, {slope})
         The HF is an inverse linear function of the HRMA. The modifiers
         to the horizontal keywords are as follows:
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
         is specified.
     outputDistanceAccumulationRasterName {String}:
         The output distance accumulation raster name.The distance accumulation
         raster contains the accumulative distance
         for each cell from, or to, the least-cost source.
     outputBackDirectionRasterName {String}:
         The output back direction raster name.The back direction raster
         contains calculated directions in degrees.
         The direction identifies the next cell along the optimal path back to
         the least accumulative cost source while avoiding barriers.The range
         of values is from 0 degrees to 360 degrees. The value 0 is
         reserved for the source cells. Due east (right) is 90 degrees, and the
         values increase clockwise (180 is south, 270 is west, and 360 is
         north).The output raster is of type float.
     outputSourceDirectionRasterName {String}:
         The output source direction raster name.The source direction raster
         identifies the direction of the least
         accumulated cost source cell as an azimuth in degrees.The range of
         values is from 0 degrees to 360 degrees. The value 0 is
         reserved for the source cells. Due east (right) is 90 degrees, and the
         values increase clockwise (180 is south, 270 is west, and 360 is
         north).The output raster is of type float.
     outputSourceLocationRasterName {String}:
         The output source location raster name.The source location raster is a
         multiband output. The first band
         contains a row index, and the second band contains a column index.
         These indexes identify the location of the source cell that is the
         least accumulated cost distance away.
     sourceField {String}:
         The field used to assign values to the source locations. It must be of
         type integer.
     sourceInitialAccumulation {String}:
         The initial accumulative cost that will be used to begin the cost
         calculation.Allows for the specification of the fixed cost associated
         with a
         source. Instead of starting at a cost of zero, the cost algorithm will
         begin with the value set by source_initial_accumulation.The values
         must be zero or greater. The default is 0.
     sourceMaximumAccumulation {String}:
         The maximum accumulation for the traveler for a source.The cost
         calculations continue for each source until the specified
         accumulation is reached.The values must be greater than zero. The
         default accumulation is to
         the edge of the output raster.
     sourceCostMultiplier {String}:
         The multiplier that will be applied to the cost values.This allows for
         control of the mode of travel or the magnitude at a
         source. The greater the multiplier, the greater the cost to move
         through each cell.The values must be greater than zero. The default is
         1.
     sourceDirection {String}:
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
     distanceMethod {String}:
         Specifies whether the distance will be calculated using a planar (flat
         earth) or a geodesic (ellipsoid) method.PLANAR-The distance
         calculation will be performed on a projected flat
         plane using a 2D Cartesian coordinate system. This is the
         default.GEODESIC-The distance calculation will be performed on the
         ellipsoid.
         Regardless of input or output projection, the results will not change."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DistanceAllocation_ra(
                *gp_fixargs(
                    (
                        inputSourceRasterOrFeatures,
                        outputDistanceAllocationRasterName,
                        inputBarrierRasterOrFeatures,
                        inputSurfaceRaster,
                        inputCostRaster,
                        inputVerticalRaster,
                        verticalFactor,
                        inputHorizontalRaster,
                        horizontalFactor,
                        outputDistanceAccumulationRasterName,
                        outputBackDirectionRasterName,
                        outputSourceDirectionRasterName,
                        outputSourceLocationRasterName,
                        sourceField,
                        sourceInitialAccumulation,
                        sourceMaximumAccumulation,
                        sourceCostMultiplier,
                        sourceDirection,
                        distanceMethod,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("OptimalPathAsLine_ra", None)
def OptimalPathAsLine(
    inputDestinationRasterOrFeatures=None,
    inputDistanceAccumulationRaster=None,
    inputBackDirectionRaster=None,
    outputPolylineName=None,
    destinationField=None,
    pathType: Literal["BEST_SINGLE", "EACH_CELL", "EACH_ZONE"] | None = None,
    createNetworkPaths: Literal["NETWORK_PATHS", "DESTINATIONS_TO_SOURCES"] | None = None,
) -> Result1[str | Layer]:
    """OptimalPathAsLine_ra(inputDestinationRasterOrFeatures, inputDistanceAccumulationRaster, inputBackDirectionRaster, outputPolylineName, {destinationField}, {pathType}, {createNetworkPaths})

       Calculates the optimal path from a source to a destination as a line.

    INPUTS:
     inputDestinationRasterOrFeatures (Image Service / Feature Layer / Raster Layer / String):
         A raster or feature dataset identifying locations from which the least
         accumulative cost path is determined to the least costly source.For a
         raster, the input type must be integer, and it must consist of
         cells that have valid values (zero is a valid value). The remaining
         cells must be assigned NoData. For a feature service, the input type
         can be point, line or polygon.
     inputDistanceAccumulationRaster (Image Service / Raster Layer / String):
         The distance accumulation raster is used to determine the optimal path
         from the sources to the destinations.The distance accumulation raster
         is usually created with the Distance
         Accumulation or Distance Allocation tool. Each cell in the distance
         accumulation raster represents the minimum accumulative cost distance
         over a surface from each cell to a set of source cells.
     inputBackDirectionRaster (Image Service / Raster Layer / String):
         The back direction raster contains calculated directions in degrees.
         The direction identifies the next cell along the optimal path back to
         the least accumulative cost source while avoiding barriers.The range
         of values is from 0 degrees to 360 degrees. The value 0 is
         reserved for the source cells. Due east (right) is 90 degrees, and the
         values increase clockwise (180 is south, 270 is west, and 360 is
         north).
     outputPolylineName (String):
         The name of the output feature service that contains the optimal
         paths.
     destinationField {String}:
         The field that will be used to obtain values for the destination
         locations.This field must be an integer.
     pathType {String}:
         Specifies a keyword defining the manner in which the values and zones
         in the input destination data will be interpreted in the cost path
         calculations.EACH_ZONE-For each zone in the input destination data, a
         least-cost
         path will be determined and saved on the output raster. With this
         option, the least-cost path for each zone begins at the cell with the
         lowest cost distance weighting in the zone. This is the
         default.BEST_SINGLE-For all cells in the input destination data, the
         least-
         cost path will be derived from the cell with the minimum of the least-
         cost paths to source cells.EACH_CELL-For each cell with valid values
         in the input destination
         data, a least-cost will be is determined and saved on the output
         raster. With this option, each cell of the input destination data is
         treated separately, and a least-cost path is determined for each cell.
     createNetworkPaths {Boolean}:
         Specifies whether complete, and possibly overlapping, paths from the
         destinations to the sources are calculated or if nonoverlapping
         network paths are created.DESTINATIONS_TO_SOURCES-Complete paths from
         the destinations to the
         sources are calculated, which can be overlapping. This is the
         default.NETWORK_PATHS-Nonoverlapping network paths are calculated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.OptimalPathAsLine_ra(
                *gp_fixargs(
                    (
                        inputDestinationRasterOrFeatures,
                        inputDistanceAccumulationRaster,
                        inputBackDirectionRaster,
                        outputPolylineName,
                        destinationField,
                        pathType,
                        createNetworkPaths,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("OptimalPathAsRaster_ra", None)
def OptimalPathAsRaster(
    inputDestinationRasterOrFeatures=None,
    inputDistanceAccumulationRaster=None,
    inputBackDirectionRaster=None,
    outputRasterName=None,
    destinationField=None,
    pathType: Literal["BEST_SINGLE", "EACH_CELL", "EACH_ZONE"] | None = None,
) -> Result1[str | Layer]:
    """OptimalPathAsRaster_ra(inputDestinationRasterOrFeatures, inputDistanceAccumulationRaster, inputBackDirectionRaster, outputRasterName, {destinationField}, {pathType})

       Calculates the optimal path from a source to a destination as a
       raster.

    INPUTS:
     inputDestinationRasterOrFeatures (Image Service / Feature Layer / Raster Layer / String):
         A raster or feature dataset identifying locations from which the least
         accumulative cost path is determined to the least costly source.For a
         raster, the input type must be integer, and it must consist of
         cells that have valid values (zero is a valid value). The remaining
         cells must be assigned NoData. For a feature service, the input type
         can be point, line or polygon.
     inputDistanceAccumulationRaster (Image Service / Raster Layer / String):
         The distance accumulation raster is used to determine the optimal path
         from the sources to the destinations.The distance accumulation raster
         is usually created with the Distance
         Accumulation or Distance Allocation tool. Each cell in the distance
         accumulation raster represents the minimum accumulative cost distance
         over a surface from each cell to a set of source cells.
     inputBackDirectionRaster (Image Service / Raster Layer / String):
         The back direction raster contains calculated directions in degrees.
         The direction identifies the next cell along the optimal path back to
         the least accumulative cost source while avoiding barriers.The range
         of values is from 0 degrees to 360 degrees. The value 0 is
         reserved for the source cells. Due east (right) is 90 degrees, and the
         values increase clockwise (180 is south, 270 is west, and 360 is
         north).
     outputRasterName (String):
         The name of output raster service that contains the optimal paths.
     destinationField {String}:
         The field that will be used to obtain values for the destination
         locations.
     pathType {String}:
         Specifies a keyword defining the manner in which the values and zones
         in the input destination data will be interpreted in the cost path
         calculations.EACH_ZONE-For each zone in the input destination data, a
         least-cost
         path will be determined and saved on the output raster. With this
         option, the least-cost path for each zone begins at the cell with the
         lowest cost distance weighting in the zone. This is the
         default.BEST_SINGLE-For all cells in the input destination data, the
         least-
         cost path will be derived from the cell with the minimum of the least-
         cost paths to source cells.EACH_CELL-For each cell with valid values
         in the input destination
         data, a least-cost will be is determined and saved on the output
         raster. With this option, each cell of the input destination data is
         treated separately, and a least-cost path is determined for each cell."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.OptimalPathAsRaster_ra(
                *gp_fixargs(
                    (
                        inputDestinationRasterOrFeatures,
                        inputDistanceAccumulationRaster,
                        inputBackDirectionRaster,
                        outputRasterName,
                        destinationField,
                        pathType,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("OptimalRegionConnections_ra", None)
def OptimalRegionConnections(
    inputRegionRasterOrFeatures=None,
    outputOptimalLinesName=None,
    inputBarrierRasterOrFeatures=None,
    inputCostRaster=None,
    outputNeighborConnectionsName=None,
    distanceMethod: Literal["PLANAR", "GEODESIC"] | None = None,
    connectionsWithinRegions: Literal["GENERATE_CONNECTIONS", "NO_CONNECTIONS"] | None = None,
) -> Result2[str | Layer, str | Layer]:
    """OptimalRegionConnections_ra(inputRegionRasterOrFeatures, outputOptimalLinesName, {inputBarrierRasterOrFeatures}, {inputCostRaster}, {outputNeighborConnectionsName}, {distanceMethod}, {connectionsWithinRegions})

       Calculates the optimal connection of paths between two or more input
       regions.

    INPUTS:
     inputRegionRasterOrFeatures (Image Service / Feature Layer / Raster Layer / String):
         The input regions to be connected by the optimal network.Regions can
         be defined by either raster or feature data.If the region input is
         raster, the regions are defined by groups of
         contiguous (adjacent) cells of the same value. Each region must be
         uniquely numbered. The cells that are not part of any region must be
         NoData. The raster type must be integer, and the values can be either
         positive or negative.If the region input is feature data, it can be
         polygons, lines, or
         points. Polygon feature regions cannot be composed of multipart
         polygons.
     outputOptimalLinesName (String):
         The name of the output line feature service that connects each input
         region.Each path (or line) is uniquely numbered and additional fields
         in the
         attribute table store specific information about the path. Those
         additional fields are the following:PATHID-The unique identifier for
         the pathPATHCOST-The total
         accumulative distance or cost for the pathREGION1-The first region the
         path connectsREGION2-The other region the path connectsThis
         information provides insight into the paths within the network.Since
         each path is represented by a unique line, there will be
         multiple lines in locations where paths travel the same route.
     inputBarrierRasterOrFeatures {Image Service / Feature Layer / Raster Layer / String}:
         The dataset that defines the barriers.The barriers can be defined by
         an integer or a floating-point image
         service, or by a feature service. For a feature service, the input
         type can be point, line or polygon.For an image service barrier, the
         barrier must have a valid value,
         including zero, and the areas that are not barriers must be NoData.
     inputCostRaster {Image Service / Raster Layer / String}:
         An image service defining the impedance or cost to move
         planimetrically through each cell.The value at each cell location
         represents the cost-per-unit distance
         for moving through the cell. Each cell location value is multiplied by
         the cell resolution while also compensating for diagonal movement to
         obtain the total cost of passing through the cell.The values of the
         cost raster can be integer or floating point. Cost
         raster values that are negative or zero are invalid but will be
         treated as small positive cost values.
     outputNeighborConnectionsName {String}:
         The output polyline feature class identifying all paths from each
         region to each of its closest or cost neighbors.Each path (or line) is
         uniquely numbered and additional fields in the
         attribute table store specific information about the path. Those
         additional fields are the following:PATHID-The unique identifier for
         the pathPATHCOST-The total
         accumulative distance or cost for the pathREGION1-The first region the
         path connectsREGION2-The other region the path connectsThis
         information provides insight into the paths within the network
         and is useful when deciding which paths should be removed if
         necessary.Since each path is represented by a unique line, there will
         be
         multiple lines in locations where paths travel the same route.
     distanceMethod {String}:
         Specifies whether the distance will be calculated using a planar (flat
         earth) or a geodesic (ellipsoid) method.PLANAR-The distance
         calculation will be performed on a projected flat
         plane using a 2D Cartesian coordinate system. This is the
         default.GEODESIC-The distance calculation will be performed on the
         ellipsoid.
         Regardless of input or output projection, the results will not change.
     connectionsWithinRegions {String}:
         Specifies whether the paths will continue and connect within the input
         regions.GENERATE_CONNECTIONS-Paths will continue within the input
         regions to
         connect all paths that enter a region.NO_CONNECTIONS-Paths will stop
         at the edges of the input regions and
         will not continue or connect within them."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.OptimalRegionConnections_ra(
                *gp_fixargs(
                    (
                        inputRegionRasterOrFeatures,
                        outputOptimalLinesName,
                        inputBarrierRasterOrFeatures,
                        inputCostRaster,
                        outputNeighborConnectionsName,
                        distanceMethod,
                        connectionsWithinRegions,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Use Proximity (Legacy) toolset
@gptooldoc("CalculateDistance_ra", None)
def CalculateDistance(
    inputSourceRasterOrFeatures=None,
    outputDistanceName=None,
    maximumDistance=None,
    outputCellSize=None,
    outputDirectionName=None,
    outputAllocationName=None,
    allocationField=None,
    distanceMethod: Literal["Planar", "Geodesic"] | None = None,
    inputBarrierRasterOrFeatures=None,
    outputBackDirectionName=None,
) -> Result:
    """CalculateDistance_ra(inputSourceRasterOrFeatures, outputDistanceName, {maximumDistance}, {outputCellSize}, {outputDirectionName}, {outputAllocationName}, {allocationField}, {distanceMethod}, {inputBarrierRasterOrFeatures}, {outputBackDirectionName})

       Calculates the Euclidean distance from a single source or set of
       sources.

    INPUTS:
     inputSourceRasterOrFeatures (Image Service / Feature Layer / Raster Layer / String):
         The layer that defines the sources to calculate the distance to. The
         layer can be image service or feature service.For image service, the
         input type can be integer or floating point.For feature service, the
         input can be point, line or polygon.
     outputDistanceName (String):
         The name of the output distance raster service.
     maximumDistance {Linear Unit}:
         The maximum distance to calculate out to.The unit values are
         Kilometers, Meters, MilesInt, YardsInt, FeetInt,
         Miles, Yards, and Feet.The default units are meters.
     outputCellSize {Linear Unit}:
         Set the cell size and units for the output raster.The unit values are
         Kilometers, Meters, MilesInt, YardsInt, FeetInt,
         Miles, Yards, and Feet.The default units are meters.
     outputDirectionName {String}:
         The name of the output direction raster service.
     outputAllocationName {String}:
         The name of the output allocation raster service.
     allocationField {String}:
         A field on the source input that holds the values that define each
         source. It must be of type integer.
     distanceMethod {String}:
         Specifies whether to calculate the distance using a planar (flat
         earth) or a geodesic (ellipsoid) method.Planar-The distance
         calculation will be performed on a projected flat
         plane using a 2D Cartesian coordinate system. This is the
         default.Geodesic-The distance calculation will be performed on the
         ellipsoid.
         Therefore, regardless of input or output projection, the results do
         not change.
     inputBarrierRasterOrFeatures {Image Service / Feature Layer / Raster Layer / String}:
         Dataset that defines the barriers.The barriers can be defined by an
         integer or floating point raster, or
         a feature layer.
     outputBackDirectionName {String}:
         The name of the output back direction raster service."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateDistance_ra(
                *gp_fixargs(
                    (
                        inputSourceRasterOrFeatures,
                        outputDistanceName,
                        maximumDistance,
                        outputCellSize,
                        outputDirectionName,
                        outputAllocationName,
                        allocationField,
                        distanceMethod,
                        inputBarrierRasterOrFeatures,
                        outputBackDirectionName,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateTravelCost_ra", None)
def CalculateTravelCost(
    inputSourceRasterOrFeatures=None,
    outputDistanceName=None,
    inputCostRaster=None,
    inputSurfaceRaster=None,
    maximumDistance=None,
    inputHorizontalRaster=None,
    horizontalFactor=None,
    inputVerticalRaster=None,
    verticalFactor=None,
    sourceCostMultiplier=None,
    sourceStartCost=None,
    sourceResistanceRate=None,
    sourceCapacity=None,
    sourceTravelDirection: Literal["FROM_SOURCE", "TO_SOURCE"] | None = None,
    outputBacklinkName=None,
    outputAllocationName=None,
    allocationField=None,
) -> Result3[str | Layer, str | Layer, str | Layer]:
    """CalculateTravelCost_ra(inputSourceRasterOrFeatures, outputDistanceName, {inputCostRaster}, {inputSurfaceRaster}, {maximumDistance}, {inputHorizontalRaster}, {horizontalFactor}, {inputVerticalRaster}, {verticalFactor}, {sourceCostMultiplier}, {sourceStartCost}, {sourceResistanceRate}, {sourceCapacity}, {sourceTravelDirection}, {outputBacklinkName}, {outputAllocationName}, {allocationField})

       Calculates the least accumulative cost distance from or to the least-
       cost source, while accounting for surface distance along with
       horizontal and vertical cost factors.

    INPUTS:
     inputSourceRasterOrFeatures (Image Service / Feature Layer / Raster Layer / String):
         The layer that defines the sources to calculate the distance to. The
         layer can be raster or feature.
     outputDistanceName (String):
         The name of the output distance raster service.The cost distance image
         service identifies, for each cell, the least
         accumulative cost distance over a cost surface to the identified
         source locations.
     inputCostRaster {Image Service / Raster Layer / String}:
         A raster defining the impedance or cost to move planimetrically
         through each cell.The value at each cell location represents the cost-
         per-unit distance
         for moving through the cell. Each cell location value is multiplied by
         the cell resolution while also compensating for diagonal movement to
         obtain the total cost of passing through the cell.The values of the
         cost raster can be integer or floating point, but
         they cannot be negative or zero (you cannot have a negative or zero
         cost).
     inputSurfaceRaster {Image Service / Raster Layer / String}:
         A raster defining the elevation values at each cell location. The
         values are used to calculate the actual surface distance covered when
         passing between cells.
     maximumDistance {Double}:
         Defines the threshold that the accumulative cost values cannot exceed.
     inputHorizontalRaster {Image Service / Raster Layer / String}:
         A raster defining the horizontal direction at each cell.The values on
         the raster must be integers ranging from 0 to 360, with
         0 degrees being north, or toward the top of the screen, and increasing
         clockwise. Flat areas should be given a value of -1.The values at each
         location will be used in conjunction with the
         {horizontal_factor} to determine the horizontal cost incurred when
         moving from a cell to its neighbors.
     horizontalFactor {Horizontal Factor}:
         The Horizontal Factor defines the relationship between the horizontal
         cost factor and the horizontal relative moving angle.There are several
         factors with modifiers from which to select that
         identify a defined horizontal factor graph. The graphs are used to
         identify the horizontal factor used in calculating the total cost of
         moving into a neighboring cell.In the explanations below, two acronyms
         are used: HF stands for
         horizontal factor, which defines the horizontal difficulty encountered
         when moving from one cell to the next; and HRMA stands for horizontal
         relative moving angle, which identifies the angle between the
         horizontal direction from a cell and the moving direction.There are
         several types of horizontal factor available:Binary-Indicates that if
         the HRMA is less than the cut angle, the HF
         is set to the value associated with the zero factor; otherwise, it is
         infinity.Forward-Establishes that only forward movement is allowed.
         The HRMA
         must be greater or equal to 0 and less than 90 degrees (0 <= HRMA <
         90). If the HRMA is greater than 0 and less than 45 degrees, the HF
         for the cell is set to the value associated with the zero factor. If
         the HRMA is greater than or equal to 45 degrees, the side value
         modifier value is used. The HF for any HRMA equal to or greater than
         90 degrees is set to infinity.Linear-Specifies that the HF is a linear
         function of the HRMA.Inverse Linear-Specifies that the HF is an
         inverse linear function of
         the HRMA.The default is Binary.Characteristics for the horizontal
         keywords:Zero factor-Establishes the horizontal factor to be used when
         the HRMA
         is zero. This factor positions the y-intercept for any of the
         horizontal factor functions.Cut angle-Defines the HRMA angle beyond
         which the HF will be set to
         infinity. Slope-Establishes the slope of the straight line
         used with
         theandhorizontal factor keywords. The slope is specified as a fraction
         of rise over run (for example, 45 percent slope is 1/45, which is
         input as 0.02222). LinearInverse Linear         Side
         value-Establishes the HF when the HRMA is greater than
         or equal to 45 degrees and less than 90 degrees when thehorizontal
         factor keyword is specified. Forward
     inputVerticalRaster {Image Service / Raster Layer / String}:
         A raster defining the vertical (z) value for each cell.
     verticalFactor {Vertical Factor}:
         The Vertical Factor defines the relationship between the vertical cost
         factor and the vertical relative moving angle (VRMA).There are several
         factors with modifiers from which to select that
         identify a defined vertical factor graph. The graphs are used to
         identify the vertical factor used in calculating the total cost for
         moving into a neighboring cell.In the explanations below, two acronyms
         are used: VF stands for
         vertical factor, which defines the vertical difficulty encountered in
         moving from one cell to the next; and VRMA stands for vertical
         relative moving angle, which identifies the slope angle between the
         FROM or processing cell and the TO cell.There are several types of
         vertical factor available:Binary-Specifies that if the VRMA is greater
         than the low-cut angle
         and less than the high-cut angle, the VF is set to the value
         associated with the zero factor; otherwise, it is
         infinity.Linear-Indicates that the VF is a linear function of the
         VRMA.Symmetric Linear-Specifies that the VF is a linear function of
         the
         VRMA in either the negative or positive side of the VRMA,
         respectively, and the two linear functions are symmetrical with
         respect to the VF (y) axis.Inverse Linear-Indicates that the VF is an
         inverse linear function of
         the VRMA.Symmetric Inverse Linear-Specifies that the VF is an inverse
         linear
         function of the VRMA in either the negative or positive side of the
         VRMA, respectively, and the two linear functions are symmetrical with
         respect to the VF (y) axis.Cos-Identifies the VF as the cosine-based
         function of the VRMA.Sec-Identifies the VF as the secant-based
         function of the VRMA.Cos-Sec-Specifies that the VF is the cosine-based
         function of the VRMA
         when the VRMA is negative and the secant-based function of the VRMA
         when the VRMA is nonnegative.Sec-Cos-Specifies that the VF is the
         secant-based function of the VRMA
         when the VRMA is negative and the cosine-based function of the VRMA
         when the VRMA is nonnegative.The default is Binary.Characteristics for
         the vertical keywords:Zero factor-Establishes the vertical factor used
         when the VRMA is
         zero. This factor positions the y-intercept of the specified function.
         By definition, the zero factor is not applicable to any of the
         trigonometric vertical functions (COS, SEC, COS-SEC, or SEC-COS). The
         y-intercept is defined by these functions.Low Cut angle-Defines the
         VRMA angle below which the VF will be set to
         infinity.High Cut angle-Defines the VRMA angle above which the VF will
         be set
         to infinity. Slope-Establishes the slope of the straight line
         used with
         theandvertical-factor keywords. The slope is specified as a fraction
         of rise over run (for example, 45 percent slope is 1/45, which is
         input as 0.02222). LinearInverse Linear
     sourceCostMultiplier {String}:
         Multiplier to apply to the cost values.Allows for control of the mode
         of travel or the magnitude at a source.
         The greater the multiplier, the greater the cost to move through each
         cell.The values must be greater than zero. The default is 1.
     sourceStartCost {String}:
         The starting cost from which to begin the cost calculations.Allows for
         the specification of the fixed cost associated with a
         source. Instead of starting at a cost of zero, the cost algorithm will
         begin with the value set by sourceStartCost.The values must be zero or
         greater. The default is 0.
     sourceResistanceRate {String}:
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
     sourceCapacity {String}:
         Defines the cost capacity for the traveler for a source.The cost
         calculations continue for each source until the specified
         capacity is reached.The values must be greater than zero. The default
         capacity is to the
         edge of the output raster.
     sourceTravelDirection {String}:
         Defines the direction of the traveler when applying horizontal and
         vertical factors, the source resistance rate, and the source starting
         cost.FROM_SOURCE-The horizontal factor, vertical factor, source
         resistance
         rate, and source starting cost will be applied beginning at the input
         source, and moving out to the non-source cells. This is the
         default.TO_SOURCE-The horizontal factor, vertical factor, source
         resistance
         rate, and source starting cost will be applied beginning at each non-
         source cell and moving back to the input source.Either specify the
         FROM_SOURCE or TO_SOURCE keyword, which will be
         applied to all sources, or specify a field in the source data that
         contains the keywords to identify the direction of travel for each
         source. That field must contain the strings FROM_SOURCE or TO_SOURCE.
     outputBacklinkName {String}:
         The name of the output backlink raster service.The backlink raster
         contains values of 0 through 360, which define the
         direction along the least accumulative cost path from a cell to reach
         its least-cost source, while accounting for surface distance as well
         as horizontal and vertical surface factors.
     outputAllocationName {String}:
         The name of the output allocation raster service.This raster
         identifies the zone of each source location (cell or
         feature) that could be reached with the least accumulative cost.The
         output raster is of integer type.
     allocationField {String}:
         A field on the source input that holds the values that define each
         source."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateTravelCost_ra(
                *gp_fixargs(
                    (
                        inputSourceRasterOrFeatures,
                        outputDistanceName,
                        inputCostRaster,
                        inputSurfaceRaster,
                        maximumDistance,
                        inputHorizontalRaster,
                        horizontalFactor,
                        inputVerticalRaster,
                        verticalFactor,
                        sourceCostMultiplier,
                        sourceStartCost,
                        sourceResistanceRate,
                        sourceCapacity,
                        sourceTravelDirection,
                        outputBacklinkName,
                        outputAllocationName,
                        allocationField,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CostPathAsPolyline_ra", None)
def CostPathAsPolyline(
    inputDestinationRasterOrFeatures=None,
    inputCostDistanceRaster=None,
    inputCostBacklinkRaster=None,
    outputPolylineName=None,
    pathType: Literal["EACH_CELL", "EACH_ZONE", "BEST_SINGLE"] | None = None,
    destinationField=None,
) -> Result1[str | Layer]:
    """CostPathAsPolyline_ra(inputDestinationRasterOrFeatures, inputCostDistanceRaster, inputCostBacklinkRaster, outputPolylineName, {pathType}, {destinationField})

       Calculates the least-cost path from a source to a destination as a
       line feature.

    INPUTS:
     inputDestinationRasterOrFeatures (Image Service / Feature Layer / Raster Layer / String):
         An image service or feature service that identifies those locations
         from which the least-cost path is determined to the least costly
         source.If the input is an image service, the input consists of cells
         that
         have valid values (zero is a valid value), and the remaining cells
         must be assigned NoData.
     inputCostDistanceRaster (Image Service / Raster Layer / String):
         The cost distance or Euclidean distance raster to be used to determine
         the least-cost path from the sources to the destinations.
     inputCostBacklinkRaster (Image Service / Raster Layer / String):
         The name of the raster used to determine the path to return to a
         source via the least-cost path or the shortest path.For each cell in
         the back link or direction raster, a value identifies
         the neighbor that is the next cell on the path from the cell to a
         source cell.
     outputPolylineName (String):
         The output feature service that will contain the least cost path.
     pathType {String}:
         Specifies the manner in which the values and zones on the input
         destination data will be interpreted in the cost path
         calculations.BEST_SINGLE-For all cells on the input destination data,
         the least-
         cost path will be derived from the cell with the minimum of the least-
         cost paths to source cells.EACH_ZONE-For each zone on the input
         destination data, a least-cost
         path is determined and saved on the output raster. With this option,
         the least-cost path for each zone will begin at the cell with the
         lowest cost distance weighting in the zone.EACH_CELL-For each cell
         with valid values on the input destination
         data, a least-cost path is determined and saved on the output raster.
         With this option, each cell of the input destination data will be
         treated separately, and a least-cost path will be determined for each
         from cell.
     destinationField {String}:
         The field that will be used to obtain values for the destination
         locations."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CostPathAsPolyline_ra(
                *gp_fixargs(
                    (
                        inputDestinationRasterOrFeatures,
                        inputCostDistanceRaster,
                        inputCostBacklinkRaster,
                        outputPolylineName,
                        pathType,
                        destinationField,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DetermineOptimumTravelCostNetwork_ra", None)
def DetermineOptimumTravelCostNetwork(
    inputRegionsRasterOrFeatures=None,
    inputCostRaster=None,
    outputOptimumNetworkName=None,
    outputNeighborNetworkName=None,
) -> Result2[str | Layer, str | Layer]:
    """DetermineOptimumTravelCostNetwork_ra(inputRegionsRasterOrFeatures, inputCostRaster, outputOptimumNetworkName, {outputNeighborNetworkName})

       Calculates the optimum cost network from a set of input regions.

    INPUTS:
     inputRegionsRasterOrFeatures (Image Service / Feature Layer / Raster Layer / String):
         The input regions that are to be connected by the least-cost
         network.Regions can be defined by either an image service or a feature
         service.If the region input is a raster, the regions are defined by
         groups of
         contiguous (adjacent) cells of the same value. Each region must be
         uniquely numbered. The cells that are not part of any region must be
         NoData. The raster type must be integer, and the values can be either
         positive or negative.If the region input is a feature, it can be
         polygons, lines, or
         points. Polygon feature regions cannot be composed of multipart
         polygons.
     inputCostRaster (Image Service / Raster Layer / String):
         A raster defining the impedance or cost to move planimetrically
         through each cell.The value at each cell location represents the cost-
         per-unit distance
         for moving through the cell. Each cell location value is multiplied by
         the cell resolution while also compensating for diagonal movement to
         obtain the total cost of passing through the cell.The values of the
         cost raster can be integer or floating point, but
         they cannot be negative or zero (you cannot have a negative or zero
         cost).
     outputOptimumNetworkName (String):
         The name of the output optimum network feature service.The polyline
         feature service of the optimum (least-cost) network of
         paths necessary to connect each of the input regions.Each path (or
         line) is uniquely numbered, and additional fields in the
         attribute table store specific information about the path. Those
         fields include the following:PATHID-Unique identifier for the
         pathPATHCOST-Total accumulative cost
         for the pathREGION1-The first region the path connectsREGION2-The
         other region the path connectsThis information provides you insight
         into the paths within the
         network.Since each path is represented by a unique line, there will be
         multiple lines in locations where paths travel the same route.
     outputNeighborNetworkName {String}:
         The name of the output Neighbor network feature service.The polyline
         feature service identifying all paths from each region to
         each of its closest-cost neighbors.Each path (or line) is uniquely
         numbered, and additional fields in the
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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DetermineOptimumTravelCostNetwork_ra(
                *gp_fixargs(
                    (
                        inputRegionsRasterOrFeatures,
                        inputCostRaster,
                        outputOptimumNetworkName,
                        outputNeighborNetworkName,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DetermineTravelCostPathAsPolyline_ra", None)
def DetermineTravelCostPathAsPolyline(
    inputSourceRasterOrFeatures=None,
    inputCostRaster=None,
    inputDestinationRasterOrFeatures=None,
    outputPolylineName=None,
    pathType: Literal["EACH_CELL", "EACH_ZONE", "BEST_SINGLE"] | None = None,
    destinationField=None,
) -> Result1[str | Layer]:
    """DetermineTravelCostPathAsPolyline_ra(inputSourceRasterOrFeatures, inputCostRaster, inputDestinationRasterOrFeatures, outputPolylineName, {pathType}, {destinationField})

       Calculates the least-cost polyline path between sources and
       destinations.

    INPUTS:
     inputSourceRasterOrFeatures (Image Service / Feature Layer / Raster Layer / String):
         An image service or feature service that identifies the cells from
         which the least-cost path is determined to the destinations.If the
         input is an image service, the input consists of cells that
         have valid values (zero is a valid value), and the remaining cells
         must be assigned NoData.
     inputCostRaster (Image Service / Raster Layer / String):
         The name of a cost raster image service to be used to determine the
         least-cost path from the sources to the destinations.The value at each
         cell location represents the cost-per-unit distance
         for moving through the cell. Each cell location value is multiplied by
         the cell resolution while also compensating for diagonal movement to
         obtain the total cost of passing through the cell.The values of the
         cost raster can be integer or floating point, but
         they cannot be negative or zero (you cannot have a negative or zero
         cost).
     inputDestinationRasterOrFeatures (Image Service / Feature Layer / Raster Layer / String):
         An image service or feature service that identifies the cells to which
         the least-cost path is calculated.
     outputPolylineName (String):
         The name of the output polyline feature service.The polyline feature
         service of the optimum (least-cost) paths
         connecting sources and destinations. Each path (or line) is
         uniquely numbered, and has an
         additional field in the attribute table called, which connects it back
         to the unique identifier on the destination raster. DestIDSince
         each path is represented by a unique line, there can be multiple
         lines in locations where paths travel the same route.
     pathType {String}:
         Specifies the manner in which the values and zones on the input
         destination data will be interpreted in the cost path
         calculations.EACH_CELL-For each cell or location with valid values on
         the input
         destination data, a least-cost path is determined and saved on the
         output. With this option, each cell or location of the input
         destination data is treated separately, and a least-cost path is
         determined for each from cell.EACH_ZONE-For each zone on the input
         destination data, a least-cost
         path is determined and saved to the output. With this option, the
         least-cost path for each zone begins at the location with the lowest
         cost distance weighting in the zone.BEST_SINGLE-For all locations on
         the input destination data, the
         least-cost path is derived from the location with the minimum of the
         least-cost paths to source locations. This is the default.
     destinationField {String}:
         The field used to obtain values for the destination locations.Input
         feature data must contain at least one valid integer field."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DetermineTravelCostPathAsPolyline_ra(
                *gp_fixargs(
                    (
                        inputSourceRasterOrFeatures,
                        inputCostRaster,
                        inputDestinationRasterOrFeatures,
                        outputPolylineName,
                        pathType,
                        destinationField,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DetermineTravelCostPathsToDestinations_ra", None)
def DetermineTravelCostPathsToDestinations(
    inputDestinationRasterOrFeatures=None,
    inputCostDistanceRaster=None,
    inputCostBacklinkRaster=None,
    outputName=None,
    destinationField=None,
    pathType: Literal["EACH_CELL", "EACH_ZONE", "BEST_SINGLE"] | None = None,
) -> Result1[str | Layer]:
    """DetermineTravelCostPathsToDestinations_ra(inputDestinationRasterOrFeatures, inputCostDistanceRaster, inputCostBacklinkRaster, outputName, {destinationField}, {pathType})

       Calculates specific paths between known sources and known
       destinations.

    INPUTS:
     inputDestinationRasterOrFeatures (Image Service / Feature Layer / Raster Layer / String):
         An image service or feature service that identifies the cells from
         which the least-cost path is determined to the least costly source.If
         the input is an image service, the input consists of cells that
         have valid values (zero is a valid value), and the remaining cells
         must be assigned NoData.
     inputCostDistanceRaster (Image Service / Raster Layer / String):
         The name of a cost distance image service to be used to determine the
         least-cost path from the destination locations to a source.The cost
         distance raster is usually created with the Calculate Travel
         Cost tool. The cost distance raster stores, for each cell, the minimum
         accumulative cost distance over a cost surface from each cell to a set
         of source cells.
     inputCostBacklinkRaster (Image Service / Raster Layer / String):
         The name of a cost back link raster used to determine the path to
         return to a source via the least-cost path.For each cell in the back
         link raster, a value identifies the neighbor
         that is the next cell on the least accumulative cost path from the
         cell to a single source cell or set of source cells.
     outputName (String):
         The name of the output travel cost paths raster service.The default
         name is based on the tool name and the input layer name.
         If the layer name already exists, you will be prompted to provide
         another name.
     destinationField {String}:
         A field on the destination layer that holds the values that define
         each destination.Input feature service must contain at least one valid
         field.
     pathType {String}:
         Defines the manner in which the values and zones on the input
         destination data will be interpreted in the cost path
         calculations.EACH_CELL-For each cell with valid values on the input
         destination
         data, a least-cost path is determined and saved on the output raster.
         With this option, each cell of the input destination data is treated
         separately, and a least-cost path is determined for each from cell.
         This is the default.EACH_ZONE-For each zone on the input destination
         data, a least-cost
         path is determined and saved on the output raster. With this option,
         the least-cost path for each zone begins at the cell with the lowest
         cost distance weighting in the zone.BEST_SINGLE-For all cells on the
         input destination data, the least-
         cost path is derived from the cell with the minimum of the least-cost
         paths to source cells."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DetermineTravelCostPathsToDestinations_ra(
                *gp_fixargs(
                    (
                        inputDestinationRasterOrFeatures,
                        inputCostDistanceRaster,
                        inputCostBacklinkRaster,
                        outputName,
                        destinationField,
                        pathType,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
