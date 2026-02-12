"""Provides validation and execution logic for the GTFS To Network Dataset Transit Sources tool."""

import os
import pandas as pd
import arcpy
import gtfs_utils
import spatial_reference_helper


# GTFS files required to run this tool. Left global so tool validator can see it.
REQUIRED_GTFS_FILES = ("stops.txt", "routes.txt", "trips.txt", "stop_times.txt")

# Maximum number of trip_ids to show in a warning message that interpolation couldn't be completed successfully.
# We truncate the number shown to avoid creating massive warning messages for very bad data.
MAX_BAD_TRIPS_TO_REPORT = 10
# Maximum number of trip_ids to show in a warning message that shape_id values are null or aren't in the shapes.txt file
# and couldn't be used to generate LVEShapes.  We truncate the number shown to avoid creating massive warning messages
# for very bad data.
MAX_BAD_SHAPES_TO_REPORT = 10


def ValidateRequiredGTFSFiles(gtfs_folder):  # pylint: disable=invalid-name
    """Check if the required GTFS files are present in the input GTFS directory.

    Throw a gtfs_utils.Error if not.
    """
    # Input GTFS folder %s is missing required GTFS files. The required GTFS files are: stops.txt, routes.txt,
    # trips.txt, stop_times.txt, and either calendar.txt, calendar_dates.txt, or both.
    # Some files (REQUIRED_GTFS_FILES) are absolutely required
    for gtfs_file in REQUIRED_GTFS_FILES:
        if not os.path.exists(os.path.join(gtfs_folder, gtfs_file)):
            raise gtfs_utils.Error(2823, gtfs_folder)
    # At least one of calendar.txt or calendar_dates.txt must be present
    if not os.path.exists(os.path.join(gtfs_folder, "calendar.txt")) and \
       not os.path.exists(os.path.join(gtfs_folder, "calendar_dates.txt")):
        raise gtfs_utils.Error(2823, gtfs_folder)


def unqualify_table_names(gdb, table_names):
    """Return a list of unqualified table names from a list of table names from ListTables or ListFeatureClasses."""
    return [arcpy.ParseTableName(t, gdb).split(", ")[2] for t in table_names]


def get_fd_feature_class_names(feature_dataset):
    """Return a lowercased list of the names of feature classes in the designated feature dataset."""
    with arcpy.EnvManager(workspace=os.path.dirname(feature_dataset)):
        fcs = unqualify_table_names(
            os.path.dirname(feature_dataset),
            arcpy.ListFeatureClasses(feature_dataset=os.path.basename(feature_dataset))
        )
    return [f.lower() for f in fcs]


def do_output_tables_exist(gdb, table_names):
    """Determine if all tables already exist in the geodatabase."""
    with arcpy.EnvManager(workspace=gdb):
        tables = unqualify_table_names(gdb, arcpy.ListTables())
    return set(table_names).issubset(set(tables))


class GTFSTable:
    """Defines useful properties of the input gtfs file we can reference during conversion."""

    # pylint: disable=too-few-public-methods
    # pylint: disable=too-many-instance-attributes

    def __init__(self, filename, required_tool_fields, optional_tool_fields=(), non_null_fields=(), has_geom=False,
                 direct_mapping=None, date_fields=()):
        """Set properties of the gtfs table."""
        # pylint: disable=too-many-arguments
        # Which gtfs file? Includes file extension.  Example: stops.txt
        self.filename = filename
        # Fields in the gtfs file required for this tool to run successfully.
        self.required_tool_fields = required_tool_fields
        # Fields in the gtfs file which will be utilized if present but are not requried.
        self.optional_tool_fields = optional_tool_fields
        # Fields which can't be null for our tool to work
        if non_null_fields:
            self.non_null_fields = non_null_fields
        else:
            self.non_null_fields = tuple(
                [f for f in gtfs_utils.GTFS_FIELDS[filename]
                 if not gtfs_utils.GTFS_FIELDS[filename][f].is_nullable]
            )
        # Whether or not the table has lat/lon fields that can be used to construct geometry
        self.has_geom = has_geom
        # A dictionary mapping a gtfs field name or derived field in the dataframe to a network data model field name
        # for use when there is a direct conversion from the dataframe to the output table in the data model.
        # (Stops, Calendars, CalendarExceptions)
        if not direct_mapping:
            direct_mapping = {}
        self.direct_mapping = direct_mapping
        # Fields in the gtfs file in YYYYMMDD date format
        self.date_fields = date_fields
        self.converter = None

    def make_converter_object(self, gtfs_folder):
        """Create a GTFSToFeaturesConverter object for this gtfs file type, for a file of this type in the given folder.

        Also do some basic validation of the file.
        """
        # Create the object
        gtfs_file_path = os.path.join(gtfs_folder, self.filename)
        self.converter = gtfs_utils.GTFSToFeaturesConverter(gtfs_file_path)

        # Ensure all required fields are present
        self.converter.validate_required_tool_fields(self.required_tool_fields)

        # Build list of gtfs file fields to read into the dataframe (fields we will actually use)
        optional_fields_to_use = [f for f in self.optional_tool_fields if f in self.converter.fields]
        gtfs_fields = list(self.required_tool_fields) + optional_fields_to_use
        # Read gtfs table into pandas dataframe
        self.converter.gtfs_to_df(gtfs_fields)

        # Sometimes gtfs files are present but have no data. For some files, this is an error, but it doesn't matter for
        # some other optional files (like frequencies.txt)
        if self.filename in REQUIRED_GTFS_FILES:
            self.converter.validate_df_not_empty()
        else:
            # If the file isn't required, and it's present but empty, reset the converter to None so we just ignore it.
            if self.converter.is_df_empty():
                self.converter = None
                return
        # Validate that there are no nulls in fields that require data for our tool to work
        non_null_fields = [f for f in self.non_null_fields if f in gtfs_fields]
        self.converter.validate_fields_not_null(non_null_fields)
        # Validate that fields that must be unique are actually unique
        self.converter.validate_fields_unique(
            [f for f in gtfs_utils.GTFS_FIELDS[self.filename]
             if gtfs_utils.GTFS_FIELDS[self.filename][f].is_unique]
        )


class GTFSProperties:  # pylint: disable=too-few-public-methods
    """Define objects for each input gtfs table we will use with properties that are helpful when using them."""

    def __init__(self):
        """Initialize object defining generic properties of each gtfs table we're working with."""
        self.stops = GTFSTable(
            filename="stops.txt",
            required_tool_fields=("stop_lat", "stop_lon", "stop_id"),
            optional_tool_fields=("location_type", "parent_station", "wheelchair_boarding"),
            has_geom=True,
            direct_mapping={
                "stop_id": "GStopID",
                "parent_station": "GStopParen",
                "location_type": "GStopType",
                "wheelchair_boarding": "GWheelchairBoarding",
                "ID": "ID",
                "ParentID": "ParentID"
            }
        )
        self.calendar = GTFSTable(
            filename="calendar.txt",
            required_tool_fields=(
                "service_id",
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
                "start_date",
                "end_date"
                ),
            direct_mapping={
                "service_id": "GServiceID",
                "monday": "Monday",
                "tuesday": "Tuesday",
                "wednesday": "Wednesday",
                "thursday": "Thursday",
                "friday": "Friday",
                "saturday": "Saturday",
                "sunday": "Sunday",
                "start_date": "StartDate",
                "end_date": "EndDate",
                "ID": "ID"
            },
            date_fields=("start_date", "end_date")
        )
        self.calendar_dates = GTFSTable(
            filename="calendar_dates.txt",
            required_tool_fields=("service_id", "date", "exception_type"),
            direct_mapping={
                "service_id": "GServiceID",
                "date": "ExceptionDate",
                "exception_type": "GExceptionType",
                "CalendarID": "CalendarID"
            },
            date_fields=("date",)
        )
        self.stop_times = GTFSTable(
            filename="stop_times.txt",
            required_tool_fields=("trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence"),
            non_null_fields=tuple(
                [f for f in gtfs_utils.GTFS_FIELDS["stop_times.txt"]
                 if not gtfs_utils.GTFS_FIELDS["stop_times.txt"][f].is_nullable]
                ),
        )
        self.routes = GTFSTable(
            filename="routes.txt",
            required_tool_fields=("route_id", "route_type"),
        )
        self.trips = GTFSTable(
            filename="trips.txt",
            required_tool_fields=("trip_id", "route_id", "service_id"),
            optional_tool_fields=("direction_id", "wheelchair_accessible", "bikes_allowed", "shape_id")
        )
        self.frequencies = GTFSTable(
            filename="frequencies.txt",
            required_tool_fields=("trip_id", "start_time", "end_time", "headway_secs")
        )
        self.shapes = GTFSTable(
            filename="shapes.txt",
            required_tool_fields=()
        )


