"""Provides validation and execution logic for SolveVehicleRoutingProblem tool."""

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


class SolveVehicleRoutingProblem(nast.NASolverTool):
    """Provides execution logic for SolveVehicleRoutingProblem tool."""

    # Define instance attributes in slots primarily for faster attribute lookups
    __slots__ = ("orders", "depots", "routes", "breaks", "time_units", "distance_units", "default_date",
                 "time_window_factor", "spatially_cluster_routes", "route_zones", "route_renewals", "order_pairs",
                 "excess_transit_factor", "populate_route_lines", "return_directions", "directions_lang",
                 "directions_style", "time_zone_for_time_fields", "save_route_data", "return_stop_shapes",
                 "ignore_invalid_orders", "output_unassigned_stops", "output_stops", "output_routes",
                 "output_directions", "output_route_data_file")
    tool_name = "SolveVehicleRoutingProblem"

    def __init__(self, **kwargs):
        """Store names used in all methods."""
        super().__init__()
        # print parameter values when debugging
        if self.logger.level == logging.DEBUG:
            for param_name, param_value in kwargs.items():
                self.logger.debug("%s: %s, %s", param_name, type(param_value), param_value)

        # field name used to store remote service conn info
        if self.tool_name == "SolveVehicleRoutingProblem":
            self.extent_fields[-1] = "GPVehicleRoutingProblemService"
        else:
            self.extent_fields[-1] = "GPVehicleRoutingProblemSyncService"
        # Store tool parameter values as instance names.
        self.kwargs = kwargs
        self.orders = kwargs["orders"]
        self.depots = kwargs["depots"]
        self.routes = kwargs["routes"]
        self.breaks = kwargs["breaks"]
        self.time_units = kwargs["time_units"]
        self.distance_units = kwargs["distance_units"]
        self.network_datasets = self.strip_quotes(kwargs["Network_Datasets"]).split(";")
        self.nd_extents = kwargs["Network_Dataset_Extents"]
        self.analysis_region = kwargs["analysis_region"]
        try:
            self.select_network_dataset([self.orders, self.depots])
        except ValueError:
            self.logger.error("", extra={"message_ID": 30138})
            raise nat.ToolExit from None
        self.default_date = kwargs["default_date"]
        self.uturn_at_junctions = kwargs["uturn_policy"]
        self.time_window_factor = kwargs["time_window_factor"]
        self.spatially_cluster_routes = kwargs["spatially_cluster_routes"]
        self.route_zones = kwargs["route_zones"]
        self.route_renewals = kwargs["route_renewals"]
        self.order_pairs = kwargs["order_pairs"]
        self.excess_transit_factor = kwargs["excess_transit_factor"]
        self.point_barriers = kwargs["point_barriers"]
        self.line_barriers = kwargs["line_barriers"]
        self.polygon_barriers = kwargs["polygon_barriers"]
        self.use_hierarchy = kwargs["use_hierarchy_in_analysis"]
        self.restrictions = kwargs["restrictions"]
        self.attribute_parameter_values = kwargs["attribute_parameter_values"]
        self.populate_route_lines = kwargs["populate_route_lines"]
        simp_tol_value = kwargs["route_line_simplification_tolerance"]
        if not simp_tol_value:
            simp_tol_value = "0 Meters"
        self.simp_tol, self.simp_tol_unit = simp_tol_value.split(" ")
        self.simp_tol = locale.atof(self.simp_tol)
        self.return_directions = kwargs["populate_directions"]
        self.directions_lang = kwargs["directions_language"]
        self.directions_style = self.DIRECTIONS_STYLE[kwargs["directions_style_name"]]
        self.travel_mode = kwargs["travel_mode"]
        self.impedance = kwargs["impedance"]
        self.time_zone_for_time_fields = self.TIME_ZONE[kwargs["time_zone_usage_for_time_fields"]]
        self.save_layer_file = kwargs["save_output_network_analysis_layer"]
        self.overrides = self._solver_perf_overrides(kwargs["overrides"])
        self.save_route_data = kwargs["save_route_data"]
        self.time_impedance = kwargs["time_impedance"]
        self.distance_impedance = kwargs["distance_impedance"]
        self.return_stop_shapes = kwargs["populate_stop_shapes"]
        self.output_format = kwargs["output_format"]
        self.output_gdb = kwargs["output_geodatabase"]
        self.output_names = self.read_value_table(kwargs["output_names"])
        self.ignore_invalid_orders = kwargs["ignore_invalid_order_locations"]
        self.ignore_loc_fields = kwargs["ignore_network_location_fields"]
        self.limits = self._get_analysis_limits(kwargs["analysis_limits"])
        self.locate_settings = kwargs["locate_settings"]

        # Other instance attributes
        if not self.conn_file:  # Remote network datasets cannot be described
            self.nds_info = nast.NDSInfo(self.network_dataset)  # Proxy for network dataset describe

        # Outputs created by the tool
        self.output_routes = ""
        self.output_directions = ""
        self.output_unassigned_stops = ""
        self.output_stops = ""
        self.output_route_data_file = ""
        self.output_layer_file = ""
        self.output_result_file = ""
        self.solve_succeeded = False
        self.usage_cost = json.dumps({
            "numObjects": 0,
            "credits": 0
        })

    @time_exec
    def _solve_vrp(self):
        """Solve VRP using the VRP solver object."""
        if self.conn_file:
            self._solve_vrp_svc()
            return
        # Create vrp analysis object
        try:
            vrp = time_exec(nax.VehicleRoutingProblem)(self.network_dataset)
        except ValueError as ex:
            self.logger.error(ex)
            raise nat.ToolExit from None
        self.solver_object = vrp  # for cleanup at exit

        # Set analysis settings
        travel_mode = time_exec(self.get_travel_mode)()
        # Fail if travel mode is not time based
        if travel_mode.impedance != travel_mode.timeAttributeName:
            self.logger.error("", extra={"message_ID": 30159})
            raise nat.ToolExit from None
        try:
            vrp.travelMode = travel_mode
        except ValueError as err:
            self.logger.error("", extra={
                "message_ID": 30232,
                "add_argument1": str(travel_mode),
                })
            self.logger.error(err)
            raise nat.ToolExit from None
        vrp.timeUnits = nax.TimeUnits[self.time_units]
        vrp.distanceUnits = nax.DistanceUnits[self.distance_units]
        vrp.defaultDate = self.default_date
        vrp.timeZoneForTimeFields = self.time_zone_for_time_fields
        vrp.excessTransitFactor = nax.Importance[self.excess_transit_factor]
        vrp.timeWindowFactor = nax.Importance[self.time_window_factor]
        vrp.spatiallyClusterRoutes = self.spatially_cluster_routes
        vrp.returnStopShapes = self.return_stop_shapes
        vrp.routeShapeType = nax.RouteShapeType.TrueShape if self.populate_route_lines else nax.RouteShapeType.NoLine
        vrp.returnDirections = self.return_directions
        if self.return_directions:
            vrp.directionsDistanceUnits = vrp.distanceUnits
            vrp.directionsLanguage = self.directions_lang
            vrp.directionsStyle = self.directions_style
        # Add VrpDiagnosticLevel solver override for additional logging in server.
        overrides_dict = {}
        if self.overrides:
            overrides_dict = json.loads(self.overrides)
        vrp_diagnostic_level = str(overrides_dict.get("VrpDiagnosticLevel", ""))
        if vrp_diagnostic_level != "1":
            overrides_dict["VrpDiagnosticLevel"] = "1"
            self.system_solver_overrides_message_codes.append(30211)
        self.overrides = json.dumps(overrides_dict)
        vrp.overrides = self.overrides
        vrp.ignoreInvalidLocations = self.ignore_invalid_orders
        vrp.allowSaveRouteData = self.save_route_data
        vrp.allowSaveLayerFile = self.save_layer_file
        self._apply_locate_settings()
        self.logger.debug("Solver object properties")
        self.log_prop_values(vrp)

        # Load input data
        # Orders
        self.logger.debug("Loading orders")
        max_orders_limit = self.limits.get("maximumOrders", None)
        orders_fm = time_exec(vrp.fieldMappings)(nax.VehicleRoutingProblemInputDataType.Orders,
                                                 not self.ignore_loc_fields, arcpy.ListFields(self.orders))
        self.logger.debug("Orders field map: %s", "; ".join([str(orders_fm[fm]) for fm in orders_fm]))
        try:
            time_exec(vrp.load)(nax.VehicleRoutingProblemInputDataType.Orders, self.orders, orders_fm, True,
                                max_orders_limit)
        except nax.LimitError:
            self.logger.error("", extra={
                "message_ID": 30096,
                "add_argument1": "Orders",
                "add_argument2": max_orders_limit})
            raise nat.ToolExit from None
        except (nax.InputDataError, RuntimeError) as err:
            self.logger.error("", extra={
                "message_ID": 30251,
                "add_argument1": "Orders",
            })
            self.logger.error(err)
            raise nat.ToolExit from None

        # Routes
        self.logger.debug("Loading routes")
        max_routes_limit = self.limits.get("maximumRoutes", None)
        routes_fm = time_exec(vrp.fieldMappings)(nax.VehicleRoutingProblemInputDataType.Routes,
                                                 not self.ignore_loc_fields, arcpy.ListFields(self.routes))
        self.logger.debug("Routes field map: %s", "; ".join([str(routes_fm[fm]) for fm in routes_fm]))
        try:
            time_exec(vrp.load)(nax.VehicleRoutingProblemInputDataType.Routes, self.routes, routes_fm, True,
                                max_routes_limit)
        except nax.LimitError:
            self.logger.error("", extra={
                "message_ID": 30096,
                "add_argument1": "Routes",
                "add_argument2": max_routes_limit})
            raise nat.ToolExit from None
        except (nax.InputDataError, RuntimeError) as err:
            self.logger.error("", extra={
                "message_ID": 30251,
                "add_argument1": "Routes",
            })
            self.logger.error(err)
            raise nat.ToolExit from None

        # Depots
        self.logger.debug("Loading depots")
        depots_fm = time_exec(vrp.fieldMappings)(nax.VehicleRoutingProblemInputDataType.Depots,
                                                 not self.ignore_loc_fields, arcpy.ListFields(self.depots))
        self.logger.debug("Depots field map: %s", "; ".join([str(depots_fm[fm]) for fm in depots_fm]))
        try:
            time_exec(vrp.load)(nax.VehicleRoutingProblemInputDataType.Depots, self.depots, depots_fm, True, None)
        except (nax.InputDataError, RuntimeError) as err:
            self.logger.error("", extra={
                "message_ID": 30251,
                "add_argument1": "Depots",
            })
            self.logger.error(err)
            raise nat.ToolExit from None

        # Breaks
        if self._is_valid(self.breaks):
            self.logger.debug("Loading breaks")
            breaks_fm = time_exec(vrp.fieldMappings)(nax.VehicleRoutingProblemInputDataType.Breaks,
                                                     not self.ignore_loc_fields, arcpy.ListFields(self.breaks))
            self.logger.debug("Breaks field map: %s", "; ".join([str(breaks_fm[fm]) for fm in breaks_fm]))
            try:
                time_exec(vrp.load)(nax.VehicleRoutingProblemInputDataType.Breaks, self.breaks, breaks_fm, True, None)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Breaks",
                })
                self.logger.error(err)
                raise nat.ToolExit from None

        # Route Zones
        if self._is_valid(self.route_zones):
            self.logger.debug("Loading route zones")
            route_zones_fm = time_exec(vrp.fieldMappings)(nax.VehicleRoutingProblemInputDataType.RouteZones,
                                                          not self.ignore_loc_fields,
                                                          arcpy.ListFields(self.route_zones))
            self.logger.debug("Route zones field map: %s",
                              "; ".join([str(route_zones_fm[fm]) for fm in route_zones_fm]))
            try:
                time_exec(vrp.load)(nax.VehicleRoutingProblemInputDataType.RouteZones, self.route_zones, route_zones_fm,
                                    True, None)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Route Zones",
                })
                self.logger.error(err)
                raise nat.ToolExit from None
        # Route Renewals
        if self._is_valid(self.route_renewals):
            self.logger.debug("Loading route renewals")
            route_renewals_fm = time_exec(vrp.fieldMappings)(nax.VehicleRoutingProblemInputDataType.RouteRenewals,
                                                             not self.ignore_loc_fields,
                                                             arcpy.ListFields(self.route_renewals))
            self.logger.debug("Route renewals field map: %s",
                              "; ".join([str(route_renewals_fm[fm]) for fm in route_renewals_fm]))
            try:
                time_exec(vrp.load)(nax.VehicleRoutingProblemInputDataType.RouteRenewals, self.route_renewals,
                                    route_renewals_fm, True, None)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Route Renewals",
                })
                self.logger.error(err)
                raise nat.ToolExit from None
        # Order Pairs
        if self._is_valid(self.order_pairs):
            self.logger.debug("Loading order pairs")
            order_pairs_fm = time_exec(vrp.fieldMappings)(nax.VehicleRoutingProblemInputDataType.OrderPairs,
                                                          not self.ignore_loc_fields,
                                                          arcpy.ListFields(self.order_pairs))
            self.logger.debug("Order pairs field map: %s",
                              "; ".join([str(order_pairs_fm[fm]) for fm in order_pairs_fm]))
            try:
                time_exec(vrp.load)(nax.VehicleRoutingProblemInputDataType.OrderPairs, self.order_pairs, order_pairs_fm,
                                    True, None)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Order Pairs",
                })
                self.logger.error(err)
                raise nat.ToolExit from None
        # Point Barriers
        if self._is_valid(self.point_barriers):
            self.logger.debug("Loading point barriers")
            try:
                time_exec(vrp.load)(nax.VehicleRoutingProblemInputDataType.PointBarriers, self.point_barriers)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Point Barriers",
                })
                self.logger.error(err)
                raise nat.ToolExit from None
        # Line Barriers
        if self._is_valid(self.line_barriers):
            self.logger.debug("Loading line barriers")
            try:
                time_exec(vrp.load)(nax.VehicleRoutingProblemInputDataType.LineBarriers, self.line_barriers)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Line Barriers",
                })
                self.logger.error(err)
                raise nat.ToolExit from None
        # Polygon Barriers
        if self._is_valid(self.polygon_barriers):
            self.logger.debug("Loading polygon barriers")
            try:
                time_exec(vrp.load)(nax.VehicleRoutingProblemInputDataType.PolygonBarriers, self.polygon_barriers)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Polygon Barriers",
                })
                self.logger.error(err)
                raise nat.ToolExit from None

        input_counts = {}
        for input_type in nax.VehicleRoutingProblemInputDataType:
            input_counts[f"{input_type.name.replace('Point', '')}Count"] = vrp.count(input_type.value)
        nast.SERVER_PERF_METRICS["LoadLocations"] = input_counts

        # Perform checks that are dependent on straight line distance between inputs. The distance between the inputs
        # can be calculated only after loading all the inputs into solver objects.
        self.max_meters_amid_inputs = vrp._maxMetersBetweenInputs()  # As designed. pylint:disable=protected-access
        nast.SERVER_PERF_METRICS["GeodesicDistance"] = round(self.max_meters_amid_inputs, nast.PERF_METRICS_PRECISION)
        self._check_walking_limit()
        # Force hierarchy if required to
        if travel_mode.useHierarchy == "NO_HIERARCHY":
            if self._force_hierarchy():
                travel_mode_dict = json.loads(str(travel_mode))
                travel_mode_dict["useHierarchy"] = True
                travel_mode = self._travel_mode_from_json(json.dumps(travel_mode_dict))
                vrp.travelMode = travel_mode

        # Solve
        # constrain the search space for exact solves
        if travel_mode.useHierarchy == "NO_HIERARCHY":
            self._add_route_cutoff()
        with nast.PerfTimer("SolveTimeInSeconds"):
            result = time_exec(vrp.solve)()
        self.solver_result = result
        self.solve_succeeded = result.solveSucceeded
        self.log_solver_messages(result)

        # Extent is only available when solve succeeds.
        if self.solve_succeeded:
            routes_extent = result.extent(nax.VehicleRoutingProblemOutputDataType.Routes)
            nast.SERVER_PERF_METRICS["BoundingBox"] = [
                round(routes_extent.XMin, nast.PERF_METRICS_PRECISION),
                round(routes_extent.YMin, nast.PERF_METRICS_PRECISION),
                round(routes_extent.XMax, nast.PERF_METRICS_PRECISION),
                round(routes_extent.YMax, nast.PERF_METRICS_PRECISION),
            ]
            try:
                with result.searchCursor(nax.VehicleRoutingProblemOutputDataType.Routes, "TotalTravelTime") as cursor:
                    nast.SERVER_PERF_METRICS["Impedances"] = [round(max({row[0] for row in cursor}),
                                                                    nast.PERF_METRICS_PRECISION)]
            except Exception:  # Ok to skip in case we got incorrect Total_field. pylint:disable=broad-exception-caught
                self.logger.info("Error when reporting impedances", exc_info=True)

        # Do not fail execution on failed solve since we want to return outputs that contain useful information about
        # the failure in the ViolatedConstraints field.
        with nast.PerfTimer("OutputTimeInSeconds"):
            # Export outputs
            # Directions
            # if self.return_directions:
            self._check_max_output_features(nax.VehicleRoutingProblemOutputDataType.Directions, 30142)
            self.output_directions = os.path.join(self.output_gdb, self.output_names[1][1])
            self.logger.debug("Exporting directions to '%s'", self.output_directions)
            time_exec(result.export)(nax.VehicleRoutingProblemOutputDataType.Directions, self.output_directions)
            # Unassigned stops
            self.output_unassigned_stops = os.path.join(self.output_gdb, self.output_names[3][1])
            self.logger.debug("Exporting unassigned stops to '%s'", self.output_unassigned_stops)
            time_exec(result.export)(nax.VehicleRoutingProblemOutputDataType.UnassignedStops,
                                     self.output_unassigned_stops)
            # Stops
            self.output_stops = os.path.join(self.output_gdb, self.output_names[2][1])
            self.logger.debug("Exporting stops to '%s'", self.output_stops)
            time_exec(result.export)(nax.VehicleRoutingProblemOutputDataType.Stops, self.output_stops)
            # Routes
            self.output_routes = os.path.join(self.output_gdb, self.output_names[0][1])
            self.logger.debug("Exporting routes to '%s'", self.output_routes)
            time_exec(result.export)(nax.VehicleRoutingProblemOutputDataType.Routes, self.output_routes)
            # Route data
            if self.save_route_data and self.solve_succeeded:
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
                export_datasets = {
                    self.output_routes: "FEATURECLASS",
                    self.output_directions: "FEATURECLASS",
                    self.output_stops: "FEATURECLASS" if self.return_stop_shapes else "TABLE",
                    self.output_unassigned_stops: "FEATURECLASS" if self.return_stop_shapes else "TABLE",
                }
                self.output_result_file = self.create_result_file(export_datasets, self.output_format)

    @time_exec
    def _solve_vrp_svc(self):
        """Find routes using a geoprocessing service."""
        # Copy input feature sets as they can be referencing a URL which might not be accessible to the remote service
        # Not copying attribute parameter values as it is rare that someone will pass attribute parameter values from
        # a URL
        orders = self._copy_features(self.orders, check_validity=False)
        depots = self._copy_features(self.depots, check_validity=False)
        routes = self._copy_features(self.routes, check_validity=False)
        breaks = self._copy_features(self.breaks)
        route_zones = self._copy_features(self.route_zones)
        route_renewals = self._copy_features(self.route_renewals)
        order_pairs = self._copy_features(self.order_pairs)
        point_barriers = self._copy_features(self.point_barriers)
        line_barriers = self._copy_features(self.line_barriers)
        polygon_barriers = self._copy_features(self.polygon_barriers)
        task_params = [orders, depots, routes, breaks, self.time_units, self.distance_units, "#", self.default_date,
                       self.uturn_at_junctions, self.time_window_factor, self.spatially_cluster_routes, route_zones,
                       route_renewals, order_pairs, self.excess_transit_factor, point_barriers, line_barriers,
                       polygon_barriers, self.use_hierarchy, self.restrictions, self.attribute_parameter_values,
                       self.populate_route_lines, self.kwargs["route_line_simplification_tolerance"],
                       self.return_directions, self.directions_lang, self.kwargs["directions_style_name"],
                       self.kwargs["travel_mode"], self.impedance, self.kwargs["time_zone_usage_for_time_fields"],
                       self.save_layer_file, self.overrides, self.save_route_data, self.time_impedance,
                       self.distance_impedance, self.return_stop_shapes, self.output_format, self.ignore_invalid_orders,
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
            # not raising nat.ToolExit since VRP solver can return outputs with violated constraints for solve failures

        # Save the results
        solve_status = result.getOutput(4)
        if solve_status.lower() == 'true':
            self.solve_succeeded = True
        # Routes
        self.output_routes = os.path.join(self.output_gdb, self.output_names[0][1])
        arcpy.management.CopyFeatures(result.getOutput(2), self.output_routes)
        # Directions
        try:
            self.output_directions = os.path.join(self.output_gdb, self.output_names[1][1])
            arcpy.management.CopyFeatures(result.getOutput(3), self.output_directions)
        except arcpy.ExecuteError:
            self.logger.info("Returning empty feature set for directions.")
            self.logger.debug("Error while saving directions: ", exc_info=True)
            self.output_directions = ""
        # Stops and Unassigned Stops can be a feature class or a table.
        self.output_stops = os.path.join(self.output_gdb, self.output_names[2][1])
        self.output_unassigned_stops = os.path.join(self.output_gdb, self.output_names[3][1])
        if self.return_stop_shapes:
            arcpy.management.CopyFeatures(result.getOutput(0), self.output_unassigned_stops)
            arcpy.management.CopyFeatures(result.getOutput(1), self.output_stops)
        else:
            arcpy.management.CopyRows(result.getOutput(0), self.output_unassigned_stops)
            arcpy.management.CopyRows(result.getOutput(1), self.output_stops)
        # Network analysis layer file
        self.output_layer_file = result.getOutput(5)
        # Route data
        self.output_route_data_file = result.getOutput(6)
        # File based result
        self.output_result_file = result.getOutput(7)
        if result.outputCount >= 9:
            self.output_layer_package = result.getOutput(8)

    @time_exec
    def _validate(self):
        """Raise a termination exception if a validation check fails.

        Raises:
            ToolExit for a failed validation check.

        """
        super()._validate()

        if self.simp_tol < 0:
            self.logger.error("", extra={"message_ID": 30111, "add_argument1": "Route_Line_Simplification_Tolerance"})
            raise nat.ToolExit from None
        # For ArcGIS Online, check for the VRP privilege since VRP and LMD tools are part of the same service.
        try:
            service_props = json.loads(arcpy.gp.serviceProperties())
            task_settings = json.loads(service_props.get("taskAdminSettings", "{}"))
            check_privilege = task_settings.get("checkPrivilege", "false") == "true"
        except Exception:  # Need to skip this check in case on any errors. pylint:disable=broad-except
            check_privilege = False
        if check_privilege:
            if not arcpy.gp.checkPrivilege("premium:user:networkanalysis:vehiclerouting"):
                self.logger.error("", extra={"message_ID": 30369})
                raise nat.ToolExit from None

    @time_exec
    def _check_max_orders_per_route(self):
        """Enforce max orders per route limit and return a termination error if violated."""
        limit_value = self.limits.get("maximumOrdersPerRoute", None)
        if not limit_value:
            return
        orders_per_route = {}
        try:
            # Name field is always present on Routes since VRP solver needs a unique name for each route.
            with arcpy.da.SearchCursor(self.routes,  # False positive. pylint:disable=no-member
                                       ("MaxOrderCount", "Name")) as cursor:
                orders_per_route = {row[1]: row[0] for row in cursor if row[0]}
        except RuntimeError:
            # MaxOrderCount field is not specified. So maximumOrdersPerRoute should be same as maximumOrders
            self.limits["maximumOrders"] = limit_value
            return

        if not orders_per_route:
            # All MaxOrderCount values are Null. So maximumOrdersPerRoute should be same as maximumOrders.
            self.limits["maximumOrders"] = limit_value
            return

        max_orders = max(orders_per_route.values())
        if max_orders > limit_value:
            for key, value in orders_per_route.items():
                if value == max_orders:
                    route_name = key
                    break
            else:
                route_name = "None"
            self.logger.error("", extra={
                "message_ID": 30131,
                "add_argument1": f"'{route_name}', {max_orders},",
                "add_argument2": limit_value
            })
            raise nat.ToolExit from None

    def _check_limits(self):
        """Check if any of the limits are exceeded."""
        self._check_max_orders_per_route()
        self._check_barrier_limits()

    @time_exec
    def _report_usage(self):
        """Add usage metering and royalty messages used to deduct credits in AGOL."""
        # No usage in case we did not create any routes such as when all orders are unassigned.
        if not self.output_routes:
            return
        num_objects = self.get_count(self.output_routes, "OrderCount IS NOT NULL")
        # metering_task_name = "SolveVehicleRoutingProblem"
        self.logger.debug("Usage report")
        self.logger.debug("Num Objects: %s", num_objects)
        nast.SERVER_PERF_METRICS["NumObjects"] = num_objects
        if num_objects:
            # As designed. pylint:disable=protected-access
            arcpy.gp._arc_object.LogUsageMetering(5555, self.tool_name, num_objects)
            arcpy.gp._arc_object.LogUsageMetering(9999,
                                                  (f"{os.path.basename(self.network_dataset)}::{self.provider}::"
                                                   f"{self.tool_name}"),
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
        self._solve_vrp()
        self._report_usage()
        # When returning a results file, set all other feature outputs to empty so that GPServer will not serailize
        # them to .dat files.
        if self.output_format != "Feature Set":
            self.output_routes = ""
            self.output_directions = ""
            self.output_stops = ""
            self.output_unassigned_stops = ""


class ToolValidator(nast.ToolValidator):
    """Class for validating parameter values and controlling the behavior of the tool's dialog."""

    def __init__(self):
        """Initialize required things."""
        # Determine if running in a server context so that we can skip certain methods
        super().__init__()
        self.tool_name = "SolveVehicleRoutingProblem"
        self.nds_param = self.params[6]
        self.nds_extents_param = self.params[7]
        self.analysis_region_param = self.params[8]
        self.uturn_param = self.params[10]
        self.hiearchy_param = self.params[20]
        self.restrictions_param = self.params[21]
        self.attr_params_param = self.params[22]
        self.simp_tol_param = self.params[24]
        self.directions_lang_param = self.params[26]
        self.impedance_param = self.params[29]
        self.overrides_param = self.params[32]
        self.time_impedance_param = self.params[34]
        self.distance_impedance_param = self.params[35]
        self.locate_settings_param = self.params[43]
