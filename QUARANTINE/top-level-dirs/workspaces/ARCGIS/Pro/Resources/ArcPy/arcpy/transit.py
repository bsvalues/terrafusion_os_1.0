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
r"""The Public Transit toolbox contains tools for converting, displaying,
editing, and analyzing public transit data. Several tools convert
between General Transit Feed Specification (GTFS) datasets and feature
classes and tables. Other tools perform analysis using public transit
schedule data."""
from __future__ import annotations

__all__ = [
    "CalculateTransitServiceFrequency",
    "ConnectPublicTransitDataModelToStreets",
    "FeaturesToGTFSShapes",
    "FeaturesToGTFSStops",
    "GenerateShapesFeaturesFromGTFS",
    "GTFSShapesToFeatures",
    "GTFSStopsToFeatures",
    "GTFSToPublicTransitDataModel",
]
__alias__ = "transit"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Analysis toolset
@gptooldoc("CalculateTransitServiceFrequency_transit", None)
def CalculateTransitServiceFrequency(
    in_transit_feature_dataset=None,
    analysis_type: Literal["STOPS", "LINES", "POINTS_OF_INTEREST", "AREAS"] | None = None,
    out_feature_class=None,
    time_windows=None,
    separate_counts_by_line: Literal["SEPARATE", "NO_SEPARATE"] | None = None,
    in_points_of_interest=None,
    network_data_source=None,
    travel_mode=None,
    travel_limit=None,
    travel_limit_units: Literal[
        "KILOMETERS",
        "METERS",
        "MILES",
        "YARDS",
        "FEET",
        "NAUTICALMILES",
        "DAYS",
        "HOURS",
        "MINUTES",
        "SECONDS",
        "UNKNOWN",
    ]
    | None = None,
    cell_size=None,
    barriers=None,
    wheelchair: Literal["WHEELCHAIR", "NO_WHEELCHAIR"] | None = None,
    bicycle: Literal["BICYCLE", "NO_BICYCLE"] | None = None,
    exclude_modes=None,
    line_shape_type: Literal["CARTOGRAPHIC_LINES", "STRAIGHT_LINES"] | None = None,
) -> Result1[str]:
    """CalculateTransitServiceFrequency_transit(in_transit_feature_dataset, analysis_type, out_feature_class, time_windows;time_windows..., {separate_counts_by_line}, {in_points_of_interest}, {network_data_source}, {travel_mode}, {travel_limit}, {travel_limit_units}, {cell_size}, {barriers;barriers...}, {wheelchair}, {bicycle}, {exclude_modes;exclude_modes...}, {line_shape_type})

       Calculates the frequency of scheduled public transit service available
       within one or more specified time windows at public transit stops,
       along public transit lines, at points of interest, or in areas.

    INPUTS:
     in_transit_feature_dataset (Feature Dataset):
         A feature dataset containing the Stops, LineVariantElements, and,
         optionally, LVEShapes feature classes from the Network Analyst public
         transit data model. The feature dataset's parent geodatabase must
         contain the public transit data model's Lines, LineVariants,
         Schedules, ScheduleElements, and Runs tables, as well as either the
         Calendars or CalendarExceptions table, or both.A valid feature dataset
         with its associated feature classes and tables
         can be created from General Transit Feed Specification (GTFS) public
         transit data using the GTFS To Public Transit Data Model tool.
     analysis_type (String):
         Specifies the location type for which the tool will calculate the
         frequency of public transit service.STOPS-The frequency of public
         transit service at public transit stops
         will be calculated. The output will be a feature class containing a
         copy of the public transit stops from the input public transit data
         model's Stops feature class.LINES-The frequency of public transit
         service along public transit
         lines will be calculated. The output will be a feature class
         containing a copy of the public transit lines from the input public
         transit data model's LineVariantElements or LVEShapes feature class,
         depending on the line shape type selected.POINTS_OF_INTEREST-The
         frequency of public transit service at
         specified points of interest will be calculated. The output will be a
         copy of the input points of interest.AREAS-The frequency of public
         transit service for all areas within
         range of all public transit stops will be calculated. The output will
         be a polygon feature class representing the area served by the public
         transit system.
     time_windows (Value Table):
         The periods of time for which public transit service frequency will be
         calculated. Multiple time windows can be specified. The output
         feature
         class will include a set of fields representing the transit frequency
         statistics for each time window. These fields will be prefixed by the
         value specified in thecolumn. Output Field Prefix        Time
         windows can be interpreted either as specific dates or as
         generic weekdays. Thecolumn determines whether the date component of
         thecolumn will be interpreted as an exact date or as a generic
         weekday. For example, if the date component of thevalue is December
         25, 2021, andis True, the exact date will be used, and the public
         transit service frequency calculated will include any special service
         added or removed for the Christmas holiday. Ifis False, this date will
         be interpreted as Saturday, and the public transit service frequency
         calculated will include regular service for any typical Saturday.
         Use Specific DateStart DatetimeStart DatetimeUse Specific DateUse
         Specific DateFor specific dates, all exceptions to the regular public
         transit
         service included in the CalendarExceptions table and the date range
         defined in the Calendars table will be considered. For a generic
         weekday, only regular service defined in the weekday fields in the
         Calendars table will be considered.Use Specific Date-A Boolean value
         indicating whether the time window's
         date will be interpreted as the exact date specified (True) or the
         generic weekday represented by the date (False).Start Datetime-The
         date and time the time window begins.Duration (minutes)-The duration
         of the time window in minutes. Count Arrivals or
         Departures-Count arrivals or departures at
         public transit stops when calculating transit frequency statistics.
         ARRIVALS-Arrivals at public transit stops will be counted. The arrival
         times will be considered in the calculations.DEPARTURES-Departures
         from public transit stops will be counted. The
         departure times will be considered in the calculations.Output Field
         Prefix-A string prefix that will be included in the names
         of all output fields associated with this time window. String prefixes
         must be unique and must contain only characters valid for field names
         in the output feature class.
     separate_counts_by_line {Boolean}:
         Specifies whether service from multiple transit lines using the same
         stop or corridor will be separated by transit line or combined when
         calculating transit frequency statistics.When separated by transit
         line, the output will contain a copy of each
         stop or transit line segment for each unique transit line using the
         stop or corridor, and these duplicated features will have overlapping
         geometry. If the LineVariants table in the input data has the
         optionalfield, the output will additionally separate counts by
         thefield value. For example, if a stop serves both directions of
         travel along the same line, the output will contain a copy of the stop
         for each direction of travel as defined by thefield.
         GDirectionIDGDirectionIDGDirectionIDSEPARATE-Multiple transit lines
         serving the same stop or corridor will
         be counted separately when calculating transit frequency
         statistics.NO_SEPARATE-Multiple transit lines serving the same stop or
         corridor
         will not be counted separately when calculating transit frequency
         statistics; they will be combined. This is the default.This parameter
         only applies when the analysis_type parameter is set to
         STOPS or LINES.
     in_points_of_interest {Feature Layer}:
         The points of interest for which the frequency of available public
         transit service will be calculated.If a polygon layer is specified,
         the public transit service available
         at the polygon centroids will be used.This parameter is required when
         the analysis_type parameter is set to
         POINTS_OF_INTEREST; otherwise, it is ignored.
     network_data_source {Network Data Source}:
         The network dataset or service that will be used to determine the
         public transit stops within range of the designated points of interest
         or to calculate the polygon areas within range of public transit
         stops. You can use a catalog path to a network dataset, a network
         dataset layer object, the string name of the network dataset layer, or
         a portal URL for a network analysis service. The network must have at
         least one travel mode.To use a portal URL, you must be signed in to
         the portal with an
         account that has routing privileges.Running the tool will consume
         credits if you use ArcGIS Online as the
         network data source.Use a network dataset appropriate for modeling
         passengers traveling to
         and from public transit stops. Don't use a network dataset configured
         to use public transit data with the Public Transit evaluator because
         this type of network models passengers riding public transit, not
         people traveling to and from the public transit stops.This parameter
         is required when the analysis_type parameter is set to
         POINTS_OF_INTEREST or AREAS; otherwise, it is ignored.
     travel_mode {Network Travel Mode}:
         The travel mode on the network data source that will be used to
         determine the public transit stops within range of the designated
         points of interest or to calculate the polygon areas within range of
         public transit stops. You can specify the travel mode as a string name
         of the travel mode or as an arcpy.nax.TravelMode object.Use the travel
         mode most appropriate for modeling passengers traveling
         to and from public transit stops. Typically, a travel mode that models
         walking time or distance should be used.Do not use a travel mode with
         an impedance attribute that uses the
         Public Transit evaluator because that travel mode models passengers
         riding public transit, not passengers traveling to and from the public
         transit stops.This parameter is required when the analysis_type
         parameter is set to
         POINTS_OF_INTEREST or AREAS; otherwise, it is ignored.
     travel_limit {Double}:
         The impedance limit that will be used when finding the public transit
         stops within range of points of interest or when calculating the area
         reachable from public transit stops.Provide this parameter value in
         the units designated in the
         travel_limit_units parameter.This parameter is required when the
         analysis_type parameter is set to
         POINTS_OF_INTEREST or AREAS; otherwise, it is ignored.
     travel_limit_units {String}:
         Specifies the units that will be used for the impedance limit provided
         in the travel_limit parameter.The available units depend on the value
         specified in the travel_mode
         parameter. If the travel mode's impedance has units of time, only
         time-based units will be available. If the travel mode's impedance has
         units of distance, only distance-based units will be available. If the
         travel mode's impedance units are neither time based nor distance
         based, the only option available will be unknown units, and the
         travel_limit parameter value will be in the units of the travel mode's
         impedance.KILOMETERS-The impedance limit will be in
         kilometers.METERS-The
         impedance limit will be in meters.MILES-The impedance limit will be in
         miles.YARDS-The impedance limit will be in yards.FEET-The impedance
         limit will be in feet.NAUTICALMILES-The impedance limit will be in
         nautical miles.DAYS-The impedance limit will be in days.HOURS-The
         impedance limit will be in hours.MINUTES-The impedance limit will be
         in minutes.SECONDS-The impedance limit will be in seconds.UNKNOWN-The
         impedance limit will be in the impedance unit of the
         travel mode provided.This parameter is required when the analysis_type
         parameter is set to
         POINTS_OF_INTEREST or AREAS; otherwise, it is ignored.It is
         recommended that you use a distance-based travel limit when
         calculating public transit service frequency for points of interest.
         With a distance-based limit, the tool can reduce the OD cost matrix
         size in advance using a simple straight-line distance selection. This
         may eliminate some origins and destinations from the OD cost matrix
         analysis and improve performance. If the network data source is a
         service that charges credits, this optimization also reduces the
         number of credits needed.
     cell_size {Linear Unit}:
         The size (edge length) of cells that will be used to represent the
         area reachable from transit stops in the tool output. The numerical
         value and the units are set using this parameter.When calculating the
         area reachable from public transit stops, a
         service area is calculated. The resulting service area polygons, which
         often overlap, are simplified into a raster-like polygon feature class
         composed of square cells of the size specified in this parameter. The
         public transit service frequency statistics are calculated for each of
         these cells based on the public transit stops whose service area
         polygons overlap the cell centroid.Use a cell size relevant to how
         pedestrians travel in the real world.
         For example, you can base the cell size on the size of city blocks or
         parcels or the distance a pedestrian can walk in less than a minute.
         Smaller cells are more accurate but take longer to process.The default
         is 80 meters.This parameter is required when the analysis_type
         parameter is set to
         AREAS; otherwise, it is ignored.
     barriers {Feature Layer}:
         The point, line, or polygon features that will be used as barriers in
         the network analysis when calculating the public transit stops within
         range of the designated points of interest or when calculating the
         polygon areas within range of public transit stops.This parameter is
         relevant only when the analysis_type parameter is
         set to POINTS_OF_INTEREST or AREAS; otherwise, it is ignored.
     wheelchair {Boolean}:
         Specifies whether travel with a wheelchair will be modeled, excluding
         transit service that is not wheelchair accessible, when calculating
         transit frequency statistics. When modeling travel with a
         wheelchair, transit service with a
         value of 2 in thefield in the Runs table will be excluded. If the Runs
         table does not have this field, no transit runs will be excluded.
         GWheelchairAccessible        When modeling travel with a wheelchair
         when the analysis_type
         parameter is set to POINTS_OF_INTEREST, transit stops with a value of
         2 in thefield in the Stops feature class will be excluded. When the
         analysis_type parameter is set to STOPS or AREAS, transit stops with a
         value of 2 in thefield in the Stops feature class will be included in
         the analysis but will be considered to have no service because they
         are not accessible. If the Stops table does not have this field, no
         transit stops will be considered inaccessible.
         GWheelchairAccessibleGWheelchairAccessibleWHEELCHAIR-Traveling with a
         wheelchair will be modeled. Transit
         service that is not wheelchair accessible will be excluded when
         calculating transit frequency statistics.NO_WHEELCHAIR-Traveling with
         a wheelchair will not be modeled. Transit
         service that is not wheelchair accessible will not be excluded when
         calculating transit frequency statistics. This is the default.
     bicycle {Boolean}:
         Specifies whether travel with a bicycle will be modeled, excluding
         transit service on which bicycles are not allowed, when calculating
         transit frequency statistics. When modeling travel with a
         bicycle, transit service with a
         value of 2 in thefield in the Runs table will be excluded. If the Runs
         table does not have this field, no transit service will be excluded.
         GBikesAllowedBICYCLE-Traveling with a bicycle will be modeled. Transit
         service that
         does not allow bicycles will be excluded when calculating transit
         frequency statistics.NO_BICYCLE-Traveling with a bicycle will not be
         modeled. Transit
         service that does not allow bicycles will not be excluded when
         calculating transit frequency statistics. This is the default.
     exclude_modes {Long}:
         Modes of public transit that will be excluded when calculating
         transit frequency statistics. Provide excluded modes as integers
         corresponding to thefield in the Lines table. GRouteType
     line_shape_type {String}:
         Specifies how the output transit lines will be represented in the map
         when the analysis_type parameter is set to LINES.The numerical values
         in the output fields will be the same regardless
         of the option specified. This parameter affects only the geometry of
         the output features. CARTOGRAPHIC_LINES-The output feature
         class will be a copy of
         the Network Analyst public transit data model's LVEShapes feature
         class. The transit lines in this feature class are cartographic
         representations of the actual geographic paths taken by buses, trains,
         or other public transit vehicles and are intended to be used for
         visualization. Some features may still overlap. This option cannot be
         used if the LVEShapes feature class is not present or the
         LineVariantElements feature class does not have thefield. The
         LineVariantElements feature's geometry will be used in the output for
         any features in the LineVariantElements feature class with null or
         invalidfield values. LVEShapeIDLVEShapeIDSTRAIGHT_LINES-The
         output feature class will be a copy of the Network
         Analyst public transit data model's LineVariantElements feature class.
         The transit lines in this feature class will not represent the actual
         geographic paths taken by buses, trains, or other public transit
         vehicles but are instead representative of logical connections between
         stops in the transit system. If this feature class is generated by the
         GTFS To Public Transit Data Model tool, these features will be
         straight lines connecting stops and will not follow the underlying
         street features. Consequently, the output may not be suitable for
         cartographic purposes, but the numerical values in the output fields
         are still accurate and valuable for analysis. This is the default.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class.A shapefile is not a valid value."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateTransitServiceFrequency_transit(
                *gp_fixargs(
                    (
                        in_transit_feature_dataset,
                        analysis_type,
                        out_feature_class,
                        time_windows,
                        separate_counts_by_line,
                        in_points_of_interest,
                        network_data_source,
                        travel_mode,
                        travel_limit,
                        travel_limit_units,
                        cell_size,
                        barriers,
                        wheelchair,
                        bicycle,
                        exclude_modes,
                        line_shape_type,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Conversion toolset
@gptooldoc("ConnectPublicTransitDataModelToStreets_transit", None)
def ConnectPublicTransitDataModelToStreets(
    target_feature_dataset=None,
    in_streets_features=None,
    search_distance=None,
    expression=None,
) -> Result:
    """ConnectPublicTransitDataModelToStreets_transit(target_feature_dataset, in_streets_features, search_distance, {expression})

       Connects transit stops to street features for use in a transit-enabled
       network dataset. This tool creates the StopsOnStreets and
       StopConnectors feature classes defined by the Network Analyst public
       transit data model and is intended to be run as part of a larger
       workflow for creating a transit-network dataset described in Create
       and use a network dataset with public transit data.

    INPUTS:
     target_feature_dataset (Feature Dataset):
         The feature dataset where the transit-enabled network dataset will be
         created. This feature dataset must already exist and contain a point
         feature class called Stops with the schema described by the Network
         Analyst public transit data model. A valid Stops feature class can be
         created with the GTFS To Network Dataset Transit Sources tool.
         The Stops feature class may be altered after running the tool.
         Stop features with avalue of 2, representing station entrances, may be
         deleted. These stop features will instead be included in the output
         StopsOnStreets feature class to model correct connections from the
         streets, through the station entrances, and to the stops. Parent
         stations that are spatially coincident with stops may also be deleted.
         GStopType
     in_streets_features (Feature Layer):
         A polyline feature class of streets to which transit stops and lines
         will connect. This streets feature class should be the same feature
         class you intend to use in the transit-enabled network dataset for
         modeling pedestrians walking along streets. The feature class does not
         need to be in the target feature dataset to run this tool; however,
         the feature class must be in the target feature dataset at the time
         you create the network dataset.The input streets features will be
         altered after running the tool.
         Vertices will be added at the locations where StopsOnStreets features
         intersect the streets. If you do not want the street data altered,
         make a copy of it before running this tool.
     search_distance (Linear Unit):
         The search distance for snapping transit stops to the input street
         features. Stops that are outside the search distance will not be
         snapped and will not be connected to the streets. A small search
         distance will ensure that stops do not snap to streets that are far
         away, but it increases the likelihood of stops failing to snap when
         they should. A large search distance increases the number of stops
         likely to snap but may lead to errors that should instead be corrected
         by editing the street data. If no street features are found within the
         search distance of a particular stop, the output StopsOnStreets
         feature will not be snapped to a street and will be coincident with
         its corresponding feature in Stops, which could lead to poor
         connectivity in the network dataset at that location.The default is
         100 meters.
     expression {SQL Expression}:
         An SQL expression used to select a subset of input street feature
         records. Transit stops will be snapped only to street features
         matching this expression. For example, the expression can be used to
         prevent stops from snapping to streets where pedestrian travel is
         prohibited."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConnectPublicTransitDataModelToStreets_transit(
                *gp_fixargs((target_feature_dataset, in_streets_features, search_distance, expression), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FeaturesToGTFSShapes_transit", None)
def FeaturesToGTFSShapes(
    in_shape_lines=None,
    in_shape_stops=None,
    in_gtfs_trips=None,
    in_gtfs_stop_times=None,
    out_gtfs_shapes=None,
    out_gtfs_stop_times=None,
    distance_units: Literal["MILES", "METERS", "KILOMETERS"] | None = None,
) -> Result2[str, str]:
    """FeaturesToGTFSShapes_transit(in_shape_lines, in_shape_stops, in_gtfs_trips, in_gtfs_stop_times, out_gtfs_shapes, out_gtfs_stop_times, {distance_units})

       Creates a shapes.txt file for a GTFS public transit dataset based on
       route line representations created by the Generate Shapes Features
       From GTFS tool.

    INPUTS:
     in_shape_lines (Feature Layer):
         A line feature class representing the GTFS shapes created by
         running the Generate Shapes Features From GTFS tool. The feature class
         must contain afield with values corresponding to thefield values in
         the other tool inputs. shape_idshape_id
     in_shape_stops (Feature Layer):
         A point feature class representing the GTFS stops associated with each
         shape created by running the Generate Shapes Features From GTFS tool.
         If a transit stop is used by multiple shapes, the stop should be
         duplicated in this feature class for each shape that uses it.
         The feature class must contain afield with values
         corresponding to thefield values in the other tool inputs. It must
         also contain afield with values corresponding to those in thecolumn of
         the input GTFS stop_times.txt file.
         shape_idshape_idstop_idshape_id
     in_gtfs_trips (File):
         The updated GTFS trips.txt file created by running the
         Generate Shapes Features From GTFS tool. This file must have thecolumn
         with values corresponding to those in thefields in the other tool
         inputs. shape_idshape_id
     in_gtfs_stop_times (File):
         The original stop_times.txt file from the GTFS dataset that was used
         when running the Generate Shapes Features From GTFS tool.
     distance_units {String}:
         Specifies the distance units to use when populating thefield
         in the output GTFS files. shape_dist_traveledMILES-The unit is
         miles. This is the default.METERS-The unit is
         metersKILOMETERS-The unit is kilometers

    OUTPUTS:
     out_gtfs_shapes (File):
         The output GTFS shapes.txt file.
     out_gtfs_stop_times (File):
         The output GTFS stop_times.txt file This file will contain
         thefield with values derived from the new shapes.
         shape_dist_traveled"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FeaturesToGTFSShapes_transit(
                *gp_fixargs(
                    (
                        in_shape_lines,
                        in_shape_stops,
                        in_gtfs_trips,
                        in_gtfs_stop_times,
                        out_gtfs_shapes,
                        out_gtfs_stop_times,
                        distance_units,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FeaturesToGTFSStops_transit", None)
def FeaturesToGTFSStops(
    in_features=None,
    out_gtfs_stops_file=None,
) -> Result1[str]:
    """FeaturesToGTFSStops_transit(in_features, out_gtfs_stops_file)

       Converts a feature class to a GTFS stops.txt file for a GTFS public
       transit dataset.

    INPUTS:
     in_features (Feature Layer):
         A point feature class containing transit stop geometries and
         at least the minimum required GTFS stops.txt file fields exceptand.
         stop_latstop_lon

    OUTPUTS:
     out_gtfs_stops_file (File):
         The output stops.txt file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FeaturesToGTFSStops_transit(*gp_fixargs((in_features, out_gtfs_stops_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GTFSShapesToFeatures_transit", None)
def GTFSShapesToFeatures(
    in_gtfs_shapes_file=None,
    out_feature_class=None,
) -> Result1[str]:
    """GTFSShapesToFeatures_transit(in_gtfs_shapes_file, out_feature_class)

       Converts a GTFS shapes.txt file from a GTFS public transit dataset to
       a polyline feature class showing the physical paths taken by vehicles
       in the public transit system.

    INPUTS:
     in_gtfs_shapes_file (File):
         A valid shapes.txt file from a GTFS dataset.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GTFSShapesToFeatures_transit(*gp_fixargs((in_gtfs_shapes_file, out_feature_class), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GTFSStopsToFeatures_transit", None)
def GTFSStopsToFeatures(
    in_gtfs_stops_file=None,
    out_feature_class=None,
) -> Result1[str]:
    """GTFSStopsToFeatures_transit(in_gtfs_stops_file, out_feature_class)

       Converts a GTFS stops.txt file from a GTFS public transit dataset to a
       feature class of public transit stops.

    INPUTS:
     in_gtfs_stops_file (File):
         A valid stops.txt file from a GTFS dataset.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GTFSStopsToFeatures_transit(*gp_fixargs((in_gtfs_stops_file, out_feature_class), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GTFSToPublicTransitDataModel_transit", None)
def GTFSToPublicTransitDataModel(
    in_gtfs_folders=None,
    target_feature_dataset=None,
    interpolate: Literal["INTERPOLATE", "NO_INTERPOLATE"] | None = None,
    append: Literal["APPEND", "NO_APPEND"] | None = None,
    make_lve_shapes: Literal["MAKE_LVESHAPES", "NO_MAKE_LVESHAPES"] | None = None,
) -> Result:
    """GTFSToPublicTransitDataModel_transit(in_gtfs_folders;in_gtfs_folders..., target_feature_dataset, {interpolate}, {append}, {make_lve_shapes})

       Converts one or more General Transit Feed Specification (GTFS) public
       transit datasets to a set of feature classes and tables that represent
       the transit stops, lines, and schedules in the format defined by the
       Network Analyst public transit data model.

    INPUTS:
     in_gtfs_folders (Folder):
         One or more folders containing valid GTFS data. Each folder must
         contain the GTFS stops.txt, routes.txt, trips.txt, and stop_times.txt
         files and either the calendar.txt or calendar_dates.txt file, or both.
     target_feature_dataset (Feature Dataset):
         The feature dataset where the transit-enabled network dataset will be
         created. The Stops, LineVariantElements, and LVEShapes feature classes
         created by this tool will be placed in this feature dataset, and the
         output tables created by this tool will be placed in this feature
         dataset's parent geodatabase.The feature dataset can be in a file
         geodatabase or an enterprise
         geodatabase and can have any spatial reference. If the target feature
         dataset is in an enterprise geodatabase, it must not be versioned. Do
         not include the target feature dataset in a geodatabase with an
         existing feature dataset containing public transit data model feature
         classes. Do not use a feature dataset in a mobile geodatabase if you
         intend to create a network dataset using the output.
     interpolate {Boolean}:
         Specifies whether blank values from theandfields in the GTFS
         stop_times.txt file will be interpolated when creating the public
         transit data model tables.
         arrival_timedeparture_timeINTERPOLATE-Blank values will be
         interpolated using simple linear
         interpolation. The original GTFS data will not be altered. If there
         are no blank values in the original data, no interpolation will
         occur.NO_INTERPOLATE-Blank values will not be interpolated. If blank
         values
         are found in the input GTFS data, the tool will issue a warning and
         will not process the GTFS dataset. This is the default.
     append {Boolean}:
         Specifies whether the input GTFS datasets will be appended to existing
         public transit data model feature classes and tables in the target
         feature dataset and its parent geodatabase.APPEND-Data will be
         appended to the existing feature classes and
         tables.NO_APPEND-Data will not be appended. Existing feature classes
         and
         tables will be overwritten. This is the default.
     make_lve_shapes {Boolean}:
         Specifies whether the LVEShapes feature class will be created using
         the shapes.txt file in the GTFS dataset.The LVEShapes feature class is
         not used by the network dataset for
         routing but can be used for improved output visualization with the
         Calculate Transit Service Frequency tool.MAKE_LVESHAPES-The LVEShapes
         feature class will be
         created.NO_MAKE_LVESHAPES-The LVEShapes feature class will be not be
         created.
         This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GTFSToPublicTransitDataModel_transit(
                *gp_fixargs((in_gtfs_folders, target_feature_dataset, interpolate, append, make_lve_shapes), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateShapesFeaturesFromGTFS_transit", None)
def GenerateShapesFeaturesFromGTFS(
    in_gtfs_folder=None,
    out_shape_lines=None,
    out_shape_stops=None,
    out_gtfs_trips=None,
    network_modes: list[Literal["0", "1", "2", "3", "4", "5", "6", "7", "11", "12", "OTHER"]]
    | Literal["0", "1", "2", "3", "4", "5", "6", "7", "11", "12", "OTHER"]
    | str
    | None = None,
    network_data_source=None,
    travel_mode=None,
    drive_side: Literal["LEFT", "RIGHT"] | None = None,
    bearing_tolerance=None,
    max_bearing_angle=None,
) -> Result3[str, str, str]:
    """GenerateShapesFeaturesFromGTFS_transit(in_gtfs_folder, out_shape_lines, out_shape_stops, out_gtfs_trips, {network_modes;network_modes...}, {network_data_source}, {travel_mode}, {drive_side}, {bearing_tolerance}, {max_bearing_angle})

       Generates an estimate of the paths traveled by the vehicles in a
       public transit system. The output from this tool can be used to
       generate a new shapes.txt file for a GTFS public transit dataset.

    INPUTS:
     in_gtfs_folder (Folder):
         A folder containing a valid GTFS dataset for which you want to create
         a new shapes.txt file. The folder must contain the GTFS stops.txt,
         trips.txt, routes.txt, and stop_times.txt files.
     network_modes {String}:
         Specifies the modes of transit for which line shapes will be generated
         along the road network rather than with straight lines. Shapes for all
         modes not selected will be generated using straight lines.You should
         typically select modes that run on streets, such as buses,
         since those modes are most accurately represented by the road network.
         Do not select modes that are not modeled by your road network. For
         example, unless your network explicitly models ferry lanes, don't use
         the network to represent the paths traveled by ferries. The
         modes are specified using the codes in the table below.
         These correspond to the valid GTFS routes.txt file'sfield values from
         the GTFS documentation. route_typeModes 3, 5, and 11 are used
         by default. 0-Tram, streetcar, light rail. This mode
         corresponds to
         GTFS0. route_type         1-Subway or metro. This mode
         corresponds to GTFS1.
         route_type         2-Rail. This mode corresponds to GTFS2.
         route_type         3-Bus. This mode corresponds to GTFS3.
         route_type         4-Ferry. This mode corresponds to GTFS4.
         route_type         5-Cable tram. This mode corresponds to GTFS5.
         route_type         6-Aerial lift, suspended cable car, gondola lift,
         aerial
         tramway. This mode corresponds to GTFS6. route_type         7-
         Funicular. This mode corresponds to GTFS7.
         route_type         11-Trolleybus. This mode corresponds to GTFS11.
         route_type         12-Monorail. This mode corresponds to GTFS12.
         route_typeOTHER-This option corresponds to any mode of public transit
         not
         encompassed by the other options.
     network_data_source {Network Data Source}:
         The network dataset or service that will be used for calculating route
         shapes along a road network. You can use a catalog path to a network
         dataset, a network dataset layer object, the string name of the
         network dataset layer, or a portal URL for a network analysis service.
         The network must have at least one travel mode.To use a portal URL,
         you must be signed in to the portal with an
         account that has routing privileges.Running the tool will consume
         credits if you use ArcGIS Online as the
         network data source.This parameter is required when any network modes
         are selected.The network dataset you choose should be appropriate for
         modeling
         transit vehicles, such as buses, driving on streets. Don't use a
         network dataset configured to use public transit data with the Public
         Transit evaluator because this type of network models passengers
         riding on public transit, not public transit vehicles driving on
         streets.
     travel_mode {Network Travel Mode}:
         The travel mode on the network data source that will be used when
         calculating route shapes along a road network. You can specify the
         travel mode as a string name of the travel mode or as an
         arcpy.nax.TravelMode object.Use the travel mode most appropriate for
         modeling vehicles in your
         transit system driving along the road network.This parameter is
         required when any network modes are selected.Do not use a travel mode
         with an impedance attribute that uses the
         Public Transit evaluator because that travel mode models passengers
         riding on public transit, not transit vehicles driving on streets.
     drive_side {String}:
         Specifies the side of the road on which vehicles drive in your transit
         system. This is used to ensure that stops are visited on the correct
         side of the road.LEFT-Vehicles drive on the left side of the
         road.RIGHT-Vehicles drive
         on the right side of the road. This is the
         default.
     bearing_tolerance {Double}:
         The maximum allowed angle between a transit vehicle's estimated
         direction of travel at a stop and the angle of the network edge where
         the stop could locate. If the angles differ by more than this value,
         it is assumed that this is not the correct network edge on which to
         locate the stop, and Network Analyst will continue searching other
         nearby network edges for a more appropriate edge.When calculating
         route shapes along a road network, bearing and
         bearing tolerance are used to more accurately locate transit stops
         along the road network. The transit vehicle's bearing is estimated at
         each stop based on the angles between the current stop and the
         previous and next stops along the transit route.Specify the value in
         units of degrees between 0 and 180. The default
         is 30.
     max_bearing_angle {Double}:
         The maximum allowable difference in bearing angle between the previous
         stop and the current stop and the current stop to the next stop.The
         transit vehicle's bearing is estimated at each stop based on the
         angles between the current stop and the previous and next stops along
         the transit route. When the transit route follows a relatively
         straight road, this angle is a good representation of the bearing.
         However, if the route goes around a corner, makes a U-turn, follows a
         twisty road, or diverts into a parking lot or side road, the average
         angle is not a good estimate of bearing and using this estimate can
         cause the stop to locate on the network far away from where it should
         and worsen the quality of the tool output.The tool will ignore the
         bearing estimate if the difference in angle
         from the previous stop to the current stop and the current stop to the
         next stop is greater than the value specified in this parameter. In
         this situation, the stop will revert to the normal network locating
         behavior and will snap to the closest nonrestricted network
         edge.Specify the value in units of degrees between 0 and 180. The
         default
         is 65.

    OUTPUTS:
     out_shape_lines (Feature Class):
         A line feature class representing the estimated route shapes
         calculated by this tool. Each line in the output represents a unique
         shape required for this GTFS dataset. You can edit the line geometry
         and use this feature class as input to the Features To GTFS Shapes
         tool.
     out_shape_stops (Feature Class):
         A point feature class of GTFS transit stops with an ID associating
         them with each shape line to be created by the tool. In cases where
         the same GTFS stop is visited by multiple shapes, this feature class
         will contain multiple copies of that stop, one for each shape with
         which it is associated. This feature class is useful with definition
         queries when editing one shape line at a time. Use this feature class
         as input to the Features To GTFS Shapes tool.This output feature class
         is not equivalent to the output of the GTFS
         Stops To Features tool. That tool produces a feature class of the GTFS
         stops exactly as they are in the original dataset; this tool may
         produce multiple copies of each stop to associate them with different
         shapes. Use this output feature class in conjunction with the other
         outputs of the Generate Shapes Features From GTFS tool to create a
         shapes.txt file.
     out_gtfs_trips (File):
         The output GTFS trips.txt file. This file will be equivalent
         to the trips.txt file in the input GTFS folder but will include
         thefield added and populated with values corresponding to thefield in
         thefeature class. shape_idshape_idOutput Transit Shape Lines"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateShapesFeaturesFromGTFS_transit(
                *gp_fixargs(
                    (
                        in_gtfs_folder,
                        out_shape_lines,
                        out_shape_stops,
                        out_gtfs_trips,
                        network_modes,
                        network_data_source,
                        travel_mode,
                        drive_side,
                        bearing_tolerance,
                        max_bearing_angle,
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
