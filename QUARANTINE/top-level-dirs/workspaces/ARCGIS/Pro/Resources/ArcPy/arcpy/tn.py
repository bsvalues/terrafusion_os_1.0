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
r"""The Trace Network toolbox contains tools to create, configure, and
work with trace networks."""
from __future__ import annotations

__all__ = [
    "AddNetworkAttribute",
    "AddTraceConfiguration",
    "ConvertGeometricNetworkToTraceNetwork",
    "CreateTraceNetwork",
    "DeleteTraceConfiguration",
    "DisableNetworkTopology",
    "EnableNetworkTopology",
    "ExportTraceConfigurations",
    "ImportTraceConfigurations",
    "SetFlowDirection",
    "SetNetworkAttribute",
    "Trace",
    "ValidateNetworkTopology",
]
__alias__ = "tn"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Tools
@gptooldoc("AddNetworkAttribute_tn", None)
def AddNetworkAttribute(
    in_trace_network=None,
    attribute_name=None,
    attribute_type: Literal["SHORT", "LONG", "DOUBLE", "DATE"] | None = None,
    is_nullable: Literal["NULLABLE", "NOT_NULLABLE"] | None = None,
    is_apportionable: Literal["APPORTIONABLE", "NOT_APPORTIONABLE"] | None = None,
) -> Result1[str]:
    """AddNetworkAttribute_tn(in_trace_network, attribute_name, attribute_type, {is_nullable}, {is_apportionable})

       Adds a network attribute to a trace network.

    INPUTS:
     in_trace_network (Trace Network / Trace Network Layer):
         The input trace network to which the network attribute will be added.
     attribute_name (String):
         The name of the network attribute to add to the trace network.
     attribute_type (String):
         Specifies the data type of the network attribute.SHORT-The field type
         will be short.LONG-The field type will be
         long.DOUBLE-The field type will be double.DATE-The field type will be
         date.
     is_nullable {Boolean}:
         Specifies whether the network attribute will support null
         values.NULLABLE-The network attribute will support null
         values.NOT_NULLABLE-The network attribute will not support null
         values. This
         is the default.
     is_apportionable {Boolean}:
         Specifies whether the network attribute will be apportioned across
         multiple edges belonging to the same feature.Apportioned behavior is
         only supported with double network attributes.
         Network attributes with the apportionable property can be assigned to
         fields in line or point feature classes, but only line features will
         have apportioned behavior.To illustrate, consider the shape_length
         network attribute and a line
         feature that consists of five edge elements of 20 feet each, where the
         total length of that line feature is 100 feet. This attribute will be
         apportioned across all edges. For example, using a function in a
         connected trace to count the shape_length attribute for this line will
         return a count of 5 because it accounts for each individual edge
         element and not the entire line. The distribution of the value depends
         on the percentage along each edge element with respect to the from
         point of the original feature.APPORTIONABLE-The network attribute will
         be
         apportioned.NOT_APPORTIONABLE-The network attribute will not be
         apportioned. This
         is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddNetworkAttribute_tn(
                *gp_fixargs((in_trace_network, attribute_name, attribute_type, is_nullable, is_apportionable), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ConvertGeometricNetworkToTraceNetwork_tn", None)
def ConvertGeometricNetworkToTraceNetwork(
    in_geometric_network=None,
    out_trace_network_name=None,
) -> Result1[str]:
    """ConvertGeometricNetworkToTraceNetwork_tn(in_geometric_network, out_trace_network_name)

       Converts a geometric network to a trace network.

    INPUTS:
     in_geometric_network (Geometric Network):
         The geometric network that will be converted to a trace
         network.Converting a geometric network to a trace network will drop
         the
         geometric network and create a trace network in its place. This change
         cannot be undone. Create a backup of the data before proceeding.
     out_trace_network_name (String):
         The name of the output trace network."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConvertGeometricNetworkToTraceNetwork_tn(
                *gp_fixargs((in_geometric_network, out_trace_network_name), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateTraceNetwork_tn", None)
def CreateTraceNetwork(
    in_feature_dataset=None,
    in_trace_network_name=None,
    input_junctions=None,
    input_edges=None,
) -> Result1[str]:
    """CreateTraceNetwork_tn(in_feature_dataset, in_trace_network_name, {input_junctions;input_junctions...}, {input_edges;input_edges...})

       Creates a trace network.

    INPUTS:
     in_feature_dataset (Feature Dataset):
         The feature dataset that will contain the trace network.
     in_trace_network_name (String):
         The name of the trace network that will be created.
     input_junctions {String}:
         The names of the point feature classes in the feature dataset that
         will be included in the trace network.
     input_edges {Value Table}:
         The line feature classes and associated connectivity policy
         that will be included in the trace network. Class Name-The name
         of the line feature class in the feature dataset
         that will be included in the trace network. Connectivity
         Policy-The associated connectivity policy of
         the specified feature class. SIMPLE_EDGE-Resources will flow
         from one end of the edge and out the
         other end.COMPLEX_EDGE-Resources will be siphoned off along the length
         of the
         edge."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateTraceNetwork_tn(
                *gp_fixargs((in_feature_dataset, in_trace_network_name, input_junctions, input_edges), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DisableNetworkTopology_tn", None)
def DisableNetworkTopology(
    in_trace_network=None,
) -> Result1[str]:
    """DisableNetworkTopology_tn(in_trace_network)

       Disables the network topology for an existing trace network.

    INPUTS:
     in_trace_network (Trace Network / Trace Network Layer):
         The trace network where the network topology will be disabled."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.DisableNetworkTopology_tn(*gp_fixargs((in_trace_network,), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("EnableNetworkTopology_tn", None)
def EnableNetworkTopology(
    in_trace_network=None,
    max_number_of_errors=None,
    only_generate_errors: Literal["ONLY_ERRORS", "ENABLE_TOPO"] | None = None,
) -> Result1[str]:
    """EnableNetworkTopology_tn(in_trace_network, {max_number_of_errors}, {only_generate_errors})

       Enables a network topology for a trace network.

    INPUTS:
     in_trace_network (Trace Network / Trace Network Layer):
         The trace network for which the network topology will be enabled.
     max_number_of_errors {Long}:
         The maximum number of errors that can be discovered before the process
         of enabling the network topology will stop. Errors will be recorded in
         the errors tables. When no value is provided for this parameter, an
         infinite number of errors can be discovered. The default value is
         10000.Increasing the maximum number of errors value will increase the
         length
         of time it takes to enable the topology.
     only_generate_errors {Boolean}:
         Specifies whether the topology will be enabled or only network errors
         will be generated.ONLY_ERRORS-The trace network will only be evaluated
         for network
         errors. The topology will not be enabled. If you are working with an
         enterprise geodatabase, the data cannot be registered as versioned.
         This allows you to inspect and fix errors in the network until you
         enable the topology.ENABLE_TOPO-The topology will be enabled and any
         existing errors will
         generate error features. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.EnableNetworkTopology_tn(
                *gp_fixargs((in_trace_network, max_number_of_errors, only_generate_errors), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetFlowDirection_tn", None)
def SetFlowDirection(
    input_trace_network=None,
    in_edges=None,
    flow_direction: Literal["WITH_DIGITIZED_DIRECTION", "AGAINST_DIGITIZED_DIRECTION", "INDETERMINATE"] | None = None,
) -> Result1[str]:
    """SetFlowDirection_tn(input_trace_network, in_edges;in_edges..., flow_direction)

       Sets the flow direction of line features in a version 1 trace network.

    INPUTS:
     input_trace_network (Trace Network / Trace Network Layer):
         The trace network that contains the line feature class on which the
         flow direction will be set.
     in_edges (Feature Layer):
         The polyline features that participate in the input trace network.
     flow_direction (String):
         Specifies the flow direction of the
         edges.WITH_DIGITIZED_DIRECTION-Flow direction will be along the
         digitized
         direction of the edges.AGAINST_DIGITIZED_DIRECTION-Flow direction will
         be against the
         digitized direction of the edges.INDETERMINATE-Flow direction will be
         indeterminate."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetFlowDirection_tn(*gp_fixargs((input_trace_network, in_edges, flow_direction), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetNetworkAttribute_tn", None)
