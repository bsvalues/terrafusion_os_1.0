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
r"""The Parcel toolbox contains tools to create, administer, and load data
into parcel fabrics."""
from __future__ import annotations

__all__ = [
    "AddParcelType",
    "AnalyzeParcelsByLeastSquaresAdjustment",
    "AppendParcels",
    "ApplyParcelLeastSquaresAdjustment",
    "BuildParcelFabric",
    "CopyParcels",
    "CreateParcelFabric",
    "CreateParcelRecords",
    "CreateParcelSeeds",
    "DeleteParcels",
    "DisableParcelTopology",
    "DuplicateParcels",
    "EnableParcelTopology",
    "ExportParcelRecordFeatures",
    "ExportSequencedParcelFeatures",
    "FindAdjacentParcelPoints",
    "FindGapsAndOverlaps",
    "GenerateParcelFabricLinks",
    "ImportParcelFabricPoints",
    "MergeCollinearParcelBoundaries",
    "RemoveParcelType",
    "SelectParcelFeatures",
    "SetParcelLineLabelPosition",
    "UpgradeArcMapParcelFabric",
    "ValidateParcelFabric",
]
__alias__ = "parcel"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Tools
@gptooldoc("AnalyzeParcelsByLeastSquaresAdjustment_parcel", None)
def AnalyzeParcelsByLeastSquaresAdjustment(
    in_parcel_fabric=None,
    analysis_type: Literal["CONSISTENCY_CHECK", "WEIGHTED_LEAST_SQUARES"] | None = None,
    convergence_tolerance=None,
) -> Result:
    """AnalyzeParcelsByLeastSquaresAdjustment_parcel(in_parcel_fabric, analysis_type, {convergence_tolerance})

       Analyzes the parcel fabric measurement network by running a least-
       squares adjustment on the input parcels. A least-squares adjustment is
       a mathematical procedure that uses statistical analysis to estimate
       the most likely coordinates for connected points in a measurement
       network. A least-squares adjustment can be run on the parcel fabric to
       evaluate and improve spatial accuracy of parcel corner point
       locations.

    INPUTS:
     in_parcel_fabric (Parcel Layer):
         The input parcel fabric to be analyzed by least-squares adjustment.
     analysis_type (String):
         Specifies the type of least-squares analysis that will be used in the
         adjustment.CONSISTENCY_CHECK-A free-network least-squares adjustment
         will be run
         to check dimensions on parcel lines for inconsistencies and mistakes.
         Fixed or weighted control points will not be used by the
         adjustment.WEIGHTED_LEAST_SQUARES-A weighted least-squares adjustment
         will be run
         to compute updated coordinates for parcel points. The parcels being
         adjusted should connect to at least two fixed or weighted control
         points.
     convergence_tolerance {Linear Unit}:
         The tolerance representing the maximum coordinate shift expected after
         iterating the least-squares adjustment. A least-squares adjustment is
         run repeatedly (in iterations) until the solution converges. The
         solution is considered converged when maximum coordinate shift
         encountered becomes less than the specified convergence tolerance. The
         default value is 0.05 meters."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AnalyzeParcelsByLeastSquaresAdjustment_parcel(
                *gp_fixargs((in_parcel_fabric, analysis_type, convergence_tolerance), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AppendParcels_parcel", None)
def AppendParcels(
    in_parcel_fabric=None,
    target_parcel_fabric=None,
) -> Result1[str | Layer]:
    """AppendParcels_parcel(in_parcel_fabric, target_parcel_fabric)

       Appends parcels from an input parcel fabric to a target parcel fabric.
       If the input parcel fabric is a parcel fabric layer with selected
       polygons, the corresponding parcel features will be appended.

    INPUTS:
     in_parcel_fabric (Parcel Layer):
         The input parcels that will be appended to the target parcel fabric.
         The input parcel fabric can be from a file, enterprise, or mobile
         geodatabase, or a feature service.
     target_parcel_fabric (Parcel Layer):
         The target parcel fabric to which the parcels will be appended. The
         target parcel fabric can be from a file, enterprise, or mobile
         geodatabase."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AppendParcels_parcel(*gp_fixargs((in_parcel_fabric, target_parcel_fabric), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyParcelLeastSquaresAdjustment_parcel", None)
