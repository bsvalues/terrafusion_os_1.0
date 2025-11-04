"""PlanRoutes core logic executor."""
# pylint: disable=import-error,no-name-in-module
import os
from typing import Any, Optional

import arcpy
import arcpy.management
import arcpy.conversion
from arcpy.da import InsertCursor, SearchCursor, UpdateCursor  # type: ignore

from common import (PAExecutor, PAFeatureLayer,
                    LogExecutionTime, LogUtils, RemoteToolboxUtils,
                    FieldUtils, ImmutableDict, ToolExit,
                    AnalysisUtils, CALFIELD_PY_METHOD,
                    AOLUtils, PortalUtils)
from .nautils import NAUtils


LOGGER = LogUtils.setup_logger(__name__)


class PRExecutor(PAExecutor):
    """Core logic of PlanRoutes tool."""

    def __init__(
        self,
        stops_layer: PAFeatureLayer,
        route_count: int,
        max_stops_per_route: int,
        start_layer: PAFeatureLayer,
        start_layer_route_id: Optional[str] = None,
        route_start_time: Any = None,
        return_to_start: bool = True,
        end_layer: Optional[PAFeatureLayer] = None,
        end_layer_route_id: Optional[str] = None,
        stop_service_time: float = 0,
        max_route_time: float = 480,
        output_workspace: Any = "in_memory",
        output_routes_name: str = "Routes",
        output_assigned_stops_name: str = "AssignedStops",
        output_unassigned_stops_name: str = "UnassignedStops",
        travel_mode: str = "Driving",
        include_route_layers: bool = False,
        point_barrier_layer: Optional[PAFeatureLayer] = None,
        line_barrier_layer: Optional[PAFeatureLayer] = None,
        polygon_barrier_layer: Optional[PAFeatureLayer] = None,
        portal_description: Optional[ImmutableDict] = None
    ):
        """Initialize the attributes.

        Args:
            stops_layer: Stops to visit in the VRP analysis
            route_count: Number of routes (drivers/vehicles) to use in the analysis
            max_stops_per_route: Maximum number of stops that can be assigned to any route
            start_layer: Starting depot location for routes
            route_start_time: Time of day to start each route
            start_layer_route_id: Field in the start layer indicating which route each starting location is associated
                with
            return_to_start: Whether routes should return to the starting location at the end of the day
            end_layer: Ending depot location for routes, if different from the starting location
            end_layer_route_id: Field in the end layer indicating which route each ending location is associated with
            stop_service_time: The time each stop takes once the vehicle has arrived
            max_route_time: The maximum time each route can take (the length of a workday) in minutes
            output_workspace: Location to save the output feature classes.
            output_routes_name: Name for the output routes layer
            output_assigned_stops_name: Name for the output assigned stops layer
            output_unassigned_stops_name: Name for the output unassigned stops layer
            travel_mode: Travel mode to use for the analysis designated as a stringified json or special keyword
            include_route_layers: Whether to include route data (for use in Navigator, etc.) in the output
            point_barrier_layer: Point barriers to use in the analysis.
            line_barrier_layer: Line barriers to use in the analysis.
            polygon_barrier_layer: Polygon barriers to use in the analysis.
            portal_description: Description of portal.
        Returns:
            No returns.
        Raises:
            No exceptions.

        """
        self.stops_layer = stops_layer
        if not self.stops_layer.layer_name:
            self.stops_layer.layer_name = "Stops Layer"
        self.route_count = route_count
        self.max_stops_per_route = max_stops_per_route
        self.start_layer = start_layer
        if not self.start_layer.layer_name:
            self.start_layer.layer_name = "Start Layer"
        self.route_start_time = route_start_time
        self.start_layer_route_id = start_layer_route_id
        self.return_to_start = return_to_start
        self.end_layer = end_layer
        if self.end_layer and not self.end_layer.layer_name:
            self.end_layer.layer_name = "End Layer"
        self.end_layer_route_id = end_layer_route_id
        self.stop_service_time = stop_service_time
        self.max_route_time = max_route_time
        self.travel_mode = travel_mode
        self.include_route_layers = include_route_layers
        self.point_barrier_layer = point_barrier_layer
        self.line_barrier_layer = line_barrier_layer
        self.polygon_barrier_layer = polygon_barrier_layer

        if portal_description is None:
            self.portal_description = ImmutableDict(arcpy.GetPortalDescription())
        else:
            self.portal_description = portal_description

        # Determine the directions language based on the culture of the user if generating route layers
        self.directions_language = "en"
        if self.include_route_layers:
            self.directions_language = NAUtils.get_user_culture(self.portal_description)

        # Set up outputs
        self.output_workspace = output_workspace
        self.output_routes_name = output_routes_name
        self.output_assigned_stops_name = output_assigned_stops_name
        self.output_unassigned_stops_name = output_unassigned_stops_name
        self.output_routes = AnalysisUtils.initialize_output_layer(None,
                                                                   self.output_routes_name,
                                                                   self.output_workspace,
                                                                   True)
        self.output_assigned_stops = AnalysisUtils.initialize_output_layer(None,
                                                                           self.output_assigned_stops_name,
                                                                           self.output_workspace,
                                                                           True)
        self.output_unassigned_stops = AnalysisUtils.initialize_output_layer(None,
                                                                             self.output_unassigned_stops_name,
                                                                             self.output_workspace,
                                                                             True)
        LOGGER.debug("Output routes: {}".format(self.output_routes.data))
        LOGGER.debug("Output assigned stops: {}".format(self.output_assigned_stops.data))
        LOGGER.debug("Output unassigned stops: {}".format(self.output_unassigned_stops.data))

        # Get the tool limits from routing utilities service if available in the portal.
        # Default is the limits imposed by online services
        self.max_route_count = 100
        self.max_stops_count = 2000
        self.max_stops_per_route_serv_lim = 200
        self.tool_limits = {}
        self._get_service_limits()

        # All outputs are created in the spatial reference of the stops layer.
        # Note: If this logic ever changes, also update prtool.py in get_parameters() where it calls
        # self.check_overwrite_sr().
        if arcpy.env.outputCoordinateSystem:
            self.output_coordinate_system: arcpy.SpatialReference = arcpy.env.outputCoordinateSystem  # type: ignore
            LOGGER.debug("arcpy.env.outputCoordinateSystem is specified and will be used for outputs.")
        else:
            self.output_coordinate_system: arcpy.SpatialReference = self.stops_layer.spatialReference  # type: ignore
            LOGGER.debug("The spatial reference of the Input Stops Layer will be used for outputs.")

        # Other shared parameters
        self.remote_job_id = ""
        self.temp_input_start_name = "temp"
        self.start_depot_name_prefix = "Start Depot - "
        self.end_depot_name_prefix = "End Depot - "
        self.unique_stop_names = {}
        stops_layer_field_names = [fld.name for fld in self.stops_layer.fields]
        self.stop_id_field_name = NAUtils.get_unique_field_name("StopID", stops_layer_field_names)
        self.stops_layer_has_oid64 = arcpy.Describe(self.stops_layer.layer).hasOID64
        self.route_layer_item_id_field_name = "RouteLayerItemID"
        self.route_layer_item_url_field_name = "RouteLayerItemURL"
        self.route_data = None
        # Actual inputs passed to the service. They will be populated during input preprocessing.
        self.input_orders = None
        self.input_depots = None
        self.input_routes = None
        self.task_cost = -1

    def _get_service_limits(self):
        """Get the tool limits imposed by the service."""
        routing_utils_tbx = RemoteToolboxUtils.get_helper_service_url("routingUtilities", self.portal_description)
        LOGGER.debug(f"Getting tool limits from {routing_utils_tbx}")
        self.tool_limits = NAUtils.get_tool_limits(routing_utils_tbx, "asyncVRP", "SolveVehicleRoutingProblem")
        if "maximumOrders" in self.tool_limits:
            max_orders = self.tool_limits["maximumOrders"]
            if max_orders is None:
                self.max_stops_count = NAUtils.INFINITY
            else:
                self.max_stops_count = max_orders
        if "maximumOrdersPerRoute" in self.tool_limits:
            max_orders_per_route = self.tool_limits["maximumOrdersPerRoute"]
            if max_orders_per_route is None:
                self.max_stops_per_route_serv_lim = NAUtils.INFINITY
            else:
                self.max_stops_per_route_serv_lim = max_orders_per_route
        if "maximumRoutes" in self.tool_limits:
            max_routes = self.tool_limits["maximumRoutes"]
            if max_routes is None:
                self.max_route_count = NAUtils.INFINITY
            else:
                self.max_route_count = max_routes
        LOGGER.debug("Max stop count: {0}".format(self.max_stops_count))
        LOGGER.debug("Max stops per route: {0}".format(self.max_stops_per_route_serv_lim))
        LOGGER.debug("Max route count: {0}".format(self.max_route_count))

    def validate_parameters(self) -> bool:
        """Validate the parameters of the executor."""
        # Fail if we don't have at least one feature in the input stops layer
        if self.stops_layer.count < 1:
            LOGGER.error(100064, extra={"message_ID": 100064, "stopsLayer": self.stops_layer.layer_name})
            return False

        # Check that we don't have more than the number of input stops supported by the remote service
        if self.stops_layer.count > self.max_stops_count:
            LOGGER.error(100068, extra={
                "message_ID": 100068,
                "stopsLayer": self.stops_layer.layer_name,
                "max": self.max_stops_count})
            return False

        # Check that we don't have more than the number of vehicles supported by the remote service
        if self.route_count > self.max_route_count:
            LOGGER.error(100066, extra={
                "message_ID": 100066,
                "max": self.max_route_count})
            return False

        # Check that we don't have more than the number of stops per vehicle supported by the remote service
        if self.max_stops_per_route > self.max_stops_per_route_serv_lim:
            LOGGER.error(100067, extra={
                "message_ID": 100067,
                "max": self.max_stops_per_route_serv_lim})
            return False

        # Fail if we don't have at least one feature in the input stops layer
        if self.start_layer.count < 1:
            LOGGER.error(100065, extra={"message_ID": 100065, "stopsLayer": self.start_layer.layer_name})
            return False

        # Perform a case insensitive check if the startLayerRouteID field exists.
        # If the field exists, set the field name to be with appropriate case as found on the layer
        running_in_portal = PortalUtils.is_portal_env()
        if self.start_layer_route_id and self.start_layer.count > 1:
            try:
                start_layer_route_id = FieldUtils.get_field_from_layer(self.start_layer_route_id, self.start_layer)
                self.start_layer_route_id = FieldUtils.get_fq_field_name(start_layer_route_id, self.start_layer,
                                                                         running_in_portal)
            except ToolExit:
                msg_code = 100087
                msg_params = {
                    "message_ID": msg_code,
                    "inputLayer": self.start_layer.layer_name,
                    "fieldName": self.start_layer_route_id
                }
                LOGGER.error(msg_code, extra=msg_params)
                return False

        # If we have more than one point in start layer, check if we don't have more start points
        # than the number of vehicles supported by the remote service. For example if we have 101 start
        # points, and the service only supports 100 vehicles, we can have a case where the user is trying
        # to specify 101 vehicles each starting at a unique start point.
        if self.start_layer.count > self.max_route_count:
            LOGGER.error(100276, extra={
                "message_ID": 100276,
                "startLayer": self.start_layer.layer_name,
                "max": self.max_route_count})
            return False

        # If we have more than one point in the start layer, then start layer count should be equal to route count
        if self.start_layer.count > 1 and self.start_layer.count != self.route_count:
            LOGGER.error(100274, extra={"message_ID": 100274, "startLayer": self.start_layer.layer_name})
            return False

        # Check that end layer is not specified if return to start is true
        if self.return_to_start and self.end_layer and self.end_layer.count > 0:
            LOGGER.error(100076, extra={"message_ID": 100076, "endLayer": self.end_layer.layer_name})
            return False

        # Perform checks that are applicable when end_layer is specified.
        if self.end_layer:
            if self.end_layer.count > self.max_route_count:
                LOGGER.error(100277, extra={
                    "message_ID": 100277,
                    "endLayer": self.end_layer.layer_name,
                    "max": self.max_route_count})
                return False

            # If we have more than one point in the end layer but only one point in start layer, then end layer count
            # should be equal to route count
            if self.end_layer.count > 1 and self.start_layer.count == 1 and self.end_layer.count != self.route_count:
                LOGGER.error(100275, extra={"message_ID": 100275, "endLayer": self.end_layer.layer_name})
                return False

            # If both start layer and end layer have more than one point, both layers must have same number of features
            if self.end_layer.count > 1 and self.start_layer.count > 1:
                if self.end_layer.count != self.start_layer.count:
                    LOGGER.error(100095, extra={
                        "message_ID": 100095,
                        "endLayer": self.end_layer.layer_name,
                        "startLayer": self.start_layer.layer_name})
                    return False

            # Perform a case insensitive check if the endLayerRouteID field exists.
            # If the field exists, set the field name to be with appropriate case as found on the layer
            if self.end_layer_route_id and self.end_layer.count > 1:
                try:
                    end_layer_route_id = FieldUtils.get_field_from_layer(self.end_layer_route_id, self.end_layer)
                    self.end_layer_route_id = FieldUtils.get_fq_field_name(end_layer_route_id, self.end_layer,
                                                                           running_in_portal)
                except ToolExit:
                    msg_code = 100087
                    msg_params = {
                        "message_ID": msg_code,
                        "inputLayer": self.end_layer.layer_name,
                        "fieldName": self.end_layer_route_id
                    }
                    LOGGER.error(msg_code, extra=msg_params)
                    return False

        # Check that stop service time is greater than or equal to zero
        if self.stop_service_time < 0:
            LOGGER.error(100074, extra={"message_ID": 100074})
            return False

        # Check that max route time is greater than zero and less than one year
        if self.max_route_time <= 0 or self.max_route_time > 525600:
            LOGGER.error(100075, extra={"message_ID": 100075})
            return False

        # Check that stop service time is less than max route time
        if self.stop_service_time >= self.max_route_time:
            LOGGER.error(100114, extra={
                "message_ID": 100114,
                "stopServiceTime": self.stop_service_time,
                "maxRouteTime": self.max_route_time})
            return False

        # Check if the travel mode is valid. Valid values are JSON that represent a time-based travel mode or
        # legacy travel mode keywords 'Driving', 'Trucking', 'Walking'
        if self.travel_mode.upper() not in ("DRIVING", "WALKING", "TRUCKING",):
            travel_mode_obj = NAUtils.get_travel_mode_from_json(self.travel_mode)
            if not travel_mode_obj:
                # Travel mode json conversion must have failed. Error was already thrown. Just quit.
                return False
            if not NAUtils.is_travel_mode_time_based(travel_mode_obj):
                LOGGER.error(100147, extra={"message_ID": 100147})
                return False

        return True

    def _preprocess_inputs(self):
        """Use the validated inputs to prepare the inputs in the format required by the remote service.

        Preparing inputs does things like create the routes table and depots.
        """
        # Variables used in this function
        depot_name_field = "Name"
        depot_name_field_max_length = 500
        route_name_field_max_length = 1024
        start_depot_names = {}
        end_depot_names = {}
        sl_use_oid_as_name = False
        el_use_oid_as_name = False
        start_layer_name_field = ""
        end_layer_name_field = ""

        # region Pre-process depots

        # Create the input Depots feature class that will be passed to the service, with the correct schema
        # Use the same spatial reference as the start layer and add a Name field
        self.input_depots = AOLUtils.create_unique_name("temp", self.output_workspace)
        arcpy.management.CreateFeatureclass(self.output_workspace, os.path.basename(self.input_depots), "POINT",
                                            spatial_reference=self.start_layer.spatialReference)
        arcpy.management.AddField(self.input_depots, depot_name_field, "TEXT", field_length=depot_name_field_max_length)

        # Append features from start layer into the depots.
        # Also store the values for start route id field. If start route id field is not specified, use OID
        # If start layer has only one feature, ignore start layer id field and use OID.
        if self.start_layer_route_id and self.start_layer.count > 1:
            start_layer_cursor_fields = ("SHAPE@", self.start_layer_route_id)
            start_layer_route_id_in_use = self.start_layer_route_id
        else:
            # Check if we have a name field on the start layer
            start_layer_name_field = NAUtils.check_well_known_fields(self.start_layer)
            if start_layer_name_field:
                start_layer_cursor_fields = ("SHAPE@", start_layer_name_field)
                start_layer_route_id_in_use = start_layer_name_field
            else:
                start_layer_cursor_fields = ("SHAPE@", "OID@")
                sl_use_oid_as_name = True
                start_layer_route_id_in_use = self.start_layer.oidFieldName

        # Insert start layer rows into the depots feature class
        # It is safe to use the SHAPE@ directly because the depots feature class was explicitly created using
        # the same spatial reference as the start layer
        with InsertCursor(
            self.input_depots, ("SHAPE@", depot_name_field)
        ) as depots_cursor:
            with SearchCursor(
                self.start_layer.layer, start_layer_cursor_fields, ""
            ) as start_layer_cursor:
                for row in start_layer_cursor:
                    start_route_id = str(row[1])
                    start_depot_name = f"{self.start_depot_name_prefix}{start_route_id}"
                    start_depot_names[start_route_id] = start_depot_name
                    depots_cursor.insertRow((row[0], start_depot_name))

        # Fail if start route id field values are not unique
        start_route_ids = set(start_depot_names.keys())
        if len(start_route_ids) != self.start_layer.count:
            LOGGER.error(100096, extra={
                "message_ID": 100096,
                "startLayerRouteIDField": start_layer_route_id_in_use,
                "startLayer": self.start_layer.layer_name})
            raise arcpy.ExecuteError

        if not self.return_to_start:
            # Append the features from end layer into depots if not returning to start.
            # Also store values for end route id field. If end route id field is not
            # specified, use OID. If end layer has only one feature, ignore end layer id field and use OID
            if self.end_layer_route_id and self.end_layer and self.end_layer.count > 1:
                end_layer_cursor_fields = ("SHAPE@", self.end_layer_route_id)
                end_layer_route_id_in_use = self.end_layer_route_id
            else:
                # Check if we have a name field on the end layer
                end_layer_name_field = NAUtils.check_well_known_fields(self.end_layer)  # type: ignore
                if end_layer_name_field:
                    end_layer_cursor_fields = ("SHAPE@", end_layer_name_field)
                    end_layer_route_id_in_use = end_layer_name_field
                else:
                    end_layer_cursor_fields = ("SHAPE@", "OID@")
                    el_use_oid_as_name = True
                    end_layer_route_id_in_use = self.end_layer.oidFieldName

            # If the end_layer doesn't have the same spatial reference as the start_layer (which is what the
            # input_depots has), we have to project the start depots using the correct geographic transformation.
            # Note: .projectAs is slow. As soon as these services are based on the Pro 2.7 codebase, update this code to
            # use the SearchCursor's new transformation property so the spatial ref can be converted correctly on the
            # fly.
            should_project = False
            transformation = None
            if self.end_layer and self.end_layer.spatialReference != self.start_layer.spatialReference:
                should_project = True
                transformation = NAUtils.get_datum_transformation(
                    self.end_layer.spatialReference, self.start_layer.spatialReference, self.end_layer.extent  # type: ignore
                )
            with InsertCursor(
                self.input_depots, ("SHAPE@", depot_name_field)
            ) as depots_cursor:
                with SearchCursor(
                    self.end_layer.layer, end_layer_cursor_fields  # type: ignore
                ) as end_layer_cursor:
                    for i, row in enumerate(end_layer_cursor):
                        end_route_id = str(row[1])
                        end_depot_name = f"{self.end_depot_name_prefix}{end_route_id}"
                        end_depot_names[end_route_id] = end_depot_name
                        shape = row[0]
                        if should_project:
                            shape = shape.projectAs(self.start_layer.spatialReference, transformation)
                        depots_cursor.insertRow((row[0], end_depot_name))

            # Fail if end route id field values are not unique
            end_route_ids = set(end_depot_names.keys())
            if len(end_route_ids) != self.end_layer.count:  # type: ignore
                LOGGER.error(100097, extra={
                    "message_ID": 100097,
                    "endLayerRouteIDField": end_layer_route_id_in_use,
                    "endLayer": self.end_layer.layer_name})  # type: ignore
                raise arcpy.ExecuteError

            # When both start and end depots are specified and both have more than one feature, we need to match each
            # start depot name to exactly one end depot name. Consequently, fail if the start_route_ids are not
            # identical to end_route_ids
            if self.start_layer.count > 1 and self.end_layer.count > 1:
                if start_route_ids != end_route_ids:
                    msg_params = {
                        "message_ID": 100098,
                        "startLayerRouteIDField": self.start_layer_route_id,
                        "startLayer": self.start_layer.layer_name,
                        "endLayerRouteIDField": self.end_layer_route_id,
                        "endLayer": self.end_layer.layer_name  # type: ignore
                    }
                    LOGGER.error(100098, extra=msg_params)
                    raise arcpy.ExecuteError

            # When both start and end depots are specified and both have only one feature, make sure their route ids
            # are unique. The route ids may not be unique when using well known fields.
            # Route IDs are also not unique when start layer and end layer do not have well known fields such
            # as when passing map notes. So in such cases make sure the route ids are unique and if not raise an error
            if self.start_layer.count == 1 and self.end_layer.count == 1:  # type: ignore
                if not (sl_use_oid_as_name and el_use_oid_as_name):
                    if start_route_ids.intersection(end_route_ids):
                        msg_params = {
                            "message_ID": 100252,
                            "startLayerRouteIDField": start_layer_name_field,
                            "startLayer": self.start_layer.layer_name,
                            "endLayerRouteIDField": end_layer_name_field,
                            "endLayer": self.end_layer.layer_name  # type: ignore
                        }
                        LOGGER.error(100252, extra=msg_params)
                        raise arcpy.ExecuteError

        # endregion Pre-process depots
        # region Pre-process routes

        # Create the input Routes table that will be passed to the service, with the correct schema
        self.input_routes = AOLUtils.create_unique_name("temp", self.output_workspace)
        arcpy.management.CreateTable(self.output_workspace, os.path.basename(self.input_routes))
        routes_field_defs = [
            ["Name", "TEXT", "", route_name_field_max_length],
            ["StartDepotName", "TEXT", "", depot_name_field_max_length],
            ["EndDepotName", "TEXT", "", depot_name_field_max_length],
            ["EarliestStartTime", "DATE"],
            ["LatestStartTime", "DATE"],
            ["MaxOrderCount", "SHORT"],
            ["MaxTotalTime", "DOUBLE"]
        ]
        arcpy.management.AddFields(self.input_routes, routes_field_defs)

        # Insert route records according to the defined start and end depots
        with InsertCursor(
            self.input_routes, [f[0] for f in routes_field_defs]
        ) as cursor:
            if self.return_to_start:
                # Handle cases where we have only one start point but need to create multiple routes
                # as well as multiple start points and routes that start and end at each start point.
                if len(start_depot_names) == 1:
                    # Create route_count number of routes with same start and end depot names
                    route_id, depot_name = list(start_depot_names.items())[0]
                    # Create a unique Name field value like route<n>
                    for i in range(0, self.route_count):
                        route_id = "{} - Route{}".format(depot_name, i + 1)
                        cursor.insertRow((route_id, depot_name, depot_name, self.route_start_time,
                                          self.route_start_time, self.max_stops_per_route, self.max_route_time))

                else:
                    # Need to create start_layer feature count number of routes with same start and end depot names
                    for route_id in start_depot_names:
                        start_depot_name = start_depot_names[route_id]
                        cursor.insertRow((route_id, start_depot_name, start_depot_name, self.route_start_time,
                                          self.route_start_time, self.max_stops_per_route, self.max_route_time))

            else:
                # Handle cases where we have only one start and one end point but need to create multiple routes
                # as well as one route between each start and end point pair
                if len(start_depot_names) == 1 and len(end_depot_names) == 1:
                    # Need to create route_count number of routes between the one start end pair
                    start_route_id, start_depot_name = list(start_depot_names.items())[0]
                    end_route_id, end_depot_name = list(end_depot_names.items())[0]
                    # Create a unique Name field value like route<n>
                    for i in range(0, self.route_count):
                        route_id = "{} - {} - Route{}".format(start_depot_name, end_depot_name, i + 1)
                        cursor.insertRow((route_id, start_depot_name, end_depot_name, self.route_start_time,
                                          self.route_start_time, self.max_stops_per_route, self.max_route_time))
                elif len(start_depot_names) > 1 and len(end_depot_names) == 1:
                    # Need to create start_layer feature count number of routes between many start locations and one
                    # end location
                    end_route_id, end_depot_name = list(end_depot_names.items())[0]
                    for depot_name in start_depot_names:
                        cursor.insertRow((depot_name, start_depot_names[depot_name], end_depot_name,
                                          self.route_start_time, self.route_start_time, self.max_stops_per_route,
                                          self.max_route_time))
                elif len(start_depot_names) == 1 and len(end_depot_names) > 1:
                    # Need to create end_layer feature count number of routes between many end locations and one
                    # start location
                    start_route_id, start_depot_name = list(start_depot_names.items())[0]
                    for depot_name in end_depot_names:
                        cursor.insertRow((depot_name, start_depot_name, end_depot_names[depot_name],
                                          self.route_start_time, self.route_start_time, self.max_stops_per_route,
                                          self.max_route_time))
                else:
                    # Need to create start_layer feature count number of routes between each start end pair
                    for depot_name in start_depot_names:
                        cursor.insertRow((depot_name, start_depot_names[depot_name], end_depot_names[depot_name],
                                          self.route_start_time, self.route_start_time, self.max_stops_per_route,
                                          self.max_route_time))

        # endregion Pre-process routes
        # region Pre-process orders

        # Create the input Orders feature class that will be passed to the service, with the correct schema.
        # Copy the objectIDs from stops_layer as the Name field. Later on we need to rename this Name field if the input
        # already contains a Name field.
        # This workflow is convoluted, but this was the only way to match the behavior and output schema in the older
        # version of this tool.
        orders_fms = arcpy.FieldMappings()
        name_fm = arcpy.FieldMap()
        name_fm.addInputField(self.stops_layer.layer, self.stops_layer.OIDFieldName)
        name_field = name_fm.outputField
        name_field.type = "TEXT"
        name_field.name = "Name"
        name_field.aliasName = "Name"
        name_field.length = 500
        name_fm.outputField = name_field
        orders_fms.addFieldMap(name_fm)

        # Make the feature class
        self.input_orders = AOLUtils.create_unique_name("temp" + self.output_assigned_stops_name,
                                                        self.output_workspace)
        arcpy.conversion.FeatureClassToFeatureClass(
            self.stops_layer.layer,
            os.path.dirname(self.input_orders),
            os.path.basename(self.input_orders),
            field_mapping=orders_fms
        )
        # Add ServiceTime field on input orders
        arcpy.management.AddField(self.input_orders, "ServiceTime", "DOUBLE",
                                  field_alias="Service Time (Minutes)")

        # If including route layers check if the stops have a name field. If name field is present, make its value
        # unique as the remote service needs unique values in Name field on Orders and replace the OIDs with unique
        # stop names
        if self.include_route_layers:
            stop_name_field = NAUtils.check_well_known_fields(self.stops_layer)
            if stop_name_field:
                # Ensure Stop name has unique values
                stop_names = {}
                with SearchCursor(
                    self.stops_layer.layer, ("OID@", stop_name_field)
                ) as cursor:
                    for row in cursor:
                        # Handle null values in the name field
                        oid, name = row
                        # Convert name to string in case the well known field is numeric
                        if isinstance(name, (int, float)):
                            name = str(int(name))
                        if not name:
                            name = str(oid)
                        stop_names.setdefault(name, []).append(oid)
                for stop_name, oids in stop_names.items():
                    if len(oids) == 1:
                        self.unique_stop_names[str(oids[0])] = stop_name
                    else:
                        for oid in oids:
                            new_stop_name = "{}_{}".format(stop_name, oid)
                            while True:
                                if new_stop_name in stop_names:
                                    new_stop_name += "_{}".format(oid)
                                else:
                                    break
                            self.unique_stop_names[str(oid)] = new_stop_name
                # Update Name and ServiceTime field on stops
                with UpdateCursor(
                    self.input_orders, ("ServiceTime", "Name")
                ) as cursor:
                    for row in cursor:
                        cursor.updateRow((self.stop_service_time, self.unique_stop_names.get(row[1], row[1])))
            else:
                arcpy.management.CalculateField(self.input_orders, "ServiceTime",
                                                self.stop_service_time, CALFIELD_PY_METHOD)
        else:
            # Calculate the ServiceTime field value to be same as input service time for stops
            arcpy.management.CalculateField(self.input_orders, "ServiceTime",
                                            self.stop_service_time, CALFIELD_PY_METHOD)

        # endregion Pre-process orders

    def _post_process_output_assigned_stops(self, service_output: arcpy.FeatureSet):
        """Post-process the assigned stops output to ensure correct schema."""
        with LogExecutionTime("Post-processed output assigned stops"):
            prev_distance_km_field = "FromPrevDistanceKilometers"

            # Create field mappings to create output with correct schema
            fields_to_delete = [
                "PickupQuantities", "DeliveryQuantities", "ArriveCurbApproach", "DepartCurbApproach", "WaitTime",
                "ViolationTime", "SnapX", "SnapY", "SnapZ", "DistanceToNetworkInMeters", "ORIG_FID", "Status"
            ]
            fields_to_rename = {
                "StopType": ("StopTypeLong", "StopType"),
                "RouteName": ("RouteName", "Route Name"),
                "FromPrevTravelTime": ("FromPrevTravelTime", "Travel Time from Previous Stop (Minutes)"),
                "FromPrevDistance": ("FromPrevDistance", "Travel Distance from Previous Stop (Miles)"),
                "ArriveTime": ("ArriveTime", "Arrive Time (Time Zone of Stop)"),
                "DepartTime": ("DepartTime", "Depart Time (Time Zone of Stop)"),
                "ArriveTimeUTC": ("ArriveTimeUTC", "Arrive Time"),
                "DepartTimeUTC": ("DepartTimeUTC", "Depart Time"),
            }
            field_mappings = NAUtils.make_field_maps(service_output, fields_to_delete, fields_to_rename)
            # Add new StopType field that will be a text field (calculated later)
            field_mappings.addFieldMap(NAUtils.make_new_field_map_with_output_field(
                "StopType", "Stop Type", "String", 20))
            # Add FromPrevDistanceKilometers field
            field_mappings.addFieldMap(NAUtils.make_new_field_map_with_output_field(
                prev_distance_km_field, "Travel Distance from Previous Stop (Kilometers)", "Double",
                out_field_scale=0, out_field_precision=0))

            # Copy the output to its final location using the field mappings
            NAUtils.copy_service_output_to_fc(
                service_output, self.output_assigned_stops.data, field_mappings,
                self.output_coordinate_system)

            # Calculate some fields
            with UpdateCursor(
                self.output_assigned_stops.layer,
                ("StopTypeLong", "StopType", "Sequence", "FromPrevDistance", prev_distance_km_field)
            ) as out_stops_table_cursor:
                for row in out_stops_table_cursor:
                    # Calculate FromPrevDistanceKilometers based on FromPrevDistance
                    row[4] = NAUtils.convert_units(row[3], "miles", "kilometers", 5)
                    # Calculate the text-based StopType field
                    stop_type = ""
                    if row[0] == 0:
                        stop_type = "Stop"
                    else:
                        if row[2] == 1:
                            stop_type = "Route start"
                        else:
                            stop_type = "Route end"
                    row[1] = stop_type
                    out_stops_table_cursor.updateRow(row)
            # Delete fields we're done with
            arcpy.management.DeleteField(self.output_assigned_stops.layer, "StopTypeLong")

            # Transfer the ServiceTime field from input orders to the output
            arcpy.management.JoinField(
                self.output_assigned_stops.data, "Name", self.input_orders, "Name", "ServiceTime")

            # Transfer fields from the original input to the output
            # Don't try to populate StopID for depots
            not_depots_where_clause = "StopType NOT IN ('Route start', 'Route end')"
            self._transfer_input_stop_fields(self.output_assigned_stops.data, not_depots_where_clause)

    def _post_process_output_routes(self, service_output: arcpy.FeatureSet):
        """Post-process the routes output to ensure correct schema."""
        with LogExecutionTime("Post-processed output routes"):
            # Create a FieldMappings object to handle deleting and renaming fields when we call the
            # ExportFeatures tool
            fields_to_delete = [
                "RegularTimeCost", "OvertimeCost", "DistanceCost", "TotalBreakServiceTime", "TotalWaitTime",
                "TotalViolationTime", "RenewalCount", "TotalRenewalServiceTime", "ViolatedConstraints", "TotalCost"
            ]
            fields_to_rename = {
                "TotalDistance": ("Total_Miles", "Total Miles"),
                "TotalTime": ("TotalTime", "Total Time (Minutes)"),
                "TotalTravelTime": ("TotalTravelTime", "Total Travel Time (Minutes)"),
                "OrderCount": ("StopCount", "Stop Count"),
                "TotalOrderServiceTime": ("TotalStopServiceTime", "Total Service Time (Minutes)"),
                "Name": ("RouteName", "Route Name"),
                "StartTime": ("StartTime", "Start Time (Time Zone of Start Location)"),
                "StartTimeUTC": ("StartTimeUTC", "Start Time"),
                "EndTime": ("EndTime", "End Time (Time Zone of End Location)"),
                "EndTimeUTC": ("EndTimeUTC", "End Time"),
            }
            field_mappings = NAUtils.make_field_maps(
                service_output,
                fields_to_delete,
                fields_to_rename
            )
            # Add RouteLayerItemID and RouteLayerItemURL fields
            field_mappings.addFieldMap(NAUtils.make_new_field_map_with_output_field(
                self.route_layer_item_id_field_name, "Route Layer Item ID", "String", 50))
            field_mappings.addFieldMap(NAUtils.make_new_field_map_with_output_field(
                self.route_layer_item_url_field_name, "Route Layer Item", "String", 256))
            # Add a Total_Kilometers field
            field_mappings.addFieldMap(NAUtils.make_new_field_map_with_output_field(
                "Total_Kilometers", "Total Kilometers", "Double",
                out_field_scale=0, out_field_precision=0))

            # Copy the output to its final location using the field mappings
            NAUtils.copy_service_output_to_fc(
                service_output, self.output_routes.data, field_mappings,
                self.output_coordinate_system)

            # Update some fields
            unused_route_count = 0
            with UpdateCursor(
                self.output_routes.layer,
                ("Total_Miles", "Total_Kilometers", "StopCount"),
            ) as routes_cursor:
                for row in routes_cursor:
                    if not row[2]:
                        # No StopCount. Just update StopCount to 0 instead of null
                        row[2] = 0
                        unused_route_count += 1
                    else:
                        # Otherwise update values for a valid route
                        row[1] = NAUtils.convert_units(row[0], "miles", "kilometers", 5)  # Calculate km from miles
                    routes_cursor.updateRow(row)

            if unused_route_count:
                # Add a warning
                used_route_count = self.route_count - unused_route_count
                msg_code = 100116
                msg_params = {"message_ID": msg_code, "routeCount": self.route_count, "routesUsed": used_route_count}
                LOGGER.warning(msg_code, extra=msg_params)

    def _post_process_output_unassigned_stops(self, service_output: arcpy.FeatureSet):
        """Post-process the unassigned stops output to ensure correct schema."""
        with LogExecutionTime("Post-processed output unassigned stops"):
            # Determine if we have unassigned stops
            unassigned_stops_count = AOLUtils.get_feature_count(service_output)
            if unassigned_stops_count:
                # Add a warning that some of the stops were unassigned
                LOGGER.warning(100115, extra={"message_ID": 100115})

            # Create field mappings to create output with correct schema
            fields_to_delete = ["ViolatedConstraints", "ORIG_FID"]
            fields_to_rename = {"Status": ("StatusLong", "Status"), "Name": ("name", "NAME")}
            field_mappings = NAUtils.make_field_maps(service_output, fields_to_delete, fields_to_rename)
            # Add a string field called Status
            field_mappings.addFieldMap(NAUtils.make_status_field_map())
            # Add a string field for ViolatedConstraints
            field_mappings.addFieldMap(
                NAUtils.make_new_field_map_with_output_field(
                    "ViolatedConstraints", "Violated Constraints", "String", 255))
            # Add a string field, InputLayerType, to indicate if the row came from a start or end depot or an order
            field_mappings.addFieldMap(
                NAUtils.make_new_field_map_with_output_field(
                    "InputLayerType", "Input Layer Type", "String", 25))
            # Copy the Name field into a new field, UnassignedStopName, that will be preserved in the final output
            unassigned_stop_name_field = NAUtils.get_unique_field_name(
                "UnassignedStopName", [f.name for f in self.stops_layer.fields])
            fm_usn = NAUtils.make_new_field_map_with_output_field(
                unassigned_stop_name_field, "Unassigned Stop Name", "String", 255)
            fm_usn.addInputField(service_output, "Name")
            field_mappings.addFieldMap(fm_usn)

            # Copy the output to its final location using the field mappings
            NAUtils.copy_service_output_to_fc(
                service_output, self.output_unassigned_stops.data, field_mappings, self.output_coordinate_system)

            # Update Status field with string values translated from StatusLong enums
            NAUtils.calc_status_field(self.output_unassigned_stops.data)

            # Update the ViolatedConstraints field values translated from the ViolatedConstraintsLong field
            # Each ViolatedConstraint_* field contains a single violated constraint as an integer. Convert the values
            # to text and then combine them all into a single ViolatedConstraints field.
            # See ViolatedConstraint_1 value descriptions here:
            # https://pro.arcgis.com/en/pro-app/latest/arcpy/network-analyst/vehicleroutingproblem-output-data-types.htm
            # Note that the PlanRoutes web tool does not provide the user with enough options to encounter most of these
            # violated constraints, but we have the whole table here in case of future enhancements.
            vc_fields = ["ViolatedConstraint_1", "ViolatedConstraint_2", "ViolatedConstraint_3", "ViolatedConstraint_4"]
            stops_violated_constraints = {
                0: "Maximum number of points per route exceeded",
                1: "Capacities exceeded",
                2: "Maximum total time exceeded",
                3: "Maximum total travel time exceeded",
                4: "Maximum total distance exceeded",
                5: "Hard time window",
                6: "Unmatched specialty",
                7: "Hard route zone",
                8: "Order pair maximum transit time exceeded",
                9: "Order pair violation",
                10: "Unreachable",
                11: "Cannot insert required break(s)",
                12: "Cannot insert required renewal(s)",
                13: "Maximum travel time between breaks exceeded",
                14: "Break maximum cumulative work time exceeded",
                15: "Inbound arrive time or outbound depart time order violation",
                16: "Cannot anchor first/last"
            }
            with UpdateCursor(
                    self.output_unassigned_stops.data, vc_fields + ["ViolatedConstraints"]) as cur:
                for row in cur:
                    combined_vc_values = []
                    new_row = []
                    for idx in range(len(vc_fields)):
                        new_row.append(row[idx])
                        vc_value = stops_violated_constraints.get(row[idx], "")
                        if vc_value:
                            combined_vc_values.append(vc_value)
                    new_row.append(", ".join(combined_vc_values))
                    cur.updateRow(new_row)

            # Populate the InputLayerType field from the StopType and Name fields
            with UpdateCursor(self.output_unassigned_stops.data, ["StopType", "Name", "InputLayerType"]) as cur:
                for row in cur:
                    new_row = list(row)
                    if row[0] == 0:
                        new_row[2] = "Intermediate stop layer"
                    elif row[0] == 1:
                        if row[1].startswith(self.start_depot_name_prefix):
                            new_row[2] = "Start layer"
                        elif row[1].startswith(self.end_depot_name_prefix):
                            new_row[2] = "End layer"
                    cur.updateRow(new_row)

            # Delete ViolatedConstraint_ and StopType fields because we're done with them
            arcpy.management.DeleteField(self.output_unassigned_stops.data, vc_fields + ["StopType"])

            # Transfer fields from the original input to the output
            # Don't try to populate StopID for depots
            stops_only_where_clause = "InputLayerType = 'Intermediate stop layer'"
            self._transfer_input_stop_fields(self.output_unassigned_stops.data, stops_only_where_clause)

    def _transfer_input_stop_fields(self, fc: str, where_clause: str = ""):
        """Transfer the fields from input stops layer to both assigned stops and unassigned stops.

        Args:
            fc (str): Catalog path to the feature class of the output to be updated (assigned or unassigned stops)
            where_clause (str, optional): Where clause to filter the fc when calculating stop IDs. This is primarily
                used to return only route stops and not depots. Defaults to "".
        """
        # Earlier we used the Name field on the input Orders to store the original stop_layer ObjectID. Use that now to
        # transfer over the fields from the original data into the output.
        # This workflow is convoluted, but this was the only way to match the behavior and output schema in the older
        # version of this tool.
        field_type = "BIGINTEGER" if self.stops_layer_has_oid64 else "LONG"
        arcpy.management.AddField(fc, self.stop_id_field_name, field_type)
        # Calculate StopID from text name field
        if self.unique_stop_names:
            # Replace the unique stop names with OIDs. This is required since when creating route layers, it is possible
            # the Name field may not contain OIDs
            unq_stop_names = {v: k for k, v in self.unique_stop_names.items()}
            with UpdateCursor(fc, ("Name", self.stop_id_field_name), where_clause) as cursor:
                for row in cursor:
                    row[1] = int(unq_stop_names[row[0]])
                    cursor.updateRow(row)
        else:
            # Calculate StopID from text name field which actually includes OIDs from input stops
            with UpdateCursor(fc, ("Name", self.stop_id_field_name), where_clause) as cursor:
                for row in cursor:
                    row[1] = int(row[0])
                    cursor.updateRow(row)
        # Delete the Name field as we don't want to rename the Name field from input stops.
        arcpy.management.DeleteField(fc, "Name")

        # Transfer all fields from inputs stops to assigned and unassigned stops
        arcpy.management.JoinField(fc, self.stop_id_field_name, self.stops_layer.layer,
                                   self.stops_layer.oidFieldName)

        # Delete the StopID field as we no longer need it.
        arcpy.management.DeleteField(fc, self.stop_id_field_name)
        # In case of field name collision, rename the fields from input stops as ORIG_fieldname and field
        # alias to be Field Alias (Original).
        fields_to_rename = {fld.name: fld.aliasName for fld in AOLUtils.list_fields(fc, "*_1") if not fld.required}
        for fld in fields_to_rename:
            new_fld_name = "ORIG_{0}".format(fld.rstrip("_1"))
            new_alias_name = "{0} (Original)".format(fields_to_rename[fld])
            arcpy.management.AlterField(fc, fld, new_fld_name, new_alias_name)

    def execute(self):
        """Execute the core logic of PlanRoutes."""
        with LogExecutionTime("Preprocessed inputs"):
            self._preprocess_inputs()

        solve_succeeded = False

        try:
            # Get the tool
            tbx = RemoteToolboxUtils.get_remote_toolbox("asyncVRP", self.portal_description)
            LOGGER.debug("Adding remote toolbox {0}".format(tbx))

            # Prepare task parameters
            point_barr_lyr = self.point_barrier_layer.layer if self.point_barrier_layer else None
            line_barr_lyr = self.line_barrier_layer.layer if self.line_barrier_layer else None
            poly_barr_lyr = self.polygon_barrier_layer.layer if self.polygon_barrier_layer else None
            # Cluster routes only if more than 50% of stops can be assigned to the routes
            cluster_routes = False
            if self.max_stops_per_route * self.route_count > self.stops_layer.count / 2.0:
                cluster_routes = True
            LOGGER.debug("Spatially cluster routes: {0}".format(cluster_routes))
            if self.include_route_layers:
                save_route_data = True
                populate_directions = True
                LOGGER.debug("Directions language: {0}".format(self.directions_language))
            else:
                save_route_data = False
                populate_directions = False
            task_params = [
                self.input_orders,
                self.input_depots,
                self.input_routes,
                "", "", "Miles", "",
                self.route_start_time,
                "", "",
                cluster_routes,
                "", "", "", "",
                point_barr_lyr,
                line_barr_lyr,
                poly_barr_lyr,
                "", "", "", "", "",
                populate_directions,
                self.directions_language,
                "",
                self.travel_mode,
                "", "", "", "",
                save_route_data,
                "", "", True
            ]
            ignore_error_codes = (30109,)

            # Call the tool
            service_result = NAUtils.call_async_gp_service(
                tbx, "SolveVehicleRoutingProblem", task_params, ignore_error_codes)
            self.remote_job_id = service_result.resultID
            if service_result.getOutput(4).lower() == 'true':
                solve_succeeded = True

            # Save the results from the remote tool and post-process them to have the correct schema
            # Always get unassigned stops, even if solve fails
            self._post_process_output_unassigned_stops(service_result.getOutput(0))
            if solve_succeeded:
                with LogExecutionTime("Saved the results from remote tool"):
                    if self.include_route_layers:
                        self.route_data = service_result.getOutput(6)
                    self._post_process_output_assigned_stops(service_result.getOutput(1))
                    self._post_process_output_routes(service_result.getOutput(2))
                    self.task_cost = NAUtils.get_remote_task_cost(service_result, 9)
            else:
                if save_route_data:
                    # Raise a warning since no route data is generated when there is no solution for VRP.
                    LOGGER.warning(100217, extra={"message_ID": 100217})
                # Add a warning about the solve failure
                LOGGER.warning(100113, extra={"message_ID": 100113})
                # Manually set counts for outputs to 0 so the calling tool will be able to handle them
                self.output_assigned_stops.count = 0
                self.output_routes.count = 0
                try:
                    self.task_cost = NAUtils.get_remote_task_cost(service_result, 9)
                except Exception as err:
                    LOGGER.debug(f"Unable to get the cost due to {str(err)}")

        except Exception as ex:
            raise
        finally:
            # Delete any temporary outputs
            with arcpy.EnvManager(workspace=self.output_workspace):
                for dataset in arcpy.ListFeatureClasses("temp*") + arcpy.ListTables("temp*"):  # type: ignore
                    try:
                        arcpy.management.Delete(dataset)
                    except Exception as ex:
                        LOGGER.debug("Failed to delete {0}".format(os.path.join(self.output_workspace, dataset)))
