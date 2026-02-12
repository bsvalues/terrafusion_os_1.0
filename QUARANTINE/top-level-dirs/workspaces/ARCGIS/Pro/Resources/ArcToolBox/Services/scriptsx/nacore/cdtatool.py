"""CreateDriveTimeAreas tool implementation."""
# functions called implicitly in __init__. noqa. pylint: disable=attribute-defined-outside-init
# import internal modules. noqa. pylint: disable=import-error,no-name-in-module
import time

import arcpy

from common import (PATool, PAFeatureLayer,
                    ToolExit, LogUtils, PAPrivileges, PAEnvironment,
                    FSECPublisher, Renderer,
                    UniqueValueRenderer,
                    RefundErrorProcessor,
                    ModelBuilderMixin,
                    ParameterUnpackMixin,
                    COST_KEY)
from .cdtaexecutor import CDTAExecutor
from .nautils import NAUtils

TASK_NAME = "CreateDriveTimeAreas"
ERROR_CODES = [30096, 30097, 30109, 30120, 30122, 30123]

LOGGER = LogUtils.setup_logger(__name__)


class CDTAErrorProcessor(RefundErrorProcessor):
    """Append errors from remote service for CreateDriveTimeAreas."""

    INVALID_LOCATIONS_SOLVER_ERROR_MESSAGE = 'Insufficient number of valid locations in "Facilities".'
    MAX_SEARCH_TOLERANCE_KM = 20
    DIFFERENT_TIME_ZONE_ERROR_MESSAGE = (
        "The service area solver does not support facilities in different time zones "
        "when generating non-overlapping polygons, merged polygons or non-overlapping lines."
    )

    def process_remote_service_error(self):
        """Process any error code reported by the remote service."""
        if isinstance(self.error, arcpy.ExecuteError):
            # Check if we need to handle any error codes reported from the remote service
            if self.error.args:
                exception_args = self.error.args[0]
                if (
                        (isinstance(exception_args, (list, dict)) and 30137 in exception_args)
                        or (isinstance(exception_args, str) and '30137' in exception_args)
                ):
                    url = "http://www.arcgis.com/home/item.html?id=b7a893e8e1e04311bd925ea25cb8d7c7"
                    LOGGER.error(100100, extra={"message_ID": 100100,
                                                "inputLayer": self.tool.executor.input_layer.layer_name,  # type: ignore
                                                "url": url})
                if (
                        (isinstance(exception_args, (list, dict)) and 30146 in exception_args)
                        or (isinstance(exception_args, str) and '30146' in exception_args)
                ):
                    LOGGER.error(100117, extra={"message_ID": 100117})

                if (
                        (isinstance(exception_args, (list, dict)) and 30223 in exception_args)
                        or (isinstance(exception_args, str) and '30223' in exception_args)
                ):
                    # Message returned from the service look like this:
                    # ERROR 030223: The number of output service area lines, 1368055, exceeds the maximum threshold,
                    # 1000000, that can be returned from the service.
                    # Parse this to retrieve the number of features and the limit, and pass that to a message in this
                    # framework.
                    msg_parts = exception_args[30223][0].split(", ")
                    num_features = msg_parts[1]
                    limit = msg_parts[3]
                    LOGGER.error(100297, extra={"message_ID": 100297, "numFeatures": num_features, "threshold": limit})

                if (
                        (isinstance(exception_args, (list, dict)) and 30024 in exception_args)
                        or (isinstance(exception_args, str) and '30024' in exception_args)
                ):
                    # 30024 code is returned when solve returns a failure. Check for special solve failure case for
                    # which we have created ERROR_CODES.
                    # Check if we got 30024 due to invalid locations
                    solve_failed_messages = exception_args[30024]
                    if self.INVALID_LOCATIONS_SOLVER_ERROR_MESSAGE in solve_failed_messages:
                        msg_code = 100101
                        msg_params = {
                            "message_ID": msg_code,
                            "inputLayer": self.tool.executor.input_layer.layer_name,  # type: ignore
                            "max": self.MAX_SEARCH_TOLERANCE_KM
                        }
                        LOGGER.error(msg_code, extra=msg_params)
                    elif "\n".join(solve_failed_messages).find(self.DIFFERENT_TIME_ZONE_ERROR_MESSAGE) != -1:
                        msg_code = 100102
                        msg_params = {"message_ID": msg_code,
                                      "inputLayer": self.tool.executor.input_layer.layer_name}  # type: ignore
                        LOGGER.error(msg_code, extra=msg_params)
                    else:
                        # Log any other solver failed messages
                        LOGGER.debug(solve_failed_messages)

                if (
                        (isinstance(exception_args, (dict, list))  and 30150 in exception_args)
                        or (isinstance(exception_args, str) and '30150' in exception_args)
                ):
                    # 30150 is returned when there is a mismatch between travel mode and break units
                    LOGGER.error(100146, extra={"message_ID": 100146,
                                                "breakUnits": self.tool.executor.break_units,  # type: ignore
                                                "travelMode": arcpy.na.TravelMode(self.tool.executor.travel_mode).name})  # type: ignore

                if (
                        (isinstance(exception_args, (dict, list)) and 30095 in exception_args)
                        or (isinstance(exception_args, str) and '30095' in exception_args)
                ):
                    # Barrier limit exceeded
                    remote_err = exception_args[30095] if isinstance(exception_args, dict) else exception_args
                    NAUtils.raise_barrier_limit_error(remote_err)

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


