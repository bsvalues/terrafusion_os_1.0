"""Contains base classes and shared code used by python-based tools for working with GTFS data."""

import os
import csv
import pandas
import arcpy

import spatial_reference_helper

# Somewhat arbitrarily set a default field length for text fields in output tables
TEXT_FIELD_LENGTH = 500


class GTFSField:  # pylint:disable=too-few-public-methods
    """Defines GTFS fields and relevant properties for later look-up."""

    def __init__(
        self, name, type_pandas, type_arcgis, is_required, is_nullable=True, is_unique=False, shapefile_name=None,
    ):  # All necessary field properties pylint:disable=too-many-arguments
        """Initialize GTFS field properties."""
        self.name = name
        # Datatype to use when reading into a pandas dataframe
        self.type_pandas = type_pandas
        # Datatype to use in an ArcGIS table
        self.type_arcgis = type_arcgis
        # Whether the GTFS specification requires the field
        self.is_required = is_required
        # Whether the GTFS specification allows this field to be null or empty
        self.is_nullable = is_nullable
        # Whether the GTFS specification requires this field to be unique
        self.is_unique = is_unique
        # Shapefile field names are limited to 10 characters
        if shapefile_name:
            self.shapefile_name = shapefile_name
        else:
            self.shapefile_name = self.name[:10]


# Field definitions for all fields in the GTFS specification defining how we should read them in from CSV and how to
# handle them when adding them to feature classes and tables.
# All GTFS specification fields are included here. The tools themselves must pass in a list of fields they care about,
# which may be a subset of these fields.
# Fields that are enums in the GTFS specification should be read into pandas as strings, generally, because pandas does
# not allow nulls for int fields. By reading them in as strings and converting later, we can check for null values and
# handle them in an appropriate way.
# This is hard-coded for now and must be updated whenever the GTFS specification is updated.
# In the future, replace this with a web query for the latest information.
# GTFS specification: https://github.com/google/transit/blob/master/gtfs/spec/en/reference.md
# {filename: {fieldname: GTFSField object}}
GTFS_FIELDS = {
    "stops.txt": {
        "stop_id": GTFSField(
            name="stop_id",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True,
            is_nullable=False,
            is_unique=True
            ),
        "stop_code": GTFSField(
            name="stop_code",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False
            ),
        "stop_name": GTFSField(
            name="stop_name",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True
            ),
        "stop_desc": GTFSField(
            name="stop_desc",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False),
        "stop_lat": GTFSField(
            name="stop_lat",
            type_pandas=float,
            type_arcgis="DOUBLE",
            is_required=True,
            is_nullable=True  # This field is now conditionally required and must be handled explicitly.
            ),
        "stop_lon": GTFSField(
            name="stop_lon",
            type_pandas=float,
            type_arcgis="DOUBLE",
            is_required=True,
            is_nullable=True  # This field is now conditionally required and must be handled explicitly.
            ),
        "zone_id": GTFSField(
            name="zone_id",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False
            ),
        "stop_url": GTFSField(
            name="stop_url",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False
            ),
        "location_type": GTFSField(
            name="location_type",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False,
            shapefile_name="loc_type"
            ),
        "parent_station": GTFSField(
            name="parent_station",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False,
            shapefile_name="parent_sta"
            ),
        "stop_timezone": GTFSField(
            name="stop_timezone",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False,
            shapefile_name="timezone"
            ),
        "wheelchair_boarding": GTFSField(
            name="wheelchair_boarding",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False,
            shapefile_name="wheelchair"
            ),
        "tts_stop_name": GTFSField(
            name="tts_stop_name",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False,
            shapefile_name="tts_name"
            ),
        "level_id": GTFSField(
            name="level_id",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False,
            ),
        "platform_code": GTFSField(
            name="platform_code",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False,
            shapefile_name="pltfm_code"
            )
        },
    "shapes.txt": {
        "shape_id": GTFSField(
            name="shape_id",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True
            ),
        "shape_pt_lat": GTFSField(
            name="shape_pt_lat",
            type_pandas=float,
            type_arcgis="DOUBLE",
            is_required=True,
            shapefile_name="shp_pt_lat"
            ),
        "shape_pt_lon": GTFSField(
            name="shape_pt_lon",
            type_pandas=float,
            type_arcgis="DOUBLE",
            is_required=True,
            shapefile_name="shp_pt_lon"
            ),
        "shape_pt_sequence": GTFSField(
            name="shape_pt_sequence",
            type_pandas=int,
            type_arcgis="LONG",
            is_required=True,
            shapefile_name="sequence"
            ),
        "shape_dist_traveled": GTFSField(
            name="shape_dist_traveled",
            type_pandas=float,
            type_arcgis="DOUBLE",
            is_required=False,
            shapefile_name="dist"
            )
        },
    "routes.txt": {
        "route_id": GTFSField(
            name="route_id",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True,
            is_nullable=False,
            is_unique=True
            ),
        "agency_id": GTFSField(
            name="agency_id",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False
            ),
        "route_short_name": GTFSField(
            name="route_short_name",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True,
            shapefile_name="short_name"
            ),
        "route_long_name": GTFSField(
            name="route_long_name",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True,
            shapefile_name="long_name"
            ),
        "route_desc": GTFSField(
            name="route_desc",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False
            ),
        "route_type": GTFSField(
            name="route_type",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True
            ),
        "route_url": GTFSField(
            name="route_url",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False
            ),
        "route_color": GTFSField(
            name="route_color",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False,
            shapefile_name="color"
            ),
        "route_text_color": GTFSField(
            name="route_text_color",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False,
            shapefile_name="text_color"
            ),
        "route_sort_order": GTFSField(
            name="route_sort_order",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False,
            shapefile_name="sort_order"
            ),
        "continuous_pickup": GTFSField(
            name="continuous_pickup",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False,
            shapefile_name="cont_pckp"
            ),
        "continuous_drop_off": GTFSField(
            name="continuous_drop_off",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False,
            shapefile_name="cont_drpff"
            ),
        },
    "trips.txt": {
        "route_id": GTFSField(
            name="route_id",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True,
            is_nullable=False
            ),
        "service_id": GTFSField(
            name="service_id",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True,
            is_nullable=False
            ),
        "trip_id": GTFSField(
            name="trip_id",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True,
            is_nullable=False,
            is_unique=True
            ),
        "trip_headsign": GTFSField(
            name="trip_headsign",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False,
            shapefile_name="headsign"
            ),
        "trip_short_name": GTFSField(
            name="trip_short_name",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False,
            shapefile_name="short_name"
            ),
        "direction_id": GTFSField(
            name="direction_id",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False,
            shapefile_name="direction"
            ),
        "block_id": GTFSField(
            name="block_id",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False
            ),
        "shape_id": GTFSField(
            name="shape_id",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False
            ),
        "wheelchair_accessible": GTFSField(
            name="wheelchair_accessible",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False,
            shapefile_name="wheelchair"
            ),
        "bikes_allowed": GTFSField(
            name="bikes_allowed",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False,
            shapefile_name="bikes"
            )
        },
    "stop_times.txt": {
        "trip_id": GTFSField(
            name="trip_id",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True,
            is_nullable=False
            ),
        "arrival_time": GTFSField(
            name="arrival_time",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True
            ),
        "departure_time": GTFSField(
            name="departure_time",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True
            ),
        "stop_id": GTFSField(
            name="stop_id",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True,
            is_nullable=False
            ),
        "stop_headsign": GTFSField(
            name="stop_headsign",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False
            ),
        "stop_sequence": GTFSField(
            name="stop_sequence",
            type_pandas=int,
            type_arcgis="SHORT",
            is_required=True,
            is_nullable=False
            ),
        "pickup_type": GTFSField(
            name="pickup_type",
            type_pandas=str,  # Pandas doesn't support null values for integers, so read in as string and convert later.
            type_arcgis="SHORT",
            is_required=False
            ),
        "drop_off_type": GTFSField(
            name="drop_off_type",
            type_pandas=str,  # Pandas doesn't support null values for integers, so read in as string and convert later.
            type_arcgis="SHORT",
            is_required=False
            ),
        "continuous_pickup": GTFSField(
            name="continuous_pickup",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False
            ),
        "continuous_drop_off": GTFSField(
            name="continuous_drop_off",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False
            ),
        "shape_dist_traveled": GTFSField(
            name="shape_dist_traveled",
            type_pandas=float,
            type_arcgis="DOUBLE",
            is_required=False,
            shapefile_name="dist"
            ),
        "timepoint": GTFSField(
            name="timepoint",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False
            ),
        },
    "calendar.txt": {
        "service_id": GTFSField(
            name="service_id",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True,
            is_nullable=False,
            is_unique=True
            ),
        "monday": GTFSField(
            name="monday",
            type_pandas=int,
            type_arcgis="SHORT",
            is_required=True,
            is_nullable=False
            ),
        "tuesday": GTFSField(
            name="tuesday",
            type_pandas=int,
            type_arcgis="SHORT",
            is_required=True,
            is_nullable=False
            ),
        "wednesday": GTFSField(
            name="wednesday",
            type_pandas=int,
            type_arcgis="SHORT",
            is_required=True,
            is_nullable=False
            ),
        "thursday": GTFSField(
            name="thursday",
            type_pandas=int,
            type_arcgis="SHORT",
            is_required=True,
            is_nullable=False
            ),
        "friday": GTFSField(
            name="friday",
            type_pandas=int,
            type_arcgis="SHORT",
            is_required=True,
            is_nullable=False
            ),
        "saturday": GTFSField(
            name="saturday",
            type_pandas=int,
            type_arcgis="SHORT",
            is_required=True,
            is_nullable=False
            ),
        "sunday": GTFSField(
            name="sunday",
            type_pandas=int,
            type_arcgis="SHORT",
            is_required=True,
            is_nullable=False
            ),
        "start_date": GTFSField(
            name="start_date",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True,
            is_nullable=False
            ),
        "end_date": GTFSField(
            name="end_date",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True,
            is_nullable=False
            )
        },
    "calendar_dates.txt": {
        "service_id": GTFSField(
            name="service_id",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True,
            is_nullable=False
            ),
        "date": GTFSField(
            name="date",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True,
            is_nullable=False
            ),
        "exception_type": GTFSField(
            name="exception_type",
            type_pandas=int,
            type_arcgis="SHORT",
            is_required=True,
            is_nullable=False
            )
        },
    "frequencies.txt": {
        "trip_id": GTFSField(
            name="trip_id",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True,
            is_nullable=False
        ),
        "start_time": GTFSField(
            name="start_time",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True,
            is_nullable=False
            ),
        "end_time": GTFSField(
            name="end_time",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=True,
            is_nullable=False
            ),
        "headway_secs": GTFSField(
            name="headway_secs",
            type_pandas=int,
            type_arcgis="LONG",
            is_required=True,
            is_nullable=False
        ),
        "exact_times": GTFSField(
            name="exact_times",
            type_pandas=str,
            type_arcgis="TEXT",
            is_required=False
        )
    }
}

