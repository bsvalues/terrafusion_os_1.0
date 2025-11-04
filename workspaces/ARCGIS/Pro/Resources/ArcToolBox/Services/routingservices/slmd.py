"""Provides validation and execution logic for SolveLastMileDelivery tool."""

import datetime
import logging
import os
import json
import uuid

import arcpy
from arcpy.na import _na as nax
import nat
import nast
from nast import time_exec


class SolveLastMileDelivery(nast.NASolverTool):
    """Provides execution logic for SolveLastMileDelivery tool."""

    # Define instance attributes in slots primarily for faster attribute lookups
    __slots__ = ("orders", "depots", "routes", "earliest_route_start_date", "earliest_route_start_time",
                 "max_route_total_time", "sequence_gap", "time_units", "distance_units", "time_zone_for_time_fields",
                 "order_specialties", "route_specialties", "zones", "ignore_invalid_orders", "route_shape_type",
                 "return_directions", "directions_lang", "save_route_data",  "output_orders", "output_routes",
                 "output_depots", "output_depot_visits", "output_direction_points", "output_direction_lines",
                 "output_route_data_file")
    tool_name = "SolveLastMileDelivery"

    def __init__(self, **kwargs):
        """Store names used in all methods."""
        super().__init__()
        # print parameter values when debugging
        if self.logger.level == logging.DEBUG:
            for param_name, param_value in kwargs.items():
                self.logger.debug("%s: %s, %s", param_name, type(param_value), param_value)

        # field name used to store remote service conn info
        self.extent_fields[-1] = "GPLastMileDeliveryService"

        # Store tool parameter values as instance names.
        self.kwargs = kwargs
        self.orders = kwargs["orders"]
        self.depots = kwargs["depots"]
        self.routes = kwargs["routes"]
        self.network_datasets = self.strip_quotes(kwargs["network_datasets"]).split(";")
        self.nd_extents = kwargs["network_dataset_extents"]
        self.travel_mode = kwargs["travel_mode"]
        self.earliest_route_start_date = kwargs["earliest_route_start_date"]
        self.earliest_route_start_time = kwargs["earliest_route_start_time"]
        self.max_route_total_time = kwargs["max_route_total_time"]
        self.sequence_gap = kwargs["sequence_gap"]
        self.time_units = kwargs["time_units"]
        self.distance_units = kwargs["distance_units"]
        self.time_zone_for_time_fields = self.TIME_ZONE[kwargs["time_zone_usage_for_time_fields"]]
        self.order_specialties = kwargs["order_specialties"]
        self.route_specialties = kwargs["route_specialties"]
        self.zones = kwargs["zones"]
        self.point_barriers = kwargs["point_barriers"]
        self.line_barriers = kwargs["line_barriers"]
        self.polygon_barriers = kwargs["polygon_barriers"]
        self.locate_settings = kwargs["locate_settings"]
        self.ignore_invalid_orders = kwargs["ignore_invalid_order_locations"]
        self.ignore_loc_fields = kwargs["ignore_network_location_fields"]
        self.route_shape_type = self.ROUTE_SHAPE_TYPE[kwargs["route_shape"]]
        self.return_directions = kwargs["populate_directions"]
        self.directions_lang = kwargs["directions_language"]
        self.save_route_data = kwargs["save_route_data"]
        self.save_layer_file = kwargs["save_output_network_analysis_layer"]
        self.output_format = kwargs["output_format"]
        self.overrides = self._solver_perf_overrides(kwargs["overrides"])
        self.limits = self._get_analysis_limits(kwargs["analysis_limits"])
        self.analysis_region = kwargs["analysis_region"]
        self.output_gdb = kwargs["output_geodatabase"]
        self.output_names = self.read_value_table(kwargs["output_names"])

        # Broker to a single network dataset in case we have more than one.
        try:
            self.select_network_dataset([self.orders, self.depots])
        except ValueError:
            self.logger.error("", extra={"message_ID": 30138})
            raise nat.ToolExit from None

        # Other instance attributes
        if not self.conn_file:  # Remote network datasets cannot be described
            self.nds_info = nast.NDSInfo(self.network_dataset)  # Proxy for network dataset describe

        # Outputs created by the tool
        self.output_orders = ""
        self.output_routes = ""
        self.output_depots = ""
        self.output_depot_visits = ""
        self.output_direction_points = ""
        self.output_direction_lines = ""
        self.output_route_data_file = ""
        self.output_layer_file = ""
        self.output_result_file = ""
        self.solve_succeeded = False
        self.usage_cost = json.dumps({
            "numObjects": 0,
            "credits": 0
        })

    @time_exec
    def _solve_lmd(self):
        """Solve last mile delivery using the LMD solver object."""
        if self.conn_file:
            self._solve_lmd_svc()
            return
        # Create lmd analysis object
        try:
            lmd = time_exec(nax.LastMileDelivery)(self.network_dataset)
        except ValueError as ex:
            self.logger.error(ex)
            raise nat.ToolExit from None
        self.solver_object = lmd  # for cleanup at exit

        # Set analysis settings
        travel_mode = time_exec(self.get_travel_mode)(support_travel_mode_name=False)
        # Fail if travel mode is not time based
        if travel_mode.impedance != travel_mode.timeAttributeName:
            self.logger.error("", extra={"message_ID": 30159})
            raise nat.ToolExit from None
        try:
            lmd.travelMode = travel_mode
        except ValueError as err:
            self.logger.error("", extra={
                "message_ID": 30232,
                "add_argument1": str(travel_mode),
                })
            self.logger.error(err)
            raise nat.ToolExit from None

        if self.earliest_route_start_date:
            lmd.earliestRouteStartDate = self.earliest_route_start_date
        if self.earliest_route_start_time:
            lmd.earliestRouteStartTime = self.earliest_route_start_time
        if self.max_route_total_time:
            try:
                lmd.maxRouteTotalTime = self.max_route_total_time
            except ValueError as err:
                self.logger.error(err)
                raise nat.ToolExit from None
        try:
            lmd.sequenceGap = self.sequence_gap
        except ValueError as err:
            self.logger.error(err)
            raise nat.ToolExit from None
        lmd.timeUnits = nax.TimeUnits[self.time_units]
        lmd.distanceUnits = nax.DistanceUnits[self.distance_units]
        lmd.timeZoneForTimeFields = self.time_zone_for_time_fields
        lmd.routeShapeType = self.route_shape_type
        lmd.returnDirections = self.return_directions
        if self.return_directions:
            lmd.directionsLanguage = self.directions_lang
        # Add VrpDiagnosticLevel solver override to determine service credits.
        overrides_dict = {}
        if self.overrides:
            overrides_dict = json.loads(self.overrides)
        vrp_diagnostic_level = str(overrides_dict.get("VrpDiagnosticLevel", ""))
        if vrp_diagnostic_level != "1":
            overrides_dict["VrpDiagnosticLevel"] = "1"
            self.system_solver_overrides_message_codes.append(30211)
        self.overrides = json.dumps(overrides_dict)
        lmd.overrides = self.overrides
        lmd.ignoreInvalidLocations = self.ignore_invalid_orders
        lmd.allowSaveRouteData = self.save_route_data
        lmd.allowSaveLayerFile = self.save_layer_file
        self._apply_locate_settings()
        self.logger.debug("Solver object properties")
        self.log_prop_values(lmd)

        # Load input data
        # Orders
        self.logger.debug("Loading orders")
        max_orders_limit = self.limits.get("maximumOrders", None)
        orders_fm = time_exec(lmd.fieldMappings)(nax.LastMileDeliveryInputDataType.Orders,
                                                 not self.ignore_loc_fields, arcpy.ListFields(self.orders))
        self.logger.debug("Orders field map: %s", "; ".join([str(orders_fm[fm]) for fm in orders_fm]))
        try:
            time_exec(lmd.load)(nax.LastMileDeliveryInputDataType.Orders, self.orders, orders_fm, True,
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
        routes_fm = time_exec(lmd.fieldMappings)(nax.LastMileDeliveryInputDataType.Routes,
                                                 not self.ignore_loc_fields, arcpy.ListFields(self.routes))
        self.logger.debug("Routes field map: %s", "; ".join([str(routes_fm[fm]) for fm in routes_fm]))
        try:
            time_exec(lmd.load)(nax.LastMileDeliveryInputDataType.Routes, self.routes, routes_fm, True,
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
        depots_fm = time_exec(lmd.fieldMappings)(nax.LastMileDeliveryInputDataType.Depots,
                                                 not self.ignore_loc_fields, arcpy.ListFields(self.depots))
        self.logger.debug("Depots field map: %s", "; ".join([str(depots_fm[fm]) for fm in depots_fm]))
        try:
            time_exec(lmd.load)(nax.LastMileDeliveryInputDataType.Depots, self.depots, depots_fm, True, None)
        except (nax.InputDataError, RuntimeError) as err:
            self.logger.error("", extra={
                "message_ID": 30251,
                "add_argument1": "Depots",
            })
            self.logger.error(err)
            raise nat.ToolExit from None

        # Order Specialties
        if self._is_valid(self.order_specialties):
            self.logger.debug("Loading order specialties")
            order_specialties_fm = time_exec(lmd.fieldMappings)(nax.LastMileDeliveryInputDataType.OrderSpecialties,
                                                                not self.ignore_loc_fields,
                                                                arcpy.ListFields(self.order_specialties))
            self.logger.debug("Order Specialties field map: %s",
                              "; ".join([str(order_specialties_fm[fm]) for fm in order_specialties_fm]))
            try:
                time_exec(lmd.load)(nax.LastMileDeliveryInputDataType.OrderSpecialties,
                                    self.order_specialties, order_specialties_fm, True, None)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Order Specialties",
                })
                self.logger.error(err)
                raise nat.ToolExit from None

        # Route Specialties
        if self._is_valid(self.route_specialties):
            self.logger.debug("Loading route specialties")
            route_specialties_fm = time_exec(lmd.fieldMappings)(nax.LastMileDeliveryInputDataType.RouteSpecialties,
                                                                not self.ignore_loc_fields,
                                                                arcpy.ListFields(self.route_specialties))
            self.logger.debug("Route Specialties field map: %s",
                              "; ".join([str(route_specialties_fm[fm]) for fm in route_specialties_fm]))
            try:
                time_exec(lmd.load)(nax.LastMileDeliveryInputDataType.RouteSpecialties,
                                    self.route_specialties, route_specialties_fm, True, None)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Route Specialties",
                })
                self.logger.error(err)
                raise nat.ToolExit from None

        # Zones
        if self._is_valid(self.zones):
            self.logger.debug("Loading zones")
            zones_fm = time_exec(lmd.fieldMappings)(nax.LastMileDeliveryInputDataType.Zones, not self.ignore_loc_fields,
                                                    arcpy.ListFields(self.zones))
            self.logger.debug("Zones field map: %s", "; ".join([str(zones_fm[fm]) for fm in zones_fm]))
            try:
                time_exec(lmd.load)(nax.LastMileDeliveryInputDataType.Zones, self.zones, zones_fm, True, None)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Zones",
                })
                self.logger.error(err)
                raise nat.ToolExit from None

        # Point Barriers
        if self._is_valid(self.point_barriers):
            self.logger.debug("Loading point barriers")
            try:
                time_exec(lmd.load)(nax.LastMileDeliveryInputDataType.PointBarriers, self.point_barriers)
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
                time_exec(lmd.load)(nax.LastMileDeliveryInputDataType.LineBarriers, self.line_barriers)
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
                time_exec(lmd.load)(nax.LastMileDeliveryInputDataType.PolygonBarriers, self.polygon_barriers)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Polygon Barriers",
                })
                self.logger.error(err)
                raise nat.ToolExit from None

        input_counts = {}
        for input_type in nax.LastMileDeliveryInputDataType:
            input_counts[f"{input_type.name.replace('Point', '')}Count"] = lmd.count(input_type.value)
        nast.SERVER_PERF_METRICS["LoadLocations"] = input_counts

        # Perform checks that are dependent on straight line distance between inputs. The distance between the inputs
        # can be calculated only after loading all the inputs into solver objects.
        self.max_meters_amid_inputs = lmd._maxMetersBetweenInputs()  # As designed. pylint:disable=protected-access
        nast.SERVER_PERF_METRICS["GeodesicDistance"] = round(self.max_meters_amid_inputs, nast.PERF_METRICS_PRECISION)
        self._check_walking_limit()
        self._check_problem_extent_limit()
        # Force hierarchy if required to
        if travel_mode.useHierarchy == "NO_HIERARCHY":
            if self._force_hierarchy():
                travel_mode = lmd.travelMode
                travel_mode.useHierarchy = "USE_HIERARCHY"
                lmd.travelMode = travel_mode

        # Solve
        # constrain the search space for exact solves
        if travel_mode.useHierarchy == "NO_HIERARCHY":
            self._add_route_cutoff()
        with nast.PerfTimer("SolveTimeInSeconds"):
            result = time_exec(lmd.solve)()
        self.solver_result = result
        self.solve_succeeded = result.solveSucceeded
        self.log_solver_messages(result)

        # Quit if solve failed
        if not self.solve_succeeded:
            raise nat.ToolExit

        routes_extent = result.extent(nax.LastMileDeliveryOutputDataType.Routes)
        nast.SERVER_PERF_METRICS["BoundingBox"] = [
            round(routes_extent.XMin, nast.PERF_METRICS_PRECISION),
            round(routes_extent.YMin, nast.PERF_METRICS_PRECISION),
            round(routes_extent.XMax, nast.PERF_METRICS_PRECISION),
            round(routes_extent.YMax, nast.PERF_METRICS_PRECISION),
        ]
        try:
            with result.searchCursor(nax.LastMileDeliveryOutputDataType.Routes, "TotalTravelTime") as cursor:
                nast.SERVER_PERF_METRICS["Impedances"] = [round(max({row[0] for row in cursor}),
                                                               nast.PERF_METRICS_PRECISION)]
        except Exception:  # Ok to skip in case we got incorrect Total_field. pylint:disable=broad-exception-caught
            self.logger.info("Error when reporting impedances", exc_info=True)

        with nast.PerfTimer("OutputTimeInSeconds"):
            # Export outputs
            # Orders
            self.output_orders = os.path.join(self.output_gdb, self.output_names[0][1])
            self.logger.debug("Exporting orders to '%s'", self.output_orders)
            time_exec(result.export)(nax.LastMileDeliveryOutputDataType.Orders, self.output_orders)
            # Routes
            self.output_routes = os.path.join(self.output_gdb, self.output_names[1][1])
            self.logger.debug("Exporting routes to '%s'", self.output_routes)
            time_exec(result.export)(nax.LastMileDeliveryOutputDataType.Routes, self.output_routes)
            # Depots
            self.output_depots = os.path.join(self.output_gdb, self.output_names[2][1])
            self.logger.debug("Exporting depots to '%s'", self.output_depots)
            time_exec(result.export)(nax.LastMileDeliveryOutputDataType.Depots, self.output_depots)
            # Depot Visits
            self.output_depot_visits = os.path.join(self.output_gdb, self.output_names[3][1])
            self.logger.debug("Exporting depot visits to '%s'", self.output_depots)
            time_exec(result.export)(nax.LastMileDeliveryOutputDataType.DepotVisits, self.output_depot_visits)
            # Direction Points and Direction Lines
            if self.return_directions:
                self._check_max_output_features(nax.LastMileDeliveryOutputDataType.DirectionPoints, 30293)
                self._check_max_output_features(nax.LastMileDeliveryOutputDataType.DirectionLines, 30294)
                self.output_direction_points = os.path.join(self.output_gdb, self.output_names[4][1])
                self.output_direction_lines = os.path.join(self.output_gdb, self.output_names[5][1])
                self.logger.debug("Exporting direction points to '%s'", self.output_direction_points)
                time_exec(result.export)(nax.LastMileDeliveryOutputDataType.DirectionPoints,
                                         self.output_direction_points)
                self.logger.debug("Exporting direction lines to '%s'", self.output_direction_lines)
                time_exec(result.export)(nax.LastMileDeliveryOutputDataType.DirectionLines, self.output_direction_lines)
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
                export_datasets = dict.fromkeys((self.output_orders, self.output_routes, self.output_depots,
                                                self.output_depot_visits, self.output_direction_points,
                                                self.output_direction_lines),
                                                "FEATURECLASS")
                self.output_result_file = self.create_result_file(export_datasets, self.output_format)

    @time_exec
    def _solve_lmd_svc(self):
        """Find routes using a geoprocessing service."""
        # Copy input feature sets as they can be referencing a URL which might not be accessible to the remote service
        # Not copying attribute parameter values as it is rare that someone will pass attribute parameter values from
        # a URL
        orders = self._copy_features(self.orders, check_validity=False)
        depots = self._copy_features(self.depots, check_validity=False)
        routes = self._copy_features(self.routes, check_validity=False)
        order_specialties = self._copy_features(self.order_specialties)
        route_specialties = self._copy_features(self.route_specialties)
        zones = self._copy_features(self.zones)
        point_barriers = self._copy_features(self.point_barriers)
        line_barriers = self._copy_features(self.line_barriers)
        polygon_barriers = self._copy_features(self.polygon_barriers)

        task_params = [orders, depots, routes, self.kwargs["travel_mode"], self.kwargs["earliest_route_start_date"],
                       self.kwargs["earliest_route_start_time"], self.max_route_total_time, self.sequence_gap,
                       self.time_units, self.distance_units, self.kwargs["time_zone_usage_for_time_fields"],
                       order_specialties, route_specialties, zones, point_barriers, line_barriers, polygon_barriers,
                       self.locate_settings, self.ignore_invalid_orders, self.kwargs["route_shape"],
                       self.return_directions, self.directions_lang, self.save_route_data, self.save_layer_file,
                       self.output_format, self.overrides,
                       ]
        try:
            result = self._call_remote_tool(task_params)
        except Exception:  # Raise known error for unexpected remote tool failure. pylint:disable=broad-except
            self.logger.info("Failed to execute remote tool '%s'", self.remote_svc_name)
            self.logger.info("Exception details:", exc_info=True)
            self.logger.error("", extra={"message_ID": 30295})
            raise nat.ToolExit from None
        if result.maxSeverity == 2:
            self.solve_succeeded = False
            raise nat.ToolExit

        # Save the results
        self.solve_succeeded = True
        # Orders
        self.output_orders = os.path.join(self.output_gdb, self.output_names[0][1])
        arcpy.management.CopyFeatures(result.getOutput(0), self.output_orders)
        # Routes
        self.output_routes = os.path.join(self.output_gdb, self.output_names[1][1])
        arcpy.management.CopyFeatures(result.getOutput(1), self.output_routes)
        # Depots
        self.output_depots = os.path.join(self.output_gdb, self.output_names[2][1])
        arcpy.management.CopyFeatures(result.getOutput(2), self.output_depots)
        # Depot Visits
        self.output_depot_visits = os.path.join(self.output_gdb, self.output_names[3][1])
        arcpy.management.CopyFeatures(result.getOutput(3), self.output_depot_visits)
        # Directions
        if self.return_directions:
            self.output_direction_points = os.path.join(self.output_gdb, self.output_names[4][1])
            self.output_direction_lines = os.path.join(self.output_gdb, self.output_names[5][1])
            arcpy.management.CopyFeatures(result.getOutput(4), self.output_direction_points)
            arcpy.management.CopyFeatures(result.getOutput(5), self.output_direction_lines)
        # Route data
        self.output_route_data_file = result.getOutput(6)
        # File based result
        self.output_result_file = result.getOutput(7)
        # Network analysis layer package
        self.output_layer_package = result.getOutput(8)
        # Usage cost
        self.usage_cost = result.getOutput(9)

    @time_exec
    def _validate(self):
        """Raise a termination exception if a validation check fails.

        Raises:
            ToolExit for a failed validation check.

        """
        super()._validate()

        if self.earliest_route_start_date:
            try:
                self.earliest_route_start_date = datetime.date.fromisoformat(self.earliest_route_start_date)
            except ValueError:
                self.logger.error("", extra={"message_ID": 30361})
                raise nat.ToolExit from None
        if self.earliest_route_start_time:
            try:
                erst = datetime.time.fromisoformat(self.earliest_route_start_time)
                # isoformat time string can include time zone which we do not want
                # https://docs.python.org/3.9/library/datetime.html#datetime.time.fromisoformat
                # https://docs.python.org/3.9/library/datetime.html#datetime.time.replace
                self.earliest_route_start_time = erst.replace(hour=erst.hour, minute=erst.minute, second=erst.second,
                                                              microsecond=0, tzinfo=None)
            except ValueError:
                self.logger.error("", extra={"message_ID": 30362})
                raise nat.ToolExit from None
        # For ArcGIS Online, check for the LMD privilege since VRP and LMD tools are part of the same service.
        try:
            service_props = json.loads(arcpy.gp.serviceProperties())
            task_settings = json.loads(service_props.get("taskAdminSettings", "{}"))
            check_privilege = task_settings.get("checkPrivilege", "false") == "true"
        except Exception:  # Need to skip this check in case on any errors. pylint:disable=broad-except
            check_privilege = False
        if check_privilege:
            if not arcpy.gp.checkPrivilege("premium:user:networkanalysis:lastmiledelivery"):
                self.logger.error("", extra={"message_ID": 30370})
                raise nat.ToolExit from None

    @time_exec
    def _check_max_orders_per_route(self):
        """Enforce max orders per route limit and return a termination error if violated."""
        limit_value = self.limits.get("maximumOrdersPerRoute", None)
        if not limit_value:
            return
        orders_per_route = {}
        try:
            # Name field is always present on Routes since LMD solver needs a unique name for each route.
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

    @time_exec
    def _check_max_total_time_per_route(self):
        """Enforce max total time limit and return a terminating error if violated."""
        limit_value = self.limits.get("maximumRouteDurationHours", None)
        if not limit_value:
            return
        limit_value = self.convert_value(limit_value, "Hours", self.time_units)
        max_total_time_per_route = {}
        max_total_time = 0
        try:
            # Name field is always present on Routes since LMD solver needs a unique name for each route.
            with arcpy.da.SearchCursor(self.routes,  # False positive. pylint:disable=no-member
                                       ("MaxTotalTime", "Name")) as cursor:
                max_total_time_per_route = {row[1]: row[0] for row in cursor if row[0]}
        except RuntimeError:
            # MaxTotalTime field is not specified.
            max_total_time = self.max_route_total_time

        if max_total_time_per_route:
            max_total_time = max(max_total_time_per_route.values())
        else:
            # All MaxTotalTime field values are Null. So check Max Route Total Time parameter.
            max_total_time = self.max_route_total_time

        if max_total_time > limit_value:
            for key, value in max_total_time_per_route.items():
                if value == max_total_time:
                    route_name = key
                    break
            else:
                route_name = "None"
            if max_total_time_per_route:
                self.logger.error("", extra={
                    "message_ID": 30363,
                    "add_argument1": f"'{route_name}', {max_total_time},",
                    "add_argument2": limit_value
                })
            else:
                self.logger.error("", extra={
                    "message_ID": 30364,
                    "add_argument1": max_total_time,
                    "add_argument2": limit_value
                })

            raise nat.ToolExit from None

    def _check_limits(self):
        """Check if any of the limits are exceeded."""
        self._check_max_orders_per_route()
        self._check_max_total_time_per_route()
        self._check_barrier_limits()

    @time_exec
    def _report_usage(self):
        """Add usage metering and royalty messages used to deduct credits in AGOL."""
        num_objects = 0
        if self.conn_file:
            # When brokering to a service, get numObjects from the usage_cost output parameter
            self.logger.debug("Usage cost from remote service: %s", self.usage_cost)
            num_objects = json.loads(self.usage_cost).get("numObjects", 0)
        else:
            solver_diagnostics = {}
            for msg in self.solver_result.solverMessages(nax.MessageSeverity.Info):
                if msg[0] == 30211:
                    solver_diagnostics = json.loads(msg[1])
                    break
            self.logger.debug("Solver diagnostics to determine service usage: %s", solver_diagnostics)
            # No usage when all orders are unassigned.
            assigned_order_count = solver_diagnostics.get("AssignedOrderCount", 0)
            if assigned_order_count:
                num_objects = solver_diagnostics.get("InputOrderCount", 0)
            else:
                num_objects = 0
        self.logger.debug("Usage report")
        self.logger.debug("Num Objects: %s", num_objects)
        nast.SERVER_PERF_METRICS["NumObjects"] = num_objects
        metering_task_name = self.__class__.__name__
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
                "credits": self._usage_credits(num_objects) if num_objects else 0
            }
            self.usage_cost = json.dumps(usage_cost)

    def execute(self):
        """Tool execution logic."""
        self._validate()
        self._check_limits()
        self._solve_lmd()
        self._report_usage()
        # When returning a results file, set all other feature outputs to empty so that GPServer will not serailize
        # them to .dat files.
        if self.output_format != "Feature Set":
            self.output_orders = ""
            self.output_routes = ""
            self.output_depots = ""
            self.output_depot_visits = ""
            self.output_direction_points = ""
            self.output_direction_lines = ""


class ToolValidator(nast.ToolValidator):
    """Class for validating parameter values and controlling the behavior of the tool's dialog."""

    def __init__(self):
        """Initialize required things."""
        super().__init__()
        self.tool_name = "SolveLastMileDelivery"
        self.nds_param = self.params[3]
        self.nds_extents_param = self.params[4]
        self.travel_mode_param = self.params[5]
        self.locate_settings_param = self.params[19]
        self.overrides_param = self.params[28]
        self.analysis_region_param = self.params[29]
