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
r"""The tools in the Cartography toolbox are designed to produce and
refine data to support the production of maps. This includes the
creation of masks, the simplification and aggregation of features and
reduction of their density, as well as tools for annotation and the
creation of map series."""
from __future__ import annotations

__all__ = [
    "AggregatePoints",
    "AggregatePolygons",
    "AlignMarkerToStrokeOrFill",
    "AnnotateSelectedFeatures",
    "CalculateAdjacentFields",
    "CalculateCentralMeridianAndParallels",
    "CalculateColorTheoremField",
    "CalculateGridConvergenceAngle",
    "CalculateLineCaps",
    "CalculatePolygonMainAngle",
    "CalculateUTMZone",
    "CollapseDualLinesToCenterline",
    "CollapseHydroPolygon",
    "CollapseRoadDetail",
    "ContourAnnotation",
    "ConvertControlPointsToVertices",
    "ConvertLabelsToAnnotation",
    "ConvertLabelsToGraphics",
    "ConvertMarkerPlacementToPoints",
    "CreateCartographicPartitions",
    "CreateOverpass",
    "CreateUnderpass",
    "CulDeSacMasks",
    "DelineateBuiltUpAreas",
    "DetectGraphicConflict",
    "DisperseMarkers",
    "FeatureOutlineMasks",
    "GenerateHachuresForDefinedSlopes",
    "GridIndexFeatures",
    "IntersectingLayersMasks",
    "MapServerCacheTilingSchemeToPolygons",
    "MergeDividedRoads",
    "PropagateDisplacement",
    "ResolveBuildingConflicts",
    "ResolveRoadConflicts",
    "SetControlPointAtIntersect",
    "SetControlPointByAngle",
    "SimplifyBuilding",
    "SimplifyLine",
    "SimplifyPolygon",
    "SimplifySharedEdges",
    "SmoothLine",
    "SmoothPolygon",
    "SmoothSharedEdges",
    "StripMapIndexFeatures",
    "ThinRoadNetwork",
    "TiledLabelsToAnnotation",
    "UpdateAnnotationReferenceScale",
]
__alias__ = "cartography"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Annotation toolset
@gptooldoc("AnnotateSelectedFeatures_cartography", None)
def AnnotateSelectedFeatures(
    in_map: Literal["Internal_Map"] | None = None,
    in_layer=None,
    anno_layers=None,
    generate_unplaced: Literal["GENERATE_UNPLACED", "ONLY_PLACED"] | None = None,
) -> Result1[str | Layer]:
    """AnnotateSelectedFeatures_cartography(in_map, in_layer, anno_layers;anno_layers..., {generate_unplaced})

       Creates annotation for the selected features of a layer. The labeling
       properties defined in the annotation class properties of the specified
       related annotation feature classes are used.

    INPUTS:
     in_map (Map):
         The input map.
     in_layer (Feature Layer):
         The layer for which the selected features will have annotation
         created.
     anno_layers (Value Table):
         The feature-linked annotation layers and the specified sublayers that
         will have annotation converted into them.
     generate_unplaced {Boolean}:
         Specifies whether to create unplaced annotation from unplaced
         labels.ONLY_PLACED-Annotation will only be created for features that
         are
         currently labeled. This is the default.GENERATE_UNPLACED-Unplaced
         annotation are stored in the annotation
         feature class. The status field for these annotation is set to
         Unplaced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AnnotateSelectedFeatures_cartography(
                *gp_fixargs((in_map, in_layer, anno_layers, generate_unplaced), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ContourAnnotation_cartography", None)
def ContourAnnotation(
    in_features=None,
    out_geodatabase=None,
    contour_label_field=None,
    reference_scale_value=None,
    out_layer=None,
    contour_color: Literal["BLACK", "BROWN", "BLUE"] | None = None,
    contour_type_field=None,
    contour_alignment: Literal["PAGE", "UPHILL", "DOWNHILL"] | None = None,
    enable_laddering: Literal["ENABLE_LADDERING", "NOT_ENABLE_LADDERING"] | None = None,
) -> Result2[str | Layer, str]:
    """ContourAnnotation_cartography(in_features, out_geodatabase, contour_label_field, reference_scale_value, out_layer, contour_color, {contour_type_field}, {contour_alignment}, {enable_laddering})

       Creates annotation for contour features.

    INPUTS:
     in_features (Feature Layer):
         The contour line feature class for which the annotation will be
         created.
     out_geodatabase (Workspace / Feature Dataset):
         The workspace where the output feature classes will be saved. The
         workspace can be an existing geodatabase or an existing feature
         dataset.
     contour_label_field (Field):
         The field in the input layer attribute table on which the annotation
         text will be based.
     reference_scale_value (Double):
         The scale that will be used as a reference for the annotation. This
         sets the scale on which all symbol and text sizes in the annotation
         will be based.
     contour_color (String):
         Specifies the color of the output contour layer and annotation
         features.BLACK-The output contour layer and annotation features will
         be drawn
         in black. This is the default.BROWN-The output contour layer and
         annotation features will be drawn
         in brown.BLUE-The output contour layer and annotation features will be
         drawn in
         blue.
     contour_type_field {Field}:
         The field in the input layer attribute table containing a value for
         the type of contour feature. An annotation class will be created for
         each type value.
     contour_alignment {String}:
         Specifies how the annotation will be aligned to contour elevations.
         The annotation can be aligned to the contour elevations so that the
         top of the text is always placed uphill or downhill. These options
         allow the annotation to be placed upside down. The contour annotation
         can also be aligned to the page, ensuring that the text is never
         placed upside down.PAGE-The annotation will be aligned to the page,
         ensuring that the
         text is never placed upside down. This is the default.UPHILL-The
         annotation will be aligned to the contour elevations so
         that the top of the text is always placed uphill. This option allows
         the annotation to be placed upside down.DOWNHILL-The annotation will
         be aligned to the contour elevations so
         that the top of the text is always placed downhill. This option allows
         the annotation to be placed upside down.
     enable_laddering {Boolean}:
         Specifies whether annotation will be placed in ladders. Placing
         annotation in ladders will place the text so it appears to step up and
         step down the contours in a straight path. These ladders will run from
         the top of a hill to the bottom, will not cross each other, will
         belong to a single slope, and will not cross any other
         slope.ENABLE_LADDERING-Annotation will step up and down the contours
         in a
         straight path.NOT_ENABLE_LADDERING-Annotation will not be placed up
         and down the
         contours in a straight path. This is the default.

    OUTPUTS:
     out_layer (Group Layer):
         The group layer that will contain the contour layer, the
         annotation, and the mask layer. When working in thepane, you can use
         the Save To Layer File tool to write the output group layer to a layer
         file. When using ArcGIS Pro, the tool adds the group layer to the
         display if theoption is checked on thetab on thedialog box. The group
         layer that is created is temporary and will not persist after the
         session ends unless the document is saved. CatalogAdd output
         datasets to an open mapGeoprocessingOptions"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ContourAnnotation_cartography(
                *gp_fixargs(
                    (
                        in_features,
                        out_geodatabase,
                        contour_label_field,
                        reference_scale_value,
                        out_layer,
                        contour_color,
                        contour_type_field,
                        contour_alignment,
                        enable_laddering,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ConvertLabelsToAnnotation_cartography", None)
def ConvertLabelsToAnnotation(
    input_map: Literal["Internal_Map"] | None = None,
    conversion_scale=None,
    output_geodatabase=None,
    anno_suffix=None,
    extent=None,
    generate_unplaced: Literal["GENERATE_UNPLACED", "ONLY_PLACED"] | None = None,
    require_symbol_id: Literal["REQUIRE_ID", "NO_REQUIRE_ID"] | None = None,
    feature_linked: Literal["FEATURE_LINKED", "STANDARD"] | None = None,
    auto_create: Literal["AUTO_CREATE", "NO_AUTO_CREATE"] | None = None,
    update_on_shape_change: Literal["SHAPE_UPDATE", "NO_SHAPE_UPDATE"] | None = None,
    output_group_layer=None,
    which_layers: Literal["ALL_LAYERS", "SINGLE_LAYER"] | None = None,
    single_layer=None,
    multiple_feature_classes: Literal["SINGLE_FEATURE_CLASS", "FEATURE_CLASS_PER_FEATURE_LAYER"] | None = None,
    merge_label_classes: Literal["MERGE_LABEL_CLASS", "NO_MERGE_LABEL_CLASS"] | None = None,
) -> Result2[str | Layer, str]:
    """ConvertLabelsToAnnotation_cartography(input_map, conversion_scale, output_geodatabase, {anno_suffix}, {extent}, {generate_unplaced}, {require_symbol_id}, {feature_linked}, {auto_create}, {update_on_shape_change}, {output_group_layer}, {which_layers}, {single_layer}, {multiple_feature_classes}, {merge_label_classes})

       Converts labels to annotation for a single layer or the entire map.
       Both standard annotation and feature-linked annotation can be created.

    INPUTS:
     input_map (Map):
         The input map.
     conversion_scale (Double):
         The scale at which labels will be converted. If a reference scale is
         set on the map, the reference scale will be used for symbol sizing and
         annotation feature class creation, but conversion will occur at this
         scale.
     output_geodatabase (LocalDatabase|RemoteDatabase):
         The workspace where the output feature classes will be saved. The
         workspace can be an existing geodatabase or an existing feature
         dataset. If this is not the same database used by all the layers in
         the map, the feature-linked option will be disabled.
     anno_suffix {String}:
         The suffix that will be added to each new annotation feature class.
         This suffix will be appended to the name of the source feature class
         for each new annotation feature class.
     extent {Extent}:
         Specifies the extent that contains the labels to convert to
         annotation.MAXOF-The maximum extent of all inputs will be
         used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.If no extent value is set, the extent will be
         based on the maximum
         extent of all participating inputs. This is the default.
     generate_unplaced {Boolean}:
         Specifies whether unplaced annotation will be created from unplaced
         labels.ONLY_PLACED-Annotation will only be created for features that
         are
         currently labeled. This is the default.GENERATE_UNPLACED-Unplaced
         annotation will be stored in the annotation
         feature class. The status field for this annotation is set to
         Unplaced.
     require_symbol_id {Boolean}:
         Specifies whether all text symbol properties can be
         edited.NO_REQUIRE_ID-All text symbol properties can be edited. This is
         the
         default.REQUIRE_ID-Only symbol properties that enable annotation
         features can
         be edited to maintain reference to their associated text symbol in the
         collection.
     feature_linked {Boolean}:
         Specifies whether the output annotation feature class will be linked
         to the features in another feature class.STANDARD-The output
         annotation feature class will not be linked to the
         features in another feature class. This is the
         default.FEATURE_LINKED-The output annotation feature class will be
         linked to
         the features in another feature class.
     auto_create {Boolean}:
         Specifies whether annotation will be created when new features are
         added to the linked feature class and the feature_linked parameter is
         set to FEATURE_LINKED.AUTO_CREATE-Feature-linked annotation will be
         created when new
         features are added to the linked feature class. This is the
         default.NO_AUTO_CREATE-Feature-linked annotation will not be created
         when new
         features are added to the linked feature class.
     update_on_shape_change {Boolean}:
         Specifies whether the position of annotation will be updated when the
         shape of the linked feature is modified and the feature_linked
         parameter is set to FEATURE_LINKED.SHAPE_UPDATE-The position of the
         annotation will be updated when the
         shape of the linked feature is modified. This is the
         default.NO_SHAPE_UPDATE-The position of the annotation will not be
         updated
         when the shape of the linked feature is modified.
     which_layers {String}:
         Specifies whether annotation will be converted for all layers in the
         map or for a single layer. The single layer must be
         specified.ALL_LAYERS-Labels will be converted to annotation for all
         layers in
         the map. This is the default.SINGLE_LAYER-Labels will be converted to
         annotation for a single
         layer. The layer must be specified.
     single_layer {Feature Layer}:
         The layer with the annotation that will be converted when the
         which_layers parameter is set to SINGLE_LAYER. This layer must be in
         the map.
     multiple_feature_classes {Boolean}:
         Specifies whether labels will be converted to individual annotation
         feature classes or to a single annotation feature class. If converting
         to a single annotation feature class, the annotation cannot be
         feature-linked.SINGLE_FEATURE_CLASS-Labels from all layers will be
         converted to a
         single annotation feature class.FEATURE_CLASS_PER_FEATURE_LAYER-Labels
         will be converted to individual
         annotation feature classes that correspond to their layers. This is
         the default.
     merge_label_classes {Boolean}:
         Specifies whether similar label classes will be merged when the
         multiple_feature_classes parameter is set to
         SINGLE_FEATURE_CLASS.MERGE_LABEL_CLASS-Label classes with similar
         properties will be merged
         when converting to a single feature class.NO_MERGE_LABEL_CLASS-Label
         classes with similar properties will not be
         merged. This is the default.

    OUTPUTS:
     output_group_layer {Group Layer}:
         The group layer that will contain the generated annotation. You can
         use the Save To Layer File tool to write the output group layer to a
         layer file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConvertLabelsToAnnotation_cartography(
                *gp_fixargs(
                    (
                        input_map,
                        conversion_scale,
                        output_geodatabase,
                        anno_suffix,
                        extent,
                        generate_unplaced,
                        require_symbol_id,
                        feature_linked,
                        auto_create,
                        update_on_shape_change,
                        output_group_layer,
                        which_layers,
                        single_layer,
                        multiple_feature_classes,
                        merge_label_classes,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ConvertLabelsToGraphics_cartography", None)
def ConvertLabelsToGraphics(
    input_map: Literal["Internal_Map"] | None = None,
    conversion_scale=None,
    which_layers: Literal["ALL_LAYERS", "SINGLE_LAYER"] | None = None,
    single_layer=None,
    graphics_suffix=None,
    extent=None,
    multiple_graphics_layers: Literal["SINGLE_GRAPHICS_LAYER", "GRAPHICS_LAYER_PER_FEATURE_LAYER"] | None = None,
    generate_unplaced: Literal["GENERATE_UNPLACED", "ONLY_PLACED"] | None = None,
    output_group_layer=None,
) -> Result1[str | Layer]:
    """ConvertLabelsToGraphics_cartography(input_map, conversion_scale, {which_layers}, {single_layer}, {graphics_suffix}, {extent}, {multiple_graphics_layers}, {generate_unplaced}, {output_group_layer})

       Converts labels to graphics for a single layer or an entire map.

    INPUTS:
     input_map (Map):
         The input map object.
     conversion_scale (Double):
         The scale at which to convert labels. If a reference scale is set on
         the map, the reference scale will be used for symbol sizing and
         graphics layer creation, but conversion will happen at this scale.
     which_layers {String}:
         Specifies whether to convert graphics for all layers in the map or for
         a single layer.ALL_LAYERS-Labels will be converted to graphics for all
         layers in the
         map. This is the default.SINGLE_LAYER-Labels will be converted to
         graphics for a single layer.
         The layer must be specified with the single_layer parameter.
     single_layer {Feature Layer}:
         The layer with the labels to convert when the which_layers parameter
         is set to SINGLE_LAYER. This layer must be in the map.
     graphics_suffix {String}:
         The suffix that will be added to each new graphics layer. This suffix
         will be appended to the name of the source feature class for each new
         graphics layer.
     extent {Extent}:
         Specifies the extent that contains the labels to convert to
         graphics.MAXOF-The maximum extent of all inputs will be used.MINOF-The
         minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     multiple_graphics_layers {Boolean}:
         Specifies whether labels will be converted to individual graphics
         layers or to a single graphics layer.SINGLE_GRAPHICS_LAYER-Labels from
         all layers will be converted to a
         single graphics layer.GRAPHICS_LAYER_PER_FEATURE_LAYER-Labels will be
         converted to
         individual graphics layers that correspond to their layers. This is
         the default.
     generate_unplaced {Boolean}:
         Specifies whether graphics will be created from unplaced
         labels.ONLY_PLACED-Graphics will only be created for features that are
         currently labeled. This is the default.GENERATE_UNPLACED-Unplaced
         graphics are stored in the graphics layer
         with their visibility is turned off.

    OUTPUTS:
     output_group_layer {Group Layer}:
         The group layer that will contain the generated graphics. You can use
         the Save To Layer File tool to write the output group layer to a layer
         file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConvertLabelsToGraphics_cartography(
                *gp_fixargs(
                    (
                        input_map,
                        conversion_scale,
                        which_layers,
                        single_layer,
                        graphics_suffix,
                        extent,
                        multiple_graphics_layers,
                        generate_unplaced,
                        output_group_layer,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MapServerCacheTilingSchemeToPolygons_cartography", None)
def MapServerCacheTilingSchemeToPolygons(
    input_map: Literal["Internal_Map"] | None = None,
    tiling_scheme=None,
    output_feature_class=None,
    use_map_extent: Literal["USE_MAP_EXTENT", "FULL_TILING_SCHEME"] | None = None,
    clip_to_horizon: Literal["CLIP_TO_HORIZON", "UNIFORM_TILE_SIZE"] | None = None,
    antialiasing: Literal["ANTIALIASING", "NONE"] | None = None,
    levels=None,
) -> Result1[str]:
    """MapServerCacheTilingSchemeToPolygons_cartography(input_map, tiling_scheme, output_feature_class, use_map_extent, clip_to_horizon, {antialiasing}, {levels;levels...})

       Creates a polygon feature class from an existing tiling scheme.

    INPUTS:
     input_map (Map):
         The current map with the extent that will be used.
     tiling_scheme (File):
         A predefined tiling scheme .xml file.
     use_map_extent (Boolean):
         Specifies whether polygon features will be created for the entire
         extent of the tiling scheme or only those tiles that intersect the
         full extent of the map.USE_MAP_EXTENT-Polygon features will be created
         for the full extent of
         the map. This is the default.FULL_TILING_SCHEME-Polygon features will
         be created for the full
         extent of the tiling scheme.
     clip_to_horizon (Boolean):
         Specifies whether polygons will be constrained to the valid area of
         use for the geographic or projected coordinate system of the
         map.CLIP_TO_HORIZON-Polygon features will only be created within the
         valid
         area of use for the geographic or projected coordinate system of the
         map. Tiles that are within the extent of the tiling scheme but outside
         the extent of the coordinate system horizon will be clipped. This is
         the default.UNIFORM_TILE_SIZE-Polygon features will be created for the
         full extent
         of the tiling scheme. Within each scale level, polygons will be of a
         uniform size and will not be clipped at the coordinate system horizon.
         This may create data that is outside the valid area of use for the
         geographic or projected coordinate system. If a scale within the
         tiling scheme would generate a tile that is larger than the spatial
         domain of the feature class, null geometry will be created for that
         feature.
     antialiasing {Boolean}:
         Specifies whether polygons that match map service caches with
         antialiasing enabled will be generated. A map service cache supertile
         is 2048 x 2048 pixels with antialiasing or 4096 x 4096 pixels without.
         To determine whether antialiasing was used in an existing cache, open
         the tiling scheme file (conf.xml) and see if the <Antialiasing> tag is
         set to true.ANTIALIASING-Polygon tiles will be generated to match the
         supertile
         extent of a map service cache with antialiasing enabled.NONE-Polygon
         tiles will be generated to match the supertile extent of
         a map service cache without antialiasing enabled. This is the default.
     levels {Double}:
         The scale levels at which polygons will be created. To create polygons
         for all scale levels included in a tiling scheme, leave this parameter
         blank. You can create polygons for some or all of the scale levels
         that are included in the tiling scheme. To add more scale levels,
         however, you must modify the tiling scheme file or create a new one.

    OUTPUTS:
     output_feature_class (Feature Class):
         The output polygon feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MapServerCacheTilingSchemeToPolygons_cartography(
                *gp_fixargs(
                    (
                        input_map,
                        tiling_scheme,
                        output_feature_class,
                        use_map_extent,
                        clip_to_horizon,
                        antialiasing,
                        levels,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TiledLabelsToAnnotation_cartography", None)
def TiledLabelsToAnnotation(
    input_map: Literal["Internal_Map"] | None = None,
    polygon_index_layer=None,
    out_geodatabase=None,
    out_layer=None,
    anno_suffix=None,
    reference_scale_value=None,
    reference_scale_field=None,
    tile_id_field=None,
    coordinate_sys_field=None,
    map_rotation_field=None,
    feature_linked: Literal["FEATURE_LINKED", "STANDARD"] | None = None,
    generate_unplaced_annotation: Literal["GENERATE_UNPLACED_ANNOTATION", "NOT_GENERATE_UNPLACED_ANNOTATION"]
    | None = None,
    which_layers: Literal["ALL_LAYERS", "SINGLE_LAYER"] | None = None,
    single_layer=None,
    require_symbol_id: Literal["REQUIRE_ID", "NO_REQUIRE_ID"] | None = None,
    auto_create: Literal["AUTO_CREATE", "NO_AUTO_CREATE"] | None = None,
    update_on_shape_change: Literal["SHAPE_UPDATE", "NO_SHAPE_UPDATE"] | None = None,
    multiple_feature_classes: Literal["SINGLE_FEATURE_CLASS", "FEATURE_CLASS_PER_FEATURE_LAYER"] | None = None,
    merge_label_classes: Literal["MERGE_LABEL_CLASS", "NO_MERGE_LABEL_CLASS"] | None = None,
) -> Result2[str | Layer, str]:
    """TiledLabelsToAnnotation_cartography(input_map, polygon_index_layer, out_geodatabase, out_layer, anno_suffix, {reference_scale_value}, {reference_scale_field}, {tile_id_field}, {coordinate_sys_field}, {map_rotation_field}, {feature_linked}, {generate_unplaced_annotation}, {which_layers}, {single_layer}, {require_symbol_id}, {auto_create}, {update_on_shape_change}, {multiple_feature_classes}, {merge_label_classes})

       Converts labels to annotation for layers in a map based on a polygon
       index layer.

    INPUTS:
     input_map (Map):
         The map that contains the labels to convert to annotation.
     polygon_index_layer (Table View):
         The polygon layer that contains tile features.
     out_geodatabase (Workspace / Feature Dataset):
         The workspace where the output feature classes will be saved. The
         workspace can be an existing geodatabase or an existing feature
         dataset.
     anno_suffix (String):
         The suffix that will be added to each new annotation feature class.
         This suffix will be appended to the name of the source feature class
         for each new annotation feature class. The reference scale for the
         annotation will follow this suffix.
     reference_scale_value {Double}:
         The scale value that will be used as a reference for the annotation.
         This is the scale on which all symbol and text sizes in the annotation
         will be based.
     reference_scale_field {Field}:
         The field in the polygon index layer that will determine the reference
         scale of the annotation. This is the scale on which all symbol and
         text sizes in the annotation will be based.
     tile_id_field {Field}:
         A field in the polygon index layer that uniquely identifies
         the tiled area. These values will populate thefield in the annotation
         feature class attribute table. TileID
     coordinate_sys_field {Field}:
         A field in the polygon index layer that contains the coordinate system
         information for each tile. Due to the length required for a field to
         store coordinate system information, a polygon index layer that
         contains a coordinate system field must be a geodatabase feature
         class.
     map_rotation_field {Field}:
         A field in the polygon index layer that contains the angle by which
         the map will be rotated.
     feature_linked {Boolean}:
         Specifies whether the output annotation feature class will be linked
         to the features in another feature class.STANDARD-The output
         annotation feature class will not be linked to
         the features in another feature class. This is the
         default.FEATURE_LINKED-The output annotation feature class will be
         linked to
         the features in another feature class.
     generate_unplaced_annotation {Boolean}:
         Specifies whether unplaced annotation will be created from unplaced
         labels.NOT_GENERATE_UNPLACED_ANNOTATION-Annotation will only be
         created for
         features that are currently labeled. This is the
         default.GENERATE_UNPLACED_ANNOTATION-Unplaced annotation will be
         stored in the
         annotation feature class. The status field for this annotation is set
         to Unplaced.
     which_layers {String}:
         Specifies whether annotation will be converted for all layers in the
         map or for a single layer. The single layer must be
         specified.ALL_LAYERS-Labels will be converted to annotation for all
         layers in
         the map. This is the default.SINGLE_LAYER-Labels will be converted to
         annotation for a single
         layer. The layer must be specified.
     single_layer {Feature Layer}:
         The layer with the annotation that will be converted when the
         which_layers parameter is set to SINGLE_LAYER. This layer must be in
         the map.
     require_symbol_id {Boolean}:
         Specifies whether all text symbol properties can be
         edited.NO_REQUIRE_ID-All text symbol properties can be edited. This is
         the
         default.REQUIRE_ID-Only symbol properties that enable annotation
         features can
         be edited to maintain reference to their associated text symbol in the
         collection.
     auto_create {Boolean}:
         Specifies whether annotation will be created when new features are
         added to the linked feature class if the feature_linked parameter is
         set to FEATURE_LINKED.AUTO_CREATE-Feature-linked annotation will be
         created when new
         features are added to the linked feature class. This is the
         default.NO_AUTO_CREATE-Feature-linked annotation will not be created
         when new
         features are added to the linked feature class.
     update_on_shape_change {Boolean}:
         Specifies whether the position of annotation will be updated when the
         shape of the linked feature is modified if the feature_linked
         parameter is set to FEATURE_LINKED.SHAPE_UPDATE-The position of the
         annotation will be updated when the
         shape of the linked feature is modified. This is the
         default.NO_SHAPE_UPDATE-The position of the annotation will not be
         updated
         when the shape of the linked feature is modified.
     multiple_feature_classes {Boolean}:
         Specifies whether labels will be converted to individual annotation
         feature classes or to a single annotation feature class. If converting
         to a single annotation feature class, the annotation cannot be
         feature-linked.SINGLE_FEATURE_CLASS-Labels from all layers will be
         converted to a
         single annotation feature class.FEATURE_CLASS_PER_FEATURE_LAYER-Labels
         will be converted to individual
         annotation feature classes that correspond to their layers. This is
         the default.
     merge_label_classes {Boolean}:
         Specifies whether similar label classes will be merged if the
         multiple_feature_classes parameter is set to
         SINGLE_FEATURE_CLASS.MERGE_LABEL_CLASS-Label classes with similar
         properties will be merged
         when converting to a single feature class.NO_MERGE_LABEL_CLASS-Label
         classes with similar properties will not be
         merged. This is the default.

    OUTPUTS:
     out_layer (Group Layer):
         The group layer that will contain the generated annotation. You can
         use the Save To Layer File tool to write the output group layer to a
         layer file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TiledLabelsToAnnotation_cartography(
                *gp_fixargs(
                    (
                        input_map,
                        polygon_index_layer,
                        out_geodatabase,
                        out_layer,
                        anno_suffix,
                        reference_scale_value,
                        reference_scale_field,
                        tile_id_field,
                        coordinate_sys_field,
                        map_rotation_field,
                        feature_linked,
                        generate_unplaced_annotation,
                        which_layers,
                        single_layer,
                        require_symbol_id,
                        auto_create,
                        update_on_shape_change,
                        multiple_feature_classes,
                        merge_label_classes,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateAnnotationReferenceScale_cartography", None)
def UpdateAnnotationReferenceScale(
    in_anno_features=None,
    reference_scale=None,
) -> Result1[str | Layer]:
    """UpdateAnnotationReferenceScale_cartography(in_anno_features, reference_scale)

       Updates the reference scale of an existing annotation or dimension
       feature class.

    INPUTS:
     in_anno_features (Annotation Layer / Dimension Layer):
         The input annotation or dimension features.
     reference_scale (Double):
         The feature class reference scale that will be updated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpdateAnnotationReferenceScale_cartography(*gp_fixargs((in_anno_features, reference_scale), True))
        )
        return retval
    except Exception as e:
        raise e


# Cartographic Refinement toolset
@gptooldoc("AlignMarkerToStrokeOrFill_cartography", None)
def AlignMarkerToStrokeOrFill(
    in_point_features=None,
    in_line_or_polygon_features=None,
    search_distance=None,
    marker_orientation: Literal["PERPENDICULAR", "PARALLEL"] | None = None,
) -> Result1[str | Layer]:
    """AlignMarkerToStrokeOrFill_cartography(in_point_features, in_line_or_polygon_features, search_distance, {marker_orientation})

       Aligns the marker symbol layers of a point feature class to the
       nearest stroke or fill symbol layers in a line or polygon feature
       class within a specified search distance.

    INPUTS:
     in_point_features (Layer):
         The input point feature layer containing point symbols to be
         aligned to nearby lines or polygons. Symbols are aligned by storing an
         angle in the attribute connected to the angle property of the marker
         symbol layer. This must be connected to a single field with no
         expression applied. If multiple marker symbol layers in the same point
         symbol have theproperty connected to the same field, thesetting must
         match in each of those marker layers. AngleRotate clockwise
     in_line_or_polygon_features (Layer):
         The input line or polygon feature layer to which the input point
         symbols will be aligned.
     search_distance (Linear Unit):
         The search distance from graphical marker edge to graphical stroke or
         fill edge. A distance greater than or equal to zero must be specified.
     marker_orientation {String}:
         Specifies how the marker symbol layer will be oriented relative to the
         stroke or fill symbol layer's edge.PERPENDICULAR-Marker symbol layers
         will be aligned perpendicularly to
         the stroke or fill edge. This is the default.PARALLEL-Marker symbol
         layers will be aligned parallel to the stroke
         or fill edge."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AlignMarkerToStrokeOrFill_cartography(
                *gp_fixargs((in_point_features, in_line_or_polygon_features, search_distance, marker_orientation), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateColorTheoremField_cartography", None)
def CalculateColorTheoremField(
    in_features=None,
    field_name=None,
) -> Result1[str | Layer]:
    """CalculateColorTheoremField_cartography(in_features, field_name)

       Populates an integer field to use for symbolizing polygons with a
       small number of colors and ensuring no two adjacent polygons are the
       same color.

    INPUTS:
     in_features (Feature Layer):
         The input polygons that will use the tool results to symbolize
         features.
     field_name (Field):
         The field that will store the tool results. Each feature will be
         assigned an integer between 1 and the number of unique values created
         to ensure no two adjacent polygons have the same value.If the field
         does not exist, it will be created with the short integer
         data type. If an existing field is specified, it must be of short,
         long, or big integer data type. Existing values will be overwritten
         with the tool results."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateColorTheoremField_cartography(*gp_fixargs((in_features, field_name), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateLineCaps_cartography", None)
def CalculateLineCaps(
    in_features=None,
    cap_type: Literal["BUTT", "SQUARE"] | None = None,
    dangle_option: Literal["CASED_LINE_DANGLE", "TRUE_DANGLE"] | None = None,
) -> Result1[str | Layer]:
    """CalculateLineCaps_cartography(in_features, {cap_type}, {dangle_option})

       Modifies the cap type for stroke symbol layers in the line symbols of
       the input layer.

    INPUTS:
     in_features (Layer):
         The input feature layer containing line symbols. Stroke symbol
         layers must have theproperty connected to a single attribute field
         with no expression applied. The values in this field are updated by
         this tool. Cap Type
     cap_type {String}:
         Specifies how the ends of stroke symbol layers will be drawn. The
         default cap type of strokes is round; the symbol is terminated with a
         semicircle of radius equal to stroke width centered at the line
         endpoint.BUTT-The stroke symbol will end exactly where the line
         geometry ends.
         This is the default.SQUARE-The stroke symbol will end with closed,
         square caps that extend
         past the endpoint of the line by half the symbol width.
     dangle_option {String}:
         Specifies how line caps will be calculated for adjoining line features
         that share an endpoint but are drawn with different
         symbology.CASED_LINE_DANGLE-The cap style will be modified for
         dangling lines
         (those not connected at their endpoints to another line), as well as
         for lines where a cased-line symbol is joined at the endpoint of a
         single-stroke layer line symbol. This is the default.TRUE_DANGLE-The
         cap style will be modified only for endpoints that are
         not connected to another feature."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateLineCaps_cartography(*gp_fixargs((in_features, cap_type, dangle_option), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculatePolygonMainAngle_cartography", None)
def CalculatePolygonMainAngle(
    in_features=None,
    angle_field=None,
    rotation_method: Literal["GEOGRAPHIC", "ARITHMETIC", "GRAPHIC"] | None = None,
) -> Result1[str | Layer]:
    """CalculatePolygonMainAngle_cartography(in_features, angle_field, {rotation_method})

       Calculates the dominant angles of input polygon features and assigns
       the values to a field to use to orient symbology such as markers or
       hatch lines within the polygons.

    INPUTS:
     in_features (Feature Layer):
         The input polygon features.
     angle_field (Field):
         The field that will be updated with the polygon main angle values.
     rotation_method {String}:
         Specifies the method and origin point of rotation that will be
         used..GEOGRAPHIC-The angle will be calculated clockwise with 0 at the
         top
         (north).ARITHMETIC-The angle will be calculated counterclockwise with
         0 at the
         right (east).GRAPHIC-The angle will be calculated counterclockwise
         with 0 at the
         top (north). This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculatePolygonMainAngle_cartography(*gp_fixargs((in_features, angle_field, rotation_method), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ConvertControlPointsToVertices_cartography", None)
def ConvertControlPointsToVertices(
    in_features=None,
) -> Result1[str | Layer]:
    """ConvertControlPointsToVertices_cartography(in_features)

       Converts control points in a line or polygon feature layer to
       vertices.

    INPUTS:
     in_features (Feature Layer):
         The line or polygon input features containing control point geometry
         that will be converted to vertices."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConvertControlPointsToVertices_cartography(*gp_fixargs((in_features,), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ConvertMarkerPlacementToPoints_cartography", None)
def ConvertMarkerPlacementToPoints(
    in_layer=None,
    out_feature_class=None,
    create_multipoints: Literal["CREATE_MULTIPOINTS", "CREATE_POINTS"] | None = None,
    boundary_option: Literal["MAY_CROSS_BOUNDARY", "FIXED_DISTANCE", "VALUE_FROM_FIELD"] | None = None,
    boundary_distance=None,
    boundary_distance_field=None,
    boundary_distance_unit: Literal[
        "Kilometers",
        "Meters",
        "Decimeters",
        "Centimeters",
        "Millimeters",
        "Nautical Miles",
        "Statute Miles",
        "Yards",
        "Feet",
        "Inches",
        "Degrees",
        "Points",
    ]
    | None = None,
    in_barriers=None,
    keep_at_least_one_marker: Literal["KEEP_AT_LEAST_ONE_MARKER", "DO_NOT_KEEP_AT_LEAST_ONE_MARKER"] | None = None,
    displacement_method: Literal["DO_NOT_DISPLACE", "DISPLACE_TOWARD_GRID", "DISPLACE_APART"] | None = None,
    minimum_marker_distance=None,
) -> Result1[str]:
    """ConvertMarkerPlacementToPoints_cartography(in_layer, out_feature_class, {create_multipoints}, {boundary_option}, {boundary_distance}, {boundary_distance_field}, {boundary_distance_unit}, {in_barriers;in_barriers...}, {keep_at_least_one_marker}, {displacement_method}, {minimum_marker_distance})

       Creates points from the markers of a marker placement in a symbolized
       polygon feature.

    INPUTS:
     in_layer (Layer):
         A polygon layer symbolized with a marker placement.
     create_multipoints {Boolean}:
         Specifies whether output point features will be
         multipoint.CREATE_MULTIPOINTS-A multipoint feature will be created for
         the
         markers in each input polygon. This is the default.CREATE_POINTS-A
         point feature will be created for each marker.
     boundary_option {String}:
         Specifies whether output points will be created for input markers that
         cross polygon boundaries.MAY_CROSS_BOUNDARY-Output points will be
         created for input markers
         that cross polygon boundaries. This is the
         default.FIXED_DISTANCE-Output points will not be created for input
         markers
         that are within the distance of polygon boundaries specified by the
         boundary_distance parameter.VALUE_FROM_FIELD-Output points will not be
         created for input markers
         that are within the distance of polygon boundaries specified by the
         boundary_distance_field parameter.
     boundary_distance {Double}:
         The minimum distance between the output point symbols and the polygon
         boundaries. This parameter is applied only when the boundary_option
         parameter is set to FIXED_DISTANCE. The default value is 0.
     boundary_distance_field {Field}:
         A numeric field from the input polygons that will be used to determine
         the boundary distance .This parameter is applied only when the
         boundary_option parameter is set to VALUE_FROM_FIELD.
     boundary_distance_unit {String}:
         Specifies the linear unit that will be used for boundary distance
         values.Kilometers-The unit will be kilometers.Meters-The unit will be
         meters.Decimeters-The unit will be decimeters.Centimeters-The unit
         will be centimeters.Millimeters-The unit will be millimeters.Nautical
         Miles-The unit will be nautical miles.Statute Miles-The unit will be
         statute miles.Yards-The unit will be yards.Feet-The unit will be
         feet.Inches-The unit will be inches.Degrees-The unit will be
         degreesPoints-The unit will be points. This is the default.
     in_barriers {Value Table}:
         The layers containing points, lines, or polygon features that
         are conflict barriers for input markers. Markers that conflict with
         barriers will not be created. The symbology of the barrier layers will
         be considered. barrier_layer-A layer containing points, lines,
         or polygon
         features.barrier_distance-A numeric value specifying the minimum
         distance
         between markers and the barrier. This will be ignored if the
         barrier_distance_field value is set. The default value is
         0.barrier_distance_field-A numerical field from the barrier layer that
         will be used as the barrier distance. This will override the
         barrier_distance value. The default value is
         <None>.barrier_distance_unit-The linear unit that will be used for
         barrier
         distance values. The default value is Points.
     keep_at_least_one_marker {Boolean}:
         Specifies whether a single marker will be created for input polygons
         when all markers conflict with boundaries or
         barriers.KEEP_AT_LEAST_ONE_MARKER-One marker will be created for input
         polygons
         when all markers conflict with boundaries or
         barriers.DO_NOT_KEEP_AT_LEAST_ONE_MARKER-No markers will be created
         for input
         polygons when all markers conflict with boundaries or barriers. This
         is the default.
     displacement_method {String}:
         Specifies the displacement method that will be used to move markers
         that are too close to each other. This parameter is applied only when
         markers are positioned randomly inside the
         polygons.DO_NOT_DISPLACE-Markers will not be displaced. This is the
         default.DISPLACE_TOWARD_GRID-Conflicting markers will be moved toward
         their
         original regular grid points.DISPLACE_APART-Conflicting markers will
         be moved away from each other.
     minimum_marker_distance {Linear Unit}:
         The minimum distance between individual markers. This parameter is
         applied only when markers are positioned randomly inside the polygons.
         The default value is 0.

    OUTPUTS:
     out_feature_class (Feature Class):
         A point feature class containing points created from markers in the
         input layer's marker placement settings. The points will be added to
         the active map as a layer symbolized with a unique value renderer
         using symbols from the input."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConvertMarkerPlacementToPoints_cartography(
                *gp_fixargs(
                    (
                        in_layer,
                        out_feature_class,
                        create_multipoints,
                        boundary_option,
                        boundary_distance,
                        boundary_distance_field,
                        boundary_distance_unit,
                        in_barriers,
                        keep_at_least_one_marker,
                        displacement_method,
                        minimum_marker_distance,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateOverpass_cartography", None)
def CreateOverpass(
    in_above_features=None,
    in_below_features=None,
    margin_along=None,
    margin_across=None,
    out_overpass_feature_class=None,
    out_mask_relationship_class=None,
    where_clause=None,
    out_decoration_feature_class=None,
    wing_type: Literal["ANGLED", "PARALLEL", "NONE"] | None = None,
    wing_tick_length=None,
) -> Result3[str, str, str]:
    """CreateOverpass_cartography(in_above_features, in_below_features, margin_along, margin_across, out_overpass_feature_class, out_mask_relationship_class, {where_clause}, {out_decoration_feature_class}, {wing_type}, {wing_tick_length})

       Creates bridge parapets and polygon masks at line intersections to
       indicate overpasses.

    INPUTS:
     in_above_features (Layer):
         The input line feature layer containing lines that intersect-and will
         be symbolized as passing above-lines in the in_below_features
         parameter value.
     in_below_features (Layer):
         The input line feature layer containing lines that intersect-and will
         be symbolized as passing below-lines in the in_above_features
         parameter value. These features will be masked by the polygons created
         in the out_overpass_feature_class parameter value.
     margin_along (Linear Unit):
         The length of the mask polygons along the in_above_features parameter,
         which is the distance in page units that the mask will extend beyond
         the width of the stroke symbol of the in_below_features parameter
         value. This parameter value must be greater than or equal to zero.
         Choose a page unit (points, millimeters, and so on) for the margin;
         the default is points.
     margin_across (Linear Unit):
         The width of the mask polygons across the in_above_features parameter
         value, which is the distance in page units that the mask will extend
         beyond the width of the stroke symbol of the in_above_features
         parameter value. This parameter value must be greater than or equal to
         zero. Choose a page unit (points, millimeters, and so on) for the
         margin; the default is points.
     where_clause {SQL Expression}:
         An SQL expression that will be used to select a subset of features
         from the in_above_features parameter valueUse quotation marks for
         field names, for example, "MY_FIELD".See SQL reference for query
         expressions used in ArcGIS for more
         information about SQL syntax.
     wing_type {String}:
         Specifies the wing style that will be used for the parapet
         features.ANGLED-The wing tick of the parapet will be angled between
         the
         in_above_features parameter value and the in_below_features parameter
         value. This is the default.PARALLEL-The wing tick of the overpass wing
         will be parallel to the
         in_below_features parameter value.NONE-No wing ticks will be created
         on the parapets.
     wing_tick_length {Linear Unit}:
         The length of the parapet wings in page units. The length must be
         greater than or equal to zero; the default length is 1. Choose a page
         unit (points, millimeters, and so on) for the length; the default is
         points. This parameter does not apply when the wing_type parameter is
         set to NONE.

    OUTPUTS:
     out_overpass_feature_class (Feature Class):
         The output feature class that will be created to store polygons to
         mask the in_below_features parameter value.
     out_mask_relationship_class (Relationship Class):
         The output relationship class that will be created to store links
         between overpass mask polygons and the lines of the in_below_features
         parameter value.
     out_decoration_feature_class {Feature Class}:
         The output line feature class that will be created to store parapet
         features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateOverpass_cartography(
                *gp_fixargs(
                    (
                        in_above_features,
                        in_below_features,
                        margin_along,
                        margin_across,
                        out_overpass_feature_class,
                        out_mask_relationship_class,
                        where_clause,
                        out_decoration_feature_class,
                        wing_type,
                        wing_tick_length,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateUnderpass_cartography", None)
def CreateUnderpass(
    in_above_features=None,
    in_below_features=None,
    margin_along=None,
    margin_across=None,
    out_underpass_feature_class=None,
    out_mask_relationship_class=None,
    where_clause=None,
    out_decoration_feature_class=None,
    wing_type: Literal["ANGLED", "PARALLEL", "NONE"] | None = None,
    wing_tick_length=None,
) -> Result3[str, str, str]:
    """CreateUnderpass_cartography(in_above_features, in_below_features, margin_along, margin_across, out_underpass_feature_class, out_mask_relationship_class, {where_clause}, {out_decoration_feature_class}, {wing_type}, {wing_tick_length})

       Creates bridge parapets and polygon masks at line intersections to
       indicate underpasses.

    INPUTS:
     in_above_features (Layer):
         The input line feature layer containing lines that intersect-and will
         be symbolized as passing above-lines in the in_below_features
         parameter value.
     in_below_features (Layer):
         The input line feature layer containing lines that intersect-and will
         be symbolized as passing below-lines in the in_above_features
         parameter value. These features will be masked by the polygons created
         in the out_underpass_feature_class parameter value.
     margin_along (Linear Unit):
         The length of the mask polygons along the in_above_features parameter
         value, which is the distance in page units that the mask will extend
         beyond the width of the stroke symbol of the in_below_features
         parameter value. This parameter value must be greater than or equal to
         zero. Choose a page unit (points, millimeters, and so on) for the
         margin; the default is points.
     margin_across (Linear Unit):
         The width of the mask polygons across the in_above_features parameter
         value, which is the distance in page units that the mask will extend
         beyond the width of the stroke symbol of the in_above_features
         parameter value. This parameter value must be greater than or equal to
         zero. Choose a page unit (points, millimeters, and so on) for the
         margin; the default is points.
     where_clause {SQL Expression}:
         An SQL expression used to select a subset of features from the
         in_above_features parameter value.Use quotation marks for field names,
         for example, "MY_FIELD".See SQL reference for query expressions used
         in ArcGIS for more
         information about SQL syntax.
     wing_type {String}:
         Specifies the wing style that will be used for the parapet
         features.ANGLED-The wing tick of the parapet will be angled between
         the
         in_above_features parameter value and the in_below_features parameter
         value. This is the default.PARALLEL-The wing tick of the underpass
         wing will be parallel to the
         in_below_features parameter value.NONE-No wing ticks will be created
         on the parapets.
     wing_tick_length {Linear Unit}:
         The length of the parapet wings in page units. The length must be
         greater than or equal to zero; the default length is 1. Choose a page
         unit (points, millimeters, and so on) for the length; the default is
         points. This parameter does not apply when the wing_type parameter is
         set to NONE.

    OUTPUTS:
     out_underpass_feature_class (Feature Class):
         The output feature class that will be created to store polygons to
         mask the in_below_features parameter value.
     out_mask_relationship_class (Relationship Class):
         The output relationship class that will be created to store links
         between underpass mask polygons and the lines of the in_below_features
         parameter value.
     out_decoration_feature_class {Feature Class}:
         The output line feature class that will be created to store parapet
         features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateUnderpass_cartography(
                *gp_fixargs(
                    (
                        in_above_features,
                        in_below_features,
                        margin_along,
                        margin_across,
                        out_underpass_feature_class,
                        out_mask_relationship_class,
                        where_clause,
                        out_decoration_feature_class,
                        wing_type,
                        wing_tick_length,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DisperseMarkers_cartography", None)
def DisperseMarkers(
    in_point_features=None,
    minimum_spacing=None,
    dispersal_pattern: Literal[
        "EXPANDED", "RANDOM", "SQUARES", "RINGS", "SQUARE", "RING", "CROSS", "X_CROSS", "COLUMN", "ROW"
    ]
    | None = None,
) -> Result1[str | Layer]:
    """DisperseMarkers_cartography(in_point_features, minimum_spacing, {dispersal_pattern})

       Finds point symbols that overlap or are too close to one another based
       on symbology at reference scale and spreads them apart based on a
       minimum spacing and dispersal pattern.

    INPUTS:
     in_point_features (Layer):
         The input point feature layer to be dispersed.
     minimum_spacing (Linear Unit):
         The minimum separation distance between individual point symbols in
         page units. A distance must be specified and must be greater than or
         equal to zero. When a positive value is specified, markers will be
         separated by that value; when a value of zero is specified, point
         symbols will touch. The default page unit is Points.
     dispersal_pattern {String}:
         Specifies the pattern that will be used to place the dispersed point
         symbols. A group of point symbols will have a center of mass derived
         from the locations of all points in the group. The center of mass is
         used as the anchor point around which the dispersal pattern
         operates.EXPANDED-The general pattern of the point symbols will be
         maintained
         as they are spread apart. Points that were exactly coincident will be
         dispersed to a circle around their center of mass. This is the
         default.RANDOM-Point symbols will be placed around the center of mass
         in a
         random dispersal that respects the minimum spacing.SQUARES-Point
         symbols will be placed in multiple square rings around
         the center of mass, ensuring that all points are placed as closely
         together as allowable by the minimum spacing parameter.RINGS-Point
         symbols will be placed in multiple circular rings around
         the center of mass, ensuring that all points are placed as closely
         together as allowable by the minimum spacing parameter.SQUARE-Point
         symbols will be placed evenly around the center of mass
         in a single square pattern.RING-Point symbols will be placed evenly
         around the center of mass in
         a single circular pattern.CROSS-Point symbols will be spaced evenly on
         horizontal and vertical
         axes originating from the center of mass.X_CROSS-Point symbols will be
         spaced evenly on 45° axes originating
         from the center of mass.COLUMN-Point symbols will be spaced evenly on
         a vertical axis
         originating from the center of mass.ROW-Point symbols will be spaced
         evenly on a horizontal axis
         originating from the center of mass."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DisperseMarkers_cartography(*gp_fixargs((in_point_features, minimum_spacing, dispersal_pattern), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateHachuresForDefinedSlopes_cartography", None)
def GenerateHachuresForDefinedSlopes(
    upper_lines=None,
    lower_lines=None,
    output_feature_class=None,
    output_type: Literal["POLYGON_TRIANGLES", "LINE_TICKS"] | None = None,
    fully_connected: Literal["FULLY_CONNECTED", "NOT_CONNECTED"] | None = None,
    search_distance=None,
    interval=None,
    minimum_length=None,
    alternate_hachures: Literal["ALTERNATE_HACHURES", "UNIFORM_HACHURES"] | None = None,
    perpendicular: Literal["PERPENDICULAR", "NOT_PERPENDICULAR"] | None = None,
    polygon_base_width=None,
) -> Result1[str]:
    """GenerateHachuresForDefinedSlopes_cartography(upper_lines, lower_lines, output_feature_class, {output_type}, {fully_connected}, {search_distance}, {interval}, {minimum_length}, {alternate_hachures}, {perpendicular}, {polygon_base_width})

       Creates multipart lines or polygons representing the slope between the
       lines representing the upper and lower parts of a slope.

    INPUTS:
     upper_lines (Feature Layer):
         The line features that represent the top of a slope.
     lower_lines (Feature Layer):
         The line features that represent the bottom of a slope.
     output_type {String}:
         Specifies whether polygon triangles or tick lines will be created to
         represent the slope.POLYGON_TRIANGLES-Multipart polygon features will
         be created in which
         a triangular polygon is created for each hachure, with the base along
         the upper line. This is the default.LINE_TICKS-Multipart line features
         will be created in which a linear
         tick is created for each hachure.
     fully_connected {Boolean}:
         Specifies whether the upper and lower lines in the input data form
         fully connected areas. If the upper and lower lines are not fully
         connected, choose NOT_CONNECTED to create hachures inside areas that
         are derived by connecting the extremities of the upper and lower
         features. If the upper and lower lines are fully connected, choose
         FULLY_CONNECTED to create hachures inside the fully enclosed
         areas.NOT_CONNECTED-The upper and lower features are not fully
         connected in
         the input data. New connections between the upper and lower features
         will be derived. This is the default.FULLY_CONNECTED-The upper and
         lower features are fully connected in
         the input data. New connections between features will not be derived.
     search_distance {Linear Unit}:
         The distance used when deriving connections between the upper and
         lower features. When the extremities for the upper and lower feature
         are within this distance, the area between the features is used for
         creating hachures. The default value is 20 meters. When the
         fully_connected parameter is set to FULLY_CONNECTED, this parameter is
         ignored.
     interval {Linear Unit}:
         The distance between the hachure ticks or triangles within the slope
         area. The default value is 10 meters.
     minimum_length {Linear Unit}:
         The length a hachure tick or triangle must be to be created. Hachures
         that are shorter than this length will not be created. The default
         value is 0 meters.
     alternate_hachures {Boolean}:
         Specifies whether the length of every other hachure triangle or tick
         will differ.UNIFORM_HACHURES-All hachures will be of uniform length,
         which is the
         distance between the upper and lower slope lines. This is the
         default.ALTERNATE_HACHURES-Every other hachure will be one-half the
         distance
         between the upper and lower slope lines.
     perpendicular {Boolean}:
         Specifies whether the hachure ticks or triangles will be perpendicular
         to the upper slope line.NOT_PERPENDICULAR-Hachures will be oriented
         to obtain even spacing.
         This is the default.PERPENDICULAR-Hachures will be oriented
         perpendicularly to the upper
         line.
     polygon_base_width {Linear Unit}:
         The width of the base of triangular polygon hachures. This parameter
         is enabled only when the output_type parameter is set to
         polygon_triangles. The default value is 5 meters.

    OUTPUTS:
     output_feature_class (Feature Class):
         The output feature class containing multipart line or polygon hachures
         representing the slope area."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateHachuresForDefinedSlopes_cartography(
                *gp_fixargs(
                    (
                        upper_lines,
                        lower_lines,
                        output_feature_class,
                        output_type,
                        fully_connected,
                        search_distance,
                        interval,
                        minimum_length,
                        alternate_hachures,
                        perpendicular,
                        polygon_base_width,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetControlPointAtIntersect_cartography", None)
def SetControlPointAtIntersect(
    in_line_or_polygon_features=None,
    in_features=None,
) -> Result1[str | Layer]:
    """SetControlPointAtIntersect_cartography(in_line_or_polygon_features, {in_features})

       Creates a control point at vertices that are shared by one or more
       line or polygon features. This tool is commonly used to synchronize
       boundary symbology on adjacent polygons.

    INPUTS:
     in_line_or_polygon_features (Feature Layer):
         The line or polygon feature layer.
     in_features {Feature Layer}:
         The line or polygon feature layer with features coincident to the
         input features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetControlPointAtIntersect_cartography(*gp_fixargs((in_line_or_polygon_features, in_features), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetControlPointByAngle_cartography", None)
def SetControlPointByAngle(
    in_features=None,
    maximum_angle=None,
) -> Result1[str | Layer]:
    """SetControlPointByAngle_cartography(in_features, maximum_angle)

       Places a control point at vertices along a line or polygon outline
       where the angle created by a change in line direction is less than or
       equal to a specified maximum angle.

    INPUTS:
     in_features (Feature Layer):
         The feature layer containing line or polygon features.
     maximum_angle (Double):
         The angle used to determine whether a vertex along a line or polygon
         outline will be set as a control point. The angle value must be
         greater than zero and less than 180 decimal degrees."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetControlPointByAngle_cartography(*gp_fixargs((in_features, maximum_angle), True))
        )
        return retval
    except Exception as e:
        raise e


# Generalization toolset
@gptooldoc("AggregatePoints_cartography", None)
def AggregatePoints(
    in_features=None,
    out_feature_class=None,
    aggregation_distance=None,
) -> Result2[str, str]:
    """AggregatePoints_cartography(in_features, out_feature_class, aggregation_distance)

       Creates polygon features around clusters of proximate point features.

    INPUTS:
     in_features (Feature Layer):
         The input point features that will be assessed for proximity and
         clustering.
     aggregation_distance (Linear Unit):
         The distance between points that will be clustered.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class created to hold the polygons that represent the
         point clusters."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AggregatePoints_cartography(*gp_fixargs((in_features, out_feature_class, aggregation_distance), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AggregatePolygons_cartography", None)
def AggregatePolygons(
    in_features=None,
    out_feature_class=None,
    aggregation_distance=None,
    minimum_area=None,
    minimum_hole_size=None,
    orthogonality_option: Literal["ORTHOGONAL", "NON_ORTHOGONAL"] | None = None,
    barrier_features=None,
    out_table=None,
    aggregate_field=None,
) -> Result2[str, str]:
    """AggregatePolygons_cartography(in_features, out_feature_class, aggregation_distance, {minimum_area}, {minimum_hole_size}, {orthogonality_option}, {barrier_features;barrier_features...}, {out_table}, {aggregate_field})

       Combines polygons that are within a specified distance of each other
       into new polygons.

    INPUTS:
     in_features (Feature Layer):
         The polygon features to be aggregated. If this is a layer referencing
         a representation and shape overrides are present on the input
         features, the overridden shapes, not the feature shapes, will be
         considered in aggregation processing.
     aggregation_distance (Linear Unit):
         The distance to be satisfied between polygon boundaries for
         aggregation to occur. A distance must be specified, and it must be
         greater than zero. You can choose a preferred unit; the default is the
         feature unit.
     minimum_area {Areal Unit}:
         The minimum area for an aggregated polygon to be retained. The default
         value is zero, that is, to keep all polygons. You can specify a
         preferred unit; the default is the feature unit.
     minimum_hole_size {Areal Unit}:
         The minimum size of a polygon hole to be retained. The default value
         is zero, that is, to keep all polygon holes. You can specify a
         preferred unit; the default is the feature unit.
     orthogonality_option {Boolean}:
         Specifies the characteristic of the output features when constructing
         the aggregated boundaries.NON_ORTHOGONAL-Organically shaped output
         features will be created.
         This is suitable for natural features, such as vegetation or soil
         polygons. This is the default.ORTHOGONAL-Orthogonally shaped output
         features will be created. This
         is suitable for preserving the geometric characteristic of
         anthropogenic input features, such as building footprints.
     barrier_features {Feature Layer}:
         The layers containing the line or polygon features that are
         aggregation barriers for input features. Features will not be
         aggregated across barrier features. Barrier features that are in
         geometric conflict with input features will be ignored.
     aggregate_field {Field}:
         The field that contains attributes for aggregation. Features must
         share the same attribute value to be considered for aggregation. For
         example, use a building classification field as the aggregate field to
         prevent commercial buildings from aggregating with residential
         buildings.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class to be created.
     out_table {Table}:
         A one-to-many relationship table that links the aggregated
         polygons to their source polygon features. This table contains two
         fields,and, that store the aggregated feature IDs and their source
         feature IDs, respectively. Use this table to derive necessary
         attributes for the output features from their source features. The
         default name for this table is the name of the output feature class,
         appended with _tbl. The default path is the same as the output feature
         class. If the output features location is specified in a feature
         dataset, this table will be created one level higher, at the
         geodatabase level. No table is created when this parameter is left
         blank. OUTPUT_FIDINPUT_FID"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AggregatePolygons_cartography(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        aggregation_distance,
                        minimum_area,
                        minimum_hole_size,
                        orthogonality_option,
                        barrier_features,
                        out_table,
                        aggregate_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CollapseDualLinesToCenterline_cartography", None)
def CollapseDualLinesToCenterline(
    in_features=None,
    out_feature_class=None,
    maximum_width=None,
    minimum_width=None,
) -> Result1[str]:
    """CollapseDualLinesToCenterline_cartography(in_features, out_feature_class, maximum_width, {minimum_width})

       Derives centerlines from dual-line (double-line) features, such as
       road casings, based on specified width tolerances.

    INPUTS:
     in_features (Feature Layer):
         The input dual-line features, such as road casings, from which
         centerlines will be derived.
     maximum_width (Linear Unit):
         The maximum width of the dual-line features that will be used to
         derive a centerline. A value must be specified, and it must be greater
         than zero. You can specify a unit; the default is the feature unit.
     minimum_width {Linear Unit}:
         The minimum width of the dual-line features that will be used to
         derive a centerline. The minimum width must be greater than or equal
         to zero, and it must be less than the maximum width. The default value
         is zero. You can specify a unit; the default is the feature unit.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class that will be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CollapseDualLinesToCenterline_cartography(
                *gp_fixargs((in_features, out_feature_class, maximum_width, minimum_width), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CollapseHydroPolygon_cartography", None)
def CollapseHydroPolygon(
    in_features=None,
    out_line_feature_class=None,
    merge_adjacent_input_polygons: Literal["MERGE_ADJACENT", "NO_MERGE"] | None = None,
    connecting_features=None,
    collapse_width=None,
    collapse_width_tolerance=None,
    minimum_length=None,
    taper_length_percentage=None,
    out_poly_feature_class=None,
) -> Result:
    """CollapseHydroPolygon_cartography(in_features;in_features..., out_line_feature_class, {merge_adjacent_input_polygons}, {connecting_features;connecting_features...}, {collapse_width}, {collapse_width_tolerance}, {minimum_length}, {taper_length_percentage}, {out_poly_feature_class})

       Collapses or partially collapses hydro polygons to a centerline based
       on a collapse width.

    INPUTS:
     in_features (Feature Layer):
         One or more feature layers containing hydro polygons.
     merge_adjacent_input_polygons {Boolean}:
         Specifies whether adjacent input polygons will be merged before
         calculating the centerlines.MERGE_ADJACENT-Input hydro polygons will
         be merged before calculating
         the centerlines. This is the default.NO_MERGE-Centerlines will be
         calculated from input hydro polygons that
         are not merged.
     connecting_features {Feature Layer}:
         Input hydro line features that connect to the input hydro polygons to
         be collapsed. Line features will be created to maintain these
         connections.
     collapse_width {Linear Unit}:
         The threshold width of an input hydro polygon to be considered for
         collapse. All polygons below the specified width will be collapsed.
         The default value is 0, which will collapse all features.
     collapse_width_tolerance {Double}:
         A percentage tolerance within which features will be analyzed and the
         surrounding context will be considered when determining whether to
         collapse a feature. This is to minimize oscillations within the
         collapse. The default value is 20 percent. This parameter is applied
         only when the collapse_width parameter value is specified.
     minimum_length {Linear Unit}:
         The minimum length required for a polygon to be retained in the output
         polygon feature class. The minimum length is based on the length of
         the centerline created for the polygon. If the centerline of a polygon
         is longer than the collapse width but shorter than the minimum length,
         the polygon will not be included in the output polygon feature class.
         The default value is 0. This parameter is applied only when the
         collapse_width parameter value is specified.
     taper_length_percentage {Double}:
         The length that connections between polygons in the output polygon
         feature class and the output line feature class will be tapered. This
         parameter specifies the length of the tapering as a percentage of the
         width at the connection location. A taper length percentage value of 0
         will result in no tapering. The default value is 50. This parameter is
         applied only when the collapse_width parameter value is specified.

    OUTPUTS:
     out_line_feature_class (Feature Class):
         The line feature class containing the centerlines of the
         collapsed polygons. It contains centerlines of all input polygons
         including those that are not collapsed. This feature class has
         aattribute that specifies whether the centerline feature represents a
         collapsed polygon. COLLAPSED
     out_poly_feature_class {Feature Class}:
         The polygon feature class containing the portions of the input hydro
         polygons that are not collapsed. This parameter is applied only when
         the collapse_width parameter value is specified."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CollapseHydroPolygon_cartography(
                *gp_fixargs(
                    (
                        in_features,
                        out_line_feature_class,
                        merge_adjacent_input_polygons,
                        connecting_features,
                        collapse_width,
                        collapse_width_tolerance,
                        minimum_length,
                        taper_length_percentage,
                        out_poly_feature_class,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CollapseRoadDetail_cartography", None)
def CollapseRoadDetail(
    in_features=None,
    collapse_distance=None,
    output_feature_class=None,
    locking_field=None,
) -> Result1[str]:
    """CollapseRoadDetail_cartography(in_features, collapse_distance, output_feature_class, {locking_field})

       Collapses small, open configurations of road segments that interrupt
       the general trend of a road network, such as traffic circles, and
       replaces them with a simplified depiction.

    INPUTS:
     in_features (Feature Layer):
         The input features containing small enclosed road details, such as
         traffic circles, to be collapsed.
     collapse_distance (Linear Unit):
         The diameter of, or distance across, the road detail that will be
         considered for collapse.
     locking_field {Field}:
         The field that contains locking information for the features. The data
         type must be short or long integer. A value of 1 indicates that a
         feature will not be collapsed.

    OUTPUTS:
     output_feature_class (Feature Class):
         The output feature class containing the collapsed features-features
         that were modified to accommodate the collapse-and all unaffected
         features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CollapseRoadDetail_cartography(
                *gp_fixargs((in_features, collapse_distance, output_feature_class, locking_field), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateCartographicPartitions_cartography", None)
def CreateCartographicPartitions(
    in_features=None,
    out_features=None,
    feature_count=None,
    partition_method: Literal["FEATURES", "VERTICES"] | None = None,
) -> Result1[str]:
    """CreateCartographicPartitions_cartography(in_features;in_features..., out_features, feature_count, {partition_method})

       Creates a mesh of polygon features that cover the input feature class
       in which each output polygon encloses no more than a specified number
       of input features or input vertices. as determined by the density and
       distribution of the input features.

    INPUTS:
     in_features (Feature Layer):
         The input feature classes or layers with feature distribution and
         density, or vertex distribution and density, that determine the size
         and arrangement of output polygons. The input features are typically
         destined for subsequent processing with other geoprocessing tools.
         Typically, the input features, when considered simultaneously, would
         exceed memory limitations of other tools, so partitions are created to
         subdivide inputs for processing.
     feature_count (Long):
         The ideal number of features or vertices (depending on the
         partition_method parameter value) to be enclosed by each polygon in
         the output feature class. The recommended count for features is
         50,000, which is the default value. For vertices, 1 million vertices
         will consume approximately 0.5 GB of memory depending on the tool
         using the partitions. The feature count cannot be less than 500.
     partition_method {String}:
         Specifies whether the feature_count parameter references the ideal
         number of features or the ideal number of vertices in each output
         polygon.FEATURES-Partitioning considers the number and density of
         individual
         features. This method is applicable in most cases and is the
         default.VERTICES-Partitioning considers the number and density of
         vertices.
         This method is used in cases in which the input data contains a
         relatively small number of very complex features, such as high-
         resolution country polygons, or when very long features are likely to
         cross multiple partition boundaries, such as contour lines.

    OUTPUTS:
     out_features (Feature Class):
         The output polygon feature class of partitions each of which encloses
         a manageable number of input features or manageable number of input
         vertices not exceeding the number specified by the feature_count
         parameter."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateCartographicPartitions_cartography(
                *gp_fixargs((in_features, out_features, feature_count, partition_method), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DelineateBuiltUpAreas_cartography", None)
def DelineateBuiltUpAreas(
    in_buildings=None,
    identifier_field=None,
    edge_features=None,
    grouping_distance=None,
    minimum_detail_size=None,
    out_feature_class=None,
    minimum_building_count=None,
) -> Result1[str]:
    """DelineateBuiltUpAreas_cartography(in_buildings;in_buildings..., {identifier_field}, {edge_features;edge_features...}, grouping_distance, minimum_detail_size, out_feature_class, {minimum_building_count})

       Creates polygons to represent built-up areas by delineating densely
       clustered arrangements of buildings on small-scale maps.

    INPUTS:
     in_buildings (Feature Layer):
         The layers containing buildings with density and arrangement that are
         used to define appropriate output built-up polygons. Multiple building
         layers can be assessed simultaneously. Building features can be points
         or polygons.
     identifier_field {String}:
         A field in the input feature classes that will hold a status
         code indicating whether the input feature is part of the resulting
         built-up area . This field must be either short or long integer type
         and common to all input layers if multiple input layers are used.
         0-The building is not represented by an output built-up area
         polygon.1-The building is represented by an output built-up area
         polygon and
         is within the resulting polygon.2-The building is represented by an
         output built-up area polygon and
         is outside the resulting polygon.
     edge_features {Feature Layer}:
         The layers that will be used to define the edges of the built-up area
         polygons. Typically, these are roads, but other common examples are
         rivers, coastlines, and administrative areas. Built-up area polygons
         snap to an edge feature if one is generally aligned with the trend of
         the polygon edge and within the grouping distance away. Edge features
         can be lines or polygons.
     grouping_distance (Linear Unit):
         Buildings closer together than the grouping distance are considered
         collectively as candidates for representation by an output built-up
         area polygon. This distance is measured from the edges of polygon
         buildings and the centers of point buildings.
     minimum_detail_size (Linear Unit):
         The relative degree of detail in the output built-up area polygons.
         This is approximately to the minimum allowable diameter of a hole or
         cavity in the built-up area polygon. The actual size and shape of
         holes and cavities within the polygon is determined also by the
         arrangement of the input buildings, the grouping distance, and the
         presence of edge features if they are used.
     minimum_building_count {Long}:
         The minimum number of buildings that must be collectively considered
         for representation by an output built-up area polygon. The default
         value is 4. The minimum building count must be greater than or equal
         to 0.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class containing built-up area polygons
         representing clustered arrangements of input buildings."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DelineateBuiltUpAreas_cartography(
                *gp_fixargs(
                    (
                        in_buildings,
                        identifier_field,
                        edge_features,
                        grouping_distance,
                        minimum_detail_size,
                        out_feature_class,
                        minimum_building_count,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MergeDividedRoads_cartography", None)
def MergeDividedRoads(
    in_features=None,
    merge_field=None,
    merge_distance=None,
    out_features=None,
    out_displacement_features=None,
    character_field=None,
    out_table=None,
) -> Result3[str, str, str]:
    """MergeDividedRoads_cartography(in_features, merge_field, merge_distance, out_features, {out_displacement_features}, {character_field}, {out_table})

       Generates single-line road features in place of matched pairs of
       divided road lanes.

    INPUTS:
     in_features (Feature Layer):
         The input linear road features that contain matched pairs of divided
         road lanes that will be merged into a single output line feature.
     merge_field (Field):
         The field that contains road classification information. Only
         parallel, proximate roads of equal classification will be merged. A
         value of 0 (zero) locks a feature to prevent it from participating in
         merging. The data type must be short or long integer.
     merge_distance (Linear Unit):
         The minimum distance apart, in the specified units, for equal-class,
         relatively parallel road features to be merged. This distance must be
         greater than zero. If the units are in points, millimeters,
         centimeters, or inches, the value is considered in page units and
         takes into account the reference scale.
     character_field {Field}:
         A short or long integer field that indicate the character of road
         segments, independent of their road classification. The tool uses
         these values to refine the assessment of candidate feature pairs for
         merging. Use this parameter in unusual or complex road networks to
         improve the quality of the output. If there are null values (or if
         this parameter is not specified), the road character (and merge
         candidacy) is based only on the shapes and arrangement of features.
         Use value 999 to lock features from participating in a merge.
         Field values are assessed as follows:        0-Traffic circles
         or roundabouts1-Carriageways, boulevards, dual-lane
         highways, or other parallel
         trending roads2-On- or off-ramps, highway intersection
         connectors999-Features will not be merged

    OUTPUTS:
     out_features (Feature Class):
         The output feature class containing single-line merged road features
         and all unmerged road features.
     out_displacement_features {Feature Class}:
         The output polygon features containing the degree and direction of
         road displacement.
     out_table {Table}:
         A many-to-many relationship table that links the merged road
         features to their source features. This table contains two fields,and,
         which store the merged feature IDs and their source feature IDs,
         respectively. Use this table to derive necessary attributes for the
         output features from their source features. No table is created when
         this parameter is left blank. OUTPUT_FIDINPUT_FID"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MergeDividedRoads_cartography(
                *gp_fixargs(
                    (
                        in_features,
                        merge_field,
                        merge_distance,
                        out_features,
                        out_displacement_features,
                        character_field,
                        out_table,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SimplifyBuilding_cartography", None)
def SimplifyBuilding(
    in_features=None,
    out_feature_class=None,
    simplification_tolerance=None,
    minimum_area=None,
    conflict_option: Literal["CHECK_CONFLICTS", "NO_CHECK"] | None = None,
    in_barriers=None,
    collapsed_point_option: Literal["KEEP_COLLAPSED_POINTS", "NO_KEEP"] | None = None,
) -> Result2[str, str]:
    """SimplifyBuilding_cartography(in_features, out_feature_class, simplification_tolerance, {minimum_area}, {conflict_option}, {in_barriers;in_barriers...}, {collapsed_point_option})

       Simplifies the boundary or footprint of building polygons while
       maintaining their essential shape and size.

    INPUTS:
     in_features (Feature Layer):
         The building polygons to be simplified.
     simplification_tolerance (Linear Unit):
         The tolerance for building simplification. A tolerance must be
         specified, and it must be greater than zero. You can choose a
         preferred unit; the default is the feature unit.
     minimum_area {Areal Unit}:
         The minimum area for a simplified building to be retained in feature
         units. The default value is zero, that is, to keep all buildings. You
         can specify a preferred unit; the default is the feature unit.
     conflict_option {Boolean}:
         Specifies whether spatial conflicts-that is, overlapping or
         touching among buildings-will be identified. Afield is added to the
         output to store conflict flags. A value of 0 means no conflict; a
         value of 1 means conflict. SimBldFlagNO_CHECK-Spatial conflicts
         will not be identified; the resulting
         buildings may overlap. This is the default.CHECK_CONFLICTS-Spatial
         conflicts will be identified and the
         conflicting buildings will be flagged.
     in_barriers {Feature Layer}:
         The input layers containing features to act as barriers for
         simplification. Resulting simplified buildings will not touch or cross
         barrier features. For example, when simplifying buildings, the
         resulting simplified building areas do not cross road features defined
         as barriers.
     collapsed_point_option {Boolean}:
         Specifies whether an output point feature class will be created to
         store the centers of any buildings that are removed because they are
         smaller than the minimum_area parameter value. The point output is
         derived, is named the same as the output feature class specified in
         the out_feature_class parameter but with a _Pnt suffix, and is located
         in the same folder.KEEP_COLLAPSED_POINTS-A derived output point
         feature class will be
         created to store the centers of buildings that are removed.NO_KEEP-An
         output point feature class will not be created. This is
         the default.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class to be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SimplifyBuilding_cartography(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        simplification_tolerance,
                        minimum_area,
                        conflict_option,
                        in_barriers,
                        collapsed_point_option,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SimplifyLine_cartography", None)
def SimplifyLine(
    in_features=None,
    out_feature_class=None,
    algorithm: Literal["POINT_REMOVE", "BEND_SIMPLIFY", "WEIGHTED_AREA", "EFFECTIVE_AREA"] | None = None,
    tolerance=None,
    error_resolving_option: Literal["RESOLVE_ERRORS", "FLAG_ERRORS"] | None = None,
    collapsed_point_option: Literal["KEEP_COLLAPSED_POINTS", "NO_KEEP"] | None = None,
    error_checking_option: Literal["CHECK", "NO_CHECK"] | None = None,
    in_barriers=None,
    error_option: Literal["NO_CHECK", "FLAG_ERRORS", "RESOLVE_ERRORS"] | None = None,
) -> Result2[str, str]:
    """SimplifyLine_cartography(in_features, out_feature_class, algorithm, tolerance, {error_resolving_option}, {collapsed_point_option}, {error_checking_option}, {in_barriers;in_barriers...}, {error_option})

       Simplifies lines by removing relatively extraneous vertices while
       preserving essential shape.

    INPUTS:
     in_features (Feature Layer):
         The input line features that will be simplified.
     algorithm (String):
         Specifies the line simplification algorithm that will be
         used.POINT_REMOVE-Critical points that preserve the essential shape of
         a
         line will be retained, and all other points will be removed (Douglas-
         Peucker). This is the default.BEND_SIMPLIFY-Critical bends will be
         retained, and extraneous bends
         will be removed from a line (Wang-Müller).WEIGHTED_AREA-Vertices that
         form triangles of effective area that have
         been weighted by triangle shape will be retained (Zhou-
         Jones).EFFECTIVE_AREA-Vertices that form triangles of effective area
         will be
         retained (Visvalingam-Whyatt).
     tolerance (Linear Unit):
         The degree of simplification that will be used. You can choose
         a preferred unit; otherwise, the units of the input will be used.
         Theandfields will be added to the output to store the tolerance that
         was used when processing occurred. MinSimpTolMaxSimpTolFor the
         POINT_REMOVE algorithm, the tolerance is the maximum allowable
         perpendicular distance between each vertex and the newly created
         line.For the BEND_SIMPLIFY algorithm, the tolerance is the diameter of
         a
         circle that approximates a significant bend.For the WEIGHTED_AREA
         algorithm, the square of the tolerance is the
         area of a significant triangle defined by three adjacent vertices. The
         further a triangle deviates from equilateral, the higher weight it is
         given, and the less likely it is to be removed.For the EFFECTIVE_AREA
         algorithm, the square of the tolerance is the
         area of a significant triangle defined by three adjacent vertices.
     error_resolving_option {Boolean}:
         This is a legacy parameter that is no longer used. It was
         formerly used to indicate how topological errors, possibly introduced
         during processing, were resolved. This parameter is still included in
         the tool's syntax for compatibility in scripts and models but is
         hidden from thepane. Geoprocessing
     collapsed_point_option {Boolean}:
         Specifies whether an output point feature class will be created to
         store the endpoints of lines that are smaller than the spatial
         tolerance. The point output is derived; it will use the same name and
         location as the out_feature_class parameter value but with a _Pnt
         suffix.KEEP_COLLAPSED_POINTS-A derived output point feature class will
         be
         created to store the endpoints of collapsed zero length lines. This is
         the default.NO_KEEP-A derived output point feature class will not be
         created.
     error_checking_option {Boolean}:
         Check for topological errors
     in_barriers {Feature Layer}:
         Inputs containing features to act as barriers for simplification.
         Resulting simplified lines will not touch or cross barrier features.
         For example, when simplifying contour lines, spot height features
         input as barriers ensure that the simplified contour lines will not
         simplify across these points. The output will not violate the
         elevation as described by measured spot heights.
     error_option {String}:
         Specifies how topological errors will be handled. Topological errors
         may be introduced in the simplification process and can include lines
         crossing or overlapping lines.NO_CHECK-Topological errors will not be
         identified. This is the
         default.FLAG_ERRORS-Topological errors will be
         flagged.RESOLVE_ERRORS-Topological errors will be resolved.

    OUTPUTS:
     out_feature_class (Feature Class):
         The simplified output line feature class. It will contain all
         the fields from the input feature class. The output line feature class
         is topologically correct. The tool does not introduce topology errors,
         but topological errors in the input data will be flagged in the output
         line feature class. The output feature class will include theandfields
         to contain the input feature IDs and the input topological errors,
         respectively. Avalue of 1 indicates that an input topological error is
         present; a value of 0 (zero) indicates that no input error is present.
         InLine_FIDSimLnFlagSimLnFlag"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SimplifyLine_cartography(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        algorithm,
                        tolerance,
                        error_resolving_option,
                        collapsed_point_option,
                        error_checking_option,
                        in_barriers,
                        error_option,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SimplifyPolygon_cartography", None)
def SimplifyPolygon(
    in_features=None,
    out_feature_class=None,
    algorithm: Literal["POINT_REMOVE", "BEND_SIMPLIFY", "WEIGHTED_AREA", "EFFECTIVE_AREA"] | None = None,
    tolerance=None,
    minimum_area=None,
    error_option: Literal["NO_CHECK", "FLAG_ERRORS", "RESOLVE_ERRORS"] | None = None,
    collapsed_point_option: Literal["KEEP_COLLAPSED_POINTS", "NO_KEEP"] | None = None,
    in_barriers=None,
) -> Result2[str, str]:
    """SimplifyPolygon_cartography(in_features, out_feature_class, algorithm, tolerance, {minimum_area}, {error_option}, {collapsed_point_option}, {in_barriers;in_barriers...})

       Simplifies polygons by removing relatively extraneous vertices while
       preserving essential shape.

    INPUTS:
     in_features (Feature Layer):
         The input polygon features that will be simplified.
     algorithm (String):
         Specifies the polygon simplification algorithm that will be
         used.POINT_REMOVE-Critical points that preserve the essential shape of
         a
         polygon outline will be retained, and all other points will be removed
         (Douglas-Peucker). This is the default.BEND_SIMPLIFY-Critical bends
         will be retained, and extraneous bends
         will be removed from a line (Wang-Müller).WEIGHTED_AREA-Vertices that
         form triangles of effective area that have
         been weighted by triangle shape will be retained (Zhou-
         Jones).EFFECTIVE_AREA-Vertices that form triangles of effective area
         will be
         retained (Visvalingam-Whyatt).
     tolerance (Linear Unit):
         The degree of simplification that will be used. You can choose
         a preferred unit; otherwise, the units of the input will be used.
         Theandfields will be added to the output to store the tolerance that
         was used when processing occurred. MinSimpTolMaxSimpTolFor the
         POINT_REMOVE algorithm, the tolerance is the maximum allowable
         perpendicular distance between each vertex and the newly created
         line.For the BEND_SIMPLIFY algorithm, the tolerance is the diameter of
         a
         circle that approximates a significant bend.For the WEIGHTED_AREA
         algorithm, the square of the tolerance is the
         area of a significant triangle defined by three adjacent vertices. The
         further a triangle deviates from equilateral, the higher weight it is
         given, and the less likely it is to be removed.For the EFFECTIVE_AREA
         algorithm, the square of the tolerance is the
         area of a significant triangle defined by three adjacent vertices.
     minimum_area {Areal Unit}:
         The minimum area for a polygon to be retained. The default value is
         zero, that is, to keep all polygons. You can choose a preferred unit
         for the specified value; otherwise, the units of the input will be
         used.
     error_option {String}:
         Specifies how topological errors will be handled. Topological errors
         may be introduced in the simplification process and can include lines
         crossing or overlapping lines.NO_CHECK-Topological errors will not be
         identified. This is the
         default.FLAG_ERRORS-Topological errors will be
         flagged.RESOLVE_ERRORS-Topological errors will be resolved.
     collapsed_point_option {Boolean}:
         Specifies whether an output point feature class will be created to
         store the centers of polygons that are removed because they are
         smaller than the minimum_area parameter value. The point output is
         derived; it will use the same name and location as the
         out_feature_class parameter value but with a _Pnt
         suffix.KEEP_COLLAPSED_POINTS-A derived output point feature class will
         be
         created to store the centers of polygons that are removed because they
         are smaller than the minimum area. This is the default.NO_KEEP-A
         derived output point feature class will not be created.
     in_barriers {Feature Layer}:
         The inputs containing features to act as barriers for simplification.
         Resulting simplified polygons will not touch or cross barrier
         features. For example, when simplifying forested areas, the resulting
         simplified forest polygons will not cross road features defined as
         barriers.

    OUTPUTS:
     out_feature_class (Feature Class):
         The simplified output polygon feature class. It will contain all the
         fields from the input feature class. The output polygon feature class
         is topologically correct. The tool does not introduce topology errors,
         but topological errors in the input data will be flagged in the output
         polygon feature class. The output feature class will include
         theandfields to contain
         the input feature IDs and the input topological errors or
         discrepancies, respectively. InPoly_FIDSimPgnFlag
         Theattribute values are as follows:
         SimPgnFlagSimPgnFlag = 0 indicates that no errors are
         present.SimPgnFlag = 1
         indicates a topological error is present.SimPgnFlag = 2 indicates
         features that have been split by a partition
         and are now smaller than the minimum area after simplification. The
         flag may appear on only one part of the split feature. These features
         will be retained in the output feature class. This situation occurs
         only when the Cartographic Partitions environment setting is used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SimplifyPolygon_cartography(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        algorithm,
                        tolerance,
                        minimum_area,
                        error_option,
                        collapsed_point_option,
                        in_barriers,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SimplifySharedEdges_cartography", None)
def SimplifySharedEdges(
    in_features=None,
    algorithm: Literal["POINT_REMOVE", "BEND_SIMPLIFY", "WEIGHTED_AREA", "EFFECTIVE_AREA"] | None = None,
    tolerance=None,
    shared_edge_features=None,
    minimum_area=None,
    in_barriers=None,
) -> Result2[str | Layer, str | Layer]:
    """SimplifySharedEdges_cartography(in_features;in_features..., algorithm, tolerance, {shared_edge_features;shared_edge_features...}, {minimum_area}, {in_barriers;in_barriers...})

       Simplifies the edges of input features while maintaining the
       topological relationship with edges shared with other features.

    INPUTS:
     in_features (Feature Layer):
         The lines or polygons to be simplified.
     algorithm (String):
         Specifies the simplification algorithm.POINT_REMOVE-Retains critical
         points that preserve the essential shape
         of a polygon outline and removes all other points (Douglas-Peucker).
         This is the default.BEND_SIMPLIFY-Retains the critical bends and
         removes extraneous bends
         from a line (Wang-Müller).WEIGHTED_AREA-Retains vertices that form
         triangles of effective area
         that have been weighted by triangle shape (Zhou-Jones).EFFECTIVE_AREA-
         Retains vertices that form triangles of effective area
         (Visvalingam-Whyatt).
     tolerance (Linear Unit):
         Determines the degree of simplification. If a unit is not specified,
         the units of the input will be used.For the POINT_REMOVE algorithm,
         the tolerance is the maximum allowable
         perpendicular distance between each vertex and the new line
         created.For the BEND_SIMPLIFY algorithm, the tolerance is the diameter
         of a
         circle that approximates a significant bend.For the WEIGHTED_AREA
         algorithm, the square of the tolerance is the
         area of a significant triangle defined by three adjacent vertices. The
         further a triangle deviates from equilateral, the higher weight it is
         given, and the less likely it is to be removed.For the EFFECTIVE_AREA
         algorithm, the square of the tolerance is the
         area of a significant triangle defined by three adjacent vertices.
     shared_edge_features {Feature Layer}:
         Line or polygon features that will be simplified along edges shared
         with input features. Other edges are not simplified.
     minimum_area {Areal Unit}:
         The minimum area for a polygon to be retained. The default value is
         zero, which will retain all polygons. A unit can be specified; if no
         unit is specified, the unit of the input will be used. This parameter
         is available only when at least one of the inputs is a polygon feature
         class.
     in_barriers {Feature Layer}:
         Point, line, or polygon features that act as barriers for the
         simplification. The simplified features will not touch or cross
         barrier features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SimplifySharedEdges_cartography(
                *gp_fixargs((in_features, algorithm, tolerance, shared_edge_features, minimum_area, in_barriers), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SmoothLine_cartography", None)
def SmoothLine(
    in_features=None,
    out_feature_class=None,
    algorithm: Literal["PAEK", "BEZIER_INTERPOLATION"] | None = None,
    tolerance=None,
    endpoint_option: Literal["FIXED_CLOSED_ENDPOINT", "NO_FIXED"] | None = None,
    error_option: Literal["NO_CHECK", "FLAG_ERRORS", "RESOLVE_ERRORS"] | None = None,
    in_barriers=None,
) -> Result1[str]:
    """SmoothLine_cartography(in_features, out_feature_class, algorithm, tolerance, {endpoint_option}, {error_option}, {in_barriers;in_barriers...})

       Smooths sharp angles in lines to improve aesthetic or cartographic
       quality.

    INPUTS:
     in_features (Feature Layer):
         The line features to be smoothed.
     algorithm (String):
         Specifies the smoothing algorithm.PAEK-This is the acronym for
         Polynomial Approximation with Exponential
         Kernel. A smoothed line that will not pass through the input line
         vertices will be calculated. This is the
         default.BEZIER_INTERPOLATION-Bezier curves will be fitted between
         vertices.
         The resulting lines pass through the vertices of the input lines. This
         algorithm does not require a tolerance. Bezier curves will be
         approximated in the output.
     tolerance (Linear Unit):
         A tolerance used by the PAEK algorithm. A tolerance must be specified,
         and it must be greater than zero. You can choose a preferred unit; the
         default is the feature unit. You must enter a 0 as a placeholder when
         using the BEZIER_INTERPOLATION smoothing algorithm.
     endpoint_option {Boolean}:
         This is a legacy parameter that is no longer used. It was formerly
         used to specify whether endpoints of closed lines would be preserved.
         This parameter is still included in the tool's syntax for
         compatibility in scripts and models but is hidden from the tool's
         dialog box.Specifies whether the endpoints of closed lines will be
         preserved.
         This option works with the PAEK algorithm
         only.FIXED_CLOSED_ENDPOINT-The endpoint of a closed line will be
         preserved.
         This is the default.NO_FIXED-The endpoint of a closed line will not be
         preserved; it will
         be smoothed.
     error_option {String}:
         Specifies how topological errors (possibly introduced in the process,
         such as line crossing or overlapping) will be
         handled.NO_CHECK-Topological errors will not be identified. This is
         the
         default.FLAG_ERRORS-If topological errors are found, they will be
         flagged.RESOLVE_ERRORS-If topological errors are found, they will be
         resolved.
     in_barriers {Feature Layer}:
         Inputs containing features that will act as barriers for smoothing.
         The resulting smoothed lines will not touch or cross barrier features.
         For example, when smoothing contour lines, spot height features input
         as barriers ensure that the smoothed contour lines will not be smooth
         across these points. The output will not violate the elevation as
         described by measured spot heights.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class to be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SmoothLine_cartography(
                *gp_fixargs(
                    (in_features, out_feature_class, algorithm, tolerance, endpoint_option, error_option, in_barriers),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SmoothPolygon_cartography", None)
def SmoothPolygon(
    in_features=None,
    out_feature_class=None,
    algorithm: Literal["PAEK", "BEZIER_INTERPOLATION"] | None = None,
    tolerance=None,
    endpoint_option: Literal["FIXED_ENDPOINT", "NO_FIXED"] | None = None,
    error_option: Literal["NO_CHECK", "FLAG_ERRORS", "RESOLVE_ERRORS"] | None = None,
    in_barriers=None,
) -> Result1[str]:
    """SmoothPolygon_cartography(in_features, out_feature_class, algorithm, tolerance, {endpoint_option}, {error_option}, {in_barriers;in_barriers...})

       Smooths sharp angles in polygon outlines to improve aesthetic or
       cartographic quality.

    INPUTS:
     in_features (Feature Layer):
         The polygon features to be smoothed.
     algorithm (String):
         Specifies the smoothing algorithm.PAEK-This is the acronym for
         Polynomial Approximation with Exponential
         Kernel. A smoothed polygon that will not pass through the input
         polygon vertices will be calculated. This is the
         default.BEZIER_INTERPOLATION-Bezier curves will be fitted between
         vertices.
         The resulting polygons pass through the vertices of the input
         polygons. This algorithm does not require a tolerance. Bezier curves
         will be approximated in the output.
     tolerance (Linear Unit):
         Sets a tolerance used by the PAEK algorithm. A tolerance must be
         specified, and it must be greater than zero. You can choose a
         preferred unit; the default is the feature unit. You must enter a 0 as
         a placeholder when using the BEZIER_INTERPOLATION smoothing algorithm.
     endpoint_option {Boolean}:
         This is a legacy parameter that is no longer used. It was formerly
         used to specify whether the endpoint of an isolated polygon ring would
         be preserved. This parameter is still included in the tool's syntax
         for compatibility in scripts and models but is hidden from the tool's
         dialog box.Specifies whether the endpoints of isolated polygon rings
         will be
         preserved. This option works with the PAEK algorithm
         only.FIXED_ENDPOINT-The endpoint of an isolated polygon ring will be
         preserved. This is the default.NO_FIXED-The endpoint of an isolated
         polygon ring will not be
         preserved; it will be smoothed.
     error_option {String}:
         Specifies how topological errors (possibly introduced in the process,
         such as line crossing or overlapping) will be
         handled.NO_CHECK-Topological errors will not be identified. This is
         the
         default.FLAG_ERRORS-If topological errors are found, they will be
         flagged.RESOLVE_ERRORS-If topological errors are found, they will be
         resolved.
     in_barriers {Feature Layer}:
         Inputs containing features that will act as barriers for smoothing.
         The resulting smoothed polygons will not touch or cross barrier
         features.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output polygon feature class to be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SmoothPolygon_cartography(
                *gp_fixargs(
                    (in_features, out_feature_class, algorithm, tolerance, endpoint_option, error_option, in_barriers),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SmoothSharedEdges_cartography", None)
def SmoothSharedEdges(
    in_features=None,
    algorithm: Literal["PAEK", "BEZIER_INTERPOLATION"] | None = None,
    tolerance=None,
    shared_edge_features=None,
    in_barriers=None,
) -> Result2[str | Layer, str | Layer]:
    """SmoothSharedEdges_cartography(in_features;in_features..., algorithm, tolerance, {shared_edge_features;shared_edge_features...}, {in_barriers;in_barriers...})

       Smooths the edges of the input features while maintaining the
       topological relationship with edges shared with other features.

    INPUTS:
     in_features (Feature Layer):
         The lines or polygons to be smoothed.
     algorithm (String):
         Specifies the smoothing algorithm.PAEK-Calculates a smoothed polygon
         that will not pass through the
         input polygon vertices. It is the acronym for Polynomial Approximation
         with Exponential Kernel. This is the default.BEZIER_INTERPOLATION-Fits
         Bezier curves between vertices. The
         resulting polygons pass through the vertices of the input polygons.
         This algorithm does not require a tolerance. Bezier curves will be
         approximated in the output.
     tolerance (Linear Unit):
         Determines the degree of smoothing. A unit can be specified; if no
         unit is specified, the unit of the input will be used. This is only
         used for the PAEK algorithm. The parameter will not appear on the tool
         dialog box when Bezier interpolation is selected and, in scripting, a
         value of 0 must be used.
     shared_edge_features {Feature Layer}:
         Line or polygon features that will be smoothed along edges shared with
         input features. Other edges are not smoothed.
     in_barriers {Feature Layer}:
         Point, line, or polygon features that act as barriers for smoothing.
         The smoothed features will not touch or cross barrier features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SmoothSharedEdges_cartography(
                *gp_fixargs((in_features, algorithm, tolerance, shared_edge_features, in_barriers), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ThinRoadNetwork_cartography", None)
def ThinRoadNetwork(
    in_features=None,
    minimum_length=None,
    invisibility_field=None,
    hierarchy_field=None,
) -> Result1[str | Layer]:
    """ThinRoadNetwork_cartography(in_features;in_features..., minimum_length, invisibility_field, hierarchy_field)

       Generates a simplified road network that retains connectivity and
       general character for display at a smaller scale.

    INPUTS:
     in_features (Feature Layer):
         The input linear roads that will be thinned to create a simplified
         collection for display at smaller scales.
     minimum_length (Linear Unit):
         An indication of the shortest road segment that is sensible to display
         at the output scale. This controls the resolution, or density, of the
         resulting road collection. If the units are in points, millimeters,
         centimeters, or inches, the value is considered in page units and the
         reference scale is taken into account.
     invisibility_field (String):
         The field that stores the results of the tool. Features that
         participate in the resulting simplified road collection have a value
         of 0 (zero). Those that are extraneous have a value of 1. A layer
         definition query can be used to display the resulting road collection.
         This field must be present and named the same for each input feature
         class. The data type must be short or long integer.
     hierarchy_field (String):
         The field that contains hierarchical ranking of feature importance in
         which 1 is very important and larger integers reflect decreasing
         importance. A value of 0 forces the feature to remain visible in the
         output collection. This field must be present and named the same for
         each input feature class. The data type must be short or long integer.
         Hierarchy values equal to NULL are not accepted and will produce an
         error."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ThinRoadNetwork_cartography(
                *gp_fixargs((in_features, minimum_length, invisibility_field, hierarchy_field), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# Graphic Conflicts toolset
@gptooldoc("DetectGraphicConflict_cartography", None)
def DetectGraphicConflict(
    in_features=None,
    conflict_features=None,
    out_feature_class=None,
    conflict_distance=None,
    line_connection_allowance=None,
) -> Result1[str]:
    """DetectGraphicConflict_cartography(in_features, conflict_features, out_feature_class, {conflict_distance}, {line_connection_allowance})

       Creates polygons where two or more symbolized features graphically
       conflict.

    INPUTS:
     in_features (Layer):
         The input feature layer containing symbolized features. CAD, coverage,
         or VPF annotation, and dimensions, charts, dot-density or proportional
         symbols, raster layers, network datasets, and 3D symbols are not
         acceptable inputs.
     conflict_features (Layer):
         The feature layer containing symbolized features potentially in
         conflict with symbolized features in the input layer.
     conflict_distance {Linear Unit}:
         The area where input and conflict symbology is closer than a certain
         distance. Temporary buffers one-half the size of the conflict distance
         value are created around symbols in both the input and conflict
         layers. Conflict polygons will be generated where these buffers
         overlap. Conflict distance is measured in page units (points, inches,
         millimeters, or centimeters). If you enter a conflict distance in map
         units, it will be converted to page units using the reference scale.
         The default conflict distance is 0, where no buffers are created and
         only symbols that physically overlap one another are detected as
         conflicts.
     line_connection_allowance {Linear Unit}:
         The radius of a circle, centered where lines join, within which
         graphic overlaps won't be detected. This parameter is only considered
         when the input layer and the conflict layer are identical. Zero
         allowance will detect a conflict at each line join (if end caps are
         overlapping). Line connection allowance is calculated in page units
         (points, inches, millimeters, or centimeters). If you enter an
         allowance in map units, it will be converted to page units using the
         reference scale. The value cannot be negative; the default value is 1
         point.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class to be created to store conflict polygons. It
         cannot be one of the feature classes associated with the input layers."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DetectGraphicConflict_cartography(
                *gp_fixargs(
                    (in_features, conflict_features, out_feature_class, conflict_distance, line_connection_allowance),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PropagateDisplacement_cartography", None)
def PropagateDisplacement(
    in_features=None,
    displacement_features=None,
    adjustment_style: Literal["AUTO", "SOLID", "ELASTIC"] | None = None,
) -> Result1[str | Layer]:
    """PropagateDisplacement_cartography(in_features, displacement_features, adjustment_style)

       Propagates the displacement resulting from road adjustment in the
       Resolve Road Conflicts and Merge Divided Roads tools to adjacent
       features to reestablish spatial relationships.

    INPUTS:
     in_features (Feature Layer):
         The input feature layer containing features that may be in conflict.
         May be point, line, or polygon.
     displacement_features (Feature Layer):
         The displacement polygon features created by the Resolve Road
         Conflicts or the Merge Divided Roads tools that contain the degree and
         direction of road displacement that took place. These polygons dictate
         the amount of displacement that will be propagated to the input
         features.
     adjustment_style (String):
         Defines the type of adjustment that will be used when displacing input
         features.AUTO-The tool will decide for each input feature whether a
         SOLID or an
         ELASTIC adjustment is most appropriate. In general, features with
         orthogonal shapes will have SOLID adjustment applied, while
         organically shaped features will have ELASTIC adjustment applied. This
         is the default.SOLID-The feature will be translated. All vertices will
         move the same
         distance and direction. Topological errors may be introduced. This
         option is most useful when input features have regular geometric
         shapes.ELASTIC-The vertices of the feature may be moved independently
         to best
         fit the feature to the road network. The shape of the feature may be
         modified slightly. Topological errors are less likely to be
         introduced. This option only applies to line and polygon input
         features. This option is most useful for organically shaped input
         features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PropagateDisplacement_cartography(
                *gp_fixargs((in_features, displacement_features, adjustment_style), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ResolveBuildingConflicts_cartography", None)
def ResolveBuildingConflicts(
    in_buildings=None,
    invisibility_field=None,
    in_barriers=None,
    building_gap=None,
    minimum_size=None,
    hierarchy_field=None,
) -> Result1[str | Layer]:
    """ResolveBuildingConflicts_cartography(in_buildings;in_buildings..., invisibility_field, in_barriers;in_barriers..., building_gap, minimum_size, {hierarchy_field})

       Resolves symbol conflicts among buildings with respect to linear
       barrier features by moving, resizing, or hiding buildings.

    INPUTS:
     in_buildings (Layer):
         The input layers containing building features that may be in conflict
         or smaller than allowable size. Buildings can be either points or
         polygons. Buildings will be modified to resolve conflicts with other
         buildings and with barrier features. When point building layers
         are used as inputs, theproperty of
         the marker symbol layer must be set to a field in the feature class.
         This field will store the rotation adjustments. If multiple marker
         symbol layers in the same point symbol have theproperty connected to
         the same field, thesetting must match in each of those marker symbol
         layers. AngleAngleRotate clockwise
     invisibility_field (String):
         The short or long integer field that stores the invisibility values
         that can be used to remove some buildings from display to resolve
         symbol conflicts. Buildings with a value of 1 will be removed from
         display; those with a value of 0 will not be removed. Use a definition
         query on the layer to display visible buildings only. No features are
         deleted.
     in_barriers (Value Table):
         The layers containing the linear or polygon features that are conflict
         barriers for input building features. Buildings will be modified to
         resolve conflicts between buildings and barriers. The orient value is
         Boolean, specifying whether buildings will be oriented to the barrier
         layer. Gap specifies the distance that buildings will move
         toward or
         away from the barrier layer. A unit must be provided with the value.
         A gap value of 0 will snap buildings directly to the edge of the
         barrier line or outline symbology.A null (unspecified) gap value means
         that buildings will not be moved
         toward or away from barrier lines or outlines except movement required
         by conflict resolution.If no unit is provided with the gap value (that
         is, 10 instead of 10
         meters), the linear unit from the input feature's coordinate system
         will be used.
     building_gap (Linear Unit):
         The minimum allowable distance between symbolized buildings at scale.
         Buildings that are closer together will be displaced or hidden to
         enforce this distance. The minimum allowable distance is set relative
         to the reference scale (that is, 15 meters at 1:50,000 scale). The
         value is 0 if the reference scale is not set.
     minimum_size (Linear Unit):
         The minimum allowable size of the shortest side of a rotated best-fit
         bounding box around the symbolized building feature drawn at the
         reference scale. Buildings with a bounding box side smaller than this
         value will be enlarged to meet it. Resizing may occur
         nonproportionally, resulting in a change to the building morphology.
     hierarchy_field {String}:
         The short or long integer field that contains hierarchical ranking of
         feature importance in which 1 is very important and larger integers
         reflect decreasing importance. A value of 0 causes the building to
         retain visibility, although it may be moved somewhat to resolve
         conflicts. If this parameter is not used, feature importance will be
         assessed by the tool based on perimeter length and proximity to
         barrier features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ResolveBuildingConflicts_cartography(
                *gp_fixargs(
                    (in_buildings, invisibility_field, in_barriers, building_gap, minimum_size, hierarchy_field), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ResolveRoadConflicts_cartography", None)
def ResolveRoadConflicts(
    in_layers=None,
    hierarchy_field=None,
    out_displacement_features=None,
) -> Result2[str, str | Layer]:
    """ResolveRoadConflicts_cartography(in_layers;in_layers..., hierarchy_field, {out_displacement_features})

       Resolves graphic conflicts among symbolized road features by adjusting
       portions of line segments.

    INPUTS:
     in_layers (Layer):
         The input feature layers containing symbolized road features that may
         be in conflict.
     hierarchy_field (String):
         The field that contains hierarchical ranking of feature importance in
         which 1 is very important and larger integers reflect decreasing
         importance. A value of 0 (zero) locks the feature to ensure that it is
         not moved. This field must be present and named the same for all input
         feature classes. The data type must be short or long integer.

    OUTPUTS:
     out_displacement_features {Feature Class}:
         The output polygon features containing the degree and direction of
         road displacement that will be used by the Propagate Displacement tool
         to preserve spatial relationships."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ResolveRoadConflicts_cartography(
                *gp_fixargs((in_layers, hierarchy_field, out_displacement_features), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# Map Series toolset
@gptooldoc("CalculateAdjacentFields_cartography", None)
def CalculateAdjacentFields(
    in_features=None,
    in_field=None,
) -> Result1[str | Layer]:
    """CalculateAdjacentFields_cartography(in_features, in_field)

       Creates fields and calculates values for the neighboring pages
       (polygon) of a grid polygon feature class.

    INPUTS:
     in_features (Feature Layer):
         The polygon grid index features that will be appended with adjacent
         field data.
     in_field (Field):
         The field whose values will be used to populate adjacent field data."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateAdjacentFields_cartography(*gp_fixargs((in_features, in_field), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateCentralMeridianAndParallels_cartography", None)
def CalculateCentralMeridianAndParallels(
    in_features=None,
    in_field=None,
    standard_offset=None,
) -> Result1[str | Layer]:
    """CalculateCentralMeridianAndParallels_cartography(in_features, in_field, {standard_offset})

       Calculates the central meridian and optional standard parallels based
       on the center point of a feature's extent; stores this coordinate
       system as a spatial reference string in a specified text field; and
       repeats this for a set, or subset, of features. This field can be used
       with a spatial map series to update the data frame coordinate system
       for each page.

    INPUTS:
     in_features (Feature Layer):
         The input feature layer.
     in_field (Field):
         The text field where the coordinate system string will be stored.
     standard_offset {Double}:
         The percentage of the height of the input feature used to offset the
         standard parallels from the center latitude of the input feature. The
         default is 25 percent or 0.25. Negative values and values greater than
         1 are acceptable inputs."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateCentralMeridianAndParallels_cartography(
                *gp_fixargs((in_features, in_field, standard_offset), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateGridConvergenceAngle_cartography", None)
def CalculateGridConvergenceAngle(
    in_features=None,
    angle_field=None,
    rotation_method: Literal["GEOGRAPHIC", "ARITHMETIC", "GRAPHIC"] | None = None,
    coordinate_sys_field=None,
) -> Result1[str | Layer]:
    """CalculateGridConvergenceAngle_cartography(in_features, angle_field, {rotation_method}, {coordinate_sys_field})

       Calculates the rotation angle for true north based on the center point
       of each feature in a feature class and populates this value in a
       specified field. This field can be used in conjunction with a spatial
       map series to rotate each map to true north.

    INPUTS:
     in_features (Feature Layer):
         The input feature class (points, multipoints, lines, and polygons).
     angle_field (Field):
         The existing field that will be populated with the true north
         calculation value in decimal degrees.
     rotation_method {String}:
         Specifies the method used to calculate the rotation
         value.GEOGRAPHIC-The angle is calculated clockwise with 0 at the top.
         This
         is the default.ARITHMETIC-The angle is calculated counterclockwise
         with 0 at the
         right.GRAPHIC-The angle is calculated counterclockwise with 0 at the
         top.
     coordinate_sys_field {Field}:
         The field containing a projection engine string for a projected
         coordinate system to be used for angle calculation. The angle
         calculation for each feature will be based on the projected coordinate
         system projection engine string for the specific feature. In cases of
         an invalid value, the tool will use the cartographic coordinate system
         specified in the Cartography environment settings. The default is
         none, or no field specified. When no field is specified, the projected
         coordinate system used for calculation will be taken from the
         Cartography environment settings."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateGridConvergenceAngle_cartography(
                *gp_fixargs((in_features, angle_field, rotation_method, coordinate_sys_field), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateUTMZone_cartography", None)
def CalculateUTMZone(
    in_features=None,
    in_field=None,
) -> Result1[str | Layer]:
    """CalculateUTMZone_cartography(in_features, in_field)

       Calculates the UTM zone of each feature based on the center point and
       stores this spatial reference string in a specified field. This field
       can be used with a spatial map series to update the spatial reference
       to the correct UTM zone for each map.

    INPUTS:
     in_features (Feature Layer):
         The input feature layer.
     in_field (Field):
         The string field that stores the spatial reference string for the
         coordinate system. The field should have sufficient length (more than
         600 characters) to hold the spatial reference string."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateUTMZone_cartography(*gp_fixargs((in_features, in_field), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GridIndexFeatures_cartography", None)
def GridIndexFeatures(
    out_feature_class=None,
    in_features=None,
    intersect_feature: Literal["INTERSECTFEATURE", "NO_INTERSECTFEATURE"] | None = None,
    use_page_unit: Literal["USEPAGEUNIT", "NO_USEPAGEUNIT"] | None = None,
    scale=None,
    polygon_width=None,
    polygon_height=None,
    origin_coord=None,
    number_rows=None,
    number_columns=None,
    starting_page_number=None,
    label_from_origin: Literal["LABELFROMORIGIN", "NO_LABELFROMORIGIN"] | None = None,
) -> Result1[str]:
    """GridIndexFeatures_cartography(out_feature_class, {in_features;in_features...}, {intersect_feature}, {use_page_unit}, {scale}, {polygon_width}, {polygon_height}, {origin_coord}, {number_rows}, {number_columns}, {starting_page_number}, {label_from_origin})

       Creates a grid of rectangular polygon features that can be used as an
       index to specify pages in a spatial map series. A grid can be created
       that includes only polygon features that intersect another feature
       layer.

    INPUTS:
     in_features {Feature Layer / Raster Layer}:
         The input features to be used to define the extent of the polygon grid
         that will be created.
     intersect_feature {Boolean}:
         Limits the output grid feature class to areas that intersect input
         feature layers or datasets. The intersection of input features will be
         used to create index features.INTERSECTFEATURE-Limits the output grid
         feature class to areas that
         intersect input feature layers or datasets. When input features are
         specified, this is the default.NO_INTERSECTFEATURE-An output grid
         feature class is created using
         specified coordinates, rows, and columns.
     use_page_unit {Boolean}:
         Specifies whether index polygon size input is in page
         units.USEPAGEUNIT-Index polygon height and width are calculated in
         page
         units.NO_USEPAGEUNIT-Index polygon height and width are calculated in
         map
         units. This is the default.
     scale {Long}:
         The map scale. The scale must be specified if the index polygon height
         and width are to be calculated in page units. If the tool is used
         outside an active ArcGIS Pro session, the default scale value is 1.
     polygon_width {Linear Unit}:
         The width of the index polygon specified in either map or page units.
         If page units are used, the default value is 1 inch. If map units are
         used, the default value is 1 degree.
     polygon_height {Linear Unit}:
         The height of the index polygon specified in either map or page units.
         If page units are used, the default value is 1 inch. If map units are
         used, the default value is 1 degree.
     origin_coord {Point}:
         The coordinate value for the lower left origin of the output grid
         feature class. If input features are specified, the default value is
         determined by the extent of the union of extents for these features.
         If there are no input features specified, the default coordinates are
         0 and 0.
     number_rows {Long}:
         The number of rows to create in the y direction from the point of
         origin. The default is 10.
     number_columns {Long}:
         The number of columns to create in the x direction from the point of
         origin. The default is 10.
     starting_page_number {Long}:
         Each grid index feature is assigned a sequential page number starting
         with a specified starting page number. The default is 1.
     label_from_origin {Boolean}:
         Specifies where page numbers (labels) begin.LABELFROMORIGIN-Page
         numbers (labels) begin with the polygon feature
         in the lower left corner of the output grid.NO_LABELFROMORIGIN-Page
         numbers (labels) begin with the polygon
         feature in the upper left corner of the output grid. This is the
         default.

    OUTPUTS:
     out_feature_class (Feature Class):
         The resulting feature class of polygon index features.The coordinate
         system of the output feature class is determined in the
         following order:If a coordinate system is specified by the Output
         Coordinate System
         environment, the output feature class will use this coordinate
         system.If a coordinate system is not specified by the Output
         Coordinate
         System environment, the output feature class will use the coordinate
         system of the active map (ArcGIS Pro is open).If a coordinate system
         is not specified by the Output Coordinate
         System environment, and there is no active map (ArcGIS Pro is not
         open), the output feature class will use the coordinate system of the
         first input feature.If a coordinate system is not specified by the
         Output Coordinate
         System environment, there is no active map (ArcGIS Pro is not open),
         and there are no specified input features, the coordinate system of
         the output feature class will be unknown."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GridIndexFeatures_cartography(
                *gp_fixargs(
                    (
                        out_feature_class,
                        in_features,
                        intersect_feature,
                        use_page_unit,
                        scale,
                        polygon_width,
                        polygon_height,
                        origin_coord,
                        number_rows,
                        number_columns,
                        starting_page_number,
                        label_from_origin,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("StripMapIndexFeatures_cartography", None)
def StripMapIndexFeatures(
    in_features=None,
    out_feature_class=None,
    use_page_unit: Literal["USEPAGEUNIT", "NO_USEPAGEUNIT"] | None = None,
    scale=None,
    length_along_line=None,
    length_perpendicular_to_line=None,
    page_orientation: Literal["HORIZONTAL", "VERTICAL"] | None = None,
    overlap_percentage=None,
    starting_page_number=None,
    direction_type: Literal["WE_NS", "WE_SN", "EW_NS", "EW_SN"] | None = None,
) -> Result1[str]:
    """StripMapIndexFeatures_cartography(in_features, out_feature_class, {use_page_unit}, {scale}, {length_along_line}, {length_perpendicular_to_line}, {page_orientation}, {overlap_percentage}, {starting_page_number}, {direction_type})

       Creates a series of rectangular polygons, or index features, that
       follow a single linear feature or a group of linear features. These
       index features can be used with spatial map series to define pages in
       a strip map or a set of maps that follow a linear feature. The
       resulting index features contain attributes that can be used to rotate
       and orient the map on the page and determine which index features, or
       pages, are next to the current page (to the left and right or to the
       top and bottom).

    INPUTS:
     in_features (Feature Layer):
         The input polyline features defining the path of the strip map index
         features.
     use_page_unit {Boolean}:
         Specifies whether index feature size input is in page
         units.USEPAGEUNIT-Index polygon height and width are calculated in
         page
         units.NO_USEPAGEUNIT-Index polygon height and width are calculated in
         map
         units. This is the default.
     scale {Long}:
         Map scale must be specified if index feature lengths (along the line
         and perpendicular to the line) are to be calculated in page units. If
         you're using ArcGIS Pro, the default value will be the scale of the
         active data frame; otherwise, the default will be 1.
     length_along_line {Linear Unit}:
         The length of the polygon index feature along the input line feature
         specified in either map or page units. The default value is determined
         by the spatial reference of the input line feature or features. This
         value will be 1/100 of the input feature class extent along the x
         axis.
     length_perpendicular_to_line {Linear Unit}:
         The length of the polygon index feature perpendicular to the input
         line feature specified in either map or page units. The default value
         is determined by the spatial reference of the input line feature or
         features. This value will be one-half the number used for the length
         along the line.
     page_orientation {String}:
         Specifies the orientation of the input line features on the layout
         page.VERTICAL-The direction of the strip map series on the page is top
         to
         bottom.HORIZONTAL-The direction of the strip map series on the page is
         left
         to right. This is the default.
     overlap_percentage {Double}:
         The approximate percentage of geographic overlap between an individual
         map page and its adjoining pages in the series. The default is 10.
     starting_page_number {Long}:
         The page number of the starting page. Each grid index feature is
         assigned a sequential page number beginning with the specified
         starting page number. The default is 1.
     direction_type {String}:
         Specifies the initial direction of the strip maps.WE_NS-If the line's
         directional trend is West to East, the starting
         point will be at the westernmost end of the line, or if the line's
         direction trend is North to South, the starting point will be at the
         northernmost end of the line. This is the default.WE_SN-If the line's
         directional trend is West to East, the starting
         point will be at the westernmost end of the line, or if the line's
         direction trend is South to North, the starting point will be at the
         southernmost end of the line.EW_NS-If the line's directional trend is
         East to West, the starting
         point will be at the easternmost end of the line, or if the line's
         direction trend is North to South, the starting point will be at the
         northernmost end of the line.EW_SN-If the line's directional trend is
         East to West, the starting
         point will be at the easternmost end of the line, or if the line's
         direction trend is South to North, the starting point will be at the
         southernmost end of the line.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class of polygon index features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.StripMapIndexFeatures_cartography(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        use_page_unit,
                        scale,
                        length_along_line,
                        length_perpendicular_to_line,
                        page_orientation,
                        overlap_percentage,
                        starting_page_number,
                        direction_type,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Masking toolset
@gptooldoc("CulDeSacMasks_cartography", None)
def CulDeSacMasks(
    input_layer=None,
    output_fc=None,
    reference_scale=None,
    spatial_reference=None,
    margin=None,
    attributes: Literal["NO_FID", "ONLY_FID", "ALL"] | None = None,
) -> Result1[str]:
    """CulDeSacMasks_cartography(input_layer, output_fc, reference_scale, spatial_reference, margin, attributes)

       Creates a feature class of polygon masks from a symbolized input line
       layer.

    INPUTS:
     input_layer (Layer):
         The input line layer from which the masks will be created.
     reference_scale (Double):
         The reference scale used for calculating the masking geometry when
         masks are specified in page units. This is typically the reference
         scale of the map.
     spatial_reference (Spatial Reference):
         The spatial reference of the map in which the masking polygons will be
         created. This is not the spatial reference that will be assigned to
         the output feature class. It is the spatial reference of the map in
         which the masking polygons will be used, since the position of
         symbology may change when features are projected.
     margin (Linear Unit):
         The space in page units surrounding the symbolized input features used
         to create the mask polygons. Typically, masking polygons are created
         with a small margin around the symbol to improve visual appearance.
         Margin values are specified in either page units or map units. Most of
         the time, you will specify your margin distance value in page
         units.The margin cannot be negative.
     attributes (String):
         Specifies the attributes that will be transferred from the input
         features to the output features.ONLY_FID-Only the FID field from the
         input features will be
         transferred to the output features. This is the default.NO_FID-All the
         attributes except the FID from the input features will
         be transferred to the output features.ALL-All the attributes from the
         input features will be transferred to
         the output features.

    OUTPUTS:
     output_fc (Feature Class):
         The feature class that will contain the mask features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CulDeSacMasks_cartography(
                *gp_fixargs((input_layer, output_fc, reference_scale, spatial_reference, margin, attributes), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FeatureOutlineMasks_cartography", None)
def FeatureOutlineMasks(
    input_layer=None,
    output_fc=None,
    reference_scale=None,
    spatial_reference=None,
    margin=None,
    method: Literal["BOX", "CONVEX_HULL", "EXACT_SIMPLIFIED", "EXACT"] | None = None,
    mask_for_non_placed_anno: Literal["ALL_FEATURES", "ONLY_PLACED"] | None = None,
    attributes: Literal["NO_FID", "ONLY_FID", "ALL"] | None = None,
    preserve_small_sized_features: Literal["PRESERVE_SMALL_SIZED_FEATURES", "DO_NOT_PRESERVE_SMALL_SIZED_FEATURES"]
    | None = None,
) -> Result1[str]:
    """FeatureOutlineMasks_cartography(input_layer, output_fc, reference_scale, spatial_reference, margin, method, mask_for_non_placed_anno, attributes, {preserve_small_sized_features})

       Creates mask polygons at a specified distance and shape around the
       symbolized features in the input layer.

    INPUTS:
     input_layer (Annotation Layer / Layer):
         The symbolized input layer from which the masks will be created.
     reference_scale (Double):
         The reference scale that will be used for calculating the masking
         geometry when masks are specified in page units. This is typically the
         reference scale of the map.
     spatial_reference (Spatial Reference):
         The spatial reference of the map in which the masking polygons will be
         created. This is not the spatial reference that will be assigned to
         the output feature class. It is the spatial reference of the map in
         which the masking polygons will be used, since the position of
         symbology may change when features are projected.
     margin (Linear Unit):
         The space in page units surrounding the symbolized input features used
         to create the mask polygons. Typically, masking polygons are created
         with a small margin around the symbol to improve visual appearance.
         Margin values can be specified in either page units or map units.The
         margin cannot be negative.
     method (String):
         Specifies the type of masking geometry that will be created.BOX-A
         polygon representing the extent of the symbolized feature will
         be created.CONVEX_HULL-The convex hull of the symbolized geometry of
         the feature
         will be created. This is the default.EXACT_SIMPLIFIED-A generalized
         polygon representing the exact shape of
         the symbolized feature will be created. Polygons created with this
         method will have a significantly smaller number of vertices compared
         to polygons created with the EXACT option.EXACT-A polygon representing
         the exact shape of the symbolized feature
         will be created.
     mask_for_non_placed_anno (String):
         Specifies whether masks for unplaced annotation will be created. This
         parameter is only used when masking geodatabase annotation
         layers.ALL_FEATURES-Masks will be created for all annotation features.
         This
         is the default.ONLY_PLACED-Masks will only be created for features
         with a status of
         placed.
     attributes (String):
         Specifies the attributes that will be transferred from the input
         features to the output features.ONLY_FID-Only the FID field from the
         input features will be
         transferred to the output features. This is the default.NO_FID-All
         attributes except the FID field from the input features
         will be transferred to the output features.ALL-All attributes from
         the input features will be transferred to the
         output features.
     preserve_small_sized_features {Boolean}:
         Specifies whether small mask features will be included in the output
         feature class.DO_NOT_PRESERVE_SMALL_SIZED_FEATURES-Small mask features
         will not be
         included in the output feature class. This is the
         default.PRESERVE_SMALL_SIZED_FEATURES-All mask features will be
         included in
         the output feature class.

    OUTPUTS:
     output_fc (Feature Class):
         The feature class that will contain the mask features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FeatureOutlineMasks_cartography(
                *gp_fixargs(
                    (
                        input_layer,
                        output_fc,
                        reference_scale,
                        spatial_reference,
                        margin,
                        method,
                        mask_for_non_placed_anno,
                        attributes,
                        preserve_small_sized_features,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("IntersectingLayersMasks_cartography", None)
def IntersectingLayersMasks(
    masking_layer=None,
    masked_layer=None,
    output_fc=None,
    reference_scale=None,
    spatial_reference=None,
    margin=None,
    method: Literal["BOX", "CONVEX_HULL", "EXACT_SIMPLIFIED", "EXACT"] | None = None,
    mask_for_non_placed_anno: Literal["ALL_FEATURES", "ONLY_PLACED"] | None = None,
    attributes: Literal["NO_FID", "ONLY_FID", "ALL"] | None = None,
) -> Result1[str]:
    """IntersectingLayersMasks_cartography(masking_layer, masked_layer, output_fc, reference_scale, spatial_reference, margin, method, mask_for_non_placed_anno, attributes)

       Creates masking polygons at a specified shape and size at the
       intersection of two symbolized input layers: the masking layer and the
       masked layer.

    INPUTS:
     masking_layer (Annotation Layer / Layer):
         The symbolized input layer that will intersect the masked layer to
         create masking polygons. This is the layer that will be displayed when
         masking is applied to the masked layer.
     masked_layer (Annotation Layer / Layer):
         The symbolized input layer that will be masked. This is the layer that
         will be obscured by the masking polygons.
     reference_scale (Double):
         The reference scale that will be used for calculating the masking
         geometry when masks are specified in page units. This is typically the
         reference scale of the map.
     spatial_reference (Spatial Reference):
         The spatial reference of the map in which the masking polygons will be
         created. This is not the spatial reference that will be assigned to
         the output feature class. It is the spatial reference of the map in
         which the masking polygons will be used, since the position of
         symbology may change when features are projected.
     margin (Linear Unit):
         The space in page units surrounding the symbolized input features used
         to create the mask polygons. Typically, masking polygons are created
         with a small margin around the symbol to improve visual appearance.
         Margin values can be specified in either page units or map units. Most
         of the time margin distance values are specified in page units.The
         margin cannot be negative.
     method (String):
         Specifies the type of masking geometry that will be created.BOX-A
         polygon representing the extent of the symbolized feature will
         be created.CONVEX_HULL-The convex hull of the symbolized geometry of
         the feature
         will be created. This is the default.EXACT_SIMPLIFIED-A generalized
         polygon representing the exact shape of
         the symbolized feature will be created. Polygons created with this
         method will have a significantly smaller number of vertices compared
         to polygons created with the EXACT option.EXACT-A polygon representing
         the exact shape of the symbolized feature
         will be created.
     mask_for_non_placed_anno (String):
         Specifies whether masks for unplaced annotation will be created. This
         parameter is only used when masking geodatabase annotation
         layers.ALL_FEATURES-Masks will be created for all annotation features.
         This
         is the default.ONLY_PLACED-Masks will only be created for features
         with a status of
         placed.
     attributes (String):
         Specifies the attributes that will be transferred from the input
         features to the output features.ONLY_FID-Only the FID field from the
         input features will be
         transferred to the output features. This is the default.NO_FID-All the
         attributes except the FID from the input features will
         be transferred to the output features.ALL-All the attributes from the
         input features will be transferred to
         the output features.

    OUTPUTS:
     output_fc (Feature Class):
         The feature class that will contain the mask features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.IntersectingLayersMasks_cartography(
                *gp_fixargs(
                    (
                        masking_layer,
                        masked_layer,
                        output_fc,
                        reference_scale,
                        spatial_reference,
                        margin,
                        method,
                        mask_for_non_placed_anno,
                        attributes,
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
