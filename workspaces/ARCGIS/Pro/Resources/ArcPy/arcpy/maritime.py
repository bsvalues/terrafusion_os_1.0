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
r"""The Maritime toolbox contains tools that manage S-57, S-100, VPF,
paper charting, and bathymetric data."""
from __future__ import annotations

__all__ = [
    "ApplyMaritimeSymbology",
    "ConvertS57ToS101",
    "CopyS57Features",
    "CreateS57ExchangeSet",
    "ExpandCollapsedContours",
    "ExportGeodatabaseToS57",
    "ExportGeodatabaseToVPF",
    "ExportS101Cell",
    "GenerateCartographicLimits",
    "GenerateDepthAreas",
    "GenerateLandAreas",
    "GenerateLightSector",
    "ImportS100Cell",
    "ImportS100FeatureCatalogue",
    "ImportS57ToGeodatabase",
    "ImportVPFToGeodatabase",
    "ParseS58LogFile",
    "ReducePointDensity",
    "RepairNauticalData",
    "SmoothBathymetricTIN",
    "TransferQualityOfPosition",
    "ValidateS57File",
]
__alias__ = "maritime"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Cartography toolset
@gptooldoc("ApplyMaritimeSymbology_maritime", None)
def ApplyMaritimeSymbology(
    target_features=None,
    cxml_file=None,
) -> Result1[str | Layer]:
    """ApplyMaritimeSymbology_maritime(target_features;target_features..., cxml_file)

       Applies maritime paper chart symbols to layers based on a CXML format
       file that contains rules.

    INPUTS:
     target_features (Feature Class / Feature Layer):
         The input point, line, or polygon features.
     cxml_file (File):
         The .cxml file that contains rules for applying symbology."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyMaritimeSymbology_maritime(*gp_fixargs((target_features, cxml_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateCartographicLimits_maritime", None)
def GenerateCartographicLimits(
    input_polygons=None,
    erase_features=None,
    target_feature_class=None,
) -> Result1[str | Layer]:
    """GenerateCartographicLimits_maritime(input_polygons, erase_features;erase_features..., target_feature_class)

       Converts polygon features to polylines and removes all segments
       coincident with the erase features.

    INPUTS:
     input_polygons (Feature Layer):
         The polygon features that will be converted to polylines to create
         feature outlines where they are not coincident with the erase_features
         parameter value.
     erase_features (Feature Layer):
         The polyline features that will be used to identify coincident
         features in the input_polygons parameter value that will be removed
         from the target_feature_class parameter value.
     target_feature_class (Feature Layer):
         The feature class containing the cartographic limit features that will
         be converted."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateCartographicLimits_maritime(
                *gp_fixargs((input_polygons, erase_features, target_feature_class), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateLightSector_maritime", None)
def GenerateLightSector(
    in_features=None,
    sector_line_length=None,
    sector_arc_radius=None,
    sector_unit: Literal[
        "CENTIMETERS",
        "DECIMAL_DEGREES",
        "DECIMETERS",
        "FEET",
        "INCHES",
        "KILOMETERS",
        "METERS",
        "MILLIMETERS",
        "NAUTICAL_MILES",
        "POINTS",
        "YARDS",
    ]
    | None = None,
    reference_scale=None,
    coordinate_system=None,
) -> Result1[str]:
    """GenerateLightSector_maritime(in_features, sector_line_length, sector_arc_radius, sector_unit, {reference_scale}, {coordinate_system})

       Creates navigational light sector lines and arcs based on attributes
       in a specified point feature class.

    INPUTS:
     in_features (Feature Layer):
         The feature class that contains the light features.
     sector_line_length (Double / Field):
         The length of the boundary lines for the light sector. This is the
         line that appears on the chart. The value for the line length can be
         populated based on a specified value or from a field.Double-The line
         length will be determined by the specified value.
         Field-The line length will be determined by an appropriate
         field you are using for the line sectors. One field that can be used
         is. Value of Nominal Range (VALNMR)
     sector_arc_radius (Double / Field):
         The value that represents where the radius for the line sectors will
         be generated in relation to the light. The arc falls between two
         boundaries of the light sector. The radius is generated at a distance
         from the light sector using the units of measurement you select. You
         can specify a value for the radius or choose a field in the feature
         class that contains the radius values.Double-The radius will be
         generated based on the specified
         value.Field-The radius will be generated based on the value in the
         specified
         field.
     sector_unit (String):
         Specifies the unit of measurement that will be used for the radius arc
         that extends between the two light sector boundaries.To use page
         units, the map must be projected and the reference scale
         must be set.CENTIMETERS-The page units will be
         centimeters.DECIMAL_DEGREES-The map
         units will be decimal degrees.DECIMETERS-The map units will be
         decimeters.FEET-The map units will be feet.INCHES-The page units will
         be inches.KILOMETERS-The map units will be kilometers.METERS-The map
         units will be meters.MILLIMETERS-The page units will be
         millimeters.NAUTICAL_MILES-The map units will be nautical
         miles.POINTS-The page units will be points.YARDS-The map units will be
         yards.
     reference_scale {Long}:
         The scale at which the features will be generated when using page
         units.
     coordinate_system {Coordinate System}:
         The coordinate system that will be used when creating the output
         features. The default is the current map coordinate system."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateLightSector_maritime(
                *gp_fixargs(
                    (
                        in_features,
                        sector_line_length,
                        sector_arc_radius,
                        sector_unit,
                        reference_scale,
                        coordinate_system,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TransferQualityOfPosition_maritime", None)
def TransferQualityOfPosition(
    in_geodatabase=None,
    unverified_features_only: Literal["UNVERIFIED_FEATURES", "ALL_FEATURES"] | None = None,
) -> Result1[str]:
    """TransferQualityOfPosition_maritime(in_geodatabase, {unverified_features_only})

       Transfers the Quality of Position (QUAPOS) attribution from S-57 edge
       primitives (captured in PLTS_SpatialAttributeL) to the feature to aid
       in symbolization dependent on this attribute.

    INPUTS:
     in_geodatabase (Workspace):
         The input geodatabase that contains the chart data in the maritime
         chart schema.
     unverified_features_only {Boolean}:
         Specifies whether only features marked as unverified will be
         processed.UNVERIFIED_FEATURES-Only features marked as unverified will
         be
         processed.ALL_FEATURES-All features will be processed. This is the
         default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TransferQualityOfPosition_maritime(*gp_fixargs((in_geodatabase, unverified_features_only), True))
        )
        return retval
    except Exception as e:
        raise e


