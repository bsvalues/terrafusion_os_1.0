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
r"""The Network Analyst toolbox contains tools that perform network
analysis and network dataset maintenance. With the tools in this
toolbox, you can maintain network datasets that model transportation
networks and perform route, closest facility, service area, origin-
destination cost matrix, vehicle routing problem, and location-
allocation network analyses on transportation networks. Use the tools
in this toolbox whenever you want to perform an analysis on a
transportation network."""
from __future__ import annotations

__all__ = [
    "AddFieldToAnalysisLayer",
    "AddLocations",
    "AddVehicleRoutingProblemBreaks",
    "AddVehicleRoutingProblemRoutes",
    "BuildNetwork",
    "CalculateLocations",
    "CopyNetworkAnalysisLayer",
    "CopyTraversedSourceFeatures",
    "CreateNetworkDataset",
    "CreateNetworkDatasetFromTemplate",
    "CreateTemplateFromNetworkDataset",
    "CreateTurnFeatureClass",
    "DeleteNetworkAnalysisLayer",
    "Directions",
    "DissolveNetwork",
    "IncreaseMaximumEdges",
    "MakeClosestFacilityAnalysisLayer",
    "MakeClosestFacilityLayer",
    "MakeLastMileDeliveryAnalysisLayer",
    "MakeLocationAllocationAnalysisLayer",
    "MakeLocationAllocationLayer",
    "MakeNetworkDatasetLayer",
    "MakeODCostMatrixAnalysisLayer",
    "MakeODCostMatrixLayer",
    "MakeRouteAnalysisLayer",
    "MakeRouteLayer",
    "MakeServiceAreaAnalysisLayer",
    "MakeServiceAreaLayer",
    "MakeVehicleRoutingProblemAnalysisLayer",
    "PopulateAlternateIDFields",
    "ShareAsRouteLayers",
    "Solve",
    "SolveVehicleRoutingProblem",
    "TurnTableToTurnFeatureClass",
    "UpdateAnalysisLayerAttributeParameter",
    "UpdateByAlternateIDFields",
    "UpdateByGeometry",
    "UpgradeNetwork",
]
__alias__ = "na"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3
from arcpy import _na
from arcpy._na import *

__all__ += _na.__all__