# Dataframe field name used for storing point geometries, for reference in cursors
PTSHAPE_FIELD = "PtShape"
# arcpy cursor keyword for accessing shape
SHAPE_CURSOR = "Shape@"
SHAPE_CURSOR_X = "SHAPE@X"
SHAPE_CURSOR_Y = "SHAPE@Y"

# GTFS field names representing latitude and longitude
GTFS_LATLON_FIELDS = {
    "stops.txt": ("stop_lat", "stop_lon"),
    "shapes.txt": ("shape_pt_lat", "shape_pt_lon")
    }

# GTFS route_type in human-readable text format
# See https://github.com/google/transit/blob/master/gtfs/spec/en/reference.md#routestxt
GTFS_ROUTE_TYPES = {
    "0": "Tram, Streetcar, Light rail",
    "1": "Subway, Metro",
    "2": "Rail",
    "3": "Bus",
    "4": "Ferry",
    "5": "Cable car",
    "6": "Gondola, Suspended cable car",
    "7": "Funicular",
    "11": "Trolleybus",
    "12": "Monorail"
    }

# Spatial reference object for WGS-84. GTFS lat/lon values are required to be valid WGS-84, so we'll use this
# spatial reference when reading and interpreting GTFS lat/lon.
WGS_COORDS = arcpy.SpatialReference(4326)

# GTFS text files are required to have UTF-8 encoding
# Use utf-8-sig to parse input in case it has a BOM
# Use regular utf-8 to write output because we don't want it to have a BOM
GTFS_ENCODING_INPUT = "utf-8-sig"
GTFS_ENCODING_OUTPUT = "utf-8"

# Convert field types as specified in GP tool schema definitions to field types as specified in arcpy.Field objects
# Incomplete list - includes only the ones we're using
TOOL_FIELD_TYPE_TO_OBJECT_FIELD_TYPE = {
    "LONG": "Integer",
    "SHORT": "SmallInteger",
    "TEXT": "String",
    "DOUBLE": "Double",
    "DATE": "Date"
}