class GTFSToNetworkDatasetTransitSources(gtfs_utils.Tool):
    """Converts GTFS datasets into the feature classes and tables for transit-enabled network datasets."""

    # pylint: disable=too-few-public-methods
    # pylint: disable=too-many-instance-attributes

    def __init__(self, in_gtfs_folders, target_feature_dataset, interpolate=False, append=False, make_lve_shapes=False):
        """Store tool parameter values as instance names.

        Args:
            in_gtfs_folders: The input folders containing the GTFS datasets to use for the network dataset
            target_feature_dataset: The feature dataset where the network dataset will be created. Output from this tool
                will be saved there or in the parent geodatabase.
            interpolate: Whether to estimate blank arrival_time and departure_time values in stop_times.txt by
                interpolating values. If False, any blank values in arrival_time or departure_time will prevent the GTFS
                dataset from being processed.
            append: Whether to append to existing data model tables or write the output to new ones.
        Returns:
            No return value.
        Raises:
            No exceptions.

        """
        self.in_gtfs_folders = in_gtfs_folders
        self.target_feature_dataset = target_feature_dataset
        self.append = append
        self.interpolate = interpolate
        self.make_lve_shapes = make_lve_shapes

        # Initialize some global variables for reference later
        self.gtfs_props = None
        self.service_id_dict = {}  # {service_id: CalendarID}
        self.max_stop_id = 0
        self.max_calendar_id = 0
        self.max_line_id = 0
        self.max_linevar_id = 0
        self.max_sched_id = 0
        self.max_run_id = 0
        self.max_lves_id = 0
        self.gtfs_needs_interpolation = True
        self.can_use_shapes = False
        self.shape_geoms = None
        self.stop_ids_not_in_stops = None

        # Define temporary feature class locations for storing data used when generating LVEShapes
        self.temp_gtfs_shapes = arcpy.CreateUniqueName("TempGTFSShapes", "memory")

        # Initialize an instance of the network data model with filepaths specific to our desired output location
        self.nd_model = self._initialize_nd_model()
        # List of the outputs files in the order that the tool's derived outputs expects.
        self.outputs = [
            self.nd_model.stops,
            self.nd_model.line_variant_elements,
            self.nd_model.calendars,
            self.nd_model.calendar_exceptions,
            self.nd_model.lines,
            self.nd_model.line_variants,
            self.nd_model.runs,
            self.nd_model.schedule_elements,
            self.nd_model.schedules
        ]
        self.output_files = [output.filepath for output in self.outputs]
        if self.make_lve_shapes:
            self.outputs.append(self.nd_model.lve_shapes)
            self.output_files.append(self.nd_model.lve_shapes.filepath)

        if self.append:
            # Make sure output tables exist
            actual_fd_fc_names = get_fd_feature_class_names(self.target_feature_dataset)
            required_output_fcs = {
                f.table_name.lower() for f in [self.nd_model.stops, self.nd_model.line_variant_elements]}
            lveshapes_exists = self.nd_model.lve_shapes.table_name.lower() in actual_fd_fc_names
            if not (
                # Required output feature classes missing
                required_output_fcs.issubset(set(actual_fd_fc_names))
            ) or not do_output_tables_exist(  # Required output tables missing
                os.path.dirname(self.target_feature_dataset),
                [t.table_name for t in [
                    self.nd_model.calendars,
                    self.nd_model.calendar_exceptions,
                    self.nd_model.lines,
                    self.nd_model.line_variants,
                    self.nd_model.runs,
                    self.nd_model.schedule_elements,
                    self.nd_model.schedules
                ]]
            ) or (self.make_lve_shapes and not lveshapes_exists):  # LVEShapes missing
                # Cannot append GTFS data to existing data model tables.
                arcpy.AddIDMessage("ERROR", 2921)
                # One or more public transit data model tables does not exist.
                raise gtfs_utils.Error(2922)

            if not self.make_lve_shapes and lveshapes_exists:
                # If appending and LVEShapes exists, they won't be added onto.  Warn the user, but allow them to
                # proceed in case they have some external or manual process for generating LVEShapes.
                # The existing public transit data model tables include the LVEShapes feature class, but the
                # option to make LVEShapes from the shapes.txt file is set to False. LVEShapes features will not
                # be created for the appended data.
                arcpy.AddIDMessage("WARNING", 240022)

            # Make sure output tables have the correct schema
            self._update_output_table_schema()

            # Update global variables with max ID values from existing tables
            # pragma pylint: disable=no-member
            self.max_stop_id = sorted(arcpy.da.SearchCursor(self.nd_model.stops.filepath, ["ID"]), reverse=True)[0][0]
            self.max_calendar_id = max(
                sorted(arcpy.da.SearchCursor(self.nd_model.calendars.filepath, ["ID"]), reverse=True)[0][0],
                sorted(arcpy.da.SearchCursor(self.nd_model.calendar_exceptions.filepath, ["CalendarID"]),
                       reverse=True)[0][0]
                )
            self.max_line_id = sorted(arcpy.da.SearchCursor(self.nd_model.lines.filepath, ["ID"]), reverse=True)[0][0]
            self.max_linevar_id = sorted(arcpy.da.SearchCursor(self.nd_model.line_variants.filepath, ["ID"]),
                                         reverse=True)[0][0]
            self.max_sched_id = sorted(arcpy.da.SearchCursor(self.nd_model.schedules.filepath, ["ID"]),
                                       reverse=True)[0][0]
            self.max_run_id = sorted(arcpy.da.SearchCursor(self.nd_model.runs.filepath, ["ID"]), reverse=True)[0][0]
            if self.make_lve_shapes and lveshapes_exists:
                self.max_lves_id = sorted(
                    arcpy.da.SearchCursor(self.nd_model.lve_shapes.filepath, ["ID"]), reverse=True)[0][0]
            # pragma pylint: enable=no-member

        # Determine the output spatial reference
        self.output_spatial_ref = spatial_reference_helper.determine_output_spatial_ref(target_feature_dataset, None)
        # Set a variable for datum transformation. This will be updated for each GTFS dataset based on the extent of
        # the stops.
        self.transformation = None

    def execute(self):
        """Tool Execution logic. Returns a list of output tables that were created."""
        # Fail out immediately if the target feature dataset is versioned, meaning that it contains pre-existing data
        # that is versioned. After extensive experimentation, I could not find a consistent way to make this situation
        # work, and the GDB Team discourages "mixed-mode" situations where some data is versioned and other data isn't.
        # Essentially, insert cursors don't allow you to insert rows into multiple tables at once (as I have to do in
        # this tool so I don't have to read through stop_times more than once) unless you open an edit session. Edit
        # sessions can be opened with multiple options, and none of them work for all options of versioning states and
        # types for data in SDE, and python doesn't offer any way to determine which mode of versioning was used. The
        # cleanest thing to do in this situation is to require that the user unversion their target feature dataset
        # before running this tool.
        if self._is_output_fds_versioned(self.target_feature_dataset):
            # %s must not be registered as versioned
            raise gtfs_utils.Error(23, self.target_feature_dataset)

        # For each input gtfs dataset, process the data and add rows to the output. If processing the gtfs dataset fails
        # due to a known issue, log it as a warning rather than failing the tool completely. The tool only fails if none
        # of the datasets succeeds in processing.
        any_succeeded = False
        output_exists = bool(self.append)
        for gtfs_folder in self.in_gtfs_folders:
            # Clear the cache of gtfs properties and reset variables
            del self.gtfs_props
            self.service_id_dict = {}
            self.gtfs_needs_interpolation = True
            self.shape_geoms = None
            self.stop_ids_not_in_stops = set()

            # Processing input GTFS dataset %s...
            arcpy.AddIDMessage("INFORMATIVE", 2816, gtfs_folder)
            # Static properties of gtfs that we'll reference during conversion
            self.gtfs_props = GTFSProperties()
            try:
                # Make sure the input GTFS folder has the correct tables.
                ValidateRequiredGTFSFiles(gtfs_folder)
                # Initialize and validate gtfs dataset
                self._initialize_gtfs_dataset(gtfs_folder)
                any_succeeded = True  # At least one dataset passed validation.
                if not output_exists:
                    # Create the output tables after the first successfully validated gtfs dataset.
                    # (There is no point in creating output tables if no gtfs datasets pass validation.)
                    self._create_output_tables()
                    output_exists = True
            except gtfs_utils.Error as err:
                # If a validation error occurred, throw a warning and move on to the next dataset
                # Failed to process GTFS dataset %s
                arcpy.AddIDMessage("WARNING", 2923, gtfs_folder)
                arcpy.AddIDMessage("WARNING", err.message_id, err.add_arg1, err.add_arg2)
                continue
            # If no problems were encountered, add the GTFS data to the output
            self._add_gtfs_to_output_tables()
        if not any_succeeded:
            # No input GTFS datasets were processed successfully.
            raise gtfs_utils.Error(2924)

        # Return to the caller a list of the outputs that were created in the order that the tool's derived outputs
        # expects.
        return self.output_files

    def _initialize_nd_model(self):
        """Create a gtfs_utils.NetworkDataModel object and set filepaths to our output location."""
        target_gdb = os.path.dirname(self.target_feature_dataset)
        nd_model = gtfs_utils.NetworkDataModel()
        nd_model.stops.filepath = os.path.join(self.target_feature_dataset, nd_model.stops.table_name)
        nd_model.lines.filepath = os.path.join(target_gdb, nd_model.lines.table_name)
        nd_model.line_variants.filepath = os.path.join(target_gdb, nd_model.line_variants.table_name)
        nd_model.line_variant_elements.filepath = os.path.join(
            self.target_feature_dataset,
            nd_model.line_variant_elements.table_name
            )
        nd_model.schedules.filepath = os.path.join(target_gdb, nd_model.schedules.table_name)
        nd_model.schedule_elements.filepath = os.path.join(target_gdb, nd_model.schedule_elements.table_name)
        nd_model.runs.filepath = os.path.join(target_gdb, nd_model.runs.table_name)
        nd_model.calendars.filepath = os.path.join(target_gdb, nd_model.calendars.table_name)
        nd_model.calendar_exceptions.filepath = os.path.join(target_gdb, nd_model.calendar_exceptions.table_name)
        nd_model.lve_shapes.filepath = os.path.join(self.target_feature_dataset, nd_model.lve_shapes.table_name)
        return nd_model

    def _check_if_gtfs_needs_interpolation(self):
        """If there are no blank values in arrival_time or departure_time, set self.gtfs_needs_interpolation = False."""
        null_arr = self.gtfs_props.stop_times.converter.field_has_null("arrival_time")
        null_dep = self.gtfs_props.stop_times.converter.field_has_null("departure_time")
        if not null_arr and not null_dep:
            # Although interpolation was requested, this gtfs dataset has no blank values in arrival_time or
            # departure_time, so no further interpolation action is required.
            self.gtfs_needs_interpolation = False

    def _can_use_shapes_for_dataset(self, gtfs_folder):
        """Check the input dataset to determine if we can attempt to generate LVEShapes from shapes.txt."""
        # The shapes.txt file must exist
        if not os.path.exists(os.path.join(gtfs_folder, "shapes.txt")):
            # GTFS dataset %s does not have a shapes.txt file.
            arcpy.AddIDMessage("WARNING", 240016, gtfs_folder)
            return False
        # The trips.txt file must have a shape_id field
        if "shape_id" not in self.gtfs_props.trips.converter.get_df_column_names():
            # %s is missing the shape_id field.
            arcpy.AddIDMessage("WARNING", 240017, os.path.join(gtfs_folder, self.gtfs_props.trips.filename))
            return False
        # It can't be all null.  (Individual null values will be skipped later during processing.)
        if self.gtfs_props.trips.converter.field_all_null("shape_id"):
            # The shape_id field in %s has all null values.
            arcpy.AddIDMessage("WARNING", 240018, os.path.join(gtfs_folder, self.gtfs_props.trips.filename))
            return False
        # Generate temporary shape geometries
        try:
            # Lots of validation for the shapes.txt file is done in the GTFSShapesToFeatures tool and does not need to
            # be repeated here in this tool.  Just let GTFSShapesToFeatures do it and catch the errors.
            # Use WGS coords so it has the same coordinate system as the stops. Project/transformation is taken care of
            # properly when inserting the shape segments into the final output.
            with arcpy.EnvManager(overwriteOutput=True, outputCoordinateSystem=gtfs_utils.WGS_COORDS):
                arcpy.transit.GTFSShapesToFeatures(
                    os.path.join(gtfs_folder, self.gtfs_props.shapes.filename),
                    self.temp_gtfs_shapes
                )
        except arcpy.ExecuteError:
            # Unable to create shapes features from %s.
            arcpy.AddIDMessage(
                "WARNING", 240019,
                os.path.join(gtfs_folder, self.gtfs_props.shapes.filename)
            )
            # Add GTFS Shapes To Features tool warning and error messages as warnings
            # GetAllMessages: https://pro.arcgis.com/en/pro-app/latest/arcpy/functions/getallmessages.htm
            for msg in [m[2] for m in arcpy.GetAllMessages() if m[0] in [50, 100] and m[1] > 0]:
                arcpy.AddWarning(msg)
            return False
        # If we got this far, validation has passed, and we can attempt to use shapes.txt to generate LVEShapes
        return True

    def _initialize_gtfs_dataset(self, gtfs_folder):  # pylint: disable=too-many-branches
        """For a given gtfs dataset, read in relevant tables and do basic validation."""
        # Create GTFSToFeaturesConverter objects for each relevant gtfs file and do basic validation
        self.gtfs_props.stops.make_converter_object(gtfs_folder)
        if os.path.exists(os.path.join(gtfs_folder, self.gtfs_props.calendar.filename)):
            self.gtfs_props.calendar.make_converter_object(gtfs_folder)
        if os.path.exists(os.path.join(gtfs_folder, self.gtfs_props.calendar_dates.filename)):
            self.gtfs_props.calendar_dates.make_converter_object(gtfs_folder)
        self.gtfs_props.stop_times.make_converter_object(gtfs_folder)
        self.gtfs_props.trips.make_converter_object(gtfs_folder)
        self.gtfs_props.routes.make_converter_object(gtfs_folder)
        if os.path.exists(os.path.join(gtfs_folder, self.gtfs_props.frequencies.filename)):
            self.gtfs_props.frequencies.make_converter_object(gtfs_folder)

        if self.gtfs_props.calendar.converter is None and self.gtfs_props.calendar_dates.converter is None:
            # The calendar.txt and calendar_dates.txt files in input GTFS dataset %s do not exist or contain no rows.
            # At least one of these files must exist and contain data.
            raise gtfs_utils.Error(2821, gtfs_folder)

        # Do some basic validation of the input tables to ensure the dataset is usable.
        trips_fields = self.gtfs_props.trips.converter.get_df_column_names()
        stops_fields = self.gtfs_props.stops.converter.get_df_column_names()

        # Validate arrival_time and departure_time fields in stop_times
        if not self.interpolate:
            # Validate that there are no nulls in arrival_time and departure_time fields
            self.gtfs_props.stop_times.converter.validate_fields_not_null(["arrival_time", "departure_time"])
        else:
            # First check if there are any nulls at all
            self._check_if_gtfs_needs_interpolation()
            if self.gtfs_needs_interpolation:
                # Validate that ALL values in arrival_time and departure_time are not null. If they are, there's nothing
                # we can do, and we have to throw an error.
                self.gtfs_props.stop_times.converter.validate_fields_not_all_null(["arrival_time", "departure_time"])
                # Simple first-pass for correcting blank values: If arrival_time has a value but departure_time does
                # not, set the departure_time value to the arrival_time value, and vice-versa
                self.gtfs_props.stop_times.converter.fill_na_from_field("departure_time", "arrival_time")
                self.gtfs_props.stop_times.converter.fill_na_from_field("arrival_time", "departure_time")
                # After simple first pass, check if we still have remaining nulls and set bool
                self._check_if_gtfs_needs_interpolation()

        # Validate stop lat/lon values
        self.gtfs_props.stops.converter.remove_stops_with_conditionally_required_geometry()
        self.gtfs_props.stops.converter.validate_lat_lon_values()

        # Validate that all ints that were read as strings (because they contain nulls) are actually ints
        to_validate = [f for f in ["location_type", "wheelchair_boarding"] if f in stops_fields]
        if to_validate:
            self.gtfs_props.stops.converter.validate_txt_fields_are_ints(to_validate)
        self.gtfs_props.routes.converter.validate_txt_fields_are_ints(["route_type"])
        to_validate = [f for f in ["direction_id", "wheelchair_accessible", "bikes_allowed"] if f in trips_fields]
        if to_validate:
            self.gtfs_props.trips.converter.validate_txt_fields_are_ints(to_validate)

        # Validate that all values in relevant fields match allowed values
        # Note: gtfs specifies domains for some fields that we do NOT check because we don't need to maintain that level
        # of strictness.  There are cases where the user might want some additional flexibility, and there's no reason
        # why our tools won't work if they add values outside the domain.  However, there are other cases where we must
        # require adherence to the domain.
        # Not checking:
        #   - stops: location_type, wheelchair_boarding
        #   - routes: route_type
        if self.gtfs_props.calendar.converter:
            for wkdy_fld in [f for f in gtfs_utils.GTFS_FIELDS["calendar.txt"] if "day" in f]:
                self.gtfs_props.calendar.converter.validate_values_in_domain(wkdy_fld, [0, 1])
        if self.gtfs_props.calendar_dates.converter:
            self.gtfs_props.calendar_dates.converter.validate_values_in_domain("exception_type", [1, 2])
        for field in ["wheelchair_accessible", "bikes_allowed"]:
            if field in trips_fields:
                self.gtfs_props.trips.converter.validate_values_in_domain(field, ["0", "1", "2"])
        if "direction_id" in trips_fields:
            self.gtfs_props.trips.converter.validate_values_in_domain("direction_id", ["0", "1"])

        # Convert YYYYMMDD dates in calendar and calendar_dates to python datetime objects
        if self.gtfs_props.calendar.converter:
            for date_field in self.gtfs_props.calendar.date_fields:
                self.gtfs_props.calendar.converter.convert_YYYYMMDD_to_date(date_field)
        if self.gtfs_props.calendar_dates.converter:
            for date_field in self.gtfs_props.calendar_dates.date_fields:
                self.gtfs_props.calendar_dates.converter.convert_YYYYMMDD_to_date(date_field)

        # Convert HH:MM:SS times in stop_times and frequencies to python datetime objects
        self.gtfs_props.stop_times.converter.convert_str_time_to_secs("arrival_time")
        self.gtfs_props.stop_times.converter.convert_str_time_to_secs("departure_time")
        if self.gtfs_props.frequencies.converter:
            self.gtfs_props.frequencies.converter.convert_str_time_to_secs("start_time")
            self.gtfs_props.frequencies.converter.convert_str_time_to_secs("end_time")

        # Get correct datum transformation for this dataset based on stop extent
        extent = self.gtfs_props.stops.converter.make_extent_from_lat_lon_values()
        self.transformation = spatial_reference_helper.get_datum_transformation(
            gtfs_utils.WGS_COORDS, self.output_spatial_ref, extent
        )

        # Calculate geometry from lat/lon fields
        self.gtfs_props.stops.converter.calculate_point_shapes()

        # If requested, check the input dataset to determine if it will be possible to use shapes.txt to generate the
        # LVEShapes geometries and cache the geometries in a dataframe for quick lookups
        if self.make_lve_shapes:
            self.can_use_shapes = self._can_use_shapes_for_dataset(gtfs_folder)
            if not self.can_use_shapes:
                # LVEShapes geometry will be generated using straight lines for GTFS dataset %s.
                arcpy.AddIDMessage("WARNING", 240020, gtfs_folder)
            else:
                shape_fields = ["shape_id", gtfs_utils.SHAPE_CURSOR]
                df_fields = ["shape_id", "Geometry"]
                if "route_id" in [f.name.lower() for f in arcpy.ListFields(self.temp_gtfs_shapes)]:
                    shape_fields.append("route_id")
                    df_fields.append("route_id")
                with arcpy.da.SearchCursor(self.temp_gtfs_shapes, shape_fields) as cur:  # pylint:disable=no-member
                    self.shape_geoms = pd.DataFrame(cur, columns=df_fields)
                self.shape_geoms.set_index("shape_id", inplace=True)
                # Clean up temporary shapes feature class because we're done with it
                try:
                    arcpy.management.Delete(self.temp_gtfs_shapes)
                except Exception:  # pylint: disable=broad-except
                    # If this doesn't work for some reason, don't worry about it, and don't make the tool fail.
                    pass

    def _create_output_tables(self):
        """Create empty output tables based on the data model schema."""
        # Stops
        gtfs_utils.make_output_table(
            self.nd_model.stops.filepath,
            [f.field_description for f in self.nd_model.stops.fields],
            self.output_spatial_ref,
            "POINT"
            )
        # Lines
        gtfs_utils.make_output_table(
            self.nd_model.lines.filepath,
            [f.field_description for f in self.nd_model.lines.fields]
            )
        # LineVariants
        gtfs_utils.make_output_table(
            self.nd_model.line_variants.filepath,
            [f.field_description for f in self.nd_model.line_variants.fields]
            )
        # LineVariantElements
        lve_field_descriptions = [f.field_description for f in self.nd_model.line_variant_elements.fields]
        if not self.make_lve_shapes:
            # Don't create the optional LVEShapeID field if the user doesn't want to create LVEShapes.
            lve_field_descriptions = [fd for fd in lve_field_descriptions if fd[0] != "LVEShapeID"]
        gtfs_utils.make_output_table(
            self.nd_model.line_variant_elements.filepath,
            lve_field_descriptions,
            self.output_spatial_ref,
            "POLYLINE"
            )
        # Schedules
        gtfs_utils.make_output_table(
            self.nd_model.schedules.filepath,
            [f.field_description for f in self.nd_model.schedules.fields]
            )
        # ScheduleElements
        gtfs_utils.make_output_table(
            self.nd_model.schedule_elements.filepath,
            [f.field_description for f in self.nd_model.schedule_elements.fields]
            )
        # Runs
        gtfs_utils.make_output_table(
            self.nd_model.runs.filepath,
            [f.field_description for f in self.nd_model.runs.fields]
            )
        # Calendars
        gtfs_utils.make_output_table(
            self.nd_model.calendars.filepath,
            [f.field_description for f in self.nd_model.calendars.fields]
            )
        # CalendarExceptions
        gtfs_utils.make_output_table(
            self.nd_model.calendar_exceptions.filepath,
            [f.field_description for f in self.nd_model.calendar_exceptions.fields]
            )
        # LVEShapes
        if self.make_lve_shapes:
            gtfs_utils.make_output_table(
                self.nd_model.lve_shapes.filepath,
                [f.field_description for f in self.nd_model.lve_shapes.fields],
                self.output_spatial_ref,
                "POLYLINE"
            )

    def _update_output_table_schema(self):
        """When appending to output tables, check if they have the correct schema and add fields if needed."""
        for output in self.outputs:
            actual_fields = [f.name for f in arcpy.ListFields(output.filepath)]
            required_fields = [f.name for f in output.fields if f.is_required]
            if not set(required_fields).issubset(set(actual_fields)):
                # Cannot append GTFS data to existing data model tables.
                arcpy.AddIDMessage("ERROR", 2921)
                # Public transit data model table %1 is missing one or more required fields. Required fields: %2
                raise gtfs_utils.Error(2925, output.filepath, "\n" + "\n".join(required_fields))
            # If all required fields are present, add any optional ones that weren't.
            # This does not account for the weird case when a field exists but has the wrong type.
            needed_fields = [f.field_description for f in output.fields if f.name not in actual_fields]
            if not self.make_lve_shapes and output == self.nd_model.line_variant_elements:
                # Don't create the optional LVEShapeID field if the user doesn't want to create LVEShapes.
                needed_fields = [fd for fd in needed_fields if fd[0] != "LVEShapeID"]
            if needed_fields:
                arcpy.management.AddFields(output.filepath, needed_fields)

    def _add_gtfs_to_output_tables(self):
        """Fill the output data model tables from a gtfs dataset."""
        # Fill output Stops, Calendars, and CalendarExceptions by directly converting from GTFS
        self._convert_stops()
        if self.gtfs_props.calendar.converter:
            self._convert_calendar()
        if self.gtfs_props.calendar_dates.converter:
            self._convert_calendar_exceptions()
        # Fill Lines, LineVariants, LineVariantElements, Schedules, ScheduleElements, and Runs, all derived from
        # the gtfs stop_times table
        self._create_other_output()

    def _direct_convert(self, gtfs_table_key, output_table):
        """Convert a GTFS table directly to a data model feature class when further processing is not required."""
        gtfs_file_props = getattr(self.gtfs_props, gtfs_table_key)
        # Retrieve column names that were actually in the original gtfs (some are optional)
        all_df_fields = gtfs_file_props.converter.get_df_column_names()
        # Determine which fields are actually used and the mapping between the gtfs name and the data model name
        out_fields = []
        df_fields_to_use = []
        for field in gtfs_file_props.direct_mapping:
            if field in all_df_fields:
                df_fields_to_use.append(field)
                out_fields.append(gtfs_file_props.direct_mapping[field])

        # Special handling if the table to convert has point geometry
        if gtfs_file_props.has_geom:
            df_fields_to_use.append(gtfs_utils.PTSHAPE_FIELD)
            out_fields.append(gtfs_utils.SHAPE_CURSOR)

        # Populate the output table
        gtfs_file_props.converter.write_df_rows_to_table(
            output_table, out_fields, df_fields_to_use, self.transformation
        )

    def _convert_stops(self):
        """Convert the GTFS stops.txt file into the Stops feature class required by the data model."""
        # Add an ID field to the Stops dataframe and populate it with incrementing integers
        stops_df = self.gtfs_props.stops.converter.data_frame
        stops_df["ID"] = stops_df.index + self.max_stop_id + 1
        # Determine the max ID currently in the table in case we need to read in another gtfs dataset later
        self.max_stop_id = stops_df["ID"].max()
        # Populate ParentID from parent_station
        if "parent_station" in self.gtfs_props.stops.converter.get_df_column_names():
            stop_id_dict = dict(zip(stops_df["stop_id"], stops_df["ID"]))
            stops_df["ParentID"] = stops_df["parent_station"].map(stop_id_dict)
        # Write the dataframe to the output feature class
        self._direct_convert("stops", self.nd_model.stops.filepath)

    def _convert_calendar(self):
        """Convert the GTFS calendar.txt file into the Calendars feature class required by the data model."""
        # Add an ID field to the Calendar dataframe and populate it with incrementing integers
        cal_df = self.gtfs_props.calendar.converter.data_frame
        cal_df["ID"] = cal_df.index + self.max_calendar_id + 1
        # Determine the max ID currently in the table in case we need to read in another gtfs dataset later
        self.max_calendar_id = cal_df["ID"].max()
        # Write the dataframe to the output feature class
        self._direct_convert("calendar", self.nd_model.calendars.filepath)
        # Create a mapping for service_id to Calendar ID for later look-ups
        self.gtfs_props.calendar.converter.index_df("service_id")
        self.service_id_dict = cal_df["ID"].to_dict()

    def _convert_calendar_exceptions(self):
        """Convert the GTFS calendar_dates.txt file into the Calendars feature class required by the data model."""
        cd_df = self.gtfs_props.calendar_dates.converter.data_frame
        # Handle the special case where calendar_dates has service_id values that weren't in calendar (which is valid)
        for sid in cd_df["service_id"].unique():
            if sid not in self.service_id_dict:
                self.max_calendar_id += 1
                self.service_id_dict[sid] = self.max_calendar_id
        # Calculate the CalendarID field by mapping service_ids to ID using the dictionary we just constructed
        cd_df["CalendarID"] = cd_df["service_id"].map(self.service_id_dict)
        # Write the dataframe to the output feature class
        self._direct_convert("calendar_dates", self.nd_model.calendar_exceptions.filepath)

    def _create_other_output(self):
        """Create Lines, LineVariants, LineVariantElements, Schedules, ScheduleElements, Runs, and LVEShapes."""
        # pylint:disable=too-many-locals
        # pylint:disable=too-many-statements
        # pylint:disable=too-many-branches
        stop_times_table = self.gtfs_props.stop_times.converter
        stops_table = self.gtfs_props.stops.converter
        trips_table = self.gtfs_props.trips.converter
        routes_table = self.gtfs_props.routes.converter
        routes_df = routes_table.data_frame
        frequencies_table = self.gtfs_props.frequencies.converter

        # Sort the stop_times table by trip_id and then stop_sequence to ensure that stop visits are correctly ordered
        stop_times_table.sort_df(["trip_id", "stop_sequence"])

        # Index for quicker look-ups
        stops_table.index_df("stop_id")
        trips_table.index_df("trip_id")
        routes_table.index_df("route_id")
        stop_times_table.index_df("trip_id")
        if frequencies_table:
            frequencies_table.group_df("trip_id")

        # Determine whether we have direction_id, bike, wheelchair, direction, and shape info in trips
        trips_fields = trips_table.get_df_column_names()
        populate_whcr = "wheelchair_accessible" in trips_fields
        populate_bikes = "bikes_allowed" in trips_fields
        populate_dir_id = "direction_id" in trips_fields
        populate_shape_id = "shape_id" in trips_fields

        # Define fields (and ordering of fields) to use in cursors
        fields_r = ["ID", "ScheduleID", "StartRun", "GTripID", "CalendarID", "GWheelchairAccessible", "GBikesAllowed"]
        fields_s = ["ID", "LineVarID"]
        fields_se = ["ScheduleID", "SqIdx", "Departure", "Arrival"]
        fields_l = ["ID", "GRouteID", "GRouteType"]
        fields_lv = ["ID", "LineID", "GDirectionID", "GShapeID"]
        fields_lve = ["LineVarID", gtfs_utils.SHAPE_CURSOR, "SqIdx", "FromStopID", "ToStopID"]
        if self.make_lve_shapes:
            fields_lve.append("LVEShapeID")
        fields_lves = ["ID", gtfs_utils.SHAPE_CURSOR]

        # Initialize variable for logging bad service_ids that are found in trips but are missing
        # from calendar and calendar_dates
        missing_service_ids = []
        # Initialize variable for logging trips where interpolation couldn't fill in all gaps
        bad_interpolation = []
        # Initialize variable for logging trip_ids with null shape_ids or shape_ids not in the shapes.txt file
        bad_shape_ids = []

        try:
            # Must open an edit session because we're writing to more than one at once.
            # pragma pylint: disable=no-member
            edit = arcpy.da.Editor(os.path.dirname(self.target_feature_dataset))
            # Set with_undo=False to enhance performance
            # Set multiuser_mode=False to make it work on SDE (unversioned only)
            edit.startEditing(with_undo=False, multiuser_mode=False)
            edit.startOperation()

            # Open output tables for writing.
            cur_r = arcpy.da.InsertCursor(self.nd_model.runs.filepath, fields_r)
            cur_s = arcpy.da.InsertCursor(self.nd_model.schedules.filepath, fields_s)
            cur_se = arcpy.da.InsertCursor(self.nd_model.schedule_elements.filepath, fields_se)
            cur_l = arcpy.da.InsertCursor(self.nd_model.lines.filepath, fields_l)
            cur_lv = arcpy.da.InsertCursor(self.nd_model.line_variants.filepath, fields_lv)
            cur_lve = arcpy.da.InsertCursor(
                self.nd_model.line_variant_elements.filepath, fields_lve, datum_transformation=self.transformation
            )
            cur_lves = None
            if self.make_lve_shapes:
                cur_lves = arcpy.da.InsertCursor(
                    self.nd_model.lve_shapes.filepath, fields_lves, datum_transformation=self.transformation
                )
            # pragma pylint: enable=no-member

            # Loop through each trip in the stop_times table to construct line variants, schedules, and runs
            # Group the stop_times dataframe by route_id and trip_id
            # Since route_id is not in the stop_times table, we pass in a dictionary of {trip_id: route_id} as a mapping
            # to define the dataframe groupings and then secondarily group by trip_id.  The groups will be keyed as a
            # tuple of (route_id, trip_id). Doing it this way ensures that all trips associated with a particular route
            # (Line) will be grouped together when we iterate over the table so we don't have to track as many unique
            # stop sequences and schedules in memory since line variants and schedules are specific to a line.  We can
            # complete each line all at once rather than going randomly through the table and having to store the line
            # variants and schedules for all lines in memory for look-ups.
            # Initialize some counters
            current_route_id = None
            wheelchair_acc = None
            bikes_allowed = None
            route_type = None
            line_variants = {}  # {line variant: [linevar_id, {schedule: sched_id}]}
            sched_interp = {}  # {uninterpolated schedule: interpolated schedule}
            # Loop through the stop_times table. Group using the dictionary of {trip_id, route_id}.
            for group, trip in stop_times_table.data_frame.groupby(
                    [trips_table.data_frame["route_id"], "trip_id"], sort=True
            ):
                route_id = group[0]
                trip_id = group[1]
                arrivals_pd = trip["arrival_time"]
                departures_pd = trip["departure_time"]
                # Get the ordered list of stop_ids, arrival_times, and departure_times for this trip
                stop_seq = tuple(trip["stop_id"].values.tolist())
                arrivals = tuple(arrivals_pd.values.tolist())
                departures = tuple(departures_pd.values.tolist())
                # Get the trip's shape_id if relevant
                shape_id = None
                if populate_shape_id:
                    shape_id = trips_table.data_frame.at[trip_id, "shape_id"]
                    shape_id = None if pd.isnull(shape_id) else shape_id  # Replace np.nan with None
                # Get the trip's direction_id if relevant
                direction_id = None
                if populate_dir_id:
                    direction_id = trips_table.data_frame.at[trip_id, "direction_id"]
                # Construct a key combining stop sequence, direction_id, and shape_id.
                # It is very unlikely that we would have more than one direction_id associated with the same stop
                # sequence, but GTFS does not forbid it, so we have to check.
                # It's rare but possible that the same sequence of stops could have more than one shape associated with
                # it, in particular when the vehicle travels on different streets at some times of day, perhaps avoiding
                # an area with heavy traffic. For this reason, use the shape_id as part of the key identifying unique
                # LineVariants. This won't make any analytical difference but could help if someone is trying to join
                # their shapes.txt data to the data model for visualization.
                stop_seq_key = (stop_seq, direction_id, shape_id)
                # Construct a nested tuple representing the arrival and departure times relative to the
                # start of the trip, which is used as a key to look up whether we already have already seen
                # this pattern.
                schedule = self._make_schedule_from_arrdep_times(arrivals, departures)
                # Interpolate blank stop times if desired and needed
                if self.interpolate and self.gtfs_needs_interpolation:
                    if route_id != current_route_id:
                        # Reset dictionary when starting a new route
                        sched_interp = {}
                    if arrivals_pd.isnull().values.any() or departures_pd.isnull().values.any():
                        if schedule in sched_interp:
                            # If we've already seen this pattern, use the interpolatd values stored in the dictionary
                            # because this is faster than re-interpolating the same pattern over and over
                            schedule = sched_interp[schedule]
                        else:
                            # Otherwise interpolate the values, use them, and store them
                            # Do linear interpolation between existing values, but do not interpolate blank values at
                            # the beginning or end. Round interpolated values to the nearest second since that's all the
                            # precision gtfs has anyway.
                            arrivals = arrivals_pd.interpolate("linear", limit_area="inside").round(0)
                            departures = departures_pd.interpolate("linear", limit_area="inside").round(0)
                            # Check if there are still nulls that didn't get fixed with interpolation (typically at the
                            # beginning or end of a trip). If there are, this trip is bad and we have to skip it.
                            if arrivals.isnull().values.any() or departures.isnull().values.any():
                                if len(bad_interpolation) < MAX_BAD_TRIPS_TO_REPORT:
                                    bad_interpolation.append(trip_id)
                                continue
                            # Re-make the schedule with the interpolated values
                            arrivals = tuple(arrivals.values.tolist())
                            departures = tuple(departures.values.tolist())
                            schedule_new = self._make_schedule_from_arrdep_times(arrivals, departures)
                            sched_interp[schedule] = schedule_new
                            schedule = schedule_new
                new_linevar = False
                new_schedule = False
                if route_id != current_route_id:  # Starting a new route
                    # Increment counters for line ID, line variant ID, and schedule ID because it's all new
                    current_route_id = route_id
                    self.max_line_id += 1
                    self.max_linevar_id += 1
                    self.max_sched_id += 1
                    line_id = self.max_line_id
                    linevar_id = self.max_linevar_id
                    sched_id = self.max_sched_id
                    new_linevar = True
                    new_schedule = True
                    # Determine the route type
                    route_type = int(routes_df.at[route_id, "route_type"])
                    # Reset line_variants look-up dictionary
                    line_variants = {stop_seq_key: [linevar_id, {schedule: sched_id}]}
                    # Add a new entry to the Lines output table
                    cur_l.insertRow((line_id, route_id, route_type))
                else:
                    line_id = self.max_line_id
                    # Determine if we've already seen this sequence of stops (Line Variant) and pattern of
                    # arrival and departure times (Schedule)
                    if stop_seq_key not in line_variants:  # New sequence of stops (Line Variant)
                        # Increment the counters for line variant ID and schedule ID because these are new
                        self.max_linevar_id += 1
                        self.max_sched_id += 1
                        linevar_id = self.max_linevar_id
                        sched_id = self.max_sched_id
                        new_linevar = True
                        new_schedule = True
                        # Update line_variants look-up dictionary to include this stop sequence
                        line_variants[stop_seq_key] = [linevar_id, {schedule: sched_id}]
                    else:  # Known sequence of stops (Line Variant)
                        # Retrieve the line variant ID and existing known schedules from the look-up dictionary
                        linevar_id, sched_dict = line_variants[stop_seq_key]
                        # Determine if we've already logged the current schedule
                        if schedule not in sched_dict:  # New schedule
                            # Increment the counters for schedule ID because this is new
                            self.max_sched_id += 1
                            sched_id = self.max_sched_id
                            new_schedule = True
                            # Update the look-up dictionary
                            sched_dict[schedule] = sched_id
                            line_variants[stop_seq_key][1] = sched_dict
                        else:  # Known schedule
                            # Retrieve the previously-logged schedule ID
                            sched_id = sched_dict[schedule]

                # Write the new line variant and its elements to the output tables
                if new_linevar:
                    # Add row to LineVariants
                    cur_lv.insertRow((linevar_id, line_id, direction_id, shape_id))
                    # Add rows to LineVariantElements and, optionally, LVEShapes
                    shape_geom = None
                    if self.make_lve_shapes and self.can_use_shapes:
                        try:
                            shape_geom = self.shape_geoms.at[shape_id, "Geometry"]
                        except KeyError:
                            if len(bad_shape_ids) < MAX_BAD_SHAPES_TO_REPORT:
                                bad_shape_ids.append(trip_id)
                        if isinstance(shape_geom, pd.Series):
                            # Unusual case in which more than one shape feature has the same shape_id
                            if "route_id" in self.shape_geoms.columns:
                                # This is likely an artifact of weird data and the behavior of the GTFS Shapes To
                                # Features tool. From doc: In the unusual case that more than one route_id is associated
                                # with a given shape_id, the shape will be duplicated in the output feature class so
                                # that there is one feature for each unique shape_id and route_id pair.
                                # Grab the first shape_id record that has the right route_id value
                                shape_geom = self.shape_geoms.loc[shape_id]
                                shape_geom = shape_geom[shape_geom["route_id"] == route_id]
                                if len(shape_geom) <= 0:
                                    # The shape_id/route_id combo wasn't found for some inexplicable reason
                                    if len(bad_shape_ids) < MAX_BAD_SHAPES_TO_REPORT:
                                        bad_shape_ids.append(trip_id)
                                        shape_geom = None
                                else:
                                    shape_geom = shape_geom.iloc[0]["Geometry"]
                            else:
                                # Unclear why this happened, but don't fail.  Just use the first shape geometry.
                                shape_geom = shape_geom.iloc[0]
                    for element in self._make_line_variant_elements_from_stop_sequence(stop_seq, shape_geom):
                        # element consists of (LineVariantElement Shape, SqIdx, FromStopID, ToStopID, LVEShapes Shape)
                        element = list(element)
                        lve_row = [linevar_id] + element[:-1]
                        if self.make_lve_shapes:
                            self.max_lves_id += 1
                            lve_row.append(self.max_lves_id)
                            cur_lves.insertRow([self.max_lves_id, element[-1]])
                        cur_lve.insertRow(lve_row)

                # Write the new schedule and its elements to the output tables
                if new_schedule:
                    # Add an entry to the Schedules table
                    cur_s.insertRow((sched_id, linevar_id))
                    # Construct the schedule elements and insert them into the ScheduleElements table
                    for schedel in self._make_schedule_elements_from_schedule(schedule):
                        # [(SqIdx, Departure, Arrival)]
                        cur_se.insertRow((sched_id,) + schedel)

                # Insert the current trip into the Runs table
                service_id = trips_table.data_frame.at[trip_id, "service_id"]
                try:
                    calendar_id = self.service_id_dict[service_id]
                except KeyError:
                    # In this case, the service_id in the trips.txt file does not correspond to any service_id
                    # in calendar.txt or calendar_dates.txt.  This is a data problem, but we don't need to fail
                    # the tool.  We'll just collect the bad service_ids and throw a warning later, and skip adding
                    # this trip to the Runs table.
                    missing_service_ids.append(service_id)
                    missing_service_ids = list(set(missing_service_ids))
                    continue
                if populate_whcr:
                    wheelchair_acc = trips_table.data_frame.at[trip_id, "wheelchair_accessible"]
                if populate_bikes:
                    bikes_allowed = trips_table.data_frame.at[trip_id, "bikes_allowed"]
                if frequencies_table and trip_id in frequencies_table.data_frame.groups.keys():
                    # If this trip is in frequencies.txt, don't insert the trip as-is from stop_times. Instead,
                    # construct multiple runs based on the info in frequencies.txt
                    freq_trips = frequencies_table.data_frame.get_group(trip_id)
                    for freq in freq_trips.itertuples(index=False):
                        start_sec = freq[1]
                        end_sec = freq[2]
                        headway = freq[3]
                        if headway <= 0:
                            # This is a data problem. A headway of 0 or <0 doesn't make sense. However, the tool doesn't
                            # need to choke on it. Just skip this entry and move on.
                            continue
                        # Add one run per start time by incrementing based on headway
                        run_start = start_sec
                        while run_start < end_sec:
                            self.max_run_id += 1
                            cur_r.insertRow((
                                self.max_run_id,
                                sched_id,
                                float(run_start) / 60.,
                                trip_id,
                                calendar_id,
                                wheelchair_acc,
                                bikes_allowed
                                ))
                            run_start += headway
                else:
                    self.max_run_id += 1
                    cur_r.insertRow((
                        self.max_run_id,
                        sched_id,
                        float(departures[0]) / 60.,
                        trip_id,
                        calendar_id,
                        wheelchair_acc,
                        bikes_allowed
                        ))

            # Clean up cursors
            del cur_r
            del cur_s
            del cur_se
            del cur_l
            del cur_lv
            del cur_lve
            del cur_lves

            # Stop the editing operation and save edits
            edit.stopOperation()
            edit.stopEditing(True)

            if missing_service_ids:
                # The GTFS trips.txt file includes service_id values that are not found in the GTFS calendar.txt
                # or calendar_dates.txt files. Trips with these service_id values will not be included in the
                # output Runs table. Invalid service_id values:
                arcpy.AddIDMessage("WARNING", 2850, "\n" + "\n".join(missing_service_ids))

            if bad_interpolation:
                # Blank arrival_time or departure_time values in the GTFS stop_times.txt file could not be interpolated
                # for some GTFS trips. These trips will not be included in the output Runs table. Affected trip_id
                # values (showing up to MAX_BAD_TRIPS_TO_REPORT): [blah]
                arcpy.AddIDMessage("WARNING", 2928, str(MAX_BAD_TRIPS_TO_REPORT), "\n" + "\n".join(bad_interpolation))

            if bad_shape_ids:
                # Cannot make LVEShapes geometry for some GTFS trips because the shape_id field in the trips.txt file is
                # null or doesn't match a shape_id value in the shapes.txt file. Straight-line geometries will be used
                # instead. Affected trip_id values (showing up to %s): %s
                arcpy.AddIDMessage("WARNING", 240021, str(MAX_BAD_SHAPES_TO_REPORT), "\n" + "\n".join(bad_shape_ids))

        # Deal with terrible problems
        except Exception as ex:  # pylint:disable=broad-except
            # Stop the editing operation and abandon changes
            if 'edit' in locals():
                if edit.isEditing:
                    edit.stopOperation()
                    edit.stopEditing(False)
            # Then pass through the raised exception
            raise ex

    def _make_line_variant_elements_from_stop_sequence(self, stop_sequence, shape_geom):
        """Construct tuples for insertion into LineVariantElements and, optionally, LVEShapes.

        Returns (LineVariantElement Shape, SqIdx, FromStopID, ToStopID, LVE Shape).

        Create the LineVariantElement polyline objects by making a straight line between each pair of sequentially
        connected stops in the input stop sequence.  LVEShapes polylines are created by slicing the shape geometry
        derived from GTFS shapes.txt.
        """
        rows_to_return = []

        def get_stop_info(stop_id):
            """Query the stops dataframe to retrieve the stop ID, point shape, and distance along shape."""
            try:
                stops_df = self.gtfs_props.stops.converter.data_frame
                this_stop_id = stops_df.at[stop_id, "ID"]
                this_stop_shp = stops_df.at[stop_id, gtfs_utils.PTSHAPE_FIELD]
            except KeyError:
                # The stop_times.txt file contains a stop_id value '%s' that is not present in the stops.txt file.
                # LineVariantElements connecting this stop to other stops will not be included in the output.
                # Don't burden the user with the same message over and over. Only add the warning if they haven't seen
                # it for this stop_id yet.
                if stop_id not in self.stop_ids_not_in_stops:
                    self.stop_ids_not_in_stops.add(stop_id)
                    arcpy.AddIDMessage("WARNING", 2822, stop_id)
                return -1

            # Optionally measure the stop's location along the shape polyline
            this_stop_meas = None
            if self.make_lve_shapes and shape_geom:
                try:
                    this_stop_meas = shape_geom.measureOnLine(this_stop_shp)
                except Exception:  # pylint:disable=broad-except
                    # Something bad happened in the geometry operations.  This is unlikely, and a warning message isn't
                    # going to be helpful to the user anyway, so just silently return None to trigger using a
                    # straight-line shape instead.
                    this_stop_meas = None

            return (this_stop_id, this_stop_shp, this_stop_meas)

        current_stop = None
        previous_stop = None
        for i, stop_id in enumerate(stop_sequence):
            if not previous_stop:
                previous_stop = get_stop_info(stop_id)
                continue
            current_stop = get_stop_info(stop_id)
            if previous_stop == -1 or current_stop == -1:
                # This is a data problem. Skip generating a line when we don't have stop geometry. We'll create as many
                # LineVariantElements as possible, and the sequence index will still be correct, but the data is flawed.
                continue
            if previous_stop[0] == current_stop[0]:
                # This is a data problem. The stop sequence contains the same stop twice in a row, so if we construct a
                # polyline, it will have null geometry and result in a network build error later. Skip creating this
                # LineVariantElement. The sequence index will still be correct, and the transit trips should still be
                # continuous.
                continue
            # Construct the polyline
            array = arcpy.Array()
            array.add(previous_stop[1].firstPoint)
            array.add(current_stop[1].firstPoint)
            polyline = arcpy.Polyline(array, gtfs_utils.WGS_COORDS)
            if polyline.length == 0:
                # The length of the line is 0, which means that the from and to stop are spatially coincident. 0-length
                # lines will result in network build errors, so don't add this feature to the output. The sequence index
                # will still be correct, and transit trips should still be continuous since we didn't need this line
                # anyway.
                continue
            lve_shape_geom = None
            if self.make_lve_shapes:
                if not shape_geom or current_stop[2] is None or previous_stop[2] is None:
                    # Resulted from validation check earlier. Just use straight-line shapes.
                    lve_shape_geom = polyline
                else:
                    # Extract a segment from the shape geometry that falls between these stops
                    try:
                        lve_shape_geom = shape_geom.segmentAlongLine(previous_stop[2], current_stop[2])
                    except Exception:  # pylint:disable=broad-except
                        # Something bad happened in the geometry operations.  This is unlikely, and a warning message
                        # isn't going to be helpful to the user anyway, so just silently use a straight-line shape
                        # instead.
                        lve_shape_geom = polyline
                    # If the shape is null, it's probably just a data error or weird shape.  Just replace it with the
                    # LineVariantElement shape.
                    if lve_shape_geom.length == 0:
                        lve_shape_geom = polyline
            # Construct the tuple that will be added to LineVariantElements and LVEShapes.  The LVEShapes geometry is
            # always the last element in the returned tuple and should be handled separately by the caller.
            # (LineVariantElement Shape, SqIdx, FromStopID, ToStopID, LVE Shape)
            rows_to_return.append((polyline, i, previous_stop[0], current_stop[0], lve_shape_geom))
            previous_stop = current_stop

        return rows_to_return

    @staticmethod
    def _make_schedule_from_arrdep_times(arrivals, departures):
        """Create a nested tuple representing the arrival and departure times for this trip."""
        # Determine the number of seconds since midnight when the overall trip begins
        initial_departure = departures[0]
        # Determine the seconds since the run start that each subsequent arrival and departure occurs
        # Returned value is a tuple of tuples
        # (schedule element departure, schedule element arrival)
        sched = []
        for i in range(len(arrivals)-1):
            dep = None
            arr = None
            if not gtfs_utils.pandas.isna(departures[i]):
                dep = departures[i]-initial_departure
            if not gtfs_utils.pandas.isna(arrivals[i+1]):
                arr = arrivals[i+1]-initial_departure
            sched.append((dep, arr))
        return tuple(sched)

    @staticmethod
    def _make_schedule_elements_from_schedule(sched_sequence):
        """Create a list of schedule elements to write from a nested tuple of departure and arrival times."""
        # Expecting input from a row created by _make_schedule_from_arrdep_times()
        # ((Departure, Arrival), (Departure, Arrival), ...)
        schedels = []
        for i, schedel in enumerate(sched_sequence):
            schedels.append((i+1, float(schedel[0]) / 60., float(schedel[1]) / 60.))
        # [(SqIdx, Departure, Arrival)]
        return schedels