def SetNetworkAttribute(
    in_trace_network=None,
    network_attribute=None,
    featureclass=None,
    field=None,
) -> Result1[str]:
    """SetNetworkAttribute_tn(in_trace_network, network_attribute, featureclass, field)

       Assigns a network attribute to a feature class to be used during trace
       operations.

    INPUTS:
     in_trace_network (Trace Network / Trace Network Layer):
         The trace network that contains the network attribute to set.
     network_attribute (String):
         The network attribute to be assigned to the feature class field.
     featureclass (String):
         The input feature class that contains the field that will be used to
         set the network attribute.
     field (String):
         An existing field that will be assigned the network attribute. The
         field data type must match the data type of the network attribute. For
         example, if the network attribute is a short integer type, the field
         must also be a short integer type. Network attributes that do not
         support null values can only be assigned to fields that do not allow
         null values."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetNetworkAttribute_tn(*gp_fixargs((in_trace_network, network_attribute, featureclass, field), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Trace_tn", None)
def Trace(
    in_trace_network=None,
    trace_type: Literal["CONNECTED", "UPSTREAM", "DOWNSTREAM", "SHORTEST_PATH"] | None = None,
    starting_points=None,
    barriers=None,
    path_direction: Literal["NO_DIRECTION", "PATH_UPSTREAM", "PATH_DOWNSTREAM"] | None = None,
    shortest_path_network_attribute_name=None,
    include_barriers: Literal["INCLUDE_BARRIERS", "EXCLUDE_BARRIERS"] | None = None,
    validate_consistency: Literal["VALIDATE_CONSISTENCY", "DO_NOT_VALIDATE_CONSISTENCY"] | None = None,
    ignore_barriers_at_starting_points: Literal[
        "IGNORE_BARRIERS_AT_STARTING_POINTS", "DO_NOT_IGNORE_BARRIERS_AT_STARTING_POINTS"
    ]
    | None = None,
    allow_indeterminate_flow: Literal["TRACE_INDETERMINATE_FLOW", "IGNORE_INDETERMINATE_FLOW"] | None = None,
    condition_barriers=None,
    function_barriers=None,
    traversability_scope: Literal["BOTH_JUNCTIONS_AND_EDGES", "JUNCTIONS_ONLY", "EDGES_ONLY"] | None = None,
    functions=None,
    output_conditions=None,
    result_types: list[Literal["SELECTION", "AGGREGATED_GEOMETRY", "NETWORK_LAYERS", "CONNECTIVITY", "ELEMENTS"]]
    | Literal["SELECTION", "AGGREGATED_GEOMETRY", "NETWORK_LAYERS", "CONNECTIVITY", "ELEMENTS"]
    | str
    | None = None,
    selection_type: Literal[
        "NEW_SELECTION", "ADD_TO_SELECTION", "REMOVE_FROM_SELECTION", "SUBSET_SELECTION", "SWITCH_SELECTION"
    ]
    | None = None,
    clear_all_previous_trace_results: Literal[
        "CLEAR_ALL_PREVIOUS_TRACE_RESULTS", "DO_NOT_CLEAR_ALL_PREVIOUS_TRACE_RESULTS"
    ]
    | None = None,
    trace_name=None,
    aggregated_points=None,
    aggregated_lines=None,
    out_network_layer=None,
    use_trace_config: Literal["USE_TRACE_CONFIGURATION", "DO_NOT_USE_TRACE_CONFIGURATION"] | None = None,
    trace_config_name=None,
    out_json_file=None,
) -> Result:
    """Trace_tn(in_trace_network, {trace_type}, {starting_points}, {barriers}, {path_direction}, {shortest_path_network_attribute_name}, {include_barriers}, {validate_consistency}, {ignore_barriers_at_starting_points}, {allow_indeterminate_flow}, {condition_barriers;condition_barriers...}, {function_barriers;function_barriers...}, {traversability_scope}, {functions;functions...}, {output_conditions;output_conditions...}, {result_types;result_types...}, {selection_type}, {clear_all_previous_trace_results}, {trace_name}, {aggregated_points}, {aggregated_lines}, {out_network_layer}, {use_trace_config}, {trace_config_name}, {out_json_file})

       Returns selected features in a trace network based on connectivity or
       traversability from the specified starting points.

    INPUTS:
     in_trace_network (Trace Network / Trace Network Layer):
         The trace network on which the trace will be run. When working with an
         enterprise geodatabase, an input trace network must be from a feature
         service; a trace network from a database connection is not supported.
     trace_type {String}:
         Species the type of trace to execute.CONNECTED-A connected trace that
         begins at one or more starting points
         and spans outward along connected features will be used.UPSTREAM-An
         upstream trace that discovers features upstream from a
         location in the network will be used. This type of trace requires the
         flow direction to be set.DOWNSTREAM-A downstream trace that discovers
         features downstream from
         a location in the network will be used. This type of trace requires
         the flow direction to be set.SHORTEST_PATH-A shortest path trace that
         finds the shortest path
         between two starting points in the network regardless of flow
         direction will be used. The cost of traversing the path is determined
         based on the network attribute set for the
         shortest_path_network_attribute_name parameter.
     starting_points {Table View / Feature Layer}:
         A feature layer created using thetab in thepane, or a table or
         feature class containing one or more records that represent the
         starting points of the trace. The TN_Temp_Starting_Points feature
         class is used by default and is generated in the default geodatabase
         of the project when you create starting points using thetool in
         thepane. Starting PointsTrace LocationsStarting PointsTrace
         Locations
     barriers {Table View / Feature Layer}:
         A table or feature class containing one or more features that
         represent the barriers of the trace that prevent the trace from
         traversing beyond that point. The TN_Temp_Barriers feature class is
         used by default and is generated in the default geodatabase of the
         project when you create barriers using thetab in thepane.
         BarriersTrace Locations
     path_direction {String}:
         Specifies the direction of the trace path. The cost of traversing the
         path is determined by the shortest_path_network_attribute_name
         parameter value. This parameter is only honored when running a
         SHORTEST_PATH trace type.NO_DIRECTION-The path between the two
         starting points, regardless of
         the direction of flow, will be used. This is the
         default.PATH_UPSTREAM-The upstream path between the two starting
         points will
         be used.PATH_DOWNSTREAM-The downstream path between the two starting
         points
         will be used.
     shortest_path_network_attribute_name {String}:
         The name of the network attribute used to calculate the path. When
         running a shortest path trace type, the shortest path is calculated
         using a numeric network attribute such as shape length. Cost and
         distance based paths can both be achieved. This parameter is required
         when running a shortest path trace.
     include_barriers {Boolean}:
         Specifies whether the traversability barrier features will be included
         in the trace results.INCLUDE_BARRIERS-Traversability barrier features
         will be included in
         the trace results. This is the default.EXCLUDE_BARRIERS-Traversability
         barrier features will not be included
         in the trace results.
     validate_consistency {Boolean}:
         Specifies whether an error will be returned if dirty areas are
         encountered in any of the traversed features. This is the only way to
         guarantee a trace is passing through features with consistent status
         in the network. To remove dirty areas, validate the network
         topology.VALIDATE_CONSISTENCY-The trace will return an error if dirty
         areas are
         encountered in any of the traversed features. This is the
         default.DO_NOT_VALIDATE_CONSISTENCY-The trace will return results
         regardless
         of whether dirty areas are encountered in any of the traversed
         features.
     ignore_barriers_at_starting_points {Boolean}:
         Specifies whether barriers in the trace configuration will be ignored
         for starting points.IGNORE_BARRIERS_AT_STARTING_POINTS-Barriers at
         starting points will be
         ignored in the
         trace.DO_NOT_IGNORE_BARRIERS_AT_STARTING_POINTS-Barriers at starting
         points
         will not be ignored in the trace. This is the default.
     allow_indeterminate_flow {Boolean}:
         Specifies whether features with indeterminate or uninitialized flow
         will be traced. This parameter is only honored when running an
         upstream or downstream trace.TRACE_INDETERMINATE_FLOW-Features with
         indeterminate or uninitialized
         flow direction will be traced.IGNORE_INDETERMINATE_FLOW-Features with
         indeterminate or uninitialized
         flow direction will not be traced. This is the default.
     condition_barriers {Value Table}:
         Sets a traversability barrier condition on features based on a
         comparison to a network attribute. A condition barrier uses a network
         attribute, an operator and a type, and an attribute value. For
         example, stop a trace when a feature has theattribute equal to the
         specific value of ArtificialPath. When a feature meets this condition,
         the trace stops. If you're using more than one attribute, you can use
         the Combine Using component to define an And or an Or condition.
         Code        Condition barrier components are as follows:
         Name-Filter by any network attribute defined in the
         system.Operator-Choose from a number of different
         operators.Type-Choose a specific value or network attribute from the
         value
         specified in the Name component.Value-Provide a specific value for the
         input attribute type that would
         cause termination based on the operator value.Combine Using-Set this
         value if you have multiple attributes to add.
         You can combine them using an And or an Or condition.Operator
         components are as follows:IS_EQUAL_TO-The attribute is equal to the
         value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.Type components are as follows:SPECIFIC_VALUE-Filter by a
         specific value.NETWORK_ATTRIBUTE-Filter by
         a network attribute.Combine Using component are as follows:AND-Combine
         the condition barriers.OR-Use if either condition barrier
         is met.
     function_barriers {Value Table}:
         Sets a traversability barrier on features based on a function.
         Function barriers can be used, for example, to restrict how far the
         trace travels from the starting point or to set a maximum value to
         stop a trace. For example, the length of each line traveled is added
         to the total distance traveled so far. When the total length traveled
         reaches the value specified, the trace stops. Function barrier
         components are as follows:
         Function-Choose from a number of calculation
         functions.Attribute-Filter by any network attribute defined in the
         system.Operator-Choose from a number of operators.Value-Provide a
         specific value for the input attribute type that, if
         discovered, will cause the termination.Use Local Values-Calculate
         values in each direction as opposed to an
         overall global value. For example, a function barrier calculates the
         sum of shape length in which the trace terminates if the value is
         greater than or equal to 4. In the global case, after you have
         traversed two edges with a value of 2, you have already reached a
         shape length sum of 4, so the trace stops. If local values are used,
         the local values along each path change, and the trace
         continues.Function components are as follows:AVERAGE-The average of
         the input values.COUNT-The number of
         features.MAX-The maximum of the input values.MIN-The minimum of the
         input values.ADD-Add the values.SUBTRACT-Subtract the values.Operator
         components are as follows:IS_EQUAL_TO-The attribute is equal to the
         value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.Use Local Values components are as follows:TRUE-Use local
         values.FALSE-Use global values. This is the default.
     traversability_scope {String}:
         Specifies the type of traversability that will be applied.
         Traversability scope determines whether traversability is applied to
         junctions, edges, or both. For example, in a network of recreational
         trails, if a condition barrier is defined to stop the trace if the
         path type is gravel and traversability scope is set to junctions only,
         the trace will not stop even if it encounters a gravel path, because
         the path type is only applicable to
         edges.BOTH_JUNCTIONS_AND_EDGES-Traversability will be applied to both
         junctions and edges. This is the default.JUNCTIONS_ONLY-Traversability
         will be applied to junctions only.EDGES_ONLY-Traversability will be
         applied to edges only.
     functions {Value Table}:
         The calculation function or functions that will be applied to the
         trace results. Functions components are as follows:
         Function-Choose
         from a number of calculation
         functions.Attribute-Filter by any network attribute defined in the
         system.Filter Name-Filter the function results by attribute
         name.Filter Operator-Choose from a number of operators.Filter
         Type-Choose from a number of filter types.Filter Value-Provide a
         specific value for the input filter attribute.Function component
         options are as follows:AVERAGE-The average of the input
         values.COUNT-The number of
         features.MAX-The maximum of the input values.MIN-The minimum of the
         input values.ADD-The sum of the values.SUBTRACT-The difference between
         the values.For example, you have a starting point feature with a value
         of 20. The
         next feature has a value of 30. If you are using the MIN function, the
         result is 20. MAX is 30, ADD is 50, AVERAGE is 25, COUNT is 2, and
         SUBTRACT is -10.Filter Operator component options are as
         follows:IS_EQUAL_TO-The attribute is equal to the
         value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.Filter Type component options are as
         follows:SPECIFIC_VALUE-Filter by a specific
         value.NETWORK_ATTRIBUTE-Filter by
         a network attribute.
     output_conditions {Value Table}:
         The types of features that will be returned based on a network
         attribute. For example, in a trace configured to filter out everything
         but Tap features, any traced features that do not have the Tap
         attribute assigned to them are not included in the results. Any traced
         features that do are returned in the result selection set. If using
         more than one attribute, you can use the Combine Using option to
         define an And or an Or condition. Output conditions components
         are as follows:
         Name-Filter by any network attribute defined in the
         system.Operator-Choose from a number of operators.Type-Choose a
         specific value or network attribute from the value
         =specified in the Name component.Value-Provide a specific value of the
         input attribute type that would
         cause termination based on the operator value.Combine Using-Set this
         value if you have multiple attributes to add.
         You can combine them using an And or an Or condition.Operator
         component options are as follows:IS_EQUAL_TO-The attribute is equal to
         the value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.Type component options are as follows:SPECIFIC_VALUE-Filter by a
         specific value.NETWORK_ATTRIBUTE-Filter by
         a network attribute.Combine Using component options are as
         follows:AND-Combine the conditions.OR-Use if either condition is met.
     result_types {String}:
         Specifies the type of results that will be returned by the
         trace.SELECTION-The trace results will be returned as a selection set
         on
         the appropriate network features. This is the
         default.AGGREGATED_GEOMETRY-The trace results will be aggregated by
         geometry
         type and stored in feature classes displayed in layers in the active
         map.NETWORK_LAYERS-The trace results will be added to feature layers
         as a
         selection set in a group layer. CONNECTIVITY-The trace results
         will be returned as a
         connectivity graph in a specified output .json file. This option
         enables the out_json_file parameter. For enterprise
         geodatabases, this option requires ArcGIS Enterprise
         10.9.1 or later.ELEMENTS-The trace results will be returned as feature
         elements in a
         specified output .json file. This option enables the out_json_file
         parameter.
     selection_type {String}:
         Specifies how the selection will be applied and what to do if a
         current selection exists.NEW_SELECTION-The resulting selection will
         replace the current
         selection. This is the default.ADD_TO_SELECTION-The resulting
         selection will be added to the current
         selection if one exists. If no selection exists, this is the same as
         the new selection option.REMOVE_FROM_SELECTION-The resulting selection
         will be removed from the
         current selection. If no selection exists, this option has no
         effect.SUBSET_SELECTION-The resulting selection will be combined with
         the
         current selection. Only records that are common to both remain
         selected.SWITCH_SELECTION-The resulting selection will be switched.
         Results
         that were selected are removed from the current selection, while
         results that were not selected are added to the current selection. If
         no selection exists, this is the same as the new selection option.
     clear_all_previous_trace_results {Boolean}:
         Specifies whether content will be truncated from or appended to the
         feature classes chosen to store aggregated geometry. This parameter is
         only applicable to the aggregated geometry result
         type.CLEAR_ALL_PREVIOUS_TRACE_RESULTS-The feature classes storing
         aggregated trace geometry will be truncated. Only the output geometry
         from the current trace operation will be written. This is the
         default.DO_NOT_CLEAR_ALL_PREVIOUS_TRACE_RESULTS-The output geometry
         from the
         current trace operation will be appended to the feature classes
         storing aggregated geometry.
     trace_name {String}:
         The name of the trace operation. This value is stored in
         thefield of the output feature class to assist with identification of
         the trace results. This parameter is only applicable to the aggregated
         geometry result type. TRACENAME
     use_trace_config {Boolean}:
         Specifies whether an existing named trace configuration will be used
         to populate the parameters of the Trace
         tool.USE_TRACE_CONFIGURATION-An existing named trace configuration
         will be
         used to define the properties of the trace. All parameters except
         trace_config_name, starting_points, and barriers will be
         ignored.DO_NOT_USE_TRACE_CONFIGURATION-An exiting named trace
         configuration
         will not be used to define the properties of the trace. This is the
         default.This parameter requires Trace Network Version 2 or later.
     trace_config_name {String}:
         The name of the trace configuration that will be used to define the
         properties of the trace. This parameter is only enabled when the
         use_trace_config parameter is set to USE_TRACE_CONFIGURATION.This
         parameter requires Trace Network Version 2 or later.

    OUTPUTS:
     aggregated_points {Feature Class}:
         An output multipoint feature class containing the aggregated result
         geometry. By default, the parameter is populated with a system-
         generated feature class named Trace_Results_Aggregated_Points that
         will be stored in the project's default geodatabase. This
         feature class will be created automatically if it does
         not exist. An existing feature class can also be used to store
         aggregated geometry. If a feature class other than the default is
         used, it must be a multipoint feature class and contain a string field
         named. This parameter is only applicable to the aggregated geometry
         result type. TRACENAME
     aggregated_lines {Feature Class}:
         An output polyline feature class containing the aggregated result
         geometry. By default, the parameter is populated with a system-
         generated feature class named Trace_Results_Aggregated_Lines that will
         be stored in the project's default geodatabase. This feature
         class will be created automatically if it does
         not exist. An existing feature class can also be used to store
         aggregated geometry. If a feature class other than the default is
         used, it must be a polyline feature class and contain a string field
         named. This parameter is only applicable to the aggregated geometry
         result type. TRACENAME
     out_network_layer {Group Layer}:
         The name of the output group layer that contains feature layers with
         selection sets of features returned by the trace. The layer provides
         access to work with the output of a trace in ModelBuilder and
         Python.This parameter is only applicable to the network layers result
         type.
     out_json_file {File}:
         The name and location of the .json file that will be generated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Trace_tn(
                *gp_fixargs(
                    (
                        in_trace_network,
                        trace_type,
                        starting_points,
                        barriers,
                        path_direction,
                        shortest_path_network_attribute_name,
                        include_barriers,
                        validate_consistency,
                        ignore_barriers_at_starting_points,
                        allow_indeterminate_flow,
                        condition_barriers,
                        function_barriers,
                        traversability_scope,
                        functions,
                        output_conditions,
                        result_types,
                        selection_type,
                        clear_all_previous_trace_results,
                        trace_name,
                        aggregated_points,
                        aggregated_lines,
                        out_network_layer,
                        use_trace_config,
                        trace_config_name,
                        out_json_file,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ValidateNetworkTopology_tn", None)
def ValidateNetworkTopology(
    in_trace_network=None,
    extent=None,
) -> Result1[str]:
    """ValidateNetworkTopology_tn(in_trace_network, {extent})

       Validates the network topology of a trace network. Validation of the
       network topology is necessary after edits have been made to network
       attributes or the geometry of features in the network.

    INPUTS:
     in_trace_network (Trace Network / Trace Network Layer):
         The trace network for which the network topology will be
         validated.When working with an enterprise geodatabase, the input trace
         network
         must be from a trace network service.
     extent {Extent}:
         The geographical area for which to build the trace network. This
         parameter is similar to the Extent geoprocessing environment.MAXOF-The
         maximum extent of all inputs will be used.MINOF-The minimum
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
            gp.ValidateNetworkTopology_tn(*gp_fixargs((in_trace_network, extent), True))
        )
        return retval
    except Exception as e:
        raise e


# Trace Configuration toolset
@gptooldoc("AddTraceConfiguration_tn", None)
def AddTraceConfiguration(
    in_trace_network=None,
    trace_config_name=None,
    trace_type: Literal["CONNECTED", "UPSTREAM", "DOWNSTREAM", "SHORTEST_PATH"] | None = None,
    description=None,
    tags=None,
    path_direction: Literal["NO_DIRECTION", "PATH_UPSTREAM", "PATH_DOWNSTREAM"] | None = None,
    shortest_path_network_attribute_name=None,
    include_barriers: Literal["INCLUDE_BARRIERS", "EXCLUDE_BARRIERS"] | None = None,
    validate_consistency: Literal["VALIDATE_CONSISTENCY", "DO_NOT_VALIDATE_CONSISTENCY"] | None = None,
    ignore_barriers_at_starting_points: Literal[
        "IGNORE_BARRIERS_AT_STARTING_POINTS", "DO_NOT_IGNORE_BARRIERS_AT_STARTING_POINTS"
    ]
    | None = None,
    allow_indeterminate_flow: Literal["TRACE_INDETERMINATE_FLOW", "IGNORE_INDETERMINATE_FLOW"] | None = None,
    condition_barriers=None,
    function_barriers=None,
    traversability_scope: Literal["BOTH_JUNCTIONS_AND_EDGES", "JUNCTIONS_ONLY", "EDGES_ONLY"] | None = None,
    functions=None,
    output_conditions=None,
    result_types: list[Literal["SELECTION", "AGGREGATED_GEOMETRY"]]
    | Literal["SELECTION", "AGGREGATED_GEOMETRY"]
    | str
    | None = None,
) -> Result1[str]:
    """AddTraceConfiguration_tn(in_trace_network, trace_config_name, trace_type, {description}, {tags;tags...}, {path_direction}, {shortest_path_network_attribute_name}, {include_barriers}, {validate_consistency}, {ignore_barriers_at_starting_points}, {allow_indeterminate_flow}, {condition_barriers;condition_barriers...}, {function_barriers;function_barriers...}, {traversability_scope}, {functions;functions...}, {output_conditions;output_conditions...}, {result_types;result_types...})

       Creates a named trace configuration in the trace network.

    INPUTS:
     in_trace_network (Trace Network / Trace Network Layer):
         The trace network that will contain the new named trace configuration.
     trace_config_name (String):
         The name for the named trace configuration.
     trace_type (String):
         Specifies the type of trace that will be configured.CONNECTED-A
         connected trace that begins at one or more starting points
         and spans outward along connected features will be used.UPSTREAM-An
         upstream trace that discovers features upstream from a
         location in the network will be used. This type of trace uses flow
         direction.DOWNSTREAM-A downstream trace that discovers features
         downstream from
         a location in the network will be used. This type of trace uses flow
         direction.SHORTEST_PATH-A shortest path trace that finds the shortest
         path
         between two starting points in the network regardless of flow
         direction will be used. The cost of traversing the path is determined
         based on the network attribute set for the
         shortest_path_network_attribute_name parameter.
     description {String}:
         The description of the named trace configuration.
     tags {String}:
         A set of tags used to identify the named trace configuration. The tags
         can be used in searches and indexing.
     path_direction {String}:
         Specifies the direction of the trace path. The cost of traversing the
         path is determined by the shortest_path_network_attribute_name
         parameter value. This parameter is only honored when running a
         SHORTEST_PATH trace type.NO_DIRECTION-The path between the two
         starting points, regardless of
         the direction of flow, will be used. This is the
         default.PATH_UPSTREAM-The upstream path between the two starting
         points will
         be used.PATH_DOWNSTREAM-The downstream path between the two starting
         points
         will be used.
     shortest_path_network_attribute_name {String}:
         The name of the network attribute used to calculate the path. When
         running a shortest path trace type, the shortest path is calculated
         using a numeric network attribute such as shape length. Cost and
         distance based paths can both be achieved. This parameter is required
         when running a shortest path trace.
     include_barriers {Boolean}:
         Specifies whether traversability barrier features will be included in
         the trace results.INCLUDE_BARRIERS-Traversability barrier features
         will be included in
         the trace results. This is the default.EXCLUDE_BARRIERS-Traversability
         barrier features will not be included
         in the trace results.
     validate_consistency {Boolean}:
         Specifies whether an error will be returned if dirty areas are
         encountered in any of the traversed features. This is the only way to
         guarantee a trace is passing through features with consistent status
         in the network. To remove dirty areas, validate the network
         topology.VALIDATE_CONSISTENCY-The trace will return an error if dirty
         areas are
         encountered in any of the traversed features. This is the
         default.DO_NOT_VALIDATE_CONSISTENCY-The trace will return results
         regardless
         of whether dirty areas are encountered in any of the traversed
         features.
     ignore_barriers_at_starting_points {Boolean}:
         Specifies whether barriers in the trace configuration will be ignored
         for starting points.IGNORE_BARRIERS_AT_STARTING_POINTS-Barriers at
         starting points will be
         ignored in the
         trace.DO_NOT_IGNORE_BARRIERS_AT_STARTING_POINTS-Barriers at starting
         points
         will not be ignored in the trace. This is the default.
     allow_indeterminate_flow {Boolean}:
         Specifies whether features that have indeterminate or uninitialized
         flow will be traced. This parameter is only honored when running an
         upstream or downstream trace.TRACE_INDETERMINATE_FLOW-Features that
         have indeterminate or
         uninitialized flow direction will be
         traced.IGNORE_INDETERMINATE_FLOW-Features that have indeterminate or
         uninitialized flow direction will not be traced. This is the default.
     condition_barriers {Value Table}:
         Sets a traversability barrier condition on features based on a
         comparison to a network attribute. A condition barrier uses a network
         attribute, an operator and a type, and an attribute value. For
         example, stop a trace when a feature has theattribute equal to the
         specific value of ArtificialPath. When a feature meets this condition,
         the trace stops. If you're using more than one attribute, you can use
         the Combine Using component to define an And or an Or condition.
         Code        Condition barrier components are as follows:
         Name-Filter by any network attribute defined in the
         system.Operator-Choose from a number of different
         operators.Type-Choose a specific value or network attribute from the
         value
         specified in the Name component.Value-Provide a specific value for the
         input attribute type that would
         cause termination based on the operator value.Combine Using-Set this
         value if you have multiple attributes to add.
         You can combine them using an And or an Or condition.Operator
         components are as follows:IS_EQUAL_TO-The attribute is equal to the
         value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.Type components are as follows:SPECIFIC_VALUE-Filter by a
         specific value.NETWORK_ATTRIBUTE-Filter by
         a network attribute.Combine Using component are as follows:AND-Combine
         the condition barriers.OR-Use if either condition barrier
         is met.
     function_barriers {Value Table}:
         Sets a traversability barrier on features based on a function.
         Function barriers can be used, for example, to restrict how far the
         trace travels from the starting point or to set a maximum value to
         stop a trace. For example, the length of each line traveled is added
         to the total distance traveled so far. When the total length traveled
         reaches the value specified, the trace stops. Function barrier
         components are as follows:
         Function-Choose from a number of calculation
         functions.Attribute-Filter by any network attribute defined in the
         system.Operator-Choose from a number of operators.Value-Provide a
         specific value for the input attribute type that, if
         discovered, will cause the termination.Use Local Values-Calculate
         values in each direction as opposed to an
         overall global value. For example, a function barrier calculates the
         sum of shape length in which the trace terminates if the value is
         greater than or equal to 4. In the global case, after you have
         traversed two edges with a value of 2, you have already reached a
         shape length sum of 4, so the trace stops. If local values are used,
         the local values along each path change, and the trace
         continues.Function components are as follows:AVERAGE-The average of
         the input values.COUNT-The number of
         features.MAX-The maximum of the input values.MIN-The minimum of the
         input values.ADD-The sum of the values.SUBTRACT-The difference between
         the values.Operator components are as follows:IS_EQUAL_TO-The
         attribute is equal to the value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.IS_EQUAL_TODOES_NOT_EQUALIS_GREATER_THANIS_GREATER_THAN_OR_EQUAL
         _TOIS_
         LESS_THANIS_LESS_THAN_OR_EQUAL_TOUse Local Values components are as
         follows:TRUE-Local values will be used.FALSE-Global values will be
         used. This
         is the default.
     traversability_scope {String}:
         Specifies whether traversability will be applied to junctions, edges,
         or both. For example, in a network of recreational trails, if a
         condition barrier is defined to stop the trace if the path type is
         gravel and traversability scope is set to junctions only, the trace
         will not stop even if it encounters a gravel path, because the path
         type is only applicable to edges. In other words, this parameter
         indicates to the trace whether to ignore junctions, ignore edges, or
         include both junctions and edges in the
         trace.BOTH_JUNCTIONS_AND_EDGES-Traversability will be applied to both
         junctions and edges. This is the default.JUNCTIONS_ONLY-Traversability
         will be applied to junctions only.EDGES_ONLY-Traversability will be
         applied to edges only.
     functions {Value Table}:
         The calculation function that will be applied to the trace results.
         Functions components are as follows:        Function-Choose
         from a number of calculation
         functions.Attribute-Filter by any network attribute defined in the
         system.Filter Name-Filter the function results by attribute
         name.Filter Operator-Choose from a number of operators.Filter
         Type-Choose from a number of filter types.Filter Value-Provide a
         specific value for the input filter attribute.Function component
         options are as follows:AVERAGE-The average of the input
         values.COUNT-The number of
         features.MAX-The maximum of the input values.MIN-The minimum of the
         input values.ADD-The sum of the values.SUBTRACT-The difference between
         the values.For example, a starting point feature has a value of 20.
         The next
         feature has a value of 30. If you are using the MIN function, the
         result is 20, MAX is 30, ADD is 50, AVERAGE is 25, COUNT is 2, and
         SUBTRACT is -10.Filter Operator component options are as
         follows:IS_EQUAL_TO-The attribute is equal to the
         value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.Filter Type component options are as
         follows:SPECIFIC_VALUE-Filter by a specific
         value.NETWORK_ATTRIBUTE-Filter by
         a network attribute.
     output_conditions {Value Table}:
         The types of features that will be returned based on a network
         attribute. For example, in a trace configured to filter out everything
         but Tap features, any traced features that do not have the Tap
         attribute assigned to them will not be included in the results. Any
         traced features that do will be returned in the result selection set.
         If using more than one attribute, you can use the Combine Using option
         to define an And or an Or condition. Output conditions
         components are as follows:
         Name-Filter by any network attribute defined in the
         system.Operator-Choose from a number of operators.Type-Choose a
         specific value or network attribute from the value
         specified in the Name component.Value-Provide a specific value for the
         input attribute type that would
         cause termination based on the operator value.Combine Using-Set this
         value if you have multiple attributes to add.
         You can combine them using an And or an Or condition.Operator
         component options are as follows:IS_EQUAL_TO-The attribute is equal to
         the value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.Type component options are as follows:SPECIFIC_VALUE-Filter by a
         specific value.NETWORK_ATTRIBUTE-Filter by
         a network attribute.Combine Using component options are as
         follows:AND-Combine the conditions.OR-Use if either condition is met.
     result_types {String}:
         Specifies the type of results that will be returned by the
         trace.SELECTION-The trace results will be returned as a selection set
         on
         the appropriate network features. This is the
         default.AGGREGATED_GEOMETRY-The trace results will be aggregated by
         geometry
         type and stored in feature classes displayed in layers in the active
         map."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddTraceConfiguration_tn(
                *gp_fixargs(
                    (
                        in_trace_network,
                        trace_config_name,
                        trace_type,
                        description,
                        tags,
                        path_direction,
                        shortest_path_network_attribute_name,
                        include_barriers,
                        validate_consistency,
                        ignore_barriers_at_starting_points,
                        allow_indeterminate_flow,
                        condition_barriers,
                        function_barriers,
                        traversability_scope,
                        functions,
                        output_conditions,
                        result_types,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DeleteTraceConfiguration_tn", None)
def DeleteTraceConfiguration(
    in_trace_network=None,
    trace_config_name=None,
) -> Result1[str]:
    """DeleteTraceConfiguration_tn(in_trace_network, trace_config_name;trace_config_name...)

       Deletes one or more named trace configurations from a trace network.

    INPUTS:
     in_trace_network (Trace Network / Trace Network Layer):
         The trace network containing the named trace configuration to be
         deleted.
     trace_config_name (String):
         The named trace configurations to be deleted."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DeleteTraceConfiguration_tn(*gp_fixargs((in_trace_network, trace_config_name), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportTraceConfigurations_tn", None)
def ExportTraceConfigurations(
    in_trace_network=None,
    trace_config_name=None,
    out_json_file=None,
) -> Result1[str]:
    """ExportTraceConfigurations_tn(in_trace_network, trace_config_name;trace_config_name..., out_json_file)

       Exports named trace configurations from a trace network to JSON format
       (.json file).

    INPUTS:
     in_trace_network (Trace Network / Trace Network Layer):
         The trace network containing the named trace configuration or
         configurations to export.
     trace_config_name (String):
         The named trace configuration or configurations to export.

    OUTPUTS:
     out_json_file (File):
         The output .json file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportTraceConfigurations_tn(*gp_fixargs((in_trace_network, trace_config_name, out_json_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportTraceConfigurations_tn", None)
def ImportTraceConfigurations(
    in_trace_network=None,
    in_json_file=None,
) -> Result1[str]:
    """ImportTraceConfigurations_tn(in_trace_network, in_json_file)

       Imports named trace configurations from JSON format (.json file) to a
       trace network.

    INPUTS:
     in_trace_network (Trace Network / Trace Network Layer):
         The target trace network to which the named trace configurations will
         be imported.
     in_json_file (File):
         The .json file containing the named trace configurations to import."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportTraceConfigurations_tn(*gp_fixargs((in_trace_network, in_json_file), True))
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
