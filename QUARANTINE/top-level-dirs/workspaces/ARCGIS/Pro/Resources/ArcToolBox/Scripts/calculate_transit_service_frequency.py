"""
Provides validation and execution logic for the Calculate Transit Service Frequency tool.

This tool is based upon the open source BetterBusBuffers toolbox
(https://github.com/Esri/public-transit-tools/tree/master/better-bus-buffers) developed by Esri with contributions from
David Wasserman of Fehr & Peers under an Apache 2.0 license (https://www.apache.org/licenses/LICENSE-2.0.html). The tool
also uses analysis techniques developed for Esri's open source Transit Network Analysis Tools toolbox
(https://github.com/Esri/public-transit-tools/tree/master/transit-network-analysis-tools) by contributor David Wasserman
of Fehr & Peers under an Apache 2.0 license (https://www.apache.org/licenses/LICENSE-2.0.html).
"""

import os
import datetime
import enum
import uuid
from itertools import product
from typing import List, Optional, Union, Tuple
import pandas as pd
import arcpy

import gtfs_utils
import spatial_reference_helper
from calculate_transit_service_frequency_od_config import OD_SETTINGS
from calculate_transit_service_frequency_sa_config import SA_SETTINGS


# Number of minutes in one day
MINS_IN_DAY = 1440
# Map the weekday integers returned by datetime.weekday() to the weekday field names in the Public Transit Data
# Model's Calendars table by index
WEEKDAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
# Valid time and distance unit values for walk time or distance cutoff
DISTANCE_UNITS = ["KILOMETERS", "METERS", "MILES", "YARDS", "FEET", "NAUTICALMILES"]
TIME_UNITS = ["DAYS", "HOURS", "MINUTES", "SECONDS"]
UNKNOWN_UNITS = ["UNKNOWN"]
# Maximum number of Service Area facilities that can be included in a single solve, for local data. (Service limits are
# determined explicitly for the service being used.)
# Set to None to have no limit. Set to a number to use a limit for local data. This is mostly for testing and debugging.
MAX_FACILITIES = None
# Maximum number of OD Cost Matrix origins and destinations that can be included in a single solve, for local data.
# (Service limits are determined explicitly for the service being used.)
# Set to None to have no limit. Set to a number to use a limit for local data. This is mostly for testing and debugging.
MAX_ORIGINS = None
MAX_DESTINATIONS = None
# For typing
FCDATATYPE = Union[str, arcpy.FeatureSet, arcpy.RecordSet, arcpy._mp.Layer]  # pylint: disable=protected-access
NDDATATYPE = Union[str, arcpy._mp.Layer]  # pylint: disable=protected-access
TMDATATYPE = Union[str, arcpy.nax.TravelMode]
# Temporary lyrx file for output symbology, to be created during processing and deleted in post execution
# This must be a global variable so it can be used in tool execution and deleted in ToolValidator postExecute.
# The value itself is set later to ensure a unique layer name per tool run.
TEMP_LYRX = None

DELETE_INTERMEDIATE_OUTPUTS = True  # Set this to False for debugging only


def is_network_service(network):
    """Return True if the network is a network analysis service URL. Otherwise, return False."""
    if isinstance(network, str) and network.startswith("http"):
        return True
    return False


def cell_size_to_meters(cell_size_param_value: str) -> Optional[float]:
    """Convert the cell size tool parameter string value to a numerical value in units of meters.

    Args:
        cell_size_param_value (str): cell size tool parameter string value

    Raises:
        ValueError: If the units are invalid.

    Returns:
        Optional[float]: Cell size numerical value in units of meters. If the input is empty, return None.
    """
    if not cell_size_param_value:
        return None
    # Split the cell size string value from the tool parameter into its numerical value and units.
    # This text splitting behavior works adequately even with language packs and RTL languages because the
    # Linear Unit type parameter always reads in the valueAsText as "[number] [English units]"
    cell_size, units = cell_size_param_value.split(" ")
    # Locales that use a comma as a decimal may return numbers like 10,5, so replace commas with periods before
    # converting to float.
    cell_size = float(cell_size.replace(",", "."))

    # Convert the numerical value to meters
    return cell_size * arcpy.LinearUnitConversionFactor(units, "Meters")


class TravelModeUnitType(enum.Enum):
    """Defines the travel mode's unit type."""

    Time = 1
    Distance = 2
    Other = 3


def get_travel_mode_unit_type(travel_mode: arcpy.nax.TravelMode) -> TravelModeUnitType:
    """Determine what type of units the travel mode has.

    Args:
        travel_mode (arcpy.nax.TravelMode): Travel mode, generally retrieved from the tool parameter

    Returns:
        TravelModeUnitType: Travel mode unit type
    """
    impedance = travel_mode.impedance
    time_attr = travel_mode.timeAttributeName
    dist_attr = travel_mode.distanceAttributeName
    if impedance == time_attr:
        return TravelModeUnitType.Time
    if impedance == dist_attr:
        return TravelModeUnitType.Distance
    # Impedance attribute does not match time or distance units; therefore, it has unknown or "other" units.
    return TravelModeUnitType.Other


def does_travel_mode_use_transit_evaluator(network: str, travel_mode: arcpy.nax.TravelMode) -> bool:
    """Check if the travel mode uses the Public Transit evaluator.

    Args:
        network (str): Network data source path
        travel_mode (arcpy.nax.TravelMode): Travel mode

    Returns:
        bool: True if the travel mode's impedance uses the Public Transit evaluator and False otherwise.
    """
    # Only perform this check if the network is not a service and if the travel mode uses a time-based
    # impedance attribute. Opening the network dataset and checking the evaluators is slow, and since the
    # Public Transit evaluator only applies to time-based attributes, it's a waste of time to check in other
    # cases.
    if not is_network_service(network) and \
            get_travel_mode_unit_type(travel_mode) == TravelModeUnitType.Time:
        nd_desc = arcpy.Describe(network)
        impedance_desc = [attr for attr in nd_desc.attributes if attr.name == travel_mode.impedance][0]
        for x in range(impedance_desc.evaluatorCount):
            if getattr(impedance_desc, f"evaluatorType{x}") == "Public Transit":
                return True

    return False


def units_str_to_enum(units_str: str) -> Optional[Union[arcpy.nax.TimeUnits, arcpy.nax.DistanceUnits]]:
    """Convert a string representation of time or distance units to an arcpy.nax enum.

    Args:
        units_str (str): Cutoff units string passed in as a tool argument.

    Returns:
        Optional[Union[arcpy.nax.TimeUnits, arcpy.nax.DistanceUnits]]: Enum value for use when network analysis solver
            object properties. Returns None if the units are unknown or cannot be parsed.
    """
    if not units_str:
        return None
    units_str = units_str.lower()
    if units_str == "unknown":
        return None
    if units_str == "minutes":
        return arcpy.nax.TimeUnits.Minutes
    if units_str == "seconds":
        return arcpy.nax.TimeUnits.Seconds
    if units_str == "hours":
        return arcpy.nax.TimeUnits.Hours
    if units_str == "days":
        return arcpy.nax.TimeUnits.Days
    if units_str == "miles":
        return arcpy.nax.DistanceUnits.Miles
    if units_str == "kilometers":
        return arcpy.nax.DistanceUnits.Kilometers
    if units_str == "meters":
        return arcpy.nax.DistanceUnits.Meters
    if units_str == "feet":
        return arcpy.nax.DistanceUnits.Feet
    if units_str == "yards":
        return arcpy.nax.DistanceUnits.Yards
    if units_str in ["nauticalmiles", "nautical miles"]:
        return arcpy.nax.DistanceUnits.NauticalMiles
    # If we got to this point, the input units were invalid. This should never happen because of tool validation.
    # Just return None
    return None


class AnalysisType(enum.Enum):
    """Defines the tool's analysis mode."""

    Stops = 1
    Lines = 2
    Points = 3
    Polygons = 4


def analysis_type_str_to_enum(analysis_type_str: str) -> AnalysisType:
    """Convert a string analysis type keyword from the tool parameter to an AnalysisType.

    Args:
        analysis_type_str (str): Python string keyword from tool parameter.

    Raises:
        ValueError: If the string keyword is not recognized.

    Returns:
        AnalysisType: Analysis type represented by the string keyword.
    """
    if analysis_type_str == "STOPS":
        return AnalysisType.Stops
    if analysis_type_str == "LINES":
        return AnalysisType.Lines
    if analysis_type_str == "POINTS_OF_INTEREST":
        return AnalysisType.Points
    if analysis_type_str == "AREAS":
        return AnalysisType.Polygons
    # If we got this far, the string is invalid. Tool validation should ensure this never happens, but raise an error
    # just in case.
    raise ValueError(f"Invalid analysis type: {analysis_type_str}")


class CountType(enum.Enum):
    """Defines whether to count transit service frequency as arrivals or departures."""

    Arrivals = 1
    Departures = 2


class DateType(enum.Enum):
    """Defines whether a date should be interpreted as a generic weekday or specific date."""

    Generic = 1  # Generic weekday, like Wednesday
    Specific = 2  # Specific date, like April 14, 2021


class DayType(enum.Enum):
    """Defines a day type representing today, yesterday, or tomorrow."""

    Today = 1
    Yesterday = 2
    Tomorrow = 3


class TimeRange:
    """Defines a time range for use in this tool based on a start datetime and duration."""

    def __init__(self, tw_datetime: datetime.datetime, tw_duration: float, day: DayType = DayType.Today):
        """Define the time range."""
        added_minutes = 0
        if day == DayType.Yesterday:
            # If this time range is meant to represent yesterday, change the datetime to the previous day.
            # Add one day's worth of minutes to the time window start.
            # This models trips that started yesterday and are still running in the early morning hours.
            tw_datetime -= datetime.timedelta(days=1)
            added_minutes += MINS_IN_DAY
        elif day == DayType.Tomorrow:
            # If this time range is meant to represent tomorrow, change the datetime to the next day.
            # Subtract one day's worth of minutes to the time window start. This models trips that start today but
            # continue running into the early hours of the next morning.
            tw_datetime += datetime.timedelta(days=1)
            added_minutes -= MINS_IN_DAY
        self.day = WEEKDAYS[tw_datetime.weekday()]
        # Get the number of minutes since midnight when the time window starts
        self.date = datetime.datetime(tw_datetime.year, tw_datetime.month, tw_datetime.day, 0, 0, 0)
        self.start = (tw_datetime - self.date).total_seconds() / 60.0  # Number of minutes since midnight
        self.start += added_minutes  # Adjust for yesterday or tomorrow
        self.end = self.start + tw_duration


class TimeWindow:
    """Defines a time window for use in this tool."""

    def __init__(
        self, prefix: str, tw_datetime: datetime.datetime, duration: float, date_type: DateType, count_type: CountType
    ):
        """Define the time window properties."""
        self.prefix = prefix
        self.date_type = date_type
        self.count_type = count_type
        self.start_date_time = tw_datetime
        self.duration = duration
        # Initialize time range class instances for today, yesterday, and tomorrow
        self.time_ranges = {
            DayType.Today: TimeRange(tw_datetime, self.duration),
            DayType.Yesterday: TimeRange(tw_datetime, self.duration, DayType.Yesterday),
            DayType.Tomorrow: TimeRange(tw_datetime, self.duration, DayType.Tomorrow)
        }

    def get_day_or_date_str(self) -> str:
        """Return a string representation of the time window's start datetime.

        Returns:
            str: Weekday name and time stamp if the date type is generic, locale-formatted datetime string if it's a
            specific date.
        """
        try:
            if self.date_type == DateType.Generic:
                # Return weekday name with time stamp
                return self.start_date_time.strftime('%A %X')
            else:
                # Return full datetime formatted for locale
                return self.start_date_time.strftime('%c')
        except Exception as ex:  # pylint: disable=broad-except
            # If for some reason the above formatting fails, just return a direct string representation of the start
            # datetime. Failure is more likely to happen with locales like Arabic and Japanese which use non-Gregorian
            # calendars. This hopefully won't happen, but it's good to catch the problem just in case.
            return str(self.start_date_time)


def value_table_to_time_window(tw_value_table) -> List[TimeWindow]:
    """Convert the tool input time window value table to the TimeWindow class."""
    time_windows = []
    for row_idx in range(tw_value_table.rowCount):
        try:
            specific_date = DateType.Specific if tw_value_table.getTrueValue(row_idx, 0) else DateType.Generic
            start_datetime = tw_value_table.getTrueValue(row_idx, 1)
            # For some reason getTrueValue adds a random microsecond in Linux.
            # See https://devtopia.esri.com/ArcGISPro/Python/issues/1367#issuecomment-3003186
            # We don't have microsecond precision levels with transit service, so get rid of anything smaller than
            # seconds.
            start_datetime = start_datetime.replace(microsecond=0)
            duration = tw_value_table.getTrueValue(row_idx, 2)
            arr_or_dep = tw_value_table.getTrueValue(row_idx, 3)
            arr_or_dep = CountType.Arrivals if arr_or_dep == "ARRIVALS" else CountType.Departures
            prefix = tw_value_table.getTrueValue(row_idx, 4)
        except Exception as ex:
            arcpy.AddError(str(ex))
            # Unable to parse time window.
            raise gtfs_utils.Error(240001)

        time_windows.append(TimeWindow(prefix, start_datetime, duration, specific_date, arr_or_dep))

    return time_windows


def get_stats_field_defs(field_prefix) -> List[list]:
    """Return a list of field definitions for the output statistics fields for the given prefix."""
    return [
        [f"{field_prefix}_NumRuns", "LONG"],
        [f"{field_prefix}_MinHeadway", "DOUBLE"],
        [f"{field_prefix}_MaxHeadway", "DOUBLE"],
        [f"{field_prefix}_AvgHeadway", "DOUBLE"],
        [f"{field_prefix}_NumLines", "LONG"],
        [f"{field_prefix}_NumRunsPerHour", "DOUBLE"]
    ]


class TransitDataModel:  # pylint: disable=too-many-instance-attributes
    """Defines and validates the public transit data model as relevant to this tool."""

    def __init__(self, transit_fd: str):
        """Define the public transit data model as relevant to this tool."""
        # For details on the public transit data model, see
        # https://pro.arcgis.com/en/pro-app/latest/help/analysis/networks/transit-data-model.htm
        gdb = os.path.dirname(transit_fd)
        self.stops = os.path.join(transit_fd, "Stops")
        self.line_variant_elements = os.path.join(transit_fd, "LineVariantElements")
        self.line_variants = os.path.join(gdb, "LineVariants")
        self.lines = os.path.join(gdb, "Lines")
        self.lve_shapes = os.path.join(transit_fd, "LVEShapes")
        self.calendars = os.path.join(gdb, "Calendars")
        self.calendar_exceptions = os.path.join(gdb, "CalendarExceptions")
        self.runs = os.path.join(gdb, "Runs")
        self.schedules = os.path.join(gdb, "Schedules")
        self.schedule_elements = os.path.join(gdb, "ScheduleElements")
        self.required_tables = [
            self.stops, self.line_variant_elements, self.line_variants, self.lines, self.runs, self.schedules,
            self.schedule_elements]
        self.has_calendars = None  # Set in validate_tables_exist()
        self.has_calendar_exceptions = None  # Set in validate_tables_exist()
        self.has_lve_shapes = None  # Set in validate_tables_exist()
        self.required_fields = {
            self.stops: ["ID"],
            self.line_variant_elements: ["FromStopID", "ToStopID", "LineVarID", "SqIdx"],
            self.line_variants: ["ID", "LineID"],
            self.lines: ["ID"],
            self.lve_shapes: ["ID"],
            self.calendars: ["ID", "StartDate", "EndDate"],
            self.calendar_exceptions: ["CalendarID", "ExceptionDate", "GExceptionType"],
            self.runs: ["ID", "ScheduleID", "StartRun"],
            self.schedules: ["LineVarID", "ID"],
            self.schedule_elements: ["ScheduleID", "SqIdx", "Arrival", "Departure"]
        }
        self.lv_has_gdirectionid = None  # Set in validate_required_fields()
        self.runs_has_gwheelchairaccessible = None  # Set in validate_required_fields()
        self.runs_has_gbikesallowed = None  # Set in validate_required_fields()
        self.stops_has_gwheelchairboarding = None  # Set in validate_required_fields()
        self.lve_has_lveshapeid = None  # Set in validate_required_fields()

    def validate_tables_exist(self) -> bool:
        """Validate that the required public transit data model feature classes and tables exist.

        This function just returns a boolean. Error handling is the responsibility of the caller.

        Returns:
            bool: True if all required data exists. False otherwise.
        """
        # Check for required feature classes and tables
        for table in self.required_tables:
            if not arcpy.Exists(table):
                return False
        # Check that at least one of the calendar tables is present
        self.has_calendars = arcpy.Exists(self.calendars)
        self.has_calendar_exceptions = arcpy.Exists(self.calendar_exceptions)
        if not (self.has_calendars or self.has_calendar_exceptions):
            return False
        # Check if LVEShapes exists, even though it isn't required
        self.has_lve_shapes = arcpy.Exists(self.lve_shapes)
        # If we've gotten this far, everything is present
        return True

    def validate_required_fields(self):
        """Validate that the transit data model feature classes and tables have the required fields for this tool.

        Raises:
            gtfs_utils.Error: If not all required fields are present.
        """
        for table, fields in self.required_fields.items():
            if table == self.calendars and not self.has_calendars:
                continue
            if table == self.calendar_exceptions and not self.has_calendar_exceptions:
                continue
            if table == self.lve_shapes and not self.has_lve_shapes:
                continue
            # Compare in lower case because SDE switches the case around. Oracle is all upper. Postgres is all lower.
            required_fields_lower = [f.lower() for f in fields]
            actual_fields = [f.name.lower() for f in arcpy.ListFields(table)]
            if not set(required_fields_lower).issubset(set(actual_fields)):
                # Public transit data model table %1 is missing one or more required fields. Required fields: %2
                raise gtfs_utils.Error(2925, table, ", ".join(fields))
            if table == self.line_variants:
                self.lv_has_gdirectionid = "gdirectionid" in actual_fields
            if table == self.runs:
                self.runs_has_gwheelchairaccessible = "gwheelchairaccessible" in actual_fields
                self.runs_has_gbikesallowed = "gbikesallowed" in actual_fields
            if table == self.stops:
                self.stops_has_gwheelchairboarding = "gwheelchairboarding" in actual_fields
            if table == self.line_variant_elements:
                self.lve_has_lveshapeid = "lveshapeid" in actual_fields

    def get_groutetype_modes(self):
        """Get the list of unique GRouteType transit mode values from the Lines table."""
        if not arcpy.Exists(self.lines):
            # Can't get list of GRouteType values from Lines if Lines doesn't exist
            # This is an unlikely scenario and an indication of a messed up data model.
            return []
        if "groutetype" not in [f.name.lower() for f in arcpy.ListFields(self.lines)]:
            # Can't get a list of modes without the GRouteType field, which is optional in the data model
            return []
        try:
            with arcpy.da.SearchCursor(  # pylint: disable=no-member
                self.lines, ["GRouteType"], sql_clause=("DISTINCT GRouteType", None)
            ) as cur:
                route_types = sorted([c[0] for c in cur])
            return route_types
        except Exception:  # pylint: disable=broad-except
            # Something went wrong in checking GRouteType values.  Don't worry about it and return an empty list.
            return []