class NetworkDataModelTable:  # pylint:disable=too-few-public-methods
    """Defines one of the tables from the data model for using GTFS data in a network dataset."""

    def __init__(self, table_name, fields, geometry_type=None):
        """Initialize data model table properties."""
        self.table_name = table_name
        self.fields = fields
        self.geometry_type = geometry_type
        self.filepath = None


class NetworkDataModelField:
    """Defines the properties of a field in a network data model table."""

    def __init__(self, name, ftype, is_required, length=None):
        """Initialize data model field properties."""
        self.name = name
        self.type = ftype
        self.length = length
        self.is_required = is_required
        self.field_description = [self.name, self.type]
        if self.length:
            self.field_description += [None, self.length]

    def make_field_object(self):
        """Return an arcpy.Field object generated from the properties of this data model field."""
        field = arcpy.Field()
        field.name = self.name
        field.type = TOOL_FIELD_TYPE_TO_OBJECT_FIELD_TYPE[self.type]
        if self.length:
            field.length = self.length
        return field


class NetworkDataModel:  # pylint:disable=too-few-public-methods
    """Defines the data model for using GTFS data in a network dataset."""

    def __init__(self):
        """Initialize tables in the data model."""
        self.stops = NetworkDataModelTable(
            table_name="Stops",
            fields=[
                NetworkDataModelField("ID", "LONG", True),
                NetworkDataModelField("GStopID", "TEXT", False, TEXT_FIELD_LENGTH),
                NetworkDataModelField("GStopType", "SHORT", False),
                NetworkDataModelField("GStopParen", "TEXT", False, TEXT_FIELD_LENGTH),
                NetworkDataModelField("ParentID", "LONG", False),
                NetworkDataModelField("GWheelchairBoarding", "SHORT", False),
            ],
            geometry_type="Point"
        )
        self.stops_on_streets = NetworkDataModelTable(
            table_name="StopsOnStreets",
            fields=[
                NetworkDataModelField("ID", "LONG", True),
                NetworkDataModelField("GStopID", "TEXT", False, TEXT_FIELD_LENGTH),
                NetworkDataModelField("GStopType", "SHORT", False),
                NetworkDataModelField("GStopParen", "TEXT", False, TEXT_FIELD_LENGTH),
                NetworkDataModelField("ParentID", "LONG", False),
                NetworkDataModelField("GWheelchairBoarding", "SHORT", False),
            ],
            geometry_type="Point"
        )
        self.stop_connectors = NetworkDataModelTable(
            table_name="StopConnectors",
            fields=[
                NetworkDataModelField("StopID", "LONG", False),
                NetworkDataModelField("ConnectorType", "SHORT", False),
                NetworkDataModelField("GWheelchairBoarding", "SHORT", False)
            ],
            geometry_type="Polyline"
        )
        self.lines = NetworkDataModelTable(
            table_name="Lines",
            fields=[
                NetworkDataModelField("ID", "LONG", True),
                NetworkDataModelField("GRouteID", "TEXT", False, TEXT_FIELD_LENGTH),
                NetworkDataModelField("GRouteType", "SHORT", False)
            ]
        )
        self.line_variants = NetworkDataModelTable(
            table_name="LineVariants",
            fields=[
                NetworkDataModelField("ID", "LONG", True),
                NetworkDataModelField("LineID", "LONG", True),
                NetworkDataModelField("GDirectionID", "SHORT", False),
                NetworkDataModelField("GShapeID", "TEXT", False, TEXT_FIELD_LENGTH)
            ]
        )
        self.line_variant_elements = NetworkDataModelTable(
            table_name="LineVariantElements",
            fields=[
                NetworkDataModelField("LineVarID", "LONG", True),
                NetworkDataModelField("SqIdx", "SHORT", True),
                NetworkDataModelField("FromStopID", "LONG", False),
                NetworkDataModelField("ToStopID", "LONG", False),
                NetworkDataModelField("LVEShapeID", "LONG", False)
            ],
            geometry_type="Polyline"
        )
        self.schedules = NetworkDataModelTable(
            table_name="Schedules",
            fields=[
                NetworkDataModelField("ID", "LONG", True),
                NetworkDataModelField("LineVarID", "LONG", True)
            ]
        )
        self.schedule_elements = NetworkDataModelTable(
            table_name="ScheduleElements",
            fields=[
                NetworkDataModelField("ScheduleID", "LONG", True),
                NetworkDataModelField("SqIdx", "SHORT", True),
                NetworkDataModelField("Departure", "DOUBLE", True),
                NetworkDataModelField("Arrival", "DOUBLE", True)
            ]
        )
        self.runs = NetworkDataModelTable(
            table_name="Runs",
            fields=[
                NetworkDataModelField("ID", "LONG", True),
                NetworkDataModelField("ScheduleID", "LONG", True),
                NetworkDataModelField("StartRun", "DOUBLE", True),
                NetworkDataModelField("GTripID", "TEXT", False, TEXT_FIELD_LENGTH),
                NetworkDataModelField("CalendarID", "LONG", True),
                NetworkDataModelField("GWheelchairAccessible", "SHORT", False),
                NetworkDataModelField("GBikesAllowed", "SHORT", False)
            ]
        )
        self.calendars = NetworkDataModelTable(
            table_name="Calendars",
            fields=[
                NetworkDataModelField("ID", "LONG", True),
                NetworkDataModelField("GServiceID", "TEXT", False, TEXT_FIELD_LENGTH),
                NetworkDataModelField("Monday", "SHORT", True),
                NetworkDataModelField("Tuesday", "SHORT", True),
                NetworkDataModelField("Wednesday", "SHORT", True),
                NetworkDataModelField("Thursday", "SHORT", True),
                NetworkDataModelField("Friday", "SHORT", True),
                NetworkDataModelField("Saturday", "SHORT", True),
                NetworkDataModelField("Sunday", "SHORT", True),
                NetworkDataModelField("StartDate", "DATE", False),
                NetworkDataModelField("EndDate", "DATE", False)
            ]
        )
        self.calendar_exceptions = NetworkDataModelTable(
            table_name="CalendarExceptions",
            fields=[
                NetworkDataModelField("CalendarID", "LONG", True),
                NetworkDataModelField("GServiceID", "TEXT", False, TEXT_FIELD_LENGTH),
                NetworkDataModelField("ExceptionDate", "DATE", True),
                NetworkDataModelField("GExceptionType", "SHORT", True)
            ]
        )
        self.lve_shapes = NetworkDataModelTable(
            table_name="LVEShapes",
            fields=[
                NetworkDataModelField("ID", "LONG", True)
            ],
            geometry_type="Polyline"
        )
        self.all_tables = [
            self.stops, self.stops_on_streets, self.stop_connectors, self.lines, self.line_variants,
            self.line_variant_elements, self.schedules, self.schedule_elements, self.runs, self.calendars,
            self.calendar_exceptions, self.lve_shapes
        ]

    def make_schema_dict(self):
        """Return a dictionary of {table_name: [list of field objects]} for all tables in the data model.

        This method is intended to assist in setting the Schema object for output tool parameters.
        """
        return {t.table_name: [f.make_field_object() for f in t.fields] for t in self.all_tables}

    def make_geometry_type_dict(self):
        """Return a dictionary of {table_name: geometry type} for all feature classes in the data model.

        This method is intended to assist in setting the Schema object for output tool parameters.
        """
        return {t.table_name: t.geometry_type for t in self.all_tables if t.geometry_type}