# Validation flags to prevent redoing slow validation checks if the parameter hasn't changed. Because of limitations of
# the ToolValidator class framework, these must be global variables stored outside the class, even though this isn't the
# best coding practice.
VFLAG_FD_EXISTS = False
VFLAG_GDB_HAS_TABLES = False
VFLAG_FD_HAS_LVESHAPES = False
VFLAG_FD_HAS_FCS = False
VFLAG_FD_HAS_ND = False
VFLAG_FD_UNKNOWN_SR = False


class ToolValidator():
    """Tool validation logic specific to this tool."""

    def __init__(self):
        """Set arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        self.param_fd = self.params[1]
        self.param_append = self.params[13]
        self.param_shapes = self.params[14]
        self.out_required_fcs = ["Stops", "LineVariantElements"]
        self.out_tables = ["Calendars", "CalendarExceptions", "Lines", "LineVariants", "Runs",
                           "Schedules", "ScheduleElements"]
        self.out_lve_shapes_fc_name = "LVEShapes"
        nd_model = gtfs_utils.NetworkDataModel()
        self.out_schema_dict = nd_model.make_schema_dict()
        self.out_geometry_type_dict = nd_model.make_geometry_type_dict()

    def initializeParameters(self):  # pylint: disable=invalid-name
        """Refine the properties of a tool's parameters. This method is called when the tool is opened."""

    def updateParameters(self):  # pylint: disable=invalid-name
        """Modify the values and properties of parameters before internal validation is performed.

        This method is called whenever a parameter has been changed.
        """
        # Set derived outputs preemptively to make Model Builder happy
        target_feature_dataset = self.param_fd.valueAsText
        if target_feature_dataset:
            derived_idx_1 = 2
            self.params[derived_idx_1].value = target_feature_dataset
            for idx, out_fc in enumerate(self.out_required_fcs):
                self.params[derived_idx_1+1+idx].value = os.path.join(target_feature_dataset, out_fc)
                self.params[derived_idx_1+1+idx].schema.additionalFields = self.out_schema_dict[out_fc]
                self.params[derived_idx_1+1+idx].schema.geometryTypeRule = "AsSpecified"
                self.params[derived_idx_1+1+idx].schema.geometryType = self.out_geometry_type_dict[out_fc]
            for idx, table in enumerate(self.out_tables):
                self.params[derived_idx_1+3+idx].value = os.path.join(os.path.dirname(target_feature_dataset), table)
                self.params[derived_idx_1+3+idx].schema.additionalFields = self.out_schema_dict[table]
            # LVEShapes
            self.params[15].value = os.path.join(target_feature_dataset, "LVEShapes")
            self.params[15].schema.additionalFields = self.out_schema_dict["LVEShapes"]
            self.params[15].schema.geometryTypeRule = "AsSpecified"
            self.params[15].schema.geometryType = self.out_geometry_type_dict["LVEShapes"]

    def updateMessages(self):  # pylint: disable=invalid-name
        """Modify the messages created by internal validation for each tool parameter.

        This method is called after internal validation.
        """
        # Add error to the append parameter if the target_feature_dataset doesn't have the data model tables in it.
        # Skip check if the parameters is derived (from Model Builder output)
        if not self.param_fd.isInputValueDerived() and self.param_fd.altered and self.param_fd.valueAsText:
            # Use global flags to avoid repeating slow checks
            global VFLAG_FD_EXISTS
            global VFLAG_GDB_HAS_TABLES
            global VFLAG_FD_HAS_LVESHAPES
            global VFLAG_FD_HAS_FCS
            global VFLAG_FD_HAS_ND
            global VFLAG_FD_UNKNOWN_SR
            if not self.param_fd.hasBeenValidated:
                # The parameter has a fresh value.  Do slow checks to update global flags.
                target_feature_dataset = self.param_fd.valueAsText
                VFLAG_FD_EXISTS = arcpy.Exists(target_feature_dataset)
                if not VFLAG_FD_EXISTS:
                    VFLAG_GDB_HAS_TABLES = False
                    VFLAG_FD_HAS_LVESHAPES = False
                    VFLAG_FD_HAS_FCS = False
                    VFLAG_FD_HAS_ND = False
                    VFLAG_FD_UNKNOWN_SR = False
                else:
                    VFLAG_FD_UNKNOWN_SR = arcpy.Describe(target_feature_dataset).spatialReference.type.lower() not in [
                        "geographic", "projected"
                    ]  # Implies "Unknown" or other strange and invalid situation
                    if not VFLAG_FD_UNKNOWN_SR:
                        actual_fd_fc_names = get_fd_feature_class_names(target_feature_dataset)
                        VFLAG_FD_HAS_LVESHAPES = self.out_lve_shapes_fc_name.lower() in actual_fd_fc_names
                        VFLAG_FD_HAS_FCS = {fc.lower() for fc in self.out_required_fcs}.issubset(actual_fd_fc_names)
                        VFLAG_GDB_HAS_TABLES = do_output_tables_exist(
                            os.path.dirname(target_feature_dataset), self.out_tables
                        )
                        if VFLAG_FD_HAS_FCS:
                            # Ensure there isn't already a network dataset in the feature dataset.  The tool will
                            # overwrite existing feature classes, and if they participate in a network
                            # dataset (or really any other controller dataset), the tool won't be able to overwrite them
                            # and will fail.  There's no convenient arcpy function to determine if a feature class
                            # participates in a controller dataset, so as a reasonably quick check (instead of
                            # describing the network), just see if the output feature classes exist and a network exists
                            # in the same feature dataset.  It's conceivable that a network is present and the two
                            # feature classes don't participate in it, but it's unlikely, and at that point I would
                            # question what the user was trying to do anyway.
                            with arcpy.EnvManager(workspace=target_feature_dataset):
                                networks = arcpy.ListDatasets(feature_type="Network")
                                VFLAG_FD_HAS_ND = networks is not None and len(networks) > 0
            if VFLAG_FD_EXISTS:
                if VFLAG_FD_UNKNOWN_SR:
                    # Unknown coordinate system for input dataset: %s.
                    self.param_fd.setIDMessage("Error", 522, self.param_fd.valueAsText)
                else:
                    if self.param_append.value:
                        if VFLAG_FD_HAS_LVESHAPES and not self.param_shapes.value:
                            # If appending and LVEShapes exists, they won't be added onto.  Warn the user, but allow them to
                            # proceed in case they have some external or manual process for generating LVEShapes.
                            # The existing public transit data model tables include the LVEShapes feature class, but the
                            # option to make LVEShapes from the shapes.txt file is set to False. LVEShapes features will not
                            # be created for the appended data.
                            self.param_shapes.setIDMessage("Warning", 240022)
                        if (
                            not VFLAG_GDB_HAS_TABLES or not VFLAG_FD_HAS_FCS or (
                                (not VFLAG_FD_HAS_LVESHAPES) and self.param_shapes.value
                            )
                        ):
                            # Cannot append GTFS data to existing data model tables.
                            self.param_append.setIDMessage("Error", 2921)
                            # One or more public transit data model tables does not exist.
                            self.param_fd.setIDMessage("Error", 2922)
                    if VFLAG_FD_HAS_FCS and VFLAG_FD_HAS_ND:
                        # The feature dataset contains a network dataset, so the tool cannot overwrite or edit the existing
                        # output feature classes.
                        self.param_fd.setIDMessage("Error", 240015)