class CDTATool(ParameterUnpackMixin, ModelBuilderMixin, PATool):
    """Implementation of CreateDriveTimeAreas tool."""

    def get_parameters(self):
        """Implement the abstractmethod of get_parameters."""
        remote_server_ver = self.get_remote_server_version("asyncRoute")
        input_layer = PAFeatureLayer(
            0,
            metadata={"parameterDataType": "Feature Set", "parameterName": "inputLayer",
                      "defaultLayerName": "Input Layer"},
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )

        # All outputs are created in the spatial reference of the input layer.
        # Note: The output coordinate system is defined separately in the executor. Make sure any changes to this logic
        # are made in both places.
        if arcpy.env.outputCoordinateSystem:
            output_coordinate_system = arcpy.env.outputCoordinateSystem
            LOGGER.debug("arcpy.env.outputCoordinateSystem is specified and will be used for outputs.")
        else:
            output_coordinate_system = input_layer.spatialReference
            LOGGER.debug("The spatial reference of the Input Layer will be used for outputs.")
        self.check_overwrite_sr(output_coordinate_system)  # type: ignore
        (break_values, time_of_day, show_holes, include_streets) = self.unpack([1, 5, 13, 14],
                                                                               as_text=False)
        (break_units, travel_mode, overlap_policy, time_zone_for_time_of_day,
         travel_direction) = self.unpack([2, 3, 4, 6, 12],
                                         as_text=True)

        # check the NA privilege
        if not self.check_privileges([PAPrivileges.NETWORK_ANALYSIS]):
            LOGGER.error(100111, extra={"message_ID": 100111})
            raise ToolExit

        point_barrier_layer = PAFeatureLayer(
            9,
            metadata={"parameterDataType": "Feature Set",
                      "parameterName": "pointBarrierLayer",
                      "parameterType": "Optional"},
            verify_feature_count=False,
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        line_barrier_layer = PAFeatureLayer(
            10,
            metadata={"parameterDataType": "Feature Set",
                      "parameterName": "lineBarrierLayer",
                      "parameterType": "Optional"},
            verify_feature_count=False,
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        polygon_barrier_layer = PAFeatureLayer(
            11,
            metadata={"parameterDataType": "Feature Set",
                      "parameterName": "polygonBarrierLayer",
                      "parameterType": "Optional"},
            verify_feature_count=False,
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )

        # check credits
        self.cost_parameters = {"inputLayer": input_layer,
                                "breakValues": break_values,
                                "breakUnits": break_units,
                                "travelMode": travel_mode,
                                "overlapPolicy": overlap_policy,
                                "timeOfDay": time_of_day,
                                "timeZoneForTimeOfDay": time_zone_for_time_of_day}
        self.refund_param = None
        # replace in_memory with scratchGDB since the former does not
        # support TimestampOffset field type
        if input_layer.contains_field_type("TimestampOffset"):
            wkspc = arcpy.env.scratchGDB
        else:
            wkspc = "in_memory"

        out_travel_areas_path = None
        out_travel_lines_path = None
        if self.is_running_in(PAEnvironment.MODELBUILDER):
            out_travel_areas_path = self.get_param_as_text(15)
            out_travel_lines_path = self.get_param_as_text(16)
        self.executor: CDTAExecutor = CDTAExecutor(
            input_layer,
            break_values,
            break_units,
            time_of_day,
            overlap_policy,
            time_zone_for_time_of_day,
            travel_mode,
            False,  # Filter by extent
            point_barrier_layer,
            line_barrier_layer,
            polygon_barrier_layer,
            wkspc,
            travel_direction,
            show_holes,
            include_streets,
            self.portal_description,
            out_travel_areas_path,
            out_travel_lines_path
        )

    def validate_tool_parameters(self) -> bool:
        """Check if feature count will be > 9,999 for feature collection output."""
        if self.executor is None:
            return False
        if self.executor.include_streets and not self.output_name.create_service:
            LOGGER.error(100312, extra={"message_ID": 100312})
            return False
        elif not self.output_name.create_service and self.executor.input_layer.count * len(self.executor.break_values) > 9999:
            LOGGER.error(100291, extra={"message_ID": 100291})
            return False
        return True

    def set_visualization(self):
        """Set the drawing/popup information of the output."""
        # set the parameter for refund. It will be used implicitly by the error processor.
        self.cost_parameters[COST_KEY] = self.executor.task_cost
        if self.executor.task_cost >= 0:
            self.refund_param = {
                "remoteJobID": self.executor.remote_job_id,
                COST_KEY: self.executor.task_cost
            }
        else:
            self.refund_param = {"inputLayer": self.executor.input_layer,
                                 "breakValues": self.executor.break_values,
                                 "breakUnits": self.executor.break_units,
                                 "travelMode": self.executor.travel_mode,
                                 "remoteJobID": self.executor.remote_job_id}

        polygon_transparency = 50

        # Create drawing info
        if len(self.executor.break_values) > 1:
            drawing_info = UniqueValueRenderer(self.executor.drive_time_areas_output,
                                               polygon_transparency,
                                               ["ToBreak"],
                                               "cdta_uniq_value_renderer_def.json",
                                               False, False).get_drawing_json()
            drawing_info["renderer"]["legendOptions"] = {"title": self.executor.break_units}
        else:
            drawing_info = {"renderer": Renderer.get_drawing_from_json("cdta_simple_polygon_renderer.json"),
                            "transparency": polygon_transparency}
            drawing_info["renderer"]["label"] = f"{self.executor.break_values[0]} {self.executor.break_units}"

        # Set polygon drawing info
        self.executor.drive_time_areas_output.set_drawing(None, drawing_info)

        # Create Popup information
        # AnalysisArea should be immediately after ToBreak field in the display order
        drive_time_area_field_names = [fld.name for fld in self.executor.drive_time_areas_output.fields]
        drive_time_area_field_names = NAUtils.update_field_display_order(drive_time_area_field_names,
                                                                         [("AnalysisArea", "ToBreak")])
        popup_title = "{} Areas Summary".format(self.executor.travel_mode_name.title())
        self.executor.drive_time_areas_output.set_popup(None, popup_title,
                                                        field_names_display_order=drive_time_area_field_names)

        # Setup the drawing for service_area_lines_output
        if self.executor.include_streets:
            line_transparency = 0
            if len(self.executor.break_values) > 1:
                renderer_def = Renderer.get_drawing_from_json("cdta_class_break_renderer_def.json")
                renderer_def["breakCount"] = len(self.executor.break_values)
                renderer_def["classificationField"] = f"FromCumul_{self.executor.break_units}"
                salines_drawing = Renderer.get_drawing_from_renderer(self.executor.service_area_lines_output,
                                                                     renderer_def,
                                                                     False, line_transparency, True)
                salines_renderer = salines_drawing["renderer"]
                salines_renderer["minValue"] = 0
                salines_renderer["classificationMethod"] = "esriClassifyManual"
                salines_renderer["authoringInfo"]["classificationMethod"] = "esriClassifyManual"
                salines_renderer["legendOptions"]["title"] = self.executor.break_units
                for index, class_break in enumerate(salines_renderer["classBreakInfos"]):
                    to_break_value = self.executor.break_values[index]
                    from_break_value = self.executor.break_values[index - 1] if index else 0
                    class_break["classMaxValue"] = to_break_value
                    class_break["label"] = f"{from_break_value} - {to_break_value}"
            else:
                simple_line_renderer = Renderer.get_drawing_from_json("cdta_simple_line_renderer.json")
                simple_line_renderer["label"] = f"{self.executor.break_values[0]} {self.executor.break_units}"
                salines_drawing = {
                    "renderer": simple_line_renderer,
                    "transparency": line_transparency,
                }
            self.executor.service_area_lines_output.set_drawing(None, salines_drawing)
            popup_title_salines = "{} Reachable Streets Summary".format(self.executor.travel_mode_name.title())
            self.executor.service_area_lines_output.set_popup(None, popup_title_salines)

    def publish_outputs(self):
        """Publish the drive_time_areas_output as a feature service."""
        # Need to clear out extent before copying features to SDE so that we can always copy all features
        # Without this CreateDriveTimeAreas may not copy all travel areas depending on the input map extent
        with arcpy.EnvManager(extent=None):
            publisher = FSECPublisher(self.output_name, tool_version=self.version)
            publisher.add_layer_to_publish(self.executor.drive_time_areas_output, 15, "travelareas", layer_index=0)
            if self.executor.include_streets:
                publisher.add_layer_to_publish(
                    self.executor.service_area_lines_output, 16, "Reachable Streets", layer_index=1
                )
            publisher.publish()

    def log_usage_metering(self):
        """Log the usage of the tool."""
        # report metering info
        overlap_policy_values = {
            "Overlap": 1,
            "Dissolve": 2,
            "Split": 3
        }
        break_units_values = {
            "Minutes": 1,
            "Seconds": 2,
            "Hours": 3,
            "Miles": 4,
            "Kilometers": 5,
            "Meters": 6,
            "Feet": 7,
            "Yards": 8
        }
        time_of_day_value = time.mktime(self.executor.time_of_day.timetuple()) * 1000 if self.executor.time_of_day else None
        values = [
            1,                          # input is always point
            self.executor.input_layer.count,          # num objects is total input points processed.
            len(self.executor.break_values),          # number of breaks
            break_units_values.get(self.executor.break_units, 0),  # units for breaks
            NAUtils.get_travel_mode_type_as_int(self.executor.travel_mode),  # travel mode
            overlap_policy_values.get(self.executor.overlap_policy, 0),  # overlap policy
            time_of_day_value,
            NAUtils.TIME_ZONE_VALUES.get(self.executor.time_zone_for_time_of_day, 0),
            self.output_name.output_cost,  # output is feature collection or feature service
        ]
        LogUtils.log_usage(self.task_name, self.executor.input_layer.count, 0, values)


def execute_tool(version: float):
    """Entry of CreateDriveTimeAreas tool."""
    tool = None
    try:
        tool = CDTATool(TASK_NAME, output_name_index=7, context_index=8, version=version)
        tool.run()
    except Exception as err:
        CDTAErrorProcessor(TASK_NAME, ERROR_CODES, err, None, tool).process()
