"""SummarizeNearby tool implementation."""
# import from common package. noqa. pylint: disable=import-error
import os

import arcpy
import arcpy.management

from common import (PATool, PAFeatureLayer, PAErrorProcessor, ParameterUnpackMixin,
                    LogUtils, FSECPublisher, PALayerUtils, ToolExit, PAPrivileges,
                    AnalysisUtils, IntermCleanMixin, FieldUtils, ModelBuilderMixin,
                    COST_KEY, LogExecutionTime, PAEnvironment, AOLUtils)

from .stcommon import SummaryOutputHandler
from .snexecutor import SNExecutor


LOGGER = LogUtils.setup_logger(__name__)
TASK_NAME = "SummarizeNearby"
ERROR_CODES = [100004, 100005, 100006, 100024, 100018, 100019, 100042, 100030,
               100043, 100048, 100063, 100111, 100052, 100125, 100145]


class SNTool(ParameterUnpackMixin, ModelBuilderMixin, PATool, IntermCleanMixin):
    """Module provides execution logic for summarize nearby tool."""

    def get_parameters(self):
        """Overwrite the get_parameters abstractmethod."""
        self.interm_outputs = []
        near_type = self.get_param_as_text(2)
        LOGGER.debug(f"near_type: {near_type}")
        if near_type.lower() == "straight_line":
            near_type = "straightline"

        if "straightline" not in near_type.lower():
            if not self.check_privileges([PAPrivileges.NETWORK_ANALYSIS]):
                LOGGER.error(100111, extra={"message_ID": 100111})
                raise ToolExit
        if near_type and near_type.lower() != "straightline":
            naservice_input = True
            remote_server_ver = self.get_remote_server_version("asyncRoute")
        elif near_type and near_type.lower() == "straightline":
            naservice_input = False
            remote_server_ver = None
        else:
            naservice_input = False
            remote_server_ver = None

        nearby_layer = PAFeatureLayer(0, metadata={"parameterDataType": "Feature Set",
                                                   "parameterName": "sumNearbyLayer"},
                                      use_as_soap_input=naservice_input,
                                      remote_server_version=remote_server_ver)
        if nearby_layer.layer_name == "Feature Collection":
            nearby_layer.layer_name = "NearbyLayer"
        self.check_overwrite_sr(nearby_layer.spatialReference)  # type: ignore

        summary_layer = PAFeatureLayer(1, metadata={"parameterDataType": "Feature Set",
                                                    "parameterName": "summaryLayer"})
        if summary_layer.layer_name == "Feature Collection":
            summary_layer.layer_name = "nearby features"

        if "multipoint" in summary_layer.shapeType.lower():
            summary_layer: PAFeatureLayer = PALayerUtils.convert_multiparts_to_single(summary_layer,  # type: ignore
                                                                                      wrap_output_as_layer=True)
            self.interm_outputs.append(summary_layer.data)

        (dist_units, tz_for_tod, sum_units) = self.unpack([4, 6, 9], as_text=True)
        (dist, tod, return_bounds, sum_shape, summary_fields) = self.unpack([3, 5, 7, 8, 10],
                                                                            as_text=False)
        # always count and return number of points
        if "Point" in summary_layer.shapeType:
            sum_shape = True

        if sum_shape and not sum_units and "Point" not in summary_layer.shapeType:
            calc_as_pg = False if "Polyline" in summary_layer.shapeType else True
            if self.is_running_in(PAEnvironment.MODELBUILDER):
                sum_units = AnalysisUtils.get_units_in_mb(calc_as_pg)
            else:
                sum_units = AnalysisUtils.get_units(self.portal_description, calc_as_pg)

        groupby_field = self.get_param_as_text(11)
        if groupby_field:
            min_maj = arcpy.GetParameter(12)
            shape_percent = arcpy.GetParameter(13)
        else:
            min_maj = False
            shape_percent = False

        if min_maj or shape_percent:
            sum_shape = True
        
        self.calc_shp_area = True
        if self.version >= 2.0:
            self.calc_shp_area: bool = self.get_param(16)

        if self.is_running_in(PAEnvironment.MODELBUILDER):
            summarize_output = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(16))
            if groupby_field:
                groupby_table = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(17))
            else:
                groupby_table = None
        else:
            hw_wkspc = AnalysisUtils.get_hw_wkspc(self.output_name)
            summarize_output = AnalysisUtils.initialize_output_layer(nearby_layer.count * len(dist),
                                                                     "summarizedNearbyLayer",
                                                                     hw_wkspc=hw_wkspc)

            if groupby_field:
                groupby_table = AnalysisUtils.initialize_output_layer(nearby_layer.count * len(dist),
                                                                      "summaryNearbyTable",
                                                                      hw_wkspc=hw_wkspc)
            else:
                groupby_table = None
            
            self.cost_parameters = {"sumNearbyLayer": nearby_layer, "summaryLayer": summary_layer,
                                    "nearType": near_type, "distances": dist, "units": dist_units,
                                    "sumShape": sum_shape, "summaryFields": summary_fields,
                                    "groupByField": groupby_field, "percentShape": shape_percent}
        
        if sum_shape and not sum_units and summary_layer.shapeType != "Point":
            area_unit = True if summary_layer.shapeType == "Polygon" else False
            if self.is_running_in(PAEnvironment.MODELBUILDER):
                sum_units = AnalysisUtils.get_units_in_mb(area_unit)
            else:
                sum_units = AnalysisUtils.get_units(self.portal_description, area_unit)

        self.executor: SNExecutor = SNExecutor(summary_layer, nearby_layer, summarize_output,
                                               groupby_table, near_type, dist,
                                               dist_units, summary_fields, groupby_field,
                                               min_maj, shape_percent, sum_units, sum_shape,  # type: ignore
                                               return_bounds, True, tod, tz_for_tod)

    def set_visualization(self):
        """Overwrite the set_visualization abstractmethod."""
        # AnalysisArea calculation is done in drivetime tool already hence do it only for buffer
        if not self.is_running_in(PAEnvironment.MODELBUILDER):
            # set the nearType as straightline so the cost of logistics service is ignored
            self.cost_parameters["sumNearbyLayer"] = self.executor.summary_boundary_lyr
            if self.executor.remote_task_cost < 0:
                self.cost_parameters[COST_KEY] = self.executor.remote_task_cost
            self.cost_parameters["nearType"] = "straightline"
            LOGGER.debug(f"remote_task_cost: {self.executor.remote_task_cost}")
            self.cost_parameters[COST_KEY] = self.executor.remote_task_cost + self.estimate_cost()
            LOGGER.debug(f"cost: {self.cost_parameters[COST_KEY]}")

        if (
            self.executor.return_boundaries
            and self.executor.nearby_type.lower() == "straightline"
            and self.calc_shp_area
        ):
            with LogExecutionTime("Create ShapeArea Field:"):
                shp_units = self.executor.shp_stat_units if self.executor.shp_stat_units else ""
                FieldUtils.create_shape_area_field(self.executor.output_lyr,
                                                   shp_units)
        SummaryOutputHandler(self.executor.output_lyr, self.executor.groupby_stat_output,
                             self.executor.summary_lyr.layer_name, False,
                             self.executor.fields_info,
                             self.executor.summary_lyr.shapeType,
                             self.executor.groupby_field).handle()

    def publish_outputs(self):
        """Overwrite the publish_outputs abstractmethod."""
        with arcpy.EnvManager(extent=None):
            (res_idx, gbs_idx) = (16, 17) if self.version < 2.0 else (17, 18)
            publisher = FSECPublisher(self.output_name, tool_version=self.version)
            publisher.add_layer_to_publish(self.executor.output_lyr, res_idx, "resultLayer", layer_index=0)
            if self.executor.groupby_stat_output:
                publisher.add_layer_to_publish(self.executor.groupby_stat_output, gbs_idx,
                                               "GroupBySummary", layer_index=1)
            publisher.publish()

    def log_usage_metering(self):
        """Overwrite the log_usage_metering abstractmethod."""
        num_objects = self.executor.summary_boundary_lyr.count + self.executor.summary_lyr.count
        cost = num_objects * 0.02
        near_types = ["drivingdistance", "drivingtime", "straightline", "truckingdistance",
                      "truckingtime", "walkingdistance", "walkingtime"]
        if self.executor.nearby_type in near_types:
            near_type_cnt = near_types.index(self.executor.nearby_type)
        else:
            near_type_cnt = 7
        sum_shape_cnt = 1 if self.executor.sum_shape else 2
        group_field_cnt = 2 if self.executor.groupby_field else 1
        summary_fields_cnt = len(self.executor.summary_fields) if self.executor.summary_fields else 1
        shp_pct = 1 if self.executor.calc_percent_shape else 0
        values = [self.executor.summary_boundary_lyr.count, self.executor.summary_lyr.count,
                  near_type_cnt, sum_shape_cnt, summary_fields_cnt, group_field_cnt,
                  shp_pct, self.output_name.output_cost]
        LogUtils.log_usage(self.task_name, num_objects, cost, values)


def execute_tool(version: float):
    """Entry of the SummarizeNearby tool."""
    tool_initialized = False
    try:
        sn_tool = SNTool(TASK_NAME, output_name_index=14, context_index=15,
                         version=version)
        tool_initialized = True
        sn_tool.run()
    except Exception as err:  # noqa. pylint: disable=broad-except
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()
    finally:
        if tool_initialized:
            sn_tool.clean()  # type: ignore
