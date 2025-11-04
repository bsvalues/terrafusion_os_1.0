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
r"""The Location Referencing toolbox provides essential tools for the
configuration and management of the LRS."""
from __future__ import annotations

__all__ = [
    "AppendEvents",
    "AppendRoutes",
    "ApplyEventBehaviors",
    "CalculateIntersectingRouteMeasures",
    "CalculateRouteConcurrencies",
    "ConfigureAddressFeatureClasses",
    "ConfigureExternalEventWithLRS",
    "ConfigureLookupTable",
    "ConfigureRouteDominanceRules",
    "ConfigureUtilityNetworkFeatureClass",
    "CreateLRS",
    "CreateLRSEvent",
    "CreateLRSEventFromExistingDataset",
    "CreateLRSFromExistingDataset",
    "CreateLRSIntersection",
    "CreateLRSIntersectionFromExistingDataset",
    "CreateLRSNetwork",
    "CreateLRSNetworkFromExistingDataset",
    "DeleteRoutes",
    "DeriveEventMeasures",
    "DisableDerivedMeasureFields",
    "DisableReferentFields",
    "DisableStationingFields",
    "EnableDerivedMeasureFields",
    "EnableReferentFields",
    "EnableStationingFields",
    "GenerateCalibrationPoints",
    "GenerateEvents",
    "GenerateIntersections",
    "GenerateLrsDataProduct",
    "GenerateRoutes",
    "ModifyEventBehaviorRules",
    "ModifyLRS",
    "ModifyLRSEvent",
    "ModifyLRSIntersection",
    "ModifyLRSNetwork",
    "ModifyNetworkCalibrationRules",
    "ModifyRouteIdPadding",
    "OverlayEvents",
    "RemoveLRSEntity",
    "RemoveOverlappingCenterlines",
    "ReverseLineOrders",
    "TranslateEventMeasures",
    "UpdateMeasuresFromLRS",
]
__alias__ = "locref"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Tools
@gptooldoc("AppendEvents_locref", None)
def AppendEvents(
    in_dataset=None,
    in_target_event=None,
    field_mapping=None,
    load_type: Literal["ADD", "RETIRE_OVERLAPS", "RETIRE_BY_EVENT_ID", "REPLACE_BY_EVENT_ID"] | None = None,
    generate_event_ids: Literal["GENERATE_EVENT_IDS", "NO_GENERATE_EVENT_IDS"] | None = None,
    generate_shapes: Literal["GENERATE_SHAPES", "NO_SHAPES"] | None = None,
) -> Result2[str | Layer, str]:
    """AppendEvents_locref(in_dataset, in_target_event, field_mapping, {load_type}, {generate_event_ids}, {generate_shapes})

       Appends event records from a table, layer, or feature class to an
       existing ArcGIS Location Referencing event feature class.

    INPUTS:
     in_dataset (Table View):
         The source event records to append.
     in_target_event (Feature Layer):
         The Location Referencing event layer or feature class to which the
         source event records will be appended.
     field_mapping (Field Mappings):
         Controls how the attribute information in fields of the in_dataset
         parameter value is transferred to the in_target_event parameter
         value.Because the in_dataset parameter value is appended to an
         existing
         event that has a predefined schema (field definitions), fields cannot
         be added or removed from the target dataset. While you can set merge
         rules for each output field, the tool ignores those rules.The
         FieldMappings class can be used to define this parameter.
     load_type {String}:
         Specifies how appended events with measure or temporality overlaps
         with identical event IDs as the in_target_event records will be loaded
         into the event feature class.ADD-The in_dataset records will be
         appended to the specified target
         event feature class. No changes are made to the target event
         records.RETIRE_OVERLAPS-The in_dataset records will be appended to the
         specified target event feature class and any records that have the
         same measure or temporality overlaps as the appended events will be
         retired. If the appended event eclipses the specified target event
         feature, the target event record will be deleted. Use this option for
         linear events only.RETIRE_BY_EVENT_ID-The in_dataset records will be
         appended to the
         specified target event feature class and any records that have the
         same event ID and temporality overlaps as the appended events will be
         retired. If the appended event eclipses a target event record that has
         the same event ID, the target event record will be
         deleted.REPLACE_BY_EVENT_ID-The in_dataset records will be appended to
         the
         specified target event feature class, and any records that have the
         same event ID as the appended events will be replaced.
     generate_event_ids {Boolean}:
         Specifies whether event IDs will be generated for in_dataset
         records being appended. Generation of event IDs will only be applied
         to in_dataset records with a Null value for thefield. Event
         IDGENERATE_EVENT_IDS-Event IDs for the in_dataset records being
         appended
         will be generated.NO_GENERATE_EVENT_IDS-Event IDs for the in_dataset
         records being
         appended will not be generated. This is the default.
     generate_shapes {Boolean}:
         Specifies whether the shapes of the records being appended will be
         regenerated. This parameter is only enabled when the in_dataset value
         is a feature layer or feature class.GENERATE_SHAPES-The shapes of the
         input event features will be
         regenerated. This is the default.NO_SHAPES-The shapes of the input
         event features will not be
         regenerated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AppendEvents_locref(
                *gp_fixargs(
                    (in_dataset, in_target_event, field_mapping, load_type, generate_event_ids, generate_shapes), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AppendRoutes_locref", None)
def AppendRoutes(
    source_routes=None,
    in_lrs_network=None,
    route_id_field=None,
    route_name_field=None,
    from_date_field=None,
    to_date_field=None,
    line_id_field=None,
    line_name_field=None,
    line_order_field=None,
    field_map=None,
    load_type: Literal["ADD", "RETIRE_BY_ROUTE_ID", "REPLACE_BY_ROUTE_ID"] | None = None,
    load_field: Literal["ROUTE_ID", "ROUTE_NAME"] | None = None,
    consider_existing_centerlines: Literal["CONSIDER", "DO_NOT_CONSIDER"] | None = None,
) -> Result2[str | Layer, str]:
    """AppendRoutes_locref(source_routes, in_lrs_network, route_id_field, {route_name_field}, {from_date_field}, {to_date_field}, {line_id_field}, {line_name_field}, {line_order_field}, {field_map}, {load_type}, {load_field}, {consider_existing_centerlines})

       Appends routes from an input polyline into an LRS Network.

    INPUTS:
     source_routes (Feature Layer):
         The input from which the routes will be derived. The input can be a
         polyline feature class, shapefile, feature service, or LRS Network
         feature class.
     in_lrs_network (Feature Layer):
         The target LRS Network where the routes will be loaded.
     route_id_field (Field):
         The field in the input polyline feature class that will be
         mapped to the LRS Network route ID. The field type must match thefield
         type of the target LRS Network and must be either a string or GUID
         field type. If it is a string field, the field length must be shorter
         than or equal to the length of the targetfield. RouteIDRouteID
     route_name_field {Field}:
         The field in the input polyline feature class that will be mapped as
         the LRS Network route name. The field must be a string field, and the
         field length must be shorter than or equal to the length of the target
         route name field.
     from_date_field {Field}:
         A date field in the input polyline feature class that will be mapped
         as the from_date_field value in the LRS Network. If the field is not
         mapped, a null value representing the beginning of time will be
         provided for all appended routes.
     to_date_field {Field}:
         A date field in the input polyline feature class that will be mapped
         as the to_date_field value in the LRS Network. If the field is not
         mapped, a null value representing the end of time will be provided for
         all appended routes.
     line_id_field {Field}:
         The field in the input polyline feature class that will be
         mapped as the LRS Network line ID. This parameter is only used if the
         target LRS Network is an LRS line network. The field type and length
         must match thefield type and length of the centerline sequence table.
         RouteID
     line_name_field {Field}:
         The string field in the input polyline feature class that will be
         mapped as the LRS Network line name. This parameter is only used if
         the target LRS Network is an LRS line network.
     line_order_field {Field}:
         The long integer field in the input polyline feature class that will
         be mapped as the LRS Network line order. This parameter is only used
         if the target LRS Network is an LRS line network.Learn more about line
         networks and line order in Pipeline Referencing
         or line networks and line order in Roads and Highways.
     field_map {Field Mappings}:
         Controls how attribute information in the source route fields will be
         transferred to the input LRS Network. Fields cannot be added to or
         removed from the target LRS Network because the data of the source
         routes is appended to an existing LRS Network that has a predefined
         schema (field definitions). While you can set merge rules for each
         output field, the tool will ignore them. The ArcPy FieldMappings class
         can be used to define this parameter.
     load_type {String}:
         Specifies how appended routes with measure or temporality overlaps
         with identical route IDs will be loaded into the network feature
         class.ADD-The appended routes will be loaded into the target LRS
         Network. If
         any route ID in the source routes already exists in the target LRS
         Network with the same temporality, it will be written to the output
         log as a duplicate route and must be corrected or filtered out before
         completing the loading process. This is the
         default.RETIRE_BY_ROUTE_ID-The appended routes will be loaded into the
         target
         LRS Network and any routes in the target LRS Network that have the
         same route ID and temporality overlap as the appended routes will be
         retired. If the appended route eclipses a target route with the same
         route ID, the target route will be deleted.REPLACE_BY_ROUTE_ID-The
         appended routes will be loaded into the target
         LRS Network and any routes in the target LRS Network with the same
         route ID as the appended routes will be deleted.
     load_field {String}:
         Specifies the field that will be used for loading routes.
         ROUTE_ID-The routes will be loaded using thefield. This is
         the default. RouteID         ROUTE_NAME-The routes will be
         loaded using thefield. This
         option is only available for the networks with RouteName configured in
         the LRS Network when the load_type parameter is set to ADD.
         RouteName
     consider_existing_centerlines {Boolean}:
         Specifies whether routes will be appended using existing
         centerlines.CONSIDER-Routes will be appended using existing
         centerlines and no new
         centerlines will be created.DO_NOT_CONSIDER-New centerlines will be
         created for the appended
         routes. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AppendRoutes_locref(
                *gp_fixargs(
                    (
                        source_routes,
                        in_lrs_network,
                        route_id_field,
                        route_name_field,
                        from_date_field,
                        to_date_field,
                        line_id_field,
                        line_name_field,
                        line_order_field,
                        field_map,
                        load_type,
                        load_field,
                        consider_existing_centerlines,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyEventBehaviors_locref", None)
def ApplyEventBehaviors(
    in_route_features=None,
) -> Result2[str | Layer, str]:
    """ApplyEventBehaviors_locref(in_route_features)

       Updates the event locations for all event feature classes registered
       with the input network based on the route edit performed.

    INPUTS:
     in_route_features (Feature Layer):
         The LRS Network for which event locations will be updated. This must
         be a feature layer registered as a network with the LRS."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.ApplyEventBehaviors_locref(*gp_fixargs((in_route_features,), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateIntersectingRouteMeasures_locref", None)
def CalculateIntersectingRouteMeasures(
    in_intersection_feature_class=None,
    out_dataset=None,
    tvd=None,
) -> Result1[str]:
    """CalculateIntersectingRouteMeasures_locref(in_intersection_feature_class, out_dataset, {tvd})

       Creates a table of all the routes and measures at each intersection
       location.

    INPUTS:
     in_intersection_feature_class (Feature Layer):
         The input LRS intersection feature class or layer.
     tvd {Date}:
         Filters routes that have been edited after a certain date so that
         intersections can be generated according to that filter.

    OUTPUTS:
     out_dataset (Table):
         The output table to which the results will be posted."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateIntersectingRouteMeasures_locref(
                *gp_fixargs((in_intersection_feature_class, out_dataset, tvd), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateRouteConcurrencies_locref", None)
def CalculateRouteConcurrencies(
    in_route_features=None,
    out_dataset=None,
    tvd=None,
    find_dominance: Literal["FIND_DOMINANCE", "NO_FIND_DOMINANCE"] | None = None,
    include_geometry: Literal["INCLUDE_GEOMETRY", "EXCLUDE_GEOMETRY"] | None = None,
) -> Result1[str]:
    """CalculateRouteConcurrencies_locref(in_route_features, out_dataset, {tvd}, {find_dominance}, {include_geometry})

       Calculates and reports concurrent route sections in an LRS Network.

    INPUTS:
     in_route_features (Feature Layer):
         The LRS Network feature class in which route concurrencies will be
         calculated.
     tvd {Date}:
         The temporal view date for the network, if one is specified. Leaving
         this field blank shows all time.
     find_dominance {Boolean}:
         Specifies whether configured route dominance rules will be used to set
         dominance.FIND_DOMINANCE-Configured route dominance rules will be used
         to
         determine the dominant route in each concurrent section. This is the
         default.NO_FIND_DOMINANCE-Configured route dominance rules will not be
         used to
         determine the dominant route in each concurrent section.
     include_geometry {Boolean}:
         Specifies whether geometry will be included in the output
         dataset.EXCLUDE_GEOMETRY-Geometry will not be included in the output
         dataset.
         This is the default.INCLUDE_GEOMETRY-Geometry will be included in the
         output dataset.

    OUTPUTS:
     out_dataset (Table):
         The feature class or table to which the calculated results will be
         posted."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateRouteConcurrencies_locref(
                *gp_fixargs((in_route_features, out_dataset, tvd, find_dominance, include_geometry), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DeleteRoutes_locref", None)
def DeleteRoutes(
    in_route_features=None,
    delete_associated_calibration_points: Literal["DELETE_CALIBRATION_POINTS", "NO_DELETE_CALIBRATION_POINTS"]
    | None = None,
    delete_associated_events: Literal["DELETE_EVENTS", "NO_DELETE_EVENTS"] | None = None,
    delete_associated_centerlines: Literal["DELETE_CENTERLINES", "NO_DELETE_CENTERLINES"] | None = None,
) -> Result3[str | Layer, str, str | Layer]:
    """DeleteRoutes_locref(in_route_features, {delete_associated_calibration_points}, {delete_associated_events}, {delete_associated_centerlines})

       Deletes routes and associated data elements from the LRS Network.

    INPUTS:
     in_route_features (Feature Layer):
         The route feature class registered with the network.
     delete_associated_calibration_points {Boolean}:
         Specifies whether calibration points associated with the deleted
         routes will be deleted.DELETE_CALIBRATION_POINTS-Calibration points
         associated with the
         routes will be deleted.NO_DELETE_CALIBRATION_POINTS-Calibration points
         associated with the
         routes will not be deleted. This is the default.
     delete_associated_events {Boolean}:
         Specifies whether events associated with the deleted routes will be
         deleted.DELETE_EVENTS-Events associated with the routes will be
         deleted.NO_DELETE_EVENTS-Events associated with the routes will not be
         deleted. This is the default.
     delete_associated_centerlines {Boolean}:
         Specifies whether centerlines that are exclusively associated with the
         deleted routes will be deleted.DELETE_CENTERLINES-Centerlines
         exclusively associated with the
         selected routes will be deleted. If centerlines are shared between
         networks, those common centerlines will not be
         deleted.NO_DELETE_CENTERLINES-Centerlines will not be deleted. This is
         the
         default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DeleteRoutes_locref(
                *gp_fixargs(
                    (
                        in_route_features,
                        delete_associated_calibration_points,
                        delete_associated_events,
                        delete_associated_centerlines,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DeriveEventMeasures_locref", None)
def DeriveEventMeasures(
    in_route_features=None,
    update_all_events: Literal["UPDATE_ALL", "UPDATE_SOME"] | None = None,
    event_layers=None,
) -> Result2[str | Layer, str]:
    """DeriveEventMeasures_locref(in_route_features, {update_all_events}, {event_layers;event_layers...})

       Populates and updates the DerivedRouteID field and measure values on
       point and line events with those fields configured and enabled.

    INPUTS:
     in_route_features (Feature Layer):
         The LRS Network containing the events with thefield and
         measure fields configured. DerivedRouteID
     update_all_events {Boolean}:
         Specifies whether all event feature classes in the network will be
         updated.UPDATE_ALL-All event feature classes in the network that are
         selected
         in the in_route_features parameter value will be updated. This is the
         default.UPDATE_SOME-All event feature classes in the network that are
         selected
         in the in_route_features parameter value will not be updated.
         Individual event layers can be selected using the event_layers
         parameter.
     event_layers {Feature Layer}:
         The event layers that will have thefield and measure fields
         updated. DerivedRouteID"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DeriveEventMeasures_locref(*gp_fixargs((in_route_features, update_all_events, event_layers), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateCalibrationPoints_locref", None)
def GenerateCalibrationPoints(
    in_polyline_features=None,
    route_id_field=None,
    from_date_field=None,
    to_date_field=None,
    in_calibration_point_feature_class=None,
    lrs_network=None,
    calibration_direction: Literal["DIGITIZED_DIRECTION", "MEASURE_DIRECTION"] | None = None,
    calibration_method: Literal["GEOMETRY_LENGTH", "M_ON_ROUTE", "ATTRIBUTE_FIELDS"] | None = None,
    from_measure_field=None,
    to_measure_field=None,
) -> Result2[str | Layer, str]:
    """GenerateCalibrationPoints_locref(in_polyline_features, route_id_field, from_date_field, to_date_field, in_calibration_point_feature_class, lrs_network, {calibration_direction}, {calibration_method}, {from_measure_field}, {to_measure_field})

       Generates calibration points for any route shape provided, including
       complex shapes such as self-closing, self-intersecting, and branched
       routes.

    INPUTS:
     in_polyline_features (Feature Layer):
         The features that will be used as the source to calculate the measure
         values for calibration points.
     route_id_field (Field):
         The field containing values that uniquely identify each route.
         The field type must match thefield in the calibration point feature
         class. Route ID
     from_date_field (Field):
         The field containing the from date values of a route.
     to_date_field (Field):
         The field containing the to date values of a route.
     in_calibration_point_feature_class (Feature Layer):
         The existing calibration point feature class to which new features
         will be added.
     lrs_network (String):
         The LRS Network for which the measure values will be generated in the
         calibration points feature class.
     calibration_direction {String}:
         Specifies the direction of increasing calibration on a route when
         creating calibration points.DIGITIZED_DIRECTION-The direction of
         digitization of the individual
         polyline features determines the direction of calibration for the
         route. This is the default. MEASURE_DIRECTION-The direction of
         increasing m-values of the
         individual polyline feature determines the direction of calibration
         for the route. If the individual polyline feature does not
         include m-values, the
         digitized direction will be used.
     calibration_method {String}:
         Specifies the method that will be used to determine the measures on a
         route when creating calibration points.GEOMETRY_LENGTH-The geometrical
         length of the input route feature will
         be used as the calibration method. This is the default.M_ON_ROUTE-The
         measure values on the input route feature will be used
         as the calibration method.ATTRIBUTE_FIELDS-The measure values stored
         in attribute fields of the
         input route feature will be used as the calibration method.
     from_measure_field {Field}:
         The field containing the from measure for the selected route.This
         parameter is enabled when the calibration_method parameter is set
         to ATTRIBUTE_FIELDS.
     to_measure_field {Field}:
         The field containing the to measure for the selected route.This
         parameter is enabled when the calibration_method parameter is set
         to ATTRIBUTE_FIELDS."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateCalibrationPoints_locref(
                *gp_fixargs(
                    (
                        in_polyline_features,
                        route_id_field,
                        from_date_field,
                        to_date_field,
                        in_calibration_point_feature_class,
                        lrs_network,
                        calibration_direction,
                        calibration_method,
                        from_measure_field,
                        to_measure_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateEvents_locref", None)
def GenerateEvents(
    in_event_layer=None,
) -> Result2[str | Layer, str]:
    """GenerateEvents_locref(in_event_layer)

       Regenerates shapes for event features registered with an LRS Network.

    INPUTS:
     in_event_layer (Feature Layer):
         The event for which shapes will be regenerated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.GenerateEvents_locref(*gp_fixargs((in_event_layer,), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateIntersections_locref", None)
def GenerateIntersections(
    in_intersection_feature_class=None,
    in_network_layer=None,
    start_date=None,
    edited_by_current_user: Literal["CURRENT_USER", "ALL_USERS"] | None = None,
) -> Result2[str | Layer, str]:
    """GenerateIntersections_locref(in_intersection_feature_class, {in_network_layer}, {start_date}, {edited_by_current_user})

       Generates new intersections and updates existing intersections.

    INPUTS:
     in_intersection_feature_class (Feature Layer):
         The input LRS intersection feature class or layer.
     in_network_layer {Feature Layer}:
         The input LRS Network feature class or layer.
     start_date {Date}:
         Filters routes that have been edited after a certain date so that
         intersections can be generated.
     edited_by_current_user {Boolean}:
         Specifies whether intersections will be generated only for routes
         edited and locked by the current user.CURRENT_USER-Intersections will
         be generated only for routes edited by
         the current user. This is the default.ALL_USERS-Intersections will be
         generated for all edited routes."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateIntersections_locref(
                *gp_fixargs((in_intersection_feature_class, in_network_layer, start_date, edited_by_current_user), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateLrsDataProduct_locref", None)
def GenerateLrsDataProduct(
    in_template=None,
    in_route_features=None,
    effective_date=None,
    units: Literal[
        "INCHES",
        "FEET",
        "YARDS",
        "MILES",
        "NAUTICAL_MILES",
        "INTFEET",
        "INTMILES",
        "MILLIMETERS",
        "CENTIMETERS",
        "METERS",
        "KILOMETERS",
        "DECIMETERS",
    ]
    | None = None,
    boundary_features=None,
    summary_field=None,
    exclude_null_summary_rows: Literal["EXCLUDE", "DO_NOT_EXCLUDE"] | None = None,
    output_format: Literal["CSV"] | None = None,
    out_file=None,
    out_table=None,
) -> Result2[str, str]:
    """GenerateLrsDataProduct_locref(in_template, in_route_features, effective_date, units, {boundary_features}, {summary_field}, {exclude_null_summary_rows}, {output_format}, {out_file}, {out_table})

       Transforms LRS data to create a length product for selected routes in
       an LRS Network. For example, use this tool to summarize the mileage of
       a set of routes or lines by a county boundary.

    INPUTS:
     in_template (File):
         The input LRS Data template that specifies the summary and length
         fields.
     in_route_features (Feature Layer):
         The LRS Network that will be used to calculate the length.
     effective_date (Date):
         The date that will be used to define the temporal view of the network.
     units (String):
         Specifies the measurement units that will be used for the length field
         in the output.INCHES-The units will be inches.FEET-The units will be
         feet.YARDS-The
         units will be yards.MILES-The units will be miles.NAUTICAL_MILES-The
         units will be nautical miles.INTMILES-The units will be international
         miles.INTFEET-The units will be international feet.MILLIMETERS-The
         units will be millimeters.CENTIMETERS-The units will be
         centimeters.METERS-The units will be meters.KILOMETERS-The units will
         be kilometers.DECIMETERS-The units will be decimeters.
     boundary_features {Feature Layer}:
         The boundary layer that will be used to summarize the data.
     summary_field {Field}:
         The field from the boundary layer that provides the names for the
         summary rows.
     exclude_null_summary_rows {Boolean}:
         Specifies whether null summary rows will be excluded from the
         output.EXCLUDE-Uncalibrated routes or routes with zero length will be
         excluded from the output. This is the
         default.DO_NOT_EXCLUDE-Uncalibrated routes or routes with zero length
         will not
         be excluded from the output; they will be included in the output with
         a mileage of 0.
     output_format {String}:
         Specifies the format of the output file.CSV-The output file will be a
         .csv file. This is the default.

    OUTPUTS:
     out_file {File}:
         The output .csv file where the calculated length will be written.
     out_table {Table}:
         The table that will be created with the calculated length."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateLrsDataProduct_locref(
                *gp_fixargs(
                    (
                        in_template,
                        in_route_features,
                        effective_date,
                        units,
                        boundary_features,
                        summary_field,
                        exclude_null_summary_rows,
                        output_format,
                        out_file,
                        out_table,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateRoutes_locref", None)
def GenerateRoutes(
    in_route_features=None,
    record_calibration_changes: Literal["RECORD_CALIBRATION_CHANGES", "NO_RECORD_CALIBRATION_CHANGES"] | None = None,
) -> Result3[str | Layer, str | Layer, str]:
    """GenerateRoutes_locref(in_route_features, {record_calibration_changes})

       Re-creates shapes and applies calibration changes for route features
       in an LRS Network.

    INPUTS:
     in_route_features (Feature Layer):
         The LRS Network for which route shapes will be regenerated and
         calibration changes will be applied.
     record_calibration_changes {Boolean}:
         This parameter is no longer supported. Any value provided will be
         ignored."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateRoutes_locref(*gp_fixargs((in_route_features, record_calibration_changes), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("OverlayEvents_locref", None)
def OverlayEvents(
    in_route_features=None,
    event_layers=None,
    output_dataset=None,
    include_geometry: Literal["INCLUDE_GEOMETRY", "EXCLUDE_GEOMETRY"] | None = None,
    network_fields=None,
) -> Result1[str]:
    """OverlayEvents_locref(in_route_features, event_layers;event_layers..., output_dataset, {include_geometry}, {network_fields;network_fields...})

       Overlays one or more line and point event layers onto a target network
       and outputs a feature class or table that represents the dynamic
       segmentation of the inputs.

    INPUTS:
     in_route_features (Feature Layer):
         The target network onto which the event layers will be dynamically
         segmented.
     event_layers (Feature Layer):
         The event layers that will be dynamically segmented together onto a
         target network. The centerline layer can be used as an input to
         dynamically segment events.
     include_geometry {Boolean}:
         Specifies whether the output_dataset parameter value will include
         event geometry.EXCLUDE_GEOMETRY-The output_dataset parameter value
         will not include
         event geometry. Event records will be stored as a table. This is the
         default.INCLUDE_GEOMETRY-The output_dataset parameter value will
         include event
         geometry. Event records will be stored as a feature class.
     network_fields {Field}:
         The fields from the network layer that will be included in the output.

    OUTPUTS:
     output_dataset (Table):
         The table or feature class containing the output event records that
         will be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.OverlayEvents_locref(
                *gp_fixargs((in_route_features, event_layers, output_dataset, include_geometry, network_fields), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RemoveOverlappingCenterlines_locref", None)
def RemoveOverlappingCenterlines(
    in_centerline_features=None,
) -> Result2[str | Layer, str]:
    """RemoveOverlappingCenterlines_locref(in_centerline_features)

       Removes overlapping centerline sections to ensure that there is one
       common centerline when centerline geometry overlaps.

    INPUTS:
     in_centerline_features (Feature Layer):
         An input layer or feature class representing an LRS centerline."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RemoveOverlappingCenterlines_locref(*gp_fixargs((in_centerline_features,), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ReverseLineOrders_locref", None)
def ReverseLineOrders(
    in_route_features=None,
) -> Result3[str | Layer, str, str | Layer]:
    """ReverseLineOrders_locref(in_route_features)

       Reverses the line order for all the routes in a line.

    INPUTS:
     in_route_features (Feature Layer):
         The LRS line network for which line order values will be reversed."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.ReverseLineOrders_locref(*gp_fixargs((in_route_features,), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("TranslateEventMeasures_locref", None)
def TranslateEventMeasures(
    in_source_event=None,
    in_target_route_features=None,
    out_target_event=None,
    in_concurrent_route_matching: Literal["ANY", "ROUTE_ID", "ALL"] | None = None,
) -> Result1[str]:
    """TranslateEventMeasures_locref(in_source_event, in_target_route_features, out_target_event, {in_concurrent_route_matching})

       Translates the measures (m-values) of a point or line event layer from
       one linear referencing method (LRM) to another.

    INPUTS:
     in_source_event (Feature Layer):
         The input event layer to be translated.
     in_target_route_features (Feature Layer):
         The target LRS Network against which the input events will be
         translated.
     in_concurrent_route_matching {String}:
         Specifies the method used to determine which route to translate the
         event against when concurrent routes exist in the target LRS Network.
         This parameter is only applied when the location of the event
         translation on the target LRS Network has concurrent routes (routes
         that share a location).ANY-The input event layer is translated against
         the first of two or
         more concurrent routes found in the target LRS Network.ROUTE_ID-The
         Route ID of the source event is compared to the Route IDs
         of concurrent routes in the target LRS Network. The source event will
         translate based on Route ID matches in the source event and target
         network. The Route IDs of the input event and target LRS Network must
         be an exact match for this method to correctly translate the event.
         The input event layer must also be a registered LRS event to use this
         method.ALL-The input event is translated against all the concurrent
         routes at
         that location in the target LRS Network.

    OUTPUTS:
     out_target_event (Feature Class):
         The output feature class that will contain the translated event
         features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TranslateEventMeasures_locref(
                *gp_fixargs(
                    (in_source_event, in_target_route_features, out_target_event, in_concurrent_route_matching), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateMeasuresFromLRS_locref", None)
def UpdateMeasuresFromLRS(
    lrs_network=None,
    lrs_date=None,
    in_features=None,
    route_id_field=None,
    from_measure_field=None,
    to_measure_field=None,
) -> Result2[str | Layer, str]:
    """UpdateMeasuresFromLRS_locref(lrs_network, lrs_date, in_features, route_id_field, from_measure_field, {to_measure_field})

       Populates or updates the measures and route ID on Utility Network (UN)
       features such as pipes, devices, and junctions or on features in
       feature classes that are not UN or LRS feature classes.

    INPUTS:
     lrs_network (Feature Layer):
         The feature layer that contains the routes, route IDs, and measures.
     lrs_date (Date):
         The date used to define the temporal view of the network for
         collecting the route and measure values.
     in_features (Feature Layer):
         The layer that includes route ID and measure fields that will be
         updated based on feature geometry relative to routes in the
         lrs_network parameter.
     route_id_field (Field):
         The field in the in_features layer that contains the route ID value.
     from_measure_field (Field):
         The field in the in_features layer that contains the from measure
         value for polyline features.
     to_measure_field {Field}:
         The field in the in_features layer that contains the measure value for
         point features or the to measure value for polyline features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpdateMeasuresFromLRS_locref(
                *gp_fixargs(
                    (lrs_network, lrs_date, in_features, route_id_field, from_measure_field, to_measure_field), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Configuration toolset
@gptooldoc("ConfigureAddressFeatureClasses_locref", None)
def ConfigureAddressFeatureClasses(
    in_address_range_features=None,
    left_from_address_field=None,
    left_to_address_field=None,
    right_from_address_field=None,
    right_to_address_field=None,
    in_site_address_features=None,
    address_number_field=None,
) -> Result2[str | Layer, str | Layer]:
    """ConfigureAddressFeatureClasses_locref(in_address_range_features, left_from_address_field, left_to_address_field, right_from_address_field, right_to_address_field, in_site_address_features, address_number_field)

       Configures the Address Range and Site Address feature classes from the
       Address Data Management solution for use with a linear referencing
       system (LRS) with the ArcGIS Roads and Highways extension.

    INPUTS:
     in_address_range_features (Feature Layer):
         The input LRS centerline or LRS line event feature class that is the
         Address Management Address Range feature class.
     left_from_address_field (Field):
         The field in the Address Range feature class that contains information
         for the first address on the left side of a roadway.
     left_to_address_field (Field):
         The field in the Address Range feature class that contains information
         for the last address on the left side of a roadway.
     right_from_address_field (Field):
         The field in the Address Range feature class that contains information
         for the first address on the right side of a roadway.
     right_to_address_field (Field):
         The field in the Address Range feature class that contains information
         for the last address on the right side of a roadway.
     in_site_address_features (Feature Layer):
         The input point feature class that is the Address Management Site
         Address feature class.
     address_number_field (Field):
         The field in the Site Address feature class that contains information
         for the site address number."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConfigureAddressFeatureClasses_locref(
                *gp_fixargs(
                    (
                        in_address_range_features,
                        left_from_address_field,
                        left_to_address_field,
                        right_from_address_field,
                        right_to_address_field,
                        in_site_address_features,
                        address_number_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ConfigureUtilityNetworkFeatureClass_locref", None)
def ConfigureUtilityNetworkFeatureClass(
    in_feature_class=None,
    route_id_field=None,
    from_measure_field=None,
    to_measure_field=None,
) -> Result1[str | Layer]:
    """ConfigureUtilityNetworkFeatureClass_locref(in_feature_class, route_id_field, from_measure_field, to_measure_field)

       Configures a Utility Network pipeline feature class for use with a
       linear referencing system (LRS).

    INPUTS:
     in_feature_class (Feature Layer):
         The input Utility Network feature that is also the LRS centerline
         feature.
     route_id_field (Field):
         The field in the feature class that will be mapped as the LRS Network
         Route ID.
     from_measure_field (Field):
         The From measure field of the centerline feature class.
     to_measure_field (Field):
         The To measure field of the centerline feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConfigureUtilityNetworkFeatureClass_locref(
                *gp_fixargs((in_feature_class, route_id_field, from_measure_field, to_measure_field), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RemoveLRSEntity_locref", None)
def RemoveLRSEntity(
    in_workspace=None,
    lrs_entity_type: Literal["LRS", "NETWORK", "EVENT", "INTERSECTION", "UN_FEATURE_CLASS", "ADDRESS_FEATURE_CLASS"]
    | None = None,
    lrs_entity_name=None,
) -> Result1[str]:
    """RemoveLRSEntity_locref(in_workspace, lrs_entity_type, lrs_entity_name)

       Removes a linear referencing system (LRS) entity from an input
       geodatabase workspace.

    INPUTS:
     in_workspace (Workspace):
         The input geodatabase workspace that contains the LRS entity that will
         be removed.
     lrs_entity_type (String):
         Specifies the type of LRS entity that will be removed from the input
         geodatabase workspace.LRS-An LRS and its dependent LRS Networks, as
         well as the LRS events,
         and LRS intersections registered to those LRS Networks, will be
         removed.NETWORK-An LRS Network and the LRS events and LRS
         intersections
         registered to that LRS Network will be removed.EVENT-An LRS event will
         be removed.INTERSECTION-An LRS intersection will be
         removed.UN_FEATURE_CLASS-A utility network feature class will be
         removed.ADDRESS_FEATURE_CLASS-Address management feature classes will
         be
         removed.
     lrs_entity_name (String):
         The name of the LRS entity that will be removed from the input
         geodatabase workspace. The underlying feature classes and tables of
         the LRS entity will not be deleted."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RemoveLRSEntity_locref(*gp_fixargs((in_workspace, lrs_entity_type, lrs_entity_name), True))
        )
        return retval
    except Exception as e:
        raise e


# Configuration\LRS toolset
@gptooldoc("CreateLRS_locref", None)
def CreateLRS(
    in_workspace=None,
    lrs_name=None,
    centerline_feature_class_name=None,
    calibration_point_feature_class_name=None,
    redline_feature_class_name=None,
    centerline_sequence_table_name=None,
    spatial_reference=None,
    xy_tolerance=None,
    z_tolerance=None,
    xy_resolution=None,
    z_resolution=None,
) -> Result:
    """CreateLRS_locref(in_workspace, lrs_name, centerline_feature_class_name, calibration_point_feature_class_name, redline_feature_class_name, centerline_sequence_table_name, spatial_reference, {xy_tolerance}, {z_tolerance}, {xy_resolution}, {z_resolution})

       Creates an ArcGIS Location Referencing linear referencing system (LRS)
       and minimum schema items in a specified workspace.

    INPUTS:
     in_workspace (Workspace / Feature Dataset):
         The file or multipurpose geodatabase where the LRS and minimum schema
         will be created.
     lrs_name (String):
         The name of the output LRS.
     centerline_feature_class_name (String):
         The name of the output centerline feature class.
     calibration_point_feature_class_name (String):
         The name of the output calibration point feature class.
     redline_feature_class_name (String):
         The name of the output redline feature class.
     centerline_sequence_table_name (String):
         The name of the output centerline sequence table.
     spatial_reference (Spatial Reference):
         The spatial reference for the output feature classes. When using a
         Python script, you can use the Well Known ID (WKID) for the spatial
         reference.
     xy_tolerance {Linear Unit}:
         The x,y-tolerance of the output feature classes.
     z_tolerance {Linear Unit}:
         The z-tolerance of the output feature classes.
     xy_resolution {Linear Unit}:
         The x,y-resolution of the output feature classes.
     z_resolution {Linear Unit}:
         The z-resolution of the output feature classes."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateLRS_locref(
                *gp_fixargs(
                    (
                        in_workspace,
                        lrs_name,
                        centerline_feature_class_name,
                        calibration_point_feature_class_name,
                        redline_feature_class_name,
                        centerline_sequence_table_name,
                        spatial_reference,
                        xy_tolerance,
                        z_tolerance,
                        xy_resolution,
                        z_resolution,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateLRSFromExistingDataset_locref", None)
def CreateLRSFromExistingDataset(
    lrs_name=None,
    centerline_feature_class=None,
    centerline_centerline_id_field=None,
    centerline_sequence_table=None,
    centerline_sequence_centerline_id_field=None,
    centerline_sequence_route_id_field=None,
    centerline_sequence_from_date_field=None,
    centerline_sequence_to_date_field=None,
    centerline_sequence_network_id_field=None,
    calibration_point_feature_class=None,
    calibration_point_measure_field=None,
    calibration_point_from_date_field=None,
    calibration_point_to_date_field=None,
    calibration_point_route_id_field=None,
    calibration_point_network_id_field=None,
    redline_feature_class=None,
    redline_from_measure_field=None,
    redline_to_measure_field=None,
    redline_route_id_field=None,
    redline_route_name_field=None,
    redline_effective_date_field=None,
    redline_activity_type_field=None,
    redline_network_id_field=None,
) -> Result1[str]:
    """CreateLRSFromExistingDataset_locref(lrs_name, centerline_feature_class, centerline_centerline_id_field, centerline_sequence_table, centerline_sequence_centerline_id_field, centerline_sequence_route_id_field, centerline_sequence_from_date_field, centerline_sequence_to_date_field, centerline_sequence_network_id_field, calibration_point_feature_class, calibration_point_measure_field, calibration_point_from_date_field, calibration_point_to_date_field, calibration_point_route_id_field, calibration_point_network_id_field, redline_feature_class, redline_from_measure_field, redline_to_measure_field, redline_route_id_field, redline_route_name_field, redline_effective_date_field, redline_activity_type_field, redline_network_id_field)

       Creates a linear referencing system (LRS) in the specified workspace
       using existing datasets.

    INPUTS:
     lrs_name (String):
         The name of the LRS to create. The name cannot already exist in the
         geodatabase.
     centerline_feature_class (Feature Layer):
         The feature class to use as the centerline in the LRS.
     centerline_centerline_id_field (Field):
         The GUID field containing the centerline ID. The field type
         must match thefield type in the centerline sequence table.
         centerlineID
     centerline_sequence_table (Table View):
         The table to use as the centerline sequence in the LRS.
     centerline_sequence_centerline_id_field (Field):
         The GUID field containing the centerline sequence ID. The
         field type must match thefield type and length in the centerline
         feature class. centerlineID
     centerline_sequence_route_id_field (Field):
         The GUID or text field containing the centerline sequence
         route ID. The field type must match thefield type and length in the
         calibration point and redline feature classes. routeID
     centerline_sequence_from_date_field (Field):
         A date field containing the centerline sequence from date.
     centerline_sequence_to_date_field (Field):
         A date field containing the centerline sequence to date.
     centerline_sequence_network_id_field (Field):
         The field containing the centerline sequence network ID. The short
         integer field type is supported.
     calibration_point_feature_class (Feature Layer):
         The feature class to use as the calibration point in the LRS.
     calibration_point_measure_field (Field):
         The field containing the calibration point measure. The double field
         type is supported.
     calibration_point_from_date_field (Field):
         A date field containing the calibration point from date.
     calibration_point_to_date_field (Field):
         A date field containing the calibration point to date.
     calibration_point_route_id_field (Field):
         The field containing the calibration point route ID. GUID and
         text field types are supported. The field type must match thefield
         type and length in the centerline sequence table and the redline
         feature class. routeID
     calibration_point_network_id_field (Field):
         The field containing the calibration point network ID. The short
         integer field type is supported.
     redline_feature_class (Feature Layer):
         The feature class to use as the redline in the LRS.
     redline_from_measure_field (Field):
         The field containing the redline from measure. The double field type
         is supported.
     redline_to_measure_field (Field):
         The field containing the redline to measure. The double field type is
         supported.
     redline_route_id_field (Field):
         The field containing the redline route ID. GUID and text field
         types are supported. The field type must match thefield type and
         length in the calibration point feature class and centerline sequence
         table. routeID
     redline_route_name_field (Field):
         A text field containing the redline route name.
     redline_effective_date_field (Field):
         A date field containing the redline effective date.
     redline_activity_type_field (Field):
         The field containing the redline activity type. The short integer
         field type is supported.
     redline_network_id_field (Field):
         The field containing the redline network ID. The short integer field
         type is supported."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateLRSFromExistingDataset_locref(
                *gp_fixargs(
                    (
                        lrs_name,
                        centerline_feature_class,
                        centerline_centerline_id_field,
                        centerline_sequence_table,
                        centerline_sequence_centerline_id_field,
                        centerline_sequence_route_id_field,
                        centerline_sequence_from_date_field,
                        centerline_sequence_to_date_field,
                        centerline_sequence_network_id_field,
                        calibration_point_feature_class,
                        calibration_point_measure_field,
                        calibration_point_from_date_field,
                        calibration_point_to_date_field,
                        calibration_point_route_id_field,
                        calibration_point_network_id_field,
                        redline_feature_class,
                        redline_from_measure_field,
                        redline_to_measure_field,
                        redline_route_id_field,
                        redline_route_name_field,
                        redline_effective_date_field,
                        redline_activity_type_field,
                        redline_network_id_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ModifyLRS_locref", None)
def ModifyLRS(
    in_workspace=None,
    current_lrs_name=None,
    new_lrs_name=None,
    centerline_feature_class=None,
    centerline_centerline_id_field=None,
    centerline_sequence_table=None,
    centerline_sequence_centerline_id_field=None,
    centerline_sequence_route_id_field=None,
    centerline_sequence_from_date_field=None,
    centerline_sequence_to_date_field=None,
    centerline_sequence_network_id_field=None,
    calibration_point_feature_class=None,
    calibration_point_measure_field=None,
    calibration_point_from_date_field=None,
    calibration_point_to_date_field=None,
    calibration_point_route_id_field=None,
    calibration_point_network_id_field=None,
    redline_feature_class=None,
    redline_from_measure_field=None,
    redline_to_measure_field=None,
    redline_route_id_field=None,
    redline_route_name_field=None,
    redline_effective_date_field=None,
    redline_activity_type_field=None,
    redline_network_id_field=None,
    conflict_prevention: Literal["AS_IS", "ENABLE", "DISABLE"] | None = None,
    move_to_feature_dataset: Literal["MOVE", "DO_NOT_MOVE"] | None = None,
) -> Result1[str]:
    """ModifyLRS_locref(in_workspace, current_lrs_name, {new_lrs_name}, {centerline_feature_class}, {centerline_centerline_id_field}, {centerline_sequence_table}, {centerline_sequence_centerline_id_field}, {centerline_sequence_route_id_field}, {centerline_sequence_from_date_field}, {centerline_sequence_to_date_field}, {centerline_sequence_network_id_field}, {calibration_point_feature_class}, {calibration_point_measure_field}, {calibration_point_from_date_field}, {calibration_point_to_date_field}, {calibration_point_route_id_field}, {calibration_point_network_id_field}, {redline_feature_class}, {redline_from_measure_field}, {redline_to_measure_field}, {redline_route_id_field}, {redline_route_name_field}, {redline_effective_date_field}, {redline_activity_type_field}, {redline_network_id_field}, {conflict_prevention}, {move_to_feature_dataset})

       Modifies an existing linear referencing system (LRS) in the specified
       workspace.

    INPUTS:
     in_workspace (Workspace):
         The LRS workspace.
     current_lrs_name (String):
         The name of the current LRS.
     new_lrs_name {String}:
         The new name of the current LRS.
     centerline_feature_class {Feature Layer}:
         An existing centerline feature class for the minimum schema.
     centerline_centerline_id_field {Field}:
         The name of the centerline ID field from the centerline_feature_class
         parameter value.
     centerline_sequence_table {Table View}:
         An existing centerline sequence table for the minimum schema.
     centerline_sequence_centerline_id_field {Field}:
         The name of the centerline ID field from the centerline_sequence_table
         parameter value.
     centerline_sequence_route_id_field {Field}:
         The name of the route ID field from the centerline_sequence_table
         parameter value.
     centerline_sequence_from_date_field {Field}:
         The name of the from date field from the centerline_sequence_table
         parameter value.
     centerline_sequence_to_date_field {Field}:
         The name of the to date field from the centerline_sequence_table
         parameter value.
     centerline_sequence_network_id_field {Field}:
         The name of the network ID field from the centerline_sequence_table
         parameter value.
     calibration_point_feature_class {Feature Layer}:
         An existing calibration point feature class for the minimum schema.
     calibration_point_measure_field {Field}:
         The name of the measure field from the calibration_point_feature_class
         parameter value.
     calibration_point_from_date_field {Field}:
         The name of the from date field from the
         calibration_point_feature_class parameter value.
     calibration_point_to_date_field {Field}:
         The name of the to date field from the calibration_point_feature_class
         parameter value.
     calibration_point_route_id_field {Field}:
         The name of the route ID field from the
         calibration_point_feature_class parameter value.
     calibration_point_network_id_field {Field}:
         The name of the network ID field from the
         calibration_point_feature_class parameter value.
     redline_feature_class {Feature Layer}:
         An existing redline feature class for the minimum schema.
     redline_from_measure_field {Field}:
         The name of the from measure field from the redline_feature_class
         parameter value.
     redline_to_measure_field {Field}:
         The name of the to measure field from the redline_feature_class
         parameter value.
     redline_route_id_field {Field}:
         The name of the route ID field from the redline_feature_class
         parameter value.
     redline_route_name_field {Field}:
         The name of the route name field from the redline_feature_class
         parameter value.
     redline_effective_date_field {Field}:
         The name of the effective date field from the redline_feature_class
         parameter value.
     redline_activity_type_field {Field}:
         The name of the activity type field from the redline_feature_class
         parameter value.
     redline_network_id_field {Field}:
         The name of the network ID field from the redline_feature_class
         parameter value.
     conflict_prevention {String}:
         Specifies whether conflict prevention will be enabled for the input
         LRS. Conflict prevention is only available when editing or performing
         geoprocessing on branch versioned data that is published as a feature
         service.AS_IS-The current conflict prevention setting will be used.
         This is
         the default.ENABLE-Conflict prevention will be enabled for the input
         LRS.DISABLE-Conflict prevention will be disabled for the input LRS.
     move_to_feature_dataset {Boolean}:
         Specifies whether feature classes will be moved to the required LRS
         feature dataset.DO_NOT_MOVE-Feature classes will not be moved to the
         required LRS
         feature dataset. This is the default.MOVE-Feature classes will be
         moved to the required LRS feature
         dataset."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ModifyLRS_locref(
                *gp_fixargs(
                    (
                        in_workspace,
                        current_lrs_name,
                        new_lrs_name,
                        centerline_feature_class,
                        centerline_centerline_id_field,
                        centerline_sequence_table,
                        centerline_sequence_centerline_id_field,
                        centerline_sequence_route_id_field,
                        centerline_sequence_from_date_field,
                        centerline_sequence_to_date_field,
                        centerline_sequence_network_id_field,
                        calibration_point_feature_class,
                        calibration_point_measure_field,
                        calibration_point_from_date_field,
                        calibration_point_to_date_field,
                        calibration_point_route_id_field,
                        calibration_point_network_id_field,
                        redline_feature_class,
                        redline_from_measure_field,
                        redline_to_measure_field,
                        redline_route_id_field,
                        redline_route_name_field,
                        redline_effective_date_field,
                        redline_activity_type_field,
                        redline_network_id_field,
                        conflict_prevention,
                        move_to_feature_dataset,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Configuration\LRS Event toolset
@gptooldoc("ConfigureExternalEventWithLRS_locref", None)
def ConfigureExternalEventWithLRS(
    in_event=None,
    parent_network=None,
    event_name=None,
    event_id_field=None,
    route_id_field=None,
    measure_field=None,
    geometry_type: Literal["POINT", "LINE"] | None = None,
    to_measure_field=None,
    from_date_field=None,
    to_date_field=None,
    event_spans_routes: Literal["AS_IS", "NO_SPANS_ROUTES", "SPANS_ROUTES"] | None = None,
    to_route_id_field=None,
    store_route_name: Literal["AS_IS", "NO_STORE_ROUTE_NAME", "STORE_ROUTE_NAME"] | None = None,
    route_name_field=None,
    to_route_name_field=None,
    calibrate_rule: Literal["STAY_PUT", "RETIRE", "MOVE"] | None = None,
    retire_rule: Literal["STAY_PUT", "RETIRE", "MOVE", "SNAP"] | None = None,
    extend_rule: Literal["STAY_PUT", "RETIRE", "MOVE", "COVER"] | None = None,
    reassign_rule: Literal["STAY_PUT", "RETIRE", "MOVE", "SNAP"] | None = None,
    realign_rule: Literal["STAY_PUT", "RETIRE", "MOVE", "SNAP", "COVER"] | None = None,
    reverse_rule: Literal["STAY_PUT", "RETIRE", "MOVE"] | None = None,
    carto_realign_rule: Literal["HONOR_ROUTE_MEASURE"] | None = None,
) -> Result1[str]:
    """ConfigureExternalEventWithLRS_locref(in_event, parent_network, event_name, event_id_field, route_id_field, measure_field, {geometry_type}, {to_measure_field}, {from_date_field}, {to_date_field}, {event_spans_routes}, {to_route_id_field}, {store_route_name}, {route_name_field}, {to_route_name_field}, {calibrate_rule}, {retire_rule}, {extend_rule}, {reassign_rule}, {realign_rule}, {reverse_rule}, {carto_realign_rule})

       Associates event data stored in an external system with an LRS.

    INPUTS:
     in_event (Table View):
         The external event feature class or table that will be registered to
         an LRS.
     parent_network (Feature Layer):
         The LRS Network to which the event will be registered.
     event_name (String):
         The name of the external event or table that will be registered to the
         LRS.
     event_id_field (Field):
         The event ID field available in the event feature class or table.
     route_id_field (Field):
         The name of the route ID field if it is a point event or a line event
         that does not span routes, or the name of the from route ID field if
         the event spans routes. The field must be available in the external
         event table or feature class.
     measure_field (Field):
         The name of the measure field if it is a point event or the name of
         the from measure field if it is a line event.
     geometry_type {String}:
         Specifies the geometry type of the external event or table.POINT-The
         geometry type of the event will be point. This is the
         default.LINE-The geometry type of the event will be polyline.
     to_measure_field {Field}:
         The name of the to measure field. This field is only required for line
         events.
     from_date_field {Field}:
         The from date field in the event feature class or table.
     to_date_field {Field}:
         The to date field in the event feature class or table.
     event_spans_routes {String}:
         Specifies whether the event records will span routes.AS_IS-The
         property will not change. This is the
         default.NO_SPANS_ROUTES-The event records will not span routes. This
         is
         applicable to line events only.SPANS_ROUTES-The event records will
         span routes. This is applicable
         to line events only.
     to_route_id_field {Field}:
         The name of the to route ID field available in the event feature class
         or table.
     store_route_name {String}:
         Specifies whether the route name will be stored with the event
         records.AS_IS-The property will not change. This is the
         default.NO_STORE_ROUTE_NAME-The route name will not be stored with the
         event
         records.STORE_ROUTE_NAME-The route name will be stored with the event
         records.
     route_name_field {Field}:
         The route name field if it is a point event or line event that does
         not span routes, or the name of the from route name field if the event
         spans routes. The field must be available in the external event table
         or feature class.
     to_route_name_field {Field}:
         The to route name field for line events that span routes. This
         parameter is required if the store_route_name and event_spans_routes
         parameters are set.
     calibrate_rule {String}:
         Specifies the event behavior rule for the calibrate activity.STAY_PUT-
         The geographic location of the event will be preserved;
         measures may change. This is the default.RETIRE-Both measure and
         geographic location will be preserved; the
         event will be retired.MOVE-The measures of the event will be
         preserved; the geographic
         location may change.
     retire_rule {String}:
         Specifies the event behavior rule for the retire activity.STAY_PUT-
         The geographic location of the event will be preserved;
         measures may change. This is the default.RETIRE-Both measure and
         geographic location will be preserved; the
         event will be retired.MOVE-The measures of the event will be
         preserved; the geographic
         location may change.SNAP-The geographic location of the event will be
         preserved by
         snapping the event to a concurrent route; measures may change.
     extend_rule {String}:
         Specifies the event behavior rule for the extend activity.STAY_PUT-
         The geographic location of the event will be preserved;
         measures may change. This is the default.RETIRE-Both measure and
         geographic location will be preserved; the
         event will be retired.MOVE-The measures of the event will be
         preserved; the geographic
         location may change.COVER-The geometric location and measure of a line
         event will be
         modified to include a new or newly modified section.
     reassign_rule {String}:
         Specifies the event behavior rule for the reassign activity.STAY_PUT-
         The geographic location of the event will be preserved;
         measures may change. This is the default.RETIRE-Both measure and
         geographic location will be preserved; the
         event will be retired.MOVE-The measures of the event will be
         preserved; the geographic
         location may change.SNAP-The geographic location of the event will be
         preserved by
         snapping the event to a concurrent route; measures may change.
     realign_rule {String}:
         Specifies the event behavior rule for the realign activity.STAY_PUT-
         The geographic location of the event will be preserved;
         measures may change. This is the default.RETIRE-Both measure and
         geographic location will be preserved; the
         event will be retired.MOVE-The measures of the event will be
         preserved; the geographic
         location may change.SNAP-The geographic location of the event will be
         preserved by
         snapping the event to a concurrent route; measures may
         change.COVER-The geometric location and measure of a line event will
         be
         modified to include a new or newly modified section.
     reverse_rule {String}:
         Specifies the event behavior rule for the reverse activity.STAY_PUT-
         The geographic location of the event will be preserved;
         measures may change. This is the default.RETIRE-Both measure and
         geographic location will be preserved; the
         event will be retired.MOVE-The measures of the event will be
         preserved; the geographic
         location may change.
     carto_realign_rule {String}:
         Specifies the event behavior rule for the cartographic realign
         activity.HONOR_ROUTE_MEASURE-The measure of the event will be
         preserved or
         changed proportionally to the route's measure change. This is the
         default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConfigureExternalEventWithLRS_locref(
                *gp_fixargs(
                    (
                        in_event,
                        parent_network,
                        event_name,
                        event_id_field,
                        route_id_field,
                        measure_field,
                        geometry_type,
                        to_measure_field,
                        from_date_field,
                        to_date_field,
                        event_spans_routes,
                        to_route_id_field,
                        store_route_name,
                        route_name_field,
                        to_route_name_field,
                        calibrate_rule,
                        retire_rule,
                        extend_rule,
                        reassign_rule,
                        realign_rule,
                        reverse_rule,
                        carto_realign_rule,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateLRSEvent_locref", None)
def CreateLRSEvent(
    parent_network=None,
    event_name=None,
    geometry_type: Literal["POINT", "LINE"] | None = None,
    event_id_field=None,
    route_id_field=None,
    from_date_field=None,
    to_date_field=None,
    loc_error_field=None,
    measure_field=None,
    to_measure_field=None,
    event_spans_routes: Literal["SPANS_ROUTES", "NO_SPANS_ROUTES"] | None = None,
    to_route_id_field=None,
    store_route_name: Literal["STORE_ROUTE_NAME", "NO_STORE_ROUTE_NAME"] | None = None,
    route_name_field=None,
    to_route_name_field=None,
) -> Result1[str | Layer]:
    """CreateLRSEvent_locref(parent_network, event_name, geometry_type, event_id_field, route_id_field, from_date_field, to_date_field, loc_error_field, measure_field, {to_measure_field}, {event_spans_routes}, {to_route_id_field}, {store_route_name}, {route_name_field}, {to_route_name_field})

       Creates line or point events for an existing LRS Network.

    INPUTS:
     parent_network (Feature Layer):
         The network to which the event is registered.
     event_name (String):
         The event to be registered.
     geometry_type (String):
         The geometry type of the output event.POINT-The geometry type of the
         event is Point. This is the
         default.LINE-The geometry type of the event is Polyline.
     event_id_field (String):
         The event ID field available in the event feature class.
     route_id_field (String):
         Name of the route ID field if it is a point event that does not span
         routes, or from route ID field if the event_spans_routes parameter is
         set to SPANS_ROUTES.
     from_date_field (String):
         The from date field available in the event feature class.
     to_date_field (String):
         The to date field available in the event feature class.
     loc_error_field (String):
         The location error field available in the event feature class.
     measure_field (String):
         Name of the measure field if it is a point event or from measure field
         if it is a line event.
     to_measure_field {String}:
         Name of the to measure field. Required only for Line events.
     event_spans_routes {Boolean}:
         Specifies whether the event records spans routes.SPANS_ROUTES-The
         event records span routes.NO_SPANS_ROUTES-The event
         records do not span routes. This is the
         default.
     to_route_id_field {String}:
         Name of the to route ID field. Required only if the geometry_type
         parameter is set to LINE and the event_span_routes parameter is set to
         SPANS_ROUTES.
     store_route_name {Boolean}:
         Specifies whether the route name should be stored with the event
         records.STORE_ROUTE_NAME-Stores the route name with the event
         records.NO_STORE_ROUTE_NAME-Does not store the route name with the
         event
         records. This is the default.
     route_name_field {String}:
         The route name field if it is a point event that does not span routes,
         or the from route name field if it is a line event that spans routes.
         Required if STORE_ROUTE_NAME is set.
     to_route_name_field {String}:
         The to route name field for line events that span routes. Required if
         STORE_ROUTE_NAME is set."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateLRSEvent_locref(
                *gp_fixargs(
                    (
                        parent_network,
                        event_name,
                        geometry_type,
                        event_id_field,
                        route_id_field,
                        from_date_field,
                        to_date_field,
                        loc_error_field,
                        measure_field,
                        to_measure_field,
                        event_spans_routes,
                        to_route_id_field,
                        store_route_name,
                        route_name_field,
                        to_route_name_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateLRSEventFromExistingDataset_locref", None)
def CreateLRSEventFromExistingDataset(
    parent_network=None,
    in_feature_class=None,
    event_id_field=None,
    route_id_field=None,
    from_date_field=None,
    to_date_field=None,
    loc_error_field=None,
    measure_field=None,
    to_measure_field=None,
    event_spans_routes: Literal["SPANS_ROUTES", "NO_SPANS_ROUTES"] | None = None,
    to_route_id_field=None,
    store_route_name: Literal["STORE_ROUTE_NAME", "NO_STORE_ROUTE_NAME"] | None = None,
    route_name_field=None,
    to_route_name_field=None,
) -> Result1[str | Layer]:
    """CreateLRSEventFromExistingDataset_locref(parent_network, in_feature_class, event_id_field, route_id_field, from_date_field, to_date_field, loc_error_field, measure_field, {to_measure_field}, {event_spans_routes}, {to_route_id_field}, {store_route_name}, {route_name_field}, {to_route_name_field})

       Registers an existing feature class as an LRS event.

    INPUTS:
     parent_network (Feature Layer):
         The network to which the event will be registered.
     in_feature_class (Feature Layer):
         The event to be registered.
     event_id_field (Field):
         The event ID field in the event feature class.
     route_id_field (Field):
         The route ID field if the feature class is a point event or the from
         route ID field if the feature class is a line event and
         event_spans_routes is set to SPANS_ROUTES.
     from_date_field (Field):
         The from date field in the event feature class.
     to_date_field (Field):
         The to date field in the event feature class.
     loc_error_field (Field):
         The location error field in the event feature class.
     measure_field (Field):
         The measure field if the feature class is a point event or the from
         measure field if the feature class is a line event.
     to_measure_field {Field}:
         The to measure field in the event feature class. This parameter is
         required for line events.
     event_spans_routes {Boolean}:
         Specifies whether the event records will span
         routes.NO_SPANS_ROUTES-The event records will not span routes. This is
         the
         default.SPANS_ROUTES-The event records will span routes.
     to_route_id_field {Field}:
         The to route ID field for events that span routes. This parameter is
         required if the in_feature class parameter geometry type is polyline
         and event_spans_routes is set to SPANS_ROUTES.
     store_route_name {Boolean}:
         Specifies whether the route name will be stored with the event
         records.NO_STORE_ROUTE_NAME-The route name will not be stored with
         the event
         records. This is the default.STORE_ROUTE_NAME-The route name will be
         stored with the event records.
     route_name_field {Field}:
         The route name field if the feature class is a point event that
         doesn't span routes or the from route name field if the feature class
         is a line event that spans routes. This parameter is required if
         store_route_name is set to STORE_ROUTE_NAME.
     to_route_name_field {Field}:
         The to route name field for line events that span routes. This
         parameter is required if store_route_name is set to STORE_ROUTE_NAME."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateLRSEventFromExistingDataset_locref(
                *gp_fixargs(
                    (
                        parent_network,
                        in_feature_class,
                        event_id_field,
                        route_id_field,
                        from_date_field,
                        to_date_field,
                        loc_error_field,
                        measure_field,
                        to_measure_field,
                        event_spans_routes,
                        to_route_id_field,
                        store_route_name,
                        route_name_field,
                        to_route_name_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DisableDerivedMeasureFields_locref", None)
def DisableDerivedMeasureFields(
    in_feature_class=None,
) -> Result1[str | Layer]:
    """DisableDerivedMeasureFields_locref(in_feature_class)

       Disables fields that store the derived network route ID, route name,
       and measure fields.

    INPUTS:
     in_feature_class (Feature Layer):
         An existing event feature class or feature layer that is registered to
         an LRS."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DisableDerivedMeasureFields_locref(*gp_fixargs((in_feature_class,), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DisableReferentFields_locref", None)
def DisableReferentFields(
    in_feature_class=None,
) -> Result1[str | Layer]:
    """DisableReferentFields_locref(in_feature_class)

       Disables referent fields for an existing linear referencing system
       (LRS) event feature class or feature layer. It does not delete the
       referent columns; it removes the referent column information from the
       Lrs_Metadata table.

    INPUTS:
     in_feature_class (Feature Layer):
         The input feature class or feature layer for the LRS event."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.DisableReferentFields_locref(*gp_fixargs((in_feature_class,), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("DisableStationingFields_locref", None)
def DisableStationingFields(
    in_feature_class=None,
) -> Result1[str | Layer]:
    """DisableStationingFields_locref(in_feature_class)

       Disables stationing fields for the registered LRS event.

    INPUTS:
     in_feature_class (Feature Layer):
         An existing event feature class or feature layer that is registered to
         an LRS."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DisableStationingFields_locref(*gp_fixargs((in_feature_class,), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("EnableDerivedMeasureFields_locref", None)
def EnableDerivedMeasureFields(
    in_feature_class=None,
    derived_route_id_field=None,
    derived_route_name_field=None,
    derived_from_measure_field=None,
    derived_to_measure_field=None,
) -> Result1[str | Layer]:
    """EnableDerivedMeasureFields_locref(in_feature_class, {derived_route_id_field}, {derived_route_name_field}, {derived_from_measure_field}, {derived_to_measure_field})

       Enables fields to store the derived route ID, derived route name, and
       derived measure fields for the specified LRS event feature class.

    INPUTS:
     in_feature_class (Feature Layer):
         An existing event feature class or feature layer that is registered to
         an LRS.
     derived_route_id_field {Field}:
         The derived route ID field.
     derived_route_name_field {Field}:
         The derived route name field.
     derived_from_measure_field {Field}:
         The derived from measure field.
     derived_to_measure_field {Field}:
         The derived to measure field."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.EnableDerivedMeasureFields_locref(
                *gp_fixargs(
                    (
                        in_feature_class,
                        derived_route_id_field,
                        derived_route_name_field,
                        derived_from_measure_field,
                        derived_to_measure_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("EnableReferentFields_locref", None)
def EnableReferentFields(
    in_feature_class=None,
    from_referent_method_field=None,
    from_referent_location_field=None,
    from_referent_offset_field=None,
    to_referent_method_field=None,
    to_referent_location_field=None,
    to_referent_offset_field=None,
    offset_units: Literal[
        "INCHES",
        "FEET",
        "YARDS",
        "MILES",
        "NAUTICAL_MILES",
        "INTFEET",
        "MILLIMETERS",
        "CENTIMETERS",
        "METERS",
        "KILOMETERS",
        "DECIMETERS",
    ]
    | None = None,
) -> Result1[str | Layer]:
    """EnableReferentFields_locref(in_feature_class, {from_referent_method_field}, {from_referent_location_field}, {from_referent_offset_field}, {to_referent_method_field}, {to_referent_location_field}, {to_referent_offset_field}, {offset_units})

       Enables or modifies the referent fields so that you can manage
       referent information for the registered LRS event.

    INPUTS:
     in_feature_class (Feature Layer):
         The feature class that will be used for the LRS event.
     from_referent_method_field {Field}:
         The From referent method field.
     from_referent_location_field {Field}:
         The From referent location field.
     from_referent_offset_field {Field}:
         The From referent offset field.
     to_referent_method_field {Field}:
         The To referent method field.
     to_referent_location_field {Field}:
         The To referent location field.
     to_referent_offset_field {Field}:
         The To referent offset field.
     offset_units {String}:
         Specifies the offset units that will be used.MILES-The unit of measure
         will be miles. This is the
         default.INCHES-The unit of measure will be inches.FEET-The unit of
         measure will be feet.YARDS-The unit of measure will be
         yards.NAUTICAL_MILES-The unit of measure will be nautical
         miles.INTFEET-The unit of measure will be international
         feet.MILLIMETERS-The unit of measure will be
         millimeters.CENTIMETERS-The unit of measure will be
         centimetersMETERS-The unit of measure will be meters.KILOMETERS-The
         unit of measure will be kilometers.DECIMETERS-The unit of measure will
         be decimeters."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.EnableReferentFields_locref(
                *gp_fixargs(
                    (
                        in_feature_class,
                        from_referent_method_field,
                        from_referent_location_field,
                        from_referent_offset_field,
                        to_referent_method_field,
                        to_referent_location_field,
                        to_referent_offset_field,
                        offset_units,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("EnableStationingFields_locref", None)
def EnableStationingFields(
    in_feature_class=None,
    station_field=None,
    back_station_field=None,
    station_direction_field=None,
    station_measure_units: Literal[
        "INCHES",
        "FEET",
        "YARDS",
        "MILES",
        "NAUTICAL_MILES",
        "INTFEET",
        "MILLIMETERS",
        "CENTIMETERS",
        "METERS",
        "KILOMETERS",
        "DECIMETERS",
    ]
    | None = None,
    decreasing_station_values=None,
) -> Result1[str | Layer]:
    """EnableStationingFields_locref(in_feature_class, {station_field}, {back_station_field}, {station_direction_field}, {station_measure_units}, {decreasing_station_values})

       Enables or modifies stationing fields so that you can manage
       stationing information for the registered LRS event.

    INPUTS:
     in_feature_class (Feature Layer):
         An existing event feature class or feature layer that is registered to
         an LRS.
     station_field {Field}:
         The field that will be used as the starting reference station.
     back_station_field {Field}:
         The field that will be used as the back station.
     station_direction_field {Field}:
         The field that will be used to indicate the direction of increasing
         stations, either increasing toward the direction of calibration of the
         route or away from it.
     station_measure_units {String}:
         Specifies the measure units that will be used for stationing.MILES-The
         unit of measure will be miles. This is the
         default.INCHES-The unit of measure will be inches.FEET-The unit of
         measure will be feet.YARDS-The unit of measure will be
         yards.NAUTICAL_MILES-The unit of measure will be nautical
         miles.INTFEET-The unit of measure will be international
         feet.MILLIMETERS-The unit of measure will be
         millimeters.CENTIMETERS-The unit of measure will be
         centimetersMETERS-The unit of measure will be meters.KILOMETERS-The
         unit of measure will be kilometers.DECIMETERS-The unit of measure will
         be decimeters.
     decreasing_station_values {String}:
         A comma-separated list of user-provided values."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.EnableStationingFields_locref(
                *gp_fixargs(
                    (
                        in_feature_class,
                        station_field,
                        back_station_field,
                        station_direction_field,
                        station_measure_units,
                        decreasing_station_values,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ModifyEventBehaviorRules_locref", None)
def ModifyEventBehaviorRules(
    in_feature_class=None,
    calibrate_rule: Literal["STAY_PUT", "RETIRE", "MOVE"] | None = None,
    retire_rule: Literal["STAY_PUT", "RETIRE", "MOVE", "SNAP"] | None = None,
    extend_rule: Literal["STAY_PUT", "RETIRE", "MOVE", "COVER"] | None = None,
    reassign_rule: Literal["STAY_PUT", "RETIRE", "MOVE", "SNAP"] | None = None,
    realign_rule: Literal["STAY_PUT", "RETIRE", "MOVE", "SNAP", "COVER"] | None = None,
    reverse_rule: Literal["STAY_PUT", "RETIRE", "MOVE"] | None = None,
    carto_realign_rule: Literal["HONOR_ROUTE_MEASURE", "HONOR_REFERENT_LOCATION"] | None = None,
) -> Result1[str | Layer]:
    """ModifyEventBehaviorRules_locref(in_feature_class, {calibrate_rule}, {retire_rule}, {extend_rule}, {reassign_rule}, {realign_rule}, {reverse_rule}, {carto_realign_rule})

       Modifies event behavior rules for the registered event layer or
       feature class.

    INPUTS:
     in_feature_class (Feature Layer):
         The event feature class.
     calibrate_rule {String}:
         Specifies the event behavior rule that will be defined for the
         calibrate activity.STAY_PUT-The geographic location of the event will
         be preserved;
         measures may change. This is the default.RETIRE-Both measure and
         geographic location will be preserved; the
         event will be retired.MOVE-The measures of the event will be
         preserved; the geographic
         location may change.
     retire_rule {String}:
         Specifies the event behavior rule that will be defined for the retire
         activity.STAY_PUT-The geographic location of the event will be
         preserved;
         measures may change. This is the default.RETIRE-Both measure and
         geographic location will be preserved; the
         event will be retired.MOVE-The measures of the event will be
         preserved; the geographic
         location may change.SNAP-The geographic location of the event will be
         preserved by
         snapping the event to a concurrent route; measures may change.
     extend_rule {String}:
         Specifies the event behavior rule that will be defined for the extend
         activity.STAY_PUT-The geographic location of the event will be
         preserved;
         measures may change. This is the default.RETIRE-Both measure and
         geographic location will be preserved; the
         event will be retired.MOVE-The measures of the event will be
         preserved; the geographic
         location may change.COVER-The geometric location and measure of a line
         event will be
         modified to include a new or newly modified section.
     reassign_rule {String}:
         Specifies the event behavior rule that will be defined for the
         reassign activity.STAY_PUT-The geographic location of the event will
         be preserved;
         measures may change. This is the default.RETIRE-Both measure and
         geographic location will be preserved; the
         event will be retired.MOVE-The measures of the event will be
         preserved; the geographic
         location may change.SNAP-The geographic location of the event will be
         preserved by
         snapping the event to a concurrent route; measures may change.
     realign_rule {String}:
         Specifies the event behavior rule that will be defined for the realign
         activity.STAY_PUT-The geographic location of the event will be
         preserved;
         measures may change. This is the default.RETIRE-Both measure and
         geographic location will be preserved; the
         event will be retired.MOVE-The measures of the event will be
         preserved; the geographic
         location may change.SNAP-The geographic location of the event will be
         preserved by
         snapping the event to a concurrent route; measures may
         change.COVER-The geometric location and measure of a line event will
         be
         modified to include a new or newly modified section.
     reverse_rule {String}:
         Specifies the event behavior rule that will be defined for the reverse
         activity.STAY_PUT-The geographic location of the event will be
         preserved;
         measures may change. This is the default.RETIRE-Both measure and
         geographic location will be preserved; the
         event will be retired.MOVE-The measures of the event will be
         preserved; the geographic
         location may change.
     carto_realign_rule {String}:
         Specifies the event behavior rule that will be defined for the
         cartographic realignment activity.HONOR_ROUTE_MEASURE-The measure of
         the event will be preserved or will
         change proportionally to the route's measure change. This is the
         default.HONOR_REFERENT_LOCATION-The referent location of the event
         will be
         preserved."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ModifyEventBehaviorRules_locref(
                *gp_fixargs(
                    (
                        in_feature_class,
                        calibrate_rule,
                        retire_rule,
                        extend_rule,
                        reassign_rule,
                        realign_rule,
                        reverse_rule,
                        carto_realign_rule,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ModifyLRSEvent_locref", None)
def ModifyLRSEvent(
    in_feature_class=None,
    event_id_field=None,
    route_id_field=None,
    from_date_field=None,
    to_date_field=None,
    loc_error_field=None,
    measure_field=None,
    to_measure_field=None,
    event_spans_routes: Literal["AS_IS", "NO_SPANS_ROUTES", "SPANS_ROUTES"] | None = None,
    to_route_id_field=None,
    store_route_name: Literal["AS_IS", "NO_STORE_ROUTE_NAME", "STORE_ROUTE_NAME"] | None = None,
    route_name_field=None,
    to_route_name_field=None,
) -> Result1[str | Layer]:
    """ModifyLRSEvent_locref(in_feature_class, {event_id_field}, {route_id_field}, {from_date_field}, {to_date_field}, {loc_error_field}, {measure_field}, {to_measure_field}, {event_spans_routes}, {to_route_id_field}, {store_route_name}, {route_name_field}, {to_route_name_field})

       Modifies properties of a linear referencing system (LRS) event.

    INPUTS:
     in_feature_class (Feature Layer):
         The input feature class or feature layer for the event.
     event_id_field {Field}:
         Name of the event ID field.
     route_id_field {Field}:
         Name of the route ID field.
     from_date_field {Field}:
         Name of the from date field.
     to_date_field {Field}:
         Name of the to date field.
     loc_error_field {Field}:
         Name of the location error field.
     measure_field {Field}:
         Name of the measure field if it is a point event or from measure field
         if it is a line event.
     to_measure_field {Field}:
         Name of the to measure field. Required only for line events.
     event_spans_routes {String}:
         Determines if the event records will span routes.AS_IS-No change to
         the property. This is the
         default.NO_SPANS_ROUTES-The event records do not span routes.
         Applicable only
         for line events.SPANS_ROUTES-The event records may span routes.
         Applicable only for
         line events.
     to_route_id_field {Field}:
         Name of the to route ID field. Required only if it is a line event and
         it spans routes.
     store_route_name {String}:
         Determines if the event records will store the route name.AS_IS-No
         change to the property. This is the
         default.STORE_ROUTE_NAME-Stores the route name with the event
         records.NO_STORE_ROUTE_NAME-Does not store the route name with the
         event
         records.
     route_name_field {Field}:
         The route name field if it is a point event that does not span routes,
         or the from route name field if it is a line event that spans routes.
         Required if STORE_ROUTE_NAME is set.
     to_route_name_field {Field}:
         Name of the to route name field. Required if it is a line event, and
         store_route_name and SPANS_ROUTES are set."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ModifyLRSEvent_locref(
                *gp_fixargs(
                    (
                        in_feature_class,
                        event_id_field,
                        route_id_field,
                        from_date_field,
                        to_date_field,
                        loc_error_field,
                        measure_field,
                        to_measure_field,
                        event_spans_routes,
                        to_route_id_field,
                        store_route_name,
                        route_name_field,
                        to_route_name_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Configuration\LRS Intersection toolset
@gptooldoc("CreateLRSIntersection_locref", None)
def CreateLRSIntersection(
    parent_network=None,
    network_description_field=None,
    intersection_feature_class_name=None,
    intersecting_layers=None,
    consider_z: Literal["CONSIDER_Z", "DO_NOT_CONSIDER_Z"] | None = None,
    z_tolerance=None,
) -> Result1[str]:
    """CreateLRSIntersection_locref(parent_network, network_description_field, intersection_feature_class_name, intersecting_layers;intersecting_layers..., {consider_z}, {z_tolerance})

       Creates an intersection feature class for an existing LRS Network.

    INPUTS:
     parent_network (Feature Layer):
         The network to which the intersection will be registered.
     network_description_field (Field):
         The field in the network layer that will be used to name the
         intersections with other intersecting layers.
     intersection_feature_class_name (String):
         The name of the new intersection point feature class.
     intersecting_layers (Value Table):
         The feature class that intersects the LRS Network and contains the
         following information:Intersection Layer-The feature class that
         intersects the LRS
         Network.ID Field-The field in the intersecting layer used to uniquely
         identify
         the feature that intersects the network.Description Field-The field
         that provides the description, such as
         town or county name, of the intersecting feature.Name Separator-The
         name separator for the intersection, such as AND,
         INTERSECT, +, or |.
     consider_z {Boolean}:
         Specifies whether z-values will be used when generating
         intersections.CONSIDER_Z-Z-values will be used when generating
         intersections.DO_NOT_CONSIDER_Z-Z-values will not be used when
         generating
         intersections. This is the default.
     z_tolerance {Double}:
         The z-tolerance that will be used to generate intersections."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateLRSIntersection_locref(
                *gp_fixargs(
                    (
                        parent_network,
                        network_description_field,
                        intersection_feature_class_name,
                        intersecting_layers,
                        consider_z,
                        z_tolerance,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateLRSIntersectionFromExistingDataset_locref", None)
def CreateLRSIntersectionFromExistingDataset(
    parent_network=None,
    network_description_field=None,
    in_feature_class=None,
    intersection_id_field=None,
    intersection_name_field=None,
    route_id_field=None,
    feature_id_field=None,
    feature_class_name_field=None,
    from_date_field=None,
    to_date_field=None,
    intersecting_layers=None,
    consider_z: Literal["CONSIDER_Z", "DO_NOT_CONSIDER_Z"] | None = None,
    z_tolerance=None,
    measure_field=None,
) -> Result1[str]:
    """CreateLRSIntersectionFromExistingDataset_locref(parent_network, network_description_field, in_feature_class, intersection_id_field, intersection_name_field, route_id_field, feature_id_field, feature_class_name_field, from_date_field, to_date_field, intersecting_layers;intersecting_layers..., {consider_z}, {z_tolerance}, {measure_field})

       Registers an existing intersection feature class as an intersection.

    INPUTS:
     parent_network (Feature Layer):
         The network to which the intersection will be registered.
     network_description_field (Field):
         The field in the network layer that will be used to name the
         intersections with other intersecting layers.
     in_feature_class (Feature Layer):
         The input point feature class to be registered.
     intersection_id_field (Field):
         The ID field in the in_feature_class parameter value. The field must
         have a unique ID for each intersection for a time slice.
     intersection_name_field (Field):
         The field in the in_feature_class parameter value that is a
         concatenated field showing the descriptors for the route and the
         intersecting feature.
     route_id_field (Field):
         The field in the in_feature_class parameter value that contains the
         route ID for the LRS Network.
     feature_id_field (Field):
         The field in the in_feature_class parameter value that contains the ID
         for the intersecting feature.
     feature_class_name_field (Field):
         The field in the in_feature_class parameter value that contains the
         name of the feature class that participated in the intersection.
     from_date_field (Field):
         The from date field in the in_feature_class parameter value.
     to_date_field (Field):
         The to date field in the in_feature_class parameter value.
     intersecting_layers (Value Table):
         The feature class that intersects the LRS Network and contains the
         following information:Intersection Layer-The feature class that
         intersects the LRS
         Network.ID Field-The field in the intersecting layer used to uniquely
         identify
         the feature that intersects the network.Description Field-The field
         that provides the description, such as
         town or county name, of the intersecting feature.Name Separator-The
         name separator for the intersection, such as AND,
         INTERSECT, +, or |.
     consider_z {Boolean}:
         Specifies whether z-values will be used when generating
         intersections.CONSIDER_Z-Z-values will be used during generation of
         intersections.DO_NOT_CONSIDER_Z-Z-values will not be used during
         generation of
         intersections. This is the default.
     z_tolerance {Double}:
         The z-tolerance used to generate intersections.
     measure_field {Field}:
         The measure on the base route at the point of intersection."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateLRSIntersectionFromExistingDataset_locref(
                *gp_fixargs(
                    (
                        parent_network,
                        network_description_field,
                        in_feature_class,
                        intersection_id_field,
                        intersection_name_field,
                        route_id_field,
                        feature_id_field,
                        feature_class_name_field,
                        from_date_field,
                        to_date_field,
                        intersecting_layers,
                        consider_z,
                        z_tolerance,
                        measure_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ModifyLRSIntersection_locref", None)
def ModifyLRSIntersection(
    in_feature_class=None,
    intersection_id_field=None,
    intersection_name_field=None,
    route_id_field=None,
    feature_id_field=None,
    feature_class_name_field=None,
    from_date_field=None,
    to_date_field=None,
    intersecting_layers=None,
    measure_field=None,
) -> Result1[str]:
    """ModifyLRSIntersection_locref(in_feature_class, {intersection_id_field}, {intersection_name_field}, {route_id_field}, {feature_id_field}, {feature_class_name_field}, {from_date_field}, {to_date_field}, {intersecting_layers;intersecting_layers...}, {measure_field})

       Modifies the properties of an intersection feature class, such as
       fields and intersecting layers, that compose the intersection feature
       class and can be added or removed.

    INPUTS:
     in_feature_class (Feature Layer):
         The input LRS intersection feature layer. This feature class cannot be
         a service.
     intersection_id_field {Field}:
         The field in theto use as the intersection unique ID field.
         Intersection Feature Class
     intersection_name_field {Field}:
         The concatenated field in thethat contains the descriptors for
         the route and the intersecting feature. Intersection Feature
         Class
     route_id_field {Field}:
         The field in thethat contains the unique route ID.
         Intersection Feature Class
     feature_id_field {Field}:
         The field in thethat contains the ID of the intersecting
         feature. Intersection Feature Class
     feature_class_name_field {Field}:
         The field in thethat contains the name of the feature class
         that participated in the intersection. Intersection Feature
         Class
     from_date_field {Field}:
         The field in thethat contains the from date of the route.
         Intersection Feature Class
     to_date_field {Field}:
         The field in thethat contains the to date of the route.
         Intersection Feature Class
     intersecting_layers {Value Table}:
         Thefields that compose the intersecting layer.
         Intersection Feature ClassIntersection Layer-The feature class that
         intersects the LRS
         Network.ID Field-The field in the intersecting layer used to uniquely
         identify
         the feature that intersects the network.Description Field-The field
         that provides the description, such as
         town or county name, of the intersecting feature.Name Separator-The
         name separator for the intersection, such as AND,
         INTERSECT, +, or |.
     measure_field {Field}:
         The field in thethat contains the measure on the base route at
         the point of intersection. Intersection Feature Class"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ModifyLRSIntersection_locref(
                *gp_fixargs(
                    (
                        in_feature_class,
                        intersection_id_field,
                        intersection_name_field,
                        route_id_field,
                        feature_id_field,
                        feature_class_name_field,
                        from_date_field,
                        to_date_field,
                        intersecting_layers,
                        measure_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Configuration\LRS Network toolset
@gptooldoc("ConfigureLookupTable_locref", None)
def ConfigureLookupTable(
    in_feature_class=None,
    lookup_table=None,
    field_applied_to=None,
    lookup_key=None,
    lookup_display=None,
    allow_any_lookup_value: Literal["ALLOW_ANY_VALUE", "DO_NOT_ALLOW_ANY_VALUE"] | None = None,
) -> Result1[str | Layer]:
    """ConfigureLookupTable_locref(in_feature_class, lookup_table, field_applied_to, lookup_key, {lookup_display}, {allow_any_lookup_value})

       Configures a lookup table for one or more fields used in a multifield
       route ID.

    INPUTS:
     in_feature_class (Feature Layer):
         The input LRS Network feature class in which the lookup table will be
         configured. The network must have a multifield route ID.
     lookup_table (Table View):
         A table that contains a list of street names and their corresponding
         GNIS codes. It can be a stand-alone table or reside in an SDE.
     field_applied_to (String):
         The route ID field in the LRS Network in which the lookup_table will
         be configured.
     lookup_key (String):
         The key field in the lookup_table.
     lookup_display {String}:
         The lookup_table description field. This field appears in the text box
         for the multifield route ID.
     allow_any_lookup_value {Boolean}:
         Specifies whether a value that is not in the lookup table can be
         added. The lookup_display parameter cannot be configured when this
         option is checked.DO_NOT_ALLOW_ANY_VALUE-Allow a value to be
         configured when one is not
         present in the table.ALLOW_ANY_VALUE-Don't allow a lookup display
         value to be configured.
         This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConfigureLookupTable_locref(
                *gp_fixargs(
                    (
                        in_feature_class,
                        lookup_table,
                        field_applied_to,
                        lookup_key,
                        lookup_display,
                        allow_any_lookup_value,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ConfigureRouteDominanceRules_locref", None)
def ConfigureRouteDominanceRules(
    in_feature_class=None,
    configure_type: Literal["ADD", "UPDATE", "DELETE"] | None = None,
    rule_name=None,
    updated_rule_name=None,
    source_table_name=None,
    fields=None,
    order_method=None,
    order_type=None,
    prioritized_exceptions=None,
) -> Result1[str | Layer]:
    """ConfigureRouteDominanceRules_locref(in_feature_class, configure_type, rule_name, {updated_rule_name}, {source_table_name}, {fields;fields...}, {order_method}, {order_type}, {prioritized_exceptions})

       Configures a set of rules to determine the dominant route in a network
       where there are concurrent routes.

    INPUTS:
     in_feature_class (Feature Layer):
         The input feature class. Only a registered LRS Network feature class
         can be used.
     configure_type (String):
         Specifies the type of configuration that will be applied to the
         in_feature_class parameter value.ADD-A new rule will be added to the
         configuration.UPDATE-An existing
         rule will be updated.DELETE-An existing rule will be deleted.
     rule_name (String):
         The name of the rule that will be added, updated, or deleted. The rule
         name can be up to 30 characters.
     updated_rule_name {String}:
         The updated name of the rule. This parameter is only used when UPDATE
         is specified as the configure_type parameter value.
     source_table_name {String}:
         The source event table or feature class registered to the
         in_feature_class parameter value. Alternatively, the network feature
         class can be used. Only nonspanning line events are supported.
     fields {String}:
         The attribute field aliases in the source table. If multiple fields
         are used, they will be concatenated.
     order_method {String}:
         Specifies whether route dominance ordering will be determined by
         lesser or greater values.
     order_type {String}:
         Specifies the ordering type that will be used when evaluating numeric
         or alphanumeric strings.
     prioritized_exceptions {String}:
         A comma-separated list of user-provided exceptions."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConfigureRouteDominanceRules_locref(
                *gp_fixargs(
                    (
                        in_feature_class,
                        configure_type,
                        rule_name,
                        updated_rule_name,
                        source_table_name,
                        fields,
                        order_method,
                        order_type,
                        prioritized_exceptions,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateLRSNetwork_locref", None)
def CreateLRSNetwork(
    in_path=None,
    lrs_name=None,
    network_name=None,
    route_id_field=None,
    route_name_field=None,
    from_date_field=None,
    to_date_field=None,
    derive_from_line_network: Literal["DERIVE", "DO_NOT_DERIVE"] | None = None,
    line_network_name=None,
    include_fields_to_support_lines: Literal["INCLUDE", "DO_NOT_INCLUDE"] | None = None,
    line_id_field=None,
    line_name_field=None,
    line_order_field=None,
    measure_unit: Literal[
        "INCHES",
        "FEET",
        "YARDS",
        "MILES",
        "NAUTICAL_MILES",
        "INTFEET",
        "MILLIMETERS",
        "CENTIMETERS",
        "METERS",
        "KILOMETERS",
        "DECIMETERS",
    ]
    | None = None,
) -> Result1[str]:
    """CreateLRSNetwork_locref(in_path, lrs_name, network_name, route_id_field, route_name_field, from_date_field, to_date_field, {derive_from_line_network}, {line_network_name}, {include_fields_to_support_lines}, {line_id_field}, {line_name_field}, {line_order_field}, {measure_unit})

       Creates an LRS Network in an ArcGIS Location Referencing linear
       referencing system (LRS).

    INPUTS:
     in_path (Workspace / Feature Dataset):
         The input workspace that will contain the new LRS Network. This
         workspace must be a geodatabase that contains a Location Referencing
         LRS. In addition to the top level of a geodatabase, a feature dataset
         is also supported as a valid path.
     lrs_name (String):
         The LRS to which the new LRS Network will be registered. The LRS must
         reside in the same geodatabase as the in_path parameter value.
     network_name (String):
         The name of the LRS Network that will be created, as well as the name
         of the feature class that will be created and registered with the LRS
         Network. The LRS Network name must be 26 or fewer characters and
         cannot contain special characters other than underscores.
     route_id_field (String):
         The field in the output feature class that will be mapped as
         the LRS Network route ID. The field type is derived from thefield of
         the centerline sequence table and must be either string or GUID type.
         RouteId
     route_name_field (String):
         A string field in the output feature class that will be mapped as the
         LRS Network route name.
     from_date_field (String):
         A date field in the output feature class that will be mapped as the
         LRS Network from date.
     to_date_field (String):
         A date field in the output feature class that will be mapped as the
         LRS Network to date.
     derive_from_line_network {Boolean}:
         Specifies whether the network will be configured as an LRS derived
         network.DERIVE-The output will be an LRS derived network and a feature
         class
         to support the LRS derived network. The line_network_name parameter
         value must also be provided.DO_NOT_DERIVE-The output will not be an
         LRS derived network. This is
         the default.
     line_network_name {String}:
         The name of the LRS line network to which the output LRS derived
         network will be registered. The input LRS line network must reside in
         the same geodatabase workspace as the line_network_name value. This
         parameter is only used if the derive_from_line_network parameter is
         set to DERIVE.
     include_fields_to_support_lines {Boolean}:
         Specifies whether fields that support lines will be added.INCLUDE-The
         output will be an LRS line network, and the output feature
         class will include fields that support lines. The line_id_field,
         line_name_field, and line_order_field parameter values must also be
         provided.DO_NOT_INCLUDE-The output will not be an LRS line network.
         This is the
         default.
     line_id_field {String}:
         The field in the output feature class that will be mapped as
         the LRS Network line ID. This parameter is only used if the
         include_fields_to_support_lines parameter is set to INCLUDE. The field
         type is derived from thefield of the centerline sequence table and
         will either be a string of exactly 38 characters or a GUID field type.
         RouteId
     line_name_field {String}:
         A string field in the output feature class that will be mapped as the
         LRS Network line name. This parameter is only used if the
         include_fields_to_support_lines parameter is set to INCLUDE.
     line_order_field {String}:
         The field in the output feature class that will be mapped as the LRS
         Network line order. This parameter is only used if the
         include_fields_to_support_lines parameter is set to INCLUDE. This will
         be a long integer field type.
     measure_unit {String}:
         Specifies the unit of measure (m-unit) the LRS Network will
         use.MILES-The unit of measure will be miles. This is the
         default.INCHES-The unit of measure will be inches.FEET-The unit of
         measure will be feet.YARDS-The unit of measure will be
         yards.NAUTICAL_MILES-The unit of measure will be nautical
         miles.INTFEET-The unit of measure will be international
         feet.MILLIMETERS-The unit of measure will be
         millimeters.CENTIMETERS-The unit of measure will be
         centimetersMETERS-The unit of measure will be meters.KILOMETERS-The
         unit of measure will be kilometers.DECIMETERS-The unit of measure will
         be decimeters."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateLRSNetwork_locref(
                *gp_fixargs(
                    (
                        in_path,
                        lrs_name,
                        network_name,
                        route_id_field,
                        route_name_field,
                        from_date_field,
                        to_date_field,
                        derive_from_line_network,
                        line_network_name,
                        include_fields_to_support_lines,
                        line_id_field,
                        line_name_field,
                        line_order_field,
                        measure_unit,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateLRSNetworkFromExistingDataset_locref", None)
def CreateLRSNetworkFromExistingDataset(
    in_feature_class=None,
    lrs_name=None,
    route_id_field=None,
    route_name_field=None,
    from_date_field=None,
    to_date_field=None,
    derive_from_line_network: Literal["DERIVE", "DO_NOT_DERIVE"] | None = None,
    line_network_name=None,
    include_fields_to_support_lines: Literal["INCLUDE", "DO_NOT_INCLUDE"] | None = None,
    line_id_field=None,
    line_name_field=None,
    line_order_field=None,
    route_id_configuration: Literal["AUTOGENERATED_ROUTE_ID", "SINGLE_FIELD_ROUTE_ID", "MULTI_FIELD_ROUTE_ID"]
    | None = None,
    individual_route_id_fields=None,
) -> Result1[str | Layer]:
    """CreateLRSNetworkFromExistingDataset_locref(in_feature_class, lrs_name, route_id_field, {route_name_field}, from_date_field, to_date_field, {derive_from_line_network}, {line_network_name}, {include_fields_to_support_lines}, {line_id_field}, {line_name_field}, {line_order_field}, {route_id_configuration}, {individual_route_id_fields;individual_route_id_fields...})

       Creates an LRS Network using an existing polyline feature class.

    INPUTS:
     in_feature_class (Feature Layer):
         The input feature class that will be registered as the LRS Network.
         The name of the feature class must be 26 or fewer characters. The
         feature class must reside in a geodatabase that contains an LRS. The
         name of this feature class will be used as the name of the LRS
         Network.
     lrs_name (String):
         The LRS name to which the new LRS Network will be registered. The LRS
         must reside in the same geodatabase as the in_feature_class value.
     route_id_field (Field):
         The field in the in_feature_class value that will be mapped as the LRS
         Network route ID. This must be a string or GUID field type.
     route_name_field {Field}:
         A string field in the in_feature_class value that will be mapped as
         the LRS Network route name.
     from_date_field (Field):
         A date field in the in_feature_class value that will be mapped as the
         LRS Network from date.
     to_date_field (Field):
         A date field in the in_feature_class value that will be mapped as the
         LRS Network to date.
     derive_from_line_network {Boolean}:
         Specifies whether the network will be configured as an LRS derived
         network.DERIVE-The output of this tool will be an LRS derived network.
         The
         line_network_name parameter must also be provided.DO_NOT_DERIVE-The
         output of this tool will not be an LRS derived
         network. This is the default.
     line_network_name {String}:
         The name of the LRS line network to which the output LRS derived
         network will be registered. The input LRS line network must reside in
         the same geodatabase workspace as the in_feature_class value. This
         parameter is only used if the derive_from_line_network parameter value
         is set to DERIVE.
     include_fields_to_support_lines {Boolean}:
         Specifies whether the network will be configured to support
         lines.INCLUDE-The output of this tool will be an LRS line network. The
         line_id_field, line_name_field, and line_order_field parameters must
         also be provided.DO_NOT_INCLUDE-The output of this tool will not be
         an LRS line
         network. This is the default.
     line_id_field {Field}:
         The field in the in_feature_class value that will be mapped as the LRS
         Network line ID. This parameter is only used if the
         include_fields_to_support_lines parameter value is set to INCLUDE.
         This must be a string or GUID field type and must match the field type
         and length of the route ID field in the centerline sequence table.
     line_name_field {Field}:
         A string field in the in_feature_class value that will be mapped as
         the LRS Network line name. This parameter is only used if the
         include_fields_to_support_lines parameter value is set to INCLUDE.
     line_order_field {Field}:
         An integer field in the in_feature_class value that will be mapped as
         the LRS Network line order. This parameter is only used if the
         include_fields_to_support_lines parameter value is set to INCLUDE.
     route_id_configuration {String}:
         Specifies the route ID configuration for the LRS
         Network.AUTOGENERATED_ROUTE_ID-The route ID field will be an
         automatically
         generated GUID. The route name can be configured as an LRS field. This
         is the default.SINGLE_FIELD_ROUTE_ID-The route ID field will be a
         single user-
         generated field. Only nonline networks are
         supported.MULTI_FIELD_ROUTE_ID-The route ID field will be a user-
         generated field
         concatenated from more than one field to form the route ID. Only
         nonline networks are supported.
     individual_route_id_fields {Field}:
         The individual fields in the in_feature_class value that will be used
         to form the route ID. This parameter is only used if the
         route_id_configuration parameter value is set to MULTI_FIELD_ROUTE_ID.
         The fields must be either string or integer field types."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateLRSNetworkFromExistingDataset_locref(
                *gp_fixargs(
                    (
                        in_feature_class,
                        lrs_name,
                        route_id_field,
                        route_name_field,
                        from_date_field,
                        to_date_field,
                        derive_from_line_network,
                        line_network_name,
                        include_fields_to_support_lines,
                        line_id_field,
                        line_name_field,
                        line_order_field,
                        route_id_configuration,
                        individual_route_id_fields,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ModifyLRSNetwork_locref", None)
def ModifyLRSNetwork(
    in_feature_class=None,
    route_id_field=None,
    route_name_field=None,
    from_date_field=None,
    to_date_field=None,
    derive_from_line_network: Literal["AS_IS", "DO_NOT_DERIVE", "DERIVE"] | None = None,
    line_network_name=None,
    include_fields_to_support_lines: Literal["AS_IS", "DO_NOT_INCLUDE", "INCLUDE"] | None = None,
    line_id_field=None,
    line_name_field=None,
    line_order_field=None,
    route_id_configuration: Literal["AS_IS", "AUTOGENERATED_ROUTE_ID", "SINGLE_FIELD_ROUTE_ID", "MULTI_FIELD_ROUTE_ID"]
    | None = None,
    individual_route_id_fields=None,
) -> Result1[str | Layer]:
    """ModifyLRSNetwork_locref(in_feature_class, {route_id_field}, {route_name_field}, {from_date_field}, {to_date_field}, {derive_from_line_network}, {line_network_name}, {include_fields_to_support_lines}, {line_id_field}, {line_name_field}, {line_order_field}, {route_id_configuration}, {individual_route_id_fields;individual_route_id_fields...})

       Modifies an LRS Network in a Location Referencing linear referencing
       system (LRS).

    INPUTS:
     in_feature_class (Feature Layer):
         The input LRS Network feature class to be modified.
     route_id_field {Field}:
         The field in the input feature class that will be mapped as
         the LRS Network route ID. The field type must match thefield type of
         the Centerline_Sequence table and must either be a string or GUID
         field type. RouteId
     route_name_field {Field}:
         A string field in the input feature class that will be mapped as the
         LRS Network route name.
     from_date_field {Field}:
         A date field in the input feature class that will be mapped as the LRS
         Network from date.
     to_date_field {Field}:
         A date field in the input feature class that will be mapped as the LRS
         Network to date.
     derive_from_line_network {String}:
         Determines if the current LRS network will be configured as an LRS
         Derived Network.AS_IS-The current LRS Network derived property will
         not be changed.
         This is the default.DERIVE-The input LRS Derived Network will be
         modified to become an LRS
         Derived Network. The line network name parameter must also be provided
         to specify which LRS Network to derive from.DO_NOT_DERIVE-The input
         LRS Derived Network will be modified to no
         longer be an LRS Derived Network.
     line_network_name {String}:
         The name of the LRS Line Network to which the input LRS Derived
         Network will be registered. The input LRS Line Network must reside in
         the same geodatabase workspace and LRS as the LRS network feature
         class. This parameter is only used if the derive_from_line_network
         parameter is set to DERIVE.
     include_fields_to_support_lines {String}:
         Determines if the current LRS network will be configured to support
         lines.AS_IS-The current LRS Network line support property will not be
         changed. This is the default.INCLUDE-The input LRS Network will be
         modified to add support for
         lines. The line id field, line name field, and line order field
         parameters must also be provided, and valid fields to map to these
         parameters must exist in the LRS network feature
         class.DO_NOT_INCLUDE-The input LRS Network will be modified to remove
         support for lines.
     line_id_field {Field}:
         The field in the input feature class that will be mapped as
         the LRS Network line ID. This parameter is only used if the
         include_fields_to_support_lines parameter is set to INCLUDE. The field
         type must match thefield type of the Centerline_Sequence table and
         must either be a string of exactly 38 characters or a GUID field type.
         RouteId
     line_name_field {Field}:
         A string field in the input feature class that will be mapped as the
         LRS Network line name. This parameter is only used if the
         include_fields_to_support_lines parameter is set to INCLUDE.
     line_order_field {Field}:
         The field in the input feature class that will be mapped as the LRS
         Network line order. This parameter is only used if the
         include_fields_to_support_lines parameter is set to INCLUDE. This must
         be a long integer field type.
     route_id_configuration {String}:
         Determines the route ID configuration for an LRS Network.AS_IS-The
         current LRS Network route ID configuration will not be
         changed. This is the default.AUTOGENERATED_ROUTE_ID-The route ID field
         will be an autogenerated
         GUID, and the route name can be configured as an LRS
         field.SINGLE_FIELD_ROUTE_ID-Supported only for nonline
         networks.MULTI_FIELD_ROUTE_ID-Supported only for nonline networks.
         More than
         one field is needed to form the concatenated route ID.
     individual_route_id_fields {Field}:
         The individual fields in the in_feature_class that will be used to
         form the route ID. This parameter is only used if the
         route_id_configuration parameter's MULTI_FIELD_ROUTE_ID option is set.
         The fields must be either string or number integer field types."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ModifyLRSNetwork_locref(
                *gp_fixargs(
                    (
                        in_feature_class,
                        route_id_field,
                        route_name_field,
                        from_date_field,
                        to_date_field,
                        derive_from_line_network,
                        line_network_name,
                        include_fields_to_support_lines,
                        line_id_field,
                        line_name_field,
                        line_order_field,
                        route_id_configuration,
                        individual_route_id_fields,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ModifyNetworkCalibrationRules_locref", None)
def ModifyNetworkCalibrationRules(
    in_feature_class=None,
    calibration_rule: Literal["AS_IS", "ADDING_EUCLIDEAN_DISTANCE", "STEPPING_INCREMENT", "ADDING_INCREMENT"]
    | None = None,
    calibration_offset=None,
    update_measure_cartorealign: Literal["AS_IS", "ENABLE", "DISABLE"] | None = None,
) -> Result1[str | Layer]:
    """ModifyNetworkCalibrationRules_locref(in_feature_class, {calibration_rule}, {calibration_offset}, {update_measure_cartorealign})

       Modifies the network calibration rules for an LRS Network.

    INPUTS:
     in_feature_class (Feature Layer):
         The input LRS Network feature class.
     calibration_rule {String}:
         Specifies the method that will be used to define calibration gap
         measures.AS_IS-The existing defined method in the network will be used
         while
         changing the calibration offset value.ADDING_EUCLIDEAN_DISTANCE-The
         Euclidean, or straight-line, distance
         will be calculated and added at each physical gap along an edited
         route.STEPPING_INCREMENT-A value will be defined that will adjust, or
         step,
         at each physical gap in the route. This is the
         default.ADDING_INCREMENT-A value will be defined and added to each
         measure of
         a route at each physical gap, in addition to the total length of the
         from and to measures of the route.
     calibration_offset {Double}:
         The value of theparameter'sormethod. The increment value must
         be numeric and can include decimals. Calibration RuleAdding
         IncrementStepping Increment
     update_measure_cartorealign {String}:
         Specifies whether or not to recalibrate route measures based on length
         changes in cartographic realignment.AS_IS-The existing defined method
         in the network will be used. This is
         the default.ENABLE-Enable recalibration of route measures based on
         length changes
         in cartographic realignment.DISABLE-Disable recalibration of route
         measures based on length
         changes in cartographic realignment."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ModifyNetworkCalibrationRules_locref(
                *gp_fixargs((in_feature_class, calibration_rule, calibration_offset, update_measure_cartorealign), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ModifyRouteIdPadding_locref", None)
def ModifyRouteIdPadding(
    in_feature_class=None,
    route_id_padding=None,
) -> Result1[str | Layer]:
    """ModifyRouteIdPadding_locref(in_feature_class, route_id_padding;route_id_padding...)

       Modifies the padding, null, and length properties for fields that are
       part of a multifield route ID.

    INPUTS:
     in_feature_class (Feature Layer):
         The input multifield route ID network layer that contains fields for
         padding, null, and length values that need to be modified.
     route_id_padding (Value Table):
         A table of values that specifies the field to be modified and its
         corresponding padding, null, and length values.Field-The field to be
         modified.Length-The length value of the field to
         be modified. The field length
         should be between 1 and the length of the database field.
         Variable Length-Specifies if thevalue is a variable value or
         a fixed value. LengthEnable Padding-Specifies if the field
         supports padding.Padding Character-The padding character for the
         field. The default is
         a space. Padding Location-                  Specifies where
         the
         padding should be applied to the field
         value. Left-Adds the padding characters to the left of the
         value in the
         field. This is the default.Right-Adds the padding characters to the
         right of the value in the
         field.Left and Right-Adds the padding characters to the left and right
         of
         the value in the field.Pad if Null-Specifies if the padding characters
         are added when the
         field has a null value.Allow Null Values-Specifies if the field
         supports null values."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ModifyRouteIdPadding_locref(*gp_fixargs((in_feature_class, route_id_padding), True))
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
