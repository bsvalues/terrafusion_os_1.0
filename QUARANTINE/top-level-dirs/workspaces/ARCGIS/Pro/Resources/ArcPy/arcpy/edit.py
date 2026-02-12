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
r"""The Editing tools allow you to apply bulk editing to all (or selected)
features in a feature class."""
from __future__ import annotations

__all__ = [
    "AlignFeatures",
    "CalculateTransformationErrors",
    "Densify",
    "EdgematchFeatures",
    "ErasePoint",
    "ExtendLine",
    "FlipLine",
    "Generalize",
    "GenerateEdgematchLinks",
    "GenerateRubbersheetLinks",
    "RubbersheetFeatures",
    "SimplifyByStraightLinesAndCircularArcs",
    "Snap",
    "SplitLineByMatch",
    "TransferAttributes",
    "TransformFeatures",
    "TrimLine",
    "UpdateCOGO",
]
__alias__ = "edit"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Tools
@gptooldoc("Densify_edit", None)
def Densify(
    in_features=None,
    densification_method: Literal["DISTANCE", "OFFSET", "ANGLE"] | None = None,
    distance=None,
    max_deviation=None,
    max_angle=None,
    max_vertex_per_segment=None,
) -> Result1[str | Layer]:
    """Densify_edit(in_features, {densification_method}, {distance}, {max_deviation}, {max_angle}, {max_vertex_per_segment})

       Adds vertices along line or polygon features and replaces curve
       segments (Bezier, circular arcs, and elliptical arcs) with line
       segments.

    INPUTS:
     in_features (Feature Layer):
         The polygon or line feature class to be densified.
     densification_method {String}:
         Specifies the feature densification method to be
         used.DISTANCE-Straight lines and curves will be densified using the
         specified distance. This is the default.OFFSET-Curves will be
         densified using the specified maximum offset
         deviation.ANGLE-Curves will be densified using the specified maximum
         deflection
         angle.
     distance {Linear Unit}:
         The maximum distance between vertices. This distance will always be
         applied to line segments and to simplify curves. The default value is
         a function of the data's x,y tolerance.New vertices may not be
         inserted at this exact interval along the
         line, rather they will be inserted within this distance of the
         previous vertex. There is no way to ensure that a vertex is added
         exactly at the specified interval along the line segment.
     max_deviation {Linear Unit}:
         The maximum distance the output segment will be from the original.
         This parameter only affects curves. The default value is a function of
         the data's x,y tolerance.
     max_angle {Double}:
         The maximum angle the output geometry can be from the input geometry.
         The valid range is 0 to 90. The default value is 10. This parameter
         only affects curves.
     max_vertex_per_segment {Long}:
         The maximum vertex count allowed per segment. If no value or an
         invalid value (0 or less) is entered, there will be no vertex limit
         for linear segments, and curve segments will have a default of 12000."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Densify_edit(
                *gp_fixargs(
                    (in_features, densification_method, distance, max_deviation, max_angle, max_vertex_per_segment),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ErasePoint_edit", None)
def ErasePoint(
    in_features=None,
    remove_features=None,
    operation_type: Literal["INSIDE", "OUTSIDE"] | None = None,
) -> Result1[str | Layer]:
    """ErasePoint_edit(in_features, remove_features, {operation_type})

       Deletes points from the input that are either inside or outside the
       remove features, depending on the operation type.

    INPUTS:
     in_features (Feature Layer):
         The input point features.
     remove_features (Feature Layer):
         The polygon features that will be used to determine which features
         from the in_features value will be deleted.
     operation_type {String}:
         Specifies whether points inside or outside the remove features will be
         deleted.INSIDE-Input point features inside or on the boundary of the
         remove
         features will be deleted.OUTSIDE-Input point features outside the
         remove features will be
         deleted."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ErasePoint_edit(*gp_fixargs((in_features, remove_features, operation_type), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExtendLine_edit", None)