def ApplyParcelLeastSquaresAdjustment(
    in_parcel_fabric=None,
    movement_tolerance=None,
    update_attributes: Literal["UPDATE_ATTRIBUTES", "NO_UPDATE_ATTRIBUTES"] | None = None,
) -> Result1[str]:
    """ApplyParcelLeastSquaresAdjustment_parcel(in_parcel_fabric, {movement_tolerance}, {update_attributes})

       Applies the results of a least squares adjustment to parcel fabric
       feature classes. Least squares adjustment results stored in the
       AdjustmentLines and AdjustmentPoints feature classes are applied to
       the corresponding parcel line, connection line, and parcel fabric
       point feature classes.

    INPUTS:
     in_parcel_fabric (Parcel Layer):
         The parcel fabric to be updated.
     movement_tolerance {Linear Unit}:
         The tolerance representing the minimum allowable coordinate shift when
         updating parcel fabric points. If the distance between the adjustment
         point and the parcel fabric point is greater than the specified
         tolerance, the parcel fabric point is updated to the location of the
         adjustment point. The default tolerance is 0.05 meters.
     update_attributes {Boolean}:
         Specifies whether attribute fields in the parcel fabric Points
         feature class will be updated with statistical metadata. The,,,
         andfields will be updated with the values stored in the same fields in
         the AdjustmentPoints feature class. XY UncertaintyError Ellipse
         Semi MajorError Ellipse Semi MinorError Ellipse
         DirectionUPDATE_ATTRIBUTES-Attribute fields in the parcel fabric
         Points feature
         class will be updated with statistical
         metadata.NO_UPDATE_ATTRIBUTES-Attribute fields will not be updated.
         This is the
         default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyParcelLeastSquaresAdjustment_parcel(
                *gp_fixargs((in_parcel_fabric, movement_tolerance, update_attributes), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("BuildParcelFabric_parcel", None)
def BuildParcelFabric(
    in_parcel_fabric=None,
    extent=None,
    record_name=None,
) -> Result1[str]:
    """BuildParcelFabric_parcel(in_parcel_fabric, {extent}, {record_name})

       Builds parcels in a parcel fabric. Parcels can be built from polygons
       or lines. If parcels are built from polygons, the tool creates parcel
       lines and parcel points. If parcels are built from lines, the tool
       creates the missing polygons and points. When building parcels from
       lines, parcel seeds are required.

    INPUTS:
     in_parcel_fabric (Parcel Layer):
         The parcel fabric for which to parcels will be built. The parcel
         fabric can be from a file or mobile geodatabase, or from a feature
         service.
     extent {Extent}:
         The extent of the dataset to be processed. Only features that fall
         within the specified extent will be processed.MAXOF-The maximum extent
         of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     record_name {String}:
         The name of the existing parcel record. Only parcels associated with
         this record will be built."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.BuildParcelFabric_parcel(*gp_fixargs((in_parcel_fabric, extent, record_name), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CopyParcels_parcel", None)
def CopyParcels(
    in_parcel_fabric=None,
    target_database=None,
    out_dataset_name=None,
    out_fabric_name=None,
) -> Result2[str, str]:
    """CopyParcels_parcel(in_parcel_fabric, target_database, {out_dataset_name}, {out_fabric_name})

       Copies parcels from an input parcel fabric to a new parcel fabric in a
       new feature dataset.

    INPUTS:
     in_parcel_fabric (Parcel Layer):
         The input parcels that will be copied to the new parcel fabric. The
         input parcel fabric can be from a file, enterprise, or mobile
         geodatabase, or from a feature service.
     target_database (Workspace):
         The geodatabase in which the new parcel fabric will be created. The
         geodatabase can be a file, enterprise, or mobile geodatabase.
     out_dataset_name {String}:
         The name of the feature dataset that will be created for the new
         parcel fabric.
     out_fabric_name {String}:
         The name of the new parcel fabric."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CopyParcels_parcel(
                *gp_fixargs((in_parcel_fabric, target_database, out_dataset_name, out_fabric_name), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateParcelSeeds_parcel", None)
def CreateParcelSeeds(
    in_parcel_fabric=None,
    record_name=None,
) -> Result1[str]:
    """CreateParcelSeeds_parcel(in_parcel_fabric, record_name)

       Creates parcel seeds for closed loops of lines that are associated
       with the specified parcel record.

    INPUTS:
     in_parcel_fabric (Parcel Layer):
         The parcel fabric for which parcel seeds will be created. The parcel
         fabric can be from a file, enterprise, or mobile geodatabase, or from
         a feature service.
     record_name (String):
         The name of the parcel fabric record for which parcel seeds will be
         created. The record must already exist. The record name is not case
         sensitive."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateParcelSeeds_parcel(*gp_fixargs((in_parcel_fabric, record_name), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DeleteParcels_parcel", None)