class Error(Exception):
    """Base class for exceptions in this module."""

    def __init__(self, message_id, add_arg1=None, add_arg2=None):  # pylint:disable=super-init-not-called
        """Store message number and arguments for an error.

        Args:
            message_id: ArcGIS message ID number
            add_arg1: First message argument for use in arcpy.AddIDMessage()
            add_arg2: Second message argument for use in arcpy.AddIDMessage()
        Returns:
            No return value.
        Raises:
            No exceptions.

        """
        self.message_id = message_id
        self.add_arg1 = add_arg1
        self.add_arg2 = add_arg2


class GPError(Exception):
    """Class for passing through exceptions raised in tool code.

    Used for catching a failed GP tool run within a script and failing out nicely
    without throwing a traceback.
    """

    def __init__(self):  # pylint:disable=super-init-not-called
        """Raise an error."""
        # Use AddReturnMessage to pass through GP errors.
        # This ensures that the hyperlinks to the message IDs will work in the UI.
        for msg in range(0, arcpy.GetMessageCount()):
            if arcpy.GetSeverity(msg) == 2:
                arcpy.AddReturnMessage(msg)


def make_output_table(out_table, field_descriptions, spatial_ref=WGS_COORDS, geometry_type=None):
    """Create an ArcGIS feature class or table and add fields to it.

    Args:
        out_table: Output ArcGIS table to create
        field_descriptions: Fields to create formatted correctly for use in arcpy.AddFields()
        spatial_ref: Output spatial reference to use. Defaults to WGS-84
        geometry_type: Geometry type for output feature class.  Use None for a table.
    Returns:
        No return value.
    Raises:
        No exceptions.

    """
    # Create feature class or table
    output_location = os.path.dirname(out_table)
    out_name = os.path.basename(out_table)
    try:
        if geometry_type:
            arcpy.management.CreateFeatureclass(
                output_location,
                out_name,
                geometry_type,
                spatial_reference=spatial_ref)
        else:
            arcpy.management.CreateTable(output_location, out_name)
        arcpy.management.AddFields(out_table, field_descriptions)
    except arcpy.ExecuteError:
        # The most likely problem here is that the output table/fc already exists and can't be overwritten.
        raise GPError()


class DataFrameToFeaturesConverter:
    """Base class for converting a pandas dataframe to an ArcGIS table or feature class."""

    def __init__(self, data_frame):
        """Initialize the dataframe."""
        self.data_frame = data_frame

    def write_df_rows_to_table(self, out_table, out_table_fields, df_cols, transformation=None):
        """Write the pandas dataframe rows to an ArcGIS table or feature class.

        Allows you to specify the output table's field names and the specific column names of the dataframe in case you
        only want a subset.

        Args:
            out_table: Output ArcGIS table to write rows to. Must already exist.
            out_table_fields: List of field names to write to in the output table, for use in the cursor. You can
            include the SHAPE_CURSOR column if you want to write geometry as long as the data frame has a corresponding
                column designated in df_cols which contains pre-calculated PointGeometry objects.
            df_cols: List of dataframe column names to write into the fields designated in
                out_table_fields. List must be in the same order and the same length as the out_table_fields, with the
                elements having the correct data type.
        Returns:
            No return value.
        Raises:
            No exceptions.

        """
        # Iterate through dataframe and add rows to the output table
        with arcpy.da.InsertCursor(  # pylint: disable=no-member
            out_table, out_table_fields, datum_transformation=transformation
        ) as cur:
            for row in self.data_frame[df_cols].itertuples(index=False):
                cur.insertRow(row)

    def write_df_rows_to_csv(self, out_csv):
        """Write the pandas dataframe to a CSV file."""
        self.data_frame.to_csv(out_csv, encoding=GTFS_ENCODING_OUTPUT, index=False)

    def _remove_whitespace(self, field_name):
        """Remove whitespaces from a dataframe column."""
        self.data_frame[field_name] = self.data_frame[field_name].str.strip()

    def index_df(self, index_field):
        """Index the dataframe by a field in place."""
        self.data_frame.set_index(index_field, inplace=True)

    def reset_index(self):
        """Reset the dataframe index in place."""
        self.data_frame.reset_index(inplace=True)

    def group_df(self, group_field):
        """Group the dataframe by a field using groupby."""
        self.data_frame = self.data_frame.groupby(group_field)

    def sort_df(self, sort_fields):
        """Sort the dataframe by the designated fields in place."""
        self.data_frame.sort_values(sort_fields, inplace=True)

    def fill_na(self):
        """Fill na values in the dataframe with empty strings."""
        self.data_frame.fillna("", inplace=True)

    def fill_na_from_field(self, field_to_fill, field_with_data):
        """Fill na values in one field with data from another field."""
        self.data_frame[field_to_fill].fillna(self.data_frame[field_with_data], inplace=True)

    def drop_duplicates(self):
        """Drop duplicates from the dataframe in place."""
        self.data_frame.drop_duplicates(inplace=True)

    def truncate_text_fields(self):
        """Truncate all text field values in the dataframe to TEXT_FIELD_LENGTH."""
        def truncate(val):
            try:
                if isinstance(val, str):
                    val = val[:TEXT_FIELD_LENGTH]
            except Exception:  # Don't care why it fails. pylint:disable=broad-except
                pass
            return val
        self.data_frame = self.data_frame.applymap(truncate)

    def _get_text_field_length_from_column(self, field):
        """Return the field length required for a text field to accommodate the values in the dataframe column."""
        if self.data_frame is not None and field in self.data_frame.columns:
            return max(1, self.get_max_string_length_in_column(field))
        return TEXT_FIELD_LENGTH

    def get_max_string_length_in_column(self, column):
        """Return the length of the longest string in a text column."""
        string_length = self.data_frame[column].str.len().max()
        if pandas.isna(string_length):
            string_length = 0
        return string_length

    def get_max_string_length_in_index(self):
        """Return the length of the longest string in the current index."""
        index_length = self.data_frame.index.str.len().max()
        if pandas.isna(index_length):
            index_length = 0
        return index_length

    def get_df_column_names(self):
        """Return a list of the columns names currently in the dataframe."""
        return self.data_frame.columns.values.tolist()

    def find_bad_column_values(self, column, valid_values):
        """Return a list of invalid values in the specified column based on a list or series of valid values."""
        # Use isin() to find rows in the current data frame that are in the list of valid values
        # Negate it with ~. Becomes "is not in".
        # Subset the dataframe to just those bad rows, grab the column whose values we're considering, drop duplicates
        # values, then return a list of bad values.
        return self.data_frame[~self.data_frame[column].isin(valid_values)][column].drop_duplicates().tolist()

    def delete_rows_with_bad_values(self, column, bad_values):
        """Delete rows that have invalid values for the specified column."""
        self.data_frame = self.data_frame[~self.data_frame[column].isin(bad_values)]

    def _is_txt_field_positive_int(self, field):
        """Return True if all non-null values in a text field can be interpreted as positive integers, else False."""
        return self.data_frame[field].str.isnumeric().all()

    def is_df_empty(self):
        """Return True if the dataframe is empty (has 0 rows)."""
        return self.data_frame.shape[0] == 0

    def field_has_null(self, field):
        """Return True if the designated field has any null or na values."""
        return self.data_frame[field].isnull().values.any()

    def field_all_null(self, field):
        """Return True if all values in the designated field are null/na."""
        return self.data_frame[field].isnull().values.all()

    def remove_rows_with_null(self, field):
        """Remove rows where the designated field value is null or nan."""
        return self.data_frame.dropna(axis=0, subset=[field], inplace=True)

    def _field_values_unique(self, field):
        """Return True if the values in the designated field are unique."""
        return self.data_frame[field].is_unique

    def _field_values_in_list(self, field, value_list):
        """Return True if all values in the designated field are in the designated list of values. Ignores nan."""
        return self.data_frame[field].dropna().isin(value_list).all()