def ExtendLine(
    in_features=None,
    length=None,
    extend_to: Literal["EXTENSION", "FEATURE"] | None = None,
) -> Result1[str | Layer]:
    """ExtendLine_edit(in_features, {length}, {extend_to})

       Extends line segments to the first intersecting feature within a
       specified distance. If no intersecting feature is within the specified
       distance, the line segment will not be extended. Tool use is intended
       for quality control tasks such as cleaning up topology errors in
       features that were digitized without having set proper snapping
       environments.

    INPUTS:
     in_features (Feature Layer):
         The line input features to be extended.
     length {Linear Unit}:
         The maximum distance a line segment can be extended to an intersecting
         feature.
     extend_to {Boolean}:
         Specifies whether line segments can be extended to other extended line
         segments within the specified extend length.EXTENSION-Line segments
         can be extended to other extended line
         segments as well as existing line features. This is the
         default.FEATURE-Line segments can only be extended to existing line
         features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.ExtendLine_edit(*gp_fixargs((in_features, length, extend_to), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("FlipLine_edit", None)
def FlipLine(
    in_features=None,
) -> Result1[str | Layer]:
    """FlipLine_edit(in_features)

       Reverses the from-to direction of line features.

    INPUTS:
     in_features (Feature Layer):
         The input line feature class or layer."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.FlipLine_edit(*gp_fixargs((in_features,), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("Generalize_edit", None)
