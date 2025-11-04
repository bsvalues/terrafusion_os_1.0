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
r"""The ArcGIS Pro Aviation toolbox contains a set of tools that allow you
to create, analyze, and manage aviation content."""
from __future__ import annotations

__all__ = [
    "AddAviationLineBypass",
    "AggregateObstacles",
    "AnalyzeAirportFeatures",
    "AnalyzeLASRunwayObstacles",
    "AnalyzeRunwayObstacles",
    "CalculateATSRouteAttributes",
    "CreateCurvedApproach",
    "ExportAIXM51Message",
    "ExportFAA18BShapefiles",
    "FAA13",
    "FAA13A",
    "FAA13ARunwayProtectionSurfaces",
    "FAA13ASurfaces",
    "FAA13RunwayProtectionSurfaces",
    "FAA18B",
    "FAA2C",
    "FAAFAR77",
    "GenerateAirspaceAreas",
    "GenerateAirspaceLines",
    "GenerateAirwayCorridors",
    "GenerateAviationCartographicFeatures",
    "GenerateAviationChartLeads",
    "GenerateChangeoverPoints",
    "GenerateDerivedAirspaceGeometry",
    "GenerateOISIntersection",
    "GenerateOISObstacleData",
    "GenerateOISProfileData",
    "GenerateSummaryTableData",
    "GroupRouteSegments",
    "ICAOAnnex14",
    "ICAOAnnex14Heliports",
    "ICAOAnnex14OFSOES",
    "ICAOAnnex15",
    "ICAOAnnex4",
    "ICAOAnnex4Surfaces",
    "ImportAIXM51Message",
    "ImportDCDTChangeFile",
    "ImportDOF",
    "ImportFAA18BShapefiles",
    "LightSignalClearanceSurface",
    "PAPIObstacleClearanceSurface",
    "PrepareAviationData",
    "ProcessAirTrafficServiceRoutes",
    "ReportAviationChartChanges",
    "RotateAviationFeatures",
    "UnifiedFacilitiesCriteria",
    "UpdateAviationAnno",
]
__alias__ = "aviation"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Airports\Analysis toolset
@gptooldoc("AnalyzeAirportFeatures_aviation", None)
def AnalyzeAirportFeatures(
    in_features=None,
    in_runway_features=None,
    out_table=None,
    in_features_height=None,
    in_features_height_unit: Literal[
        "KILOMETERS",
        "METERS",
        "DECIMETERS",
        "CENTIMETERS",
        "MILLIMETERS",
        "NAUTICAL_MILES",
        "MILES",
        "YARDS",
        "FEET",
        "INCHES",
        "DECIMAL_DEGREES",
        "POINTS",
        "UNKNOWN",
    ]
    | None = None,
    runway_end_features=None,
    airport_ref_point_features=None,
    ref_point_height=None,
    ref_point_height_unit: Literal[
        "KILOMETERS",
        "METERS",
        "DECIMETERS",
        "CENTIMETERS",
        "MILLIMETERS",
        "NAUTICAL_MILES",
        "MILES",
        "YARDS",
        "FEET",
        "INCHES",
        "DECIMAL_DEGREES",
        "POINTS",
        "UNKNOWN",
    ]
    | None = None,
    in_out_horizontal_unit: Literal[
        "SAME_AS_INPUT",
        "KILOMETERS",
        "METERS",
        "DECIMETERS",
        "CENTIMETERS",
        "MILLIMETERS",
        "NAUTICAL_MILES",
        "MILES",
        "YARDS",
        "FEET",
        "INCHES",
    ]
    | None = None,
) -> Result1[str | Table]:
    """AnalyzeAirportFeatures_aviation(in_features, in_runway_features, out_table, {in_features_height}, {in_features_height_unit}, {runway_end_features}, {airport_ref_point_features}, {ref_point_height}, {ref_point_height_unit}, {in_out_horizontal_unit})

       Analyzes specified point features around an airfield to find and
       record information such as distance from a given runway centerline or
       the end of the nearest runway and its designation.

    INPUTS:
     in_features (Feature Layer):
         The input point features that will be analyzed and recorded in terms
         of their physical relationships to features in the other inputs.
     in_runway_features (Feature Layer):
         The input runway polyline features, specifically their centerlines,
         that will be used in the analysis.
     in_features_height {String}:
         Specifies the name of a field in the input airport features dataset.
         The specified field must contain numeric values. The values in this
         field will be used to identify the height of each input airport
         feature. If the SHAPE_Z value is specified as the location of the
         height, the in_features_height_unit parameter will be
         ignored.SHAPE_Z-Height values will be derived from the z-values of the
         input
         point features. This is the default.
     in_features_height_unit {String}:
         Specifies the linear unit of measure that will be used when the
         in_features_height parameter value is specified.KILOMETERS-The unit
         will be kilometers.METERS-The unit will be
         meters.DECIMETERS-The unit will be decimeters.CENTIMETERS-The unit
         will be centimeters.MILLIMETERS-The unit will be
         millimeters.NAUTICAL_MILES-The unit will be nautical miles.MILES-The
         unit will be miles.YARDS-The unit will be yards.FEET-The unit will be
         feet.INCHES-The unit will be inches.DECIMAL_DEGREES-The unit will be
         decimal degrees.POINTS-The unit will be points.UNKNOWN-The unit will
         be unknown.
     runway_end_features {Feature Layer}:
         The input runway end point features associated with the runways in the
         in_runway_features parameter that represent the thresholds of those
         runways.
     airport_ref_point_features {Feature Layer}:
         The input airport control point features that contain the
         runway threshold points. The runway threshold points will be
         identified by searching for theattribute equal to, and theattribute
         equal to the runway end designator.
         POINTTYPEDISPLACED_THRESHOLDRUNWAYENDD
     ref_point_height {String}:
         Specifies the name of a field in the input airport reference point
         features dataset. The specified field must contain numeric values. The
         values in this field will be used to identify the height of each input
         airport reference point feature. If SHAPE_Z is specified as the
         location of the height, the ref_point_height_unit parameter will be
         ignored.SHAPE_Z-The z-value of each point will be used. This is the
         default.
     ref_point_height_unit {String}:
         Specifies the linear unit of measure that will be used when an airport
         reference point height is specified.KILOMETERS-The unit will be
         kilometers.METERS-The unit will be
         meters.DECIMETERS-The unit will be decimeters.CENTIMETERS-The unit
         will be centimeters.MILLIMETERS-The unit will be
         millimeters.NAUTICAL_MILES-The unit will be nautical miles.MILES-The
         unit will be miles.YARDS-The unit will be yards.FEET-The unit will be
         feet.INCHES-The unit will be inches.DECIMAL_DEGREES-The unit will be
         decimal degrees.POINTS-The unit will be points.UNKNOWN-The unit will
         be unknown.
     in_out_horizontal_unit {String}:
         Specifies the output unit of measurement for the five output distances
         produced.SAME_AS_INPUT-The horizontal units from the input coordinate
         system
         will be used. If the input data is not projected, this will be meters.
         This is the default.KILOMETERS-The unit will be kilometers.METERS-The
         unit will be meters.DECIMETERS-The unit will be
         decimeters.CENTIMETERS-The unit will be centimeters.MILLIMETERS-The
         unit will be millimeters.NAUTICAL_MILES-The unit will be nautical
         miles.MILES-The unit will be miles.YARDS-The unit will be
         yards.FEET-The unit will be feet.INCHES-The unit will be inches.

    OUTPUTS:
     out_table (Table View):
         The output table, with a row for each input airport feature,
         containing the analyzed results."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AnalyzeAirportFeatures_aviation(
                *gp_fixargs(
                    (
                        in_features,
                        in_runway_features,
                        out_table,
                        in_features_height,
                        in_features_height_unit,
                        runway_end_features,
                        airport_ref_point_features,
                        ref_point_height,
                        ref_point_height_unit,
                        in_out_horizontal_unit,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AnalyzeLASRunwayObstacles_aviation", None)
def AnalyzeLASRunwayObstacles(
    in_ois_features=None,
    in_las_obstacles=None,
    out_obstacle_feature_class=None,
    target_folder=None,
    out_las_obstacles=None,
    vertical_clearance=None,
    vertical_clearance_unit: Literal[
        "KILOMETERS",
        "METERS",
        "DECIMETERS",
        "CENTIMETERS",
        "MILLIMETERS",
        "NAUTICAL_MILES",
        "MILES",
        "YARDS",
        "FEET",
        "INCHES",
        "DECIMAL_DEGREES",
        "POINTS",
        "UNKNOWN",
    ]
    | None = None,
) -> Result3[str | Layer, str, str | Layer]:
    """AnalyzeLASRunwayObstacles_aviation(in_ois_features, in_las_obstacles, {out_obstacle_feature_class}, {target_folder}, {out_las_obstacles}, {vertical_clearance}, {vertical_clearance_unit})

       Analyzes lidar data and obstruction identification surfaces (OIS) to
       determine if lidar points are penetrating.

    INPUTS:
     in_ois_features (Feature Layer):
         The input multipatch features representing one or more OIS. The
         feature class must be z-enabled.
     in_las_obstacles (LAS Dataset Layer):
         The input LAS dataset that contains 3D data points covering the area
         around an airport. The points represent a 3D view of natural and
         human-made objects that may pose a hazard to flight.
     vertical_clearance {Double}:
         If a LAS point height is above the OIS surface, that point will be
         captured. The height of an OIS surface above a given LAS point is
         temporarily lowered by the specified vertical clearance value. This
         decreases the distance between the height of the LAS point and the
         corresponding OIS surface, resulting in the likeliness that more
         points will be captured. Consequently, a larger collection of ground
         features, represented by the LAS points penetrating through the OIS
         surface, will be captured.
     vertical_clearance_unit {String}:
         The linear unit that will be used for the vertical
         clearance.KILOMETERS-The linear unit will be kilometers.METERS-The
         linear unit
         will be meters.DECIMETERS-The linear unit will be
         decimeters.CENTIMETERS-The linear unit will be
         centimeters.MILLIMETERS-The linear unit will be
         millimeters.NAUTICAL_MILES-The linear unit will be nautical
         miles.MILES-The linear unit will be miles.YARDS-The linear unit will
         be yards.FEET-The linear unit will be feet.INCHES-The linear unit will
         be inches.DECIMAL_DEGREES-The linear unit will be decimal
         degrees.POINTS-The linear unit will be points.UNKNOWN-The linear unit
         will be unknown.

    OUTPUTS:
     out_obstacle_feature_class {Feature Layer}:
         The output point features that represent lidar points in OIS features
         in which the height of the lidar point is greater than the height of
         the enclosing OIS feature at that point. This feature class is
         required output only if no output LAS dataset is requested.
     target_folder {Folder}:
         The folder to which .las files will be written. Each output file will
         have the same .las file version and point record format as the input
         file. This folder is required output only if no output feature class
         is requested.
     out_las_obstacles {LAS Dataset Layer}:
         The output LAS dataset referencing the newly created .las files. This
         LAS dataset is created only when the output folder is specified to
         generate the LAS output."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AnalyzeLASRunwayObstacles_aviation(
                *gp_fixargs(
                    (
                        in_ois_features,
                        in_las_obstacles,
                        out_obstacle_feature_class,
                        target_folder,
                        out_las_obstacles,
                        vertical_clearance,
                        vertical_clearance_unit,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AnalyzeRunwayObstacles_aviation", None)
def AnalyzeRunwayObstacles(
    input_ois_features=None,
    input_obstacle_features=None,
    out_feature_class=None,
    height_field: Literal["FEATURE_GEOMETRY"] | None = None,
    unit_field: Literal[
        "KILOMETERS",
        "METERS",
        "DECIMETERS",
        "CENTIMETERS",
        "MILLIMETERS",
        "NAUTICAL_MILES",
        "MILES",
        "YARDS",
        "FEET",
        "INCHES",
        "DECIMAL_DEGREES",
        "POINTS",
        "UNKNOWN",
    ]
    | None = None,
    height_option: Literal["ABSOLUTE_HEIGHT", "RELATIVE_HEIGHT"] | None = None,
    elevation_option: Literal["ELEVATION_FIELD", "ELEVATION_DEM"] | None = None,
    elevation_field=None,
    elevation_field_unit: Literal[
        "KILOMETERS",
        "METERS",
        "DECIMETERS",
        "CENTIMETERS",
        "MILLIMETERS",
        "NAUTICAL_MILES",
        "MILES",
        "YARDS",
        "FEET",
        "INCHES",
        "DECIMAL_DEGREES",
        "POINTS",
        "UNKNOWN",
    ]
    | None = None,
    in_dems=None,
) -> Result1[str]:
    """AnalyzeRunwayObstacles_aviation(input_ois_features, input_obstacle_features, out_feature_class, {height_field}, {unit_field}, {height_option}, {elevation_option}, {elevation_field}, {elevation_field_unit}, {in_dems;in_dems...})

       Analyzes obstacle data and obstruction identification surfaces (OIS)
       to determine if obstacles are penetrating.

    INPUTS:
     input_ois_features (Feature Layer):
         The multipatch features with defined Airport schema. The feature class
         must be z-enabled.
     input_obstacle_features (Feature Layer):
         The input obstacle features that will be analyzed. The feature class
         must be z-enabled.
     height_field {String}:
         The field containing the height of the obstacle features. The default
         value is FEATURE_GEOMETRY.FEATURE_GEOMETRY-The field containing the
         height of the obstacle
         features.
     unit_field {String}:
         Specifies the linear unit that will be used for the obstacle height.
         This parameter is enabled if the height_option parameter is set to
         RELATIVE_HEIGHT.KILOMETERS-The linear unit will be
         kilometers.METERS-The linear unit
         will be meters.DECIMETERS-The linear unit will be
         decimeters.CENTIMETERS-The linear unit will be
         centimeters.MILLIMETERS-The linear unit will be
         millimeters.NAUTICAL_MILES-The linear unit will be nautical
         miles.MILES-The linear unit will be miles.YARDS-The linear unit will
         be yards.FEET-The linear unit will be feet.INCHES-The linear unit will
         be inches.DECIMAL_DEGREES-The linear unit will be decimal
         degrees.POINTS-The linear unit will be points.UNKNOWN-The linear unit
         will be unknown.
     height_option {String}:
         Specifies how obstacle height values will be
         interpreted.ABSOLUTE_HEIGHT-Obstacle heights will be measured from
         sea level.
         This is the default.RELATIVE_HEIGHT-Obstacle heights will be measured
         from ground level.
     elevation_option {String}:
         Specifies how obstacle base elevation heights will be identified. This
         parameter is enabled if the height_option parameter is set to
         RELATIVE_HEIGHT.ELEVATION_FIELD-Base elevation heights will be
         derived from a numeric
         field of the obstacle feature class. This is the
         default.ELEVATION_DEM-Base elevation heights will be derived from one
         or more
         digital elevation models (DEMs).
     elevation_field {String}:
         The field containing base elevation heights of the obstacle
         features.This parameter is enabled if the height_option parameter is
         set to
         RELATIVE_HEIGHT and the elevation_option parameter is set to
         ELEVATION_FIELD. The default is the first numeric field in the
         obstacle feature class.
     elevation_field_unit {String}:
         Specifies the linear unit that will be used for the base elevation
         values. This parameter is enabled if the height_option parameter is
         set to RELATIVE_HEIGHT and the elevation_option parameter is set to
         ELEVATION_FIELD.KILOMETERS-The linear unit will be
         kilometers.METERS-The linear unit
         will be meters. This is the default.DECIMETERS-The linear unit will be
         decimeters.CENTIMETERS-The linear unit will be
         centimeters.MILLIMETERS-The linear unit will be
         millimeters.NAUTICAL_MILES-The linear unit will be nautical
         miles.MILES-The linear unit will be miles.YARDS-The linear unit will
         be yards.FEET-The linear unit will be feet.INCHES-The linear unit will
         be inches.DECIMAL_DEGREES-The linear unit will be decimal
         degrees.POINTS-The linear unit will be points.UNKNOWN-The linear unit
         will be unknown.
     in_dems {Raster Layer}:
         The DEMs covering the obstacles that will be used to derive base
         elevation values. This parameter is enabled if the height_option
         parameter is set to RELATIVE_HEIGHT and the elevation_option parameter
         is set to ELEVATION_DEM.

    OUTPUTS:
     out_feature_class (Feature Class):
         A feature class containing one point for each obstacle feature that is
         within the area covered by the input OIS. If the geometry type of the
         input obstacle feature is a polyline or polygon, a multipoint feature
         class will be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AnalyzeRunwayObstacles_aviation(
                *gp_fixargs(
                    (
                        input_ois_features,
                        input_obstacle_features,
                        out_feature_class,
                        height_field,
                        unit_field,
                        height_option,
                        elevation_option,
                        elevation_field,
                        elevation_field_unit,
                        in_dems,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateOISObstacleData_aviation", None)
def GenerateOISObstacleData(
    in_runway_features=None,
    in_dems=None,
    in_obstacle_features=None,
    target_ois_features=None,
    obstacle_height_field: Literal["FEATURE_GEOMETRY"] | None = None,
    obstacle_height_unit: Literal[
        "KILOMETERS",
        "METERS",
        "DECIMETERS",
        "CENTIMETERS",
        "MILLIMETERS",
        "NAUTICAL_MILES",
        "MILES",
        "YARDS",
        "FEET",
        "INCHES",
        "DECIMAL_DEGREES",
        "POINTS",
        "UNKNOWN",
    ]
    | None = None,
    in_flightpath_features=None,
    label_field=None,
    height_option: Literal["ABSOLUTE_HEIGHT", "RELATIVE_HEIGHT"] | None = None,
    elevation_option: Literal["ELEVATION_FIELD", "ELEVATION_DEM"] | None = None,
    elevation_field=None,
    elevation_field_unit: Literal[
        "KILOMETERS",
        "METERS",
        "DECIMETERS",
        "CENTIMETERS",
        "MILLIMETERS",
        "NAUTICAL_MILES",
        "MILES",
        "YARDS",
        "FEET",
        "INCHES",
        "DECIMAL_DEGREES",
        "POINTS",
        "UNKNOWN",
    ]
    | None = None,
    obstacle_output_method: Literal["ALL_OBSTACLES", "PENETRATING_OBSTACLES", "SHADOWING_OBSTACLES"] | None = None,
    shadow_horizontal_distance=None,
    shadow_slope=None,
) -> Result1[str | Layer]:
    """GenerateOISObstacleData_aviation(in_runway_features, {in_dems;in_dems...}, in_obstacle_features, target_ois_features, {obstacle_height_field}, {obstacle_height_unit}, {in_flightpath_features}, {label_field}, {height_option}, {elevation_option}, {elevation_field}, {elevation_field_unit}, {obstacle_output_method}, {shadow_horizontal_distance}, {shadow_slope})

       Generates a JSON string that is stored in the OBSTACLEJSON field on
       the input Obstruction Identification Surface (OIS) multipatch feature
       class. This class contains the data necessary to depict obstacles to
       flight safety within the approach surfaces (in the form of points,
       lines, or polygons) in the Terrain and Obstacle Profile layout
       element.

    INPUTS:
     in_runway_features (Feature Layer):
         The input runway dataset. The feature class must be z-enabled and
         contain polylines.
     in_dems {Raster Layer}:
         The DEMs covering the obstacles that will be used to derive base
         elevation values. This parameter is used if elevation_option is set to
         ELEVATION_DEM.
     in_obstacle_features (Feature Layer):
         The input obstacle features that will be analyzed. The feature class
         must be z-enabled.
     target_ois_features (Feature Layer):
         The multipatch features with defined airport data model schema. The
         feature class must be z-enabled.
     obstacle_height_field {String}:
         Specifies the field that will contain the height of the obstacle
         features or the keyword FEATURE_GEOMETRY to indicate obstacle feature
         geometry z-coordinate values.FEATURE_GEOMETRY-The field that will
         contain the height of the
         obstacle features.
     obstacle_height_unit {String}:
         Specifies the obstacle height unit of measure that will be
         used.KILOMETERS-The unit will be kilometers.METERS-The unit will be
         meters.DECIMETERS-The unit will be decimeters.CENTIMETERS-The unit
         will be centimeters.MILLIMETERS-The unit will be
         millimeters.NAUTICAL_MILES-The unit will be nautical miles.MILES-The
         unit will be miles.YARDS-The unit will be yards.FEET-The unit will be
         feet.INCHES-The unit will be inchesDECIMAL_DEGREES-The unit will be
         decimal degrees.POINTS-The unit will be points.UNKNOWN-The unit will
         be unknown.
     in_flightpath_features {Feature Layer}:
         The polyline features that will define curved approaches to the
         specified runways. If no features are provided, all input features
         will be processed as straight approaches.
     label_field {String}:
         A field from the input obstacle feature class that will be used to
         label the obstacle. When an obstacle JSON generated by this tool is
         later used to create a Terrain and Obstacle Profile element in a
         layout, the data from the field provided will be used to label the
         input point obstacles in that element. This parameter only
         applies when theparameter values contain
         point features. Input Obstacle Features         If no field is
         provided, thefield will be applied by default.
         ObjectID
     height_option {String}:
         Specifies how obstacle height values will be measured.ABSOLUTE_HEIGHT-
         Obstacle heights will be measured from sea
         level.RELATIVE_HEIGHT-Obstacle heights will be measured from ground
         level.
         This is the default.
     elevation_option {String}:
         Specifies how obstacle base elevation heights will be
         found.ELEVATION_FIELD-Base elevation heights will be found in a
         numeric
         field of the obstacle feature class.ELEVATION_DEM-Base elevation
         heights will be found by deriving them
         from one or more DEMs. This is the default.
     elevation_field {String}:
         The field that will contain base elevation heights of the obstacle
         features.This parameter is used if elevation_option is set to
         ELEVATION_FIELD.
         The default is the first numeric field in the obstacle feature class.
     elevation_field_unit {String}:
         Specifies the linear unit that will be used for the base elevation
         values. This parameter is used if elevation_option is set to
         ELEVATION_FIELD.KILOMETERS-The unit will be kilometers.METERS-The unit
         will be meters.
         This is the default.DECIMETERS-The unit will be
         decimeters.CENTIMETERS-The unit will be centimeters.MILLIMETERS-The
         unit will be millimeters.NAUTICAL_MILES-The unit will be nautical
         miles.MILES-The unit will be miles.YARDS-The unit will be
         yards.FEET-The unit will be feet.INCHES-The unit will be
         inchesDECIMAL_DEGREES-The unit will be decimal degrees.POINTS-The unit
         will be points.UNKNOWN-The unit will be unknown.
     obstacle_output_method {String}:
         Specifies the obstacles that will be included in the output feature
         class.ALL_OBSTACLES-All obstacles within the extent of the OIS will be
         included in the output.PENETRATING_OBSTACLES-Only obstacles that
         penetrate the OIS will be
         included in the output.SHADOWING_OBSTACLES-Only obstacles that shadow
         other obstacles will be
         included in the output.
     shadow_horizontal_distance {Double}:
         The length of the approach surface in meters (calculated from the
         runway end) where shadows are considered horizontally aligned.
     shadow_slope {Double}:
         The slope of the shadow that will be considered past the
         shadow_horizontal_distance parameter value."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateOISObstacleData_aviation(
                *gp_fixargs(
                    (
                        in_runway_features,
                        in_dems,
                        in_obstacle_features,
                        target_ois_features,
                        obstacle_height_field,
                        obstacle_height_unit,
                        in_flightpath_features,
                        label_field,
                        height_option,
                        elevation_option,
                        elevation_field,
                        elevation_field_unit,
                        obstacle_output_method,
                        shadow_horizontal_distance,
                        shadow_slope,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateOISProfileData_aviation", None)
def GenerateOISProfileData(
    in_runway_features=None,
    in_dems=None,
    target_ois_features=None,
    in_flightpath_features=None,
    sampling_distance=None,
    sample_profile_ois: Literal["PROFILE_OIS", "NO_PROFILE_OIS"] | None = None,
    sample_profile_runways: Literal["PROFILE_RUNWAY", "NO_PROFILE_RUNWAY"] | None = None,
) -> Result1[str | Layer]:
    """GenerateOISProfileData_aviation(in_runway_features, in_dems;in_dems..., target_ois_features, {in_flightpath_features}, {sampling_distance}, {sample_profile_ois}, {sample_profile_runways})

       Generates a JSON string that is stored in the PROFILEJSON field on the
       input Obstruction Identification Surface multipatch feature class that
       contains the data necessary to depict the terrain, runway, and OIS in
       the Terrain and Obstacle Profile layout element.

    INPUTS:
     in_runway_features (Feature Layer):
         This is the input runway dataset. The feature class must be z-enabled
         and contain polylines.
     in_dems (Raster Layer):
         The DEMs covering the runways and their approach obstruction
         identification surfaces.
     target_ois_features (Feature Layer):
         The multipatch features with defined Airport schema. The feature class
         must be z-enabled.
     in_flightpath_features {Feature Layer}:
         The polyline features that define curved approaches to the specified
         runways. If unspecified, all input features will be processed as
         straight approaches.
     sampling_distance {Double}:
         The distance, in meters, between generated points. The default is 30.
     sample_profile_ois {Boolean}:
         Specifies whether elevation points for OIS features will be
         generated.PROFILE_OIS-Generates elevation
         points.NO_PROFILE_OIS-Elevation points
         will not be generated. This is
         default.
     sample_profile_runways {Boolean}:
         Specifies whether elevation points along the runways will be
         generated.PROFILE_RUNWAY-Generates elevation points along the
         runways.NO_PROFILE_RUNWAY-Uses only the start and end points of the
         runways.
         This is default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateOISProfileData_aviation(
                *gp_fixargs(
                    (
                        in_runway_features,
                        in_dems,
                        target_ois_features,
                        in_flightpath_features,
                        sampling_distance,
                        sample_profile_ois,
                        sample_profile_runways,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Airports\Data Exchange toolset
@gptooldoc("ExportFAA18BShapefiles_aviation", None)
def ExportFAA18BShapefiles(
    in_workspace=None,
    target_folder=None,
    in_features=None,
) -> Result1[str]:
    """ExportFAA18BShapefiles_aviation(in_workspace, target_folder, {in_features;in_features...})

       Exports one or more FAA Advisory Circular 150/5300-18B compliant
       shapefiles from a geodatabase that contains the ArcGIS Aviation
       Airports schema.

    INPUTS:
     in_workspace (Workspace):
         The workspace that contains the airport data.
     target_folder (Folder):
         The folder where the shapefiles will be written.
     in_features {String}:
         A list of feature classes that will be exported to shapefiles. If this
         parameter is not set, all feature classes in the input workspace will
         be exported to shapefiles."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportFAA18BShapefiles_aviation(*gp_fixargs((in_workspace, target_folder, in_features), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportFAA18BShapefiles_aviation", None)
def ImportFAA18BShapefiles(
    in_features=None,
    airports_workspace=None,
) -> Result1[str]:
    """ImportFAA18BShapefiles_aviation(in_features;in_features..., airports_workspace)

       Imports one or more FAA Advisory Circular 150/5300-18B compliant
       shapefiles into a geodatabase that contains the ArcGIS Aviation
       Airports schema.

    INPUTS:
     in_features (Shapefile):
         The FAA 18B shapefiles that will be imported into a geodatabase.
     airports_workspace (Workspace):
         The geodatabase into which the shapefiles will be imported."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportFAA18BShapefiles_aviation(*gp_fixargs((in_features, airports_workspace), True))
        )
        return retval
    except Exception as e:
        raise e


# Airports\Heliport Obstruction Identification Surfaces toolset
@gptooldoc("FAA2C_aviation", None)
def FAA2C(
    input_fato_features=None,
    target_ois_features=None,
    surface_classification: Literal["NON_PRIOR_PERMISSION_REQUIRED_FACILITIES", "PRIOR_PERMISSION_REQUIRED_FACILITIES"]
    | None = None,
    surface_shape: Literal["STRAIGHT_SURFACE", "CURVED_SURFACE"] | None = None,
    approach_bearing=None,
    in_flightpath_features=None,
    helipad_elevation=None,
    custom_json_file=None,
) -> Result1[str | Layer]:
    """FAA2C_aviation(input_fato_features, target_ois_features, surface_classification, {surface_shape}, {approach_bearing}, {in_flightpath_features}, {helipad_elevation}, {custom_json_file})

       Generates an obstruction identification surface (OIS) for helipads
       based on specifications from FAA Advisory Circular 150/5390-2C.

    INPUTS:
     input_fato_features (Feature Layer):
         The input Final Approach and Takeoff (FATO) features.
     target_ois_features (Feature Layer):
         The target polygon or multipatch feature layer containing the OIS.
     surface_classification (String):
         Specifies the classification type of the FATO
         surface.NON_PRIOR_PERMISSION_REQUIRED_FACILITIES-These are publically
         available helipads for general use by pilots. This is the
         default.PRIOR_PERMISSION_REQUIRED_FACILITIES-These are heliports used
         exclusively by the owner and individuals authorized by the owner to
         use the facility.
     surface_shape {String}:
         Specifies the shape of the take off or approach
         surface.STRAIGHT_SURFACE-The take off or approach surface is straight.
         This is
         the default.CURVED_SURFACE-The take off or approach surface is curved.
     approach_bearing {Double}:
         The absolute bearing that an approaching aircraft will travel along
         the surface. A value of 0 will align the surface to true north. The
         default is 0.
     in_flightpath_features {Feature Layer}:
         The polyline flight path features that the curved surface will follow.
     helipad_elevation {Double}:
         The elevation of the highest point of the helipad. The value must be
         in the vertical coordinate system linear units of the target feature
         class. If no value is provided, the highest point of the
         input_fato_features parameter value will be used. The default is 0.
     custom_json_file {File}:
         The import configuration file, in JSON format, that creates the custom
         OIS."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FAA2C_aviation(
                *gp_fixargs(
                    (
                        input_fato_features,
                        target_ois_features,
                        surface_classification,
                        surface_shape,
                        approach_bearing,
                        in_flightpath_features,
                        helipad_elevation,
                        custom_json_file,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ICAOAnnex14Heliports_aviation", None)
def ICAOAnnex14Heliports(
    input_safety_area_features=None,
    target_ois_features=None,
    surface_classification: Literal["CATEGORY_A", "CATEGORY_B", "CATEGORY_C"] | None = None,
    operation_type: Literal["DAY_OPERATION", "NIGHT_OPERATION"] | None = None,
    rotor_diameter=None,
    clearway_length=None,
    surface_shape: Literal["STRAIGHT_SURFACE", "CURVED_SURFACE"] | None = None,
    approach_bearing=None,
    in_flightpath_features=None,
    heliport_elevation=None,
    custom_json_file=None,
) -> Result1[str | Layer]:
    """ICAOAnnex14Heliports_aviation(input_safety_area_features, target_ois_features, surface_classification, operation_type, {rotor_diameter}, {clearway_length}, {surface_shape}, {approach_bearing}, {in_flightpath_features}, {heliport_elevation}, {custom_json_file})

       Generates obstruction identification surfaces (OIS) for heliports
       based on ICAO Annex 14 Volume II specifications.

    INPUTS:
     input_safety_area_features (Feature Layer):
         The input safety area around which the OIS will be generated.
     target_ois_features (Feature Layer):
         The target feature class that will contain the generated OIS.
     surface_classification (String):
         Specifies the slope design category that will be used for the
         OIS.CATEGORY_A-Rotor aircraft operated with performance class 1 will
         be
         used.CATEGORY_B-Rotor aircraft operated with performance class 3 will
         be
         used.CATEGORY_C-Rotor aircraft operated with performance class 2 will
         be
         used.
     operation_type (String):
         Specifies the time when normal flight operations
         occur.DAY_OPERATION-Normal flight operations occur during the day.
         This is
         the default.NIGHT_OPERATION-Normal flight operations occur during the
         night.
     rotor_diameter {Double}:
         The rotor diameter, in meters, of aircraft using the heliport. The
         default is 16.5.
     clearway_length {Double}:
         The length of the clearway. The unit of measurement for the clearway
         depends on the input_safety_area_features parameter value.
     surface_shape {String}:
         Specifies the shape of the take off or approach
         surface.STRAIGHT_SURFACE-The take off climb or approach surface is
         straight.
         This is the default.CURVED_SURFACE-The take off climb or approach
         surface is curved.
     approach_bearing {Double}:
         The absolute bearing that an approaching aircraft will travel along
         the surface. A value of 0 will align the surface to true north. The
         default value is 0.
     in_flightpath_features {Feature Layer}:
         The polyline flight path features that the curved surface will follow.
     heliport_elevation {Double}:
         The elevation of the highest point of the heliport. The value must be
         in the vertical coordinate system linear units of the target feature
         class. If no value is provided, the highest point of the
         input_safety_area_features parameter value will be used. The default
         is 0.
     custom_json_file {File}:
         The import configuration, in JSON format, that will be used to create
         the custom OIS."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ICAOAnnex14Heliports_aviation(
                *gp_fixargs(
                    (
                        input_safety_area_features,
                        target_ois_features,
                        surface_classification,
                        operation_type,
                        rotor_diameter,
                        clearway_length,
                        surface_shape,
                        approach_bearing,
                        in_flightpath_features,
                        heliport_elevation,
                        custom_json_file,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Airports\Obstruction Identification Surfaces toolset
@gptooldoc("CreateCurvedApproach_aviation", None)
def CreateCurvedApproach(
    in_runway_features=None,
    in_flightpath_features=None,
    target_ois_features=None,
    specification: Literal["ETOD", "OLS", "FAR77", "18B", "13SURFACES"] | None = None,
    runway_classification=None,
    custom_json_file=None,
    threshold_offset=None,
) -> Result1[str | Layer]:
    """CreateCurvedApproach_aviation(in_runway_features, in_flightpath_features, target_ois_features, specification, runway_classification, {custom_json_file}, {threshold_offset})

       Creates curved approach obstacle identification surfaces (OIS) based
       on the supported specifications in ArcGIS Aviation. These curved
       approach surfaces are based on an input flight path and the
       information in the selected specification, for example, ICAO Annex 15,
       FAA 18B and classification. This tool creates surfaces in existing
       polygon or multipatch features.

    INPUTS:
     in_runway_features (Feature Layer):
         The input runway dataset. The feature class must be z-enabled and
         contain polylines.
     in_flightpath_features (Feature Layer):
         The polyline features that define curved approaches to the specified
         runways, terminating at the runway centerline endpoint.
     target_ois_features (Feature Layer):
         The target feature class that will contain the generated OIS.
     specification (String):
         Specifies the approach surface specification.ETOD-The approach surface
         specification is ICAO Annex 15
         (ETOD).OLS-The approach surface specification is ICAO Annex 14
         (OLS).FAR77-The approach surface specification is FAA regulations part
         77
         (FAR77).18B-The approach surface specification is FAA Advisory
         circular
         150/5300_18B (18B).13SURFACES-The approach surface specification is
         FAA Advisory circular
         150/5300_13.
     runway_classification (String):
         The runway classification of the approach surface.The specification
         parameter value will determine the available options
         for this parameter.
     custom_json_file {File}:
         The import configuration, in JSON format, that will be used to create
         the custom OIS.
     threshold_offset {Double}:
         A positive distance value that will be used to offset the generated
         approach surface outward from the runway end. The offset will be
         applied in the units of the input."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateCurvedApproach_aviation(
                *gp_fixargs(
                    (
                        in_runway_features,
                        in_flightpath_features,
                        target_ois_features,
                        specification,
                        runway_classification,
                        custom_json_file,
                        threshold_offset,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FAA13_aviation", None)
def FAA13(
    in_features=None,
    target_ois_features=None,
    high_runway_end_type: Literal[
        "SMALL_AIRPLANE_APPROACH_SPEEDS_LT_50",
        "SMALL_AIRPLANE_APPROACH_SPEEDS_GT_50",
        "LARGE_AIRPLANE_VISUAL_RUNWAY_DAY_NIGHT",
        "INSTRUMENT_NP_GT_EQ_3/4_MILE_VISIBILITY",
        "INSTRUMENT_NP_LT_3/4_MILE_VISIBILITY",
        "INSTRUMENT_GT_EQ_3/4_MILE_VISIBILITY",
        "INSTRUMENT_LT_3/4_MILE_VISIBILITY",
        "VERTICAL_GUIDANCE_APPROACH",
    ]
    | None = None,
    low_runway_end_type: Literal[
        "SAME_AS_HIGH_RUNWAY_END_CLASSIFICATION",
        "SMALL_AIRPLANE_APPROACH_SPEEDS_LT_50",
        "SMALL_AIRPLANE_APPROACH_SPEEDS_GT_50",
        "LARGE_AIRPLANE_VISUAL_RUNWAY_DAY_NIGHT",
        "INSTRUMENT_NP_GT_EQ_3/4_MILE_VISIBILITY",
        "INSTRUMENT_NP_LT_3/4_MILE_VISIBILITY",
        "INSTRUMENT_GT_EQ_3/4_MILE_VISIBILITY",
        "INSTRUMENT_LT_3/4_MILE_VISIBILITY",
        "VERTICAL_GUIDANCE_APPROACH",
    ]
    | None = None,
    high_approach_offset_angle=None,
    low_approach_offset_angle=None,
    generate_departure_surfaces: Literal[
        "GENERATE_DEPARTURE_SURFACE_AT_BOTH_ENDS",
        "GENERATE_DEPARTURE_SURFACE_AT_HIGH_END",
        "GENERATE_DEPARTURE_SURFACE_AT_LOW_END",
        "DO_NOT_GENERATE_DEPARTURE_SURFACE",
    ]
    | None = None,
    generate_clearway_surfaces: Literal["GENERATE_CLEARWAY_SURFACES", "NOT_GENERATE_CLEARWAY_SURFACES"] | None = None,
    in_threshold_point_features=None,
    custom_json_file=None,
) -> Result1[str | Layer]:
    """FAA13_aviation(in_features, target_ois_features, high_runway_end_type, {low_runway_end_type}, {high_approach_offset_angle}, {low_approach_offset_angle}, {generate_departure_surfaces}, {generate_clearway_surfaces}, {in_threshold_point_features}, {custom_json_file})

       Creates obstruction identification surfaces (OIS) based on the FAA
       Advisory Circular AC 150/5300-13B specification.

    INPUTS:
     in_features (Feature Layer):
         The input runway dataset. The feature class must be z-enabled and
         contain polylines.
     target_ois_features (Feature Layer):
         The target feature class that will contain the generated OIS.
     high_runway_end_type (String):
         Specifies the classification that will be used for the high end of the
         runway.SMALL_AIRPLANE_APPROACH_SPEEDS_LT_50-This runway classification
         is
         designed for light aircraft with a maximum takeoff weight of less than
         254 pounds and approach speed less than 50 knots. This is a visual
         runway only that can be used during the day or
         night.SMALL_AIRPLANE_APPROACH_SPEEDS_GT_50-This runway classification
         is
         designed for light aircraft with a maximum takeoff weight of less than
         1,320 pounds and approach speed more than 50 knots. This is a visual
         runway only that can be used during the day or
         night.LARGE_AIRPLANE_VISUAL_RUNWAY_DAY_NIGHT-This runway
         classification is
         designed for aircraft with a maximum certified takeoff weight of more
         than 12,500 pounds. The approach end of the runway is expected to
         serve large airplanes as a visual runway available day or night or an
         instrument approach with a minimum greater than one statute mile (1.6
         kilometers) only during the
         day.INSTRUMENT_NP_GT_EQ_3/4_MILE_VISIBILITY-This runway classification
         is
         designed for a nonprecision approach when visibility is greater than
         3/4 of a mile and less than 1 mile. The approach end of the runway
         supports IFR (Instrument Flight Rules) circling procedures providing
         the following lateral guidance: Very High Frequency Omnidirectional
         Range (VOR), Non-Directional Beacon (NDB), Lateral Navigation (LNAV),
         Localizer Performance (LP), Tactical Air Navigation (TACAN), VHF
         Omnidirectional Range Collocated Tactical Air (VORTAC), Airport
         Surveillance Radar (ASR), and Localizer
         (LOC).INSTRUMENT_NP_LT_3/4_MILE_VISIBILITY-This runway
         classification's
         nonprecision approach guidance is provided when visibility is less
         than 3/4 of a mile. The approach end of the runway is expected to
         accommodate instrument approaches with a visibility minimum of less
         than 3/4 of a statue mile (1.2 kilometers) and includes the following
         guidance: Very High Frequency Omnidirectional Range (VOR), Non-
         Directional Beacon (NDB), Lateral Navigation (LNAV), Localizer
         Performance (LP), Tactical Air Navigation (TACAN), VHF Omnidirectional
         Range Collocated Tactical Air (VORTAC), Airport Surveillance Radar
         (ASR), and Localizer (LOC).INSTRUMENT_GT_EQ_3/4_MILE_VISIBILITY-This
         runway classification is
         designed for an instrument approach procedure when visibility is
         greater than 3/4 of a mile and less than 1 mile. The approach end of
         the runway is expected to accommodate instrument approaches with a
         visible minimum of more than 3/4 of a mile but less than 1 statute
         mile (1.2-1.6 kilometers) during the day or
         night.INSTRUMENT_LT_3/4_MILE_VISIBILITY-This runway classification's
         course
         and vertical path guidance are provided when visibility is less than
         3/4 of a mile. The approach end of the runway is expected to
         accommodate instrument approaches with a visibility minimum of less
         than 3/4 of a statute mile (1.2 kilometers) or precision approaches
         (Instrument landing System [ILS] or Global Navigation Satellite System
         [GNSS] Landing System [GLS]) day or night.VERTICAL_GUIDANCE_APPROACH-
         This runway classification uses precision
         guidance systems to support aircraft approach and landing. The
         approach of the runway is expected to accommodate approaches with
         vertical guidance such as a Glide Path Qualification Surface (GPQS).
     low_runway_end_type {String}:
         Specifies the classification that will be used for the low end of the
         runway.SAME_AS_HIGH_RUNWAY_END_CLASSIFICATION-Same as high runway end
         classificationSMALL_AIRPLANE_APPROACH_SPEEDS_LT_50-This runway
         classification is
         designed for light aircraft with a maximum takeoff weight of less than
         254 pounds and approach speed less than 50 knots. This is a visual
         runway only that can be used during the day or
         night.SMALL_AIRPLANE_APPROACH_SPEEDS_GT_50-This runway classification
         is
         designed for light aircraft with a maximum takeoff weight of less than
         1,320 pounds and approach speed more than 50 knots. This is a visual
         runway only that can be used during the day or
         night.LARGE_AIRPLANE_VISUAL_RUNWAY_DAY_NIGHT-This runway
         classification is
         designed for aircraft with a maximum certified takeoff weight of more
         than 12,500 pounds. The approach end of the runway is expected to
         serve large airplanes as a visual runway available day or night or an
         instrument approach with a minimum greater than 1 statute mile (1.6
         kilometers) only during the
         day.INSTRUMENT_NP_GT_EQ_3/4_MILE_VISIBILITY-This runway classification
         is
         designed for a nonprecision approach when visibility is greater than
         3/4 of a mile and less than 1 mile. The approach end of the runway
         supports IFR (Instrument Flight Rules) circling procedures providing
         the following lateral guidance: Very High Frequency Omnidirectional
         Range (VOR), Non-Directional Beacon (NDB), Lateral Navigation (LNAV),
         Localizer Performance (LP), Tactical Air Navigation (TACAN), VHF
         Omnidirectional Range Collocated Tactical Air (VORTAC), Airport
         Surveillance Radar (ASR), and Localizer
         (LOC).INSTRUMENT_NP_LT_3/4_MILE_VISIBILITY-This runway
         classification's
         nonprecision approach guidance is provided when visibility is less
         than 3/4 of a mile. The approach end of the runway is expected to
         accommodate instrument approaches with a visibility minimum of less
         than 3/4 of a statue mile (1.2 kilometers) and includes the following
         guidance: Very High Frequency Omnidirectional Range (VOR), Non-
         Directional Beacon (NDB), Lateral Navigation (LNAV), Localizer
         Performance (LP), Tactical Air Navigation (TACAN), VHF Omnidirectional
         Range Collocated Tactical Air (VORTAC), Airport Surveillance Radar
         (ASR), and Localizer (LOC).INSTRUMENT_GT_EQ_3/4_MILE_VISIBILITY-This
         runway classification is
         designed for an instrument approach procedure when visibility is
         greater than 3/4 of a mile and less than 1 mile. The approach end of
         the runway is expected to accommodate instrument approaches with a
         visibility minimum of more than 3/4 of a mile but less than 1 statute
         mile (1.2-1.6 kilometers) during the day or
         night.INSTRUMENT_LT_3/4_MILE_VISIBILITY-This runway classification's
         course
         and vertical path guidance are provided when visibility is less than
         3/4 of a mile. The approach end of the runway is expected to
         accommodate instrument approaches with a visibility minimum of less
         than 3/4 of a statute mile (1.2 kilometers) or precision approaches
         (Instrument landing System [ILS] or Global Navigation Satellite System
         [GNSS] Landing System [GLS]) day or night.VERTICAL_GUIDANCE_APPROACH-
         This runway classification uses precision
         guidance systems to support aircraft approach and landing. The
         approach of the runway is expected to accommodate approaches with
         vertical guidance such as a Glide Path Qualification Surface (GPQS).
     high_approach_offset_angle {Double}:
         The offset angle for the high-end approach. The angle value is in
         degrees and ranges from -60 to 60. This value will be honored for the
         instrument approach surfaces only.
     low_approach_offset_angle {Double}:
         The offset angle for the low-end approach. The angle value is in
         degrees and ranges from -60 to 60. This value will be honored for the
         instrument approach surfaces only.
     generate_departure_surfaces {String}:
         Specifies whether a departure surface will be generated for departure
         runways.GENERATE_DEPARTURE_SURFACE_AT_BOTH_ENDS-A departure surface
         will be
         generated at both ends of the runway. This is the
         default.GENERATE_DEPARTURE_SURFACE_AT_HIGH_END-A departure surface
         will be
         generated at the high end of the
         runway.GENERATE_DEPARTURE_SURFACE_AT_LOW_END-A departure surface will
         be
         generated at the low end of the
         runway.DO_NOT_GENERATE_DEPARTURE_SURFACE-A departure surface will not
         be
         generated.
     generate_clearway_surfaces {Boolean}:
         Specifies whether a clearway surface will be generated for departure
         runways. Clearway surfaces will only be generated if a value has been
         specified for the generate_departure_surfaces
         parameter.GENERATE_CLEARWAY_SURFACES-A clearway surface will be
         generated.NOT_GENERATE_CLEARWAY_SURFACES-A clearway surface will not
         be
         generated. This is the default.
     in_threshold_point_features {Feature Layer}:
         Provides x-, y-, and z-geometry for displaced threshold features. If
         displaced thresholds are included, surfaces will be constructed based
         on their x-, y-, and z-geometry instead of their corresponding runway
         feature endpoint.
     custom_json_file {File}:
         The import configuration, in JSON format, that will be used to create
         the custom OIS."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FAA13_aviation(
                *gp_fixargs(
                    (
                        in_features,
                        target_ois_features,
                        high_runway_end_type,
                        low_runway_end_type,
                        high_approach_offset_angle,
                        low_approach_offset_angle,
                        generate_departure_surfaces,
                        generate_clearway_surfaces,
                        in_threshold_point_features,
                        custom_json_file,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FAA13A_aviation", None)
def FAA13A(
    in_features=None,
    target=None,
    runway_type: Literal[
        "SMALL_AIRPLANE_APPROACH_SPEEDS_LT_50",
        "SMALL_AIRPLANE_APPROACH_SPEEDS_GT_50",
        "LARGE_AIRPLANE_VISUAL_RUNWAY_DAY_NIGHT",
        "INSTRUMENT_GT_EQ_3/4_MILE",
        "INSTRUMENT_LT_3/4_MILE_VISIBILITY",
        "VERTICAL_GUIDANCE_APPROACH",
        "DEPARTURE",
    ]
    | None = None,
    highend_clear_way_length=None,
    lowend_clear_way_length=None,
    custom_json_file=None,
    generate_clearway_surface: Literal["GENERATE_CLEARWAY_SURFACE", "NOT_GENERATE_CLEARWAY_SURFACE"] | None = None,
    airport_control_point_feature_class=None,
) -> Result1[str | Layer]:
    """FAA13A_aviation(in_features, target, runway_type, {highend_clear_way_length}, {lowend_clear_way_length}, {custom_json_file}, {generate_clearway_surface}, {airport_control_point_feature_class})

       Creates obstruction identification surfaces (OIS) based on the FAA
       Advisory Circular 150/5300-13A specification. These approach and
       departure surfaces are designed to protect the use of the runway in
       both visual and instrument meteorological conditions near the airport
       and are used to support planning and design activities. The type,
       function, and dimension of a surface differ by its runway
       classification. This tool creates surfaces as a polygon or multipatch
       features.

    INPUTS:
     in_features (Feature Layer):
         The input runway dataset. The feature class must be z-enabled and
         contain polylines.
     target (Feature Layer):
         The target feature class that will contain the generated OIS.
     runway_type (String):
         Specifies the classification of the
         runway.SMALL_AIRPLANE_APPROACH_SPEEDS_LT_50-Approach end of runways
         are
         expected to serve small airplanes with approach speeds less than 50
         knots. This applies to visual runways only, day or
         night.SMALL_AIRPLANE_APPROACH_SPEEDS_GT_50-Approach end of runways are
         expected to serve small airplanes with approach speeds of 50 knots or
         more. This applies to visual runways only, day or
         night.LARGE_AIRPLANE_VISUAL_RUNWAY_DAY_NIGHT-Approach end of runway
         are
         expected to serve large airplanes. This applies to visual runways
         only, day or night.INSTRUMENT_GT_EQ_3/4_MILE-Approach end of runways
         are expected to
         accommodate instrument approaches having visibility greater than or
         equal to 3/4 statute mile.INSTRUMENT_LT_3/4_MILE_VISIBILITY-Approach
         end of runways are expected
         to accommodate instrument approaches having visibility minimums less
         than 3/4 statute mile.VERTICAL_GUIDANCE_APPROACH-Approach end of
         runways are expected to
         accommodate instrument approaches with vertical guidance.DEPARTURE-
         Departure runway ends are used for any instrument
         operations.
     highend_clear_way_length {Double}:
         This parameter is no longer supported. It is still included in the
         tool's syntax for compatibility in scripts and models but is hidden on
         the tool dialog box.
     lowend_clear_way_length {Double}:
         This parameter is no longer supported. It is still included in the
         tool's syntax for compatibility in scripts and models but is hidden on
         the tool dialog box.
     custom_json_file {File}:
         The import configuration, in JSON format, that will be used to create
         the custom OIS.
     generate_clearway_surface {Boolean}:
         Specifies whether a clearway surface will be generated for departure
         runways.GENERATE_CLEARWAY_SURFACE-A clearway surface will be
         generated.NOT_GENERATE_CLEARWAY_SURFACE-A clearway surface will not
         be
         generated. This is the default.
     airport_control_point_feature_class {Feature Layer}:
         Supplies x-, y-, and z-geometry for displaced threshold features. If
         displaced thresholds are included, surfaces will be constructed based
         on their x-, y-, and z-geometry instead of their corresponding runway
         feature endpoint."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FAA13A_aviation(
                *gp_fixargs(
                    (
                        in_features,
                        target,
                        runway_type,
                        highend_clear_way_length,
                        lowend_clear_way_length,
                        custom_json_file,
                        generate_clearway_surface,
                        airport_control_point_feature_class,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FAA13ARunwayProtectionSurfaces_aviation", None)
def FAA13ARunwayProtectionSurfaces(
    in_features=None,
    target=None,
    surface_generation: list[
        Literal[
            "RUNWAY_SAFETY_AREA",
            "RUNWAY_OBJECT_FREE_AREA",
            "RUNWAY_OBSTACLE_FREE_ZONE",
            "PRECISION_OBSTACLE_FREE_ZONE",
            "APPROACH_RUNWAY_PROTECTION_ZONE",
            "DEPARTURE_RUNWAY_PROTECTION_ZONE",
        ]
    ]
    | Literal[
        "RUNWAY_SAFETY_AREA",
        "RUNWAY_OBJECT_FREE_AREA",
        "RUNWAY_OBSTACLE_FREE_ZONE",
        "PRECISION_OBSTACLE_FREE_ZONE",
        "APPROACH_RUNWAY_PROTECTION_ZONE",
        "DEPARTURE_RUNWAY_PROTECTION_ZONE",
    ]
    | str
    | None = None,
    visibility_minimums: Literal["VISUAL", "NOT_LOWER_THAN_1_MILE", "NOT_LOWER_THAN_3_4_MILE", "LOWER_THAN_3_4_MILE"]
    | None = None,
    approach_category: Literal["A", "B", "C", "D", "E"] | None = None,
    approach_design_group: Literal["I", "II", "III", "IV", "V", "VI"] | None = None,
    small_aircraft: Literal["SMALL_AIRCRAFT", "NOT_SMALL_AIRCRAFT"] | None = None,
    approach_guidance: Literal[
        "PRECISION_CAT_I",
        "PRECISION_CAT_II",
        "PRECISION_CAT_IIIA",
        "PRECISION_CAT_IIIB",
        "PRECISION_CAT_IIIC",
        "PRECISION_CAT_IIID",
        "NON_VERTICAL",
        "VERTICAL",
        "VISUAL",
    ]
    | None = None,
    runway_direction: Literal["HIGH_END_TO_LOW_END", "LOW_END_TO_HIGH_END", "BOTH_END"] | None = None,
    airport_elevation=None,
    airport_control_point_feature_class=None,
    runway_end_features=None,
    last_low_light=None,
    last_high_light=None,
    custom_json_file=None,
) -> Result1[str | Layer]:
    """FAA13ARunwayProtectionSurfaces_aviation(in_features, target, surface_generation;surface_generation..., {visibility_minimums}, approach_category, approach_design_group, {small_aircraft}, {approach_guidance}, {runway_direction}, {airport_elevation}, {airport_control_point_feature_class}, {runway_end_features}, {last_low_light}, {last_high_light}, {custom_json_file})

       Generates runway protection surfaces based on FAA Advisory Circular
       150/5300-13A.

    INPUTS:
     in_features (Feature Layer):
         The input runway dataset. The feature class must be z-enabled and
         contain polylines.
     target (Feature Layer):
         The target feature class that will contain the generated OIS.
     surface_generation (String):
         Specifies the type of surface that will be
         generated.RUNWAY_SAFETY_AREA-A runway safety area (RSA) will be
         generated.RUNWAY_OBJECT_FREE_AREA-A runway object free area (ROFA)
         will be
         generated.RUNWAY_OBSTACLE_FREE_ZONE-A runway obstacle free zone (ROFZ)
         will be
         generated.PRECISION_OBSTACLE_FREE_ZONE-A precision obstacle free zone
         (POFZ)
         will be generated.APPROACH_RUNWAY_PROTECTION_ZONE-An approach runway
         protection zone
         (RPZ) will be generated.DEPARTURE_RUNWAY_PROTECTION_ZONE-A departure
         runway protection zone
         (RPZ) will be generated.
     visibility_minimums {String}:
         Specifies the visibility minimums that will be used for the
         runways.VISUAL-Visual flight rules will be
         used.NOT_LOWER_THAN_1_MILE-Visibility minimums will not be lower than
         1
         mile.NOT_LOWER_THAN_3_4_MILE-Visibility minimums will not be lower
         than 3/4
         mile.LOWER_THAN_3_4_MILE-Visibility minimums will be lower than 3/4
         mile.
     approach_category (String):
         Specifies the approach category that will be used to generate
         surfaces.A-Approach category A will be used.B-Approach category B will
         be
         used.C-Approach category C will be used.D-Approach category D will be
         used.E-Approach category E will be used.
     approach_design_group (String):
         Specifies the approach design group that will be used to generate
         surfaces.I-Approach design group I will be used.II-Approach design
         group II
         will be used.III-Approach design group III will be used.IV-Approach
         design group IV will be used.V-Approach design group V will be
         used.VI-Approach design group VI will be used.
     small_aircraft {Boolean}:
         Specifies whether surfaces will be generated with the small
         aircraft design matrix. This parameter only applies when the
         approach_category parameter is
         set to A or B.SMALL_AIRCRAFT-Surfaces will be generated with the small
         aircraft
         design matrix.NOT_SMALL_AIRCRAFT-Surfaces will not be generated with
         the small
         aircraft design matrix. This is the default.
     approach_guidance {String}:
         Specifies the type of approach guidance that will be used at the end
         of the runway.PRECISION_CAT_I-Precision Category I approach operations
         will be used
         for the runway.PRECISION_CAT_II-Precision Category II approach
         operations will be
         used for the runway.PRECISION_CAT_IIIA-Precision Category III A
         approach operations will
         be used for the runway.PRECISION_CAT_IIIB-Precision Category III B
         approach operations will
         be used for the runway.PRECISION_CAT_IIIC-Precision Category III C
         approach operations will
         be used for the runway.PRECISION_CAT_IIID-Precision Category III D
         approach operations will
         be used for the runway.NON_VERTICAL-Nonvertical approach operations
         (nonprecision approach
         category) will be used for the runway.VERTICAL-Vertically guided
         approach operations will be used for the
         runway.VISUAL-Only visual approach operations will be used for the
         runway.
     runway_direction {String}:
         Specifies the end of the runway where the approach surface will be
         created.HIGH_END_TO_LOW_END-The approach surface will be created from
         the high
         end of the runway to the low end. If a displaced threshold point
         exists at the high end of the runway, that point will be honored when
         creating the OIS.LOW_END_TO_HIGH_END-The approach surface will be
         created from the low
         end of the runway to the high end. If a displaced threshold point
         exists at the low end of the runway, that point will be honored when
         creating the OIS.BOTH_END-The approach surface will be created from
         both the low end
         and high end of the runway.
     airport_elevation {Double}:
         The highest elevation on any of the runways of the airport. The value
         should be in the vertical coordinate system linear units of the target
         feature class. If no value is provided, the highest point from the
         in_features parameter value will be used.
     airport_control_point_feature_class {Feature Layer}:
         The point features containing an airport_elevation parameter feature,
         displaced threshold features, or both. Values provided for the
         airport_elevation parameter will take precedence over these point
         features.
     runway_end_features {Feature Layer}:
         The input runway end point features associated with each runway. The
         corresponding field values in this layer will override the values
         specified in the approach_category, approach_design_group, and
         approach_guidance parameters.
     last_low_light {Double}:
         The distance in feet of the Approach Lighting System (ALS) from the
         end of the low end of the runway. If no value is provided, it is
         assumed that there is no ALS at the low end of the runway.
     last_high_light {Double}:
         The distance in feet of the Approach Lighting System (ALS) from the
         end of the high end of the runway. If no value is provided, it is
         assumed that there is no ALS at the high end of the runway.
     custom_json_file {File}:
         The import configuration, in JSON format, that will be used to create
         the custom obstruction identification surface (OIS)."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FAA13ARunwayProtectionSurfaces_aviation(
                *gp_fixargs(
                    (
                        in_features,
                        target,
                        surface_generation,
                        visibility_minimums,
                        approach_category,
                        approach_design_group,
                        small_aircraft,
                        approach_guidance,
                        runway_direction,
                        airport_elevation,
                        airport_control_point_feature_class,
                        runway_end_features,
                        last_low_light,
                        last_high_light,
                        custom_json_file,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FAA13ASurfaces_aviation", None)
def FAA13ASurfaces(
    in_features=None,
    target_ois_features=None,
    high_runway_end_type: Literal[
        "SMALL_AIRPLANE_APPROACH_SPEEDS_LT_50",
        "SMALL_AIRPLANE_APPROACH_SPEEDS_GT_50",
        "LARGE_AIRPLANE_VISUAL_RUNWAY_DAY_NIGHT",
        "INSTRUMENT_GT_EQ_3/4_MILE",
        "INSTRUMENT_LT_3/4_MILE_VISIBILITY",
        "VERTICAL_GUIDANCE_APPROACH",
    ]
    | None = None,
    low_runway_end_type: Literal[
        "SAME_AS_HIGH_RUNWAY_END_CLASSIFICATION",
        "SMALL_AIRPLANE_APPROACH_SPEEDS_LT_50",
        "SMALL_AIRPLANE_APPROACH_SPEEDS_GT_50",
        "LARGE_AIRPLANE_VISUAL_RUNWAY_DAY_NIGHT",
        "INSTRUMENT_GT_EQ_3/4_MILE",
        "INSTRUMENT_LT_3/4_MILE_VISIBILITY",
        "VERTICAL_GUIDANCE_APPROACH",
    ]
    | None = None,
    generate_departure_surfaces: Literal[
        "GENERATE_DEPARTURE_SURFACE_AT_BOTH_ENDS",
        "GENERATE_DEPARTURE_SURFACE_AT_HIGH_END",
        "GENERATE_DEPARTURE_SURFACE_AT_LOW_END",
        "DO_NOT_GENERATE_DEPARTURE_SURFACE",
    ]
    | None = None,
    generate_clearway_surfaces: Literal["GENERATE_CLEARWAY_SURFACES", "NOT_GENERATE_CLEARWAY_SURFACES"] | None = None,
    threshold_point_feature_class=None,
    custom_json_file=None,
) -> Result1[str | Layer]:
    """FAA13ASurfaces_aviation(in_features, target_ois_features, high_runway_end_type, {low_runway_end_type}, {generate_departure_surfaces}, {generate_clearway_surfaces}, {threshold_point_feature_class}, {custom_json_file})

       Creates obstruction identification surfaces (OIS) based on the FAA
       Advisory Circular 150/5300-13A specification. These primary and
       approach surfaces are designed to determine which objects are vertical
       obstructions and are used to support planning and design activities.
       The type, function, and dimension of a surface differ by its runway
       classification. This tool creates surfaces as a polygon or multipatch
       features.

    INPUTS:
     in_features (Feature Layer):
         The input runway dataset. The feature class must be z-enabled and
         contain polylines.
     target_ois_features (Feature Layer):
         The target feature class that will contain the generated OIS.
     high_runway_end_type (String):
         Specifies the classification of the high end of the
         runway.SMALL_AIRPLANE_APPROACH_SPEEDS_LT_50-This runway classification
         is
         designed for light aircraft with a maximum takeoff weight of less than
         254 pounds and approach speed less than 50 knots. This is a visual
         runway only that can be used during the day or
         night.SMALL_AIRPLANE_APPROACH_SPEEDS_GT_50-This runway classification
         is
         designed for light aircraft with a maximum takeoff weight of less than
         1,320 pounds and approach speed more than 50 knots. This is a visual
         runway only that can be used during the day or
         night.LARGE_AIRPLANE_VISUAL_RUNWAY_DAY_NIGHT-This runway
         classification is
         designed for aircraft with a maximum certified takeoff weight of more
         than 12,500 pounds. The approach end of the runway is expected to
         serve large airplanes as a visual runway available day or night, or
         instrument approach with a minimum greater than one statute mile (1.6
         kilometers) only during the day.INSTRUMENT_GT_EQ_3/4_MILE-This runway
         classification is designed for
         an instrument approach procedure where the visibility is greater than
         (>) three-fourths of a mile and less than one mile. The approach end
         of the runway is expected to accommodate instrument approaches with
         visible minimums more than three-fourths but less than 1 statute mile
         (1.2 < 1.6 kilometers) during day or
         night.INSTRUMENT_LT_3/4_MILE_VISIBILITY-This runway classification's
         course
         and vertical path guidance are provided with visibility less than (<)
         three-fourths of a mile. The approach end of the runway is expected to
         accommodate instrument approaches with visibility minimum less than
         three-fourths of a statute mile (1.2 kilometers) or precision approach
         (Instrument landing System [ILS] or Global Navigation Satellite System
         [GNSS] Landing System [GLS]) day or night.VERTICAL_GUIDANCE_APPROACH-
         This runway classification uses precision
         guidance systems to support aircraft approach and landing. The
         approach of the runway is expected to accommodate approaches with
         vertical guidance such as a Glide Path Qualification Surface (GPQS).
     low_runway_end_type {String}:
         Specifies the classification of the low end of the
         runway.SAME_AS_HIGH_RUNWAY_END_CLASSIFICATION-Same as high runway end
         classificationSMALL_AIRPLANE_APPROACH_SPEEDS_LT_50-This runway
         classification is
         designed for light aircraft with a maximum takeoff weight of less than
         254 pounds and approach speed less than 50 knots. This is a visual
         runway only that can be used during the day or
         night.SMALL_AIRPLANE_APPROACH_SPEEDS_GT_50-This runway classification
         is
         designed for light aircraft with a maximum takeoff weight of less than
         1,320 pounds and approach speed more than 50 knots. This is a visual
         runway only that can be used during the day or
         night.LARGE_AIRPLANE_VISUAL_RUNWAY_DAY_NIGHT-This runway
         classification is
         designed for aircraft with a maximum certified takeoff weight of more
         than 12,500 pounds. The approach end of the runway is expected to
         serve large airplanes as a visual runway available day or night, or
         instrument approach with a minimum greater than one statute mile (1.6
         kilometers) only during the day.INSTRUMENT_GT_EQ_3/4_MILE-This runway
         classification is designed for
         an instrument approach procedure where the visibility is greater than
         (>) three-fourths of a mile and less than one mile. The approach end
         of the runway is expected to accommodate instrument approaches with
         visible minimums more than three-fourths but less than 1 statute mile
         (1.2 < 1.6 kilometers) during day or
         night.INSTRUMENT_LT_3/4_MILE_VISIBILITY-This runway classification's
         course
         and vertical path guidance are provided with visibility less than (<)
         three-fourths of a mile. The approach end of the runway is expected to
         accommodate instrument approaches with visibility minimum less than
         three-fourths of a statute mile (1.2 kilometers) or precision approach
         (Instrument landing System [ILS] or Global Navigation Satellite System
         [GNSS] Landing System [GLS]) day or night.VERTICAL_GUIDANCE_APPROACH-
         This runway classification uses precision
         guidance systems to support aircraft approach and landing. The
         approach of the runway is expected to accommodate approaches with
         vertical guidance such as a Glide Path Qualification Surface (GPQS).
     generate_departure_surfaces {String}:
         Specifies whether a departure surface will be generated for departure
         runways.GENERATE_DEPARTURE_SURFACE_AT_BOTH_ENDS-A departure surface
         will be
         generated at both ends of the
         runway.GENERATE_DEPARTURE_SURFACE_AT_HIGH_END-A departure surface will
         be
         generated at the high end of the
         runway.GENERATE_DEPARTURE_SURFACE_AT_LOW_END-A departure surface will
         be
         generated at the low end of the
         runway.DO_NOT_GENERATE_DEPARTURE_SURFACE-A departure surface will not
         be
         generated.
     generate_clearway_surfaces {Boolean}:
         Specifies whether a clearway surface will be generated for departure
         runways. Clearway surfaces will only be generated if a value has been
         specified for the generate_departure_surfaces
         parameter.GENERATE_CLEARWAY_SURFACES-A clearway surface will be
         generated.NOT_GENERATE_CLEARWAY_SURFACES-A clearway surface will not
         be
         generated. This is the default.
     threshold_point_feature_class {Feature Layer}:
         The input threshold point dataset. The feature class must be
         z-enabled.
     custom_json_file {File}:
         The import configuration, in JSON format, that will be used to create
         the custom OIS."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FAA13ASurfaces_aviation(
                *gp_fixargs(
                    (
                        in_features,
                        target_ois_features,
                        high_runway_end_type,
                        low_runway_end_type,
                        generate_departure_surfaces,
                        generate_clearway_surfaces,
                        threshold_point_feature_class,
                        custom_json_file,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FAA13RunwayProtectionSurfaces_aviation", None)
def FAA13RunwayProtectionSurfaces(
    in_features=None,
    target=None,
    surfaces_to_generate: list[
        Literal[
            "RUNWAY_SAFETY_AREA",
            "RUNWAY_OBJECT_FREE_AREA",
            "RUNWAY_OBSTACLE_FREE_ZONE",
            "PRECISION_OBSTACLE_FREE_ZONE",
            "APPROACH_RUNWAY_PROTECTION_ZONE",
            "DEPARTURE_RUNWAY_PROTECTION_ZONE",
        ]
    ]
    | Literal[
        "RUNWAY_SAFETY_AREA",
        "RUNWAY_OBJECT_FREE_AREA",
        "RUNWAY_OBSTACLE_FREE_ZONE",
        "PRECISION_OBSTACLE_FREE_ZONE",
        "APPROACH_RUNWAY_PROTECTION_ZONE",
        "DEPARTURE_RUNWAY_PROTECTION_ZONE",
    ]
    | str
    | None = None,
    visibility_minimums: Literal["VISUAL", "NOT_LOWER_THAN_1_MILE", "NOT_LOWER_THAN_3_4_MILE", "LOWER_THAN_3_4_MILE"]
    | None = None,
    approach_category: Literal["A", "B", "C", "D", "E"] | None = None,
    approach_design_group: Literal["I", "II", "III", "IV", "V", "VI"] | None = None,
    aircraft_type: Literal["SMALL_AIRCRAFT", "NOT_SMALL_AIRCRAFT"] | None = None,
    approach_guidance: Literal[
        "PRECISION_CAT_I",
        "PRECISION_CAT_II",
        "PRECISION_CAT_IIIA",
        "PRECISION_CAT_IIIB",
        "PRECISION_CAT_IIIC",
        "PRECISION_CAT_IIID",
        "NON_VERTICAL",
        "VERTICAL",
        "VISUAL",
    ]
    | None = None,
    runway_direction: Literal["HIGH_END_TO_LOW_END", "LOW_END_TO_HIGH_END", "BOTH_END"] | None = None,
    airport_elevation=None,
    airport_control_point_feature_class=None,
    runway_end_features=None,
    last_low_light=None,
    last_high_light=None,
    custom_json_file=None,
) -> Result1[str | Layer]:
    """FAA13RunwayProtectionSurfaces_aviation(in_features, target, surfaces_to_generate;surfaces_to_generate..., {visibility_minimums}, {approach_category}, {approach_design_group}, {aircraft_type}, {approach_guidance}, {runway_direction}, {airport_elevation}, {airport_control_point_feature_class}, {runway_end_features}, {last_low_light}, {last_high_light}, {custom_json_file})

       Generates runway protection surfaces based on the FAA Advisory
       Circular AC 150/5300-13B specification.

    INPUTS:
     in_features (Feature Layer):
         The input runway dataset. The feature class must be z-enabled and
         contain polylines.
     target (Feature Layer):
         The target feature class that will contain the generated OIS.
     surfaces_to_generate (String):
         Specifies the type of surface that will be
         generated.RUNWAY_SAFETY_AREA-A runway safety area (RSA) will be
         generated.RUNWAY_OBJECT_FREE_AREA-A runway object free area (ROFA)
         will be
         generated.RUNWAY_OBSTACLE_FREE_ZONE-A runway obstacle free zone (ROFZ)
         will be
         generated.PRECISION_OBSTACLE_FREE_ZONE-A precision obstacle free zone
         (POFZ)
         will be generated.APPROACH_RUNWAY_PROTECTION_ZONE-An approach runway
         protection zone
         (RPZ) will be generated.DEPARTURE_RUNWAY_PROTECTION_ZONE-A departure
         runway protection zone
         (RPZ) will be generated.
     visibility_minimums {String}:
         Specifies the visibility minimums that will be used for the
         runways.VISUAL-Visual flight rules will be used. This is the
         default.NOT_LOWER_THAN_1_MILE-Visibility minimums will not be lower
         than 1
         mile.NOT_LOWER_THAN_3_4_MILE-Visibility minimums will not be lower
         that 3/4
         mile.LOWER_THAN_3_4_MILE-Visibility minimums will be lower than 3/4
         mile.
     approach_category {String}:
         Specifies the approach category that will be used to generate
         surfaces.A-The approach category A will be used. This is the
         default.B-The
         approach category B will be used.C-The approach category C will be
         used.D-The approach category D will be used.E-The approach category E
         will be used.
     approach_design_group {String}:
         Specifies the approach design group that will be used to generate
         surfaces.I-The approach design group I will be used. This is the
         default.II-The
         approach design group II will be used.III-The approach design group
         III will be used.IV-The approach design group IV will be used.V-The
         approach design group V will be used.VI-The approach design group VI
         will be used.
     aircraft_type {String}:
         Specifies whether surfaces will be generated with the small
         aircraft design matrix. This parameter only applies when the
         approach_category parameter is
         set to A or B.SMALL_AIRCRAFT-Surfaces will be generated with the small
         aircraft
         design matrix.NOT_SMALL_AIRCRAFT-Surfaces will not be generated with
         the small
         aircraft design matrix. This is the default.
     approach_guidance {String}:
         Specifies the type of approach guidance that will be used at the end
         of the runway.PRECISION_CAT_I-Precision Category I approach operations
         will be used
         for the runway. This is the default.PRECISION_CAT_II-Precision
         Category II approach operations will be
         used for the runway.PRECISION_CAT_IIIA-Precision Category III A
         approach operations will
         be used for the runway.PRECISION_CAT_IIIB-Precision Category III B
         approach operations will
         be used for the runway.PRECISION_CAT_IIIC-Precision Category III C
         approach operations will
         be used for the runway.PRECISION_CAT_IIID-Precision Category III D
         approach operations will
         be used for the runway.NON_VERTICAL-Nonvertical approach operations
         (nonprecision approach
         category) will be used for the runway.VERTICAL-Vertically guided
         approach operations will be used for the
         runway.VISUAL-Only visual approach operations will be used for the
         runway.
     runway_direction {String}:
         Specifies the end of the runway where the approach surface will be
         created.HIGH_END_TO_LOW_END-The approach surface will be created from
         the high
         end of the runway to the low end. If a displaced threshold point
         exists at the high end of the runway, that point will be honored when
         creating the OIS.LOW_END_TO_HIGH_END-The approach surface will be
         created from the low
         end of the runway to the high end. If a displaced threshold point
         exists at the low end of the runway, that point will be honored when
         creating the OIS.BOTH_END-The approach surface will be created from
         both the low end
         and high end of the runway.
     airport_elevation {Double}:
         The highest elevation on any of the runways of the airport. The value
         should be in the vertical coordinate system linear units of the target
         feature class. If no value is provided, the highest point from the
         in_features parameter value will be used.
     airport_control_point_feature_class {Feature Layer}:
         The point features containing an airport_elevation parameter feature,
         displaced threshold features, or both. Values provided for the
         airport_elevation parameter will take precedence over these point
         features.
     runway_end_features {Feature Layer}:
         The input runway end point features associated with each runway. The
         corresponding field values in this layer will override the values
         specified in the approach_category, approach_design_group, and
         approach_guidance parameters.
     last_low_light {Double}:
         The distance in feet of the Approach Lighting System (ALS) from the
         end of the low end of the runway. If no value is provided, it is
         assumed that there is no ALS at the low end of the runway. The unit of
         measurement is based on the input runway features.
     last_high_light {Double}:
         The distance in feet of the Approach Lighting System (ALS) from the
         end of the high end of the runway. If no value is provided, it is
         assumed that there is no ALS at the high end of the runway. The unit
         of measurement is based on the input runway features.
     custom_json_file {File}:
         The import configuration, in JSON format, that will create the custom
         OIS."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FAA13RunwayProtectionSurfaces_aviation(
                *gp_fixargs(
                    (
                        in_features,
                        target,
                        surfaces_to_generate,
                        visibility_minimums,
                        approach_category,
                        approach_design_group,
                        aircraft_type,
                        approach_guidance,
                        runway_direction,
                        airport_elevation,
                        airport_control_point_feature_class,
                        runway_end_features,
                        last_low_light,
                        last_high_light,
                        custom_json_file,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FAA18B_aviation", None)
def FAA18B(
    in_features=None,
    target=None,
    runway_type: Literal["NON_VERTICAL_GUIDANCE_TYPE_1", "NON_VERTICAL_GUIDANCE_TYPE_2", "VERTICAL_GUIDANCE"]
    | None = None,
    highend_clear_way_length=None,
    lowend_clear_way_length=None,
    airport_elevation=None,
    include_merged_surface: Literal["INCLUDE_MERGED_SURFACE", "NOT_INCLUDE_MERGED_SURFACE"] | None = None,
    custom_json_file=None,
    airport_control_point_feature_class=None,
) -> Result1[str | Layer]:
    """FAA18B_aviation(in_features, target, runway_type, {highend_clear_way_length}, {lowend_clear_way_length}, {airport_elevation}, {include_merged_surface}, {custom_json_file}, {airport_control_point_feature_class})

       Creates obstruction identification surfaces (OIS) based on the FAA
       Advisory Circular 150/5300-18B specification. These OIS assist in the
       identification of possible hazards to air navigation and critical
       approach and departure obstructions within the vicinity of the airport
       and are used to support planning and design activities. The type,
       function, and dimension of a surface differ by its runway
       classification. This tool creates surfaces as polygon or multipatch
       features.

    INPUTS:
     in_features (Feature Layer):
         The input runway dataset. The feature class must be z-enabled and
         contain polylines.
     target (Feature Layer):
         The target feature class that will contain the generated OIS.
     runway_type (String):
         Specifies the runway classification for the in_features
         value.NON_VERTICAL_GUIDANCE_TYPE_1-A runway designed for visual
         maneuvers,
         nonvertically guided operations, and instrument departure
         procedures.NON_VERTICAL_GUIDANCE_TYPE_2-A specially prepared hard
         surface (SPHS)
         runway designed for visual maneuvers, nonvertically guided operations,
         and instrument departure procedures. SPHS runways have a primary
         surface that extends 200 feet beyond each end of the
         runway.VERTICAL_GUIDANCE-A runway that uses precision guidance systems
         to
         support aircraft approach and landing.
     highend_clear_way_length {Double}:
         The length of the area at the high end of the runway. The unit of
         measurement is based on the input runway features.
     lowend_clear_way_length {Double}:
         The length of the area at the low end of the runway. The unit of
         measurement is based on the input runway features.
     airport_elevation {Double}:
         The highest elevation on any of the runways of the airport. The value
         should be in the vertical coordinate system linear units of the target
         feature class. If no value is provided, the highest point from the
         in_features parameter value will be used.
     include_merged_surface {Boolean}:
         Specifies whether merged horizontal and conical surfaces will be
         included in the OIS in addition to the regular
         surfaces.INCLUDE_MERGED_SURFACE-Merged surfaces will be included in
         the OIS
         output. This is the default.NOT_INCLUDE_MERGED_SURFACE-Merged surfaces
         will not be included in the
         OIS output.
     custom_json_file {File}:
         The import configuration, in JSON format, that will be used to create
         the custom OIS.
     airport_control_point_feature_class {Feature Layer}:
         The point features containing anfeature, displaced threshold
         features, or both. Values provided for theparameter will take
         precedence over these point features. Airport ElevationAirport
         Elevation"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FAA18B_aviation(
                *gp_fixargs(
                    (
                        in_features,
                        target,
                        runway_type,
                        highend_clear_way_length,
                        lowend_clear_way_length,
                        airport_elevation,
                        include_merged_surface,
                        custom_json_file,
                        airport_control_point_feature_class,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FAAFAR77_aviation", None)
def FAAFAR77(
    in_features=None,
    target=None,
    high_runway_end_type: Literal[
        "CONSTRUCTION_OR_ALTERATION_ON_AN_AIRPORT_WITH_LONGEST_RUNWAY_MORE_THAN_3200_FEET",
        "CONSTRUCTION_OR_ALTERATION_ON_AN_AIRPORT_WITH_LONGEST_RUNWAY_LESS_THAN_3200_FEET",
        "CONSTRUCTION_OR_ALTERATION_ON_A_HELIPORT",
        "MILITARY_AIRPORT",
        "NONPRECISION_INSTRUMENT_RUNWAY_GREATER_THAN_(>)_3/4_MILE_VISIBILITY",
        "NONPRECISION_INSTRUMENT_RUNWAY_LESS_THAN_(<)_3/4_MILE_VISIBILITY",
        "PRECISION_INSTRUMENT_RUNWAY",
        "UTILITY_RUNWAY_VISUAL_APPROACH",
        "UTILITY_RUNWAY_NON_PRECISION_INSTRUMENT_APPROACH",
        "VISUAL_RUNWAY_VISUAL_APPROACH",
    ]
    | None = None,
    low_runway_end_type: Literal[
        "SAME_AS_HIGH_RUNWAY_END_CLASSIFICATION",
        "NONPRECISION_INSTRUMENT_RUNWAY_GREATER_THAN_(>)_3/4_MILE_VISIBILITY",
        "NONPRECISION_INSTRUMENT_RUNWAY_LESS_THAN_(<)_3/4_MILE_VISIBILITY",
        "PRECISION_INSTRUMENT_RUNWAY",
        "UTILITY_RUNWAY_VISUAL_APPROACH",
        "UTILITY_RUNWAY_NON_PRECISION_INSTRUMENT_APPROACH",
        "VISUAL_RUNWAY_VISUAL_APPROACH",
    ]
    | None = None,
    specially_prepared_hard_surface_runway: Literal[
        "SPECIALLY_PREPARED_HARD_SURFACE_RUNWAY", "NON_SPECIALLY_PREPARED_HARD_SURFACE_RUNWAY"
    ]
    | None = None,
    highend_clear_way_length=None,
    lowend_clear_way_length=None,
    airport_elevation=None,
    include_merged_surface: Literal["INCLUDE_MERGED_SURFACE", "NOT_INCLUDE_MERGED_SURFACE"] | None = None,
    custom_json_file=None,
    airport_control_point_feature_class=None,
) -> Result1[str | Layer]:
    """FAAFAR77_aviation(in_features, target, high_runway_end_type, low_runway_end_type, {specially_prepared_hard_surface_runway}, {highend_clear_way_length}, {lowend_clear_way_length}, {airport_elevation}, {include_merged_surface}, {custom_json_file}, {airport_control_point_feature_class})

       Creates obstruction identification surfaces (OIS) based on the FAA
       Part 77 specification. This regulation establishes standards and
       notification requirements for objects affecting navigable airspace.
       The type, function, and dimension of a surface differ by its runway
       classification. This tool creates surfaces as a polygon or multipatch
       features.

    INPUTS:
     in_features (Feature Layer):
         The input runway dataset. The feature class must be z-enabled and
         contain polylines.
     target (Feature Layer):
         The target feature class that will contain the generated OIS.
     high_runway_end_type (String):
         Specifies the classification of the high end of the runway.CONSTRUCTIO
         N_OR_ALTERATION_ON_AN_AIRPORT_WITH_LONGEST_RUNWAY_MORE_THAN
         _3200_FEET-Construction on or alteration to a runway longer than 3,200
         feet with an imaginary surface that extends outward 20,000 feet and
         has a slope that does not exceed 100 to 1.CONSTRUCTION_OR_ALTERATION_O
         N_AN_AIRPORT_WITH_LONGEST_RUNWAY_LESS_THAN
         _3200_FEET-Construction on or alteration to a runway less than 3,200
         feet long with an imaginary surface that extends outward 10,000 feet
         and has a slope that does not exceed 50 to
         1.CONSTRUCTION_OR_ALTERATION_ON_A_HELIPORT-Construction on or
         alteration
         to a heliport landing and takeoff area with an imaginary surface that
         extends outward 5,000 feet and has a slope that does not exceed 25 to
         1.MILITARY_AIRPORT-Military airport runways are operated by an armed
         force of the United States. Primary surfaces are the same length as
         the runway. Primary surface width is 2,000 feet. Clear zone surface
         length is 1,000 feet, and width is the same as the primary surface.
         The approach clearance surface starts 200 feet beyond each end of the
         primary surface and extends for 50,000 feet. Approach surface width
         matches the primary surface width at the runway end but flares to a
         width of 16,000 feet at an elevation of 50,000 feet. Approach
         clearance surface slope is 50 to 1 to an elevation of 500 feet above
         airport elevation. It then rises horizontally to 50,000 feet.
         Transitional surface slope is 7 to 1 outward and upward at right
         angles to the runway centerline. See section 77.28 in the FAR Part 77
         specification for more information.NONPRECISION_INSTRUMENT_RUNWAY_GREA
         TER_THAN_(>)_3/4_MILE_VISIBILITY-A
         runway with a nonprecision instrument approach procedure that allows
         for landing in visibility conditions greater than three-quarters of a
         mile.NONPRECISION_INSTRUMENT_RUNWAY_LESS_THAN_(<)_3/4_MILE_VISIBILITY-
         A
         runway with a nonprecision instrument approach procedure that allows
         for landing in visibility conditions less than three-quarters of a
         mile.PRECISION_INSTRUMENT_RUNWAY-A runway that uses Instrument Landing
         System (ILS) or Precision Approach Radar (PAR) for approach
         procedures.UTILITY_RUNWAY_VISUAL_APPROACH-A runway built for propeller
         aircraft
         not exceeding 12,500 pounds gross weight. Aircraft using the runway
         use visual approach
         procedures.UTILITY_RUNWAY_NON_PRECISION_INSTRUMENT_APPROACH-A runway
         built for
         propeller aircraft not exceeding 12,500 pounds gross weight. The
         runway has an instrument approach procedure that uses air navigation
         facilities with horizontal guidance. It can also have area-type
         navigation equipment with approved nonprecision instrument approach
         procedures.VISUAL_RUNWAY_VISUAL_APPROACH-A runway that supports only
         visual
         approach procedures.
     low_runway_end_type (String):
         Specifies the classification of the low end of the
         runway.SAME_AS_HIGH_RUNWAY_END_CLASSIFICATION-No low runway end
         type.NONPRECI
         SION_INSTRUMENT_RUNWAY_GREATER_THAN_(>)_3/4_MILE_VISIBILITY-A
         runway with a nonprecision instrument approach procedure that allows
         for landing in visibility conditions greater than three-quarters of a
         mile.NONPRECISION_INSTRUMENT_RUNWAY_LESS_THAN_(<)_3/4_MILE_VISIBILITY-
         A
         runway with a nonprecision instrument approach procedure that allows
         for landing in visibility conditions less than three-quarters of a
         mile.PRECISION_INSTRUMENT_RUNWAY-A runway that uses Instrument Landing
         System (ILS) or Precision Approach Radar (PAR) for approach
         procedures.UTILITY_RUNWAY_VISUAL_APPROACH-A runway built for propeller
         aircraft
         not exceeding 12,500 pounds gross weight. Aircraft using the runway
         use visual approach
         procedures.UTILITY_RUNWAY_NON_PRECISION_INSTRUMENT_APPROACH-A runway
         built for
         propeller aircraft not exceeding 12,500 pounds gross weight. The
         runway has an instrument approach procedure that uses air navigation
         facilities with horizontal guidance. It can also have area-type
         navigation equipment with approved nonprecision instrument approach
         procedures.VISUAL_RUNWAY_VISUAL_APPROACH-A runway that supports only
         visual
         approach procedures.
     specially_prepared_hard_surface_runway {Boolean}:
         Specifies whether the runway has a specially prepared hard surface. A
         specially prepared hard surface indicates that the primary surface
         extends 200 feet beyond each end of the
         runway.SPECIALLY_PREPARED_HARD_SURFACE_RUNWAY-The runway has a
         specially
         prepared hard surface. This is the
         default.NON_SPECIALLY_PREPARED_HARD_SURFACE_RUNWAY-The runway does not
         have a
         specially prepared hard surface.
     highend_clear_way_length {Double}:
         The length of the area at the high end of the runway. The unit of
         measurement is based on the input runway features.
     lowend_clear_way_length {Double}:
         The length of the area at the low end of the runway. The unit of
         measurement is based on the input runway features.
     airport_elevation {Double}:
         The highest elevation on any of the runways of the airport. The value
         should be in the vertical coordinate system linear units of the target
         feature class. If no value is provided, the highest point from the
         in_features parameter value will be used.
     include_merged_surface {Boolean}:
         Specifies whether merged horizontal and conical surfaces will be
         included in the OIS in addition to the regular
         surfaces.INCLUDE_MERGED_SURFACE-Merged surfaces will be included in
         the OIS
         output. This is the default.NOT_INCLUDE_MERGED_SURFACE-Merged surfaces
         will not be included in the
         OIS output.
     custom_json_file {File}:
         The import configuration, in JSON format, that will be used to create
         the custom OIS.
     airport_control_point_feature_class {Feature Layer}:
         The point features containing anfeature, displaced threshold
         features, or both. Values provided for theparameter will take
         precedence over these point features. Airport ElevationAirport
         Elevation"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FAAFAR77_aviation(
                *gp_fixargs(
                    (
                        in_features,
                        target,
                        high_runway_end_type,
                        low_runway_end_type,
                        specially_prepared_hard_surface_runway,
                        highend_clear_way_length,
                        lowend_clear_way_length,
                        airport_elevation,
                        include_merged_surface,
                        custom_json_file,
                        airport_control_point_feature_class,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateOISIntersection_aviation", None)
def GenerateOISIntersection(
    in_ois_features=None,
    out_ois_features=None,
    multipart_feature: Literal["MULTIPART", "MERGE_ADJACENT"] | None = None,
) -> Result1[str | Layer]:
    """GenerateOISIntersection_aviation(in_ois_features;in_ois_features..., out_ois_features, {multipart_feature})

       Creates the most restrictive (lowest) surfaces within the extent of
       all collective surfaces. Obstruction identification surfaces (OIS)
       determine objects that are vertical obstructions. An object is
       considered a vertical obstruction if it penetrates the OIS surface.
       Surfaces are used to support planning and design activities.

    INPUTS:
     in_ois_features (Feature Layer):
         The input OIS features. The feature class must be a multipatch.
     multipart_feature {Boolean}:
         Specifies whether multipart features will be created in the output.
         Multipart features are composed of more than one physical part that
         only references one set of attributes.MULTIPART-Multipart features
         will be created. This is
         default.MERGE_ADJACENT-Adjacent triangulated multipart features will
         be
         created as individual features.

    OUTPUTS:
     out_ois_features (Feature Layer):
         The updated feature class containing the meshed OIS with the lowest
         z-value."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateOISIntersection_aviation(
                *gp_fixargs((in_ois_features, out_ois_features, multipart_feature), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ICAOAnnex14_aviation", None)
def ICAOAnnex14(
    in_features=None,
    target=None,
    runway_type: Literal[
        "NON_INSTRUMENT_CODE_NUMBER_1",
        "NON_INSTRUMENT_CODE_NUMBER_2",
        "NON_INSTRUMENT_CODE_NUMBER_3",
        "NON_INSTRUMENT_CODE_NUMBER_4",
        "NON_PRECISION_APPROACH_CODE_NUMBER_1",
        "NON_PRECISION_APPROACH_CODE_NUMBER_2",
        "NON_PRECISION_APPROACH_CODE_NUMBER_3",
        "NON_PRECISION_APPROACH_CODE_NUMBER_4",
        "PRECISION_APPROACH_CATEGORY_I_CODE_NUMBER_1",
        "PRECISION_APPROACH_CATEGORY_I_CODE_NUMBER_2",
        "PRECISION_APPROACH_CATEGORY_I_CODE_NUMBER_3_4",
        "PRECISION_APPROACH_CATEGORY_II_III_CODE_NUMBER_3_4",
    ]
    | None = None,
    highend_clear_way_length=None,
    lowend_clear_way_length=None,
    airport_elevation=None,
    runway_direction: Literal["HIGH_END_TO_LOW_END", "LOW_END_TO_HIGH_END", "BOTH_END"] | None = None,
    include_merged_surface: Literal["INCLUDE_MERGED_SURFACE", "NOT_INCLUDE_MERGED_SURFACE"] | None = None,
    custom_json_file=None,
    airport_control_point_feature_class=None,
) -> Result1[str | Layer]:
    """ICAOAnnex14_aviation(in_features, target, runway_type, {highend_clear_way_length}, {lowend_clear_way_length}, {airport_elevation}, {runway_direction}, {include_merged_surface}, {custom_json_file}, {airport_control_point_feature_class})

       Creates obstruction identification surfaces (OIS) based on ICAO Annex
       14 specifications. These surfaces define the airspace around
       aerodromes to be free of obstacles so flight operations can be
       performed safely. This tool creates surfaces as a polygon or
       multipatch features.

    INPUTS:
     in_features (Feature Layer):
         The input runway dataset. The feature class must be z-enabled and
         contain polylines.
     target (Feature Layer):
         The output feature class that will contain the generated OIS.
     runway_type (String):
         Specifies the runway classification for the in_features parameter
         value.NON_INSTRUMENT_CODE_NUMBER_1-A runway intended for the operation
         of
         aircraft using visual approach procedures. Runway strip length is 30
         meters.NON_INSTRUMENT_CODE_NUMBER_2-A runway with a 60-meter strip
         length and
         40-meter strip width that is intended for the operation of aircraft
         using visual approach procedures.NON_INSTRUMENT_CODE_NUMBER_3-A runway
         with a 60-meter strip length and
         75-meter strip width that is intended for the operation of aircraft
         using visual approach procedures.NON_INSTRUMENT_CODE_NUMBER_4-A runway
         with a 60-meter strip length and
         75-meter strip width that is intended for the operation of aircraft
         using visual approach
         procedures.NON_PRECISION_APPROACH_CODE_NUMBER_1-An instrument runway
         served by
         visual aids and a nonvisual aid providing at least directional
         guidance adequate for a straight-in approach. This runway type has a
         60-meter strip length and a 75-meter strip width on either side of the
         runway centerline.NON_PRECISION_APPROACH_CODE_NUMBER_2-An instrument
         runway served by
         visual aids and a nonvisual aid providing at least directional
         guidance adequate for a straight-in approach. This runway type has a
         60-meter strip length and a 75-meter strip width on either side of the
         runway centerline.NON_PRECISION_APPROACH_CODE_NUMBER_3-An instrument
         runway served by
         visual aids and a nonvisual aid providing at least directional
         guidance adequate for a straight-in approach. This runway type has a
         60-meter strip length and a 150-meter strip width on either side of
         the runway centerline.NON_PRECISION_APPROACH_CODE_NUMBER_4-An
         instrument runway served by
         visual aids and a nonvisual aid providing at least directional
         guidance adequate for a straight-in approach. This runway type has a
         60-meter strip length and a 150-meter strip width on either side of
         the runway centerline.PRECISION_APPROACH_CATEGORY_I_CODE_NUMBER_1-An
         instrument runway
         served by an Instrument Landing System (ILS) or a Microwave Landing
         System (MLS) and visual aids intended for operations with a decision
         height not lower than 60 meters (200 feet) and either a visibility not
         less than 800 meters or a runway visual range not less than 550
         meters. This runway type has a 60-meter strip length and a 75-meter
         strip width on either side of the runway
         centerline.PRECISION_APPROACH_CATEGORY_I_CODE_NUMBER_2-An instrument
         runway
         served by ILS and MLS and visual aids intended for operations with a
         decision height not lower than 60 meters (200 feet) and either a
         visibility not less than 800 meters or a runway visual range not less
         than 550 meters. This runway type has a 60-meter strip length and a
         75-meter strip width on either side of the runway
         centerline.PRECISION_APPROACH_CATEGORY_I_CODE_NUMBER_3_4-An instrument
         runway
         served by ILS and MLS and visual aids intended for operations with a
         decision height not lower than 60 meters (200 feet) and either a
         visibility not less than 800 meters or a runway visual range not less
         than 550 meters. This runway type has a 60-meter strip length and a
         150-meter strip width on either side of the runway
         centerline.PRECISION_APPROACH_CATEGORY_II_III_CODE_NUMBER_3_4-An
         instrument
         runway served by ILS and MLS and visual aids intended for operations
         with a decision height lower than 60 meters (200 feet) but not lower
         than 30 meters (100 feet) and a runway visual range not less than 350
         meters. This runway type has a 60-meter strip length and a 150-meter
         strip width on either side of the runway centerline.
     highend_clear_way_length {Double}:
         The length of the area at the high end of the runway. The unit of
         measurement is based on the input runway features.
     lowend_clear_way_length {Double}:
         The length of the area at the low end of the runway. The unit of
         measurement is based on the input runway features.
     airport_elevation {Double}:
         The highest elevation on any of the runways of the airport. The value
         must be in the vertical coordinate system linear units of the target
         feature class. If no value is provided, the highest point from the
         in_features dataset will be used.
     runway_direction {String}:
         Specifies the end of the runway where the approach surface will be
         created.HIGH_END_TO_LOW_END-The approach surface will be created at
         the high
         end of the runway to the low end. If a displaced threshold point
         exists at the high end of the runway, that point will be honored when
         creating the OIS.LOW_END_TO_HIGH_END-The approach surface will be
         created at the low
         end of the runway to the high end. If a displaced threshold point
         exists at the low end of the runway, that point will be honored when
         creating the OIS.BOTH_END-The approach surface will be created at both
         the low end and
         high end of the runway.
     include_merged_surface {Boolean}:
         Specifies whether merged surfaces will be
         generated.INCLUDE_MERGED_SURFACE-All the surfaces will be generated
         for the
         merged surfaces, as well as merged conical and horizontal surfaces.
         This is the default.NOT_INCLUDE_MERGED_SURFACE-Surfaces will not be
         generated for the
         merged surfaces.
     custom_json_file {File}:
         The import configuration, in JSON format, that will be used to create
         the custom OIS.
     airport_control_point_feature_class {Feature Layer}:
         The point features containing anfeature, displaced threshold
         features, or both. Values provided for theparameter will take
         precedence over these point features. Airport ElevationAirport
         Elevation"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ICAOAnnex14_aviation(
                *gp_fixargs(
                    (
                        in_features,
                        target,
                        runway_type,
                        highend_clear_way_length,
                        lowend_clear_way_length,
                        airport_elevation,
                        runway_direction,
                        include_merged_surface,
                        custom_json_file,
                        airport_control_point_feature_class,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ICAOAnnex14OFSOES_aviation", None)
def ICAOAnnex14OFSOES(
    in_features=None,
    target=None,
    surfaces_to_generate: list[Literal["OBSTACLE_FREE_SURFACES", "OBSTACLE_EVALUATION_SURFACES"]]
    | Literal["OBSTACLE_FREE_SURFACES", "OBSTACLE_EVALUATION_SURFACES"]
    | str
    | None = None,
    runway_type: Literal["NON_INSTRUMENT_RUNWAY", "NON_PRECISION_INSTRUMENT_RUNWAY", "PRECISION_INSTRUMENT_RUNWAY"]
    | None = None,
    airplane_design_group: Literal["I", "IIA", "IIB", "IIC", "III", "IV", "V"] | None = None,
    highend_clear_way_length=None,
    lowend_clear_way_length=None,
    airport_elevation=None,
    runway_direction: Literal["HIGH_END_TO_LOW_END", "LOW_END_TO_HIGH_END", "BOTH_END"] | None = None,
    include_merged_surface: Literal["INCLUDE_MERGED_SURFACE", "NOT_INCLUDE_MERGED_SURFACE"] | None = None,
    custom_json_file=None,
    airport_control_point_feature_class=None,
) -> Result1[str | Layer]:
    """ICAOAnnex14OFSOES_aviation(in_features, target, surfaces_to_generate;surfaces_to_generate..., runway_type, airplane_design_group, {highend_clear_way_length}, {lowend_clear_way_length}, {airport_elevation}, {runway_direction}, {include_merged_surface}, {custom_json_file}, {airport_control_point_feature_class})

       Creates obstacle-free surfaces (OFS) and obstacle evaluation surfaces
       (OES) based on ICAO Annex 14 OFS OES specifications. These surfaces
       define the airspace around aerodromes to be free of obstacles and
       safeguard airspace so flight operations can be performed safely. This
       tool creates surfaces as a polygon or multipatch features.

    INPUTS:
     in_features (Feature Layer):
         The input runway dataset. The feature class must be z-enabled and
         contain polylines.
     target (Feature Layer):
         The target feature class that will contain the generated OIS.
     surfaces_to_generate (String):
         Specifies the type of surface that will be
         generated.OBSTACLE_FREE_SURFACES-An OFS will be generated. This
         provides a free
         volume of airspace in critical surroundings of the
         runway.OBSTACLE_EVALUATION_SURFACES-An OES will be generated. This
         provides
         the volume of airspace where obstacles could impact the operations and
         where their impact needs to be evaluated.
     runway_type (String):
         Specifies the classification of the runway.NON_INSTRUMENT_RUNWAY-This
         runway classification intended for the
         operation of aircraft using visual approach
         procedures.NON_PRECISION_INSTRUMENT_RUNWAY-This runway classification
         is designed
         for a nonprecision instrument approach
         procedure.PRECISION_INSTRUMENT_RUNWAY-This runway classification is
         designed for
         an instrument approach procedure.
     airplane_design_group (String):
         Specifies the airplane design group that will be used to generate
         surfaces.I-The airplane design group I will be used.IIA-The airplane
         design
         group IIA will be used.IIB-The airplane design group IIB will be
         used.IIC-The airplane design group IIC will be used.III-The airplane
         design group III will be used.IV-The airplane design group IV will be
         used.V-The airplane design group V will be used.
     highend_clear_way_length {Double}:
         The length of the area at the high end of the runway. The unit of
         measurement is based on the input runway features.
     lowend_clear_way_length {Double}:
         The length of the area at the low end of the runway. The unit of
         measurement is based on the input runway features.
     airport_elevation {Double}:
         The highest elevation on any of the runways of the airport. The value
         must be in the vertical coordinate system linear units of the target
         feature class. If no value is provided, the highest point from the
         in_features parameter value will be used.
     runway_direction {String}:
         Specifies the end of the runway where the approach surface will be
         created.HIGH_END_TO_LOW_END-The approach surface will be created at
         the high
         end of the runway to the low end. If a displaced threshold point
         exists at the high end of the runway, that point will be honored when
         creating the OIS.LOW_END_TO_HIGH_END-The approach surface will be
         created at the low
         end of the runway to the high end. If a displaced threshold point
         exists at the low end of the runway, that point will be honored when
         creating the OIS.BOTH_END-The approach surface will be created at both
         the low end and
         high end of the runway.
     include_merged_surface {Boolean}:
         Specifies whether merged surfaces will be
         generated.INCLUDE_MERGED_SURFACE-All the surfaces will be generated
         for the
         merged surfaces, as well as merged conical and horizontal surfaces.
         This is the default.NOT_INCLUDE_MERGED_SURFACE-Surfaces will not be
         generated for the
         merged surfaces.
     custom_json_file {File}:
         The import configuration, in JSON format, that will be used to create
         the custom OIS.
     airport_control_point_feature_class {Feature Layer}:
         Supplies x-, y-, and z-geometry for displaced threshold features. If
         displaced thresholds are included, surfaces will be constructed based
         on their x-, y-, and z-geometry instead of their corresponding runway
         feature endpoint."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ICAOAnnex14OFSOES_aviation(
                *gp_fixargs(
                    (
                        in_features,
                        target,
                        surfaces_to_generate,
                        runway_type,
                        airplane_design_group,
                        highend_clear_way_length,
                        lowend_clear_way_length,
                        airport_elevation,
                        runway_direction,
                        include_merged_surface,
                        custom_json_file,
                        airport_control_point_feature_class,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ICAOAnnex15_aviation", None)
def ICAOAnnex15(
    in_features=None,
    target=None,
    highend_clear_way_length=None,
    lowend_clear_way_length=None,
    custom_json_file=None,
    airport_control_point_feature_class=None,
) -> Result1[str | Layer]:
    """ICAOAnnex15_aviation(in_features, target, {highend_clear_way_length}, {lowend_clear_way_length}, {custom_json_file}, {airport_control_point_feature_class})

       Creates obstruction identification surfaces (OIS) based on the ICAO
       Annex 15 specification (Areas 2a, 2b, and 2c). These surfaces assist
       in determining the height restriction or removal of obstacles that
       pose a hazard to air navigation in and around an aerodrome. This tool
       creates surfaces as a polygon or multipatch features.

    INPUTS:
     in_features (Feature Layer):
         The input runway dataset. The feature class must be z-enabled and
         contain polylines.
     target (Feature Layer):
         The target feature class that will contain the generated OIS.
     highend_clear_way_length {Double}:
         The length of the area at the high end of the runway. The unit of
         measurement is based on the input runway features.
     lowend_clear_way_length {Double}:
         The length of the area at the low end of the runway. The unit of
         measurement is based on the input runway features.
     custom_json_file {File}:
         The import configuration, in JSON format, that will be used to create
         the custom OIS.
     airport_control_point_feature_class {Feature Layer}:
         Supplies x-, y-, and z-geometry for displaced threshold features. If
         displaced thresholds are included, surfaces will be constructed based
         on their x-, y-, and z-geometry instead of their corresponding runway
         feature endpoint."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ICAOAnnex15_aviation(
                *gp_fixargs(
                    (
                        in_features,
                        target,
                        highend_clear_way_length,
                        lowend_clear_way_length,
                        custom_json_file,
                        airport_control_point_feature_class,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ICAOAnnex4_aviation", None)
def ICAOAnnex4(
    in_features=None,
    target=None,
    runway_direction: Literal["HIGH_END_TO_LOW_END", "LOW_END_TO_HIGH_END"] | None = None,
    length=None,
    width=None,
    slope=None,
    height=None,
    airport_control_point_feature_class=None,
) -> Result1[str | Layer]:
    """ICAOAnnex4_aviation(in_features, target, {runway_direction}, {length}, {width}, {slope}, {height}, {airport_control_point_feature_class})

       Creates obstruction identification surfaces (OIS) based on the ICAO
       Annex 4 specification for the Precision Approach Terrain chart.

    INPUTS:
     in_features (Feature Layer):
         The input runway dataset. The feature class must be z-enabled and
         contain polylines.
     target (Feature Layer):
         The target feature class that will contain the generated obstruction
         identification surfaces.
     runway_direction {String}:
         Specifies at which end of the runway the approach surface will be
         created.HIGH_END_TO_LOW_END-The approach surface will be created at
         the high
         end of the runway to the low end. If a displaced threshold point
         exists at the high end of the runway, that point will be honored when
         creating the OIS.LOW_END_TO_HIGH_END-The approach surface will be
         created at the low
         end of the runway to the high end. If a displaced threshold point
         exists at the low end of the runway, that point will be honored when
         creating the OIS.
     length {Double}:
         The length of the surface in meters. The default value is 900.
     width {Double}:
         The width of the surface in meters. The default value is 120.
     slope {Double}:
         The slope of the surface in degrees. The default value is 3.
     height {Double}:
         The start height of the surface in meters. The default value is 15.24.
     airport_control_point_feature_class {Feature Layer}:
         Supplies x-, y-, and z-geometry for displaced threshold features. If
         displaced thresholds are included, surfaces will be constructed based
         on their x-, y-, and z-geometry instead of their corresponding runway
         feature endpoint."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ICAOAnnex4_aviation(
                *gp_fixargs(
                    (
                        in_features,
                        target,
                        runway_direction,
                        length,
                        width,
                        slope,
                        height,
                        airport_control_point_feature_class,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ICAOAnnex4Surfaces_aviation", None)
def ICAOAnnex4Surfaces(
    in_features=None,
    target_ois_features=None,
    surface_generation: list[Literal["PRECISION_APPROACH_TERRAIN_AREA", "TAKEOFF_FLIGHT_PATH_AREA"]]
    | Literal["PRECISION_APPROACH_TERRAIN_AREA", "TAKEOFF_FLIGHT_PATH_AREA"]
    | str
    | None = None,
    runway_direction: Literal["HIGH_END_TO_LOW_END", "LOW_END_TO_HIGH_END"] | None = None,
    clear_way_length=None,
    threshold_point_feature_class=None,
    custom_json_file=None,
) -> Result1[str | Layer]:
    """ICAOAnnex4Surfaces_aviation(in_features, target_ois_features, surface_generation;surface_generation..., {runway_direction}, {clear_way_length}, {threshold_point_feature_class}, {custom_json_file})

       Creates obstruction identification surfaces (OIS) based on the ICAO
       Annex 4 specifications for either a Take-Off Flight Path Area or a
       Precision Approach Terrain Area.

    INPUTS:
     in_features (Feature Layer):
         The input runway dataset. The feature class must be z-enabled and
         contain polylines.
     target_ois_features (Feature Layer):
         The target feature class that will contain the generated OIS.
     surface_generation (String):
         Specifies the types of surfaces that will be created.
         PRECISION_APPROACH_TERRAIN_AREA-A surface that is 60 meters
         either side of the extended runway centerline to a distance of 900
         meters from the threshold, with a 3 percent slope rising outward from
         the threshold will be created. The surface will be
         created pursuant to, Chapter 6, 6.5.1.
         ICAO Annex 4         TAKEOFF_FLIGHT_PATH_AREA-A surface with a 180
         meter width at
         its point of origin (end of runway or clearway), which increases at a
         rate of 0.25D to a maximum of 1800 meters, where D is the distance
         from the point of origin that will be created. This surface extends to
         a distance of 10 kilometers and has a 1.2 percent slope ascending
         outward from the point of origin. The surface will
         be created pursuant to, Chapter 3, 3.8.2.
         ICAO Annex 4
     runway_direction {String}:
         Specifies the end of the runway where the approach surface will be
         created.HIGH_END_TO_LOW_END-The approach surface will be created at
         the high
         end of the runway to the low end. If a displaced threshold point
         exists at the high end of the runway, that point will be honored when
         creating the OIS.LOW_END_TO_HIGH_END-The approach surface will be
         created at the low
         end of the runway to the high end. If a displaced threshold point
         exists at the low end of the runway, that point will be honored when
         creating the OIS.
     clear_way_length {Double}:
         The length of the area beyond the runway in meters.
     threshold_point_feature_class {Feature Layer}:
         Supplies x-, y-, and z-geometry for displaced threshold features. If
         displaced thresholds are included, surfaces will be constructed based
         on their x-, y-, and z-geometry instead of their corresponding runway
         feature endpoint.
     custom_json_file {File}:
         The import configuration, in JSON format, that will be used to create
         the custom OIS.To create a .json file for this parameter, use the
         CustomizeOIS.exe
         file that is part of the ArcGIS Aviation data package available from
         My Esri."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ICAOAnnex4Surfaces_aviation(
                *gp_fixargs(
                    (
                        in_features,
                        target_ois_features,
                        surface_generation,
                        runway_direction,
                        clear_way_length,
                        threshold_point_feature_class,
                        custom_json_file,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("LightSignalClearanceSurface_aviation", None)
def LightSignalClearanceSurface(
    in_features=None,
    target=None,
    runway_direction: Literal["HIGH_RUNWAY_END_DESIGNATOR", "LOW_RUNWAY_END_DESIGNATOR"] | None = None,
    length=None,
    divergence=None,
    slope=None,
    distance_from_threshold=None,
    first_papi_light=None,
    last_papi_light=None,
    start_height=None,
    airport_control_point_feature_class=None,
    surface_position: Literal["SURFACE_GENERATED_ON_LEFT", "SURFACE_GENERATED_ON_RIGHT"] | None = None,
) -> Result1[str | Layer]:
    """LightSignalClearanceSurface_aviation(in_features, target, {runway_direction}, {length}, {divergence}, {slope}, {distance_from_threshold}, {first_papi_light}, {last_papi_light}, {start_height}, {airport_control_point_feature_class}, {surface_position})

       Creates a Light Signal Clearance Surface (LSCS) based on the FAA
       Engineering Brief (EB) 95.

    INPUTS:
     in_features (Feature Layer):
         The input runway dataset. The feature class must be z-enabled and
         contain polylines.
     target (Feature Layer):
         The target feature class that will contain the generated OIS.
     runway_direction {String}:
         Specifies the end of the runway where the approach surface will be
         created.HIGH_RUNWAY_END_DESIGNATOR-The approach surface will be
         created at
         the high end of the runway. This is the
         default.LOW_RUNWAY_END_DESIGNATOR-The approach surface will be created
         at the
         low end of the runway.
     length {Double}:
         The length of the surface in miles. The default value is 8.
     divergence {Double}:
         The divergence of the surface in degrees. The default value is 14.
     slope {Double}:
         The slope of the surface in degrees. The default value is 1.
     distance_from_threshold {Double}:
         The distance from the threshold in feet. The default value is 1000.
     first_papi_light {Double}:
         The location of the first precision approach path indicator. The
         default value is 60.
     last_papi_light {Double}:
         The location of the last precision approach path indicator. The
         default value is 120.
     start_height {Double}:
         The start height of the surface. The default value is 35.
     airport_control_point_feature_class {Feature Layer}:
         Supplies x-, y-, and z-geometry for displaced threshold features. If
         displaced thresholds are included, surfaces will be constructed based
         on their x-, y-, and z-geometry instead of their corresponding runway
         feature endpoint.
     surface_position {String}:
         Specifies the position of the precision approach path indicator (PAPI)
         lights on either side of a runway. The position of the PAPI lights
         will be used to determine the position of the output
         surface.SURFACE_GENERATED_ON_LEFT-PAPI lights are on the left approach
         side of
         the runway. The surface will generate on the left approach side of the
         runway. This is the default.SURFACE_GENERATED_ON_RIGHT-PAPI lights are
         on the right approach side
         of the runway. The surface will generate on the right approach side of
         the runway."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LightSignalClearanceSurface_aviation(
                *gp_fixargs(
                    (
                        in_features,
                        target,
                        runway_direction,
                        length,
                        divergence,
                        slope,
                        distance_from_threshold,
                        first_papi_light,
                        last_papi_light,
                        start_height,
                        airport_control_point_feature_class,
                        surface_position,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PAPIObstacleClearanceSurface_aviation", None)
def PAPIObstacleClearanceSurface(
    in_features=None,
    target=None,
    runway_direction: Literal["HIGH_RUNWAY_END_DESIGNATOR", "LOW_RUNWAY_END_DESIGNATOR"] | None = None,
    length=None,
    divergence=None,
    slope=None,
    distance_from_threshold=None,
    start_height=None,
    airport_control_point_feature_class=None,
) -> Result1[str | Layer]:
    """PAPIObstacleClearanceSurface_aviation(in_features, target, {runway_direction}, {length}, {divergence}, {slope}, {distance_from_threshold}, {start_height}, {airport_control_point_feature_class})

       Creates a Precision Approach Path Indicator (PAPI) Obstacle Clearance
       Surface (OCS) based on the FAA Engineering Brief (EB) 95.

    INPUTS:
     in_features (Feature Layer):
         The input runway dataset. The feature class must be z-enabled and
         contain polylines.
     target (Feature Layer):
         The target feature class that will contain the generated OIS.
     runway_direction {String}:
         Specifies the end of the runway where the approach surface will be
         created.HIGH_RUNWAY_END_DESIGNATOR-The approach surface will be
         created at
         the high end of the runway. This is the
         defaultLOW_RUNWAY_END_DESIGNATOR-The approach surface will be created
         at the
         low end of the runway.
     length {Double}:
         The length of the surface in miles. The default is 4.
     divergence {Double}:
         The divergence of the surface in degrees. The default is 10.
     slope {Double}:
         The slope of the surface in degrees. The default is 3.
     distance_from_threshold {Double}:
         The distance from the threshold in feet. The default is 700.
     start_height {Double}:
         The start height of the surface in feet. The default is 35.
     airport_control_point_feature_class {Feature Layer}:
         Supplies x-, y-, and z-geometry for displaced threshold features. If
         displaced thresholds are included, surfaces will be constructed based
         on their x-, y-, and z-geometry instead of their corresponding runway
         feature endpoint."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PAPIObstacleClearanceSurface_aviation(
                *gp_fixargs(
                    (
                        in_features,
                        target,
                        runway_direction,
                        length,
                        divergence,
                        slope,
                        distance_from_threshold,
                        start_height,
                        airport_control_point_feature_class,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UnifiedFacilitiesCriteria_aviation", None)
def UnifiedFacilitiesCriteria(
    in_runway_features=None,
    target_ois_features=None,
    in_wing_type: Literal["FIXED", "ROTARY"] | None = None,
    in_service_type: Literal["AIRFORCE", "ARMY", "NAVY", "MARINECORPS"] | None = None,
    in_runway_class: Literal["CLASS_A", "CLASS_B"] | None = None,
    in_flight_rule: Literal["INSTRUMENT", "VISUAL"] | None = None,
    highend_clear_way_length=None,
    lowend_clear_way_length=None,
    airport_elevation=None,
    custom_json_file=None,
    airport_control_point_feature_class=None,
) -> Result1[str | Layer]:
    """UnifiedFacilitiesCriteria_aviation(in_runway_features, target_ois_features, in_wing_type, in_service_type, in_runway_class, in_flight_rule, {highend_clear_way_length}, {lowend_clear_way_length}, {airport_elevation}, {custom_json_file}, {airport_control_point_feature_class})

       Creates obstruction identification surfaces (OIS) based on the Unified
       Facilities Criteria (UFC) 3-260-01 that is prescribed by MIL-STD 3007.
       These surfaces provide planning, design, construction, sustainment,
       restoration, and modernization criteria for the United States
       Department of Defense. Surfaces are created as polygon or multipatch
       features.

    INPUTS:
     in_runway_features (Feature Layer):
         The input runway dataset. The feature class must be z-enabled and
         contain polylines.
     target_ois_features (Feature Layer):
         The existing output feature class that will contain the generated UFC
         surfaces.
     in_wing_type (String):
         Specifies the wing type of the aircraft.FIXED-The wing type is
         fixed.ROTARY-The wing type is rotary.If you specify ROTARY, the
         in_runway_class parameter will default to
         the CLASS_A option without affecting the surface generation.
     in_service_type (String):
         Specifies the type of military service.AIRFORCE-The service type is
         Air Force.ARMY-The service type is
         Army.NAVY-The service type is Navy.MARINECORPS-The service type is
         Marine Corps.
     in_runway_class (String):
         Specifies the runway class. Runways are classified as either Class A
         or Class B based on aircraft type.CLASS_A-The runway classification is
         Class A.CLASS_B-The runway
         classification is Class B.
     in_flight_rule (String):
         Specifies the flight rule. These are the rules that govern the
         procedures for conducting flight, either instrument or under visual
         conditions.INSTRUMENT-The flight rule is instrument flight
         condition.VISUAL-The
         flight rule is visual flight condition.
     highend_clear_way_length {Double}:
         The length of the area at the high end of the runway. The unit of
         measurement is based on the input runway features.
     lowend_clear_way_length {Double}:
         The length of the area at the low end of the runway. The unit of
         measurement is based on the input runway features.
     airport_elevation {Double}:
         The highest elevation on any of the runways of the airport.
         Provide the value in the vertical coordinate system linear units of
         the target feature class. If no value is provided, the highest point
         of theparameter value will be used. Input Runway Features
     custom_json_file {File}:
         The import configuration, in JSON format, that will be used to create
         the custom OIS.
     airport_control_point_feature_class {Feature Layer}:
         The point features containing anfeature, displaced threshold
         features, or both. Values provided for theparameter will take
         precedence over these point features. Airport ElevationAirport
         Elevation"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UnifiedFacilitiesCriteria_aviation(
                *gp_fixargs(
                    (
                        in_runway_features,
                        target_ois_features,
                        in_wing_type,
                        in_service_type,
                        in_runway_class,
                        in_flight_rule,
                        highend_clear_way_length,
                        lowend_clear_way_length,
                        airport_elevation,
                        custom_json_file,
                        airport_control_point_feature_class,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Charting\Cartography toolset
@gptooldoc("AddAviationLineBypass_aviation", None)
def AddAviationLineBypass(
    in_map: Literal["Internal_Map"] | None = None,
    target_line_features=None,
    bypass_features=None,
    tolerance=None,
    radius_option: Literal["DYNAMIC_RADIUS", "CONSTANT_RADIUS"] | None = None,
    radius_scale=None,
    radius=None,
    merge_option: Literal["NO_MERGE_BYPASS", "MERGE_BYPASS"] | None = None,
) -> Result1[str | Layer]:
    """AddAviationLineBypass_aviation(in_map, target_line_features, {bypass_features;bypass_features...}, {tolerance}, {radius_option}, {radius_scale}, {radius}, {merge_option})

       Adjusts route polyline features that overlap point features.

    INPUTS:
     in_map (Map):
         The input map with a set reference scale.
     target_line_features (String):
         The polyline features representing ATS routes.
     bypass_features {String}:
         The point features that the target_line_features parameter value will
         bypass.
     tolerance {Linear Unit}:
         The maximum distance between the center point of a bypass feature and
         a route.If the linear unit is not specified or is set to Unknown, it
         will be
         the same as the input map's spatial reference.
     radius_option {String}:
         Specifies the type of bypass radius that will be
         used.DYNAMIC_RADIUS-The radius will be dynamic relative to its scale
         factor. This is the default.CONSTANT_RADIUS-The radius will be a
         constant radius.
     radius_scale {Double}:
         The amount a bypass with a dynamic radius will be scaled. This
         parameter is only valid if DYNAMIC_RADIUS is chosen as the
         radius_option parameter value.
     radius {Linear Unit}:
         The radius of a bypass with a constant radius. This parameter is only
         valid if CONSTANT_RADIUS is chosen as the radius_option parameter
         value.If the linear unit is not specified or is set to Unknown, it
         will be
         the same as the input map's spatial reference.
     merge_option {String}:
         Specifies whether consecutive bypass lines will be
         merged.NO_MERGE_BYPASS-Consecutive bypass lines will not be merged.
         This is
         the default.MERGE_BYPASS-Consecutive bypass lines will be merged."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddAviationLineBypass_aviation(
                *gp_fixargs(
                    (
                        in_map,
                        target_line_features,
                        bypass_features,
                        tolerance,
                        radius_option,
                        radius_scale,
                        radius,
                        merge_option,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AggregateObstacles_aviation", None)
def AggregateObstacles(
    in_obstacle_features=None,
    height_field=None,
    height_field_units: Literal["METERS", "DECIMETERS", "CENTIMETERS", "MILLIMETERS", "YARDS", "FEET", "INCHES"]
    | None = None,
    elevation_field=None,
    elevation_field_units: Literal["METERS", "DECIMETERS", "CENTIMETERS", "MILLIMETERS", "YARDS", "FEET", "INCHES"]
    | None = None,
    elevation_interpretation: Literal["ON_THE_GROUND", "ABOVE_THE_GROUND"] | None = None,
    target_obstacle_group_features=None,
    target_obstacle_group_label=None,
    in_obstacle_assocation_table=None,
    search_radius=None,
    height_threshold=None,
    builtup_areas_features=None,
    builtup_areas_height_threshold=None,
    obstacle_grouping_type: Literal["TO_POINT", "TO_POLYGON"] | None = None,
    target_obstacle_group_polygon_features=None,
    minimum_polygon_area=None,
) -> Result3[str | Layer, str | Layer, str | Table]:
    """AggregateObstacles_aviation(in_obstacle_features, height_field, height_field_units, elevation_field, elevation_field_units, elevation_interpretation, target_obstacle_group_features, target_obstacle_group_label, in_obstacle_assocation_table, {search_radius}, {height_threshold}, {builtup_areas_features}, {builtup_areas_height_threshold}, {obstacle_grouping_type}, {target_obstacle_group_polygon_features}, {minimum_polygon_area})

       Aggregates point obstacle features within a given radius so that the
       highest obstacle in the group represents the entire group.

    INPUTS:
     in_obstacle_features (Feature Layer):
         The input obstacle features.
     height_field (String):
         The field containing the height of the obstacle features.
     height_field_units (String):
         Specifies the units that will be used for obstacle height.METERS-The
         obstacle height will be in meters.DECIMETERS-The obstacle
         height will be in decimeters.CENTIMETERS-The obstacle height will be
         in centimeters.MILLIMETERS-The obstacle height will be in
         millimeters.YARDS-The obstacle height will be in yards.FEET-The
         obstacle height will be in feet. This is the default.INCHES-The
         obstacle height will be in inches.
     elevation_field (String):
         The field containing the elevation of the obstacle features.
     elevation_field_units (String):
         Specifies the units that will be used for obstacle
         elevation.METERS-The obstacle elevation will be in
         meters.DECIMETERS-The
         obstacle elevation will be in decimeters.CENTIMETERS-The obstacle
         elevation will be in centimeters.MILLIMETERS-The obstacle elevation
         will be in millimeters.YARDS-The obstacle elevation will be in
         yards.FEET-The obstacle elevation will be in feet. This is the
         default.INCHES-The obstacle elevation will be in inches.
     elevation_interpretation (String):
         Specifies how obstacle elevations will be measured.
         ON_THE_GROUND-The height value will be added to the elevation
         value to determine the elevation of the top of the obstacle. Specify
         this option when theparameter value contains values representing the
         elevation (AMSL) of the base of the obstacle. Elevation Field
         ABOVE_THE_GROUND-Specify this option when theparameter value
         contains values representing the elevation (AMSL) of the top of the
         obstacle. This is the default. Elevation Field
     target_obstacle_group_features (Feature Layer):
         The output feature class where aggregated obstacle features will be
         written.
     target_obstacle_group_label (String):
         The text describing the obstacle grouping. The text is used to
         identify obstacle groups for different chart specifications that may
         be created using different parameters.
     in_obstacle_assocation_table (Table View):
         The table that will be populated with information linking each
         obstacle group feature to the obstacles it represents.
     search_radius {Linear Unit}:
         The radius within which the obstacles will be grouped.
     height_threshold {Linear Unit}:
         The height threshold for an obstacle to be considered for grouping.
         Obstacles with a height value greater than or equal to this value will
         be considered.
     builtup_areas_features {Feature Layer}:
         Polygon features designating built-up areas. These represent areas
         where a different height threshold is required.
     builtup_areas_height_threshold {Linear Unit}:
         The height threshold for an obstacle within a built-up area polygon to
         be considered for grouping. Obstacles with a height value equal to or
         greater than this value will be considered.
     obstacle_grouping_type {String}:
         Specifies the geometry type of the obstacle groups that will be
         generated.TO_POINT-Obstacles will be generated as points. This is the
         default.TO_POLYGON-Obstacles will be generated as polygons.
     target_obstacle_group_polygon_features {Feature Layer}:
         The output polygon feature class where aggregated obstacle features
         will be written.
     minimum_polygon_area {Areal Unit}:
         The minimum area of an output polygon before it collapses to a point
         feature."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AggregateObstacles_aviation(
                *gp_fixargs(
                    (
                        in_obstacle_features,
                        height_field,
                        height_field_units,
                        elevation_field,
                        elevation_field_units,
                        elevation_interpretation,
                        target_obstacle_group_features,
                        target_obstacle_group_label,
                        in_obstacle_assocation_table,
                        search_radius,
                        height_threshold,
                        builtup_areas_features,
                        builtup_areas_height_threshold,
                        obstacle_grouping_type,
                        target_obstacle_group_polygon_features,
                        minimum_polygon_area,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateAirwayCorridors_aviation", None)
def GenerateAirwayCorridors(
    in_features=None,
    enroute_information_table=None,
    designated_points=None,
    target_airspace_area_features=None,
    floors_table=None,
    route_types=None,
    flare_angle=None,
    min_distance=None,
    changeover_points=None,
) -> Result1[str | Layer]:
    """GenerateAirwayCorridors_aviation(in_features, enroute_information_table, designated_points, target_airspace_area_features, {floors_table}, {route_types;route_types...}, {flare_angle}, {min_distance}, {changeover_points})

       Simplifies the creation of airway corridors and flares for specified
       ATS routes.

    INPUTS:
     in_features (Feature Layer):
         The input route segment features (polyline) for which corridors and
         flares will be created.
     enroute_information_table (Table View):
         The table containing route information records that describe
         airways composed of one or more route segment polylines. Each record
         provides information such as theandattributes. Route
         lengthDoglegpoint_Id
     designated_points (Feature Layer):
         The feature class containing point features that start or end route
         segment features.
     target_airspace_area_features (Feature Layer):
         The feature class that will be used to store the generated corridor
         and flare features.
     floors_table {Table View}:
         The table containing airway floor descriptions that will be used to
         split the corridors and flares created for the route.
     route_types {String}:
         The route types that will have flares created. All route types will
         have corridors created, regardless of selection.
     flare_angle {Double}:
         The angle in degrees that will be used to create flares for routes.
     min_distance {Double}:
         The minimum distance or length in nautical miles for a route to have a
         flare created.
     changeover_points {Feature Layer}:
         The feature class containing change over points for routes."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateAirwayCorridors_aviation(
                *gp_fixargs(
                    (
                        in_features,
                        enroute_information_table,
                        designated_points,
                        target_airspace_area_features,
                        floors_table,
                        route_types,
                        flare_angle,
                        min_distance,
                        changeover_points,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RotateAviationFeatures_aviation", None)
def RotateAviationFeatures(
    in_map: Literal["Internal_Map"] | None = None,
    target_layers=None,
    rotate_option: Literal[
        "ROTATE_TO_GRID", "ROTATE_TO_PAGE_TOP", "ROTATE_TO_PAGE_LEFT", "ROTATE_TO_PAGE_BOTTOM", "ROTATE_TO_PAGE_RIGHT"
    ]
    | None = None,
) -> Result1[str | Layer]:
    """RotateAviationFeatures_aviation(in_map, target_layers;target_layers..., {rotate_option})

       Aligns features to a grid or to the page.

    INPUTS:
     in_map (Map):
         The map containing aviation features.
     target_layers (String):
         The point or annotation feature layers that will be rotated.
     rotate_option {String}:
         Specifies how the features will be rotated.ROTATE_TO_GRID-The features
         will be rotated to the map's grid. This is
         the default.ROTATE_TO_PAGE_TOP-The features will be rotated to the top
         of the
         page.ROTATE_TO_PAGE_LEFT-The features will be rotated to the left side
         of
         the page.ROTATE_TO_PAGE_BOTTOM-The features will be rotated to the
         bottom of
         the page.ROTATE_TO_PAGE_RIGHT-The features will be rotated to the
         right side of
         the page."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RotateAviationFeatures_aviation(*gp_fixargs((in_map, target_layers, rotate_option), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateAviationAnno_aviation", None)
def UpdateAviationAnno(
    in_map: Literal["Internal_Map"] | None = None,
    in_anno_layers=None,
    aoi_features=None,
    apply_scaling: Literal["SCALED", "NOT_SCALED"] | None = None,
) -> Result1[str | Layer]:
    """UpdateAviationAnno_aviation(in_map, in_anno_layers;in_anno_layers..., {aoi_features}, {apply_scaling})

       Batch updates Aviation-specific annotation layers to streamline chart
       production and finishing.

    INPUTS:
     in_map (Map):
         The input value for this tool, which will update the domains for the
         in_anno_layers parameter value.
     in_anno_layers (Value Table):
         The feature-linked annotation layers and the specified sublayers that
         will be updated.Annotation Layers-The input feature-linked annotation
         layers.Sublayers-The sublayers that determine which annotation
         features will
         be processed.
     aoi_features {Feature Layer}:
         The AOI boundary within which features will be processed.
     apply_scaling {Boolean}:
         Specifies whether scaling will be applied to annotation features based
         on linked cartographic feature reference scale and annotation
         reference scale.SCALED-Annotation scaling will be
         applied.NOT_SCALED-No annotation
         scaling will be applied. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpdateAviationAnno_aviation(*gp_fixargs((in_map, in_anno_layers, aoi_features, apply_scaling), True))
        )
        return retval
    except Exception as e:
        raise e


# Charting\Data Exchange toolset
@gptooldoc("ExportAIXM51Message_aviation", None)
def ExportAIXM51Message(
    in_aviation_workspace=None,
    out_message_file=None,
    export_type: Literal["BASELINE", "SNAPSHOT", "PERM_DELTA", "TEMP_DELTA"] | None = None,
    last_modified_time=None,
    in_filter_layers=None,
    from_time=None,
    to_time=None,
    validate_output: Literal["VALIDATE", "NO_VALIDATE"] | None = None,
    out_validation_log=None,
) -> Result2[str, str]:
    """ExportAIXM51Message_aviation(in_aviation_workspace, out_message_file, export_type, {last_modified_time}, {in_filter_layers;in_filter_layers...}, {from_time}, {to_time}, {validate_output}, {out_validation_log})

       Exports aeronautical data to an AIXM 5.1 message.

    INPUTS:
     in_aviation_workspace (Workspace):
         The AIS schema workspace.
     export_type (String):
         Specifies the AIXM temporality type the message represents.BASELINE-
         The message contains all features in a given
         message.SNAPSHOT-The message contains all features at a specific point
         in
         time.PERM_DELTA-The message contains updates in a given time slice in
         features as a result of a baseline update.TEMP_DELTA-The message
         contains changes for some features in a given
         time slice representing a temporary event.
     last_modified_time {Date}:
         The date that will be used to filter the output to only features
         modified after that date.
     in_filter_layers {Table View}:
         The layers that will filter output to a smaller spatial subset. The
         input layers should be AIXM 5.1 feature types. This value should be in
         the same AIS geodatabase as the in_filter_layers parameter value.
     from_time {Date}:
         The starting time that will be applied to theandfields in the
         output message types for any missingorfield values in the features to
         export. The value will be converted to UTC. If a value is not
         specified, the current system date and time in UTC will be applied to
         the missing field values in the output message. validTime\\begin
         PositionfeatureLifetime\\beginPositionValidFrom_DateFeatureFrom_DateThi
         s parameter will be used differently depending on the export_type
         parameter value. BASELINE-The parameter will be honored only
         when the actual
         database record does not have theorattributes populated.
         FromFeature_DateValidFrom_Date         SNAPSHOT-The parameter value
         provided will be exported
         regardless of theandattributes in the database.
         FromFeature_DateValidFrom_Date         PERM_DELTA-The parameter will
         be honored only when the actual
         database record does not have theorattributes populated.
         FromFeature_DateValidFrom_Date         TEMP_DELTA-The parameter will
         be honored only when the actual
         database record does not have theor theattributes populated.
         FromFeature_DateValidFrom_Date
     to_time {Date}:
         The ending time that will be applied to theandfields in the
         output Baseline or Permanent Delta message types for any
         missingorfield values in the features to export. The value will be
         converted to UTC. If a value is not specified, the current system date
         and time in UTC will be applied to the missing field values in the
         output message. validTime\\endPositionfeatureLifetime\\endPositio
         nValidTo_DateFeatureTo_DateThis parameter is only valid when the
         export_type parameter is set to
         TEMP_DELTA.
     validate_output {Boolean}:
         Specifies whether the exported message will be validated for the XML
         format. You must be connected to the internet for validation to
         succeed.VALIDATE-The exported message will be validated for the XML
         format.NO_VALIDATE-The exported message will not be validated for the
         XML
         format. This is the default.

    OUTPUTS:
     out_message_file (File):
         The exported AIXM 5.1 message as an .xml file.
     out_validation_log {File}:
         The output XML validation log file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportAIXM51Message_aviation(
                *gp_fixargs(
                    (
                        in_aviation_workspace,
                        out_message_file,
                        export_type,
                        last_modified_time,
                        in_filter_layers,
                        from_time,
                        to_time,
                        validate_output,
                        out_validation_log,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportAIXM51Message_aviation", None)
def ImportAIXM51Message(
    in_message_file=None,
    target_gdb=None,
    in_tables=None,
    update_existing_features: Literal["UPDATE_EXISTING", "CREATE_NEW"] | None = None,
) -> Result1[str]:
    """ImportAIXM51Message_aviation(in_message_file, target_gdb, {in_tables;in_tables...}, {update_existing_features})

       Imports Aeronautical Information Exchange Model (AIXM) version 5.1
       data into an aviation geodatabase.

    INPUTS:
     in_message_file (File):
         The input AIXM 5.1 message.
     target_gdb (Workspace):
         The ArcGIS Aviation Charting schema workspace where the AIXM message
         will be imported.
     in_tables {String}:
         The names of tables used to restrict the feature types that will be
         imported.
     update_existing_features {Boolean}:
         Specifies whether existing features will be updated or new features
         will be inserted.UPDATE_EXISTING-Existing features will be
         updated.CREATE_NEW-Existing
         features will not be updated; new features will be
         inserted. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportAIXM51Message_aviation(
                *gp_fixargs((in_message_file, target_gdb, in_tables, update_existing_features), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportDCDTChangeFile_aviation", None)
def ImportDCDTChangeFile(
    in_change_file=None,
    target_gdb=None,
    current_cycle_date=None,
) -> Result1[str]:
    """ImportDCDTChangeFile_aviation(in_change_file, target_gdb, current_cycle_date)

       Imports an NGA Digital Chart Data Transaction (DCDT) change file into
       an aviation geodatabase.

    INPUTS:
     in_change_file (File):
         The NGA DCDT change file is a Microsoft Access .mdb or .accdb file
         with changes to be loaded for the current chart cycle.
     target_gdb (Workspace):
         The Aviation charting schema workspace where the changes will be
         loaded.
     current_cycle_date (Date):
         The date of the current charting cycle."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportDCDTChangeFile_aviation(*gp_fixargs((in_change_file, target_gdb, current_cycle_date), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportDOF_aviation", None)
def ImportDOF(
    in_obstacle_file=None,
    obstacle_features=None,
) -> Result1[str | Layer]:
    """ImportDOF_aviation(in_obstacle_file, obstacle_features)

       Adds, deletes, and updates the obstacle point features in an input
       obstacle feature class using an input digital obstacle file (DOF).

    INPUTS:
     in_obstacle_file (File):
         A DOF with a .DAT file extension. The contents of the DOF will be used
         to update the obstacle_features parameter values.
     obstacle_features (Feature Layer):
         The point feature class that will contain obstacle information from
         the DOF after execution."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportDOF_aviation(*gp_fixargs((in_obstacle_file, obstacle_features), True))
        )
        return retval
    except Exception as e:
        raise e


# Charting\Data Management toolset
@gptooldoc("CalculateATSRouteAttributes_aviation", None)
def CalculateATSRouteAttributes(
    in_features=None,
    atsroute_attributes=None,
    magnetic_variation_date=None,
    in_designatedpoint_features=None,
    in_navaidcomponent_features=None,
    in_desigpointnavaid_assoc_table=None,
    in_navaid_assoc_table=None,
    in_enroute_table=None,
) -> Result1[str | Layer]:
    """CalculateATSRouteAttributes_aviation(in_features, atsroute_attributes;atsroute_attributes..., {magnetic_variation_date}, {in_designatedpoint_features}, {in_navaidcomponent_features}, {in_desigpointnavaid_assoc_table}, {in_navaid_assoc_table}, {in_enroute_table})

       Calculates segment distance and bearing attributes on Air Traffic
       Service (ATS) route features. The tool can also calculate the FAA
       specific route attributes on a route segment and route collection.

    INPUTS:
     in_features (Feature Layer):
         The polyline features for which ATS route attributes will be
         calculated.
     atsroute_attributes (Value Table):
         Specifies the ATS route attributes that will be calculated.LENGTH-The
         length of the route segment in nautical miles will be
         calculated.TRUE_TRACK-The true north azimuth of the route segment's
         track from
         its start point will be calculated.REVERSE_TRUE_TRACK-The true north
         azimuth of the route segment's
         reverse track from its end point will be calculated.MAG_TRACK-The
         magnetic north azimuth of the route segment's track from
         its start point will be calculated.REVERSE_MAG_TRACK-The magnetic
         north azimuth of the route segment's
         reverse track from its end point will be calculated.FAA_TRUE_TRACK-The
         true north azimuth of the route segment's track
         from its start point will be calculated using FAA specific
         rules.FAA_REVERSE_TRUE_TRACK-The true north azimuth of the route
         segment's
         reverse track from its end point will be calculated using FAA specific
         rules.FAA_MAG_TRACK-The magnetic north azimuth of the route segment's
         track
         from its start point will be calculated using FAA specific
         rules.FAA_REVERSE_MAG_TRACK-The magnetic north azimuth of the route
         collection from its end point will be calculated using FAA specific
         rules.FAA_TRUE_TRACK2-The true north azimuth of the route collection
         from
         its start point will be calculated using FAA specific
         rules.FAA_REVERSE_TRUE_TRACK2-The true north azimuth of the route
         collection
         from its end point will be calculated using FAA specific
         rules.FAA_MAG_TRACK2-The magnetic north azimuth of the route
         collection from
         its start point will be calculated using FAA specific
         rules.FAA_REVERSE_MAG_TRACK2-The magnetic north azimuth of the route
         collection from its end point will be calculated using FAA specific
         rules.FAA_ALTITUDE_CHANGE_STATUS-A numeric indicator showing how a
         route's
         segment altitude changes from the previous segment in a route
         collection.
     magnetic_variation_date {Date}:
         The date for which the magnetic field values will be calculated.
     in_designatedpoint_features {Feature Layer}:
         The designated point coordinates that will be used to calculate the
         bearing of a route collection. This parameter is only used when an FAA
         bearing attribute is specified for the atsroute_attributes parameter
         value.
     in_navaidcomponent_features {Feature Layer}:
         The magnetic variation value SlavedVariation_Val will be used as the
         magnetic variation value in a bearing calculation if the start or end
         of a route collection is collated with a Navaid component. This
         parameter is only used when an FAA bearing attribute is specified for
         the atsroute_attributes parameter value.
     in_desigpointnavaid_assoc_table {Table View}:
         An association table that will be used to determine whether a
         designated point is collocated with a Navaid component. This parameter
         is only used when an FAA bearing attribute is specified for the
         atsroute_attributes parameter value.
     in_navaid_assoc_table {Table View}:
         An association table that will be used to associate a designated point
         to a Navaid component. This parameter is only used when an FAA bearing
         attribute is specified for the atsroute_attributes parameter value.
     in_enroute_table {Table View}:
         A table that contains the total mileage of a route collection. It also
         contains dogleg points along a route collection and is needed to
         calculate a route collection's bearing values. This parameter is only
         used when an FAA bearing attribute is specified for the
         atsroute_attributes parameter value."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateATSRouteAttributes_aviation(
                *gp_fixargs(
                    (
                        in_features,
                        atsroute_attributes,
                        magnetic_variation_date,
                        in_designatedpoint_features,
                        in_navaidcomponent_features,
                        in_desigpointnavaid_assoc_table,
                        in_navaid_assoc_table,
                        in_enroute_table,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateAirspaceAreas_aviation", None)
def GenerateAirspaceAreas(
    in_airspace_features=None,
    target_airspace_area_features=None,
    aoi_features=None,
    preference_table=None,
    preference=None,
    derived_airspace_part_features=None,
    vertical_limit_override_table=None,
) -> Result1[str | Layer]:
    """GenerateAirspaceAreas_aviation(in_airspace_features, target_airspace_area_features, aoi_features, preference_table, preference, {derived_airspace_part_features}, {vertical_limit_override_table})

       Generates AirspaceArea features from Airspace features.

    INPUTS:
     in_airspace_features (Feature Layer):
         The input Airspace features. These features adhere to the AIS
         geodatabase schema.
     target_airspace_area_features (Feature Layer):
         The target AirspaceArea feature class. These features adhere to the
         AIS geodatabase schema.
     aoi_features (Feature Layer):
         The area of interest boundary within which features will be processed.
     preference_table (Table View):
         The table containing the specified preferences.
     preference (String):
         The preference derived from the preference_table parameter that will
         be used to process the airspace features at the chosen altitudes..
     derived_airspace_part_features {Feature Layer}:
         The feature class that will be updated with airspace features
         derived from theparameter. Input Airspace FeaturesThe feature
         class that will be updated with airspace features derived
         from the in_airspace_features parameter.
     vertical_limit_override_table {Table View}:
         A table that overrides the vertical height values set in the
         preference table."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateAirspaceAreas_aviation(
                *gp_fixargs(
                    (
                        in_airspace_features,
                        target_airspace_area_features,
                        aoi_features,
                        preference_table,
                        preference,
                        derived_airspace_part_features,
                        vertical_limit_override_table,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateAirspaceLines_aviation", None)
def GenerateAirspaceLines(
    in_airspace_features=None,
    target_airspace_line_features=None,
    aoi_features=None,
    preference_table=None,
    preference=None,
    label_airspaces: Literal["INTERSECTING_AIRSPACES", "NO_INTERSECTING_AIRSPACES"] | None = None,
) -> Result1[str | Layer]:
    """GenerateAirspaceLines_aviation(in_airspace_features;in_airspace_features..., target_airspace_line_features, aoi_features, preference_table, preference;preference..., {label_airspaces})

       Generates line features in the AirspaceLine feature class from the
       edges of input Airspace polygon features.

    INPUTS:
     in_airspace_features (Feature Layer):
         The polygon feature classes containing the airspace boundaries.
     target_airspace_line_features (Feature Layer):
         The polyline feature class containing the airspace line data.
     aoi_features (Feature Layer):
         The polygon feature class containing the AOI data.The selected polygon
         features will be used to filter the airspace
         lines that will be added, modified, or deleted.
     preference_table (Table View):
         The table of preferences that define how the airspace lines will be
         added, modified, or deleted.
     preference (String):
         The name of a selected preference in the preference_table parameter
         value. The selected preference defines how the airspace lines will be
         added, modified, or deleted.
     label_airspaces {Boolean}:
         Specifies whether the output line's left and right labels will
         aggregate and show the labels of the intersecting airspaces that the
         line is within.NO_INTERSECTING_AIRSPACES-The left and right labels of
         the output
         lines will contain the airspace labels of the coincident airspaces
         only. Intersecting airspaces will not be included. Only coincident
         airspaces that touch the airspace line within the preference cluster
         tolerance will be identified. This is the
         default.INTERSECTING_AIRSPACES-The left and right labels of the output
         lines
         will contain airspace labels of intersecting airspaces and coincident
         airspaces. Only coincident airspaces that touch the airspace line
         within the default cluster tolerance will be identified."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateAirspaceLines_aviation(
                *gp_fixargs(
                    (
                        in_airspace_features,
                        target_airspace_line_features,
                        aoi_features,
                        preference_table,
                        preference,
                        label_airspaces,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateAviationCartographicFeatures_aviation", None)
def GenerateAviationCartographicFeatures(
    source_target_carto_features=None,
    aoi_features=None,
    extraction_query_table=None,
    inclusion_exclusion_table=None,
) -> Result1[str | Layer]:
    """GenerateAviationCartographicFeatures_aviation(source_target_carto_features;source_target_carto_features..., aoi_features, {extraction_query_table}, {inclusion_exclusion_table})

       Creates cartographic features based on the area of interest (AOI) in
       which they're located.

    INPUTS:
     source_target_carto_features (Value Table):
         Associates source feature classes with the cartographic feature
         classes in which they will be generating features.The first row is the
         source feature class that features will be copied
         from, and the second row is the target cartographic feature class that
         features will be copied to.
     aoi_features (Feature Layer):
         A layer of AOI polygon features that will be used to spatially filter
         source features.
     extraction_query_table {Table View}:
         A table of where clauses that will be used to further filter source
         features based on an attribute query.
     inclusion_exclusion_table {Table View}:
         A table identifying manually included or excluded source features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateAviationCartographicFeatures_aviation(
                *gp_fixargs(
                    (source_target_carto_features, aoi_features, extraction_query_table, inclusion_exclusion_table),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateChangeoverPoints_aviation", None)
def GenerateChangeoverPoints(
    in_features=None,
    target_changeover_features=None,
    distance_source_type: Literal["POINT", "ROUTE"] | None = None,
) -> Result1[str | Layer]:
    """GenerateChangeoverPoints_aviation(in_features, target_changeover_features, distance_source_type)

       Creates changeover points along routes.

    INPUTS:
     in_features (Feature Layer):
         The input feature class of routes on which changeover points are
         based. It must contain polyline features.
     target_changeover_features (Feature Layer):
         The point feature class that contains the changeover points. After
         running the tool, new changeover points are added and existing
         changeover points are updated.
     distance_source_type (String):
         Specifies the source of the changeover distance value.ROUTE-The
         changeover distances are stored in the source line
         layer.POINT-The changeover distances are stored in the target point
         layer."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateChangeoverPoints_aviation(
                *gp_fixargs((in_features, target_changeover_features, distance_source_type), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateDerivedAirspaceGeometry_aviation", None)
def GenerateDerivedAirspaceGeometry(
    in_airspace_features=None,
    airspace_association_table=None,
    airspace_part_features=None,
) -> Result1[str | Layer]:
    """GenerateDerivedAirspaceGeometry_aviation(in_airspace_features, airspace_association_table, {airspace_part_features})

       Generates airspace geometry for associated airspace features from an
       imported AIXM 5.1 message.

    INPUTS:
     in_airspace_features (Feature Layer):
         The input polygon feature class containing three or more airspace
         features, some or all of which will be used to derive more complex
         airspace features. The derived features will be updated in this input
         feature class.
     airspace_association_table (Table View):
         The input table containing information about the geometric
         associations between two or more airspace features. The airspace
         relationship information stored in this table is populated through the
         AIXM import process.
     airspace_part_features {Feature Layer}:
         The feature class that will be updated with airspace features derived
         from the in_airspace_features parameter."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateDerivedAirspaceGeometry_aviation(
                *gp_fixargs((in_airspace_features, airspace_association_table, airspace_part_features), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateSummaryTableData_aviation", None)
def GenerateSummaryTableData(
    target_geodatabase=None,
    in_preferences=None,
    in_charts_table=None,
) -> Result1[str]:
    """GenerateSummaryTableData_aviation(target_geodatabase, in_preferences;in_preferences..., in_charts_table)

       Collects information from a source cartographic feature class and
       related tables in an aviation charting database (AIS) and outputs the
       resulting information to a stand-alone table.

    INPUTS:
     target_geodatabase (Workspace):
         The Aviation charting schema geodatabase.
     in_preferences (String):
         The preferences stored in the database that control how, and for which
         charts, summary table information will be generated.
     in_charts_table (Table View):
         The table or polygon feature class that defines chart areas for
         tabulation. If a table view or layer view is input, its definition
         query will be honored."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateSummaryTableData_aviation(
                *gp_fixargs((target_geodatabase, in_preferences, in_charts_table), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GroupRouteSegments_aviation", None)
def GroupRouteSegments(
    target_atsroute_features=None,
    target_enroute_table=None,
    target_routeportion_table=None,
    in_association_table=None,
) -> Result3[str | Layer, str | Layer, str | Layer]:
    """GroupRouteSegments_aviation(target_atsroute_features, target_enroute_table, target_routeportion_table, in_association_table)

       Derives additional cumulative information, such as the total distance
       of a route or route portion from individual segments, to prepare data
       for charting.

    INPUTS:
     target_atsroute_features (Feature Layer):
         The input feature class for the ATSRoute feature class that
         contains polylines. Theand theattributes will be updated.
         Enrouteinformation_IdRoutePortion_Id
     target_enroute_table (Table View):
         The table that will be updated to contain entries for the en
         route segments identified during processing. Theattribute is set to
         the total length of the en route segments. Distance_Val
         Theattribute is updated and kept up to date on new and
         existing en route segments. Distance_Val
     target_routeportion_table (Table View):
         The table that will be updated to contain entries for the
         route portions identified during processing. Theattribute is set to
         the total length of the route portions' segments. The route
         portions'andattributes will also be updated to refer to the start and
         end point of a route portion.
         Distance_ValStartPoint_IdEndPoint_Id
     in_association_table (Table View):
         The association table, DesigPoint_NavaidAssoc, that contains
         the relationships between designated points and NAVAID systems. The
         ATSRoute feature class's start and end designated point'sfield will
         reference entries in this table. This table indicates whether a point
         is collocated with a NAVAID and helps determine the grouping of route
         segments. GFID"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GroupRouteSegments_aviation(
                *gp_fixargs(
                    (target_atsroute_features, target_enroute_table, target_routeportion_table, in_association_table),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PrepareAviationData_aviation", None)
def PrepareAviationData(
    target_gdb=None,
    config_file=None,
    in_dataset_names=None,
    aoi_features=None,
) -> Result1[str]:
    """PrepareAviationData_aviation(target_gdb, config_file, {in_dataset_names;in_dataset_names...}, {aoi_features})

       Migrates attributes from main aviation data to their cartographic
       features based on specific JSON scripts. These attributes are used for
       labeling and symbolizing cartographic features. Attributes defined in
       the JSON will be copied from their locations in the main feature
       classes and formatted into output attributes also defined in the JSON.

    INPUTS:
     target_gdb (Workspace):
         The ArcGIS Aviation Charting schema workspace on which the evaluation
         will be run.
     config_file (File):
         The .json file containing the evaluation criteria.
     in_dataset_names {String}:
         The names of the tables and feature classes that will be evaluated.
     aoi_features {Feature Layer}:
         An area of interest polygon layer that will be used to spatially
         filter source features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PrepareAviationData_aviation(
                *gp_fixargs((target_gdb, config_file, in_dataset_names, aoi_features), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ProcessAirTrafficServiceRoutes_aviation", None)
def ProcessAirTrafficServiceRoutes(
    in_route_features=None,
    target_carto_route_features=None,
    aoi_features=None,
    preference_table=None,
    preference=None,
) -> Result1[str | Layer]:
    """ProcessAirTrafficServiceRoutes_aviation(in_route_features, target_carto_route_features, aoi_features, preference_table, preference)

       Identifies overlapping Air Traffic Service (ATS) routes and calculates
       fields in the Target Cartographic Route Features to aid in
       cartographic display.

    INPUTS:
     in_route_features (Feature Layer):
         The polyline feature layer containing ATS route data. This data will
         be used to update features in the target_carto_route_features
         parameter value.
     target_carto_route_features (Feature Layer):
         The cartographic feature layer containing ATS routes. The attributes
         of these features will be modified to simplify the display of
         overlapping routes.
     aoi_features (Feature Layer):
         The polygon feature class containing AOI features.
     preference_table (Table View):
         The table of preferences that control how ATS routes will be
         processed.
     preference (String):
         The name of a preference from the preference_table parameter. The
         preference controls how ATS routes will be processed."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ProcessAirTrafficServiceRoutes_aviation(
                *gp_fixargs(
                    (in_route_features, target_carto_route_features, aoi_features, preference_table, preference), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ReportAviationChartChanges_aviation", None)
def ReportAviationChartChanges(
    aviation_workspace=None,
    base_version=None,
    comparison_version=None,
    report_preference=None,
    report_name=None,
    aoi_features=None,
    pad_config_file=None,
) -> Result1[str]:
    """ReportAviationChartChanges_aviation(aviation_workspace, base_version, comparison_version, report_preference, report_name, {aoi_features}, {pad_config_file;pad_config_file...})

       Compares feature classes in two enterprise geodatabase versions and
       returns the differences in a report. You can filter the reported
       changes to determine which charts are affected by the differing data
       sources. You can set filters based on areas of interest (AOI),
       definition queries, and Report Chart Changes preferences.

    INPUTS:
     aviation_workspace (Workspace):
         The versioned enterprise ArcGIS Aviation Charting AIS geodatabase. The
         workspace cannot be a file geodatabase.
     base_version (String):
         The version of the ArcGIS Aviation Charting AIS geodatabase that will
         be compared.
     comparison_version (String):
         The version of the ArcGIS Aviation Charting AIS geodatabase that will
         be compared to the base_version parameter value.
     report_preference (String):
         The Report Chart Changes preference setting from the preference table.
         This preference will define which feature classes will be included in
         the report.
     report_name (String):
         The unique name of the report, containing changes between the
         geodatabase versions.
     aoi_features {Feature Layer}:
         The boundary within which the features will be processed.
     pad_config_file {File}:
         The .json files containing the evaluation criteria from the Prepare
         Aviation Data tool."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ReportAviationChartChanges_aviation(
                *gp_fixargs(
                    (
                        aviation_workspace,
                        base_version,
                        comparison_version,
                        report_preference,
                        report_name,
                        aoi_features,
                        pad_config_file,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Charting\Layout toolset
@gptooldoc("GenerateAviationChartLeads_aviation", None)
def GenerateAviationChartLeads(
    in_layout=None,
    in_mapframe=None,
    in_preferences_table=None,
    preference=None,
) -> Result1[str]:
    """GenerateAviationChartLeads_aviation(in_layout, in_mapframe, in_preferences_table, preference)

       Creates text graphics at intersection points between a map frame
       boundary and line features.

    INPUTS:
     in_layout (Layout):
         The target layout that contains the map frame for which chart leads
         will be generated.
     in_mapframe (String):
         The map frame for which chart leads will be generated.
     in_preferences_table (Table View):
         The table of preferences that controls how the chart leads will be
         calculated and placed.
     preference (String):
         The list of preferences determined from the in_preferences_table
         parameter."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateAviationChartLeads_aviation(
                *gp_fixargs((in_layout, in_mapframe, in_preferences_table, preference), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