class TransitFrequencyCalculator:  # pylint: disable=too-many-instance-attributes
    """Calculate the frequency of public transit service."""

    def __init__(  # pylint: disable=too-many-arguments
        self, transit_fd: str, analysis_type: AnalysisType, out_fc: str, time_windows: List[TimeWindow],
        separate_lines: bool, poi_fc: FCDATATYPE = None, network: NDDATATYPE = None, travel_mode: TMDATATYPE = None,
        cutoff: float = None, cutoff_units: Union[arcpy.nax.DistanceUnits, arcpy.nax.TimeUnits] = None,
        cell_size_meters: float = 80, barriers: List[FCDATATYPE] = None,
        wheelchair: bool = False, bicycle: bool = False, exclude_modes: List[int] = None,
        use_lve_shapes: bool = False
    ):
        """Initialize a class to calculate frequency of public transit service.

        Args:
            transit_fd (str): Catalog path to feature dataset with public transit data model feature classes.
            analysis_type (AnalysisType): Analysis mode. Whether to count frequency of service at stops, along transit
                lines, at points of interest, or in polygon areas.
            out_fc (str): Catalog path to the output feature class.
            time_windows (List[TimeWindow]): List of time windows for which to calculate transit service frequency.
            separate_lines (bool): Whether or not service should be counted separately for different transit lines that
                utilize the same corridors.
            poi_fc (FCDATATYPE, optional): Feature class of points of interest (can be points or polygons) to analyze
                for the points of interest analysis mode only. Defaults to None.
            network (NDDATATYPE, optional): Network data source to use for network analysis for points of interest and
                polygon analysis modes. Defaults to None.
            travel_mode (TMDATATYPE, optional): Travel mode to use for network analysis. Defaults to None.
            cutoff (float, optional): Impedance cutoff to use for network analysis. Defaults to None.
            cutoff_units (Union[arcpy.nax.DistanceUnits, arcpy.nax.TimeUnits], optional): Units in which to interpret
                the cutoff parameter. Defaults to None.
            cell_size_meters (float, optional): Cell size (edge length) in meters to use for the polygon analysis mode.
                Defaults to 80.
            barriers (List, optional): List of point, line, and polygon feature classes to use as barriers in the
                network analysis. Defaults to None.

        Raises:
            gtfs_utils.Error: If the public transit data model tables are invalid.
        """
        self.analysis_type = analysis_type
        self.out_fc = out_fc
        self.time_windows = time_windows
        self.separate_lines = separate_lines
        self.use_lve_shapes = use_lve_shapes
        self.poi_fc = poi_fc

        # The POINTS_OF_INTEREST and POLYGONS analysis types both aggregate stops into groups reachable from a specific
        # point or area. Thus, they share some common code that the other types do not need to do.
        self.poi_mode = bool(self.analysis_type in [AnalysisType.Polygons, AnalysisType.Points])

        # Initialize and validate public transit data model
        self.transit_dm = TransitDataModel(transit_fd)
        if not self.transit_dm.validate_tables_exist():
            # One or more public transit data model tables does not exist.
            raise gtfs_utils.Error(2922)
        self.transit_dm.validate_required_fields()

        # Check LVEShapes
        if self.analysis_type is not AnalysisType.Lines:
            self.use_lve_shapes = False  # This option only applies for the Lines output type
        if self.use_lve_shapes:
            if not self.transit_dm.has_lve_shapes:
                # Cannot use cartographic shapes for the output because the public transit data model does not have the
                # LVEShapes feature class.
                raise gtfs_utils.Error(240023)
            if not self.transit_dm.lve_has_lveshapeid:
                # Cannot use cartographic shapes for the output because the public transit data model's
                # LineVariantElements feature class does not have the LVEShapeID field.
                raise gtfs_utils.Error(240024)
            if int(arcpy.management.GetCount(self.transit_dm.lve_shapes).getOutput(0)) <= 0:
                # Cannot use cartographic shapes for the output because the public transit data model's LVEShapes
                # feature class is empty.
                raise gtfs_utils.Error(240026)

        # Network Analyst settings
        self.network = network
        self.is_service = is_network_service(self.network)
        self.travel_mode = travel_mode
        self.cutoff = cutoff
        self.cutoff_units = cutoff_units
        self.is_distance_cutoff = False  # Updated when setting solver properties
        self.barriers = barriers
        self.solver_object = None
        self.cell_size_meters = cell_size_meters
        # If we're using a local network dataset, check out the Network Analyst extension license. This is only
        # applicable for Concurrent Use licensing, but it won't hurt anything for Single Use or Named User.
        if self.poi_mode and not self.is_service:
            # Make sure the license is available.
            if arcpy.CheckExtension("network").lower() == "available":
                arcpy.CheckOutExtension("network")
            else:
                # The operation failed because no Network Analyst license is present.
                raise gtfs_utils.Error(30218)

        # Throw a warning if the selected travel mode uses the Public Transit evaluator
        try:
            if does_travel_mode_use_transit_evaluator(self.network, self.travel_mode):
                # The selected travel mode uses the Public Transit evaluator. This tool is intended to model
                # travel to and from public transit stops, not travel by public transit. The selected travel
                # mode may be inappropriate for this tool.
                arcpy.AddIDMessage("WARNING", 240005)
        except Exception:  # pylint: disable=broad-except
            # If the above check fails for some reason, just don't worry about it.
            pass

        # Points of interest can be points or polygons. Set this later if it's relevant.
        self.poi_shape_type = None

        # Optional parameters used to exclude stops and runs
        self.wheelchair = wheelchair
        if not self.transit_dm.runs_has_gwheelchairaccessible and not self.transit_dm.stops_has_gwheelchairboarding:
            self.wheelchair = False  # No wheelchair info available
        self.bicycle = bicycle if self.transit_dm.runs_has_gbikesallowed else False
        self.exclude_modes = list(set(exclude_modes)) if exclude_modes else []

        # Define some field names we'll use throughout for tracking various things
        self.se_time_of_day_field = "TimeOfDay"
        self.poi_id_field = "POI_ID"
        self.stop_id_fields = ["FromStopID", "ToStopID"]
        # Main ID field we'll use throughout our dataframes that will eventually join transit count statistics back to
        # the IDs of whatever table the user actually cares about.
        self.tracked_id_field = "TrackedID"
        # The name of the field in the output feature class which we will use to join our stats tables. The TrackedID
        # field values should correspond to the values in this field in the output table.
        self.out_fc_id_field = self._get_id_field_name_for_joins()
        # Define output fields. This is used so we can delete these fields in advance in the output data if they
        # already exist since we want to re-create them to ensure the correct data types and re-populate them with
        # updated output. The deletion case should be unusual.
        self.output_fields = []
        for tw in self.time_windows:
            field_prefix = tw.prefix
            self.output_fields += [
                f"{field_prefix}_NumRuns",
                f"{field_prefix}_MinHeadway",
                f"{field_prefix}_MaxHeadway",
                f"{field_prefix}_AvgHeadway",
                f"{field_prefix}_NumLines",
                f"{field_prefix}_NumRunsPerHour"
            ]
        if self.analysis_type == AnalysisType.Points:
            self.output_fields.append("NumStops")
        if self.analysis_type == AnalysisType.Stops:
            self.output_fields.append("LineID")
        # For Stops and Lines modes, determine if the input data has the GDirectionID field because if it does, we have
        # to explicitly handle it.
        self.use_gdirectionid = self.transit_dm.lv_has_gdirectionid and not self.poi_mode

        # Store some dataframes that can be shared across time windows
        self.poi_df = None
        self.combined_lve_df = None
        self.separated_stops_df = None

        # Temporary intermediate outputs to delete later
        self.temp_outputs = []

    def _get_id_field_name_for_joins(self) -> str:
        """Return the string field name in the output feature class representing the feature's ID.

        This is used for joining the calculated transit frequency statistics to the output table and depends on the
        analysis type.

        Returns:
            str: ID field name for this analysis type
        """
        if self.analysis_type == AnalysisType.Stops and not self.separate_lines:
            return "ID"  # ID field from Public Transit Data Model Stops table
        if self.analysis_type == AnalysisType.Lines and self.separate_lines:
            # We have to add an ID field to the copied version of LineVariantElements in case the ObjectID fields
            # change when we run ExportFeatures. LineVariantElements does not have an ID field and relies
            # on ObjectID in the data model.
            base_fname = "OrigOID"
            fields = [f.name for f in arcpy.ListFields(self.transit_dm.line_variant_elements)]
            if base_fname not in fields:
                return base_fname
            else:
                final_fname = None
                count = 0
                while final_fname is None:
                    count += 1
                    updated_fname = f"{base_fname}{count}"
                    if updated_fname not in fields:
                        final_fname = updated_fname
                return final_fname
        # AnalysisType.Points, AnalysisType.Polygons, AnalysisType.Lines when combining corridors, AnalysisType.Stops
        # when not combining corridors
        # For points of interest and polygons, just use the ObjectIDs of these features.
        return "OID@"

    def calculate_transit_frequency(self):
        """Calculate the transit service frequency statistics for the designated analysis type and time windows."""
        # Set the progressor so the user is informed of progress
        arcpy.SetProgressor("default")

        # Generate the output feature class based on analysis mode
        # For Stops, Lines, and Points, we need to copy the original dataset to the output. For Polygons, we generate
        # it here in the tool based on a Service Area analysis.
        # For Points and Polygons, do additional analysis to determine the stops associated with each point or polygon.
        assert isinstance(self.analysis_type, AnalysisType)  # Sanity check.
        if self.analysis_type == AnalysisType.Stops:
            # Copying public transit stops to output...
            msg = arcpy.GetIDMessage(86559)
            arcpy.AddMessage(msg)
            arcpy.SetProgressorLabel(msg)
            self._copy_stops_to_output()
        elif self.analysis_type == AnalysisType.Lines:
            # Copying public transit lines to output...
            msg = arcpy.GetIDMessage(86560)
            arcpy.AddMessage(msg)
            arcpy.SetProgressorLabel(msg)
            self._copy_lves_to_output()
        elif self.analysis_type == AnalysisType.Points:
            # Finding public transit stops within range of points of interest...
            msg = arcpy.GetIDMessage(86561)
            arcpy.AddMessage(msg)
            arcpy.SetProgressorLabel(msg)
            if int(arcpy.management.GetCount(self.poi_fc).getOutput(0)) < 1:
                # {self.poi_fc} has no rows."
                raise gtfs_utils.Error(3419, self.poi_fc)
            # Copy the input points of interest to the output feature class
            self._copy_pois_to_output()

            # Find the stops associated with each POI using an OD Cost Matrix analysis.
            self._get_stops_for_pois()
            # poi_df status:
            # Columns: POI_ID, StopID

            # Add the number of stops in range to the output
            self._add_stop_count_to_poi_output()

            # If the dataframe is empty, this means that no stops were in range of the points of interest. Error out
            # and don't waste time trying to calculate transit service frequency.
            if self.poi_df is None or self.poi_df.empty:
                # No public transit stops were found within the cutoff of {cutoff} {units} of the points of interest.
                raise gtfs_utils.Error(240008, str(self.cutoff), self.cutoff_units.name)

        else:  # AnalysisType.Polygons:
            # Create Service Areas around all transit stops, post-process the polygons, and determine which stops are
            # associated with each polygon area.
            # Calling this function also creates the output feature class since it is generated from scratch.
            self._get_stops_for_areas()
            # poi_df status:
            # Columns: POI_ID, StopID

        arcpy.ResetProgressor()

        # Calculate the transit service frequency for each time window and write it to the output.
        arcpy.SetProgressor("step", None, 0, len(self.time_windows), 1)
        step = 0
        for time_window in self.time_windows:
            # Calculating area within range of public transit stops...
            msg = arcpy.GetIDMessage(86563) % time_window.prefix
            arcpy.AddMessage(msg)
            arcpy.SetProgressorLabel(msg)
            self._calculate_transit_frequency_for_time_window(time_window)
            step += 1
            arcpy.SetProgressorPosition(step)

        arcpy.ResetProgressor()

        # Write metadata to output
        self._write_metadata_to_output()

        # Clean up intermediate outputs
        if DELETE_INTERMEDIATE_OUTPUTS and self.temp_outputs:
            try:
                arcpy.management.Delete(self.temp_outputs)
            except Exception:  # pylint: disable=broad-except
                # If this doesn't work for some reason, don't worry about it, and don't make the tool fail.
                pass

    def _calculate_transit_frequency_for_time_window(self, time_window: TimeWindow):
        """Calculate the transit frequency statistics for a specific time window and join them to the output.

        Args:
            time_window (TimeWindow): Time window for which to calculate frequency statistics
        """
        assert isinstance(time_window, TimeWindow)  # Sanity check

        # Get a table with run times for each line or stop, updated to relate the run times to whatever final ID we're
        # trying to relate it to.
        run_times_df = self._make_table_with_run_times(time_window)
        # run_times_df status:
        # Columns: TrackedID (appropriate for desired output), TimeOfDay
        # The rows have been sorted by TrackedID, TimeOfDay

        if run_times_df is None or run_times_df.empty:
            # If there is no service, don't try to calculate any statistics.
            # There is no public transit service during time window "{time_window.prefix}".
            arcpy.AddIDMessage("WARNING", 240004, time_window.prefix)
            self._write_no_service_to_output(time_window.prefix)

        else:
            # Calculate the relevant statistics
            stats_df = self._calculate_frequency_stats(run_times_df, time_window)
            del run_times_df

            # Write stats to output
            self._write_stats_to_output(stats_df, time_window.prefix)
            del stats_df

    def _map_run_times_to_output_ids(self, run_times_df: pd.DataFrame) -> pd.DataFrame:
        """Remap the run_times dataframe to the final output feature class's IDs if necessary.

        Args:
            run_times_df (pd.DataFrame): Dataframe of run times with IDs that need to be mapped.

        Returns:
            pd.DataFrame: Updated dataframe where the TrackedID field can be mapped to the output feature class
        """
        # For AnalysisType.Lines and separate_lines = False
        # When counting frequency on combined lines, we need to associate each FromStopID, ToStopID pair with the OIDs
        # of the combined output feature class
        if self.combined_lve_df is not None:
            id_fields = [f for f in self.stop_id_fields]
            # run_times_df status:
            # Columns: FromStopID, ToStopID, TimeOfDay
            # Do sanity check of schema
            for field in id_fields:
                assert field in run_times_df.columns
            run_times_df.set_index(id_fields, inplace=True)
            # This join makes a copy of the globally-stored combined_lve_df and does not alter it so it can be reused
            # with the next time window
            lve_df = self.combined_lve_df.join(run_times_df, how="inner")
            lve_df.reset_index(inplace=True)
            run_times_df = lve_df.drop(id_fields, axis="columns")
            del lve_df
            run_times_df.rename(columns={self.poi_id_field: self.tracked_id_field}, inplace=True)
            # run_times_df status:
            # Columns: TrackedID, TimeOfDay
            # TrackedID now represents the OID of the output feature class

        # For AnalysisType.Stops and separate_lines = True
        # When counting frequency at stops while keeping lines separate, we need to associate each StopID, LineID pair
        # with the OIDs of the separated output feature class. We might additionally have the GDirectionID column to
        # include with StopID and LineID.
        if self.separated_stops_df is not None:
            # run_times_df status:
            # Columns: TrackedID, TimeOfDay, LineID, GDirectionID (optional)
            # Do sanity check of schema
            assert self.tracked_id_field in run_times_df.columns
            assert "LineID" in run_times_df.columns
            if self.use_gdirectionid:
                assert "GDirectionID" in run_times_df.columns
            # Join run times to separated stops
            index_fields = [self.tracked_id_field, "LineID"]
            if self.use_gdirectionid:
                index_fields.append("GDirectionID")
                # Convert the GDirectionID field to text because it can sometimes have null values, and the upcoming
                # joins do not work properly with nan values
                run_times_df = run_times_df.astype({"GDirectionID": str})
            run_times_df.set_index(index_fields, inplace=True)
            # This join makes a copy of the globally-stored separated_stops_df and does not alter it so it can be reused
            # with the next time window
            lve_df = self.separated_stops_df.join(run_times_df, how="inner")
            lve_df.reset_index(inplace=True)
            run_times_df = lve_df.drop([self.tracked_id_field], axis="columns")
            del lve_df
            run_times_df.rename(columns={self.poi_id_field: self.tracked_id_field}, inplace=True)
            # run_times_df status:
            # Columns: TrackedID, TimeOfDay
            # TrackedID now represents the OID of the output feature class

        # For AnalysisType.Points and AnalysisType.Polygons
        # When counting frequency for points of interest or in polygon slivers that have a set of stops associated with
        # them, join the run times table into the POI table so each POI's ID can be associated with a list of runs
        # serving all accessible stops
        # Do an inner join so that each POI is duplicated for each run, but any POI with no associated stops and any
        # run table info not associated with one of the POI stops is dropped.
        if self.poi_df is not None:
            # run_times_df status:
            # Columns: TrackedID, RunID, TimeOfDay
            # Do sanity check of schema
            assert self.tracked_id_field in run_times_df.columns
            assert "RunID" in run_times_df.columns
            assert "StopID" in self.poi_df.columns
            # Join run times to POIs
            run_times_df.set_index(self.tracked_id_field, inplace=True)
            # This join makes a copy of the globally-stored poi_df and does not alter it so it can be reused with the
            # next time window
            poi_df = self.poi_df.join(run_times_df, "StopID", "inner")
            # Sort by POI_ID, TimeOfDay.
            assert self.poi_id_field in poi_df.columns
            assert self.se_time_of_day_field in poi_df.columns
            poi_df.sort_values([self.poi_id_field, self.se_time_of_day_field], inplace=True)
            # poi_df status:
            # Columns: POI_ID, StopID, RunID, TimeOfDay
            # The rows have been sorted by POI_ID, TimeOfDay

            # Drop duplicate runs with the same RunID for each POI. This represents the case where the POI has access to
            # multiple stops, and the same run visits more than one of those stops within the time window. We do not
            # want to double count the same run, so drop all but the first occurrence of it. Note that this means our
            # headway calculations will be a bit off since selecting the first instance is arbitrary, but those
            # calculations are a bit funky anyway since we're averaging over multiple stops.
            run_times_df = poi_df.drop_duplicates(subset=[self.poi_id_field, 'RunID'], keep='first')
            del poi_df

            # Eliminate no-longer-relevant fields and rename POI_ID to our tracked field name
            run_times_df.drop(["StopID", "RunID"], axis="columns", inplace=True)
            run_times_df.rename(columns={self.poi_id_field: self.tracked_id_field}, inplace=True)
            # run_times_df status:
            # Columns: TrackedID, TimeOfDay
            # TrackedID now represents the ObjectID of the POI or polygon sliver

        # For all other cases, the run_times_df does not need to be altered.

        return run_times_df

    def _make_table_with_run_times(self, time_window: TimeWindow) -> Optional[pd.DataFrame]:
        """Get all times when transit service visits each tracked feature for this time window.

        The calculation combines trips running today, yesterday (for rollover trips that go past midnight) and tomorrow
        (if the time window extends past midnight).

        The returned dataframe has columns: TrackedID, RunID (optional), TimeOfDay, LineID
        The rows have been sorted by TrackedID, TimeOfDay

        Args:
            time_window (TimeWindow): Time window for which to calculate frequency statistics

        Returns:
            Optional[pd.DataFrame]: Pandas dataframe with all transit service times for the tracked feature. Returns
                None if there is no service during the time window.
        """
        assert isinstance(time_window, TimeWindow)  # Sanity check

        # Get a table with run times for each line or stop
        # Get transit service running on the specified day
        run_times_df = self._make_table_with_run_times_for_day_type(time_window, DayType.Today)

        # Get any transit service still running from yesterday (relevant primarily in the early-morning hours)
        run_times_df_yesterday = self._make_table_with_run_times_for_day_type(time_window, DayType.Yesterday)
        if run_times_df_yesterday is not None:
            # Subtract the number of minutes in a day off of this service
            assert self.se_time_of_day_field in run_times_df_yesterday.columns  # Sanity check
            run_times_df_yesterday[self.se_time_of_day_field] = \
                run_times_df_yesterday[self.se_time_of_day_field] - MINS_IN_DAY
            if run_times_df is not None:
                run_times_df = pd.concat([run_times_df, run_times_df_yesterday])
            else:
                run_times_df = run_times_df_yesterday

        # If the time window extends into the next day, get any service from tomorrow's schedule that might be relevant.
        if time_window.time_ranges[DayType.Today].end > MINS_IN_DAY:
            run_times_df_tomorrow = self._make_table_with_run_times_for_day_type(time_window, DayType.Tomorrow)
            if run_times_df_tomorrow is not None:
                assert self.se_time_of_day_field in run_times_df_tomorrow.columns  # Sanity check
                run_times_df_tomorrow[self.se_time_of_day_field] = \
                    run_times_df_tomorrow[self.se_time_of_day_field] + MINS_IN_DAY
                if run_times_df is not None:
                    run_times_df = pd.concat([run_times_df, run_times_df_tomorrow])
                else:
                    run_times_df = run_times_df_tomorrow

        if run_times_df is None or run_times_df.empty:
            # There is no service during this time window.
            return None

        # run_times_df status:
        # Columns: TrackedID, RunID (optional), TimeOfDay, LineID, GDirectionID (optional)
        # OR
        # Columns: FromStopID, ToStopID, TimeOfDay

        # Do appropriate joins depending on analysis type to map the run times to the IDs being tracked for the final
        # output feature class.
        run_times_df = self._map_run_times_to_output_ids(run_times_df)

        return run_times_df

    def _get_valid_calendar_ids(self, time_window: TimeWindow, day_type: DayType) -> List[int]:
        """Return a list of transit data model Calendar IDs valid for the time window and day.

        Args:
            time_window (TimeWindow): Time window for which to calculate frequency statistics
            day_type (DayType): Today, Yesterday, or Tomorrow

        Returns:
            List[int]: List of Calendar ID values
        """
        # Sanity checks
        assert isinstance(time_window, TimeWindow)
        assert isinstance(day_type, DayType)

        # Get a list of Calendar IDs valid for the time window date or day
        valid_calendar_ids = []
        if self.transit_dm.has_calendars:
            where = f"{time_window.time_ranges[day_type].day} = 1"
            for row in arcpy.da.SearchCursor(  # pylint: disable=no-member
                self.transit_dm.calendars, ["ID", "StartDate", "EndDate"], where
            ):
                if time_window.date_type == DateType.Specific and (
                    time_window.time_ranges[day_type].date < row[1] or time_window.time_ranges[day_type].date > row[2]
                ):
                    # The time window does not fall within the row's valid date range
                    continue
                valid_calendar_ids.append(row[0])

        # For exact dates, we need to add and remove service according to CalendarExceptions
        if time_window.date_type == DateType.Specific and self.transit_dm.has_calendar_exceptions:
            remove_service = []
            for row in arcpy.da.SearchCursor(  # pylint: disable=no-member
                self.transit_dm.calendar_exceptions, ["CalendarID", "ExceptionDate", "GExceptionType"]
            ):
                if row[1] != time_window.time_ranges[day_type].date:
                    # Date does not apply
                    continue
                if row[2] == 1:
                    # Service is added
                    valid_calendar_ids.append(row[0])
                elif row[2] == 2:
                    # Service is removed
                    remove_service.append(row[0])
            if remove_service:
                valid_calendar_ids = [id for id in valid_calendar_ids if id not in remove_service]

        return valid_calendar_ids

    def _make_table_with_run_times_for_day_type(  # pylint: disable=too-many-locals, too-many-return-statements
        self, time_window: TimeWindow, day_type: DayType
    ) -> Optional[pd.DataFrame]:
        """Get the times when transit service visits stops or lines for this time window for the specified day.

        Args:
            time_window (TimeWindow): Time window for which to calculate frequency statistics
            day_type (DayType): Today, Yesterday, or Tomorrow

        Returns:
            Optional[pd.DataFrame]: Pandas dataframe with transit service times for the specified day. Returns None if
                there is no service during the time window on the specified day. The returned dataframe has columns:
                TrackedID, RunID (optional), TimeOfDay. The rows have been sorted by TrackedID, TimeOfDay.
        """
        # Sanity checks
        assert isinstance(time_window, TimeWindow)
        assert isinstance(day_type, DayType)

        # Documentation for the Network Analyst Public Transit Data Model:
        # https://pro.arcgis.com/en/pro-app/latest/help/analysis/networks/transit-data-model.htm
        # The schemas of all the tables used here and their relationships are described in detail in this documentation.

        # In this first section, we will read in the ScheduleElements table into a dataframe and do a bunch of joins to
        # it. The ScheduleElements dataframe, se_df, is what we will focus on until we are ready to join it to the
        # LineVariantElements table. All other tables we're going to read in are solely for the purpose of joining.

        # Read ScheduleElements into a dataframe with either Arrival or Departure times depending on user's choice
        # The Arrival and Departure times are the number of minutes since the start of a run, not actual times of day.
        se_time_field = "Arrival" if time_window.count_type == CountType.Arrivals else "Departure"
        columns = ["ScheduleID", "SqIdx", se_time_field]
        with arcpy.da.SearchCursor(self.transit_dm.schedule_elements, columns) as cur_se:  # pylint: disable=no-member
            se_df = pd.DataFrame(cur_se, columns=columns)
        if se_df.empty:
            # This is a messed up transit dataset with no schedules.
            return None
        # se_df status:
        # Columns: ScheduleID, SqIdx, Arrival/Departure

        # Read Schedules into a dataframe in order to join the LineVarID into our Schedule Elements dataframe
        with arcpy.da.SearchCursor(  # pylint: disable=no-member
            self.transit_dm.schedules, ["LineVarID", "ID"]
        ) as cur_s:
            s_df = pd.DataFrame(cur_s, columns=["LineVarID", "ScheduleID"])
        s_df.set_index("ScheduleID", inplace=True)
        se_df = se_df.join(s_df, "ScheduleID")
        del s_df
        # se_df status:
        # Columns: ScheduleID, SqIdx, Arrival/Departure, LineVarID

        # Read in LineVariants to get the relationship between LineVarID and Line ID.
        # We potentially need this in multiple places later, so read it in up front.
        in_fields = ["ID", "LineID"]
        out_columns = ["LineVarID", "LineID"]
        if self.use_gdirectionid:
            in_fields.append("GDirectionID")
            out_columns.append("GDirectionID")
        with arcpy.da.SearchCursor(  # pylint: disable=no-member
            self.transit_dm.line_variants, in_fields
        ) as cur_lv:
            lv_df = pd.DataFrame(cur_lv, columns=out_columns)
        lv_df.set_index("LineVarID", inplace=True)

        # If we're excluding any modes, join GRouteType from Lines and drop ScheduleElements with those modes
        if self.exclude_modes:
            # Join the Line ID to se_df
            se_df = se_df.join(lv_df, "LineVarID")
            # Join the GRouteType value from Lines to se_df
            with arcpy.da.SearchCursor(  # pylint: disable=no-member
                self.transit_dm.lines, ["ID", "GRouteType"]
            ) as cur_l:
                l_df = pd.DataFrame(cur_l, columns=["LineID", "GRouteType"], dtype=int)
            l_df.set_index("LineID", inplace=True)
            se_df = se_df.join(l_df, "LineID")
            del l_df
            # Drop rows with excluded modes
            se_df = se_df[~se_df["GRouteType"].isin(self.exclude_modes)]
            if se_df.empty:
                # None of the schedule elements use non-excluded modes
                return None
            # Clean up fields that are no longer needed.
            drop_fields = ["LineID", "GRouteType"]
            if "GDirectionID" in se_df.columns:
                drop_fields.append("GDirectionID")
            se_df.drop(drop_fields, axis="columns", inplace=True)

        valid_calendar_ids = self._get_valid_calendar_ids(time_window, day_type)
        if not valid_calendar_ids:
            # There is no service at all for this time window
            return None

        # Read runs into a dataframe.
        # The StartRun field in the Runs table represents the number of minutes since midnight that the run starts.
        # Only read in the run if StartRun is before the end of our time window.
        # Only read in runs that have CalendarID values in our list of valid ones for the time window day/date.
        where = (f"StartRun <= {time_window.time_ranges[day_type].end} AND CalendarID IN "
                 f"({', '.join([str(cid) for cid in valid_calendar_ids])})")
        # If traveling with a wheelchair and/or bicycle, exclude runs where these are not accessible or allowed
        # (designated by a value of 2 in our data model)
        if self.wheelchair and self.transit_dm.runs_has_gwheelchairaccessible:
            where += " AND (GWheelchairAccessible <> 2 OR GWheelchairAccessible IS NULL)"
        if self.bicycle and self.transit_dm.runs_has_gbikesallowed:
            where += " AND (GBikesAllowed <> 2 OR GBikesAllowed IS NULL)"

        columns = ["ScheduleID", "StartRun"]
        if self.poi_mode:
            # When tracking sets of stops reachable to points of interest or polygon slivers associated with service
            # areas, keep track of the Run ID so we don't double count the same run if it serves multiple stops
            # associated with the same point of interest or polygon.
            columns.append("ID")
        with arcpy.da.SearchCursor(self.transit_dm.runs, columns, where) as cur_r:  # pylint: disable=no-member
            r_df = pd.DataFrame(cur_r, columns=columns)
        r_df.rename(columns={"ID": "RunID"}, inplace=True)
        if r_df.empty:
            # No runs occurring before or during the time window with valid schedules.
            return None

        # Join the Runs table into Schedule Elements.
        # Do an inner join so that each ScheduleElement is duplicated for each run, but any ScheduleElement that has
        # no runs is dropped.
        r_df.set_index("ScheduleID", inplace=True)
        se_df = se_df.join(r_df, "ScheduleID", "inner")
        del r_df
        if se_df.empty:
            # None of the schedule elements have runs during the time window
            return None
        # se_df status:
        # Columns: ScheduleID, SqIdx, Arrival/Departure, LineVarID, StartRun, RunID (optional)
        # Rows have been dropped if they had no runs associated with them.

        # Calculate the actual times of day when the arrival or departure occurs. This is a sum of the time of day
        # when the run starts (StartRun) plus the number of minutes since the beginning of the run that the schedule
        # element happens.
        se_df[self.se_time_of_day_field] = se_df["StartRun"] + se_df[se_time_field]
        # Clean up fields that are no longer needed.
        se_df.drop([se_time_field, "StartRun", "ScheduleID"], axis="columns", inplace=True)
        # se_df status:
        # Columns: SqIdx, LineVarID, RunID (optional), TimeOfDay

        # Drop rows whose times of day are outside of the desired time window
        se_df = se_df[se_df[self.se_time_of_day_field] >= time_window.time_ranges[day_type].start]
        se_df = se_df[se_df[self.se_time_of_day_field] < time_window.time_ranges[day_type].end]
        if se_df.empty:
            # No service during the time window
            return None
        # se_df status:
        # Columns: SqIdx, LineVarID, RunID (optional), TimeOfDay
        # Rows have been dropped if TimeOfDay is outside the time window. Thus, at this point, the only remaining items
        # in this table are relevant to the time window and are valid for our calculations.

        # At this point, we switch focus to the LineVariantElements table. The dataframe will be lve_df.

        # Read LineVariantElements into a dataframe. These represent the actual transit lines, direct logical
        # connections between transit stops in the network. Ultimately what we want to know is the number of runs
        # that happen on each LineVariantElement or Stop during the time window.
        # Depending on which analysis type we're doing, different fields may be needed
        fields = ["LineVarID", "SqIdx"]
        columns = ["LineVarID", "SqIdx"]
        # If we are counting trips on lines, we need to track either the LineVariantElement's OID or the combined
        # FromStopID, ToStopID pair (if we're combining lines along corridors).
        if self.analysis_type == AnalysisType.Lines:
            if self.separate_lines:
                # Use the LineVariantElements ObjectID directly
                fields.append("OID@")
                columns.append(self.tracked_id_field)
            else:
                # We need to track a combination of FromStopID, ToStopID
                fields += self.stop_id_fields
                columns += self.stop_id_fields
        # All other analysis modes involve counting transit service at stops. The LineVariantElements table indicates
        # the IDs of the FromStop and ToStop at the endpoints of the LineVariantElement. Thus, we need to track either
        # the FromStopID (for counting departures) or ToStopID (for counting departures).
        else:
            id_field = "ToStopID" if time_window.count_type == CountType.Arrivals else "FromStopID"
            fields.append(id_field)
            columns.append(self.tracked_id_field)
        with arcpy.da.SearchCursor(  # pylint: disable=no-member
            self.transit_dm.line_variant_elements, fields
        ) as cur_lve:
            lve_df = pd.DataFrame(cur_lve, columns=columns, dtype=int)
        # lve_df status:
        # Columns: LineVarID, SqIdx, TrackedID (refers to either Stops or LineVariantElements)
        # OR
        # Columns: LineVarID, SqIdx, FromStopID, ToStopID

        # Join our big Schedule Elements dataframe into LineVariantElements by matching [LineVarID, SqIdx].
        # Use an inner join so that any LineVariantElements that didn't have a match in our ScheduleElements table
        # (indicating that they had no service) are dropped. We don't need to hang onto those since we're just going to
        # join this table back into our output feature classes anyway and can handle nulls at that time.
        se_df.set_index(["LineVarID", "SqIdx"], inplace=True)
        lve_df = lve_df.join(se_df, ["LineVarID", "SqIdx"], "inner")
        # We are finally done with ScheduleElements and can clear it from memory
        del se_df
        if lve_df.empty:
            # lve_df was empty for some odd reason after an inner join with schedule elements. This probably represents
            # a data problem.
            return None
        # lve_df status:
        # Columns: TrackedID, LineVarID, SqIdx, RunID (optional), TimeOfDay
        # Rows with no corresponding schedule elements have been dropped.

        # If relevant, drop records for wheelchair inaccessible stops
        if self.analysis_type is not AnalysisType.Lines and self.wheelchair and \
                self.transit_dm.stops_has_gwheelchairboarding:
            with arcpy.da.SearchCursor(  # pylint: disable=no-member
                self.transit_dm.stops, ["ID", "GWheelchairBoarding"]
            ) as cur_st:
                st_df = pd.DataFrame(cur_st, columns=["StopID", "GWheelchairBoarding"])
            st_df.set_index("StopID", inplace=True)
            lve_df = lve_df.join(st_df, self.tracked_id_field)
            del st_df
            # Drop rows where wheelchair boarding is not possible
            lve_df = lve_df[lve_df["GWheelchairBoarding"] != 2]
            if lve_df.empty:
                # No service was available after eliminating rows where wheelchair boarding is impossible
                return None
            lve_df.drop(["GWheelchairBoarding"], axis="columns", inplace=True)

        # Track the LineID for each row in the table because this will be used when calculating statistics later.
        # For all analysis modes, we will write out the number of unique transit lines serving the stop/line/POI during
        # the time window. For AnalysisType.Stops, if the user wants to separate counts of transit service by line, we
        # need to track the LineID for each LineVariantElement in order to do the separation. We may also need to track
        # the GDirectionID.
        # Join LineVariants to lve_df to add LineID and GDirectionID
        lve_df = lve_df.join(lv_df, "LineVarID")
        del lv_df  # Done with this for good, now.
        # lve_df status:
        # Columns: TrackedID, LineVarID, SqIdx, RunID (optional), TimeOfDay, LineID, GDirectionID (optional)

        # Clean up columns we're finished with
        lve_df.drop(["LineVarID", "SqIdx"], axis="columns", inplace=True)
        # lve_df status:
        # Columns: TrackedID, RunID (optional), TimeOfDay, LineID
        # OR
        # Columns: FromStopID, ToStopID, RunID (optional), TimeOfDay, LineID

        return lve_df

    def _calculate_frequency_stats(self, run_times_df: pd.DataFrame, time_window: TimeWindow) -> pd.DataFrame:
        """Calculate the transit service frequency statistics based on the table of run times.

        Args:
            run_times_df (pd.DataFrame): Dataframe containing the feature IDs and the transit service times
            time_window (TimeWindow): Time window we're calculating stats for

        Returns:
            pd.DataFrame: Dataframe of calculated transit frequency statistics with the associated feature IDs
        """
        # Sanity checks
        assert not run_times_df.empty
        for field in [self.tracked_id_field, self.se_time_of_day_field]:
            assert field in run_times_df.columns
        assert isinstance(time_window, TimeWindow)

        # Reset the index to be on the safe side. Depending on the previous operations on this dataframe, sometimes I
        # get errors unless I reset the index here.
        run_times_df.reset_index(inplace=True)

        # Make sure run times are sorted
        run_times_df.sort_values([self.tracked_id_field, self.se_time_of_day_field], inplace=True)

        # Calculate headway for each line/at each stop/at POI by calculating the difference between consecutive arrival
        # or departure times. It will return NaN if there are no consecutive rows for that ID group.
        # Group by the tracked ID field
        # Use diff() to calculate the difference between consecutive rows in the TimeOfDay field, resulting in either a
        # numerical difference value or NaN when the difference cannot be calculated.
        run_times_df["Headway"] = run_times_df.groupby(self.tracked_id_field)[self.se_time_of_day_field].diff()
        # run_times_df status:
        # Columns: TrackedID, RunID (optional), TimeOfDay, LineID, Headway

        # Calculate simple stats:
        # Departure_Time count: Number of rows for each LVE (NumRuns)
        # Headway min: Minimum headway value for LVE (MinHeadway)
        # Headway max: Maximum headway value for LVE (MaxHeadway)
        # Headway mean: Average headway value for LVE (AvgHeadway)
        # If the headway values cannot be calculated, they will just get NaN.
        stats = run_times_df.groupby(self.tracked_id_field).agg(
            {
                self.se_time_of_day_field: ["count"],
                "Headway": ["min", "max", "mean"],
                "LineID": ["nunique"]
            }
        )
        # Rename columns to match desired output schema
        stats.columns = stats.columns.droplevel(0)
        stats.rename(
            columns={"count": "NumRuns", "min": "MinHeadway", "max": "MaxHeadway", "mean": "AvgHeadway",
                     "nunique": "NumLines"},
            inplace=True
        )
        # Calculate the number of runs per hour for the time window
        tw_length_hours = (time_window.duration / 60.0)
        stats["NumRunsPerHour"] = stats["NumRuns"] / tw_length_hours

        # Give columns correct time window prefix
        stats.rename(
            columns={col: f"{time_window.prefix}_{col}" for col in stats.columns if col != self.tracked_id_field},
            inplace=True
        )

        return stats

    def _write_stats_to_output(self, stats_df: pd.DataFrame, field_prefix: str):
        """Append the transit frequency statistics fields to the output feature class.

        Args:
            stats_df (pd.DataFrame): Dataframe with the TrackedID field and calculated transit frequency statistics to
                be joined to the output feature class.
            field_prefix (str): Prefix string used in fields for this time window
        """
        # Sanity checks
        assert not stats_df.empty
        assert stats_df.index.name == self.tracked_id_field

        field_defs = get_stats_field_defs(field_prefix)
        fields = ["ObjectID"] + [f[0] for f in field_defs]

        # Append the calculated transit frequency statistics to the output feature class
        arcpy.management.AddFields(self.out_fc, field_defs)
        with arcpy.da.UpdateCursor(self.out_fc, fields) as cur:
            for row in cur:
                oid = row[0]
                try:
                    new_row = [oid] + stats_df.loc[oid].to_list()
                except KeyError:
                    # Fill null values with 0 where appropriate if the feature wasn't even in the dataframe.
                    new_row = [oid, 0, None, None, None, 0, 0]
                cur.updateRow(new_row)

    def _write_no_service_to_output(self, field_prefix: str):
        """When the time window had no service, add empty stats fields to the output feature class."""
        # Add fields for this time window
        field_defs = get_stats_field_defs(field_prefix)
        arcpy.management.AddFields(self.out_fc, field_defs)

        # Calculate the relevant fields to 0 since there is no service
        arcpy.management.CalculateFields(
            self.out_fc,
            "PYTHON3",
            [[f"{field_prefix}_NumRuns", "0"], [f"{field_prefix}_NumRunsPerHour", "0"]]
        )

    def _write_metadata_to_output(self):
        """Write time window information to the output feature class's metadata.

        Metadata is intended to remind users of the time window settings that correspond to the output field prefixes.
        """
        # Retrieve localized strings from xml resources file so metadata can be written in the user's language
        msg_prefix = arcpy.GetIDMessage(86565)  # Time window field prefix: %s
        msg_start = arcpy.GetIDMessage(86566)  # Start date and time: %s
        msg_duration = arcpy.GetIDMessage(86567)  # Duration: %s minutes
        msg_arr = arcpy.GetIDMessage(86568)  # Counting arrivals
        msg_dep = arcpy.GetIDMessage(86569)  # Counting departures
        msg_wchr = arcpy.GetIDMessage(86607)  # Traveling with a wheelchair
        msg_bcl = arcpy.GetIDMessage(86608)  # Traveling with a bicycle
        msg_modes = arcpy.GetIDMessage(86609)  # Exclude modes: %s
        msg_line_shp = arcpy.GetIDMessage(86617)  # Line shape type: %s

        # Get the tool's localized display name
        try:
            # Attempt to use the internal utbx definition to retrieve the localized tool name programmatically.
            # This procedure was recommended by Dmitry Pavlushko.
            tool_path = os.path.join(
                arcpy.GetInstallInfo()["InstallDir"],
                "Resources", "ArcToolBox", "toolboxes", "Public Transit Tools.tbx", "CalculateTransitServiceFrequency")
            msg_tool = arcpy._utbx.GetProps(tool_path)["displayname"]
        except Exception:  # pylint:disable=broad-except
            # If the above fails for some reason, just revert to the English name.
            msg_tool = "Calculate Transit Service Frequency"

        # Access and update the metadata description with the time window settings
        md = arcpy.metadata.Metadata(self.out_fc)
        if md.description:
            md.description += "\n\n"
        else:
            md.description = ""
        md.description += msg_tool
        for time_window in self.time_windows:
            if time_window.count_type == CountType.Arrivals:
                msg_count = msg_arr
            else:
                msg_count = msg_dep
            new_metadata = (
                f"\n\n{msg_prefix % time_window.prefix}\n"
                f"{msg_start % time_window.get_day_or_date_str()}\n"
                f"{msg_duration % time_window.duration}\n"
                f"{msg_count}"
            )
            if self.wheelchair:
                new_metadata += f"\n{msg_wchr}"
            if self.bicycle:
                new_metadata += f"\n{msg_bcl}"
            if self.exclude_modes:
                new_metadata += f"\n{msg_modes % ', '.join([str(m) for m in self.exclude_modes])}"
            if self.analysis_type is AnalysisType.Lines:
                # Be sure to update this if the choicelist for the "Line Shape Type" parameter ever changes in
                # transit_script_factory.py.  There doesn't seem to be a way to not hard-code these parameter keywords.
                line_keyword = "CARTOGRAPHIC_LINES" if self.use_lve_shapes else "STRAIGHT_LINES"
                new_metadata += f"\n{msg_line_shp % line_keyword}"
            md.description += new_metadata
        md.save()

    def _set_solver_properties(self):
        """Set the NA solver object properties from the config file and tool parameters."""
        # Read properties from the solver property config file for all properties not set in the UI as parameters.
        # calculate_transit_service_frequency_od_config.py
        # calculate_transit_service_frequency_sa_config.py
        # OD properties documentation: https://pro.arcgis.com/en/pro-app/arcpy/network-analyst/odcostmatrix.htm
        # SA properties documentation: https://pro.arcgis.com/en/pro-app/latest/arcpy/network-analyst/servicearea.htm
        settings_dict = OD_SETTINGS if self.analysis_type == AnalysisType.Points else SA_SETTINGS
        for prop in settings_dict:
            if prop in ["travelMode", "timeUnits", "distanceUnits", "defaultImpedanceCutoff", "defaultImpedanceCutoffs",
                        "polygonBufferDistance", "polygonBufferDistanceUnits"]:
                # The solver config file property {prop} is handled explicitly by the tool parameters and will be
                # ignored.
                arcpy.AddIDMessage("WARNING", 30304, prop)
                continue
            try:
                setattr(self.solver_object, prop, settings_dict[prop])
            except Exception:  # pylint: disable=broad-except
                # Failed to set property {prop} from solver config file. The solver's default will be used instead.
                # Suppress this warning for older services (pre 11.0) that don't support locate settings and services
                # that don't support accumulating attributes because we don't want the tool to always throw a warning.
                if not (self.is_service and prop in [
                    "searchTolerance", "searchToleranceUnits", "accumulateAttributeNames"
                ]):
                    arcpy.AddIDMessage("WARNING", 30305, prop)

        # Set properties specified as tool parameters
        self.solver_object.travelMode = self.travel_mode
        if self.analysis_type == AnalysisType.Points:
            # OD Cost Matrix specifies a single cutoff
            self.solver_object.defaultImpedanceCutoff = self.cutoff
        else:
            # Service Area allows you to set a list of cutoffs, but we only want one.
            self.solver_object.defaultImpedanceCutoffs = [self.cutoff]
            # Set an optimal value for the Service Area polygon trim based on the user's designated cell size.
            # Polygon trim controls how far back from reachable roads the polygons are generated, though this may be
            # modified by other polygon generation rules. Since the user's designated cell size is a measure of the
            # level of precision they care about in the final answer, we should select a reasonable polygon trim value
            # consistent with this level of precision. Service Area developer Doug Sterling suggests a formula of:
            # optimal trim = cell size - (2 * internal SA grid size). The internal SA grid size is 5 meters for high
            # precision polygons, so that's what we're using here.
            # if the user specifies a ridiculously tiny cell size, just default to 5 meters to avoid errors.
            self.solver_object.polygonBufferDistance = max(self.cell_size_meters - 10, 5)
            self.solver_object.polygonBufferDistanceUnits = arcpy.nax.DistanceUnits.Meters

        # Determine which units to set representing the cutoff based on the travel mode unit type
        impedance = self.solver_object.travelMode.impedance
        time_attribute = self.solver_object.travelMode.timeAttributeName
        distance_attribute = self.solver_object.travelMode.distanceAttributeName
        if impedance == time_attribute:
            self.solver_object.timeUnits = self.cutoff_units
        elif impedance == distance_attribute:
            self.solver_object.distanceUnits = self.cutoff_units
            self.is_distance_cutoff = True
        else:
            # The impedance uses unknown units. Do not set timeUnits or distanceUnits because we aren't using them. The
            # defaultImpedanceCutoff is interpreted in the units of the travel mode's impedance attribute.
            pass

    def _load_barriers(self):
        """Load barriers for the network analysis."""
        if not self.barriers:
            return
        for barrier_fc in self.barriers:
            # Determine which barrier type to load based on its shape type.
            shape_type = arcpy.Describe(barrier_fc).shapeType
            assert shape_type in ["Point", "Polyline", "Polygon"]  # Sanity check. Tool validation should catch this.
            if shape_type == "Polygon":
                if self.analysis_type == AnalysisType.Points:
                    class_type = arcpy.nax.OriginDestinationCostMatrixInputDataType.PolygonBarriers
                else:
                    class_type = arcpy.nax.ServiceAreaInputDataType.PolygonBarriers
            elif shape_type == "Polyline":
                if self.analysis_type == AnalysisType.Points:
                    class_type = arcpy.nax.OriginDestinationCostMatrixInputDataType.LineBarriers
                else:
                    class_type = arcpy.nax.ServiceAreaInputDataType.LineBarriers
            else:  # Point
                if self.analysis_type == AnalysisType.Points:
                    class_type = arcpy.nax.OriginDestinationCostMatrixInputDataType.PointBarriers
                else:
                    class_type = arcpy.nax.ServiceAreaInputDataType.PointBarriers
            self.solver_object.load(class_type, barrier_fc)

    def _get_origin_pois(self) -> FCDATATYPE:
        """Get the POIs to use as origins in the OD Cost Matrix analysis, converting from polygons if needed.

        Returns:
            FCDATATYPE: Feature class or layer of origins to use
        """
        # By this point, the input POI feature class should have been copied to output. Use the output feature class
        # here.
        self.poi_shape_type = arcpy.Describe(self.out_fc).shapeType
        assert self.poi_shape_type in ["Point", "Polygon"]  # Sanity check. Tool validation should catch this.

        if self.poi_shape_type == "Polygon":
            # Converting polygon-based points of interest to points for use in the OD Cost Matrix analysis...
            msg = arcpy.GetIDMessage(86577)
            arcpy.AddMessage(msg)
            arcpy.SetProgressorLabel(msg)
            # Use the polygon centroids.
            temp_centroids = self._make_temporary_output_path("TempPOICentroids")
            try:
                arcpy.management.FeatureToPoint(self.out_fc, temp_centroids, "INSIDE")
            except arcpy.ExecuteError:
                # Weird geometry problems in the input polygons can cause Feature To Point to fail. The user should run
                # Repair Geometry and try again. Originally I always ran the Repair Geometry tool here just to be on the
                # safe side, but it was a substantial performance hit for large datasets. Let's just put the onus on the
                # user to run it if they need to, and those that don't need to will never have to suffer the performance
                # hit.
                # Failed to convert polygon-based points of interest to points for use in the OD Cost Matrix analysis.
                arcpy.AddIDMessage("ERROR", 240009)
                # Raising this special error class will pipe through the errors from the Feature To Point tool with
                # their correct error codes.
                raise gtfs_utils.GPError()
            return temp_centroids

        # The POIs are points, so use them directly.
        return self.out_fc

    @staticmethod
    def get_oid_ranges_for_input(input_fc: FCDATATYPE, max_chunk_size: int) -> List:
        """Construct ranges of ObjectIDs for use in where clauses to split large data into chunks.

        Args:
            input_fc (FCDATATYPE): Dataset that needs to be split into chunks
            max_chunk_size (int): Maximum number of rows that can be in a chunk

        Returns:
            list: list of ObjectID ranges for the current dataset representing each chunk. For example,
                [[1, 1000], [1001, 2000], [2001, 2478]] represents three chunks of no more than 1000 rows.
        """
        ranges = []
        num_in_range = 0
        current_range = [0, 0]
        # Loop through all OIDs of the input and construct tuples of min and max OID for each chunk
        # We do it this way and not by straight-up looking at the numerical values of OIDs to account
        # for definition queries, selection sets, or feature layers with gaps in OIDs
        for row in arcpy.da.SearchCursor(input_fc, "OID@"):  # pylint: disable=no-member
            oid = row[0]
            if num_in_range == 0:
                # Starting new range
                current_range[0] = oid
            # Increase the count of items in this range and set the top end of the range to the current oid
            num_in_range += 1
            current_range[1] = oid
            if num_in_range == max_chunk_size:
                # Finishing up a chunk
                ranges.append(current_range)
                # Reset range trackers
                num_in_range = 0
                current_range = [0, 0]
        # After looping, close out the last range if we still have one open
        if current_range != [0, 0]:
            ranges.append(current_range)

        return ranges

    def _select_origins_and_destinations(
        self, in_origins: FCDATATYPE, in_destinations: FCDATATYPE, origins_where="", dests_where=""
    ) -> Tuple[arcpy._mp.Layer, arcpy._mp.Layer]:
        """Select origins and destinations using a where clause (for chunks) and/or a quick straight-line selection.

        When chunking the OD Cost Matrix analysis, the where clauses can serve to subset features using OID ranges.
        When possible, we also can do a quick straight-line selection to eliminate irrelevant origins and destinations.

        Args:
            in_origins (FCDATATYPE): Feature class or layer of origins
            in_destinations (FCDATATYPE): Feature class or layer of destinations
            origins_where (str, optional): Where clause for subsetting origins, typically by OID. Defaults to "".
            dests_where (str, optional): Where clause for subsetting destinations, typically by OID. Defaults to "".

        Returns:
            Tuple[arcpy._mp.Layer, arcpy._mp.Layer]: Origins and Destinations layer subsetted appropriately
        """
        # Create layers using where clauses to subset origins and destinations, typically by OID ranges
        unique_name = uuid.uuid4().hex  # Make sure the layer names are unique
        origins = f"O_{unique_name}"
        origins_layer_obj = arcpy.management.MakeFeatureLayer(in_origins, origins, origins_where).getOutput(0)
        destinations = f"D_{unique_name}"
        destinations_layer_obj = arcpy.management.MakeFeatureLayer(
            in_destinations, destinations, dests_where).getOutput(0)

        # If using a distance-based cutoff, do a quick straight-line selection to eliminate some irrelevant points of
        # interest and transit stops before calling the OD Cost Matrix. This cuts down on the number of inputs we have
        # to pass in that will never be relevant to the solution. It also saves credits for the user if they're using
        # the AGOL services. The network distance is always >= the network distance, so we can safely eliminate points
        # that fall outside of a straight-line buffer.
        if self.is_distance_cutoff:
            # Use 5% margin on the buffer size to be on the safe side
            buffer_size = f"{self.cutoff + (0.05 * self.cutoff)} {self.cutoff_units.name}"
            origins_layer_obj = arcpy.management.SelectLayerByLocation(
                origins, "WITHIN_A_DISTANCE_GEODESIC", destinations, buffer_size).getOutput(0)
            destinations_layer_obj = arcpy.management.SelectLayerByLocation(
                destinations, "WITHIN_A_DISTANCE_GEODESIC", origins, buffer_size).getOutput(0)

        # It's possible that no origins or destinations may be selected. This situation must be handled outside this
        # method by the caller.
        return origins_layer_obj, destinations_layer_obj

    def _solve_od(
        self, origins: FCDATATYPE, destinations: FCDATATYPE, origins_where="", dests_where="", do_preselection=True
    ):
        """Load origins and destinations, solve the OD Cost Matrix, and read the results into a dataframe.

        The origins and destinations can optionally be preselected using where clauses and a simple straight-line
        preselection.

        Args:
            origins (FCDATATYPE): Feature class or layer of origins
            destinations (FCDATATYPE): Feature class or layer of destinations
            origins_where (str, optional): Where clause for subsetting origins, typically by OID. Defaults to "".
            dests_where (str, optional): Where clause for subsetting destinations, typically by OID. Defaults to "".
            do_preselection (bool, optional): Whether to do preselection by where clause, straight-line distance, or
                both. Defaults to True.
        """
        if do_preselection:
            origins, destinations = self._select_origins_and_destinations(
                origins, destinations, origins_where, dests_where)
            # If no origins were selected, there are no transit stops within range. We can skip the solve.
            if not origins.getSelectionSet():
                return
            # If no destinations were selected, there are no transit stops within range. We can skip the solve.
            # This probably won't happen because origins won't have a selection set either, but check just in case.
            if not destinations.getSelectionSet():
                return

        # Load the inputs
        self.solver_object.load(arcpy.nax.OriginDestinationCostMatrixInputDataType.Origins, origins, append=False)
        self.solver_object.load(
            arcpy.nax.OriginDestinationCostMatrixInputDataType.Destinations, destinations, append=False)

        # Solve the analysis
        result = self.solver_object.solve()
        if not result.solveSucceeded:
            # Check if the solve failed because no destinations were found for any origins. This particular solve
            # failure is a valid result, and it is particularly common if we're doing chunking. In this special
            # case, don't error out. If the solve fails for some other reason, go ahead and raise errors.
            # Special case error to look for (local solves): [30212, 'Solve did not find a solution.']
            # Special case error to look for (services solves): [0, 'ERROR 030212: Solve did not find a solution.']
            errors = result.solverMessages(arcpy.nax.MessageSeverity.Error)
            if 30212 not in [err[0] for err in errors] and not any("030212" in err[1] for err in errors):
                for msg in result.solverMessages(arcpy.nax.MessageSeverity.Warning):
                    arcpy.AddWarning(msg[1])
                for msg in errors:
                    arcpy.AddError(msg[1])
                # Could not find public transit stops within range of points of interest because the OD Cost Matrix
                # solve failed.
                raise gtfs_utils.Error(240006)

            # No solution for this chunk. Don't try to read results. Just return.
            return

        # Read in a dataframe holding the POI OID and the OID of each stop reachable from it within the cutoff.
        with result.searchCursor(
            arcpy.nax.OriginDestinationCostMatrixOutputDataType.Lines, ["OriginOID", "DestinationOID"]
        ) as poi_cur:
            result_df = pd.DataFrame(poi_cur, columns=[self.poi_id_field, "StopOID"], dtype=int)
        if self.poi_df is None or self.poi_df.empty:
            self.poi_df = result_df
        else:
            self.poi_df = pd.concat([self.poi_df, result_df])
        del result_df
        # poi_df status:
        # Columns: POI_ID, StopOID

    def _get_stops_for_pois(self):
        """Identify the stops associated with each point of interest by solving an OD Cost Matrix."""
        # Create the OD solver object
        self.solver_object = arcpy.nax.OriginDestinationCostMatrix(self.network)

        # Set the desired solver properties
        self._set_solver_properties()
        # Load barriers
        self._load_barriers()

        # Get the correct origins to use. If points of interest were actually polygons, this will give us the centroids.
        origins_to_use = self._get_origin_pois()

        # If relevant, filter out wheelchair inaccessible stops
        if self.wheelchair and self.transit_dm.stops_has_gwheelchairboarding:
            destinations = "StopsWChair"
            where = "GWheelchairBoarding <> 2 OR GWheelchairBoarding IS NULL"
            arcpy.management.MakeFeatureLayer(self.transit_dm.stops, destinations, where)
            if int(arcpy.management.GetCount(destinations).getOutput(0)) <= 0:
                # No stops are wheelchair accessible (unlikely case)
                # Set an empty dataframe. This will be handled later.
                self.poi_df = pd.DataFrame(columns=[self.poi_id_field, "StopOID"], dtype=int)
                return
        else:
            destinations = self.transit_dm.stops

        # Attempt to filter out irrelevant origins and destinations with a quick straight-line selection if possible
        if self.is_distance_cutoff:
            # Reducing OD Cost Matrix problem size by filtering input locations using a straight-line distance
            # selection...
            msg = arcpy.GetIDMessage(86579)
            arcpy.AddMessage(msg)
            arcpy.SetProgressorLabel(msg)
            origins, destinations = self._select_origins_and_destinations(origins_to_use, destinations)
            # If no origins were selected, there are no transit stops within range.
            if not origins.getSelectionSet():
                # Set an empty dataframe. This will be handled later.
                self.poi_df = pd.DataFrame(columns=[self.poi_id_field, "StopOID"], dtype=int)
                return
            # If no destinations were selected, there are no transit stops within range.
            # (This case shouldn't happen because the earlier check for selected origins would have caught it.)
            if not destinations.getSelectionSet():
                # Set an empty dataframe. This will be handled later.
                self.poi_df = pd.DataFrame(columns=[self.poi_id_field, "StopOID"], dtype=int)
                return
        else:
            origins = origins_to_use

        # Determine if there is a maximum number of origins and destinations and what the limit is
        max_origins, max_destinations = self._get_max_origins_and_destinations()
        # Determine if we need to split the transit stops into multiple chunks.
        num_total_origins = int(arcpy.management.GetCount(origins).getOutput(0))
        num_total_dests = int(arcpy.management.GetCount(destinations).getOutput(0))
        if (max_origins is not None and max_origins < num_total_origins) or \
                (max_destinations is not None and max_destinations < num_total_dests):
            # We have to do chunking. Split the origins and destinations up into OID ranges and solve each chunk of
            # origins against each chunk of destinations. Note that for the most efficient solves, both origins and
            # destinations should be spatially sorted. This tool doesn't do that, but the doc should instruct the user
            # to do so in advance for best results.
            origins_oid = arcpy.Describe(origins).oidFieldName
            origin_ranges = self.get_oid_ranges_for_input(origins, max_origins)
            destinations_oid = arcpy.Describe(destinations).oidFieldName
            destination_ranges = self.get_oid_ranges_for_input(destinations, max_destinations)
            chunk_ranges = product(origin_ranges, destination_ranges)
            # Solving OD Cost Matrix analysis chunk %1 of %2...
            msg = arcpy.GetIDMessage(86576)
            num_chunks = len(origin_ranges) * len(destination_ranges)
            arcpy.SetProgressor("step", None, 0, num_chunks, 1)
            for idx, oid_range in enumerate(chunk_ranges):
                msg_to_print = msg % (idx + 1, num_chunks)
                arcpy.AddMessage(msg_to_print)
                arcpy.SetProgressorLabel(msg_to_print)
                origins_where = (
                    f"{origins_oid} >= {oid_range[0][0]} "
                    f"And {origins_oid} <= {oid_range[0][1]}"
                )
                dests_where = (
                    f"{destinations_oid} >= {oid_range[1][0]} "
                    f"And {destinations_oid} <= {oid_range[1][1]}"
                )
                self._solve_od(origins, destinations, origins_where, dests_where)
                arcpy.SetProgressorPosition(idx + 1)
            arcpy.ResetProgressor()

        else:
            # Solve the whole problem in one chunk. Do not preselect origins and destinations since we already did that
            # with our initial check.
            # Solving OD Cost Matrix analysis...
            msg = arcpy.GetIDMessage(86575)
            arcpy.AddMessage(msg)
            arcpy.SetProgressorLabel(msg)
            self._solve_od(origins, destinations, do_preselection=False)

        # If the dataframe doesn't exist or is empty at this point, then all the solves failed to find any
        # destinations for each origin, so essentially no stops are in range of any point of interest. Set an empty
        # dataframe. This will be handled later.
        if self.poi_df is None or self.poi_df.empty:
            self.poi_df = pd.DataFrame(columns=[self.poi_id_field, "StopOID"], dtype=int)
            return

        # Post-processing the OD Cost Matrix results to identify the public transit stops accessible to each point of
        # interest...
        msg = arcpy.GetIDMessage(86578)
        arcpy.AddMessage(msg)
        arcpy.SetProgressorLabel(msg)

        # Read in original Stops table to link Stop OID to Stop ID
        with arcpy.da.SearchCursor(self.transit_dm.stops, ["OID@", "ID"]) as cur_s:  # pylint: disable=no-member
            s_df = pd.DataFrame(cur_s, columns=["OID", "StopID"])
        s_df.set_index("OID", inplace=True)
        self.poi_df = self.poi_df.join(s_df, "StopOID")
        del s_df
        self.poi_df.drop("StopOID", axis="columns", inplace=True)
        # poi_df status:
        # Columns: POI_ID, StopID

        if origins_to_use != self.out_fc:
            # We converted the POI fc from polygons to points to use in the OD cost matrix using FeatureToPoint. The
            # OriginOID field refers to the ObjectID of the points, not necessarily the output polygon feature class.
            # Do another join to get the correct values here.
            with arcpy.da.SearchCursor(origins_to_use, ["OID@", "ORIG_FID"]) as cur_o:  # pylint: disable=no-member
                o_df = pd.DataFrame(cur_o, columns=["OID", "ORIG_FID"])
            o_df.set_index("OID", inplace=True)
            self.poi_df = self.poi_df.join(o_df, self.poi_id_field)
            del o_df
            self.poi_df.drop(self.poi_id_field, axis="columns", inplace=True)
            self.poi_df.rename(columns={"ORIG_FID": self.poi_id_field}, inplace=True)

    def _get_stops_for_areas(self):
        """Create polygons representing the area accessible from transit stops; list stops accessible to each polygon.

        Generate Network Analyst Service Area polygons around all transit stops in the system. Post-process these
        polygons into an easier-to-use raster-like grid of polygons, and determine which transit stops provide service
        to each grid cell so that we can calculate transit service frequency statistics for each.
        """
        # Calculating area within range of public transit stops...
        msg = arcpy.GetIDMessage(86562)
        arcpy.AddMessage(msg)
        arcpy.SetProgressorLabel(msg)
        sa_polygons = self._make_service_area_polygons()
        # Post-processing areas...
        msg = arcpy.GetIDMessage(86564)
        arcpy.AddMessage(msg)
        arcpy.SetProgressorLabel(msg)
        self._post_process_service_areas(sa_polygons)

    def _get_max_facilities(self) -> Optional[float]:
        """Get the maximum allowed facilities for Service Area solves using services.

        Returns:
            Optional[float]: Max facilities allowed in a single Service Area solve. None if there is no limit.
        """
        # Use global limit for local solves.
        if not self.is_service:
            return MAX_FACILITIES

        # If using a service, get the particular limits of that service.
        # At the time of this writing, the ArcGIS Online Service Area service limit for the number of facilities
        # is 1000.
        limits = arcpy.nax.GetWebToolInfo("asyncServiceArea", "GenerateServiceAreas", self.network)["serviceLimits"]
        return limits["maximumFacilities"]

    def _get_max_origins_and_destinations(self) -> Tuple[Optional[float], Optional[float]]:
        """Get the maximum allowed origins and destinations for OD Cost Matrix solves using services.

        Returns:
            Optional[Tuple[float, float]]: Max origins and destinations allowed in a single OD Cost Matrix solve. None
                if there is no limit.
        """
        # Use global limit for local solves.
        if not self.is_service:
            return MAX_ORIGINS, MAX_DESTINATIONS

        # If using a service, get the particular limits of that service.
        # At the time of this writing, the ArcGIS Online OD Cost Matrix service limit for the number of origins and
        # destinations is 1000 of each.
        limits = arcpy.nax.GetWebToolInfo(
            "asyncODCostMatrix", "GenerateOriginDestinationCostMatrix", self.network)["serviceLimits"]
        return limits["maximumOrigins"], limits["maximumDestinations"]

    def _solve_sa(self, where: str = "") -> str:
        """Load facilities with optional where clause and solve the Service Area.

        Returns:
            [str]: Catalog path to the Service Area polygons feature class generated by this solve.
        """
        facilities = self.transit_dm.stops
        if where:
            facilities = "TempFacilitiesLayer"
            arcpy.management.MakeFeatureLayer(self.transit_dm.stops, facilities, where)

        # Use field mappings to pass the ID field through to the output.
        id_field = [f for f in arcpy.ListFields(facilities) if f.name == "ID"]
        assert id_field
        field_mappings = self.solver_object.fieldMappings(
            arcpy.nax.ServiceAreaInputDataType.Facilities,
            list_candidate_fields=id_field)
        self.solver_object.load(arcpy.nax.ServiceAreaInputDataType.Facilities, facilities, field_mappings, append=False)

        # Solve the analysis
        result = self.solver_object.solve()
        if not result.solveSucceeded:
            for msg in result.solverMessages(arcpy.nax.MessageSeverity.Warning):
                arcpy.AddWarning(msg[1])
            for msg in result.solverMessages(arcpy.nax.MessageSeverity.Error):
                arcpy.AddError(msg[1])
            # Could not calculate the area within range of public transit stops because the Service Area solve
            # failed.
            raise gtfs_utils.Error(240007)

        # Save the Service Area polygons to a temporary feature class
        out_sa_polys = self._make_temporary_output_path("SAPolys")
        result.export(arcpy.nax.ServiceAreaOutputDataType.Polygons, out_sa_polys)

        return out_sa_polys

    def _make_service_area_polygons(self) -> str:
        """Generate Service Area polygons around transit stops.

        Returns:
            str: Catalog path to the resulting Service Area polygon feature class
        """
        # Create the SA solver object
        self.solver_object = arcpy.nax.ServiceArea(self.network)
        # Set the desired solver properties
        self._set_solver_properties()
        # Load barriers
        self._load_barriers()

        # Load facilities and solve the analysis. Do this in chunks if needed.
        out_sa_polys = []
        # Determine if there is a maximum number of facilities and what the limit is
        max_facilities = self._get_max_facilities()
        # Determine if we need to split the transit stops into multiple chunks.
        num_total_stops = int(arcpy.management.GetCount(self.transit_dm.stops).getOutput(0))
        if max_facilities is not None and max_facilities < num_total_stops:
            # We have to do chunking
            stops_oid = arcpy.Describe(self.transit_dm.stops).oidFieldName
            chunk_ranges = self.get_oid_ranges_for_input(self.transit_dm.stops, max_facilities)
            # Solving Service Area analysis chunk %1 of %2...
            msg = arcpy.GetIDMessage(86571)
            num_chunks = len(chunk_ranges)
            arcpy.SetProgressor("step", None, 0, num_chunks, 1)
            for idx, oid_range in enumerate(chunk_ranges):
                msg_to_print = msg % (idx + 1, num_chunks)
                arcpy.AddMessage(msg_to_print)
                arcpy.SetProgressorLabel(msg_to_print)
                where = (
                    f"{stops_oid} >= {oid_range[0]} "
                    f"And {stops_oid} <= {oid_range[1]}"
                )
                out_sa_polys.append(self._solve_sa(where))
                arcpy.SetProgressorPosition(idx + 1)
            arcpy.ResetProgressor()
        else:
            # Solve all in one chunk
            # Solving Service Area analysis...
            msg = arcpy.GetIDMessage(86570)
            arcpy.AddMessage(msg)
            arcpy.SetProgressorLabel(msg)
            out_sa_polys.append(self._solve_sa())

        # All results were in one chunk. Just return it.
        if len(out_sa_polys) == 1:
            return out_sa_polys[0]

        # Otherwise, merge the output polygon feature classes into one and return the combined results.
        # Merging Service Area analysis results...
        msg = arcpy.GetIDMessage(86572)
        arcpy.AddMessage(msg)
        arcpy.SetProgressorLabel(msg)
        out_merged_polys = self._make_temporary_output_path("MergedSAPolys")
        arcpy.management.Merge(out_sa_polys, out_merged_polys)
        return out_merged_polys

    def _post_process_service_areas(self, sa_polygons):  # pylint: disable=too-many-locals
        """Post-process the Service Area polygons to generate the final output feature class and stops dataframe.

        The raw Service Area polygons are typically complex and overlapping. The area reachable within a 10-minute walk
        of two adjacent stops may overlap in the middle. Or, two nearby stops serving different lines may be reachable
        from the same area within a short walk. Thus, any given point of space will have access to a specific set of
        stops within the designated cutoff, and we want to map this surface.

        However, the geometry of these overlapping polygons is typically overly complex. Simply overlapping them and
        "flattening" them such that each polygon represents a unique collection of stops creates a very large number
        of small polygons in tiny sliver shapes that aren't useful and take a long time to render. Additionally, since
        Service Area polygon generation is more of an art form than a precise answer, the tiny slivers and jagged
        boundaries should not be considered terribly meaningful.

        Instead of handling all these slivers, we instead take a rasterization and sample approach. We convert the
        Service Area polygons to a raster with a certain cell size and use the cell centroids to sample the Service Area
        polygons overlapping that location. For each cell, we take the set of stops associated with the Service Areas
        polygons intersecting the cell centroid and calculate the transit frequency statistics for those stops. Because
        we care about multiple statistics, the output is not a raster but instead a feature class of cell-like polygons.
        """
        # Post-process the Service Area polygons into our final rasterized polygon output feature class. The process is
        # complicated and goes like this:
        # - Convert Service Area polygons to a temporary raster with the desired cell size
        # - Create a point feature class representing the centroid of each raster cell
        # - Create a new raster with the same cell size based off the centroid points using the OIDs of those points as
        #   the cell value
        # - Create a polygon feature class from the raster. Since each cell had a unique value, we now get one polygon
        #   per raster cell.
        # - Spatial join the raster cell centroid points back to the original Service Area polygons. Doing a One to Many
        #   join creates a copy of each point for each Service Area polygon it intersects. Create a dataframe from this
        #   linking the output polygon ID with the transit stop IDs it has access to.
        # The process above is somewhat convoluted. It would be more straightforward to use the Generate Tessellations
        # tool. However, this tool has proven to be unusably slow when generating tessellations of a fairly small size
        # over a metropolitan-sized area. The Create Fishnet tool could also be used and runs reasonably efficiently.
        # However, this tool creates polygons covering the entire extent of the template feature class (in this case,
        # Service Area polygons), even though often most of that area is empty space. We would end up deleting 80% of
        # the polygons created, and we risk potentially hitting resource limits trying to create something that big.
        # The Feature To Raster method described above, while more complicated, more cleanly creates the polygon cells
        # only in the area covered by the original Service Area polygons. This very substantially reduces the number of
        # polygons we have to work with and is not really slower than the Create Fishnet tool.
        # This process was partly developed by David Wasserman of Fehr & Peers for use in the open source Create Percent
        # Access Polygons tool (part of the Transit Network Analysis Tools toolbox) in collaboration with
        # Melinda Morang/Esri under an Apache 2.0 license.
        # https://github.com/Esri/public-transit-tools/tree/master/transit-network-analysis-tools

        try:

            # Project to World Cylindrical Equal Area (WKID 54034), which preserves area reasonably well worldwide and
            # has units of meters
            sr_world_cylindrical = arcpy.SpatialReference(54034)
            out_sa_polys_projected = self._make_temporary_output_path("SAPolys_Projected")
            arcpy.management.Project(sa_polygons, out_sa_polys_projected, sr_world_cylindrical)

            # Converting Service Area polygons into cells...
            # Reset the progressor here because the Project tool above hijacks it and converts it to a step progressor.
            arcpy.ResetProgressor()
            msg = arcpy.GetIDMessage(86573)
            arcpy.AddMessage(msg)
            arcpy.SetProgressorLabel(msg)

            # Convert service area polygons into a temporary raster. The cell values are irrelevant.
            poly_oid = arcpy.Describe(out_sa_polys_projected).OIDFieldName
            temp_raster = self._make_temporary_output_path("SAPolys_Raster")
            arcpy.conversion.FeatureToRaster(
                out_sa_polys_projected, poly_oid, temp_raster, cell_size=self.cell_size_meters)

            # Create a temporary point dataset with one point for the centroid of every raster cell
            # The value of the points is irrelevant. We just need their geometry and an OID.
            temp_points = self._make_temporary_output_path("RasterCellPoints")
            arcpy.conversion.RasterToPoint(temp_raster, temp_points)

            # Create a new raster from the points with the same cell size as the initial raster. Set the value of each
            # cell equal to the value of the OID of the point it was created from. This way, each cell has a unique
            # value.
            pt_oid = arcpy.Describe(temp_points).OIDFieldName
            temp_raster2 = self._make_temporary_output_path("UniqueValueRaster")
            arcpy.conversion.FeatureToRaster(temp_points, pt_oid, temp_raster2, cell_size=self.cell_size_meters)

            # Convert this raster to polygons. The result contains one square polygon per raster cell and can be used
            # for calculating spatial joins with the original time lapse polygon dataset.
            # This will be the final output feature class.
            # First determine if we'll need to project the output to a different spatial reference
            output_sr = spatial_reference_helper.determine_output_spatial_ref(
                os.path.dirname(self.out_fc), sr_world_cylindrical
            )
            if output_sr.factoryCode != sr_world_cylindrical.factoryCode:
                temp_raster3 = self._make_temporary_output_path("UnqValRstr_Projected")
                arcpy.management.Project(temp_raster2, temp_raster3, output_sr)
                temp_raster2 = temp_raster3
            # Convert the raster to polygons
            arcpy.conversion.RasterToPolygon(temp_raster2, self.out_fc, simplify=False)

            # Identifying public transit stops accessible to each cell...
            msg = arcpy.GetIDMessage(86574)
            arcpy.AddMessage(msg)
            arcpy.SetProgressorLabel(msg)

            # Spatial join raster cell centroids back to original SA polygons. Doing One to Many will create a copy of
            # each point for each SA polygon that overlaps it. This is the thing we use to create a table to pass
            # through to calculating transit frequency stats.
            temp_spatial_join_fc = self._make_temporary_output_path("StackedPoints")
            field_mappings = arcpy.FieldMappings()
            # Add the OrigOID field to the output using field mapping
            field = [f for f in arcpy.ListFields(out_sa_polys_projected) if f.name == "ID"][0]
            new_fm = arcpy.FieldMap()
            new_fm.outputField = field
            new_fm.addInputField(out_sa_polys_projected, "ID")
            field_mappings.addFieldMap(new_fm)
            arcpy.analysis.SpatialJoin(
                temp_points,
                out_sa_polys_projected,
                temp_spatial_join_fc,
                "JOIN_ONE_TO_MANY",
                "KEEP_COMMON",
                field_mappings,
                match_option="INTERSECT"
            )

        except arcpy.ExecuteError:
            # Catch any errors from GP tools and pass them through cleanly so we don't get a nasty traceback.
            # Any number of odd geometry errors could occur here.
            raise gtfs_utils.GPError()

        # Create a dataframe linking the ObjectIDs of the output polygon cells with the stop IDs accessible to them
        with arcpy.da.SearchCursor(temp_spatial_join_fc, ["TARGET_FID", "ID"]) as cur_s:  # pylint: disable=no-member
            self.poi_df = pd.DataFrame(cur_s, columns=["POI_ID", "StopID"])
            # poi_df status:
            # Columns: POI_ID, StopID

        # Add the number of stops in range to the output
        self._add_stop_count_to_poi_output()

    def _add_stop_count_to_poi_output(self):
        """Add a field representing the number of stops in range of each POI or area to the output."""
        assert self.poi_id_field in self.poi_df.columns  # Sanity check. Should never fail.
        num_stops_field = "NumStops"
        counts = self.poi_df[self.poi_id_field].value_counts(sort=False)

        # Add a field for NumStops and populate it based on the counts
        arcpy.management.AddField(self.out_fc, num_stops_field, "SHORT")
        with arcpy.da.UpdateCursor(self.out_fc, ["OID@", num_stops_field]) as cur:  # pylint: disable=no-member
            for row in cur:
                oid = row[0]
                try:
                    new_row = [oid, counts.at[oid]]
                except KeyError:
                    # If the feature wasn't even in the dataframe, no stops were in range. Fill this with 0.
                    new_row = [oid, 0]
                cur.updateRow(new_row)

    def _copy_stops_to_output(self):  # pylint: disable=too-many-locals
        """Copy the transit data model's Stops to the output feature class location."""
        # Determine the desired output spatial reference and whether a geographic transformation is needed
        desc_stops = arcpy.Describe(self.transit_dm.stops)
        output_sr = spatial_reference_helper.determine_output_spatial_ref(
            os.path.dirname(self.out_fc), desc_stops.spatialReference
        )
        transformation = spatial_reference_helper.get_datum_transformation(
            desc_stops.spatialReference, output_sr, desc_stops.extent
        )

        # Make a list of any of the output fields that already exist in the data.
        # Use field mapping to remove any existing output fields if needed. This case will be rare since the
        # Stops table comes from the transit data model.
        existing_output_fields = [of for of in self.output_fields if of in
                                  [f.name for f in arcpy.ListFields(self.transit_dm.stops)]]
        field_mappings = None
        if existing_output_fields:
            field_mappings = arcpy.FieldMappings()
            field_mappings.addTable(self.transit_dm.stops)
            for field in existing_output_fields:
                fm_idx = field_mappings.findFieldMapIndex(field)
                if fm_idx > -1:
                    field_mappings.removeFieldMap(fm_idx)

        # Copy the transit data model Stops to the output feature class
        if not self.separate_lines:
            # This is the simple case. We don't worry about making unique copies of each stop for each line it serves.
            # Just copy them straight from the transit data model to output as is.
            with arcpy.EnvManager(
                outputCoordinateSystem=output_sr,
                geographicTransformations=transformation
            ):
                arcpy.conversion.ExportFeatures(
                    self.transit_dm.stops,
                    self.out_fc,
                    field_mapping=field_mappings  # Used to eliminate existing output fields
                )

        else:
            # If the user wants to keep the results separated by Line, we have to make a copy of each stop for each
            # line it serves, since lines often share stops. We will also make a copy for each GDirectionID, since, in
            # rare cases, the same stop may serve the same line going in different directions, and users care about
            # this distinction.

            # Create a dataframe of LineVariantElements so we can track the Stop ID fields and the lines they serve
            fields = ["FromStopID", "ToStopID", "LineVarID"]
            with arcpy.da.SearchCursor(  # pylint: disable=no-member
                self.transit_dm.line_variant_elements, fields
            ) as cur_lve:
                lve_df = pd.DataFrame(cur_lve, columns=fields, dtype=int)

            # Read in LineVariants to get the relationship between LineVarID and Line ID, and join this
            # into our LineVariantElements table.
            in_fields = ["ID", "LineID"]
            out_columns = ["LineVarID", "LineID"]
            if self.use_gdirectionid:
                in_fields.append("GDirectionID")
                out_columns.append("GDirectionID")
            with arcpy.da.SearchCursor(  # pylint: disable=no-member
                self.transit_dm.line_variants, in_fields
            ) as cur_lv:
                lv_df = pd.DataFrame(cur_lv, columns=out_columns)
            lv_df.set_index("LineVarID", inplace=True)
            lve_df = lve_df.join(lv_df, "LineVarID", "inner")
            del lv_df
            lve_df.drop(["LineVarID"], axis="columns", inplace=True)
            lve_df.drop_duplicates(inplace=True)
            # lve_df status:
            # Columns: FromStopID, ToStopID, LineID, GDirectionID (optional)

            # At this point, we want to remove the distinction between FromStopID and ToStopID and just pay attention
            # to Stop ID generally.
            from_stop_line_df = lve_df.drop(["ToStopID"], axis="columns")
            from_stop_line_df.rename(columns={"FromStopID": "StopID"}, inplace=True)
            to_stop_line_df = lve_df.drop(["FromStopID"], axis="columns")
            to_stop_line_df.rename(columns={"ToStopID": "StopID"}, inplace=True)
            del lve_df
            stop_line_df = pd.concat([from_stop_line_df, to_stop_line_df])
            # stop_line_df status:
            # Columns: StopID, LineID, GDirectionID (optional)

            # Drop duplicates where the same stop serves the same line in multiple ways
            stop_line_df.drop_duplicates(inplace=True)
            # stop_line_df status:
            # Columns: StopID, LineID, GDirectionID (optional)

            # Turn this into a temporary table we can use for joining
            temp_stop_line_table = self._make_temporary_output_path("TempStopLines")
            arcpy.management.CreateTable(os.path.dirname(temp_stop_line_table), os.path.basename(temp_stop_line_table))
            field_defs = [["StopID", "LONG"], ["LineID", "LONG"]]
            if self.use_gdirectionid:
                field_defs.append(["GDirectionID", "SHORT"])
            arcpy.management.AddFields(temp_stop_line_table, field_defs)
            with arcpy.da.InsertCursor(  # pylint: disable=no-member
                temp_stop_line_table, [f[0] for f in field_defs]
            ) as cur:
                for row in stop_line_df.iterrows():
                    cur.insertRow(row[1].to_list())

            # Make a temporary copy of the transit data model Stops to use for joining. If we don't do this, we cannot
            # do a one-to-many join if the Stops feature class participates in a network dataset. The network dataset
            # is a controller object and prevents the join from making multiple copies of stops the way we want.
            temp_stops = self._make_temporary_output_path("TempStops")
            arcpy.conversion.ExportFeatures(
                self.transit_dm.stops,
                temp_stops,
                field_mapping=field_mappings  # Used to eliminate existing output fields
            )

            # Join the LineID to the Stops.
            # Make a feature layer of the copied Stops so we can do the join
            layer = "StopsLayer"
            arcpy.management.MakeFeatureLayer(temp_stops, layer)
            # Join the table. The "KEEP_ALL" method ensures that copies of the stops will be made for each entry in the
            # joined table, which is what we want.
            arcpy.management.AddJoin(layer, "ID", temp_stop_line_table, "StopID", "KEEP_ALL")

            # Copy the joined feature layer with the duplicated stops to the final output feature class
            with arcpy.EnvManager(
                qualifiedFieldNames=False,
                outputCoordinateSystem=output_sr,
                geographicTransformations=transformation
            ):
                # Use field mapping to remove the undesired/extra fields from the output
                field_mappings = arcpy.FieldMappings()
                field_mappings.addTable(layer)
                for field in ["OBJECTID", "StopID", "index"]:
                    fm_idx = field_mappings.findFieldMapIndex(field)
                    if fm_idx > -1:
                        field_mappings.removeFieldMap(fm_idx)
                # Copy the feature layer to output
                arcpy.conversion.ExportFeatures(
                    layer,
                    self.out_fc,
                    field_mapping=field_mappings
                )

            # Read the output Stops into a dataframe to use for joins later
            in_fields = ["OID@", "ID", "LineID"]
            out_columns = [self.poi_id_field, self.tracked_id_field, "LineID"]
            index_columns = [self.tracked_id_field, "LineID"]
            if self.use_gdirectionid:
                in_fields.append("GDirectionID")
                out_columns.append("GDirectionID")
                index_columns.append("GDirectionID")
            with arcpy.da.SearchCursor(self.out_fc, in_fields) as cur:  # pylint: disable=no-member
                self.separated_stops_df = pd.DataFrame(cur, columns=out_columns)
            if self.use_gdirectionid:
                # Convert the GDirectionID field to text because it can sometimes have null values, and the
                # joins later on do not work properly with nan values
                self.separated_stops_df = self.separated_stops_df.astype({"GDirectionID": str})
            self.separated_stops_df.set_index(index_columns, inplace=True)
            # self.separated_stops_df status:
            # Columns: POI ID, TrackedID, LineID, GDirectionID (optional)
            # Indexed by TrackedID, LineID, GDirectionID (optional)

    def _copy_lves_to_output(self):
        """Copy the transit data model's LineVariantElements to the output feature class location."""
        # Determine the desired output spatial reference and whether a geographic transformation is needed
        desc_lves = arcpy.Describe(self.transit_dm.line_variant_elements)
        output_sr = spatial_reference_helper.determine_output_spatial_ref(
            os.path.dirname(self.out_fc), desc_lves.spatialReference
        )
        transformation = spatial_reference_helper.get_datum_transformation(
            desc_lves.spatialReference, output_sr, desc_lves.extent
        )

        # If relevant, cache LVEShapes so we can use these in the output instead of LineVariantElements
        lve_shape_geom = {}  # {ID: Shape}
        if self.use_lve_shapes:
            # Retrieve the LVEShapes geometries using the output spatial reference
            duplicate_lve_shape_ids = False
            null_lve_shape_ids = False
            for row in arcpy.da.SearchCursor(  # pylint: disable=no-member
                self.transit_dm.lve_shapes,
                ["ID", "SHAPE@"],
                spatial_reference=output_sr,
                datum_transformation=transformation
            ):
                lve_shape_id = row[0]
                if lve_shape_id is None:
                    # If a record has a null ID field value, skip it.  This is a data error, but we don't need to fail
                    # the tool unless all the values are null.  Just set a flag so we can raise a warning.
                    null_lve_shape_ids = True
                    continue
                if lve_shape_id in lve_shape_geom:
                    # If multiple records have the same ID value, keep only the first one and set a flag to raise a
                    # warning.  This is a data error, but we don't need to fail the tool.
                    duplicate_lve_shape_ids = True
                    continue
                lve_shape_geom[row[0]] = row[1]
            if duplicate_lve_shape_ids:
                # The public transit data model's LVEShapes feature class includes multiple records with the same ID
                # field value.
                arcpy.AddIDMessage("WARNING", 240027)
            if null_lve_shape_ids:
                if not lve_shape_geom:
                    # Cannot use cartographic shapes for the output because the ID field in the public transit data
                    # model's LVEShapes feature class has all null values.
                    raise gtfs_utils.Error(240028)
                # The public transit data model's LVEShapes feature class includes one or more records with null values
                # in the ID field.
                arcpy.AddIDMessage("WARNING", 240029)

        # Copy the transit data model LineVariantElements to the output feature class
        invalid_lve_shape_ids = False
        if not self.separate_lines:
            # By default, the transit data model's LineVariantElements feature class separates the features by Line ID.
            # If multiple lines serve the same stop-stop connection, there will be multiple LineVariantElements stacked
            # on top of each other. If the user wants to combine all service running between unique pairs of stops into
            # one output line, we have to eliminate the duplicates. The easiest thing to do would be to copy the
            # LineVariantElements to the output location and then use the Delete Identical tool. However, since this
            # tool requires the Advanced license, and we don't want to impose that requirement on the current tool, we
            # can get around it using the following method:
            # 1) Create an empty output feature class with the same schema
            # 2) Loop through the LineVariantElements. Log the stop pairs we've seen as we go. Only insert the row into
            #    the output only if it's the first instance of the (FromStopID, ToStopID) pair.
            lve_desc = arcpy.Describe(self.transit_dm.line_variant_elements)
            arcpy.management.CreateFeatureclass(
                os.path.dirname(self.out_fc),
                os.path.basename(self.out_fc),
                "POLYLINE",
                "",
                "ENABLED" if lve_desc.hasM else "DISABLED",
                "ENABLED" if lve_desc.hasZ else "DISABLED",
                output_sr
            )
            id_fields = [f for f in self.stop_id_fields]
            field_defs = [[f, "LONG"] for f in id_fields]
            arcpy.management.AddFields(self.out_fc, field_defs)
            field_names_icur = id_fields + ["SHAPE@"]
            field_names_scur = id_fields + ["SHAPE@"]
            if self.use_lve_shapes:
                field_names_scur.append("LVEShapeID")
            used_pairs = set()  # Store stop pairs we've already seen
            with arcpy.da.InsertCursor(  # pylint: disable=no-member
                self.out_fc, field_names_icur
            ) as cur:
                for row in arcpy.da.SearchCursor(  # pylint: disable=no-member
                    self.transit_dm.line_variant_elements, field_names_scur,
                    spatial_reference=output_sr, datum_transformation=transformation
                ):
                    stop_pair = (row[0], row[1])  # FromStopID, ToStopID
                    if stop_pair in used_pairs:
                        # This LVE represents the same stop-stop connection, so it's a duplicate.
                        # Skip it and move on.
                        # Note: It's unusual but possible/reasonable to have multiple connections between the same two
                        # stops using different LVEShapes.  However, we ignore this case and just use the geometry of
                        # the first one to be found.
                        continue
                    # If we got this far, we want to keep this row. This represents a fresh stop-stop corridor.
                    # Log that we've seen this corridor.
                    used_pairs.add(stop_pair)
                    # If using LVEShapes, retrieve the geometry from the cached LVEShapes instead of LineVariantElements
                    # but fall back to LineVariantElements if the LVEShapes feature can't be retrieved.
                    if self.use_lve_shapes:
                        lve_shape_id = row[3]
                        if lve_shape_id is None:
                            # The LVEShapes feature corresponding to this LineVariantElements feature is not
                            # defined.  Just fall back to the LineVariantElements shape.
                            geom = row[2]
                            invalid_lve_shape_ids = True
                        else:
                            try:
                                geom = lve_shape_geom[lve_shape_id]
                            except KeyError:
                                # The LVEShapes table doesn't have an entry associated with this LVEShapeID.  This is a
                                # data error, but we don't need to fail the tool.  Just fall back to the
                                # LineVariantElements shape.
                                geom = row[2]
                                invalid_lve_shape_ids = True
                        # Build row to insert
                        row = [row[0], row[1], geom]
                    # Insert this row into the output.
                    cur.insertRow(row)
            del used_pairs

            # Read the combined LineVariantElements into a dataframe to use for joins later
            with arcpy.da.SearchCursor(self.out_fc, ["OID@"] + id_fields) as cur:  # pylint: disable=no-member
                self.combined_lve_df = pd.DataFrame(cur, columns=[self.poi_id_field] + id_fields)
            self.combined_lve_df.set_index(id_fields, inplace=True)

        else:
            # If the user wants to keep the results separated by Line, we can use the LineVariantElements as is and just
            # copy them to the output. However, since LineVariantElements uses ObjectID as its unique ID, we have to
            # preserve this in a new field when we copy.
            # Initialize the field mappings using the default mappings from the original service output. Add the unique
            # ID field this way, and also use the opportunity to remove any existing output fields if needed. This case
            # will be rare since the LineVariantElements table comes from the transit data model.
            existing_output_fields = [of for of in self.output_fields if of in
                                      [f.name for f in arcpy.ListFields(self.transit_dm.line_variant_elements)]]
            field_mappings = arcpy.FieldMappings()
            field_mappings.addTable(self.transit_dm.line_variant_elements)
            # Add the OrigOID field to the output using field mapping
            new_field = arcpy.Field()
            new_field.name = self.out_fc_id_field
            new_field.aliasName = self.out_fc_id_field
            new_field.type = "LONG"
            new_fm = arcpy.FieldMap()
            new_fm.outputField = new_field
            new_fm.addInputField(
                self.transit_dm.line_variant_elements,
                arcpy.Describe(self.transit_dm.line_variant_elements).oidFieldName
            )
            field_mappings.addFieldMap(new_fm)
            if existing_output_fields:
                for field in existing_output_fields:
                    fm_idx = field_mappings.findFieldMapIndex(field)
                    if fm_idx > -1:
                        field_mappings.removeFieldMap(fm_idx)
            with arcpy.EnvManager(
                outputCoordinateSystem=output_sr,
                geographicTransformations=transformation
            ):
                arcpy.conversion.ExportFeatures(
                    self.transit_dm.line_variant_elements,
                    self.out_fc,
                    field_mapping=field_mappings
                )

            # Join the LineID and GDirectionID fields to the output for informational purposes
            joined_fields = ["LineID"]
            if self.use_gdirectionid:
                joined_fields.append("GDirectionID")
            arcpy.management.JoinField(self.out_fc, "LineVarID", self.transit_dm.line_variants, "ID", joined_fields)

            # Swap out the shapes in the output to use the LVEShapes geometry instead of LineVariantElements
            if self.use_lve_shapes:
                with arcpy.da.UpdateCursor(self.out_fc, ["LVEShapeID", "SHAPE@"]) as cur:  # pylint: disable=no-member
                    for row in cur:
                        lve_shape_id = row[0]
                        if lve_shape_id is None:
                            # The LVEShapes feature corresponding to this LineVariantElements feature is not defined.
                            # Don't update the shape.
                            invalid_lve_shape_ids = True
                            continue
                        try:
                            geom = lve_shape_geom[lve_shape_id]
                        except KeyError:
                            # The LVEShapes table doesn't have an entry associated with this LVEShapeID.  This is a data
                            # error, but we don't need to fail the tool.  Don't update the shape.
                            invalid_lve_shape_ids = True
                            continue
                        cur.updateRow([lve_shape_id, geom])

        if self.use_lve_shapes and invalid_lve_shape_ids:
            # One or more LineVariantElements features has a null or invalid value for the LVEShapeID field. The
            # LineVariantElements geometry will be used for these features instead of the LVEShapes geometry.
            arcpy.AddIDMessage("WARNING", 240025)

        del lve_shape_geom

    def _copy_pois_to_output(self):
        """Copy the input points of interest to the output feature class location."""
        # Determine the desired output spatial reference and whether a geographic transformation is needed
        desc_pois = arcpy.Describe(self.poi_fc)
        output_sr = spatial_reference_helper.determine_output_spatial_ref(
            os.path.dirname(self.out_fc), desc_pois.spatialReference
        )
        transformation = spatial_reference_helper.get_datum_transformation(
            desc_pois.spatialReference, output_sr, desc_pois.extent
        )

        # Make a list of any of the output fields that already exist in the data.
        # Use field mapping to remove any existing output fields if needed.
        existing_output_fields = [of for of in self.output_fields if of in
                                  [f.name for f in arcpy.ListFields(self.poi_fc)]]
        field_mappings = None
        if existing_output_fields:
            field_mappings = arcpy.FieldMappings()
            field_mappings.addTable(self.poi_fc)
            for field in existing_output_fields:
                fm_idx = field_mappings.findFieldMapIndex(field)
                if fm_idx > -1:
                    field_mappings.removeFieldMap(fm_idx)

        # Copy POIs to output
        with arcpy.EnvManager(
            outputCoordinateSystem=output_sr,
            geographicTransformations=transformation
        ):
            arcpy.conversion.ExportFeatures(
                self.poi_fc,
                self.out_fc,
                field_mapping=field_mappings  # Used to eliminate existing output fields
            )

    def get_symbology_layer(self):
        """Get the appropriate symbology layer file template and modify it for the user's field names."""
        # The symbology depends on the output layer type, which in turn depends on the analysis type, and the
        # field to symbolize on depends on the time window prefix. Select the correct template lyrx file based on
        # the analysis type, then update the symbology field based on the time window field prefix.
        rnd_dir = os.path.join(arcpy.GetInstallInfo()['InstallDir'], "Resources", "ArcToolBox", "Templates", "Layers")
        if self.analysis_type == AnalysisType.Stops:
            symbol_layer = os.path.join(rnd_dir, "CalculateTransitServiceFrequency_stops.lyrx")
        elif self.analysis_type == AnalysisType.Lines:
            symbol_layer = os.path.join(rnd_dir, "CalculateTransitServiceFrequency_lines.lyrx")
        elif self.analysis_type == AnalysisType.Points:
            if self.poi_shape_type == "Point":
                symbol_layer = os.path.join(rnd_dir, "CalculateTransitServiceFrequency_POIs.lyrx")
            else:  # POIs are polygons
                symbol_layer = os.path.join(rnd_dir, "CalculateTransitServiceFrequency_POIs_areas.lyrx")
        else:  # AnalysisType.Polygons
            symbol_layer = os.path.join(rnd_dir, "CalculateTransitServiceFrequency_areas.lyrx")

        # Read the CIM json from the lyrx file
        with open(symbol_layer, "r", encoding="utf-8-sig") as f:
            lyrx_txt = f.read()

        # Symbolize based on the first time window's NumRunsPerHour field.
        field_name = f"{self.time_windows[0].prefix}_NumRunsPerHour"
        lyrx_txt = lyrx_txt.replace("Test_NumRunsPerHour", field_name)

        # Write the modified CIM json back to a temporary lyrx file
        global TEMP_LYRX
        TEMP_LYRX = os.path.join(arcpy.env.scratchFolder, f"CTFS_{uuid.uuid4().hex}.lyrx")
        with open(TEMP_LYRX, "w", encoding="utf-8-sig") as f:
            f.write(lyrx_txt)

        return TEMP_LYRX

    def _make_temporary_output_path(self, name: str):
        """Make a path in the scratch gdb for a temporary intermediate output and track it for later deletion."""
        name = arcpy.CreateUniqueName(name, arcpy.env.scratchGDB)  # pylint: disable=no-member
        temp_output = os.path.join(arcpy.env.scratchGDB, name)  # pylint: disable=no-member
        self.temp_outputs.append(temp_output)
        return temp_output


