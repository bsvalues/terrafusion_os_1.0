"""FindNearest tool implementation."""
# functions called implicitly in __init__. noqa. pylint: disable=attribute-defined-outside-init
# import internal modules. noqa. pylint: disable=import-error,no-name-in-module
import time
import json
import sys

import arcpy
from arcpy.da import UpdateCursor  # type: ignore

from common import (PATool, PAFeatureLayer,
                    ToolExit, LogUtils, PAPrivileges,
                    FSECPublisher, Renderer,
                    AnalysisUtils,
                    RefundErrorProcessor,
                    ModelBuilderMixin,
                    COST_KEY,
                    ParameterUnpackMixin)
from .fnexecutor import FNExecutor
from .crldexecutor import CRLDExecutor
from .nautils import NAUtils


LOGGER = LogUtils.setup_logger(__name__)


class FNErrorProcessor(RefundErrorProcessor):
    """Append errors from remote service for FindNearest."""

    def process_remote_service_error(self):
        """Process any error code reported by the remote service."""
        if isinstance(self.error, arcpy.ExecuteError):
            if self.error.args:
                remote_msgs = self.error.args[0]
                LOGGER.debug(f"{remote_msgs=} with type of {type(remote_msgs)}")
                if (
                        (isinstance(remote_msgs, (list, dict)) and 30145 in remote_msgs)
                        or (isinstance(remote_msgs, str) and '30145' in remote_msgs)
                ):
                    # Walking limit exceeded
                    NAUtils.handle_walking_limit_error(self.tool.executor.tool_limits)  # type: ignore
                if (
                        (isinstance(remote_msgs, (list, dict)) and 30212 in remote_msgs)
                        or (isinstance(remote_msgs, str) and '30212' in remote_msgs)
                ):
                    LOGGER.error(100259, extra={"message_ID": 100259})
                if (
                        (isinstance(remote_msgs, (list, dict)) and 30095 in remote_msgs)
                        or (isinstance(remote_msgs, str) and '30095' in remote_msgs)
                ):
                    # Barrier limit exceeded
                    remote_err = remote_msgs[30095] if isinstance(remote_msgs, dict) else remote_msgs
                    NAUtils.raise_barrier_limit_error(remote_err)

                # Handle generic "ERROR 030024: Solve returned a failure."
                if (
                    (isinstance(remote_msgs, (list, dict)) and 30024 in remote_msgs)
                    or (isinstance(remote_msgs, str) and '30024' in remote_msgs)
                ):
                    remote_err = remote_msgs[30024] if isinstance(remote_msgs, dict) else remote_msgs
                    NAUtils.handle_solver_com_errors(remote_err)  # type: ignore

    def process_gp_error(self):
        """Overwrite the process_gp_error function to add the additional process of remote service error."""
        if self.tool:
            self.process_remote_service_error()
        super().process_gp_error()