class GTFSToFeaturesConverter(DataFrameToFeaturesConverter):
    """Base class with methods for reading a GTFS text file, manipulating data, and writing it to ArcGIS format."""

    def __init__(self, gtfs_file, gtfs_file_type=None):
        """Read the GTFS text file and gather some basic info about its fields.

        Args:
            gtfs_file: The actual GTFS .txt file to read and convert
            gtfs_file_type: The type of the GTFS file, from the GTFS specification.  Examples: stops.txt, routes.txt.
        Returns:
            No return value.
        Raises:
            No exceptions.

        """
        self.gtfs_file = gtfs_file
        if gtfs_file_type:  # example: stops.txt
            self.gtfs_file_type = gtfs_file_type
        else:
            self.gtfs_file_type = os.path.basename(gtfs_file)

        # Fields present in the input GTFS file
        self.fields = self._get_gtfs_fields()
        # If the GTFS file has latitude and longitude fields, figure out what they are.
        if self.gtfs_file_type in GTFS_LATLON_FIELDS:
            self.lat_field = GTFS_LATLON_FIELDS[self.gtfs_file_type][0]
            self.lon_field = GTFS_LATLON_FIELDS[self.gtfs_file_type][1]
        else:
            self.lat_field = None
            self.lon_field = None

        # Initialize a variable for a pandas dataframe
        self.data_frame = None

    def _get_gtfs_fields(self):
        """Return a list of column names from the gtfs file."""
        try:
            # Note: Pass in the open file handle instead of the file path to avoid the pandas bug for reading
            # filepaths with non-ascii characters. https://github.com/pandas-dev/pandas/issues/15086
            fields_df = pandas.read_csv(open(self.gtfs_file, "r", encoding=GTFS_ENCODING_INPUT),
                                        encoding=GTFS_ENCODING_INPUT, header=None, nrows=1,
                                        skipinitialspace=True)
            return fields_df.values.tolist()[0]
        except pandas.errors.EmptyDataError:
            # Unusual case when the file is totally empty.
            return []
        except UnicodeDecodeError:
            # Unicode decoding of GTFS file %1 failed. GTFS files must use UTF-8 encoding.
            raise Error(2607, self.gtfs_file)

    def validate_required_tool_fields(self, required_tool_fields):
        """Ensure the all fields required to run the tool are present and raise an error if they aren't."""
        if not set(required_tool_fields).issubset(set(self.fields)):
            missing_fields = [f for f in required_tool_fields if f not in self.fields]
            # GTFS file %1 is missing one or more required fields: %2
            raise Error(2602, self.gtfs_file, ", ".join(missing_fields))

    def gtfs_to_df(self, columns):
        """Read a GTFS file into a pandas dataframe using the specified columns.

        Args:
            columns: Column names from the input GTFS file that you want to read into the dataframe
        Returns:
            No return value.
        Raises:
            Raises gtfs_utils.Error if known problems are encountered.  The tool calling this method must handle the
            exception.

        """
        # Explicitly define the datatypes to be used when reading the file into pandas
        dtypes = {}
        for col in columns:
            try:
                dtypes[col] = GTFS_FIELDS[self.gtfs_file_type][col].type_pandas
            except KeyError:
                dtypes[col] = str
        # Read into pandas dataframe
        try:
            # Note: Pass in the open file handle instead of the file path to avoid the pandas bug for reading
            # filepaths with non-ascii characters. https://github.com/pandas-dev/pandas/issues/15086
            self.data_frame = pandas.read_csv(
                open(self.gtfs_file, "r", encoding=GTFS_ENCODING_INPUT),
                usecols=columns,
                dtype=dtypes,
                encoding=GTFS_ENCODING_INPUT,
                skipinitialspace=True,
                # Interpret only empty strings as NaN/None. This is to avoid interpreting strings like "NULL" as None,
                # since GTFS is a text-based format, and I actually encountered a dataset with a stop_id of "NULL" that
                # seemed otherwise valid in its use of that stop.  Also consider only a tab character as an empty
                # string.  I encountered a dataset (invalid according to spec but still usable) where some columns had
                # only a tab value, and when that wasn't interpreted as NaN, we had other problems down the line.
                keep_default_na=False,
                na_values=["", "\t"]
            )
        except UnicodeDecodeError:
            # Unicode decoding of GTFS file %1 failed. GTFS files must use UTF-8 encoding.
            raise Error(2607, self.gtfs_file)
        except ValueError as ex:
            if "could not convert string to float" in str(ex) or \
               "cannot safely convert passed user dtype of <i4 for object" in str(ex) or \
               "invalid literal for int() with base 10:" in str(ex):
                # Indication that there is a non-numeric value in the field we're trying to read into a float or int
                # Example: junk in a latitude or longitude field
                # Example: Non-integer in shape_pt_sequence field
                # GTFS file %1 contains one or more invalid non-numerical values in a numerical field.
                raise Error(2603, self.gtfs_file)
            else:
                # Error converting GTFS file %1 to dataframe.
                raise Error(2613, self.gtfs_file)

        # Remove extraneous whitespaces
        # Note: The skipinitialspace option in read_csv only takes care of spaces at the beginning of lines
        # It does not handle leading tabs or any trailing whitespace
        for col in dtypes:
            if dtypes[col] == str:
                self._remove_whitespace(col)

    def validate_df_not_empty(self):
        """Make sure the dataframe is not empty (input GTFS had no data), and raise an exception if it is."""
        if self.is_df_empty():
            # GTFS file %1 contains no rows.
            raise Error(2608, self.gtfs_file)

    def validate_fields_not_null(self, fields):
        """Raise an exception if there are any null or NaN values for this field in the dataframe.

        Args:
            fields: Field names to check for null values
        Returns:
            No return value.
        Raises:
            Raises gtfs_utils.Error if null values are found.  The tool calling this method must handle the exception.

        """
        for field in fields:
            if self.field_has_null(field):
                # GTFS file %1 is missing values for field %2. Every row must have a value for this field.
                raise Error(2606, self.gtfs_file, field)

    def validate_fields_not_all_null(self, fields):
        """Raise an exception if all values for these fields are null or NaN.

        Args:
            fields: Field names to check for all null values
        Returns:
            No return value.
        Raises:
            Raises gtfs_utils.Error if the fields contain all null values.  The tool calling this method must handle the
            exception.

        """
        for field in fields:
            if self.field_all_null(field):
                # GTFS file %1 is missing values for field %2 for all rows.
                raise Error(2929, self.gtfs_file, field)

    def validate_fields_unique(self, fields):
        """Raise an exception if any of the fields values are not unique.

        Args:
            fields: Field names to check for non-unique values
        Returns:
            No return value.
        Raises:
            Raises gtfs_utils.Error if non-unique values are found.  The tool calling this method must handle the
            exception.

        """
        for field in fields:
            if not self._field_values_unique(field):
                # Values in the %1 field in the GTFS file %2 must be unique.
                raise Error(2817, field, self.gtfs_file)

    def validate_txt_fields_are_ints(self, fields):
        """Raise an exception if any values in the input fields cannot be interpreted as positive ints.

        This check is needed because pandas cannot have integer fields with null values, but gtfs datasets often include
        integer/enum fields where nulls are allowed.  We have to read these in as text and then validate after.

        Args:
            fields: Field names to check
        Returns:
            No return value.
        Raises:
            Raises gtfs_utils.Error if problems are found.  The tool calling this method must handle the
            exception.

        """
        for field in fields:
            if not self._is_txt_field_positive_int(field):
                # GTFS file %1 contains one or more invalid non-numerical values in a numerical field.
                raise Error(2603, self.gtfs_file)

    def validate_values_in_domain(self, field, domain_vals):
        """Raise an exception if any values in the input field doesn't match the list of valid values in domain_vals.

        Args:
            field: Field to check
            domain_vals: List of valid values for the field
        Returns:
            No return value.
        Raises:
            Raises gtfs_utils.Error if problems are found.  The tool calling this method must handle the
            exception.

        """
        if not self._field_values_in_list(field, domain_vals):
            # GTFS file %1 contains unsupported values in the %2 field.
            raise Error(2818, self.gtfs_file, field)

    def validate_lat_lon_values(self):
        """Make sure the latitude and longitude values are valid WGS 84 coordinates.

        Args:
            No arguments.
        Returns:
            No return value.
        Raises:
            Raises gtfs_utils.Error if invalid lat/lon values are found.  The tool calling this method must handle the
            exception.

        """
        if not self.lat_field and self.lon_field:
            return

        self.validate_fields_not_null([self.lat_field, self.lon_field])

        # Check that lat/lon values fall within the correct ranges
        if not self.data_frame[self.lat_field].between(-90.0, 90.0).all():
            # GTFS file %1 contains one or more latitude values outside the valid range [-90, 90].
            # GTFS data must use valid WGS 84 coordinates.
            raise Error(2604, self.gtfs_file)
        if not self.data_frame[self.lon_field].between(-180.0, 180.0).all():
            # GTFS file %1 contains one or more longitude values outside the valid range [-180, 180].
            # GTFS data must use valid WGS 84 coordinates.
            raise Error(2605, self.gtfs_file)

    def make_extent_from_lat_lon_values(self):
        """Create an arcpy.Extent object based on extreme values of lat/lon in the dataframe.

        Useful for the calculating datum transformations. Assumes the dataframe's coordinates are WGS84 as is correct
        for GTFS data. Don't call this method until you have run validate_lat_lon_values().
        """
        xmin = self.data_frame[self.lon_field].min()
        xmax = self.data_frame[self.lon_field].max()
        ymin = self.data_frame[self.lat_field].min()
        ymax = self.data_frame[self.lat_field].max()
        extent = arcpy.Extent(xmin, ymin, xmax, ymax, spatial_reference=WGS_COORDS)
        return extent

    def make_table_field(self, field, is_shapefile=False, workspace=None):
        """Construct the field description syntax [name, type, alias, length] for use with arcpy.AddFields.

        Args:
            field: Input GTFS file's column name
            is_shapefile: Boolean indicating whether the output is a shapefile
            workspace: The output feature class's workspace. Needed in order to validate field names.
        Returns:
            List item formatted for use in the field_descriptions parameter of arcpy.AddFields()
        Raises:
            No exceptions.

        """
        try:
            gtfs_field = GTFS_FIELDS[self.gtfs_file_type][field]
            if is_shapefile:
                name = gtfs_field.shapefile_name
            else:
                name = gtfs_field.name
            field_to_add = [name, gtfs_field.type_arcgis]
            if gtfs_field.type_arcgis == "TEXT":
                field_to_add += [None, self._get_text_field_length_from_column(field)]
            return field_to_add
        except KeyError:
            # If the field isn't recognized as part of the GTFS specification, add it as text.
            if is_shapefile:
                name = field[:10]
            else:
                name = field
            return [
                arcpy.ValidateFieldName(name, workspace),
                "TEXT",
                None,
                self._get_text_field_length_from_column(field)
            ]

    def make_table_fields_list(self, is_shapefile=False, workspace=None):
        """Construct a list of field descriptions for use in arcpy.AddFields.

        Args:
            is_shapefile: Boolean indicating whether the output is a shapefile
            workspace: The output feature class's workspace. Needed in order to validate field names.
        Returns:
            List of field description lists formatted for use in the field_descriptions parameter of arcpy.AddFields()
        Raises:
            No exceptions.

        """
        return [self.make_table_field(f, is_shapefile, workspace) for f in self.fields]

    def gtfs_df_to_table(self, out_table, spatial_ref=WGS_COORDS, is_shapefile=False):
        """Create output table or feature class and write the dataframe rows to it.

        Create the output feature class or table with field names that match the column names of the data frame, and
        then write the entire data frame to the output feature class or table.  Geometry is handled automatically if
        needed.

        Args:
            out_table: Output ArcGIS table to create
            spatial_ref: Output spatial reference to use. Defaults to WGS-84
            is_shapefile: Boolean indicating whether the output is a shapefile
        Returns:
            No return value.
        Raises:
            No exceptions.

        """
        # Initialize variables
        geom_type = None
        transformation = None
        # Update list of fields to match what's currently in the dataframe
        self.fields = self.data_frame.columns.to_list()
        # Construct field descriptions for the fields we will add to the output table
        field_descriptions = self.make_table_fields_list(is_shapefile, os.path.dirname(out_table))
        # Create the output table
        if self.lat_field and self.lon_field:
            geom_type = "POINT"
            # Determine whether a geographic transformation is needed between the GTFS WGS84 and the output spatial ref
            extent = self.make_extent_from_lat_lon_values()
            transformation = spatial_reference_helper.get_datum_transformation(WGS_COORDS, spatial_ref, extent)
        make_output_table(out_table, field_descriptions, spatial_ref, geom_type)

        # Construct a list of field names for use in cursor
        fields_to_write = [f[0] for f in field_descriptions]
        # Construct corresponding list of fields in the dataframe to read.
        # In this case, it's all fields in the original table.
        df_fields_to_read = self.fields
        # Handle geometry if needed
        if self.lat_field and self.lon_field:
            fields_to_write.append(SHAPE_CURSOR)
            df_fields_to_read.append(PTSHAPE_FIELD)
            self.calculate_point_shapes()

        # Write the entire data frame to the output table
        self.write_df_rows_to_table(out_table, fields_to_write, df_fields_to_read, transformation)

    def populate_route_type_text(self, is_shapefile=False):
        """Add a route_type_text field to the dataframe that converts the route_type enum to helpful text."""
        if is_shapefile:
            route_type_text_field_name = "rt_tp_txt"
        else:
            route_type_text_field_name = "route_type_text"
        self.data_frame[route_type_text_field_name] = self.data_frame["route_type"].map(GTFS_ROUTE_TYPES)
        self.fields.append(route_type_text_field_name)

    def calculate_point_shapes(self):
        """Add field to the dataframe and calculate arcpy.PointGeometry objects from the lat/lon fields."""
        def make_point(lat, lon):
            point = arcpy.Point()
            point.X = lon
            point.Y = lat
            # GTFS stop lat/lon is written in WGS84
            pt_geom = arcpy.PointGeometry(point, WGS_COORDS)
            return pt_geom
        self.data_frame[PTSHAPE_FIELD] = self.data_frame.apply(
            lambda row: make_point(row[self.lat_field], row[self.lon_field]), axis=1
            )

    def remove_stops_with_conditionally_required_geometry(self):
        """Remove stops with location_type values with conditionally-required lat/lon when no lat/lon present."""
        # The GTFS specification for stops.txt was updated in 2019 to include location_type enums 3 and 4, which do not
        # require stop_lat and stop_lon values. Since we generally need stop geometry and cannot use these
        # non-geometrical stop types, just remove them and warn the user that we have done so.
        if not self.lat_field and self.lon_field:
            return
        if "location_type" not in self.fields:
            return

        # Remove rows where location_type is 3 or 4 and either stop_lat or stop_lon is empty.
        initial_num_rows = self.data_frame.shape[0]
        condition = ((self.data_frame["location_type"] == "3") | (self.data_frame["location_type"] == "4")) & \
                    ((self.data_frame[self.lat_field].isna()) | (self.data_frame[self.lon_field].isna()))
        self.data_frame.drop(self.data_frame[condition].index, inplace=True)
        updated_num_rows = self.data_frame.shape[0]

        # If any were removed, throw a warning.
        if updated_num_rows != initial_num_rows:
            # The input GTFS stops.txt file contains some stops with null stop_lat or stop_lon values and location_type
            # values for which null stop_lat and stop_lon values are acceptable. These stops were not included in the
            # output.
            arcpy.AddIDMessage("WARNING", 3376)

    def convert_YYYYMMDD_to_date(self, field):  # Name uses standard date string format. pylint: disable=invalid-name
        """Convert a YYYYMMDD format string field in the dataframe to a date.

        Args:
            field: field in the dataframe to convert to a date.
        Returns:
            No return value.
        Raises:
            Raises gtfs_utils.Error if the conversion to date fails.  The tool calling this method must handle the
            exception.

        """
        try:
            self.data_frame[field] = pandas.to_datetime(self.data_frame[field], format='%Y%m%d')
        except ValueError:
            # Conversion of date field %1 to a datetime object failed for GTFS file %2. All values in this field must
            # conform to the YYYYMMDD date format required by the GTFS specification.
            raise Error(2819, field, self.gtfs_file)

    def convert_str_time_to_secs(self, field):
        """Convert strings of the format HH:MM:SS or HH:MM to seconds since midnight.

        Args:
            field: field in the dataframe to convert from string time to seconds since midnight.
        Returns:
            No return value.
        Raises:
            Raises gtfs_utils.Error if the conversion fails.  The tool calling this method must handle the
            exception.

        """
        try:
            self.data_frame[field] = pandas.to_timedelta(self.data_frame[field]).dt.total_seconds().round(0)
        except ValueError:
            # Failed to parse one or more values in the time field %1 in GTFS file %2. All values in this field must
            # conform to the HH:MM:SS time format required by the GTFS specification.
            raise Error(2820, field, self.gtfs_file)