# Validation flags to prevent redoing slow validation checks if the parameter hasn't changed. Because of limitations of
# the ToolValidator class framework, these must be global variables stored outside the class, even though this isn't the
# best coding practice.
VFLAG_TRANSIT_DM_EXISTS_ERROR = False
VFLAG_TRANSIT_EVALUATOR = False
VFLAG_SERVICE_MISSING_SOLVER_ERROR = False
VFLAG_LVE_SHAPES = True


class ToolValidator:
    """Tool validation logic specific to this tool."""

    def __init__(self):
        """Set the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        self.param_fd = self.params[0]
        self.param_analysis_type = self.params[1]
        self.param_out_fc = self.params[2]
        self.param_time_windows = self.params[3]
        param_idx_separate = 4
        self.param_idx_in_pts = 5
        param_idx_network = 6
        param_idx_travel_mode = 7
        param_idx_walk_limit = 8
        param_idx_walk_limit_units = 9
        param_idx_cell_size = 10
        param_idx_barriers = 11
        param_idx_line_shape = 15
        self.param_network = self.params[param_idx_network]
        self.param_travel_mode = self.params[param_idx_travel_mode]
        self.param_walk_limit = self.params[param_idx_walk_limit]
        self.param_walk_limit_units = self.params[param_idx_walk_limit_units]
        self.param_cell_size = self.params[param_idx_cell_size]
        self.param_line_shape = self.params[param_idx_line_shape]
        self.param_exclude_modes = self.params[14]
        self.param_line_shape = self.params[param_idx_line_shape]

        # Parameters may be enabled or disabled depending on analysis type value
        self.enabled = {
            "STOPS": [param_idx_separate],
            "LINES": [param_idx_separate, param_idx_line_shape],
            "POINTS_OF_INTEREST": [
                self.param_idx_in_pts,
                param_idx_network,
                param_idx_travel_mode,
                param_idx_walk_limit,
                param_idx_walk_limit_units,
                param_idx_barriers
            ],
            "AREAS": [
                param_idx_network,
                param_idx_travel_mode,
                param_idx_walk_limit,
                param_idx_walk_limit_units,
                param_idx_cell_size,
                param_idx_barriers
            ]
        }
        self.all_dependent_params = []
        for idx_list in [self.enabled[mode] for mode in self.enabled]:
            self.all_dependent_params += idx_list
        self.all_dependent_params = list(set(self.all_dependent_params))

        # Parameters are conditionally required depending on analysis type value
        self.conditionally_required = {
            "POINTS_OF_INTEREST": [
                self.param_idx_in_pts,
                param_idx_network,
                param_idx_travel_mode,
                param_idx_walk_limit,
                param_idx_walk_limit_units,
            ],
            "AREAS": [
                param_idx_network,
                param_idx_travel_mode,
                param_idx_walk_limit,
                param_idx_walk_limit_units,
                param_idx_cell_size
            ]
        }
        self.all_conditionally_required_params = []
        for idx_list in [self.conditionally_required[mode] for mode in self.conditionally_required]:
            self.all_conditionally_required_params += idx_list
        self.all_conditionally_required_params = list(set(self.all_conditionally_required_params))

        # Output feature class geometry types for different analysis types
        # POINTS_OF_INTEREST has special behavior and is not set here
        self.geom_type = {"STOPS": "Point", "LINES": "Polyline", "AREAS": "Polygon"}

        # Service solvers required for each analysis type
        self.required_solver = {
            "POINTS_OF_INTEREST": "asyncODCostMatrix",
            "AREAS": "asyncServiceArea"
        }
        # Friendly translated names of the async services for injection into message 30180
        self.service_names = {
            "asyncServiceArea": arcpy.GetIDMessage(30337),
            "asyncODCostMatrix": arcpy.GetIDMessage(30338)
        }

    def initializeParameters(self):  # pylint: disable=invalid-name
        """Refine the properties of a tool's parameters. This method is called when the tool is opened."""
        # Initialize a default time window so the user has some clues how to fill it out for their needs and so they
        # don't get endless validation errors while filling it out.
        today = datetime.date.today()
        self.param_time_windows.values = [[
            False,
            datetime.datetime(today.year, today.month, today.day, 8, 0, 0),
            60,
            "DEPARTURES",
            "MyPrefix"
        ]]

    def updateParameters(self):
        """Modify the values and properties of parameters before internal validation is performed.

        This method is called whenever a parameter has been changed.
        """
        # Update time window prefixes to have valid field names
        out_gdb = None
        if self.param_out_fc.valueAsText:
            out_gdb = os.path.dirname(self.param_out_fc.valueAsText)
        if (not self.param_time_windows.hasBeenValidated) and self.param_time_windows.altered and \
                self.param_time_windows.valueAsText:
            values = self.param_time_windows.values
            for idx, value in enumerate(values):
                prefix = value[4]
                values[idx][4] = arcpy.ValidateFieldName(prefix, out_gdb)
            self.param_time_windows.values = values

        # Enable and disable parameters based on selected analysis type
        # Also set output geometry type
        if (not self.param_analysis_type.hasBeenValidated) and self.param_analysis_type.valueAsText:
            analysis_type = self.param_analysis_type.valueAsText
            try:
                # Enable and disable correct set of parameters
                for idx in self.all_dependent_params:
                    if idx in self.enabled[analysis_type]:
                        self.params[idx].enabled = True
                    else:
                        self.params[idx].enabled = False
                # Set output feature class geometry type
                if analysis_type == "POINTS_OF_INTEREST":
                    # The input "points" of interest can be either points or polygons, so derive the output geometry
                    # type from the input
                    self.param_out_fc.parameterDependencies = [self.param_idx_in_pts]
                    self.param_out_fc.schema.geometryTypeRule = "FirstDependency"
                else:
                    # The output geometry type for other analysis modes is fixed
                    self.param_out_fc.schema.geometryTypeRule = "AsSpecified"
                    self.param_out_fc.schema.geometryType = self.geom_type.get(analysis_type)
            except KeyError:
                # The analysis type was invalid. Do nothing.
                pass

        # Set schema of output feature class
        if (
            (
                not self.param_time_windows.hasBeenValidated or
                not self.param_out_fc.hasBeenValidated or
                not self.param_analysis_type.hasBeenValidated
            ) and
            self.param_time_windows.valueAsText and
            self.param_out_fc.valueAsText and
            self.param_analysis_type.valueAsText
        ):
            out_fields = []
            analysis_type = self.param_analysis_type.valueAsText
            # Define whether to transfer input fields to output
            if analysis_type == "POINTS_OF_INTEREST":
                self.param_out_fc.schema.fieldsRule = "AllNoFIDs"
            else:
                self.param_out_fc.schema.fieldsRule = "None"
            # Define fields specific to analysis type
            if analysis_type in ["POINTS_OF_INTEREST", "AREAS"]:
                field = arcpy.Field()
                field.name = "NumStops"
                field.type = "SmallInteger"
                out_fields.append(field)
            # Define statistics fields for each time window
            for tw in self.param_time_windows.values:
                prefix = tw[4]
                stat_field_defs = get_stats_field_defs(prefix)
                for stat_field in stat_field_defs:
                    field = arcpy.Field()
                    field.name = stat_field[0]
                    field.type = gtfs_utils.TOOL_FIELD_TYPE_TO_OBJECT_FIELD_TYPE[stat_field[1]]
                    out_fields.append(field)
            # Set output fields
            self.param_out_fc.schema.additionalFields = out_fields

        # Set filter list of units in cutoff units parameter based on what type of travel mode is selected
        if self.param_travel_mode.enabled and not self.param_travel_mode.hasBeenValidated and \
                self.param_travel_mode.altered and self.param_travel_mode.valueAsText:
            unit_type = get_travel_mode_unit_type(self.param_travel_mode.value)
            if unit_type == TravelModeUnitType.Time:
                self.param_walk_limit_units.filter.list = TIME_UNITS
            elif unit_type == TravelModeUnitType.Distance:
                self.param_walk_limit_units.filter.list = DISTANCE_UNITS
            else:
                self.param_walk_limit_units.filter.list = UNKNOWN_UNITS

        # Set filter list of GRouteType values in Lines table in Exclude modes parameter
        # Only do this process if the transit feature dataset has been changed
        if not self.param_fd.isInputValueDerived() and not self.param_fd.hasBeenValidated:
            if self.param_fd.valueAsText:
                transit_dm = TransitDataModel(self.param_fd.valueAsText)
                route_types = transit_dm.get_groutetype_modes()
                if not route_types:
                    self.param_exclude_modes.enabled = False
                    self.param_exclude_modes.filter.list = []
                    self.param_exclude_modes.value = []
                else:
                    self.param_exclude_modes.enabled = True
                    self.param_exclude_modes.filter.list = route_types
            else:  # Feature dataset must have been cleared manually
                self.param_exclude_modes.enabled = True
                self.param_exclude_modes.filter.list = []

        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool parameter.

        This method is called after internal validation.
        """
        # Ensure the data model feature dataset contains the necessary feature classes and tables
        # Skip check if the parameters is derived (from Model Builder output)
        if not self.param_fd.isInputValueDerived() and self.param_fd.altered and self.param_fd.valueAsText:
            global VFLAG_TRANSIT_DM_EXISTS_ERROR
            global VFLAG_LVE_SHAPES
            if self.param_fd.hasBeenValidated:
                # The parameter has already been validated and has not been changed by the user since the last
                # validation check. Skip slow checks by just reapplying the existing validation error if relevant.
                if VFLAG_TRANSIT_DM_EXISTS_ERROR:
                    # One or more public transit data model tables does not exist.
                    self.param_fd.setIDMessage("Error", 2922)
            else:
                # The parameter has changed since the last validation check. Check validity of transit data model.
                VFLAG_TRANSIT_DM_EXISTS_ERROR = False
                if arcpy.Exists(self.param_fd.valueAsText):
                    transit_dm = TransitDataModel(self.param_fd.valueAsText)
                    if not transit_dm.validate_tables_exist():
                        # One or more public transit data model tables does not exist.
                        self.param_fd.setIDMessage("Error", 2922)
                        VFLAG_TRANSIT_DM_EXISTS_ERROR = True
                    VFLAG_LVE_SHAPES = transit_dm.has_lve_shapes

        # Add error if output location doesn't exist
        # Add error if the user tries to save output to a shapefile
        if self.param_out_fc.altered and self.param_out_fc.valueAsText:
            out_dir = os.path.dirname(self.param_out_fc.valueAsText)
            if out_dir:
                if not arcpy.Exists(out_dir):
                    # Output workspace %s does not exist
                    self.param_out_fc.setIDMessage("Error", 436, out_dir)
                else:
                    desc = arcpy.Describe(out_dir)
                    if desc.dataType == "Folder":
                        # The output cannot be a shapefile.
                        self.param_out_fc.setIDMessage("Error", 3420)

        # Make parameters required depending on selected analysis mode
        if self.param_analysis_type.valueAsText:
            # Get required parameters for this analysis type
            required_params = self.conditionally_required.get(self.param_analysis_type.valueAsText, [])
            for param_idx in self.all_conditionally_required_params:
                if param_idx in required_params:
                    if not self.params[param_idx].valueAsText:
                        # The 735 error code doesn't display an actual error but displays the little red star to
                        # indicate that the parameter is required.
                        self.params[param_idx].setIDMessage("Error", 735, self.params[param_idx].displayName)
                else:
                    # Not required for this analysis type
                    self.params[param_idx].clearMessage()
        else:
            # Clear out requirements if the analysis type is unset
            for param_idx in self.all_conditionally_required_params:
                self.params[param_idx].clearMessage()

        # Add an error to the line shape type parameter if the user picks LVEShapes but that table isn't present in
        # the data model
        if not VFLAG_LVE_SHAPES and self.param_analysis_type.valueAsText == "LINES" and \
                self.param_line_shape.valueAsText == "CARTOGRAPHIC_LINES":
            self.param_line_shape.setIDMessage("Error", 240023)

        # Validate time window
        if self.param_time_windows.altered and self.param_time_windows.valueAsText:
            # Values are required
            for value in self.param_time_windows.values:
                if not value[1]:
                    # Time window start datetime is required.
                    self.param_time_windows.setIDMessage("Error", 240010)
                    break
                if not value[2]:
                    # Time window duration is required.
                    self.param_time_windows.setIDMessage("Error", 240011)
                    break
                if not value[3]:
                    # The time window must specify whether to count arrivals or departures.
                    self.param_time_windows.setIDMessage("Error", 240012)
                    break
                if not value[4]:
                    # Time window field prefix is required.
                    self.param_time_windows.setIDMessage("Error", 240013)
                    break
            # Duration must be between 0 and 1440
            durations = [value[2] for value in self.param_time_windows.values]
            if [dur for dur in durations if (dur <= 0 or dur > 1440)]:
                # Time window duration must be greater than 0 and less than 1440 minutes.
                self.param_time_windows.setIDMessage("Error", 240002)
            # Time window prefixes must be unique
            prefixes = [value[4] for value in self.param_time_windows.values]
            unique_prefixes = len(list(set(prefixes)))
            if len(prefixes) != unique_prefixes:
                # Time window field prefixes must be unique.
                self.param_time_windows.setIDMessage("Error", 240003)

        # Ensure that if the network data source is a service, the OD Cost Matrix or Service Area solver is supported,
        # depending on analysis mode.
        # It is possible for a portal to be configured with only some solvers available.
        if self.param_network.enabled and self.param_network.valueAsText and self.param_analysis_type.valueAsText:
            global VFLAG_SERVICE_MISSING_SOLVER_ERROR
            network = self.param_network.valueAsText
            service_type = self.required_solver.get(self.param_analysis_type.valueAsText, None)
            if self.param_network.hasBeenValidated and self.param_analysis_type.hasBeenValidated:
                # The parameter has already been validated and has not been changed by the user since the last
                # validation check. Skip slow checks by just reapplying the existing validation error if relevant.
                if VFLAG_SERVICE_MISSING_SOLVER_ERROR:
                    self.set_missing_solver_error(network, service_type)
            else:
                # The parameter has changed since the last validation check. Perform check.
                VFLAG_SERVICE_MISSING_SOLVER_ERROR = False
                # Only check it if it's a service and not arcgis.com. We know AGOL will always have all services.
                if network and network.startswith("http") and "www.arcgis.com" not in network:
                    if service_type:
                        try:
                            # Ensure that "helperServices" has the key for the needed service. If it doesn't, the solver
                            # is not supported by the service, and we can't use this portal.
                            service_info = arcpy.GetPortalDescription(network)["helperServices"][service_type]
                            if not service_info:
                                self.set_missing_solver_error(network, service_type)
                        except KeyError:
                            self.set_missing_solver_error(network, service_type)

        # Add a warning if the user selects a travel mode that uses the public transit evaluator. This is a common
        # and likely mistake resulting from a misunderstanding of either the public transit evaluator or what this tool
        # is measuring.
        if self.param_network.enabled and not self.param_network.isInputValueDerived() and \
                self.param_network.altered and self.param_network.valueAsText and self.param_travel_mode.altered and \
                self.param_travel_mode.valueAsText:
            global VFLAG_TRANSIT_EVALUATOR
            if self.param_network.hasBeenValidated and self.param_travel_mode.hasBeenValidated:
                # The parameters have already been validated and have not been changed by the user since the last
                # validation check. Skip slow checks by just reapplying the existing validation warning if relevant.
                if VFLAG_TRANSIT_EVALUATOR:
                    # The selected travel mode uses the Public Transit evaluator. This tool is intended to model
                    # travel to and from public transit stops, not travel by public transit. The selected travel
                    # mode may be inappropriate for this tool.
                    self.param_travel_mode.setIDMessage("Warning", 240005)
            else:
                VFLAG_TRANSIT_EVALUATOR = False
                network = self.param_network.valueAsText
                travel_mode = self.param_travel_mode.value
                try:
                    if does_travel_mode_use_transit_evaluator(network, travel_mode):
                        # The selected travel mode uses the Public Transit evaluator. This tool is intended to model
                        # travel to and from public transit stops, not travel by public transit. The selected travel
                        # mode may be inappropriate for this tool.
                        self.param_travel_mode.setIDMessage("Warning", 240005)
                        VFLAG_TRANSIT_EVALUATOR = True
                except Exception:  # pylint: disable=broad-except
                    # If the above check fails for some reason, just don't worry about it.
                    pass

        # Check numerical values of walk limit and cell size
        if self.param_walk_limit.enabled and self.param_walk_limit.altered:
            if self.param_walk_limit.value <= 0:
                # Value must be positive
                self.param_walk_limit.setIDMessage("Error", 398)
        if self.param_cell_size.enabled and self.param_cell_size.altered and self.param_cell_size.valueAsText:
            cell_size_in_meters = cell_size_to_meters(self.param_cell_size.valueAsText)
            if cell_size_in_meters < 10 or cell_size_in_meters > 1000:
                # Cell size must be between 10 and 1000 meters.
                self.param_cell_size.setIDMessage("Error", 240014)

        return

    def postExecute(self):
        """Delete the temporary symbology lyrx file after the tool has finished running."""
        if os.path.exists(TEMP_LYRX):
            os.remove(TEMP_LYRX)

    def set_missing_solver_error(self, network, service_type):
        """Add an error flag to the network data soure parameter indicating that the required solver is missing."""
        # Portal "%1" is not configured with the "%2" web tool.
        self.param_network.setIDMessage("Error", 30180, network, self.service_names[service_type])
        global VFLAG_SERVICE_MISSING_SOLVER_ERROR
        VFLAG_SERVICE_MISSING_SOLVER_ERROR = True
