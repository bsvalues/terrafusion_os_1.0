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
r"""The Conversion toolbox contains tools that convert data between
various formats."""
from __future__ import annotations

__all__ = [
    "AddCADFields",
    "AddRasterToGeoPackage",
    "ASCIIToRaster",
    "BIMFileToGeodatabase",
    "CADToGeodatabase",
    "ConnectNetworkDatasetTransitSourcesToStreets",
    "ConvertLas",
    "DEMToRaster",
    "ExcelToTable",
    "ExportCAD",
    "ExportFeatures",
    "ExportTable",
    "ExtractBIMFileFloorplan",
    "ExtractLocationsDocument",
    "ExtractLocationsText",
    "FeatureClassToFeatureClass",
    "FeatureClassToGeodatabase",
    "FeatureClassToShapefile",
    "FeaturesToGPX",
    "FeaturesToGraphics",
    "FeaturesToGTFSShapes",
    "FeaturesToGTFSStops",
    "FeaturesToJSON",
    "FeatureToRaster",
    "FloatToRaster",
    "GenerateShapesFeaturesFromGTFS",
    "GPXtoFeatures",
    "GraphicsToFeatures",
    "GTFSShapesToFeatures",
    "GTFSStopsToFeatures",
    "GTFSToNetworkDatasetTransitSources",
    "JSONToFeatures",
    "KMLToLayer",
    "LasDatasetToRaster",
    "LayerToKML",
    "MapToKML",
    "MeshToLAS",
    "MobileGdbToFileGdb",
    "MultipatchToCollada",
    "MultipatchToRaster",
    "PDFToTIFF",
    "PointCloudToRaster",
    "PointToRaster",
    "PolygonToRaster",
    "PolylineToRaster",
    "RasterToASCII",
    "RasterToFloat",
    "RasterToGeodatabase",
    "RasterToOtherFormat",
    "RasterToPoint",
    "RasterToPolygon",
    "RasterToPolyline",
    "SASToTable",
    "TableToDBASE",
    "TableToExcel",
    "TableToGeodatabase",
    "TableToSAS",
    "TableToTable",
    "WFSToFeatureClass",
]
__alias__ = "conversion"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Tools
@gptooldoc("ConnectNetworkDatasetTransitSourcesToStreets_conversion", None)
def ConnectNetworkDatasetTransitSourcesToStreets(
    target_feature_dataset=None,
    in_streets_features=None,
    search_distance=None,
    expression=None,
) -> Result:
    """ConnectNetworkDatasetTransitSourcesToStreets_conversion(target_feature_dataset, in_streets_features, search_distance, {expression})

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
         class you intend to use in your transit-enabled network dataset for
         modeling pedestrians walking along streets. The feature class does not
         need to be in the target feature dataset to run this tool; however,
         the feature class must be in the target feature dataset at the time
         you create the network dataset.The input streets features will be
         altered after running the tool.
         Vertices will be added at the locations where StopsOnStreets features
         intersect the streets. If you do not want your street data altered,
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
            gp.ConnectNetworkDatasetTransitSourcesToStreets_conversion(
                *gp_fixargs((target_feature_dataset, in_streets_features, search_distance, expression), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FeaturesToGTFSShapes_conversion", None)
def FeaturesToGTFSShapes(
    in_shape_lines=None,
    in_shape_stops=None,
    in_gtfs_trips=None,
    in_gtfs_stop_times=None,
    out_gtfs_shapes=None,
    out_gtfs_stop_times=None,
    distance_units: Literal["MILES", "METERS", "KILOMETERS"] | None = None,
) -> Result2[str, str]:
    """FeaturesToGTFSShapes_conversion(in_shape_lines, in_shape_stops, in_gtfs_trips, in_gtfs_stop_times, out_gtfs_shapes, out_gtfs_stop_times, {distance_units})

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
            gp.FeaturesToGTFSShapes_conversion(
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


@gptooldoc("FeaturesToGTFSStops_conversion", None)
def FeaturesToGTFSStops(
    in_features=None,
    out_gtfs_stops_file=None,
) -> Result1[str]:
    """FeaturesToGTFSStops_conversion(in_features, out_gtfs_stops_file)

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
            gp.FeaturesToGTFSStops_conversion(*gp_fixargs((in_features, out_gtfs_stops_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GTFSShapesToFeatures_conversion", None)
def GTFSShapesToFeatures(
    in_gtfs_shapes_file=None,
    out_feature_class=None,
) -> Result1[str]:
    """GTFSShapesToFeatures_conversion(in_gtfs_shapes_file, out_feature_class)

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
            gp.GTFSShapesToFeatures_conversion(*gp_fixargs((in_gtfs_shapes_file, out_feature_class), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GTFSStopsToFeatures_conversion", None)
def GTFSStopsToFeatures(
    in_gtfs_stops_file=None,
    out_feature_class=None,
) -> Result1[str]:
    """GTFSStopsToFeatures_conversion(in_gtfs_stops_file, out_feature_class)

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
            gp.GTFSStopsToFeatures_conversion(*gp_fixargs((in_gtfs_stops_file, out_feature_class), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GTFSToNetworkDatasetTransitSources_conversion", None)
def GTFSToNetworkDatasetTransitSources(
    in_gtfs_folders=None,
    target_feature_dataset=None,
    interpolate: Literal["INTERPOLATE", "NO_INTERPOLATE"] | None = None,
    append: Literal["APPEND", "NO_APPEND"] | None = None,
    make_lve_shapes: Literal["MAKE_LVESHAPES", "NO_MAKE_LVESHAPES"] | None = None,
) -> Result:
    """GTFSToNetworkDatasetTransitSources_conversion(in_gtfs_folders;in_gtfs_folders..., target_feature_dataset, {interpolate}, {append}, {make_lve_shapes})

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
         tables.NO_APPEND-Existing feature classes and tables will be
         overwritten.
         This is the default.
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
            gp.GTFSToNetworkDatasetTransitSources_conversion(
                *gp_fixargs((in_gtfs_folders, target_feature_dataset, interpolate, append, make_lve_shapes), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateShapesFeaturesFromGTFS_conversion", None)
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
    """GenerateShapesFeaturesFromGTFS_conversion(in_gtfs_folder, out_shape_lines, out_shape_stops, out_gtfs_trips, {network_modes;network_modes...}, {network_data_source}, {travel_mode}, {drive_side}, {bearing_tolerance}, {max_bearing_angle})

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
            gp.GenerateShapesFeaturesFromGTFS_conversion(
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


# Excel toolset
@gptooldoc("ExcelToTable_conversion", None)
def ExcelToTable(
    Input_Excel_File=None,
    Output_Table=None,
    Sheet=None,
    field_names_row=None,
    cell_range=None,
) -> Result1[str]:
    """ExcelToTable_conversion(Input_Excel_File, Output_Table, {Sheet}, {field_names_row}, {cell_range})

       Converts Microsoft Excel files into a table.

    INPUTS:
     Input_Excel_File (File):
         The Excel file that will be converted.
     Sheet {String}:
         The name of the particular sheet or named range in the Excel file that
         will be imported. If unspecified, the first sheet in the workbook will
         be used.Named ranges are only supported for .xlsx files. Only named
         ranges
         with a single range are supported (for example, Sheet!A1:B5); named
         ranges with multiple ranges are not (for example,
         Sheet!A1:B5,Sheet!D1:D5).
     field_names_row {Long}:
         The row in the Excel sheet that contains values that will be used as
         field names. The default value is 1.The row specified will be skipped
         when converting records to the
         output table.If the Sheet parameter value is a named range, this
         parameter's value
         will be set to the minimum row of the named range. The value will also
         be limited to the minimum and maximum row number of the named range.
         To avoid using any row's values as field names, set this
         parameter to 0, which will name the output fields using the column
         letter (for example,,,). COL_ACOL_BCOL_C        If a cell in a
         particular column is empty, the output field
         name will be based on the column letter. For example, if the input has
         three columns, and the row contains "city", "", and "country" in
         columns A, B, and C, respectively, the output table's field names will
         be,, and. cityCOL_Bcountry
     cell_range {String}:
         The cell range. This parameter is disabled when a named ranged is
         selected.If a cell range is not specified, the tool will use the start
         and end
         cells of the specified sheet.A cell is the intersection of a row and a
         column. Columns are
         identified by letters (A, B, C, D), and rows are identified by numbers
         (1, 2, 3, 4). Each cell has an address based on its column and row.
         For example, the cell B9 is the intersection of column B and row 9.A
         cell range defines a rectangle using the upper left cell and lower
         right cell, separated by a colon (:). Cell ranges are inclusive, so a
         range of A2:C10 will include all values in columns A through C and all
         values in rows 2 through 10.The output field names are derived from
         cell values in row 1,
         regardless of the rows specified in the cell range. For example, if
         the cell range specified is B2:D10, the field names will be based on
         the values in cells B1, C1, and D1. The following are examples
         of valid cell ranges:
         A2:C10-The values in columns A through C, from row 2 through
         10B3:B40-The values in column B, from row 3 through 40D5:X5-The values
         in columns D through X, for row 5E200:ALM20000-The values in columns E
         through ALM (1000th column),
         from row 200 through 20000        The following are examples of
         invalid cell ranges:
         A20:C10-The first cell cannot be lower (have a larger row number) than
         the second cell.Z3:B5-The second cell cannot be to the left (have a
         smaller column
         letter) of the first cell.A5:G-Both cells must have a valid cell
         identifier: a letter and a
         number.This parameter is only enabled when the Sheet parameter value
         is a
         sheet.

    OUTPUTS:
     Output_Table (Table):
         The output table."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExcelToTable_conversion(
                *gp_fixargs((Input_Excel_File, Output_Table, Sheet, field_names_row, cell_range), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TableToExcel_conversion", None)
def TableToExcel(
    Input_Table=None,
    Output_Excel_File=None,
    Use_field_alias_as_column_header: Literal["ALIAS", "NAME"] | None = None,
    Use_domain_and_subtype_description: Literal["DESCRIPTION", "CODE"] | None = None,
) -> Result1[str]:
    """TableToExcel_conversion(Input_Table;Input_Table..., Output_Excel_File, {Use_field_alias_as_column_header}, {Use_domain_and_subtype_description})

       Converts a table to a Microsoft Excel file (.xls or .xlsx).

    INPUTS:
     Input_Table (Table View):
         The table or tables to be converted to an Excel file.
     Use_field_alias_as_column_header {Boolean}:
         Specifies whether input field names or field aliases will be used as
         the output column names.NAME-Column headers will be set using the
         input field names. This is
         the default.ALIAS-Column headers will be set using the input
         geodatabase table's
         field aliases. If the input is a layer in a map, the value set on the
         layer's field alias is ignored.
     Use_domain_and_subtype_description {Boolean}:
         Specifies whether values from subtype fields or fields with a coded
         value domain will be transferred to the output.CODE-All field values
         will be used as they are stored in the table.
         This is the default.DESCRIPTION-For subtype fields, the subtype
         description will be used.
         For fields with a coded value domain, the coded value descriptions
         will be used.

    OUTPUTS:
     Output_Excel_File (File):
         The output Excel file. Specify the format of the Excel file using the
         .xls or .xlsx file extension."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TableToExcel_conversion(
                *gp_fixargs(
                    (
                        Input_Table,
                        Output_Excel_File,
                        Use_field_alias_as_column_header,
                        Use_domain_and_subtype_description,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# From PDF toolset
@gptooldoc("PDFToTIFF_conversion", None)
def PDFToTIFF(
    in_pdf_file=None,
    out_tiff_file=None,
    pdf_password=None,
    pdf_page_number=None,
    pdf_map=None,
    clip_option: Literal["CLIP_TO_MAP", "NO_CLIP"] | None = None,
    resolution=None,
    color_mode: Literal["RGB_TRUE_COLOR"] | None = None,
    tiff_compression: Literal["JPEG", "LZW", "PACK_BITS", "DEFLATE", "NONE"] | None = None,
    geotiff_tags: Literal["GEOTIFF_TAGS", "NO_GEOTIFF_TAGS"] | None = None,
) -> Result1[str]:
    """PDFToTIFF_conversion(in_pdf_file, out_tiff_file, {pdf_password}, {pdf_page_number}, {pdf_map}, {clip_option}, {resolution}, {color_mode}, {tiff_compression}, {geotiff_tags})

       Exports a .pdf file to Tagged Image File Format (TIFF).

    INPUTS:
     in_pdf_file (File):
         The input .pdf file to be exported to TIFF.
     pdf_password {Encrypted String}:
         This parameter is unavailable at ArcGIS 3.4. It will be supported in a
         future release.
     pdf_page_number {Long}:
         The page number of the PDF document to export to TIFF.
     pdf_map {String}:
         The map that will be exported.In a .pdf file, a map is a defined
         container of graphics on the PDF
         page that has a spatial reference. A PDF map is equivalent to an
         ArcGIS Pro map in that it is the container for spatial data. A PDF
         document may have one or more maps. For example, a page may have a
         main map and an additional smaller overview or key map.If the
         geotiff_tags parameter value is specified, it will be used to
         set the output spatial reference of the .tif file.If the clip_option
         parameter value is specified, it will be used to
         define the extent of the output .tif file.You can specify the map by
         name. You can also use the LARGEST option
         to use the largest map in the PDF. This is the default.For .pdf files
         that use the OGC GeoPDF standard, the only supported
         option is LARGEST.When entering the map's name, replace any space with
         an underscore.
         For example, My Map becomes My_Map.
     clip_option {Boolean}:
         Specifies whether the entire page or only the map will be
         exported.CLIP_TO_MAP-Only the map specified in the pdf_map parameter
         will be
         exported to TIFF.NO_CLIP-The entire page will be exported to TIFF.
         This is the default.
     resolution {Long}:
         The resolution of the output .tif file in dots per inch (DPI). The
         default is 250.
     color_mode {String}:
         Specifies the number of bits that will be used to describe
         color.Additional options will be supported in a future
         release.RGB_TRUE_COLOR-32-bit RGBA color will be used. If the
         tiff_compression
         parameter is set to JPEG, 24-bit RGB color will be used. This is the
         default.
     tiff_compression {String}:
         Specifies the compression scheme for the output .tif file.LZW-Lempel-
         Ziv-Welch, a lossless data compression, will be used. This
         is the default.DEFLATE-A lossless data compression will be
         used.JPEG-JPEG lossy compression will be used. The compression quality
         will
         be automatically set to 100 and cannot be changed.NONE-Compression
         will not be applied.PACK_BITS-PackBits lossless compression will be
         used.
     geotiff_tags {Boolean}:
         Specifies whether GeoTIFF tags will be added to the output. This
         parameter is only supported if the in_pdf_file parameter value has a
         spatial reference.GEOTIFF_TAGS-GeoTIFF tags will be added to the
         output. This is the
         default.NO_GEOTIFF_TAGS-GeoTIFF tags will not be added to the output.

    OUTPUTS:
     out_tiff_file (Raster Dataset):
         The output .tif file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PDFToTIFF_conversion(
                *gp_fixargs(
                    (
                        in_pdf_file,
                        out_tiff_file,
                        pdf_password,
                        pdf_page_number,
                        pdf_map,
                        clip_option,
                        resolution,
                        color_mode,
                        tiff_compression,
                        geotiff_tags,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# From Raster toolset
@gptooldoc("RasterToASCII_conversion", None)
def RasterToASCII(
    in_raster=None,
    out_ascii_file=None,
) -> Result1[str]:
    """RasterToASCII_conversion(in_raster, out_ascii_file)

       Converts a raster dataset to an ASCII file representing raster data.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster dataset.The raster can be integer or floating-point
         type.

    OUTPUTS:
     out_ascii_file (File):
         The output ASCII raster file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RasterToASCII_conversion(*gp_fixargs((in_raster, out_ascii_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RasterToFloat_conversion", None)
def RasterToFloat(
    in_raster=None,
    out_float_file=None,
) -> Result1[str]:
    """RasterToFloat_conversion(in_raster, out_float_file)

       Converts a raster dataset to a file of binary floating-point values
       representing raster data.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster dataset.The raster can be integer or floating-point
         type.

    OUTPUTS:
     out_float_file (File):
         The output floating-point raster file.The file name must have a .flt
         extension."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RasterToFloat_conversion(*gp_fixargs((in_raster, out_float_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RasterToPoint_conversion", None)
def RasterToPoint(
    in_raster=None,
    out_point_features=None,
    raster_field=None,
) -> Result1[str]:
    """RasterToPoint_conversion(in_raster, out_point_features, {raster_field})

       Converts a raster dataset to point features.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster dataset.The raster can be integer or floating-point
         type.
     raster_field {Field}:
         The field to assign values from the cells in the input raster to the
         points in the output dataset.It can be an integer, floating point, or
         string field.

    OUTPUTS:
     out_point_features (Feature Class):
         The output feature class that will contain the converted points."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RasterToPoint_conversion(*gp_fixargs((in_raster, out_point_features, raster_field), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RasterToPolygon_conversion", None)
def RasterToPolygon(
    in_raster=None,
    out_polygon_features=None,
    simplify: Literal["SIMPLIFY", "NO_SIMPLIFY"] | None = None,
    raster_field=None,
    create_multipart_features: Literal["SINGLE_OUTER_PART", "MULTIPLE_OUTER_PART"] | None = None,
    max_vertices_per_feature=None,
) -> Result1[str]:
    """RasterToPolygon_conversion(in_raster, out_polygon_features, {simplify}, {raster_field}, {create_multipart_features}, {max_vertices_per_feature})

       Converts a raster dataset to polygon features.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster dataset.The raster must be integer type.
     simplify {Boolean}:
         Determines if the output polygons will be smoothed into simpler shapes
         or conform to the input raster's cell edges.SIMPLIFY-The polygons will
         be smoothed into simpler shapes. The
         smoothing is done in such a way that the polygons contain a minimum
         number of segments while remaining as close as possible to the
         original raster cell edges. This is the default.NO_SIMPLIFY-The edge
         of the polygons will conform exactly to the input
         raster's cell edges. With this option, converting the resulting
         polygon feature class back to a raster would produce a raster the same
         as the original.
     raster_field {Field}:
         The field used to assign values from the cells in the input raster to
         the polygons in the output dataset.It can be an integer or a string
         field.
     create_multipart_features {Boolean}:
         Specifies whether the output polygons will consist of single-part or
         multipart features.MULTIPLE_OUTER_PART-Specifies that multipart
         features will be created
         based on polygons that have the same value.SINGLE_OUTER_PART-Specifies
         that individual features will be created
         for each polygon. This is the default.
     max_vertices_per_feature {Long}:
         The vertex limit used to subdivide a polygon into smaller polygons.
         This parameter produces similar output as created by the Dice tool.If
         left empty, the output polygons will not be split. The default is
         empty.

    OUTPUTS:
     out_polygon_features (Feature Class):
         The output feature class that will contain the converted polygons."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RasterToPolygon_conversion(
                *gp_fixargs(
                    (
                        in_raster,
                        out_polygon_features,
                        simplify,
                        raster_field,
                        create_multipart_features,
                        max_vertices_per_feature,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RasterToPolyline_conversion", None)
def RasterToPolyline(
    in_raster=None,
    out_polyline_features=None,
    background_value: Literal["ZERO", "NODATA"] | None = None,
    minimum_dangle_length=None,
    simplify: Literal["SIMPLIFY", "NO_SIMPLIFY"] | None = None,
    raster_field=None,
) -> Result1[str]:
    """RasterToPolyline_conversion(in_raster, out_polyline_features, {background_value}, {minimum_dangle_length}, {simplify}, {raster_field})

       Converts a raster dataset to polyline features.

    INPUTS:
     in_raster (Composite Geodataset):
         The input raster dataset.The raster must be integer type.
     background_value {String}:
         Specifies the value that will identify the background cells. The
         raster dataset is viewed as a set of foreground cells and background
         cells. The linear features are formed from the foreground
         cells.ZERO-The background is composed of cells of zero or less or
         NoData.
         All cells with a value greater than zero are considered a foreground
         value.NODATA-The background is composed of NoData cells. All cells
         with
         valid values belong to the foreground.
     minimum_dangle_length {Double}:
         Minimum length of dangling polylines that will be retained. The
         default is zero.
     simplify {Boolean}:
         Simplifies a line by removing small fluctuations or extraneous bends
         from it while preserving its essential shape.SIMPLIFY-The polylines
         will be simplified into simpler shapes such
         that each contains a minimum number of segments. This is the
         default.NO_SIMPLIFY-The polylines will not be simplified.
     raster_field {Field}:
         The field used to assign values from the cells in the input raster to
         the polyline features in the output dataset.It can be an integer or a
         string field.

    OUTPUTS:
     out_polyline_features (Feature Class):
         The output feature class that will contain the converted polylines."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RasterToPolyline_conversion(
                *gp_fixargs(
                    (in_raster, out_polyline_features, background_value, minimum_dangle_length, simplify, raster_field),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# From WFS toolset
@gptooldoc("WFSToFeatureClass_conversion", None)
def WFSToFeatureClass(
    input_WFS_server=None,
    WFS_feature_type=None,
    out_path=None,
    out_name=None,
    is_complex: Literal["COMPLEX", "NOT_COMPLEX"] | None = None,
    max_features=None,
    expose_metadata: Literal["EXPOSE_METADATA", "DO_NOT_EXPOSE"] | None = None,
    swap_xy: Literal["SWAP_XY", "DO_NOT_SWAP_XY"] | None = None,
    page_size=None,
) -> Result2[str, str]:
    """WFSToFeatureClass_conversion(input_WFS_server, WFS_feature_type, out_path, out_name, {is_complex}, {max_features}, {expose_metadata}, {swap_xy}, {page_size})

       Imports a feature type from a Web Feature Service (WFS) to a feature
       class in a geodatabase.

    INPUTS:
     input_WFS_server (String):
         The URL of the source WFS service (for example, http://sampleserver6.a
         rcgisonline.com/arcgis/services/SampleWorldCities/MapServer/WFSServer?
         ). If the input is a complex WFS service (is_complex = "COMPLEX"),
         this can also be the path to the .xml file.
     WFS_feature_type (String):
         The name of the WFS layer to extract from the input WFS service.
     out_path (Workspace / Feature Dataset / Folder):
         The location of the output feature class or geodatabase.If the input
         is a simple WFS, the output location can be a geodatabase
         or a feature dataset in a geodatabase. If the output location is a
         feature dataset, the coordinates will be converted from the source
         coordinate system to the coordinate system of the feature dataset.If
         the input is a complex WFS service, the output location must be a
         folder.
     out_name (String):
         The name of the output feature class or geodatabase.If the input is a
         simple WFS service, the name will be used to create
         a feature class in the output location. If the feature class name
         already exists in the geodatabase, the name will be automatically
         incremented. By default, the feature type name is used.If the input is
         a complex WFS service, the name will be used to create
         a geodatabase in the output location.
     is_complex {Boolean}:
         Specifies whether the input_WFS_server parameter value is a complex
         WFS service.COMPLEX-The WFS service is a complex WFS
         service.NOT_COMPLEX-The WFS
         service is not a complex WFS service. This is the
         default.
     max_features {Long}:
         The maximum number of features that can be returned. The default is
         1000.
     expose_metadata {Boolean}:
         Specifies whether metadata tables will be created from the service.
         This is only applicable for complex WFS
         services.EXPOSE_METADATA-Metadata tables will be created in the output
         geodatabase.DO_NOT_EXPOSE-Metadata tables will not be created in the
         output
         geodatabase. This is the default.
     swap_xy {Boolean}:
         Specifies whether the x,y axis order of the output feature class will
         be swapped. Some WFS services may have the order of the x,y
         coordinates swapped on the server side, causing the feature class to
         display incorrectly.SWAP_XY-The x,y axis order will be
         swapped.DO_NOT_SWAP_XY-The x,y axis
         order will not be swapped. This is the
         default.
     page_size {Long}:
         The page size that will be used when downloading features from the WFS
         service. The default is 100.Some servers limit the number of features
         that can be requested at a
         time or server performance may be slow when requesting a large number
         of features in a single request. Use this parameter to request a
         smaller number of features in multiple pages to avoid server timeouts
         or maximum feature limits.This parameter is only applicable for simple
         WFS 2.0 services that
         support startIndex and count WFS parameters. It will be ignored for
         older versions of WFS (1.1.0, 1.0.0)."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.WFSToFeatureClass_conversion(
                *gp_fixargs(
                    (
                        input_WFS_server,
                        WFS_feature_type,
                        out_path,
                        out_name,
                        is_complex,
                        max_features,
                        expose_metadata,
                        swap_xy,
                        page_size,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# GPS toolset
@gptooldoc("FeaturesToGPX_conversion", None)
def FeaturesToGPX(
    in_features=None,
    out_gpx_file=None,
    name_field=None,
    description_field=None,
    z_field=None,
    date_field=None,
) -> Result1[str]:
    """FeaturesToGPX_conversion(in_features, out_gpx_file, {name_field}, {description_field}, {z_field}, {date_field})

       Converts point, multipoint, or polyline features to a GPX format file
       (.gpx).

    INPUTS:
     in_features (Feature Layer):
         The input point, multipoint, or line features.
     name_field {Field}:
         A field from the input features with values used to populate the GPX
         name tag.
     description_field {Field}:
         A field from the input features with values used to populate the GPX
         desc tag.
     z_field {Field}:
         A numeric field from the input features with values used to populate
         the GPX elevation tag. If an elevation field is not specified, the
         z-values from the input features' geometries will be used to populate
         the GPX elevation tag.
     date_field {Field}:
         A date/time field from the input features with values used to populate
         the GPX time tag.

    OUTPUTS:
     out_gpx_file (File):
         The .gpx file that will be created with the geometry and attributes of
         the input features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FeaturesToGPX_conversion(
                *gp_fixargs((in_features, out_gpx_file, name_field, description_field, z_field, date_field), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GPXtoFeatures_conversion", None)
def GPXtoFeatures(
    Input_GPX_File=None,
    Output_Feature_class=None,
    Output_Type: Literal["POINTS", "TRACKS_AS_LINES"] | None = None,
) -> Result1[str]:
    """GPXtoFeatures_conversion(Input_GPX_File, Output_Feature_class, Output_Type)

       Converts the point data in a .gpx file to features.

    INPUTS:
     Input_GPX_File (File):
         The input .gpx file to be converted.
     Output_Type (String):
         Specifies the geometry type of the output feature class.POINTS-An
         output point feature class will be created. All GPX points
         will be included in the output. This is the default.TRACKS_AS_LINES-An
         output polyline feature class will be created. Only
         GPX track points will be included in the output.

    OUTPUTS:
     Output_Feature_class (Feature Class):
         The output point feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GPXtoFeatures_conversion(*gp_fixargs((Input_GPX_File, Output_Feature_class, Output_Type), True))
        )
        return retval
    except Exception as e:
        raise e


# Graphics toolset
@gptooldoc("FeaturesToGraphics_conversion", None)
def FeaturesToGraphics(
    in_layer=None,
    out_layer=None,
    exclude_features: Literal["EXCLUDE_FEATURES", "KEEP_FEATURES"] | None = None,
) -> Result2[str | Layer, str | Layer]:
    """FeaturesToGraphics_conversion(in_layer, out_layer, {exclude_features})

       Converts a feature layer's symbolized features into graphic elements
       in a graphics layer.

    INPUTS:
     in_layer (Feature Layer):
         The layer to convert to graphics.
     exclude_features {Boolean}:
         Specifies whether the converted features will be excluded using a
         query.EXCLUDE_FEATURES-The features will be excluded. This is the
         default.KEEP_FEATURES-The features will not be excluded; they will be
         preserved.

    OUTPUTS:
     out_layer (Graphics Layer):
         The graphics layer containing the converted graphic elements."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FeaturesToGraphics_conversion(*gp_fixargs((in_layer, out_layer, exclude_features), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GraphicsToFeatures_conversion", None)
def GraphicsToFeatures(
    in_layer=None,
    graphics_type: Literal["POINT", "POLYLINE", "POLYGON", "MULTIPOINT", "ANNOTATION"] | None = None,
    out_feature_class=None,
    delete_graphics: Literal["DELETE_GRAPHICS", "KEEP_GRAPHICS"] | None = None,
    reference_scale=None,
) -> Result2[str, str | Layer]:
    """GraphicsToFeatures_conversion(in_layer, graphics_type, out_feature_class, {delete_graphics}, {reference_scale})

       Converts a graphics layer into a feature layer with geometries based
       on the input graphics layer's elements.

    INPUTS:
     in_layer (Graphics Layer):
         The graphics layer containing the source graphic elements that will be
         converted to features.
     graphics_type (String):
         Specifies the type of graphic element that will be
         converted.POINT-Point graphic elements will be
         converted.POLYLINE-Polyline
         graphic elements will be converted.POLYGON-Polygon graphic elements
         will be converted.MULTIPOINT-Multipoint graphic elements will be
         converted.ANNOTATION-Annotation and text graphic elements will be
         converted.
     delete_graphics {Boolean}:
         Specifies whether the converted graphic elements from the in_layer
         parameter will be deleted after conversion.DELETE_GRAPHICS-The
         converted graphic elements will be deleted. This
         is the default.KEEP_GRAPHICS-The converted graphic elements will not
         be deleted; they
         will be preserved.
     reference_scale {Double}:
         The reference scale that will be used to convert text elements to
         annotation features. This parameter is required when the graphics_type
         parameter is set to ANNOTATION.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature layer that will contain the converted graphic
         elements."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GraphicsToFeatures_conversion(
                *gp_fixargs((in_layer, graphics_type, out_feature_class, delete_graphics, reference_scale), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# JSON toolset
@gptooldoc("FeaturesToJSON_conversion", None)
def FeaturesToJSON(
    in_features=None,
    out_json_file=None,
    format_json: Literal["FORMATTED", "NOT_FORMATTED"] | None = None,
    include_z_values: Literal["Z_VALUES", "NO_Z_VALUES"] | None = None,
    include_m_values: Literal["M_VALUES", "NO_M_VALUES"] | None = None,
    geoJSON: Literal["GEOJSON", "NO_GEOJSON"] | None = None,
    outputToWGS84: Literal["WGS84", "KEEP_INPUT_SR"] | None = None,
    use_field_alias: Literal["USE_FIELD_ALIAS", "USE_FIELD_NAME"] | None = None,
) -> Result1[str]:
    """FeaturesToJSON_conversion(in_features, out_json_file, {format_json}, {include_z_values}, {include_m_values}, {geoJSON}, {outputToWGS84}, {use_field_alias})

       Converts features to Esri JSON or GeoJSON format. The fields,
       geometry, and spatial reference of features will be converted to their
       corresponding JSON representation and written to a file with a .json
       or .geojson extension.

    INPUTS:
     in_features (Feature Layer):
         The features that will be converted to JSON format.
     format_json {Boolean}:
         Specifies whether the JSON will be formatted to improve readability
         similar to the ArcGIS REST API specification's PJSON (Pretty JSON)
         format.NOT_FORMATTED-The features will not be formatted. This is the
         default.FORMATTED-The features will be formatted to the PJSON
         specification.
     include_z_values {Boolean}:
         Specifies whether the z-values of the features will be included in the
         JSON.NO_Z_VALUES-The z-values will not be included in geometries, and
         the
         hasZ property of the JSON will not be included. This is the
         default.Z_VALUES-The z-values will be included in geometries, and the
         hasZ
         property of the JSON will be set to true.
     include_m_values {Boolean}:
         Specifies whether the m-values of the features will be included in the
         JSON.NO_M_VALUES-The m-values will not be included in geometries, and
         the
         hasM property of the JSON will not be included. This is the
         default.M_VALUES-The m-values will be included in geometries, and the
         hasM
         property of the JSON will be set to true.
     geoJSON {Boolean}:
         Specifies whether the output will be created in GeoJSON format,
         conforming to the GeoJSON specification or Esri JSON format,.GEOJSON-
         The output will be created in GeoJSON format (.geojson
         file).NO_GEOJSON-The output will be created in Esri JSON format (.json
         file). This is the default.
     outputToWGS84 {Boolean}:
         Specifies whether the input features will be projected to the WGS84
         geographic coordinate system with a default geographic transformation.
         This parameter only applies when the output is GeoJSON.WGS84-Features
         will be projected to WGS84.KEEP_INPUT_SR-Features will
         not be projected to WGS84. The GeoJSON
         will contain a CRS tag that defines the coordinate system. This is the
         default.
     use_field_alias {Boolean}:
         Specifies whether the output file will use field aliases for feature
         attributes.USE_FIELD_NAME-Output feature attributes will not use field
         aliases;
         they will use field names. This is the default.USE_FIELD_ALIAS-Output
         feature attributes will use field aliases.

    OUTPUTS:
     out_json_file (File):
         The output .json or .geojson file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FeaturesToJSON_conversion(
                *gp_fixargs(
                    (
                        in_features,
                        out_json_file,
                        format_json,
                        include_z_values,
                        include_m_values,
                        geoJSON,
                        outputToWGS84,
                        use_field_alias,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("JSONToFeatures_conversion", None)
def JSONToFeatures(
    in_json_file=None,
    out_features=None,
    geometry_type: Literal["POINT", "MULTIPOINT", "POLYGON", "POLYLINE"] | None = None,
) -> Result1[str]:
    """JSONToFeatures_conversion(in_json_file, out_features, {geometry_type})

       Converts feature collections in an Esri JSON formatted file (.json) or
       a GeoJSON formatted file (.geojson) to a feature class.

    INPUTS:
     in_json_file (File):
         The input .json or .geojson file that will be converted to a feature
         class.The input file extension determines the format used by the tool
         for
         proper conversion. For Esri JSON formatted file, use the .json
         extension; for GeoJSON formatted files, use the .geojson extension.
     geometry_type {String}:
         Specifies the geometry type that will be used to convert from GeoJSON
         to features. This parameter is only used when the input is a .geojson
         file. If the .geojson file does not contain any of the specified
         geometry types, the output feature class will be empty.POINT-Points
         will be converted to features.MULTIPOINT-Multipoints will
         be converted to features.POLYLINE-Polylines will be converted to
         features.POLYGON-Polygons will be converted to features.

    OUTPUTS:
     out_features (Feature Class):
         The output feature class that will contain the features from the input
         .json or .geojson file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.JSONToFeatures_conversion(*gp_fixargs((in_json_file, out_features, geometry_type), True))
        )
        return retval
    except Exception as e:
        raise e


# KML toolset
@gptooldoc("KMLToLayer_conversion", None)
def KMLToLayer(
    in_kml_file=None,
    output_folder=None,
    output_data=None,
    include_groundoverlay: Literal["GROUNDOVERLAY", "NO_GROUNDOVERLAY"] | None = None,
    out_suffix=None,
) -> Result2[str | Layer, str]:
    """KMLToLayer_conversion(in_kml_file, output_folder, {output_data}, {include_groundoverlay}, {out_suffix})

       Converts a .kml or .kmz file into datasets in a geodatabase and a
       layer file. The layer file maintains the symbology of the input .kml
       or .kmz file.

    INPUTS:
     in_kml_file (File / KML Layer):
         The .kml or .kmz file that will be converted to geodatabase datasets.
     output_folder (Folder):
         The destination folder where the output geodatabase and layer file
         (.lyrx) will be created.
     output_data {String}:
         A name that will be used for both the output geodatabase and layer
         file (.lyrx). The default is the name of the input file.You can
         specify the name of an existing geodatabase in the target
         folder, and the conversion will write new datasets into the existing
         geodatabase. If the geodatabase with the specified name does not
         exist, it will be created in the target folder.
     include_groundoverlay {Boolean}:
         Specifies whether ground overlays from the KML will be included in the
         output.Use caution if the KMZ points to a service that serves imagery.
         The
         tool will attempt to convert the raster imagery at all available
         scales. This process may be lengthy and possibly overwhelm the server
         or time out.GROUNDOVERLAY-Ground overlays will be included in the
         output.NO_GROUNDOVERLAY-Ground overlays will not be included in the
         output.
         This is the default.
     out_suffix {String}:
         A suffix that will be added to the names of all output feature
         datasets, feature classes, mosaic datasets, and layer files. If no
         suffix is specified, the name of the feature dataset in the output
         geodatabase will be Placemarks."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.KMLToLayer_conversion(
                *gp_fixargs((in_kml_file, output_folder, output_data, include_groundoverlay, out_suffix), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("LayerToKML_conversion", None)
def LayerToKML(
    layer=None,
    out_kmz_file=None,
    layer_output_scale=None,
    is_composite: Literal["COMPOSITE", "NO_COMPOSITE"] | None = None,
    boundary_box_extent=None,
    image_size=None,
    dpi_of_client=None,
    ignore_zvalue: Literal["CLAMPED_TO_GROUND", "ABSOLUTE"] | None = None,
) -> Result1[str | Layer]:
    """LayerToKML_conversion(layer, out_kmz_file, {layer_output_scale}, {is_composite}, {boundary_box_extent}, {image_size}, {dpi_of_client}, {ignore_zvalue})

       Converts a feature or raster layer to KML format (.kmz or .kml file).
       The output KML will contain a translation of Esri feature geometries,
       raster cells, layer symbology, and other properties.

    INPUTS:
     layer (Feature Layer / Raster Layer / Mosaic Layer / Group Layer / Layer File):
         The feature or raster layer or group layer that will be converted to
         KML format.
     layer_output_scale {Double}:
         The scale of the output file. For raster layers, a value of 0 can be
         used to create one untiled output image. If a value greater than or
         equal to 1 is used, it will determine the output resolution of the
         raster. This parameter has no effect on layers that are not raster
         layers.
     is_composite {Boolean}:
         Specifies whether the output will be a single composite image. This
         parameter only applies if you specify the output KML as a .kmz file,
         as output .kml files do not support ground overlay images or
         rasters.COMPOSITE-The output will be a single composite image
         representing the
         raster or vector features in the source layer. The raster is draped
         over the terrain as a GroundOverlay. Use this option to reduce the
         size of the output file. When this option is used, individual features
         and layers in the .kml file cannot be selected. Only output .kmz files
         support images.NO_COMPOSITE-If the input has vector features, they
         will be preserved
         as KML vectors.
     boundary_box_extent {Extent}:
         The geographic extent of the layer to be converted. Only features or
         raster cells in this extent will be included in the output KML. The
         extent can be specified using the following options:MAXOF-The maximum
         extent of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     image_size {Long}:
         The size of the tiles for raster layers if the layer_output_scale
         parameter value is greater than or equal to 1. This parameter has no
         effect on layers that are not raster layers.
     dpi_of_client {Long}:
         The device resolution for KML output when the is_composite parameter
         is set to COMPOSITE. Use this parameter with the image_size parameter
         to control output image resolution.This parameter does not resample
         source rasters. Input rasters will
         have a snapshot taken and included in the KML output as a simple .png
         image.
     ignore_zvalue {Boolean}:
         Specifies whether the z-values of the input features will be ignored
         and all features will be located, or clamped, at the ground
         elevation.ABSOLUTE-The z-values of the features will be maintained in
         the output
         KML. The features will be drawn in KML clients relative to sea
         level.CLAMPED_TO_GROUND-The z-values of the input features will be
         ignored
         and all features will be located, or clamped, at the ground elevation.
         If the input features do not have z-values, they will always be
         clamped to the ground. This is the default.

    OUTPUTS:
     out_kmz_file (File / Workspace / KML Layer):
         The output .kml or .kmz file. The output file can use the .kmz
         extension to produce an archive or zipped file, or the .kml extension
         to produce a basic KML format file. An output .kmz file is the
         default.Output .kmz files support raster layers, symbology and other
         layer
         properties, attachments, and other advanced features. Output .kml
         files will use basic KML symbols and properties."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LayerToKML_conversion(
                *gp_fixargs(
                    (
                        layer,
                        out_kmz_file,
                        layer_output_scale,
                        is_composite,
                        boundary_box_extent,
                        image_size,
                        dpi_of_client,
                        ignore_zvalue,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MapToKML_conversion", None)
def MapToKML(
    in_map: Literal["Internal_Map"] | None = None,
    out_kmz_file=None,
    map_output_scale=None,
    is_composite: Literal["COMPOSITE", "NO_COMPOSITE"] | None = None,
    is_vector_to_raster: Literal["VECTOR_TO_IMAGE", "VECTOR_TO_VECTOR"] | None = None,
    extent_to_export=None,
    image_size=None,
    dpi_of_client=None,
    ignore_zvalue: Literal["CLAMPED_TO_GROUND", "ABSOLUTE"] | None = None,
    layout=None,
) -> Result1[str]:
    """MapToKML_conversion(in_map, out_kmz_file, {map_output_scale}, {is_composite}, {is_vector_to_raster}, {extent_to_export}, {image_size}, {dpi_of_client}, {ignore_zvalue}, {layout})

       Converts a map containing feature or raster layers to KML format (.kmz
       file). The output KML will contain a translation of Esri feature
       geometries, raster cells, layer symbology, and other properties.

    INPUTS:
     in_map (Map):
         The map, scene, or basemap that will be converted to KML.
     map_output_scale {Double}:
         The scale at which each layer in the map will be exported.This
         parameter is important with any scale dependency, such as layer
         visibility or scale-dependent rendering. If the layer is not visible
         at the output scale, it is not included in the output KML. Any value,
         such as 1, can be used if there are no scale dependencies.For raster
         layers, a value of 0 can be used to create one untiled
         output image. If a value greater than or equal to 1 is used, it
         determines the output resolution of the raster. This parameter has no
         effect on layers that are not raster layers.Only numeric characters
         are accepted; for example, enter 20000 as the
         scale, not 1:20000. In languages that use commas as the decimal point,
         20,000 is also acceptable.If you're exporting a layer that is to be
         displayed as 3D vectors and
         the is_composite parameter is set to NO_COMPOSITE, you can set this
         parameter to any value as long as the features do not have any scale-
         dependent rendering.
     is_composite {Boolean}:
         Specifies whether the output KML will contain a single composite image
         or separate layers.COMPOSITE-The output KML will contain a single
         image that composites
         all the features in the map into a single raster image. The raster is
         draped over the terrain as a KML GroundOverlay. This option reduces
         the size of the output KML. Individual features and layers in the KML
         are not selectable.NO_COMPOSITE-The output KML will contain separate,
         individual layers.
         This is the default. Whether the layers are returned as rasters or as
         a combination of vectors and rasters is determined by the
         is_vector_to_raster parameter value.
     is_vector_to_raster {Boolean}:
         Specifies whether each feature layer in the map will be converted to a
         separate raster image or preserved as features. This parameter is not
         used if the is_composite parameter is set to
         COMPOSITE.VECTOR_TO_IMAGE-Feature layers will be converted to a
         separate raster
         image in the KML output. Normal raster layers are also added to the
         KML output. Each output KML raster layer is selectable, and its
         transparency can be adjusted in certain KML viewer
         applications.VECTOR_TO_VECTOR-Features will be preserved in the output
         KML as
         feature geometries. This is the default.
     extent_to_export {Extent}:
         The geographic extent of the layer to be converted. Only features or
         raster cells in this extent will be included in the output KML. The
         extent can be specified using the following options:MAXOF-The maximum
         extent of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     image_size {Long}:
         The size of the tiles for raster layers if the map_output_scale
         parameter value is greater than or equal to 1. This parameter has no
         effect on layers that are not raster layers.
     dpi_of_client {Long}:
         The device resolution for any rasters in the output KML document.
         Typical screen resolution is 96 dpi. If the data in the map supports a
         high resolution and the KML requires it, consider increasing the
         value. Use this parameter with the image_size parameter to control
         output image resolution. The default value is 96.
     ignore_zvalue {Boolean}:
         Specifies whether the z-values of the input features will be ignored
         and all features will be located, or clamped, at the ground
         elevation.ABSOLUTE-The z-values of the features will be maintained in
         the output
         KML. The features will be drawn in KML clients relative to sea
         level.CLAMPED_TO_GROUND-The z-values of the input features will be
         ignored
         and all features will be located, or clamped, at the ground elevation.
         If the input features do not have z-values, they will always be
         clamped to the ground. This is the default.
     layout {String}:
         The name of the layout that contains legend elements that will be
         included in the KML output as screen overlays.

    OUTPUTS:
     out_kmz_file (File):
         The output KML file, which is compressed and has a .kmz extension."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MapToKML_conversion(
                *gp_fixargs(
                    (
                        in_map,
                        out_kmz_file,
                        map_output_scale,
                        is_composite,
                        is_vector_to_raster,
                        extent_to_export,
                        image_size,
                        dpi_of_client,
                        ignore_zvalue,
                        layout,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Point Cloud toolset
@gptooldoc("ConvertLas_conversion", None)
def ConvertLas(
    in_las=None,
    target_folder=None,
    file_version: Literal["SAME_AS_INPUT", "1.0", "1.1", "1.2", "1.3", "1.4"] | None = None,
    point_format: Literal["0", "1", "2", "3", "6", "7", "8"] | None = None,
    compression: Literal["NO_COMPRESSION", "ZLAS", "LAZ", "EDITED_ZLAS_TO_NON_EDITED"] | None = None,
    las_options: list[Literal["REARRANGE_POINTS", "REMOVE_VLR", "REMOVE_EXTRA_BYTES"]]
    | Literal["REARRANGE_POINTS", "REMOVE_VLR", "REMOVE_EXTRA_BYTES"]
    | str
    | None = None,
    out_las_dataset=None,
    define_coordinate_system: Literal["NO_FILES", "ALL_FILES", "FILES_MISSING_PROJECTION"] | None = None,
    in_coordinate_system=None,
) -> Result1[str]:
    """ConvertLas_conversion(in_las, target_folder, {file_version}, {point_format}, {compression}, {las_options;las_options...}, {out_las_dataset}, {define_coordinate_system}, {in_coordinate_system})

       Converts .las, .zlas, and .laz files between different LAS compression
       methods, file versions, and point record formats.

    INPUTS:
     in_las (Layer File / LAS Dataset Layer / Folder / File):
         The .las, .zlas, or .laz files that will be converted. Multiple files
         can be processed by specifying the folder containing the files or a
         LAS dataset.
     target_folder (Folder):
         The existing folder where the output files will be written.
     file_version {String}:
         Specifies the file version that will be used for the output
         files.SAME_AS_INPUT-The output file version will be the same as the
         input.
         This is the default.1.0-The base version for the LAS format that
         supported 256 class codes
         will be used.1.1-The output file version will be 1.1. Class codes were
         reduced to
         32, but support for classification flags was added.1.2-The output file
         version will be 1.2. Support for red-green-blue
         (RGB) color channels and GPS time was added.1.3-The output file
         version will be 1.3. Storage of lidar waveform
         data for point record formats that are not supported in the ArcGIS
         platform was added.1.4-The output file version will be 1.4. Support
         for coordinate
         system definition using Well Known Text (WKT) convention, 256 class
         codes, up to 15 discrete returns per pulse, higher precision scan
         angle, and overlap classification flag was added.
     point_format {String}:
         Specifies the point record format that will be used for the output
         files. The available options will vary based on the output LAS format
         file version.0-The base type for storing discrete LAS points that
         supports
         attributes such as lidar intensity, return values, scan angle, scan
         direction, and edge of flight line will be used.1-GPS time is added to
         the attributes supported in point format 0,
         which will be used.2-RGB values are added to the attributes supported
         in point format 0,
         which will be used.3-RGB values and GPS time are added to the
         attributes supported in
         point format 0, which will be used.6-The preferred base type for
         storing discrete LAS points in LAS file
         version 1.4 will be used.7-RGB values are added to the attributes
         supported in point format 6,
         which will be used.8-RGB and near-infrared values are added to the
         attributes supported
         in point format 6, which will be used.
     compression {String}:
         Specifies whether the output files will be stored in a compressed or
         uncompressed format.NO_COMPRESSION-Output files will be in the
         uncompressed LAS format
         (*.las). This format supports edits to classification codes and flags.
         This is the default.ZLAS-Output files will be compressed in the zLAS
         format (*.zlas). This
         format supports edits to classification codes and flags.LAZ-Output
         files will be compressed in the LAZ format
         (*.laz).EDITED_ZLAS_TO_NON_EDITED-Edited .zlas files will be converted
         to
         unedited .zlas files. Creating unedited *.zlas files preserves the
         classification edits while allowing the files to be usable in ArcGIS
         Pro 3.1 and earlier. When this option is used on a LAS dataset
         referencing any combination of .las files, edited .zlas files, and
         unedited .zlas files, only the edited .zlas files will be processed.
     las_options {String}:
         Specifies the modifications that will be made to the output files that
         will reduce their size and improve their performance in display and
         analysis.REARRANGE_POINTS-Points will be rearranged to improve display
         and
         analysis performance. Statistics will be automatically computed during
         this process. This is the default.REMOVE_VLR-Variable-length records
         that are added after the header as
         well as the points records of each file will be
         removed.REMOVE_EXTRA_BYTES-Extra bytes that may be present with each
         point
         from the input file will be removed.
     define_coordinate_system {String}:
         Specifies how the coordinate system of each input file will be
         defined.NO_FILES-The coordinate system of each input file will be
         defined by
         the information in its header. Any file that lacks spatial reference
         information will be treated as having an unknown coordinate system.
         This is the default.ALL_FILES-The coordinate system of each input file
         will be defined by
         the in_coordinate_system parameter.FILES_MISSING_PROJECTION-The
         coordinate system of any input file that
         does not have spatial reference information in its header will be
         defined by the in_coordinate_system parameter.
     in_coordinate_system {Coordinate System}:
         The coordinate system that will be used to define the spatial
         reference of some or all input files based on the
         define_coordinate_system parameter value.

    OUTPUTS:
     out_las_dataset {LAS Dataset}:
         The output LAS dataset referencing the newly created .las files."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConvertLas_conversion(
                *gp_fixargs(
                    (
                        in_las,
                        target_folder,
                        file_version,
                        point_format,
                        compression,
                        las_options,
                        out_las_dataset,
                        define_coordinate_system,
                        in_coordinate_system,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("LasDatasetToRaster_conversion", None)
def LasDatasetToRaster(
    in_las_dataset=None,
    out_raster=None,
    value_field: Literal["ELEVATION", "INTENSITY", "RGB"] | None = None,
    interpolation_type=None,
    data_type: Literal["FLOAT", "INT"] | None = None,
    sampling_type: Literal["OBSERVATIONS", "CELLSIZE"] | None = None,
    sampling_value=None,
    z_factor=None,
) -> Result1[str]:
    """LasDatasetToRaster_conversion(in_las_dataset, out_raster, {value_field}, {interpolation_type}, {data_type}, {sampling_type}, {sampling_value}, {z_factor})

       Creates a raster using elevation, intensity, or RGB values stored in
       the lidar points referenced by the LAS dataset.

    INPUTS:
     in_las_dataset (LAS Dataset Layer):
         The LAS dataset that will be processed.
     value_field {String}:
         Specifies the information from the lidar data that will be used to
         generate the raster output.ELEVATION-Elevation from the lidar files
         will be used to create the
         raster. This is the default.INTENSITY-Intensity information from the
         lidar files will be used to
         create the raster.RGB-RGB values from the lidar points will be used to
         create 3-band
         imagery.
     interpolation_type {Interpolate}:
         The interpolation type that will be used to determine the cell value
         of the output raster. Either binning or triangulation based
         interpolation can be specified. Each type presents unique options for
         assigning cell values. Whenis set to, the point cloud is
         evaluated on a cell-by-cell
         basis. The value of each cell that contains points is determined by
         the points within the cell, whereas the value of cells without points
         can either be interpolated or assigned as NoData. The following
         options are available for the binning type:        Interpolation
         TypeBinning         Cell Assignment-The technique that will be used
         for assigning
         values to cells which contain points. Average-Assigns the
         average value of all points in the cell. This is
         the default.Minimum-Assigns the minimum value found in the points
         within the cell.Maximum-Assigns the maximum value found in the points
         within the cell.IDW-Uses Inverse Distance Weighted interpolation to
         determine the cell
         value.Nearest-Uses Nearest Neighbor assignment to determine the cell
         value. Void Fill Method-The technique that will be used for
         assigning values to cells that do not contain points.
         None-NoData is assigned to the cells that do not contain
         points.Simple-Assigns values to cells without points by averaging the
         values
         from the cells that immediately surround them. This technique
         eliminates small voids.Linear-Constructs a triangulated surface across
         void areas and uses
         linear interpolation on the TIN to determine the empty cell's value.
         This technique will cover very large voids in the data and is the
         default.Natural Neighbor-Uses natural neighbor interpolation to
         determine the
         value of cells with no points. It is recommended that the LAS dataset
         has a clip polygon surface constraint when using this technique.
         Whenis set to, cell values are derived by constructing in-
         memory TIN surfaces from the LAS dataset's points and surface
         constraints. The in-memory TINs are used to interpolate cell values
         for the output raster. The following options are available for the
         triangulation type:        Interpolation TypeTriangulation
         Interpolation Method         Linear-Uses linear interpolation
         to determine cell values.Natural
         Neighbors-Uses natural neighbor interpolation to determine
         cell value. Thinning Type         No Thinning-The LAS dataset
         points will
         not be thinned when
         constructing the intermediate TIN surfaces. Window Size-The
         LAS dataset points will be thinned by
         dividing the data extent into square bins and selecting a point within
         each bin. The size of the bin that will be used to subdivide the data
         area will be determined by the value provided for theparameter, and
         the point that is selected will be based on the option specified for
         theparameter. ResolutionSelection Method         Selection
         Method         Maximum-The point with the highest
         value in each window size is
         maintained. This is the default.Minimum-The point with the lowest
         value in each window size is
         maintained.Closest To Mean-The point whose value is closest to the
         average of all
         point values in the window size is maintained. When the point
         thinning type is set to, the points are
         subsampled before interpolating the output raster by dividing the data
         into square grids. The size of the grids are based on the value
         provided for the resolution. The unit of the value will be based on
         the linear unit of the LAS dataset's horizontal coordinate system.
         Window Size        Thevalue is the length of each side of the two-
         dimensional
         grid that will be used to subdivide the data when the point thinning
         type is set to. The unit for this value is based on the linear units
         of the data's coordinate system. ResolutionWindow Size
     data_type {String}:
         Specifies the type of numeric values that will be stored in the output
         raster.FLOAT-The output raster will use 32-bit floating point, which
         supports
         values ranging from -3.402823466e+38 to 3.402823466e+38. This is the
         default.INT-The output raster will use an appropriate integer bit
         depth. This
         option will round z-values to the nearest whole number and write an
         integer to each raster cell value.
     sampling_type {String}:
         Specifies how theparameter will be interpreted to define the
         output raster's cell size. Sampling Value
         OBSERVATIONS-Thewill define the number of columns or rows in
         the output raster based on whichever is longest. The cell size will be
         derived by dividing the longest side of the output's extent with the
         input in theparameter. If an observation value of 3000 is used on a
         dataset whose longest side is 23.67 kilometers, the output raster's
         resolution will be 7.89 meters. This method offers a helpful way of
         creating an output with a predictable size that can be generated
         rapidly. Sampling ValueSampling Value         CELLSIZE-The
         cell size will be directly defined by
         theparameter. This is the default. Sampling Value
     sampling_value {Double}:
         The value used in conjunction with theparameter to define the
         output raster's cell size. Sampling Type
     z_factor {Double}:
         The factor by which z-values will be multiplied. This is typically
         used to convert z linear units to match x,y linear units. The default
         is 1, which leaves elevation values unchanged. This parameter is not
         available if the spatial reference of the input surface has a z-datum
         with a specified linear unit.

    OUTPUTS:
     out_raster (Raster Dataset):
         The location and name of the output raster. When storing a raster
         dataset in a geodatabase or in a folder such as an Esri Grid, do not
         add a file extension to the name of the raster dataset. A file
         extension can be provided to define the raster's format when storing
         it in a folder, such as .tif to generate a GeoTIFF or .img to generate
         an ERDAS IMAGINE format file.If the raster is stored as a .tif file or
         in a geodatabase, the raster
         compression type and quality can be specified using geoprocessing
         environment settings."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LasDatasetToRaster_conversion(
                *gp_fixargs(
                    (
                        in_las_dataset,
                        out_raster,
                        value_field,
                        interpolation_type,
                        data_type,
                        sampling_type,
                        sampling_value,
                        z_factor,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MeshToLAS_conversion", None)
def MeshToLAS(
    in_mesh=None,
    target_folder=None,
    method: Literal["SAMPLE_POINTS_FROM_FACES", "USE_TRIANGLE_VERTICES"] | None = None,
    maximum_triangle_area=None,
    extent=None,
    boundary=None,
    rearrange_points: Literal["REARRANGE_POINTS", "MAINTAIN_POINTS"] | None = None,
    compute_stats: Literal["COMPUTE_STATS", "NO_COMPUTE_STATS"] | None = None,
    out_las_dataset=None,
    compression: Literal["NO_COMPRESSION", "ZLAS"] | None = None,
) -> Result2[str, str]:
    """MeshToLAS_conversion(in_mesh, target_folder, {method}, {maximum_triangle_area}, {extent}, {boundary}, {rearrange_points}, {compute_stats}, {out_las_dataset}, {compression})

       Converts an integrated mesh into a LAS format point cloud.

    INPUTS:
     in_mesh (Scene Layer / File):
         The integrated mesh scene layer package or I3S service that will be
         exported to the LAS format point cloud.
     target_folder (Folder):
         The folder where the output LAS format files that will be created from
         the integrated mesh will be stored.
     method {String}:
         Specifies the method that will be used to create the point cloud from
         the integrated mesh.SAMPLE_POINTS_FROM_FACES-Points will be sampled
         from the integrated
         mesh triangle faces. Triangles may potentially be subdivided based on
         the maximum_triangle_area parameter value. The centroid of each
         triangle or subdivided triangle will be converted to points. This is
         the default.USE_TRIANGLE_VERTICES-Points will be created from the
         vertices of the
         integrated mesh.
     maximum_triangle_area {Areal Unit}:
         Controls the density of points created from the integrated mesh by
         defining the maximum area of each triangle that contributes points.
         Any mesh triangle that is larger than this value will be subdivided.
         If no value is provided, one point will be sampled from the face of
         each triangle.This parameter is only used when the method parameter is
         set to
         SAMPLE_POINTS_FROM_FACES.
     extent {Extent}:
         The extent of the integrated mesh that will be exported to the point
         cloud. If the processing extent is specified with an extraction
         boundary polygon, both the intersection of the extent and the boundary
         will be exported.MAXOF-The maximum extent of all inputs will be
         used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     boundary {Feature Layer}:
         The polygon features defining the area that will be clipped.
     rearrange_points {Boolean}:
         Specifies whether points in the .las files will be
         rearranged.MAINTAIN_POINTS-The order of the points in the .las files
         will not be
         rearranged.REARRANGE_POINTS-The points in the .las files will be
         rearranged. This
         is the default.
     compute_stats {Boolean}:
         Specifies whether statistics will be computed for the .las files
         referenced by the LAS dataset. Computing statistics provides a spatial
         index for each .las file, which improves analysis and display
         performance. Statistics also enhance the filtering and symbology
         experience by limiting the display of LAS attributes, such as
         classification codes and return information, to values that are
         present in the .las file.COMPUTE_STATS-Statistics will be computed.
         This is the
         default.NO_COMPUTE_STATS-Statistics will not be computed.
     compression {String}:
         Specifies whether the output .las file will be in a compressed format
         or the standard LAS format.NO_COMPRESSION-The output will be in the
         standard LAS format (*.las
         file). This is the default.ZLAS-Output .las files will be compressed
         in the zLAS format.

    OUTPUTS:
     out_las_dataset {LAS Dataset}:
         The output LAS dataset that will reference the LAS format files
         created by the conversion process."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MeshToLAS_conversion(
                *gp_fixargs(
                    (
                        in_mesh,
                        target_folder,
                        method,
                        maximum_triangle_area,
                        extent,
                        boundary,
                        rearrange_points,
                        compute_stats,
                        out_las_dataset,
                        compression,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PointCloudToRaster_conversion", None)
def PointCloudToRaster(
    in_point_cloud=None,
    cell_size=None,
    out_raster=None,
    cell_assignment: Literal["AVERAGE", "MINIMUM", "MAXIMUM", "NEAREST"] | None = None,
    void_fill: Literal["NONE", "SIMPLE", "LINEAR", "NATURAL_NEIGHBOR"] | None = None,
    z_factor=None,
) -> Result1[str]:
    """PointCloudToRaster_conversion(in_point_cloud, cell_size, out_raster, {cell_assignment}, {void_fill}, {z_factor})

       Creates a raster surface from height values in a point cloud scene
       layer package (*.slpk file) or Indexed 3D Scene (I3S) service.

    INPUTS:
     in_point_cloud (Scene Layer / File):
         The point cloud scene layer package (*.slpk file) or I3S point cloud
         scene layer service that will be used to generate an elevation raster.
         An I3S point cloud scene layer service must have the export property
         enabled to be processed.
     cell_size (Linear Unit):
         The length and width of each cell in the output raster.
     cell_assignment {String}:
         Specifies the method that will be used for assigning values to cells
         containing points.AVERAGE-The cell value will be defined by the
         average of the z-values
         for all points in the cell. This is the default.MINIMUM-The cell value
         will be defined by the lowest z-value from the
         points in the cell.MAXIMUM-The cell value will be defined by the
         highest z-value from the
         points in the cell.NEAREST-The cell value will be assigned based on
         the height of the
         point closest to the cell center.
     void_fill {String}:
         Specifies the method that will be used for interpolating the values of
         cells within the interpolation zone that do not contain points.NONE-No
         value will be assigned to raster cells that do not contain
         points.SIMPLE-The z-value of points located in the cells that
         immediately
         surround the empty cell will be averaged to eliminate small
         voids.LINEAR-Void areas will be triangulated and linear interpolation
         will
         be used to assign the cell value. This is the
         default.NATURAL_NEIGHBOR-Natural neighbor interpolation will be used
         to
         determine the cell value.
     z_factor {Double}:
         The factor by which z-values will be multiplied. This is typically
         used to convert z linear units to match x,y linear units. The default
         is 1, which leaves the z-values unchanged.

    OUTPUTS:
     out_raster (Raster Dataset):
         The location and name of the output raster. When storing a raster
         dataset in a geodatabase or in a folder such as an Esri Grid, do not
         add a file extension to the name of the raster dataset. A file
         extension can be provided to define the raster's format when storing
         it in a folder, such as .tif to generate a GeoTIFF or .img to generate
         an ERDAS IMAGINE format file.If the raster is stored as a .tif file or
         in a geodatabase, the raster
         compression type and quality can be specified using geoprocessing
         environment settings."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PointCloudToRaster_conversion(
                *gp_fixargs((in_point_cloud, cell_size, out_raster, cell_assignment, void_fill, z_factor), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# SAS toolset
@gptooldoc("SASToTable_conversion", None)
def SASToTable(
    in_sas_dataset=None,
    out_table=None,
    use_cas_connection: Literal["USE_CAS", "LOCAL_SAS"] | None = None,
    hostname=None,
    port=None,
    username=None,
    password=None,
    custom_cfg_file=None,
    authinfo_file=None,
) -> Result1[str]:
    """SASToTable_conversion(in_sas_dataset, out_table, {use_cas_connection}, {hostname}, {port}, {username}, {password}, {custom_cfg_file}, {authinfo_file})

       Converts a SAS dataset to a table.

    INPUTS:
     in_sas_dataset (String):
         The input SAS dataset. Provide the dataset in the form
         libref.tablename in which libref is the name of a SAS library and
         tablename is the name of the SAS dataset.
     use_cas_connection {Boolean}:
         Specifies whether the input SAS dataset will be downloaded from CAS or
         accessed from a local SAS library.USE_CAS-The input SAS dataset will
         be downloaded from
         CAS.LOCAL_SAS-The input SAS dataset will be accessed from a local SAS
         library. This is the default.
     hostname {String}:
         The URL of the CAS host.
     port {Long}:
         The port of the CAS connection.
     username {String}:
         The username for the CAS connection.
     password {String Hidden}:
         The password for the CAS connection. This password is hidden and not
         accessible after running the tool.
     custom_cfg_file {File}:
         The file specifying custom configurations for the SAS session. The
         file is only required for customized local or remote SAS deployments.
     authinfo_file {File}:
         The file containing authentication information when connecting to CAS.
         The file must contain the username and encoded password for the
         connection. If a file is provided, the username and password
         parameters do not need to be specified.

    OUTPUTS:
     out_table (Table):
         The output table."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SASToTable_conversion(
                *gp_fixargs(
                    (
                        in_sas_dataset,
                        out_table,
                        use_cas_connection,
                        hostname,
                        port,
                        username,
                        password,
                        custom_cfg_file,
                        authinfo_file,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TableToSAS_conversion", None)
def TableToSAS(
    in_table=None,
    out_sas_dataset=None,
    replace_sas_dataset: Literal["OVERWRITE", "NO_OVERWRITE"] | None = None,
    use_domain_and_subtype_description: Literal["USE_DOMAIN", "NO_DOMAIN"] | None = None,
    use_cas_connection: Literal["USE_CAS", "LOCAL_SAS"] | None = None,
    hostname=None,
    port=None,
    username=None,
    password=None,
    custom_cfg_file=None,
    authinfo_file=None,
) -> Result1[str]:
    """TableToSAS_conversion(in_table, out_sas_dataset, {replace_sas_dataset}, {use_domain_and_subtype_description}, {use_cas_connection}, {hostname}, {port}, {username}, {password}, {custom_cfg_file}, {authinfo_file})

       Converts a table to a SAS dataset.

    INPUTS:
     in_table (Table View):
         The input table.
     replace_sas_dataset {Boolean}:
         Specifies whether an existing SAS dataset will be overwritten in the
         output.OVERWRITE-The output SAS dataset can overwrite an existing
         dataset.NO_OVERWRITE-The output SAS dataset cannot overwrite an
         existing
         dataset.. This is the default.
     use_domain_and_subtype_description {Boolean}:
         Specifies whether domain and subtype descriptions will be included in
         the output SAS dataset.USE_DOMAIN-Domain and subtype descriptions will
         be included in the
         output SAS dataset.NO_DOMAIN-Domain and subtype descriptions will not
         be included in the
         output SAS dataset. This is the default.
     use_cas_connection {Boolean}:
         Specifies whether the output SAS dataset will be uploaded to CAS or
         saved in a local SAS library.USE_CAS-The output SAS dataset will be
         uploaded to CAS.LOCAL_SAS-The
         output SAS dataset will be saved in a local SAS library.
         This is the default.
     hostname {String}:
         The URL of the CAS host.
     port {Long}:
         The port of the CAS connection.
     username {String}:
         The username for the CAS connection.
     password {String Hidden}:
         The password for the CAS connection. This password is hidden and not
         accessible after running the tool.
     custom_cfg_file {File}:
         The file specifying custom configurations for the SAS session. The
         file is only required for customized local or remote SAS deployments.
     authinfo_file {File}:
         The file containing authentication information when connecting to CAS.
         The file must contain the username and encoded password for the
         connection. If a file is provided, the username and password
         parameters do not need to be specified.

    OUTPUTS:
     out_sas_dataset (String):
         The output SAS dataset. Provide the dataset in the form libref.table
         in which libref is the name of a SAS library and table is the name of
         the SAS table."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TableToSAS_conversion(
                *gp_fixargs(
                    (
                        in_table,
                        out_sas_dataset,
                        replace_sas_dataset,
                        use_domain_and_subtype_description,
                        use_cas_connection,
                        hostname,
                        port,
                        username,
                        password,
                        custom_cfg_file,
                        authinfo_file,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# To CAD toolset
@gptooldoc("AddCADFields_conversion", None)
def AddCADFields(
    input_table=None,
    Entities: Literal["ADD_ENTITY_PROPERTIES", "NO_ENTITY_PROPERTIES"] | None = None,
    LayerProps: Literal["ADD_LAYER_PROPERTIES", "NO_LAYER_PROPERTIES"] | None = None,
    TextProps: Literal["ADD_TEXT_PROPERTIES", "NO_TEXT_PROPERTIES"] | None = None,
    DocProps: Literal["ADD_DOCUMENT_PROPERTIES", "NO_DOCUMENT_PROPERTIES"] | None = None,
    XDataProps: Literal["ADD_XDATA_PROPERTIES", "NO_XDATA_PROPERTIES"] | None = None,
) -> Result1[str | Table]:
    """AddCADFields_conversion(input_table, Entities, {LayerProps}, {TextProps}, {DocProps}, {XDataProps})

       Adds several reserved CAD fields in one step. Fields created by this
       tool are used by the Export To CAD tool to generate CAD entities with
       specific properties. After executing this tool, you must calculate or
       type the appropriate field values.

    INPUTS:
     input_table (Table View):
         Input table, feature class, or shapefile that will have the CAD-
         specific fields added to it
     Entities (Boolean):
         Adds the list of CAD-specific Entity property fields to the input
         tableADD_ENTITY_PROPERTIES-Adds the list of CAD-specific Entity
         property
         fields to the input tableNO_ENTITY_PROPERTIES-Does not add the list of
         CAD-specific Entity
         property fields to the input table
     LayerProps {Boolean}:
         Adds the list of CAD-specific Layer property fields to the input
         tableADD_LAYER_PROPERTIES-Adds the list of CAD-specific Layer property
         fields to the input tableNO_LAYER_PROPERTIES-Does not add the list of
         CAD-specific Layer
         property fields to the input table
     TextProps {Boolean}:
         Adds the list of CAD-specific Text property fields to the input
         tableADD_TEXT_PROPERTIES-Adds the list of CAD-specific Text property
         fields
         to the input tableNO_TEXT_PROPERTIES-Does not add the list of CAD-
         specific Text property
         fields to the input table
     DocProps {Boolean}:
         Adds the list of CAD-specific Document property fields to the input
         tableADD_DOCUMENT_PROPERTIES-Adds the list of CAD-specific Document
         property fields to the input tableNO_DOCUMENT_PROPERTIES-Does not add
         the list of CAD-specific Document
         property fields to the input table
     XDataProps {Boolean}:
         Adds the list of CAD-specific XData property fields to the input
         tableADD_XDATA_PROPERTIES-Adds the list of CAD-specific XData property
         fields to the input tableNO_XDATA_PROPERTIES-Does not add the list of
         CAD-specific XData
         property fields to the input table"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddCADFields_conversion(
                *gp_fixargs((input_table, Entities, LayerProps, TextProps, DocProps, XDataProps), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportCAD_conversion", None)
def ExportCAD(
    in_features=None,
    Output_Type: Literal[
        "DGN_V8",
        "DWG_R14",
        "DWG_R2000",
        "DXF_R14",
        "DXF_R2000",
        "DWG_R2004",
        "DXF_R2004",
        "DWG_R2005",
        "DXF_R2005",
        "DWG_R2007",
        "DXF_R2007",
        "DWG_R2010",
        "DXF_R2010",
        "DWG_R2013",
        "DXF_R2013",
        "DWG_R2018",
        "DXF_R2018",
    ]
    | None = None,
    Output_File=None,
    Ignore_FileNames: Literal["Ignore_Filenames_in_Tables", "Use_Filenames_in_Tables"] | None = None,
    Append_To_Existing: Literal["Append_To_Existing_Files", "Overwrite_Existing_Files"] | None = None,
    Seed_File=None,
) -> Result1[str]:
    """ExportCAD_conversion(in_features;in_features..., Output_Type, Output_File, {Ignore_FileNames}, {Append_To_Existing}, {Seed_File})

       Exports features to new or existing CAD files based on one or more
       input feature layers or feature classes.

    INPUTS:
     in_features (Feature Layer):
         A collection of feature classes and feature layers whose spatial
         reference and geometry will be exported to one or more CAD files. Both
         the feature geometry and the feature attributes will be added to
         AutoCAD formatted files.
     Output_Type (String):
         Specifies the CAD platform and file version that will be used for new
         output CAD files. Multiple versions of CAD software may share one file
         format version for multiple releases. The options reflect the file
         format version, not necessarily the software version that may still
         use a previous file format version.DGN_V8-The output type will be
         Microstation DGN.DWG_R2018-The output
         type will be DWG version 2018. This is the
         default.DWG_R2013-The output type will be DWG version
         2013.DWG_R2010-The output type will be DWG version 2010.DWG_R2007-The
         output type will be DWG version 2007.DWG_R2005-The output type will be
         DWG version 2005.DWG_R2004-The output type will be DWG version
         2004.DWG_R2000-The output type will be DWG version 2000.DWG_R14-The
         output type will be DWG version 14.DXF_R2018-The output type will be
         DXF version 2018.DXF_R2013-The output type will be DXF version
         2013.DXF_R2010-The output type will be DXF version 2010.DXF_R2007-The
         output type will be DXF version 2007.DXF_R2005-The output type will be
         DXF version 2005.DXF_R2004-The output type will be DXF version
         2004.DXF_R2000-The output type will be DXF version 2000.DXF_R14-The
         output type will be DXF version 14.
     Ignore_FileNames {Boolean}:
         Specifies whether valid paths included in thefield of input
         features will be ignored.
         DocPathIgnore_Filenames_in_Tables-Valid paths will be ignored and the
         output
         of all entities will be added to the Output_File parameter value. This
         is the default.Use_Filenames_in_Tables-Valid paths will be used so
         that each new CAD
         entity will be written to the file specified by that field value.
     Append_To_Existing {Boolean}:
         Specifies whether the output will be appended to an existing CAD file.
         This allows you to add information to a CAD file on
         disk.Append_To_Existing_Files-Entities will be appended to an output
         CAD
         file if one exists. The existing CAD file content will be
         retained.Overwrite_Existing_Files-If an output CAD file exists, it
         will be
         overwritten. This is the default.
     Seed_File {CAD Drawing Dataset}:
         An existing CAD drawing whose contents and document and layer
         properties will be used as a seed file when output CAD files are
         created. The CAD platform and format version of the seed file
         overrides the value specified by the Output_Type parameter. If
         appending to existing CAD files, the seed drawing is ignored.

    OUTPUTS:
     Output_File (CAD Drawing Dataset):
         The path of the output CAD drawing file. This path will be
         overridden by any valid file paths included as field values in the
         input feature's field or alias field namedunless the Ignore_FileNames
         parameter is set to Ignore_Filenames_in_Tables. DocPath"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportCAD_conversion(
                *gp_fixargs(
                    (in_features, Output_Type, Output_File, Ignore_FileNames, Append_To_Existing, Seed_File), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# To Collada toolset
@gptooldoc("MultipatchToCollada_conversion", None)
def MultipatchToCollada(
    in_features=None,
    output_folder=None,
    prepend_source: Literal["PREPEND_SOURCE_NAME", "PREPEND_NONE"] | None = None,
    field_name=None,
    collada_version: Literal["1.4", "1.5"] | None = None,
) -> Result1[str]:
    """MultipatchToCollada_conversion(in_features, output_folder, {prepend_source}, {field_name}, {collada_version})

       Converts one or more multipatch features into a collection of COLLADA
       files (.dae) and referenced texture image files in an output folder.

    INPUTS:
     in_features (Feature Layer):
         The multipatch features to be exported.
     prepend_source {Boolean}:
         Specifies whether the names of the output COLLADA files will be
         prepended with the name of the source feature
         layer.PREPEND_SOURCE_NAME-The file names will be prepended with the
         name of
         the source feature layer.PREPEND_NONE-The file names will not be
         prepended with the name of the
         source feature layer. This is the default.
     field_name {Field}:
         The feature attribute that will be used as the output COLLADA file
         name for each exported feature. If no field is specified, the
         feature's Object ID will be used.
     collada_version {String}:
         Specifies the COLLADA version to which the files will be
         exported.1.5-Files will be exported to COLLADA version 1.5. Version
         1.5
         supports the inclusion of georeferencing information and enhanced
         rendering capabilities. This is the default.1.4-Files will be exported
         to COLLADA version 1.4. Version 1.4 is the
         widely supported standard used in many design related application
         platforms. Select this version if the COLLADA file will be used on
         systems that do not support version 1.5.

    OUTPUTS:
     output_folder (Folder):
         The destination folder where the output COLLADA files and texture
         image files will be placed."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MultipatchToCollada_conversion(
                *gp_fixargs((in_features, output_folder, prepend_source, field_name, collada_version), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# To GeoPackage toolset
@gptooldoc("AddRasterToGeoPackage_conversion", None)
def AddRasterToGeoPackage(
    in_dataset=None,
    target_geopackage=None,
    raster_name=None,
    tiling_scheme: Literal[
        "TILED",
        "ARCGISONLINE_SCHEME",
        "GOOGLE_EARTH_WEB_MERCATOR",
        "NSGPROFILE_SCALED_TRANSVERSE_MERCATOR",
        "NSGPROFILE_WGS84_GEOGRAPHIC",
        "FROM_FILE",
    ]
    | None = None,
    tiling_scheme_file=None,
    area_of_interest=None,
) -> Result1[str]:
    """AddRasterToGeoPackage_conversion(in_dataset, target_geopackage, raster_name, {tiling_scheme}, {tiling_scheme_file}, {area_of_interest})

       Loads raster datasets into an OGC GeoPackage raster pyramid.

    INPUTS:
     in_dataset (Raster Layer / Mosaic Layer):
         The raster dataset to load into the OGC GeoPackage raster pyramid.
     target_geopackage (Workspace):
         The GeoPackage into which the raster dataset will be loaded.
     raster_name (String):
         The name of the output GeoPackage raster pyramid.
     tiling_scheme {String}:
         Specifies the tiling scheme.TILED-The spatial reference of the input
         raster will be maintained and
         tiles will be generated consistent with the GeoPackage standard. This
         is the default.ARCGISONLINE_SCHEME-Raster tiles will be generated in
         a Web Mercator
         coordinate reference (the same scheme developed for the Army
         Geospatial Center).NSGPROFILE_SCALED_TRANSVERSE_MERCATOR-A scaled
         transverse Mercator
         will be used.NSGPROFILE_WGS84_GEOGRAPHIC-WGS84 Geographic will be
         used.GOOGLE_EARTH_WEB_MERCATOR-Raster tiles will be created using the
         parameters in the Web Mercator coordinate reference.FROM_FILE-A custom
         tiling scheme from a file with an XML schema
         definition created using the Generate Tile Cache Tiling Scheme tool
         will be used.
     tiling_scheme_file {File}:
         A custom tiling scheme file that is required when tiling_scheme is set
         to FROM_FILE.
     area_of_interest {Feature Set}:
         An area of interest used to limit the area of the raster to be loaded,
         rather than the entire dataset."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddRasterToGeoPackage_conversion(
                *gp_fixargs(
                    (in_dataset, target_geopackage, raster_name, tiling_scheme, tiling_scheme_file, area_of_interest),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# To Geodatabase toolset
@gptooldoc("BIMFileToGeodatabase_conversion", None)
def BIMFileToGeodatabase(
    in_bim_file_workspace=None,
    out_gdb_path=None,
    out_dataset_name=None,
    spatial_reference=None,
    identifier=None,
    include_floorplan: Literal["INCLUDE_FLOORPLAN", "EXCLUDE_FLOORPLAN"] | None = None,
) -> Result2[str, str]:
    """BIMFileToGeodatabase_conversion(in_bim_file_workspace;in_bim_file_workspace..., out_gdb_path, out_dataset_name, {spatial_reference}, {identifier}, {include_floorplan})

       Imports the contents of one or more BIM file workspaces into a single
       geodatabase feature dataset.

    INPUTS:
     in_bim_file_workspace (BIM File Workspace):
         The BIM file or files that will be converted to geodatabase feature
         classes.
     out_gdb_path (Workspace):
         The geodatabase where the output feature dataset will be created. This
         must be an existing geodatabase.
     out_dataset_name (String):
         The building dataset name.
     spatial_reference {Spatial Reference}:
         The spatial reference of the output feature dataset.To control other
         aspects of the spatial reference, such as the x,y-,
         z-, and m-domains, resolutions, and tolerances, set the appropriate
         geoprocessing environments.
     identifier {String}:
         A unique building identifier that will be added to all output feature
         classes. The identifier allows you to add unique names to each
         building to be used at a later time.
     include_floorplan {Boolean}:
         Specifies whether the output dataset will include the floorplan
         feature classes.INCLUDE_FLOORPLAN-The output dataset will include the
         floorplan
         feature classes. This is the default.EXCLUDE_FLOORPLAN-The output
         dataset will exclude the floorplan
         feature classes."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.BIMFileToGeodatabase_conversion(
                *gp_fixargs(
                    (
                        in_bim_file_workspace,
                        out_gdb_path,
                        out_dataset_name,
                        spatial_reference,
                        identifier,
                        include_floorplan,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CADToGeodatabase_conversion", None)
def CADToGeodatabase(
    input_cad_datasets=None,
    out_gdb_path=None,
    out_dataset_name=None,
    reference_scale=None,
    spatial_reference=None,
) -> Result1[str]:
    """CADToGeodatabase_conversion(input_cad_datasets;input_cad_datasets..., out_gdb_path, out_dataset_name, reference_scale, {spatial_reference})

       Reads a CAD dataset and creates feature classes of the drawing. The
       feature classes are written to a geodatabase feature dataset.

    INPUTS:
     input_cad_datasets (CAD Drawing Dataset):
         The collection of CAD files that will be converted to geodatabase
         features.
     out_gdb_path (Workspace):
         The geodatabase where the output feature dataset will be created. This
         geodatabase must already exist.
     out_dataset_name (String):
         The name of the feature dataset that will be created.
     reference_scale (Double):
         This parameter is not needed for this tool, as CAD annotation is
         treated as points in ArcGIS Pro.
     spatial_reference {Spatial Reference}:
         The spatial reference of the output feature dataset. To control other
         aspects of the spatial reference, such as the x-, y-, z-, and
         m-domains, resolutions, and tolerances, set the appropriate
         geoprocessing environments."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CADToGeodatabase_conversion(
                *gp_fixargs(
                    (input_cad_datasets, out_gdb_path, out_dataset_name, reference_scale, spatial_reference), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportFeatures_conversion", None)
def ExportFeatures(
    in_features=None,
    out_features=None,
    where_clause=None,
    use_field_alias_as_name: Literal["USE_ALIAS", "NOT_USE_ALIAS"] | None = None,
    field_mapping=None,
    sort_field=None,
) -> Result1[str]:
    """ExportFeatures_conversion(in_features, out_features, {where_clause}, {use_field_alias_as_name}, {field_mapping}, {sort_field;sort_field...})

       Converts a feature class or feature layer to a new feature class.

    INPUTS:
     in_features (Feature Layer):
         The input features that will be exported to a new feature class.
     where_clause {SQL Expression}:
         An SQL expression used to select a subset of features. For more
         information on SQL syntax see the help topic SQL reference for query
         expressions used in ArcGIS.
     use_field_alias_as_name {Boolean}:
         Specifies whether the input's field names or field aliases will be
         used as the output field name.NOT_USE_ALIAS-The input's field names
         will be used as the output field
         names. This is the default.USE_ALIAS-The input's field aliases will be
         used as the output field
         names.
     field_mapping {Field Mappings}:
         The fields that will be transferred to the output dataset with their
         respective properties and source fields. The output includes all
         fields from the input dataset by default.Use the field map to add,
         delete, rename, and reorder fields, as well
         as change other field properties.The field map can also be used to
         combine values from two or more
         input fields into a single output field.
     sort_field {Value Table}:
         The field or fields whose values will be used to reorder the input
         records and the direction the records will be sorted.ASCENDING-Records
         will be sorted from low value to high
         value.DESCENDING-Records will be sorted from high value to low value.

    OUTPUTS:
     out_features (Feature Class):
         The output feature class containing the exported features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportFeatures_conversion(
                *gp_fixargs(
                    (in_features, out_features, where_clause, use_field_alias_as_name, field_mapping, sort_field), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportTable_conversion", None)
def ExportTable(
    in_table=None,
    out_table=None,
    where_clause=None,
    use_field_alias_as_name: Literal["USE_ALIAS", "NOT_USE_ALIAS"] | None = None,
    field_mapping=None,
    sort_field=None,
) -> Result1[str]:
    """ExportTable_conversion(in_table, out_table, {where_clause}, {use_field_alias_as_name}, {field_mapping}, {sort_field;sort_field...})

       Exports the rows of a table or table view to a new table.

    INPUTS:
     in_table (Table View / Raster Layer):
         The input table containing the rows to be exported to a new table.
     where_clause {SQL Expression}:
         An SQL expression used to select a subset of records. For more
         information on SQL syntax see the help topic SQL reference for query
         expressions used in ArcGIS.
     use_field_alias_as_name {Boolean}:
         Specifies whether the input's field names or field aliases will be
         used as the output field name.NOT_USE_ALIAS-The input's field names
         will be used as the output field
         names. This is the default.USE_ALIAS-The input's field aliases will be
         used as the output field
         names.
     field_mapping {Field Mappings}:
         The fields that will be transferred to the output dataset with their
         respective properties and source fields. The output includes all
         fields from the input dataset by default.Use the field map to add,
         delete, rename, and reorder fields, as well
         as change other field properties.The field map can also be used to
         combine values from two or more
         input fields into a single output field.
     sort_field {Value Table}:
         The field or fields whose values will be used to reorder the input
         records and the direction the records will be sorted.ASCENDING-Records
         will be sorted from low value to high
         value.DESCENDING-Records will be sorted from high value to low value.

    OUTPUTS:
     out_table (Table):
         The output table containing the exported rows.If the output location
         is a folder, include an extension such as .csv,
         .txt, or .dbf to export the table to the respective format. If the
         output location is a geodatabase, do not specify an extension."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportTable_conversion(
                *gp_fixargs(
                    (in_table, out_table, where_clause, use_field_alias_as_name, field_mapping, sort_field), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExtractBIMFileFloorplan_conversion", None)
def ExtractBIMFileFloorplan(
    in_bim_file_workspace=None,
    output_workspace=None,
    out_feature_dataset_name=None,
    out_polyline_featureclass_name=None,
    out_polygon_featureclass_name=None,
    out_poi_featureclass_name=None,
    out_footprint_featureclass_name=None,
    additional_polyline_categories=None,
    additional_polygon_categories=None,
    included_levels=None,
) -> Result1[str]:
    """ExtractBIMFileFloorplan_conversion(in_bim_file_workspace, output_workspace, out_feature_dataset_name, out_polyline_featureclass_name, out_polygon_featureclass_name, out_poi_featureclass_name, out_footprint_featureclass_name, {additional_polyline_categories;additional_polyline_categories...}, {additional_polygon_categories;additional_polygon_categories...}, {included_levels;included_levels...})

       Extracts 2.5D floor plan data from a BIM file workspace into a
       geodatabase dataset.

    INPUTS:
     in_bim_file_workspace (BIM File Workspace):
         The BIM file workspace that contains the building information to be
         extracted.
     output_workspace (Workspace):
         The geodatabase where the output feature dataset will be created. This
         must be an existing geodatabase.
     out_feature_dataset_name (String):
         The name of the dataset where the output feature classes will be
         created. If the feature dataset does not exist, it will be created
         with the spatial reference of the input BIM file workspace.
     out_polyline_featureclass_name (String):
         The name of the output polyline feature class. Polyline features will
         be extracted into this feature class.
     out_polygon_featureclass_name (String):
         The name of the output polygon feature class. Polygon features will be
         extracted into this feature class.
     out_poi_featureclass_name (String):
         The name of the output points of interest feature class. Points of
         interest features will be extracted into this feature class.
     out_footprint_featureclass_name (String):
         The name of the output footprint feature class. Footprint polygons
         from the BIM file workspace will be created in this feature class.The
         feature class will include the following categories:Merge Slabs
         (IFC)Merge Floor (Revit)
     additional_polyline_categories {String}:
         The additional polyline features that will be included in the
         floor plan polyline feature class. Features from the following
         categories can be included:        FurnitureFurniture
         systemWindows(All)
     additional_polygon_categories {String}:
         Specifies the additional polygon features that will be
         included in the floor plan polygon feature class. Features from the
         following categories can be included from Revit data:
         AreasRoomsRoofs        Features from the following categories can be
         included from
         IFC data:        SpacesRoofs
     included_levels {String}:
         The building level or levels of features that will be included in the
         output feature classes. If no building levels are provided, features
         from all levels will be included by default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExtractBIMFileFloorplan_conversion(
                *gp_fixargs(
                    (
                        in_bim_file_workspace,
                        output_workspace,
                        out_feature_dataset_name,
                        out_polyline_featureclass_name,
                        out_polygon_featureclass_name,
                        out_poi_featureclass_name,
                        out_footprint_featureclass_name,
                        additional_polyline_categories,
                        additional_polygon_categories,
                        included_levels,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExtractLocationsDocument_conversion", None)
def ExtractLocationsDocument(
    in_file=None,
    out_feature_class=None,
    in_template=None,
    coord_dd_latlon: Literal["FIND_DD_LATLON", "DONT_FIND_DD_LATLON"] | None = None,
    coord_dd_xydeg: Literal["FIND_DD_XYDEG", "DONT_FIND_DD_XYDEG"] | None = None,
    coord_dd_xyplain: Literal["FIND_DD_XYPLAIN", "DONT_FIND_DD_XYPLAIN"] | None = None,
    coord_dm_latlon: Literal["FIND_DM_LATLON", "DONT_FIND_DM_LATLON"] | None = None,
    coord_dm_xymin: Literal["FIND_DM_XYMIN", "DONT_FIND_DM_XYMIN"] | None = None,
    coord_dms_latlon: Literal["FIND_DMS_LATLON", "DONT_FIND_DMS_LATLON"] | None = None,
    coord_dms_xysec: Literal["FIND_DMS_XYSEC", "DONT_FIND_DMS_XYSEC"] | None = None,
    coord_dms_xysep: Literal["FIND_DMS_XYSEP", "DONT_FIND_DMS_XYSEP"] | None = None,
    coord_utm: Literal["FIND_UTM_MAINWORLD", "DONT_FIND_UTM_MAINWORLD"] | None = None,
    coord_ups_north: Literal["FIND_UTM_NORTHPOLAR", "DONT_FIND_UTM_NORTHPOLAR"] | None = None,
    coord_ups_south: Literal["FIND_UTM_SOUTHPOLAR", "DONT_FIND_UTM_SOUTHPOLAR"] | None = None,
    coord_mgrs: Literal["FIND_MGRS_MAINWORLD", "DONT_FIND_MGRS_MAINWORLD"] | None = None,
    coord_mgrs_northpolar: Literal["FIND_MGRS_NORTHPOLAR", "DONT_FIND_MGRS_NORTHPOLAR"] | None = None,
    coord_mgrs_southpolar: Literal["FIND_MGRS_SOUTHPOLAR", "DONT_FIND_MGRS_SOUTHPOLAR"] | None = None,
    comma_decimal: Literal["USE_COMMA_DECIMAL_MARK", "USE_DOT_DECIMAL_MARK"] | None = None,
    coord_use_lonlat: Literal["PREFER_LONLAT", "PREFER_LATLON"] | None = None,
    in_coor_system=None,
    in_custom_locations=None,
    fuzzy_match: Literal["USE_FUZZY", "DONT_USE_FUZZY"] | None = None,
    max_features_extracted=None,
    ignore_first_features=None,
    date_monthname: Literal["FIND_DATE_MONTHNAME", "DONT_FIND_DATE_MONTHNAME"] | None = None,
    date_m_d_y: Literal["FIND_DATE_M_D_Y", "DONT_FIND_DATE_M_D_Y"] | None = None,
    date_yyyymmdd: Literal["FIND_DATE_YYYYMMDD", "DONT_FIND_DATE_YYYYMMDD"] | None = None,
    date_yymmdd: Literal["FIND_DATE_YYMMDD", "DONT_FIND_DATE_YYMMDD"] | None = None,
    date_yyjjj: Literal["FIND_DATE_YYJJJ", "DONT_FIND_DATE_YYJJJ"] | None = None,
    max_dates_extracted=None,
    ignore_first_dates=None,
    date_range_begin=None,
    date_range_end=None,
    in_custom_attributes=None,
    file_link=None,
    file_mod_datetime=None,
    pre_text_length=None,
    post_text_length=None,
    std_coord_fmt: Literal[
        "STD_COORD_FMT_DD", "STD_COORD_FMT_DM", "STD_COORD_FMT_DMS", "STD_COORD_FMT_UTM", "STD_COORD_FMT_MGRS"
    ]
    | None = None,
    req_word_breaks: Literal["REQ_WORD_BREAKS", "DONT_REQ_WORD_BREAKS"] | None = None,
) -> Result1[str]:
    """ExtractLocationsDocument_conversion(in_file, out_feature_class, {in_template}, {coord_dd_latlon}, {coord_dd_xydeg}, {coord_dd_xyplain}, {coord_dm_latlon}, {coord_dm_xymin}, {coord_dms_latlon}, {coord_dms_xysec}, {coord_dms_xysep}, {coord_utm}, {coord_ups_north}, {coord_ups_south}, {coord_mgrs}, {coord_mgrs_northpolar}, {coord_mgrs_southpolar}, {comma_decimal}, {coord_use_lonlat}, {in_coor_system}, {in_custom_locations}, {fuzzy_match}, {max_features_extracted}, {ignore_first_features}, {date_monthname}, {date_m_d_y}, {date_yyyymmdd}, {date_yymmdd}, {date_yyjjj}, {max_dates_extracted}, {ignore_first_dates}, {date_range_begin}, {date_range_end}, {in_custom_attributes}, {file_link}, {file_mod_datetime}, {pre_text_length}, {post_text_length}, {std_coord_fmt}, {req_word_breaks})

       Analyzes documents containing unstructured or semistructured text,
       such as email messages, travel forms, and so on, and extracts
       locations to a point feature class.

    INPUTS:
     in_file (File):
         The input file that will be scanned for locations (coordinates or
         custom locations), dates, and custom attributes; or a folder in which
         all files in the folder will be scanned for locations.
     in_template {File}:
         The template file (*.lxttmpl) that determines the setting to use for
         each tool parameter. When a template file is provided, all values
         specified for other parameters will be ignored except those that
         determine the input content that will be processed and the output
         feature class. Some settings that are available in thepane are
         only available
         to this tool when the settings are saved to a template file, and the
         template file is referenced in this parameter. These settings are as
         follows:        Extract LocationsSpatial coordinates in x,y
         format-Allows two sequential numbers such
         as 630084 4833438 or 981075.652ftUS 607151.272ftUS to be recognized as
         coordinates when they are valid for a planar coordinate system
         associated with the input documents. You can specify whether numbers
         with and without units are recognized or only numbers with units of
         measure are recognized as coordinates.Custom coordinate and date
         formats-Allows you to customize how text is
         recognized as a spatial coordinate or a date, particularly when
         written in a language other than English or using a format that is not
         common in the United States. For example, a spatial coordinate written
         as 30 20 10 N x 060 50 40 W can be recognized with a customization to
         recognize the character x as valid text between the latitude and
         longitude. Coordinates and dates such as 60.91°N, 147.34°O and 17
         juillet, 2018 can be recognized when customizations are specified to
         accommodate the language of the documents, in this case French. Also,
         when two-digit years are used, you can control the range of years to
         which they are matched.Preferences for some ambiguous dates-Dates such
         as 10/12/2019 are
         ambiguous because they can be interpreted as either October 12, 2019,
         or December 10, 2019. Some countries use the m/d/yy date format as a
         standard, and other countries use the d/m/yy format. A preference can
         be set for how these ambiguous dates are interpreted, either as m/d/yy
         or d/m/yy, to suit the country of origin of the documents.
         Length of fields in the output feature class-You can specify
         the length of the fields containing text surrounding spatial
         coordinates that are extracted from a document using
         the(pre_text_length in Python) and(post_text_length in Python)
         parameters. Thepane allows you to control the length of several
         additional fields in the attribute table, including fields containing
         dates extracted from the document, the original text that was
         converted to dates, the file name from which the information was
         extracted, and so on. Pre-Text Field LengthPost-Text Field
         LengthExtract Locations
     coord_dd_latlon {Boolean}:
         Specifies whether to search for coordinates stored as decimal degrees
         formatted as latitude and longitude (infrequent false positives).
         Examples are: 33.8N 77.035W and W77N38.88909.FIND_DD_LATLON-The tool
         will search for decimal degrees coordinates
         formatted as latitude and longitude. This is the
         default.DONT_FIND_DD_LATLON-The tool will not search for decimal
         degrees
         coordinates formatted as latitude and longitude.
     coord_dd_xydeg {Boolean}:
         Specifies whether to search for coordinates stored as decimal degrees
         formatted as X Y with degree symbols (infrequent false positives).
         Examples are: 38.8° -77.035° and -077d+38.88909d.FIND_DD_XYDEG-The
         tool will search for decimal degrees coordinates
         formatted as X Y with degree symbols. This is the
         default.DONT_FIND_DD_XYDEG-The tool will not search for decimal
         degrees
         coordinates formatted as X Y with degree symbols.
     coord_dd_xyplain {Boolean}:
         Specifies whether to search for coordinates stored as decimal degrees
         formatted as X Y with no symbols (frequent false positives). Examples
         are: 38.8 -77.035 and -077.0, +38.88909.FIND_DD_XYPLAIN-The tool will
         search for decimal degrees coordinates
         formatted as X Y with no symbols (frequent false positives). This is
         the default.DONT_FIND_DD_XYPLAIN-The tool will not search for decimal
         degrees
         coordinates formatted as X Y with no symbols.
     coord_dm_latlon {Boolean}:
         Specifies whether to search for coordinates stored as degrees decimal
         minutes formatted as latitude and longitude (infrequent false
         positives). Examples are: 3853.3N 7702.100W and
         W7702N3853.3458.FIND_DM_LATLON-The tool will search for degrees
         decimal minutes
         coordinates formatted as latitude and longitude. This is the
         default.DONT_FIND_DM_LATLON-The tool will not search for degrees
         decimal
         minutes coordinates formatted as latitude and longitude.
     coord_dm_xymin {Boolean}:
         Specifies whether to search for coordinates stored as degrees decimal
         minutes formatted as X Y with minutes symbols (infrequent false
         positives). Examples are: 3853' -7702.1' and
         -07702m+3853.3458m.FIND_DM_XYMIN-The tool will search for degrees
         decimal minutes
         coordinates formatted as X Y with minutes symbols. This is the
         default.DONT_FIND_DM_XYMIN-The tool will not search for degrees
         decimal
         minutes coordinates formatted as X Y with minutes symbols.
     coord_dms_latlon {Boolean}:
         Specifies whether to search for coordinates stored as degrees minutes
         seconds formatted as latitude and longitude (infrequent false
         positives). Examples are: 385320.7N 770206.000W and
         W770206N385320.76.FIND_DMS_LATLON-The tool will search for degrees
         minutes seconds
         coordinates formatted as latitude and longitude. This is the
         default.DONT_FIND_DMS_LATLON-The tool will not search for degrees
         minutes
         seconds coordinates formatted as latitude and longitude.
     coord_dms_xysec {Boolean}:
         Specifies whether to search for coordinates stored as degrees minutes
         seconds formatted as X Y with seconds symbols (infrequent false
         positives). Examples are: 385320" -770206.0" and
         -0770206.0s+385320.76s.FIND_DMS_XYSEC-The tool will search for degrees
         minutes seconds
         coordinates formatted as X Y with seconds symbols. This is the
         default.DONT_FIND_DMS_XYSEC-The tool will not search for degrees
         minutes
         seconds coordinates formatted as X Y with seconds symbols.
     coord_dms_xysep {Boolean}:
         Specifies whether to search for coordinates stored as degrees minutes
         seconds formatted as X Y with separators (moderate false positives).
         Examples are: 8:53:20 -77:2:6.0 and
         -077/02/06/+38/53/20.76.FIND_DMS_XYSEP-The tool will search for
         degrees minutes seconds
         coordinates formatted as X Y with separators. This is the
         default.DONT_FIND_DMS_XYSEP-The tool will not search for degrees
         minutes
         seconds coordinates formatted as X Y with separators.
     coord_utm {Boolean}:
         Specifies whether to search for Universal Transverse Mercator (UTM)
         coordinates (infrequent false positives). Examples are: 18S 323503
         4306438 and 18 north 323503.25 4306438.39.FIND_UTM_MAINWORLD-The tool
         will search for UTM coordinates. This is
         the default.DONT_FIND_UTM_MAINWORLD-The tool will not search for UTM
         coordinates.
     coord_ups_north {Boolean}:
         Specifies whether to search for Universal Polar Stereographic (UPS)
         coordinates in the north polar area (infrequent false positives).
         Examples are: Y 2722399 2000000 and north 2722399
         2000000.FIND_UTM_NORTHPOLAR-The tool will search for UPS coordinates
         in the
         north polar area. This is the default.DONT_FIND_UTM_NORTHPOLAR-The
         tool will not search for UPS coordinates
         in the north polar area.
     coord_ups_south {Boolean}:
         Specifies whether to search for Universal Polar Stereographic (UPS)
         coordinates in the south polar area (infrequent false positives).
         Examples are: A 2000000 3168892 and south 2000000
         3168892.FIND_UTM_SOUTHPOLAR-The tool will search for UPS coordinates
         in the
         south polar area. This is the default.DONT_FIND_UTM_SOUTHPOLAR-The
         tool will not search for UPS coordinates
         in the south polar area.
     coord_mgrs {Boolean}:
         Specifies whether to search for Military Grid Reference System (MGRS)
         coordinates (infrequent false positives). Examples are: 18S UJ 13503
         06438 and 18SUJ0306.FIND_MGRS_MAINWORLD-The tool will search for MGRS
         coordinates. This is
         the default.DONT_FIND_MGRS_MAINWORLD-The tool will not search for MGRS
         coordinates.
     coord_mgrs_northpolar {Boolean}:
         Specifies whether to search for Military Grid Reference System (MGRS)
         coordinates in the north polar area (infrequent false positives).
         Examples are: Y TG 56814 69009 and YTG5669.FIND_MGRS_NORTHPOLAR-The
         tool will search for MGRS coordinates in the
         north polar area. This is the default.DONT_FIND_MGRS_NORTHPOLAR-The
         tool will not search for MGRS
         coordinates in the north polar area.
     coord_mgrs_southpolar {Boolean}:
         Specifies whether to search for Military Grid Reference System (MGRS)
         coordinates in the south polar area (moderate false positives).
         Examples are: A TN 56814 30991 and ATN5630.FIND_MGRS_SOUTHPOLAR-The
         tool will search for MGRS coordinates in the
         south polar area. This is the default.DONT_FIND_MGRS_SOUTHPOLAR-The
         tool will not search for MGRS
         coordinates in the south polar area.
     comma_decimal {Boolean}:
         Specifies whether a comma (,) will be recognized as a decimal
         separator. By default, content is scanned for spatial coordinates
         defined by numbers that use a period (.) or a middle dot (·) as the
         decimal separator, for example: Lat 01° 10·80' N Long 103° 28·60' E.
         If you are working with content in which spatial coordinates are
         defined by numbers that use a comma (,) as the decimal separator, for
         example: 52° 8′ 32,14″ N; 5° 24′ 56,09″ E, set this parameter to
         recognize a comma as the decimal separator instead. This parameter is
         not set automatically based on the regional setting for your
         computer's operating system.USE_COMMA_DECIMAL_MARK-A comma will be
         recognized as the decimal
         separator.USE_DOT_DECIMAL_MARK-A period or a middle dot will be
         recognized as
         the decimal separator. This is the default.
     coord_use_lonlat {Boolean}:
         When numbers resemble x,y coordinates, both numbers are less than 90,
         and there are no symbols or notations to indicate which number
         represents the latitude or longitude, results can be ambiguous.
         Interpret the numbers as a longitude-latitude coordinate (x,y) instead
         of a latitude-longitude coordinate (y,x).PREFER_LONLAT-x,y coordinates
         will be interpreted as longitude-
         latitude.PREFER_LATLON-x,y coordinates will be interpreted as
         latitude-
         longitude. This is the default.
     in_coor_system {Spatial Reference}:
         The coordinate system that will be used to interpret the spatial
         coordinates defined in the input. GCS-WGS-84 is the default.
     in_custom_locations {File}:
         The custom location file (.lxtgaz) that will be used when scanning the
         input content. A point is created to represent each occurrence of each
         place name in the custom location file up to the limits established by
         other tool parameters.
     fuzzy_match {Boolean}:
         Specifies whether fuzzy matching will be used for searching the custom
         location file.USE_FUZZY-Fuzzy matching will be used when searching the
         custom
         location file.DONT_USE_FUZZY-Exact matching will be used when
         searching the custom
         location file. This is the default.
     max_features_extracted {Long}:
         The maximum number of features that can be extracted. The tool will
         stop scanning the input content for locations when the maximum number
         is reached. When running as a geoprocessing service, the service and
         the server may have separate limits on the number of features allowed.
     ignore_first_features {Long}:
         The number of features detected and ignored before extracting all
         other features. This parameter can be used to focus the search on a
         specific portion of the data.
     date_monthname {Boolean}:
         Specifies whether to search for dates in which the month name appears
         (infrequent false positives). 12 May 2003 and January 15, 1997 are
         examples.FIND_DATE_MONTHNAME-The tool will search for dates in which
         the month
         name appears. This is the default.DONT_FIND_DATE_MONTHNAME-The tool
         will not search for dates in which
         the month name appears.
     date_m_d_y {Boolean}:
         Specifies whether to search for dates in which numbers are in the
         M/D/Y or D/M/Y format (moderate false positives). 5/12/03 and
         1-15-1997 are examples.FIND_DATE_M_D_Y-The tool will search for dates
         in which numbers are in
         the M/D/Y or D/M/Y format (moderate false positives). This is the
         default.DONT_FIND_DATE_M_D_Y-The tool will not search for dates in
         which
         numbers are in the M/D/Y or D/M/Y format.
     date_yyyymmdd {Boolean}:
         Specifies whether to search for dates in which numbers are in the
         YYYYMMDD format (moderate false positives). 20030512 and 19970115 are
         examples.FIND_DATE_YYYYMMDD-The tool will search for dates in which
         numbers are
         in the YYYYMMDD format (moderate false positives). This is the
         default.DONT_FIND_DATE_YYYYMMDD-The tool will not search for dates in
         which
         numbers are in the YYYYMMDD format.
     date_yymmdd {Boolean}:
         Specifies whether to search for dates in which numbers are in the
         YYMMDD format (frequent false positives). 030512 and 970115 are
         examples.FIND_DATE_YYMMDD-The tool will search for dates in which
         numbers are
         in the YYMMDD format (frequent false positives). This is the
         default.DONT_FIND_DATE_YYMMDD-The tool will not search for dates in
         which
         numbers are in the YYMMDD format.
     date_yyjjj {Boolean}:
         Specifies whether to search for dates in which numbers are in the
         YYJJJ or YYYYJJJ format (frequent false positives). 03132 and 97015
         are examples.FIND_DATE_YYJJJ-The tool will search for dates in which
         numbers are in
         the YYJJJ or YYYYJJJ format (frequent false positives). This is the
         default.DONT_FIND_DATE_YYJJJ-The tool will not search for dates in
         which
         numbers are in the YYJJJ or YYYYJJJ format.
     max_dates_extracted {Long}:
         The maximum number of dates that will be extracted.
     ignore_first_dates {Long}:
         The number of dates that will be detected and ignored before
         extracting all other dates.
     date_range_begin {Date}:
         The earliest acceptable date to extract. Detected dates matching this
         value or later will be extracted.
     date_range_end {Date}:
         The latest acceptable date to extract. Detected dates matching this
         value or earlier will be extracted.
     in_custom_attributes {File}:
         The custom attribute file (.lxtca) that will be used to scan the input
         content. Fields will be created in the output feature class's
         attribute table for all custom attributes defined in the file. When
         the input content is scanned, it will be examined to see if it
         contains text associated with all custom attributes specified in the
         file. When a match is found, the appropriate text is extracted from
         the input content and stored in the appropriate field.
     file_link {String}:
         The file path that will be used as the file name in the output
         data when theparameter (in_file in Python) is transferred to the
         server. If this parameter is not specified, the path of thewill be
         used, which may be an unreachable folder on a server. This parameter
         has no effect when theis not specified. Input FileInput
         FileInput File
     file_mod_datetime {Date}:
         The UTC date and time that the file was modified will be used
         as the modified attribute in the output data when theparameter
         (in_file in Python) is transferred to the server. If this parameter is
         not specified, the current modified time of the input file will be
         used. This parameter has no effect when theis not specified.
         Input FileInput File
     pre_text_length {Long}:
         Content is extracted from the input document to provide
         context for the location that was found. This parameter defines the
         maximum number of characters that will be extracted preceding the text
         that defines the location. The extracted text is stored in thefield in
         the output feature class's attribute table. The default is 254.
         Thefield's data type will also have this length. The length of a text
         field in a shapefile is limited to 254 characters; when the output is
         a shapefile, a larger number of characters will be truncated to 254.
         Pre-TextPre-Text
     post_text_length {Long}:
         Content is extracted from the input document to provide
         context for the location that was found. This parameter defines the
         maximum number of characters that will be extracted following the text
         that defines the location. The extracted text is stored in thefield in
         the output feature class's attribute table. The default is 254.
         Thefield's data type will also have this length. The length of a text
         field in a shapefile is limited to 254 characters; when the output is
         a shapefile, a larger number of characters will be truncated to 254.
         Post-TextPost-Text
     std_coord_fmt {String}:
         Specifies the coordinate format that will be used to store the
         coordinate location. A standard representation of the spatial
         coordinate that defines the point feature is recorded in a field in
         the attribute table.STD_COORD_FMT_DD-The coordinate location is
         recorded in decimal
         degrees format. This is the default.STD_COORD_FMT_DM-The coordinate
         location is recorded in degrees
         decimal minutes format.STD_COORD_FMT_DMS-The coordinate location is
         recorded in degrees
         minutes seconds format.STD_COORD_FMT_UTM-The coordinate location is
         recorded in Universal
         Transverse Mercator format.STD_COORD_FMT_MGRS-The coordinate location
         is recorded in Military
         Grid Reference System format.
     req_word_breaks {Boolean}:
         Specifies whether to search for text using word breaks. A word break
         occurs when words (text) are bounded by whitespace or punctuation
         characters as in European languages.This setting can produce frequent
         false positives or infrequent false
         positives depending on the language of the text. For example, when
         word breaks are not required, the English text Bernard will produce a
         match against the text San Bernardino, which would likely be
         considered a false positive. However, when text is written using a
         language that does not use word breaks, you cannot find words if word
         breaks are required. For example, with the text I flew to Tokyo in
         Japanese, 私は東京に飛んで, you would only be able to find the word Tokyo, 東京,
         when word breaks are not required.REQ_WORD_BREAKS-The tool will search
         for words that are bounded by
         whitespace or punctuation characters. This is the
         default.DONT_REQ_WORD_BREAKS-The tool will not search for words that
         are
         bounded by whitespace or punctuation characters.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class containing point features that represent the
         locations that were found."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExtractLocationsDocument_conversion(
                *gp_fixargs(
                    (
                        in_file,
                        out_feature_class,
                        in_template,
                        coord_dd_latlon,
                        coord_dd_xydeg,
                        coord_dd_xyplain,
                        coord_dm_latlon,
                        coord_dm_xymin,
                        coord_dms_latlon,
                        coord_dms_xysec,
                        coord_dms_xysep,
                        coord_utm,
                        coord_ups_north,
                        coord_ups_south,
                        coord_mgrs,
                        coord_mgrs_northpolar,
                        coord_mgrs_southpolar,
                        comma_decimal,
                        coord_use_lonlat,
                        in_coor_system,
                        in_custom_locations,
                        fuzzy_match,
                        max_features_extracted,
                        ignore_first_features,
                        date_monthname,
                        date_m_d_y,
                        date_yyyymmdd,
                        date_yymmdd,
                        date_yyjjj,
                        max_dates_extracted,
                        ignore_first_dates,
                        date_range_begin,
                        date_range_end,
                        in_custom_attributes,
                        file_link,
                        file_mod_datetime,
                        pre_text_length,
                        post_text_length,
                        std_coord_fmt,
                        req_word_breaks,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExtractLocationsText_conversion", None)
def ExtractLocationsText(
    in_text=None,
    out_feature_class=None,
    in_template=None,
    coord_dd_latlon: Literal["FIND_DD_LATLON", "DONT_FIND_DD_LATLON"] | None = None,
    coord_dd_xydeg: Literal["FIND_DD_XYDEG", "DONT_FIND_DD_XYDEG"] | None = None,
    coord_dd_xyplain: Literal["FIND_DD_XYPLAIN", "DONT_FIND_DD_XYPLAIN"] | None = None,
    coord_dm_latlon: Literal["FIND_DM_LATLON", "DONT_FIND_DM_LATLON"] | None = None,
    coord_dm_xymin: Literal["FIND_DM_XYMIN", "DONT_FIND_DM_XYMIN"] | None = None,
    coord_dms_latlon: Literal["FIND_DMS_LATLON", "DONT_FIND_DMS_LATLON"] | None = None,
    coord_dms_xysec: Literal["FIND_DMS_XYSEC", "DONT_FIND_DMS_XYSEC"] | None = None,
    coord_dms_xysep: Literal["FIND_DMS_XYSEP", "DONT_FIND_DMS_XYSEP"] | None = None,
    coord_utm: Literal["FIND_UTM_MAINWORLD", "DONT_FIND_UTM_MAINWORLD"] | None = None,
    coord_ups_north: Literal["FIND_UTM_NORTHPOLAR", "DONT_FIND_UTM_NORTHPOLAR"] | None = None,
    coord_ups_south: Literal["FIND_UTM_SOUTHPOLAR", "DONT_FIND_UTM_SOUTHPOLAR"] | None = None,
    coord_mgrs: Literal["FIND_MGRS_MAINWORLD", "DONT_FIND_MGRS_MAINWORLD"] | None = None,
    coord_mgrs_northpolar: Literal["FIND_MGRS_NORTHPOLAR", "DONT_FIND_MGRS_NORTHPOLAR"] | None = None,
    coord_mgrs_southpolar: Literal["FIND_MGRS_SOUTHPOLAR", "DONT_FIND_MGRS_SOUTHPOLAR"] | None = None,
    comma_decimal: Literal["USE_COMMA_DECIMAL_MARK", "USE_DOT_DECIMAL_MARK"] | None = None,
    coord_use_lonlat: Literal["PREFER_LONLAT", "PREFER_LATLON"] | None = None,
    in_coor_system=None,
    in_custom_locations=None,
    fuzzy_match: Literal["USE_FUZZY", "DONT_USE_FUZZY"] | None = None,
    max_features_extracted=None,
    ignore_first_features=None,
    date_monthname: Literal["FIND_DATE_MONTHNAME", "DONT_FIND_DATE_MONTHNAME"] | None = None,
    date_m_d_y: Literal["FIND_DATE_M_D_Y", "DONT_FIND_DATE_M_D_Y"] | None = None,
    date_yyyymmdd: Literal["FIND_DATE_YYYYMMDD", "DONT_FIND_DATE_YYYYMMDD"] | None = None,
    date_yymmdd: Literal["FIND_DATE_YYMMDD", "DONT_FIND_DATE_YYMMDD"] | None = None,
    date_yyjjj: Literal["FIND_DATE_YYJJJ", "DONT_FIND_DATE_YYJJJ"] | None = None,
    max_dates_extracted=None,
    ignore_first_dates=None,
    date_range_begin=None,
    date_range_end=None,
    in_custom_attributes=None,
    file_link=None,
    file_mod_datetime=None,
    pre_text_length=None,
    post_text_length=None,
    std_coord_fmt: Literal[
        "STD_COORD_FMT_DD", "STD_COORD_FMT_DM", "STD_COORD_FMT_DMS", "STD_COORD_FMT_UTM", "STD_COORD_FMT_MGRS"
    ]
    | None = None,
    req_word_breaks: Literal["REQ_WORD_BREAKS", "DONT_REQ_WORD_BREAKS"] | None = None,
) -> Result1[str]:
    """ExtractLocationsText_conversion(in_text, out_feature_class, {in_template}, {coord_dd_latlon}, {coord_dd_xydeg}, {coord_dd_xyplain}, {coord_dm_latlon}, {coord_dm_xymin}, {coord_dms_latlon}, {coord_dms_xysec}, {coord_dms_xysep}, {coord_utm}, {coord_ups_north}, {coord_ups_south}, {coord_mgrs}, {coord_mgrs_northpolar}, {coord_mgrs_southpolar}, {comma_decimal}, {coord_use_lonlat}, {in_coor_system}, {in_custom_locations}, {fuzzy_match}, {max_features_extracted}, {ignore_first_features}, {date_monthname}, {date_m_d_y}, {date_yyyymmdd}, {date_yymmdd}, {date_yyjjj}, {max_dates_extracted}, {ignore_first_dates}, {date_range_begin}, {date_range_end}, {in_custom_attributes}, {file_link}, {file_mod_datetime}, {pre_text_length}, {post_text_length}, {std_coord_fmt}, {req_word_breaks})

       Analyzes input text or a text file and extracts locations to a point
       feature class

    INPUTS:
     in_text (String):
         The text that will be scanned for locations (coordinates or custom
         locations), dates, and custom attributes; or text defining a file
         path, whose contents will be scanned for locations. For geoprocessing
         services, when a file path is provided, the file must be accessible
         from the service, as the file is not transferred to the server.
     in_template {File}:
         The template file (*.lxttmpl) that determines the setting to use for
         each tool parameter. When a template file is provided, all values
         specified for other parameters will be ignored except those that
         determine the input content that will be processed and the output
         feature class. Some settings that are available in thepane are
         only available
         to this tool when the settings are saved to a template file, and the
         template file is referenced in this parameter. These settings are as
         follows:        Extract LocationsSpatial coordinates in x,y
         format-Allows two sequential numbers such
         as 630084 4833438 or 981075.652ftUS 607151.272ftUS to be recognized as
         coordinates when they are valid for a planar coordinate system
         associated with the input documents. You can specify whether numbers
         with and without units are recognized or only numbers with units of
         measure are recognized as coordinates.Custom coordinate and date
         formats-Allows you to customize how text is
         recognized as a spatial coordinate or a date, particularly when
         written in a language other than English or using a format that is not
         common in the United States. For example, a spatial coordinate written
         as 30 20 10 N x 060 50 40 W can be recognized with a customization to
         recognize the character x as valid text between the latitude and
         longitude. Coordinates and dates such as 60.91°N, 147.34°O and 17
         juillet, 2018 can be recognized when customizations are specified to
         accommodate the language of the documents, in this case French. Also,
         when two-digit years are used, you can control the range of years to
         which they are matched.Preferences for some ambiguous dates-Dates such
         as 10/12/2019 are
         ambiguous because they can be interpreted as either October 12, 2019,
         or December 10, 2019. Some countries use the m/d/yy date format as a
         standard, and other countries use the d/m/yy format. A preference can
         be set for how these ambiguous dates are interpreted, either as m/d/yy
         or d/m/yy, to suit the country of origin of the documents.
         Length of fields in the output feature class-You can specify
         the length of the fields containing text surrounding spatial
         coordinates that are extracted from a document using
         the(pre_text_length in Python) and(post_text_length in Python)
         parameters. Thepane allows you to control the length of several
         additional fields in the attribute table, including fields containing
         dates extracted from the document, the original text that was
         converted to dates, the file name from which the information was
         extracted, and so on. Pre-Text Field LengthPost-Text Field
         LengthExtract Locations
     coord_dd_latlon {Boolean}:
         Specifies whether to search for coordinates stored as decimal degrees
         formatted as latitude and longitude (infrequent false positives).
         Examples are: 33.8N 77.035W and W77N38.88909.FIND_DD_LATLON-The tool
         will search for decimal degrees coordinates
         formatted as latitude and longitude. This is the
         default.DONT_FIND_DD_LATLON-The tool will not search for decimal
         degrees
         coordinates formatted as latitude and longitude.
     coord_dd_xydeg {Boolean}:
         Specifies whether to search for coordinates stored as decimal degrees
         formatted as X Y with degree symbols (infrequent false positives).
         Examples are: 38.8° -77.035° and -077d+38.88909d.FIND_DD_XYDEG-The
         tool will search for decimal degrees coordinates
         formatted as X Y with degree symbols. This is the
         default.DONT_FIND_DD_XYDEG-The tool will not search for decimal
         degrees
         coordinates formatted as X Y with degree symbols.
     coord_dd_xyplain {Boolean}:
         Specifies whether to search for coordinates stored as decimal degrees
         formatted as X Y with no symbols (frequent false positives). Examples
         are: 38.8 -77.035 and -077.0, +38.88909.FIND_DD_XYPLAIN-The tool will
         search for decimal degrees coordinates
         formatted as X Y with no symbols (frequent false positives). This is
         the default.DONT_FIND_DD_XYPLAIN-The tool will not search for decimal
         degrees
         coordinates formatted as X Y with no symbols.
     coord_dm_latlon {Boolean}:
         Specifies whether to search for coordinates stored as degrees decimal
         minutes formatted as latitude and longitude (infrequent false
         positives). Examples are: 3853.3N 7702.100W and
         W7702N3853.3458.FIND_DM_LATLON-The tool will search for degrees
         decimal minutes
         coordinates formatted as latitude and longitude. This is the
         default.DONT_FIND_DM_LATLON-The tool will not search for degrees
         decimal
         minutes coordinates formatted as latitude and longitude.
     coord_dm_xymin {Boolean}:
         Specifies whether to search for coordinates stored as degrees decimal
         minutes formatted as X Y with minutes symbols (infrequent false
         positives). Examples are: 3853' -7702.1' and
         -07702m+3853.3458m.FIND_DM_XYMIN-The tool will search for degrees
         decimal minutes
         coordinates formatted as X Y with minutes symbols. This is the
         default.DONT_FIND_DM_XYMIN-The tool will not search for degrees
         decimal
         minutes coordinates formatted as X Y with minutes symbols.
     coord_dms_latlon {Boolean}:
         Specifies whether to search for coordinates stored as degrees minutes
         seconds formatted as latitude and longitude (infrequent false
         positives). Examples are: 385320.7N 770206.000W and
         W770206N385320.76.FIND_DMS_LATLON-The tool will search for degrees
         minutes seconds
         coordinates formatted as latitude and longitude. This is the
         default.DONT_FIND_DMS_LATLON-The tool will not search for degrees
         minutes
         seconds coordinates formatted as latitude and longitude.
     coord_dms_xysec {Boolean}:
         Specifies whether to search for coordinates stored as degrees minutes
         seconds formatted as X Y with seconds symbols (infrequent false
         positives). Examples are: 385320" -770206.0" and
         -0770206.0s+385320.76s.FIND_DMS_XYSEC-The tool will search for degrees
         minutes seconds
         coordinates formatted as X Y with seconds symbols. This is the
         default.DONT_FIND_DMS_XYSEC-The tool will not search for degrees
         minutes
         seconds coordinates formatted as X Y with seconds symbols.
     coord_dms_xysep {Boolean}:
         Specifies whether to search for coordinates stored as degrees minutes
         seconds formatted as X Y with separators (moderate false positives).
         Examples are: 8:53:20 -77:2:6.0 and
         -077/02/06/+38/53/20.76.FIND_DMS_XYSEP-The tool will search for
         degrees minutes seconds
         coordinates formatted as X Y with separators. This is the
         default.DONT_FIND_DMS_XYSEP-The tool will not search for degrees
         minutes
         seconds coordinates formatted as X Y with separators.
     coord_utm {Boolean}:
         Specifies whether to search for Universal Transverse Mercator (UTM)
         coordinates (infrequent false positives). Examples are: 18S 323503
         4306438 and 18 north 323503.25 4306438.39.FIND_UTM_MAINWORLD-The tool
         will search for UTM coordinates. This is
         the default.DONT_FIND_UTM_MAINWORLD-The tool will not search for UTM
         coordinates.
     coord_ups_north {Boolean}:
         Specifies whether to search for Universal Polar Stereographic (UPS)
         coordinates in the north polar area (infrequent false positives).
         Examples are: Y 2722399 2000000 and north 2722399
         2000000.FIND_UTM_NORTHPOLAR-The tool will search for UPS coordinates
         in the
         north polar area. This is the default.DONT_FIND_UTM_NORTHPOLAR-The
         tool will not search for UPS coordinates
         in the north polar area.
     coord_ups_south {Boolean}:
         Specifies whether to search for Universal Polar Stereographic (UPS)
         coordinates in the south polar area (infrequent false positives).
         Examples are: A 2000000 3168892 and south 2000000
         3168892.FIND_UTM_SOUTHPOLAR-The tool will search for UPS coordinates
         in the
         south polar area. This is the default.DONT_FIND_UTM_SOUTHPOLAR-The
         tool will not search for UPS coordinates
         in the south polar area.
     coord_mgrs {Boolean}:
         Specifies whether to search for Military Grid Reference System (MGRS)
         coordinates (infrequent false positives). Examples are: 18S UJ 13503
         06438 and 18SUJ0306.FIND_MGRS_MAINWORLD-The tool will search for MGRS
         coordinates. This is
         the default.DONT_FIND_MGRS_MAINWORLD-The tool will not search for MGRS
         coordinates.
     coord_mgrs_northpolar {Boolean}:
         Specifies whether to search for Military Grid Reference System (MGRS)
         coordinates in the north polar area (infrequent false positives).
         Examples are: Y TG 56814 69009 and YTG5669.FIND_MGRS_NORTHPOLAR-The
         tool will search for MGRS coordinates in the
         north polar area. This is the default.DONT_FIND_MGRS_NORTHPOLAR-The
         tool will not search for MGRS
         coordinates in the north polar area.
     coord_mgrs_southpolar {Boolean}:
         Specifies whether to search for Military Grid Reference System (MGRS)
         coordinates in the south polar area (moderate false positives).
         Examples are: A TN 56814 30991 and ATN5630.FIND_MGRS_SOUTHPOLAR-The
         tool will search for MGRS coordinates in the
         south polar area. This is the default.DONT_FIND_MGRS_SOUTHPOLAR-The
         tool will not search for MGRS
         coordinates in the south polar area.
     comma_decimal {Boolean}:
         Specifies whether a comma (,) will be recognized as a decimal
         separator. By default, content is scanned for spatial coordinates
         defined by numbers that use a period (.) or a middle dot (·) as the
         decimal separator, for example: Lat 01° 10·80' N Long 103° 28·60' E.
         If you are working with content in which spatial coordinates are
         defined by numbers that use a comma (,) as the decimal separator, for
         example: 52° 8′ 32,14″ N; 5° 24′ 56,09″ E, set this parameter to
         recognize a comma as the decimal separator instead. This parameter is
         not set automatically based on the regional setting for your
         computer's operating system.USE_COMMA_DECIMAL_MARK-A comma will be
         recognized as the decimal
         separator.USE_DOT_DECIMAL_MARK-A period or a middle dot will be
         recognized as
         the decimal separator. This is the default.
     coord_use_lonlat {Boolean}:
         When numbers resemble x,y coordinates, both numbers are less than 90,
         and there are no symbols or notations to indicate which number
         represents the latitude or longitude, results can be ambiguous.
         Interpret the numbers as a longitude-latitude coordinate (x,y) instead
         of a latitude-longitude coordinate (y,x).PREFER_LONLAT-x,y coordinates
         will be interpreted as longitude-
         latitude.PREFER_LATLON-x,y coordinates will be interpreted as
         latitude-
         longitude. This is the default.
     in_coor_system {Spatial Reference}:
         The coordinate system that will be used to interpret the spatial
         coordinates defined in the input. GCS-WGS-84 is the default.
     in_custom_locations {File}:
         The custom location file (.lxtgaz) that will be used when scanning the
         input content. A point is created to represent each occurrence of each
         place name in the custom location file up to the limits established by
         other tool parameters.
     fuzzy_match {Boolean}:
         Specifies whether fuzzy matching will be used for searching the custom
         location file.USE_FUZZY-Fuzzy matching will be used when searching the
         custom
         location file.DONT_USE_FUZZY-Exact matching will be used when
         searching the custom
         location file. This is the default.
     max_features_extracted {Long}:
         The maximum number of features that can be extracted. The tool will
         stop scanning the input content for locations when the maximum number
         is reached. When running as a geoprocessing service, the service and
         the server may have separate limits on the number of features allowed.
     ignore_first_features {Long}:
         The number of features detected and ignored before extracting all
         other features. This parameter can be used to focus the search on a
         specific portion of the data.
     date_monthname {Boolean}:
         Specifies whether to search for dates in which the month name appears
         (infrequent false positives). 12 May 2003 and January 15, 1997 are
         examples.FIND_DATE_MONTHNAME-The tool will search for dates in which
         the month
         name appears. This is the default.DONT_FIND_DATE_MONTHNAME-The tool
         will not search for dates in which
         the month name appears.
     date_m_d_y {Boolean}:
         Specifies whether to search for dates in which numbers are in the
         M/D/Y or D/M/Y format (moderate false positives). 5/12/03 and
         1-15-1997 are examples.FIND_DATE_M_D_Y-The tool will search for dates
         in which numbers are in
         the M/D/Y or D/M/Y format (moderate false positives). This is the
         default.DONT_FIND_DATE_M_D_Y-The tool will not search for dates in
         which
         numbers are in the M/D/Y or D/M/Y format.
     date_yyyymmdd {Boolean}:
         Specifies whether to search for dates in which numbers are in the
         YYYYMMDD format (moderate false positives). 20030512 and 19970115 are
         examples.FIND_DATE_YYYYMMDD-The tool will search for dates in which
         numbers are
         in the YYYYMMDD format (moderate false positives). This is the
         default.DONT_FIND_DATE_YYYYMMDD-The tool will not search for dates in
         which
         numbers are in the YYYYMMDD format.
     date_yymmdd {Boolean}:
         Specifies whether to search for dates in which numbers are in the
         YYMMDD format (frequent false positives). 030512 and 970115 are
         examples.FIND_DATE_YYMMDD-The tool will search for dates in which
         numbers are
         in the YYMMDD format (frequent false positives). This is the
         default.DONT_FIND_DATE_YYMMDD-The tool will not search for dates in
         which
         numbers are in the YYMMDD format.
     date_yyjjj {Boolean}:
         Specifies whether to search for dates in which numbers are in the
         YYJJJ or YYYYJJJ format (frequent false positives). 03132 and 97015
         are examples.FIND_DATE_YYJJJ-The tool will search for dates in which
         numbers are in
         the YYJJJ or YYYYJJJ format (frequent false positives). This is the
         default.DONT_FIND_DATE_YYJJJ-The tool will not search for dates in
         which
         numbers are in the YYJJJ or YYYYJJJ format.
     max_dates_extracted {Long}:
         The maximum number of dates that will be extracted.
     ignore_first_dates {Long}:
         The number of dates that will be detected and ignored before
         extracting all other dates.
     date_range_begin {Date}:
         The earliest acceptable date to extract. Detected dates matching this
         value or later will be extracted.
     date_range_end {Date}:
         The latest acceptable date to extract. Detected dates matching this
         value or earlier will be extracted.
     in_custom_attributes {File}:
         The custom attribute file (.lxtca) that will be used to scan the input
         content. Fields will be created in the output feature class's
         attribute table for all custom attributes defined in the file. When
         the input content is scanned, it will be examined to see if it
         contains text associated with all custom attributes specified in the
         file. When a match is found, the appropriate text is extracted from
         the input content and stored in the appropriate field.
     file_link {String}:
         The file path that will be used as the file name in the output
         data when theparameter (in_file in Python) is transferred to the
         server. If this parameter is not specified, the path of thewill be
         used, which may be an unreachable folder on a server. This parameter
         has no effect when theis not specified. Input FileInput
         FileInput File
     file_mod_datetime {Date}:
         The UTC date and time that the file was modified will be used
         as the modified attribute in the output data when theparameter
         (in_file in Python) is transferred to the server. If this parameter is
         not specified, the current modified time of the input file will be
         used. This parameter has no effect when theis not specified.
         Input FileInput File
     pre_text_length {Long}:
         Content is extracted from the input document to provide
         context for the location that was found. This parameter defines the
         maximum number of characters that will be extracted preceding the text
         that defines the location. The extracted text is stored in thefield in
         the output feature class's attribute table. The default is 254.
         Thefield's data type will also have this length. The length of a text
         field in a shapefile is limited to 254 characters; when the output is
         a shapefile, a larger number of characters will be truncated to 254.
         Pre-TextPre-Text
     post_text_length {Long}:
         Content is extracted from the input document to provide
         context for the location that was found. This parameter defines the
         maximum number of characters that will be extracted following the text
         that defines the location. The extracted text is stored in thefield in
         the output feature class's attribute table. The default is 254.
         Thefield's data type will also have this length. The length of a text
         field in a shapefile is limited to 254 characters; when the output is
         a shapefile, a larger number of characters will be truncated to 254.
         Post-TextPost-Text
     std_coord_fmt {String}:
         Specifies the coordinate format that will be used to store the
         coordinate location. A standard representation of the spatial
         coordinate that defines the point feature is recorded in a field in
         the attribute table.STD_COORD_FMT_DD-The coordinate location is
         recorded in decimal
         degrees format. This is the default.STD_COORD_FMT_DM-The coordinate
         location is recorded in degrees
         decimal minutes format.STD_COORD_FMT_DMS-The coordinate location is
         recorded in degrees
         minutes seconds format.STD_COORD_FMT_UTM-The coordinate location is
         recorded in Universal
         Transverse Mercator format.STD_COORD_FMT_MGRS-The coordinate location
         is recorded in Military
         Grid Reference System format.
     req_word_breaks {Boolean}:
         Specifies whether to search for text using word breaks. A word break
         occurs when words (text) are bounded by whitespace or punctuation
         characters as in European languages.This setting can produce frequent
         false positives or infrequent false
         positives depending on the language of the text. For example, when
         word breaks are not required, the English text Bernard will produce a
         match against the text San Bernardino, which would likely be
         considered a false positive. However, when text is written using a
         language that does not use word breaks, you cannot find words if word
         breaks are required. For example, with the text I flew to Tokyo in
         Japanese, 私は東京に飛んで, you would only be able to find the word Tokyo, 東京,
         when word breaks are not required.REQ_WORD_BREAKS-The tool will search
         for words that are bounded by
         whitespace or punctuation characters. This is the
         default.DONT_REQ_WORD_BREAKS-The tool will not search for words that
         are
         bounded by whitespace or punctuation characters.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class containing point features that represent the
         locations that were found."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExtractLocationsText_conversion(
                *gp_fixargs(
                    (
                        in_text,
                        out_feature_class,
                        in_template,
                        coord_dd_latlon,
                        coord_dd_xydeg,
                        coord_dd_xyplain,
                        coord_dm_latlon,
                        coord_dm_xymin,
                        coord_dms_latlon,
                        coord_dms_xysec,
                        coord_dms_xysep,
                        coord_utm,
                        coord_ups_north,
                        coord_ups_south,
                        coord_mgrs,
                        coord_mgrs_northpolar,
                        coord_mgrs_southpolar,
                        comma_decimal,
                        coord_use_lonlat,
                        in_coor_system,
                        in_custom_locations,
                        fuzzy_match,
                        max_features_extracted,
                        ignore_first_features,
                        date_monthname,
                        date_m_d_y,
                        date_yyyymmdd,
                        date_yymmdd,
                        date_yyjjj,
                        max_dates_extracted,
                        ignore_first_dates,
                        date_range_begin,
                        date_range_end,
                        in_custom_attributes,
                        file_link,
                        file_mod_datetime,
                        pre_text_length,
                        post_text_length,
                        std_coord_fmt,
                        req_word_breaks,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FeatureClassToFeatureClass_conversion", None)
def FeatureClassToFeatureClass(
    in_features=None,
    out_path=None,
    out_name=None,
    where_clause=None,
    field_mapping=None,
    config_keyword=None,
) -> Result1[str]:
    """FeatureClassToFeatureClass_conversion(in_features, out_path, out_name, {where_clause}, {field_mapping}, {config_keyword})

       Converts a feature class or feature layer to a feature class.

    INPUTS:
     in_features (Feature Layer):
         The feature class or feature layer that will be converted.
     out_path (Workspace / Feature Dataset):
         The location where the output feature class will be created. This can
         be either a geodatabase or a folder. If the output location is a
         folder, the output will be a shapefile.
     out_name (String):
         The name of the output feature class.
     where_clause {SQL Expression}:
         An SQL expression used to select a subset of features. For more
         information on SQL syntax see the help topic SQL reference for query
         expressions used in ArcGIS.
     field_mapping {Field Mappings}:
         The fields that will be transferred to the output dataset with their
         respective properties and source fields. The output includes all
         fields from the input dataset by default.Use the field map to add,
         delete, rename, and reorder fields, as well
         as change other field properties.The field map can also be used to
         combine values from two or more
         input fields into a single output field.In Python, use the
         FieldMappings class to define this parameter.
     config_keyword {String}:
         Specifies the default storage parameters (configurations) for
         geodatabases in a relational database management system (RDBMS). This
         setting is applicable only when using enterprise geodatabase
         tables.Configuration keywords are set by the database administrator."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FeatureClassToFeatureClass_conversion(
                *gp_fixargs((in_features, out_path, out_name, where_clause, field_mapping, config_keyword), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FeatureClassToGeodatabase_conversion", None)
def FeatureClassToGeodatabase(
    Input_Features=None,
    Output_Geodatabase=None,
) -> Result1[str]:
    """FeatureClassToGeodatabase_conversion(Input_Features;Input_Features..., Output_Geodatabase)

       Converts one or more feature classes or feature layers to geodatabase
       feature classes.

    INPUTS:
     Input_Features (Feature Layer):
         One or more feature classes or feature layers that will be imported
         into a geodatabase.
     Output_Geodatabase (Workspace / Feature Dataset):
         The output or destination geodatabase."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FeatureClassToGeodatabase_conversion(*gp_fixargs((Input_Features, Output_Geodatabase), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MobileGdbToFileGdb_conversion", None)
def MobileGdbToFileGdb(
    in_mobile_gdb=None,
    out_file_gdb=None,
) -> Result1[str]:
    """MobileGdbToFileGdb_conversion(in_mobile_gdb, out_file_gdb)

       Copies the contents of a mobile geodatabase to a new file geodatabase.

    INPUTS:
     in_mobile_gdb (File):
         The mobile geodatabase with the contents that will be copied to a new
         file geodatabase.

    OUTPUTS:
     out_file_gdb (File):
         The name and location of the output file geodatabase, for example,
         c:\\temp\\outputGeodatabases\\copiedFGDB.gdb."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MobileGdbToFileGdb_conversion(*gp_fixargs((in_mobile_gdb, out_file_gdb), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RasterToGeodatabase_conversion", None)
def RasterToGeodatabase(
    Input_Rasters=None,
    Output_Geodatabase=None,
    Configuration_Keyword=None,
) -> Result1[str]:
    """RasterToGeodatabase_conversion(Input_Rasters;Input_Rasters..., Output_Geodatabase, {Configuration_Keyword})

       Loads raster datasets into a geodatabase.

    INPUTS:
     Input_Rasters (Raster Dataset / Raster Layer):
         The input raster datasets.
     Output_Geodatabase (Workspace):
         The output or destination geodatabase.
     Configuration_Keyword {String}:
         The storage parameters (configuration) for a geodatabase.
         Configuration keywords are set up by your database administrator."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RasterToGeodatabase_conversion(
                *gp_fixargs((Input_Rasters, Output_Geodatabase, Configuration_Keyword), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TableToGeodatabase_conversion", None)
def TableToGeodatabase(
    Input_Table=None,
    Output_Geodatabase=None,
) -> Result1[str]:
    """TableToGeodatabase_conversion(Input_Table;Input_Table..., Output_Geodatabase)

       Converts one or more tables to geodatabase tables in an output
       geodatabase.

    INPUTS:
     Input_Table (Table View):
         The list of tables that will be converted to geodatabase tables. Input
         tables can be INFO, dBASE, OLE DB, geodatabase tables, or table views.
     Output_Geodatabase (Workspace):
         The destination geodatabase where the tables will be placed."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TableToGeodatabase_conversion(*gp_fixargs((Input_Table, Output_Geodatabase), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TableToTable_conversion", None)
def TableToTable(
    in_rows=None,
    out_path=None,
    out_name=None,
    where_clause=None,
    field_mapping=None,
    config_keyword=None,
) -> Result1[str]:
    """TableToTable_conversion(in_rows, out_path, out_name, {where_clause}, {field_mapping}, {config_keyword})

       Exports the rows of a table  to a different table.

    INPUTS:
     in_rows (Table View / Raster Layer):
         The input table that will be exported to a new table.
     out_path (Workspace):
         The destination where the output table will be written.
     out_name (String):
         The name of the output table.If the output location is a folder,
         include an extension such as .csv,
         .txt, or .dbf to export the table to that format. If the output
         location is a geodatabase, do not specify an extension.
     where_clause {SQL Expression}:
         An SQL expression that will be used to select a subset of records.
     field_mapping {Field Mappings}:
         The fields that will be transferred to the output dataset with their
         respective properties and source fields. The output includes all
         fields from the input dataset by default.Use the field map to add,
         delete, rename, and reorder fields, as well
         as change other field properties.The field map can also be used to
         combine values from two or more
         input fields into a single output field.In Python, use the
         FieldMappings class to define this parameter.
     config_keyword {String}:
         Specifies the default storage parameters (configurations) for
         geodatabases in a relational database management system (RDBMS). This
         setting is applicable only when using enterprise geodatabase
         tables.Configuration keywords are set by the database administrator."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TableToTable_conversion(
                *gp_fixargs((in_rows, out_path, out_name, where_clause, field_mapping, config_keyword), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# To Raster toolset
@gptooldoc("ASCIIToRaster_conversion", None)
def ASCIIToRaster(
    in_ascii_file=None,
    out_raster=None,
    data_type: Literal["INTEGER", "FLOAT"] | None = None,
) -> Result1[str]:
    """ASCIIToRaster_conversion(in_ascii_file, out_raster, {data_type})

       Converts an ASCII file representing raster data to a raster dataset.

    INPUTS:
     in_ascii_file (File):
         The input ASCII file to be converted.
     data_type {String}:
         Specifies the data type of the output raster dataset.INTEGER-An
         integer raster dataset will be created.FLOAT-A floating-
         point raster dataset will be created.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster dataset to be created.If the output raster will not
         be saved to a geodatabase, specify .tif
         for TIFF file format, .CRF for CRF file format, .img for ERDAS IMAGINE
         file format, or no extension for Esri Grid raster format."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ASCIIToRaster_conversion(*gp_fixargs((in_ascii_file, out_raster, data_type), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DEMToRaster_conversion", None)
def DEMToRaster(
    in_dem_file=None,
    out_raster=None,
    data_type: Literal["FLOAT", "INTEGER"] | None = None,
    z_factor=None,
) -> Result1[str]:
    """DEMToRaster_conversion(in_dem_file, out_raster, {data_type}, {z_factor})

       Converts a digital elevation model (DEM) in a United States Geological
       Survey (USGS) format to a raster dataset.

    INPUTS:
     in_dem_file (File):
         The input USGS DEM file. The DEM must be standard USGS 7.5 minute, 1
         degree, or any other file in the USGS DEM format. The DEM may be in
         either fixed or variable record-length format.
     data_type {String}:
         Data type of the output raster dataset.INTEGER-An integer raster
         dataset will be created.FLOAT-A floating-
         point raster dataset will be created. This is the
         default.
     z_factor {Double}:
         The number of ground x,y units in one surface z unit.The z-factor
         adjusts the units of measure for the z units when they
         are different from the x,y units of the input surface. The z-values of
         the input surface are multiplied by the z-factor when calculating the
         final output surface.If the x,y units and z units are in the same
         units of measure, the
         z-factor is 1. This is the default.If the x,y units and z units are in
         different units of measure, the
         z-factor must be set to the appropriate factor, or the results will be
         incorrect. For example, if your z units are feet and your x,y units
         are meters, you would use a z-factor of 0.3048 to convert your z units
         from feet to meters (1 foot = 0.3048 meter).

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster dataset to be created.If the output raster will not
         be saved to a geodatabase, specify .tif
         for TIFF file format, .CRF for CRF file format, .img for ERDAS IMAGINE
         file format, or no extension for Esri Grid raster format."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DEMToRaster_conversion(*gp_fixargs((in_dem_file, out_raster, data_type, z_factor), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FeatureToRaster_conversion", None)
def FeatureToRaster(
    in_features=None,
    field=None,
    out_raster=None,
    cell_size=None,
) -> Result1[str]:
    """FeatureToRaster_conversion(in_features, field, out_raster, {cell_size})

       Converts features to a raster dataset.

    INPUTS:
     in_features (Composite Geodataset):
         The input feature dataset to be converted to a raster dataset.
     field (Field):
         The field used to assign values to the output raster.It can be any
         field of the input feature dataset's attribute table. If
         thefield of a point or multipoint dataset contains z- or
         m-values, either of these can be used. Shape
     cell_size {Analysis Cell Size}:
         The cell size of the output raster being created.This parameter can be
         defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value is
         used, if specified; otherwise, additional rules are used to calculate
         it from the other inputs. See Usages for more detail.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster dataset to be created.If the output raster will not
         be saved to a geodatabase, specify .tif
         for TIFF file format, .CRF for CRF file format, .img for ERDAS IMAGINE
         file format, or no extension for Esri Grid raster format."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FeatureToRaster_conversion(*gp_fixargs((in_features, field, out_raster, cell_size), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FloatToRaster_conversion", None)
def FloatToRaster(
    in_float_file=None,
    out_raster=None,
) -> Result1[str]:
    """FloatToRaster_conversion(in_float_file, out_raster)

       Converts a file of binary floating-point values representing raster
       data to a raster dataset.

    INPUTS:
     in_float_file (File):
         The input floating-point binary file.The file must have a .flt
         extension. There must be a header file in
         association with the floating-point binary file, with a .hdr
         extension.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster dataset to be created.If the output raster will not
         be saved to a geodatabase, specify .tif
         for TIFF file format, .CRF for CRF file format, .img for ERDAS IMAGINE
         file format, or no extension for Esri Grid raster format."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FloatToRaster_conversion(*gp_fixargs((in_float_file, out_raster), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MultipatchToRaster_conversion", None)
def MultipatchToRaster(
    in_multipatch_features=None,
    out_raster=None,
    cell_size=None,
    cell_assignment_method: Literal["MAXIMUM_HEIGHT", "MINIMUM_HEIGHT"] | None = None,
) -> Result1[str]:
    """MultipatchToRaster_conversion(in_multipatch_features, out_raster, {cell_size}, {cell_assignment_method})

       Converts multipatch features to a raster dataset.

    INPUTS:
     in_multipatch_features (Composite Geodataset):
         The input multipatch features to be converted to a raster.
     cell_size {Analysis Cell Size}:
         The cell size of the output raster being created.This parameter can be
         defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value is
         used, if specified; otherwise, additional rules are used to calculate
         it from the other inputs. See Usages for more detail.
     cell_assignment_method {String}:
         Specifies whether the maximum or minimum z-value will be used for a
         cell when more than one z-value is detected at the cell center
         location when a vertical line is extended from the cell center
         location to intersect the input multipatch feature.MAXIMUM_HEIGHT-The
         maximum z-value will be assigned to the cell. This
         is the default.MINIMUM_HEIGHT-The minimum z-value will be assigned to
         the cell.

    OUTPUTS:
     out_raster (Raster Dataset):
         The output raster dataset to be created.It will be of floating point
         type.If the output raster will not be saved to a geodatabase, specify
         .tif
         for TIFF file format, .CRF for CRF file format, .img for ERDAS IMAGINE
         file format, or no extension for Esri Grid raster format."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MultipatchToRaster_conversion(
                *gp_fixargs((in_multipatch_features, out_raster, cell_size, cell_assignment_method), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PointToRaster_conversion", None)
def PointToRaster(
    in_features=None,
    value_field=None,
    out_rasterdataset=None,
    cell_assignment: Literal[
        "MOST_FREQUENT", "SUM", "MEAN", "STANDARD_DEVIATION", "MAXIMUM", "MINIMUM", "RANGE", "COUNT"
    ]
    | None = None,
    priority_field=None,
    cellsize=None,
    build_rat: Literal["BUILD", "DO_NOT_BUILD"] | None = None,
) -> Result1[str]:
    """PointToRaster_conversion(in_features, value_field, out_rasterdataset, {cell_assignment}, {priority_field}, {cellsize}, {build_rat})

       Converts point features to a raster dataset.

    INPUTS:
     in_features (Feature Layer):
         The point or multipoint input feature dataset to be converted to a
         raster.
     value_field (Field):
         The field used to assign values to the output raster.It can be any
         field of the input feature dataset's attribute table. If
         thefield of a point or multipoint dataset contains z- or
         m-values, either of these can be used. Shape
     cell_assignment {String}:
         The method to determine how the cell will be assigned a value when
         more than one feature falls within a cell. MOST_FREQUENT-If
         there is more than one feature within the
         cell, the one with the most common attribute, in the, is assigned to
         the cell. If they have the same number of common attributes, the one
         with the lowest FID is used. Value fieldSUM-The sum of the
         attributes of all the points within the cell (not
         valid for string data).MEAN-The mean of the attributes of all the
         points within the cell (not
         valid for string data).STANDARD_DEVIATION-The standard deviation of
         attributes of all the
         points within the cell. If there are less than two points in the cell,
         the cell is assigned NoData (not valid for string data).MAXIMUM-The
         maximum value of the attributes of the points within the
         cell (not valid for string data).MINIMUM-The minimum value of the
         attributes of the points within the
         cell (not valid for string data).RANGE-The range of the attributes of
         the points within the cell (not
         valid for string data).COUNT-The number of points within the cell.
     priority_field {Field}:
         This field is used when a feature should take preference over another
         feature with the same attribute. Priority field is only used
         with thecell assignment type
         option. Most frequent
     cellsize {Analysis Cell Size}:
         The cell size of the output raster being created.This parameter can be
         defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value is
         used, if specified; otherwise, additional rules are used to calculate
         it from the other inputs. See Usages for more detail.
     build_rat {Boolean}:
         Specifies whether the output raster will have a raster attribute
         table.This parameter only applies to integer rasters.BUILD-The output
         raster will have a raster attribute table. This is
         the default.DO_NOT_BUILD-The output raster will not have a raster
         attribute table.

    OUTPUTS:
     out_rasterdataset (Raster Dataset):
         The output raster dataset to be created.If the output raster will not
         be saved to a geodatabase, specify .tif
         for TIFF file format, .CRF for CRF file format, .img for ERDAS IMAGINE
         file format, or no extension for Esri Grid raster format."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PointToRaster_conversion(
                *gp_fixargs(
                    (in_features, value_field, out_rasterdataset, cell_assignment, priority_field, cellsize, build_rat),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PolygonToRaster_conversion", None)
def PolygonToRaster(
    in_features=None,
    value_field=None,
    out_rasterdataset=None,
    cell_assignment: Literal["CELL_CENTER", "MAXIMUM_AREA", "MAXIMUM_COMBINED_AREA"] | None = None,
    priority_field=None,
    cellsize=None,
    build_rat: Literal["BUILD", "DO_NOT_BUILD"] | None = None,
) -> Result1[str]:
    """PolygonToRaster_conversion(in_features, value_field, out_rasterdataset, {cell_assignment}, {priority_field}, {cellsize}, {build_rat})

       Converts polygon features to a raster dataset.

    INPUTS:
     in_features (Feature Layer):
         The polygon input feature dataset to be converted to a raster.
     value_field (Field):
         The field used to assign values to the output raster.It can be any
         field of the input feature dataset's attribute table.
     cell_assignment {String}:
         The method to determine how the cell will be assigned a value when
         more than one feature falls within a cell.CELL_CENTER-The polygon that
         overlaps the center of the cell yields
         the attribute to assign to the cell.MAXIMUM_AREA-The single feature
         with the largest area within the cell
         yields the attribute to assign to the cell.MAXIMUM_COMBINED_AREA-If
         there is more than one feature in a cell with
         the same value, the areas of these features will be combined. The
         combined feature with the largest area within the cell will determine
         the value to assign to the cell.
     priority_field {Field}:
         This field is used to determine which feature should take
         preference over another feature that falls over a cell. When it is
         used, the feature with the largest positive priority is always
         selected for conversion irrespective of thechosen. Cell
         assignment type
     cellsize {Analysis Cell Size}:
         The cell size of the output raster being created.This parameter can be
         defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value is
         used, if specified; otherwise, additional rules are used to calculate
         it from the other inputs. See Usages for more detail.
     build_rat {Boolean}:
         Specifies whether the output raster will have a raster attribute
         table.This parameter only applies to integer rasters.BUILD-The output
         raster will have a raster attribute table. This is
         the default.DO_NOT_BUILD-The output raster will not have a raster
         attribute table.

    OUTPUTS:
     out_rasterdataset (Raster Dataset):
         The output raster dataset to be created.If the output raster will not
         be saved to a geodatabase, specify .tif
         for TIFF file format, .CRF for CRF file format, .img for ERDAS IMAGINE
         file format, or no extension for Esri Grid raster format."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PolygonToRaster_conversion(
                *gp_fixargs(
                    (in_features, value_field, out_rasterdataset, cell_assignment, priority_field, cellsize, build_rat),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PolylineToRaster_conversion", None)
def PolylineToRaster(
    in_features=None,
    value_field=None,
    out_rasterdataset=None,
    cell_assignment: Literal["MAXIMUM_LENGTH", "MAXIMUM_COMBINED_LENGTH"] | None = None,
    priority_field=None,
    cellsize=None,
    build_rat: Literal["BUILD", "DO_NOT_BUILD"] | None = None,
) -> Result1[str]:
    """PolylineToRaster_conversion(in_features, value_field, out_rasterdataset, {cell_assignment}, {priority_field}, {cellsize}, {build_rat})

       Converts polyline features to a raster dataset.

    INPUTS:
     in_features (Feature Layer):
         The polyline input feature dataset to be converted to a raster.
     value_field (Field):
         The field used to assign values to the output raster.It can be any
         field of the input feature dataset's attribute table.
     cell_assignment {String}:
         The method to determine how the cell will be assigned a value when
         more than one feature falls within a cell.MAXIMUM_LENGTH-The feature
         with the longest length that covers the
         cell will determine the value to assign to the
         cell.MAXIMUM_COMBINED_LENGTH-If there is more than one feature in a
         cell
         with the same value, the lengths of these features will be combined.
         The combined feature with the longest length within the cell will
         determine the value to assign to the cell.
     priority_field {Field}:
         This field is used to determine which feature should take
         preference over another feature that falls over a cell. When it is
         used, the feature with the largest positive priority is always
         selected for conversion irrespective of thechosen. Cell
         assignment type
     cellsize {Analysis Cell Size}:
         The cell size of the output raster being created.This parameter can be
         defined by a numeric value or obtained from an
         existing raster dataset. If the cell size hasn't been explicitly
         specified as the parameter value, the environment cell size value is
         used, if specified; otherwise, additional rules are used to calculate
         it from the other inputs. See Usages for more detail.
     build_rat {Boolean}:
         Specifies whether the output raster will have a raster attribute
         table.This parameter only applies to integer rasters.BUILD-The output
         raster will have a raster attribute table. This is
         the default.DO_NOT_BUILD-The output raster will not have a raster
         attribute table.

    OUTPUTS:
     out_rasterdataset (Raster Dataset):
         The output raster dataset to be created.If the output raster will not
         be saved to a geodatabase, specify .tif
         for TIFF file format, .CRF for CRF file format, .img for ERDAS IMAGINE
         file format, or no extension for Esri Grid raster format."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PolylineToRaster_conversion(
                *gp_fixargs(
                    (in_features, value_field, out_rasterdataset, cell_assignment, priority_field, cellsize, build_rat),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RasterToOtherFormat_conversion", None)
def RasterToOtherFormat(
    Input_Rasters=None,
    Output_Workspace=None,
    Raster_Format: Literal[
        "BIL",
        "BIP",
        "BMP",
        "BSQ",
        "CRF",
        "ENVI DAT",
        "GIF",
        "GRID",
        "IMAGINE Image",
        "JP2000",
        "JPEG",
        "MRF",
        "PNG",
        "TIFF",
    ]
    | None = None,
) -> Result1[str]:
    """RasterToOtherFormat_conversion(Input_Rasters;Input_Rasters..., Output_Workspace, {Raster_Format})

       Converts one or more raster datasets to a different format.

    INPUTS:
     Input_Rasters (Raster Dataset / Raster Layer):
         The raster datasets to convert.
     Output_Workspace (Workspace):
         The folder where the raster dataset will be written.
     Raster_Format {String}:
         Specifies the format that will be used for the output raster
         dataset.BIL-The output will be Esri BIL format.BIP-The output will be
         Esri BIP
         format.BMP-The output will be Microsoft BMP format.BSQ-The output will
         be Esri BSQ format.CRF-The output will be CRF format.ENVI DAT-The
         output will be ENVI DAT format.GIF-The output will be GIF
         format.GRID-The output will be Esri Grid format.IMAGINE Image-The
         output will be ERDAS IMAGINE format.JP2000-The output will be JPEG
         2000 format.JPEG-The output will be JPEG format.MRF-The output will be
         MRF format.PNG-The output will be PNG format.TIFF-The output will be
         TIFF format."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RasterToOtherFormat_conversion(*gp_fixargs((Input_Rasters, Output_Workspace, Raster_Format), True))
        )
        return retval
    except Exception as e:
        raise e


# To Shapefile toolset
@gptooldoc("FeatureClassToShapefile_conversion", None)
def FeatureClassToShapefile(
    Input_Features=None,
    Output_Folder=None,
) -> Result1[str]:
    """FeatureClassToShapefile_conversion(Input_Features;Input_Features..., Output_Folder)

       Converts the features from one or more feature classes or feature
       layers to shapefiles and adds them to a folder of shapefiles.

    INPUTS:
     Input_Features (Feature Layer):
         The list of input feature classes or feature layers that will be
         converted and added to the output folder.
     Output_Folder (Folder):
         The folder where the shapefiles will be written."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FeatureClassToShapefile_conversion(*gp_fixargs((Input_Features, Output_Folder), True))
        )
        return retval
    except Exception as e:
        raise e


# To dBASE toolset
@gptooldoc("TableToDBASE_conversion", None)
def TableToDBASE(
    Input_Table=None,
    Output_Folder=None,
) -> Result1[str]:
    """TableToDBASE_conversion(Input_Table;Input_Table..., Output_Folder)

       Converts one or more tables to dBASE tables.

    INPUTS:
     Input_Table (Table View):
         The list of tables to be converted to dBASE tables.
     Output_Folder (Folder):
         The destination folder where the output dBASE tables will be placed."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TableToDBASE_conversion(*gp_fixargs((Input_Table, Output_Folder), True))
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