def Generalize(
    in_features=None,
    tolerance=None,
) -> Result1[str | Layer]:
    """Generalize_edit(in_features, {tolerance})

       Simplifies the input features using a specified maximum offset
       tolerance. The output features will contain a subset of the original
       input vertices.

    INPUTS:
     in_features (Feature Layer):
         The polygon or line features to be generalized.
     tolerance {Linear Unit}:
         The tolerance sets the maximum allowable offset, which will determine
         the degree of simplification. This value limits the distance the
         output geometry can differ from the input geometry. You can specify a
         preferred unit of measurement. The default is the feature unit."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.Generalize_edit(*gp_fixargs((in_features, tolerance), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("SimplifyByStraightLinesAndCircularArcs_edit", None)
def SimplifyByStraightLinesAndCircularArcs(
    in_features=None,
    max_offset=None,
    fitting_type: Literal["FIT_TO_VERTICES", "FIT_TO_SEGMENTS"] | None = None,
    circular_arcs: Literal["CREATE", "NOT_CREATE"] | None = None,
    max_arc_angle_step=None,
    min_vertex_count=None,
    min_radius=None,
    max_radius=None,
    min_arc_angle=None,
    closed_ends: Literal["PRESERVE", "NOT_PRESERVE"] | None = None,
    anchor_points=None,
) -> Result2[str | Layer, str | Layer]:
    """SimplifyByStraightLinesAndCircularArcs_edit(in_features;in_features..., max_offset, {fitting_type}, {circular_arcs}, {max_arc_angle_step}, {min_vertex_count}, {min_radius}, {max_radius}, {min_arc_angle}, {closed_ends}, {anchor_points})

       Simplifies polygon and line features by replacing consecutive line
       segments or edges with fewer line segments or edges. Lines segments
       and polygon edges are simplified based on a specified maximum
       allowable offset. Additionally, circular arcs can be created from
       consecutive line segments or polygon edges.

    INPUTS:
     in_features (Feature Layer):
         The features to be simplified. Features can be lines or polygons. If
         using multiple inputs, the features must have the same spatial
         reference.
     max_offset (Linear Unit):
         The maximum distance the output feature edges can deviate from
         the input feature shapes. When theoption is specified for
         theparameter, the distance is measured between the input vertices and
         the output feature edges. When theoption is specified, the distance is
         measured between the input feature edges and the output feature edges.
         Fit to verticesFitting TypeFit to segments
     fitting_type {String}:
         Specifies how the output feature edges and circular arcs will be
         fitted to the input feature shapes. Ifis specified,
         theandparameters are not available. Fit
         to segmentsMaximum Arc Angle StepMinimum Number Of
         VerticesFIT_TO_VERTICES-The offset gap between the output feature
         edges and
         the input feature vertices will be minimized. Output feature edges and
         curves will be fitted approximately to the input feature vertex
         positions. This is the default.FIT_TO_SEGMENTS-The offset gap between
         the output feature edges and
         input feature edges will be minimized. Output edges and curves will be
         fitted approximately to the positions of the input feature shapes.
     circular_arcs {Boolean}:
         Specifies whether circular arcs will be created.CREATE-Circular arcs
         will be created. This is the
         default.NOT_CREATE-Circular arcs will not be created.
     max_arc_angle_step {Double}:
         The maximum arc angle step (decimal degrees) that will be used
         to construct circular arcs. The arc angle defines how wide the visual
         field can be, for each step, when locating vertices to construct
         circular curves. The arc angle is the central angle of the candidate
         curve (the curve that is being constructed). If vertices are found
         within each maximum arc angle step, a circular arc is constructed. For
         example, if vertices and edges are sparse, use a large arc angle step.
         The valid value range is from 2 through 95 decimal degrees. The
         default is 20 decimal degrees. This parameter is not available if
         theoption is specified for theparameter. Fit to segmentsFitting
         Type
     min_vertex_count {Long}:
         The minimum number of vertices required for a circular arc to
         be created. The value must be greater than 3. The default is 4. This
         parameter is not available if theoption is specified for theparameter.
         Fit to segmentsFitting Type
     min_radius {Linear Unit}:
         The smallest allowable radius for output circular arcs. The
         value must be greater than 0 and smaller than the value provided for.
         If no value is provided, the radius of the output circular arcs will
         not be checked (default). Maximum Radius
     max_radius {Linear Unit}:
         The largest allowable radius for output circular arcs. The
         value must be greater than the value provided for. If no value is
         provided, the radius of the output circular arcs will not checked
         (default). Minimum Radius
     min_arc_angle {Double}:
         The minimum arc angle (decimal degrees) that will be used to construct
         circular arcs. The minimum arc angle is the smallest allowable central
         angle in the output circular arcs. If the central angle of any output
         circular arc is less than this value, it will not be created. The
         valid value range is from 2 through 360 decimal degrees. The default
         is 2 decimal degrees.
     closed_ends {Boolean}:
         Specifies whether the endpoints of a closed line will be preserved. A
         closed line is a line that has coincident end points
         (loop).PRESERVE-The endpoints of closed lines will be preserved. This
         is the
         default.NOT_PRESERVE-The endpoints of closed lines will not be
         preserved; they
         can be moved or deleted.
     anchor_points {Feature Layer}:
         The path and name of the feature class that contains anchor points.
         Anchor points overlay vertices on the input features and indicate that
         they should not be moved or deleted in the simplify process."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SimplifyByStraightLinesAndCircularArcs_edit(
                *gp_fixargs(
                    (
                        in_features,
                        max_offset,
                        fitting_type,
                        circular_arcs,
                        max_arc_angle_step,
                        min_vertex_count,
                        min_radius,
                        max_radius,
                        min_arc_angle,
                        closed_ends,
                        anchor_points,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Snap_edit", None)
def Snap(
    in_features=None,
    snap_environment=None,
) -> Result1[str | Layer]:
    """Snap_edit(in_features, snap_environment;snap_environment...)

       Moves points or vertices to coincide exactly with the vertices, edges,
       or end points of other features. Snapping rules can be specified to
       control whether the input vertices are snapped to the nearest vertex,
       edge, or endpoint within a specified distance.

    INPUTS:
     in_features (Feature Layer):
         The input features with the vertices that will be snapped to the
         vertices, edges, or end points of other features. The input features
         can be points, multipoints, lines, or polygons.
     snap_environment (Value Table):
         The feature classes or feature layers containing the features to snap
         to.The snapping environment components are as follows:Features-The
         features that the input features' vertices will be
         snapped to. These features can be points, multipoints, lines, or
         polygons.Type-The type of feature part that the input features'
         vertices can be
         snapped to.Distance-The distance within which the input features'
         vertices will
         be snapped to the nearest end point, vertex, or edge.Available
         snapping types are as follows:END-Input feature vertices will be
         snapped to feature
         ends.VERTEX-Input feature vertices will be snapped to feature
         vertices.EDGE-Input feature vertices will be snapped to feature
         edges.If a distance is used without a unit (for example, 10 instead of
         10
         meters), the linear or angular unit from the input feature's
         coordinate system will be used as the default. If the input features
         have a projected coordinate system, its linear unit will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.Snap_edit(*gp_fixargs((in_features, snap_environment), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("TrimLine_edit", None)
def TrimLine(
    in_features=None,
    dangle_length=None,
    delete_shorts: Literal["DELETE_SHORT", "KEEP_SHORT"] | None = None,
) -> Result1[str | Layer]:
    """TrimLine_edit(in_features, {dangle_length}, {delete_shorts})

       Removes portions of a line that extend a specified distance past a
       line intersection (dangles). Any line that does not touch another line
       at both endpoints can be trimmed, but only the portion of the line
       that extends past the intersection by the specified distance will be
       removed.

    INPUTS:
     in_features (Feature Layer):
         The line input features to be trimmed.
     dangle_length {Linear Unit}:
         Line segments that are shorter than the specified dangle length and do
         not touch another line at both endpoints (dangles) will be trimmed.If
         a dangle length is not specified, all dangling lines (line segments
         that do not touch another line at both endpoints), regardless of
         length, will be trimmed back to the point of intersection.
     delete_shorts {Boolean}:
         Specifies whether line segments which are less than the dangle length
         and are free-standing will be deleted.DELETE_SHORT-Delete short free-
         standing features. This is the
         default.KEEP_SHORT-Do not delete short free-standing features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TrimLine_edit(*gp_fixargs((in_features, dangle_length, delete_shorts), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateCOGO_edit", None)
def UpdateCOGO(
    in_line_features=None,
    distances_type: Literal["OVERWRITE", "UPDATE_NULL_ONLY", "USE_MINIMUM_DIFFERENCE", "DO_NOT_UPDATE"] | None = None,
    distance_tolerance=None,
    direction_type: Literal["OVERWRITE", "UPDATE_NULL_ONLY", "USE_MINIMUM_DIFFERENCE", "DO_NOT_UPDATE"] | None = None,
    minimum_direction_difference=None,
    minimum_direction_lateral_offset=None,
    combined_scale_factor=None,
    direction_offset=None,
) -> Result1[str | Layer]:
    """UpdateCOGO_edit(in_line_features, {distances_type}, {distance_tolerance}, {direction_type}, {minimum_direction_difference}, {minimum_direction_lateral_offset}, {combined_scale_factor}, {direction_offset})

       Updates the COGO attributes of COGO-enabled line features to match
       their line shape geometries.

    INPUTS:
     in_line_features (Feature Layer):
         The COGO-enabled line features that will be updated.
     distances_type {String}:
         Specifies how the input line's,, andCOGO attributes will be
         updated. DistanceRadiusArc LengthOVERWRITE-All values
         (including NULL values) will be updated to match
         the shape length. This is the default.UPDATE_NULL_ONLY-Only NULL
         values will be updated to match the shape
         length.USE_MINIMUM_DIFFERENCE-Values that differ from the shape length
         by
         more than the specified tolerance will be updated to match the shape
         length.DO_NOT_UPDATE-Values will not be updated.
     distance_tolerance {Linear Unit}:
         The minimum distance difference between the line shape length
         and the value in the,, andfields. If the difference in the distances
         is larger than the specified tolerance, the attribute value in the,,
         orfields will be updated to match the line shape length. The default
         value is 0 meters. DistanceRadiusArc LengthDistanceRadiusArc
         Length
     direction_type {String}:
         Specifies how the input'sCOGO attributes will be updated.
         DirectionOVERWRITE-All values (including NULL values) will be updated
         to match
         shape direction. This is the default.UPDATE_NULL_ONLY-Only NULL values
         will be updated to match the shape
         direction.USE_MINIMUM_DIFFERENCE-Values that differ from the shape
         direction by
         more than the specified tolerance will be updated to match the shape
         direction.DO_NOT_UPDATE-Values will not be updated.
     minimum_direction_difference {Double}:
         The minimum direction difference (in seconds) between the line
         shape direction and the value in thefield. If the difference in the
         directions is larger than the specified tolerance, the attribute value
         in thefield will be updated to match the line shape direction. The
         default value is 0. DirectionDirection
     minimum_direction_lateral_offset {Linear Unit}:
         The minimum allowable distance between the endpoint of the
         line shape and the endpoint of the line drawn using the value in
         thefield. A lateral offset tolerance can be used for very long lines
         in which small changes in direction can result in large differences in
         line endpoints. The default value is 0 meters. Direction
     combined_scale_factor {Calculator Expression}:
         A scale factor based on a ground to grid correction that will
         be applied to the line's shape length. The scale factor can be
         provided as a number or derived from an Arcade expression using the
         line's attribute fields. The updated distance populated in the,,
         andfields is a result of the shape length multiplied by the scale
         factor. DistanceRadiusArc Length
     direction_offset {Calculator Expression}:
         A rotation based on a ground to grid correction that will be
         applied to the line's shape direction. The rotation offset can be
         provided as a value in seconds or derived from an Arcade expression
         using the line's attribute fields. The updated direction populated in
         the line'sfield is the line shape direction rotated by the specified
         direction offset. Direction"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpdateCOGO_edit(
                *gp_fixargs(
                    (
                        in_line_features,
                        distances_type,
                        distance_tolerance,
                        direction_type,
                        minimum_direction_difference,
                        minimum_direction_lateral_offset,
                        combined_scale_factor,
                        direction_offset,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Conflation toolset
@gptooldoc("AlignFeatures_edit", None)
def AlignFeatures(
    in_features=None,
    target_features=None,
    search_distance=None,
    match_fields=None,
) -> Result1[str | Layer]:
    """AlignFeatures_edit(in_features, target_features, search_distance, {match_fields;match_fields...})

       Identifies inconsistent portions of the input features compared to
       target features within a search distance and aligns them with the
       target features.

    INPUTS:
     in_features (Feature Layer):
         The input line or polygon features that will be adjusted.
     target_features (Feature Layer):
         The input lines or polygons to which the input features will be
         aligned.
     search_distance (Linear Unit):
         The distance that will be used to search for match candidates. A
         distance must be specified and it must be greater than zero. You can
         choose a preferred unit. The default is the feature unit.
     match_fields {Value Table}:
         The fields from the input and target features. If provided, each pair
         of fields will be checked for match candidates to help determine the
         right match."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AlignFeatures_edit(*gp_fixargs((in_features, target_features, search_distance, match_fields), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateTransformationErrors_edit", None)
def CalculateTransformationErrors(
    in_link_features=None,
    out_link_table=None,
    method: Literal["AFFINE", "PROJECTIVE", "SIMILARITY"] | None = None,
) -> Result2[str, str]:
    """CalculateTransformationErrors_edit(in_link_features, out_link_table, {method})

       Calculates residue errors and the root mean square error (RMSE) based
       on the coordinates of the input links between known control points to
       be used for spatial data transformation.

    INPUTS:
     in_link_features (Feature Layer):
         The input link features that link known control points for spatial
         transformation.
     method {String}:
         Specifies the transformation method that will be used to convert the
         input feature coordinates.AFFINE-A minimum of three transformation
         links is required. This is
         the default.PROJECTIVE-A minimum of four transformation links is
         required.SIMILARITY-A minimum of two transformation links is required.

    OUTPUTS:
     out_link_table (Table):
         The output table containing the input links feature IDs and their
         residual errors. The residual errors for input links will be written
         to the specified output table that contains the following
         fields:Orig_FID-The input link feature IDX_Source-The x-coordinate of
         the
         source or from the end location of
         the linkY_Source-The y-coordinate of the source or from the end
         location of
         the linkX_Destination-The x-coordinate of the destination or to the
         end
         location of the linkY_Destination-The y-coordinate of the destination
         or to the end
         location of the linkResidual_Error-The residual error of the
         transformed location"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateTransformationErrors_edit(*gp_fixargs((in_link_features, out_link_table, method), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("EdgematchFeatures_edit", None)
def EdgematchFeatures(
    in_features=None,
    in_link_features=None,
    method: Literal["MOVE_ENDPOINT", "ADD_SEGMENT", "ADJUST_VERTICES"] | None = None,
    adjacent_features=None,
    border_features=None,
) -> Result1[str | Layer]:
    """EdgematchFeatures_edit(in_features, in_link_features, {method}, {adjacent_features}, {border_features})

       Modifies input line features by spatially adjusting their shapes,
       guided by the specified edgematch links, so they become connected with
       the lines in the adjacent dataset.

    INPUTS:
     in_features (Feature Layer):
         The input line features that will be adjusted.
     in_link_features (Feature Layer):
         The input line features representing edgematch links.
     method {String}:
         Specifies the edgematch method that will be used to adjust input
         features only or input features and adjacent features to new
         connecting locations.MOVE_ENDPOINT-The endpoint of a line will be
         moved to the new
         connecting location. This is the default.ADD_SEGMENT-A straight
         segment will be added to the end of a line so
         it ends at the new connecting location.ADJUST_VERTICES-The endpoint of
         a line will be adjusted to the new
         connecting location. The remaining vertices will also be adjusted so
         that the positional changes are gradually reduced toward the opposite
         end of the line.
     adjacent_features {Feature Layer}:
         The line features that are adjacent to the input features. If
         provided, both the input and adjacent features will be adjusted to
         meet at new connecting locations, either the midpoints of the
         edgematch links or locations nearest to the midpoints of the links on
         the border features (if provided).
     border_features {Feature Layer}:
         The line or polygon features representing borders between the input
         and adjacent features. When you specify border features, both input
         and adjacent features will be adjusted to meet at new connecting
         locations nearest to the midpoints of the links on the border
         features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.EdgematchFeatures_edit(
                *gp_fixargs((in_features, in_link_features, method, adjacent_features, border_features), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateEdgematchLinks_edit", None)
def GenerateEdgematchLinks(
    source_features=None,
    adjacent_features=None,
    out_feature_class=None,
    search_distance=None,
    match_fields=None,
) -> Result1[str]:
    """GenerateEdgematchLinks_edit(source_features, adjacent_features, out_feature_class, search_distance, {match_fields;match_fields...})

       Finds matching but disconnected line features along the edges of the
       source data's area and its adjacent data's area, and generates
       edgematch links from the source lines to the matched adjacent lines.

    INPUTS:
     source_features (Feature Layer):
         The line features that will be used as edgematching source features.
         All edgematch links start at source features.
     adjacent_features (Feature Layer):
         The line features that are adjacent to the source features. All
         edgematch links end at matched adjacent features.
     search_distance (Linear Unit):
         The distance that will be used to search for match candidates. A
         distance must be specified and it must be greater than zero. You can
         choose a preferred unit. The default is the feature unit.
     match_fields {Value Table}:
         The fields from the source and target features in which the target
         fields are from the adjacent features. If provided, each pair of
         fields will be checked for match candidates to help determine the
         right match.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class containing lines representing edgematch
         links."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateEdgematchLinks_edit(
                *gp_fixargs(
                    (source_features, adjacent_features, out_feature_class, search_distance, match_fields), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateRubbersheetLinks_edit", None)
def GenerateRubbersheetLinks(
    source_features=None,
    target_features=None,
    out_feature_class=None,
    search_distance=None,
    match_fields=None,
    out_match_table=None,
) -> Result3[str, str, str]:
    """GenerateRubbersheetLinks_edit(source_features, target_features, out_feature_class, search_distance, {match_fields;match_fields...}, {out_match_table})

       Finds where the source line features spatially match the target line
       features and generates lines representing links from source locations
       to corresponding target locations for rubbersheeting.

    INPUTS:
     source_features (Feature Layer):
         The line features that will be used as source features for generating
         rubbersheet links. All links start at source features.
     target_features (Feature Layer):
         The line features that will be used as target features for generating
         rubbersheet links. All links end at matched target features.
     search_distance (Linear Unit):
         The distance that will be used to search for match candidates. A
         distance must be specified and it must be greater than zero. You can
         choose a preferred unit. The default is the feature unit.
     match_fields {Value Table}:
         Lists of fields from source and target features. If provided, each
         pair of fields are checked for match candidates to help determine the
         right match.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class containing lines representing regular
         rubbersheet links.
     out_match_table {Table}:
         The output table containing complete feature matching information."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateRubbersheetLinks_edit(
                *gp_fixargs(
                    (
                        source_features,
                        target_features,
                        out_feature_class,
                        search_distance,
                        match_fields,
                        out_match_table,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RubbersheetFeatures_edit", None)
def RubbersheetFeatures(
    in_features=None,
    in_link_features=None,
    in_identity_links=None,
    method: Literal["LINEAR", "NATURAL_NEIGHBOR"] | None = None,
) -> Result1[str | Layer]:
    """RubbersheetFeatures_edit(in_features, in_link_features, {in_identity_links}, {method})

       Modifies input features by spatially adjusting them through
       rubbersheeting, using the specified rubbersheet links, so they are
       better aligned with the intended target features.

    INPUTS:
     in_features (Feature Layer):
         The input features that will be adjusted. They can be points, lines,
         polygons, or annotations.
     in_link_features (Feature Layer):
         The input line features representing regular links for rubbersheeting.
     in_identity_links {Feature Layer}:
         The input point features representing identity links for
         rubbersheeting.
     method {String}:
         Specifies the rubbersheeting method that will be used to adjust
         features.LINEAR-This method is slightly faster and produces good
         results when
         you have many links spread uniformly over the data you are adjusting.
         This is the default.NATURAL_NEIGHBOR-This method should be used when
         you have few links
         spaced widely apart."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RubbersheetFeatures_edit(*gp_fixargs((in_features, in_link_features, in_identity_links, method), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SplitLineByMatch_edit", None)
def SplitLineByMatch(
    in_features=None,
    matched_features=None,
    in_match_table=None,
    out_feature_class=None,
    search_distance=None,
    in_features_as: Literal["AS_SOURCE", "AS_TARGET"] | None = None,
    out_point_feature_class=None,
    split_dangle: Literal["SPLIT_DANGLE", "NO_SPLIT_DANGLE"] | None = None,
    min_match_group_length=None,
    min_split_length=None,
    split_fields=None,
) -> Result2[str, str]:
    """SplitLineByMatch_edit(in_features, matched_features, in_match_table, out_feature_class, search_distance, {in_features_as}, {out_point_feature_class}, {split_dangle}, {min_match_group_length}, {min_split_length}, {split_fields;split_fields...})

       Splits features based on matching relationships to obtain better
       corresponding line segmentation.

    INPUTS:
     in_features (Feature Layer):
         The input line features that will be split. They must be prematched
         with the matched features.
     matched_features (Feature Layer):
         The features that were prematched with the input features. Matched
         features are used as reference when splitting the input features.
     in_match_table (Table View):
         A table that includes matching information between input and matched
         features.
     search_distance (Linear Unit):
         The distance value that will be used to determine split locations. The
         value must be greater than 0. If units are not specified, the units of
         the input will be used.
     in_features_as {String}:
         Specifies whether the input features in the match table are source
         features or target features, so the correct features will be
         split.AS_SOURCE-The input features are stored as the source features
         in the
         match table. This is the default.AS_TARGET-The input features are
         stored as the target features in the
         match table.
     split_dangle {Boolean}:
         Specifies whether dangling lines will be split.SPLIT_DANGLE-Dangling
         lines will be split following the tool's split
         rules. This is the default.NO_SPLIT_DANGLE-Dangling lines will not be
         split.
     min_match_group_length {Linear Unit}:
         The minimum length a match group can be. A given match group will only
         participate in the splitting process if either the total length of the
         input features or the total length of the matched features are greater
         than the value provided.
     min_split_length {Linear Unit}:
         The minimum length a split piece can be. If a split will result in one
         or both of the split pieces being shorter than the value provided, the
         split will not occur.
     split_fields {Field}:
         A list of numeric fields from the input features. Their field values
         will be based on the proportions of the split lines.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class containing split lines and original lines
         that are not split.
     out_point_feature_class {Feature Class}:
         The output point feature class containing points that represent split
         locations."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SplitLineByMatch_edit(
                *gp_fixargs(
                    (
                        in_features,
                        matched_features,
                        in_match_table,
                        out_feature_class,
                        search_distance,
                        in_features_as,
                        out_point_feature_class,
                        split_dangle,
                        min_match_group_length,
                        min_split_length,
                        split_fields,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TransferAttributes_edit", None)
def TransferAttributes(
    source_features=None,
    target_features=None,
    transfer_fields=None,
    search_distance=None,
    match_fields=None,
    out_match_table=None,
    transfer_rule_fields=None,
) -> Result2[str, str]:
    """TransferAttributes_edit(source_features, target_features, transfer_fields;transfer_fields..., search_distance, {match_fields;match_fields...}, {out_match_table}, {transfer_rule_fields;transfer_rule_fields...})

       Finds where the source line features spatially match the target line
       features and transfers specified attributes from source features to
       matched target features.

    INPUTS:
     source_features (Feature Layer):
         The line features from which attributes will be transferred.
     target_features (Feature Layer):
         The line features to which attributes will be transferred. The
         transfer fields will be added to the target features.
     transfer_fields (Field):
         A list of source fields that will be transferred to target features.
         At least one field must be provided.
     search_distance (Linear Unit):
         The distance that will be used to search for match candidates. A
         distance must be specified and it must be greater than zero. You can
         choose a preferred unit. The default is the feature unit.
     match_fields {Value Table}:
         Lists of fields from source and target features. If provided, each
         pair of fields are checked for match candidates to help determine the
         right match.
     transfer_rule_fields {Value Table}:
         The rules that control which source feature will be used to transfer
         attributes from when multiple source features matched target features.
         The source feature that will be used for the transfer is determined by
         the specified rule fields and the ruling values, which are ranked from
         high to low priority as they appear in the specified list. If no rules
         are set, the longest of the multiple matched source features will be
         used for the transfer.Available rule types are as follows:MIN-The
         minimum value for an integer or date field. For a date field,
         use the most recent date.MAX-The maximum value for an integer or date
         field. For a date field,
         use the oldest date.A text or integer value that may exist in the
         source features.

    OUTPUTS:
     out_match_table {Table}:
         The output table containing complete feature matching information."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TransferAttributes_edit(
                *gp_fixargs(
                    (
                        source_features,
                        target_features,
                        transfer_fields,
                        search_distance,
                        match_fields,
                        out_match_table,
                        transfer_rule_fields,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TransformFeatures_edit", None)
def TransformFeatures(
    in_features=None,
    in_link_features=None,
    method: Literal["AFFINE", "PROJECTIVE", "SIMILARITY"] | None = None,
    out_link_table=None,
) -> Result3[str, str, str | Layer]:
    """TransformFeatures_edit(in_features, in_link_features, {method}, {out_link_table})

       Converts the coordinates of input features from one location to
       another through scaling,  shifting, and rotating based on the
       transformation links between known corresponding control points.

    INPUTS:
     in_features (Feature Layer):
         The input features, the coordinates of which will be transformed. They
         can be points, lines, polygons, or annotations.
     in_link_features (Feature Layer):
         The input link features that link known control points for the
         transformation.
     method {String}:
         Specifies the transformation method that will be used to convert input
         feature coordinates.AFFINE-Aa minimum of three transformation links is
         required. This is
         the default.PROJECTIVE-A minimum of four transformation links is
         required.SIMILARITY-A minimum of two transformation links is required.

    OUTPUTS:
     out_link_table {Table}:
         The output table containing the input links and their residual errors."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TransformFeatures_edit(*gp_fixargs((in_features, in_link_features, method, out_link_table), True))
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