def DeleteParcels(
    in_parcel_polygon_features=None,
) -> Result1[str]:
    """DeleteParcels_parcel(in_parcel_polygon_features)

       Deletes the selected parcels from the input parcel fabric. If the
       parcel polygon layer has no selection, all parcels will be deleted.

    INPUTS:
     in_parcel_polygon_features (Feature Layer):
         The parcel fabric polygon feature class containing the parcels that
         will be deleted."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DeleteParcels_parcel(*gp_fixargs((in_parcel_polygon_features,), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DuplicateParcels_parcel", None)
def DuplicateParcels(
    in_parcel_polygon_features=None,
    record_name=None,
    duplicate_to_parcel_type=None,
    repeat=None,
    update_field=None,
    start=None,
    increment=None,
) -> Result3[str, str, str]:
    """DuplicateParcels_parcel(in_parcel_polygon_features, record_name, duplicate_to_parcel_type, {repeat}, {update_field}, {start}, {increment})

       Duplicates parcels in the same parcel type or in a different parcel
       type or duplicates parcels multiple times to create strata parcels
       (floor levels).

    INPUTS:
     in_parcel_polygon_features (Feature Layer):
         The input parcel polygon layer containing the parcels that will be
         duplicated.
     record_name (String):
         The name of the parcel record that will be associated with the
         duplicated parcels. If the parcel record provided does not exist, it
         will be created and the duplicated parcels will be assigned to it.
     duplicate_to_parcel_type (String):
         The parcel type in which to duplicate the parcel. You can duplicate a
         parcel in the same parcel type or a different parcel type.
     repeat {Long}:
         The number of times the parcel will be duplicated. When duplicating
         parcels to create strata parcels, this parameter represents the number
         of floors that will be created.
     update_field {Field}:
         A numeric field (long) that will be incrementally updated with
         an integer number for each duplicated parcel. This parameter is
         typically used when duplicating parcels to create strata parcels
         (floor levels). If the parcel type supports the storage of strata
         parcels, thefield is used as the update field. FloorOrderThe
         number will start at the value specified for the start parameter
         and will increment by the value specified for the increment parameter.
     start {Long}:
         The starting value or floor level of the first parcel that will be
         duplicated.
     increment {Long}:
         The interval at which the value (floor level) in the update field will
         increase. For example, if the start number is 1 and the increment
         number is 2, the values will increase by 2 for each duplicated parcel
         (1, 3, 5, 7, and so on)."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DuplicateParcels_parcel(
                *gp_fixargs(
                    (
                        in_parcel_polygon_features,
                        record_name,
                        duplicate_to_parcel_type,
                        repeat,
                        update_field,
                        start,
                        increment,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportParcelRecordFeatures_parcel", None)
def ExportParcelRecordFeatures(
    in_record_polygon_feature=None,
    target_feature_dataset=None,
) -> Result1[str]:
    """ExportParcelRecordFeatures_parcel(in_record_polygon_feature, target_feature_dataset)

       Exports the parcel features associated with a selected parcel record
       to individual feature classes. The tool exports parcel features that
       were created by and retired by the selected record.

    INPUTS:
     in_record_polygon_feature (Feature Layer):
         The parcel fabric records layer that contains the selected record
         polygon. Only one record polygon can be selected.
     target_feature_dataset (Feature Dataset):
         The feature dataset where the exported parcel fabric feature classes
         will reside. If you're using an existing feature class, the features
         will be overwritten with the exported features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportParcelRecordFeatures_parcel(*gp_fixargs((in_record_polygon_feature, target_feature_dataset), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportSequencedParcelFeatures_parcel", None)
def ExportSequencedParcelFeatures(
    in_parcel_polygon_feature=None,
    target_feature_dataset=None,
    start_sequence_corner: Literal["NE", "SE", "SW", "NW"] | None = None,
    points_sequence_format=None,
    lines_sequence_format=None,
    sequence_curves_separately: Literal["SEQUENCE_SEPARATELY", "SEQUENCE_TOGETHER"] | None = None,
) -> Result:
    """ExportSequencedParcelFeatures_parcel(in_parcel_polygon_feature, target_feature_dataset, {start_sequence_corner}, {points_sequence_format}, {lines_sequence_format}, {sequence_curves_separately})

       Exports the parcel features of a selected parcel to individual feature
       classes. The individual feature classes can be added to a map to
       create parcel layouts or title map layouts. Fields are added to the
       feature classes so that parcel features can be labeled and tabulated
       in a clockwise sequence.

    INPUTS:
     in_parcel_polygon_feature (Feature Layer):
         The parcel that will be exported to individual feature classes. Only
         one parcel polygon can be selected.
     target_feature_dataset (Feature Dataset):
         The feature dataset where the exported parcel feature classes will
         reside.
     start_sequence_corner {String}:
         Specifies the parcel corner where the line and point sequence
         numbering will start. The sequence number is populated in thefield on
         the exported lines and points feature class. SequenceNE-The
         line or point sequence will start at the northeast parcel
         corner point. This is the default.SE-The line or point sequence will
         start at the southeast parcel
         corner point.SW-The line or point sequence will start at the southwest
         parcel
         corner point.NW-The line or point sequence will start at the northwest
         parcel
         corner point.
     points_sequence_format {String}:
         The sequence numbering format that will be used for points in
         thefield. Use a # character to denote the incrementing sequence
         number. Multiple # characters will add zeros before the sequence
         number. Letters can be placed on either side of the # character. The
         following are examples:        Sequence# is formatted as a sequence
         starting with 1.## is formatted as a
         sequence starting with 01.P# is formatted as a sequence starting with
         P1.ABC-##1 is formatted as a sequence starting with ABC-001.#P is
         formatted as a sequence starting with 1P.
     lines_sequence_format {String}:
         The sequence numbering format that will be used for lines in
         thefield. Use a # character to denote the incrementing sequence
         number. Multiple # characters will add zeros before the sequence
         number. Letters can be placed on either side of the # character. The
         following are examples:        Sequence# is formatted as a sequence
         starting with 1.## is formatted as a
         sequence starting with 01.L# is formatted as a sequence starting with
         L1.ABC-##1 is formatted as a sequence starting with ABC-001.#L is
         formatted as a sequence starting with 1L.
     sequence_curves_separately {Boolean}:
         Specifies whether curves will be sequenced separately when exporting
         parcel lines. SEQUENCE_SEPARATELY-The sequence numbering in
         thefield will
         restart at 1 for the first curve encountered in the clockwise sequence
         and will increment for each additional curve found. Sequence
         SEQUENCE_TOGETHER-The sequence numbering in thefield will not
         be incremented separately for curved lines. This is the default.
         Sequence"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportSequencedParcelFeatures_parcel(
                *gp_fixargs(
                    (
                        in_parcel_polygon_feature,
                        target_feature_dataset,
                        start_sequence_corner,
                        points_sequence_format,
                        lines_sequence_format,
                        sequence_curves_separately,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FindAdjacentParcelPoints_parcel", None)
def FindAdjacentParcelPoints(
    in_parcel_points=None,
    out_feature_class=None,
    tolerance=None,
) -> Result1[str]:
    """FindAdjacentParcelPoints_parcel(in_parcel_points, out_feature_class, {tolerance})

       Finds parcel points that are on top of each other (coincident) or
       closer to each other than a specified tolerance.

    INPUTS:
     in_parcel_points (Feature Layer):
         The input parcel fabric points feature class that will be searched.
     tolerance {Linear Unit}:
         The distance within which a point is considered adjacent to another
         point. If a point is closer to another point than the specified
         tolerance, the point will be considered an adjacent point and will be
         copied to the output feature class. The default tolerance of 0 meters
         will find stacked points that lie directly on top of each other.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class that will contain the adjacent points that
         are found. These adjacent points will be symbolized with large point
         features that are visible in the map."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FindAdjacentParcelPoints_parcel(*gp_fixargs((in_parcel_points, out_feature_class, tolerance), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FindGapsAndOverlaps_parcel", None)
def FindGapsAndOverlaps(
    in_parcel_features=None,
    out_feature_class=None,
    maximum_width=None,
    detection_type: Literal["WITHIN_LAYER", "BETWEEN_LAYERS"] | None = None,
) -> Result1[str]:
    """FindGapsAndOverlaps_parcel(in_parcel_features;in_parcel_features..., out_feature_class, {maximum_width}, {detection_type})

       Finds gaps and overlaps within parcel layers or between all input
       parcels. Gaps and overlaps that are found are represented as polygon
       features and are stored in an output feature class. The gap or overlap
       polygon feature matches the area of the gap or overlap.

    INPUTS:
     in_parcel_features (Feature Layer):
         The input parcel polygon layers. If multiple parcel polygon layers are
         specified, the tool will search for gaps and overlaps within each
         layer or between all input parcels.
     maximum_width {Linear Unit}:
         The maximum width a gap or an overlap can be for it to be considered a
         gap or an overlap. Only gaps and overlaps that are smaller than the
         specified width will be included in the output feature class. The
         default width is 2 meters (6.56 feet).
     detection_type {String}:
         Specifies whether the search for gaps will only be within parcel
         layers or within parcel layers and between all input
         parcels.WITHIN_LAYER-Gaps and overlaps will only be detected within
         each
         parcel layer. This is the default.BETWEEN_LAYERS-Gaps and overlaps
         will be detected within each parcel
         layer and between each parcel layer (all input parcels).

    OUTPUTS:
     out_feature_class (Feature Class):
         The output polygon feature class containing the gap and overlap
         polygons. In the map, the gap polygons will be symbolized in green and
         overlap polygons will be symbolized in yellow."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FindGapsAndOverlaps_parcel(
                *gp_fixargs((in_parcel_features, out_feature_class, maximum_width, detection_type), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateParcelFabricLinks_parcel", None)
def GenerateParcelFabricLinks(
    target_parcel_fabric=None,
    out_links_feature_class=None,
    out_anchor_points_feature_class=None,
    from_date=None,
    to_date=None,
    min_link_length=None,
    extent=None,
) -> Result2[str, str]:
    """GenerateParcelFabricLinks_parcel(target_parcel_fabric, out_links_feature_class, out_anchor_points_feature_class, from_date, {to_date}, {min_link_length}, {extent})

       Generates displacement links for parcel fabric points that have
       changed locations in a specified time period.

    INPUTS:
     target_parcel_fabric (Parcel Layer):
         The parcel fabric that will be used to generate links. The parcel
         fabric must be published as a feature service and the default version
         is used to generate links.
     from_date (Date):
         The date from which to search the parcel fabric for points that have
         changed locations. Links and anchor points will be only be generated
         for points on or after this date.
     to_date {Date}:
         The end date of the time period in which to search the parcel
         fabric for points that have changed locations. Links and anchor points
         will only be generated for points on or before this date. If no To
         date is specified, links and anchor points will be generated for all
         points on or after the specified. If theis specified at a future date,
         links will be generated in the time period between theand the current
         date and time. From DateTo DateFrom Date
     min_link_length {Linear Unit}:
         The minimum length of the generated links. If the link length between
         the current points and their original locations is smaller than the
         specified value, anchor points are created for the original locations
         of the points.
     extent {Extent}:
         The extent of the dataset to be processed. Only features that fall
         within the specified extent will be processed.MAXOF-The maximum extent
         of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.

    OUTPUTS:
     out_links_feature_class (Feature Class):
         The output line feature class that will store the generated links.
     out_anchor_points_feature_class (Feature Class):
         The output point feature class that will store the anchor points."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateParcelFabricLinks_parcel(
                *gp_fixargs(
                    (
                        target_parcel_fabric,
                        out_links_feature_class,
                        out_anchor_points_feature_class,
                        from_date,
                        to_date,
                        min_link_length,
                        extent,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportParcelFabricPoints_parcel", None)
def ImportParcelFabricPoints(
    source_points=None,
    target_parcel_fabric=None,
    match_point_method: Literal["PROXIMITY", "NAME_AND_PROXIMITY", "GLOBALID_AND_PROXIMITY"] | None = None,
    search_distance=None,
    update_type: Literal["ALL", "GEOMETRY_XYZ", "RETIRE_AND_REPLACE"] | None = None,
    record_name=None,
    match_field=None,
    conflicts_table=None,
    update_create_option: Literal["UPDATE_AND_CREATE", "CREATE_ONLY", "UPDATE_ONLY"] | None = None,
    target_points=None,
    where_clause=None,
) -> Result2[str | Layer, str]:
    """ImportParcelFabricPoints_parcel(source_points, target_parcel_fabric, match_point_method, search_distance, update_type, {record_name}, {match_field}, {conflicts_table}, {update_create_option}, {target_points}, {where_clause})

       Imports point data from a source point feature class into the parcel
       fabric points feature class. Parcel fabric points that match or lie
       within a proximity tolerance of the source points can be updated with
       the imported point data. If the source points layer has a selection,
       only the selected point information will be imported.

    INPUTS:
     source_points (Feature Layer):
         The source point feature class that will be used to create or update
         points in the target parcel fabric.
     target_parcel_fabric (Parcel Layer):
         The target parcel fabric in which points will be updated or created.
         The target parcel fabric can be from a file geodatabase, an enterprise
         geodatabase connected to the default version, a mobile geodatabase, or
         a feature service.
     match_point_method (String):
         Specifies the method that will be used to find existing parcel fabric
         points that match the source points.PROXIMITY-Parcel fabric points
         that lie within the proximity tolerance
         of the source points will be matched to the source points and updated.
         This is the default.NAME_AND_PROXIMITY-Parcel fabric points that lie
         within the proximity
         tolerance and have the same name as the source points will be matched
         to the source points and updated.
         GLOBALID_AND_PROXIMITY-Parcel fabric points that lie within
         the proximity tolerance and have the same Global ID as the source
         points will be matched to the source points and updated. Global IDs
         are stored in thefield of the parcel fabric points feature class and
         in a specifiedfield of the source feature class. Global
         IDGlobal ID
     search_distance (Linear Unit):
         The distance that will be used to search for parcel fabric points that
         lie within the proximity of the source points.
     update_type (String):
         Specifies the type of update that will be applied to parcel fabric
         points that match source points.ALL-The geometry (x,y,z) and matching
         attribute fields of parcel
         fabric points will be updated. If the geometry of parcel fabric points
         is updated, coincident parcel features will be updated as well. This
         is the default.GEOMETRY_XYZ-Only the geometry (x,y,z) of the parcel
         fabric points
         will be updated. If the geometry of parcel fabric points is updated,
         coincident parcel features will be updated as well.
         RETIRE_AND_REPLACE-Source points will be imported as new
         parcel fabric points. Any matching parcel fabric points will be
         retired as historic. Thefield of each matching parcel fabric point
         will be populated with the Global ID of the record specified in
         theparameter. Retired By RecordRecord Name
     record_name {String}:
         The name of the record that will be associated with the new imported
         points.If the record exists in the target parcel fabric, the new
         points will
         be associated with the record. If the record does not exist, a record
         will be created. If new points replace existing points, and
         update_type is RETIRE_AND_REPLACE, the record will be used to retire
         the points as historic.
     match_field {Field}:
         The field that will be used to match source points to parcel fabric
         points when NAME_AND_PROXIMITY or GLOBALID_AND_PROXIMITY is used for
         the match_point_method parameter. When searching by name, the field in
         the source point feature class should be of type Text. When searching
         by Global ID, the field in the source point feature class should be of
         type GUID.
     update_create_option {String}:
         Specifies whether points will be updated, created, or both. When
         specifying the UPDATE_AND_CREATE or UPDATE_ONLY option, optional
         parameters are available to filter the matching target parcel fabric
         points. Existing points will not be updated if theirfield is
         set to
         Yes. IsFixedUPDATE_AND_CREATE-Points will be created if no
         matching points are
         found using the search criteria. If matching points are found using
         the search criteria, they will be updated. Matching points in the
         target parcel fabric can optionally be filtered using an SQL
         expression. This is the default.CREATE_ONLY-Points will be created
         only if no matching points are
         found using the search criteria. If matching points are found using
         the search criteria, they will remain unchanged and no points will be
         created.UPDATE_ONLY-Points will be updated if matching points are
         found using
         the search criteria. Matching points in the target parcel fabric can
         optionally be filtered using an SQL expression. If no matching points
         are found, points will not be updated.
     target_points {Feature Layer}:
         The parcel fabric points layer that will be filtered by an SQL
         expression. This points layer must be from the target parcel fabric.
     where_clause {SQL Expression}:
         An SQL expression that filters the matching points found in the target
         parcel fabric points layer. For example, only update matching points
         that are not retired as historic (RetiredByRecord IS NULL).

    OUTPUTS:
     conflicts_table {Table}:
         The path and name of the output table that will store conflicts. If
         more than one parcel fabric point is found within the search tolerance
         of a source point, the Object IDs of the source points and parcel
         fabric points will be reported in the conflicts table."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportParcelFabricPoints_parcel(
                *gp_fixargs(
                    (
                        source_points,
                        target_parcel_fabric,
                        match_point_method,
                        search_distance,
                        update_type,
                        record_name,
                        match_field,
                        conflicts_table,
                        update_create_option,
                        target_points,
                        where_clause,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MergeCollinearParcelBoundaries_parcel", None)
def MergeCollinearParcelBoundaries(
    in_parcel_boundaries=None,
    offset_tolerance=None,
) -> Result1[str | Layer]:
    """MergeCollinearParcelBoundaries_parcel(in_parcel_boundaries, offset_tolerance)

       Merges connected collinear parcel lines into a single parcel line.
       Shared parcel fabric points between connected collinear lines are
       deleted and vertices are created in their place.

    INPUTS:
     in_parcel_boundaries (Feature Layer):
         The parcel lines to be merged. Lines can be parcel lines or connection
         lines.
     offset_tolerance (Linear Unit):
         The maximum distance that parcel points between collinear lines can be
         offset for the line to be considered collinear. The offset is the
         distance between the collinear parcel points and the straight lines
         between the endpoints of the connected parcel lines."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MergeCollinearParcelBoundaries_parcel(*gp_fixargs((in_parcel_boundaries, offset_tolerance), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SelectParcelFeatures_parcel", None)
def SelectParcelFeatures(
    in_parcel_polygon_features=None,
) -> Result2[str | Layer, str | Layer]:
    """SelectParcelFeatures_parcel(in_parcel_polygon_features)

       Selects the related points and lines of the input parcel polygons.

    INPUTS:
     in_parcel_polygon_features (Feature Layer):
         The input parcel polygon layer."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SelectParcelFeatures_parcel(*gp_fixargs((in_parcel_polygon_features,), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetParcelLineLabelPosition_parcel", None)
def SetParcelLineLabelPosition(
    in_parcel_features=None,
) -> Result1[str | Layer]:
    """SetParcelLineLabelPosition_parcel(in_parcel_features;in_parcel_features...)

       Sets the  label position of the line's COGO dimension to the left of
       the parcel line, to the right of the parcel line, or centered over the
       parcel line.

    INPUTS:
     in_parcel_features (Feature Layer):
         The input parcel line layers with label positions that will be
         updated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetParcelLineLabelPosition_parcel(*gp_fixargs((in_parcel_features,), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ValidateParcelFabric_parcel", None)
def ValidateParcelFabric(
    in_parcel_fabric=None,
    extent=None,
) -> Result1[str]:
    """ValidateParcelFabric_parcel(in_parcel_fabric, {extent})

       Validates a parcel fabric using a predefined set of geodatabase
       topology rules and any other topology rules you have added for your
       organization.

    INPUTS:
     in_parcel_fabric (Parcel Layer):
         The parcel fabric to be validated. The parcel fabric can be from a
         file or mobile geodatabase or from a feature service.
     extent {Extent}:
         The extent of the dataset to be processed. Only features that fall
         within the specified extent will be processed.MAXOF-The maximum extent
         of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ValidateParcelFabric_parcel(*gp_fixargs((in_parcel_fabric, extent), True))
        )
        return retval
    except Exception as e:
        raise e


# Administration toolset
@gptooldoc("AddParcelType_parcel", None)
def AddParcelType(
    in_parcel_fabric=None,
    name=None,
    administrative_polygon: Literal["ADMINISTRATIVE_POLYGON", "TOPOLOGY_POLYGON"] | None = None,
) -> Result3[str, str, str]:
    """AddParcelType_parcel(in_parcel_fabric, name, {administrative_polygon})

       Adds a parcel type to a parcel fabric. A parcel type is defined by a
       separate polygon and line feature class. Parcel type feature classes
       are controlled by the parcel fabric dataset.

    INPUTS:
     in_parcel_fabric (Parcel Layer):
         The parcel fabric to which the parcel type will be added. The parcel
         fabric can be from a file, enterprise, or mobile geodatabase.
     name (String):
         The name of the parcel type. The name will be assigned to the output
         polygon and line feature classes.
     administrative_polygon {Boolean}:
         Specifies whether the parcel type will be used to store parcels with
         administrative boundaries or regular boundaries. Administrative
         boundaries are used for very large parcels such as country parcels or
         state parcels. The parcel type polygon feature class will not
         participate in the parcel fabric topology.ADMINISTRATIVE_POLYGON-The
         parcel type will be used to store
         administrative boundaries. The parcel type polygon feature class will
         not participate in the parcel fabric topology.TOPOLOGY_POLYGON-The
         parcel type will not be used to store
         administrative boundaries. The parcel type polygon feature class will
         participate in the parcel fabric topology. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddParcelType_parcel(*gp_fixargs((in_parcel_fabric, name, administrative_polygon), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateParcelFabric_parcel", None)
def CreateParcelFabric(
    target_dataset=None,
    name=None,
    config_keyword=None,
) -> Result1[str]:
    """CreateParcelFabric_parcel(target_dataset, name, {config_keyword})

       Creates a parcel fabric and its associated datasets. The parcel fabric
       is created in a feature dataset that resides in a file, enterprise, or
       mobile geodatabase.

    INPUTS:
     target_dataset (Feature Dataset):
         The feature dataset in which the parcel fabric and related schema will
         be created. The feature dataset can reside in a file, enterprise, or
         mobile geodatabase.
     name (String):
         The name of the parcel fabric that will be created. Associated
         datasets will be prefixed with the parcel fabric name.
     config_keyword {String}:
         The configuration keyword applies to enterprise geodatabase data only.
         It determines the storage parameters of the database table."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateParcelFabric_parcel(*gp_fixargs((target_dataset, name, config_keyword), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateParcelRecords_parcel", None)
def CreateParcelRecords(
    in_parcel_features=None,
    record_field=None,
    record_expression=None,
    record_name_method: Literal["FIELD", "EXPRESSION"] | None = None,
) -> Result2[str, str]:
    """CreateParcelRecords_parcel(in_parcel_features, {record_field}, {record_expression}, {record_name_method})

       Creates parcel records for the input parcel fabric features using a
       record name field or an expression.

    INPUTS:
     in_parcel_features (Feature Layer):
         The input parcel features (parcel polygons, parcel lines, or
         connection lines) that will be used to create parcel records. The
         input parcel features can be from a parcel fabric in a file,
         enterprise, or mobile geodatabase.
     record_field {Field}:
         The attribute field that contains the record names. The attribute
         field must be a text field and must contain parcel record names.
         Parcel records will be created for features using the provided record
         names.
     record_expression {Calculator Expression}:
         An Arcade expression that uses fields, string operators, and
         mathematical operators to represent the record names. For example, the
         expression Left($feature.Name,4) extracts the first four characters
         from the parcel name field in the parcel fabric polygon feature class
         to create the record names.
     record_name_method {String}:
         Specifies the method that will be used to create parcel
         records.FIELD-Parcel records will be created using record names from a
         text
         field on the input parcel features. This is the
         default.EXPRESSION-Parcel records will be created using an Arcade
         expression."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateParcelRecords_parcel(
                *gp_fixargs((in_parcel_features, record_field, record_expression, record_name_method), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DisableParcelTopology_parcel", None)
def DisableParcelTopology(
    in_parcel_fabric=None,
) -> Result1[str]:
    """DisableParcelTopology_parcel(in_parcel_fabric)

       Disables geodatabase topology on a parcel fabric. System-defined
       topology rules and parcel fabric feature classes will be removed from
       the topology.

    INPUTS:
     in_parcel_fabric (Parcel Layer):
         The parcel fabric for which the topology will be disabled. The input
         parcel fabric can be from a file, enterprise, or mobile geodatabase."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.DisableParcelTopology_parcel(*gp_fixargs((in_parcel_fabric,), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("EnableParcelTopology_parcel", None)
def EnableParcelTopology(
    in_parcel_fabric=None,
) -> Result1[str]:
    """EnableParcelTopology_parcel(in_parcel_fabric)

       Enables geodatabase topology on a parcel fabric.

    INPUTS:
     in_parcel_fabric (Parcel Layer):
         The parcel fabric for which the geodatabase topology will be enabled.
         The input parcel fabric can be from a file, enterprise, or mobile
         geodatabase."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.EnableParcelTopology_parcel(*gp_fixargs((in_parcel_fabric,), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("RemoveParcelType_parcel", None)
def RemoveParcelType(
    in_parcel_fabric=None,
    name=None,
) -> Result3[str, str, str]:
    """RemoveParcelType_parcel(in_parcel_fabric, name)

       Removes a parcel type from a parcel fabric.

    INPUTS:
     in_parcel_fabric (Parcel Layer):
         The parcel fabric from which the parcel type will be removed. The
         parcel fabric can be from a file, enterprise, or mobile geodatabase.
     name (String):
         The name of the parcel type."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.RemoveParcelType_parcel(*gp_fixargs((in_parcel_fabric, name), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpgradeArcMapParcelFabric_parcel", None)
def UpgradeArcMapParcelFabric(
    in_parcel_fabric=None,
    target_dataset=None,
    name=None,
    delete_identical: Literal["DELETE_IDENTICAL_LINES", "KEEP_IDENTICAL_LINES"] | None = None,
) -> Result1[str]:
    """UpgradeArcMapParcelFabric_parcel(in_parcel_fabric, target_dataset, name, {delete_identical})

       Upgrades an ArcMap parcel fabric to an ArcGIS Pro parcel fabric.

    INPUTS:
     in_parcel_fabric (Parcel Fabric Layer for ArcMap):
         The ArcMap parcel fabric that will be upgraded to an ArcGIS Pro parcel
         fabric.
     target_dataset (Feature Dataset):
         The feature dataset that will contain the upgraded ArcGIS Pro parcel
         fabric.
     name (String):
         The name of the upgraded ArcGIS Pro parcel fabric.
     delete_identical {Boolean}:
         Specifies whether identical overlapping lines will be deleted.
         When DELETE_IDENTICAL_ LINES is used, overlapping lines will be
         deleted if the line shapes are identical (lines are coincident) and
         they have the following matching attributes:
         Directions in thefield. This includes directions that are
         reversed by 180 degrees. Direction          Distances in
         thefield. Distances are rounded to four decimal
         places. Distance          Records in thefield.
         Created By Record          Records in thefield. Retired By
         RecordDELETE_IDENTICAL_LINES-Identical overlapping lines will be
         deleted.KEEP_IDENTICAL_LINES-Identical overlapping lines will not be
         deleted.
         This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpgradeArcMapParcelFabric_parcel(
                *gp_fixargs((in_parcel_fabric, target_dataset, name, delete_identical), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
