"""Provides validation and execution logic for FindRoutes tool."""

import logging
import locale
import os
import json
import uuid
from collections import defaultdict

import arcpy
from arcpy.na import _na as nax
import nat
import nast
from nast import time_exec


class FindRoutes(nast.NASolverTool):
    """Provides execution logic for FindRoutes tool."""

    # Define instance attributes in slots primarily for faster attribute lookups
    __slots__ = ("stops", "find_best_sequence", "preserve_terminal_stops", "return_to_start", "use_time_windows",
                 "time_of_day", "time_zone", "route_shape_type", "populate_route_edges", "return_directions",
                 "directions_lang", "directions_distance_units", "directions_style", "time_zone_for_time_windows",
                 "save_route_data", "output_routes", "output_directions", "output_route_edges", "output_stops",
                 "output_route_data_file", "output_direction_points", "output_direction_lines")

    def __init__(self, **kwargs):
        """Store names used in all methods."""
        super().__init__()
        # print parameter values when debugging
        if self.logger.level == logging.DEBUG:
            for param_name, param_value in kwargs.items():
                self.logger.debug("%s: %s, %s", param_name, type(param_value), param_value)

        self.extent_fields[-1] = "GPRouteService"  # field name used to store remote service conn info
        # Store tool parameter values as instance names.
        self.kwargs = kwargs
        self.stops = kwargs["Stops"]
        self.measurement_unit = kwargs["Measurement_Units"].replace(" ", "")
        self.network_datasets = self.strip_quotes(kwargs["Network_Datasets"]).split(";")
        # self.network_datasets = kwargs["Network_Datasets"]
        self.nd_extents = kwargs["Network_Dataset_Extents"]
        self.analysis_region = kwargs["Analysis_Region"]
        try:
            self.select_network_dataset([self.stops])
        except ValueError:
            self.logger.error("", extra={"message_ID": 30134})
            raise nat.ToolExit from None
        self.find_best_sequence = kwargs["Reorder_Stops_to_Find_Optimal_Routes"]
        self.preserve_terminal_stops = kwargs["Preserve_Terminal_Stops"]
        self.return_to_start = kwargs["Return_to_Start"]
        self.use_time_windows = kwargs["Use_Time_Windows"]
        self.time_of_day = kwargs["Time_of_Day"]
        self.time_zone = self.TIME_ZONE[kwargs["Time_Zone_for_Time_of_Day"]]
        self.uturn_at_junctions = kwargs["Uturn_at_Junctions"]
        self.point_barriers = kwargs["Point_Barriers"]
        self.line_barriers = kwargs["Line_Barriers"]
        self.polygon_barriers = kwargs["Polygon_Barriers"]
        self.use_hierarchy = kwargs["Use_Hierarchy"]
        self.restrictions = kwargs["Restrictions"]
        self.attribute_parameter_values = kwargs["Attribute_Parameter_Values"]
        self.route_shape_type = self.ROUTE_SHAPE_TYPE[kwargs["Route_Shape"]]
        simp_tol_value = kwargs["Route_Line_Simplification_Tolerance"]
        if not simp_tol_value:
            simp_tol_value = "0 Meters"
        self.simp_tol, self.simp_tol_unit = simp_tol_value.split(" ")
        self.simp_tol = locale.atof(self.simp_tol)
        self.populate_route_edges = kwargs["Populate_Route_Edges"]
        self.return_directions = kwargs["Populate_Directions"]
        self.directions_lang = kwargs["Directions_Language"]
        self.directions_distance_units = nax.DistanceUnits[kwargs["Directions_Distance_Units"]]
        self.directions_style = self.DIRECTIONS_STYLE[kwargs["Directions_Style_Name"]]
        self.travel_mode = kwargs["Travel_Mode"]
        self.impedance = kwargs["Impedance"]
        self.time_zone_for_time_windows = self.TIME_ZONE[kwargs["Time_Zone_for_Time_Windows"]]
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
        self.output_route_edges = ""
        self.output_stops = ""
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
    def _find_routes(self):
        """Find routes using route solver object."""
        if self.conn_file:
            self._find_routes_svc()
            return
        # Create route analysis object
        try:
            route_so = time_exec(nax.Route)(self.network_dataset)
        except ValueError as ex:
            self.logger.error(ex)
            raise nat.ToolExit
        self.solver_object = route_so  # for cleanup at exit

        # Set analysis settings
        travel_mode = time_exec(self.get_travel_mode)()
        try:
            route_so.travelMode = travel_mode
        except ValueError as err:
            self.logger.error("", extra={
                "message_ID": 30232,
                "add_argument1": str(travel_mode),
                })
            self.logger.error(err)
            raise nat.ToolExit from None
        all_costs = self.nds_info.costs["allCosts"]
        if self.measurement_type == "TIME":
            route_so.timeUnits = nax.TimeUnits[self.measurement_unit]
            distance_unit = all_costs[travel_mode.distanceAttributeName].units
            route_so.distanceUnits = nax.DistanceUnits[distance_unit]
        elif self.measurement_type == "DISTANCE":
            route_so.distanceUnits = nax.DistanceUnits[self.measurement_unit]
            time_unit = all_costs[travel_mode.timeAttributeName].units
            route_so.timeUnits = nax.TimeUnits[time_unit]
        else:
            time_unit = all_costs[travel_mode.timeAttributeName].units
            route_so.timeUnits = nax.TimeUnits[time_unit]
            distance_unit = all_costs[travel_mode.distanceAttributeName].units
            route_so.distanceUnits = nax.DistanceUnits[distance_unit]

        if self.accumulate_attributes:
            route_so.accumulateAttributeNames = self.get_valid_accumulate_attributes()

        if self.find_best_sequence:
            route_so.findBestSequence = self.find_best_sequence
            if self.preserve_terminal_stops == "Preserve First":
                route_so.preserveFirstStop = True
            elif self.preserve_terminal_stops == "Preserve Last":
                route_so.preserveLastStop = True
            elif self.preserve_terminal_stops == "Preserve First and Last":
                route_so.preserveFirstStop = True
                route_so.preserveLastStop = True
            elif self.preserve_terminal_stops == "Preserve None":
                route_so.preserveFirstStop = False
                route_so.preserveLastStop = False
        route_so.returnToStart = self.return_to_start
        route_so.timeOfDay = self.time_of_day
        route_so.timeZone = self.time_zone
        route_so.timeZoneForTimeWindows = self.time_zone_for_time_windows
        route_so.routeShapeType = self.route_shape_type
        route_so.returnRouteEdges = self.populate_route_edges
        route_so.returnRouteJunctions = False
        route_so.returnRouteTurns = False
        route_so.returnDirections = self.return_directions
        if self.return_directions:
            route_so.directionsDistanceUnits = self.directions_distance_units
            route_so.directionsLanguage = self.directions_lang
            route_so.directionsStyle = self.directions_style
        route_so.overrides = self.overrides
        route_so.ignoreInvalidLocations = self.ignore_invalid_locations
        route_so.allowSaveRouteData = self.save_route_data
        route_so.allowSaveLayerFile = self.save_layer_file
        self._apply_locate_settings()
        self.logger.debug("Solver object properties")
        self.log_prop_values(route_so)

        # Load input data
        self.logger.debug("Loading stops")
        max_stops_limit = self.limits.get("maximumStops", None)
        stops_fm = time_exec(route_so.fieldMappings)(nax.RouteInputDataType.Stops, not self.ignore_loc_fields,
                                                     arcpy.ListFields(self.stops))
        if not self.use_time_windows:
            for fld in ("TimeWindowStart", "TimeWindowEnd"):
                if fld in stops_fm:
                    tw_fm = stops_fm[fld]
                    tw_fm.mappedFieldName = ""

        self.logger.debug("Stops field map: %s", "; ".join([str(stops_fm[fm]) for fm in stops_fm]))
        try:
            time_exec(route_so.load)(nax.RouteInputDataType.Stops, self.stops, stops_fm, True, max_stops_limit)
        except nax.LimitError:
            self.logger.error("", extra={
                "message_ID": 30096,
                "add_argument1": "Stops",
                "add_argument2": max_stops_limit})
            raise nat.ToolExit from None
        except (nax.InputDataError, RuntimeError) as err:
            self.logger.error("", extra={
                "message_ID": 30251,
                "add_argument1": "Stops",
            })
            self.logger.error(err)
            raise nat.ToolExit from None

        if self._is_valid(self.point_barriers):
            self.logger.debug("Loading point barriers")
            try:
                time_exec(route_so.load)(nax.RouteInputDataType.PointBarriers, self.point_barriers)
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
                time_exec(route_so.load)(nax.RouteInputDataType.LineBarriers, self.line_barriers)
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
                time_exec(route_so.load)(nax.RouteInputDataType.PolygonBarriers, self.polygon_barriers)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Polygon Barriers",
                })
                self.logger.error(err)
                raise nat.ToolExit from None

        input_counts = {}
        for input_type in nax.RouteInputDataType:
            input_counts[f"{input_type.name.replace('Point', '')}Count"] = route_so.count(input_type.value)
        nast.SERVER_PERF_METRICS["LoadLocations"] = input_counts

        # Perform checks that are dependent on straight line distance between inputs. The distance between the inputs
        # can be calculated only after loading all the inputs into solver objects.
        self.max_meters_amid_inputs = route_so._maxMetersBetweenInputs()  # As designed. pylint:disable=protected-access
        nast.SERVER_PERF_METRICS["GeodesicDistance"] = round(self.max_meters_amid_inputs, nast.PERF_METRICS_PRECISION)
        self._check_walking_limit()
        # Force hierarchy if required to
        if travel_mode.useHierarchy == "NO_HIERARCHY":
            if self._force_hierarchy():
                travel_mode_dict = json.loads(str(travel_mode))
                travel_mode_dict["useHierarchy"] = True
                travel_mode = self._travel_mode_from_json(json.dumps(travel_mode_dict))
                route_so.travelMode = travel_mode

        # Solve
        # constrain the search space for exact solves
        if travel_mode.useHierarchy == "NO_HIERARCHY":
            self._add_route_cutoff()
        with nast.PerfTimer("SolveTimeInSeconds"):
            result = time_exec(route_so.solve)()
        self.solver_result = result
        self.solve_succeeded = result.solveSucceeded
        self.log_solver_messages(result)

        # Quit if solve failed
        if not self.solve_succeeded:
            raise nat.ToolExit

        stops_extent = result.extent(nax.RouteOutputDataType.Stops)
        nast.SERVER_PERF_METRICS["BoundingBox"] = [
            round(stops_extent.XMin, nast.PERF_METRICS_PRECISION),
            round(stops_extent.YMin, nast.PERF_METRICS_PRECISION),
            round(stops_extent.XMax, nast.PERF_METRICS_PRECISION),
            round(stops_extent.YMax, nast.PERF_METRICS_PRECISION),
        ]
        try:
            with result.searchCursor(nax.RouteOutputDataType.Routes, f"Total_{self.measurement_unit}") as cursor:
                nast.SERVER_PERF_METRICS["Impedances"] = [round(row[0], nast.PERF_METRICS_PRECISION) for row in cursor]
        except Exception:  # Ok to skip in case we got incorrect Total_field. pylint:disable=broad-exception-caught
            self.logger.info("Error when reporting impedances", exc_info=True)

        with nast.PerfTimer("OutputTimeInSeconds"):
            # Export outputs
            # In 10.x, we create empty directions and route edges feature classes when those outputs are not populated.
            # We don't want to break backwards compatibility. We will wait for at least one release and then stop
            # returning empty feature sets for directions and reoute edges.
            # At 10.9, we are adding new output, directionPoints and directionLines that do not have any legacy.
            # So we output them only when directions are requested. Otherwise the service returns None and NOT an empty
            # feature class even though the solver objects can return empty direction points and direction lines.

            # Directions
            self._check_max_output_features(nax.RouteOutputDataType.Directions, 30142)
            self.output_directions = os.path.join(self.output_gdb, self.output_names[2][1])
            self.logger.debug("Exporting directions to '%s'", self.output_directions)
            time_exec(result.export)(nax.RouteOutputDataType.Directions, self.output_directions)
            # Direction Points and Direction Lines
            if self.return_directions:
                self._check_max_output_features(nax.RouteOutputDataType.DirectionPoints, 30293)
                self._check_max_output_features(nax.RouteOutputDataType.DirectionLines, 30294)
                self.output_direction_points = os.path.join(self.output_gdb, self.output_names[4][1])
                self.output_direction_lines = os.path.join(self.output_gdb, self.output_names[5][1])
                self.logger.debug("Exporting direction points to '%s'", self.output_direction_points)
                time_exec(result.export)(nax.RouteOutputDataType.DirectionPoints, self.output_direction_points)
                self.logger.debug("Exporting direction lines to '%s'", self.output_direction_lines)
                time_exec(result.export)(nax.RouteOutputDataType.DirectionLines, self.output_direction_lines)
            # Route edges
            self._check_max_output_features(nax.RouteOutputDataType.RouteEdges, 30143)
            self.output_route_edges = os.path.join(self.output_gdb, self.output_names[1][1])
            self.logger.debug("Exporting route edges to '%s'", self.output_route_edges)
            time_exec(result.export)(nax.RouteOutputDataType.RouteEdges, self.output_route_edges)
            # Stops
            self.output_stops = os.path.join(self.output_gdb, self.output_names[3][1])
            self.logger.debug("Exporting stops to '%s'", self.output_stops)
            time_exec(result.export)(nax.RouteOutputDataType.Stops, self.output_stops)
            # Routes
            self.output_routes = os.path.join(self.output_gdb, self.output_names[0][1])
            self.logger.debug("Exporting routes to '%s'", self.output_routes)
            time_exec(result.export)(nax.RouteOutputDataType.Routes, self.output_routes)
            # Route data
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
            if self.save_layer_file:
                self.save_as_layer_file(result)
            # File based result
            if self.output_format != "Feature Set":
                export_datasets = dict.fromkeys((self.output_stops, self.output_routes, self.output_route_edges,
                                                self.output_directions, self.output_direction_points,
                                                self.output_direction_lines),
                                                "FEATURECLASS")
                self.output_result_file = self.create_result_file(export_datasets, self.output_format)

    @time_exec
    def _find_routes_svc(self):
        """Find routes using a geoprocessing service."""
        # Copy input feature sets as they can be referencing a URL which might not be accessible to the remote service
        # Not copying attribute parameter values as it is rare that someone will pass attribute parameter values from
        # a URL
        stops = self._copy_features(self.stops, check_validity=False)
        point_barriers = self._copy_features(self.point_barriers)
        line_barriers = self._copy_features(self.line_barriers)
        polygon_barriers = self._copy_features(self.polygon_barriers)
        task_params = [stops, self.measurement_unit, "#", self.find_best_sequence, self.preserve_terminal_stops,
                       self.return_to_start, self.use_time_windows, self.time_of_day,
                       self.kwargs["Time_Zone_for_Time_of_Day"], self.uturn_at_junctions, point_barriers,
                       line_barriers, polygon_barriers, self.use_hierarchy, self.restrictions,
                       self.attribute_parameter_values, self.kwargs["Route_Shape"],
                       self.kwargs["Route_Line_Simplification_Tolerance"], self.populate_route_edges,
                       self.return_directions, self.directions_lang, self.kwargs["Directions_Distance_Units"],
                       self.kwargs["Directions_Style_Name"], self.kwargs["Travel_Mode"], self.impedance,
                       self.kwargs["Time_Zone_for_Time_Windows"], self.save_layer_file, self.overrides,
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
        solve_status = result.getOutput(0)
        if solve_status.lower() == 'true':
            self.solve_succeeded = True
        self.output_routes = os.path.join(self.output_gdb, self.output_names[0][1])
        arcpy.management.CopyFeatures(result.getOutput(1), self.output_routes)
        self.output_stops = os.path.join(self.output_gdb, self.output_names[3][1])
        arcpy.management.CopyFeatures(result.getOutput(4), self.output_stops)
        try:
            self.output_route_edges = os.path.join(self.output_gdb, self.output_names[1][1])
            arcpy.management.CopyFeatures(result.getOutput(2), self.output_route_edges)
        except arcpy.ExecuteError:
            self.logger.info("Returning empty feature set for route edges.")
            self.logger.debug("Error while saving route edges: ", exc_info=True)
            self.output_route_edges = ""
        try:
            self.output_directions = os.path.join(self.output_gdb, self.output_names[2][1])
            arcpy.management.CopyFeatures(result.getOutput(3), self.output_directions)
        except arcpy.ExecuteError:
            self.logger.info("Returning empty feature set for directions.")
            self.logger.debug("Error while saving directions: ", exc_info=True)
            self.output_directions = ""
        self.output_layer_file = result.getOutput(5)
        self.output_route_data_file = result.getOutput(6)
        self.output_result_file = result.getOutput(7)
        # Remote service may not support newly added output parameters at 10.9
        if result.outputCount >= 11:
            self.output_layer_package = result.getOutput(8)
            if self.return_directions:
                self.output_direction_points = os.path.join(self.output_gdb, self.output_names[4][1])
                self.output_direction_lines = os.path.join(self.output_gdb, self.output_names[5][1])
                arcpy.management.CopyFeatures(result.getOutput(9), self.output_direction_points)
                arcpy.management.CopyFeatures(result.getOutput(10), self.output_direction_lines)

    @time_exec
    def _validate(self):
        """Raise a termination exception if a validation check fails.

        Raises:
            ToolExit for a failed validation check.

        """
        super()._validate()

        if self.simp_tol < 0:
            self.logger.error("", extra={"message_ID": 30111, "add_argument1": "Route_Line_Simplification_Tolerance"})
            raise nat.ToolExit

        # When choosing to return to start and reorder stops to find optimal routes, you can only choose to preserve
        # the first stop.
        if self.return_to_start and self.find_best_sequence:
            if self.preserve_terminal_stops != "Preserve First":
                self.logger.error("", extra={"message_ID": 30141})
                raise nat.ToolExit

        # For ArcGIS Online, check for fine grained privileges for route and TSP
        with nast.PerfTimer("CheckPrivilegeInSeconds"):
            try:
                service_props = json.loads(arcpy.gp.serviceProperties())
                task_settings = json.loads(service_props.get("taskAdminSettings", "{}"))
                check_privilege = task_settings.get("checkPrivilege", "false") == "true"
            except Exception:  # Need to skip this check in case on any errors. pylint:disable=broad-except
                check_privilege = False
            if check_privilege:
                if self.find_best_sequence:
                    if not arcpy.gp.checkPrivilege("premium:user:networkanalysis:optimizedrouting"):
                        self.logger.error("", extra={"message_ID": 30286})
                        raise nat.ToolExit
                else:
                    if not arcpy.gp.checkPrivilege("premium:user:networkanalysis:routing"):
                        self.logger.error("", extra={"message_ID": 30285})
                        raise nat.ToolExit

    @time_exec
    def _check_max_stops_per_route(self):
        """Enforce max stops per route limit and return a termination error if violated."""
        limit_value = self.limits.get("maximumStopsPerRoute", None)
        if not limit_value:
            return
        stops_per_route = defaultdict(int)
        try:
            with arcpy.da.SearchCursor(self.stops, "RouteName") as cursor:  # False positive. pylint:disable=no-member
                for row in cursor:
                    if row[0] is not None:
                        stops_per_route[row[0]] += 1
        except RuntimeError:
            # route name field is not specified. So maximumStops should be same as maximumStopsPerRoute.
            self.limits["maximumStops"] = limit_value
            return

        if not stops_per_route:
            # All RouteName values are Null. So maximumStops should be same as maximumStopsPerRoute.
            self.limits["maximumStops"] = limit_value
            return

        max_stops = max(stops_per_route.values())
        if max_stops > limit_value:
            for key, value in stops_per_route.items():
                if value == max_stops:
                    route_name = key
                    break
            else:
                route_name = "None"
            self.logger.error("", extra={
                "message_ID": 30135,
                "add_argument1": f"'{route_name}', {max_stops},",
                "add_argument2": limit_value
            })
            raise nat.ToolExit

    def _check_limits(self):
        """Check if any of the limits are exceeded."""
        self._check_max_stops_per_route()
        self._check_barrier_limits()

    @time_exec
    def _report_usage(self):
        """Add usage metering and royalty messages used to deduct credits in AGOL."""
        # We don't have a solver result when working with a remote service.
        if self.solver_result:
            num_objects = self.solver_result.count(nax.RouteOutputDataType.Routes)
        else:
            num_objects = self.get_count(self.output_routes)
        # Include whether we solved TSP in the task name
        if self.find_best_sequence:
            metering_task_name = "tsp::Route"
        else:
            metering_task_name = "simple::Route"
        self.logger.debug("Usage report")
        self.logger.debug("route type: %s", metering_task_name)
        self.logger.debug("Num Objects: %s", num_objects)
        nast.SERVER_PERF_METRICS["NumObjects"] = num_objects
        if num_objects:
            # As designed. pylint:disable=protected-access
            arcpy.gp._arc_object.LogUsageMetering(5555, metering_task_name, num_objects)
            # royalty messages also require metering task name. CR367924
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
        self._find_routes()
        self._report_usage()
        # When returning a results file, set all other feature outputs to empty so that GPServer will not serailize
        # them to .dat files.
        if self.output_format != "Feature Set":
            self.output_stops = ""
            self.output_routes = ""
            self.output_route_edges = ""
            self.output_directions = ""
            self.output_direction_points = ""
            self.output_direction_lines = ""


class ToolValidator(nast.ToolValidator):
    """Class for validating parameter values and controlling the behavior of the tool's dialog."""

    def __init__(self):
        """Initialize required things."""
        # Determine if running in a server context so that we can skip certain methods
        super().__init__()
        self.tool_name = "FindRoutes"
        self.nds_param = self.params[2]
        self.nds_extents_param = self.params[3]
        self.analysis_region_param = self.params[4]
        self.uturn_param = self.params[11]
        self.hiearchy_param = self.params[15]
        self.restrictions_param = self.params[16]
        self.attr_params_param = self.params[17]
        self.simp_tol_param = self.params[19]
        self.directions_lang_param = self.params[22]
        self.impedance_param = self.params[26]
        self.overrides_param = self.params[29]
        self.time_impedance_param = self.params[31]
        self.distance_impedance_param = self.params[32]
        self.accumulate_attrs_param = self.params[34]
        self.locate_settings_param = self.params[40]