# Analysis toolset
@gptooldoc("AddFieldToAnalysisLayer_na", None)
def AddFieldToAnalysisLayer(
    in_network_analysis_layer=None,
    sub_layer=None,
    field_name=None,
    field_type: Literal[
        "TEXT",
        "FLOAT",
        "DOUBLE",
        "SHORT",
        "LONG",
        "BIGINTEGER",
        "DATE",
        "TIMEONLY",
        "DATEONLY",
        "TIMESTAMPOFFSET",
        "BLOB",
        "GUID",
    ]
    | None = None,
    field_precision=None,
    field_scale=None,
    field_length=None,
    field_alias=None,
    field_is_nullable: Literal["NULLABLE", "NON_NULLABLE"] | None = None,
) -> Result1[str | Layer]:
    """AddFieldToAnalysisLayer_na(in_network_analysis_layer, sub_layer, field_name, field_type, {field_precision}, {field_scale}, {field_length}, {field_alias}, {field_is_nullable})

       Adds a field to a sublayer of a network analysis layer.

    INPUTS:
     in_network_analysis_layer (Network Analyst Layer):
         The network analysis layer to which the new field will be added.
     sub_layer (String):
         The sublayer of the network analysis layer to which the new field will
         be added.
     field_name (String):
         The name of the field that will be added to the specified sublayer of
         the network analysis layer.
     field_type (String):
         Specifies the field type that will be used in the creation of the new
         field.LONG-The field type will be long. Long fields support whole
         numbers
         between -2,147,483,648 and 2,147,483,647.TEXT-The field type will be
         text. Text fields support a string of
         characters.FLOAT-The field type will be float. Float fields support
         fractional
         numbers between -3.4E38 and 1.2E38.DOUBLE-The field type will be
         double. Double fields support fractional
         numbers between -2.2E308 and 1.8E308.SHORT-The field type will be
         short. Short fields support whole numbers
         between -32,768 and 32,767.DATE-The field type will be date. Date
         fields support date and time
         values.BLOB-The field type will be BLOB. BLOB fields support data
         stored as a
         long sequence of binary numbers. You need a custom loader or viewer or
         a third-party application to load items into a BLOB field or view the
         contents of a BLOB field.GUID-The field type will be GUID. GUID fields
         store registry-style
         strings consisting of 36 characters enclosed in curly brackets.
         BIGINTEGER-The field type will be big integer. Big integer
         fields support whole numbers between -(2) and 2.
         5353TIMEONLY-The field type will be time only. Time only fields
         support
         time values with no date values.DATEONLY-The field type will be date
         only. Date only fields support
         date values with no time values.TIMESTAMPOFFSET-The field type will be
         timestamp offset. Timestamp
         offset fields support a date, time, and offset from a UTC value.
     field_precision {Long}:
         This parameter is deprecated and maintained only for backward
         compatibility.
     field_scale {Long}:
         This parameter is deprecated and maintained only for backward
         compatibility.
     field_length {Long}:
         The length of the field. This sets the maximum number of allowable
         characters for each record of the field. If no field length is
         provided, a length of 255 will be used.The field length applies only
         to text fields.
     field_alias {String}:
         The alternate name for the field. This name is used to describe
         cryptic field names. This parameter only applies to geodatabases.
     field_is_nullable {Boolean}:
         Specifies whether the field can contain null values. Null values are
         different from zero or empty fields and are only supported for fields
         in a geodatabase.NULLABLE-The field can contain null values. This is
         the
         default.NON_NULLABLE-The field cannot contain null values."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddFieldToAnalysisLayer_na(
                *gp_fixargs(
                    (
                        in_network_analysis_layer,
                        sub_layer,
                        field_name,
                        field_type,
                        field_precision,
                        field_scale,
                        field_length,
                        field_alias,
                        field_is_nullable,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddLocations_na", None)
def AddLocations(
    in_network_analysis_layer=None,
    sub_layer=None,
    in_table=None,
    field_mappings=None,
    search_tolerance=None,
    sort_field=None,
    search_criteria=None,
    match_type: Literal["MATCH_TO_CLOSEST", "PRIORITY"] | None = None,
    append: Literal["APPEND", "CLEAR"] | None = None,
    snap_to_position_along_network: Literal["SNAP", "NO_SNAP"] | None = None,
    snap_offset=None,
    exclude_restricted_elements: Literal["EXCLUDE", "INCLUDE"] | None = None,
    search_query=None,
    allow_auto_relocate: Literal["ALLOW", "NO_ALLOW"] | None = None,
) -> Result1[str | Layer]:
    """AddLocations_na(in_network_analysis_layer, sub_layer, in_table, {field_mappings}, {search_tolerance}, {sort_field}, {search_criteria;search_criteria...}, {match_type}, {append}, {snap_to_position_along_network}, {snap_offset}, {exclude_restricted_elements}, {search_query;search_query...}, {allow_auto_relocate})

       Adds input features or records to a network analysis layer. The inputs
       are added to specific sublayers such as stops and barriers. When the
       network analysis layer references a network dataset as its network
       data source, the tool calculates the network locations of the inputs,
       unless precalculated network location fields are mapped from the
       inputs.

    INPUTS:
     in_network_analysis_layer (Network Analyst Layer):
         The network analysis layer to which the network analysis objects will
         be added.
     sub_layer (String):
         The name of the sublayer of the network analysis layer to which the
         network analysis objects will be added.
     in_table (Table View):
         The feature class or table containing the locations to be added to the
         network analysis sublayer.
     field_mappings {Network Analyst Class FieldMap}:
         The mapping between the input fields of the network analysis sublayer
         to which locations will be added and the fields in the input data or
         specified constants.Input sublayers of network analysis layers have a
         set of input fields
         that can be populated to modify or control analysis behavior. When
         adding locations to the sublayer, you can use this parameter to map
         field values from the input table to these fields in the sublayer. You
         can also use field mappings to specify a constant default value for
         each property.If neither the Field value nor the Default value is
         specified for a
         property, the resulting network analysis objects will have null values
         for that property.A complete list of input fields for each sublayer
         for each network
         analysis layer type is available in the documentation for each layer.
         For example, examine the Route layer's Stops sublayer's input fields.
         An NAClassFieldMappings object obtained from the
         NAClassFieldMappings class is used to specify the parameter value. The
         NAClassFieldMappings object is a collection of NAClassFieldMap objects
         that allow you to specify the default values or map a field name from
         the input features for the properties of the network analysis object.
         If the data being loaded contains network locations or location ranges
         based on the network dataset used for the analysis, map the network
         location fields from the input features to the network location
         properties. Specifying the network location fields in the field
         mappings is similar to using theoption on the tool dialog box.
         Use Network Location FieldsArcGIS Online and some ArcGIS Enterprise
         portals do not support using
         network location fields. For network analysis layers that use one of
         these portals as the network data source, all inputs will be located
         at solve time, and any mapped location fields will be ignored.
     search_tolerance {Linear Unit}:
         The maximum search distance that will be used when locating the input
         features on the network. Features that are outside the search
         tolerance will be left unlocated. The parameter includes a value and
         units.The default value for this parameter is determined based on
         location
         properties stored in the input network analysis layer. If the network
         analysis layer has location settings overrides for the selected
         sublayer, those settings will be used. Otherwise, the network analysis
         layer's default location settings will be used. Setting a nondefault
         value for this parameter updates the network analysis layer's location
         settings overrides for the selected sublayer.The parameter is not used
         when adding locations to sublayers with line
         or polygon geometry, such as Line Barriers and Polygon Barriers.This
         parameter is not used when adding locations using existing
         network location fields.This parameter is not used when the network
         analysis layer's network
         data source is a portal running a version of ArcGIS Enterprise earlier
         than 11.0.
     sort_field {Field}:
         The field on which the network analysis objects will be sorted
         as they are added to the network analysis layer. The default is
         thefield in the input feature class or table. ObjectID
     search_criteria {Value Table}:
         The edge and junction sources in the network dataset that will be
         searched when locating inputs on the network. For example, if the
         network dataset references separate feature classes representing
         streets and sidewalks, you can locate inputs on streets but not on
         sidewalks.The parameter value is specified as a list with nested
         lists. The
         nested lists are composed of two values indicating the name and snap
         type of each network source. The following are the available
         snap type options for each
         network source:        NONE-The point will not locate on elements in
         this network
         source.SHAPE-The point will locate on the closest point of an element
         in this
         network source.For example, a parameter value of
         [["Streets","SHAPE"],["Streets_ND_Junctions","NONE"]] specifies that
         the search can locate on the shape of the Streets source but not on
         the Streets_ND_Junctions source.Any network edge or junction source
         that is not included in this list
         will use its default snap type. It is recommended that you include all
         network sources in your list and explicitly set the snap type for
         each. Historically, the tool supported the snap type options
         MIDDLE,
         END, and MIDDLE_END. These options are deprecated and maintained for
         backward compatibility only. If one of these options is specified, the
         tool reverts to the SHAPE option for that network source.The default
         value for this parameter is determined based on location
         properties stored in the input network analysis layer. If the network
         analysis layer has location settings overrides for the selected
         sublayer, those settings will be used. Otherwise, the network analysis
         layer's default location settings will be used. Setting a nondefault
         value for this parameter updates the network analysis layer's location
         settings overrides for the selected sublayer.This parameter is not
         used when adding locations using existing
         network location fields.This parameter is not used when the network
         analysis layer's network
         data source is ArcGIS Online.This parameter is not used when the
         network analysis layer's network
         data source is a portal running a version of ArcGIS Enterprise earlier
         than 11.0.
     match_type {Boolean}:
         This parameter is deprecated and maintained only for backward
         compatibility. Inputs will always be matched to the closest network
         source among all the sources used for locating, corresponding to a
         parameter value of MATCH_TO_CLOSEST or True.
     append {Boolean}:
         Specifies whether new network analysis objects will be appended to
         existing objects.APPEND-The new network analysis objects will be
         appended to the
         existing set of objects in the selected sublayer. This is the
         default.CLEAR-The existing network analysis objects will be deleted
         and
         replaced with the new objects.
     snap_to_position_along_network {Boolean}:
         Specifies whether the inputs will be snapped to their calculated
         network locations or represented at their original geographic
         location.To use curb approach in the analysis to control which side of
         the road
         a vehicle must use to approach a location, do not snap the inputs to
         their network locations, or use a snap offset to ensure that the point
         remains clearly to one side of the road.The parameter is not used when
         adding locations to sublayers with line
         or polygon geometry, such as Line Barriers and Polygon Barriers.This
         parameter is not used when the input network analysis layer's
         network data source is a portal service.NO_SNAP-The geometries of the
         network locations will be based on the
         geometries of the input features. This is the default.SNAP-The
         geometries of the network locations will be snapped to their
         network locations.
     snap_offset {Linear Unit}:
         An offset distance that will be applied when snapping a point to the
         network. An offset distance of zero means the point will be coincident
         with the network feature (typically a line). To offset the point from
         the network feature, enter an offset distance. The offset is in
         relation to the original point location; that is, if the original
         point was on the left side, its new location will be offset to the
         left. If it was originally on the right side, its new location will be
         offset to the right.The default is 5 meters. However, this parameter
         is ignored if
         snap_to_position_along_network is set to NO_SNAP.The parameter is not
         used when adding locations to sublayers with line
         or polygon geometry, such as Line Barriers and Polygon Barriers.This
         parameter is not used when the input network analysis layer's
         network data source is a portal service.
     exclude_restricted_elements {Boolean}:
         This parameter is deprecated and maintained only for backward
         compatibility. Analysis inputs will never be located on network
         elements that are restricted, corresponding to a parameter value of
         EXCLUDE or True.
     search_query {Value Table}:
         A query that restricts the search to a subset of the features within a
         source feature class. This is useful if you don't want to find
         features that may be unsuited for a network location. For example, if
         you don't want to locate on highway ramps, you can define a query to
         exclude them. A separate SQL expression can be specified per edge or
         junction source feature class of the network dataset.The parameter
         value is specified as a list with nested lists, with one
         entry per network source. Each inner list is composed of two values
         indicating the name of the network source and the SQL expression used
         as the query for that source. An empty string, "", indicates no query
         for a particular source.For example, the value [["Streets",
         "ROAD_CLASS <> 3"],
         ["Streets_ND_Junctions", ""]] specifies an SQL expression for the
         Streets source feature class and no expression for the
         Streets_ND_Junctions source feature class. If a network source is not
         included in the list, it is interpreted to have no query. The value
         [["Streets", "ROAD_CLASS <> 3"]] is equivalent to [["Streets",
         "ROAD_CLASS <> 3"], ["Streets_ND_Junctions", ""]].For more information
         about SQL syntax, see SQL reference for query
         expressions used in ArcGIS.The default value for this parameter is
         determined based on location
         properties stored in the input network analysis layer. If the network
         analysis layer has location settings overrides for the selected
         sublayer, those settings will be used. Otherwise, the network analysis
         layer's default location settings will be used. Setting a nondefault
         value for this parameter updates the network analysis layer's location
         settings overrides for the selected sublayer.This parameter is not
         used when adding locations using existing
         network location fields.This parameter is not used when the network
         analysis layer's network
         data source is ArcGIS Online.This parameter is not used when the
         network analysis layer's network
         data source is a portal running a version of ArcGIS Enterprise earlier
         than 11.0.
     allow_auto_relocate {Boolean}:
         Specifies whether inputs with existing network location fields can be
         automatically relocated at solve time to ensure valid, routable
         location fields for the analysis.ALLOW-Points located on restricted
         network elements and points
         affected by barriers will be relocated at solve time to the closest
         routable location. This is the default.NO_ALLOW-Network location
         fields will be used at solve time as is,
         even if the points are unreachable, and this may cause the solve to
         fail.The default value for this parameter is determined based on
         location
         properties stored in the input network analysis layer. If the network
         analysis layer has location settings overrides for the selected
         sublayer, those settings will be used. Otherwise, the network analysis
         layer's default location settings will be used. Setting a nondefault
         value for this parameter updates the network analysis layer's location
         settings overrides for the selected sublayer.Even if the automatic
         relocating at solve time is not allowed, inputs
         with no location fields or incomplete location fields will be located
         at solve time.This parameter is not used when the network analysis
         layer's network
         data source is ArcGIS Online.This parameter is not used when the
         network analysis layer's network
         data source is an ArcGIS Enterprise portal that does not support using
         network location fields.This parameter is not used when the network
         analysis layer's network
         data source is a portal running a version of ArcGIS Enterprise earlier
         than 11.0."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddLocations_na(
                *gp_fixargs(
                    (
                        in_network_analysis_layer,
                        sub_layer,
                        in_table,
                        field_mappings,
                        search_tolerance,
                        sort_field,
                        search_criteria,
                        match_type,
                        append,
                        snap_to_position_along_network,
                        snap_offset,
                        exclude_restricted_elements,
                        search_query,
                        allow_auto_relocate,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddVehicleRoutingProblemBreaks_na", None)
def AddVehicleRoutingProblemBreaks(
    in_vrp_layer=None,
    target_route=None,
    break_type: Literal["TIME_WINDOW_BREAK", "MAXIMUM_TRAVEL_TIME_BREAK", "MAXIMUM_WORK_TIME_BREAK"] | None = None,
    time_window_properties=None,
    travel_time_properties=None,
    work_time_properties=None,
    append_to_existing_breaks: Literal["APPEND", "CLEAR"] | None = None,
) -> Result1[str | Layer]:
    """AddVehicleRoutingProblemBreaks_na(in_vrp_layer, {target_route}, {break_type}, {time_window_properties;time_window_properties...}, {travel_time_properties;travel_time_properties...}, {work_time_properties;work_time_properties...}, {append_to_existing_breaks})

       Creates breaks in a Vehicle Routing Problem (VRP) layer.

    INPUTS:
     in_vrp_layer (Network Analyst Layer):
         The vehicle routing problem analysis layer to which the breaks will be
         added.
     target_route {String}:
         The route for the break parameters.  If this parameter is not
         specified, breaks will be created for each existing route.
     break_type {String}:
         Specifies the type of breaks that will be taken for the current VRP
         layer. All breaks must be of the same type.TIME_WINDOW_BREAK-Breaks
         will take place during a specific time
         window. This is the default.MAXIMUM_TRAVEL_TIME_BREAK-Breaks will
         take place after a certain
         amount of travel time. These values are either the amount of time
         until the first break or the amount of time between
         breaks.MAXIMUM_WORK_TIME_BREAK-Breaks will take place after a certain
         amount
         of cumulative time. These values are an amount of elapsed time since
         the start of the route.
     time_window_properties {Value Table}:
         Specifies a time range within which the break will begin. To set up a
         time window break, use two time-of-day values. The options
         below are enabled when theparameter is set to.
         Break TypeTime Window BreakIs Paid-A Boolean value indicating whether
         the break is paid.Break
         Duration-The duration of the break. This property can't contain
         null values and has a default value of 60.Time Window Start-The start
         time of the time window.Time Window End-The end time of the time
         window.Maximum Violation Time-The maximum allowable violation time for
         a time
         window break. A time window is considered violated if the arrival time
         falls outside the time range. A zero value indicates that the time
         window cannot be violated, that is, the time window is hard. A nonzero
         value indicates the maximum delay time. For example, the break can
         begin up to 30 minutes beyond the end of its time window but the delay
         is penalized pursuant to the Time Window Violation Importance setting,
         which rates the importance of honoring time windows without causing
         violations.
     travel_time_properties {Value Table}:
         Specifies how long a person can drive before the break is required.
         The properties below are enabled when theparameter is set to.
         Break TypeMaximum Travel Time BreakIs Paid-A Boolean value indicating
         whether the break is paid.Break
         Duration-The duration of the break. This property can't contain
         null values and has a default value of 60. Maximum Travel
         Time Between Breaks-The maximum amount of
         travel time that can be accumulated before the break is taken. The
         travel time is accumulated either from the end of the previous break
         or, if a break has not yet been taken, from the start of the route.
         If this is the route's final break, Thefield also indicates
         the maximum travel time that can be accumulated from the final break
         to the end depot. MaxTravelTimeBetweenBreaks           This
         field limits how long a person can drive until a break
         is required. For example, if theparameter (time_units in Python) of
         the analysis is set to, and thefield has a value of 120, the driver
         will get a break after two hours of driving. To assign a second break
         after two additional hours of driving, the second break'sfield value
         must be 120. Time Field
         UnitsMinutesMaxTravelTimeBetweenBreaksMaxTravelTimeBetweenBreaks
         The unit for this field value is specified by theparameter
         (time_units in Python). Time Field Units
     work_time_properties {Value Table}:
         Specifies how long a person can work before a break is required.
         The properties below are enabled when theparameter is set to.
         Break TypeMaximum Work Time BreakIs Paid-A Boolean value indicating
         whether the break is paid.Break
         Duration-The duration of the break. This property can't contain
         null values and has a default value of 60. Maximum Cumulative
         Work Time-The maximum amount of work time
         that can be accumulated before the break is taken. Work time is
         accumulated from the beginning of the route. Work time is the sum of
         travel time and service times at orders, depots, and breaks. However,
         it excludes wait time, which is the time a route (or driver) spends
         waiting at an order or depot for a time window to begin.
         Thefield also indicates the maximum amount of work time
         that can be accumulated before the break is taken.
         MaxCumulWorkTime           This field limits how long a person can
         work until a break
         is required. For example, if theparameter (time_units in Python) is
         set to, thefield has a value of 120, and thefield has a value of 15,
         the driver will get a 15-minute break after 2 hours of work.
         Time Field UnitsMinutesMaxCumulWorkTimeServiceTime
         Continuing with this example, assume a second break is
         needed after 3 additional hours of work. To specify this break, you
         would enter 315 (5 hours and 15 minutes) as the second break'sfield
         value. This number includes theandfield values of the preceding break,
         along with the 3 additional hours of work time before granting the
         second break. To avoid taking maximum work time breaks prematurely,
         remember that work time is accumulated from the beginning of the route
         and it includes the service time at previously visited depots, orders,
         and breaks. MaxCumulWorkTimeMaxCumulWorkTimeServiceTime
     append_to_existing_breaks {Boolean}:
         Specifies whether new breaks will be appended to the existing breaks
         attribute table.APPEND-New breaks will be appended to the existing set
         in the breaks
         attribute table. This is the default.CLEAR-Existing breaks will be
         replaced with new breaks."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddVehicleRoutingProblemBreaks_na(
                *gp_fixargs(
                    (
                        in_vrp_layer,
                        target_route,
                        break_type,
                        time_window_properties,
                        travel_time_properties,
                        work_time_properties,
                        append_to_existing_breaks,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddVehicleRoutingProblemRoutes_na", None)
def AddVehicleRoutingProblemRoutes(
    in_vrp_layer=None,
    number_of_routes=None,
    route_name_prefix=None,
    start_depot_name=None,
    end_depot_name=None,
    earliest_start_time=None,
    latest_start_time=None,
    max_order_count=None,
    capacities=None,
    route_constraints=None,
    costs=None,
    additional_route_time=None,
    append_to_existing_routes: Literal["APPEND", "CLEAR"] | None = None,
    date_and_time=None,
) -> Result1[str | Layer]:
    """AddVehicleRoutingProblemRoutes_na(in_vrp_layer, number_of_routes, route_name_prefix, {start_depot_name}, {end_depot_name}, {earliest_start_time}, {latest_start_time}, {max_order_count}, {capacities;capacities...}, {route_constraints;route_constraints...}, {costs;costs...}, {additional_route_time;additional_route_time...}, {append_to_existing_routes}, {date_and_time;date_and_time...})

       Creates routes in a Vehicle Routing Problem (VRP) layer or Last Mile
       Delivery layer. This tool will append rows to the Routes sublayer and
       can add rows with specific settings while creating a unique name
       field.

    INPUTS:
     in_vrp_layer (Network Analyst Layer):
         The  Vehicle Routing Problem or Last Mile Delivery analysis layer to
         which routes will be added.
     number_of_routes (Long):
         The number of routes that will be added.
     route_name_prefix (String):
         A qualifier that will be added to the title of every route layer item.
         For example, a route name prefix of WeekdayRoute would be used as the
         starting text for every route's name with the object ID appended to it
         (WeekdayRoute1, WeekdayRoute2, and so on).
     start_depot_name {String}:
         The name of the starting depot for the route.If this value is null,
         the route will begin from the first order
         assigned. Omitting the start depot is useful when the vehicle's
         starting location is unknown or irrelevant to the problem.For Vehicle
         Routing Problem layers, when this value is null, the
         end_depot_name parameter value cannot also be null. Both start and end
         depots can be null for Last Mile Delivery layers.Virtual start depots
         are not allowed if orders or depots are in
         multiple time zones.
     end_depot_name {String}:
         The name of the ending depot for the route.If this value is null, the
         route will end at the last order assigned.For Vehicle Routing Problem
         layers, when this value is null, the
         start_depot_name parameter value cannot also be null. Both start and
         end depots can be null for Last Mile Delivery layers.
     earliest_start_time {Date}:
         The earliest allowable start time for the route in a Vehicle Routing
         Problem layer. This parameter is used by the solver in
         conjunction with the
         time window of the starting depot provided in the Depots sublayer by
         thefield, for determining feasible route start times. This parameter
         has a default time-only value of 8:00:00 a.m., which is interpreted as
         8:00:00 a.m. on the date provided by the Default Date property of the
         analysis layer. If no value is specified, the default value is used.
         TimeWindowStartThis parameter is not applicable and its value is
         ignored if the input
         layer is a Last Mile Delivery layer.
     latest_start_time {Date}:
         The latest allowable start time for the route in a Vehicle Routing
         Problem layer.This parameter has a default time-only value of 10:00:00
         a.m., which
         is interpreted as 10:00:00 a.m. on the date provided by the Default
         Date property of the analysis layer. If no value is specified, the
         default value is used.This parameter is not applicable and its value
         is ignored if the input
         layer is a Last Mile Delivery layer.
     max_order_count {Long}:
         The maximum allowable number of orders on the route. The default value
         is 30 for Vehicle Routing Problem layers and null for Last Mile
         Delivery layers. If no value is specified, the default value is used.
     capacities {Value Table}:
         The maximum amount (volume, weight, quantity, and so on) that can be
         carried by the vehicle. A null value is the same as zero. A maximum of
         nine capacity fields are allowed, but use only the number necessary to
         model the needs of the vehicles.
     route_constraints {Value Table}:
         The constraints that will be placed on routes to limit total
         time, total travel time, and total distance. Max Total Time-The
         maximum allowable route duration. The route
         duration includes travel times as well as service and wait times at
         orders, depots, and breaks. Max Total Travel Time-The maximum
         allowable travel time for
         the route. The travel time includes only the time spent driving on the
         network and does not include service or wait times. This field value
         can't be larger than the field value. MaxTotalTimeMax Total
         Distance-The maximum allowable travel distance for the
         route.
     costs {Value Table}:
         The costs that may be incurred by the route in a VRP solution.Fixed
         Cost-A fixed monetary cost that is incurred only if the route is
         used in a solution (that is, it has orders assigned to it).Cost Per
         Unit Time-The monetary cost incurred per unit of work time
         for the total route duration, including travel times and service and
         wait times at orders, depots, and breaks. The default is 1.Cost Per
         Unit Distance-The monetary cost incurred per unit of distance
         traveled for the route length (total travel distance).Overtime Start
         Time-The duration of regular work time before overtime
         computation begins. Cost Per Unit Overtime-The monetary cost
         incurred per time
         unit of overtime work. This field can contain null values; a null
         value indicates that thevalue is the same as thevalue. Cost
         Per Unit OvertimeCost Per Unit Time
     additional_route_time {Value Table}:
         Additional route time options. Start Depot Service
         Time-The service time at the starting depot. This
         can be used to model the time spent loading the vehicle.End Depot
         Service Time-The service time at the ending depot. This can
         be used to model the time spent unloading the vehicle.
         Arrive/Depart Delay-The amount of travel time needed to
         accelerate the vehicle to normal travel speeds, decelerate it to a
         stop, and move it off and on the network (for example, in and out of
         parking). By including anvalue, the solver is deterred from sending
         many routes to service physically coincident orders.
         Arrive/Depart Delay
     append_to_existing_routes {Boolean}:
         Specifies whether new routes will be appended to the existing routes
         attribute table.APPEND-New routes will be appended to the existing set
         in the routes
         attribute table. This is the default.CLEAR-Existing routes will be
         deleted and replaced with new routes.
     date_and_time {Value Table}:
         Additional date and time options for a Last Mile Delivery
         layer. Earliest Route Start Date-The earliest start date for
         added routes. If
         this property is not specified, the routes will use the layer's
         default earliest route start date.Earliest Route Start Time-The
         earliest start time of day for added
         routes. If this property is not specified, the routes will use the
         layer's default earliest route start time.Route Start
         Flexibility-Indicates how long after the earliest allowed
         route start time the route can start. The value can be null or zero,
         which means that there is no flexibility in the starting time, or a
         positive number. Specify the value in the input layer's time units.
         Specify theproperty using a datetime.date object and
         theproperty using a datetime.time object. Earliest Route Start
         DateEarliest Route Start TimeThis parameter is not applicable and its
         value is ignored if the input
         layer is a Vehicle Routing Problem layer."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddVehicleRoutingProblemRoutes_na(
                *gp_fixargs(
                    (
                        in_vrp_layer,
                        number_of_routes,
                        route_name_prefix,
                        start_depot_name,
                        end_depot_name,
                        earliest_start_time,
                        latest_start_time,
                        max_order_count,
                        capacities,
                        route_constraints,
                        costs,
                        additional_route_time,
                        append_to_existing_routes,
                        date_and_time,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateLocations_na", None)
def CalculateLocations(
    in_point_features=None,
    in_network_dataset=None,
    search_tolerance=None,
    search_criteria=None,
    match_type: Literal["MATCH_TO_CLOSEST", "PRIORITY"] | None = None,
    source_ID_field=None,
    source_OID_field=None,
    position_field=None,
    side_field=None,
    snap_X_field=None,
    snap_Y_field=None,
    distance_field=None,
    snap_Z_field=None,
    location_field=None,
    exclude_restricted_elements: Literal["EXCLUDE", "INCLUDE"] | None = None,
    search_query=None,
    travel_mode=None,
) -> Result2[str | Table, str | Layer]:
    """CalculateLocations_na(in_point_features, {in_network_dataset}, {search_tolerance}, {search_criteria;search_criteria...}, {match_type}, {source_ID_field}, {source_OID_field}, {position_field}, {side_field}, {snap_X_field}, {snap_Y_field}, {distance_field}, {snap_Z_field}, {location_field}, {exclude_restricted_elements}, {search_query;search_query...}, {travel_mode})

       Locates input features on a network and adds fields to the input
       features that describe the network locations. The tool is used to
       precalculate the network locations of inputs that will be used in a
       Network Analyst workflow, improving performance of the analysis at
       solve time. The tool stores the calculated network locations of the
       inputs in fields in the input data.

    INPUTS:
     in_point_features (Table View):
         The input features for which the network locations will be
         calculated.For line and polygon features, since the network location
         information
         is stored in a BLOB field, only geodatabase feature classes are
         supported.
     in_network_dataset {Network Dataset Layer}:
         The network dataset that will be used to calculate the locations.This
         parameter is required unless a sublayer of a network analysis
         layer is used as input features. In that case, don't specify a value
         for this parameter or set it to the network dataset referenced by the
         network analysis layer.
     search_tolerance {Linear Unit}:
         The maximum search distance that will be used when locating the input
         features on the network. Features that are outside the search
         tolerance will be left unlocated. The parameter includes a value and
         units.The default is 5000 meters.If the input features are a sublayer
         of a network analysis layer, the
         default value for this parameter is determined based on location
         properties stored in the input network analysis layer. If the network
         analysis layer has location settings overrides for the selected
         sublayer, those settings will be used. Otherwise, the network analysis
         layer's default location settings will be used. Setting a nondefault
         value for this parameter updates the network analysis layer's location
         settings overrides for the selected sublayer.The parameter is not used
         when calculating locations for line or
         polygon features.
     search_criteria {Value Table}:
         The edge and junction sources in the network dataset that will be
         searched when locating inputs on the network. For example, if the
         network dataset references separate feature classes representing
         streets and sidewalks, you can locate inputs on streets but not on
         sidewalks.The parameter value is specified as a list with nested
         lists. The
         nested lists are composed of two values indicating the name and snap
         type of each network source. The following are the available
         snap type options for each
         network source:        NONE-The point will not locate on elements in
         this network
         source.SHAPE-The point will locate on the closest point of an element
         in this
         network source.For example, a parameter value of
         [["Streets","SHAPE"],["Streets_ND_Junctions","NONE"]] specifies that
         the search can locate on the shape of the Streets source but not on
         the Streets_ND_Junctions source.Any network edge or junction source
         that is not included in this list
         will use its default snap type. It is recommended that you include all
         network sources in your list and explicitly set the snap type for
         each. Historically, the tool supported the snap type options
         MIDDLE,
         END, and MIDDLE_END. These options are deprecated and maintained for
         backward compatibility only. If one of these options is specified, the
         tool reverts to the SHAPE option for that network source.The default
         value is to locate on all network sources except override
         junctions created by running the Dissolve Network tool and system
         junctions.If the input features are a sublayer of a network analysis
         layer, the
         default value for this parameter is determined based on location
         properties stored in the input network analysis layer. If the network
         analysis layer has location settings overrides for the selected
         sublayer, those settings will be used. Otherwise, the network analysis
         layer's default location settings will be used. Setting a nondefault
         value for this parameter updates the network analysis layer's location
         settings overrides for the selected sublayer.
     match_type {Boolean}:
         This parameter is deprecated and maintained only for backward
         compatibility. Inputs will always be matched to the closest network
         source among all the sources used for locating, corresponding to a
         parameter value of MATCH_TO_CLOSEST or True.
     source_ID_field {Field}:
         The name of the field to be created or updated that will be
         populated with the ID of the network dataset source feature class for
         the input feature's computed network location. The default value is.
         SourceIDThe parameter is not used when calculating locations for line
         or
         polygon features.Do not use this parameter when the input features are
         a sublayer of a
         network analysis layer. Network locations in a sublayer must be stored
         in location fields with the default names or they will not be used
         when the layer is solved.
     source_OID_field {Field}:
         The name of the field to be created or updated that will be
         populated with thefield value of the network dataset source feature
         class for the input feature's computed network location. The default
         value is. ObjectIDSourceOIDThe parameter is not used when
         calculating locations for line or
         polygon features.Do not use this parameter when the input features are
         a sublayer of a
         network analysis layer. Network locations in a sublayer must be stored
         in location fields with the default names or they will not be used
         when the layer is solved.
     position_field {Field}:
         The name of the field to be created or updated describing the
         computed network location's percent along the network element where it
         was located. The default value is. PosAlongThe parameter is not
         used when calculating locations for line or
         polygon features.Do not use this parameter when the input features are
         a sublayer of a
         network analysis layer. Network locations in a sublayer must be stored
         in location fields with the default names or they will not be used
         when the layer is solved.
     side_field {Field}:
         The name of the field to be created or updated describing the
         side of the network edge where the computed network location is
         located. The default value is. SideOfEdgeThe parameter is not
         used when calculating locations for line or
         polygon features.Do not use this parameter when the input features are
         a sublayer of a
         network analysis layer. Network locations in a sublayer must be stored
         in location fields with the default names or they will not be used
         when the layer is solved.
     snap_X_field {Field}:
         The name of the field to be created or updated with the
         x-coordinate of the computed network location. The default value is.
         SnapXThe parameter is not used when calculating locations for line or
         polygon features.Do not use this parameter when the input features are
         a sublayer of a
         network analysis layer. Network locations in a sublayer must be stored
         in location fields with the default names or they will not be used
         when the layer is solved.
     snap_Y_field {Field}:
         The name of the field to be created or updated with the
         y-coordinate of the computed network location. The default value is.
         SnapYThe parameter is not used when calculating locations for line or
         polygon features.Do not use this parameter when the input features are
         a sublayer of a
         network analysis layer. Network locations in a sublayer must be stored
         in location fields with the default names or they will not be used
         when the layer is solved.
     distance_field {Field}:
         The name of the field to be created or updated describing the
         distance in meters of the original point feature from its computed
         network location. The default value is.
         DistanceToNetworkInMetersThe parameter is not used when calculating
         locations for line or
         polygon features.Do not use this parameter when the input features are
         a sublayer of a
         network analysis layer. Network locations in a sublayer must be stored
         in location fields with the default names or they will not be used
         when the layer is solved.
     snap_Z_field {Field}:
         The name of the field to be created or updated with the
         z-coordinate of the computed network location. The default value is.
         SnapZThe parameter is used only when the input network dataset
         supports
         connectivity based on z-coordinate values of the network sources.The
         parameter is not used when calculating locations for line or
         polygon features.Do not use this parameter when the input features are
         a sublayer of a
         network analysis layer. Network locations in a sublayer must be stored
         in location fields with the default names or they will not be used
         when the layer is solved.
     location_field {Field}:
         The name of the field to be created or updated with the
         location ranges of the computed network locations for line or polygon
         features. The default value is. LocationsThe parameter is used
         only when calculating locations for line or
         polygon features.Do not use this parameter when the input features are
         a sublayer of a
         network analysis layer. Network locations in a sublayer must be stored
         in location fields with the default names or they will not be used
         when the layer is solved.
     exclude_restricted_elements {Boolean}:
         This parameter is deprecated and maintained only for backward
         compatibility. Analysis inputs will never be located on network
         elements that are restricted, corresponding to a parameter value of
         EXCLUDE or True.
     search_query {Value Table}:
         A query that restricts the search to a subset of the features within a
         source feature class. This is useful if you don't want to find
         features that may be unsuited for a network location. For example, if
         you don't want to locate on highway ramps, you can define a query to
         exclude them. A separate SQL expression can be specified per edge or
         junction source feature class of the network dataset.The parameter
         value is specified as a list with nested lists, with one
         entry per network source. Each inner list is composed of two values
         indicating the name of the network source and the SQL expression used
         as the query for that source. An empty string, "", indicates no query
         for a particular source.For example, the value [["Streets",
         "ROAD_CLASS <> 3"],
         ["Streets_ND_Junctions", ""]] specifies an SQL expression for the
         Streets source feature class and no expression for the
         Streets_ND_Junctions source feature class. If a network source is not
         included in the list, it is interpreted to have no query. The value
         [["Streets", "ROAD_CLASS <> 3"]] is equivalent to [["Streets",
         "ROAD_CLASS <> 3"], ["Streets_ND_Junctions", ""]].For more information
         about SQL syntax, see SQL reference for query
         expressions used in ArcGIS.By default, no query is used for any
         source.If the input features are a sublayer of a network analysis
         layer, the
         default value for this parameter is determined based on location
         properties stored in the input network analysis layer. If the network
         analysis layer has location settings overrides for the selected
         sublayer, those settings will be used. Otherwise, the network analysis
         layer's default location settings will be used. Setting a nondefault
         value for this parameter updates the network analysis layer's location
         settings overrides for the selected sublayer.
     travel_mode {String}:
         The name of the travel mode that will be used.If you specify a travel
         mode, the travel mode settings, such as
         restrictions and impedance attributes, will be considered when
         calculating network location. For example, if the closest network edge
         to one of the input points is restricted when the selected travel mode
         is applied, the tool will locate the point on the next-closest network
         edge that is not restricted.The available travel modes depend on the
         in_network_dataset parameter
         value.An arcpy.na.TravelMode object and a string containing the valid
         JSON
         representation of a travel mode can also be used as input to this
         parameter.If a sublayer of a network analysis layer is used as input
         features,
         do not set a value for this parameter. When network locations are
         calculated, the network analysis layer's current travel mode will
         automatically be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateLocations_na(
                *gp_fixargs(
                    (
                        in_point_features,
                        in_network_dataset,
                        search_tolerance,
                        search_criteria,
                        match_type,
                        source_ID_field,
                        source_OID_field,
                        position_field,
                        side_field,
                        snap_X_field,
                        snap_Y_field,
                        distance_field,
                        snap_Z_field,
                        location_field,
                        exclude_restricted_elements,
                        search_query,
                        travel_mode,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CopyNetworkAnalysisLayer_na", None)
def CopyNetworkAnalysisLayer(
    in_network_analysis_layer=None,
    out_layer_name=None,
) -> Result1[str | Layer]:
    """CopyNetworkAnalysisLayer_na(in_network_analysis_layer, {out_layer_name})

       Copies a network analysis layer to a duplicate layer. The new layer
       will have the same analysis settings and network data source as the
       original layer and a copy of the original layer's analysis data.

    INPUTS:
     in_network_analysis_layer (Network Analyst Layer):
         The network analysis layer to copy.
     out_layer_name {String}:
         The name of the network analysis layer that will be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CopyNetworkAnalysisLayer_na(*gp_fixargs((in_network_analysis_layer, out_layer_name), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CopyTraversedSourceFeatures_na", None)
def CopyTraversedSourceFeatures(
    input_network_analysis_layer=None,
    output_location=None,
    edge_feature_class_name=None,
    junction_feature_class_name=None,
    turn_table_name=None,
) -> Result:
    """CopyTraversedSourceFeatures_na(input_network_analysis_layer, output_location, edge_feature_class_name, junction_feature_class_name, turn_table_name)

       Creates two feature classes and a table, which together contain
       information about the edges, junctions, and turns that are traversed
       while solving a network analysis layer.

    INPUTS:
     input_network_analysis_layer (Network Analyst Layer):
         The network analysis layer from which traversed source features will
         be copied. If the network analysis layer does not have a valid result,
         the layer will be solved to produce one.
     output_location (Workspace / Feature Dataset):
         The workspace where the output table and two feature classes will be
         saved.
     edge_feature_class_name (String):
         The name of the feature class that will contain information about the
         traversed edge source features. If the solved network analysis layer
         doesn't traverse any edge features, an empty feature class will be
         created.
     junction_feature_class_name (String):
         The name of the feature class that will contain information about the
         traversed junction source features, including system junctions and
         relevant points from the input network analysis layer. If the solved
         network analysis layer doesn't traverse any junctions, an empty
         feature class will be created.
     turn_table_name (String):
         The name of the table that will contain information about the
         traversed global turns and turn features that scale cost for the
         underlying edges. If the solved network analysis layer doesn't
         traverse any turns, an empty table will be created. Since restricted
         turns are never traversed, they are never included in the output."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CopyTraversedSourceFeatures_na(
                *gp_fixargs(
                    (
                        input_network_analysis_layer,
                        output_location,
                        edge_feature_class_name,
                        junction_feature_class_name,
                        turn_table_name,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DeleteNetworkAnalysisLayer_na", None)
def DeleteNetworkAnalysisLayer(
    in_network_analysis_layers=None,
) -> Result1[str]:
    """DeleteNetworkAnalysisLayer_na(in_network_analysis_layers;in_network_analysis_layers...)

       Deletes a network analysis layer and its analysis data.

    INPUTS:
     in_network_analysis_layers (Network Analyst Layer):
         The network analysis layer or layers to delete."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DeleteNetworkAnalysisLayer_na(*gp_fixargs((in_network_analysis_layers,), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Directions_na", None)
def Directions(
    in_network_analysis_layer=None,
    file_type: Literal["TEXT", "XML", "HTML"] | None = None,
    out_directions_file=None,
    report_units: Literal["Feet", "Yards", "Miles", "Meters", "Kilometers", "NauticalMiles"] | None = None,
    report_time: Literal["REPORT_TIME", "NO_REPORT_TIME"] | None = None,
    time_attribute=None,
    language=None,
    style_name: Literal["NA Desktop", "NA Navigation", "NA Campus"] | None = None,
    stylesheet=None,
) -> Result2[str, str | Layer]:
    """Directions_na(in_network_analysis_layer, file_type, out_directions_file, report_units, {report_time}, {time_attribute}, {language}, {style_name}, {stylesheet})

       Generates turn-by-turn directions from a network analysis layer with
       routes. The directions can be written to a file in text, XML, or HTML
       format. If you provide an appropriate style sheet, the directions can
       be written to any other file format.

    INPUTS:
     in_network_analysis_layer (Network Analyst Layer):
         The network analysis layer for which directions will be generated.
         Directions can be generated only for route, closest facility, and
         vehicle routing problem network analysis layers. This tool does
         not support last mile delivery analysis layers
         even though this layer type supports directions.
     file_type (String):
         Specifies the format that will be used for the output directions file.
         This parameter is ignored if the style sheet parameter has a
         value.XML-The output directions file will be generated as an XML file.
         Apart
         from direction strings and the length and time information for the
         routes, the file will also contain information about the maneuver type
         and the turn angle for each direction.TEXT-The output directions file
         will be generated as a simple TXT file
         containing the direction strings, the length and, optionally, the time
         information for the routes.HTML-The output directions file will be
         generated as an HTML file
         containing the direction strings, the length and, optionally, the time
         information for the routes.
     report_units (String):
         Specifies the linear units that will be used in the directions file.
         For example, even if the impedance attribute has units of meters, you
         can show directions in miles.Feet-The linear units will be
         feet.Yards-The linear units will be
         yards.Miles-The linear units will be miles.Meters-The linear units
         will be meters.Kilometers-The linear units will be
         kilometers.NauticalMiles-The linear units will be nautical miles
     report_time {Boolean}:
         Specifies whether travel time will be reported in the directions
         file.NO_REPORT_TIME-Travel time will not be reported in the directions
         file.REPORT_TIME-Travel time will be reported in the directions file.
         This
         is the default.
     time_attribute {String}:
         The time-based cost attribute that will be used to provide travel
         times in the directions. The cost attribute must exist on the network
         dataset used by the input network analysis layer.
     language {String}:
         The language that will be used for driving directions.Use a two- or
         five-character language code representing one of the
         available languages for directions generation for this parameter
         value. In Python, you can retrieve a list of available language codes
         using the ListDirectionsLanguages function.
     style_name {String}:
         Specifies the formatting style that will be used for directions.NA
         Desktop-Printable turn-by-turn directions will be used.NA
         Navigation-Turn-by-turn directions designed for an in-vehicle
         navigation device will be used.NA Campus-Turn-by-turn walking
         directions, which are designed for
         pedestrian routes, will be used.
     stylesheet {File}:
         The style sheet that will be used for generating a formatted output
         file type (such as a PDF, Word, or HTML). The suffix of the file in
         the output directions file parameter must match the file type that the
         style sheet generates. The tool overrides the output file type
         parameter if this parameter contains a value.To create custom HTML and
         text style sheets, copy and edit the style
         sheets from Network Analyst. The style sheets are available in the
         <ArcGIS installation
         directory>\\Pro\\Resources\\NetworkAnalyst\\Directions\\Styles directory.
         The HTML style sheet is Dir2PHTML.xsl, and the text style sheet is
         Dir2PlainText.xsl.

    OUTPUTS:
     out_directions_file (File):
         If you provide a style sheet for the stylesheet parameter, ensure that
         the file suffix for out_directions_file matches the file type the
         style sheet produces."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Directions_na(
                *gp_fixargs(
                    (
                        in_network_analysis_layer,
                        file_type,
                        out_directions_file,
                        report_units,
                        report_time,
                        time_attribute,
                        language,
                        style_name,
                        stylesheet,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeClosestFacilityAnalysisLayer_na", None)
def MakeClosestFacilityAnalysisLayer(
    network_data_source=None,
    layer_name=None,
    travel_mode=None,
    travel_direction: Literal["TO_FACILITIES", "FROM_FACILITIES"] | None = None,
    cutoff=None,
    number_of_facilities_to_find=None,
    time_of_day=None,
    time_zone: Literal["UTC", "LOCAL_TIME_AT_LOCATIONS"] | None = None,
    time_of_day_usage: Literal["START_TIME", "END_TIME"] | None = None,
    line_shape: Literal["NO_LINES", "STRAIGHT_LINES", "ALONG_NETWORK"] | None = None,
    accumulate_attributes=None,
    generate_directions_on_solve: Literal["DIRECTIONS", "NO_DIRECTIONS"] | None = None,
    ignore_invalid_locations: Literal["SKIP", "HALT"] | None = None,
) -> Result1[str | Layer]:
    """MakeClosestFacilityAnalysisLayer_na(network_data_source, {layer_name}, {travel_mode}, {travel_direction}, {cutoff}, {number_of_facilities_to_find}, {time_of_day}, {time_zone}, {time_of_day_usage}, {line_shape}, {accumulate_attributes;accumulate_attributes...}, {generate_directions_on_solve}, {ignore_invalid_locations})

       Makes a closest facility network analysis layer and sets its analysis
       properties. A closest facility analysis layer is useful in determining
       the closest facility or facilities to an incident based on a specified
       travel mode. The layer can be created using a local network dataset or
       a service hosted online or in a portal.

    INPUTS:
     network_data_source (Network Dataset Layer / String):
         The network dataset or service on which the network analysis will be
         performed. Use the portal URL for a service.
     layer_name {String}:
         The name of the network analysis layer that will be created.
     travel_mode {String}:
         The name of the travel mode that will be used in the analysis. The
         travel mode represents a collection of network settings, such as
         travel restrictions and U-turn policies, that determine how a
         pedestrian, car, truck, or other medium of transportation moves
         through the network. Travel modes are defined on your network data
         source.An arcpy.na.TravelMode object and a string containing the valid
         JSON
         representation of a travel mode can also be used as input to this
         parameter.
     travel_direction {String}:
         Specifies the direction of travel between facilities and
         incidents.TO_FACILITIES-Direction of travel is from incidents to
         facilities.
         Retail stores commonly use this setting, since they are concerned with
         the time it takes the shoppers (incidents) to reach the store
         (facility). This is the default.FROM_FACILITIES-Direction of travel is
         from facilities to incidents.
         Fire departments commonly use this setting, since they are concerned
         with the time it takes to travel from the fire station (facility) to
         the location of the emergency (incident).The direction of travel may
         influence the facilities found if the
         network contains one-way streets or impedances based on the direction
         of travel. For instance, it may take 10 minutes to drive from a
         particular incident to a particular facility, but the journey may take
         15 minutes traveling in the other direction, from the facility to the
         incident, because of one-way streets or different traffic conditions.
     cutoff {Double}:
         The impedance value at which to stop searching for facilities for a
         given incident in the units of the impedance attribute used by the
         travel_mode value. This cutoff can be overridden on a per-incident
         basis by specifying individual cutoff values in the incidents sublayer
         when travel_direction = 'TO_FACILITIES' or on a per-facility basis by
         specifying individual cutoff values in the facilities sublayer when
         travel_direction = 'FROM_FACILITIES' By default, no cutoff is used for
         the analysis.
     number_of_facilities_to_find {Long}:
         The number of closest facilities to find per incident. This default
         can be overridden by specifying an individual value for the
         TargetFacilityCount property in the incidents sublayer. The default
         number of facilities to find is one.
     time_of_day {Date}:
         The time and date at which the routes will begin or end. The
         interpretation of this value depends on whether time_of_day_usage is
         set to be the start time or the end time of the route.If you chose a
         traffic-based impedance attribute, the solution will be
         generated given dynamic traffic conditions at the time of day
         specified here. A date and time can be specified as 5/14/2012 10:30
         AM. Configure the analysis to use one of the following special
         dates to model a day of the week or the current date instead of a
         specific, static date:
         Today-12/30/1899Sunday-12/31/1899Monday-1/1/1900Tuesday-1/2/1900Wednes
         day-1/3/1900Thursday-1/4/1900Friday-1/5/1900Saturday-1/6/1900
     time_zone {String}:
         Specifies the time zone for the time_of_day parameter.
         LOCAL_TIME_AT_LOCATIONS-                  The time_of_day
         parameter refers to the time zone in which
         the facilities or incidents are located. This is the default.
         If time_of_day_usage is set to START_TIME and travel_direction is set
         to FROM_FACILITIES, this is the time zone of the facilities.If
         time_of_day_usage is set to START_TIME and travel_direction is set
         to TO_FACILITIES, this is the time zone of the incidents.If
         time_of_day_usage is set to END_TIME and travel_direction is set to
         FROM_FACILITIES, this is the time zone of the incidents.If
         time_of_day_usage is set to END_TIME and travel_direction is set to
         TO_FACILITIES, this is the time zone of the facilities.UTC-The
         time_of_day parameter refers to coordinated universal time
         (UTC). Choose this option if you want to find what's nearest for a
         specific time, such as now, but aren't certain in which time zone the
         facilities or incidents will be located.
     time_of_day_usage {String}:
         Specifies whether the value of the time_of_day parameter represents
         the arrival or departure time for the route or routes.
         START_TIME-The time_of_day parameter value is interpreted as
         the departure time from the facility or incident. This is the default.
         When this setting is chosen, the time_of_day parameter indicates that
         the solver will find the best route given a departure time.
         END_TIME-The time_of_day parameter value is interpreted as
         the arrival time at the facility or incident. This option is
         useful if you want to know the time to depart from a
         location so you arrive at the destination at the time specified in the
         time_of_day parameter.
     line_shape {String}:
         Specifies the shape type that will be used for the route features that
         are output by the analysis.Regardless of the output shape type
         specified, the best route is
         always determined by the network impedance, not Euclidean distance.
         This means that only the route shapes are different, not the
         underlying traversal of the network.ALONG_NETWORK-The output routes
         will have the exact shape of the
         underlying network sources. The output includes route measurements for
         linear referencing. The measurements increase from the first stop and
         record the cumulative impedance to reach a given position.NO_LINES-No
         shape will be generated for the output routes.STRAIGHT_LINES-The
         output route shape will be a single straight line
         between the stops.
     accumulate_attributes {String}:
         A list of cost attributes to be accumulated during analysis. These
         accumulated attributes are for reference only; the solver only uses
         the cost attribute used by the designated travel mode when solving the
         analysis.For each cost attribute that is accumulated, a
         Total_[Impedance]
         property is populated in the network analysis output features.This
         parameter is not available if the network data source is an
         ArcGIS Online service or the network data source is a service on a
         version of Portal for ArcGIS that does not support accumulation.
     generate_directions_on_solve {Boolean}:
         Specifies whether directions will be generated when running the
         analysis.DIRECTIONS-Turn-by-turn directions will be generated on
         solve.NO_DIRECTIONS-Turn-by-turn directions will not be generated on
         solve.
         This is the default.For an analysis in which generating turn-by-turn
         directions is not
         needed, use the default option NO_DIRECTIONS to reduce the time it
         takes to solve the analysis.
     ignore_invalid_locations {Boolean}:
         Specifies whether invalid input locations will be ignored. Typically,
         locations are invalid if they cannot be located on the network. When
         invalid locations are ignored, the solver will skip them and attempt
         to perform the analysis using the remaining locations.SKIP-Invalid
         input locations will be ignored and only valid locations
         will be used. This is the default.HALT-All input locations will be
         used. Invalid locations will cause
         the analysis to fail."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeClosestFacilityAnalysisLayer_na(
                *gp_fixargs(
                    (
                        network_data_source,
                        layer_name,
                        travel_mode,
                        travel_direction,
                        cutoff,
                        number_of_facilities_to_find,
                        time_of_day,
                        time_zone,
                        time_of_day_usage,
                        line_shape,
                        accumulate_attributes,
                        generate_directions_on_solve,
                        ignore_invalid_locations,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeClosestFacilityLayer_na", None)
def MakeClosestFacilityLayer(
    in_network_dataset=None,
    out_network_analysis_layer=None,
    impedance_attribute=None,
    travel_from_to: Literal["TRAVEL_TO", "TRAVEL_FROM"] | None = None,
    default_cutoff=None,
    default_number_facilities_to_find=None,
    accumulate_attribute_name=None,
    UTurn_policy: Literal["ALLOW_UTURNS", "NO_UTURNS", "ALLOW_DEAD_ENDS_ONLY", "ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY"]
    | None = None,
    restriction_attribute_name=None,
    hierarchy: Literal["USE_HIERARCHY", "NO_HIERARCHY"] | None = None,
    hierarchy_settings=None,
    output_path_shape: Literal["NO_LINES", "STRAIGHT_LINES", "TRUE_LINES_WITH_MEASURES", "TRUE_LINES_WITHOUT_MEASURES"]
    | None = None,
    time_of_day=None,
    time_of_day_usage: Literal["START_TIME", "END_TIME", "NOT_USED"] | None = None,
) -> Result1[str | Layer]:
    """MakeClosestFacilityLayer_na(in_network_dataset, out_network_analysis_layer, impedance_attribute, {travel_from_to}, {default_cutoff}, {default_number_facilities_to_find}, {accumulate_attribute_name;accumulate_attribute_name...}, {UTurn_policy}, {restriction_attribute_name;restriction_attribute_name...}, {hierarchy}, {hierarchy_settings}, {output_path_shape}, {time_of_day}, {time_of_day_usage})

       Makes a closest facility network analysis layer and sets its analysis
       properties. A closest facility analysis layer is useful in determining
       the closest facility or facilities to an incident based on a specified
       network cost.

    INPUTS:
     in_network_dataset (Network Dataset Layer):
         The network dataset on which the closest facility analysis will be
         performed.
     out_network_analysis_layer (String):
         Name of the closest facility network analysis layer to create.
     impedance_attribute (String):
         The cost attribute that will be used as impedance in the analysis.
     travel_from_to {String}:
         Specifies the direction of travel between facilities and
         incidents.TRAVEL_FROM-Direction of travel is from facilities to
         incidents. Fire
         departments commonly use the this setting, since they are concerned
         with the time it takes to travel from the fire station (facility) to
         the location of the emergency (incident).TRAVEL_TO-Direction of travel
         is from incidents to facilities. Retail
         stores commonly use this setting, since they are concerned with the
         time it takes the shoppers (incidents) to reach the store
         (facility).Using this option can find different facilities on a
         network with one-
         way restrictions and different impedances based on direction of
         travel. For instance, a facility may be a 10-minute drive from the
         incident while traveling from the incident to the facility, but while
         traveling from the facility to the incident, it may be a 15-minute
         journey because of different travel time in that direction.
     default_cutoff {Double}:
         Default impedance value at which to stop searching for facilities for
         a given incident. This default can be overridden by specifying the
         cutoff value on incidents when the direction of travel is from
         incidents to facilities or by specifying the cutoff value on
         facilities when the direction of travel is from facilities to
         incidents.
     default_number_facilities_to_find {Long}:
         Default number of closest facilities to find per incident. The default
         can be overridden by specifying a value for the TargetFacilityCount
         property on the incidents.
     accumulate_attribute_name {String}:
         A list of cost attributes to be accumulated during analysis.
         These accumulation attributes are for reference only; the solver only
         uses the cost attribute specified by theparameter to calculate the
         route. Impedance AttributeFor each cost attribute that is
         accumulated, a Total_[Impedance]
         property is added to the routes that are output by the solver.
     UTurn_policy {String}:
         Specifies the U-turn policy that will be used at junctions. Allowing
         U-turns implies that the solver can turn around at a junction and
         double back on the same street. Given that junctions represent street
         intersections and dead ends, different vehicles may be able to turn
         around at some junctions but not at others-it depends on whether the
         junction represents an intersection or a dead end. To accommodate
         this, the U-turn policy parameter is implicitly specified by the
         number of edges that connect to the junction, which is known as
         junction valency. The acceptable values for this parameter are listed
         below; each is followed by a description of its meaning in terms of
         junction valency.ALLOW_UTURNS-U-turns are permitted at junctions with
         any number of
         connected edges. This is the default value.NO_UTURNS-U-turns are
         prohibited at all junctions, regardless of
         junction valency. However, U-turns are still permitted at network
         locations even when this option is specified, but you can set the
         individual network location's CurbApproach property to prohibit
         U-turns there as well.ALLOW_DEAD_ENDS_ONLY-U-turns are prohibited at
         all junctions, except
         those that have only one adjacent edge (a dead
         end).ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY-U-turns are prohibited at
         junctions where exactly two adjacent edges meet but are permitted at
         intersections (junctions with three or more adjacent edges) and dead
         ends (junctions with exactly one adjacent edge). Often, networks have
         extraneous junctions in the middle of road segments. This option
         prevents vehicles from making U-turns at these locations.If you need a
         more precisely defined U-turn policy, consider adding a
         global turn delay evaluator to a network cost attribute or adjusting
         its settings if one exists, and pay particular attention to the
         configuration of reverse turns. You can also set the CurbApproach
         property of your network locations.
     restriction_attribute_name {String}:
         A list of restriction attributes that will be applied during the
         analysis.
     hierarchy {Boolean}:
         USE_HIERARCHY-The hierarchy attribute will be used for the analysis.
         Using a hierarchy results in the solver preferring higher-order edges
         to lower-order edges. Hierarchical solves are faster, and they can be
         used to simulate the preference of a driver who chooses to travel on
         freeways rather than local roads when possible-even if that means a
         longer trip. This option is valid only if the input network dataset
         has a hierarchy attribute.NO_HIERARCHY-The hierarchy attribute will
         not be used for the
         analysis, and the result will be an exact route for the network
         dataset.The parameter is not used if no hierarchy attribute is defined
         on the
         network dataset used to perform the analysis.
     hierarchy_settings {Network Analyst Hierarchy Settings}:
         Prior to version 10, this parameter allowed you to change the
         hierarchy ranges for the analysis from the default hierarchy ranges
         established in the network dataset. At version 10, this parameter is
         no longer supported and should be specified as an empty string. To
         change the hierarchy ranges for the analysis, update the default
         hierarchy ranges in the network dataset.
     output_path_shape {String}:
         Specifies the shape type that will be used for the route features that
         are output by the analysis.TRUE_LINES_WITH_MEASURES-The output routes
         will have the exact shape
         of the underlying network sources. The output includes route
         measurements for linear referencing. The measurements increase from
         the first stop and record the cumulative impedance to reach a given
         position.TRUE_LINES_WITHOUT_MEASURES-The output routes will have the
         exact
         shape of the underlying network sources.STRAIGHT_LINES-The output
         route shape will be a single straight line
         between each paired incident and facility.NO_LINES-No shape will be
         generated for the output routes.Regardless of the output shape type
         specified, the best route is
         always determined by the network impedance, not Euclidean distance.
         This means that only the route shapes are different, not the
         underlying traversal of the network.
     time_of_day {Date}:
         Specifies the time and date at which the routes should begin or end.
         The interpretation of this value depends on whether Time of Day Usage
         is set to be the start time or the end time of the route.If you have
         chosen a traffic-based impedance attribute, the solution
         will be generated given dynamic traffic conditions at the time of day
         specified here. A date and time can be specified as 5/14/2012 10:30
         AM. Instead of using a particular date, a day of the week can
         be
         specified using the following dates.For example, to specify that
         travel should begin at 5:00 PM on Tuesday, specify the parameter value
         as 1/2/1900 5:00 PM.
         Today-12/30/1899Sunday-12/31/1899Monday-1/1/1900Tuesday-1/2/1900Wednes
         day-1/3/1900Thursday-1/4/1900Friday-1/5/1900Saturday-1/6/1900
     time_of_day_usage {String}:
         Indicates whether the value of the Time of Day parameter represents
         the arrival or departure time for the route or routes.
         START_TIME-Time of Day is interpreted as the departure time
         from the facility or incident. When this setting is chosen,
         Time of Day indicates the solver should
         find the best route given a departure time. END_TIME-Time of
         Day is interpreted as the arrival time at
         the facility or incident. This option is useful if you want to
         know what time to depart from a
         location so that you arrive at the destination at the time specified
         in Time of Day.NOT_USED-When Time of Day doesn't have a value, this
         setting is the
         only choice. When Time of Day has a value, this setting isn't
         available."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeClosestFacilityLayer_na(
                *gp_fixargs(
                    (
                        in_network_dataset,
                        out_network_analysis_layer,
                        impedance_attribute,
                        travel_from_to,
                        default_cutoff,
                        default_number_facilities_to_find,
                        accumulate_attribute_name,
                        UTurn_policy,
                        restriction_attribute_name,
                        hierarchy,
                        hierarchy_settings,
                        output_path_shape,
                        time_of_day,
                        time_of_day_usage,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeLastMileDeliveryAnalysisLayer_na", None)
def MakeLastMileDeliveryAnalysisLayer(
    network_data_source=None,
    layer_name=None,
    travel_mode=None,
    time_units: Literal["Seconds", "Minutes", "Hours", "Days"] | None = None,
    distance_units: Literal[
        "Miles",
        "Kilometers",
        "Feet",
        "Yards",
        "Meters",
        "Inches",
        "Centimeters",
        "Millimeters",
        "Decimeters",
        "NauticalMiles",
    ]
    | None = None,
    earliest_route_start_date=None,
    earliest_route_start_time=None,
    max_route_total_time=None,
    time_zone_for_time_fields: Literal["LOCAL_TIME_AT_LOCATIONS", "UTC"] | None = None,
    sequence_gap=None,
    ignore_invalid_order_locations: Literal["SKIP", "HALT"] | None = None,
    line_shape: Literal["ALONG_NETWORK", "STRAIGHT_LINES", "NO_LINES"] | None = None,
    generate_directions_on_solve: Literal["DIRECTIONS", "NO_DIRECTIONS"] | None = None,
) -> Result1[str | Layer]:
    """MakeLastMileDeliveryAnalysisLayer_na(network_data_source, {layer_name}, {travel_mode}, {time_units}, {distance_units}, {earliest_route_start_date}, {earliest_route_start_time}, {max_route_total_time}, {time_zone_for_time_fields}, {sequence_gap}, {ignore_invalid_order_locations}, {line_shape}, {generate_directions_on_solve})

       Creates a last mile delivery network analysis layer and sets its
       analysis properties. A last mile delivery analysis layer is useful for
       optimizing a set of routes using a fleet of vehicles. The layer can be
       created using a local network dataset or a service hosted online or in
       a portal.

    INPUTS:
     network_data_source (Network Dataset Layer / String):
         The network dataset or service on which the network analysis will be
         performed. Use the portal URL for a service.The network must have at
         least one travel mode, one cost attribute
         with time units, and one cost attribute with distance units, as well
         as a time zone attribute.
     layer_name {String}:
         The name of the network analysis layer that will be created.
     travel_mode {String}:
         The name of the travel mode that will be used in the analysis. The
         travel mode represents a collection of network settings, such as
         travel restrictions and U-turn policies, that determine how a
         pedestrian, car, truck, or other medium of transportation moves
         through the network. Travel modes are defined on your network data
         source.An arcpy.na.TravelMode object and a string containing the valid
         JSON
         representation of a travel mode can also be used as input to this
         parameter.The travel mode's impedance attribute must have units of
         time.
     time_units {String}:
         Specifies the time units that will be used by the analysis layer's
         properties and the temporal fields of the analysis layer's sublayers
         and tables (network analysis classes). This value does not need to
         match the units of the time cost attribute.Minutes-The time units will
         be minutes. This is the
         default.Seconds-The time units will be seconds.Hours-The time units
         will be hours.Days-The time units will be days.
     distance_units {String}:
         Specifies the distance units that will be used by the analysis layer's
         properties and the distance fields of the analysis layer's sublayers
         and tables (network analysis classes). This value does not need to
         match the units of the optional distance cost attribute.Miles-The
         distance units will be miles. This is the
         default.Kilometers-The distance units will be kilometers.Feet-The
         distance units will be feet.Yards-The distance units will be
         yards.Meters-The distance units will be meters.Inches-The distance
         units will be inches.Centimeters-The distance units will be
         centimeters.Millimeters-The distance units will be
         millimeters.Decimeters-The distance units will be
         decimeters.NauticalMiles-The distance units will be nautical miles.
         The Inches, Centimeters, Millimeters, and Decimeters options
         are not available when the network data source is a service.
     earliest_route_start_date {Date}:
         The default earliest start date for routes. This date is used
         for all routes for which thefield in the Routes sublayer is null. When
         no parameter value is specified, all rows in the Routes sublayer must
         specify a value in thefield.
         EarliestStartDateEarliestStartDateSpecify this parameter value using a
         datetime.date object. Although the other Network Analyst
         solvers allow you to use
         special dates to model a day of the week or the current date instead
         of a specific, static date, the last mile delivery solver does not.
         You must choose a specific date.
     earliest_route_start_time {Date}:
         The default earliest start time for routes. This time of day
         is used for all routes for which thefield in the Routes sublayer is
         null. When no parameter value is specified, all rows in the Routes
         sublayer must specify a value in thefield.
         EarliestStartTimeEarliestStartTimeSpecify this parameter value using a
         datetime.time object.
     max_route_total_time {Double}:
         The maximum allowed total time for each route. The value can be any
         positive number. The value is used for all routes for which
         thefield in the
         Routes sublayer is null. When no parameter value is specified, all
         rows in the Routes sublayer must specify a value in thefield.
         MaxTotalTimeMaxTotalTimeThe value is interpreted in the units
         specified in the time_units
         parameter.
     time_zone_for_time_fields {String}:
         Specifies the time zone that will be used for the input date-time
         fields supported by the tool.LOCAL_TIME_AT_LOCATIONS-The date-time
         values associated with the
         orders or depots will be in the time zone in which the orders and
         depots are located. For routes, the date-time values are based on the
         time zone in which the starting depot for the route is located. If a
         route does not have a starting depot, all orders and depots across all
         the routes must be in a single time zone. This is the default.UTC-The
         date-time values associated with the orders, depots, and
         routes will be in coordinated universal time (UTC) and are not based
         on the time zone in which the orders or depots are located.Specifying
         the date-time values in UTC is useful if you do not know
         the time zone in which the orders or depots are located or when you
         have orders and depots in multiple time zones and you want all the
         date-time values to start simultaneously.
     sequence_gap {Long}:
         The gap in numerical values to leave in thefield in the Orders
         sublayer between adjacent orders when the analysis is solved. The
         value acts as a multiplier for the actual sequence of orders on each
         route. For example, if the gap is 5, the first order on the route will
         have afield value of 5, the second order on the route will have afield
         value of 10, the third 15, and so on. This parameter helps support
         inserting orders after the initial route plan has been created because
         the new orders can be inserted into the sequence gaps.
         SequenceSequenceSequenceThe value must be a positive integer. The
         default is 1. The first time the analysis is solved, thefield
         values will be
         populated with sequential values using the designated sequence gap. On
         subsequent solves of the same analysis, thefield values of existing
         orders will be maintained, and new orders will be inserted into the
         gaps using available integer values for thefield that are not in use
         by other orders. If the sequence gap is set to 1, the sequence values
         will always be updated to contiguous values for every solve.
         SequenceSequenceSequence
     ignore_invalid_order_locations {Boolean}:
         Specifies whether invalid order locations will be ignored.SKIP-Invalid
         order locations will be ignored so that the analysis will
         succeed using only valid locations.HALT-Invalid order locations will
         not be ignored and will cause the
         analysis to fail. This is the default.
     line_shape {String}:
         Specifies the shape type that will be used for the route features that
         are output by the analysis.ALONG_NETWORK-The output routes will have
         the exact shape of the
         underlying network sources. The output includes route measurements for
         linear referencing. The measurements increase from the first stop and
         record the cumulative impedance to reach a given position.NO_LINES-No
         shape will be generated for the output routes.
         STRAIGHT_LINES-The output route shape will be a single
         straight line between the stops. This is the
         default.Regardless of the output shape type specified, the best route
         is
         always determined by the network impedance, not Euclidean distance.
         This means that only the route shapes are different, not the
         underlying traversal of the network.
     generate_directions_on_solve {Boolean}:
         Specifies whether directions will be generated when the analysis is
         solved.DIRECTIONS-Turn-by-turn directions will be generated on
         solve.NO_DIRECTIONS-Turn-by-turn directions will not be generated on
         solve.
         This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeLastMileDeliveryAnalysisLayer_na(
                *gp_fixargs(
                    (
                        network_data_source,
                        layer_name,
                        travel_mode,
                        time_units,
                        distance_units,
                        earliest_route_start_date,
                        earliest_route_start_time,
                        max_route_total_time,
                        time_zone_for_time_fields,
                        sequence_gap,
                        ignore_invalid_order_locations,
                        line_shape,
                        generate_directions_on_solve,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeLocationAllocationAnalysisLayer_na", None)
def MakeLocationAllocationAnalysisLayer(
    network_data_source=None,
    layer_name=None,
    travel_mode=None,
    travel_direction: Literal["TO_FACILITIES", "FROM_FACILITIES"] | None = None,
    problem_type: Literal[
        "MINIMIZE_IMPEDANCE",
        "MAXIMIZE_COVERAGE",
        "MAXIMIZE_CAPACITATED_COVERAGE",
        "MINIMIZE_FACILITIES",
        "MAXIMIZE_ATTENDANCE",
        "MAXIMIZE_MARKET_SHARE",
        "TARGET_MARKET_SHARE",
    ]
    | None = None,
    cutoff=None,
    number_of_facilities_to_find=None,
    decay_function_type: Literal["LINEAR", "POWER", "EXPONENTIAL"] | None = None,
    decay_function_parameter_value=None,
    target_market_share=None,
    capacity=None,
    time_of_day=None,
    time_zone: Literal["UTC", "LOCAL_TIME_AT_LOCATIONS"] | None = None,
    line_shape: Literal["NO_LINES", "STRAIGHT_LINES"] | None = None,
    accumulate_attributes=None,
    ignore_invalid_locations: Literal["SKIP", "HALT"] | None = None,
) -> Result1[str | Layer]:
    """MakeLocationAllocationAnalysisLayer_na(network_data_source, {layer_name}, {travel_mode}, {travel_direction}, {problem_type}, {cutoff}, {number_of_facilities_to_find}, {decay_function_type}, {decay_function_parameter_value}, {target_market_share}, {capacity}, {time_of_day}, {time_zone}, {line_shape}, {accumulate_attributes;accumulate_attributes...}, {ignore_invalid_locations})

       Makes a location-allocation network analysis layer and sets its
       analysis properties. A location-allocation analysis layer is useful
       for choosing a given number of facilities from a set of potential
       locations so that a demand will be allocated to facilities in an
       optimal and efficient manner. The layer can be created using a local
       network dataset or a service hosted online or in a portal.

    INPUTS:
     network_data_source (Network Dataset Layer / String):
         The network dataset or service on which the network analysis will be
         performed. Use the portal URL for a service.
     layer_name {String}:
         The name of the network analysis layer that will be created.
     travel_mode {String}:
         The name of the travel mode that will be used in the analysis. The
         travel mode represents a collection of network settings, such as
         travel restrictions and U-turn policies, that determine how a
         pedestrian, car, truck, or other medium of transportation moves
         through the network. Travel modes are defined on your network data
         source.An arcpy.na.TravelMode object and a string containing the valid
         JSON
         representation of a travel mode can also be used as input to this
         parameter.
     travel_direction {String}:
         Specifies the direction of travel between facilities and demand points
         when calculating the network costs.FROM_FACILITIES-Direction of travel
         is from facilities to demand
         points. This is the default. Fire departments commonly use this
         setting, since they are concerned with the time it takes to travel
         from the fire station to the location of the
         emergency.TO_FACILITIES-Direction of travel is from demand points to
         facilities.
         Retail stores commonly use this setting, since they are concerned with
         the time it takes the shoppers to reach the store.The direction of
         travel may affect the allocation of the demand points
         to the facilities on a network with one-way restrictions and different
         impedances based on direction of travel. For instance, it may take 15
         minutes to drive from the demand point to the facility but only 10
         minutes when driving from the facility to the demand point.
     problem_type {String}:
         The problem type that will be solved. The choice of the problem type
         depends on the kind of facility being located. Different kinds of
         facilities have different priorities and
         constraints.MINIMIZE_IMPEDANCE-This option solves the warehouse
         location problem.
         It selects a set of facilities so that the total sum of weighted
         impedances (demand at a location times the impedance to the closest
         facility) is minimized. This problem type is often known as the
         P-Median problem. This is the default problem
         type.MAXIMIZE_COVERAGE-This option solves the fire station location
         problem. It selects facilities so that all or the greatest amount of
         demand is within a specified impedance
         cutoff.MAXIMIZE_CAPACITATED_COVERAGE-This option solves the location
         problem
         in which facilities have a finite capacity. It selects facilities so
         that all or the greatest amount of demand can be served without
         exceeding the capacity of any facility. In addition to honoring
         capacity, it selects facilities so that the total sum of weighted
         impedance (demand allocated to a facility multiplied by the impedance
         to or from the facility) is minimized.MINIMIZE_FACILITIES-This option
         solves the fire station location
         problem. It selects the minimum number of facilities needed to cover
         all or the greatest amount of demand within a specified impedance
         cutoff.MAXIMIZE_ATTENDANCE-This option solves the neighborhood store
         location
         problem in which the proportion of demand allocated to the nearest
         chosen facility falls with increasing distance. The set of facilities
         that maximize the total allocated demand is selected. Demand greater
         than the specified impedance cutoff does not affect the selected set
         of facilities.MAXIMIZE_MARKET_SHARE-This option solves the competitive
         facility
         location problem. It selects facilities to maximize market share in
         the presence of competitive facilities. Gravity model concepts are
         used to determine the proportion of demand allocated to each facility.
         The set of facilities that maximizes the total allocated demand is
         selected.TARGET_MARKET_SHARE-This option solves the competitive
         facility
         location problem. It selects facilities to reach a specified target
         market share in the presence of competitive facilities. Gravity model
         concepts are used to determine the proportion of demand allocated to
         each facility. The minimum number of facilities needed to reach the
         specified target market share is selected.
     cutoff {Double}:
         The maximum impedance at which a demand point can be allocated
         to a facility in the units of the impedance attribute used by the
         specifiedvalue. The maximum impedance is measured by the least-cost
         path along the network. If a demand point is outside the cutoff, it is
         left unallocated. This parameter can be used to model the maximum
         distance that people are willing to travel to visit stores or the
         maximum time that is permitted for a fire department to reach anyone
         in the community. Travel ModeThis cutoff value can be
         overridden on a per-demand-point basis by
         specifying individual cutoff values in the demand points sublayer in
         the Cutoff_[Impedance] property. For example, it may show that people
         in rural areas are willing to travel up to 10 miles to reach a
         facility, while people in the city are only willing to travel up to 2
         miles. You can model this behavior by setting the cutoff value of the
         analysis layer to 10 and setting the Cutoff_Miles value of each demand
         point in urban areas to 2.By default, no cutoff value is used for the
         analysis.
     number_of_facilities_to_find {Long}:
         The number of facilities that the solver will locate. The default
         value is 1. The facilities with a FacilityType value ofare
         always part of
         the solution when there are more facilities to find than required
         facilities; any excess facilities to choose are picked from candidate
         facilities. Required        Any facilities that have a
         FacilityType value ofbefore solving
         are treated as candidate facilities at solve time. ChosenThis
         parameter value is not considered for the MINIMIZE_FACILITIES
         problem type since the solver searches for the minimum number of
         facilities to locate to maximize coverage.This parameter value is
         overridden for the TARGET_MARKET_SHARE problem
         type because the solver searches for the minimum number of facilities
         required to capture the specified market share.
     decay_function_type {String}:
         The equation that will be used for transforming the network
         cost between facilities and demand points. This parameter, along with
         theparameter, specifies how severely the network impedance between
         facilities and demand points influences the solver's selection of
         facilities. Decay Function Parameter ValueLINEAR-The
         transformed network impedance between the facility and the
         demand point is the same as the shortest-path network impedance
         between them. With this option, the impedance parameter is always set
         to 1. This is the default.POWER-The transformed network impedance
         between the facility and the
         demand point is equal to the shortest-path network impedance raised to
         the power specified by the impedance parameter. Use this option with a
         positive impedance parameter to specify higher weight to nearby
         facilities. EXPONENTIAL-The transformed network impedance
         between the
         facility and the demand point is equal to the mathematical constant e
         raised to the power specified by the shortest-path network impedance
         multiplied with the impedance parameter. Use this option with a
         positive impedance parameter to specify a very high weight to nearby
         facilities. Exponential transformations are commonly used in
         conjunction with an
         impedance cutoff. Demand points have an ImpedanceTransformation
         property, which,
         if set, overrides theparameter of the analysis layer on a per-demand-
         point basis. You may determine that the decay function should be
         different for urban and rural residents. You can model this by setting
         the impedance transformation for the analysis layer to match that of
         rural residents and setting the impedance transformation for the
         individual demand points located in urban areas to match that of
         urbanites. Decay Function Parameter Value
     decay_function_parameter_value {Double}:
         A parameter value for the equations specified in the
         decay_function_type parameter. This parameter value is ignored when
         the decay_function_type parameter is set to LINEAR. For the POWER and
         EXPONENTIAL options, the value should not be zero.Demand points have
         an ImpedanceTransformation property, which, if set,
         overrides the decay_function_parameter_value parameter of the analysis
         layer on a per-demand-point basis. You may determine that the decay
         function should be different for urban and rural residents. You can
         model this by setting the impedance transformation for the analysis
         layer to match that of rural residents and setting the impedance
         transformation for the individual demand points located in urban areas
         to match that of urbanites.
     target_market_share {Double}:
         The target market share, as a percentage, to solve for when the
         problem_type parameter is set to TARGET_MARKET_SHARE. It is the
         percentage of the total demand weight that you want the solution
         facilities to capture. The solver selects the minimum number of
         facilities required to capture the target market share specified by
         this numeric value.
     capacity {Double}:
         The default capacity of facilities when the problem_type parameter is
         set to MAXIMIZE_CAPACITATED_COVERAGE. This parameter is ignored for
         all other problem types.Facilities have a Capacity property, which, if
         set to a nonnull value,
         overrides the capacity parameter value for that facility.
     time_of_day {Date}:
         The time and date of departure. The departure time can be from
         facilities or demand points, depending on whether travel_direction is
         set to TO_FACILITIES or FROM_FACILITIES.If you chose a traffic-based
         impedance attribute, the solution will be
         generated given dynamic traffic conditions at the time of day
         specified here. A date and time can be specified as 5/14/2012 10:30
         AM. Configure the analysis to use one of the following special
         dates to model a day of the week or the current date instead of a
         specific, static date:
         Today-12/30/1899Sunday-12/31/1899Monday-1/1/1900Tuesday-1/2/1900Wednes
         day-1/3/1900Thursday-1/4/1900Friday-1/5/1900Saturday-1/6/1900
     time_zone {String}:
         The time zone of theparameter. Time of
         DayLOCAL_TIME_AT_LOCATIONS-The time of day parameter refers to the
         time
         zone in which the facilities or demand points are located. If the
         travel direction is facilities to demand points, this is the time zone
         of the facilities. If the travel direction is demand points to
         facilities, this is the time zone of the demand points. This is the
         default.UTC-The time of day parameter refers to coordinated universal
         time
         (UTC). Choose this option if you want the best location for a specific
         time, such as now, but aren't certain in which time zone the
         facilities or demand points will be located.
     line_shape {String}:
         Specifies the output line shape.NO_LINES-No shape will be generated
         for the output of the analysis.
         This is useful if you are solving a very large problem and are
         interested only in a solution table and are not interested in
         visualizing the results on a map.STRAIGHT_LINES-The output line shapes
         will be straight lines
         connecting the solution facilities to their allocated demand points.
         This is the default.Regardless of the output shape type specified, the
         best route is
         always determined by the network impedance, not Euclidean distance.
         This means that only the route shapes are different, not the
         underlying traversal of the network.
     accumulate_attributes {String}:
         A list of cost attributes to be accumulated during analysis. These
         accumulated attributes are for reference only; the solver only uses
         the cost attribute used by the designated travel mode when solving the
         analysis.For each cost attribute that is accumulated, a
         Total_[Impedance]
         property is populated in the network analysis output features.This
         parameter is not available if the network data source is an
         ArcGIS Online service or the network data source is a service on a
         version of Portal for ArcGIS that does not support accumulation.
     ignore_invalid_locations {Boolean}:
         Specifies whether invalid input locations will be ignored. Typically,
         locations are invalid if they cannot be located on the network. When
         invalid locations are ignored, the solver will skip them and attempt
         to perform the analysis using the remaining locations.SKIP-Invalid
         input locations will be ignored and only valid locations
         will be used. This is the default.HALT-All input locations will be
         used. Invalid locations will cause
         the analysis to fail."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeLocationAllocationAnalysisLayer_na(
                *gp_fixargs(
                    (
                        network_data_source,
                        layer_name,
                        travel_mode,
                        travel_direction,
                        problem_type,
                        cutoff,
                        number_of_facilities_to_find,
                        decay_function_type,
                        decay_function_parameter_value,
                        target_market_share,
                        capacity,
                        time_of_day,
                        time_zone,
                        line_shape,
                        accumulate_attributes,
                        ignore_invalid_locations,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeLocationAllocationLayer_na", None)
def MakeLocationAllocationLayer(
    in_network_dataset=None,
    out_network_analysis_layer=None,
    impedance_attribute=None,
    loc_alloc_from_to: Literal["DEMAND_TO_FACILITY", "FACILITY_TO_DEMAND"] | None = None,
    loc_alloc_problem_type: Literal[
        "MINIMIZE_IMPEDANCE",
        "MAXIMIZE_COVERAGE",
        "MAXIMIZE_CAPACITATED_COVERAGE",
        "MINIMIZE_FACILITIES",
        "MAXIMIZE_ATTENDANCE",
        "MAXIMIZE_MARKET_SHARE",
        "TARGET_MARKET_SHARE",
    ]
    | None = None,
    number_facilities_to_find=None,
    impedance_cutoff=None,
    impedance_transformation: Literal["LINEAR", "POWER", "EXPONENTIAL"] | None = None,
    impedance_parameter=None,
    target_market_share=None,
    accumulate_attribute_name=None,
    UTurn_policy: Literal["ALLOW_UTURNS", "NO_UTURNS", "ALLOW_DEAD_ENDS_ONLY", "ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY"]
    | None = None,
    restriction_attribute_name=None,
    hierarchy: Literal["USE_HIERARCHY", "NO_HIERARCHY"] | None = None,
    output_path_shape: Literal["NO_LINES", "STRAIGHT_LINES"] | None = None,
    default_capacity=None,
    time_of_day=None,
) -> Result1[str | Layer]:
    """MakeLocationAllocationLayer_na(in_network_dataset, out_network_analysis_layer, impedance_attribute, {loc_alloc_from_to}, {loc_alloc_problem_type}, {number_facilities_to_find}, {impedance_cutoff}, {impedance_transformation}, {impedance_parameter}, {target_market_share}, {accumulate_attribute_name;accumulate_attribute_name...}, {UTurn_policy}, {restriction_attribute_name;restriction_attribute_name...}, {hierarchy}, {output_path_shape}, {default_capacity}, {time_of_day})

       Makes a location-allocation network analysis layer and sets its
       analysis properties. A location-allocation analysis layer is useful
       for choosing a given number of facilities from a set of potential
       locations such that a demand will be allocated to facilities in an
       optimal and efficient manner.

    INPUTS:
     in_network_dataset (Network Dataset Layer):
         The network dataset on which the location-allocation analysis will be
         performed.
     out_network_analysis_layer (String):
         Name of the location-allocation network analysis layer to create.
     impedance_attribute (String):
         The cost attribute that will be used as impedance in the analysis.
     loc_alloc_from_to {String}:
         Specifies the direction of travel between facilities and demand points
         when calculating the network costs.FACILITY_TO_DEMAND-Direction of
         travel is from facilities to demand
         points. Fire departments commonly use the this setting, since they are
         concerned with the time it takes to travel from the fire station to
         the location of the emergency.DEMAND_TO_FACILITY-Direction of travel
         is from demand points to
         facilities. Retail stores commonly use this setting, since they are
         concerned with the time it takes the shoppers to reach the store.Using
         this option can affect the allocation of the demand points to
         the facilities on a network with one-way restrictions and different
         impedances based on direction of travel. For instance, a facility may
         be a 15-minute drive from the demand point to the facility, but only a
         10-minute trip when traveling from the facility to the demand point.
     loc_alloc_problem_type {String}:
         The problem type that will be solved. The choice of the problem type
         depends on the kind of facility being located. Different kinds of
         facilities have different priorities and
         constraints.MINIMIZE_IMPEDANCE-This option solves the warehouse
         location problem.
         It selects a set of facilities such that the total sum of weighted
         impedances (demand at a location times the impedance to the closest
         facility) is minimized. This problem type is often known as the
         P-Median problem.MAXIMIZE_COVERAGE-This option solves the fire station
         location
         problem. It chooses facilities such that all or the greatest amount of
         demand is within a specified impedance
         cutoff.MAXIMIZE_CAPACITATED_COVERAGE-This option solves the location
         problem
         where facilities have a finite capacity. It chooses facilities such
         that all or the greatest amount of demand can be served without
         exceeding the capacity of any facility. In addition to honoring
         capacity, it selects facilities such that the total sum of weighted
         impedance (demand allocated to a facility multiplied by the impedance
         to or from the facility) is minimized.MINIMIZE_FACILITIES-This option
         solves the fire station location
         problem. It chooses the minimum number of facilities needed to cover
         all or the greatest amount of demand within a specified impedance
         cutoff.MAXIMIZE_ATTENDANCE-This option solves the neighborhood store
         location
         problem where the proportion of demand allocated to the nearest chosen
         facility falls with increasing distance. The set of facilities that
         maximize the total allocated demand is chosen. Demand further than the
         specified impedance cutoff does not affect the chosen set of
         facilities.MAXIMIZE_MARKET_SHARE-This option solves the competitive
         facility
         location problem. It chooses facilities to maximize market share in
         the presence of competitive facilities. Gravity model concepts are
         used to determine the proportion of demand allocated to each facility.
         The set of facilities that maximizes the total allocated demand is
         chosen.TARGET_MARKET_SHARE-This option solves the competitive facility
         location problem. It chooses facilities to reach a specified target
         market share in the presence of competitive facilities. Gravity model
         concepts are used to determine the proportion of demand allocated to
         each facility. The minimum number of facilities needed to reach the
         specified target market share is chosen.
     number_facilities_to_find {Long}:
         Specifies the number of facilities that the solver should locate.
         The facilities with a FacilityType value ofare always part of
         the solution when there are more facilities to find than required
         facilities; any excess facilities to choose are picked from candidate
         facilities. Required        Any facilities that have a
         FacilityType value ofbefore solving
         are treated as candidate facilities at solve time. ChosenThe
         parameter value is not considered for the MINIMIZE_FACILITIES
         problem type since the solver determines the minimum number of
         facilities to locate to maximize coverage.The parameter value is
         overridden for the TARGET_MARKET_SHARE problem
         type because the solver searches for the minimum number of facilities
         required to capture the specified market share.
     impedance_cutoff {Double}:
         specifies the maximum impedance at which a demand point can be
         allocated to a facility. The maximum impedance is measured by the
         least-cost path along the network. If a demand point is outside the
         cutoff, it is left unallocated. This property might be used to model
         the maximum distance that people are willing to travel to visit your
         stores or the maximum time that is permitted for a fire department to
         reach anyone in the community. Impedance Cutoff        Demand
         points have a Cutoff_[Impedance] property, which, if
         set, overrides theproperty of the analysis layer. You might find that
         people in rural areas are willing to travel up to 10 miles to reach a
         facility, while urbanites are only willing to travel up to 2 miles.
         You can model this behavior by setting the impedance cutoff value of
         the analysis layer to 10 and setting the Cutoff_Miles value of the
         demand points in urban areas to 2. Impedance Cutoff
     impedance_transformation {String}:
         This sets the equation for transforming the network cost
         between facilities and demand points. This property, coupled with the,
         specifies how severely the network impedance between facilities and
         demand points influences the solver's choice of facilities.
         Impedance ParameterLINEAR-The transformed network impedance between
         the facility and the
         demand point is the same as the shortest-path network impedance
         between them. With this option, the impedance parameter is always set
         to one. This is the default.POWER-The transformed network impedance
         between the facility and the
         demand point is equal to the shortest-path network impedance raised to
         the power specified by the impedance parameter. Use this option with a
         positive impedance parameter to specify higher weight to nearby
         facilities. EXPONENTIAL-The transformed network impedance
         between the
         facility and the demand point is equal to the mathematical constant e
         raised to the power specified by the shortest-path network impedance
         multiplied with the impedance parameter. Use this option with a
         positive impedance parameter to specify a very high weight to nearby
         facilities. Exponential transformations are commonly used in
         conjunction with an
         impedance cutoff.Demand points have an ImpedanceTransformation
         property, which, if set,
         overrides the Impedance Transformation property of the analysis layer.
         You might determine the impedance transformation should be different
         for urban and rural residents. You can model this by setting the
         impedance transformation for the analysis layer to match that of rural
         residents and setting the impedance transformation for the demand
         points in urban areas to match that of urbanites.
     impedance_parameter {Double}:
         Provides a parameter value to the equations specified in the Impedance
         transformation parameter. The parameter value is ignored when the
         impedance transformation is of type LINEAR. For POWER and EXPONENTIAL
         impedance transformations, the value should be nonzero. Demand
         points have an ImpedanceParameter property, which, if
         set, overrides theproperty of the analysis layer. You might determine
         that the impedance parameter should be different for urban and rural
         residents. You can model this by setting the impedance transformation
         for the analysis layer to match that of rural residents and setting
         the impedance transformation for the demand points in urban areas to
         match that of urbanites. Impedance Parameter
     target_market_share {Double}:
         Specifies the target market share in percentage to solve for when the
         Location-Allocation Problem Type parameter is set to
         TARGET_MARKET_SHARE . It is the percentage of the total demand weight
         that you want your solution facilities to capture. The solver chooses
         the minimum number of facilities required to capture the target market
         share specified by this numeric value.
     accumulate_attribute_name {String}:
         A list of cost attributes to be accumulated during analysis.
         These accumulation attributes are for reference only; the solver only
         uses the cost attribute specified by theparameter to calculate the
         route. Impedance AttributeFor each cost attribute that is
         accumulated, a Total_[Impedance]
         property is added to the routes that are output by the solver.
     UTurn_policy {String}:
         Specifies the U-turn policy that will be used at junctions. Allowing
         U-turns implies that the solver can turn around at a junction and
         double back on the same street. Given that junctions represent street
         intersections and dead ends, different vehicles may be able to turn
         around at some junctions but not at others-it depends on whether the
         junction represents an intersection or a dead end. To accommodate
         this, the U-turn policy parameter is implicitly specified by the
         number of edges that connect to the junction, which is known as
         junction valency. The acceptable values for this parameter are listed
         below; each is followed by a description of its meaning in terms of
         junction valency.ALLOW_UTURNS-U-turns are permitted at junctions with
         any number of
         connected edges. This is the default value.NO_UTURNS-U-turns are
         prohibited at all junctions, regardless of
         junction valency. However, U-turns are still permitted at network
         locations even when this option is specified, but you can set the
         individual network location's CurbApproach property to prohibit
         U-turns there as well.ALLOW_DEAD_ENDS_ONLY-U-turns are prohibited at
         all junctions, except
         those that have only one adjacent edge (a dead
         end).ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY-U-turns are prohibited at
         junctions where exactly two adjacent edges meet but are permitted at
         intersections (junctions with three or more adjacent edges) and dead
         ends (junctions with exactly one adjacent edge). Often, networks have
         extraneous junctions in the middle of road segments. This option
         prevents vehicles from making U-turns at these locations.If you need a
         more precisely defined U-turn policy, consider adding a
         global turn delay evaluator to a network cost attribute or adjusting
         its settings if one exists, and pay particular attention to the
         configuration of reverse turns. You can also set the CurbApproach
         property of your network locations.
     restriction_attribute_name {String}:
         A list of restriction attributes that will be applied during the
         analysis.
     hierarchy {Boolean}:
         USE_HIERARCHY-The hierarchy attribute will be used for the analysis.
         Using a hierarchy results in the solver preferring higher-order edges
         to lower-order edges. Hierarchical solves are faster, and they can be
         used to simulate the preference of a driver who chooses to travel on
         freeways rather than local roads when possible-even if that means a
         longer trip. This option is valid only if the input network dataset
         has a hierarchy attribute.NO_HIERARCHY-The hierarchy attribute will
         not be used for the
         analysis, and the result will be an exact route for the network
         dataset.The parameter is not used if no hierarchy attribute is defined
         on the
         network dataset used to perform the analysis.
     output_path_shape {String}:
         NO_LINES-No shape will be generated for the output of the
         analysis.STRAIGHT_LINES-The output line shapes will be straight lines
         connecting the solution facilities to their allocated demand points.
     default_capacity {Double}:
         Specifies the default capacity of facilities when the
         loc_alloc_problem_type parameter is set to
         MAXIMIZE_CAPACITATED_COVERAGE. This parameter is ignored for all other
         problem types.Facilities have a Capacity property, which, if set to a
         nonnull value,
         overrides the default_capacity parameter for that facility.
     time_of_day {Date}:
         Indicates the time and date of departure. The departure time can be
         from facilities or demand points, depending on whether travel is from
         demand to facility or facility to demand.If you have chosen a traffic-
         based impedance attribute, the solution
         will be generated given dynamic traffic conditions at the time of day
         specified here. A date and time can be specified as 5/14/2012 10:30
         AM. Instead of using a particular date, a day of the week can
         be
         specified using the following dates.For example, to specify that
         travel should begin at 5:00 PM on Tuesday, specify the parameter value
         as 1/2/1900 5:00 PM.
         Today-12/30/1899Sunday-12/31/1899Monday-1/1/1900Tuesday-1/2/1900Wednes
         day-1/3/1900Thursday-1/4/1900Friday-1/5/1900Saturday-1/6/1900"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeLocationAllocationLayer_na(
                *gp_fixargs(
                    (
                        in_network_dataset,
                        out_network_analysis_layer,
                        impedance_attribute,
                        loc_alloc_from_to,
                        loc_alloc_problem_type,
                        number_facilities_to_find,
                        impedance_cutoff,
                        impedance_transformation,
                        impedance_parameter,
                        target_market_share,
                        accumulate_attribute_name,
                        UTurn_policy,
                        restriction_attribute_name,
                        hierarchy,
                        output_path_shape,
                        default_capacity,
                        time_of_day,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeODCostMatrixAnalysisLayer_na", None)
def MakeODCostMatrixAnalysisLayer(
    network_data_source=None,
    layer_name=None,
    travel_mode=None,
    cutoff=None,
    number_of_destinations_to_find=None,
    time_of_day=None,
    time_zone: Literal["UTC", "LOCAL_TIME_AT_LOCATIONS"] | None = None,
    line_shape: Literal["NO_LINES", "STRAIGHT_LINES"] | None = None,
    accumulate_attributes=None,
    ignore_invalid_locations: Literal["SKIP", "HALT"] | None = None,
) -> Result1[str | Layer]:
    """MakeODCostMatrixAnalysisLayer_na(network_data_source, {layer_name}, {travel_mode}, {cutoff}, {number_of_destinations_to_find}, {time_of_day}, {time_zone}, {line_shape}, {accumulate_attributes;accumulate_attributes...}, {ignore_invalid_locations})

       Makes an origin destination (OD) cost matrix network analysis layer
       and sets its analysis properties. An OD cost matrix analysis layer is
       useful for representing a matrix of costs going from a set of origin
       locations to a set of destination locations. The layer can be created
       using a local network dataset or a service hosted online or in a
       portal.

    INPUTS:
     network_data_source (Network Dataset Layer / String):
         The network dataset or service on which the network analysis will be
         performed. Use the portal URL for a service.
     layer_name {String}:
         The name of the network analysis layer that will be created.
     travel_mode {String}:
         The name of the travel mode that will be used in the analysis. The
         travel mode represents a collection of network settings, such as
         travel restrictions and U-turn policies, that determine how a
         pedestrian, car, truck, or other medium of transportation moves
         through the network. Travel modes are defined on your network data
         source.An arcpy.na.TravelMode object and a string containing the valid
         JSON
         representation of a travel mode can also be used as input to this
         parameter.
     cutoff {Double}:
         The impedance value at which to stop searching for destinations for a
         given origin. This value will be in the units of the impedance
         attribute used by the chosen travel mode. No destinations beyond this
         limit will be found. This cutoff value can be overridden on a per-
         origin basis by specifying individual cutoff values in the origins
         sublayer. By default, no cutoff is used for the analysis.
     number_of_destinations_to_find {Long}:
         The number of destinations to find per origin. The default can be
         overridden by specifying an individual value for the
         TargetDestinationCount property in the origins sublayer. By default,
         no limit is used, and all destinations are found.
     time_of_day {Date}:
         The departure time from origins.If you chose a traffic-based impedance
         attribute, the solution will be
         generated given dynamic traffic conditions at the time of day
         specified here. A date and time can be specified as 5/14/2012 10:30
         AM. Configure the analysis to use one of the following special
         dates to model a day of the week or the current date instead of a
         specific, static date:
         Today-12/30/1899Sunday-12/31/1899Monday-1/1/1900Tuesday-1/2/1900Wednes
         day-1/3/1900Thursday-1/4/1900Friday-1/5/1900Saturday-1/6/1900
     time_zone {String}:
         The time zone of theparameter. Time of Day
         LOCAL_TIME_AT_LOCATIONS-Theparameter refers to the time zone
         in which the origins are located. This is the default. Time of
         Day         UTC-Theparameter refers to coordinated universal time
         (UTC).
         Choose this option if you want to calculate the OD cost matrix for a
         specific time, such as now, but aren't certain in which time zone the
         origins will be located. Time of Day
     line_shape {String}:
         Specifies the output line shape.NO_LINES-No shape will be generated
         for the output origin-destination
         route pair. This is useful when you have a large number of origins and
         destinations and are interested only in the impedance costs in the OD
         cost matrix table, not in visualizing the OD cost matrix on a
         map.STRAIGHT_LINES-The output route shape will be a single straight
         line
         between each of the origin-destination pairs. This is the
         default.Regardless of the output shape type specified, the best route
         is
         always determined by the network impedance, not Euclidean distance.
         This means that only the route shapes are different, not the
         underlying traversal of the network.
     accumulate_attributes {String}:
         A list of cost attributes to be accumulated during analysis. These
         accumulated attributes are for reference only; the solver only uses
         the cost attribute used by the designated travel mode when solving the
         analysis.For each cost attribute that is accumulated, a
         Total_[Impedance]
         property is populated in the network analysis output features.This
         parameter is not available if the network data source is an
         ArcGIS Online service or the network data source is a service on a
         version of Portal for ArcGIS that does not support accumulation.
     ignore_invalid_locations {Boolean}:
         Specifies whether invalid input locations will be ignored. Typically,
         locations are invalid if they cannot be located on the network. When
         invalid locations are ignored, the solver will skip them and attempt
         to perform the analysis using the remaining locations.SKIP-Invalid
         input locations will be ignored and only valid locations
         will be used. This is the default.HALT-All input locations will be
         used. Invalid locations will cause
         the analysis to fail."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeODCostMatrixAnalysisLayer_na(
                *gp_fixargs(
                    (
                        network_data_source,
                        layer_name,
                        travel_mode,
                        cutoff,
                        number_of_destinations_to_find,
                        time_of_day,
                        time_zone,
                        line_shape,
                        accumulate_attributes,
                        ignore_invalid_locations,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeODCostMatrixLayer_na", None)
def MakeODCostMatrixLayer(
    in_network_dataset=None,
    out_network_analysis_layer=None,
    impedance_attribute=None,
    default_cutoff=None,
    default_number_destinations_to_find=None,
    accumulate_attribute_name=None,
    UTurn_policy: Literal["ALLOW_UTURNS", "NO_UTURNS", "ALLOW_DEAD_ENDS_ONLY", "ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY"]
    | None = None,
    restriction_attribute_name=None,
    hierarchy: Literal["USE_HIERARCHY", "NO_HIERARCHY"] | None = None,
    hierarchy_settings=None,
    output_path_shape: Literal["NO_LINES", "STRAIGHT_LINES"] | None = None,
    time_of_day=None,
) -> Result1[str | Layer]:
    """MakeODCostMatrixLayer_na(in_network_dataset, out_network_analysis_layer, impedance_attribute, {default_cutoff}, {default_number_destinations_to_find}, {accumulate_attribute_name;accumulate_attribute_name...}, {UTurn_policy}, {restriction_attribute_name;restriction_attribute_name...}, {hierarchy}, {hierarchy_settings}, {output_path_shape}, {time_of_day})

       Makes an origin-destination (OD) cost matrix network analysis layer
       and sets its analysis properties. An OD cost matrix analysis layer is
       useful for representing a matrix of costs going from a set of origin
       locations to a set of destination locations.

    INPUTS:
     in_network_dataset (Network Dataset Layer):
         The network dataset on which the OD cost matrix analysis will be
         performed.
     out_network_analysis_layer (String):
         Name of the OD cost matrix network analysis layer to create.
     impedance_attribute (String):
         The cost attribute that will be used as impedance in the analysis.
     default_cutoff {Double}:
         Default impedance value at which to cut off searching for destinations
         for a given origin. If the accumulated impedance becomes higher than
         the cutoff value, the traversal stops. The default can be overridden
         by specifying the cutoff value on the origins.
     default_number_destinations_to_find {Long}:
         Default number of destinations to find for each origin. The default
         can be overridden by specifying a value for the TargetDestinationCount
         property on the origins.
     accumulate_attribute_name {String}:
         A list of cost attributes to be accumulated during analysis.
         These accumulation attributes are for reference only; the solver only
         uses the cost attribute specified by theparameter to calculate the
         route. Impedance AttributeFor each cost attribute that is
         accumulated, a Total_[Impedance]
         property is added to the routes that are output by the solver.
     UTurn_policy {String}:
         Specifies the U-turn policy that will be used at junctions. Allowing
         U-turns implies that the solver can turn around at a junction and
         double back on the same street. Given that junctions represent street
         intersections and dead ends, different vehicles may be able to turn
         around at some junctions but not at others-it depends on whether the
         junction represents an intersection or a dead end. To accommodate
         this, the U-turn policy parameter is implicitly specified by the
         number of edges that connect to the junction, which is known as
         junction valency. The acceptable values for this parameter are listed
         below; each is followed by a description of its meaning in terms of
         junction valency.ALLOW_UTURNS-U-turns are permitted at junctions with
         any number of
         connected edges. This is the default value.NO_UTURNS-U-turns are
         prohibited at all junctions, regardless of
         junction valency. However, U-turns are still permitted at network
         locations even when this option is specified, but you can set the
         individual network location's CurbApproach property to prohibit
         U-turns there as well.ALLOW_DEAD_ENDS_ONLY-U-turns are prohibited at
         all junctions, except
         those that have only one adjacent edge (a dead
         end).ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY-U-turns are prohibited at
         junctions where exactly two adjacent edges meet but are permitted at
         intersections (junctions with three or more adjacent edges) and dead
         ends (junctions with exactly one adjacent edge). Often, networks have
         extraneous junctions in the middle of road segments. This option
         prevents vehicles from making U-turns at these locations.If you need a
         more precisely defined U-turn policy, consider adding a
         global turn delay evaluator to a network cost attribute or adjusting
         its settings if one exists, and pay particular attention to the
         configuration of reverse turns. You can also set the CurbApproach
         property of your network locations.
     restriction_attribute_name {String}:
         A list of restriction attributes that will be applied during the
         analysis.
     hierarchy {Boolean}:
         USE_HIERARCHY-The hierarchy attribute will be used for the analysis.
         Using a hierarchy results in the solver preferring higher-order edges
         to lower-order edges. Hierarchical solves are faster, and they can be
         used to simulate the preference of a driver who chooses to travel on
         freeways rather than local roads when possible-even if that means a
         longer trip. This option is valid only if the input network dataset
         has a hierarchy attribute.NO_HIERARCHY-The hierarchy attribute will
         not be used for the
         analysis, and the result will be an exact route for the network
         dataset.The parameter is not used if no hierarchy attribute is defined
         on the
         network dataset used to perform the analysis.
     hierarchy_settings {Network Analyst Hierarchy Settings}:
         Prior to version 10, this parameter allowed you to change the
         hierarchy ranges for the analysis from the default hierarchy ranges
         established in the network dataset. At version 10, this parameter is
         no longer supported and should be specified as an empty string. To
         change the hierarchy ranges for the analysis, update the default
         hierarchy ranges in the network dataset.
     output_path_shape {String}:
         NO_LINES-No shape will be generated for the output routes. This is
         useful when you have a large number of origins and destinations and
         are interested only in the OD cost matrix table (and not the output
         line shapes).STRAIGHT_LINES-The output route shape will be a single
         straight line
         between each of the origin-destination pairs.Regardless of the output
         shape type specified, the best route is
         always determined by the network impedance, not Euclidean distance.
         This means that only the route shapes are different, not the
         underlying traversal of the network.
     time_of_day {Date}:
         Indicates the departure time from origins.If you have chosen a
         traffic-based impedance attribute, the solution
         will be generated given dynamic traffic conditions at the time of day
         specified here. A date and time can be specified as 5/14/2012 10:30
         AM. Instead of using a particular date, a day of the week can
         be
         specified using the following dates.For example, to specify that
         travel should begin at 5:00 PM on Tuesday, specify the parameter value
         as 1/2/1900 5:00 PM.
         Today-12/30/1899Sunday-12/31/1899Monday-1/1/1900Tuesday-1/2/1900Wednes
         day-1/3/1900Thursday-1/4/1900Friday-1/5/1900Saturday-1/6/1900"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeODCostMatrixLayer_na(
                *gp_fixargs(
                    (
                        in_network_dataset,
                        out_network_analysis_layer,
                        impedance_attribute,
                        default_cutoff,
                        default_number_destinations_to_find,
                        accumulate_attribute_name,
                        UTurn_policy,
                        restriction_attribute_name,
                        hierarchy,
                        hierarchy_settings,
                        output_path_shape,
                        time_of_day,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeRouteAnalysisLayer_na", None)
def MakeRouteAnalysisLayer(
    network_data_source=None,
    layer_name=None,
    travel_mode=None,
    sequence: Literal["USE_CURRENT_ORDER", "FIND_BEST_ORDER", "PRESERVE_BOTH", "PRESERVE_FIRST", "PRESERVE_LAST"]
    | None = None,
    time_of_day=None,
    time_zone: Literal["UTC", "LOCAL_TIME_AT_LOCATIONS"] | None = None,
    line_shape: Literal["NO_LINES", "STRAIGHT_LINES", "ALONG_NETWORK"] | None = None,
    accumulate_attributes=None,
    generate_directions_on_solve: Literal["DIRECTIONS", "NO_DIRECTIONS"] | None = None,
    time_zone_for_time_fields: Literal["UTC", "LOCAL_TIME_AT_LOCATIONS"] | None = None,
    ignore_invalid_locations: Literal["SKIP", "HALT"] | None = None,
) -> Result1[str | Layer]:
    """MakeRouteAnalysisLayer_na(network_data_source, {layer_name}, {travel_mode}, {sequence}, {time_of_day}, {time_zone}, {line_shape}, {accumulate_attributes;accumulate_attributes...}, {generate_directions_on_solve}, {time_zone_for_time_fields}, {ignore_invalid_locations})

       Makes a route network analysis layer and sets its analysis properties.
       A route network analysis layer is useful for determining the best
       route between a set of network locations based on a specified network
       cost. The layer can be created using a local network dataset or a
       routing service hosted online or in a portal.

    INPUTS:
     network_data_source (Network Dataset Layer / String):
         The network dataset or service on which the network analysis will be
         performed. Use the portal URL for a service.
     layer_name {String}:
         The name of the network analysis layer that will be created.
     travel_mode {String}:
         The name of the travel mode to use in the analysis. The travel mode
         represents a collection of network settings, such as travel
         restrictions and U-turn policies, that determine how a pedestrian,
         car, truck, or other medium of transportation moves through the
         network. Travel modes are defined on your network data source.An
         arcpy.na.TravelMode object and a string containing the valid JSON
         representation of a travel mode can also be used as input to the
         parameter.
     sequence {String}:
         Specifies whether the input stops must be visited in a particular
         order when calculating the optimal route. This option changes the
         route analysis from a shortest-path problem to a traveling salesperson
         problem (TSP).USE_CURRENT_ORDER-The stops will be visited in the input
         order. This
         is the default.FIND_BEST_ORDER-The stops will be reordered to find the
         optimal route.
         This option changes the route analysis from a shortest-path problem to
         a traveling salesperson problem (TSP).PRESERVE_BOTH-The first and last
         stops will be preserved by input
         order. The rest will be reordered to find the optimal
         route.PRESERVE_FIRST-The first stop will be preserved by input order.
         The
         rest will be reordered to find the optimal route.PRESERVE_LAST-The
         last stop will be preserved by input order. The rest
         will be reordered to find the optimal route.
     time_of_day {Date}:
         The start date and time for the route. Route start time is typically
         used to find routes based on the impedance attribute that varies with
         the time of the day. For example, a start time of 7:00 a.m. can be
         used to find a route that considers rush hour traffic. The default
         value for this parameter is 8:00 a.m. A date and time can be specified
         as 10/21/05 10:30 AM. If the route spans multiple days and only the
         start time is specified, the current date is used.After the solve, the
         start and end times of the route are populated in
         the output routes. These start and end times are also used when
         directions are generated. Configure the analysis to use one of
         the following special
         dates to model a day of the week or the current date instead of a
         specific, static date:
         Today-12/30/1899Sunday-12/31/1899Monday-1/1/1900Tuesday-1/2/1900Wednes
         day-1/3/1900Thursday-1/4/1900Friday-1/5/1900Saturday-1/6/1900
     time_zone {String}:
         Specifies the time zone of the time_of_day parameter.
         LOCAL_TIME_AT_LOCATIONS-The time_of_day parameter refers to
         the time zone in which the first stop of a route is located. This is
         the default. If you are generating many routes that start in
         multiple times zones,
         the start times are staggered in coordinated universal time (UTC). For
         example, a time_of_day value of 10:00 a.m., 2 January, means a start
         time of 10:00 a.m. eastern standard time (3:00 p.m. UTC) for routes
         beginning in the eastern time zone and 10:00 a.m. central standard
         time (4:00 p.m. UTC) for routes beginning in the central time zone.
         The start times are offset by one hour in UTC.The arrival and
         departure times and dates recorded in the output Stops
         feature class will refer to the local time zone of the first stop for
         each route. UTC-The time_of_day parameter refers to
         coordinated universal
         time (UTC). Choose this option if you want to generate a route for a
         specific time, such as now, but aren't certain in which time zone the
         first stop will be located. If you are generating many routes
         spanning multiple times zones, the
         start times in UTC are simultaneous. For example, a time_of_day value
         of 10:00 a.m., 2 January, means a start time of 5:00 a.m. eastern
         standard time (10:00 a.m. UTC) for routes beginning in the eastern
         time zone and 4:00 a.m. central standard time (10:00 a.m. UTC) for
         routes beginning in the central time zone. Both routes start at 10:00
         a.m. UTC.The arrival and departure times and dates recorded in the
         output Stops
         feature class will refer to UTC.
     line_shape {String}:
         Specifies the shape type that will be used for the route features that
         are output by the analysis.ALONG_NETWORK-The output routes will have
         the exact shape of the
         underlying network sources. The output includes route measurements for
         linear referencing. The measurements increase from the first stop and
         record the cumulative impedance to reach a given position.NO_LINES-No
         shape will be generated for the output routes.STRAIGHT_LINES-The
         output route shape will be a single straight line
         between the stops.Regardless of the output shape type specified, the
         best route is
         always determined by the network impedance, not Euclidean distance.
         This means that only the route shapes are different, not the
         underlying traversal of the network.
     accumulate_attributes {String}:
         A list of cost attributes to be accumulated during analysis. These
         accumulated attributes are for reference only; the solver only uses
         the cost attribute used by the designated travel mode when solving the
         analysis.For each cost attribute that is accumulated, a
         Total_[Impedance]
         property is populated in the network analysis output features.This
         parameter is not available if the network data source is an
         ArcGIS Online service or the network data source is a service on a
         version of Portal for ArcGIS that does not support accumulation.
     generate_directions_on_solve {Boolean}:
         Specifies whether directions will be generated when running the
         analysis.DIRECTIONS-Turn-by-turn directions will be generated on
         solve. This is
         the default.NO_DIRECTIONS-Turn-by-turn directions will not be
         generated on solve.For an analysis in which generating turn-by-turn
         directions is not
         needed, using the NO_DIRECTIONS option will reduce the time it takes
         to solve the analysis.
     time_zone_for_time_fields {String}:
         Specifies the time zone that will be used to interpret the time fields
         included in the input tables, such as the fields used for time
         windows.LOCAL_TIME_AT_LOCATIONS-The dates and times in the time fields
         for the
         stop will be interpreted according to the time zone in which the stop
         is located. This is the default.UTC-The dates and times in the time
         fields for the stop refer to
         coordinated universal time (UTC).
     ignore_invalid_locations {Boolean}:
         Specifies whether invalid input locations will be ignored. Typically,
         locations are invalid if they cannot be located on the network. When
         invalid locations are ignored, the solver will skip them and attempt
         to perform the analysis using the remaining locations.SKIP-Invalid
         input locations will be ignored and only valid locations
         will be used. This is the default.HALT-All input locations will be
         used. Invalid locations will cause
         the analysis to fail."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeRouteAnalysisLayer_na(
                *gp_fixargs(
                    (
                        network_data_source,
                        layer_name,
                        travel_mode,
                        sequence,
                        time_of_day,
                        time_zone,
                        line_shape,
                        accumulate_attributes,
                        generate_directions_on_solve,
                        time_zone_for_time_fields,
                        ignore_invalid_locations,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeRouteLayer_na", None)
def MakeRouteLayer(
    in_network_dataset=None,
    out_network_analysis_layer=None,
    impedance_attribute=None,
    find_best_order: Literal["FIND_BEST_ORDER", "USE_INPUT_ORDER"] | None = None,
    ordering_type: Literal["PRESERVE_BOTH", "PRESERVE_NONE", "PRESERVE_FIRST", "PRESERVE_LAST"] | None = None,
    time_windows: Literal["USE_TIMEWINDOWS", "NO_TIMEWINDOWS"] | None = None,
    accumulate_attribute_name=None,
    UTurn_policy: Literal["ALLOW_UTURNS", "NO_UTURNS", "ALLOW_DEAD_ENDS_ONLY", "ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY"]
    | None = None,
    restriction_attribute_name=None,
    hierarchy: Literal["USE_HIERARCHY", "NO_HIERARCHY"] | None = None,
    hierarchy_settings=None,
    output_path_shape: Literal["NO_LINES", "STRAIGHT_LINES", "TRUE_LINES_WITH_MEASURES", "TRUE_LINES_WITHOUT_MEASURES"]
    | None = None,
    start_date_time=None,
) -> Result1[str | Layer]:
    """MakeRouteLayer_na(in_network_dataset, out_network_analysis_layer, impedance_attribute, {find_best_order}, {ordering_type}, {time_windows}, {accumulate_attribute_name;accumulate_attribute_name...}, {UTurn_policy}, {restriction_attribute_name;restriction_attribute_name...}, {hierarchy}, {hierarchy_settings}, {output_path_shape}, {start_date_time})

       Makes a route network analysis layer and sets its analysis properties.
       A route analysis layer is useful for determining the best route
       between a set of network locations based on a specified network cost.

    INPUTS:
     in_network_dataset (Network Dataset Layer):
         The network dataset on which the route analysis will be performed.
     out_network_analysis_layer (String):
         Name of the route network analysis layer to create.
     impedance_attribute (String):
         The cost attribute that will be used as impedance in the analysis.
     find_best_order {Boolean}:
         FIND_BEST_ORDER-The stops will be reordered to find the optimal route.
         This option changes the route analysis from a shortest-path problem to
         a traveling salesperson problem (TSP).USE_INPUT_ORDER-The stops will
         be visited in the input order. This is
         the default.
     ordering_type {String}:
         Specifies the ordering of stops when FIND_BEST_ORDER is
         used.PRESERVE_BOTH-The first and last stops by input order will be
         preserved as the first and last stops in the route.PRESERVE_FIRST-The
         first stop by input order will be preserved as the
         first stop in the route, but the last stop can be
         reordered.PRESERVE_LAST-The last stop by input order will be preserved
         as the
         last stop in the route, but the first stop can be
         reordered.PRESERVE_NONE-The first and last stops will not be preserved
         and can
         be reordered.
     time_windows {Boolean}:
         Specifies whether time windows will be used at the
         stops.USE_TIMEWINDOWS-The route will consider time windows on the
         stops. If
         a stop is arrived at before its time window, there will be wait time
         until the time window starts. If a stop is arrived at after its time
         window, there will be a time window violation. Total time window
         violation is balanced against minimum impedance when computing the
         route. This is a valid option only when the impedance is in time
         units.NO_TIMEWINDOWS-The route will ignore time windows on the stops.
         This
         is the default.
     accumulate_attribute_name {String}:
         A list of cost attributes to be accumulated during analysis.
         These accumulation attributes are for reference only; the solver only
         uses the cost attribute specified by theparameter to calculate the
         route. Impedance AttributeFor each cost attribute that is
         accumulated, a Total_[Impedance]
         property is added to the routes that are output by the solver.
     UTurn_policy {String}:
         Specifies the U-turn policy that will be used at junctions. Allowing
         U-turns implies that the solver can turn around at a junction and
         double back on the same street. Given that junctions represent street
         intersections and dead ends, different vehicles may be able to turn
         around at some junctions but not at others-it depends on whether the
         junction represents an intersection or a dead end. To accommodate
         this, the U-turn policy parameter is implicitly specified by the
         number of edges that connect to the junction, which is known as
         junction valency. The acceptable values for this parameter are listed
         below; each is followed by a description of its meaning in terms of
         junction valency.ALLOW_UTURNS-U-turns are permitted at junctions with
         any number of
         connected edges. This is the default value.NO_UTURNS-U-turns are
         prohibited at all junctions, regardless of
         junction valency. However, U-turns are still permitted at network
         locations even when this option is specified, but you can set the
         individual network location's CurbApproach property to prohibit
         U-turns there as well.ALLOW_DEAD_ENDS_ONLY-U-turns are prohibited at
         all junctions, except
         those that have only one adjacent edge (a dead
         end).ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY-U-turns are prohibited at
         junctions where exactly two adjacent edges meet but are permitted at
         intersections (junctions with three or more adjacent edges) and dead
         ends (junctions with exactly one adjacent edge). Often, networks have
         extraneous junctions in the middle of road segments. This option
         prevents vehicles from making U-turns at these locations.If you need a
         more precisely defined U-turn policy, consider adding a
         global turn delay evaluator to a network cost attribute or adjusting
         its settings if one exists, and pay particular attention to the
         configuration of reverse turns. You can also set the CurbApproach
         property of your network locations.
     restriction_attribute_name {String}:
         A list of restriction attributes that will be applied during the
         analysis.
     hierarchy {Boolean}:
         USE_HIERARCHY-The hierarchy attribute will be used for the analysis.
         Using a hierarchy results in the solver preferring higher-order edges
         to lower-order edges. Hierarchical solves are faster, and they can be
         used to simulate the preference of a driver who chooses to travel on
         freeways rather than local roads when possible-even if that means a
         longer trip. This option is valid only if the input network dataset
         has a hierarchy attribute.NO_HIERARCHY-The hierarchy attribute will
         not be used for the
         analysis, and the result will be an exact route for the network
         dataset.The parameter is not used if no hierarchy attribute is defined
         on the
         network dataset used to perform the analysis.
     hierarchy_settings {Network Analyst Hierarchy Settings}:
         Prior to version 10, this parameter allowed you to change the
         hierarchy ranges for the analysis from the default hierarchy ranges
         established in the network dataset. At version 10, this parameter is
         no longer supported and should be specified as an empty string. To
         change the hierarchy ranges for the analysis, update the default
         hierarchy ranges in the network dataset.
     output_path_shape {String}:
         Specifies the shape type that will be used for the route features that
         are output by the analysis.TRUE_LINES_WITH_MEASURES-The output routes
         will have the exact shape
         of the underlying network sources. The output includes route
         measurements for linear referencing. The measurements increase from
         the first stop and record the cumulative impedance to reach a given
         position.TRUE_LINES_WITHOUT_MEASURES-The output routes will have the
         exact
         shape of the underlying network sources.STRAIGHT_LINES-The output
         route shape will be a single straight line
         between the stops.NO_LINES-No shape will be generated for the output
         routes.Regardless of the output shape type specified, the best route
         is
         always determined by the network impedance, not Euclidean distance.
         This means that only the route shapes are different, not the
         underlying traversal of the network.
     start_date_time {Date}:
         The start date and time for the route. Route start time is typically
         used to find routes based on the impedance attribute that varies with
         the time of the day. For example, a start time of 7:00 a.m. can be
         used to find a route that considers rush hour traffic. The default
         value for this parameter is 8:00 a.m. A date and time can be specified
         as 10/21/05 10:30 AM. If the route spans multiple days and only the
         start time is specified, the current date is used. Configure
         the analysis to use one of the following special
         dates to model a day of the week or the current date instead of a
         specific, static date:
         Today-12/30/1899Sunday-12/31/1899Monday-1/1/1900Tuesday-1/2/1900Wednes
         day-1/3/1900Thursday-1/4/1900Friday-1/5/1900Saturday-1/6/1900For
         example, to specify that travel should begin at 5:00 p.m. on
         Tuesday, specify the parameter value as 1/2/1900 5:00 PM.After the
         solve, the start and end times of the route are populated in
         the output routes. These start and end times are also used when
         directions are generated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeRouteLayer_na(
                *gp_fixargs(
                    (
                        in_network_dataset,
                        out_network_analysis_layer,
                        impedance_attribute,
                        find_best_order,
                        ordering_type,
                        time_windows,
                        accumulate_attribute_name,
                        UTurn_policy,
                        restriction_attribute_name,
                        hierarchy,
                        hierarchy_settings,
                        output_path_shape,
                        start_date_time,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeServiceAreaAnalysisLayer_na", None)
def MakeServiceAreaAnalysisLayer(
    network_data_source=None,
    layer_name=None,
    travel_mode=None,
    travel_direction: Literal["TO_FACILITIES", "FROM_FACILITIES"] | None = None,
    cutoffs=None,
    time_of_day=None,
    time_zone: Literal["UTC", "LOCAL_TIME_AT_LOCATIONS"] | None = None,
    output_type: Literal["POLYGONS", "LINES", "POLYGONS_AND_LINES"] | None = None,
    polygon_detail: Literal["GENERALIZED", "STANDARD", "HIGH"] | None = None,
    geometry_at_overlaps: Literal["OVERLAP", "DISSOLVE", "SPLIT"] | None = None,
    geometry_at_cutoffs: Literal["RINGS", "DISKS"] | None = None,
    polygon_trim_distance=None,
    exclude_sources_from_polygon_generation=None,
    accumulate_attributes=None,
    ignore_invalid_locations: Literal["SKIP", "HALT"] | None = None,
) -> Result1[str | Layer]:
    """MakeServiceAreaAnalysisLayer_na(network_data_source, {layer_name}, {travel_mode}, {travel_direction}, {cutoffs;cutoffs...}, {time_of_day}, {time_zone}, {output_type}, {polygon_detail}, {geometry_at_overlaps}, {geometry_at_cutoffs}, {polygon_trim_distance}, {exclude_sources_from_polygon_generation;exclude_sources_from_polygon_generation...}, {accumulate_attributes;accumulate_attributes...}, {ignore_invalid_locations})

       Makes a service area network analysis layer and sets its analysis
       properties. A service area analysis layer is useful in determining the
       area of accessibility within a given cutoff cost from a facility
       location. The layer can be created using a local network dataset or a
       routing service hosted online or in a portal.

    INPUTS:
     network_data_source (Network Dataset Layer / String):
         The network dataset or service on which the network analysis will be
         performed. Use the portal URL for a service.
     layer_name {String}:
         The name of the network analysis layer that will be created.
     travel_mode {String}:
         The name of the travel mode that will be used in the analysis. The
         travel mode represents a collection of network settings, such as
         travel restrictions and U-turn policies, that determine how a
         pedestrian, car, truck, or other medium of transportation moves
         through the network. Travel modes are defined on your network data
         source.An arcpy.na.TravelMode object and a string containing the valid
         JSON
         representation of a travel mode can also be used as input to this
         parameter.
     travel_direction {String}:
         Specifies the direction of travel to or from the
         facilities.FROM_FACILITIES-The direction of travel is away from the
         facilities.
         This is the default.TO_FACILITIES-The direction of travel is toward
         the facilities.Using this parameter can result in different service
         areas on a
         network with one-way restrictions and different impedances based on
         direction of travel. The service area for a pizza delivery store, for
         example, should be created away from the facility, whereas the service
         area of a hospital should be created toward the facility.
     cutoffs {Double}:
         The extent of the service area to be calculated in the units of the
         impedance attribute used by the selected travel mode. For example,
         when analyzing driving time, a cutoff value of 10 means that the
         resulting service area will represent the area reachable within a
         10-minute drive time.Multiple cutoffs can be set to create concentric
         service areas. For
         example, to find 2-, 3-, and 5-minute service areas for the same
         facility, specify 2, 3, and 5 as the values for this parameter.This
         default cutoff value can be overridden on a per-facility basis by
         specifying individual break values in the facilities sublayer.
     time_of_day {Date}:
         The time to depart from or arrive at the facilities of the
         service area layer. The interpretation of this value as a departure or
         arrival time depends on whether travel is away from or toward the
         facilities. It represents the departure time if
         travel_direction='FROM_FACILITIES'.It represents the arrival time if
         travel_direction='TO_FACILITIES'.The time_of_day parameter is most
         useful for finding the roads that
         can be reached based on a travel mode that uses an impedance attribute
         that varies with the time of the day, such as one based on dynamic
         traffic conditions. Solving the same analysis using different
         time_of_day values allows you to see how a facility's reach changes
         over time. For example, the five-minute service area around a fire
         station may start out large in the early morning, diminish during the
         morning rush hour, grow in the late morning, and so on throughout the
         day.A date and time can be specified as 10/21/2015 10:30 AM.
         Configure the analysis to use one of the following special
         dates to model a day of the week or the current date instead of a
         specific, static date:
         Today-12/30/1899Sunday-12/31/1899Monday-1/1/1900Tuesday-1/2/1900Wednes
         day-1/3/1900Thursday-1/4/1900Friday-1/5/1900Saturday-1/6/1900
     time_zone {String}:
         Specifies the time zone for the time of day parameter.
         LOCAL_TIME_AT_LOCATIONS-The time of day parameter will use
         the time zone or zones in which the facilities are located. The start
         or end times of the service areas are staggered by time zone. This is
         the default. For example, setting time of day to 9:00 a.m.
         causes service areas to
         be generated for 9:00 a.m. eastern time for facilities in the eastern
         time zone, 9:00 a.m. central time for facilities in the central time
         zone, 9:00 a.m. mountain time for facilities in the mountain time
         zone, and so on. If stores in a chain that span the U.S. open at 9:00
         a.m. local time, choose this parameter value to find market
         territories at opening time for all stores in one solve. First, the
         stores in the eastern time zone open and a polygon is generated. An
         hour later, stores open in the central time zone, and so on. Nine
         o'clock is always in local time but staggered in real time.
         UTC-The time of day parameter will use coordinated universal
         time (UTC). All facilities are reached or departed from
         simultaneously, regardless of the time zone or zones in which they are
         located. Setting time of day to 2:00 p.m. causes service areas
         to be generated
         for 9:00 a.m. eastern standard time for facilities in the eastern time
         zone, 8:00 a.m. central standard time for facilities in the central
         time zone, 7:00 a.m. mountain standard time for facilities in the
         mountain time zone, and so on.The scenario above assumes standard
         time. During daylight saving time,
         the eastern, central, and mountain times will each be one hour ahead
         (that is, 10:00, 9:00, and 8:00 a.m., respectively).One of the cases
         in which the UTC option is useful is to visualize
         emergency response coverage for a jurisdiction that is split into two
         time zones. The emergency vehicles are loaded as facilities. Time of
         day is set to now in UTC. (You need to determine what the current time
         and date are in terms of UTC to correctly use this option.) Other
         properties are set and the analysis is solved. Even though a time-zone
         boundary divides the vehicles, the results show areas that can be
         reached given current traffic conditions. This same process can be
         used for other times as well, not just for now.
     output_type {String}:
         Specifies the type of output to be generated. Service area output can
         be line features representing the roads reachable before the cutoffs
         are exceeded or the polygon features encompassing these lines
         (representing the reachable area).POLYGONS-The service area output
         will contain polygons only. This is
         the default.LINES-The service area output will contain lines
         only.POLYGONS_AND_LINES-The service area output will contain both
         polygons
         and lines. Theandoutput types are not available if the network
         data
         source is a service on a version of Portal for ArcGIS that does not
         support line generation. LinesPolygons and lines
     polygon_detail {String}:
         Specifies the level of detail of the output polygons.STANDARD-Polygons
         with a standard level of detail will be created.
         This is the default.GENERALIZED-Generalized polygons will be created
         using the network's
         hierarchy attribute to produce results quickly. This option is not
         available if the network does not have a hierarchy
         attribute.HIGH-Polygons with a higher level of detail will be created
         for
         applications in which precise results are important.If the analysis
         includes an urban area with a grid-like street
         network, the difference between generalized and standard polygons will
         be minimal. However, for mountain and rural roads, the standard and
         detailed polygons may present more accurate results than generalized
         polygons.
     geometry_at_overlaps {String}:
         Specifies the behavior of service-area output from multiple facilities
         in relation to one another.OVERLAP-Individual polygons or sets of
         lines for each facility will be
         created. The polygons or lines can overlap each other. This is the
         default.DISSOLVE-The polygons of multiple facilities that have the
         same cutoff
         value will be joined into a single polygon. This option does not apply
         to line output.SPLIT-An area will be assigned to the closest facility
         so polygons or
         lines do not overlap each other.
     geometry_at_cutoffs {String}:
         Specifies the behavior of service area output for a single facility
         when multiple cutoff values are specified. This parameter does not
         apply to line output.RINGS-Each polygon will include only the area
         between consecutive
         cutoff values. It will not include the area between the facility and
         any smaller cutoffs. For example, if you create 5- and 10-minute
         service areas, the 5-minute service area polygon will include the area
         reachable in 0 to 5 minutes, and the 10-minute service area polygon
         will include the area reachable in 5 to 10 minutes. This is the
         default.DISKS-Each polygon will include the area reachable from the
         facility
         up to the cutoff value, including the area reachable within smaller
         cutoff values. For example, if you create 5- and 10-minute service
         areas, the 10-minute service area polygon will include the area under
         the 5-minute service area polygon.
     polygon_trim_distance {Linear Unit}:
         The service area polygon trim distance. The polygon trim distance is
         the distance the service area polygon will extend from the road when
         no other reachable roads are nearby, similar to a line buffer size.
         This is useful when the network is sparse and you don't want the
         service area to cover large areas where there are no features.This
         parameter includes a value and units for the distance. The
         default value is 100 meters.
     exclude_sources_from_polygon_generation {String}:
         The network dataset edge sources that will be excluded when generating
         service area polygons. Polygons will not be generated around the
         excluded sources, even though they are traversed in the
         analysis.Excluding a network source from service area polygons does
         not prevent
         those sources from being traversed. Excluding sources from service
         area polygons only influences the polygon shape of the service areas.
         To prevent traversal of a given network source, you must create an
         appropriate restriction when defining the network dataset.This is
         useful if you have some network sources that you don't want to
         be included in the polygon generation because they create less-
         accurate polygons or are inconsequential for the service area
         analysis. For example, while creating a walk-time service area in a
         multimodal network that includes streets and metro lines, you should
         exclude the metro lines from polygon generation. Although the traveler
         can use the metro lines, they cannot stop partway along a metro line
         and enter a nearby building. Instead, they must travel the full length
         of the metro line, exit the metro system at a station, then use the
         streets to walk to the building. It would be inaccurate to generate a
         polygon feature around a metro line.This parameter is not available
         when the output geometry types do not
         include polygons, there are fewer than two edge sources in the
         network, the network data source is an ArcGIS Online service, or the
         network data source is a service on a version of Portal for ArcGIS
         that does not support excluding sources.
     accumulate_attributes {String}:
         A list of cost attributes to be accumulated during analysis. These
         accumulated attributes are for reference only; the solver only uses
         the cost attribute used by the designated travel mode when solving the
         analysis.For each cost attribute that is accumulated, a
         Total_[Impedance]
         property is populated in the network analysis output features.This
         parameter is not available if the analysis layer is not
         configured to output lines, the network data source is an ArcGIS
         Online service, or the network data source is a service on a version
         of Portal for ArcGIS that does not support accumulation.
     ignore_invalid_locations {Boolean}:
         Specifies whether invalid input locations will be ignored. Typically,
         locations are invalid if they cannot be located on the network. When
         invalid locations are ignored, the solver will skip them and attempt
         to perform the analysis using the remaining locations.SKIP-Invalid
         input locations will be ignored and only valid locations
         will be used. This is the default.HALT-All input locations will be
         used. Invalid locations will cause
         the analysis to fail."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeServiceAreaAnalysisLayer_na(
                *gp_fixargs(
                    (
                        network_data_source,
                        layer_name,
                        travel_mode,
                        travel_direction,
                        cutoffs,
                        time_of_day,
                        time_zone,
                        output_type,
                        polygon_detail,
                        geometry_at_overlaps,
                        geometry_at_cutoffs,
                        polygon_trim_distance,
                        exclude_sources_from_polygon_generation,
                        accumulate_attributes,
                        ignore_invalid_locations,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeServiceAreaLayer_na", None)
def MakeServiceAreaLayer(
    in_network_dataset=None,
    out_network_analysis_layer=None,
    impedance_attribute=None,
    travel_from_to: Literal["TRAVEL_TO", "TRAVEL_FROM"] | None = None,
    default_break_values=None,
    polygon_type: Literal["SIMPLE_POLYS", "DETAILED_POLYS", "NO_POLYS"] | None = None,
    merge: Literal["NO_MERGE", "NO_OVERLAP", "MERGE"] | None = None,
    nesting_type: Literal["RINGS", "DISKS"] | None = None,
    line_type: Literal["NO_LINES", "TRUE_LINES", "TRUE_LINES_WITH_MEASURES"] | None = None,
    overlap: Literal["OVERLAP", "NON_OVERLAP"] | None = None,
    split: Literal["SPLIT", "NO_SPLIT"] | None = None,
    excluded_source_name=None,
    accumulate_attribute_name=None,
    UTurn_policy: Literal["ALLOW_UTURNS", "NO_UTURNS", "ALLOW_DEAD_ENDS_ONLY", "ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY"]
    | None = None,
    restriction_attribute_name=None,
    polygon_trim: Literal["TRIM_POLYS", "NO_TRIM_POLYS"] | None = None,
    poly_trim_value=None,
    lines_source_fields: Literal["LINES_SOURCE_FIELDS", "NO_LINES_SOURCE_FIELDS"] | None = None,
    hierarchy: Literal["USE_HIERARCHY", "NO_HIERARCHY"] | None = None,
    time_of_day=None,
) -> Result1[str | Layer]:
    """MakeServiceAreaLayer_na(in_network_dataset, out_network_analysis_layer, impedance_attribute, {travel_from_to}, {default_break_values}, {polygon_type}, {merge}, {nesting_type}, {line_type}, {overlap}, {split}, {excluded_source_name;excluded_source_name...}, {accumulate_attribute_name;accumulate_attribute_name...}, {UTurn_policy}, {restriction_attribute_name;restriction_attribute_name...}, {polygon_trim}, {poly_trim_value}, {lines_source_fields}, {hierarchy}, {time_of_day})

       Makes a service area network analysis layer and sets its analysis
       properties. A service area analysis layer is useful in determining the
       area of accessibility within a given cutoff cost from a facility
       location.

    INPUTS:
     in_network_dataset (Network Dataset Layer):
         The network dataset on which the service area analysis will be
         performed.
     out_network_analysis_layer (String):
         Name of the service area network analysis layer to create.
     impedance_attribute (String):
         The cost attribute that will be used as impedance in the analysis.
     travel_from_to {String}:
         Specifies the direction of travel to or from the
         facilities.TRAVEL_FROM-The service area is created in the direction
         away from the
         facilities.TRAVEL_TO-The service area is created in the direction
         towards the
         facilities.Using this option can result in different service areas on
         a network
         with one-way restrictions and having different impedances based on
         direction of travel. The service area for a pizza delivery store, for
         example, should be created away from the facility, whereas the service
         area of a hospital should be created toward the facility.
     default_break_values {String}:
         Default impedance values indicating the extent of the service area to
         be calculated. The default can be overridden by specifying the break
         value on the facilities.Multiple polygon breaks can be set to create
         concentric service areas.
         For instance, to find 2-, 3-, and 5-minute service areas for the same
         facility, specify "2 3 5" as the value for the Default break values
         parameter (the numbers 2, 3, and 5 should be separated by a space).
     polygon_type {String}:
         Specifies the type of polygons to be generated.SIMPLE_POLYS-Creates
         generalized polygons, which are generated quickly
         and are fairly accurate, except on the fringes. This is the
         default.DETAILED_POLYS-Creates detailed polygons, which accurately
         model the
         service area lines and may contain islands of unreached areas. This
         option is slower than generating generalized polygons.NO_POLYS-Turns
         off polygon generation for the case in which only
         service area lines are desired.If your data is of an urban area with a
         gridlike network, the
         difference between generalized and detailed polygons would be minimal.
         However, for mountain and rural roads, the detailed polygons may
         present significantly more accurate results than generalized polygons.
     merge {String}:
         Specifies the options to merge polygons that share similar break
         values. This option is applicable only when generating polygons for
         multiple facilities.NO_MERGE-Creates individual polygons for each
         facility. The polygons
         can overlap each other.NO_OVERLAP-Creates individual polygons that are
         closest for each
         facility. The polygons do not overlap each other.MERGE-Joins the
         polygons of multiple facilities that have the same
         break value.
     nesting_type {String}:
         Specifies the option to create concentric service area polygons as
         disks or rings. This option is applicable only when multiple break
         values are specified for the facilities.RINGS-Do not include the area
         of the smaller breaks. This creates
         polygons going between consecutive breaks. Use this option if you want
         to find the area from one break to another.DISKS-Creates the polygons
         going from the facility to the break. For
         instance, If you create 5- and 10-minute service areas, then the
         10-minute service area polygon will include the area under the
         5-minute service area polygon. Use this option if you want to find the
         entire area from the facility to the break for each break.
     line_type {String}:
         Specifies the type of lines to be generated based on the service area
         analysis. Selecting the TRUE_LINES or TRUE_LINES_WITH_MEASURES option
         for large service areas will increase the amount of memory consumed by
         the analysis.NO_LINES-Do not generate lines. This is the
         default.TRUE_LINES-Lines
         are generated without measures.TRUE_LINES_WITH_MEASURES-Lines are
         generated with measures. The
         measure values are generated based on the impedance value on each end
         of the edge with the intermediate vertices interpolated. Do not use
         this option if faster performance is desired.
     overlap {Boolean}:
         Determines whether overlapping lines are generated when the service
         area lines are computed.OVERLAP-Include a separate line feature for
         each facility when the
         facilities have service area lines that are coincident.NON_OVERLAP-
         Include each service area line at most once and associate
         it with its closest (least impedance) facility.
     split {Boolean}:
         SPLIT-Split every line between two breaks into two lines, each lying
         within its break. This is useful if you want to symbolize the service
         area lines by break. Otherwise, use the NO_SPLIT option for optimal
         performance.NO_SPLIT-The lines are not split at the boundaries of the
         breaks. This
         is the default.
     excluded_source_name {String}:
         Specifies the list of network sources to be excluded when generating
         the polygons. The geometry of traversed elements from the excluded
         sources will be omitted from all polygons.This is useful if you have
         some network sources that you don't want to
         be included in the polygon generation because they create less
         accurate polygons or are inconsequential for the service area
         analysis. For example, while creating a drive time service area in a
         multimodal network of streets and rails, you should choose to exclude
         the rail lines from polygon generation so as to correctly model where
         a vehicle could travel.Excluding a network source from service area
         polygons does not prevent
         those sources from being traversed. Excluding sources from service
         area polygons only influences the polygon shape of the service areas.
         If you want to prevent traversal of a given network source, you must
         create an appropriate restriction when defining your network dataset.
     accumulate_attribute_name {String}:
         A list of cost attributes to be accumulated during analysis.
         These accumulation attributes are for reference only; the solver only
         uses the cost attribute specified by theparameter to calculate the
         route. Impedance AttributeFor each cost attribute that is
         accumulated, a Total_[Impedance]
         property is added to the routes that are output by the solver.
     UTurn_policy {String}:
         Specifies the U-turn policy that will be used at junctions. Allowing
         U-turns implies that the solver can turn around at a junction and
         double back on the same street. Given that junctions represent street
         intersections and dead ends, different vehicles may be able to turn
         around at some junctions but not at others-it depends on whether the
         junction represents an intersection or a dead end. To accommodate
         this, the U-turn policy parameter is implicitly specified by the
         number of edges that connect to the junction, which is known as
         junction valency. The acceptable values for this parameter are listed
         below; each is followed by a description of its meaning in terms of
         junction valency.ALLOW_UTURNS-U-turns are permitted at junctions with
         any number of
         connected edges. This is the default value.NO_UTURNS-U-turns are
         prohibited at all junctions, regardless of
         junction valency. However, U-turns are still permitted at network
         locations even when this option is specified, but you can set the
         individual network location's CurbApproach property to prohibit
         U-turns there as well.ALLOW_DEAD_ENDS_ONLY-U-turns are prohibited at
         all junctions, except
         those that have only one adjacent edge (a dead
         end).ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY-U-turns are prohibited at
         junctions where exactly two adjacent edges meet but are permitted at
         intersections (junctions with three or more adjacent edges) and dead
         ends (junctions with exactly one adjacent edge). Often, networks have
         extraneous junctions in the middle of road segments. This option
         prevents vehicles from making U-turns at these locations.If you need a
         more precisely defined U-turn policy, consider adding a
         global turn delay evaluator to a network cost attribute or adjusting
         its settings if one exists, and pay particular attention to the
         configuration of reverse turns. You can also set the CurbApproach
         property of your network locations.
     restriction_attribute_name {String}:
         A list of restriction attributes that will be applied during the
         analysis.
     polygon_trim {Boolean}:
         TRIM_POLYS-Trims the polygons containing the edges at the periphery of
         the service area to be within the specified distance of these outer
         edges. This is useful if the network is very sparse and you don't want
         the service area to cover large areas where there are no
         features.NO_TRIM_POLYS-Do not trim polygons.
     poly_trim_value {Linear Unit}:
         Specifies the distance within which the service area polygons are
         trimmed. The parameter includes a value and units for the distance.
         The default value is 100 meters.
     lines_source_fields {Boolean}:
         LINES_SOURCE_FIELDS-Add the SourceID, SourceOID, FromPosition, and
         ToPosition fields to the service area lines to hold information about
         the underlying source features traversed during the analysis. This can
         be useful to join the results of the service area lines to the
         original source data.NO_LINES_SOURCE_FIELDS-Do not add the source
         fields (SourceID,
         SourceOID, FromPosition, and ToPosition) to the service area lines.
     hierarchy {Boolean}:
         USE_HIERARCHY-The hierarchy attribute will be used for the analysis.
         Using a hierarchy results in the solver preferring higher-order edges
         to lower-order edges. Hierarchical solves are faster, and they can be
         used to simulate the preference of a driver who chooses to travel on
         freeways rather than local roads when possible-even if that means a
         longer trip. This option is valid only if the input network dataset
         has a hierarchy attribute.NO_HIERARCHY-The hierarchy attribute will
         not be used for the
         analysis, and the result will be a service area measured along all
         edges of the network dataset regardless of hierarchy level.The
         parameter is not used if no hierarchy attribute is defined on the
         network dataset used to perform the analysis.
     time_of_day {Date}:
         The time to depart from or arrive at the facilities of the
         service area layer. The interpretation of this value as a depart or
         arrive time depends on whether travel is away from or toward the
         facilities. It represents the departure time ifis set
         to.
         Travel From or To FacilityTRAVEL_FROM          It represents the
         arrival time ifis set to. Travel
         From or To FacilityTRAVEL_TOIf you have chosen a traffic-based
         impedance attribute, the solution
         will be generated given dynamic traffic conditions at the time of day
         specified here. A date and time can be specified as 5/14/2012 10:30
         AM. Instead of using a particular date, a day of the week can
         be
         specified using the following dates.For example, to specify that
         travel should begin at 5:00 PM on Tuesday, specify the parameter value
         as 1/2/1900 5:00 PM.
         Today-12/30/1899Sunday-12/31/1899Monday-1/1/1900Tuesday-1/2/1900Wednes
         day-1/3/1900Thursday-1/4/1900Friday-1/5/1900Saturday-1/6/1900Repeatedl
         y solving the same analysis, but using different Time of Day
         values, allows you to see how a facility's reach changes over time.
         For instance, the five-minute service area around a fire station may
         start out large in the early morning, diminish during the morning rush
         hour, grow in the late morning, and so on throughout the day."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeServiceAreaLayer_na(
                *gp_fixargs(
                    (
                        in_network_dataset,
                        out_network_analysis_layer,
                        impedance_attribute,
                        travel_from_to,
                        default_break_values,
                        polygon_type,
                        merge,
                        nesting_type,
                        line_type,
                        overlap,
                        split,
                        excluded_source_name,
                        accumulate_attribute_name,
                        UTurn_policy,
                        restriction_attribute_name,
                        polygon_trim,
                        poly_trim_value,
                        lines_source_fields,
                        hierarchy,
                        time_of_day,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeVehicleRoutingProblemAnalysisLayer_na", None)
def MakeVehicleRoutingProblemAnalysisLayer(
    network_data_source=None,
    layer_name=None,
    travel_mode=None,
    time_units: Literal["Minutes", "Seconds", "Hours", "Days"] | None = None,
    distance_units: Literal[
        "Miles",
        "Kilometers",
        "Feet",
        "Yards",
        "Meters",
        "Inches",
        "Centimeters",
        "Millimeters",
        "Decimeters",
        "NauticalMiles",
    ]
    | None = None,
    default_date=None,
    time_zone_for_time_fields: Literal["UTC", "LOCAL_TIME_AT_LOCATIONS"] | None = None,
    line_shape: Literal["NO_LINES", "STRAIGHT_LINES", "ALONG_NETWORK"] | None = None,
    time_window_factor: Literal["High", "Medium", "Low"] | None = None,
    excess_transit_factor: Literal["High", "Medium", "Low"] | None = None,
    generate_directions_on_solve: Literal["DIRECTIONS", "NO_DIRECTIONS"] | None = None,
    spatial_clustering: Literal["CLUSTER", "NO_CLUSTER"] | None = None,
    ignore_invalid_locations: Literal["SKIP", "HALT"] | None = None,
) -> Result1[str | Layer]:
    """MakeVehicleRoutingProblemAnalysisLayer_na(network_data_source, {layer_name}, {travel_mode}, {time_units}, {distance_units}, {default_date}, {time_zone_for_time_fields}, {line_shape}, {time_window_factor}, {excess_transit_factor}, {generate_directions_on_solve}, {spatial_clustering}, {ignore_invalid_locations})

       Creates a vehicle routing problem (VRP) network analysis layer and
       sets its analysis properties. A VRP analysis layer is useful for
       optimizing a set of routes using a fleet of vehicles. The layer can be
       created using a local network dataset or a service hosted online or in
       a portal.

    INPUTS:
     network_data_source (Network Dataset Layer / String):
         The network dataset or service on which the network analysis will be
         performed. Use the portal URL for a service.
     layer_name {String}:
         The name of the VRP network analysis layer to create.
     travel_mode {String}:
         The name of the travel mode to use in the analysis. The travel mode
         represents a collection of network settings, such as travel
         restrictions and U-turn policies, that determine how a pedestrian,
         car, truck, or other medium of transportation moves through the
         network. Travel modes are defined on your network data source. An
         arcpy.na.TravelMode object and a string containing the valid JSON
         representation of a travel mode can also be used as input to the
         parameter.
     time_units {String}:
         Specifies the time units to be used by the temporal fields of the
         analysis layer's sublayers and tables (network analysis classes). This
         value does not need to match the units of the time cost
         attribute.Minutes-The time units will be minutes. This is the
         default.Seconds-The time units will be seconds.Hours-The time units
         will be hours.Days-The time units will be days.
     distance_units {String}:
         Specifies the distance units to be used by the distance fields of the
         analysis layer's sublayers and tables (network analysis classes). This
         value does not need to match the units of the optional distance cost
         attribute.Miles-The distance units will be miles. This is the
         default.Kilometers-The distance units will be kilometers.Feet-The
         distance units will be feet.Yards-The distance units will be
         yards.Meters-The distance units will be meters.Inches-The distance
         units will be inches.Centimeters-The distance units will be
         centimeters.Millimeters-The distance units will be
         millimeters.Decimeters-The distance units will be
         decimeters.NauticalMiles-The distance units will be nautical miles.
     default_date {Date}:
         The implied date for time field values that don't have a date
         specified with the time. If a time field for an order object, such as,
         has a time-only value, the date is assumed to be the default date. The
         default date has no effect on time field values that already have a
         date. TimeWindowStart        Configure the analysis to use one
         of the following special
         dates to model a day of the week or the current date instead of a
         specific, static date:
         Today-12/30/1899Sunday-12/31/1899Monday-1/1/1900Tuesday-1/2/1900Wednes
         day-1/3/1900Thursday-1/4/1900Friday-1/5/1900Saturday-1/6/1900
     time_zone_for_time_fields {String}:
         Specifies the time zone to be used for the input date-time fields
         supported by the tool.LOCAL_TIME_AT_LOCATIONS-The date-time values
         associated with the
         orders or depots will be in the time zone in which the orders and
         depots are located. For routes, the date-time values are based on the
         time zone in which the starting depot for the route is located. If a
         route does not have a starting depot, all orders and depots across all
         the routes must be in a single time zone. For breaks, the date-time
         values are based on the time zone of the routes. This is the
         default.UTC-The date-time values associated with the orders or depots
         will be
         in coordinated universal time (UTC) and are not based on the time zone
         in which the orders or depots are located.Specifying the date-time
         values in UTC is useful if you do not know
         the time zone in which the orders or depots are located or when you
         have orders and depots in multiple time zones and you want all the
         date-time values to start simultaneously. The UTC option is applicable
         only when your network dataset defines a time zone attribute.
         Otherwise, all the date-time values are treated as the time zone
         corresponding to that location.
     line_shape {String}:
         Specifies the shape type that will be used for the route features that
         are output by the analysis.ALONG_NETWORK-The output routes will have
         the exact shape of the
         underlying network sources. The output includes route measurements for
         linear referencing. The measurements increase from the first stop and
         record the cumulative impedance to reach a given position.NO_LINES-No
         shape will be generated for the output routes.
         STRAIGHT_LINES-The output route shape will be a single
         straight line between the stops. This option is not available
         if the selected network data source is a
         service.Regardless of the output shape type specified, the best route
         is
         always determined by the network impedance, not Euclidean distance.
         This means that only the route shapes are different, not the
         underlying traversal of the network.
     time_window_factor {String}:
         Specifies the importance of honoring time windows without causing
         violations. A time window violation occurs when a route arrives at an
         order, depot, or break after a time window has closed. The violation
         is the interval between the end of the time window and the arrival
         time of a route. High-The solver searches for a solution that
         minimizes time
         window violations at the expense of increasing the overall travel
         time. Choose this setting if arriving on time at orders is more
         important than minimizing the overall solution cost. This may be the
         case if you are meeting customers at your orders and you don't want to
         inconvenience them with late arrivals (another option is to use rigid
         time windows that cannot be violated). Given other
         constraints of a vehicle routing problem, it may
         be impossible to visit all the orders within their time windows. In
         this case, even asetting may produce violations.
         HighMedium-The solver searches for a balance between meeting time
         windows
         and reducing the overall solution cost. This is the default.Low-The
         solver searches for a solution that minimizes overall travel
         time, regardless of time windows. Choose this setting if respecting
         time windows is less important than reducing the overall solution
         cost. You may want to use this setting if you have a growing backlog
         of service requests. For the purpose of servicing more orders in a day
         and reducing the backlog, you can choose this setting even though
         customers may be inconvenienced with your fleet's late arrivals.
     excess_transit_factor {String}:
         Specifies the importance of reducing excess transit time. Excess
         transit time is the amount of time exceeding the time required to
         travel directly between paired orders. The excess time results from
         breaks or travel to other orders or depots between visits to the
         paired orders. This parameter is only relevant if you're using Order
         Pairs.High-The solver searches for a solution with less excess transit
         time
         between paired orders at the expense of increasing the overall travel
         costs. Use this setting if you are transporting people between paired
         orders and you want to shorten their ride time. This is characteristic
         of taxi services.Medium-The solver searches for a balance between
         reducing excess
         transit time and reducing the overall solution cost. This is the
         default.Low-The solver searches for a solution that minimizes overall
         solution
         cost, regardless of excess transit time. This setting is commonly used
         with courier services. Since couriers transport packages as opposed to
         people, ride time is not as important. Using this setting allows
         couriers to service paired orders in the proper sequence and minimize
         the overall solution cost.
     generate_directions_on_solve {Boolean}:
         Specifies whether directions will be generated.DIRECTIONS-Turn-by-turn
         directions will be generated on solve. This is
         the default.NO_DIRECTIONS-Turn-by-turn directions will not be
         generated on solve.
     spatial_clustering {Boolean}:
         Specifies whether spatial clustering will be used.CLUSTER-The orders
         assigned to an individual route will be spatially
         clustered. Clustering orders tends to keep routes in smaller areas and
         reduce how often route lines intersect one another; however,
         clustering can increase overall travel times. This is the
         default.NO_CLUSTER-The solver will not prioritize spatially clustering
         orders
         and the route lines may intersect. Use this option if route zones are
         specified.
     ignore_invalid_locations {Boolean}:
         Specifies whether invalid input locations will be ignored.SKIP-Invalid
         input locations will be ignored so that the analysis will
         succeed using only valid locations.HALT-Invalid locations will not be
         ignored and will cause the analysis
         to fail. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeVehicleRoutingProblemAnalysisLayer_na(
                *gp_fixargs(
                    (
                        network_data_source,
                        layer_name,
                        travel_mode,
                        time_units,
                        distance_units,
                        default_date,
                        time_zone_for_time_fields,
                        line_shape,
                        time_window_factor,
                        excess_transit_factor,
                        generate_directions_on_solve,
                        spatial_clustering,
                        ignore_invalid_locations,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ShareAsRouteLayers_na", None)
def ShareAsRouteLayers(
    in_network_analysis_layer=None,
    summary=None,
    tags=None,
    route_name_prefix=None,
    portal_folder_name=None,
    share_with: Literal["EVERYBODY", "MYORGANIZATION", "MYGROUPS", "MYCONTENT"] | None = None,
    groups=None,
) -> Result1[str]:
    """ShareAsRouteLayers_na(in_network_analysis_layer, {summary}, {tags}, {route_name_prefix}, {portal_folder_name}, {share_with}, {groups;groups...})

       Shares the results of network analyses as route layer items in a
       portal. A route layer includes all the information for a route such as
       the stops assigned to the route or the orders serviced by a route, as
       well as the travel directions.

    INPUTS:
     in_network_analysis_layer (File / Network Analyst Layer):
         The network analysis layer from which the route layer items will be
         created. The network analysis layer should already be solved.Route,
         Closest facility, Vehicle routing problem, and Last mile
         delivery network analysis layers are supported as valid inputs to this
         parameter.The input can also be a .zip file containing route data
         created by the
         saveRouteData() method of the arcpy.nax solver result objects or the
         service parameter in the REST API that return a zipped geodatabase of
         route data with the correct schema.
     summary {String}:
         The summary that will be used by the route layer items. The summary is
         displayed as part of the item information for the route layer item. If
         no value is provided, default summary text-Route and directions for
         <route name>-is used in which <route name> is replaced with the name
         of the route represented by the route layer.
     tags {String}:
         The tags that will be used to describe and identify the route layer
         items. Individual tags are separated with commas. The route name is
         always included as a tag even when no other value is provided.
     route_name_prefix {String}:
         A qualifier that will be added to the title of every route layer item.
         For example, a route name prefix of Monday morning deliveries can be
         used to group all route layer items created from a route analysis
         performed by deliveries that will be run on Monday morning. If no
         value is specified, the title of the route layer item will be created
         using only the route name.
     portal_folder_name {String}:
         The folder in your personal online workspace where the route layer
         items will be created. If a folder with the provided name does not
         exist, a folder will be created. If a folder with the provided name
         exists, the items will be created in the existing folder. If no value
         is provided, the route layer items will be created in the root folder
         of your online workspace.
     share_with {String}:
         Specifies who can access the route layer items.EVERYBODY-The route
         layer items will be public and can be accessed by
         anyone with the URL to the items.MYCONTENT-The route layer items will
         only be shared with the owner of
         the item (the user connected to the portal when the tool is run). As a
         result, only the item owner can access the route layers. This is the
         default.MYGROUPS-The route layer items will be shared with groups the
         connected user belongs to and its members. The groups are specified
         using the groups parameter.MYORGANIZATION-The route layer items will
         be shared with all
         authenticated users in your organization.
     groups {String}:
         The list of groups with which the route layer items will be shared.
         This parameter is applicable only when the share_with parameter is set
         to MYGROUPS."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ShareAsRouteLayers_na(
                *gp_fixargs(
                    (
                        in_network_analysis_layer,
                        summary,
                        tags,
                        route_name_prefix,
                        portal_folder_name,
                        share_with,
                        groups,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Solve_na", None)
def Solve(
    in_network_analysis_layer=None,
    ignore_invalids: Literal["SKIP", "HALT"] | None = None,
    terminate_on_solve_error: Literal["TERMINATE", "CONTINUE"] | None = None,
    simplification_tolerance=None,
    overrides=None,
) -> Result2[str | Layer, str]:
    """Solve_na(in_network_analysis_layer, {ignore_invalids}, {terminate_on_solve_error}, {simplification_tolerance}, {overrides})

       Solves the network analysis layer problem based on its network
       locations and properties.

    INPUTS:
     in_network_analysis_layer (Network Analyst Layer):
         The network analysis layer on which the analysis will be computed.
     ignore_invalids {Boolean}:
         Specifies whether invalid input locations will be ignored. Typically,
         locations are invalid if they cannot be located on the network. When
         invalid locations are ignored, the solver will skip them and attempt
         to perform the analysis using the remaining locations.SKIP-Invalid
         input locations will be ignored and only valid locations
         will be used.HALT-All input locations will be used. Any invalid
         locations will
         cause the solve to fail.The default value will match the
         ignoreInvalidLocations property of
         the designated in_network_analysis_layer value.
     terminate_on_solve_error {Boolean}:
         Specifies whether the tool will stop running and terminate if an error
         is encountered during the solve.TERMINATE-The tool will stop running
         and terminate when the solver
         encounters an error. This is the default. When you use this option,
         the Result object is not created when the tool terminates due to a
         solver error. Review the geoprocessing messages from the ArcPy
         object.CONTINUE-The tool will not fail and will continue to run when
         the
         solver encounters an error. All error messages returned by the solver
         will be converted to warning messages. When you use this option, the
         Result object is always created and the maxSeverity property of the
         Result object is set to 1. Use the getOutput method of the Result
         object with an index value of 1 to determine if the solve was
         successful.
     simplification_tolerance {Linear Unit}:
         The tolerance that determines the degree of simplification for the
         output geometry. If a tolerance is specified, it must be greater than
         zero. You can choose a preferred unit; the default unit is decimal
         degrees.Specifying a simplification tolerance tends to reduce the time
         it
         takes to render routes or service areas. The drawback, however, is
         that simplifying geometry removes vertices, which may lessen the
         spatial accuracy of the output at larger scales.Because a line with
         only two vertices cannot be simplified any
         further, this parameter has no effect on drawing times for single-
         segment output, such as straight-line routes, OD cost matrix lines,
         and location-allocation lines.
     overrides {String}:
         This parameter is for internal use only."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Solve_na(
                *gp_fixargs(
                    (
                        in_network_analysis_layer,
                        ignore_invalids,
                        terminate_on_solve_error,
                        simplification_tolerance,
                        overrides,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SolveVehicleRoutingProblem_na", None)
def SolveVehicleRoutingProblem(
    orders=None,
    depots=None,
    routes=None,
    breaks=None,
    time_units: Literal["Minutes", "Seconds", "Hours", "Days"] | None = None,
    distance_units: Literal["Miles", "Kilometers", "Feet", "Yards", "Meters", "NauticalMiles"] | None = None,
    network_dataset=None,
    output_workspace_location=None,
    output_unassigned_stops_name=None,
    output_stops_name=None,
    output_routes_name=None,
    output_directions_name=None,
    default_date=None,
    uturn_policy: Literal["ALLOW_UTURNS", "NO_UTURNS", "ALLOW_DEAD_ENDS_ONLY", "ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY"]
    | None = None,
    time_window_factor: Literal["High", "Medium", "Low"] | None = None,
    spatially_cluster_routes: Literal["CLUSTER", "NO_CLUSTER"] | None = None,
    route_zones=None,
    route_renewals=None,
    order_pairs=None,
    excess_transit_factor: Literal["High", "Medium", "Low"] | None = None,
    point_barriers=None,
    line_barriers=None,
    polygon_barriers=None,
    time_attribute=None,
    distance_attribute=None,
    use_hierarchy_in_analysis: Literal["USE_HIERARCHY", "NO_HIERARCHY"] | None = None,
    restrictions=None,
    attribute_parameter_values=None,
    maximum_snap_tolerance=None,
    exclude_restricted_portions_of_the_network: Literal["EXCLUDE", "INCLUDE"] | None = None,
    feature_locator_where_clause=None,
    populate_route_lines: Literal["ROUTE_LINES", "NO_ROUTE_LINES"] | None = None,
    route_line_simplification_tolerance=None,
    populate_directions: Literal["DIRECTIONS", "NO_DIRECTIONS"] | None = None,
    directions_language=None,
    directions_style_name: Literal["NA Desktop", "NA Navigation", "NA Campus"] | None = None,
    save_output_layer: Literal["SAVE_OUTPUT_LAYER", "NO_SAVE_OUTPUT_LAYER"] | None = None,
    service_capabilities=None,
    ignore_invalid_order_locations: Literal["SKIP", "HALT"] | None = None,
    travel_mode=None,
    ignore_network_location_fields: Literal["IGNORE", "HONOR"] | None = None,
    time_zone_usage_for_time_fields: Literal["GEO_LOCAL", "UTC"] | None = None,
    overrides=None,
    save_route_data: Literal["SAVE_ROUTE_DATA", "NO_SAVE_ROUTE_DATA"] | None = None,
) -> Result:
    """SolveVehicleRoutingProblem_na(orders, depots, routes, {breaks}, time_units, distance_units, network_dataset, output_workspace_location, output_unassigned_stops_name, output_stops_name, output_routes_name, output_directions_name, {default_date}, {uturn_policy}, {time_window_factor}, {spatially_cluster_routes}, {route_zones}, {route_renewals}, {order_pairs}, {excess_transit_factor}, {point_barriers}, {line_barriers}, {polygon_barriers}, {time_attribute}, {distance_attribute}, {use_hierarchy_in_analysis}, {restrictions;restrictions...}, {attribute_parameter_values}, {maximum_snap_tolerance}, {exclude_restricted_portions_of_the_network}, {feature_locator_where_clause;feature_locator_where_clause...}, {populate_route_lines}, {route_line_simplification_tolerance}, {populate_directions}, {directions_language}, {directions_style_name}, {save_output_layer}, {service_capabilities;service_capabilities...}, {ignore_invalid_order_locations}, {travel_mode}, {ignore_network_location_fields}, {time_zone_usage_for_time_fields}, {overrides}, {save_route_data})

       Creates a vehicle routing problem (VRP) network analysis layer, sets
       the analysis properties, and solves the analysis, which is ideal for
       setting up a VRP web service. A VRP analysis layer finds the best
       routes for a fleet of vehicles.

    INPUTS:
     orders (Feature Set):
         In the case of an exchange visit, an order can have both
         delivery and pickup quantities. The orders that the routes of
         the VRP analysis will visit. An order
         can represent a delivery (for example, furniture delivery), a pickup
         (such as an airport shuttle bus picking up a passenger), or some type
         of service or inspection (a tree trimming job or building inspection,
         for instance).The orders feature set has an associated attribute
         table. The fields
         in the attribute table are described below.ObjectIDThe system-managed
         ID field.ShapeThe geometry field indicating the geographic location of
         the network
         analysis object.NameThe name of the order. The name must be unique. If
         the name is left
         null, a name is automatically generated at solve time.ServiceTimeThis
         property specifies how much time will be spent at the network
         location when the route visits it; that is, it stores the impedance
         value for the network location. A zero or null value indicates the
         network location requires no service time. The unit for this
         field value is specified by theparameter
         (time_units in Python). Time Field UnitsTimeWindowStart1The
         beginning time of the first time window for the network location.
         This field can contain a null value; a null value indicates no
         beginning time. A time window only states when a vehicle can
         arrive at an
         order; it doesn't state when the service time must be completed. To
         account for service time and depart before the time window ends,
         subtract thefield value from thefield value.
         ServiceTimeTimeWindowEnd1          The time window fields can contain
         a time-only value or a
         date and time value in a date field and cannot be integers
         representing milliseconds since Epoch. The time zone for time window
         fields is specified using theparameter. If a time field, such as, has
         a time-only value (for example, 8:00 a.m.), the date is assumed to be
         the date specified by the Default Date property of the analysis layer.
         Using date and time values (for example, 7/11/2010 8:00 a.m.) allows
         you to set time windows that span multiple days. Time Zone
         Usage for Time_FieldsTimeWindowStart1The default date is ignored when
         any time window field includes a date
         with the time. To avoid an error in this situation, format all time
         windows in Depots, Routes, Orders, and Breaks to also include the date
         with the time.If you're using traffic data, the time-of-day fields for
         the network
         location always reference the same time zone as the edge on which the
         network location is located.TimeWindowEnd1The ending time of the first
         time window for the network location.
         This field can contain a null value; a null value indicates no ending
         time.TimeWindowStart2The beginning time of the second time window for
         the network location.
         This field can contain a null value; a null value indicates that there
         is no second time window. If the first time window is null as
         specified by theandfields,
         the second time window must also be null.
         TimeWindowStart1TimeWindowEnd1If both time windows are nonnull, they
         can't overlap. Also, the second
         time window must occur after the first.TimeWindowEnd2The ending time
         of the second time window for the network location.
         This field can contain a null value. Whenandare both null,
         there is no second time window.
         TimeWindowStart2TimeWindowEnd2        Whenis not null butis null,
         there is a second time window that
         has a starting time but no ending time. This is valid.
         TimeWindowStart2TimeWindowEnd2MaxViolationTime1A time window is
         considered violated if the arrival time occurs after
         the time window has ended. This field specifies the maximum allowable
         violation time for the first time window of the order. It can contain
         a zero value but can't contain negative values. A zero value indicates
         that a time window violation at the first time window of the order is
         unacceptable; that is, the first time window is hard. On the other
         hand, a null value indicates that there is no limit on the allowable
         violation time. A nonzero value specifies the maximum amount of
         lateness; for example, a route can arrive at an order up to 30 minutes
         beyond the end of its first time window. The unit for this
         field value is specified by theparameter
         (time_units in Python). Time Field Units        Time window
         violations can be tracked and weighted by the
         solver. Because of this, you can direct the VRP solver to take one of
         three approaches:        Minimize the overall violation time,
         regardless of the increase in
         travel cost for the fleet.Find a solution that balances overall
         violation time and travel cost.Ignore the overall violation time;
         instead, minimize the travel cost
         for the fleet. By assigning an importance level for
         theparameter
         (time_window_factor in Python), you are essentially choosing one of
         these three approaches. In any case, the solver will return an error
         if the value set foris surpassed. Time Window Violation
         ImportanceMaxViolationTime1MaxViolationTime2        The maximum
         allowable violation time for the second time
         window of the order. This field is analogous to thefield.
         MaxViolationTime1InboundArriveTimeDefines when the item to be
         delivered to the order will be ready at
         the starting depot.The order can be assigned to a route only if the
         inbound arrive time
         precedes the route's latest start time value; this way, the route
         cannot leave the depot before the item is ready to be loaded onto
         it.This field can help model scenarios involving inbound-wave
         transshipments. For example, a job at an order requires special
         materials that are not currently available at the depot. The materials
         are being shipped from another location and will arrive at the depot
         at 11:00 a.m. To ensure a route that leaves before the shipment
         arrives isn't assigned to the order, the order's inbound arrive time
         is set to 11:00 a.m. The special materials arrive at 11:00 a.m., they
         are loaded onto the vehicle, and the vehicle departs from the depot to
         visit its assigned orders.The route's start time, which includes
         service times, must occur after
         the inbound arrive time. If a route begins before an order's inbound
         arrive time, the order cannot be assigned to the route. The assignment
         is invalid even if the route has a start-depot service time that lasts
         until after the inbound arrive time. This time field can
         contain a time-only value or a date and
         time value. If a time-only value is set (for example, 11:00 AM), the
         date is assumed to be the date specified by theproperty of the
         analysis layer. The default date is ignored, however, when any time
         field in Depots, Routes, Orders, or Breaks includes a date with the
         time. In that case, specify all such fields with a date and time (for
         example, 7/11/2015 11:00 AM). Default Date           The VRP
         solver honorsregardless of thevalue.
         InboundArriveTimeDeliveryQuantitiesIf an outbound depart time is also
         specified, its time value must
         occur after the inbound arrive time.The VRP solver is not designed to
         solve problems more than one year in
         duration. All service times and time windows must be less than a
         year.OutboundDepartTimeDefines when the item to be picked up at the
         order must arrive at the
         ending depot.The order can be assigned to a route only if the route
         can visit the
         order and reach its end depot before the specified outbound depart
         time.This field can help model scenarios involving outbound-wave
         transshipments. For instance, a shipping company sends out delivery
         trucks to pick up packages from orders and bring them into a depot
         where they are forwarded on to other facilities, en route to their
         final destination. At 3:00 p.m. every day, a semitrailer stops at the
         depot to pick up the high-priority packages and take them directly to
         a central processing station. To avoid delaying the high-priority
         packages until the next day's 3:00 p.m. trip, the shipping company
         tries to have delivery trucks pick up the high-priority packages from
         orders and bring them to the depot before the 3:00 p.m. deadline. This
         is done by setting the outbound depart time to 3:00 p.m.The route's
         end time, including service times, must occur before the
         outbound depart time. If a route reaches a depot but doesn't complete
         its end-depot service time prior to the order's outbound depart time,
         the order cannot be assigned to the route. This time field
         can contain a time-only value or a date and
         time value. If a time-only value is set (for example, 11:00 AM), the
         date is assumed to be the date specified by theproperty of the
         analysis layer. The default date is ignored, however, when any time
         field in Depots, Routes, Orders, or Breaks includes a date with the
         time. In that case, specify all such fields with a date and time (for
         example, 7/11/2015 11:00 AM). Default Date          The VRP
         solver honorsregardless of thevalue.
         OutboundDepartTimePickupQuantitiesIf an inbound arrive time is also
         specified, its time value must occur
         before the outbound depart time.DeliveryQuantitiesThe size of the
         delivery. You can specify size in any dimension you
         want, such as weight, volume, or quantity. You can even specify
         multiple dimensions, for example, weight and volume.Enter delivery
         quantities without indicating units. For example, if a
         300-pound object needs to be delivered to an order, enter 300. You
         will need to remember that the value is in pounds.If you are tracking
         multiple dimensions, separate the numeric values
         with a space. For example, if you are recording the weight and volume
         of a delivery that weighs 2,000 pounds and has a volume of 100 cubic
         feet, enter 2000 100. Again, you need to remember the units-in this
         case, pounds and cubic feet. You also need to remember the sequence in
         which you entered the values and their corresponding units.
         Make sure thatforandandforare specified in the same manner;
         that is, the values need to be in the same units, and if you are using
         multiple dimensions, the dimensions need to be listed in the same
         sequence for all parameters. So if you specify weight in pounds,
         followed by volume in cubic feet for, the capacity of your routes and
         the pickup quantities of your orders need to be specified the same
         way: weight in pounds and then volume in cubic feet. If you mix units
         or change the sequence, you will get unwanted results without
         receiving any warning messages. CapacitiesRoutesDeliveryQuantit
         iesPickupQuantitiesOrdersDeliveryQuantitiesAn empty string or null
         value is equivalent to all dimensions being
         zero. If the string has an insufficient number of values in relation
         to the capacity count, or dimensions being tracked, the remaining
         values are treated as zeros. Delivery quantities can't be
         negative.PickupQuantities        The size of the pickup. You can
         specify size in any dimension
         you want, such as weight, volume, or quantity. You can even specify
         multiple dimensions, for example, weight and volume. You cannot,
         however, use negative values. This field is analogous to thefield of.
         DeliveryQuantitiesOrdersRevenueThe income generated if the order is
         included in a solution. This
         field can contain a null value-a null value indicates zero revenue-but
         it can't have a negative value. Revenue is included in
         optimizing the objective function value
         but is not part of the solution's operating cost. That is, thefield in
         the route class never includes revenue in its output; however, revenue
         weights the relative importance of servicing orders.
         TotalCostSpecialtyNamesA space-separated string containing the names
         of the specialties
         required by the order. A null value indicates that the order doesn't
         require specialties.The spelling of any specialties listed in the
         Orders and Routes
         classes must match exactly so the VRP solver can link them together.
         To illustrate what specialties are and how they work, assume a
         lawn care and tree trimming company has a portion of its orders that
         requires a bucket truck to trim tall trees. The company would enter
         BucketTruck in thefield for these orders to indicate their special
         need.would be left as null for the other orders. Similarly, the
         company would also enter BucketTruck in thefield of routes that are
         driven by trucks with hydraulic booms. It would leave the field null
         for the other routes. At solve time, the VRP solver assigns orders
         without special needs to any route, but it only assigns orders that
         need bucket trucks to routes that have them.
         SpecialtyNamesSpecialtyNamesSpecialtyNamesAssignmentRule        This
         field specifies the rule for assigning the order to a
         route. It is constrained by a domain of values, which are listed below
         (their coded values are shown in parentheses). Exclude (0)-The
         order is to be excluded from the subsequent solve
         operation. Preserve route and relative sequence (1)-The
         solver must
         always assign the order to the preassigned route and at the
         preassigned relative sequence during the solve operation. If this
         assignment rule can't be followed, it results in an order violation.
         With this setting, only the relative sequence is
         maintained, not the absolute sequence. To illustrate what this means,
         imagine there are two orders: A and B. They have sequence values of 2
         and 3, respectively. If you set theirfield values to Preserve route
         and relative sequence, A's and B's actual sequence values may change
         after solving because other orders, breaks, and depot visits could
         still be sequenced before, between, or after A and B. However, B
         cannot be sequenced before A. AssignmentRulePreserve route
         (2)-The solver must always assign the order to the
         preassigned route during the solve operation. A valid sequence must
         also be set even though the sequence may or may not be preserved. If
         the order can't be assigned to the specified route, it results in an
         order violation.Override (3)-The solver ignores the route and sequence
         preassignment
         (if any) for the order during the solve operation. It assigns a route
         and sequence to the order so as to minimize the overall value of the
         objective function. This is the default value.Anchor first (4)-The
         solver ignores the route and sequence
         preassignment (if any) for the order during the solve operation. It
         assigns a route to the order, and makes it the first order on that
         route, so as to minimize the overall value of the objective
         function.Anchor last (5)-The solver ignores the route and sequence
         preassignment (if any) for the order during the solve operation. It
         assigns a route to the order, and makes it the last order on that
         route, so as to minimize the overall value of the objective
         function.This field can't contain a null value.CurbApproach
         Theproperty specifies the direction a vehicle may arrive at
         and depart from the network location. There are four choices (their
         coded values are shown in parentheses):        CurbApproachEither side
         of vehicle (0)-The vehicle can approach and depart the
         network location in either direction. U-turns are allowed. You should
         choose this setting if your vehicle can make a U-turn at the stop or
         if it can pull into a driveway or parking lot and turn around.Right
         side of vehicle (1)-When the vehicle approaches and departs the
         network location, the curb must be on the right side of the vehicle. A
         U-turn is prohibited.Left side of vehicle (2)-When the vehicle
         approaches and departs the
         network location, the curb must be on the left side of the vehicle. A
         U-turn is prohibited.No U-Turn (3)-When the vehicle approaches the
         network location, the
         curb can be on either side of the vehicle; however, the vehicle must
         depart without turning around.RouteNameThe name of the route to which
         the order is assigned.As an input field, this field is used to
         preassign an order to a
         specific route. It can contain a null value, indicating that the order
         is not preassigned to any route, and the solver determines the best
         possible route assignment for the order. If this is set to null, the
         sequence field must also be set to null. After a solve
         operation, if the order is routed, thefield
         contains the name of the route that the order is assigned to.
         RouteNameSequenceThis indicates the sequence of the order on its
         assigned route. As an input field, this field is used to
         specify the relative
         sequence for an order on the route. This field can contain a null
         value specifying that the order can be placed anywhere along the
         route. A null value can only occur together with a nullvalue.
         RouteNameThe input sequence values are non-negative and unique for
         each route
         (shared across depot visits, orders, and breaks), but do not need to
         start from 0 or be contiguous. After a solve operation,
         thefield contains the sequence value
         of the order on its assigned route. Output sequence values for a route
         are shared across depot visits, orders, and breaks; start from 1 (at
         the starting depot); and are consecutive. So the smallest possible
         output sequence value for a routed order is 2, since a route always
         begins at a depot. Sequence
     depots (Feature Set):
         A depot is a location that a vehicle departs from at the beginning of
         the workday and returns to at the end of the workday. Vehicles are
         loaded (for deliveries) or unloaded (for pickups) at depots at the
         start of the route. In some cases, a depot can also act as a renewal
         location, whereby the vehicle can unload or reload and continue
         performing deliveries and pickups. A depot has open and close times,
         as specified by a hard time window. Vehicles can't arrive at a depot
         outside of this time window.The depots feature set has an associated
         attribute table. The fields
         in the attribute table are described below.ObjectIDThe system-managed
         ID field.ShapeThe geometry field indicating the geographic location of
         the network
         analysis object.Name        The name of the depot. Theandfields of the
         routes record set
         reference the name you specify here. It is also referenced by the
         route renewals record set, when used.
         StartDepotNameEndDepotNameDepot names are not case sensitive, must not
         be empty, and must be
         unique.TimeWindowStart1The beginning time of the first time window for
         the network location.
         This field can contain a null value; a null value indicates no
         beginning time. Time window fields can contain a time-only
         value or a date
         and time value. If a time field has a time-only value (for example,
         8:00 a.m.), the date is assumed to be the date specified by
         theparameter of the analysis layer. Using date and time values (for
         example, 7/11/2010 8:00 a.m.) allows you to set time windows that span
         multiple days. Default DateThe default date is ignored when
         any time window field includes a date
         with the time. To avoid an error in this situation, format all time
         windows in Depots, Routes, Orders, and Breaks to also include the date
         with the time.If you're using traffic data, the time-of-day fields for
         the network
         location always reference the same time zone as the edge on which the
         network location is located.TimeWindowEnd1The ending time of the first
         time window for the network location.
         This field can contain a null value; a null value indicates no ending
         time.TimeWindowStart2The beginning time of the second time window for
         the network location.
         This field can contain a null value; a null value indicates that there
         is no second time window. If the first time window is null as
         specified by theandfields,
         the second time window must also be null.
         TimeWindowStart1TimeWindowEnd1If both time windows are nonnull, they
         can't overlap. Also, the second
         time window must occur after the first.TimeWindowEnd2The ending time
         of the second time window for the network location.
         This field can contain a null value. Whenandare both null,
         there is no second time window.
         TimeWindowStart2TimeWindowEnd2        Whenis not null butis null,
         there is a second time window that
         has a starting time but no ending time. This is valid.
         TimeWindowStart2TimeWindowEnd2CurbApproach        Theproperty
         specifies the direction a vehicle may arrive at
         and depart from the network location. There are four choices (their
         coded values are shown in parentheses):        CurbApproachEither side
         of vehicle (0)-The vehicle can approach and depart the
         network location in either direction. U-turns are allowed. You should
         choose this setting if your vehicle can make a U-turn at the stop or
         if it can pull into a driveway or parking lot and turn around.Right
         side of vehicle (1)-When the vehicle approaches and departs the
         network location, the curb must be on the right side of the vehicle. A
         U-turn is prohibited.Left side of vehicle (2)-When the vehicle
         approaches and departs the
         network location, the curb must be on the left side of the vehicle. A
         U-turn is prohibited.No U-Turn (3)-When the vehicle approaches the
         network location, the
         curb can be on either side of the vehicle; however, the vehicle must
         depart without turning around.Bearing        The direction in which a
         point is moving. The units are
         degrees and are measured in a clockwise fashion from true north. This
         field is used in conjunction with thefield. BearingTolBearing
         data is usually sent automatically from a mobile device that
         is equipped with a GPS receiver. Try to include bearing data if you
         are loading an order that is moving, such as a pedestrian or a
         vehicle.Using this field tends to prevent adding locations to the
         wrong edges,
         which can occur when a vehicle is near an intersection or an overpass,
         for example. Bearing also helps Network Analyst determine which side
         of the street the point is on.For more information, see Bearing and
         BearingTol.BearingTol        The bearing tolerance value creates a
         range of acceptable
         bearing values when locating moving points on an edge using thefield.
         If the value from thefield is within the range of acceptable values
         that are generated from the bearing tolerance on an edge, the point
         can be added as a network location there; otherwise, the closest point
         on the next-nearest edge is evaluated. BearingBearingThe units
         are in degrees, and the default value is 30. Values must be
         greater than zero and less than 180.A value of 30 means that when
         Network Analyst attempts to add a
         network location on an edge, a range of acceptable bearing values is
         generated 15º to either side of the edge (left and right) and in both
         digitized directions of the edge.For more information, see Bearing and
         BearingTol.NavLatency        This field is only used in the solve
         process ifandalso have
         values; however, entering avalue is optional, even when values are
         present inand. Thefield indicates how much time is expected to elapse
         from the moment GPS information is sent from a moving vehicle to a
         server and the moment the processed route is received by the vehicle's
         navigation device. The time units ofare the same as the units of the
         cost attribute specified by theparameter.
         BearingBearingTolNavLatencyBearingBearingTolNavLatencyNavLatencyTime
         Attribute
     routes (Record Set):
         The routes that are available for the given vehicle routing problem. A
         route specifies vehicle and driver characteristics. After solving, it
         also represents the path between depots and orders.A route can have
         start and end depot service times, a fixed or
         flexible starting time, time-based operating costs, distance-based
         operating costs, multiple capacities, various constraints on a
         driver's workday, and so on.The routes record set has several
         attributes. The fields in the
         attribute table are described below.NameThe name of the route. The
         name must be unique.Network Analyst generates a unique name at solve
         time if the field
         value is null. Entering a value is optional in most cases. However,
         you must enter a name if the analysis includes breaks, route renewals,
         route zones, or orders that are preassigned to a route, because the
         route name is used as a foreign key in these cases. Route names are
         not case sensitive.StartDepotName        The name of the starting
         depot for the route. This field is a
         foreign key to thefield in theparameter. NameDepots        If
         thevalue is null, the route will begin from the first order
         assigned. Omitting the start depot is useful when the vehicle's
         starting location is unknown or irrelevant to your problem. However,
         whenis null,cannot also be null.
         StartDepotNameStartDepotNameEndDepotNameVirtual start depots are not
         allowed if orders or depots are in
         multiple time zones. If the route is making deliveries andis
         null, it is assumed
         the cargo is loaded on the vehicle at a virtual depot before the route
         begins. For a route that has no renewal visits, its delivery orders
         (those with nonzerovalues in the Orders class) are loaded at the start
         depot or virtual depot. For a route that has renewal visits, only the
         delivery orders before the first renewal visit are loaded at the start
         depot or virtual depot.
         StartDepotNameDeliveryQuantitiesEndDepotName        The name of the
         ending depot for the route. This field is a
         foreign key to thefield in theparameter.
         NameDepotsStartDepotServiceTimeThe service time at the starting depot.
         This can be used to model the
         time spent for loading the vehicle. This field can contain a null
         value; a null value indicates zero service time. The unit for
         this field value is specified by theparameter
         (time_units in Python). Time Field Units        The service
         times at the start and end depots are fixed values
         (given by theandfield values) and do not take into account the actual
         load for a route. For example, the time taken to load a vehicle at the
         starting depot may depend on the size of the orders. As such, the
         depot service times could be given values corresponding to a full
         truckload or an average truckload, or you could make your own time
         estimate.
         StartDepotServiceTimeEndDepotServiceTimeEndDepotServiceTimeThe service
         time at the ending depot. This can be used to model the
         time spent for unloading the vehicle. This field can contain a null
         value; a null value indicates zero service time. The unit for
         this field value is specified by theparameter
         (time_units in Python). Time Field Units        The service
         times at the start and end depots are fixed values
         (given by theandfield values) and do not take into account the actual
         load for a route. For example, the time taken to load a vehicle at the
         starting depot may depend on the size of the orders. As such, the
         depot service times could be given values corresponding to a full
         truckload or an average truckload, or you could make your own time
         estimate.
         StartDepotServiceTimeEndDepotServiceTimeEarliestStartTimeThe earliest
         allowable starting time for the route. This is used by
         the solver in conjunction with the time window of the starting depot
         for determining feasible route start times. This field can't
         contain null values and has a default time-
         only value of 8:00 a.m. The default value is interpreted as 8:00 a.m.
         on the date specified by theparameter (default_date in Python).
         Default DateThe default date is ignored when any time window field
         includes a date
         with the time. To avoid an error in this situation, format all time
         windows in Depots, Routes, Orders, and Breaks to also include the date
         with the time. When using network datasets with traffic data
         across multiple
         time zones, the time zone foris the same as the time zone of the edge
         or junction on which the starting depot is located.
         EarliestStartTimeLatestStartTimeThe latest allowable starting time for
         the route. This field can't
         contain null values and has a default time-only value of 10:00 a.m.
         The default value is interpreted as 10:00 a.m. on the date specified
         by the Default Date property of the analysis layer. When using
         network datasets with traffic data across multiple
         time zones, the time zone foris the same as the time zone of the edge
         or junction on which the starting depot is located.
         LatestStartTimeArriveDepartDelay        This field stores the amount
         of travel time needed to
         accelerate the vehicle to normal travel speeds, decelerate it to a
         stop, and move it off and on the network (for example, in and out of
         parking). By including anvalue, the VRP solver is deterred from
         sending many routes to service physically coincident orders.
         ArriveDepartDelay        The cost for this property is incurred
         between visits to
         noncoincident orders, depots, and route renewals. For example, when a
         route starts from a depot and visits the first order, the total
         arrive/depart delay is added to the travel time. The same is true when
         traveling from the first order to the second order. If the second and
         third orders are coincident, thevalue is not added between them since
         the vehicle doesn't need to move. If the route travels to a route
         renewal, the value is added to the travel time again.
         ArriveDepartDelay        Although a vehicle needs to slow down and
         stop for a break and
         accelerate afterward, the VRP solver cannot add thevalue for breaks.
         This means that if a route leaves an order, stops for a break, and
         continues to the next order, the arrive/depart delay is added only
         once, not twice. ArriveDepartDelayTo illustrate, assume there
         are five coincident orders in a high-rise
         building, and they are serviced by three different routes. This means
         three arrive/depart delays would be incurred; that is, three drivers
         would need to separately find parking places and enter the same
         building. However, if the orders could be serviced by just one route
         instead, only one driver would need to park and enter the
         building-only one arrive/depart delay would be incurred. Since the VRP
         solver tries to minimize cost, it will try to limit the arrive/depart
         delays and thus choose the single-route option. (Note that multiple
         routes may need to be sent when other constraints-such as specialties,
         time windows, or capacities-require it.)        The unit for this
         field value is specified by theparameter
         (time_units in Python). Time Field UnitsCapacitiesThe maximum
         capacity of the vehicle. You can specify capacity in any
         dimension, such as weight, volume, or quantity. You can also specify
         multiple dimensions, for example, weight and volume.Enter capacities
         without indicating units. For example, if your
         vehicle can carry a maximum of 40,000 pounds, enter 40000. You need to
         remember for future reference that the value is in pounds.If you are
         tracking multiple dimensions, separate the numeric values
         with a space. For example, if you are recording both weight and volume
         and your vehicle can carry a maximum weight of 40,000 pounds and a
         maximum volume of 2,000 cubic feet, enter 40000 2000. Again, you need
         to remember the units. You also need to remember the sequence you
         enter the values and their corresponding units (pounds followed by
         cubic feet in this case). Remembering the units and the unit
         sequence is important for a
         couple of reasons: so you can reinterpret the information later and so
         you can properly enter values for theandfields for theparameter. The
         VRP solver simultaneously refers to,, andto ensure that a route
         doesn't become overloaded. Since units can't be entered in the field,
         Network Analyst can't make unit conversions. You need to enter the
         values for the three fields using the same units and the same unit
         sequence so that the values are correctly interpreted. If you combine
         units or change the sequence in any of the three fields, unexpected
         results will be generated with no warning messages. It is recommended
         that you set up a unit and unit-sequence standard first and refer to
         it when you enter values for these three fields. DeliveryQuanti
         tiesPickupQuantitiesOrdersCapacitiesDeliveryQuantitiesPickupQuantities
         An empty string or null value is equivalent to all values being zero.
         Capacity values can't be negative. If thefield has an
         insufficient number of values in relation
         to theorfield for orders, the remaining values are treated as zero.
         CapacitiesDeliveryQuantitiesPickupQuantitiesThe VRP solver only
         performs a simple Boolean test to determine
         whether capacities are exceeded. If a route's capacity value is
         greater than or equal to the total quantity being carried, the VRP
         solver will assume the cargo fits in the vehicle. This could be
         incorrect, depending on the actual shape of the cargo and the vehicle.
         For example, the VRP solver allows you to fit a 1,000-cubic-foot
         sphere into a 1,000-cubic-foot truck that is 8 feet wide. In reality,
         however, since the sphere is 12.6 feet in diameter, it won't fit in
         the 8-foot-wide truck.FixedCostA fixed monetary cost that is incurred
         only if the route is used in a
         solution (that is, it has orders assigned to it). This field can
         contain null values; a null value indicates zero fixed cost. This cost
         is part of the total route operating cost.CostPerUnitTimeThe monetary
         cost incurred-per unit of work time-for the total route
         duration, including travel times as well as service times and wait
         times at orders, depots, and breaks. This field can't contain a null
         value and has a default value of 1.0. The unit for this field
         value is specified by theparameter
         (time_units in Python). Time Field UnitsCostPerUnitDistanceThe
         monetary cost incurred-per unit of distance traveled-for the route
         length (total travel distance). This field can contain null values; a
         null value indicates zero cost. The unit for this field value
         is specified by theparameter
         (distance_units for Python). Distance Field
         UnitsOvertimeStartTimeThe duration of regular work time before
         overtime computation begins.
         This field can contain null values; a null value indicates that
         overtime does not apply. The unit for this field value is
         specified by theparameter
         (time_units in Python). Time Field Units        For example, if
         the driver is to be paid overtime when the
         total route duration extends beyond eight hours,is specified as 480 (8
         hours * 60 minutes/hour) when theparameter is set to.
         OvertimeStartTimeTime Field UnitsMinutesCostPerUnitOvertime        The
         monetary cost incurred per time unit of overtime work.
         This can only contain a null value ifis also null. Otherwise it must
         be a positive value greater than the.
         OvertimeStartTimeCostPerUnitTimeMaxOrderCountThe maximum allowable
         number of orders on the route. This field can't
         contain null values and has a default value of 30.MaxTotalTimeThe
         maximum allowable route duration. The route duration includes
         travel times as well as service and wait times at orders, depots, and
         breaks. This field can contain null values; a null value indicates
         that there is no constraint on the route duration. The unit for
         this field value is specified by theparameter
         (time_units in Python). Time Field UnitsMaxTotalTravelTimeThe
         maximum allowable travel time for the route. The travel time
         includes only the time spent driving on the network and does not
         include service or wait times. This field can contain null
         values; a null value indicates
         there is no constraint on the maximum allowable travel time. This
         field value can't be larger than thefield value. MaxTotalTime
         The unit for this field value is specified by theparameter
         (time_units in Python). Time Field UnitsMaxTotalDistanceThe
         maximum allowable travel distance for the route. The unit for
         this field value is specified by theparameter
         (distance_units for Python). Distance Field UnitsThis field can
         contain null values; a null value indicates that there
         is no constraint on the maximum allowable travel
         distance.SpecialtyNamesA space-separated string containing the names
         of the specialties
         supported by the route. A null value indicates that the route does not
         support any specialties. This field is a foreign key to
         thefield in theparameter.
         SpecialtyNamesOrders        To illustrate what specialties are and how
         they work, assume a
         lawn care and tree trimming company has a portion of its orders that
         requires a bucket truck to trim tall trees. The company would enter
         BucketTruck in thefield for these orders to indicate their special
         need.would be left as null for the other orders. Similarly, the
         company would also enter BucketTruck in thefield of routes that are
         driven by trucks with hydraulic booms. It would leave the field null
         for the other routes. At solve time, the VRP solver assigns orders
         without special needs to any route, but it only assigns orders that
         need bucket trucks to routes that have them.
         SpecialtyNamesSpecialtyNamesSpecialtyNamesAssignmentRule        This
         specifies whether or not the route can be used when
         solving the problem. This field is constrained by a domain of values,
         and the possible values are the following:        Include-The route is
         included in the solve operation. This is the
         default value.Exclude-The route is excluded from the solve operation.
     breaks {Record Set}:
         The rest periods, or breaks, for the routes in a vehicle routing
         problem. A break is associated with exactly one route, and it can be
         taken after completing an order, while en route to an order, or before
         servicing an order. It has a start time and a duration for which the
         driver may or may not be paid. There are three options for
         establishing when a break begins: using a time window, a maximum
         travel time, or a maximum work time.The breaks record set has
         associated attributes. The fields in the
         attribute table are described below.ObjectIDThe system-managed ID
         field.RouteNameThe name of the route that the break applies to.
         Although a break is
         assigned to exactly one route, many breaks can be assigned to the same
         route. This field is a foreign key to thefield in theclass and
         can't
         have a null value. NameRoutesPrecedencePrecedence values
         sequence the breaks of a given route. Breaks with a
         precedence value of 1 occur before those with a value of 2, and so
         on.All breaks must have a precedence value, regardless of whether they
         are time-window, maximum-travel-time, or maximum-work-time
         breaks.ServiceTimeThe duration of the break. This field can't contain
         null values and
         has a default value of 60. The unit for this field value is
         specified by theparameter
         (time_units in Python). Time Field UnitsTimeWindowStartThe
         starting time of the break's time window. Half-open time windows
         are invalid for Breaks. If this field has a value,andmust be
         null; moreover, all other
         breaks in the analysis layer must have null values forand. MaxT
         ravelTimeBetweenBreaksMaxCumulWorkTimeMaxTravelTimeBetweenBreaksMaxCum
         ulWorkTimeAn error will occur at solve time if a route has multiple
         breaks with
         overlapping time windows. The time window fields in breaks can
         contain a time-only value
         or a date and time value in a date field and cannot be integers
         representing milliseconds since Epoch. The time zone for time window
         fields is specified using the
         Timeparameter(time_zone_usage_for_time_fields in Python). If a time
         field, such as, has a time-only value (for example, 12:00 p.m.), the
         date is assumed to be the date specified by theparameter (default_date
         in Python). Using date and time values (for example, 7/11/2012 12:00
         p.m.) allows you to specify time windows that span two or more days.
         This is beneficial when a break should be taken before and after
         midnight. Zone Usage for Time FieldsTimeWindowStartDefault
         DateThe default date is ignored when any time window field includes a
         date
         with the time. To avoid an error in this situation, format all time
         windows in Depots, Routes, Orders, and Breaks to also include the date
         with the time.TimeWindowEndThe ending time of the break's time window.
         Half-open time windows are
         invalid for Breaks. If this field has a value,andmust be null;
         moreover, all other
         breaks in the analysis layer must have null values forand. MaxT
         ravelTimeBetweenBreaksMaxCumulWorkTimeMaxTravelTimeBetweenBreaksMaxCum
         ulWorkTimeMaxViolationTimeThis field specifies the maximum allowable
         violation time for a time-
         window break. A time window is considered violated if the arrival time
         falls outside the time range. A zero value indicates that the
         time window cannot be
         violated; that is, the time window is hard. A nonzero value specifies
         the maximum amount of lateness. For example, the break can begin up to
         30 minutes beyond the end of its time window, but the lateness is
         penalized pursuant to theparameter (in Python). Time Window
         Violation Importancetime_window_factor        This property can be
         null; a null value withandvalues
         indicates that there is no limit on the allowable violation time.
         Iforhas a value,must be null. TimeWindowStartTimeWindowEndMaxTr
         avelTimeBetweenBreaksMaxCumulWorkTimeMaxViolationTime        The unit
         for this field value is specified by theparameter
         (time_units in Python). Time Field
         UnitsMaxTravelTimeBetweenBreaksThe maximum amount of travel time that
         can be accumulated before the
         break is taken. The travel time is accumulated either from the end of
         the previous break or, if a break has not yet been taken, from the
         start of the route. If this is the route's final break,also
         indicates the maximum
         travel time that can be accumulated from the final break to the end
         depot. MaxTravelTimeBetweenBreaks        This field is limits
         how long a person can drive until a break
         is required. For example, if theparameter (time_units in Python) of
         the analysis is set to, andhas a value of 120, the driver will get a
         break after two hours of driving. To assign a second break after two
         more hours of driving, thefield value for the second break should be
         120. Time Field
         UnitsMinutesMaxTravelTimeBetweenBreaksMaxTravelTimeBetweenBreaks
         If this field has a value,,,, andmust be null for an analysis
         to solve successfully.
         TimeWindowStartTimeWindowEndMaxViolationTimeMaxCumulWorkTime
         The unit for this field value is specified by theparameter
         (time_units in Python). Time Field UnitsMaxCumulWorkTimeThe
         maximum amount of work time that can be accumulated before the
         break is taken. Work time is always accumulated from the beginning of
         the route.Work time is the sum of travel time and service times at
         orders,
         depots, and breaks. Note, however, that this excludes wait time, which
         is the time a route (or driver) spends waiting at an order or depot
         for a time window to begin. This field limits how long a person
         can work until a break is
         required. For example, if theparameter (time_units in Python) is set
         to,has a value of 120, andhas a value of 15, the driver will get a
         15-minute break after two hours of work. Time Field
         UnitsMinutesMaxCumulWorkTimeServiceTime        Continuing with the
         last example, assume a second break is
         needed after three more hours of work. To specify this break, you
         would enter 315 (five hours and 15 minutes) as the second
         break'svalue. This number includes theandvalues of the preceding
         break, along with the three additional hours of work time before
         granting the second break. To avoid taking maximum-work-time breaks
         prematurely, remember that they accumulate work time from the
         beginning of the route and that work time includes the service time at
         previously visited depots, orders, and breaks.
         MaxCumulWorkTimeMaxCumulWorkTimeServiceTime        If this field has a
         value,,,, andmust be null for an analysis
         to solve successfully.
         TimeWindowStartTimeWindowEndMaxViolationTimeMaxTravelTimeBetweenBreaks
         The unit for this field value is specified by theparameter
         (time_units in Python). Time Field UnitsIsPaidA Boolean value
         indicating whether the break is paid or unpaid. A True
         value indicates that the time spent at the break is included in the
         route cost computation and overtime determination. A False value
         indicates otherwise. The default value is True.SequenceAs an input
         field, this indicates the sequence of the break on its
         route. This field can contain null values. The input sequence values
         are positive and unique for each route (shared across renewal depot
         visits, orders, and breaks) but need not start from 1 or be
         contiguous.The solver modifies the sequence field. After solving, this
         field
         contains the sequence value of the break on its route. Output sequence
         values for a route are shared across depot visits, orders, and breaks;
         start from 1 (at the starting depot); and are consecutive.
     time_units (String):
         Specifies the time units that will be used for all time-based field
         values in the analysis.Seconds-The time units will be
         seconds.Minutes-The time units will be
         minutes.Hours-The time units will be hours.Days-The time units will be
         days. Many features and records in a VRP analysis include
         fields for
         storing time values, such asfor orders andfor routes. To minimize data
         entry requirements, these field values don't include units. Instead,
         all time-based field values must be entered in the same units, and
         this parameter is used to specify the units for those values.
         ServiceTimeCostPerUnitTimeOutput time-based fields use the same units
         specified by this
         parameter. This time unit doesn't need to match the time unit
         of the
         networkparameter (time_attribute in Python). Time Attribute
     distance_units (String):
         Specifies the distance units that will be used for all distance-based
         field values in the analysis.Miles-The distance units will be
         miles.Kilometers-The distance units
         will be kilometers.Feet-The distance units will be feet.Yards-The
         distance units will be yards.Meters-The distance units will be
         meters.NauticalMiles-The distance units will be nautical miles.
         Many features and records in a VRP analysis include fields for
         storing distance values, such asandfor routes. To minimize data entry
         requirements, these field values don't include units. Instead, all
         distance-based field values must be entered in the same units, and
         this parameter is used to specify the units for those values.
         MaxTotalDistanceCostPerUnitDistanceOutput distance-based fields use
         the same units specified by this
         parameter. This distance unit doesn't need to match the
         distance unit of
         the networkparameter (distance attribute in Python). Distance
         Attribute
     network_dataset (Network Dataset Layer):
         The network dataset on which the vehicle routing problem analysis will
         be performed. The network dataset must have a time-based cost
         attribute, since the VRP solver minimizes time.
     output_workspace_location (Workspace):
         The file geodatabase or in-memory workspace in which the output
         feature classes will be created. This workspace must already exist.
         The default output workspace is in memory.
     output_unassigned_stops_name (String):
         The name of the output feature class that will contain any unreachable
         depots or unassigned orders.
     output_stops_name (String):
         The name of the feature class that will contain the stops visited by
         routes. This feature class includes stops at depots, orders, and
         breaks.
     output_routes_name (String):
         The name of the feature class that will contain the routes of the
         analysis.
     output_directions_name (String):
         The name of the feature class that will contain the directions for the
         routes.
     default_date {Date}:
         The default date for time field values that specify a time of day
         without including a date.
     uturn_policy {String}:
         Specifies the U-turn policy that will be used at junctions. Allowing
         U-turns implies that the solver can turn around at a junction and
         double back on the same street. Given that junctions represent street
         intersections and dead ends, different vehicles may be able to turn
         around at some junctions but not at others-it depends on whether the
         junction represents an intersection or a dead end. To accommodate
         this, the U-turn policy parameter is implicitly specified by the
         number of edges that connect to the junction, which is known as
         junction valency. The acceptable values for this parameter are listed
         below; each is followed by a description of its meaning in terms of
         junction valency.ALLOW_UTURNS-U-turns are permitted at junctions with
         any number of
         connected edges. This is the default value.NO_UTURNS-U-turns are
         prohibited at all junctions, regardless of
         junction valency. However, U-turns are still permitted at network
         locations even when this option is specified, but you can set the
         individual network location's CurbApproach property to prohibit
         U-turns there as well.ALLOW_DEAD_ENDS_ONLY-U-turns are prohibited at
         all junctions, except
         those that have only one adjacent edge (a dead
         end).ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY-U-turns are prohibited at
         junctions where exactly two adjacent edges meet but are permitted at
         intersections (junctions with three or more adjacent edges) and dead
         ends (junctions with exactly one adjacent edge). Often, networks have
         extraneous junctions in the middle of road segments. This option
         prevents vehicles from making U-turns at these locations.If you need a
         more precisely defined U-turn policy, consider adding a
         global turn delay evaluator to a network cost attribute or adjusting
         its settings if one exists, and pay particular attention to the
         configuration of reverse turns. You can also set the CurbApproach
         property of your network locations. The value of this parameter
         is overridden when(travel_mode in
         Python) is set to any value other than custom. Travel Mode
     time_window_factor {String}:
         Specifies the importance level that will be used when honoring time
         windows.Low-More importance will be placed on minimizing drive times
         and less
         on arriving at stops on time. This option is useful when you have a
         growing backlog of service requests. For the purpose of servicing more
         orders in a day and reducing the backlog, you can use this option even
         though customers may be inconvenienced with the late arrival
         times.Medium-The importance of minimizing drive times will be balanced
         with
         arriving within time windows. This is the default value.High-More
         importance will be placed on arriving at stops on time and
         less on minimizing drive times. This option is useful to organizations
         that make time-critical deliveries or that are concerned with customer
         service.
     spatially_cluster_routes {Boolean}:
         Specifies whether orders will be spatially clustered.CLUSTER-The
         orders assigned to an individual route will be spatially
         clustered. Clustering orders tends to keep routes in smaller areas and
         reduce how often route lines intersect one another, but clustering
         also tends to increase overall travel times. This is the
         default.NO_CLUSTER-Orders will not be spatially clustered and the
         route lines
         may intersect. Use this option if route zones are specified.
     route_zones {Feature Set}:
         Delineates work territories for given routes. A route zone is
         a polygon feature and is used to constrain routes to servicing only
         those orders that fall within or near the specified area. The
         following are examples of when route zones may be useful:        Some
         of your employees don't have the required permits to perform work
         in certain states or communities. You can create a hard route zone so
         they only visit orders in areas where they meet the requirements.One
         of your vehicles breaks down frequently, so you want to minimize
         response time by having it only visit orders that are close to your
         maintenance garage. You can create a soft or hard route zone to keep
         the vehicle nearby.The route zones feature set has an associated
         attribute table. The
         fields in the attribute table are described below.ObjectIDThe system-
         managed ID field.ShapeThe geometry field indicating the geographic
         location of the network
         analysis object.RouteName        The name of the route to which this
         zone applies. A route zone
         can have a maximum of one associated route. This field can't contain
         null values, and it is a foreign key to thefield in the Routes feature
         layer. NameIsHardZoneA Boolean value indicating a hard or soft
         route zone. A True value
         indicates that the route zone is hard; that is, an order that falls
         outside the route zone polygon can't be assigned to the route. The
         default value is True (1). A False value (0) indicates that such
         orders can still be assigned, but the cost of servicing the order is
         weighted by a function that is based on the Euclidean distance from
         the route zone. Basically, this means that as the straight-line
         distance from the soft zone to the order increases, the likelihood of
         the order being assigned to the route decreases.
     route_renewals {Record Set}:
         The intermediate depots that routes can visit to reload or unload the
         cargo they are delivering or picking up. Specifically, a route renewal
         links a route to a depot. The relationship indicates that the route
         can renew (reload or unload while en route) at the associated
         depot.Route renewals can be used to model scenarios in which a vehicle
         picks
         up a full load of deliveries at the starting depot, services the
         orders, returns to the depot to renew its load of deliveries, and
         continues servicing more orders. For example, in propane gas delivery,
         the vehicle may make several deliveries until its tank is nearly or
         completely depleted, visit a refueling point, and make more
         deliveries.The following are rules and options to consider when also
         working with
         route seed points:The reload/unload point, or renewal location, can be
         different from
         the start or end depot.Each route can have one or many predetermined
         renewal locations.A renewal location may be used more than once by a
         single route.In some cases where there may be several potential
         renewal locations
         for a route, the closest available renewal location is identified by
         the solver.The route renewals record set has associated attributes.
         The fields in
         the attribute table are described below.ObjectIDThe system-managed ID
         field.DepotName        The name of the depot where this renewal takes
         place. This
         field can't contain a null value and is a foreign key to thefield in
         the Depots feature layer. NameRouteName        The name of the
         route that this renewal applies to. This field
         can't contain a null value and is a foreign key to thefield in the
         Routes feature layer. NameServiceTimeThe service time for the
         renewal. This field can contain a null value;
         a null value indicates zero service time.The unit for this field value
         is specified by the Time Field Units
         property of the analysis layer.The time taken to load a vehicle at a
         renewal depot may depend on the
         size of the vehicle and how full or empty the vehicle is. However, the
         service time for a route renewal is a fixed value and does not take
         into account the actual load. As such, the renewal service time should
         be given a value corresponding to a full truckload, an average
         truckload, or another time estimate of your choice.
     order_pairs {Record Set}:
         Pairs pick up and deliver orders so they are serviced by the same
         route.Sometimes it is required that the pick up and delivery of orders
         be
         paired. For example, a courier company may need to have a route pick
         up a high-priority package from one order and deliver it to another
         without returning to a depot, or sorting station, to minimize delivery
         time. These related orders can be assigned to the same route with the
         appropriate sequence using order pairs. Restrictions on how long the
         package can stay in the vehicle can also be assigned. For example, the
         package might be a blood sample that has to be transported from the
         doctor's office to the lab within two hours.The order pairs record set
         has associated attributes. The fields in
         the attribute table are described below.ObjectIDThe system-managed ID
         field.FirstOrderName        The name of the first order of the pair.
         This field is a
         foreign key to thefield in the Orders feature layer.
         NameSecondOrderName        The name of the second order of the pair.
         This field is a
         foreign key to thefield in the Orders feature layer. Name
         The first order in the pair must be a pickup order; that is,
         the value for itsfield is null. The second order in the pair must be a
         delivery order; that is, the value for itsfield is null. The quantity
         that is picked up at the first order must agree with the quantity that
         is delivered at the second order. As a special case, both orders may
         have zero quantities for scenarios where capacities are not used.
         DeliveryQuantitiesPickupQuantitiesThe order quantities are not loaded
         or unloaded at depots.MaxTransitTimeThe maximum transit time for the
         pair. The transit time is the
         duration from the departure time of the first order to the arrival
         time at the second order. This constraint limits the time-on-vehicle,
         or ride time, between the two orders. When a vehicle is carrying
         people or perishable goods, the ride time is typically shorter than
         that of a vehicle carrying packages or nonperishable goods. This field
         can contain null values; a null value indicates that there is no
         constraint on the ride time.The unit for this field value is specified
         by the Time Field Units
         property of the analysis layer. Excess transit time (measured
         with respect to the direct
         travel time between order pairs) can be tracked and weighted by the
         solver. Because of this, you can direct the VRP solver to take one of
         three approaches: minimize the overall excess transit time, regardless
         of the increase in travel cost for the fleet; find a solution that
         balances overall violation time and travel cost; or ignore the overall
         excess transit time and, instead, minimize the travel cost for the
         fleet. By assigning an importance level for theparameter
         (excess_transit_factor in Python), you are in effect choosing one of
         these three approaches. Regardless of the importance level, the solver
         will always return an error if thevalue is surpassed. Excess
         Transit Time ImportanceMaxTransitTime
     excess_transit_factor {String}:
         Specifies the importance level of reducing excess transit time of
         order pairs. Excess transit time is the amount of time exceeding the
         time required to travel directly between the paired orders. Excess
         time can be caused by driver breaks or travel to intermediate orders
         and depots.Low-More importance will be placed on minimizing overall
         solution cost
         and less on excess transit time. This option is commonly used by
         courier services. Since couriers transport packages as opposed to
         people, they don't need to be concerned about ride time. Using this
         option allows the couriers to service paired orders in the proper
         sequence and minimize the overall solution cost.Medium-The importance
         of reducing excess transit time will be balanced
         with reducing the overall solution cost. This is the default
         value.High-More importance will be placed on the shortest transit time
         between paired orders and less on the overall travel costs. This
         option is useful if you are transporting people between paired orders
         and you want to shorten their ride time. This is characteristic of
         taxi services.
     point_barriers {Feature Set}:
         Specifies point barriers, which are split into two types: restriction
         and added cost point barriers. They temporarily restrict traversal
         across or add impedance to points on the network. The point barriers
         are defined by a feature set, and the attribute values you specify for
         the point features determine whether they are restriction or added
         cost barriers. The fields in the attribute table are listed and
         described below. :        ObjectIDThe system-managed ID field.
         :        ShapeThe geometry field indicating the geographic location of
         the network
         analysis object. :        NameThe name of the barrier. :
         BarrierType        Specifies whether the barrier restricts travel
         completely or
         adds cost when traveling through it. There are two options:
         (0)-Prohibits traversing through the barrier. This is the
         default value. Restriction          (2)-Traversing through
         the barrier increases the network
         cost by the amount specified in theandfields. Added
         CostAdditional_TimeAdditional_Distance        :        Additional_Time
         Ifis set to added cost, the value of thefield indicates how
         much time is added to a route when the route passes through the
         barrier. BarrierTypeAdditional_Time        The unit for this
         field value is specified by theproperty of
         the analysis layer. Time Field Units        :
         Additional_Distance        Ifis set to added cost, the value of
         thefield indicates how
         much impedance is added to a route when the route passes through the
         barrier. BarrierTypeAdditional_Distance        The unit for
         this field value is specified by theparameter.
         Distance Field Units
     line_barriers {Feature Set}:
         Specifies line barriers, which temporarily restrict traversal across
         them. The line barriers are defined by a feature set. The fields in
         the attribute table are listed and described below. :
         ObjectIDThe system-managed ID field. :        ShapeThe geometry
         field indicating the geographic location of the network
         analysis object. :        NameThe name of the barrier.
     polygon_barriers {Feature Set}:
         Specifies polygon barriers, which are split into two types:
         restriction and scaled cost polygon barriers. They temporarily
         restrict traversal or scale impedance on the parts of the network they
         cover. The polygon barriers are defined by a feature set, and the
         attribute values you specify for the polygon features determine
         whether they are restriction or scaled cost barriers. The fields in
         the attribute table are listed and described below. :
         ObjectIDThe system-managed ID field. :        ShapeThe geometry
         field indicating the geographic location of the network
         analysis object. :        NameThe name of the barrier. :
         BarrierTypeSpecifies whether the barrier restricts travel completely
         or scales
         the cost of traveling through it. There are two options:
         (0)-Prohibits traversing through any part of the barrier.
         This is the default value. Restriction         (1)-Scales the
         impedance of underlying edges by multiplying
         them by the value of the Attr_[Impedance] property. If edges are
         partially covered by the barrier, the impedance is apportioned and
         multiplied. Scaled Cost        :        Scaled_TimeThe time-
         based impedance values of the edges underlying the barrier
         are multiplied by the value set in this field. This field is only
         relevant when the barrier is a scaled cost barrier. :
         Scaled_DistanceThe distance-based impedance values of the edges
         underlying the
         barrier are multiplied by the value set in this field. This field is
         only relevant when the barrier is a scaled cost barrier.
     time_attribute {String}:
         The network cost attribute that will be used when determining the
         travel time of network elements. The value of this parameter is
         overridden when(travel_mode in
         Python) is set to any value other than custom. Travel Mode
     distance_attribute {String}:
         The network cost attribute that will be used when determining the
         distance of network elements. The value of this parameter is
         overridden when(travel_mode in
         Python) is set to any value other than custom. Travel Mode
     use_hierarchy_in_analysis {Boolean}:
         USE_HIERARCHY-The hierarchy attribute will be used for the analysis.
         Using a hierarchy results in the solver preferring higher-order edges
         to lower-order edges. Hierarchical solves are faster, and they can be
         used to simulate the preference of a driver who chooses to travel on
         freeways rather than local roads when possible-even if that means a
         longer trip. This option is valid only if the input network dataset
         has a hierarchy attribute.NO_HIERARCHY-The hierarchy attribute will
         not be used for the
         analysis, and the result will be an exact route for the network
         dataset.The parameter is not used if no hierarchy attribute is defined
         on the
         network dataset used to perform the analysis. The value of this
         parameter is overridden when(travel_mode in
         Python) is set to any value other than custom. Travel Mode
     restrictions {String}:
         Indicates which network restriction attributes are respected during
         solve time. The value of this parameter is overridden
         when(travel_mode in
         Python) is set to any value other than custom. Travel Mode
     attribute_parameter_values {Record Set}:
         Specifies the parameter values for network attributes that have
         parameters. The record set has two columns that work together to
         uniquely identify parameters and another column that specifies the
         parameter value. The value of this parameter is overridden
         when(travel_mode in
         Python) is set to any value other than custom. Travel ModeThe
         attribute parameter values record set has associated attributes.
         The fields in the attribute table are listed below and described.
         :        ObjectIDThe system-managed ID field. :
         AttributeNameThe name of the network attribute whose attribute
         parameter is set by
         the table row. :        ParameterNameThe name of the attribute
         parameter whose value is set by the table
         row. (Object type parameters cannot be updated using this tool.)
         :        ParameterValueThe value you want for the attribute parameter.
         If a value is not
         specified, the attribute parameter is set to null.
     maximum_snap_tolerance {Linear Unit}:
         The maximum snap tolerance is the furthest distance that Network
         Analyst searches when locating or relocating a point onto the network.
         The search looks for suitable edges or junctions and snaps the point
         to the nearest one. If a suitable location isn't found within the
         maximum snap tolerance, the object is marked as unlocated.
     exclude_restricted_portions_of_the_network {Boolean}:
         Specifies where network locations are placed.EXCLUDE-The network
         locations will only be placed on traversable
         portions of the network. This prevents placing network locations on
         elements that you can't reach due to restrictions or barriers. Before
         adding your network locations using this option, ensure that all the
         restriction barriers have been added to the input network analysis
         layer to get the expected results. This option is not applicable when
         adding barrier objects. In such cases, use "#" as the parameter
         value.INCLUDE-The network locations will be placed on all the elements
         of
         the network. The network locations that are added with this option may
         be unreachable during the solve process if they are placed on
         restricted elements.
     feature_locator_where_clause {Value Table}:
         An SQL expression that will be used to select a subset of source
         features that limits the network elements on which orders and depots
         can be located. For example, to ensure that orders and depots are not
         located on limited-access highways, write an SQL expression that
         excludes those source features. Other network analysis objects, such
         as barriers, ignore the feature locator WHERE clause when loading.
     populate_route_lines {Boolean}:
         Specifies whether lines that show the true shape of the routes will be
         generated.NO_ROUTE_LINES-No shape will be generated for the output
         routes. You
         cannot generate driving directions if route lines aren't
         created.ROUTE_LINES-The output routes will have the exact shape of the
         underlying network sources.
     route_line_simplification_tolerance {Linear Unit}:
         The simplification distance of the route geometry.Simplification
         maintains critical points on a route, such as turns at
         intersections, to define the essential shape of the route and removes
         other points. The simplification distance you specify is the maximum
         allowable offset that the simplified line can deviate from the
         original line. Simplifying a line reduces the number of vertices and
         tends to reduce drawing times. The value of this parameter is
         overridden when(travel_mode in
         Python) is set to any value other than custom. Travel Mode
     populate_directions {Boolean}:
         Specifies whether driving directions will be
         generated.DIRECTIONS-Driving directions will be generated. The feature
         class
         specified in the output_directions_name parameter is populated with
         turn-by-turn instructions for each route. The network dataset must
         support driving directions; otherwise, an error will occur when
         solving with directions.NO_DIRECTIONS-Driving directions will not be
         generated.
     directions_language {String}:
         The language in which driving directions will be generated. The
         languages available in the drop-down list depend on which ArcGIS
         language packs are installed on your computer.If you are going to
         publish this tool as part of a service on a
         separate server, the ArcGIS language pack that corresponds to the
         language you choose must be installed on that server for the tool to
         function properly. Also, if a language pack isn't installed on your
         computer, the language won't appear in the drop-down list; however,
         you can type a language code instead.
     directions_style_name {String}:
         Specifies the formatting style that will be used for directions.NA
         Desktop-The format will be printable turn-by-turn directions.NA
         Navigation-The format will be turn-by-turn directions designed for
         an in-vehicle navigation device.NA Campus-The format will be turn-by-
         turn walking directions designed
         for pedestrian routes.
     save_output_layer {Boolean}:
         Specifies whether the output will include a network analysis layer of
         the results.NO_SAVE_OUTPUT_LAYER-The output will not include a network
         analysis
         layer of the results.SAVE_OUTPUT_LAYER-The output will include a
         network analysis layer of
         the results.In either case, stand-alone tables and feature classes
         will be
         returned. However, a server administrator can output a network
         analysis layer so the setup and results of the tool can be debugged
         using the Network Analyst controls in the ArcGIS Desktop environment.
         This can make the debugging process easier.In ArcGIS Desktop, the
         default output location for the network
         analysis layer is in the scratch workspace, at the same level as the
         scratch geodatabase; that is, it is stored as a sibling of the scratch
         geodatabase. The output network analysis layer is stored as an .lyr
         file whose name starts with _ags_gpna and is followed by an
         alphanumeric GUID.
     service_capabilities {Value Table}:
         Specifies the maximum amount of computer processing that occurs when
         running this tool as a geoprocessing service. You can use this
         parameter to avoid having your server solve problems that require more
         resources or processing time than you want to expend, or to create
         multiple services with different VRP capabilities to support a
         business model. For example, if you have a tiered-service business
         model, you may want to provide a free VRP service that supports a
         maximum of five routes per solve and another service that is fee-based
         and supports more than five routes per solve.In addition to limiting
         the maximum number of routes, you can limit
         the number of orders or point barriers that can be added to the
         analysis. Another way to control problem sizes is by setting a maximum
         number of features-usually street features-that line or polygon
         barriers can intersect. You can also force a hierarchical solve, even
         if the user chooses not to use a hierarchy, when orders are
         geographically dispersed beyond a given straight-line distance.MAXIMUM
         POINT BARRIERS-Limit the maximum number of point barriers
         allowed. An error is returned if this limit is exceeded. A null value
         indicates there is no limit.MAXIMUM FEATURES INTERSECTING LINE
         BARRIERS-Limit the maximum number
         of source features that can be intersected by all line barriers in the
         analysis. An error is returned if this limit is exceeded. A null value
         indicates there is no limit.MAXIMUM FEATURES INTERSECTING POLYGON
         BARRIERS-Limit the maximum
         number of source features that can be intersected by all polygon
         barriers in the analysis. An error is returned if this limit is
         exceeded. A null value indicates there is no limit.MAXIMUM
         ORDERS-Limit the maximum number of orders allowed in the
         analysis. An error is returned if this limit is exceeded. A null value
         indicates there is no limit.MAXIMUM ROUTES-Limit the maximum number of
         routes allowed in the
         analysis. An error is returned if this limit is exceeded. A null value
         indicates there is no limit. FORCE HIERARCHY BEYOND
         DISTANCE-Limit the maximum straight-
         line distance between orders before the vehicle routing problem is
         solved using the network's hierarchy. The units for this value are the
         same as those specified in theparameter. Distance Field Units
         If the network doesn't have a hierarchy attribute, this
         constraint is ignored. Ifis checked, hierarchy is always used. If
         theparameter is unchecked and this constraint has a null value,
         hierarchy is not forced. Use Hierarchy in AnalysisUse
         Hierarchy in AnalysisMAXIMUM ORDERS PER ROUTE-Limit the maximum number
         of orders that can
         be assigned to each route. An error is returned if this limit is
         exceeded. A null value indicates there is no limit.
     ignore_invalid_order_locations {Boolean}:
         Specifies whether invalid orders will be ignored when solving the
         vehicle routing problem.HALT-The solve operation will fail when any
         invalid orders are
         encountered. An invalid order is an order that the VRP solver can't
         reach. An order may be unreachable for a variety of reasons, including
         if it's located on a prohibited network element, it isn't located on
         the network at all, or it's located on a disconnected portion of the
         network. This is the default value equivalent to boolean false.
         SKIP-Invalid orders will be ignored and a solution will be
         returned if no other errors are encountered. If you need to
         generate routes and deliver them to drivers
         immediately, you may be able to ignore invalid orders, solve, and
         distribute the routes to your drivers. Next, resolve any invalid
         orders from the last solve and include them in the VRP analysis for
         the next workday or work shift. This value is equivalent to Boolean
         true.
     travel_mode {String}:
         Choose the mode of transportation for the analysis. CUSTOM is always a
         choice. For other travel mode names to appear, they must be present in
         the network dataset specified in the Network_Dataset parameter. (The
         arcpy.na.GetTravelModes function provides a dictionary of the travel
         mode objects configured on a network dataset, and the name property
         returns the name of a travel mode object.)A travel mode is defined on
         a network dataset and provides override
         values for parameters that, together, model car, truck, pedestrian, or
         other modes of travel. By choosing a travel mode here, you don't need
         to provide values for the following parameters, which are overridden
         by values specified in the network dataset:uturn_policytime_attributed
         istance_attributeuse_hierarchy_in_analysisr
         estrictionsattribute_parameter_valuesroute_line_simplification_toleran
         ceCUSTOM-Define a travel mode that fits your specific needs. When
         CUSTOM
         is chosen, the tool does not override the travel mode parameters
         listed above. This is the default value.
     ignore_network_location_fields {Boolean}:
         Specifies whether the network location fields will be considered when
         locating orders, depots, or barriers on the network.IGNORE-Network
         location fields will not be considered when locating
         the inputs on the network. Instead, the inputs will always be located
         by performing a spatial search.HONOR-Network location fields will be
         considered when locating the
         inputs on the network. This is the default value.
     time_zone_usage_for_time_fields {String}:
         Specifies the time zone for the following input date-time
         fields supported by the tool:,,,,, andfor orders;,,, andfor
         depots;andfor routes; andandfor breaks. TimeWindowStart1TimeWin
         dowEnd1TimeWindowStart2TimeWindowEnd2InboundArriveTimeOutboundDepartTi
         meTimeWindowStart1TimeWindowEnd1TimeWindowStart2TimeWindowEnd2Earliest
         StartTimeLatestStartTimeTimeWindowStartTimeWindowEnd
         GEO_LOCAL-The date-time values associated with the orders or
         depots are in the time zone in which the orders and depots are
         located. For routes, the date-time values are based on the time zone
         in which the starting depot for the route is located. If a route does
         not have a starting depot, all orders and depots across all the routes
         must be in a single time zone. For breaks, the date-time values are
         based on the time zone of the routes. For example, if your depot is
         located in an area that follows eastern standard time and has the
         first time window values (specified asand) of 8 a.m. and 5 p.m.,
         respectively, the time window values will be treated as 8 a.m. and 5
         p.m. eastern standard time. TimeWindowStart1TimeWindowEnd1
         UTC-The date-time values associated with the orders or
         depots are in coordinated universal time (UTC) and are not based on
         the time zone in which the orders or depots are located. For example,
         if your depot is located in an area that follows eastern standard time
         and has the first time window values (specified asand) of 8 a.m. and 5
         p.m., respectively, the time window values will be treated as 12 p.m.
         and 9 p.m. eastern standard time, assuming eastern standard time is
         obeying daylight saving time. TimeWindowStart1TimeWindowEnd1
         Specifying the date-time values in UTC is useful if you do not
         know the time zone in which the orders or depots are located or when
         you have orders and depots in multiple time zones and you want all the
         date-time values to start simultaneously. The UTC option is applicable
         only when your network dataset defines a time zone attribute.
         Otherwise, all the date-time values are always treated as(GEO_LOCAL in
         Python). Geo local
     overrides {String}:
         This parameter is for internal use only.
     save_route_data {Boolean}:
         Specifies whether a .zip file that contains a file geodatabase
         containing the inputs and outputs of the analysis in a format that can
         be used to share route layers with ArcGIS Online or ArcGIS Enterprise
         will be saved.In ArcGIS Desktop, the default output location for this
         output file is
         in the scratch folder. You can determine the location of the scratch
         folder using arcpy.env.scratchFolder.SAVE_ROUTE_DATA-A .zip archive
         file containing a file geodatabase
         workspace that contains the inputs and outputs of the analysis will be
         saved.NO_SAVE_ROUTE_DATA-Route data will not be saved. This is the
         default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SolveVehicleRoutingProblem_na(
                *gp_fixargs(
                    (
                        orders,
                        depots,
                        routes,
                        breaks,
                        time_units,
                        distance_units,
                        network_dataset,
                        output_workspace_location,
                        output_unassigned_stops_name,
                        output_stops_name,
                        output_routes_name,
                        output_directions_name,
                        default_date,
                        uturn_policy,
                        time_window_factor,
                        spatially_cluster_routes,
                        route_zones,
                        route_renewals,
                        order_pairs,
                        excess_transit_factor,
                        point_barriers,
                        line_barriers,
                        polygon_barriers,
                        time_attribute,
                        distance_attribute,
                        use_hierarchy_in_analysis,
                        restrictions,
                        attribute_parameter_values,
                        maximum_snap_tolerance,
                        exclude_restricted_portions_of_the_network,
                        feature_locator_where_clause,
                        populate_route_lines,
                        route_line_simplification_tolerance,
                        populate_directions,
                        directions_language,
                        directions_style_name,
                        save_output_layer,
                        service_capabilities,
                        ignore_invalid_order_locations,
                        travel_mode,
                        ignore_network_location_fields,
                        time_zone_usage_for_time_fields,
                        overrides,
                        save_route_data,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateAnalysisLayerAttributeParameter_na", None)
def UpdateAnalysisLayerAttributeParameter(
    in_network_analysis_layer=None,
    parameterized_attribute=None,
    attribute_parameter_name=None,
    attribute_parameter_value=None,
) -> Result1[str | Layer]:
    """UpdateAnalysisLayerAttributeParameter_na(in_network_analysis_layer, parameterized_attribute, attribute_parameter_name, {attribute_parameter_value})

       Updates the network attribute parameter value for a network analysis
       layer. The tool should be used to update the value of an attribute
       parameter for a network analysis layer prior to solving with the Solve
       tool. This ensures that the solve operation uses the specified value
       of the attribute parameter to produce appropriate results.

    INPUTS:
     in_network_analysis_layer (Network Analyst Layer):
         Network analysis layer for which the attribute parameter value will be
         updated.
     parameterized_attribute (String):
         The network attribute whose attribute parameter will be updated.
     attribute_parameter_name (String):
         The parameter of the network attribute that will be updated. The
         parameters of type Object cannot be updated using the tool.
     attribute_parameter_value {String}:
         The value that will be set for the attribute parameter. It can be a
         string, number, date, or Boolean (True, False). If the value is not
         specified, then the attribute parameter value is set to Null.If the
         attribute parameter has a restriction usage type, the value can
         be specified as a string keyword or a numeric value. The string
         keyword or the numeric value determines whether the restriction
         attribute prohibits, avoids, or prefers the network elements it is
         associated with. Furthermore, the degree to which network elements are
         avoided or preferred can be defined by choosing HIGH, MEDIUM, or LOW
         keywords. The following keywords are supported:PROHIBITEDAVOID_HIGHAVO
         ID_MEDIUMAVOID_LOWPREFER_LOWPREFER_MEDIUMPREFER
         _HIGHNumeric values that are greater than one cause restricted
         elements to
         be avoided; the larger the number, the more the elements are avoided.
         Numeric values between zero and one cause restricted elements to be
         preferred; the smaller the number, the more restricted elements are
         preferred. Negative numbers prohibit restricted elements.If the
         parameter value holds an array, separate the items in the array
         with the localized separator character. For example, in the U.S., you
         would most likely use the comma character to separate the items. So
         representing an array of three numbers might look like the following:
         "5,10,15"."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpdateAnalysisLayerAttributeParameter_na(
                *gp_fixargs(
                    (
                        in_network_analysis_layer,
                        parameterized_attribute,
                        attribute_parameter_name,
                        attribute_parameter_value,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Network Dataset toolset
@gptooldoc("BuildNetwork_na", None)
def BuildNetwork(
    in_network_dataset=None,
    force_full_build: Literal["FORCE_FULL_BUILD", "NO_FORCE_FULL_BUILD"] | None = None,
) -> Result1[str | Layer]:
    """BuildNetwork_na(in_network_dataset, {force_full_build})

       Reconstructs the network connectivity and attribute information of a
       network dataset. The network dataset must be rebuilt after edits are
       made to the attributes or the features of a participating source
       feature class. After the source features are edited, the tool
       establishes the network connectivity only in the areas that have been
       edited to speed up the build process; however, when the network
       attributes are edited, the entire extent of the network dataset is
       rebuilt. This may be a slow operation on a large network dataset.

    INPUTS:
     in_network_dataset (Network Dataset Layer):
         The network dataset to be built.
     force_full_build {Boolean}:
         Specifies whether the full network will be built or only the parts of
         the network in dirty areas.FORCE_FULL_BUILD-The full network will be
         built.NO_FORCE_FULL_BUILD-Only the parts of the network that have been
         changed since the last build will be built. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.BuildNetwork_na(*gp_fixargs((in_network_dataset, force_full_build), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateNetworkDataset_na", None)
def CreateNetworkDataset(
    feature_dataset=None,
    out_name=None,
    source_feature_class_names=None,
    elevation_model: Literal["ELEVATION_FIELDS", "Z_COORDINATES", "NO_ELEVATION"] | None = None,
) -> Result1[str]:
    """CreateNetworkDataset_na(feature_dataset, out_name, source_feature_class_names;source_feature_class_names..., elevation_model)

       Creates a network dataset in an existing feature dataset. The network
       dataset can be used to perform network analysis on the data in the
       feature dataset.

    INPUTS:
     feature_dataset (Feature Dataset):
         The feature dataset where the network dataset will be created. The
         feature dataset should contain the source feature classes that will
         participate in the network dataset.If the feature dataset is in an
         enterprise geodatabase, the feature
         dataset and all source feature classes cannot be versioned.
     out_name (String):
         The name of the network dataset to be created. The feature_dataset
         parameter value and its parent geodatabase must not already contain a
         network dataset with this name.
     source_feature_class_names (String):
         The names of the feature classes to be included in the network dataset
         as network source features. Specify this parameter as a list of
         strings.You must choose at least one line feature class that is not a
         turn
         feature class. This line feature class will act as an edge source in
         the network dataset. You can optionally choose point feature classes
         to act as junction sources in the network dataset and turn feature
         classes to act as turn sources.All source feature classes must reside
         in the feature_dataset
         parameter value and must not already participate in a geometric
         network, a utility network, or another network dataset. Source feature
         classes cannot have 64-bit object identifier (OID) fields.
     elevation_model (String):
         Specifies the model that will be used to control vertical connectivity
         in the network dataset.ELEVATION_FIELDS-Coincident endpoints with the
         same elevation field
         values will be considered connected in the network dataset. This is
         the default.Z_COORDINATES-The z-coordinate values in the line feature
         geometry
         will be used to determine vertical connectivity. Coincident points are
         considered connected only if they have matching z-coordinate
         values.NO_ELEVATION-Network dataset connectivity will be determined
         only by
         horizontal coincidence."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateNetworkDataset_na(
                *gp_fixargs((feature_dataset, out_name, source_feature_class_names, elevation_model), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateNetworkDatasetFromTemplate_na", None)
def CreateNetworkDatasetFromTemplate(
    network_dataset_template=None,
    output_feature_dataset=None,
) -> Result1[str]:
    """CreateNetworkDatasetFromTemplate_na(network_dataset_template, output_feature_dataset)

       Creates a new network dataset with the schema contained in the input
       template file (.xml). All the feature classes and input tables
       required for creating the network dataset must already exist before
       this tool is executed.

    INPUTS:
     network_dataset_template (File):
         The template file (.xml) created by the Create Template From Network
         Dataset tool containing the schema of the output network dataset to be
         created.
     output_feature_dataset (Feature Dataset):
         The feature dataset containing the feature classes that will take part
         in the network dataset being created. The network will be created in
         this dataset using the name specified in the network dataset template."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateNetworkDatasetFromTemplate_na(
                *gp_fixargs((network_dataset_template, output_feature_dataset), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateTemplateFromNetworkDataset_na", None)
def CreateTemplateFromNetworkDataset(
    network_dataset=None,
    output_network_dataset_template=None,
) -> Result1[str]:
    """CreateTemplateFromNetworkDataset_na(network_dataset, output_network_dataset_template)

       Creates a file containing the schema of an existing network dataset.
       This template file can then be used to create a new network dataset
       with the same schema.

    INPUTS:
     network_dataset (Network Dataset Layer):
         The network dataset whose schema will be written to the output
         template file.

    OUTPUTS:
     output_network_dataset_template (File):
         The output file (.xml) that will contain the schema of the input
         network dataset."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateTemplateFromNetworkDataset_na(
                *gp_fixargs((network_dataset, output_network_dataset_template), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DissolveNetwork_na", None)
def DissolveNetwork(
    in_network_dataset=None,
    out_workspace_location=None,
) -> Result1[str]:
    """DissolveNetwork_na(in_network_dataset, out_workspace_location)

       Creates a network dataset that minimizes the number of line features
       required to correctly model the input network dataset. The more
       efficient output network dataset reduces the time required to solve
       analyses, draw results, and generate driving directions. This tool
       outputs a new network dataset and source feature classes; the input
       network dataset and its source features remain unchanged.

    INPUTS:
     in_network_dataset (Network Dataset Layer):
         The network dataset to be dissolved. The input network dataset
         must be a file or personal
         geodatabase network dataset with exactly one edge source. Any number
         of junction sources and turn sources is allowed. The edge source must
         have:        End point connectivity policyAn elevation policy of
         either None or
         Elevation FieldsThe input network dataset must be built before it can
         be used in this
         tool.
     out_workspace_location (Workspace):
         The geodatabase workspace in which to create the dissolved network
         dataset. The workspace must be an ArcGIS 10 geodatabase or later, and
         it must be a different geodatabase than the one where the input
         network dataset resides."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DissolveNetwork_na(*gp_fixargs((in_network_dataset, out_workspace_location), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeNetworkDatasetLayer_na", None)
def MakeNetworkDatasetLayer(
    in_network_dataset=None,
    output_layer=None,
    draw_elements=None,
) -> Result1[str | Layer]:
    """MakeNetworkDatasetLayer_na(in_network_dataset, output_layer, {draw_elements;draw_elements...})

       Creates a network dataset layer from a network dataset.

    INPUTS:
     in_network_dataset (Network Dataset Layer):
         The network dataset from which to make the new layer.
     draw_elements {String}:
         This parameter is not yet supported in ArcGIS Pro.

    OUTPUTS:
     output_layer (Network Dataset Layer):
         The name of the network dataset layer to be created.The layer can be
         used as an input to any geoprocessing tool that
         accepts a network dataset layer as input."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeNetworkDatasetLayer_na(*gp_fixargs((in_network_dataset, output_layer, draw_elements), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpgradeNetwork_na", None)
def UpgradeNetwork(
    in_network_dataset=None,
) -> Result1[str | Layer]:
    """UpgradeNetwork_na(in_network_dataset)

       Upgrades the schema of the network dataset. Upgrading a network
       dataset allows it to use new functionality available in the current
       software release. This is a deprecated tool. This functionality has
       been replaced by the Upgrade Dataset tool. Upgrade Dataset can upgrade
       network datasets as well as other types of datasets, such as parcel
       fabrics, to the current ArcGIS release.

    INPUTS:
     in_network_dataset (Network Dataset Layer):
         The network dataset that will be upgraded. The network dataset must be
         a geodatabase-based network dataset."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.UpgradeNetwork_na(*gp_fixargs((in_network_dataset,), True)))
        return retval
    except Exception as e:
        raise e


# Turn Feature Class toolset
@gptooldoc("CreateTurnFeatureClass_na", None)
def CreateTurnFeatureClass(
    out_location=None,
    out_feature_class_name=None,
    maximum_edges=None,
    in_network_dataset=None,
    in_template_feature_class=None,
    spatial_reference=None,
    config_keyword=None,
    spatial_grid_1=None,
    spatial_grid_2=None,
    spatial_grid_3=None,
    has_z: Literal["ENABLED", "DISABLED"] | None = None,
) -> Result1[str]:
    """CreateTurnFeatureClass_na(out_location, out_feature_class_name, {maximum_edges}, {in_network_dataset}, {in_template_feature_class}, {spatial_reference}, {config_keyword}, {spatial_grid_1}, {spatial_grid_2}, {spatial_grid_3}, {has_z})

       Creates a new turn feature class to store turn features that model
       turning movements in a network dataset.

    INPUTS:
     out_location (Workspace / Feature Dataset):
         The file, workgroup, or enterprise geodatabase, or the folder in which
         the output turn feature class will be created. The workspace must
         already exist.
     out_feature_class_name (String):
         The name of the turn feature class to be created.
     maximum_edges {Long}:
         The maximum number of edges that turns in the new turn feature class
         can model. The default value is 5. The maximum value is 50.
     in_network_dataset {Network Dataset Layer}:
         The network dataset in which the turn feature class will participate.
         The resulting turn feature class will be added as a turn source to the
         network dataset. If no network dataset is specified, the turn feature
         class will be created as not participating in a network dataset.
     in_template_feature_class {Feature Layer}:
         The feature class used as a template to define the attribute schema of
         the new turn feature class. If the template feature class has
         the following fields, they
         are not created on the output turn feature class;,,,,,,,,,,,,,,.
         NODE_NODE#JUNCTIONF_EDGET_EDGEF-EDGET-
         EDGEARC1_ARC2_ARC1#ARC2#ARC1-IDARC2-IDAZIMUTHANGLE
     spatial_reference {Spatial Reference}:
         The spatial reference that will be applied to the output turn feature
         class. This parameter is ignored if the output location is a
         geodatabase feature dataset, as the output turn feature class will
         inherit the spatial reference of the feature dataset.If you want to
         import the spatial reference from an existing feature
         class, specify its path as the parameter value.
     config_keyword {String}:
         Specifies the configuration keyword that determines the storage
         parameters of the new turn feature class. This parameter is used only
         if the output location is an workgroup or enterprise geodatabase
     spatial_grid_1 {Double}:
         This parameter is not supported. Any value provided will be ignored.
     spatial_grid_2 {Double}:
         This parameter is not supported. Any value provided will be ignored.
     spatial_grid_3 {Double}:
         This parameter is not supported. Any value provided will be ignored.
     has_z {Boolean}:
         ENABLED-The coordinates in the new turn feature class will have
         elevation (Z) values. This value should be used if the input network
         dataset is specified and it supports connectivity based on z
         coordinate values of the network sources.DISABLED-The coordinates in
         the new turn feature class will not have
         elevation (Z) values."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateTurnFeatureClass_na(
                *gp_fixargs(
                    (
                        out_location,
                        out_feature_class_name,
                        maximum_edges,
                        in_network_dataset,
                        in_template_feature_class,
                        spatial_reference,
                        config_keyword,
                        spatial_grid_1,
                        spatial_grid_2,
                        spatial_grid_3,
                        has_z,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("IncreaseMaximumEdges_na", None)
def IncreaseMaximumEdges(
    in_turn_features=None,
    maximum_edges=None,
) -> Result1[str | Layer]:
    """IncreaseMaximumEdges_na(in_turn_features, maximum_edges)

       Increases the maximum number of edges per turn in a turn feature
       class.

    INPUTS:
     in_turn_features (Feature Layer):
         The turn feature class that is having its maximum number of edges
         raised.
     maximum_edges (Long):
         The new maximum number of edges in the input turn feature class. The
         value must be at least one higher than the existing maximum number of
         edges and cannot be greater than 50."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.IncreaseMaximumEdges_na(*gp_fixargs((in_turn_features, maximum_edges), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PopulateAlternateIDFields_na", None)
def PopulateAlternateIDFields(
    in_network_dataset=None,
    alternate_ID_field_name=None,
) -> Result1[str | Layer]:
    """PopulateAlternateIDFields_na(in_network_dataset, alternate_ID_field_name)

       Creates and populates additional fields on the turn feature classes
       that reference the edges in the network by alternate IDs. The
       alternate IDs help maintain the integrity of the turn features if the
       edge sources are edited in such a way that their ObjectID values
       change.

    INPUTS:
     in_network_dataset (Network Dataset Layer):
         The network dataset whose turn feature classes will receive alternate
         ID fields. The fields will be created on all of the turn feature
         classes added as a turn source to the network dataset.
     alternate_ID_field_name (String):
         The name of the alternate ID field on the edge feature sources of the
         network dataset. All edge feature sources referenced by turns must
         have the same name for the alternate ID field."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PopulateAlternateIDFields_na(*gp_fixargs((in_network_dataset, alternate_ID_field_name), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TurnTableToTurnFeatureClass_na", None)
def TurnTableToTurnFeatureClass(
    in_turn_table=None,
    reference_line_features=None,
    out_feature_class_name=None,
    reference_nodes_table=None,
    maximum_edges=None,
    config_keyword=None,
    spatial_grid_1=None,
    spatial_grid_2=None,
    spatial_grid_3=None,
) -> Result1[str]:
    """TurnTableToTurnFeatureClass_na(in_turn_table, reference_line_features, out_feature_class_name, {reference_nodes_table}, {maximum_edges}, {config_keyword}, {spatial_grid_1}, {spatial_grid_2}, {spatial_grid_3})

       Converts an ArcView turn table or ArcInfo Workstation coverage turn
       table to an ArcGIS turn feature class.

    INPUTS:
     in_turn_table (Table View):
         The .dbf file or INFO turn table from which the new turn feature class
         will be created.INFO tables do not support mixed case path names on
         Linux and Solaris.
     reference_line_features (Feature Class):
         The line feature class to which the input turn table refers. The
         feature class must be a source in a network dataset.
     out_feature_class_name (String):
         The name of the new turn feature class to create.
     reference_nodes_table {dBASE Table}:
         The nodes.dbf table in the .nws folder containing the original ArcView
         GIS network in which the input turn table participated.This parameter
         is ignored if the input turn table is an INFO table.If the input turn
         table is a .dbf table and this parameter is omitted,
         then U-turns and turns that traverse between edges connected to each
         other at both ends will not be created in the output turn feature
         class.Errors will be reported in an error file written to the
         directory
         defined by the TEMP system variable. The full path name to the error
         file is reported as a warning message.
     maximum_edges {Long}:
         The maximum number of edges per turn in the new turn feature class.
         The default value is 5. The maximum value is 50.
     config_keyword {String}:
         Specifies the configuration keyword that determines the storage
         parameters of the output turn feature class. This parameter is used
         only if the output turn feature class is created in a workgroup or
         enterprise geodatabase.
     spatial_grid_1 {Double}:
         This parameter has been deprecated in ArcGIS Pro. Any value you enter
         is ignored.
     spatial_grid_2 {Double}:
         This parameter has been deprecated in ArcGIS Pro. Any value you enter
         is ignored.
     spatial_grid_3 {Double}:
         This parameter has been deprecated in ArcGIS Pro. Any value you enter
         is ignored."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TurnTableToTurnFeatureClass_na(
                *gp_fixargs(
                    (
                        in_turn_table,
                        reference_line_features,
                        out_feature_class_name,
                        reference_nodes_table,
                        maximum_edges,
                        config_keyword,
                        spatial_grid_1,
                        spatial_grid_2,
                        spatial_grid_3,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateByAlternateIDFields_na", None)
def UpdateByAlternateIDFields(
    in_network_dataset=None,
    alternate_ID_field_name=None,
) -> Result1[str | Layer]:
    """UpdateByAlternateIDFields_na(in_network_dataset, alternate_ID_field_name)

       Updates all the edge references in turn feature classes using an
       alternate ID field to identify the corresponding edge features for
       each turn. Use this tool after making edits to the edge source feature
       classes that alter ObjectID values.

    INPUTS:
     in_network_dataset (Network Dataset Layer):
         The network dataset whose turn feature classes will be updated by
         their alternate ID fields.
     alternate_ID_field_name (String):
         The name of the alternate ID field on the edge feature sources of the
         network dataset. All edge feature sources referenced by turns must
         have the same name for the alternate ID field."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpdateByAlternateIDFields_na(*gp_fixargs((in_network_dataset, alternate_ID_field_name), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateByGeometry_na", None)
def UpdateByGeometry(
    in_turn_features=None,
) -> Result1[str | Layer]:
    """UpdateByGeometry_na(in_turn_features)

       Updates all the edge references in the turn feature class using the
       geometry of the turn features. This tool is useful when the IDs listed
       for the turn can no longer find the edges participating in the turn
       due to edits to the underlying edges.

    INPUTS:
     in_turn_features (Feature Layer):
         The turn feature class to be updated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.UpdateByGeometry_na(*gp_fixargs((in_turn_features,), True)))
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
