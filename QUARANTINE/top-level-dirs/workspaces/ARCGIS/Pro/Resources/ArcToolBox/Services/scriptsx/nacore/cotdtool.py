"""ConnectOriginsToDestinations tool implementation."""
# functions called implicitly in __init__. noqa. pylint: disable=attribute-defined-outside-init
# import internal modules. noqa. pylint: disable=import-error,no-name-in-module
import time
import json

import arcpy
from arcpy.da import UpdateCursor  # type: ignore

from common import (PATool, PAFeatureLayer, PAOutputFeatureLayer,
                    ToolExit, LogUtils, PAPrivileges,
                    FSECPublisher,
                    UniqueValueRenderer, SimpleRenderer,
                    RefundErrorProcessor,
                    ModelBuilderMixin,
                    COST_KEY,
                    ParameterUnpackMixin)
from .cotdexecutor import COTDExecutor
from .crldexecutor import CRLDExecutor
from .nautils import NAUtils


LOGGER = LogUtils.setup_logger(__name__)


class COTDErrorProcessor(RefundErrorProcessor):
    """Append errors from remote service for ConnectOriginsToDestinations."""

    def process_remote_service_error(self):
        """Process any error code reported by the remote service."""
        if isinstance(self.error, arcpy.ExecuteError):
            # Check if we need to handle any error codes reported from the remote service
            if self.error.args:
                exception_args = self.error.args[0]
                if (
                        (isinstance(exception_args, (list, dict)) and 30145 in exception_args)
                        or (isinstance(exception_args, str) and '30145' in exception_args)
                ):
                    # Walking limit exceeded
                    NAUtils.handle_walking_limit_error(self.tool.executor.tool_limits)  # type: ignore

                if (
                        (isinstance(exception_args, (list, dict)) and 30095 in exception_args)
                        or (isinstance(exception_args, str) and '30095' in exception_args)
                ):
                    remote_err = exception_args[30095] if isinstance(exception_args, dict) else exception_args
                    # Barrier limit exceeded
                    if NAUtils.raise_barrier_limit_error(remote_err):
                        return False

                # Handle generic "ERROR 030024: Solve returned a failure."
                if (
                    (isinstance(exception_args, (list, dict)) and 30024 in exception_args)
                    or (isinstance(exception_args, str) and '30024' in exception_args)
                ):
                    remote_err = exception_args[30024] if isinstance(exception_args, dict) else exception_args
                    NAUtils.handle_solver_com_errors(remote_err)  # type: ignore

    def process_gp_error(self):
        """Overwrite the process_gp_error function to add the additional process of remote service error."""
        if self.tool:
            self.process_remote_service_error()
        super().process_gp_error()