class FeaturesToGTFSConverter:
    """Base class with methods for writing an ArcGIS feature class to GTFS format."""

    def __init__(self, table, gtfs_file_type, exclude_fields=None):
        """Read the ArcGIS table and gather some basic info about its fields.

        Args:
            table: Input table to convert to a GTFS file
            gtfs_file_type: The type of the GTFS file, from the GTFS specification.  Examples: stops.txt, routes.txt.
            exclude_fields: List of fields in the input feature class to exclude from the output GTFS file.  In
                particular, use this to skip the route_id and route_type fields that GTFS Stops To Features adds to
                a feature class of stops so Features To GTFS Stops doesn't perpetually complain about them.
        Returns:
            No return value.
        Raises:
            No exceptions.

        """
        # ArcGIS table or feature class containing GTFS-like data to convert
        self.table = table

        # GTFS file type to create. Example: stops.txt
        self.gtfs_file_type = gtfs_file_type

        # Fields to ignore
        self.exclude_fields = exclude_fields if exclude_fields else []

        # Get the Describe object for future use and list the fields
        self.desc = arcpy.Describe(self.table)
        self.fields = self._get_table_fields()

        # If the GTFS file has latitude and longitude fields, figure out what they are.
        if self.gtfs_file_type in GTFS_LATLON_FIELDS:
            self.lat_field = GTFS_LATLON_FIELDS[self.gtfs_file_type][0]
            self.lon_field = GTFS_LATLON_FIELDS[self.gtfs_file_type][1]
        else:
            self.lat_field = None
            self.lon_field = None

    def _get_table_fields(self):
        """Return a list of field names from the ArcGIS table."""
        # Do not include fields types that don't make sense in a csv file
        bad_field_types = ["Blob", "OID", "Geometry", "Raster"]
        return [f.name for f in self.desc.fields if f.type not in bad_field_types and f.name not in self.exclude_fields]

    def _validate_required_gtfs_fields(self):
        """Ensure the input table has all fields required by the GTFS specification.

        Args:
            No arguments.
        Returns:
            No return value.
        Raises:
            Raises gtfs_utils.Error if required fields are missing.  The tool calling this method must handle the
            exception.

        """
        # lat/long not required because we'll derive the values from the feature geometry
        required_fields = [f for f in GTFS_FIELDS[self.gtfs_file_type]
                           if GTFS_FIELDS[self.gtfs_file_type][f].is_required
                           and f not in [self.lat_field, self.lon_field]]
        if not set(required_fields).issubset(set(self.fields)):
            missing_fields = [f for f in required_fields if f not in self.fields]
            # The input table is missing one or more fields required by the GTFS specification: %1
            raise Error(2610, ", ".join(missing_fields))

    def _check_for_non_gtfs_fields(self):
        """Throw a warning if the input table has fields that aren't part of GTFS."""
        non_gtfs_fields = [f for f in self.fields if f not in GTFS_FIELDS[self.gtfs_file_type]]
        if non_gtfs_fields:
            # The input table contains one or more fields not recognized by the GTFS specification: %1
            arcpy.AddIDMessage("WARNING", 2611, ", ".join(non_gtfs_fields))

    def validate_fields(self):
        """Run validation checks on the input table's fields in preparation for conversion to GTFS."""
        self._validate_required_gtfs_fields()
        self._check_for_non_gtfs_fields()

    @staticmethod
    def _check_for_null_values(row, non_null_idxs):
        """Check if the table row has null values for a field that should not be null.

        Args:
            row: Table row from cursor.
            non_null_idxs: Index values for items in row that must not be null.
        Returns:
            No return value.
        Raises:
            Raises gtfs_utils.Error if null values are found.  The tool calling this method must handle the exception.

        """
        # non_null_idxs: {idx: fieldname}
        for idx in non_null_idxs:
            if row[idx] is None or row[idx] == "":
                # The table contains null values for required GTFS field %1.
                raise Error(2612, non_null_idxs[idx])

    def table_to_gtfs_csv(self, out_csv, transformation=None):
        """Write ArcGIS table to a GTFS csv file, with special lat/lon field handling if necessary."""
        # Handle lat/lon fields in a special way
        csv_fields = [f for f in self.fields if f not in [self.lat_field, self.lon_field]]
        table_fields = [f for f in self.fields if f not in [self.lat_field, self.lon_field]]
        non_nullable_fields = [f for f in GTFS_FIELDS[self.gtfs_file_type]
                               if not GTFS_FIELDS[self.gtfs_file_type][f].is_nullable]
        non_nullable_idxs = {table_fields.index(f): f for f in non_nullable_fields if f in table_fields}
        if self.lat_field and self.lon_field:
            csv_fields += [self.lat_field, self.lon_field]
            table_fields += [SHAPE_CURSOR_Y, SHAPE_CURSOR_X]

        with open(out_csv, "w", encoding=GTFS_ENCODING_OUTPUT, newline="") as out_f:
            writer = csv.writer(out_f)
            # Write column headers
            writer.writerow(csv_fields)

            # Loop through the table and write to csv
            with arcpy.da.SearchCursor(  # pylint: disable=no-member
                self.table, table_fields, spatial_reference=WGS_COORDS, datum_transformation=transformation
            ) as cur:
                for row in cur:
                    row = list(row)
                    self._check_for_null_values(row, non_nullable_idxs)
                    # Handle updating lat/lon values from geometry if necessary
                    writer.writerow(row)


