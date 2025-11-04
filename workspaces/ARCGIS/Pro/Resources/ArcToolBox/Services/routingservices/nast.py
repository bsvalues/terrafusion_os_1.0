"""Base class used by all the network analysis solver tools."""  # As designed. pylint:disable=too-many-lines

import os
import logging
import json
import locale
import time
import uuid
import shutil
import functools
from collections import namedtuple, OrderedDict
from operator import itemgetter
from pathlib import Path

import arcpy
import arcpy._na as nax
import nat


TIMER_MSGS = OrderedDict()
SERVER_PERF_METRICS = {}
PERF_METRICS_PRECISION = 4  # number of decimal places in various server perf metrics

NDAttribute = namedtuple("NDAttribute", ("name", "units", "usageType", "useByDefault"))
FOR_PUBLISHING = False

# Monkey patching locale.atof as we want to use our own function when converting numbers from string
locale.atof = nax.ConvertStringToFloat


def time_exec(func):
    """Measure time in seconds to execute a function.

    This function is meant to be used as a decorator on class methods.

    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        """Wrap the function to be run."""
        start_time = time.time()
        return_val = func(*args, **kwargs)
        end_time = time.time()
        # key needs to be unqiue since the timed functions can be called more than once.
        # For example, NASolverTool._is_valid is called once for each option feature set and record set input.
        msg_key = f"{len(TIMER_MSGS)}-{func.__qualname__}"
        TIMER_MSGS[msg_key] = round(end_time - start_time, 3)
        return return_val
    return wrapper


def log_server_perf_metrics(tool_dialog, tool):
    """Log server side perf metrics to ArcGIS Server log from the GPToolDialog instance.
    
    Args:
        tool_dialog: An instance of the GPToolDialog
        tool: An instance of the solver tool created within the GPToolDialog
    
    """
    elapsed = SERVER_PERF_METRICS["EndTime"] - SERVER_PERF_METRICS["StartTime"]
    SERVER_PERF_METRICS["ElapsedTimeInSeconds"] = round(elapsed, PERF_METRICS_PRECISION)
    SERVER_PERF_METRICS["StartTime"] = time.ctime(SERVER_PERF_METRICS["StartTime"])
    SERVER_PERF_METRICS["EndTime"] = time.ctime(SERVER_PERF_METRICS["EndTime"])
    if SERVER_PERF_METRICS:
        perf_message = json.dumps(SERVER_PERF_METRICS, indent=None)
        # Return server perf metrics to the client if they asked for it.
        if hasattr(tool, "system_solver_overrides_message_codes"):
            if 30210 not in tool.system_solver_overrides_message_codes:
                tool_dialog.logger.warning("", extra={"message_ID": 30349, "add_argument1": perf_message})
        if hasattr(tool, "log_perf_metrics"):
            if tool.log_perf_metrics:
                tool_dialog.logger.info(perf_message, extra={"code": 13033, "method_name": tool_dialog.TOOL_NAME})
        else:
            # Should be here only if tool failed.
            if NASolverTool._log_perf_metrics():  # pylint:disable=protected-access
                tool_dialog.logger.info(perf_message, extra={"code": 13033, "method_name": tool_dialog.TOOL_NAME})
        SERVER_PERF_METRICS.clear()


class PerfTimer:
    """Context manager to measure performance for any code block."""

    def __init__(self, key_name):
        self.start_time = None
        self.end_time = None
        self.key_name = key_name

    def __enter__(self):
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.end_time = time.perf_counter()
        SERVER_PERF_METRICS[self.key_name] = round(self.end_time - self.start_time, PERF_METRICS_PRECISION)

class NASolverTool(nat.NATool):
    """Base class for all network analysis solver tools."""

    __slots__ = ("point_barriers", "line_barriers", "polygon_barriers", "limits", "travel_mode", "impedance",
                 "time_impedance", "distance_impedance", "nds_info", "measurement_type", "measurement_unit",
                 "restrictions", "use_hierarchy", "uturn_at_junctions", "attribute_parameter_values", "simp_tol",
                 "simp_tol_unit", "network_datasets", "network_dataset", "overrides", "accumulate_attributes",
                 "solve_succeeded", "output_gdb", "output_names", "force_hierarchy", "ignore_loc_fields",
                 "max_meters_amid_inputs", "is_custom_travel_mode", "analysis_region", "nd_extents", "conn_file",
                 "remote_svc_name", "extent_fields", "save_layer_file", "output_layer_file", "kwargs", "solver_object",
                 "output_format", "output_result_file", "max_output_features", "impedance_unit", "is_walking_mode",
                 "solver_result", "output_layer_package", "ignore_invalid_locations", "locate_settings", "usage_cost",
                 "system_solver_overrides_message_codes", "provider", "log_perf_metrics", "solver_perf_metrics")
    logger = logging.getLogger(__name__)  # logger used by the class
    ESRI_UTURNS = {  # mapping of Uturn keywords and value used by the travel mode object.
        "ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY": "esriNFSBAtDeadEndsAndIntersections",
        "ALLOW_UTURNS": "esriNFSBAllowBacktrack",
        "NO_UTURNS": "esriNFSBNoBacktrack",
        "ALLOW_DEAD_ENDS_ONLY": "esriNFSBAtDeadEndsOnly",
        "Allowed": "esriNFSBAllowBacktrack",
        "Not Allowed": "esriNFSBNoBacktrack",
        "Allowed Only at Dead Ends": "esriNFSBAtDeadEndsOnly",
        "Allowed Only at Intersections and Dead Ends": "esriNFSBAtDeadEndsAndIntersections",
        "esriNFSBAllowBacktrack": "Allowed",
        "esriNFSBNoBacktrack": "Not Allowed",
        "esriNFSBAtDeadEndsOnly": "Allowed Only at Dead Ends",
        "esriNFSBAtDeadEndsAndIntersections": "Allowed Only at Intersections and Dead Ends",
    }
    ESRI_UNITS = {  # mapping between unit values and keywords used by travel mode object.
        "Meters": "esriMeters",
        "Miles": "esriMiles",
        "Kilometers": "esriKilometers",
        "Feet": "esriFeet",
        "Yards": "esriYards",
        "Inches": "esriInches",
        "Decimeters": "esriDecimeters",
        "NauticalMiles": "esriNauticalMiles",
        "Millimeters": "esriMillimeters",
        "Centimeters": "esriCentimeters",
        "None": "esriUnknownUnits"
    }
    TIME_ZONE = {  # mapping between time zone keywords and nax.TimeZoneUsage enum
        "Geographically Local": 0,
        "GEO_LOCAL": 0,
        "UTC": 1,
    }
    ROUTE_SHAPE_TYPE = {  # mapping between route shape type keywords and nax.RouteShapeType enum
        "None": 0,
        "Straight Line": 1,
        "True Shape": 2,
        "True Shape with Measures": 3,
    }
    DIRECTIONS_STYLE = {
        "NA Navigation": 0,
        "NA Campus": 1,
        "NA Desktop": 2
    }

    IMPEDANCE_NAMES = ["Drive Time", "Truck Time", "Walk Time", "Travel Distance"]  # Keyword for some impedances
    ATTR_PARAMS_FIELDS = ("AttributeName", "ParameterName", "ParameterValue")  # Fields used by the record set
    REGION_NAME_FIELD = "RegionName"  # Field name representing the region names in the extents layer.
    MAX_VERTEX_COUNT = 0  # Max number of vertices in the output when called from REST. Defined by child class
    ROUTE_CUTOFF_FACTOR = 2  # Multiplier to set the route cutoff based on force-hierarchy value
    ROUTE_CUTOFF_NON_WALK_SPEED = 50  # Speed in KPH for converting route cutoff distance to time

    def __init__(self):
        """Define instance attributes common to all solver tools."""
        # for attr in self.__slots__:
        #     setattr(self, attr, None)
        self.point_barriers = None
        self.line_barriers = None
        self.polygon_barriers = None
        self.limits = {}
        self.travel_mode = None
        self.impedance = None
        self.time_impedance = None
        self.distance_impedance = None
        self.nds_info = None
        self.measurement_type = None
        self.measurement_unit = None
        self.restrictions = None
        self.use_hierarchy = None
        self.uturn_at_junctions = None
        self.attribute_parameter_values = None
        self.simp_tol = None
        self.simp_tol_unit = None
        self.network_dataset = None
        self.network_datasets = []
        self.nd_extents = None
        self.overrides = None
        self.accumulate_attributes = []
        self.solve_succeeded = None
        self.output_gdb = None
        self.output_names = None
        self.force_hierarchy = None
        self.ignore_loc_fields = None
        self.max_meters_amid_inputs = 0.0
        self.is_custom_travel_mode = True
        self.analysis_region = None
        self.conn_file = None
        self.remote_svc_name = None
        self.extent_fields = [self.REGION_NAME_FIELD, "Provider", "Rank", ""]  # last field has to be for remote service
        self.provider = None
        self.save_layer_file = None
        self.output_layer_file = None
        self.kwargs = {}
        self.solver_object = None
        self.output_format = None
        self.output_result_file = None
        self.max_output_features = self._get_max_output_features_limit()
        self.impedance_unit = None
        self.is_walking_mode = None
        self.solver_result = None
        self.output_layer_package = ""
        self.ignore_invalid_locations = None
        self.locate_settings = None
        self.usage_cost = None
        self.system_solver_overrides_message_codes = []
        self.log_perf_metrics = self._log_perf_metrics()
        self.solver_perf_metrics = {}

    @staticmethod
    def strip_quotes(value):
        """Strip single quote from the start and end of each string value.

        >>>strip_quotes(["'North America'", "'South America'"])
        >>>["North America", "South America"]

        >>>strip_quotes("'North America'")
        >>>"North America"

        Args:
            value: A list of strings or a string where the value starts and ends with a single quote.

        Returns:
            The value of the same type as input without single quoted strings.

        """
        if isinstance(value, list):
            return [x.lstrip("'").rstrip("'") for x in value]
        elif isinstance(value, str):
            return value.lstrip("'").rstrip("'")

        return value

    @staticmethod
    def read_value_table(value_table):
        """Get the values from a GP ValueTable object as a list of lists.

        Args:
            value_table: An arcpy.ValueTable object to be read.
        Returns:
            A list of lists where each list contains values for all columns in a row. For example, for a value table
            with two columns and three rows, the return value will be
            [["col1", "col2"], ["col1", "col2"], ["col1", "col2"]]
        Raises:
            No Exception

        """
        values = []
        col_count = value_table.columnCount
        for row_index in range(value_table.rowCount):
            value = [value_table.getValue(row_index, col_index) for col_index in range(col_count)]
            values.append(value)
        return values

    @staticmethod
    def get_count(dataset, where_clause=""):
        """Return the count of features in the given dataset.

        Args:
            dataset: The feature class or table whose row count is to be returned.
            where_clause: A SQL where clause to limit the number of features to be counted.
        Returns:
            An integer for the row count. For an empty feature class or table, a value of 0 is returned.
        Raises:
            RuntimeError if the input dataset does not exist.
            TypeError if the input dataset is not a table or a feature class.

        """
        count = 0
        # result = arcpy.management.GetCount(dataset)
        # count = int(result.getOutput(0))
        with arcpy.da.SearchCursor(dataset, "OID@", where_clause) as cursor:  # False positive. pylint:disable=no-member
            for _ in cursor:
                count += 1
        return count

    @staticmethod
    def convert_value(value, from_unit, to_unit):
        """Convert a value from one unit to another.

        Args:
            value: The input number (as an int or float.)
            from_unit: The unit for the value as a string.
            to_unit: The unit as a string in which the value is to be converted.
        Returns:
            The converted value (as a float). If from_unit and to_unit are same, return the value unchanged.
        Raises:
            A ValueError if value is not an int or a float.

        """
        if not isinstance(value, (int, float)):
            raise ValueError(f"'{value}' must be a int or float.")
        is_time_unit = True if from_unit in nax.TimeUnits.__members__ else False
        from_unit = from_unit.lower()
        to_unit = to_unit.lower()
        if from_unit == to_unit:
            return value
        conversions = {
            ('meters', 'kilometers'): 0.001,
            ('meters', 'feet'): 3.2808399,
            ('meters', 'miles'): 0.000621371192,
            ('meters', 'yards'): 1.0936133,
            ('meters', 'nauticalmiles'): 0.000539956803,
            ('meters', 'meters'): 1.0,
            ('kilometers', 'meters'): 1000.0,
            ('feet', 'meters'): 0.3048,
            ('miles', 'meters'): 1609.344,
            ('yards', 'meters'): 0.9144,
            ('nauticalmiles', 'meters'): 1852.0,
            ('meters', 'meters'): 1.0,
            ('minutes', 'hours'): 0.0166666667,
            ('minutes', 'days'): 0.000694444444,
            ('minutes', 'seconds'): 60.0,
            ('minutes', 'minutes'): 60.0,
            ('hours', 'minutes'): 60.0,
            ('days', 'minutes'): 1440.0,
            ('seconds', 'minutes'): 0.0166666667,
            ('minutes', 'minutes'): 1.0,
        }
        if is_time_unit:
            value_minutes = value * conversions[(from_unit, 'minutes')]
            return value_minutes * conversions[('minutes', to_unit)]
        value_meters = value * conversions[(from_unit, 'meters')]
        return value_meters * conversions[('meters', to_unit)]

    def _get_max_output_features_limit(self):
        """Return the maximumRecords limit set for the service. Return None if the limit cannot be determined."""
        max_features_limit = None
        private_arc = arcpy.gp._arc_object  # API limitation. pylint:disable=protected-access
        if hasattr(private_arc, "serviceproperties"):
            service_properties = json.loads(private_arc.serviceproperties())
            if "maximumRecords" in service_properties:
                max_features_limit = int(service_properties["maximumRecords"])
        self.logger.debug("Maximum output features limit: %s", max_features_limit)
        return max_features_limit

    def log_prop_values(self, solver_object):
        """Log values for all the properties of a solver object.

        Args:
            solver_object: A solver object whose property values will be logged.
        Returns:
            None
        Raises:
            No Exceptions

        """
        for name in dir(solver_object):
            if not name.startswith("_") or name.startswith("_locateSettingsJson"):
                # Skip properties that are superseeded by locateSettings
                if name not in ("searchQuery", "searchTolerance", "searchToleranceUnits", "searchSources",
                                "allowAutoRelocate"):
                    prop = getattr(solver_object, name)
                    if not hasattr(prop, "__call__"):
                        self.logger.debug("%s: %s", name, prop)

    def log_solver_messages(self, result):
        """Log all messages produced from the solver.

        Args:
            result: the result object containing the results from the solver.
        Returns:
            No value.
        Raises:
            No Exceptions.

        """
        # Always print all the messages from the solvers as we might have additional messages due to use of overrides
        # Log all errors from VRP solver object as warnings since we want to write violated constraints in output
        # unassigned stops and so do not want to fail VRP tool execution
        is_vrp = hasattr(self.solver_object, "excessTransitFactor")
        msg_functions = {
            1: self.logger.warning,
            2: self.logger.warning if is_vrp else self.logger.error,
            3: self.logger.info,
        }
        severity_keywords = {
            1: "WARNING",
            2: "WARNING" if is_vrp else "ERROR",
            3: "INFO"
        }
        tool_name = self.__class__.__name__
        self.logger.debug("Solver Messages")
        for msg_severity, msg_function in msg_functions.items():
            for msg in result.solverMessages(msg_severity):
                msg_code, msg_text = msg
                # Core solvers can return messages with codes 0 or 1 which we don't want to add as messgaes with ID
                if msg_code > 1:
                    # Solver diagnostics message need to return the message text.
                    if msg_code in (30210, 30211, 30348):
                        # Always log performance metrics to arcgis server log
                        if msg_code == 30210:
                            self.solver_perf_metrics = json.loads(msg_text)
                            if self.log_perf_metrics:
                                self.logger.info(msg_text, extra={"code": 13034, "method_name": tool_name})
                        if msg_code == 30211:
                            if self.log_perf_metrics:
                                self.logger.info(msg_text, extra={"code": 30211, "method_name": tool_name})
                        if msg_code == 30348 and self.log_perf_metrics:
                            self.logger.info(msg_text, extra={"code": 13035, "method_name": tool_name})
                        if msg_code not in self.system_solver_overrides_message_codes:
                            # Always return solver performance metrics as warning messages
                            # https://devtopia.esri.com/ArcGISPro/Network-Analyst/issues/5585
                            self.logger.warning("", extra={"message_ID": msg_code, "add_argument1": msg_text})
                    else:
                        # using arcpy.AddError or arcpy.AddWarning with correctly formatted message does give us the
                        # message with hyper link behavior. This is better than using arcpy.AddIDMessage since
                        # AddIDMessage requires message parameter values and solverMessages do not explicitly provide
                        # these values.
                        if is_vrp and msg_code == 30024:
                            continue
                        fmt_msg_text = f"{severity_keywords[msg_severity]} 0{msg_code}: {msg_text}"
                        msg_function(fmt_msg_text)
                else:
                    msg_function(msg_text)
        if result.isPartialSolution:
            self.logger.warning("", extra={"message_ID": 30025})

    def _match_partial_travel_mode_name(self, partial_name):
        """Return a travel mode named based on the partial name and the measurement method.

        Match partial time or distance based travel mode. For example, if measurement unit is Miles and travel mode is
        specified as "Driving", the method returns "Driving Distance"

        Args:
            partial_name: The name of the travel mode to match

        Returns:
            The name of the travel mode based on the partial name and the measurement method

        Raises:
            ValueError if the measurement type is OTHER or if the partial name is not one of the well known names

        """
        if self.measurement_type == "OTHER":
            raise ValueError
        partial_tm_names = ("driving", "walking", "trucking", "rural")
        partial_tm_index = partial_tm_names.index(partial_name.lower())  # will raise ValueError if not found
        partial_tm_name = partial_tm_names[partial_tm_index].title()
        partial_tm_name = "Rural Driving" if partial_tm_name == "Rural" else partial_tm_name
        if self.measurement_type is None:
            travel_mode_name = f"{partial_tm_name} Time"
        else:
            travel_mode_name = f"{partial_tm_name} {self.measurement_type.title()}"
        return travel_mode_name

    def get_travel_mode(self, support_travel_mode_name=True):
        """Return a travel mode object based on the input travel mode name or JSON representation of the travel mode.

        If support_travel_mode_name is false, raise a terminating error when a travel mode name is specified.
        For a travel mode name, we first check for the travel mode in the portal and if the service is running on a
        unfederated server, check for the travel mode from the network dataset.

        If the travel mode value is CUSTOM (case insensitive), then create the travel mode based on travel mode
        parameters passed by the tool.

        Raises:
            ToolExit if the travel mode is invalid or incompatible.

        """
        travel_mode_str = self.travel_mode
        travel_mode = None
        nds_costs = self.nds_info.costs["allCosts"]
        # Get Custom travel mode
        if travel_mode_str.upper() == "CUSTOM":
            self.is_custom_travel_mode = True
            travel_mode = self._create_custom_travel_mode()
        else:
            self.is_custom_travel_mode = False
            # Check if the travel mode is a JSON string
            # arcpy.na.TravelMode("") does not raise an exception and instead gives an 'empty' travel mode object
            # which is not what we want.
            if not travel_mode_str:
                nds_travel_modes = arcpy.na.GetTravelModes(self.network_dataset)
                self.logger.error("", extra={
                    "message_ID": 30158,
                    "add_argument1": travel_mode_str,
                    "add_argument2": " | ".join('"' + name + '"' for name in nds_travel_modes)})
                raise nat.ToolExit
            try:
                travel_mode = self._travel_mode_from_json(travel_mode_str)
            except (ValueError, TypeError):  # Pro 2.5 throws a TypeError if travel_mode_str is not a JSON string
                if support_travel_mode_name is False:
                    self.logger.error("", extra={
                        "message_ID": 30207,
                        "add_argument1": travel_mode_str})
                    raise nat.ToolExit from None
                # Look up the travel mode by name from the portal.
                try:
                    travel_mode = self._get_travel_mode_from_portal()
                except ValueError:
                    #  Look up the travel mode by name from the network dataset.
                    self.logger.debug("Using travel mode from the network dataset")
                    nds_travel_modes = arcpy.na.GetTravelModes(self.network_dataset)
                    try:
                        travel_mode = nds_travel_modes[travel_mode_str]
                    except KeyError:
                        # Match partial time or distance based travel mode.
                        try:
                            travel_mode_str = self._match_partial_travel_mode_name(travel_mode_str)
                            travel_mode = nds_travel_modes[travel_mode_str]
                        except (ValueError, KeyError):
                            self.logger.error("", extra={
                                "message_ID": 30158,
                                "add_argument1": travel_mode_str,
                                "add_argument2": " | ".join('"' + name + '"' for name in nds_travel_modes)})
                            raise nat.ToolExit from None

        impedance = travel_mode.impedance
        if impedance not in nds_costs:
            # Fail as travel mode is from a different network dataset
            self.logger.error("", extra={
                "message_ID": 30232,
                "add_argument1": travel_mode_str
                })
            raise nat.ToolExit from None
        impedance_unit = nds_costs[impedance].units
        self.impedance_unit = impedance_unit  # Can be Unknown
        # Override any user defined measurement unit for other travel modes since we do not want client apps such as
        # Pro that only pass a travel mode and not measurment unit to fail for other travel modes.
        if impedance_unit.lower() == "unknown":
            self.measurement_unit = "Other"
            self.measurement_type = "OTHER"
        # ODCostMatrix solver tool does not have a notion of measurement type or measurement unit
        if not self.measurement_type:
            if not self.measurement_unit:
                self.measurement_unit = impedance_unit
            if impedance_unit in nax.TimeUnits.__members__:
                self.measurement_type = "TIME"
            elif impedance_unit in nax.DistanceUnits.__members__:
                self.measurement_type = "DISTANCE"
            else:
                self.measurement_type = "OTHER"
        # Need to check if travel mode impedance unit and measurement unit are compatible
        if self.measurement_type == "TIME":
            if impedance_unit not in nax.TimeUnits.__members__:
                self.logger.error("", extra={
                    "message_ID": 30149,
                    "add_argument1": self.measurement_unit,
                    "add_argument2": travel_mode.name})
                raise nat.ToolExit
            if impedance.lower() != travel_mode.timeAttributeName.lower():
                self.logger.error("", extra={
                    "message_ID": 30207,
                    "add_argument1": str(travel_mode)})
                self.logger.error("", extra={
                    "message_ID": 30196,
                    "add_argument1": "impedanceAttributeName",
                    "add_argument2": "timeAttributeName"})
                raise nat.ToolExit
        elif self.measurement_type == "DISTANCE":
            if impedance_unit not in nax.DistanceUnits.__members__:
                self.logger.error("", extra={
                    "message_ID": 30149,
                    "add_argument1": self.measurement_unit,
                    "add_argument2": travel_mode.name})
                raise nat.ToolExit
            if impedance.lower() != travel_mode.distanceAttributeName.lower():
                self.logger.error("", extra={
                    "message_ID": 30207,
                    "add_argument1": str(travel_mode)})
                self.logger.error("", extra={
                    "message_ID": 30196,
                    "add_argument1": "impedanceAttributeName",
                    "add_argument2": "distanceAttributeName"})
                raise nat.ToolExit
        else:
            if impedance_unit.lower() != "unknown":
                self.logger.error("", extra={
                    "message_ID": 30149,
                    "add_argument1": self.measurement_unit,
                    "add_argument2": travel_mode.name})
                raise nat.ToolExit

        # Ignore invalid restrictions from the travel mode
        nds_restrictions = self.nds_info.restrictions
        valid_restrictions = []
        invalid_restrictions = []
        for name in travel_mode.restrictions:
            if name in nds_restrictions:
                valid_restrictions.append(name)
            else:
                invalid_restrictions.append(name)
        if invalid_restrictions:
            self.logger.warning("", extra={
                "message_ID": 30113,
                "add_argument1": ", ".join("'" + name + "'" for name in invalid_restrictions)})
            travel_mode_dict = json.loads(str(travel_mode))
            travel_mode_dict["restrictionAttributeNames"] = valid_restrictions
            travel_mode = self._travel_mode_from_json(json.dumps(travel_mode_dict))

        # Ignore invalid attribute parameter values from the travel mode
        # Setting a travel mode with invalid attribute parameter raises a value error from the solver object starting
        # in Pro 2.5. So we are raising appropriate warnings or errors and updating the travel mode.
        # For Pro 2.4 we only raise the warnings and do not update the travel mode.
        nds_cost_restriction_attrs = tuple(nds_costs.keys()) + tuple(nds_restrictions.keys())
        nds_attr_params = {val[:-1]: val[-1] for val in self.nds_info.attribute_parameters.values()}
        tm_cost_restriction_attrs = travel_mode.restrictions + [travel_mode.impedance, travel_mode.timeAttributeName,
                                                                travel_mode.distanceAttributeName]
        restriction_usage_keywords = NDSInfo.RESTRICTION_USAGE_VALUES.values()
        tm_attr_params = travel_mode.attributeParameters
        invalid_attr_params = []
        for attr_params, param_value in tm_attr_params.items():
            attr_name, param_name = attr_params
            if attr_name in nds_cost_restriction_attrs:
                # Only raise warnings and errors if attribute is used in the travel mode costs and restrictions
                if attr_name in tm_cost_restriction_attrs:
                    if (attr_name, param_name) in nds_attr_params:
                        if param_value not in restriction_usage_keywords:
                            if isinstance(param_value, str):
                                try:
                                    locale.atof(param_value)
                                except ValueError:
                                    self.logger.error("", extra={
                                        "message_ID": 30132,
                                        "add_argument1": param_name,
                                        "add_argument2": attr_name
                                        })
                                    raise nat.ToolExit from None
                    else:
                        self.logger.warning("", extra={
                            "message_ID": 30130,
                            "add_argument1": param_name,
                            "add_argument2": attr_name
                            })
                        invalid_attr_params.append(attr_params)
                else:
                    # Need to ignore the invalid parameters on valid attributes.
                    if (attr_name, param_name) not in nds_attr_params:
                        invalid_attr_params.append(attr_params)
            else:
                self.logger.warning("", extra={
                    "message_ID": 30114,
                    "add_argument1": attr_name,
                    "add_argument2": param_name
                    })
                invalid_attr_params.append(attr_params)
        if invalid_attr_params:
            for attr_param in invalid_attr_params:
                tm_attr_params.pop(attr_param)
            try:
                travel_mode.attributeParameters = tm_attr_params
            except AttributeError:
                # In Pro 2.4, travel mode object is not writable. But the solver object in Pro 2.4 does not fail with
                # a ValueError if a travel mode object has invalid attribute parameter. So it is ok to not remove the
                # invalid attribute parameters from the travel mode.
                pass

        # Determine if the travel mode is for walking
        if "Walking" in travel_mode.restrictions or travel_mode.type == "WALK":
            self.is_walking_mode = True
        else:
            self.is_walking_mode = False
        return travel_mode

    @staticmethod
    def _travel_mode_from_json(json_string):
        """Return a travel mode object created from a JSON string.

        Args:
            json_string: Stringified JSON representation of the travel mode.
        Returns:
            A arcpy.na.TravelMode object
        Raises:
            TypeError if the json_string is not a valid JSON string.

        """
        if hasattr(arcpy.na.TravelMode, "_JSON"):
            travel_mode = arcpy.na.TravelMode()
            json_string = json_string.replace('\\"', '"')
            travel_mode._JSON = json_string  # as designed. pylint:disable=protected-access
        else:
            travel_mode = arcpy.na.TravelMode(json_string)
        return travel_mode

    def get_valid_accumulate_attributes(self):
        """Return a list of valid accumulate attribute names ignoring any invalid ones."""
        nds_costs = self.nds_info.costs["allCosts"]
        valid_costs = []
        invalid_costs = []
        for name in self.accumulate_attributes:
            if name in nds_costs:
                valid_costs.append(name)
            else:
                invalid_costs.append(name)
        if invalid_costs:
            self.logger.warning("", extra={
                "message_ID": 30128,
                "add_argument1": ", ".join("'" + name + "'" for name in invalid_costs)})
        return valid_costs

    def save_as_layer_file(self, result):
        """Save the analysis result as a layer file (.lyr) on disk.

        The layer is saved in arcpy.env.scratchFolder and has a randomly generated name that stars with _ags_gpna*.lyr

        Args:
            result: the result object returned from the solver object.

        Returns:
            No value but sets the full catalog of the output layer as self.output_layer_file

        """
        layer_file_name = f"_ags_gpna{uuid.uuid4().hex}"
        self.output_layer_file = os.path.join(arcpy.env.scratchFolder,  # False positive. pylint:disable=no-member
                                              f"{layer_file_name}.lyr")
        self.output_layer_package = os.path.join(arcpy.env.scratchFolder,  # False positive. pylint:disable=no-member
                                                 f"{layer_file_name}.lpkx")
        if self.__class__.__name__ != "SolveLastMileDelivery":
            self.logger.debug("Exporting output network analysis layer file to '%s'", self.output_layer_file)
            time_exec(result.saveAsLayerFile)(self.output_layer_file)
        self.logger.debug("Exporting output network analysis layer package to '%s'", self.output_layer_package)
        time_exec(result.saveAsLayerFile)(self.output_layer_package)

    def cleanup(self):
        """Perform any cleanups required when the analysis is done."""
        # Solver objects can leak if not cleaned up before exiting the python process
        if self.solver_object:
            del self.solver_object

    @time_exec
    def create_result_file(self, datasets, file_type="JSON File"):
        """Export one or more datasets to JSON, GEOJSON, or CSV files and return a zip file containing the files.

        Args:
            datasets: A dict of feature classes or tables to convert to files. Key is feature class or table and value
                      is one of 'FEATURECLASS' or 'TABLE'
            file_type: The type of file containing the features and tables. Valid values are 'JSON File',
                       'GeoJSON File', and 'CSV File'

        Returns:
            The full path to the zip file containing all the files. The zip file is created in arcpy.env.ScratchFolder

        Raises:
            No exceptions.

        """
        time_stamp = time.strftime("%Y%m%d_%H%M%S", time.localtime())
        output_folder = arcpy.env.scratchFolder  # False positive. pylint:disable=no-member
        results_folder = os.path.join(output_folder, f"naresults_{time_stamp}_{uuid.uuid4().hex}")
        os.makedirs(results_folder, exist_ok=True)

        for dataset, dataset_type in datasets.items():
            if not dataset:
                continue
            if file_type == "CSV File":
                output_file = os.path.join(results_folder, f"{os.path.basename(dataset)}.csv")
                arcpy.management.CopyRows(dataset, output_file)
            elif file_type == "JSON File":
                output_file = os.path.join(results_folder, f"{os.path.basename(dataset)}.json")
                if dataset_type == "FEATURECLASS":
                    arcpy.conversion.FeaturesToJSON(dataset, output_file, format_json=False, include_z_values=True,
                                                    include_m_values=True, geoJSON=False)
                else:
                    self._table_to_json(dataset, output_file, geo_json=False)
            else:
                output_file = os.path.join(results_folder, f"{os.path.basename(dataset)}.geojson")
                if dataset_type == "FEATURECLASS":
                    arcpy.conversion.FeaturesToJSON(dataset, output_file, format_json=False, include_z_values=True,
                                                    include_m_values=True, geoJSON=True, outputToWGS84=False)
                else:
                    self._table_to_json(dataset, output_file, geo_json=True)
        output_results_file = shutil.make_archive(results_folder, "zip", results_folder)
        shutil.rmtree(results_folder, ignore_errors=True)
        return output_results_file

    @staticmethod
    def _table_to_json(table, output_file, geo_json=False):
        """Convert a table to JSON or GeoJSON format.

        Args:
            table: The input table
            output_file: The full path to the output file that includes the .json or .geojson extension
            geo_json: If True, write the table in GeoJSON format else write in Esri JSON format.

        Returns:
            No value.

        Raises:
            No exceptions.

        """
        record_set = arcpy.RecordSet(table)
        esri_json = json.loads(record_set.JSON)
        output_json = {}
        if geo_json:
            # GeoJSON spec for writing features https://tools.ietf.org/html/rfc7946#section-3.2
            oid_field_name = "ObjectID"
            geo_json = {
                "type": "FeatureCollection",
                "crs": None,
                "features": [],
            }
            for index, row in enumerate(esri_json["features"]):
                attributes = row["attributes"]
                features = geo_json["features"]
                feature = {
                    "type": "Feature",
                    "id": attributes.get(oid_field_name, index + 1),
                    "geometry": None,
                    "properties": attributes
                }
                features.append(feature)
            output_json = geo_json
        else:
            output_json = esri_json

        with open(output_file, "w", encoding="utf-8") as out_fp:
            json.dump(output_json, out_fp)

    @time_exec
    def select_network_dataset(self, input_datasets):
        """Determine the network dataset to use for the analysis.

        Args:
            input_datasets: A list of all the input feature classes that should be considered when brokering.
        Returns:
            None
        Raises:
            A terminating error (nat.ToolExit) if the input points do not fall within any extent or if they are not all
            within a single extent.
            ValueError if the input points do not contain any features.

        """
        conn_file = ""
        service_name = ""
        output_nds = ""
        provider = ""
        if len(self.network_datasets) == 1:
            output_nds = self.network_datasets[0]
        else:
            # On server, the ND layers are available as child layers within a group layer such as servicename/layername.
            # But analysis_region and network dataset extents layer only stores layer names
            nd_names = {}
            for nds in self.network_datasets:
                if hasattr(nds, "name"):
                    nd_names[nds.name] = nds
                else:
                    nd_names[os.path.basename(nds)] = nds
            # If the analysis region is specified, there is no need for brokering.
            if self.analysis_region:
                where_clause = f"{self.extent_fields[0]} = '{self.analysis_region}'"
                with arcpy.da.SearchCursor(self.nd_extents,  # False positive. pylint: disable=no-member
                                            self.extent_fields, where_clause) as cursor:
                    row = cursor.next()
                output_nds = nd_names[row[0]]
                provider = row[1]
                remote_service_info = row[3]
                if remote_service_info:
                    conn_file_name, service_name = remote_service_info.split(";", 1)
                    desc_extent_layer = arcpy.Describe(self.nd_extents)
                    conn_file = os.path.join(os.path.dirname(os.path.dirname(desc_extent_layer.catalogPath)),
                                                conn_file_name)
            else:
                # Use extent polygons to broker to a network dataset
                with PerfTimer("SwizzleTimeInSeconds"):
                    output_nds, conn_file, service_name, provider = nax.SelectNetworkDataset(input_datasets,
                                                                                                self.nd_extents,
                                                                                                self.extent_fields[3],
                                                                                                self.extent_fields[0],
                                                                                                self.extent_fields[2],
                                                                                                self.extent_fields[1])
                SERVER_PERF_METRICS["SwizzledTo"] = output_nds
                # Fail if the points do not fall in any extent
                if output_nds == "":
                    self.logger.error("", extra={"message_ID": 30137})
                    raise nat.ToolExit
                output_nds = nd_names.get(output_nds, output_nds)

        self.conn_file = conn_file
        self.network_dataset = output_nds
        self.remote_svc_name = service_name
        self.provider = provider
        self.logger.debug("Network dataset used for analysis: %s", self.network_dataset)

    def _select_nd_extent_polygons(self, input_datasets):
        """Select network dataset based on polygons representing the extent of the network dataset.

        The first point from the first input dataset is used to determine the network dataset. For example, for
        Location-Allocation, the first demand point is evaluated to see if it falls in at least one extent polygon.
            - If the first point is not within any extent polygon, then the returned network dataset name is empty.
            - If the first point falls in only one extent, return the region name as the network dataset name assuming
              that all the points from all the input datasets will be in the same region.
            - If the first point falls in more than one extent, then combine all the points from all inputs.
                  - If all the inputs are in a single extent, return the region name.
                  - If all the inputs are in two extents, use the region name with a lower rank.
                  - If all the inputs are not in any extent, fail with a message saying that all points are not in a
                    single extent.

        Args:
            input_datasets: A list of all the input feature classes that should be considered.

        Returns:
           The name of the region that contains the inputs. For remote region, the connection file name and the service
           name used to excute the requests for the remote region is also returned.

        Raises:
            A terminating error (nat.ToolExit) if the input points do not fall within any extent or if they are not all
            within a single extent.

        """
        output_nds = ""
        conn_file = ""
        remote_svc_name = ""
        remote_conn_info = None
        selected_row_count = 0

        # Get the first point from the first dataset. Always project geometry to spatial reference of extent polygons.
        nd_extents_sr = arcpy.Describe(self.nd_extents).spatialReference
        with arcpy.da.SearchCursor(input_datasets[0], "SHAPE@", "",  # False positive. pylint:disable=no-member
                                   nd_extents_sr) as cursor:
            first_point = cursor.next()[0]

        # If output coordinate system is set, we still need to use the coordinate system of the extent polygons.
        orig_output_sr = arcpy.env.outputCoordinateSystem  # pylint:disable=no-member
        arcpy.env.outputCoordinateSystem = nd_extents_sr  # pylint:disable=assigning-non-slot
        layer_with_selection = arcpy.management.SelectLayerByLocation(self.nd_extents, "COMPLETELY_CONTAINS",
                                                                      first_point).getOutput(0)

        with arcpy.da.SearchCursor(layer_with_selection,  # False positive. pylint:disable=no-member
                                   self.extent_fields) as cursor:
            for row in cursor:
                # For most cases, we should have only one selected row if the point falls into only one polygon
                selected_row_count += 1
                if selected_row_count == 1:
                    output_nds = row[0]
                    remote_conn_info = row[-1]  # connection info is in the last field
                else:
                    # The first point falls in multiple polygons. Create a multipoint with all the inputs
                    point_list = []
                    for dataset in input_datasets:
                        with arcpy.da.SearchCursor(dataset, "SHAPE@", "",  # False positive. pylint:disable=no-member
                                                   nd_extents_sr) as cursor:
                            point_list += [row[0].firstPoint for row in cursor]
                    multi_point = arcpy.Multipoint(arcpy.Array(point_list), nd_extents_sr)
                    # Check if multipoint is in at least one region. If yes select the region with highest rank else
                    # return an error
                    overlapping_nd_extents = arcpy.management.SelectLayerByLocation(self.nd_extents,
                                                                                    "COMPLETELY_CONTAINS",
                                                                                    multi_point).getOutput(0)
                    arcpy.management.Delete(multi_point)
                    with arcpy.da.SearchCursor(overlapping_nd_extents,  # False positive. pylint:disable=no-member
                                               self.extent_fields) as cursor:
                        # Sort by rank field (second field in the cursor)
                        sorted_cursor = sorted(cursor, key=lambda row: row[1])
                    if sorted_cursor:
                        # pick the first row
                        first_row = sorted_cursor[0]
                        output_nds = first_row[0]
                        remote_conn_info = first_row[-1]
                    else:
                        self.logger.error("", extra={"message_ID": 30140})
                        raise nat.ToolExit
                    # break out of loop in case we have more than 2 polygons that contain input points
                    break

        # Check if the selected network dataset is for a remote region
        if remote_conn_info:
            # Connection file is in same workspace as layer
            conn_file_name, remote_svc_name = remote_conn_info.split(";", 1)
            conn_file_dir = os.path.dirname(layer_with_selection.connectionProperties['connection_info']['database'])
            conn_file = os.path.join(conn_file_dir, conn_file_name)

        arcpy.management.SelectLayerByAttribute(self.nd_extents, "CLEAR_SELECTION")
        arcpy.env.outputCoordinateSystem = orig_output_sr  # pylint:disable=assigning-non-slot

        # Fail if the points do not fall in any extent
        if output_nds == "":
            self.logger.error("", extra={"message_ID": 30137})
            raise nat.ToolExit

        return (output_nds, conn_file, remote_svc_name)

    def _create_custom_travel_mode(self):
        """Return a travel mode object based on tool parameters such as restrictions.

        Returns:
            An arcpy.na.TravelMode object.
        Raises:
            - nat.ToolExit if the impedance attribute unit and measurement unit are not both time, distance or other.
            - nat.ToolExit if impedance attribute is time based and time impedance value does not match impedance
              attribute value.
            - nat.ToolExit if impedance attribute is distance based and distance impedance value does not match
              impedance attribute value.

        """
        # Create new travel mode as a dict and populate the dict using tool parameters
        self.logger.debug("creating custom travel mode from tool parameters")
        custom_travel_mode = json.loads(str(arcpy.na.TravelMode(None)))
        custom_travel_mode["name"] = "Custom"
        custom_travel_mode["type"] = "OTHER"
        custom_travel_mode["description"] = ("Collection of network dataset settings that define actions that are"
                                             "allowed on the network and how the actions can be performed.")
        custom_travel_mode["distanceAttributeName"] = self.distance_impedance
        custom_travel_mode["timeAttributeName"] = self.time_impedance
        # Account for impedance keywords such as 'Drive Time' making sure we never have a mismatch between impedance
        # and time impedance for time based travel modes and between impedance and distance impedance for distance based
        # travel modes.
        if self.impedance in self.IMPEDANCE_NAMES:
            if self.impedance == "Travel Distance":
                impedance = self.distance_impedance
            else:
                impedance = self.time_impedance
        else:
            impedance = self.impedance
        # impedance = self.nds_info.impedance_map.get(self.impedance, self.impedance)
        custom_travel_mode["impedanceAttributeName"] = impedance
        impedance_unit = self.nds_info.costs["allCosts"][impedance].units
        # Override any user defined measurement unit for other travel modes since we do not want client apps such as
        # Pro that only pass a travel mode and not measurment unit to fail for other travel modes.
        if impedance_unit.lower() == "unknown":
            self.measurement_unit = "Other"
            self.measurement_type = "OTHER"
        # ODCostMatrix solver tool does not have a notion of measurement type or measurement unit
        if not self.measurement_type:
            if not self.measurement_unit:
                self.measurement_unit = impedance_unit
            if impedance_unit in nax.TimeUnits.__members__:
                self.measurement_type = "TIME"
            elif impedance_unit in nax.DistanceUnits.__members__:
                self.measurement_type = "DISTANCE"
            else:
                self.measurement_type = "OTHER"
        # Check if measurement unit and travel mode unit are of the same type
        if self.measurement_type == "TIME":
            if impedance_unit not in nax.TimeUnits.__members__:
                self.logger.error("", extra={
                    "message_ID": 30148,
                    "add_argument1": self.measurement_unit,
                    "add_argument2": self.impedance})
                raise nat.ToolExit
            if impedance.lower() != self.time_impedance.lower():
                self.logger.error("", extra={
                    "message_ID": 30196,
                    "add_argument1": "Impedance",
                    "add_argument2": "Time_Impedance"})
                raise nat.ToolExit
        elif self.measurement_type == "DISTANCE":
            if impedance_unit not in nax.DistanceUnits.__members__:
                self.logger.error("", extra={
                    "message_ID": 30148,
                    "add_argument1": self.measurement_unit,
                    "add_argument2": self.impedance})
                raise nat.ToolExit
            if impedance.lower() != self.distance_impedance.lower():
                self.logger.error("", extra={
                    "message_ID": 30196,
                    "add_argument1": "Impedance",
                    "add_argument2": "Distance_Impedance"})
                raise nat.ToolExit
        else:
            if impedance_unit.lower() != "unknown":
                self.logger.error("", extra={
                    "message_ID": 30148,
                    "add_argument1": self.measurement_unit,
                    "add_argument2": self.impedance})
                raise nat.ToolExit
        custom_travel_mode["restrictionAttributeNames"] = self.restrictions
        custom_travel_mode["useHierarchy"] = self.use_hierarchy
        custom_travel_mode["uturnAtJunctions"] = self.ESRI_UTURNS[self.uturn_at_junctions]
        custom_travel_mode["simplificationTolerance"] = self.simp_tol
        custom_travel_mode["simplificationToleranceUnits"] = self.ESRI_UNITS.get(self.simp_tol_unit, "esriUnknownUnits")
        attr_param_values = []
        fields = ("attributeName", "parameterName", "value")
        # False positive. pylint: disable=no-member
        if self._is_valid(self.attribute_parameter_values):
            with arcpy.da.SearchCursor(self.attribute_parameter_values, self.ATTR_PARAMS_FIELDS) as cursor:
                try:
                    for row in cursor:
                        # attribute parameter values can be Null
                        if row[-1]:
                            try:
                                attr_param_val = locale.atof(row[-1])
                            except ValueError:
                                attr_param_val = row[-1]
                        else:
                            attr_param_val = row[-1]
                        attr_param_values.append(dict(zip(fields, (row[0], row[1], attr_param_val))))
                except RuntimeError:
                    # Check if input attribute_parameter_values do not have required fields
                    attr_param_value_flds = [field.name for field in arcpy.ListFields(self.attribute_parameter_values)]
                    if set(self.ATTR_PARAMS_FIELDS).issubset(attr_param_value_flds):
                        # RuntimeError is because of some other issue.
                        raise
                    self.logger.error("", extra={
                        "message_ID": 30108,
                        "add_argument1": "Attribute_Parameter_Values"
                    })
                    raise nat.ToolExit from None

        custom_travel_mode["attributeParameterValues"] = attr_param_values
        # pylint: enable=no-member
        return self._travel_mode_from_json(json.dumps(custom_travel_mode))

    def _get_travel_mode_from_portal(self):
        """Return the travel mode object based on the travel mode name from the portal.

        First get the JSON for the travel mode name and the convert the JSON to a travel mode object.

        Raises:
            A ValueError if the travel mode with the specified name does not exist in the portal.

        """
        travel_mode_str = self.travel_mode
        active_portal = arcpy.GetActivePortalURL()
        if not active_portal:
            self.logger.debug("Running on a standalone server")
            raise ValueError
        self.logger.debug("Getting travel modes from portal %s.", active_portal)
        eng_portal_travel_modes = arcpy.na.GetTravelModes(active_portal)
        localized_portal_travel_modes = {value.name: value for key, value in eng_portal_travel_modes.items()}
        portal_travel_modes = {**eng_portal_travel_modes, **localized_portal_travel_modes}
        try:
            return portal_travel_modes[travel_mode_str]
        except KeyError:
            # Match partial time or distance based travel mode.
            travel_mode_str = self._match_partial_travel_mode_name(travel_mode_str)
            try:
                return portal_travel_modes[travel_mode_str]
            except (ValueError, KeyError):
                self.logger.error("", extra={
                    "message_ID": 30158,
                    "add_argument1": travel_mode_str,
                    "add_argument2": " | ".join('"' + name + '"' for name in portal_travel_modes)})
                raise nat.ToolExit from None

    def _call_remote_tool(self, task_params, restrictions_param_index=None):
        """Call a remote geoprocessing service and returns the result from tool execution.

        Args:
            task_params: A list of parameter values used to call the remote tool.
            restrictions_param_index: The index of the restrictions parameter in the tasks_params list. A value of None
                                      implies that task_params do not have restrictions parameter.

        Returns:
            A geoprocessing result object of type arcpy.Result based on the tool execution.

        Raises:
            arcpy.ExecuteError if the remote toolbox cannot be added.

        """
        # Get the service_name and task_name and task_alias from the service
        service_name, task_name = self.remote_svc_name.split(";")
        task_alias = service_name.split("/")[-1]

        # Add the remote toolbox
        tbx = f"{self.conn_file};{service_name}"
        try:
            arcpy.gp.addToolbox(tbx)
        except Exception:
            raise arcpy.ExecuteError(f"Failed to add the remote toolbox {tbx}") from None

        # Ignore restrictions that are not supported by the remote service.
        tool_name = f"{task_name}_{task_alias}"
        if restrictions_param_index:
            cached_file = Path(self.conn_file)
            cached_file = cached_file.parent.joinpath(cached_file.stem + "_GPServices.cached")
            if cached_file.exists():
                self.logger.debug("Reading remote restrictions from %s", cached_file)
                with cached_file.open("r", encoding="utf-8") as cached_fp:
                    cached_json = json.load(cached_fp)
                remote_restrictions = cached_json[f"{service_name}/{task_name}"]["Restrictions"]
            else:
                try:
                    remote_restrictions_param = arcpy.GetParameterInfo(tool_name)[restrictions_param_index]
                    remote_restrictions = remote_restrictions_param.filter.list
                except Exception:  # Need to succeed in all cases. pylint:disable=broad-except
                    self.logger.debug("Failed to determine remote restrictions", exec_info=True)
                    remote_restrictions = self.restrictions

            valid_restrictions = []
            invalid_restrictions = []
            for name in self.restrictions:  # Set as a list by the child class. pylint:disable=not-an-iterable
                if name in remote_restrictions:
                    valid_restrictions.append(name)
                else:
                    invalid_restrictions.append(name)
            if invalid_restrictions:
                self.logger.warning("", extra={
                    "message_ID": 30113,
                    "add_argument1": ", ".join("'" + name + "'" for name in invalid_restrictions)})
            task_params[restrictions_param_index] = valid_restrictions
        # Execute the tool
        tool = getattr(arcpy.gp, tool_name)
        result = tool(*task_params)
        while result.status < 4:
            time.sleep(1)

        # Add all the messages
        severity = result.maxSeverity
        msg = f"Ran job {result.resultID} against remote tool {task_name} within {service_name}"
        self.logger.debug(msg)
        self.logger.info(msg, extra={"code": 20039, "method_name": tool_name})
        self.logger.debug("Messages from remote tool execution")
        if severity == 0:
            for msg in result.getMessages(severity).split("\n"):
                if msg:
                    self.logger.debug(msg)
        elif severity == 1:
            for msg in result.getMessages(severity).split("\n"):
                if msg:
                    if "WARNING 030210" in msg:
                        msg_code = 30210
                        msg_text = msg[msg.find("{"):]
                        self.solver_perf_metrics = json.loads(msg_text)
                        self.logger.info(msg_text, extra={"code": 13034, "method_name": task_name})
                        if msg_code not in self.system_solver_overrides_message_codes:
                            self.logger.warning(msg)
                    elif "WARNING 030211" in msg:
                        msg_code = 30211
                        msg_text = msg[msg.find("{"):]
                        self.logger.info(msg_text, extra={"code": 30211, "method_name": task_name})
                        if msg_code not in self.system_solver_overrides_message_codes:
                            self.logger.warning(msg)
                    elif "WARNING 030348" in msg:
                        msg_code = 30348
                        msg_text = msg[msg.find("{"):]
                        self.logger.info(msg_text, extra={"code": 13035, "method_name": task_name})
                        if msg_code not in self.system_solver_overrides_message_codes:
                            self.logger.warning(msg)
                    elif "WARNING 030349" in msg:
                        msg_code = 30348
                        msg_text = msg[msg.find("{"):]
                        SERVER_PERF_METRICS["RemotePerformanceMetrics"] = json.loads(msg_text)
                    else:
                        self.logger.warning(msg)

        else:
            for msg in result.getMessages(1).split("\n"):
                if msg:
                    self.logger.warning(msg)
            for msg in result.getMessages(2).split("\n"):
                if msg:
                    self.logger.error(msg)

        arcpy.gp.removeToolbox(tbx)
        return result

    @time_exec
    def _check_line_barrier_type(self):
        """Raise a terminating error if at least one scaled cost line barrier is passed as input."""
        if not self._is_valid(self.line_barriers):
            return
        if not hasattr(self.line_barriers, "JSON"):
            return
        try:
            line_barriers_json = json.loads(self.line_barriers.JSON)
        except json.JSONDecodeError:
            # Empty line barriers feature set
            return
        barrier_type_field = ""
        for fld in line_barriers_json["fields"]:
            if fld["name"].lower() == "barriertype":
                barrier_type_field = fld["name"]
                break
        if not barrier_type_field:
            return
        scaled_barrier_count = 0
        for feature in line_barriers_json["features"]:
            if feature["attributes"][barrier_type_field] == 1:
                scaled_barrier_count += 1
        if scaled_barrier_count:
            self.logger.error("", extra={"message_ID": 30190})
            raise nat.ToolExit

    @time_exec
    def _check_barrier_limits(self):
        """Check if the barrier features intersecting street features is within expected limits."""
        # Remote network datasets do not work with arcpy.na.CheckIntersectingFeatures.
        # For remote services barrier limit check is performed as part of the remote service execution.
        if self.conn_file:
            return
        point_barrier_limit = self.limits.get("maximumFeaturesAffectedByPointBarriers", None)
        if point_barrier_limit and self._is_valid(self.point_barriers):
            if arcpy.na.CheckIntersectingFeatures(self.network_dataset,
                                                  self.point_barriers, point_barrier_limit) is False:
                self.logger.error("", extra={
                    "message_ID": 30095,
                    "add_argument1": "PointBarriers",
                    "add_argument2": point_barrier_limit})
                raise nat.ToolExit

        line_barrier_limit = self.limits.get("maximumFeaturesAffectedByLineBarriers", None)
        if line_barrier_limit and self._is_valid(self.line_barriers):
            if arcpy.na.CheckIntersectingFeatures(self.network_dataset,
                                                  self.line_barriers, line_barrier_limit) is False:
                self.logger.error("", extra={
                    "message_ID": 30095,
                    "add_argument1": "PolylineBarriers",
                    "add_argument2": line_barrier_limit})
                raise nat.ToolExit

        polygon_barrier_limit = self.limits.get("maximumFeaturesAffectedByPolygonBarriers", None)
        if polygon_barrier_limit and self._is_valid(self.polygon_barriers):
            if arcpy.na.CheckIntersectingFeatures(self.network_dataset, self.polygon_barriers,
                                                  polygon_barrier_limit) is False:
                self.logger.error("", extra={
                    "message_ID": 30095,
                    "add_argument1": "PolygonBarriers",
                    "add_argument2": polygon_barrier_limit})
                raise nat.ToolExit

    def _validate(self):
        """Raise a termination exception if a validation check fails.

        Raises:
            ToolExit for a failed validation check.

        """
        self._check_line_barrier_type()

    def _get_analysis_limits(self, limits):
        """Return a dictionary of analysis limits by converting numeric strings to numbers.

        Args:
            limits: A value table object obtained when calling arcpy.GetParameter
        Returns:
            A dictionary with key as limit name and value as int, float or string type. If a limit is not specified,
            the value is returned as None.
        Raises:
            No exceptions.

        """
        limits_dict = {}
        for key, value in dict(self.read_value_table(limits)).items():
            if value:
                try:
                    value = locale.atoi(value)
                except ValueError:
                    try:
                        value = locale.atof(value)
                    except ValueError:
                        pass  # Value is a valid string
                limits_dict[key] = value
            else:
                # Assume value is numeric but represented as empty string
                limits_dict[key] = None
        return limits_dict

    @time_exec
    def _force_hierarchy_alt(self, datasets):
        """Check if hierarchy needs to be forced based on straight line distance between inputs.

        Args:
            datasets: A iterable of all the input datasets that should be used for enforcing hierarchy.
        Returns:
            True if hierarchy is to be enforced.

        """
        force_hier_limit = self.limits.get("forceHierarchyBeyondDistance", None)
        if not force_hier_limit:
            return False
        force_hier_limit_unit = self.limits.get("forceHierarchyBeyondDistanceUnits", "Miles")

        # We cannot get the extent by describing the dataset since feature sets do not have extents.
        # Create a multi-point geometry from the combined shapes of all inputs
        # The spatial reference of the multi-point is assumed to be that of the first point of the first input.
        pt_array = arcpy.Array()
        multi_point_sr = arcpy.Describe(datasets[0]).spatialReference
        for dataset in datasets:
            with arcpy.da.SearchCursor(dataset, "SHAPE@",  # False positive. pylint: disable=no-member
                                       spatial_reference=multi_point_sr) as cursor:
                for row in cursor:
                    pt_array.add(row[0].firstPoint)
        combined_extent = arcpy.Multipoint(pt_array, multi_point_sr).extent
        extent_diagonal = arcpy.Polyline(arcpy.Array((combined_extent.lowerLeft, combined_extent.upperRight)),
                                         multi_point_sr)
        max_distance = extent_diagonal.getLength("GEODESIC", force_hier_limit_unit)
        self.logger.debug("Line distance between input points: %s %s", max_distance, force_hier_limit_unit)
        if max_distance > force_hier_limit:
            self.logger.warning("", extra={"message_ID": 30109})
            self.logger.warning("", extra={
                "message_ID": 30127,
                "add_argument1": f"{force_hier_limit} {force_hier_limit_unit}",
                })
            return True

        return False

    @time_exec
    def _force_hierarchy(self):
        """Check if hierarchy needs to be forced based on straight line distance between inputs.

        Returns:
            True if hierarchy is to be enforced.
        Raises:
            No exceptions

        """
        force_hier_limit = self.limits.get("forceHierarchyBeyondDistance", None)
        if not force_hier_limit:
            return False
        force_hier_limit_unit = self.limits.get("forceHierarchyBeyondDistanceUnits", "Miles")
        self.logger.debug("Line distance between input points: %s meters.", self.max_meters_amid_inputs)
        max_distance = self.convert_value(self.max_meters_amid_inputs, "Meters", force_hier_limit_unit)
        if max_distance > force_hier_limit:
            # Do not force hierarchy if the network dataset does not support hierarchy
            if self.nds_info.hierarchy_attribute is None:
                self.logger.warning("", extra={
                    "message_ID": 30119,
                    "add_argument1": "forceHierarchyBeyondDistance limit"
                })
                return False
            self.logger.warning("", extra={"message_ID": 30109})
            self.logger.warning("", extra={
                "message_ID": 30127,
                "add_argument1": f"{force_hier_limit} {force_hier_limit_unit}",
                })
            return True

        return False

    @time_exec
    def _check_walking_limit(self):
        """Raise a terminating error if the distance limit while walking is exceeded."""
        if not self.is_walking_mode:
            return
        walking_limit = self.limits.get("maximumGeodesicDistanceWhenWalking", None)
        if not walking_limit:
            return
        walking_limit_unit = self.limits.get("maximumGeodesicDistanceUnitsWhenWalking", "Miles")
        self.logger.debug("Line distance between input points: %s meters.", self.max_meters_amid_inputs)
        max_distance = self.convert_value(self.max_meters_amid_inputs, "Meters", walking_limit_unit)
        if max_distance > walking_limit:
            self.logger.error("", extra={
                "message_ID": 30145,
                "add_argument1": self.convert_value(walking_limit, walking_limit_unit, "Miles"),
                "add_argument2": self.convert_value(walking_limit, walking_limit_unit, "Kilometers")
            })
            raise nat.ToolExit

    @time_exec
    def _check_problem_extent_limit(self):
        """Raise a terminating error if the geodesic distance between inputs is greater than the limit."""
        extent_limit = self.limits.get("maximumGeodesicDistance", None)
        if not extent_limit:
            return
        extent_limit_unit = self.limits.get("maximumGeodesicDistanceUnits", "Miles")
        self.logger.debug("Line distance between input points: %s meters.", self.max_meters_amid_inputs)
        max_distance = self.convert_value(self.max_meters_amid_inputs, "Meters", extent_limit_unit)
        if max_distance > extent_limit:
            self.logger.error("", extra={
                "message_ID": 30365,
                "add_argument1": self.convert_value(extent_limit, extent_limit_unit, "Miles"),
                "add_argument2": self.convert_value(extent_limit, extent_limit_unit, "Kilometers")
            })
            raise nat.ToolExit

    @time_exec
    def _check_max_output_features(self, dataset, error_code):
        """Check if the output feature count exceeds the maximum records successfully returned by the service.

        Args:
            dataset: The output dataset to check. The value must be a member of result output data type enum.
            error_code: The GP error message code used if the check fails.

        Returns:
            No value.

        Raises:
            nat.ToolExit if the check fails.

        """
        # Check is applicable only when returning output as features and should be skipped when returning output as file
        if self.output_format != "Feature Set":
            return
        if self.max_output_features is None:
            self.logger.info("Skipping the max output features check since the limit is unknown.")
            return
        output_feature_count = self.solver_result.count(dataset)
        if output_feature_count > self.max_output_features:
            self.logger.error("", extra={
                "message_ID": error_code,
                "add_argument1": output_feature_count,
                "add_argument2": self.max_output_features,
            })
            raise nat.ToolExit

    @time_exec
    def _check_vertex_count(self, dataset):
        """Check if the total vertex count from all the features in the feature class exceeds the max threshold.

        This is checked only when the tool is called from a REST endpoint.

        Args:
            dataset: The output dataset to check.

        Returns:
            No value.

        Raises:
            nat.ToolExit if the check fails.

        """
        vertex_count = 0
        called_from_rest = False
        if arcpy.gp.IsRunningInServer():
            if hasattr(arcpy.gp, "isRESTProtocol"):
                called_from_rest = arcpy.gp.isRESTProtocol
        # called_from_rest = arcpy.gp.IsRunningInServer() and arcpy.gp.isRESTProtocol
        if not called_from_rest:
            return
        with arcpy.da.SearchCursor(dataset, "SHAPE@") as cursor:  # False positive. pylint:disable=no-member
            for row in cursor:
                if row[0]:
                    vertex_count += row[0].pointCount
        self.logger.info("Vertex count for output %s: %s", os.path.basename(dataset), vertex_count)
        if vertex_count > self.MAX_VERTEX_COUNT:
            self.logger.error("", extra={"message_ID": 30224})
            raise nat.ToolExit

    @time_exec
    def _constrain_search_space(self, datasets, solver_input_type):
        """Constrain the search space for exact solves.

        The function calculates the centroid of the combined inputs, buffers the centroid by maximum distance between
        the inputs, and uses the extent of the buffer to create the constraining lines. The lines are loaded as line
        barriers to constrain the search space.

        Args:
            datasets: A iterable of all the input datasets that are used for enforcing hierarchy.
            solver_input_type: The data type for line barriers for the solver object such as
                               nax.RouteInputDataType.LineBarrier
        Returns:
            None
        Raises:
            No exception.

        """
        # Get the centroid of the combined extent of all the inputs.
        # We cannot get the extent by describing the dataset since feature sets do not have extents.
        # Create a multi-point geometry from the combined shapes of all inputs
        # The spatial reference of the multi-point is assumed to be that of the first point of the first input.
        pt_array = arcpy.Array()
        multi_point_sr = arcpy.Describe(datasets[0]).spatialReference
        for dataset in datasets:
            with arcpy.da.SearchCursor(dataset, "SHAPE@",  # False positive. pylint: disable=no-member
                                       spatial_reference=multi_point_sr) as cursor:
                for row in cursor:
                    pt_array.add(row[0].firstPoint)
        combined_extent_centroid = arcpy.PointGeometry(arcpy.Multipoint(pt_array, multi_point_sr).centroid,
                                                       multi_point_sr)
        # Buffer the centroid by maximum distance between inputs
        # Conver the buffer distance in the unit of the spatial reference
        if multi_point_sr.type == "Projected":
            buffer_dist = self.max_meters_amid_inputs / multi_point_sr.metersPerUnit
        else:
            # assume one degree has 70 miles or 112654 meters.
            buffer_dist = self.max_meters_amid_inputs / 112654
        buffered_extent = combined_extent_centroid.buffer(buffer_dist).extent
        # Create the four lines representing the extent
        extent_bottom = arcpy.Polyline(arcpy.Array((buffered_extent.lowerLeft, buffered_extent.lowerRight)),
                                       multi_point_sr)
        extent_right = arcpy.Polyline(arcpy.Array((buffered_extent.lowerRight, buffered_extent.upperRight)),
                                      multi_point_sr)
        extent_top = arcpy.Polyline(arcpy.Array((buffered_extent.upperRight, buffered_extent.upperLeft)),
                                    multi_point_sr)
        extent_left = arcpy.Polyline(arcpy.Array((buffered_extent.upperLeft, buffered_extent.lowerLeft)),
                                     multi_point_sr)
        extent_barriers = (extent_bottom, extent_right, extent_top, extent_left)
        self.logger.debug("Loading line barriers to constrain search space for the solver")
        with self.solver_object.insertCursor(solver_input_type, ["SHAPE@"]) as lb_cur:
            for barrier in extent_barriers:
                lb_cur.insertRow((barrier, ))

    @time_exec
    def _add_route_cutoff(self):
        """Add a route cutoff to constrain exact solves."""
        # The route cutoff is based on the force-hierarchy value for non-walking travel modes.
        force_hier_limit = self.limits.get("forceHierarchyBeyondDistance", None)
        force_hier_limit_unit = self.limits.get("forceHierarchyBeyondDistanceUnits", "Miles")
        if self.is_walking_mode:
            force_hier_limit = self.limits.get("maximumGeodesicDistanceWhenWalking", None)
            force_hier_limit_unit = self.limits.get("maximumGeodesicDistanceUnitsWhenWalking", "Miles")
        if not force_hier_limit:
            return

        # Calculate route cutoff in impedance units based on whether tha analysis is time-based or distance-based
        if self.measurement_type == "TIME":
            route_cutoff_km = self.convert_value(force_hier_limit, force_hier_limit_unit, "Kilometers")
            route_cutoff_km = route_cutoff_km * self.ROUTE_CUTOFF_FACTOR
            travel_mode = self.solver_object.travelMode
            travel_mode_impedance = travel_mode.impedance
            # Calculate cutoff in minutes using the walking speed defined on the WalkTime attribute if walking
            # or a fixed speed for all other time-based impedance attributes
            if travel_mode_impedance == "WalkTime" or travel_mode.type == "WALK":
                impedance_attr_params = {k: v for k, v in travel_mode.attributeParameters.items()
                                         if travel_mode_impedance in k}
                walking_speed = impedance_attr_params.get((travel_mode_impedance, "Walking Speed (km/h)"), 5)
                route_cutoff = route_cutoff_km * 60 / walking_speed
            else:
                route_cutoff = route_cutoff_km * 60 / self.ROUTE_CUTOFF_NON_WALK_SPEED
            route_cutoff = self.convert_value(route_cutoff, "Minutes", self.impedance_unit)
        elif self.measurement_type == "DISTANCE":
            route_cutoff = self.convert_value(force_hier_limit, force_hier_limit_unit, self.impedance_unit)
            route_cutoff = route_cutoff * self.ROUTE_CUTOFF_FACTOR
        else:
            return

        # Set the RouteCutoff solver override if the solver object does not support a defaultImpedanceCutoff property
        if hasattr(self.solver_object, "defaultImpedanceCutoff"):
            orig_cutoff = self.solver_object.defaultImpedanceCutoff
            # defaultImpedanceCutoff is in timeUnits or distanceUnits. So convert route_cutoff to those units
            if self.measurement_type == "TIME":
                orig_cutoff_units = nax.TimeUnits(self.solver_object.timeUnits).name
            else:  # OK to not consider OTHER meausrement type since we will not be here for OTHER
                orig_cutoff_units = nax.DistanceUnits(self.solver_object.distanceUnits).name
            route_cutoff = self.convert_value(route_cutoff, self.impedance_unit, orig_cutoff_units)
            # We want to override the defaultImpedanceCutoff in case the user set a very large cutoff
            if orig_cutoff:
                if orig_cutoff > route_cutoff:
                    self.logger.info("Overriding default cutoff of %s to %s (%s)", orig_cutoff, route_cutoff,
                                     orig_cutoff_units)
                    self.solver_object.defaultImpedanceCutoff = route_cutoff
            else:
                self.logger.info("Setting an implicit default cutoff to %s (%s)", route_cutoff, orig_cutoff_units)
                self.solver_object.defaultImpedanceCutoff = route_cutoff
        else:
            overrides = self.solver_object.overrides
            if overrides:
                overrides = json.loads(self.solver_object.overrides)
                orig_cutoff = overrides.get("RouteCutoff", None)
                # Do not set a RouteCutoff if it was already set as an override
                if orig_cutoff:
                    self.logger.info("Skip setting RouteCutoff override to %s (%s) as it is already set to %s",
                                     route_cutoff, self.impedance_unit, orig_cutoff)
                else:
                    self.logger.info("Setting RouteCutoff override to %s (%s)", route_cutoff, self.impedance_unit)
                    overrides["RouteCutoff"] = route_cutoff
            else:
                self.logger.info("Setting RouteCutoff override to %s (%s)", route_cutoff, self.impedance_unit)
                overrides = {
                    "RouteCutoff": route_cutoff
                }
            self.solver_object.overrides = json.dumps(overrides)

    @time_exec
    def _copy_features(self, dataset, check_validity=True):
        """Make a copy of the input features to an inmemory feature class and return the copy.

        Args:
            dataset: A feature set or record set object that needs to be copied.
            check_validity: Check if the input dataset is valid. This is needed only for optional feature sets such as
                            barriers.

        Returns:
            A copy of the input dataset as an in_memory feature class.

        Raises:
            No special exceptions.

        """
        # Return original input for optional feature sets and record sets.
        if check_validity:
            if not self._is_valid(dataset):
                return dataset
        # Return original input for feature sets that do no refernce a URL
        # If inputs are passed by URL, describe.path returns the URL. If inputs are passed as a JSON feature set,
        # describe.path returns 'in_memory'
        desc = arcpy.Describe(dataset)
        if not desc.path.startswith("http"):
            return dataset
        output_dataset = f"in_memory/copy_{uuid.uuid4().hex}"
        dataset.save(output_dataset)
        return output_dataset

    @staticmethod
    @time_exec
    def _is_valid(dataset):
        """Return true if the recordset or featureset is valid and hence can be safely used.

        This is required only for optional tool parameters that can be feature sets or recordsets as such recordsets
        or features might not get serialized correctly and so cause issues when used. Required tool parameters when
        passed as featuresets or recordsets are always valid.

        Args:
            dataset: A feature set or record set object.

        Returns:
            True if the recordset or featureset is valid. If the dataset is not a feature set of recordset always return
            True.

        """
        try:
            if hasattr(dataset, "JSON"):
                return True
            return True
        except NameError:
            return False

    def _apply_locate_settings(self):
        """Set locate settings on the solver object.

        Raises: nat.ToolExit if a ValueError is returned when applying locate settings.

        """
        try:
            self.solver_object._locateSettingsJson = self.locate_settings  # pylint:disable=protected-access
        except ValueError as ex:
            self.logger.error(ex)
            self.logger.error("", extra={
                "message_ID": 30324,
                "add_argument1": self.locate_settings})
            raise nat.ToolExit from None

    @time_exec
    def _usage_credits(self, num_objects):
        """Return credits based on num objects.

        Args:
            num_objects: The number of objects from the analysis that are used to estimate credits.
        Raises:
           No exceptions.
        Returns:
            An integer representing the number of credits used by the analysis. Returns 0 if there are errors in
            determining credits.

        """
        # When running on linux, making a lot of sharing API usageCost calls over time returns a failure.
        # https://devtopia.esri.com/matt3274/network-services-planning/issues/1081
        # So until this issue is fixed, we are using hard-coded cost factors.
        # TODO: set retrieve_cost_using_sharing_api to true once the bug is fixed.
        retrieve_cost_using_sharing_api = False  # whether to get cost factor from sharing API or use hardcoded factors
        if self.logger.level == logging.DEBUG:
            retrieve_cost_using_sharing_api = True
            self.logger.info("Determine credits using sharing API")
        zero_credits = 0
        negative_credits = -1
        owning_system_private_url = json.loads(arcpy.gp.serverProperties()).get("owningSystemPrivateURL", "")
        # A server that is not federated with a portal will not have owning system url.
        if not owning_system_private_url:
            return zero_credits
        # A server federated with enterprise portal cannot consume credits.
        # For enterprise portals that proxy to ArcGIS Online will not execute this code as they will call this code
        # running as part of ArcGIS Online routing services.
        if not owning_system_private_url.endswith(".arcgis.com"):
            return zero_credits
        tool_to_stype = {
            "FindRoutes": ("nasimpleroute", "natsproute"),
            "FindClosestFacilities": "nacfroute",
            "GenerateServiceAreas": "naservicearea",
            "GenerateOriginDestinationCostMatrix": "naodresult",
            "SolveLocationAllocation": "nalademandpoint",
            "SolveVehicleRoutingProblem": "navrproute",
            "EditVehicleRoutingProblem": "navrproute,",
            "SolveLastMileDelivery": "nalmdorder",
            "SnapToRoads": "nastrpoint",
        }
        tool_name = self.__class__.__name__
        if tool_name == "FindRoutes":
            stype = tool_to_stype[tool_name][int(self.find_best_sequence)]
        else:
            stype = tool_to_stype[tool_name]
        if not retrieve_cost_using_sharing_api:
            self.logger.info("Determine credits using hardcoded cost factors.")
            cost_factor = {
                "nasimpleroute": 0.005,
                "natsproute": 0.5,
                "nacfroute": 0.5,
                "naservicearea": 0.5,
                "naodresult": 0.0005,
                "nalademandpoint": 0.1,
                "navrproute": 1.0,
                "nalmdorder": 0.3,
                "nastrpoint": 0.05,
            }
            return num_objects * cost_factor[stype]
        try:
            import hostedgp  # Need to import conditionally. pylint:disable=import-outside-toplevel
            # Do not perform a tenant check as we might run this from a federated server that is not acting as a hosted
            # server (e.g AGOL servers). We are not using hostedgp to create hosted feature services. So tenant check is
            # not required.
            hgp = hostedgp.HostedGP(tenantCheck=False)
        except Exception as ex:  # pylint:disable=broad-exception-caught
            self.logger.debug("An error occured when using hostedgp")
            if hasattr(ex, "func") and hasattr(ex, "errmsg"):
                self.logger.debug("error function: %s, error message: %s", ex.func,
                                  ex.errmsg)  # pylint:disable=no-member
            return negative_credits
        try:
            query_params = {
                "f": "json",
                "etype": "svcusg",
                "stype": stype,
                "num": num_objects,
            }
            usage_cost_response = hgp.GenericSharingRequest("portals/self/usageCost", query_params)
            if "error" in usage_cost_response:
                self.logger.debug("Error response when getting usage cost. Report negative credits.")
                self.logger.debug(usage_cost_response)
                return negative_credits
            return usage_cost_response["credits"]
        except Exception as ex:  # Need to return zero credits. pylint:disable=broad-except
            self.logger.debug("Error when getting usage cost. Report negative credits.")
            self.logger.debug(ex)
            return negative_credits

    def _solver_perf_overrides(self, input_overrides):
        """Set performance metrics override in additional to any input overrides.
        
        Returns:
           A stringified JSON that can be used to set the overrides property on a solver object.
        
        """
        overrides_dict = {}
        if input_overrides:
            overrides_dict = json.loads(input_overrides)
        perf_metric_override = str(overrides_dict.get("ReturnPerformanceMetrics", ""))
        if perf_metric_override != "1":
            overrides_dict["ReturnPerformanceMetrics"] = "1"
            self.system_solver_overrides_message_codes.append(30210)
            self.system_solver_overrides_message_codes.append(30348)
        return json.dumps(overrides_dict)

    @staticmethod
    def _log_perf_metrics():
        """Determine whether performance metrics should be logged to ArcGIS Server."""
        # set self.log_perf_metrics to True / False
        log_perf_metrics = False
        try:
            service_props = json.loads(arcpy.gp.serviceProperties())
            task_settings = json.loads(service_props.get("taskAdminSettings", "{}"))
            log_perf_metrics = task_settings.get("logPerformanceMetrics", "false") == "true"
        except Exception:  # Need to skip this check in case on any errors. pylint:disable=broad-except
            log_perf_metrics = False
        return log_perf_metrics


class NDSInfo():
    """Store frequently required information from a network dataset describe object.

    The NDSInfo object needs to be pickleable. So do not use store arcpy objects such as describe or SpatialReference
    as instance attributes on NDSInfo object.
    """

    __slots__ = ("costs", "attribute_parameters", "default_restrictions", "restrictions", "default_travel_mode_name",
                 "has_service_area_index", "edge_source_names", "junction_source_names", "turn_source_names",
                 "sys_junction_source_name", "non_locatable_sources", "hierarchy_attribute", "feature_dataset_path")

    TIME_UNITS = nax.TimeUnits.__members__
    RESTRICTION_USAGE_VALUES = {  # Keywords for variuos restriction usage numeric values
        "-1.0": "PROHIBITED",
        "5.0": "AVOID_HIGH",
        "2.0": "AVOID_MEDIUM",
        "1.3": "AVOID_LOW",
        "0.5": "PREFER_MEDIUM",
        "0.8": "PREFER_LOW",
        "0.2": "PREFER_HIGH"
    }

    def __init__(self, nds):
        """Store the network dataset.

        Args:
            nds: A network dataset referenced by it's name, layer or catalog path.

        """
        # self._nds_desc = nds_describe
        nds_describe = arcpy.Describe(nds)
        costs = {
            "timeCosts": {},
            "distanceCosts": {},
            "otherCosts": {},
            "allCosts": {},
            "defaultCost": "",
        }
        default_cost = ""
        restrictions = {}
        default_restrictions = []
        attribute_parameters = {}
        attr_param_count = 0
        edge_src_names = []
        junction_src_names = []
        turn_src_names = []
        sys_junction_src_name = ""
        non_locatable_sources = []
        hierarchy_attribute = None

        for attr_desc_obj in nds_describe.attributes:
            # Store network dataset cost as native python object since arcpy describe object cannot be pickled.
            attr = NDAttribute(attr_desc_obj.name, attr_desc_obj.units, attr_desc_obj.usageType,
                               attr_desc_obj.useByDefault)
            attr_name = attr.name
            attr_usage_type = attr.usageType
            attr_units = attr.units
            if attr_usage_type == "Cost":
                if attr.useByDefault:
                    default_cost = attr_name
                if attr_units == "Unknown":
                    costs["otherCosts"][attr_name] = attr
                elif attr_units in self.TIME_UNITS:
                    costs["timeCosts"][attr_name] = attr
                else:
                    costs["distanceCosts"][attr_name] = attr
            elif attr_usage_type == "Restriction":
                if attr.useByDefault:
                    default_restrictions.append(attr_name)
                restrictions[attr_name] = attr
            elif attr_usage_type == "Hierarchy":
                hierarchy_attribute = attr_name
            parameter_count = attr_desc_obj.parameterCount
            if parameter_count:
                for i in range(parameter_count):
                    param_name = getattr(attr_desc_obj, "parameterName" + str(i))
                    param_default_value = None
                    if hasattr(attr_desc_obj, "parameterDefaultValue" + str(i)):
                        param_default_value = str(getattr(attr_desc_obj, "parameterDefaultValue" + str(i)))
                        # Better readability. pylint:disable=line-too-long
                        if param_name.upper() == "RESTRICTION USAGE" and param_default_value in self.RESTRICTION_USAGE_VALUES:  # nopep8
                            param_default_value = self.RESTRICTION_USAGE_VALUES[param_default_value]
                        # pylint:enable=line-too-long
                    attr_param_count += 1
                    attribute_parameters[attr_param_count] = (attr_name, param_name, param_default_value)
            evaluator_count = attr_desc_obj.evaluatorCount
            if evaluator_count:
                for index in range(evaluator_count):
                    evaluator_type = getattr(attr_desc_obj, f"evaluatorType{index}")
                    if evaluator_type in ("Public Transit", ):
                        src_name = getattr(attr_desc_obj, f"sourceName{index}")
                        if src_name not in non_locatable_sources:
                            non_locatable_sources.append(src_name)

        costs["defaultCost"] = default_cost
        costs["allCosts"] = {**costs["timeCosts"], **costs["distanceCosts"], **costs["otherCosts"]}
        self.costs = costs
        self.attribute_parameters = attribute_parameters
        self.non_locatable_sources = non_locatable_sources
        self.hierarchy_attribute = hierarchy_attribute
        # Prepare a mapping of impedance key words to well know cost attributes
        # 'Drive Time' maps to 'TravelTime' or first time based cost attribute
        # 'Walk Time' maps to 'WalkTime' or first time based  cost attribute
        # 'Truck Time' maps to 'TruckTravelTime' or first time based cost attribute
        # 'Travel Distance' maps to 'Kilometers' or first distance based cost attribute
        # impedance_map = {}
        # time_cost_names = list(costs["timeCosts"].keys())
        # distance_cost_names = list(costs["distanceCosts"].keys())
        # first_time_cost = time_cost_names[0]
        # first_distance_cost = distance_cost_names[0]
        # impedance_map["Drive Time"] = "TravelTime" if "TravelTime" in time_cost_names else first_time_cost
        # impedance_map["Walk Time"] = "WalkTime" if "WalkTime" in time_cost_names else first_time_cost
        # impedance_map["Truck Time"] = "TruckTravelTime" if "TruckTravelTime" in time_cost_names else first_time_cost
        # impedance_map["Travel Distance"] = "Kilometers" if "Kilometers" in distance_cost_names else first_distance_co
        # self.impedance_map = impedance_map

        self.default_restrictions = default_restrictions
        self.restrictions = restrictions

        self.default_travel_mode_name = nds_describe.defaultTravelModeName
        self.has_service_area_index = "Service Area Index" in nds_describe.optimizations

        for src in nds_describe.sources:
            if src.sourceType == "EdgeFeature":
                edge_src_names.append(src.name)
            elif src.sourceType == "JunctionFeature":
                junction_src_names.append(src.name)
            elif src.sourceType == "TurnFeature":
                turn_src_names.append(src.name)
            elif src.sourceType == "SystemJunction":
                sys_junction_src_name = src.name
        self.edge_source_names = edge_src_names
        self.junction_source_names = junction_src_names
        self.sys_junction_source_name = sys_junction_src_name
        self.turn_source_names = turn_src_names
        self.feature_dataset_path = nds_describe.path


class ToolValidator(nat.NAToolValidator):
    """Class for validating parameter values and controlling the behavior of the tool's dialog."""

    def __init__(self):
        """Initialize required things."""
        super().__init__()
        # Determine if running in a server context so that we can skip certain methods
        self.running_on_server = arcpy.gp.IsRunningInServer() and not FOR_PUBLISHING
        self.tool_name = ""
        self.measurement_unit_param = None
        self.nds_param = None
        self.nds_extents_param = None
        self.analysis_region_param = None
        self.hiearchy_param = None
        self.uturn_param = None
        self.simp_tol_param = None
        self.restrictions_param = None
        self.attr_params_param = None
        self.impedance_param = None
        self.time_impedance_param = None
        self.distance_impedance_param = None
        self.accumulate_attrs_param = None
        self.exclude_sources_param = None
        self.directions_lang_param = None
        self.overrides_param = None
        self.locate_settings_param = None
        self.travel_mode_param = None
        self.road_properties_param = None
        self.road_props_points_params = None
        self.road_props_lines_params = None

    def updateParameters(self):  # pylint: disable=invalid-name
        """Modify the values and properties of parameters before internal validation is performed.

        This method is called whenever a parameter has been changed.
        Args:
            No arguments.
        Returns:
            No return value.
        Raises:
            No execeptions.

        """
        # Expensive operation that is not required when running as a service.
        if self.running_on_server:
            return
        self._update_nd_dep_params()
        self._update_road_props_dep_params()

    def updateMessages(self):
        """Modify the values and properties of parameters before internal validation is performed."""
        # Allow invalid restrictions since they are handled during execution.
        if self.restrictions_param:
            if self.restrictions_param.values and self.restrictions_param.hasError():
                self.restrictions_param.clearMessage()

        # Allow invalid accumulate attributes since they are handled during execution.
        if self.accumulate_attrs_param:
            if self.accumulate_attrs_param.values and self.accumulate_attrs_param.hasError():
                self.accumulate_attrs_param.clearMessage()

        # Does not work when the service is called from Pro or ArcMap
        # # Allow invalid directions language since they are handled during execution.
        # if self.directions_lang_param:
        #     if self.directions_lang_param.value and self.directions_lang_param.hasError():
        #         self.directions_lang_param.clearMessage()

        # Allow "Nautical Miles" as a measurement unit for GenerateServiceAreas and FindClosestFacilities tool even when
        # it is not present in the ValueList for backwards compatiblity
        if self.measurement_unit_param:
            if self.measurement_unit_param.value and self.measurement_unit_param.hasError():
                if self.measurement_unit_param.value.lower() == "nautical miles":
                    self.measurement_unit_param.clearMessage()
                    self.measurement_unit_param.value = "NauticalMiles"

        # raise warnings if deprecated region names are passed part of Analysis Region
        analysis_region = self.analysis_region_param.value
        if analysis_region:
            deprecated_regions = {
                "Greece": "Europe",
                "India": "SouthAsia",
                "Taiwan": "SouthAsia",
                "Oceania": "SouthAsia",
                "SouthEastAsia": "SouthAsia",
            }
            if analysis_region in deprecated_regions:
                new_region = deprecated_regions[analysis_region]
                if new_region in self.analysis_region_param.filter.list:
                    msg = (f"{analysis_region} is no longer supported as an analysis region and will be removed in a "
                           f"future release. Using {new_region} as the analysis region.")
                    self.analysis_region_param.setWarningMessage(msg)
                    self.analysis_region_param.value = new_region

        if self.overrides_param:
            overrides_param_value = self.overrides_param.value
            if overrides_param_value:
                # fail if overrides are not a valid JSON
                try:
                    json.loads(overrides_param_value)
                except json.decoder.JSONDecodeError:
                    self.overrides_param.setIDMessage("ERROR", 623, self.overrides_param.name)

    def _update_nd_dep_params(self):
        """Update parameters that depend on the template network dataset."""
        # Since this function is expensive, we try to bail our early when possible
        nds_param_value = self.nds_param.valueAsText
        if not nds_param_value:
            return
        if self.nds_param.hasBeenValidated:
            return
        if not self.nds_param.altered:
            return

        all_nds = NASolverTool.strip_quotes(nds_param_value).split(";")
        # Template network dataset is the first NDS from the list of network datasets
        template_nds = all_nds[0]
        nds_info = NDSInfo(template_nds)
        nds_tm = arcpy.na.GetTravelModes(template_nds)
        default_tm = nds_tm.get(nds_info.default_travel_mode_name, None)

        # Populate value list for Analysis Region parameter
        nds_extents = self.nds_extents_param.valueAsText
        self.analysis_region_param.filter.type = "ValueList"
        if nds_extents:
            # Value list is based on the unique RegionName values from the extents layer.
            with arcpy.da.SearchCursor(nds_extents,  # False positive. pylint:disable=no-member
                                       NASolverTool.REGION_NAME_FIELD) as cursor:
                region_names = {row[0] for row in cursor}
            self.analysis_region_param.filter.list = sorted(list(region_names))
        else:
            # Value list is the names of the network datasets
            self.analysis_region_param.filter.list = all_nds

        # Set impedance parameter value lists based on the costs defined in the template network dataset
        if self.impedance_param:
            nds_costs = nds_info.costs
            time_costs = list(nds_costs["timeCosts"].keys())
            distance_costs = list(nds_costs["distanceCosts"].keys())
            other_costs = list(nds_costs["otherCosts"].keys())
            # VRP tools only support time based impedances
            if self.tool_name == "SolveVehicleRoutingProblem":
                impedance_name_keywords = NASolverTool.IMPEDANCE_NAMES[:]
                impedance_name_keywords.remove("Travel Distance")
                self.impedance_param.filter.list = impedance_name_keywords + time_costs
            else:
                self.impedance_param.filter.list = NASolverTool.IMPEDANCE_NAMES + time_costs + distance_costs \
                                                   + other_costs
        if self.time_impedance_param:
            self.time_impedance_param.filter.type = "ValueList"
            self.time_impedance_param.filter.list = time_costs
        if self.distance_impedance_param:
            self.distance_impedance_param.filter.type = "ValueList"
            self.distance_impedance_param.filter.list = distance_costs

        # Set the value for the impedance value parameter based on the impedance of the default travel mode or
        # based on default cost or the first cost.
        # Set the default value for time impedance and distance impedance parameters from the default travel mode
        # if defined on the template network dataset. Other wise use the default cost attribute and the first time
        # or distance attribute in case the default cost is not defined or is of type other.
        if self.time_impedance_param and self.distance_impedance_param:
            default_cost = nds_costs["defaultCost"]
            if default_tm:
                # if not self.impedance_param.altered:
                #     self.impedance_param.value = default_tm.impedance
                if not self.time_impedance_param.altered:
                    self.time_impedance_param.value = default_tm.timeAttributeName
                if not self.distance_impedance_param.altered:
                    self.distance_impedance_param.value = default_tm.distanceAttributeName
            elif default_cost:
                # if not self.impedance_param.altered:
                #     self.impedance_param.value = default_cost
                if default_cost in time_costs:
                    if not self.time_impedance_param.altered:
                        self.time_impedance_param.value = default_cost
                    if not self.distance_impedance_param.altered:
                        self.distance_impedance_param.value = distance_costs[0]
                elif default_cost in distance_costs:
                    if not self.distance_impedance_param.altered:
                        self.distance_impedance_param.value = default_cost
                    if not self.time_impedance_param.altered:
                        self.time_impedance_param.value = time_costs[0]
                else:
                    if not self.time_impedance_param.altered:
                        self.time_impedance_param.value = time_costs[0]
                    if not self.distance_impedance_param.altered:
                        self.distance_impedance_param.value = distance_costs[0]
            else:
                # if not self.impedance_param.altered:
                #     self.impedance_param.value = time_costs[0]
                if not self.time_impedance_param.altered:
                    self.time_impedance_param.value = time_costs[0]
                if not self.distance_impedance_param.altered:
                    self.distance_impedance_param.value = distance_costs[0]

        # Setup the restrictions parameter
        if self.restrictions_param:
            self.restrictions_param.filter.type = "ValueList"
            self.restrictions_param.filter.list = sorted(list(nds_info.restrictions.keys()))
            # Use values from default travel mode if set on the network dataset
            if not self.restrictions_param.altered:
                if default_tm:
                    self.restrictions_param.value = sorted(default_tm.restrictions)
                else:
                    self.restrictions_param.value = sorted(nds_info.default_restrictions)

        # Setup uTurn, simplification tolerance and hiearchy parameters from default travel mode if set
        # on the network dataset
        if default_tm:
            if self.simp_tol_param and not self.simp_tol_param.altered:
                self.simp_tol_param.value = default_tm.simplificationTolerance
            # For Generate Service area, if the network dataset has service area index, do not use hierarchy even
            # if the default travel mode says so
            if self.hiearchy_param and not self.hiearchy_param.altered:
                if self.tool_name == "GenerateServiceAreas" and nds_info.has_service_area_index:
                    self.hiearchy_param.value = False
                else:
                    self.hiearchy_param.value = default_tm.useHierarchy
            # Travel mode Uturn value is GP keyword which might be valid Uturn parameter value for SolveVRP
            # But needs a different name for other solver tools. For example, we need to convert
            # NO_UTURNS to 'Not Allowed'
            if self.uturn_param:
                uturn_param_value_list = self.uturn_param.filter.list
                tm_uturn = default_tm.uTurns
                if not self.uturn_param.altered:
                    if tm_uturn in uturn_param_value_list:
                        self.uturn_param.value = tm_uturn
                    else:
                        tm_uturn = NASolverTool.ESRI_UTURNS[tm_uturn]
                        if tm_uturn in uturn_param_value_list:
                            self.uturn_param.value = tm_uturn
                        else:
                            tm_uturn = NASolverTool.ESRI_UTURNS[tm_uturn]
                            self.uturn_param.value = tm_uturn

        # Set default attribute parameter values from the default travel mode if set or from the network dataset
        if self.attr_params_param and not self.attr_params_param.altered:
            attr_params_param_val = self.attr_params_param.value
            arcpy.management.DeleteRows(attr_params_param_val)
            with arcpy.da.InsertCursor(attr_params_param_val,  # False positive. pylint:disable=no-member
                                       NASolverTool.ATTR_PARAMS_FIELDS) as cursor:
                if default_tm:
                    for attr_param in sorted(default_tm.attributeParameters, key=itemgetter(0)):
                        attr_param_val = default_tm.attributeParameters[attr_param]
                        if attr_param[1].upper() == "RESTRICTION USAGE":
                            attr_param_val = NDSInfo.RESTRICTION_USAGE_VALUES.get(f"{attr_param_val:.1f}",
                                                                                  attr_param_val)
                        cursor.insertRow((attr_param[0], attr_param[1], attr_param_val))
                else:
                    for attr_param in sorted(nds_info.attribute_parameters.values(), key=itemgetter(0)):
                        cursor.insertRow(attr_param)

        # List all cost attributes in accumulate attributes parameter
        if self.accumulate_attrs_param:
            self.accumulate_attrs_param.filter.type = "ValueList"
            self.accumulate_attrs_param.filter.list = list(nds_info.costs["allCosts"].keys())

        # Update default value for the Locate Settings parameter
        if self.locate_settings_param and not self.locate_settings_param.altered:
            # Get the default locate settings from the solver object
            tool_names_to_solver_object = {
                "FindRoutes": nax.Route,
                "FindClosestFacilities": nax.ClosestFacility,
                "GenerateServiceAreas": nax.ServiceArea,
                "SolveLocationAllocation": nax.LocationAllocation,
                "GenerateOriginDestinationCostMatrix": nax.OriginDestinationCostMatrix,
                "SolveVehicleRoutingProblem": nax.VehicleRoutingProblem,
                "EditVehicleRoutingProblem": nax.VehicleRoutingProblem,
                "SolveLastMileDelivery": nax.LastMileDelivery,
            }
            try:
                solver_object = tool_names_to_solver_object[self.tool_name](template_nds)
                locate_settings_value = json.loads(solver_object._locateSettingsJson)  # pylint:disable=protected-access
                locate_settings_value["default"]["tolerance"] = 20000  # Meters
                self.locate_settings_param.value = json.dumps(locate_settings_value)
                del solver_object
            except Exception:  # pylint:disable=broad-exception-caught
                # Ok to not populate default locate settings if solver object creation fails as this will be an error
                # caught in other places.
                # self.locate_settings_param.value = str(err)
                pass

        # Update value list for exclude sources from polygon generation parameter
        if self.exclude_sources_param:
            self.exclude_sources_param.filter.type = "ValueList"
            self.exclude_sources_param.filter.list = nds_info.edge_source_names
            # Set the default value to be non-locatable sources as this is most helpful for transit networks.
            if not self.exclude_sources_param.altered:
                if nds_info.non_locatable_sources:
                    self.exclude_sources_param.value = nds_info.non_locatable_sources

        # Does not work when the service is called from Pro or ArcMap
        # Update the value list for the directions language parameter
        # if self.directions_lang_param:
        #     self.directions_lang_param.filter.type = "ValueList"
        #     self.directions_lang_param.filter.list = arcpy.na.ListDirectionsLanguages()

        # Update default value for the travel mode parameter
        if self.travel_mode_param and not self.travel_mode_param.altered:
            self.travel_mode_param.value = str(default_tm)

        # Update default value for road_properties in SnapToRoads for SMP network datasets
        if self.road_properties_param and not self.road_properties_param.altered:
            try:
                default_road_properties = self._default_road_properties(nds_info)
            except Exception:  # Ok to not populate in case of failures. pylint:disable=broad-exception-caught
                default_road_properties = {}
            if default_road_properties:
                self.road_properties_param.value = json.dumps(default_road_properties)

    @staticmethod
    def _default_road_properties(nds_info):
        """Return default road properties for a network dataset.
        Args:
            nds_info: An instance of NDSInfo that contains info about the network dataset.
        
        Returns:
            A dict that can used as default values for roadProperties parameter in SnapToRoads tool.
            An empty dict if the network dataset does not have edge sources with any matching fields.
        
        """
        rp_well_known_fields = {"FT_RST_SPEED_LIMIT", "TF_RST_SPEED_LIMIT", "FT_RST_TRUCK_SPEED_LIMIT",
                            "TF_RST_TRUCK_SPEED_LIMIT", "METERS"}
        speed_units = {
            "kph": "esriKilometersPerHour",
            "mph": "esriMilesPerHour",
            "mps": "esriMetersPerSecond"
        }
        length_units = {
            "kilometers": "esriKilometers",
            "miles": "esriMiles"
        }
        default_rp = {}
        matching_fields = {}

        for src_name in nds_info.edge_source_names:
            src_flds = arcpy.ListFields(os.path.join(nds_info.feature_dataset_path, src_name))
            matches = [fld.name.upper() for fld in src_flds if fld.name.upper() in rp_well_known_fields]
            if matches:
                matching_fields[src_name] = matches
        if not matching_fields:
            return default_rp
        two_field_matches = {
            "posted_speed_limit": {"FT_RST_SPEED_LIMIT", "TF_RST_SPEED_LIMIT"},
            "posted_truck_speed_limit": {"FT_RST_TRUCK_SPEED_LIMIT", "TF_RST_TRUCK_SPEED_LIMIT"}
        }
        for speed_unit_abbrv, speed_unit in speed_units.items():
            road_property_value = {}
            for road_property_name, fld_names in two_field_matches.items():
                for src_name, flds in matching_fields.items():
                    if fld_names.issubset(flds):
                        road_property_value[src_name] = {
                            "fromTo": "FT_RST_SPEED_LIMIT",
                            "toFrom": "TF_RST_SPEED_LIMIT",
                            "fieldUnits": "esriKilometersPerHour",
                            "outputUnits": speed_unit
                        }
                if road_property_value:
                    default_rp[f"{road_property_name}_{speed_unit_abbrv}"] = road_property_value
        for length_unit_abbrv, length_unit in length_units.items():
            road_property_value = {}
            for src_name, flds in matching_fields.items():
                if "METERS" in flds:
                    road_property_value[src_name] = {
                        "fromTo": "METERS",
                        "toFrom": "METERS",
                        "fieldUnits": "esriMeters",
                        "outputUnits": length_unit
                    }
            if road_property_value:
                default_rp[f"length_{length_unit_abbrv}"] = road_property_value
        return default_rp

    def _update_road_props_dep_params(self):
        """Update parameters that are dependent on road properties param in SnapToRoads tool."""
        if self.road_properties_param is None:
            return
        road_props = self.road_properties_param.valueAsText
        if not road_props:
            return
        if self.road_properties_param.hasBeenValidated:
            return
        if not self.road_properties_param.altered:
            return
        try:
            road_props_dict = json.loads(road_props)
            road_prop_keys = sorted(list(road_props_dict.keys()))
        except json.JSONDecodeError:
            road_prop_keys = []
        self.road_props_points_params.filter.list = road_prop_keys
        self.road_props_lines_params.filter.list = road_prop_keys