class FNTool(ParameterUnpackMixin, ModelBuilderMixin, PATool):
    """Implementation of FindNearest tool."""

    def get_parameters(self):
        """Implement the abstractmethod of get_parameters."""
        # Tool signature matches the descriptions here:
        # https://developers.arcgis.com/rest/analysis/api-reference/find-nearest.htm
        LOGGER.debug("Retrieving parameters from tool dialog")
        (measurement_method, str_max_count, str_search_cutoff, search_cutoff_units,
         time_zone_for_time_of_day) = self.unpack([2, 3, 4, 5, 7],
                                                  as_text=True)
        (time_of_day, include_route_layers) = self.unpack([6, 10], as_text=False)
        if measurement_method.upper() == "STRAIGHTLINE":
            measurement_method = "StraightLine"
        remote_server_ver = self.get_remote_server_version("asyncRoute") if measurement_method != "StraightLine" else None
        analysis_layer = PAFeatureLayer(
            0,
            metadata={"parameterDataType": "Feature Set", "parameterName": "analysisLayer",
                      "defaultLayerName": "Analysis Layer"},
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        near_layer = PAFeatureLayer(
            1,
            metadata={"parameterDataType": "Feature Set", "parameterName": "nearLayer",
                      "defaultLayerName": "Near Layer"},
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        # Read search_cutoff and max_count as a string so we can correctly handle the case when the user enters nothing.
        # For some reason GetParameter() will return 0.0 even if the parameter is empty, which is not what we want.
        max_count = NAUtils.str_to_float(str_max_count) if str_max_count else NAUtils.INFINITY
        search_cutoff = NAUtils.str_to_float(str_search_cutoff) if str_search_cutoff else NAUtils.INFINITY
        point_barrier_layer = PAFeatureLayer(
            11,
            metadata={"parameterDataType": "Feature Set",
                      "parameterName": "pointBarrierLayer",
                      "parameterType": "Optional"},
            verify_feature_count=False,
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        line_barrier_layer = PAFeatureLayer(
            12,
            metadata={"parameterDataType": "Feature Set",
                      "parameterName": "lineBarrierLayer",
                      "parameterType": "Optional"},
            verify_feature_count=False,
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        polygon_barrier_layer = PAFeatureLayer(
            13,
            metadata={"parameterDataType": "Feature Set",
                      "parameterName": "polygonBarrierLayer",
                      "parameterType": "Optional"},
            verify_feature_count=False,
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )

        # Set output coordinate system to the environment setting or the near locations layer SR
        # Note: The output coordinate system is defined separately in the executor. Make sure any changes to this logic
        # are made in both places.
        if arcpy.env.outputCoordinateSystem:  # type: ignore
            output_coordinate_system = arcpy.env.outputCoordinateSystem  # type: ignore
            LOGGER.debug("arcpy.env.outputCoordinateSystem is specified and will be used for outputs.")
        else:
            output_coordinate_system = near_layer.spatialReference
            LOGGER.debug("The spatial reference of the Near Layer will be used for outputs.")
        LOGGER.debug(f"Output spatial reference: {output_coordinate_system.name}")  # type: ignore
        self.check_overwrite_sr(output_coordinate_system)  # type: ignore

        # Check privileges for network analysis when relevant
        if measurement_method != "StraightLine":
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

        # update search cutoff units based on the user profile if search cutoff units are not specified
        if not search_cutoff_units:
            LOGGER.debug("Getting user preferred distance units")
            search_cutoff_units = AnalysisUtils.get_units(self.portal_description, False)

        # check credits
        self.measurement_method_values = {
            "STRAIGHTLINE": 1,
            "DRIVINGTIME": 2,
            "DRIVINGDISTANCE": 3,
            "TRUCKINGTIME": 4,
            "TRUCKINGDISTANCE": 5,
            "WALKINGTIME": 6,
            "WALKINGDISTANCE": 7,
        }
        LOGGER.debug("Setting cost parameters")
        measurement_type = measurement_method if measurement_method.upper() in \
            self.measurement_method_values else "CUSTOM"
        self.cost_parameters = {
            "analysisLayer": analysis_layer,
            "nearLayer": near_layer,
            "measurementType": measurement_type,
            "maxCount": max_count,
            "searchCutoff": search_cutoff,
            "searchCutoffUnits": search_cutoff_units,
            "timeOfDay": time_of_day,
            "includeRouteLayers": include_route_layers,
        }
        self.refund_param = None

        # replace in_memory with scratchGDB since the former does not
        # support TimestampOffset field type
        if (
            analysis_layer.contains_field_type("TimestampOffset")
            or near_layer.contains_field_type("TimestampOffset")
        ):
            wkspc = arcpy.env.scratchGDB
        else:
            wkspc = "in_memory"

        LOGGER.debug("Initializing tool executor")
        self.executor: FNExecutor = FNExecutor(
            analysis_layer,
            near_layer,
            measurement_method,
            max_count,
            search_cutoff,
            search_cutoff_units,
            time_of_day,
            time_zone_for_time_of_day,
            include_route_layers,
            point_barrier_layer,
            line_barrier_layer,
            polygon_barrier_layer,
            output_workspace=wkspc,
            portal_description=self.portal_description
        )

    def validate_tool_parameters(self) -> bool:
        """Check if feature count will be > 9,999 for feature collection output."""
        if not self.output_name.create_service:
            if self.executor.measurement_method != "StraightLine":
                if self.executor.max_count != sys.maxsize:
                    num_routes = min(self.executor.max_count,
                                     self.executor.near_layer.count) * self.executor.analysis_layer.count
                else:
                    num_routes = min(self.executor.near_layer.count, 100) * self.executor.analysis_layer.count
            else:
                num_routes = self.executor.near_layer.count + self.executor.analysis_layer.count
            if num_routes > 9999:
                LOGGER.error(100291, extra={"message_ID": 100291})
                return False
        return self.executor is not None

    def set_visualization(self):
        """Set the drawing/popup information of the output."""
        # Set the parameter for refund. It will be used implicitly by the error processor.
        # I don't really know why this stuff is in the set_visualization method, but here it is.
        LOGGER.debug("Setting refund parameters")
        # No remote service is called when using StraightLine
        if self.executor.measurement_method != "StraightLine":
            self.cost_parameters[COST_KEY] = self.executor.task_cost
            self.refund_param = {"remoteJobID": self.executor.remote_job_id}
            if self.executor.task_cost >= 0:
                self.refund_param[COST_KEY] = self.executor.task_cost
            else:
                self.refund_param["outFeatureCount"] = self.executor.output_connecting_lines.count

        # Set symbology for nearest features
        LOGGER.debug("Setting symbology for output near features")
        shape_type = self.executor.output_near_locations.shapeType.lower()
        if shape_type == "polyline":
            renderer = Renderer.get_drawing_from_json("fn_nearest_line_renderer.json")
        elif shape_type == "polygon":
            renderer = Renderer.get_drawing_from_json("fn_nearest_polygon_renderer.json")
        else:
            renderer = Renderer.get_drawing_from_json("fn_nearest_point_renderer.json")
        drawing_info = {"renderer": renderer}
        self.executor.output_near_locations.set_drawing(None, drawing_info)

        # Set symbology for connecting lines
        LOGGER.debug("Setting symbology for output connecting lines")
        drawing_info = {
            "renderer": Renderer.get_drawing_from_json("fn_connecting_line_renderer.json"),
            "transparency": 50
        }
        self.executor.output_connecting_lines.set_drawing(None, drawing_info)

        # Create Popup information

        # Set pop-ups for output near features
        LOGGER.debug("Setting pop-ups for output near features")
        # Hide ORIG_FID field if present
        nearest_layer_hide_fields = None
        nearest_layer_field_names = [fld.name for fld in self.executor.output_near_locations.fields]
        if "ORIG_FID" in nearest_layer_field_names:
            nearest_layer_hide_fields = ["ORIG_FID"]
        # Set pop-up
        self.executor.output_near_locations.set_popup(
            None,
            f"Summary of Nearest Features ({self.executor.travel_mode_name})",
            hide_fields=nearest_layer_hide_fields
        )

        # Set pop-ups for connecting lines
        LOGGER.debug("Setting pop-ups for output connecting lines")

        # Do a bunch of manipulation to change the field order:
        # - Make sure NearRank field is the first field.
        # - Move the To_ID field to be next to all other To_ fields
        # - Move the Total_Units fields to be one after another and after NearRank field
        conn_lines_field_names = []
        from_field_names = []
        total_field_names = []
        for fld in self.executor.output_connecting_lines.fields:
            conn_lines_field_names.append(fld.name)
            if fld.name.startswith("From_"):
                from_field_names.append(fld.name)
            elif fld.name.startswith("Total_"):
                total_field_names.append(fld.name)
        conn_lines_move_fields = [
            ("NearRank", self.executor.output_near_locations.oidFieldName),
            ("To_ID", from_field_names[-1])
        ]
        # Make sure the minimum Total_Units is before the total distance fields
        total_fields_after = "NearRank"
        if self.executor.measurement_method == "StraightLine":
            total_fields_after = "NearRank"
        elif self.executor.is_travel_mode_time_based:
            total_fields_after = "Total_Minutes"
            conn_lines_move_fields.append(("Total_Minutes", "NearRank"))
            total_field_names.remove("Total_Minutes")
        else:
            total_fields_after = "NearRank"
            conn_lines_move_fields.append(("From_ID", "Total_Minutes"))
            total_field_names.remove("Total_Minutes")
        for fld in total_field_names:
            conn_lines_move_fields.append((fld, total_fields_after))
        # Make sure the RouteLayerItemURL field is before the FromID field
        if self.executor.include_route_layers:
            conn_lines_move_fields.append(("From_ID", self.executor.route_layer_item_url_field_name))
        # Get the final display order
        conn_lines_field_names = NAUtils.update_field_display_order(conn_lines_field_names, conn_lines_move_fields)

        # Configure fields to hide in the pop-ups
        # Hide time-related fields
        if self.executor.time_of_day:
            conn_lines_hide_fields = ["StartTime", "EndTime"]
        else:
            conn_lines_hide_fields = ["StartTime", "EndTime", "StartTimeUTC", "EndTimeUTC"]
        # Hide the RouteLayerItemID and RouteLayerItemURL fields if present and if they have null values
        # If they have values, only hide RouteLayerItemID field
        if self.executor.include_route_layers:
            conn_lines_hide_fields.append(self.executor.route_layer_item_id_field_name)
        else:
            if self.executor.route_layer_item_id_field_name in conn_lines_field_names:
                conn_lines_hide_fields.append(self.executor.route_layer_item_id_field_name)
            if self.executor.route_layer_item_url_field_name in conn_lines_field_names:
                conn_lines_hide_fields.append(self.executor.route_layer_item_url_field_name)

        # Finally, at long last, set the pop-up
        self.executor.output_connecting_lines.set_popup(
            None,
            f"Summary of Connecting Lines ({self.executor.travel_mode_name})",
            field_names_display_order=conn_lines_field_names,
            hide_fields=conn_lines_hide_fields
        )

        # Update the labels for StartTimeUTC and EndTimeUTC fields to "Start Time" and "End Time"
        if self.executor.time_of_day:
            popup_dict = self.executor.output_connecting_lines.popup
            if popup_dict and isinstance(popup_dict, dict):
                new_field_infos = []
                for field_info in popup_dict.get("fieldInfos", []):
                    field_name = field_info.get("fieldName", "")
                    if field_name in ("StartTimeUTC", "EndTimeUTC"):
                        field_info["label"] = field_name.rstrip("UTC").replace("Time", " Time")
                    new_field_infos.append(field_info)
                if self.executor.output_connecting_lines and self.executor.output_connecting_lines.popup:
                    self.executor.output_connecting_lines.popup["fieldInfos"] = new_field_infos

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
                    self.executor.output_connecting_lines.layer,
                    ("RouteName", self.executor.route_layer_item_id_field_name,
                     self.executor.route_layer_item_url_field_name)
                ) as cursor:
                    for row in cursor:
                        if row[0] in route_layer_item_ids:
                            row[1] = route_layer_item_ids[row[0]][0]  # routeName
                            row[2] = route_layer_item_ids[row[0]][1]  # url
                            cursor.updateRow(row)

            arcpy.SetParameterAsText(13, json.dumps(crld_executor.output_items))

        # Need to clear out extent before copying features to SDE so that we can always copy all features
        # Without this ChooseBestFacilities may not copy all travel areas depending on the input map extent
        LOGGER.debug("Publishing results")
        with arcpy.EnvManager(extent=None):
            publisher = FSECPublisher(self.output_name, tool_version=self.version)
            publisher.add_layer_to_publish(
                self.executor.output_near_locations, 14, "Nearest Features", layer_index=0)
            publisher.add_layer_to_publish(
                self.executor.output_connecting_lines, 15, "Connecting Lines", layer_index=1)
            publisher.publish()

        # update the published item to include keyword
        if self.executor.include_route_layers:
            NAUtils.update_published_item(self.output_name)

    def log_usage_metering(self):
        """Log the usage of the tool."""
        # Define values for logging usage based on user inputs
        search_cutoff_units_values = {
            "Miles": 1,
            "Yards": 2,
            "Feet": 3,
            "Meters": 4,
            "Kilometers": 5,
            "NauticalMiles": 6
        }
        time_of_day_value = None
        if self.executor.time_of_day:
            time_of_day_value = time.mktime(self.executor.time_of_day.timetuple()) * 1000
        values = [
            AnalysisUtils.get_shape_type_code(self.executor.analysis_layer),
            self.executor.analysis_layer.count,
            AnalysisUtils.get_shape_type_code(self.executor.near_layer),
            self.executor.near_layer.count,
            self.measurement_method_values.get(self.executor.measurement_method.upper(), 0),
            self.executor.max_count,
            self.executor.search_cutoff,
            search_cutoff_units_values.get(self.executor.search_cutoff_units, 0),
            time_of_day_value,
            self.output_name.output_cost,  # output is feature collection or feature service
            int(self.executor.include_route_layers)
        ]
        # Total count of features in analysisLayer and nearLayer after extent filter is applied
        num_objects = self.executor.analysis_layer.count + self.executor.near_layer.count
        # cost_units is 0 if using driving time or driving distance as the metering is done on remote server
        cost_units = 0.001 if self.executor.measurement_method == "StraightLine" else 0
        LogUtils.log_usage(self.task_name, num_objects, cost_units, values)