class Tool:  # pylint:disable=too-few-public-methods
    """Base class for GTFS tools."""

    @staticmethod
    def _is_output_shapefile(output_file_path):
        """Determine if the tool's output is going to be a shapefile.

        Args:
            output_file_path: Tool's output file path
        Returns:
            True if the output is going to be a shapefile, False otherwise.
        Raises:
            No exceptions.

        """
        return ".shp" in os.path.splitext(output_file_path)[1].lower()

    @staticmethod
    def _is_output_fds_versioned(output_fds):
        """Return True if the output feature dataset is versioned (contains existing versioned data)."""
        return arcpy.Describe(output_fds).isVersioned


class ToolValidator:
    """Base class for the tool validation logic used by every python tool.

    The class does not provide implementation for any methods. The sub class is responsible for providing the
    implementation of methods as described by the validation logic specific to the tool.
    """

    def __init__(self):
        """Set arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):  # pylint: disable=invalid-name
        """Refine the properties of a tool's parameters. This method is called when the tool is opened."""

    def updateParameters(self):  # pylint: disable=invalid-name
        """Modify the values and properties of parameters before internal validation is performed.

        This method is called whenever a parameter has been changed.
        """

    def updateMessages(self):  # pylint: disable=invalid-name
        """Modify the messages created by internal validation for each tool parameter.

        This method is called after internal validation.
        """
