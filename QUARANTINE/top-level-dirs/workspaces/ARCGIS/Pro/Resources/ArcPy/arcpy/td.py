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
r"""The Territory Design toolbox provides a set of tools to build, edit,
balance, and maintain territories for point and polygon datasets."""
from __future__ import annotations

__all__ = [
    "AddLevelVariables",
    "AddTerritoryBarriers",
    "AddTerritoryLevel",
    "AddTerritorySeedPoints",
    "CopyTerritorySolution",
    "CreateTerritoryLevelFeatureClasses",
    "CreateTerritorySolution",
    "ExportTerritorySolution",
    "GenerateTerritoryReport",
    "ImportTerritorySolution",
    "LoadTerritoryRecords",
    "MakeTerritorySolutionLayer",
    "RebuildTerritorySolution",
    "SetBalanceVariables",
    "SetTerritoryAttributeConstraints",
    "SetTerritoryDistanceParameters",
    "SetTerritoryLevelOptions",
    "SolveTerritories",
    "ValidateTerritories",
]
__alias__ = "td"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Analysis toolset
@gptooldoc("AddLevelVariables_td", None)
def AddLevelVariables(
    in_territory_solution=None,
    level=None,
    base_level=None,
    variables=None,
) -> Result1[str | Layer]:
    """AddLevelVariables_td(in_territory_solution, level, base_level, variables;variables...)

       Adds a new field at the specified level.

    INPUTS:
     in_territory_solution (Group Layer / Feature Dataset / String):
         The input territory solution.
     level (String):
         The level to which the calculated field will be added.
     base_level (String):
         The level below the territory level to which the attribute value will
         be added.
     variables (Value Table):
         The variables that will be added to the level.statistic_field-The
         field that will be used for statistical
         calculation. statistic-The type of statistical calculation.
         count-The number of values included in the calculation will be
         identified.sum-The values for the specified field will be added
         together.maximum-The largest value for the specified field will be
         identified.minimum-The smallest value for the specified field will be
         identified.average-The average of the values for the specified field
         will be
         calculated.median-The median of the values for the specified field
         will be
         calculated.standard_deviation-The standard deviation of values for the
         specified
         field will be calculated.percent_of_total-The percentage of each value
         for the specified field
         will be calculated from the total sum of the values for the
         field.field_name-The valid name of the field on the level where the
         calculated data will be stored.field_alias_name-The readable and
         understandable name of the
         calculated field."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddLevelVariables_td(*gp_fixargs((in_territory_solution, level, base_level, variables), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddTerritoryBarriers_td", None)
def AddTerritoryBarriers(
    in_territory_solution=None,
    level=None,
    in_barrier_features=None,
    barrier_type: Literal["IMPEDANCE", "RESTRICTED_AREA"] | None = None,
    append_data: Literal["APPEND", "REPLACE"] | None = None,
) -> Result1[str | Layer]:
    """AddTerritoryBarriers_td(in_territory_solution, level, in_barrier_features, {barrier_type}, {append_data})

       Allows the addition of polygon or line features to prevent or restrict
       the growth of territories.

    INPUTS:
     in_territory_solution (Group Layer / Feature Dataset / String):
         The Territory Design solution layer that will be used in the analysis.
     level (String):
         The level to which the barriers will be applied.
     in_barrier_features (Feature Layer):
         Line or polygon features used as a barrier.
     barrier_type {String}:
         Specifies the type of barrier.IMPEDANCE-Limits the growth of
         territories. This is the
         default.RESTRICTED_AREA-Prevents the creation of territories.
     append_data {Boolean}:
         Specifies whether to append or replace the records to the barriers
         layer.APPEND-Appends records to an existing barrier
         layer.REPLACE-Creates a
         new barrier layer or replaces records in an existing
         barrier layer. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddTerritoryBarriers_td(
                *gp_fixargs((in_territory_solution, level, in_barrier_features, barrier_type, append_data), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddTerritorySeedPoints_td", None)
def AddTerritorySeedPoints(
    in_territory_solution=None,
    level=None,
    in_seed_points=None,
    field_map=None,
    append_data: Literal["APPEND", "REPLACE"] | None = None,
) -> Result1[str | Layer]:
    """AddTerritorySeedPoints_td(in_territory_solution, level, in_seed_points, {field_map;field_map...}, {append_data})

       Creates a point feature that is used to determine the starting point
       for creating territories.

    INPUTS:
     in_territory_solution (Group Layer / Feature Dataset / String):
         The Territory Design solution dataset.
     level (String):
         The target territory level for which the seed points feature will be
         created.
     in_seed_points (Feature Layer):
         The points feature layer that represents seed points for territories.
     field_map {Value Table}:
         Specifies the attributes and fields that will be used for the seed
         point properties.Name-The name for a seed point featureID-The ID for a
         seed point
         featureType-The seed point typeThe field value associated with the
         Type attribute can only be
         Required or Candidate.
     append_data {Boolean}:
         Specifies whether the data will be appended or replaced.APPEND-The
         data will be appended.REPLACE-The data will be replaced.
         This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddTerritorySeedPoints_td(
                *gp_fixargs((in_territory_solution, level, in_seed_points, field_map, append_data), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetBalanceVariables_td", None)
def SetBalanceVariables(
    in_territory_solution=None,
    level=None,
    variables=None,
) -> Result1[str | Layer]:
    """SetBalanceVariables_td(in_territory_solution, level, {variables;variables...})

       Configures variables to be used in the balancing process.

    INPUTS:
     in_territory_solution (Group Layer / Feature Dataset / String):
         The name of the input territory solution.
     level (String):
         The name of the level to which the calculated field will be added.
     variables {Value Table}:
         The variables that will be used in the balance process.
         variable-The defined input.weight-The amount of influence a given
         variable has in the analysis."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetBalanceVariables_td(*gp_fixargs((in_territory_solution, level, variables), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetTerritoryAttributeConstraints_td", None)
def SetTerritoryAttributeConstraints(
    in_territory_solution=None,
    level=None,
    constraints=None,
) -> Result1[str | Layer]:
    """SetTerritoryAttributeConstraints_td(in_territory_solution, level, {constraints;constraints...})

       Sets variables for adding constraints when solving the territory
       solution.

    INPUTS:
     in_territory_solution (Group Layer / Feature Dataset / String):
         The Territory Design solution layer that will be used in the analysis
     level (String):
         The level to which the constraints will be applied.
     constraints {Value Table}:
         The variables that will be used for constraining the territory
         solution.variable-Numeric value to be used as the
         constraint.minimum-Numeric
         value that sets a hard limit for the territories'
         lower bound.maximum-Numeric value that sets a hard limit for the
         territories'
         upper bound.ideal_value-Numeric value that sets a soft limit for the
         ideal value
         for the territory solution.weight-The influence a constraint value has
         on the territory solution.
         The number must be greater than 0."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetTerritoryAttributeConstraints_td(*gp_fixargs((in_territory_solution, level, constraints), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetTerritoryDistanceParameters_td", None)
def SetTerritoryDistanceParameters(
    in_territory_solution=None,
    level=None,
    distance_type: Literal["STRAIGHT_LINE"] | None = None,
    units: Literal[
        "METERS",
        "MILES",
        "NAUTICAL_MILES",
        "KILOMETERS",
        "YARDS",
        "FEET",
        "INCHES",
        "DECIMETERS",
        "CENTIMETERS",
        "MILLIMETERS",
        "DECIMAL_DEGREES",
        "MINUTES",
        "HOURS",
        "DAYS",
        "SECONDS",
    ]
    | None = None,
    max_radius=None,
    buffer_distance=None,
    min_distance=None,
    network_datasource=None,
    build_index: Literal["BUILD_INDEX", "DO_NOT_BUILD_INDEX"] | None = None,
    travel_direction: Literal["TOWARD_STORES", "AWAY_FROM_STORES"] | None = None,
    time_of_day=None,
    time_zone: Literal["TIME_ZONE_AT_LOCATION", "UTC"] | None = None,
    search_tolerance=None,
) -> Result1[str | Layer]:
    """SetTerritoryDistanceParameters_td(in_territory_solution, level, {distance_type}, {units}, {max_radius}, {buffer_distance}, {min_distance}, {network_datasource}, {build_index}, {travel_direction}, {time_of_day}, {time_zone}, {search_tolerance})

       Defines the type of distance calculation or distance constraints to
       use when creating territories.

    INPUTS:
     in_territory_solution (Group Layer / Feature Dataset / String):
         The Territory Design solution layer that will be used in the analysis.
     level (String):
         The level to which the distance parameters will be applied.
     distance_type {String}:
         Specifies the method of travel that will be used for the distance
         calculation.STRAIGHT_LINE-Straight line, or Euclidean distance, will
         be used as
         the distance measure. This is the default.When a network data source
         is selected, additional travel mode options
         will be dynamically populated. The following distance methods
         are supported:        Driving
         TimeDriving DistanceTrucking TimeTrucking DistanceWalking
         TimeWalking DistanceRural Trucking TimeRural Trucking Distance
     units {String}:
         Specifies the type of measuring units that will be used.METERS-The
         distance unit will be meters.MILES-The distance unit will
         be miles.NAUTICAL_MILES-The distance unit will be nautical
         miles.KILOMETERS-The distance unit will be kilometers.YARDS-The
         distance unit will be yards.FEET-The distance unit will be
         feet.INCHES-The distance unit will be inches.DECIMETERS-The distance
         unit will be decimeters.CENTIMETERS-The distance unit will be
         centimeters.MILLIMETERS-The distance unit will be
         millimeters.DECIMAL_DEGREES-The distance unit will be decimal
         degrees.MINUTES-The time unit will be minutes.HOURS-The time unit will
         be hours.DAYS-The time unit will be days.SECONDS-The time unit will be
         seconds.
     max_radius {Double}:
         The maximum radius of the territory.
     buffer_distance {Double}:
         The radius of the territory buffer.
     min_distance {Double}:
         The minimum distance between territory centers.
     network_datasource {Network Dataset Layer}:
         The network dataset on which the network distance calculation will be
         performed. The parameter requires a locally installed dataset.
     build_index {Boolean}:
         Specifies whether a network index will be built. A network index will
         improve performance when solving the territory solution.BUILD_INDEX-A
         network index will be built. This is the
         default.DO_NOT_BUILD_INDEX-A network index will not be built.
     travel_direction {String}:
         Specifies the direction of travel between stores and
         customers.TOWARD_STORES-Direction of travel will be from customers to
         stores.
         This is the default.AWAY_FROM_STORES-Direction of travel will be from
         stores to customers.
     time_of_day {Date}:
         The time and date that will be used when calculating distance.
     time_zone {String}:
         Specifies the time zone of the time_of_day
         parameter.TIME_ZONE_AT_LOCATION-The time zone in which the territories
         are
         located will be used. This is the default.UTC-Coordinated universal
         time (UTC) will be used.
     search_tolerance {Linear Unit}:
         The search tolerance that will be used for locating territories on the
         network. Territories that are outside the search tolerance will be
         left unlocated.This parameter requires a distance value and units for
         the tolerance.
         The default value is 5000 meters."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetTerritoryDistanceParameters_td(
                *gp_fixargs(
                    (
                        in_territory_solution,
                        level,
                        distance_type,
                        units,
                        max_radius,
                        buffer_distance,
                        min_distance,
                        network_datasource,
                        build_index,
                        travel_direction,
                        time_of_day,
                        time_zone,
                        search_tolerance,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetTerritoryLevelOptions_td", None)
def SetTerritoryLevelOptions(
    in_territory_solution=None,
    level=None,
    compactness=None,
    fill_extent: Literal["AUTO_FILL_EXTENT", "DO_NOT_AUTO_FILL_EXTENT"] | None = None,
    random_seed=None,
    spatial_relationship: Literal["CONTIGUITY_EDGES_ONLY"] | None = None,
    buffer_tolerance=None,
) -> Result1[str | Layer]:
    """SetTerritoryLevelOptions_td(in_territory_solution, level, {compactness}, {fill_extent}, {random_seed}, {spatial_relationship}, {buffer_tolerance})

       Sets options for how territory levels are created.

    INPUTS:
     in_territory_solution (Group Layer / Feature Dataset / String):
         The Territory Design solution layer that will be used in the analysis.
     level (String):
         The level to which the options will be applied.
     compactness {Long}:
         A numeric value between 0 and 100 that defines the shape of
         territories.
     fill_extent {Boolean}:
         Specifies whether features are automatically assigned to the nearest
         territory.AUTO_FILL_EXTENT-Features are automatically assigned to the
         nearest
         territory.DO_NOT_AUTO_FILL_EXTENT-Features are not automatically
         assigned to the
         nearest territory. This is the default.
     random_seed {Long}:
         An integer used for the seed value. The default is no value and uses a
         random generator.
     spatial_relationship {String}:
         Specifies the spatial relationship of how features are related to
         determine adjacency.CONTIGUITY_EDGES_ONLY-Polygon features that share
         a boundary or share
         a node with neighboring features.
     buffer_tolerance {Linear Unit}:
         The distance between features to determine adjacency. Features that
         are within the buffer tolerance are considered adjacent features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetTerritoryLevelOptions_td(
                *gp_fixargs(
                    (
                        in_territory_solution,
                        level,
                        compactness,
                        fill_extent,
                        random_seed,
                        spatial_relationship,
                        buffer_tolerance,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SolveTerritories_td", None)
def SolveTerritories(
    in_territory_solution=None,
    level=None,
    method: Literal["USER_DEFINED", "PREFERRED", "OPTIMAL", "OPTIMAL_MAX_COVERAGE"] | None = None,
    number_territories=None,
    quality=None,
    iterations_limit=None,
    algorithm: Literal["CLASSIC", "GENETIC"] | None = None,
    candidate_solutions=None,
) -> Result1[str | Layer]:
    """SolveTerritories_td(in_territory_solution, level, method, {number_territories}, {quality}, {iterations_limit}, {algorithm}, {candidate_solutions})

       Solves the territory solution based on specified criteria such as
       attribute constraints or distance constraints.

    INPUTS:
     in_territory_solution (Group Layer / Feature Dataset / String):
         The territory solution that will be used to solve territories.
     level (String):
         The level that will be used to solve territories.
     method (String):
         Specifies the method that will be used when calculating the number of
         territories.USER_DEFINED-The number of territories will be defined by
         the
         number_territories parameter value. This is the default.PREFERRED-The
         number of territories will be defined by the
         number_territories parameter value, but only territories that meet the
         criteria of the constraints will be created.OPTIMAL-The number of
         territories will be calculated automatically.OPTIMAL_MAX_COVERAGE-The
         number of territories will be calculated
         automatically using a maximum coverage of the base features.
     number_territories {Long}:
         The number of territories to be specified.
     quality {Long}:
         An integer between 1 and 200 that determines the performance of a
         solve operation. A lower value will provide better performance but
         quality may be affected. The default value is 100.
     iterations_limit {Long}:
         The number of times the territory search process will be repeated. For
         larger datasets, increasing the number is recommended to find an
         optimal solution. The default value is 50.
     algorithm {String}:
         Specifies the algorithm that will be used to solve the territory
         solution.CLASSIC-The original algorithm will be used to solve the
         territory
         solution. This is the default.GENETIC-A newer and more modern
         algorithm based on a genetic growth
         algorithm will be used to solve the territory solution.
     candidate_solutions {Long}:
         The number of possible solutions. For larger datasets, increasing this
         number will increase the search space and the probability of finding a
         better solution. The default is 10 and must be greater than 1. This
         parameter is only used when the algorithm parameter is set to GENETIC."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SolveTerritories_td(
                *gp_fixargs(
                    (
                        in_territory_solution,
                        level,
                        method,
                        number_territories,
                        quality,
                        iterations_limit,
                        algorithm,
                        candidate_solutions,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ValidateTerritories_td", None)
def ValidateTerritories(
    in_territory_solution=None,
    level=None,
) -> Result1[str | Layer]:
    """ValidateTerritories_td(in_territory_solution, level)

       Validates a territory solution for invalid territories.

    INPUTS:
     in_territory_solution (Group Layer / Feature Dataset / String):
         The territory solution that will be validated.
     level (String):
         The level that will be analyzed in the validation."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ValidateTerritories_td(*gp_fixargs((in_territory_solution, level), True))
        )
        return retval
    except Exception as e:
        raise e


# Territory Solution toolset
@gptooldoc("AddTerritoryLevel_td", None)
def AddTerritoryLevel(
    in_territory_solution=None,
    level_name=None,
    default_territory_name=None,
    primary_feature_class: Literal["TERRITORY_BOUNDARIES", "TERRITORY_CENTERS", "BASE_BOUNDARIES", "BASE_CENTERS"]
    | None = None,
) -> Result1[str | Layer]:
    """AddTerritoryLevel_td(in_territory_solution, level_name, {default_territory_name}, {primary_feature_class})

       Creates a new empty feature class to represent a level.

    INPUTS:
     in_territory_solution (Group Layer / Feature Dataset / String):
         The input territory solution.
     level_name (String):
         The name of the new territory level.
     default_territory_name {String}:
         The name to be used as a prefix for new territories that will be
         created.
     primary_feature_class {String}:
         Specifies the class level that will be used for storing level
         attributes.TERRITORY_BOUNDARIES-Polygon features that represent the
         territory
         boundaries.TERRITORY_CENTERS-Point features that represent the
         territory
         centers.BASE_BOUNDARIES-Polygon features that represent the base-level
         feature
         boundaries.BASE_CENTERS-Point features that represent the base-level
         feature
         centers."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddTerritoryLevel_td(
                *gp_fixargs((in_territory_solution, level_name, default_territory_name, primary_feature_class), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CopyTerritorySolution_td", None)
def CopyTerritorySolution(
    in_territory_solution=None,
    target_gdb=None,
    territory_solution_name=None,
) -> Result1[str | Layer]:
    """CopyTerritorySolution_td(in_territory_solution, target_gdb, territory_solution_name)

       Creates a copy of a territory solution.

    INPUTS:
     in_territory_solution (Group Layer / Feature Dataset / String):
         The input territory solution.
     target_gdb (Workspace):
         The location of the output geodatabase.
     territory_solution_name (String):
         The name of the copied territory solution"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CopyTerritorySolution_td(*gp_fixargs((in_territory_solution, target_gdb, territory_solution_name), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateTerritoryLevelFeatureClasses_td", None)
def CreateTerritoryLevelFeatureClasses(
    in_territory_solution=None,
    level=None,
    feature_classes: list[
        Literal[
            "TERRITORY_BOUNDARIES",
            "TERRITORY_CENTERS",
            "BASE_BOUNDARIES",
            "BASE_CENTERS",
            "SEED_POINTS",
            "LINE_BARRIERS",
            "POLYGON_BARRIERS",
            "RESTRICTED_AREAS",
        ]
    ]
    | Literal[
        "TERRITORY_BOUNDARIES",
        "TERRITORY_CENTERS",
        "BASE_BOUNDARIES",
        "BASE_CENTERS",
        "SEED_POINTS",
        "LINE_BARRIERS",
        "POLYGON_BARRIERS",
        "RESTRICTED_AREAS",
    ]
    | str
    | None = None,
) -> Result1[str | Layer]:
    """CreateTerritoryLevelFeatureClasses_td(in_territory_solution, level, feature_classes;feature_classes...)

       Creates feature classes for a specified territory level.

    INPUTS:
     in_territory_solution (Group Layer / Feature Dataset / String):
         The Territory Design solution layer that will be used in the analysis.
     level (String):
         The level to which the feature classes will be added.
     feature_classes (String):
         Specifies the feature classes that will be created at the specified
         level parameter value.TERRITORY_BOUNDARIES-Polygon features that
         represent the territory
         boundaries will be created.TERRITORY_CENTERS-Point features that
         represent the territory centers
         will be created.BASE_BOUNDARIES-Polygon features that represent the
         base boundaries
         will be created.BASE_CENTERS-Point features that represent the base
         centers will be
         created.LINE_BARRIERS-Line features that restrict traversal across a
         line will
         be created.SEED_POINTS-Point features from which territories are
         derived will be
         created.RESTRICTED_AREAS-Polygon features that prevent the creation of
         territories will be created.POLYGON_BARRIERS-Polygon features that
         restrict traversal across a
         polygon will be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateTerritoryLevelFeatureClasses_td(*gp_fixargs((in_territory_solution, level, feature_classes), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateTerritorySolution_td", None)
def CreateTerritorySolution(
    in_features=None,
    solution_name=None,
    id_field=None,
    name_field=None,
    territory_level_name=None,
    default_territory_name=None,
    in_boundary_mask=None,
) -> Result1[str | Layer]:
    """CreateTerritorySolution_td(in_features, solution_name, {id_field}, {name_field}, {territory_level_name}, {default_territory_name}, {in_boundary_mask})

       Creates a new territory solution with two levels and loads input
       features into the base level.

    INPUTS:
     in_features (Feature Layer):
         The geometry or data features that will be used as the base level of
         the created solution. The level will have the same name as the input
         features.
     solution_name (String):
         The name of the territory solution to be created.
     id_field {Field}:
         The field that contains ID values for objects in the level.
     name_field {Field}:
         The field that contains name values for objects in the level.
     territory_level_name {String}:
         The name of the territory level-for example, level 2.
     default_territory_name {String}:
         The prefix for the names of the new territories that will be
         created-for example, Territory 1, Territory 2, and Territory 3 or
         District 1, District 2, and District 3.
     in_boundary_mask {Feature Layer}:
         The layer that is used as a mask to limit the growth of point-based
         layers."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateTerritorySolution_td(
                *gp_fixargs(
                    (
                        in_features,
                        solution_name,
                        id_field,
                        name_field,
                        territory_level_name,
                        default_territory_name,
                        in_boundary_mask,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportTerritorySolution_td", None)
def ExportTerritorySolution(
    in_territory_solution=None,
    out_feature_class=None,
    output_geometry_type: Literal["TERRITORY_BOUNDARIES", "TERRITORY_CENTERS"] | None = None,
) -> Result1[str]:
    """ExportTerritorySolution_td(in_territory_solution, out_feature_class, {output_geometry_type})

       Exports a territory solution to a feature class. The export includes
       records from all levels (hierarchy) of the solution.

    INPUTS:
     in_territory_solution (Group Layer / Feature Dataset / String):
         The Territory Design solution layer that will be exported.
     output_geometry_type {String}:
         Specifies the feature geometry type to
         export.TERRITORY_BOUNDARIES-Polygon features that represent the
         territory
         boundaries will be exported.TERRITORY_CENTERS-Point features that
         represent the territory centers
         will be exported.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will contain the exported territory solution."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportTerritorySolution_td(
                *gp_fixargs((in_territory_solution, out_feature_class, output_geometry_type), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateTerritoryReport_td", None)
def GenerateTerritoryReport(
    in_territory_solution=None,
    level: Literal["ALL_LEVELS"] | None = None,
    report_type: Literal["TERRITORY_SUMMARY", "COMPARE_TERRITORIES", "REALIGNMENT", "REALIGNMENT_DETAILED"]
    | None = None,
    report_folder=None,
    report_title=None,
    report_format: list[Literal["PDF", "XLSX", "HTML", "ZIP", "CSV"]]
    | Literal["PDF", "XLSX", "HTML", "ZIP", "CSV"]
    | str
    | None = None,
    comparison_territory_solution=None,
    comparison_level: Literal["ALL_LEVELS"] | None = None,
) -> Result1[str]:
    """GenerateTerritoryReport_td(in_territory_solution, level, {report_type}, {report_folder}, {report_title}, {report_format;report_format...}, {comparison_territory_solution}, {comparison_level})

       Creates a summary report of a territory solution or a comparison
       report of two solutions.

    INPUTS:
     in_territory_solution (Group Layer / Feature Dataset / String):
         The input territory solution for the report.
     level (String):
         Specifies the territory level that will be used to create the
         report.ALL_LEVELS-All territory levels will appear in the report.
     report_type {String}:
         Specifies the type of report that will be
         generated.TERRITORY_SUMMARY-The report will contain a summary of a
         territory
         solution, such as hierarchy and statistics. This is the
         default.COMPARE_TERRITORIES-The report will compare two territory
         solutions.REALIGNMENT-The report will contain a summary realignment
         report for
         the territories.REALIGNMENT_DETAILED-The report will contain a list
         of the reassigned
         features.
     report_folder {Folder}:
         The output location where the report will be saved.
     report_title {String}:
         The title of the report.
     report_format {String}:
         Specifies the format of the output report.PDF-The report will be in
         PDF format. This is the default.XLSX-The
         report will be in XLSX format.HTML-The report will be in HTML
         format.ZIP-The report will be in ZIP format.CSV-The report will be in
         CSV format.
     comparison_territory_solution {Group Layer / Feature Dataset / String}:
         The territory solution for the comparison report.
     comparison_level {String}:
         Specifies the territory level that will be used for the comparison or
         realignment report.ALL_LEVELS-All territory levels will be used for
         the comparison or
         realignment report."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateTerritoryReport_td(
                *gp_fixargs(
                    (
                        in_territory_solution,
                        level,
                        report_type,
                        report_folder,
                        report_title,
                        report_format,
                        comparison_territory_solution,
                        comparison_level,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportTerritorySolution_td", None)
def ImportTerritorySolution(
    in_data=None,
    solution_name=None,
    level_settings=None,
) -> Result1[str | Layer]:
    """ImportTerritorySolution_td(in_data, solution_name, level_settings;level_settings...)

       Creates a new territory solution and imports the territories hierarchy
       from a table or a layer.

    INPUTS:
     in_data (Table View):
         The layer or records to be imported.
     solution_name (String):
         The name of the territory solution to be created.
     level_settings (Value Table):
         The level settings for importing the territories
         hierarchy.level_name-The name of the level
         (required).default_territory_name-The
         prefix for the new territories that will,
         subsequently, be created at the level (optional).id_field-The field
         that contains IDs (unique IDs) for territories
         (required).name_field-The field that contains names for territories
         (optional).parent_id_field-The field that contains IDs of parent
         territories
         (optional). primary_feature_class-Specifies the class level
         that will be
         used for storing level attributes (optional).
         TERRITORY_BOUNDARIES-Level attributes will be stored using the
         boundaries of the territory solution.TERRITORY_CENTERS-Level
         attributes will be stored using the boundary
         centers of the territory solution.BASE_BOUNDARIES-Level attributes
         will be stored using the boundaries
         of the base layer.BASE_CENTERS-Level attributes will be stored using
         the boundary
         centers of the base layer."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportTerritorySolution_td(*gp_fixargs((in_data, solution_name, level_settings), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("LoadTerritoryRecords_td", None)
def LoadTerritoryRecords(
    in_territory_solution=None,
    level=None,
    in_data=None,
    id_field=None,
    name_field=None,
    field_map=None,
    append_data: Literal["APPEND", "REPLACE"] | None = None,
) -> Result1[str | Layer]:
    """LoadTerritoryRecords_td(in_territory_solution, level, in_data, {id_field}, {name_field}, {field_map;field_map...}, {append_data})

       Adds records (features) or updates existing records for the specified
       level.

    INPUTS:
     in_territory_solution (Group Layer / Feature Dataset / String):
         The name of the input territory solution.
     level (String):
         The name of the level to which the data will be loaded.
     in_data (Table View):
         The layer or records to be loaded.
     id_field {Field}:
         The field containing the ID values to be loaded into the level.
     name_field {Field}:
         The field containing the name values to be loaded into the level.
     field_map {Value Table}:
         The values for the territory properties.parent_territory_id-The ID of
         the parent territory.locked_state-The
         territory can't be modified.center_locked-Center points can't be
         modified and will remain in their
         fixed locations.
     append_data {Boolean}:
         Specifies whether the records being loaded will be appended or
         replaced.APPEND-The records being loaded to the specified level will
         be
         appended.REPLACE-The records being loaded to the specified level will
         be
         replaced. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LoadTerritoryRecords_td(
                *gp_fixargs((in_territory_solution, level, in_data, id_field, name_field, field_map, append_data), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeTerritorySolutionLayer_td", None)
def MakeTerritorySolutionLayer(
    in_territory_dataset=None,
    out_territory_solution=None,
) -> Result1[str | Layer]:
    """MakeTerritorySolutionLayer_td(in_territory_dataset, out_territory_solution)

       Creates a group layer that represents a territory solution from an
       existing territory solution dataset.

    INPUTS:
     in_territory_dataset (Feature Dataset / String):
         The input territory solution.

    OUTPUTS:
     out_territory_solution (Group Layer):
         The output territory solution group layer."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeTerritorySolutionLayer_td(*gp_fixargs((in_territory_dataset, out_territory_solution), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RebuildTerritorySolution_td", None)
def RebuildTerritorySolution(
    in_territory_solution=None,
    in_boundary_mask=None,
) -> Result1[str | Layer]:
    """RebuildTerritorySolution_td(in_territory_solution, {in_boundary_mask})

       Updates the territory solution to reflect changes made to the base
       level.

    INPUTS:
     in_territory_solution (Group Layer / Feature Dataset / String):
         The input territory solution.
     in_boundary_mask {Feature Layer}:
         The layer that is used as a mask to limit the growth of point-based
         layers."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RebuildTerritorySolution_td(*gp_fixargs((in_territory_solution, in_boundary_mask), True))
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
