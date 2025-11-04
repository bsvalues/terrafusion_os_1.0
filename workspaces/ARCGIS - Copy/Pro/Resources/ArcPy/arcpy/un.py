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
r"""The Utility Network toolbox contains tools to create, configure, and
work with utility networks."""
from __future__ import annotations

__all__ = [
    "AddAngleDirectedLayout",
    "AddCollapseContainerByAttributeRule",
    "AddCollapseContainerRule",
    "AddColorScheme",
    "AddCompressionLayout",
    "AddConnectivityAssociationsRule",
    "AddDiagramFeatureCapabilityByAttributeRule",
    "AddDiagramTemplate",
    "AddDomainNetwork",
    "AddExpandContainerByAttributeRule",
    "AddExpandContainerRule",
    "AddForceDirectedLayout",
    "AddGridLayout",
    "AddLinearDispatchLayout",
    "AddMainlineTreeLayout",
    "AddMainRingLayout",
    "AddNetworkAttribute",
    "AddNetworkCategory",
    "AddPartialOverlappingEdgesLayout",
    "AddRadialTreeLayout",
    "AddReduceEdgeByAttributeRule",
    "AddReduceJunctionByAttributeRule",
    "AddReduceJunctionRule",
    "AddRelativeMainlineLayout",
    "AddRemoveFeatureByAttributeRule",
    "AddRemoveFeatureRule",
    "AddReshapeDiagramEdgesLayout",
    "AddRule",
    "AddSetRootJunctionByAttributeRule",
    "AddSetStartingPointByAttributeRule",
    "AddSmartTreeLayout",
    "AddSpatialDispatchLayout",
    "AddSpatialQueryRule",
    "AddStartIterationRule",
    "AddStopIterationRule",
    "AddStructuralAttachmentsRule",
    "AddTelecomDomainNetwork",
    "AddTerminalConfiguration",
    "AddTier",
    "AddTierGroup",
    "AddTraceConfiguration",
    "AddTraceLocations",
    "AddTraceRule",
    "AlterDiagramProperties",
    "AlterDiagramTemplate",
    "AppendToDiagram",
    "ApplyAngleDirectedLayout",
    "ApplyCompressionLayout",
    "ApplyForceDirectedLayout",
    "ApplyGeoPositionsLayout",
    "ApplyGridLayout",
    "ApplyLinearDispatchLayout",
    "ApplyMainlineTreeLayout",
    "ApplyMainRingLayout",
    "ApplyPartialOverlappingEdgesLayout",
    "ApplyRadialTreeLayout",
    "ApplyRelativeMainlineLayout",
    "ApplyRotateTreeLayout",
    "ApplySmartTreeLayout",
    "ApplySpatialDispatchLayout",
    "ApplyTemplateLayouts",
    "CalculateClusterKeys",
    "ChangeDiagramsOwner",
    "CreateDiagram",
    "CreateDiagramLayerDefinition",
    "CreateUtilityNetwork",
    "DeleteColorScheme",
    "DeleteDiagram",
    "DeleteDiagramTemplate",
    "DeleteNetworkCategory",
    "DeleteRule",
    "DeleteTerminalConfiguration",
    "DeleteTraceConfiguration",
    "DisableNetworkTopology",
    "EnableClusterKeys",
    "EnableNetworkTopology",
    "ExportAssociations",
    "ExportCircuitDefinitions",
    "ExportCircuits",
    "ExportDiagramContent",
    "ExportDiagramLayerDefinition",
    "ExportDiagramTemplateDefinitions",
    "ExportRules",
    "ExportSubnetwork",
    "ExportSubnetworkControllers",
    "ExportTraceConfigurations",
    "ExtendDiagram",
    "GetDiagramTemplateNames",
    "ImportAssociations",
    "ImportCircuitDefinitions",
    "ImportDiagramTemplateDefinitions",
    "ImportRules",
    "ImportSubnetworkControllers",
    "ImportTraceConfigurations",
    "MakeDiagramLayer",
    "OverwriteDiagram",
    "PurgeTemporaryDiagrams",
    "RebuildNetworkTopology",
    "RepairNetworkTopology",
    "ReshapeDiagramEdgesLayout",
    "SetAssociationRole",
    "SetCircuitProperties",
    "SetEdgeConnectivity",
    "SetNetworkAttribute",
    "SetNetworkCategory",
    "SetSubnetworkDefinition",
    "SetTerminalConfiguration",
    "StoreDiagram",
    "Trace",
    "UpdateDiagram",
    "UpdateIsConnected",
    "UpdateSubnetwork",
    "UpdateUtilityNetworkSchema",
    "ValidateNetworkTopology",
    "VerifyCircuits",
    "VerifyNetworkTopology",
]
__alias__ = "un"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3
from arcpy import _un
from arcpy._un import *

__all__ += _un.__all__


# Tools
@gptooldoc("AddAngleDirectedLayout_un", None)
def AddAngleDirectedLayout(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    iterations_number=None,
    number_of_directions: Literal["TWELVE_DIRECTIONS", "EIGHT_DIRECTIONS", "FOUR_DIRECTIONS"] | None = None,
) -> Result2[str, str]:
    """AddAngleDirectedLayout_un(in_utility_network, template_name, is_active, {are_containers_preserved}, {iterations_number}, {number_of_directions})

       Add the angle directed layout to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     are_containers_preserved {Boolean}:
         Preserve container layout
     iterations_number {Long}:
         Number of Iterations
     number_of_directions {String}:
         Number of Directions"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddAngleDirectedLayout_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        are_containers_preserved,
                        iterations_number,
                        number_of_directions,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddCollapseContainerByAttributeRule_un", None)
def AddCollapseContainerByAttributeRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    container_source=None,
    where_clause=None,
    description=None,
    reconnected_edges_option: Literal["AGGREGATE_RECONNECTED_EDGES", "DONT_AGGREGATE_RECONNECTED_EDGES"] | None = None,
) -> Result2[str, str]:
    """AddCollapseContainerByAttributeRule_un(in_utility_network, template_name, is_active, container_source, {where_clause}, {description}, {reconnected_edges_option})

       Add a collapse container by attribute rule to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     container_source (Table / Feature Class):
         Container Source
     where_clause {SQL Expression}:
         Expression
     description {String}:
         Description
     reconnected_edges_option {Boolean}:
         Aggregate reconnected edges"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddCollapseContainerByAttributeRule_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        container_source,
                        where_clause,
                        description,
                        reconnected_edges_option,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddCollapseContainerRule_un", None)
def AddCollapseContainerRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    container_type: Literal["JUNCTIONS", "EDGES", "BOTH"] | None = None,
    inverse_source_selection: Literal["EXCLUDE_SOURCE_CLASSES", "INCLUDE_SOURCE_CLASSES"] | None = None,
    container_sources=None,
    description=None,
    reconnected_edges_option: Literal["AGGREGATE_RECONNECTED_EDGES", "DONT_AGGREGATE_RECONNECTED_EDGES"] | None = None,
) -> Result2[str, str]:
    """AddCollapseContainerRule_un(in_utility_network, template_name, is_active, container_type, inverse_source_selection, {container_sources;container_sources...}, {description}, {reconnected_edges_option})

       Add a collapse container rule to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     container_type (String):
         Container Type
     inverse_source_selection (String):
         Rule Process
     container_sources {Table / Feature Class}:
         Container Sources
     description {String}:
         Description
     reconnected_edges_option {Boolean}:
         Aggregate reconnected edges"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddCollapseContainerRule_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        container_type,
                        inverse_source_selection,
                        container_sources,
                        description,
                        reconnected_edges_option,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddCompressionLayout_un", None)
def AddCompressionLayout(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    grouping_distance_absolute=None,
    vertices_removal_rule: Literal["ALL", "OUTER", "OUTER_EXCEPT_FIRST"] | None = None,
) -> Result2[str, str]:
    """AddCompressionLayout_un(in_utility_network, template_name, is_active, {are_containers_preserved}, {grouping_distance_absolute}, {vertices_removal_rule})

       Add a compression layout to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     are_containers_preserved {Boolean}:
         Preserve container layout
     grouping_distance_absolute {Linear Unit}:
         Maximum Distance for Grouping
     vertices_removal_rule {String}:
         Vertex Removal Rule"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddCompressionLayout_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        are_containers_preserved,
                        grouping_distance_absolute,
                        vertices_removal_rule,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddConnectivityAssociationsRule_un", None)
def AddConnectivityAssociationsRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    description=None,
) -> Result2[str, str]:
    """AddConnectivityAssociationsRule_un(in_utility_network, template_name, is_active, {description})

       Add a connectivity associations rule to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     description {String}:
         Description"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddConnectivityAssociationsRule_un(
                *gp_fixargs((in_utility_network, template_name, is_active, description), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddDiagramFeatureCapabilityByAttributeRule_un", None)
def AddDiagramFeatureCapabilityByAttributeRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    network_source=None,
    where_clause=None,
    capability: Literal[
        "ALLOW_TO_COLLAPSE_CONTAINER",
        "PREVENT_TO_COLLAPSE_CONTAINER",
        "ALLOW_TO_REDUCE_JUNCTION",
        "PREVENT_TO_REDUCE_JUNCTION",
        "SAVE_EMPTY_CONTAINER_AS_POLYGON_IF_UNCONNECTED",
        "IGNORED_STARTING_POINT_FOR_UPSTREAM_TRACE",
        "IGNORED_STARTING_POINT_FOR_DOWNSTREAM_TRACE",
    ]
    | None = None,
    description=None,
    valence_0: Literal["APPLY", "DO_NOT_APPLY"] | None = None,
    valence_1: Literal["APPLY", "DO_NOT_APPLY"] | None = None,
    valence_2: Literal["APPLY", "DO_NOT_APPLY"] | None = None,
    valence_3_plus: Literal["APPLY", "DO_NOT_APPLY"] | None = None,
) -> Result2[str, str]:
    """AddDiagramFeatureCapabilityByAttributeRule_un(in_utility_network, template_name, is_active, network_source, where_clause, capability, {description}, {valence_0}, {valence_1}, {valence_2}, {valence_3_plus})

       Add a diagram feature capability by attribute rule to a diagram
       template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     network_source (Table / Feature Class):
         Network Source
     where_clause (SQL Expression):
         Expression
     capability (String):
         Capability
     description {String}:
         Description
     valence_0 {Boolean}:
         Unconnected
     valence_1 {Boolean}:
         Connected to a single junction
     valence_2 {Boolean}:
         Connected to two different junctions
     valence_3_plus {Boolean}:
         Connected to three or more different junctions"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddDiagramFeatureCapabilityByAttributeRule_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        network_source,
                        where_clause,
                        capability,
                        description,
                        valence_0,
                        valence_1,
                        valence_2,
                        valence_3_plus,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddDiagramTemplate_un", None)
def AddDiagramTemplate(
    in_utility_network=None,
    template_name=None,
    ndbd_file=None,
    ndld_file=None,
) -> Result2[str, str]:
    """AddDiagramTemplate_un(in_utility_network, template_name, {ndbd_file}, {ndld_file})

       Add a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     ndbd_file {File}:
         Rule and Layout Definitions File
     ndld_file {File}:
         Diagram Layer Definition File"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddDiagramTemplate_un(*gp_fixargs((in_utility_network, template_name, ndbd_file, ndld_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddExpandContainerByAttributeRule_un", None)
def AddExpandContainerByAttributeRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    containers_visibility: Literal["KEEP_VISIBLE", "HIDE"] | None = None,
    container_source=None,
    where_clause=None,
    description=None,
) -> Result2[str, str]:
    """AddExpandContainerByAttributeRule_un(in_utility_network, template_name, is_active, containers_visibility, container_source, {where_clause}, {description})

       Add an expand container by attribute rule to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     containers_visibility (Boolean):
         Keep containers visible
     container_source (Table / Feature Class):
         Container Source
     where_clause {SQL Expression}:
         Expression
     description {String}:
         Description"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddExpandContainerByAttributeRule_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        containers_visibility,
                        container_source,
                        where_clause,
                        description,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddExpandContainerRule_un", None)
def AddExpandContainerRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    containers_visibility: Literal["KEEP_VISIBLE", "HIDE"] | None = None,
    container_type: Literal["JUNCTIONS", "EDGES", "BOTH"] | None = None,
    inverse_source_selection: Literal["EXCLUDE_SOURCE_CLASSES", "INCLUDE_SOURCE_CLASSES"] | None = None,
    container_sources=None,
    description=None,
) -> Result2[str, str]:
    """AddExpandContainerRule_un(in_utility_network, template_name, is_active, containers_visibility, container_type, inverse_source_selection, {container_sources;container_sources...}, {description})

       Add an expand container rule to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     containers_visibility (Boolean):
         Keep containers visible
     container_type (String):
         Container Type
     inverse_source_selection (String):
         Rule Process
     container_sources {Table / Feature Class}:
         Container Sources
     description {String}:
         Description"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddExpandContainerRule_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        containers_visibility,
                        container_type,
                        inverse_source_selection,
                        container_sources,
                        description,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddForceDirectedLayout_un", None)
def AddForceDirectedLayout(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    iterations_number=None,
    repel_factor=None,
    degree_freedom: Literal["LOW", "MEDIUM", "HIGH"] | None = None,
    breakpoint_position=None,
    edge_display_type: Literal["REGULAR_EDGES", "CURVED_EDGES"] | None = None,
) -> Result2[str, str]:
    """AddForceDirectedLayout_un(in_utility_network, template_name, is_active, {are_containers_preserved}, {iterations_number}, {repel_factor}, {degree_freedom}, {breakpoint_position}, {edge_display_type})

       Add a force directed layout to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     are_containers_preserved {Boolean}:
         Preserve container layout
     iterations_number {Long}:
         Number of Iterations
     repel_factor {Double}:
         Repel Factor
     degree_freedom {String}:
         Degree of Freedom
     breakpoint_position {Double}:
         Break Point Relative Position (%)
     edge_display_type {String}:
         Edge Display Type"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddForceDirectedLayout_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        are_containers_preserved,
                        iterations_number,
                        repel_factor,
                        degree_freedom,
                        breakpoint_position,
                        edge_display_type,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddGridLayout_un", None)
def AddGridLayout(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    cell_width_absolute=None,
    cell_height_absolute=None,
) -> Result2[str, str]:
    """AddGridLayout_un(in_utility_network, template_name, is_active, {are_containers_preserved}, {cell_width_absolute}, {cell_height_absolute})

       Add a grid layout to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     are_containers_preserved {Boolean}:
         Preserve container layout
     cell_width_absolute {Linear Unit}:
         Cell Width
     cell_height_absolute {Linear Unit}:
         Cell Height"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddGridLayout_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        are_containers_preserved,
                        cell_width_absolute,
                        cell_height_absolute,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddLinearDispatchLayout_un", None)
def AddLinearDispatchLayout(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    junction_placement_type: Literal["EQUAL_DISTANCE", "USER_DEFINE_DISTANCE", "ITERATIVE_DISTANCE"] | None = None,
    is_unit_absolute: Literal["ABSOLUTE_UNIT", "PROPORTIONAL_UNIT"] | None = None,
    maximum_shift_absolute=None,
    maximum_shift_proportional=None,
    minimum_shift_absolute=None,
    minimum_shift_proportional=None,
    iterations_number=None,
    is_path_preserved: Literal["PRESERVE_PATH", "IGNORE_PATH"] | None = None,
    are_leaves_moved: Literal["MOVE_LEAVES", "DO_NOT_MOVE_LEAVES"] | None = None,
    are_leaves_expanded: Literal["EXPAND_LEAVES", "DO_NOT_EXPAND_LEAVES"] | None = None,
    expand_shift_absolute=None,
    expand_shift_proportional=None,
) -> Result2[str, str]:
    """AddLinearDispatchLayout_un(in_utility_network, template_name, is_active, {junction_placement_type}, {is_unit_absolute}, {maximum_shift_absolute}, {maximum_shift_proportional}, {minimum_shift_absolute}, {minimum_shift_proportional}, {iterations_number}, {is_path_preserved}, {are_leaves_moved}, {are_leaves_expanded}, {expand_shift_absolute}, {expand_shift_proportional})

       Add a linear dispatch layout to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     junction_placement_type {String}:
         Junctions Placement
     is_unit_absolute {Boolean}:
         Spacing values interpreted as absolute units in the diagram coordinate system
     maximum_shift_absolute {Linear Unit}:
         Maximum Shift
     maximum_shift_proportional {Double}:
         Maximum Shift
     minimum_shift_absolute {Linear Unit}:
         Minimum Shift
     minimum_shift_proportional {Double}:
         Minimum Shift
     iterations_number {Long}:
         Number of Iterations
     is_path_preserved {Boolean}:
         Preserve path
     are_leaves_moved {Boolean}:
         Move leaves
     are_leaves_expanded {Boolean}:
         Expand leaves
     expand_shift_absolute {Linear Unit}:
         Maximum Expand Shift
     expand_shift_proportional {Double}:
         Maximum Expand Shift"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddLinearDispatchLayout_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        junction_placement_type,
                        is_unit_absolute,
                        maximum_shift_absolute,
                        maximum_shift_proportional,
                        minimum_shift_absolute,
                        minimum_shift_proportional,
                        iterations_number,
                        is_path_preserved,
                        are_leaves_moved,
                        are_leaves_expanded,
                        expand_shift_absolute,
                        expand_shift_proportional,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddMainRingLayout_un", None)
def AddMainRingLayout(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    ring_type: Literal["ELLIPSE", "RECTANGLE"] | None = None,
    is_unit_absolute: Literal["ABSOLUTE_UNIT", "PROPORTIONAL_UNIT"] | None = None,
    ring_width_absolute=None,
    ring_width_proportional=None,
    ring_height_absolute=None,
    ring_height_proportional=None,
    tree_type: Literal["BOTH_SIDES", "LEFT_SIDE", "RIGHT_SIDE", "SMART_TREE"] | None = None,
    perpendicular_absolute=None,
    perpendicular_proportional=None,
    along_absolute=None,
    along_proportional=None,
    breakpoint_position=None,
    edge_display_type: Literal["REGULAR_EDGES", "ORTHOGONAL_EDGES", "CURVED_EDGES"] | None = None,
    offset_absolute=None,
    offset_proportional=None,
) -> Result2[str, str]:
    """AddMainRingLayout_un(in_utility_network, template_name, is_active, {are_containers_preserved}, {ring_type}, {is_unit_absolute}, {ring_width_absolute}, {ring_width_proportional}, {ring_height_absolute}, {ring_height_proportional}, {tree_type}, {perpendicular_absolute}, {perpendicular_proportional}, {along_absolute}, {along_proportional}, {breakpoint_position}, {edge_display_type}, {offset_absolute}, {offset_proportional})

       Add a main ring layout to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     are_containers_preserved {Boolean}:
         Preserve container layout
     ring_type {String}:
         Ring Type
     is_unit_absolute {Boolean}:
         Spacing values interpreted as absolute units in the diagram coordinate system
     ring_width_absolute {Linear Unit}:
         Ring Width
     ring_width_proportional {Double}:
         Ring Width
     ring_height_absolute {Linear Unit}:
         Ring Height
     ring_height_proportional {Double}:
         Ring Height
     tree_type {String}:
         Hierarchical Tree Type
     perpendicular_absolute {Linear Unit}:
         Between Junctions Perpendicular to the Direction
     perpendicular_proportional {Double}:
         Between Junctions Perpendicular to the Direction
     along_absolute {Linear Unit}:
         Between Junctions Along the Direction
     along_proportional {Double}:
         Between Junctions Along the Direction
     breakpoint_position {Double}:
         Break Point Relative Position (%)
     edge_display_type {String}:
         Edge Display Type
     offset_absolute {Linear Unit}:
         Offset
     offset_proportional {Double}:
         Offset"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddMainRingLayout_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        are_containers_preserved,
                        ring_type,
                        is_unit_absolute,
                        ring_width_absolute,
                        ring_width_proportional,
                        ring_height_absolute,
                        ring_height_proportional,
                        tree_type,
                        perpendicular_absolute,
                        perpendicular_proportional,
                        along_absolute,
                        along_proportional,
                        breakpoint_position,
                        edge_display_type,
                        offset_absolute,
                        offset_proportional,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddMainlineTreeLayout_un", None)
def AddMainlineTreeLayout(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    tree_direction: Literal["FROM_LEFT_TO_RIGHT", "FROM_RIGHT_TO_LEFT", "FROM_BOTTOM_TO_TOP", "FROM_TOP_TO_BOTTOM"]
    | None = None,
    branches_placement: Literal["BOTH_SIDES", "LEFT_SIDE", "RIGHT_SIDE"] | None = None,
    is_unit_absolute: Literal["ABSOLUTE_UNIT", "PROPORTIONAL_UNIT"] | None = None,
    perpendicular_absolute=None,
    perpendicular_proportional=None,
    along_absolute=None,
    along_proportional=None,
    disjoined_graph_absolute=None,
    disjoined_graph_proportional=None,
    are_edges_orthogonal: Literal["ORTHOGONAL_EDGES", "SLANTED_EDGES"] | None = None,
    breakpoint_position=None,
    edge_display_type: Literal["REGULAR_EDGES", "ORTHOGONAL_EDGES", "CURVED_EDGES"] | None = None,
    offset_absolute=None,
    offset_proportional=None,
) -> Result2[str, str]:
    """AddMainlineTreeLayout_un(in_utility_network, template_name, is_active, {are_containers_preserved}, {tree_direction}, {branches_placement}, {is_unit_absolute}, {perpendicular_absolute}, {perpendicular_proportional}, {along_absolute}, {along_proportional}, {disjoined_graph_absolute}, {disjoined_graph_proportional}, {are_edges_orthogonal}, {breakpoint_position}, {edge_display_type}, {offset_absolute}, {offset_proportional})

       Add a mainline tree layout to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     are_containers_preserved {Boolean}:
         Preserve container layout
     tree_direction {String}:
         Tree Direction
     branches_placement {String}:
         Branches Placement
     is_unit_absolute {Boolean}:
         Spacing values interpreted as absolute units in the diagram coordinate system
     perpendicular_absolute {Linear Unit}:
         Between Junctions Perpendicular to the Direction
     perpendicular_proportional {Double}:
         Between Junctions Perpendicular to the Direction
     along_absolute {Linear Unit}:
         Between Junctions Along the Direction
     along_proportional {Double}:
         Between Junctions Along the Direction
     disjoined_graph_absolute {Linear Unit}:
         Between Disjoined Graphs
     disjoined_graph_proportional {Double}:
         Between Disjoined Graphs
     are_edges_orthogonal {Boolean}:
         Orthogonally display edges
     breakpoint_position {Double}:
         Break Point Relative Position (%)
     edge_display_type {String}:
         Edge Display Type
     offset_absolute {Linear Unit}:
         Offset
     offset_proportional {Double}:
         Offset"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddMainlineTreeLayout_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        are_containers_preserved,
                        tree_direction,
                        branches_placement,
                        is_unit_absolute,
                        perpendicular_absolute,
                        perpendicular_proportional,
                        along_absolute,
                        along_proportional,
                        disjoined_graph_absolute,
                        disjoined_graph_proportional,
                        are_edges_orthogonal,
                        breakpoint_position,
                        edge_display_type,
                        offset_absolute,
                        offset_proportional,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddPartialOverlappingEdgesLayout_un", None)
def AddPartialOverlappingEdgesLayout(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    buffer_width_absolute=None,
    offset_absolute=None,
    optimize_edges: Literal["OPTIMIZE_EDGES", "DO_NOT_OPTIMIZE_EDGES"] | None = None,
) -> Result2[str, str]:
    """AddPartialOverlappingEdgesLayout_un(in_utility_network, template_name, is_active, buffer_width_absolute, offset_absolute, {optimize_edges})

       Add a partial overlapping edges layout to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     buffer_width_absolute (Linear Unit):
         Buffer Width
     offset_absolute (Linear Unit):
         Offset
     optimize_edges {Boolean}:
         Optimize edges"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddPartialOverlappingEdgesLayout_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        buffer_width_absolute,
                        offset_absolute,
                        optimize_edges,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddRadialTreeLayout_un", None)
def AddRadialTreeLayout(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    is_unit_absolute: Literal["ABSOLUTE_UNIT", "PROPORTIONAL_UNIT"] | None = None,
    initial_radius_absolute=None,
    initial_radius_proportional=None,
    disjoined_graph_absolute=None,
    disjoined_graph_proportional=None,
    radius_factor=None,
) -> Result2[str, str]:
    """AddRadialTreeLayout_un(in_utility_network, template_name, is_active, {are_containers_preserved}, {is_unit_absolute}, {initial_radius_absolute}, {initial_radius_proportional}, {disjoined_graph_absolute}, {disjoined_graph_proportional}, {radius_factor})

       Add a radial tree layout to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     are_containers_preserved {Boolean}:
         Preserve container layout
     is_unit_absolute {Boolean}:
         Spacing values interpreted as absolute units in the diagram coordinate system
     initial_radius_absolute {Linear Unit}:
         Initial Radius
     initial_radius_proportional {Double}:
         Initial Radius
     disjoined_graph_absolute {Linear Unit}:
         Between Disjoined Graphs
     disjoined_graph_proportional {Double}:
         Between Disjoined Graphs
     radius_factor {Double}:
         Radius Factor"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddRadialTreeLayout_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        are_containers_preserved,
                        is_unit_absolute,
                        initial_radius_absolute,
                        initial_radius_proportional,
                        disjoined_graph_absolute,
                        disjoined_graph_proportional,
                        radius_factor,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddReduceEdgeByAttributeRule_un", None)
def AddReduceEdgeByAttributeRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    network_source=None,
    where_clause=None,
    description=None,
    reconnected_edges_option: Literal["AGGREGATE_RECONNECTED_EDGES", "DONT_AGGREGATE_RECONNECTED_EDGES"] | None = None,
) -> Result2[str, str]:
    """AddReduceEdgeByAttributeRule_un(in_utility_network, template_name, is_active, network_source, {where_clause}, {description}, {reconnected_edges_option})

       Add a reduce edge by attribute rule to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     network_source (Table / Feature Class):
         Edge Source to Reduce
     where_clause {SQL Expression}:
         Expression
     description {String}:
         Description
     reconnected_edges_option {Boolean}:
         Aggregate reconnected edges"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddReduceEdgeByAttributeRule_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        network_source,
                        where_clause,
                        description,
                        reconnected_edges_option,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddReduceJunctionByAttributeRule_un", None)
def AddReduceJunctionByAttributeRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    junction_source=None,
    where_clause=None,
    connectivity_options: Literal["MAX_2_CONNECTED_JUNCTIONS", "MIN_3_CONNECTED_JUNCTIONS"] | None = None,
    unconnected_junctions: Literal["REDUCE_UNCONNECTED_JCT", "KEEP_UNCONNECTED_JCT"] | None = None,
    one_connected_junction: Literal["REDUCE_JCT_TO_1JCT", "KEEP_JCT_TO_1JCT"] | None = None,
    two_connected_junctions: Literal["REDUCE_JCT_TO_2JCTS", "KEEP_JCT_TO_2JCTS"] | None = None,
    edges_attributes=None,
    description=None,
    use_digitized_direction: Literal["USE_DIGITIZED_DIRECTION", "IGNORE_DIGITIZED_DIRECTION"] | None = None,
) -> Result2[str, str]:
    """AddReduceJunctionByAttributeRule_un(in_utility_network, template_name, is_active, junction_source, {where_clause}, {connectivity_options}, {unconnected_junctions}, {one_connected_junction}, {two_connected_junctions}, {edges_attributes;edges_attributes...}, {description}, {use_digitized_direction})

       Add a reduce junction by attribute rule to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     junction_source (Table / Feature Class):
         Junction Source to Reduce
     where_clause {SQL Expression}:
         Expression
     connectivity_options {String}:
         Reduce Junctions With
     unconnected_junctions {Boolean}:
         Reduce if unconnected
     one_connected_junction {Boolean}:
         Reduce if connected to a single junction
     two_connected_junctions {Boolean}:
         Reduce if connected to 2 different junctions
     edges_attributes {String}:
         Edge Attribute Names
     description {String}:
         Description
     use_digitized_direction {Boolean}:
         Use Digitized Direction"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddReduceJunctionByAttributeRule_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        junction_source,
                        where_clause,
                        connectivity_options,
                        unconnected_junctions,
                        one_connected_junction,
                        two_connected_junctions,
                        edges_attributes,
                        description,
                        use_digitized_direction,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddReduceJunctionRule_un", None)
def AddReduceJunctionRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    inverse_source_selection: Literal["EXCLUDE_SOURCE_CLASSES", "INCLUDE_SOURCE_CLASSES"] | None = None,
    junction_source=None,
    connectivity_options: Literal["MAX_2_CONNECTED_JUNCTIONS", "MIN_3_CONNECTED_JUNCTIONS"] | None = None,
    unconnected_junctions: Literal["REDUCE_UNCONNECTED_JCT", "KEEP_UNCONNECTED_JCT"] | None = None,
    one_connected_junction: Literal["REDUCE_JCT_TO_1JCT", "KEEP_JCT_TO_1JCT"] | None = None,
    two_connected_junctions: Literal["REDUCE_JCT_TO_2JCTS", "KEEP_JCT_TO_2JCTS"] | None = None,
    edges_attributes=None,
    description=None,
    use_digitized_direction: Literal["USE_DIGITIZED_DIRECTION", "IGNORE_DIGITIZED_DIRECTION"] | None = None,
) -> Result2[str, str]:
    """AddReduceJunctionRule_un(in_utility_network, template_name, is_active, inverse_source_selection, {junction_source;junction_source...}, {connectivity_options}, {unconnected_junctions}, {one_connected_junction}, {two_connected_junctions}, {edges_attributes;edges_attributes...}, {description}, {use_digitized_direction})

       Add a reduce junction rule to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     inverse_source_selection (String):
         Rule Process
     junction_source {Table / Feature Class}:
         Sources to Reduce
     connectivity_options {String}:
         Reduce Junctions With
     unconnected_junctions {Boolean}:
         Reduce if unconnected
     one_connected_junction {Boolean}:
         Reduce if connected to a single junction
     two_connected_junctions {Boolean}:
         Reduce if connected to 2 different junctions
     edges_attributes {String}:
         Edge Attribute Names
     description {String}:
         Description
     use_digitized_direction {Boolean}:
         Use Digitized Direction"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddReduceJunctionRule_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        inverse_source_selection,
                        junction_source,
                        connectivity_options,
                        unconnected_junctions,
                        one_connected_junction,
                        two_connected_junctions,
                        edges_attributes,
                        description,
                        use_digitized_direction,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddRelativeMainlineLayout_un", None)
def AddRelativeMainlineLayout(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    line_attribute=None,
    mainline_direction: Literal["FROM_LEFT_TO_RIGHT", "FROM_TOP_TO_BOTTOM"] | None = None,
    offset_between_branches=None,
    breakpoint_angle=None,
    type_attribute=None,
    mainline_values=None,
    branch_values=None,
    excluded_values=None,
    is_compressing: Literal["USE_COMPRESSION", "DO_NOT_USE_COMPRESSION"] | None = None,
    compression_ratio=None,
    minimal_distance=None,
    alignment_attribute=None,
    initial_distances: Literal["FROM_CURRENT_EDGE_GEOMETRY", "FROM_ATTRIBUTE_EDGE"] | None = None,
    length_attribute=None,
) -> Result2[str, str]:
    """AddRelativeMainlineLayout_un(in_utility_network, template_name, is_active, line_attribute, {mainline_direction}, {offset_between_branches}, {breakpoint_angle}, {type_attribute}, {mainline_values;mainline_values...}, {branch_values;branch_values...}, {excluded_values;excluded_values...}, {is_compressing}, {compression_ratio}, {minimal_distance}, {alignment_attribute}, {initial_distances}, {length_attribute})

       Add the relative mainline layout to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     line_attribute (String):
         Line Attribute
     mainline_direction {String}:
         Direction
     offset_between_branches {Linear Unit}:
         Offset Between Branches
     breakpoint_angle {Double}:
         Break Point angle (in degree)
     type_attribute {String}:
         Type Attribute
     mainline_values {Value Table}:
         Mainline Values
     branch_values {Value Table}:
         Branch Values
     excluded_values {Value Table}:
         Excluded Values
     is_compressing {Boolean}:
         Compression along the direction
     compression_ratio {Double}:
         Ratio (%)
     minimal_distance {Linear Unit}:
         Minimal Distance
     alignment_attribute {String}:
         Alignment Attribute
     initial_distances {String}:
         Initial Distances
     length_attribute {String}:
         Length Attribute"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddRelativeMainlineLayout_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        line_attribute,
                        mainline_direction,
                        offset_between_branches,
                        breakpoint_angle,
                        type_attribute,
                        mainline_values,
                        branch_values,
                        excluded_values,
                        is_compressing,
                        compression_ratio,
                        minimal_distance,
                        alignment_attribute,
                        initial_distances,
                        length_attribute,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddRemoveFeatureByAttributeRule_un", None)
def AddRemoveFeatureByAttributeRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    network_source=None,
    where_clause=None,
    description=None,
    unconnected_junctions: Literal["MUST_BE_UNCONNECTED", "NO_CONSTRAINT"] | None = None,
    one_connected_junction: Literal["MUST_BE_CONNECTED_TO_SINGLE_JUNCTION", "NO_CONSTRAINT"] | None = None,
) -> Result2[str, str]:
    """AddRemoveFeatureByAttributeRule_un(in_utility_network, template_name, is_active, network_source, {where_clause}, {description}, {unconnected_junctions}, {one_connected_junction})

       Add a remove feature by attribute rule to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     network_source (Table / Feature Class):
         Network Source to Remove
     where_clause {SQL Expression}:
         Expression
     description {String}:
         Description
     unconnected_junctions {Boolean}:
         Junctions must be unconnected
     one_connected_junction {Boolean}:
         Junctions must be connected to a single junction"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddRemoveFeatureByAttributeRule_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        network_source,
                        where_clause,
                        description,
                        unconnected_junctions,
                        one_connected_junction,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddRemoveFeatureRule_un", None)
def AddRemoveFeatureRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    source_type: Literal["JUNCTIONS", "EDGES", "BOTH"] | None = None,
    inverse_source_selection: Literal["EXCLUDE_SOURCE_CLASSES", "INCLUDE_SOURCE_CLASSES"] | None = None,
    network_source=None,
    description=None,
    unconnected_junctions: Literal["MUST_BE_UNCONNECTED", "NO_CONSTRAINT"] | None = None,
    one_connected_junction: Literal["MUST_BE_CONNECTED_TO_SINGLE_JUNCTION", "NO_CONSTRAINT"] | None = None,
) -> Result2[str, str]:
    """AddRemoveFeatureRule_un(in_utility_network, template_name, is_active, source_type, inverse_source_selection, network_source;network_source..., {description}, {unconnected_junctions}, {one_connected_junction})

       Add a remove feature rule to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     source_type (String):
         Source Type
     inverse_source_selection (String):
         Rule Process
     network_source (Table / Feature Class):
         Sources
     description {String}:
         Description
     unconnected_junctions {Boolean}:
         Junctions must be unconnected
     one_connected_junction {Boolean}:
         Junctions must be connected to a single junction"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddRemoveFeatureRule_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        source_type,
                        inverse_source_selection,
                        network_source,
                        description,
                        unconnected_junctions,
                        one_connected_junction,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddReshapeDiagramEdgesLayout_un", None)
def AddReshapeDiagramEdgesLayout(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    reshape_type: Literal[
        "REMOVE_VERTICES",
        "SQUARE_EDGES",
        "SEPARATE_OVERLAPPING_EDGES",
        "REDUCE_VERTICES_BY_ANGLE",
        "MARK_CROSSING_EDGES",
    ]
    | None = None,
    is_path_preserved: Literal["PRESERVE_PATH", "IGNORE_PATH"] | None = None,
    offset_between_segment_absolute=None,
    breakpoint_absolute=None,
    shift_between_edge_absolute=None,
    angle_threshold=None,
    circular_arc_radius=None,
    circular_arc_position: Literal[
        "LEFT_OF_VERTICAL_SEGMENT", "RIGHT_OF_VERTICAL_SEGMENT", "ABOVE_HORIZONTAL_SEGMENT", "BELOW_HORIZONTAL_SEGMENT"
    ]
    | None = None,
) -> Result2[str, str]:
    """AddReshapeDiagramEdgesLayout_un(in_utility_network, template_name, is_active, {are_containers_preserved}, {reshape_type}, {is_path_preserved}, {offset_between_segment_absolute}, {breakpoint_absolute}, {shift_between_edge_absolute}, {angle_threshold}, {circular_arc_radius}, {circular_arc_position})

       Add a reshape diagram edges layout to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     are_containers_preserved {Boolean}:
         Preserve container layout
     reshape_type {String}:
         Reshape Operation
     is_path_preserved {Boolean}:
         Preserve path
     offset_between_segment_absolute {Linear Unit}:
         Offset Between Edges
     breakpoint_absolute {Linear Unit}:
         Break Point Position
     shift_between_edge_absolute {Linear Unit}:
         Offset Between Edges
     angle_threshold {Double}:
         Angle Threshold
     circular_arc_radius {Linear Unit}:
         Circular Arc Radius
     circular_arc_position {String}:
         Circular Arc Position"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddReshapeDiagramEdgesLayout_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        are_containers_preserved,
                        reshape_type,
                        is_path_preserved,
                        offset_between_segment_absolute,
                        breakpoint_absolute,
                        shift_between_edge_absolute,
                        angle_threshold,
                        circular_arc_radius,
                        circular_arc_position,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddSetRootJunctionByAttributeRule_un", None)
def AddSetRootJunctionByAttributeRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    junction_source=None,
    where_clause=None,
    description=None,
) -> Result2[str, str]:
    """AddSetRootJunctionByAttributeRule_un(in_utility_network, template_name, is_active, junction_source, {where_clause}, {description})

       Add a set root junction by attribute rule to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     junction_source (Table / Feature Class):
         Junction Source to Select
     where_clause {SQL Expression}:
         Expression
     description {String}:
         Description"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddSetRootJunctionByAttributeRule_un(
                *gp_fixargs(
                    (in_utility_network, template_name, is_active, junction_source, where_clause, description), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddSetStartingPointByAttributeRule_un", None)
def AddSetStartingPointByAttributeRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    network_source=None,
    where_clause=None,
    junction_terminals=None,
    description=None,
) -> Result2[str, str]:
    """AddSetStartingPointByAttributeRule_un(in_utility_network, template_name, is_active, network_source, {where_clause}, {junction_terminals;junction_terminals...}, {description})

       Add a set starting point by attribute rule to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     network_source (Table / Feature Class):
         Network Source
     where_clause {SQL Expression}:
         Expression
     junction_terminals {Long}:
         Junction Terminal(s)
     description {String}:
         Description"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddSetStartingPointByAttributeRule_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        network_source,
                        where_clause,
                        junction_terminals,
                        description,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddSmartTreeLayout_un", None)
def AddSmartTreeLayout(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    tree_direction: Literal["FROM_LEFT_TO_RIGHT", "FROM_RIGHT_TO_LEFT", "FROM_BOTTOM_TO_TOP", "FROM_TOP_TO_BOTTOM"]
    | None = None,
    is_unit_absolute: Literal["ABSOLUTE_UNIT", "PROPORTIONAL_UNIT"] | None = None,
    subtree_absolute=None,
    subtree_proportional=None,
    perpendicular_absolute=None,
    perpendicular_proportional=None,
    along_absolute=None,
    along_proportional=None,
    disjoined_graph_absolute=None,
    disjoined_graph_proportional=None,
    are_edges_orthogonal: Literal["ORTHOGONAL_EDGES", "SLANTED_EDGES"] | None = None,
    breakpoint_position=None,
    edge_display_type: Literal["REGULAR_EDGES", "ORTHOGONAL_EDGES", "CURVED_EDGES"] | None = None,
    offset_absolute=None,
    offset_proportional=None,
) -> Result2[str, str]:
    """AddSmartTreeLayout_un(in_utility_network, template_name, is_active, {are_containers_preserved}, {tree_direction}, {is_unit_absolute}, {subtree_absolute}, {subtree_proportional}, {perpendicular_absolute}, {perpendicular_proportional}, {along_absolute}, {along_proportional}, {disjoined_graph_absolute}, {disjoined_graph_proportional}, {are_edges_orthogonal}, {breakpoint_position}, {edge_display_type}, {offset_absolute}, {offset_proportional})

       Add a smart tree layout to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     are_containers_preserved {Boolean}:
         Preserve container layout
     tree_direction {String}:
         Tree Direction
     is_unit_absolute {Boolean}:
         Spacing values interpreted as absolute units in the diagram coordinate system
     subtree_absolute {Linear Unit}:
         Between Subtrees
     subtree_proportional {Double}:
         Between Subtrees
     perpendicular_absolute {Linear Unit}:
         Between Junctions Perpendicular to the Direction
     perpendicular_proportional {Double}:
         Between Junctions Perpendicular to the Direction
     along_absolute {Linear Unit}:
         Between Junctions Along the Direction
     along_proportional {Double}:
         Between Junctions Along the Direction
     disjoined_graph_absolute {Linear Unit}:
         Between Disjoined Graphs
     disjoined_graph_proportional {Double}:
         Between Disjoined Graphs
     are_edges_orthogonal {Boolean}:
         Orthogonally display edges
     breakpoint_position {Double}:
         Break Point Relative Position (%)
     edge_display_type {String}:
         Edge Display Type
     offset_absolute {Linear Unit}:
         Offset
     offset_proportional {Double}:
         Offset"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddSmartTreeLayout_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        are_containers_preserved,
                        tree_direction,
                        is_unit_absolute,
                        subtree_absolute,
                        subtree_proportional,
                        perpendicular_absolute,
                        perpendicular_proportional,
                        along_absolute,
                        along_proportional,
                        disjoined_graph_absolute,
                        disjoined_graph_proportional,
                        are_edges_orthogonal,
                        breakpoint_position,
                        edge_display_type,
                        offset_absolute,
                        offset_proportional,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddSpatialDispatchLayout_un", None)
def AddSpatialDispatchLayout(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    iterations_number=None,
    maximum_shift_factor=None,
) -> Result2[str, str]:
    """AddSpatialDispatchLayout_un(in_utility_network, template_name, is_active, {are_containers_preserved}, {iterations_number}, {maximum_shift_factor})

       Add a spatial dispatch layout to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     are_containers_preserved {Boolean}:
         Preserve container layout
     iterations_number {Long}:
         Number of Iterations
     maximum_shift_factor {Double}:
         Maximum Shift Factor"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddSpatialDispatchLayout_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        are_containers_preserved,
                        iterations_number,
                        maximum_shift_factor,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddStartIterationRule_un", None)
def AddStartIterationRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    description=None,
) -> Result2[str, str]:
    """AddStartIterationRule_un(in_utility_network, template_name, is_active, {description})

       Add a start iteration rule to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     description {String}:
         Description"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddStartIterationRule_un(*gp_fixargs((in_utility_network, template_name, is_active, description), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddStopIterationRule_un", None)
def AddStopIterationRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    description=None,
) -> Result2[str, str]:
    """AddStopIterationRule_un(in_utility_network, template_name, is_active, {description})

       Add a stop iteration rule to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     description {String}:
         Description"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddStopIterationRule_un(*gp_fixargs((in_utility_network, template_name, is_active, description), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddStructuralAttachmentsRule_un", None)
def AddStructuralAttachmentsRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    description=None,
) -> Result2[str, str]:
    """AddStructuralAttachmentsRule_un(in_utility_network, template_name, is_active, {description})

       Add a structural attachments rule to a diagram template

    INPUTS:
     in_utility_network (Utility Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     description {String}:
         Description"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddStructuralAttachmentsRule_un(
                *gp_fixargs((in_utility_network, template_name, is_active, description), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddTraceLocations_un", None)
def AddTraceLocations(
    in_utility_network=None,
    out_feature_class=None,
    load_selected_features: Literal["LOAD_SELECTED_FEATURES", "DO_NOT_LOAD_SELECTED_FEATURES"] | None = None,
    clear_trace_locations: Literal["CLEAR_LOCATIONS", "KEEP_LOCATIONS"] | None = None,
    trace_locations=None,
    filter_barrier: Literal["FILTER_BARRIER", "TRAVERSABILITY_BARRIER"] | None = None,
) -> Result1[str]:
    """AddTraceLocations_un(in_utility_network, out_feature_class, {load_selected_features}, {clear_trace_locations}, {trace_locations;trace_locations...}, {filter_barrier})

       Creates a feature class to be used as the starting points and barriers
       input for the Trace tool.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The input utility network where the trace locations will be added.
     load_selected_features {Boolean}:
         Specifies whether selected features in the active map will be loaded
         as trace locations.LOAD_SELECTED_FEATURES-Trace locations will be
         loaded based on the
         selection in the map.DO_NOT_LOAD_SELECTED_FEATURES-Trace locations
         will not be loaded based
         on the selection in the map. This is the default. However, trace
         locations can be loaded using the trace_locations parameter.
     clear_trace_locations {Boolean}:
         Specifies whether existing trace locations will be cleared from the
         output feature class.CLEAR_LOCATIONS-Existing trace locations will be
         cleared.KEEP_LOCATIONS-Existing trace locations will not be cleared;
         they will
         be kept. This is the default.
     trace_locations {Value Table}:
         The trace locations that will be added to the output feature class. If
         you are not using the load_selected_features parameter in an active
         map, you can use this parameter to specify the utility network
         features to add as trace locations by providing the required values in
         the value table. The trace locations properties are as follows:
         Layer
         Name-The layer or feature class participating in the utility
         network that contains a starting point or barrier location to be
         added. If there is an active map, only layers from the map are
         allowed; if not, this will be the feature class name.Global ID-The
         Global ID of the feature for the location that will be
         added.Terminal ID-The terminal ID of the feature for the location that
         will
         be added.Percent Along-The percent along value of the feature. For
         line
         features, the default value is 0.5.
     filter_barrier {Boolean}:
         Specifies whether the barriers for the trace locations will behave as
         filter barriers.FILTER_BARRIER-The barriers will behave as filter
         barriers. This is
         useful for subnetwork-based traces in which the barrier allows the
         subnetwork to be evaluated first and is then applied on a second
         traversal of the network features.TRAVERSABILITY_BARRIER-The barriers
         will behave as traversability
         barriers, which define the extent of subnetworks, and will be
         evaluated on the first pass. This is the default.This parameter
         requires ArcGIS Enterprise 10.8.1 or later.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class containing the trace locations. If you
         provide a new feature class name, a new output feature class will be
         created.To use an existing feature class that was previously created
         by this
         tool and append or overwrite the existing locations, provide the name
         of the existing feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddTraceLocations_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        out_feature_class,
                        load_selected_features,
                        clear_trace_locations,
                        trace_locations,
                        filter_barrier,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddTraceRule_un", None)
def AddTraceRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    trace_type: Literal["CONNECTED", "SUBNETWORK", "UPSTREAM", "DOWNSTREAM", "SHORTEST_PATH"] | None = None,
    domain_network=None,
    tier=None,
    target_tier=None,
    include_structures: Literal["INCLUDE_STRUCTURES", "EXCLUDE_STRUCTURES"] | None = None,
    include_barriers: Literal["INCLUDE_BARRIERS", "EXCLUDE_BARRIERS"] | None = None,
    condition_barriers=None,
    function_barriers=None,
    traversability_scope: Literal["BOTH_JUNCTIONS_AND_EDGES", "JUNCTIONS_ONLY", "EDGES_ONLY"] | None = None,
    filter_barriers=None,
    filter_function_barriers=None,
    filter_scope: Literal["BOTH_JUNCTIONS_AND_EDGES", "JUNCTIONS_ONLY", "EDGES_ONLY"] | None = None,
    filter_bitset_network_attribute_name=None,
    filter_nearest: Literal["FILTER_BY_NEAREST", "DO_NOT_FILTER"] | None = None,
    nearest_count=None,
    nearest_cost_network_attribute=None,
    nearest_categories=None,
    nearest_assets=None,
    propagators=None,
    description=None,
    allow_indeterminate_flow: Literal["TRACE_INDETERMINATE_FLOW", "IGNORE_INDETERMINATE_FLOW"] | None = None,
    path_direction: Literal["NO_DIRECTION", "PATH_UPSTREAM", "PATH_DOWNSTREAM"] | None = None,
    path_network_weight_name=None,
    use_trace_config: Literal["USE_TRACE_CONFIGURATION", "DO_NOT_USE_TRACE_CONFIGURATION"] | None = None,
    trace_config_name=None,
    use_digitized_direction: Literal["USE_DIGITIZED_DIRECTION", "IGNORE_DIGITIZED_DIRECTION"] | None = None,
) -> Result2[str, str]:
    """AddTraceRule_un(in_utility_network, template_name, is_active, {trace_type}, {domain_network}, {tier}, {target_tier}, {include_structures}, {include_barriers}, {condition_barriers;condition_barriers...}, {function_barriers;function_barriers...}, {traversability_scope}, {filter_barriers;filter_barriers...}, {filter_function_barriers;filter_function_barriers...}, {filter_scope}, {filter_bitset_network_attribute_name}, {filter_nearest}, {nearest_count}, {nearest_cost_network_attribute}, {nearest_categories;nearest_categories...}, {nearest_assets;nearest_assets...}, {propagators;propagators...}, {description}, {allow_indeterminate_flow}, {path_direction}, {path_network_weight_name}, {use_trace_config}, {trace_config_name}, {use_digitized_direction})

       Add a trace rule to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     trace_type {String}:
         Trace Type
     domain_network {String}:
         Domain Network
     tier {String}:
         Tier
     target_tier {String}:
         Target Tier
     include_structures {Boolean}:
         Include Structures
     include_barriers {Boolean}:
         Include Barrier Features
     condition_barriers {Value Table}:
         Condition Barriers
     function_barriers {Value Table}:
         Function Barriers
     traversability_scope {String}:
         Apply Traversability To
     filter_barriers {Value Table}:
         Filter Barriers
     filter_function_barriers {Value Table}:
         Filter Function Barriers
     filter_scope {String}:
         Apply Filter To
     filter_bitset_network_attribute_name {String}:
         Filter by bitset network attribute
     filter_nearest {Boolean}:
         Filter by nearest
     nearest_count {Long}:
         Count
     nearest_cost_network_attribute {String}:
         Cost Network Attribute
     nearest_categories {String}:
         Nearest Categories
     nearest_assets {String}:
         Nearest Asset Groups/Types
     propagators {Value Table}:
         Propagators
     description {String}:
         Description
     allow_indeterminate_flow {Boolean}:
         Allow Indeterminate Flow
     path_direction {String}:
         Path Direction
     path_network_weight_name {String}:
         Shortest Path Network Attribute Name
     use_trace_config {Boolean}:
         Use Trace Configuration
     trace_config_name {String}:
         Trace Configuration Name
     use_digitized_direction {Boolean}:
         Use Digitized Direction"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddTraceRule_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        trace_type,
                        domain_network,
                        tier,
                        target_tier,
                        include_structures,
                        include_barriers,
                        condition_barriers,
                        function_barriers,
                        traversability_scope,
                        filter_barriers,
                        filter_function_barriers,
                        filter_scope,
                        filter_bitset_network_attribute_name,
                        filter_nearest,
                        nearest_count,
                        nearest_cost_network_attribute,
                        nearest_categories,
                        nearest_assets,
                        propagators,
                        description,
                        allow_indeterminate_flow,
                        path_direction,
                        path_network_weight_name,
                        use_trace_config,
                        trace_config_name,
                        use_digitized_direction,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AlterDiagramProperties_un", None)
def AlterDiagramProperties(
    in_network_diagram_layer=None,
    out_name=None,
    access_right_type: Literal["PUBLIC", "PROTECTED", "PRIVATE"] | None = None,
    tags=None,
) -> Result1[str | Layer]:
    """AlterDiagramProperties_un(in_network_diagram_layer, {out_name}, {access_right_type}, {tags})

       Set the name, the location and the access rights of a network diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     out_name {String}:
         Network Diagram Name
     access_right_type {String}:
         Network Diagram Access Rights
     tags {String}:
         Tags (optional)"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AlterDiagramProperties_un(
                *gp_fixargs((in_network_diagram_layer, out_name, access_right_type, tags), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AlterDiagramTemplate_un", None)
def AlterDiagramTemplate(
    in_utility_network=None,
    template_name=None,
    out_name=None,
    is_default_template: Literal["DEFAULT_TEMPLATE", "NOT_DEFAULT_TEMPLATE"] | None = None,
    are_rules_and_layouts_removed: Literal["REMOVE_RULES_AND_LAYOUTS", "DO_NOT_REMOVE_RULES_AND_LAYOUTS"] | None = None,
    are_vertices_kept: Literal["KEEP_VERTICES", "DO_NOT_KEEP_VERTICES"] | None = None,
    container_margin=None,
    is_diagram_storage_enabled: Literal["ENABLE_DIAGRAM_STORAGE", "DISABLE_DIAGRAM_STORAGE"] | None = None,
    is_diagram_extension_enabled: Literal["ENABLE_DIAGRAM_EXTENSION", "DISABLE_DIAGRAM_EXTENSION"] | None = None,
    description=None,
    are_layer_definitions_removed: Literal["REMOVE_LAYER_DEFINITIONS", "DO_NOT_REMOVE_LAYER_DEFINITIONS"] | None = None,
) -> Result2[str, str]:
    """AlterDiagramTemplate_un(in_utility_network, template_name, {out_name}, {is_default_template}, {are_rules_and_layouts_removed}, {are_vertices_kept}, {container_margin}, {is_diagram_storage_enabled}, {is_diagram_extension_enabled}, {description}, {are_layer_definitions_removed})

       Alter the properties of the Diagram Template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     out_name {String}:
         Diagram Template Name
     is_default_template {Boolean}:
         Default template
     are_rules_and_layouts_removed {Boolean}:
         Remove the diagram template rule and layout definitions
     are_vertices_kept {Boolean}:
         Keep initial vertices on edges
     container_margin {Linear Unit}:
         Container Margin
     is_diagram_storage_enabled {Boolean}:
         Enable to store diagrams
     is_diagram_extension_enabled {Boolean}:
         Enable to extend diagrams
     description {String}:
         Description
     are_layer_definitions_removed {Boolean}:
         Reset the diagram template layer definition to default"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AlterDiagramTemplate_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        out_name,
                        is_default_template,
                        are_rules_and_layouts_removed,
                        are_vertices_kept,
                        container_margin,
                        is_diagram_storage_enabled,
                        is_diagram_extension_enabled,
                        description,
                        are_layer_definitions_removed,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AppendToDiagram_un", None)
def AppendToDiagram(
    in_network_diagram_layer=None,
    map=None,
) -> Result1[str | Layer]:
    """AppendToDiagram_un(in_network_diagram_layer, map)

       Append Elements to a Network Diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     map (Map):
         Input Map"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AppendToDiagram_un(*gp_fixargs((in_network_diagram_layer, map), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyAngleDirectedLayout_un", None)
def ApplyAngleDirectedLayout(
    in_network_diagram_layer=None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    iterations_number=None,
    number_of_directions: Literal["TWELVE_DIRECTIONS", "EIGHT_DIRECTIONS", "FOUR_DIRECTIONS"] | None = None,
    run_async: Literal["RUN_ASYNCHRONOUSLY", "RUN_SYNCHRONOUSLY"] | None = None,
) -> Result1[str | Layer]:
    """ApplyAngleDirectedLayout_un(in_network_diagram_layer, {are_containers_preserved}, {iterations_number}, {number_of_directions}, {run_async})

       Apply the angle directed layout to a diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     are_containers_preserved {Boolean}:
         Preserve container layout
     iterations_number {Long}:
         Number of Iterations
     number_of_directions {String}:
         Number of Directions
     run_async {Boolean}:
         Run in asynchronous mode on the server"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyAngleDirectedLayout_un(
                *gp_fixargs(
                    (
                        in_network_diagram_layer,
                        are_containers_preserved,
                        iterations_number,
                        number_of_directions,
                        run_async,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyCompressionLayout_un", None)
def ApplyCompressionLayout(
    in_network_diagram_layer=None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    grouping_distance_absolute=None,
    vertices_removal_rule: Literal["ALL", "OUTER", "OUTER_EXCEPT_FIRST"] | None = None,
    run_async: Literal["RUN_ASYNCHRONOUSLY", "RUN_SYNCHRONOUSLY"] | None = None,
) -> Result1[str | Layer]:
    """ApplyCompressionLayout_un(in_network_diagram_layer, {are_containers_preserved}, {grouping_distance_absolute}, {vertices_removal_rule}, {run_async})

       Apply the compression layout to a diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     are_containers_preserved {Boolean}:
         Preserve container layout
     grouping_distance_absolute {Linear Unit}:
         Maximum Distance for Grouping
     vertices_removal_rule {String}:
         Vertex Removal Rule
     run_async {Boolean}:
         Run in asynchronous mode on the server"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyCompressionLayout_un(
                *gp_fixargs(
                    (
                        in_network_diagram_layer,
                        are_containers_preserved,
                        grouping_distance_absolute,
                        vertices_removal_rule,
                        run_async,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyForceDirectedLayout_un", None)
def ApplyForceDirectedLayout(
    in_network_diagram_layer=None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    iterations_number=None,
    repel_factor=None,
    degree_freedom: Literal["LOW", "MEDIUM", "HIGH"] | None = None,
    breakpoint_position=None,
    edge_display_type: Literal["REGULAR_EDGES", "CURVED_EDGES"] | None = None,
    run_async: Literal["RUN_ASYNCHRONOUSLY", "RUN_SYNCHRONOUSLY"] | None = None,
) -> Result1[str | Layer]:
    """ApplyForceDirectedLayout_un(in_network_diagram_layer, {are_containers_preserved}, {iterations_number}, {repel_factor}, {degree_freedom}, {breakpoint_position}, {edge_display_type}, {run_async})

       Apply the force directed layout to a diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     are_containers_preserved {Boolean}:
         Preserve container layout
     iterations_number {Long}:
         Number of Iterations
     repel_factor {Double}:
         Repel Factor
     degree_freedom {String}:
         Degree of Freedom
     breakpoint_position {Double}:
         Break Point Relative Position (%)
     edge_display_type {String}:
         Edge Display Type
     run_async {Boolean}:
         Run in asynchronous mode on the server"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyForceDirectedLayout_un(
                *gp_fixargs(
                    (
                        in_network_diagram_layer,
                        are_containers_preserved,
                        iterations_number,
                        repel_factor,
                        degree_freedom,
                        breakpoint_position,
                        edge_display_type,
                        run_async,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyGeoPositionsLayout_un", None)
def ApplyGeoPositionsLayout(
    in_network_diagram_layer=None,
    restore_edges_geo_positions: Literal["RESTORE_EDGES_GEO_POSITIONS", "DO_NOT_RESTORE_EDGES_GEO_POSITIONS"]
    | None = None,
    run_async: Literal["RUN_ASYNCHRONOUSLY", "RUN_SYNCHRONOUSLY"] | None = None,
) -> Result1[str | Layer]:
    """ApplyGeoPositionsLayout_un(in_network_diagram_layer, {restore_edges_geo_positions}, {run_async})

       Apply the geo positions layout to a diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     restore_edges_geo_positions {Boolean}:
         Restore edges geographic positions
     run_async {Boolean}:
         Run in asynchronous mode on the server"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyGeoPositionsLayout_un(
                *gp_fixargs((in_network_diagram_layer, restore_edges_geo_positions, run_async), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyGridLayout_un", None)
def ApplyGridLayout(
    in_network_diagram_layer=None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    cell_width_absolute=None,
    cell_height_absolute=None,
    run_async: Literal["RUN_ASYNCHRONOUSLY", "RUN_SYNCHRONOUSLY"] | None = None,
) -> Result1[str | Layer]:
    """ApplyGridLayout_un(in_network_diagram_layer, {are_containers_preserved}, {cell_width_absolute}, {cell_height_absolute}, {run_async})

       Apply the grid layout to a diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     are_containers_preserved {Boolean}:
         Preserve container layout
     cell_width_absolute {Linear Unit}:
         Cell Width
     cell_height_absolute {Linear Unit}:
         Cell Height
     run_async {Boolean}:
         Run in asynchronous mode on the server"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyGridLayout_un(
                *gp_fixargs(
                    (
                        in_network_diagram_layer,
                        are_containers_preserved,
                        cell_width_absolute,
                        cell_height_absolute,
                        run_async,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyLinearDispatchLayout_un", None)
def ApplyLinearDispatchLayout(
    in_network_diagram_layer=None,
    junction_placement_type: Literal["EQUAL_DISTANCE", "USER_DEFINE_DISTANCE", "ITERATIVE_DISTANCE"] | None = None,
    is_unit_absolute: Literal["ABSOLUTE_UNIT", "PROPORTIONAL_UNIT"] | None = None,
    maximum_shift_absolute=None,
    maximum_shift_proportional=None,
    minimum_shift_absolute=None,
    minimum_shift_proportional=None,
    iterations_number=None,
    is_path_preserved: Literal["PRESERVE_PATH", "IGNORE_PATH"] | None = None,
    are_leaves_moved: Literal["MOVE_LEAVES", "DO_NOT_MOVE_LEAVES"] | None = None,
    are_leaves_expanded: Literal["EXPAND_LEAVES", "DO_NOT_EXPAND_LEAVES"] | None = None,
    expand_shift_absolute=None,
    expand_shift_proportional=None,
    run_async: Literal["RUN_ASYNCHRONOUSLY", "RUN_SYNCHRONOUSLY"] | None = None,
) -> Result1[str | Layer]:
    """ApplyLinearDispatchLayout_un(in_network_diagram_layer, {junction_placement_type}, {is_unit_absolute}, {maximum_shift_absolute}, {maximum_shift_proportional}, {minimum_shift_absolute}, {minimum_shift_proportional}, {iterations_number}, {is_path_preserved}, {are_leaves_moved}, {are_leaves_expanded}, {expand_shift_absolute}, {expand_shift_proportional}, {run_async})

       Apply the linear dispatch layout to a diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     junction_placement_type {String}:
         Junctions Placement
     is_unit_absolute {Boolean}:
         Spacing values interpreted as absolute units in the diagram coordinate system
     maximum_shift_absolute {Linear Unit}:
         Maximum Shift
     maximum_shift_proportional {Double}:
         Maximum Shift
     minimum_shift_absolute {Linear Unit}:
         Minimum Shift
     minimum_shift_proportional {Double}:
         Minimum Shift
     iterations_number {Long}:
         Number of Iterations
     is_path_preserved {Boolean}:
         Preserve path
     are_leaves_moved {Boolean}:
         Move leaves
     are_leaves_expanded {Boolean}:
         Expand leaves
     expand_shift_absolute {Linear Unit}:
         Maximum Expand Shift
     expand_shift_proportional {Double}:
         Maximum Expand Shift
     run_async {Boolean}:
         Run in asynchronous mode on the server"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyLinearDispatchLayout_un(
                *gp_fixargs(
                    (
                        in_network_diagram_layer,
                        junction_placement_type,
                        is_unit_absolute,
                        maximum_shift_absolute,
                        maximum_shift_proportional,
                        minimum_shift_absolute,
                        minimum_shift_proportional,
                        iterations_number,
                        is_path_preserved,
                        are_leaves_moved,
                        are_leaves_expanded,
                        expand_shift_absolute,
                        expand_shift_proportional,
                        run_async,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyMainRingLayout_un", None)
def ApplyMainRingLayout(
    in_network_diagram_layer=None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    ring_type: Literal["ELLIPSE", "RECTANGLE"] | None = None,
    is_unit_absolute: Literal["ABSOLUTE_UNIT", "PROPORTIONAL_UNIT"] | None = None,
    ring_width_absolute=None,
    ring_width_proportional=None,
    ring_height_absolute=None,
    ring_height_proportional=None,
    tree_type: Literal["BOTH_SIDES", "LEFT_SIDE", "RIGHT_SIDE", "SMART_TREE"] | None = None,
    perpendicular_absolute=None,
    perpendicular_proportional=None,
    along_absolute=None,
    along_proportional=None,
    breakpoint_position=None,
    edge_display_type: Literal["REGULAR_EDGES", "ORTHOGONAL_EDGES", "CURVED_EDGES"] | None = None,
    run_async: Literal["RUN_ASYNCHRONOUSLY", "RUN_SYNCHRONOUSLY"] | None = None,
    offset_absolute=None,
    offset_proportional=None,
) -> Result1[str | Layer]:
    """ApplyMainRingLayout_un(in_network_diagram_layer, {are_containers_preserved}, {ring_type}, {is_unit_absolute}, {ring_width_absolute}, {ring_width_proportional}, {ring_height_absolute}, {ring_height_proportional}, {tree_type}, {perpendicular_absolute}, {perpendicular_proportional}, {along_absolute}, {along_proportional}, {breakpoint_position}, {edge_display_type}, {run_async}, {offset_absolute}, {offset_proportional})

       Apply the main ring layout to a diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     are_containers_preserved {Boolean}:
         Preserve container layout
     ring_type {String}:
         Ring Type
     is_unit_absolute {Boolean}:
         Spacing values interpreted as absolute units in the diagram coordinate system
     ring_width_absolute {Linear Unit}:
         Ring Width
     ring_width_proportional {Double}:
         Ring Width
     ring_height_absolute {Linear Unit}:
         Ring Height
     ring_height_proportional {Double}:
         Ring Height
     tree_type {String}:
         Hierarchical Tree Type
     perpendicular_absolute {Linear Unit}:
         Between Junctions Perpendicular to the Direction
     perpendicular_proportional {Double}:
         Between Junctions Perpendicular to the Direction
     along_absolute {Linear Unit}:
         Between Junctions Along the Direction
     along_proportional {Double}:
         Between Junctions Along the Direction
     breakpoint_position {Double}:
         Break Point Relative Position (%)
     edge_display_type {String}:
         Edge Display Type
     run_async {Boolean}:
         Run in asynchronous mode on the server
     offset_absolute {Linear Unit}:
         Offset
     offset_proportional {Double}:
         Offset"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyMainRingLayout_un(
                *gp_fixargs(
                    (
                        in_network_diagram_layer,
                        are_containers_preserved,
                        ring_type,
                        is_unit_absolute,
                        ring_width_absolute,
                        ring_width_proportional,
                        ring_height_absolute,
                        ring_height_proportional,
                        tree_type,
                        perpendicular_absolute,
                        perpendicular_proportional,
                        along_absolute,
                        along_proportional,
                        breakpoint_position,
                        edge_display_type,
                        run_async,
                        offset_absolute,
                        offset_proportional,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyMainlineTreeLayout_un", None)
def ApplyMainlineTreeLayout(
    in_network_diagram_layer=None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    tree_direction: Literal["FROM_LEFT_TO_RIGHT", "FROM_RIGHT_TO_LEFT", "FROM_BOTTOM_TO_TOP", "FROM_TOP_TO_BOTTOM"]
    | None = None,
    branches_placement: Literal["BOTH_SIDES", "LEFT_SIDE", "RIGHT_SIDE"] | None = None,
    is_unit_absolute: Literal["ABSOLUTE_UNIT", "PROPORTIONAL_UNIT"] | None = None,
    perpendicular_absolute=None,
    perpendicular_proportional=None,
    along_absolute=None,
    along_proportional=None,
    disjoined_graph_absolute=None,
    disjoined_graph_proportional=None,
    are_edges_orthogonal: Literal["ORTHOGONAL_EDGES", "SLANTED_EDGES"] | None = None,
    breakpoint_position=None,
    edge_display_type: Literal["REGULAR_EDGES", "ORTHOGONAL_EDGES", "CURVED_EDGES"] | None = None,
    run_async: Literal["RUN_ASYNCHRONOUSLY", "RUN_SYNCHRONOUSLY"] | None = None,
    offset_absolute=None,
    offset_proportional=None,
) -> Result1[str | Layer]:
    """ApplyMainlineTreeLayout_un(in_network_diagram_layer, {are_containers_preserved}, {tree_direction}, {branches_placement}, {is_unit_absolute}, {perpendicular_absolute}, {perpendicular_proportional}, {along_absolute}, {along_proportional}, {disjoined_graph_absolute}, {disjoined_graph_proportional}, {are_edges_orthogonal}, {breakpoint_position}, {edge_display_type}, {run_async}, {offset_absolute}, {offset_proportional})

       Apply the mainline tree layout to a diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     are_containers_preserved {Boolean}:
         Preserve container layout
     tree_direction {String}:
         Tree Direction
     branches_placement {String}:
         Branches Placement
     is_unit_absolute {Boolean}:
         Spacing values interpreted as absolute units in the diagram coordinate system
     perpendicular_absolute {Linear Unit}:
         Between Junctions Perpendicular to the Direction
     perpendicular_proportional {Double}:
         Between Junctions Perpendicular to the Direction
     along_absolute {Linear Unit}:
         Between Junctions Along the Direction
     along_proportional {Double}:
         Between Junctions Along the Direction
     disjoined_graph_absolute {Linear Unit}:
         Between Disjoined Graphs
     disjoined_graph_proportional {Double}:
         Between Disjoined Graphs
     are_edges_orthogonal {Boolean}:
         Orthogonally display edges
     breakpoint_position {Double}:
         Break Point Relative Position (%)
     edge_display_type {String}:
         Edge Display Type
     run_async {Boolean}:
         Run in asynchronous mode on the server
     offset_absolute {Linear Unit}:
         Offset
     offset_proportional {Double}:
         Offset"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyMainlineTreeLayout_un(
                *gp_fixargs(
                    (
                        in_network_diagram_layer,
                        are_containers_preserved,
                        tree_direction,
                        branches_placement,
                        is_unit_absolute,
                        perpendicular_absolute,
                        perpendicular_proportional,
                        along_absolute,
                        along_proportional,
                        disjoined_graph_absolute,
                        disjoined_graph_proportional,
                        are_edges_orthogonal,
                        breakpoint_position,
                        edge_display_type,
                        run_async,
                        offset_absolute,
                        offset_proportional,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyPartialOverlappingEdgesLayout_un", None)
def ApplyPartialOverlappingEdgesLayout(
    in_network_diagram_layer=None,
    buffer_width_absolute=None,
    offset_absolute=None,
    optimize_edges: Literal["OPTIMIZE_EDGES", "DO_NOT_OPTIMIZE_EDGES"] | None = None,
    run_async: Literal["RUN_ASYNCHRONOUSLY", "RUN_SYNCHRONOUSLY"] | None = None,
) -> Result1[str | Layer]:
    """ApplyPartialOverlappingEdgesLayout_un(in_network_diagram_layer, buffer_width_absolute, offset_absolute, {optimize_edges}, {run_async})

       Apply the partial overlapping edges to a diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     buffer_width_absolute (Linear Unit):
         Buffer Width
     offset_absolute (Linear Unit):
         Offset
     optimize_edges {Boolean}:
         Optimize edges
     run_async {Boolean}:
         Run in asynchronous mode on the server"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyPartialOverlappingEdgesLayout_un(
                *gp_fixargs(
                    (in_network_diagram_layer, buffer_width_absolute, offset_absolute, optimize_edges, run_async), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyRadialTreeLayout_un", None)
def ApplyRadialTreeLayout(
    in_network_diagram_layer=None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    is_unit_absolute: Literal["ABSOLUTE_UNIT", "PROPORTIONAL_UNIT"] | None = None,
    initial_radius_absolute=None,
    initial_radius_proportional=None,
    disjoined_graph_absolute=None,
    disjoined_graph_proportional=None,
    radius_factor=None,
    run_async: Literal["RUN_ASYNCHRONOUSLY", "RUN_SYNCHRONOUSLY"] | None = None,
) -> Result1[str | Layer]:
    """ApplyRadialTreeLayout_un(in_network_diagram_layer, {are_containers_preserved}, {is_unit_absolute}, {initial_radius_absolute}, {initial_radius_proportional}, {disjoined_graph_absolute}, {disjoined_graph_proportional}, {radius_factor}, {run_async})

       Apply the radial tree layout to a diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     are_containers_preserved {Boolean}:
         Preserve container layout
     is_unit_absolute {Boolean}:
         Spacing values interpreted as absolute units in the diagram coordinate system
     initial_radius_absolute {Linear Unit}:
         Initial Radius
     initial_radius_proportional {Double}:
         Initial Radius
     disjoined_graph_absolute {Linear Unit}:
         Between Disjoined Graphs
     disjoined_graph_proportional {Double}:
         Between Disjoined Graphs
     radius_factor {Double}:
         Radius Factor
     run_async {Boolean}:
         Run in asynchronous mode on the server"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyRadialTreeLayout_un(
                *gp_fixargs(
                    (
                        in_network_diagram_layer,
                        are_containers_preserved,
                        is_unit_absolute,
                        initial_radius_absolute,
                        initial_radius_proportional,
                        disjoined_graph_absolute,
                        disjoined_graph_proportional,
                        radius_factor,
                        run_async,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyRotateTreeLayout_un", None)
def ApplyRotateTreeLayout(
    in_network_diagram_layer=None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    rotation_angle=None,
    run_async: Literal["RUN_ASYNCHRONOUSLY", "RUN_SYNCHRONOUSLY"] | None = None,
    rotate_junction: Literal["ROTATE", "DO_NOT_ROTATE"] | None = None,
) -> Result1[str | Layer]:
    """ApplyRotateTreeLayout_un(in_network_diagram_layer, {are_containers_preserved}, {rotation_angle}, {run_async}, {rotate_junction})

       Apply the rotate tree layout to a diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     are_containers_preserved {Boolean}:
         Preserve container layout
     rotation_angle {Double}:
         Angle
     run_async {Boolean}:
         Run in asynchronous mode on the server
     rotate_junction {Boolean}:
         Rotate junction symbols with the same angle"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyRotateTreeLayout_un(
                *gp_fixargs(
                    (in_network_diagram_layer, are_containers_preserved, rotation_angle, run_async, rotate_junction),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplySmartTreeLayout_un", None)
def ApplySmartTreeLayout(
    in_network_diagram_layer=None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    tree_direction: Literal["FROM_LEFT_TO_RIGHT", "FROM_RIGHT_TO_LEFT", "FROM_BOTTOM_TO_TOP", "FROM_TOP_TO_BOTTOM"]
    | None = None,
    is_unit_absolute: Literal["ABSOLUTE_UNIT", "PROPORTIONAL_UNIT"] | None = None,
    subtree_absolute=None,
    subtree_proportional=None,
    perpendicular_absolute=None,
    perpendicular_proportional=None,
    along_absolute=None,
    along_proportional=None,
    disjoined_graph_absolute=None,
    disjoined_graph_proportional=None,
    are_edges_orthogonal: Literal["ORTHOGONAL_EDGES", "SLANTED_EDGES"] | None = None,
    breakpoint_position=None,
    edge_display_type: Literal["REGULAR_EDGES", "ORTHOGONAL_EDGES", "CURVED_EDGES"] | None = None,
    run_async: Literal["RUN_ASYNCHRONOUSLY", "RUN_SYNCHRONOUSLY"] | None = None,
    offset_absolute=None,
    offset_proportional=None,
) -> Result1[str | Layer]:
    """ApplySmartTreeLayout_un(in_network_diagram_layer, {are_containers_preserved}, {tree_direction}, {is_unit_absolute}, {subtree_absolute}, {subtree_proportional}, {perpendicular_absolute}, {perpendicular_proportional}, {along_absolute}, {along_proportional}, {disjoined_graph_absolute}, {disjoined_graph_proportional}, {are_edges_orthogonal}, {breakpoint_position}, {edge_display_type}, {run_async}, {offset_absolute}, {offset_proportional})

       Apply the smart tree layout to a diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     are_containers_preserved {Boolean}:
         Preserve container layout
     tree_direction {String}:
         Tree Direction
     is_unit_absolute {Boolean}:
         Spacing values interpreted as absolute units in the diagram coordinate system
     subtree_absolute {Linear Unit}:
         Between Subtrees
     subtree_proportional {Double}:
         Between Subtrees
     perpendicular_absolute {Linear Unit}:
         Between Junctions Perpendicular to the Direction
     perpendicular_proportional {Double}:
         Between Junctions Perpendicular to the Direction
     along_absolute {Linear Unit}:
         Between Junctions Along the Direction
     along_proportional {Double}:
         Between Junctions Along the Direction
     disjoined_graph_absolute {Linear Unit}:
         Between Disjoined Graphs
     disjoined_graph_proportional {Double}:
         Between Disjoined Graphs
     are_edges_orthogonal {Boolean}:
         Orthogonally display edges
     breakpoint_position {Double}:
         Break Point Relative Position (%)
     edge_display_type {String}:
         Edge Display Type
     run_async {Boolean}:
         Run in asynchronous mode on the server
     offset_absolute {Linear Unit}:
         Offset
     offset_proportional {Double}:
         Offset"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplySmartTreeLayout_un(
                *gp_fixargs(
                    (
                        in_network_diagram_layer,
                        are_containers_preserved,
                        tree_direction,
                        is_unit_absolute,
                        subtree_absolute,
                        subtree_proportional,
                        perpendicular_absolute,
                        perpendicular_proportional,
                        along_absolute,
                        along_proportional,
                        disjoined_graph_absolute,
                        disjoined_graph_proportional,
                        are_edges_orthogonal,
                        breakpoint_position,
                        edge_display_type,
                        run_async,
                        offset_absolute,
                        offset_proportional,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplySpatialDispatchLayout_un", None)
def ApplySpatialDispatchLayout(
    in_network_diagram_layer=None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    iterations_number=None,
    maximum_shift_factor=None,
    run_async: Literal["RUN_ASYNCHRONOUSLY", "RUN_SYNCHRONOUSLY"] | None = None,
) -> Result1[str | Layer]:
    """ApplySpatialDispatchLayout_un(in_network_diagram_layer, {are_containers_preserved}, {iterations_number}, {maximum_shift_factor}, {run_async})

       Apply the spatial dispatch layout to a diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     are_containers_preserved {Boolean}:
         Preserve container layout
     iterations_number {Long}:
         Number of Iterations
     maximum_shift_factor {Double}:
         Maximum Shift Factor
     run_async {Boolean}:
         Run in asynchronous mode on the server"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplySpatialDispatchLayout_un(
                *gp_fixargs(
                    (
                        in_network_diagram_layer,
                        are_containers_preserved,
                        iterations_number,
                        maximum_shift_factor,
                        run_async,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyTemplateLayouts_un", None)
def ApplyTemplateLayouts(
    in_network_diagram_layer=None,
) -> Result1[str | Layer]:
    """ApplyTemplateLayouts_un(in_network_diagram_layer)

       Apply the preconfigured template layouts

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyTemplateLayouts_un(*gp_fixargs((in_network_diagram_layer,), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateClusterKeys_un", None)
def CalculateClusterKeys(
    in_utility_network=None,
    in_overwrite_values: Literal["OVERWRITE_VALUES", "DO_NOT_OVERWRITE_VALUES"] | None = None,
    in_extent=None,
) -> Result1[str]:
    """CalculateClusterKeys_un(in_utility_network, {in_overwrite_values}, {in_extent})

       Calculate Cluster Keys

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         Input Utility Network
     in_overwrite_values {Boolean}:
         Overwrite
     in_extent {Extent}:
         Extent"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateClusterKeys_un(*gp_fixargs((in_utility_network, in_overwrite_values, in_extent), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ChangeDiagramsOwner_un", None)
def ChangeDiagramsOwner(
    in_diagrams=None,
    target_owner=None,
    source_owner=None,
    diagram_names=None,
) -> Result1[str | Layer]:
    """ChangeDiagramsOwner_un(in_diagrams, target_owner, {source_owner}, {diagram_names;diagram_names...})

       Change the diagrams owner

    INPUTS:
     in_diagrams (Utility Network / Trace Network / Utility Network Layer / Trace Network Layer / Diagram Layer):
         Input Network or Network Diagram Layer
     target_owner (String):
         Target Owner
     source_owner {String}:
         Source Owner
     diagram_names {String}:
         Diagram Names"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ChangeDiagramsOwner_un(*gp_fixargs((in_diagrams, target_owner, source_owner, diagram_names), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateDiagram_un", None)
def CreateDiagram(
    in_utility_network=None,
    template_name=None,
    features=None,
) -> Result2[str | Layer, str]:
    """CreateDiagram_un(in_utility_network, template_name, {features;features...})

       Create a Network Diagram

    INPUTS:
     in_utility_network (Utility Network / Trace Network / Utility Network Layer / Trace Network Layer):
         Input Network
     template_name (String):
         Input Diagram Template
     features {Feature Layer}:
         Input Features"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateDiagram_un(*gp_fixargs((in_utility_network, template_name, features), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateDiagramLayerDefinition_un", None)
def CreateDiagramLayerDefinition(
    in_utility_network=None,
    template_name=None,
    system_junctions: Literal["SHOW", "HIDE"] | None = None,
    connectivity_associations: Literal["SHOW", "HIDE"] | None = None,
    structural_attachments: Literal["SHOW", "HIDE"] | None = None,
    reduction_edges: Literal["SHOW", "HIDE"] | None = None,
    point_subLayers=None,
    polygon_subLayers=None,
    junction_object_point_subLayers=None,
    edge_object_polyline_subLayers=None,
    overwrite_all_layers: Literal["OVERWRITE_ALL", "MERGE"] | None = None,
) -> Result2[str | Layer, str]:
    """CreateDiagramLayerDefinition_un(in_utility_network, template_name, {system_junctions}, {connectivity_associations}, {structural_attachments}, {reduction_edges}, {point_subLayers;point_subLayers...}, {polygon_subLayers;polygon_subLayers...}, {junction_object_point_subLayers;junction_object_point_subLayers...}, {edge_object_polyline_subLayers;edge_object_polyline_subLayers...}, {overwrite_all_layers})

       Create or overwwrite a diagram template layer definitions

    INPUTS:
     in_utility_network (Utility Network Layer / Trace Network Layer):
         Input Network
     template_name (String):
         Input Diagram Template
     system_junctions {Boolean}:
         System Junctions
     connectivity_associations {Boolean}:
         Connectivity Associations
     structural_attachments {Boolean}:
         Structural Attachments
     reduction_edges {Boolean}:
         Reduction Edge
     point_subLayers {Value Table}:
         Points for edges reduced as junctions and collapsed polygons
     polygon_subLayers {Value Table}:
         Polygons for containers
     junction_object_point_subLayers {Value Table}:
         Points for junction objects
     edge_object_polyline_subLayers {Value Table}:
         Polylines for edge objects
     overwrite_all_layers {Boolean}:
         Overwrite all layers"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateDiagramLayerDefinition_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        system_junctions,
                        connectivity_associations,
                        structural_attachments,
                        reduction_edges,
                        point_subLayers,
                        polygon_subLayers,
                        junction_object_point_subLayers,
                        edge_object_polyline_subLayers,
                        overwrite_all_layers,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DeleteDiagram_un", None)
def DeleteDiagram(
    in_diagrams=None,
    template_names=None,
    diagram_names=None,
) -> Result1[str | Layer]:
    """DeleteDiagram_un(in_diagrams, {template_names;template_names...}, {diagram_names;diagram_names...})

       Select and delete network diagrams from a diagram dataset

    INPUTS:
     in_diagrams (Utility Network / Trace Network / Utility Network Layer / Trace Network Layer / Diagram Layer):
         Input Network or Network Diagram Layer
     template_names {String}:
         Template Names
     diagram_names {String}:
         Diagram Names"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DeleteDiagram_un(*gp_fixargs((in_diagrams, template_names, diagram_names), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DeleteDiagramTemplate_un", None)
def DeleteDiagramTemplate(
    in_utility_network=None,
    template_name=None,
) -> Result1[str]:
    """DeleteDiagramTemplate_un(in_utility_network, template_name)

       Delete a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DeleteDiagramTemplate_un(*gp_fixargs((in_utility_network, template_name), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportCircuitDefinitions_un", None)
def ExportCircuitDefinitions(
    in_utility_network=None,
    domain_network=None,
    component_type: Literal["ALL", "Circuit", "Circuit Section", "Subcircuit"] | None = None,
    out_folder_path=None,
) -> Result:
    """ExportCircuitDefinitions_un(in_utility_network, domain_network, component_type, out_folder_path)

       Export circuit definitions.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         Input Utility Network
     domain_network (String):
         Domain Network
     component_type (String):
         Component Type
     out_folder_path (Folder):
         Output Folder"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportCircuitDefinitions_un(
                *gp_fixargs((in_utility_network, domain_network, component_type, out_folder_path), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportCircuits_un", None)
def ExportCircuits(
    in_utility_network=None,
    domain_network=None,
    circuits=None,
    export_acknowledged: Literal["ACKNOWLEDGE", "NO_ACKNOWLEDGE"] | None = None,
    out_folder_path=None,
    include_geometry: Literal["INCLUDE_GEOMETRY", "EXCLUDE_GEOMETRY"] | None = None,
    include_domain_descriptions: Literal["INCLUDE_DOMAIN_DESCRIPTIONS", "EXCLUDE_DOMAIN_DESCRIPTIONS"] | None = None,
    result_types: list[Literal["FEATURES", "CONNECTIVITY"]] | Literal["FEATURES", "CONNECTIVITY"] | str | None = None,
    result_network_attributes=None,
    result_fields=None,
) -> Result:
    """ExportCircuits_un(in_utility_network, domain_network, circuits, export_acknowledged, out_folder_path, {include_geometry}, {include_domain_descriptions}, {result_types;result_types...}, {result_network_attributes;result_network_attributes...}, {result_fields;result_fields...})

       Export circuits.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         Input Utility Network
     domain_network (String):
         Domain Network
     circuits (String):
         Circuits
     export_acknowledged (Boolean):
         Set export acknowledged
     out_folder_path (Folder):
         Output Folder
     include_geometry {Boolean}:
         Include geometry
     include_domain_descriptions {Boolean}:
         Include domain descriptions
     result_types {String}:
         Result Types
     result_network_attributes {String}:
         Result Network Attributes
     result_fields {Value Table}:
         Result Fields"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportCircuits_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        domain_network,
                        circuits,
                        export_acknowledged,
                        out_folder_path,
                        include_geometry,
                        include_domain_descriptions,
                        result_types,
                        result_network_attributes,
                        result_fields,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportDiagramContent_un", None)
def ExportDiagramContent(
    in_utility_network=None,
    network_diagram_name=None,
    out_file=None,
    include_diagram_properties: Literal["INCLUDE_DIAGRAM_PROPERTIES", "EXCLUDE_DIAGRAM_PROPERTIES"] | None = None,
    include_geometries: Literal["INCLUDE_GEOMETRIES", "EXCLUDE_GEOMETRIES"] | None = None,
    include_attributes: Literal["INCLUDE_ATTRIBUTES", "EXCLUDE_ATTRIBUTES"] | None = None,
    include_aggregations: Literal["INCLUDE_AGGREGATIONS", "EXCLUDE_AGGREGATIONS"] | None = None,
    use_domains: Literal["USE_CODED_VALUE_NAMES", "DONT_USE_CODED_VALUE_NAMES"] | None = None,
) -> Result1[str]:
    """ExportDiagramContent_un(in_utility_network, network_diagram_name, out_file, {include_diagram_properties}, {include_geometries}, {include_attributes}, {include_aggregations}, {use_domains})

       Export a diagram content to a file

    INPUTS:
     in_utility_network (Utility Network / Trace Network / Utility Network Layer / Trace Network Layer / Diagram Layer):
         Input Network or Network Diagram Layer
     network_diagram_name (String):
         Network Diagram Name
     include_diagram_properties {Boolean}:
         Include diagram properties
     include_geometries {Boolean}:
         Include geometries
     include_attributes {Boolean}:
         Include attributes
     include_aggregations {Boolean}:
         Include aggregations
     use_domains {Boolean}:
         Use domain and subtype descriptions

    OUTPUTS:
     out_file (File):
         Output File"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportDiagramContent_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        network_diagram_name,
                        out_file,
                        include_diagram_properties,
                        include_geometries,
                        include_attributes,
                        include_aggregations,
                        use_domains,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportDiagramLayerDefinition_un", None)
def ExportDiagramLayerDefinition(
    in_network_diagram_layer=None,
    out_ndld_file=None,
) -> Result2[str, str | Layer]:
    """ExportDiagramLayerDefinition_un(in_network_diagram_layer, out_ndld_file)

       Export a diagram template layer definition to a file

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer

    OUTPUTS:
     out_ndld_file (File):
         Output Diagram Layer Definition File"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportDiagramLayerDefinition_un(*gp_fixargs((in_network_diagram_layer, out_ndld_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportDiagramTemplateDefinitions_un", None)
def ExportDiagramTemplateDefinitions(
    in_utility_network=None,
    template_name=None,
    out_ndbd_file=None,
    out_ndld_file=None,
) -> Result:
    """ExportDiagramTemplateDefinitions_un(in_utility_network, template_name, {out_ndbd_file}, {out_ndld_file})

       Export diagram template definitions to a file

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template

    OUTPUTS:
     out_ndbd_file {File}:
         Output Rule and Layout Definitions File
     out_ndld_file {File}:
         Output Diagram Layer Definition File"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportDiagramTemplateDefinitions_un(
                *gp_fixargs((in_utility_network, template_name, out_ndbd_file, out_ndld_file), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportSubnetwork_un", None)
def ExportSubnetwork(
    in_utility_network=None,
    domain_network=None,
    tier=None,
    subnetwork_name=None,
    export_acknowledged: Literal["ACKNOWLEDGE", "NO_ACKNOWLEDGE"] | None = None,
    out_json_file=None,
    condition_barriers=None,
    function_barriers=None,
    include_barriers: Literal["INCLUDE_BARRIERS", "EXCLUDE_BARRIERS"] | None = None,
    traversability_scope: Literal["BOTH_JUNCTIONS_AND_EDGES", "JUNCTIONS_ONLY", "EDGES_ONLY"] | None = None,
    propagators=None,
    include_geometry: Literal["INCLUDE_GEOMETRY", "EXCLUDE_GEOMETRY"] | None = None,
    result_types: list[Literal["FEATURES", "CONNECTIVITY", "CONTAINMENT_AND_ATTACHMENT_ASSOCIATIONS"]]
    | Literal["FEATURES", "CONNECTIVITY", "CONTAINMENT_AND_ATTACHMENT_ASSOCIATIONS"]
    | str
    | None = None,
    result_network_attributes=None,
    result_fields=None,
    include_domain_descriptions: Literal["INCLUDE_DOMAIN_DESCRIPTIONS", "EXCLUDE_DOMAIN_DESCRIPTIONS"] | None = None,
) -> Result2[str, str]:
    """ExportSubnetwork_un(in_utility_network, domain_network, tier, subnetwork_name, export_acknowledged, out_json_file, {condition_barriers;condition_barriers...}, {function_barriers;function_barriers...}, {include_barriers}, {traversability_scope}, {propagators;propagators...}, {include_geometry}, {result_types;result_types...}, {result_network_attributes;result_network_attributes...}, {result_fields;result_fields...}, {include_domain_descriptions})

       Exports subnetworks from a utility network into a .json file. This
       tool also allows you to delete a row in the Subnetworks table as long
       as the Is deleted attribute is set to true. This indicates that the
       subnetwork controller has been removed from the subnetwork.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network that contains the subnetwork to export.
     domain_network (String):
         The domain network that contains the subnetwork.
     tier (String):
         The tier that contains the subnetwork.
     subnetwork_name (String):
         The name of the subnetwork that will be exported from the tier. Select
         a specific source to export the corresponding subnetwork information.
     export_acknowledged (Boolean):
         Specifies whether theattribute for the corresponding
         controller in the Subnetworks table and feature in the SubnetLine
         feature class will be updated. LASTACKEXPORTSUBNETWORK
         ACKNOWLEDGE-Theattribute for the corresponding controller in
         the Subnetworks table will be updated. If the source has been marked
         for deletion (Is deleted = True), it will be deleted from the
         Subnetworks table. This option requires that the input utility network
         reference the default version. LASTACKEXPORTSUBNETWORK
         NO_ACKNOWLEDGE-Theattribute for the corresponding controller
         in the Subnetworks table will not be updated. This is the default.
         LASTACKEXPORTSUBNETWORK
     condition_barriers {Value Table}:
         Sets a traversability barrier condition on features based on a
         comparison to a network attribute or check for a category string. A
         condition barrier uses a network attribute or network category, an
         operator and a type, and an attribute value. For example, stop a trace
         when a feature has theattribute equal to the specific value of Open.
         When a feature meets this condition, the trace stops. If you're using
         more than one attribute, you can use theparameter to define an And or
         an Or condition. Device StatusCombine using        Condition
         barrier components are as follows:
         Name-Filter by any network attribute defined in the system or specify
         Category to use a network category.Operator-Choose from a number of
         operators. Type-Specify either Specific value or Network
         attribute for
         the type of value from the Name parameter that will serve as a
         barrier. The Type parameter must be Specific value when the Name
         parameter is. CategoryValue-Provide a specific value for the
         input attribute or category
         that would cause termination based on the operator value.Combine
         Using-Set this value if you have multiple conditions to add.
         You can combine them using an And or an Or condition.The condition
         barrier operator values are as follows:IS_EQUAL_TO-The attribute is
         equal to the value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).The
         condition barrier type options are as follows:SPECIFIC_VALUE-Filter by
         a specific value or network
         category.NETWORK_ATTRIBUTE-Filter by a network attribute.The Combine
         Using values are as follows:AND-Combine the condition barriers.OR-Use
         if either condition barrier
         is met.
     function_barriers {Value Table}:
         Sets a traversability barrier on features based on a function.
         Function barriers can be used to do such things as restrict how far
         the trace travels from the starting point, or set a maximum value to
         stop a trace. For example, the length of each line traveled is added
         to the total distance traveled so far. When the total length traveled
         reaches the value specified, the trace stops. Function barrier
         components are as follows:
         Function-Choose from a number of different calculation
         functions.Attribute-Filter by any network attribute defined in the
         system.Operator-Choose from a number of different operators.Value-Set
         a specific value of the input attribute type that, if
         discovered, will cause the termination.Use Local Values-Calculate
         values in each direction as opposed to an
         overall global value. For example, use for a function barrier that is
         calculating the sum of Shape length in which the trace terminates if
         the value is greater than or equal to 4. In the global case, after you
         have traversed two edges with a value of 2, you have already reached a
         shape length sum of 4, so the trace stops. If local values are used,
         the local values along each path change, so the trace goes
         farther.TRUE-Use local values.FALSE-Use global values. This is the
         default.Possible values for the function barrier function options are
         as
         follows:AVERAGE-The average of the input values will be
         calculated.COUNT-The
         number of features will be identified.MAX-The maximum of the input
         values will be identified.MIN-The minimum of the input values will be
         identified.ADD-The sum of the input values will be calculated.
         SUBTRACT-The difference in the input values will be
         calculated. Subnetwork controllers and loops trace types do
         not support the
         subtract function.For example, the starting point feature has a value
         of 20. The next
         feature has a value of 30. If you use the minimum function, the result
         is 20, maximum is 30, add is 50, average is 25, count is 2, and
         subtract is -10.The function barrier operator value options are as
         follows:IS_EQUAL_TO-The attribute is equal to the
         value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).
     include_barriers {Boolean}:
         Specifies whether the traversability barrier features will be included
         in the trace results. Traversability barriers are optional even if
         they have been preset in the subnetwork
         definition.INCLUDE_BARRIERS-Traversability barriers will be included
         in the trace
         results. This is the default.EXCLUDE_BARRIERS-Traversability barriers
         will not be included in the
         trace results.
     traversability_scope {String}:
         Specifies the type of traversability that will be applied.
         Traversability scope determines whether traversability is applied to
         junctions, edges, or both. For example, if a condition barrier is
         defined to stop the trace if DEVICESTATUS is set to Open and
         traversability scope is set to edges only, the trace will not stop
         even if the trace encounters an open device, because DEVICESTATUS is
         only applicable to junctions. In other words, this parameter indicates
         to the trace whether to ignore junctions, edges, or
         both.BOTH_JUNCTIONS_AND_EDGES-Traversability will be applied to both
         junctions and edges. This is the default.JUNCTIONS_ONLY-Traversability
         will be applied to junctions only.EDGES_ONLY-Traversability will be
         applied to edges only.
     propagators {Value Table}:
         Specifies the network attributes to propagate as well as how that
         propagation will occur during a trace. Propagated class attributes
         denote the key values on subnetwork controllers that are disseminated
         to the rest of the features in the subnetwork. For example, in an
         electric distribution model, you can propagate the phase value.
         Propagators components are as follows:        Attribute-Filter
         by any network attribute defined in the
         system.Substitution Attribute-Use a substituted value instead of
         bitset
         network attribute values. Substitutions are encoded based on the
         number of bits in the network attribute being propagated. A
         substitution is a mapping of each bit in phase to another bit. For
         example, for Phase AC, one substitution could map bit A to B, and bit
         C to null. In this example, the substitution for 1010 (Phase AC) is
         0000-0010-0000-0000 (512). The substitution captures the mapping so
         you know that Phase A was mapped to B and Phase C was mapped to null,
         and not the other way around (that is, Phase A was not mapped to null
         and Phase C was not mapped to B).Function-Choose from a number of
         calculation functions.Operator-Choose from a number of
         operators.Value-Provide a specific value for the input attribute type
         that would
         cause termination based on the operator value.Possible values for the
         propagators function are as follows:PROPAGATED_BITWISE_AND-Compare the
         values from one feature to the
         next.PROPAGATED_MIN-Get the minimum value.PROPAGATED_MAX-Get the
         maximum value.The propagator operator values are as
         follows:IS_EQUAL_TO-The attribute is equal to the
         value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).
     include_geometry {Boolean}:
         Specifies whether geometry will be included in the
         results.INCLUDE_GEOMETRY-Geometry will be included in the
         results.EXCLUDE_GEOMETRY-Geometry will not be included in the results.
         This is
         the default.For enterprise geodatabases, this parameter requires
         ArcGIS Enterprise
         10.7 or later.
     result_types {String}:
         Specifies the types of results that will be
         returned.CONNECTIVITY-Features that are connected through geometric
         coincidence
         or connectivity associations will be returned. This is the
         default.FEATURES-Feature-level information will be
         returned.CONTAINMENT_AND_ATTACHMENT_ASSOCIATIONS-Features that are
         associated
         through containment and structural attachment associations will be
         returned.For enterprise geodatabases, this parameter requires ArcGIS
         Enterprise
         10.7 or later.The containment and attachment associations option
         requires ArcGIS
         Enterprise 10.8.1 or later.
     result_network_attributes {String}:
         The network attributes that will be included in the results.For
         enterprise geodatabases, this parameter requires ArcGIS Enterprise
         10.7 or later.
     result_fields {Value Table}:
         The fields from a feature class that will be returned as results. The
         values of the fields will be returned in the results for the features
         in the subnetwork.For enterprise geodatabases, this parameter requires
         ArcGIS Enterprise
         10.7 or later.
     include_domain_descriptions {Boolean}:
         Specifies whether domain descriptions will be included in the output
         .json file to communicate domain mapping for controllers,
         featureElements, connectivity, and
         associations.INCLUDE_DOMAIN_DESCRIPTIONS-Domain descriptions will be
         included in
         the results.EXCLUDE_DOMAIN_DESCRIPTIONS-Domain descriptions will not
         be included
         in the results. This is the default.For enterprise geodatabases, this
         parameter requires ArcGIS Enterprise
         10.9.1 or later.

    OUTPUTS:
     out_json_file (File):
         The name and location of the .json file that will be generated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportSubnetwork_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        domain_network,
                        tier,
                        subnetwork_name,
                        export_acknowledged,
                        out_json_file,
                        condition_barriers,
                        function_barriers,
                        include_barriers,
                        traversability_scope,
                        propagators,
                        include_geometry,
                        result_types,
                        result_network_attributes,
                        result_fields,
                        include_domain_descriptions,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExtendDiagram_un", None)
def ExtendDiagram(
    in_network_diagram_layer=None,
    ignore_traversability: Literal["IGNORE_TRAVERSABILITY", "HONOR_TRAVERSABILITY"] | None = None,
    extension_type: Literal["BY_CONNECTIVITY", "BY_TRAVERSABILITY", "BY_ATTACHMENT", "BY_CONTAINMENT"] | None = None,
) -> Result1[str | Layer]:
    """ExtendDiagram_un(in_network_diagram_layer, {ignore_traversability}, {extension_type})

       Extend a Network Diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     ignore_traversability {Boolean}:
         Ignore traversability
     extension_type {String}:
         Extension Type"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExtendDiagram_un(*gp_fixargs((in_network_diagram_layer, ignore_traversability, extension_type), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GetDiagramTemplateNames_un", None)
def GetDiagramTemplateNames(
    in_utility_network=None,
) -> Result1[str]:
    """GetDiagramTemplateNames_un(in_utility_network)

       Get all the diagram template names defined in a utility network

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.GetDiagramTemplateNames_un(*gp_fixargs((in_utility_network,), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportCircuitDefinitions_un", None)
def ImportCircuitDefinitions(
    in_utility_network=None,
    domain_network=None,
    circuits_csv_file=None,
    circuit_sections_csv_file=None,
    subcircuits_csv_file=None,
) -> Result1[str]:
    """ImportCircuitDefinitions_un(in_utility_network, domain_network, {circuits_csv_file}, {circuit_sections_csv_file}, {subcircuits_csv_file})

       Import circuit definitions.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         Input Utility Network
     domain_network (String):
         Domain Network
     circuits_csv_file {File}:
         Input Circuits File (.csv)
     circuit_sections_csv_file {File}:
         Input Circuit Sections File (.csv)
     subcircuits_csv_file {File}:
         Input Subcircuits File (.csv)"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportCircuitDefinitions_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        domain_network,
                        circuits_csv_file,
                        circuit_sections_csv_file,
                        subcircuits_csv_file,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportDiagramTemplateDefinitions_un", None)
def ImportDiagramTemplateDefinitions(
    in_utility_network=None,
    template_name=None,
    ndbd_file=None,
    ndld_file=None,
) -> Result2[str, str]:
    """ImportDiagramTemplateDefinitions_un(in_utility_network, template_name, {ndbd_file}, {ndld_file})

       Import diagram template definitions from file(s)

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     ndbd_file {File}:
         Rule and Layout Definitions File
     ndld_file {File}:
         Diagram Layer Definition File"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportDiagramTemplateDefinitions_un(
                *gp_fixargs((in_utility_network, template_name, ndbd_file, ndld_file), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeDiagramLayer_un", None)
def MakeDiagramLayer(
    in_utility_network=None,
    network_diagram_name=None,
    out_layer=None,
    sublayers_option: Literal["ADD_SUBLAYERS", "DO_NOT_ADD_SUBLAYERS"] | None = None,
) -> Result1[str | Layer]:
    """MakeDiagramLayer_un(in_utility_network, network_diagram_name, out_layer, {sublayers_option})

       Make a diagram layer

    INPUTS:
     in_utility_network (Utility Network / Trace Network / Utility Network Layer / Trace Network Layer):
         Input Network
     network_diagram_name (String):
         Network Diagram Name
     sublayers_option {Boolean}:
         Make a Group Layer containing the feature layers

    OUTPUTS:
     out_layer (Diagram Layer / Group Layer):
         Output Layer"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeDiagramLayer_un(
                *gp_fixargs((in_utility_network, network_diagram_name, out_layer, sublayers_option), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("OverwriteDiagram_un", None)
def OverwriteDiagram(
    in_network_diagram_layer=None,
    map=None,
) -> Result1[str | Layer]:
    """OverwriteDiagram_un(in_network_diagram_layer, map)

       Overwrite a Network Diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     map (Map):
         Input Map"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.OverwriteDiagram_un(*gp_fixargs((in_network_diagram_layer, map), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PurgeTemporaryDiagrams_un", None)
def PurgeTemporaryDiagrams(
    in_utility_network=None,
    created_before=None,
) -> Result1[str]:
    """PurgeTemporaryDiagrams_un(in_utility_network, {created_before})

       Purge the temporary diagrams

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     created_before {Date}:
         Created Before"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PurgeTemporaryDiagrams_un(*gp_fixargs((in_utility_network, created_before), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RebuildNetworkTopology_un", None)
def RebuildNetworkTopology(
    in_utility_network=None,
    extent=None,
) -> Result1[str]:
    """RebuildNetworkTopology_un(in_utility_network, extent)

       Rebuilds the network topology in a specified extent to address errors
       identified during the validate network topology operation.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network for which the network topology will be rebuilt.
     extent (Extent):
         Specifies the geographical extent that will be used to rebuild the
         network topology.MAXOF-The maximum extent of all inputs will be
         used.MINOF-The minimum
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
            gp.RebuildNetworkTopology_un(*gp_fixargs((in_utility_network, extent), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RepairNetworkTopology_un", None)
def RepairNetworkTopology(
    in_utility_network=None,
    out_log_file=None,
) -> Result2[str, str]:
    """RepairNetworkTopology_un(in_utility_network, {out_log_file})

       Verifies and repairs inconsistencies identified in the network
       topology system tables.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network that will be repaired.

    OUTPUTS:
     out_log_file {File}:
         The folder location and name of the file containing the discovered
         issues."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RepairNetworkTopology_un(*gp_fixargs((in_utility_network, out_log_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ReshapeDiagramEdgesLayout_un", None)
def ReshapeDiagramEdgesLayout(
    in_network_diagram_layer=None,
    are_containers_preserved: Literal["PRESERVE_CONTAINERS", "IGNORE_CONTAINERS"] | None = None,
    reshape_type: Literal[
        "REMOVE_VERTICES",
        "SQUARE_EDGES",
        "SEPARATE_OVERLAPPING_EDGES",
        "REDUCE_VERTICES_BY_ANGLE",
        "MARK_CROSSING_EDGES",
    ]
    | None = None,
    is_path_preserved: Literal["PRESERVE_PATH", "IGNORE_PATH"] | None = None,
    offset_between_segment_absolute=None,
    breakpoint_absolute=None,
    shift_between_edge_absolute=None,
    angle_threshold=None,
    circular_arc_radius=None,
    circular_arc_position: Literal[
        "LEFT_OF_VERTICAL_SEGMENT", "RIGHT_OF_VERTICAL_SEGMENT", "ABOVE_HORIZONTAL_SEGMENT", "BELOW_HORIZONTAL_SEGMENT"
    ]
    | None = None,
    run_async: Literal["RUN_ASYNCHRONOUSLY", "RUN_SYNCHRONOUSLY"] | None = None,
) -> Result1[str | Layer]:
    """ReshapeDiagramEdgesLayout_un(in_network_diagram_layer, {are_containers_preserved}, {reshape_type}, {is_path_preserved}, {offset_between_segment_absolute}, {breakpoint_absolute}, {shift_between_edge_absolute}, {angle_threshold}, {circular_arc_radius}, {circular_arc_position}, {run_async})

       Apply the reshape diagram edges layout to a diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     are_containers_preserved {Boolean}:
         Preserve container layout
     reshape_type {String}:
         Reshape Operation
     is_path_preserved {Boolean}:
         Preserve path
     offset_between_segment_absolute {Linear Unit}:
         Offset Between Edges
     breakpoint_absolute {Linear Unit}:
         Break Point Position
     shift_between_edge_absolute {Linear Unit}:
         Offset Between Edges
     angle_threshold {Double}:
         Angle Threshold
     circular_arc_radius {Linear Unit}:
         Circular Arc Radius
     circular_arc_position {String}:
         Circular Arc Position
     run_async {Boolean}:
         Run in asynchronous mode on the server"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ReshapeDiagramEdgesLayout_un(
                *gp_fixargs(
                    (
                        in_network_diagram_layer,
                        are_containers_preserved,
                        reshape_type,
                        is_path_preserved,
                        offset_between_segment_absolute,
                        breakpoint_absolute,
                        shift_between_edge_absolute,
                        angle_threshold,
                        circular_arc_radius,
                        circular_arc_position,
                        run_async,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("StoreDiagram_un", None)
def StoreDiagram(
    in_network_diagram_layer=None,
    out_name=None,
    access_right_type: Literal["PUBLIC", "PROTECTED", "PRIVATE"] | None = None,
    tags=None,
) -> Result1[str | Layer]:
    """StoreDiagram_un(in_network_diagram_layer, out_name, {access_right_type}, {tags})

       Store a temporary diagram and alter its location and its access rights

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     access_right_type {String}:
         Network Diagram Access Rights
     tags {String}:
         Tags (optional)

    OUTPUTS:
     out_name (Diagram Layer):
         Network Diagram Name"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.StoreDiagram_un(*gp_fixargs((in_network_diagram_layer, out_name, access_right_type, tags), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Trace_un", None)
def Trace(
    in_utility_network=None,
    trace_type: Literal[
        "CONNECTED",
        "SUBNETWORK",
        "SUBNETWORK_CONTROLLERS",
        "UPSTREAM",
        "DOWNSTREAM",
        "LOOPS",
        "SHORTEST_PATH",
        "ISOLATION",
    ]
    | None = None,
    starting_points=None,
    barriers=None,
    domain_network=None,
    tier=None,
    target_tier=None,
    subnetwork_name=None,
    shortest_path_network_attribute_name=None,
    include_containers: Literal["INCLUDE_CONTAINERS", "EXCLUDE_CONTAINERS"] | None = None,
    include_content: Literal["INCLUDE_CONTENT", "EXCLUDE_CONTENT"] | None = None,
    include_structures: Literal["INCLUDE_STRUCTURES", "EXCLUDE_STRUCTURES"] | None = None,
    include_barriers: Literal["INCLUDE_BARRIERS", "EXCLUDE_BARRIERS"] | None = None,
    validate_consistency: Literal["VALIDATE_CONSISTENCY", "DO_NOT_VALIDATE_CONSISTENCY"] | None = None,
    condition_barriers=None,
    function_barriers=None,
    traversability_scope: Literal["BOTH_JUNCTIONS_AND_EDGES", "JUNCTIONS_ONLY", "EDGES_ONLY"] | None = None,
    filter_barriers=None,
    filter_function_barriers=None,
    filter_scope: Literal["BOTH_JUNCTIONS_AND_EDGES", "JUNCTIONS_ONLY", "EDGES_ONLY"] | None = None,
    filter_bitset_network_attribute_name=None,
    filter_nearest: Literal["FILTER_BY_NEAREST", "DO_NOT_FILTER"] | None = None,
    nearest_count=None,
    nearest_cost_network_attribute=None,
    nearest_categories=None,
    nearest_assets=None,
    functions=None,
    propagators=None,
    output_assettypes=None,
    output_conditions=None,
    include_isolated_features: Literal["INCLUDE_ISOLATED_FEATURES", "EXCLUDE_ISOLATED_FEATURES"] | None = None,
    ignore_barriers_at_starting_points: Literal[
        "IGNORE_BARRIERS_AT_STARTING_POINTS", "DO_NOT_IGNORE_BARRIERS_AT_STARTING_POINTS"
    ]
    | None = None,
    include_up_to_first_spatial_container: Literal[
        "INCLUDE_UP_TO_FIRST_SPATIAL_CONTAINER", "DO_NOT_INCLUDE_UP_TO_FIRST_SPATIAL_CONTAINER"
    ]
    | None = None,
    result_types: list[
        Literal[
            "SELECTION",
            "AGGREGATED_GEOMETRY",
            "CONNECTIVITY",
            "ELEMENTS",
            "FEATURES",
            "CONTAINMENT_AND_ATTACHMENT_ASSOCIATIONS",
        ]
    ]
    | Literal[
        "SELECTION",
        "AGGREGATED_GEOMETRY",
        "CONNECTIVITY",
        "ELEMENTS",
        "FEATURES",
        "CONTAINMENT_AND_ATTACHMENT_ASSOCIATIONS",
    ]
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
    aggregated_polygons=None,
    allow_indeterminate_flow: Literal["TRACE_INDETERMINATE_FLOW", "IGNORE_INDETERMINATE_FLOW"] | None = None,
    validate_locatability: Literal["VALIDATE_LOCATABILITY", "DO_NOT_VALIDATE_LOCATABILITY"] | None = None,
    use_trace_config: Literal["USE_TRACE_CONFIGURATION", "DO_NOT_USE_TRACE_CONFIGURATION"] | None = None,
    trace_config_name=None,
    out_json_file=None,
    run_async: Literal["RUN_ASYNCHRONOUSLY", "RUN_SYNCHRONOUSLY"] | None = None,
    include_geometry: Literal["INCLUDE_GEOMETRY", "EXCLUDE_GEOMETRY"] | None = None,
    include_domain_descriptions: Literal["INCLUDE_DOMAIN_DESCRIPTIONS", "EXCLUDE_DOMAIN_DESCRIPTIONS"] | None = None,
    result_network_attributes=None,
    result_fields=None,
    use_digitized_direction: Literal["USE_DIGITIZED_DIRECTION", "IGNORE_DIGITIZED_DIRECTION"] | None = None,
    synthesize_geometries: Literal["SYNTHESIZE_GEOMETRIES", "DO_NOT_SYNTHESIZE_GEOMETRIES"] | None = None,
) -> Result:
    """Trace_un(in_utility_network, {trace_type}, {starting_points}, {barriers}, {domain_network}, {tier}, {target_tier}, {subnetwork_name}, {shortest_path_network_attribute_name}, {include_containers}, {include_content}, {include_structures}, {include_barriers}, {validate_consistency}, {condition_barriers;condition_barriers...}, {function_barriers;function_barriers...}, {traversability_scope}, {filter_barriers;filter_barriers...}, {filter_function_barriers;filter_function_barriers...}, {filter_scope}, {filter_bitset_network_attribute_name}, {filter_nearest}, {nearest_count}, {nearest_cost_network_attribute}, {nearest_categories;nearest_categories...}, {nearest_assets;nearest_assets...}, {functions;functions...}, {propagators;propagators...}, {output_assettypes;output_assettypes...}, {output_conditions;output_conditions...}, {include_isolated_features}, {ignore_barriers_at_starting_points}, {include_up_to_first_spatial_container}, {result_types;result_types...}, {selection_type}, {clear_all_previous_trace_results}, {trace_name}, {aggregated_points}, {aggregated_lines}, {aggregated_polygons}, {allow_indeterminate_flow}, {validate_locatability}, {use_trace_config}, {trace_config_name}, {out_json_file}, {run_async}, {include_geometry}, {include_domain_descriptions}, {result_network_attributes;result_network_attributes...}, {result_fields;result_fields...}, {use_digitized_direction}, {synthesize_geometries})

       Returns network features in a utility network based on connectivity or
       traversability from the specified starting points.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network on which the trace will be run. When working with
         an enterprise geodatabase, an input utility network must be from a
         feature service; a utility network from a database connection is not
         supported.
     trace_type {String}:
         Specifies the type of trace that will be used.CONNECTED-A connected
         trace that begins at one or more starting
         points and spans outward along connected features will be used. This
         is the default.SUBNETWORK-A subnetwork trace that begins at one or
         more starting
         points and spans outward to encompass the extent of the subnetwork
         will be used.SUBNETWORK_CONTROLLERS-A subnetwork controllers trace
         that locates
         sources and sinks on subnetwork controllers associated with a
         subnetwork will be used.UPSTREAM-An upstream trace that discovers
         features upstream from a
         location in the network will be used.DOWNSTREAM-A downstream trace
         that discovers features downstream from
         a location in the network will be used.LOOPS-A loops trace that spans
         outward from the starting point based
         on connectivity will be used. Loops are areas of the network where
         flow direction is ambiguous.SHORTEST_PATH-A shortest path trace that
         identifies the shortest path
         between two starting points will be used. ISOLATION-An
         isolation trace that discovers features that
         isolate an area of a network will be used. This trace type
         requires ArcGIS Enterprise 10.7 or later.
     starting_points {Table View / Feature Layer}:
         A table or feature class containing one or more records that
         represent the starting points of the trace. This feature class or
         table must include thefield to store information from the associated
         network feature. To view the specific format, create starting points
         using thetool in thepane and view the schema of the
         UN_Temp_Starting_Points feature class stored in the default
         geodatabase. FEATUREGLOBALIDStarting PointsTrace Locations
     barriers {Table View / Feature Layer}:
         A table or feature class containing one or more features that
         represent the barriers of the trace that prevent the trace from
         traversing beyond that point. This feature class or table must include
         thefield to store information from the associated network feature. To
         view the specific format, create barriers using thetool in thepane and
         view the schema of the UN_Temp_Barriers feature class stored in the
         default geodatabase. FEATUREGLOBALIDBarriersTrace Locations
     domain_network {String}:
         The name of the domain network where the trace will be run. This
         parameter is required when running the subnetwork, subnetwork
         controllers, upstream, and downstream trace types.
     tier {String}:
         The name of the tier where the trace will start. This parameter is
         required when running the subnetwork, subnetwork controllers,
         upstream, and downstream trace types.
     target_tier {String}:
         The name of the target tier to which the input tier will flow . If
         this parameter is not specified for upstream and downstream traces,
         those traces will stop when they reach the boundary of the starting
         subnetwork. This parameter can be used to allow these traces to
         continue either farther up or farther down the hierarchy.
     subnetwork_name {String}:
         The name of the subnetwork where the trace will be run. This parameter
         can be used when running a subnetwork trace type. If a subnetwork name
         is specified, the starting_points parameter is not required.
     shortest_path_network_attribute_name {String}:
         The network attribute that will be used to calculate the shortest
         path. When running a shortest path trace type, the shortest path is
         calculated using a numeric network attribute such as shape length.
         Cost- and distance-based paths can both be achieved. This parameter is
         required when running a shortest path trace.
     include_containers {Boolean}:
         Specifies whether the container features will be included in the trace
         results.INCLUDE_CONTAINERS-Container features will be included in the
         trace
         results.EXCLUDE_CONTAINERS-Container features will not be included in
         the
         trace results. This is the default.
     include_content {Boolean}:
         Specifies whether the trace will return content in container features
         in the results.INCLUDE_CONTENT-Content in container features will be
         included in the
         trace results.EXCLUDE_CONTENT-Content in container features will not
         be included in
         the trace results. This is the default.
     include_structures {Boolean}:
         Specifies whether structure features and objects will be included in
         the trace results.INCLUDE_STRUCTURES-Structure features and objects
         will be included in
         the trace results.EXCLUDE_STRUCTURES-Structure features and objects
         will not be included
         in the trace results. This is the default.
     include_barriers {Boolean}:
         Specifies whether the traversability barrier features will be included
         in the trace results. Traversability barriers are optional even if
         they have been preset in the subnetwork definition. This parameter
         does not apply to device features with
         terminals.INCLUDE_BARRIERS-Traversability barrier features will be
         included in
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
     condition_barriers {Value Table}:
         Sets a traversability barrier condition on features based on a
         comparison to a network attribute or check for a category string. A
         condition barrier uses a network attribute or network category, an
         operator and a type, and an attribute value. For example, stop a trace
         when a feature has theattribute equal to the specific value of Open.
         When a feature meets this condition, the trace stops. If you're using
         more than one attribute, you can use theparameter to define an And or
         an Or condition. Device StatusCombine using        Condition
         barrier components are as follows:
         Name-Filter by any network attribute defined in the
         system.Operator-Choose from a number of operators.Type-Choose a
         specific value or network attribute from the value that
         is specified in the name parameter.Value-Provide a specific value for
         the input attribute type that would
         cause termination based on the operator value.Combine Using-Set this
         value if you have multiple attributes to add.
         You can combine them using an And or an Or condition.The condition
         barriers Operator value options are as follows:IS_EQUAL_TO-The
         attribute is equal to the value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).The
         condition barriers Type value options are as
         follows:SPECIFIC_VALUE-Filter by a specific
         value.NETWORK_ATTRIBUTE-Filter by
         a network attribute.The condition barriers Combine Using value options
         are as follows:AND-Combine the condition barriers.OR-Use if either
         condition barrier
         is met.
     function_barriers {Value Table}:
         Sets a traversability barrier on features based on a function.
         Function barriers can be used to do such things as restrict how far
         the trace travels from the starting point, or set a maximum value to
         stop a trace. For example, the length of each line traveled is added
         to the total distance traveled so far. When the total length traveled
         reaches the value specified, the trace stops. Function barrier
         components are as follows:
         Function-Choose from a number of calculation
         functions.Attribute-Filter by any network attribute defined in the
         system.Operator-Choose from a number of operators.Value-Provide a
         specific value for the input attribute type that, if
         discovered, will cause the termination. Use Local
         Values-Calculate values in each direction as
         opposed to an overall global value, for example, a function barrier is
         configured that stops the trace once the sum ofis greater than or
         equal to 4. Using the global value, after you have traversed any two
         edges with a value of 2, you will have reached asum of 4, stopping the
         trace. If local values are used, when the traversal encounters a fork,
         the calculated values for each path along the branch are maintained
         separately. In this case, if the starting point is placed at the fork,
         the local values along each path are calculated separately and the
         trace will continue until a sum of 4 is reached along each path.
         Shape lengthShape lengthThe function barrier Function value options
         are as follows:AVERAGE-The average of the input values will be
         calculated.COUNT-The
         number of features will be identified.MAX-The maximum of the input
         values will be identified.MIN-The minimum of the input values will be
         identified.ADD-The sum of the input values will be
         calculated.SUBTRACT-The difference between the input values will be
         calculated.
         Subnetwork controllers and loops trace types do not support the
         subtract function.The function barrier Operator value options are as
         follows:IS_EQUAL_TO-The function result is equal to the
         value.DOES_NOT_EQUAL-The function result is not equal to the
         value.IS_GREATER_THAN-The function result is greater than the
         value.IS_GREATER_THAN_OR_EQUAL_TO-The function result is greater than
         or
         equal to the value.IS_LESS_THAN-The function result is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The function result is less than or
         equal to
         the value.INCLUDES_THE_VALUES-A bitwise AND operation in which all
         bits in the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).The
         function barrier Use Local Values options are as follows:TRUE-Local
         values will be used. This is the default.FALSE-Global
         values will be used.
     traversability_scope {String}:
         Specifies whether traversability will be applied to junctions, edges,
         or both. For example, if a condition barrier is defined to stop the
         trace if Device Status is equal to Open and traversability scope is
         set to edges only, the trace will not stop-even if it encounters an
         open device-because Device Status is only applicable to junctions. In
         other words, this parameter indicates to the trace whether to ignore
         junctions, edges, or both.BOTH_JUNCTIONS_AND_EDGES-Traversability will
         be applied to both
         junctions and edges. This is the default.JUNCTIONS_ONLY-Traversability
         will be applied to junctions only.EDGES_ONLY-Traversability will be
         applied to edges only.
     filter_barriers {Value Table}:
         Sets when a trace will stop for a specific category or network
         attribute. For example, stop a trace at features that have a life
         cycle status attribute that is equal to a certain value. This
         parameter is used to set a terminator based on a value of a network
         attribute that is defined in the system. If you're using more than one
         attribute, you can use the Combine Using option to define an And or an
         Or condition. Filter barrier components are as follows:
         Name-Filter
         by category or any network attribute defined in the
         system.Operator-Choose from a number of operators.Type-Choose a
         specific value or network attribute from the value that
         is specified in the name parameter.Value-Provide a specific value of
         the input attribute type that would
         cause termination based on the operator value.Combine Using-Set this
         value if you have multiple attributes to add.
         You can combine them using an And or an Or condition.The filter
         barriers Operator value options are as follows:IS_EQUAL_TO-The
         attribute is equal to the value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INLCUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).The
         filter barriers Type value options are as
         follows:SPECIFIC_VALUE-Filter by a specific
         value.NETWORK_ATTRIBUTE-Filter by
         a network attribute.The filter barriers Combine Using value options
         are as follows:AND-Combine the condition barriers.OR-Use if either
         condition barrier
         is met.
     filter_function_barriers {Value Table}:
         Filters the results of the trace for a specific category.
         Filter function barriers components are as follows:
         Function-Choose from a number of calculation
         functions.Attribute-Filter by any network attribute defined in the
         system.Operator-Choose from a number of operators.Value-Provide a
         specific value for the input attribute type that, if
         discovered, will cause the termination.Use Local Values-Calculate
         values in each direction as opposed to an
         overall global value. For example, a function barrier that is
         calculating the sum of shape length in which the trace terminates if
         the value is greater than or equal to 4. In the global case, after you
         have traversed two edges with a value of 2, you will have reached a
         shape length sum of 4, so the trace stops. If local values are used,
         the local values along each path change, or the trace continues.The
         filter function barriers Function value options are as
         follows:AVERAGE-The average of the input values will be
         calculated.COUNT-The
         number of features will be identified.MAX-The maximum of the input
         values will be identified.MIN-The minimum of the input values will be
         identified.ADD-The sum of the values will be calculated.SUBTRACT-The
         difference between the values will be calculated.
         Subnetwork controllers and loops trace types do not support the
         subtract function.The filter function barriers Operator value options
         are as follows:IS_EQUAL_TO-The attribute is equal to the
         value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).The
         filter function barriers Use Local Values options are as
         follows:TRUE-Local values will be used. This is the
         default.FALSE-Global
         values will be used.
     filter_scope {String}:
         Specifies whether the filter for a specific category will be applied
         to junctions, edges, or both. For example, if a filter barrier is
         defined to stop the trace if Device Status is equal to Open and
         traversability scope is set to edges only, the trace will not
         stop-even if the trace encounters an open device-because Device Status
         is only applicable to junctions. In other words, this parameter
         indicates to the trace whether to ignore junctions, edges, or
         both.BOTH_JUNCTIONS_AND_EDGES-The filter will be applied to both
         junctions
         and edges. This is the default.JUNCTIONS_ONLY-The filter will be
         applied to junctions only.EDGES_ONLY-The filter will be applied to
         edges only.
     filter_bitset_network_attribute_name {String}:
         The name of the network attribute that will be used to filter by
         bitset. This parameter is only applicable to upstream, downstream, and
         loops trace types. This parameter can be used to add special logic
         during a trace so the trace more closely reflects real-world
         scenarios. For example, for a loops trace, the Phases current network
         attribute can determine if the loop is a true electrical loop (the
         same phase is energized all around the loop, that is, A) and return
         only real electrical loops for the trace results. An example for an
         upstream trace is when tracing an electric distribution network,
         specify a Phases current network attribute, and the trace results will
         only include valid paths that are specified in the network attribute,
         not all paths.
     filter_nearest {Boolean}:
         Specifies whether the k-nearest neighbors algorithm will be used to
         return a number of features of a certain type within a given distance.
         You can provide a count and a cost as well as a collection of
         categories, an asset type, or both.FILTER_BY_NEAREST-The k-nearest
         neighbors algorithm will be used to
         return a number of features as specified in the nearest_count,
         nearest_cost_network_attribute, nearest_categories, or nearest_assets
         parameter.DO_NOT_FILTER-The k-nearest neighbors algorithm will not be
         used to
         filter results. This is the default.
     nearest_count {Long}:
         The number of features that will be returned when filter_nearest is
         set to FILTER_BY_NEAREST.
     nearest_cost_network_attribute {String}:
         The numeric network attribute that will be used to calculate nearness,
         cost, or distance when filter_nearest is set to FILTER_BY_NEAREST-for
         example, shape length.
     nearest_categories {String}:
         The categories that will be returned when filter_nearest is set to
         FILTER_BY_NEAREST-for example, protective.
     nearest_assets {String}:
         The asset groups and asset types that will be returned when
         filter_nearest is set to FILTER_BY_NEAREST-for example,
         ElectricDistributionDevice/Transformer/Step Down.
     functions {Value Table}:
         The calculation function or functions that will be applied to the
         trace results. Functions components are as follows:
         Function-Choose
         from a number of calculation
         functions.Attribute-Filter by any network attribute defined in the
         system.Filter Name-Filter the function results by attribute
         name.Filter Operator-Choose from a number of operators.Filter
         Type-Choose from a number of filter types.Filter Value-Provide a
         specific value for the input filter attribute.The functions Function
         value options are as follows:AVERAGE-The average of the input values
         will be calculated.COUNT-The
         number of features will be identified.MAX-The maximum of the input
         values will be identified.MIN-The minimum of the input values will be
         identified.ADD-The sum of the input values will be calculated.
         SUBTRACT-The difference between the input values will be
         calculated. Subnetwork controllers and loops trace types do
         not support the
         subtract function.For example, a starting point feature has a value of
         20. The next
         feature has a value of 30. If you are using the MINIMUM function, the
         result is 20, MAXIMUM is 30, ADD is 50, AVERAGE is 25, COUNT is 2, and
         SUBTRACT is -10.The Filter Operator value options are as
         follows:IS_EQUAL_TO-The attribute is equal to the
         value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).The
         functions Filter Type value options are as
         follows:SPECIFIC_VALUE-Filter by a specific
         value.NETWORK_ATTRIBUTE-Filter by
         a network attribute.
     propagators {Value Table}:
         Specifies the network attributes to propagate as well as how that
         propagation will occur during a trace. Propagated class attributes
         denote the key values on subnetwork controllers that are disseminated
         to the rest of the features in the subnetwork. For example, in an
         electric distribution model, you can propagate the phase value.
         Propagators components are as follows:        Attribute-Filter
         by any network attribute defined in the
         system.Substitution Attribute-Use a substituted value instead of
         bitset
         network attribute values. Substitutions are encoded based on the
         number of bits in the network attribute being propagated. A
         substitution is a mapping of each bit in phase to another bit. For
         example, for Phase AC, one substitution could map bit A to B, and bit
         C to null. In this example, the substitution for 1010 (Phase AC) is
         0000-0010-0000-0000 (512). The substitution captures the mapping so
         you know that Phase A was mapped to B and Phase C was mapped to null,
         and not the other way around (that is, Phase A was not mapped to null
         and Phase C was not mapped to B).Function-Choose from a number of
         calculation functions.Operator-Choose from a number of
         operators.Value-Provide a specific value for the input attribute type
         that would
         cause termination based on the operator value.The propagators Function
         value options are as follows:PROPAGATED_BITWISE_AND-The values from
         one feature to the next will be
         compared.PROPAGATED_MIN-The minimum value will be
         identified.PROPAGATED_MAX-The maximum value will be identified.The
         propagators Operator value options are as follows:IS_EQUAL_TO-The
         attribute is equal to the value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).This
         parameter is only available for Python.
     output_assettypes {String}:
         Filters the output asset types to be included in the results-for
         example, only return overhead transformers.
     output_conditions {Value Table}:
         The types of features that will be returned based on a network
         attribute or category. For example, in a trace configured to filter
         out everything but Tap features, any traced features that do not have
         the Tap category assigned to them will not be included in the results.
         Any traced features that do will be returned in the result selection
         set. If you're using more than one attribute, you can use the Combine
         Using option to define an And or an Or condition. Output
         conditions components are as follows:
         Name-Filter by any network attribute defined in the
         system.Operator-Choose from a number of operators.Type-Choose a
         specific value or network attribute from the value that
         is specified in the name parameter.Value-Provide a specific value of
         the input attribute type that would
         cause termination based on the operator value.Combine Using-Set this
         value if you have multiple attributes to add.
         You can combine them using an And or an Or condition.The output
         conditions Operator value options are as follows:IS_EQUAL_TO-The
         attribute is equal to the value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).The
         output conditions Type value options are as
         follows:SPECIFIC_VALUE-Filter by a specific
         value.NETWORK_ATTRIBUTE-Filter by
         a network attribute.The output conditions Combine Using value options
         are as follows:AND-Combine the conditions.OR-Use if either condition
         is met.
     include_isolated_features {Boolean}:
         Specifies whether isolated features will be included in the trace
         results. This parameter is only used when running an isolation
         trace.INCLUDE_ISOLATED_FEATURES-Isolated features will be included in
         the
         trace results.EXCLUDE_ISOLATED_FEATURES-Isolated features will not be
         included in
         the trace results. This is the default.For enterprise geodatabases,
         this parameter requires ArcGIS Enterprise
         10.7 or later.
     ignore_barriers_at_starting_points {Boolean}:
         Specifies whether dynamic barriers in the trace configuration will be
         ignored for starting points. This may be useful when performing an
         upstream protective device trace and using the discovered protective
         devices (barriers) as starting points to find subsequent upstream
         protective devices.IGNORE_BARRIERS_AT_STARTING_POINTS-Barriers at
         starting points will be
         ignored in the
         trace.DO_NOT_IGNORE_BARRIERS_AT_STARTING_POINTS-Barriers at starting
         points
         will not be ignored in the trace. This is the default.
     include_up_to_first_spatial_container {Boolean}:
         Specifies whether the containers returned will be limited to those
         encountered up to, and including, the first spatial container for each
         network element in the trace results. If no spatial containers are
         encountered but nonspatial containers are present for a given network
         element, all nonspatial containers will be included in the results.
         This parameter is only enabled when include_containers is set to
         INCLUDE_CONTAINERS.INCLUDE_UP_TO_FIRST_SPATIAL_CONTAINER-Only
         containers encountered up
         to, and including, the first spatial container will be returned in the
         results when nested containment associations are encountered along the
         trace path. If no spatial containers exist, all nonspatial containers
         will be included in the results for a given network
         element.DO_NOT_INCLUDE_UP_TO_FIRST_SPATIAL_CONTAINER-All containers
         will be
         returned in the results. This is the default.
     result_types {String}:
         Specifies the type of results that will be returned by the
         trace.SELECTION-The trace results will be returned as a selection set
         on
         the appropriate network features. This is the
         default.AGGREGATED_GEOMETRY-The trace results will be aggregated by
         geometry
         type and stored in multipart feature classes displayed in the layers
         in the active map. CONNECTIVITY-The trace results will be
         returned as a
         connectivity graph in a specified output .json file for the traversed
         network features. This option enables the out_json_file parameter.
         For enterprise geodatabases, this option requires ArcGIS Enterprise
         10.9.1 or later.ELEMENTS-The trace results will be returned as
         feature-based
         information in a specified output .json file for the traversed network
         features. This option enables the out_json_file parameter.
         FEATURES-The trace results will be returned as feature-based
         information in a specified output .json file for the traversed network
         features. This option enables the include_geometry,
         include_domain_description, result_network_attributes, result_fields,
         and out_json_file parameters. For enterprise geodatabases,
         this option requires ArcGIS Enterprise
         11.1 or later. CONTAINMENT_AND_ATTACHMENT_ASSOCIATIONS-The
         trace results
         will be returned as association information for the traversed network
         features that are associated through containment and structural
         attachment associations in a specified output .json file. This option
         enables the include_domain_description and out_json_file parameters.
         For enterprise geodatabases, this option requires ArcGIS Enterprise
         11.1 or later.
     selection_type {String}:
         Specifies how the selection will be applied and what will occur if a
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
         that were selected are removed from the current selection, and results
         that were not selected are added to the current selection. If no
         selection exists, this is the same as the new selection option.
     clear_all_previous_trace_results {Boolean}:
         Specifies whether content will be truncated from, or appended to, the
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
     allow_indeterminate_flow {Boolean}:
         Specifies whether features with indeterminate flow will be traced.
         This parameter is only applicable when running an upstream,
         downstream, or isolation trace.TRACE_INDETERMINATE_FLOW-Features with
         indeterminate flow will be
         traced. This is the default.IGNORE_INDETERMINATE_FLOW-Features with
         indeterminate flow will stop
         traversability and will not be traced. This parameter requires
         avalue of 5 or later. Utility
         Network Version
     validate_locatability {Boolean}:
         Specifies whether an error will be returned during a trace if
         nonspatial junction or edge objects are encountered without the
         necessary containment, attachment, or connectivity association in
         their association hierarchy of the traversed objects. This parameter
         ensures that nonspatial objects returned by a trace or update
         subnetwork operation can be located through an association with
         features or other locatable objects.VALIDATE_LOCATABILITY-The trace
         will return an error if nonspatial
         junction or edge objects are encountered without the necessary
         containment, attachment, or connectivity association in their
         association hierarchy of the traversed
         objects.DO_NOT_VALIDATE_LOCATABILITY-The trace will not check for
         unlocatable
         objects and will return results regardless of whether unlocatable
         objects are present in the association hierarchy of the traversed
         objects. This is the default. This parameter requires avalue of
         4 or later. Utility
         Network Version
     use_trace_config {Boolean}:
         Specifies whether an existing named trace configuration will be used
         to populate the parameters of this tool.USE_TRACE_CONFIGURATION-An
         existing named trace configuration will be
         used to define the properties of the trace. All parameters except
         trace_config_name, starting_points, and barriers will be
         ignored.DO_NOT_USE_TRACE_CONFIGURATION-An existing named trace
         configuration
         will not be used to define the properties of the trace. This is the
         default. This parameter requires avalue of 5 or later.
         Utility
         Network Version
     trace_config_name {String}:
         The name of the existing named trace configuration that will be used
         to define the properties of the trace. This parameter is only enabled
         when the use_trace_config parameter is set to USE_TRACE_CONFIGURATION.
     run_async {Boolean}:
         This parameter requires ArcGIS Enterprise 10.9.1 or later.
         Specifies whether trace operations will process asynchronously when
         working with a utility network in an enterprise
         geodatabase.RUN_ASYNCHRONOUSLY-Trace operations will process
         asynchronously.RUN_SYNCHRONOUSLY-Trace operations will process
         synchronously. This is
         the default.
     include_geometry {Boolean}:
         Specifies whether geometry will be included in the
         results.INCLUDE_GEOMETRY-Geometry will be included in the
         results.EXCLUDE_GEOMETRY-Geometry will not be included in the results.
         This is
         the default.For enterprise geodatabases, this parameter requires
         ArcGIS Enterprise
         11.1 or later.
     include_domain_descriptions {Boolean}:
         Specifies whether domain descriptions will be included in the output
         .json file to communicate domain mapping for controllers,
         featureElements, connectivity, and
         associations.INCLUDE_DOMAIN_DESCRIPTIONS-Domain descriptions will be
         included in
         the results.EXCLUDE_DOMAIN_DESCRIPTIONS-Domain descriptions will not
         be included
         in the results. This is the default.For enterprise geodatabases, this
         parameter requires ArcGIS Enterprise
         11.1 or later.
     result_network_attributes {String}:
         The network attributes that will be included in the results.For
         enterprise geodatabases, this parameter requires ArcGIS Enterprise
         11.1 or later.
     result_fields {Value Table}:
         Fields from a feature class that will be returned as results. The
         values of the fields will be returned in the results for the features
         in the trace.For enterprise geodatabases, this parameter requires
         ArcGIS Enterprise
         11.1 or later.
     use_digitized_direction {Boolean}:
         Specifies whether upstream and downstream trace operations
         will determine flow direction using the digitized direction of the
         line, the From and To global ID of the edge object in the association,
         and theattribute. This parameter is only available and active for
         utility network version 7 and later when the trace_type parameter is
         set to UPSTREAM or DOWNSTREAM. Flow
         directionUSE_DIGITIZED_DIRECTION-Trace operations will determine flow
         direction
         using the digitized direction of the line, the From and To global ID
         of the edge object in the association, and the flow direction
         attribute. With this option, the domain_network, tier, and target_tier
         parameters are ignored.IGNORE_DIGITIZED_DIRECTION-Trace operations
         will determine flow
         direction based on the location of subnetwork controllers. This is the
         default.For enterprise geodatabases, this parameter requires ArcGIS
         Enterprise
         11.3 or later.
     synthesize_geometries {Boolean}:
         Specifies whether geometries will be inferred and created
         (synthesized) for associations and edge objects traversed as part of a
         trace operation. This parameter is only applicable to the aggregated
         geometry result type.DO_NOT_SYNTHESIZE_GEOMETRIES-Geometries will not
         be synthesized for
         the traversed associations and edge objects. This is the
         default.SYNTHESIZE_GEOMETRIES-Geometries will be inferred and created
         for the
         traversed associations and edge objects in the output
         Trace_Results_Aggregated_Lines feature class.For enterprise
         geodatabases, this parameter requires ArcGIS Enterprise
         11.3 or later.

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
     aggregated_polygons {Feature Class}:
         An output polygon feature class containing the aggregated result
         geometry. By default, the parameter is populated with a system-
         generated feature class named Trace_Results_Aggregated_Polygons that
         will be stored in the project's default geodatabase. This
         feature class will be created automatically if it does
         not exist. An existing feature class can also be used to store
         aggregated geometry. If a feature class other than the default is
         used, it must be a polygon feature class and contain a string field
         named. This parameter is only applicable to the aggregated geometry
         result type. TRACENAME
     out_json_file {File}:
         The name and location of the .json file that will be generated when
         returning trace results using the connectivity, elements, features, or
         containment and attachment associations result types."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Trace_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        trace_type,
                        starting_points,
                        barriers,
                        domain_network,
                        tier,
                        target_tier,
                        subnetwork_name,
                        shortest_path_network_attribute_name,
                        include_containers,
                        include_content,
                        include_structures,
                        include_barriers,
                        validate_consistency,
                        condition_barriers,
                        function_barriers,
                        traversability_scope,
                        filter_barriers,
                        filter_function_barriers,
                        filter_scope,
                        filter_bitset_network_attribute_name,
                        filter_nearest,
                        nearest_count,
                        nearest_cost_network_attribute,
                        nearest_categories,
                        nearest_assets,
                        functions,
                        propagators,
                        output_assettypes,
                        output_conditions,
                        include_isolated_features,
                        ignore_barriers_at_starting_points,
                        include_up_to_first_spatial_container,
                        result_types,
                        selection_type,
                        clear_all_previous_trace_results,
                        trace_name,
                        aggregated_points,
                        aggregated_lines,
                        aggregated_polygons,
                        allow_indeterminate_flow,
                        validate_locatability,
                        use_trace_config,
                        trace_config_name,
                        out_json_file,
                        run_async,
                        include_geometry,
                        include_domain_descriptions,
                        result_network_attributes,
                        result_fields,
                        use_digitized_direction,
                        synthesize_geometries,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateDiagram_un", None)
def UpdateDiagram(
    in_diagrams=None,
    template_names=None,
    diagram_names=None,
    update_option: Literal["INCONSISTENT_DIAGRAMS_ONLY", "ALL_SELECTED_DIAGRAMS"] | None = None,
    autolayout_option: Literal["REAPPLY_AUTOLAYOUT", "DO_NOT_REAPPLY_AUTOLAYOUT"] | None = None,
) -> Result1[str | Layer]:
    """UpdateDiagram_un(in_diagrams, {template_names;template_names...}, {diagram_names;diagram_names...}, {update_option}, {autolayout_option})

       Update Network Diagram

    INPUTS:
     in_diagrams (Utility Network / Trace Network / Utility Network Layer / Trace Network Layer / Diagram Layer):
         Input Network or Network Diagram Layer
     template_names {String}:
         Template Names
     diagram_names {String}:
         Diagram Names
     update_option {Boolean}:
         Update inconsistent diagrams only
     autolayout_option {Boolean}:
         Re-apply automatic layouts on the updated diagrams"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpdateDiagram_un(
                *gp_fixargs((in_diagrams, template_names, diagram_names, update_option, autolayout_option), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateIsConnected_un", None)
def UpdateIsConnected(
    in_utility_network=None,
) -> Result1[str]:
    """UpdateIsConnected_un(in_utility_network)

       Updates the IsConnected attribute on all the network features for the
       specified utility network based on connectivity.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network where the IsConnected attribute will be updated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.UpdateIsConnected_un(*gp_fixargs((in_utility_network,), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateSubnetwork_un", None)
def UpdateSubnetwork(
    in_utility_network=None,
    domain_network=None,
    tier=None,
    all_subnetworks_in_tier: Literal["ALL_SUBNETWORKS_IN_TIER", "SPECIFIC_SUBNETWORK"] | None = None,
    subnetwork_name=None,
    continue_on_failure: Literal["CONTINUE_ON_FAILURE", "STOP_ON_FAILURE"] | None = None,
    condition_barriers=None,
    function_barriers=None,
    include_barriers: Literal["INCLUDE_BARRIERS", "EXCLUDE_BARRIERS"] | None = None,
    traversability_scope: Literal["BOTH_JUNCTIONS_AND_EDGES", "JUNCTIONS_ONLY", "EDGES_ONLY"] | None = None,
    propagators=None,
) -> Result1[str | Layer]:
    """UpdateSubnetwork_un(in_utility_network, domain_network, tier, all_subnetworks_in_tier, {subnetwork_name}, {continue_on_failure}, {condition_barriers;condition_barriers...}, {function_barriers;function_barriers...}, {include_barriers}, {traversability_scope}, {propagators;propagators...})

       Updates subnetwork information in the Subnetworks table, the
       SubnetLine feature class, and subnetwork system diagrams for the
       specified subnetworks.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network that contains the subnetwork.
     domain_network (String):
         The domain network that contains the subnetwork.
     tier (String):
         The tier that contains the subnetwork.
     all_subnetworks_in_tier (Boolean):
         Specifies whether all subnetworks in the tier will be updated. To
         update a subset of subnetworks in the tier, use the subnetwork_name
         parameter.ALL_SUBNETWORKS_IN_TIER-All subnetworks in the tier will be
         updated.
         This option uses asynchronous processing to update the subnetworks
         using the system UtilityNetworkTools geoprocessing service. The
         service is reserved for utility network geoprocessing tasks and has a
         longer default timeout setting. This is the
         default.SPECIFIC_SUBNETWORK-Only the subnetworks that are specified in
         the
         subnetwork_name parameter will be updated.
     subnetwork_name {String}:
         The name of the subnetwork that will be updated from the tier. If the
         all_subnetworks_in_tier parameter is set to ALL_SUBNETWORKS_IN_TIER,
         this parameter is ignored.
     continue_on_failure {Boolean}:
         Specifies whether the update process will stop if a subnetwork fails
         to update when updating multiple subnetworks.CONTINUE_ON_FAILURE-The
         update process will not stop if a subnetwork
         failure occurs; it will continue.STOP_ON_FAILURE-The update process
         will stop if a subnetwork failure
         occurs. This is the default.
     condition_barriers {Value Table}:
         Sets a traversability barrier condition on features based on a
         comparison to a network attribute or check for a category string. A
         condition barrier uses a network attribute or network category, an
         operator and a type, and an attribute value. For example, stop a trace
         when a feature has theattribute equal to the specific value of Open.
         When a feature meets this condition, the trace stops. If you're using
         more than one attribute, you can use theparameter to define an And or
         an Or condition. Device StatusCombine using        Condition
         barrier components are as follows:
         Name-Filter by any network attribute defined in the system or specify
         Category to use a network category.Operator-Choose from a number of
         operators. Type-Specify either Specific value or Network
         attribute for
         the type of value from the Name parameter that will serve as a
         barrier. The Type parameter must be Specific value when the Name
         parameter is. CategoryValue-Provide a specific value for the
         input attribute or category
         that would cause termination based on the operator value.Combine
         Using-Set this value if you have multiple conditions to add.
         You can combine them using an And or an Or condition.The condition
         barrier Operator values are as follows:IS_EQUAL_TO-The attribute is
         equal to the value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).The
         condition barrier type options are as follows:SPECIFIC_VALUE-Filter by
         a specific value or network
         category.NETWORK_ATTRIBUTE-Filter by a network attribute.The Combine
         Using values are as follows:AND-Combine the condition barriers.OR-Use
         if either condition barrier
         is met.
     function_barriers {Value Table}:
         Sets a traversability barrier on features based on a function.
         Function barriers can be used to do such things as restrict how far
         the trace travels from the starting point, or set a maximum value to
         stop a trace. For example, the length of each line traveled is added
         to the total distance traveled so far. When the total length traveled
         reaches the value specified, the trace stops. Function barrier
         components are as follows:
         Function-Choose from a number of different calculation
         functions.Attribute-Filter by any network attribute defined in the
         system.Operator-Choose from a number of different operators.Value-Set
         a specific value of the input attribute type that, if
         discovered, will cause the termination.Use Local Values-Calculate
         values in each direction as opposed to an
         overall global value. For example, use for a function barrier that is
         calculating the sum of Shape length in which the trace terminates if
         the value is greater than or equal to 4. In the global case, after you
         have traversed two edges with a value of 2, you have already reached a
         shape length sum of 4, so the trace stops. If local values are used,
         the local values along each path change, and the trace
         continues.TRUE-Local values will be used.FALSE-Global values will be
         used. This
         is the default.The function barrier function options are as
         follows:AVERAGE-The average of the input values will be
         calculated.COUNT-The
         number of features will be identified.MAX-The maximum of the input
         values will be identified.MIN-The minimum of the input values will be
         identified.ADD-The sum of the input values will be calculated.
         SUBTRACT-The difference in the input values will be
         calculated. Subnetwork controllers and loops trace types do
         not support the
         subtract function.For example, the starting point feature has a value
         of 20. The next
         feature has a value of 30. If you use the minimum function, the result
         is 20, maximum is 30, add is 50, average is 25, count is 2, and
         subtract is -10.The function barrier operator value options are as
         follows:IS_EQUAL_TO-The attribute is equal to the
         value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).
     include_barriers {Boolean}:
         Specifies whether the traversability barrier features will be included
         in the trace results. Traversability barriers are optional even if
         they have been preset in the subnetwork
         definition.INCLUDE_BARRIERS-Traversability barriers will be included
         in the trace
         results. This is the default.EXCLUDE_BARRIERS-Traversability barriers
         will not be included in the
         trace results.
     traversability_scope {String}:
         Specifies the type of traversability that will be applied.
         Traversability scope determines whether traversability will be applied
         to junctions, edges, or both. For example, if a condition barrier is
         defined to stop the trace ifis equal to Open and traversability scope
         is set to edges only, the trace will not stop even if it encounters an
         open device, becauseis only applicable to junctions. In other words,
         this parameter indicates to the trace whether to ignore junctions,
         edges, or both.
         DEVICESTATUSDEVICESTATUSBOTH_JUNCTIONS_AND_EDGES-Traversability will
         be applied to both
         junctions and edges. This is the default.JUNCTIONS_ONLY-Traversability
         will be applied to junctions only.EDGES_ONLY-Traversability will be
         applied to edges only.
     propagators {Value Table}:
         Specifies the network attributes to propagate as well as how that
         propagation will occur during a trace. Propagated class attributes
         denote the key values on subnetwork controllers that are disseminated
         to the rest of the features in the subnetwork. For example, in an
         electric distribution model, you can propagate the phase value.
         Propagators components are as follows:        Attribute-Filter
         by any network attribute defined in the
         system.Substitution Attribute-Use a substituted value instead of
         bitset
         network attribute values. Substitutions are encoded based on the
         number of bits in the network attribute being propagated. A
         substitution is a mapping of each bit in phase to another bit. For
         example, for Phase AC, one substitution could map bit A to B, and bit
         C to null. In this example, the substitution for 1010 (Phase AC) is
         0000-0010-0000-0000 (512). The substitution captures the mapping so
         you know that Phase A was mapped to B and Phase C was mapped to null,
         and not the other way around (that is, Phase A was not mapped to null
         and Phase C was not mapped to B).Function-Choose from a number of
         calculation functions.Operator-Choose from a number of
         operators.Value-Provide a specific value for the input attribute type
         that would
         cause termination based on the operator value.The propagators function
         value options are as follows:PROPAGATED_BITWISE_AND-Compare the values
         from one feature to the
         next.PROPAGATED_MIN-Get the minimum value.PROPAGATED_MAX-Get the
         maximum value.The propagators operator value options are as
         follows:IS_EQUAL_TO-The attribute is equal to the
         value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False)."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpdateSubnetwork_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        domain_network,
                        tier,
                        all_subnetworks_in_tier,
                        subnetwork_name,
                        continue_on_failure,
                        condition_barriers,
                        function_barriers,
                        include_barriers,
                        traversability_scope,
                        propagators,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateUtilityNetworkSchema_un", None)
def UpdateUtilityNetworkSchema(
    in_utility_network=None,
    operations=None,
) -> Result2[str, str]:
    """UpdateUtilityNetworkSchema_un(in_utility_network, operations)

       Updates the schema of a utility network based upon a Xml set of
       instructions

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         Input Utility Network
     operations (File / String):
         Schema Operations"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpdateUtilityNetworkSchema_un(*gp_fixargs((in_utility_network, operations), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ValidateNetworkTopology_un", None)
def ValidateNetworkTopology(
    in_utility_network=None,
    extent=None,
) -> Result2[str, str]:
    """ValidateNetworkTopology_un(in_utility_network, {extent})

       Validates features with dirty areas in the network topology of a
       utility network after edits have been made.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network for which the network topology will be validated.
     extent {Extent}:
         The geographical extent that will be used to validate the network
         topology. This parameter is similar to the Extent geoprocessing
         environment.MAXOF-The maximum extent of all inputs will be
         used.MINOF-The minimum
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
            gp.ValidateNetworkTopology_un(*gp_fixargs((in_utility_network, extent), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("VerifyCircuits_un", None)
def VerifyCircuits(
    in_utility_network=None,
    domain_network=None,
    circuits=None,
    continue_on_failure: Literal["CONTINUE_ON_FAILURE", "STOP_ON_FAILURE"] | None = None,
) -> Result1[str | Layer]:
    """VerifyCircuits_un(in_utility_network, domain_network, circuits, {continue_on_failure})

       Verify circuits.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         Input Utility Network
     domain_network (String):
         Domain Network
     circuits (String):
         Circuits
     continue_on_failure {Boolean}:
         Continue on failure"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.VerifyCircuits_un(*gp_fixargs((in_utility_network, domain_network, circuits, continue_on_failure), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("VerifyNetworkTopology_un", None)
def VerifyNetworkTopology(
    in_utility_network=None,
    out_log_file=None,
) -> Result1[str]:
    """VerifyNetworkTopology_un(in_utility_network, {out_log_file})

       Verifies the network topology system tables and logs inconsistencies
       to an output log file.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network that will be verified for consistency.

    OUTPUTS:
     out_log_file {File}:
         The output log file containing the discovered issues."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.VerifyNetworkTopology_un(*gp_fixargs((in_utility_network, out_log_file), True))
        )
        return retval
    except Exception as e:
        raise e


# Administration toolset
@gptooldoc("AddColorScheme_un", None)
def AddColorScheme(
    in_utility_network=None,
    domain_network=None,
    color_scheme_name=None,
    group_delimiter=None,
    groups=None,
) -> Result1[str]:
    """AddColorScheme_un(in_utility_network, domain_network, color_scheme_name, group_delimiter, {groups;groups...})

       Add color scheme

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         Input Utility Network
     domain_network (String):
         Domain Network
     color_scheme_name (String):
         Color Scheme Name
     group_delimiter (String):
         Group Delimiter
     groups {Value Table}:
         Groups"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddColorScheme_un(
                *gp_fixargs((in_utility_network, domain_network, color_scheme_name, group_delimiter, groups), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddDomainNetwork_un", None)
def AddDomainNetwork(
    in_utility_network=None,
    domain_network_name=None,
    tier_definition: Literal["HIERARCHICAL", "PARTITIONED"] | None = None,
    subnetwork_controller_type: Literal["SOURCE", "SINK"] | None = None,
    domain_network_alias_name=None,
) -> Result1[str]:
    """AddDomainNetwork_un(in_utility_network, domain_network_name, tier_definition, subnetwork_controller_type, {domain_network_alias_name})

       Adds a domain network to a utility network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network to which the domain network will be added.
     domain_network_name (String):
         The name of the new domain network. The domain network name will
         prefix the feature class names that are created. For example, a domain
         named ElectricDistribution would include a feature class named
         ElectricDistributionJunction.
     tier_definition (String):
         Specifies the tier definition for the new domain
         network.HIERARCHICAL-The tier will be defined as hierarchical. In
         hierarchical
         domain networks, tiers are nested within one another, so features
         existing in subnetworks for a lower tier naturally participate in all
         higher tiers. For example, in a gas network, a valve isolation zone
         exists in a pressure zone, which in turn exists in a system zone. A
         feature in the isolation zone also exists in the pressure zone and in
         the system zone.PARTITIONED-The tier will be defined as partitioned.
         Features in
         partitioned domain networks only exist in one tier. The relationship
         between tiers is ordered and linear. Features can exist in one or
         multiple subnetworks in one tier.
     subnetwork_controller_type (String):
         Specifies the subnetwork controller type for the new domain
         network.SOURCE-The subnetwork controller type is a set of sources. A
         source is
         an origin of the delivered resource. For example, in an electric
         system, sources of electricity are power generating stations and
         substations.SINK-The subnetwork controller type is a set of sinks. A
         sink is the
         destination of the gathered resource.
     domain_network_alias_name {String}:
         The alias name of the domain network. This optional parameter is used
         to give a more descriptive name to the domain network."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddDomainNetwork_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        domain_network_name,
                        tier_definition,
                        subnetwork_controller_type,
                        domain_network_alias_name,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddNetworkAttribute_un", None)
def AddNetworkAttribute(
    in_utility_network=None,
    attribute_name=None,
    attribute_type: Literal["SHORT", "LONG", "DOUBLE", "DATE", "BIGINTEGER"] | None = None,
    is_inline: Literal["INLINE", "NOT_INLINE"] | None = None,
    is_apportionable: Literal["APPORTIONABLE", "NOT_APPORTIONABLE"] | None = None,
    domain=None,
    is_overridable: Literal["OVERRIDE", "NOT_OVERRIDABLE"] | None = None,
    is_nullable: Literal["NULLABLE", "NOT_NULLABLE"] | None = None,
    is_substitution: Literal["SUBSTITUTION", "NOT_SUBSTITUTION"] | None = None,
    network_attribute_to_substitute=None,
) -> Result1[str]:
    """AddNetworkAttribute_un(in_utility_network, attribute_name, attribute_type, {is_inline}, {is_apportionable}, {domain}, {is_overridable}, {is_nullable}, {is_substitution}, {network_attribute_to_substitute})

       Adds a network attribute to a utility network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The input utility network where the network attribute will be added.
     attribute_name (String):
         The name of the network attribute that will be added to the utility
         network.
     attribute_type (String):
         Specifies the data type of the network attribute.SHORT-The field type
         will be short.LONG-The field type will be
         long.DOUBLE-The field type will be double.DATE-The field type will be
         date.BIGINTEGER-The field type will be big integer.
     is_inline {Boolean}:
         Specifies whether the network attribute will be persisted in line. In-
         line network attributes are slightly more efficient, but the number of
         bits for user-defined in-line network attributes is limited to 25 per
         utility network. Store the most frequently used network attributes
         (for example, phase for electric networks, pressure for gas and water
         networks) in line if possible. The size of the bits is determined by
         the domain parameter. In-line attributes are only supported for
         integer network attributes (short or long).INLINE-The attribute will
         be added internally to the topology, making
         retrieval more efficient.NOT_INLINE-The attribute will be stored in an
         external table, and
         retrieval will require a call to the external weights table. This is
         the default.
     is_apportionable {Boolean}:
         Specifies whether the network attribute will be apportioned across
         multiple edges belonging to the same feature.Apportioned behavior is
         only supported with double network attributes.
         Network attributes with the apportionable property can be assigned to
         fields in line or junction feature classes, but only line features
         will have apportioned behavior.For example, with the shape_length
         network attribute and a line
         feature that consists of five edge elements of 20 feet each in which
         the total length of that line feature is 100 feet, the attribute will
         be apportioned across all edges. For example, using a function in a
         connected trace to count the shape_length attribute for this line will
         return a count of 5 because it accounts for each individual edge
         element and not the entire line. The distribution of the value depends
         on the percentage along each edge element with respect to the from
         point of the original feature.APPORTIONABLE-The network attribute will
         be
         apportioned.NOT_APPORTIONABLE-The network attribute will not be
         apportioned. This
         is the default.
     domain {String}:
         The domain with which the network attribute will be associated. This
         parameter is required when is_inline = "INLINE". This domain is used
         to determine the number of bits to allocate for the in-line attribute
         and must be a coded value type. For example, the LifeCycleStatusDomain
         (0, Unknown | 1, In-Service | 2, Proposed | 3, Abandoned) domain has
         four entries, which means 2 bits are required to store the in-line
         attribute. The coded value domain must have sequential codes starting
         from 0.
     is_overridable {Boolean}:
         Specifies whether the current value stored in the topology
         will be overridden using an external override table. This parameter
         can be used, for example, to input live data from external systems,
         such as present position in the case of electric or pressure value in
         the case of gas. An example is a SCADA system pushing the updated
         switching positions of Device A to the override table of the
         DeviceStatus network attribute, which the topology engine then uses to
         override its current value of device status for Device A with the
         override value. This parameter is not used in the current
         release, and any value
         provided will be ignored. The functionality of this parameter is under
         development and will be applicable in a future release.OVERRIDE-The
         current value stored in the topology will be
         overridden.NOT_OVERRIDABLE-The current value stored in the topology
         will not be
         overridden. This is the default.
     is_nullable {Boolean}:
         Specifies whether the network attribute will support null
         values.NULLABLE-The network attribute will support null values. This
         is the
         default.NOT_NULLABLE-The network attribute will not support null
         values.
     is_substitution {Boolean}:
         Specifies whether the network attribute will be used as a
         substitution. Substitution network attributes allow a substituted
         value to be used instead of bitset network attribute values during a
         propagation in a trace operation. Substitution is only supported with
         long integer network attributes.SUBSTITUTION-The network attribute
         will be used as a
         substitution.NOT_SUBSTITUTION-The network attribute will not be used
         as a
         substitution. This is the default.
     network_attribute_to_substitute {String}:
         The network attribute that will be used as a substitution.
         Substitutions are encoded based on the number of bits in the network
         attribute being propagated. The network attribute must be in line and
         an integer field type less than or equal to 8 bits."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddNetworkAttribute_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        attribute_name,
                        attribute_type,
                        is_inline,
                        is_apportionable,
                        domain,
                        is_overridable,
                        is_nullable,
                        is_substitution,
                        network_attribute_to_substitute,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddNetworkCategory_un", None)
def AddNetworkCategory(
    in_utility_network=None,
    category_name=None,
) -> Result1[str]:
    """AddNetworkCategory_un(in_utility_network, category_name)

       Adds a network category to an existing utility network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The input utility network where the network category will be added.
     category_name (String):
         The name of the category to be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddNetworkCategory_un(*gp_fixargs((in_utility_network, category_name), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddRule_un", None)
def AddRule(
    in_utility_network=None,
    rule_type: Literal[
        "JUNCTION_JUNCTION_CONNECTIVITY",
        "JUNCTION_EDGE_CONNECTIVITY",
        "CONTAINMENT",
        "STRUCTURAL_ATTACHMENT",
        "EDGE_JUNCTION_EDGE_CONNECTIVITY",
    ]
    | None = None,
    from_class=None,
    from_assetgroup=None,
    from_assettype=None,
    to_class=None,
    to_assetgroup=None,
    to_assettype=None,
    from_terminal=None,
    to_terminal=None,
    via_class=None,
    via_assetgroup=None,
    via_assettype=None,
    via_terminal=None,
) -> Result1[str]:
    """AddRule_un(in_utility_network, rule_type, from_class, from_assetgroup, from_assettype, to_class, to_assetgroup, to_assettype, {from_terminal}, {to_terminal}, {via_class}, {via_assetgroup}, {via_assettype}, {via_terminal})

       Adds a network rule to a utility network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network for which the rule will be added.
     rule_type (String):
         Specifies the type of rule that will be
         created.JUNCTION_JUNCTION_CONNECTIVITY-A junction-junction
         connectivity rule
         will be created to allow point features or junction objects to connect
         through a connectivity association.CONTAINMENT-A containment rule will
         be created in which the from
         parameters are the container and the to parameters are the contents in
         a containment association.STRUCTURAL_ATTACHMENT-A structural
         attachment rule will be created in
         which the from parameters are the structure features or objects and
         the to parameters are the attachment features or objects in a
         structural attachment association.JUNCTION_EDGE_CONNECTIVITY-A
         junction-edge connectivity rule will be
         created to allow point and line features to connect through geometric
         coincidence (features are at the same x,y,z location), or allow an
         edge object to connect with point features or junction objects through
         a connectivity association.EDGE_JUNCTION_EDGE_CONNECTIVITY-An edge-
         junction-edge connectivity
         rule will be created to allow a line to connect to either side of a
         point feature, or allow an edge object to connect with another line or
         edge object through a point feature or junction object.
     from_class (String):
         The from utility network feature class or nonspatial object that will
         be included in the rule.Structural attachment and containment
         association rules require that
         the container or structure network feature be in this parameter.When
         creating junction-edge and edge-junction-edge connectivity rules,
         this parameter must reference the junction or junction object.
     from_assetgroup (String):
         An asset group for the from_class parameter value to which the rule
         will apply.
     from_assettype (String):
         An asset type for the from_class parameter value to which the rule
         will apply.
     to_class (String):
         The to utility network feature class or nonspatial object that will be
         included in the rule.Structural attachment and containment
         associations rules require that
         the content or attachment network feature be in this parameter.When
         creating junction-edge and edge-junction-edge connectivity rules,
         the from_class parameter must reference the junction or junction
         object..
     to_assetgroup (String):
         An asset group for the to_class parameter value to which the rule will
         apply.
     to_assettype (String):
         An asset type for the to_class parameter value to which the rule will
         apply.
     from_terminal {String}:
         The from terminal to which the rule will apply. This will be a
         terminal in the from_class parameter value. When creating a
         connectivity rule for a device or junction object with terminals to
         connect to another network feature, the terminal side to connect from
         must be specified, for example, the high-side terminal on a
         transformer.This parameter is required if the asset type has
         terminals. It is
         ignored for structural attachment or containment rule types.
     to_terminal {String}:
         The to terminal to which the rule will apply. This will be a terminal
         in the to_class parameter value. When creating a connectivity rule for
         a device or junction object to connect to another network feature with
         terminals, the terminal side to connect to must be specified, for
         example, the low-side terminal on a transformer.This parameter is
         required if the asset type has terminals. It is
         ignored for structural attachment or containment rule types.
     via_class {String}:
         The junction utility network feature class or table to which the rule
         will apply. This parameter can only be specified when the rule_type
         parameter is set to EDGE_JUNCTION_EDGE_CONNECTIVITY, since three
         classes are required to participate in edge-junction-edge
         connectivity.
     via_assetgroup {String}:
         An asset group of the via_class parameter value to which the rule will
         apply. This parameter can only be specified when the rule_type
         parameter is set to EDGE_JUNCTION_EDGE_CONNECTIVITY.
     via_assettype {String}:
         An asset type of the via_class parameter value to which the rule will
         apply. This parameter can only be specified when the rule_type
         parameter is set to EDGE_JUNCTION_EDGE_CONNECTIVITY.
     via_terminal {String}:
         The terminal from the via_class parameter value to which the rule will
         apply. This parameter can only be specified when the rule_type
         parameter is set to EDGE_JUNCTION_EDGE_CONNECTIVITY."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddRule_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        rule_type,
                        from_class,
                        from_assetgroup,
                        from_assettype,
                        to_class,
                        to_assetgroup,
                        to_assettype,
                        from_terminal,
                        to_terminal,
                        via_class,
                        via_assetgroup,
                        via_assettype,
                        via_terminal,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddTelecomDomainNetwork_un", None)
def AddTelecomDomainNetwork(
    in_utility_network=None,
    domain_network_name=None,
    domain_network_alias_name=None,
) -> Result1[str]:
    """AddTelecomDomainNetwork_un(in_utility_network, domain_network_name, {domain_network_alias_name})

       Add telecom domain network

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         Input Utility Network
     domain_network_name (String):
         Domain Network Name
     domain_network_alias_name {String}:
         Domain Network Alias Name"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddTelecomDomainNetwork_un(
                *gp_fixargs((in_utility_network, domain_network_name, domain_network_alias_name), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddTerminalConfiguration_un", None)
def AddTerminalConfiguration(
    in_utility_network=None,
    terminal_configuration_name=None,
    traversability_model: Literal["DIRECTIONAL", "BIDIRECTIONAL"] | None = None,
    terminals_directional=None,
    terminals_bidirectional=None,
    valid_paths=None,
    default_path: Literal["ALL", "NONE"] | None = None,
) -> Result1[str]:
    """AddTerminalConfiguration_un(in_utility_network, terminal_configuration_name, traversability_model, {terminals_directional;terminals_directional...}, {terminals_bidirectional;terminals_bidirectional...}, {valid_paths;valid_paths...}, {default_path})

       Adds a terminal configuration to an existing utility network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The input utility network to which the terminal configuration will be
         added.
     terminal_configuration_name (String):
         The name of the terminal configuration.
     traversability_model (String):
         Specifies the directionality of the terminal configuration. A
         directional traversability model means the flow for the terminal will
         only go in one direction. A bidirectional traversability model means
         the terminal allows flow in both directions.DIRECTIONAL-Only one flow
         direction is permitted.BIDIRECTIONAL-Both
         flow directions are permitted.
     terminals_directional {Value Table}:
         The name and directional flow of each directional terminal. A minimum
         of two terminals must be specified, and a maximum of eight can be
         specified. The name of each terminal cannot exceed 32 characters. This
         parameter is required if the traversability_model parameter value is
         DIRECTIONAL.Name-Provide the name of the terminal.
         Upstream-Indicate
         whether the terminal is upstream or
         downstream. True-The terminal is upstream.False-The terminal
         is downstream.
     terminals_bidirectional {Value Table}:
         The name of each bidirectional terminal. A minimum of two
         terminals must be specified, and a maximum of eight can be specified.
         The name of each terminal cannot exceed 32 characters. This parameter
         is required if theparameter value is(traversability_model =
         "BIDIRECTIONAL" in Python). DirectionalityBidirectional
     valid_paths {Value Table}:
         The name or names and valid path or paths for the terminal
         configuration. For bidirectional traversability, this parameter is
         required if you have three or four terminals. If you are using
         directional traversability, one of the terminals must be upstream to
         have valid configurations. Valid paths must be created to indicate
         which path or paths in a device or junction object are valid for a
         resource to travel through. Provide a name for each valid path as well
         as a value.Name-The name of the valid path. Value-The value of
         the valid
         path. All-Enter a value
         of All to create an option that indicates all paths
         are valid.None-Enter a value of None to create an option that
         indicates that no
         paths are valid.Terminal pair(s)-Enter a single or collection of
         terminal pairs. Enter
         a single terminal pair by specifying the path from one terminal to
         another separated by a hyphen, for example, A-B. Enter a collection of
         terminal pairs separated by a comma, for example, A-B, A-C.
     default_path {String}:
         The default path of the valid configurations. This will be assigned to
         new features that have this terminal configuration assigned to their
         asset type. If no valid paths have been specified, the default path
         All will be used.ALL-All paths are valid. This is the default.NONE-No
         paths are valid."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddTerminalConfiguration_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        terminal_configuration_name,
                        traversability_model,
                        terminals_directional,
                        terminals_bidirectional,
                        valid_paths,
                        default_path,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddTier_un", None)
def AddTier(
    in_utility_network=None,
    domain_network=None,
    name=None,
    rank=None,
    topology_type: Literal["RADIAL", "MESH"] | None = None,
    tier_group_name=None,
    subnetwork_field_name=None,
) -> Result1[str]:
    """AddTier_un(in_utility_network, domain_network, name, rank, {topology_type}, {tier_group_name}, {subnetwork_field_name})

       Creates a new tier for a domain network in a utility network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network that contains the domain network where the tier
         will be added.
     domain_network (String):
         The domain network where the tier will be created.
     name (String):
         The name of the new tier. The name must be unique in the entire
         utility network.
     rank (Long):
         The rank of the tier being added. The highest rank is the number 1.
     topology_type {String}:
         Specifies the topology type for the new tier. Subnetworks with radial
         and mesh topology types both support one or more subnetwork
         controllers. This parameter is disabled on the tool dialog box if the
         input domain network was created with a hierarchical tier definition
         and the topology type defaults to mesh. If the input domain network
         was created with a hierarchical tier definition, the default topology
         type is MESH. If the input domain network was created with a
         partitioned tier definition, the topology type parameter is
         required.RADIAL-The subnetworks will have a radial topology
         type.MESH-The
         subnetworks will have a mesh topology type. This is the
         default topology type for a tier created with a hierarchical tier
         definition.
     tier_group_name {String}:
         The existing tier group to which the new tier will be added. This
         parameter is required for domain networks with a hierarchical tier
         definition.
     subnetwork_field_name {String}:
         The name of the field where the subnetwork names for this tier
         will be stored. This is a system-maintained field that will be created
         the first time a tier is added to a tier group and reused for any
         additional tiers. For example, you have two tier groups: Distribution
         and Transmission. When you add a tier named system to the Distribution
         group and specify the subnetwork field name to be, the field is
         created. Next, you add a second tier named system to the Transmission
         group. This parameter will detect that thefield should be used as the
         subnetwork field name. This parameter is required for hierarchical
         tier types. systemsubnetsystemsubnet"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddTier_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        domain_network,
                        name,
                        rank,
                        topology_type,
                        tier_group_name,
                        subnetwork_field_name,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddTierGroup_un", None)
def AddTierGroup(
    in_utility_network=None,
    domain_network=None,
    name=None,
) -> Result1[str]:
    """AddTierGroup_un(in_utility_network, domain_network, name)

       Adds a tier group to a domain network in a utility network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network that contains the domain network where the tier
         group will be added.
     domain_network (String):
         The name of the domain network to which the tier group will be added.
         Tier groups can only be added to domain networks that have a
         hierarchical tier definition.
     name (String):
         A unique name for the new tier group. The name can be a maximum of 64
         characters in length."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddTierGroup_un(*gp_fixargs((in_utility_network, domain_network, name), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateUtilityNetwork_un", None)
def CreateUtilityNetwork(
    in_feature_dataset=None,
    in_utility_network_name=None,
    service_territory_feature_class=None,
) -> Result1[str]:
    """CreateUtilityNetwork_un(in_feature_dataset, in_utility_network_name, service_territory_feature_class)

       Creates a utility network in an enterprise, file, or mobile
       geodatabase feature dataset.

    INPUTS:
     in_feature_dataset (Feature Dataset):
         The geodatabase feature dataset in which the utility network and
         schema will be created.
     in_utility_network_name (String):
         The name of the utility network that will be created.
     service_territory_feature_class (Polygon):
         The existing polygon feature class that will be used to create the
         utility network's geographical extent. Utility network features cannot
         be created outside of this extent.The feature class must be z- and
         m-enabled."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateUtilityNetwork_un(
                *gp_fixargs((in_feature_dataset, in_utility_network_name, service_territory_feature_class), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DeleteColorScheme_un", None)
def DeleteColorScheme(
    in_utility_network=None,
    domain_network=None,
    color_scheme_name=None,
) -> Result1[str]:
    """DeleteColorScheme_un(in_utility_network, domain_network, color_scheme_name)

       Delete color scheme

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         Input Utility Network
     domain_network (String):
         Domain Network
     color_scheme_name (String):
         Color Scheme Name"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DeleteColorScheme_un(*gp_fixargs((in_utility_network, domain_network, color_scheme_name), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DeleteNetworkCategory_un", None)
def DeleteNetworkCategory(
    in_utility_network=None,
    category_name=None,
) -> Result1[str]:
    """DeleteNetworkCategory_un(in_utility_network, category_name)

       Deletes a network category in a utility network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network that contains the network category to be deleted.
     category_name (String):
         The name of the network category to delete."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DeleteNetworkCategory_un(*gp_fixargs((in_utility_network, category_name), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DeleteRule_un", None)
def DeleteRule(
    in_utility_network=None,
    rule_type: Literal[
        "ALL",
        "JUNCTION_JUNCTION_CONNECTIVITY",
        "JUNCTION_EDGE_CONNECTIVITY",
        "CONTAINMENT",
        "STRUCTURAL_ATTACHMENT",
        "EDGE_JUNCTION_EDGE_CONNECTIVITY",
    ]
    | None = None,
    rule_desc=None,
) -> Result1[str]:
    """DeleteRule_un(in_utility_network, rule_type, {rule_desc})

       Permanently deletes a rule from a utility network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network for which the rule will be removed.
     rule_type (String):
         Specifies the type of rule that will be deleted.ALL-All rules will be
         deleted.JUNCTION_JUNCTION_CONNECTIVITY-A
         junction-junction connectivity
         association rule will be deleted.CONTAINMENT-A containment association
         rule will be deleted.STRUCTURAL_ATTACHMENT-A structural attachment
         association rule will be
         deleted.JUNCTION_EDGE_CONNECTIVITY-A junction-edge connectivity rule
         will be
         deleted.EDGE_JUNCTION_EDGE_CONNECTIVITY-An edge-junction-edge
         connectivity
         rule will be deleted.
     rule_desc {String}:
         Specifies the rule that will be removed, including the rule ID
         and the description of the rule. To find the rule ID,
         browse thesection on thetab on thedialog
         box. For more information, see View network rules.
         RulesNetwork PropertiesLayer Properties"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DeleteRule_un(*gp_fixargs((in_utility_network, rule_type, rule_desc), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DeleteTerminalConfiguration_un", None)
def DeleteTerminalConfiguration(
    in_utility_network=None,
    terminal_configuration_name=None,
) -> Result1[str]:
    """DeleteTerminalConfiguration_un(in_utility_network, terminal_configuration_name)

       Deletes a terminal configuration from a utility network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network that contains the terminal configuration to be
         deleted.
     terminal_configuration_name (String):
         The name of the terminal configuration to delete."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DeleteTerminalConfiguration_un(*gp_fixargs((in_utility_network, terminal_configuration_name), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DisableNetworkTopology_un", None)
def DisableNetworkTopology(
    in_utility_network=None,
) -> Result1[str]:
    """DisableNetworkTopology_un(in_utility_network)

       Disables the network topology for an existing utility network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network where the network topology will be disabled."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.DisableNetworkTopology_un(*gp_fixargs((in_utility_network,), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("EnableClusterKeys_un", None)
def EnableClusterKeys(
    in_utility_network=None,
) -> Result1[str]:
    """EnableClusterKeys_un(in_utility_network)

       Enable Cluster Keys

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         Input Utility Network"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.EnableClusterKeys_un(*gp_fixargs((in_utility_network,), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("EnableNetworkTopology_un", None)
def EnableNetworkTopology(
    in_utility_network=None,
    max_number_of_errors=None,
    only_generate_errors: Literal["ONLY_ERRORS", "ENABLE_TOPO"] | None = None,
) -> Result1[str]:
    """EnableNetworkTopology_un(in_utility_network, {max_number_of_errors}, {only_generate_errors})

       Enables a network topology for a utility network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network for which the network topology will be enabled.
     max_number_of_errors {Long}:
         The maximum number of errors that can be generated before the process
         of enabling the network topology will stop. Errors will be recorded in
         the dirty areas sublayer. When no value is provided for this
         parameter, an infinite number of errors can be discovered. The default
         value is 10000.Increasing the maximum number of errors value will
         increase the length
         of time it takes to enable the topology. Setting a value higher than
         the default value of 10000 is not recommended.
     only_generate_errors {Boolean}:
         Specifies whether the topology will be enabled or only network errors
         will be generated.ONLY_ERRORS-The utility network will only be
         evaluated for network
         errors. The topology will not be enabled. If you are working with an
         enterprise geodatabase, the data cannot be registered as versioned.
         This allows you to inspect and fix errors in the network until you
         enable the topology.ENABLE_TOPO-The topology will be enabled and any
         existing errors will
         generate dirty areas with errors. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.EnableNetworkTopology_un(
                *gp_fixargs((in_utility_network, max_number_of_errors, only_generate_errors), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportAssociations_un", None)
def ExportAssociations(
    in_utility_network=None,
    association_type: Literal[
        "ALL",
        "JUNCTION_JUNCTION_CONNECTIVITY",
        "CONTAINMENT",
        "STRUCTURAL_ATTACHMENT",
        "JUNCTION_EDGE_FROM_CONNECTIVITY",
        "JUNCTION_EDGE_MIDSPAN_CONNECTIVITY",
        "JUNCTION_EDGE_TO_CONNECTIVITY",
    ]
    | None = None,
    out_csv_file=None,
) -> Result1[str]:
    """ExportAssociations_un(in_utility_network, association_type, out_csv_file)

       Exports associations from a utility network to a comma-separated-
       values file (.csv). This tool can be used in conjunction with the
       Import Associations tool.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network containing the associations to export.
     association_type (String):
         Specifies the type of association to export.ALL-All association types
         in the utility network will be exported to a
         .csv file.JUNCTION_JUNCTION_CONNECTIVITY-Connectivity associations
         allowing two
         junction subtypes to connect via a connectivity association (features
         are offset geometrically) will be exported to a .csv
         file.CONTAINMENT-The containment association type will be exported to
         a
         .csv file.STRUCTURAL_ATTACHMENT-The structural attachment association
         type will
         be exported to a .csv file.JUNCTION_EDGE_FROM_CONNECTIVITY-The
         junction-edge (from side of edge)
         connectivity association type will be exported to a .csv
         file.JUNCTION_EDGE_MIDSPAN_CONNECTIVITY-The junction-edge (midspan)
         connectivity association type will be exported to a .csv
         file.JUNCTION_EDGE_TO_CONNECTIVITY-The junction-edge (to side of edge)
         connectivity association type will be exported to a .csv file.

    OUTPUTS:
     out_csv_file (File):
         The name and location of the .csv file that will be generated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportAssociations_un(*gp_fixargs((in_utility_network, association_type, out_csv_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportRules_un", None)
def ExportRules(
    in_utility_network=None,
    rule_type: Literal[
        "ALL",
        "JUNCTION_JUNCTION_CONNECTIVITY",
        "JUNCTION_EDGE_CONNECTIVITY",
        "CONTAINMENT",
        "STRUCTURAL_ATTACHMENT",
        "EDGE_JUNCTION_EDGE_CONNECTIVITY",
    ]
    | None = None,
    out_csv_file=None,
) -> Result1[str]:
    """ExportRules_un(in_utility_network, rule_type, out_csv_file)

       Exports connectivity, structural attachment, and containment rules
       from a utility network into a comma-separated values file.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network to export the rules from.
     rule_type (String):
         The type of rule to export.ALL-All the rules in the utility network
         will be
         exported.JUNCTION_JUNCTION_CONNECTIVITY-Junction-junction connectivity
         association rules will be
         exported.JUNCTION_EDGE_CONNECTIVITY-Junction-edge connectivity rules
         will be
         exported.CONTAINMENT-Containment association rules will be
         exported.STRUCTURAL_ATTACHMENT-Structural attachment association rules
         will be
         exported.EDGE_JUNCTION_EDGE_CONNECTIVITY-Edge-junction-edge
         connectivity
         association rules will be exported.

    OUTPUTS:
     out_csv_file (File):
         The folder location and name of the .csv file to be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportRules_un(*gp_fixargs((in_utility_network, rule_type, out_csv_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportSubnetworkControllers_un", None)
def ExportSubnetworkControllers(
    in_utility_network=None,
    out_csv_file=None,
) -> Result1[str]:
    """ExportSubnetworkControllers_un(in_utility_network, out_csv_file)

       Exports subnetwork controllers from a utility network to a .csv file.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network from which subnetwork controllers will be
         exported.

    OUTPUTS:
     out_csv_file (File):
         The location and name of the .csv file to be generated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportSubnetworkControllers_un(*gp_fixargs((in_utility_network, out_csv_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportAssociations_un", None)
def ImportAssociations(
    in_utility_network=None,
    association_type: Literal[
        "ALL",
        "JUNCTION_JUNCTION_CONNECTIVITY",
        "CONTAINMENT",
        "STRUCTURAL_ATTACHMENT",
        "JUNCTION_EDGE_FROM_CONNECTIVITY",
        "JUNCTION_EDGE_MIDSPAN_CONNECTIVITY",
        "JUNCTION_EDGE_TO_CONNECTIVITY",
    ]
    | None = None,
    csv_file=None,
) -> Result1[str]:
    """ImportAssociations_un(in_utility_network, association_type, csv_file)

       Imports associations from a comma-separated values file (.csv) into an
       existing utility network. This tool can be used in conjunction with
       the Export Associations tool.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network to which the associations will be imported.
     association_type (String):
         Specifies the type of association that will be imported.ALL-All
         association types will be
         imported.JUNCTION_JUNCTION_CONNECTIVITY-The junction-junction
         connectivity
         association type will be imported.CONTAINMENT-The containment
         association type will be imported.STRUCTURAL_ATTACHMENT-The structural
         attachment association type will
         be imported.JUNCTION_EDGE_FROM_CONNECTIVITY-The junction-edge
         connectivity (from
         side of edge) association type will be
         imported.JUNCTION_EDGE_MIDSPAN_CONNECTIVITY-The junction-edge
         connectivity
         (midspan) association type will be
         imported.JUNCTION_EDGE_TO_CONNECTIVITY-The junction-edge connectivity
         (to side
         of edge) association type will be imported.
     csv_file (File):
         The .csv file from which the associations will be imported."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportAssociations_un(*gp_fixargs((in_utility_network, association_type, csv_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportRules_un", None)
def ImportRules(
    in_utility_network=None,
    rule_type: Literal[
        "ALL",
        "JUNCTION_JUNCTION_CONNECTIVITY",
        "JUNCTION_EDGE_CONNECTIVITY",
        "CONTAINMENT",
        "STRUCTURAL_ATTACHMENT",
        "EDGE_JUNCTION_EDGE_CONNECTIVITY",
    ]
    | None = None,
    csv_file=None,
) -> Result1[str]:
    """ImportRules_un(in_utility_network, rule_type, csv_file)

       Import connectivity, structural attachment, and containment rules from
       a comma-separated values file into an existing utility network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         Specifies the utility network to import the rules to.
     rule_type (String):
         Specifies the type of rules to import.ALL-One or more types of
         rulesJUNCTION_JUNCTION_CONNECTIVITY-Junction-
         junction connectivity
         association rulesJUNCTION_EDGE_CONNECTIVITY-Junction-edge connectivity
         rulesCONTAINMENT-Containment association
         rulesSTRUCTURAL_ATTACHMENT-Structural attachment association
         rulesEDGE_JUNCTION_EDGE_CONNECTIVITY-Edge-junction-edge association
         rules
     csv_file (File):
         Specifies the .csv file containing the rules to import."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportRules_un(*gp_fixargs((in_utility_network, rule_type, csv_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportSubnetworkControllers_un", None)
def ImportSubnetworkControllers(
    in_utility_network=None,
    csv_file=None,
) -> Result1[str]:
    """ImportSubnetworkControllers_un(in_utility_network, csv_file)

       Imports subnetwork controllers from a .csv file into a utility
       network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network to which the subnetwork controllers will be
         imported.
     csv_file (File):
         The .csv file containing the subnetwork controllers to import."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportSubnetworkControllers_un(*gp_fixargs((in_utility_network, csv_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetAssociationRole_un", None)
def SetAssociationRole(
    in_utility_network=None,
    domain_network=None,
    featureclass=None,
    assetgroup=None,
    assettype=None,
    association_role_type: Literal["NONE", "CONTAINER", "STRUCTURE"] | None = None,
    association_deletion_semantics: Literal["CASCADE", "SET_TO_NONE", "RESTRICTED"] | None = None,
    view_scale=None,
    split_content: Literal["SPLIT", "DO_NOT_SPLIT"] | None = None,
) -> Result1[str]:
    """SetAssociationRole_un(in_utility_network, domain_network, featureclass, assetgroup, assettype, association_role_type, association_deletion_semantics, {view_scale}, {split_content})

       Alters the association role assigned to a network feature class or
       table at the asset type level.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network that contains the asset type with an association
         role to set.
     domain_network (String):
         The domain network that contains the asset type with an association
         role to set.
     featureclass (String):
         The utility network feature class or table where the association role
         will be set.
     assetgroup (String):
         The asset group that contains the asset type.
     assettype (String):
         The asset type that the association role will be set for.
     association_role_type (String):
         Specifies the type of association role that will be assigned to the
         asset type.CONTAINER-The container association role type will be
         assigned.
         Features or objects of this role type can contain other features and
         objects as content.STRUCTURE-The structure association role type will
         be assigned.
         Features or objects of this role type can have other features and
         objects attached to them.NONE-No role type will be assigned. These are
         features or objects that
         are neither a container nor a structure but do connect to other
         structures.
     association_deletion_semantics (String):
         Specifies the deletion semantics for the network features, which
         defines how content or attachment network features will be managed
         when the container or structure is deleted. This applies to both
         container and structure association roles.CASCADE-When the container
         or structure is deleted, all content or
         attachment network features will be deleted.SET_TO_NONE-When a
         container or structure is deleted, its content or
         attachment network features are not deleted, but are removed from the
         containment or structural attachment association.RESTRICTED-If
         content or attachment network features exist, an error
         will be returned when attempting to delete the container or structure.
         The content or attachment network features must be removed before
         deleting the container or structure.
     view_scale {Double}:
         The scale at which containment mode will be entered to edit
         features participating in the container. For example, setting the view
         scale to 5 means that when you enter containment mode of the container
         feature, the scale will be 1:5. Units are based on the utility network
         units, which are located on thetab of the utility network layer
         properties pane. This parameter does not apply to junction and edge
         objects. Source
     split_content {Boolean}:
         Specifies whether the associated content of a container will be split
         if the container feature is split. This parameter is only enabled if
         the association role is container and is only applicable for line
         features.SPLIT-The container's content will be split if the container
         feature
         is split. If a parallel content line feature is found, the content is
         also split and each section will be contained by the closest container
         feature. If the content line is not parallel, the content will be
         contained by the container feature that is closest to it. When the
         content is a nonspatial junction object, the content is duplicated so
         that each container feature has a junction object as content. When the
         content is a nonspatial edge object, the content is split so that each
         container feature has an edge object as content.DO_NOT_SPLIT-The
         container's content will not be split if the
         container feature is split. If a parallel content line feature is
         found, the content will be contained by both sections of the container
         feature. If the content line is not parallel, the content will be
         contained by the container feature that is closest to it. When working
         with nonspatial junction object content, the content will be contained
         by the larger container. When working with nonspatial edge object
         content, the content is maintained as content to both parent
         containers. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetAssociationRole_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        domain_network,
                        featureclass,
                        assetgroup,
                        assettype,
                        association_role_type,
                        association_deletion_semantics,
                        view_scale,
                        split_content,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetCircuitProperties_un", None)
def SetCircuitProperties(
    in_utility_network=None,
    telecom_domain_network=None,
    diagram_template=None,
    allow_port_reuse: Literal["PORT_REUSE", "NO_PORT_REUSE"] | None = None,
    import_circuits_as_clean: Literal["IMPORT_CIRCUITS_AS_CLEAN", "IMPORT_CIRCUITS_AS_DIRTY"] | None = None,
    support_connectivity_inference: Literal["SUPPORT_CONNECTIVITY", "NO_CONNECTIVITY"] | None = None,
    max_paths=None,
    max_hops=None,
    include_barriers: Literal["INCLUDE_BARRIERS", "EXCLUDE_BARRIERS"] | None = None,
    validate_locatability: Literal["VALIDATE_LOCATABILITY", "DO_NOT_VALIDATE_LOCATABILITY"] | None = None,
    summaries=None,
    condition_barriers=None,
    function_barriers=None,
    traversability_scope: Literal["BOTH_JUNCTIONS_AND_EDGES", "JUNCTIONS_ONLY", "EDGES_ONLY"] | None = None,
) -> Result1[str]:
    """SetCircuitProperties_un(in_utility_network, telecom_domain_network, {diagram_template;diagram_template...}, allow_port_reuse, import_circuits_as_clean, support_connectivity_inference, {max_paths}, {max_hops}, {include_barriers}, {validate_locatability}, {summaries;summaries...}, {condition_barriers;condition_barriers...}, {function_barriers;function_barriers...}, {traversability_scope})

       Set circuit properties.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         Input Utility Network
     telecom_domain_network (String):
         Telecom Domain Network
     diagram_template {String}:
         Diagram Templates
     allow_port_reuse (Boolean):
         Allow Port Reuse
     import_circuits_as_clean (Boolean):
         Import Circuits As Clean
     support_connectivity_inference (Boolean):
         Support Connectivity Inference
     max_paths {Long}:
         Max Paths
     max_hops {Long}:
         Max Hops
     include_barriers {Boolean}:
         Include Barrier Features
     validate_locatability {Boolean}:
         Validate Locatability
     summaries {Value Table}:
         Summaries
     condition_barriers {Value Table}:
         Condition Barriers
     function_barriers {Value Table}:
         Function Barriers
     traversability_scope {String}:
         Apply Traversability To"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetCircuitProperties_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        telecom_domain_network,
                        diagram_template,
                        allow_port_reuse,
                        import_circuits_as_clean,
                        support_connectivity_inference,
                        max_paths,
                        max_hops,
                        include_barriers,
                        validate_locatability,
                        summaries,
                        condition_barriers,
                        function_barriers,
                        traversability_scope,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetEdgeConnectivity_un", None)
def SetEdgeConnectivity(
    in_utility_network=None,
    domain_network=None,
    line_featureclass=None,
    assetgroup=None,
    assettype=None,
    edge_connectivity: Literal["ANY_VERTEX", "END_VERTEX"] | None = None,
) -> Result1[str]:
    """SetEdgeConnectivity_un(in_utility_network, domain_network, line_featureclass, assetgroup, assettype, edge_connectivity)

       Defines how features will connect to a line or edge object of a given
       asset type.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network that contains the asset type with the edge
         connectivity to set.
     domain_network (String):
         The domain network that contains the asset type with the edge
         connectivity to set.
     line_featureclass (String):
         The name of the input feature class or table that contains the asset
         type with the edge connectivity to set.
     assetgroup (String):
         The asset group that contains the asset type with the edge
         connectivity to set.
     assettype (String):
         The asset type that requires the edge connectivity to set.
     edge_connectivity (String):
         Specifies the edge connectivity type that will be assigned to the
         asset type.ANY_VERTEX-Features will connect anywhere along the edge
         including end
         vertices.END_VERTEX-Features will only connect to the end vertex of an
         edge."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetEdgeConnectivity_un(
                *gp_fixargs(
                    (in_utility_network, domain_network, line_featureclass, assetgroup, assettype, edge_connectivity),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetNetworkAttribute_un", None)
def SetNetworkAttribute(
    in_utility_network=None,
    network_attribute=None,
    domain_network=None,
    featureclass=None,
    field=None,
) -> Result1[str]:
    """SetNetworkAttribute_un(in_utility_network, network_attribute, domain_network, featureclass, field)

       Assigns a network attribute to a feature class or table at the asset
       type level to be used during tracing operations.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network that contains the network attribute to set.
     network_attribute (String):
         The network attribute to be assigned to the field in the feature class
         or table.
     domain_network (String):
         The domain network that contains the feature class or table that will
         have a network attribute set on it.
     featureclass (String):
         The input feature class or table that contains the field that will be
         used to set the network attribute.
     field (String):
         An existing field that will be assigned the network attribute. The
         field data type must match the data type of the network attribute. For
         example, if the network attribute is a short integer type, the field
         must also be a short integer type. Network attributes that do not
         support nulls can only be assigned to fields that do not allow null
         values."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetNetworkAttribute_un(
                *gp_fixargs((in_utility_network, network_attribute, domain_network, featureclass, field), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetNetworkCategory_un", None)
def SetNetworkCategory(
    in_utility_network=None,
    domain_network=None,
    featureclass=None,
    assetgroup=None,
    assettype=None,
    category=None,
) -> Result1[str]:
    """SetNetworkCategory_un(in_utility_network, domain_network, featureclass, assetgroup, assettype, {category;category...})

       Assigns a network category to a feature class or table at the asset
       type level to be used during tracing operations.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network that contains the network category.
     domain_network (String):
         The domain network in the utility network that contains the network
         category.
     featureclass (String):
         The utility network feature class or table to which the asset type
         belongs.
     assetgroup (String):
         The asset group to which the asset type belongs.
     assettype (String):
         The asset type to alter the category configuration.
     category {String}:
         The categories to be assigned to the asset type. The categories that
         are specified for this parameter will replace the current categories
         that are assigned to the asset type. To unassign a network category
         from an asset type, do not specify a category for this parameter.
         Thesystem-provided network category is only available for
         asset types in the device feature class and junction object table. In
         a domain network with a partitioned tier definition, the selected
         asset type must also have a directional terminal configuration
         assigned with a minimum of one upstream and one downstream terminal.
         Subnetwork Controller"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetNetworkCategory_un(
                *gp_fixargs((in_utility_network, domain_network, featureclass, assetgroup, assettype, category), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetSubnetworkDefinition_un", None)
def SetSubnetworkDefinition(
    in_utility_network=None,
    domain_network=None,
    tier_name=None,
    support_disjoint_subnetwork: Literal["SUPPORT_DISJOINT", "NO_DISJOINT"] | None = None,
    valid_devices=None,
    valid_subnetwork_controller=None,
    valid_lines=None,
    aggregated_line=None,
    diagram_template=None,
    summaries=None,
    condition_barriers=None,
    function_barriers=None,
    include_barriers: Literal["INCLUDE_BARRIERS", "EXCLUDE_BARRIERS"] | None = None,
    traversability_scope: Literal["BOTH_JUNCTIONS_AND_EDGES", "JUNCTIONS_ONLY", "EDGES_ONLY"] | None = None,
    propagators=None,
    update_structure_features: Literal["UPDATE", "NOT_UPDATE"] | None = None,
    update_container_features: Literal["UPDATE", "NOT_UPDATE"] | None = None,
    edit_mode_for_default_version: Literal["WITHOUT_EVENTING", "WITH_EVENTING"] | None = None,
    edit_mode_for_named_version: Literal["WITHOUT_EVENTING", "WITH_EVENTING"] | None = None,
    valid_junctions=None,
    valid_junction_objects=None,
    valid_junction_object_subnetwork_controller=None,
    valid_edge_objects=None,
    manage_subnetwork_isdirty: Literal["MANAGE", "NOT_MANAGE"] | None = None,
    include_containers: Literal["INCLUDE_CONTAINERS", "EXCLUDE_CONTAINERS"] | None = None,
    include_content: Literal["INCLUDE_CONTENT", "EXCLUDE_CONTENT"] | None = None,
    include_structures: Literal["INCLUDE_STRUCTURES", "EXCLUDE_STRUCTURES"] | None = None,
    validate_locatability: Literal["VALIDATE_LOCATABILITY", "DO_NOT_VALIDATE_LOCATABILITY"] | None = None,
) -> Result1[str]:
    """SetSubnetworkDefinition_un(in_utility_network, domain_network, tier_name, support_disjoint_subnetwork, {valid_devices;valid_devices...}, {valid_subnetwork_controller;valid_subnetwork_controller...}, {valid_lines;valid_lines...}, {aggregated_line;aggregated_line...}, {diagram_template;diagram_template...}, {summaries;summaries...}, {condition_barriers;condition_barriers...}, {function_barriers;function_barriers...}, {include_barriers}, {traversability_scope}, {propagators;propagators...}, {update_structure_features}, {update_container_features}, {edit_mode_for_default_version}, {edit_mode_for_named_version}, {valid_junctions;valid_junctions...}, {valid_junction_objects;valid_junction_objects...}, {valid_junction_object_subnetwork_controller;valid_junction_object_subnetwork_controller...}, {valid_edge_objects;valid_edge_objects...}, {manage_subnetwork_isdirty}, {include_containers}, {include_content}, {include_structures}, {validate_locatability})

       Sets the domain network tier's properties for a subnetwork in a
       utility network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The input utility network that contains the tier's subnetwork.
     domain_network (String):
         The domain network that contains the tier.
     tier_name (String):
         The name of the tier that contains the subnetwork.
     support_disjoint_subnetwork (Boolean):
         Specifies whether the input tier will support disjoint subnetworks.
         Disjoint subnetworks are two or more subnetworks that belong to the
         same tier and have the same subnetwork name but are not traversable.
         This parameter is only available for tiers in domain networks with a
         partitioned tier definition. This parameter is set to SUPPORT_DISJOINT
         by default for tiers in a domain network with a hierarchical tier
         definition to support disjoint subnetworks.SUPPORT_DISJOINT-The input
         tier will support disjoint
         subnetworks.NO_DISJOINT-The input tier will not support disjoint
         subnetworks. This
         is the default except as noted.
     valid_devices {String}:
         The asset group/asset type pairs identified as valid devices for the
         subnetwork.
     valid_subnetwork_controller {String}:
         The asset group/asset type pairs identified as valid device subnetwork
         controllers in the subnetwork.
     valid_lines {String}:
         The asset group/asset type pairs identified as valid lines for the
         subnetwork.
     aggregated_line {String}:
         The valid lines with geometry that will be aggregated to generate the
         SubnetLine features. This list is a subset of the values specified in
         the valid_lines parameter.
     diagram_template {String}:
         The templates that will be used to generate subnetwork system diagrams
         for each subnetwork.
     summaries {Value Table}:
         Sets the Summary Attribute field to store function results when
         inserting or updating SubnetLine features. The summaries can be
         calculated on all the features in the subnetwork. Calculations can be
         filtered to apply only to network features with a particular attribute
         value or category. Summaries components are as follows:
         Function-Choose
         from a number of calculation
         functions.Attribute-Filter by any network attribute defined in the
         system.Filter Name-Filter the function results by attribute
         name.Filter Operator-Choose from a number of operators.Filter
         Type-Choose from a number of filter types.Filter Value-Provide a
         specific value for the input filter attribute.Summary Attribute-The
         field in the SubnetLine feature class that will
         persist the function result. Depending on the specified function and
         network attribute type, only the applicable type of user-added
         subnetwork attributes will be valid for this component. If a field to
         store the summary result does not exist in the SubnetLine feature
         class, the Add Field tool can be used to create one. A field can only
         support the result of one summary; each summary requires its own field
         in the SubnetLine feature class.The summaries Function value options
         are as follows:AVERAGE-The average of the input values will be
         calculated.COUNT-The
         number of features will be identified.MAX-The maximum of the input
         values will be identified.MIN-The minimum of the input values will be
         identified.ADD-The sum of the input values will be
         calculated.SUBTRACT-The difference of the input values will be
         calculated.
         Subnetwork controllers and loops trace types do not support the
         subtract function.The summaries Filter Operator value options are as
         follows:IS_EQUAL_TO-The attribute is equal to the
         value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).The
         summaries Filter Type value options are as
         follows:SPECIFIC_VALUE-Filter by a specific
         value.NETWORK_ATTRIBUTE-Filter by
         a network attribute.
     condition_barriers {Value Table}:
         Sets a traversability barrier condition on features based on a
         comparison to a network attribute or check for a category string. A
         condition barrier uses a network attribute or network category, an
         operator and a type, and an attribute value. For example, stop a trace
         when a feature has theattribute equal to the specific value of Open.
         When a feature meets this condition, the trace stops. If you're using
         more than one attribute, you can use theparameter to define an And or
         an Or condition. Device StatusCombine using        Condition
         barrier components are as follows:
         Name-Filter by any network attribute defined in the system or specify
         Category to use a network category.Operator-Choose from a number of
         operators. Type-Specify either Specific value or Network
         attribute for
         the type of value from the Name parameter that will serve as a
         barrier. The Type parameter must be Specific value when the Name
         parameter is. CategoryValue-Provide a specific value for the
         input attribute or category
         that would cause termination based on the operator value.Combine
         Using-Set this value if you have multiple conditions to add.
         You can combine them using an And or an Or condition.The condition
         barriers Operator values are as follows:IS_EQUAL_TO-The attribute is
         equal to the value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).The
         condition barriers Type value options are as
         follows:SPECIFIC_VALUE-Filter by a specific value or network
         category.NETWORK_ATTRIBUTE-Filter by a network attribute.The Combine
         Using values are as follows:AND-Combine the condition barriers.OR-Use
         if either condition barrier
         is met.
     function_barriers {Value Table}:
         Sets a traversability barrier on features based on a function.
         Function barriers can be used to do such things as restrict how far
         the trace travels from the starting point, or set a maximum value to
         stop a trace. For example, the length of each line traveled is added
         to the total distance traveled so far. When the total length traveled
         reaches the value specified, the trace stops. Function barrier
         components are as follows:
         Function-Choose from a number of calculation
         functions.Attribute-Filter by any network attribute defined in the
         system.Operator-Choose from a number of operators.Value-Provide a
         specific value of the input attribute type that, if
         discovered, will cause the termination.Use Local Values-Calculate
         values in each direction as opposed to an
         overall global value. For example, use for a function barrier that is
         calculating the sum of a shape length in which the trace terminates if
         the value is greater than or equal to 4. In the global case, after you
         have traversed two edges with a value of 2, you have already reached a
         shape length sum of 4, so the trace stops. If local values are used,
         the local values along each path change, and the trace continues.The
         function barrier Function value options are as follows:AVERAGE-The
         average of the input values will be calculated.COUNT-The
         number of features will be identified.MAX-The maximum of the input
         values will be identified.MIN-The minimum of the input values will be
         identified.ADD-The sum of the input values will be calculated.
         SUBTRACT-The difference in the input values will be
         calculated. Subnetwork controllers and loops trace types do
         not support the
         subtract function.The function barrier Operator value options are as
         follows:IS_EQUAL_TO-The attribute is equal to the
         value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).The
         function barrier Use Local Values value options are as
         follows:TRUE-Use local values.FALSE-Use global values. This is the
         default.
     include_barriers {Boolean}:
         Specifies whether the traversability barrier features will be included
         in the trace results. Traversability barriers are optional even if
         they have been preset in the subnetwork
         definition.INCLUDE_BARRIERS-Traversability barriers will be included
         in the trace
         results. This is the default.EXCLUDE_BARRIERS-Traversability barriers
         will not be included in the
         trace results.
     traversability_scope {String}:
         Specifies the type of traversability that will be applied.
         Traversability scope determines whether traversability is applied to
         junctions, edges, or both. For example, if a condition barrier is
         defined to stop the trace ifis equal to Open and traversability scope
         is set to edges only, the trace will not stop even if it encounters an
         open device, becauseis only applicable to junctions. In other words,
         this parameter indicates to the trace whether to ignore junctions,
         edges, or both. Device StatusDevice
         StatusBOTH_JUNCTIONS_AND_EDGES-Traversability will be applied to both
         junctions and edges. This is the default.JUNCTIONS_ONLY-Traversability
         will be applied to junctions only.EDGES_ONLY-Traversability will be
         applied to edges only.
     propagators {Value Table}:
         Specifies the network attributes to propagate as well as how that
         propagation will occur during a trace. Propagated class attributes
         denote the key values on subnetwork controllers that are disseminated
         to the rest of the features in the subnetwork. For example, in an
         electric distribution model, you can propagate the phase value.
         Propagators components are as follows:        Attribute-Filter
         by any network attribute defined in the
         system.Substitution Attribute-Use a substituted value instead of
         bitset
         network attribute values. Substitutions are encoded based on the
         number of bits in the network attribute being propagated. A
         substitution is a mapping of each bit in a phase to another bit. For
         example, for Phase AC, one substitution could map bit A to B and bit C
         to null. In this example, the substitution for 1010 (Phase AC) is
         0000-0010-0000-0000 (512). The substitution captures the mapping so
         you know that Phase A was mapped to B and Phase C was mapped to null
         and not the opposite (that is, Phase A was not mapped to null and
         Phase C was not mapped to B).Function-Choose from a number of
         calculation functions.Operator-Choose from a number of
         operators.Value-Provide a specific value for the input attribute type
         that would
         cause termination based on the operator value.Propagated Attribute-The
         name of the field in the network class that
         is used to store the calculated propagated values. The field type
         should be the same as the field type of the network attribute
         specified for the Attribute value.The propagators Function value
         options are as follows:PROPAGATED_BITWISE_AND-The values of one
         feature to the next will be
         compared.PROPAGATED_MIN-Get the minimum value.PROPAGATED_MAX-Get the
         maximum value.The propagators Operator value options are as
         follows:IS_EQUAL_TO-The attribute is equal to the
         value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).This
         parameter is only available in Python.
     update_structure_features {Boolean}:
         Specifies whether the update subnetwork process will update the
         supported subnetwork name attribute for structure network
         containers.UPDATE-The structure network containers will be updated.
         This is the
         default.NOT_UPDATE-The structure network containers will not be
         updated. This parameter requires avalue of 4 or later.
         Utility
         Network Version
     update_container_features {Boolean}:
         Specifies whether the update subnetwork process will update the
         supported subnetwork name for domain network containers.UPDATE-The
         domain network containers will be updated. This is the
         default.NOT_UPDATE-The domain network containers will not be updated.
         This parameter requires avalue of 4 or later. Utility
         Network Version
     edit_mode_for_default_version {String}:
         Specifies the edit mode that will be used for subnetwork updates on
         the default version and with file and mobile
         geodatabases.WITHOUT_EVENTING-Eventing will not be used for subnetwork
         updates on
         the default version or in a file or mobile geodatabase. This edit mode
         updates the subnetwork name and propagated values in place. This is
         the default.WITH_EVENTING-Eventing will be used for subnetwork updates
         on the
         default version and in a file or mobile geodatabase. This edit mode
         applies geodatabase behavior (for example, attribute rules, editor
         tracking, and so on) when the subnetwork is updated and updates the
         subnetwork name and propagated values for all applicable features and
         objects. This parameter requires avalue of 4 or later.
         Utility
         Network Version
     edit_mode_for_named_version {String}:
         Specifies the edit mode that will be used for subnetwork updates on a
         named version.WITHOUT_EVENTING-Eventing will not be used for
         subnetwork updates on
         named versions. This edit mode updates the subnetwork name and
         propagated values in place for features and objects edited in the
         version. This is the default.WITH_EVENTING-Eventing will be used for
         subnetwork updates on named
         versions. This edit mode applies geodatabase behavior (for example,
         attribute rules, editor tracking, and so on) when the subnetwork is
         updated and updates the subnetwork name and propagated values for all
         applicable features and objects. This parameter requires avalue
         of 4 or later and is only
         applicable to enterprise geodatabases. Utility Network Version
     valid_junctions {String}:
         The asset group/asset type pairs identified as valid junctions for the
         subnetwork. This parameter requires avalue of 4 or later.
         Utility
         Network Version
     valid_junction_objects {String}:
         The asset group/asset type pairs identified as valid junction objects
         for the subnetwork. This parameter requires avalue of 4 or
         later. Utility
         Network Version
     valid_junction_object_subnetwork_controller {String}:
         The asset group/asset type pairs identified as valid junction object
         subnetwork controllers for the subnetwork. This parameter
         requires avalue of 4 or later. Utility
         Network Version
     valid_edge_objects {String}:
         The asset group/asset type pairs identified as valid edge objects for
         the subnetwork. This parameter requires avalue of 4 or later.
         Utility
         Network Version
     manage_subnetwork_isdirty {Boolean}:
         Specifies whether theattribute in the subnetworks table will
         be managed by the update subnetwork operation. If no subnetwork
         controllers are defined for the tier, the NOT_MANAGE option is used by
         default. Is dirty         MANAGE-Theattribute will be managed
         by the update subnetwork
         operation. This is the default except as noted. Is dirty
         NOT_MANAGE-Theattribute will not be managed by the update
         subnetwork operation. Is dirty        This parameter requires
         avalue of 5 or later. Utility
         Network Version
     include_containers {Boolean}:
         Specifies whether the container features and objects will be included
         in the trace results.INCLUDE_CONTAINERS-Container features and
         objects will be included in
         the trace results.EXCLUDE_CONTAINERS-Container features and objects
         will not be
         included in the trace results. This is the default. This
         parameter requires avalue of 5 or later. Utility
         Network Version
     include_content {Boolean}:
         Specifies whether the trace will include content of containers in the
         results.INCLUDE_CONTENT-Content of container features and objects
         will be
         included in the trace results.EXCLUDE_CONTENT-Content of container
         features and objects will not be
         included in the trace results. This is the default. This
         parameter requires avalue of 5 or later. Utility
         Network Version
     include_structures {Boolean}:
         Specifies whether structure features and objects will be included in
         the trace results.INCLUDE_STRUCTURES-Structure features and objects
         will be included in
         the trace results.EXCLUDE_STRUCTURES-Structure features and objects
         will not be
         included in the trace results. This is the default. This
         parameter requires avalue of 5 or later. Utility
         Network Version
     validate_locatability {Boolean}:
         Specifies whether an error will be returned during a trace or update
         subnetwork operation if nonspatial junction or edge objects are
         encountered without the necessary containment, attachment, or
         connectivity association in their association hierarchy of the
         traversed objects. This parameter ensures that nonspatial objects
         returned by a trace or update subnetwork operation can be located
         through an association with features or other locatable
         objects.VALIDATE_LOCATABILITY-An error will be returned if nonspatial
         junction
         or edge objects are encountered without the necessary containment,
         attachment, or connectivity association in their association hierarchy
         of the traversed objects.DO_NOT_VALIDATE_LOCATABILITY-The trace will
         not check for unlocatable
         objects and will return results regardless of whether unlocatable
         objects are present in the association hierarchy of the traversed
         objects. This is the default. This parameter requires avalue of
         5 or later. Utility
         Network Version"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetSubnetworkDefinition_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        domain_network,
                        tier_name,
                        support_disjoint_subnetwork,
                        valid_devices,
                        valid_subnetwork_controller,
                        valid_lines,
                        aggregated_line,
                        diagram_template,
                        summaries,
                        condition_barriers,
                        function_barriers,
                        include_barriers,
                        traversability_scope,
                        propagators,
                        update_structure_features,
                        update_container_features,
                        edit_mode_for_default_version,
                        edit_mode_for_named_version,
                        valid_junctions,
                        valid_junction_objects,
                        valid_junction_object_subnetwork_controller,
                        valid_edge_objects,
                        manage_subnetwork_isdirty,
                        include_containers,
                        include_content,
                        include_structures,
                        validate_locatability,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetTerminalConfiguration_un", None)
def SetTerminalConfiguration(
    in_utility_network=None,
    domain_network=None,
    device_featureclass=None,
    assetgroup=None,
    assettype=None,
    terminal_configuration=None,
) -> Result1[str]:
    """SetTerminalConfiguration_un(in_utility_network, domain_network, device_featureclass, assetgroup, assettype, terminal_configuration)

       Assigns a terminal configuration to an asset type in a utility
       network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network containing the terminal configuration that will be
         assigned to a specific asset type.
     domain_network (String):
         The domain network to which the asset type belongs.
     device_featureclass (String):
         The utility network feature class or table to which the asset type
         belongs.
     assetgroup (String):
         The asset group to which the asset type belongs.
     assettype (String):
         The asset type that will receive the terminal configuration.
     terminal_configuration (String):
         The terminal configuration that will be assigned to the asset type."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetTerminalConfiguration_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        domain_network,
                        device_featureclass,
                        assetgroup,
                        assettype,
                        terminal_configuration,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Trace Configuration toolset
@gptooldoc("AddTraceConfiguration_un", None)
def AddTraceConfiguration(
    in_utility_network=None,
    trace_config_name=None,
    trace_type: Literal[
        "CONNECTED",
        "SUBNETWORK",
        "SUBNETWORK_CONTROLLERS",
        "UPSTREAM",
        "DOWNSTREAM",
        "LOOPS",
        "SHORTEST_PATH",
        "ISOLATION",
    ]
    | None = None,
    description=None,
    tags=None,
    domain_network=None,
    tier=None,
    target_tier=None,
    subnetwork_name=None,
    shortest_path_network_attribute_name=None,
    include_containers: Literal["INCLUDE_CONTAINERS", "EXCLUDE_CONTAINERS"] | None = None,
    include_content: Literal["INCLUDE_CONTENT", "EXCLUDE_CONTENT"] | None = None,
    include_structures: Literal["INCLUDE_STRUCTURES", "EXCLUDE_STRUCTURES"] | None = None,
    include_barriers: Literal["INCLUDE_BARRIERS", "EXCLUDE_BARRIERS"] | None = None,
    validate_consistency: Literal["VALIDATE_CONSISTENCY", "DO_NOT_VALIDATE_CONSISTENCY"] | None = None,
    condition_barriers=None,
    function_barriers=None,
    traversability_scope: Literal["BOTH_JUNCTIONS_AND_EDGES", "JUNCTIONS_ONLY", "EDGES_ONLY"] | None = None,
    filter_barriers=None,
    filter_function_barriers=None,
    filter_scope: Literal["BOTH_JUNCTIONS_AND_EDGES", "JUNCTIONS_ONLY", "EDGES_ONLY"] | None = None,
    filter_bitset_network_attribute_name=None,
    filter_nearest: Literal["FILTER_BY_NEAREST", "DO_NOT_FILTER"] | None = None,
    nearest_count=None,
    nearest_cost_network_attribute=None,
    nearest_categories=None,
    nearest_assets=None,
    functions=None,
    propagators=None,
    output_assettypes=None,
    output_conditions=None,
    include_isolated_features: Literal["INCLUDE_ISOLATED_FEATURES", "EXCLUDE_ISOLATED_FEATURES"] | None = None,
    ignore_barriers_at_starting_points: Literal[
        "IGNORE_BARRIERS_AT_STARTING_POINTS", "DO_NOT_IGNORE_BARRIERS_AT_STARTING_POINTS"
    ]
    | None = None,
    include_up_to_first_spatial_container: Literal[
        "INCLUDE_UP_TO_FIRST_SPATIAL_CONTAINER", "DO_NOT_INCLUDE_UP_TO_FIRST_SPATIAL_CONTAINER"
    ]
    | None = None,
    result_types: list[Literal["SELECTION", "AGGREGATED_GEOMETRY"]]
    | Literal["SELECTION", "AGGREGATED_GEOMETRY"]
    | str
    | None = None,
    allow_indeterminate_flow: Literal["TRACE_INDETERMINATE_FLOW", "IGNORE_INDETERMINATE_FLOW"] | None = None,
    validate_locatability: Literal["VALIDATE_LOCATABILITY", "DO_NOT_VALIDATE_LOCATABILITY"] | None = None,
    use_digitized_direction: Literal["USE_DIGITIZED_DIRECTION", "IGNORE_DIGITIZED_DIRECTION"] | None = None,
    synthesize_geometries: Literal["SYNTHESIZE_GEOMETRIES", "DO_NOT_SYNTHESIZE_GEOMETRIES"] | None = None,
) -> Result1[str]:
    """AddTraceConfiguration_un(in_utility_network, trace_config_name, trace_type, {description}, {tags;tags...}, {domain_network}, {tier}, {target_tier}, {subnetwork_name}, {shortest_path_network_attribute_name}, {include_containers}, {include_content}, {include_structures}, {include_barriers}, {validate_consistency}, {condition_barriers;condition_barriers...}, {function_barriers;function_barriers...}, {traversability_scope}, {filter_barriers;filter_barriers...}, {filter_function_barriers;filter_function_barriers...}, {filter_scope}, {filter_bitset_network_attribute_name}, {filter_nearest}, {nearest_count}, {nearest_cost_network_attribute}, {nearest_categories;nearest_categories...}, {nearest_assets;nearest_assets...}, {functions;functions...}, {propagators;propagators...}, {output_assettypes;output_assettypes...}, {output_conditions;output_conditions...}, {include_isolated_features}, {ignore_barriers_at_starting_points}, {include_up_to_first_spatial_container}, {result_types;result_types...}, {allow_indeterminate_flow}, {validate_locatability}, {use_digitized_direction}, {synthesize_geometries})

       Creates a named trace configuration in the utility network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network that will contain the new named trace
         configuration.
     trace_config_name (String):
         The name of the named trace configuration.
     trace_type (String):
         Specifies the type of trace that will be configured.CONNECTED-A
         connected trace that begins at one or more starting
         points and spans outward along connected features will be used. This
         is the default.SUBNETWORK-A subnetwork trace that begins at one or
         more starting
         points and spans outward to encompass the extent of the subnetwork
         will be used.SUBNETWORK_CONTROLLERS-A subnetwork controllers trace
         that locates
         sources and sinks on subnetwork controllers associated with a
         subnetwork will be used.UPSTREAM-An upstream trace that discovers
         features upstream from a
         location in the network will be used.DOWNSTREAM-A downstream trace
         that discovers features downstream from
         a location in the network will be used.LOOPS-A loops trace that spans
         outward from the starting point based
         on connectivity will be used. Loops are areas of the network where
         flow direction is ambiguous.SHORTEST_PATH-A shortest path trace that
         identifies the shortest path
         between two starting points will be used. ISOLATION-An
         isolation trace that discovers features that
         isolate an area of a network will be used. This trace type
         requires ArcGIS Enterprise 10.7 or later.
     description {String}:
         The description of the named trace configuration.
     tags {String}:
         A set of tags used to identify the named trace configuration. The tags
         can be used in search and indexing.
     domain_network {String}:
         The name of the domain network where the trace will be run. This
         parameter is required when running the subnetwork, subnetwork
         controllers, upstream, and downstream trace types.
     tier {String}:
         The name of the tier where the trace will start. This parameter is
         required when running the subnetwork, subnetwork controllers,
         upstream, and downstream trace types.
     target_tier {String}:
         The name of the target tier to which the input tier will flow. If this
         parameter is not specified for upstream and downstream traces, those
         traces will stop when they reach the boundary of the starting
         subnetwork. This parameter can be used to allow these traces to
         continue either farther up or farther down the hierarchy.
     subnetwork_name {String}:
         The name of the subnetwork where the trace will be run. This parameter
         can be used when running a subnetwork trace type. If a subnetwork name
         is specified, the starting_points parameter is not required.
     shortest_path_network_attribute_name {String}:
         The network attribute that will be used to calculate the shortest
         path. When running a shortest path trace type, the shortest path is
         calculated using a numeric network attribute such as shape length.
         Cost- and distance-based paths can both be achieved. This parameter is
         required when running a shortest path trace.
     include_containers {Boolean}:
         Specifies whether the container features will be included in the trace
         results.INCLUDE_CONTAINERS-Container features will be included in the
         trace
         results.EXCLUDE_CONTAINERS-Container features will not be included in
         the
         trace results. This is the default.
     include_content {Boolean}:
         Specifies whether the trace will return content in container features
         in the results.INCLUDE_CONTENT-Content in container features will be
         included in the
         trace results.EXCLUDE_CONTENT-Content in container features will not
         be included in
         the trace results. This is the default.
     include_structures {Boolean}:
         Specifies whether structure features and objects will be included in
         the trace results.INCLUDE_STRUCTURES-Structure features and objects
         will be included in
         the trace results.EXCLUDE_STRUCTURES-Structure features and objects
         will not be included
         in the trace results. This is the default.
     include_barriers {Boolean}:
         Specifies whether the traversability barrier features will be included
         in the trace results. Traversability barriers are optional even if
         they have been preset in the subnetwork definition. This parameter
         does not apply to device features with
         terminals.INCLUDE_BARRIERS-Traversability barrier features will be
         included in
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
     condition_barriers {Value Table}:
         Sets a traversability barrier condition on features based on a
         comparison to a network attribute or check for a category string. A
         condition barrier uses a network attribute or network category, an
         operator and a type, and an attribute value. For example, stop a trace
         when a feature has theattribute equal to the specific value of Open.
         When a feature meets this condition, the trace stops. If you're using
         more than one attribute, you can use theparameter to define an And or
         an Or condition. Device StatusCombine using        Condition
         barrier components are as follows:
         Name-Filter by any network attribute defined in the
         system.Operator-Choose from a number of operators.Type-Choose a
         specific value or network attribute from the value that
         is specified in the name parameter.Value-Provide a specific value for
         the input attribute type that would
         cause termination based on the operator value.Combine Using-Set this
         value if you have multiple attributes to add.
         You can combine them using an And or an Or condition.The condition
         barriers operator value options are as follows:IS_EQUAL_TO-The
         attribute is equal to the value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).The
         condition barriers Type value options are as
         follows:SPECIFIC_VALUE-Filter by a specific
         value.NETWORK_ATTRIBUTE-Filter by
         a network attribute.The condition barriers Combine Using value options
         are as follows:AND-Combine the condition barriers.OR-Use if either
         condition barrier
         is met.
     function_barriers {Value Table}:
         Sets a traversability barrier on features based on a function.
         Function barriers can be used to do such things as restrict how far
         the trace travels from the starting point, or set a maximum value to
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
         overall global value. For example, a function barrier that is
         calculating the sum of shape length in which the trace terminates if
         the value is greater than or equal to 4. In the global case, after you
         have traversed two edges with a value of 2, you will have reached a
         shape length sum of 4, so the trace stops. If local values are used,
         the local values along each path change, and the trace continues.The
         function barrier Function value options are as follows:AVERAGE-The
         average of the input values will be calculated.COUNT-The
         number of features will be identified.MAX-The maximum of the input
         values will be identified.MIN-The minimum of the input values will be
         identified.ADD-The sum of the input values will be
         calculated.SUBTRACT-The difference between the input values will be
         calculated.
         Subnetwork controllers and loops trace types do not support the
         subtract function.The function barrier operator value options are as
         follows:IS_EQUAL_TO-The function result is equal to the
         value.DOES_NOT_EQUAL-The function result is not equal to the
         value.IS_GREATER_THAN-The function result is greater than the
         value.IS_GREATER_THAN_OR_EQUAL_TO-The function result is greater than
         or
         equal to the value.IS_LESS_THAN-The function result is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The function result is less than or
         equal to
         the value.INCLUDES_THE_VALUES-A bitwise AND operation in which all
         bits in the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).The
         function barrier Use Local Values options are as follows:TRUE-Local
         values will be used.FALSE-Global values will be used. This
         is the default.
     traversability_scope {String}:
         Specifies whether traversability will be applied to junctions, edges,
         or both. For example, if a condition barrier is defined to stop the
         trace if Device Status is equal to Open and traversability scope is
         set to edges only, the trace will not stop-even if it encounters an
         open device-because Device Status is only applicable to junctions. In
         other words, this parameter indicates to the trace whether to ignore
         junctions, edges, or both.BOTH_JUNCTIONS_AND_EDGES-Traversability will
         be applied to both
         junctions and edges. This is the default.JUNCTIONS_ONLY-Traversability
         will be applied to junctions only.EDGES_ONLY-Traversability will be
         applied to edges only.
     filter_barriers {Value Table}:
         Specifies when a trace will stop for a specific category or network
         attribute. For example, stop a trace at features that have a life
         cycle status attribute that is equal to a certain value. This
         parameter is used to set a terminator based on a value of a network
         attribute that is defined in the system. If you're using more than one
         attribute, you can use the Combine Using option to define an And or an
         Or condition. Filter barrier components are as follows:
         Name-Filter
         by category or any network attribute defined in the
         system.Operator-Choose from a number of operators.Type-Choose a
         specific value or network attribute from the value that
         is specified in the name parameter.Value-Provide a specific value of
         the input attribute type that would
         cause termination based on the operator value.Combine Using-Set this
         value if you have multiple attributes to add.
         You can combine them using an And or an Or condition.The filter
         barriers Operator value options are as follows:IS_EQUAL_TO-The
         attribute is equal to the value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INLCUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).The
         filter barriers Type value options are as
         follows:SPECIFIC_VALUE-Filter by a specific
         value.NETWORK_ATTRIBUTE-Filter by
         a network attribute.The filter barriers Combine Using value options
         are as follows:AND-Combine the condition barriers.OR-Use if either
         condition barrier
         is met.
     filter_function_barriers {Value Table}:
         Filters the results of the trace for a specific category.
         Filter function barriers components are as follows:
         Function-Choose from a number of calculation
         functions.Attribute-Filter by any network attribute defined in the
         system.Operator-Choose from a number of operators.Value-Provide a
         specific value for the input attribute type that, if
         discovered, will cause the termination.Use Local Values-Calculate
         values in each direction as opposed to an
         overall global value. For example, a function barrier that is
         calculating the sum of shape length in which the trace terminates if
         the value is greater than or equal to 4. In the global case, after you
         have traversed two edges with a value of 2, you will have reached a
         shape length sum of 4, so the trace stops. If local values are used,
         the local values along each path change, or the trace continues.The
         filter function barriers Function value options are as
         follows:AVERAGE-The average of the input values will be
         calculated.COUNT-The
         number of features will be identified.MAX-The maximum of the input
         values will be identified.MIN-The minimum of the input values will be
         identified.ADD-The sum of the values will be calculated.SUBTRACT-The
         difference between the values will be calculated.
         Subnetwork controllers and loops trace types do not support the
         subtract function.The filter function barriers Operator value options
         are as follows:IS_EQUAL_TO-The attribute is equal to the
         value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).The
         filter function barriers Use Local Values options are as
         follows:TRUE-Local values will be used.FALSE-Global values will be
         used. This
         is the default.
     filter_scope {String}:
         Specifies whether the filter for a specific category will be applied
         to junctions, edges, or both. For example, if a filter barrier is
         defined to stop the trace if Device Status is equal to Open and
         traversability scope is set to edges only, the trace will not
         stop-even if the trace encounters an open device-because Device Status
         is only applicable to junctions. In other words, this parameter
         indicates to the trace whether to ignore junctions, edges, or
         both.BOTH_JUNCTIONS_AND_EDGES-The filter will be applied to both
         junctions
         and edges. This is the default.JUNCTIONS_ONLY-The filter will be
         applied to junctions only.EDGES_ONLY-The filter will be applied to
         edges only.
     filter_bitset_network_attribute_name {String}:
         The name of the network attribute that will be used to filter by
         bitset. This parameter is only applicable to upstream, downstream, and
         loops trace types. This parameter can be used to add special logic
         during a trace so the trace more closely reflects real-world
         scenarios. For example, for a loops trace, the Phases current network
         attribute can determine if the loop is a true electrical loop (the
         same phase is energized all around the loop, that is, A) and return
         only real electrical loops for the trace results. An example for an
         upstream trace is when tracing an electric distribution network,
         specify a Phases current network attribute, and the trace results will
         only include valid paths that are specified in the network attribute,
         not all paths.
     filter_nearest {Boolean}:
         Specifies whether the k-nearest neighbors algorithm will be used to
         return a number of features of a certain type within a given distance.
         You can provide a count and a cost as well as a collection of
         categories, an asset type, or both.FILTER_BY_NEAREST-The k-nearest
         neighbors algorithm will be used to
         return a number of features as specified in the nearest_count,
         nearest_cost_network_attribute, nearest_categories, or nearest_assets
         parameter.DO_NOT_FILTER-The k-nearest neighbors algorithm will not be
         used to
         filter results. This is the default.
     nearest_count {Long}:
         The number of features that will be returned when filter_nearest is
         set to FILTER_BY_NEAREST.
     nearest_cost_network_attribute {String}:
         The numeric network attribute that will be used to calculate nearness,
         cost, or distance when filter_nearest is set to FILTER_BY_NEAREST-for
         example, shape length.
     nearest_categories {String}:
         The category or categories that will be returned when filter_nearest
         is set to FILTER_BY_NEAREST-for example, protective.
     nearest_assets {String}:
         The asset groups and asset types that will be returned when
         filter_nearest is set to FILTER_BY_NEAREST-for example,
         ElectricDistributionDevice/Transformer/Step Down.
     functions {Value Table}:
         The calculation function or functions that will be applied to the
         trace results. Functions components are as follows:
         Function-Choose
         from a number of calculation
         functions.Attribute-Filter by any network attribute defined in the
         system.Filter Name-Filter the function results by attribute
         name.Filter Operator-Choose from a number of operators.Filter
         Type-Choose from a number of filter types.Filter Value-Provide a
         specific value for the input filter attribute.The functions Function
         value options are as follows:AVERAGE-The average of the input values
         will be calculated.COUNT-The
         number of features will be identified.MAX-The maximum of the input
         values will be identified.MIN-The minimum of the input values will be
         identified.ADD-The sum of the input values will be calculated.
         SUBTRACT-The difference between the input values will be
         calculated. Subnetwork controllers and loops trace types do
         not support the
         subtract function.For example, a starting point feature has a value of
         20. The next
         feature has a value of 30. If you are using the MINIMUM function, the
         result is 20, MAXIMUM is 30, ADD is 50, AVERAGE is 25, COUNT is 2, and
         SUBTRACT is -10.The Filter Operator value options are as
         follows:IS_EQUAL_TO-The attribute is equal to the
         value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).The
         functions Filter Type value options are as
         follows:SPECIFIC_VALUE-Filter by a specific
         value.NETWORK_ATTRIBUTE-Filter by
         a network attribute.
     propagators {Value Table}:
         Specifies the network attributes to propagate as well as how that
         propagation will occur during a trace. Propagated class attributes
         denote the key values on subnetwork controllers that are disseminated
         to the rest of the features in the subnetwork. For example, in an
         electric distribution model, you can propagate the phase value.
         Propagators components are as follows:        Attribute-Filter
         by any network attribute defined in the
         system.Substitution Attribute-Use a substituted value instead of
         bitset
         network attribute values. Substitutions are encoded based on the
         number of bits in the network attribute being propagated. A
         substitution is a mapping of each bit in phase to another bit. For
         example, for Phase AC, one substitution could map bit A to B, and bit
         C to null. In this example, the substitution for 1010 (Phase AC) is
         0000-0010-0000-0000 (512). The substitution captures the mapping so
         you know that Phase A was mapped to B and Phase C was mapped to null,
         and not the other way around (that is, Phase A was not mapped to null
         and Phase C was not mapped to B).Function-Choose from a number of
         calculation functions.Operator-Choose from a number of
         operators.Value-Provide a specific value for the input attribute type
         that would
         cause termination based on the operator value.The propagators Function
         value options are as follows:PROPAGATED_BITWISE_AND-The values from
         one feature to the next will be
         compared.PROPAGATED_MIN-The minimum value will be
         identified.PROPAGATED_MAX-The maximum value will be identified.The
         propagators Operator value options are as follows:IS_EQUAL_TO-The
         attribute is equal to the value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).This
         parameter is only available in Python.
     output_assettypes {String}:
         Filters the output asset types to be included in the results-for
         example, only return overhead transformers.
     output_conditions {Value Table}:
         The types of features that will be returned based on a network
         attribute or category. For example, in a trace configured to filter
         out everything but Tap features, any traced features that do not have
         the Tap category assigned to them will not be included in the results.
         Any traced features that do will be returned in the result selection
         set. If you're using more than one attribute, you can use the Combine
         Using option to define an And or an Or condition. Output
         conditions components are as follows:
         Name-Filter by any network attribute defined in the
         system.Operator-Choose from a number of operators.Type-Choose a
         specific value or network attribute from the value that
         is specified in the name parameter.Value-Provide a specific value of
         the input attribute type that would
         cause termination based on the operator value.Combine Using-Set this
         value if you have multiple attributes to add.
         You can combine them using an And or an Or condition.The output
         conditions Operator value options are as follows:IS_EQUAL_TO-The
         attribute is equal to the value.DOES_NOT_EQUAL-The
         attribute is not equal to the value.IS_GREATER_THAN-The attribute is
         greater than the value.IS_GREATER_THAN_OR_EQUAL_TO-The attribute is
         greater than or equal to
         the value.IS_LESS_THAN-The attribute is less than the
         value.IS_LESS_THAN_OR_EQUAL_TO-The attribute is less than or equal to
         the
         value.INCLUDES_THE_VALUES-A bitwise AND operation in which all bits in
         the
         value are present in the attribute (bitwise AND ==
         value).DOES_NOT_INCLUDE_THE_VALUES-A bitwise AND operation in which
         not all
         of the bits in the value are present in the attribute (bitwise AND !=
         value).INCLUDES_ANY-A bitwise AND operation in which at least one bit
         in the
         value is present in the attribute (bitwise AND ==
         True).DOES_NOT_INCLUDE_ANY-A bitwise AND operation in which none of
         the bits
         in the value are present in the attribute (bitwise AND == False).The
         output conditions Type value options are as
         follows:SPECIFIC_VALUE-Filter by a specific
         value.NETWORK_ATTRIBUTE-Filter by
         a network attribute.The output conditions Combine Using value options
         are as follows:AND-Combine the conditions.OR-Use if either condition
         is met.
     include_isolated_features {Boolean}:
         Specifies whether isolated features will be included in the trace
         results. This parameter is only used when running an isolation
         trace.INCLUDE_ISOLATED_FEATURES-Isolated features will be included in
         the
         trace results.EXCLUDE_ISOLATED_FEATURES-Isolated features will not be
         included in
         the trace results. This is the default.For enterprise geodatabases,
         this parameter requires ArcGIS Enterprise
         10.7 or later.
     ignore_barriers_at_starting_points {Boolean}:
         Specifies whether dynamic barriers in the trace configuration will be
         ignored for starting points. This may be useful when performing an
         upstream protective device trace using the discovered protective
         devices (barriers) as starting points to find subsequent upstream
         protective devices.IGNORE_BARRIERS_AT_STARTING_POINTS-Barriers at
         starting points will be
         ignored in the
         trace.DO_NOT_IGNORE_BARRIERS_AT_STARTING_POINTS-Barriers at starting
         points
         will not be ignored in the trace. This is the default.
     include_up_to_first_spatial_container {Boolean}:
         Specifies whether the containers returned will be limited to those
         encountered up to, and including, the first spatial container for each
         network element in the trace results. If no spatial containers are
         encountered but nonspatial containers are present for a given network
         element, all nonspatial containers will be included in the results.
         This parameter is only enabled when Include Containers is set to
         INCLUDE_CONTAINERS.INCLUDE_UP_TO_FIRST_SPATIAL_CONTAINER-Only
         containers encountered up
         to, and including, the first spatial container will be returned in the
         results when nested containment associations are encountered along the
         trace path. If no spatial containers exist, all nonspatial containers
         will be included in the results for a given network
         element.DO_NOT_INCLUDE_UP_TO_FIRST_SPATIAL_CONTAINER-All containers
         will be
         returned in the results. This is the default.
     result_types {String}:
         Specifies the type of results that will be returned by the
         trace.SELECTION-The trace results will be returned as a selection set
         on
         the appropriate network features. This is the
         default.AGGREGATED_GEOMETRY-The trace results will be aggregated by
         geometry
         type and stored in multipart feature classes displayed in layers in
         the active map.
     allow_indeterminate_flow {Boolean}:
         Specifies whether features with indeterminate flow will be traced.
         This parameter is only applicable when running an upstream,
         downstream, or isolation trace.TRACE_INDETERMINATE_FLOW-Features with
         indeterminate flow will be
         traced. This is the default.IGNORE_INDETERMINATE_FLOW-Features with
         indeterminate flow will stop
         traversability and will not be traced.
     validate_locatability {Boolean}:
         Specifies whether an error will be returned if nonspatial junction or
         edge objects are encountered without an associated container or
         structure in the association hierarchy for the traversed features.
         This parameter ensures that nonspatial objects returned by a trace are
         associated with spatial features.VALIDATE_LOCATABILITY-The trace will
         return an error if nonspatial
         junction or edge objects are encountered without an associated
         container or structure in the association hierarchy for the traversed
         features.DO_NOT_VALIDATE_LOCATABILITY-The trace will not check for
         unlocatable
         objects and will return results regardless of whether unlocatable
         objects are present in the association hierarchy of the traversed
         features. This is the default.
     use_digitized_direction {Boolean}:
         Specifies whether upstream and downstream trace operations
         will determine flow direction using the digitized direction of the
         line, the From and To global ID of the edge object in the association,
         and theattribute. This parameter is only available and active for
         utility network version 7 and later when the trace_type parameter is
         set to UPSTREAM or DOWNSTREAM. Flow
         directionUSE_DIGITIZED_DIRECTION-Trace operations will determine flow
         direction
         using the digitized direction of the line, the From and To global ID
         of the edge object in the association, and the flow direction
         attribute. With this option, the domain_network, tier, and target_tier
         parameters are ignored.IGNORE_DIGITIZED_DIRECTION-Trace operations
         will determine flow
         direction based on the location of subnetwork controllers. This is the
         default.For enterprise geodatabases, this parameter requires ArcGIS
         Enterprise
         11.3 or later.
     synthesize_geometries {Boolean}:
         Specifies whether geometries will be inferred and created
         (synthesized) for associations and edge objects traversed as part of a
         trace operation. This parameter is only applicable to the aggregated
         geometry result type.DO_NOT_SYNTHESIZE_GEOMETRIES-Geometries will not
         be synthesized for
         the traversed associations and edge objects. This is the
         default.SYNTHESIZE_GEOMETRIES-Geometries will be inferred and created
         for the
         traversed associations and edge objects in the output
         Trace_Results_Aggregated_Lines feature class.For enterprise
         geodatabases, this parameter requires ArcGIS Enterprise
         11.3 or later."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddTraceConfiguration_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        trace_config_name,
                        trace_type,
                        description,
                        tags,
                        domain_network,
                        tier,
                        target_tier,
                        subnetwork_name,
                        shortest_path_network_attribute_name,
                        include_containers,
                        include_content,
                        include_structures,
                        include_barriers,
                        validate_consistency,
                        condition_barriers,
                        function_barriers,
                        traversability_scope,
                        filter_barriers,
                        filter_function_barriers,
                        filter_scope,
                        filter_bitset_network_attribute_name,
                        filter_nearest,
                        nearest_count,
                        nearest_cost_network_attribute,
                        nearest_categories,
                        nearest_assets,
                        functions,
                        propagators,
                        output_assettypes,
                        output_conditions,
                        include_isolated_features,
                        ignore_barriers_at_starting_points,
                        include_up_to_first_spatial_container,
                        result_types,
                        allow_indeterminate_flow,
                        validate_locatability,
                        use_digitized_direction,
                        synthesize_geometries,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DeleteTraceConfiguration_un", None)
def DeleteTraceConfiguration(
    in_utility_network=None,
    trace_config_name=None,
) -> Result1[str]:
    """DeleteTraceConfiguration_un(in_utility_network, trace_config_name;trace_config_name...)

       Deletes one or more named trace configurations from a utility network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network containing the named trace configuration to be
         deleted.
     trace_config_name (String):
         The named trace configurations to be deleted."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DeleteTraceConfiguration_un(*gp_fixargs((in_utility_network, trace_config_name), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportTraceConfigurations_un", None)
def ExportTraceConfigurations(
    in_utility_network=None,
    trace_config_name=None,
    out_json_file=None,
) -> Result1[str]:
    """ExportTraceConfigurations_un(in_utility_network, trace_config_name;trace_config_name..., out_json_file)

       Exports named trace configurations from a utility network to JSON
       format (.json file).

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network containing the named trace configuration or
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
            gp.ExportTraceConfigurations_un(*gp_fixargs((in_utility_network, trace_config_name, out_json_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportTraceConfigurations_un", None)
def ImportTraceConfigurations(
    in_utility_network=None,
    in_json_file=None,
) -> Result1[str]:
    """ImportTraceConfigurations_un(in_utility_network, in_json_file)

       Imports named trace configurations from JSON format (.json file) to a
       utility network.

    INPUTS:
     in_utility_network (Utility Network / Utility Network Layer):
         The utility network to which the named trace configurations will be
         imported.
     in_json_file (File):
         The .json file containing the named trace configurations to import."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportTraceConfigurations_un(*gp_fixargs((in_utility_network, in_json_file), True))
        )
        return retval
    except Exception as e:
        raise e


# _un toolset
@gptooldoc("AddSpatialQueryRule_un", None)
def AddSpatialQueryRule(
    in_utility_network=None,
    template_name=None,
    is_active: Literal["ACTIVE", "INACTIVE"] | None = None,
    added_features=None,
    overlap_type: Literal[
        "INTERSECT",
        "WITHIN_A_DISTANCE",
        "CONTAINS",
        "WITHIN",
        "BOUNDARY_TOUCHES",
        "SHARE_A_LINE_SEGMENT_WITH",
        "CROSSED_BY_THE_OUTLINE_OF",
    ]
    | None = None,
    existing_features=None,
    search_distance=None,
    added_where_clause=None,
    existing_where_clause=None,
    description=None,
) -> Result2[str, str]:
    """AddSpatialQueryRule_un(in_utility_network, template_name, is_active, added_features, overlap_type, existing_features, {search_distance}, {added_where_clause}, {existing_where_clause}, {description})

       Add a spatial query rule to a diagram template

    INPUTS:
     in_utility_network (Utility Network / Trace Network):
         Input Network
     template_name (String):
         Input Diagram Template
     is_active (Boolean):
         Active
     added_features (Feature Class):
         Add Features
     overlap_type (String):
         Relationship
     existing_features (Feature Class):
         Existing Features
     search_distance {Linear Unit}:
         Search Distance
     added_where_clause {SQL Expression}:
         Added Features Query Definition
     existing_where_clause {SQL Expression}:
         Existing Features Query Definition
     description {String}:
         Description"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddSpatialQueryRule_un(
                *gp_fixargs(
                    (
                        in_utility_network,
                        template_name,
                        is_active,
                        added_features,
                        overlap_type,
                        existing_features,
                        search_distance,
                        added_where_clause,
                        existing_where_clause,
                        description,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyRelativeMainlineLayout_un", None)
def ApplyRelativeMainlineLayout(
    in_network_diagram_layer=None,
    line_attribute=None,
    mainline_direction: Literal["FROM_LEFT_TO_RIGHT", "FROM_TOP_TO_BOTTOM"] | None = None,
    offset_between_branches=None,
    breakpoint_angle=None,
    type_attribute=None,
    mainline_values=None,
    branch_values=None,
    excluded_values=None,
    is_compressing: Literal["USE_COMPRESSION", "DO_NOT_USE_COMPRESSION"] | None = None,
    compression_ratio=None,
    minimal_distance=None,
    alignment_attribute=None,
    initial_distances: Literal["FROM_CURRENT_EDGE_GEOMETRY", "FROM_ATTRIBUTE_EDGE"] | None = None,
    length_attribute=None,
    run_async: Literal["RUN_ASYNCHRONOUSLY", "RUN_SYNCHRONOUSLY"] | None = None,
) -> Result1[str | Layer]:
    """ApplyRelativeMainlineLayout_un(in_network_diagram_layer, line_attribute, {mainline_direction}, {offset_between_branches}, {breakpoint_angle}, {type_attribute}, {mainline_values;mainline_values...}, {branch_values;branch_values...}, {excluded_values;excluded_values...}, {is_compressing}, {compression_ratio}, {minimal_distance}, {alignment_attribute}, {initial_distances}, {length_attribute}, {run_async})

       Apply the relative mainline layout to a diagram

    INPUTS:
     in_network_diagram_layer (Diagram Layer):
         Input Network Diagram Layer
     line_attribute (String):
         Line Attribute
     mainline_direction {String}:
         Direction
     offset_between_branches {Linear Unit}:
         Offset Between Branches
     breakpoint_angle {Double}:
         Break Point angle (in degree)
     type_attribute {String}:
         Type Attribute
     mainline_values {Value Table}:
         Mainline Values
     branch_values {Value Table}:
         Branch Values
     excluded_values {Value Table}:
         Excluded Values
     is_compressing {Boolean}:
         Compression along the direction
     compression_ratio {Double}:
         Ratio (%)
     minimal_distance {Linear Unit}:
         Minimal Distance
     alignment_attribute {String}:
         Alignment Attribute
     initial_distances {String}:
         Initial Distances
     length_attribute {String}:
         Length Attribute
     run_async {Boolean}:
         Run in asynchronous mode on the server"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyRelativeMainlineLayout_un(
                *gp_fixargs(
                    (
                        in_network_diagram_layer,
                        line_attribute,
                        mainline_direction,
                        offset_between_branches,
                        breakpoint_angle,
                        type_attribute,
                        mainline_values,
                        branch_values,
                        excluded_values,
                        is_compressing,
                        compression_ratio,
                        minimal_distance,
                        alignment_attribute,
                        initial_distances,
                        length_attribute,
                        run_async,
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
