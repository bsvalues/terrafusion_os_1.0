"""Provides validation and execution logic for FindClosestFacilities tool."""

import logging
import locale
import os
import json
import uuid

import arcpy
from arcpy.na import _na as nax
import nat
import nast
from nast import time_exec


class FindClosestFacilities(nast.NASolverTool):
    """Provides execution logic for FindClosestFacilities tool."""

    # Define instance attributes in slots primarily for faster attribute lookups
    __slots__ = ("incidents", "facilities", "default_target_facility_count", "default_impedance_cutoff",
                 "travel_direction", "time_of_day", "time_zone", "time_of_day_usage", "route_shape_type",
                 "return_directions", "directions_lang", "directions_distance_units", "directions_style",
                 "save_route_data", "output_routes", "output_directions", "output_closest_facilities",
                 "output_route_data_file", "output_facilities", "output_incidents", "target_facility_count",
                 "output_direction_points", "output_direction_lines")

    TRAVEL_DIR = {
        "Facility to Incident": 0,
        "Incident to Facility": 1,
    }

    TIME_OF_DAY_USAGE = {
        "Start Time": 0,
        "End Time": 1,
    }

    def __init__(self, **kwargs):
        """Store names used in all methods."""
        super().__init__()
        # print parameter values when debugging
        if self.logger.level == logging.DEBUG:
            for param_name, param_value in kwargs.items():
                self.logger.debug("%s: %s, %s", param_name, type(param_value), param_value)

        self.extent_fields[-1] = "GPClosestFacilityService"  # field name used to store remote service conn info
        # Store tool parameter values as instance names.
        self.kwargs = kwargs
        self.incidents = kwargs["Incidents"]
        self.facilities = kwargs["Facilities"]
        self.measurement_unit = kwargs["Measurement_Units"].replace(" ", "")
        self.network_datasets = self.strip_quotes(kwargs["Network_Datasets"]).split(";")
        self.nd_extents = kwargs["Network_Dataset_Extents"]
        self.analysis_region = kwargs["Analysis_Region"]
        try:
            self.select_network_dataset([self.incidents, self.facilities])
        except ValueError:
            self.logger.error("", extra={"message_ID": 30125})
            raise nat.ToolExit from None
        self.default_target_facility_count = kwargs["Number_of_Facilities_to_Find"]
        self.target_facility_count = self._target_facility_count()
        default_cutoff_val = kwargs["Cutoff"]
        self.default_impedance_cutoff = locale.atof(default_cutoff_val) if default_cutoff_val else None
        self.travel_direction = self.TRAVEL_DIR[kwargs["Travel_Direction"]]
        self.use_hierarchy = kwargs["Use_Hierarchy"]
        self.time_of_day = kwargs["Time_of_Day"]
        self.time_of_day_usage = self.TIME_OF_DAY_USAGE[kwargs["Time_of_Day_Usage"]]
        self.uturn_at_junctions = kwargs["Uturn_at_Junctions"]
        self.point_barriers = kwargs["Point_Barriers"]
        self.line_barriers = kwargs["Line_Barriers"]
        self.polygon_barriers = kwargs["Polygon_Barriers"]
        self.restrictions = kwargs["Restrictions"]
        self.attribute_parameter_values = kwargs["Attribute_Parameter_Values"]
        self.route_shape_type = self.ROUTE_SHAPE_TYPE[kwargs["Route_Shape"]]
        simp_tol_value = kwargs["Route_Line_Simplification_Tolerance"]
        if not simp_tol_value:
            simp_tol_value = "0 Meters"
        self.simp_tol, self.simp_tol_unit = simp_tol_value.split(" ")
        self.simp_tol = locale.atof(self.simp_tol)
        self.return_directions = kwargs["Populate_Directions"]
        self.directions_lang = kwargs["Directions_Language"]
        self.directions_distance_units = nax.DistanceUnits[kwargs["Directions_Distance_Units"]]
        self.directions_style = self.DIRECTIONS_STYLE[kwargs["Directions_Style_Name"]]
        self.time_zone = self.TIME_ZONE[kwargs["Time_Zone_for_Time_of_Day"]]
        self.travel_mode = kwargs["Travel_Mode"]
        self.impedance = kwargs["Impedance"]
        self.save_layer_file = kwargs["Save_Output_Network_Analysis_Layer"]
        self.overrides = self._solver_perf_overrides(kwargs["Overrides"])
        self.save_route_data = kwargs["Save_Route_Data"]
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
        self.output_routes = ""
        self.output_directions = ""
        self.output_closest_facilities = ""
        self.output_facilities = ""
        self.output_incidents = ""
        self.output_route_data_file = ""
        self.output_layer_file = ""
        self.output_result_file = ""
        self.solve_succeeded = False
        self.output_direction_points = ""
        self.output_direction_lines = ""
        self.usage_cost = json.dumps({
            "numObjects": 0,
            "credits": 0
        })

    @time_exec
    def _find_closest_facilities(self):
        """Find closest facilities using closest facility solver object."""
        if self.conn_file:
            self._find_closest_facilities_svc()
            return
        # Create closest facility analysis object
        try:
            closest_facility = time_exec(nax.ClosestFacility)(self.network_dataset)
        except ValueError as ex:
            self.logger.error(ex)
            raise nat.ToolExit
        self.solver_object = closest_facility  # for cleanup at exit

        # Set analysis settings
        travel_mode = time_exec(self.get_travel_mode)()
        try:
            closest_facility.travelMode = travel_mode
        except ValueError as err:
            self.logger.error("", extra={
                "message_ID": 30232,
                "add_argument1": str(travel_mode),
                })
            self.logger.error(err)
            raise nat.ToolExit from None
        all_costs = self.nds_info.costs["allCosts"]
        if self.measurement_type == "TIME":
            closest_facility.timeUnits = nax.TimeUnits[self.measurement_unit]
            distance_unit = all_costs[travel_mode.distanceAttributeName].units
            closest_facility.distanceUnits = nax.DistanceUnits[distance_unit]
        elif self.measurement_type == "DISTANCE":
            closest_facility.distanceUnits = nax.DistanceUnits[self.measurement_unit]
            time_unit = all_costs[travel_mode.timeAttributeName].units
            closest_facility.timeUnits = nax.TimeUnits[time_unit]
        else:
            time_unit = all_costs[travel_mode.timeAttributeName].units
            closest_facility.timeUnits = nax.TimeUnits[time_unit]
            distance_unit = all_costs[travel_mode.distanceAttributeName].units
            closest_facility.distanceUnits = nax.DistanceUnits[distance_unit]

        if self.accumulate_attributes:
            closest_facility.accumulateAttributeNames = self.get_valid_accumulate_attributes()

        closest_facility.defaultImpedanceCutoff = self.default_impedance_cutoff
        closest_facility.defaultTargetFacilityCount = self.default_target_facility_count
        closest_facility.travelDirection = self.travel_direction
        closest_facility.timeOfDay = self.time_of_day
        closest_facility.timeOfDayUsage = self.time_of_day_usage
        closest_facility.timeZone = self.time_zone
        closest_facility.routeShapeType = self.route_shape_type
        closest_facility.returnDirections = self.return_directions
        if self.return_directions:
            closest_facility.directionsDistanceUnits = self.directions_distance_units
            closest_facility.directionsLanguage = self.directions_lang
            closest_facility.directionsStyle = self.directions_style
        closest_facility.overrides = self.overrides
        closest_facility.ignoreInvalidLocations = self.ignore_invalid_locations
        closest_facility.allowSaveRouteData = self.save_route_data
        closest_facility.allowSaveLayerFile = self.save_layer_file

        self._apply_locate_settings()
        self.logger.debug("Solver object properties")
        self.log_prop_values(closest_facility)

        # Load input data
        # Incidents
        self.logger.debug("Loading incidents")
        max_incidents_limit = self.limits.get("maximumIncidents", None)
        incidents_fm = time_exec(closest_facility.fieldMappings)(nax.ClosestFacilityInputDataType.Incidents,
                                                                 not self.ignore_loc_fields,
                                                                 arcpy.ListFields(self.incidents))
        self.logger.debug("Incidents field map: %s", "; ".join([str(incidents_fm[fm]) for fm in incidents_fm]))
        try:
            time_exec(closest_facility.load)(nax.ClosestFacilityInputDataType.Incidents, self.incidents,
                                             incidents_fm, True, max_incidents_limit)
        except nax.LimitError:
            self.logger.error("", extra={
                "message_ID": 30096,
                "add_argument1": "Incidents",
                "add_argument2": max_incidents_limit})
            raise nat.ToolExit from None
        except (nax.InputDataError, RuntimeError) as err:
            self.logger.error("", extra={
                "message_ID": 30251,
                "add_argument1": "Incidents",
            })
            self.logger.error(err)
            raise nat.ToolExit from None

        # Facilities
        self.logger.debug("Loading facilities")
        max_facilities_limit = self.limits.get("maximumFacilities", None)
        facilities_fm = time_exec(closest_facility.fieldMappings)(nax.ClosestFacilityInputDataType.Facilities,
                                                                  not self.ignore_loc_fields,
                                                                  arcpy.ListFields(self.facilities))
        self.logger.debug("Facilities field map: %s", "; ".join([str(facilities_fm[fm]) for fm in facilities_fm]))
        try:
            time_exec(closest_facility.load)(nax.ClosestFacilityInputDataType.Facilities, self.facilities,
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
                time_exec(closest_facility.load)(nax.ClosestFacilityInputDataType.PointBarriers, self.point_barriers)
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
                time_exec(closest_facility.load)(nax.ClosestFacilityInputDataType.LineBarriers, self.line_barriers)
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
                time_exec(closest_facility.load)(nax.ClosestFacilityInputDataType.PolygonBarriers,
                                                 self.polygon_barriers)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Polygon Barriers",
                })
                self.logger.error(err)
                raise nat.ToolExit from None

        input_counts = {}
        for input_type in nax.ClosestFacilityInputDataType:
            input_counts[f"{input_type.name.replace('Point', '')}Count"] = closest_facility.count(input_type.value)
        nast.SERVER_PERF_METRICS["LoadLocations"] = input_counts

        # Perform checks that are dependent on straight line distance between inputs. The distance between the inputs
        # can be calculated only after loading all the inputs into solver objects.
        self.max_meters_amid_inputs = closest_facility._maxMetersBetweenInputs()  # As D pylint:disable=protected-access
        nast.SERVER_PERF_METRICS["GeodesicDistance"] = round(self.max_meters_amid_inputs, nast.PERF_METRICS_PRECISION)
        self._check_walking_limit()
        # Force hierarchy if required to
        if travel_mode.useHierarchy == "NO_HIERARCHY":
            if self._force_hierarchy():
                travel_mode_dict = json.loads(str(travel_mode))
                travel_mode_dict["useHierarchy"] = True
                travel_mode = self._travel_mode_from_json(json.dumps(travel_mode_dict))
                closest_facility.travelMode = travel_mode

        # Solve
        # constrain the search space for exact solves
        if travel_mode.useHierarchy == "NO_HIERARCHY":
            self._add_route_cutoff()
        with nast.PerfTimer("SolveTimeInSeconds"):
            result = time_exec(closest_facility.solve)()
        self.solver_result = result
        self.solve_succeeded = result.solveSucceeded
        self.log_solver_messages(result)
        if not self.solve_succeeded:
            raise nat.ToolExit

        routes_extent = result.extent(nax.ClosestFacilityOutputDataType.Routes)
        nast.SERVER_PERF_METRICS["BoundingBox"] = [
            round(routes_extent.XMin, nast.PERF_METRICS_PRECISION),
            round(routes_extent.YMin, nast.PERF_METRICS_PRECISION),
            round(routes_extent.XMax, nast.PERF_METRICS_PRECISION),
            round(routes_extent.YMax, nast.PERF_METRICS_PRECISION),
        ]
        try:
            with result.searchCursor(nax.ClosestFacilityOutputDataType.Routes,
                                     f"Total_{self.measurement_unit}") as cursor:
                nast.SERVER_PERF_METRICS["Impedances"] = [round(max({row[0] for row in cursor}),
                                                               nast.PERF_METRICS_PRECISION)]
        except Exception:  # Ok to skip in case we got incorrect Total_field. pylint:disable=broad-exception-caught
            self.logger.info("Error when reporting impedances", exc_info=True)

        with nast.PerfTimer("OutputTimeInSeconds"):
            # Export outputs
            # See comment in fr.py about creating ouputs with empty schema.
            # Directions
            # if self.return_directions:
            self._check_max_output_features(nax.ClosestFacilityOutputDataType.Directions, 30142)
            self.output_directions = os.path.join(self.output_gdb, self.output_names[1][1])
            self.logger.debug("Exporting directions to '%s'", self.output_directions)
            time_exec(result.export)(nax.ClosestFacilityOutputDataType.Directions, self.output_directions)
            # Direction Points and Direction Lines
            if self.return_directions:
                self._check_max_output_features(nax.ClosestFacilityOutputDataType.DirectionPoints, 30293)
                self._check_max_output_features(nax.ClosestFacilityOutputDataType.DirectionLines, 30294)
                self.output_direction_points = os.path.join(self.output_gdb, self.output_names[5][1])
                self.output_direction_lines = os.path.join(self.output_gdb, self.output_names[6][1])
                self.logger.debug("Exporting direction points to '%s'", self.output_direction_points)
                time_exec(result.export)(nax.ClosestFacilityOutputDataType.DirectionPoints,
                                         self.output_direction_points)
                self.logger.debug("Exporting direction lines to '%s'", self.output_direction_lines)
                time_exec(result.export)(nax.ClosestFacilityOutputDataType.DirectionLines, self.output_direction_lines)

            # Routes
            self.output_routes = os.path.join(self.output_gdb, self.output_names[0][1])
            self.logger.debug("Exporting routes to '%s'", self.output_routes)
            time_exec(result.export)(nax.ClosestFacilityOutputDataType.Routes, self.output_routes)
            # Closest Facilities
            self.output_closest_facilities = os.path.join(self.output_gdb, self.output_names[2][1])
            self.logger.debug("Exporting closest facilities to '%s'", self.output_closest_facilities)
            time_exec(result.export)(nax.ClosestFacilityOutputDataType.ClosestFacilities,
                                    self.output_closest_facilities)
            # Facilities
            self.output_facilities = os.path.join(self.output_gdb, self.output_names[3][1])
            self.logger.debug("Exporting output facilities to '%s'", self.output_facilities)
            time_exec(result.export)(nax.ClosestFacilityOutputDataType.Facilities, self.output_facilities)
            # Incidents
            self.output_incidents = os.path.join(self.output_gdb, self.output_names[4][1])
            self.logger.debug("Exporting output incidents to '%s'", self.output_incidents)
            time_exec(result.export)(nax.ClosestFacilityOutputDataType.Incidents, self.output_incidents)
            # Route Data
            if self.save_route_data:
                self.output_route_data_file = os.path.join(arcpy.env.scratchFolder,  # False+ve pylint:disable=no-member
                                                        f"_ags_rd{uuid.uuid4().hex}.zip")
                self.logger.debug("Exporting route data to '%s'", self.output_route_data_file)
                try:
                    time_exec(result.saveRouteData)(self.output_route_data_file)
                except RuntimeError as err:
                    self.logger.error(err)
                    self.logger.error("", extra={"message_ID": 30172})
                    raise nat.ToolExit from None
            # Layer file
            if self.save_layer_file:
                self.save_as_layer_file(result)
            # File based result
            if self.output_format != "Feature Set":
                export_datasets = dict.fromkeys((self.output_facilities, self.output_closest_facilities,
                                                self.output_incidents, self.output_routes, self.output_directions,
                                                self.output_direction_points, self.output_direction_lines),
                                                "FEATURECLASS")
                self.output_result_file = self.create_result_file(export_datasets, self.output_format)

    @time_exec
    def _find_closest_facilities_svc(self):
        """Find closest facilities using a geoprocessing service."""
        # Copy input feature sets as they can be referencing a URL which might not be accessible to the remote service
        # Not copying attribute parameter values as it is rare that someone will pass attribute parameter values from
        # a URL
        incidents = self._copy_features(self.incidents, check_validity=False)
        facilities = self._copy_features(self.facilities, check_validity=False)
        point_barriers = self._copy_features(self.point_barriers)
        line_barriers = self._copy_features(self.line_barriers)
        polygon_barriers = self._copy_features(self.polygon_barriers)
        task_params = [incidents, facilities, self.measurement_unit, "#", self.default_target_facility_count,
                       self.default_impedance_cutoff, self.kwargs["Travel_Direction"], self.use_hierarchy,
                       self.time_of_day, self.kwargs["Time_of_Day_Usage"], self.uturn_at_junctions, point_barriers,
                       line_barriers, polygon_barriers, self.restrictions, self.attribute_parameter_values,
                       self.kwargs["Route_Shape"], self.kwargs["Route_Line_Simplification_Tolerance"],
                       self.return_directions, self.directions_lang, self.kwargs["Directions_Distance_Units"],
                       self.kwargs["Directions_Style_Name"], self.kwargs["Time_Zone_for_Time_of_Day"],
                       self.kwargs["Travel_Mode"], self.impedance, self.save_layer_file, self.overrides,
                       self.save_route_data, self.time_impedance, self.distance_impedance, self.output_format,
                       self.ignore_invalid_locations, self.locate_settings]
        try:
            result = self._call_remote_tool(task_params, 14)
        except Exception:  # Raise known error for unexpected remote tool failure. pylint:disable=broad-except
            self.logger.info("Failed to execute remote tool '%s'", self.remote_svc_name)
            self.logger.info("Exception details:", exc_info=True)
            self.logger.error("", extra={"message_ID": 30295})
            raise nat.ToolExit from None

        if result.maxSeverity == 2:
            self.solve_succeeded = False
            raise nat.ToolExit
        # Save the results
        solve_status = result.getOutput(2)
        if solve_status.lower() == 'true':
            self.solve_succeeded = True
        # Routes
        self.output_routes = os.path.join(self.output_gdb, self.output_names[0][1])
        arcpy.management.CopyFeatures(result.getOutput(0), self.output_routes)
        # ClosestFacilities
        self.output_closest_facilities = os.path.join(self.output_gdb, self.output_names[2][1])
        arcpy.management.CopyFeatures(result.getOutput(3), self.output_closest_facilities)
        # Facilities
        self.output_facilities = os.path.join(self.output_gdb, self.output_names[3][1])
        arcpy.management.CopyFeatures(result.getOutput(7), self.output_facilities)
        # Incidents
        self.output_incidents = os.path.join(self.output_gdb, self.output_names[4][1])
        arcpy.management.CopyFeatures(result.getOutput(6), self.output_incidents)
        # Directions
        try:
            self.output_directions = os.path.join(self.output_gdb, self.output_names[1][1])
            arcpy.management.CopyFeatures(result.getOutput(1), self.output_directions)
        except arcpy.ExecuteError:
            self.logger.info("Returning empty feature set for directions.")
            self.logger.debug("Error while saving directions: ", exc_info=True)
            self.output_directions = ""
        # Network Analysis layer
        self.output_layer_file = result.getOutput(4)
        # Route data
        self.output_route_data_file = result.getOutput(5)
        # File based result
        self.output_result_file = result.getOutput(8)
        # Remote service may not support newly added output parameters at 10.9
        if result.outputCount >= 12:
            self.output_layer_package = result.getOutput(9)
            if self.return_directions:
                self.output_direction_points = os.path.join(self.output_gdb, self.output_names[5][1])
                self.output_direction_lines = os.path.join(self.output_gdb, self.output_names[6][1])
                arcpy.management.CopyFeatures(result.getOutput(10), self.output_direction_points)
                arcpy.management.CopyFeatures(result.getOutput(11), self.output_direction_lines)

    @time_exec
    def _target_facility_count(self):
        """Parse target facility count values that are specified for each incident feature.

        Returns:
            A long representing the target facility count based on the default count for all incidents or the count
            specified per incident feature.

        """
        target_facility_count = 0
        try:
            with arcpy.da.SearchCursor(self.incidents,  # False positive. pylint:disable=no-member
                                       "TargetFacilityCount") as cursor:
                target_counts = [row[-1] for row in cursor if row[-1]]
            if target_counts:
                target_facility_count = max(target_counts)
        except RuntimeError:
            # need to use default target facility count if cursor cannot be created
            return self.default_target_facility_count
        return max((target_facility_count, self.default_target_facility_count))

    @time_exec
    def _validate(self):
        """Raise a terminating exception if a validation check fails.

        Raises:
            ToolExit for a failed validation check.

        """
        super()._validate()

        if self.simp_tol < 0:
            self.logger.error("", extra={"message_ID": 30111, "add_argument1": "Route_Line_Simplification_Tolerance"})
            raise nat.ToolExit

        if self.default_impedance_cutoff is not None and self.default_impedance_cutoff <= 0:
            self.logger.error("", extra={"message_ID": 30112, "add_argument1": "Cutoff"})
            raise nat.ToolExit

        if self.default_target_facility_count <= 0:
            self.logger.error("", extra={"message_ID": 30112, "add_argument1": "Number_of_Facilities_to_Find"})
            raise nat.ToolExit

    @time_exec
    def _check_max_facilities_to_find(self):
        """Raise a terminating error if maximum facilities to find exceeds limits."""
        max_fac_to_find_limit = self.limits.get("maximumFacilitiesToFind", None)
        if max_fac_to_find_limit is None:
            return
        if self.target_facility_count > max_fac_to_find_limit:
            self.logger.error("", extra={
                "message_ID": 30126,
                "add_argument1": self.target_facility_count,
                "add_argument2": max_fac_to_find_limit})
            raise nat.ToolExit

    def _check_limits(self):
        """Check if any of the limits are exceeded."""
        self._check_max_facilities_to_find()
        self._check_barrier_limits()

    @time_exec
    def _report_usage(self):
        """Add usage metering and royalty messages used to deduct credits in AGOL."""
        # We don't have a solver result when working with a remote service.
        if self.solver_result:
            num_objects = self.solver_result.count(nax.ClosestFacilityOutputDataType.Routes)
        else:
            num_objects = self.get_count(self.output_routes)
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
        self._find_closest_facilities()
        self._report_usage()
        # When returning a results file, set all other feature outputs to empty so that GPServer will not serailize
        # them to .dat files.
        if self.output_format != "Feature Set":
            self.output_facilities = ""
            self.output_closest_facilities = ""
            self.output_incidents = ""
            self.output_routes = ""
            self.output_directions = ""


class ToolValidator(nast.ToolValidator):
    """Class for validating parameter values and controlling the behavior of the tool's dialog."""

    def __init__(self):
        """Initialize required things."""
        # Determine if running in a server context so that we can skip certain methods
        super().__init__()
        self.tool_name = "FindClosestFacilities"
        self.nds_param = self.params[3]
        self.nds_extents_param = self.params[4]
        self.analysis_region_param = self.params[5]
        self.hiearchy_param = self.params[9]
        self.uturn_param = self.params[12]
        self.restrictions_param = self.params[16]
        self.attr_params_param = self.params[17]
        self.simp_tol_param = self.params[19]
        self.directions_lang_param = self.params[21]
        self.impedance_param = self.params[26]
        self.overrides_param = self.params[28]
        self.time_impedance_param = self.params[30]
        self.distance_impedance_param = self.params[31]
        self.accumulate_attrs_param = self.params[33]
        self.locate_settings_param = self.params[39]
