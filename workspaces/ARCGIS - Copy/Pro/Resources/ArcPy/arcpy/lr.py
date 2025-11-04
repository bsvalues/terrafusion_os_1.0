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
r"""Organizations that collect data about linear features, such as
highways, city streets, railroads, rivers, pipelines, and water and
sewer networks often use linear referencing systems to store data. A
linear reference system stores data using a relative position along
existing line features. That is, location is given in terms of a known
linear feature and a position, or measure, along it. For example,
route I-10, mile 23.2, uniquely identifies a position in geographic
space, and can be used instead of an x,y coordinate."""
from __future__ import annotations

__all__ = [
    "CalibrateRoutes",
    "CreateRoutes",
    "DissolveRouteEvents",
    "LocateFeaturesAlongRoutes",
    "MakeRouteEventLayer",
    "OverlayRouteEvents",
    "TransformRouteEvents",
]
__alias__ = "lr"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Tools
@gptooldoc("CalibrateRoutes_lr", None)
def CalibrateRoutes(
    in_route_features=None,
    route_id_field=None,
    in_point_features=None,
    point_id_field=None,
    measure_field=None,
    out_feature_class=None,
    calibrate_method: Literal["DISTANCE", "MEASURES"] | None = None,
    search_radius=None,
    interpolate_between: Literal["BETWEEN", "NO_BETWEEN"] | None = None,
    extrapolate_before: Literal["BEFORE", "NO_BEFORE"] | None = None,
    extrapolate_after: Literal["AFTER", "NO_AFTER"] | None = None,
    ignore_gaps: Literal["IGNORE", "NO_IGNORE"] | None = None,
    keep_all_routes: Literal["KEEP", "NO_KEEP"] | None = None,
    build_index: Literal["INDEX", "NO_INDEX"] | None = None,
) -> Result1[str]:
    """CalibrateRoutes_lr(in_route_features, route_id_field, in_point_features, point_id_field, measure_field, out_feature_class, {calibrate_method}, {search_radius}, {interpolate_between}, {extrapolate_before}, {extrapolate_after}, {ignore_gaps}, {keep_all_routes}, {build_index})

       Recalculates route measures using points.

    INPUTS:
     in_route_features (Feature Layer):
         The route features that will be calibrated.
     route_id_field (Field):
         The field containing values that uniquely identify each route. The
         field can be a numeric, text, or GUID field.
     in_point_features (Feature Layer):
         The point features that will be used to calibrate the routes.
     point_id_field (Field):
         The field that identifies the route on which each calibration point is
         located. The values in this field match those in the route identifier
         field. This field can be a numeric, text, or GUID field.
     measure_field (Field):
         The field containing the measure value for each calibration point.
         This field must be numeric.
     calibrate_method {String}:
         Specifies how route measures will be recalculated.DISTANCE-Measures
         will be recalculated using the shortest path
         distance between the calibration points. This is the
         default.MEASURES-Measures will be recalculated using the pre-existing
         measure
         distance between the calibration points.
     search_radius {Linear Unit}:
         Limits how far a calibration point can be from a route by specifying
         the distance and its unit of measure. If the unit of measure is
         unknown, the units of the coordinate system of the route feature class
         will be used.
     interpolate_between {Boolean}:
         Specifies whether measure values will be interpolated between the
         calibration points.BETWEEN-Measure values will be interpolated between
         the calibration
         points. This is the default.NO_BETWEEN-Measure values will not be
         interpolated between the
         calibration points.
     extrapolate_before {Boolean}:
         Specifies whether measure values will be extrapolated before the
         calibration points.BEFORE-Measure values will be extrapolated before
         the calibration
         points. This is the default.NO_BEFORE-Measure values will not be
         extrapolated before the
         calibration points.
     extrapolate_after {Boolean}:
         Specifies whether measure values will be extrapolated after the
         calibration points.AFTER-Measure values will be extrapolated after the
         calibration
         points. This is the default.NO_AFTER-Measure values will not be
         extrapolated after the calibration
         points.
     ignore_gaps {Boolean}:
         Specifies whether spatial gaps will be ignored when recalculating the
         measures on disjointed routes.IGNORE-Spatial gaps will be ignored.
         Measure values will be continuous
         for disjointed routes. This is the default.NO_IGNORE-Spatial gaps will
         not be ignored. The measure values on
         disjointed routes will have gaps. The gap distance is calculated using
         the straight-line distance between the endpoints of the disjointed
         parts.
     keep_all_routes {Boolean}:
         Specifies whether route features that do not have calibration points
         will be included in the output feature class.KEEP-All route features
         will be included in the output feature class.
         This is the default.NO_KEEP-All route features will not necessarily be
         included in the
         output feature class. Features with no calibration points will be
         excluded.
     build_index {Boolean}:
         Specifies whether an attribute index will be created for the route
         identifier field that is written to the out_feature_class parameter
         value.INDEX-An attribute index will be created. This is the
         default.NO_INDEX-An attribute index will not be created.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be created. It can be a shapefile or a
         geodatabase feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalibrateRoutes_lr(
                *gp_fixargs(
                    (
                        in_route_features,
                        route_id_field,
                        in_point_features,
                        point_id_field,
                        measure_field,
                        out_feature_class,
                        calibrate_method,
                        search_radius,
                        interpolate_between,
                        extrapolate_before,
                        extrapolate_after,
                        ignore_gaps,
                        keep_all_routes,
                        build_index,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateRoutes_lr", None)
def CreateRoutes(
    in_line_features=None,
    route_id_field=None,
    out_feature_class=None,
    measure_source: Literal["LENGTH", "ONE_FIELD", "TWO_FIELDS"] | None = None,
    from_measure_field=None,
    to_measure_field=None,
    coordinate_priority: Literal["UPPER_LEFT", "LOWER_LEFT", "UPPER_RIGHT", "LOWER_RIGHT"] | None = None,
    measure_factor=None,
    measure_offset=None,
    ignore_gaps: Literal["IGNORE", "NO_IGNORE"] | None = None,
    build_index: Literal["INDEX", "NO_INDEX"] | None = None,
) -> Result1[str]:
    """CreateRoutes_lr(in_line_features, route_id_field, out_feature_class, measure_source, {from_measure_field}, {to_measure_field}, {coordinate_priority}, {measure_factor}, {measure_offset}, {ignore_gaps}, {build_index})

       Creates routes from existing lines. The input line features that share
       a common identifier are merged to create a single route.

    INPUTS:
     in_line_features (Feature Layer):
         The features from which routes will be created.
     route_id_field (Field):
         The field containing values that uniquely identify each route. The
         field can be a numeric, text, or GUID field.
     measure_source (String):
         Specifies how route measures will be accumulated.LENGTH-The geometric
         length of the input features will be used to
         accumulate the measures. This is the default.ONE_FIELD-The value
         stored in a single field will be used to
         accumulate the measures.TWO_FIELDS-The values stored in both the from-
         and to-measure fields
         will be used to accumulate the measures.
     from_measure_field {Field}:
         A field containing measure values. This field must be numeric and is
         required when the measure source is ONE_FIELD or TWO_FIELDS.
     to_measure_field {Field}:
         A field containing measure values. This field must be numeric and is
         required when the measure source is TWO_FIELDS.
     coordinate_priority {String}:
         The position from which measures will be accumulated for each output
         route. This parameter is ignored when the measure source is
         TWO_FIELDS.UPPER_LEFT-Measures will be accumulated from the point
         closest to the
         minimum bounding rectangle's upper left corner. This is the
         default.LOWER_LEFT-Measures will be accumulated from the point closest
         to the
         minimum bounding rectangle's lower left corner.UPPER_RIGHT-Measures
         will be accumulated from the point closest to the
         minimum bounding rectangle's upper right corner.LOWER_RIGHT-Measures
         will be accumulated from the point closest to the
         minimum bounding rectangle's lower right corner.
     measure_factor {Double}:
         A value multiplied by the measure length of each input line before
         they are merged to create route measures. The default is 1.
     measure_offset {Double}:
         A value added to the route measures after the input lines have been
         merged to create a route. The default is 0.
     ignore_gaps {Boolean}:
         Specifies whether spatial gaps will be ignored when calculating the
         measures on disjointed routes. This parameter is applicable when the
         measure source is LENGTH or ONE_FIELD.IGNORE-Spatial gaps will be
         ignored. Measure values will be continuous
         for disjointed routes. This is the default.NO_IGNORE-Spatial gaps will
         not be ignored. The measure values on
         disjointed routes will have gaps. The gap distance is calculated using
         the straight-line distance between the endpoints of the disjointed
         parts.
     build_index {Boolean}:
         Specifies whether an attribute index will be created for the route
         identifier field that is written to the output route feature
         class.INDEX-An attribute index will be created. This is the
         default.NO_INDEX-An attribute index will not be created.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will be created. It can be a shapefile or a
         geodatabase feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateRoutes_lr(
                *gp_fixargs(
                    (
                        in_line_features,
                        route_id_field,
                        out_feature_class,
                        measure_source,
                        from_measure_field,
                        to_measure_field,
                        coordinate_priority,
                        measure_factor,
                        measure_offset,
                        ignore_gaps,
                        build_index,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DissolveRouteEvents_lr", None)
def DissolveRouteEvents(
    in_events=None,
    in_event_properties=None,
    dissolve_field=None,
    out_table=None,
    out_event_properties=None,
    dissolve_type: Literal["CONCATENATE", "DISSOLVE"] | None = None,
    build_index: Literal["INDEX", "NO_INDEX"] | None = None,
) -> Result1[str]:
    """DissolveRouteEvents_lr(in_events, in_event_properties, dissolve_field;dissolve_field..., out_table, out_event_properties, {dissolve_type}, {build_index})

       Removes redundant information from event tables or separates event
       tables having more than one descriptive attribute into individual
       tables.

    INPUTS:
     in_events (Table View):
         The table with the rows that will be aggregated.
     in_event_properties (Route Measure Event Properties):
         The route location fields and the type of events in the input event
         table.Route identifier field-The field containing values that indicate
         the
         route on which each event is located. This field can be a numeric,
         text, or GUID field. Event type-The type of events in the
         input event table (POINT
         or LINE). POINT-Point events occur at a precise location along
         a route. Only a
         from-measure field must be specified.LINE-Line events define a portion
         of a route. Both from- and to-
         measure fields must be specified.From-measure field-A field containing
         measure values. This field must
         be numeric and is required when the event type is POINT or LINETo-
         measure field-A field containing measure values. This field must be
         numeric and is required when the event type is LINE.
     dissolve_field (Field):
         The fields that will be used to aggregate rows.
     out_event_properties (Route Measure Event Properties):
         The route location fields and the type of events that will be written
         to the output event table.Route identifier field-The field that will
         contain values that
         indicate the route on which each event is located. The field can be a
         numeric, text, or GUID field. Event type-The type of events
         the output event table will
         contain (POINT or LINE). POINT-Point events occur at a precise
         location along a route. Only a
         single measure field must be specified.LINE-Line events define a
         portion of a route. Both from- and to-
         measure fields must be specified.From-measure field-A field that will
         contain measure values. This
         field is required when the event type is POINT or LINE.To-measure
         field-A field that will contain measure values. This field
         is required when the event type is LINE.
     dissolve_type {Boolean}:
         Specifies how the input events will be aggregated.DISSOLVE-Events will
         be aggregated wherever there is measure overlap.
         This is the default.CONCATENATE-Events will be aggregated where the
         to-measure of one
         event matches the from-measure of the next event. This option is
         applicable only for line events.
     build_index {Boolean}:
         Specifies whether an attribute index will be created for the route
         identifier field that is written to the output event table.INDEX-An
         attribute index will be created. This is the
         default.NO_INDEX-An attribute index will not be created.

    OUTPUTS:
     out_table (Table):
         The table that will be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DissolveRouteEvents_lr(
                *gp_fixargs(
                    (
                        in_events,
                        in_event_properties,
                        dissolve_field,
                        out_table,
                        out_event_properties,
                        dissolve_type,
                        build_index,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("LocateFeaturesAlongRoutes_lr", None)
def LocateFeaturesAlongRoutes(
    in_features=None,
    in_routes=None,
    route_id_field=None,
    radius_or_tolerance=None,
    out_table=None,
    out_event_properties=None,
    route_locations: Literal["FIRST", "ALL"] | None = None,
    distance_field: Literal["DISTANCE", "NO_DISTANCE"] | None = None,
    zero_length_events: Literal["ZERO", "NO_ZERO"] | None = None,
    in_fields: Literal["FIELDS", "NO_FIELDS"] | None = None,
    m_direction_offsetting: Literal["M_DIRECTON", "NO_M_DIRECTION"] | None = None,
) -> Result1[str]:
    """LocateFeaturesAlongRoutes_lr(in_features, in_routes, route_id_field, radius_or_tolerance, out_table, out_event_properties, {route_locations}, {distance_field}, {zero_length_events}, {in_fields}, {m_direction_offsetting})

       Computes the intersection of input features (point, line, or polygon)
       and route features and writes the route and measure information to a
       new event table.

    INPUTS:
     in_features (Feature Layer):
         The input point, line, or polygon features.
     in_routes (Feature Layer):
         The routes with which the in_features parameter value will intersect.
     route_id_field (Field):
         The field containing values that uniquely identify each route. The
         field can be a numeric, text, or GUID field.
     radius_or_tolerance (Linear Unit):
         If the in_features parameter value is points, the search radius will
         be a numeric value defining how far around each point a search will be
         done to find a target route.If the in_features parameter value is
         lines, the search tolerance will
         be a cluster tolerance, which is a numeric value representing the
         maximum tolerated distance between the input lines and the target
         routes.If the in_features parameter value is polygons, this parameter
         is
         ignored and no search radius will be used.
     out_event_properties (Route Measure Event Properties):
         The route location fields and the type of events that will be written
         to the output event table.Route identifier field-The field that will
         contain values that
         indicate the route on which each event is located. The field can be a
         numeric, text, or GUID field. Event type-The type of events
         the output event table will
         contain (POINT or LINE). POINT-Point events occur at a precise
         location along a route. Only a
         single measure field must be specified.LINE-Line events define a
         portion of a route. Both from- and to-
         measure fields must be specified.From-measure field-A field that will
         contain measure values. This
         field is required when the event type is POINT or LINE.To-measure
         field-A field that will contain measure values. This field
         is required when the event type is LINE.
     route_locations {Boolean}:
         Specifies whether the closest route location or every route location
         within the search radius will be written to the out_table parameter
         value. When locating points along routes, more than one route may be
         within the search radius of any given point. This parameter is ignored
         when locating lines or polygons along routes.FIRST-Only the closest
         route location will be written to the out_table
         parameter value. This is the default.ALL-Every route location within
         the search radius will be written to
         the out_table parameter value.
     distance_field {Boolean}:
         Specifies whether afield will be added to the out_table
         parameter value. The values in this field are in the units of the
         specified search radius. This parameter is ignored when locating lines
         or polygons along routes. DISTANCEDISTANCE-A field containing
         the point-to-route distance will be added
         to the out_table parameter value. This is the default.NO_DISTANCE-A
         field containing the point-to-route distance will not be
         added to the out_table parameter value.
     zero_length_events {Boolean}:
         Specifies whether zero-length line events will be written to the
         output. When locating polygons along routes, events may be created
         where the from-measure is equal to the to-measure. This parameter is
         ignored when locating points or lines along routes.ZERO-Zero-length
         line events will be written to the out_table
         parameter value. This is the default.NO_ZERO-Zero-length line events
         will not be written to the out_table
         parameter value.
     in_fields {Boolean}:
         Specifies whether the out_table parameter value will contain route
         location fields and all the attributes from the in_features parameter
         value.FIELDS-The out_table parameter value will contain route location
         fields and all the attributes from the in_features parameter value.
         This is the default. NO_FIELDS-The out_table parameter value
         will only contain
         route location fields and thefield from the in_features parameter
         value. ObjectID
     m_direction_offsetting {Boolean}:
         Specifies whether the offset distance calculated will be based on the
         m-direction or the digitized direction. Distances are included in the
         out_table parameter value if the distance_field parameter is set to
         DISTANCE.M_DIRECTON-The distance values in the out_table parameter
         value will
         be calculated based on the m-direction of the route. Input features to
         the left of the m-direction of the route will be assigned a positive
         (+) offset, and features to the right of the m-direction will be
         assigned a negative (-) offset. This is the default.NO_M_DIRECTION-The
         distance values in the out_table parameter value
         will be calculated based on the digitized direction of the route.
         Input features to the left of the digitized direction of the route
         will be assigned a negative (-) offset, and features to the right of
         the digitized direction will be assigned a positive (+) offset.

    OUTPUTS:
     out_table (Table):
         The table that will be created. The output table can be a dBase (.dbf
         file) or a geodatabase table."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LocateFeaturesAlongRoutes_lr(
                *gp_fixargs(
                    (
                        in_features,
                        in_routes,
                        route_id_field,
                        radius_or_tolerance,
                        out_table,
                        out_event_properties,
                        route_locations,
                        distance_field,
                        zero_length_events,
                        in_fields,
                        m_direction_offsetting,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeRouteEventLayer_lr", None)
def MakeRouteEventLayer(
    in_routes=None,
    route_id_field=None,
    in_table=None,
    in_event_properties=None,
    out_layer=None,
    offset_field=None,
    add_error_field: Literal["ERROR_FIELD", "NO_ERROR_FIELD"] | None = None,
    add_angle_field: Literal["ANGLE_FIELD", "NO_ANGLE_FIELD"] | None = None,
    angle_type: Literal["NORMAL", "TANGENT"] | None = None,
    complement_angle: Literal["COMPLEMENT", "ANGLE"] | None = None,
    offset_direction: Literal["RIGHT", "LEFT"] | None = None,
    point_event_type: Literal["MULTIPOINT", "POINT"] | None = None,
) -> Result1[str | Layer]:
    """MakeRouteEventLayer_lr(in_routes, route_id_field, in_table, in_event_properties, out_layer, {offset_field}, {add_error_field}, {add_angle_field}, {angle_type}, {complement_angle}, {offset_direction}, {point_event_type})

       Creates a temporary feature layer using routes and route events.

    INPUTS:
     in_routes (Feature Layer):
         The route features on which events will be located.
     route_id_field (Field):
         The field containing values that uniquely identify each route. The
         field can be a numeric, text, or GUID field.
     in_table (Table View):
         The table whose rows will be located along routes.
     in_event_properties (Route Measure Event Properties):
         The route location fields and the type of events in the input event
         table.Route identifier field-The field containing values that indicate
         the
         route on which each event is located. This field can be a numeric,
         text, or GUID field. Event type-The type of events in the
         input event table (POINT
         or LINE). POINT-Point events occur at a precise location along
         a route. Only a
         from-measure field must be specified.LINE-Line events define a portion
         of a route. Both from- and to-
         measure fields must be specified.From-measure field-A field containing
         measure values. This field must
         be numeric and is required when the event type is POINT or LINETo-
         measure field-A field containing measure values. This field must be
         numeric and is required when the event type is LINE.
     offset_field {Field}:
         The field containing the values that will be used to offset events
         from their underlying route. This field must be numeric.
     add_error_field {Boolean}:
         Specifies whether afield will be added to the temporary layer
         that is created. LOC_ERRORNO_ERROR_FIELD-A field to store
         locating errors will not be added.
         This is the default.ERROR_FIELD-A field to store locating errors will
         be added.
     add_angle_field {Boolean}:
         Specifies whether afield will be added to the temporary layer
         that is created. This parameter is only valid when the event type is
         point. LOC_ANGLENO_ANGLE_FIELD-A field to store locating angles
         will not be added.
         This is the default.ANGLE_FIELD-A field to store locating angles will
         be added.
     angle_type {String}:
         Specifies the type of locating angle that will be calculated. This
         parameter is only valid if add_angle_field = "ANGLE_FIELD".NORMAL-The
         normal (perpendicular) angle will be calculated. This is
         the default.TANGENT-The tangent angle will be calculated.
     complement_angle {Boolean}:
         Specifies whether the complement of the locating angle will be
         written. This parameter is only valid if add_angle_field =
         "ANGLE_FIELD".ANGLE-The complement of the angle will not be written.
         Only the
         calculated angle will be written. This is the default.COMPLEMENT-The
         complement of the angle will be written.
     offset_direction {Boolean}:
         Specifies the side on which the route events with a positive offset
         will be displayed. This parameter is only valid if an offset field has
         been specified.LEFT-Events with a positive offset will be displayed to
         the left of
         the route. The side of the route is determined by the measures and not
         necessarily the digitized direction. This is the default.RIGHT-Events
         with a positive offset will be displayed to the right of
         the route. The side of the route is determined by the digitized
         direction.
     point_event_type {Boolean}:
         Specifies whether point events will be treated as point features or
         multipoint features.POINT-Point events will be treated as point
         features. This is the
         default.MULTIPOINT-Point events will be treated as multipoint
         features.

    OUTPUTS:
     out_layer (Feature Layer):
         The layer that will be created. This layer is stored in memory, so a
         path is not necessary."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeRouteEventLayer_lr(
                *gp_fixargs(
                    (
                        in_routes,
                        route_id_field,
                        in_table,
                        in_event_properties,
                        out_layer,
                        offset_field,
                        add_error_field,
                        add_angle_field,
                        angle_type,
                        complement_angle,
                        offset_direction,
                        point_event_type,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("OverlayRouteEvents_lr", None)
def OverlayRouteEvents(
    in_table=None,
    in_event_properties=None,
    overlay_table=None,
    overlay_event_properties=None,
    overlay_type: Literal["INTERSECT", "UNION"] | None = None,
    out_table=None,
    out_event_properties=None,
    zero_length_events: Literal["ZERO", "NO_ZERO"] | None = None,
    in_fields: Literal["FIELDS", "NO_FIELDS"] | None = None,
    build_index: Literal["INDEX", "NO_INDEX"] | None = None,
) -> Result1[str]:
    """OverlayRouteEvents_lr(in_table, in_event_properties, overlay_table, overlay_event_properties, overlay_type, out_table, out_event_properties, {zero_length_events}, {in_fields}, {build_index})

       Overlays two event tables to create an output event table that
       represents the union or intersection of the input.

    INPUTS:
     in_table (Table View):
         The input event table.
     in_event_properties (Route Measure Event Properties):
         The route location fields and the type of events in the input event
         table.Route identifier field-The field containing values that indicate
         the
         route on which each event is located. This field can be a numeric,
         text, or GUID field. Event type-The type of events in the
         input event table (POINT
         or LINE). POINT-Point events occur at a precise location along
         a route. Only a
         from-measure field must be specified.LINE-Line events define a portion
         of a route. Both from- and to-
         measure fields must be specified.From-measure field-A field containing
         measure values. This field must
         be numeric and is required when the event type is POINT or LINETo-
         measure field-A field containing measure values. This field must be
         numeric and is required when the event type is LINE.
     overlay_table (Table View):
         The overlay event table.
     overlay_event_properties (Route Measure Event Properties):
         The route location fields and the type of events in the overlay event
         table.Route identifier field-The field containing values that indicate
         which
         route each event is along. This field can be a numeric, text, or GUID
         field.Event type-The type of events in the overlay event table (POINT
         or
         LINE).POINT-Point events occur at a precise location along a route.
         Only a
         from-measure field must be specified.LINE-Line events define a portion
         of a route. Both from- and to-
         measure fields must be specified.From-measure field-A field containing
         measure values. This field must
         be numeric and is required when the event type is POINT or LINE.To-
         measure field-A field containing measure values. This field must be
         numeric and is required when the event type is LINE.
     overlay_type (String):
         Specifies the type of overlay that will be performed.INTERSECT-Only
         overlapping events will be written to the output event
         table. This is the default.UNION-All events will be written to the
         output table. Linear events
         will be split at their intersections.
     out_event_properties (Route Measure Event Properties):
         The route location fields and the type of events that will be written
         to the output event table.Route identifier field-The field that will
         contain values that
         indicate the route on which each event is located. The field can be a
         numeric, text, or GUID field. Event type-The type of events
         the output event table will
         contain (POINT or LINE). POINT-Point events occur at a precise
         location along a route. Only a
         single measure field must be specified.LINE-Line events define a
         portion of a route. Both from- and to-
         measure fields must be specified.From-measure field-A field that will
         contain measure values. This
         field is required when the event type is POINT or LINE.To-measure
         field-A field that will contain measure values. This field
         is required when the event type is LINE.
     zero_length_events {Boolean}:
         Specifies whether zero-length line events will be added to the
         out_table parameter value. This parameter is only valid when the
         output event type is LINE.ZERO-Zero-length line events will be added.
         This is the
         default.NO_ZERO-Zero-length line events will not be added.
     in_fields {Boolean}:
         Specifies whether all the fields from the input and overlay event
         tables will be included in the out_table parameter value.FIELDS-All
         the fields from the input tables will be included in the
         output table. This is the default. NO_FIELDS-All the fields
         from the input tables will not be
         included in the output table. Only thefield and the route location
         fields will be included. ObjectID
     build_index {Boolean}:
         Specifies whether an attribute index will be created for the route
         identifier field that is written to the out_table parameter
         value.INDEX-An attribute index will be created. This is the
         default.NO_INDEX-An attribute index will not be created.

    OUTPUTS:
     out_table (Table):
         The table that will be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.OverlayRouteEvents_lr(
                *gp_fixargs(
                    (
                        in_table,
                        in_event_properties,
                        overlay_table,
                        overlay_event_properties,
                        overlay_type,
                        out_table,
                        out_event_properties,
                        zero_length_events,
                        in_fields,
                        build_index,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TransformRouteEvents_lr", None)
def TransformRouteEvents(
    in_table=None,
    in_event_properties=None,
    in_routes=None,
    route_id_field=None,
    target_routes=None,
    target_route_id_field=None,
    out_table=None,
    out_event_properties=None,
    cluster_tolerance=None,
    in_fields: Literal["FIELDS", "NO_FIELDS"] | None = None,
) -> Result1[str]:
    """TransformRouteEvents_lr(in_table, in_event_properties, in_routes, route_id_field, target_routes, target_route_id_field, out_table, out_event_properties, cluster_tolerance, {in_fields})

       Transforms the measures of events from one route reference to another
       and writes them to a new event table.

    INPUTS:
     in_table (Table View):
         The input event table.
     in_event_properties (Route Measure Event Properties):
         The route location fields and the type of events in the input event
         table.Route identifier field-The field containing values that indicate
         the
         route on which each event is located. This field can be a numeric,
         text, or GUID field. Event type-The type of events in the
         input event table (POINT
         or LINE). POINT-Point events occur at a precise location along
         a route. Only a
         from-measure field must be specified.LINE-Line events define a portion
         of a route. Both from- and to-
         measure fields must be specified.From-measure field-A field containing
         measure values. This field must
         be numeric and is required when the event type is POINT or LINETo-
         measure field-A field containing measure values. This field must be
         numeric and is required when the event type is LINE.
     in_routes (Feature Layer):
         The input route features.
     route_id_field (Field):
         The field containing values that uniquely identify each input route.
         The field can be a numeric, text, or GUID field.
     target_routes (Feature Layer):
         The route features to which the input events will be transformed.
     target_route_id_field (Field):
         The field containing values that uniquely identify each target route.
         The field can be a numeric, text, or GUID field.
     out_event_properties (Route Measure Event Properties):
         The route location fields and the type of events that will be written
         to the output event table.Route identifier field-The field that will
         contain values that
         indicate the route on which each event is located. The field can be a
         numeric, text, or GUID field. Event type-The type of events
         the output event table will
         contain (POINT or LINE). POINT-Point events occur at a precise
         location along a route. Only a
         single measure field must be specified.LINE-Line events define a
         portion of a route. Both from- and to-
         measure fields must be specified.From-measure field-A field that will
         contain measure values. This
         field is required when the event type is POINT or LINE.To-measure
         field-A field that will contain measure values. This field
         is required when the event type is LINE.
     cluster_tolerance (Linear Unit):
         The maximum tolerated distance between the input events and the target
         routes.
     in_fields {Boolean}:
         Specifies whether the out_table parameter value will contain route
         location fields plus all the attributes from the input
         events.FIELDS-The out_table parameter value will contain route
         location
         fields plus all the attributes from the input events. This is the
         default. NO_FIELDS-The out_table parameter value will only
         contain
         route location fields plus thefield from the input events.
         ObjectID

    OUTPUTS:
     out_table (Table):
         The table that will be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TransformRouteEvents_lr(
                *gp_fixargs(
                    (
                        in_table,
                        in_event_properties,
                        in_routes,
                        route_id_field,
                        target_routes,
                        target_route_id_field,
                        out_table,
                        out_event_properties,
                        cluster_tolerance,
                        in_fields,
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