class COTDTool(ParameterUnpackMixin, ModelBuilderMixin, PATool):
    """Implementation of ConnectOriginsToDestinations tool."""

    def get_parameters(self):
        """Implement the abstractmethod of get_parameters."""
        # Tool signature matches the descriptions here:
        # https://developers.arcgis.com/rest/analysis/api-reference/connect-origins-to-destinations.htm
        LOGGER.debug("Retrieving parameters from tool dialog")
        (measurement_type, origins_route_id_field, destinations_route_id_field,
         time_zone_for_time_of_day, route_shape) = self.unpack([2, 3, 4, 6, 13],
                                                               as_text=True)
        (time_of_day, include_route_layers) = self.unpack([5, 9], as_text=False)
        if measurement_type.upper() == "STRAIGHTLINE":
            remote_server_ver = None
        else:
            remote_server_ver = self.get_remote_server_version("asyncRoute")
        input_origins_layer = PAFeatureLayer(
            0,
            metadata={"parameterDataType": "Feature Set", "parameterName": "originsLayer",
                      "defaultLayerName": "Origins Layer"},
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        input_destinations_layer = PAFeatureLayer(
            1,
            metadata={"parameterDataType": "Feature Set", "parameterName": "destinationsLayer",
                      "defaultLayerName": "Destinations Layer"},
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        self.time_of_day_values = time.mktime(time_of_day.timetuple()) * 1000 if time_of_day else None
        point_barrier_layer = PAFeatureLayer(
            10,
            metadata={"parameterDataType": "Feature Set",
                      "parameterName": "pointBarrierLayer",
                      "parameterType": "Optional"},
            verify_feature_count=False,
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        line_barrier_layer = PAFeatureLayer(
            11,
            metadata={"parameterDataType": "Feature Set",
                      "parameterName": "lineBarrierLayer",
                      "parameterType": "Optional"},
            verify_feature_count=False,
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        polygon_barrier_layer = PAFeatureLayer(
            12,
            metadata={"parameterDataType": "Feature Set",
                      "parameterName": "polygonBarrierLayer",
                      "parameterType": "Optional"},
            verify_feature_count=False,
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )

        # All outputs are created in the spatial reference of the origins layer.
        # Note: The output coordinate system is defined separately in the executor. Make sure any changes to this logic
        # are made in both places.
        if arcpy.env.outputCoordinateSystem:
            output_coordinate_system = arcpy.env.outputCoordinateSystem
            LOGGER.debug("arcpy.env.outputCoordinateSystem is specified and will be used for outputs.")
        else:
            output_coordinate_system = input_origins_layer.spatialReference
            LOGGER.debug("The spatial reference of the Input Origins Layer will be used for outputs.")
        self.check_overwrite_sr(output_coordinate_system)  # type: ignore

        # Check privileges for network analysis when relevant
        if measurement_type.upper() != "STRAIGHTLINE":
            # Check the NA privilege
            LOGGER.debug("Checking privileges")
            if not self.check_privileges([PAPrivileges.NETWORK_ANALYSIS]):
                LOGGER.error(100111, extra={"message_ID": 100111})
                raise ToolExit
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

        # check credits
        LOGGER.debug("Setting cost parameters")
        self.measurement_method_values = {
            "STRAIGHTLINE": 1,
            "DRIVINGDISTANCE": 2,
            "DRIVINGTIME": 3,
            "TRUCKINGDISTANCE": 4,
            "TRUCKINGTIME": 5,
            "WALKINGDISTANCE": 6,
            "WALKINGTIME": 7
        }
        measurement_type_ctg = measurement_type if measurement_type.upper() in \
            self.measurement_method_values else "CUSTOM"
        cost = 1 if measurement_type.upper() == "STRAIGHTLINE" else 0
        self.cost_parameters = {
            "originsLayer": {
                "count": input_origins_layer.count * cost,  # Prevent double billing when using travel modes
                "shapeType": input_origins_layer.shapeType
            },
            "destinationsLayer": {
                "count": input_destinations_layer.count * cost,  # Prevent double billing when using travel modes
                "shapeType": input_destinations_layer.shapeType
            },
            "measurementType": measurement_type_ctg,
            "originsLayerRouteIDField": origins_route_id_field,
            "destinationsLayerRouteIDField": destinations_route_id_field,
            "timeOfDay": self.time_of_day_values,
            "timeZoneForTimeOfDay": time_zone_for_time_of_day,
            "includeRouteLayers": include_route_layers,
            "routeShape": route_shape,
        }
        self.refund_param = None
        # replace in_memory with scratchGDB since the former does not
        # support TimestampOffset field type
        if (
            input_origins_layer.contains_field_type("TimestampOffset")
            or input_destinations_layer.contains_field_type("TimestampOffset")
        ):
            wkspc = arcpy.env.scratchGDB
        else:
            wkspc = "in_memory"

        LOGGER.debug("Initializing tool executor")
        self.executor: COTDExecutor = COTDExecutor(
            input_origins_layer,
            input_destinations_layer,
            measurement_type,
            origins_route_id_field,
            destinations_route_id_field,
            time_of_day,
            time_zone_for_time_of_day,
            include_route_layers,
            point_barrier_layer,
            line_barrier_layer,
            polygon_barrier_layer,
            route_shape,
            output_workspace=wkspc
        )

    def _set_symbology_and_popups_for_unassigned_points(
        self, output_layer: PAOutputFeatureLayer, output_layer_name: str
    ):
        """Set symbology and popups for output unassigned origins or destinations.

        Args:
            output_layer (PAOutputFeatureLayer): Output Unassigned Origins or Destinations layer to use
            output_layer_name (str): Name for the layer to use in the pop-up
        """
        # Set symbology
        drawing_info_unassigned_pts = SimpleRenderer(output_layer, self.task_name)
        drawing_info_json = drawing_info_unassigned_pts.get_drawing_json()
        fill_color = [255, 0, 0, 255]
        outline_color = [255, 255, 115, 255]
        drawing_info_json = drawing_info_unassigned_pts.update_fill_outline_color(
            drawing_info_json, fill_color, True, outline_color)
        output_layer.set_drawing(None, drawing_info_json)

        # Set pop-ups
        # Status should be the first field.
        layer_field_names = NAUtils.update_field_display_order(
            [f.name for f in output_layer.fields], [("Status", output_layer.oidFieldName)])
        output_layer.set_popup(
            None,
            f"Summary of {output_layer_name}",
            field_names_display_order=layer_field_names
        )

    def set_visualization(self):
        """Set the drawing/popup information of the outputs."""
        # Set the parameter for refund. It will be used implicitly by the error processor.
        # I don't really know why this stuff is in the set_visualization method, but here it is.
        if self.executor.measurement_type.upper() != "STRAIGHTLINE":
            self.cost_parameters[COST_KEY] = self.executor.task_cost
            LOGGER.debug("Setting refund parameters")
            self.refund_param = {"remoteJobID": self.executor.remote_job_id}
            if self.executor.task_cost >= 0:
                self.refund_param[COST_KEY] = self.executor.task_cost
            else:
                self.refund_param["outFeatureCount"] = self.executor.output_routes.count

        # Set symbology and pop-ups for Routes
        if self.executor.output_routes.count:
            LOGGER.debug("Setting symbology for output Routes")
            # For straight line route shape, use a unique color per group of OD pairs. For example, all destinations
            # assigned to a single store have one color.
            unique_value_field = "RouteName"
            if self.executor.route_shape.upper() == "STRAIGHTLINE":
                if self.executor.problem_type in ("OneToMany", "MultipleOneToMany"):
                    unique_value_field = "OriginOID"
                else:
                    unique_value_field = "DestinationOID"

            # Read the renderer definition from a template json file
            drawing_info_routes = UniqueValueRenderer(
                self.executor.output_routes,
                25,
                [unique_value_field],
                "cotd_routes_uniq_value_renderer_def.json",
                False,
                False
            ).get_drawing_json()
            # Set the symbology
            self.executor.output_routes.set_drawing(None, drawing_info_routes)

            # Set pop-ups
            # Total_Kilometers should be immediately after Total_Miles field in the display order
            routes_field_names = NAUtils.update_field_display_order(
                [f.name for f in self.executor.output_routes.fields], [("Total_Kilometers", "Total_Miles")])
            # Hide time-related fields
            if self.executor.time_of_day:
                hide_route_field_names = ["StartTime", "EndTime"]
            else:
                hide_route_field_names = ["StartTime", "EndTime", "StartTimeUTC", "EndTimeUTC"]
            # Hide route layer fields when desired
            if self.executor.include_route_layers:
                hide_route_field_names.append(self.executor.route_layer_item_id_field_name)
            else:
                if self.executor.route_layer_item_id_field_name in routes_field_names:
                    hide_route_field_names.append(self.executor.route_layer_item_id_field_name)
                if self.executor.route_layer_item_url_field_name in routes_field_names:
                    hide_route_field_names.append(self.executor.route_layer_item_url_field_name)
            self.executor.output_routes.set_popup(
                None, "Summary of {RouteName}",
                hide_fields=hide_route_field_names,
                field_names_display_order=routes_field_names
            )

        # Set symbology and pop-ups for Unassigned Origins
        if self.executor.output_unassigned_origins.count:
            LOGGER.debug("Setting symbology for output Unassigned Origins")
            self._set_symbology_and_popups_for_unassigned_points(
                self.executor.output_unassigned_origins,
                "Unassigned Origins"
            )

        # Set symbology and pop-ups for Unassigned Destinations
        if self.executor.output_unassigned_destinations.count:
            LOGGER.debug("Setting symbology for output Unassigned Destinations")
            self._set_symbology_and_popups_for_unassigned_points(
                self.executor.output_unassigned_destinations,
                "Unassigned Destinations"
            )

    def publish_outputs(self):
        """Publish the output as a feature service."""
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
                with UpdateCursor(  # pylint: disable=no-member
                    self.executor.output_routes.layer,
                    ("RouteName", self.executor.route_layer_item_id_field_name,
                        self.executor.route_layer_item_url_field_name)
                ) as cursor:
                    for row in cursor:
                        if row[0] in route_layer_item_ids:
                            row[1] = route_layer_item_ids[row[0]][0]  # routeName
                            row[2] = route_layer_item_ids[row[0]][1]  # url
                            cursor.updateRow(row)

            arcpy.SetParameterAsText(17, json.dumps(crld_executor.output_items))

        # Need to clear out extent before copying features to SDE so that we can always copy all features
        # Without this ConnectOriginsToDestinations may not copy all travel areas depending on the input map extent
        with arcpy.EnvManager(extent=None):
            publisher = FSECPublisher(self.output_name, tool_version=self.version)
            if self.executor.output_unassigned_origins.count:
                publisher.add_layer_to_publish(
                    self.executor.output_unassigned_origins, 15, "Unassigned Origins", layer_index=1)
            if self.executor.output_unassigned_destinations.count:
                publisher.add_layer_to_publish(
                    self.executor.output_unassigned_destinations, 16, "Unassigned Destinations", layer_index=2)
            if self.executor.output_routes.count:
                publisher.add_layer_to_publish(
                    self.executor.output_routes, 14, "Routes", layer_index=0)
            publisher.publish()

        if self.executor.include_route_layers:
            NAUtils.update_published_item(self.output_name)

    def log_usage_metering(self):
        """Log the usage of the tool."""
        values = [
            1,  # Origins layer is always point
            self.executor.origins_layer.count,
            1,  # Destinations layer is always point
            self.executor.destinations_layer.count,
            self.measurement_method_values.get(self.executor.measurement_type.upper(), 0),
            self.time_of_day_values,
            self.output_name.output_cost,  # output is feature collection or feature service
            int(self.executor.include_route_layers),  # Log if route layers are created.
        ]
        # Total origins and destinations processed.
        num_objects = self.executor.origins_layer.count + self.executor.destinations_layer.count
        # If not using straight line distance, cost is 0 as the billing happens at logistics.arcgis.com
        cost = 1 if self.executor.measurement_type.upper() == "STRAIGHTLINE" else 0
        # Cost is 0 as the billing happens at logistics.arcgis.com
        LogUtils.log_usage(self.task_name, num_objects, cost, values)
