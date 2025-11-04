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
r"""The 3D Analyst toolbox provides a collection of geoprocessing tools
that enable a wide variety of analytical, data management, and data
conversion operations on surface models and three-dimensional vector
data."""
from __future__ import annotations

__all__ = [
    "AddFeatureClassToTerrain",
    "AddSurfaceInformation",
    "AddTerrainPoints",
    "AddTerrainPyramidLevel",
    "AddZInformation",
    "AppendTerrainPoints",
    "ASCII3DToFeatureClass",
    "Aspect",
    "Buffer3D",
    "BuildTerrain",
    "ChangeLasClassCodes",
    "ChangeTerrainReferenceScale",
    "ChangeTerrainResolutionBounds",
    "ClassifyLasBuilding",
    "ClassifyLasByHeight",
    "ClassifyLasGround",
    "ClassifyLasNoise",
    "ClassifyLasOverlap",
    "ClassifyPointCloudUsingTrainedModel",
    "ColorizeLas",
    "ConstructSightLines",
    "Contour",
    "ContourList",
    "ContourWithBarriers",
    "CopyTin",
    "CreateTerrain",
    "CreateTin",
    "Curvature",
    "CutFill",
    "DecimateTinNodes",
    "DeleteTerrainPoints",
    "DelineateTinDataArea",
    "DetectObjectsFromPointCloudUsingTrainedModel",
    "Difference3D",
    "Divide",
    "EditTin",
    "EncloseMultiPatch",
    "EnforceRiverMonotonicity",
    "EvaluatePointCloudClassificationModel",
    "ExtractLas",
    "ExtractMultipatchFromMesh",
    "ExtractObjectsFromPointCloud",
    "ExtractPowerLinesFromPointCloud",
    "ExtractRailsFromPointCloud",
    "ExtrudeBetween",
    "FeatureClassZToASCII",
    "FeaturesFromCityEngineRules",
    "FeatureTo3DByAttribute",
    "FenceDiagram",
    "Float",
    "GenerateClearanceSurface",
    "HillShade",
    "Idw",
    "Import3DFiles",
    "Inside3D",
    "Int",
    "InterpolatePolyToPatch",
    "InterpolateShape",
    "Intersect3D",
    "Intersect3DLines",
    "Intersect3DLineWithMultiPatch",
    "Intersect3DLineWithSurface",
    "Intervisibility",
    "IsClosed3D",
    "Kriging",
    "LandXMLToTin",
    "LasBuildingMultipatch",
    "LasDatasetToTin",
    "LasHeightMetrics",
    "LasPointStatsByArea",
    "LASToMultipoint",
    "Layer3DToFeatureClass",
    "LayerToKML",
    "LineOfSight",
    "LocateLasPointsByProximity",
    "LocateOutliers",
    "Lookup",
    "MapToKML",
    "MinimumBoundingVolume",
    "Minus",
    "MultiPatchFootprint",
    "NaturalNeighbor",
    "Near3D",
    "ObserverPoints",
    "Plus",
    "PointFileInformation",
    "PolygonVolume",
    "PreparePointCloudObjectDetectionTrainingData",
    "PreparePointCloudTrainingData",
    "RasterDomain",
    "RasterTin",
    "RasterToMultipoint",
    "ReclassByASCIIFile",
    "ReclassByTable",
    "Reclassify",
    "RegularizeAdjacentBuildingFootprint",
    "RegularizeBuildingFootprint",
    "RemoveFeatureClassFromTerrain",
    "RemoveTerrainPoints",
    "RemoveTerrainPyramidLevel",
    "ReplaceTerrainPoints",
    "SetLasClassCodesUsingFeatures",
    "SetLasClassCodesUsingRaster",
    "Simplify3DLine",
    "Skyline",
    "SkylineBarrier",
    "SkylineGraph",
    "Slice",
    "Slope",
    "Spline",
    "SplineWithBarriers",
    "StackProfile",
    "SunShadowFrequency",
    "SunShadowVolume",
    "SurfaceAspect",
    "SurfaceContour",
    "SurfaceDifference",
    "SurfaceLength",
    "SurfaceParameters",
    "SurfaceSlope",
    "SurfaceSpot",
    "SurfaceVolume",
    "TerrainToPoints",
    "TerrainToRaster",
    "TerrainToTin",
    "ThinLas",
    "TileLas",
    "Times",
    "TinAspect",
    "TinContour",
    "TinDifference",
    "TinDomain",
    "TinEdge",
    "TinLine",
    "TinNode",
    "TinPolygonTag",
    "TinPolygonVolume",
    "TinRaster",
    "TinSlope",
    "TinTriangle",
    "TopoToRaster",
    "TopoToRasterByFile",
    "TrainPointCloudClassificationModel",
    "TrainPointCloudObjectDetectionModel",
    "Trend",
    "Union3D",
    "UpdateFeatureZ",
    "Viewshed",
    "Viewshed2",
    "Visibility",
]
__alias__ = "3d"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Tools
@gptooldoc("AddTerrainPoints_3d", None)
def AddTerrainPoints(
    in_terrain=None,
    terrain_feature_class=None,
    in_feature_class=None,
    method: Literal["APPEND", "REPLACE"] | None = None,
) -> Result1[str | Layer]:
    """AddTerrainPoints(in_terrain, terrain_feature_class, in_feature_class, {method})

       Adds terrain multipoints to an embedded terrain feature class.

    INPUTS:
     in_terrain (Terrain Layer):
         Input Terrain
     terrain_feature_class (String):
         Input Terrain Feature Class
     in_feature_class (Feature Layer):
         Input Feature Class
     method {String}:
         Method"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddTerrainPoints_3d(*gp_fixargs((in_terrain, terrain_feature_class, in_feature_class, method), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("LayerToKML_3d", None)
def LayerToKML(
    layer=None,
    out_kmz_file=None,
    layer_output_scale=None,
    is_composite: Literal["COMPOSITE", "NO_COMPOSITE"] | None = None,
    boundary_box_extent=None,
    image_size=None,
    dpi_of_client=None,
    ignore_zvalue: Literal["CLAMPED_TO_GROUND", "ABSOLUTE"] | None = None,
) -> Result1[str | Layer]:
    """LayerToKML(layer, out_kmz_file, {layer_output_scale}, {is_composite}, {boundary_box_extent}, {image_size}, {dpi_of_client}, {ignore_zvalue})

       3D Analyst Layer to KML geoprocessing function

    INPUTS:
     layer (Feature Layer / Raster Layer / Mosaic Layer / Group Layer / Layer File):
         Layer
     layer_output_scale {Double}:
         Layer Output Scale
     is_composite {Boolean}:
         Return single composite image
     boundary_box_extent {Extent}:
         Extent to Export
     image_size {Long}:
         Size of returned image (pixels)
     dpi_of_client {Long}:
         DPI of output image
     ignore_zvalue {Boolean}:
         Clamped features to ground

    OUTPUTS:
     out_kmz_file (File / Workspace / KML Layer):
         Output File"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LayerToKML_3d(
                *gp_fixargs(
                    (
                        layer,
                        out_kmz_file,
                        layer_output_scale,
                        is_composite,
                        boundary_box_extent,
                        image_size,
                        dpi_of_client,
                        ignore_zvalue,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MapToKML_3d", None)
def MapToKML(
    in_map: Literal["Internal_Map"] | None = None,
    out_kmz_file=None,
    map_output_scale=None,
    is_composite: Literal["COMPOSITE", "NO_COMPOSITE"] | None = None,
    is_vector_to_raster: Literal["VECTOR_TO_IMAGE", "VECTOR_TO_VECTOR"] | None = None,
    extent_to_export=None,
    image_size=None,
    dpi_of_client=None,
    ignore_zvalue: Literal["CLAMPED_TO_GROUND", "ABSOLUTE"] | None = None,
    layout=None,
) -> Result1[str]:
    """MapToKML(in_map, out_kmz_file, {map_output_scale}, {is_composite}, {is_vector_to_raster}, {extent_to_export}, {image_size}, {dpi_of_client}, {ignore_zvalue}, {layout})

       3D Analyst Map to KML geoprocessing function

    INPUTS:
     in_map (Map):
         Input Map
     map_output_scale {Double}:
         Map Output Scale
     is_composite {Boolean}:
         Return single composite image
     is_vector_to_raster {Boolean}:
         Convert Vector to Raster
     extent_to_export {Extent}:
         Extent to Export
     image_size {Long}:
         Size of returned image (pixels)
     dpi_of_client {Long}:
         DPI of output image
     ignore_zvalue {Boolean}:
         Clamped features to ground
     layout {String}:
         Layout

    OUTPUTS:
     out_kmz_file (File):
         Output File"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MapToKML_3d(
                *gp_fixargs(
                    (
                        in_map,
                        out_kmz_file,
                        map_output_scale,
                        is_composite,
                        is_vector_to_raster,
                        extent_to_export,
                        image_size,
                        dpi_of_client,
                        ignore_zvalue,
                        layout,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SurfaceLength_3d", None)
def SurfaceLength(
    in_surface=None,
    in_feature_class=None,
    out_length_field=None,
    sample_distance=None,
    z_factor=None,
    method=None,
    pyramid_level_resolution=None,
) -> Result1[str | Layer]:
    """SurfaceLength(in_surface, in_feature_class, {out_length_field}, {sample_distance}, {z_factor}, {method}, {pyramid_level_resolution})

       Determines surface length for each line in a feature class based on an
       input surface.

    INPUTS:
     in_surface (TIN Layer / Raster Layer / Terrain Layer):
         Input Surface
     in_feature_class (Feature Layer):
         Input Feature Class
     out_length_field {String}:
         Surface Length Field
     sample_distance {Double}:
         Sampling Distance
     z_factor {Double}:
         Z Factor
     method {String}:
         Method
     pyramid_level_resolution {Double}:
         Pyramid Level Resolution"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SurfaceLength_3d(
                *gp_fixargs(
                    (
                        in_surface,
                        in_feature_class,
                        out_length_field,
                        sample_distance,
                        z_factor,
                        method,
                        pyramid_level_resolution,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SurfaceSpot_3d", None)
def SurfaceSpot(
    in_surface=None,
    in_feature_class=None,
    out_spot_field=None,
    z_factor=None,
    method=None,
    pyramid_level_resolution=None,
) -> Result1[str | Layer]:
    """SurfaceSpot(in_surface, in_feature_class, {out_spot_field}, {z_factor}, {method}, {pyramid_level_resolution})

       Calculates surface values for each point in a feature class based on
       an input surface.

    INPUTS:
     in_surface (TIN Layer / Raster Layer / Terrain Layer):
         Input Surface
     in_feature_class (Feature Layer):
         Input Feature Class
     out_spot_field {String}:
         Spot Field
     z_factor {Double}:
         Z Factor
     method {String}:
         Method
     pyramid_level_resolution {Double}:
         Pyramid Level Resolution"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SurfaceSpot_3d(
                *gp_fixargs(
                    (in_surface, in_feature_class, out_spot_field, z_factor, method, pyramid_level_resolution), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TinAspect_3d", None)
def TinAspect(
    in_tin=None,
    out_feature_class=None,
    class_breaks_table=None,
    aspect_field=None,
) -> Result1[str]:
    """TinAspect(in_tin, out_feature_class, {class_breaks_table}, {aspect_field})

       Extracts the directional orientation of input TIN to an output polygon
       feature class.

    INPUTS:
     in_tin (TIN Layer):
         The input TIN.
     class_breaks_table {Table}:
         An input table containing the classification breaks that will be used
         to classify the output feature class.
     aspect_field {String}:
         The field containing aspect values.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TinAspect_3d(*gp_fixargs((in_tin, out_feature_class, class_breaks_table, aspect_field), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TinContour_3d", None)
def TinContour(
    in_tin=None,
    out_feature_class=None,
    interval=None,
    base_contour=None,
    contour_field=None,
    contour_field_precision=None,
    index_interval=None,
    index_interval_field=None,
    z_factor=None,
) -> Result1[str]:
    """TinContour(in_tin, out_feature_class, interval, {base_contour}, {contour_field}, {contour_field_precision}, {index_interval}, {index_interval_field}, {z_factor})

       Generates contours from a TIN surface.

    INPUTS:
     in_tin (TIN Layer):
         The surface from which the contours will be interpolated.
     interval (Double):
         The interval between the contours.
     base_contour {Double}:
         Along with the index interval, the base height is used to determine
         what contours are produced. The base height is a starting point from
         which the index interval is either added or subtracted. By default,
         the base contour is 0.0.
     contour_field {String}:
         The field containing contour values.
     contour_field_precision {Long}:
         The precision of the contour field. Zero specifies an integer, and the
         numbers 1-9 indicate how many decimal places the field will contain.
         By default, the field will be an integer (0).
     index_interval {Double}:
         The difference, in Z units, between index contours. The value
         specified should be evenly divisible by the contour interval.
         Typically, it's five times greater. Use of this parameter adds an
         attribute field to the output feature class that's used to
         differentiate index contours from regular contours.
     index_interval_field {String}:
         The name of the field used to record whether a contour is a regular or
         an index contour. By default, the value is ‘Index'.
     z_factor {Double}:
         Specifies a factor by which to multiply the surface heights. Used to
         convert z units to x and y units.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TinContour_3d(
                *gp_fixargs(
                    (
                        in_tin,
                        out_feature_class,
                        interval,
                        base_contour,
                        contour_field,
                        contour_field_precision,
                        index_interval,
                        index_interval_field,
                        z_factor,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TinDifference_3d", None)
def TinDifference(
    in_tin1=None,
    in_tin2=None,
    out_feature_class=None,
) -> Result1[str]:
    """TinDifference(in_tin1, in_tin2, out_feature_class)

       Calculates the volumetric difference between two TIN datasets.

    INPUTS:
     in_tin1 (TIN Layer):
         The first input TIN.
     in_tin2 (TIN Layer):
         The second input TIN.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output polygon feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TinDifference_3d(*gp_fixargs((in_tin1, in_tin2, out_feature_class), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TinPolygonVolume_3d", None)
def TinPolygonVolume(
    in_tin=None,
    in_feature_class=None,
    in_height_field=None,
    reference_plane: Literal["ABOVE", "BELOW"] | None = None,
    out_volume_field=None,
    surface_area_field=None,
) -> Result1[str | Layer]:
    """TinPolygonVolume(in_tin, in_feature_class, in_height_field, {reference_plane}, {out_volume_field}, {surface_area_field})

       Calculates the volumetric and surface area between polygons of an
       input feature class and a TIN surface.

    INPUTS:
     in_tin (TIN Layer):
         The input TIN.
     in_feature_class (Feature Layer):
         The input polygon feature class.
     in_height_field (String):
         The name of the field containing polygon reference plane heights.
     reference_plane {String}:
         The keyword used to indicate whether volume and surface area are
         calculated ABOVE the reference plane height of the polygons, or BELOW.
         The default is BELOW.
     out_volume_field {String}:
         The name of the output field used to store the volume result. The
         default is Volume.
     surface_area_field {String}:
         The name of the output field used to store the surface area result.
         The default is SArea."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TinPolygonVolume_3d(
                *gp_fixargs(
                    (in_tin, in_feature_class, in_height_field, reference_plane, out_volume_field, surface_area_field),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TinSlope_3d", None)
def TinSlope(
    in_tin=None,
    out_feature_class=None,
    units: Literal["PERCENT", "DEGREE"] | None = None,
    class_breaks_table=None,
    slope_field=None,
    z_factor=None,
) -> Result1[str]:
    """TinSlope(in_tin, out_feature_class, {units}, {class_breaks_table}, {slope_field}, {z_factor})

       Extracts slope information from the input TIN surface into polygon
       features.

    INPUTS:
     in_tin (TIN Layer):
         The input TIN.
     units {String}:
         The units of measure for the slope values. Units are honored when a
         class breaks table is used.
     class_breaks_table {Table}:
         An input table containing the classification breaks that will be used
         to classify the output feature class.
     slope_field {String}:
         The field containing slope values.
     z_factor {Double}:
         The factor applied to the slope calculation to convert the TIN's z
         units to x and y units. By default, the z-factor is 1.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TinSlope_3d(
                *gp_fixargs((in_tin, out_feature_class, units, class_breaks_table, slope_field, z_factor), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# 3D Features toolset
@gptooldoc("EncloseMultiPatch_3d", None)
def EncloseMultiPatch(
    in_features=None,
    out_feature_class=None,
    grid_size=None,
) -> Result1[str]:
    """EncloseMultiPatch(in_features, out_feature_class, {grid_size})

       Creates closed multipatch features from open multipatch features.

    INPUTS:
     in_features (Feature Layer):
         The multipatch features that will be used to construct closed
         multipatches.
     grid_size {Double}:
         The resolution that will be used to construct the closed multipatch
         features. This value is defined using the linear units of the input
         feature's spatial reference.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output closed multipatch features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.EncloseMultiPatch_3d(*gp_fixargs((in_features, out_feature_class, grid_size), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("EnforceRiverMonotonicity_3d", None)
def EnforceRiverMonotonicity(
    in_rivers=None,
    in_flow_direction=None,
    out_feature_class=None,
    max_sample_distance=None,
    simplification_tolerance=None,
) -> Result1[str]:
    """EnforceRiverMonotonicity(in_rivers, in_flow_direction, out_feature_class, {max_sample_distance}, {simplification_tolerance})

       Creates height adjusted breaklines from 3D polygons representing river
       banks.

    INPUTS:
     in_rivers (Feature Layer):
         The 3D polygons delineating the river banks that will be processed.
     in_flow_direction (Feature Layer):
         The line features that indicate the flow direction of the river bank
         polygons.
     max_sample_distance {Linear Unit}:
         The regular sampling distance of the polygon's boundary that will be
         used to establish monotonicity along the river banks.
     simplification_tolerance {Linear Unit}:
         The z-range that will be used to simplify the resulting river boundary
         line.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output river boundary lines."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.EnforceRiverMonotonicity_3d(
                *gp_fixargs(
                    (in_rivers, in_flow_direction, out_feature_class, max_sample_distance, simplification_tolerance),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("IsClosed3D_3d", None)
def IsClosed3D(
    in_feature_class=None,
) -> Result1[str | Layer]:
    """IsClosed3D(in_feature_class)

       Evaluates multipatch features to determine whether each feature
       completely encloses a volume of space.

    INPUTS:
     in_feature_class (Feature Layer):
         The multipatch features to be tested."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.IsClosed3D_3d(*gp_fixargs((in_feature_class,), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("Simplify3DLine_3d", None)
def Simplify3DLine(
    in_features=None,
    out_feature_class=None,
    tolerance=None,
) -> Result1[str]:
    """Simplify3DLine(in_features, out_feature_class, tolerance)

       Generalizes 3D line features to reduce the overall number of vertices
       while approximating the original shape in horizontal and vertical
       directions within a specified tolerance.

    INPUTS:
     in_features (Feature Layer):
         The line features to be simplified.
     tolerance (Linear Unit):
         The 3D distance threshold from the input lines that the simplified
         output must remain within.

    OUTPUTS:
     out_feature_class (Feature Class):
         The simplified output line features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Simplify3DLine_3d(*gp_fixargs((in_features, out_feature_class, tolerance), True))
        )
        return retval
    except Exception as e:
        raise e


# 3D Features\Conversion toolset
@gptooldoc("ASCII3DToFeatureClass_3d", None)
def ASCII3DToFeatureClass(
    input=None,
    in_file_type: Literal["XYZ", "XYZI", "GENERATE"] | None = None,
    out_feature_class=None,
    out_geometry_type: Literal["POINT", "MULTIPOINT", "POLYLINE", "POLYGON"] | None = None,
    z_factor=None,
    input_coordinate_system=None,
    average_point_spacing=None,
    file_suffix=None,
    decimal_separator: Literal["DECIMAL_POINT", "DECIMAL_COMMA"] | None = None,
) -> Result1[str]:
    """ASCII3DToFeatureClass(input;input..., in_file_type, out_feature_class, out_geometry_type, {z_factor}, {input_coordinate_system}, {average_point_spacing}, {file_suffix}, {decimal_separator})

       Imports 3D features from one or more ASCII files stored in XYZ, XYZI,
       or GENERATE formats into a new feature class.

    INPUTS:
     input (File / Folder):
         The ASCII files or folders containing data in XYZ, XYZI (with
         lidar intensity), or 3D GENERATE format. All input files must be in
         the same format. If a folder is specified, theparameter becomes
         required, and all the files that have the same extension as the
         specified suffix will be processed. File Suffix        In
         thepane, a folder can also be specified as an input by
         selecting the folder in File Explorer and dragging it onto the
         parameter's input box. Geoprocessing
     in_file_type (String):
         The format of the ASCII files that will be converted to a feature
         class.XYZ-Text file that contain geometry information stored as XYZ
         coordinates.XYZI-Text files that contain XYZ coordinates alongside
         intensity
         measurements.GENERATE-Text files structured in the Generate format.
     out_geometry_type (String):
         The geometry type of the output feature class.MULTIPOINT-Multipoints
         are recommended the input data contains a large
         number of points and attributes per feature are not
         required.POINT-Each XYZ coordinate will produce one point
         feature.POLYLINE-The output will contain polyline features.POLYGON-The
         output will contain polygon features.
     z_factor {Double}:
         The factor by which z-values will be multiplied. This is typically
         used to convert z linear units to match x,y linear units. The default
         is 1, which leaves elevation values unchanged. This parameter is not
         available if the spatial reference of the input surface has a z-datum
         with a specified linear unit.
     input_coordinate_system {Coordinate System}:
         The coordinate system of the input data. The default is an Unknown
         Coordinate System. If specified, the output may or may not be
         projected into a different coordinate system. This depends the whether
         the geoprocessing environment has a coordinate system defined for the
         location of the target feature class.
     average_point_spacing {Double}:
         The average planimetric distance between points of the input. This
         parameter is only used when the output geometry is set to MULTIPOINT,
         and its function is to provide a means for grouping the points
         together. This value is used in conjunction with the points per shape
         limit to construct a virtual tile system used to group the points. The
         tile system's origin is based on the domain of the target feature
         class. Specify the spacing in the horizontal units of the target
         feature class.
     file_suffix {String}:
         The suffix of the files that will be imported from an input folder.
         This parameter is required when a folder is specified as input.
     decimal_separator {String}:
         The decimal character that will be used in the text file to
         differentiate the integer of a number from its fractional
         part.DECIMAL_POINT-A point will be used as the decimal character. This
         is
         the default.DECIMAL_COMMA-A comma will be used as the decimal
         character.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ASCII3DToFeatureClass_3d(
                *gp_fixargs(
                    (
                        input,
                        in_file_type,
                        out_feature_class,
                        out_geometry_type,
                        z_factor,
                        input_coordinate_system,
                        average_point_spacing,
                        file_suffix,
                        decimal_separator,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FeatureClassZToASCII_3d", None)
def FeatureClassZToASCII(
    in_feature_class=None,
    output_location=None,
    out_file=None,
    format: Literal["GENERATE", "XYZ", "PROFILE"] | None = None,
    delimiter: Literal["COMMA", "SPACE"] | None = None,
    decimal_format: Literal["AUTOMATIC", "FIXED"] | None = None,
    digits_after_decimal=None,
    decimal_separator: Literal["DECIMAL_POINT", "DECIMAL_COMMA"] | None = None,
) -> Result1[str]:
    """FeatureClassZToASCII(in_feature_class, output_location, out_file, {format}, {delimiter}, {decimal_format}, {digits_after_decimal}, {decimal_separator})

       Exports 3D features to ASCII text files storing GENERATE, XYZ, or
       profile data.

    INPUTS:
     in_feature_class (Feature Layer):
         The 3D point, multipoint, polyline, or polygon feature class that will
         be exported to an ASCII file.
     output_location (Folder):
         The folder to which output files will be written.
     out_file (String):
         The name of the resulting ASCII file.If a line or polygon feature
         class is exported to XYZ format, the file
         name is used as a base name. Each feature will have a unique file
         output, since the XYZ format only supports one line or polygon per
         file. Multipart features will also have each part written to a
         separate file. The file name will be appended with the OID of each
         feature, as well as any additional characters needed to make each file
         name unique.
     format {String}:
         Specifies the format of the ASCII file being created.GENERATE-Writes
         output in the GENERATE format. This is the
         default.XYZ-Writes XYZ information of input features. One file will be
         created
         for each line or polygon in the input feature.PROFILE-Writes profile
         information for line features that can be used
         in external graphing applications.
     delimiter {String}:
         Specifies the delimiter that will indicate the separation of entries
         in the columns of the text file table.SPACE-A space will be used to
         delimit field values. This is the
         default.COMMA-A comma will be used to delimit field values. This
         option is not
         applicable if the decimal separator is also a comma.
     decimal_format {String}:
         Specifies the method that will determine the number of significant
         digits stored in the output files.AUTOMATIC-The number of significant
         digits needed to preserve the
         available precision, while removing unnecessary trailing zeros, is
         automatically determined. This is the default. FIXED-The
         number of significant digits is defined in
         theparameter. Digits after Decimal
     digits_after_decimal {Long}:
         The number of digits written after the decimal for floating-
         point values written to the output files. This parameter is used when
         theparameter is set to(decimal_format=FIXED in Python). Decimal
         NotationSpecified Number
     decimal_separator {String}:
         Specifies the decimal character that will differentiate the integer of
         a number from its fractional part.DECIMAL_POINT-A point is used as the
         decimal character. This is the
         default.DECIMAL_COMMA-A comma is used as the decimal character."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FeatureClassZToASCII_3d(
                *gp_fixargs(
                    (
                        in_feature_class,
                        output_location,
                        out_file,
                        format,
                        delimiter,
                        decimal_format,
                        digits_after_decimal,
                        decimal_separator,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FeatureTo3DByAttribute_3d", None)
def FeatureTo3DByAttribute(
    in_features=None,
    out_feature_class=None,
    height_field=None,
    to_height_field=None,
) -> Result1[str]:
    """FeatureTo3DByAttribute(in_features, out_feature_class, height_field, {to_height_field})

       Creates 3D features using height values derived from the attribute of
       the input features.

    INPUTS:
     in_features (Feature Layer):
         The features that will be used to create 3D features.
     height_field (Field):
         The field whose values will define the height of the resulting 3D
         features.
     to_height_field {Field}:
         An optional second height field used for lines. When using two height
         fields, each line will start at the first height and end at the second
         (sloped).

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FeatureTo3DByAttribute_3d(
                *gp_fixargs((in_features, out_feature_class, height_field, to_height_field), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FeaturesFromCityEngineRules_3d", None)
def FeaturesFromCityEngineRules(
    in_features=None,
    in_rule_package=None,
    out_feature_class=None,
    in_existing_fields: Literal["INCLUDE_EXISTING_FIELDS", "DROP_EXISTING_FIELDS"] | None = None,
    in_include_reports: Literal["INCLUDE_REPORTS", "EXCLUDE_REPORTS"] | None = None,
    in_leaf_shapes: Literal["FEATURE_PER_LEAF_SHAPE", "FEATURE_PER_SHAPE"] | None = None,
) -> Result:
    """FeaturesFromCityEngineRules(in_features, in_rule_package, out_feature_class, {in_existing_fields}, {in_include_reports}, {in_leaf_shapes})

       Generates 3D geometries from existing 2D and 3D input features using
       rules authored in ArcGIS CityEngine.

    INPUTS:
     in_features (Feature Layer):
         The input point, polygon, or multipatch features. Input features can
         be procedurally symbolized feature layers. Field mapping (attribute-
         driven symbol properties) will be honored.
     in_rule_package (File):
         The CityEngine rule package file (*.rpk) containing CGA rule
         information and assets. The rule annotated with @StartRule in the .rpk
         file should be annotated @InPoint for a rule package intended for
         point features, @InPolygon for a rule package intended for polygon
         features, or @InMesh for a rule package intended for multipatch
         features. If @StartRule is not annotated with @InPoint, @InPolygon, or
         @InMesh, the feature type will be assumed to be polygon.
     in_existing_fields {Boolean}:
         Specifies whether the output feature class will include the attribute
         fields of the input feature class. This parameter is not considered
         when the in_leaf_shapes parameter is used.INCLUDE_EXISTING_FIELDS-The
         attribute fields of the input feature
         class will be included in the output feature class. This is the
         default.DROP_EXISTING_FIELDS-The attribute fields of the input feature
         class
         will not be included in the output feature class. This option will be
         used automatically if the in_leaf_shapes parameter is set to
         FEATURE_PER_LEAF_SHAPE.
     in_include_reports {Boolean}:
         Depending on how the rule package has been authored, it may contain
         logic that generates one or more reports as the models are created.
         These reports can contain a variety of information about the features.
         An example is a rule package that reports the number of windows
         generated for each building model.INCLUDE_REPORTS-The output feature
         class will include new attribute
         fields to hold reported values for each feature as defined by the rule
         package report generation logic. A unique attribute is created for
         each reported value.EXCLUDE_REPORTS-Reports generated in the rule
         package will be ignored,
         and no new attributes relating to the reports will be generated. This
         is the default.This parameter is ignored if the rule package does not
         contain logic
         to generate reports.
     in_leaf_shapes {Boolean}:
         Specifies whether each input feature will be convert to a single,
         merged multipatch feature or become a set of many features that can be
         points, line, or multipatches.CityEngine rule packages construct
         content by generating component
         pieces and merging them into a single 3D object. However, these
         components, or leaf shapes, can also be stored as separate features.
         This option can be especially important when running analytical
         operations using subelements of a 3D object, such as the windows of a
         building.For example, a rule may generate seamless building models
         from input
         polygon footprints, or alternatively, it may create separate features
         for each apartment face, including an outward-facing panel, a
         representative center point, and lines showing the borders. In this
         example, the apartment panels, center points, and outlines are all
         considered leaf shapes. FEATURE_PER_LEAF_SHAPE-Additional
         output feature classes will
         be generated. The attribute fields from the input feature class will
         not be included in the output feature class. The output feature class
         will contain a field namedthat references theof the input feature from
         which the output was generated.
         OriginalOIDObjectIDFEATURE_PER_SHAPE-Additional output feature classes
         will not be
         generated, even if additional leaf shapes are defined in the logic of
         the rule. All of the geometry will be contained within the output
         multipatch features. This is the default.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class containing multipatch features with CGA rules
         applied. An OriginalOID field is added to the output feature classes
         to contain the ObjectID of the input feature from which each output
         feature has been generated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FeaturesFromCityEngineRules_3d(
                *gp_fixargs(
                    (
                        in_features,
                        in_rule_package,
                        out_feature_class,
                        in_existing_fields,
                        in_include_reports,
                        in_leaf_shapes,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Import3DFiles_3d", None)
def Import3DFiles(
    in_files=None,
    out_featureClass=None,
    root_per_feature: Literal["ONE_FILE_ONE_FEATURE", "ONE_ROOT_ONE_FEATURE"] | None = None,
    spatial_reference=None,
    y_is_up: Literal["Y_IS_UP", "Z_IS_UP"] | None = None,
    file_suffix: Literal["3DS", "WRL", "FLT", "DAE", "OBJ", "*"] | None = None,
    in_featureClass=None,
    symbol_field=None,
) -> Result1[str]:
    """Import3DFiles(in_files;in_files..., out_featureClass, {root_per_feature}, {spatial_reference}, {y_is_up}, {file_suffix}, {in_featureClass}, {symbol_field})

       Imports one or more 3D models into a multipatch feature class.

    INPUTS:
     in_files (Folder / File):
         One or more 3D models or folders containing such files in the
         supported formats, which are 3D Studio Max (*.3ds), VRML and GeoVRML
         (*.wrl), OpenFlight (*.flt), COLLADA (*.dae), and Wavefront OBJ models
         (*.obj).
     root_per_feature {Boolean}:
         Indicates whether to produce one feature per file or one feature for
         every root node in the file. This option only applies to VRML
         models.ONE_ROOT_ONE_FEATURE-The generated output will contain one
         feature for
         each root node in the file.ONE_FILE_ONE_FEATURE-The generated output
         will contain one file for
         each feature. This is the default.
     spatial_reference {Spatial Reference}:
         The coordinate system of the input data. For the majority of formats,
         this is unknown. Only the GeoVRML format stores its coordinate system,
         and its default will be obtained from the first file in the list
         unless a spatial reference is specified here.
     y_is_up {Boolean}:
         Identifies the axis that defines the vertical orientation of the input
         files.Z_IS_UP-Indicates that z is up. This is the
         default.Y_IS_UP-Indicated
         that y is up.
     file_suffix {String}:
         The file extension of the files to import from an input folder. This
         parameter is required when at least one folder is specified as an
         input.*-All supported files. This is the default.3DS-3D Studio
         MaxWRL-VRML
         or GeoVRMLFLT-OpenFlightDAE-ColladaOBJ-Wavefront OBJ model
     in_featureClass {Feature Layer}:
         The point features whose coordinates define the real-world
         position of the input files. Each input file will be matched to its
         corresponding point based on the file names stored in the.
         Theparameter should be defined to match the spatial reference of the
         points. Symbol FieldCoordinate System
     symbol_field {Field}:
         The field in the point features containing the name of the 3D file
         associated with each point.

    OUTPUTS:
     out_featureClass (Feature Class):
         The multipatch that will be created from the input files."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Import3DFiles_3d(
                *gp_fixargs(
                    (
                        in_files,
                        out_featureClass,
                        root_per_feature,
                        spatial_reference,
                        y_is_up,
                        file_suffix,
                        in_featureClass,
                        symbol_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Layer3DToFeatureClass_3d", None)
def Layer3DToFeatureClass(
    in_feature_layer=None,
    out_feature_class=None,
    group_field=None,
    disable_materials: Literal["DISABLE_COLORS_AND_TEXTURES", "ENABLE_COLORS_AND_TEXTURES"] | None = None,
) -> Result1[str]:
    """Layer3DToFeatureClass(in_feature_layer, out_feature_class, {group_field}, {disable_materials})

       Exports feature layers with 3D display properties to 3D lines or
       multipatch features.

    INPUTS:
     in_feature_layer (Feature Layer):
         The input feature layer with 3D display properties defined.
     group_field {Field}:
         The input feature's text field that will be used to merge multiple
         input features into the same output feature. The resulting output's
         remaining attributes will be inherited from one of the input records.
     disable_materials {Boolean}:
         Specifies whether color and texture properties will be maintained when
         exporting a 3D layer to a multipatch feature
         class.DISABLE_COLORS_AND_TEXTURES-Colors and textures will not be
         stored as
         part of the multipatch definition.ENABLE_COLORS_AND_TEXTURES-Colors
         and textures will be preserved with
         the multipatch. This is the default.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class with 3D features. Extruded points will be
         exported as 3D lines. Points with 3D symbols, extruded lines, and
         polygons will be exported as multipatch features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Layer3DToFeatureClass_3d(
                *gp_fixargs((in_feature_layer, out_feature_class, group_field, disable_materials), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# 3D Features\Extraction toolset
@gptooldoc("ExtractMultipatchFromMesh_3d", None)
def ExtractMultipatchFromMesh(
    source_mesh=None,
    footprint_features=None,
    out_feature_class=None,
) -> Result1[str]:
    """ExtractMultipatchFromMesh(source_mesh, footprint_features, out_feature_class)

       Creates a multipatch feature from the portion of an integrated mesh
       that overlaps a polygon.

    INPUTS:
     source_mesh (Scene Layer / File):
         The integrated mesh that will be processed.
     footprint_features (Feature Layer):
         The polygon features defining the area that will be clipped.

    OUTPUTS:
     out_feature_class (Feature Class):
         The multipatch feature class that will be produced by this tool."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExtractMultipatchFromMesh_3d(*gp_fixargs((source_mesh, footprint_features, out_feature_class), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExtractPowerLinesFromPointCloud_3d", None)
def ExtractPowerLinesFromPointCloud(
    in_point_cloud=None,
    class_codes=None,
    out_3d_lines=None,
    point_tolerance=None,
    separation_distance=None,
    max_sampling_gap=None,
    line_tolerance=None,
    wind_correction: Literal["WIND", "NO_WIND"] | None = None,
    min_wind_span=None,
    max_wind_deviation=None,
    end_point_search_radius=None,
    min_length=None,
    eliminate_wind: Literal["ELIMINATE_WIND", "KEEP_WIND"] | None = None,
    min_line_length=None,
) -> Result1[str]:
    """ExtractPowerLinesFromPointCloud(in_point_cloud, class_codes;class_codes..., out_3d_lines, {point_tolerance}, {separation_distance}, {max_sampling_gap}, {line_tolerance}, {wind_correction}, {min_wind_span}, {max_wind_deviation}, {end_point_search_radius}, {min_length}, {eliminate_wind}, {min_line_length})

       Extracts 3D line features modeling power lines from classified point
       cloud data.

    INPUTS:
     in_point_cloud (LAS Dataset Layer / Scene Layer / File):
         The LAS dataset layer containing points classified as power lines.
     class_codes (Long):
         The class code values for the points representing the power lines.
     point_tolerance {Linear Unit}:
         The distance used to establish the points that belong to a given power
         line. The default is 80 centimeters.
     separation_distance {Linear Unit}:
         The distance apart points must be to determine if they belong to
         different power lines. The default is 1 meter.
     max_sampling_gap {Linear Unit}:
         The largest gap that can exist in a given span of a power line. The
         catenary curve being modeled from a set of power line points will be
         extended by this distance to find other points that fit the same power
         line. The default is 5 meters.
     line_tolerance {Linear Unit}:
         The distance that will be used to establish the accuracy of the output
         power line. A larger distance will result in the creation of less
         vertices per line, yielding a more coarse representation of the power
         line when compared with a smaller distance. The default is 1
         centimeter.
     wind_correction {Boolean}:
         Specifies whether the output power lines will be adjusted for the
         influence of wind. When wind correction is applied, it can be used to
         either improve the fitting of wind modified points or model the
         resting state of the power lines when no wind is acting on them. The
         type of wind correction is specified using the eliminate_wind
         parameter.WIND-The power lines will be adjusted for the influence of
         the wind.
         This is the default.NO_WIND-An attempt will be made to fit the points
         without additional
         adjustments for the wind.
     min_wind_span {Linear Unit}:
         The shortest distance a power line span can be to apply wind
         correction when generating the output power line. The default is 60
         meters.
     max_wind_deviation {Double}:
         The maximum angle that the wind is expected to deviate a given power
         line. The default is 10 degrees.
     end_point_search_radius {Linear Unit}:
         The distance that will be used to identify a common suspension point
         for power line segments connected to the same distribution pole or
         transmission tower. The default is 10 meters.
     min_length {Linear Unit}:
         The shortest wire length that can be used to determine the presence of
         a common end point. The default is 5 meters.
     eliminate_wind {Boolean}:
         Specifies how wind correction will be applied to the output power
         lines. Wind correction will only be applied for catenary curves that
         span a distance longer than the value specified in the min_wind_span
         parameter.ELIMINATE_WIND-The power lines will be adjusted to simulate
         the
         elimination of the impact of wind.KEEP_WIND-The power lines will be
         adjusted to achieve a better fit for
         the impact of wind. This is the default.
     min_line_length {Linear Unit}:
         The minimum 3D length of the output wires. Lines that have a length
         shorter than the value specified for this parameter will be omitted
         from the output.

    OUTPUTS:
     out_3d_lines (Feature Class):
         The 3D lines modeling the power lines."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExtractPowerLinesFromPointCloud_3d(
                *gp_fixargs(
                    (
                        in_point_cloud,
                        class_codes,
                        out_3d_lines,
                        point_tolerance,
                        separation_distance,
                        max_sampling_gap,
                        line_tolerance,
                        wind_correction,
                        min_wind_span,
                        max_wind_deviation,
                        end_point_search_radius,
                        min_length,
                        eliminate_wind,
                        min_line_length,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExtractRailsFromPointCloud_3d", None)
def ExtractRailsFromPointCloud(
    in_point_cloud=None,
    class_codes=None,
    out_3d_lines=None,
    rail_standard: Literal["US_115_RE", "US_132_RE", "US_141_RE", "EU_UIC_54", "EU_UIC_60", "CUSTOM"] | None = None,
    out_3d_centerlines=None,
    track_gauge=None,
    rail_thickness=None,
    horizontal_smoothing_kernel_distance=None,
    vertical_smoothing_kernel_distance=None,
    horizontal_rail_tolerance=None,
    vertical_rail_tolerance=None,
    centerline_alignment_tolerance=None,
    rail_crown_detection_radius=None,
    horizontal_simplification_tolerance=None,
    vertical_simplification_tolerance=None,
    min_line_length=None,
) -> Result2[str, str]:
    """ExtractRailsFromPointCloud(in_point_cloud, class_codes;class_codes..., out_3d_lines, {rail_standard}, {out_3d_centerlines}, {track_gauge}, {rail_thickness}, {horizontal_smoothing_kernel_distance}, {vertical_smoothing_kernel_distance}, {horizontal_rail_tolerance}, {vertical_rail_tolerance}, {centerline_alignment_tolerance}, {rail_crown_detection_radius}, {horizontal_simplification_tolerance}, {vertical_simplification_tolerance}, {min_line_length})

       Extracts rail track lines and center lines from classified railroad
       tracks in a LAS dataset, point cloud scene layer package, or I3S point
       cloud layer.

    INPUTS:
     in_point_cloud (LAS Dataset Layer / Scene Layer / File):
         The input LAS dataset or point cloud scene layer containing the
         classified railway points.
     class_codes (Long):
         The class codes that will be used for rail points.
     rail_standard {String}:
         Specifies the rail standard that will be used. The standard describes
         the measurements of the track gauge and rail thickness. The
         specification will impact the algorithm that will be used for
         extracting the rail features.US_115_RE-The 115 lb United States rail
         standard defined by the
         American Railway Engineering and Maintenance-of-Way Association
         (AREMA) will be used. This is the default.US_132_RE-The 132 lb United
         States rail standard defined by AREMA will
         be used.US_141_RE-The 141 lb United States rail standard defined by
         AREMA will
         be used.EU_UIC_54-The 54.77 kg European rail standard defined by the
         International Union of Railways will be used.EU_UIC_60-The 60 kg
         European rail standard defined by the
         International Union of Railways will be used.CUSTOM-A different
         standard will be used. When this option is
         specified, provide values for the track gauge and rail thickness
         parameters.
     track_gauge {Linear Unit}:
         The track gauge that describes the inner distance between the two
         rails of a railway track. The default is 1435 millimeters, which
         corresponds to the US 115 RE standard, but this value will be updated
         to match the specified rail standard.
     rail_thickness {Linear Unit}:
         The width of the top part of each rail. The default value is 66.675
         millimeters, which corresponds to the US 115 RE standard, but this
         value will be updated to match the specified rail standard.
     horizontal_smoothing_kernel_distance {Linear Unit}:
         The x,y distance that will be used to apply a weighted average-based
         smoothing function in the horizontal direction onto the output rail
         lines. This parameter will help to overcome the distortions of
         incomplete, misclassified, or noisy rail points. The default is 0.8
         meters.
     vertical_smoothing_kernel_distance {Linear Unit}:
         The z-distance that will be used to apply a weighted average-based
         smoothing function in the vertical direction onto the output rail
         lines. This parameter will help to overcome the distortions of
         incomplete, misclassified, or noisy rail points. The default is 10
         meters.
     horizontal_rail_tolerance {Linear Unit}:
         The distance that will be used in the x,y direction to identify points
         that belong to the same rail in a given track. The default is 10
         centimeters.
     vertical_rail_tolerance {Linear Unit}:
         The distance that will be used in the z-direction to identify points
         that belong to the same rail in a given track. The default is 3
         centimeters.
     centerline_alignment_tolerance {Linear Unit}:
         The tolerance distance that will be used to align the centerline
         feature between the rails of a given track. The default is 50
         millimeters.
     rail_crown_detection_radius {Linear Unit}:
         The search radius that will be used to identify continuous points that
         define the rail crown, which is the topmost portion of a given rail
         track. The default is 20 meters.
     horizontal_simplification_tolerance {Linear Unit}:
         The distance that will be used to simplify the output rail line in the
         x,y direction. The horizontal position of the simplified rail will not
         deviate from the original by more than this amount. The default is 2
         millimeters.
     vertical_simplification_tolerance {Linear Unit}:
         The distance that will be used to simplify the output rail line in the
         z-direction. The height of the simplified rail will not deviate from
         the original by more than this amount. The default is 2 millimeters.
     min_line_length {Linear Unit}:
         The minimum three-dimensional length that a detected line must have to
         be included in the output line features. Any detected line that is
         shorter than this length will be ignored. The default is 1 meter.

    OUTPUTS:
     out_3d_lines (Feature Class):
         The output 3D rail lines that will be extracted from the point cloud.
     out_3d_centerlines {Feature Class}:
         The output 3D center line that represents the middle of the rail
         track."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExtractRailsFromPointCloud_3d(
                *gp_fixargs(
                    (
                        in_point_cloud,
                        class_codes,
                        out_3d_lines,
                        rail_standard,
                        out_3d_centerlines,
                        track_gauge,
                        rail_thickness,
                        horizontal_smoothing_kernel_distance,
                        vertical_smoothing_kernel_distance,
                        horizontal_rail_tolerance,
                        vertical_rail_tolerance,
                        centerline_alignment_tolerance,
                        rail_crown_detection_radius,
                        horizontal_simplification_tolerance,
                        vertical_simplification_tolerance,
                        min_line_length,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("LasBuildingMultipatch_3d", None)
def LasBuildingMultipatch(
    in_las_dataset=None,
    in_features=None,
    ground=None,
    out_feature_class=None,
    point_selection: Literal["BUILDING_CLASSIFIED_POINTS", "LAYER_FILTERED_POINTS", "ALL_POINTS"] | None = None,
    simplification=None,
    sampling_resolution=None,
    min_height_field=None,
    max_height_field=None,
) -> Result1[str]:
    """LasBuildingMultipatch(in_las_dataset, in_features, ground, out_feature_class, {point_selection}, {simplification}, {sampling_resolution}, {min_height_field}, {max_height_field})

       Creates building models using rooftop points in a LAS dataset.

    INPUTS:
     in_las_dataset (LAS Dataset Layer):
         The LAS dataset containing the points that will define the building
         rooftop.
     in_features (Feature Layer):
         The polygon features that define the building footprint.
     ground (Raster Layer / TIN Layer / Field):
         The source of ground height values can be either a numeric field in
         the building footprint attribute table or a raster or TIN surface. A
         field-based ground source will be processed faster than a surface-
         based ground source.
     point_selection {String}:
         Specifies the LAS points that will be used to define the building
         rooftop.BUILDING_CLASSIFIED_POINTS-LAS points assigned a class code
         value of 6
         will be used. This is the default.LAYER_FILTERED_POINTS-LAS points
         that are filtered by the input layer
         will be used.ALL_POINTS-All LAS points that overlay the building
         footprint will be
         used.
     simplification {Linear Unit}:
         A z-tolerance value that will be used to simplify the rooftop
         geometry. This value defines the maximum deviation of the output
         rooftop model from the TIN surface created using the LAS points.
     sampling_resolution {Linear Unit}:
         The binning size used to thin the point cloud before constructing the
         rooftop surface.
     min_height_field {Field}:
         The numeric field containing the minimum height of the points that
         will be used to define the rooftop. Any numeric field can be
         specified. Points that are lower than the value in this field will be
         ignored.
     max_height_field {Field}:
         The numeric field containing the maximum height of the points that
         will be used to define the rooftop. Any numeric field can be
         specified. Points that are higher than the value in this field will be
         ignored.

    OUTPUTS:
     out_feature_class (Feature Class):
         The multipatch feature class that will store the output building
         models."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LasBuildingMultipatch_3d(
                *gp_fixargs(
                    (
                        in_las_dataset,
                        in_features,
                        ground,
                        out_feature_class,
                        point_selection,
                        simplification,
                        sampling_resolution,
                        min_height_field,
                        max_height_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MultiPatchFootprint_3d", None)
def MultiPatchFootprint(
    in_feature_class=None,
    out_feature_class=None,
    group_field=None,
) -> Result1[str]:
    """MultiPatchFootprint(in_feature_class, out_feature_class, {group_field})

       Creates polygon footprints representing the two-dimensional area of
       multipatch features.

    INPUTS:
     in_feature_class (Feature Layer):
         The multipatch feature whose footprint will be generated.
     group_field {Field}:
         The field used for combining multipatch features so that they
         contribute to the same footprint polygon.

    OUTPUTS:
     out_feature_class (Feature Class):
         The resulting footprint polygon feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MultiPatchFootprint_3d(*gp_fixargs((in_feature_class, out_feature_class, group_field), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RegularizeAdjacentBuildingFootprint_3d", None)
def RegularizeAdjacentBuildingFootprint(
    in_features=None,
    group=None,
    out_feature_class=None,
    method: Literal["ANY_ANGLES", "RIGHT_ANGLES", "RIGHT_ANGLES_AND_DIAGONALS"] | None = None,
    tolerance=None,
    precision=None,
    angular_limit=None,
) -> Result1[str]:
    """RegularizeAdjacentBuildingFootprint(in_features, group, out_feature_class, {method}, {tolerance}, {precision}, {angular_limit})

       Regularizes building footprints that have common boundaries.

    INPUTS:
     in_features (Feature Layer):
         The input features that will be processed.
     group (Field):
         The field that will be used to determine which features share
         coincident, non-overlapping boundaries.
     method {String}:
         The method that will be used to regularize the input
         features.RIGHT_ANGLES-Identifies the best line segments that fit the
         input
         feature vertices along 90° and 180°
         angles.RIGHT_ANGLES_AND_DIAGONALS-Identifies the best line segments
         that fit
         the input feature vertices along 90°, 135°, and 180° interior
         angles.ANY_ANGLES-Identifies the best fit line that falls along any
         angle
         while reducing the overall vertex count of the input features.
     tolerance {Linear Unit}:
         The maximum distance that the regularized footprint can deviate from
         the boundary of its originating feature.
     precision {Double}:
         The precision of the spatial grid that will be used in the
         regularization process. Valid values range from 0.05 to 0.25.
     angular_limit {Double}:
         The maximum deviation of the best fit line's interior angles
         that will be tolerated when using the(RIGHT_ANGLES_AND_DIAGONALS)
         method. This value should generally be kept to less than 5° to obtain
         best results. This parameter is disabled for other regularization
         methods. Right Angles and Diagonals

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RegularizeAdjacentBuildingFootprint_3d(
                *gp_fixargs((in_features, group, out_feature_class, method, tolerance, precision, angular_limit), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RegularizeBuildingFootprint_3d", None)
def RegularizeBuildingFootprint(
    in_features=None,
    out_feature_class=None,
    method: Literal["RIGHT_ANGLES", "RIGHT_ANGLES_AND_DIAGONALS", "ANY_ANGLE", "CIRCLE"] | None = None,
    tolerance=None,
    densification=None,
    precision=None,
    diagonal_penalty=None,
    min_radius=None,
    max_radius=None,
    alignment_feature=None,
    alignment_tolerance=None,
    tolerance_type: Literal["DISTANCE", "AREA_RATIO"] | None = None,
) -> Result1[str]:
    """RegularizeBuildingFootprint(in_features, out_feature_class, method, tolerance, {densification}, {precision}, {diagonal_penalty}, {min_radius}, {max_radius}, {alignment_feature}, {alignment_tolerance}, {tolerance_type})

       Normalizes the footprint of building polygons by eliminating
       undesirable artifacts in their geometry.

    INPUTS:
     in_features (Feature Layer):
         The polygons that represent the building footprints to be regularized.
     method (String):
         Specifies the regularization method that will be used in processing
         the input features.RIGHT_ANGLES-Shapes composed of 90° angles between
         adjoining edges
         will be constructed.RIGHT_ANGLES_AND_DIAGONALS-Shapes composed of 45°
         and 90° angles
         between adjoining edges will be constructed.ANY_ANGLE-Shapes that form
         any angles between adjoining edges will be
         constructed.CIRCLE-The best fitting circle around the input features
         will be
         constructed.
     tolerance (Double):
         For most methods, this value represents the maximum distance that the
         regularized footprint can deviate from the boundary of its originating
         feature. The specified value will be based on the linear units of the
         input feature's coordinate system. When using the CIRCLE method, this
         option can also be interpreted as a ratio of the difference between
         the original feature and its regularized result against the area of
         the regularized result based on the selection that is made in the
         tolerance_type parameter.
     densification {Double}:
         The sampling interval that will be used to evaluate whether the
         regularized feature will be straight or bent. The densification must
         be equal to or less than the tolerance value.This parameter is only
         used with methods that support right angle
         identification.
     precision {Double}:
         The precision of the spatial grid that will be used in the
         regularization process. Valid values range from 0.05 to 0.25.
     diagonal_penalty {Double}:
         When the RIGHT_ANGLES_AND_DIAGONALS method is used, this value
         identifies the likelihood of constructing right angles or diagonal
         edges between two adjoining segments. When the ANY_ANGLES method is
         used, this value identifies the likelihood of constructing diagonal
         edges that do not conform to the preferred edges determined by the
         tool's algorithm. Generally, the higher the value, the less likely a
         diagonal edge will be constructed.
     min_radius {Double}:
         The smallest radius allowed for a regularized circle. A value of 0
         implies that there is no minimum size limit. This option is only
         available with the CIRCLE method.
     max_radius {Double}:
         The largest radius allowed for a regularized circle. This option is
         only available with the CIRCLE method.
     alignment_feature {Feature Layer}:
         The line feature that will be used to align the orientation of the
         regularized polygons. Each polygon will only be aligned to one line
         feature.
     alignment_tolerance {Linear Unit}:
         The maximum distance threshold that will be used for finding the
         nearest alignment feature. For example, a value of 20 meters means the
         nearest line that is within 20 meters will be used to align the
         regularized polygon.
     tolerance_type {String}:
         Specifies how tolerance will be applied when the method parameter is
         set to CIRCLE.DISTANCE-The tolerance will represent the maximum
         distance from the
         boundary of the feature being processed. This is the
         default.AREA_RATIO-The tolerance will represent the maximum limit for
         the
         ratio between the area of the original feature that differs from the
         regularized circle and the area of the regularized circle.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RegularizeBuildingFootprint_3d(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        method,
                        tolerance,
                        densification,
                        precision,
                        diagonal_penalty,
                        min_radius,
                        max_radius,
                        alignment_feature,
                        alignment_tolerance,
                        tolerance_type,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# 3D Features\Interpolation toolset
@gptooldoc("InterpolatePolyToPatch_3d", None)
def InterpolatePolyToPatch(
    in_surface=None,
    in_feature_class=None,
    out_feature_class=None,
    max_strip_size=None,
    z_factor=None,
    area_field=None,
    surface_area_field=None,
    pyramid_level_resolution=None,
) -> Result1[str]:
    """InterpolatePolyToPatch(in_surface, in_feature_class, out_feature_class, {max_strip_size}, {z_factor}, {area_field}, {surface_area_field}, {pyramid_level_resolution})

       Creates surface-conforming multipatch features by draping polygon
       features over a surface.

    INPUTS:
     in_surface (TIN Layer / Terrain Layer):
         The input triangulated irregular network (TIN) or terrain dataset
         surface.
     in_feature_class (Feature Layer):
         The input polygon feature.
     max_strip_size {Long}:
         Controls the maximum number of points used to create an individual
         triangle strip. Note that each multipatch is usually composed of
         multiple strips. The default value is 1,024.
     z_factor {Double}:
         The factor by which z-values will be multiplied. This is typically
         used to convert z linear units to match x,y linear units. The default
         is 1, which leaves elevation values unchanged. This parameter is not
         available if the spatial reference of the input surface has a z-datum
         with a specified linear unit.
     area_field {String}:
         The name of the output field containing the planimetric, or 2D, area
         of the resulting multipatches.
     surface_area_field {String}:
         The name of the output field containing the 3D area of the resulting
         multipatches. This area takes the surface undulations into
         consideration and is always larger than the planimetric area unless
         the surface is flat, in which case, the two are equal.
     pyramid_level_resolution {Double}:
         The z-tolerance or window-size resolution of the terrain pyramid level
         that will be used. The default is 0, or full resolution.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output multipatch feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.InterpolatePolyToPatch_3d(
                *gp_fixargs(
                    (
                        in_surface,
                        in_feature_class,
                        out_feature_class,
                        max_strip_size,
                        z_factor,
                        area_field,
                        surface_area_field,
                        pyramid_level_resolution,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("InterpolateShape_3d", None)
def InterpolateShape(
    in_surface=None,
    in_feature_class=None,
    out_feature_class=None,
    sample_distance=None,
    z_factor=None,
    method: Literal[
        "LINEAR",
        "NATURAL_NEIGHBORS",
        "CONFLATE_ZMIN",
        "CONFLATE_ZMAX",
        "CONFLATE_NEAREST",
        "CONFLATE_CLOSEST_TO_MEAN",
        "BILINEAR",
        "NEAREST",
    ]
    | None = None,
    vertices_only: Literal["VERTICES_ONLY", "DENSIFY"] | None = None,
    pyramid_level_resolution=None,
    preserve_features: Literal["PRESERVE", "EXCLUDE"] | None = None,
) -> Result1[str]:
    """InterpolateShape(in_surface, in_feature_class, out_feature_class, {sample_distance}, {z_factor}, {method}, {vertices_only}, {pyramid_level_resolution}, {preserve_features})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.InterpolateShape_3d(
                *gp_fixargs(
                    (
                        in_surface,
                        in_feature_class,
                        out_feature_class,
                        sample_distance,
                        z_factor,
                        method,
                        vertices_only,
                        pyramid_level_resolution,
                        preserve_features,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateFeatureZ_3d", None)
def UpdateFeatureZ(
    in_features=None,
    in_surface=None,
    method: Literal[
        "LINEAR",
        "NATURAL_NEIGHBORS",
        "CONFLATE_ZMIN",
        "CONFLATE_ZMAX",
        "CONFLATE_NEAREST",
        "CONFLATE_CLOSEST_TO_MEAN",
        "BILINEAR",
    ]
    | None = None,
    status_field=None,
) -> Result1[str | Layer]:
    """UpdateFeatureZ(in_features, in_surface, {method}, {status_field})

       Updates the z-coordinates of 3D feature vertices using a surface.

    INPUTS:
     in_features (Feature Layer):
         The 3D features whose vertex z-values will be modified.
     in_surface (TIN Layer / Raster Layer / Mosaic Layer / LAS Dataset Layer):
         The surface that will be used to determine the new z-value for the 3D
         feature vertices.
     method {String}:
         Interpolation method used in determining information about the
         surface. The available options depend on the data type of the input
         surface:BILINEAR-An interpolation method exclusive to the raster
         surface,
         which determines cell values from the four nearest cells. This is the
         only option available for a raster surface.LINEAR-Default
         interpolation method for a TIN, terrain, and LAS
         dataset. Obtains elevation from the plane defined by the triangle that
         contains the XY location of a query point.NATURAL_NEIGHBORS-Obtains
         elevation by applying area-based weights to
         the natural neighbors of a query point.CONFLATE_ZMIN-Obtains
         elevation from the smallest z-value found among
         the natural neighbors of a query point.CONFLATE_ZMAX-Obtains
         elevation from the largest z-value found among
         the natural neighbors of a query point.CONFLATE_NEAREST-Obtains
         elevation from the nearest value among the
         natural neighbors of a query point.CONFLATE_CLOSEST_TO_MEAN-Obtains
         elevation from the z-value that is
         closest to the average of all the natural neighbors of a query point.
     status_field {Field}:
         An existing numeric field that will be populated with values to
         reflect whether the feature's vertices were successfully updated. A
         value of 1 would be specified for updated features and 0 for features
         that were not updated. Features that partially overlap the surface
         will not be updated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpdateFeatureZ_3d(*gp_fixargs((in_features, in_surface, method, status_field), True))
        )
        return retval
    except Exception as e:
        raise e


# 3D Intersections toolset
@gptooldoc("FenceDiagram_3d", None)
def FenceDiagram(
    in_line_features=None,
    in_surface=None,
    out_feature_class=None,
    method: Literal["LINEAR", "NATURAL_NEIGHBORS"] | None = None,
    floor_height=None,
    ceiling_height=None,
    sample_distance=None,
) -> Result1[str]:
    """FenceDiagram(in_line_features, in_surface;in_surface..., out_feature_class, {method}, {floor_height}, {ceiling_height}, {sample_distance})

       Constructs a vertical cross section of a collection of surfaces.

    INPUTS:
     in_line_features (Feature Layer):
         The line features that will be used to construct the fence diagram.
     in_surface (TIN Layer / Raster Layer / Mosaic Layer):
         The raster and TIN surfaces that will be used to construct the fence
         diagram.
     method {String}:
         Specifies the interpolation method that will be used to obtain
         z-values from TIN surfaces when constructing the fence diagram. This
         parameter does not apply to raster surfaces.LINEAR-Linear
         interpolation will be used. This is the
         default.NATURAL_NEIGHBORS-Natural neighbors interpolation will be
         used.
     floor_height {Linear Unit}:
         A constant height that will be used to define the lowest height of the
         fence diagram.
     ceiling_height {Linear Unit}:
         A constant height that will be used to define the highest height of
         the fence diagram.
     sample_distance {Linear Unit}:
         The horizontal distance that will be used to determine the positions
         where height measurements are interpolated from the underlying
         surfaces.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output multipatch that is composed of vertical faces that depict
         the fence diagram."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FenceDiagram_3d(
                *gp_fixargs(
                    (
                        in_line_features,
                        in_surface,
                        out_feature_class,
                        method,
                        floor_height,
                        ceiling_height,
                        sample_distance,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Intersect3D_3d", None)
def Intersect3D(
    in_feature_class_1=None,
    out_feature_class=None,
    in_feature_class_2=None,
    output_geometry_type: Literal["SOLID", "SURFACE", "LINE"] | None = None,
) -> Result1[str]:
    """Intersect3D(in_feature_class_1, out_feature_class, {in_feature_class_2}, {output_geometry_type})

       Computes the intersection of multipatch features to produce closed
       multipatches encompassing the overlapping volumes, open multipatch
       features from the common surface areas, or lines from the intersecting
       edges.

    INPUTS:
     in_feature_class_1 (Feature Layer):
         The multipatch features that will be intersected. When only one input
         feature layer or feature class is provided, the output will indicate
         the intersection of its own features.
     in_feature_class_2 {Feature Layer}:
         The second multipatch feature layer or feature class that will
         intersect the first.
     output_geometry_type {String}:
         Specifies the type of intersection geometry that will be
         created.SOLID-A closed multipatch representing the overlapping volumes
         between
         input features will be created. This is the default.SURFACE-A
         multipatch surface representing shared faces between input
         features will be created.LINE-Lines representing shared edges between
         input features will be
         created.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Intersect3D_3d(
                *gp_fixargs((in_feature_class_1, out_feature_class, in_feature_class_2, output_geometry_type), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Intersect3DLineWithMultiPatch_3d", None)
def Intersect3DLineWithMultiPatch(
    in_line_features=None,
    in_multipatch_features=None,
    join_attributes: Literal["IDS_ONLY", "ALL"] | None = None,
    out_point_feature_class=None,
    out_line_feature_class=None,
) -> Result3[str, str, str]:
    """Intersect3DLineWithMultiPatch(in_line_features, in_multipatch_features, {join_attributes}, {out_point_feature_class}, {out_line_feature_class})

       Returns the number of geometric intersections between 3D line and
       multipatch features and also provides optional features that represent
       points of intersection and also divide the 3D lines at such points.

    INPUTS:
     in_line_features (Feature Layer):
         The line features that will be intersected with the multipatch
         features.
     in_multipatch_features (Feature Layer):
         The multipatch features that the lines will be intersected against.
     join_attributes {String}:
         The input line feature attributes that will be stored with the
         optional output features.IDS_ONLY-Only feature identification numbers
         will be stored. This is
         the default.ALL-All attributes will be stored.

    OUTPUTS:
     out_point_feature_class {Feature Class}:
         Optional features that represent points of intersection between the 3D
         line and multipatch.
     out_line_feature_class {Feature Class}:
         Optional line features that divide the input lines at each point of
         intersection with a multipatch feature."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Intersect3DLineWithMultiPatch_3d(
                *gp_fixargs(
                    (
                        in_line_features,
                        in_multipatch_features,
                        join_attributes,
                        out_point_feature_class,
                        out_line_feature_class,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Intersect3DLineWithSurface_3d", None)
def Intersect3DLineWithSurface(
    in_line_features=None,
    in_surfaces=None,
    out_line_feature_class=None,
    out_point_feature_class=None,
) -> Result2[str, str]:
    """Intersect3DLineWithSurface(in_line_features, in_surfaces;in_surfaces..., out_line_feature_class, {out_point_feature_class})

       Computes the geometric intersection of 3D line features and one or
       more surfaces to return the intersection as segmented line features
       and points.

    INPUTS:
     in_line_features (Feature Layer):
         The input 3D line features.
     in_surfaces (TIN Layer / Raster Layer / Mosaic Layer):
         One or more surfaces that will be used to determine intersections.
         Supported inputs are raster and TIN datasets.

    OUTPUTS:
     out_line_feature_class (Feature Class):
         The output line features that represent the input line features split
         at the points of intersection with the surface.
     out_point_feature_class {Feature Class}:
         The optional point features that represent the input line's
         intersection with a surface ."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Intersect3DLineWithSurface_3d(
                *gp_fixargs((in_line_features, in_surfaces, out_line_feature_class, out_point_feature_class), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Intersect3DLines_3d", None)
def Intersect3DLines(
    in_lines=None,
    max_z_diff=None,
    join_attributes: Literal["NO_FID", "ONLY_FID", "ALL"] | None = None,
    out_point_fc=None,
    out_line_fc=None,
) -> Result3[str, str, str]:
    """Intersect3DLines(in_lines;in_lines..., {max_z_diff}, {join_attributes}, {out_point_fc}, {out_line_fc})

       Computes the intersecting and overlapping segments of lines in 3D
       space.

    INPUTS:
     in_lines (Feature Layer):
         The line features that will be evaluated for intersections. The input
         can consist of either one or two line feature layers or classes. If
         one input is specified, each feature will be compared with all other
         features in that feature class. No feature will be compared to itself.
     max_z_diff {Linear Unit}:
         The maximum vertical distance between line segments that intersect.
     join_attributes {String}:
         Specifies the attributes from the input features that will be
         transferred to the output feature class.ALL-All the attributes from
         the input features will be transferred to
         the output feature class. This is the default.NO_FID-All the
         attributes except the FID attribute from the input
         features will be transferred to the output feature class.ONLY_FID-Only
         the FID attribute from the input features will be
         transferred to the output feature class.

    OUTPUTS:
     out_point_fc {Feature Class}:
         The output points representing the locations where the input lines
         intersect, including locations where overlapping line segments begin
         and end.
     out_line_fc {Feature Class}:
         The output lines representing the overlapping sections that exist
         between the input lines."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Intersect3DLines_3d(
                *gp_fixargs((in_lines, max_z_diff, join_attributes, out_point_fc, out_line_fc), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("StackProfile_3d", None)
def StackProfile(
    in_line_features=None,
    profile_targets=None,
    out_table=None,
    out_graph=None,
) -> Result2[str, str]:
    """StackProfile(in_line_features, profile_targets;profile_targets..., out_table, {out_graph})

       Creates a table and optional graph denoting the profile of line
       features over one or more multipatch, raster, TIN, or terrain
       surfaces.

    INPUTS:
     in_line_features (Feature Layer):
         The line features that will be profiled over the surface inputs.
     profile_targets (Feature Layer / TIN Layer / Raster Layer / Mosaic Layer / Terrain Layer / LAS Dataset Layer):
         The data being profiled, which can be comprised from any combination
         of multipatch features, raster, and triangulated surface models.

    OUTPUTS:
     out_table (Table):
         The output table that will store the height interpolated for each
         profile target that intersects the input line.
     out_graph {Graph}:
         The output graph is not supported in Pro."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.StackProfile_3d(*gp_fixargs((in_line_features, profile_targets, out_table, out_graph), True))
        )
        return retval
    except Exception as e:
        raise e


# 3D Proximity toolset
@gptooldoc("Buffer3D_3d", None)
def Buffer3D(
    in_features=None,
    out_feature_class=None,
    buffer_distance_or_field=None,
    buffer_joint_type: Literal["STRAIGHT", "ROUND"] | None = None,
    buffer_quality=None,
    simplification_tolerance=None,
) -> Result1[str]:
    """Buffer3D(in_features, out_feature_class, buffer_distance_or_field, {buffer_joint_type}, {buffer_quality}, {simplification_tolerance})

       Creates a 3D buffer around points or lines to produce spherical or
       cylindrical multipatch features.

    INPUTS:
     in_features (Feature Layer):
         The line or point features that will be buffered.
     buffer_distance_or_field (Linear Unit / Field):
         The radial distance around the input features that will be buffered.
         Distances can be provided as either a value representing a linear
         distance or a field from the input features that contains the distance
         to buffer each feature.If no linear units are specified or are entered
         as Unknown, the linear
         unit of the input features' spatial reference will be used.
     buffer_joint_type {String}:
         Specifies the shape of the buffer between the vertices of the line
         segments. This parameter is only valid for input line
         features.STRAIGHT-The shape of connections between vertices will be
         straight.
         This is the default.ROUND-The shape of connections between vertices
         will be round.
     buffer_quality {Long}:
         The number of segments that will be used to represent the resulting
         multipatch features. A higher value produces smoother 3D features but
         lengthens the processing time. Any number in the range of 6 to 60 can
         be provided. The default is 20.
     simplification_tolerance {Linear Unit}:
         Simplifies the input lines by maintaining their shape within the
         specified offset of its original form. Simplification will not occur
         if no tolerance value is specified.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output multipatch containing the 3D buffers."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Buffer3D_3d(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        buffer_distance_or_field,
                        buffer_joint_type,
                        buffer_quality,
                        simplification_tolerance,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateClearanceSurface_3d", None)
def GenerateClearanceSurface(
    in_3d_features=None,
    horizontal_clearance=None,
    vertical_clearance=None,
    out_surface=None,
    cell_size=None,
    overlap_method: Literal["MINIMUM", "MAXIMUM"] | None = None,
    flare_angle=None,
    flare_distance=None,
) -> Result1[str]:
    """GenerateClearanceSurface(in_3d_features, horizontal_clearance, vertical_clearance, out_surface, cell_size, {overlap_method}, {flare_angle}, {flare_distance})

       Generates a raster surface modeling the clearance zone around 3D line
       features.

    INPUTS:
     in_3d_features (Feature Layer):
         The 3D line features that will be used to generate the clearance zone.
     horizontal_clearance (Linear Unit):
         The horizontal displacement of the clearance zone from each side of
         the input features.
     vertical_clearance (Linear Unit):
         The vertical displacement of the clearance zone from each input
         feature. The direction of the vertical displacement is indicated by
         the overlap_method parameter value. If the MINIMUM option is
         specified, the vertical displacement will be lower than the input
         features. If the MAXIMUM option is specified, the displacement will be
         higher than the input features.
     cell_size (Linear Unit):
         The cell size of the output raster surface.
     overlap_method {String}:
         Specifies the method that will be used to define the clearance zone in
         places where the zone around multiple features overlap.MINIMUM-The
         lowest clearance will be used to define the clearance
         zone. This is the default.MAXIMUM-The highest clearance will be used
         to define the clearance
         zone.
     flare_angle {Double}:
         The arithmetic angle that defines the direction of the flare at the
         end of the clearance zone. A positive value indicates the flare angle
         will extend upward, and a negative value indicates the flare will
         extend downward.
     flare_distance {Linear Unit}:
         The 3D length that will extend from the edge of the clearance zone
         along the direction provided by the flare_angle parameter. A flare
         angle of 45° and a flare distance of 7 meters mean the edge of the
         clearance zone defined by its horizontal distance will extended by 7
         meters at an upward angle of 45°.

    OUTPUTS:
     out_surface (Raster Dataset):
         The output raster surface that represents the clearance zone."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateClearanceSurface_3d(
                *gp_fixargs(
                    (
                        in_3d_features,
                        horizontal_clearance,
                        vertical_clearance,
                        out_surface,
                        cell_size,
                        overlap_method,
                        flare_angle,
                        flare_distance,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Inside3D_3d", None)
def Inside3D(
    in_target_feature_class=None,
    in_container_feature_class=None,
    out_table=None,
    complex_output: Literal["COMPLEX", "SIMPLE"] | None = None,
) -> Result1[str]:
    """Inside3D(in_target_feature_class, in_container_feature_class, out_table, {complex_output})

       Determines if 3D features from an input feature class are contained
       inside a closed multipatch, and writes an output table recording the
       features that are partially or fully inside the multipatch.

    INPUTS:
     in_target_feature_class (Feature Layer):
         The input multipatch or 3D point, line, or polygon feature class.
     in_container_feature_class (Feature Layer):
         The closed multipatch features that will be used as the containers for
         the input features.
     complex_output {Boolean}:
         Specifies if the output table will identify the relationship
         between theand thethrough the creation of afield that identifies the
         multipatch feature that contains the input feature. Input
         FeaturesInput Multipatch FeaturesContain_IDChecked-The multipatch
         feature that contains an input feature will be
         identified.Unchecked-The multipatch feature that contains an input
         feature will
         not be identified. This is the default. Specifies if the output
         table will identify the relationship
         between theand thethrough the creation of afield that identifies the
         multipatch feature that contains the input feature. Input
         FeaturesInput Multipatch FeaturesContain_IDCOMPLEX-The multipatch
         feature that contains an input feature will be
         identified.SIMPLE-The multipatch feature that contains an input
         feature will not
         be identified. This is the default.

    OUTPUTS:
     out_table (Table):
         The output table providing a list of 3Dthat are inside or
         partially inside thewhich are closed. The output table contains
         an(object ID),, andfield. Thefield will state if the input feature ()
         is inside or partially inside a multipatch. Input FeaturesInput
         Multipatch FeaturesOBJECTIDTarget_IDStatusStatusTarget_ID"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Inside3D_3d(
                *gp_fixargs((in_target_feature_class, in_container_feature_class, out_table, complex_output), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("LocateLasPointsByProximity_3d", None)
def LocateLasPointsByProximity(
    in_las_dataset=None,
    in_features=None,
    search_radius=None,
    count_field=None,
    out_features=None,
    geometry: Literal["MULTIPOINT", "POINT"] | None = None,
    class_code=None,
    compute_stats: Literal["COMPUTE_STATS", "NO_COMPUTE_STATS"] | None = None,
    update_pyramid: Literal["UPDATE_PYRAMID", "NO_UPDATE_PYRAMID"] | None = None,
) -> Result3[str, str | Layer, str | Layer]:
    """LocateLasPointsByProximity(in_las_dataset, in_features, {search_radius}, {count_field}, {out_features}, {geometry}, {class_code}, {compute_stats}, {update_pyramid})

       Identifies LAS points within the three-dimensional proximity of
       z-enabled features along with the option to reclassify those points.

    INPUTS:
     in_las_dataset (LAS Dataset Layer):
         The LAS dataset that will be processed.
     in_features (Feature Layer):
         The 3D point, line, polygon, or multipatch features whose proximity
         will be used for identifying LAS points.
     search_radius {Linear Unit / Field}:
         The distance around the input features that will be evaluated
         for the presence of LAS points, which can be provided as either a
         linear distance or a numeric field in the input feature's attribute
         table. If the search radius is derived from a field or a linear
         distance whose units are specified as, the linear unit of the input
         features' XY spatial reference is used. Unknown
     count_field {String}:
         The name of the field that will be added to the input
         feature's attribute table and populated with the number of LAS points
         in each feature's proximity. The default field name is. COUNT
     geometry {String}:
         Specifies the geometry of the output point features that represent the
         LAS points found within the specified proximity of the input
         features.MULTIPOINT-Multipoint features that will have multiple points
         in each
         row.POINT-Single-point features that will have a unique row for each
         identified LAS point.
     class_code {Long}:
         The class code value that will be used to reclassify the points found
         within the search radius of the input features.
     compute_stats {Boolean}:
         Specifies whether statistics will be computed for the .las files
         referenced by the LAS dataset. Computing statistics provides a spatial
         index for each .las file, which improves analysis and display
         performance. Statistics also enhance the filtering and symbology
         experience by limiting the display of LAS attributes, such as
         classification codes and return information, to values that are
         present in the .las file.COMPUTE_STATS-Statistics will be computed.
         This is the
         default.NO_COMPUTE_STATS-Statistics will not be computed.
     update_pyramid {Boolean}:
         Specifies whether the LAS dataset pyramid will be updated after the
         class codes are modified.UPDATE_PYRAMID-The LAS dataset pyramid will
         be updated. This is the
         default.NO_UPDATE_PYRAMID-The LAS dataset pyramid will not be updated.

    OUTPUTS:
     out_features {Feature Class}:
         The point features that represent the LAS points detected within the
         specified proximity of the input features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LocateLasPointsByProximity_3d(
                *gp_fixargs(
                    (
                        in_las_dataset,
                        in_features,
                        search_radius,
                        count_field,
                        out_features,
                        geometry,
                        class_code,
                        compute_stats,
                        update_pyramid,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Near3D_3d", None)
def Near3D(
    in_features=None,
    near_features=None,
    search_radius=None,
    location: Literal["LOCATION", "NO_LOCATION"] | None = None,
    angle: Literal["ANGLE", "NO_ANGLE"] | None = None,
    delta: Literal["DELTA", "NO_DELTA"] | None = None,
) -> Result1[str | Layer]:
    """Near3D(in_features, near_features;near_features..., {search_radius}, {location}, {angle}, {delta})

       Calculates the three-dimensional distance from each input feature to
       the nearest feature that resides in one or more near feature classes.

    INPUTS:
     in_features (Feature Layer):
         The input feature class whose features will be attributed with
         information about the nearest feature.
     near_features (Feature Layer):
         The one or more features whose proximity to the input features
         will be calculated. If multiple feature classes are specified, an
         additional field namedwill be added to the input feature class to
         identify which near feature class contained the closest feature.
         NEAR_FC
     search_radius {Linear Unit}:
         The maximum distance for which the nearest features from a given input
         will be determined. If no value is specified, the nearest feature at
         any distance will be determined.
     location {Boolean}:
         Determines whether the coordinates of the nearest point in the input
         and near feature will be added to the input's attribute
         table.NO_LOCATION-The coordinates are not added to the input feature.
         This
         is the default.LOCATION-The coordinates are added to the input
         feature.
     angle {Boolean}:
         Determines whether the horizontal arithmetic angle and vertical angle
         between the input feature and the nearest feature will be added to the
         input attribute table.NO_ANGLE-The angles will not be added to the
         input's attribute table.
         This is the default. ANGLE-The horizontal arithmetic angle and
         vertical angle will
         be added to theandfields in the input's attribute table.
         NEAR_ANG_HNEAR_ANG_V
     delta {Boolean}:
         Determines whether the distances along the X, Y, and Z axes between
         the input feature and the nearest feature will be added to the input
         attribute table.NO_DELTA-No distances will be added to the input
         attribute table. This
         is the default. DELTA-Distances along the X, Y, and Z axes
         will be calculated
         in the,, andfields. NEAR_DELTXNEAR_DELTYNEAR_DELTZ"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Near3D_3d(*gp_fixargs((in_features, near_features, search_radius, location, angle, delta), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Union3D_3d", None)
def Union3D(
    in_feature_class=None,
    out_feature_class=None,
    group_field=None,
    disable_optimization: Literal["DISABLE", "ENABLE"] | None = None,
    output_all: Literal["ENABLE", "DISABLE"] | None = None,
    out_table=None,
) -> Result2[str, str]:
    """Union3D(in_feature_class, out_feature_class, {group_field}, {disable_optimization}, {output_all}, {out_table})

       Merges closed, overlapping multipatch features from an input feature
       class.

    INPUTS:
     in_feature_class (Feature Layer):
         The multipatch features that will be unioned.
     group_field {Field}:
         The field that will be used to identify the features to group
         together.
     disable_optimization {Boolean}:
         Specifies whether optimization will be performed on the input data.
         Optimization will preprocess the input data by grouping it to improve
         performance and create unique outputs for each set of overlapping
         features.ENABLE-Optimization will be performed on the input data. The
         grouping
         field will be ignored. This is the default.DISABLE-Optimization will
         not be performed on the input data. Features
         will either be stored in a single output feature or be unioned
         according to their grouping field, if one is provided.
     output_all {Boolean}:
         Specifies whether the output feature class will contain all features
         or only the overlapping features that were unioned.ENABLE-All input
         features will be written to the output. This is the
         default.DISABLE-Only unioned features will be written to the output.
         Nonoverlapping features will be ignored.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output multipatch feature class that will store the aggregated
         features.
     out_table {Table}:
         A many-to-one table that identifies the input features that contribute
         to each output."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Union3D_3d(
                *gp_fixargs(
                    (in_feature_class, out_feature_class, group_field, disable_optimization, output_all, out_table),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Area and Volume toolset
@gptooldoc("CutFill_3d", None)
def CutFill(
    in_before_surface=None,
    in_after_surface=None,
    out_raster=None,
    z_factor=None,
) -> Result1[str]:
    """CutFill(in_before_surface, in_after_surface, out_raster, {z_factor})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CutFill_3d(*gp_fixargs((in_before_surface, in_after_surface, out_raster, z_factor), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Difference3D_3d", None)
def Difference3D(
    in_features_minuend=None,
    in_features_subtrahend=None,
    out_feature_class=None,
    out_table=None,
) -> Result2[str, str]:
    """Difference3D(in_features_minuend, in_features_subtrahend, out_feature_class, {out_table})

       Eliminates portions of multipatch features in a target feature class
       that overlap with enclosed volumes of multipatch features in the
       subtraction feature class.

    INPUTS:
     in_features_minuend (Feature Layer):
         The multipatch features that will have features removed by the
         subtrahend features.
     in_features_subtrahend (Feature Layer):
         The multipatch features that will be subtracted from the input.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output multipatch feature class that will contain the resulting
         features.
     out_table {Table}:
         A table that stores information about the relationship between the
         input features and the difference output. The following fields will be
         created in this table:Output_ID-The ID of the output
         featureMinuend_ID-The ID of the input
         featureSubtrahend-The ID of the subtract feature"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Difference3D_3d(
                *gp_fixargs((in_features_minuend, in_features_subtrahend, out_feature_class, out_table), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExtrudeBetween_3d", None)
def ExtrudeBetween(
    in_tin1=None,
    in_tin2=None,
    in_feature_class=None,
    out_feature_class=None,
) -> Result1[str]:
    """ExtrudeBetween(in_tin1, in_tin2, in_feature_class, out_feature_class)

       Creates 3D features by extruding each input feature between two
       triangulated irregular network (TIN) datasets.

    INPUTS:
     in_tin1 (TIN Layer):
         The first input TIN.
     in_tin2 (TIN Layer):
         The second input TIN.
     in_feature_class (Feature Layer):
         The features that will be extruded between the TINs.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output that will store the extruded features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExtrudeBetween_3d(*gp_fixargs((in_tin1, in_tin2, in_feature_class, out_feature_class), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MinimumBoundingVolume_3d", None)
def MinimumBoundingVolume(
    in_features=None,
    z_value=None,
    out_feature_class=None,
    geometry_type: Literal["CONVEX_HULL", "SPHERE", "ENVELOPE", "CONCAVE_HULL"] | None = None,
    group: Literal["NONE", "ALL", "LIST"] | None = None,
    group_field=None,
    mbv_fields: Literal["MBV_FIELDS", "NO_MBV_FIELDS"] | None = None,
) -> Result1[str]:
    """MinimumBoundingVolume(in_features, z_value, out_feature_class, {geometry_type}, {group}, {group_field;group_field...}, {mbv_fields})

       Creates multipatch features that represent the volume of space
       occupied by a set of 3D features.

    INPUTS:
     in_features (Feature Layer / LAS Dataset Layer):
         The LAS dataset or 3D features whose minimum bounding volume will be
         evaluated.
     z_value (Field):
         The source of z-values for the input data.
     geometry_type {String}:
         Specifies the method that will be used to determine the geometry of
         the minimum bounding volume.CONVEX_HULL-The smallest convex region
         surrounding the input
         data.SPHERE-The smallest sphere enclosing the input data.ENVELOPE-The
         XYZ extent of the input data.CONCAVE_HULL-The concave hull that
         encloses the input data.
     group {String}:
         Specifies how the input features will be grouped; each group will be
         enclosed with one output multipatch.NONE-Input features will not be
         grouped. This is the default. This
         option is not available for point input.ALL-All input features will be
         treated as one group.LIST-Input features will be grouped based on
         their common values in
         the specified field or fields in the group field parameter.
     group_field {Field}:
         The field or fields in the input features that will be used to group
         features when LIST is specified as group_option. At least one group
         field is required for the LIST option. All features that have the same
         value in the specified field or fields will be treated as a group.
     mbv_fields {Boolean}:
         Specifies whether geometric attributes will be added to the output
         multipatch feature class.NO_MBV_FIELDS-No geometric attributes will be
         added to the output
         feature. This is the default.MBV_FIELDS-Geometric attributes will be
         added to the output feature.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MinimumBoundingVolume_3d(
                *gp_fixargs(
                    (in_features, z_value, out_feature_class, geometry_type, group, group_field, mbv_fields), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PolygonVolume_3d", None)
def PolygonVolume(
    in_surface=None,
    in_feature_class=None,
    in_height_field=None,
    reference_plane: Literal["ABOVE", "BELOW", "BOTH"] | None = None,
    out_volume_field=None,
    surface_area_field=None,
    pyramid_level_resolution=None,
    out_volume_above_field=None,
    out_volume_below_field=None,
    surface_area_above_field=None,
    surface_area_below_field=None,
) -> Result1[str | Layer]:
    """PolygonVolume(in_surface, in_feature_class, in_height_field, {reference_plane}, {out_volume_field}, {surface_area_field}, {pyramid_level_resolution}, {out_volume_above_field}, {out_volume_below_field}, {surface_area_above_field}, {surface_area_below_field})

       Calculates the volume and surface area between a polygon of a constant
       height and a surface.

    INPUTS:
     in_surface (TIN Layer / Terrain Layer / LAS Dataset Layer):
         The TIN, terrain, or LAS dataset surface that will be processed.
     in_feature_class (Feature Layer):
         The polygon features that define the region being processed.
     in_height_field (String):
         The field in the polygon's attribute table that defines the height of
         the reference plane that will be used in determining volumetric
         calculations.
     reference_plane {String}:
         Specifies the direction from the reference plane that volume and
         surface area will be calculated.ABOVE-Volume and surface area will be
         calculated above the reference
         plane height of the polygons.BELOW-Volume and surface area will be
         calculated below the reference
         plane height of the polygons. This is the default.BOTH-Volume and
         surface area will be calculated above and below the
         reference plane height of the polygons.
     out_volume_field {String}:
         The name of the field that will contain volumetric
         calculations. The default is. Volume
     surface_area_field {String}:
         The name of the field that will contain the surface area
         calculations. The default is. SArea
     pyramid_level_resolution {Double}:
         The z-tolerance or window-size resolution of the terrain pyramid level
         that will be used. The default is 0, or full resolution.
     out_volume_above_field {String}:
         The name of the field that will contain the volume calculated
         above the polygon height. The default is. Above_Vol
     out_volume_below_field {String}:
         The name of the field that will contain the volume calculated
         below the polygon height. The default is. Below_Vol
     surface_area_above_field {String}:
         The name of the field that will contain the surface area
         calculated above the polygon height. The default is. Above_SA
     surface_area_below_field {String}:
         The name of the field that will contain the surface area
         calculated below the polygon height. The default is. Below_SA"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PolygonVolume_3d(
                *gp_fixargs(
                    (
                        in_surface,
                        in_feature_class,
                        in_height_field,
                        reference_plane,
                        out_volume_field,
                        surface_area_field,
                        pyramid_level_resolution,
                        out_volume_above_field,
                        out_volume_below_field,
                        surface_area_above_field,
                        surface_area_below_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SurfaceDifference_3d", None)
def SurfaceDifference(
    in_surface=None,
    in_reference_surface=None,
    out_feature_class=None,
    pyramid_level_resolution=None,
    reference_pyramid_level_resolution=None,
    out_raster=None,
    raster_cell_size=None,
    out_tin_folder=None,
    out_tin_basename=None,
    method: Literal["MIN", "MAX", "CLOSEST_TO_MEAN"] | None = None,
    reference_method: Literal["MIN", "MAX", "CLOSEST_TO_MEAN"] | None = None,
    extent=None,
    boundary=None,
) -> Result2[str, str]:
    """SurfaceDifference(in_surface, in_reference_surface, out_feature_class, {pyramid_level_resolution}, {reference_pyramid_level_resolution}, {out_raster}, {raster_cell_size}, {out_tin_folder}, {out_tin_basename}, {method}, {reference_method}, {extent}, {boundary})

       Calculate the displacement between two surfaces to determine where one
       is above, below or the same as the other surface.

    INPUTS:
     in_surface (TIN Layer / Terrain Layer / LAS Dataset Layer):
         The triangulated surface whose relative displacement is being
         evaluated from the reference surface.
     in_reference_surface (TIN Layer / Terrain Layer / LAS Dataset Layer):
         The triangulated surface that will be used as the baseline for
         determining the relative displacement of the input surface.
     pyramid_level_resolution {Double}:
         The resolution that will be used to generate the input surface. For a
         terrain dataset, this will correspond to its pyramid-level
         definitions, where the default of 0 represents full resolution. For a
         LAS dataset, this value represents the length of each side of the
         square area that will be used to thin the LAS point returns.
     reference_pyramid_level_resolution {Double}:
         The resolution that will be used to generate the reference surface.
         For a terrain dataset, this will correspond to its pyramid-level
         definitions, where the default of 0 represents full resolution. For a
         LAS dataset, this value represents the length of each side of the
         square area that will be used to thin the LAS points returns.
     raster_cell_size {Double}:
         The cell size of the output raster.
     out_tin_folder {Folder}:
         The folder location for storing one or more TIN surfaces whose values
         represent the difference between the input and reference surface.
     out_tin_basename {String}:
         The base name given to each output TIN surface. If one TIN dataset is
         not sufficient to represent the data, multiple TINs will be created
         with the same base name.
     method {String}:
         The method used to select a LAS point in each analysis window when
         applying an analysis resolution to thin the input LAS dataset surface.
         The resulting points will be used to construct a triangulated
         surface.CLOSEST_TO_MEAN-The LAS point whose value is closest to the
         mean of
         all LAS points in the analysis window will be used. This is the
         default.MIN-The LAS point with the smallest z-value among all the LAS
         points
         in the analysis window.MAX-The LAS point with the highest z-value
         among all the LAS points in
         the analysis window.
     reference_method {String}:
         The method used to select a LAS point in each analysis window when
         applying an analysis resolution to thin the input LAS dataset surface.
         The resulting points will be used to construct a triangulated
         surface.CLOSEST_TO_MEAN-The LAS point whose value is closest to the
         mean of
         all LAS points in the analysis window will be used. This is the
         default.MIN-The LAS point with the smallest z-value among all the LAS
         points
         in the analysis window.MAX-The LAS point with the highest z-value
         among all the LAS points in
         the analysis window.
     extent {Extent}:
         The extent of the data that will be evaluated.MAXOF-The maximum extent
         of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     boundary {Feature Layer}:
         The polygon feature or features that will define the area to be
         processed.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class containing contiguous triangles and triangle
         parts that have the same classification grouped into polygons. The
         volume enclosed by each region of difference is listed in the
         attribute table.
     out_raster {Raster Dataset}:
         The output raster surface whose values represent the input surface
         normalized against the reference surface. Positive values reflect
         areas where the input surface is above the reference surface, whereas
         negative values indicate the areas where the input surface is below
         the reference surface. The raster's values are derived from a TIN
         using linear interpolation."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SurfaceDifference_3d(
                *gp_fixargs(
                    (
                        in_surface,
                        in_reference_surface,
                        out_feature_class,
                        pyramid_level_resolution,
                        reference_pyramid_level_resolution,
                        out_raster,
                        raster_cell_size,
                        out_tin_folder,
                        out_tin_basename,
                        method,
                        reference_method,
                        extent,
                        boundary,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SurfaceVolume_3d", None)
def SurfaceVolume(
    in_surface=None,
    out_text_file=None,
    reference_plane: Literal["ABOVE", "BELOW"] | None = None,
    base_z=None,
    z_factor=None,
    pyramid_level_resolution=None,
) -> Result1[str]:
    """SurfaceVolume(in_surface, {out_text_file}, {reference_plane}, {base_z}, {z_factor}, {pyramid_level_resolution})

       Calculates the area and volume of the region between a surface and a
       reference plane.

    INPUTS:
     in_surface (TIN Layer / Raster Layer / Mosaic Layer / Terrain Layer):
         The raster, TIN, or terrain surface that will be processed.
     reference_plane {String}:
         The direction from the reference plane for which to calculate the
         results.ABOVE-Volume and area calculations will represent the region
         of space
         between the specified plane height and the portions of the surface
         that are above the plane. This is the default.BELOW-Volume and area
         calculations will represent the region of space
         between the specified plane height and portions of the surface that
         are below the plane.
     base_z {Double}:
         The Z value of the plane that will be used to calculate area and
         volume.
     z_factor {Double}:
         The factor by which z-values will be multiplied. This is typically
         used to convert z linear units to match x,y linear units. The default
         is 1, which leaves elevation values unchanged. This parameter is not
         available if the spatial reference of the input surface has a z-datum
         with a specified linear unit.
     pyramid_level_resolution {Double}:
         The z-tolerance or window-size resolution of the terrain pyramid level
         that will be used. The default is 0, or full resolution.

    OUTPUTS:
     out_text_file {File}:
         A comma-delimited ASCII text file containing the area and volume
         calculations. If the file already exists, the new results will be
         appended to the file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SurfaceVolume_3d(
                *gp_fixargs(
                    (in_surface, out_text_file, reference_plane, base_z, z_factor, pyramid_level_resolution), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Point Cloud toolset
@gptooldoc("ColorizeLas_3d", None)
def ColorizeLas(
    in_las_dataset=None,
    in_image=None,
    bands=None,
    target_folder=None,
    name_suffix=None,
    las_version: Literal["1.2", "1.3", "1.4"] | None = None,
    point_format: Literal["7", "8"] | None = None,
    compression: Literal["NO_COMPRESSION", "ZLAS"] | None = None,
    rearrange_points: Literal["REARRANGE_POINTS", "NO_REARRANGE_POINTS"] | None = None,
    compute_stats: Literal["COMPUTE_STATS", "NO_COMPUTE_STATS"] | None = None,
    out_las_dataset=None,
) -> Result2[str, str]:
    """ColorizeLas(in_las_dataset, in_image, bands;bands..., target_folder, {name_suffix}, {las_version}, {point_format}, {compression}, {rearrange_points}, {compute_stats}, {out_las_dataset})

       Applies colors and near-infrared values from orthographic imagery to
       LAS points.

    INPUTS:
     in_las_dataset (LAS Dataset Layer):
         The LAS dataset that will be processed.
     in_image (Raster Layer / Mosaic Layer):
         The image that will be used to assign colors to LAS points.
     bands (Value Table):
         The bands from the input image that will be assigned to the color
         channels associated with the output LAS points.
     target_folder (Folder):
         The existing folder where the output .las files will be written.
     name_suffix {String}:
         The text that will be appended to the name of each output .las file.
         Each file will inherit its base name from its source file, followed by
         the suffix specified in this parameter.
     las_version {String}:
         The LAS version of the output files being created.1.2-LAS file version
         1.2 will be created.1.3-LAS file version 1.3 will
         be created.1.4-LAS file version 1.4 will be created. This is the
         default.
     point_format {Long}:
         The point record format of the output LAS files.2-Point record format
         2.3-Point record format 3 supports the storage
         of GPS time.7-Point record format 7. This is the default value and is
         only
         available for LAS version 1.48-Point record format 8 supports the
         storage of near-infrared values.
         This is only available for LAS version 1.4.
     compression {String}:
         Specifies whether the output .las file will be in a compressed format
         or the standard LAS format.NO_COMPRESSION-The output will be in the
         standard LAS format (*.las
         file). This is the default.ZLAS-Output .las files will be compressed
         in the zLAS format.
     rearrange_points {Boolean}:
         Specifies whether points in the .las or .zlas files will be rearranged
         to optimize the performance of reading and updating the classification
         of the point cloud.NO_REARRANGE_POINTS-The order of points will not be
         rearranged
         .REARRANGE_POINTS-The order of points will be rearranged into spatial
         clusters that optimize reading the data. Rearranged points can improve
         the performance of subsequent operations that are performed on the
         point cloud. This is the default.
     compute_stats {Boolean}:
         Specifies whether statistics will be computed for the .las files
         referenced by the LAS dataset. Computing statistics provides a spatial
         index for each .las file, which improves analysis and display
         performance. Statistics also enhance the filtering and symbology
         experience by limiting the display of LAS attributes, such as
         classification codes and return information, to values that are
         present in the .las file.COMPUTE_STATS-Statistics will be computed.
         This is the
         default.NO_COMPUTE_STATS-Statistics will not be computed.

    OUTPUTS:
     out_las_dataset {LAS Dataset}:
         The output LAS dataset referencing the newly created .las files."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ColorizeLas_3d(
                *gp_fixargs(
                    (
                        in_las_dataset,
                        in_image,
                        bands,
                        target_folder,
                        name_suffix,
                        las_version,
                        point_format,
                        compression,
                        rearrange_points,
                        compute_stats,
                        out_las_dataset,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExtractLas_3d", None)
def ExtractLas(
    in_las_dataset=None,
    target_folder=None,
    extent=None,
    boundary=None,
    process_entire_files: Literal["PROCESS_ENTIRE_FILES", "PROCESS_EXTENT"] | None = None,
    name_suffix=None,
    remove_vlr: Literal["REMOVE_VLR", "MAINTAIN_VLR"] | None = None,
    rearrange_points: Literal["REARRANGE_POINTS", "MAINTAIN_POINTS"] | None = None,
    compute_stats: Literal["COMPUTE_STATS", "NO_COMPUTE_STATS"] | None = None,
    out_las_dataset=None,
    compression: Literal["SAME_AS_INPUT", "NO_COMPRESSION", "ZLAS"] | None = None,
) -> Result2[str, str]:
    """ExtractLas(in_las_dataset, target_folder, {extent}, {boundary}, {process_entire_files}, {name_suffix}, {remove_vlr}, {rearrange_points}, {compute_stats}, {out_las_dataset}, {compression})

       Creates LAS files from point cloud data in a LAS dataset or point
       cloud scene layer.

    INPUTS:
     in_las_dataset (LAS Dataset Layer / Scene Layer / File):
         The LAS dataset, point cloud scene layer package (.slpk file), or I3S
         point cloud service that will be extracted. An I3S point cloud service
         must have the export property enabled to be processed.
     target_folder (Folder):
         The existing folder where the output .las files will be written.
     extent {Extent}:
         The extent of the data that will be evaluated.MAXOF-The maximum extent
         of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     boundary {Feature Layer}:
         A polygon boundary that will be used to clip the input point cloud.
         This boundary should represent a primary study area that is typically
         defined by one contiguous polygon, but it can also be composed of more
         than one polygon when it represents a common study area with a
         relevant spatial gap.
     process_entire_files {Boolean}:
         Specifies how the processing extent will be
         applied.PROCESS_EXTENT-Only LAS points that intersect the area of
         interest
         will be processed. This is the default.PROCESS_ENTIRE_FILES-If any
         portion of a .las file intersects the area
         of interest, all the points in that file, including those outside the
         area of interest, will be processed.
     name_suffix {String}:
         The text that will be appended to the name of each output .las file.
         Each file will inherit its base name from its source file, followed by
         the suffix provided in this parameter.
     remove_vlr {Boolean}:
         Specifies whether variable length records (VLRs) will be removed. Each
         .las file may contain a set of VLRs that were added by the software
         that produced it. The meaning of these records is typically only known
         by the originating software. Unless the output LAS data will be
         processed by an application that understands this information,
         retaining the VLRs may not provide any value-added functionality.
         Removing the VLRs may save significant disk space depending on their
         total size and the number of files containing them.MAINTAIN_VLR-Any
         data stored in the processed .las file's variable
         length records will not be removed and will remain in the extracted
         files. This is the default.REMOVE_VLR-The additional variable length
         records will be removed from
         the .las files.
     rearrange_points {Boolean}:
         Specifies whether points in the .las or .zlas files will be rearranged
         to optimize the performance of reading and updating the classification
         of the point cloud.MAINTAIN_POINTS-The order of points will not be
         rearranged
         .REARRANGE_POINTS-The order of points will be rearranged into spatial
         clusters that optimize reading the data. Rearranged points can improve
         the performance of subsequent operations that are performed on the
         point cloud. This is the default.
     compute_stats {Boolean}:
         Specifies whether statistics will be computed for the .las files
         referenced by the LAS dataset. Computing statistics provides a spatial
         index for each .las file, which improves analysis and display
         performance. Statistics also enhance the filtering and symbology
         experience by limiting the display of LAS attributes, such as
         classification codes and return information, to values that are
         present in the .las file.COMPUTE_STATS-Statistics will be computed.
         This is the
         default.NO_COMPUTE_STATS-Statistics will not be computed.
     compression {String}:
         Specifies whether the output .las file will be in a compressed format
         or the standard LAS format.SAME_AS_INPUT-The compression will be the
         same as the input. This
         option is only available when the input is a LAS dataset, and it is
         the default in that case.NO_COMPRESSION-The output will be in the
         standard LAS format (*.las
         file). This is the default when the input is a point cloud scene
         layer.ZLAS-Output .las files will be compressed in the zLAS format.

    OUTPUTS:
     out_las_dataset {LAS Dataset}:
         The output LAS dataset referencing the newly created .las files."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExtractLas_3d(
                *gp_fixargs(
                    (
                        in_las_dataset,
                        target_folder,
                        extent,
                        boundary,
                        process_entire_files,
                        name_suffix,
                        remove_vlr,
                        rearrange_points,
                        compute_stats,
                        out_las_dataset,
                        compression,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExtractObjectsFromPointCloud_3d", None)
def ExtractObjectsFromPointCloud(
    in_point_cloud=None,
    class_codes_to_extract=None,
    clustering_distance=None,
    out_features=None,
    geometry_type: Literal[
        "CENTERPOINT",
        "BOUNDING_CIRCLE",
        "BOUNDING_BOX_2D",
        "CONVEX_HULL_2D",
        "CONCAVE_HULL_2D",
        "BOUNDING_SPHERE",
        "BOUNDING_BOX_3D",
        "CONVEX_HULL_3D",
        "CONCAVE_HULL_3D",
    ]
    | None = None,
    min_points=None,
    vertical_scale_factor=None,
    alpha_calculation: Literal["PER_OBJECT", "ALL_OBJECTS"] | None = None,
    alpha_radius=None,
) -> Result1[str]:
    """ExtractObjectsFromPointCloud(in_point_cloud, class_codes_to_extract;class_codes_to_extract..., clustering_distance, out_features, {geometry_type}, {min_points}, {vertical_scale_factor}, {alpha_calculation}, {alpha_radius})

       Extracts distinct objects from a classified point cloud into point,
       polygon, or multipatch features.

    INPUTS:
     in_point_cloud (LAS Dataset Layer / Scene Layer / File):
         The classified LAS dataset, point cloud scene layer package, or point
         cloud I3S service that will be used to detect objects.
     class_codes_to_extract (Value Table):
         The class codes that will be processed to identify objects. A common
         group ID can be assigned to group multiple class codes into the same
         object.
     clustering_distance (Linear Unit):
         The three-dimensional distance that will be used to identify the
         points that belong to the same object.
     geometry_type {String}:
         Specifies the type of geometry that will be created for each object.
         The specified type will determine whether the objects will be
         represented as points, polygons, or multipatch
         features.CENTERPOINT-Three-dimensional points will be generated that
         represent
         each object with a point that is created approximately in the middle
         of the object's convex hull.BOUNDING_CIRCLE-Two-dimensional polygons
         will be generated that
         represent each object with the minimum bounding circle that surrounds
         its points.BOUNDING_BOX_2D-Two-dimensional polygons will be generated
         that
         represent each object with the smallest oriented bounding box that
         contains its points.CONVEX_HULL_2D-Two-dimensional polygons will be
         generated that
         represent each object with the convex hull that contains its
         points.CONCAVE_HULL_2D-Two-dimensional polygons will be generated that
         represent each object with a concave hull that encompasses its
         points.BOUNDING_SPHERE-Multipatch features will be generated that
         represent
         each object with a minimum bounding sphere that encompasses its
         points.BOUNDING_BOX_3D-Multipatch features will be generated that
         represent
         each object with the smallest oriented bounding box that contains its
         points.CONVEX_HULL_3D-Multipatch features will be generated that
         represent
         each object with the convex hull that surrounds its points. This is
         the default.CONCAVE_HULL_3D-Multipatch features will be generated that
         represent
         each object with the concave hull that surrounds its points. This
         option approximates the closest fitting geometry that can be generated
         from the points.
     min_points {Long}:
         The minimum number of points that an object must have for it to
         generate an output. The default value is 10.
     vertical_scale_factor {Double}:
         The scale factor that will be applied to the z-values, which will
         impact how the clustering distance is applied along the z-axis and how
         points are clustered into objects. The default value is 1 with valid
         values ranging from 0.0 to 10.0. A scale factor of 0 will result in
         two-dimensional clustering; a scale factor that is smaller than 1 but
         larger than 0 will result in a larger z-range for each object.
         Likewise, a vertical scale factor that is greater than 1 will result
         in points along the z-axis being clustered over a shorter distance.
         The vertical scale factor only applies to how the points are
         clustered. The geometry of the points will not be modified and the
         z-units will not be altered.
     alpha_calculation {Boolean}:
         Specifies whether the alpha radius will be calculated for each object
         or if the same alpha radius will be applied to all objects.This
         parameter is only enabled when the geometry_type parameter is set
         to CONCAVE_HULL_2D or CONCAVE_HULL_3D.PER_OBJECT-A unique alpha radius
         will be calculated for each
         object.ALL_OBJECTS-The same alpha radius will be used for all objects.
         When
         this option is specified, the alpha_radius parameter can be used to
         define this value. If no value is specified, an alpha radius will be
         calculated for the entire dataset. This is the default.
     alpha_radius {Linear Unit}:
         The alpha radius that will be used to define the alpha shape when
         constructing the object features.This parameter applies when the
         alpha_calculation parameter is set to
         ALL_OBJECTS and the geometry_type parameter is set to CONCAVE_HULL_2D
         or CONCAVE_HULL_3D.A larger alpha radius will create a more unified
         object feature with
         simpler boundaries until the point of reaching the convex hull, while
         smaller values will encompass the object's points with greater detail
         while also increasing the likelihood of producing disconnected parts.
         When no alpha radius is defined, the value is derived from the
         clustering_distance and vertical_clustering_scale_factor
         parameters.See the Usage section in the tool help for more information
         about how
         the default alpha radius is derived.

    OUTPUTS:
     out_features (Feature Class):
         The output objects whose feature geometry may be point, polygon, or
         multipatch based on the geometry_type parameter value."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExtractObjectsFromPointCloud_3d(
                *gp_fixargs(
                    (
                        in_point_cloud,
                        class_codes_to_extract,
                        clustering_distance,
                        out_features,
                        geometry_type,
                        min_points,
                        vertical_scale_factor,
                        alpha_calculation,
                        alpha_radius,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ThinLas_3d", None)
def ThinLas(
    in_las_dataset=None,
    target_folder=None,
    thinning_dimension: Literal["2D", "3D"] | None = None,
    xy_resolution=None,
    z_resolution=None,
    point_selection_method: Literal[
        "CLOSEST_TO_CENTER",
        "CLASS_CODE",
        "PREDOMINANT_CLASS",
        "Z_MIN",
        "Z_MAX",
        "Z_MIN_MAX",
        "Z_AVERAGE",
        "INTENSITY_MIN",
        "INTENSITY_MAX",
        "INTENSITY_MIN_MAX",
        "INTENSITY_AVERAGE",
    ]
    | None = None,
    class_codes_weights=None,
    name_suffix=None,
    out_las_dataset=None,
    preserved_class_codes=None,
    preserved_flags: list[Literal["MODEL_KEY", "OVERLAP", "SYNTHETIC", "WITHHELD"]]
    | Literal["MODEL_KEY", "OVERLAP", "SYNTHETIC", "WITHHELD"]
    | str
    | None = None,
    preserved_returns: list[Literal["SINGLE", "LAST", "FIRST_OF_MANY", "LAST_OF_MANY"]]
    | Literal["SINGLE", "LAST", "FIRST_OF_MANY", "LAST_OF_MANY"]
    | str
    | None = None,
    excluded_class_codes=None,
    excluded_flags: list[Literal["MODEL_KEY", "OVERLAP", "SYNTHETIC", "WITHHELD"]]
    | Literal["MODEL_KEY", "OVERLAP", "SYNTHETIC", "WITHHELD"]
    | str
    | None = None,
    excluded_returns: list[Literal["SINGLE", "LAST", "FIRST_OF_MANY", "LAST_OF_MANY"]]
    | Literal["SINGLE", "LAST", "FIRST_OF_MANY", "LAST_OF_MANY"]
    | str
    | None = None,
    compression: Literal["NO_COMPRESSION", "ZLAS"] | None = None,
    remove_vlr: Literal["REMOVE_VLR", "MAINTAIN_VLR"] | None = None,
    rearrange_points: Literal["REARRANGE_POINTS", "MAINTAIN_POINTS"] | None = None,
    compute_stats: Literal["COMPUTE_STATS", "NO_COMPUTE_STATS"] | None = None,
) -> Result2[str, str]:
    """ThinLas(in_las_dataset, target_folder, thinning_dimension, xy_resolution, {z_resolution}, {point_selection_method}, {class_codes_weights;class_codes_weights...}, {name_suffix}, {out_las_dataset}, {preserved_class_codes;preserved_class_codes...}, {preserved_flags;preserved_flags...}, {preserved_returns;preserved_returns...}, {excluded_class_codes;excluded_class_codes...}, {excluded_flags;excluded_flags...}, {excluded_returns;excluded_returns...}, {compression}, {remove_vlr}, {rearrange_points}, {compute_stats})

       Creates new LAS files that contain a subset of LAS points from the
       input LAS dataset.

    INPUTS:
     in_las_dataset (LAS Dataset Layer):
         The LAS dataset that will be processed.
     target_folder (Folder):
         The existing folder where the output .las files will be written.
     thinning_dimension (String):
         The type of thinning operation that will be conducted.2D-Thinning will
         occur in tiles defined along the x,y-axis.3D-Thinning
         will occur in volumes of space defined by tiles along the
         x,y-axis, and height gradients along the z-axis. This is the default.
     xy_resolution (Linear Unit):
         The size of each side of the thinning tile along the x,y-axis.
     z_resolution {Linear Unit}:
         The height of each thinning region when using the 3D thinning method.
     point_selection_method {String}:
         The method used to determine which points are retained in each
         thinning region.CLOSEST_TO_CENTER-The LAS point that is closest to the
         center of the
         region being thinned. This is the default.CLASS_CODE-The LAS points
         with the class code that has the highest
         weight assigned.PREDOMINANT_CLASS-The LAS points with the most
         frequent class code
         value in the region being thinned.Z_MIN-The lowest LAS point in the
         region being thinned.Z_MAX-The highest LAS point in the region being
         thinned.Z_MIN_MAX-The highest and lowest LAS points in the region
         being
         thinned.Z_AVERAGE-The LAS point whose height is closest to the average
         of
         height of all points in the region being thinned.INTENSITY_MIN-The LAS
         point whose intensity value is the lowest among
         the points in the region being thinned.INTENSITY_MAX-The LAS point
         whose intensity value is the highest among
         the points in the region being thinned.INTENSITY_MIN_MAX-The two LAS
         points with the lowest and the highest
         intensity values among the points in the region being
         thinned.INTENSITY_AVERAGE-The LAS point whose intensity value is
         closest to
         the average of all intensity values from points in the region being
         thinned.
     class_codes_weights {Value Table}:
         The weights assigned to each class code that determine which
         points are retained in each thinning region. This parameter is only
         enabled when theoption is specified in theparameter. The class code
         with the highest weight will be retained in the thinning region. If
         two class codes with the same weight exist in a given thinning region,
         the class code with the smallest point source ID will be retained.
         Class Code WeightsPoint Selection Method
     name_suffix {String}:
         The name added to each output file.
     preserved_class_codes {Long}:
         The input LAS points with the specified class code values will not be
         thinned from the output LAS files.
     preserved_flags {String}:
         The input LAS points with the specified class flag designations will
         be preserved in the output LAS files.MODEL_KEY-Points with the model
         key class flag will be
         preserved.OVERLAP-Points with the overlap class flag will be
         preserved.SYNTHETIC-Points with the synthetic class flag will be
         preserved.WITHHELD-Points with the withheld class flag will be
         preserved.
     preserved_returns {String}:
         The input LAS points with the specified returns will be preserved in
         the output LAS files.SINGLE-All single return points will be
         included.LAST-All single and
         last returns will be included.FIRST_OF_MANY-All points that are the
         first of multiple returns will
         be included.LAST_OF_MANY-All points that are the last of multiple
         returns will be
         included.
     excluded_class_codes {Long}:
         The input LAS points with the specified class code values will be
         excluded from the output LAS files.
     excluded_flags {String}:
         The input LAS points with the specified class flag designations will
         be excluded from the output LAS files.MODEL_KEY-Points with the model
         key class flag will be
         excluded.OVERLAP-Points with the overlap class flag will be
         excluded.SYNTHETIC-Points with the synthetic class flag will be
         excluded.WITHHELD-Points with the withheld class flag will be
         excluded.
     excluded_returns {String}:
         The input LAS points with the specified returns will be excluded from
         the output LAS files.SINGLE-All single return points will be
         excluded.LAST-All single and
         last returns will be excluded.FIRST_OF_MANY-All points that are the
         first of multiple returns will
         be excluded.LAST_OF_MANY-All points that are the last of multiple
         returns will be
         excluded.
     compression {String}:
         Specifies whether the output .las file will be in a compressed format
         or the standard LAS format.NO_COMPRESSION-The output will be in the
         standard LAS format (*.las
         file). This is the default.ZLAS-Output .las files will be compressed
         in the zLAS format.
     remove_vlr {Boolean}:
         Indicates whether variable length records stored with the input LAS
         points will be preserved or eliminated in the output LAS
         data.MAINTAIN_VLR-Variable length records will be maintained in the
         output
         LAS points. This is the default.REMOVE_VLR-Variable length records
         will be removed from the output LAS
         points.
     rearrange_points {Boolean}:
         Indicates if LAS points will be stored in spatially organized
         clusters.MAINTAIN_POINTS-The order of the points in the LAS files will
         remain
         the same.REARRANGE_POINTS-The points in the LAS files will be
         rearranged. This
         is the default.
     compute_stats {Boolean}:
         Specifies whether statistics will be computed for the .las files
         referenced by the LAS dataset. Computing statistics provides a spatial
         index for each .las file, which improves analysis and display
         performance. Statistics also enhance the filtering and symbology
         experience by limiting the display of LAS attributes, such as
         classification codes and return information, to values that are
         present in the .las file.COMPUTE_STATS-Statistics will be computed.
         This is the
         default.NO_COMPUTE_STATS-Statistics will not be computed.

    OUTPUTS:
     out_las_dataset {LAS Dataset}:
         The output LAS dataset referencing the newly created .las files."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ThinLas_3d(
                *gp_fixargs(
                    (
                        in_las_dataset,
                        target_folder,
                        thinning_dimension,
                        xy_resolution,
                        z_resolution,
                        point_selection_method,
                        class_codes_weights,
                        name_suffix,
                        out_las_dataset,
                        preserved_class_codes,
                        preserved_flags,
                        preserved_returns,
                        excluded_class_codes,
                        excluded_flags,
                        excluded_returns,
                        compression,
                        remove_vlr,
                        rearrange_points,
                        compute_stats,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TileLas_3d", None)
def TileLas(
    in_las_dataset=None,
    target_folder=None,
    base_name=None,
    out_las_dataset=None,
    compute_stats: Literal["COMPUTE_STATS", "NO_COMPUTE_STATS"] | None = None,
    las_version: Literal["1.0", "1.1", "1.2", "1.3", "1.4"] | None = None,
    point_format: Literal["0", "1", "2", "3", "6", "7", "8"] | None = None,
    compression: Literal["NO_COMPRESSION", "ZLAS"] | None = None,
    las_options: list[Literal["REARRANGE_POINTS", "REMOVE_VLR", "REMOVE_EXTRA_BYTES"]]
    | Literal["REARRANGE_POINTS", "REMOVE_VLR", "REMOVE_EXTRA_BYTES"]
    | str
    | None = None,
    tile_feature=None,
    naming_method: Literal["XY_COORDS", "ROW_COLUMN", "ORDINAL"] | None = None,
    file_size=None,
    tile_width=None,
    tile_height=None,
    tile_origin=None,
) -> Result2[str, str]:
    """TileLas(in_las_dataset, target_folder, {base_name}, {out_las_dataset}, {compute_stats}, {las_version}, {point_format}, {compression}, {las_options;las_options...}, {tile_feature}, {naming_method}, {file_size}, {tile_width}, {tile_height}, {tile_origin})

       Creates a set of nonoverlapping LAS files whose horizontal extents are
       divided by a regular grid.

    INPUTS:
     in_las_dataset (LAS Dataset Layer):
         The LAS dataset that will be processed.
     target_folder (Folder):
         The folder where the tiled LAS files will be written.
     base_name {String}:
         The name that each output file will begin with.
     compute_stats {Boolean}:
         Specifies whether statistics will be computed for the .las files
         referenced by the LAS dataset. Computing statistics provides a spatial
         index for each .las file, which improves analysis and display
         performance. Statistics also enhance the filtering and symbology
         experience by limiting the display of LAS attributes, such as
         classification codes and return information, to values that are
         present in the .las file.COMPUTE_STATS-Statistics will be computed.
         This is the
         default.NO_COMPUTE_STATS-Statistics will not be computed.
     las_version {String}:
         Specifies the LAS file version of each output file.1.0-The LAS file
         version will be 1.0. This version supported 256
         unique class codes but did not have a predefined classification
         schema.1.1-The LAS file version will be 1.1. This version introduced a
         predefined classification scheme, and point record formats 0 and 1,
         and the synthetic classification flag for points that were derived
         from a source other than a lidar sensor.1.2-The LAS file version will
         be 1.2. This version featured support
         for GPS time and RGB records in point records 2 and 3.1.3-The LAS file
         version will be 1.3. This version added support for
         point records 4 and 5 for waveform data. However, waveform information
         is not read in ArcGIS. This is the default.1.4-The LAS file version
         will be 1.4. This version introduced point
         record formats 6 through 10, along with new class definitions, 256
         unique class codes, and the overlap classification flag.
     point_format {Long}:
         The point record format of the output LAS files. The available options
         will vary based on the LAS file version specified in the las_version
         parameter.
     compression {String}:
         Specifies whether the output LAS file will be in a compressed format
         or the standard LAS format.NO_COMPRESSION-The output will be in the
         standard LAS format (*.las
         file). This is the default.ZLAS-Output LAS files will be compressed in
         the zLAS format.
     las_options {String}:
         Specifies modifications that will be made to the output LAS
         files.REARRANGE_POINTS-LAS points will be arranged according to their
         spatial clustering.REMOVE_VLR-Variable-length records that are added
         after the header and
         the point records of each file will be
         removed.REMOVE_EXTRA_BYTES-Extra bytes that are present with each
         point record
         in the input LAS file will be removed.
     tile_feature {Feature Layer}:
         The polygon features that define the tile width and height to be used
         when tiling the lidar data. The polygons are presumed to be
         rectangular, and the first feature's extent is used to define the tile
         width and height.
     naming_method {String}:
         Specifies the method that will be used to provide a unique name for
         each output LAS file. Each file name will be appended to the text
         specified in the base_name parameter. When input features are used to
         define the tiling scheme, its text or numeric field names will also be
         included as a source for defining the file name.XY_COORDS-Each tile
         name will be appended with the x- and
         y-coordinates of its lower left corner in the format "<base
         name>_<x-coordinate>_<y-coordinate>". This is the
         default.ROW_COLUMN-The tile name will be assigned based on the row and
         column
         it belongs to in the overall tiling scheme. The rows increment from
         the bottom up, while the columns increment from left to right. The
         name will be in the format "<base name>_<row number>_<column
         number>".ORDINAL-The tile name will be assigned based on its order of
         creation
         starting from the bottom left and incrementing to the top right. The
         name will be in the format "<base name>_<order number>". The number of
         leading zeros in the order number will be based on the maximum number
         of files that is created.
     file_size {Double}:
         A value, which is expressed in megabytes, that represents the upper
         limit of the uncompressed file size of an output LAS tile with uniform
         point distribution across its entire extent. The default is 250, and
         the value is used to estimate the tile width and height.The value of
         this parameter will change when the tile_height and
         tile_height parameters are modified. When the tile_feature parameter
         is specified, this parameter will be ignored.
     tile_width {Linear Unit}:
         The width of each tile. This parameter is disabled when the
         tile_feature parameter is specified. If the tile width and height are
         both provided, the file_size parameter will be updated to reflect the
         size of the output that would be generated with these dimensions.
         Similarly, if the file_size parameter is modified, the tile width and
         height get updated to reflect this change.
     tile_height {Linear Unit}:
         The height of each tile. This parameter is disabled when the
         tile_feature parameter is specified. If the tile width and height are
         both provided, the file_size parameter will be updated to reflect the
         size of the output that would be generated with these dimensions.
         Similarly, if the file_size parameter is modified, the tile width and
         height get updated to reflect this change.
     tile_origin {Point}:
         The coordinates of the origin of the tiling grid. The default values
         are obtained from the lower left corner of the input LAS dataset. When
         input features are specified in the tile_feature parameter, the origin
         will be inherited from the lower left corner of the first feature, and
         this parameter will be ignored.

    OUTPUTS:
     out_las_dataset {LAS Dataset}:
         The new LAS dataset that references the tiled LAS files created by
         this tool. This parameter is optional."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TileLas_3d(
                *gp_fixargs(
                    (
                        in_las_dataset,
                        target_folder,
                        base_name,
                        out_las_dataset,
                        compute_stats,
                        las_version,
                        point_format,
                        compression,
                        las_options,
                        tile_feature,
                        naming_method,
                        file_size,
                        tile_width,
                        tile_height,
                        tile_origin,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Point Cloud\Classification toolset
@gptooldoc("ChangeLasClassCodes_3d", None)
def ChangeLasClassCodes(
    in_las_dataset=None,
    class_codes=None,
    compute_stats: Literal["COMPUTE_STATS", "NO_COMPUTE_STATS"] | None = None,
    extent=None,
    boundary=None,
    process_entire_files: Literal["PROCESS_ENTIRE_FILES", "PROCESS_EXTENT"] | None = None,
    update_pyramid: Literal["UPDATE_PYRAMID", "NO_UPDATE_PYRAMID"] | None = None,
) -> Result1[str | Layer]:
    """ChangeLasClassCodes(in_las_dataset, class_codes;class_codes..., {compute_stats}, {extent}, {boundary}, {process_entire_files}, {update_pyramid})

       Reassigns the classification codes and flags of .las and .zlas files.

    INPUTS:
     in_las_dataset (LAS Dataset Layer):
         The LAS dataset that will be processed.
     class_codes (Value Table):
         The class codes that will be modified and the change that will be made
         to their classification code and classification flags. A value of -1
         can be provided for the first column, which is the first item in the
         list, to modify all class codes.The existing class code, the new class
         code, and the new class flag
         can be represented as a space-delimited string or a list of lists
         containing the values to be reclassified. For example, a current class
         code of 5 can be changed to 25 by specifying "5 2" or [[5, 2]]. A
         change to the synthetic class flag can be made by adding the keyword
         for the modification ("5 2 SET" or [[5, 2, "SET"]]). Multiple changes
         can be specified as a semicolon-delimited string (for example, "5 2; 8
         3; 1 4") or as a list of lists (for example, [[5, 2], [8, 3], [1,
         4]]).
     compute_stats {Boolean}:
         Specifies whether statistics will be computed for the .las files
         referenced by the LAS dataset. Computing statistics provides a spatial
         index for each .las file, which improves analysis and display
         performance. Statistics also enhance the filtering and symbology
         experience by limiting the display of LAS attributes, such as
         classification codes and return information, to values that are
         present in the .las file.COMPUTE_STATS-Statistics will be computed.
         This is the
         default.NO_COMPUTE_STATS-Statistics will not be computed.
     extent {Extent}:
         The extent of the data that will be evaluated.MAXOF-The maximum extent
         of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     boundary {Feature Layer}:
         The polygon feature or features that will define the area to be
         processed.
     process_entire_files {Boolean}:
         Specifies how the processing extent will be
         applied.PROCESS_EXTENT-Only LAS points that intersect the area of
         interest
         will be processed. This is the default.PROCESS_ENTIRE_FILES-If any
         portion of a .las file intersects the area
         of interest, all the points in that file, including those outside the
         area of interest, will be processed.
     update_pyramid {Boolean}:
         Specifies whether the LAS dataset pyramid will be updated after the
         class codes are modified.UPDATE_PYRAMID-The LAS dataset pyramid will
         be updated. This is the
         default.NO_UPDATE_PYRAMID-The LAS dataset pyramid will not be updated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ChangeLasClassCodes_3d(
                *gp_fixargs(
                    (
                        in_las_dataset,
                        class_codes,
                        compute_stats,
                        extent,
                        boundary,
                        process_entire_files,
                        update_pyramid,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ClassifyLasBuilding_3d", None)
def ClassifyLasBuilding(
    in_las_dataset=None,
    min_height=None,
    min_area=None,
    compute_stats: Literal["COMPUTE_STATS", "NO_COMPUTE_STATS"] | None = None,
    extent=None,
    boundary=None,
    process_entire_files: Literal["PROCESS_ENTIRE_FILES", "PROCESS_EXTENT"] | None = None,
    point_spacing=None,
    reuse_building: Literal["REUSE_BUILDING", "RECLASSIFY_BUILDING"] | None = None,
    photogrammetric_data: Literal["PHOTOGRAMMETRIC_DATA", "NOT_PHOTOGRAMMETRIC_DATA"] | None = None,
    method: Literal["STANDARD", "CONSERVATIVE", "AGGRESSIVE"] | None = None,
    classify_above_roof: Literal["CLASSIFY_ABOVE_ROOF", "NO_CLASSIFY_ABOVE_ROOF"] | None = None,
    above_roof_height=None,
    above_roof_code=None,
    classify_below_roof: Literal["CLASSIFY_BELOW_ROOF", "NO_CLASSIFY_BELOW_ROOF"] | None = None,
    below_roof_code=None,
    update_pyramid: Literal["UPDATE_PYRAMID", "NO_UPDATE_PYRAMID"] | None = None,
) -> Result1[str | Layer]:
    """ClassifyLasBuilding(in_las_dataset, min_height, min_area, {compute_stats}, {extent}, {boundary}, {process_entire_files}, {point_spacing}, {reuse_building}, {photogrammetric_data}, {method}, {classify_above_roof}, {above_roof_height}, {above_roof_code}, {classify_below_roof}, {below_roof_code}, {update_pyramid})

       Classifies buildings in LAS format point cloud data.

    INPUTS:
     in_las_dataset (LAS Dataset Layer):
         The LAS dataset that will be classified.
     min_height (Linear Unit):
         The height from the ground that defines the lowest point from which
         rooftop points will be identified.
     min_area (Areal Unit):
         The smallest area of the building rooftop.
     compute_stats {Boolean}:
         Specifies whether statistics will be computed for the .las files
         referenced by the LAS dataset. Computing statistics provides a spatial
         index for each .las file, which improves analysis and display
         performance. Statistics also enhance the filtering and symbology
         experience by limiting the display of LAS attributes, such as
         classification codes and return information, to values that are
         present in the .las file.COMPUTE_STATS-Statistics will be computed.
         This is the
         default.NO_COMPUTE_STATS-Statistics will not be computed.
     extent {Extent}:
         The extent of the data that will be evaluated.MAXOF-The maximum extent
         of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     boundary {Feature Layer}:
         The polygon feature or features that will define the area to be
         processed.
     process_entire_files {Boolean}:
         Specifies how the processing extent will be
         applied.PROCESS_EXTENT-Only LAS points that intersect the area of
         interest
         will be processed. This is the default.PROCESS_ENTIRE_FILES-If any
         portion of a .las file intersects the area
         of interest, all the points in that file, including those outside the
         area of interest, will be processed.
     point_spacing {Linear Unit}:
         The average spacing of LAS points. This parameter is no longer used.
     reuse_building {Boolean}:
         Specifies whether the existing building classified points will be
         reused or reevaluated.Specifies whether the existing building
         classified points will be
         reused or reevaluated.RECLASSIFY_BUILDING-Existing building classified
         points will be
         reevaluated to fit the criteria for plane detection, and points that
         do not fit the specified area and height will be assigned a value of
         1. This is the default.REUSE_BUILDING-Existing building classified
         points will contribute to
         the plane detection process but will not be reclassified in the event
         they do not meet the criteria specified by the tool. Use this option
         if the existing classification is necessary.
     photogrammetric_data {Boolean}:
         Specifies whether the points in the .las file were derived using a
         photogrammetric technique.Specifies whether the points in the .las
         file were derived using a
         photogrammetric technique.NOT_PHOTOGRAMMETRIC_DATA-The points in the
         .las file were obtained
         from a lidar survey, not from a photogrammetric technique for
         producing point clouds. This is the default.PHOTOGRAMMETRIC_DATA-The
         points in the .las file were obtained using a
         photogrammetric technique for producing point clouds from overlapping
         imagery.
     method {String}:
         Specifies the classification method that will be
         used.AGGRESSIVE-Points that fit the planar rooftop characteristics
         with a
         relatively high tolerance for outliers will be detected. Use this
         method if the points are not well calibrated.STANDARD-Points that fit
         the planar rooftop characteristics with a
         relatively moderate tolerance for irregular points will be detected.
         This is the defaultCONSERVATIVE-Points that fit the planar rooftop
         characteristics with a
         relatively low tolerance for irregular points will be detected. Use
         this method if the building points are co-planar with points from
         objects that are not buildings.
     classify_above_roof {Boolean}:
         Specifies whether points above the planes detected for the roof will
         be classified.NO_CLASSIFY_ABOVE_ROOF-Points detected above the planes
         will not be
         classified. This is the default..CLASSIFY_ABOVE_ROOF-Points detected
         above the planes will be
         classified.
     above_roof_height {Linear Unit}:
         The maximum height of the points above the building rooftop that will
         be classified using the above_roof_code parameter value.
     above_roof_code {Long}:
         The class code that will be assigned to points above the roof.
     classify_below_roof {Boolean}:
         Specifies whether points between the roof and the ground will be
         classified.NO_CLASSIFY_BELOW_ROOF-Points between the roof and the
         ground will not
         be classified. This is the default.CLASSIFY_BELOW_ROOF-Points between
         the roof and the ground will be
         classified.
     below_roof_code {Long}:
         The class code that will be assigned to points between the ground and
         the roof.
     update_pyramid {Boolean}:
         Specifies whether the LAS dataset pyramid will be updated after the
         class codes are modified.UPDATE_PYRAMID-The LAS dataset pyramid will
         be updated. This is the
         default.NO_UPDATE_PYRAMID-The LAS dataset pyramid will not be updated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ClassifyLasBuilding_3d(
                *gp_fixargs(
                    (
                        in_las_dataset,
                        min_height,
                        min_area,
                        compute_stats,
                        extent,
                        boundary,
                        process_entire_files,
                        point_spacing,
                        reuse_building,
                        photogrammetric_data,
                        method,
                        classify_above_roof,
                        above_roof_height,
                        above_roof_code,
                        classify_below_roof,
                        below_roof_code,
                        update_pyramid,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ClassifyLasByHeight_3d", None)
def ClassifyLasByHeight(
    in_las_dataset=None,
    ground_source: Literal["GROUND", "MODEL_KEY", "SURFACE"] | None = None,
    height_classification=None,
    noise: Literal["NONE", "LOW_NOISE", "HIGH_NOISE", "ALL_NOISE"] | None = None,
    compute_stats: Literal["COMPUTE_STATS", "NO_COMPUTE_STATS"] | None = None,
    extent=None,
    process_entire_files: Literal["PROCESS_ENTIRE_FILES", "PROCESS_EXTENT"] | None = None,
    boundary=None,
    update_pyramid: Literal["UPDATE_PYRAMID", "NO_UPDATE_PYRAMID"] | None = None,
    in_surface=None,
) -> Result1[str | Layer]:
    """ClassifyLasByHeight(in_las_dataset, ground_source, height_classification;height_classification..., {noise}, {compute_stats}, {extent}, {process_entire_files}, {boundary}, {update_pyramid}, {in_surface})

       Reclassifies lidar points based on their height from the ground
       surface.

    INPUTS:
     in_las_dataset (LAS Dataset Layer):
         The LAS dataset that will be processed. Only LAS points with class
         code values of 0 and 1 will be evaluated.
     ground_source (String):
         Specifies the source of ground measurements that will be used to
         determine height above ground.GROUND-LAS points designated with the
         ground classification code value
         of 2 and model key code value of 8 will be used.MODEL_KEY-Only LAS
         points designated with the model key classification
         code value of 8 will be used.SURFACE-The ground height will be based
         on a raster surface
     height_classification (Value Table):
         The class code value that will be assigned to LAS points that fall
         within the range of values derived from the specified height from
         ground. The order of entry influences the height ranges that will be
         used to define the reclassification of LAS points. The z-range of the
         first entry will span from the ground surface to the specified
         height_from_ground value. The z-range of subsequent entries will span
         from the upper limit of the preceding entry to its own
         height_from_ground value.
     noise {String}:
         Specifies whether and how points will be reclassified as noise based
         on their proximity from the ground. Noise artifacts in lidar data can
         be introduced by sensor errors and the inadvertent interception of
         aerial obstructions, such as birds, in the path of the lidar
         pulse.ALL_NOISE-Both low and high noise will be
         classified.HIGH_NOISE-Only
         points that are above the maximum height in the LAS
         classification table will be reclassified as high noise.LOW_NOISE-Only
         points below the ground surface will be reclassified as
         noise. This option is only available when all ground points are used
         to define the ground surface.NONE-No points will be reclassified as
         noise.
     compute_stats {Boolean}:
         Specifies whether statistics will be computed for the .las files
         referenced by the LAS dataset. Computing statistics provides a spatial
         index for each .las file, which improves analysis and display
         performance. Statistics also enhance the filtering and symbology
         experience by limiting the display of LAS attributes, such as
         classification codes and return information, to values that are
         present in the .las file.COMPUTE_STATS-Statistics will be computed.
         This is the
         default.NO_COMPUTE_STATS-Statistics will not be computed.
     extent {Extent}:
         The extent of the data that will be evaluated.MAXOF-The maximum extent
         of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     process_entire_files {Boolean}:
         Specifies how the processing extent will be
         applied.PROCESS_EXTENT-Only LAS points that are within the processing
         extent
         will be evaluated. This is the default.PROCESS_ENTIRE_FILES-All points
         in the .las files that intersect the
         processing extent will be evaluated.
     boundary {Feature Layer}:
         A polygon feature that defines the region where LAS ground points will
         be evaluated.
     update_pyramid {Boolean}:
         Specifies whether the LAS dataset pyramid will be updated after the
         class codes are modified.UPDATE_PYRAMID-The LAS dataset pyramid will
         be updated. This is the
         default.NO_UPDATE_PYRAMID-The LAS dataset pyramid will not be updated.
     in_surface {Raster Layer / Image Service}:
         The raster layer that will provide the source for ground height
         values. This parameter is only used when the ground_source parameter
         is set to SURFACE."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ClassifyLasByHeight_3d(
                *gp_fixargs(
                    (
                        in_las_dataset,
                        ground_source,
                        height_classification,
                        noise,
                        compute_stats,
                        extent,
                        process_entire_files,
                        boundary,
                        update_pyramid,
                        in_surface,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ClassifyLasGround_3d", None)
def ClassifyLasGround(
    in_las_dataset=None,
    method: Literal["STANDARD", "CONSERVATIVE", "AGGRESSIVE", "RECOVER_RIDGES"] | None = None,
    reuse_ground: Literal["REUSE_GROUND", "RECLASSIFY_GROUND"] | None = None,
    dem_resolution=None,
    compute_stats: Literal["COMPUTE_STATS", "NO_COMPUTE_STATS"] | None = None,
    extent=None,
    boundary=None,
    process_entire_files: Literal["PROCESS_ENTIRE_FILES", "PROCESS_EXTENT"] | None = None,
    update_pyramid: Literal["UPDATE_PYRAMID", "NO_UPDATE_PYRAMID"] | None = None,
    algorithm: Literal["LATEST", "FIRST"] | None = None,
    classify_low_noise: Literal["CLASSIFY_LOW_NOISE", "NO_CLASSIFY_LOW_NOISE"] | None = None,
    minimum_depth_below_ground=None,
    preserve_low_noise: Literal["PRESERVE_LOW_NOISE", "RECLASSIFY_LOW_NOISE"] | None = None,
    classify_high_noise: Literal["CLASSIFY_HIGH_NOISE", "NO_CLASSIFY_HIGH_NOISE"] | None = None,
    minimum_height_above_ground=None,
    preserve_high_noise: Literal["PRESERVE_HIGH_NOISE", "RECLASSIFY_HIGH_NOISE"] | None = None,
) -> Result1[str | Layer]:
    """ClassifyLasGround(in_las_dataset, {method}, {reuse_ground}, {dem_resolution}, {compute_stats}, {extent}, {boundary}, {process_entire_files}, {update_pyramid}, {algorithm}, {classify_low_noise}, {minimum_depth_below_ground}, {preserve_low_noise}, {classify_high_noise}, {minimum_height_above_ground}, {preserve_high_noise})

       Classifies ground points from LAS data.

    INPUTS:
     in_las_dataset (LAS Dataset Layer):
         The LAS dataset that will be processed. Only the last return of LAS
         points with class code values of 0, 1, and 2 will be evaluated.
     method {String}:
         Specifies the method that will be used to detect ground
         points.STANDARD-This method has a tolerance for slope variation that
         allows
         it to capture gradual undulations in the ground's topography that
         would typically be missed by the conservative option but not capture
         the type of sharp reliefs that would be captured by the aggressive
         option. This is the default.CONSERVATIVE-When compared to other
         options, this method uses a
         tighter restriction on the variation of the ground's slope that allows
         it to differentiate the ground from low-lying vegetation such as grass
         and shrubbery. It is best suited for topography with minimal
         curvature. AGGRESSIVE-This method detects ground areas with
         sharper
         reliefs, such as ridges and hilltops, that may be ignored by the
         standard option. This method is best used in a second iteration of
         this tool with theparameter checked. Avoid using this method in urban
         areas or flat, rural areas, as it may result in the misclassification
         of taller objects-such as utility towers, vegetation, and portions of
         buildings-as ground. Reuse existing groundRECOVER_RIDGES-This
         method detects ridges that may be undetected by
         the aggressive method. A processing extent or boundary polygon must be
         provided to use this method.Specifies the method that will be used to
         detect ground points.
     reuse_ground {Boolean}:
         Specifies whether existing ground points will be reclassified or
         reused.RECLASSIFY_GROUND-Existing ground points will be reclassified.
         Points
         that are not found to be a part of the ground will be reassigned a
         class code value of 1, which represents unclassified points. This is
         the default.REUSE_GROUND-Existing ground points will be accepted and
         reused
         without scrutiny and contribute to the determination of unclassified
         points.
     dem_resolution {Linear Unit}:
         A distance that will result in only a subset of points being evaluated
         for classification as ground, making the process faster. Consider
         using this parameter when a faster method for generating a DEM surface
         is needed. The minimum distance is 0.3 meters, but the provided
         distance must be at least 1.5 times the average point spacing of the
         lidar data for this process to take effect.
     compute_stats {Boolean}:
         Specifies whether statistics will be computed for the .las files
         referenced by the LAS dataset. Computing statistics provides a spatial
         index for each .las file, which improves analysis and display
         performance. Statistics also enhance the filtering and symbology
         experience by limiting the display of LAS attributes, such as
         classification codes and return information, to values that are
         present in the .las file.COMPUTE_STATS-Statistics will be computed.
         This is the
         default.NO_COMPUTE_STATS-Statistics will not be computed.
     extent {Extent}:
         The extent of the data that will be evaluated.MAXOF-The maximum extent
         of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     boundary {Feature Layer}:
         The polygon feature or features that will define the area to be
         processed.
     process_entire_files {Boolean}:
         Specifies how the processing extent will be
         applied.PROCESS_EXTENT-Only LAS points that intersect the area of
         interest
         will be processed. This is the default.PROCESS_ENTIRE_FILES-If any
         portion of a .las file intersects the area
         of interest, all the points in that file, including those outside the
         area of interest, will be processed.
     update_pyramid {Boolean}:
         Specifies whether the LAS dataset pyramid will be updated after the
         class codes are modified.UPDATE_PYRAMID-The LAS dataset pyramid will
         be updated. This is the
         default.NO_UPDATE_PYRAMID-The LAS dataset pyramid will not be updated.
     algorithm {String}:
         Specifies the version of the ground detection algorithm that will be
         used to classify the ground points.LATEST-The most recent version of
         the ground detection algorithm will
         be used. This option improves the handling of noise and outlier
         points, especially for photogrammetrically derived point clouds. It
         also produces better results and faster performance in most cases.
         This is the default.FIRST-The initial version of the ground detection
         algorithm will be
         used. Use this option only when the results from the latest version
         are not suitable.
     classify_low_noise {Boolean}:
         Specifies whether points below a given distance beneath the ground
         will be classified as low noise. The distance at which noise points
         are identified is based on the minimum_depth_below_ground parameter
         value. Low-noise points are assigned a class code value of
         7.CLASSIFY_LOW_NOISE-Low-noise points will be
         classified.NO_CLASSIFY_LOW_NOISE-Low-noise points will not be
         classified. This is
         the default.
     minimum_depth_below_ground {Linear Unit}:
         The distance below the ground that will be used to classify low-noise
         points. The ground will be defined by a triangulated surface created
         from ground-classified points. All points with class codes 0 or 1 that
         are below the ground by the height provided in this parameter will be
         assigned a class code value of 7.
     preserve_low_noise {Boolean}:
         Specifies whether existing low noise points with class code 7 will be
         preserved or reclassified. If low-noise points are reclassified, any
         points that are not below the ground by at least the distance provided
         for the minimum_depth_below_ground parameter value will be assigned a
         class code value of 1.PRESERVE_LOW_NOISE-Existing low-noise points
         will be preserved. This
         is the default.RECLASSIFY_LOW_NOISE-Existing low-noise points will be
         reclassified.
     classify_high_noise {Boolean}:
         Specifies whether points above a given distance from the ground will
         be classified as high noise. The distance at which noise points are
         identified is based on the minimum_height_above_ground parameter
         value. High-noise points are assigned a class code value of
         18.CLASSIFY_HIGH_NOISE-High-noise points will be
         classified.NO_CLASSIFY_HIGH_NOISE-High-noise points will not be
         classified. This
         is the default.
     minimum_height_above_ground {Linear Unit}:
         The distance above the ground that will be used to classify high-noise
         points. The ground will be defined by a triangulated surface created
         from ground-classified points. All points with class codes 0 or 1 that
         are above the ground by the height provided in this parameter will be
         assigned a class code value of 18.
     preserve_high_noise {Boolean}:
         Specifies whether existing high-noise points with class code 18 will
         be preserved or reclassified. If high-noise points are reclassified,
         any points that are not above the ground by at least the distance
         provided for the minimum_height_above_ground parameter will be
         assigned a class code value of 1.PRESERVE_HIGH_NOISE-Existing high-
         noise points will be preserved. This
         is the default.RECLASSIFY_HIGH_NOISE-Existing high-noise points will
         be reclassified."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ClassifyLasGround_3d(
                *gp_fixargs(
                    (
                        in_las_dataset,
                        method,
                        reuse_ground,
                        dem_resolution,
                        compute_stats,
                        extent,
                        boundary,
                        process_entire_files,
                        update_pyramid,
                        algorithm,
                        classify_low_noise,
                        minimum_depth_below_ground,
                        preserve_low_noise,
                        classify_high_noise,
                        minimum_height_above_ground,
                        preserve_high_noise,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ClassifyLasNoise_3d", None)
def ClassifyLasNoise(
    in_las_dataset=None,
    method: Literal["ISOLATION", "RELATIVE_HEIGHT", "ABSOLUTE_HEIGHT"] | None = None,
    edit_las: Literal["CLASSIFY", "NO_CLASSIFY"] | None = None,
    withheld: Literal["WITHHELD", "NO_WITHHELD"] | None = None,
    compute_stats: Literal["COMPUTE_STATS", "NO_COMPUTE_STATS"] | None = None,
    ground=None,
    low_z=None,
    high_z=None,
    max_neighbors=None,
    step_width=None,
    step_height=None,
    extent=None,
    process_entire_files: Literal["PROCESS_ENTIRE_FILES", "PROCESS_EXTENT"] | None = None,
    out_feature_class=None,
    update_pyramid: Literal["UPDATE_PYRAMID", "NO_UPDATE_PYRAMID"] | None = None,
) -> Result2[str, str | Layer]:
    """ClassifyLasNoise(in_las_dataset, {method}, {edit_las}, {withheld}, {compute_stats}, {ground}, {low_z}, {high_z}, {max_neighbors}, {step_width}, {step_height}, {extent}, {process_entire_files}, {out_feature_class}, {update_pyramid})

       Classifies LAS points with anomalous spatial characteristics as noise.

    INPUTS:
     in_las_dataset (LAS Dataset Layer):
         The LAS dataset that will be processed.
     method {String}:
         Specifies the noise detection method that will be used.ISOLATION-The
         spatial proximity of LAS points will be analyzed in
         tiled volumes to determine noise measurements along with height-based
         noise detection. This is the default.RELATIVE_HEIGHT-All points below
         the specified minimum height from the
         ground surface and above the maximum height from the ground surface
         will be identified as noise.ABSOLUTE_HEIGHT-All points below the
         specified minimum height and
         above the maximum height in relation to mean sea level will be
         identified as noise.
     edit_las {Boolean}:
         Specifies whether LAS points that are identified as noise will be
         reclassified.CLASSIFY-Noise points will be reclassified. This is the
         default.NO_CLASSIFY-Noise points will not be reclassified.
     withheld {Boolean}:
         Specifies whether the withheld classification flag will be assigned to
         noise points. This parameter is enabled when the edit_las parameter is
         set to CLASSIFY.WITHHELD-The withheld classification flag will be
         assigned to noise
         points.NO_WITHHELD-The withheld classification flag will not be
         assigned to
         noise points. This is the default.
     compute_stats {Boolean}:
         Specifies whether statistics will be computed for the .las files
         referenced by the LAS dataset. Computing statistics provides a spatial
         index for each .las file, which improves analysis and display
         performance. Statistics also enhance the filtering and symbology
         experience by limiting the display of LAS attributes, such as
         classification codes and return information, to values that are
         present in the .las file.COMPUTE_STATS-Statistics will be computed.
         This is the
         default.NO_COMPUTE_STATS-Statistics will not be computed.
     ground {Raster Layer}:
         The ground raster surface that will be used to compute relative height
         values for each point. This parameter is required when the method
         parameter is set to RELATIVE_HEIGHT.
     low_z {Linear Unit}:
         The height that will define the lowest z-value threshold for
         identifying noise points. Any point that is lower than the value
         provided will be classified as noise. If a ground surface is
         specified, this threshold will be based on an offset from the ground
         so that a value of -3 feet means any points that are 3 feet below the
         ground surface will be classified as noise.
     high_z {Linear Unit}:
         The height that will define the highest z-value threshold for
         identifying noise points. Any point that is higher than the value
         provided will be classified as noise. If a ground surface is provided,
         this threshold will be based on an offset from the ground so that a
         value of 250 meters means any points that are higher than 250 meters
         above the ground surface will be classified as noise.
     max_neighbors {Long}:
         The maximum number of points in the analysis volume that can
         be qualified as noise when using themethod. If the analysis volume
         contains any number of LAS points that are equal to or less than this
         value, those points will be classified as noise. Isolation
     step_width {Linear Unit}:
         The size of each dimension in the x,y space of the analysis
         volume when using themethod. Isolation
     step_height {Linear Unit}:
         The height of the analysis volume when using themethod.
         Isolation
     extent {Extent}:
         The extent of the data that will be evaluated.MAXOF-The maximum extent
         of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     process_entire_files {Boolean}:
         Specifies how the processing extent will be
         applied.PROCESS_EXTENT-Only LAS points that intersect the area of
         interest
         will be processed. This is the default.PROCESS_ENTIRE_FILES-If any
         portion of a .las file intersects the area
         of interest, all the points in that file, including those outside the
         area of interest, will be processed.
     update_pyramid {Boolean}:
         Specifies whether the LAS dataset pyramid will be updated after the
         class codes are modified.UPDATE_PYRAMID-The LAS dataset pyramid will
         be updated. This is the
         default.NO_UPDATE_PYRAMID-The LAS dataset pyramid will not be updated.

    OUTPUTS:
     out_feature_class {Feature Class}:
         The output point features that represent the LAS points identified as
         noise."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ClassifyLasNoise_3d(
                *gp_fixargs(
                    (
                        in_las_dataset,
                        method,
                        edit_las,
                        withheld,
                        compute_stats,
                        ground,
                        low_z,
                        high_z,
                        max_neighbors,
                        step_width,
                        step_height,
                        extent,
                        process_entire_files,
                        out_feature_class,
                        update_pyramid,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ClassifyLasOverlap_3d", None)
def ClassifyLasOverlap(
    in_las_dataset=None,
    sample_distance=None,
    extent=None,
    process_entire_files: Literal["PROCESS_ENTIRE_FILES", "PROCESS_EXTENT"] | None = None,
    compute_stats: Literal["COMPUTE_STATS", "NO_COMPUTE_STATS"] | None = None,
    update_pyramid: Literal["UPDATE_PYRAMID", "NO_UPDATE_PYRAMID"] | None = None,
) -> Result1[str | Layer]:
    """ClassifyLasOverlap(in_las_dataset, {sample_distance}, {extent}, {process_entire_files}, {compute_stats}, {update_pyramid})

       Classifies LAS points from overlapping scans of aerial lidar surveys.

    INPUTS:
     in_las_dataset (LAS Dataset Layer):
         The tiled LAS dataset that will be processed.
     sample_distance {Linear Unit}:
         The distance of either dimension of the square area that will be used
         to evaluate the LAS data. This value can be expressed as a number and
         a linear unit value, such as 3 meters. If linear units are not
         specified or are entered as Unknown, the unit will be defined by the
         spatial reference of the input .las file.
     extent {Extent}:
         The extent of the data that will be evaluated.MAXOF-The maximum extent
         of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     process_entire_files {Boolean}:
         Specifies how the processing extent will be
         applied.PROCESS_EXTENT-Only LAS points that intersect the area of
         interest
         will be processed. This is the default.PROCESS_ENTIRE_FILES-If any
         portion of a .las file intersects the area
         of interest, all the points in that file, including those outside the
         area of interest, will be processed.
     compute_stats {Boolean}:
         Specifies whether statistics will be computed for the .las files
         referenced by the LAS dataset. Computing statistics provides a spatial
         index for each .las file, which improves analysis and display
         performance. Statistics also enhance the filtering and symbology
         experience by limiting the display of LAS attributes, such as
         classification codes and return information, to values that are
         present in the .las file.COMPUTE_STATS-Statistics will be computed.
         This is the
         default.NO_COMPUTE_STATS-Statistics will not be computed.
     update_pyramid {Boolean}:
         Specifies whether the LAS dataset pyramid will be updated after the
         class codes are modified.UPDATE_PYRAMID-The LAS dataset pyramid will
         be updated. This is the
         default.NO_UPDATE_PYRAMID-The LAS dataset pyramid will not be updated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ClassifyLasOverlap_3d(
                *gp_fixargs(
                    (in_las_dataset, sample_distance, extent, process_entire_files, compute_stats, update_pyramid), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetLasClassCodesUsingFeatures_3d", None)
def SetLasClassCodesUsingFeatures(
    in_las_dataset=None,
    feature_class=None,
    compute_stats: Literal["COMPUTE_STATS", "NO_COMPUTE_STATS"] | None = None,
    update_pyramid: Literal["UPDATE_PYRAMID", "NO_UPDATE_PYRAMID"] | None = None,
) -> Result1[str | Layer]:
    """SetLasClassCodesUsingFeatures(in_las_dataset, feature_class;feature_class..., {compute_stats}, {update_pyramid})

       Classifies LAS points that intersect the two-dimensional extent of
       input features.

    INPUTS:
     in_las_dataset (LAS Dataset Layer):
         The LAS dataset that will be processed.
     feature_class (Value Table):
         Enter each feature and its associated options that will be used to
         define the classification operation as a list of lists, for example,
         [['feature1', 6, 9, 'NO_CHANGE', 'SET', 'CLEAR', 'NO_CHANGE'],
         ['feature 2', 0, 6, 'NO_CHANGE', 'NO_CHANGE', 'NO_CHANGE',
         'NO_CHANGE']]. Each feature has the following options:features-The
         features used for reclassifying LAS
         points.buffer_distance-The buffer distance applied to the input
         features
         prior to determining the LAS points that intersect its
         area.new_class-The class code to be assigned.synthetic-The Synthetic
         classification flag is used to identify points
         that were not obtained from a lidar sensor.key_point-The Model Key
         Point classification flag represents a subset
         of points that can be used to capture a desired level of detail of a
         given class code.withheld-The Withheld classification flag signifies
         erroneous data
         that should be excluded from analysis and visualization.overlap-The
         Overlap designation identifies points from overlapping
         scans and is only supported in LAS 1.4 files.
     compute_stats {Boolean}:
         Specifies whether statistics will be computed for the .las files
         referenced by the LAS dataset. Computing statistics provides a spatial
         index for each .las file, which improves analysis and display
         performance. Statistics also enhance the filtering and symbology
         experience by limiting the display of LAS attributes, such as
         classification codes and return information, to values that are
         present in the .las file.COMPUTE_STATS-Statistics will be computed.
         This is the
         default.NO_COMPUTE_STATS-Statistics will not be computed.
     update_pyramid {Boolean}:
         Specifies whether the LAS dataset pyramid will be updated after the
         class codes are modified.UPDATE_PYRAMID-The LAS dataset pyramid will
         be updated. This is the
         default.NO_UPDATE_PYRAMID-The LAS dataset pyramid will not be updated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetLasClassCodesUsingFeatures_3d(
                *gp_fixargs((in_las_dataset, feature_class, compute_stats, update_pyramid), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetLasClassCodesUsingRaster_3d", None)
def SetLasClassCodesUsingRaster(
    in_las_dataset=None,
    in_raster=None,
    compute_stats: Literal["COMPUTE_STATS", "NO_COMPUTE_STATS"] | None = None,
    extent=None,
    boundary=None,
    process_entire_files: Literal["PROCESS_ENTIRE_FILES", "PROCESS_EXTENT"] | None = None,
    update_pyramid: Literal["UPDATE_PYRAMID", "NO_UPDATE_PYRAMID"] | None = None,
) -> Result1[str | Layer]:
    """SetLasClassCodesUsingRaster(in_las_dataset, in_raster, {compute_stats}, {extent}, {boundary}, {process_entire_files}, {update_pyramid})

       Classifies LAS points using cell values from a raster dataset.

    INPUTS:
     in_las_dataset (LAS Dataset Layer):
         The LAS dataset that will be processed.
     in_raster (Raster Layer / Mosaic Layer):
         The integer raster with cell values that will be used to assign
         classification codes for LAS points. The cell values must not exceed
         the class codes that are supported by the input LAS files.
     compute_stats {Boolean}:
         Specifies whether statistics will be computed for the .las files
         referenced by the LAS dataset. Computing statistics provides a spatial
         index for each .las file, which improves analysis and display
         performance. Statistics also enhance the filtering and symbology
         experience by limiting the display of LAS attributes, such as
         classification codes and return information, to values that are
         present in the .las file.COMPUTE_STATS-Statistics will be computed.
         This is the
         default.NO_COMPUTE_STATS-Statistics will not be computed.
     extent {Extent}:
         The extent of the data that will be evaluated.MAXOF-The maximum extent
         of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     boundary {Feature Layer}:
         The polygon feature or features that will define the area to be
         processed.
     process_entire_files {Boolean}:
         Specifies how the processing extent will be
         applied.PROCESS_EXTENT-Only LAS points that intersect the area of
         interest
         will be processed. This is the default.PROCESS_ENTIRE_FILES-If any
         portion of a .las file intersects the area
         of interest, all the points in that file, including those outside the
         area of interest, will be processed.
     update_pyramid {Boolean}:
         Specifies whether the LAS dataset pyramid will be updated after the
         class codes are modified.UPDATE_PYRAMID-The LAS dataset pyramid will
         be updated. This is the
         default.NO_UPDATE_PYRAMID-The LAS dataset pyramid will not be updated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetLasClassCodesUsingRaster_3d(
                *gp_fixargs(
                    (in_las_dataset, in_raster, compute_stats, extent, boundary, process_entire_files, update_pyramid),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Point Cloud\Classification (Deep Learning) toolset
@gptooldoc("ClassifyPointCloudUsingTrainedModel_3d", None)
def ClassifyPointCloudUsingTrainedModel(
    in_point_cloud=None,
    in_trained_model=None,
    output_classes=None,
    in_class_mode: Literal["EDIT_ALL", "EDIT_SELECTED", "PRESERVE_SELECTED"] | None = None,
    target_classes: list[
        Literal[
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
            "13",
            "14",
            "15",
            "16",
            "17",
            "18",
            "19",
            "20",
            "21",
            "22",
            "23",
            "24",
            "25",
            "26",
            "27",
            "28",
            "29",
            "30",
            "31",
            "32",
            "33",
            "34",
            "35",
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45",
            "46",
            "47",
            "48",
            "49",
            "50",
            "51",
            "52",
            "53",
            "54",
            "55",
            "56",
            "57",
            "58",
            "59",
            "60",
            "61",
            "62",
            "63",
            "64",
            "65",
            "66",
            "67",
            "68",
            "69",
            "70",
            "71",
            "72",
            "73",
            "74",
            "75",
            "76",
            "77",
            "78",
            "79",
            "80",
            "81",
            "82",
            "83",
            "84",
            "85",
            "86",
            "87",
            "88",
            "89",
            "90",
            "91",
            "92",
            "93",
            "94",
            "95",
            "96",
            "97",
            "98",
            "99",
            "100",
            "101",
            "102",
            "103",
            "104",
            "105",
            "106",
            "107",
            "108",
            "109",
            "110",
            "111",
            "112",
            "113",
            "114",
            "115",
            "116",
            "117",
            "118",
            "119",
            "120",
            "121",
            "122",
            "123",
            "124",
            "125",
            "126",
            "127",
            "128",
            "129",
            "130",
            "131",
            "132",
            "133",
            "134",
            "135",
            "136",
            "137",
            "138",
            "139",
            "140",
            "141",
            "142",
            "143",
            "144",
            "145",
            "146",
            "147",
            "148",
            "149",
            "150",
            "151",
            "152",
            "153",
            "154",
            "155",
            "156",
            "157",
            "158",
            "159",
            "160",
            "161",
            "162",
            "163",
            "164",
            "165",
            "166",
            "167",
            "168",
            "169",
            "170",
            "171",
            "172",
            "173",
            "174",
            "175",
            "176",
            "177",
            "178",
            "179",
            "180",
            "181",
            "182",
            "183",
            "184",
            "185",
            "186",
            "187",
            "188",
            "189",
            "190",
            "191",
            "192",
            "193",
            "194",
            "195",
            "196",
            "197",
            "198",
            "199",
            "200",
            "201",
            "202",
            "203",
            "204",
            "205",
            "206",
            "207",
            "208",
            "209",
            "210",
            "211",
            "212",
            "213",
            "214",
            "215",
            "216",
            "217",
            "218",
            "219",
            "220",
            "221",
            "222",
            "223",
            "224",
            "225",
            "226",
            "227",
            "228",
            "229",
            "230",
            "231",
            "232",
            "233",
            "234",
            "235",
            "236",
            "237",
            "238",
            "239",
            "240",
            "241",
            "242",
            "243",
            "244",
            "245",
            "246",
            "247",
            "248",
            "249",
            "250",
            "251",
            "252",
            "253",
            "254",
            "255",
        ]
    ]
    | Literal[
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20",
        "21",
        "22",
        "23",
        "24",
        "25",
        "26",
        "27",
        "28",
        "29",
        "30",
        "31",
        "32",
        "33",
        "34",
        "35",
        "36",
        "37",
        "38",
        "39",
        "40",
        "41",
        "42",
        "43",
        "44",
        "45",
        "46",
        "47",
        "48",
        "49",
        "50",
        "51",
        "52",
        "53",
        "54",
        "55",
        "56",
        "57",
        "58",
        "59",
        "60",
        "61",
        "62",
        "63",
        "64",
        "65",
        "66",
        "67",
        "68",
        "69",
        "70",
        "71",
        "72",
        "73",
        "74",
        "75",
        "76",
        "77",
        "78",
        "79",
        "80",
        "81",
        "82",
        "83",
        "84",
        "85",
        "86",
        "87",
        "88",
        "89",
        "90",
        "91",
        "92",
        "93",
        "94",
        "95",
        "96",
        "97",
        "98",
        "99",
        "100",
        "101",
        "102",
        "103",
        "104",
        "105",
        "106",
        "107",
        "108",
        "109",
        "110",
        "111",
        "112",
        "113",
        "114",
        "115",
        "116",
        "117",
        "118",
        "119",
        "120",
        "121",
        "122",
        "123",
        "124",
        "125",
        "126",
        "127",
        "128",
        "129",
        "130",
        "131",
        "132",
        "133",
        "134",
        "135",
        "136",
        "137",
        "138",
        "139",
        "140",
        "141",
        "142",
        "143",
        "144",
        "145",
        "146",
        "147",
        "148",
        "149",
        "150",
        "151",
        "152",
        "153",
        "154",
        "155",
        "156",
        "157",
        "158",
        "159",
        "160",
        "161",
        "162",
        "163",
        "164",
        "165",
        "166",
        "167",
        "168",
        "169",
        "170",
        "171",
        "172",
        "173",
        "174",
        "175",
        "176",
        "177",
        "178",
        "179",
        "180",
        "181",
        "182",
        "183",
        "184",
        "185",
        "186",
        "187",
        "188",
        "189",
        "190",
        "191",
        "192",
        "193",
        "194",
        "195",
        "196",
        "197",
        "198",
        "199",
        "200",
        "201",
        "202",
        "203",
        "204",
        "205",
        "206",
        "207",
        "208",
        "209",
        "210",
        "211",
        "212",
        "213",
        "214",
        "215",
        "216",
        "217",
        "218",
        "219",
        "220",
        "221",
        "222",
        "223",
        "224",
        "225",
        "226",
        "227",
        "228",
        "229",
        "230",
        "231",
        "232",
        "233",
        "234",
        "235",
        "236",
        "237",
        "238",
        "239",
        "240",
        "241",
        "242",
        "243",
        "244",
        "245",
        "246",
        "247",
        "248",
        "249",
        "250",
        "251",
        "252",
        "253",
        "254",
        "255",
    ]
    | str
    | None = None,
    compute_stats: Literal["COMPUTE_STATS", "NO_COMPUTE_STATS"] | None = None,
    boundary=None,
    update_pyramid: Literal["UPDATE_PYRAMID", "NO_UPDATE_PYRAMID"] | None = None,
    reference_height=None,
    excluded_class_codes=None,
    batch_size=None,
) -> Result1[str | Layer]:
    """ClassifyPointCloudUsingTrainedModel(in_point_cloud, in_trained_model, output_classes;output_classes..., {in_class_mode}, {target_classes;target_classes...}, {compute_stats}, {boundary}, {update_pyramid}, {reference_height}, {excluded_class_codes;excluded_class_codes...}, {batch_size})

       Classifies a point cloud using a deep learning model.

    INPUTS:
     in_point_cloud (LAS Dataset Layer):
         The point cloud that will be classified.
     in_trained_model (File / String):
         The input Esri model definition file (*.emd) or deep learning package
         (*.dlpk) that will be used to classify the point cloud. A URL for a
         deep learning package that is published on ArcGIS Online or ArcGIS
         Living Atlas can also be used.
     output_classes (String):
         The class codes from the trained model that will be used to classify
         the input point cloud. All classes from the input model will be used
         by default unless a subset is specified.
     in_class_mode {String}:
         Specifies how the editable points from the input point cloud will be
         defined.EDIT_ALL-All points in the input point cloud will be edited.
         This is
         the default.EDIT_SELECTED-Only points with class codes specified in
         the
         target_classes parameter will be edited; all other points will remain
         unchanged.PRESERVE_SELECTED-Points with class codes specified in the
         target_classes parameter will be preserved; the remaining points will
         be edited.
     target_classes {Long}:
         The classes for which points will be edited or have their original
         class code designation preserved based on the in_class_mode parameter
         value.
     compute_stats {Boolean}:
         Specifies whether statistics will be computed for the .las files
         referenced by the LAS dataset. Computing statistics provides a spatial
         index for each .las file, which improves analysis and display
         performance. Statistics also enhance the filtering and symbology
         experience by limiting the display of LAS attributes, such as
         classification codes and return information, to values that are
         present in the .las file.COMPUTE_STATS-Statistics will be computed.
         This is the
         default.NO_COMPUTE_STATS-Statistics will not be computed.
     boundary {Feature Layer}:
         The polygon boundary that defines the subset of points to be processed
         from the input point cloud. Points outside the boundary features will
         not be evaluated.
     update_pyramid {Boolean}:
         Specifies whether the LAS dataset pyramid will be updated after the
         class codes are modified.UPDATE_PYRAMID-The LAS dataset pyramid will
         be updated. This is the
         default.NO_UPDATE_PYRAMID-The LAS dataset pyramid will not be updated.
     reference_height {Raster Layer}:
         The raster surface that will be used to provide relative height values
         for each point in the point cloud data. Points that do not overlap
         with the raster will be omitted from the analysis.
     excluded_class_codes {Long}:
         The class codes that will be excluded from processing. Any value in
         the range of 0 to 255 can be specified.
     batch_size {Long}:
         The number of point cloud data blocks that will be simultaneously
         processed during the inferencing operation. Generally, a larger batch
         size will cause faster processing of the data, but avoid using a batch
         size that is too large for the resources of the computer. When using
         the GPU, the available GPU memory is the most common constraint on the
         batch size the computer can handle. The memory used by a given block
         depends on the model's block point limit and required point
         attributes. To find the available GPU memory and for more information
         about evaluating GPU memory usage, use the NVIDIA SMI command line
         utility described in the Usages section.For certain architectures, an
         optimal batch size will be calculated if
         the batch size is unspecified. When the GPU is used, the optimal batch
         size will be based on how much memory is consumed by a given block of
         data and how much GPU memory is freely available when the tool is run.
         When the CPU is used for inferencing, each block is processed on a CPU
         thread, and the optimal batch size is calculated to be half of the
         available, unused CPU threads."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ClassifyPointCloudUsingTrainedModel_3d(
                *gp_fixargs(
                    (
                        in_point_cloud,
                        in_trained_model,
                        output_classes,
                        in_class_mode,
                        target_classes,
                        compute_stats,
                        boundary,
                        update_pyramid,
                        reference_height,
                        excluded_class_codes,
                        batch_size,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("EvaluatePointCloudClassificationModel_3d", None)
def EvaluatePointCloudClassificationModel(
    in_trained_model=None,
    in_point_cloud=None,
    target_folder=None,
    base_name=None,
    boundary=None,
    class_remap=None,
    reference_height=None,
    excluded_class_codes=None,
) -> Result3[str, str, str]:
    """EvaluatePointCloudClassificationModel(in_trained_model;in_trained_model..., in_point_cloud, target_folder, base_name, {boundary}, {class_remap;class_remap...}, {reference_height}, {excluded_class_codes;excluded_class_codes...})

       Evaluates the quality of one or more point cloud classification models
       using a well-classified point cloud as a baseline for comparing the
       classification results obtained from each model.

    INPUTS:
     in_trained_model (Value Table):
         The point cloud classification models and batch sizes that will be
         used during the evaluation process.
     in_point_cloud (LAS Dataset Layer / File):
         The point cloud that will be used to evaluate the classification
         models.
     target_folder (Folder):
         The directory that will store the files which summarize the evaluation
         results.
     base_name (String):
         The file name prefix that will be used for each of the output files
         summarizing the evaluation results.
     boundary {Feature Layer}:
         The polygon feature that delineates the portions of the reference
         point cloud that will be used for evaluating the classification
         models.
     class_remap {Value Table}:
         The class codes from the reference point cloud must match the class
         codes in the models being evaluated. When the class codes do not
         match, use this parameter to associate the differing class codes in
         the point cloud with the classes that are supported in the models
         being evaluated.
     reference_height {Raster Layer}:
         The raster surface that will be used to provide relative height values
         for each point in the point cloud data. Points that do not overlap
         with the raster will be omitted from the analysis.
     excluded_class_codes {Long}:
         The class codes that will be excluded from processing. Any value in
         the range of 0 to 255 can be specified."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.EvaluatePointCloudClassificationModel_3d(
                *gp_fixargs(
                    (
                        in_trained_model,
                        in_point_cloud,
                        target_folder,
                        base_name,
                        boundary,
                        class_remap,
                        reference_height,
                        excluded_class_codes,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PreparePointCloudTrainingData_3d", None)
def PreparePointCloudTrainingData(
    in_point_cloud=None,
    block_size=None,
    out_training_data=None,
    training_boundary=None,
    validation_point_cloud=None,
    validation_boundary=None,
    class_codes_of_interest=None,
    block_point_limit=None,
    reference_height=None,
    excluded_class_codes=None,
) -> Result1[str]:
    """PreparePointCloudTrainingData(in_point_cloud, block_size, out_training_data, {training_boundary}, {validation_point_cloud}, {validation_boundary}, {class_codes_of_interest;class_codes_of_interest...}, {block_point_limit}, {reference_height}, {excluded_class_codes;excluded_class_codes...})

       Generates the data that will be used to train and validate a point
       cloud classification model.

    INPUTS:
     in_point_cloud (LAS Dataset Layer / File):
         The point cloud that will be used to create the training data and,
         potentially, the validation data if no validation point cloud is
         provided. In this case, both the training boundary and the validation
         boundary must be defined.
     block_size (Linear Unit):
         The diameter of each block of training data that will be created from
         the input point cloud. As a general rule, the block size should be
         large enough to capture the objects of interest and their surrounding
         context.
     training_boundary {Feature Layer}:
         The polygon features that will delineate the subset of points from the
         input point cloud that will be used for training the model. This
         parameter is required when the validation_point_cloud parameter value
         is not provided.
     validation_point_cloud {LAS Dataset Layer / File}:
         The source of the point cloud that will be used to validate the deep
         learning model. This dataset must reference a different set of points
         than the input point cloud to ensure the quality of the trained model.
         If a validation point cloud is not provided, the input point cloud can
         be used to define the training and validation datasets by providing
         polygon feature classes for the training_boundary and
         validation_boundary parameters.
     validation_boundary {Feature Layer}:
         The polygon features that will delineate the subset of points to be
         used for validating the model during the training process. If a
         validation point cloud is not provided, the points will be sourced
         from the input point cloud and a polygon will be required for the
         training_boundary parameter.
     class_codes_of_interest {Value Table}:
         The class codes that will be used to limit the exported training data
         blocks. All points in the blocks that contain at least one of the
         values listed for this parameter will be exported, except the classes
         specified in the excluded_class_codes parameter or the points that are
         flagged as Withheld. Any value in the range of 0 to 255 can be
         specified.
     block_point_limit {Long}:
         The maximum number of points that will be allowed in each block of the
         training data. When a block contains points in excess of this value,
         multiple blocks will be created for the same location to ensure that
         all of the points are used when training. The default is 8,192.
     reference_height {Raster Layer}:
         The raster surface that will be used to provide relative height values
         for each point in the point cloud data. Points that do not overlap
         with the raster will be omitted from the analysis.
     excluded_class_codes {Long}:
         The class codes that will be excluded from the training data. Any
         value in the range of 0 to 255 can be specified.

    OUTPUTS:
     out_training_data (File):
         The location and name of the output training data (*.pctd file)."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PreparePointCloudTrainingData_3d(
                *gp_fixargs(
                    (
                        in_point_cloud,
                        block_size,
                        out_training_data,
                        training_boundary,
                        validation_point_cloud,
                        validation_boundary,
                        class_codes_of_interest,
                        block_point_limit,
                        reference_height,
                        excluded_class_codes,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TrainPointCloudClassificationModel_3d", None)
def TrainPointCloudClassificationModel(
    in_training_data=None,
    out_model_location=None,
    out_model_name=None,
    pretrained_model=None,
    attributes: list[
        Literal[
            "INTENSITY",
            "RETURN_NUMBER",
            "NUMBER_OF_RETURNS",
            "RED",
            "GREEN",
            "BLUE",
            "NEAR_INFRARED",
            "RELATIVE_HEIGHT",
        ]
    ]
    | Literal[
        "INTENSITY", "RETURN_NUMBER", "NUMBER_OF_RETURNS", "RED", "GREEN", "BLUE", "NEAR_INFRARED", "RELATIVE_HEIGHT"
    ]
    | str
    | None = None,
    min_points=None,
    class_remap=None,
    target_classes: list[
        Literal[
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
            "13",
            "14",
            "15",
            "16",
            "17",
            "18",
            "19",
            "20",
            "21",
            "22",
            "23",
            "24",
            "25",
            "26",
            "27",
            "28",
            "29",
            "30",
            "31",
            "32",
            "33",
            "34",
            "35",
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45",
            "46",
            "47",
            "48",
            "49",
            "50",
            "51",
            "52",
            "53",
            "54",
            "55",
            "56",
            "57",
            "58",
            "59",
            "60",
            "61",
            "62",
            "63",
            "64",
            "65",
            "66",
            "67",
            "68",
            "69",
            "70",
            "71",
            "72",
            "73",
            "74",
            "75",
            "76",
            "77",
            "78",
            "79",
            "80",
            "81",
            "82",
            "83",
            "84",
            "85",
            "86",
            "87",
            "88",
            "89",
            "90",
            "91",
            "92",
            "93",
            "94",
            "95",
            "96",
            "97",
            "98",
            "99",
            "100",
            "101",
            "102",
            "103",
            "104",
            "105",
            "106",
            "107",
            "108",
            "109",
            "110",
            "111",
            "112",
            "113",
            "114",
            "115",
            "116",
            "117",
            "118",
            "119",
            "120",
            "121",
            "122",
            "123",
            "124",
            "125",
            "126",
            "127",
            "128",
            "129",
            "130",
            "131",
            "132",
            "133",
            "134",
            "135",
            "136",
            "137",
            "138",
            "139",
            "140",
            "141",
            "142",
            "143",
            "144",
            "145",
            "146",
            "147",
            "148",
            "149",
            "150",
            "151",
            "152",
            "153",
            "154",
            "155",
            "156",
            "157",
            "158",
            "159",
            "160",
            "161",
            "162",
            "163",
            "164",
            "165",
            "166",
            "167",
            "168",
            "169",
            "170",
            "171",
            "172",
            "173",
            "174",
            "175",
            "176",
            "177",
            "178",
            "179",
            "180",
            "181",
            "182",
            "183",
            "184",
            "185",
            "186",
            "187",
            "188",
            "189",
            "190",
            "191",
            "192",
            "193",
            "194",
            "195",
            "196",
            "197",
            "198",
            "199",
            "200",
            "201",
            "202",
            "203",
            "204",
            "205",
            "206",
            "207",
            "208",
            "209",
            "210",
            "211",
            "212",
            "213",
            "214",
            "215",
            "216",
            "217",
            "218",
            "219",
            "220",
            "221",
            "222",
            "223",
            "224",
            "225",
            "226",
            "227",
            "228",
            "229",
            "230",
            "231",
            "232",
            "233",
            "234",
            "235",
            "236",
            "237",
            "238",
            "239",
            "240",
            "241",
            "242",
            "243",
            "244",
            "245",
            "246",
            "247",
            "248",
            "249",
            "250",
            "251",
            "252",
            "253",
            "254",
            "255",
        ]
    ]
    | Literal[
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20",
        "21",
        "22",
        "23",
        "24",
        "25",
        "26",
        "27",
        "28",
        "29",
        "30",
        "31",
        "32",
        "33",
        "34",
        "35",
        "36",
        "37",
        "38",
        "39",
        "40",
        "41",
        "42",
        "43",
        "44",
        "45",
        "46",
        "47",
        "48",
        "49",
        "50",
        "51",
        "52",
        "53",
        "54",
        "55",
        "56",
        "57",
        "58",
        "59",
        "60",
        "61",
        "62",
        "63",
        "64",
        "65",
        "66",
        "67",
        "68",
        "69",
        "70",
        "71",
        "72",
        "73",
        "74",
        "75",
        "76",
        "77",
        "78",
        "79",
        "80",
        "81",
        "82",
        "83",
        "84",
        "85",
        "86",
        "87",
        "88",
        "89",
        "90",
        "91",
        "92",
        "93",
        "94",
        "95",
        "96",
        "97",
        "98",
        "99",
        "100",
        "101",
        "102",
        "103",
        "104",
        "105",
        "106",
        "107",
        "108",
        "109",
        "110",
        "111",
        "112",
        "113",
        "114",
        "115",
        "116",
        "117",
        "118",
        "119",
        "120",
        "121",
        "122",
        "123",
        "124",
        "125",
        "126",
        "127",
        "128",
        "129",
        "130",
        "131",
        "132",
        "133",
        "134",
        "135",
        "136",
        "137",
        "138",
        "139",
        "140",
        "141",
        "142",
        "143",
        "144",
        "145",
        "146",
        "147",
        "148",
        "149",
        "150",
        "151",
        "152",
        "153",
        "154",
        "155",
        "156",
        "157",
        "158",
        "159",
        "160",
        "161",
        "162",
        "163",
        "164",
        "165",
        "166",
        "167",
        "168",
        "169",
        "170",
        "171",
        "172",
        "173",
        "174",
        "175",
        "176",
        "177",
        "178",
        "179",
        "180",
        "181",
        "182",
        "183",
        "184",
        "185",
        "186",
        "187",
        "188",
        "189",
        "190",
        "191",
        "192",
        "193",
        "194",
        "195",
        "196",
        "197",
        "198",
        "199",
        "200",
        "201",
        "202",
        "203",
        "204",
        "205",
        "206",
        "207",
        "208",
        "209",
        "210",
        "211",
        "212",
        "213",
        "214",
        "215",
        "216",
        "217",
        "218",
        "219",
        "220",
        "221",
        "222",
        "223",
        "224",
        "225",
        "226",
        "227",
        "228",
        "229",
        "230",
        "231",
        "232",
        "233",
        "234",
        "235",
        "236",
        "237",
        "238",
        "239",
        "240",
        "241",
        "242",
        "243",
        "244",
        "245",
        "246",
        "247",
        "248",
        "249",
        "250",
        "251",
        "252",
        "253",
        "254",
        "255",
    ]
    | str
    | None = None,
    background_class: Literal[
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20",
        "21",
        "22",
        "23",
        "24",
        "25",
        "26",
        "27",
        "28",
        "29",
        "30",
        "31",
        "32",
        "33",
        "34",
        "35",
        "36",
        "37",
        "38",
        "39",
        "40",
        "41",
        "42",
        "43",
        "44",
        "45",
        "46",
        "47",
        "48",
        "49",
        "50",
        "51",
        "52",
        "53",
        "54",
        "55",
        "56",
        "57",
        "58",
        "59",
        "60",
        "61",
        "62",
        "63",
        "64",
        "65",
        "66",
        "67",
        "68",
        "69",
        "70",
        "71",
        "72",
        "73",
        "74",
        "75",
        "76",
        "77",
        "78",
        "79",
        "80",
        "81",
        "82",
        "83",
        "84",
        "85",
        "86",
        "87",
        "88",
        "89",
        "90",
        "91",
        "92",
        "93",
        "94",
        "95",
        "96",
        "97",
        "98",
        "99",
        "100",
        "101",
        "102",
        "103",
        "104",
        "105",
        "106",
        "107",
        "108",
        "109",
        "110",
        "111",
        "112",
        "113",
        "114",
        "115",
        "116",
        "117",
        "118",
        "119",
        "120",
        "121",
        "122",
        "123",
        "124",
        "125",
        "126",
        "127",
        "128",
        "129",
        "130",
        "131",
        "132",
        "133",
        "134",
        "135",
        "136",
        "137",
        "138",
        "139",
        "140",
        "141",
        "142",
        "143",
        "144",
        "145",
        "146",
        "147",
        "148",
        "149",
        "150",
        "151",
        "152",
        "153",
        "154",
        "155",
        "156",
        "157",
        "158",
        "159",
        "160",
        "161",
        "162",
        "163",
        "164",
        "165",
        "166",
        "167",
        "168",
        "169",
        "170",
        "171",
        "172",
        "173",
        "174",
        "175",
        "176",
        "177",
        "178",
        "179",
        "180",
        "181",
        "182",
        "183",
        "184",
        "185",
        "186",
        "187",
        "188",
        "189",
        "190",
        "191",
        "192",
        "193",
        "194",
        "195",
        "196",
        "197",
        "198",
        "199",
        "200",
        "201",
        "202",
        "203",
        "204",
        "205",
        "206",
        "207",
        "208",
        "209",
        "210",
        "211",
        "212",
        "213",
        "214",
        "215",
        "216",
        "217",
        "218",
        "219",
        "220",
        "221",
        "222",
        "223",
        "224",
        "225",
        "226",
        "227",
        "228",
        "229",
        "230",
        "231",
        "232",
        "233",
        "234",
        "235",
        "236",
        "237",
        "238",
        "239",
        "240",
        "241",
        "242",
        "243",
        "244",
        "245",
        "246",
        "247",
        "248",
        "249",
        "250",
        "251",
        "252",
        "253",
        "254",
        "255",
    ]
    | None = None,
    class_descriptions=None,
    model_selection_criteria: Literal["VALIDATION_LOSS", "ACCURACY", "RECALL", "F1_SCORE", "PRECISION"] | None = None,
    max_epochs=None,
    epoch_iterations=None,
    learning_rate=None,
    batch_size=None,
    early_stop: Literal["EARLY_STOP", "NO_EARLY_STOP"] | None = None,
    learning_rate_strategy: Literal["ONE_CYCLE", "FIXED"] | None = None,
    architecture: Literal["POINTCNN", "RANDLANET", "SQN"] | None = None,
    loss_function: Literal["CROSS_ENTROPY_LOSS", "FOCAL_LOSS"] | None = None,
) -> Result3[str, str, str]:
    """TrainPointCloudClassificationModel(in_training_data, out_model_location, out_model_name, {pretrained_model}, {attributes;attributes...}, {min_points}, {class_remap;class_remap...}, {target_classes;target_classes...}, {background_class}, {class_descriptions;class_descriptions...}, {model_selection_criteria}, {max_epochs}, {epoch_iterations}, {learning_rate}, {batch_size}, {early_stop}, {learning_rate_strategy}, {architecture}, {loss_function})

       Trains a deep learning model for point cloud classification.

    INPUTS:
     in_training_data (File):
         The point cloud training data (*.pctd file) that will be used to train
         the classification model.
     out_model_location (Folder):
         An existing folder that will store the new directory containing the
         deep learning model.
     out_model_name (String):
         The name of the output Esri model definition file (*.emd), deep
         learning package (*.dlpk), and the directory that will be created to
         store them.
     pretrained_model {File}:
         The pretrained model that will be refined. When a pretrained model is
         provided, the input training data must have the same attributes, class
         codes, and maximum number of points that were used by the training
         data that generated this model.
     attributes {String}:
         Specifies the point attributes that will be used to train the model.
         Only the attributes that are present in the point cloud training data
         will be available. No additional attributes are included by
         default.INTENSITY-The measure of the magnitude of the lidar pulse
         return will
         be used.RETURN_NUMBER-The ordinal position of the point obtained from
         a given
         lidar pulse will be used.NUMBER_OF_RETURNS-The total number of lidar
         returns that were
         identified as points from the pulse associated with a given point will
         be used.RED-The red band's value from a point cloud with color
         information
         will be used.GREEN-The green band's value from a point cloud with
         color information
         will be used.BLUE-The blue band's value from a point cloud with color
         information
         will be used.NEAR_INFRARED-The near infrared band's value from a point
         cloud with
         near infrared information will be used.RELATIVE_HEIGHT-The relative
         height of each point in relation to a
         reference surface, which would typically be a bare earth DEM, will be
         used.
     min_points {Long}:
         The minimum number of points that must be present in a given block for
         it to be used when training the model. The default is 0.
     class_remap {Value Table}:
         Defines how class code values will map to new values before training
         the deep learning model.
     target_classes {Long}:
         The class codes that will be used to filter the blocks in the training
         data. When class codes of interest are specified, all other class
         codes are remapped to the background class code.
     background_class {Long}:
         The class code value that will be used for all other class codes when
         class codes of interest have been specified.
     class_descriptions {Value Table}:
         The descriptions of what each class code in the training data
         represents.
     model_selection_criteria {String}:
         Specifies the statistical basis that will be used to determine the
         final model.VALIDATION_LOSS-The model that achieves the lowest result
         when the
         entropy loss function is applied to the validation data will be
         used.RECALL-The model that achieves the best macro average of the
         recall
         for all class codes will be used. Each class code's recall value is
         determined by the ratio of correctly classified points (true
         positives) over all the points that should have been classified with
         this value (expected positives). This is the default.F1_SCORE-The
         model that achieves the best harmonic mean between the
         macro average of the precision and recall values for all class codes
         will be used. This provides a balance between precision and recall,
         which favors better overall performance.PRECISION-The model that
         achieves the best macro average of the
         precision for all class codes will be used. Each class code's
         precision is determined by the ratio of points that are correctly
         classified (true positives) over all the points that are classified
         (true positives and false positives).ACCURACY-The model that achieves
         the highest ratio of corrected
         classified points over all the points in the validation data will be
         used.
     max_epochs {Long}:
         The number of times each block of data will be passed forward and
         backward through the neural network. The default is 25.
     epoch_iterations {Double}:
         The percentage of the data that will be processed in each training
         epoch. The default is 100.
     learning_rate {Double}:
         The rate at which existing information will be overwritten with new
         information. If no value is provided, the optimal learning rate will
         be extracted from the learning curve during the training process. This
         is the default.
     batch_size {Long}:
         The number of training data blocks that will be processed at any given
         time. The default is 2.
     early_stop {Boolean}:
         Specifies whether the model training will stop when the metric
         specified in the model_selection_criteria parameter does not register
         any improvement after five consecutive epochs.EARLY_STOP-The model
         training will stop when the model is no longer
         improving. This is the default.NO_EARLY_STOP-The model training will
         continue until the maximum
         number of epochs has been reached.
     learning_rate_strategy {String}:
         Specifies how the learning rate will be modified during
         training.ONE_CYCLE-The learning rate will be cycled throughout each
         epoch using
         Fast.AI's implementation of the 1cycle technique for training neural
         networks to help improve the training of a convolutional neural
         network. This is the default.FIXED-The same learning rate will be used
         throughout the training
         process.
     architecture {String}:
         Specifies the neural network architecture that will be used to train
         the model. When a pretrained model is specified, the architecture used
         for creating the pretrained model will be automatically
         set.POINTCNN-The PointCNN architecture will be used.RANDLANET-The
         RandLA-
         Net architecture will be used. RandLA-Net is
         built on the principles of simple random sampling and local feature
         aggregation. This is the default.SQN-The Semantic Query Network (SQN)
         architecture will be used. SQN
         does not require a comprehensive classification of the training data
         as the other neural network architectures do.
     loss_function {String}:
         Specifies the loss function that will be used during
         training.CROSS_ENTROPY_LOSS-Cross entropy loss will be used. This
         function is
         best suited for training data in which each class has a similar number
         of points to the other classes. This is the default.FOCAL_LOSS-Focal
         loss will be used. This function is best suited for
         training data in which the classes that are being trained may have
         point counts with great variation."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TrainPointCloudClassificationModel_3d(
                *gp_fixargs(
                    (
                        in_training_data,
                        out_model_location,
                        out_model_name,
                        pretrained_model,
                        attributes,
                        min_points,
                        class_remap,
                        target_classes,
                        background_class,
                        class_descriptions,
                        model_selection_criteria,
                        max_epochs,
                        epoch_iterations,
                        learning_rate,
                        batch_size,
                        early_stop,
                        learning_rate_strategy,
                        architecture,
                        loss_function,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Point Cloud\Conversion toolset
@gptooldoc("LASToMultipoint_3d", None)
def LASToMultipoint(
    input=None,
    out_feature_class=None,
    average_point_spacing=None,
    class_code=None,
    _return=None,
    attribute=None,
    input_coordinate_system=None,
    file_suffix=None,
    z_factor=None,
    folder_recursion: Literal["RECURSION", "NO_RECURSION"] | None = None,
) -> Result1[str]:
    """LASToMultipoint(input;input..., out_feature_class, average_point_spacing, {class_code;class_code...}, {_return;_return...}, {attribute;attribute...}, {input_coordinate_system}, {file_suffix}, {z_factor}, {folder_recursion})

       Creates multipoint features using one or more lidar files.

    INPUTS:
     input (LAS Dataset Layer / Folder / File):
         The LAS or ZLAS files that will be imported to a multipoint feature
         class. If a folder is specified, all the LAS files that reside therein
         will be imported. In thepane, a folder can also be specified as
         an input by
         selecting the folder in File Explorer and dragging it onto the
         parameter's input box. Geoprocessing
     average_point_spacing (Double):
         The average 2D distance between points in the input file or files.
         This can be an approximation. If areas have been sampled at different
         densities, specify the smaller spacing. The value needs to be provided
         in the projection units of the output coordinate system.
     class_code {Long}:
         The classification codes that will be used as a query filter for LAS
         data points. Valid values range from 0 to 255. No filter is applied by
         default.
     return {String}:
         The return values that will be used to filter the LAS points that get
         imported to multipoint features.ANY_RETURNS-Any
         returns1-12-23-34-45-56-67-78-8LAST_RETURNS-Last
         returns
     attribute {Value Table}:
         The LAS point properties whose values will be stored in binary
         large object (BLOB) fields in the attribute table of the output. If
         the resulting features will participate in a terrain dataset, the
         stored attributes can be used to symbolize the terrain. Thecolumn
         indicates the name of the field that will be used to store the
         specified attributes. The following LAS properties are supported:
         NameINTENSITY-IntensityRETURN_NUMBER-Return
         numberNUMBER_OF_RETURNS-Number
         of returns per pulseSCAN_DIRECTION_FLAG-Scan direction
         flagEDGE_OF_FLIGHTLINE-Edge of
         flightlineCLASSIFICATION-ClassificationSCAN_ANGLE_RANK-Scan angle
         rankFILE_MARKER-File markerUSER_BIT_FIELD-User data valueGPS_TIME-GPS
         timeCOLOR_RED-Red bandCOLOR_GREEN-Green bandCOLOR_BLUE-Blue band
     input_coordinate_system {Coordinate System}:
         The coordinate system of the input LAS file.
     file_suffix {String}:
         The suffix of the files that will be imported from an input folder.
         This parameter is required when a folder is specified as input.
     z_factor {Double}:
         The factor by which z-values will be multiplied. This is typically
         used to convert z linear units to match x,y linear units. The default
         is 1, which leaves elevation values unchanged. This parameter is not
         available if the spatial reference of the input surface has a z-datum
         with a specified linear unit.
     folder_recursion {Boolean}:
         Scans through subfolders when an input folder is selected containing
         data in a subfolders directory. The output feature class will be
         generated with a row for each file encountered in the directory
         structure.NO_RECURSION-Only LAS files found in an input folder will be
         converted
         to multipoint features. This is the default.RECURSION-All LAS files
         residing in the subdirectories of an input
         folder will be converted to multipoint features.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LASToMultipoint_3d(
                *gp_fixargs(
                    (
                        input,
                        out_feature_class,
                        average_point_spacing,
                        class_code,
                        _return,
                        attribute,
                        input_coordinate_system,
                        file_suffix,
                        z_factor,
                        folder_recursion,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("LasDatasetToTin_3d", None)
def LasDatasetToTin(
    in_las_dataset=None,
    out_tin=None,
    thinning_type: Literal["NONE", "RANDOM", "WINDOW_SIZE"] | None = None,
    thinning_method: Literal["PERCENT", "NODE_COUNT", "MIN", "MAX", "CLOSEST_TO_MEAN"] | None = None,
    thinning_value=None,
    max_nodes=None,
    z_factor=None,
    clip_to_extent: Literal["CLIP", "NO_CLIP"] | None = None,
) -> Result1[str]:
    """LasDatasetToTin(in_las_dataset, out_tin, {thinning_type}, {thinning_method}, {thinning_value}, {max_nodes}, {z_factor}, {clip_to_extent})

       Exports a triangulated irregular network (TIN) from a LAS dataset.

    INPUTS:
     in_las_dataset (LAS Dataset Layer):
         The LAS dataset that will be processed.
     thinning_type {String}:
         Specifies the technique to be used to select a subset of LAS data
         points that will be exported to TIN.NONE-No thinning is applied. This
         is the default.RANDOM-LAS data
         points are randomly selected based on the
         corresponding thinning_method selection and thinning_value
         entry.WINDOW_SIZE-The LAS dataset is divided into square tiles defined
         by
         the thinning_value, and LAS points are selected using the
         thinning_method.
     thinning_method {String}:
         Specifies the technique to be used to reduce the LAS data
         points, which impacts the interpretation of. The available options
         depend on the selected. Thinning ValueThinning
         TypePERCENT-Thinning value will reflect the percentage of LAS points
         that
         will be preserved in the outputNODE_COUNT-Thinning value will reflect
         the total number of nodes that
         are allowed in the outputMIN-Selects the LAS data point with the
         lowest elevation in each
         window size areaMAX-Selects the LAS data point with the highest
         elevation in each of
         the automatically determined window size areasCLOSEST_TO_MEAN-Selects
         the LAS data point with the elevation closest
         to the average value found in the automatically determined window size
         areasSpecifies the technique to be used to reduce the LAS data points,
         which impacts the interpretation of the thinning_value. The available
         options depend on the selected thinning_type.
     thinning_value {Double}:
         If thinning_type="WINDOW_SIZE", this value represents the sampling
         area by which the LAS dataset will be divided.If
         thinning_type="RANDOM" and thinning_method="PERCENT", this value
         represents the percentage of points from the LAS dataset that will be
         exported to the TIN.If thinning_type="RANDOM" and
         thinning_method="NODE_COUNT", this value
         represents the total number of LAS points that can be exported to the
         TIN.
     max_nodes {Double}:
         The maximum number of nodes permitted in the output TIN. The default
         is 5 million.
     z_factor {Double}:
         The factor by which z-values will be multiplied. This is typically
         used to convert z linear units to match x,y linear units. The default
         is 1, which leaves elevation values unchanged. This parameter is not
         available if the spatial reference of the input surface has a z-datum
         with a specified linear unit.
     clip_to_extent {Boolean}:
         Specifies whether the resulting TIN will be clipped against the
         analysis extent. This only has an effect if the analysis extent is a
         subset of the input LAS dataset.CLIP-Clips the output TIN against the
         analysis extent. This is the
         default.NO_CLIP-Does not clip the output TIN against the analysis
         extent.

    OUTPUTS:
     out_tin (TIN):
         The TIN dataset that will be generated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LasDatasetToTin_3d(
                *gp_fixargs(
                    (
                        in_las_dataset,
                        out_tin,
                        thinning_type,
                        thinning_method,
                        thinning_value,
                        max_nodes,
                        z_factor,
                        clip_to_extent,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Point Cloud\Object Detection (Deep Learning) toolset
@gptooldoc("DetectObjectsFromPointCloudUsingTrainedModel_3d", None)
def DetectObjectsFromPointCloudUsingTrainedModel(
    in_point_cloud=None,
    in_trained_model=None,
    target_objects=None,
    out_features=None,
    batch_size=None,
    boundary=None,
    reference_height=None,
    excluded_class_codes=None,
) -> Result1[str]:
    """DetectObjectsFromPointCloudUsingTrainedModel(in_point_cloud, in_trained_model, target_objects;target_objects..., out_features, {batch_size}, {boundary}, {reference_height}, {excluded_class_codes;excluded_class_codes...})

       Detects objects captured in a point cloud using a deep learning model.

    INPUTS:
     in_point_cloud (LAS Dataset Layer):
         The point cloud that will be used to detect objects.
     in_trained_model (File / String):
         The object detection model that will be used. An Esri model definition
         file (.emd), deep learning package (.dlpk), or published object
         detection model from ArcGIS Online or Portal for ArcGIS can be
         specified.
     target_objects (Value Table):
         The objects that will be identified in the input point cloud, along
         with the confidence and overlap threshold values that will be used to
         accept the detected objects.Object Code-The codes that represent the
         objects the model was trained
         to identify.Confidence-The confidence threshold for object recognition
         operates on
         a scale from 0.0 to 1.0. A higher value means that fewer objects will
         meet the criteria for being positively identified. Setting the
         threshold to 1.0 requires 100 percent certainty in the object's
         detection, effectively making it improbable for any object to be
         recognized. If you want to exclude a particular object from the
         output, set its confidence threshold to 1.0.Overlap-The overlap
         threshold provides a way to select the object that
         will be retained when multiple overlapping objects have been
         identified. The overlap threshold describes the ratio between the
         intersection and the union of overlapping bounding boxes. When
         multiple objects overlap and exceed the overlap threshold, the object
         with the higher confidence will be retained.
     batch_size {Long}:
         The number of blocks from the input point cloud that will be
         simultaneously processed. When no value is provided, one block will be
         processed at a time.
     boundary {Feature Layer}:
         The polygon feature or features that will define the area to be
         processed.
     reference_height {Raster Layer}:
         The raster surface that will be used to calculate relative heights for
         each point. This parameter is required when the input model contains
         the relative height attribute, which indicates it was trained using a
         reference height raster surface.
     excluded_class_codes {Long}:
         The class codes from the input point cloud that will be excluded from
         the points that are processed to detect objects. If the model was
         trained with points from certain class codes being omitted, the points
         in the input point cloud should have the same class of objects
         identified and excluded in order to obtain the best results.

    OUTPUTS:
     out_features (Feature Class):
         The output multipatch features that will contain the bounding boxes
         surrounding the objects detected from the input point cloud."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DetectObjectsFromPointCloudUsingTrainedModel_3d(
                *gp_fixargs(
                    (
                        in_point_cloud,
                        in_trained_model,
                        target_objects,
                        out_features,
                        batch_size,
                        boundary,
                        reference_height,
                        excluded_class_codes,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PreparePointCloudObjectDetectionTrainingData_3d", None)
def PreparePointCloudObjectDetectionTrainingData(
    in_point_cloud=None,
    in_training_features=None,
    in_validation_features=None,
    block_size=None,
    out_training_data=None,
    training_boundary=None,
    training_code_field=None,
    validation_point_cloud=None,
    validation_boundary=None,
    validation_code_field=None,
    block_point_limit=None,
    reference_height=None,
    excluded_class_codes=None,
    blocks_contain_objects: Literal["BLOCKS_WITH_OBJECTS", "ALL_BLOCKS"] | None = None,
) -> Result1[str]:
    """PreparePointCloudObjectDetectionTrainingData(in_point_cloud, in_training_features, in_validation_features, block_size, out_training_data, {training_boundary}, {training_code_field}, {validation_point_cloud}, {validation_boundary}, {validation_code_field}, {block_point_limit}, {reference_height}, {excluded_class_codes;excluded_class_codes...}, {blocks_contain_objects})

       Creates point cloud training data for object detection models using
       deep learning.

    INPUTS:
     in_point_cloud (LAS Dataset Layer / File):
         The point cloud that will be used to create the training data for
         object detection.
     in_training_features (Feature Layer):
         The multipatch features that will identify the objects that will be
         used for training the model.
     in_validation_features (Feature Layer):
         The multipatch features that will identify the objects that will be
         used for validating the model during the training process.
     block_size (Linear Unit):
         The diameter of each block of training data that will be created from
         the input point cloud. As a general rule, the block size should be
         large enough to capture the objects of interest and their surrounding
         context.
     training_boundary {Feature Layer}:
         The polygon features that will delineate the subset of points from the
         input point cloud that will be used for training the model. This
         parameter is required when the validation_point_cloud parameter value
         is not provided.
     training_code_field {Field}:
         The field that identifies the unique ID for each type of object in the
         training multipatch features. When no field is defined, the objects
         are assigned an ID of 0.
     validation_point_cloud {LAS Dataset Layer / File}:
         The source of the point cloud that will be used to validate the deep
         learning model. This dataset must reference a different set of points
         than the input point cloud to ensure the quality of the trained model.
         If a validation point cloud is not provided, the input point cloud can
         be used to define the training and validation datasets by providing
         polygon feature classes for the training_boundary and
         validation_boundary parameters.
     validation_boundary {Feature Layer}:
         The polygon features that will delineate the subset of points to be
         used for validating the model during the training process. If a
         validation point cloud is not provided, the points will be sourced
         from the input point cloud and a polygon will be required for the
         training_boundary parameter.
     validation_code_field {Field}:
         The field that identifies the unique ID for each type of object in the
         validation multipatch features. When no field is defined, the objects
         are assigned an ID of 0.
     block_point_limit {Long}:
         The maximum number of points that can be stored in each block of the
         training data. When a block contains points in excess of this value,
         multiple blocks will be created for the same location to ensure that
         all of the points are used when training. The default is 500,000.
     reference_height {Raster Layer}:
         The raster surface that will be used to provide relative height values
         for each point in the point cloud data. Points that do not overlap
         with the raster will be omitted from the analysis.
     excluded_class_codes {Long}:
         The class codes that will be excluded from the training data. Any
         value in the range of 0 to 255 can be specified.
     blocks_contain_objects {Boolean}:
         Specifies whether the training data will only include blocks that
         contain objects or if blocks that do not contain objects will also be
         included. The data used for validation will not be affected by this
         parameter.BLOCKS_WITH_OBJECTS-Only blocks that contain objects will be
         exported
         in the training data.ALL_BLOCKS-Both blocks that contain objects and
         those that don't will
         be exported in the training data. This is the default.

    OUTPUTS:
     out_training_data (File):
         The location and name of the output training data (a *.pcotd file)."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PreparePointCloudObjectDetectionTrainingData_3d(
                *gp_fixargs(
                    (
                        in_point_cloud,
                        in_training_features,
                        in_validation_features,
                        block_size,
                        out_training_data,
                        training_boundary,
                        training_code_field,
                        validation_point_cloud,
                        validation_boundary,
                        validation_code_field,
                        block_point_limit,
                        reference_height,
                        excluded_class_codes,
                        blocks_contain_objects,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TrainPointCloudObjectDetectionModel_3d", None)
def TrainPointCloudObjectDetectionModel(
    in_training_data=None,
    out_model_location=None,
    out_model_name=None,
    pretrained_model=None,
    architecture: Literal["SECD"] | None = None,
    attributes: list[
        Literal[
            "INTENSITY",
            "RETURN_NUMBER",
            "NUMBER_OF_RETURNS",
            "RED",
            "GREEN",
            "BLUE",
            "NEAR_INFRARED",
            "RELATIVE_HEIGHT",
        ]
    ]
    | Literal[
        "INTENSITY", "RETURN_NUMBER", "NUMBER_OF_RETURNS", "RED", "GREEN", "BLUE", "NEAR_INFRARED", "RELATIVE_HEIGHT"
    ]
    | str
    | None = None,
    min_points=None,
    remap_objects=None,
    target_objects=None,
    train_blocks: Literal["OBJECT_BLOCKS", "ALL_BLOCKS"] | None = None,
    object_descriptions=None,
    model_selection_criteria: Literal["VALIDATION_LOSS", "AVERAGE_PRECISION"] | None = None,
    max_epochs=None,
    learning_rate_strategy: Literal["ONE_CYCLE", "FIXED"] | None = None,
    learning_rate=None,
    batch_size=None,
    early_stop: Literal["EARLY_STOP", "NO_EARLY_STOP"] | None = None,
    architecture_settings=None,
) -> Result2[str, str]:
    """TrainPointCloudObjectDetectionModel(in_training_data, out_model_location, out_model_name, {pretrained_model}, {architecture}, {attributes;attributes...}, {min_points}, {remap_objects;remap_objects...}, {target_objects;target_objects...}, {train_blocks}, {object_descriptions;object_descriptions...}, {model_selection_criteria}, {max_epochs}, {learning_rate_strategy}, {learning_rate}, {batch_size}, {early_stop}, {architecture_settings;architecture_settings...})

       Trains an object detection model for point clouds using deep learning.

    INPUTS:
     in_training_data (File):
         The point cloud object detection training data (*.pcotd file) that
         will be used to train the model.
     out_model_location (Folder):
         An existing folder that will store the new directory containing the
         deep learning model.
     out_model_name (String):
         The name of the output Esri model definition file (*.emd), deep
         learning package (*.dlpk), and the directory that will be created to
         store them.
     pretrained_model {File}:
         The pretrained object detection model that will be refined. When a
         pretrained model is provided, the input training data must have the
         same attributes and maximum number of points that were used by the
         training data that generated the model.
     architecture {String}:
         Specifies the architecture that will be used to train the
         model.SECD-The Sparsely Embedded CONvolutional Detection (SECOND)
         architecture will be used. This is the default.
     attributes {String}:
         Specifies the point attributes that will be used with the
         classification code when training the model. Only the attributes that
         are present in the point cloud training data will be available. No
         additional attributes are included by default.INTENSITY-The measure of
         the magnitude of the lidar pulse return will
         be used.RETURN_NUMBER-The ordinal position of the point obtained from
         a given
         lidar pulse will be used.NUMBER_OF_RETURNS-The total number of lidar
         returns that were
         identified as points from the pulse associated with a given point will
         be used.RED-The red band's value from a point cloud with color
         information
         will be used.GREEN-The green band's value from a point cloud with
         color information
         will be used.BLUE-The blue band's value from a point cloud with color
         information
         will be used.NEAR_INFRARED-The near infrared band's value from a point
         cloud with
         near infrared information will be used.RELATIVE_HEIGHT-The relative
         height of each point in relation to a
         reference surface, which would typically be a bare earth DEM, will be
         used.
     min_points {Long}:
         The minimum number of points that must be present in a given block for
         it to be used when training the model. The default is 0.
     remap_objects {Value Table}:
         Defines how object codes will be remapped to new values before
         training the deep learning model.Current Code-The object code value in
         the training dataRemapped
         Code-The object code value that the existing code will be
         changed to
     target_objects {Long}:
         The object codes that will be used to filter the objects in the
         training data. When object codes are provided, the objects that are
         not included will be ignored.
     train_blocks {Boolean}:
         Specifies whether the model will be trained using only blocks that
         contain objects or if all blocks, including those that do not contain
         objects.OBJECT_BLOCKS-The model will be trained using only blocks that
         contain
         objects. The data used for validation will not be
         modified.ALL_BLOCKS-The model will be trained using all blocks,
         including those
         that do not contain objects. This is the default.
     object_descriptions {Value Table}:
         The descriptions for each object code in the training data.Object
         Code-The object code value that was learned by the
         modelDescription-The object described by the class code
     model_selection_criteria {String}:
         Specifies the statistical basis that will be used to determine the
         final model.VALIDATION_LOSS-The model that achieves the lowest result
         when the
         entropy loss function is applied to the validation data will be
         used.AVERAGE_PRECISION-The model that achieves the highest ratio of
         points
         in the validation data that were correctly classified by the model
         trained in the epoch (true positives) over all the points in the
         validation data will be used. This is the default.
     max_epochs {Long}:
         The number of times each block of data will be passed forward and
         backward through the neural network. The default is 25.
     learning_rate_strategy {String}:
         Specifies how the learning rate will be modified during
         training.ONE_CYCLE-The learning rate will be cycled throughout each
         epoch using
         Fast.AI's implementation of the 1cycle technique for training neural
         networks to help improve the training of a convolutional neural
         network. This is the default.FIXED-The same learning rate will be used
         throughout the training
         process.
     learning_rate {Double}:
         The rate at which existing information will be overwritten with new
         information. If no value is provided, the optimal learning rate will
         be extracted from the learning curve during the training process. This
         is the default.
     batch_size {Long}:
         The number of training data blocks that will be processed at any given
         time. The default is 2.
     early_stop {Boolean}:
         Specifies whether the model training will stop when the metric
         specified in the model_selection_criteria parameter does not register
         any improvement after five consecutive epochs.EARLY_STOP-The model
         training will stop when the model is no longer
         improving.NO_EARLY_STOP-The model training will continue until the
         maximum
         number of epochs has been reached. This is the default.
     architecture_settings {Value Table}:
         The architecture settings that can be modified to improve training
         results. Option-The architecture-specific options that can be
         modified. VOXEL_WIDTH-The x- and y-dimensions of the voxel
         used during training.
         The corresponding value is in linear units of meters and can be
         expressed as a double value.VOXEL_HEIGHT-The z-dimension of the voxel
         used during training. The
         corresponding value is in linear units of meters and can be expressed
         as a double value.VOXEL_POINT_LIMIT-The number of points in a given
         voxel. The
         corresponding value should be a positive integer. When no value is
         provided, this limit is calculated during the training process based
         on the block size and block point limit of the training
         data.MAX_TRAINING_VOXELS-The maximum number of voxels that can be used
         in
         the training data. The corresponding value should be a positive
         integer. When no value is provided, this limit is calculated during
         training.MAX_VALIDATION_VOXELS-The maximum number of voxels that can
         be used in
         the validation data. The corresponding value should be a positive
         integer. When no value is provided, this limit is calculated during
         training.Value-The value that corresponds with the option being
         modified."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TrainPointCloudObjectDetectionModel_3d(
                *gp_fixargs(
                    (
                        in_training_data,
                        out_model_location,
                        out_model_name,
                        pretrained_model,
                        architecture,
                        attributes,
                        min_points,
                        remap_objects,
                        target_objects,
                        train_blocks,
                        object_descriptions,
                        model_selection_criteria,
                        max_epochs,
                        learning_rate_strategy,
                        learning_rate,
                        batch_size,
                        early_stop,
                        architecture_settings,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Raster\Conversion toolset
@gptooldoc("RasterDomain_3d", None)
def RasterDomain(
    in_raster=None,
    out_feature_class=None,
    out_geometry_type: Literal["LINE", "POLYGON"] | None = None,
) -> Result1[str]:
    """RasterDomain(in_raster, out_feature_class, out_geometry_type)

       Constructs a 3D polygon or polyline delineating the height along the
       boundary of a raster surface.

    INPUTS:
     in_raster (Raster Layer / Mosaic Layer):
         The raster to process.
     out_geometry_type (String):
         The geometry of the output feature class.LINE-The output will be a
         z-enabled line feature class.POLYGON-The
         output will be a z-enabled polygon feature class.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RasterDomain_3d(*gp_fixargs((in_raster, out_feature_class, out_geometry_type), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RasterTin_3d", None)
def RasterTin(
    in_raster=None,
    out_tin=None,
    z_tolerance=None,
    max_points=None,
    z_factor=None,
) -> Result1[str]:
    """RasterTin(in_raster, out_tin, {z_tolerance}, {max_points}, {z_factor})

       Converts a raster to a triangulated irregular network (TIN) dataset.

    INPUTS:
     in_raster (Raster Layer / Mosaic Layer):
         The raster to process.
     z_tolerance {Double}:
         The maximum allowable difference in (z units) between the height of
         the input raster and the height of the output TIN. By default, the z
         tolerance is 1/10 of the z range of the input raster.
     max_points {Long}:
         The maximum number of points that will be added to the TIN before the
         process is terminated. By default, the process will continue until all
         the points are added.
     z_factor {Double}:
         The factor that the height values of the raster will be multiplied by
         in the resulting TIN dataset. This is typically used to convert Z
         units to match XY units.

    OUTPUTS:
     out_tin (TIN):
         The TIN dataset that will be generated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RasterTin_3d(*gp_fixargs((in_raster, out_tin, z_tolerance, max_points, z_factor), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RasterToMultipoint_3d", None)
def RasterToMultipoint(
    in_raster=None,
    out_feature_class=None,
    out_vip_table=None,
    method: Literal["ZTOLERANCE", "KERNEL", "VIP_HISTOGRAM", "VIP", "NO_THIN"] | None = None,
    kernel_method: Literal["MIN", "MAX", "MINMAX", "MEAN"] | None = None,
    z_factor=None,
    thinning_value=None,
) -> Result2[str, str]:
    """RasterToMultipoint(in_raster, out_feature_class, {out_vip_table}, {method}, {kernel_method}, {z_factor}, {thinning_value})

       Converts raster cell centers to 3D multipoint features with z-values
       that reflect the raster cell value.

    INPUTS:
     in_raster (Raster Layer / Mosaic Layer):
         The raster that will be processed.
     method {String}:
         Specifies the thinning method that will be applied to the input raster
         to select a subset of cells that will be exported to the multipoint
         feature class.NO_THIN-No thinning will be applied. This is the
         default.ZTOLERANCE-Only the cells that are required for maintaining a
         surface
         within a specified z-range of the input raster will be exported.
         KERNEL-The raster will be divided into equal-sized tiles
         based on theparameter value, and one or two cells that meet
         theparameter value will be exported. Thinning ValueKernel
         Method         VIP-A roving 3-cell-by-3-cell window will be used to
         create a
         three-dimensional best fit plane. Each cell is given a significance
         score based on its absolute deviation from this plane. A histogram of
         these scores is then used to determine the cells that will be exported
         based on theparameter value. Thinning ValueVIP_HISTOGRAM-A
         table will be created containing the significance
         values and the corresponding number of points associated with those
         values.
     kernel_method {String}:
         Specifies the selection method that will be used in each kernel
         neighborhood when kernel thinning is applied on the input raster.MIN-A
         point will be created at the cell with the smallest elevation
         value found in the kernel neighborhood. This is the default.MAX-A
         point will be created at the cell with the largest elevation
         value found in the kernel neighborhood.MINMAX-Two points will be
         created at the cells with the smallest and
         largest z-values found in the kernel neighborhood.MEAN-A point will be
         created at the cell whose elevation value is
         closest to the average of the cells in the kernel neighborhood.
     z_factor {Double}:
         The factor by which z-values will be multiplied. This is typically
         used to convert z linear units to match x,y linear units. The default
         is 1, which leaves elevation values unchanged. This parameter is not
         available if the spatial reference of the input surface has a z-datum
         with a specified linear unit.
     thinning_value {Double}:
         The thinning value associated with the method parameter
         value.ZTolerance-The maximum allowable difference in z-units between
         the
         input raster and the surface created from the output multipoint
         feature class. The default value is one-tenth of the z-range of the
         input raster.KERNEL-The number of raster cells along the edge of each
         tile. The
         default value is 3, which means that the raster will be divided into
         3-cell-by-3-cell windows.VIP-The percentile rank of the histogram of
         significance scores. The
         default value is 5.0, which means that the cells with scores within
         the top 5 percent of the histogram will be exported.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced.
     out_vip_table {Table}:
         The histogram table that will be created whenis specified for
         theparameter. VIP HistogramThinning MethodThe histogram table
         that will be created when VIP_HISTOGRAM is
         specified for the method parameter."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RasterToMultipoint_3d(
                *gp_fixargs(
                    (in_raster, out_feature_class, out_vip_table, method, kernel_method, z_factor, thinning_value), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Raster\Interpolation toolset
@gptooldoc("Idw_3d", None)
def Idw(
    in_point_features=None,
    z_field=None,
    out_raster=None,
    cell_size=None,
    power=None,
    search_radius=None,
    in_barrier_polyline_features=None,
) -> Result1[str]:
    """Idw(in_point_features, z_field, out_raster, {cell_size}, {power}, {search_radius}, {in_barrier_polyline_features})

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
         Defines which of the input points will be used to interpolate the
         value for each cell in the output raster.There are two ways to specify
         the searching neighborhood: Variable and
         Fixed.Variable uses a variable search radius in order to find a
         specified
         number of input sample points for the interpolation. Fixed uses a
         specified fixed distance within which all input points will be used.
         Variable is the default.The syntax for these parameters are:
         Variable, number_of_points, maximum_distance, where
         number_of_points-An integer value specifying the number of nearest
         input sample points to be used to perform interpolation. The default
         is 12 points.maximum_distance-Specifies the distance, in map units, by
         which to
         limit the search for the nearest input sample points. The default
         value is the length of the extent's diagonal. Fixed, distance,
         minimum_number_of_points, where
         distance-Specifies the distance as a radius within which input sample
         points will be used to perform the interpolation. The value of the
         radius is expressed in map units. The default radius is five times the
         cell size of the output raster. minimum_number_of_points-An
         integer defining the minimum
         number of points to be used for interpolation. The default value is 0.
         If the required number of points is not found within the specified
         distance, the search distance will be increased until the specified
         minimum number of points is found.When the search radius needs to be
         increased it is done so until the
         minimum_number_of_points fall within that radius, or the extent of the
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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Idw_3d(
                *gp_fixargs(
                    (
                        in_point_features,
                        z_field,
                        out_raster,
                        cell_size,
                        power,
                        search_radius,
                        in_barrier_polyline_features,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Kriging_3d", None)
def Kriging(
    in_point_features=None,
    z_field=None,
    out_surface_raster=None,
    semiVariogram_props=None,
    cell_size=None,
    search_radius=None,
    out_variance_prediction_raster=None,
) -> Result2[str, str]:
    """Kriging(in_point_features, z_field, out_surface_raster, kriging_model, {cell_size}, {search_radius}, {out_variance_prediction_raster})

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
         The Semivariogram model to be used.There are two models for kriging:
         Ordinary and Universal. The Ordinary
         model has five types of semivariograms available. The Universal model
         has two types of semivariograms available. Each semivariogram has
         several optional parameters that can also be set. Ordinary
         model semivariograms         Spherical-Spherical
         semivariogram model. This is the
         default.Circular-Circular semivariogram model.Exponential-Exponential
         semivariogram model.Gaussian-Gaussian (or normal distribution)
         semivariogram model.Linear-Linear semivariogram model with a sill.
         Universal model semivariograms         LinearDrift-Universal
         Kriging with linear
         drift.QuadraticDrift-Universal Kriging with quadratic drift.
         After the semivariogram model is defined, the remaining
         parameters are common between Ordinary and Universal kriging. These
         include the following:         Lag size-The default is the output
         raster cell
         size.MajorRange-Represents a distance beyond which there is little or
         no
         correlation.PartialSill-The difference between the nugget and the
         sill.Nugget-Represents the error and variation at spatial scales too
         fine
         to detect. The nugget effect is seen as a discontinuity at the
         origin.The form of the semivariogram is a text string:"{semivariogramT
         ype},{lagSize},{majorRange},{partialSill},{nugget}"For
         example:"Circular, 2000, 2.6, 542"
     cell_size {Analysis Cell Size}:
         The cell size of the output raster that will be created.This parameter
         can be defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value will
         be used if specified; otherwise, additional rules will be used to
         calculate it from the other inputs. See the usage section for more
         detail.
     search_radius {Radius}:
         Defines which of the input points will be used to interpolate the
         value for each cell in the output raster.There are two ways to specify
         the searching neighborhood: Variable and
         Fixed.Variable uses a variable search radius in order to find a
         specified
         number of input sample points for the interpolation. Fixed uses a
         specified fixed distance within which all input points will be used.
         Variable is the default.The syntax for these parameters are:
         Variable, number_of_points, maximum_distance, where
         number_of_points-An integer value specifying the number of nearest
         input sample points to be used to perform interpolation. The default
         is 12 points.maximum_distance-Specifies the distance, in map units, by
         which to
         limit the search for the nearest input sample points. The default
         value is the length of the extent's diagonal. Fixed, distance,
         minimum_number_of_points, where
         distance-Specifies the distance as a radius within which input sample
         points will be used to perform the interpolation. The value of the
         radius is expressed in map units. The default radius is five times the
         cell size of the output raster. minimum_number_of_points-An
         integer defining the minimum
         number of points to be used for interpolation. The default value is 0.
         If the required number of points is not found within the specified
         distance, the search distance will be increased until the specified
         minimum number of points is found.When the search radius needs to be
         increased it is done so until the
         minimum_number_of_points fall within that radius, or the extent of the
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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Kriging_3d(
                *gp_fixargs(
                    (
                        in_point_features,
                        z_field,
                        out_surface_raster,
                        semiVariogram_props,
                        cell_size,
                        search_radius,
                        out_variance_prediction_raster,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("NaturalNeighbor_3d", None)
def NaturalNeighbor(
    in_point_features=None,
    z_field=None,
    out_raster=None,
    cell_size=None,
) -> Result1[str]:
    """NaturalNeighbor(in_point_features, z_field, out_raster, {cell_size})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.NaturalNeighbor_3d(*gp_fixargs((in_point_features, z_field, out_raster, cell_size), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Spline_3d", None)
def Spline(
    in_point_features=None,
    z_field=None,
    out_raster=None,
    cell_size=None,
    spline_type: Literal["REGULARIZED", "TENSION"] | None = None,
    weight=None,
    number_points=None,
) -> Result1[str]:
    """Spline(in_point_features, z_field, out_raster, {cell_size}, {spline_type}, {weight}, {number_points})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Spline_3d(
                *gp_fixargs(
                    (in_point_features, z_field, out_raster, cell_size, spline_type, weight, number_points), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SplineWithBarriers_3d", None)
def SplineWithBarriers(
    Input_point_features=None,
    Z_value_field=None,
    Input_barrier_features=None,
    Output_cell_size=None,
    Output_raster=None,
    Smoothing_Factor=None,
) -> Result1[str]:
    """SplineWithBarriers(in_point_features, Z_value_field, {Input_barrier_features}, {cell_size}, Output_raster, {Smoothing_Factor})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SplineWithBarriers_3d(
                *gp_fixargs(
                    (
                        Input_point_features,
                        Z_value_field,
                        Input_barrier_features,
                        Output_cell_size,
                        Output_raster,
                        Smoothing_Factor,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TopoToRaster_3d", None)
def TopoToRaster(
    in_topo_features=None,
    out_surface_raster=None,
    cell_size=None,
    extent=None,
    Margin=None,
    minimum_z_value=None,
    maximum_z_value=None,
    enforce: Literal["ENFORCE", "NO_ENFORCE", "ENFORCE_WITH_SINK"] | None = None,
    data_type: Literal["CONTOUR", "SPOT"] | None = None,
    maximum_iterations=None,
    roughness_penalty=None,
    discrete_error_factor=None,
    vertical_standard_error=None,
    tolerance_1=None,
    tolerance_2=None,
    out_stream_features=None,
    out_sink_features=None,
    out_diagnostic_file=None,
    out_parameter_file=None,
    profile_penalty=None,
    out_residual_feature=None,
    out_stream_cliff_error_feature=None,
    out_contour_error_feature=None,
) -> Result:
    """TopoToRaster(topo_input, out_surface_raster, {cell_size}, {extent}, {Margin}, {minimum_z_value}, {maximum_z_value}, {enforce}, {data_type}, {maximum_iterations}, {roughness_penalty}, {discrete_error_factor}, {vertical_standard_error}, {tolerance_1}, {tolerance_2}, {out_stream_features}, {out_sink_features}, {out_diagnostic_file}, {out_parameter_file}, {profile_penalty}, {out_residual_feature}, {out_stream_cliff_error_feature}, {out_contour_error_feature})

       Interpolates a hydrologically correct raster surface from point, line,
       and polygon data.

    INPUTS:
     topo_input (Topo Features):
         The input features containing the z-values to be interpolated into a
         surface raster.Each feature input can have a field specified that
         contains the
         z-values and one of six types specified.<Feature Layer>-The input
         feature dataset.{Field}-The name of the
         field that stores the attributes, where
         appropriate.{Type}-The type of input feature dataset.There are six
         types of accepted inputs:POINTELEVATION-A point feature class
         representing surface elevations.
         The Field stores the elevations of the points.CONTOUR-A line feature
         class that represents elevation contours. The
         Field stores the elevations of the contour lines.STREAM-A line feature
         class of stream locations. All arcs must be
         oriented to point downstream. The feature class should only contain
         single arc streams. There is no Field option for this input
         type.SINK-A point feature class that represents known topographic
         depressions. Topo to Raster will not attempt to remove from the
         analysis any points explicitly identified as sinks. The Field used
         should be one that stores the elevation of the legitimate sink. If
         NONE is selected, only the location of the sink is used.BOUNDARY-A
         feature class containing a single polygon that represents
         the outer boundary of the output raster. Cells in the output raster
         outside this boundary will be NoData. This option can be used for
         clipping out water areas along coastlines before making the final
         output raster. There is no Field option for this input type.LAKE-A
         polygon feature class that specifies the location of lakes. All
         output raster cells within a lake will be assigned to the minimum
         elevation value of all cells along the shoreline. There is no Field
         option for this input type.CLIFF-A line feature class of the cliffs.
         The cliff line features must
         be oriented so that the left-hand side of the line is on the low side
         of the cliff and the right-hand side is the high side of the cliff.
         There is no Field option for this input type.COAST-A polygon feature
         class containing the outline of a coastal
         area. Cells in the final output raster that lie outside these polygons
         are set to a value that is less than the user-specified minimum height
         limit. There is no Field option for this input type.EXCLUSION-A
         polygon feature class of the areas in which the input data
         should be ignored. These polygons permit removal of elevation data
         from the interpolation process. This is typically used to remove
         elevation data associated with dam walls and bridges. This enables
         interpolation of the underlying valley with connected drainage
         structure. There is no Field option for this input type.Multiple input
         feature datasets should be enclosed by double quotes.
         The individual inputs are separated by a semicolon, with a space
         between each component. See the first Code Sample below for an
         example.
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
         is 20.If the {extent} and Boundary feature dataset are the same as the
         limit
         of the input data (the default), values interpolated along the edge of
         the DEM will not match well with adjacent DEM data. This is because
         they have been interpolated using one-half as much data as the points
         inside the raster, which are surrounded on all sides by input data.
         The {margin} option allows input data beyond these limits to be used
         in the interpolation.
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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TopoToRaster_3d(
                *gp_fixargs(
                    (
                        in_topo_features,
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
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TopoToRasterByFile_3d", None)
def TopoToRasterByFile(
    in_parameter_file=None,
    out_surface_raster=None,
    out_stream_features=None,
    out_sink_features=None,
    out_residual_feature=None,
    out_stream_cliff_error_feature=None,
    out_contour_error_feature=None,
) -> Result:
    """TopoToRasterByFile(in_parameter_file, out_surface_raster, {out_stream_features}, {out_sink_features}, {out_residual_feature}, {out_stream_cliff_error_feature}, {out_contour_error_feature})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TopoToRasterByFile_3d(
                *gp_fixargs(
                    (
                        in_parameter_file,
                        out_surface_raster,
                        out_stream_features,
                        out_sink_features,
                        out_residual_feature,
                        out_stream_cliff_error_feature,
                        out_contour_error_feature,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Trend_3d", None)
def Trend(
    in_point_features=None,
    z_field=None,
    out_raster=None,
    cell_size=None,
    order=None,
    regression_type: Literal["LINEAR", "LOGISTIC"] | None = None,
    out_rms_file=None,
) -> Result2[str, str]:
    """Trend(in_point_features, z_field, out_raster, {cell_size}, {order}, {regression_type}, {out_rms_file})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Trend_3d(
                *gp_fixargs(
                    (in_point_features, z_field, out_raster, cell_size, order, regression_type, out_rms_file), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Raster\Math toolset
@gptooldoc("Divide_3d", None)
def Divide(
    in_raster_or_constant1=None,
    in_raster_or_constant2=None,
    out_raster=None,
) -> Result1[str]:
    """Divide(in_raster_or_constant1, in_raster_or_constant2, out_raster)

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Divide_3d(*gp_fixargs((in_raster_or_constant1, in_raster_or_constant2, out_raster), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Float_3d", None)
def Float(
    in_raster_or_constant=None,
    out_raster=None,
) -> Result1[str]:
    """Float(in_raster_or_constant, out_raster)

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.Float_3d(*gp_fixargs((in_raster_or_constant, out_raster), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("Int_3d", None)
def Int(
    in_raster_or_constant=None,
    out_raster=None,
) -> Result1[str]:
    """Int(in_raster_or_constant, out_raster)

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.Int_3d(*gp_fixargs((in_raster_or_constant, out_raster), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("Minus_3d", None)
def Minus(
    in_raster_or_constant1=None,
    in_raster_or_constant2=None,
    out_raster=None,
) -> Result1[str]:
    """Minus(in_raster_or_constant1, in_raster_or_constant2, out_raster)

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Minus_3d(*gp_fixargs((in_raster_or_constant1, in_raster_or_constant2, out_raster), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Plus_3d", None)
def Plus(
    in_raster_or_constant1=None,
    in_raster_or_constant2=None,
    out_raster=None,
) -> Result1[str]:
    """Plus(in_raster_or_constant1, in_raster_or_constant2, out_raster)

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Plus_3d(*gp_fixargs((in_raster_or_constant1, in_raster_or_constant2, out_raster), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Times_3d", None)
def Times(
    in_raster_or_constant1=None,
    in_raster_or_constant2=None,
    out_raster=None,
) -> Result1[str]:
    """Times(in_raster_or_constant1, in_raster_or_constant2, out_raster)

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Times_3d(*gp_fixargs((in_raster_or_constant1, in_raster_or_constant2, out_raster), True))
        )
        return retval
    except Exception as e:
        raise e


# Raster\Reclass toolset
@gptooldoc("Lookup_3d", None)
def Lookup(
    in_raster=None,
    lookup_field=None,
    out_raster=None,
) -> Result1[str]:
    """Lookup(in_raster, lookup_field, out_raster)

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.Lookup_3d(*gp_fixargs((in_raster, lookup_field, out_raster), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("ReclassByASCIIFile_3d", None)
def ReclassByASCIIFile(
    in_raster=None,
    in_remap_file=None,
    out_raster=None,
    missing_values: Literal["DATA", "NODATA"] | None = None,
) -> Result1[str]:
    """ReclassByASCIIFile(in_raster, in_remap_file, out_raster, {missing_values})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ReclassByASCIIFile_3d(*gp_fixargs((in_raster, in_remap_file, out_raster, missing_values), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ReclassByTable_3d", None)
def ReclassByTable(
    in_raster=None,
    in_remap_table=None,
    from_value_field=None,
    to_value_field=None,
    output_value_field=None,
    out_raster=None,
    missing_values: Literal["DATA", "NODATA"] | None = None,
) -> Result1[str]:
    """ReclassByTable(in_raster, in_remap_table, from_value_field, to_value_field, output_value_field, out_raster, {missing_values})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ReclassByTable_3d(
                *gp_fixargs(
                    (
                        in_raster,
                        in_remap_table,
                        from_value_field,
                        to_value_field,
                        output_value_field,
                        out_raster,
                        missing_values,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Reclassify_3d", None)
def Reclassify(
    in_raster=None,
    reclass_field=None,
    remap=None,
    out_raster=None,
    missing_values: Literal["DATA", "NODATA"] | None = None,
) -> Result1[str]:
    """Reclassify(in_raster, reclass_field, remap, out_raster, {missing_values})

       Reclassifies (or changes) the values in a raster.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster to be reclassified.
     reclass_field (Field):
         Field denoting the values that will be reclassified.
     remap (Remap):
         A remap list that defines how the values will be reclassified.The
         remap list is composed of three components: From, To, and New
         values. Each row in the remap list is separated by a semicolon, and
         the three components are separated by spaces. For example" 0 5 1;5.01
         7.5 2;7.5 10 3 "
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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Reclassify_3d(*gp_fixargs((in_raster, reclass_field, remap, out_raster, missing_values), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Slice_3d", None)
def Slice(
    in_raster=None,
    out_raster=None,
    number_zones=None,
    slice_type: Literal[
        "EQUAL_INTERVAL",
        "EQUAL_AREA",
        "NATURAL_BREAKS",
        "STANDARD_DEVIATION_MEAN_CENTERED",
        "STANDARD_DEVIATION_MEAN_BREAK",
        "DEFINED_INTERVAL",
        "GEOMETRIC_INTERVAL",
    ]
    | None = None,
    base_output_zone=None,
    nodata_to_value=None,
    class_interval_size=None,
) -> Result1[str]:
    """Slice(in_raster, out_raster, {number_zones}, {slice_type}, {base_output_zone}, {nodata_to_value}, {class_interval_size})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Slice_3d(
                *gp_fixargs(
                    (
                        in_raster,
                        out_raster,
                        number_zones,
                        slice_type,
                        base_output_zone,
                        nodata_to_value,
                        class_interval_size,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Raster\Surface toolset
@gptooldoc("Aspect_3d", None)
def Aspect(
    in_raster=None,
    out_raster=None,
    method: Literal["PLANAR", "GEODESIC"] | None = None,
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
    ]
    | None = None,
    project_geodesic_azimuths: Literal["GEODESIC_AZIMUTHS", "PROJECT_GEODESIC_AZIMUTHS"] | None = None,
    analysis_target_device: Literal["GPU_THEN_CPU", "GPU_ONLY", "CPU_ONLY"] | None = None,
) -> Result1[str]:
    """Aspect(in_raster, out_raster, {method}, {z_unit}, {project_geodesic_azimuths}, {analysis_target_device})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Aspect_3d(
                *gp_fixargs(
                    (in_raster, out_raster, method, z_unit, project_geodesic_azimuths, analysis_target_device), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Contour_3d", None)
def Contour(
    in_raster=None,
    out_polyline_features=None,
    contour_interval=None,
    base_contour=None,
    z_factor=None,
    contour_type: Literal["CONTOUR", "CONTOUR_POLYGON", "CONTOUR_SHELL", "CONTOUR_SHELL_UP"] | None = None,
    max_vertices_per_feature=None,
) -> Result1[str]:
    """Contour(in_raster, out_polyline_features, contour_interval, {base_contour}, {z_factor}, {contour_type}, {max_vertices_per_feature})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Contour_3d(
                *gp_fixargs(
                    (
                        in_raster,
                        out_polyline_features,
                        contour_interval,
                        base_contour,
                        z_factor,
                        contour_type,
                        max_vertices_per_feature,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ContourList_3d", None)
def ContourList(
    in_raster=None,
    out_polyline_features=None,
    contour_values=None,
) -> Result1[str]:
    """ContourList(in_raster, out_polyline_features, contour_values;contour_values...)

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ContourList_3d(*gp_fixargs((in_raster, out_polyline_features, contour_values), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ContourWithBarriers_3d", None)
def ContourWithBarriers(
    in_raster=None,
    out_contour_feature_class=None,
    in_barrier_features=None,
    in_contour_type: Literal["POLYLINES", "POLYGONS"] | None = None,
    in_contour_values_file=None,
    explicit_only: Literal["EXPLICIT_VALUES_ONLY", "NO_EXPLICIT_VALUES_ONLY"] | None = None,
    in_base_contour=None,
    in_contour_interval=None,
    in_indexed_contour_interval=None,
    in_contour_list=None,
    in_z_factor=None,
) -> Result1[str]:
    """ContourWithBarriers(in_raster, out_contour_feature_class, {in_barrier_features}, {in_contour_type}, {in_contour_values_file}, {explicit_only}, {in_base_contour}, {in_contour_interval}, {in_indexed_contour_interval}, {in_explicit_contours}, {in_z_factor})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ContourWithBarriers_3d(
                *gp_fixargs(
                    (
                        in_raster,
                        out_contour_feature_class,
                        in_barrier_features,
                        in_contour_type,
                        in_contour_values_file,
                        explicit_only,
                        in_base_contour,
                        in_contour_interval,
                        in_indexed_contour_interval,
                        in_contour_list,
                        in_z_factor,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Curvature_3d", None)
def Curvature(
    in_raster=None,
    out_curvature_raster=None,
    z_factor=None,
    out_profile_curve_raster=None,
    out_plan_curve_raster=None,
) -> Result3[str, str, str]:
    """Curvature(in_raster, out_curvature_raster, {z_factor}, {out_profile_curve_raster}, {out_plan_curve_raster})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Curvature_3d(
                *gp_fixargs(
                    (in_raster, out_curvature_raster, z_factor, out_profile_curve_raster, out_plan_curve_raster), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("HillShade_3d", None)
def HillShade(
    in_raster=None,
    out_raster=None,
    azimuth=None,
    altitude=None,
    model_shadows: Literal["NO_SHADOWS", "SHADOWS"] | None = None,
    z_factor=None,
) -> Result1[str]:
    """HillShade(in_raster, out_raster, {azimuth}, {altitude}, {model_shadows}, {z_factor})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.HillShade_3d(*gp_fixargs((in_raster, out_raster, azimuth, altitude, model_shadows, z_factor), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Slope_3d", None)
def Slope(
    in_raster=None,
    out_raster=None,
    output_measurement: Literal["DEGREE", "PERCENT_RISE"] | None = None,
    z_factor=None,
    method: Literal["PLANAR", "GEODESIC"] | None = None,
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
    ]
    | None = None,
    analysis_target_device: Literal["GPU_THEN_CPU", "GPU_ONLY", "CPU_ONLY"] | None = None,
) -> Result1[str]:
    """Slope(in_raster, out_raster, {output_measurement}, {z_factor}, {method}, {z_unit}, {analysis_target_device})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Slope_3d(
                *gp_fixargs(
                    (in_raster, out_raster, output_measurement, z_factor, method, z_unit, analysis_target_device), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SurfaceParameters_3d", None)
def SurfaceParameters(
    in_raster=None,
    out_raster=None,
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
    ]
    | None = None,
    local_surface_type: Literal["QUADRATIC", "BIQUADRATIC"] | None = None,
    neighborhood_distance=None,
    use_adaptive_neighborhood: Literal["FIXED_NEIGHBORHOOD", "ADAPTIVE_NEIGHBORHOOD"] | None = None,
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
    ]
    | None = None,
    output_slope_measurement: Literal["DEGREE", "PERCENT_RISE"] | None = None,
    project_geodesic_azimuths: Literal["GEODESIC_AZIMUTHS", "PROJECT_GEODESIC_AZIMUTHS"] | None = None,
    use_equatorial_aspect: Literal["NORTH_POLE_ASPECT", "EQUATORIAL_ASPECT"] | None = None,
    in_analysis_mask=None,
) -> Result1[str]:
    """SurfaceParameters(in_raster, out_raster, {parameter_type}, {local_surface_type}, {neighborhood_distance}, {use_adaptive_neighborhood}, {z_unit}, {output_slope_measurement}, {project_geodesic_azimuths}, {use_equatorial_aspect}, {in_analysis_mask})

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
         The output raster.It will be floating-point type."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SurfaceParameters_3d(
                *gp_fixargs(
                    (
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
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Statistics toolset
@gptooldoc("AddSurfaceInformation_3d", None)
def AddSurfaceInformation(
    in_feature_class=None,
    in_surface=None,
    out_property: list[
        Literal[
            "Z", "Z_MIN", "Z_MAX", "Z_MEAN", "SURFACE_LENGTH", "SURFACE_AREA", "MIN_SLOPE", "MAX_SLOPE", "AVG_SLOPE"
        ]
    ]
    | Literal["Z", "Z_MIN", "Z_MAX", "Z_MEAN", "SURFACE_LENGTH", "SURFACE_AREA", "MIN_SLOPE", "MAX_SLOPE", "AVG_SLOPE"]
    | str
    | None = None,
    method: Literal[
        "LINEAR",
        "NATURAL_NEIGHBORS",
        "CONFLATE_ZMIN",
        "CONFLATE_ZMAX",
        "CONFLATE_NEAREST",
        "CONFLATE_CLOSEST_TO_MEAN",
        "BILINEAR",
    ]
    | None = None,
    sample_distance=None,
    z_factor=None,
    pyramid_level_resolution=None,
    noise_filtering=None,
) -> Result1[str | Layer]:
    """AddSurfaceInformation(in_feature_class, in_surface, out_property;out_property..., {method}, {sample_distance}, {z_factor}, {pyramid_level_resolution}, {noise_filtering})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddSurfaceInformation_3d(
                *gp_fixargs(
                    (
                        in_feature_class,
                        in_surface,
                        out_property,
                        method,
                        sample_distance,
                        z_factor,
                        pyramid_level_resolution,
                        noise_filtering,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddZInformation_3d", None)
def AddZInformation(
    in_feature_class=None,
    out_property: list[
        Literal[
            "Z",
            "Z_MIN",
            "Z_MAX",
            "Z_MEAN",
            "POINT_COUNT",
            "LENGTH_3D",
            "SURFACE_AREA",
            "VOLUME",
            "MIN_SLOPE",
            "MAX_SLOPE",
            "AVG_SLOPE",
            "VERTEX_COUNT",
        ]
    ]
    | Literal[
        "Z",
        "Z_MIN",
        "Z_MAX",
        "Z_MEAN",
        "POINT_COUNT",
        "LENGTH_3D",
        "SURFACE_AREA",
        "VOLUME",
        "MIN_SLOPE",
        "MAX_SLOPE",
        "AVG_SLOPE",
        "VERTEX_COUNT",
    ]
    | str
    | None = None,
    noise_filtering=None,
) -> Result1[str | Layer]:
    """AddZInformation(in_feature_class, out_property;out_property..., {noise_filtering})

       Adds information about elevation properties of features in a z-enabled
       feature class.

    INPUTS:
     in_feature_class (Feature Layer):
         The input features that will be processed.
     out_property (String):
         Specifies the z-properties that will be added to the attribute table
         of the input feature class.Z-Spot elevation of single-point
         feature.POINT_COUNT-Number of points
         in each multipoint feature.Z_MIN-Lowest z-value found in each
         multipoint, polyline, polygon, or
         multipatch feature.Z_MAX-Highest z-value found in each multipoint,
         polyline, polygon, or
         multipatch feature.Z_MEAN-Average z-value found in each multipoint,
         polyline, polygon, or
         multipatch feature.LENGTH_3D-3-dimensional length of each polyline or
         polygon feature.SURFACE_AREA-Total area of the surface of a multipatch
         feature.VERTEX_COUNT-Total number of vertices in each polyline or
         polygon
         feature.MIN_SLOPE-Lowest slope value calculated for each polyline,
         polygon, or
         multipatch feature.MAX_SLOPE-Highest slope value calculated for each
         polyline, polygon,
         or multipatch feature.AVG_SLOPE-Average slope value calculated for
         each polyline, polygon,
         or multipatch feature.VOLUME-Volume of space enclosed by each
         multipatch feature.
     noise_filtering {String}:
         An numeric value that will be used to exclude portions of features
         from the resulting calculations. This can be useful when the 3D input
         contains relatively small features with extreme slopes which may bias
         statistical results. If the 3D input's linear units are meters,
         specifying a value of 0.001 will result in the exclusion of lines or
         polygon edges that are shorter than 0.001 meters. For multipatch
         features, the same value will result in the exclusion of its subparts
         that have an area less than 0.001 square meters. This parameter does
         not apply to point and multipoint features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddZInformation_3d(*gp_fixargs((in_feature_class, out_property, noise_filtering), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("LasHeightMetrics_3d", None)
def LasHeightMetrics(
    in_las_dataset=None,
    out_location=None,
    base_name=None,
    statistics: list[Literal["MEAN", "STANDARD_DEVIATION", "SKEWNESS", "KURTOSIS", "MEDIAN_ABSOLUTE_DEVIATION"]]
    | Literal["MEAN", "STANDARD_DEVIATION", "SKEWNESS", "KURTOSIS", "MEDIAN_ABSOLUTE_DEVIATION"]
    | str
    | None = None,
    height_percentiles=None,
    min_height=None,
    min_points=None,
    cell_size=None,
    raster_format: Literal["TIFF", "IMG", "ESRI_GRID"] | None = None,
) -> Result2[str, str]:
    """LasHeightMetrics(in_las_dataset, out_location, {base_name}, {statistics;statistics...}, {height_percentiles;height_percentiles...}, {min_height}, {min_points}, {cell_size}, {raster_format})

       Calculates statistics about the distribution of elevation measurements
       of vegetation points captured in LAS data.

    INPUTS:
     in_las_dataset (LAS Dataset Layer):
         The LAS dataset that will be processed.
     out_location (Workspace):
         The folder or geodatabase where the output raster datasets will
         reside. When the output location is a folder, the resulting raster
         datasets will be in the TIFF format.
     base_name {String}:
         The base name for the output raster datasets.
     statistics {String}:
         Specifies the statistics calculated for the unclassified and
         vegetation points above the ground that are within the area of each
         cell in the output raster.MEAN-The average height of the LAS
         points.KURTOSIS-The sharpness of
         the change in the height of the LAS points.SKEWNESS-The direction of
         deviation from the nominal height of the LAS
         points, which indicates the level and direction of
         asymmetry.STANDARD_DEVIATION-The variation of the height of the
         points.MEDIAN_ABSOLUTE_DEVIATION-The median value of the deviation
         from the
         median height.
     height_percentiles {Long}:
         The height at which the specified percentage of points in the cell
         fall below. For example, a value of 95 means the resulting cell values
         indicate the height at which 95 percent of points above the ground
         occur.
     min_height {Linear Unit}:
         The minimum height above ground for points that will be evaluated.
     min_points {Long}:
         The minimum number of points that must be present in a given cell to
         calculate height metrics. Cells with fewer points than the specified
         minimum will have no data in the output.
     cell_size {Linear Unit}:
         The cell size of the output raster datasets.
     raster_format {String}:
         Specifies the raster format that will be created when the output
         location is a folder.TIFF-Output will be created in the GeoTIFF
         format. This is the
         default.IMG-Output will be created in the ERDAS IMAGINE
         format.ESRI_GRID-Output will be created in the Esri Grid format."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LasHeightMetrics_3d(
                *gp_fixargs(
                    (
                        in_las_dataset,
                        out_location,
                        base_name,
                        statistics,
                        height_percentiles,
                        min_height,
                        min_points,
                        cell_size,
                        raster_format,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("LasPointStatsByArea_3d", None)
def LasPointStatsByArea(
    in_las_dataset=None,
    in_features=None,
    out_property: list[Literal["Z_MIN", "Z_MAX", "Z_MEAN", "POINT_COUNT", "STANDARD_DEVIATION"]]
    | Literal["Z_MIN", "Z_MAX", "Z_MEAN", "POINT_COUNT", "STANDARD_DEVIATION"]
    | str
    | None = None,
) -> Result1[str]:
    """LasPointStatsByArea(in_las_dataset, in_features, {out_property;out_property...})

       Evaluates the statistics of LAS points that overlay the area defined
       by polygon features.

    INPUTS:
     in_las_dataset (LAS Dataset Layer):
         The LAS dataset that will be processed.
     in_features (Feature Layer):
         The polygon that defines the area for which statistics will be
         reported.
     out_property {String}:
         The properties that will be calculated.Z_MIN-The lowest Z value of LAS
         points overlapping the
         feature.Z_MAX-The highest Z value of LAS points overlapping the
         feature.Z_MEAN-The average Z value of LAS points overlapping the
         feature.POINT_COUNT-The tally of LAS points that were
         evaluated.STANDARD_DEVIATION-The standard deviation of Z values."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LasPointStatsByArea_3d(*gp_fixargs((in_las_dataset, in_features, out_property), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PointFileInformation_3d", None)
def PointFileInformation(
    input=None,
    out_feature_class=None,
    in_file_type: Literal["LAS", "XYZ", "XYZI", "GENERATE"] | None = None,
    file_suffix=None,
    input_coordinate_system=None,
    folder_recursion: Literal["RECURSION", "NO_RECURSION"] | None = None,
    extrude_geometry: Literal["EXTRUSION", "NO_EXTRUSION"] | None = None,
    decimal_separator: Literal["DECIMAL_POINT", "DECIMAL_COMMA"] | None = None,
    summarize_by_class_code: Literal["SUMMARIZE", "NO_SUMMARIZE"] | None = None,
    improve_las_point_spacing: Literal["LAS_SPACING", "NO_LAS_SPACING"] | None = None,
) -> Result2[str, str]:
    """PointFileInformation(input;input..., out_feature_class, in_file_type, {file_suffix}, {input_coordinate_system}, {folder_recursion}, {extrude_geometry}, {decimal_separator}, {summarize_by_class_code}, {improve_las_point_spacing})

       Creates polygon or multipatch output that captures the spatial extent
       and statistical information about one or more ASCII or LAS format
       point files.

    INPUTS:
     input (File / LAS Dataset Layer / Folder):
         The point data that will be processed. Supported inputs include LAS
         datasets, .las, .zlas, and .laz files, and ASCII files containing
         point records. One or more folders containing the files can also be
         specified as input. When a folder is included, the file suffix must be
         specified in the file_suffix parameter.
     in_file_type (String):
         Specifies the format of the input files.LAS-The format of the input
         files is LAS format lidar, which includes
         .las, .zlas, and .laz files.XYZ-The format of the input files is ASCII
         files with XYZ.XYZI-The format of the input files is ASCII files with
         XYZI.GENERATE-The format of the input files is ASCII files in Generate
         format.
     file_suffix {String}:
         The suffix of the files that will be imported when a folder is
         specified in the input.
     input_coordinate_system {Coordinate System}:
         The coordinate system of the input data.
     folder_recursion {Boolean}:
         Specifies whether data in subfolders will be used to generate results.
         The tool scans subfolders when an input folder is selected containing
         data in a subfolders directory. The output feature class will be
         generated with a row for each file in the directory
         structure.NO_RECURSION-Only the data in the input folder will be used
         to
         generate results. This is the default.RECURSION-Any data in the input
         folder and its subdirectories will be
         used to generate results.
     extrude_geometry {Boolean}:
         Specifies whether the output will be created as a 2D polygon or
         multipatch feature class with extruded features that reflect the
         elevation range in each file.NO_EXTRUSION-The output will be created
         as a 2D polygon feature class.
         This is the default.EXTRUSION-The output will be created as a
         multipatch feature class.
     decimal_separator {String}:
         The decimal character that will be used in the text file to
         differentiate the integer of a number from its fractional
         part.DECIMAL_POINT-A point will be used as the decimal character. This
         is
         the default.DECIMAL_COMMA-A comma will be used as the decimal
         character.
     summarize_by_class_code {Boolean}:
         Specifies whether the results will summarize .las or .zlas files by
         class code or by file. This option is not available for .laz
         files.NO_SUMMARIZE-Each output feature will represent all the class
         codes in
         the .las or .las file. This is the default.SUMMARIZE-Each output
         feature will represent a single class code in
         the input .las or .zlas file. This option will require a complete scan
         of the input files.
     improve_las_point_spacing {Boolean}:
         Specifies whether enhanced assessment of the point spacing in .las
         files, which can reduce over-estimation caused by irregular data
         distribution, will be used.LAS_SPACING-A regular point spacing
         estimate will be used for .las
         files in which the extent is equally divided by the number of points.
         This is the default.NO_LAS_SPACING-Binning will be used to obtain a
         more precise point
         spacing estimate for .las files. This option may increase tool run
         time.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PointFileInformation_3d(
                *gp_fixargs(
                    (
                        input,
                        out_feature_class,
                        in_file_type,
                        file_suffix,
                        input_coordinate_system,
                        folder_recursion,
                        extrude_geometry,
                        decimal_separator,
                        summarize_by_class_code,
                        improve_las_point_spacing,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# TIN Dataset toolset
@gptooldoc("CopyTin_3d", None)
def CopyTin(
    in_tin=None,
    out_tin=None,
    version: Literal["PRE_10.0", "CURRENT"] | None = None,
) -> Result1[str]:
    """CopyTin(in_tin, out_tin, {version})

       Creates a copy of a triangulated irregular network (TIN) dataset.

    INPUTS:
     in_tin (TIN Layer):
         The TIN that will be copied.
     version {String}:
         The version of the output TIN.CURRENT-The current TIN version, which
         supports constrained Delaunay
         triangulation, enhanced spatial reference information, and storage of
         node source and edge tag values. The resulting TIN will not be
         backward compatible with versions of ArcGIS prior to 10.0. This is the
         default.PRE_10.0-The TIN will be backward compatible with versions of
         ArcGIS
         prior to 10.0, which only supports conforming Delaunay triangulation.

    OUTPUTS:
     out_tin (TIN):
         The TIN dataset that will be generated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.CopyTin_3d(*gp_fixargs((in_tin, out_tin, version), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateTin_3d", None)
def CreateTin(
    out_tin=None,
    spatial_reference=None,
    in_features=None,
    constrained_delaunay: Literal["CONSTRAINED_DELAUNAY", "DELAUNAY"] | None = None,
) -> Result1[str]:
    """CreateTin(out_tin, {spatial_reference}, {in_features;in_features...}, {constrained_delaunay})

       Creates a triangulated irregular network (TIN) dataset.

    INPUTS:
     spatial_reference {Coordinate System}:
         The spatial reference of the output TIN. Set the spatial reference to
         a projected coordinate system. Geographic coordinate systems are not
         recommended because Delaunay triangulation cannot be guaranteed when
         the x,y coordinates are expressed in angular units, which could have
         an adverse impact on the accuracy of distance-based calculations, such
         as slope, volume, and line of sight.
     in_features {Value Table}:
         The input features and their related properties that define how they
         will be added to the TIN.in_features-The features that will be added
         to the
         TIN.height_field-The source of elevation for the input features. Any
         numeric field from the input feature's attribute table can be
         specified, along with Shape.Z for the z-values of 3D features and
         Shape.M for the m-values stored with the geometry. Choosing the <None>
         keyword will result in the feature's elevation being interpolated from
         the surrounding surface. sf_type-The input feature's role in
         defining the TIN surface.
         The available options depend on the geometry of the input features.
         For line- and polygon-based surface feature types, the hard and soft
         designations for the surface feature type impact the way the line or
         polygon boundary is handled when interpolating a raster surface from
         the TIN dataset when using natural neighbor interpolation. A hard
         surface feature type represents a border with a sharp discontinuity in
         elevation, such as the edge of a cliff, a wall, or a curb on the side
         of the road. A soft surface feature type represents a border where the
         elevation is more smoothly defined. Point and multipoint
         features can be defined as Mass_Points, which
         contribute elevation values that are stored as TIN data nodes.
         Line features can be incorporated into the TIN as the
         following:           Mass_Points in which the line vertices are
         converted to nodes in the
         TIN.Hard_Line or Soft_Line breakline features that define linear
         discontinuities in the TIN. Polygon features can be
         incorporated into the TIN as mass
         points, break lines, and the following surface feature types:
         Hard_Clip or Soft_Clip features that define the data area of the TIN
         surface.Hard_Erase or Soft_Erase features that represent interior
         voids in the
         data.Hard_Replace or Soft_Replace features that define areas of
         constant
         height.Hardvalue_Fill or Softvalue_Fill features that assign integer
         attributes to nodes and triangle faces.tag_field-A numeric attribute
         will be derived from an integer field in
         the input feature's attribute table whose values can be used to assign
         a basic form of attribution to the TIN's data elements. Specifying
         <None> will result in no tag values being assigned.
     constrained_delaunay {Boolean}:
         Specifies the triangulation technique that will be used along the
         breaklines of the TIN.DELAUNAY-The TIN will use Delaunay conforming
         triangulation, which may
         densify each segment of the breaklines to produce multiple triangle
         edges. This is the default.CONSTRAINED_DELAUNAY-The TIN will use
         constrained Delaunay
         triangulation, which will add each segment as a single edge. Delaunay
         triangulation rules are honored everywhere except along breaklines,
         which will not be densified.

    OUTPUTS:
     out_tin (TIN):
         The TIN dataset that will be generated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateTin_3d(*gp_fixargs((out_tin, spatial_reference, in_features, constrained_delaunay), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DecimateTinNodes_3d", None)
def DecimateTinNodes(
    in_tin=None,
    out_tin=None,
    method: Literal["Z_TOLERANCE", "COUNT"] | None = None,
    copy_breaklines: Literal["BREAKLINES", "NO_BREAKLINES"] | None = None,
    z_tolerance_value=None,
    max_node_value=None,
) -> Result1[str]:
    """DecimateTinNodes(in_tin, out_tin, method, {copy_breaklines}, {z_tolerance_value}, {max_node_value})

       Creates a triangulated irregular network (TIN) dataset using a subset
       of nodes from a source TIN.

    INPUTS:
     in_tin (TIN Layer):
         The TIN dataset that will be processed.
     method (String):
         Specifies the thinning method used for selecting a subset of nodes
         from the input TIN.Z_TOLERANCE-Creates a TIN that will maintain the
         vertical accuracy
         specified in the z_tolerance_value parameter. This is the
         default.COUNT-Creates a TIN that will not exceed the node limit
         specified in
         the max_node_value parameter.
     copy_breaklines {Boolean}:
         Indicates whether breaklines from the input TIN are copied over to the
         output.BREAKLINES-Breaklines will be copied.NO_BREAKLINES-Breaklines
         will not
         be copied. This is the default.
     z_tolerance_value {Double}:
         The maximum deviation from the source TIN's Z-value that will be
         allowed in the output TIN, which defaults to the lesser of either one-
         tenth of the Z-range or the number 10.
     max_node_value {Long}:
         The maximum number of nodes that can be stored in the output TIN,
         which defaults to the total number of nodes in the source TIN minus 1.
         If the Z-tolerance method is used, the tool will stop processing if
         the Z tolerance value causes the resulting TIN to exceed the maximum
         number of nodes.

    OUTPUTS:
     out_tin (TIN):
         The TIN dataset that will be generated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DecimateTinNodes_3d(
                *gp_fixargs((in_tin, out_tin, method, copy_breaklines, z_tolerance_value, max_node_value), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DelineateTinDataArea_3d", None)
def DelineateTinDataArea(
    in_tin=None,
    max_edge_length=None,
    method: Literal["PERIMETER_ONLY", "ALL"] | None = None,
) -> Result1[str | Layer]:
    """DelineateTinDataArea(in_tin, max_edge_length, {method})

       Redefines the data area, or interpolation zone, of a triangulated
       irregular network (TIN) based on its triangle edge length.

    INPUTS:
     in_tin (TIN Layer):
         The TIN dataset that will be processed.
     max_edge_length (Double):
         The two-dimensional distance that defines the maximum length of a TIN
         triangle edge in the TIN's data area. Triangles with one or more edges
         that exceed this value will be considered outside the TIN's
         interpolation zone and will not be rendered in maps or used in surface
         analysis.
     method {String}:
         The TIN edges that will be evaluated when delineating the TIN's data
         area. PERIMETER_ONLY-Iterates through triangles from the TIN's
         outer extent inward and will stop when the current iteration of
         boundary triangle edges does not exceed the. This is the default.
         Maximum Edge LengthALL-Classifies the entire collection of TIN
         triangles by edge length."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DelineateTinDataArea_3d(*gp_fixargs((in_tin, max_edge_length, method), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("EditTin_3d", None)
def EditTin(
    in_tin=None,
    in_features=None,
    constrained_delaunay: Literal["CONSTRAINED_DELAUNAY", "DELAUNAY"] | None = None,
) -> Result1[str | Layer]:
    """EditTin(in_tin, in_features;in_features..., {constrained_delaunay})

       Loads data from one or more input features to modify the surface of an
       existing triangulated irregular network (TIN).

    INPUTS:
     in_tin (TIN Layer):
         The TIN dataset that will be processed.
     in_features (Value Table):
         The input features and their related properties that define how they
         will be added to the TIN.in_features-The features that will be added
         to the TIN.
         height_field-The field in the feature attributes that will
         provide the elevation of input features. The z- or m-values in
         thefield can be used along with any numeric field. Choosing the <None>
         keyword will result in the feature's elevation being interpolated from
         the surrounding surface. Shapetag_field-A numeric attribute
         will be derived from an integer field in
         the input feature's attribute table whose values can be used to assign
         a basic form of attribution to the TIN's data elements. Specifying
         <None> will result in no tag values being assigned.
         sf_type-The input feature's role in defining the TIN surface.
         The available options depend on the geometry of the input features.
         For line- and polygon-based surface feature types, the hard and soft
         designations for the surface feature type impact the way the line or
         polygon boundary is handled when interpolating a raster surface from
         the TIN dataset when using natural neighbor interpolation. A hard
         surface feature type represents a border with a sharp discontinuity in
         elevation, such as the edge of a cliff, a wall, or a curb on the side
         of the road. A soft surface feature type represents a border where the
         elevation is more smoothly defined. Point and multipoint
         features can be defined as Mass_Points, which
         contribute elevation values that are stored as TIN data nodes.
         Line features can be incorporated into the TIN as the
         following:           Mass_Points in which the line vertices are
         converted to nodes in the
         TIN.Hard_Line or Soft_Line breakline features that define linear
         discontinuities in the TIN. Polygon features can be
         incorporated into the TIN as mass
         points, break lines, and the following surface feature types:
         Hard_Clip or Soft_Clip features that define the data area of the TIN
         surface.Hard_Erase or Soft_Erase features that represent interior
         voids in the
         data.Hard_Replace or Soft_Replace features that define areas of
         constant
         height.Hardvalue_Fill or Softvalue_Fill features that assign integer
         attributes to nodes and triangle faces. use_z-Specifies
         whether z- or m-values will be used when
         thefield is specified as the height source. Specifying True indicates
         that z-values will be used; specifying False indicates that m-values
         will be used. SHAPE
     constrained_delaunay {Boolean}:
         Specifies the triangulation technique that will be used along the
         breaklines of the TIN.DELAUNAY-The TIN will use Delaunay conforming
         triangulation, which may
         densify each segment of the breaklines to produce multiple triangle
         edges. This is the default.CONSTRAINED_DELAUNAY-The TIN will use
         constrained Delaunay
         triangulation, which will add each segment as a single edge. Delaunay
         triangulation rules are honored everywhere except along breaklines,
         which will not be densified."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.EditTin_3d(*gp_fixargs((in_tin, in_features, constrained_delaunay), True))
        )
        return retval
    except Exception as e:
        raise e


# TIN Dataset\Conversion toolset
@gptooldoc("LandXMLToTin_3d", None)
def LandXMLToTin(
    in_landxml_path=None,
    out_tin_folder=None,
    tin_basename=None,
    tinnames=None,
) -> Result1[str]:
    """LandXMLToTin(in_landxml_path, out_tin_folder, tin_basename, {tinnames;tinnames...})

       This tool imports one or more triangulated irregular network (TIN)
       surfaces from a LandXML file to output Esri TINs.

    INPUTS:
     in_landxml_path (File):
         The input LandXML file.
     out_tin_folder (Folder):
         The folder that the output TINs will be created in.
     tin_basename (String):
         The basename of the resulting TIN. When several TINs will be exported
         from the LandXML file, the basename is used to define a unique name
         for each output TIN. If <basename> already exists, the tool will not
         write anything. If <basename> does not exist but <basename>2 exists,
         the tool will create <basename> and <basename>2_1, instead of
         <basename>2.
     tinnames {String}:
         The one or more LandXML TIN surfaces that will be exported to an Esri
         TIN. Each LandXML TIN can be specified by its name or its index
         position in the LandXML file, where the number 1 represents the first
         TIN, 2 identifies the second, and so on."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LandXMLToTin_3d(*gp_fixargs((in_landxml_path, out_tin_folder, tin_basename, tinnames), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TinDomain_3d", None)
def TinDomain(
    in_tin=None,
    out_feature_class=None,
    out_geometry_type: Literal["LINE", "POLYGON"] | None = None,
) -> Result1[str]:
    """TinDomain(in_tin, out_feature_class, out_geometry_type)

       Creates a line or polygon feature class representing the interpolation
       zone of a triangulated irregular network (TIN) dataset.

    INPUTS:
     in_tin (TIN Layer):
         The TIN dataset that will be processed.
     out_geometry_type (String):
         The geometry of the output feature class.LINE-The output will be a
         z-enabled line feature class.POLYGON-The
         output will be a z-enabled polygon feature class.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TinDomain_3d(*gp_fixargs((in_tin, out_feature_class, out_geometry_type), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TinEdge_3d", None)
def TinEdge(
    in_tin=None,
    out_feature_class=None,
    edge_type: Literal["DATA", "SOFT", "HARD", "ENFORCED", "REGULAR", "OUTSIDE", "ALL"] | None = None,
) -> Result1[str]:
    """TinEdge(in_tin, out_feature_class, {edge_type})

       Creates 3D line features using the triangle edges of a triangulated
       irregular network (TIN) dataset.

    INPUTS:
     in_tin (TIN Layer):
         The TIN dataset that will be processed.
     edge_type {String}:
         The triangle edge that will be exported.DATA-Edges representing the
         interpolation zone. This is the
         default.SOFT-Edges representing gradual breaks in slope.HARD-Edges
         representing distinct breaks in slope.ENFORCED-Edges that were not
         introduced by the TIN's triangulation.REGULAR-Edges that were created
         by the TIN's triangulation.OUTSIDE-Edges that are excluded from the
         interpolation zone.ALL-All edges, included those that were excluded
         from the
         interpolation zone.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TinEdge_3d(*gp_fixargs((in_tin, out_feature_class, edge_type), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TinLine_3d", None)
def TinLine(
    in_tin=None,
    out_feature_class=None,
    code_field=None,
) -> Result1[str]:
    """TinLine(in_tin, out_feature_class, {code_field})

       Exports breaklines from a triangulated irregular network (TIN) dataset
       to a 3D line feature class.

    INPUTS:
     in_tin (TIN Layer):
         The TIN dataset that will be processed.
     code_field {String}:
         The name of the field in the output feature class that defines the
         breakline type. The default field name is Code.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TinLine_3d(*gp_fixargs((in_tin, out_feature_class, code_field), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TinNode_3d", None)
def TinNode(
    in_tin=None,
    out_feature_class=None,
    spot_field=None,
    tag_field=None,
) -> Result1[str]:
    """TinNode(in_tin, out_feature_class, {spot_field}, {tag_field})

       Exports the nodes of a triangulated irregular network (TIN) dataset to
       a point feature class.

    INPUTS:
     in_tin (TIN Layer):
         The TIN dataset that will be processed.
     spot_field {String}:
         The name of the elevation attribute field of the output feature class.
         If a name is given, the feature class will be 2D; otherwise, it will
         be 3D. No name is provided by default, which results in the creation
         of 3D point features.
     tag_field {String}:
         The name of the field storing the tag attribute in the output feature
         class. By default, no tag value field is created.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TinNode_3d(*gp_fixargs((in_tin, out_feature_class, spot_field, tag_field), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TinPolygonTag_3d", None)
def TinPolygonTag(
    in_tin=None,
    out_feature_class=None,
    tag_field=None,
) -> Result1[str]:
    """TinPolygonTag(in_tin, out_feature_class, {tag_field})

       Creates polygon features using tag values in a triangulated irregular
       network (TIN) dataset.

    INPUTS:
     in_tin (TIN Layer):
         The TIN dataset that will be processed.
     tag_field {String}:
         The name of the field storing the tag attribute in the output feature
         class. The default field name is Tag_Value.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TinPolygonTag_3d(*gp_fixargs((in_tin, out_feature_class, tag_field), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TinRaster_3d", None)
def TinRaster(
    in_tin=None,
    out_raster=None,
    data_type: Literal["FLOAT", "INT"] | None = None,
    method: Literal["LINEAR", "NATURAL_NEIGHBORS"] | None = None,
    sample_distance: Literal["OBSERVATIONS", "CELLSIZE"] | None = None,
    z_factor=None,
    sample_value=None,
) -> Result1[str]:
    """TinRaster(in_tin, out_raster, {data_type}, {method}, {sample_distance}, {z_factor}, {sample_value})

       Interpolates a raster using z-values from the input TIN.

    INPUTS:
     in_tin (TIN Layer):
         The TIN dataset that will be processed.
     data_type {String}:
         Specifies the type of numeric values that will be stored in the output
         raster.FLOAT-The output raster will use 32-bit floating point, which
         supports
         values ranging from -3.402823466e+38 to 3.402823466e+38. This is the
         default.INT-The output raster will use an appropriate integer bit
         depth. This
         option will round z-values to the nearest whole number and write an
         integer to each raster cell value.
     method {String}:
         The interpolation method used to create the raster.LINEAR-Calculates
         cell values by applying linear interpolation to the
         TIN triangles. This is the default.NATURAL_NEIGHBORS-Calculates cell
         values by using natural neighbors
         interpolation of TIN triangles
     sample_distance {String}:
         The sampling method and distance used to define the cell size of the
         output raster.OBSERVATIONS-Defines the number of cells that divide the
         longest side
         of the output raster. This method is used by default with the value of
         250.CELLSIZE-Defines the cell size of the output raster.
     z_factor {Double}:
         The factor by which z-values will be multiplied. This is typically
         used to convert z linear units to match x,y linear units. The default
         is 1, which leaves elevation values unchanged. This parameter is not
         available if the spatial reference of the input surface has a z-datum
         with a specified linear unit.
     sample_value {Double}:
         The value that corresponds with thefor specifying the output
         raster's cell size. Sampling Distance

    OUTPUTS:
     out_raster (Raster Dataset):
         The location and name of the output raster. When storing a raster
         dataset in a geodatabase or in a folder such as an Esri Grid, do not
         add a file extension to the name of the raster dataset. A file
         extension can be provided to define the raster's format when storing
         it in a folder, such as .tif to generate a GeoTIFF or .img to generate
         an ERDAS IMAGINE format file.If the raster is stored as a .tif file or
         in a geodatabase, the raster
         compression type and quality can be specified using geoprocessing
         environment settings."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TinRaster_3d(
                *gp_fixargs((in_tin, out_raster, data_type, method, sample_distance, z_factor, sample_value), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TinTriangle_3d", None)
def TinTriangle(
    in_tin=None,
    out_feature_class=None,
    units: Literal["PERCENT", "DEGREE"] | None = None,
    z_factor=None,
    hillshade: Literal["HILLSHADE"] | None = None,
    tag_field=None,
) -> Result1[str]:
    """TinTriangle(in_tin, out_feature_class, {units}, {z_factor}, {hillshade}, {tag_field})

       Exports triangle faces from a TIN dataset to polygon features and
       provides slope, aspect, and optional attributes of hillshade and tag
       values for each triangle.

    INPUTS:
     in_tin (TIN Layer):
         The TIN dataset that will be processed.
     units {String}:
         The units of measure to be used in calculating slope.PERCENT-Slope is
         expressed as a percentage value. This is the
         default.DEGREE-Slope is expressed as the angle of inclination from a
         horizontal plane.
     z_factor {Double}:
         The factor by which z-values will be multiplied. This is typically
         used to convert z linear units to match x,y linear units. The default
         is 1, which leaves elevation values unchanged. This parameter is not
         available if the spatial reference of the input surface has a z-datum
         with a specified linear unit.
     hillshade {String}:
         Specifies the azimuth and altitude angles of the light source when
         applying a hillshade effect for the feature layer output. Azimuth can
         range from 0 to 360 degrees, whereas altitude can range from 0 to 90.
         An azimuth of 45 degrees and altitude of 30 degrees would be entered
         as "HILLSHADE 45, 30".
     tag_field {String}:
         The field name in the output feature that will store the triangle tag
         value. This parameter is empty by default, which will result in tag
         values not being written to the output.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TinTriangle_3d(*gp_fixargs((in_tin, out_feature_class, units, z_factor, hillshade, tag_field), True))
        )
        return retval
    except Exception as e:
        raise e


# Terrain Dataset toolset
@gptooldoc("AddFeatureClassToTerrain_3d", None)
def AddFeatureClassToTerrain(
    in_terrain=None,
    in_features=None,
) -> Result1[str | Layer]:
    """AddFeatureClassToTerrain(in_terrain, in_features;in_features...)

       Adds one or more feature classes to a terrain dataset.

    INPUTS:
     in_terrain (Terrain Layer):
         The terrain to which feature classes will be added. The terrain
         dataset must already have one or more pyramid levels created.
     in_features (Value Table):
         Identifies features being added to the terrain. Each feature must
         reside in the same feature dataset as the terrain and have its role
         defined through the following properties:Input Features-Name of the
         feature class being added to the
         terrain.Height Field-Field containing the feature's height
         information. Any
         numeric field can be specified, and z-enabled features can also choose
         the geometry field. If the <none> option is chosen, z-values are
         interpolated from the surface.Type-Surface feature type that defines
         how the features contributes to
         the terrain. Mass points denote features that contribute
         z-measurements; breaklines denote linear features with known
         z-measurements, and several polygon types. Breaklines and polygon-
         based feature types also have hard and soft qualifiers that define the
         interpolation behavior around the feature's edges when exporting to
         raster. Soft features exhibit gradual changes in slope, whereas hard
         features represent sharp discontinuities.Group-Defines the group of
         each contributing feature. Unspecification
         of breaklines and polygon surface features representing the same
         geographic features at different levels of detail are intended for
         display at certain scale ranges. Data representing the same geographic
         features at different levels of detail can be grouped by assigning the
         same numeric value. For example, assigning two boundary features with
         a high and low level of detail to the same group would ensure there is
         no overlap in their associated display scale range.Min/Max
         Resolution-Defines the range of pyramid resolutions at which
         the feature is enforced in the terrain. Mass points must use the
         smallest and largest range of values.Overview-Indicates whether the
         feature is enforced at the coarsest
         representation of the terrain dataset. To maximize display
         performance, make sure that feature classes represented in the
         overview contain simplified geometry. Only valid for feature types
         other than mass points. Embed-Setting this option toindicates
         the source features
         will be copied to a hidden feature class that will be referenced by
         and only available to the terrain. Embedded features will not be
         directly viewable, as they can only be accessed through terrain tools.
         Only valid for multipoint features. TRUEEmbed Name-Name of the
         embedded feature class. Only applies if the
         feature is being embedded.Embed Fields-Specifies BLOB field attributes
         to be retained in the
         embedded feature class. These attributes can be used to symbolize the
         terrain. LAS attribution can be stored in BLOB fields of multipoint
         features through the LAS To Multipoint tool.Anchor-Specifies whether
         the point feature class will be anchored
         through all terrain pyramid levels. Anchor points are never filtered
         or thinned away to ensure they persist in the terrain surface. This
         option only applies to single-point feature classes."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddFeatureClassToTerrain_3d(*gp_fixargs((in_terrain, in_features), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddTerrainPyramidLevel_3d", None)
def AddTerrainPyramidLevel(
    in_terrain=None,
    pyramid_type=None,
    pyramid_level_definition=None,
) -> Result1[str | Layer]:
    """AddTerrainPyramidLevel(in_terrain, {pyramid_type}, pyramid_level_definition;pyramid_level_definition...)

       Adds one or more pyramid levels to an existing terrain dataset.

    INPUTS:
     in_terrain (Terrain Layer):
         The terrain dataset that will be processed.
     pyramid_type {String}:
         The pyramid type used by the terrain dataset. This parameter is not
         used in ArcGIS 9.3 and beyond, as its purpose is to ensure backward-
         compatibility with scripts and models written using ArcGIS 9.2.
     pyramid_level_definition (String):
         The z-tolerance or window size and its associated reference scale for
         each pyramid level being added to the terrain. Each pyramid level is
         entered as a space-delimited pair of the pyramid level resolution and
         reference scale (for example, "20 24000" for a window size of 20 and
         reference scale of 1:24000, or "1.5 10000" for a z-tolerance of 1.5
         and reference scale of 1:10000). The pyramid level resolution can be
         provided as a floating-point value, while the reference scale must be
         entered as a whole number.The z-tolerance value represents the maximum
         deviation that can occur
         from the elevation of the terrain at full resolution, whereas the
         window size value defines the area of the terrain tile used in
         thinning elevation points by selecting one or two points from the area
         based on the window size method defined during the creation of the
         terrain. The reference scale represents the largest map scale at which
         the pyramid level is enforced. When the terrain is displayed at a
         scale larger than this value, the next highest pyramid level is
         displayed."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddTerrainPyramidLevel_3d(*gp_fixargs((in_terrain, pyramid_type, pyramid_level_definition), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AppendTerrainPoints_3d", None)
def AppendTerrainPoints(
    in_terrain=None,
    terrain_feature_class=None,
    in_point_features=None,
    polygon_features_or_extent=None,
) -> Result1[str | Layer]:
    """AppendTerrainPoints(in_terrain, terrain_feature_class, in_point_features, {polygon_features_or_extent})

       Appends points to a point feature referenced by a terrain dataset.

    INPUTS:
     in_terrain (Terrain Layer):
         The terrain dataset that will be processed.
     terrain_feature_class (String):
         The feature class that contributes to the terrain dataset into which
         the points or multipoints will be added.This parameter only requires
         the name of the feature class and not its
         full path.
     in_point_features (Feature Layer):
         The feature class of points or multipoints to add as an additional
         data source for the terrain dataset.
     polygon_features_or_extent {Feature Layer / Extent}:
         Specify a polygon feature class or arcpy.Extent object to define the
         area where point features will be added. This parameter is empty by
         default, which results in all the points from the input feature class
         being loaded to the terrain feature."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AppendTerrainPoints_3d(
                *gp_fixargs((in_terrain, terrain_feature_class, in_point_features, polygon_features_or_extent), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("BuildTerrain_3d", None)
def BuildTerrain(
    in_terrain=None,
    update_extent: Literal["NO_UPDATE_EXTENT", "UPDATE_EXTENT"] | None = None,
) -> Result1[str | Layer]:
    """BuildTerrain(in_terrain, {update_extent})

       Performs tasks required for analyzing and displaying a terrain
       dataset.

    INPUTS:
     in_terrain (Terrain Layer):
         The terrain dataset that will be processed.
     update_extent {String}:
         Recalculates the data extent of a window-size-based terrain dataset
         when the data area has been reduced through editing. It is not needed
         if the data extent has increased or if the terrain dataset is
         z-tolerance based. It will scan through all the terrain data to
         determine the new extent.NO_UPDATE_EXTENT-The extent of the terrain
         dataset will not be
         recalculated. This is the default.UPDATE_EXTENT-The extent of the
         terrain dataset will be recalculated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.BuildTerrain_3d(*gp_fixargs((in_terrain, update_extent), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("ChangeTerrainReferenceScale_3d", None)
def ChangeTerrainReferenceScale(
    in_terrain=None,
    old_refscale=None,
    new_refscale=None,
) -> Result1[str | Layer]:
    """ChangeTerrainReferenceScale(in_terrain, old_refscale, new_refscale)

       Changes the reference scale associated with a terrain pyramid level.

    INPUTS:
     in_terrain (Terrain Layer):
         The terrain dataset that will be processed.
     old_refscale (Long):
         The reference scale of an existing pyramid level.
     new_refscale (Long):
         The new reference scale for the pyramid level."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ChangeTerrainReferenceScale_3d(*gp_fixargs((in_terrain, old_refscale, new_refscale), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ChangeTerrainResolutionBounds_3d", None)
def ChangeTerrainResolutionBounds(
    in_terrain=None,
    feature_class=None,
    lower_pyramid_resolution=None,
    upper_pyramid_resolution=None,
    overview: Literal["OVERVIEW", "NO_OVERVIEW"] | None = None,
) -> Result1[str | Layer]:
    """ChangeTerrainResolutionBounds(in_terrain, feature_class, {lower_pyramid_resolution}, {upper_pyramid_resolution}, {overview})

       Changes the pyramid levels at which a feature class will be enforced
       for a given terrain dataset.

    INPUTS:
     in_terrain (Terrain Layer):
         The terrain dataset that will be processed.
     feature_class (String):
         The feature class referenced by the terrain that will have its
         pyramid-level resolutions modified.
     lower_pyramid_resolution {Double}:
         The new lower pyramid-level resolution for the chosen feature class.
     upper_pyramid_resolution {Double}:
         The new upper pyramid-level resolution for the chosen feature class.
     overview {Boolean}:
         Specifies whether the feature class will contribute to the overview of
         the terrain dataset.OVERVIEW-Enforces the feature class at the
         overview display of the
         terrain dataset. This is the default.NO_OVERVIEW-Omits the feature
         class from the overview display of the
         terrain dataset."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ChangeTerrainResolutionBounds_3d(
                *gp_fixargs(
                    (in_terrain, feature_class, lower_pyramid_resolution, upper_pyramid_resolution, overview), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateTerrain_3d", None)
def CreateTerrain(
    in_feature_dataset=None,
    out_terrain_name=None,
    average_point_spacing=None,
    max_overview_size=None,
    config_keyword=None,
    pyramid_type: Literal["WINDOWSIZE", "ZTOLERANCE"] | None = None,
    windowsize_method: Literal["ZMIN", "ZMAX", "ZMEAN", "ZMINMAX"] | None = None,
    secondary_thinning_method: Literal["NONE", "MILD", "MODERATE", "STRONG"] | None = None,
    secondary_thinning_threshold=None,
    triangulation_method: Literal["DELAUNAY", "CONSTRAINED_DELAUNAY"] | None = None,
) -> Result1[str]:
    """CreateTerrain(in_feature_dataset, out_terrain_name, average_point_spacing, {max_overview_size}, {config_keyword}, {pyramid_type}, {windowsize_method}, {secondary_thinning_method}, {secondary_thinning_threshold}, {triangulation_method})

       Creates a terrain dataset.

    INPUTS:
     in_feature_dataset (Feature Dataset):
         The feature dataset that will contain the terrain dataset.
     out_terrain_name (String):
         The name of the terrain dataset.
     average_point_spacing (Double):
         The average horizontal distance between the data points that will be
         used in modeling the terrain. Sensor based measurements-such as
         photogrammetric, lidar, and sonar surveys-typically have a known
         spacing that should be used. Use the horizontal units of the feature
         dataset's coordinate system for the spacing.
     max_overview_size {Long}:
         The terrain overview is similar to the image thumbnail concept. It is
         the coarsest representation of the terrain dataset, and the maximum
         size represents the upper limit of the number of measurement points
         that can be sampled to create the overview.
     config_keyword {String}:
         The configuration keyword that will be used to optimize the terrain's
         storage in an enterprise database.
     pyramid_type {String}:
         Specifies the point thinning method that will be used to construct the
         terrain pyramids.WINDOWSIZE-Data points in the area defined by a given
         window size for
         each pyramid level will be selected using the windowsize_method
         parameter value. This is the default.ZTOLERANCE-The vertical accuracy
         of each pyramid level relative to the
         full resolution of the data points will be specified.
     windowsize_method {String}:
         Specifies how points in the area defined by the window size will be
         selected. This parameter is only applicable when WINDOWSIZE is
         specified for the pyramid_type parameter.ZMIN-The point with the
         smallest elevation value will be selected.
         This is the default.ZMAX-The point with the largest elevation value
         will be selected.ZMEAN-The point with the elevation value closest to
         the average of all
         values will be selected.ZMINMAX-The points with the smallest and
         largest elevation values will
         be selected.
     secondary_thinning_method {String}:
         Specifies additional thinning that will be performed to reduce the
         number of points used over flat areas when window size pyramids are
         used. An area is considered flat if the heights of points in that area
         are within the secondary_thinning_threshold parameter value. Its
         effect is more evident at higher-resolution pyramid levels, since
         smaller areas are more likely to be flat than larger areas.NONE-No
         secondary thinning will be performed. This is the
         default.MILD-Mild thinning will be performed to preserve linear
         discontinuities (for example, building sides and forest boundaries).
         This method is recommended for lidar that includes both ground and
         nonground points. It will thin the fewest points.MODERATE-Moderate
         thinning will be performed, which provides a balance
         between performance and accuracy. This method does not preserve as
         much detail as mild thinning but comes close while eliminating more
         points overall.STRONG-Strong thinning will be performed, which removes
         the most
         points but is less likely to preserve sharply delineated features.
         Limit its use to surfaces where slope tends to change gradually. For
         example, strong thinning is efficient for bare-earth lidar and
         bathymetry.
     secondary_thinning_threshold {Double}:
         The vertical threshold that will be used to activate secondary
         thinning when the pyramid_type parameter is set to WINDOWSIZE. Set the
         value equal to or larger than the vertical accuracy of the data.
     triangulation_method {String}:
         Specifies whether breakline features will be incorporated into the
         terrain surface by densifying their segments to conform to Delaunay
         triangulation rules for constructing a TIN surface.Delaunay
         triangulation will densify breakline features to accommodate
         the points surrounding them in a manner that avoids the creation of
         long, thin triangles that typically yield undesirable results when
         analyzing a TIN-based surface. Additionally, natural neighbor
         interpolation and Thiessen (Voronoi) polygon generation can only be
         performed on conforming Delaunay triangulations.A constrained Delaunay
         triangulation will avoid densifying breakline
         features, incorporating breakline segments as edges into the TIN
         surface. Consider this option when you need to explicitly define
         certain edges that are guaranteed not to be modified (that is, split
         into multiple edges) by the triangulator.DELAUNAY-Breaklines will be
         densified to construct Delaunay triangles
         that accommodate the points surrounding them. This is the
         default.CONSTRAINED_DELAUNAY-Breaklines will not be densified."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateTerrain_3d(
                *gp_fixargs(
                    (
                        in_feature_dataset,
                        out_terrain_name,
                        average_point_spacing,
                        max_overview_size,
                        config_keyword,
                        pyramid_type,
                        windowsize_method,
                        secondary_thinning_method,
                        secondary_thinning_threshold,
                        triangulation_method,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DeleteTerrainPoints_3d", None)
def DeleteTerrainPoints(
    in_terrain=None,
    data_source=None,
    polygon_features_or_extent=None,
) -> Result1[str | Layer]:
    """DeleteTerrainPoints(in_terrain, data_source;data_source..., polygon_features_or_extent)

       Deletes points within a specified area of interest from one or more
       features that participate in a terrain dataset.

    INPUTS:
     in_terrain (Terrain Layer):
         The terrain dataset that will be processed.
     data_source (String):
         One or more feature classes from which points will be removed.
     polygon_features_or_extent (Feature Layer / Extent):
         Specifies the area from which points will be removed. A polygon
         feature class or an extent can be used.If extent values are desired,
         use an arcpy.Extent object."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DeleteTerrainPoints_3d(*gp_fixargs((in_terrain, data_source, polygon_features_or_extent), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RemoveFeatureClassFromTerrain_3d", None)
def RemoveFeatureClassFromTerrain(
    in_terrain=None,
    feature_class=None,
) -> Result1[str | Layer]:
    """RemoveFeatureClassFromTerrain(in_terrain, feature_class)

       Removes reference to a feature class participating in a terrain
       dataset.

    INPUTS:
     in_terrain (Terrain Layer):
         The terrain dataset that will be processed.
     feature_class (String):
         The feature class to be removed."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RemoveFeatureClassFromTerrain_3d(*gp_fixargs((in_terrain, feature_class), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RemoveTerrainPoints_3d", None)
def RemoveTerrainPoints(
    in_terrain=None,
    data_source=None,
    aoi_extents=None,
) -> Result1[str | Layer]:
    """RemoveTerrainPoints(in_terrain, data_source;data_source..., aoi_extents)

       This tool removes points within an area of interest from one or more
       embedded feature classes.

    INPUTS:
     in_terrain (Terrain Layer):
         The terrain dataset to be modified
     data_source (String):
         One or more embedded feature classes from which points will be removed
     aoi_extents (Extent):
         The XY extent defining the area from which points will be removed"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RemoveTerrainPoints_3d(*gp_fixargs((in_terrain, data_source, aoi_extents), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RemoveTerrainPyramidLevel_3d", None)
def RemoveTerrainPyramidLevel(
    in_terrain=None,
    pyramid_level_resolution=None,
) -> Result1[str | Layer]:
    """RemoveTerrainPyramidLevel(in_terrain, pyramid_level_resolution)

       Removes a pyramid level from a terrain dataset.

    INPUTS:
     in_terrain (Terrain Layer):
         The terrain dataset that will be processed.
     pyramid_level_resolution (Double):
         The pyramid level to be removed as specified by its resolution."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RemoveTerrainPyramidLevel_3d(*gp_fixargs((in_terrain, pyramid_level_resolution), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ReplaceTerrainPoints_3d", None)
def ReplaceTerrainPoints(
    in_terrain=None,
    terrain_feature_class=None,
    in_point_features=None,
    polygon_features_or_extent=None,
) -> Result1[str | Layer]:
    """ReplaceTerrainPoints(in_terrain, terrain_feature_class, in_point_features, {polygon_features_or_extent})

       Replaces points referenced by a terrain dataset with points from a
       specified feature class.

    INPUTS:
     in_terrain (Terrain Layer):
         The terrain dataset that will be processed.
     terrain_feature_class (String):
         The name of the terrain point feature class that will have some or all
         of its points replaced.
     in_point_features (Feature Layer):
         The point or multipoint features that will replace the terrain point
         features.
     polygon_features_or_extent {Feature Layer / Extent}:
         An optional area of interest can be used to define the extent of the
         area in which the terrain points would be replaced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ReplaceTerrainPoints_3d(
                *gp_fixargs((in_terrain, terrain_feature_class, in_point_features, polygon_features_or_extent), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# Terrain Dataset\Terrain Conversion toolset
@gptooldoc("TerrainToPoints_3d", None)
def TerrainToPoints(
    in_terrain=None,
    out_feature_class=None,
    pyramid_level_resolution=None,
    source_embedded_feature_class=None,
    out_geometry_type: Literal["MULTIPOINT", "POINT"] | None = None,
) -> Result1[str]:
    """TerrainToPoints(in_terrain, out_feature_class, {pyramid_level_resolution}, {source_embedded_feature_class}, {out_geometry_type})

       Converts a terrain dataset into a new point or multipoint feature
       class.

    INPUTS:
     in_terrain (Terrain Layer):
         The terrain dataset that will be processed.
     pyramid_level_resolution {Double}:
         The z-tolerance or window-size resolution of the terrain pyramid level
         that will be used. The default is 0, or full resolution.
     source_embedded_feature_class {String}:
         The name of the terrain dataset's embedded points to be exported. If
         an embedded feature is specified, only the points from the feature
         will be written to the output. Otherwise, all points from all data
         sources in the terrain will be exported.
     out_geometry_type {String}:
         The geometry of the output feature class.MULTIPOINT-The output point
         features will be written to a multipoint
         feature class. This is the default.POINT-The output point features
         will be written to a point feature
         class.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TerrainToPoints_3d(
                *gp_fixargs(
                    (
                        in_terrain,
                        out_feature_class,
                        pyramid_level_resolution,
                        source_embedded_feature_class,
                        out_geometry_type,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TerrainToRaster_3d", None)
def TerrainToRaster(
    in_terrain=None,
    out_raster=None,
    data_type: Literal["FLOAT", "INT"] | None = None,
    method: Literal["LINEAR", "NATURAL_NEIGHBORS"] | None = None,
    sample_distance: Literal["OBSERVATIONS", "CELLSIZE"] | None = None,
    pyramid_level_resolution=None,
    sample_value=None,
) -> Result1[str]:
    """TerrainToRaster(in_terrain, out_raster, {data_type}, {method}, {sample_distance}, {pyramid_level_resolution}, {sample_value})

       Interpolates a raster using z-values from a terrain dataset.

    INPUTS:
     in_terrain (Terrain Layer):
         The terrain dataset that will be processed.
     data_type {String}:
         Specifies the type of numeric values that will be stored in the output
         raster.FLOAT-The output raster will use 32-bit floating point, which
         supports
         values ranging from -3.402823466e+38 to 3.402823466e+38. This is the
         default.INT-The output raster will use an appropriate integer bit
         depth. This
         option will round z-values to the nearest whole number and write an
         integer to each raster cell value.
     method {String}:
         The interpolation method that will be used to calculate cell
         values.LINEAR-Applies a distance based weight to the Z of each node in
         the
         triangle encompassing the center of a given cell, then sums the
         weighted values to assign the cell value. This is the
         default.NATURAL_NEIGHBORS-Applies an area based weighting scheme that
         uses
         Voronoi polygons to determine cell values.
     sample_distance {String}:
         The sampling method and distance used to define the cell size of the
         output raster.OBSERVATIONS-Defines the number of cells that divide the
         longest side
         of the output raster. This method is used by default with the value of
         250.CELLSIZE-Defines the cell size of the output raster.
     pyramid_level_resolution {Double}:
         The z-tolerance or window-size resolution of the terrain pyramid level
         that will be used. The default is 0, or full resolution.
     sample_value {Double}:
         The value that corresponds with thefor specifying the output
         raster's cell size. Sampling Distance

    OUTPUTS:
     out_raster (Raster Dataset):
         The location and name of the output raster. When storing a raster
         dataset in a geodatabase or in a folder such as an Esri Grid, do not
         add a file extension to the name of the raster dataset. A file
         extension can be provided to define the raster's format when storing
         it in a folder, such as .tif to generate a GeoTIFF or .img to generate
         an ERDAS IMAGINE format file.If the raster is stored as a .tif file or
         in a geodatabase, the raster
         compression type and quality can be specified using geoprocessing
         environment settings."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TerrainToRaster_3d(
                *gp_fixargs(
                    (
                        in_terrain,
                        out_raster,
                        data_type,
                        method,
                        sample_distance,
                        pyramid_level_resolution,
                        sample_value,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TerrainToTin_3d", None)
def TerrainToTin(
    in_terrain=None,
    out_tin=None,
    pyramid_level_resolution=None,
    max_nodes=None,
    clip_to_extent: Literal["CLIP", "NO_CLIP"] | None = None,
) -> Result1[str]:
    """TerrainToTin(in_terrain, out_tin, {pyramid_level_resolution}, {max_nodes}, {clip_to_extent})

       Converts a terrain dataset to a triangulated irregular network (TIN)
       dataset.

    INPUTS:
     in_terrain (Terrain Layer):
         The terrain dataset that will be processed.
     pyramid_level_resolution {Double}:
         The z-tolerance or window-size resolution of the terrain pyramid level
         that will be used. The default is 0, or full resolution.
     max_nodes {Long}:
         The maximum number of nodes permitted in the output TIN. The tool will
         return an error if the analysis extent and pyramid level would produce
         a TIN that exceeds this size. The default is 5 million.
     clip_to_extent {Boolean}:
         Specifies whether the resulting TIN will be clipped against the
         analysis extent. This only has an effect if the analysis extent is
         defined and it's smaller than the extent of the input
         terrain.CLIP-Clips the output TIN against the analysis extent. This is
         the
         default.NO_CLIP-Does not clip the output TIN against the analysis
         extent.

    OUTPUTS:
     out_tin (TIN):
         The TIN dataset that will be generated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TerrainToTin_3d(
                *gp_fixargs((in_terrain, out_tin, pyramid_level_resolution, max_nodes, clip_to_extent), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# Triangulated Surface toolset
@gptooldoc("LocateOutliers_3d", None)
def LocateOutliers(
    in_surface=None,
    out_feature_class=None,
    apply_hard_limit: Literal["APPLY_HARD_LIMIT", "NO_APPLY_HARD_LIMIT"] | None = None,
    absolute_z_min=None,
    absolute_z_max=None,
    apply_comparison_filter: Literal["APPLY_COMPARISON_FILTER", "NO_APPLY_COMPARISON_FILTER"] | None = None,
    z_tolerance=None,
    slope_tolerance=None,
    exceed_tolerance_ratio=None,
    outlier_cap=None,
) -> Result1[str]:
    """LocateOutliers(in_surface, out_feature_class, {apply_hard_limit}, {absolute_z_min}, {absolute_z_max}, {apply_comparison_filter}, {z_tolerance}, {slope_tolerance}, {exceed_tolerance_ratio}, {outlier_cap})

       Identifies anomalous elevation measurements from terrain, TIN, or LAS
       datasets that exceed a defined range of elevation values or have slope
       characteristics that are inconsistent with the surrounding surface.

    INPUTS:
     in_surface (TIN Layer / Terrain Layer / LAS Dataset Layer):
         The terrain, TIN, or LAS dataset that will be analyzed.
     apply_hard_limit {Boolean}:
         Specifies use of absolute z minimum and maximum to find
         outliers.APPLY_HARD_LIMIT-Use the absolute z minimum and maximum to
         find
         outliers.NO_APPLY_HARD_LIMIT-Do not use the absolute z minimum and
         maximum to
         find outliers. This is the default.
     absolute_z_min {Double}:
         If hard limits are applied, any point with an elevation below this
         value will be considered an outlier. The default is 0.
     absolute_z_max {Double}:
         If hard limits are applied, any point with an elevation above this
         value will be considered an outlier. The default is 0.
     apply_comparison_filter {Boolean}:
         The comparison filter consists of three parameters for determining
         outliers: z_tolerance, slope_tolerance, and
         exceed_tolerance_ratio.APPLY_COMPARISON_FILTER-Use the three
         comparison parameters
         (z_tolerance, slope_tolerance, and exceed_tolerance_ratio) in
         assessing points. This is the default.NO_APPLY_COMPARISON_FILTER-Do
         not use the three comparison parameters
         (z_tolerance, slope_tolerance, and exceed_tolerance_ratio) in
         assessing points.
     z_tolerance {Double}:
         Compares z-values of neighboring points if the comparison filter is
         applied. The default is 0.
     slope_tolerance {Double}:
         The threshold of slope variance between consecutive points that will
         be used to identify outlier points. Slope is expressed as a
         percentage, with the default being 150.
     exceed_tolerance_ratio {Double}:
         Defines the criteria for determining each outlier point as a function
         of the ratio of points in its natural neighborhood that must exceed
         the specified comparison filters. For example, the default value of
         0.5 means at least half of the points surrounding the query point must
         exceed the comparison filters for the query point to be considered an
         outlier. A value of 0.7 means at least 70 percent of the neighbor
         points must exceed the tolerances.
     outlier_cap {Long}:
         The maximum number of outlier points that can be written to the
         output. Once this value is reached, no further outliers are sought.
         The default is 2,500.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LocateOutliers_3d(
                *gp_fixargs(
                    (
                        in_surface,
                        out_feature_class,
                        apply_hard_limit,
                        absolute_z_min,
                        absolute_z_max,
                        apply_comparison_filter,
                        z_tolerance,
                        slope_tolerance,
                        exceed_tolerance_ratio,
                        outlier_cap,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SurfaceAspect_3d", None)
def SurfaceAspect(
    in_surface=None,
    out_feature_class=None,
    class_breaks_table=None,
    aspect_field=None,
    pyramid_level_resolution=None,
) -> Result1[str]:
    """SurfaceAspect(in_surface, out_feature_class, {class_breaks_table}, {aspect_field}, {pyramid_level_resolution})

       Creates polygon features that represent aspect measurements derived
       from a TIN, terrain, or LAS dataset surface.

    INPUTS:
     in_surface (TIN Layer / Terrain Layer / LAS Dataset Layer):
         The TIN, terrain, or LAS dataset surface that will be processed.
     class_breaks_table {Table}:
         A table containing the classification breaks that will be used to
         define the aspect ranges in the output feature class.
     aspect_field {String}:
         The field containing aspect code values.
     pyramid_level_resolution {Double}:
         The z-tolerance or window-size resolution of the terrain pyramid level
         that will be used. The default is 0, or full resolution.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SurfaceAspect_3d(
                *gp_fixargs(
                    (in_surface, out_feature_class, class_breaks_table, aspect_field, pyramid_level_resolution), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SurfaceContour_3d", None)
def SurfaceContour(
    in_surface=None,
    out_feature_class=None,
    interval=None,
    base_contour=None,
    contour_field=None,
    contour_field_precision=None,
    index_interval=None,
    index_interval_field=None,
    z_factor=None,
    pyramid_level_resolution=None,
) -> Result1[str]:
    """SurfaceContour(in_surface, out_feature_class, interval, {base_contour}, {contour_field}, {contour_field_precision}, {index_interval}, {index_interval_field}, {z_factor}, {pyramid_level_resolution})

       Creates contour lines derived from a terrain, TIN, or LAS dataset
       surface.

    INPUTS:
     in_surface (TIN Layer / Terrain Layer / LAS Dataset Layer):
         The TIN, terrain, or LAS dataset surface that will be processed.
     interval (Double):
         The interval between the contours.
     base_contour {Double}:
         Defines the starting Z value from which the contour interval is either
         added or subtracted to delineate contours. The default value is 0.0.
     contour_field {String}:
         The field that stores the contour value associated with each line in
         the output feature class.
     contour_field_precision {Long}:
         The precision of the contour field. Zero specifies an integer, and the
         numbers 1-9 indicate how many decimal places the field will contain.
         By default, the field will be an integer (0).
     index_interval {Double}:
         Index contours are commonly used as a cartographic aid for assisting
         in the visualization of contour lines. The index interval is typically
         five times larger than the contour interval. Use of this parameter
         adds an integer field defined by the index_interval_field to the
         attribute table of the output feature class, where a value of 1
         denotes the index contours.
     index_interval_field {String}:
         The name of the field used to identify index contours. This
         will only be used if the index_interval is defined. By default, the
         field name is. Index
     z_factor {Double}:
         The factor by which z-values will be multiplied. This is typically
         used to convert z linear units to match x,y linear units. The default
         is 1, which leaves elevation values unchanged. This parameter is not
         available if the spatial reference of the input surface has a z-datum
         with a specified linear unit.
     pyramid_level_resolution {Double}:
         The z-tolerance or window-size resolution of the terrain pyramid level
         that will be used. The default is 0, or full resolution.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SurfaceContour_3d(
                *gp_fixargs(
                    (
                        in_surface,
                        out_feature_class,
                        interval,
                        base_contour,
                        contour_field,
                        contour_field_precision,
                        index_interval,
                        index_interval_field,
                        z_factor,
                        pyramid_level_resolution,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SurfaceSlope_3d", None)
def SurfaceSlope(
    in_surface=None,
    out_feature_class=None,
    units: Literal["PERCENT", "DEGREE"] | None = None,
    class_breaks_table=None,
    slope_field=None,
    z_factor=None,
    pyramid_level_resolution=None,
) -> Result1[str]:
    """SurfaceSlope(in_surface, out_feature_class, {units}, {class_breaks_table}, {slope_field}, {z_factor}, {pyramid_level_resolution})

       Creates polygon features that represent ranges of slope values for
       triangulated surfaces.

    INPUTS:
     in_surface (TIN Layer / Terrain Layer / LAS Dataset Layer):
         The TIN, terrain, or LAS dataset whose slope measurements will be
         written to the output polygon feature.
     units {String}:
         The units of measure to be used in calculating slope.PERCENT-Slope is
         expressed as a percentage value. This is the
         default.DEGREE-Slope is expressed as the angle of inclination from a
         horizontal plane.
     class_breaks_table {Table}:
         A table containing classification breaks that will be used to group
         the output features. The first column of this table will indicate the
         break point, whereas the second will provide the classification code.
     slope_field {String}:
         The field containing slope values.
     z_factor {Double}:
         The factor by which z-values will be multiplied. This is typically
         used to convert z linear units to match x,y linear units. The default
         is 1, which leaves elevation values unchanged. This parameter is not
         available if the spatial reference of the input surface has a z-datum
         with a specified linear unit.
     pyramid_level_resolution {Double}:
         The z-tolerance or window-size resolution of the terrain pyramid level
         that will be used. The default is 0, or full resolution.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be produced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SurfaceSlope_3d(
                *gp_fixargs(
                    (
                        in_surface,
                        out_feature_class,
                        units,
                        class_breaks_table,
                        slope_field,
                        z_factor,
                        pyramid_level_resolution,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Visibility toolset
@gptooldoc("ConstructSightLines_3d", None)
def ConstructSightLines(
    in_observer_points=None,
    in_target_features=None,
    out_line_feature_class=None,
    observer_height_field: Literal["<None>"] | None = None,
    target_height_field: Literal["<None>"] | None = None,
    join_field=None,
    sample_distance=None,
    output_the_direction: Literal["OUTPUT_THE_DIRECTION", "NOT_OUTPUT_THE_DIRECTION"] | None = None,
    sampling_method: Literal["2D_DISTANCE", "3D_DISTANCE"] | None = None,
) -> Result1[str]:
    """ConstructSightLines(in_observer_points, in_target_features, out_line_feature_class, {observer_height_field}, {target_height_field}, {join_field}, {sample_distance}, {output_the_direction}, {sampling_method})

       Creates line features that represent sight lines from one or more
       observer points to features in a target feature class.

    INPUTS:
     in_observer_points (Feature Layer):
         The single-point features that represent observer points. Multipoint
         features are not supported.
     in_target_features (Feature Layer):
         The target features (points, multipoints, lines, and polygons).
     observer_height_field {String}:
         The source of the height values for the observer points obtained from
         its attribute table. A defaultfield is selected from among the
         options listed below
         by order of priority. If multiple fields exist, and the desired field
         does not have a higher priority in the default field selection, the
         desired field will need to be specified. Observer Height
         Field<None>-No Z values will be assigned to the resulting sight line
         features.Shape.ZSpotZZ_ValueHeightElevElevationContour
     target_height_field {String}:
         The height field for the target. A defaultfield is selected
         from among the options listed below
         by order of priority. If multiple fields exist, and the desired field
         does not have a higher priority in the default field selection, the
         desired field will need to be specified. Target Height
         Field<None>-No Z values will be assigned to the resulting sight line
         features.Shape.ZSpotZZ_ValueHeightElevElevationContour
     join_field {String}:
         The join field is used to match observers to specific
         targets.<None>-No Z values will be assigned to the resulting sight
         line
         features.
     sample_distance {Double}:
         The distance between samples when the target is either a line
         or polygon feature class. Theunits are interpreted in the XY units of
         the output feature class. Sampling Distance
     output_the_direction {Boolean}:
         Specifies whether to add direction attributes to the output
         sight lines. Two additional fields will be added and populated to
         indicate direction:and(vertical angle).
         AZIMUTHVERT_ANGLENOT_OUTPUT_THE_DIRECTION-No direction attributes
         will be added to the
         output sight lines. This is the default. OUTPUT_THE_DIRECTION-
         Two additional fields will be added and
         populated to indicate direction:and(vertical angle).
         AZIMUTHVERT_ANGLE
     sampling_method {String}:
         Specifies how the sampling distance will be used to establish sight
         lines along the target feature.2D_DISTANCE-The distance will be
         evaluated in two-dimensional
         Cartesian space. This is the default.3D_DISTANCE-The distance will be
         evaluated in three-dimensional
         length.

    OUTPUTS:
     out_line_feature_class (Feature Class):
         The output feature class containing the sight lines."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConstructSightLines_3d(
                *gp_fixargs(
                    (
                        in_observer_points,
                        in_target_features,
                        out_line_feature_class,
                        observer_height_field,
                        target_height_field,
                        join_field,
                        sample_distance,
                        output_the_direction,
                        sampling_method,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Intervisibility_3d", None)
def Intervisibility(
    sight_lines=None,
    obstructions=None,
    visible_field=None,
) -> Result1[str | Layer]:
    """Intervisibility(sight_lines, obstructions;obstructions..., {visible_field})

       Determines the visibility of sight lines using potential obstructions
       defined by any combination of 3D features and surfaces.

    INPUTS:
     sight_lines (Feature Layer):
         The 3D sight lines whose visibility will be determined.
     obstructions (Feature Layer / TIN Layer / Raster Layer / Mosaic Layer / Scene Layer / File):
         The mesh and surface datasets that provide potential obstructions for
         sight lines. Obstructions can be defined by any combination of
         multipatch features, integrated mesh scene layers, TIN datasets, and
         raster surfaces.
     visible_field {String}:
         The name of the field that will store the visibility results.
         A resulting value of 0 indicates that the sight line's start and end
         points are not visible to one another. A value of 1 indicates that the
         sight line's start and end points are visible to one another. The
         default field name is. If the field already exists, its values will be
         overwritten. VISIBLE"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Intervisibility_3d(*gp_fixargs((sight_lines, obstructions, visible_field), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("LineOfSight_3d", None)
def LineOfSight(
    in_surface=None,
    in_line_feature_class=None,
    out_los_feature_class=None,
    out_obstruction_feature_class=None,
    use_curvature: Literal["CURVATURE", "NO_CURVATURE"] | None = None,
    use_refraction: Literal["REFRACTION", "NO_REFRACTION"] | None = None,
    refraction_factor=None,
    pyramid_level_resolution=None,
    in_features=None,
    output_graphing_attributes: Literal["OUTPUT_GRAPHING_ATTRIBUTES", "NO_OUTPUT_GRAPHING_ATTRIBUTES"] | None = None,
) -> Result2[str, str]:
    """LineOfSight(in_surface, in_line_feature_class, out_los_feature_class, {out_obstruction_feature_class}, {use_curvature}, {use_refraction}, {refraction_factor}, {pyramid_level_resolution}, {in_features}, {output_graphing_attributes})

       Determines the visibility of sight lines over obstructions consisting
       of a surface and an optional multipatch dataset.

    INPUTS:
     in_surface (TIN Layer / Raster Layer / Mosaic Layer / Terrain Layer / LAS Dataset Layer / Scene Layer / File):
         The integrated mesh scene layer, LAS dataset, raster, TIN, or terrain
         surface that will be used to determine visibility.
     in_line_feature_class (Feature Layer):
         The sight line features whose first vertex defines the observation
         point and last vertex identifies the target location. When the sight
         lines are 2D features, the observer and target heights will be derived
         from the input surface. When the sight lines are 3D features, the
         observer and target heights will be obtained from the feature's
         z-coordinates. 2D lines will be evaluated at an offset from the
         underlying
         surface. A default offset of 1 is applied to raise the points above
         the surface. Use a field namedto define a custom offset height for the
         observer; use a field namedto define a custom offset for the target.
         OffsetAOffsetB
     use_curvature {Boolean}:
         Specifies whether the earth's curvature will be taken into
         consideration for the line-of-sight analysis. For this parameter to be
         enabled, the surface must have a defined spatial reference in
         projected coordinates with defined z-units.CURVATURE-The earth's
         curvature will be taken into
         consideration.NO_CURVATURE-The earth's curvature will not be taken
         into
         consideration. This is the default.
     use_refraction {Boolean}:
         Specifies whether atmospheric refraction will be taken into
         consideration when generating a line of sight from a functional
         surface. This parameter does not apply if multipatch features are
         used.REFRACTION-Atmospheric refraction will be taken into
         consideration.NO_REFRACTION-Atmospheric refraction will not be taken
         into
         consideration. This is the default.
     refraction_factor {Double}:
         The value that will be used in the refraction factor. The default
         value is 0.13.
     pyramid_level_resolution {Double}:
         The z-tolerance or window-size resolution of the terrain pyramid level
         that will be used. The default value is 0, or full resolution.
     in_features {Feature Layer}:
         A multipatch feature that may define additional obstructing elements,
         such as buildings. Refraction options are not honored for this input.
     output_graphing_attributes {Boolean}:
         Specifies whether the output sight line attributes will include
         additional fields with information that can be used in a profile
         graph. These fields provide information about the visibility of the
         sight line between the observer and target, along with the location of
         the obstruction point for a sight line with a non-visible
         target.OUTPUT_GRAPHING_ATTRIBUTES-Graphing attributes will be included
         in the
         output. This is the default..NO_OUTPUT_GRAPHING_ATTRIBUTES-Graphing
         attributes will not be included
         in the output.

    OUTPUTS:
     out_los_feature_class (Feature Class):
         The output line feature class along which visibility will be
         determined
     out_obstruction_feature_class {Feature Class}:
         An optional point feature class identifying the location of the first
         obstruction on the observer's sight line to its target."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LineOfSight_3d(
                *gp_fixargs(
                    (
                        in_surface,
                        in_line_feature_class,
                        out_los_feature_class,
                        out_obstruction_feature_class,
                        use_curvature,
                        use_refraction,
                        refraction_factor,
                        pyramid_level_resolution,
                        in_features,
                        output_graphing_attributes,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ObserverPoints_3d", None)
def ObserverPoints(
    in_raster=None,
    in_observer_point_features=None,
    out_raster=None,
    z_factor=None,
    curvature_correction: Literal["FLAT_EARTH", "CURVED_EARTH"] | None = None,
    refractivity_coefficient=None,
    out_agl_raster=None,
) -> Result2[str, str]:
    """ObserverPoints(in_raster, in_observer_point_features, out_raster, {z_factor}, {curvature_correction}, {refractivity_coefficient}, {out_agl_raster})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ObserverPoints_3d(
                *gp_fixargs(
                    (
                        in_raster,
                        in_observer_point_features,
                        out_raster,
                        z_factor,
                        curvature_correction,
                        refractivity_coefficient,
                        out_agl_raster,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Skyline_3d", None)
def Skyline(
    in_observer_point_features=None,
    out_feature_class=None,
    in_surface=None,
    virtual_surface_radius=None,
    virtual_surface_elevation=None,
    in_features=None,
    feature_lod: Literal["FULL_DETAIL", "CONVEX_FOOTPRINT", "ENVELOPE"] | None = None,
    from_azimuth_value_or_field=None,
    to_azimuth_value_or_field=None,
    azimuth_increment_value_or_field=None,
    max_horizon_radius=None,
    segment_skyline: Literal["SEGMENT_SKYLINE", "NO_SEGMENT_SKYLINE"] | None = None,
    scale_to_percent=None,
    scale_according_to: Literal["VERTICAL_ANGLE", "ELEVATION"] | None = None,
    scale_method: Literal["SKYLINE_MAXIMUM", "EACH_VERTEX"] | None = None,
    use_curvature: Literal["CURVATURE", "NO_CURVATURE"] | None = None,
    use_refraction: Literal["REFRACTION", "NO_REFRACTION"] | None = None,
    refraction_factor=None,
    pyramid_level_resolution=None,
    create_silhouettes: Literal["CREATE_SILHOUETTES", "NO_CREATE_SILHOUETTES"] | None = None,
    apply_max_radius_to_features: Literal["APPLY_MAX_RADIUS_TO_FEATURES", "NO_APPLY_MAX_RADIUS_TO_FEATURES"]
    | None = None,
    vertical_offset=None,
) -> Result1[str]:
    """Skyline(in_observer_point_features, out_feature_class, {in_surface}, {virtual_surface_radius}, {virtual_surface_elevation}, {in_features;in_features...}, {feature_lod}, {from_azimuth_value_or_field}, {to_azimuth_value_or_field}, {azimuth_increment_value_or_field}, {max_horizon_radius}, {segment_skyline}, {scale_to_percent}, {scale_according_to}, {scale_method}, {use_curvature}, {use_refraction}, {refraction_factor}, {pyramid_level_resolution}, {create_silhouettes}, {apply_max_radius_to_features}, {vertical_offset})

       Generates a line or multipatch feature class containing the results
       from a skyline or silhouette analysis.

    INPUTS:
     in_observer_point_features (Feature Layer):
         The 3D points representing observers. Each feature will have its own
         output.
     in_surface {TIN Layer / Raster Layer / Mosaic Layer / Terrain Layer / LAS Dataset Layer}:
         The topographic surface that will be used to define the horizon. If no
         surface is provided, a virtual surface will be used, defined by the
         virtual_surface_radius and virtual_surface_elevation parameter values.
     virtual_surface_radius {Linear Unit}:
         The radius of the virtual surface that will be used to define the
         horizon when no input surface is provided. The default is 1,000
         meters.
     virtual_surface_elevation {Linear Unit}:
         The elevation of the virtual surface that will be used to define the
         horizon in lieu of an actual surface. This parameter is ignored if an
         actual surface is provided. The default is 0.
     in_features {Feature Layer}:
         The features that will be used to determine the skyline. If no
         features are specified, the skyline will consist solely of the horizon
         line as defined by the topographic or virtual surface.
     feature_lod {String}:
         Specifies the level of detail at which each feature will be
         examined.FULL_DETAIL-Every edge in the feature will be considered in
         the
         skyline analysis (only edges of triangles and exterior rings are
         considered). This time-intensive technique is the most precise. This
         is the default.CONVEX_FOOTPRINT-The skyline analysis will use the
         upper perimeter of
         the convex hull of each feature's footprint extruded to the elevation
         of the highest vertex in the feature.ENVELOPE-The skyline analysis
         will use the perimeter of the three-
         dimensional feature envelope. This is the fastest technique.
     from_azimuth_value_or_field {Double / Field}:
         The direction from which the skyline analysis will start.This value is
         a geometric angle in degrees in the range of -360° to
         360°. The default is 0°, which is due north. Angular values increment
         in a clockwise direction so that 90° is due east, 180° is due south,
         and 270° is due west. Likewise, -90° is due west, -180° is due south,
         and -270° is due east. A numeric field from the
         in_observer_point_features parameter value can also be used to provide
         a distinct starting direction for each observer. The analysis extends
         until the to_azimuth_value_or_field parameter value is reached.
     to_azimuth_value_or_field {Double / Field}:
         The direction at which the skyline analysis will complete.This value
         is a geometric angle in degrees in the range of -360° to
         360°. The analysis starts from the observer point and increments from
         the from_azimuth_value_or_field parameter value until this parameter
         value is reached. This value cannot deviate more than 360° from the
         from_azimuth_value_or_field parameter value. The default is 360°,
         which is due north.For example, a starting azimuth of 0° with an
         ending azimuth of 360°
         will result in a full circular skyline around the observer, and a
         starting azimuth of 90° with an ending azimuth of 270° will cover the
         southern half of the radial range around the observer.A numeric field
         from the in_observer_point_features parameter value
         can be used to provide a distinct terminal direction for each
         observer.
     azimuth_increment_value_or_field {Double / Field}:
         The angular interval, in degrees, at which the horizon will be
         evaluated while conducting the skyline analysis between the
         from_azimuth_value_or_field and to_azimuth_value_or_field parameter
         values. The value must be no greater than the
         to_azimuth_value_or_field value minus the from_azimuth_value_or_field
         value. The default is 1.
     max_horizon_radius {Linear Unit}:
         The maximum distance from the observer location that a horizon will be
         sought. A value of zero indicates that no limit will be imposed. The
         default is 0.
     segment_skyline {Boolean}:
         Specifies whether the resulting skyline will have one feature for each
         observer point or each observer's skyline will be segmented by the
         unique elements that contribute to the skyline. This parameter is only
         available if multipatch features are specified for the in_features
         parameter.If silhouettes are being generated, this parameter will
         indicate
         whether divergent rays will be used. For sun shadows, use the
         NO_SEGMENT_SKYLINE option.NO_SEGMENT_SKYLINE-Each skyline feature will
         represent one observer.
         This is the default.SEGMENT_SKYLINE-Each observer's skyline will be
         segmented by the
         unique elements that contribute to the skyline.
     scale_to_percent {Double}:
         The percent of the original vertical angle (angle above the horizon or
         angle of elevation) or elevation each skyline vertex will be placed.
         If a value of 0 or 100 is used, scaling will not occur. The default is
         100.
     scale_according_to {String}:
         Specifies how scaling will be performed.VERTICAL_ANGLE-Scaling will be
         performed based on the vertical angle
         of each vertex relative to the observer point. This is the
         default.ELEVATION-Scaling will be performed based on the elevation of
         each
         vertex relative to the observer point.
     scale_method {String}:
         Specifies the vertex that will be used for scale
         calculation.SKYLINE_MAXIMUM-Vertices will be scaled relative to the
         vertical angle
         (or elevation) of the vertex with the highest vertical angle (or
         elevation). This is the default.EACH_VERTEX-Vertices will be scaled
         relative to the original vertical
         angle (or elevation) of each vertex.
     use_curvature {Boolean}:
         Specifies whether the curvature of the earth will be used when
         generating the ridgeline from a functional surface. This parameter is
         only available when a raster surface is specified for the in_surface
         parameter.CURVATURE-The curvature of the earth will be
         used.NO_CURVATURE-The
         curvature of the earth will not be used. This is the
         default.
     use_refraction {Boolean}:
         Specifies whether atmospheric refraction will be applied when
         generating the ridgeline from a functional surface. This option is
         only available when a raster surface is specified for the in_surface
         parameter.NO_REFRACTION-Atmospheric refraction will not be applied.
         This is the
         default.REFRACTION-Atmospheric refraction will be applied.
     refraction_factor {Double}:
         The refraction coefficient that will be used if atmospheric refraction
         is applied. The default is 0.13.
     pyramid_level_resolution {Double}:
         The z-tolerance or window-size resolution of the terrain pyramid level
         that will be used. The default is 0, or full resolution.
     create_silhouettes {Boolean}:
         Specifies whether output features will represent skylines defining the
         barrier between the input data and the open sky or silhouettes
         representing the facade of observable input features. This option is
         only available if one or more multipatch features are specified for
         the in_features parameter.NO_CREATE_SILHOUETTES-The output polyline
         features will represent the
         skyline. This is the default.CREATE_SILHOUETTES-The output multipatch
         features will represent
         silhouettes.
     apply_max_radius_to_features {Boolean}:
         Specifies whether the max_horizon_radius parameter value will be
         applied to the input features.NO_APPLY_MAX_RADIUS_TO_FEATURES-The
         radius will not apply to the input
         features. This is the default.APPLY_MAX_RADIUS_TO_FEATURES-The radius
         will apply to the input
         features.
     vertical_offset {Double / Field}:
         The height offset in z-units that will be applied to each observer
         when determining its skyline. The offset can be defined by a numeric
         value that is applied to all observers or by a numeric field in the
         observer's attribute table that contains the offset for each feature.
         The default is 0, which means no offset is applied.

    OUTPUTS:
     out_feature_class (Feature Class):
         The 3D features that will either be lines that represent the skyline
         or multipatches that represent silhouettes."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Skyline_3d(
                *gp_fixargs(
                    (
                        in_observer_point_features,
                        out_feature_class,
                        in_surface,
                        virtual_surface_radius,
                        virtual_surface_elevation,
                        in_features,
                        feature_lod,
                        from_azimuth_value_or_field,
                        to_azimuth_value_or_field,
                        azimuth_increment_value_or_field,
                        max_horizon_radius,
                        segment_skyline,
                        scale_to_percent,
                        scale_according_to,
                        scale_method,
                        use_curvature,
                        use_refraction,
                        refraction_factor,
                        pyramid_level_resolution,
                        create_silhouettes,
                        apply_max_radius_to_features,
                        vertical_offset,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SkylineBarrier_3d", None)
def SkylineBarrier(
    in_observer_point_features=None,
    in_features=None,
    out_feature_class=None,
    min_radius_value_or_field=None,
    max_radius_value_or_field=None,
    closed: Literal["CLOSED", "NO_CLOSED"] | None = None,
    base_elevation=None,
    project_to_plane: Literal["PROJECT_TO_PLANE", "NO_PROJECT_TO_PLANE"] | None = None,
) -> Result1[str]:
    """SkylineBarrier(in_observer_point_features, in_features, out_feature_class, {min_radius_value_or_field}, {max_radius_value_or_field}, {closed}, {base_elevation}, {project_to_plane})

       Generates a multipatch feature class representing a skyline barrier or
       shadow volume.

    INPUTS:
     in_observer_point_features (Feature Layer):
         The point feature class containing the observer points.
     in_features (Feature Layer):
         The input line feature class that represents the skylines, or the
         input multipatch feature class that represents the silhouettes.
     min_radius_value_or_field {Linear Unit / Field}:
         The minimum radius that the triangle edges will be extended from the
         observer point. For example, value of 10 meters means that all output
         barrier features will extend at least 10 meters from their point of
         origin. The default is 0, meaning no minimum distance is enforced.
     max_radius_value_or_field {Linear Unit / Field}:
         The maximum radius that the triangle edges will be extended from the
         observer point. The default is 0, meaning no maximum distance is
         enforced.
     closed {Boolean}:
         Specifies whether a skirt and a base will be added to the skyline
         barrier so that the resulting multipatch will appear to be a closed
         solid.NO_CLOSED-No skirt or base will be added to the multipatch; only
         the
         multipatch representing the surface going from the observer to the
         skyline will be represented. This is the default.CLOSED-A skirt and a
         base will be added to the multipatch to form the
         appearance of a closed solid.
     base_elevation {Linear Unit / Field}:
         The elevation of the base of the closed multipatch. This parameter is
         ignored if the closed parameter is set to NO_CLOSED. The default is 0.
     project_to_plane {Boolean}:
         Specifies whether the front (nearer to the observer) and back (farther
         from the observer) ends of the barrier should each be projected onto a
         vertical plane. This is typically set to PROJECT_TO_PLANE to create a
         shadow volume.NO_PROJECT_TO_PLANE-The barrier will extend from the
         observer point to
         the skyline (or nearer or farther if nonzero values are provided for
         minimum radius and maximum radius). This is the
         default.PROJECT_TO_PLANE-The barrier will extend from a vertical
         plane to a
         vertical plane.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class into which the skyline barrier or shadow
         volume will be placed."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SkylineBarrier_3d(
                *gp_fixargs(
                    (
                        in_observer_point_features,
                        in_features,
                        out_feature_class,
                        min_radius_value_or_field,
                        max_radius_value_or_field,
                        closed,
                        base_elevation,
                        project_to_plane,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SkylineGraph_3d", None)
def SkylineGraph(
    in_observer_point_features=None,
    in_line_features=None,
    base_visibility_angle=None,
    additional_fields: Literal["ADDITIONAL_FIELDS", "NO_ADDITIONAL_FIELDS"] | None = None,
    out_angles_table=None,
    out_graph=None,
    out_image_file=None,
) -> Result:
    """SkylineGraph(in_observer_point_features, in_line_features, {base_visibility_angle}, {additional_fields}, {out_angles_table}, {out_graph}, {out_image_file})

       Calculates the sky visibility ratio and generates an optional table
       and a polar graph.

    INPUTS:
     in_observer_point_features (Feature Layer):
         The input features containing one or more observer points.
     in_line_features (Feature Layer):
         The line features that represent the skyline.
     base_visibility_angle {Double}:
         The baseline vertical angle that will be used to calculate the
         percentage of visible sky. Zero is the horizon, 90 is straight up, and
         -90 is straight down. The default is 0.
     additional_fields {Boolean}:
         Specifies whether additional fields will be included in the angles
         table.NO_ADDITIONAL_FIELDS-Additional fields will not be included.
         This is
         the default.ADDITIONAL_FIELDS-Additional fields will be included.

    OUTPUTS:
     out_angles_table {Table}:
         The table that will be created for outputting the horizontal and
         vertical angles from the observer point to each of the vertices on the
         skyline.
     out_graph {Graph}:
         This parameter is not supported.
     out_image_file {File}:
         The image of the polar chart depicting the radial view of the visible
         skyline. The image can be created in PNG, JPG, JPEG, or SVG format."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SkylineGraph_3d(
                *gp_fixargs(
                    (
                        in_observer_point_features,
                        in_line_features,
                        base_visibility_angle,
                        additional_fields,
                        out_angles_table,
                        out_graph,
                        out_image_file,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SunShadowFrequency_3d", None)
def SunShadowFrequency(
    in_features=None,
    ground=None,
    out_raster=None,
    cell_size=None,
    start_time=None,
    end_time=None,
    time_interval=None,
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
    ]
    | None = None,
    dst: Literal["DST", "NO_DST"] | None = None,
    max_shadow_length=None,
) -> Result1[str]:
    """SunShadowFrequency(in_features;in_features..., ground, out_raster, {cell_size}, {start_time}, {end_time}, {time_interval}, {time_zone}, {dst}, {max_shadow_length})

       Calculates the number of times a fixed position on a surface has its
       direct sight line to the sun obstructed by multipatch features.

    INPUTS:
     in_features (Feature Layer):
         The multipatch features that will constitute the source of obstruction
         for sunlight.
     ground (Raster Layer):
         The raster ground surface that will define the positions where
         sunlight obstruction will be evaluated.
     cell_size {Linear Unit}:
         The cell size of the output raster.
     start_time {Date}:
         The date and time sun position calculations will begin. The default
         value is the date and time the tool is initialized.
     end_time {Date}:
         The date and time sun position calculations will end. The
         time_interval parameter is used to iteratively evaluate each day from
         the start time to the end time. For this reason, the end time cannot
         be earlier than the start time.
     time_interval {Time Unit}:
         The interval that will be used to calculate sun positions from the
         start date and time to the end date and time.
     time_zone {String}:
         Specifies the time zone that corresponds to the specified input times
         that will be used to determine the relative position of the
         sun.UTC-The time zone will be UTC.Dateline_Standard_Time-The time zone
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
     dst {Boolean}:
         Specifies whether the input times will be adjusted for daylight saving
         time.DST-The input times will be adjusted for daylight saving
         time.NO_DST-The input times will not be adjusted for daylight saving
         time.
         This is the default.
     max_shadow_length {Linear Unit}:
         The maximum distance that a shadow will be cast from an input feature
         during calculation. Consider defining this value when the sun position
         has a low altitude angle, as the resulting shadows will be long and
         potentially add unnecessary processing time.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster whose cell values reflect the number of times the
         corresponding ground height position was obstructed by the input
         features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SunShadowFrequency_3d(
                *gp_fixargs(
                    (
                        in_features,
                        ground,
                        out_raster,
                        cell_size,
                        start_time,
                        end_time,
                        time_interval,
                        time_zone,
                        dst,
                        max_shadow_length,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SunShadowVolume_3d", None)
def SunShadowVolume(
    in_features=None,
    start_date_and_time=None,
    out_feature_class=None,
    adjusted_for_dst: Literal["ADJUSTED_FOR_DST", "NOT_ADJUSTED_FOR_DST"] | None = None,
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
    ]
    | None = None,
    end_date_and_time=None,
    iteration_interval=None,
    iteration_unit: Literal["DAYS", "HOURS", "MINUTES"] | None = None,
) -> Result1[str]:
    """SunShadowVolume(in_features;in_features..., start_date_and_time, out_feature_class, {adjusted_for_dst}, {time_zone}, {end_date_and_time}, {iteration_interval}, {iteration_unit})

       Creates closed volumes that model shadows cast by each feature using
       sunlight for a given date and time.

    INPUTS:
     in_features (Feature Layer):
         The multipatch features that will be used to model shadows.
     start_date_and_time (Date):
         The date and time from which sun positions will be determined. Both a
         date and a time must be provided, and only the times when the sun is
         above the horizon will produce an output shadow volume.
     adjusted_for_dst {Boolean}:
         Specifies whether the time value will be adjusted for daylight saving
         time (DST).ADJUSTED_FOR_DST-The time value will be adjusted for
         DST.NOT_ADJUSTED_FOR_DST-The time value will not be adjusted for DST.
         This
         is the default.
     time_zone {String}:
         The time zone in which the participating input is located. The default
         setting is the time zone to which the operating system is set.UTC-The
         time zone will be UTC.Dateline_Standard_Time-The time zone
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
     end_date_and_time {Date}:
         The final date and time that will be used for calculating sun
         position. A time can be specified without a date, in which case the
         end date will be the same as the start date. If a date is provided, a
         time must also be given. Only the times at which the sun is above the
         horizon will produce an output shadow volume.
     iteration_interval {Double}:
         The value that will be used to define the iteration of time from the
         start date.
     iteration_unit {String}:
         Specifies the unit that will define the iteration value applied to the
         start_date_and_time parameter value.DAYS-The iteration value will
         represent days. This is the
         default.HOURS-The iteration value will represent one or more
         hours.MINUTES-The iteration value will represent one or more minutes.

    OUTPUTS:
     out_feature_class (Feature Class):
         The multipatch feature class that will store the resulting shadow
         volumes."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SunShadowVolume_3d(
                *gp_fixargs(
                    (
                        in_features,
                        start_date_and_time,
                        out_feature_class,
                        adjusted_for_dst,
                        time_zone,
                        end_date_and_time,
                        iteration_interval,
                        iteration_unit,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Viewshed_3d", None)
def Viewshed(
    in_raster=None,
    in_observer_features=None,
    out_raster=None,
    z_factor=None,
    curvature_correction: Literal["FLAT_EARTH", "CURVED_EARTH"] | None = None,
    refractivity_coefficient=None,
    out_agl_raster=None,
) -> Result2[str, str]:
    """Viewshed(in_raster, in_observer_features, out_raster, {z_factor}, {curvature_correction}, {refractivity_coefficient}, {out_agl_raster})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Viewshed_3d(
                *gp_fixargs(
                    (
                        in_raster,
                        in_observer_features,
                        out_raster,
                        z_factor,
                        curvature_correction,
                        refractivity_coefficient,
                        out_agl_raster,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Viewshed2_3d", None)
def Viewshed2(
    in_raster=None,
    in_observer_features=None,
    out_raster=None,
    out_agl_raster=None,
    analysis_type: Literal["FREQUENCY", "OBSERVERS"] | None = None,
    vertical_error=None,
    out_observer_region_relationship_table=None,
    refractivity_coefficient=None,
    surface_offset=None,
    observer_elevation=None,
    observer_offset=None,
    inner_radius=None,
    inner_radius_is_3d: Literal["3D", "GROUND"] | None = None,
    outer_radius=None,
    outer_radius_is_3d: Literal["3D", "GROUND"] | None = None,
    horizontal_start_angle=None,
    horizontal_end_angle=None,
    vertical_upper_angle=None,
    vertical_lower_angle=None,
    analysis_method: Literal["ALL_SIGHTLINES", "PERIMETER_SIGHTLINES"] | None = None,
    analysis_target_device: Literal["GPU_THEN_CPU", "GPU_ONLY", "CPU_ONLY"] | None = None,
) -> Result3[str, str, str]:
    """Viewshed2(in_raster, in_observer_features, out_raster, {out_agl_raster}, {analysis_type}, {vertical_error}, {out_observer_region_relationship_table}, {refractivity_coefficient}, {surface_offset}, {observer_elevation}, {observer_offset}, {inner_radius}, {inner_radius_is_3d}, {outer_radius}, {outer_radius_is_3d}, {horizontal_start_angle}, {horizontal_end_angle}, {vertical_upper_angle}, {vertical_lower_angle}, {analysis_method}, {analysis_target_device})

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
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Viewshed2_3d(
                *gp_fixargs(
                    (
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
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Visibility_3d", None)
def Visibility(
    in_raster=None,
    in_observer_features=None,
    out_raster=None,
    out_agl_raster=None,
    analysis_type: Literal["FREQUENCY", "OBSERVERS"] | None = None,
    nonvisible_cell_value: Literal["ZERO", "NODATA"] | None = None,
    z_factor=None,
    curvature_correction: Literal["FLAT_EARTH", "CURVED_EARTH"] | None = None,
    refractivity_coefficient=None,
    surface_offset=None,
    observer_elevation=None,
    observer_offset=None,
    inner_radius=None,
    outer_radius=None,
    horizontal_start_angle=None,
    horizontal_end_angle=None,
    vertical_upper_angle=None,
    vertical_lower_angle=None,
) -> Result2[str, str]:
    """Visibility(in_raster, in_observer_features, out_raster, {out_agl_raster}, {analysis_type}, {nonvisible_cell_value}, {z_factor}, {curvature_correction}, {refractivity_coefficient}, {surface_offset}, {observer_elevation}, {observer_offset}, {inner_radius}, {outer_radius}, {horizontal_start_angle}, {horizontal_end_angle}, {vertical_upper_angle}, {vertical_lower_angle})

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
         (the observers type option).
     out_agl_raster {Raster Dataset}:
         The output above-ground-level (AGL) raster.The AGL result is a raster
         where each cell value is the minimum height
         that must be added to an otherwise nonvisible cell to make it visible
         by at least one observer.Cells that were already visible will have a
         value of 0 in this output
         raster."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Visibility_3d(
                *gp_fixargs(
                    (
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
