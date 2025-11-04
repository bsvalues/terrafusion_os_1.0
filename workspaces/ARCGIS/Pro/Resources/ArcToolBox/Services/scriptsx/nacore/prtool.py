"""PlanRoutes tool implementation."""
# functions called implicitly in __init__. noqa. pylint: disable=attribute-defined-outside-init
# import internal modules. noqa. pylint: disable=import-error,no-name-in-module
import time
import json

import arcpy
from arcpy.da import UpdateCursor  # type: ignore

from common import (PATool, PAFeatureLayer, ToolExit, LogUtils, PAPrivileges, FSECPublisher,
                    SimpleRenderer, UniqueValueRenderer, RefundErrorProcessor,
                    ModelBuilderMixin, COST_KEY, ParameterUnpackMixin,
                    AOLUtils)
from .prexecutor import PRExecutor
from .crldexecutor import CRLDExecutor
from .nautils import NAUtils


LOGGER = LogUtils.setup_logger(__name__)
DEBUG_MODE = True


class PRErrorProcessor(RefundErrorProcessor):
    """Append errors from remote service for PlanRoutes."""

    def process_remote_service_error(self):
        """Process any error code reported by the remote service."""
        if isinstance(self.error, arcpy.ExecuteError):
            # Catch some specific errors
            if self.error.args:
                remote_msgs = self.error.args[0]
                if remote_msgs:
                    if (
                        (isinstance(remote_msgs, (list, dict)) and 30145 in remote_msgs)
                        or (isinstance(remote_msgs, str) and '30145' in remote_msgs)
                    ):
                        NAUtils.handle_walking_limit_error(self.tool.executor.tool_limits)  # type: ignore
                        return False
                    if (
                        (isinstance(remote_msgs, (list, dict)) and 30095 in remote_msgs)
                        or (isinstance(remote_msgs, str) and '30095' in remote_msgs)
                    ): 
                        # Barrier limit exceeded
                        remote_err = remote_msgs[30095] if isinstance(remote_msgs, dict) else remote_msgs
                        if NAUtils.raise_barrier_limit_error(remote_err):
                            return False

    def process_gp_error(self):
        """Overwrite the process_gp_error function to add the additional process of remote service error."""
        if self.tool:
            self.process_remote_service_error()
        super().process_gp_error()


