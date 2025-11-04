"""Provides validation and execution logic for SolveLocationAllocation tool."""

import logging
import locale
import os
import json

import arcpy
from arcpy.na import _na as nax
import nat
import nast
from nast import time_exec


class SolveLocationAllocation(nast.NASolverTool):
    """Provides execution logic for SolveLocationAllocation tool."""

    # Define instance attributes in slots primarily for faster attribute lookups
    __slots__ = ("facilities", "demand_points", "facility_count", "default_impedance_cutoff", "travel_direction",
                 "decay_function_type", "decay_function_parameter_value", "default_capacity", "problem_type",
                 "target_market_share", "time_of_day", "time_zone", "line_shape_type", "output_lines",
                 "output_facilities", "output_demand_points")

    TRAVEL_DIR = {
        "Facility to Demand": 0,
        "Demand to Facility": 1,
    }

    PROBLEM_TYPE = {
        "Maximize Attendance": 0,
        "Maximize Capacitated Coverage": 1,
        "Maximize Coverage": 2,
        "Maximize Market Share": 3,
        "Minimize Facilities": 4,
        "Minimize Impedance": 5,
        "Target Market Share": 6,
    }

    def __init__(self, **kwargs):
        """Store names used in all methods."""
        super().__init__()
        # print parameter values when debugging
        if self.logger.level == logging.DEBUG:
            for param_name, param_value in kwargs.items():
                self.logger.debug("%s: %s, %s", param_name, type(param_value), param_value)

        self.extent_fields[-1] = "GPLocationAllocationService"  # field name used to store remote service conn info
        # Store tool parameter values as instance names.
        self.kwargs = kwargs
        self.facilities = kwargs["Facilities"]
        self.demand_points = kwargs["Demand_Points"]
        self.measurement_unit = kwargs["Measurement_Units"].replace(" ", "")
        self.network_datasets = self.strip_quotes(kwargs["Network_Datasets"]).split(";")
        self.nd_extents = kwargs["Network_Dataset_Extents"]
        self.analysis_region = kwargs["Analysis_Region"]
        try:
            self.select_network_dataset([self.demand_points, self.facilities])
        except ValueError:
            self.logger.error("", extra={"message_ID": 30139})
            raise nat.ToolExit from None
        self.problem_type = self.PROBLEM_TYPE[kwargs["Problem_Type"]]
        self.facility_count = kwargs["Number_of_Facilities_to_Find"]
        default_cutoff_val = kwargs["Default_Measurement_Cutoff"]
        self.default_impedance_cutoff = locale.atof(default_cutoff_val) if default_cutoff_val else None
        self.default_capacity = kwargs["Default_Capacity"]
        self.target_market_share = kwargs["Target_Market_Share"]
        self.decay_function_type = nax.DecayFunctionType[kwargs["Measurement_Transformation_Model"]]
        self.decay_function_parameter_value = kwargs["Measurement_Transformation_Factor"]
        self.travel_direction = self.TRAVEL_DIR[kwargs["Travel_Direction"]]
        self.time_of_day = kwargs["Time_of_Day"]
        self.time_zone = self.TIME_ZONE[kwargs["Time_Zone_for_Time_of_Day"]]
        self.uturn_at_junctions = kwargs["Uturn_at_Junctions"]
        self.point_barriers = kwargs["Point_Barriers"]
        self.line_barriers = kwargs["Line_Barriers"]
        self.polygon_barriers = kwargs["Polygon_Barriers"]
        self.use_hierarchy = kwargs["Use_Hierarchy"]
        self.restrictions = kwargs["Restrictions"]
        self.attribute_parameter_values = kwargs["Attribute_Parameter_Values"]
        self.line_shape_type = self.ROUTE_SHAPE_TYPE[kwargs["Allocation_Line_Shape"]]
        self.travel_mode = kwargs["Travel_Mode"]
        self.impedance = kwargs["Impedance"]
        self.save_layer_file = kwargs["Save_Output_Network_Analysis_Layer"]
        self.overrides = self._solver_perf_overrides(kwargs["Overrides"])
        self.time_impedance = kwargs["Time_Impedance"]
        self.distance_impedance = kwargs["Distance_Impedance"]
        self.output_format = kwargs["Output_Format"]
        self.accumulate_attributes = kwargs["Accumulate_Attributes"]
        self.output_gdb = kwargs["Output_Geodatabase"]
        self.output_names = self.read_value_table(kwargs["Output_Names"])
        self.ignore_loc_fields = kwargs["Ignore_Network_Location_Fields"]
        self.limits = self._get_analysis_limits(kwargs["Analysis_Limits"])
        self.ignore_invalid_locations = kwargs["Ignore_Invalid_Locations"]
        self.locate_settings = kwargs["Locate_Settings"]

        # Other instance attributes
        if not self.conn_file:  # Remote network datasets cannot be described
            self.nds_info = nast.NDSInfo(self.network_dataset)  # Proxy for network dataset describe

        # Determine measurement type to evaluate if break units are time based, distance based or other.
        if self.measurement_unit in nax.TimeUnits.__members__:
            self.measurement_type = "TIME"
        elif self.measurement_unit in nax.DistanceUnits.__members__:
            self.measurement_type = "DISTANCE"
        else:
            self.measurement_type = "OTHER"

        # Outputs created by the tool
        self.output_lines = ""
        self.output_facilities = ""
        self.output_demand_points = ""
        self.output_layer_file = ""
        self.output_result_file = ""
        self.solve_succeeded = False
        self.usage_cost = json.dumps({
            "numObjects": 0,
            "credits": 0
        })

    @time_exec
    def _solve_location_allocation(self):
        """Perform location-allocation analysis using location-allocation solver object."""
        if self.conn_file:
            self._solve_location_allocation_svc()
            return
        # Create location-allocation analysis object
        try:
            location_allocation = time_exec(nax.LocationAllocation)(self.network_dataset)
        except ValueError as ex:
            self.logger.error(ex)
            raise nat.ToolExit
        self.solver_object = location_allocation  # for cleanup at exit

        # Set analysis settings
        travel_mode = time_exec(self.get_travel_mode)()
        try:
            location_allocation.travelMode = travel_mode
        except ValueError as err:
            self.logger.error("", extra={
                "message_ID": 30232,
                "add_argument1": str(travel_mode),
                })
            self.logger.error(err)
            raise nat.ToolExit from None
        all_costs = self.nds_info.costs["allCosts"]
        if self.measurement_type == "TIME":
            location_allocation.timeUnits = nax.TimeUnits[self.measurement_unit]
            distance_unit = all_costs[travel_mode.distanceAttributeName].units
            location_allocation.distanceUnits = nax.DistanceUnits[distance_unit]
        elif self.measurement_type == "DISTANCE":
            location_allocation.distanceUnits = nax.DistanceUnits[self.measurement_unit]
            time_unit = all_costs[travel_mode.timeAttributeName].units
            location_allocation.timeUnits = nax.TimeUnits[time_unit]
        else:
            time_unit = all_costs[travel_mode.timeAttributeName].units
            location_allocation.timeUnits = nax.TimeUnits[time_unit]
            distance_unit = all_costs[travel_mode.distanceAttributeName].units
            location_allocation.distanceUnits = nax.DistanceUnits[distance_unit]

        if self.accumulate_attributes:
            location_allocation.accumulateAttributeNames = self.get_valid_accumulate_attributes()

        location_allocation.problemType = self.problem_type
        location_allocation.defaultImpedanceCutoff = self.default_impedance_cutoff
        location_allocation.facilityCount = self.facility_count
        location_allocation.travelDirection = self.travel_direction
        location_allocation.defaultCapacity = self.default_capacity
        location_allocation.targetMarketShare = self.target_market_share
        location_allocation.decayFunctionType = self.decay_function_type
        location_allocation.decayFunctionParameterValue = self.decay_function_parameter_value
        location_allocation.timeOfDay = self.time_of_day
        location_allocation.timeZone = self.time_zone
        location_allocation.lineShapeType = self.line_shape_type
        location_allocation.overrides = self.overrides
        location_allocation.ignoreInvalidLocations = self.ignore_invalid_locations
        self._apply_locate_settings()
        self.logger.debug("Solver object properties")
        self.log_prop_values(location_allocation)

        # Load input data
        # Demand Points
        self.logger.debug("Loading demand points")
        max_demand_points_limit = self.limits.get("maximumDemandPoints", None)
        dp_fm = time_exec(location_allocation.fieldMappings)(nax.LocationAllocationInputDataType.DemandPoints,
                                                             not self.ignore_loc_fields,
                                                             arcpy.ListFields(self.demand_points))
        self.logger.debug("Demand points field map: %s", "; ".join([str(dp_fm[fm]) for fm in dp_fm]))
        try:
            time_exec(location_allocation.load)(nax.LocationAllocationInputDataType.DemandPoints,
                                                self.demand_points, dp_fm, True, max_demand_points_limit)
        except nax.LimitError:
            self.logger.error("", extra={
                "message_ID": 30096,
                "add_argument1": "Demand Points",
                "add_argument2": max_demand_points_limit})
            raise nat.ToolExit from None
        except (nax.InputDataError, RuntimeError) as err:
            self.logger.error("", extra={
                "message_ID": 30251,
                "add_argument1": "Demand Points",
            })
            self.logger.error(err)
            raise nat.ToolExit from None

        # Facilities
        self.logger.debug("Loading facilities")
        max_facilities_limit = self.limits.get("maximumFacilities", None)
        facilities_fm = time_exec(location_allocation.fieldMappings)(nax.LocationAllocationInputDataType.Facilities,
                                                                     not self.ignore_loc_fields,
                                                                     arcpy.ListFields(self.facilities))
        self.logger.debug("Facilities field map: %s", "; ".join([str(facilities_fm[fm]) for fm in facilities_fm]))
        try:
            time_exec(location_allocation.load)(nax.LocationAllocationInputDataType.Facilities, self.facilities,
                                                facilities_fm, True, max_facilities_limit)
        except nax.LimitError:
            self.logger.error("", extra={
                "message_ID": 30096,
                "add_argument1": "Facilities",
                "add_argument2": max_facilities_limit})
            raise nat.ToolExit from None
        except (nax.InputDataError, RuntimeError) as err:
            self.logger.error("", extra={
                "message_ID": 30251,
                "add_argument1": "Facilities",
            })
            self.logger.error(err)
            raise nat.ToolExit from None

        # Barriers
        if self._is_valid(self.point_barriers):
            self.logger.debug("Loading point barriers")
            try:
                time_exec(location_allocation.load)(nax.LocationAllocationInputDataType.PointBarriers,
                                                    self.point_barriers)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Point Barriers",
                })
                self.logger.error(err)
                raise nat.ToolExit from None
        if self._is_valid(self.line_barriers):
            self.logger.debug("Loading line barriers")
            try:
                time_exec(location_allocation.load)(nax.LocationAllocationInputDataType.LineBarriers,
                                                    self.line_barriers)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Line Barriers",
                })
                self.logger.error(err)
                raise nat.ToolExit from None
        if self._is_valid(self.polygon_barriers):
            self.logger.debug("Loading polygon barriers")
            try:
                time_exec(location_allocation.load)(nax.LocationAllocationInputDataType.PolygonBarriers,
                                                    self.polygon_barriers)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Polygon Barriers",
                })
                self.logger.error(err)
                raise nat.ToolExit from None

        input_counts = {}
        for input_type in nax.LocationAllocationInputDataType:
            input_counts[f"{input_type.name.replace('PointBarriers', 'Barriers')}Count"] = location_allocation.count(input_type.value)
        nast.SERVER_PERF_METRICS["LoadLocations"] = input_counts

        # Perform checks that are dependent on straight line distance between inputs. The distance between the inputs
        # can be calculated only after loading all the inputs into solver objects.
        self.max_meters_amid_inputs = location_allocation._maxMetersBetweenInputs()  # pylint:disable=protected-access
        nast.SERVER_PERF_METRICS["GeodesicDistance"] = round(self.max_meters_amid_inputs, nast.PERF_METRICS_PRECISION)
        self._check_walking_limit()
        # Force hierarchy if required to
        if travel_mode.useHierarchy == "NO_HIERARCHY":
            if self._force_hierarchy():
                travel_mode_dict = json.loads(str(travel_mode))
                travel_mode_dict["useHierarchy"] = True
                travel_mode = self._travel_mode_from_json(json.dumps(travel_mode_dict))
                location_allocation.travelMode = travel_mode

        # Solve
        # constrain the search space for exact solves
        if travel_mode.useHierarchy == "NO_HIERARCHY":
            self._add_route_cutoff()
        with nast.PerfTimer("SolveTimeInSeconds"):
            result = time_exec(location_allocation.solve)()
        self.solver_result = result
        self.solve_succeeded = result.solveSucceeded
        self.log_solver_messages(result)
        if not self.solve_succeeded:
            raise nat.ToolExit

        lines_extent = result.extent(nax.LocationAllocationOutputDataType.Lines)
        nast.SERVER_PERF_METRICS["BoundingBox"] = [
            round(lines_extent.XMin, nast.PERF_METRICS_PRECISION),
            round(lines_extent.YMin, nast.PERF_METRICS_PRECISION),
            round(lines_extent.XMax, nast.PERF_METRICS_PRECISION),
            round(lines_extent.YMax, nast.PERF_METRICS_PRECISION),
        ]
        try:
            with result.searchCursor(nax.LocationAllocationOutputDataType.Lines,
                                     f"Total_{self.measurement_unit}") as cursor:
                nast.SERVER_PERF_METRICS["Impedances"] = [round(max({row[0] for row in cursor}),
                                                               nast.PERF_METRICS_PRECISION)]
        except Exception:  # Ok to skip in case we got incorrect Total_field. pylint:disable=broad-exception-caught
            self.logger.info("Error when reporting impedances", exc_info=True)
        with nast.PerfTimer("OutputTimeInSeconds"):
            # Export outputs
            # Demand Points
            # Checking output demand points and not output allocation lines since output allocation lines can be less
            # than or equal to output demand points
            self._check_max_output_features(nax.LocationAllocationOutputDataType.DemandPoints, 30197)
            self.output_demand_points = os.path.join(self.output_gdb, self.output_names[2][1])
            self.logger.debug("Exporting output demand points to '%s'", self.output_demand_points)
            time_exec(result.export)(nax.LocationAllocationOutputDataType.DemandPoints, self.output_demand_points)
            # Allocation Lines
            self.output_lines = os.path.join(self.output_gdb, self.output_names[0][1])
            self.logger.debug("Exporting allocation lines to '%s'", self.output_lines)
            time_exec(result.export)(nax.LocationAllocationOutputDataType.Lines, self.output_lines)
            # Facilities
            self.output_facilities = os.path.join(self.output_gdb, self.output_names[1][1])
            self.logger.debug("Exporting output facilities to '%s'", self.output_facilities)
            time_exec(result.export)(nax.LocationAllocationOutputDataType.Facilities, self.output_facilities)
            # Layer file
            if self.save_layer_file:
                self.save_as_layer_file(result)
            # File based result
            if self.output_format != "Feature Set":
                export_datasets = dict.fromkeys((self.output_facilities, self.output_demand_points, self.output_lines),
                                                "FEATURECLASS")
                self.output_result_file = self.create_result_file(export_datasets, self.output_format)

    @time_exec
    def _solve_location_allocation_svc(self):
        """Find closest facilities using a geoprocessing service."""
        # Copy input feature sets as they can be referencing a URL which might not be accessible to the remote service
        # Not copying attribute parameter values as it is rare that someone will pass attribute parameter values from
        # a URL
        facilities = self._copy_features(self.facilities, check_validity=False)
        demand_points = self._copy_features(self.demand_points, check_validity=False)
        point_barriers = self._copy_features(self.point_barriers)
        line_barriers = self._copy_features(self.line_barriers)
        polygon_barriers = self._copy_features(self.polygon_barriers)
        task_params = [facilities, demand_points, self.measurement_unit, "#", self.kwargs["Problem_Type"],
                       self.facility_count, self.default_impedance_cutoff, self.default_capacity,
                       self.target_market_share, self.kwargs["Measurement_Transformation_Model"],
                       self.kwargs["Measurement_Transformation_Factor"], self.kwargs["Travel_Direction"],
                       self.time_of_day, self.kwargs["Time_Zone_for_Time_of_Day"], self.uturn_at_junctions,
                       point_barriers, line_barriers, polygon_barriers, self.use_hierarchy, self.restrictions,
                       self.attribute_parameter_values, self.kwargs["Allocation_Line_Shape"],
                       self.kwargs["Travel_Mode"], self.impedance, self.save_layer_file, self.overrides,
                       self.time_impedance, self.distance_impedance, self.output_format, self.ignore_invalid_locations,
                       self.locate_settings]
        try:
            result = self._call_remote_tool(task_params, 19)
        except Exception:  # Raise known error for unexpected remote tool failure. pylint:disable=broad-except
            self.logger.info("Failed to execute remote tool '%s'", self.remote_svc_name)
            self.logger.info("Exception details:", exc_info=True)
            self.logger.error("", extra={"message_ID": 30295})
            raise nat.ToolExit from None
        if result.maxSeverity == 2:
            self.solve_succeeded = False
            raise nat.ToolExit
        # Save the results
        solve_status = result.getOutput(0)
        if solve_status.lower() == 'true':
            self.solve_succeeded = True
        self.output_lines = os.path.join(self.output_gdb, self.output_names[0][1])
        self.output_facilities = os.path.join(self.output_gdb, self.output_names[1][1])
        self.output_demand_points = os.path.join(self.output_gdb, self.output_names[2][1])
        arcpy.management.CopyFeatures(result.getOutput(1), self.output_lines)
        arcpy.management.CopyFeatures(result.getOutput(2), self.output_facilities)
        arcpy.management.CopyFeatures(result.getOutput(3), self.output_demand_points)
        self.output_layer_file = result.getOutput(4)
        self.output_result_file = result.getOutput(5)
        # Remote service may not support newly added output parameters at 10.9
        if result.outputCount >= 7:
            self.output_layer_package = result.getOutput(6)

    @time_exec
    def _validate(self):
        """Raise a terminating exception if a validation check fails.

        Raises:
            ToolExit for a failed validation check.

        """
        super()._validate()

        if self.default_impedance_cutoff is not None and self.default_impedance_cutoff <= 0:
            self.logger.error("", extra={"message_ID": 30112, "add_argument1": "Default_Measurement_Cutoff"})
            raise nat.ToolExit

        if self.facility_count <= 0:
            self.logger.error("", extra={"message_ID": 30112, "add_argument1": "Number_of_Facilities_to_Find"})
            raise nat.ToolExit

        if self.target_market_share <= 0 or self.target_market_share > 100:
            self.logger.error("", extra={"message_ID": 30078})
            raise nat.ToolExit

        if self.default_capacity <= 0:
            self.logger.error("", extra={"message_ID": 30112, "add_argument1": "Default_Capacity"})
            raise nat.ToolExit

    @time_exec
    def _check_max_facilities_to_find(self):
        """Raise a terminating error if maximum facilities to find exceeds limits."""
        max_fac_to_find_limit = self.limits.get("maximumFacilitiesToFind", None)
        if max_fac_to_find_limit is None:
            return
        if self.facility_count > max_fac_to_find_limit:
            self.logger.error("", extra={
                "message_ID": 30126,
                "add_argument1": self.facility_count,
                "add_argument2": max_fac_to_find_limit})
            raise nat.ToolExit

    def _check_limits(self):
        """Check if any of the limits are exceeded."""
        self._check_max_facilities_to_find()
        self._check_barrier_limits()

    @time_exec
    def _report_usage(self):
        """Add usage metering and royalty messages used to deduct credits in AGOL."""
        num_objects = self.get_count(self.output_demand_points, "AllocatedWeight IS NOT NULL")
        self.logger.debug("Usage report")
        self.logger.debug("Num Objects: %s", num_objects)
        metering_task_name = self.__class__.__name__
        nast.SERVER_PERF_METRICS["NumObjects"] = num_objects
        if num_objects:
            # As designed. pylint:disable=protected-access
            arcpy.gp._arc_object.LogUsageMetering(5555, metering_task_name, num_objects)
            arcpy.gp._arc_object.LogUsageMetering(9999,
                                                  (f"{os.path.basename(self.network_dataset)}::{self.provider}::"
                                                   f"{metering_task_name}"),
                                                  num_objects)
            # pylint:enable=protected-access
            usage_cost = {
                "numObjects": num_objects,
                "credits": self._usage_credits(num_objects)
            }
            self.usage_cost = json.dumps(usage_cost)

    def execute(self):
        """Tool execution logic."""
        self._validate()
        self._check_limits()
        self._solve_location_allocation()
        self._report_usage()
        # When returning a results file, set all other feature outputs to empty so that GPServer will not serailize
        # them to .dat files.
        if self.output_format != "Feature Set":
            self.output_facilities = ""
            self.output_demand_points = ""
            self.output_lines = ""


class ToolValidator(nast.ToolValidator):
    """Class for validating parameter values and controlling the behavior of the tool's dialog."""

    def __init__(self):
        """Initialize required things."""
        # Determine if running in a server context so that we can skip certain methods
        super().__init__()
        self.tool_name = "SolveLocationAllocation"
        self.nds_param = self.params[3]
        self.nds_extents_param = self.params[4]
        self.analysis_region_param = self.params[5]
        self.uturn_param = self.params[16]
        self.hiearchy_param = self.params[20]
        self.restrictions_param = self.params[21]
        self.attr_params_param = self.params[22]
        self.impedance_param = self.params[25]
        self.overrides_param = self.params[27]
        self.time_impedance_param = self.params[28]
        self.distance_impedance_param = self.params[29]
        self.accumulate_attrs_param = self.params[31]
        self.locate_settings_param = self.params[37]