# Data Management toolset
@gptooldoc("ExpandCollapsedContours_maritime", None)
def ExpandCollapsedContours(
    target_contours=None,
    expansion_distance=None,
) -> Result1[str | Layer]:
    """ExpandCollapsedContours_maritime(target_contours, expansion_distance)

       Expands (pulls apart) contour lines that are snapped together. This
       preserves representative depth areas.

    INPUTS:
     target_contours (Feature Layer):
         The feature class containing the contours to be expanded.
     expansion_distance (Double):
         The distance that contours will be expanded based on the coordinate
         system of the target contours. The default is 5e-7 decimal degrees
         based on the WGS84 geographic coordinate system."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExpandCollapsedContours_maritime(*gp_fixargs((target_contours, expansion_distance), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateDepthAreas_maritime", None)
def GenerateDepthAreas(
    in_tin=None,
    in_contours=None,
    contour_depth_field=None,
    depth_direction: Literal["POSITIVE_UP", "POSITIVE_DOWN"] | None = None,
    target_workspace=None,
    min_depth=None,
    max_depth=None,
    in_extent_polygon=None,
) -> Result1[str | Layer]:
    """GenerateDepthAreas_maritime(in_tin, in_contours, contour_depth_field, depth_direction, target_workspace, min_depth, max_depth, {in_extent_polygon})

       Creates depth area polygon features using a TIN to query depth
       information to find whether a closed contour is trending deeper or
       shallower.

    INPUTS:
     in_tin (TIN Layer):
         The TIN surface from which the nodes will be queried to attribute the
         depth polygons. It is recommended that you use the same TIN surface
         that was used to generate the contours.
     in_contours (Feature Layer):
         The depth contours features.
     contour_depth_field (Field):
         The field that will store the depth value in the depth contours
         feature.
     depth_direction (String):
         Specifies whether the depth direction is positive upward or positive
         downward. The direction must be the same as that of the input TIN and
         contour features for the values of the minimum and maximum depth for
         the generated depth area polygons to be accurate.POSITIVE_UP-The input
         contour, maximum depth, and minimum depth values
         must be negative with drying heights as positive. This is the
         default.POSITIVE_DOWN-The input contour, maximum depth, and minimum
         depth
         values must be positive with drying heights as negative.
     target_workspace (Workspace):
         The geodatabase where the depth polygons will be written. The
         workspace is expected to be a nautical workspace with either the S-57
         or S-101 schema.
     min_depth (Double):
         A value used to populate the minimum depth of polygons shallower than
         the shallowest contour value.
     max_depth (Double):
         A value used to populate the maximum depth of polygons deeper than the
         deepest contour value.
     in_extent_polygon {Feature Layer}:
         The extent polygons within which the depth area polygons will be
         generated. If not specified, the TIN domain will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateDepthAreas_maritime(
                *gp_fixargs(
                    (
                        in_tin,
                        in_contours,
                        contour_depth_field,
                        depth_direction,
                        target_workspace,
                        min_depth,
                        max_depth,
                        in_extent_polygon,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateLandAreas_maritime", None)
def GenerateLandAreas(
    in_workspace=None,
    target_workspace=None,
    in_extent_polygon=None,
    in_configuration_file=None,
) -> Result1[str | Layer]:
    """GenerateLandAreas_maritime(in_workspace, target_workspace, in_extent_polygon, {in_configuration_file})

       Creates land area polygon features by identifying existing land
       topology features, such as coastline and shoreline construction, and
       eliminating any polygons over water or other exclusionary features. An
       area of interest is specified to limit the processing area.

    INPUTS:
     in_workspace (Workspace):
         The workspace containing a Maritime product schema (S-57 or S-101
         based) in which existing land topology features, such as coastline and
         shoreline construction, will be processed to identify the land areas
         that will be created.
     target_workspace (Workspace):
         The workspace that will contain the land area polygons that are
         created. The workspace must be a Nautical workspace with S-57 or S-101
         schema. For S-57 schema, the workspace should have a NaturalFeaturesA
         polygon feature class with a LNDARE_LandArea subtype. For S-101
         schema, the workspace should have a LandArea_A polygon feature class.
     in_extent_polygon (Feature Layer):
         The extent polygon in which the land area polygons will be generated.
     in_configuration_file {File}:
         The location of an .xml configuration file that lists the feature
         classes that will participate in defining the land topology edges and
         the feature classes that indicate areas where land should not exist.
         If not specified, the default GenerateLandAreasSettings.xml
         configuration file will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateLandAreas_maritime(
                *gp_fixargs((in_workspace, target_workspace, in_extent_polygon, in_configuration_file), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ReducePointDensity_maritime", None)
def ReducePointDensity(
    in_features=None,
    out_feature_class=None,
    depth_field=None,
    depth_direction: Literal["POSITIVE_UP", "POSITIVE_DOWN"] | None = None,
    depth_bias: Literal["SHALLOW_BIASED", "DEEP_BIASED"] | None = None,
    radius_unit: Literal[
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
    ]
    | None = None,
    start_thinning_radius=None,
    end_thinning_radius=None,
    start_depth=None,
    end_depth=None,
) -> Result1[str]:
    """ReducePointDensity_maritime(in_features, out_feature_class, depth_field, depth_direction, depth_bias, radius_unit, start_thinning_radius, {end_thinning_radius}, {start_depth}, {end_depth})

       Thins points from a point or multipoint feature class.

    INPUTS:
     in_features (Feature Layer):
         The input point or multipoint features.
     depth_field (Field):
         The field where the depth is stored. It is either a numeric
         field or the shape field specified in in_features. For
         multipoint features, this must be the shape field.
     depth_direction (String):
         Specifies how the depth value will be captured in the depth field of
         the input features.POSITIVE_UP-Depth values will be positive above the
         surface and
         negative below the surface. This is default.POSITIVE_DOWN-Depth values
         will be positive below the surface and
         negative above the surface.
     depth_bias (String):
         Specifies the bias that will be used to select the depths to be
         retained.SHALLOW_BIASED-Shallow bias will be used for depth. This is
         default.DEEP_BIASED-Deep bias will be used for depth.
     radius_unit (String):
         Specifies the unit of measure that will be used by the
         start_thinning_radius and end_thinning_radius
         parameters.KILOMETERS-The radius unit will be kilometers.METERS-The
         radius unit
         will be meters. This is default.DECIMETERS-The radius unit will be
         decimeters.CENTIMETERS-The radius unit will be
         centimeters.MILLIMETERS-The radius unit will be
         millimeters.NAUTICAL_MILES-The radius unit will be nautical
         miles.MILES-The radius unit will be miles.YARDS-The radius unit will
         be yards.FEET-The radius unit will be feet.INCHES-The radius unit will
         be inches.DECIMAL_DEGREES-The radius unit will be decimal
         degrees.POINTS-The radius unit will be points.
     start_thinning_radius (Double):
         The beginning radius that will be used to remove or thin points
         relative to each other.
     end_thinning_radius {Double}:
         The end radius that will be used to remove or thin points relative to
         each other. The thinning radius will dynamically change as the
         algorithm progresses through the range of depth values.
     start_depth {Double}:
         The depth that will be used to begin the thinning algorithm. Depth
         values that appear before this depth based on the depth_direction
         parameter value will be ignored.
     end_depth {Double}:
         The depth that will be used to end the thinning algorithm. Depth
         values that appear after this depth based on the depth_direction
         parameter value will be ignored.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ReducePointDensity_maritime(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        depth_field,
                        depth_direction,
                        depth_bias,
                        radius_unit,
                        start_thinning_radius,
                        end_thinning_radius,
                        start_depth,
                        end_depth,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SmoothBathymetricTIN_maritime", None)
def SmoothBathymetricTIN(
    in_tin=None,
    out_tin=None,
    depth_direction: Literal["POSITIVE_UP", "POSITIVE_DOWN"] | None = None,
    smoothing_iterations=None,
) -> Result1[str]:
    """SmoothBathymetricTIN_maritime(in_tin, out_tin, depth_direction, smoothing_iterations)

       Smooths a triangulated irregular network (TIN) dataset in a manner
       that strictly preserves a shallow bias.

    INPUTS:
     in_tin (TIN Layer):
         The input TIN that will be smoothed with a shallow bias.
     depth_direction (String):
         Specifies how the depth will be captured in the input
         TIN.POSITIVE_UP-The depth will be captured in the input TIN. This is
         default.POSITIVE_DOWN-The downward depth will be captured in the input
         TIN.
     smoothing_iterations (Long):
         The number of smoothing passes that will be performed over the TIN.

    OUTPUTS:
     out_tin (TIN):
         The output smoothed TIN."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SmoothBathymetricTIN_maritime(
                *gp_fixargs((in_tin, out_tin, depth_direction, smoothing_iterations), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# S-100 toolset
@gptooldoc("ConvertS57ToS101_maritime", None)
def ConvertS57ToS101(
    in_feature_catalogue=None,
    in_config_file=None,
    input_s57=None,
    out_location=None,
) -> Result1[str]:
    """ConvertS57ToS101_maritime(in_feature_catalogue, in_config_file, input_s57, out_location)

       Converts the S-57 vector product for storing nautical charting data to
       the new vector S-101 format.

    INPUTS:
     in_feature_catalogue (File):
         An .xml file that follows the S-100 Feature Catalogue format as
         defined by the IHO. It describes the content of a data product and its
         specifications. The default file location for S-100 catalogue files is
         <installation location>\\ArcGIS Maritime\\Product
         Files\\<version>\\S-101\\, provided the Maritime product files are
         installed.
     in_config_file (File):
         The input .xml file that can be used to customize some aspects of the
         conversion process.
     input_s57 (File / Folder):
         The input S-57 file with a .000 extension or a CATALOG.031 file that
         references a collection of S-57 files.
     out_location (Folder):
         The directory where the converted cell will be written."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConvertS57ToS101_maritime(
                *gp_fixargs((in_feature_catalogue, in_config_file, input_s57, out_location), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportS101Cell_maritime", None)
def ExportS101Cell(
    in_feature_catalogue=None,
    in_s101_workspace=None,
    product=None,
    export_type: Literal["NEW_EDITION"] | None = None,
    output_location=None,
) -> Result1[str]:
    """ExportS101Cell_maritime(in_feature_catalogue, in_s101_workspace, product, export_type, output_location)

       Exports S-101 hydrographic data from a geodatabase to an S-101 file.

    INPUTS:
     in_feature_catalogue (File):
         An .xml file that follows the S-100 Feature Catalogue format as
         defined by the IHO. It describes the content of a data product and its
         specifications. The default file location for S-100 catalogue files is
         <installation location>\\ArcGIS Maritime\\Product
         Files\\<version>\\S-101\\, provided the Maritime product files are
         installed.
     in_s101_workspace (Workspace):
         The workspace that contains the product.
     product (String):
         The name of the product that will be exported.This information must
         exist in the ProductCoverage feature class and
         ProductDefinition table before using this tool.
     export_type (String):
         The type of file that will be created during export.NEW_EDITION-A new
         edition of a dataset, including new information that
         has not been previously distributed by updates. This is the default.
     output_location (Folder):
         The location where the export package will be written."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportS101Cell_maritime(
                *gp_fixargs((in_feature_catalogue, in_s101_workspace, product, export_type, output_location), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportS100Cell_maritime", None)
def ImportS100Cell(
    in_feature_catalogue=None,
    in_base_cell=None,
    target_workspace=None,
    in_update_cells=None,
) -> Result1[str]:
    """ImportS100Cell_maritime(in_feature_catalogue, in_base_cell, target_workspace, {in_update_cells;in_update_cells...})

       Imports S-100 hydrographic data into a geodatabase created from a
       related S-100 Feature Catalogue.

    INPUTS:
     in_feature_catalogue (File):
         An .xml file that follows the S-100 Feature Catalogue format as
         defined by the IHO. It describes the content of a data product and its
         specifications. The default file location for S-100 catalogue files is
         <installation location>\\ArcGIS Maritime\\Product
         Files\\<version>\\S-101\\, provided the Maritime product files are
         installed.
     in_base_cell (File):
         The data contained in a base file in S-100 format.
     target_workspace (Workspace):
         The geodatabase to which all output data will be written.
     in_update_cells {File}:
         The data that will be updated in a base file in S-100 format."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportS100Cell_maritime(
                *gp_fixargs((in_feature_catalogue, in_base_cell, target_workspace, in_update_cells), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportS100FeatureCatalogue_maritime", None)
def ImportS100FeatureCatalogue(
    in_feature_catalogue=None,
    target_workspace=None,
    admin_connection=None,
    coordinate_system=None,
    subtype_mapping=None,
    config_keyword=None,
) -> Result1[str]:
    """ImportS100FeatureCatalogue_maritime(in_feature_catalogue, target_workspace, {admin_connection}, {coordinate_system}, {subtype_mapping}, {config_keyword})

       Imports the contents of an S-100 feature catalogue to an existing
       geodatabase. A feature catalogue is an XML document that describes the
       content of a data product.

    INPUTS:
     in_feature_catalogue (File):
         An .xml file that follows the S-100 Feature Catalogue format as
         defined by the IHO. It describes the content of a data product and its
         specifications. The default file location for S-100 catalogue files is
         <installation location>\\ArcGIS Maritime\\Product
         Files\\<version>\\S-101\\, provided the Maritime product files are
         installed.
     target_workspace (Workspace):
         The geodatabase to which the schema will be written.
     admin_connection {File}:
         This parameter is no longer supported. It remains only for the
         backward compatibility of scripts and models but is not essential to
         the tool operation.
     coordinate_system {Coordinate System}:
         The coordinate system of the output workspace. The default is WGS84.
     subtype_mapping {File}:
         The subtype mapping .xml file used to specify feature classes that
         each S-100 feature will be subtyped in. If no parameter value is
         specified, the created data model will have separate feature classes
         for each S-100 object type. For S-101, it is recommended that you use
         the S-101FeatureClassMap.xml file. The default file location is
         C:/<ArcGIS Pro installation location>\\Pro\\Resources\\Maritime.
     config_keyword {String}:
         The configuration keyword applies to enterprise geodatabases data
         only. It determines the storage parameters of the database table."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportS100FeatureCatalogue_maritime(
                *gp_fixargs(
                    (
                        in_feature_catalogue,
                        target_workspace,
                        admin_connection,
                        coordinate_system,
                        subtype_mapping,
                        config_keyword,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# S-57\Management toolset
@gptooldoc("CopyS57Features_maritime", None)
def CopyS57Features(
    in_features=None,
    target_workspace=None,
    compilation_scale=None,
) -> Result1[str]:
    """CopyS57Features_maritime(in_features;in_features..., target_workspace, {compilation_scale})

       Copies features from a layer or multiple layers to a target
       geodatabase.

    INPUTS:
     in_features (Feature Layer):
         The input features that will be copied to the target_workspace
         parameter value.
     target_workspace (Workspace):
         The geodatabase to which the output data will be written.
     compilation_scale {Long}:
         The compilation scale attribute value that will be applied to the
         copied features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CopyS57Features_maritime(*gp_fixargs((in_features, target_workspace, compilation_scale), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateS57ExchangeSet_maritime", None)
def CreateS57ExchangeSet(
    in_directories=None,
    out_directory=None,
    layout_format: Literal["VERSION_LAYOUT", "PRODUCT_LAYOUT", "FLAT_LAYOUT"] | None = None,
    updates_only: Literal["INCLUDE_ONLY_UPDATES", "INCLUDE_ALL"] | None = None,
    lfil_file=None,
) -> Result1[str]:
    """CreateS57ExchangeSet_maritime(in_directories;in_directories..., out_directory, {layout_format}, {updates_only}, {lfil_file})

       Allows a mariner to view the Electronic Navigational Chart (ENC)
       datasets in an Electronic Chart Display and Information System (ECDIS)
       for shipboard navigation.

    INPUTS:
     in_directories (Folder):
         Folders that contain at least one S-57 base cell (*.000) and,
         optionally, any of the following:        S-57 update
         datasetsREADME.txt fileAny referenced files in the S-57
         cells (*.txt, *.tif, and *.jpg)
     out_directory (Folder):
         The location of an empty folder where the ENC_ROOT folder will be
         written. The folder must be empty for the tool to run successfully.
     layout_format {String}:
         Specifies the directory and folder structure of the exchange
         set.VERSION_LAYOUT-The exchange set will be written in the format
         ENC_ROOT\\CATALOG.031, ENC_ROOT\\<Agency>\\<ProductName>\\<MajorEdition>\\<
         MinorEdition>\\<S57Product>, <Referenced Files>. This is the
         default.PRODUCT_LAYOUT-The exchange set will be written in the format
         ENC_ROOT\\CATALOG.031, ENC_ROOT\\<ProductName>\\<S57Product>, <Referenced
         Files>.FLAT_LAYOUT-The exchange set will be written in the format
         ENC_ROOT\\CATALOG.031, <S57Product(s)>, <Referenced Files>.
     updates_only {Boolean}:
         Specifies how S-57 update datasets in the input folder will be
         processed.INCLUDE_ALL-The output exchange set will include the S-57
         base dataset
         and any updates. This is the default.INCLUDE_ONLY_UPDATES-The output
         exchange set will include all the
         updates but not the S-57 base dataset. If there are no updates, the
         output will include the S-57 base dataset.
     lfil_file {File}:
         A text file that will be used to match file names in the output
         exchange set to the long file descriptions populated on the catalog
         file records."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateS57ExchangeSet_maritime(
                *gp_fixargs((in_directories, out_directory, layout_format, updates_only, lfil_file), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportGeodatabaseToS57_maritime", None)
def ExportGeodatabaseToS57(
    in_source_gdb=None,
    product=None,
    export_type: Literal["NEW_DATASET", "NEW_EDITION", "UPDATE", "REISSUE", "CANCEL"] | None = None,
    out_location=None,
    in_product_config=None,
    clip_data_option: Literal["CLIP", "DO_NOT_CLIP"] | None = None,
    sample_export: Literal["SAMPLE_EXPORT", "OFFICIAL_EXPORT"] | None = None,
    in_scamin_file=None,
    in_feature_catalogue=None,
) -> Result1[str]:
    """ExportGeodatabaseToS57_maritime(in_source_gdb, product, export_type, out_location, {in_product_config}, {clip_data_option}, {sample_export}, {in_scamin_file}, {in_feature_catalogue})

       Exports hydrographic data from an ArcGIS Maritime geodatabase to an
       S-57 file.

    INPUTS:
     in_source_gdb (Workspace):
         The database from which the product will be exported.
     product (String):
         The name of the product that will be exported. This product metadata
         entry must exist in the ProductDefinitions table, and the related
         extents must be present in the ProductCoverage feature class in the
         workspace.
     export_type (String):
         Specifies the type of file that will be created during
         export.NEW_DATASET-A new dataset including information that has not
         been
         previously distributed by updates will be created.NEW_EDITION-A new
         edition of a dataset including information that has
         not been previously distributed by updates will be created.UPDATE-
         Changes to a dataset since the last export will be reflected
         in the file.REISSUE-A reissue of a dataset including all the updates
         applied to
         the original dataset up to the date of reissue will be created. A
         reissue does not contain information that has not been previously
         issued by updates. CANCEL-When a dataset is deleted, an
         updated cell file is
         created containing only the Dataset General Information record with
         thefield. In this case, thesubfield must be set to 0. Dataset
         Identifier (DSID)Edition Number (EDTN)
     out_location (Folder):
         The location containing the output export package.
     in_product_config {File}:
         The configuration file that will be used to export the product.
     clip_data_option {Boolean}:
         Specifies whether the export process will clip data that crosses an
         M_CSCL feature.CLIP-Features in the source database that cross the
         boundary of an
         M_CSCL feature will be clipped to the boundary in the exported
         file.DO_NOT_CLIP-Features in the source database that cross the
         boundary
         of an M_CSCL feature will not be clipped to the boundary in the
         exported file. The features will remain intact in the output. This is
         the default.
     sample_export {Boolean}:
         Specifies whether the product will be exported as a
         sample.SAMPLE_EXPORT-The exported cell is not stored in the
         ProductExports
         table and the metadata information will not be updated in the
         ProductDefinitions table.OFFICIAL_EXPORT-The exported cell is stored
         in the ProductExports
         table as a BLOB, and the edition, update, and other metadata in the
         ProductDefinitions table will be updated. This is the default.
     in_scamin_file {File}:
         A custom configuration file that contains the rules for calculating a
         feature's SCAMIN value that overrides the default value. For
         additional information, refer to Scale Minimum: Radar Range method.
     in_feature_catalogue {File}:
         An .xml file that follows the S-100 Feature Catalogue format as
         defined by the IHO. It describes the content of a data product and its
         specifications. The default file location for S-100 catalogue files is
         <installation location>\\ArcGIS Maritime\\Product
         Files\\<version>\\S-101\\, provided the Maritime product files are
         installed."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportGeodatabaseToS57_maritime(
                *gp_fixargs(
                    (
                        in_source_gdb,
                        product,
                        export_type,
                        out_location,
                        in_product_config,
                        clip_data_option,
                        sample_export,
                        in_scamin_file,
                        in_feature_catalogue,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportS57ToGeodatabase_maritime", None)
def ImportS57ToGeodatabase(
    in_base_cell=None,
    target_workspace=None,
    in_update_cells=None,
    in_product_config=None,
) -> Result1[str]:
    """ImportS57ToGeodatabase_maritime(in_base_cell, target_workspace, {in_update_cells;in_update_cells...}, {in_product_config})

       Imports an S-57 file into an ArcGIS Maritime geodatabase.

    INPUTS:
     in_base_cell (File):
         The base cell file (*.000).
     target_workspace (Workspace):
         The workspace where all the objects will be written.
     in_update_cells {File}:
         Updates cell files (*.001 - *.999).
     in_product_config {File}:
         The product configuration file that will be imported."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportS57ToGeodatabase_maritime(
                *gp_fixargs((in_base_cell, target_workspace, in_update_cells, in_product_config), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# S-57\Validation toolset
@gptooldoc("ParseS58LogFile_maritime", None)
def ParseS58LogFile(
    in_s58_log_file=None,
    in_s57_file=None,
    in_production_database_workspace=None,
    in_reviewer_workspace=None,
    reviewer_session=None,
    in_update_cells=None,
) -> Result1[str]:
    """ParseS58LogFile_maritime(in_s58_log_file, in_s57_file, in_production_database_workspace, in_reviewer_workspace, reviewer_session, {in_update_cells;in_update_cells...})

       Parses log files produced by the Validate S-57 File tool and third-
       party validation software against S-58 (recommended ENC validation
       checks). Critical errors and warnings are imported as records in a
       Data Reviewer table.

    INPUTS:
     in_s58_log_file (File):
         The S-58 log file that contains validation errors. It can be an *.S58,
         *.ANL, or *.VLD file.
     in_s57_file (File):
         The base cell file (*.000) from which the validation result was
         produced. The name of the ENC cell referenced in this parameter must
         match the name of the ENC cell referenced in the validation log file.
     in_production_database_workspace (Workspace):
         The workspace to validate and correct. This workspace contains the
         data used to generate the S-57 format file.
     in_reviewer_workspace (Workspace):
         The path to the Data Reviewer workspace where the features or table
         records will be written. A Data Reviewer workspace must be created for
         each ENC product.
     reviewer_session (String):
         An existing Data Reviewer session.
     in_update_cells {File}:
         The cell files (*.001 - *.999) that will be updated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ParseS58LogFile_maritime(
                *gp_fixargs(
                    (
                        in_s58_log_file,
                        in_s57_file,
                        in_production_database_workspace,
                        in_reviewer_workspace,
                        reviewer_session,
                        in_update_cells,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RepairNauticalData_maritime", None)
def RepairNauticalData(
    in_workspace=None,
    repair_operations: list[
        Literal["FIX_LNAM", "REMOVE_ORPHAN_RELATIONSHIPS", "MOVE_EQUIPMENT_FEATURES", "NUDGE_BOUNDARY_FEATURES"]
    ]
    | Literal["FIX_LNAM", "REMOVE_ORPHAN_RELATIONSHIPS", "MOVE_EQUIPMENT_FEATURES", "NUDGE_BOUNDARY_FEATURES"]
    | str
    | None = None,
) -> Result1[str]:
    """RepairNauticalData_maritime(in_workspace, repair_operations;repair_operations...)

       Repairs selected data processes on a database with the Nautical
       schema. Processes include repairing noncollocated structure-equipment
       features, deleting detached FREL and COLLECTIONS records, resolving
       blank or duplicate LNAM attribute values, and nudging point or line
       features that fall exactly at the cell or MetaDataA (M_CSCL)
       boundaries.

    INPUTS:
     in_workspace (Workspace):
         The file or enterprise geodatabase that will be repaired.
     repair_operations (String):
         Specifies the repair process that will be used.
         FIX_LNAM-Records with a blankattribute will be resolved by
         populating the records with a validvalue, and duplicateattribute
         conflicts will be resolved with a newvalue provided to one of the
         records. LNAMLNAMLNAMLNAMREMOVE_ORPHAN_RELATIONSHIPS-Detached
         structure or equipment and
         collections records will be removed from the PLTS_FREL and
         PLTS_COLLECTIONS tables.MOVE_EQUIPMENT_FEATURES-Point equipment
         features that are not
         coincident with point structure features will be identified and moved
         to the location of the structure.NUDGE_BOUNDARY_FEATURES-If an
         adjacent cell exists with the same
         navigational purpose, point and line features that entirely intersect
         the cell boundary will be nudged 1e-7 West (if along a cell meridian)
         or 1e-7 South (if along a cell parallel). If there is no adjacent
         cell, the feature will be nudged in the opposite direction. Point and
         line features that entirely intersect the boundary of any MetaDataA
         (M_CSCL) and meet the extraction criteria will be nudged inside the
         M_CSCL feature. Point and line features that meet the ProductCoverage
         criteria will be nudged into the product."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RepairNauticalData_maritime(*gp_fixargs((in_workspace, repair_operations), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ValidateS57File_maritime", None)
def ValidateS57File(
    in_s57_file=None,
    out_directory=None,
    in_update_cells=None,
    regional_rules: Literal["BR", "EU", "RU", "US"] | None = None,
    in_ignore_list=None,
    exclude_shapefile: Literal["EXCLUDE_SHAPEFILE", "DO_NOT_EXCLUDE_SHAPEFILE"] | None = None,
) -> Result1[str]:
    """ValidateS57File_maritime(in_s57_file, out_directory, {in_update_cells;in_update_cells...}, {regional_rules}, {in_ignore_list}, {exclude_shapefile})

       Validates an ENC, IENC, or bIENC file and generates an .S58 file and a
       shapefile as a result.

    INPUTS:
     in_s57_file (File):
         The base cell file (*.000).
     out_directory (Folder):
         The location where the validated S-57 log will be created.
     in_update_cells {File}:
         The update cell files (*.001 - *.999).
     regional_rules {String}:
         Specifies the region that will be used to set the Recommended Inland
         ENC Validation Checks for that region.For IENC and bIENC cells, some
         validation rules don't apply in certain
         regions, or they check for different objects and
         attribution.BR-Brazilian validation rules will be applied.EU-European
         validation
         rules will be applied.RU-Russian Federation validation rules will be
         applied.US-United States validation rules will be applied.
     in_ignore_list {File}:
         A text file containing a list of checks to ignore in the output log
         file.
     exclude_shapefile {Boolean}:
         Specifies whether a shapefile will be generated.EXCLUDE_SHAPEFILE-A
         shapefile will not be generated. Only the .s58
         file will be created.DO_NOT_EXCLUDE_SHAPEFILE-A shapefile will be
         generated, along with the
         .s58 file. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ValidateS57File_maritime(
                *gp_fixargs(
                    (in_s57_file, out_directory, in_update_cells, regional_rules, in_ignore_list, exclude_shapefile),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# VPF toolset
@gptooldoc("ExportGeodatabaseToVPF_maritime", None)
def ExportGeodatabaseToVPF(
    in_source_gdb=None,
    ntm_date=None,
    out_location=None,
) -> Result1[str]:
    """ExportGeodatabaseToVPF_maritime(in_source_gdb;in_source_gdb..., ntm_date, out_location)

       Exports hydrographic data from maritime geodatabases to Vector Product
       Format (VPF).

    INPUTS:
     in_source_gdb (Workspace):
         The source geodatabases that will be exported.
     ntm_date (String):
         The Notice to Mariners date of the source geodatabases.
     out_location (Folder):
         The location where the export package will be written."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportGeodatabaseToVPF_maritime(*gp_fixargs((in_source_gdb, ntm_date, out_location), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportVPFToGeodatabase_maritime", None)
def ImportVPFToGeodatabase(
    in_vpf_features=None,
    target_workspace=None,
) -> Result1[str]:
    """ImportVPFToGeodatabase_maritime(in_vpf_features;in_vpf_features..., target_workspace)

       Imports Vector Product Format (VPF) data in Digital Nautical Chart
       (DNC) and Tactical Ocean Data (TOD) formats into an ArcGIS Maritime
       geodatabase. Sources that can be imported include DNC and TOD0, TOD2,
       and TOD4.

    INPUTS:
     in_vpf_features (Folder):
         The VPF data to be imported into the geodatabase from a folder that
         contains one or more libraries. Point, line, polygon, and Ecrtext
         annotation features can be imported.
     target_workspace (Workspace):
         The geodatabase to which the VPF data will be imported. This can be an
         empty template or existing geodatabase."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportVPFToGeodatabase_maritime(*gp_fixargs((in_vpf_features, target_workspace), True))
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