class PRTool(ParameterUnpackMixin, ModelBuilderMixin, PATool):
    """Implementation of PlanRoutes tool."""

    def get_parameters(self):
        """Implement the abstractmethod of get_parameters."""
        # Check the NA privilege
        LOGGER.debug("Checking NA privileges")
        if not self.check_privileges([PAPrivileges.NETWORK_ANALYSIS]):
            LOGGER.error(100111, extra={"message_ID": 100111})
            raise ToolExit

        # Tool signature matches the descriptions here:
        # https://developers.arcgis.com/rest/analysis/api-reference/plan-routes.htm
        LOGGER.debug("Retrieving parameters from tool dialog")
        remote_server_ver = self.get_remote_server_version("asyncRoute")
        stops_layer = PAFeatureLayer(
            0,
            metadata={"parameterDataType": "Feature Set", "parameterName": "stopsLayer"},
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        (route_count, max_stops_per_route, route_start_time, return_to_start,
         stop_service_time, max_route_time, include_route_layers) = self.unpack([1, 2, 3, 6, 10, 11, 14],
                                                                                as_text=False)
        (start_layer_route_id, end_layer_route_id, travel_mode) = self.unpack([5, 8, 9],
                                                                              as_text=True)
        start_layer = PAFeatureLayer(
            4,
            metadata={"parameterDataType": "Feature Set", "parameterName": "startLayer"},
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        end_layer = PAFeatureLayer(
            7,
            metadata={
                "parameterDataType": "Feature Set", "parameterName": "endLayer", "parameterType": "Optional"
            },
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )

        # If the user wants to include route layers, check privileges for creating portal items the NA privilege
        if include_route_layers:
            LOGGER.debug("Checking Create Item privileges")
            if not self.check_privileges([PAPrivileges.CREATE_ITEM]):
                LOGGER.error(100118, extra={"message_ID": 100118})
                raise ToolExit
        # Fail if including route layers and requesting feature collection output
        if include_route_layers and not self.output_name.create_service:
            LOGGER.error(100223, extra={"message_ID": 100223})
            raise ToolExit

        point_barrier_layer = PAFeatureLayer(
            15,
            metadata={
                "parameterDataType": "Feature Set", "parameterName": "pointBarrierLayer", "parameterType": "Optional"
            },
            verify_feature_count=False,
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        line_barrier_layer = PAFeatureLayer(
            16,
            metadata={
                "parameterDataType": "Feature Set", "parameterName": "lineBarrierLayer", "parameterType": "Optional"
            },
            verify_feature_count=False,
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        polygon_barrier_layer = PAFeatureLayer(
            17,
            metadata={
                "parameterDataType": "Feature Set", "parameterName": "polygonBarrierLayer", "parameterType": "Optional"
            },
            verify_feature_count=False,
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )

        # All outputs are created in the spatial reference of the stops layer.
        # Note: The output coordinate system is defined separately in the executor. Make sure any changes to this logic
        # are made in both places.
        if arcpy.env.outputCoordinateSystem:
            output_coordinate_system = arcpy.env.outputCoordinateSystem
            LOGGER.debug("arcpy.env.outputCoordinateSystem is specified and will be used for outputs.")
        else:
            output_coordinate_system = stops_layer.spatialReference
            LOGGER.debug("The spatial reference of the Input Stops Layer will be used for outputs.")
        self.check_overwrite_sr(output_coordinate_system)  # type: ignore

        # Check credits
        LOGGER.debug("Setting cost parameters")
        tm_for_credits = travel_mode
        if travel_mode.upper() not in ("DRIVING", "TRUCKING", "WALKING",):
            tm_for_credits = "CUSTOM"
        self.cost_parameters = {
            "stopsLayer": stops_layer,
            "routeCount": route_count,
            "maxStopsPerRoute": max_stops_per_route,
            "routeStartTime": route_start_time,
            "startLayer": start_layer,
            "startLayerRouteIDField": start_layer_route_id,
            "returnToStart": return_to_start,
            "endLayer": end_layer,
            "endLayerRouteIDField": end_layer_route_id,
            "travelMode": tm_for_credits,
            "stopServiceTime": stop_service_time,
            "maxRouteTime": max_route_time,
            "includeRouteLayers": include_route_layers,
        }
        self.refund_param = None

        # replace in_memory with scratchGDB since the former does not
        # support TimestampOffset field type
        if (
            start_layer.contains_field_type("TimestampOffset")
            or (
                end_layer and end_layer.contains_field_type("TimestampOffset")
            )
        ):
            wkspc = arcpy.env.scratchGDB
        else:
            wkspc = "in_memory" if not DEBUG_MODE else arcpy.env.scratchGDB

        LOGGER.debug("Initializing tool executor")
        self.executor: PRExecutor = PRExecutor(
            stops_layer,
            route_count,
            max_stops_per_route,
            start_layer,
            start_layer_route_id,
            route_start_time,
            return_to_start,
            end_layer,
            end_layer_route_id,
            stop_service_time,
            max_route_time,
            travel_mode=travel_mode,
            include_route_layers=include_route_layers,
            point_barrier_layer=point_barrier_layer,
            line_barrier_layer=line_barrier_layer,
            polygon_barrier_layer=polygon_barrier_layer,
            output_workspace=wkspc,
            portal_description=self.portal_description
        )

    def set_visualization(self):
        """Set the drawing/popup information of the output."""
        # Set the parameter for refund. It will be used implicitly by the error processor.
        # I don't really know why this stuff is in the set_visualization method, but here it is.
        self.cost_parameters[COST_KEY] = self.executor.task_cost
        LOGGER.debug("Setting refund parameters")
        self.refund_param = {"remoteJobID": self.executor.remote_job_id}
        if self.executor.task_cost >= 1:
            self.refund_param[COST_KEY] = self.executor.task_cost
        else:
            self.refund_param["outFeatureCount"] = self.executor.output_routes.count

        # region unassigned stops
        # Don't bother setting symbology unless we actually have some unassigned stops
        if self.executor.output_unassigned_stops.count:
            LOGGER.debug("Setting symbology and pop-ups for output unassigned stops")
            # Set symbology
            drawing_info_unassigned_stops = SimpleRenderer(self.executor.output_unassigned_stops, self.task_name)
            drawing_info_json = drawing_info_unassigned_stops.get_drawing_json()
            fill_color = [255, 0, 0, 255]
            outline_color = [255, 255, 115, 255]
            drawing_info_json = drawing_info_unassigned_stops.update_fill_outline_color(
                drawing_info_json, fill_color, True, outline_color)
            self.executor.output_unassigned_stops.set_drawing(None, drawing_info_json)
            # Set pop-ups
            self.executor.output_unassigned_stops.set_popup(
                None, "Summary of Unassigned Stops"
            )
        # endregion unassigned stops

        # Don't bother setting symbology unless we actually have some assigned stops
        if self.executor.output_assigned_stops.count and self.executor.output_routes.count:

            # region assigned stops
            LOGGER.debug("Setting symbology and pop-ups for output assigned stops")
            # Set symbology
            # Read the renderer definition from a template json file
            drawing_info_assigned_stops = UniqueValueRenderer(
                self.executor.output_assigned_stops,
                0,
                ["RouteName"],
                "pr_assigned_stops_uniq_value_renderer_def.json",
                False,
                False
            )
            assigned_stops_drawing_json = drawing_info_assigned_stops.get_drawing_json()
            # Set labeling
            assigned_stops_drawing_json = drawing_info_assigned_stops.set_labeling_info(
                assigned_stops_drawing_json,
                drawing_info_assigned_stops.get_drawing_from_json("pr_assigned_stops_labeling_def.json")
            )

            # Commit symbology and labeling
            self.executor.output_assigned_stops.set_drawing(None, assigned_stops_drawing_json)

            # Set pop-ups
            # Hide the ArriveTime and DepartTime fields and display only ArriveTimeUTC and DepartTimeUTC
            # because the map viewer assumes all date fields have values in UTC and displays time value in
            # computer time zone.
            # Always hide RouteLayerItemID field and hide RouteLayerItemURL fields if not including route layers
            hide_assigned_stops_field_names = ["ArriveTime", "DepartTime"]
            # FromPrevDistanceKilometers should be immediately after FromPrevDistance in the display order
            assigned_stops_field_names = NAUtils.update_field_display_order(
                [f.name for f in self.executor.output_assigned_stops.fields],
                [("FromPrevDistanceKilometers", "FromPrevDistance")]
            )
            self.executor.output_assigned_stops.set_popup(
                None, "Summary of Assigned Stops",
                hide_fields=hide_assigned_stops_field_names,
                field_names_display_order=assigned_stops_field_names
            )

            # endregion assigned stops

            # region routes
            LOGGER.debug("Setting symbology and pop-ups for output routes")
            # Set symbology
            # Read the renderer definition from a template json file
            drawing_info_routes = UniqueValueRenderer(
                self.executor.output_routes,
                25,
                ["RouteName"],
                "pr_routes_uniq_value_renderer_def.json",
                False,
                False
            )
            self.executor.output_routes.set_drawing(None, drawing_info_routes.get_drawing_json())

            # Set pop-ups
            # Hide the StartTime and EndTime fields and only display the StartTimeUTC and EndTimeUTC fields
            # because the map viewer assumes all date fields have values in UTC and displays time value in
            # computer time zone.
            # Always hide RouteLayerItemID field and hide RouteLayerItemURL fields if not including route layers
            hide_route_field_names = ["StartTime", "EndTime", self.executor.route_layer_item_id_field_name]
            if not self.executor.include_route_layers:
                hide_route_field_names.append(self.executor.route_layer_item_url_field_name)
            # Total_Kilometers should be immediately after Total_Miles field in the display order
            routes_field_names = NAUtils.update_field_display_order(
                [f.name for f in self.executor.output_routes.fields], [("Total_Kilometers", "Total_Miles")])
            self.executor.output_routes.set_popup(
                None, "Summary of {RouteName}",
                hide_fields=hide_route_field_names,
                field_names_display_order=routes_field_names
            )

            # endregion routes

            # Create one to many relationship between routes and assigned stops.
            LOGGER.debug("Adding relationships")
            relationship_name = "RouteStops"
            self.executor.output_routes.add_relationship(
                relationship_name, 1,
                "RouteName", is_origin=True, is_composite=False
            )
            self.executor.output_assigned_stops.add_relationship(
                relationship_name, 0,
                "RouteName", is_origin=False, is_composite=False
            )

    def publish_outputs(self):
        """Publish the outputs as a feature service."""
        LOGGER.debug("Publishing results")

        # First publish route data because we need to update some fields in the output routes based on the published
        # route data route names and urls.
        if self.executor.include_route_layers and self.executor.route_data:
            with arcpy.EnvManager(outputCoordinateSystem=self.executor.output_coordinate_system):
                # Process the route data zip file and add the items to the portal
                crld_executor = CRLDExecutor(self.executor.route_data)
                crld_executor.validate_parameters()
                crld_executor.execute()
                crld_executor.publish_route_layers(self.output_name)
            # Calculate RouteLayerItemID and RouteLayerItemURL fields on routes layer in the feature output
            # Get the route layer item id for each route name.
            route_layer_items = crld_executor.output_items.get("items", {})
            if route_layer_items:
                route_layer_item_ids = {v["routeName"]: (k, v["url"]) for k, v in route_layer_items.items()}
                with UpdateCursor(
                    self.executor.output_routes.layer,
                    ("RouteName", self.executor.route_layer_item_id_field_name,
                        self.executor.route_layer_item_url_field_name)
                ) as cursor:
                    for row in cursor:
                        if row[0] in route_layer_item_ids:
                            row[1] = route_layer_item_ids[row[0]][0]  # routeName
                            row[2] = route_layer_item_ids[row[0]][1]  # url
                            cursor.updateRow(row)

            arcpy.SetParameterAsText(21, json.dumps(crld_executor.output_items))

        # Publish feature services for all outputs
        # Need to clear out extent before copying features to SDE so that we can always copy all features
        # Without this PlanRoutes may not copy all travel areas depending on the input map extent
        with arcpy.EnvManager(extent=None):
            publisher = FSECPublisher(self.output_name, tool_version=self.version)
            if self.executor.output_unassigned_stops.count:
                publisher.add_layer_to_publish(
                    self.executor.output_unassigned_stops, 20, "Unassigned Stops", layer_index=2)
            if self.executor.output_assigned_stops.count:
                LOGGER.debug(
                    f"Number of assigned stops just before publish: {self.executor.output_assigned_stops.count}")
                publisher.add_layer_to_publish(
                    self.executor.output_assigned_stops, 19, "Assigned Stops", layer_index=1)
            if self.executor.output_routes.count:
                publisher.add_layer_to_publish(
                    self.executor.output_routes, 18, "Routes", layer_index=0)

            publisher.publish()

        if self.executor.include_route_layers:
            NAUtils.update_published_item(self.output_name)

    def log_usage_metering(self):
        """Log the usage of the tool."""
        route_start_time_value = None
        if self.executor.route_start_time:
            route_start_time_value = time.mktime(self.executor.route_start_time.timetuple()) * 1000
        return_to_start_value = int(self.executor.return_to_start)
        values = [
            1,  # Stops layer is always point
            self.executor.stops_layer.count,  # num objects is total input stops processed.
            self.executor.route_count,
            self.executor.max_stops_per_route,
            route_start_time_value,
            1,  # Start layer is always point
            self.executor.start_layer.count,
            return_to_start_value,
            1,  # End layer is always point
            self.executor.end_layer.count if self.executor.end_layer else 0,
            NAUtils.get_travel_mode_type_as_int(self.executor.travel_mode),
            self.executor.stop_service_time,
            self.executor.max_route_time,
            self.output_name.output_cost,  # output is feature collection or feature service
            int(self.executor.include_route_layers),  # Log if route layers are created
        ]

        # Cost is 0 as the billing happens at logistics.arcgis.com
        LogUtils.log_usage(self.task_name, self.executor.stops_layer.count, 0, values)
